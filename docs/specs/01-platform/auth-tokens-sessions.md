---
spec: AUTH-TOKENS-SESSIONS
title: Token, cookie và vòng đời phiên
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-08-13
owns:
  - Cookie session opaque của User và Manager
  - Vòng đời session một giờ và remember-me một năm
  - Redis session store và thu hồi nhiều thiết bị
  - Quy tắc xác minh lại danh tính (reauth) cho thao tác nhạy cảm
depends_on:
  - ACTORS
  - ERROR-CODES
  - REPO-BOOTSTRAP
---

# Token, cookie và vòng đời phiên

## 1. Objective

**Cập nhật 2026-08-13 theo quyết định sản phẩm mới:** xác thực trình duyệt của cả User và
Manager dùng **opaque cookie session**, không phát JWT access token. Cookie `HttpOnly` chỉ mang
một session locator ngẫu nhiên; payload phiên, chỉ mục account/thiết bị, trạng thái reauth và
credential `remember_me` đều do Redis giữ làm authority duy nhất.

Một session làm việc có hạn tuyệt đối **1 giờ**, không sliding. Khi người dùng chọn
`remember_me`, backend cấp thêm credential opaque, xoay một lần mỗi lần khôi phục session và có
hạn tuyệt đối tối đa **365 ngày** tính từ lần đăng nhập gốc; rotation không kéo dài mốc này.
`active_sessions` trong PostgreSQL chỉ là metadata/audit thiết bị, không chứa credential và
không được dùng để phục hồi phiên khi Redis thiếu dữ liệu.

`nuxt-auth-utils` vẫn cung cấp `useUserSession()` và `/api/_auth/session`, nhưng không phải
session store: H3 mặc định seal dữ liệu trong cookie và không có Redis store option. KidThink
chỉ seal locator trong `secure`, rồi `sessionHooks.fetch` đọc safe projection từ Redis.
KidThink không phát hoặc nhận first-party JWT cho session, remember, MFA challenge hay service
auth hiện hành và gỡ dependency trực tiếp `jose`. Token OIDC do provider trả về chỉ là input
protocol tạm thời do `openid-client` xác minh; không lưu, forward hoặc dùng làm KidThink session.

OAuth Google/Facebook ở P1 tiếp tục dùng `openid-client`; password dùng Argon2id; TOTP dùng
OTPAuth. Cấm OAuth/password/WebAuthn helper tích hợp của `nuxt-auth-utils`, Supabase Auth,
Better-Auth, Sidebase AuthJS và `next-auth`.

## 2. Actors

| Actor | Credential trình duyệt | MFA | Cách xác thực yếu tố thứ nhất |
|---|---|---|---|
| User | Cookie session một giờ; remember-me tuỳ chọn | Tuỳ chọn, P2 — [`../03-account/mfa.md`](../03-account/mfa.md) | Mật khẩu hoặc SNS — [`../03-account/social-login.md`](../03-account/social-login.md) |
| Manager | Cookie session một giờ; remember-me chỉ cấp sau MFA; challenge MFA opaque một lần | Bắt buộc | Mật khẩu; cấm SNS (`BR-AUT-15`) |
| Guest | Không session auth; có thể có cookie thiết bị | — | — |

## 3. Entry points

| Nơi | Trách nhiệm |
|---|---|
| `packages/auth/` | Sở hữu credential opaque, Redis session/remember/challenge adapter fail-closed, CSRF, domain context, Argon2id và TOTP |
| `apps/*/server/plugins/auth-session.ts` | Nối adapter, `sessionHooks.fetch`, lifecycle và health check theo namespace |
| `apps/*/nuxt.config.ts` | Khai `nuxt-auth-utils`, cookie locator, TTL một giờ và load strategy riêng app |
| `apps/*/shared/types/auth.d.ts` | Khai safe projection và `SecureSessionData.session_token` app-local |
| `apps/*/server/middleware/auth.ts` | Đọc locator, lookup Redis một lần, gắn context; guard domain đọc context đồng bộ |
| `POST /api/guest/auth/{users\|managers}/login` | Xác thực đầu vào; User tạo session, Manager tạo opaque MFA challenge; nhận `rememberMe` |
| `POST /api/guest/auth/{users\|managers}/mfa` | Tiêu thụ nguyên tử opaque MFA challenge đúng namespace rồi mới tạo session/remember |
| `POST /api/guest/auth/{users\|managers}/remember` | Xoay remember credential và tạo session làm việc mới |
| `GET /api/_auth/session` | Trả safe projection được hydrate từ Redis; không trả locator/credential |
| `POST /api/{users\|managers}/auth/logout` | Thu hồi thiết bị hiện tại và xoá cookie |
| `POST /api/{users\|managers}/auth/logout-all` | Thu hồi mọi thiết bị của account |

