# Kế hoạch Task #311: Provider thật cho addon AI, embedding và font PDF (Addon Provider Gaps)

Contract: `docs/specs/07-addon/ai-assistant.md` (OQ1, `BR-AIA-*`), `docs/specs/07-addon/semantic-search.md` (`BR-SEM-03`, `BR-SEM-04`), `docs/specs/07-addon/pdf-export.md` (`BR-PDF-07`), `docs/specs/01-platform/browser-push.md` (token FCM Web thật); liên quan `docs/specs/08-quality/testing-strategy.md` (`BR-TST-03`: bản mô phỏng cho test).

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G9 §A, §E):

| Spec | Hụt | Bằng chứng |
|---|---|---|
| ai-assistant | Không có provider LLM thật | 6 route `apps/web/server/api/users/ai/*` có, có lọc egress (`ai-egress-guard.ts`), kiểm duyệt (`ai-assistant.ts:202`), nhãn "Gợi ý" (`components/ai/ai-assistant-widget.vue:21`). Nhưng `aiProvider` trả **chuỗi soạn sẵn** (`apps/web/server/services/ai-provider.ts:150-163,213-225`) |
| semantic-search | `BR-SEM-03/04` không có đường chạy | Bảng `content_embeddings vector(1536)` (`schema/ai.ts:53`), truy vấn `<=>` + fallback tsvector (`semantic-search.ts:146-209`). Consumer `embed:content` **reject vô điều kiện** (`apps/worker/src/consumers/embed-content.ts:10-15`); rg không thấy chỗ enqueue `embedContent`. Embedding là hash FNV (`ai-provider.ts:36`) |
| pdf-export | `BR-PDF-07` nhúng font | rg `FontFile` trong `packages/export/src/pdf-renderer.ts`: 0. BaseFont `Helvetica` Type0/Identity-H không kèm file font, không CIDToGIDMap (`pdf-renderer.ts:450-487`). Test `[BR-PDF-07]` (`packages/export/tests/pdf-renderer.test.ts:64`) chỉ kiểm `/Identity-H` → **xanh giả**. Có bản test trùng `tests/unit/pdf-renderer.test.ts` |

Mục tiêu: ba addon chạy thật trong vận hành; bản mô phỏng tất định chỉ còn cho test.

## 2. Thiết kế

- **Provider:** giữ interface `aiProvider` hiện có; thêm adapter thật chọn theo env (khai trong `packages/config/src/env-contract.ts`, sinh lại `.env.example` bằng `gen:env-example`). Bản mô phỏng giữ cho test (`BR-TST-03`), không bao giờ là mặc định ở production — thiếu khoá API thì khởi động báo lỗi rõ, không âm thầm rơi về mô phỏng. Gọi provider qua egress guard sẵn có; dữ liệu trẻ không rời hệ thống ngoài phạm vi spec cho phép.
- **Chọn provider + model embedding** là quyết định của người dùng (OQ1). Số chiều embedding phải khớp `vector(1536)`; nếu model chọn khác chiều → migration **mới** đổi cột (không sửa migration cũ).
- **Embedding pipeline:** consumer `embed-content.ts` ghi `content_embeddings` idempotent theo khoá (`content_type`, `content_id`, `version`/hash nội dung); producer enqueue `embed:content` khi nội dung chuyển `published` trong `apps/web/server/services/content-lifecycle.ts` (cùng transaction outbox hoặc sau commit — theo cách job khác đang làm). Job backfill một lần cho nội dung đã published.
- **Font PDF:** nhúng TTF có đủ dấu tiếng Việt (giấy phép OFL, vd font đã dùng trong design system — đọc `docs/design-system/03-typography.md`), subset theo glyph dùng nếu cần giữ dung lượng: `FontFile2` + `CIDToGIDMap` + mảng `W` thật. Test assert `/FontFile2`, `/CIDToGIDMap` và trích văn bản có dấu. Gộp hai file test trùng.

## 3. Lát cắt dọc

- **S1 — Chốt provider với người dùng** — LLM nào, embedding model nào (số chiều), khoá cấp qua env nào, ngân sách gọi. Ghi vào spec ai-assistant §11 (đóng OQ1) và semantic-search; sửa spec trước nếu đổi hành vi.
- **S2 — Font PDF (`BR-PDF-07`)** (không phụ thuộc S1)
  - Test trước: sửa `pdf-renderer.test.ts:64` assert `/FontFile2` + `CIDToGIDMap` + `W` → đỏ trên code hiện tại; ca chuỗi "Bé học đếm" trích lại đúng dấu.
  - Xong khi: test xanh; bản test trùng được gộp/xoá mà số suite không tụt sai (ghi lý do nếu giảm có chủ ý).
- **S3 — Adapter LLM thật**
  - Test trước: adapter gọi HTTP giả (stub fetch) đúng định dạng; thiếu khoá ở production → lỗi khởi động; egress guard vẫn chặn; test route AI hiện có dùng bản mô phỏng và không đổi trạng thái.
  - Xong khi: test xanh; env contract cập nhật.
- **S4 — Embedding thật + consumer `embed:content` (`BR-SEM-03`)**
  - Test trước (worker): consumer ghi một hàng, chạy lại cùng khoá không nhân đôi; lỗi provider → retry theo BullMQ, không nuốt lỗi.
  - Xong khi: test `apps/worker` xanh.
- **S5 — Producer khi publish + backfill (`BR-SEM-04`)**
  - Test trước: publish nội dung → có job `embed:content` trong queue; archive → embedding bị bỏ/không trả về.
  - Xong khi: test web xanh; lệnh backfill chạy được trên DB dev.
- **S5b — Token FCM Web thật (`browser-push`)**
  - Hiện `apps/web/app/pages/me/settings/notifications.vue` gửi token giả `fcm_token_client_*`; package `firebase` khai trong `apps/web/package.json` nhưng không file nào import.
  - Test trước: trang cài đặt lấy token qua `getToken` của Firebase Messaging (mock SDK trong test) rồi POST `/api/users/notification-endpoints`; không còn chuỗi `fcm_token_client_`.
  - Xong khi: test web xanh; kiểm tay nhận được một thông báo trên trình duyệt dev.
- **S6 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, test `@mindkid/export`, `@mindkid/worker`, `@mindkid/web` liên quan, `rtk proxy pnpm check:migration-hashes` (nếu có migration), `rtk proxy pnpm check:test-ratchet`.
  - Kiểm tay: tạo PDF mẫu mở bằng trình xem PDF, dấu tiếng Việt hiển thị đúng; tìm kiếm ngữ nghĩa trả kết quả không qua fallback.
  - Spec 4 file: bỏ `#311` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `status: implemented`; `reviewed`.
  - Commit vào `main`.
