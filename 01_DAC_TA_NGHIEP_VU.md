# 01 --- ĐẶC TẢ HỆ THỐNG VÀ QUY TẮC NGHIỆP VỤ

## 1. Mục đích

Tài liệu này là nguồn đặc tả nghiệp vụ cho AI Coding Agent khi xây dựng
hệ thống xét duyệt tài chính nội bộ. Không tự ý thay đổi rule nghiệp vụ.
Nếu gặp điểm chưa được chốt, phải đánh dấu TODO/BUSINESS_CONFIRMATION
thay vì tự suy diễn.

## 2. Phạm vi MVP

Hệ thống web nội bộ cho doanh nghiệp khoảng 20--30 nhân sự, số hóa 2
workflow: 1. Đề xuất tạm ứng/thanh toán. 2. Thanh toán sau khi hồ
sơ/chứng từ đầy đủ.

MVP gồm: - Đăng nhập, đăng xuất, tài khoản và phân quyền. - Tạo/sửa nháp
đề xuất. - Đề xuất loại tạm ứng hoặc thanh toán. - Các dòng chi tiết
thiết bị/dịch vụ. - Backend tính và kiểm tra tổng tiền. - Tự động xác
định cấp duyệt theo số tiền. - Duyệt/từ chối; từ chối bắt buộc lý do. -
Nộp chứng từ/hồ sơ thanh toán. - Kế toán kiểm tra hoặc yêu cầu bổ
sung. - Chủ tịch duyệt/từ chối chi. - Kế toán ghi nhận giải ngân. -
Timeline lịch sử. - Quản trị tài khoản, vai trò, phòng ban. - Xuất danh
sách Đề xuất và Thanh toán ra Excel.

Ngoài MVP: dashboard nâng cao, notification nâng cao, báo cáo BI và các
tích hợp ngoài chưa được tài liệu nguồn xác định.

## 3. Công nghệ và kiến trúc bắt buộc

Frontend: React + TypeScript. Backend: Node.js + Express + TypeScript.
Database: MongoDB + Mongoose. File: Object Storage; MongoDB chỉ lưu
metadata và URL/storage key. API: REST.

Backend: Route -\> Middleware -\> Controller -\> Service -\> Model -\>
MongoDB

Nguyên tắc: - Controller chỉ nhận request, gọi service, trả response. -
Service chứa business logic, authorization nghiệp vụ, workflow và state
transition. - Model chịu trách nhiệm persistence/schema, không
orchestration workflow. - Middleware xử lý xác thực, role tổng quát,
validation kỹ thuật, upload. - Frontend không phải source of truth cho
quyền, số tiền hoặc trạng thái.

## 4. Vai trò

### REQUESTER --- Người đề xuất

-   Tạo đề xuất.
-   Sửa đề xuất của chính mình khi DRAFT.
-   Gửi đề xuất.
-   Nộp/bổ sung chứng từ.
-   Theo dõi trạng thái và lịch sử.

### DEPARTMENT_HEAD --- Trưởng bộ phận

-   Duyệt/từ chối hồ sơ thuộc ngưỡng và phạm vi được phân quyền.
-   Báo cáo nguồn còn ghi chú hạn mức "1tr cho 1 đơn, 10tr cho 1 tháng";
    chưa đủ chi tiết để xác định thuật toán hạn mức tháng. Không tự
    triển khai hạn mức cộng dồn tháng nếu chưa xác nhận.

### DIRECTOR --- Ban Giám đốc

-   Duyệt/từ chối hồ sơ thuộc ngưỡng được phân quyền.
-   Báo cáo nguồn ghi "dưới 50tr cho 1 tháng"; chưa đủ chi tiết để xác
    định thuật toán hạn mức tháng.

### CHAIRMAN --- Chủ tịch

-   Duyệt/từ chối đề xuất \>= 50 triệu theo bảng workflow.
-   Duyệt/từ chối chi trong workflow thanh toán.

### ACCOUNTANT --- Kế toán

-   Kiểm tra hồ sơ/chứng từ.
-   Yêu cầu bổ sung.
-   Chuyển hồ sơ hợp lệ sang Chủ tịch duyệt chi.
-   Ghi nhận giải ngân.

### ADMIN --- Quản trị viên

-   Quản lý tài khoản, role, phòng ban và cấu hình hệ thống.

