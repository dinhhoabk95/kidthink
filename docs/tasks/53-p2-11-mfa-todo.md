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

- [x] Đo lại trạng thái dependency; không coi `approved` là `implemented`.
- [x] P0.3 reauth chạy với password, SNS và TOTP.
- [x] P0.11b có challenge/TOTP primitive dùng lại được.
- [x] P1.14 settings và P1.15 SNS đã implemented.
- [x] P2.2 User detail read-only và cổng `D-JB` đã implemented.
- [x] Notification, audit và error registry đã implemented.
- [x] Human approve kế hoạch và `D-KW`…`D-KZ`.
- [x] Tạo nhánh riêng; không đụng thay đổi ngoài Task #53.

---

## Task 0 — Sửa semantics cổng optional

- [x] `ProgressSpec` đọc được `mvp`.
- [x] Phase gate bỏ qua spec `mvp: false`.
- [x] Step checkbox P2.11 vẫn đỏ nếu [`mfa.md`](../specs/03-account/mfa.md) chưa `implemented`.
- [x] Test dương: optional approved không chặn gate.
- [x] Test âm: đổi optional thành `mvp: true` thì gate đỏ.
- [x] Task #14 ghi “mọi spec `mvp: true` của phase”.
- [x] `pnpm test -- check-progress && pnpm check:progress` xanh.

## Task 1 — Freeze contract MFA và recovery

- [x] Human chốt challenge credential: binding, audience, TTL, single-use và replay behavior.
- [x] Human chốt Q1 recovery khi còn email; ghi rõ email + 48 giờ là risk acceptance.
- [x] Human chốt riêng Q2 khi mất cả SNS/email; không tự coi Q1 giải quyết Q2.
- [x] [`mfa.md`](../specs/03-account/mfa.md) có state/data/API/error/concurrency đầy đủ trước code.
- [x] [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) sở hữu challenge/session invariants.
- [x] [`user-detail.md`](../specs/06-admin/user-detail.md) chỉ thêm link sang recovery surface riêng.
- [x] Schema spec sở hữu recovery request và token purpose.
- [x] `pnpm lint:specs` xanh; §11 không còn câu hỏi chặn P2 chưa được quyết.

## Task 2 — Registry-first

- [x] Đăng ký error recovery riêng; không tái dùng `ADMIN_NOTE_REQUIRED` sai ngữ nghĩa.
- [x] Đăng ký audit action create/verify/complete/cancel; admin action có reason.
- [x] Đăng ký notification request/verification và completed/cancelled cần thiết.
- [x] Fixture dùng code chưa đăng ký làm gate đỏ.
- [x] `pnpm lint:specs` xanh.

## Checkpoint A — Contract

- [x] Human review diff T0–T2.
- [x] Không migration/route/UI MFA nào xuất hiện trước checkpoint.
- [x] Mọi dependency trong plan §0.1 đã `implemented`; nếu chưa thì dừng.

---

## Task 3 — Bật và xác nhận MFA

- [x] Catalog pin `otpauth` `^9.5`; chỉ adapter MFA trong `packages/auth` import trực tiếp.
- [x] `BR-MFA-12` secret/URI/validate đi qua `otpauth`; không Base32/HMAC/TOTP tự viết.
- [x] Setup cần auth + reauth ≤5 phút; secret lưu mã hoá.
- [x] Verify đúng mới set `confirmed_at` và sinh 10 recovery code hash.
- [x] TOTP ±1 bước; sai 5 lần khoá 15 phút.
- [x] Recovery code chỉ hiện trong response sinh code một lần.
- [x] Bật MFA bump `session_version`, reissue phiên A ở version mới.
- [x] Test 2 thiết bị: A còn dùng được, B nhận `SESSION_REVOKED`.
- [x] `pnpm test -- mfa-setup` xanh với `BR-MFA-01/02/04/06/10`.

## Task 4 — Challenge sau password hoặc SNS

- [x] Password đúng + MFA bật → 428 + opaque Redis challenge; không session/remember cookie.
- [x] SNS đúng + MFA bật → cùng 428 + challenge; không bypass.
- [x] `POST /api/guest/auth/users/mfa` nhận `{ code, challenge }`.
- [x] Consume challenge nguyên tử trước khi cấp session.
- [x] Expired, replay, wrong audience và cross-account challenge đều thất bại.
- [x] Challenge không qua được `requireUserAuth()`.
- [x] TOTP và recovery code dùng cùng route.
- [x] `pnpm test -- mfa-challenge` và E2E password/SNS xanh.

## Task 5 — Disable, regenerate và metadata

- [x] Disable/regenerate cần reauth ≤5 phút + code hợp lệ.
- [x] Không route MFA nhận `password`; không route auth gửi SMS.
- [x] Hai request cùng recovery code → đúng một thành công.
- [x] Regenerate vô hiệu bộ cũ + tạo bộ mới trong cùng transaction.
- [x] Status chỉ trả `enabled`, `confirmed_at`,
      `recovery_codes_remaining`.
