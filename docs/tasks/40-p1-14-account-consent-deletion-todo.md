# Checklist — Task #40: P1.14 — Cài đặt tài khoản, đồng ý pháp lý & xoá tài khoản

> Kế hoạch: [`40-p1-14-account-consent-deletion-plan.md`](40-p1-14-account-consent-deletion-plan.md).
> Thứ tự: cài đặt → đồng ý → xoá (`D-IE`).
> Tuyệt đối: bốn route nhạy cảm đi qua **một** guard reauth (`D-IJ`); phạm vi purge là bảng
> khai ba nhóm có cổng (`D-IF`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.13 đã đóng** — version chính sách và URL vĩnh viễn có thật.
- [ ] **P1.9 đã đóng** — ba trạng thái hồ sơ trẻ và đường khôi phục chạy được.
- [ ] **P1.5 đã đóng** — registry job, bảng retry, `AlertPort` có adapter.
- [ ] Human approve kế hoạch và sáu quyết định D-IE · D-IF · D-IG · D-IH · D-II · D-IJ.
- [ ] Đối chiếu `BR-ACS-*` `BR-CSM-*` `BR-ADL-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Guard reauth dùng chung

- [ ] Danh sách route nhạy cảm khai dạng **dữ liệu**, có chỗ cho hai route SNS của P1.15.
- [ ] Dùng `reauth.ts` và `REAUTH_WINDOW_MINUTES = 5` của P0.3; không định nghĩa lại cửa sổ.
- [ ] `BR-ACS-01` chưa reauth → **428** `REAUTH_REQUIRED`.
- [ ] `BR-ACS-03` đổi email chưa reauth → 428.
- [ ] `BR-ADL-03` xoá tài khoản chưa reauth → 428.
- [ ] `details.methods[]` đúng: mật khẩu · OAuth · TOTP theo dữ liệu thật của tài khoản.
- [ ] Ca âm `D-IJ`: gỡ `requireReauth()` khỏi route trong danh sách → **đỏ**.
- [ ] Ca âm ngược `D-IJ`: `requireReauth()` trên route ngoài danh sách → **đỏ**.
- [ ] Hồi quy: reauth ở thiết bị A không nâng thiết bị B.

### Task 2 — `/me/settings`

- [ ] Bốn nhóm §7.1; nhóm Bảo mật **chưa** có khối SNS và MFA (`BR-ACS-11`).
- [ ] `PATCH /api/users/profile` đổi tên hiển thị, không cần reauth.
- [ ] `BR-ACS-09` `password_hash` NULL → nút **"Đặt mật khẩu"**.
- [ ] `BR-ACS-09` không có ô "mật khẩu hiện tại" trên tài khoản chỉ-SNS.
- [ ] `POST /api/users/password` → **409** `PASSWORD_NOT_SET` khi chưa có mật khẩu.
- [ ] `BR-ACS-02` ca âm: đổi mật khẩu → `refresh_token_version` +1, thiết bị B mất phiên.
- [ ] `BR-ACS-10` ca âm: `PUT` đặt lần đầu → `refresh_token_version` **không đổi**.
- [ ] `BR-ACS-03` đổi email gửi token tới email **mới**, hạn 24h.
- [ ] `BR-ACS-04` email cũ vẫn đăng nhập được khi chưa xác thực; `users.email` chưa đổi.
- [ ] `BR-ACS-05` đổi xong → thông báo tới địa chỉ **cũ**.
- [ ] Email mới đã có người dùng → **409**.
- [ ] `BR-ACS-06` gửi loại giao dịch vào notification-preferences → **422**.
- [ ] `BR-ACS-07` ca âm quét form: không tuổi · giới tính · số điện thoại · địa chỉ.
- [ ] `BR-ACS-08` ca âm: không cài đặt của trẻ trên trang này.

### Task 3 — Xem và đồng ý bản mới

- [ ] `GET /api/users/consents` trả §7.2 + version hiện hành mỗi loại.
- [ ] `D-IH` `summary_vi` bắt buộc cho mọi version sau bản đầu.
- [ ] Ca âm `D-IH`: publish version với `summary_vi` rỗng → cổng **đỏ**.
- [ ] `BR-CSM-05` "Xem thay đổi" hiện `summary_vi`; toàn văn ở chế độ chi tiết (`D-CY`).
- [ ] `BR-CSM-02` ca âm: checkbox chưa tick, nút hoàn tất vô hiệu.
- [ ] `BR-CSM-01` ca âm: đồng ý bản mới → thêm hàng, hàng cũ không đổi.
- [ ] `BR-CSM-07` mỗi hàng có `policy_version` · IP · user agent · thời điểm.
- [ ] `POST /api/users/consents` version cũ → **409** `CONSENT_VERSION_STALE`.
- [ ] `BR-CSM-04` tạo hồ sơ trẻ với đồng ý cũ → **428** `CONSENT_REQUIRED`.
- [ ] `BR-CSM-04` ca âm: mở báo cáo trẻ đã có với đồng ý cũ → vẫn **200**.
- [ ] Ca âm `D-II`: guard gắn lên route đọc → cổng **đỏ**.
- [ ] `BR-CSM-03` version mới → banner ở `/me`.
- [ ] Ba loại đồng ý đúng §7.1; không có đồng ý tiếp thị.

### Task 4 — Rút đồng ý

- [ ] `BR-CSM-06` màn hình rút hiện **đúng số hồ sơ bé** và mốc 30 ngày.
- [ ] `D-IG` rút `child_data` → `archived` qua đúng đường của P1.9, có `purge_at`.
- [ ] Ca âm `D-IG`: quét code — đúng **một** chỗ ghi `status = 'archived'`.
- [ ] `BR-CSM-08` đồng ý lại trong 30 ngày → khôi phục hoàn toàn.
- [ ] `BR-CSM-01` rút = **INSERT** hàng `withdrawn`.
- [ ] Rút `privacy` hoặc `terms` → dẫn sang luồng xoá, không tự xoá.
- [ ] Trẻ không đồng ý và không rút được.
- [ ] Sau khi rút, thu dữ liệu mới của trẻ đó dừng ngay.

### Task 5 — Bảng phạm vi purge

- [ ] Ba nhóm khai dạng dữ liệu: `delete` · `anonymize` · `retain`.
- [ ] `BR-ADL-10` `social_identities` nhóm **`delete`** (dù luồng SNS ở P1.15).
- [ ] `BR-ADL-04` `telemetry_events` nhóm **`anonymize`**.
- [ ] `BR-ADL-05` `audit_logs` · `consent_logs` nhóm **`retain`**.
- [ ] `payment_orders` retain, liên kết tới User ẩn danh.
- [ ] Cổng `D-IF`: bảng trong schema thiếu nhóm → **đỏ**.
- [ ] Ca âm: thêm bảng mới vào migration → cổng đỏ tới khi phân nhóm.

### Task 6 — Xoá tài khoản

- [ ] `BR-ADL-07` trang xoá liệt kê đúng số hồ sơ trẻ và ngày gói còn lại.
- [ ] Trang nói rõ phần được **giữ** theo luật.
- [ ] `BR-ADL-03` reauth bắt buộc; tài khoản chỉ-SNS reauth bằng provider vẫn xoá được.
- [ ] `users.status = deleted` · `purge_at = +30 ngày` · trẻ sang `pending_deletion`.
- [ ] Mọi phiên thu hồi ngay.
- [ ] Email xác nhận kèm **cách huỷ**.
- [ ] `BR-ADL-02` huỷ trong 30 ngày → khôi phục toàn bộ.
- [ ] Đăng nhập trong 30 ngày → **403** kèm đường dẫn huỷ.
- [ ] Huỷ sau khi đã purge → **410**.
- [ ] `BR-ADL-01` `account:purge` mở rộng phạm vi tài khoản, **không thêm job**.
- [ ] Job idempotent; chạy lại không hỏng.
- [ ] `BR-ADL-08` purge **1 lần**, fail → `alert()` ngay.
- [ ] `BR-ADL-09` ca âm: email đã purge đăng ký lại được.
- [ ] `BR-ADL-06` ca âm: không route admin nào đặt `users.status = deleted`.
- [ ] Còn entitlement → cảnh báo mất quyền, không tự hoàn tiền.

## Cổng dừng

- [ ] Bốn route nhạy cảm 428 khi chưa reauth; ca âm hai chiều `D-IJ` xanh.
- [ ] Đặt mật khẩu lần đầu không giết phiên khác.
- [ ] Version mới chặn đúng việc tạo hồ sơ trẻ; báo cáo vẫn đọc được.
- [ ] Rút `child_data` rồi đồng ý lại trong 30 ngày → hồ sơ nguyên trạng.
- [ ] Purge chạy hết ba nhóm; `social_identities` 0 hàng; `telemetry_events` còn hàng `child_uuid` NULL.
- [ ] Email đã purge đăng ký lại được.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 7 — Evidence và promote

- [ ] Mỗi `BR-ACS-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-CSM-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-ADL-*` có test tham chiếu mã rule.
- [ ] [`account-settings.md`](../specs/03-account/account-settings.md) → `implemented`.
- [ ] [`consent-management.md`](../specs/03-account/consent-management.md) → `implemented`.
- [ ] [`account-deletion.md`](../specs/03-account/account-deletion.md) → `implemented`.
- [ ] Nợ sang **P1.15**: khối SNS trong nhóm Bảo mật + hai route vào danh sách reauth.
- [ ] Nợ sang **P2.11**: MFA trong nhóm Bảo mật.
- [ ] Tick **P1.14** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Hoàn tiền phần gói chưa dùng khi xoá — **P2.3**, gộp một câu với chính sách hoàn tiền của trang pháp lý.
- [ ] Ai quyết version chính sách và bao lâu một lần — **P1**, vận hành, không chặn code.
- [ ] Xoá một hồ sơ trẻ riêng lẻ có cần 30 ngày không — **P2**.
