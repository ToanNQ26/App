import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/index.js";
import { assert } from "../exceptions/index.js";
import { User } from "../models/index.js";

export async function login(email: string, password: string) {
  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true,
  }).select("+passwordHash");
  assert(
    user && (await bcrypt.compare(password, user.passwordHash)),
    401,
    "UNAUTHORIZED",
    "Email hoặc mật khẩu không đúng",
  );
  const safeUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId ? String(user.departmentId) : undefined,
  };
  const token = jwt.sign(safeUser, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
  return { token, user: safeUser };
}
