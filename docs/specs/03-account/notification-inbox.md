---
spec: NOTIFICATION-INBOX
title: Hộp thư thông báo của User
area: account
status: implemented
mvp: false
phase: P5
reviewed: 2026-08-13
owns:
  - Danh sách thông báo User xem lại
  - Trạng thái đã đọc và số chưa đọc
depends_on:
  - NOTIFICATION-SERVICE
  - AUTH-TOKENS-SESSIONS
---

# Hộp thư thông báo của User

## 1. Objective

User xem lại các thay đổi quan trọng trong MindKid dù email hoặc FCM bị bỏ lỡ. Inbox hiển thị
**logical notification**, không hiển thị một hàng lặp cho mỗi channel. Nó là nguồn sự thật về
nội dung và trạng thái đọc; delivery log kỹ thuật vẫn thuộc
[`../01-platform/notification-service.md`](../01-platform/notification-service.md).

Outcome này được ưu tiên sau package core, nằm ở P5 cùng FCM Web nhưng có thể triển khai trước
push trong Task #84.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| User | phiên User hợp lệ | Xem danh sách, số chưa đọc, đánh dấu đã đọc |
| Trẻ | — | Cấm truy cập inbox hay thấy notification center |
| Manager | — | Không dùng inbox User; xem delivery log ở bề mặt admin riêng |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/me/notifications` | User | Danh sách cursor pagination |
| Notification bell trong `/me` | User | Số chưa đọc, không xuất hiện trong `/play` |
| `GET /api/users/notifications` | User | Logical notifications của chính User |
| `PATCH /api/users/notifications/{uuid}/read` | User | Idempotent mark-read |
| `POST /api/users/notifications/read-all` | User | Mark-read theo snapshot thời gian |

## 4. Main flow

1. Header người lớn gọi unread count đã giới hạn/cached ngắn.
2. User mở `/me/notifications`; server trả tối đa 50 logical notifications theo cursor
   `(occurred_at, uuid)` giảm dần.
3. Mỗi item dùng `title`, `body`, `action_url` snapshot; không phụ thuộc template hiện tại hay
   trạng thái email/FCM.
4. User mở item → mark read idempotent rồi đi tới internal action path allow-list.
5. “Đánh dấu tất cả đã đọc” chỉ cập nhật các notification có `occurred_at <= snapshot_at` để
   notification tới đồng thời không bị nuốt.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Email/FCM failed | Delivery không thành công | Item vẫn có trong inbox |
| Notification thuộc User khác | UUID hợp lệ nhưng khác owner | 404 |
| Action target không còn tồn tại | Nội dung bị archive/xoá hợp lệ | Item vẫn đọc được; action chuyển tới fallback `/me` |
| Notification mới tới khi đang read-all | `occurred_at > snapshot_at` | Giữ unread |
| Tài khoản deleted | Sau lifecycle xoá | Không còn API/session để đọc; retention theo account-deletion contract |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-NIB-01` | Một item inbox tương ứng đúng một logical notification, không một item mỗi delivery channel | User quan tâm sự kiện, không quan tâm provider gửi mấy lần |
| `BR-NIB-02` | Inbox chỉ hiển thị notification thuộc User hiện tại; record người khác trả 404 | Chặn IDOR và rò trạng thái tài khoản |
| `BR-NIB-03` | Delivery email/FCM failed hoặc suppressed không được xoá item inbox | Inbox là fallback đáng tin cậy khi channel ngoài hệ thống thất bại |
| `BR-NIB-04` | Title/body/action là snapshot khi tạo; đổi template không rewrite lịch sử | Lịch sử phải giải thích đúng điều User đã được báo lúc đó |
| `BR-NIB-05` | Bell và inbox Cấm — **NEVER** xuất hiện trên bề mặt trẻ `/play` | Notification người lớn làm gián đoạn và có thể lộ thông tin tài khoản |
| `BR-NIB-06` | Mark-read idempotent; read-all dùng `snapshot_at` server cấp | Tránh nuốt notification đến đồng thời |
| `BR-NIB-07` | Cursor pagination tối đa 50; Cấm endpoint “trả tất cả” | Lịch sử tăng liên tục, response không có trần sẽ thành DoS |
| `BR-NIB-08` | Action URL chỉ là internal path allow-list; target hỏng fallback `/me` | Chặn open redirect và link chết không thể phục hồi |

## 7. Data

**Đọc:** `notifications` thuộc User.
**Ghi:** `notification_reads`.

Schema cột canonical nằm ở
[`../01-platform/schema-identity-billing.md`](../01-platform/schema-identity-billing.md) §7.10c.
Read row chỉ có một owner qua `notification_id`; không copy `user_id` sang bảng phụ. Chưa có row
nghĩa là unread, có row với `read_at` nghĩa là đã đọc.

Retention lịch sử phải được Product chốt ở Task #84 trước migration; không hard-delete độc lập
với [`account-deletion.md`](account-deletion.md).

## 8. API contract

### `GET /api/users/notifications`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Query | `cursor?` · `limit?` (default 20, max 50) · `unread_only?` |
| 200 | `{ items: [{ uuid, code, title, body, action_url, occurred_at, read_at }], next_cursor, unread_count, snapshot_at }` |

### `PATCH /api/users/notifications/{uuid}/read`

| | |
|---|---|
| Auth | `requireUserAuth()` + CSRF |
| 200 | `{ uuid, read_at }`; gọi lại giữ timestamp đầu tiên |
| 404 | Không tồn tại hoặc thuộc User khác |

### `POST /api/users/notifications/read-all`

| | |
|---|---|
| Auth | `requireUserAuth()` + CSRF |
| Body | `{ snapshot_at }` lấy từ response list/count gần nhất |
| 200 | `{ marked_count, snapshot_at }` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-NIB-01 — hai channel vẫn là một item
  Given một notification có delivery email và fcm_web
  When User mở inbox
  Then chỉ có một item cho notification đó

Scenario: BR-NIB-02 — record người khác trả 404
  Given notification N thuộc User A
  When User B gọi PATCH N/read
  Then trả 404
  And read state không đổi

Scenario: BR-NIB-03 — delivery fail không xoá lịch sử
  Given email và FCM delivery đều failed
  When User mở inbox
  Then logical notification vẫn xuất hiện

Scenario: BR-NIB-06 — read-all không nuốt item mới
  Given response list có snapshot_at T
  And notification mới xảy ra sau T
  When User gọi read-all với T
  Then notification mới vẫn unread

Scenario: BR-NIB-05 — bề mặt trẻ không có inbox
  When render mọi route /play
  Then không bell, inbox item hay notification permission control nào xuất hiện

Scenario: BR-NIB-07 — không trả danh sách vô hạn
  When gọi list với limit=1000
  Then server chỉ trả tối đa 50 item hoặc từ chối validation
```

## 10. Boundaries

**Always**
- List và mutation scope theo User hiện tại.
- Một logical event là một item.
- Cursor có trần; read-all có snapshot.
- Inbox không phụ thuộc delivery success.

**Ask first**
- Đổi retention.
- Thêm archive/delete item cho User.
- Hiển thị thêm payload field.

**Never**
- Inbox/bell trên bề mặt trẻ.
- Provider status hoặc token trong response User.
- Action URL ngoài allow-list.
- Hard-delete lịch sử ngoài account-deletion contract.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Giữ lịch sử bao lâu và có cho User archive item không? | Migration + UI Task #84 | P5 | người quyết |
