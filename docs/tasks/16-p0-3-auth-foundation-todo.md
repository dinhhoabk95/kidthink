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
- [x] Human thứ hai review threat model, sáu vùng nhạy cảm và ngoại lệ Task #14.
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

- [x] Task 0 được human thứ hai approve.
- [x] Supply-chain review hoàn tất.
- [x] Ngoại lệ Task #14 và các cổng test/review đã được ghi trong canonical contract.
- [x] `pnpm check && pnpm lint:specs` xanh.

## Task 2 — Định nghĩa public contract `@kidthink/auth`

- [x] Viết domain types User/Manager loại trừ nhau.
- [x] Viết structured error mapping theo registry.
- [x] Viết port cho session store, rate limit, audit, ownership và entitlement.
- [x] Viết test âm trước cho cross-audience, Promise guard và dual context.
- [x] `pnpm --filter @kidthink/auth test -- contracts`
- [x] `pnpm --filter @kidthink/auth typecheck`

## Task 3 — Làm User session slice

- [x] Dựng Nuxt runtime tối thiểu cho `apps/web`.
- [x] Middleware verify JWT access đúng một lần và chỉ gắn User context.
- [x] Sidebase Local `getSession`/SSR chạy với access cookie `HttpOnly`; JavaScript không đọc raw JWT.
- [x] `requireUserAuth` là sync; missing/wrong audience trả 401.
- [x] Cookie/payload test đúng contract, không role/tier/package/entitlement.
- [x] `pnpm test apps/web`

## Task 4 — Làm Manager session slice

- [x] Dựng adapter riêng cho `apps/admin`.
- [x] Cookie, secret và audience không dùng chung với User.
- [x] `requireManagerAuth`/`requireRole` kiểm ở server.
- [x] Không route OAuth Manager, public manager creation hoặc guard `isAdmin`.
- [x] Cross-namespace integration test xanh hai chiều.
- [x] `pnpm test apps/admin`

## Checkpoint B

- [x] User session không qua Manager guard và ngược lại.
- [x] Guard sync; async chỉ nằm ở middleware/adapter.
- [x] Challenge trước MFA không qua guard và không tạo full session.
- [x] Human security reviewer approve diff.

## Task 5 — Làm refresh lifecycle

- [x] Token opaque; DB chỉ giữ hash.
- [x] Rotation atomic; token cũ reuse thu hồi toàn bộ account sessions.
- [x] Logout hiện tại và logout-all có semantics khác nhau, không ảnh hưởng account khác.
- [x] Concurrency test và property “một token thành công tối đa một lần” xanh.
- [x] Test khẳng định token không vào log/error/client session.
- [x] `pnpm --filter @kidthink/auth test -- refresh`

## Task 6 — Làm CSRF và reauth

- [x] State-changing request thiếu/mismatch CSRF bị 403.
- [x] Safe methods không bị CSRF middleware chặn.
- [x] Reauth hết hạn đúng 5 phút và chỉ nâng current session.
- [x] `details.methods` phản ánh method khả dụng, không chạy OAuth/TOTP flow trước roadmap.
- [x] `pnpm --filter @kidthink/auth test -- csrf reauth`

## Task 7 — Hoàn thiện actor-boundary ports

- [x] Không active child trả 428 `NO_ACTIVE_CHILD`.
- [x] Cookie giả mạo child của User khác trả 404 qua fake ownership adapter contract test.
- [x] Ownership query luôn nhận User ID từ authenticated context.
- [x] Entitlement đọc request-time qua async port, không nằm trong session.
- [x] `pnpm --filter @kidthink/auth test -- actor-boundaries`

## Checkpoint C

- [x] Test âm và dương phủ Tasks 2–7.
- [x] Audit/rate-limit/OAuth mới là port; không khai concrete behavior đã xong.
- [x] Không route login/register/UI ngoài phạm vi trong diff.
- [x] `pnpm check && pnpm test && pnpm lint:specs` xanh.

## Task 8 — Đóng evidence và tiến độ

- [x] Mỗi `BR-ACT-*` và `BR-AUT-*` có test tham chiếu và assertion đúng hành vi.
- [x] Human thứ hai hoàn tất security checklist CRITICAL/HIGH.
- [x] `pnpm audit --prod` không có critical/high reachable chưa xử lý.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress`
- [x] Chỉ promote spec sang `implemented` khi đủ evidence.
- [x] Chỉ tick P0.3 khi cả hai spec `implemented` và `check:progress` tự xanh; thiếu evidence thì giữ ô trống và ghi blocker.

## Final checkpoint

- [x] P0.3 hoàn tất mà không kéo implementation P0.9b/P0.10/P0.11b/P1 lên sớm.
- [x] Không secret/token/provider credential trong source, test snapshot hoặc log.
- [x] Working tree không mất thay đổi ngoài phạm vi.
- [x] Human review hoàn tất; sẵn sàng lập plan P0.4.
