---
spec: PLAY-SESSION-LIFECYCLE
title: Vòng đời phiên chơi
area: play
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Máy trạng thái phiên chơi
  - Quy tắc tạo, hoàn tất, bỏ dở
depends_on:
  - GAME-CONFIG-DELIVERY
  - EVENT-CATALOG
  - CONTENT-VERSIONING
---

# Vòng đời phiên chơi

## 1. Objective

Phiên chơi là **đơn vị đo** của toàn hệ thống. Báo cáo, mastery, KPI nội dung đều dựng trên
nó. Nó phải mở đúng một lần, đóng đúng một lần, và luôn biết mình gắn với version nội dung
nào.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Trẻ | Người chơi |
| User | Sở hữu phiên (qua child profile) |
| Guest | Phiên ẩn danh, không lưu tiến độ |
| Manager | Phiên preview, `is_preview = true` |

## 3. Entry points

| Route | |
|---|---|
| `GET /api/{ns}/levels/{code}/config` | Tạo phiên như tác dụng phụ |
| `POST /api/{ns}/play-sessions/{uuid}/events` | Nạp event |
| `POST /api/{ns}/play-sessions/{uuid}/complete` | Hoàn tất |
| Job `sweep:abandoned` | Đóng phiên bỏ dở |

## 4. Main flow

```
1. Client gọi config → server gating → INSERT play_sessions status=in_progress
                                        ghim content_version, access_tier_at_start
2. Engine chạy, gửi event theo lô
3. Client gọi complete kèm seq cuối
4. Server: xác thực chuỗi event → tính điểm → cập nhật play_sessions
           → rollup:session → mastery_state (nếu đủ điều kiện)
5. Trả màn hình tổng kết tích cực
```

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Complete lần hai | **409** `SESSION_ALREADY_COMPLETED`, không tính lại |
| Không complete, không event 30 phút | `sweep:abandoned` đóng với `abandoned` |
| Phiên quá 4 giờ | `SESSION_EXPIRED` 410 khi gửi event |
| Trẻ đổi giữa chừng | Phiên cũ `abandoned`, phiên mới tạo |
| Mất mạng | Phiên vẫn `in_progress`; event tới muộn ≤24h vẫn nhận |
| Gói hết hạn giữa phiên | Phiên tiếp tục — `BR-LAD-08` |
| Hết hạn mức giờ chơi giữa phiên | Phiên hiện tại **chạy hết**; phiên mới bị chặn 402 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PSL-01` | Một phiên Cấm — **NEVER complete hai lần** | Complete lần hai nhân đôi mastery và KPI |
| `BR-PSL-02` | `content_version` ghim lúc **tạo**, không đọc lại lúc complete | Version có thể đổi giữa chừng |
| `BR-PSL-03` | Điểm tính ở **server** từ chuỗi event | Không tin client gửi điểm trực tiếp |
| `BR-PSL-04` | Phiên guest: `child_profile_id` NULL, không ghi `mastery_state` | Guest không có tài khoản và hồ sơ để lưu vết tiến độ học tập |
| `BR-PSL-05` | Phiên preview: `is_preview = true`, không ghi mastery, không đếm KPI | Preview của Manager dùng để kiểm thử nội dung, không phải hành vi học của trẻ |
| `BR-PSL-06` | Phiên đang mở **không bị ngắt** vì hết hạn mức hay hết gói | Cắt ngang lúc trẻ đang chơi gây trải nghiệm tiêu cực |
| `BR-PSL-07` | Phiên bỏ dở vẫn **được đếm** vào thời gian chơi và KPI bỏ game | Tỉ lệ bỏ là tín hiệu chất lượng nội dung quan trọng nhất |
| `BR-PSL-08` | `access_tier_at_start` ghim lúc tạo | Điều tra sau cần biết lúc đó quyền thế nào |
| `BR-PSL-09` | Chỉ chủ sở hữu phiên gửi được event; người khác → **404** | Bảo mật dữ liệu phiên chơi, tránh can thiệp kết quả từ tài khoản khác |
| `BR-PSL-10` | Tạo phiên là **tác dụng phụ của lấy config**, không endpoint riêng | Hai bước tách rời sinh ra phiên mồ côi khi client bỏ giữa chừng |

## 7. Data

### 7.1 Máy trạng thái

```
in_progress ──► completed
      │
      └──────► abandoned   (sweep sau 30 phút không hoạt động)
