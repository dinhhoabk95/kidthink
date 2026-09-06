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
- [ ] **Người quyết:** `TOKEN_EXPIRED` code 410 vs spec 401 — tách hai mã, hay chọn một nghĩa?

## WP254.1 — Handler chung nhận lớp domain

- [ ] `apps/web/server/error.ts`: `instanceof AppError` (từ `@mindkid/auth`) → `isAppError` của `@mindkid/errors`.
- [ ] Giữ nguyên: chỉ `/api/*` · redact mọi 5xx · `ERROR_HEADERS` · log 5xx kèm `modelErrorContext`.
- [ ] Map lỗi Postgres qua `readPostgresErrorCode` → mã nghiệp vụ, ❌ không lộ tên constraint.
- [ ] Log cảnh báo mức cao khi rơi vào nhánh đoán mã `bodyFromH3Error`.
- [ ] `apps/admin/app/error.vue` (chép cấu trúc từ `apps/web/app/error.vue`, đổi chữ).
- [ ] Test: lớp domain → body §7.1 · `Error` trần → 500 redact · unique violation → mã nghiệp vụ, body không chứa tên constraint.
- [ ] Kiểm tay: `curl -i` route 4xx → `{code, message}`, không `stack`/`url`.

## WP254.2 — Cổng bậc thang `check:error-codes`

- [ ] `scripts/check-error-codes.ts` + `scripts/error-codes-baseline.json`, dùng lại hình dạng của `scripts/typecheck/typecheck-gate.ts`.
- [ ] Phép đo 1: `createError(` trong `server/api/**` — trần **365**.
- [ ] Phép đo 2: `createError(` ngoài `api/` — trần **13**.
- [ ] Phép đo 3: `appError("NOT_FOUND", "<chuỗi>")` — trần **36**.
- [ ] Phép đo 4: `extends Error` trần — trần **9**; ngoại lệ `MissingEnvError`, `AlertingUnreachableError`.
- [ ] Phép đo 5: file import `appError`/`AppError` từ `@mindkid/auth` — trần **112**.
- [ ] ❌ NEVER đo lại `BR-ERR-01` — `packages/errors/tests/registry.test.ts` đã cưỡng chế.
- [ ] **Ca âm, ghi kết quả vào đây:** thêm `createError` mới → ĐỎ · thêm `class X extends Error` → ĐỎ · hoàn nguyên → XANH.
- [ ] Đấu vào `package.json` + Phase lint của `scripts/check.sh`. ❌ NEVER vào lefthook pre-commit.

## WP254.3 — Kiểu lỗi client + `useApi` cho web

- [ ] `packages/errors/src/client.ts`: `normalizeApiError`, `isApiError`, `getFieldErrors`, mã client-only `NETWORK_ERROR`.
- [ ] `code` giữ kiểu `string`, ❌ NEVER ràng vào `ErrorCode`.
- [ ] `apps/web/app/composables/use-api.ts` — `$fetch.create` + `onRequest` (CSRF, tái dùng `useCsrfHeaders`) + `onResponseError`.
- [ ] Bảng mã → hành vi: `UNAUTHENTICATED`/`SESSION_REVOKED` · `CONSENT_REQUIRED` · `NO_ACTIVE_CHILD` · `INTRO_REQUIRED` · `RATE_LIMITED` · 5xx · còn lại.
- [ ] Luôn `throw` lại — ❌ NEVER nuốt lỗi ở interceptor.
- [ ] `apps/web/app/plugins/api.ts` gán `globalThis.$fetch`, chỉ chạy client.
- [ ] Test: 401 → `navigateTo('/login')` · 422 → không điều hướng, có `fields[]` · **ca âm** 403 `TIER_LOCKED` → không điều hướng, không bị nuốt.

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

- [ ] Chuyển `createError` → lớp domain; mã mới phải vào file domain **và** spec §7 trước.
- [ ] Hạ trần phép đo 1 xuống **329**.
- [ ] `pnpm test` — diff danh sách file đỏ, không được có file mới.

## WP254.6 — Di trú `users/` (145 / 53)

- [ ] Chuyển; hạ trần phép đo 1 xuống **184**.
- [ ] Log "đoán mã" của WP254.1 giảm tương ứng.

