# Task #306 Todo: Lưu trữ âm thanh nội dung (Audio Storage)

Plan: [`306-audio-storage-plan.md`](306-audio-storage-plan.md).
Spec: [`audio-storage.md`](../specs/01-platform/audio-storage.md) `BR-AST-01`…`BR-AST-08`.

---

## S1 — Chốt công cụ chuẩn hoá
- [ ] Hỏi người dùng: ffmpeg trên worker hay chỉ kiểm và từ chối
- [ ] Ghi quyết định vào spec §11 (sửa spec trước nếu đổi hành vi)

## S2 — Bảng + migration
- [ ] Test đỏ schema `content_audio`
- [ ] Schema `packages/db/src/schema/content.ts` + migration mới
- [ ] `rtk proxy pnpm check:migration-hashes` xanh

## S3 — Upload
- [ ] Test đỏ magic bytes, 500 KB, 30 s, path tương đối, audit
- [ ] `apps/web/server/api/managers/audio/index.post.ts` + chuẩn hoá trong `packages/storage`

## S4 — Thay thế + xoá
- [ ] Test đỏ path mới khi thay (`BR-AST-06`), audit khi xoá (`BR-AST-08`)
- [ ] `apps/web/server/api/managers/audio/[id].delete.ts`

## S5 — Widget admin
- [ ] Component test widget `uiHint: audio` qua `useApiClient`
- [ ] Widget Studio

## S6 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test liên quan + `check:migration-hashes`, `check:error-codes`, `lint:deps` xanh
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Bỏ `#306` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `implemented`; `reviewed`
- [ ] Commit vào `main`
