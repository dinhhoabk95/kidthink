---
spec: ENGINE-GT-0NN
title: <tên engine> — <cơ chế một câu>
area: platform
status: draft
mvp: false
phase: P4
reviewed: YYYY-MM-DD
engine: <slug>
batch: mvp | montessori | legacy-v1 | taxonomy-gap
owns:
  - Hợp đồng nội dung của engine <mã>
  - Hợp đồng vẽ của engine <mã>
  - Ma trận seed mục tiêu của engine <mã>
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - GAME-LAYOUT-ENGINE
  - ENGINE-RENDER-CONTRACT
  - ENGINE-SPEC-SHEET
---

# GT-0NN — <Tên Engine>

## 1. Objective

<!-- Engine này dạy trẻ tiến trình tư duy nào, và khác engine gần nhất ở một điểm quyết định. -->

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | — | Trực tiếp tương tác theo cơ chế của engine |
| Người soạn nội dung | `content_reviewer` | Soạn `content_pack` và `difficulty_params` theo hợp đồng |
| Bộ sinh level | — | Sinh level tự động theo ma trận và tham số độ khó |
| Cổng | — | Kiểm tra tính hợp lệ của seed, contract và hợp đồng vẽ |

## 3. Entry points

<!-- Thư mục engine, content_contract, layout dùng, file spec này. -->

## 4. Main flow

<!-- Một lượt chơi đúng: từ content_pack tới thắng. -->

## 5. Alternative flows

<!-- Sai, hết giờ, gợi ý, thiết bị yếu, asset hỏng. -->

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-E0NN-01` | <Luật nghiệp vụ riêng của engine> | <Lý do sư phạm hoặc kỹ thuật bắt buộc> |

## 7. Data

<!-- Hình dạng content_pack và difficulty_params, band hợp lệ, limits. -->
<!-- Cấm — NEVER chép lại toàn bộ Zod schema (BR-ESS-03). -->

## 8. API contract

Không có. Engine chạy trong tiến trình frontend/canvas runtime.

## 9. Acceptance criteria

```gherkin
Scenario: BR-E0NN-01 — <Tiêu đề kịch bản kiểm thử hành vi>
  Given <Điều kiện tiên quyết>
  When <Hành động của trẻ hoặc hệ thống>
  Then <Kết quả kỳ vọng>
```

## 10. Boundaries

**Always**
- <Ràng buộc luôn phải tuân thủ của engine>

**Ask first**
- <Thay đổi cần tham vấn sư phạm / kỹ thuật>

**Never**
- <Hành vi cấm tuyệt đối>

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | <Câu hỏi mở còn tồn đọng nếu có> | <Mục tiêu bị chặn> | P4 | Backend |

## 12. Hợp đồng vẽ

Hợp đồng chung: [`engine-render-contract.md`](../engine-render-contract.md).

**Slot dùng:** `<layout-id>`

| Lớp | Engine này vẽ gì |
|---|---|
| 1. Nền cảnh | Nền phẳng theo token |
| 2. Phần tử tĩnh | Câu lệnh câu hỏi hoặc gợi ý tĩnh |
| 3. Phần tử tương tác | Các phần tử thao tác vẽ bằng nguyên thuỷ của `RenderSystem` |
| 4. Lớp phản hồi | Hạt mừng khi đúng, rung/nhấp nháy hổ phách khi thử lại |

**Trạng thái thị giác riêng:** <nếu có, hoặc ghi theo 5 trạng thái chuẩn mục 7.3 của engine-render-contract.md>
**Thứ tự tuột khi thiết bị yếu:** Lớp 4 (hạt) -> Lớp 2 (chữ phụ). Lớp 3 cấm — NEVER bỏ.

## 13. Ma trận seed mục tiêu

| Band | `<thinking_tag_1>` | `<thinking_tag_2>` | Tổng mục tiêu |
|---|:--:|:--:|:--:|
| `3-4` | ≥1 | ≥1 | ≥2 |
| `4-5` | ≥1 | ≥1 | ≥2 |
| `5-6` | ≥1 | ≥1 | ≥2 |

Trục `what` mục tiêu: `<what_tags>`
Trục `theme` mục tiêu: ≥3 giá trị khác nhau.

## 14. Ca sai không bắt được bằng schema

<!-- Ít nhất một trường hợp content_pack parse sạch Zod schema nhưng sai về mặt sư phạm cho band tuổi. -->

## 15. Trường trích từ registry

Trích từ [`GT-0NN/template.ts`](../../../../packages/game-engine/src/templates/GT-0NN/template.ts).

| Trường | Giá trị |
|---|---|
| `mechanic` | `<mechanic>` |
| `layouts` | `<layouts>` |
| `age_min` · `age_max` | `<min>` · `<max>` |
| `banned_age_bands` | `<banned>` |
| `requires_tap_fallback` | `<boolean>` |
| `limits` | `<limits>` |
| `asset_kinds` | `<asset_kinds>` |
| `engine_session` | `<session_class>` |

## 16. Chiều sâu nội dung

Sáu số đo hiện tại và mục tiêu bậc 1 (`BR-ECD-01`…`-06`):
- `level_count`: hiện có X, mục tiêu ≥6
- `min_band_count`: hiện có Y, mục tiêu ≥1
- `thinking_span`: hiện có Z, mục tiêu ≥2
- `what_span`: hiện có W, mục tiêu ≥2
- `theme_span`: hiện có T, mục tiêu ≥2
- `access_tier`: ≥1 level `free` hoặc `login`
