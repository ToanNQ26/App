import {
  ApprovalAction,
  Disbursement,
  FinancialRequest,
  User,
} from "../models/index.js";
import ExcelJS from "exceljs";
import { assert } from "../exceptions/index.js";
import type { AuthUser } from "../types/index.js";
import {
  AUTO_AMOUNT_LIMIT,
  DIRECTOR_AMOUNT_LIMIT,
  roleCanApprove,
} from "./approval-routing.service.js";
const audit = (
  id: string,
  a: AuthUser,
  action: string,
  from: string,
  to: string,
  comment?: string,
) =>
  ApprovalAction.create({
    requestId: id,
    actorId: a.id,
    action,
    fromStatus: from,
    toStatus: to,
    comment,
  });
export async function decideRequest(
  a: AuthUser,
  id: string,
  approve: boolean,
  comment?: string,
) {
  if (!approve)
    assert(
      comment?.trim(),
      400,
      "REJECTION_REASON_REQUIRED",
      "Từ chối bắt buộc có lý do",
    );
  const current = await FinancialRequest.findById(id);
  assert(current, 404, "REQUEST_NOT_FOUND", "Không tìm thấy đề xuất");
  assert(
    current.status === "PENDING_APPROVAL",
    409,
    "INVALID_REQUEST_STATUS",
    "Đề xuất không chờ duyệt",
  );
  assert(
    current.approvalLevel && roleCanApprove(a.role, current.approvalLevel),
    403,
    "APPROVAL_NOT_ALLOWED",
    "Bạn không có quyền duyệt đề xuất này",
  );
  if (a.role === "DEPARTMENT_HEAD")
    assert(
      current.totalAmount <= AUTO_AMOUNT_LIMIT,
      403,
      "APPROVAL_AMOUNT_LIMIT_EXCEEDED",
      "Trưởng bộ phận chỉ được duyệt đề xuất tối đa 1.000.000 ₫",
    );
  if (a.role === "DIRECTOR")
    assert(
      current.totalAmount <= DIRECTOR_AMOUNT_LIMIT,
      403,
      "APPROVAL_AMOUNT_LIMIT_EXCEEDED",
      "Giám đốc chỉ được duyệt đề xuất tối đa 50.000.000 ₫",
    );
  if (a.role === "DEPARTMENT_HEAD")
    assert(
      String(current.departmentId) === a.departmentId,
      403,
      "FORBIDDEN",
      "Ngoài phạm vi phòng ban",
    );
  const to = approve ? "WAITING_PAYMENT_DOCUMENTS" : "REJECTED";
  const doc = await FinancialRequest.findOneAndUpdate(
    { _id: id, status: "PENDING_APPROVAL" },
    {
      $set: {
        status: to,
        ...(approve ? { approvedAt: new Date() } : { rejectedAt: new Date() }),
      },
      $inc: { version: 1 },
    },
    { new: true },
  );
  assert(doc, 409, "INVALID_REQUEST_STATUS", "Đề xuất đã được xử lý");
  await audit(
    id,
    a,
    approve ? "APPROVE" : "REJECT",
    "PENDING_APPROVAL",
    to,
    comment,
  );
  return doc;
}
export async function submitDocuments(
  a: AuthUser,
  id: string,
  input: { bankAccountNumber?: unknown; bankName?: unknown } = {},
) {
  const user = await User.findById(a.id).select("bankAccountNumber bankName");
  assert(user, 404, "USER_NOT_FOUND", "Không tìm thấy người tạo đề xuất");
  const hasRequestBankDetails =
    input.bankAccountNumber !== undefined || input.bankName !== undefined;
  const bankAccountNumber = String(
    hasRequestBankDetails ? input.bankAccountNumber || "" : user.bankAccountNumber || "",
  ).trim();
  const bankName = String(
    hasRequestBankDetails ? input.bankName || "" : user.bankName || "",
  ).trim();
  assert(
    bankAccountNumber.length >= 4 && bankAccountNumber.length <= 34,
    400,
    "BANK_ACCOUNT_REQUIRED",
    "Cần nhập hoặc lưu số tài khoản ngân hàng hợp lệ trước khi nộp hồ sơ",
  );
  assert(
    bankName.length >= 2 && bankName.length <= 100,
    400,
    "BANK_NAME_REQUIRED",
    "Cần nhập tên ngân hàng hợp lệ trước khi nộp hồ sơ",
  );
  const doc = await FinancialRequest.findOneAndUpdate(
    {
      _id: id,
      requesterId: a.id,
      status: "WAITING_PAYMENT_DOCUMENTS",
      paymentStatus: { $in: [null, "NEED_SUPPLEMENT"] },
    },
    {
      $set: {
        paymentStatus: "PENDING_ACCOUNTANT_CHECK",
        bankAccountNumber,
        bankName,
      },
    },
    { new: true },
  );
  assert(doc, 409, "INVALID_PAYMENT_STATUS", "Không thể nộp hồ sơ lúc này");
  await audit(
    id,
    a,
    "SUBMIT_DOCUMENTS",
    doc.status,
    "PENDING_ACCOUNTANT_CHECK",
  );
  return doc;
}
export async function accountantCheck(
  a: AuthUser,
  id: string,
  result: "VALID" | "NEED_SUPPLEMENT",
  comment?: string,
) {
  assert(
    a.role === "ACCOUNTANT",
    403,
    "FORBIDDEN",
    "Chỉ kế toán được kiểm tra",
  );
  if (result === "NEED_SUPPLEMENT")
    assert(
      comment?.trim(),
      400,
      "VALIDATION_ERROR",
      "Cần ghi rõ nội dung bổ sung",
    );
  const to =
    result === "VALID"
      ? "PENDING_CHAIRMAN_PAYMENT_APPROVAL"
      : "NEED_SUPPLEMENT";
  const doc = await FinancialRequest.findOneAndUpdate(
    { _id: id, paymentStatus: "PENDING_ACCOUNTANT_CHECK" },
    { $set: { paymentStatus: to } },
    { new: true },
  );
  assert(
    doc,
    409,
    "INVALID_PAYMENT_STATUS",
    "Hồ sơ không chờ kế toán kiểm tra",
  );
  await audit(
    id,
    a,
    result === "VALID" ? "ACCOUNTANT_ACCEPT" : "REQUEST_SUPPLEMENT",
    "PENDING_ACCOUNTANT_CHECK",
    to,
    comment,
  );
  return doc;
}
export async function chairmanDecision(
  a: AuthUser,
  id: string,
  approve: boolean,
  comment?: string,
) {
  assert(
    a.role === "CHAIRMAN",
    403,
    "FORBIDDEN",
    "Chỉ Chủ tịch được duyệt chi",
  );
  const to = approve ? "PENDING_CHAIRMAN_PAYMENT_APPROVAL" : "PAYMENT_REJECTED";
  const doc = await FinancialRequest.findOneAndUpdate(
    {
      _id: id,
      paymentStatus: "PENDING_CHAIRMAN_PAYMENT_APPROVAL",
      chairmanPaymentApprovedAt: { $exists: false },
    },
    {
      $set: {
        paymentStatus: to,
        ...(approve ? { chairmanPaymentApprovedAt: new Date() } : {}),
      },
    },
    { new: true },
  );
  assert(
    doc,
    409,
    "INVALID_PAYMENT_STATUS",
    "Hồ sơ không chờ Chủ tịch hoặc đã được xử lý",
  );
  await audit(
    id,
    a,
    approve ? "CHAIRMAN_APPROVE" : "CHAIRMAN_REJECT",
    "PENDING_CHAIRMAN_PAYMENT_APPROVAL",
    to,
    comment,
  );
  return doc;
}
export async function disburse(
  a: AuthUser,
  id: string,
  input: {
    amount: number;
    method: string;
    referenceCode?: string;
    note?: string;
    disbursedAt: string;
  },
) {
  assert(
    a.role === "ACCOUNTANT",
    403,
    "FORBIDDEN",
    "Chỉ kế toán được giải ngân",
  );
  assert(
    Number.isInteger(input.amount) && input.amount > 0,
    400,
    "INVALID_AMOUNT",
    "Số tiền phải là số nguyên dương",
  );
  const req = await FinancialRequest.findOne({
    _id: id,
    paymentStatus: { $in: ["PENDING_CHAIRMAN_PAYMENT_APPROVAL", "DISBURSED"] },
    chairmanPaymentApprovedAt: { $exists: true },
  });
  assert(
    req,
    409,
    "CHAIRMAN_APPROVAL_REQUIRED",
    "Cần Chủ tịch duyệt chi trước",
  );
  const paid = await Disbursement.aggregate([
    { $match: { requestId: req._id } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  assert(
    (paid[0]?.total || 0) + input.amount <= req.totalAmount,
    400,
    "INVALID_AMOUNT",
    "Tổng giải ngân vượt giá trị đề xuất",
  );
  const d = await Disbursement.create({
    ...input,
    requestId: id,
    accountantId: a.id,
    disbursedAt: new Date(input.disbursedAt),
  });
  const total = (paid[0]?.total || 0) + input.amount;
  const to = total === req.totalAmount ? "COMPLETED" : "DISBURSED";
  await FinancialRequest.updateOne(
    { _id: id },
    { $set: { paymentStatus: to } },
  );
  await audit(
    id,
    a,
    "DISBURSE",
    req.paymentStatus || "PENDING_CHAIRMAN_PAYMENT_APPROVAL",
    to,
    `${input.amount}`,
  );
  if (to === "COMPLETED")
    await audit(id, a, "COMPLETE", "DISBURSED", "COMPLETED");
  return d;
}

export async function exportDisbursementReport(a: AuthUser, id: string) {
  assert(a.role === "ACCOUNTANT", 403, "FORBIDDEN", "Chỉ kế toán được xuất báo cáo giải ngân");
  const request = await FinancialRequest.findById(id)
    .populate("requesterId", "name")
    .populate("departmentId", "name");
  assert(request, 404, "REQUEST_NOT_FOUND", "Không tìm thấy đề xuất");
  const records = await Disbursement.find({ requestId: request._id })
    .populate("accountantId", "name")
    .sort({ disbursedAt: 1 });
  const totalDisbursed = records.reduce((total, record) => total + record.amount, 0);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FinFlow";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Xác nhận giải ngân");
  sheet.columns = [{ width: 9 }, { width: 42 }, { width: 17 }, { width: 18 }, { width: 20 }];
  sheet.mergeCells("A1:E1");
  sheet.getCell("A1").value = "XÁC NHẬN GIẢI NGÂN";
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").alignment = { horizontal: "center" };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF195C42" } };
  sheet.addRow(["Mã đề xuất", request.requestCode]);
  sheet.mergeCells("B2:E2");
  sheet.addRow(["Nội dung", request.purpose]);
  sheet.mergeCells("B3:E3");
  sheet.addRow(["Người đề xuất", (request.requesterId as any)?.name || ""]);
  sheet.mergeCells("B4:E4");
  sheet.addRow(["Phòng ban", (request.departmentId as any)?.name || ""]);
  sheet.addRow(["Ngân hàng", request.bankName || "", "Số tài khoản", request.bankAccountNumber || ""]);
  sheet.mergeCells("D6:E6");
  sheet.addRow(["Tổng đề xuất", request.totalAmount, "Đã giải ngân", totalDisbursed]);
  sheet.mergeCells("D7:E7");
  sheet.addRow(["Còn lại", Math.max(0, request.totalAmount - totalDisbursed)]);
  sheet.mergeCells("A9:E9");
  sheet.getCell("A9").value = "CÁC KHOẢN MỤC / THIẾT BỊ TRONG ĐỀ XUẤT";
  const itemsHeader = sheet.addRow(["STT", "Khoản mục / thiết bị", "Số lượng", "Đơn giá", "Thành tiền"]);
  itemsHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
  itemsHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF195C42" } };
  request.items.forEach((item, index) => {
    sheet.addRow([
      index + 1,
      `${item.name}${item.itemType ? ` (${item.itemType})` : ""}`,
      item.quantity,
      item.unitPrice,
      item.amount ?? item.quantity * item.unitPrice,
    ]);
  });
  const disbursementTitleRow = sheet.rowCount + 2;
  sheet.mergeCells(`A${disbursementTitleRow}:D${disbursementTitleRow}`);
  sheet.getCell(`A${disbursementTitleRow}`).value = "CÁC ĐỢT GIẢI NGÂN";
  const header = sheet.addRow(["Đợt", "Số tiền", "Phương thức", "Ngày giải ngân"]);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF195C42" } };
  records.forEach((record, index) => {
    sheet.addRow([
      index + 1,
      record.amount,
      record.method,
      record.disbursedAt,
    ]);
  });
  for (const rowNumber of [2, 3, 4, 5, 6, 7, 8])
    sheet.getCell(`A${rowNumber}`).font = { bold: true };
  sheet.getCell("B7").numFmt = "#,##0";
  sheet.getCell("D7").numFmt = "#,##0";
  sheet.getCell("B8").numFmt = "#,##0";
  sheet.getRow(9).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(9).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF244033" } };
  const itemsStartRow = 10;
  const itemsEndRow = itemsStartRow + request.items.length - 1;
  for (let rowNumber = itemsStartRow; rowNumber <= itemsEndRow; rowNumber++) {
    sheet.getCell(`D${rowNumber}`).numFmt = "#,##0";
    sheet.getCell(`E${rowNumber}`).numFmt = "#,##0";
  }
  const disbursementsStartRow = disbursementTitleRow + 1;
  for (let rowNumber = disbursementsStartRow + 1; rowNumber <= sheet.rowCount; rowNumber++) {
    sheet.getCell(`B${rowNumber}`).numFmt = "#,##0";
    sheet.getCell(`D${rowNumber}`).numFmt = "dd/mm/yyyy";
  }
  sheet.getColumn(2).alignment = { vertical: "middle", wrapText: true };
  sheet.getCell(`A${disbursementTitleRow}`).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getCell(`A${disbursementTitleRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF244033" } };
  const signatureTitleRow = sheet.rowCount + 3;
  sheet.mergeCells(`A${signatureTitleRow}:E${signatureTitleRow}`);
  sheet.getCell(`A${signatureTitleRow}`).value = "XÁC NHẬN VÀ KÝ TÊN";
  sheet.getCell(`A${signatureTitleRow}`).font = { bold: true, size: 12 };
  sheet.getCell(`A${signatureTitleRow}`).alignment = { horizontal: "center" };
  const signatureHeaderRow = signatureTitleRow + 1;
  sheet.mergeCells(`A${signatureHeaderRow}:B${signatureHeaderRow}`);
  sheet.mergeCells(`C${signatureHeaderRow}:D${signatureHeaderRow}`);
  sheet.getCell(`A${signatureHeaderRow}`).value = "NGƯỜI NHẬN TIỀN";
  sheet.getCell(`C${signatureHeaderRow}`).value = "KẾ TOÁN";
  sheet.getCell(`E${signatureHeaderRow}`).value = "PHÊ DUYỆT";
  for (const cell of [`A${signatureHeaderRow}`, `C${signatureHeaderRow}`, `E${signatureHeaderRow}`]) {
    sheet.getCell(cell).font = { bold: true };
    sheet.getCell(cell).alignment = { horizontal: "center" };
  }
  const signatureHintRow = signatureHeaderRow + 1;
  sheet.mergeCells(`A${signatureHintRow}:B${signatureHintRow}`);
  sheet.mergeCells(`C${signatureHintRow}:D${signatureHintRow}`);
  for (const cell of [`A${signatureHintRow}`, `C${signatureHintRow}`, `E${signatureHintRow}`]) {
    sheet.getCell(cell).value = "(Ký, ghi rõ họ tên)";
    sheet.getCell(cell).alignment = { horizontal: "center", vertical: "top" };
  }
  sheet.getRow(signatureHintRow).height = 70;
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
    filename: `xac-nhan-giai-ngan-${request.requestCode}.xlsx`,
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  };
}
