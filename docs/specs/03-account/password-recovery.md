---
spec: PASSWORD-RECOVERY
title: Quên và đặt lại mật khẩu
area: account
status: draft
mvp: true
phase: P0
reviewed: 2026-08-05
owns:
  - Luồng quên mật khẩu và đặt lại
depends_on:
  - AUTH-TOKENS-SESSIONS
  - NOTIFICATION-SERVICE
---

# Quên và đặt lại mật khẩu

## 1. Objective

Lấy lại quyền truy cập **mà không tạo ra đường chiếm tài khoản**.

Luồng này là mục tiêu tấn công phổ biến nhất của mọi hệ thống có tài khoản — mọi quyết định
ở đây nghiêng về an toàn hơn tiện lợi.

## 2. Actors

User. Manager dùng luồng riêng có MFA.

## 3. Entry points

`/quen-mat-khau` · `/dat-lai-mat-khau?token=` ·
`POST /api/guest/auth/users/forgot-password` · `/reset-password`.

## 4. Main flow

1. Nhập email → **luôn trả 200**, thông báo giống nhau.
2. Nếu email tồn tại: sinh token, hash lưu, hạn **60 phút**, gửi email.
3. Bấm link → nhập mật khẩu mới.
4. Đặt lại → `refresh_token_version` **+1** → mọi phiên chết.
5. Chuyển tới đăng nhập, gửi email thông báo mật khẩu đã đổi.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Email không tồn tại | **200**, ❌ không gửi email, ❌ không nói gì khác |
| Token hết hạn | Trang hiện nút yêu cầu lại |
| Token đã dùng | Như hết hạn |
| Yêu cầu nhiều lần | Vô hiệu token cũ, hạn 3 lần/giờ |
| Tài khoản `suspended` | ❌ Không gửi email đặt lại |
| Tài khoản `password_hash` NULL (chỉ có SNS) | **Vẫn gửi** — luồng này **đặt** mật khẩu lần đầu. Xem `BR-PWR-10` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PWR-01` | `forgot-password` **luôn 200**, thông báo giống hệt | Enumeration email |
| `BR-PWR-02` | Token hash, hạn **60 phút**, dùng một lần | Ngắn hơn xác thực email vì hậu quả nặng hơn |
| `BR-PWR-03` | Đặt lại → `refresh_token_version` **+1** | Nếu tài khoản đã bị chiếm, đổi mật khẩu phải đá kẻ tấn công ra |
| `BR-PWR-04` | Gửi **email thông báo** sau khi đổi thành công | Người thật biết ngay nếu không phải họ đổi |
| `BR-PWR-05` | Yêu cầu mới **vô hiệu token cũ** | |
| `BR-PWR-06` | Rate limit theo **IP và email** | |
| `BR-PWR-07` | ❌ **NEVER cho đặt lại mà không có token** — không có "câu hỏi bí mật" | Câu hỏi bí mật là mật khẩu yếu hơn |
| `BR-PWR-08` | Mật khẩu mới theo cùng quy tắc đăng ký | |
| `BR-PWR-09` | ❌ **NEVER tự đăng nhập** sau khi đặt lại | Buộc dùng mật khẩu mới xác nhận người dùng nhớ nó |
| `BR-PWR-10` | Tài khoản chỉ có SNS **vẫn dùng được** luồng này — nó **đặt** mật khẩu thay vì đặt lại. Thông báo và mã trả về giống hệt | `BR-PWR-01`. Rẽ nhánh theo `password_hash IS NULL` sẽ tiết lộ tài khoản đăng ký bằng cách nào. Mô hình tin cậy ❌ không đổi: cả hai đều dựa trên kiểm soát hộp thư |
| `BR-PWR-11` | Luồng này ❌ **NEVER gỡ hay đụng tới** `social_identities` | Đặt mật khẩu là **thêm** một cách vào, ❌ không phải thay cách cũ. Gỡ SNS là thao tác tường minh ở [`social-account-linking.md`](./social-account-linking.md) |
| `BR-PWR-12` | Đặt mật khẩu qua luồng này **vẫn** tăng `refresh_token_version` — khác `BR-ACS-10` | Ở đây ta ❌ không biết ai yêu cầu. Ở `account-settings` người dùng đã reauth trong phiên đang dùng |

## 7. Data

`verification_tokens` với `purpose = 'password_reset'`, hạn 60 phút.

Thông báo cố định: *"Nếu email này đã đăng ký, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.
Vui lòng kiểm tra hộp thư."*

## 8. API contract

### `POST /api/guest/auth/users/forgot-password`

Body `{ email }`. **200 luôn**. 429 khi vượt hạn mức.

### `POST /api/guest/auth/users/reset-password`

Body `{ token, password }`. 200 → `{ ok: true }`. 410 `TOKEN_EXPIRED` ·
422 `VALIDATION_FAILED`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PWR-01 — luôn 200
  When gọi forgot-password với email chưa đăng ký
  Then trả 200
  And thông báo giống hệt trường hợp email đã đăng ký

Scenario: BR-PWR-03 — đặt lại giết mọi phiên
  Given user đăng nhập trên 3 thiết bị
  When đặt lại mật khẩu
  Then cả 3 thiết bị mất phiên

Scenario: BR-PWR-04 — thông báo sau khi đổi
  When đặt lại thành công
  Then một email thông báo được gửi tới địa chỉ đó

Scenario: BR-PWR-02 — token hết hạn sau 60 phút
  Given token sinh 61 phút trước
  When dùng
  Then trả 410

Scenario: BR-PWR-05 — yêu cầu mới vô hiệu token cũ
  Given token A đã gửi
  When yêu cầu lại
  Then token A không dùng được

Scenario: BR-PWR-07 — không có đường vòng
  When quét route auth
  Then không route nào đổi mật khẩu mà không có token hoặc phiên hợp lệ

Scenario: BR-PWR-09 — không tự đăng nhập sau đặt lại
  When đặt lại thành công
  Then không cookie phiên nào được đặt
  And chuyển tới trang đăng nhập

Scenario: BR-PWR-06 — hạn mức hai trục
  When gọi forgot-password 10 lần cho một email từ nhiều IP
  Then phần vượt bị 429

Scenario: BR-PWR-10 — tài khoản chỉ có SNS đặt được mật khẩu qua luồng này
  Given user có password_hash NULL và đã liên kết Google
  When gọi forgot-password rồi dùng token đặt mật khẩu
  Then trả 200
  And user đăng nhập được bằng mật khẩu

Scenario: BR-PWR-10 — không phân biệt tài khoản có mật khẩu hay không
  Given a@example.com có mật khẩu và b@example.com chỉ có SNS
  When gọi forgot-password cho cả hai
  Then cả hai trả 200 với cùng thông báo

Scenario: BR-PWR-11 — đặt mật khẩu không gỡ SNS
  Given user chỉ có SNS với 1 hàng social_identities
  When đặt mật khẩu qua luồng khôi phục
  Then hàng social_identities vẫn còn
  And user đăng nhập được bằng cả hai cách
```

## 10. Boundaries

**Always**
- Luôn trả 200 ở `forgot-password`.
- Hash token, hạn 60 phút, dùng một lần.
- Tăng `refresh_token_version` khi đổi.
- Gửi email thông báo sau khi đổi.

**Ask first**
- Đổi thời hạn token.
- Đổi hạn mức.

**Never**
- Tiết lộ email có tồn tại.
- Tiết lộ tài khoản có mật khẩu hay chỉ có SNS.
- Câu hỏi bí mật hay đường vòng khác.
- Tự đăng nhập sau khi đặt lại.
- Gỡ `social_identities` trong luồng này.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có cần thông báo cho email cũ khi User đổi email không? | `account-settings` |
