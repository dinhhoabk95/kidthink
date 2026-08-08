---
spec: HEALTHY-PLAY-LIMITS
title: Hạn mức giờ chơi lành mạnh
area: play
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Cách đếm thời gian chơi
  - Hành vi khi chạm hạn mức
depends_on:
  - ENTITLEMENT-MODEL
  - PLAY-SESSION-LIFECYCLE
  - CHILD-DATA-COMPLIANCE
---

# Hạn mức giờ chơi lành mạnh

## 1. Objective

Sản phẩm cho trẻ 3–6 **không được** tối ưu cho thời gian màn hình. Hạn mức là **tính
năng**, không phải ràng buộc kỹ thuật — nó là lý do phụ huynh tin sản phẩm.

Dừng phải **êm**: trẻ đang chơi dở không bị cắt ngang.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Trẻ | Nhận thông báo hết giờ bằng hình ảnh thân thiện |
| Người lớn | Đặt hạn mức mỗi trẻ, xem thời gian đã dùng |
| Hệ thống | Đếm, chặn phiên mới |

## 3. Entry points

| Nơi | |
|---|---|
| `/me/children/{uuid}/settings` | Đặt hạn mức |
| `assertContentAccess` bước 6 | Chặn phiên mới |
| `child_daily_stats.play_minutes` | Nguồn đếm |

## 4. Main flow

1. Người lớn đặt `daily_play_cap_minutes` cho từng trẻ, trong trần của gói.
2. Mỗi phiên kết thúc → cộng `duration_ms` vào `child_daily_stats` của ngày ICT.
3. Mở phiên mới → kiểm còn hạn mức. Hết → **402** `DAILY_PLAY_CAP_REACHED`.
4. Trẻ thấy màn hình "hôm nay chơi đủ rồi" thân thiện, gợi ý hoạt động ngoài màn hình.
5. Nửa đêm ICT → hạn mức đầy lại.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Hết hạn mức **giữa phiên** | Phiên hiện tại **chạy hết** — `BR-HPL-02` |
| Người lớn tăng hạn mức giữa ngày | Có hiệu lực ngay |
| Người lớn cấp thêm giờ một lần | Qua Parent Gate, cộng vào ngày hôm đó, ghi lại |
| Nhiều trẻ cùng tài khoản | Hạn mức **theo từng trẻ**, không dùng chung |
| Đổi múi giờ thiết bị | Server dùng ICT, không dùng giờ thiết bị |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-HPL-01` | Hạn mức **theo từng trẻ**, không theo tài khoản | Hai anh em có nhu cầu khác nhau |
| `BR-HPL-02` | Hết hạn mức Cấm — **NEVER cắt phiên đang chạy** | Cắt ngang lúc trẻ đang chơi là thiệt hại lớn hơn |
| `BR-HPL-03` | Ranh giới ngày theo **ICT (UTC+7)**, không giờ thiết bị | Đổi giờ thiết bị là cách lách rõ ràng nhất |
| `BR-HPL-04` | Màn hình hết giờ Cấm — **NEVER mang giọng trách** hay đếm ngược gây áp lực | |
| `BR-HPL-05` | Cấm — **NEVER cơ chế kéo dài thời gian chơi** — không streak ép buộc, không "chơi thêm để mở khoá", không thông báo dụ quay lại | Vi phạm nguyên tắc thiết kế cho trẻ và `BR-CDC-09` |
| `BR-HPL-06` | Cấp thêm giờ **phải qua Parent Gate** | Trẻ không tự cấp thêm cho mình |
| `BR-HPL-07` | Thời gian đếm là thời gian **phiên thật**, trừ thời gian `paused` | Tab mở nền không phải thời gian chơi |
| `BR-HPL-08` | Trần của gói là **trần**, người lớn đặt thấp hơn được, không cao hơn | |

## 7. Data

### 7.1 Trần theo gói

| Gói | Trần `daily_play_cap_minutes` | Mặc định |
|---|---:|---:|
| Guest | không đếm | — |
| Login (không gói) | 30 | 30 |
| `standard` | 60 | 45 |
| `premium` | 90 | 60 |

Mặc định **thấp hơn trần** — người lớn phải chủ động tăng, thay vì hệ thống mặc định tối đa.

### 7.2 Đếm

```
play_minutes(child, date_ict) = Σ (duration_ms − paused_ms) / 60000
  trên mọi play_sessions của trẻ đó có completed_at hoặc abandoned trong ngày ICT
