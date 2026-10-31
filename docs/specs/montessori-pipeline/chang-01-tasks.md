# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 1: Ga Những Con Số Thức Giấc (WB01)

> **Căn cứ đặc tả:** [`chang-01-spec.md`](./chang-01-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-01/analysis.json` (*Chặng 1 - Những con Số - Nhận biết số.pdf*, 31 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 5 nhóm dạng bài (`WB01-D1`..`WB01-D5`) vào các game engine hiện tại (`GT-000`, `GT-001`, `GT-005`, `GT-008`, `GT-024`, `GT-028`, `GT-037`), cập nhật bảng đối chiếu và làm giàu `SkillDataset` + `SkillLevelPlan[]` trong `packages/content/src/skills/c1/`.  
> **Bất biến:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori $\ge 0101$ (`BR-MGL-02`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung SkillLevelPlan vào C1.NREC.01 (GL-C1-NREC-INTRO-0101 / GT-000)
   ├──> Task 4: Cập nhật Seeder C1.NREC.02 (GL-C1-NREC-CARD-0102 / GT-001)
   ├──> Task 5: Bổ sung SkillLevelPlan vào C1.OTO.01 & C1.OTO.04 (GL-C1-OTO-PAIR-0101..0102 / GT-005)
   ├──> Task 6: Bổ sung SkillLevelPlan vào C1.NREC.05 (GL-C1-NREC-SLOT-0105..0106 / GT-008)
   ├──> Task 7: Bổ sung SkillLevelPlan vào C1.NREC.08 (GL-C1-NREC-TRAC-0101..0102 / GT-024)
   ├──> Task 8: Bổ sung SkillLevelPlan vào C1.NREC.03 (GL-C1-NREC-HUNT-0103..0105 / GT-037)
   ├──> Task 9: Bổ sung SkillLevelPlan vào C1.CNT.01 (GL-C1-CNT-TCNT-0101..0102 / GT-028)
   │
   └──> Task 10: Chạy Verification Gates (typecheck, test-ratchet, lint)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Cập nhật thông tin chi tiết cho các dạng bài `WB01-D1`, `WB01-D2`, `WB01-D3`, và ghi nhận bổ sung `WB01-D4`, `WB01-D5` từ phân tích 31 trang PDF Chặng 1.
- **Hành động cụ thể:**
  1. Rà soát hàng `WB01-D1`, `WB01-D2`, `WB01-D3` trong Bảng 1:
     - `WB01-D1`: Cập nhật khuôn đề xuất hỗ trợ `GT-000`, `GT-001`, `GT-028`.
     - `WB01-D2`: Cập nhật khuôn đề xuất hỗ trợ `GT-005` (nối dây) và `GT-001` (chọn đáp án).
     - `WB01-D3`: Cập nhật khuôn đề xuất `GT-008` (kéo vào ô chứa) và `GT-003` (thả vào giỏ).
  2. Bổ sung 2 hàng cho `WB01-D4` và `WB01-D5`:
     - `WB01-D4` | Band: `4-5` | C1 | `C1.NREC` | Lô: `B` | Khuôn: `GT-024` / `GT-037` | Trạng thái: **Nhận (Lô B)** | Tên: *Đồ nét chữ số theo hướng mũi tên & Săn tìm số trong ma trận 15 ô*
     - `WB01-D5` | Band: `3-4` | C1 | `C1.CNT` | Lô: `B` | Khuôn: `GT-028` / `GT-037` | Trạng thái: **Nhận (Lô B)** | Tên: *Thử thách số 1–10: Ba nhiệm vụ (Thanh 10 khối vuông Ten-Frame, Tô hình thực tế, Ma trận 21 ô)*
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng `WB01-D1` đến `WB01-D5` phản ánh chính xác cấu trúc 31 trang của Chặng 1.
  - [ ] Khớp 100% với đặc tả tại `chang-01-spec.md`.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật mục 7.1 và mục 7.6 về giải pháp cho khoảng trống vẽ nét số `GT-024` và săn số `GT-037`.
- **Hành động cụ thể:**
  1. Cập nhật dòng 01 trong Bảng 7.1:
     - Khuôn lô A: `GT-000` · `GT-001` · `GT-003` · `GT-005`.
     - Khuôn lô B: `GT-008` kéo vào ô khuyết · `GT-024` vẽ theo nét · `GT-028` chạm đếm tích luỹ · `GT-037` tìm hết ký hiệu.
  2. Cập nhật Mục 7.6 ("Khoảng trống đã biết — tô nét số"):
     - Ghi nhận `WB01-D4` đã được chuẩn hóa trong `chang-01-spec.md`, giải quyết triệt để khoảng trống bằng cách kết hợp cơ chế `GT-024` (vẽ nét số cát) và `GT-037` (phân biệt thị giác trong lưới 15 ô).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Khớp danh mục khuôn đã hỗ trợ cho WB01.
  - [ ] Không có bất kỳ vi phạm từ khóa thương mại nào (`BR-MCM-06`).

---

### Task 3: Bổ sung Level Kể Chuyện & Giới Thiệu CPA vào Seeder `C1.NREC.01`
- **Tập tin:** `packages/content/src/skills/c1/nrec/C1.NREC.01.ts`
- **Mục tiêu:** Tích hợp level `GL-C1-NREC-INTRO-0101` trên khuôn `GT-000`.
- **Hành động cụ thể:**
  1. Khai báo dataset chủ đề `CHANG_01_INTRO_DATASET` hoặc cập nhật `TOPIC_NUMBER_0_5_DATASET` với các vật phẩm lấy từ PDF Chặng 1 (số nhân cách hóa, bàn tay ngón cử chỉ, nhóm chấm tròn).
  2. Bổ sung `SkillLevelPlan`:
     ```typescript
     {
       code: "GL-C1-NREC-INTRO-0101",
       template: "GT-000",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "school",
       rounds: 1,
       montessori_ref: "WB01-D1",
       dataset: CHANG_01_INTRO_DATASET,
       sequence_no: 1,
       skill_codes: ["C1.NREC.01", "C1.NREC.02"],
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C1-NREC-INTRO-0101` $\ge 0101$.
  - [ ] `montessori_ref: "WB01-D1"`.
  - [ ] `access_tier: "free"` khớp `difficulty: 1`.

---

### Task 4: Cập nhật Seeder `C1.NREC.02` với Level Đánh Thức Số
- **Tập tin:** `packages/content/src/skills/c1/nrec/C1.NREC.02.ts`
- **Mục tiêu:** Củng cố level `GL-C1-NREC-CARD-0102` trên khuôn `GT-001`.
- **Hành động cụ thể:**
  1. Kiểm tra cấu hình của `GL-C1-NREC-CARD-0102` trong `C1_NREC_02_SEED.levels`.
  2. Đảm bảo cấu hình có `access_tier: "login"` khớp `difficulty: 2`, `montessori_ref: "WB01-D1"`, chủ đề `school`.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `GL-C1-NREC-CARD-0102` có `montessori_ref: "WB01-D1"`.
  - [ ] `access_tier: "login"`.

---

### Task 5: Bổ sung Level Ghép Cặp Nối Dây vào Seeder `C1.OTO.01` & `C1.OTO.04`
- **Tập tin:** `packages/content/src/skills/c1/oto/C1.OTO.01.ts` và `C1.OTO.04.ts`
- **Mục tiêu:** Tích hợp `GL-C1-OTO-PAIR-0101` và `GL-C1-OTO-PAIR-0102` trên khuôn `GT-005`.
- **Hành động cụ thể:**
  1. Bổ sung vào `C1_OTO_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-OTO-PAIR-0101",
       template: "GT-005",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB01-D2",
     },
     {
       code: "GL-C1-OTO-PAIR-0102",
       template: "GT-005",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB01-D2",
     }
     ```
  2. Bổ sung các vật phẩm từ Trang 4 và Trang 5 vào dataset `C1_OTO_01_DATASET` (mèo, voi, vịt, táo, cá, sao, bóng bay, dâu tây, lá).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 2 level mang mã `GL-C1-OTO-PAIR-0101` và `0102`.
  - [ ] `montessori_ref: "WB01-D2"`.
  - [ ] `access_tier` khớp tương ứng: 1=`free`, 2=`login`.

---

### Task 6: Bổ sung Level Kéo Thả Định Vị vào Seeder `C1.NREC.05`
- **Tập tin:** `packages/content/src/skills/c1/nrec/C1.NREC.05.ts`
- **Mục tiêu:** Tích hợp `GL-C1-NREC-SLOT-0105` và `GL-C1-NREC-SLOT-0106` trên khuôn `GT-008`.
- **Hành động cụ thể:**
  1. Bổ sung vào mảng `C1_NREC_05_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-NREC-SLOT-0105",
       template: "GT-008",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "space",
       rounds: 2,
       montessori_ref: "WB01-D3",
     },
     {
       code: "GL-C1-NREC-SLOT-0106",
       template: "GT-008",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 2,
       montessori_ref: "WB01-D3",
     }
     ```
  2. Bổ sung vật phẩm vũ trụ (tên lửa, mặt trời, hành tinh, sao, mây) và thiên nhiên (cam, lá, hoa) vào dataset `C1_NREC_05_DATASET`.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C1-NREC-SLOT-0105` và `0106`.
  - [ ] `montessori_ref: "WB01-D3"`.
  - [ ] `access_tier` khớp `difficulty`.

