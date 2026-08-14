# Checklist — Task #72: P5.2 — PWA và offline curriculum pack

> Plan: [`72-p5-2-pwa-offline-pack-plan.md`](72-p5-2-pwa-offline-pack-plan.md)
> Specs: [`pwa-install.md`](../specs/01-platform/pwa-install.md) ·
> [`offline-play.md`](../specs/01-platform/offline-play.md)

## T0–T1 — Preflight và contract

- [ ] Task #70 accepted offline pack; P4 gate xanh.
- [ ] Đo browser/device install/SW/storage/quota/eviction capabilities thật.
- [ ] Product chốt pack scope; Security chốt lease/revoke/logout; Infra chốt update/budget.
- [ ] Pack API/auth/version/quota/eviction/errors/events/negative Gherkin đầy đủ.
- [ ] Push-to-child bị cấm; FCM Web của User được link sang Task #84, không cài trong Task #72.
- [ ] Service worker boundary giữa install/offline và browser push không đăng ký handler trùng.
- [ ] `pnpm lint:specs` xanh.

## Checkpoint A

- [ ] Product/Security/Infra review contract.
- [ ] Không route/cache trước khi entitlement-offline behavior đóng.

## T2 — Install

- [ ] Manifest/icons/start/scope/display/orientation đúng contract.
- [ ] 3 sessions/30 days/2 dismissals, iOS manual và installed detection tests xanh.
- [ ] `/play` không prompt; launch icon vào parent surface.

## T3–T4 — Pack và entitlement

- [ ] Signed/versioned manifest chỉ chứa content/asset được phép.
- [ ] Resume/idempotent/quota/atomic ready; partial/corrupt pack không playable.
- [ ] Cache ghim content/build version; không cache API/PII ngoài contract.
- [ ] Lease expiry/logout/revoke và new-session gate đúng; phiên đang chạy không bị cắt.
- [ ] Offline progress flush seq/idempotent đúng version.

## Checkpoint B

- [ ] Download→verify→offline play→sync E2E xanh.
- [ ] Partial/corrupt/expired fail-closed; human review cached payload/gating.

## T5–T6–T7 — UX, drill và promote

- [ ] Parent UI size/status/expiry/update/delete/recovery tiếng Việt.
- [ ] Child lobby chỉ content usable; không system/storage/install/delete settings.
- [ ] Offline thật qua reload/restart/eviction/low storage/corrupt/clock tests.
- [ ] SW update giữa phiên không cắt game; cache cleanup drill xanh.
- [ ] Browser/tablet performance/storage budgets được đo.
- [ ] Mọi BR mới có test; P5 open questions PWA/offline/parent gate đóng.
- [ ] Full gate + Security/Infra review; không push child, bypass entitlement, deploy hay auto-merge.
