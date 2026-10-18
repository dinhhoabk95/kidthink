# Kế hoạch Task #290: Bổ sung các trang và thao tác còn thiếu ở khu tài khoản (Account UI Missing Pages)

Contract: `docs/specs/03-account/email-verification.md` (`BR-EVF-08`), `docs/specs/03-account/password-recovery.md` §3, `docs/specs/03-account/account-settings.md` (`BR-ACS-01..05`, `BR-ACS-09`, `BR-ACS-10`), `docs/specs/03-account/account-deletion.md` (`BR-ADL-02`, `BR-ADL-03`, `BR-ADL-07`), `docs/specs/03-account/login-and-session.md` (`BR-LGN-04`, `BR-LGN-05`, `BR-LGN-10`), `docs/specs/03-account/child-profile-crud.md` §3, `docs/specs/03-account/child-profile-archive.md` §3, `docs/specs/03-account/payment-order-create.md` (`BR-POC-02`, `BR-POC-03`, `BR-POC-05`, `BR-POC-07`), `docs/specs/03-account/payment-proof-upload.md` (`BR-PPU-04`, `BR-PPU-06`, `BR-PPU-07`), `docs/specs/02-public/pricing-page.md` (CTA), `docs/specs/03-account/my-library.md` §3, `docs/specs/03-account/notification-inbox.md` §3, `docs/specs/03-account/registration.md`, `docs/specs/03-account/consent-management.md`.

> **Ràng buộc cây làm việc.** Đang có thay đổi dở của người khác ở `apps/web/server/api/guest/auth/*`, `apps/web/server/api/users/{password,mfa/*,account/delete/cancel}.post.ts`, `apps/web/server/utils/reauth-runtime.ts`, `packages/auth/*`. Task này chủ yếu đụng `apps/web/app/**`, nhưng các trang gọi đúng các API đó: trước mỗi slice chạy `git status --short`, đọc diff API mình gọi (hợp đồng reauth có thể đang đổi), phối hợp với người đang sửa; **không** ghi đè, **không** `git checkout`/`git stash`. Commit chỉ `git add` file của task.

---

## 1. Bối cảnh & bằng chứng gap

API phía server đã có cho hầu hết luồng tài khoản, nhưng giao diện thiếu trang hoặc nút là stub rỗng:

| Spec | Bằng chứng | Thiếu |
| --- | --- | --- |
| email-verification | API `guest/auth/users/verify-email.post.ts`, `users/auth/resend-verification.post.ts`; rg không thấy UI gọi | Trang `/xac-thuc`, nút gửi lại, chuyển tới tạo hồ sơ trẻ (`BR-EVF-08`); trang đích `verify-email-change` |
| password-recovery | API `forgot-password.post.ts`, `reset-password.post.ts` | Trang `/quen-mat-khau`, `/dat-lai-mat-khau`; `login.vue` không có link "Quên mật khẩu" |
| account-settings | `app/pages/me/settings/index.vue:423-429` `openPasswordModal()` / `openEmailModal()` thân rỗng | Đổi/đặt mật khẩu, đổi email từ UI |
| account-deletion | `app/pages/me/settings/delete.vue:141-143` `handleRequestDeletion()` thân rỗng | Yêu cầu xoá + trạng thái + hoàn tác |
| login-and-session | Không UI thiết bị; `app/layouts/account.vue` không có logout (chỉ `consent-required.vue:310`) | Danh sách thiết bị, logout, logout-all (`BR-LGN-05/10`) |
| child-profile-crud | `app/pages/me/children/[uuid]/` chỉ có `report/` | Trang `/me/children/{uuid}/edit` gọi `PATCH /api/users/children/{uuid}` |
| child-profile-archive | API `children/[uuid]/{archive,restore}.post.ts`, `index.delete.ts:52-81` | Trang `/me/children/{uuid}`: lưu trữ/khôi phục/xoá (gõ tên + mật khẩu)/huỷ xoá |
| payment-order-create + pricing-page | `pricing.vue:192,281` CTA `/me/orders/create?package=…`; `app/pages/me/` không có `orders/` | Trang tạo đơn: QR/STK/mã đơn + nút sao chép (`BR-POC-02/03/05/07`); CTA hiện 404 |
| payment-proof-upload | API `users/orders/[uuid]/proof.post.ts:140-195` | Trang `/me/orders/{uuid}/proof` |
| my-library | Chỉ có DELETE ở `me/library.vue:478`; lỗi trong `server/services/library.ts:92-96,221` là `Error` gắn `statusCode` | Nút lưu trên thẻ nội dung (`POST /api/users/library/items`); lỗi theo `@mindkid/errors` |
| notification-inbox | `app/components/notification-bell.vue` không được mount ở đâu | Bell trong layout `/me` |
| registration / consent-management | `app/pages/register/index.vue:319` gọi `/api/guest/consents/requirements` (route thật `/api/guest/consent-requirements`), lỗi bị `catch {}` nuốt | Sửa path, bỏ nuốt lỗi |

## 2. Thiết kế

