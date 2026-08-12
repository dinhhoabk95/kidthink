---
spec: PLAY-EVENT-INGESTION
title: Nạp sự kiện chơi
area: play
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Giao thức gửi lô event
  - Quy tắc idempotency và thứ tự
depends_on:
  - EVENT-CATALOG
  - PLAY-SESSION-LIFECYCLE
---

# Nạp sự kiện chơi

## 1. Objective

Đưa event từ tablet của trẻ vào DB **đúng một lần mỗi event**, trên mạng chập chờn, mà
không làm chậm gameplay.

[`event-catalog.md`](../00-foundation/event-catalog.md) sở hữu *tên và schema*. Spec này sở hữu *giao thức truyền*.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Engine | Buffer, đánh `seq`, flush |
| Server | Xác thực, khử trùng, ghi |

## 3. Entry points

`POST /api/users/play-sessions/{uuid}/events` · `POST /api/guest/play-sessions/{uuid}/events`.

## 4. Main flow

1. Engine `emit()` → buffer bộ nhớ, `seq` tăng dần **trong phiên**.
2. Mỗi 10 giây ghi buffer sang IndexedDB.
3. Flush khi: đủ 20 event · hết 10 giây · phiên kết thúc · `visibilitychange` ẩn.
4. Trang ẩn → `navigator.sendBeacon`. Còn lại → `fetch` có retry.
5. Server: ownership phiên → phiên `in_progress` → tên event hợp lệ → payload đúng schema →
   `seq` chưa thấy → INSERT.
6. Trả `{ accepted, skipped, last_seq }`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Lô trùng hoàn toàn | **200**, `accepted = 0` |
| Trùng một phần | Ghi phần mới, bỏ phần trùng, 200 |
| `seq` lùi so với `last_seq` đã ghi | **409** `EVENT_OUT_OF_ORDER` + log — client lỗi |
| Tên event lạ | **422**, không ghi lô |
| Payload thừa field | Strip field thừa, ghi phần hợp lệ, log cảnh báo |
| Phiên đã `completed` | Bỏ, trả **200** — không làm client retry vô hạn |
| Phiên `abandoned` | idem |
| Lô > 100 event | **413** |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ING-01` | Idempotent theo `(session_uuid, seq)`, ép ở **PK của DB** | Mạng yếu gửi lại là chuyện thường, không phải ngoại lệ |
| `BR-ING-02` | Event tới sau khi phiên terminal → **200**, bỏ | Trả lỗi làm client retry mãi |
| `BR-ING-03` | Tên event lạ → **422 cho cả lô** | Bảo vệ schema; nửa lô ghi nửa lô không là trạng thái khó gỡ |
| `BR-ING-04` | Ownership phiên kiểm ở **DB**, người khác → **404** | Bảo mật dữ liệu phiên chơi, tránh nạp event vào phiên của tài khoản khác |
| `BR-ING-05` | Cấm — **NEVER chặn gameplay** để chờ ingest thành công | Trẻ không được chờ mạng |
| `BR-ING-06` | Flush khi trang ẩn dùng `sendBeacon` | `fetch` bị huỷ khi trang unload |
| `BR-ING-07` | Rate limit riêng, rộng | Trẻ chơi liên tục là bình thường |
| `BR-ING-08` | Cấm — **NEVER nhận `score`** trong payload | `BR-EVT-05` |

## 7. Data

### 7.1 Giao thức lô

```jsonc
// Request
{ "events": [ { "seq": 12, "event_name": "answer_correct", "occurred_at_ms": 8421,
                "payload": { "round_index": 2, "attempt_index": 1, "elapsed_ms": 1830 } } ] }
