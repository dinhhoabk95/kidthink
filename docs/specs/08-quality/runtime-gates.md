---
spec: RUNTIME-GATES
title: Sổ cưỡng chế — luật nào còn cổng, luật nào đã mất
area: quality
status: implemented
mvp: true
phase: P0
reviewed: 2026-11-24
owns:
  - Danh sách cổng đang chạy và lệnh gọi từng cổng
  - Sổ ghi luật `BR-*` đã mất cưỡng chế sau khi gỡ `packages/gates`
  - Chủ sở hữu của từng khoản nợ cưỡng chế
depends_on:
  - CONFIG-OWNERSHIP
---

# Sổ cưỡng chế runtime

`Q129-3` của [`129-mfa-and-runtime-boundary-closure-plan.md`](../../tasks/129-mfa-and-runtime-boundary-closure-plan.md)
đòi một chỗ có chủ để ghi các rule mất cưỡng chế sau khi `packages/gates` bị xoá. File này
là chỗ đó: nó liệt kê cổng nào đang chạy, chạy ở đâu, và luật nào không còn cổng.

Nguồn sự thật cho danh sách cổng là `package.json` gốc, [`lefthook.yml`](../../../lefthook.yml) và
[`.github/workflows/deploy-cloudflare.yml`](../../../.github/workflows/deploy-cloudflare.yml).
`scripts/check.sh` và mọi script `check:*` (kể cả `check:fast`, `check:engine-*`) đã gỡ ở `1dc7b60f`
(2026-10-31). Bảng dưới đối chiếu với các file đó ngày 2026-11-24; khi lệch nhau thì file cấu hình đúng,
sổ này sai và phải sửa.

## 1. Cổng đang chạy

### `pnpm check`

`pnpm check` = `pnpm lint && pnpm lint:deps && pnpm typecheck`. **Không** chạy test. Dừng ở lệnh đầu tiên đỏ.

| Lệnh | Đo gì |
| --- | --- |
| `pnpm lint` | Biome trên toàn repo (`biome check .`) |
| `pnpm lint:deps` | Ranh giới package (dependency-cruiser) |
| `pnpm typecheck` | `tsc --noEmit` gốc + `typecheck` từng app (`vue-tsc` trên `.nuxt/tsconfig.*.json` cho web/admin; `tsc` cho worker). Không baseline, mọi lỗi type đều đỏ. Web/admin cần `nuxt prepare` trước để sinh `.nuxt/` |

### Test

Vitest từng workspace (`cd <workspace> && rtk proxy npx vitest run --reporter=dot`), gồm các test cổng ở §2.
`pnpm test` gom mọi workspace nhưng test tích hợp DB có thể timeout khi chạy gộp.

### CI — `.github/workflows/deploy-cloudflare.yml`

Node lấy từ `.nvmrc`. Chuỗi: `pnpm install --frozen-lockfile` → `nuxt prepare` (web, admin; env giả) → `pnpm check` →
Terraform → `sync-wrangler-ids.ts` (sinh `.d1-ddl/{core,logs,blobs}.sql`) → `wrangler d1 execute` →
`pnpm build` + `verify-cf-budget.ts` (bundle Worker < 64 MiB, không native addon) → `wrangler deploy` →
smoke `/api/guest/health/deep` kèm rollback (`BR-DEP-08`). CI **không** chạy vitest.

## 2. Cổng trong `<workspace>/tests/gates/`

Các cổng này chạy trong vitest của từng workspace (không nằm trong `pnpm check`). Bảng chỉ ghi cổng trỏ tới luật
mà file này theo dõi; danh sách đủ là nội dung các thư mục `apps/*/tests/gates/` và
`packages/*/tests/gates/`.

