---
spec: WORKSHEET-MODEL
title: Mô hình phiếu bài tập
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-08-04
owns:
  - Ràng buộc biên tập và kỹ thuật của worksheet
depends_on:
  - ACTIVITY-MODEL
  - PDF-EXPORT
---

# Mô hình phiếu bài tập

## 1. Objective

Worksheet là hoạt động **giấy** — thứ trẻ làm bằng bút chì, ❌ không bằng màn hình.

**Ngoài MVP.** Nó phụ thuộc `pdf-export` (add-on) và cần thiết kế in ấn riêng. Spec viết
trước để mô hình dữ liệu ❌ không phải làm lại.

## 2. Actors

Người soạn · người dạy · trẻ (làm trên giấy).

## 3. Entry points

`/studio/worksheets` (P4) · tải PDF từ lesson.

## 4. Main flow

1. Soạn worksheet từ mẫu, gắn learning objective.
2. Render PDF A4, xem trước.
3. Duyệt và publish.
4. Người dạy tải từ trong lesson.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Render PDF fail | ❌ Không publish được |
| Không có máy in | Lesson phải có hoạt động thay thế |
| In đen trắng | Worksheet phải dùng được ở đen trắng |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-WSM-01` | Worksheet phải dùng được khi in **đen trắng** | Không phải nhà nào cũng có máy in màu |
| `BR-WSM-02` | ❌ **NEVER yêu cầu trẻ đọc chữ** — chỉ dẫn bằng hình, chữ dành cho người lớn | |
| `BR-WSM-03` | Một trang A4, ❌ không nhiều trang | Trẻ 3–6 ❌ không giữ được tập trung qua nhiều trang |
| `BR-WSM-04` | Vùng viết/vẽ ≥ **2cm**, đường nét dày ≥ 2pt | Vận động tinh chưa đủ |
| `BR-WSM-05` | Có **hướng dẫn cho người lớn** ở chân trang | |
| `BR-WSM-06` | Render PDF thành công là điều kiện publish | `content-lifecycle` §7.3 |
| `BR-WSM-07` | Lesson dùng worksheet phải có **hoạt động thay thế** không cần in | Không phải nhà nào cũng có máy in |
| `BR-WSM-08` | ❌ **NEVER watermark trên vùng làm bài** | |

## 7. Data

`code` · `content_version` · `title_vi` · `learning_objective_codes` · `layout_template` ·
`content_blocks` JSONB · `pdf_path` · `access_tier` · `status`.

### 7.1 Loại worksheet

Tô màu theo quy luật · nối cặp · khoanh nhóm · vẽ tiếp hình · đếm và tô số ô ·
tìm điểm khác nhau.

Sáu loại. Tất cả đều **không cần đọc chữ**.

## 8. API contract

`GET /api/users/worksheets/{code}/pdf` — yêu cầu entitlement, trả signed URL.

## 9. Acceptance criteria

```gherkin
Scenario: BR-WSM-01 — dùng được khi in đen trắng
  When render PDF ở chế độ grayscale
  Then mọi phần vẫn phân biệt được

Scenario: BR-WSM-02 — không yêu cầu trẻ đọc
  When kiểm mọi worksheet published
  Then chỉ dẫn cho trẻ đều bằng hình

Scenario: BR-WSM-03 — một trang
  When render bất kỳ worksheet nào
  Then PDF có đúng một trang A4

Scenario: BR-WSM-06 — render fail chặn publish
  Given một worksheet render PDF lỗi
  When publish
  Then trả 422

Scenario: BR-WSM-07 — lesson có thay thế
  Given một lesson chứa activity kind worksheet
  When gửi duyệt lesson
  Then checklist yêu cầu có hoạt động thay thế không cần in
```

## 10. Boundaries

**Always**
- Kiểm bản in đen trắng.
- Một trang A4.
- Hoạt động thay thế trong lesson.

**Ask first**
- Thêm loại worksheet.
- Cho phép nhiều trang.

**Never**
- Yêu cầu trẻ đọc chữ.
- Watermark trên vùng làm bài.
- Publish khi render PDF fail.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Render PDF server-side (Puppeteer) hay dựng sẵn? Puppeteer tốn RAM trên t3.small | P4 |
