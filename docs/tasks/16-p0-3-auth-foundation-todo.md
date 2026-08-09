# Todo: P0.3 — Actors, guard và nền session

> Plan chi tiết: [`16-p0-3-auth-foundation-plan.md`](16-p0-3-auth-foundation-plan.md). Theo
> ngoại lệ Task #14, AI được sinh/sửa code auth khi viết test âm trước, chạy gate đầy đủ và
> để human review diff trước merge. Không auto-merge hoặc thao tác production.

## Preflight

- [x] Human đọc và approve plan.
- [x] Xác nhận P0.3 là bước `approved` sớm nhất chưa `implemented` theo roadmap.
- [x] Không đụng `.env`, secret thật hoặc production.
- [x] Bảo toàn toàn bộ thay đổi sẵn có trong working tree; không reset/checkout/revert.

## Task 0 — Human review contract và security boundary

- [x] Contract trước MFA chỉ cấp challenge một mục đích; không tạo access token/`active_sessions` trước khi MFA thành công.
- [x] TTL refresh Manager là 24 giờ; User là 7 ngày.
- [x] Guest device cookie canonical là `tm_did`; actors chỉ link tới spec cookie.
- [x] Contract package dùng Sidebase Local + JWT access bằng `jose`; OAuth P1 qua backend bridge.
- [ ] Human thứ hai review threat model, sáu vùng nhạy cảm và ngoại lệ Task #14.
- [x] `pnpm lint:specs` xanh.

## Task 1 — Human duyệt Nuxt adapter và dependency

- [x] Đối chiếu official docs Sidebase Local 1.3.1 và npm package metadata cho version pin.
- [x] Người dùng approve đổi dependency sang `@sidebase/nuxt-auth`.
- [x] Hai app khai Sidebase như Nuxt module; `@kidthink/auth` giữ domain/JWT API.
- [x] Lockfile không cài `next-auth`; optional peer chỉ xuất hiện trong metadata Sidebase. App runtime không import `jose`/`otpauth` trực tiếp.
- [x] Review lockfile, provenance và install scripts; không blanket-approve.
- [x] `pnpm install --frozen-lockfile`
- [x] `pnpm audit --prod` đã triage finding reachable — không có advisory đã biết.
- [x] `pnpm lint:deps && pnpm typecheck`

## Checkpoint A

- [ ] Task 0 được human thứ hai approve.
- [ ] Supply-chain review hoàn tất.
- [ ] Ngoại lệ Task #14 và các cổng test/review đã được ghi trong canonical contract.
- [ ] `pnpm check && pnpm lint:specs` xanh.

## Task 2 — Định nghĩa public contract `@kidthink/auth`

- [ ] Viết domain types User/Manager loại trừ nhau.
- [ ] Viết structured error mapping theo registry.
- [ ] Viết port cho session store, rate limit, audit, ownership và entitlement.
- [ ] Viết test âm trước cho cross-audience, Promise guard và dual context.
- [ ] `pnpm --filter @kidthink/auth test -- contracts`
- [ ] `pnpm --filter @kidthink/auth typecheck`

## Task 3 — Làm User session slice

- [ ] Dựng Nuxt runtime tối thiểu cho `apps/web`.
- [ ] Middleware verify JWT access đúng một lần và chỉ gắn User context.
- [ ] Sidebase Local `getSession`/SSR chạy với access cookie `HttpOnly`; JavaScript không đọc raw JWT.
- [ ] `requireUserAuth` là sync; missing/wrong audience trả 401.
- [ ] Cookie/payload test đúng contract, không role/tier/package/entitlement.
- [ ] `pnpm test apps/web`

## Task 4 — Làm Manager session slice

- [ ] Dựng adapter riêng cho `apps/admin`.
- [ ] Cookie, secret và audience không dùng chung với User.
- [ ] `requireManagerAuth`/`requireRole` kiểm ở server.
- [ ] Không route OAuth Manager, public manager creation hoặc guard `isAdmin`.
- [ ] Cross-namespace integration test xanh hai chiều.
- [ ] `pnpm test apps/admin`

## Checkpoint B

- [ ] User session không qua Manager guard và ngược lại.
- [ ] Guard sync; async chỉ nằm ở middleware/adapter.
- [ ] Challenge trước MFA không qua guard và không tạo full session.
- [ ] Human security reviewer approve diff.

## Task 5 — Làm refresh lifecycle

- [ ] Token opaque; DB chỉ giữ hash.
- [ ] Rotation atomic; token cũ reuse thu hồi toàn bộ account sessions.
- [ ] Logout hiện tại và logout-all có semantics khác nhau, không ảnh hưởng account khác.
- [ ] Concurrency test và property “một token thành công tối đa một lần” xanh.
- [ ] Test khẳng định token không vào log/error/client session.
- [ ] `pnpm --filter @kidthink/auth test -- refresh`

## Task 6 — Làm CSRF và reauth

- [ ] State-changing request thiếu/mismatch CSRF bị 403.
- [ ] Safe methods không bị CSRF middleware chặn.
- [ ] Reauth hết hạn đúng 5 phút và chỉ nâng current session.
- [ ] `details.methods` phản ánh method khả dụng, không chạy OAuth/TOTP flow trước roadmap.
- [ ] `pnpm --filter @kidthink/auth test -- csrf reauth`

## Task 7 — Hoàn thiện actor-boundary ports

- [ ] Không active child trả 428 `NO_ACTIVE_CHILD`.
- [ ] Cookie giả mạo child của User khác trả 404 qua fake ownership adapter contract test.
- [ ] Ownership query luôn nhận User ID từ authenticated context.
- [ ] Entitlement đọc request-time qua async port, không nằm trong session.
- [ ] `pnpm --filter @kidthink/auth test -- actor-boundaries`

## Checkpoint C

- [ ] Test âm và dương phủ Tasks 2–7.
- [ ] Audit/rate-limit/OAuth mới là port; không khai concrete behavior đã xong.
- [ ] Không route login/register/UI ngoài phạm vi trong diff.
- [ ] `pnpm check && pnpm test && pnpm lint:specs` xanh.

## Task 8 — Đóng evidence và tiến độ

- [ ] Mỗi `BR-ACT-*` và `BR-AUT-*` có test tham chiếu và assertion đúng hành vi.
- [ ] Human thứ hai hoàn tất security checklist CRITICAL/HIGH.
- [ ] `pnpm audit --prod` không có critical/high reachable chưa xử lý.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress`
- [ ] Chỉ promote spec sang `implemented` khi đủ evidence.
- [ ] Chỉ tick P0.3 khi cả hai spec `implemented` và `check:progress` tự xanh; thiếu evidence thì giữ ô trống và ghi blocker.

> Blocker đã biết: `AUTH-TOKENS-SESSIONS` còn sở hữu `BR-AUT-08..10` và `BR-AUT-17`, thuộc
> các bước đăng nhập/rate-limit/SNS/MFA sau. Không promote spec hoặc tick P0.3 chỉ bằng evidence
> foundation trong Task #16.

## Final checkpoint

- [ ] P0.3 hoàn tất mà không kéo implementation P0.9b/P0.10/P0.11b/P1 lên sớm.
- [ ] Không secret/token/provider credential trong source, test snapshot hoặc log.
- [ ] Working tree không mất thay đổi ngoài phạm vi.
- [ ] Human review hoàn tất; sẵn sàng lập plan P0.4.
