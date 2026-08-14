# Kế hoạch — Task #84: P5 — Notification inbox và FCM Web

> Viết 2026-08-13.
> Specs: [`notification-inbox.md`](../specs/03-account/notification-inbox.md) →
> [`browser-push.md`](../specs/01-platform/browser-push.md).
> Phụ thuộc: Task #83 hoàn tất + cổng vào P5. Không chặn email/MVP.

## Tóm tắt

Thêm một inbox để User xem lại logical notification, sau đó thêm FCM Web như delivery channel
best-effort. Thứ tự này có chủ đích: inbox là nguồn sự thật; push có thể bị browser/OS bỏ.

Task #84 không đổi provider email, không gửi push tới trẻ và không dùng FCM làm read receipt.
Nếu Task #72 đã có service worker, hai task phải dùng một registration/lifecycle thay vì đăng ký
hai worker cạnh tranh.

## 0. Quyết định đã chốt và gate còn mở

**Đã chốt**

- Provider browser push: FCM Web (`firebase` client, `firebase-admin` server).
- Permission chỉ sau User gesture trên bề mặt người lớn.
- Token mã hoá, không log; FCM payload không có PII trẻ.
- Logical notification/inbox tồn tại độc lập delivery success.
- FCM không triển khai trong Task #83.

**Phải chốt ở T0 trước code**

- retention/archive của inbox;
- 11 notification code nào bật FCM mặc định;
- browser/device matrix và fallback copy;
- service-worker ownership nếu Task #72 chạy trước.

## 1. Đồ thị phụ thuộc

```text
Task #83 + P5 gate
 └──→ T0 close Product/Privacy/browser/SW contract ── Checkpoint A
       └──→ T1 notification_reads + notification_endpoints schema
             ├──→ T2 inbox API/read state
             │      └──→ T3 /me inbox + bell
             └──→ T4 FCM client permission/token lifecycle
                    └──→ T5 FCM server driver + delivery policy

T3 + T5 ──→ T6 browser/rotation/failure E2E ──→ T7 evidence/promote
```

T2 và T4 chạy song song sau T1. T5 cần T4 token contract và notification delivery interface từ
Task #83. T6 không bắt đầu nếu service-worker owner chưa rõ.

## 2. Task triển khai

### T0 — Khép contract P5

**Tiêu chí nghiệm thu**

- [ ] Product/Privacy chốt retention/archive và code allow-list FCM.
- [ ] QA chốt browser/device matrix; Product chốt denied/unsupported copy.
- [ ] Nếu Task #72 đã implement, hai plan chốt một service worker, update/activation safe point và
      handler ownership; không đăng ký worker thứ hai.
- [ ] Error/audit/metric identifiers mới vào registry trước route.

**Kiểm chứng:** `pnpm lint:specs`; decision table có owner/date, không open question chặn P5.

**Bề mặt dự kiến:** hai owner specs · error/event/metric registry · Task #72 boundary nếu cần.

**Phụ thuộc:** Task #83 + P5 gate + human decisions · **Cỡ:** M.

### Checkpoint A — Contract review

- [ ] Product/Privacy/Security/QA review payload, retention, permission và browser matrix.
- [ ] Không migration, Firebase dependency hay service-worker code trước checkpoint.

### T1 — Schema inbox và endpoint

**Tiêu chí nghiệm thu**

- [ ] Migration local tạo `notification_reads` và `notification_endpoints` đúng owner specs.
- [ ] `notification_reads` không lặp `user_id`; ownership join qua recipient logical notification.
- [ ] Endpoint token encrypted + HMAC fingerprint unique.
- [ ] Không IP/browser fingerprint/read receipt; account deletion/revocation cascade đúng contract.
- [ ] Migration up/down và orphan/unique/concurrency tests xanh.

**Kiểm chứng:** DB integration + migration rollback local.

**Bề mặt dự kiến:** ops schema · migration · DB tests · shared Zod types.

**Phụ thuộc:** Checkpoint A · **Cỡ:** M.

### T2 — Inbox API và read state

**Tiêu chí nghiệm thu**

- [ ] List cursor `(occurred_at, uuid)`, default 20/max 50, unread count và snapshot.
- [ ] Mark-one idempotent; IDOR trả 404; read-all chỉ tới `snapshot_at`.
- [ ] Delivery failed/suppressed không làm logical item biến mất.
- [ ] Action URL allow-list/fallback `/me`; response không provider/token/internal error.

**Kiểm chứng:** pagination/race/ownership/failure integration tests tham chiếu `BR-NIB-*`.

