# Task #311 Todo: Provider thật cho addon AI, embedding và font PDF (Addon Provider Gaps)

Plan: [`311-addon-provider-gaps-plan.md`](311-addon-provider-gaps-plan.md).
Spec: [`ai-assistant.md`](../specs/07-addon/ai-assistant.md), [`semantic-search.md`](../specs/07-addon/semantic-search.md) `BR-SEM-03/04`, [`pdf-export.md`](../specs/07-addon/pdf-export.md) `BR-PDF-07`.

---

## S1 — Chốt provider
- [ ] Hỏi người dùng: LLM, embedding model (số chiều), env khoá, ngân sách
- [ ] Đóng OQ1 trong spec (sửa spec trước nếu đổi hành vi)

## S2 — Font PDF (`BR-PDF-07`)
- [ ] Sửa test `pdf-renderer.test.ts:64` assert `/FontFile2`, `CIDToGIDMap`, `W` (đỏ)
- [ ] Nhúng TTF tiếng Việt trong `packages/export/src/pdf-renderer.ts`
- [ ] Gộp/xoá bản test trùng `tests/unit/pdf-renderer.test.ts`

## S3 — Adapter LLM thật
- [ ] Test đỏ: định dạng gọi, thiếu khoá ở production → lỗi, egress guard
- [ ] Adapter trong `ai-provider.ts`; env contract + `gen:env-example`

## S4 — Consumer `embed:content` (`BR-SEM-03`)
- [ ] Test đỏ ghi một hàng, idempotent, retry khi lỗi
- [ ] Viết lại `apps/worker/src/consumers/embed-content.ts`
- [ ] Migration mới nếu đổi số chiều vector

## S5 — Producer + backfill (`BR-SEM-04`)
- [ ] Test đỏ publish → enqueue; archive → không trả về
- [ ] Enqueue trong `content-lifecycle.ts`; lệnh backfill

## S5b — Token FCM Web thật (`browser-push`)
- [ ] Test đỏ: trang cài đặt gửi token từ Firebase Messaging, không còn `fcm_token_client_`
- [ ] Dùng `firebase/messaging` trong `pages/me/settings/notifications.vue`

## S6 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test export/worker/web liên quan xanh (qua `rtk proxy`)
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Kiểm tay PDF có dấu + tìm kiếm ngữ nghĩa thật
- [ ] Bỏ `#311` khỏi `open_tasks` + khối "Chưa hoàn thành" ở 3 spec; nâng `implemented`; `reviewed`
- [ ] Commit vào `main`
