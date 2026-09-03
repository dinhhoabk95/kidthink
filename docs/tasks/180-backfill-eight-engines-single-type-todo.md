# Todo — Task #180: Backfill `GT-014` `GT-013` `GT-016` `GT-021` `GT-024` `GT-015` `GT-009` `GT-020` — 9 game type v1, 90 level

> Kế hoạch: [`180-backfill-eight-engines-single-type-plan.md`](180-backfill-eight-engines-single-type-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 2.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.
> Một work package = một game type v1, đóng dứt điểm rồi mới sang cái sau.

## Preflight

- [x] Chốt kiểm 1 đã xanh.
- [x] Đọc `docs/tasks/170-legacy-audit-report.md`, **trừ tín dụng audit** cho từng game type dưới đây.
- [x] Docker daemon chạy.
- [x] Ghi số trước: `check:legacy-v1` và `seed:report`.

## Work package

- [x] `D5-03` So sánh Nặng/Nhẹ → `GT-014` — 10 level, cân **vật thật**, `C1.MEAS.03`/`04`
- [x] `D6-08` Cân bằng Phương trình Hình → `GT-014` — 10 level, suy **giá trị ẩn**, `C1.NCOMP.11`/`12`
- [x] `D6-01` Mê cung Đơn giản → `GT-013` — 10 level, `C2.MAZ.01`/`03`
- [x] `D5-08` Thời gian: Đồng hồ → `GT-016` — 10 level, `C1.MEAS.14`/`15`
- [x] `D2-03` Đối xứng Gương → `GT-021` — 10 level, `C2.MIR.01`/`02`
- [x] `D2-09` Vẽ theo Nét chấm → `GT-024` — 10 level, `C1.NREC.08`/`09`
- [x] `D6-02` Sudoku Hình → `GT-015` — 10 level, `C3.MTX.01`/`02`
- [x] `D6-07` Thám Tử Logic → `GT-009` — 10 level, `C3.DED.03` · `C3.CLS.02`
- [x] `D6-11` Đối Ứng Vị Trí → `GT-020` — 10 level, `C6.WM.02` · `C6.INH.03`
- [x] Kiểm chéo `GT-014`: hai lô khác nhau ở **cái được cân**, có ca test khẳng định
- [x] Lô nào bộ sinh không sinh đủ 10 thì **mở lại** [`#171`](171-solver-backed-generators-plan.md) hoặc [`#172`](172-geometry-checked-generators-plan.md). Cấm — NEVER bù bằng soạn tay
- [x] `GT-024`: `tests/layout-safe-area-debt.json` không thêm dòng nào

## Đóng task

- [x] `check:legacy-v1`: 9 game type của task đều ≥10 level.
- [x] `seed:check` Cổng 1 xanh.
- [x] `check:theme-registry` xanh.
- [x] `check:engine-depth` xanh.
- [x] **Ca âm:** gỡ 1 level của một game type vừa đủ 10 → `check:legacy-v1` đỏ. Hoàn tác.
- [x] Review đối chiếu mẫu 3 level mỗi game type: dạng bài khớp thật.
- [x] `pnpm check` xanh.
- [x] Cập nhật dòng `#180` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
