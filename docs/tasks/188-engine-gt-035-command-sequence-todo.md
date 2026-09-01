# Todo — Task #188: `GT-035` Xếp hàng lệnh

> Kế hoạch: [`188-engine-gt-035-command-sequence-plan.md`](188-engine-gt-035-command-sequence-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 4. Sau [`#187`](187-engine-gt-034-beat-sequence-plan.md).
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [x] [`#187`](187-engine-gt-034-beat-sequence-plan.md) đã đóng.
- [x] Đọc `tinimath/.../d6/CodePathLogicSession.ts` và `systems/stackSystem.ts` (`RelativeCommand`, `MAX_CODE_COMMANDS`). Cấm — NEVER copy mã.
- [x] Xác nhận lại: grep `commandQueue` trên `packages/game-engine/src` → 0 kết quả.

## WP188.1 — `CommandQueueSystem`

- [x] `systems/command-queue-system.ts` — bốn lệnh `forward` `turn_left` `turn_right` `loop`.
- [x] Chế độ **soạn**: thêm, bớt, đổi thứ tự. Cấm — NEVER chấm, cấm — NEVER gợi ý đúng sai.
- [x] Chế độ **chạy**: chạy tuần tự, dừng ở va chạm, phát `program_failed`.
- [x] Trần 8 lệnh; `loop` cấm — NEVER lồng nhau.
- [x] `tests/command-queue-system.test.ts` ≥10 ca, dựng độc lập không cần `GameEngine`.
- [x] **Ca bắt buộc:** ở chế độ soạn, thêm lệnh sai → không phát event đúng-sai nào.
- [x] **Ca âm:** `loop` lồng `loop` → bị từ chối.

## WP188.2 — Khuôn

- [x] `new:template GT-035 'Xếp hàng lệnh' command-sequence`
- [x] Contract theo mục 2 của plan: `grid` · `start` · `goal` · `obstacles` · `collectibles` · `allowed_commands`.
- [x] `refine` gọi **chính** trình chạy của session, cấm — NEVER viết bản thứ hai.
- [x] Band `5-6`; `layouts` `matrix-slot-grid` · `step-ladder`.
- [x] Bốn event mới `command_added` `command_removed` `program_run` `program_failed` đăng ký vào catalog **và** `ALLOWED_EVENT_NAMES`.

## WP188.3 — Phiên chơi và bộ sinh

- [x] `session.ts` trên nguyên thuỷ `ordering`.
- [x] `fixtures.ts` — 3 level: không vật cản, có vật cản, có `loop`.
- [x] `tests/gt-035-command-sequence.test.ts` ≥12 ca, có ca chạy thất bại → sửa hàng lệnh → chạy lại.
- [x] `generators/gt035.ts` ≥8 chủ đề, band `5-6`; trình giải chạy trong bộ sinh, bài vô nghiệm bị loại.
- [x] **Ca âm:** ép sinh bài vô nghiệm → bị loại; hết lượt rút thì thoát khác 0.

## WP188.4 — Phiếu, sinh mã, 10 level

- [x] `docs/specs/01-platform/engines/GT-035.md` — 10 mục; mục 11 ghi **lý do** trần 8 lệnh.
- [x] `gen:templates` không sinh diff · `gen:engine-index` có `GT-035` · `check:engine-specs` xanh.
- [x] `gen:levels --engine=GT-035 --seed=188` — 10 level, ≥3 chủ đề.
- [x] Gắn `legacy_v1_ref: "D6-05"` cho cả 10; `check:legacy-v1` tăng đúng 1.

## Đóng task

- [x] Review xác nhận **một** trình chạy dùng chung giữa `refine` và session.
- [x] `check:theme-registry` · `check:engine-depth` xanh.
- [x] `pnpm check` xanh · `status` vẫn `draft`.
- [x] Cập nhật dòng `#188` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
