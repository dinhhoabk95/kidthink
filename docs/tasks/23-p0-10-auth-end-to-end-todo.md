# Checklist — Task #23: P0.10 — Auth end-to-end

> Kế hoạch: [`23-p0-10-auth-end-to-end-plan.md`](23-p0-10-auth-end-to-end-plan.md).
> Vùng nhạy cảm **auth** theo [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md):
> test âm trước, human security reviewer duyệt diff, không auto-merge.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] Human approve kế hoạch và năm quyết định D-EO · D-EP · D-EQ · D-ER · D-ES.
- [ ] **P0.3 đã đóng** — `packages/auth` giao đủ session, refresh, CSRF, reauth.
- [ ] **P0.4 đã đóng** — cổng đồng ý và chặn tạo trẻ.
- [ ] **P0.9b đã đóng** — email và rate limit.
- [ ] Đối chiếu `BR-REG-*` `BR-EVF-*` `BR-LGN-*` `BR-PWR-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Đăng ký

- [ ] `POST /api/guest/auth/users/register` nhận đúng 5 field §7.1; field lạ bị từ chối.
- [ ] `BR-REG-01`: trang `/dang-ky` chỉ ba input.
- [ ] Ca âm `BR-REG-08`: cổng quét thấy ô tuổi/giới tính/số điện thoại là **ĐỎ**.
- [ ] `BR-REG-02`: hai checkbox riêng, không tick sẵn, nút vô hiệu tới khi tick cả hai.
- [ ] `BR-REG-03`: ghi **2 hàng** `consent_logs` kèm `policy_version` `ip_address` `user_agent`.
- [ ] `BR-REG-05`: `"chuoixanh123"` thành công; `"12345678"` trả 422.
- [ ] `BR-REG-07`: `A@Example.com` trùng `a@example.com` → 409.
- [ ] `BR-REG-06`: phiên guest cũ giữ `child_profile_id NULL`; không đường code nào gán chúng.
- [ ] `BR-REG-09`: rate limit `auth:register` theo IP.
- [ ] Chỗ cho nút SNS có trong thứ tự DOM, sau một cờ đang **tắt**.

### Task 2 — Xác thực email

- [ ] Token 32 byte base64url; **chỉ hash** vào DB.
- [ ] Ca âm `BR-EVF-01`: giá trị trong DB khác giá trị trong email.
- [ ] Hạn 24 giờ, dùng một lần.
- [ ] `BR-EVF-03`: gửi lại vô hiệu token cũ.
- [ ] `BR-EVF-04`: bấm lại link khi đã `active` → chuyển `/me`, không báo lỗi.
- [ ] `BR-EVF-05`: token không tồn tại → thông báo chung, response không chứa email nào.
- [ ] `BR-EVF-07`: resend lần thứ 4 trong một giờ → 429.
- [ ] `POST /resend-verification` trả **200 luôn**, kể cả khi đã `active`.
- [ ] `BR-EVF-08`: xác thực xong đích là `/me/children/new`.

### Task 3 — Đăng nhập và quản lý phiên

- [ ] Cấp access 15 phút + refresh 7 ngày **qua `packages/auth`**, không cài lại.
- [ ] Ghi `active_sessions` kèm `auth_method = 'password'`.
- [ ] `BR-LGN-08`: đích `/me`, không `/play`; điều hướng theo ngữ cảnh §7.2.
- [ ] `BR-LGN-04`: `logout` và `logout-all` có hành vi khác nhau, test riêng.
- [ ] `BR-LGN-05`: danh sách thiết bị không chứa IP đầy đủ.
- [ ] `BR-LGN-10`: mỗi dòng hiện `auth_method`.
- [ ] `BR-LGN-06`: đổi mật khẩu giết mọi phiên **khác**, giữ phiên hiện tại.
- [ ] `BR-LGN-07`: cổng quét TTL — không cơ chế nào vượt 7 ngày.
- [ ] Thu hồi một phiên: thiết bị đó mất quyền request kế tiếp; hai phiên còn lại không ảnh hưởng.
- [ ] `pending_verification` vào chế độ hạn chế; `suspended` → 403; `deleted` trong 30 ngày → 403 kèm đường huỷ xoá.
- [ ] `BR-LGN-03`: tái dùng refresh → 401 và thu hồi toàn bộ (test tầng luồng).

### Task 4 — Quên và đặt lại mật khẩu

- [ ] `forgot-password` trả **200 luôn**, thông báo cố định §7.
- [ ] Token hash, hạn 60 phút, dùng một lần.
- [ ] `BR-PWR-05`: yêu cầu mới vô hiệu token cũ; hạn 3 lần/giờ.
- [ ] `BR-PWR-03`: đặt lại → cả ba thiết bị mất phiên.
- [ ] `BR-PWR-04`: gửi email thông báo sau khi đổi.
- [ ] `BR-PWR-09`: **không** cookie phiên nào được đặt; chuyển tới trang đăng nhập.
- [ ] `BR-PWR-08`: dùng **chung** validator mật khẩu với Task 1.
- [ ] `BR-PWR-07`: cổng quét route — không route nào đổi mật khẩu thiếu token hoặc phiên hợp lệ.
- [ ] `BR-PWR-10`: tài khoản `password_hash NULL` đặt được mật khẩu qua luồng này.
- [ ] `BR-PWR-11`: sau khi đặt mật khẩu, `social_identities` **còn nguyên**.
- [ ] `suspended` → không gửi email đặt lại.

### Task 5 — Bộ test chống rò danh tính

- [ ] `BR-LGN-01`: email đã đăng ký sai mật khẩu **vs** email chưa đăng ký → cùng mã, cùng thông báo, chênh **< 50 ms**.
- [ ] `BR-LGN-09`: `password_hash NULL` **vs** email chưa đăng ký → cùng mã, cùng thông báo, chênh **< 50 ms**.
- [ ] `BR-PWR-01` + `BR-PWR-10`: ba ca `forgot-password` cho ba loại tài khoản → phản hồi giống hệt.
- [ ] `BR-REG-10`: body 409 không chứa tên provider.
- [ ] Đo thời gian trên nhiều lần chạy, so trung vị.

### Task 6 — Chế độ hạn chế ép ở server

- [ ] `pending_verification` gọi `POST /api/users/children` → **403**.
- [ ] Bảng §7.3 đúng cả hai cột.
- [ ] Ca âm: gọi thẳng bằng curl, bỏ qua UI, vẫn 403.
- [ ] Cổng: không route nào trong nhóm bị chặn thiếu kiểm trạng thái.

### Task 7 — Kiểm end-to-end người thật

- [ ] Môi trường local sạch, database rỗng, **không** INSERT tay hàng nào.
- [ ] Đăng ký → đọc email từ adapter local → bấm link → xác thực.
- [ ] Đăng nhập bằng mật khẩu.
- [ ] Quên mật khẩu → nhận email → đặt lại.
- [ ] Đăng nhập lại bằng mật khẩu mới **thành công**; mật khẩu cũ **thất bại**.
- [ ] Ghi từng bước và kết quả vào checklist, không tick bằng lời.

## Cổng dừng

- [ ] Luồng người thật chạy hết, không seed tay.
- [ ] Bộ test chống rò danh tính xanh, gồm đo thời gian.
- [ ] Chế độ hạn chế ép ở server, curl không đi vòng.
- [ ] Không cài lại vòng đời token; `packages/auth` là nơi duy nhất.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human security reviewer approve diff.

## Task 8 — Evidence và promote

- [ ] Mỗi `BR-REG-*` `BR-EVF-*` `BR-LGN-*` `BR-PWR-*` có test tham chiếu mã rule.
- [ ] `BR-REG-11` và phần SNS của `BR-LGN-10` ghi bước sở hữu **P1.15**, không tick.
- [ ] Nhánh `428 MFA_REQUIRED` có chỗ trong luồng; cài đặt ghi bước sở hữu **P2.11**.
- [ ] Bốn spec sang `implemented` chỉ khi đủ evidence.
- [ ] Tick **P0.10** và ô "Sau P0.10" của kiểm giữa phase ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.

## Cổng dừng cuối

- [ ] Không xây OAuth hay UI SNS.
- [ ] Không cài MFA.
- [ ] Không mật khẩu, token, hay secret trong log, test snapshot, hay source.
- [ ] Sẵn sàng lập plan P0.11.
