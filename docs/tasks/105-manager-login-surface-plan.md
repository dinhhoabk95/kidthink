# Task #105 — Bề mặt đăng nhập Manager

## 1. Vì sao

[`admin-auth.md`](../specs/06-admin/admin-auth.md) §3 khai `admin.{domain}/login` là entry point và `status: implemented`.
Đo trên nguồn ngày 2026-08-24:

| Thứ | Trạng thái đo được |
|---|---|
| `apps/admin/app/pages/login.vue` | Không tồn tại |
| `apps/admin/app/middleware/` | Thư mục không tồn tại — không có route guard |
| `POST /api/guest/auth/managers/login` | Có, luôn trả 428 kèm `mfa_enabled` |
| `POST /api/guest/auth/managers/mfa` | Có, nhưng đòi secret đã tồn tại |
| Route enroll MFA cho Manager | Không tồn tại ở bất kỳ app nào |
| Manager do seed tạo | `mfa_enabled: false`, không có hàng `mfa_settings` |

Ghép lại: **không Manager nào đăng nhập được vào admin.** Bước mật khẩu trả challenge, bước
kế đòi một secret TOTP mà không có đường nào tạo ra. Đây không phải thiếu UI — thiếu một
mắt xích trong contract.

Task #104 ghi việc này thành open item vì nó nằm ngoài phạm vi ranh giới runtime. Đây là
task riêng của nó.

## 2. Quyết định kiến trúc

- **Login page thuộc admin SPA**, không thuộc web. [`admin-auth.md`](../specs/06-admin/admin-auth.md) §3 đã chốt
  `admin.{domain}/login`; task này không mở lại câu hỏi đó.
- **Enrollment đi qua challenge, không qua session.** `BR-ADA-01` cấm Manager chưa có MFA
  chạm bất kỳ trang nào, nên không thể tái dùng `/api/users/mfa/setup` (route đó đòi phiên).
  Contract mới nằm ở [`manager-mfa-enrollment.md`](../specs/06-admin/manager-mfa-enrollment.md).
- **Mỗi bước đổi challenge.** Giữ bất biến một-lần của [`admin-auth.md`](../specs/06-admin/admin-auth.md) §4 mà vẫn cho luồng
  hai bước (`BR-MME-03`).
- **Guard ở client chỉ để điều hướng.** Phân quyền thật vẫn ở server route (`BR-ADA-04`);
  middleware admin chỉ quyết định hiện trang nào, Cấm — **NEVER** coi nó là hàng rào bảo mật.
- **Không dựng trang reauth trong task này.** `POST /api/managers/auth/reauth` đã có; UI của
  nó thuộc về màn hình nào cần force (legal consent), không thuộc màn đăng nhập.

## 3. Kế hoạch tăng dần

Mỗi bước để hệ thống ở trạng thái chạy được, và mỗi bước có cả test dương lẫn test âm.

### Phase 1 — Contract và API (nền)

