---
spec: ADMIN-AUTH
title: Đăng nhập quản trị
area: admin
status: approved
mvp: true
phase: P0
reviewed: 2026-08-13
owns:
  - Luồng đăng nhập Manager
  - Phân quyền theo role ở tầng route
depends_on:
  - AUTH-TOKENS-SESSIONS
  - ACTORS
---

# Đăng nhập quản trị

## 1. Objective

Bề mặt admin **tách hoàn toàn** khỏi bề mặt người dùng: subdomain riêng, cookie riêng,
session namespace riêng, và MFA bắt buộc.

Manager có quyền chạm tiền và nội dung mà trẻ sẽ chơi. Đó là lý do bề mặt này chặt hơn.

## 2. Actors

| Actor | Quyền |
|---|---|
| `super_admin` | Mọi bề mặt admin |
| `content_reviewer` | Chỉ bề mặt nội dung §7.2 |

## 3. Entry points

`admin.{domain}/login` · `POST /api/guest/auth/managers/login` ·
`POST /api/guest/auth/managers/mfa` · `POST /api/guest/auth/managers/remember` · `/logout`.

## 4. Main flow

1. Nhập email + mật khẩu → xác thực.
2. Đúng → cấp opaque Redis challenge 256-bit một mục đích, TTL tối đa 5 phút, trả **428**
   `MFA_REQUIRED`; server chỉ lưu digest và challenge chỉ consume được một lần.
   Credential này không phải session, không qua guard và không tạo `active_sessions`.
   Preference `rememberMe` được bind vào challenge.
3. Nhập mã TOTP kèm challenge credential → xác thực → cấp opaque session một giờ; chỉ cấp
   remember credential tối đa 365 ngày nếu preference đã bind là true.
4. Ghi Redis session authority + metadata `active_sessions` + audit `manager_login`.
5. Mỗi route admin kiểm `requireManagerAuth()` và `requireRole()` khi cần.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Sai mật khẩu | 401 `INVALID_CREDENTIALS`, audit `manager_login_failed` |
| Sai MFA | 401, audit `manager_mfa_failed`; 5 lần → khoá 15 phút |
| Chưa bật MFA | Bắt buộc thiết lập **trước khi** vào bất kỳ trang nào |
| Mất thiết bị MFA | Mã khôi phục dùng một lần; hết mã → `super_admin` khác reset |
| `is_active = false` | 403, không nói lý do chi tiết |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ADA-01` | MFA **bắt buộc** cho mọi Manager | Tài khoản chạm tiền và nội dung cho trẻ |
| `BR-ADA-02` | Cookie Manager giới hạn domain `admin.{domain}` | Tách bề mặt |
| `BR-ADA-03` | Cấm — **NEVER endpoint public tạo Manager** | Ngăn ngừa rò rỉ tài khoản quản trị và tự nâng cấp quyền |
| `BR-ADA-04` | `requireRole()` kiểm ở **server route**, không chỉ ẩn menu | Ẩn menu không phải phân quyền |
| `BR-ADA-05` | Mọi đăng nhập và thất bại ghi `audit_logs` | Đảm bảo khả năng truy vết thao tác quản trị và phát hiện hành vi bất thường |
| `BR-ADA-06` | Manager **không tự đổi được `role` của mình** | Leo thang đặc quyền |
| `BR-ADA-07` | Session Manager tuyệt đối **1 giờ**; remember mặc định tắt, chỉ cấp sau MFA và tuyệt đối tối đa 365 ngày | Session làm việc ngắn; quyết định ghi nhớ phải rõ ràng và không bypass MFA ban đầu |
| `BR-ADA-08` | Reset MFA của Manager khác **phải** do `super_admin` và ghi audit | Ngăn chặn bypass MFA trái phép giữa các tài khoản quản trị |

## 7. Data

### 7.1 Session context

```ts
interface AuthenticatedManager {
  managerId: number; deviceId: string; displayName: string;
  role: "super_admin" | "content_reviewer";
  sessionExpiresAt: string; reauthAt: string | null;
}
```

### 7.2 Ma trận role × bề mặt

| Bề mặt | `super_admin` | `content_reviewer` |
|---|:--:|:--:|
| Dashboard (đủ) | | phần nội dung |
| User management · user detail · child profile admin | | Cấm |
| Entitlement grant | | Cấm |
| Payment queue · approval | | Cấm |
| Package catalog | | Cấm |
| Taxonomy browser | | |
| Game level studio · lesson · activity · curriculum builder | | |
| Content review queue · publish | | |
| Image upload · emoji picker | | |
| SEO content | | |
| Audit log · error log · system activity | | Cấm |
| Feature flags · data export | | Cấm |
| Notification admin | | Cấm |

## 8. API contract

### `POST /api/guest/auth/managers/login`

Body `{ email, password, rememberMe?: boolean }`. **428** `MFA_REQUIRED` + challenge credential một mục đích.
401 `INVALID_CREDENTIALS`.

### `POST /api/guest/auth/managers/mfa`

Body `{ code, challenge }` — TOTP hoặc mã khôi phục. 200 → session một giờ; remember chỉ theo
preference đã bind trong challenge.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ADA-01 — MFA bắt buộc
  Given manager nhập đúng email và mật khẩu
  Then trả 428 MFA_REQUIRED
  And chưa vào được bất kỳ trang admin nào
  And challenge trả về không qua được requireManagerAuth
  And chưa có hàng active_sessions

Scenario: BR-ADA-04 — phân quyền ở server
  Given manager content_reviewer
  When gọi trực tiếp GET /api/managers/users bằng curl
  Then trả 403
  And không phụ thuộc việc menu có hiện hay không

Scenario: BR-ADA-02 — cookie không rò sang domain chính
  Given manager đã đăng nhập
  When gửi request tới {domain}
  Then cookie manager không được gửi kèm

Scenario: BR-ADA-06 — không tự nâng quyền
  Given manager content_reviewer
  When gọi PATCH đổi role của chính mình
  Then trả 403

Scenario: BR-ADA-03 — không đăng ký manager công khai
  When quét mọi route /api/guest
  Then không route nào tạo hàng trong bảng managers

Scenario: BR-ADA-05 — đăng nhập được ghi audit
  When manager đăng nhập thành công và thất bại một lần
  Then audit_logs có manager_login và manager_login_failed

Scenario: BR-ADA-07 — Manager remember không bypass MFA
  Given Manager mới chỉ qua mật khẩu và chọn rememberMe
  Then chưa có session hoặc remember credential
  When hoàn tất MFA hợp lệ
  Then session hết hạn sau một giờ
  And remember hết hạn tuyệt đối không quá 365 ngày
```

## 10. Boundaries

**Always**
- MFA trước khi vào bất kỳ trang nào.
- `requireRole()` ở server route.
- Audit mọi đăng nhập và thất bại.

**Ask first**
- Đổi TTL phiên Manager.
- Thêm role thứ ba.
- Nới ma trận §7.2.

**Never**
- Endpoint public tạo Manager.
- Ẩn menu thay cho phân quyền.
- Cho Manager tự đổi role.
- Cookie Manager dùng chung domain với người dùng.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có giới hạn IP cho bề mặt admin không? An toàn hơn nhưng cản vận hành di động | Cấu hình Admin P2 | P2 | Infra |
| 2 | Manager đầu tiên tạo bằng seed — quy trình xoay mật khẩu ban đầu thế nào? | Quy trình Go-live | P1 | người quyết |
