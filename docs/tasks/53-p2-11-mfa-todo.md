# Checklist — Task #53: P2.11 — MFA tuỳ chọn cho User

> Kế hoạch: [`53-p2-11-mfa-plan.md`](53-p2-11-mfa-plan.md).
> `mvp: false`: T0 sửa cổng P2 là bắt buộc; T1–T10 không chặn go-live.
> Tuyệt đối: challenge phải bind với lần login · recovery phải là state machine được human
> approve · không mutation trực tiếp từ User detail.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] Đo lại trạng thái dependency; không coi `approved` là `implemented`.
- [ ] P0.3 reauth chạy với password, SNS và TOTP.
- [ ] P0.11b có challenge/TOTP primitive dùng lại được.
- [ ] P1.14 settings và P1.15 SNS đã implemented.
- [ ] P2.2 User detail read-only và cổng `D-JB` đã implemented.
- [ ] Notification, audit và error registry đã implemented.
- [ ] Human approve kế hoạch và `D-KW`…`D-KZ`.
- [ ] Tạo nhánh riêng; không đụng thay đổi ngoài Task #53.

---

## Task 0 — Sửa semantics cổng optional

- [ ] `ProgressSpec` đọc được `mvp`.
- [ ] Phase gate bỏ qua spec `mvp: false`.
- [ ] Step checkbox P2.11 vẫn đỏ nếu [`mfa.md`](../specs/03-account/mfa.md) chưa `implemented`.
- [ ] Test dương: optional approved không chặn gate.
- [ ] Test âm: đổi optional thành `mvp: true` thì gate đỏ.
- [ ] Task #14 ghi “mọi spec `mvp: true` của phase”.
- [ ] `pnpm test -- check-progress && pnpm check:progress` xanh.

## Task 1 — Freeze contract MFA và recovery

- [ ] Human chốt challenge credential: binding, audience, TTL, single-use và replay behavior.
- [ ] Human chốt Q1 recovery khi còn email; ghi rõ email + 48 giờ là risk acceptance.
- [ ] Human chốt riêng Q2 khi mất cả SNS/email; không tự coi Q1 giải quyết Q2.
- [ ] [`mfa.md`](../specs/03-account/mfa.md) có state/data/API/error/concurrency đầy đủ trước code.
- [ ] [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) sở hữu challenge/session invariants.
- [ ] [`user-detail.md`](../specs/06-admin/user-detail.md) chỉ thêm link sang recovery surface riêng.
- [ ] Schema spec sở hữu recovery request và token purpose.
- [ ] `pnpm lint:specs` xanh; §11 không còn câu hỏi chặn P2 chưa được quyết.

## Task 2 — Registry-first

- [ ] Đăng ký error recovery riêng; không tái dùng `ADMIN_NOTE_REQUIRED` sai ngữ nghĩa.
- [ ] Đăng ký audit action create/verify/complete/cancel; admin action có reason.
- [ ] Đăng ký notification request/verification và completed/cancelled cần thiết.
- [ ] Fixture dùng code chưa đăng ký làm gate đỏ.
- [ ] `pnpm lint:specs` xanh.

## Checkpoint A — Contract

- [ ] Human review diff T0–T2.
- [ ] Không migration/route/UI MFA nào xuất hiện trước checkpoint.
- [ ] Mọi dependency trong plan §0.1 đã `implemented`; nếu chưa thì dừng.

---

## Task 3 — Bật và xác nhận MFA

- [ ] Catalog pin `otpauth` `^9.5`; chỉ adapter MFA trong `packages/auth` import trực tiếp.
- [ ] `BR-MFA-12` secret/URI/validate đi qua `otpauth`; không Base32/HMAC/TOTP tự viết.
- [ ] Setup cần auth + reauth ≤5 phút; secret lưu mã hoá.
- [ ] Verify đúng mới set `confirmed_at` và sinh 10 recovery code hash.
- [ ] TOTP ±1 bước; sai 5 lần khoá 15 phút.
- [ ] Recovery code chỉ hiện trong response sinh code một lần.
- [ ] Bật MFA bump `session_version`, reissue phiên A ở version mới.
- [ ] Test 2 thiết bị: A còn dùng được, B nhận `SESSION_REVOKED`.
- [ ] `pnpm test -- mfa-setup` xanh với `BR-MFA-01/02/04/06/10`.

## Task 4 — Challenge sau password hoặc SNS

- [ ] Password đúng + MFA bật → 428 + opaque Redis challenge; không session/remember cookie.
- [ ] SNS đúng + MFA bật → cùng 428 + challenge; không bypass.
- [ ] `POST /api/guest/auth/users/mfa` nhận `{ code, challenge }`.
- [ ] Consume challenge nguyên tử trước khi cấp session.
- [ ] Expired, replay, wrong audience và cross-account challenge đều thất bại.
- [ ] Challenge không qua được `requireUserAuth()`.
- [ ] TOTP và recovery code dùng cùng route.
- [ ] `pnpm test -- mfa-challenge` và E2E password/SNS xanh.

## Task 5 — Disable, regenerate và metadata

