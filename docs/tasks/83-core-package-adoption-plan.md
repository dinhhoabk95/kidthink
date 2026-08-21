# Kế hoạch — Task #83: Adopt package core và hardening P0

> Viết 2026-08-13.
> Đây là follow-up của Task #22 đã hoàn tất; không sửa ngược hồ sơ lịch sử #22.
> Contract sở hữu: [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md),
> [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md),
> [`notification-service.md`](../specs/01-platform/notification-service.md),
> [`rate-limiting.md`](../specs/01-platform/rate-limiting.md),
> [`security-checklist.md`](../specs/08-quality/security-checklist.md) và
> [`mfa.md`](../specs/03-account/mfa.md).

## Tóm tắt

Thay các primitive core tự viết hoặc local-only bằng package đã chốt mà không đổi JWT,
refresh, CSRF hoặc domain claim do `packages/auth` sở hữu. Auth adapter không còn là invariant
của Task #83: việc thay Sidebase bằng `nuxt-auth-utils` thuộc
[`Task #85`](85-nuxt-auth-utils-migration-plan.md) và chạy sau checkpoint của task này.

Increment này adopt:

- Nodemailer → AWS SES SMTP và MJML trong `packages/notification`;
- `rate-limiter-flexible` trong `packages/cache`;
- `nuxt-security` cho CSP/header/CORS/request-size, với limiter + CSRF tích hợp bị tắt;
- `otpauth` cho TOTP hiện hành.

`openid-client` được gắn vào Task #41 vì OAuth chưa implement. FCM Web + inbox thuộc Task #84
P5 và **không** được cài/triển khai trong Task #83.

## 0. Hiện trạng đo được

- Manifest/source chưa có `nodemailer`, `mjml`, `rate-limiter-flexible`, `nuxt-security`,
  `openid-client` hay `otpauth`.
- Email runtime hiện nằm trong `packages/shared`, trong khi `shared` chỉ được chứa
  type/schema/constant; adapter hiện local-only.
- Rate limiter hiện tự ghép Redis command, tạo client ở đường request và có key chứa identifier
  thô; contract mới yêu cầu singleton + HMAC key.
- Notification đang gộp logical event với delivery channel; schema mới tách hai bảng.
- Task #41 và #53 đã có dependency graph riêng; package OAuth/User-MFA phải đi theo task sở hữu,
  không tạo implementation cạnh tranh ở đây.

## 1. Quyết định đã chốt

### D-PKG-A — Email là SMTP, không SES SDK

Production dùng Nodemailer pool tới SES SMTP endpoint theo region, TLS bắt buộc. SMTP credential
khác AWS credential và phải được quản lý ngoài repo. Template MJML tĩnh trong repo, strict
validation, runtime chỉ nội suy biến typed đã escape và luôn có plain-text fallback.

Delivery semantics là at-least-once ở provider boundary. `jobId`, conditional claim và stable
`Message-ID` giảm duplicate nhưng không được quảng bá là exactly-once.

### D-PKG-B — Cache và rate limit có hai primitive khác nhau

`unstorage` tiếp tục làm cache. `rate-limiter-flexible` sở hữu counter/penalty/block trong
`packages/cache`, tái dùng singleton `ioredis`. Hai trục, trusted proxy, `Retry-After` và
fail-open/closed giữ nguyên contract.

### D-PKG-C — `nuxt-security` không sở hữu auth policy

Module khai trực tiếp ở `apps/web` và `apps/admin`. Chỉ bật CSP/header/CORS/request-size;
`rateLimiter` và `csrf` của module tắt để domain không có hai owner.

### D-PKG-D — Auth adapter tách sang Task #85, crypto/protocol primitive dùng package

Task #83 không đổi auth adapter. TOTP hiện hành chuyển sang adapter `otpauth`; OAuth P1 dùng
`openid-client` ở Task #41. [`Task #85`](85-nuxt-auth-utils-migration-plan.md) thay adapter sau
đó và phải giữ nguyên hai primitive này. Cấm tự viết Base32/HOTP/TOTP hoặc OAuth/OIDC primitive.