## 4. Main flow

1. Login thành công (User: mật khẩu hoặc SNS; Manager: mật khẩu + TOTP) tạo `device_id` và
   session token ngẫu nhiên 32 byte. Backend chỉ trả token qua cookie `HttpOnly`. Bước mật khẩu
   actor trước MFA chỉ tạo challenge opaque 32 byte, TTL 5 phút, một lần dùng; Redis giữ
   digest cùng namespace/account/origin/`rememberMe`, và MFA callback tiêu thụ nguyên tử.
2. Redis transaction ghi session payload TTL **3600 giây**, device pointer và account index.
   Nếu `rememberMe=true`, cùng transaction tạo credential `r1.<selector>.<verifier>` với mỗi
   thành phần ngẫu nhiên 32 byte; chỉ lưu digest và
   `absolute_expires_at = login_at + 365 ngày`.
3. `replaceUserSession()` seal **chỉ** `secure.session_token` vào cookie locator một giờ.
   `sessionHooks.fetch` dùng locator lookup Redis và hydrate safe `user` projection cho
   `useUserSession()`; locator không xuất hiện trong response.
4. Mỗi request User/Manager: middleware hash locator, lookup Redis đúng namespace một lần, kiểm
   expiry/generation/device state, rồi gắn domain context. Guard route vẫn đồng bộ và không làm
   I/O lần hai.
5. Sau một giờ, session tuyệt đối hết hạn. Nếu có remember cookie còn hạn, client gọi route
   `remember`: backend kiểm CSRF, xoay remember credential và CSRF token nguyên tử, tạo session
   một giờ mới với `reauthAt=null`, rồi giữ nguyên mốc remember hết hạn tuyệt đối ban đầu.
6. Client chỉ tự thử restore lúc bootstrap hoặc sau một request đọc/idempotent nhận 401. Không
   tự retry request đổi trạng thái để tránh thực thi hai lần.
7. Logout canonical kiểm CSRF, thu hồi Redis trước, xoá remember/session locator và cập nhật
   metadata PostgreSQL idempotently. Logout-all dùng Redis transaction thu hồi toàn bộ device
   index của account trước khi cập nhật generation/audit ở PostgreSQL.

