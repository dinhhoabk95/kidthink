# Todo — Task #174: Bật `engine-depth` bậc 1

> Kế hoạch: [`174-engine-depth-step-1-plan.md`](174-engine-depth-step-1-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 1, task cuối trước chốt kiểm 1.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [x] Đo: 250 level, 13 engine đứng đúng ở sàn 3, `active_step: 0`.
- [x] [`#171`](171-solver-backed-generators-plan.md) · [`#172`](172-geometry-checked-generators-plan.md) · [`#173`](173-generator-theme-axis-expansion-plan.md) đã đóng.
- [x] Docker daemon chạy; `check:engine-depth` và `seed:report` đọc được Postgres `127.0.0.1:5433`.
- [x] Chạy `check:engine-depth` **ở bậc 1 mà chưa đổi cấu hình**, lưu danh sách engine thủng và trục thiếu.

## WP174.1 — Bù level

- [x] Với mỗi engine thủng: `gen:levels --engine=GT-0nn --theme=<mới> --band=<thiếu> --count=<thiếu>`.
- [x] Chọn chủ đề và band theo **trục đang thiếu**, cấm — NEVER chọn cho đủ số lượng.
- [x] Mỗi engine có ≥1 level `free` hoặc `login`.
- [x] Gắn `legacy_v1_ref` cho level bù **chỉ khi** dạng bài khớp một game type v1; không khớp thì để trống.
- [x] Mọi level bù qua `content_contract` — `seed:check` Cổng 1 xanh.

## WP174.2 — Bật bậc

- [x] `packages/db/config/engine-depth.json`: `active_step` 0 → 1.
- [x] Thêm hàng vào `history` kèm ngày.
- [x] Cấm — NEVER đổi bất kỳ giá trị nào trong `steps`. Đối chiếu diff trước khi commit.

## WP174.3 — Cổng

- [x] `check:engine-depth` thoát 0 ở bậc 1.
- [x] Mọi engine ≥6 level, span ≥2 bốn trục, `max_out_of_band` = 0.
- [x] Tổng level ≥ **162** — `seed:report`.
- [x] `check:theme-registry` xanh.
- [x] **Ca âm:** gỡ một level của một engine đang ở sàn → `check:engine-depth` thoát khác 0. Hoàn tác.

## Đóng task và mở chốt kiểm 1

- [x] `pnpm check` xanh.
- [x] Ghi số cuối: tổng level · engine thấp nhất · số chủ đề đang dùng.
- [x] Cập nhật dòng `#174` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
- [x] **Chốt kiểm 1:** trình số audit của [`#170`](170-legacy-v1-traceability-spine-plan.md) cùng số của task này.
      Kích thước sáu task đợt 2 tính từ đó — cấm — NEVER viết plan đợt 2 trước bước này.
