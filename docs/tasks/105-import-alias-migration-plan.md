# Task #105 — Import alias migration (`../` -> alias) cho `mindkid/`

## 1. Bối cảnh & Mục tiêu

`mindkid/` có 1516 parent-relative (`../`) module specifiers trên 699 files. Cụm sâu nhất nằm ở `apps/web/server/api/**` với 152 specifiers leo 4-6 tầng (`../../../../../utils/auth-runtime.js`) trỏ về `apps/web/server/utils/`.

Mục tiêu:
- Thiết lập quy ước alias canonical cho từng cây thư mục:
  - `apps/web/app/**`, `apps/admin/app/**`: `~/...`
  - `apps/web/server/**`: `#server/...` (Nitro only)
  - `packages/*`: Node subpath imports `#src/*`, `#tests/*`, `#scripts/*` qua trường `imports` trong `package.json`
  - Cross-package: bare `@mindkid/*`
  - Test runner vitest: `nuxtAppAliases(appRoot)` prefix alias trong `packages/config/vitest/base.ts`
- Xây dựng công cụ kiểm tra độ tương đương phân giải (`import-graph.ts` / snapshot).
- Thiết lập cổng kiểm soát và sổ nợ `import-path-debt.json` cho `BR-MPA-08`.
- Viết codemod chuyển đổi toàn bộ specifiers và khoá sổ nợ về 0.

## 2. Ranh giới & Baselines

- Cấm sửa `tinimath/` (v1, read-only).
- Cấm tự động chuyển đổi cross-workspace imports khi chưa có subpath export hợp lệ.
- Baselines (Node v24.15.0):
  - Packages + scripts: `tsc -p tsconfig.json` = 0 lỗi.
  - Web app: `vue-tsc -p .nuxt/tsconfig.app.json` = 7 lỗi TS2307 (`unhead`), tổng <= 689.
  - Web server: `vue-tsc -p .nuxt/tsconfig.server.json` = 0 lỗi TS2307, tổng <= 679.
  - Admin app: `vue-tsc -p .nuxt/tsconfig.app.json` = 0 lỗi TS2307, tổng <= 174.
  - Boundaries: `depcruise apps packages` >= 1268 modules / 3765 dependencies.

## 3. Kế hoạch triển khai theo từng Phase

### Phase 0: Contract, Truth Gates, Tooling & Spike
1. Spec first: Cập nhật `BR-MPA-08` trong [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md).
2. Tạo missing gates: scripts `typecheck:web:server` và `typecheck:admin` trong `package.json`, nối vào `pnpm check`.
3. Tool phân giải tương đương: `packages/gates/src/import-graph.ts` và script snapshot.
4. Gate + Debt ledger: `packages/gates/src/lint-import-paths.ts`, test ca âm và `import-path-debt.json`.
5. Codemod: `packages/gates/scripts/rewrite-import-paths.ts`.
6. Spike trên `packages/emoji` (34 specifiers) và kiểm tra Checkpoint A.

### Phase 1: `packages/*` nhỏ
1. T1.1: Nhóm nhỏ (`cache`, `moderation`, `taxonomy`, `adaptive`, `notification`, `queue`, `ui`, `config`).
2. T1.2: `auth` và `gates`.
3. T1.3: `shared` và xử lý cross-package leaks.

### Phase 2: Hai package lớn
1. T2.1: `packages/db` (348) và 2 leaks template-registry.
2. T2.2: `packages/game-engine` (430), cập nhật generators `gen-templates-lib.ts` và `create-template.ts`.

### Phase 3: Apps
1. T3.1: `apps/admin` (27), xoá bỏ `@/` imports.
2. T3.2: `apps/web/app` (3) + `apps/web/tests` (209), cấu hình `nuxtAppAliases`.
3. T3.3: `apps/web/server` (316) chuyển sang `#server/...`.

### Phase 4: Hoàn tất & Docs
1. T4.1: `infra/scripts/tests/make-env.ts`.
2. T4.2: Exemption có lý do cho `packages/gates/tests/deploy.test.ts`.
3. T4.3: Đóng sổ nợ `import-path-debt.json` về rỗng `[]`.
4. T4.4: Cập nhật tài liệu `AGENTS.md`.

## 4. Verification

- `node packages/gates/scripts/import-graph-snapshot.ts --diff`
- `./node_modules/.bin/tsc --noEmit -p tsconfig.json`
- `./node_modules/.bin/depcruise apps packages --config .dependency-cruiser.cjs`
- `pnpm --filter @mindkid/web typecheck:server`
- `pnpm --filter @mindkid/admin typecheck`
- `pnpm lint`
