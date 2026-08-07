---
spec: SOCIAL-ACCOUNT-LINKING
title: Liên kết và gỡ mạng xã hội
area: account
status: draft
mvp: true
phase: P1
reviewed: 2026-08-05
owns:
  - Liên kết thêm SNS vào tài khoản đang dùng
  - Gỡ liên kết SNS
  - Bất biến "luôn còn ít nhất một cách đăng nhập"
depends_on:
  - OAUTH-PROVIDER-REGISTRY
  - SOCIAL-LOGIN
  - ACCOUNT-SETTINGS
  - AUTH-TOKENS-SESSIONS
  - ERROR-CODES
---

# Liên kết và gỡ mạng xã hội

## 1. Objective

Một tài khoản, **nhiều cách vào**. User gắn Google và Facebook vào cùng một tài khoản, và gỡ
ra khi ❌ không muốn nữa.

Đây cũng là **lối thoát duy nhất** cho nhánh C của
[`social-login.md`](social-login.md) §4: email trùng ❌ không bao giờ được tự liên kết
(`BR-SCL-04`), nên người dùng phải đăng nhập rồi liên kết ở đây. Nếu màn hình này ❌ không
tồn tại thì `BR-SCL-04` biến thành ngõ cụt.

Tách khỏi `social-login.md` vì hai outcome dùng riêng được: một người có thể đăng nhập bằng
SNS cả năm mà ❌ không bao giờ mở trang này, và ngược lại.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| User | phiên hợp lệ + **reauth trong 5 phút** | Liên kết, gỡ, xem danh sách SNS đã gắn |
| Manager | — | ❌ Không. Manager ❌ không dùng SNS — `BR-SLK-08` |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/me/settings/security` | User | Nhóm **Bảo mật** ở [`account-settings.md`](account-settings.md) §7.1 |
| `GET /api/users/social-identities` | User | Danh sách đã gắn |
| `GET /api/guest/auth/oauth/{provider}/start?intent=link` | User | Bắt đầu liên kết |
| `DELETE /api/users/social-identities/{provider}` | User | Gỡ |

## 4. Main flow

**Liên kết**

1. Mở `/me/settings/security` → khối "Đăng nhập bằng mạng xã hội", liệt kê cả hai provider
   kèm trạng thái đã gắn / chưa gắn.
2. Bấm "Liên kết" ở một provider chưa gắn.
3. **Xác minh lại danh tính** (reauth) theo
   [`../01-platform/auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md) §7.4 —
   trừ khi đã reauth trong 5 phút qua.
4. Luồng OAuth `intent=link` → `NormalizedProfile`.
5. Kiểm ba điều kiện §5. Đạt cả ba → ghi `social_identities`, ghi `audit_logs`.
6. Gửi email thông báo "đã liên kết {provider}" tới địa chỉ hiện tại.

**Gỡ**