```

Phiên `in_progress` tính theo thời gian đã trôi, cập nhật khi nhận lô event.

### 7.3 Màn hình hết giờ

Hình ảnh mascot vẫy tay · lời tiếng Việt ấm áp ("Hôm nay bé chơi giỏi lắm rồi! Mai mình chơi
tiếp nhé.") · gợi ý **2 hoạt động ngoài màn hình** lấy từ lesson có `kind = offline` ·
không nút "chơi thêm" · nút duy nhất dẫn qua Parent Gate.

## 8. API contract

### `GET /api/users/children/{uuid}/play-budget`

200 → `{ cap_minutes, used_minutes, remaining_minutes, resets_at }`.

### `PATCH /api/users/children/{uuid}/settings`

Body `{ daily_play_cap_minutes }`. **422** nếu vượt trần gói.

### `POST /api/users/children/{uuid}/grant-extra-time`

Body `{ minutes, gate_token }`. Tối đa 30 phút/ngày. Ghi lại.

## 9. Acceptance criteria

```gherkin
Scenario: BR-HPL-02 — hết giờ không cắt phiên đang chạy
  Given trẻ còn 1 phút và đang trong một phiên
  When hạn mức về 0
  Then phiên hiện tại hoàn thành được
  And phiên mới trả 402

Scenario: BR-HPL-03 — ranh giới ngày theo ICT
  Given trẻ dùng hết hạn mức lúc 23:50 ICT
  When đồng hồ sang 00:01 ICT
  Then remaining_minutes đầy lại
  And không reset lúc 00:00 UTC

Scenario: BR-HPL-03 — đổi giờ thiết bị không lách được
  Given trẻ đã hết hạn mức
  When đổi múi giờ thiết bị về ngày hôm sau
  Then vẫn trả 402

Scenario: BR-HPL-01 — hạn mức theo từng trẻ
  Given tài khoản có 2 trẻ
  When trẻ A dùng hết hạn mức
  Then trẻ B vẫn chơi được đầy đủ

Scenario: BR-HPL-08 — không đặt cao hơn trần gói
  Given user gói standard, trần 60 phút
  When đặt cap = 90
  Then trả 422

Scenario: BR-HPL-06 — cấp thêm giờ qua cổng phụ huynh
  When gọi grant-extra-time không có gate_token hợp lệ
  Then trả 403

Scenario: BR-HPL-05 — không có cơ chế kéo dài
  When quét UI bề mặt trẻ
  Then không có nút chơi thêm, streak ép buộc, hay đếm ngược tạo áp lực

Scenario: BR-HPL-04 — màn hình hết giờ tích cực
  When màn hình hết giờ hiện ra
  Then nội dung mang giọng khích lệ
  And có gợi ý hoạt động ngoài màn hình

Scenario: BR-HPL-07 — tab nền không tính giờ
  Given trẻ mở game rồi chuyển tab 20 phút
  Then thời gian đó không cộng vào play_minutes
```

## 10. Boundaries

**Always**
- Đếm theo từng trẻ, theo ICT.
- Cho phiên đang chạy hoàn thành.
- Trừ thời gian `paused`.
- Mặc định thấp hơn trần.

**Ask first**
- Đổi trần theo gói.
- Đổi giới hạn cấp thêm giờ.

**Never**
- Cắt phiên đang chạy.
- Dùng giờ thiết bị.
- Cơ chế kéo dài thời gian chơi.
- Giọng trách trong màn hình hết giờ.
- Cho trẻ tự cấp thêm giờ.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | 30/60/90 phút có khớp khuyến nghị thời gian màn hình cho trẻ 3–6 không? Cần đối chiếu nguồn y tế | P1 |
| 2 | Có cần hạn mức theo tuần bên cạnh theo ngày không? | P3 |
| 3 | Gợi ý hoạt động ngoài màn hình lấy từ đâu khi `lessons` chưa có (P1)? | P1 |
