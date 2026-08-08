---
spec: SOCIAL-LOGIN
title: Đăng ký và đăng nhập bằng mạng xã hội
area: account
status: draft
mvp: true
phase: P1
reviewed: 2026-08-05
owns:
  - Luồng đăng ký lần đầu bằng SNS
  - Luồng đăng nhập lại bằng SNS
  - Quy tắc xử lý email trùng giữa SNS và tài khoản sẵn có
depends_on:
  - OAUTH-PROVIDER-REGISTRY
  - AUTH-TOKENS-SESSIONS
  - REGISTRATION
  - CHILD-DATA-COMPLIANCE
  - ERROR-CODES
---

# Đăng ký và đăng nhập bằng mạng xã hội

## 1. Objective

Vào được KidThink bằng **một lần bấm** thay vì điền form và chờ email xác thực.

Đây là đòn bẩy chuyển đổi lớn nhất còn lại của phễu:
[[`registration.md`](registration.md)](registration.md) §1 đã cắt form xuống 3 trường, và bước tốn thời gian
nhất còn lại là vòng xác thực email. SNS bỏ được vòng đó khi provider đã xác minh email.

Spec này sở hữu **đăng ký lần đầu và đăng nhập lại**. Việc gắn thêm SNS thứ hai vào tài
khoản đang dùng thuộc
[`social-account-linking.md`](social-account-linking.md) — hai outcome khác nhau, dùng
riêng được.

