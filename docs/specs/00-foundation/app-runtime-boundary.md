---
spec: APP-RUNTIME-BOUNDARY
title: Ranh giới runtime giữa web và admin
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-30
owns:
  - Topology runtime của apps/web và apps/admin
  - Quyền sở hữu route API và cách admin SPA gọi API
  - CORS và security header ở ranh giới admin subdomain
depends_on:
  - AUTH-TOKENS-SESSIONS
  - ADMIN-AUTH
  - ENV-CONTRACT
---

# Ranh giới runtime giữa web và admin

## 1. Objective

`apps/web` là một Nuxt server duy nhất phục vụ SSR end-user và toàn bộ API. `apps/admin` là
SPA tĩnh được phát hành lên `admin.{domain}` và không có runtime server riêng. Ranh giới này
giảm số tiến trình có quyền đọc dữ liệu nghiệp vụ, đồng thời làm cho một API có đúng một owner.
Manager vẫn dùng opaque session của `nuxt-auth-utils`; admin SPA chỉ là client của API trên
`{domain}`.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| User | `requireUserAuth()` | Gọi API User trên `{domain}` |
| Manager | `requireManagerAuth()` và role phù hợp | Gọi API Manager từ admin SPA qua `{domain}` |
| Proxy | Quyền đọc file tĩnh và chuyển tiếp API | Phục vụ admin asset, đặt header, proxy API về web |
| Worker | Quyền vận hành job | Không phục vụ HTTP và không sở hữu API |

## 3. Entry points

| Nơi | Actor | Ghi chú |
|---|---|---|
| `{domain}` | User, Guest, Manager | `apps/web`: SSR, public pages và `/api/**` |
| `admin.{domain}` | Manager | File tĩnh sinh từ `apps/admin/.output/public` |
| `NUXT_PUBLIC_API_BASE_URL` | Admin build | Base URL tuyệt đối của API trên `{domain}` |
| `NUXT_ALLOWED_ORIGINS` | Web runtime | Allowlist origin của admin SPA |

## 4. Main flow

1. Build `apps/web` thành Nitro server và build `apps/admin` bằng `nuxt generate` thành file tĩnh.
2. Proxy phục vụ `apps/admin/.output/public` cho `admin.{domain}` và không khởi động Node cho
   subdomain này.
3. Admin client dựng URL API từ `runtimeConfig.public.apiBaseUrl`, gửi `credentials: "include"`
   và gửi `x-csrf-token` cho mutation.
