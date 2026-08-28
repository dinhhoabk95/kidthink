# Nguyên tắc thiết kế MindKid

Tài liệu này trình bày tư tưởng cốt lõi và sáu nguyên tắc thiết kế được suy dẫn từ yêu cầu sư phạm và đối tượng sử dụng của MindKid.

## 1. Hướng tiếp cận: "Giấy và Gỗ"

Ngôn ngữ thị giác của MindKid được định hình theo hướng "Giấy và Gỗ" (Paper & Wood):
- **Nền giấy ấm**: Thay thế nền xám lạnh bằng tông màu đá ấm (`surface-50` đến `surface-200`), gợi cảm giác trang giấy học tập thân thiện.
- **Giáo cụ gỗ**: Các vật thể tương tác trên bề mặt trẻ có khối, bóng đổ một hướng, bo tròn mềm mại như những khối gỗ Montessori.
- **Màu nhấn tập trung**: Sử dụng màu xanh mòng két (`brand`) làm điểm tựa nhận diện và màu cam sẫm (`cta`) cho hành động chuyển đổi chính.

Hướng tiếp cận này giúp sản phẩm giữ được sự nghiêm túc, tạo niềm tin với phụ huynh trả phí, đồng thời tạo ra môi trường học tập nhẹ nhàng, tập trung cho trẻ nhỏ.

## 2. Sáu nguyên tắc cốt lõi

### N1. Hình dạng mang nghĩa trước màu
Mọi trạng thái và phân loại phải được nhận biết qua ít nhất hai kênh độc lập (kênh hình dạng kết hợp kênh chữ hoặc biểu tượng), không dựa hoàn toàn vào màu sắc. Quy tắc này neo vào `BR-A11-03` và triết lý Montessori `BR-MTB-14`.
- **Cấm**: Dùng thẻ chỉ khác nhau về màu nền để phân biệt nhóm năng lực mà không có biểu tượng hoặc hình khối riêng.

### N2. Vật liệu, không phải trang trí
Mọi phần tử tương tác cho trẻ phải có cảm giác cầm nắm được: có độ dày, có khối, có phản hồi vật lý khi chạm. Phản hồi thành công tập trung tại đúng điểm tương tác theo `BR-ENG-08`.
- **Cấm**: Sử dụng hiệu ứng hào nhoáng, bóng đổ động hàng loạt làm nặng thiết bị mà không hỗ trợ affordance của tương tác.

### N3. Bình tĩnh là tính năng
Bề mặt phụ huynh và người quản lý hướng tới sự điềm đạm, rõ ràng, nhiều khoảng thở. Mỗi màn hình chỉ có đúng một nút hành động chính theo `BR-DSC-10` và hợp đồng [`landing-page.md`](../specs/02-public/landing-page.md).
- **Cấm**: Sử dụng màu sắc quá gắt, banner động giật gân, hoặc nhiều nút kêu gọi hành động cạnh tranh trên cùng màn hình.

### N4. Không thúc giục
Không sử dụng đồng hồ đếm ngược, chuỗi ngày áp lực (streak), hay điểm số đánh giá trực tiếp trước mặt trẻ theo `BR-ENG-11`, `BR-HPL-05`, và `BR-BRP-08`.
- **Cấm**: Hiển thị bộ đếm thời gian hoặc cảnh báo hết giờ trong lúc trẻ đang chơi trò chơi.

### N5. Sai không bị trừng phạt
Phản hồi khi trẻ làm chưa đúng được truyền tải bằng tông màu hổ phách (`retry`), chuyển động lắc nhẹ và âm thanh êm dịu, tuyệt đối không dùng màu đỏ cảnh báo hay âm thanh buzzer gay gắt theo `BR-DSC-07` và [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md).
- **Cấm**: Dùng màu đỏ, hiệu ứng rung lắc mạnh, hoặc trừ điểm khi trẻ thao tác sai.

### N6. Tối ưu hiệu năng là ràng buộc thiết kế
Mọi lựa chọn thị giác phải vận hành mượt mà 60fps trên thiết bị máy tính bảng Android 2 GB bộ nhớ qua mạng 4G theo [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) và `BR-PRF-01`.
- **Cấm**: Dùng ảnh nền dung lượng lớn, gradient nhiều lớp phức tạp, hoặc phông chữ quá nhiều biến thể gây nặng trang.

## 3. Hai thanh ghi giao diện

Hệ thống quy định hai thanh ghi thị giác rõ rệt nhưng dùng chung một bảng token:

| Tiêu chí | Thanh ghi Người lớn (Public, Parent, Admin) | Thanh ghi Trẻ nhỏ (Kid, Canvas Gameplay) |
|---|---|---|
| **Chế độ màu** | Hỗ trợ cả Light mode và Dark mode | Chỉ hỗ trợ Light mode |
| **Sàn chạm** | 44px (bảng điều khiển chuyên sâu 40px) | 64px đến 96px (sàn chuẩn 76px) |
| **Phông chữ** | Be Vietnam Pro (đọc văn bản dài) | Baloo 2 (chữ số, tiêu đề lớn, nhãn to) |
| **Bo góc** | 12px đến 16px (`rounded-xl`, `rounded-2xl`) | 16px đến 24px (`rounded-2xl`, `rounded-3xl`, `rounded-full`) |
| **Màu lỗi** | `danger` (đỏ chuẩn hệ thống) | `retry` (hổ phách ấm, tuyệt đối không dùng đỏ) |