Cơ chế OAuth (PKCE, `state`, đổi token, ánh xạ hồ sơ) thuộc
[`../01-platform/oauth-provider-registry.md`](../01-platform/oauth-provider-registry.md).
File này bắt đầu từ `NormalizedProfile` trở đi.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Guest | — | Đăng ký mới hoặc đăng nhập bằng Google / Facebook |
| User | phiên hợp lệ | Đăng nhập lại bằng SNS đã liên kết |
| Trẻ | — | Cấm. `BR-CDC-11` — trẻ không có credential |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/dang-ky` · `/dang-nhap` | Guest | Nút "Tiếp tục với Google" · "Tiếp tục với Facebook" |
| `GET /api/guest/auth/oauth/{provider}/start?intent=login` | Guest | Bắt đầu |
| `POST /api/guest/auth/users/social-login` | — | Nội bộ, gọi từ callback sau khi có `NormalizedProfile` |
| `/dang-ky/dong-y` | Guest | Màn hình đồng ý, **chỉ** ở lần đăng ký đầu tiên |

## 4. Main flow

**A — đã liên kết (đăng nhập lại)**

1. Bấm "Tiếp tục với Google" → luồng OAuth → `NormalizedProfile`.
2. Tra `social_identities` theo `(provider, provider_user_id)` → **thấy**.
3. `users.status` hợp lệ → cấp cặp token, ghi `active_sessions`, cập nhật `last_login_at`.
4. Về `/me` (hoặc `return_to` trong whitelist). Giống hệt sau khi đăng nhập bằng mật khẩu —
   [`login-and-session.md`](login-and-session.md) §7.2.

**B — chưa liên kết, email chưa có ai dùng (đăng ký mới)**

1. Tra `(provider, provider_user_id)` → **không thấy**.
2. Tra `users.email` = `email_at_provider` → **không thấy**.
3. Hiện màn hình đồng ý `/dang-ky/dong-y`: tên hiển thị (điền sẵn từ provider, sửa được) +
   **hai checkbox riêng**, không tick sẵn — `BR-REG-02`.
4. Tạo `users` + hàng `social_identities` + 2 hàng `consent_logs` trong **một transaction**.
5. `users.status` = `active` nếu provider khẳng định email đã xác minh; ngược lại
   `pending_verification` và gửi email xác thực — `BR-SCL-05`.
6. Cấp token, về `/me`.

**C — chưa liên kết, email đã có tài khoản**

1. Bước 1–2 như trên, nhưng tra `users.email` → **thấy**.
2. **Dừng.** Cấm tạo tài khoản, không liên kết, không cấp phiên.
3. **409** `SOCIAL_EMAIL_CONFLICT`, đưa về `/dang-nhap` kèm thông báo chỉ đường:
   *"Email này đã có tài khoản KidThink. Hãy đăng nhập rồi liên kết {provider} trong
   Cài đặt → Bảo mật."* Xem `BR-SCL-04`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| User huỷ ở màn hình provider | `error=access_denied` | Về `/dang-nhap`, không thông báo lỗi đỏ |
| Provider không trả email | Facebook cho phép | Màn hình đồng ý **bắt nhập email**; `users.email` NOT NULL như mọi tài khoản, `status = pending_verification` — `BR-SCL-06` |
| Cấm Chưa tick đồng ý | Nhánh B bước 3 | **422**, không tạo tài khoản, không cấp phiên |
| `users.status = suspended` | Nhánh A | **403** `ACCOUNT_SUSPENDED` — giống luồng mật khẩu |
| `users.status = deleted` trong 30 ngày | Nhánh A | **403** kèm nút huỷ yêu cầu xoá — `BR-LGN` nhánh tương ứng |
| MFA đã bật | Nhánh A | **428** `MFA_REQUIRED` → nhập mã → cấp token đầy đủ. Xem `BR-SCL-07` |
| `provider_user_id` đã gắn user khác | Nhánh B | **409** `SOCIAL_IDENTITY_ALREADY_LINKED`. Chỉ xảy ra nếu provider tái dùng `sub` — bất thường, log mức cao |
| Bỏ dở giữa màn hình đồng ý | Đóng tab ở nhánh B bước 3 | Cấm hàng `users` nào được tạo. Transaction ở bước 4 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SCL-01` | Đăng ký bằng SNS **vẫn phải** thu hai đồng ý riêng, không tick sẵn | `BR-REG-02`. Đồng ý của provider không phải đồng ý với **ta**; Nghị định 13 yêu cầu đồng ý cụ thể, tự nguyện |
| `BR-SCL-02` | Ghi `consent_logs` kèm `policy_version`, IP, user agent — y hệt đăng ký thường | `BR-REG-03`. Bằng chứng không được yếu đi vì đổi cách đăng ký |
| `BR-SCL-03` | Tra danh tính theo `(provider, provider_user_id)`, Cấm — **NEVER theo email** | `BR-OAP-10`. Email đổi được ở phía provider; `sub` thì không |
| `BR-SCL-04` | Cấm — **NEVER tự liên kết SNS vào tài khoản sẵn có chỉ vì trùng email.** Trả 409 và bắt đăng nhập rồi liên kết ở [`social-account-linking.md`](social-account-linking.md) | Đây là đường chiếm tài khoản trực tiếp: ai tạo được tài khoản SNS mang email của nạn nhân sẽ vào được tài khoản KidThink của họ. Facebook không khẳng định email đã xác minh (`BR-OAP-08`) |
| `BR-SCL-05` | `status = active` ngay **chỉ khi** provider khẳng định email đã xác minh; ngược lại `pending_verification` + gửi email xác thực | Bỏ vòng xác thực chỉ hợp lệ khi có bên khác đã làm việc đó thật |
| `BR-SCL-06` | Tài khoản SNS không có email → bắt nhập email ở màn hình đồng ý, `status = pending_verification` | Email là khoá khôi phục tài khoản (`BR-ACS-03`). Tài khoản không có email là tài khoản không khôi phục được |
| `BR-SCL-07` | MFA đã bật thì SNS **không bỏ qua được** — vẫn 428 `MFA_REQUIRED` | SNS là yếu tố thứ nhất, không phải yếu tố thứ hai |
| `BR-SCL-08` | Tài khoản tạo bằng SNS có `password_hash` **NULL** — hợp lệ, không bắt đặt mật khẩu | Ma sát tối thiểu (`BR-REG-01`). Hệ quả về gỡ liên kết ở `BR-SLK-04` |
| `BR-SCL-09` | Thông báo lỗi **không tiết lộ** tài khoản có tồn tại — trừ nhánh C, nơi caller **đã chứng minh** kiểm soát hộp thư đó | `BR-ERR-02`. Nhánh C không phải kênh liệt kê: muốn thấy thông báo đó phải đăng nhập được vào chính SNS mang email ấy |
| `BR-SCL-10` | Cấm — **NEVER gộp phiên chơi guest** vào tài khoản mới tạo bằng SNS | `BR-REG-06`. Cùng lý do: thiết bị dùng chung |
| `BR-SCL-11` | Rate limit theo **IP và `provider_user_id`** | `BR-RTL-01` |
| `BR-SCL-12` | Tạo `users` + `social_identities` + `consent_logs` trong **một transaction** | Tài khoản không có consent là tài khoản không dùng hợp pháp được |
| `BR-SCL-13` | Nút SNS chỉ hiện khi `is_enabled` | Nút dẫn tới 404 làm người dùng nghĩ sản phẩm hỏng |
| `BR-SCL-14` | Sau đăng nhập SNS, **không tự vào khu vực chơi** — vào `/me` | `BR-LGN-08` |

