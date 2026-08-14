---
spec: PEDAGOGICAL-EVIDENCE
title: Tiêu chuẩn bằng chứng sư phạm và quy trình playtest với trẻ
area: quality
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-14
owns:
  - Khung bằng chứng sư phạm và quy trình kiểm thử với trẻ
  - Tiêu chuẩn thu thập dữ liệu an toàn khi playtest
depends_on:
  - DESIGN-SYSTEM-CONTRACT
  - CHILD-DATA-COMPLIANCE
---

# Tiêu chuẩn bằng chứng sư phạm và quy trình playtest với trẻ

## 1. Objective

Quy định khung bằng chứng sư phạm (pedagogical evidence) và quy trình playtest an toàn với trẻ mầm non (3–6 tuổi). Biến mục tiêu "rèn luyện tư duy" thành tiêu chuẩn đo lường có thể kiểm chứng trong sản phẩm, đồng thời đảm bảo quyền riêng tư và an toàn tối đa cho trẻ.

## 2. Actors

- Phụ huynh / Người giám hộ (Guardian)
- Trẻ mầm non (Child 3-6 tuổi)
- Quản trị viên / Nhà nghiên cứu (Manager)

## 3. Entry points

- Playtest protocol execution
- Pedagogical evidence audit

## 4. Main flow

1. Phụ huynh cấp quyền đồng ý (Guardian consent).
2. Trẻ đồng ý tham gia (Child assent).
3. Thực hiện phiên chơi không thu thập PII.

## 5. Alternative flows

- Trẻ mệt mỏi hoặc đòi dừng -> dừng phiên lập tức.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PED-01` | Mọi tuyên bố hiệu quả sư phạm phải dựa trên chỉ số tiến bộ thực tế (mastery/telemetry) | Tránh tuyên bố tiếp thị vượt quá bằng chứng |
| `BR-PED-02` | Playtest với trẻ phải đạt 100% sự đồng ý của phụ huynh và tuân thủ tiêu chuẩn dừng phiên | Bảo vệ tâm lý và an toàn cho trẻ |
| `BR-PED-03` | Cấm thu thập hình ảnh, âm thanh hoặc thông tin định danh cá nhân của trẻ trong phiên playtest | Tuân thủ Luật 91/2025/QH15, văn bản áp dụng và tiêu chuẩn bảo vệ dữ liệu trẻ em |

## 7. Data

- **Task Comprehension**: ≥ 85% trẻ hoàn thành lượt chơi đầu tiên không cần sự trợ giúp từ người lớn.
- **Independent Completion**: ≥ 75% trẻ tiến bộ từ level có scaffolding sang hoàn thành level độc lập.
- **Session Duration Limit**: Mỗi phiên playtest không vượt quá 15 phút cho band tuổi 3–4 và 20 phút cho band tuổi 5–6.

## 8. API contract

- Không có API trực tiếp cho module này.

## 9. Acceptance criteria

- 100% phiên playtest được kiểm tra sự đồng ý của phụ huynh trước khi thực hiện.
- Không có bất kỳ PII nào của trẻ bị rò rỉ hoặc lưu trữ trong hệ thống telemetry.

## 10. Boundaries

- Không tuyên bố chẩn đoán y khoa hay đo chỉ số IQ lâm sàng.

## 11. Open questions

- Không.
