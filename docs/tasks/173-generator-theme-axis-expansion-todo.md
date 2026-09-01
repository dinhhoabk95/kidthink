# Todo — Task #173: Mở trục chủ đề của 19 bộ sinh

> Kế hoạch: [`173-generator-theme-axis-expansion-plan.md`](173-generator-theme-axis-expansion-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 1.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [x] Đo: 19 bộ sinh đều khai đúng 5 chủ đề `school farm home nature food`.
- [x] Đo: 9 chủ đề chưa dùng — `animal` `ocean` `vehicle` `art` `space` `family` `body` `weather` `festival`.
- [x] Đo: cả 14 chủ đề đều có 10 danh từ — không có rào vốn từ.
- [x] [`Task #169`](169-mechanic-vocabulary-enforcement-plan.md) đã đóng.
- [x] Ghi lại nội dung `packages/db/config/theme-caps.json` — task này cấm — NEVER sửa file đó.

## WP173.1 — Mở trục

- [x] 19 file `generators/gt0nn.ts`: `axes.theme` lên **≥8** chủ đề (toàn bộ 36 bộ sinh dùng `[...VALID_GENERATOR_THEMES]` = 14 chủ đề).
- [x] Mỗi chủ đề bị loại có comment một dòng nêu lý do ngay tại `axes`.
- [x] Cấm — NEVER đổi một dòng nào trong thân `generate()`.
- [x] Đo lại: ≥**12/14** chủ đề có ít nhất một bộ sinh dùng (hiện 14/14).

## WP173.2 — Cổng

- [x] Test: mọi bộ sinh khai ≥8 chủ đề.
- [x] Test: mọi cặp `(engine, theme)` đã khai sinh được và qua `content_contract`.
- [x] Test: hai chủ đề khác nhau, **cùng seed**, cho `content_pack` khác nhau.
- [x] Test: đếm chủ đề được dùng ≥12.
- [x] **Ca âm 1:** hạ một bộ sinh xuống 5 chủ đề → test đỏ.
- [x] **Ca âm 2:** sửa một `generate()` cho bỏ qua tham số `theme` → phép kiểm nội-dung-khác-nhau đỏ. Hoàn tác sau khi ghi đầu ra.

## Đóng task

- [x] `pnpm --filter @mindkid/game-engine test` xanh.
- [x] `git diff` xác nhận chỉ đổi `axes.theme` và comment, không đổi thân `generate()`.
- [x] `packages/db/config/theme-caps.json` không có trong diff.
- [x] `pnpm check` xanh.
- [x] Cập nhật dòng `#173` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
