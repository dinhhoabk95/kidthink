# Kế hoạch — Task #53: P2.11 — MFA tuỳ chọn cho User, và cổng ra P2

> Viết 2026-08-10. Bước sở hữu: **P2.11** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) — bước **cuối** của P2.
> Spec sở hữu: [`mfa.md`](../specs/03-account/mfa.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Một spec, và nó là spec **duy nhất của P2 mang `mvp: false`**. Điều đó đổi cách đọc cả bước:
MFA cho User là tuỳ chọn, không chặn go-live, và **không** nằm trong điều kiện cổng ra P2.

Lý do đã chốt từ 2026-08-05 và không mở lại: tài khoản User giữ dữ liệu học của trẻ, **không**
giữ tiền hay quyền quản trị; ép thêm một bước cho phụ huynh làm giảm tỉ lệ hoàn thành
onboarding. Hạ tầng reauth và bảng `mfa_settings` đã có từ P0, nên bật sau không phải làm lại.

Rủi ro thật của bước này không phải cài TOTP sai — thư viện làm việc đó. Rủi ro là **khoá chủ
tài khoản ra ngoài vĩnh viễn**: mất thiết bị và mất mã khôi phục, hoặc tài khoản chỉ có SNS mà
mất luôn tài khoản SNS. Spec đề xuất "reset thủ công bởi `super_admin`" — nhưng thao tác đó
**chưa tồn tại**: P2.2 đã chốt bề mặt quản lý User có **đúng ba** thao tác, và cổng quét `D-JB`
đang canh đúng điều đó. Bước này phải mở thêm một lỗ, và mở đúng một lỗ.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `AUTH-TOKENS-SESSIONS` | P0.3 | **reauth §7.4** — nền của mọi thao tác MFA |
| `ACCOUNT-SETTINGS` | P1.14 | `/me/settings` — nơi trang bảo mật sống |
| `SOCIAL-LOGIN` | P1.15 | yếu tố thứ nhất thứ hai; `password_hash` nullable (`BR-SIB-08`) |
| `ADMIN-AUTH` | P0.11b | MFA của Manager đã bắt buộc, luồng riêng |
| Bề mặt quản lý User | P2.2 | nơi thao tác reset MFA sẽ thêm vào |
| Cổng quét route | P2.2 | `D-JB` — phải mở đúng một lỗ |
| `NOTIFICATION-SERVICE` | P0.9b | email xác minh cho luồng khôi phục |

## 1. Đo được

### 1.1 Đã có

Reauth ≤5 phút của P0.3, chấp nhận **cả** mật khẩu lẫn OAuth với provider đã liên kết; bảng
`mfa_settings` và `mfa_recovery_codes` từ P0.7; MFA bắt buộc của Manager đã chạy từ P0.11b —
tức TOTP, khoá 5 lần / 15 phút, và mã khôi phục **đã có bản cài đặt tham chiếu**; `/me/settings`
của P1.14; đăng nhập SNS của P1.15.

### 1.2 Chưa có

Luồng bật/tắt cho User; thử thách MFA lúc đăng nhập dùng chung cho mật khẩu và SNS; sinh lại mã
khôi phục; trang `/me/settings/security`; và **đường khôi phục cuối cùng** khi mất hết.

### 1.3 Đã chốt, không mở lại

`BR-MFA-08` MFA cho User là **tuỳ chọn**, cho Manager là bắt buộc · `BR-MFA-05` **không** SMS
OTP · `BR-MFA-09` SNS **không** thay được MFA · `BR-MFA-03` reauth là dạng tổng quát đúng, thay
cho "mật khẩu" vì `password_hash` nullable · TOTP SHA-1, 6 số, bước 30 giây.

## 2. Quyết định

**D-KW — P2.11 **không** nằm trong cổng ra P2.** [`mfa.md`](../specs/03-account/mfa.md) mang
`mvp: false`; ba điều kiện cổng ra P2 ở
[`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) không nhắc tới MFA.
Xử: bước này chạy **sau** khi ba điều kiện đó đã đạt, hoặc song song nếu có người rảnh, nhưng
việc P2.11 chưa xong **không** chặn go-live. Đưa MFA vào MVP là mục `Ask first` của chính spec —
nếu chủ muốn thì đó là quyết định của chủ, không phải của bước này. Ghi rõ ở đây để không ai
"tiện tay" nâng nó thành điều kiện chặn.

**D-KX — Reauth là **cách duy nhất** xác thực lại; route MFA không nhận `password`.**
`BR-MFA-03` đã ghi rõ vì sao: `password_hash` nullable từ `BR-SIB-08` làm tài khoản chỉ-SNS
**không tắt được MFA của chính mình** nếu rule đòi mật khẩu. Cạm bẫy còn lại là ai đó thêm
`password` vào body "cho tiện" ở một route MFA. Xử: cổng quét — **không** route nào dưới
`/api/users/mfa/*` nhận trường `password`; mọi thao tác nhạy cảm gọi reauth §7.4. Ca âm ba vế:
tài khoản chỉ có SNS, đã bật MFA → reauth bằng Google → tắt được MFA (**200**).

**D-KY — Thử thách MFA chạy sau **mọi** yếu tố thứ nhất, qua **một** route dùng chung.**
`BR-MFA-09` nói "đã đăng nhập Google" chứng minh danh tính, **không** chứng minh thiết bị thứ
hai. Cách hỏng cụ thể: nhánh SNS phát cookie access rồi mới hỏi mã — lúc đó MFA đã thành hình
thức. Xử: `POST /api/guest/auth/users/mfa` là route duy nhất cho thử thách; cả nhánh mật khẩu
lẫn nhánh SNS trả **428** `MFA_REQUIRED` **trước khi** đặt bất kỳ cookie access nào. Ca âm cho
**cả hai** nhánh: kiểm response header — không `Set-Cookie` access trước khi nhập đúng mã.

**D-KZ — Đường khôi phục cuối cùng cần một thao tác admin **có thật**, và nó là **thao tác thứ
tư** của bề mặt quản lý User.** §11 Q1 và Q2 cùng kết thúc ở "hỗ trợ thủ công bởi
`super_admin`" — nhưng P2.2 chốt bề mặt đó có đúng ba thao tác (khoá · mở khoá · gửi link đặt
lại), và `D-JB` đang canh. Một quy trình khôi phục trỏ tới thao tác không tồn tại là một quy
trình không chạy được, và nó chỉ lộ ra khi có người thật bị khoá ngoài. Xử: thêm
`POST /api/managers/users/{uuid}/mfa-reset` với **bốn** ràng buộc — xác minh qua email chính
chủ, **chờ 48 giờ** kể từ lúc yêu cầu, `reason` bắt buộc ≥20 ký tự, ghi `audit_logs`; cập nhật
cổng `D-JB` để cho phép **đúng** route này, không nới rộng hơn. Reset **không** đặt lại mật
khẩu và **không** mở khoá tài khoản — nó chỉ tắt MFA.

## 3. Đồ thị

```
T1 setup + verify + 10 mã khôi phục (reauth §7.4)
      ├──→ T2 thử thách lúc đăng nhập, dùng chung mật khẩu + SNS (D-KY)
      ├──→ T3 disable + sinh lại mã khôi phục (D-KX)
      └──→ T5 trang /me/settings/security
  T4 thao tác reset MFA phía admin, chờ 48 giờ (D-KZ)
                              ── Cổng dừng ──
                                    T6 evidence, promote, kiểm cổng ra P2
```

## 4. Task

### Task 1 — Bật MFA

**Tiêu chí nghiệm thu**
- [ ] `POST /api/users/mfa/setup` cần `requireUserAuth()` + **reauth ≤5 phút**; body rỗng; trả `{ secret, otpauth_url }`.
- [ ] `BR-MFA-10` ca âm: đăng nhập 30 phút trước, chưa reauth → **428** `REAUTH_REQUIRED`.
- [ ] `POST /api/users/mfa/verify` nhận `{ code }`; đúng → đặt `confirmed_at` và sinh **10** mã khôi phục.
- [ ] `BR-MFA-01` ca âm: đọc hàng `mfa_settings` → `secret_encrypted` **đã mã hoá**, không plaintext.
- [ ] `BR-MFA-02`: mã khôi phục lưu **hash**, dùng **một lần**; ca âm — dùng lại một mã đã dùng → **401**.
- [ ] `BR-MFA-07` ca âm: mã khôi phục hiện **đúng một lần**; mở lại trang bảo mật → không xem lại được, chỉ có nút sinh bộ mới.
- [ ] `BR-MFA-04`: cửa sổ TOTP **±1 bước (±30s)**; ca dương với đồng hồ lệch 25 giây.
- [ ] `BR-MFA-06` ca âm: đăng nhập 2 thiết bị → bật MFA ở thiết bị A → thiết bị B **mất phiên**; cơ chế là `refresh_token_version` +1, dùng lại đường của P0.10.
- [ ] Sai mã 5 lần → **429** `MFA_LOCKED`, khoá **15 phút**; sai lẻ → **401** `MFA_INVALID_CODE`.
- [ ] Dùng lại cài đặt TOTP của [`admin-auth.md`](../specs/06-admin/admin-auth.md) (P0.11b); **không** viết bản thứ hai.

**Kiểm chứng**
- [ ] `pnpm test -- mfa-setup` xanh, assertion tham chiếu `BR-MFA-01` `BR-MFA-02` `BR-MFA-06` `BR-MFA-07` `BR-MFA-10`.

**Phụ thuộc:** P0.3 · P0.11b · **Cỡ:** M

### Task 2 — Thử thách lúc đăng nhập

**Tiêu chí nghiệm thu**
- [ ] `POST /api/guest/auth/users/mfa` là route **duy nhất** cho thử thách; dùng chung cho mật khẩu và SNS.
- [ ] `D-KY` ca âm nhánh mật khẩu: mật khẩu đúng → **428** `MFA_REQUIRED`, và **không** `Set-Cookie` access trong response.
- [ ] `D-KY` + `BR-MFA-09` ca âm nhánh SNS: đăng nhập Google thành công → **428** `MFA_REQUIRED`, và **không** cookie access nào được đặt trước khi nhập đúng mã.
- [ ] Nhập đúng mã → cấp token đầy đủ; nhập sai → **401**; sai 5 lần → **429** `MFA_LOCKED`.
- [ ] Mã khôi phục dùng được ở chính route này khi mất thiết bị.
- [ ] Cổng: không nhánh đăng nhập nào bỏ qua thử thách khi `mfa_settings.confirmed_at` không null.

**Kiểm chứng**
- [ ] `pnpm test -- mfa-challenge` xanh · `pnpm test:e2e -- login-with-mfa` xanh cho **cả hai** nhánh.

**Phụ thuộc:** T1 · P1.15 · **Cỡ:** M

### Task 3 — Tắt MFA và sinh lại mã khôi phục

**Tiêu chí nghiệm thu**
- [ ] `POST /api/users/mfa/disable` cần **reauth ≤5 phút** **và** `{ code }` — hai thứ, không phải một.
- [ ] `BR-MFA-03` ca âm 1: đã reauth nhưng thiếu `code` → **422**, MFA **vẫn bật**.
- [ ] `BR-MFA-03` ca âm 2: có `code` hợp lệ nhưng **chưa reauth** → **428** `REAUTH_REQUIRED`, MFA **vẫn bật**.
- [ ] `BR-MFA-03` ca dương 3: tài khoản `password_hash` NULL, đã liên kết Google → reauth bằng Google rồi disable kèm code → **200**, MFA tắt.
- [ ] `D-KX` cổng: không route nào dưới `/api/users/mfa/` nhận trường `password`; ca âm fixture → **đỏ**.
- [ ] `BR-MFA-11` ca âm: có 10 mã chưa dùng → reauth rồi sinh bộ mới → một mã của bộ **cũ** dùng không được nữa.
- [ ] `BR-MFA-05` cổng: quét route auth → **không** route nào gửi mã qua SMS.

**Kiểm chứng**
- [ ] `pnpm test -- mfa-disable` xanh, assertion tham chiếu `BR-MFA-03` `BR-MFA-05` `BR-MFA-11`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 4 — Reset MFA phía admin

**Tiêu chí nghiệm thu**
- [ ] `D-KZ`: `POST /api/managers/users/{uuid}/mfa-reset` cần `super_admin`.
- [ ] Bốn ràng buộc đủ: xác minh qua **email chính chủ** · chờ **48 giờ** kể từ lúc yêu cầu · `reason` ≥20 ký tự · ghi `audit_logs`.
- [ ] Ca âm thời gian: gọi reset trước khi đủ 48 giờ → **409**, nêu thời điểm sớm nhất có thể.
- [ ] Ca âm lý do: `reason` < 20 ký tự → **422** `ADMIN_NOTE_REQUIRED`.
- [ ] Reset **chỉ** tắt MFA: `password_hash` **không đổi**, trạng thái tài khoản **không đổi** — ca âm khẳng định cả hai.
- [ ] `D-KZ` cổng: cập nhật cổng `D-JB` của P2.2 để cho phép **đúng** route này; ca âm — thêm một route admin thứ hai đụng vào xác thực của User → cổng **đỏ**.
- [ ] Thao tác hiện trên [`user-detail.md`](../specs/06-admin/user-detail.md) như **thao tác thứ tư**, kèm mô tả quy trình 48 giờ.
- [ ] User nhận thông báo khi MFA của mình bị reset.

**Kiểm chứng**
- [ ] `pnpm test -- mfa-admin-reset` xanh · cổng quét route xanh với đúng một ngoại lệ.

**Phụ thuộc:** T1 · P2.2 · **Cỡ:** M

### Task 5 — Trang bảo mật của User

**Tiêu chí nghiệm thu**
- [ ] `/me/settings/security` sống trong [`account-settings.md`](../specs/03-account/account-settings.md) của P1.14.
- [ ] Trạng thái MFA hiện rõ: chưa bật · đã bật (kèm ngày) · số mã khôi phục còn lại.
- [ ] Luồng bật: reauth → QR + secret dạng chữ (cho app không quét được) → nhập mã → hiện 10 mã khôi phục **một lần** kèm nút tải về.
- [ ] Cảnh báo trước khi bật: "bật MFA sẽ đăng xuất các thiết bị khác" (`BR-MFA-06`).
- [ ] Nút tắt MFA và nút sinh lại mã khôi phục, cả hai đi qua reauth.
- [ ] Hết mã khôi phục → hiện đường liên hệ hỗ trợ và **nêu rõ quy trình 48 giờ** của `D-KZ`.
- [ ] `BR-MFA-08`: trang nói rõ MFA là **tuỳ chọn**; không nag, không popup ép bật.
- [ ] Bàn phím và trình đọc màn hình đi hết luồng — [`accessibility.md`](../specs/08-quality/accessibility.md).

**Kiểm chứng**
- [ ] `pnpm test:e2e -- me-security` xanh.

**Phụ thuộc:** T3 · P1.14 · **Cỡ:** M

### Cổng dừng

- [ ] Bật MFA → đăng xuất thiết bị khác → đăng nhập lại phải nhập mã.
- [ ] Đăng nhập **bằng Google** vẫn bị 428; không cookie access trước khi verify.
- [ ] Tài khoản chỉ có SNS tắt được MFA của chính mình qua reauth Google.
- [ ] Thiếu reauth hoặc thiếu mã → không tắt được MFA.
- [ ] Sinh bộ mã mới giết bộ cũ.
- [ ] Không route MFA nào nhận `password`; không route auth nào gửi SMS.
- [ ] Reset MFA phía admin chỉ chạy sau 48 giờ, có lý do, và không đụng mật khẩu.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 6 — Evidence, promote và cổng ra P2

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-MFA-*` có ít nhất một test tham chiếu mã rule.
- [ ] [`mfa.md`](../specs/03-account/mfa.md) sang `implemented`.
- [ ] §11 Q1 (mất cả thiết bị lẫn mã khôi phục) — đóng theo `D-KZ`: xác minh email chính chủ + chờ 48 giờ + reset thủ công. Quy trình này **chạy được** vì T4 đã tạo thao tác tương ứng.
- [ ] §11 Q2 (tài khoản chỉ có SNS mất luôn tài khoản SNS) — cùng đường với Q1; đóng một lần. Nêu cho chủ vì nó là ca hỗ trợ tốn người nhất.
- [ ] `D-KW` khẳng định lại: P2.11 **không** là điều kiện cổng ra P2.
- [ ] **Kiểm cổng ra P2** ([`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md)): một đơn hàng thật đi hết tạo → nộp chứng từ → duyệt → entitlement cấp → quyền mở.
- [ ] **Kiểm cổng ra P2**: Manager tạo được một game level mới trong studio, **0 dòng code**.
- [ ] **Kiểm cổng ra P2**: giá `standard`/`premium` **đã chốt** — không còn `PENDING_PRICE_VND` ở gói `sellable`, và `D-JG` không còn chặn trang giá.
- [ ] **Kiểm cổng ra P2**: điều kiện ở [`SPEC.md`](../SPEC.md) §13.
- [ ] Tổng hợp nợ P2 chuyển sang P3: bật thẻ dashboard lesson và tuần curriculum (`D-IX`) · bật tầng ưu tiên 1 của hàng đợi duyệt (`D-KK`) · bật loại xuất `curriculum_health` (`D-KP`) · ngưỡng cảnh báo cấp tay (P2.4 §11 Q2).
- [ ] Tick **P2.11** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Chủ tài khoản bị khoá ngoài vĩnh viễn | Mất toàn bộ dữ liệu học của con; không có đường vào | `D-KZ` — thao tác reset có thật, 48 giờ |
| Quy trình khôi phục trỏ tới thao tác không tồn tại | Chỉ lộ ra khi có người thật bị khoá | `D-KZ` — tạo thao tác trong cùng bước |
| Nhánh SNS phát cookie trước khi verify | MFA thành hình thức | `D-KY` — ca âm kiểm `Set-Cookie` |
| Route MFA nhận `password` "cho tiện" | Tài khoản chỉ-SNS không tắt được MFA của mình | `D-KX` — cổng quét |
| Kẻ chiếm phiên bật MFA | Khoá chủ tài khoản ra ngoài vĩnh viễn | `BR-MFA-10` — bật cũng cần reauth |
| Hai bộ mã khôi phục cùng sống | Hai cửa vào | `BR-MFA-11` — sinh mới giết cũ |
| Nâng P2.11 thành điều kiện chặn go-live | Trì hoãn ra mắt vì một tính năng `mvp: false` | `D-KW` — ghi rõ, không tự nâng |
| Viết bản TOTP thứ hai | Hai cách cài đặt, một cái sai | T1 — dùng lại cài đặt của P0.11b |
| Reset MFA thành cửa sau vào tài khoản | Admin mở được tài khoản bất kỳ | `D-KZ` — 48 giờ + email chính chủ + audit, và **không** đụng mật khẩu |

## 6. Giả định

1. **Cổng ra P2 đã hoặc sắp đạt** — bước này không chặn nó (`D-KW`).
2. **P0.3 reauth chạy được** với cả mật khẩu lẫn OAuth.
3. **P0.11b đã cài TOTP** cho Manager — bước này dùng lại, không viết mới.
4. **P1.15 đã đóng** — có nhánh SNS thật để kiểm `BR-MFA-09`.
5. **Một `super_admin`** — người duy nhất chạy được reset MFA, và cũng là điểm nghẽn của quy trình 48 giờ.

## 7. Ngoài phạm vi

- MFA bắt buộc cho User — **không**; đưa vào MVP là quyết định của chủ (`Ask first`).
- SMS OTP — **không bao giờ**.
- Passkey / WebAuthn — chưa có spec; không làm ở đây.
- MFA cho Manager — đã xong ở P0.11b.
- Đổi mật khẩu hộ User từ admin — **không bao giờ** (`BR-USM-08`).
- Mở khoá tài khoản qua reset MFA — hai việc khác nhau, giữ tách.
