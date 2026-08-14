# Checklist — Task #23: P0.10 — Auth end-to-end

> Kế hoạch: [`23-p0-10-auth-end-to-end-plan.md`](23-p0-10-auth-end-to-end-plan.md).
> Vùng nhạy cảm **auth** theo [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md):
> test âm trước, human security reviewer duyệt diff, không auto-merge.
>
> **Superseded một phần 2026-08-14:** checkbox `policy_version` là evidence lịch sử. Task #40
> revision sở hữu registration marker và migration consent mới.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] Human approve kế hoạch và năm quyết định D-EO · D-EP · D-EQ · D-ER · D-ES.
- [x] **P0.3 đã đóng** — `packages/auth` giao đủ session, refresh, CSRF, reauth.
- [x] **P0.4 đã đóng** — cổng đồng ý và chặn tạo trẻ.
- [x] **P0.9b đã đóng** — email và rate limit.
- [x] Đối chiếu `BR-REG-*` `BR-EVF-*` `BR-LGN-*` `BR-PWR-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Đăng ký

- [x] `POST /api/guest/auth/users/register` nhận đúng 5 field §7.1; field lạ bị từ chối.
- [x] `BR-REG-01`: trang `/dang-ky` chỉ ba input.
- [x] Ca âm `BR-REG-08`: cổng quét thấy ô tuổi/giới tính/số điện thoại là **ĐỎ**.
- [x] `BR-REG-02`: hai checkbox riêng, không tick sẵn, nút vô hiệu tới khi tick cả hai.
- [x] `BR-REG-03`: ghi **2 hàng** `consent_logs` kèm `policy_version` `ip_address` `user_agent`.
- [x] `BR-REG-05`: `"chuoixanh123"` thành công; `"12345678"` trả 422.
- [x] `BR-REG-07`: `A@Example.com` trùng `a@example.com` → 409.
- [x] `BR-REG-06`: phiên guest cũ giữ `child_profile_id NULL`; không đường code nào gán chúng.
- [x] `BR-REG-09`: rate limit `auth:register` theo IP.
- [x] Chỗ cho nút SNS có trong thứ tự DOM, sau một cờ đang **tắt**.

### Task 2 — Xác thực email

- [x] Token 32 byte base64url; **chỉ hash** vào DB.
- [x] Ca âm `BR-EVF-01`: giá trị trong DB khác giá trị trong email.
- [x] Hạn 24 giờ, dùng một lần.
- [x] `BR-EVF-03`: gửi lại vô hiệu token cũ.
- [x] `BR-EVF-04`: bấm lại link khi đã `active` → chuyển `/me`, không báo lỗi.
- [x] `BR-EVF-05`: token không tồn tại → thông báo chung, response không chứa email nào.
- [x] `BR-EVF-07`: resend lần thứ 4 trong một giờ → 429.
- [x] `POST /resend-verification` trả **200 luôn**, kể cả khi đã `active`.
- [x] `BR-EVF-08`: xác thực xong đích là `/me/children/new`.

### Task 3 — Đăng nhập và quản lý phiên

- [x] Cấp access 15 phút + refresh 7 ngày **qua `packages/auth`**, không cài lại.
- [x] Ghi `active_sessions` kèm `auth_method = 'password'`.
- [x] `BR-LGN-08`: đích `/me`, không `/play`; điều hướng theo ngữ cảnh §7.2.
- [x] `BR-LGN-04`: `logout` và `logout-all` có hành vi khác nhau, test riêng.
- [x] `BR-LGN-05`: danh sách thiết bị không chứa IP đầy đủ.
- [x] `BR-LGN-10`: mỗi dòng hiện `auth_method`.
- [x] `BR-LGN-06`: đổi mật khẩu giết mọi phiên **khác**, giữ phiên hiện tại.
- [x] `BR-LGN-07`: cổng quét TTL — không cơ chế nào vượt 7 ngày.
- [x] Thu hồi một phiên: thiết bị đó mất quyền request kế tiếp; hai phiên còn lại không ảnh hưởng.
- [x] `pending_verification` vào chế độ hạn chế; `suspended` → 403; `deleted` trong 30 ngày → 403 kèm đường huỷ xoá.
- [x] `BR-LGN-03`: tái dùng refresh → 401 và thu hồi toàn bộ (test tầng luồng).

### Task 4 — Quên và đặt lại mật khẩu

- [x] `forgot-password` trả **200 luôn**, thông báo cố định §7.
- [x] Token hash, hạn 60 phút, dùng một lần.
- [x] `BR-PWR-05`: yêu cầu mới vô hiệu token cũ; hạn 3 lần/giờ.
- [x] `BR-PWR-03`: đặt lại → cả ba thiết bị mất phiên.
- [x] `BR-PWR-04`: gửi email thông báo sau khi đổi.
- [x] `BR-PWR-09`: **không** cookie phiên nào được đặt; chuyển tới trang đăng nhập.
- [x] `BR-PWR-08`: dùng **chung** validator mật khẩu với Task 1.
- [x] `BR-PWR-07`: cổng quét route — không route nào đổi mật khẩu thiếu token hoặc phiên hợp lệ.
- [x] `BR-PWR-10`: tài khoản `password_hash NULL` đặt được mật khẩu qua luồng này.
- [x] `BR-PWR-11`: sau khi đặt mật khẩu, `social_identities` **còn nguyên**.
- [x] `suspended` → không gửi email đặt lại.

### Task 5 — Bộ test chống rò danh tính

- [x] `BR-LGN-01`: email đã đăng ký sai mật khẩu **vs** email chưa đăng ký → cùng mã, cùng thông báo, chênh **< 50 ms**.
- [x] `BR-LGN-09`: `password_hash NULL` **vs** email chưa đăng ký → cùng mã, cùng thông báo, chênh **< 50 ms**.
- [x] `BR-PWR-01` + `BR-PWR-10`: ba ca `forgot-password` cho ba loại tài khoản → phản hồi giống hệt.
- [x] `BR-REG-10`: body 409 không chứa tên provider.
- [x] Đo thời gian trên nhiều lần chạy, so trung vị.

### Task 6 — Chế độ hạn chế ép ở server

- [x] `pending_verification` gọi `POST /api/users/children` → **403**.
- [x] Bảng §7.3 đúng cả hai cột.
- [x] Ca âm: gọi thẳng bằng curl, bỏ qua UI, vẫn 403.
- [x] Cổng: không route nào trong nhóm bị chặn thiếu kiểm trạng thái.

### Task 7 — Kiểm end-to-end người thật

- [x] Môi trường local sạch, database rỗng, **không** INSERT tay hàng nào.
- [x] Đăng ký → đọc email từ adapter local → bấm link → xác thực.
- [x] Đăng nhập bằng mật khẩu.
- [x] Quên mật khẩu → nhận email → đặt lại.
- [x] Đăng nhập lại bằng mật khẩu mới **thành công**; mật khẩu cũ **thất bại**.
- [x] Ghi từng bước và kết quả vào checklist, không tick bằng lời.

## Cổng dừng

- [x] Luồng người thật chạy hết, không seed tay.
- [x] Bộ test chống rò danh tính xanh, gồm đo thời gian.
- [x] Chế độ hạn chế ép ở server, curl không đi vòng.
- [x] Không cài lại vòng đời token; `packages/auth` là nơi duy nhất.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [x] Human security reviewer approve diff.

## Task 8 — Evidence và promote

- [x] Mỗi `BR-REG-*` `BR-EVF-*` `BR-LGN-*` `BR-PWR-*` có test tham chiếu mã rule.
- [x] `BR-REG-11` và phần SNS của `BR-LGN-10` ghi bước sở hữu **P1.15**, không tick.
- [x] Nhánh `428 MFA_REQUIRED` có chỗ trong luồng; cài đặt ghi bước sở hữu **P2.11**.
- [x] Bốn spec sang `implemented` chỉ khi đủ evidence.
- [x] Tick **P0.10** và ô "Sau P0.10" của kiểm giữa phase ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.

## Cổng dừng cuối

- [x] Không xây OAuth hay UI SNS.
- [x] Không cài MFA.
- [x] Không mật khẩu, token, hay secret trong log, test snapshot, hay source.
- [x] Sẵn sàng lập plan P0.11.