### D-PKG-E — FCM deferred

Không thêm Firebase dependency, service worker hay endpoint schema trong Task #83. Task #84 chỉ
bắt đầu sau checkpoint cuối của #83 và phase gate P5.

## 2. Đồ thị phụ thuộc

```text
T0 catalog + RED dependency guards
 ├──→ T1 notification schema + package boundary
 │      ├──→ T2 typed MJML renderer
 │      └──→ T3 Nodemailer SES SMTP + worker claim
 │                    └──→ T4 SES→SNS verified events
 ├──→ T5 rate-limiter-flexible adapter
 │                    └──→ T6 route integration + trusted IP/HMAC keys
 ├──→ T7 nuxt-security web/admin
 └──→ T8 OTPAuth adapter + Manager negative tests

T4 + T6 + T7 + T8 ──→ T9 evidence/promote
T9 ──→ Task #84 được phép bắt đầu khi P5 mở
```

T2, T5, T7 và T8 có thể chạy song song sau T0. T3 cần schema/interface T1; T4 cần provider id
từ T3. Mỗi checkpoint vùng auth/schema/email phải có human review trước merge.

## 3. Task triển khai

### T0 — Pin catalog và viết gate âm

**Tiêu chí nghiệm thu**

- [ ] Catalog pin `nodemailer ^9.0`, `mjml ^5.4`, `rate-limiter-flexible ^11.2`,
      `nuxt-security ^2.6`, `otpauth ^9.5`, `openid-client ^6.8`.
- [ ] Chỉ Task #83 cài năm package immediate; `openid-client` chỉ được consume ở #41 và Firebase
      không có trong manifest/lockfile.
- [ ] Dependency-cruiser đỏ khi app import Nodemailer/MJML/rate-limiter/OTPAuth trực tiếp.
- [ ] Test âm đỏ cho Redis client theo request, `script-src 'unsafe-inline'`, limiter/CSRF thứ hai và
      Base32/HOTP/TOTP tự viết.

**Kiểm chứng:** targeted guard tests đỏ trước code, sau đó `pnpm lint:deps` xanh.

**Bề mặt dự kiến:** root catalog · package manifests · dependency rules · guard tests.

**Phụ thuộc:** human review contract · **Cỡ:** M.

### T1 — Tách logical notification và delivery

**Tiêu chí nghiệm thu**

- [ ] Tạo `packages/notification`; runtime email rời `packages/shared`, shared chỉ còn type/schema.
- [ ] Schema/migration local tạo `notification_deliveries`, backfill channel/status/provider id từ
      hàng cũ, đối chiếu count trước khi bỏ cột cũ.
- [ ] Producer ghi notification + delivery trong cùng transaction; unique active
      `(notification_id, channel)` và orphan tests xanh.
- [ ] Không tạo `notification_reads` hoặc `notification_endpoints` của Task #84.

**Kiểm chứng:** migration up/down local + integration `BR-NOT-04/09/12`.

**Bề mặt dự kiến:** notification package contract · ops schema · một migration · migration test ·
notification integration test.

**Phụ thuộc:** T0 · **Cỡ:** M.

### T2 — Typed MJML renderer

**Tiêu chí nghiệm thu**

- [ ] Mỗi code trong 11-code registry ánh xạ tới template typed; thiếu biến/extra biến làm test đỏ.
- [ ] MJML strict validation xanh, HTML + plain text được sinh; mọi biến escape trước render.
- [ ] Gate cấm tracking pixel, remote script, token/secret snapshot và child PII ngoài allow-list.
- [ ] Template đổi không rewrite logical notification đã lưu.

**Kiểm chứng:** renderer unit/snapshot tests trên mọi template + negative injection cases.

**Bề mặt dự kiến:** renderer · template registry · templates · tests (tách PR theo nhóm template
nếu vượt 5 file).

**Phụ thuộc:** T0 · **Cỡ:** M mỗi lát.

### T3 — Nodemailer SES SMTP và worker idempotency

