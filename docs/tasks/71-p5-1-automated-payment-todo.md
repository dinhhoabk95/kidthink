# Checklist — Task #71: P5.1 — Thanh toán tự động và refund

> Plan: [`71-p5-1-automated-payment-plan.md`](71-p5-1-automated-payment-plan.md)
> Vùng nhạy cảm: test âm trước, full gate và human review mỗi increment.

## T0–T1 — Preflight và contract

- [ ] Task #70 accepted payment; P4 gate xanh.
- [ ] Finance/Product chọn provider, settlement, currency/fee và VietQR fallback.
- [ ] Legal chốt recurring consent/cancel/refund; Security chốt signature/replay/rotation.
- [ ] Automated payment, recurring billing, refund có spec owner riêng.
- [ ] State/API/event/error/audit/negative Gherkin và monthly publish predicate đầy đủ.
- [ ] `pnpm lint:specs` xanh.

## Checkpoint A

- [ ] Finance/Product/Legal/Security review contract/failure matrix.
- [ ] Không schema, SDK hoặc provider call khi decision còn mở.

## T2–T3 — Driver và schema

- [ ] Domain driver giấu SDK; raw signature/timestamp/merchant/mode verify trước transition.
- [ ] Bad signature/replay/duplicate/out-of-order/rotation fixtures xanh, không network thật.
- [ ] Schema event/subscription/refund có unique idempotency và giữ nghĩa VietQR cũ.
- [ ] DB rỗng/upgrade/rollback và transaction/outbox tests xanh.

## T4 — Checkout/webhook/reconciliation

- [ ] Price đọc server-side; intent/order mapping idempotent.
- [ ] Verified webhook + entitlement + audit nguyên tử; event lạ fail-closed.
- [ ] Reconciliation báo mismatch, không tự cấp quyền/sửa amount.
- [ ] Duplicate/out-of-order/timeout/rollback tests PG/queue thật xanh.

## Checkpoint B

- [ ] Checkout→webhook→entitlement và mọi failure case xanh.
- [ ] Human review raw-body, transaction và reconciliation boundary.

## T5–T6 — Recurring/refund surfaces

- [ ] Consent snapshot, renew/fail/grace/cancel và dunning đúng policy.
- [ ] Account UI hiện kỳ/thu tới/masked method/cancel/history tiếng Việt.
- [ ] Refund cap/idempotency/state/entitlement/audit đúng; không over-refund.
- [ ] Admin role/reauth/note và User ownership 404 tests xanh.
- [ ] Legal/pricing/FAQ không còn claim “không tự gia hạn” nếu recurring đã bật.

## T7–T8 — Drill và promote

- [ ] Replay storm/reorder/provider timeout/queue retry không double effect.
- [ ] Captured/refunded/net reconciliation khớp sandbox fixtures.
- [ ] Rotation/alert/manual fallback/rollback drill có evidence.
- [ ] Mọi BR mới có test; open questions payment/refund P5 đóng.
- [ ] Full gate xanh và Finance/Security human review.
- [ ] Không production credential/call/refund, live migration, auto-merge hoặc bỏ VietQR sớm.