## 7. Data

**Đọc:** `users`, `social_identities`, `mfa_settings`.
**Ghi:** `users`, `social_identities`, `consent_logs`, `active_sessions`,
`verification_tokens` (nhánh `BR-SCL-05`).

### 7.1 `social_identities`

Cột đầy đủ ở
[`../01-platform/schema-identity-billing.md`](../01-platform/schema-identity-billing.md)
§7.3a. File này không lặp lại.

Ràng buộc quan trọng với luồng này: `UNIQUE (provider, provider_user_id)` — một tài khoản
SNS gắn được vào **đúng một** User.

### 7.2 Màn hình đồng ý — nhánh B

| Trường | Nguồn | Ràng buộc |
|---|---|---|
| `display_name` | Điền sẵn từ provider, sửa được | 2–60 ký tự |
| `email` | Điền sẵn, **chỉ đọc** khi provider có trả; nhập tay khi không có | citext, hợp lệ |
| `accept_terms` | — | true bắt buộc, không tick sẵn |
| `accept_privacy` | — | true bắt buộc, không tick sẵn |

Cấm ô tuổi, giới tính, số điện thoại, địa chỉ — `BR-REG-08`.

### 7.3 Trạng thái sau đăng ký

| Provider khẳng định email đã xác minh | `users.status` | Gửi email xác thực |
|---|---|---|
| (Google, `email_verified = true`) | `active` | không |
| Cấm (Facebook, luôn) | `pending_verification` | |
| Provider không trả email | `pending_verification` | tới email người dùng tự nhập |

`pending_verification` giữ nguyên **chế độ hạn chế** ở [`registration.md`](registration.md) §7.3 — chưa tạo
được hồ sơ trẻ.

## 8. API contract

### `GET /api/guest/auth/oauth/{provider}/start?intent=login`

Xem [`../01-platform/oauth-provider-registry.md`](../01-platform/oauth-provider-registry.md)
§8.

### `POST /api/guest/auth/users/social-login`

| | |
|---|---|
| Auth | không — cookie `tm_oauth` đã được xác thực ở callback |
| Body | `{ provider, consent?: { display_name, email?, accept_terms, accept_privacy } }` |
| 200 | Nhánh A — đặt cookie, trả `{ user: { uuid, display_name, status } }` |
| 201 | Nhánh B — như trên, tài khoản vừa tạo |
| 403 | `ACCOUNT_SUSPENDED` |
| 409 | `SOCIAL_EMAIL_CONFLICT` — `details.provider`, `details.masked_email` |
| 409 | `SOCIAL_IDENTITY_ALREADY_LINKED` |
| 422 | `VALIDATION_FAILED` — thiếu đồng ý hoặc email không hợp lệ |
| 428 | `MFA_REQUIRED` |
| 429 | `RATE_LIMITED` |

### `POST /api/guest/auth/users/mfa`

Dùng lại route ở [`mfa.md`](mfa.md) §8. SNS không có route MFA riêng.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SCL-04 — email trùng không bao giờ tự liên kết
  Given đã có user email a@example.com đăng ký bằng mật khẩu
  And chưa có social_identities nào cho user đó
  When một người đăng nhập Google với email a@example.com
  Then trả 409 SOCIAL_EMAIL_CONFLICT
  And không hàng social_identities nào được tạo
  And không cookie phiên nào được đặt

