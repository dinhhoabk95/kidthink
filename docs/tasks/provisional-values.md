# Sổ số tạm — mọi con số chưa có phép đo

> Chủ: [`#201`](201-hasty-decision-audit-plan.md) · Cổng: `#204`.
> **Luật:** một con số trong `docs/` hoặc **có phép đo**, hoặc **có hàng ở đây**. Không có loại thứ ba.
> Hàng quá hạn làm cổng đỏ. Danh sách này phải **tự rỗng đi**, cấm — NEVER phình ra.

## Cách dùng

Viết `CHƯA ĐO` ngay **trong câu chứa con số**, không ghi ở cuối file — nhãn cuối file thì người
đọc lướt qua. Rồi thêm một hàng vào bảng dưới.

Gỡ hàng khi task chủ đã trả về phép đo, **trong cùng PR** mang phép đo đó.

## Bảng

| # | Giá trị tạm | Dùng ở | Vì sao chưa đo được / Kết quả đo | Task chủ | Hạn |
|---|---|---|---|---|---|
| H1 | ~~`126 = 3 độ tuổi × (10 chủ đề × 4 + 2)`~~ | `#192` §3 | **Đã đóng 2026-09-01** — nguồn thật là `CUR-J42` 42 tuần × 3 tiết. Mô hình `42/42/42` đã gỡ | `#203` | ✔ đóng |
| H2 | ~~đích `~700` level~~ | `#192` §3 | **Đã đóng 2026-09-01** — `#202` đo tầng vòng: biến thể nằm ở round set (6–10 vòng/level). Đích thật là **384 level** có phép tính kèm tại `#192` §3.2 | `#202` | ✔ đóng |
| H3 | ~~sàn level mỗi kỹ năng~~ | `#192` D5 · `go-live.json` `min_levels_per_skill` | **Đã đóng 2026-09-01** — `#202` đo tầng vòng: sàn giữ **2 level** trải ≥2 khuôn (`BR-LCD-10`), round set 6–10 vòng gánh phần lặp lại | `#202` | ✔ đóng |
| H4 | ~~danh sách **10 chủ đề** chương trình mầm non~~ | `#192` §2.3 | **Đã đóng 2026-09-01** — `#193` đã tra cứu văn bản gốc Bộ GD&ĐT tại `docs/taxonomy/moet-alignment.md` | `#193` | ✔ đóng |
| H5 | ~~cấu trúc tiết **ba pha**~~ | `#192` D7 · cổng `#198` | **Đã đóng 2026-09-01** — `#193` đã chuẩn hoá cấu trúc ba pha theo phương pháp GDMN tại `docs/taxonomy/moet-alignment.md` | `#193` | ✔ đóng |
| H6 | ~~27 cặp `limits` của `GT-028`…`GT-036`~~ | 9 phiếu engine, mục 15 | **Đã đóng 2026-09-01** — 9 khuôn `GT-028`..`GT-036` đã ra đời theo luật khuôn thắng, `check:engine-specs` xanh 36/36 | `#205` | ✔ đóng |
| H7 | ~~ma trận seed mục 13 của 9 phiếu~~ | 9 phiếu engine, mục 13 | **Đã đóng 2026-09-01** — đã chuẩn hoá theo khuôn và level fixture của 9 engine | `#205` | ✔ đóng |
| H8 | ~~`batch: legacy-v1` cho `GT-028`…`GT-036`~~ | 9 phiếu engine, frontmatter | **Đã đóng 2026-09-01** — 9 engine đã vào registry và `engine-spec-planned.json` đã rỗng | `#205` | ✔ đóng |

## Ba con số **đã có** phép đo — cấm ghi nhầm vào đây

| Giá trị | Phép đo |
|---|---|
| `126` tiết | `CUR-J42` 42 tuần × 3 tiết/tuần — `lesson-corpus-depth.md` §7.1 |
| `3.290` level của `#191` | `99×20 + 131×10`, suy thẳng từ hạn ngạch người đặt việc |
| trần vòng `6 · 8 · 10` | `BR-RSM-03`, quyết định `D-167A` 2026-08-31 |
