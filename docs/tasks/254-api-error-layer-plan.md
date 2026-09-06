# Task #254 — Lớp exception chia theo domain + interceptor lỗi phía client

> Spec sở hữu: [`error-codes.md`](../specs/00-foundation/error-codes.md).
> Spec sẽ sinh thêm: `api-error-client.md` (WP254.12).

## 1. Vì sao

`createError()` rải khắp route: **378 lời gọi**, không mã máy, mỗi chỗ tự gõ thông báo.
Handler chung phải **đoán** mã từ `statusMessage`, đoán trượt thì trả `INTERNAL_ERROR` 500.
Phía client không có tầng nào chuẩn hoá: 18 page gọi `$fetch` trần, 88 khối `catch`, kiểu
lỗi copy-paste ba chỗ, và 25 nhánh phân theo `statusCode` thay vì theo mã — vi phạm
`BR-ERR-06`.

Mục tiêu: base exception khai **cấu trúc**, file domain khai **mã/status/thông báo**,
handler chung là chỗ duy nhất render, interceptor là chỗ duy nhất client xử lý lỗi chung.

## 2. Đã xong (không lặp lại)

| Hạng mục | Kết quả |
|---|---|
| `packages/errors` | 1.701 dòng, zero runtime dep, client-safe |
| `src/base.ts` | `AppError` H3Error hạng nhất, `DEFAULT_ERROR_STATUS = 400`, `defineError()` |
| `src/model.ts` | `ModelNotFoundError` 404, `ValidationError` 422, `defineModelNotFound()` |
| `src/domains/*` | 11 file · **78 mã** · **15 lớp model** |
| `src/registry.ts` | subpath riêng `@mindkid/errors/registry`, ❌ không trong barrel |
| Spec §7 | thêm **18 mã** đang chạy mà chưa từng đăng ký (`BR-ERR-01` vi phạm 18 lần) |
| `packages/auth` | shim `@deprecated`; 316 `appError()` + 49 `new AppError()` không sửa dòng nào |
| Cổng | lint 2.081 file sạch · `lint:deps` 0 · typecheck **0/10 project** · 0 test đỏ mới |

## 3. Nợ còn lại — số đo 2026-09-06

| Ký hiệu | Nợ | Số |
|---|---|--:|
| D1 | `createError(` trong `apps/web/server/api/**` | **365** (guest 36/16f · users 145/53f · managers 184/61f) |
| D2 | `createError(` ngoài `api/` — middleware + utils runtime | **13** (6 file) |
| D3 | `appError("NOT_FOUND", "<chuỗi gõ tay>")` | **36** (trong 69 lời gọi `NOT_FOUND`) |
| D4 | Lớp lỗi domain `extends Error` trần → handler không nhận ra → 500 | **9** |
| D5 | Lời gọi qua shim `@mindkid/auth` | 316 `appError` + 49 `new AppError` · 112 file import |
| D6 | Page gọi `$fetch` trần, không interceptor | 18 file · 88 `catch` · 30 page admin |
| D7 | Tài liệu trỏ file đã xoá | `AGENTS.md:46` → `packages/auth/src/model-errors.ts` |

`AccessGatingError` (`packages/shared/src/access-gating.ts:14`) là **bản chép tay của
AppError**: tự khai `__h3_error__`, `statusCode`, `statusMessage`, `data`, `details`.
Gấp nó vào base là xoá trùng, không phải thêm việc.

## 4. Quyết định đang chờ người

| # | Câu hỏi | Chặn |
|---|---|---|
| 1 | `TOKEN_EXPIRED`: code trả **410** ("mã xác thực email hết hạn"), spec §7.2 ghi **401** kèm nhãn Deprecated ("session hết hạn"). Hai nghĩa đâm nhau dưới một mã. Tách làm hai mã, hay chọn một nghĩa? | WP254.12; đang ghi trong `KNOWN_STATUS_MISMATCH` của `packages/errors/tests/registry.test.ts` |
| 2 | 26 mã có trong spec §7 mà chưa cài lớp — cài dần theo route, hay đóng gọn một đợt? | không chặn; danh sách bị `PENDING_SPEC_CODES` khoá nên không trôi |

## 5. Work package

### Phase B — Handler và cổng (không phụ thuộc nhau, chạy song song được)

#### WP254.1 — Handler chung nhận lớp domain

