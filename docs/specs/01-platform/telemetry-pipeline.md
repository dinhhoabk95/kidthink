---
spec: TELEMETRY-PIPELINE
title: Đường ống telemetry và rollup
area: platform
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Đường đi của event từ client tới báo cáo
  - Bảng rollup và lịch chạy
  - Ràng buộc PII trên toàn đường ống
depends_on:
  - EVENT-CATALOG
  - CHILD-DATA-COMPLIANCE
---

# Đường ống telemetry và rollup

## 1. Objective

Event thô trả lời được câu hỏi chưa nghĩ ra hôm nay, nhưng truy vấn trực tiếp trên nó thì
chậm và tốn. Đường ống này biến event thô thành số liệu đọc được trong vài mili giây.

Trên t3.small, `telemetry_events` sẽ là bảng lớn nhất và **không bao giờ nhỏ lại**. Thiết
kế rollup từ đầu là bắt buộc, không phải tối ưu sớm.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Engine | Sinh event |
| API ingest | Xác thực, khử trùng, ghi |
| Worker | Rollup theo lịch |
| Báo cáo | Đọc bảng rollup, không đọc event thô |
| Admin analytics | Đọc rollup + query ad-hoc có giới hạn |

## 3. Entry points

| Nơi | |
|---|---|
| `POST /api/{users\|guest}/play-sessions/{uuid}/events` | Ingest |
| `apps/worker` job `rollup:daily` | 02:00 ICT |
| `apps/worker` job `rollup:session` | Ngay sau khi phiên complete |

## 4. Main flow

```
Engine buffer → flush (20 event | 10s | phiên kết thúc | trang ẩn)
  → POST events (≤100/lô)
  → xác thực: phiên tồn tại · thuộc caller · tên event hợp lệ · payload đúng schema · seq mới
  → INSERT telemetry_events (INSERT-only)
  → khi game_completed: rollup:session ngay
      → tính điểm ở server, ghi play_sessions
      → cập nhật mastery_state (nếu không phải guest/preview)
      → ghi child_session_summaries
  → 02:00 ICT: rollup:daily
      → child_daily_stats · level_daily_stats · skill_daily_stats
```

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Lô trùng | 200, ghi 0 hàng |
| Phiên bỏ dở, không có `game_completed` | Job `sweep:abandoned` sau 30 phút đóng phiên với `completion_status = abandoned` |
| Rollup fail | Retry 3 lần backoff; fail tiếp → alert, không âm thầm bỏ |
| Worker chết | Event vẫn ghi được; rollup dồn lại. **Phải có alert** — worker chết im lặng là chế độ hỏng tệ nhất |
| Offline lâu | Event tới muộn ≤ 24h vẫn nhận; rollup ngày đó chạy lại |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TLM-01` | Báo cáo đọc **rollup**, không đọc `telemetry_events` trực tiếp | Query trên bảng lớn nhất trong đường vào màn hình là cách hạ instance |
| `BR-TLM-02` | Rollup **idempotent** — chạy lại cùng ngày cho cùng kết quả | Retry là chuyện thường |
| `BR-TLM-03` | Cấm — **NEVER PII trên toàn đường ống** — event, rollup, export | |
| `BR-TLM-04` | Điểm chính thức tính ở **rollup:session** phía server | không tin client |
| `BR-TLM-05` | Phiên guest ghi event nhưng **không** vào `mastery_state` và không đếm vào KPI trẻ | |
| `BR-TLM-06` | Worker chết **phải có alert** | Producer đẩy job, không consumer nào lấy, và không ai biết |
| `BR-TLM-07` | Event tới sau khi phiên đã `completed` bị bỏ, trả 200 | Không làm client retry vô hạn |
| `BR-TLM-08` | Rollup ngày theo **ICT (UTC+7)**, mốc 00:00 | Ngày của người dùng, không phải ngày UTC |
| `BR-TLM-09` | Giữ event thô **90 ngày**, sau đó chỉ giữ rollup | Cân bằng dung lượng và khả năng phân tích lại |

## 7. Data

### 7.1 Bảng rollup

| Bảng | Khoá | Nội dung |
|---|---|---|
| `child_session_summaries` | `(child_id, session_uuid)` | Kết quả một phiên: điểm, thời lượng, hint, retry |
| `child_daily_stats` | `(child_id, date_ict)` | Số phiên, phút chơi, level hoàn thành, skill chạm |
| `level_daily_stats` | `(level_code, content_version, date_ict)` | Lượt chơi, tỉ lệ hoàn thành, tỉ lệ bỏ, thời lượng TB, hint TB |
| `skill_daily_stats` | `(skill_id, date_ict)` | Lượt tiếp xúc, tỉ lệ đúng TB |

### 7.2 Chỉ số nội dung — dùng cho KPI Content

| Chỉ số | Nguồn | Ngưỡng cảnh báo |
|---|---|---|
| Tỉ lệ bỏ level | `level_daily_stats` | > 40% |
| Tỉ lệ sai bất thường | idem | tỉ lệ đúng < 30% |
| Level lượt chơi thấp | idem | < 5 lượt/tuần |
| Skill thiếu nội dung | `skill_daily_stats` + đếm asset | 0 level published |
| Tuần curriculum chưa đủ game | `curriculum_items` | < 3 hoạt động |

Năm chỉ số này là đường phản hồi từ dữ liệu về nội dung — không có nó thì biên soạn là đoán.

## 8. API contract

Ingest: xem `00-foundation/event-catalog.md` §8.

### `GET /api/managers/analytics/levels`

| | |
|---|---|
| Auth | `requireManagerAuth()` |
| Query | `from` `to` `competency` `sort` `limit` (≤100) |
| 200 | Hàng từ `level_daily_stats` đã gộp |

## 9. Acceptance criteria

```gherkin
Scenario: BR-TLM-02 — rollup idempotent
  Given rollup:daily đã chạy cho ngày D
  When chạy lại rollup:daily cho ngày D
  Then mọi hàng thống kê của ngày D không đổi