| Cổng | Luật | Ca âm |
| --- | --- | --- |
| `apps/admin/tests/gates/runtime-boundary.ts` | `BR-ARB-04` | 6 — gồm middleware toàn cục thiếu và URL nội suy |
| `apps/web/tests/gates/mfa-key-custody.ts` | `BR-MFA-13` | 4 — khôi phục 2026-08-30 |
| `apps/web/tests/gates/kid-surface-touch-floor.ts` | `BR-DSC-28` | có |
| `apps/web/tests/security/route-validation.ts` | `BR-SEC-04`, `BR-TYP-04` | có |
| `packages/content-build/tests/gates/engine-content-depth.test.ts` | `BR-ECD-01..13` | có |
| `packages/content-build/tests/gates/theme-registry.test.ts` | `BR-CTR-*` | có |
| `packages/emoji/tests/gates/catalog-integrity.test.ts` | `BR-EMJ-09/10/11` (tự nhất quán danh mục) | 4 |
| `packages/content-build/tests/gates/corpus-truth.test.ts` | `BR-LCD-01`, `BR-LCD-10`, `BR-GLR-06` | 2 |
| `packages/content-build/tests/gates/go-live-readiness.test.ts` | hai cổng CLI (`engine-depth`, `go-live`) chạy được và trả lời (gộp từ `cli-gates`, 2026-11-24) | 1 |
| `packages/ui/tests/tokens.test.ts` | `BR-DSC-03/06/14` | có |
| `packages/game-engine/tests/gates/render.test.ts` | `BR-ERC-01..05` | có |
| `packages/game-engine/tests/gates/render-viewport.test.ts` | `BR-ERC-04` | có |
| `packages/game-engine/tests/gates/logic-space.test.ts` | `BR-ENG-14` | có |
| `packages/game-engine/tests/gates/glyph-code-leak.test.ts` | `BR-EMJ-04` | có |
| `packages/game-engine/tests/gates/client-entry-weight.test.ts` | `BR-TAK-08`, `BR-PRF-01` (nhịp 1) | có |

## 2b. Điểm mù của cổng

Gate local duy nhất là `lefthook` `pre-commit` → `biome-staged` (`BR-RBS-03`); CI chỉ chạy `pnpm check` và
build trước khi deploy.

1. **Không còn `pre-push` (2026-11-24).** Typecheck, `lint:deps` và vitest chỉ chạy khi người làm gọi
   `pnpm check` và vitest của workspace đã đụng.
2. **`git commit --no-verify` bỏ qua hook local**; CI không chạy vitest nên test đỏ không chặn deploy.
3. **Ngân sách bundle client (`BR-PRF-01`)**: `scripts/check-bundle.ts` và `check:bundle` đã gỡ; còn
   `client-entry-weight` (quét import tĩnh) và `verify-cf-budget.ts` (bundle Worker).
4. `check:render` / `check:hardcoded-params` (`packages/game-engine/scripts/`) đã gỡ cùng thư mục script.

Chủ và hạn: `BR-CFO-09`, `BR-CFO-10` của
[`config-ownership.md`](../00-foundation/config-ownership.md).

## 3. Luật đã MẤT cưỡng chế

`packages/gates` bị xoá 2026-08-29 (97 file, 253 test, 114 rule). Danh sách §4
của [`112-gates-package-removal-plan.md`](../../tasks/112-gates-package-removal-plan.md)
bỏ sót ít nhất tám khoản; bảng dưới là bản đủ.

