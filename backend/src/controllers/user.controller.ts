import type { Response } from "express";
import type { AuthedRequest } from "../types/index.js";
import * as userService from "../services/user.service.js";

export async function getMyBankAccount(req: AuthedRequest, res: Response) {
  res.json({
    success: true,
    data: await userService.getMyBankAccount(req.user!.id),
  });
}

export async function updateMyBankAccount(req: AuthedRequest, res: Response) {
  res.json({
    success: true,
    data: await userService.updateMyBankAccount(req.user!.id, req.body),
    message: "Đã cập nhật tài khoản ngân hàng",
  });
}
