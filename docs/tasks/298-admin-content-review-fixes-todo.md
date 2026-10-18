# Task #298 Todo: Sửa hàng đợi duyệt nội dung và khung xem trước trong admin

Plan: [`298-admin-content-review-fixes-plan.md`](298-admin-content-review-fixes-plan.md).
Spec: [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) `BR-CRQ-01/02/07`, [`live-preview.md`](../specs/06-admin/live-preview.md) `BR-LPV-01`.

---

## S0 — Chốt bulk-reject
- [ ] Hỏi người dùng: gỡ (theo spec) hay giữ (sửa spec trước)

## S1 — Gỡ bulk-reject (`BR-CRQ-01`)
- [ ] Test đỏ: route bulk-reject không còn; UI không có chọn nhiều/nút lô
- [ ] Xoá `review-queue/bulk-reject.post.ts` + test cũ
- [ ] Xoá khối bulk ở `studio/review/index.vue:195-312`
- [ ] `check:test-ratchet`: nếu sàn suite đỏ vì gỡ tính năng, `--force` kèm lý do

## S2 — Màn duyệt theo loại (`BR-CRQ-02`, `BR-CRQ-07`)
- [ ] Test đỏ: lesson gọi teaching view, không gọi `levels/*`
- [ ] Test đỏ: checklist lesson/activity khớp hằng của `transition.post.ts:38-45`
- [ ] Test đỏ: nút duyệt khoá tới khi mở bản xem thử
- [ ] Bảng ánh xạ loại → loader ở `studio/review/[id].vue` (bỏ gọi cứng `:468`)

## S3 — Xem trước tuyệt đối (`BR-LPV-01`)
- [ ] Test đỏ: iframe `src` tuyệt đối theo origin web; `postMessage` không dùng `*`
- [ ] Test đỏ: `/play/preview-sandbox` cho phép `frame-ancestors` origin admin, route khác không
- [ ] Sửa `live-preview-frame.vue:194`, CSP web, nginx site location

## S4 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test admin + web liên quan + `check:test-ratchet` xanh
- [ ] Kiểm tay xem trước level và duyệt lesson
- [ ] Bỏ `open_tasks` + khối "Chưa hoàn thành" ở 2 spec, nâng `status: implemented`
- [ ] Commit lên `main`