| Linter đã xoá | Luật | Trạng thái |
| --- | --- | --- |
| `lint-route-validation.ts` | `BR-SEC-04` `BR-TYP-04` | **Đã khôi phục** ở `apps/web/tests/security/route-validation.ts` (phủ đủ `body`, `query`, `params`) |
| `lint-runtime-boundary.ts` | `BR-ARB-01..07` `BR-ADA-01` `BR-TYP-07` | **Một phần**: chỉ `BR-ARB-04` và chỉ trong `apps/admin` |
| `lint-tokens.ts` | `BR-DSC-01/02/03/05/06/13/14` `BR-A11-09` | **Một phần**: `packages/ui/tests/tokens.test.ts` đối chiếu giá trị token; hai cổng `check:render-tokens` (`BR-DSC-26`) và `check:config-ownership` (`BR-DSC-24`) đã gỡ nên phần hex thô và sở hữu cấu hình **MẤT**. Quét class `uppercase` (`BR-A11-09`) chưa có |
| `lint-mfa-key.ts` | `BR-MFA-13` | **Đã khôi phục** 2026-08-30 |
| `lint-perf-budget.ts` | `BR-PRF-01/02/08` | **Một phần**: chỉ còn `client-entry-weight` (nhịp 1, quét import tĩnh) và `verify-cf-budget.ts` (bundle Worker); đo gzip chunk client (`check:bundle`) đã gỡ. `BR-PRF-02/08` đo ở runtime/production |
| `lint-emoji-affordance.ts` | `BR-EMJ-03` | **MẤT** — thiếu trong danh sách §4 |
| `lint-shell-scripts.ts` | vệ sinh script shell | **MẤT** — thiếu trong §4; không có `shellcheck` ở đâu cả |
| `lint-import-paths.ts` | cấm import `../` xuyên tầng | **MẤT** — thiếu trong §4 |
| `check-web-scale-gate-lib.ts` | 24 rule `BR-APM/ASC/OCP/OFF/PWA/RBL` | **MẤT** — thiếu trong §4 |
| `lint-gating.ts` | `BR-GAT-01` | **MẤT phần quét**; unit test chỉ phủ `assertContentAccess` |
| `lint-prices.ts` | `BR-PKG-02` | MẤT |
| `lint-type-safety.ts` | `BR-TYP-02/05/08` | MẤT |
| `lint-specs-lib.ts` | `C1`–`C18`, `BR-ACT-07` `BR-CDC-02/03` `BR-ENG-01` `BR-GLOS-04` | MẤT |
| `lint-env-names.ts` | `BR-ENV-02/03` | MẤT |
| `lint-kid-surface.ts` | `BR-BPS-03` `BR-FBK-01/08` `BR-HPL-05` `BR-NIB-05` `BR-PEN-03/04` `BR-PGT-05` `BR-SCO-02` | MẤT |
| `lint-user-vocabulary.ts` | `BR-GLOS-03/04` | MẤT |
| `lint-rule-ids.ts` | `BR-REG2-01..04` | MẤT |

### 3b. Cổng gỡ ở Phase 7 dọn test cổng (2026-11-24)

Các cổng dưới đây bị xoá hoặc cắt vì trùng việc hay đo thứ không còn đáng đo. Cột cuối ghi luật
nào **không còn cổng** sau khi gỡ.

