# MindKid — context cho agent

Monorepo pnpm. Nuxt 4.5 + Nitro 2 + h3 v1 · Drizzle + PostgreSQL 17 · Valkey ·
BullMQ · Zod 4 (dòng `zod@3.25`, API cổ điển) · Biome 2 qua `ultracite`.

`apps/web` (bề mặt người dùng + toàn bộ `/api/*`) · `apps/admin` · `apps/worker` ·
`packages/*` (driver dùng chung).

## Spec là contract, không phải tài liệu

`docs/specs/` có **146 spec, một outcome một file**. Trước khi sửa hành vi, đọc spec sở
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
| `as T`                            | Nợ **chỉ được giảm**, 851 chỗ. `pnpm lint:type-safety` so `scripts/type-safety-baseline.json`       |
| `as const`                        | Được — làm kiểu hẹp lại, không nói dối                                                              |
| `unknown`                         | **Được khuyến khích** ở ranh giới, nhưng phải parse hoặc hẹp kiểu trước khi đọc field               |
| Body/query/param của route        | Phải Zod parse. `pnpm lint:route-validation`, sổ nợ 24 route ở `scripts/route-validation-debt.json` |

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

`pnpm typecheck:web` hiện có **603 lỗi** (367 trong `server/`) từ trước. Nó là cổng
**delta**: đếm trước khi sửa, yêu cầu không tăng.

## Môi trường

- Node **24** (`.nvmrc`). Node mặc định của máy là v20 → `pnpm` sẽ chết với
  `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.
- `vitest 4` đã bỏ `--reporter=basic`; dùng `dot` hoặc `json`.
- Postgres dev ở `127.0.0.1:5433`, Valkey `6380` (container giữ cổng mặc định).
- Nếu `rtk` bọc lệnh làm output bị nén/mất dòng, chạy lại qua `rtk proxy "<lệnh>"`.

## Test

`pnpm test` gom mọi workspace. Baseline `apps/web` hiện **đỏ 234/472** vì DB dev lệch
schema (`column "label" of relation "entitlement_keys" does not exist`), **không** phải
lỗi code. Khi refactor, đừng lấy "test xanh" làm cổng — hãy chụp danh sách
`trạng-thái | tên-test` trước và sau, rồi yêu cầu **trùng khít**. Bất kỳ test đổi
trạng thái, kể cả fail→pass, đều là dấu hiệu đổi hành vi.

Cổng lint mới BẮT BUỘC có **ca âm** (`BR-TYP-07`): một mẫu vi phạm phải làm cổng fail.
Xem `scripts/tests/fixtures/route-validation/`.

## Refactor diện rộng

Trên 500 dòng thì viết codemod, đừng sửa tay. Bài học đã trả giá:

- Neo theo thụt lề rồi nhảy bằng regex sẽ **ghép sai cặp** `try`↔`catch` khi gặp
  `} catch {` không tham số. Quét theo dòng, tìm dòng đóng ở đúng cột.
- Chuẩn hoá chuỗi để so whitelist thì cả hai bên phải đi qua **cùng một hàm**.
- Đếm `any` / `as` trên nguồn thô sẽ bắt cả chữ trong văn xuôi tiếng Việt và tên
  biến. Bỏ comment và chuỗi trước khi đếm (`scripts/lint-lib/source-scan.ts`).
- Cây làm việc thường đang có thay đổi dở của người khác → **đừng** dùng
  `git checkout` để hoàn tác. Sao lưu file ra ngoài repo trước khi ghi.
