# Báo cáo Tổng kết Kiểm toán UI/UX Trực quan & Chất lượng Code (Montessori 22 Tập PDF)

> **Chuẩn kiểm toán:** `/ui-ux-pro-max` (Claymorphism, Touch Floor ≥ 64px, WCAG AA Contrast ≥ 4.5:1, Light Mode Only, Bố cục 5-Zone 960×540) + `/code-review-and-quality` (5 trục: Tính đúng đắn, Khả năng đọc, Kiến trúc, Bảo mật, Hiệu năng).

---

## 1. Số liệu Tổng quan

| Chỉ số | Kết quả |
|---|---|
| **Tổng số tập PDF Montessori** | **22/22 tập** (`chang-00-intro` .. `chang-21`, 496 trang PDF gốc) |
| **Tổng số màn chơi Montessori đã capture trực tiếp** | **262/262 màn chơi** (`960×540` logic space, `1920×1080` DPR 2) |
| **Tỷ lệ đạt Geometry Probe (`judgeCanvas`)** | **262/262 ĐẠT (`100%x100%`)** — 0 lỗi cắt hình, 0 lỗi tràn biên, 0 lỗi console/pageerror |
| **Tổng số game levels trong kho Seeder (`@mindkid/content`)** | **2,135/2,135 levels** vượt qua 10/10 cổng `check-seed-gates.ts` và 8/8 cổng `seed-check.ts` |
| **Báo cáo kiểm toán UI/UX chi tiết theo từng tập** | **22/22 file** `docs/specs/montessori-pipeline/<chang-slug>-ui-ux-review.md` |

---

## 2. Danh mục 22 Báo cáo Kiểm toán UI/UX & Ảnh chụp Trực tiếp

