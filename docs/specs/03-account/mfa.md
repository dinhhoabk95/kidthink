---
spec: MFA
title: Xác thực hai lớp
area: account
status: implemented
mvp: false
phase: P2
reviewed: 2026-08-13
owns:
  - Thiết lập và dùng MFA cho tài khoản User
depends_on:
  - AUTH-TOKENS-SESSIONS
  - ACCOUNT-SETTINGS
  - SOCIAL-LOGIN
---

# Xác thực hai lớp

## 1. Objective

MFA cho **User** là **tuỳ chọn**, phase **P2** — User tự bật ở
`/me/settings/security`. Cấm chặn go-live MVP. MFA cho **Manager** là bắt buộc và đã
spec ở [`../06-admin/admin-auth.md`](../06-admin/admin-auth.md).

Lý do không bắt buộc: tài khoản User giữ dữ liệu học của trẻ, không giữ tiền hay quyền
quản trị. Rủi ro thấp hơn, và ép thêm một bước cho User làm giảm tỉ lệ hoàn thành
onboarding.

Lý do không chặn MVP: hạ tầng đã có sẵn ở [`auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md) và `mfa_settings`, nên
bật sau không phải làm lại. Chốt 2026-08-05.

MFA đứng **sau** mọi cách xác thực yếu tố thứ nhất — mật khẩu hay SNS đều như nhau
(`BR-MFA-09`).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| User | phiên hợp lệ + **reauth ≤5 phút** | Bật, tắt, sinh lại mã khôi phục |
| Manager | — | Bắt buộc, luồng riêng ở [`../06-admin/admin-auth.md`](../06-admin/admin-auth.md) |

## 3. Entry points

`packages/auth/src/mfa/` (adapter `otpauth` duy nhất) · `/me/settings/security` ·
`POST /api/users/mfa/setup` · `/verify` · `/disable` ·
`GET /api/users/mfa/recovery-codes` · `POST /api/guest/auth/users/mfa` (thử thách lúc đăng
nhập, dùng chung cho cả mật khẩu và SNS).

## 4. Main flow

1. Bật MFA → **reauth** theo
   [`../01-platform/auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md) §7.4 →
   server sinh secret, trả QR TOTP.
2. User quét bằng app xác thực, nhập mã 6 số để xác nhận.
3. Xác nhận đúng → `mfa_settings.confirmed_at`, sinh **10 mã khôi phục** dùng một lần.
4. Lần đăng nhập sau: **yếu tố thứ nhất đúng** (mật khẩu **hoặc** SNS) → **428**
   `MFA_REQUIRED` → nhập mã → consume opaque Redis challenge một lần → cấp opaque session.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Sai mã 5 lần | **429** `MFA_LOCKED`, khoá 15 phút |
