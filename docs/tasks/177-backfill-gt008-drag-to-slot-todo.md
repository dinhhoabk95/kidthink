# Todo — Task #177: Backfill `GT-008` — 6 game type v1, 60 level

> Kế hoạch: [`177-backfill-gt008-drag-to-slot-plan.md`](177-backfill-gt008-drag-to-slot-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 2.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.
> Một work package = một game type v1, đóng dứt điểm rồi mới sang cái sau.

## Preflight

- [ ] Chốt kiểm 1 đã xanh.
- [ ] Đọc `docs/tasks/170-legacy-audit-report.md`, **trừ tín dụng audit** cho từng game type dưới đây.
- [ ] Docker daemon chạy.
- [ ] Ghi số trước: `check:legacy-v1` và `seed:report`.

## Work package

- [ ] `D1-05` Chuỗi Số Đặt đúng — 10 level, `C1.NREC.09`
- [ ] `D5-05` Đo bằng Thước — 10 level, `C1.MEAS.09`
- [ ] `D2-01` Ghép hình vào Lỗ — 10 level, `C2.GEO.01` · `C2.CON.01`
- [ ] `D3-01` Tiếp nối Quy luật Màu — 10 level, chỗ trống **ở cuối**, `C1.PAT.10` · `C3.RULE.02`
- [ ] `D3-02` Điền Chỗ trống trong Chuỗi — 10 level, chỗ trống **ở giữa**, `C3.RULE.02`
- [ ] `D6-04` Hoàn thiện Bức tranh — 10 level, `C4.VIS.04` · `C3.INF.01`
- [ ] Kiểm chéo: `D3-01` và `D3-02` khác nhau ở vị trí chỗ trống, có ca test khẳng định
- [ ] ≥3 chủ đề trên toàn engine — trần 30 level/chủ đề

## Đóng task

- [ ] `check:legacy-v1`: 6 game type của task đều ≥10 level.
- [ ] `seed:check` Cổng 1 xanh — mọi level mới qua `content_contract`.
- [ ] `check:theme-registry` xanh — `engine_max_ratio` 0,5 không vỡ.
- [ ] `check:engine-depth` xanh.
- [ ] **Ca âm:** gỡ 1 level của một game type vừa đủ 10 → `check:legacy-v1` đỏ. Hoàn tác.
- [ ] Review đối chiếu mẫu 3 level mỗi game type: dạng bài khớp thật, không phải khuôn khớp.
- [ ] `pnpm check` xanh.
- [ ] Cập nhật dòng `#177` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
