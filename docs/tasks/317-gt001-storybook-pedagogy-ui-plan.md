# Task #317 — Cải Tiến UI/UX & Sư Phạm GT-001 ("Cuốn Sách Gỗ Pop-up 3 Chương")

> **Contract sở hữu:** [`../specs/01-platform/engines/GT-001.md`](../specs/01-platform/engines/GT-001.md) (`BR-E001-05..08`)

## 1. Mục Tiêu
- Tái thiết kế sân khấu `GT-001` thành **Cuốn Sách Gỗ Pop-up 3 Chương** (Mở trang dẫn chuyện → Lật trang đối chiếu CPA → Đồng xu bay parabol kết tinh kiến thức).
- Triệt tiêu lỗi lộ nguyên mẫu đáp án ở thẻ đề trung tâm (`E7`) trên 992 levels thông qua **Thẻ Ngữ Cảnh Thông Minh (`showcase`)** 5 chế độ (`cpa_bridge`, `comparison_anchor`, `silhouette_clue`, `story_riddle`, `sequence_gap`).
- Đấu nối đầy đủ giáo cụ Montessori / Koguma CPA (`ten-frame`, `dot-pattern`, `number-rod`, `rekenrek`, `tally`, `number-line`) và thước đối chiếu trực quan (`comparison-cue`) xuống đồng xu gỗ.
- Cài đặt thang trợ giúp sư phạm 3 bậc riêng `L1` / `L2` / `L3` cho `GT-001` và đồng bộ 16 câu mở truyện chủ đề vào kho giọng cô giáo `teacher-v1`.

## 2. Các Phân Hệ Thay Đổi
1. **Spec & Docs:** `docs/specs/01-platform/engines/GT-001.md`, `docs/tasks/317-gt001-storybook-pedagogy-ui-{plan,todo}.md`.
2. **Schema & Dictionary:** `packages/game-engine/src/templates/GT-001/template.ts`, `packages/shared/src/config-dictionary.ts`.
3. **Content Builder & Voice Catalog:** `packages/content/src/builders/gt-001-showcase-projector.ts`, `packages/content/src/builders/gt-001.ts`, `packages/content/src/builders/build-levels.ts`, `packages/content-build/src/voice/catalog-extractor.ts`.
4. **Canvas 2D Render & Session:** `packages/game-engine/src/templates/GT-001/story-showcase.ts`, `packages/game-engine/src/templates/GT-001/layout.ts`, `packages/game-engine/src/render/gt-001-storybook.ts`, `packages/game-engine/src/render/gt-001-shapes.ts`, `packages/game-engine/src/templates/GT-001/session.ts`.
