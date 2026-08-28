---
spec: RATE-LIMITING
title: Giới hạn tần suất
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-13
owns:
  - Bảng giới hạn theo route
  - Hai trục IP và account
depends_on:
  - ERROR-CODES
  - AUTH-TOKENS-SESSIONS
---

# Giới hạn tần suất

## 1. Objective

Chặn brute force, quét diện rộng, và lạm dụng tài nguyên đắt (upload, export, ingest event)
trên một instance t3.small.

Hai trục, không phải một: **khoá theo account** chặn nhắm mục tiêu; **giới hạn theo IP**
chặn quét diện rộng. Chỉ một trục thì trục còn lại là lỗ hổng.

## 2. Actors

| Actor | Trục áp |
|---|---|
| Guest | IP + `tm_did` |
| User | IP + `user_id` |
| Manager | IP + `manager_id`, hạn mức rộng hơn |

## 3. Entry points

Middleware trước mọi route. `packages/cache` bọc `rate-limiter-flexible` trên một singleton
`ioredis`; app không import package nền và không tạo kết nối Valkey theo request.

## 4. Main flow

1. Middleware suy `route_class` từ path.
2. Kiểm bucket theo **IP** và theo **account** (nếu đã đăng nhập).
3. Với route chưa xác thực, account key là HMAC của định danh đã normalize; không đưa email
   hay identifier thô vào key Valkey/log.
