# Giọng văn và Quy chuẩn nội dung

Tài liệu này quy định các tiêu chuẩn về giọng văn, phong cách biểu đạt và quy tắc ngôn ngữ cho toàn bộ nền tảng MindKid theo [`design-system-contract.md`](../specs/08-quality/design-system-contract.md).

## 1. Nguyên tắc cốt lõi về ngôn ngữ

- **Tiếng Việt cho người dùng**: 100% nội dung hiển thị hướng tới người dùng (trẻ em, phụ huynh, giáo viên, quản lý) được thể hiện bằng tiếng Việt tự nhiên, chuẩn mực, giàu tính khích lệ.
- **Tiếng Anh cho kỹ thuật**: Toàn bộ mã nguồn, định danh định tuyến (route), đường dẫn tĩnh (slug), mã lỗi và tên biến kỹ thuật sử dụng tiếng Anh dạng `kebab-case` hoặc `snake_case`. Tuyệt đối không dùng đường dẫn hay slug tiếng Việt có dấu hoặc không dấu trong URL hệ thống.

## 2. Giọng văn trên bề mặt Trẻ nhỏ (Kid Surface)

| Nguyên tắc | Chuỗi mẫu chuẩn | Chuỗi cấm sử dụng |
|---|---|---|
| **Khích lệ, không phán xét** | "Bé thử lại lần nữa nhé!", "Gần đúng rồi!" | "Sai rồi!", "Thất bại!", "Kém quá!" |
| **Rõ ràng, ngắn gọn** | "Tìm hình tròn màu đỏ nào", "Kéo bạn Gấu về nhà" | Các câu chỉ dẫn phức tạp nhiều hơn 10 từ |
| **Không thúc ép** | "Bé cứ từ từ suy nghĩ nhé" | "Nhanh lên!", "Sắp hết giờ rồi!" |

Mọi thông điệp hướng dẫn trẻ bắt buộc phải đi kèm âm thanh đọc lời dẫn (voice narration) tương ứng để hỗ trợ trẻ chưa biết đọc chữ.

## 3. Giọng văn trên bề mặt Phụ huynh và Giáo viên (Parent & Teacher)

- **Minh bạch và điềm đạm**: Trình bày thông tin thanh toán, gói đăng ký và quyền lợi một cách trung thực, rõ ràng. Tuyệt đối không dùng các kỹ thuật tâm lý tiêu cực như đếm ngược giảm giá ảo, thông báo khan hiếm giả tạo hay che giấu nút hủy gói.
- **Dựa trên cơ sở khoa học**: Giải thích sự tiến bộ của trẻ thông qua các mục tiêu học tập cụ thể theo phương pháp Montessori và Dienes, không dùng các từ ngữ phóng đại như "thần đồng", "đột phá trí tuệ".
- **Bảo mật và an tâm**: Nhấn mạnh cam kết bảo vệ dữ liệu cá nhân của trẻ em theo Nghị định 13/2023/NĐ-CP và Luật Trẻ em Việt Nam.

## 4. Xử lý thông báo lỗi (Error Messaging)

- **Thân thiện và hướng giải pháp**: Thông báo lỗi phải nêu rõ hiện tượng bằng ngôn ngữ dễ hiểu và cung cấp hướng dẫn khắc phục cụ thể cho người dùng.
- **Bảo mật thông tin nội bộ**: Tuyệt đối không để lộ mã lỗi nội bộ, dấu vết ngăn xếp (stack trace), hay chi tiết cấu trúc cơ sở dữ liệu lên giao diện người dùng.
