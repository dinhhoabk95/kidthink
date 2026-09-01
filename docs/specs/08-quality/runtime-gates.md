---
spec: RUNTIME-GATES
title: Sổ cưỡng chế — luật nào còn cổng, luật nào đã mất
area: quality
status: approved
mvp: true
phase: P0
reviewed: 2026-08-30
owns:
  - Danh sách cổng đang chạy và lệnh gọi từng cổng
  - Sổ ghi luật `BR-*` đã mất cưỡng chế sau khi gỡ `packages/gates`
  - Chủ sở hữu của từng khoản nợ cưỡng chế
---

# Sổ cưỡng chế runtime

`Q129-3` của [`129-mfa-and-runtime-boundary-closure-plan.md`](../../tasks/129-mfa-and-runtime-boundary-closure-plan.md)
đòi một chỗ có chủ để ghi 113 rule còn lại mất cưỡng chế sau khi `packages/gates`
bị xoá. Checklist của Task #129 đánh dấu ô đó là **đã làm** và trỏ tới chính
file này — nhưng file chưa từng được tạo. Đây là file đó.

## 1. Cổng đang chạy — đây là toàn bộ

| Lệnh | Đo gì | Ca âm |
| --- | --- | --- |
| `pnpm lint` | Biome trên toàn repo | Biome tự có |
| `pnpm lint:deps` | Ranh giới package (dependency-cruiser) | 8 rule |
| `pnpm typecheck` | `tsc` + `vue-tsc` trên 10 project, bậc thang nợ | `scripts/typecheck/typecheck-gate.test.ts` — 12 ca, gồm OOM kill và `--update` tăng nợ |
| `pnpm test` | Unit/integration + cổng trong `<workspace>/tests/gates/` | theo từng cổng |
| `pnpm test:deploy` | Script hạ tầng (`infra/scripts/tests/run.sh`) | 64 ca |

## 2. Cổng trong `<workspace>/tests/gates/`

| Cổng | Luật | Ca âm |
| --- | --- | --- |
| `apps/admin/tests/gates/runtime-boundary.ts` | `BR-ARB-04` | 6 — gồm middleware toàn cục thiếu và URL nội suy |
| `apps/web/tests/gates/mfa-key-custody.ts` | `BR-MFA-13` | 4 — khôi phục 2026-08-30 |
| `apps/web/tests/security/route-validation.ts` | `BR-SEC-04`, `BR-TYP-04` | có |
| `packages/db/tests/gates/engine-content-depth.test.ts` | `BR-ECD-01..13` | có |
| `packages/db/tests/gates/theme-registry.test.ts` | `BR-CTR-*` | có |
| `packages/db/tests/gates/emoji-glyph-integrity.test.ts` | `BR-EMJ-09/10/11/12` | 5 |
| `packages/db/tests/gates/corpus-truth.test.ts` | `BR-LCD-01`, `BR-LCD-10`, `BR-GLR-06` | 2 |
| `packages/db/tests/gates/cli-gates.test.ts` | ba cổng CLI thực sự chạy | 1 |
| `packages/ui/tests/tokens.test.ts` | `BR-DSC-03/06/14` | có |

## 3. Luật đã MẤT cưỡng chế

`packages/gates` bị xoá 2026-08-29 (97 file, 253 test, 114 rule). Danh sách §4
của [`112-gates-package-removal-plan.md`](../../tasks/112-gates-package-removal-plan.md)
bỏ sót ít nhất tám khoản; bảng dưới là bản đủ.

| Linter đã xoá | Luật | Trạng thái |
| --- | --- | --- |
| `lint-route-validation.ts` | `BR-SEC-04` `BR-TYP-04` | **Còn** ở `apps/web/tests/security/`. Chỉ phủ body; query/param chưa đo |
| `lint-runtime-boundary.ts` | `BR-ARB-01..07` `BR-ADA-01` `BR-TYP-07` | **Một phần**: chỉ `BR-ARB-04` và chỉ trong `apps/admin` |
| `lint-tokens.ts` | `BR-DSC-01/02/03/05/06/13/14` `BR-A11-09` | **Một phần**: chỉ đối chiếu giá trị token |
| `lint-mfa-key.ts` | `BR-MFA-13` | **Đã khôi phục** 2026-08-30 |
| `lint-perf-budget.ts` | `BR-PRF-01/02/08` | **MẤT** — thiếu trong danh sách §4 |
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

## 4. Câu hỏi mở

| # | Câu hỏi | Chủ |
| --- | --- | --- |
| `Q-RG-1` | Bốn khoản "MẤT — thiếu trong §4" có dựng lại không, hay hạ luật xuống "chưa dựng"? | người quyết |
| `Q-RG-2` | `BR-PRF-01` khai "vượt ngân sách chặn merge" nhưng `size-limit`/`k6` không có trong repo. Wire vào hay hạ luật? | người quyết |
| `Q-RG-3` | Nợ `emoji_ref`: 7 glyph (🐭 ⬆️ ⬇️ ⬅️ ➡️ 💎 🐮) chưa có trong registry emoji. Bổ sung registry hay đổi nội dung? | Nội dung |