// Response
{ "accepted": 18, "skipped": 2, "last_seq": 29 }
```

### 7.2 Ngưỡng

| Tham số | Giá trị |
|---|---|
| Lô tối đa | 100 event |
| Kích thước body | ≤ 64 KB |
| Ngưỡng flush theo số | 20 event |
| Ngưỡng flush theo thời gian | 10 giây |
| Rate limit | 600/IP · 300/account · 10 phút, theo phiên |
| Chấp nhận event trễ | ≤ 24 giờ |

### 7.3 `seq`

Số nguyên tăng dần **bắt đầu từ 1**, liên tục trong phiên. `game_started` luôn là `seq = 1`.
Khoảng trống trong `seq` là dấu hiệu mất event — server log cảnh báo, không từ chối.

## 8. API contract

### `POST /api/users/play-sessions/{uuid}/events`

| | |
|---|---|
| Auth | `requireUserAuth()` + ownership |
| Body | §7.1 |
| 200 | `{ accepted, skipped, last_seq }` |
| 404 | Phiên không tồn tại hoặc không thuộc caller |
| 409 | `EVENT_OUT_OF_ORDER` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 422 | `VALIDATION_FAILED` |
| 429 | `RATE_LIMITED` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-ING-01 — gửi lại lô y hệt không nhân đôi
  Given client đã gửi thành công lô seq 1..20
  When client gửi lại đúng lô đó
  Then trả 200 với accepted = 0 và skipped = 20
  And số hàng telemetry_events không đổi

Scenario: BR-ING-01 — idempotent ép ở tầng DB
  When chèn trực tiếp hai hàng cùng session_uuid và seq
  Then vi phạm khoá chính

Scenario: BR-ING-02 — event sau khi phiên đóng trả 200
  Given một phiên đã completed
  When client gửi thêm event
  Then trả 200
  And không hàng nào được ghi

Scenario: BR-ING-03 — tên lạ từ chối cả lô
  Given một lô 20 event, trong đó có 1 event tên lạ
  When gửi lô
  Then trả 422
  And không hàng nào trong lô được ghi

Scenario: BR-ING-05 — ingest lỗi không chặn gameplay
  Given server trả 500 cho request event
  When trẻ tiếp tục chơi
  Then game không dừng
  And event vẫn vào buffer để gửi lại

Scenario: BR-ING-06 — trang ẩn dùng sendBeacon
  Given trẻ chuyển sang tab khác
  When visibilitychange kích hoạt
  Then flush dùng navigator.sendBeacon

Scenario: BR-ING-08 — score từ client bị bỏ
  When gửi game_completed kèm payload chứa score
  Then field score bị strip
  And điểm được server tính lại

Scenario: BR-ING-04 — người khác không gửi được
  Given phiên thuộc user A
  When user B gửi event
  Then trả 404

Scenario: offline flush đúng thứ tự
  Given trẻ chơi offline sinh seq 1..40
  When mạng có lại
  Then 40 hàng được ghi
  And thứ tự seq liên tục không khoảng trống
```

## 10. Boundaries

**Always**
- Idempotent theo `(session_uuid, seq)`.
- `sendBeacon` khi trang ẩn.
- Buffer bền trong IndexedDB.
- Trả 200 cho event tới phiên đã đóng.

**Ask first**
- Đổi ngưỡng lô, flush, hoặc rate limit.
- Đổi cửa sổ chấp nhận event trễ.

**Never**
- Chặn gameplay chờ ingest.
- Nhận `score` từ client.
- Ghi nửa lô khi có event không hợp lệ.
- Trả lỗi cho event tới phiên đã đóng.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Khoảng trống `seq` có cần cảnh báo mức nào không?~~ **Đóng 2026-08-09 (T13, `D-DD`)**: cảnh báo WARN ở server log khi gap > 1; không fail request để tránh đứt mạch client | Giám sát thất thoát dữ liệu | Đã đóng | D-DD |
| ~~2~~ | ~~Có nén payload event không?~~ **Đóng 2026-08-09 (T13, `D-DE`)**: không nén custom ở P1 (dùng HTTP/2 header compression); hoãn nén custom sang P3 | Hiệu năng truyền tải | Đã đóng | D-DE |

