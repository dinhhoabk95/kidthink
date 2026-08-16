# Checklist — Task #72: P5.2 — PWA và offline curriculum pack

> Plan: [`72-p5-2-pwa-offline-pack-plan.md`](72-p5-2-pwa-offline-pack-plan.md)
> Specs: [`pwa-install.md`](../specs/01-platform/pwa-install.md) ·
> [`offline-play.md`](../specs/01-platform/offline-play.md)

## T0–T1 — Preflight và contract

- [x] Task #70 accepted offline pack; P4 gate xanh.
- [x] Đo browser/device install/SW/storage/quota/eviction capabilities thật.
- [x] Product chốt pack scope; Security chốt lease/revoke/logout; Infra chốt update/budget.
- [x] Pack API/auth/version/quota/eviction/errors/events/negative Gherkin đầy đủ.
- [x] Push-to-child bị cấm; FCM Web của User được link sang Task #84, không cài trong Task #72.
- [x] Service worker boundary giữa install/offline và browser push không đăng ký handler trùng.
- [x] `pnpm lint:specs` xanh.

## Checkpoint A

- [x] Product/Security/Infra review contract.
- [x] Không route/cache trước khi entitlement-offline behavior đóng.

## T2 — Install

- [x] Manifest/icons/start/scope/display/orientation đúng contract.
- [x] 3 sessions/30 days/2 dismissals, iOS manual và installed detection tests xanh.
- [x] `/play` không prompt; launch icon vào parent surface.

## T3–T4 — Pack và entitlement

- [x] Signed/versioned manifest chỉ chứa content/asset được phép.
- [x] Resume/idempotent/quota/atomic ready; partial/corrupt pack không playable.
- [x] Cache ghim content/build version; không cache API/PII ngoài contract.
- [x] Lease expiry/logout/revoke và new-session gate đúng; phiên đang chạy không bị cắt.
- [x] Offline progress flush seq/idempotent đúng version.

## Checkpoint B

- [x] Download→verify→offline play→sync E2E xanh.
- [x] Partial/corrupt/expired fail-closed; human review cached payload/gating.

## T5–T6–T7 — UX, drill và promote

- [x] Parent UI size/status/expiry/update/delete/recovery tiếng Việt.
- [x] Child lobby chỉ content usable; không system/storage/install/delete settings.
- [x] Offline thật qua reload/restart/eviction/low storage/corrupt/clock tests.
- [x] SW update giữa phiên không cắt game; cache cleanup drill xanh.
- [x] Browser/tablet performance/storage budgets được đo.
- [x] Mọi BR mới có test; P5 open questions PWA/offline/parent gate đóng.
- [x] Full gate + Security/Infra review; không push child, bypass entitlement, deploy hay auto-merge.
