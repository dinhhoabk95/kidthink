# Task #112 — Todo

- [x] T1 — Gỡ hoàn toàn thư mục `packages/gates` khỏi repo (97 file, 10.713 dòng TypeScript).
- [x] T2 — Giữ lại `scripts/typecheck/` (`typecheck-gate.ts`, `typecheck-delta.ts`, `ratchet.ts`, `typecheck-baseline.json`).
- [x] T3 — Chuyển `findUnvalidatedRoutes` sang `apps/web/tests/security/route-validation.ts` (`BR-SEC-04`).
- [x] T4 — Cập nhật spec files (`READING-GUIDE.md`, `CONVENTIONS.md`, `business-rules.md`, `testing-strategy.md`, `type-safety.md`, `design-system-contract.md`, `game-engine-runtime.md`, `ai-codegen-pipeline.md`, `SPEC.md`, `AGENTS.md`).
- [x] T5 — Cập nhật `pnpm-workspace.yaml`, `package.json` gốc, và cấu hình tsconfig/vitest.
- [x] `pnpm lint` (`biome check .`) — exit 0
- [x] `pnpm lint:deps` (`depcruise apps packages scripts`) — 0 vi phạm / 1536 module
- [x] `pnpm typecheck` — exit 0, cả 10 project bằng hoặc dưới baseline
- [x] `pnpm test` toàn bộ workspace — 329 file / 2793 test passed xanh 100%
- [x] `infra/scripts/tests/run.sh` — 64 passed, 0 failed
