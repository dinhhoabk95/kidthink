---
spec: CURRICULUM-BUILDER
title: Dựng chương trình học
area: admin
status: approved
mvp: true
phase: P3
reviewed: 2026-08-08
owns:
  - Luồng dựng và sắp xếp curriculum
  - Ràng buộc cấu trúc chương trình
depends_on:
  - CURRICULUM-MODEL
  - LESSON-AUTHORING
  - CONTENT-LIFECYCLE
---

# Dựng chương trình học

## 1. Objective

Curriculum **không phải tài sản gốc** — nó là **một thứ tự** trên thư viện.

Cùng một Lesson Library sinh ra được 42 tuần, chương trình theo tuổi, Logic Track, School
Readiness — **không biên soạn lại nội dung**. Builder là công cụ để làm điều đó nhanh.

## 2. Actors

`content_reviewer` · `super_admin`.

## 3. Entry points

`/studio/curricula` · `/studio/curricula/{code}/{version}`.

## 4. Main flow

1. Tạo curriculum: `title`, `program_type`, band tuổi, `duration_weeks`,
   `sessions_per_week`, `access_tier`.
2. Lưới tuần × buổi hiện ra, rỗng.
3. Kéo lesson hoặc game level từ thư viện bên phải vào ô.
4. Đặt item **bắt buộc** hay tuỳ chọn.
5. Xem **chỉ báo cân bằng** §7.2.
6. Preview lộ trình → gửi duyệt.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Tuần rỗng | Cổng publish **chặn** — `BR-CBD-02` |
| Item chưa `published` | Cảnh báo; publish curriculum bị chặn |
| Sao chép curriculum | Tạo bản mới, copy toàn bộ item, mã mới |
| Đổi `duration_weeks` giảm | Cảnh báo item ở tuần bị cắt sẽ mất |
| Trẻ đang học version cũ | Không ảnh hưởng — `BR-CUR-04` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CBD-01` | Curriculum **tham chiếu** nội dung, không sở hữu | Một lesson xuất hiện trong nhiều curriculum, chỉ tồn tại một bản gốc |
| `BR-CBD-02` | Cấm — **NEVER publish curriculum có tuần rỗng** | Tuần rỗng làm trẻ dừng lộ trình giữa chừng |
| `BR-CBD-03` | Mọi item phải `published` khi curriculum publish | Đảm bảo người học không gặp lỗi gián đoạn do trỏ tới nội dung chưa phát hành |
| `BR-CBD-04` | Mỗi tuần có **≥3 hoạt động** | Dưới đó không đủ cho một tuần |
| `BR-CBD-05` | Chỉ báo cân bằng competency hiện thường trực | Chương trình lệch về một competency là lỗi sư phạm khó thấy bằng mắt |
| `BR-CBD-06` | Prerequisite của item được kiểm: skill tiên quyết phải xuất hiện **trước** trong lộ trình | Dạy phép so sánh trước khi dạy đếm là sai thứ tự |
| `BR-CBD-07` | Cấm — **NEVER gắn hạn thời gian** vào tuần | "Tuần 3" là thứ tự, không phải lịch — `BR-CUR-08` |
| `BR-CBD-08` | Sửa curriculum đã published → version mới | Giữ tính ổn định cho trẻ đang theo học bản cũ và bảo toàn lịch sử biên soạn |

## 7. Data

### 7.1 Cấu trúc

```
Curriculum → Level → Module → Week → Session → item (lesson | game_level)
```

Không curriculum nào bắt buộc dùng đủ mọi tầng; MVP dùng **Week → Session → item**.

### 7.2 Chỉ báo cân bằng

| Chỉ báo | Cảnh báo khi |
|---|---|
| Phân bố competency | Một competency > 40% tổng item |
| Competency bị bỏ | Có competency 0 item |
| Độ khó tăng dần | Độ khó trung bình tuần N+1 thấp hơn tuần N nhiều |
| Thời lượng buổi | Buổi > 45 phút |
| Trùng lặp | Cùng một item xuất hiện 2 lần trong 4 tuần |
| Prerequisite ngược | Skill xuất hiện trước skill tiên quyết của nó |

Sáu chỉ báo này là giá trị chính của builder — kéo thả thì tay làm được, cân bằng thì không.

### 7.3 Màn hình

Trái 65%: lưới tuần × buổi. Phải 35%: thư viện lesson/level có bộ lọc.
Trên: chỉ báo cân bằng dạng thanh. Dưới: cảnh báo còn lại.

## 8. API contract

### `POST /api/managers/curricula` · `PATCH .../{code}/{version}`

- `POST` body: `{ program_type, target_age_min, target_age_max, duration_weeks, sessions_per_week, access_tier, title_vi, description_vi }` (`D-LT`).
- `PATCH` body: metadata fields + `expected_version` lock.

### `PUT /api/managers/curricula/{code}/{version}/items`

Body `{ items: [{ week_no, session_no, position, entity_type, entity_id, is_required }], expected_version }` (`D-LS`, `D-LW`, `D-LX`).
`entity_id` là `entity_id` (neo dòng dõi, `D-AE`) của bảng đích — luôn bản `published` mới nhất.
Thời lượng buổi là số suy ra lúc đọc, không lưu trên item (`D-LX`).
Thay toàn bộ trong một transaction, có `expected_version` concurrency control.

### `PUT /api/managers/curricula/{code}/{version}/weeks`

Body `{ weeks: [{ week_no, goal }], expected_version }` lưu mục tiêu tuần cho người lớn (`BR-CRM-10`, `D-LT`).

### `POST /api/managers/curricula/{code}/{version}/duplicate`

Tạo bản draft mới với mã mới, copy toàn bộ items và week goals (`BR-CBD-08`).

### `GET /api/managers/curricula/{code}/{version}/balance`

200 → sáu chỉ báo §7.2 (dùng cùng một hàm với cổng publish, `D-LZ`).

## 9. Acceptance criteria

```gherkin
Scenario: BR-CBD-02 — tuần rỗng chặn publish
  Given một curriculum 12 tuần có tuần 7 rỗng
  When publish
  Then trả 422
  And missing nêu tuần 7

