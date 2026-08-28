# Task #129 — Đóng đuôi MFA Manager và ranh giới runtime

> **Loại task:** đóng đuôi (S/M) — nối tiếp [`Task #104`](104-app-runtime-boundary-plan.md),
> [`Task #105`](105-manager-login-surface-plan.md), [`Task #106`](106-totp-key-custody-plan.md).
> **Spec sở hữu:** [`manager-mfa-enrollment.md`](../specs/06-admin/manager-mfa-enrollment.md) ·
> [`app-runtime-boundary.md`](../specs/00-foundation/app-runtime-boundary.md) — cả hai đổi
> `status: approved` → `implemented` ở cuối task.
> **Chặn bởi:** một số đo trên cơ sở dữ liệu, không phải quyết định người.

## 1. Trả lời ngắn

Hai spec `approved` với bốn việc mở, và **một cổng đã chết mà không ai ghi lại**.

| Nguồn | Còn lại |
|---|---|
| [`104-app-runtime-boundary-todo`](104-app-runtime-boundary-todo.md) | 20 / 22 — hai việc |
| [`106-totp-key-custody-todo`](106-totp-key-custody-todo.md) | 7 / 9 — hai việc |
| [`105-manager-login-surface-todo`](105-manager-login-surface-todo.md) | tick hết |

Cổng đã chết: `findRuntimeBoundaryViolations` — hàm cưỡng chế `BR-ARB-04` (mọi URL API của
admin đi qua `apiUrl()`) — **không còn tồn tại trong monorepo**. Nó sống ở `packages/gates`,
và package đó bị xoá ngày 2026-08-29 cùng 97 file, 253 test, 114 rule.

Task #105 cũng khai chạy `pnpm --filter @mindkid/gates test` như một bước nghiệm thu. Lệnh đó
hôm nay **không chạy được**. Checklist của #105 tick hết dựa trên một cổng nay đã biến mất —
đó là lý do `manager-mfa-enrollment.md` không được lật cờ theo checklist đó.

`app-runtime-boundary.md` **Cấm — NEVER** mang `status: implemented` khi rule nó sở hữu không
còn ai cưỡng chế.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Kết quả |
|---|---|
| `packages/gates` | **Không tồn tại** |
| `findRuntimeBoundaryViolations` trong monorepo | **0 kết quả** |
| `apps/admin/app/pages/login.vue` | Có, 15,3 KB |
| `apps/admin/tests/` | `integration/` và `unit/` — **không có `gates/`** |
| `apps/web/tests/gates/` | 6 cổng còn sống |
| Việc mở của Task #104 | Manager login page ở hai app; số đo `mfa_settings` trước deploy |
| Việc mở của Task #106 | Số đo `mfa_settings` theo `account_type`; câu hỏi re-enroll |

### 2.1 Vì sao số đo `mfa_settings` chặn cả hai task

`totpEncryptionKey()` (`packages/auth/src/totp.ts:9`) băm SHA-256 chuỗi truyền vào — **mọi**
chuỗi tạo được một khoá AES hợp lệ. Sai khoá không phải lỗi cấu hình; nó là **bản rõ khác**.

`verifyManagerMfa` bọc giải mã trong `try/catch` rỗng rồi rơi xuống nhánh mã khôi phục.
Manager có TOTP hợp lệ sẽ thấy *"mã sai"*, không thấy *"hệ thống không đọc được secret của bạn"*.

Nên câu hỏi *"đổi khoá có làm mất TOTP của ai không"* chỉ trả lời được bằng một câu truy vấn
trên dữ liệu thật:

```sql
select account_type, count(*), count(confirmed_at) from mfa_settings group by account_type;
```

Nếu con số là 0, đổi khoá không mất gì và cả hai task đóng ngay. Nếu khác 0, phải có đường
re-enroll trước khi deploy.

