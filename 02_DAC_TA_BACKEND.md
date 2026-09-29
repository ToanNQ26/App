# 02 --- ĐẶC TẢ BACKEND NODE.JS / EXPRESS / MONGODB

## 1. Mục tiêu

Xây backend REST API TypeScript theo modular monolith và kiến trúc Route
-\> Middleware -\> Controller -\> Service -\> Model. Ưu tiên tính đúng
workflow, phân quyền, audit và chống xử lý lặp.

## 2. Cấu trúc thư mục

backend/ src/ config/ database.ts env.ts storage.ts constants/ roles.ts
request-status.ts payment-status.ts approval-level.ts action-types.ts
error-codes.ts models/ User.model.ts Department.model.ts
Request.model.ts RequestItem.model.ts ApprovalAction.model.ts
PaymentDocument.model.ts Disbursement.model.ts services/ auth.service.ts
user.service.ts department.service.ts request.service.ts
approval-routing.service.ts approval.service.ts payment.service.ts
disbursement.service.ts history.service.ts export.service.ts
storage.service.ts controllers/ auth.controller.ts user.controller.ts
department.controller.ts request.controller.ts approval.controller.ts
payment.controller.ts disbursement.controller.ts history.controller.ts
export.controller.ts routes/ index.ts auth.routes.ts user.routes.ts
department.routes.ts request.routes.ts approval.routes.ts
payment.routes.ts disbursement.routes.ts history.routes.ts
export.routes.ts middlewares/ authenticate.middleware.ts
require-role.middleware.ts validate.middleware.ts upload.middleware.ts
error.middleware.ts validators/ types/ utils/ app.ts server.ts tests/
unit/ integration/ .env.example package.json tsconfig.json

## 3. Layer contract

### Controller

Không query Mongoose trực tiếp nếu nghiệp vụ đã có service. Không chứa
threshold/state transition. Chỉ parse input, user context, gọi service,
map HTTP.

### Service

Chứa: - authorization theo hồ sơ; - validation nghiệp vụ; - tính tiền; -
routing; - transition; - atomic/conditional update; - tạo audit; -
orchestration nhiều model.

### Model

Schema/index/persistence. Không quyết định ai được duyệt hoặc status kế
tiếp.

## 4. Data model

### User

-   \_id ObjectId
-   name string required
-   email string required unique normalized
-   passwordHash string required
-   role enum required
-   departmentId ObjectId optional
-   isActive boolean default true
-   timestamps

Không serialize passwordHash.

### Department

-   \_id
-   name
-   code unique
-   isActive
-   timestamps

### Request

-   \_id
-   requestCode string unique
-   requesterId ObjectId required indexed
-   departmentId ObjectId optional/indexed
-   type enum ADVANCE\|PAYMENT
-   purpose string required
-   totalAmount integer \>=0
-   status RequestStatus
-   approvalLevel AUTO\|DEPARTMENT_HEAD\|DIRECTOR\|CHAIRMAN
-   paymentStatus optional PaymentStatus
-   submittedAt optional
-   approvedAt optional
-   rejectedAt optional
-   chairmanPaymentApprovedAt optional (technical evidence for
    disbursement)
-   timestamps

Không cho API generic PATCH sửa status, approvalLevel, totalAmount tùy
ý.

### RequestItem

-   requestId indexed
-   itemType string
-   name string required
-   description optional
-   quantity number \>0
-   unitPrice integer \>=0
-   amount integer \>=0
-   supplier optional
-   timestamps

Service tính amount = quantity \* unitPrice và totalAmount =
sum(amount).

### ApprovalAction

-   requestId indexed
-   actorId indexed
-   action enum/string controlled
-   fromStatus string
-   toStatus string
-   comment optional
-   createdAt Append-only. Không expose endpoint update/delete audit.

### PaymentDocument

-   requestId indexed
-   documentType required
-   originalName
-   fileUrl
-   storageKey
-   mimeType
-   fileSize
-   uploadedBy
-   uploadedAt Database lưu metadata, file thật ở object storage.

### Disbursement

