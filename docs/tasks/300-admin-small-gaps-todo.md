# Task #300 Todo: Vá các gap nhỏ trong admin

Plan: [`300-admin-small-gaps-plan.md`](300-admin-small-gaps-plan.md).
Spec: `06-admin/` emoji-picker (`BR-EPK-03`), schema-driven-form (`BR-SDF-04`), asset-usage-tracking (§3), admin-subscription-cancel (§3, §8), audit-log-viewer (`BR-ALV-05`), taxonomy-browser (`BR-TXB-04`), game-level-studio (`BR-STU-06`).

---

## S1 — Dán emoji
- [ ] Test đỏ: dán một emoji → lưu; chuỗi không phải emoji → lỗi field
- [ ] Input text trong `schema-form-field.vue:17-40`

## S2 — `access_tier` bắt buộc
- [ ] Test đỏ: thiếu `access_tier` → 422
- [ ] Bỏ default `"free"` ở `levels/index.post.ts:41,89`; UI bắt chọn tier

## S3 — Taxonomy → studio
- [ ] Test đỏ: link `/studio/levels?skill_code=…`; trang levels chọn sẵn skill
- [ ] Sửa `taxonomy/index.vue:211` và `studio/levels/index.vue`

## S4 — Audit lọc theo query
- [ ] Test đỏ: `/audit` đọc `entity_type`, `entity_id`, `q` từ query
- [ ] Link "xem lịch sử" ở user detail và level (đơn khi #297 xong)

## S5 — Huỷ gói
- [ ] Test đỏ: lý do sai → 422 `INVALID_CANCEL_REASON` (siết `subscription-cancel.test.ts:18`)
- [ ] Test đỏ: mục gói + nút "Huỷ gói" trên `/users/{uuid}`
- [ ] `InvalidCancelReasonError`; bỏ `as unknown as` ở `cancel.post.ts:27`
- [ ] Tạo `components/users/user-subscriptions-section.vue`

## S6 — Asset usage UI
- [ ] Test đỏ: trang usage render `used_by[]`
- [ ] Test đỏ: xoá ảnh đang dùng → modal hiện 409 + danh sách
- [ ] Tạo `studio/assets/[id]/usage.vue` + modal xoá

## S7 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test admin + web liên quan + `check:error-codes` xanh
- [ ] Bỏ `open_tasks` + khối "Chưa hoàn thành" ở 7 spec, nâng `status: implemented`
- [ ] Commit lên `main`
