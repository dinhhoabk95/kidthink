# Kế hoạch — Task #40: P1.14 — Cài đặt tài khoản, đồng ý pháp lý & xoá tài khoản

> Viết 2026-08-10. Bước sở hữu: **P1.14** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`account-settings.md`](../specs/03-account/account-settings.md) ·
> [`consent-management.md`](../specs/03-account/consent-management.md) ·
> [`account-deletion.md`](../specs/03-account/account-deletion.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Ba spec, một chủ đề: **quyền của người lớn trên dữ liệu của chính họ và của con họ**. Không
phải ba màn hình tiện ích — hai trong ba là nghĩa vụ theo Nghị định 13/2023, và cả ba đều là
thao tác không hoàn tác được nếu làm sai.

Ba loại rủi ro khác nhau, cần ba cơ chế khác nhau:

1. **Chiếm phiên.** Đổi mật khẩu, đổi email, xoá tài khoản, và (từ P1.15) gắn SNS — bốn cửa
   dẫn tới mất tài khoản vĩnh viễn. Chống bằng reauth, và reauth phải là **một** guard, không
   phải bốn lần nhớ.
2. **Đồng ý giả.** Tick sẵn, suy từ hành vi, hoặc khoá dữ liệu để ép đồng ý bản mới — cả ba đều
   làm bằng chứng đồng ý mất giá trị pháp lý.
3. **Xoá sót.** `BR-ADL-10` là ví dụ đắt nhất trong corpus: quên xoá `social_identities` thì
   `UNIQUE (provider, provider_user_id)` khoá vĩnh viễn tài khoản Google đó khỏi KidThink, và
   người dùng **không có cách nào tự sửa**.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `AUTH-TOKENS-SESSIONS` §7.4 | P0.3 | `packages/auth/src/reauth.ts`, `active_sessions.reauth_at`, `REAUTH_WINDOW_MINUTES = 5` (`D-CZ`) |
| `LOGIN-AND-SESSION` · `PASSWORD-RECOVERY` | P0.10 | phiên, `refresh_token_version`, token xác thực |
| `NOTIFICATION-SERVICE` | P0.9b | `email:send` cho thông báo đổi email/mật khẩu |
| `CHILD-DATA-COMPLIANCE` | P0.4 | `consent_logs` INSERT-only, `BR-CDC-07` `BR-CDC-10` |
| `LEGAL-PAGES` | P1.13 | version chính sách, URL vĩnh viễn, `legal_review_status` (`D-HZ`) |
| `JOB-QUEUE` | P1.5 | registry khai `account:purge` với `owner_step` là **bước này** |
| `CHILD-PROFILE-ARCHIVE` | P1.9 | ba trạng thái hồ sơ; purge trẻ chạy **trong** `account:purge` (`D-GY`) |

## 1. Đo được

### 1.1 Đã có

Guard reauth và cửa sổ 5 phút (P0.3); `consent_logs` và ràng buộc INSERT-only (P0.4);
`email:send` (P0.9b); version chính sách và cơ chế đồng ý trỏ version cụ thể (P1.13);
`account:purge` đã có consumer với **phạm vi hồ sơ trẻ** (P1.9); bảng retry khai
purge **1 lần, fail → alert ngay** (P1.5).

### 1.2 Chưa có

`/me/settings` và bốn nhóm; hai route mật khẩu tách biệt; luồng đổi email hai bước; tuỳ chọn
thông báo; toàn bộ màn hình đồng ý và diff; luồng rút đồng ý; trang xoá tài khoản, huỷ yêu cầu,
và phạm vi tài khoản của `account:purge`.

### 1.3 Đã chốt, không mở lại

`D-CY` diff chính sách là **`summary_vi` soạn tay** cho phụ huynh, toàn văn ở chế độ chi tiết ·
`D-CZ` `REAUTH_WINDOW_MINUTES = 5` đặt ở [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) §7.4 ·
`D-GY` purge trẻ chạy trong `account:purge`, **không** thêm job thứ 11 ·
`D-HZ` bản chính sách `pending_review` chặn deploy production ·
`D-V` MFA là tuỳ chọn, **P2**, ngoài MVP.

## 2. Quyết định

**D-IE — thứ tự trong bước: cài đặt → đồng ý → xoá.** Nhóm **Quyền riêng tư** của
[`account-settings.md`](../specs/03-account/account-settings.md) §7.1 là cửa vào của hai spec
kia, nên nó phải tồn tại trước. Đồng ý trước xoá vì nhánh "rút `privacy`" của
[`consent-management.md`](../specs/03-account/consent-management.md) §5 **dẫn sang** luồng xoá —
làm xoá trước thì nhánh rút trỏ vào chỗ trống, làm đồng ý trước thì nhánh đó chỉ chờ một liên kết.

**D-IF — phạm vi purge là **bảng khai ba nhóm**, và bảng chưa phân nhóm là cổng đỏ.** Mỗi bảng
trong schema thuộc đúng một nhóm: `delete` · `anonymize` · `retain`. Cổng đối chiếu danh sách
bảng thật trong schema với bảng khai; bảng có trong schema mà không có trong khai → **đỏ**.
Lý do: §7.2 của [`account-deletion.md`](../specs/03-account/account-deletion.md) là một danh
sách viết tay, và nó cũ đi ngay ở migration tiếp theo. `social_identities` là bằng chứng —
nó vào nhóm `delete` **ngay ở bước này**, dù luồng liên kết tới P1.15 mới chạy; bỏ sót thì
người dùng mất tài khoản Google đó với KidThink vĩnh viễn (`BR-ADL-10`).

**D-IG — rút `child_data` **dùng lại** đường lưu trữ của P1.9, không mở đường thứ hai.** Rút
đồng ý đặt hồ sơ sang `archived` bằng đúng hàm mà [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md)
đã sở hữu, cộng lý do và `purge_at`. Cổng: **đúng một** code path ghi
`child_profiles.status = 'archived'`. Lý do: hai đường lưu trữ sinh hai đường khôi phục, và
cái ít được dùng hơn sẽ lệch — lúc đó `BR-CSM-08` ("đồng ý lại trong 30 ngày → khôi phục")
hỏng im lặng, đúng lúc người dùng cần nó nhất.

**D-IH — version chính sách **không publish được** khi thiếu `summary_vi`.** `BR-CSM-05` bắt
hiện **thay đổi**, không chỉ toàn văn; `D-CY` đã chốt tóm tắt là soạn tay. P1.13 giao cơ chế
version nhưng không có trường này. Bước này thêm `summary_vi` bắt buộc cho **mọi version sau
bản đầu**, và cổng publish đỏ khi trống. Ca âm: tạo version mới với `summary_vi` rỗng → đỏ.

**D-II — "hỏi lại khi version đổi" chặn **đúng một** hành động: tạo hồ sơ trẻ mới.**
`BR-CSM-04` nói thẳng: version mới **không** khoá dữ liệu đã có. Cách hỏng tự nhiên là đặt
middleware lên `/api/users/**` — đúng về kỹ thuật, và là ép buộc về pháp lý. Xử: một guard
`requireCurrentConsent('child_data')` gắn vào **một** route tạo hồ sơ; ca âm là route đọc báo
cáo vẫn **200** với đồng ý cũ, và cổng đỏ nếu guard xuất hiện trên route đọc.

**D-IJ — danh sách route nhạy cảm là **dữ liệu**, và cổng canh cả hai chiều.** Bốn route ở bước
này (đổi mật khẩu, đặt mật khẩu, đổi email, xoá tài khoản) cộng hai route của P1.15 (liên kết,
gỡ SNS) đều đòi reauth. Sáu call site là chỗ mà "quên một cái" trở thành xác suất, và cái bị
quên thường là cái phá huỷ nhất. Xử: khai danh sách; cổng đỏ khi route trong danh sách **thiếu**
`requireReauth()`, **và** đỏ khi route có `requireReauth()` mà không nằm trong danh sách — vế
thứ hai giữ cho danh sách không thành trang trí.

## 3. Đồ thị

```
T1 guard reauth dùng chung + danh sách route nhạy cảm (D-IJ)
      └──→ T2 /me/settings: tên · đổi/đặt mật khẩu · email hai bước · tuỳ chọn thông báo
                └──→ T3 xem và đồng ý bản mới: summary_vi + diff (D-IH, D-II)
                          └──→ T4 rút đồng ý: child_data → archive của P1.9 (D-IG)
  T5 bảng phạm vi purge ba nhóm + cổng đối chiếu schema (D-IF)
      └──→ T6 xoá tài khoản: reauth · 30 ngày · huỷ · mở rộng account:purge
                              ── Cổng dừng ──
  T7 evidence, promote 3 spec
```

## 4. Task

### Task 1 — Guard reauth dùng chung

**Tiêu chí nghiệm thu**
- [ ] Danh sách route nhạy cảm khai dạng dữ liệu, gồm bốn route của bước này và chỗ dành cho hai route SNS của P1.15.
- [ ] Dùng `reauth.ts` và `REAUTH_WINDOW_MINUTES = 5` của P0.3 (`D-CZ`); **không** định nghĩa lại cửa sổ ở bất kỳ spec nào.
- [ ] `BR-ACS-01` `BR-ACS-03` `BR-ADL-03`: chưa reauth → **428** `REAUTH_REQUIRED` kèm `details.methods[]`.
- [ ] `details.methods[]` phản ánh cách thật sự dùng được: mật khẩu khi `password_hash` NOT NULL · OAuth khi có `social_identities` · TOTP khi có `mfa_settings`.
- [ ] Ca âm `D-IJ`: gỡ `requireReauth()` khỏi một route trong danh sách → cổng **đỏ**.
- [ ] Ca âm ngược `D-IJ`: thêm `requireReauth()` vào route ngoài danh sách → cổng **đỏ**.
- [ ] Hồi quy P0.3: reauth ở thiết bị A **không** nâng thiết bị B.

**Kiểm chứng**
- [ ] `pnpm test -- reauth-surface` xanh, assertion tham chiếu `BR-ACS-01` `BR-ADL-03`.

**Phụ thuộc:** P0.3 · **Cỡ:** S

### Task 2 — `/me/settings`

**Tiêu chí nghiệm thu**
- [ ] Bốn nhóm §7.1 đúng ranh giới. Nhóm **Bảo mật** ở bước này **chưa** có khối SNS và MFA — `BR-ACS-11`, hai thứ đó thuộc P1.15 và P2.11.
- [ ] `PATCH /api/users/profile` đổi tên hiển thị, **không** cần reauth.
- [ ] `BR-ACS-09`: `password_hash` NULL → hiện **"Đặt mật khẩu"**, không có ô "mật khẩu hiện tại".
- [ ] `POST /api/users/password` trả **409** `PASSWORD_NOT_SET` khi tài khoản chưa có mật khẩu.
- [ ] `BR-ACS-02` ca âm: đổi mật khẩu → `refresh_token_version` **+1**, thiết bị B mất phiên.
- [ ] `BR-ACS-10` ca âm: `PUT /api/users/password` (đặt lần đầu) → `refresh_token_version` **không đổi**, thiết bị B vẫn dùng được.
- [ ] `BR-ACS-03` `BR-ACS-04`: đổi email gửi token tới **email mới**, hạn 24h; `users.email` chỉ đổi khi xác thực xong; email cũ vẫn đăng nhập được trong lúc chờ.
- [ ] `BR-ACS-05`: đổi email thành công → thông báo tới địa chỉ **cũ**.
- [ ] **409** khi email mới đã có người dùng.
- [ ] `BR-ACS-06`: `PUT /api/users/notification-preferences` chỉ nhận `weekly_progress` và `content_new`; gửi loại giao dịch → **422**.
- [ ] Trả nợ P1.12: toggle `weekly_progress` đọc/ghi đúng `weekly_digest_enabled`, mặc định `true`; job digest tuần tôn trọng thay đổi ngay từ lần chạy kế tiếp.
- [ ] `BR-ACS-07` ca âm: quét form — không ô tuổi, giới tính, số điện thoại, địa chỉ.
- [ ] `BR-ACS-08` ca âm: không cài đặt nào của trẻ trên trang này.

**Kiểm chứng**
- [ ] `pnpm test -- account-settings` xanh, assertion tham chiếu `BR-ACS-02` `BR-ACS-09` `BR-ACS-10`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Xem và đồng ý bản mới

**Tiêu chí nghiệm thu**
- [ ] `GET /api/users/consents` trả §7.2 kèm version hiện hành của mỗi loại.
- [ ] `D-IH`: `summary_vi` bắt buộc cho mọi version sau bản đầu; ca âm publish thiếu tóm tắt → cổng **đỏ**.
- [ ] `BR-CSM-05` + `D-CY`: "Xem thay đổi" hiện `summary_vi` trước, toàn văn ở chế độ chi tiết.
- [ ] `BR-CSM-02` ca âm: checkbox **chưa tick**; không suy đồng ý từ hành vi nào.
- [ ] `BR-CSM-01` ca âm: đồng ý bản mới → `consent_logs` **thêm hàng**, hàng cũ không đổi.
- [ ] `BR-CSM-07`: mỗi hàng có `policy_version`, `ip_address`, `user_agent`, thời điểm.
- [ ] `POST /api/users/consents` trả **409** `CONSENT_VERSION_STALE` khi version không phải bản hiện hành.
- [ ] `BR-CSM-04` + `D-II`: chỉ route **tạo hồ sơ trẻ** trả **428** `CONSENT_REQUIRED`; báo cáo và dữ liệu đã có vẫn **200**.
- [ ] Ca âm `D-II`: gắn guard lên một route đọc → cổng **đỏ**.
- [ ] `BR-CSM-03` + `BR-LGL-05`: version mới → banner ở `/me` cho User đã đăng nhập.
- [ ] Ba loại đồng ý đúng §7.1; **không** có đồng ý tiếp thị (`BR-NOT-06`).

**Kiểm chứng**
- [ ] `pnpm test -- consent-view` xanh, assertion tham chiếu `BR-CSM-01` `BR-CSM-04` `BR-CSM-05`.

**Phụ thuộc:** T2 · P1.13 · **Cỡ:** M

### Task 4 — Rút đồng ý

**Tiêu chí nghiệm thu**
- [ ] `BR-CSM-06`: màn hình rút hiện hậu quả §7.3 với **đúng số hồ sơ bé** và mốc 30 ngày, không phải câu chung chung.
- [ ] `D-IG`: rút `child_data` → hồ sơ sang `archived` qua đúng đường của P1.9, kèm lý do và `purge_at = now + 30 ngày`.
- [ ] Ca âm `D-IG`: quét code — **đúng một** chỗ ghi `child_profiles.status = 'archived'`.
- [ ] `BR-CSM-08`: đồng ý lại trong 30 ngày → hồ sơ khôi phục hoàn toàn, dữ liệu còn nguyên.
- [ ] `BR-CSM-01`: rút = **INSERT** hàng `withdrawn`, không UPDATE hàng cũ.
- [ ] Rút `privacy` hoặc `terms` → dẫn sang luồng xoá tài khoản, **không** tự xoá.
- [ ] Trẻ không đồng ý và không rút được — guard theo actor.
- [ ] Sau khi rút `child_data`, thu dữ liệu mới của trẻ đó dừng ngay.

**Kiểm chứng**
- [ ] `pnpm test -- consent-withdraw` xanh, assertion tham chiếu `BR-CSM-06` `BR-CSM-08`.

**Phụ thuộc:** T3 · P1.9 · **Cỡ:** M

### Task 5 — Bảng phạm vi purge

**Tiêu chí nghiệm thu**
- [ ] Ba nhóm khai dạng dữ liệu: `delete` · `anonymize` · `retain`, khớp §7.2 của [`account-deletion.md`](../specs/03-account/account-deletion.md).
- [ ] `BR-ADL-10`: `social_identities` nằm nhóm **`delete`**, dù luồng liên kết tới P1.15 mới chạy.
- [ ] `BR-ADL-04`: `telemetry_events` nhóm **`anonymize`** — `child_uuid = NULL`, không xoá cứng.
- [ ] `BR-ADL-05`: `audit_logs` và `consent_logs` nhóm **`retain`**; `payment_orders` retain nhưng ẩn danh liên kết tới User.
- [ ] Cổng `D-IF`: bảng có trong schema mà không có trong ba nhóm → **đỏ**.
- [ ] Ca âm: thêm một bảng mới vào migration → cổng đỏ cho tới khi phân nhóm.

**Kiểm chứng**
- [ ] `pnpm test -- purge-scope` xanh và in ra "N/N bảng đã phân nhóm".

**Phụ thuộc:** P0.7 · **Cỡ:** S

### Task 6 — Xoá tài khoản

**Tiêu chí nghiệm thu**
- [ ] `BR-ADL-07`: trang xoá liệt kê **đúng** số hồ sơ trẻ và số ngày gói còn lại (§7.1), kèm phần được giữ theo luật.
- [ ] `BR-ADL-03`: xoá cần reauth; tài khoản `password_hash` NULL reauth bằng provider vẫn xoá được — test seed một hàng `social_identities`, không cần luồng P1.15.
- [ ] Xác nhận → `users.status = deleted`, `purge_at = +30 ngày`, `child_profiles.status = pending_deletion`, mọi phiên thu hồi **ngay**.
- [ ] Email xác nhận kèm **cách huỷ**.
- [ ] `BR-ADL-02`: huỷ trong 30 ngày → khôi phục toàn bộ, `status = active`; đăng nhập trong 30 ngày → **403** kèm đường dẫn huỷ; đã purge → **410**.
- [ ] `BR-ADL-01`: `account:purge` mở rộng sang phạm vi tài khoản, **không thêm job** (`D-GY`, registry P1.5).
- [ ] Job idempotent; chạy lại không hỏng dữ liệu đã xoá.
- [ ] `BR-ADL-08` + bảng retry P1.5: purge **1 lần**, fail → `alert()` ngay, không retry mù.
- [ ] `BR-ADL-09` ca âm: sau purge, chính email đó đăng ký lại được — không danh sách cấm.
- [ ] `BR-ADL-06` ca âm: quét route admin — không route nào đặt `users.status = deleted`.
- [ ] Còn entitlement hiệu lực → cảnh báo mất quyền còn lại, **không** tự hoàn tiền.

**Kiểm chứng**
- [ ] `pnpm test -- account-deletion` xanh, assertion tham chiếu `BR-ADL-01` `BR-ADL-02` `BR-ADL-10`.

**Phụ thuộc:** T4 · T5 · P1.5 · **Cỡ:** M

### Cổng dừng

- [ ] Bốn route nhạy cảm đều 428 khi chưa reauth; ca âm hai chiều của `D-IJ` xanh.
- [ ] Đặt mật khẩu lần đầu không đá người dùng ra khỏi thiết bị khác.
- [ ] Version chính sách mới chặn **đúng** việc tạo hồ sơ trẻ; báo cáo vẫn đọc được.
- [ ] Rút `child_data` rồi đồng ý lại trong 30 ngày → hồ sơ về nguyên trạng.
- [ ] Purge chạy hết ba nhóm; `social_identities` không còn hàng; `telemetry_events` còn hàng với `child_uuid` NULL.
- [ ] Email đã purge đăng ký lại được.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 7 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-ACS-*` `BR-CSM-*` `BR-ADL-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented`.
- [ ] §11 Q1 của [`account-deletion.md`](../specs/03-account/account-deletion.md) (hoàn tiền phần gói chưa dùng) chuyển **P2.3**, gộp làm **một** câu với §11 Q3 của [`legal-pages.md`](../specs/02-public/legal-pages.md) — cùng một chính sách, một chủ.
- [ ] §11 Q2 của [`consent-management.md`](../specs/03-account/consent-management.md) (ai quyết version chính sách, bao lâu một lần) nêu lại cho chủ — vận hành, **không chặn code**.
- [ ] Nợ ghi sang **P1.15**: chèn khối SNS vào nhóm Bảo mật (`BR-ACS-11`) và thêm hai route vào danh sách reauth.
- [ ] Nợ ghi sang **P2.11**: chèn MFA vào nhóm Bảo mật.
- [ ] Xác nhận nợ digest tuần của [`38-p1-12-report-dashboard-library-plan.md`](38-p1-12-report-dashboard-library-plan.md) đã đóng bằng toggle `weekly_progress`; không còn debt P1.14 vô chủ.
- [ ] Tick **P1.14** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Quên reauth ở một route | Phiên bị chiếm đổi được email và xoá được tài khoản | `D-IJ` — danh sách dữ liệu, cổng hai chiều |
| Purge bỏ sót một bảng | Dữ liệu trẻ còn lại sau khi đã hứa xoá; `social_identities` sót thì khoá tài khoản SNS vĩnh viễn | `D-IF` — ba nhóm, cổng đối chiếu schema |
| Middleware đồng ý phủ quá rộng | Khoá dữ liệu của phụ huynh để ép đồng ý — vi phạm `BR-CSM-04` | `D-II` — một guard một route, ca âm route đọc |
| Hai đường lưu trữ hồ sơ trẻ | Khôi phục sau khi rút đồng ý hỏng im lặng | `D-IG` — một code path, cổng quét |
| Version mới không có tóm tắt | Người dùng đồng ý mà không biết đổi gì | `D-IH` — `summary_vi` bắt buộc, cổng publish |
| Đặt mật khẩu lần đầu giết phiên | Phạt người dùng vì vừa tăng bảo mật | `BR-ACS-10` — ca âm `refresh_token_version` |
| Purge retry mù | Thao tác phá huỷ chạy nhiều lần | Bảng retry P1.5 — purge 1×, fail → alert |
| Đổi email một bước | Gõ nhầm địa chỉ là mất tài khoản | `BR-ACS-04` — email cũ hiệu lực tới khi xác thực |

## 6. Giả định

1. **P1.13 đã đóng** — có version chính sách và URL vĩnh viễn để đồng ý trỏ vào.
2. **P1.9 đã đóng** — ba trạng thái hồ sơ trẻ và đường khôi phục đã chạy.
3. **P1.5 đã đóng** — registry job, bảng retry, và `AlertPort` có adapter thật.
4. **MFA chưa tồn tại ở bước này** — `details.methods[]` khai TOTP nhưng không nhánh nào bật được nó tới P2.11.
5. **SNS chưa tồn tại ở bước này** — test tài khoản chỉ-SNS seed thẳng hàng `social_identities`.
6. **Chính sách hoàn tiền chưa có** — trang xoá cảnh báo mất quyền còn lại, không hứa hoàn tiền.

## 7. Ngoài phạm vi

- Khối liên kết SNS trong nhóm Bảo mật — P1.15.
- MFA — P2.11.
- Xuất dữ liệu cá nhân — [`data-export.md`](../specs/06-admin/data-export.md), P2.9.
- Xoá một hồ sơ trẻ riêng lẻ có cần 30 ngày không — P2, §11 Q2 của [`account-deletion.md`](../specs/03-account/account-deletion.md).
- Chính sách hoàn tiền — P2.3.
