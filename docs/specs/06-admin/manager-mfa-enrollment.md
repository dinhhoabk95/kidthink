---
spec: MANAGER-MFA-ENROLLMENT
title: Thiết lập MFA lần đầu cho Manager
area: admin
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-30
owns:
  - Thiết lập MFA lần đầu cho Manager khi chưa có phiên
  - Vòng đời challenge giữa các bước enrollment
depends_on:
  - ADMIN-AUTH
  - MFA
  - AUTH-TOKENS-SESSIONS
---

# Thiết lập MFA lần đầu cho Manager

## 1. Objective

[`admin-auth.md`](admin-auth.md) `BR-ADA-01` bắt buộc MFA cho mọi Manager và chặn Manager
chưa bật MFA khỏi **mọi** trang. Nhưng Manager đầu tiên do seed tạo ra với
`mfa_enabled = false` và không có hàng `mfa_settings`, còn toàn bộ route thiết lập MFA hiện
có đều đòi một phiên đã đăng nhập. Kết quả đo được ngày 2026-08-24: không tồn tại đường nào
để bất kỳ Manager nào đăng nhập lần đầu.

Spec này sở hữu đúng một outcome: Manager chưa có MFA tự thiết lập được nó **trước** khi có
phiên, đi qua chính challenge của bước mật khẩu. Nó không sở hữu màn hình đăng nhập
([`admin-auth.md`](admin-auth.md) §3), không sở hữu MFA của User ([`../03-account/mfa.md`](../03-account/mfa.md)),
và không sở hữu việc reset MFA cho người khác (`BR-ADA-08`).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Manager chưa bật MFA | Challenge hợp lệ từ bước mật khẩu | Nhận secret TOTP, xác nhận, nhận mã khôi phục |
| Manager đã bật MFA | — | Cấm — không vào được luồng này; mất thiết bị thì đi đường `BR-ADA-08` |
| `super_admin` khác | Phiên Manager + reauth | Reset MFA của người khác — thuộc [`admin-auth.md`](admin-auth.md), không thuộc file này |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `admin.{domain}/login` | Manager chưa bật MFA | Bước 2 của màn đăng nhập, không phải trang riêng |
| `POST /api/guest/auth/managers/mfa-setup` | Manager chưa bật MFA | Đổi challenge lấy secret + otpauth URI |
| `POST /api/guest/auth/managers/mfa` | Manager chưa bật MFA | Route sẵn có; xác nhận mã đầu tiên |

## 4. Main flow

1. Manager nhập email và mật khẩu đúng → `login` trả 428 `MFA_REQUIRED` kèm challenge và
   `mfa_enabled: false`.
2. Client thấy `mfa_enabled: false` → gọi `mfa-setup` kèm challenge đó.
3. Server tiêu thụ challenge cũ, sinh secret TOTP bằng `packages/auth` (`BR-MFA-12`), lưu
   `mfa_settings` với `confirmed_at = NULL`, và phát **challenge mới** bind vào secret chưa
   xác nhận.
4. Server trả `otpauth://` URI cùng challenge mới; secret hiện đúng một lần ở bước này.
5. Manager quét QR, nhập mã 6 số → client gọi route xác nhận với challenge mới.
6. Server xác nhận mã đúng → trong **một transaction**: set `confirmed_at`, set
   `managers.mfa_enabled = true`, sinh 10 mã khôi phục, ghi audit `manager_mfa_enrolled`.
