# Checklist review — Task #79: Audit roadmap, scope và mức sẵn sàng

> Plan: [`79-roadmap-scope-audit-plan.md`](79-roadmap-scope-audit-plan.md).
> Các ô là cổng review; không tick chỉ vì file tồn tại.

## Coverage có bằng chứng

- [x] Structural query: 130/130 module spec có trong roadmap.
- [x] Baseline 72/72 và sau remediation 75/75 plan có todo cùng số/slug.
- [x] Coverage table tách “có hồ sơ” khỏi “implementation-ready”.
- [x] P0 mapping ghi cả Task #2; P1/P2/P3 không còn kết luận “đủ” vô điều kiện.

## Contract gap

- [x] [`Task #80`](80-audio-contract-closure-plan.md) có plan/todo và human checkpoint.
- [x] [`Task #81`](81-pedagogical-evidence-contract-plan.md) có plan/todo và ranh giới dữ liệu trẻ.
- [x] [`Task #82`](82-p3-account-curriculum-integration-plan.md) nhận đủ ba debt account P3.
- [x] [`SPEC.md`](../SPEC.md) mục 15 nêu decision ≥60/≥126 và evidence sư phạm.
- [x] [`SPEC.md`](../SPEC.md) mục 15 bỏ blocker giả #4/#7/#8 và giữ quyết định tương ứng ở
      “Đã chốt”.
- [x] Không active plan nào gán audio picker/upload cho P2.7 ảnh.

## Traceability sửa trực tiếp

- [x] Task #36 ghi đúng sáu mã guest, một mỗi competency, difficulty 1–2.
- [x] Task #36 chỉ chạy ca trẻ thật theo protocol Task #81.
- [x] Task #40 đóng debt toggle weekly digest từ Task #38.
- [x] Task #14 dùng work package S/M, chín việc, một PR mỗi package.
- [x] Roadmap có P1.2b, P1.11c và P3.9.

## Atomize plan

- [x] Lô A1: Task #21/#27.
- [x] Lô A2: Task #35.
- [x] Lô B1: Task #45.
- [x] Lô B2: Task #48.
- [x] Lô B3: Task #50.
- [x] Lô B4: Task #51.
- [x] Query cỡ L/XL cuối cùng trả rỗng; lô nội dung dùng batch M tường minh.

## Scope Web-only

- [x] D11 đúng ý Product; PWA vẫn là web.
- [x] Task #73–#77 không có active file/link; ID vẫn retired.
- [x] P5 chỉ còn Task #70–#72/#78.

## Gates

- [x] `pnpm lint:specs` xanh.
- [x] `pnpm check` xanh.
- [x] `pnpm test` xanh.
- [x] Query link/coverage/debt/size xanh.
- [x] Human review diff trước merge; không auto-merge.
