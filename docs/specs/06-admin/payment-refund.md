---
spec: PAYMENT-REFUND
title: Xử lý và kiểm soát hoàn tiền
area: admin
status: approved
mvp: false
phase: P5
reviewed: 2026-08-16
owns:
  - Quy trình hoàn tiền đơn hàng và tích hợp provider refund
  - Audit và phân quyền phê duyệt hoàn tiền cho quản trị viên
  - Điều chỉnh và thu hồi entitlement sau khi hoàn tiền thành công
depends_on:
  - AUTOMATED-PAYMENT
  - PAYMENT-APPROVAL
  - ENTITLEMENT-GRANT
  - ADMIN-AUTH
  - AUDIT-LOG
  - ERROR-CODES
  - EVENT-CATALOG
  - BUSINESS-RULES
---

# Xử lý và kiểm soát hoàn tiền

## 1. Objective

Thiết lập quy trình hoàn tiền (refund) chuẩn hoá, bảo mật và có thể kiểm toán đầy đủ cho các đơn
hàng đã thanh toán thành công (cả qua cổng tự động lẫn chuyển khoản VietQR). Hệ thống cho phép
quản trị viên cấp cao (`super_admin`) phê duyệt và khởi tạo lệnh hoàn tiền một phần hoặc toàn phần,
tích hợp trực tiếp với API hoàn tiền của đối tác cổng thanh toán, đồng thời tự động điều chỉnh hoặc
thu hồi quyền lợi dịch vụ (`entitlements`) tương ứng trong cùng một transaction nguyên tử.