4. Vượt bất kỳ trục nào → **429** kèm `Retry-After`.
5. Ghi log; vượt lặp lại nhiều lần → alert.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Valkey mất | **Fail open** cho route thường, **fail closed** cho auth và thanh toán |
| Sau CDN/proxy | Lấy IP từ header tin cậy đã cấu hình, không tin `X-Forwarded-For` thô |
| Đăng nhập sai liên tiếp | Khoá account tạm, tăng dần |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RTL-01` | Route nhạy cảm giới hạn theo **cả hai trục** | Một trục là một lỗ hổng |
| `BR-RTL-02` | Valkey mất → **fail closed** cho auth và thanh toán | Mất giới hạn ở đúng chỗ nguy hiểm nhất là không chấp nhận được |
| `BR-RTL-03` | 429 kèm `Retry-After` | Client cần biết chờ bao lâu |
| `BR-RTL-04` | Cấm — **NEVER lấy IP từ `X-Forwarded-For` thô** | Header giả được |
| `BR-RTL-05` | Đăng nhập sai → khoá tài khoản **tăng dần**, không khoá vĩnh viễn | Khoá vĩnh viễn là DoS lên người dùng thật |
| `BR-RTL-06` | Ingest event có hạn mức riêng, rộng hơn | Trẻ chơi liên tục là hành vi bình thường |
| `BR-RTL-07` | Thông báo 429 không tiết lộ tài khoản tồn tại | Tiết lộ là cho kẻ tấn công biết email nào đã đăng ký, rút ngắn bước quét tiếp theo |
| `BR-RTL-08` | Mọi consume/penalty/block đi qua `rate-limiter-flexible` trong `packages/cache` và dùng singleton `ioredis`; Cấm — **NEVER** tự ghép `INCR` + `EXPIRE` hay tạo Redis client theo request | Hai lệnh rời có thể mất TTL khi tiến trình chết; nhiều client theo request làm cạn connection trên t3.small |
| `BR-RTL-09` | Key account chưa xác thực là HMAC của identifier đã normalize; Cấm — **NEVER** để email/identifier thô trong Valkey key, metric hay log | Redis key và log vận hành không được trở thành kho PII phụ |
| `BR-RTL-10` | Mọi path `/api/*` giải ra đúng một lớp ở §7.2, hoặc một lý do miễn **đã liệt kê**; Cấm — **NEVER** để nhánh mặc định không giới hạn | Một lớp khai trong registry mà không route nào gọi là hạn mức trên giấy |
| `BR-RTL-11` | IP client lấy từ `X-Real-IP` chỉ khi peer nằm trong `TRUSTED_PROXY_IPS`, còn lại dùng địa chỉ socket | Sau nginx, địa chỉ socket là loopback — trục IP sụp thành một bucket toàn cục và một người khoá được cả site |

## 7. Data

### 7.1 Hạn mức theo lớp

Bảng này là bản sao của `RATE_LIMIT_CONFIGS` trong `packages/shared/src/rate-limiting.ts`.
Cổng giữ hai bên trùng nhau: `packages/shared/tests/rate-limiting-registry.test.ts`.

| Route class | IP | Account | Cửa sổ | Fail mode |
|---|---:|---:|---|---|
| `auth:login` | 20 | 5 | 15 phút | closed |
| `auth:register` | 10 | — | 1 giờ | closed |
| `auth:forgot-password` | 10 | 3 | 1 giờ | closed |
| `auth:mfa` | 10 | 5 | 15 phút | closed |
| `auth:refresh` | 60 | 60 | 15 phút | closed |
| `auth:social-login` | 20 | — | 15 phút | closed |
| `auth:oauth:start` | 30 | — | 15 phút | closed |
| `auth:oauth:callback` | 30 | — | 15 phút | closed |
| `payment:create` | 20 | 5 | 1 giờ | closed |
| `payment:proof` | 20 | 10 | 1 giờ | closed |
| `upload:image` | 60 | 30 | 1 giờ | open |
| `export:data` | 5 | 1 | 24 giờ | open |
| `play:events` | 600 | 300 | 10 phút / phiên | open |
| `search` | 300 | 200 | 5 phút | open |
| `read:public` | 600 | — | 5 phút | open |
| `managers:*` | 600 | 600 | 5 phút | open |

`auth:refresh` là lớp cho đường khôi phục phiên bằng cookie remember-me. Bản trước của
spec gọi nó là `auth:remember`; tên đó không tồn tại trong registry và không route nào
tra được. Tên trong bảng giờ là tên thật trong code.

### 7.2 Ánh xạ route → lớp

`BR-RTL-10`: mọi path `/api/*` phải giải ra **đúng một** ô của bảng này. Không có nhánh
mặc định "không giới hạn" — một path không khớp luật nào rơi về `read:public`, là lớp
chặt nhất không cần trục account.

Luật đọc **theo thứ tự**, luật đầu tiên khớp thì thắng. Nguồn sự thật là
`resolveRateLimitRouteClass()` trong `packages/shared/src/rate-limit-routes.ts`.

| # | Path (method) | Kết quả | Vì sao |
|---|---|---|---|
| 1 | không bắt đầu bằng `/api/` | miễn — `not-api` | trang SSR và tài sản tĩnh; nginx đã chặn theo IP |
| 2 | 9 route auth **đang tự gọi**: `users/login` · `managers/login` · `users/register` · `users/forgot-password` · `users/social-login` · `managers/mfa` · `managers/mfa-setup` · `oauth/{p}/start` · `oauth/{p}/callback` | **trong route** | handler tự gọi vì trục account cần email trong body, middleware không đọc body |
| 2b | 6 route auth còn lại: `users/mfa` → `auth:mfa` · `users/mfa-recovery/verify` → `auth:mfa` · `users/reset-password` → `auth:forgot-password` · `users/verify-email` → `auth:forgot-password` · `verify-email-change` → `auth:forgot-password` · `oauth/providers` → `read:public` | lớp tương ứng | không handler nào tự giới hạn; `reset-password` là bề mặt dò mã đặt lại mật khẩu |
| 3 | `/api/users/auth/resend-verification` | **trong route** | như luật 2, `auth:forgot-password` |
| 4 | `/api/guest/webhooks/**` | miễn — `provider-webhook` | callback nhà cung cấp đã xác thực bằng chữ ký (`BR-APM-01`, SNS RSA); giới hạn theo IP sẽ rớt burst thật từ IP dùng chung của nhà cung cấp |
| 5 | `/api/guest/health` | miễn — `health-probe` | probe giám sát chạy mỗi phút, chặn nó là tự làm mù mình |
| 6 | `/api/{users,managers}/auth/restore` | `auth:refresh` | khôi phục phiên bằng remember-me |
| 7 | `/api/{users,managers}/auth/reauth` | `auth:login` | xác minh lại mật khẩu — cùng primitive, cùng mối đe doạ, nên **cùng bucket** với login |
| 8 | `POST /api/managers/images` | `upload:image` | lớp hẹp hơn thắng `managers:*` |
| 9 | `/api/managers/**` | `managers:*` | gồm cả `managers/exports/*` và `managers/audit-logs/export` |
| 10 | `POST /api/users/orders` | `payment:create` | |
| 11 | `POST /api/users/orders/{uuid}/proof` | `payment:proof` | |
| 12 | `POST /api/{users,guest}/play-sessions/{uuid}/events` | `play:events` | `BR-RTL-06` |
| 13 | `GET /api/users/ai/search` | `search` | tìm kiếm ngữ nghĩa, mỗi lần một lượt embedding |
| 14 | `GET /api/users/data-export`, `POST /api/users/exports` | `export:data` | hai đường xuất dữ liệu cá nhân trọn gói |
| 15 | `/api/guest/**` còn lại | `read:public` | |
| 16 | `/api/users/**` còn lại | miễn — `unclassified-user-route` | §11 câu hỏi 3 |
| 17 | còn lại | `read:public` | nhánh đáy, không phải nhánh mặc định im lặng |

Luật 16 là **lỗ đã biết, không phải quyết định đã chốt**: §7.1 không có lớp nào mô tả
traffic chung của người dùng đã đăng nhập. Ánh xạ tạm chúng vào `search` hay `read:public`
là bịa hạn mức, nên bảng ghi thẳng chúng là miễn và đẩy sang §11.

### 7.3 IP dùng để giới hạn

`BR-RTL-11`: IP client là `X-Real-IP` **chỉ khi** peer của kết nối nằm trong
`TRUSTED_PROXY_IPS`; mọi trường hợp khác dùng địa chỉ socket. Cấm — **NEVER** đọc
`X-Forwarded-For` thô ở bất kỳ đâu.

Vì sao cần: nginx là edge và proxy tới loopback (`infra/nginx/mindkid-proxy.conf:8`
đặt `X-Real-IP $remote_addr`). Nếu đọc `socket.remoteAddress`, mọi request trong
production đều mang IP `127.0.0.1` — trục IP sụp thành **một bucket toàn cục**, và 20 lần
đăng nhập sai của một người khoá cả site trong 15 phút.

`TRUSTED_PROXY_IPS` mặc định `127.0.0.1,::1` khi không khai, khớp cách triển khai hiện tại.

Khoá tăng dần khi sai đăng nhập: 5 lần → 1 phút · 10 → 5 phút · 15 → 30 phút · reset sau
24 giờ không sai.

## 8. API contract

429 body:

```json
{ "code": "RATE_LIMITED", "message": "Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít phút.", "details": { "retry_after_s": 60 } }
```

Header `Retry-After: 60`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-RTL-01 — hai trục cùng áp
  Given 50 lần đăng nhập sai từ một IP cho 50 email khác nhau
  Then IP bị giới hạn
  Given 10 lần đăng nhập sai cho một email từ 10 IP khác nhau
  Then account đó bị khoá tạm

Scenario: BR-RTL-02 — fail closed cho auth khi Valkey mất
  Given Valkey không truy cập được
  When gọi POST login
  Then trả 503
  And không xử lý đăng nhập

Scenario: BR-RTL-03 — 429 kèm Retry-After
  Given vượt hạn mức export
  Then trả 429 với header Retry-After

Scenario: BR-RTL-04 — không tin XFF thô
  When gửi request kèm X-Forwarded-For giả
  Then IP dùng để giới hạn lấy từ nguồn tin cậy đã cấu hình

Scenario: BR-RTL-06 — trẻ chơi liên tục không bị chặn
  Given một phiên chơi 30 phút gửi event đều đặn
  Then không request event nào bị 429

Scenario: BR-RTL-05 — khoá tăng dần rồi tự mở
  Given account bị khoá sau 5 lần sai
  When chờ hết cửa sổ
  Then đăng nhập đúng thành công

Scenario: BR-RTL-08 — limiter dùng primitive nguyên tử và một client
  When chạy song song nhiều request chạm cùng bucket
  Then số lần consume và TTL nhất quán theo rate-limiter-flexible
  And số kết nối ioredis không tăng theo số request

Scenario: BR-RTL-10 — không path nào rơi vào nhánh không giới hạn
  Given danh sách mọi file route trong apps/web/server/api
  When suy lớp cho từng path
  Then mỗi path trả về một lớp trong §7.1 hoặc một lý do miễn đã liệt kê
  And không path nào trả về undefined

Scenario: BR-RTL-11 — chỉ tin X-Real-IP sau proxy tin cậy
  Given TRUSTED_PROXY_IPS chứa 127.0.0.1
  When request đến từ socket 127.0.0.1 kèm X-Real-IP 203.0.113.9
  Then IP dùng để giới hạn là 203.0.113.9
  When request đến thẳng từ socket 198.51.100.4 kèm X-Real-IP 203.0.113.9
  Then IP dùng để giới hạn là 198.51.100.4
  And X-Forwarded-For không được đọc trong cả hai trường hợp

Scenario: BR-RTL-09 — key không chứa định danh thô
  Given login bằng email Parent@Example.com
  When đọc key Valkey và log rate-limit trong test
  Then không chuỗi nào chứa parent@example.com
```

## 10. Boundaries

**Always**
- Hai trục cho route nhạy cảm.
- `Retry-After` trong response.
- Lấy IP từ nguồn tin cậy đã cấu hình.
- Bọc `rate-limiter-flexible` trong `packages/cache`; tái dùng singleton `ioredis`.
- HMAC identifier trước khi tạo account key.
- Suy lớp từ path bằng `resolveRateLimitRouteClass()`, không rải hằng số lớp khắp route.

**Ask first**
- Đổi hạn mức của một route class.
- Thêm route class.

**Never**
- Fail open cho auth hoặc thanh toán.
- Tin `X-Forwarded-For` thô.
- Khoá tài khoản vĩnh viễn.
- Thông báo tiết lộ tài khoản tồn tại.
- `INCR` + `EXPIRE` tự ghép hoặc Redis client theo request.
- Email/identifier thô trong key hay log.
- Nhánh mặc định không giới hạn cho một path `/api/*`.
- Đọc `X-Real-IP` khi peer không nằm trong `TRUSTED_PROXY_IPS`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có dùng CAPTCHA cho đăng ký không? CAPTCHA bên thứ ba đụng ràng buộc tracking | Đăng ký P1 | P1 | người quyết |
| 2 | Hạn mức `play:events` đủ cho trẻ chơi nhanh không? Cần đo thực tế | Gameplay P1 | P1 | Studio UI |
| 3 | §7.1 không có lớp nào cho traffic chung của user đã đăng nhập (~130 route `/api/users/**` ngoài payment/export/play/search). Cần một lớp `users:*` với hạn mức đo được, hay giữ nguyên nginx 20r/s? | Luật 16 của §7.2 | P1 | người quyết |