1. Bấm "Gỡ liên kết".
2. Kiểm `BR-SLK-04` — sau khi gỡ, tài khoản còn cách đăng nhập nào ❌ không?
3. Còn → reauth → xoá hàng, ghi `audit_logs`, gửi email thông báo.
4. ❌ Không còn → **409** `LAST_LOGIN_METHOD`, kèm đường dẫn đặt mật khẩu.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Provider đó đã gắn rồi | `UNIQUE (user_id, provider)` | **409** `SOCIAL_PROVIDER_ALREADY_LINKED` |
| Tài khoản SNS đó đã gắn User khác | `UNIQUE (provider, provider_user_id)` | **409** `SOCIAL_IDENTITY_ALREADY_LINKED`. ❌ **Không** nói tài khoản kia là ai — `BR-SLK-06` |
| Email ở provider khác email tài khoản | Chuyện thường | **Vẫn liên kết được.** ❌ Không đồng bộ, ❌ không ghi đè `users.email` — `BR-SLK-03` |
| Chưa reauth | Quá 5 phút | **428** `REAUTH_REQUIRED`, `details.methods[]` cho biết cách nào dùng được |
| Tài khoản ❌ không mật khẩu, gỡ SNS cuối | `password_hash` NULL, còn 1 hàng | **409** `LAST_LOGIN_METHOD` |
| Tài khoản có mật khẩu, gỡ SNS cuối | `password_hash` NOT NULL | ✅ Gỡ được — mật khẩu là cách đăng nhập còn lại |
| MFA đang bật | | ❌ Không ảnh hưởng. Gỡ SNS ❌ không tắt MFA |
| Huỷ ở màn hình provider | `access_denied` | Về `/me/settings/security`, ❌ không đổi gì |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SLK-01` | Liên kết và gỡ đều cần **reauth trong 5 phút** | Phiên bị chiếm ❌ không được gắn SNS của kẻ tấn công vào — đó là cửa hậu vĩnh viễn sống sót qua cả lần đổi mật khẩu |
| `BR-SLK-02` | **Một provider một lần** mỗi User — `UNIQUE (user_id, provider)` | Hai tài khoản Google trên một tài khoản KidThink ❌ không giải quyết vấn đề nào, nhưng làm màn hình gỡ mơ hồ |
| `BR-SLK-03` | Liên kết ❌ **NEVER ghi đè `users.email`**, ❌ không đồng bộ tên hiển thị | `users.email` là khoá khôi phục (`BR-ACS-03`). Để provider đổi nó là để provider đổi chủ tài khoản |
| `BR-SLK-04` | ❌ **NEVER gỡ phương thức đăng nhập cuối cùng.** Còn ít nhất một trong: `password_hash` NOT NULL, hoặc ≥1 hàng `social_identities` | Tài khoản ❌ không có cách vào là tài khoản đã mất, và cascade xoá dữ liệu trẻ ❌ không chạy được nữa |
| `BR-SLK-05` | Liên kết và gỡ đều ghi `audit_logs` **và** gửi email thông báo | Người thật biết ngay nếu ❌ không phải họ làm. Đây là dấu hiệu chiếm tài khoản dễ nhận nhất |
| `BR-SLK-06` | 409 khi tài khoản SNS đã gắn người khác ❌ **không tiết lộ** người đó là ai | `BR-ERR-02`. Ngược lại thì đây thành công cụ tra "email nào dùng Google nào" |
| `BR-SLK-07` | Gỡ SNS **❌ không** thu hồi phiên và **❌ không** tăng `refresh_token_version` | Gỡ ❌ không phải sự kiện mất kiểm soát. Đá người dùng ra khỏi mọi thiết bị vì một thao tác dọn dẹp là phạt nhầm |
| `BR-SLK-08` | Manager ❌ **NEVER liên kết SNS** | `BR-AUT-11` — Manager ❌ không có đăng ký công khai. Bề mặt quản trị ❌ không nhận danh tính từ bên thứ ba |
| `BR-SLK-09` | Danh sách hiện **provider và thời điểm liên kết**, ❌ không hiện `provider_user_id` | Định danh nội bộ ❌ không giúp người dùng, nhưng giúp người đọc trộm màn hình |
| `BR-SLK-10` | Gỡ là **xoá cứng** hàng `social_identities` | Hàng "đã gỡ" còn trong bảng thì `UNIQUE` chặn liên kết lại. Lịch sử nằm ở `audit_logs` |

## 7. Data

**Đọc:** `users`, `social_identities`, `active_sessions`.
**Ghi:** `social_identities`, `audit_logs`, `notifications`.

### 7.1 Khối "Đăng nhập bằng mạng xã hội"

| Cột | Nội dung |
|---|---|
| Provider | "Google" · "Facebook" |
| Trạng thái | "Đã liên kết {ngày}" hoặc "Chưa liên kết" |
| Email ở provider | Che một phần — `a***@gmail.com` |
| Hành động | "Liên kết" hoặc "Gỡ liên kết" |

Provider có `is_enabled = false` **❌ không hiện** — trừ khi User đang gắn nó, khi đó chỉ
hiện nút gỡ.

### 7.2 Bất biến số cách đăng nhập

```
login_methods = (password_hash IS NOT NULL ? 1 : 0) + count(social_identities)
```

`BR-SLK-04`: sau mọi thao tác gỡ, `login_methods ≥ 1`.

Kiểm ở **server trong cùng transaction với DELETE** — kiểm trước rồi xoá sau là cửa sổ đua
giữa hai tab.

### 7.3 Hành động vào `audit_logs`

`social_identity.linked` · `social_identity.unlinked` — kèm `provider`, ❌ không kèm
`provider_user_id`.

## 8. API contract

### `GET /api/users/social-identities`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| 200 | `[{ provider, masked_email, linked_at }]` — ❌ không có `provider_user_id` |

### `GET /api/guest/auth/oauth/{provider}/start?intent=link`

| | |
|---|---|
| Auth | `requireUserAuth()` — dù nằm dưới `/api/guest` |
| 302 | Tới provider |
| 428 | `REAUTH_REQUIRED` |

### `POST /api/users/social-identities`

| | |
|---|---|
| Auth | `requireUserAuth()` + reauth ≤5 phút + `x-csrf-token` |
| Body | `{ provider }` — hồ sơ đọc từ cookie `tm_oauth` đã xác thực |
| 201 | `{ provider, masked_email, linked_at }` |
| 409 | `SOCIAL_PROVIDER_ALREADY_LINKED` |
| 409 | `SOCIAL_IDENTITY_ALREADY_LINKED` |
| 428 | `REAUTH_REQUIRED` |

### `DELETE /api/users/social-identities/{provider}`

| | |
|---|---|
| Auth | `requireUserAuth()` + reauth ≤5 phút + `x-csrf-token` |
| 200 | `{ ok: true, login_methods_left }` |
| 404 | `NOT_FOUND` — chưa liên kết provider đó |
| 409 | `LAST_LOGIN_METHOD` — `details.set_password_url` |
| 428 | `REAUTH_REQUIRED` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-SLK-04 — không gỡ được cách đăng nhập cuối
  Given user có password_hash NULL và đúng 1 hàng social_identities
  When gọi DELETE /api/users/social-identities/google
  Then trả 409 LAST_LOGIN_METHOD
  And hàng social_identities vẫn còn

Scenario: BR-SLK-04 — gỡ được khi vẫn còn mật khẩu
  Given user có password_hash NOT NULL và 1 hàng social_identities
  When gọi DELETE /api/users/social-identities/google
  Then trả 200
  And user vẫn đăng nhập được bằng mật khẩu

Scenario: BR-SLK-04 — hai tab gỡ đồng thời không làm mất cách vào cuối
  Given user có password_hash NULL và 2 hàng social_identities
  When hai request DELETE cho hai provider chạy đồng thời
  Then đúng một request trả 200
  And request còn lại trả 409 LAST_LOGIN_METHOD
  And còn lại đúng 1 hàng social_identities

Scenario: BR-SLK-01 — liên kết cần reauth
  Given user đăng nhập từ 30 phút trước và chưa reauth
  When gọi start với intent=link
  Then trả 428 REAUTH_REQUIRED
  And không redirect nào tới provider

Scenario: BR-SLK-02 — một provider một lần
  Given user đã liên kết Google
  When liên kết một tài khoản Google khác
  Then trả 409 SOCIAL_PROVIDER_ALREADY_LINKED

Scenario: BR-SLK-06 — 409 không tiết lộ chủ tài khoản kia
  Given tài khoản Google G đã gắn user B
  When user A liên kết G
  Then trả 409 SOCIAL_IDENTITY_ALREADY_LINKED
  And body không chứa email, tên, hay uuid của user B

Scenario: BR-SLK-03 — liên kết không ghi đè email tài khoản
  Given user có email a@example.com
  When liên kết Google mang email z@gmail.com
  Then users.email vẫn là a@example.com
  And đăng nhập bằng a@example.com vẫn được

Scenario: BR-SLK-05 — liên kết và gỡ đều được ghi nhận
  When liên kết Facebook rồi gỡ ra
  Then audit_logs có social_identity.linked và social_identity.unlinked
  And hai email thông báo được gửi tới địa chỉ hiện tại

Scenario: BR-SLK-07 — gỡ không đá người dùng ra
  Given user đăng nhập trên 2 thiết bị và có mật khẩu
  When gỡ Google ở thiết bị A
  Then thiết bị B vẫn dùng được

Scenario: BR-SLK-09 — không lộ provider_user_id
  When gọi GET /api/users/social-identities
  Then không trường nào chứa provider_user_id

Scenario: BR-SLK-10 — gỡ rồi liên kết lại được
  Given user đã gỡ Google
  When liên kết lại chính tài khoản Google đó
  Then trả 201

Scenario: BR-SLK-08 — Manager không có đường liên kết SNS
  When quét mọi route dưới /api/managers
  Then không route nào ghi vào social_identities
```

