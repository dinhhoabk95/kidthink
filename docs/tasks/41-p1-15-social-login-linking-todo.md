# Checklist — Task #41: P1.15 — Đăng nhập SNS: registry → đăng nhập → liên kết

> Kế hoạch: [`41-p1-15-social-login-linking-plan.md`](41-p1-15-social-login-linking-plan.md).
> Thứ tự **không đảo được**: registry → đăng nhập → liên kết.
> Tuyệt đối: không bật provider nào khi màn hình liên kết chưa xanh (`D-IK`); không bao giờ tra
> danh tính theo email (`D-IO`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.14 đã đóng** — nhóm Bảo mật và danh sách route reauth có chỗ cắm.
- [ ] `social_identities` và hai ràng buộc `UNIQUE` còn đúng như P0.7.
- [ ] Human approve kế hoạch và sáu quyết định D-IK · D-IL · D-IM · D-IN · D-IO · D-IP.
- [ ] Đối chiếu `BR-OAP-*` `BR-SCL-*` `BR-SLK-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Task #85 đã xanh; opaque Redis session/remember contract hoạt động và catalog có `openid-client` `^6.8`, `nuxt-auth-utils` tối thiểu `0.5.30`.
- [ ] Client id/secret Google có trong biến môi trường staging; Facebook **để trống có chủ ý**.
- [ ] Tạo nhánh riêng.

---

### Task 1 — Registry provider

- [ ] Chỉ `packages/auth/src/oauth/` import `openid-client`; app/route không import trực tiếp.
- [ ] `BR-OAP-16` discovery, PKCE, authorization URL, code exchange và validation đi qua `openid-client`.
- [ ] Gate âm: PKCE/token parser tự viết, Sidebase/AuthJS hoặc `defineOAuth*EventHandler` của `nuxt-auth-utils` được dùng cho domain flow thì đỏ.
- [ ] `packages/auth/src/oauth/` là chỗ **duy nhất** cấu hình provider.
- [ ] `BR-OAP-01` mọi lời gọi mang `response_type=code` và `code_challenge_method=S256`.
- [ ] `BR-OAP-01` ca âm: không route nào nhận `id_token` từ body client.
- [ ] `BR-OAP-02` đổi code lấy token chỉ ở server; secret không có trong bundle client.
- [ ] `BR-OAP-06` danh sách đóng: `google` · `facebook`; path bịa → **404**.
- [ ] `BR-OAP-09` scope tối thiểu; không bạn bè · ảnh · ngày sinh · danh bạ.
- [ ] §7.2 ánh xạ `NormalizedProfile` đúng cho cả hai provider.
- [ ] `display_name_at_provider` cắt còn 60 ký tự.
- [ ] `BR-OAP-08` Facebook luôn `email_verified_at_provider = false`.
- [ ] `D-IL` ca âm: thiếu `client_secret` → app chạy, `is_enabled = false`, `start` trả 404.
- [ ] `BR-OAP-12` rate limit `start` và `callback` theo **IP** và **`provider_user_id`**.
- [ ] `GET providers` không trả `client_id`.

### Task 2 — Bốn cổng an ninh

- [ ] `BR-OAP-03` ca âm: `state` lệch → **400** `OAUTH_STATE_INVALID`.
- [ ] `BR-OAP-03` ca âm: state lệch → **không** request nào tới token endpoint.
- [ ] `state` ≥32 byte; cookie `tm_oauth` TTL **10 phút**.
- [ ] `BR-OAP-14` ca âm: replay callback đã xử lý → 400.
- [ ] `BR-OAP-14` cookie bị xoá sau callback, thành công lẫn thất bại.
- [ ] `BR-OAP-04` ca âm: `redirect_uri` từ query bị bỏ, dùng cấu hình server.
- [ ] `BR-OAP-05` ca âm: `return_to` ngoài whitelist → về `/me`.
- [ ] `BR-OAP-07` + `D-IP` quét mọi bảng: không cột nào chứa token của provider.
- [ ] `BR-OAP-15` + `D-IP`: không cột ảnh; không request tải ảnh từ provider.
- [ ] `D-IO` cổng quét: tra danh tính theo email → **đỏ**.
- [ ] `BR-OAP-11` ca âm: payload gửi provider không chứa `child_uuid` hay tên trẻ.
- [ ] Provider 5xx/timeout → **502** `OAUTH_PROVIDER_ERROR` + thông báo tiếng Việt.
- [ ] `access_denied` → về trang trước, không phải trang lỗi đỏ.

### Task 3 — Nhánh A: đăng nhập lại

- [ ] Tra `(provider, provider_user_id)` thấy → cấp token, ghi `active_sessions`, cập nhật `last_login_at`.
- [ ] `BR-SCL-03` ca âm: đổi email ở provider, cùng `sub` → đúng tài khoản cũ.
- [ ] `BR-SCL-03` ca âm: `users.email` không bị ghi đè.
- [ ] `BR-SCL-14` đích đến `/me`, không phải `/play`.
- [ ] `suspended` → **403** `ACCOUNT_SUSPENDED`.
- [ ] `deleted` trong 30 ngày → 403 kèm nút huỷ yêu cầu xoá.
- [ ] `D-IN` ca âm: seed `mfa_settings` → **428** `MFA_REQUIRED`.
- [ ] `D-IN` ca âm: không cookie access nào được đặt trước khi qua MFA.
- [ ] `BR-SCL-13` provider tắt → không hiện nút ở `/dang-nhap`.
- [ ] `BR-SCL-09` lỗi không tiết lộ tài khoản có tồn tại.

### Task 4 — Nhánh B: đăng ký mới

- [ ] Màn hình `/dang-ky/dong-y` đúng §7.2.
- [ ] `BR-SCL-01` hai checkbox riêng, **chưa tick**; nút hoàn tất vô hiệu tới khi tick cả hai.
- [ ] `BR-REG-08` ca âm: không tuổi · giới tính · số điện thoại · địa chỉ.
- [ ] `BR-SCL-12` một transaction cho `users` + `social_identities` + `consent_logs`.
- [ ] `BR-SCL-12` ca âm: đóng tab giữa chừng → **0 hàng** được tạo.
- [ ] `BR-SCL-02` mỗi hàng consent có `policy_version` · IP · user agent.
- [ ] `BR-SCL-05` ca âm: Google `email_verified` → `active`, không gửi email xác thực.
- [ ] `BR-SCL-05` ca âm: Facebook → `pending_verification` + gửi email xác thực.
- [ ] `BR-SCL-06` provider không trả email → bắt nhập, `pending_verification` (`D-DA`).
- [ ] `pending_verification` giữ chế độ hạn chế: chưa tạo được hồ sơ trẻ.
- [ ] `BR-SCL-08` `password_hash` NULL hợp lệ; không ép đặt mật khẩu.
- [ ] `BR-SCL-10` ca âm: 5 phiên guest cũ giữ `child_profile_id` NULL.
- [ ] Thiếu đồng ý → **422**, không tạo tài khoản.
- [ ] `provider_user_id` đã gắn user khác → **409** + log mức cao.

### Task 5 — Nhánh C: email trùng

- [ ] `BR-SCL-04` → **409** `SOCIAL_EMAIL_CONFLICT`.
- [ ] Ca âm: **0 hàng** `social_identities`, **0 cookie** phiên.
- [ ] Thông báo chỉ đường đúng câu §4 nhánh C.
- [ ] `details.provider` và `details.masked_email` có mặt, không lộ thêm.
- [ ] E2E đường thoát: 409 → đăng nhập mật khẩu → liên kết → đăng nhập SNS được.

### Task 6 — Liên kết và gỡ

- [ ] Khối SNS chèn vào nhóm Bảo mật của P1.14 (`BR-ACS-11`).
- [ ] Hai route thêm vào danh sách reauth `D-IJ`; cổng hai chiều vẫn xanh.
- [ ] `BR-SLK-01` ca âm: chưa reauth → **428**, không redirect tới provider.
- [ ] `BR-SLK-02` provider đã gắn → **409** `SOCIAL_PROVIDER_ALREADY_LINKED`.
- [ ] `BR-SLK-06` ca âm: 409 không chứa email · tên · uuid của user kia.
- [ ] `BR-SLK-03` ca âm: liên kết email khác → `users.email` không đổi.
- [ ] `D-IM` ca âm **song song thật**: hai DELETE đồng thời → một 200, một **409**.
- [ ] `D-IM` sau ca đua còn đúng **1 hàng** `social_identities`.
- [ ] `BR-SLK-04` còn mật khẩu → gỡ hàng cuối được.
- [ ] `BR-SLK-04` 409 kèm `details.set_password_url`.
- [ ] `BR-SLK-05` `audit_logs` có `social_identity.linked` và `.unlinked`.
- [ ] `BR-SLK-05` hai email thông báo được gửi.
- [ ] `BR-SLK-07` ca âm: gỡ không thu hồi phiên, thiết bị B còn dùng được.
- [ ] `BR-SLK-09` ca âm: response không có `provider_user_id`; email che `a***@gmail.com`.
- [ ] `BR-SLK-10` gỡ là xoá cứng; liên kết lại → **201**.
- [ ] `BR-SLK-08` ca âm: không route `/api/managers` nào ghi `social_identities`.
- [ ] Provider tắt không hiện, trừ khi đang gắn — khi đó chỉ có nút gỡ.

## Cổng dừng

- [ ] `D-IK` ca âm: bật provider khi thiếu route liên kết/gỡ → **đỏ**.
- [ ] Đường thoát nhánh C chạy hết end-to-end.
- [ ] Hai DELETE song song không làm mất cách đăng nhập cuối.
- [ ] Không token · không ảnh · không `provider_user_id` rời server.
- [ ] Không chỗ nào tra danh tính theo email.
- [ ] Seed MFA → SNS trả 428, không cấp phiên.
- [ ] Chạy lại ca âm `BR-ADL-10` của P1.14 với hàng `social_identities` thật.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 7 — Evidence và promote

- [ ] Mỗi `BR-OAP-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-SCL-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-SLK-*` có test tham chiếu mã rule.
- [ ] [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md) → `implemented`.
- [ ] [`social-login.md`](../specs/03-account/social-login.md) → `implemented`.
- [ ] [`social-account-linking.md`](../specs/03-account/social-account-linking.md) → `implemented`.
- [ ] Facebook `is_enabled = false` cho tới khi app review xong — ghi vào todo vận hành.
- [ ] Nợ sang **P2.9**: đảo `is_enabled` bằng cờ tính năng.
- [ ] Tick **P1.15** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Gửi email cảnh báo khi có người thử SNS trùng email — **P2**, Backend.
- [ ] Gộp "đặt mật khẩu rồi gỡ" làm một bước — **P2**, Studio UI.
- [ ] Zalo làm provider thứ ba — **P2**, sửa §7.1 qua PR.
- [ ] Apple Sign-In — **P5**, gắn với PWA/native.