Scenario: BR-TLM-01 — báo cáo không đọc event thô
  When quét mọi truy vấn phục vụ route báo cáo
  Then không truy vấn nào SELECT trực tiếp từ telemetry_events

Scenario: BR-TLM-04 — điểm tính ở server
  Given client gửi game_completed kèm score giả
  When rollup:session chạy
  Then điểm ghi vào play_sessions được tính lại từ chuỗi event

Scenario: BR-TLM-05 — guest không vào mastery
  Given một guest hoàn thành một level
  Then telemetry_events có hàng với child_uuid NULL
  And mastery_state không đổi

Scenario: BR-TLM-06 — worker chết có alert
  Given worker dừng 10 phút
  When job backlog vượt ngưỡng
  Then hệ thống phát alert
  And alert tới được người, không chỉ ghi log

Scenario: BR-TLM-08 — ranh giới ngày theo ICT
  Given một phiên kết thúc lúc 23:50 ICT ngày D
  And một phiên kết thúc lúc 00:10 ICT ngày D+1
  Then phiên đầu thuộc child_daily_stats ngày D
  And phiên sau thuộc ngày D+1

Scenario: phiên bỏ dở được đóng
  Given một phiên không có game_completed sau 30 phút
  When sweep:abandoned chạy
  Then completion_status là abandoned
  And phiên không còn ở trạng thái in_progress
```

## 10. Boundaries

**Always**
- Rollup idempotent theo khoá ngày.
- Tính điểm ở server.
- Alert khi worker backlog vượt ngưỡng.
- Ranh giới ngày theo ICT.

**Ask first**
- Thêm bảng rollup mới.
- Đổi retention 90 ngày của event thô.
- Đổi lịch job.

**Never**
- Báo cáo đọc trực tiếp `telemetry_events`.
- PII trên bất kỳ chặng nào.
- Tin điểm từ client.
- Bỏ qua lỗi rollup âm thầm.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Partition `telemetry_events` theo tháng ngay từ đầu? | P1 |
| 2 | Retention 90 ngày đủ để tinh chỉnh adaptive bằng replay không? | [`adaptive-engine.md`](adaptive-engine.md) |
| 3 | Có cần bảng rollup theo tuần cho báo cáo xu hướng không? | [`advanced-report.md`](../03-account/advanced-report.md) |
