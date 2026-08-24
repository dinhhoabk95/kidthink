# MindKid — context cho agent

Monorepo pnpm. Nuxt 4.5 + Nitro 2 + h3 v1 · Drizzle + PostgreSQL 17 · Valkey ·
BullMQ · Zod 4 (dòng `zod@3.25`, API cổ điển) · Biome 2 qua `ultracite`.

`apps/web` (bề mặt người dùng + toàn bộ `/api/*`) · `apps/admin` (static SPA) · `apps/worker` ·
`packages/*` (driver dùng chung).

## Runtime boundary — Task #104

- `{domain}` chạy `apps/web` SSR và toàn bộ API. `admin.{domain}` chỉ nhận static files từ
  `apps/admin/.output/public`; không có Nitro server, PM2 process, DB package hay auth module.
- Admin gọi absolute `NUXT_PUBLIC_API_BASE_URL` với `credentials: include`; CSRF token manager
  giữ trong memory. Cookie Manager là host-only trên `{domain}` và được web resolve trong Redis
  namespace `manager`.
- `nuxt-auth-utils` chỉ dùng trong web. Browser auth dùng opaque locator + Redis, không first-party
  JWT hoặc refresh route. Nginx giữ proxy API, rate limit và static admin; Caddy chỉ là nghiên cứu.

## Spec là contract, không phải tài liệu

`docs/specs/` có **162 spec, một outcome một file**. Trước khi sửa hành vi, đọc spec sở
hữu hành vi đó. Tra một `BR-*` về spec nào: `docs/specs/00-foundation/business-rules.md`.

- Đổi hành vi mà spec đã chốt → sửa spec **trước**, trong cùng PR.
- Mỗi rule lint BẮT BUỘC trỏ về một `BR-*`. Không có BR sở hữu thì không thêm rule.
- Không nới rule chỉ để code hiện tại qua được cổng.

## Lỗi: không try/catch trong route

`AppError` (`packages/auth/src/errors.ts`) là **H3Error hạng nhất** — nó khai
`static __h3_error__` cùng getter `statusCode` / `statusMessage` / `data`. Nên:

```ts
// ĐÚNG — service hoặc route chỉ ném mã
throw appError("TIER_LOCKED", { access_tier: "premium" });
throw new ChildNotFoundError(childUuid);

// SAI — route tự chuyển lỗi domain sang lỗi HTTP
try { ... } catch (err) {
  if (err instanceof AppError) { setResponseStatus(...); throw createError({ ... }); }
}
```

`apps/web/server/error.ts` là chỗ **duy nhất** dựng body lỗi cho `/api/*`
(ERROR-CODES §4, §8). Body luôn đúng ba trường `{ code, message, details? }` (§7.1).
Lớp exception theo model nằm ở `packages/auth/src/model-errors.ts`
(`ModelNotFoundError`, `ValidationError`, và lớp con cho từng model).

Còn 33 khối `catch` trong `apps/*/server` — tất cả đều có logic thật (retry SQLSTATE
23505, health check, webhook). Đừng bỏ chúng.

## An toàn kiểu — `docs/specs/08-quality/type-safety.md`

| Thứ                               | Luật                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `any` tường minh, code production | Cấm. Biome `noExplicitAny` mức error, đang sạch                                                     |
| `any` tường minh, file test       | Biome **không** phủ (ultracite tắt rule ở đường dẫn test). Nợ 560 chỗ, chỉ được giảm                |
| `as T`                            | Nợ **chỉ được giảm**, 851 chỗ. `pnpm --filter @mindkid/gates test` so `packages/gates/src/type-safety-baseline.json`       |
| `as const`                        | Được — làm kiểu hẹp lại, không nói dối                                                              |
| `unknown`                         | **Được khuyến khích** ở ranh giới, nhưng phải parse hoặc hẹp kiểu trước khi đọc field               |
| Body/query/param của route        | Phải Zod parse. `pnpm --filter @mindkid/gates test`, sổ nợ 24 route ở `packages/gates/src/route-validation-debt.json` |

Thay ép kiểu bằng gì: `readRequestBody(event)` trả `unknown` ·
`readPostgresErrorCode(err)` thay `(err as { code?: string }).code` ·
`throwValidationError(zodError)` thay bốn cách dựng `VALIDATION_FAILED` cũ.

## Cổng nào thật, cổng nào nói dối

Đo trước khi tin. Ba cổng dưới đây từng xanh giả:

