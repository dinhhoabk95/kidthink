# Task #110 — Todo

## T1 — Bộ nạp env phân lớp

- [x] `packages/config/src/require-env.ts`: nạp **mọi** `.env` từ `cwd` lên gốc, bỏ `break` và
      biến `loaded`. Giữ `try/catch` (đúng cho máy chủ nơi env được tiêm sẵn).
- [x] Bình luận nói rõ vì sao thứ tự đúng: `loadEnvFile` Cấm — NEVER ghi đè tên đã có giá trị.
- [x] Ca âm `packages/config/tests/require-env.test.ts`: cây thư mục tạm hai cấp, tiến trình con
      chạy bằng `tsx` với `cwd` là cấp trong.
  - [x] Nạp cả `.env` gốc lẫn `.env` của app.
  - [x] File gần `cwd` nhất thắng.
  - [x] Biến sẵn trong môi trường thắng cả hai file.
  - [x] Không có `.env` nào trên đường đi thì không nổ.

## T2 — Sinh `.env.example` theo app

- [x] `generateEnvExample(app?: AppType)` lọc `def.apps.includes(app)`; không truyền `app` thì
      giữ nguyên xi hành vi cũ.
- [x] Ghi bốn file: gốc, `apps/web`, `apps/admin`, `apps/worker`.
- [x] Tiêu đề bản app nói rõ nó là mẫu của `/etc/mindkid/env/<app>.env` và máy trạm không cần nó.
- [x] `env-example.test.ts` lặp qua bốn đường dẫn, giữ assertion byte-exact.
- [x] Ca âm `BR-ENV-04`: bản của mỗi app chỉ chứa biến app đó đọc.
- [x] Chứng minh bản gốc không đổi một byte: dựng lại bằng bộ sinh cũ và so bằng.

## T3 — Dọn `.env` máy trạm

- [x] Bỏ `WEB_JWT_SECRET`, `ADMIN_JWT_SECRET`.
- [x] Thêm bảy tên còn thiếu từ `.env.example`; `NUXT_PUBLIC_API_BASE_URL` thừa hưởng giá trị
      thật từ `apps/admin/.env` trước khi xoá file đó.
- [x] Xoá `apps/web/.env`, `apps/admin/.env`.
- [x] `validate-env-file` xanh cho cả ba app, không cảnh báo tên lạ.

## T4 — Spec và cổng thật

- [x] [`env-contract.md`](../specs/01-platform/env-contract.md) §3: thêm dòng `apps/<app>/.env` (tuỳ chọn) và `apps/<app>/.env.example`,
      kèm đoạn giải thích thứ tự nạp.
- [x] [`env-contract.md`](../specs/01-platform/env-contract.md) §7.3: nói mẫu của ba file runtime là `apps/<app>/.env.example`.
- [x] Cấm — NEVER thêm rule mới, Cấm — NEVER nới rule nào. Bảng `BR-ENV-*` giữ nguyên.
- [x] `biome check .` — exit 0 (gọi thẳng binary: hook rtk đổi `pnpm lint` thành eslint)
- [x] `depcruise apps packages` — 0 vi phạm trên 1606 module
- [x] `@mindkid/config` test — 34/34
- [x] `@mindkid/gates` test — 280/281; đỏ còn lại là `lint-type-safety` trên
      `apps/web/server/utils/request-body.ts` và `packages/shared/src/activity-model.ts`, nợ có sẵn
- [x] `vitest run` toàn bộ — 3066/3068; hai đỏ đều là nợ có sẵn (`lint-type-safety`,
      `@mindkid/db` `thinking-coverage`), không file nào của task này
- [x] `infra/scripts/tests/run.sh` — 64 passed, 0 failed (case 2, 17, 18 là ca env)
- [x] Probe với cwd `apps/web`: `DATABASE_URL`, `SITE_URL`, `PARENT_GATE_SECRET`,
      `NUXT_SESSION_PASSWORD`, `NUXT_ALLOWED_ORIGINS` đều giải được — trước thay đổi thì
      `DATABASE_URL` ném `MissingEnvError`