---

### Task 7: Bổ sung Level Vẽ Nét Chữ Số vào Seeder `C1.NREC.08`
- **Tập tin:** `packages/content/src/skills/c1/nrec/C1.NREC.08.ts`
- **Mục tiêu:** Tích hợp `GL-C1-NREC-TRAC-0101` và `GL-C1-NREC-TRAC-0102` trên khuôn `GT-024`.
- **Hành động cụ thể:**
  1. Mở file `C1.NREC.08.ts` (Viết số theo nét).
  2. Bổ sung 2 level:
     ```typescript
     {
       code: "GL-C1-NREC-TRAC-0101",
       template: "GT-024",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "school",
       rounds: 5,
       montessori_ref: "WB01-D4",
     },
     {
       code: "GL-C1-NREC-TRAC-0102",
       template: "GT-024",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "school",
       rounds: 5,
       montessori_ref: "WB01-D4",
     }
     ```
  3. Đảm bảo tuân thủ `BR-LVB-06` (chỉ dành cho band 4–5 và 5–6, không cấp cho 3–4).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C1-NREC-TRAC-0101` và `0102`.
  - [ ] `montessori_ref: "WB01-D4"`.
  - [ ] `access_tier` khớp `difficulty` (2=`login`, 3=`standard`).

---

### Task 8: Bổ sung Level Săn Tìm Ký Hiệu Ma Trận vào Seeder `C1.NREC.03`
- **Tập tin:** `packages/content/src/skills/c1/nrec/C1.NREC.03.ts`
- **Mục tiêu:** Tích hợp `GL-C1-NREC-HUNT-0103`, `0104`, `0105` trên khuôn `GT-037`.
- **Hành động cụ thể:**
  1. Mở file `C1.NREC.03.ts` (Nhận biết số 0–10).
  2. Bổ sung vào mảng `C1_NREC_03_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-NREC-HUNT-0103",
       template: "GT-037",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "school",
       rounds: 3,
       montessori_ref: "WB01-D4",
     },
     {
       code: "GL-C1-NREC-HUNT-0104",
       template: "GT-037",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "school",
       rounds: 3,
       montessori_ref: "WB01-D4",
     },
     {
       code: "GL-C1-NREC-HUNT-0105",
       template: "GT-037",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "railway",
       rounds: 3,
       montessori_ref: "WB01-D5",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các level săn tìm số mang mã `GL-C1-NREC-HUNT-0103..0105`.
  - [ ] `access_tier` lần lượt là `login`, `standard`, `premium`.
  - [ ] `montessori_ref` trỏ đúng `WB01-D4` và `WB01-D5`.

---

### Task 9: Bổ sung Level Chạm Đếm Ten-Frame vào Seeder `C1.CNT.01`
- **Tập tin:** `packages/content/src/skills/c1/cnt/C1.CNT.01.ts`
- **Mục tiêu:** Tích hợp `GL-C1-CNT-TCNT-0101` và `GL-C1-CNT-TCNT-0102` trên khuôn `GT-028`.
- **Hành động cụ thể:**
  1. Mở file `C1.CNT.01.ts` (Đếm đồ vật).
  2. Bổ sung vào mảng `C1_CNT_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-CNT-TCNT-0101",
       template: "GT-028",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB01-D5",
     },
     {
       code: "GL-C1-CNT-TCNT-0102",
       template: "GT-028",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB01-D5",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C1-CNT-TCNT-0101` và `0102`.
  - [ ] `montessori_ref: "WB01-D5"`.
  - [ ] `access_tier` khớp `difficulty` (1=`free`, 2=`login`).

---

### Task 10: Chạy Verification Gates & Kiểm Thử Tính Nhất Quán
- **Tập tin:** Toàn bộ repository
- **Mục tiêu:** Đảm bảo toàn bộ mã nguồn và dữ liệu seed đạt 100% tiêu chuẩn chất lượng.
- **Lệnh thực thi:**
  1. Kiểm tra cú pháp và kiểu dữ liệu:
     ```bash
     pnpm --filter @mindkid/content typecheck
     ```
  2. Kiểm tra bộ cổng Montessori Gate:
     ```bash
     pnpm --filter @mindkid/content test packages/content/tests/c1-inventories.test.ts
     ```
  3. Kiểm tra tính toàn vẹn dataset:
     ```bash
     pnpm check
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Exit code 0, không có lỗi TypeScript, không có `any`/`unknown`.
  - [ ] Không có cảnh báo vi phạm `BR-MCM-06` (từ khóa IQ/Raven).
  - [ ] Bộ seeder sinh đúng nội dung theo template và tier.
