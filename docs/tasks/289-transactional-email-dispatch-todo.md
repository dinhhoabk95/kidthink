# Task #289 Todo: Gửi email giao dịch thật (Transactional Email Dispatch)

Plan: [`289-transactional-email-dispatch-plan.md`](289-transactional-email-dispatch-plan.md).
Spec: [`email-verification.md`](../specs/03-account/email-verification.md), [`password-recovery.md`](../specs/03-account/password-recovery.md), [`registration.md`](../specs/03-account/registration.md), [`social-login.md`](../specs/03-account/social-login.md), [`social-account-linking.md`](../specs/03-account/social-account-linking.md), [`notification-service.md`](../specs/01-platform/notification-service.md) — `BR-EVF-*`, `BR-PWR-01/04`, `BR-SCL-05`, `BR-SLK-05`, `BR-NOT-09..13`.

---

## S0 — Phối hợp cây làm việc
- [ ] `git status --short`; ghi danh sách file của task đang có thay đổi dở của người khác
- [ ] Phối hợp thứ tự sửa `reset-password.post.ts`, `social-login.post.ts`, `oauth/[provider]/callback.get.ts`; không ghi đè, không `git checkout`/`stash`
- [ ] Sao lưu các file sắp sửa ra ngoài repo

## S1 — Không lưu raw token (bảo mật)
- [ ] Test đỏ: `notifications.payload` không chứa token cho `register`, `forgot-password`, `users/email.post.ts`
- [ ] Test đỏ: `dispatchTransactionalEmail` tách `secrets` khỏi hàng bền, job vẫn đủ biến
- [ ] Thêm `secrets` vào `TransactionalEmailInput` (`packages/notification/src/dispatch.ts`)
- [ ] Kiểm/đặt `removeOnComplete`/`removeOnFail` cho job `email:send`; ghi TTL vào spec `notification-service.md` §7
- [ ] Chốt hành vi admin resend cho template có bí mật (sửa spec trước)
- [ ] Migration mới xoá khoá `token` khỏi `notifications.payload` cũ
- [ ] Chuyển `users/email.post.ts:96` sang `secrets`

## S2 — Email xác thực (register + resend)
- [ ] Test đỏ: `register` tạo đúng 1 delivery và 1 lần enqueue `email:send` có `url` (+`code`)
- [ ] Test đỏ: `resend-verification` như trên
- [ ] `buildAccountActionUrl` (origin từ runtime config) + chốt `code` theo `email-verification.md`
- [ ] Chuyển `register.post.ts` và `resend-verification.post.ts` sang `dispatchTransactionalEmail`

## S3 — Khôi phục mật khẩu
- [ ] Test đỏ: `forgot-password` enqueue `password_reset` có `url`; email không tồn tại trả cùng phản hồi
- [ ] Test đỏ: `reset-password` enqueue email thông báo (`BR-PWR-04`)
- [ ] Chuyển hai route sang dispatch (sau khi phối hợp)

## S4 — Social
- [ ] Test đỏ: `social-login` nhánh email chưa xác minh gửi email xác thực (`BR-SCL-05`)
- [ ] Test đỏ: link/unlink gửi email thông báo (`BR-SLK-05`)
- [ ] Thêm `social_identity_linked`/`social_identity_unlinked` vào `NOTIFICATION_TYPES` + `TEMPLATE_REGISTRY`
- [ ] Gọi dispatch ở OAuth callback (`intent=link`) và `social-identities/[provider].delete.ts`

## S5 — Notification service
- [ ] Test đỏ: `GET /api/users/notification-preferences` trả giá trị đã `PUT`
- [ ] Thêm `notification-preferences.get.ts`
- [ ] Test đỏ: SES message sai `TopicArn` / `Timestamp` quá hạn bị từ chối (`BR-NOT-11`)
- [ ] Allow-list topic ARN + kiểm timestamp ở `guest/webhooks/ses-sns.post.ts`
- [ ] Test nêu mã `BR-NOT-09..13`

## S6 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test notification, web (auth/social/settings/notifications), worker xanh
- [ ] Bỏ `"#289"` khỏi `open_tasks` + khối "Chưa hoàn thành" ở 6 spec, nâng `status: implemented`
- [ ] Commit lên `main` (chỉ file của task)
