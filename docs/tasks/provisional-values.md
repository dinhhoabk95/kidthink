# Sổ số tạm — mọi con số chưa có phép đo

> Chủ: [`#201`](201-hasty-decision-audit-plan.md) · Cổng: `#204`.
> **Luật:** một con số trong `docs/` hoặc **có phép đo**, hoặc **có hàng ở đây**. Không có loại thứ ba.
> Hàng quá hạn làm cổng đỏ. Danh sách này phải **tự rỗng đi**, cấm — NEVER phình ra.

## Cách dùng

Viết `CHƯA ĐO` ngay **trong câu chứa con số**, không ghi ở cuối file — nhãn cuối file thì người
đọc lướt qua. Rồi thêm một hàng vào bảng dưới.

Gỡ hàng khi task chủ đã trả về phép đo, **trong cùng PR** mang phép đo đó.

## Bảng

| # | Giá trị tạm | Dùng ở | Vì sao chưa đo được | Task chủ | Hạn |
|---|---|---|---|---|---|
| H1 | ~~`126 = 3 độ tuổi × (10 chủ đề × 4 + 2)`~~ | `#192` §3 | **Đã đóng 2026-09-01** — nguồn thật là `CUR-J42` 42 tuần × 3 tiết. Mô hình `42/42/42` đã gỡ | `#203` | ✔ đóng |
| H2 | ~~đích `~700` level~~ | `#192` §3 | **Đã gỡ 2026-09-01** — chơi lại thuộc tầng `game_level_rounds`, không thuộc tầng level | `#202` | ✔ gỡ, chờ số thật |
| H3 | sàn level mỗi kỹ năng | `#192` D5 · `go-live.json` `min_levels_per_skill` | Chưa có số liệu phiên chơi. Sàn đúng phụ thuộc số vòng mỗi set và nhịp chơi lại | `#202` | trước đợt 5b |
| H4 | danh sách **10 chủ đề** chương trình mầm non | `#192` §2.3 | Chưa tra văn bản gốc Bộ GD&ĐT | `#193` | chặn `#194` |
| H5 | cấu trúc tiết **ba pha** | `#192` D7 · cổng `#198` | Chưa tra văn bản gốc. `#198` định cưỡng chế cấu trúc này | `#193` | chặn `#198` |
| H6 | 27 cặp `limits` của `GT-028`…`GT-036` | 9 phiếu engine, mục 15 | Người viết phiếu suy từ plan. `BR-ESS-02` sẽ cưỡng chế khi khuôn ra đời | `#205` | mỗi mã đóng khi `#181`–`#189` dựng khuôn |
| H7 | ma trận seed mục 13 của 9 phiếu | 9 phiếu engine, mục 13 | Tự đặt. Cổng không đối chiếu số này với registry nên hỏng im lặng | `#205` | cùng H6 |
| H8 | `batch: legacy-v1` cho `GT-028`…`GT-036` | 9 phiếu engine, frontmatter | Từ vựng lô hợp lệ; chỉ là chọn giữa các giá trị có sẵn | `#205` | không chặn gì |

## Ba con số **đã có** phép đo — cấm ghi nhầm vào đây

| Giá trị | Phép đo |
|---|---|
| `126` tiết | `CUR-J42` 42 tuần × 3 tiết/tuần — `lesson-corpus-depth.md` §7.1 |
| `3.290` level của `#191` | `99×20 + 131×10`, suy thẳng từ hạn ngạch người đặt việc |
| trần vòng `6 · 8 · 10` | `BR-RSM-03`, quyết định `D-167A` 2026-08-31 |
