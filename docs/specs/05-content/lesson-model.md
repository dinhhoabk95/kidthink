---
spec: LESSON-MODEL
title: Mô hình bài học — ràng buộc biên tập
area: content
status: implemented
mvp: true
phase: P3
reviewed: 2026-08-08
owns:
  - Ràng buộc biên tập của một lesson
depends_on:
  - ACTIVITY-MODEL
  - SCHEMA-CONTENT-TAXONOMY
---

# Mô hình bài học — ràng buộc biên tập

## 1. Objective

Một lesson là **kịch bản 20–30 phút** mà người lớn mở ra và biết phải làm gì.

Khác biệt then chốt so với game level: lesson có **người lớn tham gia**, và phần lớn giá trị
nằm ở hoạt động **ngoài màn hình**.

## 2. Actors

Người soạn · người duyệt · người dạy (phụ huynh hoặc giáo viên).

## 3. Entry points

`06-admin/lesson-authoring.md`.

## 4. Main flow

Không có. Spec ràng buộc.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LSM-01` | Lesson có **cung bậc**: khởi động → hoạt động chính → đúc kết | Trẻ cần vào và ra khỏi trạng thái tập trung |
| `BR-LSM-02` | ≥1 hoạt động **ngoài màn hình** | Sản phẩm không tối ưu cho thời gian màn hình |
| `BR-LSM-03` | `guide` viết cho **người lớn không được đào tạo** | Phụ huynh không phải giáo viên |
| `BR-LSM-04` | Vật liệu phải là thứ **có sẵn trong nhà** | Yêu cầu mua đồ làm lesson không dùng được |
| `BR-LSM-05` | Tổng thời lượng 15–30 phút, trần cứng 45 | Tối ưu khoảng thời gian tập trung hiệu quả của trẻ mầm non mà không gây quá tải |
| `BR-LSM-06` | Phần đánh giá mô tả **hành vi quan sát được**, không mức độ trừu tượng | "Bé chỉ đúng vật to hơn" đo được; "bé hiểu khái niệm kích thước" thì không |
| `BR-LSM-07` | Cấm — **NEVER giả định trẻ biết đọc** | Đảm bảo trẻ 3-6 tuổi chưa biết đọc chữ vẫn tham gia và hiểu được hướng dẫn học tập |
| `BR-LSM-08` | Lesson phục vụ **một cụm learning objective liên quan**, không rải rác | Giữ sự tập trung vào một mục tiêu sư phạm cốt lõi và tránh làm rối kiến thức |
| `BR-LSM-09` | Phần mở rộng là **tuỳ chọn**, không bắt buộc | Người dạy quyết định theo sức trẻ hôm đó |

## 7. Data

### 7.1 Cấu trúc chuẩn

| Phần | Thời lượng | Bắt buộc |
|---|---|:--:|
| Khởi động | 2–5 phút | Cấm khuyến nghị |
| Hoạt động chính | 10–20 phút | |
| — trong đó ≥1 ngoài màn hình | | |
| Đúc kết / phản hồi | 2–5 phút | Cấm khuyến nghị |
| Đánh giá | quan sát trong lúc làm | Cấm |
| Mở rộng | tuỳ chọn | Cấm |

### 7.2 `guide` phải trả lời

1. Bài này giúp bé làm được gì? (một câu)
2. Cần chuẩn bị gì? (danh sách)
3. Bắt đầu thế nào? (câu mở đầu cụ thể để nói với bé)
4. Nếu bé làm được ngay thì sao?
5. Nếu bé chưa làm được thì sao?

Câu 4 và 5 là phần hay bị bỏ, và là phần người dạy cần nhất.

### 7.3 Ngôn ngữ phần đánh giá

| Cấm Tránh | Dùng |
|---|---|
| "Bé hiểu khái niệm số lượng" | "Bé chỉ đúng nhóm có nhiều hơn trong 3 lần thử" |
| "Bé phát triển tư duy logic" | "Bé nói được lý do vì sao xếp như vậy" |

## 8. API contract

Không sở hữu route. Ràng buộc ép ở cổng publish.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LSM-02 — bắt buộc hoạt động ngoài màn hình
  Given một lesson chỉ có activity kiểu digital_game
  When gửi duyệt
  Then hiện cảnh báo bắt buộc xác nhận

Scenario: BR-LSM-05 — trần thời lượng
  Given tổng thời lượng activity là 60 phút
  When gửi duyệt
  Then trả 422

Scenario: BR-LSM-03 — guide trả lời đủ 5 câu
  Given guide thiếu phần "nếu bé chưa làm được"
  When người duyệt kiểm checklist
  Then mục đó không tick được

Scenario: BR-LSM-06 — đánh giá mô tả hành vi
  When đọc phần assessment của mọi lesson published
  Then mỗi mô tả nêu hành vi quan sát được
  And không dùng từ trừu tượng như hiểu, nắm được

Scenario: BR-LSM-07 — không giả định biết đọc
  When đọc mọi hướng dẫn dành cho trẻ trong lesson
  Then không hoạt động nào yêu cầu trẻ tự đọc chữ

Scenario: BR-LSM-04 — vật liệu có sẵn
  When đọc materials của mọi lesson
  Then không lesson nào yêu cầu mua đồ chuyên dụng
```

## 10. Boundaries

**Always**
- Có cung bậc khởi động → chính → đúc kết.
- ≥1 hoạt động ngoài màn hình.
- `guide` trả lời đủ 5 câu.

**Ask first**
- Nới trần thời lượng.
- Đổi cấu trúc chuẩn.

**Never**
- Giả định trẻ biết đọc.
- Yêu cầu vật liệu phải mua.
- Ngôn ngữ trừu tượng trong phần đánh giá.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | **Ai biên soạn ≥60 lesson?** Cần người có nền sư phạm mầm non | P3 | Đồng bộ nợ `D-W` ở [`mvp-scope.md`](../00-foundation/mvp-scope.md) Q1 — Seeder + AI hỗ trợ bản thô, Chuyên gia sư phạm mầm non đọc và duyệt | người quyết |
| 2 | Lesson có cần bản cho giáo viên khác bản cho phụ huynh không? | P3 | hoãn — MVP chỉ có 1 bản hướng dẫn chung dành cho phụ huynh/người hướng dẫn; bản giáo viên hoãn sang P4 | Nội dung |
