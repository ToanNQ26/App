import {
  ApprovalAction,
  Disbursement,
  FinancialRequest,
  RequestBookmark,
  User,
} from "../models/index.js";
import ExcelJS from "exceljs";
import { assert } from "../exceptions/index.js";
import type { AuthUser } from "../types/index.js";

async function accessScope(actor: AuthUser) {
  if (actor.role === "REQUESTER") return { requesterId: actor.id };
  if (actor.role === "DEPARTMENT_HEAD") {
    const employees = actor.departmentId
      ? await User.find({
          role: "REQUESTER",
          departmentId: actor.departmentId,
        }).distinct("_id")
      : [];
    return {
      requesterId: { $in: [actor.id, ...employees] },
    };
  }
  if (actor.role === "DIRECTOR") {
    const lowerLevelUsers = await User.find({
      role: { $in: ["REQUESTER", "DEPARTMENT_HEAD"] },
    }).distinct("_id");
    return { requesterId: { $in: [actor.id, ...lowerLevelUsers] } };
  }
  if (actor.role === "CHAIRMAN")
    return {
      approvalLevel: {
        $in: ["AUTO", "DEPARTMENT_HEAD", "DIRECTOR", "CHAIRMAN"],
      },
    };
  if (actor.role === "ACCOUNTANT")
    return { paymentStatus: { $exists: true } };
  return {};
}

export async function ensureViewAccess(actor: AuthUser, id: string) {
  const scope = await accessScope(actor);
  const document = await FinancialRequest.findOne({
    _id: id,
    ...scope,
  }).select("_id");
  assert(
    document,
    404,
    "REQUEST_NOT_FOUND",
    "Không tìm thấy đề xuất hoặc bạn không có quyền xem",
  );
}

export async function listRequests(
  actor: AuthUser,
  query: Record<string, unknown>,
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 20);
  const conditions: Record<string, unknown>[] = [];
  const scope = await accessScope(actor);
  if (Object.keys(scope).length) conditions.push(scope);
  for (const key of ["status", "type", "paymentStatus", "departmentId"])
    if (query[key]) conditions.push({ [key]: query[key] });
  const filter: Record<string, unknown> = conditions.length
    ? { $and: conditions }
    : {};
  const [data, total] = await Promise.all([
    FinancialRequest.find(filter)
      .populate("requesterId", "name email role")
      .populate("departmentId", "name code")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FinancialRequest.countDocuments(filter),
  ]);
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getRequest(actor: AuthUser, id: string) {
  const scope = await accessScope(actor);
  const document = await FinancialRequest.findOne({
    _id: id,
    ...scope,
  })
    .populate("requesterId", "name email role")
    .populate("departmentId", "name code");
  assert(document, 404, "REQUEST_NOT_FOUND", "Không tìm thấy đề xuất");
  return document;
}

