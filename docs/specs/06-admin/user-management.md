---
spec: USER-MANAGEMENT
title: Tra cứu và quản lý người dùng
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-13
owns:
  - Danh sách User và bộ lọc
  - Thao tác khoá/mở tài khoản
depends_on:
  - ADMIN-AUTH
  - ACTORS
  - AUDIT-LOG
---

# Tra cứu và quản lý người dùng

## 1. Objective

Tìm một User để hỗ trợ, và thực hiện đúng ba thao tác vận hành: **khoá**, **mở khoá**,
**xoá theo yêu cầu**.

> Tách khỏi [`admin-dashboard.md`](admin-dashboard.md) và khỏi [`user-detail.md`](user-detail.md). Danh sách là bề mặt tìm kiếm; chi tiết
> là bề mặt đọc sâu. Gộp cả ba như v1 làm không ai trả lời được phần nào đã xong.

## 2. Actors

| Actor | Quyền |
|---|---|
| `super_admin` | Đầy đủ |
| `content_reviewer` | Cấm truy cập |

## 3. Entry points

`/users` · `GET /api/managers/users` · `POST /api/managers/users/{uuid}/suspend` ·
`/reactivate`.

## 4. Main flow

1. Manager mở `/users`.
2. Tìm theo email hoặc tên hiển thị; lọc theo trạng thái và gói.
3. Kết quả phân trang, trần **100**.
4. Mở một User → [`user-detail.md`](user-detail.md).
5. Khoá/mở khoá cần **lý do bắt buộc**, ghi audit.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Tìm không ra | Gợi ý tìm bằng email đầy đủ |
| Khoá User đang có phiên | Thu hồi mọi session/remember ngay (`session_version` +1 + Redis revoke-all) |
| Khoá User có entitlement | Entitlement **giữ nguyên** — khoá là chặn đăng nhập, không thu hồi quyền đã mua |
| User đã `deleted` | Hiện dạng chỉ đọc, không thao tác được |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-USM-01` | Trần phân trang **100**, ép ở Zod | Query không trần hạ instance trên t3.small |
| `BR-USM-02` | Zod parse **mọi** query param | Param đi vào `ilike` là đường vào injection |
| `BR-USM-03` | Khoá/mở khoá **bắt buộc lý do** ≥10 ký tự, ghi audit | Đảm bảo khả năng giải trình và truy vết trách nhiệm theo `BR-AUD-01` đối với thao tác ảnh hưởng đến quyền truy cập của người dùng |
| `BR-USM-04` | Khoá **không** thu hồi entitlement đã mua | Khoá là biện pháp vận hành, không phải phạt tài chính |
| `BR-USM-05` | Khoá thu hồi **mọi phiên** ngay | Khoá mà token cũ còn dùng được là không khoá |
| `BR-USM-06` | Danh sách Cấm — **NEVER hiện dữ liệu trẻ** ngoài **số lượng** hồ sơ | `BR-CDC-14` |
| `BR-USM-07` | Cấm — **NEVER endpoint xoá cứng User** từ admin. Xoá đi qua luồng yêu cầu của chính User | Xoá tài khoản là quyền của chủ thể dữ liệu, có thời hạn 30 ngày |
| `BR-USM-08` | Manager Cấm — **NEVER đổi được mật khẩu của User** | Chỉ gửi được link đặt lại |

## 7. Data

### 7.1 Bộ lọc

`q` (email hoặc `display_name`) · `status` · `package_code` · `created_from` `created_to` ·
`has_children` · `sort` (`newest` \| `last_active`) · `limit` ≤100 · `cursor`.

### 7.2 Cột danh sách

Email · Tên hiển thị · Trạng thái · Số hồ sơ trẻ (**chỉ số lượng**) · Gói đang hiệu lực ·
Ngày tạo · Hoạt động gần nhất.

Cấm tên trẻ, không tuổi trẻ, không tiến độ học.

## 8. API contract

### `GET /api/managers/users`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `super_admin` |
| Query | §7.1 |
| 200 | `{ items, next_cursor }` |
| 403 | `INSUFFICIENT_ROLE` |

### `POST /api/managers/users/{uuid}/suspend`

Body `{ reason }`. 200 → thu hồi phiên + audit. **422** `ADMIN_NOTE_REQUIRED`.

### `POST /api/managers/users/{uuid}/reactivate`

Body `{ reason }`.

### `POST /api/managers/users/{uuid}/send-password-reset`

Gửi link đặt lại. Cấm trả token cho Manager.

## 9. Acceptance criteria

```gherkin
Scenario: BR-USM-01 — trần phân trang
  When gọi GET /api/managers/users?limit=500
  Then số item trả về không vượt 100

Scenario: BR-USM-02 — ký tự đặc biệt không gây lỗi
  When tìm với q chứa dấu nháy đơn và phần trăm
  Then trả 200 và không lỗi SQL

Scenario: BR-USM-05 — khoá thu hồi phiên ngay
  Given user đang đăng nhập trên 2 thiết bị
  When manager khoá user đó
  Then cả hai thiết bị mất phiên ở request tiếp theo

Scenario: BR-USM-04 — khoá không thu hồi entitlement
  Given user có entitlement premium còn hạn
  When manager khoá user
  Then hàng entitlements không đổi
  When manager mở khoá
  Then user dùng lại được ngay

Scenario: BR-USM-03 — khoá bắt buộc lý do
  When khoá với reason rỗng
  Then trả 422
  And user vẫn active

Scenario: BR-USM-06 — danh sách không lộ dữ liệu trẻ
  When đọc response danh sách user
  Then không có tên trẻ, tuổi trẻ, hay mastery
  And chỉ có số lượng hồ sơ

Scenario: BR-USM-07 — không có endpoint xoá cứng
  When quét route admin
  Then không route nào xoá cứng một user

Scenario: BR-USM-08 — manager không đổi được mật khẩu
  When quét route admin
  Then không route nào đặt password_hash của user
  And chỉ có route gửi link đặt lại

Scenario: content_reviewer bị chặn
  Given manager role content_reviewer
  When gọi GET /api/managers/users
  Then trả 403
```

## 10. Boundaries

**Always**
- Zod mọi query param, trần 100.
- Lý do bắt buộc + audit cho khoá/mở khoá.
- Thu hồi phiên khi khoá.

**Ask first**
- Thêm thao tác vận hành mới trên User.
- Nâng trần phân trang.

**Never**
- Hiện dữ liệu trẻ trong danh sách.
- Xoá cứng User từ admin.
- Đổi mật khẩu User.
- Thu hồi entitlement khi khoá.
- Cho `content_reviewer` truy cập.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Có cần ghi chú hỗ trợ (support note) gắn với User không? | P2 | Hoãn sang P4 (xem [`user-detail.md`](user-detail.md)) — MVP dùng `audit_logs` để theo dõi lịch sử thao tác | người quyết |
| 2 | Khoá có tự động sau N lần vi phạm không, hay luôn thủ công? | P2 | MVP luôn thực hiện thủ công bởi `super_admin`; tính năng khoá tự động hoãn sang P4 | người quyết |