- [x] Response status không có secret, recovery code hay hash.
- [x] `pnpm test -- mfa-lifecycle` xanh với race tests.

## Checkpoint B — MFA core

- [x] Password và SNS đều không bypass MFA.
- [x] Challenge replay và recovery-code race đều đúng một winner.
- [x] `pnpm check && pnpm test` xanh.
- [x] Human review diff auth trước recovery.

---

## Task 6 — Recovery request và email verification

- [x] Migration local tạo recovery request/token purpose đúng contract.
- [x] Token ngẫu nhiên, lưu hash, TTL, single-use; không lưu token thô.
- [x] Create request cần `super_admin` + reason.
- [x] Verify email chuyển `pending_verification` → `waiting`.
- [x] Token sai/hết hạn/replay không lộ User và không đổi state.
- [x] Không có hai active request hoặc hai verification token sống.
- [x] Audit + notification đúng transition.
- [x] `pnpm test -- mfa-recovery-request` và migration test xanh.

## Task 7 — Complete hoặc cancel recovery

- [x] Chưa verify email → complete thất bại.
- [x] Chưa đủ 48 giờ → error đã đăng ký + `details.eligible_at`.
- [x] Request completed/cancelled/expired không dùng lại.
- [x] Hai complete đồng thời → đúng một thành công.
- [x] Transaction tắt MFA, vô hiệu recovery codes, thu hồi sessions và terminalize request.
- [x] Password, email và status User không đổi.
- [x] Complete/cancel audit; User nhận notification.
- [x] `pnpm test -- mfa-recovery-complete` xanh.

## Task 8 — Admin recovery surface

- [x] User detail chỉ có link; không mutation trực tiếp.
- [x] Surface riêng hiện state, reason và `eligible_at`.
- [x] UI ẩn/disable action sớm; server vẫn chặn độc lập.
- [x] Chỉ `super_admin` complete/cancel được.
- [x] `D-JB` cho phép đúng closed list recovery route.
- [x] Fixture route admin khác sửa auth User làm gate đỏ.
- [x] `pnpm test:e2e -- admin-mfa-recovery` xanh.

## Checkpoint C — Recovery

- [x] Create → email verify → clock +48h → complete chạy end-to-end.
- [x] Early, expired, replay, cancel, duplicate active và concurrent complete đều đỏ.
- [x] Human review diff auth/admin/data.
- [x] Không chạy migration ngoài local.

---

## Task 9 — `/me/settings/security`

- [x] Hiện trạng thái + metadata an toàn.
- [x] Setup có QR + secret chữ; 10 code chỉ hiện một lần + tải về.
- [x] Disable/regenerate đều qua reauth.
- [x] Cảnh báo thiết bị khác bị thu hồi; MFA được nói rõ là tuỳ chọn.
- [x] Hết code dẫn đúng recovery contract đã duyệt.
- [x] Keyboard và screen reader đi hết flow.
- [x] Không secret trong log/analytics.
- [x] `pnpm test:e2e -- me-security` xanh.

## Task 10 — Evidence và promote

- [x] Mỗi `BR-MFA-*` và BR recovery mới có test tham chiếu.
- [x] Mọi negative/race case tại Checkpoint A–C xanh.
- [x] [`mfa.md`](../specs/03-account/mfa.md) → `implemented`; không open question chặn phase.
- [x] Tick P2.11 chỉ khi `check:progress` chấp nhận evidence thật.
- [x] Full gate:
      `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress`.
- [x] Human review trước merge; không auto-merge, không migration ngoài local.

---

## Cổng P2 độc lập với T1–T10

- [x] T0 đã merge/review để optional spec không chặn sai.
- [x] Mọi spec `mvp: true` của P2 đã `implemented`.
- [x] Order thật đi hết create → proof → approval → entitlement.
- [x] Manager tạo và publish game level từ emoji, không viết code.
- [x] Giá sellable đã chốt; không `PENDING_PRICE_VND`.
- [x] Điều kiện [`SPEC.md`](../SPEC.md) §13 đạt đủ.
- [x] `check:progress` chứng minh [`mfa.md`](../specs/03-account/mfa.md) approved +
      `mvp: false` không chặn cổng P2.

## Điều kiện dừng

- [x] Dependency chưa implemented → quay lại task sở hữu, không vá trong P2.11.
- [x] Human chưa duyệt Q1/Q2 recovery → dừng trước Task 6.
- [x] Contract/registry chưa xanh → không tạo migration hoặc route.
- [x] Không có proofing được duyệt cho Q2 → ghi manual escalation đúng contract, không tự bịa.
