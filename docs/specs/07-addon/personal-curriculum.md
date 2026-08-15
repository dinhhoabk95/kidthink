---
spec: PERSONAL-CURRICULUM
title: Chương trình cá nhân
area: addon
status: implemented
mvp: false
phase: P4
reviewed: 2026-08-08
owns:
  - Luồng User tự dựng lộ trình cho trẻ của mình
depends_on:
  - CURRICULUM-MODEL
  - CURRICULUM-PLAYER
  - ENTITLEMENT-MODEL
---

# Chương trình cá nhân

> **Add-on — không bán ở MVP.**

## 1. Objective

Giáo viên sắp xếp lộ trình riêng cho lớp mình, hoặc phụ huynh dựng lộ trình theo nhu cầu cụ
thể của con — từ **nội dung đã kiểm duyệt**.

Khác chương trình hệ thống ở đúng hai điểm: không qua duyệt, và chỉ trẻ của User đó theo
được.

## 2. Actors

| Actor | Cần entitlement |
|---|---|
| User | `create_custom_curriculum` |
| Trẻ của User đó | Ghi danh được |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PCU-01` | Chỉ dùng nội dung **`published`** mà User **có quyền** | Cấm lách paywall bằng cách nhét nội dung premium vào lộ trình riêng |
| `BR-PCU-02` | Chỉ trẻ của **chính User** ghi danh được | Bảo vệ quyền riêng tư và đảm bảo nội dung tự tạo không phát tán ra ngoài phạm vi quản lý của gia đình/lớp học |
| `BR-PCU-03` | Cấm — **NEVER vào catalog công khai** | `BR-CGB-02` |
| `BR-PCU-04` | Player dùng **cùng engine** với curriculum hệ thống | Một bộ luật, không hai |
| `BR-PCU-05` | Cảnh báo cân bằng của [`curriculum-builder.md`](../06-admin/curriculum-builder.md) §7.2 vẫn hiện, nhưng **không chặn** | User tự chịu trách nhiệm lộ trình riêng, nhưng phải được cảnh báo |
| `BR-PCU-06` | Cấm — **NEVER chặn tuần rỗng** — nhưng player bỏ qua tuần rỗng | Khác chương trình hệ thống ở chỗ này |
| `BR-PCU-07` | Nội dung trong lộ trình bị archive → hiện cảnh báo, player bỏ qua | Tránh gây gián đoạn trải nghiệm học tập của trẻ khi tài nguyên gốc bị ngừng phát hành |
| `BR-PCU-08` | Quota `custom_curricula_saved` theo gói add-on | Kiểm soát tài nguyên hệ thống và khuyến khích người dùng đăng ký gói dịch vụ phù hợp |

## 7. Data

`personal_curricula`: `id` · `uuid` · `user_id` · `title` · `age_min` `age_max` ·
`duration_weeks` · `sessions_per_week` · `status` (`draft`\|`ready`) · `created_at`.

`personal_curriculum_items`: cùng hình dạng `curriculum_items`, thêm `personal_curriculum_id`.

Cấm `access_tier`, không `content_version` — không có publish công khai.

### 7.1 Khác biệt so với curriculum hệ thống

| | Hệ thống | Cá nhân |
|---|---|---|
| Duyệt | | Cấm |
| Vào catalog | | Cấm |
| Ai ghi danh được | Mọi trẻ đủ quyền | Chỉ trẻ của chủ sở hữu |
| Tuần rỗng | Chặn publish | Cảnh báo, player bỏ qua |
| Cân bằng competency | Chặn publish | Cảnh báo |
| Version | | Cấm — sửa tại chỗ |

## 8. API contract

| Route | Ghi chú |
|---|---|
| `POST /api/users/curricula` | Tạo lộ trình riêng |
| `PUT /api/users/curricula/{uuid}/items` | Thay toàn bộ danh sách |
| `POST /api/users/children/{child}/enroll-personal` | Ghi danh trẻ của chính mình |
| `GET /api/users/curricula/{uuid}/balance` | Chỉ báo cân bằng |

403 `ENTITLEMENT_REQUIRED` · 403 khi thêm nội dung không có quyền · 402 quota.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PCU-01 — không lách paywall
  Given user gói standard
  When thêm một lesson premium vào lộ trình riêng
  Then trả 403

Scenario: BR-PCU-02 — chỉ trẻ của mình ghi danh
  Given user A tạo lộ trình riêng
  When trẻ của user B cố ghi danh
  Then trả 404

Scenario: BR-PCU-03 — không vào catalog
  When guest duyệt trang chương trình
  Then không lộ trình cá nhân nào xuất hiện

Scenario: BR-PCU-05 — cảnh báo nhưng không chặn
  Given một lộ trình riêng có 70% item thuộc C1
  When lưu ở trạng thái ready
  Then thành công
  And hiện cảnh báo lệch competency

Scenario: BR-PCU-06 — tuần rỗng được bỏ qua
  Given lộ trình riêng có tuần 3 rỗng
  When trẻ đi tới tuần 3
  Then player chuyển thẳng tuần 4

Scenario: BR-PCU-07 — nội dung archived bị bỏ qua
  Given một lesson trong lộ trình bị archive
  When trẻ đi tới bước đó
  Then player bỏ qua
  And chủ sở hữu thấy cảnh báo

Scenario: BR-PCU-04 — dùng cùng engine
  When quét implementation player
  Then lộ trình cá nhân và hệ thống dùng chung code
```

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Có cho sao chép một curriculum hệ thống làm điểm khởi đầu không? | P4 | Cho phép sao chép curriculum hệ thống làm bản thảo lộ trình riêng; bản sao là nội dung mới thuộc sở hữu cá nhân người dùng theo [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) (`D-BO`) | Studio UI |
| 2 | Quota số lộ trình lưu là bao nhiêu? | P4 | Định lượng theo gói bán khi lên catalog sản phẩm | người quyết |
