# Kế hoạch — Task #67: P4.6 — Sổ credit AI append-only

> Viết 2026-08-11, đo tại commit `484ebaf`.
> Spec sở hữu: [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md).
> Mở khoá: [`68-p4-7-ai-assistant-plan.md`](68-p4-7-ai-assistant-plan.md).

## Tóm tắt

Task #67 dựng sổ credit và balance cache có đối soát: mua/cấp bù → credit dương; reserve usage
→ credit âm; provider fail → bút toán refund dương. Ledger không sửa/xoá, debit nguyên tử và
không mở content tier. Đây là hạ tầng bắt buộc nhưng **không đủ** để bán `addon_ai`; catalog
giữ ẩn tới khi Task #68 và #69 hoàn chỉnh UI/tính năng.

## 0. Điều kiện vào

- P2 payment approval, entitlement/catalog, audit log, admin auth và notification `implemented`.
- Owner chốt bảng giá credit, cost per feature và xử lý kế toán credit không hết hạn.
- Không dùng quota counter `ai_calls` thay ledger chỉ vì code đã có placeholder.

## 1. Hiện trạng và drift

- Chưa có ledger/balance/service/API trong source.
- `QUOTA_KEYS` và `PKG-addon_ai` đang có `ai_calls: 100`, trong khi
  [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) Q3 và spec P4 chốt hướng
  ledger. Placeholder này xung đột với append-only credit và phải được xử lý contract-first.
- [`package-catalog.md`](../specs/00-foundation/package-catalog.md) cho public khi ledger
  implemented, nhưng [`SPEC.md`](../SPEC.md) §1.6 yêu cầu “ledger + UI chạy”; entitlement còn
  cấp `use_ai_search`, vốn cần Task #69. Predicate hiện tại mở bán sớm.
- Mua credit “như một package” chưa định nghĩa số credit mỗi offer hay transaction approval ghi
  ledger thế nào; không được tự nhét vào quota.

## 2. Quyết định bắt buộc

**D-P4U — Credit là ledger, không quota.** Deprecate/remove đường `ai_calls` theo migration
contract; offer credit có số lượng cấp tường minh, giá chỉ ở catalog. Credit không mở tier và
không hết hạn ở phiên bản đầu.

**D-P4V — Mọi mutation có idempotency/ref.** Purchase key theo payment approval, usage key theo
request/feature, refund key theo debit gốc, manual grant theo request admin. Unique ref ngăn
approve/retry ghi hai lần.

**D-P4W — Balance cache là projection có đối soát.** Ledger là truth; debit lock/update/insert
trong một transaction, balance không âm. Job/command reconcile SUM phát hiện lệch và alert,
không âm thầm sửa ledger.

**D-P4X — Release predicate toàn AI.** `PKG-addon_ai.is_public=false` đến khi #67, #68, #69 đều
đạt evidence; nếu package cấp `use_ai_search`, semantic search phải chạy. Tỉ lệ/giá/quota giả
không được lọt production.

**D-P4Y — Cảnh báo 20% có baseline định nghĩa.** Owner chốt 20% của pack gần nhất, tổng credit
đã mua trong kỳ hay ngưỡng khác; notification idempotent theo crossing, không spam mỗi request.

## 3. Đồ thị

```text
T0 đo payment/catalog/audit/notification seams
 └── T1 chốt price/rate/accounting/catalog/release contract ── Checkpoint A
      └── T2 migration ledger + balance + constraints
           └── T3 credit service grant/debit/refund/reconcile ── Checkpoint B
                ├── T4 payment approval + manual grant integration
                ├── T5 User/Admin APIs + history projection
                └── T6 low-balance notification/observability
                     └── T7 concurrency/security/accounting evidence
                          └── T8 promote ledger; giữ catalog ẩn tới #69
```

## 4. Task triển khai

### T0 — Preflight

**Tiêu chí nghiệm thu**

- [ ] Payment/audit/admin/catalog/notification `implemented`; ghi transaction/idempotency seams thật.
- [ ] Đối chiếu `BR-ACL-*`, tiền/quyền §7.3, `BR-PAY-*`, `BR-ENT-*`, `BR-PKG-*`.
- [ ] Inventory mọi `ai_calls` placeholder và chứng minh chưa có đường public phụ thuộc nó.

**Kiểm chứng:** `node packages/gates/scripts/check-progress.ts`; inventory có file:line và owner.

**Phụ thuộc:** P2 complete · **Files:** task/spec nếu seam đổi · **Cỡ:** S.

### T1 — Khép contract thương mại/kế toán

**Tiêu chí nghiệm thu**

