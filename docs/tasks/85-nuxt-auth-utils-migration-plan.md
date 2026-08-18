# Kế hoạch — Task #85: Opaque cookie session trên Redis

> Viết lại 2026-08-13 theo quyết định bỏ toàn bộ first-party JWT/JWS và dependency `jose`.
> Spec sở hữu: [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md).
> Schema: [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md).
> Package boundary: [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md).

## 1. Objective

Thay Sidebase và toàn bộ first-party JWT của cả `apps/web`/`apps/admin` bằng opaque credential:

- session làm việc tuyệt đối 1 giờ, payload authoritative ở Redis;
- `rememberMe` mặc định false; khi true dùng credential rotate-on-use, tuyệt đối tối đa 365 ngày;
- revoke từng thiết bị và revoke-all có hiệu lực ở request kế tiếp;
- Redis fail-closed, AOF + `noeviction`, không fallback file/memory/PostgreSQL/JWT;
- `nuxt-auth-utils >=0.5.30` chỉ cung cấp sealed locator, projection và composable;
- PostgreSQL `active_sessions` chỉ giữ metadata/audit thiết bị;
- MFA challenge là opaque one-time Redis credential TTL 5 phút;
- gỡ direct dependency/import `jose`; không còn service JWT contract hiện hành.

Thành công nghĩa là không còn Sidebase, first-party JWT/JWS, `jose`, `RefreshService`, refresh cookie/route hoặc
claim client-side; Web SSR, Admin SPA, MFA, remember restore và multi-device revoke đều có test
âm/dương, full gate xanh và human security review chấp nhận diff.

## 2. Kết quả nghiên cứu

### 2.1 Giới hạn của `nuxt-auth-utils`

`nuxt-auth-utils` gọi trực tiếp H3 `useSession`. `SessionConfig` của H3 có password, cookie,
maxAge, seal và generateId nhưng **không có storage adapter**; `updateSession()` seal toàn bộ
data vào cookie. Vì vậy không thể đạt “session lưu Redis” chỉ bằng đổi `nuxt.config`.

MindKid giữ module vì `useUserSession()`, type augmentation, SSR/SPA load strategy và
`/api/_auth/session`, nhưng sealed cookie chỉ chứa một opaque locator. `sessionHooks.fetch`
lookup Redis rồi hydrate safe projection. Không dùng Nitro `useStorage()` làm session store
ngầm vì module không nối vào mount đó và auth cần atomic rotate/revoke fail-closed.

### 2.2 Guardrail nguồn chính thức

- Pin `nuxt-auth-utils >=0.5.30` vì bản vá OAuth login CSRF.
- H3 session password cần secret CSPRNG ít nhất 32 byte; Web/Admin dùng secret khác nhau.
- `secure` bị loại khỏi response `/api/_auth/session`; locator đặt trong `secure.session_token`.
- Nuxt/Nitro có Redis storage mount, nhưng session authority dùng adapter domain trong
  `packages/auth` để kiểm soát digest, Lua, lỗi và keyspace.
- Module chỉ chạy với Nuxt server (`nuxt build`), phù hợp deployment hiện hành.

Nguồn:

- <https://nuxt.com/modules/auth-utils>
- <https://github.com/atinux/nuxt-auth-utils/releases/tag/v0.5.30>
- <https://github.com/atinux/nuxt-auth-utils/blob/main/src/runtime/server/utils/session.ts>
- <https://github.com/h3js/h3/blob/main/src/utils/session.ts>
- <https://nuxt.com/docs/3.x/directory-structure/server#server-storage>

## 3. Architecture decisions

### D-SES-A — Redis là authority duy nhất

Redis giữ session, remember family, device pointer, account-device set và generation. Cookie
chỉ giữ token ngẫu nhiên; PostgreSQL chỉ metadata/audit. Redis miss không được phục hồi từ DB.

### D-SES-B — Hai lifecycle tuyệt đối

Session TTL 3600 giây, không sliding. Remember credential có selector/verifier ngẫu nhiên:
selector family ổn định, verifier rotate mỗi restore. Expiry là `loginAt + 365 ngày` và giữ
nguyên qua rotation. Không chọn remember thì không có credential dài hạn.

### D-SES-C — Atomic trước, metadata sau

Create/restore/revoke dùng Lua hoặc transaction Redis nguyên tử, không `SCAN`. Revoke Redis
trước; PostgreSQL update idempotent sau. Nếu metadata update lỗi, auth vẫn an toàn và job/audit
có thể reconcile; thứ tự ngược lại tạo cửa sổ credential còn sống.