```

Hai trạng thái cuối là **terminal**. Cấm có đường quay lại `in_progress`.

### 7.2 Bảng

Xem `01-platform/schema-play-telemetry.md` §7.2.

### 7.3 Điều kiện ghi `mastery_state`

Tất cả phải đúng:

- `child_profile_id IS NOT NULL`
- `is_preview = false`
- `completion_status = 'completed'`
- Level gắn ít nhất một skill

Thiếu bất kỳ điều kiện nào → không ghi. Đây là hàng rào chống nhiễu dữ liệu học tập.

## 8. API contract

### `POST /api/users/play-sessions/{uuid}/complete`

| | |
|---|---|
| Auth | `requireUserAuth()` + ownership phiên |
| Body | `{ last_seq }` |
| 200 | `{ score, normalized_score, rounds_correct, rounds_total, stars, next_suggestion? }` |
| 409 | `SESSION_ALREADY_COMPLETED` |
| 410 | `SESSION_EXPIRED` |
| 404 | Phiên không tồn tại hoặc không thuộc caller |

`stars` là biểu diễn **thân thiện với trẻ**, không phải điểm số — xem
[`feedback-and-celebration.md`](feedback-and-celebration.md).

### `POST /api/guest/play-sessions/{uuid}/complete`

| | |
|---|---|
| Auth | Cookie `tm_did` (UUID thiết bị guest) + ownership phiên |
| Body | `{ last_seq }` |
| 404 | Phiên không tồn tại hoặc không thuộc thiết bị guest |
| 409 / 410 | Như user route |

## 9. Acceptance criteria

```gherkin
Scenario: BR-PSL-01 — không complete hai lần
  Given một phiên đã completed
  When client gọi complete lần nữa
  Then trả 409 SESSION_ALREADY_COMPLETED
  And điểm và mastery không đổi

Scenario: BR-PSL-02 — version ghim lúc tạo
  Given trẻ mở level ở version 3
  And manager publish version 4 giữa chừng
  When phiên hoàn tất
  Then play_sessions.content_version là 3

Scenario: BR-PSL-03 — điểm tính ở server
  Given client gửi complete kèm score = 100
  When server tính kết quả
  Then điểm ghi lại được tính từ chuỗi answer_correct và answer_incorrect

Scenario: BR-PSL-04 — guest không ghi mastery
  Given guest hoàn thành một level free
  Then play_sessions có hàng với child_profile_id NULL
  And mastery_state không đổi

Scenario: BR-PSL-05 — preview không đếm KPI
  Given manager chạy preview và hoàn thành
  Then play_sessions.is_preview là true
  And level_daily_stats không tăng lượt chơi

Scenario: BR-PSL-06 — hết hạn mức không cắt phiên đang chạy
  Given trẻ còn 2 phút hạn mức và đang chơi
  When hạn mức về 0 giữa chừng
  Then phiên hiện tại hoàn thành được
  And phiên mới trả 402

Scenario: BR-PSL-07 — phiên bỏ dở được đếm
  Given một phiên không complete sau 30 phút
  When sweep:abandoned chạy
  Then completion_status là abandoned
  And thời gian chơi được cộng vào child_daily_stats
  And level_daily_stats tăng lượt bỏ

Scenario: BR-PSL-09 — người khác không gửi được event
  Given phiên thuộc user A
  When user B gửi event tới phiên đó
  Then trả 404

Scenario: BR-PSL-10 — không có endpoint tạo phiên riêng
  When quét mọi route
  Then không route nào chỉ tạo play_session mà không trả config
```

## 10. Boundaries

**Always**
- Ghim `content_version` và `access_tier_at_start` lúc tạo.
- Tính điểm ở server.
- Kiểm đủ bốn điều kiện §7.3 trước khi ghi mastery.
- Đếm phiên bỏ dở vào KPI.

**Ask first**
- Đổi ngưỡng 30 phút hoặc 4 giờ.
- Thêm trạng thái phiên.

**Never**
- Complete hai lần.
- Ngắt phiên đang mở vì quyền hay hạn mức.
- Ghi mastery từ guest hoặc preview.
- Tin điểm từ client.
- Endpoint tạo phiên tách khỏi lấy config.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~30 phút để đóng phiên bỏ dở có đúng không?~~ **Đóng 2026-08-09 (T13, `D-DF`)**: đúng, 30 phút là ngưỡng quét phù hợp cho phiên chơi mầm non; sau 30p không event hệ thống tự sweep sang abandoned | Quy chuẩn phiên | Đã đóng | D-DF |
| ~~2~~ | ~~Trẻ quay lại phiên `abandoned` — cho tiếp tục hay bắt đầu mới?~~ **Đóng 2026-08-09 (T13, `D-DG`)**: bắt đầu mới; phiên abandoned là terminal state, không cho mở lại để bảo toàn telemetry | UX phiên chơi | Đã đóng | D-DG |
