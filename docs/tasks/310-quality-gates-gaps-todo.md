# Task #310 Todo: Lấp gap cổng chất lượng (Quality Gates Gaps)

Plan: [`310-quality-gates-gaps-plan.md`](310-quality-gates-gaps-plan.md).
Spec: [`08-quality/`](../specs/08-quality/) thinking-coverage-matrix, security-checklist, accessibility, design-system-contract, go-live-readiness, performance-budgets, testing-strategy, type-safety.

---

## S1 — `thinking-coverage-matrix` về xanh
- [ ] Chạy cổng qua `rtk proxy`, phân loại 2 test đỏ
- [ ] Bổ sung trục mechanic cho khuôn thứ 38
- [ ] Sửa 12 vi phạm corpus (dữ liệu, không nới ngưỡng)
- [ ] Đưa file vào `scripts/test-baseline.json` đúng cách
- [ ] Sửa đường dẫn `packages/db/tests/gates/…` cũ trong spec

## S2 — `BR-SEC-04` query/params
- [ ] Fixture ca âm `getQuery`/`getRouterParam` không Zod
- [ ] Mở rộng `route-validation.ts`; sửa route vi phạm hoặc baseline chỉ giảm

## S3 — `BR-A11-09` + `BR-DSC-27`
- [ ] Cổng cấm `uppercase` + ca âm
- [ ] Cổng `tabular-nums` + ca âm
- [ ] Sửa `apps/web/app/pages/play/map.vue:94`; thêm `tabular-nums` cho HUD, victory-modal, dashboard

## S4 — `go-live-readiness` đủ 21 phép
- [ ] Ca âm cho từng phép mới
- [ ] Mở rộng `go-live-readiness.ts`; bỏ nhãn cứng `27/27`
- [ ] Cập nhật bảng 7.2 spec

## S5 — `performance-budgets`
- [ ] Ca âm vượt 180/500/200 KB
- [ ] Mở rộng `scripts/check-bundle.ts`
- [ ] Phát `fps_sample` từ runtime + test

## S6 — Chốt Playwright / axe / k6 / coverage
- [ ] Hỏi người dùng phạm vi dựng
- [ ] Dựng tầng đã chốt (dependency `catalog:`), mỗi tầng một ca âm
- [ ] `coverage.thresholds` trong `@mindkid/config/vitest` (bậc thang nếu dưới sàn)
- [ ] Spec 7.1 phản ánh đúng

## S7 — `type-safety`
- [ ] Chụp danh sách test (trước); sao lưu file ra ngoài repo
- [ ] Codemod bỏ `any` trong test (~530 chỗ)
- [ ] Bật `noExplicitAny` cho test trong `biome.jsonc` (hoặc bậc thang theo file)
- [ ] Cổng bậc thang `unknown` khai mới (AST) + ca âm
- [ ] Chụp danh sách sau — trùng khít

## S8 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test workspace bị chạm + `check:go-live`, `check:bundle`, cổng mới xanh (qua `rtk proxy`)
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Bỏ `#310` khỏi `open_tasks` + khối "Chưa hoàn thành"; `implemented`; `reviewed`; cập nhật `runtime-gates.md` §1
- [ ] Commit vào `main`
