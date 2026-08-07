---
spec: LESSON-AUTHORING
title: Soạn bài học
area: admin
status: draft
mvp: true
phase: P3
reviewed: 2026-08-04
owns:
  - Luồng soạn một lesson
  - Ràng buộc lắp activity vào lesson
depends_on:
  - LESSON-MODEL
  - ACTIVITY-AUTHORING
  - CONTENT-LIFECYCLE
---

# Soạn bài học

## 1. Objective

Lesson là **đơn vị dạy học hoàn chỉnh** — thứ mà một giáo viên hoặc phụ huynh mở ra và biết
phải làm gì trong 20–30 phút.

Nó là tài sản khác hẳn game level: game level là hoạt động số; lesson là kịch bản, gồm cả
hoạt động ngoài màn hình.

## 2. Actors

`content_reviewer` · `super_admin`.

## 3. Entry points

`/studio/lessons` · `/studio/lessons/new` · `/studio/lessons/{code}/{version}`.

## 4. Main flow

1. Chọn learning objective mục tiêu → hệ thống gợi ý band tuổi và thời lượng.
2. Điền khung §7.1.
3. Lắp activity: tìm trong thư viện activity, kéo thả vào đúng vị trí.
4. Đặt activity nào **bắt buộc**, nào tuỳ chọn.
5. Đặt `access_tier`, tag ba trục.
6. Lưu nháp → gửi duyệt.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Activity chưa tồn tại | Tạo mới ngay trong luồng (`activity-authoring`), quay lại lesson |
| Tổng thời lượng vượt 45 phút | Cảnh báo, ❌ không chặn — người soạn quyết định |
| Activity bị archive sau khi lắp | Lesson vẫn giữ tham chiếu; cổng publish báo lỗi |
| Sửa lesson đã published | Tạo version mới |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LSA-01` | Lesson có **≥1 activity** mới publish được | Lesson rỗng không dạy được gì |
| `BR-LSA-02` | `estimated_minutes ∈ [5,45]` | Trẻ 3–6 không tập trung dài hơn |
| `BR-LSA-03` | Mọi activity tham chiếu phải ở trạng thái `published` khi lesson publish | Lesson trỏ activity draft là lesson hỏng |
| `BR-LSA-04` | Lesson **bắt buộc** có `guide_vi` cho người lớn | Người dạy là người lớn, không phải trẻ |
| `BR-LSA-05` | Activity dùng lại được ở nhiều lesson; sửa activity ảnh hưởng mọi lesson dùng nó | Đó là lý do tách activity ra |
| `BR-LSA-06` | Lesson nên có **ít nhất một hoạt động ngoài màn hình** | Sản phẩm ❌ không tối ưu cho thời gian màn hình |
| `BR-LSA-07` | Tag ba trục bắt buộc trước khi publish | `BR-TAG-02` |
| `BR-LSA-08` | ❌ **NEVER publish trực tiếp** — qua `in_review` | |

## 7. Data

### 7.1 Khung lesson

| Phần | Bắt buộc |
|---|:--:|
| `title_vi` | ✅ |
| `learning_objective_codes` | ✅ ≥1 |
| `target_age_min` / `max` | ✅ |
| `estimated_minutes` | ✅ |
| `materials_vi` — vật liệu cần chuẩn bị | ❌ |
| `guide_vi` — hướng dẫn cho người lớn | ✅ |
| `warm_up_vi` | ❌ |
| Activity (có thứ tự, có cờ bắt buộc) | ✅ ≥1 |
| `reflection_vi` — câu hỏi gợi mở sau bài | ❌ |
| `assessment_vi` — cách quan sát trẻ đã đạt chưa | ❌ |
| `extension_vi` — làm thêm ở nhà | ❌ |
| `access_tier` | ✅ |

### 7.2 Màn hình

Trái: khung lesson dạng form. Phải: danh sách activity đã lắp, kéo thả sắp xếp, kèm tổng
thời lượng chạy. Dưới: tìm activity trong thư viện, lọc theo skill và loại.

## 8. API contract

### `POST /api/managers/lessons` · `PATCH /api/managers/lessons/{code}/{version}`

Body theo §7.1 + `expected_version`. 422 khi thiếu trường bắt buộc.

### `PUT /api/managers/lessons/{code}/{version}/activities`

Body `{ items: [{ activity_code, position, is_required }] }`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LSA-01 — lesson rỗng không publish được
  Given một lesson không có activity nào
  When gửi duyệt
  Then trả 422
  And missing chứa activities

Scenario: BR-LSA-03 — activity draft chặn publish
  Given một lesson tham chiếu một activity ở draft
  When publish lesson
  Then trả 422
  And missing nêu activity đó

Scenario: BR-LSA-02 — thời lượng trong khoảng
  When đặt estimated_minutes = 90
  Then trả 422

Scenario: BR-LSA-04 — guide bắt buộc
  When gửi duyệt mà guide_vi rỗng
  Then trả 422

Scenario: BR-LSA-05 — sửa activity ảnh hưởng mọi lesson
  Given activity A dùng ở lesson X và Y
  When publish version mới của A
  Then cả X và Y đều tham chiếu bản mới

Scenario: BR-LSA-06 — cảnh báo khi thiếu hoạt động ngoài màn hình
  Given một lesson chỉ có activity kiểu digital_game
  When gửi duyệt
  Then hiện cảnh báo
  And vẫn cho gửi duyệt

Scenario: kéo thả đổi thứ tự
  When kéo activity thứ 3 lên vị trí 1
  Then position được cập nhật đúng
  And tổng thời lượng không đổi
```

## 10. Boundaries

**Always**
- ≥1 activity, có `guide_vi`.
- Kiểm activity `published` khi publish lesson.
- Tag ba trục trước khi publish.

**Ask first**
- Nới khoảng `estimated_minutes`.
- Thêm phần vào khung lesson.

**Never**
- Publish lesson rỗng.
- Publish khi còn activity `draft`.
- Publish trực tiếp không qua duyệt.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | **Ai biên soạn ≥60 lesson?** Seeder + AI agent IDE soạn khung được, nhưng phần sư phạm cần người | P3 |
| 2 | Lesson có nên ghim version của activity không, hay luôn lấy bản mới nhất? | `content-versioning` Q2 |
