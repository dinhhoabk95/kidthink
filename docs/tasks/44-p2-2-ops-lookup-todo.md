# Checklist — Task #44: P2.2 — Tra cứu vận hành: User, chi tiết, hồ sơ trẻ

> Kế hoạch: [`44-p2-2-ops-lookup-plan.md`](44-p2-2-ops-lookup-plan.md).
> Task 1 (cổng quét) chạy **trước** mọi code khác — cổng viết sau code luôn xanh ở lần đầu.
> Tuyệt đối: không đường nào để admin thấy tiến độ học của một trẻ.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P2.1 đã đóng** — layout `manager`, màn 403, nav theo role.
- [x] `refresh_token_version` (P0.10) và `audit_logs` (P0.11) dùng được.
- [x] Luồng lưu trữ hồ sơ trẻ (P1.9) và luồng xoá tài khoản (P1.14) đã tồn tại.
- [x] Human approve kế hoạch và năm quyết định D-JB · D-JC · D-JD · D-JE · D-JF.
- [x] Đối chiếu `BR-USM-*` `BR-USD-*` `BR-CPA-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Mở rộng cổng quét route (làm TRƯỚC)

- [x] Hàm quét thêm vào `apps/web/tests/gates/child-data-compliance.ts`, chạy trong `pnpm check`.
- [x] `BR-USM-07`: không route admin nào `DELETE` hàng `users`.
- [x] `BR-USM-08`: không handler admin nào ghi `password_hash`.
- [x] `BR-CPA-01`: không route trả `child_profiles` thiếu ràng buộc `user_id`.
- [x] `BR-CPA-06`: không `PATCH` `child_profiles` ngoài `archive`.
- [x] `BR-CPA-07`: không `DELETE` `child_profiles`.
- [x] `BR-CPA-08`: không schema query admin nào nhận tên trẻ.
- [x] Ca âm 1/6: fixture route `DELETE users` → cổng **đỏ**.
- [x] Ca âm 2/6: fixture ghi `password_hash` → cổng **đỏ**.
- [x] Ca âm 3/6: fixture liệt kê `child_profiles` toàn hệ thống → cổng **đỏ**.
- [x] Ca âm 4/6: fixture `PATCH child_profiles` → cổng **đỏ**.
- [x] Ca âm 5/6: fixture `DELETE child_profiles` → cổng **đỏ**.
- [x] Ca âm 6/6: fixture query nhận tên trẻ → cổng **đỏ**.

### Task 2 — Danh sách User

- [x] `GET /api/managers/users` cần `super_admin`; `content_reviewer` → **403** `INSUFFICIENT_ROLE`.
- [x] Zod phủ đủ §7.1 gồm `cursor` và `sort`.
- [x] `BR-USM-01` trần **100** ép trong schema; `limit=500` → ≤100 item.
- [x] `D-JC` ca âm: `q` chứa `'` và `%` → **200**, không lỗi SQL.
- [x] `D-JC`: pattern đã thoát `%` `_` `\`; dùng prefix match.
- [x] Phân trang **cursor**, không `OFFSET`.
- [x] Cột đúng §7.2.
- [x] `BR-USM-06` ca âm: response có **số lượng** hồ sơ trẻ, không tên/tuổi/tiến độ.
- [x] Tìm không ra → gợi ý tìm bằng email đầy đủ.
- [x] User `deleted` hiện chỉ đọc.

### Task 3 — Ba thao tác vận hành

- [x] `POST .../suspend` và `.../reactivate` nhận `{ reason }`.
- [x] `BR-USM-03`: `reason` < 10 ký tự → **422** `ADMIN_NOTE_REQUIRED`.
- [x] Ca âm: `reason` rỗng → User **vẫn active**.
- [x] Mỗi thao tác ghi `audit_logs` với `reason` · `actor_id` · `target_id`.
- [x] `D-JE` ca âm ghép đôi, **một** test: khoá → 2 thiết bị mất phiên ở request kế tiếp.
- [x] `D-JE` vế hai, cùng test: hàng `entitlements` **không đổi**.
- [x] `D-JE` vế ba: mở khoá → dùng lại ngay, không cấp lại quyền.
- [x] Thu hồi bằng `refresh_token_version` +1, không xoá hàng session.
- [x] `POST .../send-password-reset` gửi link; response **không** chứa token.
- [x] Thao tác trên User `deleted` → **409**.

### Task 4 — Chi tiết User

- [x] Trả bốn nhóm §7.1: tài khoản · hồ sơ trẻ · quyền · thanh toán.
- [x] `D-JF` nhóm hồ sơ trẻ đi qua projection dùng chung — **đúng 4 trường**.
- [x] `BR-USD-01` ca âm: không `mastery` · `p_learn` · `telemetry` · `play_session`.
- [x] `BR-USD-04` ca âm: không `password_hash` · refresh token · MFA secret.
- [x] `BR-USD-06` ca âm: 1 `approved` + 2 `rejected` → hiện **3** đơn.
- [x] Chưa có đơn → hiện "chưa có", **không** hiện 0.
- [x] `D-JD` ca âm: mở hai lần → **hai** hàng `audit_logs`.
- [x] `D-JD` ca âm ngược: User không có hồ sơ trẻ → **không** hàng audit nào.
- [x] `D-JD`: `Cache-Control: no-store`.
- [x] `BR-USD-03` cổng: không mutation trực tiếp từ trang chi tiết.
- [x] Chưa xác thực email → có nút gửi lại.
- [x] User `deleted` → hiện `purge_at`, chỉ đọc.
- [x] UUID không tồn tại → **404**; `content_reviewer` → **403**.

### Task 5 — Lưu trữ hồ sơ trẻ từ admin

- [x] `POST /api/managers/children/{uuid}/archive` cần `super_admin`.
- [x] Thiếu `reason` → **422** `ADMIN_NOTE_REQUIRED`.
- [x] Dùng lại luồng của [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md); **không** viết luồng thứ hai.
- [x] `BR-CPA-07`: đúng **một** thao tác, không có thao tác thứ hai.
- [x] Hồ sơ `pending_deletion` → hiện `purge_at`, thao tác trả **409**.
- [x] Yêu cầu xoá vẫn đi qua [`account-deletion.md`](../specs/03-account/account-deletion.md).
- [x] Ghi `audit_logs` với `reason`.

### Task 6 — Hai màn hình trong shell

- [x] `/users` và `/users/{uuid}` dùng layout `manager`.
- [x] Nav có mục "Người dùng" chỉ với `super_admin`.
- [x] Bộ lọc §7.1 hiện đủ; xoá lọc về mặc định được.
- [x] Bốn nhóm có nhãn rõ; nhóm rỗng hiện "chưa có".
- [x] Nút sang entitlement/đơn hiện **disabled kèm nhãn bước**, không 404.
- [x] Hộp thoại khoá bắt nhập lý do; nút gửi disabled tới khi đủ 10 ký tự.
- [x] `content_reviewer` gõ thẳng `/users` → màn **403** của shell.

## Cổng dừng

- [x] Sáu ca âm `D-JB` đều làm cổng đỏ.
- [x] `q = "%"` không quét toàn bảng; `limit=500` trả ≤100.
- [x] Khoá: mất phiên **và** entitlement nguyên vẹn — một test, hai vế.
- [x] Mở chi tiết User có trẻ hai lần → hai hàng audit; không có trẻ → không hàng nào.
- [x] Không response admin nào chứa trường trẻ ngoài bốn trường projection.
- [x] `content_reviewer` bị **403** ở cả ba bề mặt.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 7 — Evidence, promote và nợ chuyển tiếp

- [x] Mỗi `BR-USM-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-USD-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-CPA-*` có test tham chiếu mã rule.
- [x] [`user-management.md`](../specs/06-admin/user-management.md) → `implemented`.
- [x] [`user-detail.md`](../specs/06-admin/user-detail.md) → `implemented`.
- [x] [`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md) → `implemented`.
- [x] Nợ sang **P2.3**: bật nút "xem đơn".
- [x] Nợ sang **P2.4**: bật nút "cấp entitlement".
- [x] Tick **P2.2** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] **Ghi chú hỗ trợ gắn với User** — cùng một câu ở hai spec, đóng **một lần**: hoãn P4, MVP dùng `audit_logs`.
- [x] **Khoá tự động sau N vi phạm** — đóng theo đề xuất: MVP luôn thủ công bởi `super_admin`.
- [x] **Phụ huynh cấp quyền xem tạm một phiên chơi** — MVP **không** hỗ trợ kể cả khi phụ huynh đồng ý; hoãn P4. Nêu cho chủ vì câu này sẽ quay lại từ kênh hỗ trợ.
