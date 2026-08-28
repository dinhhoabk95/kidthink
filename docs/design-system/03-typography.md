# Kiểu chữ và Quy chuẩn ngôn ngữ

Tài liệu này quy định cặp phông chữ, thang kích thước và các quy chuẩn hiển thị văn bản tiếng Việt cho hệ thống MindKid theo [`design-system-contract.md`](../specs/08-quality/design-system-contract.md).

## 1. Cặp phông chữ hệ thống

Hệ thống sử dụng hai phông chữ chính được lưu trữ cục bộ (self-hosted) thông qua mô-đun `@nuxt/fonts`:

| Vai trò | Phông chữ | Phân tập ký tự | Ứng dụng |
|---|---|---|---|
| `--font-heading` | **Baloo 2** (Variable) | `vietnamese`, `latin` | Tiêu đề các cấp, nút bấm, nhãn lớn trên bề mặt trẻ, chữ số hiển thị trong màn chơi canvas |
| `--font-sans` | **Be Vietnam Pro** (Variable) | `vietnamese`, `latin` | Văn bản nội dung, biểu mẫu thông tin, bảng quản trị, tài liệu pháp lý và hướng dẫn phụ huynh |

Tự lưu trữ phông chữ nhằm tuân thủ quy tắc bảo mật không gọi tài nguyên bên thứ ba tại trang công khai (`BR-LND-04`) và tối ưu hóa thời gian hiển thị nội dung (LCP).

## 2. Thang kích thước chữ

| Cấp bậc | Kích thước (Tailwind) | Dòng cao (`leading`) | Đối tượng áp dụng |
|---|---|---|---|
| **display** | 36px–48px (`text-4xl` đến `text-5xl`) | 1,2–1,3 | Tiêu đề trang chủ, số lượng đếm trong game |
| **heading** | 24px–30px (`text-2xl` đến `text-3xl`) | 1,3–1,4 | Tiêu đề mục lớn, tên trò chơi |
| **subheading** | 18px–20px (`text-lg` đến `text-xl`) | 1,4–1,5 | Tiêu đề thẻ bài học, nút bấm tương tác trẻ em |
| **body** | 16px (`text-base`) | 1,5–1,6 | Nội dung đọc chính (sàn tối thiểu trên thiết bị di động theo `BR-A11-08`) |
| **caption** | 14px (`text-sm`) | 1,4 | Chú thích phụ, thông số bảng quản trị (người lớn) |

Tuyệt đối không sử dụng kích thước dưới 16px cho văn bản nội dung chính trên thiết bị di động hoặc các ô nhập liệu (tránh hiện tượng tự động phóng to trên trình duyệt iOS).

## 3. Quy chuẩn hiển thị tiếng Việt

Tiếng Việt có hệ thống dấu thanh xếp tầng theo chiều dọc. Để đảm bảo tính khả dụng và thẩm mỹ:
1. **Chiều cao dòng (`line-height`)**: Luôn đặt tối thiểu 1,4 lần kích thước chữ cho mọi đoạn văn tiếng Việt. Không dùng các lớp căn chỉnh chiều cao dòng quá hẹp làm đè dấu.
2. **Cấm viết hoa toàn bộ (`uppercase`)**: Tuyệt đối không áp dụng kiểu chữ viết hoa toàn bộ (`uppercase`) lên các chuỗi tiếng Việt có dấu. Việc viết hoa làm mất tỷ lệ nhận diện tự nhiên của dấu thanh và gây khó khăn cho người khiếm thị theo `BR-A11-09`.
3. **Chữ số trong bảng tính và trò chơi**: Luôn sử dụng thuộc tính `tabular-nums` cho các dãy số đếm và điểm số để tránh hiện tượng rung lắc bố cục khi giá trị thay đổi.
