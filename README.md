# FinFlow — Hệ thống xét duyệt tài chính

Webapp nội bộ React + TypeScript và Express + MongoDB cho luồng đề xuất, duyệt, chứng từ, duyệt chi và giải ngân nhiều đợt.

## Chạy dự án

Yêu cầu Node.js 20+ và MongoDB local.

```bash
npm install
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
npm run seed
npm run dev
```

Frontend: `http://localhost:5173`; API: `http://localhost:4000/api`.

Tài khoản demo dùng mật khẩu `Password123!`: `requester@demo.vn`, `head@demo.vn`, `director@demo.vn`, `chairman@demo.vn`, `accountant@demo.vn`, `admin@demo.vn`.

## Quy tắc đã xác nhận

- Duyệt trực tiếp theo ngưỡng, không tuần tự.
- Nhân viên: đơn đến 1 triệu cần Trưởng bộ phận duyệt; trên 1 triệu và dưới 50 triệu cần Giám đốc; từ 50 triệu cần Chủ tịch.
- Trưởng bộ phận và Giám đốc tự duyệt đề xuất cá nhân đến 1 triệu nếu chưa vượt hạn mức tháng tương ứng 10 triệu và 50 triệu.
- Cấp cao hơn có thể duyệt hồ sơ của cấp thấp hơn. Trưởng bộ phận chỉ xử lý trong phòng ban.
- Một đề xuất có nhiều đợt giải ngân; tổng không vượt giá trị đề xuất và hoàn tất khi giải ngân đủ.
- Không thêm trạng thái `READY_FOR_DISBURSEMENT`; dùng `chairmanPaymentApprovedAt` làm bằng chứng cho phép giải ngân.
- Loại chứng từ nhập tự do. Xác thực dùng JWT Bearer, mặc định 8 giờ.

## Kiểm tra

```bash
npm run build
npm test
```

File được lưu trên filesystem local khi phát triển. Production cần object storage, JWT secret mạnh và MongoDB transaction cho thao tác nhiều collection.

## Cấu trúc frontend

```text
frontend/src/
├── components/   # UI dùng lại và layout
├── contexts/     # global context, hiện có authentication
├── pages/        # các màn hình theo route
├── routes/       # route table và protected route
├── services/     # HTTP/API client và service gọi backend
├── styles/       # global stylesheet
├── types/        # TypeScript domain types
├── utils/        # helper thuần
└── tests/        # frontend tests
```

## Kiến trúc backend 3 lớp

```text
HTTP request
  → routes/*.routes.ts + middleware.ts
  → controllers/*.controller.ts   (nhận request, gọi service, trả response)
  → services/*.service.ts         (nghiệp vụ, phân quyền, workflow)
  → models/*.model.ts             (Mongoose schema và persistence)
  → MongoDB
```

Mỗi domain model có một file riêng trong `backend/src/models/`; `models/index.ts` chỉ làm nhiệm vụ export. Route và controller không truy vấn Mongoose. Controller không chứa ngưỡng tiền hoặc quy tắc chuyển trạng thái; toàn bộ các quyết định này nằm trong service.

Các thành phần dùng chung cũng được tách theo trách nhiệm:

- `middlewares/`: authenticate, role guard, upload và async handler.
- `exceptions/`: AppError, business assertion và error handler tập trung.
- `enums/`: role, request status, payment status và approval level.
- `types/`: chỉ chứa interface/type không phải enum, ví dụ authenticated request.
