---
spec: PACKAGE-CATALOG-ADMIN
title: Xem catalog gói trong quản trị
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Bề mặt xem catalog gói trong admin
depends_on:
  - PACKAGE-CATALOG
  - ADMIN-AUTH
---

# Xem catalog gói trong quản trị

## 1. Objective

Manager cần biết **gói nào mở entitlement nào** để trả lời câu hỏi hỗ trợ và để cấp quyền
đúng.

Màn hình này **chỉ đọc**. Package là Lớp 1 — giá và quyền lợi là contract thương mại, đổi
phải qua PR và review, không qua một ô input.

## 2. Actors

`super_admin` xem. `content_reviewer` không truy cập.

## 3. Entry points

`/packages` · `GET /api/managers/packages`.

## 4. Main flow

1. Mở `/packages`, thấy mọi gói **kể cả** `is_public = false` (add-on).
2. Mỗi gói hiện: giá, thời hạn, entitlement, quota, số người đang dùng.
3. Mở một gói → danh sách User đang có gói đó (phân trang).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Gói `retired` | Hiện mờ + số người còn dùng |
| Add-on chưa bán | Gắn nhãn "chưa lên catalog", nêu spec nào phải `implemented` trước |
| Muốn sửa giá | Hiện thông báo: đổi qua PR, kèm đường dẫn file hằng số |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PCA-01` | **Chỉ đọc**. Cấm tạo/sửa/xoá gói | `BR-PKG-07` |
| `BR-PCA-02` | Hiện **cả** gói `is_public = false` | Manager cần biết để cấp tay |
| `BR-PCA-03` | Hiện **số người đang dùng** mỗi gói | Ngữ cảnh trước khi retire một gói |
| `BR-PCA-04` | Add-on chưa bán nêu rõ **điều kiện lên catalog** | Tránh cấp nhầm gói chưa có tính năng |
| `BR-PCA-05` | Chỉ `super_admin` | Dữ liệu doanh thu |
| `BR-PCA-06` | Danh sách User theo gói **không hiện dữ liệu trẻ** | Tuân thủ quy định bảo vệ dữ liệu trẻ em theo `BR-CDC-14` — màn hình quản lý gói chỉ phục vụ mục đích tài chính |

## 7. Data

### 7.1 Thẻ mỗi gói

`code` · tên · đối tượng · `is_public` · trạng thái · offer (chu kỳ + giá + thời hạn) ·
entitlement mở · quota · **số User đang hiệu lực** · doanh thu 30 ngày.

### 7.2 Cột danh sách User theo gói

Email · nguồn entitlement (`payment_order` / `manual_grant`) · `granted_at` · `expires_at`.

Cột "nguồn" phân biệt doanh thu thật với quyền cấp tay.

## 8. API contract

### `GET /api/managers/packages`

200 → §7.1 mọi gói. Cấm có `POST`/`PATCH`/`DELETE`.

### `GET /api/managers/packages/{code}/subscribers`

Trần 100, phân trang cursor.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PCA-01 — không sửa được gói
  When gọi POST hoặc PATCH tới route package admin
  Then route không tồn tại hoặc trả 405

Scenario: BR-PCA-02 — hiện cả add-on chưa bán
  When mở /packages
  Then thấy cả 4 add-on với nhãn chưa lên catalog

Scenario: BR-PCA-04 — nêu điều kiện lên catalog
  When mở một add-on chưa bán
  Then hiện tên spec phải implemented trước

Scenario: BR-PCA-03 — hiện số người dùng
  When mở danh sách gói
  Then mỗi gói hiện số entitlement đang hiệu lực

Scenario: BR-PCA-06 — không lộ dữ liệu trẻ
  When mở danh sách subscriber
  Then không có tên hay tuổi trẻ nào

Scenario: BR-PCA-05 — content_reviewer bị chặn
  Given manager role content_reviewer
  When gọi GET /api/managers/packages
  Then trả 403
```

## 10. Boundaries

**Always**
- Chỉ đọc.
- Hiện cả gói không công khai.
- Nêu điều kiện lên catalog của add-on.

**Ask first**
- Hiện thêm số liệu doanh thu.

**Never**
- Sửa gói từ UI.
- Hiện dữ liệu trẻ.
- Cho `content_reviewer` truy cập.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Doanh thu 30 ngày tính theo đơn approved hay theo ngày hiệu lực? | P2 | Tính theo đơn approved trong 30 ngày vừa qua (ghi nhận doanh thu theo giao dịch thực tế); trỏ sang [`admin-dashboard.md`](admin-dashboard.md) Q1 | người quyết |
