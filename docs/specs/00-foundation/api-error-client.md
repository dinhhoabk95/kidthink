---
spec: API-ERROR-CLIENT
title: Tầng xử lý lỗi API phía client
area: foundation
status: implemented
mvp: true
phase: P1
reviewed: 2026-10-18
owns:
  - Chuẩn hoá lỗi API ở client (`packages/errors/src/client.ts`)
  - Composable gọi API kèm xử lý lỗi chuẩn hoá (`useApi` ở `apps/web`, `useApiClient` ở `apps/admin`)
  - Interceptor chuẩn hoá `FetchError` thành cấu trúc lỗi đồng nhất
depends_on:
  - ERROR-CODES
---

# Tầng xử lý lỗi API phía client

## 1. Objective

Chuẩn hoá trải nghiệm và xử lý lỗi phía client trên toàn bộ ứng dụng web và admin. Mọi phản hồi
lỗi từ API được interceptor chuẩn hoá thành một instance `ApiError` thống nhất, để UI component
rẽ nhánh theo mã nghiệp vụ (`isApiError(err, "CODE")`), lấy lỗi từng trường
(`getFieldErrors(err)`) và hiển thị thông điệp thân thiện mà không phụ thuộc vào chuỗi văn bản
biến động (`BR-ERR-06`).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| End-User (Phụ huynh / Trẻ) | Bất kỳ | Nhận thông báo lỗi tiếng Việt thân thiện, rõ ràng khi gọi API thất bại |
| Manager | Manager role | Nhận thông báo lỗi chi tiết, lỗi validation từng field trên form admin |
| Developer / Frontend Engineer | Dev | Dùng `useApi()` / `useApiClient()` và helper `isApiError`, `getFieldErrors` với kiểu chặt |

## 3. Entry points

| Bề mặt / Code | Actor | Ghi chú |
|---|---|---|
| `packages/errors/src/client.ts` (subpath `@mindkid/errors/client`) | All | Module helper thuần TS dùng chung cho client |
| `apps/web/app/composables/use-api.ts` | Web User | Composable bọc `$fetch` kèm interceptor chuẩn hoá lỗi |
| `apps/web/app/plugins/api.ts` | Web App | Plugin Nuxt cung cấp instance `$api` chuẩn hoá |
| `apps/admin/app/composables/use-api-client.ts` | Manager | Composable gọi web API tuyệt đối kèm credentials và CSRF token |

## 4. Main flow

1. Component gọi API qua `useApi()` hoặc `useApiClient()`.
2. Request gửi tới server handler (`/api/**`).
3. Nếu server trả lỗi (HTTP status ≥ 400), ofetch ném `FetchError`.
4. Interceptor bắt `FetchError`, đưa qua `normalizeApiError(err)` để thành `ApiError`.
5. Component bắt lỗi qua `try / catch`:
   - `isApiError(err, "MÃ_LỖI")` để rẽ nhánh theo mã lỗi cụ thể.
   - `getFieldErrors(err)` để gắn lỗi validate vào từng field của form.
   - Hiển thị `err.message` thân thiện lên UI/toast.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Mất mạng / Timeout | Không có HTTP response, hoặc message kiểu `Failed to fetch` / `NetworkError` | Chuẩn hoá thành mã client-only `NETWORK_ERROR`, `statusCode: 0` |