## CHECKPOINT B — soát status

- [ ] Không route nào đổi HTTP status ngoài ý muốn (`BR-ERR-07`: 402 hết quota ≠ 403 thiếu quyền).
- [ ] Baseline **không** bắt được chuyện này — phải soát tay diff.

## WP254.7 — Di trú `managers/` (184 / 61)

- [ ] Chuyển; hạ trần phép đo 1 xuống **0**.
- [ ] Kiểm tay qua `apps/admin` (hộ tiêu thụ duy nhất).

## WP254.8 — Ngoài `api/` (13 / 6 file)

- [ ] `middleware/consent-gate.ts`, `utils/{admin-auth,auth,curriculum,game-config}-runtime.ts`.
- [ ] Hạ trần phép đo 2 về **0**.

## WP254.9 — Nhận nuôi lớp not-found theo model

- [ ] 36 `appError("NOT_FOUND", "chuỗi")` → lớp domain; model thiếu thì thêm **một dòng** `defineModelNotFound`.
- [ ] ❌ NEVER viết `class X extends ModelNotFoundError` thủ công.
- [ ] Truyền khoá vào constructor để `model`/`key` ra log.
- [ ] Hạ trần phép đo 3 về **0**.
- [ ] Ca âm giữ nguyên: body 404 không chứa tên bảng, không chứa id.

## WP254.10 — Gấp 9 lớp `extends Error` vào file domain

- [ ] `AccessGatingError` → `billing.ts` + `game-level.ts`; xoá `__h3_error__`/`statusCode`/`statusMessage`/`data` tự khai (bản chép tay của AppError).
- [ ] `ChildFieldNotAllowedError` → `child.ts` (mã đã có trong spec, chưa cài).
- [ ] `InvalidStatusTransitionError`, `WorksheetServiceError`, `LifecycleError` → `content.ts`.
- [ ] `PaymentOrderTransitionError` → `billing.ts`.
- [ ] `AiEgressViolationError` → `common.ts`.
- [ ] `AuditError`: quyết có phải lỗi HTTP không; nếu không thì ghi vào ngoại lệ của cổng.
- [ ] Giữ nguyên `MissingEnvError`, `AlertingUnreachableError`.
- [ ] Hạ trần phép đo 4 về **0**.

## WP254.11 — Gỡ shim `@mindkid/auth`

- [ ] 316 `appError("MÃ", …)` → `new <Tên>Error(…)`.
- [ ] 49 `new AppError(…)` → lớp domain.
- [ ] 9 guard `instanceof AppError` → `isAppError()`.
- [ ] **Rồi mới** gỡ `static override [Symbol.hasInstance]`. ❌ NEVER gỡ trước — guard sẽ lặng lẽ bỏ sót lớp domain và trả 500.
- [ ] Xoá `packages/auth/src/errors.ts`, bỏ dependency `@mindkid/errors` khỏi `packages/auth` nếu không còn dùng.
- [ ] Hạ trần phép đo 5 về **0**.

## WP254.12 — Spec và tài liệu

- [ ] `docs/specs/00-foundation/api-error-client.md` — khung 11 mục, `depends_on: [ERROR-CODES]`.
- [ ] `error-codes.md` §8: handler ném **lớp exception của domain**.
- [ ] `error-codes.md` §7: thêm cột tên lớp.
- [ ] `error-codes.md` §10: client bắt theo mã.
- [ ] `error-codes.md` §11: đóng câu hỏi `TOKEN_EXPIRED` theo quyết định ở Preflight.
- [ ] **`AGENTS.md:30`** trỏ `packages/auth/src/errors.ts` → đổi sang `@mindkid/errors`.
- [ ] **`AGENTS.md:46`** trỏ `packages/auth/src/model-errors.ts` — **file đã xoá**, phải sửa.

## Cổng đóng task

- [ ] `pnpm lint` sạch · `pnpm lint:deps` 0 vi phạm
- [ ] `pnpm typecheck` 0 lỗi / 10 project
- [ ] `pnpm check:error-codes` — cả 5 phép đo về 0
- [ ] `pnpm exec vitest run` — diff file đỏ so baseline 46 file: **rỗng**
- [ ] `bash scripts/check.sh --fast`