7. Cấp phiên opaque một giờ như luồng đăng nhập bình thường (`BR-ADA-07`) và trả mã khôi
   phục đúng một lần (`BR-MFA-07`).

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Đã bật MFA | `managers.mfa_enabled = true` hoặc `confirmed_at` không NULL | 409 `MFA_ALREADY_ENABLED`; Cấm phát secret mới |
| Challenge sai hoặc hết hạn | Challenge không tồn tại trong Redis | 401 `INVALID_CREDENTIALS` |
| Dùng lại challenge cũ | Challenge đã bị tiêu thụ ở bước trước | 401 `INVALID_CREDENTIALS` |
| Bỏ dở giữa chừng | Có `mfa_settings` với `confirmed_at = NULL` | Lần đăng nhập sau ghi đè secret chưa xác nhận, không lỗi |
| Mã xác nhận sai | TOTP không khớp | 401, audit `manager_mfa_failed`; 5 lần → khoá 15 phút như [`admin-auth.md`](admin-auth.md) §5 |
| `is_active = false` | Tài khoản bị khoá | 403, không nói lý do chi tiết |
| Mã khôi phục lúc chưa xác nhận | Manager gửi mã khôi phục thay TOTP | 401 — chưa có bộ mã nào tồn tại |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MME-01` | Enrollment chỉ chạy khi `mfa_enabled = false` **và** không có `confirmed_at`; đã bật rồi thì Cấm — **NEVER** phát secret mới | Nếu không, ai cầm được mật khẩu sẽ tự thay thiết bị thứ hai và MFA thành một yếu tố |
| `BR-MME-02` | Luồng này Cấm — **NEVER** cấp phiên, cookie hay remember credential trước khi mã đầu tiên được xác nhận | `BR-ADA-01`: chưa có yếu tố thứ hai thì chưa có quyền vào trang nào |
| `BR-MME-03` | Mỗi bước tiêu thụ challenge cũ và phát challenge mới; challenge đã tiêu thụ Cấm — **NEVER** dùng lại | Giữ bất biến một-lần của [`admin-auth.md`](admin-auth.md) §4 khi luồng cần hai bước |
| `BR-MME-04` | Secret chưa xác nhận lưu `secret_encrypted` với `confirmed_at = NULL`; ghi đè secret **chưa** xác nhận là được, ghi đè secret **đã** xác nhận Cấm — **NEVER** | Bỏ dở phải thử lại được, nhưng thiết bị đang dùng thì không được thay lén |
| `BR-MME-05` | `confirmed_at`, `mfa_enabled = true` và bộ mã khôi phục ghi trong **một** transaction | Ba nửa trạng thái đều khoá Manager ra ngoài vĩnh viễn |
| `BR-MME-06` | Xác nhận thành công ghi audit `manager_mfa_enrolled`; thất bại ghi `manager_mfa_failed` | `BR-ADA-05`: mọi thay đổi thẩm quyền quản trị phải truy vết được |
| `BR-MME-07` | `mfa-setup` chịu rate limit hai trục theo IP và theo tài khoản như `login` | Không được để bước mới trở thành đường vòng quanh giới hạn của bước cũ |

## 7. Data

**Đọc:** `managers` (`mfa_enabled`, `is_active`), `mfa_settings`, challenge trong Redis.

**Ghi:** `mfa_settings` (upsert khi chưa xác nhận), `managers.mfa_enabled`,
`mfa_recovery_codes`, `audit_logs`, challenge Redis.

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `secret_encrypted` | text | Mã hoá bằng `MFA_ENCRYPTION_KEY` (`BR-MFA-01`); Cấm plaintext |
| `confirmed_at` | timestamptz | NULL khi chưa xác nhận; đặt đúng một lần |
| `challenge` | opaque 256-bit | TTL ≤ 5 phút, một mục đích, một lần dùng |
| `otpauth_uri` | URL | Trả đúng một lần; Cấm ghi log và Cấm lưu lại |

## 8. API contract

### `POST /api/guest/auth/managers/mfa-setup`

| | |
|---|---|
| Auth | Không có phiên; challenge từ `login` |
| Body | `{ challenge }` |
| 2xx | `{ otpauth_uri, challenge }` — challenge mới, bind vào secret chưa xác nhận |
| 4xx | `INVALID_CREDENTIALS` — challenge sai, hết hạn hoặc đã dùng |
| 4xx | `MFA_ALREADY_ENABLED` — tài khoản đã có MFA xác nhận |
| 4xx | `RATE_LIMITED` — vượt giới hạn hai trục |

### `POST /api/guest/auth/managers/mfa`

| | |
|---|---|
| Auth | Challenge phát ra từ `mfa-setup` hoặc từ `login` |
| Body | `{ challenge, code }` |
| 2xx | Phiên một giờ; lần enrollment đầu trả thêm `recovery_codes` đúng một lần |
| 4xx | `INVALID_CREDENTIALS` — mã sai hoặc challenge không hợp lệ |

## 9. Acceptance criteria

```gherkin
Scenario: BR-MME-01 — tài khoản đã bật MFA không vào được enrollment
  Given manager có mfa_settings.confirmed_at khác NULL
  When gọi mfa-setup với challenge hợp lệ
  Then trả MFA_ALREADY_ENABLED
  And không hàng mfa_settings nào bị ghi đè

Scenario: BR-MME-02 — chưa xác nhận thì chưa có phiên
  Given manager chưa bật MFA vừa gọi mfa-setup thành công
  Then response không đặt cookie phiên nào
  And không có hàng active_sessions
  And gọi GET /api/managers/auth/session trả 401

Scenario: BR-MME-03 — challenge cũ chết sau khi đổi
  Given manager gọi mfa-setup bằng challenge A và nhận challenge B
  When gọi mfa bằng challenge A
  Then trả INVALID_CREDENTIALS

Scenario: BR-MME-04 — bỏ dở rồi làm lại được
  Given manager có mfa_settings với confirmed_at NULL
  When đăng nhập lại và gọi mfa-setup
  Then secret cũ chưa xác nhận bị thay
  And chỉ có đúng một hàng mfa_settings cho tài khoản đó

Scenario: BR-MME-05 — xác nhận là một transaction
  Given manager nhập đúng mã đầu tiên
  Then confirmed_at, mfa_enabled và 10 mã khôi phục cùng tồn tại
  And không trạng thái nào tồn tại một mình khi transaction lỗi

Scenario: BR-MME-06 — enrollment được ghi audit
  When manager hoàn tất enrollment
  Then audit_logs có manager_mfa_enrolled cho đúng manager đó

Scenario: BR-MME-07 — bước mới không đi vòng qua rate limit
  Given IP đã chạm giới hạn của luồng đăng nhập manager
  When gọi mfa-setup từ chính IP đó
  Then trả RATE_LIMITED
```

## 10. Boundaries

**Always**

- Đọc [`admin-auth.md`](admin-auth.md) và [`../03-account/mfa.md`](../03-account/mfa.md) trước khi đổi luồng này.
- Sinh secret và validate TOTP bằng `packages/auth` (`BR-MFA-12`).
- Ghi audit mọi lần xác nhận và mọi lần thất bại.

**Ask first**

- Cho phép enrollment bằng đường khác ngoài challenge của `login`.
- Đổi TTL hoặc số bước của challenge.
- Thêm kênh MFA thứ hai cho Manager.

**Never**

- Không phát secret mới cho tài khoản đã xác nhận MFA.
- Không cấp phiên, cookie hay remember credential trước khi xác nhận mã đầu tiên.
- Không cho dùng lại challenge đã tiêu thụ.
- Không ghi `otpauth_uri` hoặc secret vào log.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Manager đầu tiên có cần bắt buộc đổi mật khẩu seed ngay trong lần enrollment không? | Chặn quy trình go-live, không chặn luồng enrollment | P1 | người quyết |
| 2 | Có giới hạn số lần enrollment lại trên cùng tài khoản trong 24 giờ không? | Chặn cấu hình chống lạm dụng P2 | P2 | Infra |