- [ ] Disable/regenerate cần reauth ≤5 phút + code hợp lệ.
- [ ] Không route MFA nhận `password`; không route auth gửi SMS.
- [ ] Hai request cùng recovery code → đúng một thành công.
- [ ] Regenerate vô hiệu bộ cũ + tạo bộ mới trong cùng transaction.
- [ ] Status chỉ trả `enabled`, `confirmed_at`,
      `recovery_codes_remaining`.
- [ ] Response status không có secret, recovery code hay hash.
- [ ] `pnpm test -- mfa-lifecycle` xanh với race tests.

## Checkpoint B — MFA core

- [ ] Password và SNS đều không bypass MFA.
- [ ] Challenge replay và recovery-code race đều đúng một winner.
- [ ] `pnpm check && pnpm test` xanh.
- [ ] Human review diff auth trước recovery.

---

## Task 6 — Recovery request và email verification

- [ ] Migration local tạo recovery request/token purpose đúng contract.
- [ ] Token ngẫu nhiên, lưu hash, TTL, single-use; không lưu token thô.
- [ ] Create request cần `super_admin` + reason.
- [ ] Verify email chuyển `pending_verification` → `waiting`.
- [ ] Token sai/hết hạn/replay không lộ User và không đổi state.
- [ ] Không có hai active request hoặc hai verification token sống.
- [ ] Audit + notification đúng transition.
- [ ] `pnpm test -- mfa-recovery-request` và migration test xanh.

## Task 7 — Complete hoặc cancel recovery

- [ ] Chưa verify email → complete thất bại.
- [ ] Chưa đủ 48 giờ → error đã đăng ký + `details.eligible_at`.
- [ ] Request completed/cancelled/expired không dùng lại.
- [ ] Hai complete đồng thời → đúng một thành công.
- [ ] Transaction tắt MFA, vô hiệu recovery codes, thu hồi sessions và terminalize request.
- [ ] Password, email và status User không đổi.
- [ ] Complete/cancel audit; User nhận notification.
- [ ] `pnpm test -- mfa-recovery-complete` xanh.

## Task 8 — Admin recovery surface

- [ ] User detail chỉ có link; không mutation trực tiếp.
- [ ] Surface riêng hiện state, reason và `eligible_at`.
- [ ] UI ẩn/disable action sớm; server vẫn chặn độc lập.
- [ ] Chỉ `super_admin` complete/cancel được.
- [ ] `D-JB` cho phép đúng closed list recovery route.
- [ ] Fixture route admin khác sửa auth User làm gate đỏ.
- [ ] `pnpm test:e2e -- admin-mfa-recovery` xanh.

## Checkpoint C — Recovery

- [ ] Create → email verify → clock +48h → complete chạy end-to-end.
- [ ] Early, expired, replay, cancel, duplicate active và concurrent complete đều đỏ.
- [ ] Human review diff auth/admin/data.
- [ ] Không chạy migration ngoài local.

---

## Task 9 — `/me/settings/security`

- [ ] Hiện trạng thái + metadata an toàn.
- [ ] Setup có QR + secret chữ; 10 code chỉ hiện một lần + tải về.
- [ ] Disable/regenerate đều qua reauth.
- [ ] Cảnh báo thiết bị khác bị thu hồi; MFA được nói rõ là tuỳ chọn.
- [ ] Hết code dẫn đúng recovery contract đã duyệt.
- [ ] Keyboard và screen reader đi hết flow.
- [ ] Không secret trong log/analytics.
- [ ] `pnpm test:e2e -- me-security` xanh.

## Task 10 — Evidence và promote

- [ ] Mỗi `BR-MFA-*` và BR recovery mới có test tham chiếu.
- [ ] Mọi negative/race case tại Checkpoint A–C xanh.
- [ ] [`mfa.md`](../specs/03-account/mfa.md) → `implemented`; không open question chặn phase.
- [ ] Tick P2.11 chỉ khi `check:progress` chấp nhận evidence thật.
- [ ] Full gate:
      `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress`.
- [ ] Human review trước merge; không auto-merge, không migration ngoài local.

---

## Cổng P2 độc lập với T1–T10

- [ ] T0 đã merge/review để optional spec không chặn sai.
- [ ] Mọi spec `mvp: true` của P2 đã `implemented`.
- [ ] Order thật đi hết create → proof → approval → entitlement.
- [ ] Manager tạo và publish game level từ emoji, không viết code.
- [ ] Giá sellable đã chốt; không `PENDING_PRICE_VND`.
- [ ] Điều kiện [`SPEC.md`](../SPEC.md) §13 đạt đủ.
- [ ] `check:progress` chứng minh [`mfa.md`](../specs/03-account/mfa.md) approved +
      `mvp: false` không chặn cổng P2.

## Điều kiện dừng

- [ ] Dependency chưa implemented → quay lại task sở hữu, không vá trong P2.11.
- [ ] Human chưa duyệt Q1/Q2 recovery → dừng trước Task 6.
- [ ] Contract/registry chưa xanh → không tạo migration hoặc route.
- [ ] Không có proofing được duyệt cho Q2 → ghi manual escalation đúng contract, không tự bịa.
