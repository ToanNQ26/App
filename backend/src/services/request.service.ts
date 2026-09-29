import mongoose from "mongoose";
import { ApprovalAction, FinancialRequest } from "../models/index.js";
import { assert } from "../exceptions/index.js";
import type { AuthUser } from "../types/index.js";
import {
  autoApprovalEligible,
  manualApprovalLevel,
} from "./approval-routing.service.js";

export interface ItemInput {
  itemType: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  supplier?: string;
}
export interface RequestInput {
  type: "ADVANCE" | "PAYMENT";
  purpose: string;
  items: ItemInput[];
}
const normalizedItems = (items: ItemInput[]) => {
  assert(
    Array.isArray(items) && items.length > 0,
    400,
    "VALIDATION_ERROR",
    "Cần ít nhất một khoản mục",
  );
  return items.map((i) => {
    assert(
      Number.isInteger(i.quantity) &&
        i.quantity > 0 &&
        Number.isInteger(i.unitPrice) &&
        i.unitPrice >= 0,
      400,
      "INVALID_AMOUNT",
      "Số lượng và đơn giá phải là số nguyên hợp lệ",
    );
    return { ...i, amount: i.quantity * i.unitPrice };
  });
};
const code = () =>
  `DX-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const audit = (
  requestId: unknown,
  actorId: string,
  action: string,
  fromStatus: string,
  toStatus: string,
  comment?: string,
) =>
  ApprovalAction.create({
    requestId,
    actorId,
    action,
    fromStatus,
    toStatus,
    comment,
  });
export async function createRequest(actor: AuthUser, input: RequestInput) {
  assert(
    actor.role === "REQUESTER" ||
      actor.role === "DEPARTMENT_HEAD" ||
      actor.role === "DIRECTOR",
    403,
    "FORBIDDEN",
    "Vai trò không được tạo đề xuất",
  );
  const items = normalizedItems(input.items);
  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const doc = await FinancialRequest.create({
    requestCode: code(),
    requesterId: actor.id,
    departmentId: actor.departmentId,
    type: input.type,
    purpose: input.purpose,
    items,
    totalAmount,
    status: "DRAFT",
  });
  await audit(doc._id, actor.id, "CREATE", "DRAFT", "DRAFT");
  return doc;
}
export async function updateDraft(
  actor: AuthUser,
  id: string,
  input: RequestInput,
) {
  const items = normalizedItems(input.items);
  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const doc = await FinancialRequest.findOneAndUpdate(
    { _id: id, requesterId: actor.id, status: "DRAFT" },
    {
      $set: { type: input.type, purpose: input.purpose, items, totalAmount },
      $inc: { version: 1 },
    },
    { new: true },
  );
  assert(
    doc,
    409,
    "INVALID_REQUEST_STATUS",
    "Chỉ chủ sở hữu được sửa bản nháp",
  );
  await audit(doc._id, actor.id, "UPDATE_DRAFT", "DRAFT", "DRAFT");
  return doc;
}
export async function submitRequest(actor: AuthUser, id: string) {
  const draft = await FinancialRequest.findOne({
    _id: id,
    requesterId: actor.id,
    status: "DRAFT",
  });
  assert(
    draft,
    409,
    "INVALID_REQUEST_STATUS",
    "Đề xuất không còn ở trạng thái nháp",
  );
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const monthly = await FinancialRequest.aggregate([
    {
      $match: {
        requesterId: new mongoose.Types.ObjectId(actor.id),
        approvalLevel: "AUTO",
        submittedAt: { $gte: start },
      },
    },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const isAuto = autoApprovalEligible(
    actor.role,
    draft.totalAmount,
    monthly[0]?.total || 0,
  );
  const now = new Date();
  const nextStatus = isAuto ? "WAITING_PAYMENT_DOCUMENTS" : "PENDING_APPROVAL";
  const approvalLevel = isAuto
    ? "AUTO"
    : manualApprovalLevel(draft.totalAmount);
  const doc = await FinancialRequest.findOneAndUpdate(
    { _id: id, status: "DRAFT" },
    {
      $set: {
        status: nextStatus,
        approvalLevel,
        submittedAt: now,
        ...(isAuto ? { approvedAt: now } : {}),
      },
      $inc: { version: 1 },
    },
    { new: true },
  );
  assert(doc, 409, "INVALID_REQUEST_STATUS", "Đề xuất đã được xử lý");
  await audit(id, actor.id, "SUBMIT", "DRAFT", nextStatus);
  if (isAuto)
    await audit(
      id,
      actor.id,
      "AUTO_APPROVE",
      "DRAFT",
      nextStatus,
      "Tự duyệt trong hạn mức tháng",
    );
  return doc;
}
