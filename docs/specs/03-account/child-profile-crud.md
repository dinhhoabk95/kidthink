---
spec: CHILD-PROFILE-CRUD
title: Tạo và sửa hồ sơ trẻ
area: account
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Luồng tạo và sửa child profile
  - Ép danh sách đóng ở tầng người dùng
depends_on:
  - CHILD-DATA-COMPLIANCE
  - ENTITLEMENT-MODEL
  - CONSENT-MANAGEMENT
---

# Tạo và sửa hồ sơ trẻ

## 1. Objective

Tạo ngữ cảnh để lưu tiến độ học của một đứa trẻ, thu **ít dữ liệu nhất có thể**.

Form này là nơi ràng buộc pháp lý gặp người dùng. Nó phải vừa nhanh vừa nói rõ vì sao chỉ
hỏi từng ấy thứ — minh bạch là thứ tạo niềm tin ở sản phẩm cho trẻ em.

## 2. Actors

User (người lớn). Cấm Trẻ không tạo và không sửa.

## 3. Entry points

`/me/children` · `/me/children/new` · `/me/children/{uuid}/edit` ·
`POST /api/users/children` · `PATCH /api/users/children/{uuid}`.

## 4. Main flow

1. Lần đầu → hiện tóm tắt dữ liệu sẽ thu + link chính sách, yêu cầu **đồng ý tường minh**.
2. Ghi `consent_logs` `child_data`.
3. Form: tên gọi · năm sinh · avatar từ preset · quan hệ (tuỳ chọn).
4. Kiểm quota `child_profiles` của gói.
5. Tạo → `age_band` suy tự động, `daily_play_cap_minutes` mặc định theo gói.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chưa xác thực email | **403** — `BR-REG-04` |
| Chưa đồng ý `child_data` | **428** `CONSENT_REQUIRED` |
| Vượt quota | **402** `CHILD_LIMIT_EXCEEDED` kèm gói cần nâng |
| Năm sinh cho tuổi ngoài 3–6 | **422** kèm giải thích sản phẩm dành cho 3–6 |
| Trẻ sang tuổi mới | `age_band` tính lại tự động |
| Sửa tên | Cho phép bất cứ lúc nào |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CPC-01` | Form đúng **4 trường** §7.1 | Danh sách đóng — `BR-CDC-01` |
| `BR-CPC-02` | Cấm — **NEVER hỏi họ tên đầy đủ.** Nhãn ghi rõ "tên gọi ở nhà" | `BR-CDC-03` |
| `BR-CPC-03` | Cấm — **NEVER hỏi ngày sinh.** Chỉ **năm sinh** | `BR-CDC-02` |
| `BR-CPC-04` | Avatar **chỉ** từ preset. Cấm upload | `BR-CDC-04` |
| `BR-CPC-05` | Đồng ý `child_data` trước khi tạo hồ sơ đầu tiên | `BR-CDC` §4 |
| `BR-CPC-06` | Form hiện **giải thích ngắn** vì sao chỉ hỏi từng ấy | Minh bạch tạo niềm tin |
| `BR-CPC-07` | Quota kiểm ở **server** | |
| `BR-CPC-08` | `age_band` **suy tự động**, không nhập | |
| `BR-CPC-09` | Ownership kiểm ở DB mọi thao tác sửa | `BR-ACT-07` |
| `BR-CPC-10` | Tuổi ngoài 3–6 → từ chối kèm giải thích, không im lặng cắt | Phụ huynh cần biết vì sao |

## 7. Data

### 7.1 Form

| Trường | Nhãn tiếng Việt | Ràng buộc |
|---|---|---|
| `display_name` | "Tên gọi ở nhà của bé" | 1–40 ký tự |
| `birth_year` | "Bé sinh năm" | Cho tuổi 3–6 |
| `avatar_id` | "Chọn hình đại diện" | Từ preset |
| `relationship` | "Quan hệ" (tuỳ chọn) | `child` \| `student` \| `other` |

Dưới form: *"Chúng tôi chỉ hỏi tên gọi và năm sinh để chọn nội dung phù hợp với bé. Chúng
tôi không thu thập họ tên đầy đủ, ngày sinh, ảnh chụp, hay thông tin trường lớp."*

### 7.2 Preset avatar

Bộ minh hoạ do hệ thống cung cấp — con vật, hình khối, mascot. Cấm ảnh người thật,
không upload.

### 7.3 Sau khi tạo

`age_band` suy · `daily_play_cap_minutes` mặc định theo gói ·
`status = active` · **không** tự ghi danh curriculum.

## 8. API contract

### `POST /api/users/children`

| | |
|---|---|
| Auth | `requireUserAuth()` + email đã xác thực |
| Body | `{ display_name, birth_year, avatar_id, relationship? }` |
| 201 | `{ uuid, display_name, age_band, avatar_id }` |
| 400 | `CHILD_FIELD_NOT_ALLOWED` · `AVATAR_NOT_IN_PRESET` |
| 402 | `CHILD_LIMIT_EXCEEDED` |
| 403 | Email chưa xác thực |
| 422 | `CHILD_AGE_OUT_OF_RANGE` |
| 428 | `CONSENT_REQUIRED` |

### `PATCH /api/users/children/{uuid}`

Cùng ràng buộc. 404 nếu không thuộc caller.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CPC-01 — field ngoài danh sách bị từ chối
  When POST kèm "full_name" và "school"
  Then trả 400 CHILD_FIELD_NOT_ALLOWED

Scenario: BR-CPC-03 — không có ô ngày sinh
  When mở form tạo hồ sơ trẻ
  Then chỉ có ô chọn năm sinh
  And không có ô ngày và tháng

Scenario: BR-CPC-04 — không upload được avatar
  When quét form
  Then không có input file cho avatar
  And chỉ có lưới preset

Scenario: BR-CPC-05 — chưa đồng ý thì chặn
  Given user chưa có consent_logs child_data
  When POST tạo hồ sơ
  Then trả 428 CONSENT_REQUIRED

Scenario: BR-CPC-07 — quota kiểm ở server
  Given user gói standard đã có 3 hồ sơ
  When POST tạo hồ sơ thứ 4
  Then trả 402 CHILD_LIMIT_EXCEEDED
  And body nêu gói cần nâng

Scenario: BR-CPC-10 — tuổi ngoài khoảng có giải thích
  When tạo hồ sơ với năm sinh cho tuổi 8
  Then trả 422
  And thông báo nêu rõ sản phẩm dành cho 3–6 tuổi

Scenario: BR-CPC-09 — không sửa được hồ sơ người khác
  Given hồ sơ X thuộc user B
  When user A gọi PATCH lên X
  Then trả 404

Scenario: BR-CPC-06 — form giải thích minh bạch
  When mở form
  Then có đoạn giải thích những gì không được thu thập

Scenario: BR-CPC-08 — age_band suy tự động
  Given năm sinh cho tuổi 4
  When tạo xong
  Then age_band là 4-5
  And không có ô nhập age_band
```

## 10. Boundaries

**Always**
- Đồng ý trước hồ sơ đầu tiên.
- Ép danh sách đóng ở Zod và ở DB.
- Kiểm quota và ownership ở server.
- Hiện giải thích minh bạch.

**Ask first**
- Thêm trường vào form.
- Thêm avatar preset.
- Đổi khoảng tuổi cho phép.

**Never**
- Hỏi họ tên đầy đủ hay ngày sinh.
- Cho upload ảnh làm avatar.
- Tạo hồ sơ khi chưa xác thực email hoặc chưa đồng ý.
- Tự ghi danh curriculum khi tạo hồ sơ.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Bao nhiêu avatar preset là đủ để trẻ thấy mình được đại diện? | P1 design |
| 2 | Trẻ sang 7 tuổi thì hồ sơ xử lý thế nào — vẫn chơi được hay khoá? | P3 |
