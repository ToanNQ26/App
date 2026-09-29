# 03 --- ĐẶC TẢ FRONTEND REACT + HƯỚNG DẪN CODEX

## 1. Mục tiêu frontend

Xây UI nội bộ React + TypeScript cho 6 role. Frontend hiển thị đúng
action theo quyền/trạng thái để UX rõ ràng, nhưng backend luôn là nơi
quyết định cuối cùng.

## 2. Cấu trúc

frontend/ src/ api/ http.ts auth.api.ts requests.api.ts approvals.api.ts
payments.api.ts admin.api.ts exports.api.ts components/ common/ layout/
forms/ tables/ status/ timeline/ documents/ pages/ auth/ dashboard/
requests/ approvals/ payments/ admin/ hooks/ router/ store/ types/
constants/ utils/ App.tsx main.tsx

## 3. Routes

/login /dashboard /requests /requests/new /requests/:id
/requests/:id/edit /approvals /approvals/:id /payments /payments/:id
/admin/users /admin/departments

Route guard frontend chỉ để UX. Không coi route guard là security
boundary.

## 4. Màn hình

### Login

-   email
-   password
-   loading/error
-   sau login gọi /auth/me hoặc lưu user context an toàn theo token
    strategy backend.

### Dashboard

Báo cáo nguồn chỉ nói dashboard là ưu tiên sau nghiệp vụ, không đặc tả
KPI. MVP dashboard chỉ nên có điều hướng/tổng quan tối thiểu; không tự
tạo KPI nghiệp vụ phức tạp.

### Danh sách đề xuất

Cột gợi ý: - requestCode - requester - department - type - purpose rút
gọn - totalAmount - status - approvalLevel - createdAt - action xem chi
tiết

Filter: status, type, khoảng ngày; department nếu role được phép.
Pagination server-side.

### Tạo/sửa đề xuất

Fields: - type ADVANCE/PAYMENT - purpose - RequestItem\[\] - itemType -
name - description optional - quantity - unitPrice - supplier - UI có
thể hiển thị amount/total dự kiến nhưng backend trả về mới là giá trị
authoritative. Actions: Lưu nháp, Gửi đề xuất. Chỉ cho edit khi owner +
DRAFT theo dữ liệu backend.

### Chi tiết đề xuất

Các section: 1. Header: code + status badge. 2. Người đề xuất/phòng
ban/loại. 3. Purpose. 4. Item table + total. 5. Approval information. 6.
Payment documents. 7. Disbursement information nếu có. 8. Timeline. 9.
Action bar.

Action bar dựa trên user + status: - REQUESTER DRAFT: edit/submit. -
approver hợp lệ PENDING_APPROVAL: approve/reject. - REQUESTER
WAITING_PAYMENT_DOCUMENTS hoặc NEED_SUPPLEMENT: upload/submit
documents. - ACCOUNTANT PENDING_ACCOUNTANT_CHECK: valid/request
supplement. - CHAIRMAN PENDING_CHAIRMAN_PAYMENT_APPROVAL:
approve/reject. - ACCOUNTANT sau chairman approve: disburse. Nếu API trả
FORBIDDEN/INVALID_STATUS phải refresh detail và hiển thị message; không
giả định nút ẩn là đủ.

### Pending approvals

Danh sách hồ sơ backend xác định actor được xử lý. Không filter quyền
chỉ bằng frontend threshold. Click vào detail, approve/reject modal.
Reject modal bắt buộc reason.

### Payment documents

-   danh sách file.
-   document type.
-   tên file.
-   người upload/thời điểm.
-   upload progress/error.
-   xóa file chỉ khi backend cho phép.
-   nút "Nộp hồ sơ" nếu backend triển khai upload và submit tách nhau.
-   NEED_SUPPLEMENT hiển thị comment/lý do gần khu vực hồ sơ.

### Accountant check

Modal/panel: - xem chứng từ. - VALID -\> xác nhận chuyển Chủ tịch. -
NEED_SUPPLEMENT -\> comment bắt buộc/khuyến nghị theo API contract. Sau
thành công refresh detail + timeline.

### Chairman payment approval

-   thông tin đề xuất.
-   tổng tiền.
-   chứng từ.
-   lịch sử.
-   Approve.
-   Reject + reason required.

### Disbursement

Fields: - amount - method BANK_TRANSFER/CASH/OTHER - disbursedAt -
referenceCode - note Không cho UI tự coi là đủ điều kiện; gọi API và xử
lý CHAIRMAN_APPROVAL_REQUIRED nếu backend từ chối.

### Timeline

