---
spec: TEMPLATE
title: Khuôn spec module
version: 2.0.0
---

# Khuôn spec module

Copy phần dưới dấu phân cách. Quy ước đầy đủ: [`CONVENTIONS.md`](CONVENTIONS.md).

---

```markdown
---
spec: <SCREAMING-KEBAB-ID>
title: <tiêu đề tiếng Việt một dòng>
area: foundation | platform | public | account | play | content | admin | addon | quality
status: draft
mvp: true
phase: P1
reviewed: YYYY-MM-DD
owns:
  - <thứ mà CHỈ file này định nghĩa>
depends_on:
  - <spec id>
---

# <Tiêu đề>

## 1. Objective

<Outcome của ai, giá trị gì, vì sao tồn tại. 3–6 câu. Không lặp lại vision toàn dự án.>

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|

## 4. Main flow

1. …
2. …

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-XXX-01` | | |

## 7. Data

**Đọc:** …
**Ghi:** …

| Field | Kiểu | Ràng buộc |
|---|---|---|

## 8. API contract

### `METHOD /api/<ns>/<path>`

| | |
|---|---|
| Auth | |
| Body | |
| 2xx | |
| 4xx | `MÃ_LỖI` — mô tả |

## 9. Acceptance criteria

```gherkin
Scenario: BR-XXX-01 — <tên>
  Given …
  When …
  Then …
```

## 10. Boundaries

**Always**
-

**Ask first**
-

**Never**
-

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
```
