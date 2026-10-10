# Kế hoạch Task #287: Modal Chúc mừng Huy hiệu Kỷ niệm tại Sảnh chơi (Badge Milestone Celebration Modal)

Contract: `docs/specs/04-play/progress-and-mastery.md` §4 item 5, §7.2, `BR-PRG-02`, `BR-PRG-04`, `BR-PRG-07`.

---

## 1. Bối cảnh & Mục tiêu

- Khi trẻ hoàn thành các cột mốc học tập (chặng đầu tiên `STRAND_FIRST_COMPLETE`, hoàn thành tuần học `WEEK_CURRICULUM_COMPLETE`, hoặc 5 ngày vui học `PLAY_DAYS_5`), hệ thống cấp huy hiệu vào bảng `child_badges`.
- Theo spec `progress-and-mastery.md` §4 item 5: Huy hiệu được hiển thị chúc mừng ở lần vào sảnh chơi kế tiếp.
- Huy hiệu trong MindKid mang ý nghĩa **kỷ niệm và tôn vinh nỗ lực**, không phải điểm số ganh đua hay bảng săn thành tích (`BR-PRG-02`, `BR-PRG-04`).
- Cần tạo modal chúc mừng ấm áp trên bề mặt trẻ (`apps/web/app/components/kid/badge-celebration-modal.vue`) và tích hợp vào sảnh chơi `/play`.

---

## 2. Thiết kế chi tiết

### 2.1 Từ điển Huy hiệu Kỷ niệm (Badge Definitions)
Định nghĩa metadata giàu cảm xúc cho 3 huy hiệu chuẩn từ `BADGE_REGISTRY`:
- `STRAND_FIRST_COMPLETE`:
  - Tiêu đề: "Chinh Phục Chặng Đầu Tiên!"
  - Lời chúc: "Bé đã hoàn thành xuất sắc chặng khám phá đầu tiên. Gấu Con rất tự hào về bé!"
  - Biểu tượng: Ngôi sao vàng khám phá (SVG sao lấp lánh / badge rực rỡ).
- `WEEK_CURRICULUM_COMPLETE`:
  - Tiêu đề: "Tuần Học Chăm Chỉ!"
  - Lời chúc: "Bé đã cùng Gấu Con đi hết lộ trình học tập của tuần này. Bé thật tuyệt vời!"
  - Biểu tượng: Vòng nguyệt quế / cuốn sách mở nhiệm màu.
- `PLAY_DAYS_5`:
  - Tiêu đề: "Người Bạn Thân Thiết!"
  - Lời chúc: "Bé và Gấu Con đã gắn bó cùng nhau 5 ngày học vui. Mình mãi là bạn tốt nhé!"
  - Biểu tượng: Huy hiệu trái tim / Gấu Con vẫy tay.

### 2.2 Quy tắc Bề mặt Trẻ (Kid Surface Invariants)
- Light-only (CẤM `dark:`).
- Sàn touch $\ge 64$px (nút "Tuyệt vời bé ơi!" chuẩn claymorphism: bo góc `rounded-2xl`, viền 3px, hiệu ứng xẹp 4px khi nhấn).
- CẤM mã màu hex trong `.vue`.
- CẤM điểm số, phần trăm, hay so sánh (`BR-PRG-02`, `BR-PRG-05`).
- Có Mascot Gấu Con chúc mừng (`pose="celebrate"` / `pose="cheer"`).
- Đọc lời chúc mừng bằng audio/speech tổng hợp hoặc SFX reo vui.

### 2.3 Quản lý trạng thái đã xem (Seen Badges Tracking)
- Lưu trữ danh sách mã huy hiệu đã xem vào `localStorage` theo từng hồ sơ trẻ (`mindkid_seen_badges_${childUuid}`).
- Khi sảnh chơi `/play` nạp dữ liệu từ `/api/users/play/map`, đối chiếu danh sách `badges` từ API với danh sách đã xem.
- Nếu có huy hiệu chưa xem, tự động kích hoạt modal chúc mừng cho huy hiệu mới nhất.
- Khi trẻ bấm nút chúc mừng, cập nhật danh sách đã xem và đóng modal.

---

## 3. Các lát cắt triển khai (Slices)

- **S1: Định nghĩa Metadata Huy hiệu & Composable `useBadgeCelebration`**
  - Tạo cấu hình metadata tiếng Việt và hàm so khớp badge chưa xem.
  - Viết unit test cho composable.
- **S2: Xây dựng UI Component `KidBadgeCelebrationModal`**
  - Tạo `apps/web/app/components/kid/badge-celebration-modal.vue`.
  - Thiết kế Claymorphism, Mascot Gấu Con ăn mừng, hiệu ứng hạt pháo hoa nhẹ nhàng.
  - Viết component test với Vitest.
- **S3: Tích hợp vào Sảnh chơi `/play/index.vue`**
  - Gắn composable và modal vào trang sảnh chơi.
  - Kiểm tra tương tác mở / đóng và lưu trạng thái đã xem.
- **S4: Nghiệm thu & Verification**
  - Chạy `pnpm lint` và `pnpm typecheck`.
  - Chạy test toàn bộ luồng.
  - Commit lên nhánh `main`.
