# Task #302 Todo: Lấp gap cử chỉ và luật của từng engine (Engine Input Gaps)

Plan: [`302-engine-input-gaps-plan.md`](302-engine-input-gaps-plan.md).
Spec: phiếu [`engines/`](../specs/01-platform/engines/) GT-001, GT-013, GT-029, GT-032, GT-033, GT-035, GT-036, GT-037; [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md) `BR-ESS-12/13`.

---

## S1 — GT-037 vào ready list
- [ ] Thêm `"GT-037"` vào `packages/game-engine/config/engine-spec-ready.json`
- [ ] `rtk proxy pnpm check:engine-specs` xanh (sửa phiếu nếu đỏ)
- [ ] Chạy lại `gen:engine-index`

## S2 — GT-001 luật một đáp án + trần band
- [ ] Test đỏ `BR-E001-01/02/04`
- [ ] `superRefine` đúng một `is_correct` trong `GT-001/template.ts`
- [ ] Chặn max 3 lựa chọn band 3-4 ở `generators/gt001.ts`
- [ ] Sửa level corpus vi phạm (nếu có); `seed:check` xanh

## S3 — `drop` cho GT-029, GT-035, GT-036
- [ ] Test đỏ `drop` + `BR-E029-03` + `BR-E035-07`
- [ ] Nhánh `drop` ở `GT-029/session.ts`, `GT-035/session.ts`, `GT-036/session.ts`
- [ ] Sửa §17 GT-036 theo khuôn (nếu sai)

## S4 — GT-033 kiểm quy luật hàng/cột
- [ ] Test đỏ `BR-E033-02/03`
- [ ] Chấm theo dữ liệu ô, cờ hỏng theo chiều; bỏ phụ thuộc `solution` (hoặc sửa §7 phiếu trước)

## S5 — GT-032 `adjust` ở `pour_to_mark`
- [ ] Test đỏ kéo mực tới vạch / lệch dung sai
- [ ] Nhánh `adjust` + `isCupCorrect` theo mức kéo
- [ ] §12 phiếu thêm `grid`

## S6 — GT-013 `stroke` + mũi tên
- [ ] Hỏi người dùng nếu cân nhắc hạ §17 về `tap`
- [ ] Test đỏ `stroke` → `draw_step`, `move_arrow`, hint ô kế
- [ ] Cài ở `GT-013/session.ts` + `systems/maze-system.ts`

## S7 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] `rtk proxy pnpm --filter @mindkid/game-engine test` xanh
- [ ] `check:engine-specs`, `check:engine-turn`, `check:engine-behavior`, `check:hint-target` xanh (qua `rtk proxy`)
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Bỏ `#302` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng status; `reviewed`
- [ ] Commit vào `main`
