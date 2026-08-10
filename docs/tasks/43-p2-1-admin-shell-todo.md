# Checklist — Task #43: P2.1 — Admin shell và bảng điều khiển vận hành

> Kế hoạch: [`43-p2-1-admin-shell-plan.md`](43-p2-1-admin-shell-plan.md).
> Bước **đầu** của P2 và là khung cho chín bước admin còn lại.
> Tuyệt đối: shell là một layout (`D-IW`); thẻ chưa có nguồn **không** hiện `0` (`D-IX`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **Cổng ra P1 đã đạt** — 43 spec P1 `implemented`.
- [ ] Rollup của [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) có dữ liệu thật.
- [ ] Danh sách alert đang mở của P1.16 gọi được.
- [ ] Human approve kế hoạch và năm quyết định D-IW · D-IX · D-IY · D-IZ · D-JA.
- [ ] Đối chiếu `BR-DSH-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Admin shell

- [ ] `apps/admin/layouts/manager.vue`: nav dọc · header có danh tính + đăng xuất · vùng nội dung · breadcrumb.
- [ ] Menu dựng từ **một** khai báo có `roles`.
- [ ] `content_reviewer` không thấy mục tiền · User · hệ thống.
- [ ] Component dùng chung: đang tải · rỗng · lỗi · 403.
- [ ] `D-IW` cổng: mọi trang `apps/admin/pages/` dùng layout `manager`.
- [ ] Ca âm `D-IW`: trang tự định nghĩa nav → **đỏ**.
- [ ] Token lấy từ [`design-system-contract.md`](../specs/08-quality/design-system-contract.md); không thêm token mới.
- [ ] Bàn phím đi hết nav; focus nhìn thấy được.
- [ ] Hết phiên → về đăng nhập kèm `redirect_to`, không trang trắng.

### Task 2 — Re-host trang taxonomy (trả nợ P1.16)

- [ ] Cây taxonomy chạy dưới layout `manager`, vào được từ nav.
- [ ] Chi tiết skill chạy dưới layout `manager`.
- [ ] Chrome tối thiểu của `D-IV` bị **xoá**; không còn hai đường vào.
- [ ] Ca âm P1.16 còn xanh: không route ghi dưới `/api/managers/taxonomy`.
- [ ] `as_of` còn cạnh số; ngưỡng "đủ" vẫn **3**.
- [ ] Nút "soạn level" vẫn không dẫn tới 404.
- [ ] `pnpm test -- taxonomy-browser` xanh **không sửa assertion**.

### Task 3 — Registry thẻ KPI và ngưỡng

- [ ] `packages/config/src/dashboard-cards.ts` khai đủ 16 thẻ §7.
- [ ] Mỗi thẻ có `id` · `group` · `source` · `threshold` · `href` · `roles`.
- [ ] Ngưỡng §7.1: đơn chờ duyệt **> 20 hoặc cũ nhất > 24h**.
- [ ] Ngưỡng §7.1: nội dung chờ duyệt **> 50**.
- [ ] Ngưỡng §7.1: alert đang mở **≥ 1**.
- [ ] `D-IX` `pending_source`: đơn thanh toán + doanh thu → **P2.3**.
- [ ] `D-IX` `pending_source`: nội dung chờ duyệt → **P2.8**.
- [ ] `D-IX` `pending_source`: lesson published → **P3.1**.
- [ ] `D-IX` `pending_source`: tuần curriculum thiếu hoạt động → **P3.3**.
- [ ] `D-IX` `pending_source`: chi phí LLM → **P4**.
- [ ] `BR-DSH-02` ca âm: thẻ thiếu `href` → **đỏ**.
- [ ] `D-IX` ca âm: `pending_source` mà API trả số → **đỏ**.
- [ ] Ba thẻ phản hồi biên soạn §7.3 xếp **trên** ba thẻ đếm.
- [ ] Grep: không số ngưỡng nào nằm ngoài registry.

### Task 4 — `GET /api/managers/dashboard`

- [ ] `requireManagerAuth()`; không phiên → **401**.
- [ ] `D-IY` ca âm: `content_reviewer` → chỉ khoá `as_of` và `content`.
- [ ] `D-IY` ca âm: response của `content_reviewer` không có `growth` · `system` · thẻ tiền.
- [ ] `D-IZ` cổng: mã nguồn endpoint không chứa `telemetry_events` · `play_events` · `play_sessions`.
- [ ] `BR-DSH-04` ca âm: rollup 02:00, gọi 09:00 → `as_of` = **02:00**.
- [ ] `BR-DSH-05` ca âm: response không có tên trẻ · `child_uuid` · mastery · lịch sử chơi.
- [ ] Thẻ `pending_source` trả `{ status, owner_step }`, **không** trả `0`.
- [ ] Thẻ alert đang mở lấy từ nguồn P1.16, không đếm lại từ log.
- [ ] Hiệu năng: 50 lần gọi → **P95 < 500 ms**.

### Task 5 — Màn hình dashboard

- [ ] Bốn nhóm đúng thứ tự: việc cần làm · tăng trưởng · nội dung · hệ thống.
- [ ] `BR-DSH-02` mỗi thẻ "việc cần làm" có link tới trang xử lý.
- [ ] Link tới bước chưa làm hiện disabled kèm nhãn bước — **không** 404.
- [ ] `BR-DSH-01` + `D-JA` cổng: không `POST` `PATCH` `PUT` `DELETE` phát từ dashboard.
- [ ] Thẻ vượt ngưỡng đổi màu **và** có nhãn chữ; màu không phải kênh duy nhất.
- [ ] Chưa có dữ liệu → "chưa có dữ liệu"; **cấm** hiện `0`.
- [ ] `as_of` hiện một chỗ ở đầu trang.
- [ ] `D-JA` thẻ tăng trưởng có mũi tên so kỳ trước; **không** biểu đồ.
- [ ] Đăng nhập → landing là dashboard.

## Cổng dừng

- [ ] Manager đăng nhập → dashboard → bấm thẻ → tới đúng trang xử lý.
- [ ] `content_reviewer`: response API không chứa khoá tiền; nav không có mục tiền.
- [ ] Không truy vấn nào của dashboard chạm bảng thô.
- [ ] Không lời gọi mutation nào phát ra từ dashboard.
- [ ] Trang taxonomy chạy trong shell; test cũ xanh, assertion không đổi.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence, promote và nợ chuyển tiếp

- [ ] Mỗi `BR-DSH-*` có test tham chiếu mã rule.
- [ ] [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) → `implemented`.
- [ ] Nợ sang **P2.3**: bật nguồn hai thẻ tiền.
- [ ] Nợ sang **P2.8**: bật thẻ nội dung chờ duyệt.
- [ ] Nợ sang **P2.6**: đổi nút soạn của trang taxonomy sang studio.
- [ ] Nợ sang **P3.1** và **P3.3**: bật thẻ lesson và tuần curriculum.
- [ ] Tick **P2.1** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] **Doanh thu tháng** tính theo ngày đơn `approved` (đề xuất của spec, khớp `BR-PAY-03`) — nêu cho chủ xác nhận; **không chặn** P2.1 vì thẻ đang `pending_source: P2.3`.
- [ ] **Biểu đồ xu hướng** — đóng theo `D-JA`: MVP dùng chỉ số + mũi tên, biểu đồ sang P4.
