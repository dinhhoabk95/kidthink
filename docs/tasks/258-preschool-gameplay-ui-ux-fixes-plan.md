# Task #258 Plan: Toàn diện UI/UX & Công thái học Gameplay cho Trẻ Mầm Non (3–6 tuổi)

> **Mục tiêu**: Chuẩn hóa toàn bộ trải nghiệm chơi của 37 game engines từ góc nhìn của một bé mầm non:
> 1. Sửa và kích hoạt cơ chế Tap-Tap Fallback toàn diện cho các game kéo thả trên Web Player (`apps/web/app/pages/play/[code].vue`).
> 2. Bổ sung phản hồi thị giác màu hổ phách (Amber Retry) + âm thanh nhẹ nhàng (Soft SFX) khi thao tác chưa đúng trên các session còn thiếu, loại bỏ hoàn toàn sự im lặng gây bối rối cho trẻ.
> 3. Cải thiện âm thanh phản hồi khi đặt đúng vật phẩm (Snap sound + pop celebrate) và tối ưu hóa hit target trên canvas.
> 4. Xác minh compile và typecheck với `pnpm check` và kiểm thử trực quan với tài khoản seeder Bé Bắp.

---

## 1. Bối cảnh & Vấn đề Phát hiện

### 1.1. Tap-Tap Fallback trên Web Player (`apps/web/app/pages/play/[code].vue`)
- **Vấn đề**: Trẻ mầm non 3-4 tuổi vận động tinh chưa hoàn thiện, thao tác kéo rê ngón tay dài trên màn hình tablet/mobile thường bị đứt đoạn hoặc trượt. Cơ chế chạm-chạm (Tap-Tap Fallback: chạm vào vật phẩm nguồn rồi chạm vào ô đích) là bắt buộc theo `BR-ENG-06`.
- **Nguyên nhân**: Trong `[code].vue`, hàm `handleDropPlacement` trước đây chỉ hỗ trợ `handlePlacementByContainer` (gọi `onItemDropped`). Với các game đặt vào ô (`onItemPlaced`, e.g. GT-008, GT-015, GT-023, GT-030...), việc chạm-chạm không truyền được gesture hoặc slot đích chuẩn xác, dẫn đến tap-tap bị vô hiệu hóa. Đồng thời khi thả trúng đích bằng kéo thả, thiếu âm thanh giòn giã (snap + celebrate pop).

### 1.2. Phản hồi Nhịp hổ phách khi Thao tác Sai (Wrong Feedback)
- **Vấn đề**: Một số game engine (GT-008, GT-014, GT-020, GT-022, GT-023, GT-025, GT-026...) khi trẻ chọn hoặc thả sai chỉ ghi telemetry `is_correct: false` mà không đổi trạng thái item sang `"wrong"` (màu hổ phách `retry[100]` / `retry[600]`, rung nhẹ 400ms).
- **Quy tắc `07-game-engine.md`**: "Trả lời sai phải có phản hồi, và không bao giờ trừng phạt. Không đỏ, không buzzer, không trừ điểm — nhưng im lặng cũng là defect. Retry = nhịp hổ phách trên target + âm nhẹ + item trôi về chỗ cũ."

---

## 2. Các Giai đoạn Thực hiện

### Giai đoạn 1: Web Player Tap-Tap Fallback & Auditory Feedback
- Nâng cấp `handleDropPlacement` và `tryDispatchDrop` trong `apps/web/app/pages/play/[code].vue`.
- Đảm bảo khi kéo thả thành công, phát âm thanh `playSnapSound()` và `playPopCelebrateSound()`.
- Đảm bảo cơ chế tap-tap hoạt động cho mọi game kéo thả bằng cách dispatch drop gesture giữa 2 slot hoặc gọi `onItemPlaced`.

### Giai đoạn 2: Chuẩn hóa Phản hồi Hổ phách (Amber Retry) trên các Game Sessions
- Nâng cấp các session kéo thả & chạm chọn (đặc biệt GT-008, GT-014, GT-020, GT-022, GT-023, GT-026):
  - Khi action sai: gán trạng thái `"wrong"` lên item/slot trong 400ms.
  - Vẽ hiệu ứng rung nhẹ (shake 4px) và scaffolding highlight hổ phách.
  - Tự động hoàn nguyên về `"idle"` sau 400ms.

### Giai đoạn 3: Kiểm thử Thực tế & Verification Gates
- Chạy `pnpm check` (biome lint + typecheck) đảm bảo exit 0.
- Test thủ công luồng chơi trên trình duyệt với tài khoản seeder `parent.free@mindkid.test` (Bé Bắp, 5 tuổi).
