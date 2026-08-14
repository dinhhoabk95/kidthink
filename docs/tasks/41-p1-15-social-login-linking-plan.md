# Kế hoạch — Task #41: P1.15 — Đăng nhập SNS: registry → đăng nhập → liên kết

> Viết 2026-08-10. Bước sở hữu: **P1.15** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md) →
> [`social-login.md`](../specs/03-account/social-login.md) →
> [`social-account-linking.md`](../specs/03-account/social-account-linking.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Ba spec, **một** thứ tự, và roadmap nói thẳng là **không đảo được**:
[`social-account-linking.md`](../specs/03-account/social-account-linking.md) là lối thoát duy
nhất cho nhánh 409 `SOCIAL_EMAIL_CONFLICT` của
[`social-login.md`](../specs/03-account/social-login.md) (`BR-SCL-04`). Ship đăng nhập SNS mà
chưa có màn hình liên kết là đẩy **mọi** người dùng trùng email vào ngõ cụt — và trùng email là
trường hợp thường, không phải hiếm.

Đây là bước có tỉ lệ **rủi ro trên số dòng code** cao nhất của P1. Ba cách mất tài khoản nằm
sát nhau:

1. **Tự liên kết vì trùng email** — ai tạo được tài khoản SNS mang email của nạn nhân thì vào
   được tài khoản KidThink của họ. `BR-SCL-04` cấm; `BR-OAP-08` giải thích vì sao Facebook
   không bao giờ đủ tin.
2. **Gắn SNS vào phiên bị chiếm** — cửa hậu vĩnh viễn, sống sót qua cả lần đổi mật khẩu.
   `BR-SLK-01` chống bằng reauth.
3. **Gỡ mất cách vào cuối cùng** — tài khoản còn dữ liệu trẻ mà không ai vào được nữa.
   `BR-SLK-04`, và spec tự nêu ca đua hai tab.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `SCHEMA-IDENTITY-BILLING` §7.3a | P0.7 | `social_identities` và hai `UNIQUE` đã có từ P0 |
| `AUTH-TOKENS-SESSIONS` §7.4 | P0.3 | reauth, `REAUTH_WINDOW_MINUTES = 5` (`D-CZ`) |
| `RATE-LIMITING` | P0.9b | `BR-RTL-01`, hai trục |
| `ERROR-CODES` | P0 registry | `OAUTH_STATE_INVALID` · `SOCIAL_EMAIL_CONFLICT` · `LAST_LOGIN_METHOD` |
| `REGISTRATION` | P0.10 | form 3 trường, hai đồng ý riêng, `BR-REG-02` |
| `CHILD-DATA-COMPLIANCE` | P0.4 | `BR-CDC-05` `BR-CDC-06` — không gửi gì của trẻ ra ngoài |
| `ACCOUNT-SETTINGS` | **P1.14** | nhóm Bảo mật là chỗ khối liên kết được chèn vào (`BR-ACS-11`) |
| Consent singleton + marker gate | **P1.14 revision 2026-08-14** | `D-QV`–`D-QY`; SNS echo marker và dùng `/consent-required` |
| Danh sách route reauth | **P1.14** | `D-IJ` chừa sẵn hai route của bước này |
| [`Task #85`](85-nuxt-auth-utils-migration-plan.md) | P0 auth architecture | Opaque session Redis đã xanh; OAuth bridge chỉ cấp cùng session/remember contract, không first-party JWT |

## 1. Đo được

### 1.1 Đã có

Bảng `social_identities` với `UNIQUE (provider, provider_user_id)` và `UNIQUE (user_id, provider)`;
`password_hash` nullable (`BR-SIB-08`); guard reauth và danh sách route nhạy cảm (P1.14);
`mfa_settings` tồn tại trong schema P0 dù MFA UI ở P2.11; phạm vi purge đã xếp
`social_identities` vào nhóm `delete` (`D-IF`).

### 1.2 Chưa có

Toàn bộ `packages/auth/src/oauth/`; ba route OAuth; màn hình đồng ý lần đầu; ba nhánh A/B/C;
khối "Đăng nhập bằng mạng xã hội" trong cài đặt; luồng gỡ và bất biến số cách đăng nhập.

### 1.3 Đã chốt, không mở lại

`D-DA` provider không trả email → vẫn tạo `users` với `status = pending_verification`, hạn chế
tạo hồ sơ trẻ tới khi xác minh · `D-CZ` cửa sổ reauth 5 phút ở một chỗ · `D-V` MFA là P2 ·
`D-IF` `social_identities` nằm nhóm `delete` của purge · `D-IJ` route nhạy cảm là dữ liệu.

## 2. Quyết định

**D-IK — ba spec ship như **một** đơn vị; provider chỉ được bật khi màn hình liên kết đã xanh.**
`BR-SCL-04` trả 409 và chỉ đường sang màn hình liên kết. Nếu màn hình đó chưa có, 409 là ngõ cụt
và người dùng không có đường nào tự thoát. Cổng: nếu bất kỳ provider nào `is_enabled = true`
mà route `POST` / `DELETE /api/users/social-identities` không tồn tại hoặc test của chúng không
xanh → **đỏ**. Đây là cách duy nhất biến "thứ tự không đảo được" của roadmap thành thứ đo được.

**D-IL — Google bật, Facebook **khai đủ nhưng tắt**, và "tắt" là đường mặc định đã có test.**
`BR-OAP-13` bắt thiếu secret thì provider tự tắt, không kéo sập app. Bước này giao **cả hai**
ánh xạ §7.2, nhưng Facebook chỉ bật khi app review của họ xong — việc ngoài tầm kiểm soát của
lịch code. Ca âm là đường mặc định: bỏ `client_secret` của facebook → app khởi động bình thường,
`GET providers` trả `is_enabled = false`, `start` trả **404**. Nhánh
`pending_verification` của Facebook (`BR-OAP-08` + `BR-SCL-05`) vẫn phải có test đầy đủ dù
provider đang tối — nó là nhánh mặc định của họ, không phải ca hiếm.

**D-IM — bất biến `login_methods ≥ 1` cưỡng chế bằng **khoá hàng `users` trong cùng transaction
với DELETE**.** Spec tự nêu ca hai tab gỡ đồng thời. Kiểm-rồi-xoá là cửa sổ đua kinh điển: hai
request cùng đọc "còn 2 cách", cùng xoá, còn 0. Xử: `SELECT … FOR UPDATE` trên hàng `users`
trong transaction, đếm lại sau khi khoá, rồi mới `DELETE`. Kiểm chứng **không** phải test tuần
tự mà là hai request **chạy song song thật**: đúng một 200, một 409 `LAST_LOGIN_METHOD`, còn
đúng một hàng.

**D-IN — nhánh MFA ship **sống và có test**, dù MFA UI ở P2.11.** `BR-SCL-07`: SNS là yếu tố
thứ nhất, không phải yếu tố thứ hai. Ở P1 chưa ai bật được MFA, nên cám dỗ là để lại một
`// TODO: MFA` đúng ở chỗ SNS có thể vượt qua yếu tố thứ hai — và đó là dòng sống sót tới
production. Xử: đọc `mfa_settings` thật, trả **428** `MFA_REQUIRED`, và test seed một hàng
`mfa_settings` để nhánh đó chạy ngay hôm nay. Route hoàn tất MFA vẫn thuộc
[`mfa.md`](../specs/03-account/mfa.md), P2.11 — bước này chỉ giữ cửa đóng.

**D-IO — mọi tra cứu danh tính đi qua **một** hàm theo `(provider, provider_user_id)`; tra theo
email là cổng đỏ.** `BR-SCL-03` + `BR-OAP-10`. Hình dạng code mở cửa chiếm tài khoản không phải
một quyết định sai, mà là **một truy vấn tiện tay** theo email trong lúc debug. Cổng quét: mọi
truy vấn chạm `social_identities` phải lọc theo `(provider, provider_user_id)`; xuất hiện phép
so `users.email = <email của provider>` để tìm danh tính → **đỏ**.

**D-IP — không giữ gì của provider ngoài §7.2, và cổng quét cả schema lẫn log.** `BR-OAP-07`
(không lưu token) và `BR-OAP-15` (không lưu, không hiển thị ảnh đại diện). Cổng: quét tên cột
của `social_identities` tìm `token` · `avatar` · `picture` · `secret`; và quét log có cấu trúc
đảm bảo access token của provider không bao giờ xuất hiện. Vế log nối thẳng vào `BR-MON-05`
của P1.16 — cùng một loại rò, hai bề mặt.

## 3. Đồ thị

```
T1 registry provider: PKCE S256 · state một lần · redirect_uri từ cấu hình · scope tối thiểu (D-IL)
      ├──→ T2 bốn cổng an ninh: state/replay · open redirect · token+avatar · tra theo email (D-IO, D-IP)
      └──→ T3 nhánh A đăng nhập lại + nhánh MFA sống (D-IN)
                └──→ T4 nhánh B đăng ký mới: màn hình đồng ý · một transaction · pending_verification
                          └──→ T5 nhánh C: 409 SOCIAL_EMAIL_CONFLICT có đường thoát
                                    └──→ T6 liên kết và gỡ + bất biến login_methods (D-IM)
                              ── Cổng dừng ──
  T7 evidence, bật Google, promote 3 spec (D-IK)
```

## 4. Task

### Task 1 — Registry provider

**Tiêu chí nghiệm thu**
- [ ] Catalog pin `openid-client` `^6.8`; chỉ `packages/auth/src/oauth/` import package này.
- [ ] `packages/auth/src/oauth/` giữ registry, dựng URL, đổi code, ánh xạ hồ sơ. Ba spec khác **không** tự cấu hình provider.
- [ ] `BR-OAP-16`: discovery, PKCE, authorization URL, code exchange và token validation đi qua
      `openid-client`; test/gate đỏ nếu có PKCE hoặc token-response parser tự viết.
- [ ] Cổng âm đỏ nếu runtime domain dùng `defineOAuth*EventHandler` của `nuxt-auth-utils`;
      module chỉ quản lý locator/projection theo [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md).
- [ ] `BR-OAP-01`: chỉ authorization code + PKCE **S256**; không route nào nhận `id_token` từ client.
- [ ] `BR-OAP-02`: đổi code lấy token **chỉ ở server**; `client_secret` không xuất hiện trong bundle client.
- [ ] `BR-OAP-06`: danh sách provider **đóng** đúng §7.1 — `google`, `facebook`; path bịa → **404** `OAUTH_PROVIDER_DISABLED`.
- [ ] `BR-OAP-09`: scope tối thiểu; ca âm — không scope bạn bè, ảnh, ngày sinh, danh bạ.
- [ ] `BR-OAP-10` + §7.2: ánh xạ `NormalizedProfile` đúng cho cả hai provider; `display_name_at_provider` cắt 60 ký tự.
- [ ] `BR-OAP-08`: Facebook luôn `email_verified_at_provider = false`.
- [ ] `D-IL` + `BR-OAP-13` ca âm: thiếu `client_secret` → app khởi động bình thường, `providers` trả `is_enabled = false`, `start` trả 404.
- [ ] `BR-OAP-12` + `BR-SCL-11`: rate limit `start` và `callback` theo **IP và `provider_user_id`**.
- [ ] `GET /api/guest/auth/oauth/providers` **không** trả `client_id`.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/auth test -- oauth-registry` xanh, assertion tham chiếu
      `BR-OAP-01` `BR-OAP-09` `BR-OAP-13` `BR-OAP-16`.

**Phụ thuộc:** P0.3 · P0.7 · **Cỡ:** M

### Task 2 — Bốn cổng an ninh

**Tiêu chí nghiệm thu**
- [ ] `BR-OAP-03` ca âm: `state` lệch → **400** `OAUTH_STATE_INVALID`, và **không** request nào tới token endpoint của provider.
- [ ] `BR-OAP-14` ca âm: gửi lại đúng callback đã xử lý → 400; cookie `tm_oauth` bị xoá sau callback dù thành công hay thất bại.
- [ ] `state` ≥32 byte, TTL **10 phút**.
- [ ] `BR-OAP-04` ca âm: `start?redirect_uri=https://evil.example` → URL gửi tới provider vẫn dùng `redirect_uri` từ cấu hình server.
- [ ] `BR-OAP-05` ca âm: `return_to` ngoài whitelist → về `/me`, không redirect ra ngoài tên miền.
- [ ] `D-IP` + `BR-OAP-07`: quét mọi bảng — không cột nào chứa access/refresh token của provider.
- [ ] `D-IP` + `BR-OAP-15`: không cột nào chứa URL ảnh; không request nào tải ảnh từ provider.
- [ ] `D-IO` + `BR-SCL-03`: cổng quét — tra danh tính theo email → **đỏ**.
- [ ] `BR-OAP-11` ca âm: không payload nào gửi tới provider chứa `child_uuid` hay tên trẻ.
- [ ] Provider 5xx/timeout → **502** `OAUTH_PROVIDER_ERROR`, thông báo tiếng Việt gợi ý dùng email/mật khẩu.
- [ ] `access_denied` → về trang trước kèm cờ huỷ, **không** phải trang lỗi đỏ.

**Kiểm chứng**
- [ ] `pnpm test -- oauth-security` xanh, assertion tham chiếu `BR-OAP-03` `BR-OAP-04` `BR-OAP-07`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Nhánh A: đăng nhập lại

**Tiêu chí nghiệm thu**
- [ ] Tra `(provider, provider_user_id)` thấy → cấp opaque session/remember theo preference đã bind, ghi metadata `active_sessions`, cập nhật `last_login_at`.
- [ ] `BR-SCL-03` ca âm: provider đổi email nhưng cùng `sub` → vào **đúng** tài khoản cũ, `users.email` **không** bị ghi đè.
- [ ] `BR-SCL-14`: đích đến là `/me`, không phải `/play`.
- [ ] `BR-LGN-11`: User cũ thiếu Terms/Privacy sau marker vẫn được cấp session nhưng đích là
      `/consent-required`; `return_to` chỉ dùng sau khi đồng ý.
- [ ] `status = suspended` → **403** `ACCOUNT_SUSPENDED`; `status = deleted` trong 30 ngày → 403 kèm nút huỷ yêu cầu xoá (nối P1.14).
- [ ] `D-IN` + `BR-SCL-07` ca âm: seed một hàng `mfa_settings` → **428** `MFA_REQUIRED`, và **không** cookie access nào được đặt trước đó.
- [ ] `BR-SCL-13`: provider `is_enabled = false` → không hiện nút ở `/dang-nhap`.
- [ ] `BR-SCL-09`: thông báo lỗi không tiết lộ tài khoản có tồn tại hay không.

**Kiểm chứng**
- [ ] `pnpm test -- social-login-existing` xanh, assertion tham chiếu `BR-SCL-03` `BR-SCL-07` `BR-SCL-14`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Nhánh B: đăng ký mới

**Tiêu chí nghiệm thu**
- [ ] Màn hình `/dang-ky/dong-y` đúng §7.2: tên điền sẵn sửa được, email chỉ đọc khi provider trả, **hai** checkbox riêng chưa tick.
- [ ] `BR-SCL-01` + `BR-REG-08` ca âm: không ô tuổi, giới tính, số điện thoại, địa chỉ.
- [ ] `BR-SCL-12` ca âm: đóng tab giữa màn hình đồng ý → **0 hàng** `users` và `social_identities` được tạo.
- [ ] Tải marker Terms/Privacy hiện hành; form gửi lại nguyên `requirement_at` cho cả hai loại.
- [ ] `users` + `social_identities` + **2 hàng** `consent_logs` action `accepted` trong một transaction.
- [ ] `BR-SCL-02`: mỗi hàng consent có action, IP, user agent; không `policy_version`.
- [ ] `BR-SCL-02` + `D-QY`: force giữa lúc form mở → **409**
      `CONSENT_REQUIREMENT_CHANGED`, không tạo `users`, `social_identities` hay log.
- [ ] `BR-SCL-05` ca âm: Google `email_verified = true` → `status = active`, **không** gửi email xác thực.
- [ ] `BR-SCL-05` ca âm: Facebook → `status = pending_verification` **và** gửi email xác thực.
- [ ] `BR-SCL-06` + `D-DA`: provider không trả email → bắt nhập email, `status = pending_verification`, giữ chế độ hạn chế của [`registration.md`](../specs/03-account/registration.md) §7.3.
- [ ] `BR-SCL-08`: `password_hash` NULL là hợp lệ; không màn hình nào ép đặt mật khẩu.
- [ ] `BR-SCL-10` ca âm: 5 phiên guest trước đó vẫn giữ `child_profile_id` NULL.
- [ ] Chưa tick đủ đồng ý → **422**, không tạo tài khoản, không cấp phiên.
- [ ] `provider_user_id` đã gắn user khác → **409** `SOCIAL_IDENTITY_ALREADY_LINKED`, log mức cao.

**Kiểm chứng**
- [ ] `pnpm test -- social-register` xanh, assertion tham chiếu `BR-SCL-01` `BR-SCL-05` `BR-SCL-12`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Nhánh C: email trùng

**Tiêu chí nghiệm thu**
- [ ] `BR-SCL-04` ca âm: email đã có tài khoản → **409** `SOCIAL_EMAIL_CONFLICT`; **0 hàng** `social_identities` mới; **0 cookie** phiên.
- [ ] Thông báo chỉ đường đúng câu của §4 nhánh C — dẫn tới đăng nhập rồi liên kết trong Cài đặt → Bảo mật.
- [ ] `details.provider` và `details.masked_email` có mặt; không lộ thêm gì về tài khoản kia.
- [ ] `BR-SCL-09`: nhánh này là ngoại lệ có lý do — caller đã chứng minh kiểm soát hộp thư đó; các nhánh khác vẫn không tiết lộ.
- [ ] E2E: đi hết đường thoát — 409 → đăng nhập bằng mật khẩu → liên kết provider đó → đăng nhập lại bằng SNS thành công.

**Kiểm chứng**
- [ ] `pnpm test:e2e -- social-email-conflict` xanh, assertion tham chiếu `BR-SCL-04`.

**Phụ thuộc:** T4 · T6 (E2E chạy sau T6) · **Cỡ:** S

### Task 6 — Liên kết và gỡ

**Tiêu chí nghiệm thu**
- [ ] Khối "Đăng nhập bằng mạng xã hội" chèn vào nhóm **Bảo mật** của P1.14 (`BR-ACS-11`); cài đặt **không** sở hữu contract này.
- [ ] Hai route thêm vào danh sách route nhạy cảm của `D-IJ`; cổng hai chiều vẫn xanh.
- [ ] `BR-SLK-01` ca âm: chưa reauth → **428** `REAUTH_REQUIRED`, **không** redirect nào tới provider.
- [ ] `BR-SLK-02`: provider đã gắn → **409** `SOCIAL_PROVIDER_ALREADY_LINKED`.
- [ ] `BR-SLK-06` ca âm: tài khoản SNS đã gắn user khác → 409, body **không** chứa email, tên, hay uuid của người kia.
- [ ] `BR-SLK-03` ca âm: liên kết provider mang email khác → `users.email` **không đổi**, đăng nhập bằng email cũ vẫn được.
- [ ] `D-IM` + `BR-SLK-04` ca âm **song song thật**: hai DELETE đồng thời trên tài khoản `password_hash` NULL có 2 hàng → đúng một 200, một **409** `LAST_LOGIN_METHOD`, còn đúng 1 hàng.
- [ ] `BR-SLK-04`: `password_hash` NOT NULL thì gỡ hàng cuối được; 409 kèm `details.set_password_url`.
- [ ] `BR-SLK-05`: cả hai thao tác ghi `audit_logs` (`social_identity.linked` / `.unlinked`) **và** gửi email thông báo.
- [ ] `BR-SLK-07` ca âm: gỡ **không** thu hồi phiên, `session_version` không đổi, thiết bị B vẫn dùng được.
- [ ] `BR-SLK-09` ca âm: `GET /api/users/social-identities` không trả `provider_user_id`; email che dạng `a***@gmail.com`.
- [ ] `BR-SLK-10`: gỡ là **xoá cứng**; gỡ rồi liên kết lại chính tài khoản đó → **201**.
- [ ] `BR-SLK-08` ca âm: quét mọi route dưới `/api/managers` — không route nào ghi `social_identities`.
- [ ] Provider `is_enabled = false` không hiện, trừ khi User đang gắn nó — khi đó chỉ hiện nút gỡ.

**Kiểm chứng**
- [ ] `pnpm test -- social-linking` xanh, assertion tham chiếu `BR-SLK-01` `BR-SLK-04` `BR-SLK-10`.

**Phụ thuộc:** T4 · P1.14 · **Cỡ:** M

### Cổng dừng

- [ ] `D-IK`: Google bật **chỉ khi** hai route liên kết/gỡ đã xanh; ca âm bật provider mà thiếu route → đỏ.
- [ ] Đường thoát nhánh C chạy hết end-to-end.
- [ ] Hai DELETE song song không làm mất cách đăng nhập cuối.
- [ ] Không token, không ảnh, không `provider_user_id` rời server.
- [ ] Không tra danh tính theo email ở bất kỳ đâu.
- [ ] MFA seed một hàng → SNS trả 428, không cấp phiên.
- [ ] Xoá tài khoản của P1.14 vẫn xoá cứng `social_identities` — chạy lại ca âm `BR-ADL-10` với hàng thật.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 7 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-OAP-*` `BR-SCL-*` `BR-SLK-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented`.
- [ ] Facebook giữ `is_enabled = false` tới khi app review xong — trạng thái ghi vào todo vận hành, không phải nợ code (`D-IL`).
- [ ] §11 Q1 của [`social-login.md`](../specs/03-account/social-login.md) (gửi email cảnh báo khi trùng email) chuyển **P2**, chủ là Backend.
- [ ] §11 Q1 của [`social-account-linking.md`](../specs/03-account/social-account-linking.md) (gộp đặt mật khẩu + gỡ làm một bước) chuyển **P2**.
- [ ] §11 Q1 của [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md) (Zalo) giữ **P2**; Q2 (Apple) giữ **P5**.
- [ ] Nợ ghi sang **P2.9**: cờ đảo `is_enabled` qua [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md); ở P1 `is_enabled` suy **chỉ** từ biến môi trường.
- [ ] Tick **P1.15** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Ship đăng nhập trước màn hình liên kết | Mọi người dùng trùng email vào ngõ cụt 409 | `D-IK` — cổng chặn bật provider |
| Tự liên kết vì trùng email | Chiếm tài khoản trực tiếp | `BR-SCL-04` — 409, ca âm 0 hàng 0 cookie |
| Tra danh tính theo email | Cùng lỗ hổng, dạng code tiện tay | `D-IO` — cổng quét |
| Kiểm-rồi-xoá khi gỡ | Mất cách vào cuối, tài khoản chết cùng dữ liệu trẻ | `D-IM` — khoá hàng, test song song thật |
| `// TODO: MFA` | SNS thành đường vòng qua yếu tố thứ hai ở P2.11 | `D-IN` — nhánh sống, test seed |
| Lưu token hoặc ảnh của provider | Rò dữ liệu không cần thiết, referrer sang provider | `D-IP` — cổng quét schema và log |
| Gắn SNS vào phiên bị chiếm | Cửa hậu sống sót qua đổi mật khẩu | `BR-SLK-01` — reauth, dùng guard P1.14 |
| Facebook chậm app review | Chặn cả bước nếu coi là điều kiện ship | `D-IL` — tắt là đường mặc định đã test |

## 6. Giả định

1. **P1.14 revision singleton đã đóng** — marker API/gate, nhóm Bảo mật và danh sách route
   reauth có sẵn chỗ cắm; không dùng policy version của baseline cũ.
2. **`social_identities` đã có từ P0.7** — bước này không đụng migration bảng danh tính.
3. **App Google đã cấu hình** — client id/secret có trong biến môi trường môi trường staging.
4. **Facebook có thể chưa xong app review** — ship với provider tắt là kết quả hợp lệ của bước này.
5. **MFA chưa bật được ở P1** — nhánh 428 kiểm bằng dữ liệu seed.
6. **Cờ tính năng ở P2.9** — `is_enabled` ở P1 chỉ suy từ biến môi trường.

## 7. Ngoài phạm vi

- Zalo — P2, sửa §7.1 qua PR.
- Apple Sign-In — P5, gắn với [`pwa-install.md`](../specs/01-platform/pwa-install.md).
- Route hoàn tất MFA và màn hình bật MFA — P2.11.
- Email cảnh báo khi có người thử SNS trùng email — P2.
- Đảo `is_enabled` bằng cờ tính năng — P2.9.