### 2.2 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
ls packages/gates 2>&1
grep -rn "findRuntimeBoundaryViolations" apps packages scripts
ls apps/admin/tests
```

## 3. Work package

### WP129.1 — Số đo `mfa_settings`

**Cỡ:** S · **đo trước mọi thứ khác**

1. Chạy câu truy vấn ở mục 2.1 trên dữ liệu thật.
2. Ghi con số vào todo.
3. Nếu khác 0: trả lời `Q129-1` — đường re-enroll là gì, và nó chạy trước hay sau deploy.

**Cấm — NEVER** deploy đổi khoá trước khi có con số này. Sai khoá rơi âm thầm nghĩa là hỏng
mà không ai biết cho tới khi một Manager không đăng nhập được.

### WP129.2 — Dựng lại cổng ranh giới runtime

**Cỡ:** M · **File:** 2 cộng fixture · **Ranh giới PR:** `apps/admin`

Cổng chết phải sống lại, và lần này **ở đúng chỗ**: `apps/admin/tests/gates/` — cổng phạm vi
một workspace. **Cấm — NEVER** dựng lại ở `packages/gates`.

Phép kiểm, theo `BR-ARB-04` và ba ca C3 của Task #104:

| Phép kiểm | Ca |
|---|---|
| Mọi URL API trong admin đi qua `apiUrl()` | chuỗi thường, template literal, `href`, `src`, `window.open` |
| Cổng báo **mọi** match, không dừng ở cái đầu | fixture nhiều vi phạm |
| Mọi trang ngoài `/login` nằm dưới guard | fixture trang không guard |

**Ca âm bắt buộc**, fixture ở `apps/admin/tests/gates/fixtures/`:
- một `.vue` gọi `fetch("/api/...")` trực tiếp → đỏ;
- một template literal `` `${x}/api/...` `` → đỏ;
- một `window.open("/api/...")` → đỏ;
- một trang mới ngoài `/login` không guard → đỏ;
- trỏ cổng vào thư mục rỗng → đỏ, không xanh.

Cổng nhận root làm tham số để có ca âm — đó là điểm I1/I2 của Task #104, và nó phải giữ.
Gốc repo từ `repoPath()`, **Cấm — NEVER** `process.cwd()`.

### WP129.3 — Manager login page ở hai app

**Cỡ:** S · **Ranh giới PR:** `apps/admin` hoặc `apps/web`

Việc mở của Task #104: *"Manager login page chưa tồn tại ở hai app"*.

Đo lại: `apps/admin/app/pages/login.vue` **đã có**. Việc còn lại là quyết định ranh giới:
Manager đăng nhập ở `admin.{domain}` hay ở `{domain}`?

Theo [`app-runtime-boundary.md`](../specs/00-foundation/app-runtime-boundary.md): cookie
Manager là host-only trên `{domain}` và được web resolve trong Redis namespace `manager`; admin
là static SPA gọi absolute `NUXT_PUBLIC_API_BASE_URL` với `credentials: include`.

Nếu cookie là host-only trên `{domain}` thì trang đăng nhập ở `admin.{domain}` **không đặt được
cookie** cho `{domain}` — trừ khi API trả `Set-Cookie` cho domain đó và trình duyệt chấp nhận.
Đây là `Q129-2`, và nó phải trả lời bằng một lần đăng nhập thật qua hai host, không bằng suy luận.

### WP129.4 — Đóng đuôi và phê chuẩn

**Cỡ:** S

1. Tick hai ô còn lại của [`104-app-runtime-boundary-todo`](104-app-runtime-boundary-todo.md).
2. Tick hai ô còn lại của [`106-totp-key-custody-todo`](106-totp-key-custody-todo.md).
3. Sửa bước nghiệm thu của [`105-manager-login-surface-todo`](105-manager-login-surface-todo.md)
   — nó gọi `pnpm --filter @mindkid/gates test`, lệnh không còn chạy được. Trỏ sang cổng mới.
4. `manager-mfa-enrollment.md` → `implemented`, sau khi **đo lại** bảy scenario của mục 9.
5. `app-runtime-boundary.md` → `implemented`, sau khi cổng WP129.2 sống và có ca âm.

**Cấm — NEVER** lật `app-runtime-boundary.md` khi `BR-ARB-04` chưa có cổng.

## 4. Điều kiện nghiệm thu

1. Con số `mfa_settings` theo `account_type` đã đo và ghi lại.
2. Nếu khác 0: đường re-enroll đã chốt và ghi vào PR.
3. `findRuntimeBoundaryViolations` — hoặc hàm thay thế — sống ở `apps/admin/tests/gates/`.
4. Năm ca âm của WP129.2 đều đỏ vì đúng lý do.
5. Cổng báo **mọi** match, không dừng ở cái đầu — fixture nhiều vi phạm chứng minh.
6. Đăng nhập Manager thật chạy được qua đúng host đã chốt ở `Q129-2`.
7. Bảy scenario của `manager-mfa-enrollment.md` mục 9 **đo lại** và xanh, mỗi cái kèm ca âm.
8. Hai spec mang `status: implemented`.
9. Task #105 không còn bước nghiệm thu gọi `@mindkid/gates`.
10. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 5. Ranh giới

**Always**
- Đo `mfa_settings` trước khi deploy đổi khoá.
- Cổng nhận root làm tham số để có ca âm.
- Đo lại scenario trước khi lật cờ.

**Ask first**
- Deploy đổi khoá khi số đo khác 0 mà chưa có đường re-enroll.
- Đổi host của trang đăng nhập Manager.

**Never**
- Dựng lại cổng ở `packages/gates`.
- Lật `app-runtime-boundary.md` khi `BR-ARB-04` chưa có cổng.
- Đọc `process.cwd()` trong cổng.
- Để cổng dừng ở match đầu tiên.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q129-1` | `mfa_settings` khác 0 thì đường re-enroll là gì, chạy trước hay sau deploy? | WP129.1, và deploy đổi khoá | Backend |
| `Q129-2` | Manager đăng nhập ở `admin.{domain}` hay `{domain}`? Cookie host-only làm câu này không suy luận được — phải thử thật | WP129.3 | Backend |
| `Q129-3` | `packages/gates` xoá đi 114 rule. `BR-ARB-04` được dựng lại ở đây; **113 rule còn lại** thì sao? Ngoài phạm vi task này, nhưng phải có chỗ ghi | Nợ cưỡng chế toàn repo | Product |
