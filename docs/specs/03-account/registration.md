---
spec: REGISTRATION
title: Đăng ký tài khoản
area: account
status: approved
mvp: true
phase: P0
reviewed: 2026-08-14
owns:
  - Luồng đăng ký bằng email
  - Ràng buộc đồng ý điều khoản
depends_on:
  - AUTH-TOKENS-SESSIONS
  - CHILD-DATA-COMPLIANCE
  - ERROR-CODES
---

# Đăng ký tài khoản

## 1. Objective

Chuyển một khách đang chơi thử thành một tài khoản, với **ma sát tối thiểu** nhưng thu đủ
đồng ý pháp lý.

Đây là bước chuyển đổi quan trọng nhất của phễu — mỗi trường thêm vào form làm giảm tỉ lệ
hoàn thành.

Spec này sở hữu **đăng ký bằng email + mật khẩu**. Đăng ký bằng Google / Facebook thuộc
[`social-login.md`](social-login.md) — cùng đích, khác luồng, và ràng buộc đồng ý ở §6 áp
cho **cả hai** (`BR-SCL-01`).

## 2. Actors

Guest → User. Cấm Trẻ không đăng ký.

## 3. Entry points

`/dang-ky` · `POST /api/guest/auth/users/register` · CTA sau khi guest chơi xong.

## 4. Main flow

1. Tải marker `terms` và `privacy` hiện hành, rồi nhập email + mật khẩu + tên hiển thị.
2. Tick đồng ý **Điều khoản** và **Chính sách quyền riêng tư** — hai checkbox riêng, không
   tick sẵn.
3. Tạo `users` `status = pending_verification`.
4. Trong cùng transaction, khoá và đối chiếu hai marker User đã xem, rồi ghi hai hàng
   `consent_logs` với `action='accepted'`.
