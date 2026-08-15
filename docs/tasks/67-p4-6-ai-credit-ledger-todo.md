# Checklist — Task #67: P4.6 — Sổ credit AI append-only

> Plan: [`67-p4-6-ai-credit-ledger-plan.md`](67-p4-6-ai-credit-ledger-plan.md)
> Spec: [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md)

## T0–T1 — Preflight/contract

- [x] P2 payment/catalog/audit/admin/notification `implemented`; seam thật được ghi.
- [x] Inventory toàn bộ `ai_calls: 100`/counter placeholder.
- [x] Chốt cost từng feature, pack size/price, 20% baseline, không-expiry/accounting.
- [x] Catalog/payment định nghĩa credit grant; loại counter conflict contract-first.
- [x] Predicate catalog buộc #67 + #68 + #69; SKU vẫn ẩn.
- [x] `pnpm lint:specs` + price/catalog tests xanh.

## Checkpoint A

- [x] D-P4U…D-P4Y được Product/Kế toán/Security review.
- [x] Không migration khi rate/pack/ref còn pending.

## T2–T3 — Schema và service

- [x] Test âm update/delete/duplicate ref/negative balance viết trước.
- [x] Ledger append-only đủ reason/ref/feature/grant metadata; USD không nằm ledger.
- [x] Balance non-negative/versioned; DB rỗng/upgrade/rollback xanh.
- [x] Grant/debit/refund transaction+idempotency; debit trước provider.
- [x] Hai request/1 credit: đúng một success; refund không double.
- [x] Reconcile SUM vs cache alert, không tự sửa ledger.

## Checkpoint B

- [x] Race/idempotency/refund/reconcile xanh PG thật; human review transaction.

## T4–T6 — Payment, API, notification

- [x] Payment approve cấp đúng pack, không tin price/credit client, không double approve.
- [x] Manual grant super_admin + reauth + reason + audit.
- [x] GET balance/history private/no-store, pagination/allow-list/IDOR xanh.
- [x] Crossing <20% thông báo một lần; top-up/refund reset đúng contract.
- [x] Metrics không PII; mismatch alert có runbook, không auto-correct.

## T7–T8 — Evidence/handoff

- [x] Mỗi `BR-ACL-01…09` có test mang mã.
- [x] Full gate + progress + accounting/security review xanh.
- [x] Ledger spec promote theo evidence; SKU vẫn ẩn tới Task #69.
- [x] Không production grant/seed, không auto-merge/migration ngoài local.

## Ngoài phạm vi

- [x] Không provider/UI/vector search.
- [x] Không credit expiry/auto top-up/payment gateway tự động.