`apps/web/server/error.ts` đang `import { AppError } from "@mindkid/auth"` — chuyển sang
`isAppError` của `@mindkid/errors`. Giữ nguyên: chỉ nhận `/api/*`, redact mọi 5xx, bộ
`ERROR_HEADERS`, log 5xx kèm `modelErrorContext`. ❌ NEVER bỏ điều kiện đường dẫn — trang
lỗi SSR của Nuxt phải giữ nguyên hành vi.

Thêm:
- Map lỗi Postgres qua `readPostgresErrorCode` (`server/utils/pg-error.ts`) → mã nghiệp vụ.
  ❌ không lộ tên constraint.
- **Log cảnh báo mức cao khi phải đi nhánh đoán mã `bodyFromH3Error`** — biến D1/D2 thành
  tín hiệu đếm được lúc chạy, không chỉ lúc grep.
- `apps/admin/app/error.vue` (admin đang không có; web đã có).

**Nhận:** `apps/web/tests/integration/api-error-handler.test.ts` xanh + 3 ca mới:
lớp domain mới ra đúng body §7.1 · `Error` trần → 500 redact · lỗi unique Postgres → mã
nghiệp vụ, body không chứa tên constraint.
**Kiểm tay:** `curl -i` một route 4xx → `{code, message}`, ❌ không `stack`/`url`.

#### WP254.2 — Cổng bậc thang `check:error-codes`

`scripts/check-error-codes.ts`, dùng lại hình dạng baseline JSON của
`scripts/typecheck/typecheck-gate.ts` — ❌ NEVER viết cơ chế bậc thang thứ hai.

| # | Đo | Trần đầu | Luật |
|---|---|--:|---|
| 1 | `createError(` trong `apps/web/server/api/**` | 365 | chỉ giảm |
| 2 | `createError(` ngoài `api/` trong `apps/web/server/**` | 13 | chỉ giảm |
| 3 | `appError("NOT_FOUND", "<chuỗi>")` | 36 | chỉ giảm → 0 ở WP254.9 |
| 4 | Lớp `extends Error` trần trong `packages/*/src` + `apps/web/server/services/**` | 9 | chỉ giảm → 0 ở WP254.10 |
| 5 | Import `appError`/`AppError` từ `@mindkid/auth` | 112 file | chỉ giảm → 0 ở WP254.11 |

Ngoại lệ ghi thẳng trong script: `MissingEnvError` (`packages/config`) và
`AlertingUnreachableError` (`packages/queue`) là lỗi khởi động/hạ tầng, không phải lỗi
HTTP — ❌ NEVER đếm vào phép đo 4.

`BR-ERR-01` (mã phải có trong spec §7) **đã** được `packages/errors/tests/registry.test.ts`
cưỡng chế, ngưỡng 0. Cổng CLI này không đo lại — ❌ NEVER hai chỗ đo một luật.

⚠️ **Cổng phải tự chứng minh đỏ trước khi được tin.** Ba ca âm bắt buộc, chạy và ghi kết
quả vào todo: thêm một `createError` mới → đỏ · thêm một `class X extends Error` → đỏ ·
hoàn nguyên → xanh. Cổng chưa từng đỏ là cổng chưa tồn tại.

**Đấu dây:** `package.json` + Phase lint của `scripts/check.sh`.
❌ NEVER thêm vào lefthook pre-commit — `lefthook.yml` nói rõ pre-commit phải nhanh.

### Phase C — Interceptor phía client

#### WP254.3 — Kiểu lỗi client + `useApi` cho `apps/web`

`packages/errors/src/client.ts` (subpath `@mindkid/errors/client` đã khai sẵn trong
`package.json`, hiện chưa có file):
- `normalizeApiError(err): ApiError` — đọc `err.data` của `FetchError`; lỗi mạng hoặc
  không parse được → `code: "NETWORK_ERROR"`, mã **client-only**, ❌ NEVER lẫn vào registry.
- `isApiError(err, code?)`, `getFieldErrors(err)`.
- `code` giữ kiểu `string`, ❌ NEVER ràng vào `ErrorCode` — ràng vào union đóng của server
  biến mọi mã mới thành breaking change ở client.

`apps/web/app/composables/use-api.ts` — `$fetch.create({ onRequest, onResponseError })`:
- `onRequest` gắn `x-csrf-token`, tái dùng `useCsrfHeaders()`
  (`app/composables/use-csrf-fetch.ts`). ❌ NEVER khai lại tên cookie `tm_u_csrf`.
