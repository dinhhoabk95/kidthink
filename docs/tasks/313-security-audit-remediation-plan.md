# Kế hoạch Task #313: Khắc phục toàn diện lỗ hổng Kiểm toán Bảo mật (Security Audit Remediation)

Contract:
- `docs/specs/03-account/account-deletion.md` (`BR-ADL-01..10`)
- `docs/specs/00-foundation/payment-flow.md` (`BR-PAY-01..11`) & `docs/specs/03-account/payment-proof-upload.md` (`BR-PPU-01..08`)
- `docs/specs/01-platform/auth-tokens-sessions.md` (`BR-AUT-13..36`) & `docs/specs/01-platform/rate-limiting.md` (`BR-RTL-01..11`)
- `docs/specs/00-foundation/access-ladder.md` (`BR-LAD-01..07`) & `docs/specs/00-foundation/child-data-compliance.md` (`BR-CDC-01..10`)
- `docs/specs/01-platform/audit-logging.md` (`BR-AUD-01..08`) & `docs/specs/01-platform/image-storage.md`

---

## 1. Bối cảnh & Mục tiêu

Đợt kiểm toán bảo mật toàn dự án (`/security-review`) đã phát hiện **2 lỗi Critical, 11 lỗi High, 12 lỗi Medium, và 8 lỗi Low/Dependency**. Kế hoạch này chia việc khắc phục thành 6 lát cắt dọc (S1–S6) độc lập, kiểm chứng bằng TDD (`RED → GREEN → REFACTOR`) theo đúng thứ tự mức độ nghiêm trọng.

---

## 2. Lát cắt dọc (Vertical Slices)

### S1 — Chặn tự mở khoá tài khoản `suspended`, thu hồi phiên khi xoá, và hoàn thiện `hardPurgeUser` (`[C-01]`, `[H-03]`, `[H-08]`)
- **Mục tiêu:**
  1. `POST /api/users/account/delete/cancel` (`cancel.post.ts`): chỉ cho phép huỷ xoá khi `account.status === "deleted"` (trả `409` nếu `account.status !== "deleted"`, chặn user `suspended` hoặc `pending_verification` lợi dụng endpoint để tự kích hoạt lên `active`).
  2. `cancelUserDeletion` (`packages/db/src/purge.ts`): chỉ cập nhật `users` có `status = "deleted"` và chỉ khôi phục `child_profiles` có `status = "pending_deletion"` (giữ nguyên các hồ sơ trẻ đã `archived` trước đó).
  3. `POST /api/guest/auth/users/verify-email` (`verify-email.post.ts`): chỉ kích hoạt `status = "active"` khi `user.status === "pending_verification"` (hoặc idempotent khi đã `active`); từ chối nếu tài khoản đang `suspended` hoặc `deleted`.
  4. `POST /api/users/account/delete` (`delete.post.ts`): gọi `revokeAllUserSessions(userId)`, `clearUserSession(event)`, `clearUserRememberCookie(event)` để thu hồi toàn bộ phiên Redis, cập nhật `active_sessions.revoked_at` và xoá cookie ngay lập tức (`BR-ADL-01`).
  5. `hardPurgeUser` (`packages/db/src/purge.ts`): ngoài ẩn danh `telemetry_events` và xoá `child_profiles`, thực hiện xoá cứng `social_identities` (`BR-ADL-10`), `active_sessions`, `verification_tokens`, `mfa_settings`, `mfa_recovery_codes`, `notifications`, và ẩn danh dòng `users` (`email = 'deleted+' + uuid + '@deleted.mindkid.local'`, `displayName = 'Đã xoá'`, `passwordHash = null`, `purgeAt = null`) để giải phóng email đăng ký lại (`BR-ADL-09`) và chấm dứt lỗi lặp vô hạn trên 200 user đầu tiên ở job `account:purge`.
- **Kiểm thử (TDD):**
  - Unit/API test đỏ cho `cancel.post.ts` (user `suspended` gọi cancel → bị chặn 409, không gọi `cancelUserDeletion`), `verify-email.post.ts` (user `suspended`/`deleted` dùng token cũ → bị chặn), `delete.post.ts` (gọi `revokeAllUserSessions` + `clearUserSession` + `clearUserRememberCookie`), và `purge-schedule.test.ts` / `purge.test.ts` (kiểm tra `hardPurgeUser` xoá `social_identities`, ẩn danh `users` và đặt `purgeAt = null`).

### S2 — Chặn lạm dụng `soft_unlock`, bỏ tài khoản ngân hàng giả fallback, và sửa clobber `manual_grant` (`[C-02]`, `[H-09]`, `[H-11]`)
- **Mục tiêu:**
  1. `POST /api/users/orders/[uuid]/proof` (`proof.post.ts`): sửa `isFirstSubmission` nhận cả `"pending"` và `"pending_proof"`, chặn đơn đã quá `expiresAt`, không cấp lại `soft_unlock` nếu user đã có entitlement `cancelled`/`expired` từ đơn `soft_unlock` hoặc đơn bị `rejected` cho cùng gói, khoá hàng `.for("update")`, ghi `writeAudit`.
  2. `POST /api/users/orders` (`orders/index.post.ts`): xoá khối fallback số tài khoản Techcombank giả `1234567890`; nếu thiếu cấu hình VietQR thì fail-closed `503 SERVICE_UNAVAILABLE`, ghi `writeAudit`.
  3. `apps/worker/src/services/payment-jobs.ts` & `packages/export/src/pdf-export.ts`: lọc `entitlementKey` theo gói và loại trừ `source = "manual_grant"` khi gia hạn/dunning; bỏ default entitlements fail-open trong `requestExportJob`.

