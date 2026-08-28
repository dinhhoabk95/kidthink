# Chuyển động và Bề mặt

Tài liệu này quy định thang thời lượng chuyển động, cấu trúc độ nổi bề mặt và thông số kết xuất canvas cho hệ thống MindKid theo [`design-system-contract.md`](../specs/08-quality/design-system-contract.md).

## 1. Thang chuyển động (Motion Scale)

Hệ thống quy định 5 token thời lượng chuyển động chuẩn:

| Token | Thời lượng | Đường cong chuyển động (`timing-function`) | Ứng dụng thực tế |
|---|---|---|---|
| `--duration-instant` | 90ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Phản hồi nhấn nút lập tức (`:active`) |
| `--duration-quick` | 160ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Chuyển đổi mờ dần, hiển thị tooltip |
| `--duration-base` | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Mở rộng danh sách, chuyển thẻ thông tin |
| `--duration-snap` | 260ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Thao tác thả khớp đối tượng (drag-and-snap) |
| `--duration-settle` | 340ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Vật thể quay về vị trí nghỉ ban đầu |

### Tôn trọng tùy chọn giảm chuyển động (`prefers-reduced-motion`)
Theo quy tắc `BR-A11-10`, khi người dùng bật chế độ giảm chuyển động trên hệ điều hành:
- Giảm toàn bộ thời lượng chuyển động về 0ms hoặc thay thế bằng hiệu ứng chuyển sắc mờ (fade) 90ms đơn giản.
- Tuyệt đối không làm mất kênh phản hồi thị giác hoặc thay đổi quy luật tính điểm của trò chơi.

## 2. Cấu trúc độ nổi bề mặt (Surface & Elevation)

Bề mặt giao diện của MindKid sử dụng kỹ thuật đổ bóng kép (Dual-layer Elevation) kết hợp giữa khối chân đặc (Slab) và bóng đổ mềm (Ambient Shadow):
- **Trạng thái bình thường**: `box-shadow: 0 6px 0 var(--color-surface-300), 0 10px 18px rgba(87, 83, 78, 0.12)`.
- **Trạng thái nhấn (`:active`)**: Khối chân xẹp xuống còn 2px và phần tử dịch chuyển xuống 4px (`transform: translateY(4px)`).
- **Lớp vân giấy (Paper Noise)**: Bề mặt người lớn được phủ một lớp nhiễu SVG mờ 3% cố định để tăng chiều sâu mà không tiêu tốn bộ nhớ xử lý ảnh.

## 3. Đặc tả kết xuất đồ họa Canvas 2D

Dành cho phân hệ trò chơi tại `packages/game-engine/`:

### Bốn lượt vẽ hiệu ứng khối (Clay Pass)
1. **Lượt 1 (Chân bóng)**: Vẽ hình chữ nhật bo góc với màu viền tối hơn 20%, dịch xuống trục Y.
2. **Lượt 2 (Thân khối)**: Vẽ thân hình chính với màu nền token tương ứng.
3. **Lượt 3 (Vệt sáng trên)**: Vẽ dải sáng mảnh (highlight) ở mép trên để tạo độ cong.
4. **Lượt 4 (Nội dung)**: Kết xuất biểu tượng hoặc văn bản với tâm cân bằng.

### Thang kích thước chữ theo chiều cao Canvas
Kích thước phông chữ trong canvas được tính theo tỷ lệ chiều cao logic (chuẩn 540px):
- **Chữ số trung tâm (`number`)**: `0.089 * height` (~48px).
- **Tiêu đề lớn (`display`)**: `0.081 * height` (~44px).
- **Nhãn phần tử (`label`)**: `0.052 * height` (~28px).
- **Thanh điều khiển (`hud`)**: `0.044 * height` (~24px).
- **Chú thích (`caption`)**: `0.036 * height` (~20px).
- **Sàn tối thiểu tuyệt đối**: Không bao giờ vẽ chữ dưới 16px.

### Kết xuất Emoji trên Canvas
Để đảm bảo emoji có độ nét cao và chiều sâu trên mọi màn hình:
- Vẽ emoji bằng hai lượt gọi `fillText` liên tiếp: lượt một tạo bóng nhẹ với độ mờ 20%, lượt hai vẽ màu thực tế với bộ phông chữ ghim chuẩn `"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"`.