Scenario: BR-CBD-03 — item draft chặn publish
  Given một curriculum chứa một lesson ở draft
  When publish
  Then trả 422

Scenario: BR-CBD-04 — tuần dưới 3 hoạt động bị chặn
  Given một tuần chỉ có 2 item
  When publish
  Then trả 422

Scenario: BR-CBD-05 — cảnh báo lệch competency
  Given 60% item thuộc C1
  When mở builder
  Then chỉ báo cân bằng cảnh báo

Scenario: BR-CBD-06 — cảnh báo prerequisite ngược
  Given skill B là prerequisite của skill A
  And item dạy A xuất hiện ở tuần 2, item dạy B ở tuần 5
  Then builder cảnh báo thứ tự ngược

Scenario: BR-CBD-01 — curriculum không sở hữu nội dung
  When xoá một curriculum
  Then lesson và game level trong đó vẫn còn nguyên

Scenario: sao chép curriculum
  When sao chép một curriculum 12 tuần
  Then bản mới có mã mới và đủ item
  And bản gốc không đổi

Scenario: BR-CBD-08 — sửa bản published tạo version mới
  Given một curriculum published version 1
  When bấm sửa
  Then tạo version 2 ở draft
```

## 10. Boundaries

**Always**
- Kiểm tuần rỗng và item `draft` trước khi publish.
- Hiện sáu chỉ báo cân bằng.
- Thay toàn bộ danh sách item khi lưu thứ tự.

**Ask first**
- Đổi ngưỡng chỉ báo.
- Nới ràng buộc ≥3 hoạt động mỗi tuần.

**Never**
- Publish curriculum có tuần rỗng.
- Curriculum sở hữu nội dung.
- Gắn hạn thời gian vào tuần.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Curriculum item ghim version của lesson hay lấy bản mới nhất?~~ **Đóng 2026-08-09 (D-VER-02 không tồn tại, dùng D-AE, T15)**: `D-VER-02` không có trong corpus — trích dẫn sai. Quyết định thật là **`D-AE`** ở [`content-versioning.md`](../00-foundation/content-versioning.md) §7.4: curriculum item **luôn theo bản `published` mới nhất** qua `entity_id`, **không ghim**. Ghim chỉ áp cho dữ liệu chơi đã xảy ra (`play_sessions`), không áp cho tham chiếu nội dung sang nội dung | P3 | Đã đóng | D-AE |
| 2 | 42 tuần cần ~126 buổi — với ≥60 lesson MVP thì mỗi lesson dùng lại 2 lần. Chấp nhận được không? | P3 | Đóng theo `D-LA` & `D-LU`: Thư viện lesson thiết kế đủ số lượng theo nhu cầu curriculum thực tế | người quyết |