Spec này sở hữu nghiệp vụ hoàn tiền và điều chỉnh quyền lợi sau hoàn tiền; kế thừa phân quyền quản
trị từ [`admin-auth.md`](admin-auth.md) và máy trạng thái thanh toán từ
[`../00-foundation/payment-flow.md`](../00-foundation/payment-flow.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Manager | `super_admin` (`requireSuperAdminAuth`) | Xem danh sách đơn đủ điều kiện hoàn tiền, tạo lệnh và phê duyệt hoàn tiền |
| Manager | `content_reviewer` | Bị từ chối quyền thực hiện thao tác hoàn tiền (403 `INSUFFICIENT_ROLE`) |
| User | Đã đăng nhập (`requireUserAuth`) | Nhận tiền hoàn về tài khoản nguồn và nhận email xác nhận hoàn tiền |

## 3. Entry points

| Route / Màn hình | Actor | Ghi chú |
|---|---|---|
| `/admin/payments/orders/{uuid}` | Manager (`super_admin`) | Giao diện chi tiết đơn hàng và nút "Khởi tạo hoàn tiền" |
| `POST /api/managers/orders/{uuid}/refund` | Manager (`super_admin`) | Endpoint thực hiện hoàn tiền một phần hoặc toàn phần |
| `GET /api/managers/refunds` | Manager (`super_admin`) | Bảng tra cứu toàn bộ lịch sử các giao dịch hoàn tiền |

## 4. Main flow

1. Quản trị viên `super_admin` mở trang chi tiết đơn hàng đã thanh toán thành công (`approved` / `captured`).
2. Quản trị viên nhập số tiền hoàn (toàn phần hoặc một phần), chọn lý do và bắt buộc nhập ghi chú
   quản trị `admin_note` (tối thiểu 10 ký tự).
3. Server kiểm tra ràng buộc:
   - Tổng số tiền đã hoàn + số tiền yêu cầu hoàn mới ≤ số tiền thực thu của đơn hàng.
   - Trạng thái đơn hàng hợp lệ để hoàn tiền.
4. Server gọi API hoàn tiền sang payment provider tương ứng với mã `idempotency_key`.
5. Khi provider xác nhận hoàn tiền thành công:
   - Tạo bản ghi mới trong bảng `payment_refunds`.
   - Cập nhật trạng thái đơn hàng sang `refunded` (nếu hoàn 100%) hoặc `partially_refunded`.
   - Điều chỉnh hoặc thu hồi `entitlements` của User tương ứng trong cùng transaction.
   - Ghi nhật ký kiểm toán `audit_logs` đầy đủ (actor, order_id, amount, reason, provider_ref).
6. Gửi email xác nhận hoàn tiền cho User và trả kết quả thành công về giao diện quản trị.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Hoàn tiền vượt mức | `refund_amount` > số tiền còn lại của đơn | Trả 422 `REFUND_EXCEEDS_CAPTURED_AMOUNT`, từ chối thao tác |
| Gửi lặp lệnh hoàn tiền | Cùng `idempotency_key` đã xử lý | Trả 409 `REFUND_ALREADY_PROCESSED`, không trừ tiền provider lần hai |
| Provider hoàn tiền lỗi | API provider trả lỗi / timeout | Đánh dấu refund `failed`, không thu hồi entitlement của User, log chi tiết lỗi |
| Đơn thanh toán VietQR | Đơn chuyển khoản thủ công | Tạo bản ghi hoàn tiền thủ công sau khi kế toán đã chuyển khoản trả khách |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RFD-01` | Hoàn tiền không bao giờ sửa đổi hoặc xoá lịch sử giao dịch cũ — tạo bản ghi refund riêng biệt liên kết với đơn hàng gốc | Bảo đảm tính bất biến của sổ sách kế toán và lịch sử dòng tiền |
| `BR-RFD-02` | Số tiền hoàn tích luỹ không bao giờ vượt quá số tiền thực thu của đơn hàng gốc | Ngăn chặn thất thoát tài chính do hoàn tiền vượt mức thanh toán ban đầu |
| `BR-RFD-03` | Yêu cầu hoàn tiền phải có lý do quản trị (admin note ≥ 10 ký tự) và được thực hiện bởi Manager có vai trò `super_admin` | Kiểm soát chặt chẽ quyền hạn thao tác liên quan tới hoàn trả tiền bạc |
| `BR-RFD-04` | Xử lý hoàn tiền là thao tác idempotent — gửi trùng yêu cầu hoàn tiền không gọi provider hai lần và không hoàn tiền hai lần | Chặn lỗi mạng hoặc bấm nhầm gây hoàn tiền trùng lặp |
| `BR-RFD-05` | Thu hồi hoặc điều chỉnh entitlement tương ứng ngay trong cùng transaction khi hoàn tiền thành công | Đảm bảo tính nhất quán giữa trạng thái tài chính và quyền hạn sử dụng của người dùng |
| `BR-RFD-06` | Toàn bộ quá trình yêu cầu, phê duyệt và hoàn tiền phải ghi `audit_logs` đầy đủ thông tin định danh và số tiền | Phục vụ công tác thanh tra, hậu kiểm và giải quyết khiếu nại tài chính |

## 7. Data

**Đọc:** `payment_orders`, `entitlements`, `users`, `payment_refunds`.
**Ghi:** `payment_refunds`, `payment_orders`, `entitlements`, `audit_logs`.

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `order_id` | integer | FK `payment_orders.id` |
| `refund_amount` | integer | > 0 và ≤ số tiền thực thu chưa hoàn |
| `reason` | string | Danh sách đóng (`user_request`, `duplicate_payment`, `fraud`, `other`) |
| `admin_note` | text | Bắt buộc, tối thiểu 10 ký tự |
| `provider_refund_id` | string | Mã hoàn tiền từ cổng đối tác |
| `status` | enum | `pending`, `succeeded`, `failed` |

## 8. API contract

### `POST /api/managers/orders/{uuid}/refund`

| | |
|---|---|
| Auth | `requireSuperAdminAuth()` |
| Body | `{ "amount": number, "reason": string, "admin_note": string, "idempotency_key": string }` |
| 200 | `{ "refund_id": string, "status": "succeeded", "refunded_amount": number }` |
| 401 | `UNAUTHENTICATED` — Chưa đăng nhập quản trị |
| 403 | `INSUFFICIENT_ROLE` — Không phải vai trò super_admin |
| 404 | `NOT_FOUND` — Đơn hàng không tồn tại |
| 409 | `REFUND_ALREADY_PROCESSED` — Trùng mã idempotency |
| 422 | `REFUND_EXCEEDS_CAPTURED_AMOUNT` — Số tiền hoàn vượt mức cho phép |
| 422 | `ADMIN_NOTE_REQUIRED` — Thiếu hoặc ghi chú ngắn < 10 ký tự |

## 9. Acceptance criteria

```gherkin
Scenario: BR-RFD-02 — không cho phép hoàn tiền vượt quá số tiền thực thu
  Given đơn hàng ORD-001 có số tiền thực thu là 499.000 VND và đã hoàn 200.000 VND
  When quản trị viên yêu cầu hoàn tiếp 350.000 VND
  Then hệ thống trả mã lỗi 422
  And mã lỗi là REFUND_EXCEEDS_CAPTURED_AMOUNT

Scenario: BR-RFD-03 — yêu cầu vai trò super_admin và admin_note hợp lệ
  Given tài khoản quản trị có vai trò content_reviewer
  When gọi POST /api/managers/orders/ORD-001/refund
  Then hệ thống trả mã 403 INSUFFICIENT_ROLE

Scenario: BR-RFD-05 — thu hồi entitlement ngay khi hoàn tiền toàn phần
  Given User có gói standard còn hiệu lực từ đơn hàng ORD-002
  When quản trị viên hoàn tiền 100% cho đơn hàng ORD-002
  Then trạng thái đơn hàng ORD-002 chuyển sang refunded
  And entitlement liên kết chuyển ngay sang cancelled trong cùng transaction
```

## 10. Boundaries

**Always**
- Kiểm tra số tiền hoàn tích luỹ không vượt quá số tiền thanh toán ban đầu.
- Bắt buộc ghi `audit_logs` kèm lý do và ghi chú quản trị cho mọi lệnh hoàn tiền.
- Thu hồi quyền lợi dịch vụ đồng bộ trong cùng transaction khi hoàn tiền thành công.

**Ask first**
- Thực hiện hoàn tiền cho các giao dịch đã diễn ra quá 90 ngày.
- Thay đổi hạn mức hoàn tiền tối đa cho một tài khoản quản trị viên.

**Never**
- Xoá bản ghi đơn hàng hoặc giao dịch thanh toán cũ khi có yêu cầu hoàn tiền.
- Cho phép quản trị viên không có vai trò `super_admin` thực hiện hoàn tiền.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Thời hạn tối đa cho phép khách hàng yêu cầu hoàn tiền là bao nhiêu ngày kể từ ngày thanh toán (7 ngày, 14 ngày hay 30 ngày)? | Chính sách hoàn tiền | P5 | Kế toán |
| 2 | Phí xử lý giao dịch cổng thanh toán khi hoàn tiền do KidThink hay khách hàng chịu? | Điều khoản dịch vụ | P5 | Kế toán |
