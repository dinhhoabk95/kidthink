# Kiểm trình duyệt #283 — khay nhiều hàng, lời dẫn cột ở điện thoại ngang (2026-10-03)

Chromium headless (Playwright), Node 24, `nuxt dev` cổng 3000, DB `mindkid`, **khách chưa đăng nhập**
(`/play/<level>`), ba khung 390x844 (`m`), 844x390 (`l`, canvas ≈ 800x243–263 CSS) và 1024x768 (`t`).
Mỗi mã engine một level `free` đã publish, ưu tiên level có `content_pack` dài nhất mà khách mở được
(`GET /api/guest/levels/<code>/config` trả 200). Chờ 2,5 giây rồi chụp JPEG. Bắt `pageerror` và `console.error`.
Kết quả thô: `report.json` (cùng thư mục).

## Kết quả

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Trang tải được, có canvas, không `pageerror`/`console.error` | ĐẠT — 60/60 ảnh, 0 lỗi | `report.json` |
| Điện thoại ngang: lời dẫn là **cột bên trái** (gấu ở đầu, loa ngay dưới), sân khấu ở giữa | ĐẠT | mọi ảnh `*-l844x390.jpg`, ví dụ `GT-004-…-l844x390.jpg`, `GT-002-…-l844x390.jpg` |
| Điện thoại ngang có khay: **khay cột** bên phải sân khấu, vật xếp hai hàng | ĐẠT | `GT-004-GL-C5-WRT-PAIR-0001-l844x390.jpg` (4 vật, 2×2) |
| Portrait có khay: khay nhiều hàng dưới sân khấu | ĐẠT | `GT-004-…-m390x844.jpg` (4 vật, 2×2; khay một hàng khi chỉ 2 vật như `GT-021-…-m390x844.jpg`) |
| Nút hành động `zones.action` ở góc dưới phía cuối dòng, cùng chỗ khi có hay không có khay | ĐẠT | `GT-002-…-l844x390.jpg` (✓ mờ chờ chọn) |
| Máy tính bảng giữ lời dẫn dải trên cùng | ĐẠT | các ảnh `*-t1024x768.jpg` |

## Ghi nhận

1. **GT-008 điện thoại ngang** (`GT-008-GL-C5-LIS-SLOT-0001-l844x390.jpg`): hàng ô đích thứ hai bị cắt ở đáy canvas. Đúng nợ vật lý đã đo ở `stage-engines-b3.test.ts` (GT-008 band 3-4 điện thoại ngang 227 ca): sàn chạm 96 px CSS trên canvas cao 250 px không chừa chỗ cho hai ô đích có nhãn.
2. Cột lời dẫn ở điện thoại ngang không có chữ phụ (chữ cho người lớn, `BR-PSZ-09`); picto chỉ hiện khi còn chỗ dưới loa.

## Chưa kiểm (không tick checkpoint)

- **Chỉ 20/37 engine**: khách chỉ mở được GT-000, 001, 002, 003, 004, 005, 007, 008, 009, 010, 012, 013, 018, 019, 020, 021, 022, 023, 025, 034. Còn 17 engine (GT-006, 011, 014, 015, 016, 017, 024, 026, 027, 028, 029, 030, 031, 032, 033, 035, 036) bị khoá bậc, đòi làm quen (`428 INTRO_REQUIRED`) hoặc không có level `free` — cần tài khoản đăng nhập và chạy GT-000 trước.
- **Chưa chơi**: chỉ chụp màn đầu vòng. Chưa kiểm kéo thả, chạm, nộp bài trên trình duyệt thật.
- **Chưa xoay máy giữa vòng**, chưa bật `prefers-reduced-motion`, chưa chạm bằng touchscreen thật.
- **Chưa kiểm vòng đổi số vật khay** (`BR-PSZ-13` tính lại vùng ở đầu vòng): chỉ có test đơn vị ở `session-zones.test.ts`, chưa thấy trên trình duyệt thật.
- `/play/preview-sandbox` không dùng khung (xem `play-stage-zones.md` mục 5).

Máy chủ dev đã dừng.
