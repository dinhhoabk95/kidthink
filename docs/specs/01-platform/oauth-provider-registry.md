---
spec: OAUTH-PROVIDER-REGISTRY
title: Đăng ký nhà cung cấp OAuth
area: platform
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-13
owns:
  - Danh sách nhà cung cấp OAuth được phép
  - Hình dạng luồng authorization code + PKCE
  - Quy tắc quản lý client secret và redirect URI
  - Ánh xạ hồ sơ nhà cung cấp → field nội bộ
depends_on:
  - AUTH-TOKENS-SESSIONS
  - SCHEMA-IDENTITY-BILLING
  - ERROR-CODES
  - RATE-LIMITING
---

# Đăng ký nhà cung cấp OAuth

## 1. Objective

Một chỗ duy nhất định nghĩa **nhà cung cấp nào được phép**, cấu hình ra sao, và hồ sơ họ trả
về được ánh xạ thế nào vào `social_identities`.

[`../03-account/social-login.md`](../03-account/social-login.md) và
[`../03-account/social-account-linking.md`](../03-account/social-account-linking.md) đều gọi
xuống đây. Tách ra vì hai spec đó mô tả **outcome của người dùng**; file này mô tả **năng lực
nội bộ** mà cả hai dùng chung — copy cấu hình vào hai chỗ là để nó drift.

Danh sách nhà cung cấp là **danh sách đóng**. Một provider không có trong §7.1 không tồn tại
với hệ thống, kể cả khi biến môi trường của nó được đặt.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Dev | — | Đọc contract, thêm provider qua PR |
| Server runtime | — | Đọc cấu hình, dựng URL, đổi token |
| User · Guest | — | Cấm chạm trực tiếp. Đi qua hai spec `03-account/` |

## 3. Entry points

| Nơi | Ghi chú |
|---|---|
| `packages/auth/src/oauth/` | Registry + adapter `openid-client`; dựng URL, PKCE, đổi code, validate token, ánh xạ hồ sơ |
| `GET /api/guest/auth/oauth/{provider}/start` | Bắt đầu — dùng cho cả đăng nhập và liên kết |
| `GET /api/guest/auth/oauth/{provider}/callback` | Nhận `code` + `state` |
| `GET /api/guest/auth/oauth/providers` | Provider nào đang bật, để UI vẽ nút |

## 4. Main flow

1. Caller gọi `start` kèm `intent` (`login` \| `link`) và `return_to`.
2. Server sinh `state` ngẫu nhiên ≥32 byte và `code_verifier` (PKCE), lưu vào cookie ngắn hạn
   `tm_oauth` (HttpOnly, SameSite=Lax, TTL **10 phút**), kèm `intent` và `return_to`.
3. Redirect 302 tới `authorization_endpoint` của provider với `code_challenge` (S256).
4. Provider trả về `callback` kèm `code` + `state`.
5. Server đối chiếu `state` với cookie — lệch thì dừng, không đổi token.
6. Đổi `code` lấy token **ở server**, đọc hồ sơ, ánh xạ theo §7.2.
7. Trả `NormalizedProfile` cho spec gọi ([`social-login.md`](../03-account/social-login.md) hoặc [`social-account-linking.md`](../03-account/social-account-linking.md)) xử lý
   tiếp. File này **không** tạo user, không cấp phiên.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| `state` lệch hoặc thiếu | Cookie hết hạn, CSRF, hoặc mở lại link cũ | **400** `OAUTH_STATE_INVALID`, không đổi token |
