# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 6: Thung Lũng Cân Bằng (WB06)

> **Căn cứ đặc tả:** [`chang-06-spec.md`](./chang-06-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-06/analysis.json` (*6 - So sanh so luong.pdf*, 23 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 3 dạng bài chuẩn (`WB06-D1`, `WB06-D2`, `WB06-D3`) vào các game engine hiện tại (`GT-001` tap-select, `GT-008` drag-to-slot, `GT-014` balance-scale), cập nhật bảng tra cứu, và tích hợp vào hệ thống database seeder kỹ năng `packages/content/src/skills/c1/cmp/` (`C1.CMP.01`..`C1.CMP.05`).  
> **Bất biến cốt lõi:** **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori sequence $\ge 0101$ (`BR-MGL-02`). Phân tầng `access_tier` khớp đúng `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4: `premium`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Cập nhật Seeder C1.CMP.04 (Nhiều hơn: GL-C1-CMP-TAP-0101, GL-C1-CMP-BAL-0101)
   ├──> Task 4: Cập nhật Seeder C1.CMP.05 (Ít hơn: GL-C1-CMP-TAP-0102, GL-C1-CMP-BAL-0102)
   ├──> Task 5: Cập nhật Seeder C1.CMP.03 (Bằng nhau: GL-C1-CMP-SLOT-0101, GL-C1-CMP-BAL-0103)
   ├──> Task 6: Cập nhật Seeder C1.CMP.01 (Lớn hơn: GL-C1-CMP-SLOT-0102, 0103, 0104, 0105)
   └──> Task 7: Cập nhật Seeder C1.CMP.02 (Nhỏ hơn: GL-C1-CMP-TAP-0103)
         │
         └──> Task 8: Chạy Cổng Kiểm Thử & Verification Gates (typecheck, lint, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ và cập nhật các hàng `WB06-D1`, `WB06-D2` và bổ sung `WB06-D3` vào Bảng 1.
- **Hành động cụ thể:**
  1. Cập nhật các dòng hiện có của WB06:
     - `WB06-D1` | Band: `3-4` | C1 | `C1.CMP` | Lô: `A` | Khuôn: `GT-001` · `GT-014` | Trạng thái: **Nhận (Lô A)** | Tên: *So sánh trực quan 2 nhóm vật (Nhiều hơn / Ít hơn / Bằng nhau)*
     - `WB06-D2` | Band: `3-4` | C1 | `C1.CMP` | Lô: `B` | Khuôn: `GT-008` · `GT-001` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Điền dấu quan hệ >, <, = giữa 2 nhóm hình (Ẩn dụ Miệng cá sấu)*
  2. Bổ sung hàng mới `WB06-D3`:
     - `WB06-D3` | Band: `4-5` | C1 | `C1.CMP` | Lô: `B` | Khuôn: `GT-014` · `GT-008` | Trạng thái: **Nhận (Lô B - A2)** | Tên: *Khôi phục cân thăng bằng, chuyển tiếp CPA (Đếm-Viết-So sánh) & Tiền đại số phép tính*
  3. Cập nhật số liệu thống kê tại Mục 2:
     - Tăng tổng số dạng bài nguồn: $59 \rightarrow 60$ (thêm WB06-D3).
     - Điều chỉnh tổng nhận và phân bổ Lô B.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng tra cứu hiển thị đầy đủ 3 mã `WB06-D1`, `WB06-D2`, `WB06-D3`.
  - [ ] Khuôn đề xuất liệt kê chính xác các template hiện hữu: `GT-001`, `GT-008`, `GT-014`.
  - [ ] Tuyệt đối không đề cập đến `GT-038+`.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật hàng 06 tại Mục 7.1 phản ánh đầy đủ năng lực số hóa của Chặng 6.
- **Hành động cụ thể:**
  1. Sửa dòng số 06 trong bảng ánh xạ:
     ```markdown
     | 06 | So sánh số lượng & Thung lũng cân bằng | 3-4 | C1 | `C1.CMP` | `GT-001` · `GT-008` | `GT-014` cân hai bên |
     ```
  2. Bổ sung diễn giải sư phạm về mô hình ẩn dụ miệng cá sấu, bước chuyển tiếp CPA (Trang 12) và tiền đại số phép tính (Trang 20–22).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 06 ghi nhận đầy đủ 3 khuôn `GT-001`, `GT-008`, `GT-014`.
  - [ ] Khớp đúng với quy định không chứa từ khóa thương mại đo trí tuệ theo `BR-MCM-06`.

---

### Task 3: Cập nhật Seeder `C1.CMP.04` (Nhận biết nhiều hơn)
- **Tập tin:** `packages/content/src/skills/c1/cmp/C1.CMP.04.ts`
- **Mục tiêu:** Bổ sung kho ngữ liệu Thung Lũng Cân Bằng vào dataset và khai báo 2 level plan chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung các item Chặng 6 vào dataset (đàn chim đỏ 2 vs 5, đàn chim xanh 4 vs 1, giỏ táo 4 vs 2, dâu tây 5 vs 1, đồng xu vàng 10 vs 6).
  2. Cập nhật phrasing câu thoại của Gấu Logic & Thỏ Quan Sát:
     - Prompt: *"Bé hãy quan sát và chọn nhóm có nhiều hơn nhé!"*
     - Hint: *"Gợi ý từ Thỏ: Chạm tay vào từng hình khi đếm nhé!"*
  3. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-CMP-TAP-0101",
       template: "GT-001",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB06-D1",
     },
     {
       code: "GL-C1-CMP-BAL-0101",
       template: "GT-014",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB06-D1",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-CMP-TAP-0101` và `GL-C1-CMP-BAL-0101` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB06-D1"`.
  - [ ] `access_tier` khớp `difficulty` (1 = `free`, 2 = `login`).
  - [ ] File compile không lỗi typecheck.

---

### Task 4: Cập nhật Seeder `C1.CMP.05` (Nhận biết ít hơn)
- **Tập tin:** `packages/content/src/skills/c1/cmp/C1.CMP.05.ts`
- **Mục tiêu:** Bổ sung ngữ liệu tìm nhóm ít hơn và khai báo 2 level plan tương ứng.
- **Hành động cụ thể:**
  1. Bổ sung các item giỏ quả ít hơn và đàn chim lẻ.
  2. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-CMP-TAP-0102",
       template: "GT-001",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB06-D1",
     },
     {
       code: "GL-C1-CMP-BAL-0102",
       template: "GT-014",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB06-D1",
     }
     ```
  3. Cung cấp câu hỏi prompt: *"Bé hãy đếm cả hai bên rồi chọn giỏ quả có ít hơn nhé!"*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-CMP-TAP-0102` và `GL-C1-CMP-BAL-0102` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB06-D1"`.
  - [ ] `access_tier` khớp `difficulty` (1 = `free`, 2 = `login`).

---

### Task 5: Cập nhật Seeder `C1.CMP.03` (So sánh bằng nhau)
- **Tập tin:** `packages/content/src/skills/c1/cmp/C1.CMP.03.ts`
- **Mục tiêu:** Tích hợp bài toán điền dấu bằng `=` và cân thăng bằng hai bên.
- **Hành động cụ thể:**
  1. Thêm các cặp vật thể bằng nhau vào dataset: Cà rốt ($3 = 3$), Bướm hồng ($4 = 4$), Bóng bãi biển ($5 = 5$), Vườn hoa đỏ ($4 = 4$), Nhím gai ($7 = 7$).
  2. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-CMP-SLOT-0101",
       template: "GT-008",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB06-D2",
     },
     {
       code: "GL-C1-CMP-BAL-0103",
       template: "GT-014",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB06-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-CMP-SLOT-0101` và `GL-C1-CMP-BAL-0103` sequence $\ge 0101$.
  - [ ] `montessori_ref` trỏ đúng `WB06-D2` và `WB06-D3`.
  - [ ] `access_tier: "standard"` khớp `difficulty: 3`.

---

### Task 6: Cập nhật Seeder `C1.CMP.01` (So sánh lớn hơn)
- **Tập tin:** `packages/content/src/skills/c1/cmp/C1.CMP.01.ts`
- **Mục tiêu:** Tích hợp các dạng bài điền dấu cá sấu `>`, chuyển tiếp CPA và tiền đại số phép tính.
- **Hành động cụ thể:**
  1. Khai báo bộ thẻ dấu cá sấu xanh và các mảng đối tượng nông trại, ao cá, gara xe, kho báu đá quý.
  2. Bổ sung các level plan vào mảng `C1_CMP_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-CMP-SLOT-0102",
       template: "GT-008",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "farm",
       rounds: 3,
       montessori_ref: "WB06-D2",
     },
     {
       code: "GL-C1-CMP-SLOT-0103",
       template: "GT-008",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "vehicle",
       rounds: 3,
       montessori_ref: "WB06-D2",
     },
     {
       code: "GL-C1-CMP-SLOT-0104",
       template: "GT-008",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB06-D3",
     },
     {
       code: "GL-C1-CMP-SLOT-0105",
       template: "GT-008",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "railway",
       rounds: 3,
       montessori_ref: "WB06-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] 4 mã level `GL-C1-CMP-SLOT-0102..0105` tuần tự $\ge 0101$.
  - [ ] `montessori_ref` khớp đúng `WB06-D2` và `WB06-D3`.
  - [ ] `access_tier` khớp chính xác `difficulty` (2 = `login`, 3 = `standard`, 4 = `premium`).

---

### Task 7: Cập nhật Seeder `C1.CMP.02` (So sánh nhỏ hơn)
- **Tập tin:** `packages/content/src/skills/c1/cmp/C1.CMP.02.ts`
- **Mục tiêu:** Tích hợp bài trắc nghiệm chọn dấu bé hơn `<` và tính chất hoán vị nghịch đảo.
- **Hành động cụ thể:**
  1. Thêm level plan trắc nghiệm và đổi chỗ hai bên vào mảng `C1_CMP_02_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-CMP-TAP-0103",
       template: "GT-001",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB06-D2",
     }
     ```
  2. Ghi chú câu hỏi prompt: *"Bé hãy chọn dấu thích hợp: Miệng cá sấu há về bên có nhiều hơn nhé!"*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-CMP-TAP-0103` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB06-D2"`.
  - [ ] `access_tier: "login"`, `difficulty: 2`.

---

### Task 8: Verification Gate & Integrity Check
- **Tập tin liên quan:** Toàn bộ các file vừa sửa đổi.
- **Hành động cụ thể:**
  1. Chạy typecheck toàn bộ workspace `@mindkid/content`:
     ```bash
     pnpm --filter @mindkid/content typecheck
     ```
  2. Kiểm tra định dạng lint code:
     ```bash
     pnpm lint:safe
     ```
  3. Chạy test suite cổng kiểm thử Montessori:
     ```bash
     pnpm --filter @mindkid/content-build test tests/gates/montessori-corpus.test.ts
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có lỗi TypeScript (0 errors).
  - [ ] Không vi phạm rule Biome / Ultracite.
  - [ ] Bộ test montessori corpus pass xanh hoàn toàn.
