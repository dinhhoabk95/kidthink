---
spec: API-ERROR-CLIENT
title: Tầng xử lý lỗi API phía client
area: foundation
status: approved
mvp: true
phase: P1
reviewed: 2026-09-06
owns:
  - Chuẩn hoá lỗi API ở client (`packages/errors/src/client.ts`)
  - Composable gọi API kèm xử lý lỗi chuẩn hoá (`useApi` ở `apps/web`, `useApiClient` ở `apps/admin`)
  - Interceptor chuẩn hoá `FetchError` thành cấu trúc lỗi đồng nhất
depends_on:
  - ERROR-CODES
---

# Tầng xử lý lỗi API phía client

## 1. Objective

Chuẩn hoá trải nghiệm và xử lý lỗi phía client trên toàn bộ ứng dụng web và admin. Đảm bảo mọi phản hồi lỗi từ API được interceptor chuẩn hoá thành cấu trúc `ApiErrorShape` thống nhất, giúp UI components dễ dàng bắt lỗi theo mã nghiệp vụ (`isApiError(err, "CODE")`), trích xuất lỗi từng trường (`getFieldErrors(err)`) và hiển thị thông điệp thân thiện với người dùng mà không phụ thuộc vào chuỗi văn bản biến động (tuân thủ `BR-ERR-06`).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| End-User (Phụ huynh / Trẻ) | Bất kỳ | Nhận thông báo lỗi tiếng Việt thân thiện, rõ ràng khi gọi API thất bại |
| Manager / Quản trị viên | Manager role | Nhận thông báo lỗi chi tiết, phản hồi validation lỗi từng field trên form studio/admin |
| Developer / Frontend Engineer | Dev | Sử dụng `useApi()` / `useApiClient()` và helpers `isApiError`, `getFieldErrors` với strict type-safe |

## 3. Entry points

| Bề mặt / Code | Actor | Ghi chú |
|---|---|---|
| `packages/errors/src/client.ts` | All | Module helper thuần TS dùng chung cho client |
| `apps/web/app/composables/use-api.ts` | Web User | Composable bọc `$fetch` kèm interceptor chuẩn hoá lỗi |
| `apps/web/app/plugins/api.ts` | Web App | Plugin Nuxt cung cấp instance `$api` chuẩn hoá |
| `apps/admin/app/composables/use-api-client.ts` | Admin Manager | Composable gọi web API tuyệt đối kèm credentials và CSRF token |

## 4. Main flow

1. Component gọi API qua `useApi()` hoặc `useApiClient()`.
2. Request gửi tới server handler (`/api/**`).
3. Nếu server trả về lỗi (HTTP status ≥ 400), ofetch ném `FetchError`.
4. Client interceptor bắt `FetchError`, đưa qua `normalizeApiError(err)` để chuẩn hoá thành `ApiErrorShape`.
5. Component bắt lỗi qua `try / catch`:
   - Dùng `isApiError(err, "MÃ_LỖI")` để rẽ nhánh xử lý nghiệp vụ theo mã lỗi cụ thể.
   - Dùng `getFieldErrors(err)` để gắn lỗi validate vào từng field của form.
   - Hiển thị `err.message` thân thiện lên UI/toast.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Mất mạng / Timeout | Không có HTTP response (`err.response` undefined) | Chuẩn hoá thành mã `SERVICE_UNAVAILABLE` hoặc `NETWORK_ERROR`, status 503/0 |
| Server trả HTML lỗi 500 từ proxy | Body không phải JSON hoặc thiếu `code` | Chuẩn hoá thành mã `INTERNAL_ERROR`, status tương ứng, message thân thiện |
| Phản hồi lỗi chuẩn `AppError` | Body có `{ code, message, details? }` | Giữ nguyên `code`, `message`, `status` và `details` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-AEC-01` | Client bắt lỗi theo **mã lỗi** (`isApiError(err, "CODE")`), NEVER so sánh chuỗi `message` | Tuân thủ `BR-ERR-06`; chuỗi thông báo có thể đổi cho UX nhưng mã lỗi bất biến |
| `BR-AEC-02` | Mọi request gọi API từ client phải qua interceptor chuẩn hoá về `ApiErrorShape` | Ngăn chặn rò rỉ cấu trúc `FetchError` không đồng nhất vào UI components |
| `BR-AEC-03` | Validation errors phải trích xuất được dạng `Record<string, string>` qua `getFieldErrors(err)` | Giúp form hiển thị lỗi cạnh đúng field mà không cần parse thủ công |
| `BR-AEC-04` | Admin SPA gọi API bằng `useApiClient` tuyệt đối, credentials include và x-csrf-token | Bảo vệ session và CSRF trên origin độc lập (`admin.{domain}`) |
| `BR-AEC-05` | Không hiển thị stack trace, mã lỗi kỹ thuật hoặc ID nội bộ lên bề mặt người dùng cuối | Tuân thủ `BR-ERR-03` và `BR-ERR-04` |

## 7. Data Contracts

### `ApiErrorShape<T = unknown>`

```ts
export interface ApiErrorShape<T = unknown> {
  readonly code: string;
  readonly message: string;
  readonly status: number;
  readonly details?: T;
}
```

### Client Helper Functions (`packages/errors/src/client.ts`)

- `normalizeApiError(error: unknown): ApiErrorShape`: Chuẩn hoá mọi loại lỗi (FetchError, Error, string) thành `ApiErrorShape`.
- `isApiError(error: unknown, code?: string): error is ApiErrorShape`: Type guard xác định lỗi API và khớp mã lỗi tuỳ chọn.
- `isApiErrorCode<C extends ErrorCode>(error: unknown, code: C)`: Khớp mã lỗi có kiểm tra compile-time enum.
- `getFieldErrors(error: unknown): Record<string, string>`: Trích xuất lỗi field validation `{ path: message }`.

## 8. Acceptance criteria

- [x] Package `@mindkid/errors/client` cung cấp đầy đủ các helper functions không phụ thuộc Nuxt/h3.
- [x] `useApi()` trong `apps/web` và `useApiClient()` trong `apps/admin` sử dụng thống nhất `normalizeApiError`.
- [x] 100% test unit của `useApi` và `normalizeApiError` pass xanh.
