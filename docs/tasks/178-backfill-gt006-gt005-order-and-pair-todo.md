# Todo — Task #178: Backfill `GT-006` + `GT-005` — 8 game type v1, 80 level

> Kế hoạch: [`178-backfill-gt006-gt005-order-and-pair-plan.md`](178-backfill-gt006-gt005-order-and-pair-plan.md).
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

### `GT-006` sắp xếp thứ tự — band `5-6` duy nhất

- [ ] `D1-09` Đếm ngược — 10 level, tiêu chí **số giảm dần**, `C1.CNT.04`
- [ ] `D5-06` Sắp xếp Trật tự kích thước — 10 level, **kích thước**, `C1.MEAS.15`
- [ ] `D5-07` Thời gian: Trước/Sau — 10 level, **thời gian trong ngày**, `C1.MEAS.10`
- [ ] `D3-03` Sắp xếp Thứ tự (Seriation) — 10 level, **thuộc tính liên tục**, `C3.SRT.01`
- [ ] `D4-06` Sắp xếp Thứ tự — 10 level, **thứ hạng theo nhóm**, `C3.SRT.02`
- [ ] Khuôn cấm band `3-4` và `4-5` — mọi level phải là `5-6`, `max_out_of_band` giữ 0
- [ ] Trải bù bằng **chủ đề và mức khó** vì trục band đóng; ≥5 chủ đề trên 50 level

### `GT-005` ghép cặp

- [ ] `D1-02` Tương ứng 1-1 — 10 level, quan hệ **một đối một**, `C1.OTO.01`
- [ ] `D1-08` Ghép đôi Số-Chấm — 10 level, **ký hiệu ↔ lượng**, `C1.NREC.05`
- [ ] `D6-03` Nhân-Quả — 10 level, **nguyên nhân ↔ kết quả**, `C3.INF.03` · `C5.STO.04`
- [ ] `D6-03` gắn `thinking_tags` `infer`, cấm — NEVER gắn `match` như hai lô kia

## Đóng task

- [ ] `check:legacy-v1`: 8 game type của task đều ≥10 level.
- [ ] `seed:check` Cổng 1 xanh.
- [ ] `check:theme-registry` xanh.
- [ ] `check:engine-depth` xanh.
- [ ] **Ca âm:** gỡ 1 level của một game type vừa đủ 10 → `check:legacy-v1` đỏ. Hoàn tác.
- [ ] Review đối chiếu mẫu 3 level mỗi game type: dạng bài khớp thật.
- [ ] `pnpm check` xanh.
- [ ] Cập nhật dòng `#178` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
