# Kế hoạch — Task #53: P2.11 — MFA tuỳ chọn cho User

> Viết 2026-08-10 · cập nhật sau review bảo mật 2026-08-11.
> Bước sở hữu: **P2.11** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Contract chính: [`mfa.md`](../specs/03-account/mfa.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

MFA cho User là tính năng **tuỳ chọn**, `mvp: false`. Nó không được trở thành điều kiện
go-live chỉ vì nằm ở P2.11. Tuy nhiên, quyết định đó hiện chưa được cổng máy thực thi:
`check:progress` vẫn chặn cổng phase nếu **bất kỳ** spec nào của phase chưa
`implemented`, kể cả `mvp: false`. Vì vậy việc bắt buộc đầu tiên của kế hoạch là sửa
ngữ nghĩa cổng và viết test chống hồi quy; phần MFA có thể được hoãn sau khi cổng P2 đạt.

Hai rủi ro bảo mật chi phối thứ tự triển khai:

1. Sau yếu tố thứ nhất, MFA challenge phải gắn với đúng User và đúng lần đăng nhập bằng một
   challenge credential ngắn hạn, một mục đích, dùng một lần. Chỉ kiểm “không phát access
   cookie” là chưa đủ.
2. Reset MFA khi mất mọi yếu tố là **một đường xác thực thay thế**, không phải một nút admin.
   Luồng này cần contract được người sở hữu phê duyệt, trạng thái lưu bền, email verification,
   thời gian chờ, audit, thông báo và chuyển trạng thái nguyên tử.

## 0. Điều kiện tiên quyết

### 0.1 Trạng thái hiện tại

Đo ngày 2026-08-11: các spec phụ thuộc dưới đây vẫn mang `status: approved`, chưa phải
`implemented`. Vì đây là kế hoạch tương lai, tên phase chỉ nói thứ tự dự kiến; **không**
được đọc mục “đã có” như bằng chứng code đã tồn tại.

| Dependency                           | Bước dự kiến | Điều kiện vào Task 3 trở đi                                                     |
| ------------------------------------ | -----------: | ------------------------------------------------------------------------------- |
| `AUTH-TOKENS-SESSIONS`               |         P0.3 | reauth §7.4 chạy với password, SNS và TOTP                                      |
| Schema identity                      |         P0.7 | `mfa_settings`, `mfa_recovery_codes`, opaque session/challenge primitives đã migrate local |
| `ADMIN-AUTH`                         |       P0.11b | challenge credential và TOTP dùng lại được, không viết bản thứ hai              |
| `NOTIFICATION-SERVICE` · `AUDIT-LOG` |           P0 | registry và dispatcher chạy được                                                |
| `ACCOUNT-SETTINGS`                   |        P1.14 | `/me/settings` và reauth UX đã có                                               |
| `SOCIAL-LOGIN`                       |        P1.15 | nhánh SNS thật để kiểm `BR-MFA-09`                                              |
| P2.2 User management                 |         P2.2 | User detail read-only và cổng route `D-JB` đã có                                |

**Stop condition:** trước Task 3, nếu một dependency trên chưa `implemented` hoặc gate của
nó chưa xanh thì dừng Task #53; sửa ở task sở hữu dependency, không vá tắt trong P2.11.

### 0.2 Contract phải chốt trước code

- Người sở hữu phê duyệt lại `D-KW`…`D-KZ`, đặc biệt assurance của recovery.
- [`mfa.md`](../specs/03-account/mfa.md) không còn câu hỏi mở chặn P2 trước khi tạo migration/route.
- Public API, data state, error code, audit action và notification code đều đã vào canonical
  spec/registry.
- [`user-detail.md`](../specs/06-admin/user-detail.md) vẫn read-only: chỉ link sang surface recovery riêng, không mutation trực tiếp.

## 1. Quyết định

### D-KW — P2.11 không chặn cổng P2, và cổng máy phải phản ánh điều đó

[`mfa.md`](../specs/03-account/mfa.md) mang `mvp: false`. Cổng phase chỉ chờ các spec `mvp: true`; checkbox
**P2.11** vẫn chỉ được tick khi chính MFA đã `implemented`.

Task 0 phải:

- Thêm `mvp` vào model mà `check:progress` dùng.
- Cho `validatePhaseGates` bỏ qua spec `mvp: false`, nhưng giữ
  `validateStepSpecs`: tick P2.11 khi [`mfa.md`](../specs/03-account/mfa.md) chưa implemented vẫn đỏ.
- Sửa câu “mọi spec của phase” trong Task #14 thành “mọi spec `mvp: true` của phase”.
- Có test dương cho optional spec và test âm cho một spec `mvp: true` chưa xong.

Đây là increment độc lập và **phải làm trước khi kiểm cổng P2**, kể cả khi toàn bộ MFA được hoãn.

### D-KX — Reauth là cách duy nhất xác thực lại

Route dưới `/api/users/mfa/*` không nhận `password`. Bật, tắt và sinh lại mã
khôi phục gọi reauth §7.4, nên tài khoản chỉ-SNS vẫn tự quản lý được MFA. Cổng quét phải đỏ nếu
fixture route nhận `password` hoặc gửi SMS OTP.

### D-KY — Mọi yếu tố thứ nhất trả một challenge credential bị ràng buộc

Password và SNS dùng chung một state machine:

1. Yếu tố thứ nhất đúng và User đã bật MFA.
2. Server tạo opaque Redis challenge 256-bit **một mục đích, TTL tối đa 5 phút, dùng một lần**, ràng buộc ít nhất
   với `user_id`, auth method, audience và nonce.
3. Trả **428** `MFA_REQUIRED` cùng challenge; không session cookie, remember credential hay
   `active_sessions`.
4. `POST /api/guest/auth/users/mfa` nhận `{ code, challenge }`.
5. Chỉ sau khi consume challenge nguyên tử và verify code mới cấp opaque session/remember theo preference.

Challenge hết hạn, đã dùng, sai audience, sai User hoặc bị replay đều thất bại chung, không lộ
tài khoản. Dùng lại primitive của Manager; không tạo định dạng challenge thứ hai.

### D-KZ — Recovery là state machine; email + 48 giờ là đề xuất cần người phê duyệt

Không implement route reset cho đến khi người sở hữu chốt hai câu hỏi trong [`mfa.md`](../specs/03-account/mfa.md) §11.
Q1 (còn truy cập email chính chủ) và Q2 (mất cả SNS/email) **không tự động là cùng một ca**.
Nếu chưa có phương thức proofing được duyệt cho Q2, spec phải ghi rõ manual escalation ngoài hệ
thống; không được giả vờ rằng email verification giải quyết ca không còn truy cập email.

Contract đề xuất cho Q1:

```text
super_admin tạo request có reason
  → gửi token hash, một lần, TTL đã chốt tới email chính chủ
  → User xác minh email
  → chờ đủ 48 giờ từ requested_at
  → super_admin hoàn tất hoặc huỷ trên surface riêng
  → transaction tắt MFA + vô hiệu recovery codes + thu hồi sessions
  → audit từng transition + thông báo User
```

State tối thiểu:

```text
pending_verification → waiting → completed
                       ├──────→ cancelled
                       └──────→ expired
```

`complete` chỉ hợp lệ khi token email đã xác minh, `now >= requested_at + 48h`,
request vẫn `waiting` và MFA còn bật. Hai request complete đồng thời phải đúng một thành
công. Reset không đổi password, email hay status tài khoản, nhưng phải thu hồi mọi session cũ.

API đề xuất để Task 1 chốt:

- `POST /api/managers/users/{uuid}/mfa-recovery-requests` — tạo request, cần
  `super_admin` + `reason`.
- `GET /api/guest/auth/users/mfa-recovery/verify?token=...` — consume token email.
- `POST /api/managers/users/{uuid}/mfa-recovery-requests/{request_uuid}/complete`.
- `POST /api/managers/users/{uuid}/mfa-recovery-requests/{request_uuid}/cancel`.

`D-JB` chỉ cho phép closed list đã chốt, không mở wildcard “admin được sửa auth User”.
User detail chỉ dẫn tới surface recovery có audit riêng.

Nguồn kiểm chiếu khi chốt contract:
[OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
và [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html).

## 2. Data và API invariants

### 2.1 MFA hiện có

- `mfa_settings.secret_encrypted` không plaintext.
- `mfa_recovery_codes.code_hash` không lưu code thô; consume bằng conditional update
  trong transaction.
- Bật MFA: bump `session_version` để thu hồi phiên khác, rồi cấp lại opaque session
  hiện tại ở version mới; thiết bị đang bật MFA không bị logout ngoài ý muốn.
- Sinh bộ recovery mới: vô hiệu bộ cũ và insert bộ mới trong cùng transaction.

### 2.2 Metadata cho UI

Không có API đọc lại recovery code. Endpoint trạng thái chỉ được trả:

```ts
{
  enabled: boolean;
  confirmed_at: string | null;
  recovery_codes_remaining: number;
}
```

Không response nào sau lần sinh chứa secret, code cũ, code hash hay MFA challenge nội bộ.
Task 1 phải sửa entry point `GET /api/users/mfa/recovery-codes` đang gây hiểu nhầm thành
contract metadata rõ tên/shape.

### 2.3 Recovery request

Task 1 chốt tên cột và retention trước migration. Tối thiểu cần:
`uuid`, `user_id`, `status`, `requested_by_manager_id`,
`reason`, `requested_at`, `email_verified_at`, `eligible_at`,
`completed_at`, `completed_by_manager_id`, `cancelled_at`,
`expires_at`. Token verification lưu hash, expiry và consumed state; không lưu token thô.

## 3. Đồ thị phụ thuộc

```text
T0 sửa semantics cổng P2
T1 freeze contract + human approval
 └──→ T2 registry
       ├──→ T3 setup/verify
       │     ├──→ T4 login challenge
       │     └──→ T5 disable/regenerate/metadata
       └──→ T6 recovery request + email verification
             └──→ T7 recovery complete/cancel
                   └──→ T8 admin recovery surface

T3 + T5 ──→ T9 /me/settings/security
T4 + T5 + T7 + T8 + T9 ──→ T10 evidence/promote

T0 ──→ cổng P2 độc lập; T1…T10 không chặn cổng P2
```

## 4. Task

### Task 0 — Sửa semantics cổng phase cho spec optional

**Mô tả:** Làm `D-KW` có hiệu lực trong Task #14 và `check:progress`.

**Tiêu chí nghiệm thu**

- [ ] Phase gate bỏ qua spec `mvp: false`, nhưng step checkbox của chính spec vẫn cần
      `implemented`.
- [ ] Test: P2 còn một optional spec approved → gate được phép xanh; đổi spec đó thành
      `mvp: true` → gate đỏ.
- [ ] Wording Task #14 và hành vi script khớp nhau; không nới gate BR test của spec implemented.

**Kiểm chứng**

- [ ] `pnpm test -- check-progress` · `pnpm check:progress` xanh.

**Bề mặt dự kiến:** `scripts/check-progress-lib.ts` ·
`scripts/check-progress.ts` · `scripts/tests/check-progress.test.ts` ·
`docs/tasks/14-implementation-sequence-plan.md`.

**Phụ thuộc:** không · **Cỡ:** M

### Task 1 — Freeze contract MFA và recovery

**Mô tả:** Người sở hữu chốt challenge, metadata và recovery trước code; không đóng câu hỏi mở
sau implementation.

**Tiêu chí nghiệm thu**

- [ ] Human approve `D-KW`…`D-KZ`; tách rõ Q1 và Q2, ghi risk acceptance nếu
      recovery dựa vào email + chờ 48 giờ.
- [ ] [`mfa.md`](../specs/03-account/mfa.md) có actors, state/data, API request/response, TTL/expiry, error behavior,
      concurrency và negative acceptance criteria đầy đủ.
- [ ] [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) sở hữu challenge/session invariant; [`user-detail.md`](../specs/06-admin/user-detail.md)
      chỉ thêm link sang surface riêng; schema spec sở hữu recovery request/token purpose.

**Kiểm chứng**

- [ ] `pnpm lint:specs` xanh; §11 không còn câu hỏi chặn P2 chưa được quyết.

**Bề mặt dự kiến:** [`mfa.md`](../specs/03-account/mfa.md) · [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) ·
[`user-detail.md`](../specs/06-admin/user-detail.md) · [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md).

**Phụ thuộc:** human decision · **Cỡ:** M

### Task 2 — Đăng ký error, audit và notification

**Mô tả:** Đưa mọi identifier mới vào registry trước khi route dùng.

**Tiêu chí nghiệm thu**

- [ ] Có error riêng cho token recovery sai/hết hạn, request chưa đủ 48 giờ, request terminal
      hoặc conflict; không tái dùng `ADMIN_NOTE_REQUIRED` sai ngữ nghĩa.
- [ ] Audit registry có action tạo, xác minh, hoàn tất và huỷ recovery; action admin mang reason.
- [ ] Notification registry có loại request/verification và completed/cancelled cần thiết, không
      tracking pixel và không opt-out cho email bảo mật.

**Kiểm chứng**

- [ ] `pnpm lint:specs` xanh; quét route fixture dùng code chưa đăng ký → đỏ.

**Bề mặt dự kiến:** [`error-codes.md`](../specs/00-foundation/error-codes.md) · [`audit-log.md`](../specs/01-platform/audit-log.md) ·
[`notification-service.md`](../specs/01-platform/notification-service.md) · test registry.

**Phụ thuộc:** T1 · **Cỡ:** M

### Checkpoint A — Contract

- [ ] Human đã review diff contract và quyết định recovery.
- [ ] T0–T2 xanh; không migration, route hay UI MFA nào được viết trước checkpoint này.
- [ ] Mọi dependency ở §0.1 mang `implemented`; nếu chưa thì dừng.

### Task 3 — Bật và xác nhận MFA

**Mô tả:** Vertical slice setup → verify → hiển thị recovery code đúng một lần.

**Tiêu chí nghiệm thu**

- [ ] `POST /api/users/mfa/setup` cần auth + reauth ≤5 phút; secret lưu mã hoá;
      `verify` đúng mã mới set `confirmed_at` và sinh 10 code hash.
- [ ] `BR-MFA-12`: sinh secret/URI và validate TOTP qua `otpauth` trong `packages/auth`;
      gate âm đỏ nếu có Base32, HMAC, HOTP/TOTP implementation tự viết.
- [ ] TOTP ±1 bước; sai lẻ trả `MFA_INVALID_CODE`, 5 lần khoá 15 phút; test âm viết
      trước code và tham chiếu `BR-MFA-01/02/04/10`.
- [ ] Bật MFA thu hồi phiên khác nhưng cấp lại phiên hiện tại ở `session_version`
      mới; test hai thiết bị chứng minh A còn dùng được, B nhận `SESSION_REVOKED`.

**Kiểm chứng**

- [ ] `pnpm test -- mfa-setup` xanh.

**Bề mặt dự kiến:** `packages/auth` MFA adapter · setup/verify routes · session store · integration test.

**Phụ thuộc:** Checkpoint A · **Cỡ:** M

### Task 4 — Challenge MFA sau password hoặc SNS

**Mô tả:** Dùng một challenge primitive cho cả hai yếu tố thứ nhất.

**Tiêu chí nghiệm thu**

- [ ] Password và SNS đúng trả 428 + opaque challenge; không session/remember cookie và không
      `active_sessions` trước MFA.
- [ ] `POST /api/guest/auth/users/mfa` nhận `{ code, challenge }`, consume
      challenge nguyên tử rồi mới cấp session.
- [ ] Expired, replay, wrong audience, cross-account và challenge dùng qua auth guard đều thất
      bại; TOTP và recovery code đều đi qua cùng route.

**Kiểm chứng**

- [ ] `pnpm test -- mfa-challenge` ·
      `pnpm test:e2e -- login-with-mfa` xanh cho password và SNS.

**Bề mặt dự kiến:** shared challenge service · password/SNS login branches · User MFA route · tests.

**Phụ thuộc:** T3 · P1.15 · **Cỡ:** M

### Task 5 — Tắt MFA, sinh lại code và đọc metadata

**Mô tả:** Hoàn tất lifecycle tự phục vụ với thao tác nguyên tử.

**Tiêu chí nghiệm thu**

- [ ] Disable và regenerate cần reauth ≤5 phút + code hợp lệ; không route nào nhận
      `password`, không SMS OTP.
- [ ] Hai request đồng thời dùng cùng recovery code → đúng một thành công; regenerate vô hiệu
      bộ cũ và tạo bộ mới trong cùng transaction.
- [ ] Endpoint status chỉ trả `enabled`, `confirmed_at`,
      `recovery_codes_remaining`; test response không chứa secret/code/hash.

**Kiểm chứng**

- [ ] `pnpm test -- mfa-lifecycle` xanh, gồm race test và
      `BR-MFA-03/05/07/11`.

**Bề mặt dự kiến:** MFA service · disable/regenerate/status routes · integration test · route gate.

**Phụ thuộc:** T3 · **Cỡ:** M

### Checkpoint B — MFA core

- [ ] T3–T5 xanh; password và SNS đều không bypass MFA.
- [ ] Challenge/recovery code replay và hai race test đều đúng một winner.
- [ ] `pnpm check && pnpm test` xanh; human review diff auth trước recovery.

### Task 6 — Tạo recovery request và xác minh email

**Mô tả:** Vertical slice từ admin tạo request đến User xác minh email; chưa được tắt MFA.

**Tiêu chí nghiệm thu**

- [ ] Migration local tạo recovery request/token purpose theo contract; token ngẫu nhiên, lưu
      hash, TTL và single-use; tạo request cần `super_admin` + reason.
- [ ] Email verification chuyển đúng request từ `pending_verification` sang
      `waiting`; token sai/hết hạn/replay trả lỗi đã đăng ký và không lộ User.
- [ ] Tạo/gửi lại đồng thời không tạo hai request active hoặc hai token sống; audit và
      notification ghi đúng transition.

**Kiểm chứng**

- [ ] `pnpm test -- mfa-recovery-request` · migration test xanh.

**Bề mặt dự kiến:** identity schema/migration · recovery service · create/verify routes · tests.

**Phụ thuộc:** T2 · Checkpoint A · **Cỡ:** M

### Task 7 — Hoàn tất hoặc huỷ recovery nguyên tử

**Mô tả:** Chỉ complete request đủ điều kiện; không gộp create và complete trong một route.

**Tiêu chí nghiệm thu**

- [ ] Complete trước email verification hoặc trước 48 giờ thất bại với error đã đăng ký và
      `details.eligible_at`; request terminal không dùng lại.
- [ ] Hai complete đồng thời → đúng một thành công; transaction tắt MFA, xoá/vô hiệu recovery
      codes, thu hồi sessions và terminalize request cùng lúc.
- [ ] Password, email và status User không đổi; complete/cancel đều audit, User nhận notification.

**Kiểm chứng**

- [ ] `pnpm test -- mfa-recovery-complete` xanh, gồm time boundary và race test.

**Bề mặt dự kiến:** recovery service · complete/cancel routes · session store · integration test.

**Phụ thuộc:** T6 · **Cỡ:** M

### Task 8 — Surface recovery riêng cho admin

**Mô tả:** Giữ User detail read-only và dẫn sang workflow có audit riêng.

**Tiêu chí nghiệm thu**

- [ ] User detail chỉ hiển thị link khi User đã bật MFA; không gọi mutation trực tiếp.
- [ ] Surface riêng hiển thị state, thời điểm đủ 48 giờ, reason và nút complete/cancel đúng role;
      UI không cho thao tác sớm nhưng server vẫn là nguồn quyền.
- [ ] `D-JB` cho phép đúng closed list recovery routes; fixture route admin khác sửa
      auth User làm gate đỏ.

**Kiểm chứng**

- [ ] `pnpm test:e2e -- admin-mfa-recovery` · route gate xanh.

**Bề mặt dự kiến:** User detail link · recovery page/component · API client · E2E test.

**Phụ thuộc:** T7 · P2.2 · **Cỡ:** M

### Checkpoint C — Recovery

- [ ] Request → email verify → 48 giờ giả lập → complete chạy end-to-end.
- [ ] Early, expired, replay, cancelled, duplicate active request và concurrent complete đều đỏ.
- [ ] Human review diff auth/admin/data; không chạy migration ngoài local.

### Task 9 — Trang bảo mật của User

**Mô tả:** Hoàn tất UX tự phục vụ ở `/me/settings/security`.

**Tiêu chí nghiệm thu**

- [ ] Hiện trạng thái/metadata an toàn; setup có QR + secret chữ; 10 recovery code chỉ hiện
      trong response verify một lần và có tải về.
- [ ] Disable/regenerate đều qua reauth; cảnh báo bật MFA thu hồi thiết bị khác; MFA được diễn
      đạt là tuỳ chọn, không nag/popup.
- [ ] Khi hết code, chỉ dẫn đúng recovery contract đã duyệt; keyboard và screen reader đi hết
      flow, không lộ secret qua log/analytics.

**Kiểm chứng**

- [ ] `pnpm test:e2e -- me-security` xanh.

**Bề mặt dự kiến:** settings page · MFA components · API client · E2E/accessibility test.

**Phụ thuộc:** T3 · T5 · contract recovery đã duyệt · **Cỡ:** M

### Task 10 — Evidence và promote P2.11

**Mô tả:** Chỉ promote feature, không buộc cổng P2 chờ feature optional.

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-MFA-*` và BR recovery mới có test tham chiếu; mọi negative/race case ở
      các checkpoint xanh.
- [ ] [`mfa.md`](../specs/03-account/mfa.md) sang `implemented`; không còn câu hỏi mở chặn phase; tick P2.11
      chỉ sau khi `check:progress` chấp nhận evidence thật.
- [ ] Chạy full gate và lưu evidence review; không auto-merge, không chạy migration ngoài local.

**Kiểm chứng**

- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress`
      xanh.

**Bề mặt dự kiến:** tests/evidence · [`mfa.md`](../specs/03-account/mfa.md) ·
[`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).

**Phụ thuộc:** T4 · T5 · T7 · T8 · T9 · **Cỡ:** S

## 5. Cổng P2 chạy độc lập

Sau T0, cổng P2 được kiểm khi toàn bộ spec `mvp: true` của P2 và các điều kiện
[`SPEC.md`](../SPEC.md) §13 đã đạt. Không chờ T1–T10:

- [ ] Một order thật đi hết create → proof → approval → entitlement.
- [ ] Manager tạo và publish game level từ emoji, không viết code.
- [ ] Giá sellable đã chốt; không `PENDING_PRICE_VND`.
- [ ] Mọi điều kiện khác của [`SPEC.md`](../SPEC.md) §13 xanh.
- [ ] Test `check:progress` chứng minh [`mfa.md`](../specs/03-account/mfa.md) approved +
      `mvp: false` không chặn gate.

## 6. Rủi ro

| Rủi ro                                    | Ảnh hưởng                                 | Giảm thiểu                                                           |
| ----------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| Cổng máy vẫn coi optional là bắt buộc     | P2/go-live bị chặn sai                    | T0 sửa semantics + test hai chiều                                    |
| Challenge không bind với lần login        | Dùng code cho sai User hoặc replay        | `D-KY`: credential single-purpose, TTL, single-use, atomic consume   |
| Recovery yếu hơn đăng nhập thường         | Reset thành cửa sau chiếm tài khoản       | Human approve assurance; email verify + delay + audit; Q2 tách riêng |
| Hai request/complete cùng thắng           | Hai transition hoặc hai bộ code cùng sống | Conditional update + transaction + race tests                        |
| Bump token version giết cả phiên hiện tại | User bật MFA rồi bị logout ngoài dự kiến  | Reissue current session ở version mới                                |
| User detail biến thành màn hình mutation  | Vi phạm `BR-USD-03`                       | Link sang surface recovery riêng                                     |
| Error/audit/notification tự phát          | Contract drift và không truy vết được     | T2 registry-first                                                    |
| Plan giả định dependency đã có            | Vá chéo phase, tạo implementation thứ hai | Stop condition §0.1                                                  |

## 7. Giả định và điều kiện dừng

1. `D-KW` chỉ có hiệu lực sau T0; câu văn trong plan không thay được cổng máy.
2. T1–T10 là optional và có thể chạy sau cổng P2.
3. Mọi dependency phải `implemented` trước Task 3; trạng thái `approved` không đủ.
4. Recovery email + 48 giờ là **đề xuất**, không phải quyết định đã đóng cho tới human approval.
5. Nếu người sở hữu chưa chốt cách xử lý Q2, dừng recovery implementation; không tự suy ra
   identity proofing hoặc bằng chứng hỗ trợ.

## 8. Ngoài phạm vi

- Bắt buộc MFA cho User hoặc đưa vào MVP.
- SMS OTP.
- Passkey/WebAuthn.
- Viết lại MFA Manager hoặc tạo challenge format thứ hai.
- Admin đổi mật khẩu, email hay status User trong recovery.
- Mutation MFA trực tiếp từ User detail.
- Auto-merge, migration ngoài local hoặc phát hành.
