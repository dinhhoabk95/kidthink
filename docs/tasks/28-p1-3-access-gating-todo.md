# Checklist — Task #28: P1.3 — Gating trước nội dung

> Kế hoạch: [`28-p1-3-access-gating-plan.md`](28-p1-3-access-gating-plan.md).
> **Cổng doanh thu** — bug ở đây không sửa ngược được. Human security reviewer duyệt diff.
> Bước này phải đóng **trước** mọi seeder nội dung.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P0.5 đã đóng** — bốn bậc, `allowedTiers()`, bảng entitlement `implemented`.
- [x] **P1.2 đã đóng** — có level mẫu thật để chặn.
- [x] Human approve kế hoạch và năm quyết định D-FM · D-FN · D-FO · D-FP · D-FQ.
- [x] Đối chiếu `BR-GAT-*` và `BR-LAD-04/05/08/09` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Ma trận thành dữ liệu

- [x] Enum năm trạng thái: `guest` · `user_no_child` · `user_child_no_pkg` · `user_standard` · `user_premium`.
- [x] Bảng 5×4 khai dạng dữ liệu, giá trị là mã HTTP kỳ vọng.
- [x] Thiếu ô → lỗi biên dịch hoặc test đỏ.
- [x] `upgrade_package_codes` đọc từ `package_entitlements`, không hằng số.

### Task 2 — `assertContentAccess()`, bảy bước

- [x] Chữ ký đúng §8, trả `{ child_id, is_preview, age_mismatch }`.
- [x] Bước 1 — không tồn tại / không `published` → **404**.
- [x] Bước 2 — tier hiệu lực lấy `max(tier)` theo `BR-LAD-05`.
- [x] Bước 3 — dựng ngữ cảnh người gọi (guest | user).
- [x] Bước 4 — route cần trẻ mà chưa chọn → **428**, **trước** kiểm bậc.
- [x] Bước 5 — `allowedTiers(caller)` không phủ tier → **403** + metadata gate.
- [x] Bước 6 — hết quota → **402**.
- [x] Bước 7 — tuổi lệch → **200** + `age_mismatch`, không chặn.
- [x] Ca âm thứ tự: 404 trước 403.
- [x] Ca âm thứ tự: 403 trước 428.
- [x] Ca âm thứ tự: 428 trước 402.
- [x] Level `archived` → 404.
- [x] Entitlement hết hạn giữa phiên → phiên đang mở chạy tiếp, yêu cầu mới bị chặn (`BR-LAD-08`).
- [x] Mã lỗi khớp registry: `NOT_FOUND` · `NO_ACTIVE_CHILD` · `TIER_LOCKED` · `DAILY_PLAY_CAP_REACHED`.

### Task 3 — Ownership trẻ

- [x] `BR-GAT-04` kiểm `active_child_id` bằng **DB query**.
- [x] Ca âm: cookie User A trỏ trẻ User B → **404**.
- [x] `BR-GAT-07` ca âm: curl không cookie → mọi bậc ≠ `free` trả 403.
- [x] Ca âm token hết hạn → 401, không mở thêm gì.
- [x] Ca âm token audience Manager gọi route User → không đi vòng được.

### Task 4 — Chặn thì chặn sạch

- [x] `BR-GAT-03` 403 strip `content_pack` và `difficulty_params`.
- [x] 403 mang `required_entitlement` + `upgrade_package_codes`.
- [x] Ca âm: 403 không rò tên level, mô tả, hay trường nội dung khác.
- [x] 404 không phân biệt "không tồn tại" với "chưa published".

### Task 5 — Preview của Manager

- [x] Preview bỏ qua bước 5–6, đặt `is_preview = true`.
- [x] `BR-GAT-08` preview không ghi `mastery_state`.
- [x] `BR-GAT-08` preview không đếm KPI nội dung.
- [x] `play_sessions.is_preview` là cột thật, tách ở tầng dữ liệu.
- [x] Ca âm: preview 10 lần → `mastery_state` không đổi, KPI không tăng.
- [x] User gọi route preview → 403.

### Task 6 — Cổng "không gating là lỗi"

- [x] Danh sách handler trả nội dung khai dạng dữ liệu.
- [x] Cổng: handler trả `content_pack`/`difficulty_params` mà không gọi gating → **đỏ**.
- [x] Ca âm: thêm handler giả không gating → cổng đỏ.
- [x] `BR-GAT-01` ca âm: không nhánh kiểm bậc nào ở client.

### Task 7 — Ma trận và bao hàm

- [x] `BR-GAT-05` **20/20 ô** có test, sinh từ bảng.
- [x] Báo cáo test in ra số ô đã phủ; lệch bảng là đỏ.
- [x] `BR-GAT-06` property test bao hàm bằng `fast-check` trên mọi tổ hợp entitlement.
- [x] Ô 428 kiểm riêng: chưa chọn trẻ + bậc ≥ `login` → 428, không 403.

## Cổng dừng

- [x] 20/20 ô xanh; property test bao hàm xanh.
- [x] Cổng gating đã **đỏ** được trên fixture handler thiếu kiểm.
- [x] 403 không mang nội dung; 404 không rò tồn tại.
- [x] Preview không chạm `mastery_state` và KPI.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [x] Human security reviewer duyệt diff.

---

## Task 8 — Evidence và promote

- [x] Mỗi `BR-GAT-*` có test tham chiếu mã rule.
- [x] [`access-gating.md`](../specs/04-play/access-gating.md) → `implemented`.
- [x] Tick **P1.3** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] Q1 gộp `login` vào `standard` — `D-FN` giữ bốn bậc; chủ xác nhận **trước P1.10**, sau đó là migration.
- [x] Q2 `age_mismatch` hiện ở đâu — chuyển P1.8/P1.12, ràng buộc: cảnh báo nhắm **người lớn**.
