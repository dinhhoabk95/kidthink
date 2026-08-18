---
spec: NOTIFICATION-SERVICE
title: Dịch vụ thông báo
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-13
owns:
  - Danh sách loại thông báo
  - Logical notification và delivery đa kênh
  - Email qua AWS SES SMTP
  - Quy tắc nội dung thông báo
depends_on:
  - JOB-QUEUE
  - CHILD-DATA-COMPLIANCE
---

# Dịch vụ thông báo

## 1. Objective

Người dùng phải biết khi trạng thái đổi mà họ không đang nhìn màn hình — đơn được duyệt,
gói sắp hết hạn, báo cáo tuần sẵn sàng.

MVP kích hoạt **một delivery channel: email** qua Nodemailer → AWS SES SMTP. Domain được tách
thành một logical notification và nhiều delivery adapter để không phải đổi producer khi thêm
kênh. Lịch sử User xem lại do [`../03-account/notification-inbox.md`](../03-account/notification-inbox.md)
sở hữu; FCM Web là P5, do [`browser-push.md`](browser-push.md) sở hữu và không nằm trong
Task #83.

## 2. Actors

| Actor | Nhận gì |
|---|---|
| User | Email giao dịch + email định kỳ; P5 có inbox và FCM Web trên bề mặt người lớn |
| Manager | Email vận hành |
| Trẻ | Cấm **Không nhận gì.** Không email, không push, không inbox |

## 3. Entry points

| Nơi | Ghi chú |
|---|---|
| `packages/notification` | Domain event, typed renderer, channel driver và provider adapter |
| `notifications` · `notification_deliveries` | Logical notification và trạng thái từng kênh |
| Job `email:send` | Consumer của delivery `email` |
| `POST /api/system/notifications/ses-events` | Nhận delivery/bounce/complaint từ SES→SNS |
| `/me/settings/notifications` | User bật/tắt loại định kỳ |

**D-BU** (T15, 2026-08-09): `depends_on: JOB-QUEUE` (P1) là cạnh đảo phase thật, đã xử lý ở
[`roadmap.md`](../roadmap.md) — job `email:send` chạy trên khung `packages/queue`/`apps/worker`
tối thiểu mà [`backup-and-restore.md`](backup-and-restore.md) (`D-BT`) đã bắt buộc dựng từ bước
8b. Không chờ [`job-queue.md`](job-queue.md) đầy đủ ở P1.

## 4. Main flow

1. Sự kiện nghiệp vụ xảy ra → INSERT một `notifications` và delivery `email` **trong cùng
   transaction**.
2. Enqueue `email:send` với `jobId = notification_delivery_id`.
3. Consumer claim delivery có điều kiện, render template MJML đã validate, rồi gửi qua pool
   SMTP TLS của Nodemailer tới endpoint SES đúng region.
4. Thành công → ghi `dispatched_at`, `provider_message_id` và stable `message_id`. Fail → retry
   tối đa 5 lần với backoff; hết retry → `failed` + alert.
5. SES gửi delivery/bounce/complaint qua SNS; webhook xác minh chữ ký trước khi cập nhật delivery
   và suppression state.

