---
spec: ADMIN-SUBSCRIPTION-CANCEL
title: Manager huỷ gói đăng ký của User và dừng gia hạn
area: admin
status: implemented
mvp: false
phase: P5
reviewed: 2026-08-16
owns:
  - Manager huỷ gói đăng ký của User theo yêu cầu nhận qua kênh ngoài
  - Dừng tự động gia hạn và xử lý thời hạn entitlement
  - Audit log và lý do quản trị khi huỷ gói dịch vụ
depends_on:
  - AUTOMATED-PAYMENT
  - RECURRING-BILLING
  - ENTITLEMENT-GRANT
  - ADMIN-AUTH
  - AUDIT-LOG
  - ERROR-CODES
  - EVENT-CATALOG
  - BUSINESS-RULES
---

# Manager huỷ gói đăng ký của User và dừng gia hạn

## 1. Objective

Cung cấp công cụ quản trị tập trung cho quản trị viên cấp cao (`super_admin`) thực hiện huỷ gói
đăng ký học tập của User khi tiếp nhận yêu cầu hỗ trợ qua các kênh bên ngoài (Zalo OA, Facebook
Messenger, Email). Thao tác này ngay lập tức dừng chu kỳ tự động gia hạn (`auto_renew = false`),
đồng thời cho phép quản trị viên lựa chọn thu hồi quyền lợi (`entitlements`) ngay lập tức hoặc bảo lưu
quyền lợi đến hết chu kỳ đã thanh toán.

Spec này sở hữu nghiệp vụ quản trị huỷ gói đăng ký của User từ trang quản trị; kế thừa phân quyền
từ [`admin-auth.md`](admin-auth.md) và mô hình quyền lợi từ [`../00-foundation/entitlement-model.md`](../00-foundation/entitlement-model.md).
Mọi thoả thuận hoàn trả tiền bạc (nếu có) được xử lý ngoài hệ thống qua chuyển khoản thủ công.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Manager | `super_admin` (`requireSuperAdminAuth`) | Xem gói đăng ký của User và thực hiện huỷ gói kèm lý do |
| Manager | `content_reviewer` | Bị từ chối quyền thực hiện thao tác huỷ gói (403 `INSUFFICIENT_ROLE`) |
| User | Đã đăng nhập (`requireUserAuth`) | Nhận thông báo xác nhận gói đã bị huỷ và ngày hết hạn quyền lợi thực tế |

## 3. Entry points

| Route / Màn hình | Actor | Ghi chú |
|---|---|---|
| `/users/{id}` | Manager (`super_admin`) | Trang chi tiết User, mục "Gói đăng ký & Dịch vụ" có nút "Huỷ gói" |
| `POST /api/managers/subscriptions/{id}/cancel` | Manager (`super_admin`) | Endpoint huỷ gói đăng ký, dừng gia hạn và điều chỉnh quyền lợi |
| `GET /api/managers/users/{id}/subscriptions` | Manager (`super_admin`) | Tra cứu danh sách gói đăng ký định kỳ của User |

## 4. Main flow

1. Quản trị viên `super_admin` mở trang chi tiết User `/users/{id}` trên giao diện SuperAdmin.
2. Quản trị viên chọn gói đăng ký đang hoạt động (`active` hoặc `past_due`) và bấm "Huỷ gói".
3. Form xác nhận yêu cầu nhập:
   - `reason`: Chọn từ danh sách đóng (`user_request_zalo`, `user_request_messenger`, `user_request_email`, `admin_override`, `other`).
   - `admin_note`: Bắt buộc, tối thiểu 20 ký tự (ghi rõ mã hội thoại hoặc nội dung trao đổi).
   - `revoke_immediate`: Tuỳ chọn cắt quyền ngay lập tức hoặc giữ đến hết chu kỳ đã trả.
4. Server xác thực quyền `super_admin`, kiểm tra trạng thái gói đăng ký trong DB transaction:
   - Cập nhật `recurring_subscriptions.status = 'cancelled'`, `auto_renew = false`, `cancelled_by = 'admin'`, `cancel_reason = reason`, `cancel_note = admin_note`.
   - Nếu `revoke_immediate = true`: cập nhật `entitlements.status = 'cancelled'`.
   - Ghi `audit_logs` đầy đủ (actor, user_id, subscription_id, reason, note, revoke_immediate).
   - Đơn hàng gốc (`payment_orders`) được giữ nguyên trạng thái `approved` và số tiền thực thu.
