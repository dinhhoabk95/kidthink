---
spec: AUTH-TOKENS-SESSIONS
title: Token, cookie và vòng đời phiên
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-08-09
owns:
  - Hình dạng JWT và audience
  - Thuộc tính cookie
  - Vòng đời refresh và thu hồi
  - Quy tắc xác minh lại danh tính (reauth) cho thao tác nhạy cảm
depends_on:
  - ACTORS
  - ERROR-CODES
  - REPO-BOOTSTRAP
---

# Token, cookie và vòng đời phiên

## 1. Objective

**Cập nhật 2026-08-09** (quyết định package, xem
[`repo-bootstrap.md`](../00-foundation/repo-bootstrap.md) §7.1): lớp **access** dùng JWT 15
phút do backend ký bằng `jose`; `@sidebase/nuxt-auth` Local provider quản lý trạng thái auth
phía Nuxt và gọi các endpoint backend canonical. Lớp **refresh** vẫn là cookie opaque,
path-scoped, chỉ lưu hash trong `active_sessions` và xoay mỗi lần dùng. Local provider không
cung cấp CSRF như AuthJS, nên double-submit CSRF vẫn là contract tự quản của backend.

OAuth Google/Facebook ở P1 không đổi app sang AuthJS. Backend OAuth bridge hoàn tất
Authorization Code + PKCE rồi phát cùng access/refresh token pair của local flow. Cấm
Supabase Auth, Better-Auth, Sidebase AuthJS và `next-auth`.

Hai namespace **tách biệt hoàn toàn** — tên cookie, issuer, audience và secret ký khác nhau
giữa `apps/web` (User) và `apps/admin` (Manager). Token của User không bao giờ mở được bề mặt
Manager và ngược lại.

## 2. Actors