- `onResponseError` chuẩn hoá rồi phân nhánh **theo mã**:

| Mã | Hành vi |
|---|---|
| `UNAUTHENTICATED`, `SESSION_REVOKED` | dọn state + `navigateTo('/login?redirect_to=…')` |
| `CONSENT_REQUIRED` | `navigateTo('/consent-required')` |
| `NO_ACTIVE_CHILD` | về màn chọn hồ sơ |
| `INTRO_REQUIRED` | về `details.return_level_code` sau hàng đợi làm quen |
| `RATE_LIMITED` | đọc `details.retry_after_s`, gắn vào lỗi ném lại |
| 5xx / `INTERNAL_ERROR` | đẩy telemetry, ném lại |
| còn lại | ném lại `ApiError` đã chuẩn hoá |

Luôn `throw` lại — ❌ NEVER nuốt lỗi ở interceptor. Hiển thị vẫn do call site
(quyết định của người đặt việc: không dựng toast/UI mới).

`apps/web/app/plugins/api.ts` gán `globalThis.$fetch = api` để 18 file đang gọi `$fetch`
trần được chặn **mà không sửa call site**. `$fetch.create` giữ suy kiểu route của Nitro nên
không mất type — đây là lý do chọn cách này thay vì bọc generic, đúng cảnh báo đã ghi sẵn
trong `use-csrf-fetch.ts`. Plugin chỉ chạy client.

**Nhận:** `apps/web/tests/unit/use-api.test.ts` — 401 `UNAUTHENTICATED` → có `navigateTo`
`/login` · 422 `VALIDATION_FAILED` → **không** điều hướng, lỗi có `fields[]` ·
**ca âm:** 403 `TIER_LOCKED` không điều hướng và không bị nuốt.

#### WP254.4 — `apps/admin` + chuyển call site sang bắt theo mã

- Thêm `onResponseError` vào `request()` của `apps/admin/app/composables/use-api-client.ts`.
  Giữ nguyên `apiUrl()` và bootstrap CSRF (`BR-ARB-04`: admin là host tĩnh gọi chéo origin).
  `UNAUTHENTICATED` → login **của admin**, không phải của web.
- Xoá 3 khai báo `ApiErrorShape` cục bộ (`parent-gate-modal.vue:127`,
  `me/children/index.vue:180`, `me/children/create.vue:166`) → dùng kiểu chung.
- Thay 25 nhánh `statusCode` + 11 nhánh `statusMessage` bằng `isApiError(err, "CODE")`.
- Xoá `catch` chỉ để điều hướng 401 — ví dụ `app/pages/play/[code].vue:1334`.

**Nhận:** `grep -rn "statusCode" apps/web/app apps/admin/app` chỉ còn ca đặc biệt có chú
thích; `pnpm typecheck` 0/10.

> **CHECKPOINT A** — kiểm tay hành vi FE trước khi động vào 378 lời gọi BE.

### Phase D — Di trú route (tăng dần, mỗi lượt hạ trần)

Công thức chung: `createError({statusCode, message})` → `throw new <Domain>Error(details)`.
Mã chưa có → **thêm lớp vào file domain và bảng §7 trước**, rồi mới dùng (`BR-ERR-01`;
`registry.test.ts` sẽ đỏ nếu quên). Mỗi WP hạ trần tương ứng trong baseline.

| WP | Phạm vi | Lời gọi / file |
|---|---|--:|
| WP254.5 | `server/api/guest/**` | 36 / 16 |
| WP254.6 | `server/api/users/**` | 145 / 53 |
| WP254.7 | `server/api/managers/**` | 184 / 61 |
| WP254.8 | ngoài `api/`: `middleware/consent-gate.ts`, `utils/{admin-auth,auth,curriculum,game-config}-runtime.ts` | 13 / 6 |

`managers/` đi sau cùng vì `apps/admin` là hộ tiêu thụ duy nhất và đã đấu dây ở WP254.4.

**Nhận mỗi WP:** `pnpm test` không đỏ mới · trần giảm đúng số · log cảnh báo "đoán mã" của
WP254.1 giảm tương ứng.
**Kiểm tay:** `curl -i` một route lỗi trong nhóm vừa chuyển.

