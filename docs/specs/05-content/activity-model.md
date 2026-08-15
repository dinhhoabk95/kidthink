---
spec: ACTIVITY-MODEL
title: Mô hình hoạt động — ràng buộc biên tập
area: content
status: implemented
mvp: true
phase: P3
reviewed: 2026-08-08
owns:
  - Ràng buộc biên tập của một activity
depends_on:
  - SCHEMA-CONTENT-TAXONOMY
---

# Mô hình hoạt động — ràng buộc biên tập

## 1. Objective

Activity là đơn vị **tái sử dụng**. Nó phải đứng độc lập được — người dạy mở ra và làm được
mà không cần đọc lesson chứa nó.

Đó là ràng buộc biên tập quan trọng nhất: activity phụ thuộc ngữ cảnh của một lesson cụ thể
không tái dùng được, và mất toàn bộ lý do tồn tại.

## 2. Actors

Người soạn · người duyệt · người dạy.

## 3. Entry points

`06-admin/activity-authoring.md`.

## 4. Main flow

Không có. Spec ràng buộc.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ACM-01` | Activity **đứng độc lập** — không tham chiếu "như bài trước" | Tái dùng ở lesson khác thì ngữ cảnh đó sai |
| `BR-ACM-02` | 2–20 phút. Dài hơn nên là lesson | Tối ưu khả năng tập trung của trẻ mầm non và giữ tính chất linh hoạt của hoạt động |
| `BR-ACM-03` | `instruction` viết cho **người lớn**, kèm câu **nói với trẻ** đặt trong ngoặc kép | Người dạy cần biết nói gì, không phải diễn giải |
| `BR-ACM-04` | Vật liệu là thứ **có sẵn trong nhà** | `BR-LSM-04` |
| `BR-ACM-05` | Activity ngoài màn hình Cấm — **NEVER cần in ấn** trừ khi `kind = worksheet` | Không phải nhà nào cũng có máy in |
| `BR-ACM-06` | Nêu **biến thể dễ hơn và khó hơn** | Cùng một activity phục vụ được nhiều band tuổi |
| `BR-ACM-07` | Cấm — **NEVER hoạt động cần giám sát an toàn đặc biệt** — vật nhỏ nuốt được, kéo, nhiệt | Trẻ 3–6 |
| `BR-ACM-08` | Activity gắn **1–2 skill**, không nhiều hơn | Nhiều skill làm không quy được kết quả |

## 7. Data

### 7.1 Cấu trúc `instruction`

```
Chuẩn bị: <một dòng>
Cách làm:
  1. <bước> — nói với bé: "…"
  2. …
Dễ hơn: <biến thể>
Khó hơn: <biến thể>
```

Cấu trúc cố định để người dạy quét nhanh, không phải đọc từ đầu.

### 7.2 Ràng buộc theo `kind`

| `kind` | Ràng buộc riêng |
|---|---|
| `digital_game` | Trỏ level `published`; nêu thời lượng thật |
| `discussion` | ≥3 câu hỏi mở, không câu hỏi có/không |
| `storytelling` | Truyện ≤300 từ hoặc link nguồn công khai |
| `movement` | Nêu không gian cần; không cần dụng cụ |
| `manipulative` | Vật liệu có sẵn; không vật nhỏ nuốt được với band 3–4 |
| `worksheet` | Trỏ worksheet `published` |
| `observation` | Nêu rõ quan sát cái gì và ghi lại thế nào |
| `mini_project` | Chia được thành buổi; nêu điểm dừng |
| `assessment` | Tiêu chí hành vi quan sát được |
| `home_activity` | Làm được không cần chuẩn bị trước |

### 7.3 An toàn — danh sách cấm

Vật đường kính < 3cm với band 3–4 · kéo, dao, vật sắc · nguồn nhiệt · nước sâu ·
vật nhỏ có nam châm · bóng bay chưa thổi · pin cúc áo.

## 8. API contract

Không sở hữu route.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ACM-01 — activity đứng độc lập
  When đọc instruction của mọi activity published
  Then không activity nào tham chiếu tới một lesson hay activity cụ thể khác

Scenario: BR-ACM-06 — có biến thể dễ và khó
  When gửi duyệt một activity
  Then checklist yêu cầu có cả hai biến thể

Scenario: BR-ACM-07 — không hoạt động nguy hiểm
  When đọc materials của mọi activity cho band 3-4
  Then không vật nào nằm trong danh sách cấm §7.3

Scenario: BR-ACM-02 — thời lượng trong khoảng
  When đặt estimated_minutes = 30
  Then trả 422

Scenario: BR-ACM-03 — có câu nói với trẻ
  When đọc instruction
  Then có ít nhất một câu đặt trong ngoặc kép để nói với bé

Scenario: BR-ACM-08 — tối đa 2 skill
  When gắn 4 skill cho một activity
  Then trả 422

Scenario: BR-ACM-05 — không cần in ấn
  Given một activity kind manipulative
  When đọc materials
  Then không yêu cầu in tài liệu
```

## 10. Boundaries

**Always**
- Viết activity đứng độc lập.
- Nêu biến thể dễ và khó.
- Kiểm danh sách an toàn theo band tuổi.

**Ask first**
- Thêm `kind` mới.
- Nới trần thời lượng.

**Never**
- Tham chiếu ngữ cảnh của một lesson cụ thể.
- Vật liệu trong danh sách cấm §7.3.
- Yêu cầu in ấn ngoài `kind = worksheet`.
- Gắn quá 2 skill.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Danh sách an toàn cần nguồn tham chiếu chính thức nào? | P3 | Tuân thủ tiêu chuẩn an toàn đồ chơi trẻ em TCVN 6238 và hướng dẫn an toàn mầm non của Bộ GD&ĐT | người quyết |
