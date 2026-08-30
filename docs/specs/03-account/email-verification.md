---
spec: EMAIL-VERIFICATION
title: Xác thực email
area: account
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-08
owns:
  - Luồng xác thực email
  - Vòng đời token xác thực
depends_on:
  - REGISTRATION
  - NOTIFICATION-SERVICE
---

# Xác thực email

## 1. Objective

Xác minh **người lớn kiểm soát được hộp thư** trước khi cho thu dữ liệu trẻ.

Đây không phải chống spam đăng ký. Nó là điều kiện pháp lý: đồng ý cho xử lý dữ liệu trẻ
phải đến từ một người xác định được, và email là bằng chứng tối thiểu.

## 2. Actors

User ở trạng thái `pending_verification`.

## 3. Entry points

`/xac-thuc?token=` · `POST /api/guest/auth/users/verify-email` ·
`POST /api/users/auth/resend-verification`.

## 4. Main flow

1. Đăng ký → sinh token, hash lưu `verification_tokens`, hạn **24 giờ**.
2. Gửi email chứa link.
3. Bấm link → xác thực token → `users.status = active`, `email_verified_at = now`.
4. Token đánh dấu `used_at`.
5. Chuyển tới `/me/children/create` — bước tiếp theo tự nhiên.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Token hết hạn | Trang hiện nút gửi lại, không lỗi kỹ thuật |
| Token đã dùng | Nếu đã `active` → chuyển thẳng `/me`, không báo lỗi |
| Token không tồn tại | Thông báo chung, không nói token sai hay email nào |
| Gửi lại | Vô hiệu token cũ, hạn chế 3 lần/giờ |
| Đổi email trước khi xác thực | Vô hiệu token cũ, gửi tới email mới |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EVF-01` | Token lưu **dạng hash** | Rò DB không cho phép chiếm tài khoản |
| `BR-EVF-02` | Hạn **24 giờ**, dùng **một lần** | Dài hơn là rủi ro đường link bị lộ (forward, lịch sử trình duyệt); ngắn hơn là nhiều người không kịp bấm |
| `BR-EVF-03` | Gửi lại **vô hiệu token cũ** | Nhiều token sống cùng lúc là nhiều đường tấn công |
| `BR-EVF-04` | Token đã dùng + user `active` → **chuyển hướng êm**, không báo lỗi | Bấm lại link trong email là hành vi bình thường |
| `BR-EVF-05` | Cấm — **NEVER tiết lộ** email nào gắn với token | Kẻ tấn công đoán được token có thể xác định email — tổ hợp với brute force là chiếm tài khoản |
| `BR-EVF-06` | Chưa xác thực **không tạo được child profile** | `BR-REG-04` |
| `BR-EVF-07` | Rate limit gửi lại **3 lần/giờ** | Không giới hạn thì kẻ tấn công spam hộp thư người khác qua hệ thống của ta |
| `BR-EVF-08` | Sau xác thực chuyển tới **tạo hồ sơ trẻ**, không về trang chủ | Bước tiếp theo tự nhiên; giảm bỏ cuộc |

## 7. Data

`verification_tokens`: `(account_type, account_id)` · `purpose = 'email_verify'` ·
`token_hash` · `expires_at` · `used_at` · `created_at`.

Token: 32 byte ngẫu nhiên, base64url. Chỉ hash lưu DB.

## 8. API contract

### `POST /api/guest/auth/users/verify-email`

Body `{ token }`. 200 → `{ status: "active" }`. 410 `TOKEN_EXPIRED`. 404 token không hợp lệ.

### `POST /api/users/auth/resend-verification`

200 **luôn**, kể cả khi đã `active` — không tiết lộ trạng thái. 429 khi vượt hạn mức.

## 9. Acceptance criteria

```gherkin
Scenario: BR-EVF-01 — token lưu dạng hash
  Given một token đã sinh
  When đọc hàng verification_tokens
  Then giá trị lưu khác token trong email

Scenario: BR-EVF-02 — token dùng một lần
  Given token đã dùng
  When dùng lại
  Then không kích hoạt lại gì

Scenario: BR-EVF-04 — bấm lại link khi đã active
  Given user đã active
  When mở lại link xác thực cũ
  Then chuyển tới /me
  And không hiện lỗi

Scenario: BR-EVF-03 — gửi lại vô hiệu token cũ
  Given token A đã gửi
  When user yêu cầu gửi lại
  Then token A không dùng được nữa

Scenario: BR-EVF-06 — chưa xác thực không tạo trẻ
  Given user pending_verification
  When POST /api/users/children
  Then trả 403

Scenario: BR-EVF-07 — hạn mức gửi lại
  When gọi resend 4 lần trong một giờ
  Then lần thứ 4 trả 429

Scenario: BR-EVF-08 — chuyển tới tạo hồ sơ trẻ
  When xác thực thành công
  Then trang đích là /me/children/create
```

## 10. Boundaries

**Always**
- Hash token, hạn 24 giờ, dùng một lần.
- Gửi lại vô hiệu token cũ.
- Chuyển hướng êm khi đã xác thực.

**Ask first**
- Đổi thời hạn token.
- Đổi hạn mức gửi lại.

**Never**
- Lưu token dạng thô.
- Tiết lộ email gắn với token.
- Cho tạo hồ sơ trẻ khi chưa xác thực.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có cho phép dùng sản phẩm hạn chế mãi mà không xác thực không, hay khoá sau N ngày? | Quyền truy cập P1 | P1 | người quyết |
