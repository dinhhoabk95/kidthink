# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 7: Khu Vườn Hai Nhánh (WB07)

> **Căn cứ đặc tả:** [`chang-07-spec.md`](./chang-07-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-07/analysis.json` (*7 - Tach va gop so luong.pdf*, 23 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 3 dạng bài chuẩn (`WB07-D1`, `WB07-D2`, `WB07-D3`) vào các game engine hiện tại (`GT-003` drag-to-container, `GT-007` number-bond, `GT-008` drag-to-slot), cập nhật bảng tra cứu dạng bài, bảng ánh xạ corpus, và tích hợp vào hệ thống database seeder kỹ năng `packages/content/src/skills/c1/ncomp/` (`C1.NCOMP.01`..`C1.NCOMP.04`).  
> **Bất biến cốt lõi:** **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori sequence $\ge 0101$ (`BR-MGL-02`). Phân tầng `access_tier` khớp đúng `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4: `premium`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Cập nhật Seeder C1.NCOMP.01 (Tách số 2: GL-C1-NCOMP-BSK-0101, GL-C1-NCOMP-BOND-0101)
   ├──> Task 4: Cập nhật Seeder C1.NCOMP.02 (Tách số 3: GL-C1-NCOMP-BSK-0102, GL-C1-NCOMP-BOND-0102)
   ├──> Task 5: Cập nhật Seeder C1.NCOMP.03 (Tách số 4: GL-C1-NCOMP-BSK-0103, GL-C1-NCOMP-BOND-0103, GL-C1-NCOMP-SLOT-0101)
   └──> Task 6: Cập nhật Seeder C1.NCOMP.04 (Tách số 5: GL-C1-NCOMP-BSK-0104, GL-C1-NCOMP-BOND-0104, GL-C1-NCOMP-BOND-0105, GL-C1-NCOMP-SLOT-0102)
         │
         └──> Task 7: Chạy Cổng Kiểm Thử & Verification Gates (typecheck, lint, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết Cho `montessori_code_implementer`

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ và cập nhật các hàng `WB07-D1`, `WB07-D2`, `WB07-D3` tại Mục 1 của tài liệu.
- **Hành động cụ thể:**
  1. Cập nhật các dòng của WB07 trong bảng:
     - `WB07-D1` | Band: `3-4` | C1 | `C1.NCOMP` | Lô: `A` | Khuôn: `GT-003` · `GT-007` | Trạng thái: **Nhận (Lô A)** | Tên: *Gộp hai nhóm về giỏ tổng trực quan (Part-Part -> Whole, phạm vi 2–10)*
     - `WB07-D2` | Band: `3-4` | C1 | `C1.NCOMP` | Lô: `B` | Khuôn: `GT-007` · `GT-003` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Cây tách gộp & Tìm phần còn thiếu (Missing Part Deduction, phạm vi 5–10)*
     - `WB07-D3` | Band: `3-4` | C1 | `C1.NCOMP` | Lô: `B` | Khuôn: `GT-007` · `GT-008` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Đa dạng hóa phân rã & Toa tàu số liên kết trừu tượng (Partitions & Symbolic Train)*
  2. Cập nhật phần thống kê Lô A và Lô B ở Mục 2:
     - WB07 chuyển sang trạng thái đã nhận toàn bộ 3 dạng bài (chuyển WB07-D3 từ *Hoãn* sang *Nhận*).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng `WB07-D1`, `WB07-D2`, `WB07-D3` phản ánh chính xác các khuôn `GT-003`, `GT-007`, `GT-008`.
  - [ ] Tuyệt đối không chứa mã khuôn `GT-038+`.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật hàng 07 tại Mục 7.1 phản ánh đúng các khuôn hiện hữu chạy được cho Chặng 7.
- **Hành động cụ thể:**
  1. Sửa dòng số 07 trong Bảng 7.1:
     ```markdown
     | 07 | Tách gộp số lượng & Khu vườn hai nhánh | 3-4 | C1 | `C1.NCOMP` | `GT-003` gộp vào giỏ | `GT-007` cây tách gộp · `GT-008` kéo vào ô khuyết |
     ```
  2. Đảm bảo ghi nhận năng lực kết hợp giữa `GT-003` (gom quả cành cây vào giỏ), `GT-007` (Number Bond phân nhánh), và `GT-008` (Toa tàu số liên kết).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 07 ghi rõ `GT-003` ở cột Khuôn Lô A và `GT-007` · `GT-008` ở cột Lô B.
  - [ ] Tuân thủ `BR-MCM-06`, không đề cập đến bất kỳ thuật ngữ thương mại đo IQ nào.

---

### Task 3: Cập nhật Seeder `C1.NCOMP.01` (Tách số 2)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.01.ts`
- **Mục tiêu:** Bổ sung ngữ liệu quả táo/cành cây vào dataset và khai báo 2 level plan chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung các item Chặng 7 vào dataset (táo đỏ cành 1 và cành 2 gộp thành 2 quả táo trong giỏ).
  2. Bổ sung quan hệ `subset` với metadata bond:
     ```typescript
     {
       type: "subset",
       source_id: "wb07_apple_single",
       target_id: "wb07_apple_pair",
       metadata: { bond_id: "bond_2_1_1", part_a: 1, part_b: 1, whole: 2 }
     }
     ```
  3. Cập nhật phrasing câu thoại của Gấu Logic & Thỏ Quan Sát:
     - Prompt: *"Hai nhánh nhỏ có thể gộp thành một giỏ quả! Bé hãy đếm rồi gộp nhé!"*
     - Hint L2: *"Đếm từng cành trước rồi hãy đếm giỏ tổng nhé!"*
  4. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-NCOMP-BSK-0101",
       template: "GT-003",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB07-D1",
     },
     {
       code: "GL-C1-NCOMP-BOND-0101",
       template: "GT-007",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB07-D1",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-NCOMP-BSK-0101` và `GL-C1-NCOMP-BOND-0101` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB07-D1"`.
  - [ ] `access_tier: "free"` khớp `difficulty: 1`.
  - [ ] File compile không lỗi typecheck.

---

### Task 4: Cập nhật Seeder `C1.NCOMP.02` (Tách số 3)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.02.ts`
- **Mục tiêu:** Bổ sung ngữ liệu dâu tây/quả ngọt và khai báo 2 level plan cho gộp và tìm phần khuyết số 3.
- **Hành động cụ thể:**
  1. Thêm item dâu tây cành 1 và cành 2 vào dataset.
  2. Bổ sung quan hệ subset $1 + 2 = 3$ (`bond_3_1_2`).
  3. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-NCOMP-BSK-0102",
       template: "GT-003",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB07-D1",
     },
     {
       code: "GL-C1-NCOMP-BOND-0102",
       template: "GT-007",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB07-D2",
     }
     ```
  4. Cung cấp câu hỏi prompt: *"Một cành quả đang bị ẩn đi! Bé tìm số dâu còn thiếu để đủ 3 quả nhé!"*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-NCOMP-BSK-0102` (diff 1, tier `free`) và `GL-C1-NCOMP-BOND-0102` (diff 2, tier `login`).
  - [ ] `montessori_ref` lần lượt là `"WB07-D1"` và `"WB07-D2"`.

---

### Task 5: Cập nhật Seeder `C1.NCOMP.03` (Tách số 4)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.03.ts`
- **Mục tiêu:** Tích hợp các bài toán gộp cành, tìm nhánh khuyết và toa tàu số kết nối cho số 4.
- **Hành động cụ thể:**
  1. Thêm các cặp quả cam vàng và lê xanh vào dataset: $2+2=4$ (`bond_4_2_2`), $1+3=4$ (`bond_4_1_3`).
  2. Khai báo 3 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-NCOMP-BSK-0103",
       template: "GT-003",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB07-D1",
     },
     {
       code: "GL-C1-NCOMP-BOND-0103",
       template: "GT-007",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB07-D2",
     },
     {
       code: "GL-C1-NCOMP-SLOT-0101",
       template: "GT-008",
       band: "3-4",
       difficulty: 3,
       access_tier: "standard",
       theme: "vehicle",
       rounds: 3,
       montessori_ref: "WB07-D3",
     }
     ```
  3. Cung cấp phrasing toa tàu số: *"Đoàn tàu mang số 4 đang khởi hành! Bé kéo khối số vào toa tàu còn trống nhé!"*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Khai báo đủ 3 level plan trên 3 engine khác nhau: `GT-003`, `GT-007`, `GT-008`.
  - [ ] `access_tier` chuẩn hóa: diff 2 = `login`, diff 3 = `standard`.

---

### Task 6: Cập nhật Seeder `C1.NCOMP.04` (Tách số 5)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.04.ts`
- **Mục tiêu:** Làm giàu dataset số 5 với kho ngữ liệu Chặng 7 và bổ sung 4 level plan (gộp giỏ, tìm phần thiếu, đa dạng cách tách và toa tàu số).
- **Hành động cụ thể:**
  1. Thêm các item dưa hấu, đào, nho và quan hệ subset $1+4=5$, $2+3=5$.
  2. Khai báo 4 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-NCOMP-BSK-0104",
       template: "GT-003",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB07-D1",
     },
     {
       code: "GL-C1-NCOMP-BOND-0104",
       template: "GT-007",
       band: "3-4",
       difficulty: 3,
       access_tier: "standard",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB07-D2",
     },
     {
       code: "GL-C1-NCOMP-BOND-0105",
       template: "GT-007",
       band: "3-4",
       difficulty: 3,
       access_tier: "standard",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB07-D3",
     },
     {
       code: "GL-C1-NCOMP-SLOT-0102",
       template: "GT-008",
       band: "3-4",
       difficulty: 4,
       access_tier: "premium",
       theme: "vehicle",
       rounds: 3,
       montessori_ref: "WB07-D3",
     }
     ```
  3. Kiểm tra không ghi đè lên các level đã có sẵn (`GL-C1-NCOMP-BOND-0125`, `GL-C1-NCOMP-BOND-0126`).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] 4 level plan mới có mã duy nhất, sequence $\ge 0101$.
  - [ ] `access_tier` khớp: diff 2 = `login`, diff 3 = `standard`, diff 4 = `premium`.
  - [ ] `montessori_ref` khớp với dạng bài quy định: `WB07-D1`, `WB07-D2`, `WB07-D3`.

---

### Task 7: Chạy Cổng Kiểm Thử & Verification Gates
- **Tập tin liên quan:** Toàn bộ các file vừa sửa đổi.
- **Hành động cụ thể:**
  1. Kiểm tra compile TypeScript:
     ```bash
     pnpm --filter @mindkid/content typecheck
     ```
  2. Chạy Biome linting:
     ```bash
     pnpm lint:safe
     ```
  3. Chạy bài test kiểm tra bộ cổng Montessori:
     ```bash
     pnpm --filter @mindkid/content-build test
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có lỗi lint hoặc type error nào phát sinh.
  - [ ] Cổng `montessori-corpus.test.ts` pass xanh exit 0.
