import { assert } from "../exceptions/index.js";
import { User } from "../models/index.js";

export async function getMyBankAccount(userId: string) {
  const user = await User.findById(userId).select("bankAccountNumber bankName");
  assert(user, 404, "USER_NOT_FOUND", "Không tìm thấy tài khoản người dùng");
  return {
    bankAccountNumber: user.bankAccountNumber || "",
    bankName: user.bankName || "",
  };
}

export async function updateMyBankAccount(
  userId: string,
  input: { bankAccountNumber?: unknown; bankName?: unknown },
) {
  const bankAccountNumber = String(input.bankAccountNumber || "").trim();
  const bankName = String(input.bankName || "").trim();
  assert(
    bankAccountNumber.length >= 4 && bankAccountNumber.length <= 34,
    400,
    "INVALID_BANK_ACCOUNT",
    "Số tài khoản phải có từ 4 đến 34 ký tự",
  );
  assert(
    bankName.length >= 2 && bankName.length <= 100,
    400,
    "INVALID_BANK_NAME",
    "Tên ngân hàng phải có từ 2 đến 100 ký tự",
  );
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { bankAccountNumber, bankName } },
    { new: true, runValidators: true },
  ).select("bankAccountNumber bankName");
  assert(user, 404, "USER_NOT_FOUND", "Không tìm thấy tài khoản người dùng");
  return { bankAccountNumber: user.bankAccountNumber, bankName: user.bankName };
}