### D-SES-D — Fail closed và durability riêng

Auth adapter dùng client `ioredis` process-long riêng trong `packages/auth`, timeout hữu hạn,
AOF và `noeviction`; không đi qua `packages/cache` fail-open. Redis lỗi trả 503. Không file,
memory, PostgreSQL hoặc sealed-identity fallback.

### D-SES-E — Module chỉ làm projection

`replaceUserSession()` chỉ seal `secure.session_token`. `sessionHooks.fetch` hydrate safe user
từ Redis. Cấm tin `user` hoặc role đã seal, cấm direct `clear()`, OAuth/password/WebAuthn helper.

### D-SES-F — Không first-party JWT

User/Manager middleware từ chối `Authorization: Bearer`. Session, remember và MFA challenge
đều opaque, Redis-backed. Không có service JWT/`requireServiceAuth`; nhu cầu service auth tương
lai phải mở spec riêng trước khi chọn credential.

### D-SES-G — Manager origin và MFA

Manager session/remember cookie phải finalise trên admin origin. `rememberMe` bind vào MFA
challenge và chỉ cấp sau MFA success. Remember restore không cập nhật `reauthAt`.

## 4. Trust boundaries và abuse cases

| Biên | Tài sản | Abuse case | Control/test đầu tiên |
|---|---|---|---|
| Browser → login | Account/MFA | Client tự bật remember sau bước mật khẩu | Bind preference vào challenge; chỉ MFA callback đọc |
| Cookie → middleware | Session identity | Locator đoán được hoặc dùng chéo namespace | 256-bit CSPRNG, digest key, namespace keyspace |
| Remember → restore | Quyền một năm | Replay verifier cũ | Stable random family selector + atomic verifier rotate; reuse revoke-all |
| App → Redis | Toàn bộ online auth | Redis lỗi nhưng app fallback | 503 fail-closed test |
| Revoke Redis ↔ PG | Device state | Hai store lệch làm token sống lại | Redis authority; PG không phục hồi auth |
| Module projection | Safe user data | Sealed stale role tiếp tục được tin | Hydrate từ Redis; locator-only cookie |
| User ↔ Manager | Admin privilege | Cookie namespace này mở namespace kia | Cookie/secret/key prefix/guard tách |
| Password → MFA callback | Manager pre-auth | Self-contained challenge bị replay ngoài Redis | Opaque 256-bit challenge, digest store, TTL 5 phút, consume nguyên tử |

## 5. Tech stack và commands

| Mục | Contract |
|---|---|
| Nuxt integration | `nuxt-auth-utils ^0.5.30` ở cả hai app |
| Redis client | `ioredis ^5.11` trong `packages/auth`, client riêng fail-closed |
| Session | opaque 256-bit, TTL tuyệt đối 3600 giây |
| Remember | selector 256-bit + verifier 256-bit, rotate verifier khi dùng, hạn tuyệt đối tối đa 365 ngày |
| Persistence | Valkey 9, AOF, `noeviction`; health/alert bắt buộc |
| DB | `active_sessions` metadata/audit; `session_version` trên account |
| Web/Admin | `server-first` / `client-only` |

```bash
pnpm --filter @mindkid/auth test
pnpm --filter @mindkid/db test
pnpm --filter @mindkid/web test
pnpm --filter @mindkid/admin test
pnpm test:e2e
pnpm lint:specs
pnpm check
pnpm test
pnpm check:progress
```

## 6. Project structure và interface

| Bề mặt | Vai trò |
|---|---|
| `packages/auth/src/browser-session.ts` | Service/port domain cho create, resolve, restore, revoke |
| `packages/auth/src/redis-session-store.ts` | Keyspace, digest, Lua/transaction, fail-closed client |
| `packages/auth/src/mfa-challenge.ts` | Opaque one-time User/Manager challenge theo namespace, digest + atomic consume |
| `packages/db/src/schema/identity.ts` | Metadata `active_sessions`, `session_version` |
| `apps/*/server/plugins/auth-session.ts` | Wire Redis adapter + session fetch hook |
| `apps/*/server/middleware/auth.ts` | Resolve một lần, gắn context |
| `apps/*/shared/types/auth.d.ts` | Locator secure + safe projection app-local |
| `apps/*/app/composables/use-kid-think-auth.ts` | Login/restore/fetch/logout; không token client |