| Provider trả `error=access_denied` | User bấm Huỷ ở màn hình provider | Redirect về `return_to` kèm cờ huỷ, không phải trang lỗi |
| Provider 5xx hoặc timeout | Sự cố phía họ | **502** `OAUTH_PROVIDER_ERROR`, log đầy đủ, thông báo tiếng Việt gợi ý dùng email/mật khẩu |
| Provider không trả email | Facebook cho phép tài khoản không có email | Vẫn tiếp tục — `email_at_provider = NULL`. Xem `BR-OAP-08` |
| Provider bị tắt cờ | `is_enabled = false` | **404** `OAUTH_PROVIDER_DISABLED` ở cả `start` và `callback` |
| `provider` không trong §7.1 | Path bịa | **404** `OAUTH_PROVIDER_DISABLED` — không phân biệt với "tắt" |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-OAP-01` | Chỉ **authorization code + PKCE (S256)**. Cấm — **NEVER implicit flow**, Cấm — NEVER nhận `id_token` gửi thẳng từ client | Token đi qua trình duyệt là token đã lộ. Client gửi `id_token` lên thì server không biết nó được cấp cho ai |
| `BR-OAP-02` | Đổi `code` lấy token **chỉ ở server**. Client secret Cấm — **NEVER** rời server | Secret trong bundle là secret công khai |
| `BR-OAP-03` | `state` ngẫu nhiên ≥32 byte, so khớp trước mọi thao tác; TTL **10 phút** | CSRF trên callback là cách gắn tài khoản nạn nhân vào SNS của kẻ tấn công |
| `BR-OAP-04` | `redirect_uri` lấy từ cấu hình server, so khớp **tuyệt đối**. Cấm — **NEVER dựng từ input người dùng**, không wildcard | Open redirect ở đây trả `code` cho tên miền của kẻ tấn công |
| `BR-OAP-05` | `return_to` phải nằm trong **whitelist đường dẫn nội bộ**; ngoài whitelist → về `/me` | Open redirect |
| `BR-OAP-06` | Provider là **danh sách đóng** §7.1. Thêm provider = sửa spec này + PR | Provider thêm lén không ai review được luồng đồng ý của nó |
| `BR-OAP-07` | Cấm — **NEVER lưu access token / refresh token của provider** | Ta không gọi API của họ sau khi đăng nhập. Token không lưu thì không rò được |
| `BR-OAP-08` | Email do provider trả về **không được coi là đã xác minh** trừ khi provider khẳng định tường minh, và nó **không bao giờ** tự khớp sang tài khoản sẵn có | [`social-login.md`](../03-account/social-login.md) `BR-SCL-04`. Facebook cho đổi email không cần xác minh lại |
| `BR-OAP-09` | Chỉ xin scope **tối thiểu**: định danh + email. Cấm — **NEVER xin bạn bè, ảnh, ngày sinh, danh bạ** | Thu tối thiểu — [`child-data-compliance.md`](../00-foundation/child-data-compliance.md). Scope thừa cũng làm màn hình đồng ý đáng sợ hơn |
| `BR-OAP-10` | `provider_user_id` là **khoá định danh duy nhất**, không phải email | Email đổi được; `sub` của provider thì không |
| `BR-OAP-11` | Cấm — **NEVER gửi bất kỳ dữ liệu trẻ em nào** tới provider — kể cả tên gọi hay `child_uuid` | `BR-CDC-05` `BR-CDC-06` |
| `BR-OAP-12` | Rate limit `start` và `callback` theo **IP và theo `provider_user_id`** | `BR-RTL-01`, hai trục |
| `BR-OAP-13` | Client secret đọc từ biến môi trường, kiểm **có mặt lúc startup**; thiếu → provider tự tắt, không crash app | Một provider hỏng không được kéo sập đăng nhập bằng email |
| `BR-OAP-14` | Cookie `tm_oauth` bị **xoá ngay** sau callback, thành công hay thất bại | State dùng lại được là state không bảo vệ gì |
| `BR-OAP-15` | Ảnh đại diện từ provider **không tải về, không lưu, không hiển thị** | Ảnh người lớn là PII ta không cần. Hotlink lên CDN của họ là rò referrer |
| `BR-OAP-16` | Discovery, PKCE, authorization URL, code exchange và validation dùng `openid-client` trong `packages/auth`; Cấm — **NEVER** tự viết OAuth/OIDC protocol primitive | Protocol auth tự viết dễ bỏ sót issuer, state, PKCE hoặc token validation; package đã có conformance test và security maintenance |

## 7. Data

**Đọc:** biến môi trường, `social_identities` (chỉ để trả về cho caller).
**Ghi:** không có. File này **không** ghi bảng nào — caller ghi.

### 7.1 Danh sách provider — đóng

| `provider` | Ưu tiên | Endpoint | Scope | Email đã xác minh? |
|---|:--:|---|---|---|
| `google` | 1 | OIDC discovery `accounts.google.com` | `openid email profile` | khi `email_verified = true` |
| `facebook` | 2 | Facebook Login v-hiện-hành | `public_profile email` | **không bao giờ** — họ không khẳng định |

Cấm Chưa có: Apple, Zalo, TikTok. Thêm = sửa file này (`BR-OAP-06`).

### 7.2 Ánh xạ hồ sơ

| Field nội bộ | Google | Facebook | Ghi chú |
|---|---|---|---|
| `provider_user_id` | `sub` | `id` | Bất biến, khoá định danh |
| `email_at_provider` | `email` | `email` (có thể vắng) | citext, nullable |
| `email_verified_at_provider` | `email_verified` | **luôn `false`** | `BR-OAP-08` |
| `display_name_at_provider` | `name` | `name` | Cắt còn 60 ký tự |
| avatar | — | — | Cấm Bỏ (`BR-OAP-15`) |

```ts
interface NormalizedProfile {
  provider: "google" | "facebook";
  provider_user_id: string;
  email_at_provider: string | null;
  email_verified_at_provider: boolean;
  display_name_at_provider: string;
}
```

### 7.3 Cấu hình mỗi provider

| Khoá | Nguồn |
|---|---|
| `client_id` · `client_secret` | Biến môi trường. Cấm — NEVER trong repo |
| `redirect_uri` | Dựng từ `NUXT_SITE_URL` + path cố định |
| `is_enabled` | Bật khi đủ `client_id` + `client_secret`; đảo được bằng cờ [`feature-flag-service.md`](feature-flag-service.md) |

## 8. API contract

### `GET /api/guest/auth/oauth/providers`

| | |
|---|---|
| Auth | không |
| 200 | `[{ provider, label_vi, is_enabled }]` — không có `client_id` |

### `GET /api/guest/auth/oauth/{provider}/start`

| | |
|---|---|
| Auth | không (`intent=link` cần cookie phiên hợp lệ) |
| Query | `intent` (`login`\|`link`) · `return_to` (đường dẫn nội bộ) |
| 302 | Tới provider; đặt cookie `tm_oauth` |
| 404 | `OAUTH_PROVIDER_DISABLED` |
| 429 | `RATE_LIMITED` |

### `GET /api/guest/auth/oauth/{provider}/callback`

| | |
|---|---|
| Auth | cookie `tm_oauth` |
| Query | `code` · `state` — hoặc `error` |
| 302 | Bàn giao cho [`social-login.md`](../03-account/social-login.md) (đăng nhập) hoặc [`social-account-linking.md`](../03-account/social-account-linking.md) (liên kết) |
| 400 | `OAUTH_STATE_INVALID` |
| 404 | `OAUTH_PROVIDER_DISABLED` |
| 502 | `OAUTH_PROVIDER_ERROR` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-OAP-01 — không có implicit flow
  When quét mọi lời gọi tới authorization endpoint
  Then mọi lời gọi mang response_type=code
  And mang code_challenge_method=S256
  And không route nào nhận id_token từ body do client gửi

Scenario: BR-OAP-03 — state lệch bị chặn trước khi đổi token
  Given cookie tm_oauth mang state S
  When callback đến với state khác S
  Then trả 400 OAUTH_STATE_INVALID
  And không request nào được gửi tới token endpoint của provider

Scenario: BR-OAP-04 — redirect_uri không nhận từ input
  When gọi start kèm query redirect_uri=https://evil.example
  Then URL gửi tới provider vẫn dùng redirect_uri từ cấu hình server

Scenario: BR-OAP-05 — return_to ngoài whitelist bị bỏ
  When gọi start kèm return_to=https://evil.example
  Then sau callback người dùng về /me
  And không có redirect ra ngoài tên miền

Scenario: BR-OAP-07 — không lưu token của provider
  Given một lần đăng nhập Google thành công
  When đọc mọi bảng trong schema
  Then không cột nào chứa access token hay refresh token của provider

Scenario: BR-OAP-08 — Facebook không bao giờ được coi là email đã xác minh
  Given Facebook trả email a@example.com
  When ánh xạ hồ sơ
  Then email_verified_at_provider là false

Scenario: BR-OAP-09 — scope tối thiểu
  When đọc URL authorization của cả hai provider
  Then scope chỉ gồm định danh và email
  And không có scope bạn bè, ảnh, ngày sinh, hay danh bạ

Scenario: BR-OAP-13 — thiếu secret thì tắt provider, không sập app
  Given biến môi trường client_secret của facebook không được đặt
  When app khởi động
  Then app chạy bình thường
  And GET providers trả facebook với is_enabled = false
  And GET /api/guest/auth/oauth/facebook/start trả 404

Scenario: BR-OAP-14 — cookie state dùng một lần
  Given một callback đã xử lý xong
  When gửi lại đúng callback đó
  Then trả 400 OAUTH_STATE_INVALID

Scenario: BR-OAP-15 — không lưu ảnh đại diện
  Given provider trả picture URL
  When đọc hàng social_identities
  Then không cột nào chứa URL ảnh

Scenario: BR-OAP-16 — protocol primitive không tự viết
  When quét packages/auth/src/oauth
  Then discovery, PKCE, authorization URL và code exchange đi qua openid-client
  And không có implementation PKCE hay parse token response tự viết
```