GET /requests/:id/history. Sort theo API hoặc createdAt tăng dần. Hiển
thị actor, action, timestamp, comment, from/to status nếu hữu ích. Không
cho edit/delete history.

### Admin

Users: - list/create/update - role - department - isActive
Departments: - list/create/update - code/name/isActive

### Export

Cho role có quyền chọn filter và tải: - Requests Excel - Payments Excel
Frontend gửi filter, backend tạo file.

## 5. TypeScript types

Định nghĩa tập trung: UserRole, RequestStatus, PaymentStatus,
ApprovalLevel, RequestType, User, Department, RequestItem,
FinancialRequest, ApprovalAction, PaymentDocument, Disbursement,
ApiResponse`<T>`{=html}, PaginatedResponse`<T>`{=html}. Không copy enum
dưới nhiều dạng string rời rạc.

## 6. API client

Một http client chung: - baseURL env. - attach auth. - parse standard
error. - 401 -\> auth flow. - không swallow lỗi. - hỗ trợ blob cho
Excel. Không đặt business workflow trong api client.

## 7. State management

Chọn giải pháp đơn giản phù hợp MVP. Server state nên có cache/refetch;
auth/global UI state tách riêng. Báo cáo không bắt buộc
Redux/Zustand/TanStack Query, vì vậy Codex có thể chọn nhưng phải ghi
quyết định trong README và tránh overengineering.

## 8. UX rules

-   Format VND rõ ràng.
-   Status badge map tập trung.
-   Loading, empty, error states.
-   Confirm action nhạy cảm.
-   Reject luôn có reason.
-   Disable double click trong lúc request pending, nhưng backend vẫn
    phải chống duplicate.
-   Sau mutation refetch detail/list/history.
-   Không optimistic update đối với approval/disbursement nếu có nguy cơ
    hiển thị sai trạng thái.

## 9. Permission matrix UI

  ----------------------------------------------------------------------------------------------
  Role              Create/Edit   Approve   Docs     Accountant   Chairman   Disburse   Admin
                    Draft         Request            Check        Pay                   
                                                                  Approval              
  ----------------- ------------- --------- -------- ------------ ---------- ---------- --------
  REQUESTER         Có            Không     Có với   Không        Không      Không      Không
                                            hồ sơ                                       
                                            của mình                                    

  DEPARTMENT_HEAD   Không theo    Theo      Xem nếu  Không        Không      Không      Không
                    scope MVP     backend   được                                        
                                  scope     quyền                                       

  DIRECTOR          Không         Theo      Xem nếu  Không        Không      Không      Không
                                  backend   được                                        
                                  scope     quyền                                       

  CHAIRMAN          Không         Theo      Xem      Không        Có         Không      Không
                                  backend                                               
                                  scope                                                 

  ACCOUNTANT        Không         Không     Kiểm tra Có           Không      Có         Không

  ADMIN             quản trị;     không tự  không tự không        không      không      Có
                    quyền nghiệp  cấp       suy diễn                                    
                    vụ không tự                                                         
                    suy diễn                                                            
  ----------------------------------------------------------------------------------------------

## 10. Những điều frontend không được làm

-   Không gửi status tùy ý để đổi workflow.
-   Không tự xác định approver làm nguồn sự thật.
-   Không tin total tự tính.
-   Không hard-code "role này chắc chắn xem được request" thay cho
    backend.
-   Không cho sửa history.
-   Không bypass error backend.
-   Không tự thêm dashboard KPI ngoài phạm vi rồi ưu tiên hơn workflow.

## 11. Kiểm thử frontend

-   Login success/fail.
-   Protected route UX.
-   Create/save draft.
-   Dynamic RequestItem.
-   Submit.
-   Boundary amount chỉ kiểm tra hiển thị; routing authoritative kiểm
    qua response backend.
-   Approve/reject modal.
-   reject reason validation.
-   documents upload.
-   supplement state.
-   accountant actions.
-   chairman actions.
-   disbursement form.
-   timeline.
-   API 401/403/409/validation error.
-   export blob/download.

## 12. Thứ tự triển khai cho Codex

PHASE 0 --- Đọc cả 3 tài liệu trước khi code. PHASE 1 --- Scaffold
monorepo hoặc backend/frontend riêng; env, lint, TS. PHASE 2 --- Backend
models/constants/error/auth. PHASE 3 --- Request + items + calculation +
routing + tests. PHASE 4 --- Approval + audit + concurrency tests. PHASE
5 --- Payment documents + accountant workflow. PHASE 6 --- Chairman
approval + disbursement. PHASE 7 --- Admin + history + Excel export.
PHASE 8 --- Frontend auth/layout/request CRUD. PHASE 9 --- Frontend
approval/payment/admin. PHASE 10 --- E2E/integration/UAT fixes.

