# Đánh Giá Triển Khai (Code & Content Review) — Chặng 4: Quảng Trường Số Lượng

> **Mã đặc tả:** `MONTESSORI-CHANG-04`
> **Sách giáo khoa Montessori:** `WB04` (*4 - Quang truong so luong.pdf*, 23 trang)
> **Trạng thái:** **APPROVE (ĐÃ SỬA LỖI & ĐẠT 100%)**
> **Người thẩm định:** Principal Code & Content Reviewer (Argon Pro)
> **Ngày thẩm định:** 2026-10-29

---

## 1. Phạm Vi Kiểm Tra & File Seeder Liên Quan

Đánh giá việc triển khai nội dung hạt nhân và ánh xạ cấu trúc sư phạm của Chặng 4 vào các file seeder kỹ năng thuộc `@mindkid/content`:

1. `packages/content/src/skills/c1/cnt/C1.CNT.01.ts` (Đếm đồ vật rời rạc, phạm vi 1–5)
2. `packages/content/src/skills/c1/cnt/C1.CNT.06.ts` (Đếm đến 5 & nhận diện số lượng)
3. `packages/content/src/skills/c1/cnt/C1.CNT.07.ts` (Đếm đến 10 & dải đếm mở rộng 6–12)

*(Ghi chú: Nhóm bài WB04-D2 đếm so sánh số lượng hai bên còn được tích hợp vào `C1.CMP.04.ts`)*

---

## 2. Kết Quả Kiểm Tra 6 Tiêu Chí Bắt Buộc

### 2.1. Tái Sử Dụng Engine Hiện Hữu (`GT-000`..`GT-037`) — Không Tạo Mới `GT-038+`
- **Kết quả:** **ĐẠT (PASS)**.
- Hoạt động Chặng 4 sử dụng:
  - `GT-001` (tap-select): Đếm đồ vật chọn thẻ số tương ứng (`WB04-D1`).
  - `GT-028` (tally-count): Chạm đếm tích luỹ từng quả rau củ/đồ vật (`WB04-D1`).
  - `GT-022` (hidden-object): Tìm kiếm và đếm vật thể trong bức tranh quảng trường (`WB04-D3`).
- **Không tạo mới bất kỳ engine nào (`GT-038+`).**

### 2.2. Strict TypeScript (Cấm `any`, Cấm `unknown`)
- **Kết quả:** **ĐẠT (PASS)**.
- Quét toàn bộ `C1.CNT.01.ts`, `C1.CNT.06.ts`, `C1.CNT.07.ts`: phát hiện 0 từ khóa `any`, 0 từ khóa `unknown`.

### 2.3. Quy Chuẩn Định Danh Mã Level & Thứ Tự Sequence
- **Kết quả:** **ĐẠT (PASS)**.
- Tất cả mã level Montessori đều tuân thủ `sequence >= 0101`:
  - `GL-C1-CNT-TAP-0141` (seq `0141` >= `0101`)
  - `GL-C1-CNT-TCNT-0142` (seq `0142` >= `0101`)
  - `GL-C1-CNT-HIDE-0143` (seq `0143` >= `0101`)
  - `GL-C1-CNT-TAP-0147` (seq `0147` >= `0101`)
  - `GL-C1-CNT-TAP-0148` (seq `0148` >= `0101`)
  - `GL-C1-CNT-TCNT-0149` (seq `0149` >= `0101`)
  - `GL-C1-CNT-HIDE-0150` (seq `0150` >= `0101`)

### 2.4. Tính Hợp Lệ Của `montessori_ref`
- **Kết quả:** **ĐẠT (PASS)**.
- Gắn nhãn chuẩn định dạng `^WB\d{2}-D\d+$`:
  - `WB04-D1`: Gian hàng đếm số lượng rau củ & thẻ số
  - `WB04-D2`: So sánh hai nhóm số lượng đối chiếu
  - `WB04-D3`: Tranh ẩn quảng trường tìm và đếm số lượng

### 2.5. Ma Trận Phân Tầng Quyền Truy Cập (`access_tier` Khớp `difficulty`)
- **Kết quả:** **ĐẠT (PASS)**.
  - Độ khó 1 $\rightarrow$ `free`
  - Độ khó 2 $\rightarrow$ `login`
  - Độ khó 3 $\rightarrow$ `standard`
  - Độ khó 4 $\rightarrow$ `premium`

### 2.6. Tuân Thủ An Toàn Trẻ Em & Ngôn Ngữ Tiếp Thị (`BR-MCM-06`)
- **Kết quả:** **ĐẠT (PASS)**.
- Không chứa các từ khóa cấm `IQ`, `Raven`, `trí tuệ`, `thông minh`.

---

## 3. Các Lỗi Được Phát Hiện & Trực Tiếp Sửa Chữa (Direct Patch)

Trong quá trình chạy kiểm tra thực tế bằng `check-seed-gates.ts` và `seed-check.ts`, phát hiện các lỗi sau:

1. **Lỗi Gate 5 (`ENGINE_AGE_BAND_BANNED`) trên level `GL-C1-CNT-TCNT-0142`**:
   - *Nguyên nhân:* Template `GT-028` cấu hình `banned_age_bands: ["3-4"]` và `age_min: 4`. Level ban đầu khai báo `band: "3-4"`.
   - *Khắc phục:* Đã sửa `band: "3-4"` thành `band: "4-5"` trong `C1.CNT.01.ts`.

2. **Lỗi Gate 8 (`ITEM_ORIGIN_INVALID`) và Gate 9 (`CONCEPT_GLYPH_MISSING`) trên `C1.CNT.01.ts`**:
   - *Nguyên nhân:* Các level bổ sung có dùng các vật phẩm rau củ / côn trùng nhưng dataset chính `C1_CNT_01_DATASET` chưa chứa danh mục các vật phẩm này.
   - *Khắc phục:* Đã sáp nhập toàn bộ danh mục vật phẩm `harvest_*` và `critter_*` vào `C1_CNT_01_DATASET.items` và `ordering`, giúp cả Gate 8 lẫn Gate 9 đạt chuẩn tuyệt đối.

---

## 4. Kết Quả Chạy Kiểm Thử & Seed Gates

| Cổng Kiểm Thử | Lệnh Thực Thi | Kết Quả | Ghi Chú |
|---|---|:---:|---|
| **Unit Tests** | `pnpm --filter @mindkid/content test` | **PASS (66/66)** | 100% test suites pass xanh |
| **TypeScript Typecheck** | `tsc --noEmit` | **PASS (0 errors)** | 0 lỗi kiểu dữ liệu trên 3 file Chặng 4 |
| **Gate 0..9 Quét Hạt Nhân** | `check-seed-gates.ts` | **PASS (0 errors)** | 0 vi phạm trên `C1.CNT.01`, `C1.CNT.06`, `C1.CNT.07` |
| **Seed Check Tổng Thể** | `seed-check.ts` | **PASS (0 errors)** | Không có lỗi blocking nào thuộc phạm vi Chặng 4 |

---

## 5. Quyết Định Thẩm Định

**PHÊ DUYỆT (APPROVED)**. Toàn bộ lỗi cấu hình ban đầu đã được trực tiếp sửa chữa và kiểm chứng 100% PASS. Sẵn sàng tích hợp.
