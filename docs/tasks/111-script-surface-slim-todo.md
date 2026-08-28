# Task #111 — Todo

- [x] T1 — Bỏ script `typecheck` ở 18 workspace (15 package + 3 app).
- [x] T2 — `REQUIRED_WORKSPACE_SCRIPTS` còn `["test"]`; comment nói rõ vì sao;
      ca âm trên fixture `bad` vẫn đỏ đúng rule `missing-script`.
- [x] T3 — `package.json` gốc: bỏ `typecheck:root|worker|web|admin` và `format`;
      `lint:deps` nới sang `depcruise apps packages scripts`.
- [x] T4 — Xoá `packages/gates/scripts/rewrite-import-paths.ts`; thêm `progress`,
      `snapshot:imports`, `baseline:type-safety` vào `packages/gates/package.json`.
- [x] T5 — `AGENTS.md` (bảng cổng, đoạn typecheck, đoạn cổng convention),
      `docs/SPEC.md`, [`type-safety.md`](../specs/08-quality/type-safety.md).
- [x] `biome check .` — exit 0
- [x] `depcruise apps packages scripts` — 0 vi phạm / 1607 module
- [x] `@mindkid/gates` test — 280/281; đỏ còn lại là `lint-type-safety`, nợ có sẵn
- [x] `pnpm typecheck` — exit 0, cả 10 project bằng hoặc dưới baseline
      (`admin:app` -4, giảm có sẵn trong cây)
- [x] `vitest run` toàn bộ — 352 file / 3068 test, **giống hệt** lượt chạy trước
      thay đổi; hai đỏ y nguyên là nợ có sẵn (`lint-type-safety`, `thinking-coverage`)
