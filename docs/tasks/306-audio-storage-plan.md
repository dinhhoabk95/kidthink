# Kế hoạch Task #306: Lưu trữ âm thanh nội dung (Audio Storage)

Contract: `docs/specs/01-platform/audio-storage.md` §4–§9 (`BR-AST-01`…`BR-AST-08`), liên quan `BR-ENG-16`, `BR-CDC-04`, `BR-AUD-01`. Spec `mvp: false`, `phase: P2`, `status: approved`.

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G2 §A, §E): spec ghi `implemented` nhưng **không có code** (đợt #288 đã hạ về `approved`):

- Không có `apps/web/server/api/managers/audio*`.
- rg `content_audio` trong `packages/` và `apps/`: không thấy — chưa có bảng.
- `AUDIO_SIZE_LIMIT_EXCEEDED` chỉ khai ở `packages/errors/src/codes.ts` và `domains/content.ts`, không ai ném.
- Chỉ §7.3 có code: `packages/content/src/inventories/audio-legacy-map.ts`.

Mục tiêu: Manager tải lên / xoá audio gắn với một nội dung (`owner_type`, `owner_id`), file đạt ràng buộc kỹ thuật, có audit; Studio admin có widget `uiHint: audio`.

## 2. Thiết kế

Theo mẫu `image-storage` đã chạy (`apps/web/server/api/managers/images/index.post.ts`, `[id].delete.ts`).

- **Bảng `content_audio`** trong `packages/db/src/schema/content.ts` + **migration mới** (không sửa migration cũ — `check:migration-hashes`): `id`, `owner_type`, `owner_id`, `path` tương đối (`BR-AST-05`), `mime`, `bytes`, `duration_ms`, `created_at`, `updated_at` (`BR-DM-08`). Không cột dùng chung giữa owner (`BR-AST-01`).
- **`POST /api/managers/audio`**: multipart; Zod parse trường text cùng file; magic bytes cho 5 MIME (`BR-AST-02`); ≤ 500 KB, ≤ 30 s (`BR-AST-03`) → ném lớp lỗi `@mindkid/errors` (`AUDIO_SIZE_LIMIT_EXCEEDED`…), không `try/catch` trong route. Chuẩn hoá (mono 44.1 kHz, −16 LUFS, true peak ≤ −1 dBTP, ramp) đặt trong `packages/storage` — chọn công cụ (ffmpeg qua worker hay thư viện) là **quyết định cần chốt** ở S1 vì kéo theo dependency hạ tầng. Thay thế = path mới, không ghi đè (`BR-AST-06`). `writeAudit` (`BR-AST-08`).
- **`DELETE /api/managers/audio/{id}`**: xoá bản ghi + file, `writeAudit`.
- **`BR-AST-04`**: không route nào nhận audio từ bề mặt trẻ/phụ huynh; test bảo đảm route chỉ có ở namespace `managers`.
- **Admin**: widget `uiHint: audio` trong Studio gọi `useApiClient` có `x-csrf-token` (`BR-AST-07`), không `$fetch` trần.

## 3. Lát cắt dọc

- **S1 — Chốt công cụ chuẩn hoá âm thanh** (hỏi người dùng: ffmpeg trên VPS/worker hay chỉ kiểm và từ chối file chưa chuẩn). Xong khi: quyết định ghi vào spec §11 (sửa spec trước nếu đổi hành vi).
- **S2 — Bảng + migration** — Test trước: test schema `content_audio` có đủ cột, `updated_at`. Xong khi: migration mới áp được trên DB dev (`127.0.0.1:5433`), `rtk proxy pnpm check:migration-hashes` xanh.
- **S3 — Upload** — Test trước (`apps/web/tests/api/managers/audio*.test.ts`): file giả đuôi `.mp3` nhưng magic bytes khác → 422 (`BR-AST-02`); > 500 KB / > 30 s → mã lỗi spec (`BR-AST-03`); hợp lệ → 201, DB lưu path tương đối, có dòng audit. Xong khi: test xanh; `security-checklist.test.ts` xanh (Zod cùng file).
- **S4 — Thay thế + xoá** — Test trước: thay audio tạo path mới, file cũ còn (`BR-AST-06`); DELETE ghi audit (`BR-AST-08`). Xong khi: xanh.
- **S5 — Widget admin** — Test trước: component test widget gọi `useApiClient` (không `$fetch` trần), hiển thị lỗi theo mã. Xong khi: `rtk proxy pnpm --filter @mindkid/admin test` xanh; `apps/admin/tests/gates/` xanh.
- **S6 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, test web/admin/db/storage liên quan, `rtk proxy pnpm check:migration-hashes`, `check:error-codes`, `rtk proxy pnpm lint:deps`, `rtk proxy pnpm check:test-ratchet`.
  - Spec `audio-storage.md`: bỏ `#306` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `status: implemented`; `reviewed`.
  - Commit vào `main`.