Manager: bước tạo session chỉ chạy sau MFA thành công. `rememberMe` được bind vào challenge
credential của bước mật khẩu; client không thể thêm tuỳ chọn này vào callback MFA khác.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| `rememberMe=false` hoặc bỏ trống | Không tạo remember credential; cookie locator vẫn hết hạn sau một giờ |
| Session hết hạn, remember còn hạn | Route remember xoay credential và tạo session một giờ mới |
| Remember token đã dùng lại | Thu hồi mọi credential/session của account, 401 `SESSION_REVOKED`, ghi audit |
| Remember đã tới mốc 365 ngày | 401; đăng nhập đầy đủ lại, rotation không gia hạn |
| Session/remember sai namespace | 401, không thử namespace còn lại |
| Redis không tới được | 503 `SERVICE_UNAVAILABLE`; không fallback file, memory, PostgreSQL hoặc JWT |
| Redis miss/eviction | Coi session hết; chỉ restore được nếu remember record vẫn tồn tại trong Redis |
| Manager chưa qua MFA | 428 `MFA_REQUIRED`; không tạo session, remember hay metadata thiết bị |
| MFA challenge thiếu/sai/hết hạn/đã dùng | 401; không tạo session và không fallback sang JWT challenge |
| Xoá một thiết bị | Session và remember của đúng `device_id` chết ở request kế tiếp; thiết bị khác giữ nguyên |
| `DELETE /api/_auth/session` | 405; logout chỉ qua route canonical để không bỏ sót revoke server-side |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-AUT-02` | Guard là hàm **sync**, đọc `event.context`. Cấm — NEVER `await requireUserAuth()` | Guard trả Promise mời quên `await`, và quên `await` nghĩa là không có guard |
| `BR-AUT-06` | CSRF token **không** HttpOnly, gửi qua header `x-csrf-token` trên **mọi** route đổi trạng thái | Cookie auth tự động đi kèm request từ site khác; header thì không |
| `BR-AUT-08` | Mật khẩu hash bằng **argon2id**; không bcrypt, MD5 hoặc SHA | Argon2id chống dò offline bằng chi phí memory-hard |
| `BR-AUT-09` | Rate limit đăng nhập theo **IP và account** | Hai trục chặn cả quét diện rộng lẫn nhắm một tài khoản |
| `BR-AUT-10` | Lỗi đăng nhập không tiết lộ tài khoản tồn tại; thời gian phản hồi không lệch | Ngăn enumeration email |
| `BR-AUT-11` | Manager không có endpoint đăng ký công khai | Manager là tài khoản vận hành, chỉ tạo qua luồng kiểm soát |
| `BR-AUT-12` | Cookie Manager là host-only trên `admin.{domain}` | Tách bề mặt User và Manager |
| `BR-AUT-13` | Thao tác nhạy cảm §7.5 cần reauth trong 5 phút | Phiên bị chiếm không được đổi khoá vào tài khoản |
| `BR-AUT-14` | Reauth chấp nhận bất kỳ cách nào ở §7.5, không cứng mật khẩu | Tài khoản chỉ-SNS vẫn cần đổi cài đặt an toàn |
| `BR-AUT-15` | Manager cấm đăng nhập bằng SNS | Sự cố provider không được thành sự cố quản trị |
| `BR-AUT-16` | `users.password_hash` nullable; tài khoản chỉ-SNS hợp lệ | Bất biến thật là mỗi User có ít nhất một login method |
| `BR-AUT-17` | SNS là yếu tố thứ nhất, không thay MFA | Provider không chứng minh thiết bị thứ hai |
| `BR-AUT-18` | Cấm lưu token OAuth provider trong session hoặc bảng | KidThink không cần gọi provider sau login |
| `BR-AUT-25` | User/Manager browser auth chỉ dùng opaque cookie session; cấm phát hoặc nhận JWT access/Bearer cho hai guard này | Loại bỏ token client tự mang claim và cho phép revoke tập trung |
| `BR-AUT-26` | Cookie session chỉ chứa locator ngẫu nhiên; identity, role, reauth và quyền nằm trong Redis | Cookie không được trở thành session authority thứ hai |
| `BR-AUT-27` | Session làm việc hết hạn tuyệt đối sau 3600 giây, không sliding | Hoạt động liên tục không được kéo phiên vô hạn |
| `BR-AUT-28` | `rememberMe` mặc định false; khi true có hạn tuyệt đối tối đa 365 ngày từ login gốc và rotation không gia hạn | “Ghi nhớ một năm” không được biến thành đăng nhập vĩnh viễn |
| `BR-AUT-29` | Remember credential xoay nguyên tử mỗi lần dùng; reuse thu hồi toàn bộ account | Một token cũ xuất hiện lại là bằng chứng credential bị sao chép |
| `BR-AUT-30` | Session, remember và index account/device là một keyspace Redis fail-closed; create/restore/revoke dùng transaction hoặc Lua nguyên tử | Multi-device revoke không được để lại credential mồ côi |
| `BR-AUT-31` | Redis lỗi trả 503; cấm fallback sang file, memory, PostgreSQL metadata, sealed identity hoặc JWT | Fallback làm revocation và hành vi giữa process không nhất quán |
| `BR-AUT-32` | Session token và từng thành phần selector/verifier của remember credential có entropy tối thiểu 256 bit; Redis chỉ giữ digest, log không ghi token/cookie | Giảm khả năng đoán và thiệt hại khi log/store bị lộ |
| `BR-AUT-33` | Logout phải qua route canonical có CSRF; `clear()`/DELETE nội bộ không phải logout domain | Xoá riêng cookie không thu hồi credential server-side |
| `BR-AUT-34` | Manager chỉ nhận remember credential sau MFA; remember restore của cả User/Manager không tạo hoặc làm mới cửa sổ reauth 5 phút | Remember không được bypass MFA lần cấp đầu hoặc quyền nhạy cảm |
| `BR-AUT-35` | `nuxt-auth-utils` chỉ cung cấp projection/composable; cấm OAuth, password, WebAuthn helper và cấm tin data sealed ngoài locator | Module không có Redis store và không được tạo auth contract thứ hai |
| `BR-AUT-36` | Redis auth store nằm trong `packages/auth`, dùng client riêng, AOF, `noeviction`, health check và alert; không đi qua `packages/cache` fail-open | Cache miss được phép, session authority thì không |
| `BR-AUT-37` | PostgreSQL `active_sessions` chỉ là metadata/audit, không chứa session/remember token và không phục hồi auth | Tránh hai authority và cửa sổ revoke liên datastore |
| `BR-AUT-38` | Mọi credential auth do KidThink phát đều opaque; MFA challenge nằm trong Redis, TTL tối đa 5 phút, one-time consume. Cấm direct dependency/import `jose` và cấm first-party JWT/JWS | Một cơ chế credential duy nhất giảm bề mặt crypto, tránh self-contained challenge sống ngoài revocation authority |

Các ID `BR-AUT-01`, `BR-AUT-03`–`05`, `BR-AUT-07` và `BR-AUT-19`–`24` đã nghỉ cùng contract
JWT/refresh trước đó; không tái sử dụng.

## 7. Data

### 7.1 Opaque credential

- Session token: 32 byte CSPRNG, base64url, chỉ đi qua cookie locator; Redis key dùng SHA-256.
- Remember credential: `r1.<selector>.<verifier>`, mỗi thành phần 32 byte CSPRNG/base64url.
  Selector là id family ngẫu nhiên ổn định qua rotation; verifier thay mới mỗi lần restore.
  Redis key dùng SHA-256(selector), value chỉ giữ SHA-256(verifier) hiện hành.
- Credential không chứa `account_id`, namespace, role, expiry hoặc device id; selector không có
  nghĩa ngoài việc tìm family để phân biệt replay token cũ với token rác.
- Namespace được chọn từ app/route server, không đọc từ token do client cung cấp.

### 7.2 Redis authority

```ts
interface OnlineSession {
  namespace: "user" | "manager";
  accountId: number;
  deviceId: string;
  sessionVersion: number;
  authMethod: "password" | "social";
  createdAt: string;
  expiresAt: string;
  reauthAt: string | null;
  user?: { displayName: string; activeChildId?: number };
  manager?: { displayName: string; role: ManagerRole };
}

