---
spec: GAME-LEVEL-MODEL
title: Mô hình màn chơi — ràng buộc biên tập
area: content
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Ràng buộc biên tập của một game level
  - Tiêu chuẩn chất lượng nội dung
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - SCHEMA-CONTENT-TAXONOMY
---

# Mô hình màn chơi — ràng buộc biên tập

## 1. Objective

[`game-template-contract.md`](../01-platform/game-template-contract.md) nói **hình dạng kỹ thuật**; [`schema-content-taxonomy.md`](../01-platform/schema-content-taxonomy.md) nói **cột
DB**. File này nói thứ còn thiếu: **cái gì làm một màn chơi tốt** — và cái gì làm nó sai
về mặt sư phạm dù đúng schema.

Đây là tài liệu người soạn nội dung đọc, không phải dev.

## 2. Actors

Người soạn nội dung · người review · AI agent IDE lúc soạn seeder (dùng làm ràng buộc).

## 3. Entry points

`06-admin/game-level-studio.md` · checklist duyệt [`content-review-queue.md`](../06-admin/content-review-queue.md) §7.2.

## 4. Main flow

Không có. Spec ràng buộc.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-GLM-01` | **Một** mục tiêu học tập mỗi level | Hai mục tiêu làm kết quả không quy được về skill nào |
| `BR-GLM-02` | Số item theo band tuổi §7.1 | Trí nhớ làm việc của trẻ 3 tuổi giữ được 2–3 thứ |
| `BR-GLM-03` | Vật gây nhiễu phải **khác rõ ràng** với đáp án đúng | Nhiễu quá giống biến bài học thành bài kiểm tra thị giác |
| `BR-GLM-04` | Chỉ dẫn ≤ **12 từ**, đọc thành tiếng dưới 5 giây | Trẻ chưa đọc; câu dài mất trước khi hết |
| `BR-GLM-05` | Cấm — **NEVER phủ định trong chỉ dẫn** — không "đừng chọn quả xanh" | Trẻ 3–6 xử lý phủ định kém; chúng nghe thấy "chọn quả xanh" |
| `BR-GLM-06` | Emoji phải **rõ nghĩa ở 96px** | Quả táo và quả cà chua giống nhau ở cỡ nhỏ |
| `BR-GLM-07` | Level cùng skill phải **khác nhau về nội dung**, không chỉ đổi số | Đổi 3 quả thành 4 quả không phải bài học mới |
| `BR-GLM-08` | Độ khó tăng theo **một chiều** mỗi lần | Tăng cả số item lẫn số nhiễu cùng lúc làm không biết cái nào gây khó |
| `BR-GLM-09` | Cấm — **NEVER nội dung phụ thuộc văn hoá hẹp** hoặc cần kiến thức ngoài | Trẻ chưa có nền kiến thức chung |
| `BR-GLM-10` | Chủ đề (theme) phải **nhất quán trong một level** | Trộn nông trại và vũ trụ làm phân tán chú ý |

## 7. Data

### 7.1 Số item theo band tuổi

| Band | Item tối thiểu | Item tối đa | Nhiễu tối đa |
|---|---:|---:|---:|
| 3–4 | 2 | 4 | 1 |
| 4–5 | 3 | 6 | 2 |
| 5–6 | 3 | 8 | 3 |

Vượt trần là lý do **từ chối duyệt**, không phải cảnh báo.

### 7.2 Thang độ khó 1–5

| Mức | Đặc trưng |
|---|---|
| 1 | Ít item nhất, không nhiễu, một bước |
| 2 | Thêm 1 item hoặc 1 nhiễu |
| 3 | Nhiễu tương đồng hơn, hoặc thêm một bước |
| 4 | Nhiều tiêu chí cùng lúc |
| 5 | Tiêu chí ẩn, cần suy luận |

Một level chỉ tăng **một chiều** so với level trước cùng skill.

### 7.3 Chỉ dẫn — mẫu tốt và xấu

| Cấm Xấu | Tốt | Vì sao |
|---|---|---|
| "Đừng bỏ quả xanh vào giỏ" | "Bé bỏ quả đỏ vào giỏ nhé!" | Không phủ định |
| "Hãy phân loại các đối tượng theo kích thước" | "Vật to bỏ bên trái, vật nhỏ bên phải" | Từ vựng trong tầm tuổi |
| "Chọn đáp án đúng" | "Có mấy quả táo?" | Nói rõ phải làm gì |

### 7.4 Kiểm tra trước khi gửi duyệt

- [ ] Đúng một skill `weight = 1.0`
- [ ] Chỉ dẫn ≤12 từ, không phủ định
- [ ] Số item và nhiễu trong trần §7.1
- [ ] Mọi emoji rõ nghĩa ở 96px
- [ ] Nhiễu khác rõ với đáp án đúng
- [ ] Theme nhất quán
- [ ] Khác biệt thật so với level cùng skill đã có
- [ ] Không cần kiến thức ngoài

## 8. API contract

Không sở hữu route. Ràng buộc §7.1 ép ở cổng publish [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §7.3.

## 9. Acceptance criteria

```gherkin
Scenario: BR-GLM-02 — vượt trần item bị chặn
  Given một level band 3-4 có 6 item
  When gửi duyệt
  Then trả 422
  And missing nêu vượt trần item của band

Scenario: BR-GLM-04 — chỉ dẫn quá dài bị chặn
  Given instruction_vi có 20 từ
  When gửi duyệt
  Then trả 422

Scenario: BR-GLM-05 — phủ định bị bắt
  Given instruction_vi chứa "đừng" hoặc "không"
  When gửi duyệt
  Then hiện cảnh báo yêu cầu viết lại dạng khẳng định

Scenario: BR-GLM-01 — một mục tiêu chính
  Given hai skill cùng weight 1.0
  When gửi duyệt
  Then trả 422

Scenario: BR-GLM-07 — level trùng lặp bị phát hiện
  Given một level mới giống level đã có, chỉ khác số lượng
  When pipeline chạy cổng 6
  Then bị loại kèm mã bản trùng

Scenario: BR-GLM-08 — tăng một chiều
  Given level trước cùng skill có 3 item và 1 nhiễu
  When level mới có 5 item và 3 nhiễu
  Then người duyệt được cảnh báo tăng nhiều chiều
```

## 10. Boundaries

**Always**
- Một mục tiêu học tập chính.
- Chỉ dẫn ngắn, khẳng định.
- Kiểm emoji ở cỡ thật.

**Ask first**
- Nới trần số item theo band.
- Thêm mức độ khó thứ 6.

**Never**
- Phủ định trong chỉ dẫn.
- Nhiễu giống đáp án đúng.
- Nội dung cần kiến thức ngoài.
- Trộn theme trong một level.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Trần số item ở §7.1 (2–4 / 3–6 / 3–8) dựa trên nguồn nào? Cần đối chiếu tài liệu phát triển nhận thức. **Approve spec này 2026-08-08 không đóng câu này** — trần đang là phán đoán chuyên môn chưa có trích dẫn, và `BR-GLM-02` biến nó thành lý do từ chối duyệt. Một con số chặn việc mà không ai truy được nguồn sẽ bị nới trong lần đầu nó cản một lô nội dung | P1 — mọi level seed đo bằng trần này | P1 | người quyết |
| 2 | Cần bao nhiêu level mỗi skill để đủ đa dạng mà không lặp? | Kế hoạch nội dung, [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | P1 | hoãn — chốt cùng lúc chốt người biên soạn |
