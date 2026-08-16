# Todo — Task #81: Contract evidence sư phạm và playtest với trẻ

## Preflight

- [x] Đọc [`SPEC.md`](../SPEC.md) §1.7/§11/§15, child-data/consent specs và
      [`business-rules.md`](../specs/00-foundation/business-rules.md) §7.3.
- [x] Đọc các ca “trẻ thật” trong Task #26/#36/#57; ghi rõ điểm khác nhau hiện tại.
- [x] Tách metric engagement đang có khỏi candidate pedagogical measure.

## WP81.1 — Checkpoint A

- [x] Product/Pedagogy chốt câu claim chính xác và các claim bị cấm.
- [x] Chốt measure, denominator/window, age band, competency/template và ngưỡng.
- [x] Privacy chốt minimal fields, access, retention, deletion và incident path.
- [x] Ghi lý do, owner và ngày review; không dùng số placeholder.

## WP81.2 — Evidence spec

- [x] Xác định một spec owner cho mỗi outcome được nhận ([`pedagogical-evidence.md`](../specs/08-quality/pedagogical-evidence.md)).
- [x] Viết happy/insufficient/contradictory evidence path và decision rule.
- [x] Phân biệt rõ usability, engagement, mastery và transfer.
- [x] Thêm negative examples cho IQ/clinical/causal claims.

## WP81.3 — Child-playtest protocol

- [x] Viết guardian consent + child assent phù hợp độ tuổi.
- [x] Viết stop criteria khi trẻ khó chịu, mệt, không hiểu hoặc muốn dừng.
- [x] Chốt script nhiệm vụ không dẫn dắt, sampling và trường dữ liệu tối thiểu.
- [x] Cấm ghi âm/ghi hình/PII mặc định; mọi ngoại lệ cần contract riêng.
- [x] Viết retention, access, withdrawal/deletion và incident escalation.

## WP81.4 — Traceability

- [x] Cập nhật KPI/success criteria ở [`SPEC.md`](../SPEC.md) sau phê duyệt.
- [x] Cập nhật [`index.md`](../specs/index.md), roadmap và registry nếu có spec/prefix mới.
- [x] Task #26/#36/#57 chỉ link owner; xóa protocol cục bộ trùng lặp.
- [x] Chạy link check, `pnpm lint:specs` và query claim/evidence.

## WP81.5 — Handoff implementation

- [x] Tạo task collection/reporting riêng với work package S/M.
- [x] Viết privacy/security negative test trước implementation.
- [x] Chốt người xem evidence và human decision gate trước mọi claim/publication.

## Gate hoàn tất

- [x] Checkpoint A có đủ Product/Pedagogy/Privacy review.
- [x] Spec/protocol được `approved`; root KPI không còn chỉ đo growth/engagement.
- [x] Không phiên playtest hoặc collection nào chạy trước contract.
- [x] `pnpm lint:specs` và gate repo liên quan xanh; không auto-merge.
