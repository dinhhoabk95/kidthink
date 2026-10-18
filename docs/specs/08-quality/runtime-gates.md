---
spec: RUNTIME-GATES
title: Sổ cưỡng chế — luật nào còn cổng, luật nào đã mất
area: quality
status: implemented
mvp: true
phase: P0
reviewed: 2026-10-18
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

Nguồn sự thật cho danh sách cổng là [`scripts/check.sh`](../../../scripts/check.sh) và
[`lefthook.yml`](../../../lefthook.yml). Bảng dưới đối chiếu với hai file đó ngày 2026-10-18;
khi hai bên lệch nhau thì script đúng, sổ này sai và phải sửa.

## 1. Cổng đang chạy trong `pnpm check`

`pnpm check` gọi `bash scripts/check.sh`. Script dừng ở phase đầu tiên đỏ; bên trong một phase,
các job chạy song song.

### Phase 1 — lint và cổng tĩnh (song song)

| Lệnh | Đo gì |
| --- | --- |
| `pnpm lint` | Biome trên toàn repo (`biome check .`) |
| `pnpm lint:deps` | Ranh giới package (dependency-cruiser) |
| `pnpm check:intro-coverage` | Bậc thang độ phủ bài làm quen khái niệm (`BR-CIG-18`) |
| `pnpm check:value-inventory` | Kho giá trị kỹ năng hai chiều (`BR-SVI-01..05`) |
| `pnpm check:error-codes` | Bậc thang mã lỗi (5 phép đo nợ) |
| `pnpm check:api-surface` | Bậc thang mặt API: body guard, same-origin, Zod parse, IP manager, `readBody` thô |
| `pnpm check:logic-space` | Mỗi `LayoutInput` trong thân `computeSlots` phải có `logic:` |
| `pnpm check:render-tokens` | Bậc thang hex thô ở tầng render (`BR-DSC-26`) |
| `pnpm check:numeracy-ladder` | Bậc thang biểu diễn lượng (`BR-NRL-01..10`) |
| `pnpm check:hint-target` | Template phải cài `getHintTargetIndex` thật, không stub |
| `pnpm check:migration-hashes` | Migration đã apply không bị sửa nội dung |
| `pnpm check:engine-specs` | Phiếu engine đủ khuôn, không mồ côi (`BR-ESS-01..15`) |
| `pnpm check:engine-turn` | Kịch bản lượt chơi engine (`BR-ETS-01..12`) |
| `pnpm check:engine-behavior` | Miền hành vi engine (`BR-EBD-01..13`) |
| `pnpm check:engine-behavior-corpus` | Nửa corpus của `BR-EBD-04`: miền phải có level thật để chơi |
| `pnpm check:thinking-structure` | Bậc thang cấu trúc tư duy (`BR-STS-01..11`) |
| `pnpm check:narration-coverage` | Bậc thang độ phủ lời dẫn và âm thanh (`BR-PNR-01..10`) |
| `pnpm check:dataset-integrity` | Toàn vẹn dataset (`BR-SDI-01..08`) |
| `pnpm --filter @mindkid/game-engine check:difficulty-ladder` | Bậc thang độ khó engine (`BR-LDC-*`) |
| `pnpm check:taxonomy-docs` | Đối chiếu `docs/taxonomy/c*.md` với `SKILL_IDENTITIES` |
| `pnpm check:skill-quota` | Hạn ngạch level theo kỹ năng và khuôn (`BR-SKQ-01..06/08`) |
| `pnpm check:engine-depth` | Chiều sâu nội dung mỗi engine (`BR-ECD-01..13`) |
| `pnpm check:engine-seed-matrix` | Ma trận engine × band × tag tư duy (`BR-CSM-03`) |
| `pnpm check:lesson-supply` | Cung giáo án theo tiết |
| `pnpm check:go-live` | Sẵn sàng phát hành (xem [`go-live-readiness.md`](go-live-readiness.md)) |
| `pnpm check:legacy-v1` | Độ phủ 60 dạng game nguồn (xem [`source-game-type-coverage.md`](source-game-type-coverage.md)) |
| `pnpm check:skill-progression` | Thứ tự kỹ năng theo tháng tuổi (`BR-SAP-01..07`) |
| `pnpm check:config-ownership` | Sở hữu cấu hình (`BR-CFO-01..12`) |
| `pnpm check:seed-gates` | Thẩm định hạt nhân seed gates |
| `pnpm check:roadmap-balance` | Lộ trình học-trước (`BR-CRM-*`, `BR-LTC-*`) |
| `pnpm check:content-demand` | Sổ cầu nội dung |
| `pnpm check:seed-master` | Quét seed master |
| `pnpm check:lesson-topics` | Chủ đề bài học |

