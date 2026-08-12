# Checklist — Task #78: P5.3 — Cổng ra Web scale

> Plan: [`78-p5-3-web-scale-gate-plan.md`](78-p5-3-web-scale-gate-plan.md).
> Evidence-only; không thay implementation còn thiếu.

## T0–T1 — Manifest và progress gate

- [ ] Manifest ghi outcome/spec/task/dependency/owner/evidence path.
- [ ] Chỉ outcome Task #70 accepted xuất hiện; missing evidence làm đỏ.
- [ ] Gate không hardcode count/task và không tự tick/status.
- [ ] Fixtures approved-only/missing-dep/deferred-ticked/rejected-still-roadmap đỏ.

## Checkpoint A

- [ ] Real manifest xanh, toàn bộ fixture âm đỏ.
- [ ] Product review scope claim.

## T2 — Payment journey

- [ ] Accepted settle/reconcile/renew/refund journey xanh bằng sandbox/fake.
- [ ] Duplicate/replay/out-of-order/partial failure không double effect.
- [ ] Manual fallback, audit và alert evidence đầy đủ.

## T3 — PWA/offline journey

- [ ] Install→download→offline play→sync→expire/revoke browser E2E xanh.
- [ ] Cross-user/expired/stale pack bị chặn; sync idempotent.
- [ ] Service-worker update, storage pressure và sync failure fallback được drill.

## T4 — Operations và quality

- [ ] Fresh DB/upgrade/rollback/forward recovery xanh.
- [ ] Backup/restore giữ money/entitlement/consent/offline invariants trên synthetic data.
- [ ] §7.3 security/privacy + performance/a11y/outage/capacity drills xanh.

## T5 — Human closure

- [ ] Finance, Security, Product, Infra review đúng evidence.
- [ ] Unresolved issue giữ gate đỏ; full project gates xanh trên clean checkout.
- [ ] Canonical phase status/progress chỉ đổi sau human review.

## Checkpoint B

- [ ] Mọi accepted outcome chứng minh đủ; deferred/rejected đúng nghĩa.
- [ ] Không mobile/classroom/licensing/localization/market claim, production mutation, deploy, publish hay auto-merge.