**Tiêu chí nghiệm thu**

- [ ] SMTP driver lazy-init pool, TLS verify, endpoint/port theo cấu hình server và không kết nối lúc import.
- [ ] Startup fail rõ khi thiếu credential production; secret không vào log/error/client bundle.
- [ ] Worker dùng `notification_delivery_id`, conditional claim và stable `Message-ID`.
- [ ] Success/retry/terminal failure cập nhật delivery đúng; test mô phỏng crash sau provider accept
      ghi rõ duplicate boundary thay vì exactly-once.

**Kiểm chứng:** fake SMTP integration + worker race/crash tests; không gọi SES thật.

**Bề mặt dự kiến:** SMTP driver · worker handler · config schema · integration tests.

**Phụ thuộc:** T1 + T2 · **Cỡ:** M.

### T4 — SES→SNS delivery/bounce/complaint

**Tiêu chí nghiệm thu**

- [ ] Webhook xác minh SNS signature, topic allow-list, timestamp, certificate URL AWS allow-list
      và message id trước mutation/fetch.
- [ ] Delivery/bounce/complaint idempotent theo SNS + SES message id; hard bounce/complaint cập nhật
      suppression policy đúng contract.
- [ ] Signature/topic/replay sai không đổi DB; payload/token/email đầy đủ không vào log.

**Kiểm chứng:** signed fixture dương + tampered/topic/replay negative tests.

**Bề mặt dự kiến:** system route · verifier adapter · delivery service · fixtures/tests.

**Phụ thuộc:** T3 · **Cỡ:** M.

### T5 — `rate-limiter-flexible` adapter

**Tiêu chí nghiệm thu**

- [ ] `packages/cache` export domain API, không export vendor instance/type.
- [ ] Singleton `ioredis`; không kết nối lúc import và không tăng connection theo request.
- [ ] Consume/penalty/block/reset và TTL dùng package primitive; không `INCR` + `EXPIRE` tự ghép.
- [ ] Valkey unavailable giữ đúng fail-open route thường/fail-closed auth + payment.

**Kiểm chứng:** Valkey integration, concurrency/TTL và outage matrix tests.

**Bề mặt dự kiến:** cache rate-limit adapter · client factory · adapter tests · outage tests.

**Phụ thuộc:** T0 · **Cỡ:** M.

### T6 — Tích hợp route, trusted IP và HMAC account key

**Tiêu chí nghiệm thu**

- [ ] Route classes giữ đúng bảng limit; cả IP + account áp cho route nhạy cảm.
- [ ] IP chỉ lấy qua trusted proxy config; XFF thô không đổi key.
- [ ] Pre-auth identifier normalize rồi HMAC; Redis key/log/metric không chứa email thô.
- [ ] 429 có `Retry-After`; message không lộ account tồn tại.

**Kiểm chứng:** distributed-IP/targeted-account/XFF spoof/PII scan tests.

**Bề mặt dự kiến:** route middleware · proxy config · key helper · API integration tests.

**Phụ thuộc:** T5 · **Cỡ:** M.

### T7 — `nuxt-security` cho web và admin

**Tiêu chí nghiệm thu**

- [ ] Hai app bật security headers, CSP nonce/strict-dynamic, CORS allow-list và request-size.
- [ ] Production `script-src` không `unsafe-inline`; script cần thiết có nonce/hash đã test.
- [ ] `rateLimiter` và `csrf` của module tắt; route vẫn dùng `packages/cache`/`packages/auth`.
- [ ] Public, auth, upload, admin và error response có header nhất quán; dev override không lọt prod.

**Kiểm chứng:** config tests + real-browser header/CSP/blocked-script/request-size cases.

**Bề mặt dự kiến:** web/admin Nuxt config · shared security config nếu cần · config/browser tests.

**Phụ thuộc:** T0 · **Cỡ:** M.

### T8 — Thay TOTP tự viết bằng OTPAuth

**Tiêu chí nghiệm thu**

