# Checklist — Task #71: P5.1 — Thanh toán tự động và huỷ gói thủ công

> Plan: [`71-p5-1-automated-payment-plan.md`](71-p5-1-automated-payment-plan.md)
> Sửa 2026-08-16: hệ thống không xây refund; hoàn tiền thoả thuận và chuyển khoản ngoài hệ thống.
> Vùng nhạy cảm: test âm trước, full gate và human review mỗi increment.

## T0–T1 — Preflight và contract

- [ ] Task #70 accepted payment; P4 gate xanh.
- [ ] Finance/Product chọn provider, settlement, currency/fee và VietQR fallback.
- [ ] Legal chốt recurring consent, quy trình huỷ thủ công và nội dung `/refund-policy`.
- [ ] Product chốt kênh nhận yêu cầu huỷ (Zalo OA, Facebook Messenger, email) và SLA phản hồi.
- [ ] Product/Finance chốt hiệu lực huỷ: cắt quyền ngay hay giữ tới hết kỳ đã trả.
- [ ] Security chốt signature/replay/rotation; Finance chốt runbook chargeback.
- [ ] **Đóng ngay ở T0** (chặn phase đã ship, không chờ P5): legal-pages Q3 (P2), account-deletion
      Q1 (P1) và câu FAQ "Có hoàn tiền không?" — ba spec này đều đã `implemented`.
- [ ] Spec refund `PAYMENT-REFUND` được rút; spec owner mới cho "admin huỷ gói đăng ký của User".
- [ ] `owns` spec mới không đè `ENTITLEMENT-GRANT` và `RECURRING-BILLING` (`C2`).
- [ ] Registry sạch: prefix `BR-RFD`, mã `REFUND_*`, event `payment_refunded` xử lý xong.
- [ ] Hai câu hỏi mở còn lại đóng: payment-flow Q3, payment-approval Q1.
- [ ] [`index.md`](../specs/index.md), [`roadmap.md`](../specs/roadmap.md) hàng P5 số 1 và
      [`SPEC.md`](../SPEC.md) §14 hết chữ refund.
- [ ] Automated payment và recurring billing có spec owner riêng, đủ state/API/event/error/audit
      và negative Gherkin.
- [ ] `pnpm lint:specs` xanh (`C2`, `C4`, `C11`, `C16`, `C17`).

## Checkpoint A

- [ ] Finance/Product/Legal/Security review contract/failure matrix.
- [ ] Corpus không còn chỗ nào hứa hoàn tiền tự động.
- [ ] Không schema, SDK hoặc provider call khi decision còn mở.

## T2–T3 — Driver và schema

- [ ] Domain driver giấu SDK; raw signature/timestamp/merchant/mode verify trước transition.
- [ ] Capability refund tắt ở tầng port; không đường gọi refund provider từ code.
- [ ] Bad signature/replay/duplicate/out-of-order/rotation fixtures xanh, không network thật.
- [ ] Schema event/subscription có unique idempotency và giữ nghĩa VietQR cũ.
- [ ] Không bảng `payment_refunds`, không trạng thái `refunded`/`partially_refunded`.
- [ ] Subscription có `auto_renew`, `status`, `cancelled_by`, `cancel_reason`.
- [ ] DB rỗng/upgrade/rollback và transaction/outbox tests xanh.

## T4 — Checkout/webhook/reconciliation

- [ ] Price đọc server-side; intent/order mapping idempotent.
- [ ] Verified webhook + entitlement + audit nguyên tử; event lạ fail-closed.
- [ ] Reconciliation báo mismatch, không tự cấp quyền/sửa amount.
- [ ] Refund event do provider gửi vào là mismatch cần người xử lý, không tự thu hồi quyền.
- [ ] Duplicate/out-of-order/timeout/rollback tests PG/queue thật xanh.

## Checkpoint B

- [ ] Checkout→webhook→entitlement và mọi failure case xanh.
- [ ] Human review raw-body, transaction và reconciliation boundary.

## T5–T6 — Recurring và huỷ gói

- [ ] Consent snapshot, renew/fail/grace/cancel và dunning đúng policy.
- [ ] Account UI hiện kỳ/thu tới/masked method/cancel/history tiếng Việt.
- [ ] `/me/subscription` nêu rõ huỷ tự gia hạn tại chỗ, hoàn tiền đi qua kênh liên hệ.
- [ ] Admin huỷ gói một thao tác từ trang chi tiết User.
- [ ] Huỷ dừng auto-renew và xử lý entitlement đúng nhánh hiệu lực đã chốt; cả hai nhánh có test.
- [ ] `reason` danh sách đóng + ghi chú ≥ 20 ký tự nêu kênh và mã tham chiếu hội thoại.
- [ ] Huỷ lại gói đã huỷ trả 409, không audit trùng, không đổi `payment_orders`.
- [ ] Audit đọc được ở admin và audit-log-viewer; 403 role và 404 ownership tests xanh.
- [ ] User nhận thông báo huỷ kèm ngày hết hiệu lực thực tế.
- [ ] `/contact`, `/refund-policy`, FAQ nêu đúng kênh và SLA; không hứa hoàn tiền tự động.

## T7–T8 — Drill và promote

- [ ] Replay storm/reorder/provider timeout/queue retry không double effect.
- [ ] Captured/net reconciliation khớp sandbox fixtures; báo cáo không còn cột refunded.
- [ ] Runbook chargeback và runbook "khách xin huỷ qua Zalo/Messenger" đã diễn tập, có người ký.
- [ ] Rotation/alert/manual fallback/rollback drill có evidence.
- [ ] Mọi BR mới có test; open questions payment và hoàn tiền P5 đóng.
- [ ] Không còn tham chiếu chết tới contract refund trong `docs/`.
- [ ] Full gate xanh và Finance/Security human review.
- [ ] Không production credential/call, live migration, auto-merge hoặc bỏ VietQR sớm.
