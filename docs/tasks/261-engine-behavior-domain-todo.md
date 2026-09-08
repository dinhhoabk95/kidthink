# Task #261 Todo: Miền hành vi của engine

Plan: [`261-engine-behavior-domain-plan.md`](261-engine-behavior-domain-plan.md).

## T0 — Spec (xong 2026-09-07)

- [x] Viết [`engine-behavior-domain.md`](../specs/01-platform/engine-behavior-domain.md) — 6 miền, 3 ràng buộc nhịp, 13 rule `BR-EBD-*`
- [x] Bảng phân miền 37 engine (mục 7.2), đối chiếu bằng số đo trên registry
- [x] Số đo phủ miền theo band (mục 7.3): `3-4` = 2 · `4-5` = 5 · `5-6` = 6
- [x] Nâng khuôn phiếu engine 16 → 18 mục; thêm `BR-ESS-16` và `BR-ESS-17`
- [x] Thêm mục 17 và 18 vào [`engines/TEMPLATE.md`](../specs/01-platform/engines/TEMPLATE.md)
- [x] Viết mục 17 + 18 cho **37** phiếu `GT-000` … `GT-036`
- [x] Sửa hai chỗ trong [`CONVENTIONS.md`](../specs/CONVENTIONS.md) còn ghi "phiếu rút gọn mười mục"
- [x] `check:engine-specs` xanh sau thay đổi (37 mã, 37 spec, 0 mồ côi)

## T1 — Cấu hình

- [ ] Tạo `packages/game-engine/config/engine-behavior-domain.json` với `ratchet`, `domains`, `nhip`, 37 hàng `engines`
- [ ] Zod schema cho tệp cấu hình; tệp hỏng thì exit ≠ 0, cấm — NEVER trả rỗng rồi báo đạt
- [ ] Đối chiếu 37 hàng với mục 7.2 của spec, không gõ lại từ trí nhớ

## T2 — Cổng

- [ ] `packages/game-engine/scripts/check-engine-behavior.ts` — 10 phép kiểm ở mục 3.2 của plan
- [ ] Đọc `age_min`/`age_max`/`banned_age_bands` **từ registry**, cấm đọc từ `index.md`
- [ ] In số miền của từng band ở mọi lần chạy, kể cả khi xanh
- [ ] Thông báo lệch in **cả hai** giá trị (phiếu và cấu hình), theo kiểu `BR-ESS-02`

## T3 — Ca âm (`BR-EBD-13`)

- [ ] Miền ngoài từ vựng → đỏ
- [ ] Hai miền chủ đạo cho một engine → đỏ
- [ ] Phiếu thiếu bảng câu quan sát → đỏ
- [ ] Câu quan sát viết bằng từ kỹ thuật ("chọn đáp án đúng") → đỏ
- [ ] Mục 18 chỉ có hai trục biến thể → đỏ
- [ ] `do_mo` bỏ trống → đỏ
- [ ] Band tụt dưới bậc thang (giả lập `deprecated` engine gánh `lan-net` ở `4-5`) → đỏ

## T4 — Nối cổng

- [ ] `check:engine-behavior` vào `packages/game-engine/package.json`
- [ ] Gọi trong `scripts/check.sh`, ngay sau `check:engine-specs`
- [ ] Chạy bằng binary Node v24.15.0 (`node` trên PATH là v20, `pnpm` gãy ở đó)

## T5 — Index

- [ ] `scripts/gen-engine-index.ts` thêm cột **Miền**, đọc từ cấu hình
- [ ] Sinh lại `engines/index.md`, kiểm 37 hàng; cấm — NEVER sửa tay

## T6 — Bàn giao câu hỏi mở

- [ ] Đưa câu hỏi 1 (`GT-024` và miền `lan-net` ở band nhỏ) cho chủ **Nội dung**, kèm bảng điều kiện phát triển ở mục 17 của phiếu làm bằng chứng
- [ ] Đưa câu hỏi 2 (`GT-036`: cơ chế chặn hay thang chấm chặn) cho chủ **Nội dung**
- [ ] Đưa câu hỏi 3 (hành vi **nói** ở giai đoạn ba của `GT-000` không quan sát được vì cấm micro) cho chủ **Sư phạm**
