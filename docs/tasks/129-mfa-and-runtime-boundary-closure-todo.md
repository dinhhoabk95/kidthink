# Checklist — Task #129: Đóng đuôi MFA Manager và ranh giới runtime

> Kế hoạch: [`129-mfa-and-runtime-boundary-closure-plan.md`](129-mfa-and-runtime-boundary-closure-plan.md).
> Nối tiếp Task #104, #105, #106.
> Tuyệt đối: không dựng lại cổng ở `packages/gates`, không lật `app-runtime-boundary.md` khi
> `BR-ARB-04` chưa có cổng, không deploy đổi khoá trước khi có số đo `mfa_settings`.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] `ls packages/gates` — xác nhận không tồn tại.
- [ ] `grep -rn "findRuntimeBoundaryViolations" apps packages scripts` — xác nhận 0 kết quả.
- [ ] `ls apps/admin/tests` — xác nhận chưa có `gates/`.
- [ ] Đọc `packages/auth/src/totp.ts:9` và `mfa.post.ts:57-69` — hiểu vì sao sai khoá rơi âm thầm.
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP129.1 — Số đo `mfa_settings`

**Cỡ:** S · đo trước mọi thứ khác

- [ ] Chạy `select account_type, count(*), count(confirmed_at) from mfa_settings group by account_type;` trên dữ liệu thật.
- [ ] Ghi con số vào *Ghi chép khi làm*.
- [ ] Nếu khác 0: trả lời `Q129-1` — đường re-enroll, chạy trước hay sau deploy.
- [ ] Chốt câu hỏi mở về re-enroll của Task #106 sau khi có con số.

## WP129.2 — Dựng lại cổng ranh giới runtime

**Cỡ:** M · ở `apps/admin/tests/gates/`, **không** ở `packages/gates`

- [ ] Ca âm: `.vue` gọi `fetch("/api/...")` trực tiếp.
- [ ] Ca âm: template literal `` `${x}/api/...` ``.
- [ ] Ca âm: `window.open("/api/...")`.
- [ ] Ca âm: trang mới ngoài `/login` không guard.
- [ ] Ca âm: trỏ cổng vào thư mục rỗng → đỏ, không xanh.
- [ ] Fixture ở `apps/admin/tests/gates/fixtures/`, không viết thẳng vào file test.
- [ ] Phép kiểm `BR-ARB-04`: mọi URL API qua `apiUrl()` — chuỗi, template literal, `href`, `src`, `window.open`.
- [ ] Cổng báo **mọi** match, không dừng ở cái đầu — fixture nhiều vi phạm chứng minh.
- [ ] Phép kiểm guard: mọi trang ngoài `/login` nằm dưới guard.
- [ ] Cổng nhận root làm tham số (điểm I1/I2 của Task #104).
- [ ] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [ ] Nối vào `pnpm test`.
- [ ] Năm ca âm chuyển sang đỏ vì đúng lý do.

## WP129.3 — Manager login page ở hai app

**Cỡ:** S

- [ ] Xác nhận `apps/admin/app/pages/login.vue` tồn tại và chạy được.
- [ ] `Q129-2` — thử đăng nhập Manager thật qua `admin.{domain}` và qua `{domain}`.
- [ ] Ghi kết quả: cookie host-only đặt được ở host nào.
- [ ] Chốt host chính thức; nếu cần, spec `app-runtime-boundary.md` cập nhật trong cùng PR.

## WP129.4 — Đóng đuôi và phê chuẩn

**Cỡ:** S

- [ ] Tick hai ô còn lại của [`104-app-runtime-boundary-todo.md`](104-app-runtime-boundary-todo.md).
- [ ] Tick hai ô còn lại của [`106-totp-key-custody-todo.md`](106-totp-key-custody-todo.md).
- [ ] Sửa bước nghiệm thu của [`105-manager-login-surface-todo.md`](105-manager-login-surface-todo.md) — bỏ `pnpm --filter @mindkid/gates test`, trỏ sang cổng mới.
- [ ] **Đo lại** bảy scenario mục 9 của `manager-mfa-enrollment.md`, mỗi cái kèm ca âm.
- [ ] `manager-mfa-enrollment.md` → `status: implemented`.
- [ ] `app-runtime-boundary.md` → `status: implemented`, chỉ sau khi cổng WP129.2 sống.
- [ ] Ghi `Q129-3` (113 rule còn lại mất cưỡng chế) vào một chỗ có chủ — không để trôi.

## Nghiệm thu

- [ ] Con số `mfa_settings` theo `account_type` đã đo và ghi lại.
- [ ] Nếu khác 0: đường re-enroll đã chốt, ghi trong PR.
- [ ] Cổng ranh giới runtime sống ở `apps/admin/tests/gates/`.
- [ ] Năm ca âm đều đỏ vì đúng lý do.
- [ ] Cổng báo mọi match, không dừng ở cái đầu.
- [ ] Đăng nhập Manager thật chạy qua đúng host đã chốt.
- [ ] Bảy scenario của `manager-mfa-enrollment.md` đo lại và xanh.
- [ ] Hai spec mang `status: implemented`.
- [ ] Task #105 không còn bước nghiệm thu gọi `@mindkid/gates`.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- `mfa_settings` theo `account_type`: ................
- Đường re-enroll (nếu cần): ................
- Host đăng nhập Manager đã chốt: ................
- Chỗ ghi `Q129-3`: ................
