# Checklist — Task #43: P2.1 — Admin shell và bảng điều khiển vận hành

> Kế hoạch: [`43-p2-1-admin-shell-plan.md`](43-p2-1-admin-shell-plan.md).
> Bước **đầu** của P2 và là khung cho chín bước admin còn lại.
> Tuyệt đối: shell là một layout (`D-IW`); thẻ chưa có nguồn **không** hiện `0` (`D-IX`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **Cổng ra P1 đã đạt** — 43 spec P1 `implemented`.
- [x] Rollup của [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) có dữ liệu thật.
- [x] Danh sách alert đang mở của P1.16 gọi được.
- [x] Human approve kế hoạch và năm quyết định D-IW · D-IX · D-IY · D-IZ · D-JA.
- [x] Đối chiếu `BR-DSH-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Admin shell

- [x] `apps/admin/layouts/manager.vue`: nav dọc · header có danh tính + đăng xuất · vùng nội dung · breadcrumb.
- [x] Menu dựng từ **một** khai báo có `roles`.
- [x] `content_reviewer` không thấy mục tiền · User · hệ thống.
- [x] Component dùng chung: đang tải · rỗng · lỗi · 403.
- [x] `D-IW` cổng: mọi trang `apps/admin/pages/` dùng layout `manager`.
- [x] Ca âm `D-IW`: trang tự định nghĩa nav → **đỏ**.
- [x] Token lấy từ [`design-system-contract.md`](../specs/08-quality/design-system-contract.md); không thêm token mới.
- [x] Bàn phím đi hết nav; focus nhìn thấy được.
- [x] Hết phiên → về đăng nhập kèm `redirect_to`, không trang trắng.

### Task 2 — Re-host trang P1 (trả nợ P1.14 và P1.16)

- [x] Cây taxonomy chạy dưới layout `manager`, vào được từ nav.
- [x] Chi tiết skill chạy dưới layout `manager`.
- [x] `/legal-consents` chạy dưới layout `manager`; nav chỉ `super_admin`.
- [x] Chrome tối thiểu của `D-IV` bị **xoá**; không còn hai đường vào.
- [x] Chrome tối thiểu legal consent bị xoá; recent reauth/audit test giữ nguyên.
- [x] Ca âm P1.16 còn xanh: không route ghi dưới `/api/managers/taxonomy`.
- [x] `as_of` còn cạnh số; ngưỡng "đủ" vẫn **3**.
- [x] Nút "soạn level" vẫn không dẫn tới 404.
- [x] `pnpm test -- taxonomy-browser` xanh **không sửa assertion**.

### Task 3 — Registry thẻ KPI và ngưỡng

- [x] `packages/config/src/dashboard-cards.ts` khai đủ 16 thẻ §7.
- [x] Mỗi thẻ có `id` · `group` · `source` · `threshold` · `href` · `roles`.
- [x] Ngưỡng §7.1: đơn chờ duyệt **> 20 hoặc cũ nhất > 24h**.
- [x] Ngưỡng §7.1: nội dung chờ duyệt **> 50**.
- [x] Ngưỡng §7.1: alert đang mở **≥ 1**.
- [x] `D-IX` `pending_source`: đơn thanh toán + doanh thu → **P2.3**.
- [x] `D-IX` `pending_source`: nội dung chờ duyệt → **P2.8**.
- [x] `D-IX` `pending_source`: lesson published → **P3.1**.
- [x] `D-IX` `pending_source`: tuần curriculum thiếu hoạt động → **P3.3**.
- [x] `D-IX` `pending_source`: chi phí LLM → **P4**.
- [x] `BR-DSH-02` ca âm: thẻ thiếu `href` → **đỏ**.
- [x] `D-IX` ca âm: `pending_source` mà API trả số → **đỏ**.
- [x] Ba thẻ phản hồi biên soạn §7.3 xếp **trên** ba thẻ đếm.
- [x] Grep: không số ngưỡng nào nằm ngoài registry.

### Task 4 — `GET /api/managers/dashboard`

- [x] `requireManagerAuth()`; không phiên → **401**.
- [x] `D-IY` ca âm: `content_reviewer` → chỉ khoá `as_of` và `content`.
- [x] `D-IY` ca âm: response của `content_reviewer` không có `growth` · `system` · thẻ tiền.
- [x] `D-IZ` cổng: mã nguồn endpoint không chứa `telemetry_events` · `play_events` · `play_sessions`.
- [x] `BR-DSH-04` ca âm: rollup 02:00, gọi 09:00 → `as_of` = **02:00**.
- [x] `BR-DSH-05` ca âm: response không có tên trẻ · `child_uuid` · mastery · lịch sử chơi.
- [x] Thẻ `pending_source` trả `{ status, owner_step }`, **không** trả `0`.
- [x] Thẻ alert đang mở lấy từ nguồn P1.16, không đếm lại từ log.
- [x] Hiệu năng: 50 lần gọi → **P95 < 500 ms**.

### Task 5 — Màn hình dashboard

- [x] Bốn nhóm đúng thứ tự: việc cần làm · tăng trưởng · nội dung · hệ thống.
- [x] `BR-DSH-02` mỗi thẻ "việc cần làm" có link tới trang xử lý.
- [x] Link tới bước chưa làm hiện disabled kèm nhãn bước — **không** 404.
- [x] `BR-DSH-01` + `D-JA` cổng: không `POST` `PATCH` `PUT` `DELETE` phát từ dashboard.
- [x] Thẻ vượt ngưỡng đổi màu **và** có nhãn chữ; màu không phải kênh duy nhất.
- [x] Chưa có dữ liệu → "chưa có dữ liệu"; **cấm** hiện `0`.
- [x] `as_of` hiện một chỗ ở đầu trang.
- [x] `D-JA` thẻ tăng trưởng có mũi tên so kỳ trước; **không** biểu đồ.
- [x] Đăng nhập → landing là dashboard.

## Cổng dừng

- [x] Manager đăng nhập → dashboard → bấm thẻ → tới đúng trang xử lý.
- [x] `content_reviewer`: response API không chứa khoá tiền; nav không có mục tiền.
- [x] Không truy vấn nào của dashboard chạm bảng thô.
- [x] Không lời gọi mutation nào phát ra từ dashboard.
- [x] Trang taxonomy và legal consent chạy trong shell; test hành vi cũ xanh, assertion không đổi.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence, promote và nợ chuyển tiếp

- [x] Mỗi `BR-DSH-*` có test tham chiếu mã rule.
- [x] [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) → `implemented`.
- [x] Nợ sang **P2.3**: bật nguồn hai thẻ tiền.
- [x] Nợ sang **P2.8**: bật thẻ nội dung chờ duyệt.
- [x] Nợ sang **P2.6**: đổi nút soạn của trang taxonomy sang studio.
- [x] Nợ sang **P3.1** và **P3.3**: bật thẻ lesson và tuần curriculum.
- [x] Tick **P2.1** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] **Doanh thu tháng** tính theo ngày đơn `approved` (đề xuất của spec, khớp `BR-PAY-03`) — nêu cho chủ xác nhận; **không chặn** P2.1 vì thẻ đang `pending_source: P2.3`.
- [x] **Biểu đồ xu hướng** — đóng theo `D-JA`: MVP dùng chỉ số + mũi tên, biểu đồ sang P4.