- [ ] Adapter trong `packages/auth` dùng OTPAuth cho secret, URI và validate; không rò vendor type.
- [ ] Manager flow giữ SHA-1, 6 số, 30 giây, window ±1, lockout/rate-limit và encrypted secret.
- [ ] Vector RFC + clock drift + replay/lockout tests viết trước; cổng quét Base32/HMAC/TOTP tự viết xanh.
- [ ] JWT/refresh/CSRF và challenge semantics không đổi; auth adapter chỉ được thay trong Task #85.

**Kiểm chứng:** auth package tests + Manager auth E2E + security checklist human review.

**Bề mặt dự kiến:** auth MFA adapter · Manager auth integration · unit/integration tests.

**Phụ thuộc:** T0 · **Cỡ:** M.

### T9 — Evidence, cleanup và promote

**Tiêu chí nghiệm thu**

- [ ] Xoá runtime local email/rate/TOTP implementation sau khi parity tests xanh; không giữ fallback chết.
- [ ] [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md), architecture, data/schema,
      notification và rate-limit chỉ trở lại
      `implemented` khi evidence thật tồn tại.
- [ ] Task #41 nhận `openid-client`; Task #53 nhận OTPAuth User-MFA; Task #84 vẫn deferred.
- [ ] Human review diff auth/schema/email; không auto-merge, không migration ngoài local.

**Kiểm chứng:** `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts`; browser/E2E
targeted gates của T7/T8 xanh.

**Bề mặt dự kiến:** obsolete files · evidence/tests · spec status · progress manifest.

**Phụ thuộc:** T4 + T6 + T7 + T8 · **Cỡ:** M.

## 4. Definition of done

- Package pin và import boundary có ca âm.
- Contract public không rò type/provider SDK.
- SMTP/rate/auth/security có test failure, concurrency và secret/PII scan tương ứng.
- Migration chỉ chạy local, có backfill/count/rollback evidence.
- Full gate xanh; reviewer người phê duyệt vùng auth/schema/email.
- Không có Firebase dependency hay FCM implementation trong diff Task #83.

## 5. Rủi ro và rollback

| Rủi ro | Dấu hiệu | Giảm thiểu / rollback |
|---|---|---|
| SMTP accepted nhưng DB chưa commit | Duplicate hiếm sau crash | Stable Message-ID, conditional claim, metric duplicate; không hứa exactly-once |
| SES sandbox/region/credential sai | 535/timeout/backlog | Startup/config test, fake SMTP; rollback driver flag về local chỉ ở dev, production fail-closed |
| Limiter mới chặn nhầm | Tăng 429/auth 503 | Shadow metric trước cutover, giữ route-class table, rollback adapter sau domain interface |
| CSP làm vỡ Nuxt/hydration | Browser console violation | Report-only trước enforce, real browser matrix, rollback policy config không gỡ module |
| OTP parity lệch | Manager không đăng nhập | RFC/current-secret vector tests, feature cutover atomic, rollback adapter sau cùng interface |
| Migration notification lệch count | Mất lịch sử delivery | Backfill + count gate, backup local, dừng trước drop cột |

## 6. Nguồn chính thức dùng để chốt package

- Nodemailer SMTP/pooling: <https://nodemailer.com/smtp>, <https://nodemailer.com/smtp/pooled>
- AWS SES SMTP credential/TLS và SNS event: <https://docs.aws.amazon.com/ses/latest/dg/smtp-connect.html>,
  <https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html>,
  <https://docs.aws.amazon.com/ses/latest/dg/configure-sns-notifications.html>
- SNS signature verification: <https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html>
- OTPAuth: <https://github.com/hectorm/otpauth>
- openid-client: <https://github.com/panva/openid-client>
- rate-limiter-flexible: <https://github.com/animir/node-rate-limiter-flexible>
- nuxt-security: <https://nuxt-security.vercel.app/>

## 7. Ngoài phạm vi

FCM Web/inbox implementation, đổi auth adapter/session projection của Task #85, thay BullMQ/Drizzle/Valkey,
marketing email, provider deploy/production credential, production migration, auto-merge.