### Phase 2 — typecheck

| Lệnh | Đo gì |
| --- | --- |
| `pnpm typecheck` | `tsc` + `vue-tsc` trên 10 project, bậc thang nợ (`scripts/typecheck/typecheck-gate.ts`) |

### Phase 3 — test

| Chế độ | Lệnh | Đo gì |
| --- | --- | --- |
| Đầy đủ (`pnpm check`) | `pnpm services` rồi `pnpm check:test-ratchet` | Toàn bộ vitest không `--bail`, bậc thang file đỏ và sàn `minTotalSuites`. `pnpm services` đỏ thì cả lệnh đỏ, không hạ xuống tập con |
| Nhanh (`pnpm check:fast`) | `vitest run --project=@mindkid/game-engine` | **Chỉ** project `@mindkid/game-engine`, không cần DB. Script in rõ đây là tập con |

### Sau phase 3 — có điều kiện

| Lệnh | Điều kiện | Đo gì |
| --- | --- | --- |
| `pnpm check:bundle` | Chỉ khi đã có `apps/web/.output` | Kích thước gzip từng chunk Nuxt client (`BR-ENG-17`, 80 KB). Không có build thì bước này bị bỏ qua mà không in gì |

### Không nằm trong `pnpm check`

| Lệnh | Chạy ở đâu |
| --- | --- |
| `pnpm test:deploy` | Chạy tay khi phát hành (`infra/scripts/tests/run.sh`). `BR-CFO-11` cấm dựng lại nó trong `check.sh` dưới dạng khối comment |

## 2. Cổng trong `<workspace>/tests/gates/`

Các cổng này chạy trong phase 3 qua `pnpm check:test-ratchet`. Bảng chỉ ghi cổng trỏ tới luật
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
| `packages/content-build/tests/gates/cli-gates.test.ts` | ba cổng CLI (`engine-depth`, `go-live`, `lesson-supply`) chạy được và trả lời | 1 |
| `packages/ui/tests/tokens.test.ts` | `BR-DSC-03/06/14` | có |
| `packages/game-engine/tests/gates/render.test.ts` | `BR-ERC-01..05` | có |
| `packages/game-engine/tests/gates/engine-specs.test.ts` | `BR-ESS-01..15` | có |
| `packages/game-engine/tests/gates/templates.test.ts` | `BR-TAK-01..14` | có |
| `packages/game-engine/tests/gates/render-viewport.test.ts` | `BR-ERC-04` | có |
| `packages/game-engine/tests/gates/logic-space.test.ts` | `BR-ENG-14` | có |
| `packages/game-engine/tests/gates/glyph-code-leak.test.ts` | `BR-EMJ-04` | có |
| `packages/game-engine/tests/gates/client-entry-weight.test.ts` | `BR-TAK-08`, `BR-PRF-01` (nhịp 1) | có |

## 2b. Cổng chạy ngoài `pnpm check` và điểm mù

Repo không có thư mục `.github/`, nên `check.sh` và `lefthook.yml` là hai đường chạy duy nhất.

| Lệnh | Chạy ở đâu | Điểm mù |
| --- | --- | --- |
| `check:render` (`packages/game-engine/scripts/check-render.ts`) | Chỉ job `engine-gates` của `pre-commit`, gọi thẳng qua `tsx` | Không có trong `check.sh`; commit không khớp glob hoặc `--no-verify` thì không chạy |
| `check:hardcoded-params` (`packages/game-engine/scripts/check-hardcoded-params.ts`) | như trên | như trên |

Ba điểm mù cấu trúc:

1. **Job có glob tự bỏ qua** (`BR-CFO-10`). Job `engine-gates` của `pre-commit` trong
   `lefthook.yml` gắn glob sáu cây (`docs/specs/01-platform/engines/**`, `docs/specs/05-content/**`,
   `packages/game-engine/src/**`, `packages/game-engine/config/**`, `packages/content/src/**`,
   `packages/content-build/src/**`). Commit chỉ đổi `scripts/` hoặc `apps/` bỏ qua trọn job mà
   không in dòng nào.
