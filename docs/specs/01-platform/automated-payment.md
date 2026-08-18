---
spec: AUTOMATED-PAYMENT
title: Cổng thanh toán tự động và đối soát
area: platform
status: implemented
mvp: false
phase: P5
reviewed: 2026-08-16
owns:
  - Cổng thanh toán trực tuyến tự động và xác thực webhook chữ ký
  - Trạng thái thanh toán tự động và xử lý trùng lặp
  - Đối soát giao dịch thanh toán tự động và fallback VietQR
depends_on:
  - PAYMENT-FLOW
  - PAYMENT-ORDER-CREATE
  - ENTITLEMENT-MODEL
  - AUDIT-LOG
  - ERROR-CODES
  - EVENT-CATALOG
  - BUSINESS-RULES
---

# Cổng thanh toán tự động và đối soát

## 1. Objective

Mở rộng hạ tầng thanh toán của MindKid từ quy trình chuyển khoản VietQR duyệt tay ở P2 sang cổng
thanh toán trực tuyến tự động (gateway webhook), tự động xác nhận giao dịch và kích hoạt gói dịch
vụ ngay lập tức cho User. Hệ thống hỗ trợ xử lý sự kiện webhook với cơ chế khử trùng lặp
(idempotency), bảo vệ giao dịch bằng chữ ký số bảo mật, và duy trì kênh VietQR duyệt tay làm
phương thức dự phòng (fallback) đáng tin cậy.