-   requestId unique (MVP giả định một lần giải ngân; nếu nghiệp vụ muốn
    nhiều đợt phải xác nhận)
-   amount integer
-   method BANK_TRANSFER\|CASH\|OTHER
-   referenceCode
-   note
-   disbursedAt
-   accountantId
-   createdAt

## 5. Index đề nghị

User.email unique. Department.code unique. Request.requestCode unique.
Request: requesterId+createdAt; status+approvalLevel;
departmentId+status. ApprovalAction: requestId+createdAt.
PaymentDocument: requestId+uploadedAt. Disbursement.requestId unique nếu
rule một lần giải ngân được chấp nhận.

## 6. Service contract

### AuthService

login(email,password) - tìm active user - verify password hash - phát
token/session theo implementation. getCurrentUser(). Không trả
passwordHash.

### RequestService

createRequest(actor,input) - actor REQUESTER (hoặc quyền admin nếu sau
này xác nhận). - tạo DRAFT. - tạo items và tính tiền server-side.

updateDraft(actor,requestId,input) - load request. - requesterId ==
actor.id. - status == DRAFT. - cập nhật allowed fields/items. -
recalculate amount.

getRequest(actor,id) - kiểm tra quyền xem.

listRequests(actor,filters,pagination) - scope theo role.

submitRequest(actor,id) - owner + DRAFT. - recalculate total. -
determineApprovalLevel(). - dùng conditional update để chống submit
lặp. - AUTO: tạo audit AUTO_APPROVE và chuyển theo workflow. - manual:
PENDING_APPROVAL. - tạo audit SUBMIT.

### ApprovalRoutingService

determineApprovalLevel(totalAmount) Hiện dùng bảng: \<=1m AUTO \>1m
\<10m DEPARTMENT_HEAD \>=10m \<50m DIRECTOR \>=50m CHAIRMAN Toàn bộ
threshold phải tập trung tại đây/config. TODO BUSINESS_CONFIRMATION:
direct vs sequential và mâu thuẫn \>1m\<10m.

### ApprovalService

getPendingApprovals(actor,filters) - chỉ trả hồ sơ actor có quyền xử lý.

approveRequest(actor,id,comment?) - current=PENDING_APPROVAL. - actor
role khớp approvalLevel và scope. - conditional update. - audit
APPROVE. - đưa sang APPROVED/WAITING_PAYMENT_DOCUMENTS theo
implementation thống nhất.

rejectRequest(actor,id,reason) - reason trim required. -
current=PENDING_APPROVAL. - permission. - conditional update -\>
REJECTED. - audit REJECT chứa reason.

### PaymentService

submitDocuments(actor,id,files,metadata) - owner. - request đã qua
approval và đang chờ chứng từ hoặc NEED_SUPPLEMENT. - validate
MIME/size. - upload storage, persist metadata. - chuyển
PENDING_ACCOUNTANT_CHECK khi người dùng thực hiện hành động "nộp hồ sơ";
upload file đơn lẻ không nhất thiết tự submit nếu UI tách 2 hành động.

accountantCheck(actor,id,result,comment) - ACCOUNTANT. - current
PENDING_ACCOUNTANT_CHECK. - result VALID -\>
PENDING_CHAIRMAN_PAYMENT_APPROVAL. - result NEED_SUPPLEMENT -\>
NEED_SUPPLEMENT. - audit.

chairmanApprove(actor,id,comment?) - CHAIRMAN. - current
PENDING_CHAIRMAN_PAYMENT_APPROVAL. - atomic update
chairmanPaymentApprovedAt. - audit CHAIRMAN_APPROVE.

chairmanReject(actor,id,reason) - reason required. - current
PENDING_CHAIRMAN_PAYMENT_APPROVAL. - -\> PAYMENT_REJECTED. - audit.

### DisbursementService

disburse(actor,id,input) - ACCOUNTANT. - chairmanPaymentApprovedAt
exists / audit chứng minh đã approve. - chưa có disbursement. - amount
integer hợp lệ. - ghi method/date/reference. - atomic/transaction nếu
phù hợp. - paymentStatus -\> DISBURSED. - audit DISBURSE. - sau đó
complete theo rule triển khai; nếu tự động complete, ghi action COMPLETE
riêng.