## 5. Workflow Đề xuất

### 5.1 Trạng thái

-   DRAFT
-   PENDING_APPROVAL
-   APPROVED
-   REJECTED
-   WAITING_PAYMENT_DOCUMENTS

### 5.2 Luồng

DRAFT -\> submit -\> backend tính/kiểm tra totalAmount -\> backend xác
định approvalLevel -\> nếu auto approve: ghi history và chuyển
APPROVED/WAITING_PAYMENT_DOCUMENTS -\> nếu cần người duyệt:
PENDING_APPROVAL -\> approve: APPROVED -\> WAITING_PAYMENT_DOCUMENTS -\>
reject: REJECTED

### 5.3 Rule ngưỡng theo bảng workflow trong báo cáo

-   \<= 1.000.000 VND: AUTO.

-   1.000.000 và \< 10.000.000: DEPARTMENT_HEAD.

-   = 10.000.000 và \< 50.000.000: DIRECTOR.

-   = 50.000.000: CHAIRMAN.

LƯU Ý NGHIỆP VỤ CHƯA CHỐT: - Phần rủi ro của báo cáo lại ghi khoảng \>1
triệu và \<10 triệu "chưa có cấp duyệt", mâu thuẫn với bảng workflow nêu
DEPARTMENT_HEAD. - Báo cáo chưa chốt duyệt theo ngưỡng là trực tiếp hay
tuần tự. =\> Trong code phải cô lập rule vào
ApprovalRoutingService/config và ghi TODO BUSINESS_CONFIRMATION. Không
rải điều kiện ngưỡng khắp code.

## 6. Workflow Thanh toán

Trạng thái: - PENDING_ACCOUNTANT_CHECK - NEED_SUPPLEMENT -
PENDING_CHAIRMAN_PAYMENT_APPROVAL - PAYMENT_REJECTED - DISBURSED -
COMPLETED

Luồng: WAITING_PAYMENT_DOCUMENTS -\> requester nộp hồ sơ -\>
PENDING_ACCOUNTANT_CHECK -\> accountant kiểm tra - thiếu/không hợp lệ
-\> NEED_SUPPLEMENT - hợp lệ -\> PENDING_CHAIRMAN_PAYMENT_APPROVAL -\>
chairman - reject -\> PAYMENT_REJECTED - approve -\> trạng thái/flag đủ
điều kiện giải ngân -\> accountant disburse -\> DISBURSED -\> COMPLETED

Báo cáo không định nghĩa một enum riêng cho trạng thái "Chairman đã
approve nhưng chưa giải ngân". Khi thiết kế implementation, có thể lưu
chairmanApprovedAt/chairmanApprovalAction để chứng minh điều kiện giải
ngân, nhưng không được tự thêm trạng thái nghiệp vụ mới mà không ghi rõ
đây là quyết định kỹ thuật.

## 7. Quy tắc cốt lõi

1.  Chỉ chủ sở hữu được sửa đề xuất và chỉ khi DRAFT.
2.  Backend phải tự tính/kiểm tra tiền; không tin totalAmount/amount từ
    frontend.
3.  Dùng số nguyên VND, không dùng float cho tiền.
4.  Approval routing do backend quyết định.
5.  Frontend không được trực tiếp đổi workflow status.
6.  Reject bắt buộc reason/comment không rỗng.
7.  Mọi hành động quan trọng phải tạo lịch sử append-only.
8.  Kế toán chỉ chuyển Chủ tịch khi hồ sơ đạt kiểm tra.
9.  Không giải ngân trước khi Chủ tịch duyệt chi.
10. Chỉ ACCOUNTANT được ghi nhận giải ngân.
11. Trước mọi transition phải kiểm tra current state.
12. Phải chống thao tác lặp/đồng thời đối với approve, reject,
    accountant-check, chairman approval và disbursement.
13. Backend luôn kiểm tra role + ownership/scope.
14. Không update/xóa audit history bằng flow nghiệp vụ thông thường.