2. **`pre-push` chỉ chạy tập con.** Khối `pre-push` chạy `pnpm check:fast`: đủ phase 1 và 2,
   nhưng phase 3 chỉ chạy `@mindkid/game-engine`. Test cần DB và bậc thang `check:test-ratchet`
   không chạy trước khi push.
3. **`check:bundle` có điều kiện.** Không có `apps/web/.output` thì bước này bị bỏ qua im lặng.

Chủ và hạn: `BR-CFO-09`, `BR-CFO-10`, `BR-CFO-11` của
[`config-ownership.md`](../00-foundation/config-ownership.md).

## 3. Luật đã MẤT cưỡng chế

`packages/gates` bị xoá 2026-08-29 (97 file, 253 test, 114 rule). Danh sách §4
của [`112-gates-package-removal-plan.md`](../../tasks/112-gates-package-removal-plan.md)
bỏ sót ít nhất tám khoản; bảng dưới là bản đủ.

| Linter đã xoá | Luật | Trạng thái |
| --- | --- | --- |
| `lint-route-validation.ts` | `BR-SEC-04` `BR-TYP-04` | **Còn** ở `apps/web/tests/security/`. Chỉ phủ body; query/param chưa đo |
| `lint-runtime-boundary.ts` | `BR-ARB-01..07` `BR-ADA-01` `BR-TYP-07` | **Một phần**: chỉ `BR-ARB-04` và chỉ trong `apps/admin` |
| `lint-tokens.ts` | `BR-DSC-01/02/03/05/06/13/14` `BR-A11-09` | **Một phần**: `packages/ui/tests/tokens.test.ts` đối chiếu giá trị token; `check:render-tokens` (`BR-DSC-26`) và `check:config-ownership` (`BR-DSC-24`) bù phần hex thô và sở hữu cấu hình. Quét class `uppercase` (`BR-A11-09`) chưa có |
| `lint-mfa-key.ts` | `BR-MFA-13` | **Đã khôi phục** 2026-08-30 |
| `lint-perf-budget.ts` | `BR-PRF-01/02/08` | **Một phần**: `client-entry-weight` (nhịp 1) và `check:bundle` (80 KB/chunk) đo `BR-PRF-01` cho chunk template. App shell, trang public, payload level, `BR-PRF-02/08` chưa đo |
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
| `Q-RG-2` | `BR-PRF-01` khai "vượt ngân sách chặn merge" nhưng `size-limit`/`k6` không có trong repo. Wire vào hay hạ luật? | người quyết | **Đóng ở #209**: tách hai nhịp — quét import tĩnh tại `pnpm test` (`client-entry-weight`), đo gzip thật tại `pnpm check:bundle`. Phần ngân sách chưa đo theo dõi ở [Task #310](../../tasks/310-quality-gates-gaps-plan.md) |
| `Q-RG-3` | Nợ `emoji_ref`: 7 glyph (🐭 ⬆️ ⬇️ ⬅️ ➡️ 💎 🐮) chưa có trong registry emoji. Bổ sung registry hay đổi nội dung? | Nội dung | mở |
| `Q-RG-4` | Các cổng `check:*` mồ côi nối hết vào `check.sh` hay chỉ nối cổng chạy dưới một ngưỡng thời gian? | người quyết | **Đóng**: tám cổng còn tồn tại đã vào phase 1 của `check.sh`; ba script `check:round-sets`, `check:engine-allocation`, `check:age-band-fit` không còn trong `package.json` |
| `Q-RG-5` | `pre-push` mở lại với nội dung gì? | Infra | **Đóng**: `pre-push` chạy `pnpm check:fast`, không cần Postgres và Valkey. Giá phải trả ghi ở §2b mục 2 |
| `Q-RG-6` | `check:taxonomy-docs` có mở rộng để đối chiếu cả dòng tóm tắt đầu file không? Hiện nó chỉ đọc hàng skill nên dòng tóm tắt sai mà cổng vẫn xanh | Nội dung | mở |
| `Q-RG-7` | `check:render` và `check:hardcoded-params` có vào `check.sh` không, để `--no-verify` không bỏ qua được? | người quyết | mở |
