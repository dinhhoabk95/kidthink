# Đánh Giá Triển Khai (Code & Content Review) — Chặng 2: Nông Trại Trái Cây & Tuyến Số Bí Ngô

> **Mã đặc tả:** `MONTESSORI-CHANG-02`
> **Sách giáo khoa Montessori:** `WB02` (*2 - So 1 den 10.pdf*, 22 trang)
> **Trạng thái:** **APPROVE (ĐẠT 100%)**
> **Người thẩm định:** Principal Code & Content Reviewer (Argon Pro)
> **Ngày thẩm định:** 2026-10-29

---

## 1. Phạm Vi Kiểm Tra & File Seeder Liên Quan

Đánh giá việc triển khai nội dung hạt nhân và ánh xạ cấu trúc sư phạm của Chặng 2 (Đoàn tàu số 1 đến 10, Đếm xuôi & Đếm lùi) vào các file seeder kỹ năng thuộc `@mindkid/content`:

1. `packages/content/src/skills/c1/nrec/C1.NREC.09.ts` (`WB02-D1`, `WB02-D2`, `WB02-D3` $\rightarrow$ `GT-001`, `GT-006`, `GT-008`, `GT-013`)
2. `packages/content/src/skills/c1/cnt/C1.CNT.04.ts` (`WB02-D3` $\rightarrow$ `GT-006`: `GL-C1-CNT-REV-0101`, `GT-008`: `GL-C1-CNT-SLOT-0103`)
3. `packages/content/src/skills/c1/cnt/C1.CNT.08.ts` (`WB02-D2` $\rightarrow$ `GT-008`: `GL-C1-CNT-SLOT-0111`, `GL-C1-CNT-SLOT-0112`, `GL-C1-CNT-SLOT-0113`)
4. `packages/content/src/skills/c1/cnt/C1.CNT.10.ts`

---

## 2. Kết Quả Kiểm Tra 6 Tiêu Chí Bắt Buộc

### 2.1. Tái Sử Dụng Engine Hiện Hữu (`GT-000`..`GT-037`) — Không Tạo Mới `GT-038+`
- **Kết quả:** **ĐẠT (PASS)**.
- Toàn bộ 22 trang PDF của Chặng 2 được phân giải thành các dạng bài chuẩn tương thích tuyệt đối với các engine đã có:
  - `GT-001` (tap-select): Nhận diện chữ số và chọn thẻ số trên đoàn tàu (`WB02-D1`).
  - `GT-006` (sequence-order): Sắp xếp đoàn tàu chạy lùi 10 về 1 và tuyến số xuôi 1–10 (`WB02-D3`).
  - `GT-008` (drag-to-slot): Kéo thả số vào ô trống trên dây leo bí ngô và toa tàu (`WB02-D1`, `WB02-D2`, `WB02-D3`).
  - `GT-013` (maze-path): Mê cung đi theo thứ tự số 1–10 qua ao súng và vườn hoa (`WB02-D2`).
- **Không có bất kỳ template speculative nào (`GT-038+`) được tạo mới trong codebase.**

### 2.2. Strict TypeScript (Cấm `any`, Cấm `unknown`)
- **Kết quả:** **ĐẠT (PASS)**.
- Quét toàn bộ 4 file kỹ năng liên quan: phát hiện 0 từ khóa `any`, 0 từ khóa `unknown`.
- Tuân thủ định nghĩa kiểu chặt chẽ từ `@mindkid/shared`.

### 2.3. Quy Chuẩn Định Danh Mã Level & Thứ Tự Sequence
- **Kết quả:** **ĐẠT (PASS)**.
- Toàn bộ mã level Montessori đều tuân thủ `sequence >= 0101`:
  - `GL-C1-NREC-CARD-0108` (seq `0108` >= `0101`)
  - `GL-C1-SEQ-PAT-0109` (seq `0109` >= `0101`)
  - `GL-C1-SEQ-PAT-0110` (seq `0110` >= `0101`)
  - `GL-C1-SEQ-SLOT-0131` (seq `0131` >= `0101`)
  - `GL-C1-NREC-SLOT-0102` (seq `0102` >= `0101`)
  - `GL-C1-NREC-MAZE-0103` (seq `0103` >= `0101`)
  - `GL-C1-NREC-MAZE-0104` (seq `0104` >= `0101`)
  - `GL-C1-CNT-REV-0101` (seq `0101` >= `0101`)
  - `GL-C1-CNT-SLOT-0103` (seq `0103` >= `0101`)
  - `GL-C1-CNT-SLOT-0111` (seq `0111` >= `0101`)
  - `GL-C1-CNT-SLOT-0112` (seq `0112` >= `0101`)
  - `GL-C1-CNT-SLOT-0113` (seq `0113` >= `0101`)

