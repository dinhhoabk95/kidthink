# Task #164 Checklist — CTA theo bậc truy cập và xích chuyền auth

## S0 — Spec
- [x] S0.1: `game-detail-public.md` §7 bảng từ vựng CTA, §8 thêm `cta`, `BR-GDP-09`, §9 scenario
- [x] S0.2: `game-catalog-public.md` §4/§5 CTA theo bậc, `BR-GCP-09`, §8 `items[].cta`
- [x] S0.3: `access-gating.md` §7.1 ghi chú tách CTA khỏi mã HTTP, `BR-GAT-09`, §9 scenario
- [x] S0.4: `play-entry-and-profile-select.md` §5 `/me/children/create` + hàng `redirect`
- [x] S0.5: `login-and-session.md` §3 `/login`, sửa `BR-LGN-08` và `BR-LGN-11`, thêm `BR-LGN-12`, §7.2, §9
- [x] S0.6: `registration.md` §3 `/register`
- [x] S0.7: `social-login.md` `/login` `/register` `/register/consent`

## S1 — Nguyên nhân gốc
- [x] S1.1: `me/index.vue` gọi `POST /api/users/children/{uuid}/activate` bằng uuid, bỏ ghi cookie trực tiếp
- [x] S1.2: `packages/auth/src/contracts.ts:9` bỏ `active_child_id?: number`
- [x] S1.3: `auth-runtime.ts` bỏ nhánh fallback `event.context`

## S2 — Một nguồn sự thật CTA
- [x] S2.1: `packages/shared/src/access-cta.ts` + export qua `.` và `./client`
- [x] S2.2: `canAccessTier` KHÔNG xoá — có 9 call site thật; nhánh `login` lệch spec, tách task riêng

## S3 — Server phát `cta`
- [x] S3.1: `guest/levels/index.get.ts` CTA góc nhìn guest, bỏ nhận diện session
- [x] S3.2: `guest/levels/[code]/index.get.ts` thay `computeLevelCta` bằng `resolveLevelCta`
- [x] S3.3: `GET /api/users/access-context`
- [x] S3.4: `users/levels/index.get.ts:10` dùng `resolveUserActiveEntitlements`
- [x] S3.5: `buildTierLockedResponse` suy `upgrade_package_codes` từ `PACKAGE_CATALOG`

## S4 — Trang hồ sơ bé
- [x] S4.1: `app/pages/me/children/index.vue` (lọc `status active`, honor `redirect`)
- [x] S4.2: Modal Parent Gate gọi `POST /api/users/parent-gate/verify`
- [x] S4.3: `app/pages/me/children/create.vue`
- [x] S4.4: `me/index.vue:81,134` trỏ đúng `/me/children/create`

## S5 — Tách trang auth
- [x] S5.1: Chuyển `sanitizeReturnTo` sang `packages/shared/src/redirect.ts`, `packages/auth` re-export
- [x] S5.2: `login.vue` bỏ tab đăng ký, dùng `sanitizeReturnTo`, `rememberMe` mặc định false
- [x] S5.3: `login.vue` thêm bước MFA cho 428 `MFA_REQUIRED`
- [x] S5.4: `login.vue` nhánh `/consent-required` và `pending_verification`
- [x] S5.5: `login.vue` nút social login
- [x] S5.6: `register.vue` mới
- [x] S5.7: Xích chuyền sau đăng nhập qua `/me/children?redirect=`

## S6 — Giao diện
- [x] S6.1: `games/index.vue` hai pha SSR + hydrate
- [x] S6.2: `games/[code].vue` dùng `cta.href`, bỏ mã hardcode, bỏ heuristic 410
- [x] S6.3: `play/[code].vue` xử lý 401 và 410, đọc `code` từ body chuẩn
- [x] S6.4: `public-navbar.vue` và `landing-hero.vue` trỏ `/play/{code}` từ `FEATURED_GUEST_LEVELS`

## S7 — Middleware
- [x] S7.1: `user-auth.ts` giữ đích đến qua `redirect`
- [x] S7.2: Mở rộng phạm vi canh sang `/me/**`

## Kiểm thử
- [x] T.1: `packages/shared/tests/access-cta.test.ts` 20 ô
- [x] T.2: `apps/web/tests/api/guest-levels-catalog.test.ts`
- [x] T.3: `apps/web/tests/api/guest-level-detail-cta.test.ts`
- [x] T.4: `apps/web/tests/api/users-levels-entitlements.test.ts`
- [x] T.5: `apps/web/tests/gates/active-child-cookie-format.ts` kèm fixture ca âm
- [x] T.6: `pnpm lint` · `pnpm lint:deps` · `pnpm typecheck` · `pnpm test` xanh