interface RememberSession {
  namespace: "user" | "manager";
  accountId: number;
  deviceId: string;
  sessionVersion: number;
  absoluteExpiresAt: string;
}

interface MfaChallenge {
  namespace: "user" | "manager";
  accountId: number;
  rememberMe: boolean;
  origin: string;
  createdAt: string;
  expiresAt: string;
}
```

Key prefix đóng, có version:

- `auth:session:v1:{namespace}:{sha256(sessionToken)}` → payload, TTL tối đa 3600 giây;
- `auth:remember:v1:{namespace}:{sha256(selector)}` → record + digest verifier hiện hành, TTL
  còn lại tới mốc tuyệt đối;
- `auth:device:v1:{namespace}:{deviceId}` → locator digest hiện hành;
- `auth:account:v1:{namespace}:{accountId}` → set device id để revoke-all;
- `auth:generation:v1:{namespace}:{accountId}` → generation thu hồi toàn account.
- `auth:challenge:v1:{namespace}:{sha256(challenge)}` → pre-auth record one-time, TTL tối đa 300 giây.

Không dùng `SCAN` trong request/revoke. Lua script lookup selector family, so verifier
constant-time, kiểm namespace/generation/TTL và cập nhật verifier + session + device pointer
nguyên tử. Selector tồn tại nhưng verifier lệch là reuse: revoke account index. Selector không
tồn tại chỉ là credential không hợp lệ, không được dùng làm oracle/DoS revoke account.

### 7.3 Nuxt session projection

```ts
declare module "#auth-utils" {
  interface User {
    account_id: number;
    display_name: string;
    account_type: "user" | "manager";
  }

