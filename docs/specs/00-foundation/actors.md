---
spec: ACTORS
title: Tác nhân hệ thống và ranh giới quyền
area: foundation
status: approved
mvp: true
phase: P0
reviewed: 2026-08-06
owns:
  - Danh sách tác nhân và định nghĩa của từng loại
  - Ranh giới giữa hai guard
  - Quy tắc suy ra năng lực từ entitlement
depends_on:
  - GLOSSARY
---

# Tác nhân hệ thống và ranh giới quyền

## 1. Objective

Bốn tác nhân, không hơn. Không có persona enum, không có cột `role` trên `users` — năng
lực suy ra từ entitlement đã mua.

Lý do: một người vừa là phụ huynh vừa là giáo viên là **ca dùng chính**, không phải ca lạ.
Ép họ chọn một role làm hỏng cả hai trải nghiệm, và mỗi role mới thêm vào là một nhánh
điều kiện mới ở mọi handler.

## 2. Actors

| Tác nhân | Bảng | Guard | Có credential |
|---|---|---|---|
| **Guest** | không có record | không | ❌ |
| **User** | `users` | `requireUserAuth(event)` | ✅ email + password |
| **Child Profile** | `child_profiles` | không — thuộc User | ❌ **không bao giờ** |
| **Manager** | `managers` | `requireManagerAuth(event)` | ✅ email + password + MFA |

### 2.1 Guest

Chưa đăng nhập. Không có record trong DB.

| | |
|---|---|
| Định danh | Cookie thiết bị `kidthink_did` (uuid, không HttpOnly, 1 năm) |
| Chơi được | Allow-list 6 game level `access_tier='free'`, một cho mỗi competency, difficulty 1–2 |
| Giới hạn lượt | **Không có** |
| Lưu tiến độ | ❌ — `play_sessions.child_profile_id IS NULL`, ❌ không ghi `mastery_state` |
| Thấy được | Toàn bộ public site, metadata mọi game level, **không** thấy `content_pack` của level bị chặn |

*Vì sao guest không bị giới hạn lượt:* quota theo cookie thiết bị dễ vượt (xoá cookie là
reset) nên nó chỉ làm phiền người thật mà không chặn được ai. **Allow-list hẹp** mới là thứ
tạo lý do đăng ký.

### 2.2 User

Một loại duy nhất. Có thể là phụ huynh, có thể là giáo viên — hệ thống **không phân biệt**.

```ts
interface UserTokenPayload {
  user_id: number;
  display_name: string;
  active_child_id?: number;   // ngữ cảnh, KHÔNG phải quyền
}
```

Năng lực = **hợp** của mọi `entitlements` đang `active` hoặc `soft_unlock`.
Xem [`entitlement-model.md`](./entitlement-model.md).

| Trạng thái tài khoản | Nghĩa | Đăng nhập được |
|---|---|---|
| `pending_verification` | Đã đăng ký, chưa xác thực email | ✅ hạn chế — không tạo được child profile |
| `active` | Bình thường | ✅ |
| `suspended` | Tạm khoá bởi Manager, có lý do | ❌ — thông báo nêu cách liên hệ |
| `deleted` | Đã yêu cầu xoá, trong 30 ngày chờ | ❌ |

### 2.3 Child Profile

**Không phải tài khoản.** Không email, không password, không token, không endpoint đăng
nhập. Là một ngữ cảnh thuộc về User.

| | |
|---|---|
| Số lượng | 1–5 mỗi User, theo quota gói |
| Tuổi | 3–6 |
| Trường được phép | **Danh sách đóng** — xem [`child-data-compliance.md`](./child-data-compliance.md) §4.1 |
| Chọn trẻ | Cookie `active_child_id` (không HttpOnly, SameSite=Lax) |
| Kiểm quyền | `assertActiveChild(event)` throw **428**, **và** kiểm ownership ở DB |

❌ **NEVER tin `active_child_id` từ cookie.** Cookie không HttpOnly, người dùng sửa được.
Mọi endpoint chạm dữ liệu trẻ phải `SELECT … WHERE child_profiles.user_id = <user từ JWT>`.

### 2.4 Manager

