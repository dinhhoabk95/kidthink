# Kế hoạch — Task #23: P0.10 — Auth end-to-end bằng email và mật khẩu

> Viết 2026-08-09, đo tại commit `5a1bb2b`. Bước sở hữu: **P0.10** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`registration.md`](../specs/03-account/registration.md) ·
> [`email-verification.md`](../specs/03-account/email-verification.md) ·
> [`login-and-session.md`](../specs/03-account/login-and-session.md) ·
> [`password-recovery.md`](../specs/03-account/password-recovery.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Đây là bước đầu tiên của P0 mà **người dùng thật chạm được**. Kiểm giữa phase của
[`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) viết đúng câu đo
được: *"một người dùng thật đăng ký → nhận email → đăng nhập → đổi mật khẩu, không dùng seed tay"*.

Bốn spec gộp làm một bước vì tách ra thì không có gì chạy được giữa chừng (quyết định D1 của
Task #14). Đăng ký mà không xác thực được email là tài khoản chết; đăng nhập mà không khôi
phục được mật khẩu là tài khoản mất là mất.

Điểm khác so với P0.4–P0.9b: **schema đã đủ và đúng**. `users` `active_sessions`
`verification_tokens` `social_identities` `consent_logs` `mfa_settings` đều có mặt, enum
`auth_method` và `verification_purpose` đều có. Bước này gần như thuần tầng dịch vụ và route.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `AUTH-TOKENS-SESSIONS` · `ACTORS` | P0.3 | **phải đóng trước** |
| `CHILD-DATA-COMPLIANCE` | P0.4 | `BR-REG-04` chặn tạo trẻ khi chưa xác thực |
| `NOTIFICATION-SERVICE` | P0.9b | ba luồng đều gửi email |
| `RATE-LIMITING` | P0.9b | `BR-REG-09` `BR-LGN-02` `BR-EVF-07` `BR-PWR-06` |
| `ERROR-CODES` | registry | tra ở mọi bước |

Bước này **không tách khối chạy sớm được**. Mọi task đều đọc context của `ACTORS` hoặc gửi
email hoặc cần guard tần suất. Thứ tự roadmap ở đây là thứ tự thật.

## 1. Đo được

### 1.1 Schema đã đủ

| Bảng / enum | Có | Dùng cho |
|---|---|---|
| `users` (`status`, `password_hash` nullable, `refresh_token_version`, `email_verified_at`, `purge_at`) | có | cả bốn spec |
| `active_sessions` (có cột `auth_method`) | có | `BR-LGN-05` `BR-LGN-10` |
| `verification_tokens` (`purpose`, `token_hash` UNIQUE, `expires_at`, `used_at`) | có | `BR-EVF-01` `BR-PWR-02` |
| `consent_logs` INSERT-only ở tầng quyền DB | có | `BR-REG-03` |
| `social_identities` | có | `BR-PWR-11` — luồng khôi phục **không** được đụng vào |
| enum `auth_method` = `password | social` | có | `BR-LGN-10` |
| `citext` cho `users.email` | có | `BR-REG-07` |

`password_hash` **nullable** là chi tiết quan trọng: nó tồn tại để tài khoản chỉ có SNS ở P1
vẫn hợp lệ. `BR-LGN-09` và `BR-PWR-10` là hai rule bảo vệ chính chi tiết đó — cả hai phải
được cài **ở P0**, dù SNS chưa bật, vì cả hai nói về **cách hệ thống trả lời**, không về OAuth.

### 1.2 `packages/auth` đã có nền từ P0.3

P0.3 đang giao `contracts.ts` `ports.ts` `errors.ts` `user-session.ts` `manager-session.ts`
`refresh.ts` `csrf.ts` `reauth.ts` `actor-boundaries.ts`.

Nghĩa là P0.10 **không** viết lại vòng đời token, xoay refresh, hay CSRF. `BR-LGN-03`
(refresh xoay, tái dùng thu hồi toàn bộ) là `BR-AUT-04` của P0.3 — P0.10 chỉ **gọi** và viết
test ở tầng luồng, không cài lại.

### 1.3 Cái chưa có

Toàn bộ tầng route và luồng: `register` · `verify-email` · `resend-verification` · `login` ·
`sessions` · `logout` · `logout-all` · `forgot-password` · `reset-password`, cùng trang
`/dang-ky` `/dang-nhap` `/xac-thuc` `/quen-mat-khau` `/dat-lai-mat-khau`.

## 2. Quyết định

**D-EO — Dùng lại `packages/auth`, không cài lại vòng đời token.** Hai bản cài đặt cho cùng
một cơ chế xoay refresh là hai bản sẽ lệch nhau. P0.10 gọi, và test ở tầng luồng.

**D-EP — Bốn rule chống rò danh tính là một nhóm, test chung.** `BR-REG-10` `BR-LGN-01`
`BR-LGN-09` `BR-PWR-01` `BR-PWR-10` đều nói cùng một điều: **câu trả lời không được đổi theo
việc tài khoản có tồn tại hay đăng ký bằng cách nào**. Viết rời từng chỗ là bảo đảm một chỗ
sẽ lệch. Gom thành một bộ test so **cặp** phản hồi, gồm cả chênh lệch thời gian.

**D-EQ — Chế độ hạn chế ép ở server, không ở UI.** `BR-REG-04` / `BR-EVF-06` nói
`pending_verification` không tạo được child profile. Ẩn nút là không phải cổng — cùng lý do
với `BR-LAD-03`.

**D-ER — Cài `BR-LGN-09` và `BR-PWR-10` ngay ở P0, dù SNS ở P1.** Hai rule này quy định cách
trả lời khi `password_hash IS NULL`. Nếu P0 viết luồng theo giả định "mọi tài khoản đều có mật
khẩu", P1 sẽ phải sửa đúng những nhánh nhạy cảm nhất — trong lúc đã có người dùng thật.

**D-ES — Không xây UI SNS ở P0.** `BR-REG-11` (nút SNS đứng trước form) chỉ có nghĩa khi có
provider bật. P0 giao **chỗ** cho nút đó trong thứ tự DOM và một cờ tắt, để P1 gắn vào mà
không xếp lại trang.

## 3. Đồ thị

```
T1 register (3 trường · 2 consent · pending_verification)
      └──→ T2 verify-email (token hash 24h · resend 3/h · điều hướng /me/children/new)
                └──→ T3 login + danh sách thiết bị + logout / logout-all
                          └──→ T4 password recovery (luôn 200 · 60 phút · giết mọi phiên)
                                    └──→ T5 bộ test chống rò danh tính (D-EP)
                                              └──→ T6 chế độ hạn chế ép ở server
                                                        └──→ T7 kiểm end-to-end người thật
                              ── Cổng dừng ──
  T8 evidence và promote
```

Thứ tự tuyến tính là **có chủ ý**: mỗi task để lại hệ thống ở trạng thái dùng được, và task
sau kiểm chứng task trước bằng một luồng người thật.

## 4. Task

### Task 1 — Đăng ký

**Tiêu chí nghiệm thu**
- [ ] `POST /api/guest/auth/users/register` nhận đúng 5 field §7.1; field lạ bị từ chối.
- [ ] `BR-REG-01`: trang `/dang-ky` chỉ có ba input; ca âm — cổng quét trang, thấy ô tuổi/giới tính/số điện thoại là **đỏ** (`BR-REG-08`).
- [ ] `BR-REG-02`: hai checkbox riêng, **không** tick sẵn, nút vô hiệu tới khi tick cả hai.
- [ ] `BR-REG-03`: đăng ký thành công ghi **2 hàng** `consent_logs`, mỗi hàng có `policy_version` `ip_address` `user_agent`.
- [ ] `BR-REG-05`: mật khẩu ≥8 ký tự, **không** ép ký tự đặc biệt; `"chuoixanh123"` thành công, `"12345678"` bị 422 (danh sách mật khẩu phổ biến).
- [ ] `BR-REG-07`: `A@Example.com` trùng `a@example.com` → 409.
- [ ] `BR-REG-06`: sau đăng ký, mọi `play_sessions` guest cũ giữ nguyên `child_profile_id NULL`; ca âm — không đường code nào gán chúng cho user mới.
- [ ] `BR-REG-09`: rate limit `auth:register` theo IP (bảng của P0.9b).
- [ ] Chỗ cho nút SNS có trong thứ tự DOM, sau một cờ đang tắt (D-ES).

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/web test -- register` xanh, assertion tham chiếu `BR-REG-02` `BR-REG-03` `BR-REG-06` `BR-REG-07`.

**Phụ thuộc:** P0.3 · P0.4 · P0.9b · **Cỡ:** M

### Task 2 — Xác thực email

**Tiêu chí nghiệm thu**
- [ ] Token 32 byte ngẫu nhiên base64url; **chỉ hash** vào DB (`BR-EVF-01`); ca âm — giá trị trong DB khác giá trị trong email.
- [ ] Hạn **24 giờ**, dùng **một lần** (`BR-EVF-02`).
- [ ] `BR-EVF-03`: gửi lại vô hiệu token cũ.
- [ ] `BR-EVF-04`: bấm lại link khi đã `active` → chuyển `/me`, **không** báo lỗi.
- [ ] `BR-EVF-05`: token không tồn tại → thông báo chung; ca âm — response **không** chứa email nào.
- [ ] `BR-EVF-07`: `resend` 4 lần trong một giờ → lần thứ 4 trả 429.
- [ ] `POST /resend-verification` trả **200 luôn**, kể cả khi đã `active`.
- [ ] `BR-EVF-08`: xác thực xong đích là `/me/children/new`.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/web test -- verify-email` xanh, assertion tham chiếu `BR-EVF-01` `BR-EVF-02` `BR-EVF-03` `BR-EVF-07`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Đăng nhập và quản lý phiên

**Tiêu chí nghiệm thu**
- [ ] `POST login` cấp access 15 phút + refresh 7 ngày qua `packages/auth` (D-EO), ghi `active_sessions` kèm `auth_method = 'password'`.
- [ ] `BR-LGN-08`: đích là `/me`, **không** `/play`; điều hướng theo ngữ cảnh §7.2.
- [ ] `BR-LGN-04`: `logout` xoá phiên hiện tại; `logout-all` tăng `refresh_token_version`. Hai hành vi khác nhau, có test riêng.
- [ ] `BR-LGN-05`: danh sách thiết bị hiện nhãn thô; ca âm — response **không** chứa IP đầy đủ.
- [ ] `BR-LGN-10`: mỗi dòng hiện `auth_method`.
- [ ] `BR-LGN-06`: đổi mật khẩu giết mọi phiên **khác**, giữ phiên hiện tại.
- [ ] `BR-LGN-07`: không cơ chế "ghi nhớ đăng nhập" nào vượt 7 ngày; ca âm là cổng quét TTL.
- [ ] Thu hồi một phiên: thiết bị đó mất quyền ở request kế tiếp, hai phiên còn lại không ảnh hưởng.
- [ ] `pending_verification` đăng nhập được ở chế độ hạn chế; `suspended` → 403; `deleted` trong 30 ngày → 403 kèm đường huỷ yêu cầu xoá.
- [ ] `BR-LGN-03` gọi lại `refresh.ts` của P0.3, **không** cài lại; test tầng luồng: tái dùng refresh → 401 và thu hồi toàn bộ.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/web test -- login sessions` xanh, assertion tham chiếu `BR-LGN-04` `BR-LGN-05` `BR-LGN-06` `BR-LGN-08` `BR-LGN-10`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Quên và đặt lại mật khẩu

**Tiêu chí nghiệm thu**
- [ ] `forgot-password` trả **200 luôn**, thông báo cố định §7 (`BR-PWR-01`).
- [ ] Token hash, hạn **60 phút**, dùng một lần (`BR-PWR-02`).
- [ ] `BR-PWR-05`: yêu cầu mới vô hiệu token cũ; hạn 3 lần/giờ.
- [ ] `BR-PWR-03` + `BR-PWR-12`: đặt lại tăng `refresh_token_version` → cả ba thiết bị mất phiên.
- [ ] `BR-PWR-04`: gửi email thông báo sau khi đổi thành công.
- [ ] `BR-PWR-09`: **không** đặt cookie phiên nào sau khi đặt lại; chuyển tới trang đăng nhập.
- [ ] `BR-PWR-08`: mật khẩu mới theo **cùng** quy tắc đăng ký — dùng chung một validator với T1, không viết bản thứ hai.
- [ ] `BR-PWR-07`: cổng quét route auth — không route nào đổi mật khẩu mà thiếu token hoặc phiên hợp lệ.
- [ ] `BR-PWR-10`: tài khoản `password_hash IS NULL` **vẫn** đi hết luồng và **đặt** được mật khẩu (D-ER).
- [ ] `BR-PWR-11`: sau khi đặt mật khẩu, hàng `social_identities` **còn nguyên**; ca âm — không đường code nào trong luồng này chạm bảng đó.
- [ ] `suspended` → không gửi email đặt lại.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/web test -- password-recovery` xanh, assertion tham chiếu `BR-PWR-01` `BR-PWR-03` `BR-PWR-09` `BR-PWR-10` `BR-PWR-11`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Bộ test chống rò danh tính

**Mô tả.** Năm rule cùng nói một điều (D-EP). Gom thành một bộ test so **cặp** phản hồi.

**Tiêu chí nghiệm thu**
- [ ] `BR-LGN-01`: email đã đăng ký sai mật khẩu **và** email chưa đăng ký → cùng mã, cùng thông báo, chênh lệch thời gian **< 50 ms**.
- [ ] `BR-LGN-09`: tài khoản `password_hash NULL` **và** email chưa đăng ký → cùng mã, cùng thông báo, chênh lệch **< 50 ms**.
- [ ] `BR-PWR-01` + `BR-PWR-10`: `forgot-password` cho tài khoản có mật khẩu, tài khoản chỉ SNS, và email không tồn tại → **ba** phản hồi giống hệt.
- [ ] `BR-REG-10`: 409 trùng email **không** chứa tên provider; ca âm quét body.
- [ ] Đo thời gian trên **nhiều lần chạy**, so trung vị, không so một lần.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/web test -- identity-disclosure` xanh, assertion tham chiếu cả năm mã rule.

**Phụ thuộc:** T4 · **Cỡ:** M

### Task 6 — Chế độ hạn chế ép ở server

**Tiêu chí nghiệm thu**
- [ ] `BR-REG-04` / `BR-EVF-06`: `pending_verification` gọi `POST /api/users/children` → **403**, kiểm ở server (D-EQ).
- [ ] Bảng §7.3 đúng cả hai cột: xem catalog / chơi `free` / xem giá **được**; tạo trẻ / tạo đơn / lưu tiến độ **không**.
- [ ] Ca âm: gọi thẳng API bằng curl, bỏ qua UI, vẫn 403.
- [ ] Cổng: không route nào trong nhóm bị chặn thiếu kiểm trạng thái.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/web test -- restricted-mode` xanh, assertion tham chiếu `BR-REG-04` `BR-EVF-06`.

**Phụ thuộc:** T5 · **Cỡ:** S

### Task 7 — Kiểm end-to-end người thật

**Mô tả.** Đây là kiểm giữa phase của Task #14, viết nguyên văn: *"một người dùng thật đăng ký
→ nhận email → đăng nhập → đổi mật khẩu, không dùng seed tay"*.

**Tiêu chí nghiệm thu**
- [ ] Chạy trên môi trường local sạch, database rỗng, **không** INSERT tay hàng nào.
- [ ] Email đọc được từ adapter local của P0.9b; link trong email bấm được.
- [ ] Sau đổi mật khẩu, đăng nhập lại bằng mật khẩu mới thành công và mật khẩu cũ thất bại.
- [ ] Ghi lại từng bước và kết quả vào checklist — không tick bằng lời.

**Kiểm chứng**
- [ ] Kịch bản chạy được lặp lại; ghi thời gian và kết quả.

**Phụ thuộc:** T6 · **Cỡ:** M

### Cổng dừng

- [ ] Luồng người thật chạy hết, không seed tay.
- [ ] Năm rule chống rò danh tính có bộ test chung, gồm đo thời gian.
- [ ] Chế độ hạn chế ép ở server, curl không đi vòng được.
- [ ] Không cài lại vòng đời token; `packages/auth` là nơi duy nhất (D-EO).
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human security reviewer approve diff — vùng nhạy cảm **auth**, không auto-merge.

### Task 8 — Evidence và promote

- [ ] Mỗi `BR-REG-*` `BR-EVF-*` `BR-LGN-*` `BR-PWR-*` có ít nhất một test tham chiếu mã rule.
- [ ] Rule chỉ có nghĩa khi có SNS (`BR-REG-11`, phần Google/Facebook của `BR-LGN-10`) ghi bước sở hữu **P1.15**, không tick.
- [ ] MFA (`428 MFA_REQUIRED`) ghi bước sở hữu **P2.11**, không cài ở đây — nhưng nhánh 428 phải **có chỗ** trong luồng đăng nhập.
- [ ] Bốn spec sang `implemented` chỉ khi đủ evidence.
- [ ] Tick P0.10 và ô "Sau P0.10" của kiểm giữa phase chỉ khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Cài lại vòng đời token trong luồng login | Hai bản xoay refresh lệch nhau; lỗ hổng ở đúng chỗ khó thấy | D-EO — gọi `packages/auth`, test ở tầng luồng |
| Năm rule chống rò viết rời từng chỗ | Một chỗ lệch là đủ để enumeration hoạt động | D-EP — một bộ test so cặp, có đo thời gian |
| Bỏ `BR-LGN-09`/`BR-PWR-10` vì "SNS ở P1" | P1 phải sửa đúng nhánh nhạy cảm nhất khi đã có người dùng thật | D-ER — cài ở P0, test bằng tài khoản `password_hash NULL` |
| Chế độ hạn chế ẩn bằng UI | Curl đi vòng được, và dữ liệu trẻ bị thu trước khi xác minh người lớn | D-EQ — ép ở server, ca âm bằng curl |
| Đổi mật khẩu không giết phiên | Người đổi mật khẩu vì nghi lộ vẫn để kẻ tấn công ở lại | `BR-LGN-06` và `BR-PWR-03` có test riêng, ba thiết bị |
| Hai validator mật khẩu | Đặt lại với mật khẩu yếu hơn lúc đăng ký | `BR-PWR-08` — dùng chung một validator với T1 |
| Luồng khôi phục đụng `social_identities` | Đặt mật khẩu vô tình gỡ đường vào bằng SNS | `BR-PWR-11` — ca âm khẳng định hàng còn nguyên |

## 6. Giả định

1. **P0.3, P0.4, P0.9b đã đóng.** Không tách khối chạy sớm được ở bước này.
2. **Provider email vẫn là adapter local.** Provider thật chặn deploy P2 (§11 Q1 của [`notification-service.md`](../specs/01-platform/notification-service.md)); luồng người thật ở T7 đọc email từ thư mục local.
3. **MFA chưa bật.** Nhánh `428 MFA_REQUIRED` có chỗ trong luồng nhưng không có cài đặt; [`mfa.md`](../specs/03-account/mfa.md) là P2.11.
4. **Không xây UI SNS.** Chỗ cho nút có sẵn sau một cờ tắt (D-ES).
5. **Trang tiếng Việt theo đường dẫn spec** (`/dang-ky` `/dang-nhap` `/xac-thuc` `/quen-mat-khau` `/dat-lai-mat-khau`).

## 7. Ngoài phạm vi

- Đăng nhập SNS — [`social-login.md`](../specs/03-account/social-login.md) và [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md), P1.15.
- MFA — [`mfa.md`](../specs/03-account/mfa.md), P2.11.
- Đăng nhập admin — [`admin-auth.md`](../specs/06-admin/admin-auth.md), P0.11b.
- Cài đặt tài khoản, đổi email, xoá tài khoản — P1.14.
- Khoá tài khoản chưa xác thực sau N ngày (§11 Q1 của [`email-verification.md`](../specs/03-account/email-verification.md)) — chặn P1.
- Thông báo email khi đăng nhập từ thiết bị mới, dịch vụ geo IP — §11 của [`login-and-session.md`](../specs/03-account/login-and-session.md), chặn P2.