- [ ] Owner chốt feature cost, pack size/price, baseline 20%, không-expiry/accounting reserve.
- [ ] Catalog/entitlement/payment/ledger specs định nghĩa credit offer, approval grant và loại bỏ counter conflict.
- [ ] Predicate catalog yêu cầu #67–#69; mọi mã/ref/idempotency/audit contract đăng ký trước code.

**Kiểm chứng:** `pnpm --filter @mindkid/gates test`; price/catalog tests không hardcode ngoài catalog.

**Phụ thuộc:** T0 + Product/Kế toán decisions · **Files:** ACL + package/entitlement/payment/error specs · **Cỡ:** M.

### Checkpoint A

- [ ] D-P4U…D-P4Y được Product/Kế toán/Security review; SKU vẫn ẩn.
- [ ] Không migration khi pack/rate/ref semantics còn pending.

### T2 — Migration ledger và balance

**Tiêu chí nghiệm thu**

- [ ] Ledger có delta/reason/ref/feature/grant metadata/timestamp, unique idempotency và append-only boundary.
- [ ] Balance one-row/user có non-negative guard/version; schema không lưu USD trong ledger.
- [ ] DB rỗng/upgrade/rollback, update/delete ledger, duplicate ref và negative balance tests đỏ/xanh đúng contract.

**Kiểm chứng:** `pnpm db:migrate`; `pnpm test -- ai-credit-schema` với PG thật.

**Phụ thuộc:** Checkpoint A · **Files:** billing schema/migration/meta/integration test · **Cỡ:** M.

### T3 — Credit service nguyên tử

**Tiêu chí nghiệm thu**

- [ ] Grant/debit/refund dùng transaction + lock/version; duplicate idempotency trả cùng kết quả.
- [ ] Hai debit tranh một credit: đúng một thành công, còn lại 402; không provider call trước debit.
- [ ] Reconcile so SUM với cache, metric/alert mismatch; không sửa/xoá ledger để “khớp”.

**Kiểm chứng:** `pnpm test -- ai-credit-service ai-credit-concurrency ai-credit-reconcile`.

**Phụ thuộc:** T2 · **Files:** service + repo adapter + concurrency tests · **Cỡ:** M.

### Checkpoint B — Tiền bất biến

- [ ] Race/idempotency/refund/reconcile xanh với PG thật.
- [ ] Human review migration và transaction before integration.

### T4 — Purchase approval và manual grant

**Tiêu chí nghiệm thu**

- [ ] Payment approve grant đúng pack trong cùng transaction/idempotent seam, không tin credit/price client.
- [ ] Manual grant chỉ `super_admin`, lý do bắt buộc, audit log và actor namespace đúng.
- [ ] Approve/grant hai lần, reject, rollback giữa payment-ledger có test âm; không mở tier.

**Kiểm chứng:** `pnpm test -- ai-credit-purchase ai-credit-manual-grant`.

**Phụ thuộc:** T3 + P2 payment/admin · **Files:** adapters/routes/audit tests chia lát · **Cỡ:** M.

### T5 — API balance/history

**Tiêu chí nghiệm thu**

- [ ] GET credits auth/no-store, field allow-list và pagination recent transactions; không internal cost/manager PII.
- [ ] Manager grant route Zod/reauth/audit; User khác không đọc ledger.
- [ ] 0 balance/402/history order/IDOR và large ledger query có integration/perf test.

**Kiểm chứng:** `pnpm test -- ai-credit-api`.

**Phụ thuộc:** T3–T4 · **Files:** 2 routes/projection/tests · **Cỡ:** M.

### T6 — Cảnh báo và observability

**Tiêu chí nghiệm thu**

- [ ] Crossing baseline 20% enqueue một notification idempotent; refund/top-up reset state đúng contract.
- [ ] Metrics debit/refund/insufficient/reconcile mismatch không chứa user/child PII.
- [ ] Alert mismatch/rate anomaly có runbook; không auto-correct ledger.

**Kiểm chứng:** `pnpm test -- ai-credit-notification ai-credit-metrics`.

**Phụ thuộc:** T3 + notification/monitoring · **Files:** hook/metric/test/runbook · **Cỡ:** M.

### T7–T8 — Evidence và handoff

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-ACL-01…09` có test mang mã; concurrency và payment double-approve xanh.
- [ ] Full gate/progress xanh; `AI-CREDIT-LEDGER` có thể `implemented` theo evidence.
- [ ] SKU vẫn ẩn, không bán/grant production; Task #68/#69 dùng service contract đã review.

**Kiểm chứng:** full gate + accounting/security/human diff review.

**Phụ thuộc:** T4–T6 · **Files:** evidence/spec/progress tests · **Cỡ:** M.

## 5. Ngoài phạm vi

Provider/AI UI (#68), vector search (#69), credit expiry, auto top-up, payment gateway tự động.