```ts
interface BrowserSessionService {
  create(input: CreateBrowserSession): Promise<CreatedSession>;
  resolve(namespace: AuthNamespace, rawToken: string): Promise<AuthContext | null>;
  restore(input: RestoreRememberSession): Promise<RotatedRememberSession>;
  revokeDevice(input: RevokeDeviceSession): Promise<void>;
  revokeAll(account: AccountReference): Promise<void>;
}

await replaceUserSession(event, {
  secure: { session_token: created.sessionToken },
});
```

Public API không export `Redis`, raw token, Lua result hoặc type `#auth-utils`.

## 7. Testing strategy

Viết ca âm trước mỗi lát:

- login/MFA/response/cookie có first-party JWT/JWS hoặc refresh token;
- session vẫn sống sau đúng 3600 giây hoặc bị sliding bởi activity;
- remember rotation kéo dài mốc một năm;
- concurrent restore cùng token có hơn một response thành công;
- reuse không revoke-all;
- revoke thiết bị để lại remember/session orphan;
- Redis outage fallback memory/file/DB/JWT;
- cookie User mở Manager hoặc Bearer mở browser guard;
- Manager nhận remember trước MFA hoặc restore làm mới reauth;
- `/api/_auth/session` trả locator/stale sealed identity;
- request mutation bị auto-retry sau restore.

Unit test dùng fake clock và fake store theo port; integration dùng Valkey + PostgreSQL thật.
Critical path không mock Redis/DB. E2E chạy login, expiry, restore, reload, revoke-device,
logout-all, MFA và cross-namespace.

## 8. Dependency graph

```text
T0 RED inventory + contracts
  |
  +--> T1 Redis session store + domain service
          |
          +--> T2 PostgreSQL metadata migration
                  |
                  +--> T3 Web config + projection
                          |
                          +--> T4 Web login + remember restore
                                  |
                                  +--> T5 Web guard + revoke/logout
                                          |
                                          +--> Checkpoint Web
                                                  |
                                                  +--> T6 Admin config + origin/MFA issue
                                                          |
                                                          +--> T7 Admin restore + guard/revoke
                                                                  |
                                                                  +--> Checkpoint Admin
                                                                          |
                                                                          +--> T8 Legacy cleanup
                                                                                  |
                                                                                  +--> T9 durability/observability
                                                                                          |
                                                                                          +--> T10 evidence + promote
```

Web đi trước Admin để review lifecycle trên bề mặt ít đặc quyền hơn. Schema/Redis foundation
chạy tuần tự; không song song với app cutover.

## 9. Tasks

### T0 — RED inventory và contract tests

- [ ] Test đỏ chứng minh Sidebase, first-party JWT/`jose`, refresh route/cookie và PG token hash còn tồn tại.
- [ ] Test đỏ cho `BR-AUT-25` đến `BR-AUT-38`, gồm fake-clock 1 giờ/365 ngày/challenge 5 phút.
- [ ] Inventory consumer refresh/session cũ, Bearer browser và topology Manager origin.

**Verify:** targeted Vitest đỏ vì đúng contract mới. **Files:** tối đa 4 contract test/inventory.
**Dependency:** spec + plan human review. **Cỡ:** M.

### T1 — Opaque Redis session foundation

- [ ] Thêm domain types/port: session token 256-bit và remember selector/verifier đều 256-bit;
      raw credential không log/store value.
- [ ] Redis adapter có versioned keyspace, process-long client, timeout fail-closed.
- [ ] Lua/transaction atomic cho create, selector lookup + verifier rotation, revoke device và
      revoke-all; selector miss chỉ 401, verifier mismatch của family tồn tại mới là reuse.
- [ ] Unit + Valkey integration test concurrent restore/reuse/cross-namespace/outage xanh.

**Verify:** `pnpm --filter @mindkid/auth test`. **Files:** package manifest, port/service,
Redis adapter, Lua module, tests; chia T1a/T1b nếu vượt 5 file. **Dependency:** T0. **Cỡ:** M.

### T2 — Metadata schema và migration

- [ ] `refresh_token_version` đổi thành `session_version` cho User/Manager.
- [ ] `active_sessions` đổi sang `device_id`, `remembered`, `revoked_at`; bỏ token hash/reauth.
- [ ] Metadata store idempotent; không API nào dùng PG để resolve/restore auth.
- [ ] Migration local có down-risk note và integration test orphan/unique/device lifecycle.

**Verify:** DB schema + migration tests trên PG local. **Files:** schema, migration, store, index,
integration test. **Dependency:** T1. **Cỡ:** M. Không chạy migration ngoài local.

### T3 — Web module, cookie locator và projection

