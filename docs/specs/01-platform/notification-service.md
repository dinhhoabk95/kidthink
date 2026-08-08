---
spec: NOTIFICATION-SERVICE
title: Dịch vụ thông báo
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-08-08
owns:
  - Danh sách loại thông báo
  - Kênh gửi và quy tắc chọn kênh
  - Quy tắc nội dung thông báo
depends_on:
  - JOB-QUEUE
  - CHILD-DATA-COMPLIANCE
---

# Dịch vụ thông báo

## 1. Objective

Người dùng phải biết khi trạng thái đổi mà họ không đang nhìn màn hình — đơn được duyệt,
gói sắp hết hạn, báo cáo tuần sẵn sàng.

MVP có **một kênh: email**. Push và in-app là P4 — thêm kênh trước khi có nội dung đáng gửi
là xây hạ tầng cho việc chưa tồn tại.

## 2. Actors

| Actor | Nhận gì |
|---|---|
| User | Email giao dịch + email định kỳ (opt-out được) |
| Manager | Email vận hành |
| Trẻ | Cấm **Không nhận gì.** Không email, không push |

## 3. Entry points

| Nơi | |
|---|---|
| `notifications` bảng | Hàng đợi logic |
| Job `email:send` | Consumer |
| `/me/settings/notifications` | User bật/tắt loại định kỳ |

## 4. Main flow

1. Sự kiện nghiệp vụ xảy ra → INSERT `notifications` **trong cùng transaction**.
2. Enqueue `email:send` với `jobId = notification_id`.
3. Consumer render template, gửi, ghi `dispatched_at` + `provider_message_id`.
4. Fail → retry 5 lần backoff; hết retry → `failed` + alert.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| User đã opt-out loại đó | Ghi `notifications` với `suppressed_reason`, không gửi |
| Email bounce cứng | Đánh dấu địa chỉ `bouncing`, dừng gửi loại định kỳ, giữ giao dịch |
| Provider lỗi | Retry; backlog cao → alert |
| Tài khoản `deleted` | Cấm gửi gì |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-NOT-01` | Email **giao dịch** không opt-out được; email **định kỳ** phải opt-out được | Xác thực email và duyệt thanh toán là một phần của dịch vụ |
| `BR-NOT-02` | Cấm — **NEVER gửi bất cứ gì tới trẻ** | Trẻ không có tài khoản, không có email |
| `BR-NOT-03` | Cấm — **NEVER PII của trẻ trong nội dung email** ngoài `display_name` mà chính phụ huynh đặt | [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) cấm mọi PII trẻ ra ngoài hệ thống; email là ngoài hệ thống |
| `BR-NOT-04` | INSERT `notifications` trong **cùng transaction** với sự kiện | Đơn được duyệt mà không có thông báo là ca hỗ trợ |
| `BR-NOT-05` | `jobId = notification_id` — idempotent | Không gửi hai lần |
| `BR-NOT-06` | Cấm — **NEVER email tiếp thị ở MVP** | Chưa có cơ chế đồng ý tiếp thị tách riêng |
| `BR-NOT-07` | Mọi email có link huỷ đăng ký cho loại định kỳ | CAN-SPAM và GDPR bắt buộc; thiếu link là rủi ro pháp lý |
| `BR-NOT-08` | Cấm — **NEVER tracking pixel** trong email tới người dùng của sản phẩm trẻ em | COPPA cấm thu thập dữ liệu hành vi từ sản phẩm hướng trẻ em; tracking pixel thu chính dữ liệu đó |

## 7. Data

### 7.1 Loại thông báo MVP

| Code | Loại | Opt-out |
|---|---|:--:|
| `email_verification` | giao dịch | Cấm |
| `password_reset` | giao dịch | Cấm |
| `order_submitted` | giao dịch | Cấm |
| `order_approved` | giao dịch | Cấm |
| `order_rejected` | giao dịch | Cấm |
| `subscription_expiring` (trước 7 ngày) | giao dịch | Cấm |
| `subscription_expired` | giao dịch | Cấm |
| `weekly_progress` | định kỳ | |
| `content_new` | định kỳ | |
| `admin_order_pending` (tới Manager) | vận hành | Cấm |
| `admin_alert` (tới Manager) | vận hành | Cấm |

**11 loại.** Thêm loại mới = thêm vào bảng này trước.

### 7.2 Bảng `notifications`

`id` `uuid` · `recipient_type` (`user`\|`manager`) `recipient_id` · `code` · `payload` JSONB ·
`channel` (`email`) · `status` (`pending`\|`sent`\|`failed`\|`suppressed`) ·
`suppressed_reason` · `dispatched_at` · `provider_message_id` · `error` · `created_at`.

### 7.3 Quy tắc nội dung

Tiếng Việt · nói rõ **làm gì tiếp** · không giọng ép buộc ("đừng bỏ lỡ!", đếm ngược) ·
không so sánh trẻ với trẻ khác · có link tới trang liên quan.

## 8. API contract

### `GET /api/users/notification-preferences` · `PUT` cùng path

Body `{ weekly_progress: bool, content_new: bool }`. Loại giao dịch không xuất hiện.

## 9. Acceptance criteria

```gherkin
Scenario: BR-NOT-04 — duyệt đơn luôn kèm thông báo
  Given manager approve một đơn thanh toán
  Then một hàng notifications code order_approved được tạo trong cùng transaction

Scenario: BR-NOT-05 — không gửi hai lần
  Given job email:send đã chạy cho một notification
  When job đó chạy lại
  Then không email thứ hai được gửi

Scenario: BR-NOT-01 — không opt-out được email giao dịch
  When user gọi PUT notification-preferences với order_approved = false
  Then trả 422
  And loại đó không nằm trong schema cho phép

Scenario: BR-NOT-02 — không gửi gì tới trẻ
  When quét mọi recipient của notifications
  Then không recipient nào là child_profile

Scenario: BR-NOT-08 — không tracking pixel
  When render mọi template email
  Then không template nào chứa ảnh 1x1 hay URL theo dõi mở

Scenario: opt-out được tôn trọng
  Given user tắt weekly_progress
  When job sinh báo cáo tuần chạy
  Then notification có status suppressed
  And không email nào được gửi
```

## 10. Boundaries

**Always**
- INSERT `notifications` trong cùng transaction với sự kiện.
- `jobId = notification_id`.
- Link huỷ đăng ký cho loại định kỳ.

**Ask first**
- Thêm loại thông báo.
- Thêm kênh (push, in-app).
- Đổi tần suất email định kỳ.

**Never**
- Gửi bất cứ gì tới trẻ.
- Email tiếp thị ở MVP.
- Tracking pixel.
- Giọng ép buộc hoặc so sánh trẻ.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Provider email nào? Cần domain đã xác thực SPF/DKIM trước go-live | P2 |
| 2 | Báo cáo tuần gửi thứ mấy, giờ nào ICT? | P3 |
