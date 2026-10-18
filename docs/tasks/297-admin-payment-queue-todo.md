# Task #297 Todo: Trang hàng đợi và duyệt thanh toán trong admin

Plan: [`297-admin-payment-queue-plan.md`](297-admin-payment-queue-plan.md).
Spec: [`payment-queue.md`](../specs/06-admin/payment-queue.md) `BR-PQU-*`, [`payment-approval.md`](../specs/06-admin/payment-approval.md) `BR-PAP-*`, [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) `BR-DSH-02`.

---

## S0 — Phối hợp
- [ ] `git status --short`; đọc diff `approve.post.ts`, `reauth.post.ts`; chốt hợp đồng, không ghi đè

## S1 — `/payments`
- [ ] Test đỏ: danh sách cũ nhất trước, không có nút duyệt, cảnh báo trùng ref
- [ ] Test đỏ: nav + thẻ dashboard trỏ route tồn tại
- [ ] Tạo `apps/admin/app/pages/payments/index.vue` qua `use-api-client.ts`

## S2 — Chứng từ
- [ ] Test đỏ: xem chứng từ gọi `proof-url`, mở signed URL
- [ ] Cài nút xem chứng từ

## S3 — Màn quyết định
- [ ] Test đỏ: mở màn gọi `claim`
- [ ] Test đỏ: nút duyệt khoá tới khi đủ checklist (`BR-PAP-08`)
- [ ] Test đỏ: `bonus_days` ≤ 30; `admin_note` ≥ 10 khi từ chối; 409 hiện đúng
- [ ] Tạo `apps/admin/app/pages/payments/[uuid]/decide.vue`

## S4 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] `rtk proxy pnpm --filter @mindkid/admin test` (gồm gate `BR-ARB-04`) + test payment web xanh
- [ ] Build admin static thành công; kiểm tay duyệt một đơn
- [ ] Bỏ `open_tasks` + khối "Chưa hoàn thành" ở 3 spec, nâng `status: implemented`
- [ ] Commit lên `main`