| Actor | Token | MFA | Cách xác thực yếu tố thứ nhất |
|---|---|---|---|
| User | `aud: "kidthink:user"` | Tuỳ chọn, P2 — [`../03-account/mfa.md`](../03-account/mfa.md) | Mật khẩu **hoặc** SNS — [`../03-account/social-login.md`](../03-account/social-login.md) |
| Manager | `aud: "kidthink:manager"` | bắt buộc | Mật khẩu. Cấm — **NEVER SNS** (`BR-AUT-15`) |
| Guest | không token, chỉ cookie thiết bị | — | — |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/auth/` | Sở hữu domain claim, ký/xác minh JWT bằng `jose`, refresh rotation, CSRF, hash mật khẩu; `otpauth` phục vụ TOTP Manager |
| `apps/web/nuxt.config.ts`, `apps/admin/nuxt.config.ts` | Khai `@sidebase/nuxt-auth` Local provider với endpoint/cookie namespace riêng; không export type vendor |
| `apps/web/server/middleware/auth.ts`, `apps/admin/server/middleware/auth.ts` | Xác minh JWT access **một lần** mỗi request, gắn `event.context`; guard đọc context đồng bộ |
| `POST /api/guest/auth/{users\|managers}/login` | Pre-auth |
| `POST /api/{users\|managers}/auth/refresh` | Post-auth, path-scoped cookie |
| `POST /api/{users\|managers}/auth/logout` | |

## 4. Main flow

1. Login thành công (User: mật khẩu **hoặc** SNS; Manager: mật khẩu **+ TOTP bắt buộc**) →
   ghi hàng `active_sessions` (`refresh_token_hash`, thiết bị, IP) → backend phát JWT access
   15 phút có `sid` và refresh token opaque.
2. Sidebase Local nhận access token theo `signInResponseTokenPointer`, lưu vào cookie access
   `HttpOnly`; backend đặt refresh cookie opaque `HttpOnly`, path-scoped và không trả refresh
   token trong JSON.
3. Đặt 3 cookie: access JWT (`HttpOnly`), refresh opaque (`HttpOnly`, path-scoped) và csrf
   double-submit (không `HttpOnly`).
4. Mỗi request: middleware xác minh chữ ký, `issuer`, **audience** và expiry đúng một lần,
   sau đó gắn context domain.
5. Access hết hạn → Sidebase Local gọi endpoint refresh; backend so hash refresh token,
   **xoay** hàng `active_sessions`, đặt refresh cookie mới và trả access token mới.
6. Logout → xoá hàng `active_sessions` và xoá cả ba cookie đúng namespace.

Manager qua MFA: bước 1 chỉ chạy sau khi TOTP xác minh thành công. Bước mật khẩu chỉ cấp
challenge credential một mục đích, TTL ngắn; credential này không phải access token, không
qua guard và không tạo `active_sessions` (§5).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Refresh token đã dùng lại (token reuse) | **Thu hồi toàn bộ phiên** của tài khoản đó, buộc đăng nhập lại. Dấu hiệu bị đánh cắp |
| `refresh_token_version` lệch | `SESSION_REVOKED` 401 |
| Đổi mật khẩu | `refresh_token_version` **+1** → mọi phiên khác chết |
| Manager chưa qua MFA | `MFA_REQUIRED` 428. **Không** tạo access token/`active_sessions` — client gửi mã TOTP kèm challenge credential một mục đích để hoàn tất |
| Token sai audience | **401**, không phải 403 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-AUT-01` | Verify **audience** tường minh, không chỉ chữ ký | Cùng khoá ký thì token namespace này dùng được ở namespace kia |
| `BR-AUT-02` | Guard là hàm **sync**, đọc `event.context`. Cấm — NEVER `await requireUserAuth()` | Guard trả Promise mời quên `await`, và quên `await` nghĩa là không có guard |
| `BR-AUT-03` | Refresh cookie **path-scoped** tới đúng route refresh | Refresh token không được gửi kèm mọi request |
| `BR-AUT-04` | Refresh token **xoay** mỗi lần dùng; tái dùng → thu hồi toàn bộ phiên | Phát hiện token bị đánh cắp |
| `BR-AUT-05` | `refresh_token_version` **+1** khi đổi mật khẩu và khi thu hồi phiên | Đổi mật khẩu mà refresh token cũ vẫn dùng được thì việc đổi không đuổi được kẻ đã vào. Version là cách vô hiệu hoá **mọi** token đã phát bằng một phép ghi, không phải đi xoá từng hàng |
| `BR-AUT-06` | CSRF token **không** HttpOnly, gửi qua header `x-csrf-token` trên **mọi** route đổi trạng thái | Cookie phiên tự động đi kèm request từ site khác; header thì không. Token phải đọc được bằng JS để gắn vào header — đó là lý do nó cố ý **không** HttpOnly, khác với cookie phiên |
| `BR-AUT-07` | JWT **không** chứa entitlement hay vai trò của User | Năng lực đọc từ DB — thu hồi phải có hiệu lực ngay |
| `BR-AUT-08` | Mật khẩu hash bằng **argon2id**; không bcrypt, không MD5/SHA | MD5/SHA là hash **nhanh** — chính thứ giúp kẻ có DB dò tỉ tổ hợp mỗi giây. argon2id tốn cả bộ nhớ nên GPU/ASIC không nhân được thông lượng; bcrypt chậm nhưng không tốn bộ nhớ và trần 72 byte |
| `BR-AUT-09` | Rate limit đăng nhập theo **IP và theo account** — hai trục | Khoá account chặn nhắm mục tiêu; giới hạn IP chặn quét diện rộng |
| `BR-AUT-10` | Thông báo lỗi đăng nhập không tiết lộ tài khoản tồn tại; thời gian phản hồi không lệch | Enumeration email |
| `BR-AUT-11` | Manager không có endpoint đăng ký công khai | Manager là tài khoản vận hành, tạo bằng seed/mời từ super admin. Một route đăng ký công khai — kể cả có duyệt phía sau — là bề mặt để tự tạo tài khoản chờ leo quyền, và nó không mua lại được lợi ích gì vì số Manager đếm trên đầu ngón tay |
| `BR-AUT-12` | Cookie Manager giới hạn domain `admin.{domain}` | Tách bề mặt |
| `BR-AUT-13` | Thao tác nhạy cảm §7.4 cần **reauth trong 5 phút**. Phiên hợp lệ một mình **không đủ** | Phiên bị chiếm không được đổi khoá vào tài khoản. Đây là ranh giới giữa "đọc được dữ liệu" và "chiếm vĩnh viễn" |
| `BR-AUT-14` | Reauth chấp nhận **bất kỳ** cách nào ở §7.4, không cứng mật khẩu | `password_hash` nullable từ `BR-AUT-16`. Ép mật khẩu làm tài khoản chỉ-SNS không đổi được cài đặt nào |
| `BR-AUT-15` | Manager **cấm đăng nhập bằng SNS** | Bề mặt quản trị không nhận danh tính từ bên thứ ba. Một sự cố ở provider không được thành sự cố quản trị của ta |
| `BR-AUT-16` | `users.password_hash` **nullable**. Tài khoản chỉ có SNS là hợp lệ | `BR-SCL-08`. Bất biến thay thế: `login_methods ≥ 1` (`BR-SLK-04`) |
| `BR-AUT-17` | SNS là yếu tố **thứ nhất**, không phải yếu tố thứ hai. MFA đã bật thì vẫn phải qua | `BR-SCL-07`. "Đã đăng nhập Google" không chứng minh gì về thiết bị thứ hai |
| `BR-AUT-18` | Cấm — **NEVER lưu token của nhà cung cấp OAuth** trong `active_sessions` hay bất kỳ bảng nào | `BR-OAP-07` |