## 8. State transition matrix

  --------------------------------------------------------------------------------------------------------------------
  Hành động         Từ                                          Đến                                  Actor
  ----------------- ------------------------------------------- ------------------------------------ -----------------
  save draft        DRAFT                                       DRAFT                                REQUESTER owner

  submit            DRAFT                                       PENDING_APPROVAL hoặc auto approved  REQUESTER owner

  approve request   PENDING_APPROVAL                            APPROVED/WAITING_PAYMENT_DOCUMENTS   cấp duyệt hợp lệ

  reject request    PENDING_APPROVAL                            REJECTED                             cấp duyệt hợp lệ

  upload/submit     WAITING_PAYMENT_DOCUMENTS/NEED_SUPPLEMENT   PENDING_ACCOUNTANT_CHECK             REQUESTER owner
  docs                                                                                               

  request           PENDING_ACCOUNTANT_CHECK                    NEED_SUPPLEMENT                      ACCOUNTANT
  supplement                                                                                         

  accountant accept PENDING_ACCOUNTANT_CHECK                    PENDING_CHAIRMAN_PAYMENT_APPROVAL    ACCOUNTANT

  chairman reject   PENDING_CHAIRMAN_PAYMENT_APPROVAL           PAYMENT_REJECTED                     CHAIRMAN

  chairman approve  PENDING_CHAIRMAN_PAYMENT_APPROVAL           đủ điều kiện giải ngân               CHAIRMAN

  disburse          đã được chairman approve                    DISBURSED                            ACCOUNTANT

  complete          DISBURSED                                   COMPLETED                            service/system
                                                                                                     theo rule triển
                                                                                                     khai
  --------------------------------------------------------------------------------------------------------------------

## 9. Audit

ApprovalAction tối thiểu: requestId, actorId, action, fromStatus,
toStatus, comment, createdAt. Action gợi ý: CREATE, UPDATE_DRAFT,
SUBMIT, AUTO_APPROVE, APPROVE, REJECT, UPLOAD_DOCUMENT,
REQUEST_SUPPLEMENT, ACCOUNTANT_ACCEPT, CHAIRMAN_APPROVE,
CHAIRMAN_REJECT, DISBURSE, COMPLETE. Tên action bổ sung là quyết định kỹ
thuật; ý nghĩa phải nhất quán.

## 10. Tiêu chí nghiệm thu

AC01 đúng role mới xử lý được chức năng. AC02 tạo tạm ứng/thanh toán và
lưu nháp. AC03 \<=1 triệu theo auto rule. AC04 ngưỡng 10 triệu/50 triệu
đi đúng cấp đã cấu hình. AC05 reject bắt buộc lý do và lưu history. AC06
requester nộp hồ sơ/chứng từ. AC07 accountant kiểm tra/yêu cầu bổ sung.
AC08 Chairman duyệt chi trước disbursement. AC09 accountant ghi amount,
method, date, referenceCode. AC10 timeline đúng actor, action,
timestamp.

## 11. Những việc Agent không được tự suy diễn

-   Không tự chọn direct hay sequential approval.
-   Không tự hoàn thiện rule hạn mức cộng dồn theo tháng.
-   Không tự thêm bước duyệt mới.
-   Không tự bỏ auto approval \<=1 triệu.
-   Không tự cho phép edit sau DRAFT.
-   Không tự cho frontend quyết định role/status/total.
-   Nếu yêu cầu mới xung đột tài liệu này: dừng phần liên quan và yêu
    cầu xác nhận.

## 12. Các quyết định nghiệp vụ đã xác nhận ngày 24/09/2026

- Duyệt trực tiếp theo ngưỡng, không tuần tự.
- Nhân viên thường: đơn đến 1.000.000 VND cần DEPARTMENT_HEAD; trên 1.000.000 và dưới 50.000.000 VND cần DIRECTOR; từ 50.000.000 VND cần CHAIRMAN.
- DEPARTMENT_HEAD và DIRECTOR tự động duyệt đề xuất cá nhân không quá 1.000.000 VND nếu tổng tự duyệt trong tháng chưa vượt lần lượt 10.000.000 và 50.000.000 VND.
- Cấp cao hơn được duyệt hồ sơ thuộc thẩm quyền cấp thấp hơn. DEPARTMENT_HEAD chỉ duyệt trong phòng ban.
- Một đề xuất có thể giải ngân nhiều đợt; tổng không vượt tổng đề xuất và chuyển COMPLETED khi giải ngân đủ.
- Không thêm READY_FOR_DISBURSEMENT; `chairmanPaymentApprovedAt` là bằng chứng cho phép giải ngân.
- Loại chứng từ nhập tự do trong MVP; xác thực dùng JWT Bearer.
