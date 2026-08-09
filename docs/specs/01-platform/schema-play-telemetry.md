---
spec: SCHEMA-PLAY-TELEMETRY
title: Schema — trẻ, phiên chơi, telemetry, mastery
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-07
owns:
  - Định nghĩa cột module child, play, adaptive
depends_on:
  - DATA-MODEL-OVERVIEW
  - CHILD-DATA-COMPLIANCE
  - EVENT-CATALOG
---

# Schema — trẻ, phiên chơi, telemetry, mastery

## 1. Objective

Đây là nơi ràng buộc pháp lý biến thành ràng buộc cột. `child_profiles` là **danh sách
đóng** — schema là chỗ ép nó, không phải code review.

## 2. Actors

Dev.

## 3. Entry points

`packages/db/src/schema/child.ts` · `play.ts` · `adaptive.ts`.

## 4. Main flow

Không có.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SPT-01` | `child_profiles` chỉ có cột ở §7.1. Thêm cột = sửa [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) trước | Danh sách đóng ép ở schema |
| `BR-SPT-02` | Cấm — **NEVER cột ngày sinh đầy đủ, họ tên đầy đủ, hay path ảnh upload** trên `child_profiles` | `BR-CDC-02` `BR-CDC-03` `BR-CDC-04` |
| `BR-SPT-03` | `telemetry_events` PK `(session_uuid, seq)` — idempotent ở tầng DB | `BR-EVT-03` |
| `BR-SPT-04` | `telemetry_events.child_uuid` **nullable** — guest là NULL, và xoá tài khoản đặt về NULL | Ẩn danh hoá thay vì xoá cứng |
| `BR-SPT-05` | `mastery_state` khoá theo `skill_id` **FK** (`skills.id`), không chuỗi tự do, không `skill_code` (D-AE) | `BR-TAX-07` |
| `BR-SPT-06` | `play_sessions.content_version` NOT NULL | `BR-VER-03` |
| `BR-SPT-07` | `telemetry_events` · `play_sessions` INSERT-only sau khi `completed` | `BR-DM-05`. Đây là dữ liệu **đã xảy ra** — sửa được nghĩa là báo cáo tiến bộ của một đứa trẻ không còn giải thích được bằng thứ nó thật sự đã chơi (D5). `play_sessions` mở cho UPDATE tới lúc `completed` vì phiên đang chạy còn ghi tiếp; sau đó đóng lại |
| `BR-SPT-08` | `p_learn` CHECK 0–1 ở tầng DB | Bất biến quan trọng nhất của adaptive |

## 7. Data

### 7.1 `child_profiles` — danh sách đóng

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigserial | PK — nội bộ |
| `uuid` | uuid | UNIQUE — đối ngoại và dùng làm `child_uuid` |
| `user_id` | bigint FK | ON DELETE CASCADE |
| `display_name` | varchar(40) | NOT NULL — tên gọi, không họ tên đầy đủ |
| `birth_year` | smallint | NOT NULL, CHECK trong khoảng cho tuổi 3–6. Index đơn cho lookup theo tuổi |
| `avatar_id` | varchar(24) | NOT NULL — FK logic tới preset |
| `relationship` | enum | `child`\|`student`\|`other`, nullable |
| `current_curriculum_id` | bigint | nullable — FK `curricula.entity_id` (neo dòng dõi, D-AE), luôn theo bản `published` mới nhất |
| `daily_play_cap_minutes` | smallint | NOT NULL default theo gói |
| `status` | enum | `active`\|`archived`\|`pending_deletion` |
| `created_at` `updated_at` | timestamptz | |

**12 cột. Không hơn.** Bất kỳ cột thứ 13 nào cần sửa [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) trước.
`age_band` **không phải cột** — suy từ `birth_year` lúc đọc (D-AA).

### 7.2 `play_sessions`

| Cột | Ghi chú |
|---|---|
| `uuid` | PK đối ngoại |
| `user_id` | nullable — NULL cho guest |
| `child_profile_id` | nullable — NULL cho guest |
| `guest_device_id` | nullable — cookie `tm_did` |
| `game_level_id` `content_version` `template_id` | NOT NULL — FK hàng version cụ thể lúc chơi (D-AE), kể cả `template_id` (`game_templates.id`) |
| `curriculum_id` `curriculum_item_id` `lesson_id` | nullable — FK hàng version cụ thể lúc chơi (D-AE) |
| `access_tier_at_start` | Bậc lúc mở phiên |
| `started_at` `completed_at` `duration_ms` | |
| `rounds_total` `rounds_correct` `attempt_count` `correct_count` `incorrect_count` `hint_count` `retry_count` | int |
| `completion_status` | enum `in_progress`\|`completed`\|`abandoned` |
| `raw_score` `normalized_score` | numeric — **server tính** |
| `difficulty` | smallint |
| `device` | enum `tablet`\|`desktop`\|`mobile` |
| `is_preview` | bool — phiên của Manager |

CHECK: `(child_profile_id IS NOT NULL) OR (guest_device_id IS NOT NULL)`.

### 7.3 `telemetry_events` — INSERT-only

| Cột | Ghi chú |
|---|---|
| `session_uuid` `seq` | PK ghép |
| `child_uuid` | nullable |
| `game_level_id` `content_version` `template_id` | FK hàng version cụ thể lúc chơi (D-AE); `content_version` giữ tường minh cho báo cáo dù đã ngầm định trong `game_level_id` |
| `event_name` | varchar — từ catalog |
| `payload` | JSONB — schema theo event |
| `occurred_at_ms` | int — tương đối so với `started_at` |
| `ingested_at` | timestamptz |

Index `(game_level_id, ingested_at)` · `(child_uuid, ingested_at)`.

Cấm cột nào chứa PII. Xem [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) §7.3.

**Không partitioned ở P0.** PK `(session_uuid, seq)` giữ nguyên (`BR-SPT-03`).
Hai điều kiện giữ đường mở: (a) không FK nào trỏ **vào** `telemetry_events`;
(b) giữ cột hẹp, index tối thiểu. Xem [`event-catalog.md`](../00-foundation/event-catalog.md) §11 Q2.

### 7.4 `child_session_summaries`

`(child_profile_id, session_uuid)` PK · `date_ict` date · `skill_ids` bigint[] ·
`score` · `duration_ms` · `hint_count` · `retry_count` · `completed` bool.

### 7.5 Bảng rollup — `child_daily_stats` · `level_daily_stats` · `skill_daily_stats`

`child_daily_stats` `(child_profile_id, date_ict)` · `level_daily_stats`
`(game_level_id, date_ict)` · `skill_daily_stats` `(skill_id, date_ict)`.

Chi tiết cột: [`telemetry-pipeline.md`](telemetry-pipeline.md) §7.1.

### 7.6 `mastery_state`

| Cột | Ràng buộc |
|---|---|
| `(child_profile_id, skill_id)` | PK ghép, cả hai FK |
| `p_learn` | numeric CHECK `>= 0 AND <= 1` |
| `attempts_total` `attempts_recent` | int |
| `ema_correct` | numeric CHECK 0–1 |
| `hint_rate` | numeric |
| `last_seen_at` | timestamptz |
| `params_version` | varchar |
| `assessed_by_user_id` | nullable — skill ngôn ngữ mở do người lớn chấm |

### 7.7 `level_params`

`(child_profile_id, game_level_id)` · `params` JSONB · `updated_at` — tham số độ khó đã
điều chỉnh cho từng trẻ.

## 8. API contract

Không có.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SPT-01 — child_profiles đúng 12 cột
  When đọc định nghĩa bảng child_profiles
  Then số cột là 12
  And không cột nào tên full_name, birth_date, school, photo_path, hay age_band

Scenario: BR-SPT-03 — event trùng bị DB chặn
  When chèn hai hàng telemetry_events cùng session_uuid và seq
  Then vi phạm khoá chính

Scenario: BR-SPT-08 — p_learn bị ràng buộc ở DB
  When chèn mastery_state với p_learn = 1.5
  Then CHECK constraint từ chối

Scenario: BR-SPT-05 — skill_id là FK thật
  When chèn mastery_state với skill_id không tồn tại
  Then vi phạm khoá ngoại

Scenario: BR-SPT-06 — phiên chơi bắt buộc có content_version
  When chèn play_sessions không có content_version
  Then NOT NULL từ chối

Scenario: BR-SPT-04 — ẩn danh hoá khi xoá tài khoản
  Given một user bị purge
  When job chạy xong
  Then telemetry_events của trẻ đó có child_uuid NULL
  And số hàng telemetry_events không giảm

Scenario: phiên phải thuộc trẻ hoặc thiết bị guest
  When chèn play_sessions không có cả child_profile_id lẫn guest_device_id
  Then CHECK constraint từ chối

Scenario: D-Z — không FK trỏ vào telemetry_events
  When quét toàn bộ FK trong schema
  Then không có FK nào có target là telemetry_events
```