| Tập | Slug | Số màn Capture | Geometry Probe | Báo cáo UI/UX & Code Quality | Thư mục Ảnh Capture |
|---|---|---:|---|---|---|
| 00 | `chang-00-intro` | 15 | 15/15 ĐẠT (`100%x100%`) | [chang-00-intro-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-00-intro-ui-ux-review.md) | [docs/montessori/captures/chang-00-intro/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-00-intro) |
| 01 | `chang-01` | 15 | 15/15 ĐẠT (`100%x100%`) | [chang-01-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-01-ui-ux-review.md) | [docs/montessori/captures/chang-01/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-01) |
| 02 | `chang-02` | 12 | 12/12 ĐẠT (`100%x100%`) | [chang-02-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-02-ui-ux-review.md) | [docs/montessori/captures/chang-02/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-02) |
| 03 | `chang-03` | 10 | 10/10 ĐẠT (`100%x100%`) | [chang-03-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-03-ui-ux-review.md) | [docs/montessori/captures/chang-03/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-03) |
| 04 | `chang-04` | 11 | 11/11 ĐẠT (`100%x100%`) | [chang-04-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-04-ui-ux-review.md) | [docs/montessori/captures/chang-04/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-04) |
| 05 | `chang-05` | 10 | 10/10 ĐẠT (`100%x100%`) | [chang-05-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-05-ui-ux-review.md) | [docs/montessori/captures/chang-05/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-05) |
| 06 | `chang-06` | 14 | 14/14 ĐẠT (`100%x100%`) | [chang-06-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-06-ui-ux-review.md) | [docs/montessori/captures/chang-06/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-06) |
| 07 | `chang-07` | 11 | 11/11 ĐẠT (`100%x100%`) | [chang-07-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-07-ui-ux-review.md) | [docs/montessori/captures/chang-07/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-07) |
| 08 | `chang-08` | 13 | 13/13 ĐẠT (`100%x100%`) | [chang-08-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-08-ui-ux-review.md) | [docs/montessori/captures/chang-08/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-08) |
| 09 | `chang-09` | 10 | 10/10 ĐẠT (`100%x100%`) | [chang-09-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-09-ui-ux-review.md) | [docs/montessori/captures/chang-09/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-09) |
| 10 | `chang-10` | 10 | 10/10 ĐẠT (`100%x100%`) | [chang-10-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-10-ui-ux-review.md) | [docs/montessori/captures/chang-10/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-10) |
| 11 | `chang-11` | 12 | 12/12 ĐẠT (`100%x100%`) | [chang-11-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-11-ui-ux-review.md) | [docs/montessori/captures/chang-11/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-11) |
| 12 | `chang-12` | 11 | 11/11 ĐẠT (`100%x100%`) | [chang-12-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-12-ui-ux-review.md) | [docs/montessori/captures/chang-12/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-12) |
| 13 | `chang-13` | 13 | 13/13 ĐẠT (`100%x100%`) | [chang-13-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-13-ui-ux-review.md) | [docs/montessori/captures/chang-13/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-13) |
| 14 | `chang-14` | 14 | 14/14 ĐẠT (`100%x100%`) | [chang-14-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-14-ui-ux-review.md) | [docs/montessori/captures/chang-14/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-14) |
| 15 | `chang-15` | 16 | 16/16 ĐẠT (`100%x100%`) | [chang-15-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-15-ui-ux-review.md) | [docs/montessori/captures/chang-15/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-15) |
| 16 | `chang-16` | 11 | 11/11 ĐẠT (`100%x100%`) | [chang-16-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-16-ui-ux-review.md) | [docs/montessori/captures/chang-16/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-16) |
| 17 | `chang-17` | 10 | 10/10 ĐẠT (`100%x100%`) | [chang-17-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-17-ui-ux-review.md) | [docs/montessori/captures/chang-17/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-17) |
| 18 | `chang-18` | 11 | 11/11 ĐẠT (`100%x100%`) | [chang-18-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-18-ui-ux-review.md) | [docs/montessori/captures/chang-18/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-18) |
| 19 | `chang-19` | 10 | 10/10 ĐẠT (`100%x100%`) | [chang-19-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-19-ui-ux-review.md) | [docs/montessori/captures/chang-19/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-19) |
| 20 | `chang-20` | 11 | 11/11 ĐẠT (`100%x100%`) | [chang-20-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-20-ui-ux-review.md) | [docs/montessori/captures/chang-20/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-20) |
| 21 | `chang-21` | 12 | 12/12 ĐẠT (`100%x100%`) | [chang-21-ui-ux-review.md](file:///Users/macbook/tinimath/mindkid/docs/specs/montessori-pipeline/chang-21-ui-ux-review.md) | [docs/montessori/captures/chang-21/](file:///Users/macbook/tinimath/mindkid/docs/montessori/captures/chang-21) |

---

## 3. Các Lỗi Thị giác & UI/UX Phát hiện qua Ảnh Chụp và Đã Khắc phục Triệt để

1. **Hiển thị nhầm dâu tây dự phòng (`🍓`) trên thẻ `GT-000` (`chang-00-intro`, `chang-01`)**:
   - **Nguyên nhân**: [gt-000.ts](file:///Users/macbook/tinimath/mindkid/packages/content/src/builders/gt-000.ts) gọi `resolveItemAsset(item)` với mặc định `preferGlyph = true`, khiến item có `glyph: "1"` bị trả về chuỗi `"1"` (không phải emoji) nên `GT-000` fallback sang `🍓`.
   - **Khắc phục**: Đổi thành `resolveItemAsset(item, false)` trong [gt-000.ts](file:///Users/macbook/tinimath/mindkid/packages/content/src/builders/gt-000.ts) để `GT-000` hiển thị đúng emoji ngữ nghĩa (`🐘` chú voi, `🏠` ngôi nhà, `🍄` cây nấm).
2. **Lỗi ngữ pháp tiếng Việt `"kéo các hai bông hoa"` trên `GT-003` (`chang-01`)**:
   - **Nguyên nhân**: Hàm `formatPluralNoun` trong [preschool-terminology.ts](file:///Users/macbook/tinimath/mindkid/packages/shared/src/preschool-terminology.ts) tự động ghép `"các "` vào trước nhãn đã bắt đầu bằng số đếm (`"hai bông hoa"`).
   - **Khắc phục**: Cập nhật `formatPluralNoun` trong [preschool-terminology.ts](file:///Users/macbook/tinimath/mindkid/packages/shared/src/preschool-terminology.ts) để giữ nguyên cụm danh từ khi đã bắt đầu bằng từ chỉ số lượng (`một`, `hai`, `ba`, ..., `các`, `những`).
3. **Lặp từ trong câu lệnh hướng dẫn `"số số 8 trước số 9"` (`chang-02`, `chang-06`)**:
   - **Nguyên nhân**: `prompt_template` trong [C1.NREC.10.ts](file:///Users/macbook/tinimath/mindkid/packages/content/src/skills/c1/nrec/C1.NREC.10.ts) và [C1.NREC.11.ts](file:///Users/macbook/tinimath/mindkid/packages/content/src/skills/c1/nrec/C1.NREC.11.ts) viết `"Số nào đứng ngay trước số {label}?"` trong khi `{label}` đã là `"số 8 trước số 9"`.
   - **Khắc phục**: Rút gọn `prompt_template` thành `"Bé hãy chọn {label} nhé!"`.
4. **Hiển thị mã chữ `"A1"`, `"B1"` thay vì icon hoa quả trên bài quy luật (`chang-15`)**:
   - **Nguyên nhân**: Các item trong [C1.PAT.01.ts](file:///Users/macbook/tinimath/mindkid/packages/content/src/skills/c1/pat/C1.PAT.01.ts), [C1.PAT.02.ts](file:///Users/macbook/tinimath/mindkid/packages/content/src/skills/c1/pat/C1.PAT.02.ts), [C1.PAT.04.ts](file:///Users/macbook/tinimath/mindkid/packages/content/src/skills/c1/pat/C1.PAT.04.ts) khai báo `glyph: "A1"`, `"B1"`, khiến engine ưu tiên vẽ chữ `"A1"`, `"B1"` thay vì emoji trái cây (`🍎`, `🍌`, `🍓`, `🍋`).
   - **Khắc phục**: Gỡ bỏ thuộc tính `glyph` mã kỹ thuật khỏi các item quy luật để canvas vẽ đúng hình ảnh trực quan cho trẻ 3–5 tuổi.
5. **Trùng lặp emoji giữa các lựa chọn trong bài xác suất (`chang-20`)**:
   - **Nguyên nhân**: Màn `GL-C1-PROB-SLOT-0316` trong [C1.PROB.05.ts](file:///Users/macbook/tinimath/mindkid/packages/content/src/skills/c1/prob/C1.PROB.05.ts) dùng trùng `☄️` cho 3 vật thể và trùng `💎` cho 2 vật thể.
   - **Khắc phục**: Gán bộ emoji phân biệt rõ ràng (`🔷`, `☄️`, `⭐`, `💎`, `🪙`, `🐱`, `😸`, `🐶`, `🐕`).
