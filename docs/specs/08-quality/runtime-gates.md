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
| `pnpm check:bundle` | Đo kích thước gzip từng chunk Nuxt client theo `BR-ENG-17` (80 KB) | có |
| `pnpm check:intro-coverage` | Độ phủ bài làm quen khái niệm (`BR-CIG-18`), nợ chỉ giảm | có — thêm level chấm không có bài dạy làm cổng đỏ |

## 2. Cổng trong `<workspace>/tests/gates/`

| Cổng | Luật | Ca âm |
| --- | --- | --- |
| `apps/admin/tests/gates/runtime-boundary.ts` | `BR-ARB-04` | 6 — gồm middleware toàn cục thiếu và URL nội suy |
| `apps/web/tests/gates/mfa-key-custody.ts` | `BR-MFA-13` | 4 — khôi phục 2026-08-30 |
| `apps/web/tests/security/route-validation.ts` | `BR-SEC-04`, `BR-TYP-04` | có |
| `packages/db/tests/gates/engine-content-depth.test.ts` | `BR-ECD-01..13` | có |
| `packages/db/tests/gates/theme-registry.test.ts` | `BR-CTR-*` | có |
| `packages/emoji/tests/gates/catalog-integrity.test.ts` | `BR-EMJ-09/10/11` (tự nhất quán danh mục) | 4 |
| `packages/db/tests/gates/corpus-truth.test.ts` | `BR-LCD-01`, `BR-LCD-10`, `BR-GLR-06` | 2 |
| `packages/db/tests/gates/cli-gates.test.ts` | ba cổng CLI thực sự chạy | 1 |
| `packages/ui/tests/tokens.test.ts` | `BR-DSC-03/06/14` | có |
| `packages/game-engine/tests/gates/render.test.ts` | `BR-ERC-01..05` | có |
| `packages/game-engine/tests/gates/engine-specs.test.ts` | `BR-ESS-01..15` | có |
| `packages/game-engine/tests/gates/templates.test.ts` | `BR-TAK-01..14` | có |
| `packages/game-engine/tests/gates/render-viewport.test.ts` | `BR-ERC-04` | có |
| `packages/game-engine/tests/gates/logic-space.test.ts` | `BR-ENG-14` | có |
| `packages/game-engine/tests/gates/glyph-code-leak.test.ts` | `BR-EMJ-04` | có |
| `packages/game-engine/tests/gates/client-entry-weight.test.ts` | `BR-TAK-08`, `BR-PRF-01` (nhịp 1) | có |

## 2b. Cổng mồ côi — có script, không ai gọi

Đo ngày 2026-09-11. Mười một script `check:*` khai trong `package.json` hoặc trong
`packages/content-build/package.json` mà **không có call site nào** trong
[`scripts/check.sh`](../../../scripts/check.sh) lẫn [`lefthook.yml`](../../../lefthook.yml).
Repo cũng không có thư mục `.github/`, nên không có đường chạy thứ ba.

| Lệnh | Đo gì | Hệ quả đo được của việc không chạy |
|---|---|---|
| `check:taxonomy-docs` | Đối chiếu `docs/taxonomy/c*.md` với `SKILL_IDENTITIES` | Dòng tóm tắt đầu **5/6** file sai: c1 ghi 10 strand 99 skill trong khi thật là 12 và 110; c4 ghi 4 và 16 trong khi thật là 16 và 86. Script chỉ đối chiếu hàng skill, không đọc dòng tóm tắt — nên kể cả khi được gọi nó vẫn bỏ sót chỗ này |
| `check:skill-quota` | `BR-SKQ-01..06/08` — hạn ngạch level theo kỹ năng và khuôn | Chạy được qua unit test trên fixture, không chạy trên corpus thật |
| `check:engine-seed-matrix` | `BR-CSM-03` — ma trận engine × band × tag tư duy | Chỉ chạy trong job `engine-gates` có glob; commit không đụng bốn thư mục thì bỏ qua |
| `check:engine-depth` | `BR-ECD-01..13` — chiều sâu nội dung mỗi engine | như trên |
| `check:go-live` | Sẵn sàng phát hành | mồ côi |
| `check:lesson-supply` | Cung giáo án theo tiết | mồ côi |
| `check:round-sets` | Chuỗi vòng trong màn chơi | mồ côi |
| `check:legacy-v1` | Độ phủ cơ chế v1 | mồ côi |
| `check:engine-allocation` | Phân bổ lĩnh vực tư duy theo engine | mồ côi |
| `check:age-band-fit` | Độ vừa band tuổi | mồ côi |
| `check:skill-progression` | Thứ tự kỹ năng theo tháng tuổi | mồ côi |

Hai điểm mù cấu trúc đi kèm:

1. **Job có glob tự bỏ qua.** `lefthook.yml:105-112` gắn job `engine-gates` vào bốn glob
   (`packages/content/src/**`, `packages/content-build/src/**`, `packages/game-engine/**`,
   `docs/specs/**`). Một commit chỉ đổi `scripts/` hoặc `apps/` bỏ qua trọn bộ cổng engine mà
   không in ra dòng nào.
2. **`pre-push` bị comment toàn bộ.** `lefthook.yml:132-147` từng chạy `pnpm services` và
   `pnpm check`; cả khối nay nằm trong comment. Một khối bị comment trông giống một cổng đang có.

Chủ và hạn: xem `BR-CFO-09`, `BR-CFO-10`, `BR-CFO-11` của
[`config-ownership.md`](../00-foundation/config-ownership.md), và task `#270`.

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

| # | Câu hỏi | Chủ | Trạng thái |
| --- | --- | --- | --- |
| `Q-RG-1` | Bốn khoản "MẤT — thiếu trong §4" có dựng lại không, hay hạ luật xuống "chưa dựng"? | người quyết | mở |
| `Q-RG-2` | `BR-PRF-01` khai "vượt ngân sách chặn merge" nhưng `size-limit`/`k6` không có trong repo. Wire vào hay hạ luật? | người quyết | **Đóng ở #209**: Tách hai nhịp — quét import tĩnh tại `pnpm test` (`client-entry-weight`), đo gzip thật tại `pnpm check:bundle`. |
| `Q-RG-3` | Nợ `emoji_ref`: 7 glyph (🐭 ⬆️ ⬇️ ⬅️ ➡️ 💎 🐮) chưa có trong registry emoji. Bổ sung registry hay đổi nội dung? | Nội dung | mở |
| `Q-RG-4` | Mười một cổng mồ côi ở mục 2b nối hết vào `check.sh` hay chỉ nối những cổng chạy dưới một ngưỡng thời gian? `check:skill-quota` phải dựng trọn 6.388 level nên có thể không hợp vòng lặp cục bộ | người quyết | mở |
| `Q-RG-5` | `pre-push` mở lại với nội dung gì? Bản cũ gọi `pnpm services` vốn cần Postgres và Valkey đang chạy, nên hỏng trên máy chưa dựng dịch vụ | Infra | mở |
| `Q-RG-6` | `check:taxonomy-docs` có mở rộng để đối chiếu cả dòng tóm tắt đầu file không? Hiện nó chỉ đọc hàng skill nên 5/6 dòng tóm tắt sai mà cổng vẫn xanh | Nội dung | mở |
