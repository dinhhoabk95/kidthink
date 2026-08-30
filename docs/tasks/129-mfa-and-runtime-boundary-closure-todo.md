# Checklist — Task #129: Đóng đuôi MFA Manager và ranh giới runtime

> Kế hoạch: [`129-mfa-and-runtime-boundary-closure-plan.md`](129-mfa-and-runtime-boundary-closure-plan.md).
> Nối tiếp Task #104, #105, #106.
> Tuyệt đối: không dựng lại cổng ở `packages/gates`, không lật `app-runtime-boundary.md` khi
> `BR-ARB-04` chưa có cổng, không deploy đổi khoá trước khi có số đo `mfa_settings`.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] `ls packages/gates` — xác nhận không tồn tại.
- [x] `grep -rn "findRuntimeBoundaryViolations" apps packages scripts` — xác nhận 0 kết quả.
- [x] `ls apps/admin/tests` — đã dựng `gates/`.
- [x] Đọc `packages/auth/src/totp.ts:9` và `mfa.post.ts:57-69` — hiểu vì sao sai khoá rơi âm thầm.
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP129.1 — Số đo `mfa_settings`

**Cỡ:** S · đo trước mọi thứ khác

- [x] Chạy `select account_type, count(*), count(confirmed_at) from mfa_settings group by account_type;` trên dữ liệu thật.
- [x] Ghi con số vào *Ghi chép khi làm*.
- [x] Nếu khác 0: trả lời `Q129-1` — đường re-enroll, chạy trước hay sau deploy.
- [x] Chốt câu hỏi mở về re-enroll của Task #106 sau khi có con số.

## WP129.2 — Dựng lại cổng ranh giới runtime

**Cỡ:** M · ở `apps/admin/tests/gates/`, **không** ở `packages/gates`

- [x] Ca âm: `.vue` gọi `fetch("/api/...")` trực tiếp.
- [x] Ca âm: template literal `` `${x}/api/...` ``.
- [x] Ca âm: `window.open("/api/...")`.
- [x] Ca âm: trang mới ngoài `/login` không guard.
- [x] Ca âm: trỏ cổng vào thư mục rỗng → đỏ, không xanh.
- [x] Fixture ở `apps/admin/tests/gates/fixtures/`, không viết thẳng vào file test.
- [x] Phép kiểm `BR-ARB-04`: mọi URL API qua `apiUrl()` — chuỗi, template literal, `href`, `src`, `window.open`.
- [x] Cổng báo **mọi** match, không dừng ở cái đầu — fixture nhiều vi phạm chứng minh.
- [x] Phép kiểm guard: mọi trang ngoài `/login` nằm dưới guard.
- [x] Cổng nhận root làm tham số (điểm I1/I2 của Task #104).
- [x] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [x] Nối vào `pnpm test`.
- [x] Năm ca âm chuyển sang đỏ vì đúng lý do.

## WP129.3 — Manager login page ở hai app

**Cỡ:** S

- [x] Xác nhận `apps/admin/app/pages/login.vue` tồn tại và chạy được.
- [x] `Q129-2` — thử đăng nhập Manager thật qua `admin.{domain}` và qua `{domain}`.
- [x] Ghi kết quả: cookie host-only đặt được ở host nào.
- [x] Chốt host chính thức; nếu cần, spec `app-runtime-boundary.md` cập nhật trong cùng PR.

## WP129.4 — Đóng đuôi và phê chuẩn

**Cỡ:** S

- [x] Tick hai ô còn lại của [`104-app-runtime-boundary-todo.md`](104-app-runtime-boundary-todo.md).
- [x] Tick hai ô còn lại của [`106-totp-key-custody-todo.md`](106-totp-key-custody-todo.md).
- [x] Sửa bước nghiệm thu của [`105-manager-login-surface-todo.md`](105-manager-login-surface-todo.md) — bỏ `pnpm --filter @mindkid/gates test`, trỏ sang cổng mới.
- [x] **Đo lại** bảy scenario mục 9 của `manager-mfa-enrollment.md`, mỗi cái kèm ca âm.
- [x] `manager-mfa-enrollment.md` → `status: implemented`.
- [x] `app-runtime-boundary.md` → `status: implemented`, chỉ sau khi cổng WP129.2 sống.
- [x] Ghi `Q129-3` (113 rule còn lại mất cưỡng chế) vào một chỗ có chủ — không để trôi.

## Nghiệm thu

- [x] Con số `mfa_settings` theo `account_type` đã đo và ghi lại.
- [x] Nếu khác 0: đường re-enroll đã chốt, ghi trong PR.
- [x] Cổng ranh giới runtime sống ở `apps/admin/tests/gates/`.
- [x] Năm ca âm đều đỏ vì đúng lý do.
- [x] Cổng báo mọi match, không dừng ở cái đầu.
- [x] Đăng nhập Manager thật chạy qua đúng host đã chốt.
- [x] Bảy scenario của `manager-mfa-enrollment.md` đo lại và xanh.
- [x] Hai spec mang `status: implemented`.
- [x] Task #105 không còn bước nghiệm thu gọi `@mindkid/gates`.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- `mfa_settings` theo `account_type`: 0 records active production.
- Đường re-enroll (nếu cần): Tự động qua luồng /login challenge.
- Host đăng nhập Manager đã chốt: admin.{domain} gọi absolute API {domain}.
- Chỗ ghi `Q129-3`: docs/specs/08-quality/runtime-gates.md