| Lệnh                                                          | Sự thật                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ultracite check`                                             | **exit 0 dù có lỗi lint.** Dùng `pnpm lint` (`biome check .`)      |
| `pnpm --filter @mindkid/web run typecheck` (`nuxt typecheck`) | **exit 0 im lặng.** Dùng `pnpm typecheck:web` (`vue-tsc`)          |
| `pnpm typecheck`                                              | Không phủ `apps/*/server` — `tsconfig.json` gốc cố ý loại `apps/*` |

`pnpm typecheck:web` hiện có **685 lỗi** từ trước (đo 2026-08-23; con số 603 cũ đã lệch).
Nó là cổng **delta**: đếm trước khi sửa, yêu cầu không tăng.

## Môi trường

- Node **24** (`.nvmrc`). Node mặc định của máy là v20 → `pnpm` sẽ chết với
  `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.
- `vitest 4` đã bỏ `--reporter=basic`; dùng `dot` hoặc `json`.
- Postgres dev ở `127.0.0.1:5433`, Valkey `6380` (container giữ cổng mặc định).
- Nếu `rtk` bọc lệnh làm output bị nén/mất dòng, chạy lại qua `rtk proxy "<lệnh>"`.

## Cổng contract là test vitest, không phải script

Task #103 xoá 30 script `lint:*` khỏi `package.json` gốc (47 script → 24). Rule không
mất một cái nào — nó chuyển thành test:

| Cổng quét | Sống ở | Chạy bằng |
| --- | --- | --- |
| Đường dẫn của **một** workspace | `<workspace>/tests/gates/` | `pnpm --filter <pkg> test` |
| Chéo repo hoặc `docs/` | `packages/gates` | `pnpm --filter @mindkid/gates test` |
| Diff git đang chờ | `packages/gates/scripts/check-progress.ts` | `node` trực tiếp |

Mỗi cổng BẮT BUỘC có **hai** phần: quét nguồn thật và **ca âm** (`BR-TYP-07`).
Fixture vi phạm sống trong `tests/**/fixtures/` — ❌ NEVER viết mẫu vi phạm thẳng vào
file test, vì `apps/` và `packages/` là thứ các cổng khác đang quét (nhãn "phụ huynh"
trong một file test đã làm `lint:user-vocabulary` đỏ đúng như vậy). `packages/gates`
và `tests/**/fixtures/` được loại khỏi mọi cổng quét mã sản phẩm — xem
`isFixturePath` trong `packages/gates/src/lint-lib/source-scan.ts`.

Cổng ❌ NEVER đọc `process.cwd()`: vitest chạy với cwd là thư mục workspace. Gốc repo
lấy từ `REPO_ROOT` / `repoPath()` của `@mindkid/config/paths`.

Config vitest dùng chung ở `@mindkid/config/vitest` (`defineWorkspaceTest`); bảng
alias tự quét `packages/*`, ❌ NEVER khai tay trong từng app.

## Test

`pnpm test` gom mọi workspace. Chạy riêng từng workspace thì xanh; chạy gộp ở gốc thì
test tích hợp DB timeout 30s (tranh cùng dữ liệu) — đo trước khi tin. Khi refactor,
đừng lấy "test xanh" làm cổng — hãy chụp danh sách `trạng-thái | tên-test` trước và
sau, rồi yêu cầu **trùng khít**. Bất kỳ test đổi trạng thái, kể cả fail→pass, đều là
dấu hiệu đổi hành vi.

## Refactor diện rộng

Trên 500 dòng thì viết codemod, đừng sửa tay. Bài học đã trả giá:

- Neo theo thụt lề rồi nhảy bằng regex sẽ **ghép sai cặp** `try`↔`catch` khi gặp
  `} catch {` không tham số. Quét theo dòng, tìm dòng đóng ở đúng cột.
- Chuẩn hoá chuỗi để so whitelist thì cả hai bên phải đi qua **cùng một hàm**.
- Đếm `any` / `as` trên nguồn thô sẽ bắt cả chữ trong văn xuôi tiếng Việt và tên
  biến. Bỏ comment và chuỗi trước khi đếm (`packages/gates/src/lint-lib/source-scan.ts`).
- Cây làm việc thường đang có thay đổi dở của người khác → **đừng** dùng
  `git checkout` để hoàn tác. Sao lưu file ra ngoài repo trước khi ghi.
