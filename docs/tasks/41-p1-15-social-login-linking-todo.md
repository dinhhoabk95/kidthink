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

- [x] **P1.14 revision singleton đã đóng** — marker API/gate, nhóm Bảo mật và route reauth có chỗ cắm.
- [x] `social_identities` và hai ràng buộc `UNIQUE` còn đúng như P0.7.
- [x] Human approve kế hoạch và sáu quyết định D-IK · D-IL · D-IM · D-IN · D-IO · D-IP.
- [x] Đối chiếu `BR-OAP-*` `BR-SCL-*` `BR-SLK-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Task #85 đã xanh; opaque Redis session/remember contract hoạt động và catalog có `openid-client` `^6.8`, `nuxt-auth-utils` tối thiểu `0.5.30`.
- [x] Client id/secret Google có trong biến môi trường staging; Facebook **để trống có chủ ý**.
- [x] Tạo nhánh riêng.

---

### Task 1 — Registry provider

- [x] Chỉ `packages/auth/src/oauth/` import `openid-client`; app/route không import trực tiếp.
- [x] `BR-OAP-16` discovery, PKCE, authorization URL, code exchange và validation đi qua `openid-client`.
- [x] Gate âm: PKCE/token parser tự viết, Sidebase/AuthJS hoặc `defineOAuth*EventHandler` của `nuxt-auth-utils` được dùng cho domain flow thì đỏ.
- [x] `packages/auth/src/oauth/` là chỗ **duy nhất** cấu hình provider.
- [x] `BR-OAP-01` mọi lời gọi mang `response_type=code` và `code_challenge_method=S256`.
- [x] `BR-OAP-01` ca âm: không route nào nhận `id_token` từ body client.
- [x] `BR-OAP-02` đổi code lấy token chỉ ở server; secret không có trong bundle client.
- [x] `BR-OAP-06` danh sách đóng: `google` · `facebook`; path bịa → **404**.
- [x] `BR-OAP-09` scope tối thiểu; không bạn bè · ảnh · ngày sinh · danh bạ.
- [x] §7.2 ánh xạ `NormalizedProfile` đúng cho cả hai provider.
- [x] `display_name_at_provider` cắt còn 60 ký tự.
- [x] `BR-OAP-08` Facebook luôn `email_verified_at_provider = false`.
- [x] `D-IL` ca âm: thiếu `client_secret` → app chạy, `is_enabled = false`, `start` trả 404.
- [x] `BR-OAP-12` rate limit `start` và `callback` theo **IP** và **`provider_user_id`**.
- [x] `GET providers` không trả `client_id`.

### Task 2 — Bốn cổng an ninh

- [x] `BR-OAP-03` ca âm: `state` lệch → **400** `OAUTH_STATE_INVALID`.
- [x] `BR-OAP-03` ca âm: state lệch → **không** request nào tới token endpoint.
- [x] `state` ≥32 byte; cookie `tm_oauth` TTL **10 phút**.
- [x] `BR-OAP-14` ca âm: replay callback đã xử lý → 400.
- [x] `BR-OAP-14` cookie bị xoá sau callback, thành công lẫn thất bại.
- [x] `BR-OAP-04` ca âm: `redirect_uri` từ query bị bỏ, dùng cấu hình server.
- [x] `BR-OAP-05` ca âm: `return_to` ngoài whitelist → về `/me`.
- [x] `BR-OAP-07` + `D-IP` quét mọi bảng: không cột nào chứa token của provider.
- [x] `BR-OAP-15` + `D-IP`: không cột ảnh; không request tải ảnh từ provider.
- [x] `D-IO` cổng quét: tra danh tính theo email → **đỏ**.
- [x] `BR-OAP-11` ca âm: payload gửi provider không chứa `child_uuid` hay tên trẻ.
- [x] Provider 5xx/timeout → **502** `OAUTH_PROVIDER_ERROR` + thông báo tiếng Việt.
- [x] `access_denied` → về trang trước, không phải trang lỗi đỏ.

### Task 3 — Nhánh A: đăng nhập lại

- [x] Tra `(provider, provider_user_id)` thấy → cấp token, ghi `active_sessions`, cập nhật `last_login_at`.
- [x] `BR-SCL-03` ca âm: đổi email ở provider, cùng `sub` → đúng tài khoản cũ.
- [x] `BR-SCL-03` ca âm: `users.email` không bị ghi đè.
- [x] `BR-SCL-14` đích đến `/me`, không phải `/play`.
- [x] User cũ thiếu Terms/Privacy sau marker → cấp session rồi `/consent-required` (`BR-LGN-11`).
- [x] `suspended` → **403** `ACCOUNT_SUSPENDED`.
- [x] `deleted` trong 30 ngày → 403 kèm nút huỷ yêu cầu xoá.
- [x] `D-IN` ca âm: seed `mfa_settings` → **428** `MFA_REQUIRED`.
- [x] `D-IN` ca âm: không cookie access nào được đặt trước khi qua MFA.
- [x] `BR-SCL-13` provider tắt → không hiện nút ở `/dang-nhap`.
- [x] `BR-SCL-09` lỗi không tiết lộ tài khoản có tồn tại.

### Task 4 — Nhánh B: đăng ký mới

- [x] Màn hình `/dang-ky/dong-y` đúng §7.2.
- [x] `BR-SCL-01` hai checkbox riêng, **chưa tick**; nút hoàn tất vô hiệu tới khi tick cả hai.
- [x] `BR-REG-08` ca âm: không tuổi · giới tính · số điện thoại · địa chỉ.
- [x] `BR-SCL-12` một transaction cho `users` + `social_identities` + `consent_logs`.
- [x] `BR-SCL-12` ca âm: đóng tab giữa chừng → **0 hàng** được tạo.
- [x] Form tải và echo `terms_requirement_at` · `privacy_requirement_at`.
- [x] `BR-SCL-02` mỗi hàng consent có action `accepted` · IP · user agent; không policy version.
- [x] Force giữa form → **409** `CONSENT_REQUIREMENT_CHANGED`, không tạo partial record.
- [x] `BR-SCL-05` ca âm: Google `email_verified` → `active`, không gửi email xác thực.
- [x] `BR-SCL-05` ca âm: Facebook → `pending_verification` + gửi email xác thực.
- [x] `BR-SCL-06` provider không trả email → bắt nhập, `pending_verification` (`D-DA`).
- [x] `pending_verification` giữ chế độ hạn chế: chưa tạo được hồ sơ trẻ.
- [x] `BR-SCL-08` `password_hash` NULL hợp lệ; không ép đặt mật khẩu.
- [x] `BR-SCL-10` ca âm: 5 phiên guest cũ giữ `child_profile_id` NULL.
- [x] Thiếu đồng ý → **422**, không tạo tài khoản.
- [x] `provider_user_id` đã gắn user khác → **409** + log mức cao.

### Task 5 — Nhánh C: email trùng

- [x] `BR-SCL-04` → **409** `SOCIAL_EMAIL_CONFLICT`.
- [x] Ca âm: **0 hàng** `social_identities`, **0 cookie** phiên.
- [x] Thông báo chỉ đường đúng câu §4 nhánh C.
- [x] `details.provider` và `details.masked_email` có mặt, không lộ thêm.
- [x] E2E đường thoát: 409 → đăng nhập mật khẩu → liên kết → đăng nhập SNS được.

### Task 6 — Liên kết và gỡ

- [x] Khối SNS chèn vào nhóm Bảo mật của P1.14 (`BR-ACS-11`).
- [x] Hai route thêm vào danh sách reauth `D-IJ`; cổng hai chiều vẫn xanh.
- [x] `BR-SLK-01` ca âm: chưa reauth → **428**, không redirect tới provider.
- [x] `BR-SLK-02` provider đã gắn → **409** `SOCIAL_PROVIDER_ALREADY_LINKED`.
- [x] `BR-SLK-06` ca âm: 409 không chứa email · tên · uuid của user kia.
- [x] `BR-SLK-03` ca âm: liên kết email khác → `users.email` không đổi.
- [x] `D-IM` ca âm **song song thật**: hai DELETE đồng thời → một 200, một **409**.
- [x] `D-IM` sau ca đua còn đúng **1 hàng** `social_identities`.
- [x] `BR-SLK-04` còn mật khẩu → gỡ hàng cuối được.
- [x] `BR-SLK-04` 409 kèm `details.set_password_url`.
- [x] `BR-SLK-05` `audit_logs` có `social_identity.linked` và `.unlinked`.
- [x] `BR-SLK-05` hai email thông báo được gửi.
- [x] `BR-SLK-07` ca âm: gỡ không thu hồi phiên, thiết bị B còn dùng được.
- [x] `BR-SLK-09` ca âm: response không có `provider_user_id`; email che `a***@gmail.com`.
- [x] `BR-SLK-10` gỡ là xoá cứng; liên kết lại → **201**.
- [x] `BR-SLK-08` ca âm: không route `/api/managers` nào ghi `social_identities`.
- [x] Provider tắt không hiện, trừ khi đang gắn — khi đó chỉ có nút gỡ.

## Cổng dừng

- [x] `D-IK` ca âm: bật provider khi thiếu route liên kết/gỡ → **đỏ**.
- [x] Đường thoát nhánh C chạy hết end-to-end.
- [x] Hai DELETE song song không làm mất cách đăng nhập cuối.
- [x] Không token · không ảnh · không `provider_user_id` rời server.
- [x] Không chỗ nào tra danh tính theo email.
- [x] Seed MFA → SNS trả 428, không cấp phiên.
- [x] Chạy lại ca âm `BR-ADL-10` của P1.14 với hàng `social_identities` thật.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 7 — Evidence và promote

- [x] Mỗi `BR-OAP-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-SCL-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-SLK-*` có test tham chiếu mã rule.
- [x] [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md) → `implemented`.
- [x] [`social-login.md`](../specs/03-account/social-login.md) → `implemented`.
- [x] [`social-account-linking.md`](../specs/03-account/social-account-linking.md) → `implemented`.
- [x] Facebook `is_enabled = false` cho tới khi app review xong — ghi vào todo vận hành.
- [x] Nợ sang **P2.9**: đảo `is_enabled` bằng cờ tính năng.
- [x] Tick **P1.15** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Gửi email cảnh báo khi có người thử SNS trùng email — **P2**, Backend.
- [ ] Gộp "đặt mật khẩu rồi gỡ" làm một bước — **P2**, Studio UI.
- [ ] Zalo làm provider thứ ba — **P2**, sửa §7.1 qua PR.
- [ ] Apple Sign-In — **P5**, gắn với PWA/native.
