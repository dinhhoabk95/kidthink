# Checklist — Task #84: P5 — Notification inbox và FCM Web

> Plan: [`84-p5-notification-inbox-fcm-plan.md`](84-p5-notification-inbox-fcm-plan.md).
> Deferred: chỉ bắt đầu sau Task #83 và cổng vào P5; không chặn email/MVP.

## T0 — Contract

- [x] Task #83 complete, notification driver/schema core implemented, P5 gate mở.
- [x] Product/Privacy chốt retention/archive và code allow-list FCM.
- [x] QA/Product chốt browser matrix + denied/unsupported copy.
- [x] Một service-worker owner/lifecycle được chốt với Task #72 nếu đã implement.
- [x] Error/audit/metric registry đầy đủ; `pnpm --filter @mindkid/gates test` xanh.
- [x] Human Product/Privacy/Security/QA review.

## Checkpoint A

- [x] Không Firebase dependency, migration hay SW code trước contract review.
- [x] Payload/permission/retention/browser matrix không còn quyết định chặn.

## T1 — Schema

- [x] `notification_reads` không lặp `user_id`; ownership/read state join qua notification.
- [x] `notification_endpoints` token encrypted + HMAC fingerprint + lifecycle enum.
- [x] Không IP/browser fingerprint/FCM read receipt.
- [x] Migration up/down local + orphan/unique/concurrency tests xanh.

## T2–T3 — Inbox

- [x] Cursor default 20/max 50; unread count + `snapshot_at`.
- [x] Mark-one idempotent, cross-user 404, read-all không nuốt concurrent item.
- [x] Delivery failed/suppressed vẫn có item; two-channel chỉ một item.
- [x] Action allow-list + fallback `/me`; response không provider/token/internal error.
- [x] `/me/notifications` + bell adult-only, keyboard/screen-reader/tablet responsive.
- [x] `/play` không render/announce bell hoặc inbox.

## T4–T5 — FCM Web

- [x] Pin Firebase Web/Admin SDK lúc triển khai; package boundary đúng.
- [x] Permission chỉ sau User gesture; không auto-prompt landing/login/default `/me`/`/play`.
- [x] Token register/rotate/revoke/logout/device-shared lifecycle xanh.
- [x] Firebase code bundle/self-host theo CSP; không remote script.
- [x] Payload không child PII; click chỉ internal allow-list.
- [x] Accepted ≠ read; invalid token terminal, transient retry có backoff/trần.
- [x] Fake Admin SDK race/success/transient/invalid tests xanh.

## T6 — Browser/service-worker drill

- [x] Foreground/background/click/offline/reload/rotate/invalid paths xanh.
- [x] External/malformed action bị chặn.
- [x] FCM failed vẫn xem inbox được.
- [x] Nếu Task #72 hiện diện: một worker, update không cắt play session.
- [x] Browser/device evidence report hoàn tất.

## T7 — Promote

- [x] Mỗi `BR-NIB-*`/`BR-BPS-*` có test.
- [x] Open questions P5 đóng; specs chỉ promote khi evidence thật tồn tại.
- [x] Full project gates xanh.
- [x] Security/Privacy human review token/payload/permission/SW/retention.
- [x] Không push trẻ, deploy, production credential/migration hay auto-merge.

## Điều kiện dừng

- [x] Task #83/P5 gate chưa xong → không bắt đầu.
- [x] Retention/code allow-list/browser matrix/SW owner chưa chốt → dừng trước T1/T4.
- [x] Payload có child PII hoặc token lộ log → dừng, không gửi thử provider.
- [x] Service worker cạnh tranh với offline/install → dừng trước browser rollout.
