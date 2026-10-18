# Kế hoạch Task #289: Gửi email giao dịch thật cho xác thực, khôi phục mật khẩu và liên kết tài khoản (Transactional Email Dispatch)

Contract: `docs/specs/03-account/email-verification.md` (`BR-EVF-*`), `docs/specs/03-account/password-recovery.md` (`BR-PWR-01`, `BR-PWR-04`), `docs/specs/03-account/registration.md`, `docs/specs/03-account/social-login.md` (`BR-SCL-05`), `docs/specs/03-account/social-account-linking.md` (`BR-SLK-05`), `docs/specs/01-platform/notification-service.md` §3, §7, §8 (`BR-NOT-09..13`).

> **Ràng buộc cây làm việc.** Đang có thay đổi dở của người khác ở `apps/web/server/api/guest/auth/*` (`reset-password.post.ts`, `social-login.post.ts`, `social-ticket.get.ts`, `oauth/[provider]/callback.get.ts`, `mfa.post.ts`…), `apps/web/server/utils/reauth-runtime.ts` và `packages/auth/*`. Trước mỗi slice: chạy `git status --short`, đọc diff của file sắp đụng, phối hợp với người đang sửa; **không** ghi đè, **không** `git checkout`/`git stash`; sao lưu file ra ngoài repo trước khi ghi. Commit chỉ `git add` đúng file của task này.

---

## 1. Bối cảnh & bằng chứng gap

Đường gửi email giao dịch chuẩn đã có: `dispatchTransactionalEmail` (`packages/notification/src/dispatch.ts:27`) ghi `notifications` + `notification_deliveries` trong một transaction rồi `enqueue("email:send", …)`. Ba route đã dùng nó (`users/email.post.ts:90`, `users/password.post.ts`, `users/account/delete.post.ts:40`). Các route khác thì không:

| Route | Bằng chứng | Hệ quả |
| --- | --- | --- |
| `guest/auth/users/register.post.ts:185` | chỉ `db.insert(notifications)` với `payload: { token: rawToken, … }`, không delivery, không enqueue | Email xác thực không bao giờ gửi → user kẹt `pending_verification` (`BR-EVF-*`, registration) |
| `users/auth/resend-verification.post.ts` | cùng khuôn INSERT trần | Nút "gửi lại" vô tác dụng |
| `guest/auth/users/forgot-password.post.ts:84-103` | INSERT `notifications` + delivery `queued`, không enqueue; payload `token` thô | Email reset không gửi (`BR-PWR-01`) |
| `guest/auth/users/reset-password.post.ts:122-135` | như trên | Email báo đã đổi mật khẩu không gửi (`BR-PWR-04`) |
| `guest/auth/users/social-login.post.ts` | rg không thấy `notifications`/dispatch ở nhánh email chưa xác minh | Vi phạm `BR-SCL-05` |
| `guest/auth/oauth/[provider]/callback.get.ts:155-178`, `users/social-identities/[provider].delete.ts` | ghi `social_identities` + audit, không gửi email | Vi phạm `BR-SLK-05` |

Thêm hai lỗi nội dung:

- **Raw token nằm trong `notifications.payload`** (`register.post.ts:185`, `forgot-password.post.ts:84-103`, cả `users/email.post.ts:96` dù route này đã dùng dispatch). Bảng `notifications` được đọc bởi inbox/admin resend/preview; ai đọc được hàng đó là chiếm được tài khoản. Trái tinh thần `BR-EVF-01` (chỉ lưu hash token).
- **Payload thiếu biến template**: `packages/notification/src/mjml-renderer.ts:51` khai `email_verification.requiredVars = ["url", "code"]`, `:71` `password_reset` cần `url`; route chỉ truyền `token` → renderer ném lỗi thiếu biến dù có enqueue.

`notification-service.md` §8 khai `GET /api/users/notification-preferences` nhưng chỉ có `apps/web/server/api/users/notification-preferences.put.ts`. Route SES thật là `apps/web/server/api/guest/webhooks/ses-sns.post.ts` (verifier `packages/notification/src/sns-verifier.ts`): chưa kiểm topic ARN allow-list và timestamp (`BR-NOT-11`). `BR-NOT-09..13` không có test nêu mã.

## 2. Thiết kế

### 2.1 Tách payload bền và bí mật một lần (slice bảo mật)

- Mở rộng `TransactionalEmailInput` (`packages/notification/src/dispatch.ts`) thêm trường `secrets?: Readonly<Record<string, string>>`.
  - `notifications.payload` chỉ lưu `payload` (không bí mật).
  - Job `email:send` nhận `{ ...payload, ...secrets }` để consumer render (`apps/worker/src/consumers/email-send.ts`). Kiểm cấu hình job (`removeOnComplete`/`removeOnFail` trong `@mindkid/queue`) để dữ liệu bí mật không nằm lâu trong Valkey; ghi rõ TTL trong `notification-service.md` §7.
  - Admin resend (`notification-admin`) với template có bí mật: **không** resend được từ payload bền — trả lỗi domain rõ ràng hoặc yêu cầu người dùng tự bấm "gửi lại". Ghi vào spec trước khi sửa code.
- Migration dữ liệu (file migration **mới**, không sửa migration cũ): xoá khoá `token` khỏi `notifications.payload` của các `template_code` `email_verification`, `password_reset`, `email_change_verification`.

### 2.2 Dựng URL hành động