## 10. Boundaries

**Always**
- Reauth ≤5 phút cho cả liên kết và gỡ.
- Kiểm `login_methods ≥ 1` trong cùng transaction với DELETE.
- Ghi `audit_logs` và gửi email thông báo cho cả hai thao tác.
- Che email của provider khi hiển thị.

**Ask first**
- Cho phép nhiều tài khoản cùng một provider.
- Đổi cửa sổ reauth 5 phút.
- Đồng bộ tên hiển thị từ provider.

**Never**
- Gỡ phương thức đăng nhập cuối cùng.
- Ghi đè `users.email` khi liên kết.
- Tiết lộ tài khoản nào đang giữ một danh tính SNS.
- Hiện `provider_user_id` ra client.
- Liên kết SNS cho Manager.
- Thu hồi phiên khi gỡ liên kết.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Khi User gỡ SNS mà đó là cách vào cuối, ta chỉ chỉ đường tới "đặt mật khẩu". Có nên **gộp** hai bước thành một màn hình (đặt mật khẩu rồi gỡ luôn) ❌ không? | P2 · UX |
| 2 | Reauth 5 phút áp cho cả `account-settings` và `mfa` — con số này nên nằm ở đâu để một chỗ đổi là mọi nơi đổi? Hiện đề xuất `auth-tokens-sessions` §7.4 | P1 |
