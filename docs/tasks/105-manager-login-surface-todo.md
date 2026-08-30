# Task #105 — Todo

## Phase 1 — Contract và API

- [x] Spec delta [`admin-auth.md`](../specs/06-admin/admin-auth.md) §3: link spec enrollment, thêm `mfa-setup`, sửa
      `managers/remember` → `managers/auth/restore` cho khớp nguồn.
- [x] `POST /api/guest/auth/managers/mfa-setup`: tiêu thụ challenge, chặn tài khoản đã bật
      MFA, sinh secret, upsert `confirmed_at = NULL`, phát challenge mới.
- [x] Nhánh xác nhận lần đầu trong `mfa.post.ts`: một transaction cho `confirmed_at`,
      `mfa_enabled`, 10 mã khôi phục, audit `manager_mfa_enrolled`.
- [x] Test cho cả 7 scenario [`manager-mfa-enrollment.md`](../specs/06-admin/manager-mfa-enrollment.md) §9, mỗi cái kèm ca âm.
- [x] Checkpoint 1: `pnpm --filter @mindkid/web test` xanh.

## Phase 2 — Màn hình đăng nhập

- [x] `apps/admin/app/pages/login.vue` — ba trạng thái, gọi qua `useApiClient`.
- [x] Layout riêng cho trang đăng nhập (không dùng `manager.vue`).
- [x] Hiện mã khôi phục đúng một lần kèm xác nhận "đã lưu".
- [x] `apps/admin/app/middleware/auth.global.ts` — 401 thì điều hướng `/login`.
- [x] Checkpoint 2: đăng nhập thật từ seed tới dashboard trên máy dev.

## Phase 3 — Cổng và dọn

- [x] Gate quét `apps/admin/app/pages/**`: mọi trang ngoài `/login` nằm dưới guard, có
      fixture âm.
- [x] Cập nhật `docs/specs/index.md`, [`roadmap.md`](../specs/roadmap.md), `.agents` nếu có mô tả luồng đăng nhập.
- [x] Chạy `pnpm --filter @mindkid/admin test`, `pnpm typecheck`, `pnpm lint`. (`@mindkid/gates` bị xoá 2026-08-29; cổng ranh giới runtime nay ở `apps/admin/tests/gates/`.)
- [x] Chụp danh sách `trạng-thái | tên-test` trước và sau, yêu cầu trùng khít trừ test mới.