Không code tất cả trong một lần nếu context không đủ. Sau mỗi phase: 1.
chạy build/test; 2. sửa lỗi; 3. tóm tắt file thay đổi; 4. liệt kê
TODO/BUSINESS_CONFIRMATION; 5. mới sang phase tiếp.

## 13. Prompt khởi động Codex

Bạn là coding agent chịu trách nhiệm triển khai hệ thống xét duyệt tài
chính nội bộ.

Trước khi sửa code: 1. Đọc đầy đủ: - 01_DAC_TA_NGHIEP_VU.md -
02_DAC_TA_BACKEND.md - 03_DAC_TA_FRONTEND_VA_CODEX.md 2. Xem các tài
liệu này là specification của dự án. 3. Không tự thay đổi business rule.
4. Nếu specification mâu thuẫn hoặc thiếu, tạo mục BUSINESS_CONFIRMATION
và hỏi người dùng thay vì tự suy diễn. 5. Backend phải tuân thủ Route
-\> Middleware -\> Controller -\> Service -\> Model. 6. Business logic
và authorization nghiệp vụ nằm ở Service. 7. Viết TypeScript strict,
code module hóa, không overengineering. 8. Sau mỗi phase phải chạy
test/build và báo kết quả. 9. Không bỏ qua lỗi TypeScript/test để tiếp
tục phase. 10. Ưu tiên workflow, permission, audit và data integrity
trước UI nâng cao.

Bắt đầu bằng việc: - đọc repository hiện tại; - đối chiếu repository với
3 specification; - đề xuất implementation plan theo phase; - chỉ bắt đầu
code sau khi đã nêu các điểm BUSINESS_CONFIRMATION đang chặn thiết kế.

## 14. Business confirmations phải hiện rõ

A. \>1m và \<10m: bảng workflow nói DEPARTMENT_HEAD nhưng phần rủi ro
nói chưa có cấp duyệt. B. Approval trực tiếp hay tuần tự. C. Hạn mức
"10tr/tháng", "dưới 50tr/tháng" có phải cộng dồn theo người/phòng
ban/cấp duyệt hay không. D. Một request có được giải ngân nhiều đợt
không. E. Khi Chairman approve, có cần trạng thái riêng
"READY_FOR_DISBURSEMENT" hay chỉ lưu approval evidence. F. Danh sách
documentType bắt buộc chưa được báo cáo xác định. G. Token/session
strategy chưa được báo cáo quy định. Các mục D--G là khoảng trống kỹ
thuật/nghiệp vụ phát hiện khi chuyển báo cáo thành đặc tả; không được
coi là nội dung đã được báo cáo chốt.

## 15. Definition of Done toàn hệ thống

-   Hai workflow chạy end-to-end.
-   Role/ownership được backend enforce.
-   Amount server-side.
-   Threshold tập trung.
-   Reject reason + immutable history.
-   Document validation.
-   Accountant -\> Chairman -\> disbursement đúng thứ tự.
-   Duplicate action được ngăn.
-   Excel export hoạt động.
-   UI hiển thị đúng trạng thái/action.
-   AC01--AC10 đạt.
-   Build/test pass.
-   README setup đầy đủ.
-   Không còn quyết định nghiệp vụ chưa xác nhận bị hard-code âm thầm.

## 16. Cập nhật giao diện theo quyết định đã xác nhận ngày 24/09/2026

- UI hiển thị route dự kiến nhưng kết quả backend vẫn là nguồn sự thật.
- DIRECTOR/CHAIRMAN có thể duyệt hồ sơ thuộc cấp thấp hơn khi API cho phép.
- Chi tiết hiển thị nhiều đợt giải ngân và chỉ hoàn tất khi tổng các đợt bằng tổng đề xuất.
- Không hiển thị READY_FOR_DISBURSEMENT. UI dựa vào `chairmanPaymentApprovedAt` để hiện hành động giải ngân cho ACCOUNTANT.
- Authentication dùng JWT Bearer; loại chứng từ nhập tự do trong MVP.

## 17. Cấu trúc source frontend đã triển khai

Source được chia theo trách nhiệm thành `pages/`, `components/`, `services/`, `contexts/`, `routes/`, `types/`, `utils/`, `styles/` và `tests/`. Các trang không tự cấu hình base URL hoặc authentication header; mọi HTTP request đi qua client chung trong `services/http.service.ts`.
