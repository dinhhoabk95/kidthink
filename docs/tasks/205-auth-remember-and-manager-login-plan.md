# Task #205 — Auth Remember-Me Auto Refresh & Manager Login MFA Decoupling

> **Context & Spec Reference:**
> - `docs/specs/01-platform/auth-tokens-sessions.md` (Opaque Redis sessions, remember-me token lifecycle)
> - `docs/specs/00-foundation/actors.md` (User & Manager authentication models)
> - Rules: `.agents/rules/03-security.md`, `.agents/rules/06-database-auth.md`

---

## 1. Problem Statement

1. **User session auto-logout after 1h**:
   - `SESSION_TTL_SECONDS = 3600` (1 hour) is intended for Redis opaque session.
   - `remember_me` is configured for 365 days (`REMEMBER_MAX_TTL_SECONDS = 365 * 24 * 3600`), but remember cookie was restricted to `path: "/api/users/auth/restore"`, causing browsers never to send `tm_u_remember` during normal API requests.
   - `apps/web/server/middleware/auth.ts` did not implement transparent remember-me restoration (Laravel-style auto-refresh session). When the 1-hour session expired in Redis, all subsequent requests failed with 401 and logged the user out.

2. **Manager Login & MFA Coupling**:
   - Seeded managers have `mfaEnabled: false`.
   - `/api/guest/auth/managers/login` unconditionally returned `428 MFA_REQUIRED` and forced MFA enrollment before allowing any manager login.
   - Requirement: When `manager.mfaEnabled === false`, manager logs in directly with email + password (creating session, setting session cookie, recording audit & session, returning `status: "ok"`). MFA is optional/configured after login. If `manager.mfaEnabled === true`, return `428 MFA_REQUIRED` with TOTP challenge.

3. **Laravel-style Remember-Me Design**:
   - Remember cookie path set to `/` with 1-year maxAge (`365 * 24 * 3600`).
   - Auth middleware (`resolveUserSession` / `resolveManagerSession`) checks remember token upon session expiration, verifies selector + verifier, restores Redis session, rotates verifier, updates remember cookie, and allows the request to succeed transparently.
   - Concurrency grace period (60s) in `restoreRemember` to prevent race condition invalidations when multiple concurrent requests hit the server during session expiration.

---

## 2. Technical Design & File Changes

### A. `packages/auth/src/redis-session-store.ts`
- Update `RememberData` interface to support `previousVerifierHash` and `previousVerifierExpiresAt`.
- In `restoreRemember`:
  - If `verifierHash === rememberData.verifierHash`: rotate verifier, set `previousVerifierHash = rememberData.verifierHash`, `previousVerifierExpiresAt = now + 60000`.
  - If `verifierHash === rememberData.previousVerifierHash && now < rememberData.previousVerifierExpiresAt`: allow session restoration during grace window without revoking account.
  - If neither matches: trigger reuse detection and revoke account sessions.

### B. `apps/web/server/utils/auth-runtime.ts` & `admin-auth-runtime.ts`
- Fix `setUserRememberCookie`: `path: "/"`, `sameSite: "lax"`, `maxAge: 365 * 24 * 3600`.
- Fix `clearUserRememberCookie`: `path: "/"`.
- Fix `setManagerRememberCookie`: `path: "/"`, `sameSite: "strict"`, `maxAge: 365 * 24 * 3600`.
- Fix `clearManagerRememberCookie`: `path: "/"`.

### C. `apps/web/server/api/guest/auth/managers/login.post.ts`
- Check `if (!manager.mfaEnabled)`:
  - Create session in Redis via `getBrowserSessionService().create(...)`.
  - Set manager session cookie via `setUserSession(event, { secure: { session_token } }, getManagerSessionConfig())`.
  - Set remember cookie if `rememberMe === true`.
  - Record Postgres session and audit log `manager_login`.
  - Return `{ status: "ok", manager: { id, email, display_name, role } }`.
- If `manager.mfaEnabled === true`:
  - Return `428 MFA_REQUIRED` with challenge token.

### D. `apps/admin/app/pages/login.vue`
- Update `handlePasswordLogin`:
  - When `res.status === "ok"`, immediately call `finishEnrollmentAndRedirect()` without prompting for MFA.
  - When `res.status === "MFA_REQUIRED"`: check `mfa_enabled` to show TOTP verification (`authState.value = 'mfa'`) or enrollment (`authState.value = 'enroll'`).

### E. `apps/web/server/middleware/auth.ts`
- In `resolveUserSession`:
  - If active session missing/expired, check `USER_REMEMBER_COOKIE` (`tm_u_remember`).
  - If token present, call `getBrowserSessionService().restore({ namespace: "user", rememberToken })`.
  - On success: refresh session cookie (`setUserSession`), update rotated remember cookie (`setUserRememberCookie`), return `restored.user`.
  - On failure: clear remember cookie (`clearUserRememberCookie`).
- In `resolveManagerSession`:
  - If manager session missing/expired, check `MANAGER_REMEMBER_COOKIE` (`tm_m_remember`).
  - If token present, call `getBrowserSessionService().restore({ namespace: "manager", rememberToken })`.
  - On success: refresh manager session cookie (`setUserSession`), update rotated remember cookie (`setManagerRememberCookie`), return `restored.manager`.
  - On failure: clear manager remember cookie (`clearManagerRememberCookie`).

---

## 3. Verification Plan
- Unit tests in `packages/auth/tests/` pass with grace period and rotation assertions.
- Web integration tests in `apps/web/tests/` verify manager login without MFA and auto-restore middleware.
- Admin tests in `apps/admin/tests/` pass.
- `pnpm check` passes clean.
