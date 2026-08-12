# Todo — Task #81: Contract evidence sư phạm và playtest với trẻ

## Preflight

- [ ] Đọc [`SPEC.md`](../SPEC.md) §1.7/§11/§15, child-data/consent specs và
      [`business-rules.md`](../specs/00-foundation/business-rules.md) §7.3.
- [ ] Đọc các ca “trẻ thật” trong Task #26/#36/#57; ghi rõ điểm khác nhau hiện tại.
- [ ] Tách metric engagement đang có khỏi candidate pedagogical measure.

## WP81.1 — Checkpoint A

- [ ] Product/Pedagogy chốt câu claim chính xác và các claim bị cấm.
- [ ] Chốt measure, denominator/window, age band, competency/template và ngưỡng.
- [ ] Privacy chốt minimal fields, access, retention, deletion và incident path.
- [ ] Ghi lý do, owner và ngày review; không dùng số placeholder.

## WP81.2 — Evidence spec

- [ ] Xác định một spec owner cho mỗi outcome được nhận.
- [ ] Viết happy/insufficient/contradictory evidence path và decision rule.
- [ ] Phân biệt rõ usability, engagement, mastery và transfer.
- [ ] Thêm negative examples cho IQ/clinical/causal claims.

## WP81.3 — Child-playtest protocol

- [ ] Viết guardian consent + child assent phù hợp độ tuổi.
- [ ] Viết stop criteria khi trẻ khó chịu, mệt, không hiểu hoặc muốn dừng.
- [ ] Chốt script nhiệm vụ không dẫn dắt, sampling và trường dữ liệu tối thiểu.
- [ ] Cấm ghi âm/ghi hình/PII mặc định; mọi ngoại lệ cần contract riêng.
- [ ] Viết retention, access, withdrawal/deletion và incident escalation.

## WP81.4 — Traceability

- [ ] Cập nhật KPI/success criteria ở [`SPEC.md`](../SPEC.md) sau phê duyệt.
- [ ] Cập nhật [`index.md`](../specs/index.md), roadmap và registry nếu có spec/prefix mới.
- [ ] Task #26/#36/#57 chỉ link owner; xóa protocol cục bộ trùng lặp.
- [ ] Chạy link check, `pnpm lint:specs` và query claim/evidence.

## WP81.5 — Handoff implementation

- [ ] Tạo task collection/reporting riêng với work package S/M.
- [ ] Viết privacy/security negative test trước implementation.
- [ ] Chốt người xem evidence và human decision gate trước mọi claim/publication.

## Gate hoàn tất

- [ ] Checkpoint A có đủ Product/Pedagogy/Privacy review.
- [ ] Spec/protocol được `approved`; root KPI không còn chỉ đo growth/engagement.
- [ ] Không phiên playtest hoặc collection nào chạy trước contract.
- [ ] `pnpm lint:specs` và gate repo liên quan xanh; không auto-merge.
