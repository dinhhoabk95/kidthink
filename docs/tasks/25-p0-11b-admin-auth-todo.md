# Checklist — Task #25: P0.11b — Đăng nhập quản trị

> Kế hoạch: [`25-p0-11b-admin-auth-plan.md`](25-p0-11b-admin-auth-plan.md).
> Bước **cuối cùng của P0** — Task 7 chạy luôn cổng ra phase.
> Vùng nhạy cảm **auth**: test âm trước, human security reviewer duyệt diff, không auto-merge.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] Human approve kế hoạch và bốn quyết định D-EX · D-EY · D-EZ · D-FA.
- [x] **P0.11 đã đóng** — ba action audit của bước này có trong registry.
- [x] **P0.3 đã đóng** — contract challenge một mục đích, TTL 24 giờ, tách audience.
- [x] **P0.9b đã đóng** — bảng hạn mức cho khoá 5 lần sai MFA.
- [x] Đối chiếu `BR-ADA-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — TOTP và mã khôi phục

- [x] Sinh secret; xác thực mã theo cửa sổ thời gian chuẩn.
- [x] Chống dùng lại mã trong cùng cửa sổ.
- [x] Mã khôi phục dùng một lần, dùng rồi bị vô hiệu.
- [x] Hết mã khôi phục → chỉ `super_admin` khác reset được, có audit (`BR-ADA-08`).
- [x] Ca âm: secret và mã khôi phục **không** trong log, `audit_logs`, hay test snapshot.
- [x] Sai MFA 5 lần → khoá 15 phút, dùng bảng hạn mức P0.9b.

### Task 2 — `POST /api/guest/auth/managers/login`

- [x] Đúng mật khẩu → **428** `MFA_REQUIRED` + challenge một mục đích, TTL ngắn.
- [x] Ca âm `BR-ADA-01`: challenge **không** qua `requireManagerAuth`.
- [x] Ca âm `BR-ADA-01`: **chưa** có hàng `active_sessions` nào ở bước này.
- [x] Sai mật khẩu → 401 + audit `manager_login_failed`.
- [x] `is_active = false` → 403, không nói lý do chi tiết.
- [x] Chưa bật MFA → bắt buộc thiết lập trước khi vào bất kỳ trang nào.
- [x] Rate limit `auth:login` hai trục.

### Task 3 — `POST /api/guest/auth/managers/mfa`

- [x] Nhận `{ code, challenge }` — TOTP hoặc mã khôi phục.
- [x] Thành công → cặp token đầy đủ, payload đúng §7.1.
- [x] `BR-ADA-07`: refresh không quá **24 giờ**; ca âm decode token kiểm hạn.
- [x] Ghi `active_sessions` + audit `manager_login`.
- [x] Sai mã → 401 + audit `manager_mfa_failed`.

### Task 4 — Ma trận role × bề mặt

- [x] 13 bề mặt §7.2 khai dạng dữ liệu.
- [x] Test duyệt **đủ 26 ô**; ô "Cấm" trả 403.
- [x] Ca âm `BR-ADA-04`: `content_reviewer` gọi `GET /api/managers/users` bằng curl → **403**.
- [x] Ca âm `BR-ADA-06`: Manager PATCH đổi `role` của chính mình → 403, gồm cả `super_admin`.
- [x] Route admin mới không khai được trong ma trận là **lỗi**, không mặc định cho phép.

### Task 5 — Tách bề mặt

- [x] `BR-ADA-02`: cookie Manager giới hạn `admin.{domain}`.
- [x] Ca âm: request tới domain chính không kèm cookie manager.
- [x] Secret ký token Manager khác secret User; ca âm cross-namespace hai chiều.
- [x] `BR-ADA-03`: cổng quét `/api/guest` — không route nào tạo hàng trong `managers`.
- [x] Đối chiếu `infra/nginx/conf.d/` cho subdomain admin, không viết lại.

### Task 6 — Manager đầu tiên

- [x] Seed tạo đúng một `super_admin`, idempotent.
- [x] Mật khẩu ban đầu từ biến môi trường, **không** hằng số trong source.
- [x] Lần đăng nhập đầu bắt buộc đổi mật khẩu và thiết lập MFA.
- [x] Ca âm: gọi thẳng route admin để bỏ qua bước thiết lập → 403.
- [x] Nêu lại §11 Q2 (xoay mật khẩu ban đầu) ở cổng ra P0.

## Cổng dừng

- [x] Không vào được trang admin nào khi chưa qua MFA.
- [x] Challenge trước MFA không qua guard, không tạo `active_sessions`.
- [x] 26 ô ma trận đều có test; curl không đi vòng.
- [x] Cookie và audience tách hoàn toàn hai chiều.
- [x] Mọi đăng nhập và thất bại có hàng `audit_logs`.
- [x] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.
- [x] Human security reviewer approve diff.

---

## Task 7 — Evidence và cổng ra P0

- [x] Mỗi `BR-ADA-*` có test tham chiếu mã rule.
- [x] [`admin-auth.md`](../specs/06-admin/admin-auth.md) sang `implemented`.
- [x] Tick **P0.11b** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

### Cổng ra P0

- [x] Điều kiện ở [`SPEC.md`](../SPEC.md) §13.
- [x] [`security-checklist.md`](../specs/08-quality/security-checklist.md) chạy hết, không mục nào đỏ.
- [x] 35 spec P0 mang `status: implemented`.
- [x] Mọi `BR-*` mà P0 sở hữu có ít nhất một test tham chiếu mã rule.
- [x] Không spec P0 nào còn câu hỏi mở mang `Chặn phase: P0`.
- [x] ≥690 learning objective đã seed (P0.9).
- [x] Có ít nhất một hàng `backup_log` kind verify status success (P0.8b, `BR-BAK-06`).
- [x] Ba câu hỏi **chặn go-live** đã có chủ trả lời:
  - [x] Khoá mã hoá backup — §11 Q1 của [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md).
  - [x] Rà soát pháp lý và DPIA — §11 Q1–Q2 của [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md).
  - [x] Mật khẩu Manager ban đầu — §11 Q2 của [`admin-auth.md`](../specs/06-admin/admin-auth.md).

## Cổng dừng cuối

- [x] Không giao màn hình admin nào ngoài đăng nhập.
- [x] Không secret MFA trong source, log, audit, hay snapshot.
- [x] Không kéo P2 lên sớm.
- [x] Sẵn sàng lập plan P1.1.
