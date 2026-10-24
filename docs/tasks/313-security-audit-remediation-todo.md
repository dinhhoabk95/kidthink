# Task #313 Todo: Khắc phục toàn diện lỗ hổng Kiểm toán Bảo mật (Security Audit Remediation)

Plan: [`313-security-audit-remediation-plan.md`](313-security-audit-remediation-plan.md).

---

## S1 — Chặn tự mở khoá tài khoản `suspended`, thu hồi phiên khi xoá, và hoàn thiện `hardPurgeUser` (`[C-01]`, `[H-03]`, `[H-08]`)
- [x] Test đỏ: user `suspended` / `active` gọi `POST /api/users/account/delete/cancel` bị từ chối `409`; user `suspended` / `deleted` gọi `POST /api/guest/auth/users/verify-email` bị từ chối
- [x] Test đỏ: `POST /api/users/account/delete` thu hồi toàn bộ phiên Redis (`revokeAllUserSessions`) và xoá cookie phiên/remember
- [x] Test đỏ: `cancelUserDeletion` chỉ khôi phục `users` đang `deleted` + `child_profiles` đang `pending_deletion`; `hardPurgeUser` xoá `social_identities`, ẩn danh PII trên `users` và đặt `purge_at = null` (`BR-ADL-09`, `BR-ADL-10`)
- [x] Triển khai fix tại `packages/db/src/purge.ts`, `cancel.post.ts`, `delete.post.ts`, `verify-email.post.ts`
- [x] Chạy vitest & typecheck xanh cho S1

## S2 — Chặn lạm dụng `soft_unlock`, bỏ tài khoản ngân hàng giả fallback, và sửa clobber `manual_grant` (`[C-02]`, `[H-09]`, `[H-11]`)
- [x] Test đỏ & fix `POST /api/users/orders/[uuid]/proof` (`pending_proof` transition, kiểm `expiresAt`, chống lặp `soft_unlock` vô hạn, `.for("update")`, `writeAudit`)
- [x] Test đỏ & fix `POST /api/users/orders` (xoá fallback tài khoản ngân hàng giả `1234567890`, fail-closed `503`, `writeAudit`)
- [x] Test đỏ & fix `payment-jobs.ts` (không ghi đè `manual_grant`) và `pdf-export.ts` (bỏ default entitlements fail-open)

## S3 — Rate Limiting 2 trục, `MfaAttemptGuard` cho Manager/User, Reauth TOTP/Social & Session Revocation (`[H-01]`, `[H-02]`, `[H-04]`, `[M-01..M-06]`, `[L-02..L-04]`)
- [ ] Test đỏ & fix `rate-limit-routes.ts` + `token-bucket.ts` (phân loại `/api/users/{password,mfa/*,account/delete*,parent-gate/*}`, bỏ hardcode salt)
- [ ] Test đỏ & fix `managers/mfa.post.ts`, `users/mfa/*`, `oauth/[provider]/callback.get.ts` (`completeMfaChallenge` + atomic `MfaAttemptGuard` + cookie `tm_u_csrf`/`tm_u_remember`)
- [ ] Test đỏ & fix `reauth.post.ts` (hỗ trợ `totp` & `social`) + gắn `requireReauth` trên các route đặc quyền `super_admin`
- [ ] Test đỏ & fix `logout.post.ts` (chỉ thu hồi thiết bị hiện tại) + grace window cho `previousVerifierHash`

## S4 — Access Ladder, Guest Allowlist (`BR-LAD-07`), Curriculum Visibility & Daily Play Cap (`[H-10]`, `[M-11]`, `[L-01]`)
- [ ] Test đỏ & fix `access-ladder.ts` + `guest/levels/[code]/config.get.ts` (`isGuestAllowedLevel` & `active_child_id` cho bậc `login`)
- [ ] Test đỏ & fix `guest/curricula/[code].get.ts` (chỉ trả `status === "published"`) & `isExemptFromDailyPlayCap` (kiểm lesson thật trong DB)
- [ ] Test đỏ & fix `custom-games/[uuid]/index.patch.ts`, `lesson-plan.ts`, `ai-assistant.ts`

## S5 — Database Least Privilege (`mindkid_app`), FK Retention & Audit Array Scrubbing (`[H-05]`, `[H-06]`, `[H-07]`, `[M-08]`)
- [ ] Test đỏ & fix `assertCleanAuditPayload` đệ quy qua phần tử mảng trong `packages/audit`
- [ ] Migration đổi FK `consent_logs`, `payment_orders`, `ai_credit_ledger` sang `onDelete: "restrict"` & `REVOKE TRUNCATE` trong `migrate.ts`
- [ ] Chuyển các điểm gọi runtime từ `getOwnerDb()` sang `getDb()` (`mindkid_app`)

## S6 — Frontend Security, Storage Validation, Infra CSP & Dependency Upgrades (`[M-07]`, `[M-09]`, `[M-10]`, `[M-12]`, `[L-05..L-07]`)
- [ ] Test đỏ & fix `consent-required.vue` (`sanitizeRedirectTarget`), `preview-sandbox.vue` (`postMessage` origin), `parent-gate-modal.vue`
- [ ] Test đỏ & fix `packages/storage` (`uploadPublicAudio` path sanitization, image/audio header validation) & `managers/{audit-logs,orders,users}`
- [ ] Cập nhật CSP `mindkid-admin.conf.tmpl` + `apps/web/nuxt.config.ts`, `docker-compose.yml`, gỡ `jose` và nâng cấp các dependency có CVE
