# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 12: Xưởng Máy Biến Hình (WB12)

> **Căn cứ đặc tả:** [`chang-12-spec.md`](./chang-12-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-12/analysis.json` (*12 - Bai toan thay the so dang.pdf*, 23 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 3 nhóm dạng bài chuẩn (`WB12-D1`, `WB12-D2`, `WB12-D3`) vào các game engine hiện tại (`GT-010`, `GT-008`, `GT-001`), cập nhật bảng đối chiếu và làm giàu `SkillDataset` + 12 `SkillLevelPlan[]` trong `packages/content/src/skills/c1/prob/` và `packages/content/src/skills/c3/inf/`.  
> **Bất biến:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori $\ge 0101$ (`BR-MGL-02`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Làm giàu Dataset & Bổ sung 6 Level vào C1.PROB.06 (GL-C1-PROB-SLOT-0101, GL-C1-PROB-SUBST-0102..0106)
   ├──> Task 4: Bổ sung 2 Level Capstone vào C1.PROB.01 (GL-C1-PROB-SUBST-0107, GL-C1-PROB-SUBST-0108)
   ├──> Task 5: Làm giàu Dataset & Bổ sung 2 Level vào C3.INF.01 (GL-C3-INF-SUBST-0101, GL-C3-INF-TAP-0102)
   ├──> Task 6: Làm giàu Dataset & Bổ sung 2 Level vào C3.INF.02 (GL-C3-INF-TAP-0103, GL-C3-INF-TAP-0104)
   │
   ├──> Task 7: Đồng bộ & Kiểm thử Builders (gt-010, gt-008, gt-001)
   │
   └──> Task 8: Chạy Verification Gates (typecheck, test-ratchet, lint)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Cập nhật thông tin chi tiết cho các dạng bài `WB12-D1`, `WB12-D2`, `WB12-D3` từ phân tích 23 trang PDF Chặng 12.
- **Hành động cụ thể:**
  1. Rà soát các hàng `WB12-D1`, `WB12-D2`, `WB12-D3` trong Bảng 1:
     - `WB12-D1`: Cập nhật khuôn đề xuất hỗ trợ `GT-010` (thay thế biểu tượng) và `GT-008` (kéo số vào ô bánh răng). Mô tả: *Thay thế trực quan 1-1 & Phép tính cơ bản (+, -, hỗn hợp phạm vi 1..8)*.
     - `WB12-D2`: Cập nhật khuôn đề xuất hỗ trợ `GT-010` và `GT-001`. Mô tả: *Thay thế biểu tượng lặp lại (A + A, A + B + A) & Bảo toàn giá trị biến số*.
     - `WB12-D3`: Chuyển từ *Hoãn* sang **Nhận (Lô B - A2)**, khuôn đề xuất `GT-010`, `GT-001`. Mô tả: *Thay thế biểu tượng dải số lớn tới 15, trắc nghiệm 3 nút có nhiễu kề sát, kiểm định Đúng/Sai và Capstone tới 19*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 3 hàng `WB12-D1`, `WB12-D2`, `WB12-D3` phản ánh chính xác cấu trúc 23 trang của Chặng 12.
  - [ ] Khớp 100% với đặc tả tại `chang-12-spec.md`.
  - [ ] Không xuất hiện bất kỳ mã khuôn `GT-038+` nào.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Đồng bộ mục 7.1, 7.3 và 7.9 cho Workbook 12.
- **Hành động cụ thể:**
  1. Cập nhật dòng 12 trong Bảng 7.1:
     - Workbook: `12 | Bài toán thay thế sơ đẳng | 4-5 | C1 | C1.PROB · C3.INF`
     - Khuôn lô A: `GT-001` (chọn đáp án trắc nghiệm / kiểm định Đúng-Sai)
     - Cơ chế lô B: `GT-010` thay thế biểu tượng · `GT-008` kéo vào ô khuyết
  2. Cập nhật Bảng 7.9 (Phân bổ dạng bài nhận):
     - Ghi nhận việc chia sẻ các dạng bài của WB12 sang competency C3 (`C3.INF.01`, `C3.INF.02`), giúp giải tỏa quota của C3 hiện đang ở mức 0/15 level.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 12 phản ánh đúng các khuôn `GT-001`, `GT-010`, `GT-008`.
  - [ ] Không có bất kỳ vi phạm từ khóa thương mại nào (`BR-MCM-06`).

---

### Task 3: Làm Giàu `SkillDataset` & Bổ Sung 6 Level vào Seeder `C1.PROB.06`
- **Tập tin:** `packages/content/src/skills/c1/prob/C1.PROB.06.ts`
- **Mục tiêu:** Làm giàu dataset với các linh kiện Xưởng Máy Biến Hình và bổ sung 6 `SkillLevelPlan` chuẩn.
- **Hành động cụ thể:**
  1. Thêm mảng `CHANG_12_WORKSHOP_DATASET` chứa các items:
     - Bánh răng xanh ngọc ⚙️ (`ws_gear_teal`, val: 1)
     - Dâu tây đỏ 🍓 (`ws_strawberry_red`, val: 2)
     - Bánh cupcake dâu 🧁 (`ws_cupcake_pink`, val: 3)
     - Cờ lê cam 🔧 (`ws_wrench_orange`, val: 2)
     - Đai ốc vàng 🔩 (`ws_screw_gold`, val: 1)
     - Hộp đồ nghề xanh 🧰 (`ws_toolbox_blue`, val: 6)
     - Bình pin năng lượng 🔋 (`ws_battery_green`, val: 3)
     - Tia chớp điện lực ⚡️ (`ws_lightning_yellow`, val: 2)
     - Viên ngọc xanh lá 💎 (`ws_gem_emerald`, val: 8)
     - Lò xo xoắn vàng 🌀 (`ws_spring_spiral`, val: 3)
     - Nút bấm công tắc 🔘 (`ws_button_round`, val: 1)
     - Bình cầu tím 🧪 (`ws_flask_purple`, val: 7)
     - Bình tam giác vàng ⚗️ (`ws_alembic_gold`, val: 4)
     - Tinh thể pha lê xanh 🔮 (`ws_crystal_cyan`, val: 2)
  2. Cập nhật `phrasing` với câu thoại dẫn dắt của Gấu Logic & Thỏ Quan Sát.
  3. Bổ sung 6 `SkillLevelPlan` vào `C1_PROB_06_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-PROB-SLOT-0101",
       template: "GT-008",
       band: "4-5",
       difficulty: 1,
       access_tier: "free",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB12-D1",
     },
     {
       code: "GL-C1-PROB-SUBST-0102",
       template: "GT-010",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB12-D1",
     },
     {
       code: "GL-C1-PROB-SLOT-0103",
       template: "GT-008",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB12-D1",
     },
     {
       code: "GL-C1-PROB-SUBST-0104",
       template: "GT-010",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "art",
       rounds: 3,
       montessori_ref: "WB12-D1",
     },
     {
       code: "GL-C1-PROB-SUBST-0105",
       template: "GT-010",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB12-D2",
     },
     {
       code: "GL-C1-PROB-SUBST-0106",
       template: "GT-010",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "science",
       rounds: 3,
       montessori_ref: "WB12-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] 6 level mới mang mã $\ge 0101$, sequence tăng dần.
  - [ ] `access_tier` khớp chính xác `difficulty`: 1=free, 2=login, 3=standard, 4=premium (`BR-MGL-12`).
  - [ ] `montessori_ref` khớp chuẩn `WB12-D1`, `WB12-D2`, `WB12-D3`.

---

### Task 4: Bổ Sung 2 Level Capstone vào Seeder `C1.PROB.01`
- **Tập tin:** `packages/content/src/skills/c1/prob/C1.PROB.01.ts`
- **Mục tiêu:** Tích hợp 2 level đỉnh cao giải quyết vấn đề nhiều bước từ Trang 21–22 của Chặng 12.
- **Hành động cụ thể:**
  1. Bổ sung các vật phẩm Vương miện hoàng gia 👑 (`ws_crown_gold`, 8), Khiên hiệp sĩ bạc 🛡️ (`ws_shield_silver`, 5), Viên ngọc bích 💎 (`ws_gem_emerald_val3`, 3), Ngọc bích quyền năng 🟢 (`ws_gem_power_nine`, 9) vào `C1_PROB_01_DATASET`.
  2. Bổ sung 2 `SkillLevelPlan` vào `C1_PROB_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-PROB-SUBST-0107",
       template: "GT-010",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB12-D3",
     },
     {
       code: "GL-C1-PROB-SUBST-0108",
       template: "GT-010",
       band: "5-6",
       difficulty: 5,
       access_tier: "premium",
       theme: "castle",
       rounds: 4,
       montessori_ref: "WB12-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 2 level mang mã `GL-C1-PROB-SUBST-0107` và `0108`.
  - [ ] `access_tier: "premium"` khớp `difficulty: 4, 5`.
  - [ ] `montessori_ref: "WB12-D3"`.

---

### Task 5: Làm Giàu `SkillDataset` & Bổ Sung 2 Level vào Seeder `C3.INF.01`
- **Tập tin:** `packages/content/src/skills/c3/inf/C3.INF.01.ts`
- **Mục tiêu:** Tích hợp các bài toán suy luận giá trị bảng mã vào kỹ năng `C3.INF.01`.
- **Hành động cụ thể:**
  1. Bổ sung các items hộp đồ nghề cơ khí và bánh ngọt vào `C3_INF_01_DATASET`.
  2. Bổ sung 2 `SkillLevelPlan` vào `C3_INF_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-INF-SUBST-0101",
       template: "GT-010",
       band: "4-5",
       difficulty: 1,
       access_tier: "free",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB12-D1",
     },
     {
       code: "GL-C3-INF-TAP-0102",
       template: "GT-001",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB12-D2",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C3-INF-SUBST-0101` và `GL-C3-INF-TAP-0102` $\ge 0101$.
  - [ ] `montessori_ref` khớp tương ứng `WB12-D1`, `WB12-D2`.
  - [ ] `access_tier` khớp: 1=`free`, 2=`login`.

---

### Task 6: Làm Giàu `SkillDataset` & Bổ Sung 2 Level vào Seeder `C3.INF.02`
- **Tập tin:** `packages/content/src/skills/c3/inf/C3.INF.02.ts`
- **Mục tiêu:** Tích hợp bài toán trắc nghiệm chọn nút có bẫy nhiễu và kiểm định Đúng/Sai vào `C3.INF.02`.
- **Hành động cụ thể:**
  1. Bổ sung các items cần gạt điều khiển, bóng đèn, chìa khóa cơ khí vào `C3_INF_02_DATASET`.
  2. Bổ sung 2 `SkillLevelPlan` vào `C3_INF_02_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-INF-TAP-0103",
       template: "GT-001",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "workshop",
       rounds: 3,
       montessori_ref: "WB12-D3",
     },
     {
       code: "GL-C3-INF-TAP-0104",
       template: "GT-001",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "workshop",
       rounds: 4,
       montessori_ref: "WB12-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C3-INF-TAP-0103` và `GL-C3-INF-TAP-0104` $\ge 0101$.
  - [ ] `montessori_ref: "WB12-D3"`.
  - [ ] `access_tier` khớp: 3=`standard`, 4=`premium`.

---

### Task 7: Đồng Bộ & Kiểm Tra Builders (`packages/content/src/builders/`)
- **Tập tin:** `packages/content/src/builders/gt-010.ts`, `gt-008.ts`, `gt-001.ts`
- **Mục tiêu:** Đảm bảo các builder tạo ra `content_pack` và `difficulty_params` hợp lệ theo contract của template khi nạp `SkillLevelPlan` Chặng 12.
- **Hành động cụ thể:**
  1. Xác nhận `buildGT010Level` hỗ trợ mảng biểu thức lặp lại và câu hỏi `kind: "sum"`.
  2. Xác nhận `buildGT008Level` hỗ trợ cơ chế thả thẻ số vào ô bánh răng kết quả.
  3. Xác nhận `buildGT001Level` hỗ trợ chế độ trắc nghiệm 3 nút chọn và 2 nút lựa chọn Đúng/Sai.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có lỗi typecheck hay schema mismatch.
  - [ ] Test fixtures round-trip pass 100%.

---

### Task 8: Chạy Toàn Bộ Verification Gates
- **Mục tiêu:** Xác thực toàn bộ pipeline trước khi bàn giao.
- **Lệnh thực thi:**
  1. `pnpm --filter @mindkid/content typecheck`
  2. `pnpm --filter @mindkid/content test`
  3. `pnpm --filter @mindkid/content-build test packages/content-build/tests/gates/montessori-corpus.test.ts`
  4. `pnpm lint:safe`
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mọi lệnh verify đều exit code 0.
  - [ ] 0 lỗi typecheck (không `any`, không `unknown`).
  - [ ] Cổng `montessori-corpus.test.ts` pass xanh.
