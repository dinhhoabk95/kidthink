# Checklist — Task #67: P4.6 — Sổ credit AI append-only

> Plan: [`67-p4-6-ai-credit-ledger-plan.md`](67-p4-6-ai-credit-ledger-plan.md)
> Spec: [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md)

## T0–T1 — Preflight/contract

- [ ] P2 payment/catalog/audit/admin/notification `implemented`; seam thật được ghi.
- [ ] Inventory toàn bộ `ai_calls: 100`/counter placeholder.
- [ ] Chốt cost từng feature, pack size/price, 20% baseline, không-expiry/accounting.
- [ ] Catalog/payment định nghĩa credit grant; loại counter conflict contract-first.
- [ ] Predicate catalog buộc #67 + #68 + #69; SKU vẫn ẩn.
- [ ] `pnpm lint:specs` + price/catalog tests xanh.

## Checkpoint A

- [ ] D-P4U…D-P4Y được Product/Kế toán/Security review.
- [ ] Không migration khi rate/pack/ref còn pending.

## T2–T3 — Schema và service

- [ ] Test âm update/delete/duplicate ref/negative balance viết trước.
- [ ] Ledger append-only đủ reason/ref/feature/grant metadata; USD không nằm ledger.
- [ ] Balance non-negative/versioned; DB rỗng/upgrade/rollback xanh.
- [ ] Grant/debit/refund transaction+idempotency; debit trước provider.
- [ ] Hai request/1 credit: đúng một success; refund không double.
- [ ] Reconcile SUM vs cache alert, không tự sửa ledger.

## Checkpoint B

- [ ] Race/idempotency/refund/reconcile xanh PG thật; human review transaction.

## T4–T6 — Payment, API, notification

- [ ] Payment approve cấp đúng pack, không tin price/credit client, không double approve.
- [ ] Manual grant super_admin + reauth + reason + audit.
- [ ] GET balance/history private/no-store, pagination/allow-list/IDOR xanh.
- [ ] Crossing <20% thông báo một lần; top-up/refund reset đúng contract.
- [ ] Metrics không PII; mismatch alert có runbook, không auto-correct.

## T7–T8 — Evidence/handoff

- [ ] Mỗi `BR-ACL-01…09` có test mang mã.
- [ ] Full gate + progress + accounting/security review xanh.
- [ ] Ledger spec promote theo evidence; SKU vẫn ẩn tới Task #69.
- [ ] Không production grant/seed, không auto-merge/migration ngoài local.

## Ngoài phạm vi

- [ ] Không provider/UI/vector search.
- [ ] Không credit expiry/auto top-up/payment gateway tự động.
