# Todo — Task #175: Backfill `GT-003` — 8 game type v1, 80 level

> Kế hoạch: [`175-backfill-gt003-drag-to-container-plan.md`](175-backfill-gt003-drag-to-container-plan.md).
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

- [ ] `D1-01` Đếm & Kéo vào Rổ — 10 level, phân loại theo **số lượng**, `C1.CNT.01`
- [ ] `D1-04` Nhận diện Chữ số — 10 level, theo **chữ số**, `C1.NREC.02`
- [ ] `D2-05` Phân loại Hình — 10 level, theo **hình dạng**, `C3.CLS.02` · `C2.GEO.04`
- [ ] `D4-01` Phân nhóm theo Màu — 10 level, theo **màu**, `C3.CLS.01`
- [ ] `D4-02` Phân nhóm theo Hình — 10 level, theo **hình**, `C3.CLS.02`
- [ ] `D4-03` Phân nhóm theo Kích thước — 10 level, theo **kích thước**, `C3.CLS.03`
- [ ] `D4-04` Phân nhóm Đa thuộc tính — 10 level, **hai thuộc tính cùng lúc**, `C3.CLS.06`
- [ ] `D4-08` Phân loại Đời thực — 10 level, theo **công dụng**, `C3.CLS.04`
- [ ] Kiểm chéo: 8 lô khác nhau ở **thuộc tính phân loại**, cấm — NEVER chỉ khác chủ đề
- [ ] ≥4 chủ đề trên toàn engine — `engine_max_ratio` 0,5 với 80 level nghĩa là trần 40/chủ đề

## Đóng task

- [ ] `check:legacy-v1`: 8 game type của task đều ≥10 level.
- [ ] `seed:check` Cổng 1 xanh — mọi level mới qua `content_contract`.
- [ ] `check:theme-registry` xanh — `engine_max_ratio` 0,5 không vỡ.
- [ ] `check:engine-depth` xanh.
- [ ] **Ca âm:** gỡ 1 level của một game type vừa đủ 10 → `check:legacy-v1` đỏ. Hoàn tác.
- [ ] Review đối chiếu mẫu 3 level mỗi game type: dạng bài khớp thật, không phải khuôn khớp.
- [ ] `pnpm check` xanh.
- [ ] Cập nhật dòng `#175` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
