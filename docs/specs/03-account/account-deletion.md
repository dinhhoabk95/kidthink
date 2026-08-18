---
spec: ACCOUNT-DELETION
title: Xoá tài khoản và dữ liệu
area: account
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Luồng yêu cầu xoá và huỷ yêu cầu
  - Phạm vi dữ liệu bị xoá
depends_on:
  - CHILD-DATA-COMPLIANCE
  - JOB-QUEUE
---

# Xoá tài khoản và dữ liệu

## 1. Objective

Quyền xoá dữ liệu là **nghĩa vụ pháp lý** theo Nghị định 13/2023, không phải tính năng
tuỳ chọn. Nó phải thực sự xảy ra, trong thời hạn kiểm được.

Nó cũng phải **hoàn tác được trong 30 ngày** — xoá nhầm tài khoản có 8 tuần dữ liệu học của
con là mất mát không thay thế được.

## 2. Actors

User. Admin **không** xoá thay — `BR-USM-07`.

## 3. Entry points

`/me/settings/delete` · `POST /api/users/account/delete` · `/delete/cancel` ·
job `account:purge`.

## 4. Main flow

1. User mở trang xoá, đọc **danh sách những gì sẽ mất**.
2. **Reauth** theo
   [`../01-platform/auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md) §7.4.
3. `users.status = deleted`, `purge_at = now + 30 ngày`,
   `child_profiles.status = pending_deletion`.
4. Mọi phiên bị thu hồi ngay.
5. Gửi email xác nhận kèm **cách huỷ**.
6. Sau 30 ngày, job `account:purge` xoá thật §7.2.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Huỷ yêu cầu trong 30 ngày | Khôi phục **toàn bộ**, `status = active` |
| Đăng nhập trong 30 ngày | 403 kèm nút huỷ yêu cầu xoá |
| Còn entitlement hiệu lực | Cảnh báo mất quyền còn lại, không tự hoàn tiền |
| Purge fail | **Alert**, retry một lần, không im lặng |
| Yêu cầu bản sao dữ liệu trước khi xoá | Gợi ý export trước, không ép |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ADL-01` | Xoá thực sự xảy ra trong **30 ngày** | `BR-CDC-10` |
| `BR-ADL-02` | Hoàn tác được **trong 30 ngày** | Xoá nhầm là mất dữ liệu học không thay thế được |
| `BR-ADL-03` | Xác nhận bằng **reauth §7.4**, không chỉ một nút | Thao tác không hoàn tác sau 30 ngày. Reauth thay cho "mật khẩu" vì tài khoản chỉ-SNS không có mật khẩu (`BR-SIB-08`) — và không được vì thế mà xoá dễ hơn |
| `BR-ADL-04` | `telemetry_events` **ẩn danh hoá** (`child_uuid = NULL`), không xoá cứng | Giữ khả năng phân tích tổng hợp mà không giữ liên kết cá nhân |
| `BR-ADL-05` | `audit_logs` và `consent_logs` **giữ lại** | Nghĩa vụ pháp lý; chúng không chứa PII của trẻ |
| `BR-ADL-06` | Admin Cấm — **NEVER xoá thay** User | Quyền của chủ thể dữ liệu |
| `BR-ADL-07` | Trang xoá liệt kê **cụ thể** cái gì sẽ mất | Xoá mù là xoá nhầm |
| `BR-ADL-08` | Purge fail → **alert**, không retry mù | Thao tác phá huỷ không retry tự động nhiều lần |
| `BR-ADL-09` | Sau purge, email đó **đăng ký lại được** | Cấm giữ danh sách cấm |
| `BR-ADL-10` | Purge **xoá cứng** `social_identities` | `users` chỉ được ẩn danh chứ không xoá hàng, nên `ON DELETE CASCADE` không chạy. Bỏ sót thì `UNIQUE (provider, provider_user_id)` khoá vĩnh viễn tài khoản Google đó khỏi MindKid — người dùng không đăng ký lại được, và không có cách nào tự sửa |

## 7. Data

### 7.1 Trang xoá liệt kê

> Khi xoá tài khoản, những dữ liệu sau sẽ bị xoá vĩnh viễn sau 30 ngày:
> - N hồ sơ bé và toàn bộ tiến độ học
> - Lịch sử chơi và báo cáo
> - Quyền truy cập còn lại của gói (còn X ngày)
>
> Chúng tôi giữ lại (theo quy định pháp luật): lịch sử giao dịch và bản ghi đồng ý — không
> chứa thông tin của bé.

### 7.2 Job `account:purge`

```
DELETE child_profiles, mastery_state, level_params, play_sessions,
       child_session_summaries, child_daily_stats, curriculum_enrollments,
       curriculum_item_progress, quota_usage, active_sessions,
       verification_tokens, mfa_settings, mfa_recovery_codes,
       social_identities, notifications
UPDATE telemetry_events SET child_uuid = NULL
UPDATE users SET email = 'deleted+<uuid>@…', display_name = 'Đã xoá',
                 password_hash = NULL
GIỮ    audit_logs, consent_logs, payment_orders (ẩn danh phần liên kết)
```

`payment_orders` giữ lại vì nghĩa vụ kế toán, nhưng liên kết tới User được ẩn danh.

## 8. API contract

### `POST /api/users/account/delete`

Auth `requireUserAuth()` + **reauth ≤5 phút**. Body rỗng. 200 → `{ purge_at }`.
428 `REAUTH_REQUIRED`.

### `POST /api/users/account/delete/cancel`

Chỉ trong 30 ngày. 200 → `{ status: "active" }`. 410 nếu đã purge.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ADL-01 — xoá thực sự xảy ra
  Given user yêu cầu xoá vào ngày D
  When job purge chạy ngày D+31
  Then child_profiles và mastery_state của user đó không còn hàng nào

Scenario: BR-ADL-02 — huỷ được trong 30 ngày
  Given user yêu cầu xoá 10 ngày trước
  When user huỷ yêu cầu
  Then status trở lại active
  And toàn bộ hồ sơ trẻ và tiến độ còn nguyên

Scenario: BR-ADL-03 — cần reauth
  Given user đăng nhập từ 30 phút trước, chưa reauth
  When gọi delete
  Then trả 428 REAUTH_REQUIRED
  And users.status không đổi

Scenario: BR-ADL-03 — tài khoản chỉ có SNS vẫn phải reauth
  Given user có password_hash NULL và đã liên kết Google
  When reauth bằng Google rồi gọi delete
  Then trả 200

Scenario: BR-ADL-10 — purge xoá danh tính SNS
  Given user có 2 hàng social_identities và bị purge
  Then còn 0 hàng social_identities cho user đó
  And chính tài khoản Google đó đăng ký mới lại được

Scenario: BR-ADL-04 — telemetry ẩn danh không xoá cứng
  Given user bị purge
  Then telemetry_events của trẻ đó vẫn còn hàng
  And child_uuid là NULL

Scenario: BR-ADL-05 — audit và consent giữ lại
  Given user bị purge
  Then audit_logs và consent_logs của user đó vẫn còn

Scenario: BR-ADL-06 — admin không xoá thay
  When quét route admin
  Then không route nào đặt users.status = deleted

Scenario: BR-ADL-07 — liệt kê cụ thể
  When mở trang xoá
  Then hiện đúng số hồ sơ trẻ và số ngày gói còn lại

Scenario: BR-ADL-09 — đăng ký lại được sau purge
  Given email a@x.com đã bị purge
  When đăng ký lại với email đó
  Then thành công

Scenario: đăng nhập trong 30 ngày dẫn tới huỷ
  Given user đã yêu cầu xoá
  When đăng nhập
  Then trả 403 kèm đường dẫn huỷ
```

## 10. Boundaries

**Always**
- Xác nhận bằng reauth §7.4.
- Xoá cứng `social_identities` trong purge.
- Liệt kê cụ thể cái gì mất.
- Ẩn danh telemetry thay vì xoá cứng.
- Alert khi purge fail.

**Ask first**
- Đổi thời hạn 30 ngày.
- Thêm bảng vào phạm vi purge.

**Never**
- Admin xoá thay User.
- Xoá `audit_logs` hay `consent_logs`.
- Retry mù job purge.
- Giữ danh sách email cấm đăng ký lại.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Có hoàn tiền phần gói chưa dùng khi xoá không?~~ **Đóng 2026-08-16 (D-RF)**: Không hoàn tiền tự động trong ứng dụng khi xoá tài khoản; nếu có thoả thuận đặc biệt, User liên hệ hỗ trợ trước khi xoá | Chính sách hoàn tiền | Đã đóng | D-RF |
| 2 | Xoá **một hồ sơ trẻ** riêng lẻ có cần luồng 30 ngày không, hay xoá ngay? | [`child-profile-archive.md`](child-profile-archive.md) | P2 | hoãn — P2 |
