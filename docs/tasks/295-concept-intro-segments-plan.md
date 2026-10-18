# Kế hoạch Task #295: Bài làm quen chạy theo phân đoạn và quay lại đúng mốc (Concept Intro Segments)

Contract: `docs/specs/04-play/concept-intro-runner.md` (`BR-CIR-17`, `BR-CIR-18`, event `intro_segment_completed` §7.3), `docs/specs/05-content/concept-intro-model.md` (`BR-CIM-03`, `BR-CIM-06`), `docs/specs/04-play/concept-intro-gate.md` (`BR-CIG-12`, ma trận §7.3).

---

## 1. Bối cảnh & bằng chứng gap

| Spec | Bằng chứng | Thiếu |
| --- | --- | --- |
| concept-intro-runner | `packages/game-engine/src/templates/GT-000/session.ts:129` `flatMap` gộp mọi segment thành một dãy step; `session.ts:159-161,724-726` ghi cứng `segment_id: "seg_0"`; không có resume | `BR-CIR-17` (chạy nối tiếp từng phân đoạn, mốc ăn mừng + `intro_segment_completed { segment_id, segment_index, miss_count }`), `BR-CIR-18` (mở lại → bắt đầu từ phân đoạn kế mốc cuối, NEVER từ đầu). `BR-CIR-01..20` không có test nêu mã |
| concept-intro-model | `packages/game-engine/src/templates/GT-000/template.ts:76` `asset_ids: z.array(...).min(2).max(6)` | `BR-CIM-03` chốt 2–3 chất liệu mỗi segment (hạ từ 6 ngày 2026-09-06) |
| concept-intro-gate | Bước 8 chạy thật (`apps/web/server/utils/concept-intro-runtime.ts:305,371`, `packages/shared/src/access-gating.ts:318-324`); `packages/shared/tests/access-gating.test.ts` 0 lần nhắc "intro" | `BR-CIG-12`: ma trận §7.3 + ca âm miễn cổng (teach, `lesson_run`, preview, thiếu bài làm quen); nhiều BR khác (02–05, 09–12, 14, 16, 17) chưa có test nêu mã |

## 2. Thiết kế

- **Schema (`BR-CIM-03`).** `GT000SegmentSchema.asset_ids` → `.min(2).max(3)` cho segment dạy; segment ôn (`is_review: true`) theo đúng chữ spec — nếu spec cho ôn nhiều hơn thì tách qua `.refine` có nhánh `is_review`. Trước khi đổi: chạy seed/validate toàn bộ content GT-000 (`packages/content/src/builders/gt-000.ts`) để đếm segment vi phạm; sửa builder/dữ liệu để chia segment, không nới schema.
- **Runner (`BR-CIR-17`).** `session.ts` giữ cấu trúc `segments[]` (bỏ `flatMap`), con trỏ `(segmentIndex, stepIndex)`; hết step của segment → trạng thái mốc (ăn mừng nhẹ dùng hệ celebrate sẵn có) + phát `intro_segment_completed` với `segment_id`/`segment_index` thật và `miss_count` của segment. `segment_id` trong mọi event lấy từ segment hiện tại.
- **Resume (`BR-CIR-18`).** Server tính mốc cuối đã xong của bài làm quen đang dở (từ event `intro_segment_completed` của phiên intro gần nhất chưa `completed` cho cặp trẻ + level, đọc qua `concept-intro-runtime.ts`), trả `resume_segment_index` trong config giao cho GT-000 (`game-config-delivery`). Session khởi tạo từ `resume_segment_index`. Không thêm bảng mới nếu event đủ; nếu không đủ (event bị sweep), đề xuất cột trên `child_lesson_plays` (migration mới) — hỏi trước.
- **Gate (`BR-CIG-12`).** Test ma trận theo bảng §7.3: mỗi ô (ngữ cảnh × có/không bài làm quen × đã/chưa xong) → kết quả kỳ vọng; ca âm miễn cổng. Fixture dữ liệu sống trong `tests/**/fixtures/`.

## 3. Lát cắt (Slices)

- **S1 — `BR-CIM-03` schema 2–3 chất liệu.** Test trước (`packages/game-engine/tests/templates/gt-000.test.ts`): segment dạy 4 asset → parse lỗi; 2–3 → ok. Đo + sửa content GT-000 vi phạm, chạy lại seed.
- **S2 — Runner theo phân đoạn (`BR-CIR-17`).** Test trước: config 2 segment → step đi hết segment 0, phát đúng một `intro_segment_completed { segment_id: <thật>, segment_index: 0 }`, rồi sang segment 1; không còn `"seg_0"` cứng. Gắn mã `BR-CIR-17`.
- **S3 — Resume đúng mốc (`BR-CIR-18`).** Test trước: engine — khởi tạo với `resume_segment_index=1` bắt đầu từ step đầu của segment 1; server (`apps/web/tests/api/…intro…`) — phiên dở có mốc 0 xong → config trả `resume_segment_index=1`; bài đã hoàn thành → 0.
- **S4 — Ma trận gate (`BR-CIG-12`).** Test trước = chính phần việc: `packages/shared/tests/access-gating.test.ts` thêm ma trận §7.3 + ca âm; test tích hợp `concept-intro-runtime`. Gắn mã các BR CIG còn thiếu khi test đo đúng hành vi đó.
- **S5 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/game-engine exec vitest run tests/templates/gt-000.test.ts`; `rtk proxy pnpm --filter @mindkid/shared test`; `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/game-config-delivery.test.ts tests/api/intro-completion-across-versions.test.ts`; `rtk proxy pnpm check:intro-coverage`; `rtk proxy pnpm check:engine-specs`.
  - Bỏ `open_tasks` + khối "Chưa hoàn thành" ở `concept-intro-runner.md`, `concept-intro-model.md`, `concept-intro-gate.md`; nâng `status: implemented`.
  - Commit lên `main`.

## 4. Rủi ro

- Đổi schema có thể làm level GT-000 đã publish không còn hợp lệ → S1 đo trước, sửa dữ liệu bằng phiên bản mới (content versioning), không sửa bản đã publish tại chỗ.
- Trùng mã `BR-CIR-21` trong spec (`concept-intro-runner.md`) thuộc Task #288; nếu chưa sửa thì không gắn test vào `BR-CIR-21` cho tới khi có mã mới.
