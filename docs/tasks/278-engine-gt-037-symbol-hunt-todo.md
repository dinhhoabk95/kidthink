# Todo — Task #278: `GT-037` Tìm hết ký hiệu

Plan: [`278-engine-gt-037-symbol-hunt-plan.md`](278-engine-gt-037-symbol-hunt-plan.md) ·
Phiếu: [`GT-037.md`](../specs/01-platform/engines/GT-037.md)

## S0 — Contract trước

- [x] Người đặt việc trả lời 4 câu mở ở phiếu mục 11 (lô, `letter`, `declare`, band `3-4`)
  - Verify: bảng mục 11 của phiếu gạch câu đã đóng kèm mã quyết định
- [x] `game-layout-engine.md`: thêm `scatter-board`, rule cấm phân trang cho layout tìm kiếm, hàm sức chứa
  - Verify: `pnpm lint:specs` xanh
- [x] `engine-behavior-domain.md` thêm hàng `GT-037`; `event-catalog.md` thêm trường; `error-codes.md` đăng ký `LAYOUT_CAPACITY_EXCEEDED`; `index.md` + `business-rules.md` §7.1 thêm prefix `BR-E037`
  - Verify: `pnpm lint:specs` và `check:engine-behavior` xanh

## S1 — Layout `scatter-board`

- [x] `computeScatterBoardLayout` + `scatterBoardCapacity(ageBand, logic)` trong `layout/geometry.ts`, đăng ký `registry.ts`
  - Acceptance: thuần; mọi ô ≥ sàn chạm; bước ô = `hit + SLOT_GAP_PX + 2·JITTER_MAX_PX`
  - Verify: test đơn vị hai hướng màn; ca âm — bước ô thiếu `2·JITTER_MAX_PX` phải làm test gap đỏ
- [x] Ghi sức chứa đo được vào `provisional-values.md`, sửa bảng plan mục 3.4 nếu lệch

## S2 — Khuôn

- [x] `templates/GT-037/template.ts` + schema + `superRefine` (`BR-E037-06`, `-07`)
  - Verify: test schema có ca âm cho từng luật refine
- [x] Gỡ `GT-037` khỏi `engine-spec-planned.json` cùng PR; sửa phiếu mục 15 theo khuôn thật
  - Verify: `pnpm --filter @mindkid/game-engine check:engine-specs` xanh

## S3 — Phiên

- [x] `session.ts`: bốn luồng `cells` · `jitter` · `distractors` · `assign` (`BR-E037-04`)
- [x] Thắng khi hết đích (`-01`), `commission` không phạt (`-02`), chạm lại ô đã khoanh bị bỏ qua
- [x] Trợ giúp `L1`–`L3` thu hẹp vùng; sự kiện `omissions` · `commissions` · `order`
  - Verify: Gherkin mục 9 thành test; test thuộc tính 1.000 seed cho `-03` và `-05`

## S4 — Vẽ và bề mặt chơi

- [x] Bốn lớp theo phiếu mục 12; chữ số/chữ cái không xoay
  - Verify: `check:render` 38/38 active xanh; test render tích hợp `drawCircleOutline`

## S5 — Nội dung

- [x] 12 level theo ma trận mục 13 + 3 fixture; tỉ lệ đích 15–35%; `item_count` ≤ sức chứa đo ở S1
  - Verify: `check:engine-depth` bậc 2 xanh (38/38, 0 thủng); `check:engine-seed-matrix` xanh (0 thủng)

## S6 — Cổng

- [x] `pnpm check` đủ bốn bước (Biome lint + typecheck), test game-engine
  - Verify: 10/10 target typecheck xanh sạch 0 lỗi; 34/34 test GT-037 pass; toàn bộ 8 cổng engine/content pass
- [x] Commit hoàn tất vào nhánh `main`
