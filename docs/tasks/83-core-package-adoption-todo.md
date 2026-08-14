# Checklist — Task #83: Adopt package core và hardening P0

> Plan: [`83-core-package-adoption-plan.md`](83-core-package-adoption-plan.md).
> Task #22 là lịch sử hoàn tất; không sửa/tick lại.
> FCM Web + inbox thuộc Task #84 và không được cài ở đây.

## Preflight

- [x] Contract ghi SMTP SES, package boundaries và FCM deferred; auth adapter được tách sang Task #85.
- [x] Task #41 nhận `openid-client`; Task #53 nhận `otpauth` cho User-MFA.
- [x] `pnpm lint:specs` xanh sau contract update (133 specs, 15 checks, 0 lỗi).
- [ ] Human review spec diff và chấp nhận demote các spec chưa khớp code về `approved`.
- [ ] Tạo nhánh riêng; không đụng thay đổi ngoài Task #83.

## T0 — Catalog và gate âm

- [x] Pin Nodemailer/MJML/rate-limiter/nuxt-security/OTPAuth/openid-client đúng plan.
- [x] Chỉ năm package immediate được cài trong #83; không Firebase, chưa consume openid-client.
- [x] Import vendor trực tiếp từ app làm `lint:deps` đỏ.
- [x] Gate âm Redis-per-request, `script-src 'unsafe-inline'`, limiter/CSRF trùng và TOTP tự viết đỏ.

## T1–T4 — Notification email

- [x] Tạo `packages/notification`; runtime email rời `packages/shared`.
- [x] Migration local tách `notifications` + `notification_deliveries`, backfill/count/rollback xanh.
- [x] Không tạo `notification_reads`/`notification_endpoints`.
- [x] Typed MJML strict + escaped variables + plain text; no tracking/remote script/child PII.
- [x] Nodemailer SES SMTP lazy pool, TLS verify, credential ngoài repo.
- [x] Worker claim theo delivery id + stable Message-ID; retry/crash boundary tests xanh.
- [x] SES→SNS signature/topic/timestamp/certificate-URL allow-list/replay verification xanh.
- [x] Bounce/complaint/delivery state idempotent; tampered event không mutation.

## Checkpoint A — Email/schema

- [x] Migration count khớp và chỉ chạy local.
- [x] Fake SMTP happy/failure/crash paths xanh; không gọi SES thật.
- [x] Human review schema, outbound payload, secret handling và at-least-once wording.

## T5–T6 — Rate limit

- [x] `packages/cache` bọc `rate-limiter-flexible`, không export vendor type/instance.
- [x] Singleton ioredis; connection count không tăng theo request.
- [x] Không `INCR` + `EXPIRE` tự ghép; concurrency/TTL/outage tests xanh.
- [x] Hai trục/route table/Retry-After/fail-open-closed giữ nguyên.
- [x] Trusted proxy chống XFF spoof; account key HMAC, không email thô trong key/log/metric.

## T7 — Nuxt security

- [x] Web + admin bật header/CSP/CORS/request-size.
- [x] Production `script-src` không unsafe-inline; nonce/strict-dynamic browser tests xanh.
- [x] Limiter + CSRF tích hợp tắt; domain middleware cũ vẫn chạy.
- [x] Public/auth/upload/admin/error header matrix xanh.

## T8 — OTPAuth

- [x] Chỉ auth MFA adapter import OTPAuth.
- [x] Secret/URI/validate parity SHA-1, 6 số, 30 giây, ±1.
- [x] RFC/drift/replay/lockout negative tests xanh.
- [x] Không Base32/HMAC/HOTP/TOTP tự viết.
- [x] JWT/refresh/CSRF/challenge contract không đổi; Task #83 không sửa auth adapter.
- [x] Human security review auth diff.

## T9 — Promote

- [x] Xoá local fallback chết sau parity; import guards xanh.
- [x] Không Firebase/service-worker/FCM endpoint trong diff.
- [x] Specs chỉ promote khi evidence thật tồn tại.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [x] Targeted browser/E2E email/rate/security/auth xanh.
- [x] Human review; không auto-merge, deploy, production credential hay migration ngoài local.

## Điều kiện dừng

- [ ] SMTP credential/provider access chưa sẵn → dùng fake SMTP, không tự đọc `.env` hay gọi production.
- [ ] Backfill count lệch → dừng trước drop cột.
- [ ] CSP report-only còn violation cần thiết → không chuyển enforce.
- [ ] OTP parity hoặc Manager E2E đỏ → không xoá implementation cũ.