> **CHECKPOINT B** — sau `users/`: soát tay không route nào đổi HTTP status ngoài ý muốn
> (`BR-ERR-07`: 402 hết quota ≠ 403 thiếu quyền). Baseline **không** bắt được chuyện này.

### Phase E — Dọn đuôi

#### WP254.9 — Nhận nuôi lớp not-found theo model

36 lời gọi `appError("NOT_FOUND", "chuỗi")` → lớp trong file domain tương ứng. Model chưa
có lớp → thêm **một dòng** `defineModelNotFound(...)`, ❌ NEVER viết `class` thủ công.
Truyền khoá vào constructor để `model`/`key` ra log qua `modelErrorContext`.
Hạ phép đo 3 về **0**.

**Ca âm phải giữ:** body 404 không chứa tên bảng và không chứa id
(`packages/errors/tests/registry.test.ts` đã phủ cả 15 lớp).

#### WP254.10 — Gấp 9 lớp `extends Error` vào file domain

| Lớp | Về file | Ghi chú |
|---|---|---|
| `AccessGatingError` (`shared/access-gating.ts:14`) | `billing.ts` + `game-level.ts` | **chép tay của AppError** — xoá `__h3_error__`/`statusCode`/`statusMessage`/`data` tự khai |
| `ChildFieldNotAllowedError` (`shared/child-data.ts:123`) | `child.ts` | mã `CHILD_FIELD_NOT_ALLOWED` đã có trong spec, chưa cài |
| `InvalidStatusTransitionError` (`shared/lifecycle.ts:65`) | `content.ts` | mã đã có |
| `PaymentOrderTransitionError` (`shared/payment-state-machine.ts:36`) | `billing.ts` | |
| `WorksheetServiceError` (`web/services/worksheet.ts:25`) | `content.ts` | |
| `LifecycleError` (`web/services/content-lifecycle.ts:61`) | `content.ts` | |
| `AiEgressViolationError` (`web/services/ai-egress-guard.ts:39`) | `common.ts` | |
| `AuditError` (`packages/audit/src/index.ts:7`) | quyết trong WP | lỗi ghi audit — có phải lỗi HTTP không? |

Giữ nguyên `MissingEnvError` và `AlertingUnreachableError` — lỗi khởi động/hạ tầng.
Hạ phép đo 4 về **0** (hoặc 1 nếu `AuditError` ở lại, ghi lý do vào ngoại lệ).

#### WP254.11 — Gỡ shim `@mindkid/auth`

- 316 `appError("MÃ", …)` → `new <Tên>Error(…)`; 49 `new AppError(…)` tương tự.
- 9 guard `instanceof AppError` → `isAppError()`.
- **Rồi mới** gỡ `static override [Symbol.hasInstance]` khỏi shim. ❌ NEVER gỡ trước: guard
  sẽ lặng lẽ bỏ sót lớp domain và trả 500 — lỗi im lặng, không cổng nào bắt.
- Xoá `packages/auth/src/errors.ts`, bỏ dependency, hạ phép đo 5 về **0**.

#### WP254.12 — Spec và tài liệu

- `docs/specs/00-foundation/api-error-client.md` — spec mới, khung 11 mục,
  `depends_on: [ERROR-CODES]`. Sở hữu: hợp đồng interceptor, bảng mã → hành vi cắt ngang
  (bảng ở WP254.3), quy tắc "call site chỉ xử lý ca đặc biệt", mã client-only
  `NETWORK_ERROR`.
- `error-codes.md`: §8 đổi thành "handler ném **lớp exception của domain**"; §7 thêm cột
  tên lớp; §10 thêm "client bắt theo mã"; đóng câu hỏi `TOKEN_EXPIRED` (mục 4 ở trên).
- **`AGENTS.md` đang sai**: dòng 30 trỏ `packages/auth/src/errors.ts` (nay là shim), dòng 46
  trỏ `packages/auth/src/model-errors.ts` (**đã xoá**). Cập nhật sang `@mindkid/errors`.

### Phase F — Chia nhỏ import theo domain error module (`@mindkid/errors/*` subpaths)

#### WP254.13 — Chia nhỏ import lỗi theo domain