| Server/proxy trả body không có `code` nhưng có `message` | Body không phải JSON chuẩn | Chuẩn hoá thành `INTERNAL_ERROR`, giữ `statusCode` (mặc định 500) |
| Phản hồi lỗi chuẩn | Body có `{ code, message, details? }` (ERROR-CODES §7.1) | Giữ nguyên `code`, `message`, `statusCode` và `details` |
| Đối tượng lạ không đọc được | Không phải object | `NETWORK_ERROR`, `statusCode: 0` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-AEC-01` | Client bắt lỗi theo **mã lỗi** (`isApiError(err, "CODE")`), NEVER so sánh chuỗi `message` | Tuân thủ `BR-ERR-06`; chuỗi thông báo có thể đổi cho UX nhưng mã lỗi bất biến |
| `BR-AEC-02` | Mọi request gọi API từ client phải qua interceptor chuẩn hoá về `ApiError` | Ngăn rò rỉ cấu trúc `FetchError` không đồng nhất vào UI component |
| `BR-AEC-03` | Lỗi validation phải lấy được dạng `readonly ApiErrorField[]` (`{ field, message }`) qua `getFieldErrors(err)`; lỗi không có `details.fields` trả mảng rỗng | Form hiển thị lỗi cạnh đúng field mà không cần parse thủ công |
| `BR-AEC-04` | Admin SPA gọi API bằng `useApiClient` tuyệt đối, credentials include và `x-csrf-token` | Bảo vệ session và CSRF trên origin độc lập (`admin.{domain}`) |
| `BR-AEC-05` | Không hiển thị stack trace, mã lỗi kỹ thuật hoặc ID nội bộ lên bề mặt người dùng cuối | Tuân thủ `BR-ERR-03` và `BR-ERR-04` |

## 7. Data

### `ApiError` (`packages/errors/src/client.ts`)

```ts
export type ApiErrorField = {
  readonly field: string;
  readonly message: string;
};

export type ApiErrorDetails = {
  readonly fields?: readonly ApiErrorField[];
  readonly retry_after_s?: number;
  // … các khoá chi tiết khác theo ERROR-CODES, giá trị là JsonValue
};

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: ApiErrorDetails;
}
```

### Helper (`packages/errors/src/client.ts`)

- `normalizeApiError(error): ApiError` — chuẩn hoá mọi loại lỗi (FetchError, Error, object lạ).
- `isApiError(error, code?): error is ApiError` — type guard, khớp mã lỗi tuỳ chọn.
- `isApiErrorCode<C extends ClientErrorCode>(error, code: C): error is ApiError & { readonly code: C }` — khớp mã lỗi có kiểm tra compile-time theo enum mã lỗi (`ErrorCode | "NETWORK_ERROR"`).
- `getFieldErrors(error): readonly ApiErrorField[]` — trích lỗi field validation.

## 8. API contract

Không sở hữu route. Hình dạng body lỗi do [`error-codes.md`](error-codes.md) sở hữu.

## 9. Acceptance criteria

```gherkin
Scenario: BR-AEC-01 — rẽ nhánh theo mã lỗi
  Given server trả 402 với body { code: "QUOTA_EXCEEDED", message: "…" }
  When component bắt lỗi qua useApi()
  Then isApiError(err, "QUOTA_EXCEEDED") là true
  And isApiError(err, "VALIDATION_FAILED") là false

Scenario: BR-AEC-02 — không còn $fetch trần trong app
  When quét apps/web/app/** và apps/admin/app/**
  Then không có lời gọi $fetch( nào ngoài composable/plugin chuẩn hoá

Scenario: BR-AEC-03 — lỗi field có dạng mảng
  Given server trả 422 với details.fields = [{ field: "email", message: "Email không hợp lệ" }]
  When gọi getFieldErrors(err)
  Then nhận [{ field: "email", message: "Email không hợp lệ" }]
  And lỗi không có details.fields cho mảng rỗng

Scenario: BR-AEC-04 — admin gọi API kèm credentials và CSRF
  When useApiClient() gửi POST tới NUXT_PUBLIC_API_BASE_URL
  Then request có credentials "include" và header x-csrf-token

Scenario: BR-AEC-05 — ca âm, mất mạng không lộ chi tiết kỹ thuật
  Given request thất bại với "Failed to fetch"
  When normalizeApiError(err)
  Then code là "NETWORK_ERROR", statusCode là 0
  And message là câu tiếng Việt thân thiện, không chứa stack trace
```

## 10. Boundaries

**Always**
- Gọi API qua `useApi()` (web) hoặc `useApiClient()` (admin).
- Rẽ nhánh theo `code`, hiển thị `message`.

**Ask first**
- Thêm mã lỗi client-only mới ngoài `NETWORK_ERROR`.

**Never**
- Gọi `$fetch(` trần tới `/api/**` từ component hoặc page.
- So sánh chuỗi `message` để rẽ nhánh.
- Hiển thị stack trace hoặc ID nội bộ cho người dùng cuối.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| — | Không có câu hỏi mở | — | — | — |
