---
spec: EVENT-CATALOG
title: Catalog sự kiện và schema payload
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-07
owns:
  - Danh sách tên sự kiện hợp lệ
  - Schema payload từng sự kiện
  - Quy tắc PII trong event
depends_on:
  - GLOSSARY
  - CHILD-DATA-COMPLIANCE
---

# Catalog sự kiện và schema payload

## 1. Objective

Không chỉ lưu điểm cuối. Lưu **event** để phân tích được về sau những câu hỏi chưa nghĩ ra
hôm nay: game nào có tỉ lệ thoát cao, item nào gây nhầm nhất, hint có thực sự giúp không.

Event là dữ liệu **append-only, không đổi được**. Vì vậy schema của nó là contract chặt hơn
API — sai schema không sửa được ngược cho dữ liệu đã thu.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Game engine (client) | Sinh event, buffer, flush |
| Server | Xác thực, khử trùng lặp, ghi |
| Analytics | Đọc |
| Trẻ | Chủ thể dữ liệu — **không PII** |

## 3. Entry points

| Nơi | Ghi chú |
|---|---|
| `packages/game-engine` | `emit(name, payload)` |
| `POST /api/users/play-sessions/{uuid}/events` | Nạp theo lô |
| `POST /api/guest/play-sessions/{uuid}/events` | Guest — ghi phiên ẩn danh |
| `01-platform/telemetry-pipeline.md` | Xử lý sau khi ghi |

## 4. Main flow

1. Engine `emit()` → buffer trong bộ nhớ, gắn `seq` tăng dần trong phiên.
2. Flush khi: đủ 20 event · hết 10 giây · phiên kết thúc · trang ẩn (`visibilitychange`).
3. Gửi qua `navigator.sendBeacon` khi trang ẩn; `fetch` trong các trường hợp còn lại.
4. Server kiểm: phiên tồn tại và thuộc caller · tên event có trong catalog · payload parse
   được bằng schema · `seq` chưa từng thấy.