Scenario: BR-SCL-01 — đăng ký SNS vẫn phải tick hai đồng ý
  Given một tài khoản Google chưa từng dùng KidThink
  When hoàn tất OAuth
  Then màn hình đồng ý hiện hai checkbox chưa tick
  And nút hoàn tất bị vô hiệu cho tới khi tick cả hai

Scenario: BR-SCL-02 — consent được ghi đủ
  When đăng ký bằng Google thành công
  Then consent_logs có 2 hàng cho user đó
  And mỗi hàng có policy_version, ip_address, user_agent

Scenario: BR-SCL-05 — Facebook không được vào thẳng active
  Given Facebook trả email b@example.com
  When đăng ký hoàn tất
  Then users.status là pending_verification
  And một email xác thực được gửi

Scenario: BR-SCL-05 — Google email_verified vào thẳng active
  Given Google trả email c@example.com với email_verified true
  When đăng ký hoàn tất
  Then users.status là active
  And không email xác thực nào được gửi

Scenario: BR-SCL-03 — đổi email ở provider vẫn đăng nhập đúng tài khoản
  Given user đã liên kết Google với provider_user_id S và email cũ
  When Google trả cùng S nhưng email mới
  Then đăng nhập vào đúng tài khoản đó
  And users.email không bị ghi đè

Scenario: BR-SCL-07 — MFA không bị SNS bỏ qua
  Given user đã bật MFA và đã liên kết Google
  When đăng nhập bằng Google
  Then trả 428 MFA_REQUIRED
  And không cookie access nào được đặt trước khi nhập đúng mã

Scenario: BR-SCL-08 — tài khoản SNS không có mật khẩu là hợp lệ
  When đăng ký bằng Google
  Then users.password_hash là NULL
  And không màn hình nào bắt đặt mật khẩu

Scenario: BR-SCL-12 — bỏ dở màn hình đồng ý không để lại rác
  Given OAuth đã xong nhưng người dùng đóng tab ở màn hình đồng ý
  When đếm hàng users và social_identities
  Then không hàng nào được tạo

Scenario: BR-SCL-10 — không gộp phiên guest
  Given guest đã chơi 5 phiên rồi đăng ký bằng Google
  When kiểm play_sessions
  Then 5 phiên cũ vẫn có child_profile_id NULL

Scenario: BR-SCL-14 — không tự vào khu vực chơi
  When đăng nhập bằng Google thành công
  Then trang đích là /me
  And không phải /play

Scenario: BR-SCL-13 — provider tắt thì không hiện nút
  Given facebook có is_enabled false
  When mở /dang-nhap
  Then không có nút Tiếp tục với Facebook
```

## 10. Boundaries

**Always**
- Tra danh tính theo `(provider, provider_user_id)`.
- Thu hai đồng ý riêng ở lần đăng ký đầu, ghi `consent_logs`.
- Một transaction cho `users` + `social_identities` + `consent_logs`.
- Giữ MFA là bước bắt buộc.
- Vào `/me` sau đăng nhập.

**Ask first**
- Bỏ màn hình đồng ý cho một provider nào đó.
- Cho `status = active` khi provider không khẳng định email.
- Thêm trường vào màn hình đồng ý.

**Never**
- Tự liên kết vào tài khoản sẵn có vì trùng email.
- Tra danh tính theo email.
- Bỏ qua MFA vì đăng nhập bằng SNS.
- Gộp phiên guest.
- Tạo tài khoản khi chưa đủ hai đồng ý.
- Ghi đè `users.email` bằng email mới của provider.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Nhánh C trả 409 là đúng bảo mật nhưng là ngõ cụt của phễu. Có nên gửi email "ai đó vừa thử đăng nhập bằng Google vào tài khoản của bạn — bấm đây để liên kết" không? Thêm một kênh xác minh thật, nhưng cũng thêm một email do người lạ kích hoạt được | P2 · [`notification-service.md`](../01-platform/notification-service.md) |
| 2 | Ở nhánh B khi provider không trả email, ta bắt nhập email nhưng Cấm chưa biết người dùng có kiểm soát nó không cho tới khi họ xác thực. Có nên chặn tạo `users` cho tới lúc đó không? | P1 |