```ts
interface ManagerTokenPayload {
  manager_id: number;
  display_name: string;
  role: "super_admin" | "content_reviewer";
}
```

| Role | Làm được | Không làm được |
|---|---|---|
| `super_admin` | Mọi thứ ở admin | — |
| `content_reviewer` | Soạn, duyệt, publish nội dung; xem taxonomy | ❌ thanh toán, ❌ quản lý User, ❌ cấp entitlement, ❌ feature flag, ❌ export dữ liệu |

Manager **không tự đăng ký** — không endpoint public nào tạo manager. Tạo qua seed hoặc
qua `super_admin` khác.

## 3. Entry points

| Namespace | Guard |
|---|---|
| `/api/guest/**` | không — nội dung công khai + pre-auth |
| `/api/users/**` | `requireUserAuth()` |
| `/api/managers/**` | `requireManagerAuth()` |

## 4. Main flow — phân giải quyền một request

1. Middleware đọc cookie access token, verify chữ ký và **audience**.
2. Gắn vào `event.context.user` **hoặc** `event.context.manager` — không bao giờ cả hai.
3. Handler gọi đúng một guard. Guard là **hàm sync**, đọc context, throw 401 nếu thiếu.
4. Nếu route cần trẻ: `assertActiveChild(event)` → 428 nếu chưa chọn.
5. Nếu route cần trẻ: query có `WHERE user_id = ctx.user.user_id` — **luôn**.
6. Nếu route cần năng lực: `hasEntitlement(user_id, key)` — hỏi DB/cache, không hỏi JWT.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Token manager gọi `/api/users/**` | **401** — audience không khớp |
| Token user gọi `/api/managers/**` | **401** — audience không khớp |
| `content_reviewer` gọi route của `super_admin` | **403** kèm `INSUFFICIENT_ROLE` |
| Truy cập record của User khác | **404**, không phải 403 |
| Chưa chọn trẻ | **428** kèm thông báo tiếng Việt |
| Entitlement hết hạn giữa chừng | Phiên đang mở **không bị ngắt**; request mới bị chặn |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ACT-01` | Hai guard **tách biệt, không lồng nhau**. ❌ Không có guard chung với cờ `isAdmin` | Một guard chung có cờ là con đường ngắn nhất tới leo thang đặc quyền |
| `BR-ACT-02` | Guard kiểm **audience** JWT tường minh. Token user ❌ không bao giờ được `requireManagerAuth` chấp nhận và ngược lại | Chỉ kiểm chữ ký thì một token hợp lệ ở namespace này dùng được ở namespace kia |
| `BR-ACT-03` | Record của người khác → **404**, không phải 403 | 403 xác nhận record tồn tại — đó là rò rỉ thông tin |
| `BR-ACT-04` | Năng lực đọc từ `entitlements`, ❌ **không** từ JWT | JWT sống 15 phút; thu hồi quyền phải có hiệu lực ngay |
| `BR-ACT-05` | ❌ **NEVER cột `role`/`persona`/`tier` trên `users`** | Năng lực = gói đã mua. Nhãn trên user sẽ lệch khỏi gói |
| `BR-ACT-06` | ❌ **NEVER tạo credential cho trẻ** | Ràng buộc pháp lý và ràng buộc sản phẩm — xem `child-data-compliance` |
| `BR-ACT-07` | Ownership child profile kiểm ở **DB query**, không ở cookie | Cookie `active_child_id` không HttpOnly |
| `BR-ACT-08` | `content_reviewer` ❌ không thấy bề mặt thanh toán và quản lý User | Tách nhiệm vụ — người soạn nội dung không cần dữ liệu tài chính |

## 7. Data

**Đọc:** `users` `managers` `child_profiles` `entitlements`
**Ghi:** không — spec này định nghĩa ranh giới, module khác ghi.

| Bảng | Field then chốt | Ràng buộc |
|---|---|---|
| `users` | `email` UNIQUE, `password_hash`, `status`, `refresh_token_version` | ❌ không có `role` |
| `managers` | `email` UNIQUE, `password_hash`, `role`, `mfa_enabled` | `role` NOT NULL |
| `child_profiles` | `uuid` UNIQUE, `user_id` FK, `display_name`, `birth_year`, `avatar_id` | Danh sách đóng field |
| Bảng auth phụ | `account_type ('user'\|'manager')` + `account_id` | FK polymorphic — **bắt buộc** integration test bắt orphan |

## 8. API contract

Guard là hàm, không phải route. Contract của guard:

```ts
// SYNC — đọc event.context. ❌ NEVER await.
function requireUserAuth(event: H3Event): UserTokenPayload;      // throw 401
function requireManagerAuth(event: H3Event): ManagerTokenPayload; // throw 401
function requireRole(event: H3Event, role: ManagerRole): void;    // throw 403
function assertActiveChild(event: H3Event): number;               // throw 428
async function hasEntitlement(userId: number, key: string): Promise<boolean>;
```

| Mã lỗi | HTTP | Khi nào |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Thiếu/hỏng/sai audience token |
| `INSUFFICIENT_ROLE` | 403 | Manager role không đủ |
| `NO_ACTIVE_CHILD` | 428 | Route cần trẻ, chưa chọn |
| `NOT_FOUND` | 404 | Record không tồn tại **hoặc** không thuộc caller |

## 9. Acceptance criteria

```gherkin
Scenario: BR-ACT-02 — token chéo namespace bị từ chối
  Given một manager đã đăng nhập và có access token hợp lệ
  When token đó được gửi tới GET /api/users/children
  Then hệ thống trả 401
  And không rò bất kỳ dữ liệu nào

