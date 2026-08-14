---
spec: NOTIFICATION-ADMIN
title: Quản lý thông báo
area: admin
status: approved
mvp: true
phase: P2
reviewed: 2026-08-13
owns:
  - Bề mặt theo dõi thông báo đã gửi
  - Soạn nội dung template thông báo
depends_on:
  - NOTIFICATION-SERVICE
  - ADMIN-AUTH
---

# Quản lý thông báo

## 1. Objective

Trả lời **"email đó đã gửi chưa"** khi User nói không nhận được — câu hỏi hỗ trợ phổ biến
nhất của mọi hệ thống có email.

Và cho phép sửa nội dung template không cần deploy.

## 2. Actors

`super_admin` duy nhất. `content_reviewer` không thấy.

## 3. Entry points

`/notifications` · `/notifications/templates` · `GET /api/managers/notifications`.

## 4. Main flow

1. Mở `/notifications`, thấy nhật ký gửi gần đây.
2. Lọc theo người nhận, loại, trạng thái.
3. Mở một hàng → nội dung đã gửi, thời gian, `provider_message_id`, lỗi nếu có.
4. Gửi lại được một thông báo giao dịch thất bại.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Gửi lại | Tạo `notification` mới, không sửa hàng cũ |
| Địa chỉ `bouncing` | Hiện cảnh báo, không cho gửi lại loại định kỳ |
| Template lỗi cú pháp | Chặn lưu, hiện lỗi |
| Người nhận đã xoá tài khoản | Cấm gửi lại được |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-NTA-01` | Gửi lại tạo **hàng mới**, không sửa hàng cũ | Nhật ký gửi là bằng chứng |
| `BR-NTA-02` | Cấm — **NEVER gửi hàng loạt tuỳ ý** từ màn hình này | Không có cơ chế đồng ý tiếp thị — `BR-NOT-06` |
| `BR-NTA-03` | Template sửa được không cần deploy, nhưng đi qua **duyệt** | Email sai gửi đi không thu hồi được |
| `BR-NTA-04` | Nội dung email hiển thị **đã che** phần nhạy cảm (token đặt lại mật khẩu) | Manager không cần thấy token của User |
| `BR-NTA-05` | Chỉ `super_admin` | Giới hạn quyền quản lý thông báo hệ thống cho đúng vai trò quản trị tối cao theo `BR-ADA-02` |
| `BR-NTA-06` | Cấm — **NEVER template gửi tới trẻ** | `BR-NOT-02` |
| `BR-NTA-07` | Template có biến bắt buộc; thiếu biến → chặn lưu | Email thiếu biến hiện `{{name}}` cho người dùng thật |

## 7. Data

### 7.1 Nhật ký

Thời gian · người nhận (loại + email rút gọn) · loại · trạng thái · `provider_message_id` ·
lỗi · nút gửi lại (chỉ loại giao dịch).

### 7.2 Template

`code` · `subject_vi` · `body_vi` (rich text hạn chế) · biến khả dụng · `content_version` ·
`status`.

Biến theo loại, ví dụ `order_approved`: `{{display_name}}` `{{package_name}}`
`{{expires_at}}`.

### 7.3 Preview template

Render với dữ liệu mẫu, xem desktop và mobile.

## 8. API contract

### `GET /api/managers/notifications`

Query `recipient` `code` `status` `from` `to`. Trần 100.

### `POST /api/managers/notifications/{id}/resend`

Chỉ loại giao dịch. 409 nếu người nhận đã xoá tài khoản.

### `PATCH /api/managers/notification-templates/{code}/{version}`

Đi qua vòng đời [`content-lifecycle.md`](../00-foundation/content-lifecycle.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-NTA-01 — gửi lại tạo hàng mới
  Given một notification thất bại
  When gửi lại
  Then có hàng notifications thứ hai
  And hàng đầu tiên không đổi

Scenario: BR-NTA-02 — không gửi hàng loạt
  When quét route admin
  Then không route nào gửi thông báo tới nhiều người nhận cùng lúc

Scenario: BR-NTA-04 — che nội dung nhạy cảm
  Given một email đặt lại mật khẩu đã gửi
  When manager xem nội dung
  Then token bị che

Scenario: BR-NTA-07 — thiếu biến chặn lưu
  When lưu template thiếu biến bắt buộc
  Then trả 422 nêu biến nào thiếu

Scenario: BR-NTA-03 — template đi qua duyệt
  Given manager sửa một template
  When lưu
  Then template ở trạng thái draft
  And chưa dùng cho email mới cho tới khi published

Scenario: BR-NTA-05 — content_reviewer bị chặn
  Given manager role content_reviewer
  When gọi GET /api/managers/notifications
  Then trả 403
```

## 10. Boundaries

**Always**
- Gửi lại tạo hàng mới.
- Che nội dung nhạy cảm.
- Template đi qua vòng đời duyệt.

**Ask first**
- Thêm loại thông báo.
- Thêm biến vào template.

**Never**
- Gửi hàng loạt tuỳ ý.
- Sửa hàng nhật ký đã gửi.
- Template gửi tới trẻ.
- Cho `content_reviewer` truy cập.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Provider nào cung cấp trạng thái bounce/delivery?~~ **Đóng lại 2026-08-13**: AWS SES qua **SMTP**; `packages/notification` dùng Nodemailer pool + MJML, không dùng `@aws-sdk/client-ses` cho đường gửi. SES→SNS cung cấp delivery/bounce/complaint, webhook xác minh chữ ký rồi lưu ở `notification_deliveries` | P2 | Đã đóng | D-CE |