### HistoryService

getRequestHistory(actor,id) - kiểm tra quyền xem. - sort createdAt
ascending. - populate actor display data cần thiết.

### ExportService

exportRequests(actor,filters) exportPayments(actor,filters) Filters tối
thiểu: fromDate,toDate,departmentId,status,type. Phải kiểm tra
quyền/scope trước khi export.

## 7. API

### Auth

POST /api/auth/login GET /api/auth/me POST /api/auth/logout (nếu token
strategy hỗ trợ/đòi hỏi)

Login body: { "email":"...", "password":"..." }

### Requests

POST /api/requests GET
/api/requests?page=1&limit=20&status=&type=&fromDate=&toDate= GET
/api/requests/:id PATCH /api/requests/:id DELETE /api/requests/:id (chỉ
DRAFT owner; nếu không muốn hard delete, dùng policy kỹ thuật rõ ràng)
POST /api/requests/:id/submit

Create/update input gợi ý: { "type":"ADVANCE", "purpose":"...",
"items":\[
{"itemType":"SERVICE","name":"...","quantity":2,"unitPrice":500000,"supplier":"..."}
\] } Không nhận status/approvalLevel đáng tin cậy từ client.

### Approval

GET /api/approvals/pending POST /api/requests/:id/approve POST
/api/requests/:id/reject Reject: {"reason":"..."}

### Payment documents

GET /api/requests/:id/payment-documents POST
/api/requests/:id/payment-documents DELETE
/api/requests/:id/payment-documents/:documentId Nên có action submit
documents rõ ràng nếu upload nhiều file: POST
/api/requests/:id/payment-documents/submit Đây là bổ sung kỹ thuật để
tránh mỗi lần upload tự chuyển trạng thái.

### Accountant

POST /api/requests/:id/accountant-check Body:
{"result":"VALID","comment":"..."} hoặc
{"result":"NEED_SUPPLEMENT","comment":"Thiếu hóa đơn..."}

### Chairman

POST /api/requests/:id/chairman-approve POST
/api/requests/:id/chairman-reject

### Disbursement

POST /api/requests/:id/disburse GET /api/requests/:id/disbursement Body:
{ "amount": 10000000, "method":"BANK_TRANSFER", "referenceCode":"...",
"disbursedAt":"ISO-8601", "note":"..." }

### History

GET /api/requests/:id/history

### Export

GET /api/exports/requests GET /api/exports/payments

### Admin

GET/POST/PATCH /api/admin/users... GET/POST/PATCH
/api/admin/departments...

## 8. Response convention

Success: { "success": true, "data": {}, "message": "..." } List: {
"success":true, "data":\[\],
"pagination":{"page":1,"limit":20,"total":0,"totalPages":0} } Error: {
"success":false,
"error":{"code":"INVALID_REQUEST_STATUS","message":"...","details":null}
}

Error codes tối thiểu: UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR,
USER_NOT_FOUND, REQUEST_NOT_FOUND, REQUEST_NOT_OWNER,
INVALID_REQUEST_STATUS, INVALID_PAYMENT_STATUS, INVALID_AMOUNT,
APPROVAL_NOT_ALLOWED, REJECTION_REASON_REQUIRED, INVALID_DOCUMENT,
DOCUMENT_REQUIRED, ACCOUNTANT_CHECK_REQUIRED,
CHAIRMAN_APPROVAL_REQUIRED, ALREADY_DISBURSED, INTERNAL_SERVER_ERROR.

## 9. Concurrency/idempotency

Không làm kiểu load -\> if -\> save cho action nhạy cảm mà không có bảo
vệ concurrency. Dùng conditional update: findOneAndUpdate({\_id, status:
EXPECTED}, {\$set:{...}}) và kiểm tra result. Disbursement cần unique
requestId và/hoặc transaction/conditional guard. Mục tiêu: hai request
approve/disburse đồng thời chỉ một request thành công.

