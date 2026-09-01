# Todo — Task #173: Mở trục chủ đề của 19 bộ sinh

> Kế hoạch: [`173-generator-theme-axis-expansion-plan.md`](173-generator-theme-axis-expansion-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 1.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [x] Đo: 19 bộ sinh đều khai đúng 5 chủ đề `school farm home nature food`.
- [x] Đo: 9 chủ đề chưa dùng — `animal` `ocean` `vehicle` `art` `space` `family` `body` `weather` `festival`.
- [x] Đo: cả 14 chủ đề đều có 10 danh từ — không có rào vốn từ.
- [ ] [`Task #169`](169-mechanic-vocabulary-enforcement-plan.md) đã đóng.
- [ ] Ghi lại nội dung `packages/db/config/theme-caps.json` — task này cấm — NEVER sửa file đó.

## WP173.1 — Mở trục

- [ ] 19 file `generators/gt0nn.ts`: `axes.theme` lên **≥8** chủ đề.
- [ ] Mỗi chủ đề bị loại có comment một dòng nêu lý do ngay tại `axes`.
- [ ] Cấm — NEVER đổi một dòng nào trong thân `generate()`.
- [ ] Đo lại: ≥**12/14** chủ đề có ít nhất một bộ sinh dùng.

## WP173.2 — Cổng

- [ ] Test: mọi bộ sinh khai ≥8 chủ đề.
- [ ] Test: mọi cặp `(engine, theme)` đã khai sinh được và qua `content_contract`.
- [ ] Test: hai chủ đề khác nhau, **cùng seed**, cho `content_pack` khác nhau.
- [ ] Test: đếm chủ đề được dùng ≥12.
- [ ] **Ca âm 1:** hạ một bộ sinh xuống 5 chủ đề → test đỏ.
- [ ] **Ca âm 2:** sửa một `generate()` cho bỏ qua tham số `theme` → phép kiểm nội-dung-khác-nhau đỏ. Hoàn tác sau khi ghi đầu ra.

## Đóng task

- [ ] `pnpm --filter @mindkid/game-engine test` xanh.
- [ ] `git diff` xác nhận chỉ đổi `axes.theme` và comment, không đổi thân `generate()`.
- [ ] `packages/db/config/theme-caps.json` không có trong diff.
- [ ] `pnpm check` xanh.
- [ ] Cập nhật dòng `#173` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