**Bề mặt dự kiến:** list route · read routes · inbox service · API tests.

**Phụ thuộc:** T1 · **Cỡ:** M.

### T3 — `/me/notifications` và bell

**Tiêu chí nghiệm thu**

- [ ] Inbox/bell chỉ ở adult surface; `/play` không render hoặc announce chúng.
- [ ] Loading/empty/error/unread/read-all states tiếng Việt, keyboard/screen-reader usable.
- [ ] Cursor load-more không duplicate/reorder; action target hỏng fallback rõ.
- [ ] Responsive tablet/mobile/desktop; không polling dày khi tab ẩn.

**Kiểm chứng:** component + Playwright/a11y/IDOR navigation tests.

**Bề mặt dự kiến:** page · bell/list components · API composable · E2E tests.

**Phụ thuộc:** T2 · **Cỡ:** M.

### T4 — FCM Web client và permission lifecycle

**Tiêu chí nghiệm thu**

- [ ] Pin Firebase Web SDK tại version đã verify lúc Task #84; bundle/self-host code theo CSP.
- [ ] Permission API chỉ gọi sau nút User; landing/login `/me` mặc định và `/play` không auto-prompt.
- [ ] Registration/rotation/revoke dùng first-party installation id; logout/device-shared flow xoá
      token local và revoke server endpoint.
- [ ] Unsupported/denied không nag; email + inbox vẫn hoạt động.

**Kiểm chứng:** real-browser permission/default/denied/unsupported/token-rotation tests.

**Bề mặt dự kiến:** Firebase client plugin · notification settings control · service worker · API tests.

**Phụ thuộc:** T1 · **Cỡ:** M.

### T5 — FCM server driver và delivery policy

**Tiêu chí nghiệm thu**

- [ ] Pin `firebase-admin`; chỉ `packages/notification` import server SDK.
- [ ] Delivery tạo theo code allow-list/preferences; payload chỉ id/copy chung/internal action path,
      không child PII.
- [ ] Accepted chỉ ghi dispatched, không read; invalid token terminalize endpoint và không retry.
- [ ] Transient retry có backoff/trần; duplicate worker claim không gửi hai request đồng thời.

**Kiểm chứng:** fake Admin SDK success/transient/invalid/race tests + outbound payload PII scan.

**Bề mặt dự kiến:** FCM driver · delivery policy · worker integration · tests.

**Phụ thuộc:** T4 + Task #83 notification driver · **Cỡ:** M.

### T6 — Browser/service-worker/E2E drill

**Tiêu chí nghiệm thu**

- [ ] Foreground/background/click/offline/reload/logout/token rotate/invalid endpoint paths xanh.
- [ ] Click external/malformed action bị chặn; notification click mở đúng internal path.
- [ ] Inbox vẫn có item khi FCM bị block/failed; hai channels vẫn một inbox item.
- [ ] Nếu Task #72 hiện diện: install/offline/update/push dùng một worker, update không cắt phiên.

**Kiểm chứng:** browser matrix report + service-worker lifecycle drill + integration DB evidence.

**Bề mặt dự kiến:** E2E suites · fixtures · device/browser evidence.

**Phụ thuộc:** T3 + T5 · **Cỡ:** M.

### T7 — Promote

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-NIB-*`/`BR-BPS-*` có test; open questions P5 đã đóng.
- [ ] Specs chỉ `implemented` khi inbox và accepted FCM scope đều có evidence.
- [ ] Full gate + Security/Privacy human review token, payload, permission, SW và retention.
- [ ] Không deploy/provider credential/production migration/auto-merge.

**Kiểm chứng:** project gates + Task #84 evidence manifest.

**Phụ thuộc:** T6 · **Cỡ:** S.

## 3. Definition of done

- User xem lại logical notification độc lập email/FCM outcome.
- Permission không auto-prompt, trẻ không thấy push/inbox.
- Token encrypted/rotatable/revocable, không log; payload không PII trẻ.
- Browser/service-worker matrix và failure paths có evidence thật.
- Full gates xanh và human review trước merge.

## 4. Nguồn chính thức

- FCM Web setup/service worker/VAPID: <https://firebase.google.com/docs/cloud-messaging/web/get-started>
- Receive foreground/background messages: <https://firebase.google.com/docs/cloud-messaging/web/receive-messages>
- Admin SDK send: <https://firebase.google.com/docs/cloud-messaging/send/admin-sdk>

## 5. Ngoài phạm vi

Push tới trẻ, native mobile app, marketing automation, location/browser fingerprinting, read receipt
từ FCM, nhiều push provider, production deploy/credential/migration, auto-merge.
