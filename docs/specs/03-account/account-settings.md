---
spec: ACCOUNT-SETTINGS
title: Cài đặt tài khoản
area: account
status: approved
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Đổi thông tin tài khoản, mật khẩu, email
  - Đặt mật khẩu lần đầu cho tài khoản chỉ có SNS
  - Tuỳ chọn thông báo
depends_on:
  - LOGIN-AND-SESSION
  - PASSWORD-RECOVERY
  - NOTIFICATION-SERVICE
---

# Cài đặt tài khoản

## 1. Objective

Nơi User sửa những gì thuộc về **họ**, không phải về trẻ (đó là [`child-profile-crud.md`](child-profile-crud.md)).

## 2. Actors

User đã đăng nhập.

## 3. Entry points

`/me/settings` · `PATCH /api/users/profile` · `/password` · `/email` ·
`/notification-preferences`.

## 4. Main flow

1. Mở `/me/settings`, bốn nhóm §7.1.
2. Đổi tên hiển thị → lưu ngay, không cần reauth.
3. Đổi mật khẩu → **reauth** → nhập mật khẩu mới → mọi phiên khác chết.
4. Đổi email → **reauth** → gửi xác thực tới **email mới** → chỉ đổi khi xác thực xong.
5. Tài khoản chưa có mật khẩu → nút **"Đặt mật khẩu"** thay cho "Đổi mật khẩu" → reauth →
   nhập mật khẩu mới.

