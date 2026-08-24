# Task #105 — Todo: Import Alias Migration

## Baselines (2026-08-24, Node v24.15.0)

- packages + scripts: `tsc -p tsconfig.json` = 0 lỗi
- web app: `apps/web/node_modules/.bin/vue-tsc --noEmit -p .nuxt/tsconfig.app.json` = 689 lỗi (7 x TS2307 unhead)
- web server: `apps/web/node_modules/.bin/vue-tsc --noEmit -p .nuxt/tsconfig.server.json` = 679 lỗi (0 x TS2307)
- admin app: `apps/admin/node_modules/.bin/vue-tsc --noEmit -p .nuxt/tsconfig.app.json` = 174 lỗi (0 x TS2307)
- package boundaries: `depcruise apps packages` = 1268 modules / 3765 dependencies

## Phase 0: Contract, Truth Gates, Tooling & Spike

- [x] T0.1 — Spec first: Thêm `BR-MPA-08` vào `docs/specs/00-foundation/monorepo-package-architecture.md` và tạo task docs.
- [x] T0.2 — Tạo missing gates: thêm root scripts `typecheck:web:server` và `typecheck:admin`, gắn vào `pnpm check`.
- [x] T0.3 — Tool phân giải tương đương: `packages/gates/src/import-graph.ts` và snapshot script.
- [x] T0.4 — Gate + Debt ledger: `packages/gates/src/lint-import-paths.ts`, test ca âm và `import-path-debt.json`.
- [x] T0.5 — Codemod: `packages/gates/scripts/rewrite-import-paths.ts`.
- [x] T0.6 — Spike trên `packages/emoji` (34 specifiers) và kiểm tra Checkpoint A.

## Phase 1: `packages/*` nhỏ

- [x] T1.1 — Nhóm nhỏ (`cache`, `moderation`, `taxonomy`, `adaptive`, `notification`, `queue`, `ui`, `config`).
- [x] T1.2 — `auth` (20) và `gates` (22).
- [x] T1.3 — `shared` (54) và xử lý cross-package leaks.
- [x] Checkpoint B: `tsc` = 0, `depcruise` count giữ nguyên, import-graph diff rỗng.

## Phase 2: Hai package lớn

- [x] T2.1 — `packages/db` (348) và 2 leaks template-registry.
- [x] T2.2 — `packages/game-engine` (430) + generators `gen-templates-lib.ts`, `create-template.ts`.
- [x] Checkpoint C: `tsc` = 0, ledger giảm ~778.

## Phase 3: Apps

- [x] T3.1 — `apps/admin` (27) và xoá 4 `@/` imports.
- [x] T3.2 — `apps/web/app` (3) + `apps/web/tests` (209) + `nuxtAppAliases` trong vitest.
- [x] T3.3 — `apps/web/server` (316) chuyển sang `#server/...`.
- [x] Checkpoint D: `nuxt build` web và `nuxt generate` admin thành công.

## Phase 4: Hoàn tất & Docs

- [x] T4.1 — `infra/scripts/tests/make-env.ts`.
- [x] T4.2 — Exemption có lý do cho `packages/gates/tests/deploy.test.ts`.
- [x] T4.3 — Đóng sổ nợ `import-path-debt.json` về `[]`.
- [x] T4.4 — Cập nhật bảng gates và alias contract trong `AGENTS.md`.
