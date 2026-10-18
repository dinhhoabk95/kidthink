# Task #290 Todo: Bổ sung các trang và thao tác còn thiếu ở khu tài khoản

Plan: [`290-account-ui-missing-pages-plan.md`](290-account-ui-missing-pages-plan.md).
Spec: `03-account/` email-verification, password-recovery, account-settings, account-deletion, login-and-session, child-profile-crud, child-profile-archive, payment-order-create, payment-proof-upload, my-library, notification-inbox, registration, consent-management; `02-public/pricing-page.md`.

---

## S0 — Phối hợp cây làm việc
- [ ] `git status --short`; đọc diff các API auth/reauth/password/mfa mà trang sẽ gọi
- [ ] Chốt hợp đồng reauth với người đang sửa; không ghi đè, không `git checkout`/`stash`

## S1 — `/xac-thuc`
- [ ] Test đỏ: token hợp lệ → `verify-email` → `/me/children/create` (`BR-EVF-08`)
- [ ] Test đỏ: token hỏng → nút gửi lại gọi `resend-verification`
- [ ] Tạo `app/pages/xac-thuc.vue` + trang đích `verify-email-change`

## S2 — Quên / đặt lại mật khẩu
- [ ] Test đỏ cho `/quen-mat-khau` và `/dat-lai-mat-khau`
- [ ] Tạo 2 trang + link "Quên mật khẩu" ở `login.vue`

## S3 — Đổi mật khẩu / email
- [ ] Test đỏ: modal + reauth gọi `POST/PUT /api/users/password`, `POST /api/users/email`
- [ ] Cài `openPasswordModal`/`openEmailModal` ở `me/settings/index.vue`

## S4 — Xoá tài khoản
- [ ] Test đỏ: reauth → `POST /account/delete`, hiện trạng thái, hoàn tác gọi `delete/cancel`
- [ ] Cài `handleRequestDeletion` ở `me/settings/delete.vue`

## S5 — Thiết bị + logout
- [ ] Test đỏ: danh sách phiên, thu hồi một phiên, logout-all có reauth
- [ ] UI thiết bị + nút logout/logout-all trong `app/layouts/account.vue` hoặc `me/settings/security.vue`
- [ ] Sửa spec `login-and-session.md` route `restore` nếu #288 chưa sửa

## S6 — Hồ sơ trẻ
- [ ] Test đỏ cho `/me/children/[uuid]` (lưu trữ/khôi phục/xoá gõ tên + mật khẩu/huỷ xoá)
- [ ] Test đỏ cho `/me/children/[uuid]/edit` (`PATCH`)
- [ ] Tạo `me/children/[uuid]/index.vue` và `edit.vue`

## S7 — Đơn hàng
- [ ] Chốt path tạo đơn giữa spec và `pricing.vue:192,281` (sửa spec trước nếu đổi)
- [ ] Test đỏ: tạo đơn hiện QR/STK/mã đơn + nút sao chép (`BR-POC-02/03/05/07`)
- [ ] Test đỏ: upload proof qua client có CSRF (`BR-PPU-04/06/07`)
- [ ] Tạo `me/orders/create.vue` và `me/orders/[uuid]/proof.vue`

## S8 — Thư viện, bell, register
- [ ] Test đỏ: nút lưu gọi `POST /api/users/library/items`, 402 hiện quota
- [ ] Thêm nút lưu vào `catalog-game-card.vue`, `games/[code].vue`, `programs/[code].vue`
- [ ] Đổi lỗi `server/services/library.ts` sang lớp `@mindkid/errors`
- [ ] Mount `NotificationBell` trong layout `account`
- [ ] Sửa `register/index.vue:319` → `/api/guest/consent-requirements`, bỏ `catch {}`

## S9 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test component + API tài khoản xanh
- [ ] Kiểm tay luồng đăng ký → xác thực → hồ sơ trẻ → mua gói → upload proof
- [ ] Bỏ `"#290"` khỏi `open_tasks` + khối "Chưa hoàn thành", nâng `status: implemented` (spec không còn task mở khác)
- [ ] Commit lên `main` (chỉ file của task)