5. Ghi `telemetry_events`, INSERT-only.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Lô trùng hoàn toàn | Trả **200**, ghi 0 hàng. Idempotent theo `(session_uuid, seq)` |
| Lô trùng một phần | Ghi hàng mới, bỏ qua hàng trùng, trả 200 kèm `{ accepted, skipped }` |
| `seq` lùi | **409** `EVENT_OUT_OF_ORDER` — client lỗi, log để điều tra |
| Tên event không có trong catalog | **422**, không ghi. Bảo vệ schema khỏi rác |
| Payload thừa field | Field thừa bị **strip**, ghi phần hợp lệ. Log cảnh báo |
| Offline | Buffer trong IndexedDB, flush khi có mạng, tối đa 24h rồi bỏ |
| Phiên đã `completed` | Event tới sau bị bỏ, trả 200 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EVT-01` | Tên event nằm trong catalog §7. Tên lạ → 422 | Tên tự do làm bảng telemetry thành bãi rác không query được |
| `BR-EVT-02` | **NEVER PII trong payload** — chỉ số, enum, và mã nội dung | Bảng telemetry lớn nhất, giữ lâu nhất, dễ export nhầm nhất |
| `BR-EVT-03` | Idempotent theo `(session_uuid, seq)` | Mạng yếu gửi lại là chuyện thường, không phải ngoại lệ |
| `BR-EVT-04` | `telemetry_events` **INSERT-only** | Event là bằng chứng, không phải trạng thái |
| `BR-EVT-05` | Điểm chính thức tính ở **server** từ event, không nhận `score` từ client | Client sửa được |
| `BR-EVT-06` | Mọi event mang `content_version` | Báo cáo lịch sử phải giải thích được bằng đúng nội dung đã chơi |
| `BR-EVT-07` | Thêm event mới = thêm vào catalog **trước**, dùng sau. Đổi schema của event đã có = **thêm event mới**, không sửa cũ | Dữ liệu đã thu không sửa ngược được |
| `BR-EVT-08` | **NEVER toạ độ chạm thô** trong payload | Chuỗi toạ độ là dữ liệu hành vi chi tiết vượt nhu cầu |
| `BR-EVT-09` | Phiên guest ghi event nhưng **không** cập nhật `mastery_state` | Lượt ẩn danh không neo được vào một trẻ |

## 7. Data — catalog

Trường chung mọi event: `session_uuid` · `seq` · `event_name` · `occurred_at_ms` (đồng hồ
client, tương đối so với `session.started_at`) · `content_version`.

### 7.1 Vòng đời phiên

| Event | Payload | Ghi chú |
|---|---|---|
| `game_started` | `{ template_code, difficulty, age_band, device: "tablet"\|"desktop"\|"mobile", reduced_motion: bool }` | Luôn là `seq = 1` |
| `instructionewed` | `{ modality: "audio"\|"visual"\|"both", replay_count: int }` | |
| `game_paused` | `{ reason: "user"\|"visibility"\|"parent_gate" }` | |
| `game_resumed` | `{ paused_ms: int }` | |
| `game_completed` | `{ duration_ms, rounds_total, rounds_correct }` | Server tính điểm từ đây |
| `game_abandoned` | `{ duration_ms, last_round_index, reason: "exit"\|"timeout"\|"cap_reached" }` | |

### 7.2 Vòng chơi

| Event | Payload |
|---|---|
| `round_started` | `{ round_index, item_count, distractor_count }` |
| `question_shown` | `{ round_index, prompt_kind: "count"\|"compare"\|"sort"\|"match"\|"sequence"\|"select" }` |
| `answer_selected` | `{ round_index, attempt_index, target_slot: int\|null, elapsed_ms }` |
| `answer_correct` | `{ round_index, attempt_index, elapsed_ms }` |
| `answer_incorrect` | `{ round_index, attempt_index, elapsed_ms, error_kind: "wrong_target"\|"wrong_item"\|"incomplete"\|"timeout" }` |
| `round_completed` | `{ round_index, attempts, hints_used, duration_ms }` |
| `round_retried` | `{ round_index, retry_index }` |
| `round_skipped` | `{ round_index, reason: "scaffold_exhausted"\|"user" }` |

Event tương tác trong khuôn. Chúng mang **mã nội dung**, không mang toạ độ chạm (`BR-EVT-08`).
`round_index` là tuỳ chọn trong payload event tương tác: khuôn một vòng có thể bỏ trường
này. Nhưng event `round_started` và `round_completed` **luôn phải phát** cho mọi vòng kể cả
set một vòng — xem `BR-RSP-02` ở [`round-sequence-play.md`](../04-play/round-sequence-play.md).

| Event | Payload | Khuôn phát |
|---|---|---|
| `item_selected` | `{ item_id, is_correct, round_index? }` | `GT-001` · `GT-002` |
| `selection_submitted` | `{ is_correct, round_index? }` | `GT-002` |
| `item_dragged` | `{ item_id, round_index? }` | `GT-003` · `GT-004` · `GT-008` |
| `item_dropped` | `{ item_id, container_id, is_correct, round_index? }` | `GT-003` |
| `item_sorted` | `{ item_id, group_id, is_correct, round_index? }` | `GT-004` |
| `item_placed` | `{ item_id, slot_id, is_correct, round_index? }` | `GT-008` |
| `pair_selected` | `{ item_id, round_index? }` | `GT-005` |
| `pair_matched` | `{ pair_id, left_item_id, right_item_id, round_index? }` | `GT-005` |
| `step_reordered` | `{ from_index, to_index, current_sequence, round_index? }` | `GT-006` |
| `sequence_submitted` | `{ is_correct, round_index? }` | `GT-006` |
| `bond_selected` | `{ option_id, part_id, is_correct, round_index? }` | `GT-007` |
| `part_filled` | `{ part_id, value, round_index? }` | `GT-007` |
| `clue_revealed` | `{ clue_id, revealed_count, remaining_count, round_index? }` | `GT-009` |
| `candidate_eliminated` | `{ candidate_id, clue_id, round_index? }` | `GT-009` |
| `option_previewed` | `{ option_id, row_matches, col_matches, round_index? }` | `GT-011` |
| `option_selected` | `{ option_id, is_correct, round_index? }` | `GT-011` |
| `path_step` | `{ row, col, step_index, round_index? }` | `GT-013` |
| `path_blocked` | `{ row, col, reason: "outside"\|"not_adjacent"\|"wall", retreated, round_index? }` | `GT-013` |
| `path_submitted` | `{ is_correct, step_count, round_index? }` | `GT-013` |
| `equation_solved` | `{ symbol_id, value, round_index? }` | `GT-010` |
| `value_selected` | `{ value, is_correct, round_index? }` | `GT-010` · `GT-012` |
| `flash_shown` | `{ duration_ms, round_index? }` | `GT-012` |
| `flash_hidden` | `{ elapsed_ms, round_index? }` | `GT-012` |
| `flash_replayed` | `{ round_index? }` | `GT-012` |
| `balance_changed` | `{ tilt_angle, state: "balanced"\|"left_heavy"\|"right_heavy", round_index? }` | `GT-014` |
| `cell_filled` | `{ row, col, symbol_id, is_valid, round_index? }` | `GT-015` |
| `constraint_violated` | `{ row, col, symbol_id, round_index? }` | `GT-015` |
| `hand_rotated` | `{ hand: "hour"\|"minute", time, round_index? }` | `GT-016` |
| `time_submitted` | `{ time?, card_id?, is_correct, round_index? }` | `GT-016` |
| `model_rotated` | `{ angle: 0\|90\|180\|270, hidden_cubes_remaining, round_index? }` | `GT-017` |
| `item_revealed` | `{ item_id, round_index? }` | `GT-022` |
| `checkpoint_reached` | `{ waypoint_id, checkpoint_index, total_waypoints, round_index? }` | `GT-024` |
| `trace_completed` | `{ shape_name, round_index? }` | `GT-024` |
| `item_tapped` | `{ item_id, current_total, step, round_index? }` | `GT-028` |
| `count_undone` | `{ item_id, current_total, step, round_index? }` | `GT-028` |
| `count_submitted` | `{ submitted_total, target_total, is_correct, round_index? }` | `GT-028` |
| `item_removed` | `{ item_id, removed_count, target_remove_count, round_index? }` | `GT-029` |
| `item_restored` | `{ item_id, removed_count, remaining_needed, round_index? }` | `GT-029` |
| `unit_placed` | `{ slot_index, placed_count, target_count, round_index? }` | `GT-030` |
| `unit_removed` | `{ slot_index, placed_count, round_index? }` | `GT-030` |

### 7.3 Trợ giúp

| Event | Payload |
|---|---|
| `hint_requested` | `{ round_index, source: "auto_timer"\|"auto_miss" }` — không có `"user"`, scaffolding không theo yêu cầu |
| `scaffold_escalated` | `{ round_index, level: 1\|2\|3, trigger: "timer"\|"miss_streak", elapsed_ms }` |
| `demo_shown` | `{ round_index, speed: 1.0\|0.5 }` |

### 7.4 Hệ thống

| Event | Payload |
|---|---|
| `asset_load_failed` | `{ asset_kind: "emoji"\|"image"\|"audio", asset_ref, retry_count }` |
| `fps_sample` | `{ p50, p95, min, sample_count }` — mỗi 30s |
| `parent_gate_shown` | `{ trigger: "exit"\|"settings" }` |
| `parent_gate_passed` | `{ attempts }` |
| `parent_gate_failed` | `{ attempts }` |
| `payment_webhook_received` | `{ provider: string, provider_event_id: string, amount: number, status: string }` |
| `subscription_renewed` | `{ subscription_id: string, package_code: string, current_period_end: string }` |
| `subscription_cancelled` | `{ subscription_id: string, cancelled_by: "user"|"admin", reason?: string, revoke_immediate?: boolean }` |
| `offline_pack_downloaded` | `{ pack_id: string, total_size_bytes: number, asset_count: number }` |
| `offline_pack_synced` | `{ pack_id: string, event_count: number, duplicate_count: number }` |

### 7.5 Field bị cấm trong mọi payload

`display_name` · `birth_year` · tuổi chính xác · `user_id` · `email` · IP · toạ độ chạm thô
· chuỗi tự do bất kỳ · `child_uuid` (nằm ở **cột** của bảng, không ở payload).

### 7.6 Bảng `telemetry_events`

| Field | Ghi chú |
|---|---|
| `session_uuid` `seq` | PK ghép — ép idempotent ở tầng DB |
| `child_uuid` | NULL cho guest |
| `game_level_id` `content_version` `template_id` | Cột thật — FK hàng version cụ thể lúc chơi (D-AE). Khác `payload.template_code` ở §7.1 (JSONB tự do, không phải FK) |
| `event_name` | FK logic tới catalog |
| `payload` | JSONB, parse bằng schema của event |
| `occurred_at_ms` `ingested_at` | |

INSERT-only, ép bằng quyền DB.

## 8. API contract

### `POST /api/users/play-sessions/{uuid}/events`

| | |
|---|---|
| Auth | `requireUserAuth()` + ownership phiên |
| Body | `{ events: [{ seq, event_name, occurred_at_ms, payload }] }` — tối đa 100 |
| 200 | `{ accepted: int, skipped: int }` |
| 409 | `EVENT_OUT_OF_ORDER` |
| 422 | `VALIDATION_FAILED` — tên event lạ hoặc payload sai schema |
| 413 | `PAYLOAD_TOO_LARGE` |

Rate limit: 10 request / 10 giây / phiên.

## 9. Acceptance criteria

```gherkin
Scenario: BR-EVT-03 — gửi lại lô y hệt không nhân đôi
  Given client đã gửi thành công một lô 20 event
  When client gửi lại đúng lô đó
  Then hệ thống trả 200 với accepted = 0 và skipped = 20
  And số hàng telemetry_events không đổi

