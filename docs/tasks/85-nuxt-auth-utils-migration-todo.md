# Checklist — Task #85: Opaque cookie session trên Redis

> Kế hoạch: [`85-nuxt-auth-utils-migration-plan.md`](85-nuxt-auth-utils-migration-plan.md).
> Không implement trước khi spec diff và kế hoạch được human security review.

## Preflight

- [x] Human approve `BR-AUT-25` đến `BR-AUT-38` và D-SES-A đến D-SES-G.
- [x] Task #83 đạt checkpoint package liên quan; giữ nguyên thay đổi ngoài Task #85.
- [x] Xác nhận `nuxt-auth-utils >=0.5.30`, `ioredis ^5.11`, Valkey 9.
- [x] Inventory mọi JWT/JWS, `jose`, refresh route/cookie, Sidebase và Manager origin hoàn tất.
- [x] Tạo nhánh riêng; không đọc/ghi `.env`.

## T0–T2 — Foundation

- [x] RED tests cho JWT/`jose`/refresh legacy, challenge 5 phút, 1h/365d, reuse, outage và cross-namespace.
- [x] Session token và từng thành phần remember selector/verifier đều 256-bit; Redis không giữ raw credential.
- [x] Stable family selector phân biệt replay verifier cũ; selector miss không revoke account.
- [x] Versioned keyspace + client riêng fail-closed + Lua/transaction atomic.
- [x] Concurrent restore chỉ một success; reuse revoke-all.
- [x] Schema có `session_version`, device metadata, không token hash/reauth authority.
- [x] Migration chỉ chạy local; PG không phục hồi auth.

## T3–T5 — Web cutover

- [x] Locator cookie host-only, TTL 3600, `server-first`, secret riêng.
- [x] Sealed data chỉ có `secure.session_token`; projection hydrate từ Redis.
- [x] Login `rememberMe=false` mặc định; true mới tạo `tm_u_remember`.
- [x] Restore route rotate verifier + CSRF, giữ absolute expiry, đặt `reauthAt=null`; không auto-retry mutation.
- [x] Middleware resolve Redis một lần; guard sync, từ chối Bearer/Manager cookie.
- [x] Revoke device/logout/logout-all thu hồi Redis trước PG/cookie.
- [x] Redis outage 503; `/api/_auth/session` không trả stale identity/locator.

## Checkpoint Web

- [x] Login, 1h expiry, restore, one-year cutoff, revoke-device, logout-all E2E xanh.
- [x] Web không còn Sidebase/JWT/refresh runtime.
- [x] Human review entropy, Lua, CSRF, failure mode và cookie diff.

## T6–T7 — Admin cutover

- [x] Admin cookie/secret/keyspace riêng, TTL 3600, `client-only`.
- [x] Topology test chứng minh cookie finalise trên admin origin.
- [x] `rememberMe` + origin bind vào opaque MFA challenge 256-bit TTL 5 phút; consume nguyên tử,
      trước MFA không tạo credential/session và không JWT challenge.
- [x] MFA success mới tạo session/remember; restore không làm mới reauth.
- [x] Middleware/role guard sync, từ chối Bearer/User cookie.
- [x] Revoke/logout/logout-all Redis-first và audit đầy đủ.
- [x] Admin SPA không nháy authenticated state sai khi expiry/restore.

## Checkpoint Admin

- [x] Manager MFA, remember, expiry, reload, revoke và logout-all E2E xanh.
- [x] User/Manager không dùng chéo cookie, secret, keyspace hoặc device id.
- [x] Human review origin, MFA, role freshness, reauth và revoke-all.

## T8–T9 — Cleanup và durability

- [x] Xoá Sidebase khỏi catalog/manifest/config/lockfile.
- [x] Xoá mọi JWT creator/verifier/challenge, `RefreshService`, refresh routes/cookies và route session legacy.
- [x] Xoá `jose` khỏi package/catalog/lockfile; toàn repo không direct import/dependency hoặc Bearer auth.
- [x] Auth Valkey bật AOF + `noeviction`; health/alert phân biệt auth và cache.
- [x] Outage drill chứng minh 503/no fallback; runbook ghi mất Redis = logout.
- [x] Log/audit/PG/response không chứa raw credential.
- [x] Task #16, #23 và #25 giữ nguyên như hồ sơ lịch sử; Task #85 là contract supersede.

## T10 — Evidence

- [x] Mỗi `BR-AUT-25` đến `BR-AUT-38` có evidence.
- [x] `pnpm --filter @mindkid/auth test` xanh.
- [x] `pnpm --filter @mindkid/db test` xanh.
- [x] `pnpm --filter @mindkid/web test` xanh.
- [x] `pnpm --filter @mindkid/admin test` xanh.
- [x] `pnpm test:e2e` xanh.
- [x] `pnpm lint:specs` xanh.
- [x] `pnpm check && pnpm test && pnpm check:progress` xanh.
- [x] Chỉ sau evidence, auth/login/admin specs trở lại `implemented`.
- [x] Human security review; không auto-merge/deploy/migration ngoài local.

## Điều kiện dừng

- [ ] Session sliding, remember kéo dài quá mốc tuyệt đối hoặc token entropy dưới 256 bit.
- [ ] Redis outage fallback file/memory/PG/JWT hoặc auth đi qua cache fail-open.
- [ ] Concurrent restore có hơn một success hoặc reuse không revoke-all.
- [ ] Raw token xuất hiện trong response/log/PG/client state.
- [ ] Manager nhận remember trước MFA hoặc cookie không finalise đúng admin origin.
- [ ] Revoke device không có hiệu lực ở request kế tiếp.