Spec này sở hữu kết nối cổng thanh toán, xác thực webhook raw-body và đối soát kế toán tự động;
không thay thế máy trạng thái đơn hàng cơ sở trong [`../00-foundation/payment-flow.md`](../00-foundation/payment-flow.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| User | Đã đăng nhập (`requireUserAuth`) | Tạo phiên thanh toán tự động, nhận URL thanh toán / QR động |
| Payment Provider | Webhook caller kèm chữ ký HMAC hợp lệ | Gửi tín hiệu biến động số dư / kết quả giao dịch thanh toán |
| Manager | `super_admin` (`requireSuperAdminAuth`) | Xem báo cáo đối soát, tra cứu nhật ký webhook và can thiệp thủ công |
| Worker | Job queue nội bộ | Chạy tác vụ đối soát định kỳ (reconciliation) |

## 3. Entry points

| Route / Màn hình | Actor | Ghi chú |
|---|---|---|
| `POST /api/users/orders/{uuid}/checkout-session` | User | Khởi tạo phiên thanh toán tự động với provider |
| `POST /api/guest/webhooks/payments/{provider}` | Payment Provider | Tiếp nhận webhook bất đồng bộ kèm chữ ký |
| `GET /api/managers/payments/reconciliation` | Manager | Bảng tra cứu đối soát doanh thu tự động |
| `POST /api/managers/payments/reconciliation/run` | Manager | Kích hoạt quét đối soát theo khoảng thời gian |

## 4. Main flow

1. User bấm thanh toán gói dịch vụ trên giao diện web, chọn phương thức tự động (thẻ ngân hàng,
   ví điện tử hoặc QR động qua cổng).
2. Server tạo `payment_intent` phía provider với số tiền và mã gói đọc từ `PACKAGE_CATALOG` nội bộ;
   ghi nhận `provider_transaction_id` và trả redirect URL / QR payload về client.
3. User hoàn tất thanh toán trên cổng của provider. Provider gửi webhook về server MindKid.
4. Handler webhook đọc raw-body, xác minh chữ ký số HMAC, timestamp trong cửa sổ replay (≤ 5 phút),
   và kiểm tra idempotency theo `provider_event_id`.
5. Trong cùng một DB transaction:
   - Cập nhật trạng thái đơn hàng sang `approved` / `captured`.
   - Cấp phát hoặc gia hạn entitlement tương ứng cho User (`entitlements.status = 'active'`).
   - Ghi nhận `audit_logs` và lưu sự kiện webhook vào bảng nhật ký giao dịch.
6. Trả HTTP 200 cho provider. Client của User nhận thông báo thành công qua SSE hoặc polling nhẹ
   và mở khoá quyền lợi ngay lập tức.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Webhook sai chữ ký | Signature không khớp secret | Trả 401 `WEBHOOK_SIGNATURE_INVALID`, log cảnh báo bảo mật |
| Webhook gửi lặp | `provider_event_id` đã xử lý thành công | Trả 200 ngay, không cấp quyền lần hai (idempotent) |
| Webhook quá hạn | Timestamp lệch > 5 phút so với đồng hồ server | Trả 409 `WEBHOOK_REPLAY_DETECTED`, từ chối xử lý |
| Provider gặp sự cố | Gateway timeout / downtime | Chuyển hướng người dùng sang kênh VietQR chuyển khoản duyệt tay |
| Sai lệch đối soát | Số tiền thực thu khác giá trị đơn hàng | Đánh dấu `mismatch`, chuyển trạng thái `under_review`, gửi alert quản trị |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-APM-01` | Provider event không phải sự thật chưa kiểm — verify signature raw-body, timestamp trong replay window (≤ 5 phút), livemode và merchant ID trước khi chuyển trạng thái đơn | Chặn giả mạo webhook và tấn công phát lại (replay attack) từ kẻ xấu |
| `BR-APM-02` | Xử lý webhook exactly-once trên hạ tầng at-least-once — lưu provider event ID và khóa idempotency trong cùng transaction với cập nhật đơn hàng và cấp phát entitlement | Đảm bảo không cấp thừa quyền lợi khi provider gửi lại webhook nhiều lần |
| `BR-APM-03` | Giá tiền và gói dịch vụ lấy từ catalog server — Cấm — **NEVER** tin tưởng số tiền, thời hạn hay quyền lợi do client hoặc webhook metadata gửi lên | Ngăn chặn hành vi thao túng giá thanh toán phía client |
| `BR-APM-04` | VietQR duyệt tay là fallback luôn khả dụng — sự cố cổng tự động không làm gián đoạn kênh thanh toán chuyển khoản truyền thống | Đảm bảo tính liên tục của hoạt động kinh doanh khi đối tác trung gian thanh toán gián đoạn |
| `BR-APM-05` | Log không bao giờ chứa thông tin nhạy cảm của thẻ / phương thức thanh toán đầy đủ hoặc chữ ký bí mật của webhook | Tuân thủ tiêu chuẩn an toàn bảo mật thông tin thanh toán (PCI-DSS) |
| `BR-APM-06` | Đối soát định kỳ phát hiện sai lệch số tiền/trạng thái giữa provider và DB nội bộ — chỉ cảnh báo tới người quản trị, không tự ý sửa đổi số tiền hay cấp quyền mù | Tránh sai lệch sổ sách kế toán và rò rỉ quyền lợi |
| `BR-APM-07` | Mọi thay đổi trạng thái thanh toán tự động và cấp phát entitlement phải ghi `audit_logs` có cấu trúc | Luồng tài chính bắt buộc có đầy đủ bằng chứng kiểm toán không thể chối bỏ |

## 7. Data

**Đọc:** `packages`, `payment_orders`, `entitlements`, cấu hình provider secrets.
**Ghi:** `payment_orders`, `entitlements`, `audit_logs`, `payment_transactions`.

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `provider_name` | string | Danh sách đóng (`vnpay`, `payos`, `momo`) |
| `provider_event_id` | string | Unique constraint cho idempotency |
| `provider_transaction_id` | string | Định danh giao dịch phía cổng thanh toán |
| `signature_verified` | boolean | Bắt buộc `true` trước khi cập nhật đơn |
| `captured_amount` | integer | Số tiền VND thực thu |

## 8. API contract

### `POST /api/users/orders/{uuid}/checkout-session`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Body | `{ "provider": "payos" \| "vnpay", "return_url": string }` |
| 200 | `{ "checkout_url": string, "qr_payload": string, "expires_at": string }` |
| 400 | `PACKAGE_NOT_SELLABLE` — Gói không mở bán |
| 404 | `NOT_FOUND` — Đơn hàng không tồn tại hoặc không thuộc User |
| 409 | `ORDER_ALREADY_PROCESSED` — Đơn hàng đã ở trạng thái terminal |

### `POST /api/guest/webhooks/payments/{provider}`

| | |
|---|---|
| Auth | Chữ ký raw-body HMAC qua header `x-provider-signature` |
| Body | JSON payload từ payment provider |
| 200 | `{ "status": "success", "processed": boolean }` |
| 401 | `WEBHOOK_SIGNATURE_INVALID` — Chữ ký không khớp |
| 409 | `WEBHOOK_REPLAY_DETECTED` — Timestamp quá hạn hoặc trùng lặp |

## 9. Acceptance criteria

```gherkin
Scenario: BR-APM-01 — từ chối webhook có chữ ký không hợp lệ
  Given một request webhook gửi tới /api/guest/webhooks/payments/payos
  When chữ ký trong header x-provider-signature không khớp với raw-body
  Then hệ thống trả mã 401
  And mã lỗi là WEBHOOK_SIGNATURE_INVALID
  And không đơn hàng nào được chuyển trạng thái

Scenario: BR-APM-02 — xử lý idempotent khi nhận webhook trùng lặp
  Given đơn hàng ORD-123 đã được duyệt thành công bởi provider_event_id EVT-999
  When webhook với cùng provider_event_id EVT-999 được gửi lại
  Then hệ thống trả mã 200
  And không cấp thêm thời hạn entitlement nào cho User

Scenario: BR-APM-03 — giá đơn hàng luôn lấy từ catalog máy chủ
  Given gói premium có giá niêm yết 599.000 VND trong catalog
  When User khởi tạo checkout session
  Then số tiền gửi tới cổng thanh toán phải là 599.000 VND
  And không nhận giá trị giá tiền do client truyền lên
```

## 10. Boundaries

**Always**
- Xác thực chữ ký HMAC trên raw-body trước khi parse JSON.
- Xử lý cập nhật trạng thái đơn hàng và cấp phát quyền lợi trong cùng một transaction.
- Ghi nhật ký kiểm toán `audit_logs` cho mọi giao dịch thanh toán tự động.

**Ask first**
- Tích hợp thêm nhà cung cấp cổng thanh toán mới ngoài danh mục đã duyệt.
- Thay đổi thời gian replay window hoặc phương thức tính chữ ký webhook.

**Never**
- Lưu trữ thông tin thẻ tín dụng/CVV trên máy chủ MindKid.
- Bỏ qua bước kiểm tra chữ ký webhook kể cả trong môi trường staging khi chưa có cờ kiểm thử.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Provider nào được chọn làm cổng thanh toán chính thức đầu tiên (PayOS, VNPay hay MoMo)? | Cấu hình SDK | P5 | Kế toán |
| 2 | Ngưỡng dung sai thời gian xử lý webhook timeout của worker đối soát là bao nhiêu phút? | Worker job config | P5 | Backend |
