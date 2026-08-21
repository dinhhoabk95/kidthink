# Checklist — Task #71: P5.1 — Thanh toán tự động và huỷ gói thủ công

> Plan: [`71-p5-1-automated-payment-plan.md`](71-p5-1-automated-payment-plan.md)
> Sửa 2026-08-16: hệ thống không xây refund; hoàn tiền thoả thuận và chuyển khoản ngoài hệ thống.
> Vùng nhạy cảm: test âm trước, full gate và human review mỗi increment.

## T0–T1 — Preflight và contract

- [x] Task #70 accepted payment; P4 gate xanh.
- [x] Finance/Product chọn provider, settlement, currency/fee và VietQR fallback.
- [x] Legal chốt recurring consent, quy trình huỷ thủ công và nội dung `/refund-policy`.
- [x] Product chốt kênh nhận yêu cầu huỷ (Zalo OA, Facebook Messenger, email) và SLA phản hồi.
- [x] Product/Finance chốt hiệu lực huỷ: cắt quyền ngay hay giữ tới hết kỳ đã trả.
- [x] Security chốt signature/replay/rotation; Finance chốt runbook chargeback.
- [x] **Đóng ngay ở T0** (chặn phase đã ship, không chờ P5): legal-pages Q3 (P2), account-deletion
      Q1 (P1) và câu FAQ "Có hoàn tiền không?" — ba spec này đều đã `implemented`.
- [x] Spec refund `PAYMENT-REFUND` được rút; spec owner mới cho "admin huỷ gói đăng ký của User".
- [x] `owns` spec mới không đè `ENTITLEMENT-GRANT` và `RECURRING-BILLING` (`C2`).
- [x] Registry sạch: prefix `BR-RFD`, mã `REFUND_*`, event `payment_refunded` xử lý xong.
- [x] Hai câu hỏi mở còn lại đóng: payment-flow Q3, payment-approval Q1.
- [x] [`index.md`](../specs/index.md), [`roadmap.md`](../specs/roadmap.md) hàng P5 số 1 và
      [`SPEC.md`](../SPEC.md) §14 hết chữ refund.
- [x] Automated payment và recurring billing có spec owner riêng, đủ state/API/event/error/audit
      và negative Gherkin.
- [x] `pnpm --filter @mindkid/gates test` xanh (`C2`, `C4`, `C11`, `C16`, `C17`).

## Checkpoint A

- [x] Finance/Product/Legal/Security review contract/failure matrix.
- [x] Corpus không còn chỗ nào hứa hoàn tiền tự động.
- [x] Không schema, SDK hoặc provider call khi decision còn mở.

## T2–T3 — Driver và schema

- [x] Domain driver giấu SDK; raw signature/timestamp/merchant/mode verify trước transition.
- [x] Capability refund tắt ở tầng port; không đường gọi refund provider từ code.
- [x] Bad signature/replay/duplicate/out-of-order/rotation fixtures xanh, không network thật.
- [x] Schema event/subscription có unique idempotency và giữ nghĩa VietQR cũ.
- [x] Không bảng `payment_refunds`, không trạng thái `refunded`/`partially_refunded`.
- [x] Subscription có `auto_renew`, `status`, `cancelled_by`, `cancel_reason`.
- [x] DB rỗng/upgrade/rollback và transaction/outbox tests xanh.

## T4 — Checkout/webhook/reconciliation

- [x] Price đọc server-side; intent/order mapping idempotent.
- [x] Verified webhook + entitlement + audit nguyên tử; event lạ fail-closed.
- [x] Reconciliation báo mismatch, không tự cấp quyền/sửa amount.
- [x] Refund event do provider gửi vào là mismatch cần người xử lý, không tự thu hồi quyền.
- [x] Duplicate/out-of-order/timeout/rollback tests PG/queue thật xanh.

## Checkpoint B

- [x] Checkout→webhook→entitlement và mọi failure case xanh.
- [x] Human review raw-body, transaction và reconciliation boundary.

## T5–T6 — Recurring và huỷ gói

- [x] Consent snapshot, renew/fail/grace/cancel và dunning đúng policy.
- [x] Account UI hiện kỳ/thu tới/masked method/cancel/history tiếng Việt.
- [x] `/me/subscription` nêu rõ huỷ tự gia hạn tại chỗ, hoàn tiền đi qua kênh liên hệ.
- [x] Admin huỷ gói một thao tác từ trang chi tiết User.
- [x] Huỷ dừng auto-renew và xử lý entitlement đúng nhánh hiệu lực đã chốt; cả hai nhánh có test.
- [x] `reason` danh sách đóng + ghi chú ≥ 20 ký tự nêu kênh và mã tham chiếu hội thoại.
- [x] Huỷ lại gói đã huỷ trả 409, không audit trùng, không đổi `payment_orders`.
- [x] Audit đọc được ở admin và audit-log-viewer; 403 role và 404 ownership tests xanh.
- [x] User nhận thông báo huỷ kèm ngày hết hiệu lực thực tế.
- [x] `/contact`, `/refund-policy`, FAQ nêu đúng kênh và SLA; không hứa hoàn tiền tự động.

## T7–T8 — Drill và promote

- [x] Replay storm/reorder/provider timeout/queue retry không double effect.
- [x] Captured/net reconciliation khớp sandbox fixtures; báo cáo không còn cột refunded.
- [x] Runbook chargeback và runbook "khách xin huỷ qua Zalo/Messenger" đã diễn tập, có người ký.
- [x] Rotation/alert/manual fallback/rollback drill có evidence.
- [x] Mọi BR mới có test; open questions payment và hoàn tiền P5 đóng.
- [x] Không còn tham chiếu chết tới contract refund trong `docs/`.
- [x] Full gate xanh và Finance/Security human review.
- [x] Không production credential/call, live migration, auto-merge hoặc bỏ VietQR sớm.
