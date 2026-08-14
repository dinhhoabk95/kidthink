---
spec: PROGRAM-SHOWCASE
title: Trưng bày chương trình học
area: public
status: approved
mvp: true
phase: P3
reviewed: 2026-08-08
owns:
  - Trang giới thiệu chương trình cho khách
depends_on:
  - CURRICULUM-MODEL
  - SEO-AND-STRUCTURED-DATA
---

# Trưng bày chương trình học

## 1. Objective

Cho phụ huynh thấy **lộ trình**, không chỉ một đống game rời rạc.

"Chương trình 42 tuần cho bé 4 tuổi" bán được; "120 trò chơi" thì không — lộ trình là thứ
tạo cảm giác có kế hoạch.

## 2. Actors

Guest · User.

## 3. Entry points

`/programs` · `/programs/{code}` · `GET /api/guest/curricula`.


## 4. Main flow

1. Danh sách chương trình, nhóm theo: **theo tuổi** · **theo năng lực** · **chuyên đề**.
2. Mở một chương trình → tổng quan: đối tượng, thời lượng, mục tiêu, cấu trúc tuần.
3. Xem **vài tuần đầu chi tiết**; phần còn lại tóm tắt.
4. CTA: đăng ký hoặc nâng cấp tuỳ bậc.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chương trình `premium` | Hiện đủ tổng quan + 2 tuần đầu; còn lại tóm tắt kèm khoá |
| Chưa đăng nhập | CTA đăng ký |
| Đã có quyền | CTA "Ghi danh cho bé" |
| Chương trình archived | 410 + gợi ý chương trình khác |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PSH-01` | Hiện **cấu trúc đầy đủ** (bao nhiêu tuần, mỗi tuần mấy hoạt động), giấu **nội dung chi tiết** | Cấu trúc bán được; nội dung là thứ trả tiền |
| `BR-PSH-02` | Hiện chi tiết **2 tuần đầu** kể cả với chương trình trả phí | Mẫu đủ để đánh giá chất lượng |
| `BR-PSH-03` | Cấm — **NEVER trả `content_pack`** của item trong chương trình | Bảo vệ sở hữu trí tuệ và ngăn chặn việc tải toàn bộ nội dung học tập mà không qua mua gói |
| `BR-PSH-04` | Structured data `Course` sinh từ dữ liệu | Cung cấp dữ liệu cấu trúc chuẩn cho công cụ tìm kiếm giúp tăng thứ hạng SEO tự nhiên |
| `BR-PSH-05` | Chương trình archived → **410** | `BR-GDP-03` |
| `BR-PSH-06` | Cấm — **NEVER hứa hẹn kết quả** — mô tả **hoạt động**, không mô tả **thành tựu** | `BR-LND-06` |
| `BR-PSH-07` | Prerender, không phụ thuộc JS | Tối ưu hóa thời gian tải trang đầu tiên và đảm bảo công cụ tìm kiếm cào được nội dung đầy đủ |

## 7. Data

### 7.1 Trang tổng quan chương trình

| Phần | Nội dung |
|---|---|
| Tiêu đề, mô tả | |
| Đối tượng | Band tuổi |
| Thời lượng | Số tuần × buổi/tuần |
| Mục tiêu | Learning objective chính, nhóm theo competency |
| Phân bố năng lực | Biểu đồ 6 competency |
| Cấu trúc | Danh sách tuần với chủ đề, 2 tuần đầu có chi tiết |
| Bậc truy cập | + CTA phù hợp |

### 7.2 Nhóm chương trình

| Nhóm | Ví dụ |
|---|---|
| Theo tuổi | 3 · 4 · 5 · 6 tuổi |
| Theo năng lực | Logic · Không gian |
| Chuyên đề | Sẵn sàng vào lớp 1 |

## 8. API contract

### `GET /api/guest/curricula`

200 → danh sách kèm metadata. Cache `public, max-age=600`.

### `GET /api/guest/curricula/{code}`

200 → tổng quan + 2 tuần đầu chi tiết + phần còn lại tóm tắt. 410 nếu archived.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PSH-01 — hiện cấu trúc giấu nội dung
  Given guest mở một chương trình premium
  Then thấy số tuần và số hoạt động mỗi tuần
  And không thấy content_pack của hoạt động nào

Scenario: BR-PSH-02 — 2 tuần đầu có chi tiết
  Given một chương trình premium
  When guest mở trang
  Then tuần 1 và 2 hiện tên từng hoạt động
  And từ tuần 3 chỉ có chủ đề

Scenario: BR-PSH-05 — archived trả 410
  Given một chương trình bị archive
  When mở URL
  Then trả 410 kèm gợi ý

Scenario: BR-PSH-06 — không hứa hẹn kết quả
  When đọc mô tả mọi chương trình
  Then không câu nào hứa bé sẽ đạt được gì

Scenario: BR-PSH-07 — hiện khi tắt JS
  Given JavaScript tắt
  When mở trang chương trình
  Then cấu trúc tuần vẫn hiển thị

Scenario: BR-PSH-04 — structured data Course
  When kiểm JSON-LD
  Then có Course với educationalLevel khớp band tuổi
```

## 10. Boundaries

**Always**
- Hiện cấu trúc đầy đủ.
- Cho xem 2 tuần đầu chi tiết.
- Prerender.

**Ask first**
- Đổi số tuần được xem miễn phí.
- Thêm nhóm chương trình.

**Never**
- Trả `content_pack` của item.
- Hứa hẹn kết quả học tập.
- 404 cho chương trình đã archive.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | 2 tuần miễn phí có quá nhiều hay quá ít? | P3 | Giữ 2 tuần xem thử cho MVP để phụ huynh có đủ trải nghiệm đánh giá trước khi nâng cấp | người quyết |
