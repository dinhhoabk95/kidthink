# Kế hoạch Task #298: Sửa hàng đợi duyệt nội dung và khung xem trước trong admin (Admin Content Review Fixes)

Contract: `docs/specs/06-admin/content-review-queue.md` (`BR-CRQ-01`, `BR-CRQ-02`, `BR-CRQ-07`), `docs/specs/06-admin/live-preview.md` (`BR-LPV-01`), `docs/specs/06-admin/game-level-studio.md` (`BR-STU-04`), `docs/specs/00-foundation/app-runtime-boundary.md` (admin static SPA trên `admin.{domain}`, API ở `{domain}`).

---

## 1. Bối cảnh & bằng chứng gap

| Gap | Bằng chứng | BR |
| --- | --- | --- |
| Từ chối theo lô | `apps/web/server/api/managers/content/review-queue/bulk-reject.post.ts` + khối bulk ở `apps/admin/app/pages/studio/review/index.vue:195-312`; spec không có route này | `BR-CRQ-01` (duyệt/từ chối từng mục) |
| Màn duyệt luôn tải game level | `apps/admin/app/pages/studio/review/[id].vue:468` luôn gọi `levels/${id}/latest` kể cả khi mục là lesson/activity → mở nhầm level trùng id | `BR-CRQ-02` |
| Không có gate "bản xem thử cho người dạy" | `review/[id].vue:373` chỉ khoá nút tới khi có preview token + checklist game level | `BR-CRQ-02` |
| Checklist sai loại → 422 | UI dùng 6 nhóm checklist của game level; server đòi `LESSON_ACTIVITY_CHECKLIST_GROUPS` (`apps/web/server/api/managers/content/[type]/[id]/transition.post.ts:38-45`) | `BR-CRQ-07` |
| Iframe xem trước không chạy engine | `apps/admin/app/components/studio/live-preview-frame.vue:194` dùng URL tương đối `/play/preview-sandbox`; trang chỉ có ở `apps/web/app/pages/play/preview-sandbox.vue` → iframe tải lại SPA admin | `BR-LPV-01`, `BR-STU-04` |
| Web chặn nhúng từ admin | `apps/web/nuxt.config.ts:51` `frame-ancestors 'self'`; `infra/nginx/mindkid-site.conf.tmpl:21` `X-Frame-Options SAMEORIGIN` | điều kiện để sửa `BR-LPV-01` |

## 2. Thiết kế

- **Gỡ bulk-reject (`BR-CRQ-01`).** Spec là contract và không có route này → xoá `bulk-reject.post.ts`, test của nó, khối chọn nhiều + nút lô ở `review/index.vue`. Nếu người dùng muốn giữ thao tác lô thì sửa spec trước (hỏi ở S0).
- **Tải theo `entityType`.** `review/[id].vue` đọc loại mục từ hàng đợi (query/param), tải đúng endpoint: level → `levels/{code}/latest`; lesson → teaching view; activity → endpoint activity. Một bảng ánh xạ kiểu → loader, không if rải rác.
- **Checklist theo loại (`BR-CRQ-07`).** UI lấy danh sách nhóm checklist từ cùng nguồn server dùng (hằng ở `packages/shared` mà `transition.post.ts:38-45` import) — không chép tay hai bản.
- **Gate xem thử (`BR-CRQ-02`).** lesson/activity: nút duyệt khoá tới khi người duyệt đã mở bản xem thử cho người dạy (teaching view) + đủ checklist.
- **Xem trước tuyệt đối (`BR-LPV-01`).** `live-preview-frame.vue` dựng URL từ origin web (`runtimeConfig.public.apiBaseUrl` → origin), `postMessage` với `targetOrigin` = origin web (không `*`), nhận message kiểm `event.origin`. Phía web: chỉ route `/play/preview-sandbox` cho phép `frame-ancestors` = origin admin (cấu hình runtime) qua `routeRules`/middleware; Nginx site bỏ `X-Frame-Options` cho riêng location đó (CSP `frame-ancestors` thay thế). Các route khác giữ nguyên chặn nhúng.

## 3. Lát cắt (Slices)

- **S0 — Chốt bulk-reject.** Xác nhận với người dùng: gỡ (mặc định, theo spec) hay giữ (sửa spec trước).
- **S1 — Gỡ bulk-reject.** Test trước: `POST …/review-queue/bulk-reject` → 404 (route không còn); test admin `review/index.vue` không render chọn nhiều/nút lô. Gỡ code + test cũ. Chạy `rtk proxy pnpm check:test-ratchet` — số suite có thể giảm do xoá test của route đã gỡ: nếu sàn `minTotalSuites` đỏ thì cập nhật baseline bằng `--force` kèm lý do trong commit (đây là bỏ tính năng có chủ đích, không phải bỏ đo).
- **S2 — Màn duyệt theo loại + checklist (`BR-CRQ-02`, `BR-CRQ-07`).** Test trước (`apps/admin/tests/unit/review-page.test.ts`): mục lesson gọi teaching view, không gọi `levels/*`; checklist lesson/activity khớp hằng server; duyệt lesson không 422; nút duyệt khoá tới khi mở bản xem thử.
- **S3 — Xem trước tuyệt đối (`BR-LPV-01`).** Test trước: admin — `src` iframe là URL tuyệt đối theo origin web, `postMessage` không dùng `*`; web — `/play/preview-sandbox` có `frame-ancestors` gồm origin admin, route khác vẫn `'self'`/`'none'`; test cấu hình nginx. Code.
- **S4 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/admin test`; `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/review-publish-seo.test.ts tests/api/levels-studio.test.ts tests/security`; `rtk proxy pnpm check:test-ratchet`.
  - Kiểm tay: mở xem trước level trong admin dev, engine chạy thật; duyệt một lesson từ UI thành công.
  - Bỏ `open_tasks` + khối "Chưa hoàn thành" ở `content-review-queue.md`, `live-preview.md`; nâng `status: implemented`.
  - Commit lên `main`.