5. Gửi email xác thực.
6. Đăng nhập được ngay ở chế độ **hạn chế** — chưa tạo được child profile.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Email đã đăng ký | **409** `EMAIL_ALREADY_REGISTERED` — chỉ ở luồng này |
| Mật khẩu yếu | 422 kèm yêu cầu cụ thể |
| Chưa tick đồng ý | 422, không tạo tài khoản |
| Marker đổi khi form đang mở | **409** `CONSENT_REQUIREMENT_CHANGED`; không tạo tài khoản, tải lại tài liệu và hai checkbox |
| Guest có phiên chơi ẩn danh | Sau đăng ký, **không** gộp dữ liệu — xem `BR-REG-06` |
| Đăng ký từ trang giá | Sau xác thực → chuyển thẳng tới luồng thanh toán |
| Chọn "Tiếp tục với Google / Facebook" | Rời luồng này sang [`social-login.md`](social-login.md) §4 nhánh B. Hai checkbox đồng ý **vẫn bắt buộc** |
| Email đã đăng ký, nhưng bằng SNS | **409** `EMAIL_ALREADY_REGISTERED` như mọi trùng email. Thông báo gợi ý thử nút SNS — không nói provider nào (`BR-REG-10`) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-REG-01` | Form đúng **3 trường**: email, mật khẩu, tên hiển thị | Mỗi trường thêm giảm tỉ lệ hoàn thành |
| `BR-REG-02` | Hai checkbox đồng ý **riêng**, không tick sẵn, không gộp | Đồng ý gộp không phải đồng ý tự nguyện, cụ thể |
| `BR-REG-03` | Ghi hai hàng `consent_logs` với `action='accepted'`, IP, user agent; đối chiếu marker đã xem trong cùng transaction tạo User | Bằng chứng phải gắn với yêu cầu hiện hành và không để tài khoản được tạo ở giữa một lần force |
| `BR-REG-04` | `pending_verification` **không tạo được child profile** | Không thu dữ liệu trẻ trước khi xác minh người lớn |
| `BR-REG-05` | Mật khẩu ≥8 ký tự, Cấm — **NEVER** ép ký tự đặc biệt | Quy tắc phức tạp làm người dùng viết mật khẩu ra giấy |
| `BR-REG-06` | Cấm — **NEVER tự gộp phiên chơi guest** vào tài khoản mới | Không xác định được phiên đó là của ai — thiết bị dùng chung là chuyện thường |
| `BR-REG-07` | Email so sánh **không phân biệt hoa thường** | Người dùng không nhớ mình gõ hoa hay thường lúc đăng ký; hai tài khoản cùng email là sự cố |
| `BR-REG-08` | Cấm — **NEVER thu tuổi, giới tính, số điện thoại, hay địa chỉ** khi đăng ký | Thu tối thiểu |
| `BR-REG-09` | Rate limit theo IP | [`rate-limiting.md`](../01-platform/rate-limiting.md) |
| `BR-REG-10` | 409 trùng email **không** nói tài khoản đó đăng ký bằng cách nào | Biết "email này dùng Google" là một mẩu thông tin cho kẻ tấn công chọn hướng, và ta không đổi được nó cho người dùng |
| `BR-REG-11` | Trang đăng ký hiện nút SNS **trước** form email khi provider đang bật | Đường ít ma sát nhất phải là đường dễ thấy nhất. Form vẫn đầy đủ ngay dưới, không giấu sau một cú bấm |

## 7. Data

### 7.1 Trường

| Trường | Ràng buộc |
|---|---|
| `email` | citext, hợp lệ, chưa tồn tại |
| `password` | ≥8 ký tự, không ép ký tự đặc biệt, kiểm danh sách mật khẩu phổ biến |
| `display_name` | 2–60 ký tự |
| `accept_terms` | true bắt buộc |
| `accept_privacy` | true bắt buộc |
| `terms_requirement_at` | `timestamptz \| null` từ `GET /api/guest/consent-requirements`; bắt buộc gửi lại nguyên giá trị |
| `privacy_requirement_at` | `timestamptz \| null` từ cùng response; bắt buộc gửi lại nguyên giá trị |

### 7.2 Sau đăng ký

`users.status = pending_verification` · 2 hàng `consent_logs` · 1 `verification_tokens` ·
1 `notifications` `email_verification` · opaque session một giờ ở chế độ hạn chế; remember chỉ
khi người đăng ký chủ động chọn.

### 7.3 Chế độ hạn chế

| Làm được | Cấm làm được |
|---|---|
| Xem catalog · chơi game `free` · xem giá | Tạo child profile · tạo đơn thanh toán · lưu tiến độ |

## 8. API contract

### `POST /api/guest/auth/users/register`

| | |
|---|---|
| Auth | không |
| Body | `{ email, password, display_name, accept_terms, accept_privacy, terms_requirement_at, privacy_requirement_at }` |
| 201 | Đặt cookie, trả `{ user: { uuid, display_name, status } }` |
| 409 | `EMAIL_ALREADY_REGISTERED` |
| 409 | `CONSENT_REQUIREMENT_CHANGED` |
| 422 | `VALIDATION_FAILED` |
| 429 | `RATE_LIMITED` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-REG-02 — đồng ý không tick sẵn
  When mở trang đăng ký
  Then hai checkbox đồng ý đều chưa tick
  And nút đăng ký bị vô hiệu cho tới khi tick cả hai

Scenario: BR-REG-03 — ghi consent
  When đăng ký thành công
  Then consent_logs có 2 hàng cho user đó
  And mỗi hàng có action accepted, ip_address, user_agent

Scenario: BR-REG-03 — force giữa lúc đăng ký không nhận consent cũ
  Given form được tải với marker A
  And super_admin force privacy tạo marker B
  When đăng ký gửi marker A
  Then trả 409 CONSENT_REQUIREMENT_CHANGED
  And không tạo users hay consent_logs

Scenario: BR-REG-04 — chưa xác thực không tạo được trẻ
  Given user vừa đăng ký, chưa xác thực email
  When gọi POST /api/users/children
  Then trả 403

Scenario: BR-REG-07 — email không phân biệt hoa thường
  Given a@example.com đã đăng ký
  When đăng ký với A@Example.com
  Then trả 409

Scenario: BR-REG-01 — form đúng 3 trường
  When render trang đăng ký
  Then chỉ có input email, mật khẩu, tên hiển thị
  And không có ô tuổi, giới tính, số điện thoại

Scenario: BR-REG-06 — không gộp phiên guest
  Given guest đã chơi 5 phiên rồi đăng ký
  When kiểm play_sessions
  Then 5 phiên cũ vẫn có child_profile_id NULL
  And không phiên nào được gán cho user mới

Scenario: BR-REG-05 — mật khẩu không ép ký tự đặc biệt
  When đăng ký với mật khẩu "chuoixanh123"
  Then thành công

Scenario: mật khẩu phổ biến bị chặn
  When đăng ký với mật khẩu "12345678"
  Then trả 422

Scenario: BR-REG-10 — 409 không nói tài khoản đăng ký bằng cách nào
  Given a@example.com đã đăng ký bằng Google
  When đăng ký bằng email với a@example.com
  Then trả 409 EMAIL_ALREADY_REGISTERED
  And body không chứa tên provider

Scenario: BR-REG-11 — nút SNS đứng trước form
  Given google đang bật
  When render trang đăng ký
  Then nút Tiếp tục với Google nằm trên form email trong thứ tự DOM
  And form email vẫn hiển thị đầy đủ, không bị thu gọn
```

## 10. Boundaries

**Always**
- Hai checkbox đồng ý riêng, không tick sẵn.
- Đối chiếu marker và ghi `consent_logs` action `accepted` trong cùng transaction tạo User.
- Rate limit theo IP.

**Ask first**
- Thêm trường vào form.
- Đổi quy tắc mật khẩu.
- Thêm nhà cung cấp SNS — [`../01-platform/oauth-provider-registry.md`](../01-platform/oauth-provider-registry.md) §7.1.

**Never**
- Tick sẵn đồng ý — kể cả ở luồng SNS.
- Thu tuổi, giới tính, số điện thoại, địa chỉ.
- Tạo child profile khi chưa xác thực email.
- Tự gộp phiên guest.
- Tiết lộ tài khoản trùng email đăng ký bằng cách nào.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Social login (Google) có vào MVP không?~~ **Chốt 2026-08-05: có, P1, Google + Facebook.** Luồng đồng ý giữ nguyên hai checkbox — [`social-login.md`](social-login.md) `BR-SCL-01` | — | Đã đóng | D-U |
| 2 | Guest có nên được đề nghị gộp phiên **tường minh** không, thay vì bỏ hẳn? | P1 conversion | P1 | người quyết |