Scenario: BR-EVT-01 — tên event lạ bị từ chối
  Given một phiên chơi đang mở
  When client gửi event tên "custom_thing"
  Then hệ thống trả 422
  And không ghi hàng nào

Scenario: BR-EVT-02 — payload chứa PII bị strip hoặc từ chối
  When client gửi answer_correct với payload chứa display_name
  Then field đó bị loại khỏi hàng được ghi
  And log cảnh báo được sinh ra

Scenario: BR-EVT-05 — điểm từ client bị bỏ qua
  Given client gửi game_completed với payload chứa score = 100
  When server tính kết quả phiên
  Then điểm được tính lại từ chuỗi answer_correct và answer_incorrect
  And giá trị score từ client không được dùng

Scenario: BR-EVT-04 — telemetry không sửa được
  Given một hàng telemetry_events đã tồn tại
  When chạy UPDATE trực tiếp trên hàng đó
  Then quyền DB từ chối

Scenario: BR-EVT-09 — phiên guest không cập nhật mastery
  Given một guest chơi xong một level free
  When kiểm mastery_state
  Then không hàng nào được tạo hay cập nhật
  And telemetry_events có hàng với child_uuid IS NULL

Scenario: BR-EVT-06 — mọi event mang content_version
  Given một phiên chơi hoàn tất
  When đọc mọi hàng telemetry_events của phiên
  Then không hàng nào có content_version NULL

