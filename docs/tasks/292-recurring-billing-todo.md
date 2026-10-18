# Task #292 Todo: Gia hạn tự động có opt-in (Recurring Billing)

Plan: [`292-recurring-billing-plan.md`](292-recurring-billing-plan.md).
Spec: [`recurring-billing.md`](../specs/03-account/recurring-billing.md) `BR-RBL-01..06`, [`pricing-page.md`](../specs/02-public/pricing-page.md), [`job-queue.md`](../specs/01-platform/job-queue.md) §7.1.

---

## S0 — Phối hợp + chốt spec
- [ ] `git status --short` cho webhook thanh toán, `entitlements-runtime.ts`, test thanh toán; không ghi đè
- [ ] Bổ sung §8 `GET /api/users/subscriptions/recurring`
- [ ] Chốt số phận `POST /api/users/subscription/cancel` trong spec
- [ ] Xác nhận cổng tự động có charge không mặt người dùng; nếu không, hỏi người dùng và ghi §4

## S1 — Schema
- [ ] Test đỏ: `auto_renew` mặc định `false`
- [ ] Migration mới đổi default

## S2 — Route `subscriptions/recurring`
- [ ] Test đỏ: opt-in thiếu `consent` → 422 (`BR-RBL-01`)
- [ ] Test đỏ: opt-in snapshot giá/điều khoản (`BR-RBL-02/06`)
- [ ] Test đỏ: GET shape §8; cancel giữ quyền lợi tới hết chu kỳ (`BR-RBL-03`)
- [ ] Tạo `index.get.ts`, `opt-in.post.ts`, `cancel.post.ts` (Zod trong file, lỗi `@mindkid/errors`)

## S3 — Job nhắc trước 3 ngày
- [ ] Test đỏ: gửi đúng 1 email, chạy lại không trùng (`BR-RBL-02`)
- [ ] Đăng ký job trong `packages/queue/src/jobs/` + consumer worker + template email
- [ ] Cập nhật `job-queue.md` §7.1

## S4 — Thu phí + dunning + thu hồi
- [ ] Test đỏ: thất bại ≤ 3 lần / 7 ngày rồi `cancelled` + thu hồi entitlement (`BR-RBL-04/05`)
- [ ] Test đỏ: thành công dời kỳ
- [ ] Consumer `billing:renew` + `billing:dunning-sweep` gọi `runDunningSweep`

## S5 — UI
- [ ] Test đỏ: `pricing.vue` có câu gia hạn tự động theo spec, không còn câu cũ
- [ ] Test đỏ: `me/subscription.vue` bật/huỷ gia hạn gọi đúng route
- [ ] Sửa hai trang

## S6 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test web/worker/queue/db liên quan xanh; `rtk proxy pnpm check:migration-hashes` xanh
- [ ] Bỏ `"#292"` khỏi `open_tasks` + khối "Chưa hoàn thành", nâng `status: implemented` khi không còn task mở
- [ ] Commit lên `main`
