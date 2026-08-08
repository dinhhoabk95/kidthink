---
spec: LOGIN-AND-SESSION
title: Đăng nhập và quản lý phiên
area: account
status: approved
mvp: true
phase: P0
reviewed: 2026-08-08
owns:
  - Luồng đăng nhập User bằng email và mật khẩu
  - Quản lý thiết bị đang đăng nhập
depends_on:
  - AUTH-TOKENS-SESSIONS
  - ERROR-CODES
---

# Đăng nhập và quản lý phiên

## 1. Objective

Vào lại tài khoản, và thấy được **những thiết bị nào đang đăng nhập** để thu hồi khi cần.

Gộp hai thứ vào một spec vì đăng nhập **tạo ra** phiên — tách ra thì không spec được vòng
đời token ở đâu.

Đăng nhập bằng Google / Facebook thuộc [`social-login.md`](social-login.md). Nó **dùng lại
toàn bộ** phần phiên ở đây: cùng cặp token, cùng `active_sessions`, cùng màn hình quản lý
thiết bị, cùng đích `/me`. Khác nhau chỉ ở cách chứng minh danh tính lúc vào.

## 2. Actors

User. Cấm Trẻ không đăng nhập.

## 3. Entry points

`/dang-nhap` · `POST /api/guest/auth/users/login` · `POST /api/users/auth/refresh` ·
`/logout` · `/logout-all` · `GET /api/users/auth/sessions`.

## 4. Main flow

1. Nhập email + mật khẩu.
2. Xác thực → cấp access (15 phút) + refresh (7 ngày).
3. Ghi `active_sessions` với nhãn thiết bị suy từ user agent.
4. Chuyển tới `/me` hoặc trang đang định vào trước đó.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Sai thông tin | 401 `INVALID_CREDENTIALS` — không phân biệt sai email hay sai mật khẩu |
| `pending_verification` | Đăng nhập được, chế độ hạn chế, hiện nhắc xác thực |
| `suspended` | 403 `ACCOUNT_SUSPENDED` kèm cách liên hệ |
| `deleted` trong 30 ngày | 403 kèm nút **huỷ yêu cầu xoá** |
| Access hết hạn | Client tự refresh, không bắt đăng nhập lại |
| Refresh bị tái dùng | Thu hồi **toàn bộ** phiên |
| MFA đã bật | **428** `MFA_REQUIRED` → nhập mã → cấp token đầy đủ. Xem [`mfa.md`](mfa.md) |
| Chọn nút SNS | Rời luồng này sang [`social-login.md`](social-login.md) |
| Tài khoản chỉ có SNS, thử đăng nhập bằng mật khẩu | **401** `INVALID_CREDENTIALS` — giống hệt mọi lần sai. Cấm nói "tài khoản này dùng Google" (`BR-LGN-09`) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LGN-01` | Thông báo lỗi **không tiết lộ** email có tồn tại; thời gian phản hồi không lệch | Enumeration email |
| `BR-LGN-02` | Rate limit theo **IP và account** | `BR-RTL-01` |
| `BR-LGN-03` | Refresh token **xoay** mỗi lần dùng; tái dùng → thu hồi toàn bộ | `BR-AUT-04` |
| `BR-LGN-04` | `logout` xoá **phiên hiện tại**; `logout-all` tăng `refresh_token_version` | Hai thao tác khác nhau — xoá một phiên là rời thiết bị; xoá tất cả là nghi bị chiếm — không nên buộc chọn cái to hơn |
| `BR-LGN-05` | Danh sách thiết bị hiện **nhãn thô** (loại trình duyệt, hệ điều hành, thành phố từ IP), không IP đầy đủ | Đủ để nhận ra, không đủ để lộ vị trí chính xác |
| `BR-LGN-06` | Đổi mật khẩu → mọi phiên khác chết | Người đổi mật khẩu vì nghi lộ; phiên cũ còn sống là lỗ hổng |
| `BR-LGN-07` | Cấm — **NEVER "ghi nhớ đăng nhập" kéo dài quá 7 ngày** | Thiết bị dùng chung với trẻ |
| `BR-LGN-08` | Sau đăng nhập, **không tự vào khu vực chơi** — vào `/me` | Người lớn cần chọn trẻ trước |
| `BR-LGN-09` | Tài khoản có `password_hash` NULL trả **cùng** `INVALID_CREDENTIALS` khi thử mật khẩu | `BR-ERR-02`. "Tài khoản này dùng Google" cho kẻ tấn công biết nên nhắm vào đâu, và đó là thông tin ta không nợ ai |
| `BR-LGN-10` | Danh sách thiết bị hiện **cách đăng nhập** (`auth_method`) của từng phiên | Phiên tạo bằng SNS mà người dùng không nhớ đã bấm là dấu hiệu tài khoản SNS bị chiếm — họ cần thấy để nhận ra |

## 7. Data

### 7.1 Danh sách thiết bị

| Cột | Ví dụ |
|---|---|
| Thiết bị | "Chrome trên Android" |
| Vị trí gần đúng | "Hà Nội" |
| Cách đăng nhập | "Mật khẩu" \| "Google" \| "Facebook" — `BR-LGN-10` |
| Đăng nhập lúc | |
| Hoạt động gần nhất | |
| Đây là thiết bị này | cờ |
| Thu hồi | nút |

### 7.2 Sau đăng nhập điều hướng

| Ngữ cảnh | Đích |
|---|---|
| Mặc định | `/me` |
| Đến từ trang giá | `/me/subscription` |
| Đến từ một game bị khoá | Trang game đó |
| `pending_verification` | `/me` + banner nhắc xác thực |

## 8. API contract

### `POST /api/guest/auth/users/login`

Body `{ email, password }`. 200 → đặt cookie. 401 `INVALID_CREDENTIALS` ·
403 `ACCOUNT_SUSPENDED` · 429 `RATE_LIMITED`.

### `GET /api/users/auth/sessions` · `DELETE /api/users/auth/sessions/{id}`

### `POST /api/users/auth/logout` · `/logout-all`

## 9. Acceptance criteria

```gherkin
Scenario: BR-LGN-01 — không tiết lộ email tồn tại
  When đăng nhập sai mật khẩu với email đã đăng ký
  And đăng nhập với email chưa đăng ký
  Then cả hai trả cùng mã và thông báo
  And chênh lệch thời gian dưới 50ms