Scenario: BR-ACT-03 — record của người khác trả 404
  Given user A sở hữu child profile có uuid X
  And user B đã đăng nhập
  When user B gọi GET /api/users/children/X
  Then hệ thống trả 404
  And không trả 403

Scenario: BR-ACT-07 — cookie active_child_id bị giả mạo không mở được dữ liệu
  Given user A đã đăng nhập
  And cookie active_child_id bị sửa thành id của trẻ thuộc user B
  When user A gọi GET /api/users/reports/basic
  Then hệ thống trả 404
  And không trả dữ liệu của trẻ thuộc user B

Scenario: BR-ACT-04 — thu hồi entitlement có hiệu lực ngay
  Given user có entitlement play_premium_games đang active
  And user đang giữ access token còn hạn 10 phút
  When manager reject đơn thanh toán sinh ra entitlement đó
  Then request tiếp theo tới level premium trả 403
  And không cần user đăng nhập lại

Scenario: BR-ACT-08 — content_reviewer không vào được thanh toán
  Given manager có role content_reviewer
  When manager gọi GET /api/managers/orders
  Then hệ thống trả 403 INSUFFICIENT_ROLE
```

## 10. Boundaries

**Always**
- Gọi đúng một guard mỗi handler. Guard là **sync** — ❌ không `await`.
- Kiểm audience JWT tường minh.
- Kiểm ownership ở DB query, không ở cookie.
- Trả 404 cho record của người khác.
- Đọc năng lực từ `entitlements`, không từ JWT.

**Ask first**
- Thêm tác nhân thứ năm.
- Thêm role manager mới.
- Đổi thời hạn token hoặc thuộc tính cookie.
- Cho `content_reviewer` thấy thêm bề mặt nào.

**Never**
- Guard chung có cờ `isAdmin`.
- Cột `role`/`persona`/`tier` trên `users`.
- Credential cho trẻ.
- Tin `active_child_id` từ cookie.
- `tenant_id`, `school_admin`, `classroom`.
- Endpoint public tạo manager.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Manager có bắt buộc MFA từ ngày đầu không~~ **Đóng 2026-08-06 (T9)**: **có**, `admin-auth.md` §7 ghi MFA bắt buộc. Cột `mfa_secret` ở `schema-identity-billing`. `index.md` ghi `admin-auth` = P0 | — | ✅ đóng | D-X (T9) |
| ~~2~~ | ~~`pending_verification` được tạo child profile không~~ **Đóng 2026-08-06 (T9)**: **không**, `email-verification.md` là điều kiện tiên quyết. Guard P0 của `registration`/`child-profile-crud` | — | ✅ đóng | D-X (T9) |