- Mọi trang tài khoản dùng layout `account`, client fetch có CSRF sẵn của web (không `$fetch` trần), hiển thị lỗi qua mã lỗi chuẩn (`{ code, message, details? }`).
- Thao tác nhạy cảm (đổi mật khẩu/email, xoá tài khoản, xoá hồ sơ trẻ, logout-all) đi qua reauth modal hiện có ở `me/settings/security.vue` — tách thành component dùng chung nếu chưa tách. Đọc hợp đồng reauth **sau khi** thay đổi dở ở `reauth-runtime.ts` ổn định.
- Đường dẫn trang xác thực/đặt lại phải khớp URL mà Task #289 dựng (`/xac-thuc?token=…`, `/dat-lai-mat-khau?token=…`).
- Path tạo đơn: chốt một path giữa spec `payment-order-create.md` §3 (`/me/subscription/upgrade` / `/me/orders/create`) và `pricing.vue:192,281`; nếu đổi spec thì sửa spec trước.
- `login-and-session.md` §3/§8: nếu Task #288 chưa đổi `POST /api/guest/auth/users/remember` → `POST /api/users/auth/restore` thì sửa trong task này.
- Bề mặt người lớn: được `dark:`; không hex literal; chuỗi tiếng Việt.

## 3. Lát cắt (Slices)

Mỗi slice: component/page test trước (`apps/web/tests/component/…`, mock API), rồi code.

- **S0 — Phối hợp cây làm việc.** `git status --short`, đọc diff API auth/reauth sắp gọi, chốt hợp đồng với người đang sửa. Xong khi: có danh sách hợp đồng API đã ổn định.
- **S1 — `/xac-thuc` + trang đích đổi email.** Test: token hợp lệ → gọi `verify-email` rồi chuyển `/me/children/create` (`BR-EVF-08`); token hỏng → thông báo + nút gửi lại gọi `resend-verification`. Phụ thuộc: #289 S2 (định dạng URL).
- **S2 — `/quen-mat-khau`, `/dat-lai-mat-khau` + link ở `login.vue`.** Test: gửi form không lộ email tồn tại; đặt lại thành công chuyển về đăng nhập.
- **S3 — Cài `openPasswordModal`/`openEmailModal` (`me/settings/index.vue`).** Test: reauth → `POST`/`PUT /api/users/password`, `POST /api/users/email`; lỗi field hiện đúng chỗ (`BR-ACS-01..05, 09, 10`).
- **S4 — Xoá tài khoản (`me/settings/delete.vue`).** Test: reauth → `POST /api/users/account/delete`; hiện `delete/status`; nút hoàn tác gọi `delete/cancel` (`BR-ADL-02/03/07`).
- **S5 — Thiết bị + logout/logout-all.** Test: liệt kê `GET /api/users/auth/sessions`, thu hồi một phiên, logout-all có reauth; nút logout trong `app/layouts/account.vue` (`BR-LGN-04/05/10`).
- **S6 — Hồ sơ trẻ: `/me/children/[uuid]/index.vue` + `edit.vue`.** Test: sửa gọi `PATCH`; lưu trữ/khôi phục; xoá cần gõ tên + mật khẩu; huỷ xoá trong 30 ngày.
- **S7 — Đơn hàng: `/me/orders/create` + `/me/orders/[uuid]/proof`.** Test: `POST /api/users/orders` → QR/STK/mã đơn + nút sao chép (`BR-POC-02/03/05/07`); upload proof qua client có CSRF, hiển thị `soft_unlock` (`BR-PPU-04/06/07`); CTA `pricing.vue` không còn 404.
- **S8 — Thư viện + bell + sửa register.** Test: nút lưu trên `catalog-game-card.vue` / `games/[code].vue` / `programs/[code].vue` gọi `POST /api/users/library/items`, 402 hiện thông báo quota; lỗi `services/library.ts` đổi sang lớp `@mindkid/errors`; `NotificationBell` có trong layout `account`; `register/index.vue:319` gọi đúng `/api/guest/consent-requirements`, bỏ `catch {}`.
- **S9 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/component tests/api/account-settings.test.ts tests/api/account-deletion.test.ts tests/api/child-profile-crud.test.ts tests/api/child-profile-archive.test.ts` + test mới.
  - Kiểm tay luồng đăng ký → xác thực → tạo hồ sơ trẻ → mua gói → upload proof trên trình duyệt.
  - Bỏ `"#290"` khỏi `open_tasks` + khối "Chưa hoàn thành" ở các spec trong Contract (chỉ khi spec không còn task mở khác, ví dụ email-verification còn #289), nâng `status: implemented`.
  - Commit lên `main` (chỉ file của task).

## 4. Phụ thuộc & rủi ro

- S1–S2 phụ thuộc #289 (URL email). S7 có thể đụng `pricing.vue` cùng lúc với #292 (văn bản gia hạn tự động) — phối hợp.
- Task cỡ L: 9 slice độc lập theo trang; có thể chia nhiều phiên, mỗi slice tự xanh.
