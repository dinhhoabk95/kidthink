# Kế hoạch — Task #70: P5.0 — Đóng contract Web scale

> Viết lại 2026-08-11 theo quyết định D11.
> Đây là task contract-only; không schema, migration, dependency hay code runtime.
> Phụ thuộc để triển khai P5: cổng ra P4 của Task #69.

## Tóm tắt

P5 hiện chỉ scale **cùng sản phẩm web tại Việt Nam**. Hai nhánh được phép đi qua cổng contract:

1. thanh toán tự động/đối soát/recurring/refund;
2. PWA install và offline curriculum pack.

[`pwa-install.md`](../specs/01-platform/pwa-install.md) đã có owner. Automated payment và
offline curriculum pack chưa có spec owner đầy đủ, nên Task #70 phải tách outcome và khóa
contract trước Task #71–#72. Classroom, native mobile, licensing, localization và mở thị
trường đã bị loại; Task #73–#77 retired và không được tái dùng.

## 1. Quyết định kiến trúc

**D-P5WEB-A — P5 không phải nơi chứa mọi ý tưởng “để sau”.** Roadmap chỉ liệt kê outcome web
đã được Product nhận. Outcome ngoài D11 bắt đầu bằng một chương trình scope và task số mới.

**D-P5WEB-B — Tách outcome ship độc lập.** Automated settlement, recurring billing và refund
không dùng một spec chung nếu có thể phát hành hoặc rollback riêng. Offline curriculum pack
không mở rộng ngầm [`offline-play.md`](../specs/01-platform/offline-play.md), vì spec đó chỉ sở
hữu phiên đang chạy.

**D-P5WEB-C — Provider không được quyết thay contract.** State machine, idempotency, money
ledger, reconciliation và refund semantics chốt trước; package driver mới bọc provider sau.

**D-P5WEB-D — Không code trước spec owner.** Task #71/#72 chỉ được bắt đầu khi mọi outcome được
nhận có đúng một spec `approved`, BR/error/event/dependency đã đăng ký và human review diff.

## 2. Đồ thị phụ thuộc

```text
T0 inventory P5 web debt
 └── T1 Product/Finance/Infra decisions ── Checkpoint A
      ├── T2 payment outcome specs + registry
      └── T3 offline-pack spec + PWA alignment
           └── T4 roadmap/index/task manifest review ── Checkpoint B

Sau Task #70 + cổng P4:
  Task #71 payment ─┐
  Task #72 PWA/offline ─┴─→ Task #78 Web scale gate
```

## 3. Task breakdown

### T0 — Inventory contract và blocker

**Acceptance criteria**

- [ ] Liệt kê mọi P5 promise, open question và spec owner liên quan payment/PWA/offline.
- [ ] Không còn outcome classroom/mobile/licensing/localization/market trong active manifest.
- [ ] Mỗi debt được gán đúng Task #70, #71, #72 hoặc #78; không có hàng mồ côi.

**Verification:** `rg` trên [`SPEC.md`](../../SPEC.md), `docs/specs`, `docs/tasks`; review bảng nguồn hai chiều.

**Dependencies:** Không · **Files likely touched:** hồ sơ Task #70 · **Estimated scope:** S.

### T1 — Chốt quyết định sản phẩm và vận hành

**Acceptance criteria**

- [ ] Product/Finance chọn settlement, recurring và refund outcome nào được nhận; mỗi outcome có owner.
- [ ] Provider, reconciliation/manual fallback, dispute/refund policy và SLA được ghi là blocker thật, không điền số giả.
- [ ] Product/Infra chốt offline pack tối thiểu, TTL/quota/revoke/sync và thiết bị web đích.

**Verification:** decision table có ngày, owner, lý do, trigger và downstream spec.

**Dependencies:** T0 · **Files likely touched:** Task #70 + evidence quyết định · **Estimated scope:** S.

### Checkpoint A — Human scope review

- [ ] Product, Finance và Infra duyệt đúng outcome; mục chưa chốt giữ Task #71/#72 bị chặn.
- [ ] Không dùng Task #70 để thêm actor, schema hoặc dependency.

### T2 — Viết payment specs theo outcome

**Acceptance criteria**

- [ ] Mỗi outcome accepted có đúng một spec owner, state/API/auth/audit/idempotency/error/event rõ.
- [ ] Negative Gherkin phủ duplicate webhook, replay, partial failure, double refund và reconciliation lệch.
- [ ] Index và BR/error/event registries khớp, không copy contract của [`payment-flow.md`](../specs/00-foundation/payment-flow.md).

**Verification:** `pnpm lint:specs`; dependency graph không chu trình; human Finance/Security review.

**Dependencies:** Checkpoint A · **Files likely touched:** từng payment spec + registries/index theo lát ≤5 file · **Estimated scope:** M mỗi spec.

### T3 — Viết offline curriculum pack spec và align PWA

**Acceptance criteria**

- [ ] Pack tải trước có owner riêng với entitlement snapshot, revoke/expire, encryption/cache và sync semantics.
- [ ] [`pwa-install.md`](../specs/01-platform/pwa-install.md) chỉ sở hữu install UX; [`offline-play.md`](../specs/01-platform/offline-play.md) chỉ sở hữu buffer phiên.
- [ ] Negative Gherkin chặn cache premium sai quyền, Child tự tải pack và stale pack mở quá hạn.

**Verification:** `pnpm lint:specs`; link/BR/error/event/dependency checks; Security/Product review.

**Dependencies:** Checkpoint A · **Files likely touched:** offline-pack spec, PWA/offline links, registries/index theo lát ≤5 file · **Estimated scope:** M.

### T4 — Khóa manifest và handoff

**Acceptance criteria**

- [ ] Roadmap/index/Task #14/#71/#72/#78 map cùng một tập spec và dependency.
- [ ] Mọi spec accepted `approved`; mọi blocker có owner; không hardcode corpus count mới ở nhiều nơi.
- [ ] Human review diff contract trước khi Task #71 hoặc #72 viết code.

**Verification:** `pnpm check && pnpm test && pnpm lint:specs`; query coverage roadmap ↔ spec ↔ task.

**Dependencies:** T2–T3 · **Files likely touched:** roadmap, index, task manifest/evidence · **Estimated scope:** S.

### Checkpoint B — Contract Web scale sẵn sàng

- [ ] Spec owners, dependency graph, task handoff và cổng Task #78 khớp hai chiều.
- [ ] Diff Task #70 không có runtime code, schema hoặc migration.

## 4. Rủi ro và giảm thiểu

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Một spec “payment-v2” sở hữu mọi thứ | Không ship/rollback độc lập | D-P5WEB-B, một outcome một spec |
| Offline pack bị coi là cache kỹ thuật | Rò nội dung trả phí sau revoke | Entitlement/revoke negative Gherkin ở T3 |
| Provider quyết state machine | Đổi provider kéo đổi public contract | D-P5WEB-C, package driver đứng sau contract |
| Ý tưởng ngoài scope quay lại bằng task cũ | Roadmap lại mâu thuẫn D11 | Task #73–#77 retired, task số mới sau scope decision |

## 5. Ngoài phạm vi

Implementation, schema/migration, chọn production credential, provider call, refund thật,
deploy, publish, auto-merge; classroom, native mobile, licensing, localization và mở thị trường.
