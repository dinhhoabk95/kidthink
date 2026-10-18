# Kế hoạch Task #292: Gia hạn tự động có opt-in (Recurring Billing)

Contract: `docs/specs/03-account/recurring-billing.md` §3, §7, §8, §9 (`BR-RBL-01..06`), `docs/specs/02-public/pricing-page.md` (`BR-PRC-07` đã ngưng, câu gia hạn tự động), `docs/specs/01-platform/job-queue.md` §7.1 (đăng ký job mới), `docs/specs/06-admin/admin-subscription-cancel.md` (service huỷ dùng chung).

Quyết định người dùng (2026-10-18): **làm gia hạn tự động**; `BR-PRC-07` đã được đánh dấu ngưng trong `pricing-page.md`.

> **Ràng buộc cây làm việc.** `apps/web/server/api/guest/webhooks/payments/[provider].post.ts`, `apps/web/server/utils/entitlements-runtime.ts`, `apps/web/tests/unit/server/automated-payment.test.ts`, `apps/worker/tests/services/payment-flow.test.ts` đang có thay đổi dở của người khác. Kiểm `git status --short` trước khi đụng luồng thanh toán; không ghi đè, không `git checkout`/`stash`.

---

## 1. Bối cảnh & bằng chứng gap

- Bảng `recurring_subscriptions` có (`packages/db/src/schema/billing.ts:234`), nhưng `auto_renew` `.default(true)` (`billing.ts:249`) trái §7 "mặc định false" và `BR-RBL-01` (opt-in tường minh).
- Service `apps/web/server/services/recurring-billing.ts`: `createRecurringSubscription` (`:42`), `userCancelRecurringSubscription` (`:82`), `adminCancelSubscription` (`:157`), `runDunningSweep` (`:265`). `createRecurringSubscription` và `runDunningSweep` **chỉ được gọi trong test**.
- Ba route §3/§8 `GET /api/users/subscriptions/recurring`, `POST …/recurring/opt-in`, `POST …/recurring/cancel` **không có**. Huỷ thật nằm ở `apps/web/server/api/users/subscription/cancel.post.ts` với body `{subscription_id}` (spec: `{reason}`).
- Worker (`apps/worker/src/consumers/`) không có job nhắc trước 3 ngày (`BR-RBL-02`), thu phí định kỳ, dunning tối đa 3 lần trong 7 ngày (`BR-RBL-04`), thu hồi quyền lợi sau ân hạn (`BR-RBL-05`). Lịch job đăng ký ở `packages/queue/src/jobs/` + `scheduler.ts`.
- `pricing.vue:318` còn in câu "không tự động gia hạn" của `BR-PRC-07` đã ngưng.
- §8 không định nghĩa `GET /api/users/subscriptions/recurring` dù §3 liệt kê.

## 2. Thiết kế