| Sai mã lần đơn lẻ | **401** `MFA_INVALID_CODE` |
| Mất thiết bị | Dùng mã khôi phục |
| Hết mã khôi phục | Liên hệ hỗ trợ; quy trình xác minh ngoài hệ thống |
| Tắt MFA | Cần **reauth** + một mã hợp lệ — `BR-MFA-03` |
| Đăng nhập bằng SNS | Vẫn qua thử thách MFA, cùng route — `BR-MFA-09` |
| Tài khoản chỉ có SNS | Reauth bằng OAuth với provider đã liên kết, không cần mật khẩu |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MFA-01` | Secret lưu **mã hoá**, không plaintext | Ngăn ngừa rò rỉ secret TOTP khi cơ sở dữ liệu bị truy cập trái phép |
| `BR-MFA-02` | Mã khôi phục lưu **hash**, dùng **một lần** | Đảm bảo mã khôi phục không thể bị đọc lén hoặc tái sử dụng sau khi đã tiêu thụ |
| `BR-MFA-03` | Tắt MFA cần **reauth §7.4 và một mã hợp lệ** — hai thứ, không phải một | Phiên bị chiếm không được tắt MFA. Trước đây rule này ghi "mật khẩu"; `password_hash` nullable từ `BR-SIB-08` làm tài khoản chỉ-SNS không tắt được MFA của chính mình — reauth là dạng tổng quát đúng |
| `BR-MFA-04` | Cửa sổ TOTP ±1 bước (±30s) | Lệch đồng hồ là chuyện thường |
| `BR-MFA-05` | Cấm — **NEVER SMS OTP** | SIM swap; và số điện thoại là dữ liệu ta không thu |
| `BR-MFA-06` | Bật MFA → **thu hồi phiên khác** | Đảm bảo mọi phiên đăng nhập chưa xác thực hai lớp trước đó bị chấm dứt lập tức |
| `BR-MFA-07` | Mã khôi phục hiện **đúng một lần** lúc sinh | Buộc người dùng lưu trữ mã khôi phục an toàn ngay lập tức và tránh rò rỉ qua màn hình |
| `BR-MFA-08` | MFA cho User là **tuỳ chọn**; cho Manager là **bắt buộc** | Tối ưu trải nghiệm cho User nhưng bắt buộc bảo mật tối đa cho tài khoản quản trị hệ thống |
| `BR-MFA-09` | SNS Cấm — **NEVER thay được MFA.** Thử thách chạy sau mọi yếu tố thứ nhất | `BR-AUT-17`. "Đã đăng nhập Google" chứng minh danh tính, không chứng minh thiết bị thứ hai. Coi nó là yếu tố thứ hai là hạ MFA xuống một yếu tố |
| `BR-MFA-10` | Bật MFA cũng cần **reauth**, không chỉ phiên hợp lệ | Kẻ chiếm phiên bật MFA bằng thiết bị của họ sẽ khoá chủ tài khoản ra ngoài vĩnh viễn |
| `BR-MFA-11` | Sinh lại mã khôi phục cần **reauth + một mã hợp lệ**, và **vô hiệu toàn bộ** bộ cũ | Hai bộ mã cùng sống là hai cửa vào |
| `BR-MFA-12` | Sinh secret, URI và validate HOTP/TOTP phải dùng `otpauth` trong `packages/auth`; Cấm — **NEVER** tự viết Base32, HMAC hoặc thuật toán TOTP | Crypto primitive tự viết khó review, dễ lệch window/encoding và không tạo giá trị sản phẩm |

## 7. Data

`mfa_settings`: `(account_type, account_id)` · `secret_encrypted` · `confirmed_at` ·
`created_at`.

`mfa_recovery_codes`: `(account_type, account_id)` · `code_hash` · `used_at`.

TOTP: SHA-1, 6 chữ số, bước 30 giây (tương thích rộng nhất với app xác thực phổ biến).

## 8. API contract

### `POST /api/users/mfa/setup`

Auth `requireUserAuth()` + **reauth ≤5 phút**. Body rỗng. 200 → `{ secret, otpauth_url }`.
428 `REAUTH_REQUIRED`.

### `POST /api/users/mfa/verify`

Body `{ code }`. 200 → `{ recovery_codes: string[] }` — **hiện một lần duy nhất**.
401 `MFA_INVALID_CODE` · 429 `MFA_LOCKED`.

### `POST /api/users/mfa/disable`

Auth `requireUserAuth()` + **reauth ≤5 phút**. Body `{ code }`. 200.
401 `MFA_INVALID_CODE` · 422 khi thiếu `code` · 428 `REAUTH_REQUIRED`.

Cấm nhận `password` ở body — reauth đã làm việc đó và nó chấp nhận cả tài khoản
không có mật khẩu (`BR-MFA-03`).

### `POST /api/users/mfa/recovery-codes`

Auth `requireUserAuth()` + **reauth ≤5 phút**. Body `{ code }`. 200 → bộ mới, bộ cũ chết.

### `POST /api/guest/auth/users/mfa`

Body `{ code }` sau khi login trả 428. Dùng chung cho **cả** đăng nhập bằng mật khẩu và
bằng SNS. 401 `MFA_INVALID_CODE` · 429 `MFA_LOCKED`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-MFA-03 — tắt MFA cần cả reauth và mã
  Given user đã reauth trong 5 phút qua
  When gọi disable không kèm code
  Then trả 422
  And MFA vẫn bật

Scenario: BR-MFA-03 — mã đúng nhưng chưa reauth vẫn không tắt được
  Given user chưa reauth trong 5 phút qua
  When gọi disable kèm code hợp lệ
  Then trả 428 REAUTH_REQUIRED
  And MFA vẫn bật

Scenario: BR-MFA-03 — tài khoản chỉ có SNS tắt được MFA của mình
  Given user có password_hash NULL, đã liên kết Google, đã bật MFA
  When reauth bằng Google rồi gọi disable kèm code hợp lệ
  Then trả 200
  And MFA tắt

Scenario: BR-MFA-09 — SNS không thay được MFA
  Given user đã bật MFA và đã liên kết Google
  When đăng nhập bằng Google
  Then trả 428 MFA_REQUIRED
  And không cookie access nào được đặt trước khi nhập đúng mã

Scenario: BR-MFA-10 — bật MFA cần reauth
  Given user đăng nhập từ 30 phút trước, chưa reauth
  When gọi POST /api/users/mfa/setup
  Then trả 428 REAUTH_REQUIRED

Scenario: BR-MFA-11 — sinh lại mã khôi phục giết bộ cũ
  Given user có 10 mã khôi phục chưa dùng
  When reauth rồi sinh bộ mới
  Then một mã của bộ cũ dùng không được nữa

Scenario: BR-MFA-02 — mã khôi phục dùng một lần
  Given đã dùng một mã khôi phục
  When dùng lại mã đó
  Then trả 401

Scenario: BR-MFA-01 — secret không lưu plaintext
  When đọc hàng mfa_settings
  Then giá trị đã mã hoá

Scenario: BR-MFA-05 — không có SMS OTP
  When quét route auth
  Then không route nào gửi mã qua SMS

Scenario: BR-MFA-06 — bật MFA thu hồi phiên khác
  Given user đăng nhập 2 thiết bị
  When bật MFA ở thiết bị A
  Then thiết bị B mất phiên

Scenario: BR-MFA-07 — mã khôi phục hiện một lần
  Given đã xác nhận MFA và xem mã khôi phục
  When mở lại trang bảo mật
  Then không xem lại được mã cũ
  And chỉ có nút sinh bộ mới

Scenario: BR-MFA-12 — không tự viết TOTP
  When quét implementation MFA
  Then mọi sinh secret, otpauth URI và validate mã đi qua package otpauth
  And không có Base32, HMAC hoặc HOTP/TOTP implementation tự viết
```