## 7. Data

### 7.1 JWT access payload

```ts
interface UserAccessPayload {
  sub: string;
  aud: "kidthink:user";
  iss: "kidthink:web";
  sid: string;
  name: string;
  ver: number;
  active_child_id?: number;
  iat: number;
  exp: number;
}
interface ManagerAccessPayload {
  sub: string;
  aud: "kidthink:manager";
  iss: "kidthink:admin";
  sid: string;
  name: string;
  ver: number;
  role: ManagerRole;
  iat: number;
  exp: number;
}
```

JWT ký HS256 bằng secret tối thiểu 32 byte, secret riêng từng app. `sid` là ID opaque của
`active_sessions`; không phải refresh token. `ver` = `refresh_token_version` và chỉ so với DB
ở endpoint refresh, không mỗi request. JWT access không chứa entitlement, package, tier,
provider token, refresh token hoặc dữ liệu trẻ ngoài candidate `active_child_id`.

### 7.2 Cookie

| Cookie | Cơ chế | HttpOnly | SameSite | Path | TTL |
|---|---|:--:|---|---|---|
| `kidthink-user-access` / `kidthink-manager-access` | Sidebase Local lưu JWT backend phát; secret ký riêng mỗi app | | Lax | `/` | 15 phút |
| `tm_u_rt` | Cookie opaque backend đặt, hash so `active_sessions` | | Strict | `/api/users/auth/refresh` | 7 ngày |
| `tm_m_rt` | Cookie opaque backend đặt, hash so `active_sessions` | | Strict | `/api/managers/auth/refresh` | 24 giờ |
| `tm_u_csrf` / `tm_m_csrf` | Tự đặt | Cấm | Strict | `/` | 7 ngày |
| `active_child_id` | Tự đặt | Cấm | Lax | `/` | 30 ngày |
| `tm_did` (guest) | Tự đặt | Cấm | Lax | `/` | 1 năm |

Mọi cookie `Secure` ở production. Cookie session **không đặt thuộc tính `Domain`** — mặc định
host-only, nên `admin.{domain}` và `{domain}` tự động không chia sẻ được cookie của nhau
(RFC 6265), cộng thêm issuer, audience và secret ký khác nhau (nhiều lớp kiểm soát độc lập).

### 7.3 `active_sessions`

`(account_type, account_id)` · `refresh_token_hash` · `device_label` · `ip_address` ·
`auth_method` (`password`\|`social`) · `reauth_at` · `created_at` · `last_used_at` ·
`expires_at`.

Polymorphic → **bắt buộc** integration test bắt orphan `account_id`.

### 7.4 Reauth — xác minh lại danh tính

Cửa sổ **5 phút** tính từ `active_sessions.reauth_at`. Quá hạn → **428** `REAUTH_REQUIRED`,
`details.methods[]` liệt kê cách nào dùng được cho tài khoản đó.

**Cách reauth được chấp nhận** — bất kỳ một cách:

| Cách | Điều kiện | Ghi chú |
|---|---|---|
| Mật khẩu hiện tại | `password_hash` NOT NULL | Cách mặc định |
| Vượt lại OAuth với provider **đã liên kết** | ≥1 hàng `social_identities` | `intent=reauth`; không tạo, không liên kết gì |
| Mã TOTP hợp lệ | MFA đã bật | |

**Thao tác cần reauth:**

