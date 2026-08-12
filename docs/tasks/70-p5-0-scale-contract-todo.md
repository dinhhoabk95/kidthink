# Checklist — Task #70: P5.0 — Đóng contract Web scale

> Plan: [`70-p5-0-scale-contract-plan.md`](70-p5-0-scale-contract-plan.md).
> Contract-only; không schema, migration, dependency hay runtime code.

## T0 — Inventory

- [ ] Quét đủ P5 promises/open questions/spec owners cho payment, PWA và offline pack.
- [ ] Active manifest không còn classroom/mobile/licensing/localization/market.
- [ ] Mỗi debt thuộc đúng Task #70, #71, #72 hoặc #78.

## T1 — Product/Finance/Infra decisions

- [ ] Chọn riêng settlement, recurring và refund outcome; mỗi outcome có owner.
- [ ] Chốt blocker provider/reconciliation/fallback/dispute/refund/SLA, không điền số giả.
- [ ] Chốt offline pack tối thiểu, TTL/quota/revoke/sync và web device matrix.

## Checkpoint A

- [ ] Product, Finance, Infra review scope.
- [ ] Task #71/#72 vẫn bị chặn cho outcome chưa chốt.
- [ ] Không actor/schema/dependency/runtime code trong diff.

## T2 — Payment specs

- [ ] Một outcome ship độc lập có đúng một spec owner.
- [ ] State/API/auth/audit/idempotency/error/event + negative Gherkin đầy đủ.
- [ ] Index/BR/error/event registries và dependency graph khớp.

## T3 — Offline curriculum pack spec

- [ ] Pack có owner riêng; PWA install và active-session offline không bị gộp owner.
- [ ] Entitlement snapshot/revoke/expire/cache/sync + negative Gherkin đầy đủ.
- [ ] Không cache premium sai quyền, Child tự tải pack hoặc stale pack mở quá hạn.

## T4 — Handoff

- [ ] Roadmap/index/Task #14/#71/#72/#78 map cùng spec/dependency.
- [ ] Accepted specs `approved`; blocker có owner; `pnpm lint:specs` xanh.
- [ ] `pnpm check && pnpm test` xanh và human review diff contract.

## Checkpoint B

- [ ] Contract, graph, task manifest và Web scale gate khớp hai chiều.
- [ ] Task #73–#77 vẫn retired; không production mutation/deploy/publish/auto-merge.
