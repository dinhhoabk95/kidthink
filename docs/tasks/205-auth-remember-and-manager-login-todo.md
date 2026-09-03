# Task #205 — Auth Remember-Me Auto Refresh & Manager Login MFA Decoupling Checklist

- [x] 1. Update `packages/auth/src/redis-session-store.ts` with grace-period rotation for remember-me
- [x] 2. Update `packages/auth/tests/opaque-session-foundation.test.ts` to test grace period and rotation
- [x] 3. Fix remember cookie path and maxAge in `apps/web/server/utils/auth-runtime.ts` and `admin-auth-runtime.ts`
- [x] 4. Update manager login handler `apps/web/server/api/guest/auth/managers/login.post.ts` to allow direct login when `mfaEnabled === false`
- [x] 5. Update admin login page `apps/admin/app/pages/login.vue` to handle direct login success
- [x] 6. Implement transparent session auto-restore in `apps/web/server/middleware/auth.ts`
- [x] 7. Update tests in `apps/web/tests/api/guest/manager-auth.test.ts` and middleware tests
- [x] 8. Verify all tests and `pnpm check` pass exit 0