### 2.1 Spec trước
- Bổ sung §8 cho `GET /api/users/subscriptions/recurring` (shape: gói, giá snapshot, `auto_renew`, `next_billing_at`, `current_period_end`, trạng thái dunning).
- Chốt số phận `POST /api/users/subscription/cancel` (`{subscription_id}`): giữ làm alias hay gỡ sau khi route spec có. Mặc định: gỡ nếu không UI nào gọi; ghi vào §8.
- Thu phí định kỳ cần token thanh toán của cổng tự động — phụ thuộc `automated-payment.md` (checkout-session thuộc Task #305). Nếu cổng chưa hỗ trợ charge không có mặt người dùng, §4 ghi rõ chế độ "nhắc + link thanh toán" và đánh dấu phần charge tự động là phụ thuộc. Hỏi người dùng nếu cổng không hỗ trợ.

### 2.2 Schema
- Migration **mới**: `auto_renew` default `false`. Không đổi dữ liệu cũ khi chưa có opt-in thật (dòng hiện có chỉ do test tạo — kiểm DB dev trước).

### 2.3 Route
- `apps/web/server/api/users/subscriptions/recurring/index.get.ts`, `opt-in.post.ts`, `cancel.post.ts` — Zod parse body trong file; opt-in yêu cầu `consent: z.literal(true)` + snapshot điều khoản/giá (`BR-RBL-01`, `BR-RBL-02`, `BR-RBL-06`); cancel giữ quyền lợi tới hết chu kỳ (`BR-RBL-03`). Lỗi ném lớp `@mindkid/errors`.

### 2.4 Worker
- Job mới đăng ký trong `packages/queue/src/jobs/` (cron qua `schedule.pattern`), consumer ở `apps/worker/src/consumers/`:
  - `billing:renewal-reminder` — quét `next_billing_at` trong 3 ngày tới, gửi email qua `dispatchTransactionalEmail` (template `subscription_renewal_reminder`), idempotent theo (subscription, kỳ).
  - `billing:renew` — thu phí tới hạn; thất bại → tăng `dunning_attempts`, nhắc lại (≤ 3 lần / 7 ngày, `BR-RBL-04`).
  - `billing:dunning-sweep` — gọi `runDunningSweep`; hết ân hạn → `cancelled` + thu hồi entitlement (`BR-RBL-05`).
- Thay đổi giá chỉ áp dụng kỳ sau khi user đã nhận thông báo và đồng ý (`BR-RBL-06`).

### 2.5 UI
- `pricing.vue:318`: thay câu cũ bằng câu gia hạn tự động có opt-in theo spec.
- `me/subscription.vue`: hiển thị trạng thái gia hạn, nút bật (checkbox đồng ý tường minh) và nút huỷ.

## 3. Lát cắt (Slices)

- **S0 — Phối hợp + chốt spec.** `git status --short` cho file thanh toán; sửa `recurring-billing.md` §4/§8 theo §2.1; hỏi người dùng nếu cổng không charge được tự động.
- **S1 — Schema `auto_renew` default false.** Test trước (`packages/db/tests/…`): insert không truyền `auto_renew` → `false`. Migration mới.
- **S2 — Ba route `subscriptions/recurring`.** Test trước (`apps/web/tests/api/recurring-billing.test.ts`): opt-in thiếu `consent` → 422; opt-in hợp lệ tạo bản ghi snapshot giá; GET trả đúng shape; cancel giữ quyền lợi tới `current_period_end` (gắn `BR-RBL-01/03/06`).
- **S3 — Job nhắc trước 3 ngày.** Test trước (`apps/worker/src/consumers/*.test.ts`): subscription có `next_billing_at` = now+3 ngày → 1 email; chạy lại không gửi trùng (`BR-RBL-02`). Đăng ký job trong registry + `packages/queue/tests/job-registry.test.ts`.
- **S4 — Thu phí + dunning + thu hồi.** Test trước: thất bại lần 1..3 trong 7 ngày rồi `cancelled` + entitlement thu hồi (`BR-RBL-04`, `BR-RBL-05`); thành công dời `current_period_*`.
- **S5 — UI pricing + subscription.** Test component: `pricing.vue` không còn câu "không tự động gia hạn"; `me/subscription.vue` bật/huỷ gia hạn gọi đúng route.
- **S6 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/recurring-billing.test.ts`, `rtk proxy pnpm --filter @mindkid/worker test`, `rtk proxy pnpm --filter @mindkid/queue test`, `rtk proxy pnpm --filter @mindkid/db test`; `rtk proxy pnpm check:migration-hashes`.
  - Bỏ `"#292"` khỏi `open_tasks` + khối "Chưa hoàn thành" ở `recurring-billing.md` và `pricing-page.md` (pricing còn #290 thì chỉ bỏ entry `#292` và phần câu tương ứng); nâng `status: implemented` khi không còn task mở.
  - Commit lên `main`.

## 4. Rủi ro

- Cỡ L. Phần charge tự động phụ thuộc năng lực cổng (#305). Không giả lập "thu phí thành công" trong code production.
- Đụng `entitlements-runtime.ts` đang bị sửa dở — phối hợp.
