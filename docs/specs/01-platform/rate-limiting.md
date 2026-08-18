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

## 7. Data

| Route class | IP | Account | Cửa sổ |
|---|---:|---:|---|
| `auth:login` | 20 | 5 | 15 phút |
| `auth:register` | 10 | — | 1 giờ |
| `auth:forgot-password` | 10 | 3 | 1 giờ |
| `auth:mfa` | 10 | 5 | 15 phút |
| `auth:remember` | 60 | 60 | 15 phút |
| `payment:create` | 20 | 5 | 1 giờ |
| `payment:proof` | 20 | 10 | 1 giờ |
| `upload:image` | 60 | 30 | 1 giờ |
| `export:data` | 5 | 1 | 24 giờ |
| `play:events` | 600 | 300 | 10 phút / phiên |
| `search` | 300 | 200 | 5 phút |
| `read:public` | 600 | — | 5 phút |
| `managers:*` | 600 | 600 | 5 phút |

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

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có dùng CAPTCHA cho đăng ký không? CAPTCHA bên thứ ba đụng ràng buộc tracking | Đăng ký P1 | P1 | người quyết |
| 2 | Hạn mức `play:events` đủ cho trẻ chơi nhanh không? Cần đo thực tế | Gameplay P1 | P1 | Studio UI |
