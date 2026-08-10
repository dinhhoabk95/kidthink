# Kế hoạch — Task #46: P2.4 — Cấp quyền tay, catalog quản trị, màn hình gói của User

> Viết 2026-08-10. Bước sở hữu: **P2.4** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) ·
> [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md) ·
> [`subscription-view.md`](../specs/03-account/subscription-view.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P2.3 dựng đường tiền chính. Bước này dựng **ba đường phụ quanh nó**, và mỗi đường có một lý do
tồn tại khác nhau:

1. **Cấp quyền tay** — đường thoát cho ca ngoại lệ: chuyển khoản không đối chiếu được, bồi
   thường sự cố, tài khoản đối tác. Nó cũng là **lối thoát duy nhất cho ca duyệt nhầm** mà
   [`45-p2-3-payment-flow-plan.md`](45-p2-3-payment-flow-plan.md) ghi nợ sang. Và nó là **đường
   lạm dụng dễ nhất trong hệ thống** — một form mở quyền không qua tiền.
2. **Catalog trong admin** — chỉ đọc. Manager cần biết gói nào mở entitlement nào để trả lời
   hỗ trợ và để cấp tay đúng.
3. **Màn hình gói của User** — trả lời "tôi đang có gì, tới khi nào, đã trả bao nhiêu". Phần
   lớn câu hỏi về thanh toán là câu hỏi về **trạng thái**, không phải về tiền.

Sợi chỉ xuyên cả ba: **quyền lợi phải sinh từ dữ liệu, và quyền cấp tay phải phân biệt được
với quyền đã trả tiền**. Trộn hai sổ đó là làm hỏng mọi con số doanh thu về sau.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `ENTITLEMENT-MODEL` | P0.5 | `entitlements.source`, `BR-ENT-02` hợp quyền, `BR-ENT-06` cache |
| `PACKAGE-CATALOG` | P0.5 | `PACKAGE_CATALOG`, `package_entitlements`, quota |
| `AUDIT-LOG` | P0.11 | before/after, lý do bắt buộc |
| `ADMIN-AUTH` | P0.11b | `super_admin` |
| `PAYMENT-FLOW` | P2.3 | transaction + invalidate cache đã có sẵn để dùng lại |
| Admin shell | P2.1 | layout `manager`; nút "cấp entitlement" đang disabled |
| `ACCESS-GATING` | P1.3 | hàm resolve quyền — chỗ duy nhất hiểu `soft_unlock` |
| `JOB-QUEUE` | P1.5 | job báo cáo cấp tay hàng tháng |

## 1. Đo được

### 1.1 Đã có

Bảng `entitlements` với cột `source` từ P0.7; `PACKAGE_CATALOG` gồm cả add-on `is_public =
false`; hàm resolve quyền của P1.3; transaction duyệt và cơ chế vô hiệu cache của P2.3 (`D-JI`);
shell admin; luồng đơn đầy đủ.

### 1.2 Chưa có

Form cấp/thu hồi tay; bảng entitlement trên chi tiết User; màn `/packages` và danh sách
subscriber theo gói; màn `/me/subscription`; job báo cáo cấp tay hàng tháng; và trường khai
**điều kiện lên catalog** của bốn add-on.

### 1.3 Đã chốt, không mở lại

`BR-PKG-07` package là Lớp 1, đổi qua PR không qua ô input · `BR-ENT-02` nhiều gói thì **hợp**
quyền lợi · `D-JI` vô hiệu cache ngay khi quyền đổi · `BR-PAP-05` cộng dồn từ `expires_at` cũ ·
add-on lên catalog **cùng lúc** với tính năng của nó, không trước.

## 2. Quyết định

**D-JM — Cấp và thu hồi tay dùng **lại** transaction và cơ chế vô hiệu cache của P2.3.**
`BR-EGR-06` đòi thu hồi có hiệu lực ngay, không chờ cache — đúng câu mà `D-JI` đã giải cho
nhánh reject. Viết bản thứ hai nghĩa là có hai chỗ phải nhớ vô hiệu cache, và chỗ thứ hai sẽ là
chỗ quên. Xử: một hàm dùng chung nhận "thay đổi entitlement của User X" và lo cả ba việc —
ghi DB, ghi audit, xoá khoá cache; approve, reject, grant, revoke đều gọi nó. Cổng: xuất hiện
lời gọi ghi bảng `entitlements` ngoài hàm đó → **đỏ**. Ca âm chạy với **cache bật**: thu hồi →
request kế tiếp tới nội dung trả phí trả **403**.

**D-JN — "Cấp theo package" là ràng buộc **hình dạng API**, không phải kiểm tra runtime.**
`BR-EGR-01` cấm cấp key lẻ vì nó tạo tổ hợp quyền không có trong catalog và không ai test.
Nếu API nhận cả `package_code` lẫn `entitlement_keys` rồi chặn cái sau bằng `if`, thì cái `if`
đó là thứ sẽ bị nới ra trong một PR gấp. Xử: body **chỉ có** `package_code`; không có tham số
nào nhận key; test gửi kèm `entitlement_key` → **422** vì schema từ chối trường lạ. Đường mở
add-on chưa bán vẫn là đường này — cấp `PKG-addon_*` theo package, không phải cấp key của nó.

**D-JO — Hai sổ tách nhau ở **cột `source`**, và mọi truy vấn doanh thu lọc theo nó.**
`BR-EGR-08` cấm cấp tay tạo `payment_orders` giả. Nhưng cấm tạo đơn giả chưa đủ: nếu báo cáo
doanh thu đếm entitlement thay vì đếm đơn, quyền cấp tay vẫn hoá thành doanh thu. Xử: `source`
là cột **không null** với bốn giá trị (`payment_order` · `manual_grant` · `promo` · `default`);
mọi truy vấn doanh thu — thẻ dashboard P2.3, doanh thu 30 ngày của gói, báo cáo — lọc
`source = 'payment_order'`; cột "nguồn" hiện trên cả bảng entitlement của User lẫn danh sách
subscriber. Cổng: mở rộng cổng quét của P2.2 — không đường nào ghi `payment_orders` từ luồng
cấp tay.

**D-JP — Add-on chưa bán khai **điều kiện lên catalog** thành dữ liệu.** `BR-PCA-04` bắt màn
hình nêu spec nào phải `implemented` trước khi một add-on lên catalog. Viết chuỗi đó vào
template là để nó lệch với sự thật ngay lần đầu roadmap đổi. Xử: mỗi gói `is_public = false`
trong `PACKAGE_CATALOG` mang trường `requires_spec` trỏ đúng spec sở hữu tính năng; màn hình
đọc chính trường đó. Cổng: gói không công khai mà thiếu `requires_spec` → **đỏ**. Đây cũng là
thứ chặn ca hỏng thật: cấp tay một add-on mà tính năng của nó chưa tồn tại.

**D-JQ — Quyền lợi hiện ra ở ba bề mặt đi qua **một** hàm hợp entitlement.** Trang giá (P2.3),
màn hình gói của User, và bảng quyền trong admin đều phải trả lời "User này đang mở những gì".
`BR-SBV-05` nói nhiều gói thì **hợp**, không ghi đè — một quy tắc dễ cài đúng ở chỗ này và sai
ở chỗ kia. Xử: hàm resolve của P1.3 là nguồn duy nhất; ba bề mặt gọi nó và chỉ khác nhau ở cách
trình bày. Ca âm: User có `standard` + một add-on cấp tay → danh sách quyền chứa key của **cả
hai**, ở cả ba bề mặt.

## 3. Đồ thị

```
T1 hàm dùng chung: đổi entitlement + audit + vô hiệu cache (D-JM)
      ├──→ T2 POST cấp tay + DELETE thu hồi (D-JN, D-JO)
      │         └──→ T3 bảng entitlement trên chi tiết User (trả nợ P2.2)
      │                   └──→ T5 job báo cáo cấp tay hàng tháng
      └──→ T4 /packages chỉ đọc + subscriber theo gói (D-JP)
  T6 /me/subscription: ba khối, hợp quyền lợi, lịch sử đơn (D-JQ)
                              ── Cổng dừng ──
                                    T7 evidence, promote 3 spec, nợ
```

## 4. Task

### Task 1 — Hàm dùng chung đổi entitlement

**Tiêu chí nghiệm thu**
- [ ] Một hàm nhận `{ user_id, package_code, duration_days, source, reason, actor }` và lo ba việc: ghi `entitlements`, ghi `audit_logs` before/after, xoá khoá cache quyền của User đó.
- [ ] `D-JM` cổng: mọi lời gọi ghi bảng `entitlements` đi qua hàm này; ghi trực tiếp ở nơi khác → **đỏ**.
- [ ] Approve và reject của P2.3 chuyển sang gọi hàm này; test cũ của P2.3 xanh **không sửa assertion**.
- [ ] `BR-EGR-07` + `BR-PAP-05`: cộng dồn bằng `max(now, expires_at cũ) + duration_days`; ca âm — còn 50 ngày, cấp thêm 100 → **150 ngày**.
- [ ] Ca âm `D-JM` **cache bật**: thu hồi → request kế tiếp trả **403**.

**Kiểm chứng**
- [ ] `pnpm test -- entitlement-mutator` xanh · `pnpm test -- payment-approval` vẫn xanh.

**Phụ thuộc:** P2.3 · **Cỡ:** M

### Task 2 — Cấp và thu hồi tay

**Tiêu chí nghiệm thu**
- [ ] `POST /api/managers/users/{uuid}/entitlements` cần `super_admin`; `content_reviewer` → **403** (`BR-EGR-05`).
- [ ] `D-JN`: body **chỉ** nhận `package_code` · `duration_days` · `grant_reason` · `notify_user`; gửi kèm `entitlement_key` → **422** vì schema từ chối trường lạ.
- [ ] `BR-EGR-02` ca âm: `grant_reason` 10 ký tự → **422**; ngưỡng là **20** ký tự.
- [ ] `BR-EGR-04` ca âm: `duration_days = 3650` → **422**; khoảng hợp lệ **1–365**.
- [ ] Thời hạn > 365 ngày không tồn tại; thời hạn gần trần cần bước xác nhận thêm trên UI (§5).
- [ ] Cấp được gói `is_public = false`: ca âm dương — cấp `PKG-addon_lesson_plan` → User có entitlement tương ứng.
- [ ] `BR-EGR-08` + `D-JO` ca âm: cấp tay → **không** hàng `payment_orders` nào được tạo; cổng quét chặn mọi đường ghi bảng đó từ luồng này.
- [ ] `source = 'manual_grant'` ghi vào hàng entitlement.
- [ ] `DELETE /api/managers/entitlements/{id}` cần `{ reason }`; đổi `cancelled` **ngay**.
- [ ] `BR-EGR-03` ca âm: cấp rồi thu hồi → `audit_logs` có `entitlement_granted` và `entitlement_revoked`, cả hai có `reason` không rỗng và có before/after.
- [ ] `notify_user` mặc định bật; thông báo tới User **không** chứa `grant_reason` nội bộ.
- [ ] `PACKAGE_NOT_FOUND` → **404**.

**Kiểm chứng**
- [ ] `pnpm test -- entitlement-grant` xanh, assertion tham chiếu `BR-EGR-01`…`BR-EGR-08`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Bảng entitlement trên chi tiết User

**Tiêu chí nghiệm thu**
- [ ] Nút "cấp entitlement" trên [`user-detail.md`](../specs/06-admin/user-detail.md) (disabled từ P2.2) **bật**, mở form của T2.
- [ ] Bảng §7.2 đủ cột: key · **nguồn** · trạng thái · `granted_at` · `expires_at` · người cấp · lý do · nút thu hồi.
- [ ] `D-JO`: cột nguồn phân biệt rõ `payment_order` với `manual_grant`.
- [ ] `BR-USD-03` vẫn giữ: thao tác mở ở bề mặt riêng có audit riêng, không mutation ẩn trên trang chi tiết.
- [ ] Thu hồi hỏi lý do; nút gửi disabled tới khi đủ độ dài.
- [ ] Entitlement `soft_unlock` hiện nhãn tạm và thời hạn, không lẫn với `active`.

**Kiểm chứng**
- [ ] `pnpm test:e2e -- admin-entitlements` xanh.

**Phụ thuộc:** T2 · **Cỡ:** S

### Task 4 — Catalog trong admin

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/packages` cần `super_admin`; `content_reviewer` → **403** (`BR-PCA-05`).
- [ ] `BR-PCA-01` ca âm: gọi `POST` `PATCH` `DELETE` tới route package admin → không tồn tại hoặc **405**; cổng quét route xác nhận.
- [ ] `BR-PCA-02` ca âm: `/packages` hiện **cả** gói `is_public = false` — bốn add-on đều thấy, gắn nhãn "chưa lên catalog".
- [ ] `D-JP` + `BR-PCA-04`: mỗi add-on hiện **tên spec phải `implemented` trước**, đọc từ `requires_spec` trong catalog; cổng — gói không công khai thiếu trường này → **đỏ**.
- [ ] `BR-PCA-03`: mỗi gói hiện **số entitlement đang hiệu lực**; gói `retired` hiện mờ kèm số người còn dùng.
- [ ] Doanh thu 30 ngày lọc `source = 'payment_order'` theo `D-JO`, tính theo **ngày đơn `approved`**.
- [ ] Muốn sửa giá → thông báo "đổi qua PR" kèm đường dẫn file hằng số, **không** có form.
- [ ] `GET /api/managers/packages/{code}/subscribers` trần **100**, phân trang cursor.
- [ ] `BR-PCA-06` ca âm: danh sách subscriber **không** có tên hay tuổi trẻ nào.

**Kiểm chứng**
- [ ] `pnpm test -- package-catalog-admin` xanh, assertion tham chiếu `BR-PCA-01` `BR-PCA-04` `BR-PCA-06`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 5 — Báo cáo cấp tay hàng tháng

**Tiêu chí nghiệm thu**
- [ ] `BR-EGR-09`: job hàng tháng tổng hợp mọi lần cấp tay — ai cấp, cho ai, gói gì, bao nhiêu ngày, lý do.
- [ ] Gửi tới email của `super_admin` (đóng §11 Q1 theo đề xuất: ở MVP chỉ có một người).
- [ ] Job đăng ký vào registry của P1.5, idempotent — chạy lại cùng tháng không gửi trùng.
- [ ] Không có lần cấp tay nào trong tháng → **vẫn gửi**, nội dung "không có" — báo cáo im lặng là báo cáo không ai biết đã hỏng.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/worker test -- manual-grant-report` xanh.

**Phụ thuộc:** T2 · P1.5 · **Cỡ:** S

### Task 6 — Màn hình gói của User

**Tiêu chí nghiệm thu**
- [ ] `GET /api/users/subscription` cần `requireUserAuth()`; `BR-SBV-06` ca âm: chỉ trả đơn và quyền của **chính** User.
- [ ] Ba khối §7.1 đủ: gói hiện tại · quyền lợi · lịch sử.
- [ ] `D-JQ` + `BR-SBV-01` ca âm: danh sách quyền lợi khớp `package_entitlements` trong DB, sinh từ hàm resolve dùng chung.
- [ ] `D-JQ` + `BR-SBV-05` ca âm: User có `standard` + một add-on cấp tay → danh sách chứa key của **cả hai**.
- [ ] Quota hiện **đã dùng / tổng**.
- [ ] `BR-SBV-03` ca âm: 1 đơn `approved` + 2 `rejected` → lịch sử hiện đủ **3**.
- [ ] `BR-SBV-04` ca âm: `admin_note` nội bộ **không** xuất hiện nguyên văn; chỉ lý do rút gọn — cùng ràng buộc đã cài ở P2.3 T3.
- [ ] `BR-SBV-02`: câu §7.2 về dữ liệu bé giữ nguyên khi hết hạn hiện đúng nguyên văn.
- [ ] Gói `soft_unlock` → nhãn "đang chờ xác nhận" kèm thời hạn tạm; không lẫn với `active`.
- [ ] Entitlement cấp tay hiện nguồn "được cấp"; **không** hiện lý do nội bộ.
- [ ] `BR-SBV-07`: đúng **một** CTA nâng cấp.
- [ ] Không có gói → hiện quyền lợi mặc định + CTA, không hiện trang rỗng.

**Kiểm chứng**
- [ ] `pnpm test -- subscription-view` xanh · `pnpm test:e2e -- my-subscription` xanh.

**Phụ thuộc:** T1 · P2.3 · **Cỡ:** M

### Cổng dừng

- [ ] Cấp tay một add-on cho một User → quyền mở ngay; thu hồi → **403** ở request kế tiếp, cache bật.
- [ ] Gửi `entitlement_key` cho API cấp → **422**.
- [ ] Cấp tay **không** tạo hàng `payment_orders` nào; doanh thu 30 ngày không đổi sau khi cấp tay.
- [ ] Bốn add-on đều hiện `requires_spec` đúng.
- [ ] Không route nào sửa được gói từ UI.
- [ ] User thấy đúng quyền hợp từ hai nguồn, và không thấy `admin_note` nội bộ.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm lint:prices && pnpm check:progress` xanh.

### Task 7 — Evidence, promote và nợ chuyển tiếp

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-EGR-*` `BR-PCA-*` `BR-SBV-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented`.
- [ ] §11 Q1 của [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) (báo cáo cấp tay gửi cho ai) — đóng theo đề xuất: email của `super_admin` duy nhất.
- [ ] §11 Q2 của [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) (ngưỡng cảnh báo khi cấp tay quá N lần/tháng) — đóng: chưa ở MVP; ghi nợ cân nhắc ở P3. Nêu cho chủ vì đây là đường lạm dụng dễ nhất.
- [ ] §11 Q1 của [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md) là **cùng một câu** với §11 Q1 của [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) (doanh thu tính theo đơn `approved` hay ngày hiệu lực) — đóng **một lần**: theo đơn `approved`.
- [ ] §11 Q1 của [`subscription-view.md`](../specs/03-account/subscription-view.md) (hoá đơn tải về) — đóng: hoãn P4, đi cùng [`pdf-export.md`](../specs/07-addon/pdf-export.md).
- [ ] Nợ đã trả: lối thoát cho ca duyệt nhầm mà P2.3 ghi sang **đã có** — thu hồi và cấp lại bằng tay.
- [ ] Tick **P2.4** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Hai bản cài vô hiệu cache | Bản thứ hai là bản quên; quyền đã thu hồi vẫn dùng được | `D-JM` — một hàm dùng chung, cổng quét |
| Cấp key lẻ qua tham số phụ | Tổ hợp quyền không có trong catalog, không ai test | `D-JN` — schema không có chỗ nhận key |
| Quyền cấp tay lọt vào doanh thu | Mọi con số tài chính sai, và sai âm thầm | `D-JO` — lọc theo `source`, cổng cấm ghi đơn giả |
| Cấp add-on mà tính năng chưa tồn tại | Khách trả tiền cho thứ mở ra là trang trắng | `D-JP` — `requires_spec` hiện trên màn hình |
| Ba bề mặt tự hợp quyền lợi | Trang giá nói một đằng, màn hình gói nói một nẻo | `D-JQ` — một hàm resolve |
| Cấp tay không giới hạn | Mất kiểm soát doanh thu | `BR-EGR-04` 365 ngày + `BR-EGR-09` báo cáo tháng |
| Báo cáo tháng im lặng khi hỏng | Không ai biết mất giám sát | T5 — không có gì vẫn gửi |
| `admin_note` nội bộ lọt sang User | Ghi chú xử lý nội bộ ra ngoài | `BR-SBV-04` — ca âm ở cả P2.3 và bước này |

## 6. Giả định

1. **P2.3 đã đóng** — transaction, vô hiệu cache, và luồng đơn chạy được.
2. **Một `super_admin`** — báo cáo tháng gửi về chính người đó; không cần danh sách người nhận.
3. **Bốn add-on chưa bán** — cấp tay là đường duy nhất mở chúng ở MVP.
4. **Giá có thể vẫn là `PENDING_PRICE_VND`** — bước này không bị chặn bởi giá; chỉ trang giá công khai của P2.3 bị chặn.
5. **Quota đã có nguồn đo** từ P0.5; nếu một quota chưa đo được thì hiện `pending_source` theo mẫu `D-IX`, không hiện số bịa.

## 7. Ngoài phạm vi

- Sửa giá hoặc quyền lợi của gói từ UI — **không bao giờ**; đổi qua PR.
- Thao tác "huỷ duyệt" một đơn — không tồn tại; sửa bằng thu hồi + cấp lại ở bước này.
- Hoá đơn PDF tải về — P4.
- Cảnh báo ngưỡng cấp tay — P3.
- Hoàn tiền — P5.
- Trang giá công khai — P2.3.