  interface SecureSessionData {
    session_token: string;
  }
}
```

`replaceUserSession()` chỉ ghi `secure.session_token`. `sessionHooks.fetch` hydrate `user` từ
Redis cho đúng request; public response không có `secure`, token, role không thuộc namespace
hoặc dữ liệu trẻ ngoài allow-list.

### 7.4 Cookie

| Cookie | Cơ chế | HttpOnly | SameSite | Path | TTL |
|---|---|:--:|---|---|---|
| `kidthink-user-session` / `kidthink-manager-session` | Sealed locator chứa opaque session token | Có | Lax | `/` | 1 giờ tuyệt đối |
| `tm_u_remember` | Remember credential User, chỉ tạo khi chọn | Có | Strict | `/api/guest/auth/users/remember` | tối đa 365 ngày tuyệt đối |
| `tm_m_remember` | Remember credential Manager, chỉ tạo sau MFA | Có | Strict | `/api/guest/auth/managers/remember` | tối đa 365 ngày tuyệt đối |
| `tm_u_csrf` / `tm_m_csrf` | Double-submit; TTL theo credential dài nhất hiện có | Cấm | Strict | `/` | 1 giờ hoặc tối đa 365 ngày |
| `active_child_id` | Context do người lớn chọn, không phải auth credential | Cấm | Lax | `/` | 30 ngày |
| `tm_did` | Guest device | Cấm | Lax | `/` | 1 năm |

Mọi auth cookie `Secure` ở production và không đặt `Domain`. Secret seal của Web/Admin khác
nhau; session locator vẫn không được tin nếu Redis không có record. CSRF token xoay ở mỗi lần
đăng nhập đầy đủ hoặc remember restore thành công và bị xoá khi logout.

### 7.5 PostgreSQL metadata và reauth

`active_sessions`: `device_id` UUID unique · `account_type` · `account_id` · `device_label` ·
`ip_address` · `auth_method` · `remembered` · `created_at` · `last_used_at` · `expires_at` ·
`revoked_at`. Bảng không có token/hash và không nằm trên hot path guard.

Reauth state authoritative nằm trong Redis session hiện tại. Cửa sổ **5 phút**; quá hạn trả
428 `REAUTH_REQUIRED`. Chấp nhận mật khẩu hiện tại, OAuth provider đã liên kết hoặc TOTP hợp
lệ theo availability của account. Reauth chỉ cập nhật session hiện tại.

## 8. API contract

Middleware lookup Redis bất đồng bộ một lần; guard sau đó vẫn đồng bộ:

```ts
function requireUserAuth(e: H3Event): AuthenticatedUser;
function requireManagerAuth(e: H3Event): AuthenticatedManager;
function requireRole(e: H3Event, role: ManagerRole): void;
```

| Route | Auth | Request/response chính |
|---|---|---|
| `POST /api/guest/auth/users/login` | không | `{email,password,rememberMe?:boolean}`; 200 đặt cookie |
| `POST /api/guest/auth/managers/login` | không | `{email,password,rememberMe?:boolean}`; 428 challenge bind preference |
| `POST /api/guest/auth/{users\|managers}/mfa` | opaque challenge one-time đúng namespace | 200 tạo session; remember chỉ khi challenge cho phép |
| `POST /api/guest/auth/users/remember` | remember cookie + CSRF | rotate + session mới; body rỗng |
| `POST /api/guest/auth/managers/remember` | remember cookie + CSRF | rotate + session mới; body rỗng |
| `POST /api/{users\|managers}/auth/logout` | session + CSRF | revoke thiết bị hiện tại |
| `POST /api/{users\|managers}/auth/logout-all` | session + CSRF | revoke mọi thiết bị |
| `GET /api/{users\|managers}/auth/sessions` | session | danh sách device metadata |
| `DELETE /api/{users\|managers}/auth/sessions/{id}` | session + CSRF | revoke đúng device id |
| `GET /api/_auth/session` | session locator | safe projection từ Redis |
| `DELETE /api/_auth/session` | không hỗ trợ | 405 |

Hai route `/auth/refresh` cũ bị xoá. Không route nào chấp nhận first-party JWT/JWS hoặc
`Authorization: Bearer`. Redis outage trả 503, credential thiếu/sai/hết hạn trả 401.

## 9. Acceptance criteria

```gherkin
Scenario: BR-AUT-25 — session auth không phát JWT
  Given User hoặc Manager đăng nhập thành công
  When kiểm response, cookie, Redis payload và client bundle
  Then không có JWT/JWS hoặc Authorization Bearer
  And protected route chỉ nhận opaque session cookie đúng namespace

Scenario: BR-AUT-27 — session hết đúng một giờ
  Given session được tạo tại T0
  When thời gian là T0 cộng 3600 giây
  Then Redis session không còn hợp lệ
  And request tiếp theo trả 401 dù trước đó có hoạt động liên tục

Scenario: BR-AUT-28 — remember có hạn tuyệt đối một năm
  Given remember credential tạo tại T0 và đã rotate nhiều lần
  When thời gian là T0 cộng 365 ngày
  Then credential không khôi phục được session
  And phải đăng nhập đầy đủ lại

