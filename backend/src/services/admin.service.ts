import bcrypt from "bcryptjs";
import { Department, User } from "../models/index.js";

export const listUsers = () =>
  User.find().populate("departmentId", "name code");
export async function createUser(input: Record<string, unknown>) {
  const passwordHash = await bcrypt.hash(String(input.password), 12);
  const { password: _password, ...safeInput } = input;
  return User.create({ ...safeInput, passwordHash });
}
export function updateUser(id: string, input: Record<string, unknown>) {
  const allowed: Record<string, unknown> = {};
  for (const key of ["name", "role", "departmentId", "isActive"])
    if (input[key] !== undefined) allowed[key] = input[key];
  return User.findByIdAndUpdate(id, allowed, { new: true });
}
export const listDepartments = () => Department.find().sort({ name: 1 });
export const createDepartment = (input: Record<string, unknown>) =>
  Department.create(input);
export const updateDepartment = (id: string, input: Record<string, unknown>) =>
  Department.findByIdAndUpdate(id, input, { new: true });
