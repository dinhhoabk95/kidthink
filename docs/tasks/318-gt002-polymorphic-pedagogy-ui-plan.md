# Task #318 — Cải Tiến Đa Hình Thái Sư Phạm & Giao Diện Thu Hoạch GT-002

> **Contract sở hữu:** [`../specs/01-platform/engines/GT-002.md`](../specs/01-platform/engines/GT-002.md) (`BR-E002-01..08`, đóng nợ `#301` cho `GT-002`)

## 1. Mục Tiêu
- Nâng cấp sân khấu `GT-002` (`tap-select-multi`) thành **Bàn/Mẹt Thu Hoạch Đa Chủ Đề** (`ocean_net`, `sedge_harvest`, `montessori_wood`) đồng bộ 16+1 câu mở truyện ấm áp (`<= 14` từ, 0 từ phủ định) và âm chọn trung tính không đè giọng đọc từ ngữ C5.
- Bổ sung **Neo Tiêu Chí Thị Giác (`criterion_anchor`)** 7 chế độ (`color`, `shape`, `size_compare`, `quantity`, `category`, `phonics`, `conjunction`, mở `negated` riêng cho band `5-6`) ở thanh đầu sân khấu kèm huy hiệu góc `zones.action`, giữ **Mẹt Mở Co Giãn** ở `all_matching` không lộ tổng số đáp án (`BR-E002-02`, `BR-E002-06`) và hỗ trợ **Khay Gỗ `N` Hốc Tròn** cho chế độ bán mở `exact_count`.
- Triển khai **Đĩa/Thẻ Giáo Cụ Đa Hình Thái** (`round_plate` tròn / `wood_tile` giấy dó chữ nhật đồng bộ `HitShape`) vẽ chuẩn hình học vector 2D/3D theo ngưỡng Weber (`geometric_spec`), biểu diễn lượng CPA (`representation`), thước đối chiếu (`label`), mặt thẻ kép C5 (`asset` + `secondary_asset`) và cờ bảo toàn trật tự không gian (`preserve_order`) + kiểm giỏ (`preselected_item_ids`).
- Khắc phục triệt để lỗi nhân bản vô tính đáp án đúng trong `projectGT002` sang tập đáp án **đa cá thể cùng thuộc tính**, hoàn thiện thang trợ giúp 3 bậc riêng `L1`/`L2`/`L3` và khôi phục trạng thái lún xúc giác `touching` + gỡ chọn êm trên bề mặt Web.

## 2. Các Phân Hệ Thay Đổi
1. **Spec, Rule & Docs:** `docs/specs/01-platform/engines/GT-002.md`, `.agents/rules/07-game-engine.md`, `docs/tasks/318-gt002-polymorphic-pedagogy-ui-{plan,todo}.md`.
2. **Schema, Story Lines & Dictionary:** `packages/game-engine/src/templates/GT-002/template.ts`, `packages/game-engine/src/templates/GT-002/gt002-story-lines.ts`, `packages/game-engine/src/templates/GT-002/fixtures.ts`, `packages/game-engine/src/generators/gt002.ts`, `packages/shared/src/config-dictionary.ts`.
3. **Vector 2D/3D Primitives:** `packages/game-engine/src/render/types.ts`, `packages/game-engine/src/render/geometric-primitives.ts`.
4. **Layout, Render & Session GT-002:** `packages/game-engine/src/mechanics/selection-mechanic.ts`, `packages/game-engine/src/templates/GT-002/layout.ts`, `packages/game-engine/src/render/gt-002-shapes.ts`, `packages/game-engine/src/templates/GT-002/session.ts`.
5. **Content Projector & Voice Catalog:** `packages/content/src/builders/gt-002-criterion-projector.ts`, `packages/content/src/builders/gt-002.ts`, `packages/content-build/src/voice/catalog-extractor.ts`.
6. **Web Play Surface:** `apps/web/app/composables/play/use-play-gesture.ts`, `apps/web/app/pages/play/[code].vue`.
