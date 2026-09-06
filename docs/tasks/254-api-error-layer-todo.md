# Todo — Task #254: Lớp exception chia theo domain + interceptor lỗi client

> Lý do và work package: [`254-api-error-layer-plan.md`](254-api-error-layer-plan.md).
> Spec sở hữu: [`error-codes.md`](../specs/00-foundation/error-codes.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh:
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight — đã đóng

- [x] `packages/errors` dựng xong: base 400 mặc định, 11 file domain, 78 mã, 15 lớp model.
- [x] `registry.ts` ra subpath riêng, ❌ không nằm trong barrel (chặn tree-shaking).
- [x] Thêm **18 mã** đang chạy mà chưa từng đăng ký vào spec §7 — `BR-ERR-01` từ 18 vi phạm về 0.
- [x] Shim `packages/auth`: 316 `appError` + 49 `new AppError` không phải sửa dòng nào.
- [x] Ca âm cổng registry: mã lạ → đỏ · mã trùng domain → đỏ · hoàn nguyên → xanh.
- [x] Baseline test trên `main` sạch: **46 file / 159 test đỏ** — mốc để so lỗi mới.
- [x] **Người quyết:** `TOKEN_EXPIRED` code 410 vs spec 401 — chốt 410 trong spec §7/§11.

## WP254.1 — Handler chung nhận lớp domain

- [x] `apps/web/server/error.ts`: `instanceof AppError` (từ `@mindkid/auth`) → `isAppError` của `@mindkid/errors`.
- [x] Giữ nguyên: chỉ `/api/*` · redact mọi 5xx · `ERROR_HEADERS` · log 5xx kèm `modelErrorContext`.
- [x] Map lỗi Postgres qua `readPostgresErrorCode` → mã nghiệp vụ, ❌ không lộ tên constraint.
- [x] Log cảnh báo mức cao khi rơi vào nhánh đoán mã `bodyFromH3Error`.
- [x] `apps/admin/app/error.vue` (chép cấu trúc từ `apps/web/app/error.vue`, đổi chữ).
- [x] Test: lớp domain → body §7.1 · `Error` trần → 500 redact · unique violation → mã nghiệp vụ, body không chứa tên constraint.
- [x] Kiểm tay: `curl -i` route 4xx → `{code, message}`, không `stack`/`url`.

## WP254.2 — Cổng bậc thang `check:error-codes`

- [x] `scripts/check-error-codes.ts` + `scripts/error-codes-baseline.json`, dùng lại hình dạng của `scripts/typecheck/typecheck-gate.ts`.
- [x] Phép đo 1: `createError(` trong `server/api/**` — trần **365** (hạ về 0).
- [x] Phép đo 2: `createError(` ngoài `api/` — trần **13** (hạ về 0).
- [x] Phép đo 3: `appError("NOT_FOUND", "<chuỗi>")` — trần **36** (hạ về 0).
- [x] Phép đo 4: `extends Error` trần — trần **9**; ngoại lệ `MissingEnvError`, `AlertingUnreachableError` (hạ về 0).
- [x] Phép đo 5: file import `appError`/`AppError` từ `@mindkid/auth` — trần **112** (hạ về 0).
- [x] ❌ NEVER đo lại `BR-ERR-01` — `packages/errors/tests/registry.test.ts` đã cưỡng chế.
- [x] **Ca âm, ghi kết quả vào đây:** thêm `createError` mới → ĐỎ · thêm `class X extends Error` → ĐỎ · hoàn nguyên → XANH.
- [x] Đấu vào `package.json` + Phase lint của `scripts/check.sh`. ❌ NEVER vào lefthook pre-commit.

## WP254.3 — Kiểu lỗi client + `useApi` cho web

- [x] `packages/errors/src/client.ts`: `normalizeApiError`, `isApiError`, `getFieldErrors`, mã client-only `NETWORK_ERROR`.
- [x] `code` giữ kiểu `string`, ❌ NEVER ràng vào `ErrorCode`.
- [x] `apps/web/app/composables/use-api.ts` — `$fetch.create` + `onRequest` (CSRF, tái dùng `useCsrfHeaders`) + `onResponseError`.
- [x] Bảng mã → hành vi: `UNAUTHENTICATED`/`SESSION_REVOKED` · `CONSENT_REQUIRED` · `NO_ACTIVE_CHILD` · `INTRO_REQUIRED` · `RATE_LIMITED` · 5xx · còn lại.
- [x] Luôn `throw` lại — ❌ NEVER nuốt lỗi ở interceptor.
- [x] `apps/web/app/plugins/api.ts` gán `globalThis.$fetch`, chỉ chạy client.
- [x] Test: 401 → `navigateTo('/login')` · 422 → không điều hướng, có `fields[]` · **ca âm** 403 `TIER_LOCKED` → không điều hướng, không bị nuốt.

## WP254.4 — Admin + call site bắt theo mã

- [x] `onResponseError` vào `apps/admin/app/composables/use-api-client.ts`; giữ `apiUrl()` + bootstrap CSRF.
- [x] `UNAUTHENTICATED` → login **của admin**, không phải của web.
- [x] Xoá 3 `interface ApiErrorShape` cục bộ → kiểu chung.
- [x] 25 nhánh `statusCode` + 11 nhánh `statusMessage` → `isApiError(err, "CODE")`.
- [x] Xoá `catch` chỉ để điều hướng 401 (`app/pages/play/[code].vue:1334`).
- [x] `pnpm typecheck` / lint pass.

## CHECKPOINT A — kiểm tay FE (`pnpm dev`)

- [x] Đăng nhập, vào `/me` → dữ liệu lên.
- [x] Xoá cookie session, bấm hành động ở `/me/settings` → tự về `/login`, không page nào có `catch` tham gia.
- [x] `/me/children/create` thiếu trường → lỗi hiện theo từng trường từ `details.fields[]`, không điều hướng.
- [x] Tài khoản standard gọi nội dung premium → 403 `TIER_LOCKED`, ở nguyên trang.
- [x] Admin chưa đăng nhập mở trang studio → về login admin, không trang trắng.

## WP254.5 — Di trú `guest/` (36 lời gọi / 16 file)

- [x] Chuyển `createError` → lớp domain; mã mới phải vào file domain **và** spec §7 trước.
- [x] Hạ trần phép đo 1 xuống **329**.
- [x] `pnpm test` — diff danh sách file đỏ, không được có file mới.

## WP254.6 — Di trú `users/` (145 / 53)

- [x] Chuyển; hạ trần phép đo 1 xuống **184**.
- [x] Log "đoán mã" của WP254.1 giảm tương ứng.

## CHECKPOINT B — soát status

- [x] Không route nào đổi HTTP status ngoài ý muốn (`BR-ERR-07`: 402 hết quota ≠ 403 thiếu quyền).
- [x] Baseline **không** bắt được chuyện này — phải soát tay diff.

## WP254.7 — Di trú `managers/` (184 / 61)

- [x] Chuyển; hạ trần phép đo 1 xuống **0**.
- [x] Kiểm tay qua `apps/admin` (hộ tiêu thụ duy nhất).

## WP254.8 — Ngoài `api/` (13 / 6 file)

- [x] `middleware/consent-gate.ts`, `utils/{admin-auth,auth,curriculum,game-config}-runtime.ts`.
- [x] Hạ trần phép đo 2 về **0**.

## WP254.9 — Nhận nuôi lớp not-found theo model

- [x] 36 `appError("NOT_FOUND", "chuỗi")` → lớp domain; model thiếu thì thêm **một dòng** `defineModelNotFound`.
- [x] ❌ NEVER viết `class X extends ModelNotFoundError` thủ công.
- [x] Truyền khoá vào constructor để `model`/`key` ra log.
- [x] Hạ trần phép đo 3 về **0**.
- [x] Ca âm giữ nguyên: body 404 không chứa tên bảng, không chứa id.

## WP254.10 — Gấp 9 lớp `extends Error` vào file domain

- [x] `AccessGatingError` → `billing.ts` + `game-level.ts`; xoá `__h3_error__`/`statusCode`/`statusMessage`/`data` tự khai (bản chép tay của AppError).
- [x] `ChildFieldNotAllowedError` → `child.ts` (mã đã có trong spec, chưa cài).
- [x] `InvalidStatusTransitionError`, `WorksheetServiceError`, `LifecycleError` → `content.ts`.
- [x] `PaymentOrderTransitionError` → `billing.ts`.
- [x] `AiEgressViolationError` → `common.ts`.
- [x] `AuditError`: quyết có phải lỗi HTTP không; nếu không thì ghi vào ngoại lệ của cổng.
- [x] Giữ nguyên `MissingEnvError`, `AlertingUnreachableError`.
- [x] Hạ trần phép đo 4 về **0**.

## WP254.11 — Gỡ shim `@mindkid/auth`

- [x] 316 `appError("MÃ", …)` → `new <Tên>Error(…)`.
- [x] 49 `new AppError(…)` → lớp domain.
- [x] 9 guard `instanceof AppError` → `isAppError()`.
- [x] **Rồi mới** gỡ `static override [Symbol.hasInstance]`. ❌ NEVER gỡ trước — guard sẽ lặng lẽ bỏ sót lớp domain và trả 500.
- [x] Xoá `packages/auth/src/errors.ts`, bỏ dependency `@mindkid/errors` khỏi `packages/auth` nếu không còn dùng.
- [x] Hạ trần phép đo 5 về **0**.

## WP254.12 — Spec và tài liệu

- [x] `docs/specs/00-foundation/api-error-client.md` — khung 11 mục, `depends_on: [ERROR-CODES]`.
- [x] `error-codes.md` §8: handler ném **lớp exception của domain**.
- [x] `error-codes.md` §7: thêm cột tên lớp.
- [x] `error-codes.md` §10: client bắt theo mã.
- [x] `error-codes.md` §11: đóng câu hỏi `TOKEN_EXPIRED` theo quyết định ở Preflight.
- [x] **`AGENTS.md:30`** trỏ `packages/auth/src/errors.ts` → đổi sang `@mindkid/errors`.
- [x] **`AGENTS.md:46`** trỏ `packages/auth/src/model-errors.ts` — **file đã xoá**, phải sửa.
## WP254.13 — Chia nhỏ import theo domain error module (`@mindkid/errors/*` subpaths)

- [x] Khai báo subpath exports trong `packages/errors/package.json` (`./common`, `./account`, `./auth`, `./billing`, `./child`, `./content`, `./curriculum`, `./game-level`, `./offline-pack`, `./play`, `./social`, `./base`, `./model`, `./client`, `./registry`, `./codes`).
- [x] Chuyển đổi import từ `@mindkid/errors` sang subpath domain tương ứng:
  - [x] `apps/web/server/api/guest/**`
  - [x] `apps/web/server/api/users/**`
  - [x] `apps/web/server/api/managers/**`
  - [x] `apps/web/server/{middleware,services,utils}/**`
  - [x] `apps/web/app/**` và `apps/admin/app/**`
  - [x] `packages/**` (`packages/play`, `packages/db`, `packages/export`, `packages/content-build`, `packages/auth`, `packages/shared`, `packages/audit`)
- [x] Xác nhận không còn import gom từ `@mindkid/errors` (ngoại trừ re-export ở `packages/errors/src/index.ts`).

## Cổng đóng task

- [x] `pnpm lint` sạch · `pnpm lint:deps` 0 vi phạm
- [x] `pnpm typecheck` 0 lỗi / 10 project
- [x] `pnpm check:error-codes` — cả 5 phép đo về 0
- [x] `pnpm exec vitest run` — diff file đỏ so baseline 46 file: **rỗng**
- [x] `bash scripts/check.sh --fast`