Scenario: BR-LGN-03 — tái dùng refresh thu hồi toàn bộ
  Given client đã refresh với token R
  When gửi lại R
  Then trả 401
  And mọi phiên của user bị thu hồi

Scenario: BR-LGN-06 — đổi mật khẩu giết phiên khác
  Given user đăng nhập trên 2 thiết bị
  When đổi mật khẩu trên thiết bị A
  Then thiết bị B mất phiên
  And thiết bị A vẫn dùng được

Scenario: BR-LGN-05 — không lộ IP đầy đủ
  When mở danh sách thiết bị
  Then không hiện địa chỉ IP đầy đủ

Scenario: BR-LGN-08 — không tự vào khu vực chơi
  When đăng nhập thành công
  Then trang đích là /me
  And không phải /play

Scenario: thu hồi một thiết bị
  Given user có 3 phiên
  When thu hồi phiên thứ 2
  Then thiết bị đó mất quyền ở request tiếp theo
  And hai phiên còn lại không ảnh hưởng

Scenario: tài khoản chờ xoá đăng nhập được để huỷ
  Given user đã yêu cầu xoá, còn trong 30 ngày
  When đăng nhập
  Then trả 403 kèm đường dẫn huỷ yêu cầu xoá

Scenario: BR-LGN-09 — tài khoản chỉ có SNS không lộ ra qua lỗi đăng nhập
  Given user a@example.com có password_hash NULL
  And user b@example.com chưa đăng ký
  When đăng nhập bằng mật khẩu với a@example.com
  And đăng nhập bằng mật khẩu với b@example.com
  Then cả hai trả cùng mã INVALID_CREDENTIALS và cùng thông báo
  And chênh lệch thời gian dưới 50ms

Scenario: BR-LGN-10 — danh sách thiết bị hiện cách đăng nhập
  Given user có một phiên tạo bằng mật khẩu và một phiên tạo bằng Google
  When mở danh sách thiết bị
  Then mỗi dòng hiện cách đăng nhập tương ứng
```

## 10. Boundaries

**Always**
- Thông báo lỗi không tiết lộ tài khoản tồn tại.
- Xoay refresh token.
- Vào `/me` sau đăng nhập.

**Ask first**
- Đổi TTL token.
- Thêm "ghi nhớ đăng nhập" dài hơn.
- Thêm nhà cung cấp SNS — [`../01-platform/oauth-provider-registry.md`](../01-platform/oauth-provider-registry.md) §7.1.

**Never**
- Phân biệt sai email và sai mật khẩu.
- Tiết lộ tài khoản đăng nhập bằng cách nào qua lỗi đăng nhập.
- Hiện IP đầy đủ.
- Tự vào khu vực chơi sau đăng nhập.
- Bỏ qua MFA vì đã đăng nhập bằng SNS.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có cần thông báo email khi đăng nhập từ thiết bị mới không? | Bảo mật P2 | P2 | Backend |
| 2 | Vị trí gần đúng từ IP cần dịch vụ geo — có đáng thêm phụ thuộc không? | Cấu hình IP P2 | P2 | Infra |
