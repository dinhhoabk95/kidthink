# Biểu tượng và Hình đại diện

Tài liệu này quy định việc sử dụng biểu tượng SVG hệ thống, ranh giới áp dụng emoji và đặc tả bộ tài nguyên nhận diện theo [`design-system-contract.md`](../specs/08-quality/design-system-contract.md).

## 1. Ranh giới giữa SVG Affordance và Emoji nội dung

| Ngữ cảnh sử dụng | Định dạng bắt buộc | Lý do |
|---|---|---|
| Thanh điều hướng, nút bấm, biểu tượng trạng thái, biểu mẫu, điều khiển HUD | **SVG hệ thống** (`i-lucide-*` qua `<UIcon>`) | Đồng nhất trên mọi hệ điều hành, hỗ trợ đổi màu theo token, mang được vòng nét tiêu điểm (`focus-visible`) |
| Vật thể đếm trong trò chơi, hình dán phần thưởng, biểu tượng trực quan cho trẻ chưa biết đọc chữ | **Emoji hoặc Vector nội dung** | Thể hiện sự vật đời thực phong phú, sinh động |

Theo quy tắc `BR-DSC-05` và `BR-DSC-19`: Tuyệt đối không dùng ký tự emoji làm nhãn nút bấm hoặc biểu tượng chức năng trên thanh điều hướng.

## 2. Hệ thống biểu tượng Lucide

Bộ biểu tượng hệ thống sử dụng độc quyền gói `lucide` thông qua tiền tố `i-lucide-*` của Nuxt UI:
- **Biểu tượng điều hướng**: `i-lucide-home`, `i-lucide-gamepad-2`, `i-lucide-user`, `i-lucide-settings`, `i-lucide-layout-dashboard`.
- **Biểu tượng thao tác**: `i-lucide-arrow-left`, `i-lucide-check`, `i-lucide-x`, `i-lucide-plus`, `i-lucide-trash-2`, `i-lucide-eye`, `i-lucide-refresh-cw`.
- **Biểu tượng 6 nhóm năng lực**:
  - C1 (Toán học): `i-lucide-hash`
  - C2 (Không gian): `i-lucide-box`
  - C3 (Logic): `i-lucide-git-branch`
  - C4 (Quan sát): `i-lucide-scan-eye`
  - C5 (Ngôn ngữ): `i-lucide-messages-square`
  - C6 (Điều hành): `i-lucide-target`

Mọi nút bấm chỉ chứa biểu tượng (icon-only button) bắt buộc phải có thuộc tính `aria-label` mô tả chức năng bằng tiếng Việt rõ ràng.

## 3. Đặc tả 12 ảnh đại diện mặc định (Avatar Presets)

Để bảo vệ quyền riêng tư của trẻ mầm non theo Nghị định 13/2023/NĐ-CP, hệ thống cung cấp 12 ảnh đại diện hình con vật dạng SVG tĩnh, không yêu cầu và không lưu trữ ảnh chân dung thật:
1. `bear`: Gấu nâu thân thiện (màu nâu đất ấm).
2. `rabbit`: Thỏ trắng nhanh nhẹn (màu hồng phấn).
3. `fox`: Cáo cam thông minh (màu cam đất).
4. `cat`: Mèo vàng đáng yêu (màu vàng rơm).
5. `dog`: Chó đốm vui vẻ (màu nâu ấm).
6. `panda`: Gấu trúc hiền hòa (màu xám đậm và trắng).
7. `lion`: Sư tử dũng cảm (màu vàng kim).
8. `elephant`: Voi xám tốt bụng (màu xanh đá).
9. `koala`: Gấu túi điềm tĩnh (màu xám bạc).
10. `owl`: Cú mèo thông thái (màu nâu tím).
11. `tiger`: Hổ con tinh nghịch (màu cam sẫm).
12. `monkey`: Khỉ con hoạt bát (màu nâu ấm).

Các tệp SVG được vẽ theo phong cách "Giấy và Gỗ", viền nét dày 3px, tỷ lệ vuông 1:1, tối ưu dung lượng dưới 5 KB mỗi tệp.

## 4. Đặc tả nhân vật linh vật (Mascot Gấu)

Linh vật chính của MindKid là hình tượng chú Gấu nhỏ, xuất hiện đồng hành cùng trẻ với bốn tư thế tương ứng theo bảng phản hồi tại [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md):
- **Tư thế 1 (Chờ đợi / Vẫy tay)**: Xuất hiện tại sảnh chơi, vẫy tay chào đón trẻ bắt đầu bài học.
- **Tư thế 2 (Suy nghĩ / Khích lệ)**: Xuất hiện khi trẻ cần thử lại, nghiêng đầu suy ngẫm, kèm nhịp rung nhẹ màu hổ phách.
- **Tư thế 3 (Vui mừng)**: Xuất hiện khi trẻ hoàn thành đúng một thao tác, vỗ tay nhỏ tại điểm tương tác.
- **Tư thế 4 (Ăn mừng lớn)**: Xuất hiện khi trẻ hoàn thành toàn bộ màn chơi, nhảy múa cùng các hạt pháo hoa giấy.
