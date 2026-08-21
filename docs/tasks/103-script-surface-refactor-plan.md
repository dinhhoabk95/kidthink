# Task #103 — Thu gọn bề mặt script: cổng thành test vitest

## 1. Vì sao

`package.json` gốc đăng ký **47 script**, trong đó 30 script là `lint:*` gọi 30 file
CLI riêng trong `scripts/` (10.663 dòng). Ba sự thật đo được ngày 2026-08-23:

1. **Spec chưa bao giờ yêu cầu bề mặt đó.** [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7 định nghĩa
   `pnpm check` = `lint · lint:tokens · lint:deps · typecheck`;
   [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) §7 ghi `pnpm check → lint + tokens + typecheck`.
   28 script `lint:*` còn lại là tích tụ, không có spec nào sở hữu danh sách đó.
2. **Test của cổng phần lớn không quét repo thật.** 29 file trong `scripts/tests/`
   đa số chỉ đưa chuỗi fixture vào hàm lint rồi assert. Nghĩa là `pnpm test`
   **không** cưỡng chế các BR đó — chỉ CLI trong `pnpm check` cưỡng chế.
3. **Có cổng xanh giả và cổng chết.** `perf:budget` luôn `process.exit(0)`;
   `lint-prices.ts` không được đăng ký ở đâu dù task doc bảo chạy `pnpm --filter @mindkid/gates test`;
   `check:coverage` trùng `lint:thinking-coverage`; `gen:check` trùng `check:progress`.

Hướng đi: **rule giữ nguyên, vỏ CLI biến mất**. Mỗi cổng thành một test vitest
nằm trong workspace sở hữu đường dẫn nó quét, và mỗi test phải có **cả hai**:
quét repo thật assert 0 vi phạm **và** ca âm (`BR-TYP-07`).

## 2. Không nới rule

Refactor này Cấm — NEVER bỏ một `BR-*` nào. Danh sách BR trước/sau phải trùng khít.
Cổng nào đang đỏ thì test tương ứng cũng đỏ y như vậy — không dùng `skip`,
không nới ngưỡng để `pnpm test` xanh.

## 3. Baseline đo trước khi sửa (2026-08-23)

Chạy từng cổng riêng lẻ, không qua `&&`:

| Cổng | Exit | Ghi chú |
|---|---|---|
| `lint` (biome) | **1** | 141 error, 1 warning — đỏ từ trước |
| `lint:thinking-coverage` = `check:coverage` | **1** | `BR-TCM-01` theme_tag ngoài từ vựng + `BR-TCM-06` sàn phase |
| `typecheck:web` | **1** | 603 lỗi từ trước, là cổng delta |
| 28 cổng còn lại | 0 | xanh |

Tổng thời gian mọi cổng ≈ 2 phút (nặng nhất `typecheck` 53s, `typecheck:web` 23s).

## 4. Bề mặt script đích (20 script, từ 47)

```
prepare
dev · dev:admin · dev:worker · dev:all
build
lint · lint:fix · format · lint:deps
typecheck · typecheck:web
test · test:watch · test:coverage
check            = lint && lint:deps && typecheck && test
db:generate · db:migrate · db:seed · db:seed:check
services         (probe PG 17 + Valkey 9, lefthook pre-push cần)
deploy           (một entry, subcommand truyền qua: release|init|provision|rollback|status|logs|env)
```

Script của workspace con (`pnpm --filter` gọi tới) không tính vào bề mặt gốc:
`@mindkid/game-engine` giữ `gen:templates` + `new:template`;
`@mindkid/worker` giữ `restore`.

## 5. Cổng về đâu

Nguyên tắc: cổng quét đường dẫn của **đúng một** workspace thì về workspace đó;
cổng quét chéo repo hoặc `docs/` thì về package mới `@mindkid/gates`.

| Về `apps/web/tests/gates/` | Cổng |
|---|---|
| BR-NOT-03/07/08 | `lint-email-content` |
| BR-TLM-01 | `lint-analytics-queries` |
| BR-CDC-*, BR-USM-*, BR-CPA-*, BR-PAY-08 | `check-child-data-compliance-gates` |
| BR-SEO2-08, BR-LND-04 | `lint-public-scripts` (thêm ca âm — hiện chưa có) |

| Về `packages/db/tests/gates/` | Cổng |
|---|---|
| BR-TLM-03 | `lint-telemetry-pii` |
| BR-RBK-02/03 | `lint-migration-expand` |
| BR-MGL-01/02 | `lint-montessori-corpus` |
| BR-LTV-01..08 | `lint-lesson-variety` (đường seed corpus, không `--from-db`) |
| BR-TCM-01..11 | `lint-thinking-coverage` (đường seed corpus) |
| BR-EVT-01/02/07 | `lint-event-catalog` |
| BR-LEX-07/08 | `lint-lesson-exemplar-matrix` (cần PG thật — hợp `BR-TST-02`) |

| Về workspace khác | Cổng |
|---|---|
| `packages/game-engine/tests/gates/` | `lint-templates` (BR-TAK-01/03/07/09/12) + ca âm mới |
| `packages/shared/tests/gates/` | `lint-form-gates` (đã có test thật), `lint-legal-review` (BR-LGL-07, thêm ca âm) |
| `packages/config/tests/` | drift `.env.example` (BR-ENV-09) |

| Về `packages/gates` (quét chéo repo / `docs/`) | Cổng |
|---|---|
| C1–C18 corpus spec | `lint-specs` + `lint-specs-lib` + `style-guide` |
| BR-REG2-01/02/04 | `lint-rule-ids` |
| BR-DSC-*, BR-A11-09 | `lint-tokens` |
| BR-TYP-02/05/08 | `lint-type-safety` + `type-safety-baseline.json` |
| BR-SEC-04, BR-TYP-04 | `lint-route-validation` + `route-validation-debt.json` |
| BR-HPL-05, BR-PGT-05, BR-SCO-02, BR-FBK-*, BR-PEN-*, BR-NIB-05, BR-BPS-03 | `lint-kid-surface` |
| BR-GAT-01 | `lint-gating` |
| BR-GLOS-04 | `lint-user-vocabulary` |
| BR-EMJ-03 | `lint-emoji-affordance` |
| BR-ENV-02/03 | `lint-env-names` |
| BR-PKG-02 | `lint-prices` (hiện là cổng chết — nối lại vào `pnpm test`) |
| BR-APM/RBL/ASC/PWA/OCP/OFF | `check-web-scale-gate` |
| BR-PRF-01/02/08 | `lint-perf-budget` — giữ hàm + test, xoá CLI xanh giả |
| — | `lint-shell-scripts` (cần binary `shellcheck`) |

## 6. Công cụ vận hành: vẫn là CLI, nhưng không đăng ký ở gốc

Không phải cổng, không biến thành test được:

| File | Về đâu | Vì sao không thành test |
|---|---|---|
| `deploy/cli.ts`, `deploy/remote-exec.ts` | ở nguyên `scripts/deploy/` | ssh vào host, đổi trạng thái server |
| `check-services.ts` | ở nguyên `scripts/` | mở kết nối PG + Valkey thật |
| `validate-env-file.ts` | `packages/config/scripts/` | chạy trên server **trước** `pnpm install`, phải không dependency |
| `generate-env-example.ts` | `packages/config/scripts/` | ghi file `.env.example` (chế độ `--check` thành test) |
| `gen-templates.ts`, `create-template.ts` | `packages/game-engine/scripts/` | sinh file nguồn |
| `replay-adaptive.ts` | `packages/db/scripts/` | đọc PG thật. Cấm — NEVER đặt ở `packages/adaptive` — `packages/db` đã phụ thuộc `adaptive`, đặt ngược lại tạo chu trình (`no-circular`) |
| `report-tag-vocabulary.ts` | `packages/db/scripts/` | báo cáo, cố ý không fail |
| `check-progress.ts` + lib | `packages/gates/scripts/` | phát hiện dựa trên diff git đang chờ, không có trạng thái repo cố định để assert |

Xoá hẳn: `inventory-symbols.ts` (không script nào gọi, không test nào phủ) và
`scripts/vitest.config.ts` (project `scripts` biến mất).

`scripts/` gốc **không** biến mất — nó còn đúng hai thứ vận hành: `deploy/` và
`check-services.ts`. Giữ chúng ở đó để cây tooling vẫn nằm trong `include` của
`tsconfig.json` gốc và trong tầm quét của cổng `lint:shell` + `lint:type-safety`.

## 7. Config dùng chung cho nhiều app

`@mindkid/config` là nơi duy nhất giữ config chung:

- `packages/config/vitest/base.ts` — `defineWorkspaceTest()` + `workspaceAliases()`.
  Trước đó 15 file `vitest.config.ts` tự viết lại cùng bảng alias `@mindkid/*` bằng
  đường dẫn tương đối khác nhau. Bảng alias giờ **quét** `packages/*` nên package
  mới được phủ ngay, không phải sửa N chỗ.
- `packages/config/tsconfig.base.json` — đã có, 7 package extend.
- `biome.jsonc` gốc — đã là config đơn, không nhân bản theo app.

## 8. Cách nghiệm thu

1. Mỗi cổng chuyển xong: chạy test mới, so **cùng kết luận** với exit code baseline
   ở §3. Cổng baseline xanh → test xanh; `thinking-coverage` baseline đỏ → test đỏ
   với đúng vi phạm đó.
2. `pnpm test` mỗi workspace: chụp `số file | số test` trước và sau khi chuyển,
   phần đã có phải trùng khít, phần tăng đúng bằng số test cổng mới thêm.
3. `pnpm lint:deps` xanh — `packages/gates` Cấm — NEVER import `apps/*` (nó chỉ **đọc file**).
4. Root `tsconfig.json` `include` bỏ `scripts/**`, thêm `packages/*/scripts/**` +
   `infra/scripts/**/*.ts` để cây tooling vẫn được typecheck.
5. Spec nào ghi lệnh `pnpm lint:*` cũ phải sửa trong **cùng PR** (10 file trong
   `docs/specs/`, nặng nhất [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) 22 chỗ,
   [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) 20 chỗ), cộng [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §292 trỏ vào
   `packages/gates/src/lint-specs-lib.ts:297`.

## 9. Đã làm được gì (2026-08-23)

| Đo | Trước | Sau |
|---|---|---|
| Script ở `package.json` gốc | 47 | 24 |
| Script `lint:*` gọi CLI riêng | 30 | 0 (còn `lint:deps` là depcruise) |
| File `.ts` trong `scripts/` gốc | 51 | 3 (`deploy/cli.ts`, `deploy/remote-exec.ts`, `check-services.ts`) |
| `pnpm lint` (biome) | 141 lỗi | 0 lỗi |
| `pnpm typecheck` | xanh | xanh |
| `pnpm lint:deps` | xanh | xanh (1272 module) |
| `pnpm typecheck:web` (cổng delta) | 685 lỗi | 685 lỗi |
| `pnpm test:deploy` | 43 ca | 43 ca |
| File `vitest.config.ts` tự khai alias | 15 | 0 — tất cả qua `@mindkid/config/vitest` |

Cổng nào cũng giữ nguyên kết luận so với baseline §3, trừ hai chỗ **được siết chặt hơn**:

- `BR-LGL-07` trước đây xanh giả — test truyền mảng `LEGAL_DOCUMENTS` vào tham số
  `fileContent: string`, regex quét `"[object Object]"` nên không bao giờ khớp. Nay
  đọc file thật và có ca âm.
- `BR-PKG-02` (`lint:prices`) chưa từng chạy trong cổng nào — không có script nào
  đăng ký nó. Nay nằm trong `pnpm test`.

Thêm assert "thật sự đọc được nguồn" (đếm > 0) cho các cổng quét corpus: một cổng đọc
0 tệp mà báo xanh là dạng xanh giả khó thấy nhất.

### 9.1 Suite gộp: đo trước/sau bằng worktree

`pnpm test` ở gốc chạy trên ba cây:

| Cây | File test | Test | Đỏ |
|---|---|---|---|
| HEAD (worktree sạch, trước refactor) | 311 | 2645 | 2 — đều là hụt file untracked của worktree |
| HEAD + **một** thay đổi chưa commit của người khác (`require-env.ts` gọi `process.loadEnvFile()`) | 311 | 2645 | 75 / 29 file |
| Cây hiện tại (sau refactor, cùng thay đổi đó) | 330 | 2833 | 74 / 28 file |

So danh sách **file đỏ** giữa hai cây cuối:

- 27 file đỏ ở **cả hai** → do môi trường, không do refactor.
- Chỉ đỏ ở cây HEAD-vá: `db/tests/global-setup.test.ts`, `shared/tests/quality-rules.test.ts`
  — hai ca hụt file untracked của worktree.
- Chỉ đỏ ở cây hiện tại: `db/tests/gates/thinking-coverage.test.ts` — chính là cổng
  `lint:thinking-coverage` vốn **đã đỏ** ở baseline §3 (exit 1, 8 vi phạm `BR-TCM-01`).
  Nó không mới; nó chỉ chuyển từ `pnpm check` sang `pnpm test`.

Refactor không thêm một test đỏ nào.

Cột thứ ba là điểm mấu chốt: `process.loadEnvFile()` nạp `.env` khi cwd là gốc repo,
nên test tích hợp đâm vào Valkey/PostgreSQL/BullMQ thật rồi timeout 30s. Chạy
`pnpm --filter <pkg> test` (cwd là thư mục package, không thấy `.env`) thì cùng file đó
xanh. Refactor này không đụng `require-env.ts`.