## 10. Boundaries

**Always**
- Authorization code + PKCE S256.
- Đổi token ở server.
- So khớp `state`, xoá cookie sau callback.
- `redirect_uri` từ cấu hình, so khớp tuyệt đối.
- Scope tối thiểu.
- Rate limit hai trục.
- Mọi protocol primitive OAuth/OIDC đi qua `openid-client` trong `packages/auth`.

**Ask first**
- Thêm provider mới vào §7.1.
- Thêm scope.
- Đổi TTL cookie `tm_oauth`.

**Never**
- Implicit flow, hay nhận `id_token` từ client.
- Client secret rời server.
- Lưu token của provider.
- Dựng `redirect_uri` từ input người dùng.
- Coi email của provider là đã xác minh khi họ không khẳng định.
- Gửi dữ liệu trẻ em tới provider.
- Lưu hay hiển thị ảnh đại diện từ provider.
- Tự viết PKCE, discovery, code exchange hay token validation.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Zalo có nên là provider thứ ba không? Thị phần VN cao, nhưng luồng đồng ý và tài liệu khác hẳn hai provider hiện có | Sau P1 | P2 | hoãn — thêm provider là sửa §7.1 qua PR |
| ~~2~~ | ~~Apple Sign-In bắt buộc nếu lên App Store — có làm PWA/native ở P5 không?~~ **Đóng 2026-08-11 (`D-NM`, triển khai D11)**: không có native app/App Store trong scope hiện hành. PWA là web delivery và không tạo yêu cầu Apple Sign-In. | — | Đã đóng | D-NM |
