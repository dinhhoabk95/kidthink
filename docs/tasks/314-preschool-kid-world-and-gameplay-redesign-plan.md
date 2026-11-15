# Thiết kế lại toàn diện Thế giới Trẻ em & Trải nghiệm Gameplay Mầm non (Task #314)

## 1. Bối cảnh & Mục tiêu

Nâng cấp khu vực trẻ 3–6 tuổi (`/play/**` và tầng dùng chung `packages/game-engine`) theo định hướng **Pok Pok Playroom × Khan Academy Kids × Todo Math × DragonBox × Sago Mini**, bản địa hoá trên nền ngôn ngữ **"Giấy & Gỗ Montessori"** (`docs/design-system/01-principles.md`) và **10 chủ đề Giáo dục Mầm non Việt Nam**.

Giữ nguyên 100% bất biến `docs/specs/00-foundation/business-rules.md` §7.3:
- Light-only, không `dark:`, không `danger`/đỏ trên bề mặt trẻ.
- Không đếm ngược, không hiện điểm số/xếp hạng/phần trăm, không tiền tệ/xu/streak.
- Không thêm cột vào `child_profiles` (`BR-CDC-01`); không sửa/xoá `child_stickers` (`BR-STK-02`).
- Đảm bảo 60fps trên tablet Android 2GB (`BR-PRF-01..05`), tự suy giảm `ambient_motion_enabled` khi FPS < 42.

## 2. Sáu trụ cột triển khai

1. **Tầng Dùng Chung Canvas 2D (`packages/game-engine`):**
   - `spring-physics.ts`: đàn hồi `squash & stretch` thuần toán học, 0 cấp phát mỗi khung hình.
   - Chất liệu gỗ vân ấm & rãnh lõm ô đích (`shared-render.ts`, `container-shapes.ts`) + **Magnetic Snap Halo** mời gọi ở bán kính `1.5×` đích.
   - Cảnh nền sống động (`scene-background.ts`, `scene-decor.ts`, `scene-themes-*.ts`) gắn cờ `ambient_motion_enabled` trong `degradation.ts`.
   - **Ghost Hand Gấu Con 2.5D** minh hoạ chạm/kéo thật ở bậc trợ giúp L2 (1×) và L3 (0.5× lặp).
   - Âm sắc mộc cầm tự nhiên (`wood_pickup`, `wood_clack_snap`, thang ngũ cung `marimba_note`, `gift_pop`) trong `sfx-engine.ts`.
2. **Phòng Chơi Gấu Con & Chuyến Phiêu Lưu 1-Chạm (`/play`):**
   - Tương tác đập tay high-five với Gấu Con, nghe câu chào khích lệ, đội phụ kiện kỷ niệm mở từ `child_badges` (`child_mascot_gear`).
   - Nút khổng lồ **Chuyến Phiêu Lưu Hôm Nay** dẫn dắt liền mạch 2–3 bước học tập hợp ZPD (`GET /api/users/play/adventure`).
3. **Nghi Thức Mở Hộp Quà Chiến Thắng (`KidVictoryModal`):**
   - Hiển thị modal tức thì không chờ mạng; thêm bước trẻ tự chạm mở hộp quà gỗ nhận Sticker 2.5D mới.
4. **Bản Đồ Đường Mòn 10 Vùng Đất (`/play/map`):**
   - Đường đá cuội SVG uốn lượn qua 10 chủ đề GDMN, ẩn chữ số phân số `x/y` (`BR-PRG-02`), Gấu Con định vị trực quan.
5. **Sân Chơi Sticker Bối Cảnh — Sticker Diorama (`/play/stickers`):**
   - Chạm sticker đọc tên tiếng Việt + nảy đàn hồi; kéo bày lên tranh phong cảnh chủ đề (`child_sticker_placements`).
6. **Hộp Đồ Chơi Tự Do Montessori (`/play/toybox`) & Vertical Slices C1–C6:**
   - 3 bàn đồ chơi khám phá mở không chấm đúng/sai (Cân gỗ bập bênh, Thanh hạt số & Khung 10, Bàn gương khối hình), tách biệt hoàn toàn khỏi `mastery_state`.
   - Nâng cấp chiều sâu biểu đạt cho nhóm engine tiêu biểu C1–C6.