5. Gửi thông báo tới User kèm ngày hết hiệu lực thực tế và trả kết quả 200 thành công về giao diện admin.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Gói đã huỷ trước đó | Subscription có `status = 'cancelled'` | Trả 409 `SUBSCRIPTION_ALREADY_CANCELLED`, không ghi audit trùng |
| Ghi chú quá ngắn | `admin_note` có độ dài < 20 ký tự | Trả 422 `INVALID_CANCEL_REASON`, yêu cầu nhập bổ sung |
| Quyền reviewer | Manager có vai trò `content_reviewer` | Trả 403 `INSUFFICIENT_ROLE` |
| Không tìm thấy gói | ID subscription không tồn tại | Trả 404 `SUBSCRIPTION_NOT_FOUND` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ASC-01` | Huỷ gói dừng chu kỳ auto-renew của subscription, không tạo đợt charge tiếp theo | Bảo đảm không tự động trừ tiền kỳ sau của khách hàng |
| `BR-ASC-02` | Đơn hàng gốc (`payment_orders`) giữ nguyên trạng thái `approved` và số tiền thực thu — Cấm sửa hoặc xoá đơn | Bảo đảm tính bất biến của sổ sách doanh thu kế toán |
| `BR-ASC-03` | Huỷ gói bắt buộc có lý do từ danh sách đóng và ghi chú quản trị `admin_note ≥ 20 ký tự` ghi rõ kênh tiếp nhận | Đảm bảo tính giải trình và tra cứu đối soát khi khách hàng khiếu nại |
| `BR-ASC-04` | Thao tác huỷ là idempotent — gửi lặp yêu cầu huỷ không tạo nhiều bản ghi audit trùng lặp | Chặn lỗi gửi trùng request từ mạng hoặc giao diện người dùng |
| `BR-ASC-05` | Tuỳ chọn xử lý quyền lợi: cắt ngay lập tức hoặc bảo lưu đến hết chu kỳ đã thanh toán theo quyết định quản trị | Linh hoạt xử lý các ca thoả thuận đặc biệt ngoài hệ thống |
| `BR-ASC-06` | Toàn bộ thao tác huỷ gói đăng ký phải ghi `audit_logs` có cấu trúc đầy đủ actor, user_id, lý do và thời điểm | Tuân thủ tiêu chuẩn kiểm toán và bảo mật hệ thống |

## 7. Data

**Đọc:** `recurring_subscriptions`, `entitlements`, `users`, `payment_orders`.
**Ghi:** `recurring_subscriptions`, `entitlements`, `audit_logs`.

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `subscription_id` | integer | FK `recurring_subscriptions.id` |
| `reason` | string | Danh sách đóng (`user_request_zalo`, `user_request_messenger`, `user_request_email`, `admin_override`, `other`) |
| `admin_note` | text | Bắt buộc, tối thiểu 20 ký tự |
| `revoke_immediate` | boolean | Mặc định `false` |
| `cancelled_by` | string | `admin` |

## 8. API contract

### `POST /api/managers/subscriptions/{id}/cancel`

| | |
|---|---|
| Auth | `requireSuperAdminAuth()` |
| Body | `{ "reason": string, "admin_note": string, "revoke_immediate"?: boolean }` |
| 200 | `{ "subscription_id": number, "status": "cancelled", "auto_renew": false, "effective_until": string }` |
| 401 | `UNAUTHENTICATED` — Chưa đăng nhập quản trị |
| 403 | `INSUFFICIENT_ROLE` — Không phải vai trò super_admin |
| 404 | `SUBSCRIPTION_NOT_FOUND` — Không tìm thấy gói đăng ký |
| 409 | `SUBSCRIPTION_ALREADY_CANCELLED` — Gói đăng ký đã được huỷ trước đó |
| 422 | `INVALID_CANCEL_REASON` — Thiếu lý do hoặc ghi chú < 20 ký tự |

## 9. Acceptance criteria

```gherkin
Scenario: BR-ASC-01 & BR-ASC-02 — huỷ gói dừng auto-renew và giữ nguyên đơn gốc
  Given User có subscription SUB-001 đang active gắn với đơn hàng ORD-001
  When super_admin gọi POST /api/managers/subscriptions/1/cancel với reason user_request_zalo và admin_note hợp lệ
  Then subscription SUB-001 có status là cancelled và auto_renew là false
  And đơn hàng ORD-001 vẫn giữ trạng thái approved và nguyên số tiền

Scenario: BR-ASC-03 — từ chối huỷ nếu ghi chú dưới 20 ký tự
  When super_admin gọi cancel với admin_note ngắn "Khach xin huy"
  Then hệ thống trả mã lỗi 422
  And mã lỗi là INVALID_CANCEL_REASON

Scenario: BR-ASC-04 — huỷ lại gói đã huỷ trả 409
  Given subscription SUB-002 đã ở trạng thái cancelled
  When super_admin gọi cancel cho SUB-002
  Then hệ thống trả mã 409 SUBSCRIPTION_ALREADY_CANCELLED

Scenario: BR-ASC-05 — cắt quyền ngay lập tức khi revoke_immediate là true
  Given User có entitlement ENT-001 đang active
  When super_admin huỷ subscription kèm revoke_immediate = true
  Then entitlement ENT-001 chuyển ngay sang cancelled trong cùng transaction
```

## 10. Boundaries

**Always**
- Dừng `auto_renew` của subscription khi huỷ.
- Bắt buộc `admin_note ≥ 20 ký tự` ghi rõ kênh và mã tham chiếu.
- Ghi `audit_logs` đầy đủ thông tin thao tác quản trị.

**Ask first**
- Bổ sung kênh tiếp nhận mới ngoài Zalo OA / Messenger / Email.
- Thay đổi mặc định của cờ `revoke_immediate`.

**Never**
- Xoá hoặc sửa đổi bản ghi đơn hàng `payment_orders`.
- Cho phép quản trị viên `content_reviewer` huỷ gói của User.
- Huỷ gói mà không có ghi chú lý do quản trị.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Khách hàng yêu cầu hoàn tiền xử lý thế nào?~~ **Đóng 2026-08-16 (D-RF)**: Thoả thuận ngoài hệ thống qua Zalo OA / Messenger / Email và chuyển khoản thủ công; trong hệ thống chỉ huỷ gói và dừng gia hạn. | Chính sách hoàn tiền | Đã đóng | D-RF |