4. Proxy chuyển `/api/**` của `{domain}` vào `apps/web`; web chọn auth namespace theo path.
5. Web trả CORS chỉ cho origin trong allowlist và trả security header của API.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Admin gọi URL tương đối | `$fetch("/api/...")` trong `apps/admin/app/**` | Bị gate từ chối; request không được trỏ về static host |
| Origin không allowlist | Origin không phải `{domain}` hoặc `admin.{domain}` đã cấu hình | Preflight và request bị từ chối bằng `CSRF_INVALID` |
| Cookie User trên Manager route | Cookie session User hợp lệ nhưng path là `/api/managers/**` | Không thử namespace còn lại; trả 401 |
| Route guest cần danh tính User | Path `/api/guest/**` có cookie session User hợp lệ | Middleware vẫn resolve namespace `user`; liên kết OAuth (`BR-SLK-01`) giữ được identity |
| API trùng owner | Cùng path `/api/**` xuất hiện ở hai app | Gate fail trước merge |
| Admin có server code | Có file dưới `apps/admin/server/` | Gate fail và static build không được chấp nhận |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ARB-01` | `apps/admin` Cấm có thư mục `server/`; build phải tạo public asset tĩnh | Admin subdomain không được có tiến trình Node hoặc quyền server riêng |
| `BR-ARB-02` | Mọi route `/api/**` do `apps/web` sở hữu; một path chỉ có một implementation | Một API owner tránh route drift và quyết định auth không nhất quán |
| `BR-ARB-03` | `admin.{domain}` Cấm có Node process đứng sau proxy | Static hosting làm giảm blast radius khi admin client bị compromise |
| `BR-ARB-04` | Admin client dùng base URL từ runtime config và `credentials: "include"`; Cấm URL API tương đối | Cookie session phải được gửi tới web API, không gửi nhầm static host |
| `BR-ARB-05` | CORS của web là allowlist origin tường minh; Cấm `*` khi có credentials | Browser không cho wildcard kết hợp credentials và wildcard làm mở rộng trust boundary |
| `BR-ARB-06` | Auth namespace được chọn theo path prefix: `/api/managers/**` là namespace `manager`, mọi path `/api/**` còn lại là namespace `user`, ngoài `/api/**` không resolve gì; mỗi request chỉ set một trong `context.user` hoặc `context.manager` | User cookie không được biến thành Manager authority và ngược lại, nhưng route guest vẫn cần đọc được danh tính User |
| `BR-ARB-07` | Security header của `admin.{domain}` do proxy đặt | Static SPA không có server runtime để bảo đảm header trên mọi response |

## 7. Data

**Đọc:** file tĩnh của admin, runtime config public của admin, cookie session opaque và CSRF
cookie ở web API.

**Ghi:** không ghi database từ admin client; mutation đi qua REST API của `apps/web`.

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `apiBaseUrl` | URL | Absolute URL, trỏ tới `{domain}`, không chứa credential |
| `origin` | URL origin | Phải nằm trong allowlist web |
| `namespace` | enum | `user` hoặc `manager`, suy ra từ path |
| `adminBuild` | public asset tree | Không chứa `server/` bundle |

## 8. API contract

### `GET /api/managers/auth/session`

| | |
|---|---|
| Auth | Cookie Manager opaque session; middleware web resolve namespace `manager` |
| Response | `{ manager, csrf_token }` |
| 401 | `UNAUTHENTICATED` — không có Manager session hoặc cookie User |
| 403 | `CSRF_INVALID` — origin ngoài allowlist khi request bị kiểm origin |

### `OPTIONS /api/**`

| | |
|---|---|
| Auth | Không cần session |
| Response | Chỉ trả preflight nếu origin, method và header nằm trong allowlist |
| 403 | `CSRF_INVALID` — origin không được phép |

## 9. Acceptance criteria

```gherkin
Scenario: BR-ARB-01 — admin không có server directory
  Given source tree có một file dưới apps/admin/server/
  When chạy gate runtime boundary
  Then gate fail và nêu BR-ARB-01

Scenario: BR-ARB-02 — API chỉ có một owner
  Given cùng một route /api/managers/x tồn tại trong apps/admin và apps/web
  When chạy gate runtime boundary
  Then gate fail và nêu cả hai file

Scenario: BR-ARB-04 — admin không gọi API bằng URL tương đối
  Given apps/admin/app có $fetch("/api/managers/x")
  When chạy gate runtime boundary
  Then gate fail và nêu BR-ARB-04

Scenario: BR-ARB-05 — CORS credential không dùng wildcard
  Given admin origin nằm trong NUXT_ALLOWED_ORIGINS
  When web trả preflight có credentials
  Then Access-Control-Allow-Origin là origin cụ thể
  And không phải "*"

Scenario: BR-ARB-06 — middleware thật chọn Manager namespace
  Given request /api/managers/dashboard có Manager session cookie hợp lệ
  When request đi qua middleware web thật từ origin admin
  Then context.manager có identity và context.user không tồn tại
  And handler trả 200

Scenario: BR-ARB-06 — route guest vẫn giữ danh tính User
  Given request /api/guest/auth/oauth/google/start?intent=link có cookie session User hợp lệ
  When request đi qua middleware web thật
  Then context.user có identity và context.manager không tồn tại

Scenario: BR-ARB-06 — User cookie không được thử lại dưới Manager namespace
  Given request /api/managers/dashboard chỉ có User session cookie hợp lệ
  When request đi qua middleware web thật
  Then handler trả 401

Scenario: BR-ARB-05 — origin lạ bị từ chối
  Given request Manager đến từ origin ngoài allowlist
  When web kiểm tra origin
  Then trả `CSRF_INVALID`

Scenario: BR-ARB-07 — proxy phục vụ admin tĩnh
  Given proxy template được render
  When kiểm block admin
  Then block có `root` và `try_files`
  And block không có `reverse_proxy`
```

## 10. Boundaries

**Always**

- Đọc auth, env và admin spec trước khi đổi topology.
- Đặt API implementation trong `apps/web/server/api/`.
- Dùng absolute API base URL, credentials và CSRF header ở admin client.

**Ask first**

- Đổi host, domain, cookie name hoặc session password.
- Đổi proxy implementation hoặc chuyển rate limit ra khỏi Nginx.
- Thêm dependency cho auth, CORS hoặc static hosting.

**Never**

- Không tạo `apps/admin/server/`.
- Không chạy Node process cho `admin.{domain}`.
- Không dùng CORS wildcard với credentials.
- Không thêm JWT hoặc refresh token first-party cho browser auth.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Màn hình login Manager sẽ được sở hữu bởi admin SPA hay web trong một task riêng? | Chặn UX login hoàn chỉnh, không chặn boundary runtime | P0 | Infra |
| 2 | Khi rate limit chuyển khỏi proxy, có đảo verdict sang Caddy không? | Chặn quyết định đổi web server, không chặn topology hiện tại | P1 | Infra |
