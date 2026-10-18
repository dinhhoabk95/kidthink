# Task #309 Todo: Lấp gap mô hình nội dung (Content Model Gaps)

Plan: [`309-content-model-gaps-plan.md`](309-content-model-gaps-plan.md).
Spec: [`05-content/`](../specs/05-content/) game-level-model, engine-competency-allocation, lesson-flow-model, lesson-template-variety, level-difficulty-contract, lesson-topic-composition, numeracy-representation-ladder, skill-thinking-structure, lesson-model, activity-model.

---

## S1 — Mã BR lệch trong code
- [ ] Chụp danh sách test `@mindkid/shared` (trước)
- [ ] Sửa mã `BR-LSM-*` ở `lesson-model.ts:142,225,239,279` và `BR-ACM-*` ở `activity-model.ts:167,308,313,326,339`
- [ ] Hỏi người dùng về luật "≤3 skill" (`lesson-model.ts:272`): thêm BR (spec trước) hay bỏ
- [ ] Chụp danh sách sau — chỉ đổi tên

## S2 — `check:hardcoded-params` + `BR-LDC-03/05/07/08`
- [ ] Đo hiện trạng `check:hardcoded-params`
- [ ] Test gắn mã 4 BR
- [ ] Nối vào `scripts/check.sh`

## S3 — `check:engine-allocation`
- [ ] Ca âm ECA-02, ECA-03 (đỏ)
- [ ] Test corpus đòi 0 vi phạm (hoặc baseline chỉ giảm)
- [ ] CLI trong `packages/content-build/src/cli/` + script + `check.sh`

## S4 — Thay 6 test giả `game-level-model`
- [ ] Ca âm cho `BR-GLM-01/03/06/07/08/10`
- [ ] Cổng phát hiện level trùng (AC §9)
- [ ] Số suite không tụt (`minTotalSuites`)

## S5 — `BR-LTV-07/09/10`
- [ ] Test đỏ LTV-09, LTV-10, LTV-07
- [ ] Mở rộng `lesson-variety.ts`

## S6 — `lesson-flow-model`
- [ ] Chốt `age_gap` vs `warning` (spec trước nếu đổi)
- [ ] Test đỏ `GET /api/users/children/{uuid}/flows` + `BR-LFM-07/08/09`
- [ ] Route `apps/web/server/api/users/children/[uuid]/flows.get.ts`

## S7 — Anchor còn thiếu
- [ ] `BR-LTC-08`
- [ ] `BR-NRL-09`
- [ ] `BR-STS-02/03/06/07/10`

## S8 — Trả nợ dữ liệu
- [ ] `lesson-topics-debt.json` 25 → 0
- [ ] `numeracy-ladder-baseline.json` 93 → 0
- [ ] `thinking-structure-baseline.json` 313 → 0
- [ ] Nếu dừng giữa chừng: ghi số nợ còn lại, giữ `#309` trên đúng spec còn nợ

## S9 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test content-build/shared/web + các cổng `check:*` liên quan xanh (qua `rtk proxy`)
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Bỏ `#309` khỏi `open_tasks` + khối "Chưa hoàn thành" ở spec đã hết gap; nâng `implemented`; `reviewed`
- [ ] Commit vào `main`
