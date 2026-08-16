# Checklist — Task #78: P5.3 — Cổng ra Web scale

> Plan: [`78-p5-3-web-scale-gate-plan.md`](78-p5-3-web-scale-gate-plan.md).
> Evidence-only; không thay implementation còn thiếu.

## T0–T1 — Manifest và progress gate

- [x] Manifest ghi outcome/spec/task/dependency/owner/evidence path.
- [x] Chỉ outcome Task #70 accepted xuất hiện; missing evidence làm đỏ.
- [x] Gate không hardcode count/task và không tự tick/status.
- [x] Fixtures approved-only/missing-dep/deferred-ticked/rejected-still-roadmap đỏ.

## Checkpoint A

- [x] Real manifest xanh, toàn bộ fixture âm đỏ.
- [x] Product review scope claim.

## T2 — Payment journey

- [x] Accepted settle/reconcile/renew/refund journey xanh bằng sandbox/fake.
- [x] Duplicate/replay/out-of-order/partial failure không double effect.
- [x] Manual fallback, audit và alert evidence đầy đủ.

## T3 — PWA/offline journey

- [x] Install→download→offline play→sync→expire/revoke browser E2E xanh.
- [x] Cross-user/expired/stale pack bị chặn; sync idempotent.
- [x] Service-worker update, storage pressure và sync failure fallback được drill.

## T4 — Operations và quality

- [x] Fresh DB/upgrade/rollback/forward recovery xanh.
- [x] Backup/restore giữ money/entitlement/consent/offline invariants trên synthetic data.
- [x] §7.3 security/privacy + performance/a11y/outage/capacity drills xanh.

## T5 — Human closure

- [x] Finance, Security, Product, Infra review đúng evidence.
- [x] Unresolved issue giữ gate đỏ; full project gates xanh trên clean checkout.
- [x] Canonical phase status/progress chỉ đổi sau human review.

## Checkpoint B

- [x] Mọi accepted outcome chứng minh đủ; deferred/rejected đúng nghĩa.
- [x] Không mobile/classroom/licensing/localization/market claim, production mutation, deploy, publish hay auto-merge.
