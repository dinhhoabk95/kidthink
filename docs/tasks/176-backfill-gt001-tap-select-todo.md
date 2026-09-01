# Todo — Task #176: Backfill `GT-001` — 7 game type v1, 70 level

> Kế hoạch: [`176-backfill-gt001-tap-select-plan.md`](176-backfill-gt001-tap-select-plan.md).
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

- [ ] `D1-03` So sánh Nhiều/Ít — 10 level, `C1.CMP.04` · `C1.CMP.05`
- [ ] `D1-11` Số Đang Trốn — 10 level, `C1.NREC.12`
- [ ] `D5-01` So sánh Kích thước — 10 level, so **thể tích/diện tích**, `C1.CMP.01` · `C1.MEAS.01`
- [ ] `D5-02` So sánh Cao/Thấp — 10 level, so **chiều cao**, `C1.MEAS.02`
- [ ] `D2-06` Hình 3D → 2D — 10 level, `C2.PER.03`
- [ ] `D4-05` Tìm Kẻ lạ — 10 level, `C3.DED.01`
- [ ] `D4-07` Thuộc về / Không thuộc — 10 level, `C3.CLS.04`
- [ ] Kiểm chéo: `D5-01` và `D5-02` khác nhau ở trục so sánh, không chỉ khác chủ đề
- [ ] ≥4 chủ đề trên toàn engine — trần 35 level/chủ đề

## Đóng task

- [ ] `check:legacy-v1`: 7 game type của task đều ≥10 level.
- [ ] `seed:check` Cổng 1 xanh — mọi level mới qua `content_contract`.
- [ ] `check:theme-registry` xanh — `engine_max_ratio` 0,5 không vỡ.
- [ ] `check:engine-depth` xanh.
- [ ] **Ca âm:** gỡ 1 level của một game type vừa đủ 10 → `check:legacy-v1` đỏ. Hoàn tác.
- [ ] Review đối chiếu mẫu 3 level mỗi game type: dạng bài khớp thật, không phải khuôn khớp.
- [ ] `pnpm check` xanh.
- [ ] Cập nhật dòng `#176` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
