# Checklist — Task #46: P2.4 — Cấp quyền tay, catalog quản trị, màn hình gói của User

> Kế hoạch: [`46-p2-4-entitlement-grant-catalog-plan.md`](46-p2-4-entitlement-grant-catalog-plan.md).
> Cấp quyền tay là **đường lạm dụng dễ nhất** trong hệ thống — giới hạn cứng và audit đầy đủ.
> Tuyệt đối: quyền cấp tay **không** lọt vào doanh thu (`D-JO`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P2.3 đã đóng** — transaction, vô hiệu cache, luồng đơn chạy được.
- [ ] Bốn add-on trong `PACKAGE_CATALOG` đã xác định spec sở hữu tính năng.
- [ ] Human approve kế hoạch và năm quyết định D-JM · D-JN · D-JO · D-JP · D-JQ.
- [ ] Đối chiếu `BR-EGR-*` `BR-PCA-*` `BR-SBV-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Hàm dùng chung đổi entitlement

- [ ] Một hàm nhận `{ user_id, package_code, duration_days, source, reason, actor }`.
- [ ] Hàm lo ba việc: ghi `entitlements` · ghi `audit_logs` before/after · xoá khoá cache quyền.
- [ ] `D-JM` cổng: ghi bảng `entitlements` ngoài hàm này → **đỏ**.
- [ ] Approve và reject của P2.3 chuyển sang gọi hàm này.
- [ ] Test cũ của P2.3 xanh **không sửa assertion**.
- [ ] `BR-EGR-07` ca âm: còn 50 ngày + cấp 100 → **150 ngày**.
- [ ] `D-JM` ca âm **cache bật**: thu hồi → request kế tiếp **403**.

### Task 2 — Cấp và thu hồi tay

- [ ] `POST /api/managers/users/{uuid}/entitlements` cần `super_admin`.
- [ ] `BR-EGR-05` ca âm: `content_reviewer` → **403**.
- [ ] `D-JN`: body chỉ nhận `package_code` · `duration_days` · `grant_reason` · `notify_user`.
- [ ] `D-JN` ca âm: gửi kèm `entitlement_key` → **422** (schema từ chối trường lạ).
- [ ] `BR-EGR-02` ca âm: `grant_reason` 10 ký tự → **422**; ngưỡng **20**.
- [ ] `BR-EGR-04` ca âm: `duration_days = 3650` → **422**; khoảng **1–365**.
- [ ] Thời hạn gần trần cần bước xác nhận thêm trên UI.
- [ ] Ca dương: cấp `PKG-addon_lesson_plan` → User có entitlement tương ứng.
- [ ] `BR-EGR-08` ca âm: cấp tay → **không** hàng `payment_orders` nào.
- [ ] `D-JO` cổng: không đường nào ghi `payment_orders` từ luồng cấp tay.
- [ ] `source = 'manual_grant'` ghi vào hàng entitlement.
- [ ] `DELETE /api/managers/entitlements/{id}` cần `{ reason }`; `cancelled` **ngay**.
- [ ] `BR-EGR-03` ca âm: `audit_logs` có `entitlement_granted` và `entitlement_revoked`.
- [ ] Cả hai hàng audit có `reason` không rỗng và có before/after.
- [ ] Thông báo tới User **không** chứa `grant_reason` nội bộ.
- [ ] `PACKAGE_NOT_FOUND` → **404**.

### Task 3 — Bảng entitlement trên chi tiết User

- [ ] Nút "cấp entitlement" (disabled từ P2.2) **bật**, mở form của T2.
- [ ] Bảng §7.2 đủ cột gồm **nguồn**, người cấp, lý do, nút thu hồi.
- [ ] `D-JO` cột nguồn phân biệt rõ `payment_order` với `manual_grant`.
- [ ] `BR-USD-03` giữ nguyên: không mutation ẩn trên trang chi tiết.
- [ ] Thu hồi hỏi lý do; nút gửi disabled tới khi đủ độ dài.
- [ ] `soft_unlock` hiện nhãn tạm + thời hạn, không lẫn với `active`.

### Task 4 — Catalog trong admin

- [ ] `GET /api/managers/packages` cần `super_admin`; `content_reviewer` → **403**.
- [ ] `BR-PCA-01` ca âm: `POST` `PATCH` `DELETE` → không tồn tại hoặc **405**.
- [ ] Cổng quét route xác nhận không có route ghi nào dưới `/api/managers/packages`.
- [ ] `BR-PCA-02` ca âm: hiện **cả** bốn add-on `is_public = false`, gắn nhãn "chưa lên catalog".
- [ ] `D-JP`: mỗi add-on hiện `requires_spec` — tên spec phải `implemented` trước.
- [ ] `D-JP` cổng: gói không công khai thiếu `requires_spec` → **đỏ**.
- [ ] `BR-PCA-03`: mỗi gói hiện số entitlement đang hiệu lực.
- [ ] Gói `retired` hiện mờ kèm số người còn dùng.
- [ ] Doanh thu 30 ngày lọc `source = 'payment_order'`, theo ngày đơn `approved`.
- [ ] Muốn sửa giá → thông báo "đổi qua PR" + đường dẫn file hằng số, **không** form.
- [ ] `GET .../subscribers` trần **100**, phân trang cursor.
- [ ] `BR-PCA-06` ca âm: danh sách subscriber không có tên hay tuổi trẻ.

### Task 5 — Báo cáo cấp tay hàng tháng

- [ ] `BR-EGR-09` job hàng tháng tổng hợp: ai cấp · cho ai · gói gì · bao nhiêu ngày · lý do.
- [ ] Gửi tới email `super_admin`.
- [ ] Job trong registry của P1.5, idempotent — chạy lại cùng tháng không gửi trùng.
- [ ] Không có lần cấp tay nào → **vẫn gửi**, nội dung "không có".

### Task 6 — Màn hình gói của User

- [ ] `GET /api/users/subscription` cần auth.
- [ ] `BR-SBV-06` ca âm: chỉ trả đơn và quyền của **chính** User.
- [ ] Ba khối §7.1 đủ: gói hiện tại · quyền lợi · lịch sử.
- [ ] `BR-SBV-01` ca âm: quyền lợi khớp `package_entitlements` trong DB.
- [ ] `D-JQ` ca âm: `standard` + add-on cấp tay → danh sách chứa key của **cả hai**.
- [ ] Quota hiện **đã dùng / tổng**.
- [ ] `BR-SBV-03` ca âm: 1 `approved` + 2 `rejected` → hiện đủ **3**.
- [ ] `BR-SBV-04` ca âm: `admin_note` nội bộ không xuất hiện nguyên văn.
- [ ] `BR-SBV-02` câu §7.2 về dữ liệu bé giữ nguyên hiện đúng nguyên văn.
- [ ] `soft_unlock` → nhãn "đang chờ xác nhận" + thời hạn tạm.
- [ ] Entitlement cấp tay hiện nguồn "được cấp", **không** hiện lý do nội bộ.
- [ ] `BR-SBV-07` đúng **một** CTA nâng cấp.
- [ ] Không có gói → quyền lợi mặc định + CTA, không trang rỗng.

## Cổng dừng

- [ ] Cấp tay một add-on → quyền mở ngay; thu hồi → **403** ở request kế tiếp, cache bật.
- [ ] Gửi `entitlement_key` cho API cấp → **422**.
- [ ] Cấp tay không tạo `payment_orders`; doanh thu 30 ngày không đổi sau khi cấp tay.
- [ ] Bốn add-on đều hiện `requires_spec` đúng.
- [ ] Không route nào sửa được gói từ UI.
- [ ] User thấy đúng quyền hợp từ hai nguồn, không thấy `admin_note` nội bộ.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm lint:prices && pnpm check:progress` xanh.

---

## Task 7 — Evidence, promote và nợ chuyển tiếp

- [ ] Mỗi `BR-EGR-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-PCA-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-SBV-*` có test tham chiếu mã rule.
- [ ] [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) → `implemented`.
- [ ] [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md) → `implemented`.
- [ ] [`subscription-view.md`](../specs/03-account/subscription-view.md) → `implemented`.
- [ ] Xác nhận nợ P2.3 **đã trả**: ca duyệt nhầm sửa được bằng thu hồi + cấp lại.
- [ ] Tick **P2.4** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] **Báo cáo cấp tay gửi cho ai** — đóng: email của `super_admin` duy nhất ở MVP.
- [ ] **Ngưỡng cảnh báo khi cấp tay vượt N lần/tháng** — chưa ở MVP, cân nhắc P3. Nêu cho chủ vì đây là đường lạm dụng dễ nhất.
- [ ] **Doanh thu tính theo đơn `approved` hay ngày hiệu lực** — cùng một câu với [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md); đóng **một lần**: theo đơn `approved`.
- [ ] **Hoá đơn tải về** — hoãn P4, đi cùng [`pdf-export.md`](../specs/07-addon/pdf-export.md).
