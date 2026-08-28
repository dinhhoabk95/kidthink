# Bảng màu và ánh xạ token

Tài liệu này quy định bảng màu 11 bậc cho toàn bộ hệ thống MindKid và cách ánh xạ vào Nuxt UI v4 theo quy định tại [`design-system-contract.md`](../specs/08-quality/design-system-contract.md).

## 1. Bảng màu 11 bậc (50–950)

Mỗi họ màu bắt buộc có đủ 11 bậc (từ 50 đến 950) nhằm đáp ứng trọn vẹn các trạng thái tương tác của Nuxt UI v4 (nền nhạt, hover, focus-visible, active, viền) theo quy tắc `BR-DSC-20`.

| Họ màu | Điểm neo 600 | Tỷ lệ tương phản chữ trắng | Ứng dụng chính |
|---|---|---:|---|
| **brand** | `#1a7f6b` (Teal) | 5,0:1 | Màu nhận diện thương hiệu, liên kết, trạng thái đang chọn |
| **cta** | `#c2410c` (Cam đất) | 5,2:1 | Nút kêu gọi hành động chính duy nhất mỗi trang |
| **surface** | `#57534e` (Đá ấm) | 7,5:1 | Nền trang, thẻ thông tin, đường viền, văn bản trung tính |
| **retry** | `#d97706` (Hổ phách) | 3,2:1 | Trạng thái thử lại cho bề mặt trẻ (thay thế màu đỏ) |
| **success** | `#15803d` (Xanh lá) | 5,1:1 | Thông báo thành công, hoàn thành bài học |
| **warning** | `#b45309` (Vàng nâu) | 5,0:1 | Cảnh báo hạn mức, lưu ý phụ huynh |
| **danger** | `#b91c1c` (Đỏ) | 5,6:1 | Lỗi hệ thống, thao tác hủy (chỉ dùng cho người lớn) |

Chi tiết mã màu từng bậc được đồng bộ giữa tệp định kiểu `packages/ui/assets/css/tailwind.css` và hằng số TypeScript tại `packages/game-engine/src/systems/designTokens.ts`.

## 2. Ánh xạ bí danh trong Nuxt UI v4

Nuxt UI v4 quản lý màu thông qua các bí danh ngữ nghĩa. Cấu hình tại `packages/ui/app.config.ts` thiết lập ánh xạ như sau:

| Bí danh Nuxt UI | Họ màu thực tế | Phạm vi áp dụng |
|---|---|---|
| `primary` | `brand` | Mặc định cho toàn bộ thành phần giao diện, nút bấm phụ, tab đang chọn |
| `neutral` | `surface` | Thẻ card, ô nhập liệu, đường viền, thanh cuộn |
| `cta` | `cta` | Nút hành động chính tại trang công khai và trang tài khoản |
| `retry` | `retry` | Nút tương tác và phản hồi trên giao diện trẻ nhỏ |
| `info` | `brand` | Hộp thông báo thông tin |
| `secondary` | `surface` | Nút hành động thứ cấp |
| `success` | `success` | Trạng thái thành công |
| `warning` | `warning` | Cảnh báo bảo mật hoặc cấu hình |
| `error` | `danger` | Thông báo lỗi trên bề mặt người lớn |

## 3. Màu sắc sáu nhóm năng lực (C1–C6)

Mỗi nhóm năng lực tư duy được gán một bộ nhận diện gồm ba kênh: mã màu, hình khối, và biểu tượng theo nguyên tắc N1:

| Mã | Năng lực tư duy | Mã màu chính | Biểu tượng | Hình khối đặc trưng |
|---|---|---|---|---|
| **C1** | Tư duy Toán học | `#1d4ed8` (Lam) | `i-lucide-hash` | Hình tròn |
| **C2** | Tư duy Không gian | `#7c3aed` (Tím) | `i-lucide-box` | Hình vuông |
| **C3** | Tư duy Logic | `#4d7c0f` (Lục) | `i-lucide-git-branch` | Hình tam giác |
| **C4** | Tư duy Quan sát | `#0e7490` (Xanh mây) | `i-lucide-scan-eye` | Hình thoi |
| **C5** | Tư duy Ngôn ngữ | `#be185d` (Hồng đậm) | `i-lucide-messages-square` | Hình giọt nước |
| **C6** | Chức năng Điều hành | `#a16207` (Nâu đất) | `i-lucide-target` | Hình lục giác |

## 4. Kiểm thử tự động khả năng tiếp cận

Bộ kiểm thử tại `packages/ui/tests/tokens.test.ts` và `packages/ui/tests/a11y.test.ts` thực thi hai cơ chế xác thực:
1. **Kiểm tra độ tương phản**: Mọi cặp màu chữ và nền văn bản phải đạt tỷ lệ tối thiểu 4,5:1 (hoặc 3,0:1 với phần tử đồ họa và văn bản lớn) theo tiêu chuẩn WCAG 2.1 AA (`BR-A11-02`).
2. **Mô phỏng mù màu**: Mô phỏng quang phổ khiếm thị màu đỏ-xanh lá (Deuteranopia) để đảm bảo các màu trạng thái vẫn phân biệt được rõ ràng.