Reauth theo
[`../01-platform/auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md) §7.4 —
nó chấp nhận mật khẩu, OAuth với provider đã liên kết, hoặc mã TOTP. Trang này **không**
tự định nghĩa cách xác minh.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Email mới đã có người dùng | **409** |
| Chưa xác thực email mới | Email cũ vẫn hiệu lực; hiện "chờ xác thực" |
| Chưa reauth | **428** `REAUTH_REQUIRED`, `details.methods[]` |
| Reauth sai | 401, không đổi gì |
| Đổi mật khẩu | Gửi email thông báo tới địa chỉ hiện tại |
| Gọi "đổi mật khẩu" khi `password_hash` NULL | **409** `PASSWORD_NOT_SET` — dùng "đặt mật khẩu" |
| Đặt mật khẩu lần đầu | Cấm **Không** giết phiên khác — `BR-ACS-10` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ACS-01` | Đổi mật khẩu cần **reauth §7.4** | Phiên bị chiếm không được đổi mật khẩu. Reauth thay cho "mật khẩu cũ" vì `password_hash` nullable từ `BR-SIB-08` — tài khoản chỉ-SNS không có mật khẩu cũ để nhập |
| `BR-ACS-02` | Đổi mật khẩu → `refresh_token_version` +1 | `BR-LGN-06` |
| `BR-ACS-03` | Đổi email cần **reauth §7.4** + xác thực địa chỉ mới | Email là khoá khôi phục tài khoản |
| `BR-ACS-04` | Email cũ **vẫn hiệu lực** cho tới khi email mới xác thực | Không để tài khoản treo giữa hai địa chỉ |
| `BR-ACS-05` | Gửi thông báo tới **địa chỉ cũ** khi đổi email | Người thật biết nếu không phải họ đổi |
| `BR-ACS-06` | Tuỳ chọn thông báo **chỉ** cho loại định kỳ | `BR-NOT-01` |
| `BR-ACS-07` | Cấm — **NEVER thu thêm dữ liệu cá nhân** ở trang này | `BR-REG-08` |
| `BR-ACS-08` | Trang này không chứa cài đặt của trẻ | Tách bề mặt rõ ràng |
| `BR-ACS-09` | Tài khoản `password_hash` NULL hiện **"Đặt mật khẩu"**, không hiện "Đổi mật khẩu" | Ô "mật khẩu hiện tại" không điền được là ngõ cụt câm |
| `BR-ACS-10` | Đặt mật khẩu **lần đầu** **không** tăng `refresh_token_version` | Cấm có mật khẩu cũ để mất kiểm soát. Đá người dùng ra khỏi mọi thiết bị vì họ vừa **tăng** bảo mật là phạt nhầm hướng |
| `BR-ACS-11` | Nhóm **Bảo mật** liệt kê SNS đã liên kết, nhưng **không** sở hữu luồng đó — [`social-account-linking.md`](social-account-linking.md) | [`CONVENTIONS.md`](../CONVENTIONS.md) §2: contract bị copy sẽ drift |

## 7. Data

### 7.1 Bốn nhóm

| Nhóm | Nội dung |
|---|---|
| **Thông tin** | Tên hiển thị. Cấm tuổi, giới tính, số điện thoại |
| **Bảo mật** | Đổi / đặt mật khẩu · **liên kết SNS** ([`social-account-linking.md`](social-account-linking.md)) · **MFA** ([`mfa.md`](mfa.md)) · danh sách thiết bị · đăng xuất mọi nơi |
| **Thông báo** | Bật/tắt `weekly_progress`, `content_new` |
| **Quyền riêng tư** | Link [`consent-management.md`](consent-management.md) · xuất dữ liệu · xoá tài khoản |

### 7.2 Đổi email

```
Nhập email mới + mật khẩu
  → sinh token gửi tới email MỚI
  → xác thực trong 24h
  → users.email cập nhật + thông báo tới email CŨ
```

## 8. API contract

### `PATCH /api/users/profile`

Body `{ display_name }`. 200.

### `POST /api/users/password`

Auth `requireUserAuth()` + **reauth ≤5 phút**. Body `{ new_password }`.
200 → phiên khác chết. 409 `PASSWORD_NOT_SET` nếu tài khoản chưa có mật khẩu — dùng route
dưới. 428 `REAUTH_REQUIRED`.

### `PUT /api/users/password`

Đặt mật khẩu **lần đầu**. Auth `requireUserAuth()` + **reauth ≤5 phút**.
Body `{ new_password }`. 201 → **không** giết phiên khác (`BR-ACS-10`).
409 nếu đã có mật khẩu. 428 `REAUTH_REQUIRED`.

### `POST /api/users/email`

Auth `requireUserAuth()` + **reauth ≤5 phút**. Body `{ new_email }`.
200 → `{ pending_email }`. 409 nếu email đã tồn tại. 428 `REAUTH_REQUIRED`.

### `PUT /api/users/notification-preferences`

Body `{ weekly_progress, content_new }`. 422 nếu gửi loại giao dịch.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ACS-01 — đổi mật khẩu cần reauth
  Given user đăng nhập từ 30 phút trước, chưa reauth
  When gọi POST /api/users/password
  Then trả 428 REAUTH_REQUIRED
  And mật khẩu không đổi

Scenario: BR-ACS-09 — tài khoản chỉ có SNS thấy nút Đặt mật khẩu
  Given user có password_hash NULL
  When mở /me/settings
  Then nhóm Bảo mật hiện "Đặt mật khẩu"
  And không có ô "mật khẩu hiện tại"

Scenario: BR-ACS-09 — gọi nhầm route đổi mật khẩu
  Given user có password_hash NULL và đã reauth
  When gọi POST /api/users/password
  Then trả 409 PASSWORD_NOT_SET

Scenario: BR-ACS-10 — đặt mật khẩu lần đầu không giết phiên khác
  Given user có password_hash NULL, đăng nhập trên 2 thiết bị, đã reauth ở A
  When đặt mật khẩu lần đầu ở thiết bị A
  Then thiết bị B vẫn dùng được
  And refresh_token_version không đổi

Scenario: BR-ACS-01 — tài khoản chỉ có SNS đổi được email
  Given user có password_hash NULL và đã liên kết Google
  When reauth bằng Google rồi gọi POST /api/users/email
  Then trả 200

Scenario: BR-ACS-02 — đổi mật khẩu giết phiên khác
  Given user đăng nhập trên 2 thiết bị
  When đổi mật khẩu ở thiết bị A
  Then thiết bị B mất phiên

Scenario: BR-ACS-04 — email cũ còn hiệu lực khi chưa xác thực
  Given user yêu cầu đổi sang email mới
  When chưa xác thực
  Then đăng nhập bằng email cũ vẫn được

Scenario: BR-ACS-05 — thông báo tới email cũ
  When đổi email thành công
  Then một email thông báo được gửi tới địa chỉ cũ

Scenario: BR-ACS-06 — không tắt được thông báo giao dịch
  When PUT notification-preferences kèm order_approved = false
  Then trả 422

Scenario: BR-ACS-07 — không thu thêm dữ liệu
  When mở trang cài đặt
  Then không có ô tuổi, giới tính, số điện thoại, hay địa chỉ

Scenario: BR-ACS-08 — không có cài đặt của trẻ
  When mở trang cài đặt
  Then không có hạn mức giờ chơi hay avatar của trẻ
```

## 10. Boundaries

**Always**
- Yêu cầu reauth §7.4 cho thao tác nhạy cảm.
- Xác thực email mới trước khi đổi.
- Thông báo tới địa chỉ cũ.

**Ask first**
- Thêm trường vào hồ sơ User.
- Thêm loại thông báo tuỳ chọn.

**Never**
- Đổi mật khẩu hoặc email mà không reauth.
- Ép nhập "mật khẩu hiện tại" trên tài khoản không có mật khẩu.
- Thu thêm dữ liệu cá nhân.
- Trộn cài đặt của trẻ vào đây.
- Định nghĩa lại cách reauth ở trang này.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | ~~MFA cho User có vào MVP không?~~ **Chốt 2026-08-05: tuỳ chọn, P2, ngoài MVP** — [`mfa.md`](mfa.md) | — |
