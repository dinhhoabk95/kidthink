# Kế hoạch Task #310: Lấp gap cổng chất lượng (Quality Gates Gaps)

Contract (tất cả ở `docs/specs/08-quality/`):
- `thinking-coverage-matrix.md` (`BR-TCM-01`, `BR-TCM-03`…`07`) — **đang đỏ, làm trước**
- `security-checklist.md` (`BR-SEC-04` phần query/params)
- `accessibility.md` (`BR-A11-01`, `BR-A11-09`)
- `design-system-contract.md` (`BR-DSC-27`)
- `go-live-readiness.md` (`BR-GLR-01`, mục 7.2 đủ 21 phép)
- `performance-budgets.md` (`BR-PRF-01`, `fps_sample`)
- `testing-strategy.md` (`BR-TST-01`, `BR-TST-10`, mục 7.1 E2E/A11y/Load)
- `type-safety.md` (`BR-TYP-03`, `BR-TYP-08`)
- Ngoài `08-quality/`: `05-content/engine-content-depth.md` (`BR-SKQ-02/03`, cổng xanh giả) và `testing-strategy.md` (test import symbol không tồn tại)

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G9 §A, §E; khối "Chưa hoàn thành" của từng spec):

| Spec | Hụt | Bằng chứng |
|---|---|---|
| thinking-coverage-matrix | Cổng **đỏ 2 test** | `packages/content-build/tests/gates/thinking-coverage.test.ts`: trục mechanic 37 so với 38 khuôn; corpus 12 vi phạm. File không có trong `scripts/test-baseline.json` |
| security-checklist | `BR-SEC-04` query/params | `apps/web/tests/security/route-validation.ts:8` ghi "Query và param không được cổng này đo" |
| accessibility | `BR-A11-01`, `BR-A11-09` | Không có `@axe-core/playwright` hay Playwright ở `package.json` nào; class `uppercase` ở `apps/web/app/pages/play/map.vue:94` |
| design-system-contract | `BR-DSC-27` | rg `tabular-nums` trong `apps/`, `packages/`: 0 |
| go-live-readiness | `BR-GLR-01` | `packages/content-build/src/gates/go-live-readiness.ts` (ở `check.sh:173`) chỉ đo 7 phép; spec 7.2 có 21 mục. Nhãn cứng `27/27 engine` ở `go-live-readiness.ts:126` (thực tế 38) |
| performance-budgets | `BR-PRF-01`, `fps_sample` | `scripts/check-bundle.ts:6` chỉ đo 80 KB/template; chưa đo app shell 180 KB, trang public 500 KB, payload level 200 KB, LCP. `fps_sample` chỉ khai ở `packages/play/src/events/catalog.ts:33`, không nơi phát. Không k6 |
| testing-strategy | `BR-TST-01`, `BR-TST-10`, 7.1 | Không `coverage.thresholds` trong `@mindkid/config/vitest`; không `gen:tests`, `test:e2e`, Playwright, axe, k6; `apps/web/tests/e2e/*.test.ts` là vitest (`auth-human-flow.test.ts:3`) |
| type-safety | `BR-TYP-08`, `BR-TYP-03` | `ultracite/core` tắt `noExplicitAny` cho `**/*.{test,spec}.*` — khoảng 530 chỗ `any` trong 85 file test (đo thô 2026-10-18); chưa cổng đo `unknown` khai mới |

Mục tiêu: cổng đỏ về xanh; mỗi BR trên có công cụ đo thật, cổng có ca âm, và bậc thang khi corpus đang nợ.

## 2. Thiết kế chung

- Cổng phạm vi workspace vào `<workspace>/tests/gates/`, **hai phần**: quét nguồn thật + ca âm; fixture vi phạm ở `tests/**/fixtures/`. Không dựng lại `packages/gates`. Không đọc `process.cwd()` (dùng `repoPath()`).
- Mỗi rule lint/cổng trỏ một `BR-*`. Không nới rule để qua cổng — nợ có sẵn đi bằng baseline chỉ giảm.
- Task #304 cũng sửa `go-live-readiness.ts` (`BR-BAK-06`) — làm sau thì rebase, không chép logic.
- `BR-TST-10` phụ thuộc `gen:tests` của Task #307: ở đây chỉ đảm bảo không có test rỗng pass (cổng quét `it(…, () => {})` rỗng), phần sinh test để #307.
- Dựng Playwright / axe / k6 kéo theo dependency và hạ tầng chạy trình duyệt → **chốt với người dùng** trước (S6). Nếu người dùng chọn hạ luật thay vì dựng, sửa spec trước, ghi rõ trong PR.

## 3. Lát cắt dọc

- **S1 — `thinking-coverage-matrix` về xanh** (cổng đang đỏ)
  - Đo: `rtk proxy pnpm --filter @mindkid/content-build exec vitest run tests/gates/thinking-coverage.test.ts`. Phân loại: trục mechanic thiếu khuôn thứ 38 (bổ sung vocab mechanic cho khuôn mới — kiểm GT-037 `symbol-hunt`) và 12 vi phạm corpus (sửa dữ liệu, không nới ngưỡng).
  - Test trước: ca âm (khuôn mới không có trong trục → đỏ) đã có hay chưa — nếu chưa, thêm.
  - Xong khi: file xanh; đưa vào `scripts/test-baseline.json` theo cách `check:test-ratchet` yêu cầu; sửa đường dẫn `packages/db/tests/gates/…` cũ trong spec.