- [ ] Web dùng `nuxt-auth-utils >=0.5.30`, cookie host-only TTL 3600, `server-first`.
- [ ] Type augmentation chỉ có `secure.session_token`; safe user được hydrate từ Redis hook.
- [ ] Redis miss không trả stale sealed `user`; outage trả 503.
- [ ] Sidebase tạm giữ Admin, không còn ở Web config/runtime.

**Verify:** Web config/projection integration tests. **Files:** manifest/config/type/plugin/test.
**Dependency:** T2. **Cỡ:** M.

### T4 — Web login và remember restore

- [ ] Login schema nhận `rememberMe?: boolean=false`; tạo session một giờ.
- [ ] Chỉ khi true mới đặt `tm_u_remember`; restore route body rỗng + CSRF, rotate nguyên tử.
- [ ] Restore giữ absolute expiry, xoay CSRF và tạo `reauthAt=null`; client chỉ restore
      bootstrap/read-401, không retry mutation.
- [ ] Register/SNS/MFA User dùng cùng session service, không phát JWT/refresh.

**Verify:** login/restore/concurrency/fake-clock tests. **Files:** login route, remember route,
auth runtime, composable, integration test. **Dependency:** T3. **Cỡ:** M.

### T5 — Web guard, device revoke và logout

- [ ] Middleware resolve Redis một lần; User guard sync và từ chối Bearer/Manager cookie.
- [ ] Session list dùng PG metadata; delete device revoke Redis trước rồi mark PG.
- [ ] Logout/logout-all có CSRF, revoke Redis trước, clear session/remember/csrf cookie.
- [ ] `DELETE /api/_auth/session` 405; direct client `clear()` bị cổng quét chặn.

**Verify:** expiry/revoke/logout/cross-namespace/Web SSR E2E. **Files:** middleware, session route,
revoke route, logout runtime/routes, test; chia theo vertical endpoint nếu vượt 5 file.
**Dependency:** T4. **Cỡ:** M.

### Checkpoint Web

- [ ] Login no-remember, login remember, one-hour expiry, restore, revoke-device, logout-all xanh.
- [ ] Redis outage 503; không fallback; Web không còn JWT/Sidebase/refresh.
- [ ] Human review token entropy, Lua atomicity, CSRF, cookie và failure modes.

### T6 — Admin config, origin và MFA issuance

- [ ] Admin locator cookie/secret/keyspace riêng, TTL 3600, `client-only`.
- [ ] Test chứng minh cookie finalise trên admin origin; không nới `Domain`.
- [ ] Login tạo opaque challenge 256-bit TTL 5 phút, bind `rememberMe` + origin; trước MFA
      không tạo Redis/PG/cookie auth và không JWT challenge.
- [ ] MFA success mới tạo session và remember; recovery/rate-limit semantics giữ nguyên.

**Verify:** Manager origin/MFA/cross-namespace tests. **Files:** config/type/plugin, MFA/login adapter,
integration test; chia T6a/T6b nếu vượt 5 file. **Dependency:** Checkpoint Web. **Cỡ:** M.

### T7 — Admin restore, guard và revoke

- [ ] Restore Manager rotate remember nhưng giữ `reauthAt=null`/cũ; role hydrate từ Redis state.
- [ ] Middleware resolve một lần, guard/role sync, từ chối Bearer/User cookie.
- [ ] Revoke-device/logout/logout-all thu hồi Redis trước; audit Manager đầy đủ.
- [ ] SPA bootstrap/expiry không nháy authenticated state sai.

**Verify:** Admin MFA/restore/role/revoke/logout E2E. **Files:** remember route, middleware,
runtime/composable, revoke/logout routes, test; chia nhỏ nếu vượt 5 file. **Dependency:** T6.
**Cỡ:** M.

### Checkpoint Admin

- [ ] Hai app không dùng chéo cookie, secret, namespace, device hoặc remember token.
- [ ] Manager remember không bypass MFA/reauth; audit có đủ success/failure/reuse/revoke.
- [ ] Human security review origin, MFA, role freshness và revoke-all.

### T8 — Gỡ JWT/`jose`/refresh/Sidebase

- [ ] Xoá Sidebase khỏi catalog/manifest/config/lockfile.
- [ ] Xoá mọi JWT creator/verifier/challenge, `RefreshService`, refresh routes/cookies và session routes cũ.
- [ ] Xoá `jose` khỏi `packages/auth`, workspace catalog và lockfile; source scan toàn repo
      không còn direct dependency/import, Bearer hoặc first-party JWT/JWS.
