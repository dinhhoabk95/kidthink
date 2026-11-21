# Task #319 — Tích hợp toàn diện Better Auth vào MindKid v2

- **Trạng thái:** Completed
- **Ngày tạo:** 2026-11-21
- **Specs sở hữu:**
  - `docs/specs/01-platform/auth-tokens-sessions.md` (`BR-AUT-39`..`45`)
  - `docs/specs/01-platform/schema-identity-billing.md` (`BR-SIB-01`..`13`)
  - `docs/specs/00-foundation/actors.md` (`BR-ACT-01`, `BR-ACT-02`)
  - `docs/specs/00-foundation/business-rules.md` (§7.2, §7.3)
  - `docs/specs/03-account/login-and-session.md`, `social-login.md`, `mfa.md`, `account-settings.md`
  - `docs/specs/06-admin/admin-auth.md`

## 1. Mục tiêu

Chuyển đổi toàn bộ hệ thống xác thực MindKid v2 sang **Better Auth** (`better-auth`, `@better-auth/drizzle-adapter`, `@better-auth/passkey`) bọc trong package driver `@mindkid/auth` theo quyết định `D10` của `SPEC.md`, thay thế hoàn toàn `nuxt-auth-utils`, `openid-client`, `otpauth` và bộ route/store tự xây trước đây.

## 2. Quyết định kiến trúc cốt lõi

1. **Hai instance Better Auth độc lập (`userAuth` & `managerAuth`):**
   - `userAuth` mount tại `/api/auth/users/**` (`cookiePrefix: "mindkid-user"`, Redis prefix `ba:v1:user:*`, bảng `users` + `user_*`).
   - `managerAuth` mount tại `/api/auth/managers/**` (`cookiePrefix: "mindkid-manager"`, Redis prefix `ba:v1:manager:*`, bảng `managers` + `manager_*`, `disableSignUp: true`, không cấu hình SNS).
   - Hai khoá HMAC dẫn xuất tách biệt từ `NUXT_SESSION_PASSWORD` để cookie của hai bề mặt không bao giờ giải mã chéo được (`BR-ACT-01`, `BR-ACT-02`, `BR-SIB-01`).
2. **Bảo toàn bất biến bảo mật & pháp lý trẻ em:**
   - Băm mật khẩu bằng `argon2id` qua custom `emailAndPassword.password` (`BR-SIB-05`).
   - `secondaryStorage` trên Valkey/Redis chạy chế độ **fail-closed** (`503 SERVICE_UNAVAILABLE`, `BR-AUT-31`), kết hợp `storeSessionInDatabase: true` và `disableSessionRefresh: true` (`rememberMe=false` → 1 giờ, `rememberMe=true` → 365 ngày, `freshAge: 300` → 5 phút reauth).
   - `accountLinking: { enabled: true, disableImplicitLinking: true, allowDifferentEmails: true }` chặn chiếm đoạt tài khoản qua email trùng (`BR-SCL-04`), đồng thời cho phép User đã đăng nhập chủ động liên kết/gỡ liên kết SNS.
   - Bắt buộc bằng chứng đồng ý 2 checkbox Điều khoản & Quyền riêng tư (Luật 91/2025/QH15 & Nghị định 13/2023) trước khi tạo `users` qua cả Email và OAuth (`disableImplicitSignUp: true` + `/api/guest/auth/users/social-consent`).
   - Cấm lưu `access_token` / `refresh_token` / `id_token` của OAuth provider (`databaseHooks.account.{create,update}.before` xoá rỗng + domain validator `BR-SIB-10`, `BR-DM-14`).
3. **Năm nhóm tính năng đồng bộ:**
   - Email/Password + Email Verification + Password Reset
   - Google & Facebook OAuth + Account Linking (chỉ `userAuth`)
   - Two-Factor Authentication (`twoFactor`: TOTP + Backup Codes)
   - Passkey / WebAuthn (`@better-auth/passkey` cho cả User và Manager)
   - Quản lý phiên đa thiết bị (`listSessions`, `revokeSession`, `revokeOtherSessions`, `revokeSessions`) + Step-up Reauth 5 phút.
