import bcrypt from "bcryptjs";
import { connectDatabase } from './config/index.js';
import { Department, User } from './models/index.js';
await connectDatabase();
const department = await Department.findOneAndUpdate(
  { code: "OPS" },
  { name: "Vận hành", code: "OPS", isActive: true },
  { upsert: true, new: true },
);
const additionalDepartments = [
  { name: "Quản lý dự án", code: "PROJECT" },
  { name: "IT", code: "IT" },
  { name: "Hành chính nhân sự", code: "HR" },
  { name: "Kế toán", code: "ACC" },
  { name: "Thu mua", code: "PROC" },
];
const seededDepartments = [department];
for (const item of additionalDepartments)
  seededDepartments.push(await Department.findOneAndUpdate(
    { code: item.code },
    { ...item, isActive: true },
    { upsert: true, new: true },
  ));

const passwordHash = await bcrypt.hash("Password123!", 12);
const accountRules: Array<Record<string, string>> = [];
async function seedUser(
  name: string,
  email: string,
  role: string,
  departmentId: typeof department._id,
  preserveExisting = false,
) {
  const fields = { name, email, role, departmentId, isActive: true, passwordHash };
  await User.findOneAndUpdate(
    { email },
    preserveExisting ? { $setOnInsert: fields } : { $set: fields },
    { upsert: true, new: true },
  );
  accountRules.push({
    name,
    email,
    role,
    department: String(
      seededDepartments.find((item) => String(item._id) === String(departmentId))?.name ?? "-",
    ),
    password: preserveExisting
      ? "giữ nguyên nếu đã tồn tại; nếu tạo mới: Password123!"
      : "Password123!",
  });
}

for (const item of seededDepartments) {
  const slug = item.code.toLowerCase();
  for (let number = 1; number <= 3; number++) {
    const email = item.code === "OPS" && number < 3
      ? `requester${number === 1 ? "" : "2"}@demo.vn`
      : `requester${number}.${slug}@demo.vn`;
    await seedUser(`Nhân viên ${number} - ${item.name}`, email, "REQUESTER", item._id);
  }
  await seedUser(
    `Trưởng bộ phận - ${item.name}`,
    item.code === "OPS" ? "head@demo.vn" : `head.${slug}@demo.vn`,
    "DEPARTMENT_HEAD",
    item._id,
  );
}

await seedUser("Giám đốc", "director@demo.vn", "DIRECTOR", department._id, true);
await seedUser("Chủ tịch", "chairman@demo.vn", "CHAIRMAN", department._id, true);
await seedUser("Kế toán", "accountant@demo.vn", "ACCOUNTANT", department._id);
await seedUser("Quản trị", "admin@demo.vn", "ADMIN", department._id);
console.log("Seed hoàn tất. Quy tắc và tài khoản đăng nhập:");
console.table(accountRules);
process.exit(0);
