# Checklist — Task #46: P2.4 — Cấp quyền tay, catalog quản trị, màn hình gói của User

> Kế hoạch: [`46-p2-4-entitlement-grant-catalog-plan.md`](46-p2-4-entitlement-grant-catalog-plan.md).
> Cấp quyền tay là **đường lạm dụng dễ nhất** trong hệ thống — giới hạn cứng và audit đầy đủ.
> Tuyệt đối: quyền cấp tay **không** lọt vào doanh thu (`D-JO`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P2.3 đã đóng** — transaction, vô hiệu cache, luồng đơn chạy được.
- [x] Bốn add-on trong `PACKAGE_CATALOG` đã xác định spec sở hữu tính năng.
- [x] Human approve kế hoạch và năm quyết định D-JM · D-JN · D-JO · D-JP · D-JQ.
- [x] Đối chiếu `BR-EGR-*` `BR-PCA-*` `BR-SBV-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Hàm dùng chung đổi entitlement

- [x] Một hàm nhận `{ user_id, package_code, duration_days, source, reason, actor }`.
- [x] Hàm lo ba việc: ghi `entitlements` · ghi `audit_logs` before/after · xoá khoá cache quyền.
- [x] `D-JM` cổng: ghi bảng `entitlements` ngoài hàm này → **đỏ**.
- [x] Approve và reject của P2.3 chuyển sang gọi hàm này.
- [x] Test cũ của P2.3 xanh **không sửa assertion**.
- [x] `BR-EGR-07` ca âm: còn 50 ngày + cấp 100 → **150 ngày**.
- [x] `D-JM` ca âm **cache bật**: thu hồi → request kế tiếp **403**.

### Task 2 — Cấp và thu hồi tay

- [x] `POST /api/managers/users/{uuid}/entitlements` cần `super_admin`.
- [x] `BR-EGR-05` ca âm: `content_reviewer` → **403**.
- [x] `D-JN`: body chỉ nhận `package_code` · `duration_days` · `grant_reason` · `notify_user`.
- [x] `D-JN` ca âm: gửi kèm `entitlement_key` → **422** (schema từ chối trường lạ).
- [x] `BR-EGR-02` ca âm: `grant_reason` 10 ký tự → **422**; ngưỡng **20**.
- [x] `BR-EGR-04` ca âm: `duration_days = 3650` → **422**; khoảng **1–365**.
- [x] Thời hạn gần trần cần bước xác nhận thêm trên UI.
- [x] Ca dương: cấp `PKG-addon_lesson_plan` → User có entitlement tương ứng.
- [x] `BR-EGR-08` ca âm: cấp tay → **không** hàng `payment_orders` nào.
- [x] `D-JO` cổng: không đường nào ghi `payment_orders` từ luồng cấp tay.
- [x] `source = 'manual_grant'` ghi vào hàng entitlement.
- [x] `DELETE /api/managers/entitlements/{id}` cần `{ reason }`; `cancelled` **ngay**.
- [x] `BR-EGR-03` ca âm: `audit_logs` có `entitlement_granted` và `entitlement_revoked`.
- [x] Cả hai hàng audit có `reason` không rỗng và có before/after.
- [x] Thông báo tới User **không** chứa `grant_reason` nội bộ.
- [x] `PACKAGE_NOT_FOUND` → **404**.

### Task 3 — Bảng entitlement trên chi tiết User

- [x] Nút "cấp entitlement" (disabled từ P2.2) **bật**, mở form của T2.
- [x] Bảng §7.2 đủ cột gồm **nguồn**, người cấp, lý do, nút thu hồi.
- [x] `D-JO` cột nguồn phân biệt rõ `payment_order` với `manual_grant`.
- [x] `BR-USD-03` giữ nguyên: không mutation ẩn trên trang chi tiết.
- [x] Thu hồi hỏi lý do; nút gửi disabled tới khi đủ độ dài.
- [x] `soft_unlock` hiện nhãn tạm + thời hạn, không lẫn với `active`.

### Task 4 — Catalog trong admin

- [x] `GET /api/managers/packages` cần `super_admin`; `content_reviewer` → **403**.
- [x] `BR-PCA-01` ca âm: `POST` `PATCH` `DELETE` → không tồn tại hoặc **405**.
- [x] Cổng quét route xác nhận không có route ghi nào dưới `/api/managers/packages`.
- [x] `BR-PCA-02` ca âm: hiện **cả** bốn add-on `is_public = false`, gắn nhãn "chưa lên catalog".
- [x] `D-JP`: mỗi add-on hiện `requires_spec` — tên spec phải `implemented` trước.
- [x] `D-JP` cổng: gói không công khai thiếu `requires_spec` → **đỏ**.
- [x] `BR-PCA-03`: mỗi gói hiện số entitlement đang hiệu lực.
- [x] Gói `retired` hiện mờ kèm số người còn dùng.
- [x] Doanh thu 30 ngày lọc `source = 'payment_order'`, theo ngày đơn `approved`.
- [x] Muốn sửa giá → thông báo "đổi qua PR" + đường dẫn file hằng số, **không** form.
- [x] `GET .../subscribers` trần **100**, phân trang cursor.
- [x] `BR-PCA-06` ca âm: danh sách subscriber không có tên hay tuổi trẻ.

### Task 5 — Báo cáo cấp tay hàng tháng

- [x] `BR-EGR-09` job hàng tháng tổng hợp: ai cấp · cho ai · gói gì · bao nhiêu ngày · lý do.
- [x] Gửi tới email `super_admin`.
- [x] Job trong registry của P1.5, idempotent — chạy lại cùng tháng không gửi trùng.
- [x] Không có lần cấp tay nào → **vẫn gửi**, nội dung "không có".

### Task 6 — Màn hình gói của User

- [x] `GET /api/users/subscription` cần auth.
- [x] `BR-SBV-06` ca âm: chỉ trả đơn và quyền của **chính** User.
- [x] Ba khối §7.1 đủ: gói hiện tại · quyền lợi · lịch sử.
- [x] `BR-SBV-01` ca âm: quyền lợi khớp `package_entitlements` trong DB.
- [x] `D-JQ` ca âm: `standard` + add-on cấp tay → danh sách chứa key của **cả hai**.
- [x] Quota hiện **đã dùng / tổng**.
- [x] `BR-SBV-03` ca âm: 1 `approved` + 2 `rejected` → hiện đủ **3**.
- [x] `BR-SBV-04` ca âm: `admin_note` nội bộ không xuất hiện nguyên văn.
- [x] `BR-SBV-02` câu §7.2 về dữ liệu bé giữ nguyên hiện đúng nguyên văn.
- [x] `soft_unlock` → nhãn "đang chờ xác nhận" + thời hạn tạm.
- [x] Entitlement cấp tay hiện nguồn "được cấp", **không** hiện lý do nội bộ.
- [x] `BR-SBV-07` đúng **một** CTA nâng cấp.
- [x] Không có gói → quyền lợi mặc định + CTA, không trang rỗng.

## Cổng dừng

- [x] Cấp tay một add-on → quyền mở ngay; thu hồi → **403** ở request kế tiếp, cache bật.
- [x] Gửi `entitlement_key` cho API cấp → **422**.
- [x] Cấp tay không tạo `payment_orders`; doanh thu 30 ngày không đổi sau khi cấp tay.
- [x] Bốn add-on đều hiện `requires_spec` đúng.
- [x] Không route nào sửa được gói từ UI.
- [x] User thấy đúng quyền hợp từ hai nguồn, không thấy `admin_note` nội bộ.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm lint:prices && pnpm check:progress` xanh.

---

## Task 7 — Evidence, promote và nợ chuyển tiếp

- [x] Mỗi `BR-EGR-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-PCA-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-SBV-*` có test tham chiếu mã rule.
- [x] [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) → `implemented`.
- [x] [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md) → `implemented`.
- [x] [`subscription-view.md`](../specs/03-account/subscription-view.md) → `implemented`.
- [x] Xác nhận nợ P2.3 **đã trả**: ca duyệt nhầm sửa được bằng thu hồi + cấp lại.
- [x] Tick **P2.4** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] **Báo cáo cấp tay gửi cho ai** — đóng: email của `super_admin` duy nhất ở MVP.
- [x] **Ngưỡng cảnh báo khi cấp tay vượt N lần/tháng** — chưa ở MVP, cân nhắc P3. Nêu cho chủ vì đây là đường lạm dụng dễ nhất.
- [x] **Doanh thu tính theo đơn `approved` hay ngày hiệu lực** — cùng một câu với [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md); đóng **một lần**: theo đơn `approved`.
- [x] **Hoá đơn tải về** — hoãn P4, đi cùng [`pdf-export.md`](../specs/07-addon/pdf-export.md).
