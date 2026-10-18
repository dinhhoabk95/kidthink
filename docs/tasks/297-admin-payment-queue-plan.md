# Kế hoạch Task #297: Trang hàng đợi và duyệt thanh toán trong admin (Admin Payment Queue)

Contract: `docs/specs/06-admin/payment-queue.md` §3 (`BR-PQU-01..08`), `docs/specs/06-admin/payment-approval.md` §3 (`BR-PAP-01..09`, trọng tâm `BR-PAP-08` checklist đối chiếu), `docs/specs/06-admin/admin-dashboard.md` (`BR-DSH-02`), `docs/specs/00-foundation/app-runtime-boundary.md` (`BR-ARB-04`, admin là static SPA — gate ở `apps/admin/tests/gates/`).

> **Ràng buộc cây làm việc.** `apps/web/server/api/managers/orders/[uuid]/approve.post.ts` và `apps/web/server/api/managers/auth/reauth.post.ts` đang có thay đổi dở của người khác. Task này chỉ **gọi** các API đó từ admin; nếu cần sửa API, kiểm `git status --short`, phối hợp, không ghi đè, không `git checkout`/`stash`.

---

## 1. Bối cảnh & bằng chứng gap

- `apps/admin/app/pages/` **không có** `payments/`, nhưng `apps/admin/app/composables/nav-config.ts` (mục `id: "payments"`, `href: "/payments"`) và `apps/admin/app/pages/index.vue:148` (thẻ "việc cần làm") đều link tới `/payments` → 404 (`BR-PQU-01`, `BR-DSH-02`).
- Không file nào trong `apps/admin/app` gọi `/api/managers/orders*`.
- API đủ và có test 9/9 BR: `apps/web/server/api/managers/orders/index.get.ts:30` (oldest trước), `[uuid]/index.get.ts:64-126` (cảnh báo trùng `bank_txn_ref`), `[uuid]/proof-url.get.ts:38` (signed URL + audit `proof_viewed`), `[uuid]/claim.post.ts`, `[uuid]/approve.post.ts:35-62` (checklist, `bonus_days`), `[uuid]/reject.post.ts`.
- Thiếu màn `/payments/{uuid}/decide` → Manager không duyệt được đơn từ admin; checklist đối chiếu `BR-PAP-08` không có UI.

## 2. Thiết kế

- **Đường dẫn trang theo §3 của spec:** `apps/admin/app/pages/payments/index.vue` (danh sách) và `apps/admin/app/pages/payments/[uuid]/decide.vue` (quyết định). Nếu chọn path khác thì sửa spec trước.
- **Danh sách** (`payment-queue`): gọi `GET /api/managers/orders` qua `use-api-client.ts` (absolute `NUXT_PUBLIC_API_BASE_URL`, `credentials: include`, CSRF trong memory); cũ nhất trước; **không** có nút duyệt trên danh sách; nhãn cảnh báo trùng ref; xem proof qua signed URL (`proof-url`) — không nhúng URL lâu dài.
- **Quyết định** (`payment-approval`): `claim` khi mở; checklist đối chiếu bắt buộc tick đủ trước khi bật nút duyệt (`BR-PAP-08`); approve với `bonus_days` ≤ 30; reject với `admin_note` ≥ 10 ký tự; reauth khi API đòi; hiện lỗi theo `code` chuẩn (`{ code, message, details? }`), không tự dựng thông điệp từ status.
- **Ranh giới runtime:** chỉ import client-side; không import `@mindkid/db`/server package (gate `BR-ARB-04`).
- Bề mặt người lớn: có `dark:`, không hex literal, chuỗi tiếng Việt.

## 3. Lát cắt (Slices)

- **S0 — Phối hợp.** `git status --short`; đọc diff `approve.post.ts`/`reauth.post.ts` để chốt hợp đồng body/response.
- **S1 — Trang danh sách `/payments`.** Test trước (`apps/admin/tests/unit/payments-pages.test.ts`): render danh sách từ mock `GET /api/managers/orders` theo thứ tự cũ nhất trước; không có nút duyệt; hiện cảnh báo trùng ref; nav + thẻ dashboard trỏ route tồn tại (`BR-DSH-02`, `BR-PQU-01`).
- **S2 — Xem chứng từ.** Test trước: bấm "xem chứng từ" gọi `proof-url` và mở signed URL; không lưu URL vào state lâu dài.
- **S3 — Màn quyết định + checklist.** Test trước: mở màn gọi `claim`; nút duyệt khoá tới khi tick đủ checklist (`BR-PAP-08`); approve gửi `bonus_days` ≤ 30; reject chặn `admin_note` < 10 ký tự; 409 (đơn đã được người khác xử lý) hiện đúng thông báo.
- **S4 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/admin test` (gồm `tests/gates` `BR-ARB-04`); `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/payment-flow-e2e.test.ts`.
  - Build static admin `rtk proxy pnpm --filter @mindkid/admin build` thành công; kiểm tay luồng duyệt một đơn trên môi trường dev.
  - Bỏ `open_tasks` + khối "Chưa hoàn thành" ở `payment-queue.md`, `payment-approval.md`, `admin-dashboard.md`; nâng `status: implemented`.
  - Commit lên `main`.