| Thao tác | Spec sở hữu |
|---|---|
| Đổi mật khẩu · đặt mật khẩu lần đầu · đổi email | [`../03-account/account-settings.md`](../03-account/account-settings.md) |
| Bật / tắt MFA · sinh lại mã khôi phục | [`../03-account/mfa.md`](../03-account/mfa.md) |
| Liên kết / gỡ SNS | [`../03-account/social-account-linking.md`](../03-account/social-account-linking.md) |
| Yêu cầu xoá tài khoản | [`../03-account/account-deletion.md`](../03-account/account-deletion.md) |

Reauth thành công đặt `reauth_at = now()` cho **phiên hiện tại**, không cho phiên khác —
phiên khác có thể là của kẻ tấn công.

## 8. API contract

Guard vẫn **sync** — middleware đã xác minh JWT access một lần đầu request lifecycle (§3, §4
bước 4); guard chỉ đọc `event.context` đã gắn sẵn, không tự làm crypto/`await`
(`BR-AUT-02` không đổi).

| Route | Auth | Ghi chú |
|---|---|---|
| `POST /api/guest/auth/users/login` | không | Body `{email, password}`. 401 `INVALID_CREDENTIALS` |
| `POST /api/users/auth/refresh` | refresh cookie | Xoay token |
| `POST /api/users/auth/logout` | access | Xoá phiên hiện tại |
| `POST /api/users/auth/logout-all` | access | `refresh_token_version` +1 |
| `GET /api/users/auth/sessions` | access | Danh sách thiết bị |

```ts
function requireUserAuth(e: H3Event): UserTokenPayload;      // sync, throw 401
function requireManagerAuth(e: H3Event): ManagerTokenPayload; // sync, throw 401
function requireRole(e: H3Event, r: ManagerRole): void;       // throw 403
```

## 9. Acceptance criteria

```gherkin
Scenario: BR-AUT-01 — token chéo namespace bị từ chối
  Given một manager token hợp lệ
  When gửi tới GET /api/users/children
  Then trả 401

Scenario: BR-AUT-04 — tái dùng refresh token thu hồi toàn bộ phiên
  Given client đã refresh một lần với token R
  When client gửi lại token R
  Then trả 401
  And mọi phiên của tài khoản đó bị thu hồi

Scenario: BR-AUT-05 — đổi mật khẩu giết mọi phiên khác
  Given user đăng nhập trên 2 thiết bị
  When user đổi mật khẩu trên thiết bị A
  Then thiết bị B nhận SESSION_REVOKED ở lần refresh kế tiếp
  And thiết bị A vẫn dùng được

Scenario: BR-AUT-03 — refresh cookie không gửi kèm request thường
  When client gọi GET /api/users/children
  Then header Cookie không chứa tm_u_rt

Scenario: BR-AUT-10 — không tiết lộ email tồn tại
  When đăng nhập sai mật khẩu với email đã đăng ký
  And đăng nhập với email chưa đăng ký
  Then cả hai trả cùng mã và cùng thông báo
  And chênh lệch thời gian phản hồi dưới 50ms

Scenario: BR-AUT-07 — JWT không mang entitlement
  When decode một access token của user có gói premium
  Then payload không chứa entitlement, package, hay role

Scenario: BR-AUT-06 — thiếu CSRF token bị chặn
  Given user đã đăng nhập
  When gửi POST không kèm header x-csrf-token
  Then trả 403

Scenario: BR-AUT-09 — rate limit hai trục
  Given 10 lần đăng nhập sai liên tiếp cho cùng một email từ nhiều IP
  Then account bị khoá tạm
  Given 50 lần đăng nhập sai từ một IP cho nhiều email
  Then IP bị giới hạn

Scenario: BR-AUT-11 — không đăng ký manager công khai
  When quét mọi route dưới /api/guest
  Then không route nào tạo được hàng trong bảng managers

Scenario: BR-AUT-13 — phiên hợp lệ một mình không đủ cho thao tác nhạy cảm
  Given user đăng nhập từ 30 phút trước và chưa reauth
  When gọi POST /api/users/email
  Then trả 428 REAUTH_REQUIRED

Scenario: BR-AUT-14 — tài khoản chỉ có SNS reauth được
  Given user có password_hash NULL và đã liên kết Google
  When gọi POST /api/users/email chưa reauth
  Then details.methods chứa social
  And không chứa password
  And vượt lại OAuth Google xong thì gọi lại thành công

Scenario: BR-AUT-13 — reauth chỉ áp cho phiên hiện tại
  Given user đăng nhập trên 2 thiết bị
  When reauth thành công ở thiết bị A
  Then thiết bị B vẫn trả 428 REAUTH_REQUIRED cho thao tác nhạy cảm

Scenario: BR-AUT-13 — cửa sổ reauth hết hạn sau 5 phút
  Given user reauth thành công 6 phút trước
  When gọi POST /api/users/social-identities
  Then trả 428 REAUTH_REQUIRED

Scenario: BR-AUT-15 — Manager không đăng nhập được bằng SNS
  When quét mọi route OAuth
  Then không route nào cấp token có aud kidthink:manager

Scenario: BR-AUT-16 — password_hash NULL là hợp lệ
  Given user đăng ký bằng Google
  When đọc hàng users
  Then password_hash là NULL
  And user vẫn đăng nhập được

Scenario: BR-AUT-18 — không token nào của provider được lưu
  Given một lần đăng nhập Google thành công
  When đọc hàng active_sessions
  Then không cột nào chứa token của provider
```