SMTP không có giao dịch nguyên tử với PostgreSQL. Nếu SES đã nhận mail nhưng worker chết trước
khi commit kết quả, retry có thể tạo bản trùng. `jobId`, conditional claim và stable `Message-ID`
giảm duplicate trong phạm vi ứng dụng nhưng **không được mô tả là exactly-once**.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| User đã opt-out loại đó | Ghi logical notification + delivery `suppressed`; không gửi |
| Email bounce cứng/complaint | Đánh dấu địa chỉ `bouncing`, dừng loại định kỳ; email bảo mật giao dịch chỉ retry khi policy cho phép |
| Provider lỗi trước khi nhận mail | Retry; backlog cao → alert |
| SNS signature sai hoặc topic không allow-list | 400, không cập nhật state, log security event không chứa payload nhạy cảm |
| Tài khoản `deleted` | Cấm tạo delivery; event tồn tại trước đó bị suppress |
| Kênh chưa kích hoạt (`fcm_web`) | Producer không enqueue; không fallback âm thầm từ email sang push |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-NOT-01` | Email **giao dịch** không opt-out được; email **định kỳ** phải opt-out được | Xác thực email và duyệt thanh toán là một phần của dịch vụ |
| `BR-NOT-02` | Cấm — **NEVER gửi bất cứ gì tới trẻ** | Trẻ không có tài khoản, không có email |
| `BR-NOT-03` | Cấm — **NEVER PII của trẻ trong nội dung email** ngoài `display_name` mà chính người lớn đặt | [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) cấm mọi PII trẻ ra ngoài hệ thống; email là ngoài hệ thống |
| `BR-NOT-04` | INSERT logical notification và delivery bắt buộc trong **cùng transaction** với sự kiện | Đơn được duyệt mà không có thông báo là ca hỗ trợ |
| `BR-NOT-05` | `jobId = notification_delivery_id`, claim delivery có điều kiện và stable `Message-ID`; Cấm gọi cơ chế này là exactly-once | Queue dedup chặn hai worker cùng gửi, nhưng không thể làm SMTP và DB commit nguyên tử |
| `BR-NOT-06` | Cấm — **NEVER email tiếp thị ở MVP** | Chưa có cơ chế đồng ý tiếp thị tách riêng |
| `BR-NOT-07` | Mọi email có link huỷ đăng ký cho loại định kỳ | CAN-SPAM và GDPR bắt buộc; thiếu link là rủi ro pháp lý |
| `BR-NOT-08` | Cấm — **NEVER tracking pixel** trong email tới người dùng của sản phẩm trẻ em | Tracking pixel thu dữ liệu hành vi không cần thiết từ sản phẩm hướng trẻ em |
| `BR-NOT-09` | Producer chỉ tạo logical notification + delivery theo interface domain; Cấm import Nodemailer, MJML hay SDK provider ngoài `packages/notification` | Đa hình chỉ có giá trị khi producer không biết provider cụ thể |
| `BR-NOT-10` | Email production dùng Nodemailer pool tới **AWS SES SMTP** qua TLS; SMTP credential theo region, tách khỏi AWS credential và không vào repo | Đây là provider/transport đã chốt; nhầm credential hoặc bỏ TLS làm mất mail hay lộ secret |
| `BR-NOT-11` | Sự kiện SES→SNS chỉ được xử lý sau khi xác minh signature, topic ARN, timestamp và certificate URL thuộc AWS allow-list | Webhook giả có thể suppress email hoặc làm sai lịch sử delivery; certificate URL tuỳ ý còn mở SSRF |
| `BR-NOT-12` | Một logical notification có tối đa một delivery active trên mỗi channel; trạng thái provider nằm ở `notification_deliveries`, không nhân bản notification | Tách nội dung cần xem lại khỏi trạng thái kỹ thuật của từng kênh |
| `BR-NOT-13` | FCM Web là kênh P5 best-effort; inbox là nguồn xem lại. Cấm — **NEVER** gửi FCM tới Child profile | Push có thể bị trình duyệt/OS bỏ; trẻ không phải recipient hệ thống |

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

### 7.2 `notifications` — logical event

`id` · `uuid` UNIQUE · `recipient_type` (`user`\|`manager`) · `recipient_id` · `code` ·
`payload` JSONB allow-list · `title` · `body` · `action_url` nội bộ · `occurred_at` ·
`created_at`.

`title`/`body` là snapshot tiếng Việt đã render an toàn để lịch sử không đổi khi template đổi.
Không chứa token xác thực, secret, provider credential hay PII trẻ ngoài contract.

### 7.3 `notification_deliveries` — một hàng mỗi channel

`id` · `notification_id` FK · `channel` (`email`; `fcm_web` chỉ thêm ở P5) · `status`
(`queued`\|`dispatched`\|`failed`\|`suppressed`) · `attempt_count` · `suppressed_reason` ·
`message_id` · `provider_message_id` · `last_error_code` · `dispatched_at` · `created_at` ·
`updated_at`.

UNIQUE partial bảo đảm tối đa một delivery active cho `(notification_id, channel)`.
Endpoint FCM và read state không thuộc bảng này; xem hai spec P5 ở Objective.

### 7.4 Quy tắc nội dung và template

Tiếng Việt · nói rõ **làm gì tiếp** · không giọng ép buộc ("đừng bỏ lỡ!", đếm ngược) ·
không so sánh trẻ với trẻ khác · link chỉ tới path nội bộ allow-list.

Template `.mjml` nằm trong repo, strict validation trong gate. Runtime chỉ truyền biến typed đã
escape; không nhận template/HTML do User hay Manager gửi thẳng. Bắt buộc có bản plain text.

## 8. API contract

### `GET /api/users/notification-preferences` · `PUT` cùng path

Body `{ weekly_progress: bool, content_new: bool }`. Loại giao dịch không xuất hiện.

### `POST /api/system/notifications/ses-events`

Nhận SNS envelope từ topic allow-list. Xác minh signature trước parse event; xử lý idempotent theo
SNS message id + SES message id. 204 cho event hợp lệ đã xử lý hoặc đã thấy; 400 cho envelope sai.

Inbox API thuộc [`notification-inbox.md`](../03-account/notification-inbox.md), không đặt ở đây.

## 9. Acceptance criteria

```gherkin
Scenario: BR-NOT-04 — duyệt đơn luôn kèm notification và delivery
  Given manager approve một đơn thanh toán
  Then một hàng notifications code order_approved được tạo trong cùng transaction
  And một hàng notification_deliveries channel email được tạo trong transaction đó

