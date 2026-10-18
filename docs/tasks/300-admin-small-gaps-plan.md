# Kế hoạch Task #300: Vá các gap nhỏ trong admin (Admin Small Gaps)

Contract: `docs/specs/06-admin/emoji-picker.md` (`BR-EPK-03`, `BR-EPK-09`), `docs/specs/06-admin/schema-driven-form.md` (`BR-SDF-04`), `docs/specs/06-admin/asset-usage-tracking.md` §3, `docs/specs/06-admin/admin-subscription-cancel.md` §3, §8 (`BR-ASC-02`, `BR-ASC-05`, `BR-ASC-06`), `docs/specs/06-admin/audit-log-viewer.md` (`BR-ALV-05`), `docs/specs/06-admin/taxonomy-browser.md` (`BR-TXB-04`), `docs/specs/06-admin/game-level-studio.md` (`BR-STU-06`); `docs/specs/08-quality/type-safety.md` (cấm `as unknown as`).

---

## 1. Bối cảnh & bằng chứng gap

| Spec | Bằng chứng | Thiếu |
| --- | --- | --- |
| emoji-picker + schema-driven-form | `apps/admin/app/components/studio/schema-form-field.vue:17-40` chỉ có nút "Chọn emoji"/"Xoá"; ô nhập trong `components/emoji/emoji-picker-modal.vue` chỉ để tìm | `BR-EPK-03`, `BR-SDF-04`: dán glyph trực tiếp; `BR-EPK-09` không có test nêu mã |
| asset-usage-tracking | API `apps/web/server/api/managers/assets/[...ref]/usage.get.ts`, `images/[id].delete.ts` (409 `CONTENT_IN_USE`); admin không gọi | Trang `/studio/assets/{id}/usage` + modal xác nhận xoá hiện `used_by[]` |
| admin-subscription-cancel | API `subscriptions/[id]/cancel.post.ts` + `services/recurring-billing.ts:169-228`; `apps/admin/app/components/users/*` không có mục gói; lý do sai trả `VALIDATION_FAILED` (test `subscription-cancel.test.ts:18` chấp nhận cả hai); `cancel.post.ts:27` dùng `as unknown as` | Mục gói + nút "Huỷ gói" ở `/users/{uuid}`; `INVALID_CANCEL_REASON`; bỏ ép kiểu |
| audit-log-viewer | `apps/admin/app/pages/audit/index.vue` không đọc `route.query`; link "xem lịch sử" chỉ ở `flags/index.vue:116`, `errors/index.vue:176` | `BR-ALV-05`: lọc theo query; link ở chi tiết user, level, đơn |
| taxonomy-browser | `apps/admin/app/pages/taxonomy/index.vue:211` link `/admin/seed-authoring?skill_code=…` (không tồn tại); `skills/[code].get.ts:145` trả `/studio/levels?skill_code=` nhưng `studio/levels/index.vue` không đọc query | `BR-TXB-04` |
| game-level-studio | `apps/web/server/api/managers/levels/index.post.ts:41,89` `access_tier` optional, mặc định `"free"` | `BR-STU-06` |

## 2. Thiết kế

- **Emoji.** Thêm input text cạnh nút picker trong `schema-form-field.vue`; giá trị dán vào được chuẩn hoá và kiểm là đúng một grapheme emoji (dùng `Intl.Segmenter` + kiểm theo bảng emoji đã có ở API `emoji/index.get.ts` nếu spec đòi thuộc bộ cho phép). Sai → lỗi field, không lưu.
- **Asset usage.** Trang `apps/admin/app/pages/studio/assets/[id]/usage.vue` gọi `GET /api/managers/assets/{ref}/usage`; modal xoá gọi `DELETE /api/managers/images/{id}`, 409 `CONTENT_IN_USE` hiện danh sách `used_by[]` có link.
- **Huỷ gói.** Component mới `user-subscriptions-section.vue` trong `apps/admin/app/components/users/` gọi `GET /api/managers/users/{uuid}/subscriptions`, nút "Huỷ gói" mở modal lý do → `POST /api/managers/subscriptions/{id}/cancel`. Route ném `InvalidCancelReasonError` (`@mindkid/errors`) cho lý do ngoài danh sách; thay `as unknown as` ở `:27` bằng Zod parse/narrowing. Siết test `subscription-cancel.test.ts:18` chỉ chấp nhận `INVALID_CANCEL_REASON` (đây là sửa cho đúng spec, ghi rõ trong commit).
- **Audit.** `audit/index.vue` đọc `entity_type`, `entity_id`, `q` từ `route.query` làm bộ lọc ban đầu và đồng bộ ngược lên URL; thêm link "xem lịch sử" ở `users/[uuid].vue`, trang level studio, trang đơn (Task #297 — nếu chưa có thì thêm khi #297 xong).
- **Taxonomy.** Đổi link sang `/studio/levels?skill_code=…`; `studio/levels/index.vue` đọc `skill_code` để chọn sẵn.
- **access_tier.** Zod `access_tier` bắt buộc ở `levels/index.post.ts`, bỏ default `"free"`; UI tạo level bắt chọn tier.
- Bề mặt người lớn: có `dark:`, không hex literal; admin không import package server (`BR-ARB-04`).

## 3. Lát cắt (Slices)

Mỗi slice độc lập, test trước rồi code.

- **S1 — Dán emoji (`BR-EPK-03`, `BR-SDF-04`).** Test trước (`apps/admin/tests/unit/…schema-form…`): dán "🐻" → lưu; dán "ab" → lỗi field; test gắn `BR-EPK-09` nếu đo đúng hành vi đó.
- **S2 — `access_tier` bắt buộc (`BR-STU-06`).** Test trước (`apps/web/tests/api/levels-studio.test.ts`): thiếu `access_tier` → 422; có → 201 đúng tier.
- **S3 — Taxonomy → studio (`BR-TXB-04`).** Test trước: link taxonomy trỏ `/studio/levels?skill_code=X`; trang levels chọn sẵn X.
- **S4 — Audit lọc theo query (`BR-ALV-05`).** Test trước: mở `/audit?entity_type=user&entity_id=…` gửi đúng filter lên API; link "xem lịch sử" có ở user detail và level.
- **S5 — Huỷ gói (`BR-ASC-02/05/06`).** Test trước: API — lý do sai → 422 `INVALID_CANCEL_REASON`; admin — mục gói hiện trên `/users/{uuid}`, nút huỷ gọi đúng route. Code + bỏ `as unknown as`.
- **S6 — Asset usage UI.** Test trước: trang usage render `used_by[]`; xoá ảnh đang dùng → modal hiện 409 + danh sách; ảnh không dùng → xoá thành công.
- **S7 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/admin test`; `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/levels-studio.test.ts tests/api/images.test.ts tests/api/emoji.test.ts tests/api/managers/subscription-cancel.test.ts`; `rtk proxy pnpm check:error-codes`.
  - Bỏ `open_tasks` + khối "Chưa hoàn thành" ở 7 spec trong Contract, nâng `status: implemented`.
  - Commit lên `main`.
