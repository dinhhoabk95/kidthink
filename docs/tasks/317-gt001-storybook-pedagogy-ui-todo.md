# Task #317 — Bảng Kiểm Triển Khai (Todo)

- [x] **T1:** Cập nhật đặc tả `docs/specs/01-platform/engines/GT-001.md` (`BR-E001-05..08`) và tạo tài liệu canonical Task `#317`.
- [x] **T2:** Mở rộng `GT001ContentSchema` (`showcase`, `story_theme_code`, `options[].label`, `options[].representation`) tương thích ngược 100% + cập nhật `config-dictionary.ts`.
- [x] **T3:** Xây dựng `story-showcase.ts`, `layout.ts`, `gt-001-storybook.ts`, cập nhật `gt-001-shapes.ts` và `GT001Session` (sách Pop-up 2.5D, đường bay parabol, kết tinh CPA, thang gợi ý 3 bậc `L1/L2/L3`, 16 câu mở truyện chủ đề).
- [x] **T4:** Xây dựng `gt-001-showcase-projector.ts`, đấu nối vào `projectGT001`, nâng `GENERATED_LEVEL_CONTENT_VERSION` và đăng ký 16 câu mở truyện chủ đề vào `catalog-extractor.ts`.
- [x] **T5:** Viết bộ kiểm thử đơn vị & kiểm thử bất biến (`gt-001.test.ts`, `gt-001-storybook.test.ts`, `gt-001-showcase.test.ts`), chạy toàn bộ cổng `pnpm check` xanh tuyệt đối.
- [x] **T6:** Kết xuất danh mục giọng đọc (`voice-catalog.json`, `voice-manifest.json`) và 17 file âm thanh `teacher-v1` cho câu mở truyện `GT-001` (`voice-pipeline.test.ts` 4/4 đạt, `17/17` clip hợp lệ).
- [x] **T7:** Seed cơ sở dữ liệu phát triển cục bộ `v14` (`seed:all`: 577 `game_levels` / 1732 `game_level_rounds` của `GT-001`, 100% có `showcase` & `story_theme_code`, 0 vòng lộ nguyên mẫu đáp án ở `L0`).
