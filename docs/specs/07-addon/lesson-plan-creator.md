---
spec: LESSON-PLAN-CREATOR
title: Công cụ soạn giáo án cá nhân
area: addon
status: approved
mvp: false
phase: P4
reviewed: 2026-08-08
owns:
  - Luồng User tự lắp giáo án từ thư viện
depends_on:
  - LESSON-MODEL
  - ENTITLEMENT-MODEL
  - CONTENT-LIFECYCLE
---

# Công cụ soạn giáo án cá nhân

> **Add-on — không bán ở MVP.** Lên catalog khi spec này đạt `implemented`
> ([`package-catalog.md`](../00-foundation/package-catalog.md) §7.2).

## 1. Objective

Giáo viên lắp giáo án riêng **từ thư viện đã kiểm duyệt** — chọn lesson và activity có sẵn,
sắp xếp lại, thêm ghi chú, xuất PDF.

Ranh giới then chốt: User tạo **bản copy thuộc sở hữu cá nhân**. Họ **không** sửa được
bản gốc của hệ thống, và **không** xuất bản vào catalog công khai.

## 2. Actors

| Actor | Cần entitlement |
|---|---|
| User | `create_lesson_plan` · `duplicate_lesson` · `customize_lesson` · `export_pdf` |
| Manager | Cấm liên quan — đây là không gian riêng của User |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LPC-01` | User tạo **bản copy**, Cấm — **NEVER sửa bản gốc hệ thống** | Bản gốc là tài sản chung có kiểm duyệt |
| `BR-LPC-02` | Giáo án cá nhân Cấm — **NEVER vào catalog công khai** | Vào catalog cần kiểm duyệt; kiểm duyệt UGC ở quy mô là mô hình khác |
| `BR-LPC-03` | Giáo án chỉ dùng nội dung **`published`** mà User **có quyền truy cập** | Cấm lách paywall bằng cách nhét nội dung premium vào giáo án |
| `BR-LPC-04` | Cấm — **NEVER nhiều người cùng sửa** một giáo án ở MVP add-on | Giảm thiểu độ phức tạp về xử lý đồng bộ trạng thái thực thời cho MVP |
| `BR-LPC-05` | Chia sẻ giáo án **không có ở phiên bản đầu** | Chia sẻ kéo theo kiểm duyệt và bản quyền |
| `BR-LPC-06` | Xuất PDF trừ quota `export_pdf` | Kiểm soát tải cho hạ tầng render PDF và chi phí xuất bản tài liệu |
| `BR-LPC-07` | Bản gốc đổi version → giáo án giữ **snapshot đã copy**, có thông báo có bản mới | Giáo án đã in ra không được đổi dưới chân người dùng |
| `BR-LPC-08` | Quota `lesson_plans_per_month` theo gói add-on | Quản lý hạ tầng và khuyến khích người dùng đăng ký gói dịch vụ phù hợp |
| `BR-LPC-09` | Giáo án Cấm — **NEVER chứa dữ liệu của trẻ** | Nó là tài liệu dạy, không phải hồ sơ học sinh |

## 7. Data

`lesson_plans`: `id` · `uuid` · `user_id` · `title` · `target_age` · `estimated_minutes` ·
`notes` · `source_lesson_code` nullable · `created_at` `updated_at`.

`lesson_plan_items`: `lesson_plan_id` · `position` · `item_type` (`activity`\|`game_level`\|`custom_note`)
· `item_code` nullable · `snapshot` JSONB · `custom_instruction` nullable.

`snapshot` giữ nội dung tại thời điểm copy — đó là cách `BR-LPC-07` được thực thi.

## 8. API contract

| Route | Ghi chú |
|---|---|
| `POST /api/users/lesson-plans` | Tạo mới hoặc copy từ lesson hệ thống |
| `PUT /api/users/lesson-plans/{uuid}/items` | Thay toàn bộ danh sách item |
| `POST /api/users/lesson-plans/{uuid}/export` | Trừ quota `export_pdf` |
| `DELETE /api/users/lesson-plans/{uuid}` | |

403 `ENTITLEMENT_REQUIRED` · 402 `QUOTA_EXCEEDED` · 403 khi thêm nội dung User không có quyền.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LPC-01 — không sửa được bản gốc
  Given user copy một lesson hệ thống
  When user sửa bản copy
  Then lesson gốc không đổi

Scenario: BR-LPC-03 — không lách paywall
  Given user gói standard
  When thêm một game level premium vào giáo án
  Then trả 403

Scenario: BR-LPC-02 — không vào catalog công khai
  When quét route
  Then không route nào đưa lesson_plan vào catalog

Scenario: BR-LPC-07 — snapshot không đổi dưới chân
  Given giáo án copy lesson version 2
  When lesson publish version 3
  Then nội dung giáo án vẫn là version 2
  And có thông báo có bản mới

Scenario: BR-LPC-06 — export trừ quota
  Given quota export_pdf còn 1
  When export 2 lần
  Then lần thứ hai trả 402

Scenario: BR-LPC-09 — không chứa dữ liệu trẻ
  When đọc mọi field của lesson_plans
  Then không có tham chiếu tới child_profile
```

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Giá add-on này là bao nhiêu và bán theo tháng hay năm? | P4 | Định giá và chu kỳ thanh toán sẽ chốt khi lên catalog dịch vụ | người quyết |
| 2 | Chia sẻ bằng link riêng tư có vào phiên bản hai không? | P5 | Hoãn sang P5 để đánh giá thêm nhu cầu chia sẻ nội bộ giữa các giáo viên | người quyết |
| 3 | Quota giáo án mỗi tháng là bao nhiêu? | P4 | Định lượng theo gói bán khi lên catalog sản phẩm | người quyết |
