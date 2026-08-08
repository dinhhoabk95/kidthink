---
spec: PAYMENT-PROOF-UPLOAD
title: Nộp chứng từ thanh toán
area: account
status: draft
mvp: true
phase: P2
reviewed: 2026-08-04
owns:
  - Luồng nộp chứng từ và nhận quyền tạm
depends_on:
  - PAYMENT-ORDER-CREATE
  - PAYMENT-FLOW
  - IMAGE-STORAGE
---

# Nộp chứng từ thanh toán

## 1. Objective

Chuyển từ "đã chuyển khoản" sang "đang chờ duyệt", và **mở quyền tạm ngay** để người đã trả
tiền không phải chờ.

Soft unlock tồn tại vì duyệt tay có độ trễ người. Nó là **tin tưởng có thời hạn** — 3 ngày,
và bị rút ngay nếu đơn bị từ chối.

## 2. Actors

User sở hữu đơn.

## 3. Entry points

`/me/orders/{uuid}/proof` · `POST /api/users/orders/{uuid}/proof`.

## 4. Main flow

1. Từ màn hình chuyển khoản, bấm "Tôi đã chuyển khoản".
2. Nhập **mã giao dịch** (từ app ngân hàng) + tải **ảnh chứng từ**.
3. Gửi → `status = submitted`, cấp entitlement `soft_unlock` **3 ngày**.
4. Màn hình xác nhận: "Bạn đã có thể dùng ngay. Chúng tôi sẽ xác nhận trong 12 giờ làm việc."
5. Notification `order_submitted`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Ảnh > 5 MB | Chặn ở client, nén hoặc yêu cầu chọn lại |
| Không có ảnh | Cho gửi **chỉ mã giao dịch**, cảnh báo duyệt sẽ chậm hơn |
| Nộp lại chứng từ | Cho phép khi còn `submitted`; thay ảnh, không tạo đơn mới |
| `soft_unlock` hết 3 ngày chưa duyệt | Quyền hết; đơn vẫn duyệt được và cấp lại đủ hạn |
| Đơn đã `approved` | Cấm nộp lại được |
| Đơn `expired` | Cấm nộp được, tạo đơn mới |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PPU-01` | Nộp chứng từ cấp `soft_unlock`, Cấm — **NEVER cấp `active`** | Ảnh chứng từ giả mạo được; duyệt tay là bước xác minh thật |
| `BR-PPU-02` | `soft_unlock` **3 ngày** (`SOFT_UNLOCK_DAYS`) | |
| `BR-PPU-03` | Ảnh lưu **private**, chỉ Manager mở qua signed URL | Chứa thông tin ngân hàng |
| `BR-PPU-04` | Mã giao dịch **bắt buộc**; ảnh tuỳ chọn nhưng khuyến nghị mạnh | Mã giao dịch là thứ đối chiếu được với sao kê |
| `BR-PPU-05` | Nộp lại **thay** ảnh cũ, không tạo đơn mới | Nhiều đơn cùng giao dịch làm đối chiếu rối |
| `BR-PPU-06` | Upload dùng client có CSRF, Cấm — **NEVER raw `$fetch`** | |
| `BR-PPU-07` | Màn hình xác nhận nói rõ **quyền tạm** và thời hạn | |
| `BR-PPU-08` | Cấm — **NEVER hiện luồng này trên bề mặt trẻ** | |

## 7. Data

### 7.1 Form

| Trường | Ràng buộc |
|---|---|
| `bank_txn_ref` | Bắt buộc, 4–64 ký tự |
| `proof` | Tuỳ chọn, jpeg/png/webp, ≤5 MB |

### 7.2 Sau khi nộp

`status = submitted` · `submitted_at` · `proof_path` (private) ·
entitlement `soft_unlock` với `expires_at = now + 3 ngày` · notification.

### 7.3 Trạng thái hiển thị cho User

| Trạng thái đơn | Hiển thị |
|---|---|
| `pending` | "Chờ bạn chuyển khoản" |
| `submitted` | "Đang chờ xác nhận — bạn đã có thể dùng ngay" |
| `under_review` | "Đang được xác nhận" |
| `approved` | "Đã kích hoạt" + ngày hết hạn |
| `rejected` | "Chưa xác nhận được" + lý do rút gọn + cách xử lý |
| `expired` | "Đơn đã hết hạn" + nút tạo đơn mới |

Lý do từ chối hiển thị **rút gọn và lịch sự** — không copy nguyên `admin_note` nội bộ.

## 8. API contract

### `POST /api/users/orders/{uuid}/proof`

| | |
|---|---|
| Auth | `requireUserAuth()` + ownership + CSRF |
| Body | multipart — `bank_txn_ref` · `proof?` |
| 200 | `{ status: "submitted", soft_unlock_until }` |
| 409 | `INVALID_STATUS_TRANSITION` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | `PAYMENT_PROOF_REQUIRED` — thiếu mã giao dịch |

## 9. Acceptance criteria

```gherkin
Scenario: BR-PPU-01 — nộp chứng từ không kích hoạt gói
  When nộp chứng từ
  Then entitlement có status soft_unlock
  And không phải active

Scenario: BR-PPU-02 — quyền tạm hết sau 3 ngày
  Given nộp chứng từ ngày D, chưa được duyệt
  When tới ngày D+4
  Then quyền premium không còn
  And đơn vẫn duyệt được

Scenario: duyệt sau khi soft_unlock hết vẫn cấp đủ hạn
  Given soft_unlock đã hết
  When manager duyệt đơn
  Then entitlement active với đủ duration_days

Scenario: BR-PPU-03 — ảnh không truy cập công khai
  Given một chứng từ đã nộp
  When truy cập URL S3 trực tiếp
  Then bị từ chối

Scenario: BR-PPU-04 — thiếu mã giao dịch bị chặn
  When nộp chỉ có ảnh, không có bank_txn_ref
  Then trả 422

Scenario: BR-PPU-05 — nộp lại thay ảnh cũ
  Given đã nộp chứng từ
  When nộp lại ảnh khác
  Then proof_path trỏ ảnh mới
  And vẫn là một đơn

Scenario: BR-PPU-07 — nói rõ quyền tạm
  When nộp thành công
  Then màn hình nêu rõ đã dùng được ngay và thời hạn tạm

Scenario: lý do từ chối hiển thị lịch sự
  Given đơn bị từ chối với admin_note nội bộ
  When user xem đơn
  Then hiện lý do rút gọn
  And không hiện nguyên văn ghi chú nội bộ
```

## 10. Boundaries

**Always**
- Cấp `soft_unlock`, không `active`.
- Lưu ảnh private.
- Bắt buộc mã giao dịch.
- Nói rõ quyền tạm và thời hạn.

**Ask first**
- Đổi `SOFT_UNLOCK_DAYS`.
- Bỏ yêu cầu mã giao dịch.

**Never**
- Kích hoạt gói khi nộp chứng từ.
- Ảnh chứng từ công khai.
- Raw `$fetch` cho upload.
- Hiện nguyên văn ghi chú nội bộ cho User.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | 3 ngày soft unlock có đủ nếu nộp vào cuối tuần không? | SLA duyệt |
| 2 | Có nên tự đọc mã giao dịch từ ảnh bằng OCR không? Giảm gõ sai nhưng thêm phụ thuộc | P4 |
