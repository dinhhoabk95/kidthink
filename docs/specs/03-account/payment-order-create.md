---
spec: PAYMENT-ORDER-CREATE
title: Tạo đơn thanh toán
area: account
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Luồng chọn gói và tạo đơn
  - Hiển thị VietQR và hướng dẫn
depends_on:
  - PAYMENT-FLOW
  - PACKAGE-CATALOG
---

# Tạo đơn thanh toán

## 1. Objective

Từ "muốn mua" tới "đã chuyển khoản" với ít bước nhất, và **ít cơ hội sai nhất**.

Sai nội dung chuyển khoản là nguyên nhân số một làm đối chiếu thủ công thất bại — mọi thiết
kế ở đây phục vụ việc đó.

## 2. Actors

User đã đăng nhập và **đã xác thực email**.

## 3. Entry points

`/pricing` · `/me/subscription/upgrade` · `POST /api/users/orders`.

## 4. Main flow

1. Chọn gói và chu kỳ.
2. Xem tóm tắt: gói, thời hạn, số tiền, quyền lợi mở thêm.
3. Tạo đơn → hiện màn hình chuyển khoản:
   - **Mã QR VietQR** (đã điền sẵn số tiền và nội dung)
   - Số tài khoản, tên chủ tài khoản, số tiền — **mỗi thứ một nút sao chép**
   - **Nội dung chuyển khoản** nổi bật nhất trên màn hình
4. Nút "Tôi đã chuyển khoản" → [`payment-proof-upload.md`](payment-proof-upload.md).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chưa xác thực email | Chặn, yêu cầu xác thực trước |
| Đã có đơn chưa xử lý cho gói đó | **409**, dẫn tới đơn cũ |
| Đã có gói đó còn hạn | Cho mua, nói rõ sẽ **cộng dồn** |
| Đơn quá 48h chưa nộp chứng từ | `expired`, tạo đơn mới được |
| Chọn add-on chưa bán | **400** `PACKAGE_NOT_SELLABLE` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-POC-01` | Số tiền đọc từ **`PACKAGE_CATALOG`**, không từ client | `BR-PKG-03` |
| `BR-POC-02` | **Nội dung chuyển khoản là mã đơn**, hiện nổi bật nhất | Sai nội dung là nguyên nhân số một của đối chiếu thất bại |
| `BR-POC-03` | Mỗi trường có **nút sao chép** | Gõ tay số tài khoản là gõ sai |
| `BR-POC-04` | Một gói chỉ có **một đơn chưa xử lý** tại một thời điểm | Nhiều đơn cùng gói làm đối chiếu rối |
| `BR-POC-05` | Nói rõ **cộng dồn** khi mua lúc còn hạn | Người dùng cần biết không mất phần đã trả |
| `BR-POC-06` | Đơn hết hạn sau **48 giờ** không nộp chứng từ | Giải phóng đơn chờ và tránh tồn đọng đơn ảo quá thời gian xử lý |
| `BR-POC-07` | Màn hình nói rõ **duyệt tay** và thời gian dự kiến | Kỳ vọng sai tạo ca hỗ trợ |
| `BR-POC-08` | Cấm — **NEVER hiện luồng này trên bề mặt trẻ** | `BR-PEN-04` |

## 7. Data

### 7.1 Màn hình chuyển khoản

| Vùng | Nội dung | Nhấn mạnh |
|---|---|---|
| QR | Mã VietQR đã điền sẵn | Lớn nhất |
| Nội dung chuyển khoản | `transfer_note` | **Nổi bật nhất trong phần chữ** |
| Số tiền | Đã định dạng | Cao |
| Ngân hàng, số TK, chủ TK | | Trung bình |
| Hướng dẫn | 3 bước ngắn | Thấp |
| Kỳ vọng | "Đơn được duyệt trong vòng 12 giờ làm việc. Bạn được dùng ngay 3 ngày trong lúc chờ." | Trung bình |

### 7.2 Sau khi tạo đơn

`payment_orders.status = pending` · `transfer_note` sinh từ `uuid` ·
`expires_at = now + 48h` · notification `order_submitted`.

## 8. API contract

### `POST /api/users/orders`

| | |
|---|---|
| Auth | `requireUserAuth()` + email đã xác thực |
| Body | `{ package_code, offer_code }` |
| 201 | `{ uuid, amount_vnd, transfer_note, qr_payload, bank_info, expires_at }` |
| 400 | `PACKAGE_NOT_SELLABLE` · `OFFER_NOT_FOUND` |
| 403 | Email chưa xác thực |
| 409 | `ORDER_ALREADY_PENDING` |

### `POST /api/users/orders/{uuid}/cancel`

Chỉ khi `pending`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-POC-01 — số tiền không nhận từ client
  When POST kèm amount_vnd = 1000
  Then đơn tạo với số tiền từ PACKAGE_CATALOG

Scenario: BR-POC-02 — nội dung chuyển khoản nổi bật
  When mở màn hình chuyển khoản
  Then transfer_note có cỡ chữ lớn nhất trong phần thông tin chữ
  And có nút sao chép riêng

Scenario: BR-POC-04 — một đơn chưa xử lý mỗi gói
  Given user đã có đơn pending cho PKG-premium
  When tạo đơn mới cho cùng gói
  Then trả 409
  And dẫn tới đơn cũ

Scenario: BR-POC-05 — nói rõ cộng dồn
  Given user có premium còn 100 ngày
  When chọn mua premium 365 ngày
  Then tóm tắt nêu rõ thời hạn mới là 465 ngày

Scenario: add-on chưa bán bị chặn
  When tạo đơn cho PKG-addon_ai
  Then trả 400 PACKAGE_NOT_SELLABLE

Scenario: BR-POC-06 — đơn hết hạn sau 48h
  Given đơn pending tạo 49 giờ trước
  When job order:expire chạy
  Then đơn chuyển expired

Scenario: BR-POC-07 — nói rõ duyệt tay
  When mở màn hình chuyển khoản
  Then có câu nêu thời gian duyệt dự kiến và quyền dùng tạm

Scenario: chưa xác thực email thì chặn
  Given user pending_verification
  When tạo đơn
  Then trả 403
```

## 10. Boundaries

**Always**
- Đọc giá từ catalog.
- Nội dung chuyển khoản nổi bật nhất.
- Nút sao chép mỗi trường.
- Nói rõ kỳ vọng thời gian duyệt.

**Ask first**
- Đổi thời hạn 48 giờ.
- Thêm phương thức thanh toán.

**Never**
- Nhận giá từ client.
- Nhiều đơn chưa xử lý cùng một gói.
- Hiện luồng này trên bề mặt trẻ.
- Cho tạo đơn khi chưa xác thực email.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Có hỗ trợ mã giảm giá ở MVP không? | P2 | Không ở MVP — xem [`package-catalog.md`](../00-foundation/package-catalog.md) (chỉ có 2 SKU chính, chưa có hạ tầng discount) | người quyết |
| 2 | Thời gian duyệt cam kết là bao lâu? Con số này lên màn hình nên phải giữ được | P2 | 12 giờ làm việc (kèm `SOFT_UNLOCK_DAYS = 3` cho phép dùng tạm ngay); trỏ sang [`payment-proof-upload.md`](payment-proof-upload.md) Q1 | người quyết |
