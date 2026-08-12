# Kế hoạch — Task #71: P5.1 — Thanh toán tự động và refund

> Viết 2026-08-11, đo tại commit `484ebaf`.
> Phụ thuộc: Task #70 chấp nhận outcome payment và cổng ra P4.
> Vùng nhạy cảm: thanh toán; test âm trước, full gate và human review mỗi increment.

## Tóm tắt

Task #71 thêm payment provider tự động mà không phá VietQR duyệt tay, xử lý webhook theo
idempotency, chỉ bật recurring billing khi catalog/consent đã chốt, và bổ sung refund có audit.
Provider, phí, currency, recurring policy, refund policy và accounting owner đều là human
decision trước migration. Không credential/provider production call nằm trong task.

## 0. Hard rules kế thừa

- `BR-PAY-02` — không duyệt hai lần; mọi provider event cũng idempotent.
- `BR-PAY-03` — state transition, entitlement và audit cùng transaction.
- `BR-PKG-03`/`BR-POC-01` — giá từ catalog server, không từ client/webhook metadata.
- `BR-PAY-08` — không xoá lịch sử; refund là record/transition mới.
- VietQR manual là fallback tới khi cutover/rollback được người quyết duyệt.

## 1. Quyết định bắt buộc

**D-P5PAY-A — Provider event không phải sự thật chưa kiểm.** Verify signature, livemode,
merchant/account, amount/currency/order mapping và replay window trước transition.

**D-P5PAY-B — Exactly-once effect trên at-least-once webhook.** Lưu provider event ID và
transition idempotency trong cùng transaction; duplicate/out-of-order không cấp quyền lần hai.

**D-P5PAY-C — Recurring cần consent version.** Không tự gia hạn từ một thanh toán one-off.
User phải chọn offer recurring, thấy số tiền/kỳ/hủy và consent version được snapshot.

**D-P5PAY-D — Refund không sửa lịch sử.** Refund record liên kết payment, có amount/reason/
provider ref/status; entitlement adjustment theo policy đã duyệt và audit nguyên tử.

## 2. Đồ thị

```text
T0 provider/legal/finance preflight
 └── T1 specs + state machines + error/event contract ── Checkpoint A
      ├── T2 provider driver + webhook verification
      └── T3 schema/migration + idempotency/outbox
           └── T4 payment orchestration/reconciliation ── Checkpoint B
                ├── T5 recurring billing/account UX
                └── T6 refund/admin UX
                     └── T7 replay/chaos/accounting drill
                          └── T8 promote specs + handoff
```

## 3. Task triển khai

### T0 — Preflight provider và policy

**Tiêu chí nghiệm thu**

- [ ] Finance/Product chọn provider, phương thức, fee/currency, settlement và VietQR fallback.
- [ ] Legal chốt recurring consent, cancel, refund window/partial refund và legal-page owner.
- [ ] Security chốt signature, secret rotation, replay window, sandbox và incident path.

**Kiểm chứng:** decision record; không SDK/migration trước khi ba owner duyệt.

**Phụ thuộc:** #70 + P4 · **Files:** evidence/task/spec decision · **Cỡ:** S.

### T1 — Spec-first contract

**Tiêu chí nghiệm thu**

- [ ] Automated payment, recurring billing và refund có owner riêng; existing payment specs link,
  không copy state/rule.
- [ ] State machines, API/webhook, events, errors, audit actions và negative Gherkin đầy đủ.
- [ ] Monthly offer chỉ public khi payment/renew/cancel/refund path cùng sẵn sàng.

**Kiểm chứng:** `pnpm lint:specs`; registry/index/dependency graph khớp.

**Phụ thuộc:** T0 · **Files:** canonical specs/index/BR/error/event registries · **Cỡ:** M.

### Checkpoint A — Contract money review

- [ ] Finance/Product/Legal/Security review spec diff và failure matrix.
- [ ] Không schema/SDK khi amount, consent, refund và idempotency còn mở.

### T2 — Provider driver và webhook verifier

**Tiêu chí nghiệm thu**

- [ ] Domain port giấu SDK; verify raw-body signature, timestamp, merchant/mode trước parse domain.
- [ ] Fake/sandbox adapter có fixtures valid, bad signature, replay, duplicate, out-of-order.
- [ ] Logs không chứa secret/full payment instrument; key rotation có test.