export async function exportRequestExcel(actor: AuthUser, id: string) {
  await ensureViewAccess(actor, id);
  const request = await FinancialRequest.findById(id)
    .populate("requesterId", "name")
    .populate("departmentId", "name");
  assert(request, 404, "REQUEST_NOT_FOUND", "Không tìm thấy đề xuất");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FinFlow";
  const sheet = workbook.addWorksheet("Đề xuất");
  sheet.columns = [{ width: 8 }, { width: 42 }, { width: 16 }, { width: 20 }, { width: 22 }];
  sheet.mergeCells("A1:E1");
  sheet.getCell("A1").value = "CHI TIẾT ĐỀ XUẤT";
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").alignment = { horizontal: "center" };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF195C42" } };
  sheet.addRow(["Mã đề xuất", request.requestCode]);
  sheet.mergeCells("B2:E2");
  sheet.addRow(["Người đề xuất", (request.requesterId as any)?.name || ""]);
  sheet.mergeCells("B3:E3");
  sheet.addRow(["Phòng ban", (request.departmentId as any)?.name || ""]);
  sheet.mergeCells("B4:E4");
  sheet.addRow(["Nội dung", request.purpose]);
  sheet.mergeCells("B5:E5");
  sheet.addRow(["Ngày tạo", request.createdAt]);
  sheet.addRow(["Tổng đề xuất", request.totalAmount]);
  const header = sheet.addRow(["STT", "Khoản mục / thiết bị", "Số lượng", "Đơn giá", "Thành tiền"]);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF195C42" } };
  request.items.forEach((item, index) => {
    sheet.addRow([
      index + 1,
      `${item.name}${item.itemType ? ` (${item.itemType})` : ""}`,
      item.quantity,
      item.unitPrice,
      item.amount ?? item.quantity * item.unitPrice,
    ]);
  });
  for (let rowNumber = 2; rowNumber <= 7; rowNumber++)
    sheet.getCell(`A${rowNumber}`).font = { bold: true };
  sheet.getCell("B7").numFmt = "#,##0";
  sheet.getColumn(4).numFmt = "#,##0";
  sheet.getColumn(5).numFmt = "#,##0";
  sheet.getCell("B6").numFmt = "dd/mm/yyyy";
  sheet.views = [{ state: "normal", showGridLines: true }];
  sheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printArea: `A1:E${sheet.rowCount}`,
  };
  for (let column = 6; column <= 16_384; column++)
    sheet.getColumn(column).hidden = true;
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++)
    for (let column = 1; column <= 5; column++)
      sheet.getCell(rowNumber, column).border = {
        top: { style: "thin", color: { argb: "FFD9E1DC" } },
        left: { style: "thin", color: { argb: "FFD9E1DC" } },
        bottom: { style: "thin", color: { argb: "FFD9E1DC" } },
        right: { style: "thin", color: { argb: "FFD9E1DC" } },
      };
  return {
    filename: `de-xuat-${request.requestCode}.xlsx`,
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  };
}

export async function listBookmarkedRequests(actor: AuthUser) {
  const requestIds = await RequestBookmark.find({ userId: actor.id }).distinct("requestId");
  const scope = await accessScope(actor);
  return FinancialRequest.find({ _id: { $in: requestIds }, ...scope })
    .populate("requesterId", "name email role")
    .populate("departmentId", "name code")
    .sort({ updatedAt: -1 });
}

export async function bookmarkRequest(actor: AuthUser, id: string) {
  await ensureViewAccess(actor, id);
  await RequestBookmark.findOneAndUpdate(
    { userId: actor.id, requestId: id },
    { $setOnInsert: { userId: actor.id, requestId: id } },
    { upsert: true, new: true },
  );
  return { requestId: id, tracked: true };
}

export async function unbookmarkRequest(actor: AuthUser, id: string) {
  await ensureViewAccess(actor, id);
  await RequestBookmark.deleteOne({ userId: actor.id, requestId: id });
  return { requestId: id, tracked: false };
}

export async function getPendingApprovals(actor: AuthUser) {
  const levels: Record<string, string[]> = {
    DEPARTMENT_HEAD: ["DEPARTMENT_HEAD"],
    DIRECTOR: ["DEPARTMENT_HEAD", "DIRECTOR"],
    CHAIRMAN: ["DEPARTMENT_HEAD", "DIRECTOR", "CHAIRMAN"],
  };
  const filter: Record<string, unknown> = {
    status: "PENDING_APPROVAL",
    approvalLevel: { $in: levels[actor.role] || [] },
  };
  if (actor.role === "DEPARTMENT_HEAD")
    filter.departmentId = actor.departmentId;
  return FinancialRequest.find(filter)
    .populate("requesterId", "name role")
    .sort({ createdAt: 1 });
}

export async function getHistory(actor: AuthUser, id: string) {
  await ensureViewAccess(actor, id);
  return ApprovalAction.find({ requestId: id })
    .populate("actorId", "name role")
    .sort({ createdAt: 1 });
}

export async function getDisbursements(actor: AuthUser, id: string) {
  await ensureViewAccess(actor, id);
  return Disbursement.find({ requestId: id })
    .populate("accountantId", "name")
    .sort({ createdAt: 1 });
}
