# Kế hoạch — Task #44: P2.2 — Tra cứu vận hành: User, chi tiết, hồ sơ trẻ

> Viết 2026-08-10. Bước sở hữu: **P2.2** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`user-management.md`](../specs/06-admin/user-management.md) ·
> [`user-detail.md`](../specs/06-admin/user-detail.md) ·
> [`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Ba spec, nhưng đọc kỹ thì phần lớn nội dung của chúng là **danh sách những thứ không được
tồn tại**: không trang liệt kê trẻ, không tìm trẻ theo tên, không endpoint xoá cứng User,
không route đặt mật khẩu User, không mutation trên trang chi tiết, không telemetry của trẻ.

Đó đổi cách làm bước này. Một tính năng có test khi nó chạy đúng; **một tính năng không được
phép tồn tại thì không có gì để test** — trừ khi có cổng quét mã nguồn. Repo đã có đúng loại
cổng đó tại `apps/web/tests/gates/child-data-compliance.ts`, viết từ P0.4 cho `BR-CDC-08` và
`BR-CDC-11`. Bước này mở rộng nó, không phát minh cơ chế thứ hai.

Phần "có tồn tại" thì nhỏ và rõ: một danh sách có lọc, một trang chi tiết chỉ đọc, ba thao tác
vận hành (khoá · mở khoá · gửi link đặt lại), và **một** thao tác trên hồ sơ trẻ (lưu trữ).

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `ADMIN-AUTH` | P0.11b | `requireManagerAuth()` + phân biệt `super_admin` / `content_reviewer` |
| `ACTORS` | P0.3 | ranh giới tác nhân |
| `AUDIT-LOG` | P0.11 | `audit_logs`, `BR-AUD-01` — lý do bắt buộc |
| `CHILD-DATA-COMPLIANCE` | P0.4 | `BR-CDC-13` `BR-CDC-14`; cổng quét sẵn có |
| Admin shell | P2.1 | layout `manager`, nav theo role |
| `LOGIN-AND-SESSION` | P0.10 | `refresh_token_version` — cơ chế thu hồi phiên |
| `CHILD-PROFILE-ARCHIVE` | P1.9 | luồng lưu trữ của chính User; admin dùng lại, không viết lại |

## 1. Đo được

### 1.1 Đã có

`audit_logs` với lý do bắt buộc; `refresh_token_version` để thu hồi phiên; luồng lưu trữ hồ sơ
trẻ của P1.9; luồng xoá tài khoản 30 ngày của P1.14; shell admin của P2.1; cổng quét tuân thủ
dữ liệu trẻ của P0.4.

### 1.2 Chưa có

Danh sách User có lọc và phân trang cursor; trang chi tiết bốn nhóm; ba thao tác vận hành;
thao tác lưu trữ hồ sơ trẻ từ admin; và **phần mở rộng cổng quét** cho sáu quy tắc dạng "không
được tồn tại".

### 1.3 Đã chốt, không mở lại

`BR-CDC-14` vận hành không có nhu cầu nghiệp vụ với dữ liệu học tập của một trẻ ·
xoá tài khoản là quyền của chủ thể dữ liệu, đi qua [`account-deletion.md`](../specs/03-account/account-deletion.md) ·
`D-IW` mọi trang admin sống trong layout `manager` · `D-IY` lọc theo role ở server.

## 2. Quyết định

**D-JB — Sáu quy tắc "không được tồn tại" thi hành bằng **cổng quét route**, mở rộng script
sẵn có.** `BR-USM-07` · `BR-USM-08` · `BR-CPA-01` · `BR-CPA-06` · `BR-CPA-07` · `BR-CPA-08` đều
có dạng "quét mọi route admin, không route nào…". Viết chúng thành review checklist là giao
việc canh cho trí nhớ người. Xử: thêm vào `apps/web/tests/gates/child-data-compliance.ts` một
hàm quét thư mục route admin, khẳng định: không `DELETE` trên `child_profiles` hay `users`;
không handler nào ghi `password_hash` của User; không route trả `child_profiles` mà thiếu ràng
buộc `user_id`; không schema query nào nhận tên trẻ làm tham số. Chạy trong `pnpm check`. Ca âm
bắt buộc: thêm một route vi phạm vào fixture → cổng **đỏ**.

**D-JC — Ô tìm kiếm thoát ký tự đại diện, không chỉ tham số hoá.** `BR-USM-02` nói Zod parse mọi
param vì `q` đi vào `ilike`. Tham số hoá chặn được injection nhưng **không** chặn được `q = "%"`
— truy vấn hợp lệ quét toàn bảng, và trên t3.small đó là sự cố chứ không phải kết quả rỗng.
Xử: Zod schema cho toàn bộ §7.1; `q` bị thoát `%` `_` `\` trước khi ghép vào pattern; dùng
**prefix match** (`q%`) để còn dùng được index; trần `limit` **100** ép trong schema, không ép
trong handler. Ca âm: `q` chứa nháy đơn và phần trăm → **200**, không lỗi SQL, và không quét
toàn bảng; `limit=500` → tối đa **100** item.

**D-JD — Audit lúc **đọc** dữ liệu trẻ ghi đồng bộ, một hàng mỗi lần mở, và response
`no-store`.** `BR-USD-05` và `BR-CPA-05` bắt một `GET` phải ghi. Ba cách hỏng: ghi bất đồng bộ
rồi mất khi worker fail (mất dấu vết truy cập dữ liệu trẻ), ghi mỗi hồ sơ một hàng (một tài
khoản 5 trẻ thành 5 hàng cho một lần nhìn), và cache response nên lần xem thứ hai không ghi gì.
Xử: một hàng `audit_logs` với `action = "manager.child_profiles.viewed"`, `target_type =
"user"`, `target_id = user_uuid`, `metadata.child_count`; ghi **trong cùng transaction** với
truy vấn; chỉ ghi khi response thật sự chứa ≥1 hồ sơ; đặt `Cache-Control: no-store` trên
endpoint chi tiết. Ca âm: mở chi tiết hai lần → **hai** hàng audit.

**D-JE — Khoá là hai chuyển động **ngược nhau**, và ca âm phải đi thành cặp.** `BR-USM-05` bắt
thu hồi mọi phiên; `BR-USM-04` cấm động vào entitlement. Cài đúng một nửa vẫn qua được một nửa
số test. Xử: một test duy nhất chạy cả hai vế trên cùng một fixture — khoá → hai thiết bị mất
phiên ở request kế tiếp **và** hàng `entitlements` không đổi một byte; mở khoá → dùng lại được
ngay, không cần cấp lại quyền. Cơ chế thu hồi là `refresh_token_version` +1 của P0.10, **không**
phải xoá hàng session.

**D-JF — Hồ sơ trẻ ra bề mặt admin qua **một** projection dùng chung.** `BR-CPA-02` nói đúng bốn
trường. Nếu mỗi endpoint tự chọn trường thì quy tắc đúng ở ngày viết và sai ở lần thêm cột thứ
nhất. Xử: `packages/shared/src/admin/child-projection.ts` xuất một hàm nhận hàng
`child_profiles` và trả **đúng** `display_name` · `age_band` · `status` · `created_at`; mọi bề
mặt admin đi qua nó. Cổng: response admin nào chứa `birth_year` · `avatar_id` ·
`current_curriculum_id` · `daily_play_cap_minutes` · trường học tập → **đỏ**. Đây cũng là cách
`BR-CPA-03` được canh mà không phải đọc từng handler.

## 3. Đồ thị

```
T1 mở rộng cổng quét route cho 6 quy tắc "không tồn tại" (D-JB)   ← làm TRƯỚC
      └──→ T2 GET /api/managers/users: Zod · thoát wildcard · cursor (D-JC)
                ├──→ T3 ba thao tác vận hành: suspend · reactivate · gửi link đặt lại (D-JE)
                └──→ T4 GET /api/managers/users/{uuid}: bốn nhóm · projection trẻ · audit (D-JD, D-JF)
                          └──→ T5 POST /api/managers/children/{uuid}/archive
                                    └──→ T6 hai màn hình trong shell P2.1
                                              ── Cổng dừng ──
                                                    T7 evidence, promote 3 spec, nợ
```

`T1` đứng trước có chủ đích: cổng viết **trước** code là cổng chứng minh được nó bắt lỗi; cổng
viết sau code luôn xanh ở lần chạy đầu và không ai biết nó có hoạt động không.

## 4. Task

### Task 1 — Mở rộng cổng quét route

**Tiêu chí nghiệm thu**
- [ ] Thêm hàm quét vào `apps/web/tests/gates/child-data-compliance.ts`, chạy trong `pnpm check`.
- [ ] `BR-USM-07`: không route admin nào `DELETE` một hàng `users`.
- [ ] `BR-USM-08`: không handler admin nào ghi `password_hash`; chỉ có route gửi link đặt lại.
- [ ] `BR-CPA-01`: không route nào trả `child_profiles` mà không ràng buộc theo một `user_id` cụ thể.
- [ ] `BR-CPA-06`: không `PATCH` `child_profiles` ngoài `archive`.
- [ ] `BR-CPA-07`: không `DELETE` `child_profiles`.
- [ ] `BR-CPA-08`: không schema query admin nào nhận tên trẻ làm tham số.
- [ ] `D-JB` ca âm — **bắt buộc, viết trước**: sáu fixture vi phạm, mỗi fixture làm cổng **đỏ** đúng một quy tắc.

**Kiểm chứng**
- [ ] `pnpm test -- admin-route-gates` xanh với 6 ca dương + 6 ca âm.

**Phụ thuộc:** P0.4 · **Cỡ:** M

### Task 2 — Danh sách User

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/users` cần `requireManagerAuth()` + `super_admin`; `content_reviewer` → **403** `INSUFFICIENT_ROLE`.
- [ ] Zod schema phủ đủ §7.1: `q` · `status` · `package_code` · `created_from` `created_to` · `has_children` · `sort` · `limit` · `cursor`.
- [ ] `BR-USM-01` + `D-JC`: trần **100** ép trong schema; `limit=500` → tối đa 100 item.
- [ ] `BR-USM-02` + `D-JC` ca âm: `q` chứa `'` và `%` → **200**, không lỗi SQL, và pattern đã thoát ký tự đại diện.
- [ ] Phân trang **cursor**, không `OFFSET` — offset sâu trên t3.small là quét bảng.
- [ ] Cột đúng §7.2; `BR-USM-06` ca âm: response chứa **số lượng** hồ sơ trẻ, không tên, không tuổi, không tiến độ.
- [ ] Tìm không ra → gợi ý tìm bằng email đầy đủ (§5).
- [ ] User `deleted` hiện dạng chỉ đọc trong danh sách.

**Kiểm chứng**
- [ ] `pnpm test -- users-list` xanh, assertion tham chiếu `BR-USM-01` `BR-USM-02` `BR-USM-06`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Ba thao tác vận hành

**Tiêu chí nghiệm thu**
- [ ] `POST /api/managers/users/{uuid}/suspend` và `/reactivate` nhận `{ reason }`.
- [ ] `BR-USM-03`: `reason` **< 10 ký tự** → **422** `ADMIN_NOTE_REQUIRED`, và User **không đổi trạng thái**.
- [ ] Mỗi thao tác ghi `audit_logs` với `reason`, `actor_id`, `target_id`.
- [ ] `D-JE` ca âm ghép đôi — một test, hai vế: khoá → hai thiết bị mất phiên ở request kế tiếp **và** hàng `entitlements` không đổi; mở khoá → dùng lại ngay.
- [ ] Thu hồi phiên bằng `refresh_token_version` +1, không xoá hàng session.
- [ ] `POST /api/managers/users/{uuid}/send-password-reset` gửi link; response **không** chứa token.
- [ ] Thao tác trên User `deleted` → **409**, không âm thầm bỏ qua.

**Kiểm chứng**
- [ ] `pnpm test -- user-ops` xanh, assertion tham chiếu `BR-USM-03` `BR-USM-04` `BR-USM-05` `BR-USM-08`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Chi tiết User

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/users/{uuid}` trả bốn nhóm §7.1: tài khoản · hồ sơ trẻ · quyền · thanh toán.
- [ ] `D-JF`: nhóm hồ sơ trẻ đi qua projection dùng chung — **đúng bốn** trường.
- [ ] `BR-USD-01` + `BR-CPA-03` ca âm: response không chứa `mastery`, `p_learn`, `telemetry`, `play_session` của trẻ nào.
- [ ] `BR-USD-04` ca âm: response không chứa `password_hash`, refresh token, hay MFA secret.
- [ ] `BR-USD-06`: lịch sử đơn hiện **đủ**, kể cả đơn `rejected`; ca âm — 1 `approved` + 2 `rejected` → hiện **3**.
- [ ] Nhóm thanh toán ở bước này đọc bảng đơn của P0.7; chưa có đơn nào thì hiện "chưa có", **không** hiện 0 (§5).
- [ ] `D-JD` + `BR-USD-05` ca âm: mở chi tiết một User có hồ sơ trẻ **hai lần** → **hai** hàng `audit_logs`; User không có hồ sơ trẻ → **không** hàng nào.
- [ ] `D-JD`: `Cache-Control: no-store` trên endpoint này.
- [ ] `BR-USD-03` + `D-JA` cổng: quét lời gọi từ trang chi tiết — không mutation trực tiếp; hành động dẫn sang bề mặt khác.
- [ ] User chưa xác thực email → có nút gửi lại; User `deleted` → hiện `purge_at`, chỉ đọc.
- [ ] **404** khi UUID không tồn tại; **403** với `content_reviewer`.

**Kiểm chứng**
- [ ] `pnpm test -- user-detail` xanh, assertion tham chiếu `BR-USD-01` `BR-USD-04` `BR-USD-05` `BR-USD-06`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 5 — Lưu trữ hồ sơ trẻ từ admin

**Tiêu chí nghiệm thu**
- [ ] `POST /api/managers/children/{uuid}/archive` cần `super_admin`; `{ reason }` bắt buộc → thiếu là **422** `ADMIN_NOTE_REQUIRED`.
- [ ] Dùng lại luồng lưu trữ của [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) (P1.9); **không** viết luồng thứ hai.
- [ ] `BR-CPA-07`: đây là **thao tác duy nhất** trên hồ sơ trẻ từ admin; không có thao tác thứ hai.
- [ ] Hồ sơ `pending_deletion` → hiện `purge_at`, thao tác trả **409**.
- [ ] Yêu cầu **xoá** của phụ huynh vẫn đi qua [`account-deletion.md`](../specs/03-account/account-deletion.md); admin không xoá thay.
- [ ] Ghi `audit_logs` với `reason`.

**Kiểm chứng**
- [ ] `pnpm test -- child-archive-admin` xanh, assertion tham chiếu `BR-CPA-07`.

**Phụ thuộc:** T4 · P1.9 · **Cỡ:** S

### Task 6 — Hai màn hình trong shell

**Tiêu chí nghiệm thu**
- [ ] `/users` và `/users/{uuid}` dùng layout `manager` của P2.1; nav có mục "Người dùng" chỉ với `super_admin`.
- [ ] Bộ lọc §7.1 hiện đủ; xoá lọc về trạng thái mặc định được.
- [ ] Trang chi tiết: bốn nhóm, mỗi nhóm có nhãn rõ; nhóm rỗng hiện "chưa có".
- [ ] Nút hành động dẫn sang [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) và [`payment-queue.md`](../specs/06-admin/payment-queue.md) hiện **disabled kèm nhãn bước** cho tới P2.3/P2.4 — không 404, cùng cách `D-IX` xử lý thẻ chưa có nguồn.
- [ ] Hộp thoại khoá/mở khoá bắt nhập lý do; nút gửi disabled tới khi đủ 10 ký tự.
- [ ] `content_reviewer` gõ thẳng URL `/users` → màn **403** của shell, không phải trang trắng.

**Kiểm chứng**
- [ ] `pnpm test:e2e -- admin-users` xanh.

**Phụ thuộc:** T3 · T5 · **Cỡ:** M

### Cổng dừng

- [ ] Sáu ca âm của `D-JB` đều làm cổng đỏ khi thêm route vi phạm.
- [ ] `q = "%"` không quét toàn bảng; `limit=500` trả tối đa 100.
- [ ] Khoá: mất phiên **và** entitlement nguyên vẹn — một test, hai vế.
- [ ] Mở chi tiết User có trẻ hai lần → hai hàng audit; không có trẻ → không hàng nào.
- [ ] Không response admin nào chứa trường trẻ ngoài bốn trường của projection.
- [ ] `content_reviewer` bị **403** ở cả ba bề mặt.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

### Task 7 — Evidence, promote và nợ chuyển tiếp

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-USM-*` `BR-USD-*` `BR-CPA-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented`.
- [ ] §11 Q1 của [`user-management.md`](../specs/06-admin/user-management.md) và Q1 của [`user-detail.md`](../specs/06-admin/user-detail.md) là **cùng một câu** (ghi chú hỗ trợ gắn với User) — đóng **một lần** theo đề xuất: hoãn sang P4, MVP dùng `audit_logs`.
- [ ] §11 Q2 của [`user-management.md`](../specs/06-admin/user-management.md) (khoá tự động sau N vi phạm) — đóng theo đề xuất: MVP luôn thủ công.
- [ ] §11 Q1 của [`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md) (phụ huynh cấp quyền xem tạm một phiên chơi) — đóng theo đề xuất: MVP **không** hỗ trợ, kể cả khi phụ huynh đồng ý; hoãn P4. Nêu cho chủ vì nó sẽ quay lại từ kênh hỗ trợ.
- [ ] Nợ ghi sang **P2.3**: bật nút "xem đơn" · **P2.4**: bật nút "cấp entitlement".
- [ ] Tick **P2.2** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Quy tắc "không tồn tại" chỉ nằm trong review | Route cấm xuất hiện ở PR thứ mười, không ai nhớ | `D-JB` — cổng quét, ca âm viết trước |
| `q = "%"` quét toàn bảng | Instance t3.small chết trong lúc hỗ trợ khách | `D-JC` — thoát wildcard + prefix match |
| Audit đọc ghi bất đồng bộ rồi mất | Mất dấu vết truy cập dữ liệu trẻ — đúng thứ `BR-CDC-14` bảo vệ | `D-JD` — ghi đồng bộ, `no-store` |
| Khoá đúng một nửa | Phiên bị thu nhưng entitlement mất, hoặc ngược lại | `D-JE` — ca âm ghép đôi |
| Mỗi endpoint tự chọn trường trẻ | Thêm cột mới là rò cột mới | `D-JF` — projection dùng chung |
| Nút dẫn sang bước chưa làm | 404 giữa lúc hỗ trợ khách | Disabled kèm nhãn bước, cùng mẫu `D-IX` |
| Admin xoá hồ sơ trẻ "cho nhanh" | Vượt quy trình 30 ngày của chủ thể dữ liệu | `BR-CPA-07` + cổng `D-JB` |

## 6. Giả định

1. **P2.1 đã đóng** — layout `manager`, màn 403, nav theo role dùng được.
2. **P0.10 và P0.11 đã đóng** — `refresh_token_version` và `audit_logs` chạy được.
3. **P1.9 và P1.14 đã đóng** — luồng lưu trữ hồ sơ trẻ và luồng xoá tài khoản đã tồn tại.
4. **Chưa có đơn thanh toán và entitlement cấp tay** — hai nút dẫn đi để disabled tới P2.3/P2.4.
5. **Hai role, không hơn** — `content_reviewer` bị chặn hoàn toàn khỏi ba bề mặt này.

## 7. Ngoài phạm vi

- Hàng đợi đơn và duyệt đơn — P2.3.
- Cấp entitlement bằng tay — P2.4.
- Màn hình xem `audit_logs` — P2.10; bước này **ghi** audit, không **đọc**.
- Ghi chú hỗ trợ gắn với User — P4, theo đề xuất chốt của hai spec.
- Khoá tự động theo vi phạm — P4.
- Bất kỳ đường nào để admin thấy tiến độ học của một trẻ — **không bao giờ**.
