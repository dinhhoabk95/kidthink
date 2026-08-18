# Implementation Plan: P0.3 — Actors, guard và nền session

## Overview

Đây là hạng mục `approved` sớm nhất chưa `implemented` theo
[`roadmap.md`](../specs/roadmap.md): P0.0–P0.2 đã có code và test, còn P0.3 do
[`actors.md`](../specs/00-foundation/actors.md) và
[`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) sở hữu vẫn ở
trạng thái `approved`. P0.7–P0.8 đã được triển khai sớm hơn thứ tự, nhưng không làm P0.3 mất
đi vị trí trong dependency graph.

Kết quả cần đạt là nền auth mà các bước P0.9b, P0.10 và P0.11b sẽ dùng lại: Sidebase Local
quản lý trạng thái auth của hai Nuxt app, backend phát JWT access 15 phút, hai namespace User
và Manager tách biệt, guard đồng bộ, refresh token xoay, custom CSRF, reauth và các port cho
ownership/entitlement. Task này không làm UI đăng nhập, route đăng ký, email, rate limit thật
hay OAuth bridge; các outcome đó vẫn thuộc bước roadmap riêng.

Theo ngoại lệ Task #14 tại quyết định D7 của [`SPEC.md`](../SPEC.md) mục 0, AI được phép sinh
code auth trong kế hoạch này. Mỗi increment vẫn phải viết test âm trước, chạy gate đầy đủ, ghi
rõ phần AI soạn và để người review diff trước merge. Ngoại lệ không cho phép auto-merge, dùng
secret thật hoặc chạy thay đổi production.

## Remediation sau security review

Review commit triển khai đầu tiên phát hiện evidence bị đóng sớm và bốn khoảng trống có hậu
quả bảo mật: secret fallback công khai, refresh input tin dữ liệu caller, thiếu adapter
PostgreSQL/route runtime thật, và CSRF/reauth/ownership chưa gắn đúng authenticated context.
Vì vậy P0.3 và hai spec sở hữu được mở lại cho tới khi các increment sửa lỗi có test âm,
integration PostgreSQL thật, route Nuxt tối thiểu và human security review mới. Các checkbox
đã hoàn thành về dependency/supply chain vẫn giữ nguyên; checkbox hành vi được chứng minh lại.

## Why this is next

| Bước roadmap | Spec sở hữu | Trạng thái hiện tại | Kết luận |
|---|---|---|---|
| P0.0 | testing strategy · AI codegen · MVP scope | `implemented` | xong |
| P0.1 | repo bootstrap · package architecture | `implemented` | xong |
| P0.2 | glossary · ID conventions | `implemented` | xong |
| **P0.3** | actors · auth tokens/sessions | **`approved`** | **làm tiếp** |
| P0.4–P0.6 | compliance · access · content lifecycle | `approved` | chờ P0.3 |
| P0.7–P0.8 | data model · schema · migration đầu | `implemented` sớm | nền DB có sẵn để P0.3 dùng |

Hiện [`packages/auth/src/index.ts`](../../packages/auth/src/index.ts) chỉ export rỗng;
`apps/web` và `apps/admin` mới có manifest. Vì vậy không có implementation cũ cần migrate,
nhưng cũng chưa có Nuxt runtime để chứng minh middleware và cookie contract.

## Scope

### In scope

- Contract domain và public API của `@mindkid/auth`, không lộ type của thư viện nền.
- Context User/Manager loại trừ nhau; `requireUserAuth`, `requireManagerAuth`, `requireRole`
  là hàm đồng bộ.
- Hai cấu hình Sidebase Local cho `apps/web` và `apps/admin`; cookie/issuer/secret/audience tách biệt.
- JWT access 15 phút ký bằng `jose`; payload allow-list theo domain MindKid.
- Refresh token opaque: hash trong `active_sessions`, xoay, phát hiện reuse, logout một phiên
  và thu hồi toàn bộ.
- CSRF cho request đổi trạng thái và reauth theo đúng phiên hiện tại trong cửa sổ 5 phút.
- Contract `assertActiveChild`/ownership và `hasEntitlement` ở dạng port, để bước sở hữu dữ
  liệu trẻ và entitlement gắn adapter thật sau đó.
- Test âm cho spoofing, tampering, information disclosure và elevation of privilege.

### Out of scope

- Route/UI đăng ký, đăng nhập User, quên mật khẩu, xác thực email: P0.10.
- Login Manager, MFA enrollment/TOTP flow và audit login: P0.11/P0.11b.
- Rate limiter Valkey thật: P0.9b.
- Google/Facebook và social reauth thật: P1.15.
- Child profile CRUD và gating nội dung: P1.
- Bất kỳ secret thật, thao tác với `.env`, hoặc thay đổi production.

## Contract decisions and human gates

Ba xung đột contract đã được đóng trong spec sở hữu ngày 2026-08-09; human reviewer phải xác
nhận diff trước khi viết code:

| Xung đột | Quyết định canonical | Spec sở hữu |
|---|---|---|---|
| Session trước MFA | Chỉ cấp challenge credential một mục đích; không có access token hoặc `active_sessions` trước khi TOTP thành công | [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) + [`admin-auth.md`](../specs/06-admin/admin-auth.md) |
| TTL refresh Manager | 24 giờ; User giữ 7 ngày | [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) §7.2 |
| Tên cookie guest | `tm_did`; actors chỉ link tới contract cookie | [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) §7.2 |

Việc thêm dependency auth là `Ask first` và đã được người dùng yêu cầu trong task này. Human
reviewer vẫn phải duyệt lockfile sau khi đối chiếu
[Sidebase Local 1.3.1](https://auth.sidebase.io/guide/local/quick-start) và Nuxt 4; không suy
API từ trí nhớ hoặc export type vendor qua `@mindkid/auth`.

## Threat model

| STRIDE | Abuse case phải test trước | Control trong plan | Việc để bước sau sở hữu |
|---|---|---|---|
| Spoofing | Session User gọi namespace Manager và ngược lại | audience + secret + cookie name tách biệt; test chéo trả 401 | route login thật ở P0.10/P0.11b |
| Tampering | Sửa cookie child; gửi lại refresh token cũ; thiếu CSRF | ownership port; rotation/reuse revoke; double-submit CSRF | adapter child DB thật ở P1 |
| Repudiation | Manager phủ nhận lần đăng nhập | auth service phát event/port audit, không tự ghi lén | audit log P0.11 |
| Information disclosure | Lỗi cho biết email/provider; token lọt log/client | lỗi registry thống nhất; payload allow-list; test không log token | route login P0.10 |
| Denial of service | Brute force theo account hoặc IP | contract bắt buộc hai key rate-limit | Valkey implementation P0.9b |
| Elevation of privilege | Guard chung có cờ; reviewer vào payment; entitlement trong session | hai guard riêng; role server-side; entitlement đọc qua port | route admin P0.11b, entitlement P0.5 |

## Architecture decisions

- `@sidebase/nuxt-auth` Local provider được khai trực tiếp trong mỗi Nuxt app vì module cần
  sinh integration runtime; code app không import/export vendor type.
- `@mindkid/auth` export type/hàm domain và là nơi duy nhất dùng `jose` cho JWT browser.
- Middleware server của mỗi app xác minh JWT access đúng một lần; guard chỉ đọc context và
  không trả `Promise`.
- User/Manager dùng discriminated session context; một request không thể có cả hai.
- User access claim gồm `sub`, `aud`, `iss`, `sid`, `name`, `ver`, `active_child_id?`, `iat`,
  `exp`; Manager thay `active_child_id` bằng `role`. Hai app dùng issuer và HS256 secret riêng.
- Refresh token opaque đối với client nhưng là envelope `v1` MAC-bound chứa namespace, `sid`,
  version và nonce. Backend xác thực MAC trước DB; DB chỉ giữ hash toàn envelope. Rotation và
  phát hiện reuse nằm trong transaction/service boundary có test concurrency PostgreSQL thật.
- `active_child_id` là context, không phải quyền. `assertActiveChild` chỉ xác nhận có context;
  mọi đọc dữ liệu thật vẫn cần ownership query qua port và trả 404 khi không thuộc caller.
- Entitlement không nằm trong JWT access. `hasEntitlement` là port async để P0.5 gắn
  DB/cache implementation mà không đổi public guard API.
- Sidebase Local không có CSRF tích hợp; mọi unsafe request vẫn phải qua wrapper double-submit
  `x-csrf-token` của MindKid.
- Không tạo production route test, route Manager OAuth, endpoint public tạo Manager, hoặc
  challenge trước MFA đi qua guard. OAuth P1 dùng backend bridge rồi phát token pair canonical.

## Dependency graph

```text
Task 0: human chốt contract + ranh giới bảo mật
    |
Task 1: human duyệt dependency và Nuxt adapter seam
    |
Task 2: public contract @mindkid/auth + abuse tests
    |-------------------------|
Task 3: User session slice    Task 4: Manager session slice
    |-------------------------|
              |
Task 5: refresh lifecycle
              |
Task 6: CSRF + reauth
              |
Task 7: active-child + entitlement ports
              |
Task 8: security evidence + status/checklist
```

Task 3 và Task 4 có thể làm song song sau khi Task 2 đã merge. Các task 5–7
cùng sửa `packages/auth` nên làm tuần tự hoặc chia file ownership tường minh trước khi bắt đầu.

## Task 0: Resolve contract conflicts and approve the security boundary

**Owner:** Human review bắt buộc; AI được sửa contract theo ngoại lệ Task #14.

**Description:** Review contract đã đổi sang Sidebase Local + JWT và ba quyết định xung đột đã
đóng. Human thứ hai approve thay đổi contract và ngoại lệ Task #14 trước Task 2.

**Acceptance criteria:**

- [ ] Ba xung đột ở mục Contract decisions có đúng một quyết định trong spec sở hữu, spec khác link tới thay vì copy.
- [ ] Corpus không còn mô tả `nuxt-auth-utils`, Iron seal hoặc AuthJS là cơ chế hiện hành.
- [ ] Không thêm actor, role, TTL hoặc auth flow ngoài phạm vi đã duyệt.
- [ ] Một human reviewer độc lập xác nhận threat model, sáu vùng nhạy cảm và cổng ngoại lệ.

**Verification:**

- [ ] `pnpm lint:specs`
- [ ] Đọc diff tay theo [`CONVENTIONS.md`](../specs/CONVENTIONS.md); không có ID rule đổi hoặc tái dùng.
- [ ] Review security checklist mục CRITICAL/HIGH có kết quả ghi trong PR.

**Dependencies:** None.

**Files likely touched:**

- `docs/specs/00-foundation/actors.md`
- `docs/specs/01-platform/auth-tokens-sessions.md`
- `docs/specs/06-admin/admin-auth.md`

**Estimated scope:** Medium, 3 files.

## Task 1: Approve the Nuxt auth adapter and dependency baseline

**Owner:** AI được implement sau khi dependency addition được human approve tường minh.

**Description:** Đối chiếu official docs Sidebase Local 1.3.1, xác nhận endpoint/token/cookie
config và thêm đúng dependency tối thiểu vào catalog/manifests. Local provider không được cài
`next-auth`; optional peer metadata trong lockfile là chấp nhận được. Không chạy script cài đặt
chưa được allow-list hoặc khai hai version.

**Acceptance criteria:**

- [ ] Có ghi nhận config thật của Nuxt 4 và Sidebase Local 1.3.1; không dùng AuthJS hoặc pattern Nuxt 3 cũ.
- [ ] Hai app khai Sidebase như Nuxt module; `@mindkid/auth` sở hữu domain/JWT và không export type vendor.
- [ ] `packages/auth` dùng `jose`; app runtime không import `jose`/`otpauth` trực tiếp.
- [ ] Lockfile chỉ thêm dependency đã duyệt, không có install script mới được blanket-approve.

**Verification:**

- [ ] `pnpm install --frozen-lockfile` chạy được từ lockfile sau khi lock đã cập nhật.
- [ ] `pnpm audit --prod` không còn finding critical/high reachable chưa có quyết định xử lý.
- [ ] `pnpm lint:deps && pnpm typecheck`

**Dependencies:** Task 0.

**Files likely touched:**

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `packages/auth/package.json`
- `apps/web/package.json`
- `apps/admin/package.json`

**Estimated scope:** Medium, 5 files.

## Checkpoint A: Contract and supply-chain approval

- [ ] Human thứ hai đã approve Task 0.
- [ ] Dependency diff và provenance đã được review.
- [ ] Ngoại lệ Task #14 và các cổng test/review đã được ghi trong canonical contract.
- [ ] `pnpm check && pnpm lint:specs` xanh.

## Task 2: Define the stable `@mindkid/auth` contract and write abuse tests

**Owner:** AI theo ngoại lệ Task #14; human review diff trước merge.

**Description:** Định nghĩa type domain, structured errors và các port session/store/rate-limit/
audit trước implementation. Viết test âm trước để public API không thể nhận nhầm User thành
Manager hoặc lộ type/claim của vendor.

**Acceptance criteria:**

- [ ] User và Manager context là hai variant loại trừ nhau; payload User không có role, tier, package hoặc entitlement.
- [ ] Error dùng đúng registry (`UNAUTHENTICATED`, `INSUFFICIENT_ROLE`, `NO_ACTIVE_CHILD`, `NOT_FOUND`, `SESSION_REVOKED`, `REAUTH_REQUIRED`).
- [ ] Test âm đỏ trước implementation cho cross-audience, guard trả Promise và context mang cả User lẫn Manager.

**Verification:**

- [ ] `pnpm --filter @mindkid/auth test -- contracts`
- [ ] `pnpm --filter @mindkid/auth typecheck`
- [ ] Public export snapshot không chứa type/import từ vendor auth.

**Dependencies:** Task 1.

**Files likely touched:**

- `packages/auth/src/contracts.ts`
- `packages/auth/src/errors.ts`
- `packages/auth/src/ports.ts`
- `packages/auth/src/index.ts`
- `packages/auth/tests/contracts.test.ts`

**Estimated scope:** Medium, 5 files.

## Task 3: Deliver the User session boundary end-to-end

**Owner:** AI theo ngoại lệ Task #14; human review diff trước merge.

**Description:** Dựng runtime Nuxt tối thiểu của `apps/web`, cấu hình Sidebase Local và để
server middleware gọi verifier trong `@mindkid/auth` đúng một lần, map JWT access sang domain
context, rồi chứng minh `requireUserAuth` là sync và từ chối missing/wrong audience bằng 401.

**Acceptance criteria:**

- [ ] Middleware chỉ gắn `event.context.user`; không thể đồng thời gắn Manager.
- [ ] User cookie đúng tên/TTL/HttpOnly/SameSite/Secure policy đã chốt và không chứa entitlement hoặc role.
- [ ] Missing/expired/tampered JWT và Manager JWT đều trả `UNAUTHENTICATED` 401, không rò secret hoặc lỗi crypto.
- [ ] Browser smoke test chứng minh access cookie `HttpOnly` vẫn dùng được cho `getSession`/SSR và raw JWT không đọc được bằng JavaScript.

**Verification:**

- [ ] `pnpm --filter @mindkid/web test -- auth-context`
- [ ] Contract test kiểm `Set-Cookie` và payload allow-list.
- [ ] Static test cấm `await requireUserAuth(...)`.

**Dependencies:** Task 2.

**Files likely touched:**

- `apps/web/nuxt.config.ts`
- `apps/web/server/middleware/auth.ts`
- `apps/web/tests/integration/auth-context.test.ts`
- `packages/auth/src/user-session.ts`
- `packages/auth/tests/user-session.test.ts`

**Estimated scope:** Medium, 5 files.

## Task 4: Deliver the Manager session boundary end-to-end

**Owner:** AI theo ngoại lệ Task #14; human review diff trước merge.

**Description:** Dựng Sidebase Local cho `apps/admin` với cookie, issuer, secret và audience
riêng; middleware gọi JWT verifier do `@mindkid/auth` sở hữu, rồi chứng minh User session
không qua được namespace Manager và `content_reviewer` không được nâng quyền.

**Acceptance criteria:**

- [ ] Manager session chỉ được tạo sau điều kiện MFA đã chốt; challenge tạm không qua guard và không tạo `active_sessions`.
- [ ] User session gọi Manager guard trả 401; thiếu role trả `INSUFFICIENT_ROLE` 403 ở server.
- [ ] Không có route OAuth Manager, public manager creation hoặc guard chung có cờ `isAdmin`.

**Verification:**

- [ ] `pnpm --filter @mindkid/admin test -- auth-context`
- [ ] Cross-namespace integration test chạy hai chiều User ↔ Manager.
- [ ] `rg -n "isAdmin|mfa_pending|oauth" apps/admin packages/auth` được review từng kết quả, không dùng như allow-list mù.

**Dependencies:** Task 2; có thể song song Task 3.

**Files likely touched:**

- `apps/admin/nuxt.config.ts`
- `apps/admin/server/middleware/auth.ts`
- `apps/admin/tests/integration/auth-context.test.ts`
- `packages/auth/src/manager-session.ts`
- `packages/auth/tests/manager-session.test.ts`

**Estimated scope:** Medium, 5 files.

## Checkpoint B: Namespace isolation

- [ ] User/Manager cross-audience tests xanh theo cả hai hướng.
- [ ] Guard đều sync; chỉ middleware/adapter được async.
- [ ] Cookie name, secret namespace và host scope không dùng chung.
- [ ] Human security reviewer đọc diff trước khi sang refresh lifecycle.

## Task 5: Implement refresh rotation and revocation semantics

**Owner:** AI theo ngoại lệ Task #14; human review diff trước merge.

**Description:** Cài service refresh độc lập route trên schema `active_sessions` đã có và nối
với Sidebase Local refresh. Token opaque chỉ xuất hiện ở boundary cookie; store giữ hash;
rotation, reuse detection, logout một phiên và revoke-all phải atomic và có test concurrency.

**Acceptance criteria:**

- [ ] Refresh thành công xoay token; token cũ dùng lại trả `SESSION_REVOKED` và thu hồi mọi phiên của account.
- [ ] Logout hiện tại chỉ xoá một hàng; logout-all tăng `refresh_token_version` mà không giết nhầm account khác.
- [ ] Refresh secret/provider token không xuất hiện trong DB plaintext, error, log hoặc session client-visible.

**Verification:**

- [ ] `pnpm --filter @mindkid/auth test -- refresh`
- [ ] Integration test PostgreSQL thật cho rotation đồng thời và orphan guard.
- [ ] Property test: mọi token chỉ thành công tối đa một lần.

**Dependencies:** Tasks 3 and 4.

**Files likely touched:**

- `packages/auth/src/refresh.ts`
- `packages/auth/src/session-store.ts`
- `packages/auth/tests/refresh.test.ts`
- `apps/web/server/utils/auth-store.ts`
- `apps/admin/server/utils/auth-store.ts`

**Estimated scope:** Medium, 5 files.

## Task 6: Enforce CSRF and current-session reauth

**Owner:** AI theo ngoại lệ Task #14; human review diff trước merge.

**Description:** Vì Sidebase Local không cung cấp CSRF, thêm wrapper double-submit MindKid
cho mọi request đổi trạng thái và service reauth dùng `active_sessions.reauth_at`. Reauth chỉ
nâng phiên hiện tại, hết hạn sau 5 phút, và trả danh sách method khả dụng mà không tiết lộ
provider cho caller chưa xác thực.

**Acceptance criteria:**

- [ ] Request đổi trạng thái thiếu/mismatch `x-csrf-token` bị 403; safe method không bị chặn.
- [ ] Reauth cũ hơn 5 phút trả `REAUTH_REQUIRED` 428; thành công ở thiết bị A không nâng thiết bị B.
- [ ] `details.methods` chỉ gồm method account thật sự có; actual OAuth/TOTP challenge vẫn thuộc bước sở hữu sau.

**Verification:**

- [ ] `pnpm --filter @mindkid/auth test -- csrf reauth`
- [ ] Test dùng clock giả đúng biên 5 phút và hai session đồng thời.
- [ ] Test response/log không chứa token, secret hoặc tên provider ngoài `details.methods` đã đăng ký.

**Dependencies:** Task 5.

**Files likely touched:**

- `packages/auth/src/csrf.ts`
- `packages/auth/src/reauth.ts`
- `packages/auth/tests/csrf.test.ts`
- `packages/auth/tests/reauth.test.ts`
- `packages/auth/src/index.ts`

**Estimated scope:** Medium, 5 files.

## Task 7: Complete actor-boundary ports without pulling later features forward

**Owner:** AI theo ngoại lệ Task #14; human review diff trước merge. Phần ownership chạm dữ
liệu trẻ và phần entitlement chạm gating nên bắt buộc có test âm trước implementation.

**Description:** Hoàn thiện `assertActiveChild`, ownership port và entitlement port đủ để
consumer sau dùng đúng contract, nhưng chỉ dùng fake adapter trong contract test; không triển
khai child CRUD, DB adapter thật, package catalog hay access gating trước roadmap.

**Acceptance criteria:**

- [ ] Chưa có active child trả `NO_ACTIVE_CHILD` 428; child của User khác trả `NOT_FOUND` 404 qua ownership adapter test.
- [ ] Cookie chỉ cung cấp candidate ID; DB ownership port luôn nhận `user_id` từ authenticated context.
- [ ] Entitlement được đọc async qua store/cache port ở request time, không serialize vào session.

**Verification:**

- [ ] `pnpm --filter @mindkid/auth test -- actor-boundaries`
- [ ] Contract test với fake ownership store: giả mạo `active_child_id` của User khác trả 404.
- [ ] Static payload test cấm `entitlement`, `package`, `tier` trong User session.

**Dependencies:** Task 6.

**Files likely touched:**

- `packages/auth/src/active-child.ts`
- `packages/auth/src/entitlement-port.ts`
- `packages/auth/tests/actor-boundaries.test.ts`

**Estimated scope:** Medium, 3 files.

## Checkpoint C: P0.3 behavior

- [ ] Mọi acceptance criterion của Tasks 2–7 có test âm và test dương.
- [ ] Các port audit/rate-limit/OAuth chỉ là contract; không giả vờ external behavior đã chạy.
- [ ] Không route đăng nhập/đăng ký/UI ngoài phạm vi xuất hiện trong diff.
- [ ] `pnpm check && pnpm test && pnpm lint:specs` xanh.

## Task 8: Produce security evidence and close progress honestly

**Owner:** AI được cập nhật evidence/status khi gate chứng minh đủ; human review diff trước merge.

**Description:** Map từng `BR-ACT-*` và `BR-AUT-*` tới test evidence, chạy cổng chung và chỉ
promote status/checklist khi contract thật sự có implementation. Scenario phụ thuộc route thật
ở P0.10/P0.11b phải được chứng minh ở service/middleware layer hoặc giữ spec `approved`; không
tick khống để vượt `check:progress`.

**Acceptance criteria:**

- [ ] Mọi rule do hai spec sở hữu có ít nhất một test trực tiếp tham chiếu mã rule và kiểm đúng hành vi, không chỉ chứa chuỗi.
- [ ] Human security review xác nhận không có CRITICAL/HIGH chưa xử lý và không secret/token trong diff.
- [ ] Chỉ khi hai spec `implemented` có evidence ngoài docs mới tick P0.3; nếu chưa đủ thì ghi blocker cụ thể và giữ ô trống.

**Verification:**

- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress`
- [ ] `pnpm audit --prod` được triage theo reachability; không tự chạy forced remediation.
- [ ] Review tay `git diff` và cookie/error snapshots; human thứ hai ký security checklist.

**Dependencies:** Tasks 0–7.

**Files likely touched:**

- `packages/auth/tests/security-boundaries.test.ts`
- `docs/specs/00-foundation/actors.md`
- `docs/specs/01-platform/auth-tokens-sessions.md`
- `docs/tasks/14-implementation-sequence-todo.md`

**Estimated scope:** Medium, 4 files.

## Final checkpoint

- [ ] Dependency order được giữ: P0.3 foundation xong trước khi P0.4/P0.5 gắn implementation thật.
- [ ] `ACTORS` và `AUTH-TOKENS-SESSIONS` chỉ mang `implemented` khi evidence đạt Definition of Done.
- [ ] P0.3 chỉ được tick khi `pnpm check:progress` tự chấp nhận, không sửa hoặc né cổng.
- [ ] Human review hoàn tất; sẵn sàng sang P0.4 theo roadmap.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Ngoại lệ AI bị hiểu thành quyền bỏ cổng | Auth code thiếu kiểm soát ở vùng hậu quả cao | Mọi task code có test âm, gate đầy đủ và human review diff trước merge |
| Hai spec cùng sở hữu cookie/session behavior | Drift và test mâu thuẫn | Task 0 chốt owner trước code; spec khác link thay vì copy |
| Vendor type/API rò qua package | Mọi app bị khoá vào implementation | Domain contract + adapter seam + export snapshot ở Task 2 |
| P0.3 kéo P0.9b/P0.10/P1 lên sớm | Scope nổ, dependency graph mất ý nghĩa | Chỉ tạo port; concrete route/rate-limit/OAuth giữ ở bước sở hữu |
| Guard trông sync nhưng trả Promise | Quên `await` mở route | Type-level + static negative test cấm Promise/`await guard` |
| Refresh race tạo hai token hợp lệ | Session theft không bị phát hiện | Transaction/concurrency test + property một token dùng tối đa một lần |
| Working tree hiện có nhiều thay đổi | Plan hoặc implementation đè việc người dùng | Hai file plan mới ở `tasks/`; implementation phải resolve overlap trước từng task |

## Definition of Done used by this plan

Definition of Done dùng các nguồn canonical của repo:

- [`SPEC.md`](../SPEC.md) mục 11 và 13.
- [`testing-strategy.md`](../specs/08-quality/testing-strategy.md).
- [`security-checklist.md`](../specs/08-quality/security-checklist.md).
- `pnpm check:progress` và checklist Task #14.

Dependency baseline và ngoại lệ Task #14 đã được người dùng approve. AI được triển khai code
auth sau Task 0, nhưng human vẫn review diff trước merge và không có quyền auto-merge hoặc
thao tác production.