Scenario: BR-NOT-05 — retry sau success không gửi lại
  Given delivery email đã có status dispatched
  When job cùng notification_delivery_id chạy lại
  Then conditional claim thất bại
  And không lời gọi SMTP thứ hai được tạo

Scenario: BR-NOT-05 — crash boundary không bị gọi là exactly-once
  Given SES nhận email nhưng worker chết trước khi ghi dispatched
  When job retry
  Then hệ thống dùng cùng stable Message-ID
  And tài liệu/metric không tuyên bố exactly-once delivery

Scenario: BR-NOT-01 — không opt-out được email giao dịch
  When user gọi PUT notification-preferences với order_approved = false
  Then trả 422
  And loại đó không nằm trong schema cho phép

Scenario: BR-NOT-02 — không gửi gì tới trẻ
  When quét mọi recipient của notifications
  Then không recipient nào là child_profile

Scenario: BR-NOT-08 — không tracking pixel
  When compile mọi template email
  Then không template nào chứa ảnh 1x1 hay URL theo dõi mở

Scenario: BR-NOT-10 — SMTP dùng TLS và pool
  When khởi tạo email driver production
  Then Nodemailer dùng pool tới SES SMTP endpoint theo region
  And TLS certificate được xác minh

Scenario: BR-NOT-11 — SNS giả không đổi delivery
  Given request có SNS signature sai
  When gọi SES event webhook
  Then trả 400
  And không notification_deliveries nào đổi trạng thái

Scenario: BR-NOT-11 — certificate URL ngoài AWS bị chặn
  Given SNS envelope trỏ SigningCertURL tới host không thuộc allow-list AWS
  When gọi SES event webhook
  Then trả 400 trước khi fetch URL

Scenario: opt-out được tôn trọng
  Given user tắt weekly_progress
  When job sinh báo cáo tuần chạy
  Then delivery có status suppressed
  And không email nào được gửi
```

## 10. Boundaries

**Always**
- INSERT logical notification + delivery trong cùng transaction với sự kiện.
- Channel driver nằm sau interface của `packages/notification`.
- Email qua SES SMTP có TLS, pool, typed MJML renderer và plain-text fallback.
- Xác minh SES→SNS trước khi cập nhật delivery.

**Ask first**
- Thêm loại thông báo.
- Thêm hoặc kích hoạt channel mới.
- Đổi tần suất email định kỳ.

**Never**
- Gửi bất cứ gì tới trẻ.
- Email tiếp thị ở MVP.
- Tracking pixel.
- Giọng ép buộc hoặc so sánh trẻ.
- Tuyên bố SMTP exactly-once.
- Import provider SDK ngoài `packages/notification`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Provider email nào?~~ **Đóng 2026-08-13 (`D-ND`)**: AWS SES qua SMTP, Nodemailer transport, MJML template; SES→SNS cho delivery/bounce/complaint | — | Đã đóng | D-ND |
| 2 | Báo cáo tuần gửi thứ mấy, giờ nào ICT? | Gửi mail P3 | P3 | người quyết |