## 10. Boundaries

**Always**
- Mã hoá secret, hash mã khôi phục.
- Yêu cầu reauth + mã khi tắt.
- Yêu cầu reauth khi bật và khi sinh lại mã khôi phục.
- Thu hồi phiên khác khi bật.
- Chạy thử thách MFA sau **mọi** yếu tố thứ nhất, kể cả SNS.
- Dùng `otpauth` sau interface domain trong `packages/auth`.

**Ask first**
- Đưa MFA vào MVP cho User (hiện P2, ngoài MVP).
- Đổi thuật toán hoặc độ dài mã.
- Đổi ngưỡng khoá 5 lần / 15 phút.

**Never**
- SMS OTP.
- Lưu secret plaintext.
- Cho xem lại mã khôi phục cũ.
- Tắt MFA chỉ bằng một yếu tố.
- Coi SNS là yếu tố thứ hai.
- Nhận `password` ở body route MFA — dùng reauth.
- Tự viết Base32, HMAC, HOTP hoặc TOTP.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Quy trình khôi phục khi User mất cả thiết bị lẫn mã khôi phục là gì? | P2 | Yêu cầu xác minh danh tính qua email chính chủ kèm thời gian chờ 48 giờ trước khi reset MFA thủ công bởi `super_admin` | người quyết |
| 2 | Tài khoản chỉ có SNS và đã bật MFA: nếu mất luôn tài khoản SNS thì reauth bằng gì? Hiện không có đường nào ngoài hỗ trợ thủ công | P2 | Phụ thuộc hoàn toàn vào hỗ trợ thủ công bởi `super_admin` sau khi xác minh chủ sở hữu | người quyết |
