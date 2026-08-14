---
spec: TAXONOMY-BROWSER
title: Duyệt cây taxonomy
area: admin
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Bề mặt duyệt taxonomy trong admin
  - Chỉ báo khoảng trống nội dung
depends_on:
  - TAXONOMY-SERVICE
  - ADMIN-AUTH
---

# Duyệt cây taxonomy

## 1. Objective

Người soạn nội dung cần trả lời hai câu hỏi: **"skill này là gì"** và **"skill nào còn
thiếu nội dung"**.

Câu thứ hai quan trọng hơn. Nó là đường phản hồi từ dữ liệu về kế hoạch biên soạn — không có
nó thì việc chọn soạn gì tiếp là đoán.

Taxonomy là **Lớp 1**: màn hình này **chỉ đọc**.

## 2. Actors

`super_admin` và `content_reviewer` — cả hai chỉ đọc.

## 3. Entry points

`/taxonomy` · `/taxonomy/{skill_code}` · `GET /api/managers/taxonomy`.

## 4. Main flow

1. Duyệt cây 4 tầng, gấp mở được.
2. Mỗi nút hiện **số nội dung đã published** gắn với nó.
3. Nút không có nội dung nào → **đánh dấu nổi bật**.
4. Mở một skill → LO, prerequisite, nội dung đang gắn, và nút "soạn level cho skill này".

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Skill có nội dung nhưng toàn `draft` | Đếm riêng `draft` và `published` |
| Skill `deprecated` | Hiện mờ, không cho soạn mới |
| Muốn sửa taxonomy | Hiện thông báo: taxonomy đổi qua PR, kèm link tài liệu |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TXB-01` | Màn hình **chỉ đọc**. Cấm tạo/sửa/xoá | Taxonomy là Lớp 1 — mọi FK trỏ vào đây |
| `BR-TXB-02` | Hiện **số nội dung published** mỗi nút | Đây là lý do chính màn hình tồn tại |
| `BR-TXB-03` | Skill **0 nội dung published** đánh dấu nổi bật | Khoảng trống nội dung là việc phải làm, không phải thông tin phụ |
| `BR-TXB-04` | Có nút **"soạn level cho skill này"** dẫn thẳng sang studio với skill đã chọn sẵn | Giảm ma sát từ phát hiện khoảng trống tới hành động |
| `BR-TXB-05` | Hiện đồ thị prerequisite của skill | Người soạn cần biết skill này đứng sau cái gì |
| `BR-TXB-06` | Cache 5 phút; số đếm nội dung có `as_of` | Đếm trực tiếp trên toàn cây mỗi lần mở màn hình là quét hết `content_skill_map` cho 230 skill mỗi request. `as_of` cho người soạn biết số đang xem cũ tới đâu, thay vì ngầm định nó luôn tức thời |

## 7. Data

### 7.1 Cây

```
C1 Tư duy toán học            99 skill · 412 level published
 └ C1.CNT Counting            12 skill · 58 level
    └ C1.CNT.03 Đếm trong 5    4 LO  ·  7 level  ·  2 lesson
```

### 7.2 Chi tiết một skill

| Phần | Nội dung |
|---|---|
| Định danh | `code` · `name_vi` · `description_vi` |
| Thuộc tính | band tuổi · `difficulty` · thinking processes · trục `what` |
| Learning objective | Danh sách, mỗi cái kèm số nội dung gắn |
| Prerequisite | Skill đứng trước, và skill mà nó mở khoá |
| Nội dung | Level và lesson gắn với skill, kèm `weight` và trạng thái |
| Hành động | "Soạn level cho skill này" → studio |

### 7.3 Chỉ báo khoảng trống

| Chỉ báo | Điều kiện |
|---|---|
| Chưa có nội dung | 0 level published |
| Mỏng | 1–2 level published |
| Đủ | ≥3 level published |
| LO chưa phủ | Có LO không level nào gắn |

## 8. API contract

### `GET /api/managers/taxonomy`

Query `?depth=` `?gaps_only=true`. 200 → cây kèm số đếm và `as_of`.

### `GET /api/managers/taxonomy/skills/{code}`

200 → §7.2.

Cấm có `POST`, `PATCH`, `DELETE`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-TXB-01 — không sửa được taxonomy
  When gọi POST hoặc PATCH tới route taxonomy admin
  Then route không tồn tại hoặc trả 405

Scenario: BR-TXB-03 — skill trống được đánh dấu
  Given một skill chưa có level published nào
  When mở cây taxonomy
  Then skill đó mang chỉ báo đỏ

Scenario: BR-TXB-02 — số đếm chính xác
  Given skill C1.CNT.03 có 7 level published và 3 draft
  When mở cây
  Then hiện 7 published và 3 draft riêng biệt

Scenario: BR-TXB-04 — nút soạn dẫn sang studio
  When bấm "soạn level cho skill này"
  Then studio mở với skill đã chọn sẵn

Scenario: lọc chỉ khoảng trống
  When gọi GET /api/managers/taxonomy?gaps_only=true
  Then chỉ trả skill có 0 level published

Scenario: cả hai role đọc được
  Given manager role content_reviewer
  When gọi GET /api/managers/taxonomy
  Then trả 200
```

## 10. Boundaries

**Always**
- Chỉ đọc.
- Hiện số nội dung published mỗi nút.
- Đánh dấu khoảng trống nổi bật.

**Ask first**
- Đổi ngưỡng chỉ báo mỏng/đủ.
- Thêm chỉ báo mới.

**Never**
- Cho sửa taxonomy từ UI.
- Ẩn khoảng trống nội dung.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Ngưỡng "đủ" ở §7.3 là **3 level mỗi skill** — với 230 skill thì cần 690 level để mọi skill đạt "đủ", nhưng mục tiêu MVP đã cam kết ở [`mvp-scope.md`](../00-foundation/mvp-scope.md) §7 chỉ là **≥120 game level published** (mốc tối thiểu 80). Ngưỡng "đủ" ở đây gấp 5,75 lần con số MVP thật sự nhắm tới — nghĩa là ở MVP, phần lớn cây sẽ hiện "mỏng", không phải vì thiếu mà vì ngưỡng đặt cho quy mô sau MVP. **Không tự hạ ngưỡng** — đây là tín hiệu cho người soạn, hạ ngưỡng để cây "xanh" giả tạo đánh mất đúng mục đích tồn tại của màn hình (`BR-TXB-03`) | Kế hoạch nội dung — cùng câu hỏi gốc với [`mvp-scope.md`](../00-foundation/mvp-scope.md) §11 Q1 (`D-W`, "ai biên soạn ≥690 LO, ≥120 game level") | P1 | người quyết |
