---
spec: ADMIN-AUTH
title: Đăng nhập quản trị
area: admin
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-09
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
token audience riêng, và MFA bắt buộc.

Manager có quyền chạm tiền và nội dung mà trẻ sẽ chơi. Đó là lý do bề mặt này chặt hơn.

## 2. Actors

| Actor | Quyền |
|---|---|
| `super_admin` | Mọi bề mặt admin |
| `content_reviewer` | Chỉ bề mặt nội dung §7.2 |

## 3. Entry points

`admin.{domain}/login` · `POST /api/guest/auth/managers/login` ·
`POST /api/guest/auth/managers/mfa` · `POST /api/managers/auth/refresh` · `/logout`.

## 4. Main flow

1. Nhập email + mật khẩu → xác thực.
2. Đúng → cấp challenge credential một mục đích, TTL ngắn, trả **428** `MFA_REQUIRED`.
   Credential này không phải access token, không qua guard và không tạo `active_sessions`.
3. Nhập mã TOTP kèm challenge credential → xác thực → cấp cặp token đầy đủ.
4. Ghi `active_sessions` + audit `manager_login`.
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
| `BR-ADA-07` | Phiên Manager TTL **ngắn hơn** User: access 15 phút, refresh **24 giờ** | Giảm cửa sổ rủi ro khi thiết bị quản trị bị bỏ quên |
| `BR-ADA-08` | Reset MFA của Manager khác **phải** do `super_admin` và ghi audit | Ngăn chặn bypass MFA trái phép giữa các tài khoản quản trị |

## 7. Data

### 7.1 Token

```ts
interface ManagerTokenPayload {
  sub: string; aud: "kidthink:manager"; iss: "kidthink:admin"; sid: string;
  name: string; ver: number; role: "super_admin" | "content_reviewer";
  iat: number; exp: number;
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

Body `{ email, password }`. **428** `MFA_REQUIRED` + challenge credential một mục đích.
401 `INVALID_CREDENTIALS`.

### `POST /api/guest/auth/managers/mfa`

Body `{ code, challenge }` — TOTP hoặc mã khôi phục. 200 → cặp token đầy đủ.

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

Scenario: BR-ADA-07 — phiên manager ngắn hơn
  When decode refresh token của manager
  Then hạn không quá 24 giờ
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
