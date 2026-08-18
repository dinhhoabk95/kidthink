# Checklist — Task #19: P0.6 — Vòng đời và phiên bản nội dung

> Kế hoạch: [`19-p0-6-content-lifecycle-versioning-plan.md`](19-p0-6-content-lifecycle-versioning-plan.md).
> Vùng nhạy cảm **nội dung đã published** theo [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md):
> không sửa trực tiếp hàng `published`, không gọi transition publish, không phát hành nội dung.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] Human approve kế hoạch và năm quyết định D-DV · D-DW · D-DX · D-DY · D-EI.
- [x] Đọc §11 hai spec trước tiên (Q3 lifecycle đã đóng D-X T10; Q2 versioning đã đóng D-AE).
- [x] Đối chiếu `BR-CLC-*` `BR-VER-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Xác nhận bảng nội dung còn rỗng trước khi đổi enum.
- [x] Tạo nhánh riêng.

---

## Khối A — chạy ngay

### Task 1 — Enum `in_review` và `content_review_log` ghi cạnh

- [x] Ca âm: test bộ giá trị enum **ĐỎ** vì `submitted`.
- [x] Migration đổi `submitted` → `in_review`, không giữ giá trị cũ.
- [x] Grep repo không còn `submitted` trong ngữ cảnh vòng đời nội dung.
- [x] `content_review_log` đổi sang `from_status` · `to_status` · `reason` · `checklist_snapshot`; bỏ `action`/`review_notes`.
- [x] Ca âm: ghi chuyển `approved → published` vào log — phải biểu diễn được sau migration.
- [x] Cột thật cập nhật ở [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.10a cùng PR.
- [x] `REVOKE UPDATE, DELETE ON content_review_log` giữ nguyên sau migration.
- [x] Thông báo `RAISE EXCEPTION` của bốn trigger nêu cả `BR-CLC-01` lẫn `BR-SCT-05`.
- [x] `pnpm db:migrate` từ database rỗng không lỗi.
- [x] Test chuyển **XANH**.

### Task 2 — Bảng chuyển trạng thái

- [x] `ALLOWED_TRANSITIONS` khai dạng dữ liệu, khớp 36 ô §7.1.
- [x] Test duyệt **mọi** cặp `(from, to)`.
- [x] Ca âm `BR-CLC-02`: `draft → published` trả 409 `INVALID_STATUS_TRANSITION`.
- [x] Trạng thái khởi sinh chỉ nhận `draft` hoặc `published` (seed §4.1); giá trị khác là lỗi.
- [x] `archived → published` đánh dấu chỉ `super_admin`.
- [x] `pnpm --filter @mindkid/shared test -- lifecycle` xanh.

### Task 3 — Checklist publish §7.3

- [x] Hàm thuần trả `{ ok, missing[] }`, **không** nhận tham số nguồn gọi.
- [x] Phủ ràng buộc chung + riêng `game_levels` `lessons` `curricula` `worksheets`.
- [x] Ca âm `BR-CLC-09`: thiếu đáp án đúng → `missing` chứa `no_correct_answer`, status không đổi.
- [x] Thiếu bất kỳ mục nào → 422, không publish một phần.
- [x] `pnpm --filter @mindkid/shared test -- publish-checklist` xanh.

### Task 4 — Phân loại field bump version

- [x] Danh sách bump (§7.2) và không bump (§7.3) khai theo từng thực thể.
- [x] `requiresVersionBump(entityType, changedFields)` hoạt động đúng.
- [x] Ca âm `BR-VER-07`: sửa `description` không bump.
- [x] Ca âm `BR-VER-08`: sửa `content_pack` bắt buộc bump; sửa trực tiếp trả 409.
- [x] Field lạ là **lỗi**, không mặc định "không bump".
- [x] `pnpm --filter @mindkid/shared test -- versioning` xanh.

## Cổng dừng A

- [x] Enum khớp §7.1, không còn `submitted`.
- [x] 36 ô bảng chuyển đều có test.
- [x] Checklist trả `missing[]` đúng cho mọi thực thể.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [x] P0.3 đã đóng **trước** khi mở khối B.

---

## Khối B — sau khi P0.3 đóng

### Task 5 — Quyền chuyển theo role

- [x] `content_reviewer` chuyển đúng năm chuyển §2.
- [x] `super_admin` thêm `archived → published`.
- [x] Ca âm: `content_reviewer` rollback → 403 `INSUFFICIENT_ROLE`.
- [x] `BR-CLC-05`: `reason` < 10 ký tự khi reject → 422, status không đổi.
- [x] `BR-CLC-03`: ghi cả người tạo và người duyệt.
- [x] `expected_version` sai → 409 `VERSION_CONFLICT`.

### Task 6 — Publish, archive, rollback

- [x] Publish N+1 và archive N trong **một** transaction (`BR-CLC-07`).
- [x] Ca âm DB: hai bản cùng `published` bị partial unique index từ chối.
- [x] Rollback publish lại bản `archived` M, không sinh version mới (`BR-VER-06`).
- [x] `content_version` chỉ tăng, không tái dùng (`BR-VER-01`).
- [x] Mỗi chuyển ghi `content_review_log` + `audit_logs` (`BR-CLC-10`).

### Task 7 — Hai cổng chặn đường vòng

- [x] Cổng `BR-CLC-04`: mọi lời gọi transition mang `manager_id` thật.
- [x] Ca âm: fixture job gọi transition làm cổng **ĐỎ**.
- [x] `BR-CLC-08`: xoá cứng chỉ khi chưa từng `published` và không có telemetry; ngược lại 409 `CONTENT_IN_USE` kèm danh sách.
- [x] `BR-CLC-11`: đường seed dùng đúng hàm checklist Task 3.
- [x] Ca âm: batch thiếu learning objective → rollback toàn batch, không ghi hàng nào.

### Task 8 — Mốc đổi version cho báo cáo

- [x] Hàm trả mốc đổi `content_version` trong chuỗi phiên chơi (`BR-VER-05`).
- [x] Không giao UI.
- [x] Ca âm `BR-VER-04`: publish version 4 giữa phiên → kết quả ghi `content_version = 3`.

## Cổng dừng B

- [x] Không đường nào publish bỏ qua checklist.
- [x] Không tiến trình máy nào chuyển được trạng thái.
- [x] Hai bản cùng `published` bị chặn ở cả service lẫn DB.
- [x] Human review diff vùng nội dung published.

---

## Task 9 — Evidence và promote

- [x] Mỗi `BR-CLC-*` `BR-VER-*` có test tham chiếu mã rule.
- [x] [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) · [`content-versioning.md`](../specs/00-foundation/content-versioning.md) sang `implemented` chỉ khi đủ evidence.
- [x] Tick **P0.6** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

## Cổng dừng cuối

- [x] Không kéo studio (P2) hay seeder (P1.10) lên sớm.
- [x] Không hàng `published` nào bị sửa trong quá trình làm.
- [x] Working tree không mất thay đổi ngoài phạm vi.
- [x] Sẵn sàng lập plan P0.8b.