### S3 — Rate Limiting 2 trục, `MfaAttemptGuard` cho Manager/User, Reauth TOTP/Social & Session Revocation (`[H-01]`, `[H-02]`, `[H-04]`, `[M-01..M-06]`, `[L-02..L-04]`)
- **Mục tiêu:**
  1. `packages/shared/src/rate-limit-routes.ts` & `packages/cache/src/token-bucket.ts`: phân loại rate-limit cho `/api/users/password`, `/api/users/mfa/*`, `/api/users/account/delete*`, `/api/users/parent-gate/*`; dùng secret từ env thay cho `"tinimath_ratelimit_salt"`.
  2. `managers/mfa.post.ts` & `users/mfa/*`: dùng `completeMfaChallenge` + `MfaAttemptGuard` (atomic `INCR` + `EXPIRE`); gắn `setUserRememberCookie` + `ensureUserCsrfCookie` tại `users/mfa.post.ts`; sửa `oauth/[provider]/callback.get.ts` phát hành `mfa_challenge` thay vì lộ `user.id`.
  3. `users/auth/reauth.post.ts`, `managers/auth/reauth.post.ts` & các route `super_admin`: hỗ trợ `totp` và `social`, gắn `requireReauth(event)` cho các thao tác đặc quyền của `super_admin`.
  4. `logout.post.ts` & `redis-session-store.ts`: đăng xuất đơn thiết bị chỉ thu hồi thiết bị hiện tại; bổ sung grace window cho `previousVerifierHash` chống race condition khi restore remember token.

### S4 — Access Ladder, Guest Allowlist (`BR-LAD-07`), Curriculum Visibility & Daily Play Cap (`[H-10]`, `[M-11]`, `[L-01]`)
- **Mục tiêu:**
  1. `packages/shared/src/access-ladder.ts` & `guest/levels/[code]/config.get.ts`: kiểm tra `isGuestAllowedLevel` cho Guest và `active_child_id` cho bậc `login`.
  2. `guest/curricula/[code].get.ts`: chỉ trả về `status === "published"`.
  3. `game-config-runtime.ts`: xác thực `lesson` hợp lệ trong DB trước khi miễn trừ `DAILY_PLAY_CAP_REACHED`.
  4. `custom-games/[uuid]/index.patch.ts`, `lesson-plan.ts`, `ai-assistant.ts`: kiểm tra quyền `"create_custom_game"` và xoá default entitlements fail-open.

### S5 — Database Least Privilege (`mindkid_app`), FK Retention & Audit Array Scrubbing (`[H-05]`, `[H-06]`, `[H-07]`, `[M-08]`)
- **Mục tiêu:**
  1. `packages/db/scripts/migrate.ts` & migration mới: `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE consent_logs, audit_logs FROM mindkid_app`, bỏ mật khẩu hardcode; đổi FK của `consent_logs`, `payment_orders`, `ai_credit_ledger` sang `onDelete: "restrict"`.
  2. Chuyển runtime từ `getOwnerDb()` sang `getDb()` (`mindkid_app`).
  3. `packages/audit/src/index.ts`: đệ quy duyệt mảng trong `assertCleanAuditPayload`.

### S6 — Frontend Security, Storage Validation, Infra CSP & Dependency Upgrades (`[M-07]`, `[M-09]`, `[M-10]`, `[M-12]`, `[L-05..L-07]`)
- **Mục tiêu:**
  1. `consent-required.vue`, `preview-sandbox.vue`, `parent-gate-modal.vue`: dùng `sanitizeRedirectTarget`, kiểm tra protocol `origin` trong `postMessage`, bỏ fallback client khi `!props.clientOnly`.
  2. `packages/storage/src/index.ts` & `managers/{images,audio,audit-logs,orders,users}`: gọi `sanitizeRelativeStoragePath` trong `uploadPublicAudio`, không tin `declaredWidth`/`declaredDurationMs` từ client, dùng `readJsonBodyWithLimit`, thêm Zod cho `audit-logs`.
  3. `infra/nginx/mindkid-admin.conf.tmpl`, `apps/web/nuxt.config.ts`, `docker-compose.yml`, `pnpm-workspace.yaml`: thêm CSP cho Admin SPA, siết `script-src`, bind `127.0.0.1` cho Postgres/Valkey dev, gỡ `jose`, nâng cấp các gói có CVE (`nodemailer`, `@vue/server-renderer`, `prosemirror-view`, `vite`, `@tiptap/core`).
