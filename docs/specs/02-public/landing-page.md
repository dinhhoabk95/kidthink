---
spec: LANDING-PAGE
title: Trang chủ
area: public
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Nội dung và thứ tự khối trang chủ
depends_on:
  - PACKAGE-CATALOG
  - GAME-CATALOG-PUBLIC
---

# Trang chủ

## 1. Objective

Chuyển một người lớn chưa biết gì thành **một người đang xem một đứa trẻ chơi thử** trong dưới
60 giây.

Đây là đỉnh phễu. Mọi khối trên trang phục vụ một trong ba việc: giải thích giá trị, tạo
niềm tin, hoặc đưa tới chơi thử.

## 2. Actors

Guest — người lớn. Cấm Trẻ không phải đối tượng của trang này.

## 3. Entry points

`/` · `GET /api/guest/home`.

## 4. Main flow

1. Vào trang chủ.
2. Đọc thông điệp giá trị, thấy nút **"Cho bé chơi thử"** ngay màn hình đầu.
3. Bấm → vào thẳng một game `free`, không cần đăng ký.
4. Chơi xong → lời mời tạo tài khoản để lưu tiến độ.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| User đã đăng nhập | Chuyển thẳng `/me` |
| Từ quảng cáo có tham số chiến dịch | Giữ tham số qua luồng đăng ký |
| Mạng chậm | Prerender tĩnh; ảnh lazy; không chặn nội dung chờ JS |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LND-01` | Nút **chơi thử** ở màn hình đầu, không cần cuộn | Trải nghiệm thuyết phục hơn mô tả |
| `BR-LND-02` | Chơi thử **không cần đăng ký** | Đăng ký trước khi thấy giá trị là rào cản lớn nhất |
| `BR-LND-03` | Trang **prerender tĩnh**, không phụ thuộc JS để hiện nội dung chính | SEO và mạng chậm |
| `BR-LND-04` | Cấm — **NEVER tracking bên thứ ba** trên trang có link tới chính sách trẻ em | `BR-CDC-08` |
| `BR-LND-05` | Giá lấy từ **`PACKAGE_CATALOG`** | `BR-PKG-02` |
| `BR-LND-06` | Cấm — **NEVER hứa hẹn kết quả học tập** — không "giúp bé thông minh hơn", không "tăng IQ" | Vượt ranh giới của một sản phẩm giáo dục và có rủi ro pháp lý |
| `BR-LND-07` | Cấm — **NEVER dùng ảnh trẻ em thật** làm minh hoạ | Nhất quán với ràng buộc dữ liệu trẻ |
| `BR-LND-08` | LCP < **2,5 s** trên 4G | Đảm bảo trải nghiệm tải trang nhanh và tối ưu điểm Core Web Vitals (LCP) |

## 7. Data

### 7.1 Chín khối, theo thứ tự

| # | Khối | Nội dung |
|---|---|---|
| 1 | Hero | Thông điệp giá trị + **CTA chơi thử** + CTA đăng ký |
| 2 | Sáu năng lực | C1–C6, mỗi cái một câu và một biểu tượng |
| 3 | Cách hoạt động | 3 bước: chọn bé → bé chơi → bạn xem tiến bộ |
| 4 | Trò chơi nổi bật | 6 game `free`, chơi được ngay |
| 5 | Chương trình theo tuổi | 3 · 4 · 5 · 6 tuổi |
| 6 | Dùng ở nhà / dùng trên lớp | Hai cột lợi ích, chia theo ngữ cảnh dùng chứ không theo loại người |
| 7 | Các gói | Từ `PACKAGE_CATALOG`, một CTA |
| 8 | Câu hỏi thường gặp | 6 câu, có schema FAQPage |
| 9 | Chân trang | Pháp lý · liên hệ · chính sách trẻ em |

### 7.2 Ngôn ngữ

Tiếng Việt, giọng bình tĩnh. Cấm "đột phá", "thần tốc", "vượt trội".
Nói **được gì** (bé chơi 6 nhóm tư duy, bạn xem tiến bộ hằng tuần), không nói **sẽ thành
gì**.

## 8. API contract

### `GET /api/guest/home`

200 → `{ featured_levels, programs, packages, faq }`. Cache `public, max-age=300`.

Nội dung tĩnh prerender; chỉ phần động (game nổi bật) gọi API.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LND-01 — CTA chơi thử ở màn hình đầu
  When mở trang chủ ở viewport 768x1024
  Then nút chơi thử hiển thị không cần cuộn

Scenario: BR-LND-02 — chơi thử không cần đăng ký
  When bấm chơi thử
  Then game chạy
  And không có bước đăng nhập nào

Scenario: BR-LND-03 — nội dung hiện khi tắt JS
  Given JavaScript bị tắt
  When mở trang chủ
  Then thông điệp giá trị, sáu năng lực, và giá vẫn hiển thị

Scenario: BR-LND-04 — không tracking bên thứ ba
  When mở trang chủ
  Then không request nào tới domain bên thứ ba ngoài CDN của hệ thống

Scenario: BR-LND-06 — không hứa hẹn kết quả
  When đọc toàn bộ nội dung trang
  Then không câu nào hứa tăng trí thông minh hay điểm số

Scenario: BR-LND-07 — không ảnh trẻ thật
  When kiểm mọi ảnh minh hoạ
  Then không ảnh nào là ảnh chụp trẻ em thật

Scenario: BR-LND-08 — LCP đạt mục tiêu
  Given kết nối 4G giả lập
  When đo LCP
  Then dưới 2,5 giây

Scenario: BR-LND-05 — giá khớp catalog
  When so giá trên trang với PACKAGE_CATALOG
  Then khớp hoàn toàn
```

## 10. Boundaries

**Always**
- CTA chơi thử ở màn hình đầu.
- Prerender nội dung chính.
- Lấy giá từ catalog.

**Ask first**
- Đổi thứ tự khối.
- Thêm khối mới.
- Thêm bất kỳ script bên thứ ba nào.

**Never**
- Bắt đăng ký trước khi chơi thử.
- Tracking bên thứ ba.
- Hứa hẹn kết quả học tập.
- Ảnh trẻ em thật.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Có dùng analytics tự host (Plausible/Umami) không?~~ **Đóng 2026-08-09 (T13, `D-AW`)**: không dùng analytics tự host trong P1; theo dõi phễu qua server log & telemetry pipeline | Đo lường phễu | Đã đóng | D-AW |
| ~~2~~ | ~~6 game nổi bật có trùng allow-list guest không?~~ **Đóng 2026-08-09 (T13, `D-AY`)**: trùng khớp 6 level mẫu đại diện D1-D6 template trong guest allow-list — khớp [`access-ladder.md`](../00-foundation/access-ladder.md) Q2 | Danh sách game chơi thử | Đã đóng | D-AY |