- Hàm thuần `buildAccountActionUrl(kind, rawToken)` ở `apps/web/server/utils/` (đọc origin web từ runtime config, không `process.env` rải rác): `email_verify` → `/xac-thuc?token=…`, `password_reset` → `/dat-lai-mat-khau?token=…`, `email_change` → trang đích `verify-email-change`.
- `code`: theo `email-verification.md` §7/§8. Nếu spec không định nghĩa mã nhập tay thì sửa spec + bỏ `code` khỏi `requiredVars` (sửa spec trước, cùng PR); nếu có thì sinh mã và lưu hash như token.
- Đường dẫn trang phải khớp trang của Task #290 (`/xac-thuc`, `/dat-lai-mat-khau`).

### 2.3 Chuyển route sang `dispatchTransactionalEmail`

`register`, `resend-verification`, `forgot-password`, `reset-password` (thông báo `BR-PWR-04`), `social-login` (nhánh chưa xác minh, `BR-SCL-05`), OAuth callback khi `intent=link` và `DELETE social-identities/[provider]` (`BR-SLK-05`, template mới `social_identity_linked` / `social_identity_unlinked` trong `NOTIFICATION_TYPES` + `TEMPLATE_REGISTRY`). Không try/catch trong route: lỗi enqueue đã được `dispatch.ts` ghi `failed` + alert rồi ném lại.

### 2.4 Notification service

- Thêm `apps/web/server/api/users/notification-preferences.get.ts` (đọc cùng nguồn với `.put.ts`, Zod ở response).
- `BR-NOT-11`: route `guest/webhooks/ses-sns.post.ts` từ chối message có `TopicArn` ngoài allow-list (cấu hình runtime) và `Timestamp` lệch quá ngưỡng spec quy định (chống replay). Lỗi ném lớp domain, không try/catch dựng body tay.
- Kiểm §3/§8 đã ghi đúng route SES thật (Task #288 sửa); còn lệch thì sửa spec trước.
- Gắn mã `BR-NOT-09..13` vào test hiện có hoặc test mới.

## 3. Lát cắt (Slices)

Mỗi slice: viết test đỏ trước, rồi code tới xanh.

- **S0 — Phối hợp cây làm việc.** `git status --short`; liệt kê file của task đang bị sửa dở; thống nhất thứ tự với người sửa (đặc biệt `reset-password.post.ts`, `social-login.post.ts`, `callback.get.ts`). Xong khi: có danh sách file được phép đụng + bản sao lưu.
- **S1 — Không lưu raw token (bảo mật, làm đầu).**
  - Test trước: `packages/notification/tests/notification-dispatch.test.ts` — hàng `notifications` không chứa khoá `secrets`, job `email:send` có đủ; test route (`apps/web/tests/api/…`) cho `register`, `forgot-password`, `users/email.post.ts`: `notifications.payload` không chứa raw token.
  - Code: §2.1 + migration xoá token cũ + chuyển `users/email.post.ts:96` sang `secrets`.
  - Xong khi: rg `token: rawToken` trong `payload:` của `apps/web/server/api` = 0; test xanh.
- **S2 — Email xác thực gửi thật (register + resend).**
  - Test trước: gọi `register` → có đúng 1 delivery `queued` + 1 lần `enqueue("email:send")` với `url` (+`code`) hợp lệ; `renderTemplate("email_verification", …)` không ném. Tương tự `resend-verification`.
  - Code: §2.2 + chuyển hai route.
  - Xong khi: test `apps/web/tests/api/…registration…` và `email-verification` xanh.
- **S3 — Khôi phục mật khẩu (`BR-PWR-01`, `BR-PWR-04`).**
  - Test trước: `forgot-password` enqueue `password_reset` có `url`; `reset-password` enqueue email thông báo; tài khoản không tồn tại vẫn trả cùng phản hồi (không lộ email).
  - Code: chuyển hai route (phối hợp vì `reset-password.post.ts` đang bị sửa dở).
- **S4 — Social (`BR-SCL-05`, `BR-SLK-05`).**
  - Test trước: `apps/web/tests/api/social-login.test.ts` nhánh email chưa xác minh có enqueue `email_verification`; `social-linking.test.ts` link/unlink có enqueue template mới.
  - Code: hai template mới + gọi dispatch ở callback và delete route.
- **S5 — Notification service.**
  - Test trước: `GET /api/users/notification-preferences` trả đúng giá trị vừa `PUT`; SES message sai `TopicArn` hoặc `Timestamp` quá hạn → bị từ chối, ca đúng → xử lý (`BR-NOT-11`); test nêu mã `BR-NOT-09..13`.
  - Code: route GET; allow-list topic + kiểm timestamp ở route SES.
- **S6 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - Test liên quan: `rtk proxy pnpm --filter @mindkid/notification test`, `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/social-login.test.ts tests/api/social-linking.test.ts tests/api/account-settings.test.ts tests/api/notifications-api.test.ts` + test mới; `rtk proxy pnpm --filter @mindkid/worker test`.
  - Spec `email-verification`, `password-recovery`, `registration`, `social-login`, `social-account-linking`, `notification-service`: bỏ mục `"#289"` khỏi `open_tasks` và khối "Chưa hoàn thành" (chỉ khi spec không còn task mở khác), nâng `status: implemented`.
  - Commit lên `main` chỉ với file của task này.

## 4. Rủi ro

- Xung đột với thay đổi dở ở auth/OAuth → S0 bắt buộc.
- Trang `/xac-thuc`, `/dat-lai-mat-khau` thuộc #290: email gửi được trước khi trang có → link 404 tạm thời. Ưu tiên làm #290 S1–S2 ngay sau S2–S3 của task này.
