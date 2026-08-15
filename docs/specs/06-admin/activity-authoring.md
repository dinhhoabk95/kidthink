---
spec: ACTIVITY-AUTHORING
title: Soạn hoạt động
area: admin
status: implemented
mvp: true
phase: P3
reviewed: 2026-08-08
owns:
  - Luồng soạn một activity
  - Mười loại activity
depends_on:
  - ACTIVITY-MODEL
  - CONTENT-LIFECYCLE
  - SCHEMA-DRIVEN-FORM
---

# Soạn hoạt động

## 1. Objective

Activity là **đơn vị nhỏ nhất tái sử dụng được**. Một activity xuất hiện trong nhiều lesson;
sửa một lần, mọi lesson dùng nó đều được cập nhật.

Đây là lý do activity tách khỏi lesson — nếu gộp, mỗi lesson phải viết lại cùng một hoạt
động, và sửa một chỗ không sửa được chỗ khác.

## 2. Actors

`content_reviewer` · `super_admin`.

## 3. Entry points

`/studio/activities` · tạo nhanh từ trong [`lesson-authoring.md`](lesson-authoring.md).

## 4. Main flow

1. Chọn `kind` — quyết định trường nào hiện ra.
2. Điền `title`, `instruction`, `estimated_minutes`.
3. Nếu `kind = digital_game` → chọn game level đã published.
4. Gắn skill + LO, tag ba trục, `access_tier`.
5. Lưu nháp → gửi duyệt.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| `kind = digital_game` nhưng chưa có level phù hợp | Link sang studio tạo level trước |
| Đổi `kind` sau khi điền | Cảnh báo mất trường không tương thích |
| Activity đang dùng ở lesson published | Sửa → version mới; lesson tham chiếu bản mới sau khi publish |
| Archive activity đang dùng | **409** `CONTENT_IN_USE` kèm danh sách lesson |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ACA-01` | `kind` quyết định trường hiện ra | 10 loại có nhu cầu rất khác nhau |
| `BR-ACA-02` | `kind = digital_game` **bắt buộc** trỏ tới game level `published` | Trỏ level draft là activity hỏng |
| `BR-ACA-03` | `estimated_minutes ∈ [2,20]` | Activity dài hơn nên là lesson |
| `BR-ACA-04` | Activity Cấm — **NEVER xoá cứng** khi đang dùng | Bảo vệ tính toàn vẹn của các lesson đang sử dụng và tránh làm đứt gãy kịch bản học tập |
| `BR-ACA-05` | Hoạt động ngoài màn hình ghi rõ **vật liệu cần chuẩn bị** | Người lớn cần chuẩn bị trước, không giữa chừng |
| `BR-ACA-06` | Tag ba trục bắt buộc trước publish | Đảm bảo dữ liệu được phân loại chuẩn xác phục vụ việc tìm kiếm và khuyến nghị sư phạm |
| `BR-ACA-07` | Sửa activity đã published → version mới | Bảo toàn lịch sử các bản biên soạn và tránh ảnh hưởng ngoài ý muốn đến nội dung đã phát hành |

## 7. Data

### 7.1 Mười loại

| `kind` | Trường đặc thù |
|---|---|
| `digital_game` | `ref_id` → game level (`entity_id`, D-AE) |
| `discussion` | Câu hỏi gợi mở |
| `storytelling` | Nội dung truyện hoặc link |
| `movement` | Không gian cần, an toàn |
| `manipulative` | Vật liệu (khối, thẻ, hạt) |
| `worksheet` | `ref_id` → worksheet (`entity_id`, D-AE) |
| `observation` | Điều cần quan sát ở trẻ |
| `mini_project` | Nhiều buổi, vật liệu |
| `assessment` | Tiêu chí quan sát |
| `home_activity` | Hướng dẫn cho phụ huynh |

Bảy trong mười loại là **hoạt động ngoài màn hình**. Đó là chủ ý — sản phẩm không tối ưu
cho thời gian màn hình.

### 7.2 Trường chung

`code` · `title` · `instruction` · `estimated_minutes` · `materials` ·
`skill_ids` + `weight` · `learning_objective_ids` · tag ba trục · `access_tier` ·
`status` · `content_version`.

## 8. API contract

### `POST /api/managers/activities` · `PATCH .../{code}/{version}`

422 khi `kind = digital_game` mà `ref_id` trỏ level không `published`.

### `GET /api/managers/activities`

Chạy trên mặt tìm kiếm dùng chung của [`content-search.md`](../01-platform/content-search.md), cursor, trần chung, bộ lọc `kind` `skill` `age` (suy từ taxonomy) `duration_max` `status`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ACA-02 — digital_game phải trỏ level published
  Given một activity kind digital_game trỏ tới level draft
  When gửi duyệt
  Then trả 422

Scenario: BR-ACA-01 — trường thay đổi theo kind
  When chọn kind manipulative
  Then trường materials hiện ra
  When chọn kind digital_game
  Then trường ref_id hiện ra thay thế

Scenario: BR-ACA-03 — thời lượng trong khoảng
  When đặt estimated_minutes = 40
  Then trả 422

Scenario: BR-ACA-04 — không archive activity đang dùng
  Given activity dùng ở một lesson published
  When archive
  Then trả 409 CONTENT_IN_USE kèm danh sách lesson

Scenario: BR-ACA-05 — hoạt động ngoài màn hình có vật liệu
  Given kind manipulative và materials rỗng
  When gửi duyệt
  Then trả 422

Scenario: sửa activity ảnh hưởng mọi lesson dùng nó
  Given activity A ở lesson X và Y
  When publish version mới của A
  Then X và Y đều dùng bản mới
```

## 10. Boundaries

**Always**
- Kiểm `ref_id` trỏ nội dung `published`.
- Vật liệu bắt buộc cho hoạt động ngoài màn hình.
- Tag ba trục trước publish.
- Autosave 30 giây; lưu fail giữ nguyên toàn bộ form (`BR-STU-03`).
- Ghi audit_logs mọi thao tác (`BR-STU-05`).

**Ask first**
- Thêm `kind` thứ 11.
- Nới khoảng thời lượng.

**Never**
- Trỏ tới nội dung `draft`.
- Xoá cứng activity đang dùng.
- Publish trực tiếp.
- Ghi `game_templates`, `skills`, `learning_objectives` từ studio (`BR-STU-01`).

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Activity ngoài màn hình có cần hình minh hoạ không? Tốn công soạn nhưng dễ theo hơn | P3 | hoãn — MVP chỉ yêu cầu mô tả văn bản chi tiết; hình ảnh minh họa cho activity ngoài màn hình bổ sung ở P4 | Nội dung |