1. **Spec delta.** [`admin-auth.md`](../specs/06-admin/admin-auth.md) §3: thêm link tới spec enrollment và
   `POST /api/guest/auth/managers/mfa-setup`; sửa `POST /api/guest/auth/managers/remember`
   thành `POST /api/managers/auth/restore` cho khớp nguồn (drift phát hiện khi review #104).
2. **`POST /api/guest/auth/managers/mfa-setup`.** Tiêu thụ challenge, chặn tài khoản đã bật
   MFA (`BR-MME-01`), sinh secret bằng `packages/auth` (`BR-MFA-12`), upsert `mfa_settings`
   với `confirmed_at = NULL`, phát challenge mới, trả `otpauth_uri`. Zod parse body.
3. **Nhánh xác nhận lần đầu trong `mfa.post.ts`.** Khi `confirmed_at` NULL: xác nhận mã đầu
   tiên, rồi trong **một** transaction set `confirmed_at` + `mfa_enabled` + 10 mã khôi phục +
   audit `manager_mfa_enrolled` (`BR-MME-05`, `BR-MME-06`).

**Checkpoint 1:** `pnpm --filter @mindkid/web test` xanh; 7 scenario của
[`manager-mfa-enrollment.md`](../specs/06-admin/manager-mfa-enrollment.md) §9 có test tương ứng, mỗi cái có ca âm.

### Phase 2 — Màn hình đăng nhập

4. **`apps/admin/app/pages/login.vue`.** Ba trạng thái trong một trang: mật khẩu → (enroll
   nếu `mfa_enabled: false`) → nhập mã. Gọi API qua `useApiClient` (`BR-ARB-04`). Layout
   riêng, không dùng `manager.vue` (layout đó giả định đã đăng nhập).
5. **Hiện mã khôi phục đúng một lần** sau khi enroll xong, kèm bước xác nhận "đã lưu"
   (`BR-MFA-07`).
6. **`apps/admin/app/middleware/auth.global.ts`.** Chưa có manager trong state → gọi
   `GET /api/managers/auth/session`; 401 → điều hướng `/login`. Trang `/login` được miễn.

**Checkpoint 2:** đăng nhập được từ tài khoản seed đến dashboard trên máy dev, chạy thật
bằng `pnpm dev` + `pnpm dev:admin`.

### Phase 3 — Cổng và dọn

7. **Gate `BR-ADA-01`:** test quét `apps/admin/app/pages/**` xác nhận mọi trang ngoài
   `/login` đều nằm dưới guard, kèm fixture âm là một trang không có guard.
8. **Cập nhật** `docs/specs/index.md`, [`roadmap.md`](../specs/roadmap.md) và `.agents` nếu luồng đăng nhập được
   mô tả ở đó.

### Phase 4 — Gieo tài khoản kiểm thử hạt giống (Seed Test Accounts & Env-Free)

9. **Tạo `packages/db/src/seed-master/accounts.ts`:**
   - Seed mặc định 2 Manager: `admin@mindkid.test` (`xK9#mQ2$vL8!wP5@`, `super_admin`, MFA off), `reviewer@mindkid.test` (`jR4$yT7#nE2!zM9&`, `content_reviewer`, MFA off).
   - Seed mặc định 3 User: `parent.free@mindkid.test` (`hB8#kF3$sV6!dQ1*`), `parent.standard@mindkid.test` (`wP2$uN9#tX4!cA7^`), `parent.pro@mindkid.test` (`qM5#gH8$rK3!yB6%`).
   - Tự động gắn 5 hồ sơ trẻ `child_profiles`, gói `entitlements` tương ứng và `consent_logs`.
10. **Cập nhật `packages/db/src/seed.ts`:**
    - Gỡ bỏ `requireEnv("INITIAL_ADMIN_EMAIL")` và `requireEnv("INITIAL_ADMIN_PASSWORD")` bắt buộc; gọi `seedInitialAccounts(db)`.
    - Cho phép chạy `pnpm db:seed` ngay lập tức mà không đòi hỏi file cấu hình `.env`.
11. **Integration Test `packages/db/tests/integration/seed-accounts.test.ts`:**
    - Kiểm tra luỹ đẳng (idempotent), xác thực mật khẩu argon2id sau seed.

## 4. Verification

```bash
pnpm --filter @mindkid/gates test          # lint:specs, rule-ids, runtime-boundary
pnpm --filter @mindkid/web test            # enrollment + login API
pnpm --filter @mindkid/admin test          # page + guard
pnpm typecheck:web                         # cổng delta, không tăng
pnpm lint
```

Thủ công: seed sạch → `pnpm dev` + `pnpm dev:admin` → đăng nhập bằng
`INITIAL_ADMIN_EMAIL` → enroll bằng app xác thực → vào dashboard → đăng xuất → đăng nhập
lại bằng TOTP → đăng nhập lại bằng một mã khôi phục.

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Enrollment thành đường vòng bỏ qua MFA nếu quên chặn tài khoản đã bật | Cao | `BR-MME-01` có scenario riêng và test âm chạy trước khi viết route |
| Transaction nửa vời khoá Manager ra ngoài vĩnh viễn | Cao | `BR-MME-05`: một transaction, có test cho nhánh lỗi |
| Challenge hai bước làm hỏng bất biến một-lần | Trung bình | `BR-MME-03`: challenge cũ phải chết, có test dùng lại |
| Guard client bị nhầm là phân quyền | Trung bình | `BR-ADA-04` giữ nguyên; gate quét trang, không quét quyền |
| Seed manager không đổi mật khẩu ban đầu | Trung bình | Open question #1 của spec enrollment, chặn go-live chứ không chặn task |

## 6. Câu hỏi mở

- Manager đầu tiên có bị bắt đổi mật khẩu seed ngay trong lần enroll không? (spec §11 #1)
- Có giới hạn số lần enroll lại trong 24 giờ không? (spec §11 #2)