- [ ] Task #16, #23 và #25 giữ nguyên làm hồ sơ lịch sử; Task #85 supersede mọi JWT,
      refresh-token và Sidebase contract trong các task đó.

**Verify:** vendor/route/cookie scan + dependency lint + dead-contract tests. **Files:** chia từng
package/app, mỗi work package tối đa 5 file. **Dependency:** Checkpoint Admin. **Cỡ:** M mỗi lát.

### T9 — Redis durability và observability

- [ ] Local/production config auth store AOF + `noeviction`; health check phân biệt cache/auth.
- [ ] Alert Redis unavailable, memory pressure, rejected write, Lua failure và restore reuse.
- [ ] Runbook nêu mất Redis = logout, recovery không nạp session từ PG/file.
- [ ] Log/audit redaction test chứng minh không raw cookie/token.

**Verify:** config tests, outage drill local, monitoring/runbook review. **Files:** compose/config,
health plugin, monitoring, runbook, tests. **Dependency:** T8. **Cỡ:** M.

### T10 — Evidence và promote

- [ ] Mỗi `BR-AUT-25` đến `BR-AUT-38` có evidence dương/âm phù hợp.
- [ ] Web SSR và Admin SPA E2E xanh qua one-hour expiry, remember, revoke và MFA.
- [ ] `pnpm check`, `pnpm test`, `pnpm test:e2e`, `pnpm lint:specs`, `pnpm check:progress` xanh.
- [ ] Chỉ sau evidence, auth/login/admin specs trở lại `implemented`.

**Files:** evidence/status tối đa 5 file. **Dependency:** T9. **Cỡ:** M.

## 10. Risks and mitigations

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Module vẫn seal toàn session | Identity stale/cookie phình | Locator-only + fetch hook Redis |
| Concurrent remember restore | Hai credential cùng sống | Stable selector + Lua compare-and-rotate; loser là reuse và revoke-all |
| Sliding nhầm expiry | Remember vĩnh viễn | `absoluteExpiresAt` bất biến + fake clock |
| Redis eviction/outage | Logout hàng loạt hoặc bypass do fallback | `noeviction`, AOF, alert, fail-closed |
| Redis/PG lệch | UI device list stale | Redis authority, PG metadata idempotent/reconcile |
| Restore tự retry mutation | Double side effect | Chỉ bootstrap/read-401; mutation trả 401 cho UI xử lý |
| Manager origin sai | Cookie không tới Admin hoặc rò domain | Same-origin proof trước cutover |
| MFA challenge vẫn là JWT tự chứa | Replay/bypass Redis authority | Opaque Redis challenge, one-time consume + expiry/concurrency test |

## 11. Boundaries

**Always**

- Test âm trước mọi lát auth; Redis revoke trước metadata PG.
- Dùng token 256-bit, digest store, HTTPS `Secure`/`HttpOnly`/host-only cookie.
- Chạy targeted gate và human review tại mỗi checkpoint.

**Ask first**

- Đổi TTL một giờ/365 ngày, sliding policy, Redis persistence/eviction policy.
- Đổi Manager remember/MFA hoặc topology origin.
- Thêm dependency/Redis topology mới ngoài baseline.

**Never**

- First-party JWT/JWS, `jose` hoặc Bearer auth ở bất kỳ namespace nào.
- Raw credential trong response, log, PostgreSQL hoặc client state.
- Fallback file/memory/DB/JWT khi Redis lỗi.
- Auto-merge, deploy, production secret hoặc migration ngoài local.

## 12. Success criteria

- User và Manager chỉ dùng opaque cookie session; Redis là authority.
- Session hết tuyệt đối sau một giờ dù hoạt động liên tục.
- Remember mặc định tắt; khi bật rotate-on-use và hết tuyệt đối trong 365 ngày.
- Revoke một/nhiều thiết bị có hiệu lực ở request kế tiếp; reuse revoke-all.
- Redis outage 503, không fallback; AOF/`noeviction` và alert được kiểm chứng.
- Không Sidebase, first-party JWT/JWS, `jose`, refresh route/cookie/service còn trong runtime.
- Full gate xanh và human security review chấp nhận diff.

## 13. Open questions

Không có quyết định sản phẩm còn mở. Infra phải chốt Valkey auth deployment trước go-live:
instance riêng được ưu tiên; nếu dùng cùng server thì vẫn cần auth client/keyspace riêng,
AOF + `noeviction`, và logical DB không được coi là security isolation.
