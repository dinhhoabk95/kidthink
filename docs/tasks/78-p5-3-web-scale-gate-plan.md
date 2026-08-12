# Kế hoạch — Task #78: P5.3 — Cổng ra Web scale

> Viết lại 2026-08-11 theo quyết định D11.
> Phụ thuộc: Task #70 và các Task #71–#72 được nhận trong manifest.
> Task này kiểm evidence và đóng phase; không thay implementation còn thiếu.

## Tóm tắt

Task #78 chỉ chứng minh các outcome Web scale đã được duyệt: automated payment và PWA/offline
curriculum pack. Cổng không biết tới classroom, native mobile, licensing, localization hay mở
thị trường. Outcome accepted cần spec `implemented` + test/evidence; deferred không được tính
xong; outcome bị bỏ phải biến mất khỏi canonical roadmap.

## 1. Quyết định

**D-P5G-A — Manifest, không magic count.** Spec/task/dependency/evidence sinh từ manifest đã
human approve; thêm hoặc bớt spec đổi manifest, không sửa số ở nhiều file.

**D-P5G-B — Claim rộng cần evidence rộng.** Unit test một package không chứng minh payment
journey hoặc offline revoke. Gate chạy integration/E2E/security/performance/restore theo surface.

**D-P5G-C — Human gate không tự động hóa mất.** Finance review money; Security review egress,
cache và auth; Product review journey; Infra review capacity/fallback. Script chỉ báo đỏ/xanh.

## 2. Đồ thị

```text
T0 freeze manifest/evidence
 └── T1 progress gate + negative fixtures ── Checkpoint A
      ├── T2 payment journey + failure matrix
      ├── T3 PWA/offline journey + revoke/sync matrix
      └── T4 migration/restore/security/performance drills
           └── T5 human review + canonical closure ── Checkpoint B
```

## 3. Task breakdown

### T0 — Freeze manifest và inventory evidence

**Acceptance criteria**

- [ ] Manifest ghi outcome, spec ID, task, dependency, owner và evidence path.
- [ ] Chỉ outcome Task #70 accepted xuất hiện; missing/unknown evidence được đánh blocker.
- [ ] Không dùng checkbox hoặc `approved` làm bằng chứng implementation.

**Verification:** generated inventory diff review; missing owner/spec/evidence exit non-zero.

**Dependencies:** Task #70 + accepted #71/#72 · **Files likely touched:** manifest/evidence index · **Estimated scope:** S.

### T1 — Progress gate và fixture âm

**Acceptance criteria**

- [ ] Gate tính coverage từ manifest, không hardcode 130 hoặc danh sách task.
- [ ] Fixture approved-only, missing dependency/evidence, deferred-ticked và rejected-still-roadmap đều đỏ.
- [ ] Gate read-only, không tự tick/status/merge.

**Verification:** test progress gate chạy deterministically đỏ/xanh.

**Dependencies:** T0 · **Files likely touched:** progress library, tests, package script · **Estimated scope:** M.

### Checkpoint A — Corpus truth

- [ ] Real manifest xanh; toàn bộ fixture âm đỏ.
- [ ] Product review scope claim trước E2E/system audit.

### T2 — Payment journey và failure matrix

**Acceptance criteria**

- [ ] Accepted checkout→settle/reconcile/renew/refund journey đi hết bằng sandbox/fake.
- [ ] Duplicate/replay/out-of-order/partial failure không double charge/grant/refund.
- [ ] Manual fallback, audit và alert evidence đầy đủ.

**Verification:** versioned integration/E2E matrix; không production provider call.

**Dependencies:** Checkpoint A + Task #71 · **Files likely touched:** payment E2E/fixtures/evidence · **Estimated scope:** M.

### T3 — PWA/offline journey và quyền truy cập

**Acceptance criteria**

- [ ] Install→download→offline play→sync→expire/revoke chạy trên browser/device matrix thật.
- [ ] Cross-user/expired entitlement/stale pack không mở được content; event sync idempotent.
- [ ] Service-worker update, storage pressure và mất mạng giữa sync có fallback đo được.

**Verification:** browser E2E offline mode thật; cache/storage/security inspection.

**Dependencies:** Checkpoint A + Task #72 · **Files likely touched:** PWA/offline E2E/fixtures/evidence · **Estimated scope:** M.

### T4 — Operations và quality drills

**Acceptance criteria**

- [ ] Fresh DB/upgrade/rollback/forward recovery qua accepted migrations xanh.
- [ ] Backup/restore giữ money, entitlement, consent và offline-pack invariants trên synthetic data.
- [ ] §7.3 security/privacy, performance, a11y, outage và capacity drills xanh.

**Verification:** local/CI drills; infra chỉ validate/plan, không apply.

**Dependencies:** T2–T3 · **Files likely touched:** runbook/tests/evidence theo lát ≤5 file · **Estimated scope:** M.

### T5 — Human review và canonical closure

**Acceptance criteria**

- [ ] Finance, Security, Product và Infra review đúng evidence thuộc vùng của họ.
- [ ] Unresolved blocker giữ gate đỏ; spec/status/progress chỉ đổi sau review.
- [ ] Full project gates xanh trên clean checkout.

**Verification:** `pnpm check && pnpm test && pnpm lint:specs && pnpm check:services` + approved evidence index.

**Dependencies:** T4 · **Files likely touched:** phase progress/spec status/evidence · **Estimated scope:** S.

### Checkpoint B — P5 hoàn tất

- [ ] Mọi accepted outcome chứng minh đủ; deferred/rejected đúng nghĩa.
- [ ] Không production mutation, provider charge/refund, deploy, publish hoặc auto-merge.

## 4. Ngoài phạm vi

Tự thu hẹp scope để gate xanh; mobile/store, classroom, licensing, localization/market journeys;
production migration/provider call/refund/data deletion; deploy, publish content và auto-merge.
