# Task #258 Todo: UI/UX & Công thái học Gameplay cho Trẻ Mầm Non

- [x] **Giai đoạn 1: Nâng cấp Web Player (`apps/web/app/pages/play/[code].vue`)**
  - [x] Bổ sung âm thanh phản hồi xúc giác `playSnapSound()` và `playPopCelebrateSound()` khi drop thành công trong `tryDispatchDrop`
  - [x] Hoàn thiện hàm `handleDropPlacement` với hỗ trợ `onItemPlaced` và dispatch drop gesture tổng quát giữa `sourceSlot` và `targetSlot` cho tap-tap fallback
  - [x] Đảm bảo `handlePlacementTap` hoạt động thông suốt với mọi dạng game kéo thả vào ô hoặc khay

- [x] **Giai đoạn 2: Chuẩn hóa Phản hồi Hổ phách (Amber Retry) trên Game Sessions**
  - [x] Cập nhật `GT-007/session.ts`: thêm `wrongOptionId`, `wrongTimestamp`, gán trạng thái `"wrong"` và hiệu ứng rung nhẹ khi chọn sai số
  - [x] Cập nhật `GT-008/session.ts`: thêm `wrongItemId`, `wrongTimestamp`, gán trạng thái `"wrong"` và hiệu ứng rung nhẹ khi đặt sai ô
  - [x] Cập nhật `GT-014/session.ts`: thêm phản hồi nhịp hổ phách khi cân chưa thăng bằng
  - [x] Cập nhật `GT-020/session.ts`: thêm phản hồi nhịp hổ phách khi lật 2 thẻ không khớp nhau
  - [x] Cập nhật `GT-022/session.ts`: thêm phản hồi nhẹ khi chạm ra ngoài vật thể cần tìm
  - [x] Cập nhật `GT-023/session.ts`: thêm phản hồi nhịp hổ phách khi lắp mảnh sai vị trí
  - [x] Cập nhật `GT-025/session.ts`: thêm phản hồi nhịp hổ phách khi chạm vào đối tượng không khác biệt
  - [x] Cập nhật `GT-026/session.ts`: thêm phản hồi nhịp hổ phách khi chạm vào ký hiệu No-go

- [x] **Giai đoạn 3: Verification & Manual Testing**
  - [x] Chạy `pnpm check` (biome + typecheck) đạt exit 0
  - [x] Kiểm thử luồng gameplay thực tế với tài khoản seeder `parent.free@mindkid.test` (Bé Bắp)
  - [x] Xác nhận cả 2 phương thức: kéo rê và tap-tap fallback hoạt động mượt mà