## 10. Boundaries

**Always**
- Giữ `child_profiles` đúng danh sách đóng.
- CHECK cho `p_learn` và `ema_correct` ở tầng DB.
- PK ghép `(session_uuid, seq)` cho telemetry.

**Ask first**
- Thêm bất kỳ cột nào vào `child_profiles`.
- Thêm bảng rollup.
- Đổi index của `telemetry_events`.

**Never**
- Cột PII trên bất kỳ bảng nào ở module này.
- `skill` dạng chuỗi tự do.
- `content_version` nullable trên `play_sessions`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Partition `telemetry_events` theo tháng ngay từ P0?~~ **Đóng 2026-08-07 (T6)**: quyết định sống ở [`event-catalog.md`](../00-foundation/event-catalog.md) Q2. Cấm partition ở P0; PK giữ nguyên (D-Z) | — | đã đóng | D-Z |
| ~~2~~ | ~~`age_band` là cột sinh hay tính lúc đọc?~~ **Đóng 2026-08-07 (T6)**: tính lúc đọc từ `birth_year` (D-AA). Không cần cập nhật khi sang năm | — | đã đóng | D-AA |

### 11.1 Bảng nợ schema (Debt)

| Bảng | Lệch | Bước sở hữu |
|---|---|---|
| `play_sessions` | Thiếu `user_id` `curriculum_id` `curriculum_item_id` `lesson_id` `access_tier_at_start` `duration_ms` `rounds_*` `attempt_count` `correct_count` `incorrect_count` `hint_count` `retry_count` `raw_score` `normalized_score` `difficulty` `device` `is_preview`; thừa `stars_earned` `score` `duration_seconds` | P1.6 · P1.7 |
| `child_session_summaries` | Hợp đồng §7.4 đòi PK `(child_profile_id, session_uuid)` · `date_ict` · `skill_ids` bigint[]; schema dùng `id` + `date` varchar(10) + `total_play_time_seconds` | P1.6 |
| `child_daily_stats` `level_daily_stats` `skill_daily_stats` | Cột không khớp [`telemetry-pipeline.md`](telemetry-pipeline.md) §7.1 | P1.5 |

