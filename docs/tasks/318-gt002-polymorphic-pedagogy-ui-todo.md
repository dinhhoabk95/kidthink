# Task #318 — Bảng Kiểm Triển Khai (Todo)

- [x] **T1:** Cập nhật đặc tả `docs/specs/01-platform/engines/GT-002.md` (`BR-E002-05..08`), đồng bộ sàn chạm `64px CSS` ở `.agents/rules/07-game-engine.md` và tạo tài liệu Task `#318`.
- [x] **T2:** Mở rộng `GT002ContentSchema` & `GT002DifficultySchema` tương thích ngược 100%, tạo `gt002-story-lines.ts` (16+1 hồ sơ chủ đề), cập nhật `fixtures.ts`, `generators/gt002.ts` và `config-dictionary.ts`.
- [x] **T3:** Xây dựng `geometric-primitives.ts` (15 hình phẳng 2D & khối 3D isometric Montessori, tỷ lệ Weber, chấm định hướng) và mở rộng `RenderItem`.
- [x] **T4:** Nâng cấp `use-play-gesture.ts` & `play/[code].vue` (trạng thái lún xúc giác `touching`, gỡ chọn êm ở đa chọn, đấu nối `onFallbackCue`).
- [x] **T5:** Nâng cấp `GT-002/layout.ts`, `gt-002-shapes.ts`, `SelectionMechanic` và `GT002Session` (bàn 3 chất liệu, neo tiêu chí 7 dạng, mẹt mở / khay `N` hốc, đĩa/thẻ đa hình thái, thang gợi ý `L1`/`L2`/`L3`).
- [x] **T6:** Xây dựng `gt-002-criterion-projector.ts`, nâng cấp `projectGT002` (đa cá thể đáp án đúng cùng thuộc tính, CPA, thẻ kép C5, `preserve_order`) và đăng ký `GT002_ALL_STORY_LINES` vào `catalog-extractor.ts`.
- [x] **T7:** Chạy kiểm định toàn bộ bộ test đơn vị, cổng bất biến và `pnpm check` xanh tuyệt đối.
- [x] **T8:** Kết xuất danh mục giọng đọc và sinh 17 file .mp3 teacher-v1 cho 16+1 câu mở truyện theo chủ đề của GT-002.