- **Lý do:** Tránh gom tất cả vào barrel lớn `@mindkid/errors`. Mỗi route/service/component chỉ import đúng lỗi từ file domain tương ứng, tăng độ tường minh và ranh giới nghiệp vụ.
- **Khai báo subpath exports trong `packages/errors/package.json`:**
  - `./common`: `src/domains/common.ts` (lỗi HTTP chung: `ValidationError`, `NotFoundError`, `InternalError`, `RateLimitedError`, `ForbiddenError`, `ConflictError`, `BadRequestError`, etc.)
  - `./account`: `src/domains/account.ts` (`UserNotFoundError`, `ManagerNotFoundError`, `AccountSuspendedError`, `AccountDeletedError`, etc.)
  - `./auth`: `src/domains/auth.ts` (`UnauthenticatedError`, `SessionRevokedError`, `MfaRequiredError`, `TokenExpiredError`, etc.)
  - `./billing`: `src/domains/billing.ts` (`ChildLimitExceededError`, `TierLockedError`, `QuotaExceededError`, etc.)
  - `./child`: `src/domains/child.ts` (`ChildNotFoundError`, `ChildAgeOutOfRangeError`, `ChildFieldNotAllowedError`, `AvatarNotInPresetError`, etc.)
  - `./content`: `src/domains/content.ts` (`LessonNotFoundError`, `ActivityNotFoundError`, `WorksheetNotFoundError`, `SkillNotFoundError`, etc.)
  - `./curriculum`: `src/domains/curriculum.ts` (`CurriculumNotFoundError`, etc.)
  - `./game-level`: `src/domains/game-level.ts` (`GameLevelNotFoundError`, `TemplateNotSupportedError`, `LayoutNotSupportedError`, etc.)
  - `./offline-pack`: `src/domains/offline-pack.ts` (`OfflinePackNotFoundError`, etc.)
  - `./play`: `src/domains/play.ts` (`PlaySessionNotFoundError`, etc.)
  - `./social`: `src/domains/social.ts` (`SocialEmailConflictError`, `SocialIdentityNotFoundError`, etc.)
  - `./base`: `src/base.ts` (`AppError`, `defineError`, `isAppError`)
  - `./model`: `src/model.ts` (`ModelNotFoundError`, `defineModelNotFound`)
  - `./client`: `src/client.ts` (`normalizeApiError`, `isApiError`, `getFieldErrors`)
  - `./registry`: `src/registry.ts`
- **Di trú toàn bộ call site:**
  - `apps/web/server/**`: Chuyển import từ `@mindkid/errors` sang subpath tương ứng (ví dụ: lỗi trẻ từ `@mindkid/errors/child`, lỗi chung từ `@mindkid/errors/common`).
  - `apps/web/app/**`: `useApi` và các page chuyển sang `@mindkid/errors/client` hoặc domain error subpath.
  - `apps/admin/app/**`: `useApiClient` và các trang studio/login chuyển sang subpath.
  - `packages/**`: `packages/play`, `packages/db`, `packages/export`, `packages/content-build`, `packages/auth`, `packages/shared`, `packages/audit` chuyển sang subpath domain tương ứng.

## 6. Phụ thuộc

```
[đã xong] base + domain + shim
     ├─→ WP254.1 handler ──────────────┐
     ├─→ WP254.2 cổng (song song) ─────┤
     └─→ WP254.3 client + useApi ─→ WP254.4 admin ─→ CHECKPOINT A
                                                          ↓
                          WP254.5 guest → WP254.6 users → CHECKPOINT B → WP254.7 managers
                                                          ↓
                                        WP254.8 ngoài api/ → WP254.9 → WP254.10 → WP254.11
                                                          ↓
                                                     WP254.12 spec + AGENTS.md
                                                          ↓
                                                     WP254.13 chia nhỏ import domain
```

## 7. Rủi ro

| Rủi ro | Ứng phó |
|---|---|
| Ghi đè `globalThis.$fetch` chạm cả SSR | Plugin chỉ chạy client; request SSR đi thẳng, handler chung đã lo |
| Đổi `createError` vô tình đổi HTTP status | Baseline không bắt được — CHECKPOINT B soát tay `BR-ERR-07`; test tích hợp API là lưới thứ hai |
| Gỡ `Symbol.hasInstance` sớm | WP254.11 ràng thứ tự: sửa 9 guard **trước**, gỡ **sau** |
| Bộ test đỏ sẵn che lỗi mới | `main` sạch đỏ **46 file / 159 test**; `pnpm test` có `--bail 1` nên báo "1 failed". So bằng **diff danh sách file đỏ**, ❌ NEVER so tổng số |
| Node PATH là v20 | `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` trước mọi lệnh |
