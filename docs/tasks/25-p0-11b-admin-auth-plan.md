# Kế hoạch — Task #25: P0.11b — Đăng nhập quản trị

> Viết 2026-08-09, đo tại commit `5a1bb2b`. Bước sở hữu: **P0.11b** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) — bước **cuối
> cùng** của P0.
> Spec sở hữu: [`admin-auth.md`](../specs/06-admin/admin-auth.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Bước cuối P0, và là bước mở khoá **8 spec `06-admin` ở P2** — cả vùng admin khai `depends_on`
nó. Đó là lý do Task #14 vá nó vào roadmap: nó vô hình vì không có màn hình để demo, nhưng
chặn nhiều nhất.

Ba thứ phân biệt bề mặt này với bề mặt người dùng, và cả ba phải đúng ngay lần đầu:

1. **MFA bắt buộc** cho mọi Manager — không có chế độ "bật sau".
2. **Tách hoàn toàn**: subdomain riêng, cookie riêng, token audience riêng.
3. **Phân quyền ở server route**, không ở menu.

Phần lớn cơ chế đã được P0.3 giao: `manager-session.ts`, contract challenge một mục đích,
ranh giới cross-audience. P0.11b gắn chúng vào route thật và thêm TOTP.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `AUTH-TOKENS-SESSIONS` · `ACTORS` | P0.3 | contract challenge, TTL 24 giờ, cookie tách |
| `AUDIT-LOG` | **P0.11** | `manager_login` `manager_login_failed` `manager_mfa_failed` |
| `RATE-LIMITING` | P0.9b | khoá 5 lần sai MFA → 15 phút |

P0.11 phải đóng trước: `BR-ADA-05` bắt mọi đăng nhập và thất bại ghi `audit_logs`, và ba
action đó nằm trong danh sách 28 của P0.11.

## 1. Đo được

### 1.1 Schema đã đủ

| Bảng / cột | Có |
|---|---|
| `managers` (`role`, `mfa_enabled`, `password_hash` NOT NULL, `refresh_token_version`) | có |
| `mfa_settings` | có |
| `mfa_recovery_codes` | có |
| `active_sessions` dùng chung cho cả hai audience | có |
| enum `manager_role` | có |

`managers.password_hash` là **NOT NULL** — khác `users.password_hash` (nullable). Đúng: không
có đường SNS cho Manager, và `BR-ADA-03` cấm endpoint public tạo Manager.

### 1.2 P0.3 đã chốt contract, chưa gắn route

Todo của P0.3 ghi rõ ba điều đã được human duyệt:

- Challenge trước MFA chỉ cấp credential **một mục đích**; **không** tạo access token hay `active_sessions` trước khi MFA thành công.
- TTL refresh Manager là **24 giờ**; User là 7 ngày.
- Cookie, secret và audience của Manager **không dùng chung** với User.

P0.11b **không** thiết kế lại ba điều này — nó gắn chúng vào `apps/admin` và thêm lớp TOTP.

### 1.3 Chưa có

TOTP (sinh secret, xác thực mã, mã khôi phục), route đăng nhập/MFA/logout của admin, ma trận
role × bề mặt §7.2, và bắt buộc thiết lập MFA trước khi vào trang đầu tiên.

## 2. Quyết định

**D-EX — TOTP cho Manager làm ở P0.11b, không chờ [`mfa.md`](../specs/03-account/mfa.md) (P2.11).**
Hai spec khác nhau: MFA của Manager là **bắt buộc** và thuộc P0; MFA của User là **tuỳ chọn**
và thuộc P2. P0.11b giao cơ chế TOTP dùng lại được; P2.11 thêm luồng bật/tắt cho User.

**D-EY — Ma trận §7.2 là dữ liệu, không phải `if` rải trong route.** 13 bề mặt × 2 role = 26 ô.
Khai thành bảng cho phép test duyệt **toàn bộ** ô; rải vào từng route thì mỗi ô là một lần
người viết phải nhớ — và `BR-ADA-04` nói ẩn menu không phải phân quyền.

**D-EZ — Manager đầu tiên tạo bằng seed, mật khẩu ban đầu là câu hỏi người.** §11 Q2 hỏi quy
trình xoay mật khẩu ban đầu, chủ là **người quyết**, chặn go-live. P0.11b giao seed **bắt buộc
đổi mật khẩu và thiết lập MFA ở lần đăng nhập đầu**, và nêu lại câu hỏi ở cổng ra P0.

**D-FA — Không secret MFA trong log, audit, hay test snapshot.** `BR-AUD-06` cấm bí mật trong
`audit_logs`, và TOTP secret là bí mật. Ca âm phải có, vì đây là chỗ dễ lọt nhất khi debug.

## 3. Đồ thị

```
T1 TOTP: sinh secret · xác thực mã · mã khôi phục dùng một lần
      └──→ T2 route login → 428 MFA_REQUIRED + challenge một mục đích
                └──→ T3 route mfa → cặp token đầy đủ + active_sessions + audit
                          ├──→ T4 ma trận role × bề mặt (dữ liệu, test đủ 26 ô)
                          ├──→ T5 tách cookie/audience/subdomain + ca âm
                          └──→ T6 seed Manager đầu tiên + ép đổi mật khẩu và bật MFA
                              ── Cổng dừng ──
  T7 evidence, cổng ra P0, promote
```

## 4. Task

### Task 1 — TOTP và mã khôi phục

**Tiêu chí nghiệm thu**
- [ ] Sinh secret, xác thực mã theo cửa sổ thời gian chuẩn, chống dùng lại mã trong cùng cửa sổ.
- [ ] Mã khôi phục **dùng một lần**; dùng rồi bị vô hiệu.
- [ ] Hết mã khôi phục → chỉ `super_admin` khác reset được, có audit (`BR-ADA-08`).
- [ ] Ca âm `D-FA`: secret và mã khôi phục **không** xuất hiện trong log, `audit_logs`, hay test snapshot.
- [ ] Sai MFA 5 lần → khoá 15 phút, dùng bảng hạn mức của P0.9b.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/auth test -- totp` xanh, assertion tham chiếu `BR-ADA-08`.

**Phụ thuộc:** P0.9b · **Cỡ:** M

### Task 2 — `POST /api/guest/auth/managers/login`

**Tiêu chí nghiệm thu**
- [ ] Đúng mật khẩu → **428** `MFA_REQUIRED` + challenge credential **một mục đích**, TTL ngắn.
- [ ] Ca âm `BR-ADA-01`: challenge **không** qua được `requireManagerAuth`, và **chưa** có hàng `active_sessions` nào.
- [ ] Sai mật khẩu → 401 `INVALID_CREDENTIALS` + audit `manager_login_failed`.
- [ ] `is_active = false` → 403, không nói lý do chi tiết.
- [ ] Chưa bật MFA → bắt buộc thiết lập **trước khi** vào bất kỳ trang nào.
- [ ] Rate limit `auth:login` hai trục theo bảng P0.9b.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/admin test -- login` xanh, assertion tham chiếu `BR-ADA-01`.

**Phụ thuộc:** T1 · P0.11 · **Cỡ:** M

### Task 3 — `POST /api/guest/auth/managers/mfa`

**Tiêu chí nghiệm thu**
- [ ] Nhận `{ code, challenge }` — TOTP **hoặc** mã khôi phục.
- [ ] Thành công → cặp token đầy đủ, payload đúng §7.1 (`aud: "kidthink:manager"`, `iss: "kidthink:admin"`, `role`).
- [ ] `BR-ADA-07`: refresh **không quá 24 giờ**; ca âm decode token và kiểm hạn.
- [ ] Ghi `active_sessions` + audit `manager_login` (`BR-ADA-05`).
- [ ] Sai mã → 401 + audit `manager_mfa_failed`.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/admin test -- mfa` xanh, assertion tham chiếu `BR-ADA-05` `BR-ADA-07`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Ma trận role × bề mặt

**Tiêu chí nghiệm thu**
- [ ] 13 bề mặt §7.2 khai dạng dữ liệu, mỗi ô ghi role nào vào được (D-EY).
- [ ] Test duyệt **đủ 26 ô**; ô "Cấm" phải trả 403.
- [ ] `BR-ADA-04`: ca âm — `content_reviewer` gọi thẳng `GET /api/managers/users` bằng curl → **403**, không phụ thuộc menu.
- [ ] `BR-ADA-06`: Manager gọi PATCH đổi `role` của chính mình → **403**; ca âm gồm cả `super_admin`.
- [ ] Route admin mới không khai được trong ma trận là **lỗi**, không phải mặc định cho phép.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/admin test -- role-matrix` xanh, assertion tham chiếu `BR-ADA-04` `BR-ADA-06`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Tách bề mặt

**Tiêu chí nghiệm thu**
- [ ] `BR-ADA-02`: cookie Manager giới hạn domain `admin.{domain}`; ca âm — request tới domain chính **không** kèm cookie manager.
- [ ] Secret ký token của Manager khác secret của User; ca âm — token User không qua được guard Manager và ngược lại (dùng lại test cross-namespace của P0.3).
- [ ] `BR-ADA-03`: cổng quét mọi route `/api/guest` — **không** route nào tạo hàng trong bảng `managers`.
- [ ] Cấu hình nginx cho subdomain admin có mặt; `infra/nginx/conf.d/` đã có `manager.conf` và `superadmin.conf` — đối chiếu, không viết lại.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/admin test -- surface-isolation` xanh, assertion tham chiếu `BR-ADA-02` `BR-ADA-03`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 6 — Manager đầu tiên

**Tiêu chí nghiệm thu**
- [ ] Seed tạo đúng **một** `super_admin`; idempotent.
- [ ] Mật khẩu ban đầu đọc từ biến môi trường, **không** hằng số trong source (D-EZ).
- [ ] Lần đăng nhập đầu **bắt buộc** đổi mật khẩu và thiết lập MFA trước khi vào trang nào.
- [ ] Ca âm: bỏ qua bước thiết lập bằng cách gọi thẳng route admin → 403.
- [ ] §11 Q2 (quy trình xoay mật khẩu ban đầu) nêu lại ở cổng ra P0 — chủ là người quyết.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/db test -- seed-manager` xanh.

**Phụ thuộc:** T4 · T5 · **Cỡ:** S

### Cổng dừng

- [ ] Không vào được trang admin nào khi chưa qua MFA.
- [ ] Challenge trước MFA không qua guard, không tạo `active_sessions`.
- [ ] 26 ô ma trận đều có test; curl không đi vòng được.
- [ ] Cookie và audience tách hoàn toàn hai chiều.
- [ ] Mọi đăng nhập và thất bại có hàng `audit_logs`.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human security reviewer approve diff — vùng nhạy cảm **auth**, không auto-merge.

### Task 7 — Evidence, cổng ra P0, promote

- [ ] Mỗi `BR-ADA-*` có ít nhất một test tham chiếu mã rule.
- [ ] Spec sang `implemented`; tick P0.11b khi `check:progress` tự xanh.
- [ ] **Chạy cổng ra P0** — đây là bước cuối của phase:
  - [ ] Điều kiện ở [`SPEC.md`](../SPEC.md) §13.
  - [ ] [`security-checklist.md`](../specs/08-quality/security-checklist.md) chạy hết, không mục nào đỏ.
  - [ ] 35 spec P0 mang `status: implemented`.
  - [ ] Mọi `BR-*` mà P0 sở hữu có ít nhất một test tham chiếu mã rule.
  - [ ] Không spec P0 nào còn câu hỏi mở mang `Chặn phase: P0`.
  - [ ] Ba câu hỏi **chặn go-live** đã có chủ trả lời: khoá mã hoá backup (§11 Q1 của [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md)), rà soát pháp lý và DPIA (§11 Q1–Q2 của [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)), mật khẩu Manager ban đầu (§11 Q2 của [`admin-auth.md`](../specs/06-admin/admin-auth.md)).

**Cỡ:** M

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Cấp access token trước khi MFA xong | MFA thành hình thức | `BR-ADA-01` — ca âm kiểm challenge không qua guard **và** chưa có `active_sessions` |
| Ma trận rải thành `if` trong route | Một ô sai là một bề mặt mở nhầm | D-EY — bảng dữ liệu, test đủ 26 ô |
| Route admin mới quên khai quyền | Mặc định mở là chế độ hỏng tệ nhất ở đây | T4 — không khai được trong ma trận là **lỗi** |
| Cookie Manager rò sang domain chính | Bề mặt admin mất tách biệt | `BR-ADA-02` có ca âm hai chiều |
| TOTP secret lọt vào log lúc debug | Bí mật vào `audit_logs` là **không xoá được** (`BR-AUD-06`) | D-FA — ca âm quét log, audit, snapshot |
| Mật khẩu Manager đầu tiên hardcode | Tài khoản quyền cao nhất có mật khẩu trong git | D-EZ — biến môi trường + ép đổi lần đầu |
| Chờ [`mfa.md`](../specs/03-account/mfa.md) P2 mới làm MFA | `BR-ADA-01` không thực thi được, cả P0 không đóng được | D-EX — TOTP làm ở đây, P2.11 dùng lại |

## 6. Giả định

1. **P0.11 đã đóng.** Ba action audit của bước này nằm trong registry 28 action.
2. **P0.3 đã giao contract challenge và tách audience.** P0.11b gắn vào route, không thiết kế lại.
3. **`infra/nginx/conf.d/` đã có cấu hình subdomain admin.** Đối chiếu và dùng lại, không viết lại.
4. **Không giao màn hình admin nào ngoài đăng nhập.** [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) là P2.1.
5. **Đúng một Manager ở P0.** Quản lý nhiều Manager thuộc P2.

## 7. Ngoài phạm vi

- Admin shell và mọi màn hình quản trị — P2.1 trở đi.
- MFA tuỳ chọn cho User — [`mfa.md`](../specs/03-account/mfa.md), P2.11.
- Giới hạn IP cho bề mặt admin — §11 Q1, chặn P2.
- Quản lý nhiều Manager, tạo/khoá tài khoản Manager — P2.