- **S2 — `BR-SEC-04` query/params**
  - Test trước: fixture route dùng `getQuery`/`getRouterParam` không Zod → cổng đỏ.
  - Mở rộng `apps/web/tests/security/route-validation.ts`; route hiện vi phạm → sửa (thêm Zod) hoặc baseline chỉ giảm nếu nhiều.
  - Xong khi: `security-checklist.test.ts` xanh, sổ nợ (nếu có) ghi số.
- **S3 — `BR-A11-09` + `BR-DSC-27`**
  - Test trước: cổng `apps/web/tests/gates/` cấm class `uppercase` trên bề mặt tiếng Việt (ca âm fixture); cổng đòi `tabular-nums` trên thành phần hiển thị số đếm/điểm (HUD, victory-modal, dashboard) với ca âm.
  - Sửa `play/map.vue:94`; thêm `tabular-nums` qua token/utility.
  - Xong khi: 2 cổng xanh.
- **S4 — `go-live-readiness` đủ 21 phép (`BR-GLR-01`)**
  - Test trước: mỗi phép mới một ca âm (vd `content_pack` không parse được, band level sai, `theme_tag` ngoài registry, `BR-LTV-*`…).
  - Bỏ nhãn cứng `27/27` — đếm từ registry. Phép cần môi trường trình duyệt (E2E journey) phụ thuộc S6.
  - Xong khi: `rtk proxy pnpm check:go-live` đo đủ mục; bảng 7.2 spec cập nhật số liệu thật.
- **S5 — `performance-budgets`**
  - Test trước: build giả vượt 180/500/200 KB → `check:bundle` đỏ.
  - Mở rộng `scripts/check-bundle.ts`; phát `fps_sample` từ runtime game-engine (lấy mẫu, không mỗi frame) với test sự kiện.
  - Xong khi: `rtk proxy pnpm check:bundle` (sau build) xanh; event có nơi phát.
- **S6 — Chốt với người dùng: Playwright + axe + k6 + coverage**
  - Hỏi: dựng Playwright + `@axe-core/playwright` (`BR-A11-01`, E2E 7.1), k6 (`infra/load/`), sàn coverage 80/85 (`BR-TST-01`) — dựng hết, dựng một phần, hay sửa spec.
  - Theo quyết định: thêm dependency qua `catalog:`; `coverage.thresholds` trong `@mindkid/config/vitest` (đo coverage hiện tại trước; dưới sàn thì bậc thang, không hạ sàn).
  - Xong khi: mỗi tầng chốt có lệnh chạy được + ít nhất một ca âm; spec 7.1 phản ánh đúng.
- **S7 — `type-safety` (`BR-TYP-08`, `BR-TYP-03`)**
  - `any` trong test: ~530 chỗ → codemod (CLAUDE.md "Refactor diện rộng": bỏ comment/chuỗi trước khi đếm, sao lưu file ra ngoài repo trước khi ghi, chụp danh sách test trước/sau trùng khít). Sau khi về 0, bật `noExplicitAny` cho file test trong `biome.jsonc` (trỏ `BR-TYP-08`). Nếu không về 0 trong một lượt: cổng bậc thang đếm `any` theo file test, chỉ giảm.
  - `unknown` khai mới: cổng bậc thang đếm khai báo `unknown` (AST, không regex trên nguồn thô) theo file; file mới có `unknown` → đỏ. Ca âm fixture.
  - Xong khi: cả hai cổng có trong `scripts/check.sh`, xanh.
- **S7b — Cổng xanh giả và test chạy rỗng (phát hiện ở đợt dọn code thừa 2026-10-18)**
  - `pnpm check:skill-quota` (phase 1 `scripts/check.sh`) trỏ `tsx src/gates/skill-quota.ts`: module chỉ export hàm, không có entry → in 0 dòng, exit 0. CLI thật `packages/content-build/scripts/check-skill-quota.ts` không ai gọi; chạy nó → exit 1, 419/443 skill đạt, 38 vi phạm `BR-SKQ-02/03`.
    Sửa: trỏ script về CLI thật. `pnpm check` sẽ đỏ → **hỏi người dùng** bổ sung nội dung hay chuyển cổng sang bậc thang (không nới hạn ngạch).
  - Ba test web import symbol mà `@mindkid/db` không export, nên service tương ứng chưa có test nào chạy qua (đã đỏ sẵn trong `scripts/test-baseline.json`): `apps/web/tests/unit/server/lifecycle-service.test.ts` (`createNewVersion`, `rollbackVersion`, `deleteContentEntity`, `transitionContent`), `lifecycle-gates.test.ts` (`validateSeedBatchContent`), `ai-credit-ledger.test.ts` (`reconcileCreditBalance`). Sửa import về `#server/services/*`; test nào đỏ thật sau khi sửa → ghi vào task sở hữu spec (`#308` content-versioning, `#305`).
  - Xong khi: `check:skill-quota` đỏ đúng 38 vi phạm (hoặc bậc thang đã chốt), ca âm có; ba file test chạy được và ra khỏi danh sách đỏ của `test-baseline.json`.
- **S8 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, test các workspace bị chạm, `rtk proxy pnpm check:go-live`, `check:bundle`, cổng mới ở S3/S7, `rtk proxy pnpm check:test-ratchet` (số suite không tụt).
  - Spec: với mọi file trong `rtk proxy rg -l '#310' docs/specs` có `open_tasks` chứa `#310` — bỏ `#310` + khối "Chưa hoàn thành"; giữ/nâng `status: implemented`; `reviewed`. Cập nhật `runtime-gates.md` §1 (sổ cưỡng chế) cho các cổng mới.
  - Commit vào `main`.
