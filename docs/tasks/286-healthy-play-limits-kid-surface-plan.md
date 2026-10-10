# Task #286 Plan: Màn hình Giới hạn Giờ chơi Lành mạnh cho Trẻ em (Kid Play Limit Surface)

## 1. Bối cảnh & Mục tiêu

- Contract: [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) (`BR-HPL-01..08`), đặc biệt §7.3.
- Khi trẻ đạt hạn mức giờ chơi trong ngày (`daily_play_cap_minutes`), hệ thống backend trả về lỗi `DAILY_PLAY_CAP_REACHED` (HTTP 402) tại cổng kiểm soát truy cập `assertContentAccess`.
- Hiện tại, tầng UI bề mặt trẻ chưa bắt lỗi này chuyên biệt, dẫn tới màn hình lỗi kỹ thuật "😿 Chưa tải được trò chơi" và nút liên kết sai về `/games` (trang danh mục người lớn thay vì sảnh trẻ `/play`).
- Mục tiêu:
  1. Tạo component `KidPlayLimitModal` chuẩn Kid Surface (claymorphism, sàn chạm $\ge 64$px, không hex color, Mascot Gấu Con ấm áp, 2 hoạt động ngoài màn hình).
  2. Bổ sung xử lý lỗi `DAILY_PLAY_CAP_REACHED` trong `usePlayError`.
  3. Tích hợp luồng xin thêm giờ qua `ParentGateModal` và gọi API `POST /api/users/children/[uuid]/grant-extra-time`.
  4. Sửa các nút fallback trên trang chơi trẻ em để quay về `/play` thay vì `/games`.

---

## 2. Thiết kế chi tiết

### 2.1 Composable `usePlayError`
- Bổ sung `isPlayLimitReached: Ref<boolean>`.
- Khi `code === "DAILY_PLAY_CAP_REACHED"` hoặc `status === 402`:
  - `isPlayLimitReached.value = true`.
  - Thiết lập tiêu đề "Hôm nay bé chơi đủ rồi", emoji "🌟", thông điệp ấm áp không trách móc (`BR-HPL-04`).

### 2.2 Component `KidPlayLimitModal`
- **Mascot Gấu Con**: `pose="idle"` chào tạm biệt thân thiện.
- **Lời dẫn**: "Hôm nay bé chơi giỏi lắm rồi! Mai mình chơi tiếp nhé."
- **2 gợi ý hoạt động ngoài màn hình** (random từ danh sách hoạt động bổ ích):
  - 🎨 "Vẽ một bức tranh thật đẹp tặng người thân"
  - 🧱 "Xếp hình lego hoặc đồ chơi yêu thích"
  - 🏃 "Vận động ngoài trời cùng bạn bè"
  - 📖 "Cùng ba mẹ đọc một cuốn truyện tranh"
- **Nút tương tác**:
  - Nút 1: "Nghỉ ngơi thôi" (`min-h-16`, về sảnh `/play`).
  - Nút 2: "Nhờ ba mẹ mở thêm" (`min-h-16`): mở `ParentGateModal`. Khi phụ huynh vượt qua cổng toán, hiển thị tùy chọn cấp thêm 15 hoặc 30 phút và gọi API cấp thêm giờ.

### 2.3 Tích hợp tại `apps/web/app/pages/play/[code].vue`
- Bắt sự kiện hết giờ chơi và hiển thị `KidPlayLimitModal`.
- Sửa các đường link fallback `to="/games"` thành `to="/play"`.

---

## 3. Kế hoạch triển khai

- **S1 — Composable & Xử lý lỗi**: Cập nhật `usePlayError` và test đơn vị.
- **S2 — UI Component**: Tạo `KidPlayLimitModal.vue` và component test.
- **S3 — Tích hợp & Sửa fallback**: Gắn vào `pages/play/[code].vue` và trang chơi.
- **S4 — Verification**: Chạy Biome lint, typecheck, tests, commit `main`.