### 2.4. Tính Hợp Lệ Của `montessori_ref`
- **Kết quả:** **ĐẠT (PASS)**.
- Mọi level bổ sung đều gắn nhãn chuẩn định dạng `^WB\d{2}-D\d+$`:
  - `WB02-D1`: Dãy số tuyến tính 1–10 và điền số khuyết
  - `WB02-D2`: Tuyến số mê cung & chuỗi số đến 20
  - `WB02-D3`: Đếm lùi 10 về 1 (Đoàn tàu chạy lùi)

### 2.5. Ma Trận Phân Tầng Quyền Truy Cập (`access_tier` Khớp `difficulty`)
- **Kết quả:** **ĐẠT (PASS)**.
- Khớp 100% nguyên tắc bậc thang thương mại `BR-MGL-12`:
  - Độ khó 1 (`difficulty: 1`) $\rightarrow$ `access_tier: "free"`
  - Độ khó 2 (`difficulty: 2`) $\rightarrow$ `access_tier: "login"`
  - Độ khó 3 (`difficulty: 3`) $\rightarrow$ `access_tier: "standard"`
  - Độ khó 4, 5 (`difficulty: 4..5`) $\rightarrow$ `access_tier: "premium"`

### 2.6. Tuân Thủ An Toàn Trẻ Em & Ngôn Ngữ Tiếp Thị (`BR-MCM-06`)
- **Kết quả:** **ĐẠT (PASS)**.
- Quét toàn văn bản: không chứa các từ khóa cấm (`IQ`, `Raven`, `trí tuệ`, `thông minh`).
- Ngữ cảnh học tập trong sáng, gắn liền với tự nhiên: *ruộng bí ngô*, *hồ hoa súng*, *vườn dưa lê*, *đoàn tàu*.

---

## 3. Các Hiệu Chỉnh Kỹ Thuật Thực Hiện Trong Quá Trình Review

1. **Khắc phục Gate 5 (`ENGINE_AGE_BAND_BANNED`) trên `GL-C1-CNT-REV-0101` (`C1.CNT.04`)**:
   - *Nguyên nhân:* Engine `GT-006` (sequence-order) giới hạn khoảng tuổi 5–6 tuổi (`banned_age_bands: ["3-4", "4-5"]`). Việc gán `band: "4-5"` vi phạm cổng độ tuổi.
   - *Xử lý:* Cập nhật thành `band: "5-6"`, đồng bộ với các level GT-006 trong hệ thống.
2. **Khắc phục Gate 4 (`INSTRUCTION_TOO_LONG`) trên `GL-C1-NREC-CARD-0108` (`C1.NREC.09`) & `GL-C1-CNT-TAP-0034` (`C1.CNT.08`)**:
   - *Nguyên nhân:* `prompt_template` trong dataset kỹ năng dài 13–14 từ, vượt trần 12 từ của band lứa tuổi mầm non.
   - *Xử lý:* Chuẩn hóa thành `"Bé hãy chọn đúng {label} nhé!"` (7 từ).
3. **Khắc phục Gate 9 (`CONCEPT_GLYPH_MISSING`) trên các level GT-024 và GT-023 của `C1.NREC.09`**:
   - *Nguyên nhân:* 8 vật phẩm Chặng 2 mới thêm vào `C1_NREC_09_DATASET` (`item_pumpkin_01`, `item_lilypad_01`, `item_melon_01`, `dest_rainbow`, `dest_star`, `dest_flower_garden`, `dest_station`, `dest_gift_chest`) ban đầu thiếu thuộc tính `glyph` và `value`. Khi engine chọn ngẫu nhiên các vật này làm `guide_asset`, level sinh ra không mang glyph, làm trượt Gate 9.
   - *Xử lý:* Bổ sung đầy đủ `glyph` và `value` chuẩn xác theo đúng thiết kế tại mục 7.1 của `chang-02-spec.md`.

---

## 4. Kết Quả Chạy Kiểm Thử & Seed Gates

| Cổng Kiểm Thử | Lệnh Thực Thi | Kết Quả | Ghi Chú |
|---|---|:---:|---|
| **Unit Tests** | `pnpm --filter @mindkid/content test` | **PASS (66/66)** | Toàn bộ 8 test suites xanh 100% |
| **Strict Typecheck & Syntax** | Quét cấm `any`, `unknown`, `GT-038+` | **PASS (0 errors)** | 0 lỗi vi phạm quy chuẩn dự án |
| **Gate 0..9 Quét Hạt Nhân** | `check-seed-gates.ts` | **PASS (0 errors)** | 0 lỗi trên toàn bộ 4 file thuộc Chặng 2 |
| **Seed Check Toàn Diện** | `seed-check.ts` | **PASS (0 errors)** | Không có lỗi blocking nào thuộc phạm vi Chặng 2 |

---

## 5. Quyết Định Thẩm Định

**PHÊ DUYỆT (APPROVED)**. Triển khai Chặng 2 đạt 100% yêu cầu kỹ thuật và sư phạm. Sẵn sàng tích hợp vào pipeline sản xuất.