Scenario: offline buffer flush khi có mạng lại
  Given trẻ chơi trong lúc mất mạng
  When mạng có lại trong vòng 24 giờ
  Then event được flush và ghi đủ
  And thứ tự seq được giữ nguyên
```

## 10. Boundaries

**Always**
- Kiểm tên event và schema payload ở server.
- Idempotent theo `(session_uuid, seq)`.
- Gắn `content_version` mọi event.
- Flush bằng `sendBeacon` khi trang ẩn.

**Ask first**
- Thêm event mới vào catalog.
- Đổi ngưỡng flush hoặc rate limit.
- Thêm field vào payload của event đã có.

**Never**
- PII, toạ độ thô, hay chuỗi tự do trong payload.
- Sửa schema của event đã thu dữ liệu — tạo event mới.
- Nhận điểm từ client.
- `UPDATE`/`DELETE` trên `telemetry_events`.
- Ghi `mastery_state` từ phiên guest.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | `fps_sample` mỗi 30s có quá dày không trên 3.000 phiên/ngày? Cân nhắc chỉ gửi khi p95 dưới ngưỡng | Chi phí lưu trữ | Hoãn, chặn phase P1 | hoãn — tuning sau khi có lưu lượng |
| 2 | Partition `telemetry_events` theo tháng ngay từ đầu? **Hai lượt quyết định:** | Thiết kế bảng | Hoãn, chặn phase P1 | hoãn — `telemetry_events` vượt 5M hàng hoặc 2GB thì đóng lại |
| | **Lượt 1 — 2026-08-06 (T11)**: chốt **có** — partition quyết định lúc `CREATE TABLE`. Trên t3.small bảng này lớn nhất, partition giúp prune query và vacuum hiệu quả. | | | |
| | **Lượt 2 — 2026-08-07 (T4b, D-Z)**: **mở lại** — khoá partition (`session_month`) phải nằm trong PK, dẫn tới PK thay đổi, dẫn tới ảnh hưởng quy tắc `BR-EVT-03` (idempotent theo `(session_uuid, seq)`). Chọn giữ bất biến PK `(session_uuid, seq)` ở P0, hoãn partition sang P1. | | | |
| | **Ngưỡng kích hoạt**: `telemetry_events` vượt **5M hàng** hoặc **2GB** trên t3.small thì phải đóng lại quyết định trước khi vượt. | | | |
| | **Điều kiện giữ đường mở**: không FK nào trỏ **vào** `telemetry_events`; giữ cột hẹp, index tối thiểu. | | | |
| 3 | Giữ event thô bao lâu trước khi rollup (tổng hợp dữ liệu chi tiết thành số liệu gộp) thành `child_session_summaries`? | Retention | Hoãn, chặn phase P1 | hoãn |
