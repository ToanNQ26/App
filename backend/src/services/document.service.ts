import type { Express } from "express";
import path from "node:path";
import { env } from "../config/index.js";
import { assert } from "../exceptions/index.js";
import { FinancialRequest, PaymentDocument } from "../models/index.js";
import type { AuthUser } from "../types/index.js";
import { ensureViewAccess } from "./query.service.js";

export async function assertCanUploadDocument(
  actor: AuthUser,
  requestId: string,
) {
  const request = await FinancialRequest.findOne({
    _id: requestId,
    requesterId: actor.id,
    status: "WAITING_PAYMENT_DOCUMENTS",
    paymentStatus: { $in: [null, "NEED_SUPPLEMENT"] },
  });
  assert(request, 403, "FORBIDDEN", "KhÃ´ng thá»ƒ táº£i chá»©ng tá»« cho há»“ sÆ¡ nÃ y");
}

export async function uploadDocument(
  actor: AuthUser,
  requestId: string,
  file: Express.Multer.File | undefined,
  documentType?: string,
) {
  assert(file, 400, "INVALID_DOCUMENT", "File không hợp lệ");
  const request = await FinancialRequest.findOne({
    _id: requestId,
    requesterId: actor.id,
    status: "WAITING_PAYMENT_DOCUMENTS",
    paymentStatus: { $in: [null, "NEED_SUPPLEMENT"] },
  });
  assert(request, 403, "FORBIDDEN", "Không thể tải chứng từ cho hồ sơ này");
  return PaymentDocument.create({
    requestId: request._id,
    documentType: documentType || "OTHER",
    originalName: file.originalname,
    fileUrl: `/uploads/${file.filename}`,
    storageKey: file.filename,
    mimeType: file.mimetype,
    fileSize: file.size,
    uploadedBy: actor.id,
  });
}

export async function listDocuments(actor: AuthUser, requestId: string) {
  await ensureViewAccess(actor, requestId);
  return PaymentDocument.find({ requestId })
    .populate("uploadedBy", "name")
    .sort({ uploadedAt: 1 });
}

export async function getDocumentFile(
  actor: AuthUser,
  requestId: string,
  documentId: string,
) {
  await ensureViewAccess(actor, requestId);
  const document = await PaymentDocument.findOne({
    _id: documentId,
    requestId,
  });
  assert(document, 404, "DOCUMENT_NOT_FOUND", "KhÃ´ng tÃ¬m tháº¥y tá»‡p há»“ sÆ¡");
  const uploadRoot = path.resolve(env.uploadDir);
  const filePath = path.resolve(uploadRoot, document.storageKey || "");
  assert(
    filePath.startsWith(`${uploadRoot}${path.sep}`),
    400,
    "INVALID_DOCUMENT_PATH",
    "ÄÆ°á»ng dáº«n tá»‡p khÃ´ng há»£p lá»‡",
  );
  return { document, filePath };
}