Scenario: BR-AUT-29 — remember reuse thu hồi toàn account
  Given remember token R đã đổi thành R2
  When gửi lại R
  Then trả SESSION_REVOKED
  And mọi session và remember credential của account bị thu hồi

Scenario: BR-AUT-30 — thu hồi một thiết bị
  Given account có ba device id đang hoạt động
  When thu hồi device thứ hai
  Then session và remember của device đó chết ở request kế tiếp
  And hai device còn lại không bị ảnh hưởng

Scenario: BR-AUT-31 — Redis outage fail closed
  Given Redis auth store không tới được
  When gọi protected route hoặc remember restore
  Then trả 503 SERVICE_UNAVAILABLE
  And không fallback sang PostgreSQL, memory, file hoặc JWT

Scenario: BR-AUT-32 — token không lộ
  When quét log, response, PostgreSQL active_sessions và Redis value
  Then không có raw session hoặc remember token
  And Redis lookup key chỉ dùng digest session token hoặc selector
  And remember record chỉ giữ digest verifier, không giữ verifier thô

Scenario: BR-AUT-34 — Manager remember không bypass MFA
  Given Manager mới chỉ qua bước mật khẩu
  When yêu cầu remember credential
  Then chưa có session hoặc remember record
  When challenge MFA hợp lệ hoàn tất
  Then mới tạo credential theo preference đã bind

Scenario: BR-AUT-33 — clear nội bộ không thay logout
  Given thiết bị có session và remember còn hạn
  When gọi DELETE /api/_auth/session
  Then trả 405 và Redis record giữ nguyên
  When gọi logout canonical với CSRF hợp lệ
  Then Redis record bị thu hồi trước khi cookie bị xoá

Scenario: BR-AUT-35 — projection lấy từ Redis
  Given cookie locator hợp lệ nhưng Redis record đã bị xoá
  When gọi GET /api/_auth/session
  Then không trả user projection từ sealed cookie
  And client ở trạng thái logged out

Scenario: BR-AUT-38 — MFA challenge không dùng JWT
  Given User hoặc Manager qua yếu tố thứ nhất và cần MFA
  When server tạo challenge
  Then response chỉ có opaque random credential và Redis chỉ giữ digest với TTL tối đa 5 phút
  And challenge chỉ có đúng một lần consume thành công
  And repo không có direct dependency hoặc import jose
```

## 10. Boundaries

**Always**
- Session tuyệt đối một giờ; remember tuyệt đối tối đa 365 ngày.
- Token CSPRNG 256 bit, digest ở store, `Secure` + `HttpOnly` ở production.
- Redis auth store fail-closed, transaction/Lua cho rotate và revoke.
- Revoke Redis trước; cập nhật PostgreSQL metadata idempotently sau.
- Test âm cho reuse, cross-namespace, Redis outage, expiry và revoke nhiều thiết bị.

**Ask first**
- Đổi TTL một giờ hoặc 365 ngày.
- Đổi policy AOF/`noeviction` hoặc dùng chung auth store với cache fail-open.
- Thêm claim/payload vào cookie locator.
- Đổi cửa sổ reauth 5 phút hoặc Manager remember policy.

**Never**
- First-party JWT/JWS cho session, remember, MFA challenge hoặc service auth.
- Direct dependency/import `jose`; nếu tương lai cần service auth phải mở spec riêng trước.
- Bearer auth credential trên bất kỳ route nào.
- Sliding session hoặc sliding remember expiry.
- Raw token trong log, response, PostgreSQL hoặc client state.
- Fallback file, memory, PostgreSQL metadata hoặc JWT khi Redis lỗi.
- `useUserSession().clear()`/DELETE nội bộ làm logout domain.
- OAuth/password/WebAuthn helper tích hợp của `nuxt-auth-utils`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~MFA cho Manager bắt buộc từ P0 hay P2?~~ **Đóng 2026-08-07:** bắt buộc từ P0 | — | đã đóng | D-X |
| ~~2~~ | ~~Social login có vào MVP không?~~ **Đóng 2026-08-05:** Google và Facebook ở P1 | — | đã đóng | D-X |
| 3 | Reauth bằng OAuth có buộc provider prompt lại hay chấp nhận SSO đang mở? | Reauth SNS | P1 | người quyết |
| 4 | Production dùng Valkey auth instance riêng hay cùng process nhưng deployment riêng? Dù chọn cách nào vẫn phải AOF + `noeviction` và không dùng logical DB như biên cô lập | Infra sizing/runbook; không chặn contract/code adapter | trước go-live | Infra |