| Cổng đã gỡ / cắt | Luật | Trạng thái sau khi gỡ |
| --- | --- | --- |
| `apps/web/tests/gates/design-system-contract` | `BR-DSC-27` (`tabular-nums` cho số) | **MẤT** |
| `packages/content-build/tests/gates/montessori-corpus` | `BR-MGL-01/02` | **MẤT phần quét corpus**; `src/gates/montessori-gate.ts` còn nhưng không còn test cổng riêng |
| `engine-seed-matrix` (test, `src/gates/`, CLI `check-engine-seed-matrix`) | `BR-CSM-03`, `BR-ESS-15` | **MẤT** |
| `gate-ladder` (bậc thang cổng 1 và cổng 5 trên corpus) | `BR-ECD-11/13`, `BR-CSA-16` | Còn: `check-seed-gates.test.ts` có ca "Cổng 0..8 sạch" (`otherIssues` rỗng) chạy `runEightGates` trên toàn `ALL_SEED_LEVELS`; ca âm band ở `eight-gates.test.ts` |
| `backfill-tasks-179-180` | `BR-SKQ-02`, `BR-TAG-01..04` | Còn: `eight-gates` (cổng 1 contract, cổng 5 tag, `skill_codes`, `learning_objective_codes`, band tuổi) trên toàn corpus qua `check-seed-gates`; hạn ngạch ở `skill-quota`. Không còn: đếm riêng 220 level backfill |
| `packages/game-engine/tests/gates/engine-behavior` (+ helper) | `BR-EBD-01..12`, `BR-ESS-16/17` | **MẤT**; chỉ còn nửa corpus của `BR-EBD-04` ở `engine-behavior-corpus` (đọc `engine-behavior-domain.json`, `engine-behavior-baseline.json`) |
| `packages/game-engine/tests/gates/engine-turn` | `BR-ETS-01..12`, `BR-ESS-18/19`, `BR-PNR-03/04` | **MẤT**; `one-narration-source` và `play-narration-behavior` còn phủ một phần `BR-PNR-03/04` |
| `packages/game-engine/tests/gates/engine-specs` (+ `engine-spec-planned/ready.json`) | `BR-ESS-01..15` | **MẤT** |
| `child-data-compliance.test.ts` | `BR-CDC-06/08/11` | `BR-CDC-06` chuyển sang `packages/shared/tests/child-data.test.ts`; `BR-CDC-11` quét repo thật trong `admin-route-gates.test.ts`; `BR-CDC-08` do `public-scripts` đảm nhiệm (ca âm bằng fixture) — **MẤT** danh sách domain `mixpanel`/`segment`/`amplitude`/`hotjar` |
| `engine-input-dispatch` (ca liệt kê `GT-001..036`) | không có `BR-*` | Ca đếm `typeof session.*` còn |
| `taxonomy-refs` quét `docs/**` | — | **MẤT** phần mã kỹ năng chết trong `docs/`; vẫn quét `packages/content*/src` |
| `theme-registry` ca `BR-CTR-12` (một nguồn danh sách chủ đề) | `BR-CTR-12` | **MẤT** |
| `packages/shared/tests/quality-rules.test.ts` ca tài liệu AIG | `BR-AIG-03` | **MẤT** (tài liệu không còn bị đối chiếu); `BR-AIG-04` còn |
| `packages/db/tests/unit/schema-files.test.ts` trần 400 dòng | `BR-DM-11` | **MẤT** |

Lưu ý `BR-TST-02` (cấm mock DB): regex đã sửa để bắt `vi.mock` driver DB (`drizzle-orm`, `postgres`, `pg`,
`*sqlite*`) kể cả khi có factory. Tám lời gọi `vi.mock("@mindkid/db")` trong 7 file test hiện **không**
bị bắt vì `@mindkid/db` là package nội bộ, không phải driver.

## 4. Câu hỏi mở

| # | Câu hỏi | Chủ | Trạng thái |
| --- | --- | --- | --- |
| `Q-RG-1` | Bốn khoản "MẤT — thiếu trong §4" có dựng lại không, hay hạ luật xuống "chưa dựng"? | người quyết | mở |
| `Q-RG-2` | `BR-PRF-01` khai "vượt ngân sách chặn merge" nhưng `size-limit`/`k6` không có trong repo. Wire vào hay hạ luật? | người quyết | **Đóng ở #209 & #310**: tách hai nhịp — quét import tĩnh tại `pnpm test` (`client-entry-weight`), đo gzip thật cho toàn bộ bảng ngân sách `BR-PRF-01` tại `pnpm check:bundle` (`scripts/check-bundle.ts`) |
| `Q-RG-3` | Nợ `emoji_ref`: 7 glyph (🐭 ⬆️ ⬇️ ⬅️ ➡️ 💎 🐮) chưa có trong registry emoji. Bổ sung registry hay đổi nội dung? | Nội dung | mở |
| `Q-RG-4` | Các cổng `check:*` mồ côi nối hết vào `check.sh`? | người quyết | **Đóng 2026-10-31**: `check.sh` và mọi script `check:*` đã gỡ; chỉ còn `pnpm check` = lint + lint:deps + typecheck |
| `Q-RG-5` | `pre-push` mở lại với nội dung gì? | Infra | **Đóng 2026-11-24**: không có `pre-push`; xem §2b mục 1 |
| `Q-RG-6` | `check:taxonomy-docs` có mở rộng để đối chiếu cả dòng tóm tắt đầu file không? Hiện nó chỉ đọc hàng skill nên dòng tóm tắt sai mà cổng vẫn xanh | Nội dung | mở |
| `Q-RG-7` | `check:render` và `check:hardcoded-params` có vào gate không? | người quyết | **Đóng**: hai script đã gỡ |
