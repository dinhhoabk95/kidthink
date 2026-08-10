# Checklist — Task #53: P2.11 — MFA tuỳ chọn cho User, và cổng ra P2

> Kế hoạch: [`53-p2-11-mfa-plan.md`](53-p2-11-mfa-plan.md).
> Spec **duy nhất** của P2 mang `mvp: false` — bước này **không** chặn go-live (`D-KW`).
> Tuyệt đối: SNS **không** thay được MFA (`D-KY`) · phải có đường khôi phục **chạy được** (`D-KZ`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P0.3 reauth** chạy được với cả mật khẩu lẫn OAuth.
- [ ] **P0.11b** đã cài TOTP cho Manager — dùng lại, không viết mới.
- [ ] **P1.15 đã đóng** — có nhánh SNS thật để kiểm `BR-MFA-09`.
- [ ] **P2.2 đã đóng** — bề mặt quản lý User và cổng quét `D-JB` tồn tại để mở đúng một lỗ.
- [ ] Human approve kế hoạch và bốn quyết định D-KW · D-KX · D-KY · D-KZ.
- [ ] Đối chiếu `BR-MFA-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Bật MFA

- [ ] `POST /api/users/mfa/setup` cần auth + **reauth ≤5 phút**; trả `{ secret, otpauth_url }`.
- [ ] `BR-MFA-10` ca âm: chưa reauth → **428** `REAUTH_REQUIRED`.
- [ ] `POST /api/users/mfa/verify` đúng mã → `confirmed_at` + sinh **10** mã khôi phục.
- [ ] `BR-MFA-01` ca âm: `mfa_settings.secret_encrypted` **đã mã hoá**, không plaintext.
- [ ] `BR-MFA-02`: mã khôi phục lưu **hash**, dùng **một lần**.
- [ ] `BR-MFA-02` ca âm: dùng lại mã đã dùng → **401**.
- [ ] `BR-MFA-07` ca âm: mở lại trang bảo mật → **không** xem lại được mã cũ.
- [ ] `BR-MFA-04` ca dương: đồng hồ lệch 25 giây vẫn xác nhận được (±1 bước).
- [ ] `BR-MFA-06` ca âm: bật MFA ở thiết bị A → thiết bị B **mất phiên**.
- [ ] Cơ chế thu hồi là `refresh_token_version` +1, dùng lại đường P0.10.
- [ ] Sai mã 5 lần → **429** `MFA_LOCKED`, khoá **15 phút**.
- [ ] Sai lẻ → **401** `MFA_INVALID_CODE`.
- [ ] Dùng lại cài đặt TOTP của P0.11b; **không** bản thứ hai.

### Task 2 — Thử thách lúc đăng nhập

- [ ] `POST /api/guest/auth/users/mfa` là route **duy nhất** cho thử thách.
- [ ] `D-KY` ca âm nhánh mật khẩu: mật khẩu đúng → **428**, **không** `Set-Cookie` access.
- [ ] `D-KY` ca âm nhánh SNS: Google thành công → **428**, **không** cookie access.
- [ ] Nhập đúng mã → cấp token đầy đủ.
- [ ] Nhập sai → **401**; sai 5 lần → **429** `MFA_LOCKED`.
- [ ] Mã khôi phục dùng được ở chính route này.
- [ ] Cổng: không nhánh đăng nhập nào bỏ qua thử thách khi `confirmed_at` không null.

### Task 3 — Tắt MFA và sinh lại mã khôi phục

- [ ] `POST .../mfa/disable` cần **reauth ≤5 phút** **và** `{ code }`.
- [ ] `BR-MFA-03` ca âm 1: đã reauth, thiếu `code` → **422**, MFA **vẫn bật**.
- [ ] `BR-MFA-03` ca âm 2: có `code`, chưa reauth → **428**, MFA **vẫn bật**.
- [ ] `BR-MFA-03` ca dương 3: `password_hash` NULL + reauth Google + code → **200**, MFA tắt.
- [ ] `D-KX` cổng: không route `/api/users/mfa/` nào nhận trường `password`.
- [ ] `D-KX` ca âm: fixture route nhận `password` → cổng **đỏ**.
- [ ] `BR-MFA-11` ca âm: sinh bộ mới → mã của bộ **cũ** dùng không được nữa.
- [ ] `BR-MFA-05` cổng: không route auth nào gửi mã qua SMS.

### Task 4 — Reset MFA phía admin

- [ ] `POST /api/managers/users/{uuid}/mfa-reset` cần `super_admin`.
- [ ] Ràng buộc 1: xác minh qua **email chính chủ**.
- [ ] Ràng buộc 2: chờ **48 giờ** kể từ lúc yêu cầu.
- [ ] Ràng buộc 3: `reason` ≥20 ký tự.
- [ ] Ràng buộc 4: ghi `audit_logs`.
- [ ] Ca âm thời gian: gọi trước 48 giờ → **409** kèm thời điểm sớm nhất.
- [ ] Ca âm lý do: `reason` < 20 ký tự → **422** `ADMIN_NOTE_REQUIRED`.
- [ ] Ca âm phạm vi: reset **không** đổi `password_hash`.
- [ ] Ca âm phạm vi: reset **không** đổi trạng thái tài khoản.
- [ ] `D-KZ` cổng: cập nhật cổng `D-JB` cho phép **đúng** route này.
- [ ] Ca âm: thêm route admin thứ hai đụng xác thực User → cổng **đỏ**.
- [ ] Thao tác hiện trên chi tiết User như **thao tác thứ tư**, kèm mô tả quy trình 48 giờ.
- [ ] User nhận thông báo khi MFA bị reset.

### Task 5 — Trang bảo mật của User

- [ ] `/me/settings/security` sống trong [`account-settings.md`](../specs/03-account/account-settings.md).
- [ ] Trạng thái hiện rõ: chưa bật · đã bật (kèm ngày) · số mã khôi phục còn lại.
- [ ] Luồng bật: reauth → QR **và** secret dạng chữ → nhập mã → 10 mã khôi phục một lần + nút tải về.
- [ ] Cảnh báo trước khi bật: "sẽ đăng xuất các thiết bị khác".
- [ ] Nút tắt MFA và nút sinh lại mã khôi phục, cả hai qua reauth.
- [ ] Hết mã khôi phục → đường liên hệ hỗ trợ + **nêu rõ quy trình 48 giờ**.
- [ ] `BR-MFA-08`: nói rõ MFA là **tuỳ chọn**; **không** nag, không popup ép bật.
- [ ] Bàn phím và trình đọc màn hình đi hết luồng.

## Cổng dừng

- [ ] Bật MFA → đăng xuất thiết bị khác → đăng nhập lại phải nhập mã.
- [ ] Đăng nhập **bằng Google** vẫn bị 428; không cookie access trước khi verify.
- [ ] Tài khoản chỉ có SNS tắt được MFA của chính mình qua reauth Google.
- [ ] Thiếu reauth hoặc thiếu mã → không tắt được MFA.
- [ ] Sinh bộ mã mới giết bộ cũ.
- [ ] Không route MFA nào nhận `password`; không route auth nào gửi SMS.
- [ ] Reset MFA phía admin chỉ chạy sau 48 giờ, có lý do, không đụng mật khẩu.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence, promote và cổng ra P2

- [ ] Mỗi `BR-MFA-*` có test tham chiếu mã rule.
- [ ] [`mfa.md`](../specs/03-account/mfa.md) → `implemented`.
- [ ] `D-KW` khẳng định lại: P2.11 **không** là điều kiện cổng ra P2.

### Kiểm cổng ra P2

- [ ] Một đơn hàng thật đi hết: tạo → nộp chứng từ → duyệt → entitlement cấp → quyền mở.
- [ ] Manager tạo được một game level mới trong studio, **0 dòng code**.
- [ ] Giá `standard`/`premium` **đã chốt**; không còn `PENDING_PRICE_VND` ở gói `sellable`.
- [ ] `D-JG` không còn chặn phát hành trang giá.
- [ ] Điều kiện ở [`SPEC.md`](../SPEC.md) §13 đạt đủ.
- [ ] Tick **P2.11** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

### Nợ P2 chuyển sang P3

- [ ] Bật thẻ dashboard **lesson published** và **tuần curriculum thiếu hoạt động** (`D-IX`).
- [ ] Bật **tầng ưu tiên 1** của hàng đợi duyệt (`D-KK`).
- [ ] Bật loại xuất **`curriculum_health`** (`D-KP`).
- [ ] Cân nhắc ngưỡng cảnh báo **cấp quyền tay quá N lần/tháng** (P2.4 §11 Q2).

## Câu hỏi mở chuyển tiếp

- [ ] **Mất cả thiết bị lẫn mã khôi phục** — đóng theo `D-KZ`: email chính chủ + chờ 48 giờ + reset thủ công. Quy trình **chạy được** vì T4 đã tạo thao tác tương ứng.
- [ ] **Tài khoản chỉ có SNS mất luôn tài khoản SNS** — cùng đường với câu trên, đóng một lần. Nêu cho chủ: đây là ca hỗ trợ tốn người nhất.
- [ ] **Có đưa MFA vào MVP cho User không** — `Ask first` của spec; chủ quyết. Mặc định giữ `mvp: false`.
