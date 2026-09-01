# Kế hoạch — Task #188: `GT-035` Xếp hàng lệnh — `command-sequence`

> **Loại task:** lát dọc engine + hệ thống mới (L) — đợt 4 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** khuôn `GT-035` chạy được, cộng **10 level** mang `legacy_v1_ref: "D6-05"`.
> **Game type v1 gánh:** `D6-05` Code Đường đi (Unplugged) — `C6.PLN.01` —
> nguồn `d6/CodePathLogicSession.ts` · `systems/stackSystem.ts` (`RelativeCommand`).
> **Chặn bởi:** [`#187`](187-engine-gt-034-beat-sequence-plan.md). **Cấm — NEVER chạy song song** với `#187` `#189`.
> **Spec sở hữu:** phiếu engine [`docs/specs/01-platform/engines/GT-035.md`](../specs/01-platform/engines/GT-035.md) — **đã viết** ở [Task #190](190-engine-spec-first-authoring-spec.md). Task này cấm — NEVER viết lại phiếu; nó dựng khuôn theo phiếu, và **gỡ `GT-035` khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR** (`BR-ESS-15`).

## 1. Vì sao khuôn này tồn tại

Bảng migration gộp `D6-05` vào `tpl-maze-route`, tức `GT-013`. Gộp làm mất toàn bộ nội dung nhận
thức của bài.

`GT-013` là **tìm đường**: trẻ nhìn mê cung, kéo ngón tay theo lối đi, thấy ngay mình đang ở đâu.
`D6-05` là **lập trình**: trẻ xếp một hàng lệnh (`forward`, `turn_left`, `turn_right`, `loop`) **rồi
mới** bấm chạy, và chỉ lúc đó mới biết đúng sai. Phản hồi bị hoãn lại — đó chính là thứ dạy lập kế
hoạch, và là lý do `C6.PLN.01` gắn vào bài này chứ không gắn vào `GT-013`.

v1 đã có `RelativeCommand` với bốn lệnh kể trên và `MAX_CODE_COMMANDS = 8`. Grep `commandQueue` trên
`packages/game-engine/src` của v2 trả về **0 kết quả**.

## 2. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `command-sequence` |
| Nguyên thuỷ | `ordering` |
| Band | `5-6` — `banned_age_bands: ["3-4", "4-5"]` |
| `layouts` | `matrix-slot-grid` · `step-ladder` |
| Hệ thống mới | `systems/command-queue-system.ts` |
| `status` | `draft` |

### Hợp đồng nội dung

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `prompt_audio_ref` | chuẩn | |
| `grid` | `rows` 3–6 · `cols` 3–6 | |
| `start` | `col` + `row` + `facing` (`up`/`down`/`left`/`right`) | |
| `goal` | `col` + `row` + `asset` | |
| `obstacles` | 0–8 ô | |
| `collectibles` | 0–4 ô, mỗi ô `asset` | tuỳ chọn, phải nhặt hết trước khi tới đích |
| `allowed_commands` | tập con của `forward` `turn_left` `turn_right` `loop` | |

`refine`: tồn tại một chuỗi lệnh ≤ `max_commands` đưa robot từ `start` qua hết `collectibles` tới
`goal` mà không đâm `obstacles`. Trình giải chạy **cùng** trình chạy của session — cấm — NEVER hai bản.

### Hợp đồng độ khó

`max_commands` (≤8) · `obstacle_count` · `collectible_count` · `allow_loop` · `allow_retry` ·
`hint_after_ms`.

### Event

`game_started` · `command_added` · `command_removed` · `program_run` · `program_failed` ·
`game_completed`. Bốn event giữa là mới.

## 3. `CommandQueueSystem` — hai chế độ tách bạch

| Chế độ | Trẻ làm gì | Hệ thống làm gì |
|---|---|---|
| **Soạn** | thêm, bớt, đổi thứ tự lệnh | giữ hàng lệnh; cấm — NEVER chấm, cấm — NEVER gợi ý đúng sai |
| **Chạy** | bấm chạy, xem robot đi từng bước | chạy tuần tự, dừng ở va chạm, phát `program_failed` |

Tách bạch hai chế độ là **điểm cốt lõi**. Chấm trong lúc soạn biến bài lập kế hoạch thành bài thử
sai, và xoá đúng thứ `C6.PLN.01` đo.

Trần **8 lệnh** giữ nguyên như v1. Đây là ràng buộc sư phạm — hàng lệnh dài hơn thì trẻ không giữ nổi
trong đầu — nên nó phải ghi lý do vào phiếu engine mục 11, cấm — NEVER để như một con số trần trụi.

`loop` là lệnh lặp đơn giản: lặp N lần khối liền trước. Cấm — NEVER lồng `loop` trong `loop`.

## 4. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `GT-035` trong registry, phiếu không mồ côi | `check:engine-specs` |
| 2 | `CommandQueueSystem` dựng độc lập, ≥10 ca test riêng | `tests/command-queue-system.test.ts` |
| 3 | **Ca bắt buộc:** ở chế độ soạn, thêm lệnh sai không phát event đúng-sai nào | test |
| 4 | Trình giải của `refine` và trình chạy của session là **một** | review + ca test dùng chung hàm |
| 5 | `max_commands` ≤ 8 ở mọi level; lý do ghi ở phiếu mục 11 | test + đọc phiếu |
| 6 | `loop` không lồng nhau | `refine` + ca âm |
| 7 | ≥12 ca test phiên engine, có ca chạy thất bại rồi sửa hàng lệnh rồi chạy lại | test |
| 8 | Bộ sinh ≥8 chủ đề; mọi bài sinh ra có lời giải ≤ `max_commands` | `tests/generators.test.ts` |
| 9 | 10 level `legacy_v1_ref: "D6-05"`, `check:legacy-v1` tăng đúng 1 | `check:legacy-v1` |
| 10 | `pnpm check` xanh | — |

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Chấm trong lúc soạn, biến thành bài thử sai | Cao | Nghiệm thu 3 là ca bắt buộc, không phải tuỳ chọn |
| Hai bản trình chạy drift | Cao | Nghiệm thu 4; `refine` import chính hàm session dùng |
| Tụt xuống thành `GT-013` trá hình | Cao | Không có `program_run` thì không phải khuôn này; phiếu ghi rõ ranh giới |
| `loop` lồng nhau làm bài vượt sức trẻ | Trung bình | Nghiệm thu 6 + ca âm |
| Bộ sinh ra bài vô nghiệm | Cao | Trình giải chạy trong bộ sinh; ứng viên vô nghiệm bị loại, hết lượt rút thì thoát khác 0 |
