# Ngôn ngữ thiết kế MindKid

Tài liệu này định hình ngôn ngữ thị giác đầy đủ cho nền tảng MindKid, bổ trợ cho hợp đồng kỹ thuật tại [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) và [`SPEC.md`](../SPEC.md).

## 1. Ranh giới sở hữu

- **Hợp đồng kỹ thuật**: Thuộc [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) và các spec phân hệ tại `docs/specs/`. Giữ toàn bộ ràng buộc bất biến (ID quy tắc `BR-*`, mã lỗi, sàn WCAG, ranh giới API, gating, và bảo mật).
- **Ngôn ngữ thị giác**: Thuộc thư mục này (`docs/design-system/`). Giữ hướng thiết kế, triết lý trải nghiệm, bảng màu trực quan, cặp font, thang chuyển động, và chỉ dẫn thành phần giao diện.

Tuyệt đối không sao chép nguyên văn hợp đồng kỹ thuật sang tài liệu này. Mọi thay đổi về quy tắc nghiệp vụ phải cập nhật tại spec sở hữu trước.

## 2. Danh mục tài liệu

| Tài liệu | Nội dung trọng tâm |
|---|---|
| [`01-principles.md`](01-principles.md) | Sáu nguyên tắc thiết kế và hai thanh ghi (Người lớn / Trẻ nhỏ) |
| [`02-color.md`](02-color.md) | Bảng màu 11 bậc, độ tương phản đo được, bí danh Nuxt UI v4, màu năng lực C1-C6 |
| [`03-typography.md`](03-typography.md) | Cặp phông chữ Baloo 2 & Be Vietnam Pro, thang kích thước và quy tắc hiển thị tiếng Việt |
| [`04-iconography.md`](04-iconography.md) | Biểu tượng SVG hệ thống, ranh giới emoji nội dung và bản đặc tả 12 ảnh đại diện |
| [`05-motion-and-surface.md`](05-motion-and-surface.md) | Thang thời lượng chuyển động, độ nổi bề mặt, hiệu ứng nhiễu và thông số vẽ canvas |
| [`06-voice.md`](06-voice.md) | Giọng văn và quy chuẩn nội dung hiển thị tiếng Việt |

## 3. Ngăn xếp công nghệ

Hệ thống giao diện được hiện thực hóa thông qua Nuxt UI v4 và Tailwind CSS v4, kế thừa từ gói `@mindkid/ui`. Mọi token giao diện được định nghĩa tập trung và nạp vào các ứng dụng thông qua cơ chế Nuxt Layer.