## 10. Boundaries

**Always**
- Verify audience tường minh.
- Xoay refresh token mỗi lần dùng.
- Path-scope refresh cookie.
- `Secure` + `HttpOnly` đúng theo §7.2.
- Rate limit theo cả IP và account.
- Đòi reauth ≤5 phút cho mọi thao tác ở §7.4.

**Ask first**
- Đổi TTL token hoặc thuộc tính cookie.
- Thêm claim vào JWT.
- Đổi cửa sổ reauth 5 phút.
- Thêm nhà cung cấp OAuth — [`oauth-provider-registry.md`](oauth-provider-registry.md) §7.1.

**Never**
- `await` một guard.
- Entitlement/role của User trong JWT.
- Supabase Auth, Better-Auth, SMS OTP.
- bcrypt/MD5/SHA cho mật khẩu.
- Thông báo lỗi tiết lộ tài khoản tồn tại.
- Endpoint public tạo manager.
- SNS cho Manager.
- Coi SNS là yếu tố thứ hai thay MFA.
- Lưu token của nhà cung cấp OAuth.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~MFA cho Manager bắt buộc từ P0 hay bật ở P2?~~ **Đóng 2026-08-07 (T11)**: trùng câu hỏi với [`../00-foundation/actors.md`](../00-foundation/actors.md) §11 Q1 — đã đóng ở đó: **bắt buộc từ P0**. Cột thật `mfa_settings.secret_encrypted` + `managers.mfa_enabled` ([`schema-identity-billing.md`](schema-identity-billing.md) §7.3). Bất biến "Manager không hoạt động khi `mfa_settings.confirmed_at IS NULL`" ép ở **tầng service** | — | đã đóng | [`actors.md`](../00-foundation/actors.md) Q1 (D-X/T9 · M9) |
| ~~2~~ | ~~Social login (Google) có vào MVP không?~~ **Chốt 2026-08-05: có, P1.** Google và Facebook — [`oauth-provider-registry.md`](oauth-provider-registry.md) | — | đã đóng | D-X |
| ~~3~~ | ~~Khoá tạm account sau bao nhiêu lần sai, và bao lâu?~~ **Đóng 2026-08-07 (T11)**: số cụ thể sống ở [`rate-limiting.md`](rate-limiting.md) §7 (`BR-RTL-05`) — **5 lần → 1 phút · 10 → 5 phút · 15 → 30 phút · reset sau 24 giờ không sai**, khoá tăng dần không vĩnh viễn. Lưu ý: [`rate-limiting.md`](rate-limiting.md) còn `draft`: con số có thể đổi khi nó được approve, nhưng *chủ sở hữu* câu hỏi đã rõ và không còn nằm ở file này | — | đã đóng (chủ chuyển) | [`rate-limiting.md`](rate-limiting.md) §7 |
| 4 | Reauth bằng OAuth cần vượt lại **màn hình đồng ý** của provider hay chấp nhận phiên SSO đang mở? Chấp nhận phiên đang mở làm reauth gần như vô nghĩa trên máy dùng chung | Reauth trên tài khoản social — không chặn reauth password (P0 đã đủ) | chờ P1 | hoãn — chốt cùng lúc [`oauth-provider-registry.md`](oauth-provider-registry.md) vào P1 |