## 10. Validation và security

-   Hash password bằng thư viện chuẩn.
-   Secrets/database URI trong env.
-   .env không commit.
-   Validate ObjectId.
-   Validate enum.
-   Validate integer VND.
-   Sanitize/limit string.
-   MIME + file size allowlist.
-   Quyền tải/xem file phải kiểm tra server-side.
-   Không log password/token/secrets.
-   Centralized error middleware.
-   CORS theo môi trường.
-   Rate limit login nếu phù hợp.
-   Token strategy cụ thể chưa được báo cáo quy định; chọn giải pháp đơn
    giản, ghi trong README.

## 11. Testing bắt buộc

Unit: - amount calculation. - approval routing boundaries: 0, 1m, 1m+1,
9,999,999, 10m, 49,999,999, 50m. - transition validation. - reject
reason.

Integration: - auth/role. - owner edit DRAFT. - non-owner forbidden. -
submit. - each approval level. - duplicate approve. - reject. -
documents -\> accountant -\> chairman -\> disbursement. - disbursement
before chairman =\> fail. - duplicate disbursement =\> fail. - history
order/content. - export permission.

## 12. Seed/dev data

Tạo seed cho mỗi role và ít nhất một department để test. Không hard-code
password production. README ghi rõ credential dev.

## 13. Definition of Done backend

-   TypeScript build pass.
-   Lint/test pass.
-   Không còn business logic threshold trong controller/frontend.
-   API errors nhất quán.
-   AC01--AC10 có test hoặc test case chứng minh.
-   README có setup/env/run/test.
-   Các điểm BUSINESS_CONFIRMATION được tập trung và liệt kê, không bị
    Agent tự quyết định âm thầm.

## 14. Cập nhật thiết kế đã xác nhận ngày 24/09/2026

`ApprovalRoutingService` áp dụng routing trực tiếp: nhân viên có đơn đến 1 triệu cần DEPARTMENT_HEAD; trên 1 triệu và dưới 50 triệu cần DIRECTOR; từ 50 triệu cần CHAIRMAN. DIRECTOR xử lý được route DEPARTMENT_HEAD và CHAIRMAN xử lý được mọi route thấp hơn.

Tự duyệt chỉ dành cho đề xuất của DEPARTMENT_HEAD hoặc DIRECTOR không quá 1 triệu. Service cộng tổng đề xuất `AUTO` của actor từ đầu tháng và áp dụng hạn mức lần lượt 10 triệu/50 triệu.

`Disbursement.requestId` không unique vì một đề xuất được giải ngân nhiều đợt. Service cộng tổng đã giải ngân, từ chối phần vượt, giữ `DISBURSED` khi còn thiếu và chuyển `COMPLETED` khi đủ. Điều kiện giải ngân là `chairmanPaymentApprovedAt` tồn tại; không tạo trạng thái mới.

## 15. Hiện thực kiến trúc 3 lớp

- `controllers/`: chỉ đọc HTTP request, gọi service và định dạng HTTP response; không import model hoặc truy vấn Mongoose.
- `services/`: chứa validation nghiệp vụ, authorization theo hồ sơ, routing, state transition và gọi model.
- `models/*.model.ts`: mỗi model có một file schema/index riêng; `models/index.ts` là điểm export chung và model không chứa điều phối workflow.
- `routes/*.routes.ts`: route được chia theo domain (`auth`, `request`, `approval`, `payment`, `admin`); `routes/index.ts` chỉ mount các router con.
- `config/`: `env.ts` đọc biến môi trường, `database.ts` quản lý kết nối MongoDB, `cors.ts` quản lý origin, và `index.ts` là điểm export chung.
- `middlewares/`: mỗi middleware có file riêng cho authentication, role guard, upload và async error forwarding.
- `exceptions/`: định nghĩa `AppError`, assertion nghiệp vụ và centralized error handler.
- `enums/`: mỗi nhóm enum/constant có file riêng. Interface của user/request xác thực nằm trong `types/`, không trộn vào enum.