**Kiểm chứng:** `pnpm test -- payment-provider webhook-verification`; không network thật trong test.

**Phụ thuộc:** Checkpoint A · **Files:** payment package/driver/tests · **Cỡ:** M.

### T3 — Schema, migration và delivery ledger

**Tiêu chí nghiệm thu**

- [ ] Schema theo spec cho provider customer/payment/event/subscription/refund và unique idempotency.
- [ ] Migration DB rỗng/upgrade/rollback; existing VietQR rows giữ nguyên nghĩa và query được.
- [ ] Outbox/reconciliation state không tạo entitlement ngoài transaction.

**Kiểm chứng:** DB integration tests cho duplicate/replay/out-of-order/rollback.

**Phụ thuộc:** Checkpoint A · **Files:** schema/migration/meta/repository tests · **Cỡ:** M mỗi lát.

### T4 — Payment orchestration và reconciliation

**Tiêu chí nghiệm thu**

- [ ] Checkout lấy price server-side, tạo provider intent idempotent và map đúng internal order.
- [ ] Verified webhook transition + entitlement + audit nguyên tử; event lạ fail-closed.
- [ ] Reconciliation job báo missing/mismatch, không tự “sửa” amount hoặc cấp quyền mù.

**Kiểm chứng:** `pnpm test -- automated-payment reconciliation`; PG/queue thật, provider fake.

**Phụ thuộc:** T2–T3 · **Files:** service/routes/worker/integration tests · **Cỡ:** M mỗi lát.

### Checkpoint B — Money write path

- [ ] Checkout→webhook→entitlement và duplicate/out-of-order/rollback đều xanh.
- [ ] Human review raw-body boundary, transaction và reconciliation report.

### T5 — Recurring billing và account UX

**Tiêu chí nghiệm thu**

- [ ] Opt-in snapshot consent/offer; renewal success/failure/grace/cancel contract đúng spec.
- [ ] Account UI hiển thị kỳ, lần thu tới, phương thức masked, cancel và history bằng tiếng Việt.
- [ ] Retry/dunning không spam notification hay kéo dài entitlement trái policy.

**Kiểm chứng:** integration + E2E renewal/cancel/failure với provider clock/fake.

**Phụ thuộc:** T4 · **Files:** service/routes/account UI/worker/tests · **Cỡ:** M mỗi lát.

### T6 — Refund và admin UX

**Tiêu chí nghiệm thu**

- [ ] Refund request/process idempotent, amount cap server-side và không refund quá captured amount.
- [ ] Provider refund, internal record, entitlement adjustment và audit theo state machine; async fail rõ.
- [ ] User/admin/legal surfaces hiển thị policy/status; role/reauth/note bắt buộc.

**Kiểm chứng:** full/partial/duplicate/fail/chargeback-like fixtures; 404 ownership/403 role tests.

**Phụ thuộc:** T4 + policy T1 · **Files:** service/routes/admin+account UI/tests · **Cỡ:** M mỗi lát.

### T7 — Security, chaos và accounting drill

**Tiêu chí nghiệm thu**

- [ ] Replay storm, webhook reorder, provider timeout, queue retry và DB rollback không double effect.
- [ ] Reconciliation tổng captured/refunded/net khớp provider sandbox fixtures và internal ledger.
- [ ] Secret rotation, alert, manual fallback và rollback drill có evidence người review.

**Kiểm chứng:** security/chaos/load report + full gates; không production mutation.

**Phụ thuộc:** T5–T6 · **Files:** fixtures/load/evidence · **Cỡ:** M.

### T8 — Promote contract

**Tiêu chí nghiệm thu**

- [ ] Mọi BR payment mới có test mang mã; open questions P5 payment/refund được đóng.
- [ ] Spec chỉ `implemented` khi checkout, recurring/refund accepted scope và fallback cùng xanh.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:services` xanh.

**Kiểm chứng:** progress evidence Task #71 + human Finance/Security review.

**Phụ thuộc:** T7 · **Files:** spec status/progress/evidence · **Cỡ:** S.

## 4. Ngoài phạm vi

Tự chọn provider/phí, lưu card data, production credential, live charge/refund, bỏ VietQR trước
cutover approval, hardcode giá, auto-merge hoặc chạy migration ngoài local.

