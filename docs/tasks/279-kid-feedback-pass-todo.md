# Task #279 Todo: Phản hồi bằng hình cho trẻ

Plan: [`279-kid-feedback-pass-plan.md`](279-kid-feedback-pass-plan.md).

Lệnh kiểm (chạy qua `rtk proxy`):
- `npx vitest run` trong `packages/game-engine`
- Các test play của `apps/web`
- `pnpm typecheck --only root` / `web:app` / `web:server`
- `pnpm lint`
- `pnpm check:logic-space` / `check:hint-target` / `check:engine-turn` / `check:engine-specs`

## Spec — 2026-10-03

- [x] `feedback-and-celebration.md`: thêm `BR-FBK-11`, `BR-FBK-12`, §7.4 dáng mascot, sửa entry point
- [x] `play-stage-zones.md`: đóng câu hỏi mở 1 (sprite ngoài, Gấu Con)

## S1 — Mascot và lớp phủ ở engine

- [x] RED: `tests/feedback-overlay.test.ts`, `tests/render/mascot.test.ts` — đỏ vì module chưa có
- [x] `render/mascot.ts`: sáu dáng, `mascotMotion` thuần, sprite hoặc placeholder
- [x] `systems/feedback-overlay.ts`: pop tại điểm chạm, hổ phách không leo thang (`BR-FBK-07`), reduced-motion giữ pop
- [x] `drawPromptZone` vẽ mascot theo dáng thay emoji 🐻
- [x] Cổng render `BR-ERC-05`: thêm hai file vào danh sách thư viện nguyên thuỷ, có chú thích

## S2 — Shell web

- [x] RED: `play-gesture.test.ts`: 3 test đỏ trước khi có `onFeedback`
- [x] `use-play-gesture`: `onFeedback` tại điểm chạm/thả; cử chỉ bị nuốt thì không phát
- [x] `[code].vue`: overlay ở lớp trên cùng, dáng nền `listen`/`hint`/`idle`, reset mỗi vòng
- [x] Chuyển vòng: dáng `happy` giữ 700 ms trong khoảng chờ 900 ms giữa hai vòng

## S3 — Màn tổng kết và nút icon

- [x] RED: `victory-modal.test.ts`: 3 test đỏ trước khi sửa (announce, nút không chữ, không emoji gấu)
- [x] `components/kid/mascot.vue` (`KidMascot`) dùng chung `drawMascot`
- [x] Modal phát `announce`, trang đọc bằng `speakPrompt`; nút ▶ và ↻ chỉ có icon
- [x] RED: `tests/render/commit-button.test.ts`; nút Xong vẽ dấu ✓, không `fillText`
- [x] Nút bước GT-000 chỉ có icon (aria-label giữ nguyên)

## Checkpoint — trình duyệt thật

Cần `pnpm services` và `pnpm db:seed`.

- [ ] GT-001 và GT-028 ở ba viewport: tắt tiếng vẫn thấy mascot đổi dáng khi đúng/sai
- [ ] Reduced-motion bật: pop còn, mascot không nảy
- [ ] Màn tổng kết đọc lời khen; chụp ảnh vào `docs/qa/engine-captures/<ngày>/`

## Còn mở

- [x] Mascot chốt Gấu Con (2026-10-03); bốn SVG có sẵn nạp qua `useMascotSprites`, sáu dáng ánh xạ ở `MASCOT_SPRITE_FILES`
- [ ] Review token `coral` (màu nội dung, không phải phản hồi)
