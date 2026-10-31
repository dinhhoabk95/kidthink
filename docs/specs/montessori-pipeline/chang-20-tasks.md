# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 20: Trạm Mật Mã Cuối Cùng (WB20)

> **Căn cứ đặc tả:** [`chang-20-spec.md`](./chang-20-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-20/analysis.json` (*Chặng 20 - Trạm mật mã cuối cùng.pdf*, 24 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 5 nhóm dạng bài chuẩn (`WB20-D1`, `WB20-D2`, `WB20-D3`, `WB20-D4`, `WB20-D5`) vào các game engine hiện tại (`GT-010` substitution, `GT-008` drag-to-slot, `GT-001` tap-select, `GT-009` clue-deduction, `GT-000` celebration), cập nhật bảng đối chiếu và làm giàu `SkillDataset` + 14 `SkillLevelPlan[]` trong `packages/content/src/skills/c1/prob/` và `packages/content/src/skills/c3/ded/`.  
> **Bất biến:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+` (loại bỏ hoàn toàn dự thảo `GT-057`). Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori $\ge 0101$ (`BR-MGL-02`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Làm giàu Dataset & Bổ sung 6 Level vào C1.PROB.06 (GL-C1-PROB-SUB-0101..0106)
   ├──> Task 4: Bổ sung 4 Level vào C1.PROB.01 (GL-C1-PROB-SLOT-0101, GL-C1-PROB-TAP-0102, GL-C1-PROB-SLOT-0103..0104)
   ├──> Task 5: Làm giàu Dataset & Bổ sung 2 Level vào C3.DED.02 (GL-C3-DED-CLUE-0101, GL-C3-DED-SUB-0102)
   ├──> Task 6: Bổ sung 2 Level Capstone vào C3.DED.03 (GL-C3-DED-SLOT-0103, GL-C3-DED-SUB-0104)
   │
   ├──> Task 7: Kiểm tra & Đồng bộ Builders (gt-010, gt-008, gt-009, gt-001)
   │
   └──> Task 8: Chạy Verification Gates (typecheck, montessori-gate, tests)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập Nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Cập nhật thông tin chi tiết cho các dạng bài `WB20-D1`, `WB20-D2`, `WB20-D3`, bổ sung `WB20-D4` từ phân tích 24 trang PDF Chặng 20.
- **Hành động cụ thể:**
  1. Rà soát các hàng `WB20-D1`, `WB20-D2`, `WB20-D3` trong Bảng 1:
     - `WB20-D1`: Chuyển trạng thái từ *Hoãn* sang **Nhận (Lô B - A2)**, cập nhật khuôn hỗ trợ `GT-010` (phương trình hình ảnh), `GT-008` (kéo thẻ số) và `GT-001` (chạm chọn số). Mô tả: *Hệ phương trình hình ảnh tuần tự thuần phép cộng phạm vi 10 (3 hình giống nhau chia đều, thế tuần tự 2 bước)*.
     - `WB20-D2`: Chuyển trạng thái từ *Hoãn* sang **Nhận (Lô B - A2)**, cập nhật khuôn hỗ trợ `GT-010`, `GT-008`, `GT-001`. Mô tả: *Hệ phương trình hình ảnh kết hợp phép trừ ở dòng cuối (Tìm số trừ, phép trừ liên tiếp và mở rộng số lớn đến 18)*.
     - `WB20-D3`: Chuyển trạng thái từ *Hoãn* sang **Nhận (Lô B - A2)**, cập nhật khuôn hỗ trợ `GT-010`, `GT-009`, `GT-008`. Mô tả: *Hệ phương trình đa ẩn kết hợp quan hệ Tổng - Hiệu đồng thời & Tổng 3 ẩn (Mưa sao băng, Bàn tiệc ánh trăng)*.
  2. Thêm dạng bài mở rộng `WB20-D4`:
     - Mã dạng bài: `WB20-D4` | Band: 5-6 | Competency: C1 | Strand chính: `C1.PROB` | Lô: B | Khuôn đề xuất: `GT-010` · `GT-008` | Trạng thái: **Nhận (Lô B - A2)** | Tên / Mô tả: *Giải mã phương trình có nghiệm 0 đặc biệt và bội số ẩn kép (Cánh cổng hoàng kim Ổ khóa 21)*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 4 hàng `WB20-D1`..`WB20-D4` phản ánh chính xác cấu trúc bài toán thực tế trong PDF.
  - [ ] Không xuất hiện bất kỳ mã khuôn `GT-038+` nào (loại bỏ hoàn toàn dự thảo `GT-057`).
  - [ ] Thống kê số lượng dạng bài đồng bộ chuẩn xác.

---

### Task 2: Cập Nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Đồng bộ mục 7.1, 7.3 và 7.9 cho Workbook 20.
- **Hành động cụ thể:**
  1. Cập nhật dòng 20 trong Bảng 7.1:
     - Workbook: `20 | Bài toán thay thế nâng cao | 5-6 | C1 | C1.PROB · C3.DED`
     - Khuôn lô A: `GT-001` (chạm chọn số đúng)
     - Cơ chế lô B: `GT-010` thay thế biểu tượng · `GT-008` kéo thẻ số vào ô đáp án · `GT-009` loại trừ theo manh mối Tổng - Hiệu
  2. Cập nhật Bảng 7.9 (Phân bổ dạng bài nhận):
     - Ghi nhận việc phân bổ 10 levels sang competency C1 (`C1.PROB.06`, `C1.PROB.01`) và 4 levels sang competency C3 (`C3.DED.02`, `C3.DED.03`), giải quyết triệt để tình trạng 0 levels của WB20.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 20 phản ánh đúng các khuôn `GT-010`, `GT-008`, `GT-001`, `GT-009`.
  - [ ] Tuân thủ tuyệt đối quy định không dùng từ khóa thương mại đo trí tuệ (`BR-MCM-06`).

---

### Task 3: Làm Giàu `SkillDataset` & Bổ Sung 6 Level vào Seeder `C1.PROB.06`
- **Tập tin:** `packages/content/src/skills/c1/prob/C1.PROB.06.ts`
- **Mục tiêu:** Bổ sung các biểu tượng Trạm Mật Mã Cuối Cùng vào dataset và cấu hình 6 `SkillLevelPlan` chuẩn.
- **Hành động cụ thể:**
  1. Bổ sung các items lấy cảm hứng từ Chặng 20 vào `C1_PROB_06_DATASET.items`:
     - Táo đỏ 🍎 (`cp20-apple-red`, val: 2)
     - Lê xanh 🍐 (`cp20-pear-green`, val: 3)
     - Dâu tây 🍓 (`cp20-strawberry`, val: 1)
     - Cà rốt 🥕 (`cp20-carrot`, val: 3)
     - Bắp ngô 🌽 (`cp20-corn`, val: 2)
     - Đậu Hà Lan 🫛 (`cp20-pea-pod`, val: 1)
     - Hũ mật ong 🍯 (`cp20-honey-jar`, val: 2)
     - Chú ong 🐝 (`cp20-bee`, val: 3)
     - Hoa cúc 🌼 (`cp20-daisy`, val: 1)
     - Chiếc lều ⛺ (`cp20-tent`, val: 5)
     - Đèn bão 🏮 (`cp20-lantern`, val: 2)
     - Ba lô 🎒 (`cp20-backpack`, val: 3)
     - Hoa sen 🪷 (`cp20-lotus`, val: 4)
     - Chú ếch 🐸 (`cp20-frog`, val: 2)
     - Chuồn chuồn 🦗 (`cp20-dragonfly`, val: 1)
     - Robot 🤖 (`cp20-robot`, val: 4)
     - Quả bóng ⚽ (`cp20-beach-ball`, val: 2)
     - Khối gỗ 🪵 (`cp20-wood-block`, val: 1)
     - Pha lê lam 💎 (`cp20-crystal-blue`, val: 4)
     - Pha lê tím 💎 (`cp20-crystal-purple`, val: 5)
     - Sao băng biến mất 🌠 (`cp20-comet-zero`, val: 0, special_zero: true)
     - Kim cương vàng 💎 (`cp20-diamond-gold`, val: 5)
     - Bánh răng ⚙️ (`cp20-gear-gold`, val: 3)
     - Chìa khóa cổ 🗝️ (`cp20-key-gold`, val: 2)
  2. Bổ sung 6 `SkillLevelPlan` vào `C1_PROB_06_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-PROB-SUB-0101",
       template: "GT-010",
       band: "5-6",
       difficulty: 1,
       access_tier: "free",
       theme: "farm",
       rounds: 3,
       montessori_ref: "WB20-D1",
     },
     {
       code: "GL-C1-PROB-SUB-0102",
       template: "GT-010",
       band: "5-6",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB20-D1",
     },
     {
       code: "GL-C1-PROB-SUB-0103",
       template: "GT-010",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB20-D2",
     },
     {
       code: "GL-C1-PROB-SUB-0104",
       template: "GT-010",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB20-D2",
     },
     {
       code: "GL-C1-PROB-SUB-0105",
       template: "GT-010",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "space",
       rounds: 3,
       montessori_ref: "WB20-D4",
     },
     {
       code: "GL-C1-PROB-SUB-0106",
       template: "GT-010",
       band: "5-6",
       difficulty: 5,
       access_tier: "premium",
       theme: "steampunk",
       rounds: 3,
       montessori_ref: "WB20-D4",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Dataset chứa đầy đủ các biểu tượng từ các ổ khóa chặng 20.
  - [ ] 6 levels có mã chuẩn sequence $\ge 0101$, `access_tier` khớp `difficulty`.
  - [ ] Không có lỗi typecheck TypeScript.

---

### Task 4: Bổ Sung 4 Level vào Seeder `C1.PROB.01`
- **Tập tin:** `packages/content/src/skills/c1/prob/C1.PROB.01.ts`
- **Mục tiêu:** Cấu hình 4 `SkillLevelPlan` chuẩn cho bài toán kéo thả và trắc nghiệm chọn cách giải.
- **Hành động cụ thể:**
  1. Thêm 4 `SkillLevelPlan` vào `C1_PROB_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-PROB-SLOT-0101",
       template: "GT-008",
       band: "5-6",
       difficulty: 2,
       access_tier: "login",
       theme: "farm",
       rounds: 3,
       montessori_ref: "WB20-D1",
     },
     {
       code: "GL-C1-PROB-TAP-0102",
       template: "GT-001",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "magic",
       rounds: 3,
       montessori_ref: "WB20-D2",
     },
     {
       code: "GL-C1-PROB-SLOT-0103",
       template: "GT-008",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "night",
       rounds: 3,
       montessori_ref: "WB20-D3",
     },
     {
       code: "GL-C1-PROB-SLOT-0104",
       template: "GT-008",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "space",
       rounds: 3,
       montessori_ref: "WB20-D4",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các level sử dụng `GT-008` và `GT-001` cấu hình đúng contract.
  - [ ] Sequence $\ge 0101$, `montessori_ref` trỏ đúng dạng bài.

---

### Task 5: Làm Giàu `SkillDataset` & Bổ Sung 2 Level vào Seeder `C3.DED.02`
- **Tập tin:** `packages/content/src/skills/c3/ded/C3.DED.02.ts`
- **Mục tiêu:** Cấu hình 2 `SkillLevelPlan` cho bài toán suy luận quan hệ Tổng - Hiệu đồng thời (Mưa sao băng).
- **Hành động cụ thể:**
  1. Bổ sung các items sao chổi vào `C3_DED_02_DATASET.items`:
     - Sao xanh lam ☄️ (`cp20-comet-blue`, val: 4)
     - Sao đỏ rực ☄️ (`cp20-comet-red`, val: 3)
     - Sao vàng sáng ☄️ (`cp20-comet-gold`, val: 2)
  2. Bổ sung 2 `SkillLevelPlan` vào `C3_DED_02_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-DED-CLUE-0101",
       template: "GT-009",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "space",
       rounds: 3,
       montessori_ref: "WB20-D3",
     },
     {
       code: "GL-C3-DED-SUB-0102",
       template: "GT-010",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "space",
       rounds: 3,
       montessori_ref: "WB20-D3",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Ánh xạ thành công bài toán Mưa sao băng vào `GT-009` và `GT-010`.
  - [ ] `access_tier` là `premium` khớp với difficulty 4.

---

### Task 6: Bổ Sung 2 Level Capstone vào Seeder `C3.DED.03`
- **Tập tin:** `packages/content/src/skills/c3/ded/C3.DED.03.ts`
- **Mục tiêu:** Cấu hình 2 `SkillLevelPlan` Capstone Finale cho Cổng dịch chuyển và Đại thử thách Cánh cổng hoàng kim.
- **Hành động cụ thể:**
  1. Thêm 2 `SkillLevelPlan` vào `C3_DED_03_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-DED-SLOT-0103",
       template: "GT-008",
       band: "5-6",
       difficulty: 5,
       access_tier: "premium",
       theme: "space",
       rounds: 3,
       montessori_ref: "WB20-D4",
     },
     {
       code: "GL-C3-DED-SUB-0104",
       template: "GT-010",
       band: "5-6",
       difficulty: 5,
       access_tier: "premium",
       theme: "steampunk",
       rounds: 3,
       montessori_ref: "WB20-D4",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `GL-C3-DED-SUB-0104` là màn chơi đỉnh cao mở khóa Viên Ngọc Mật Mã, difficulty 5, `premium`.
  - [ ] Khớp hoàn toàn với đặc tả tại `chang-20-spec.md`.

---

### Task 7: Kiểm Tra & Đồng Bộ Builders (`gt-010.ts`, `gt-008.ts`, `gt-009.ts`, `gt-001.ts`)
- **Tập tin:** `packages/content/src/builders/gt-010.ts`, `packages/content/src/builders/gt-008.ts`, `packages/content/src/builders/gt-009.ts`, `packages/content/src/builders/gt-001.ts`
- **Mục tiêu:** Đảm bảo các builder hỗ trợ đầy đủ các tham số độ khó, phương trình có nghiệm 0 và hệ phương trình 3 ẩn từ Chặng 20.
- **Hành động cụ thể:**
  1. Kiểm tra `projectGT010` để đảm bảo hỗ trợ `equations` có phép trừ và nghiệm 0.
  2. Kiểm tra `projectGT008` cho khay số 0-9 và ô kéo thả giá trị.
  3. Kiểm tra `projectGT009` cho 2 manh mối Tổng và Hiệu.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có runtime error hoặc type error khi build level.

---

### Task 8: Chạy Verification Gates
- **Tập tin:** Toàn bộ repository
- **Mục tiêu:** Xác thực tính toàn vẹn của mã nguồn và nội dung.
- **Hành động cụ thể:**
  1. Chạy `pnpm check:test-ratchet` để đảm bảo toàn bộ vitest tests pass xanh.
  2. Chạy `pnpm check` (lint + typecheck).
  3. Kiểm tra cổng Montessori corpus mapping test.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `pnpm check` exit 0 (0 error, 0 warning lọt lưới).
  - [ ] Tất cả unit tests liên quan đến skills và builders pass 100%.
