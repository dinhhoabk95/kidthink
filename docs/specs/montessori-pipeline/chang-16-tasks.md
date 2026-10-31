# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 16: Xưởng Cân Bằng Kỳ Diệu (WB16)

> **Căn cứ đặc tả:** [`chang-16-spec.md`](./chang-16-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-16/analysis.json` (*16 - Tu duy can bang.pdf*, 24 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 3 nhóm dạng bài chuẩn (`WB16-D1`, `WB16-D2`, `WB16-D3`) vào các game engine hiện tại (`GT-014` balance-scale, `GT-001` tap-select, `GT-008` drag-to-slot), cập nhật bảng đối chiếu và làm giàu `SkillDataset` + 12 `SkillLevelPlan[]` trong `packages/content/src/skills/c1/meas/` và `packages/content/src/skills/c3/ded/`.  
> **Bất biến:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori $\ge 0101$ (`BR-MGL-02`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Làm giàu Dataset & Bổ sung 4 Level vào C1.MEAS.07 (GL-C1-MEAS-SCALE-0101..0103, GL-C1-MEAS-SLOT-0104)
   ├──> Task 4: Bổ sung 2 Level vào C1.MEAS.02 (GL-C1-MEAS-TAP-0101, GL-C1-MEAS-TAP-0102)
   ├──> Task 5: Làm giàu Dataset & Bổ sung 4 Level vào C3.DED.02 (GL-C3-DED-SLOT-0101, GL-C3-DED-TAP-0102..0103, GL-C3-DED-SLOT-0104)
   ├──> Task 6: Bổ sung 2 Level Capstone vào C3.DED.03 (GL-C3-DED-SLOT-0105, GL-C3-DED-SLOT-0106)
   │
   ├──> Task 7: Đồng bộ & Kiểm thử Builders (gt-014, gt-001, gt-008)
   │
   └──> Task 8: Chạy Verification Gates (typecheck, montessori-gate, tests)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Cập nhật thông tin chi tiết cho các dạng bài `WB16-D1`, `WB16-D2`, `WB16-D3` từ phân tích 24 trang PDF Chặng 16.
- **Hành động cụ thể:**
  1. Rà soát các hàng `WB16-D1`, `WB16-D2`, `WB16-D3` trong Bảng 1:
     - `WB16-D1`: Chuyển trạng thái từ *Hoãn* sang **Nhận (Lô B - A2)**, cập nhật khuôn hỗ trợ `GT-014` (bàn cân cơ học góc nghiêng) và `GT-001` (chọn nhãn Bên trái/Bằng nhau/Bên phải; chọn vật nặng nhất/nhẹ nhất). Mô tả: *So sánh khối lượng trực quan & góc nghiêng bàn cân cơ học (Cao = nhẹ hơn, Thấp = nặng hơn; so sánh 2 khay đồ vật)*.
     - `WB16-D2`: Chuyển trạng thái từ *Hoãn* sang **Nhận (Lô B - A2)**, cập nhật khuôn hỗ trợ `GT-014` (goal: "balance", đặt vật cân bằng), `GT-008` (kéo quả số/quả cân vào ô khuyết) và `GT-001` (thẩm định Đúng/Sai). Mô tả: *Cân thăng bằng: Bù trừ thêm (+) hoặc bớt (-), điền số còn thiếu và quả cân sắt phạm vi 10*.
     - `WB16-D3`: Chuyển trạng thái từ *Hoãn* sang **Nhận (Lô B - A2)**, cập nhật khuôn hỗ trợ `GT-014`, `GT-001`, `GT-008`. Mô tả: *Tiền đại số tương đương: Quy đổi 1 bậc, chuỗi cân liên hoàn bắc cầu 2 bậc, triệt tiêu đại số và mở mật mã 6 số*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 3 hàng `WB16-D1`, `WB16-D2`, `WB16-D3` chuyển sang trạng thái nhận diện rõ ràng.
  - [ ] Khớp 100% với đặc tả tại `chang-16-spec.md`.
  - [ ] Không xuất hiện bất kỳ mã khuôn `GT-038+` nào.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Đồng bộ mục 7.1, 7.3 và 7.9 cho Workbook 16.
- **Hành động cụ thể:**
  1. Cập nhật dòng 16 trong Bảng 7.1:
     - Workbook: `16 | Tư duy cân bằng | 5-6 | C1 | C1.MEAS · C3.DED`
     - Khuôn lô A: `GT-001` (chọn nhãn 2 khay / thẩm định Đúng-Sai / chọn cực trị)
     - Cơ chế lô B: `GT-014` cân hai bên thăng bằng / góc nghiêng · `GT-008` kéo vào ô khuyết / ô mã số
  2. Cập nhật Bảng 7.9 (Phân bổ dạng bài nhận):
     - Ghi nhận việc chia sẻ 6 levels sang competency C1 (`C1.MEAS.07`, `C1.MEAS.02`) và 6 levels sang competency C3 (`C3.DED.02`, `C3.DED.03`), giải tỏa nghẽn cho WB16 hiện đang có 0 levels.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 16 phản ánh đúng các khuôn `GT-014`, `GT-001`, `GT-008`.
  - [ ] Không có bất kỳ vi phạm từ khóa thương mại nào (`BR-MCM-06`).

---

### Task 3: Làm Giàu `SkillDataset` & Bổ Sung 4 Level vào Seeder `C1.MEAS.07`
- **Tập tin:** `packages/content/src/skills/c1/meas/C1.MEAS.07.ts`
- **Mục tiêu:** Bổ sung các linh kiện Xưởng Cân Bằng Kỳ Diệu vào dataset và cấu hình 4 `SkillLevelPlan` chuẩn.
- **Hành động cụ thể:**
  1. Bổ sung các vật phẩm lấy cảm hứng từ Chặng 16 vào `C1_MEAS_07_DATASET.items`:
     - Quả dưa hấu nặng 🍉 (`ws16-watermelon`, val: 6)
     - Quả dứa thơm 🍍 (`ws16-pineapple`, val: 4)
     - Quả táo đỏ 🍎 (`ws16-apple`, val: 2)
     - Quả lê xanh 🍐 (`ws16-pear`, val: 2)
     - Quả cam tròn 🍊 (`ws16-orange`, val: 2)
     - Quả dâu tây nhẹ 🍓 (`ws16-strawberry`, val: 1)
     - Quả chanh vàng 🍋 (`ws16-lemon`, val: 1)
     - Bánh răng vàng ⚙️ (`ws16-gear-gold`, val: 5)
     - Đinh ốc bu-lông 🔩 (`ws16-bolt-metal`, val: 1)
     - Quả cân sắt 2 kg ⚖️ (`ws16-weight-2kg`, val: 2)
     - Quả cân sắt 3 kg ⚖️ (`ws16-weight-3kg`, val: 3)
     - Quả cân sắt 5 kg ⚖️ (`ws16-weight-5kg`, val: 5)
     - Quả cân sắt 10 kg ⚖️ (`ws16-weight-10kg`, val: 10)
  2. Bổ sung 4 `SkillLevelPlan` vào `C1_MEAS_07_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-MEAS-SCALE-0101",
       template: "GT-014",
       band: "5-6",
       difficulty: 1,
       access_tier: "free",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D1",
     },
     {
       code: "GL-C1-MEAS-SCALE-0102",
       template: "GT-014",
       band: "5-6",
       difficulty: 2,
       access_tier: "login",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D2",
     },
     {
       code: "GL-C1-MEAS-SCALE-0103",
       template: "GT-014",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D2",
     },
     {
       code: "GL-C1-MEAS-SLOT-0104",
       template: "GT-008",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D2",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [x] Dataset có đủ các vật thể đại diện khối lượng và quả cân sắt.
  - [x] 4 levels có mã chuẩn sequence $\ge 0101$, `access_tier` khớp `difficulty`.
  - [x] Không có lỗi typecheck TypeScript.

---

### Task 4: Bổ Sung 2 Level vào Seeder `C1.MEAS.02`
- **Tập tin:** `packages/content/src/skills/c1/meas/C1.MEAS.02.ts`
- **Mục tiêu:** Cấu hình 2 `SkillLevelPlan` chuẩn cho bài toán so sánh trật tự bàn cân.
- **Hành động cụ thể:**
  1. Thêm 2 `SkillLevelPlan` vào `C1_MEAS_02_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-MEAS-TAP-0101",
       template: "GT-001",
       band: "5-6",
       difficulty: 1,
       access_tier: "free",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D1",
     },
     {
       code: "GL-C1-MEAS-TAP-0102",
       template: "GT-001",
       band: "5-6",
       difficulty: 2,
       access_tier: "login",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D1",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [x] Cả 2 level có mã sequence $\ge 0101$ (`GL-C1-MEAS-TAP-0241`, `GL-C1-MEAS-TAP-0242`).
  - [x] `montessori_ref: "WB16-D1"`.

---

### Task 5: Làm Giàu `SkillDataset` & Bổ Sung 4 Level vào Seeder `C3.DED.02`
- **Tập tin:** `packages/content/src/skills/c3/ded/C3.DED.02.ts`
- **Mục tiêu:** Bổ sung các vật phẩm quy đổi & triệt tiêu đại số vào dataset và cấu hình 4 `SkillLevelPlan` chuẩn.
- **Hành động cụ thể:**
  1. Bổ sung các quan hệ quy đổi (`relations`) và items đại số:
     - Biểu tượng ngôi sao vàng ⭐ (`ws16-star-gold`, val: 5)
     - Mặt trăng tím 🌙 (`ws16-moon-purple`, val: 6)
     - Tam giác đỏ 🔺 (`ws16-triangle-red`, val: 3)
     - Kim cương xanh 💎 (`ws16-diamond-cyan`, val: 2)
  2. Bổ sung 4 `SkillLevelPlan` vào `C3_DED_02_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-DED-SLOT-0101",
       template: "GT-008",
       band: "5-6",
       difficulty: 2,
       access_tier: "login",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D2",
     },
     {
       code: "GL-C3-DED-TAP-0102",
       template: "GT-001",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D2",
     },
     {
       code: "GL-C3-DED-TAP-0103",
       template: "GT-001",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D3",
     },
     {
       code: "GL-C3-DED-SLOT-0104",
       template: "GT-008",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D3",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Khớp cấu trúc độ khó và tier: diff 2 = `login`, diff 3 = `standard`, diff 4 = `premium`.
  - [ ] `montessori_ref` phân bổ đúng cho D2 và D3.

---

### Task 6: Bổ Sung 2 Level Capstone vào Seeder `C3.DED.03`
- **Tập tin:** `packages/content/src/skills/c3/ded/C3.DED.03.ts`
- **Mục tiêu:** Cấu hình 2 `SkillLevelPlan` độ khó cao (diff 4 và diff 5) cho chuỗi cân liên hoàn và mở khóa kho báu.
- **Hành động cụ thể:**
  1. Thêm 2 `SkillLevelPlan` vào `C3_DED_03_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-DED-SLOT-0105",
       template: "GT-008",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D3",
     },
     {
       code: "GL-C3-DED-SLOT-0106",
       template: "GT-008",
       band: "5-6",
       difficulty: 5,
       access_tier: "premium",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB16-D3",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 2 level có `access_tier: "premium"`.
  - [ ] `GL-C3-DED-SLOT-0106` đại diện cho thử thách Capstone mở mật mã 6 số `5-6-3-2-4-8`.

---

### Task 7: Đồng Bộ & Kiểm Thử Builders (`gt-014.ts`, `gt-001.ts`, `gt-008.ts`)
- **Tập tin liên quan:**
  - `packages/content/src/builders/gt-014.ts`
  - `packages/content/src/builders/gt-001.ts`
  - `packages/content/src/builders/gt-008.ts`
- **Mục tiêu:** Đảm bảo các builder sinh `ProjectedPack` tương thích hoàn hảo với các dataset mới được làm giàu từ Chặng 16.
- **Hành động cụ thể:**
  1. Kiểm tra logic chiếu của `projectGT014` trong `packages/content/src/builders/gt-014.ts`:
     - Đảm bảo `requires: { min_items: 2, max_items: 6 }` được thỏa mãn bởi `C1_MEAS_07_DATASET`.
     - Kiểm tra trường `goal` (`"balance"`, `"pick_heavier"`, `"pick_lighter"`) sinh đúng Zod schema của `GT014ContentSchema`.
  2. Kiểm tra `projectGT001` và `projectGT008` sinh ra options và slots hợp lệ cho các level trắc nghiệm Đúng/Sai và kéo thả thẻ số bù trừ.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Chạy vitest cho các builder `pnpm --filter @mindkid/content test` đạt kết quả xanh (Green).

---

### Task 8: Chạy Verification Gates
- **Tập tin liên quan:**
  - `packages/content-build/tests/gates/montessori-corpus.test.ts`
  - `packages/content-build/src/gates/montessori-gate.ts`
- **Mục tiêu:** Toàn bộ hệ thống kiểm tra chất lượng tự động đạt 100% exit code 0.
- **Hành động cụ thể:**
  1. Chạy lint & format: `pnpm lint:safe`.
  2. Chạy typecheck: `pnpm typecheck` trên toàn bộ monorepo.
  3. Chạy test suite montessori gate:
     ```bash
     pnpm --filter @mindkid/content-build test
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Exit code 0, không có lỗi typescript, không có cảnh báo vi phạm `BR-MCM-06` hay `BR-MGL-02`.
  - [ ] `montessori-gate.ts` xác nhận 12 level mới của WB16 đều đạt chuẩn.
