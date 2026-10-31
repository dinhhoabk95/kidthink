# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 14: Thung Lũng Số Bí Ẩn (WB14)

> **Căn cứ đặc tả:** [`chang-14-spec.md`](./chang-14-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-14/analysis.json` (*14 - Be tim so bi an.pdf*, 24 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 3 nhóm dạng bài chuẩn (`WB14-D1`, `WB14-D2`, `WB14-D3`) vào các game engine hiện tại (`GT-009`, `GT-001`, `GT-008`), cập nhật bảng đối chiếu và làm giàu `SkillDataset` + 13 `SkillLevelPlan[]` trong `packages/content/src/skills/c3/ded/` và `packages/content/src/skills/c1/`.  
> **Bất biến:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori $\ge 0101$ (`BR-MGL-02`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Làm giàu Dataset & Bổ sung 3 Level vào C3.DED.01 (GL-C3-DED-CLUE-0101, GL-C3-DED-TAP-0102, GL-C3-DED-SLOT-0103)
   ├──> Task 4: Làm giàu Dataset & Bổ sung 2 Level vào C3.DED.02 (GL-C3-DED-CLUE-0104, GL-C3-DED-TAP-0105)
   ├──> Task 5: Làm giàu Dataset & Bổ sung 2 Level vào C3.DED.03 (GL-C3-DED-CLUE-0106, GL-C3-DED-SLOT-0107)
   │
   ├──> Task 6: Làm giàu Dataset & Bổ sung 3 Level vào C1.ADD.03 (GL-C1-ADD-SLOT-0101, GL-C1-ADD-TAP-0102, GL-C1-ADD-SLOT-0103)
   ├──> Task 7: Làm giàu Dataset & Bổ sung 3 Level vào C1.SUB.03 (GL-C1-SUB-SLOT-0101, GL-C1-SUB-TAP-0102, GL-C1-SUB-SLOT-0103)
   │
   └──> Task 8: Đồng bộ Builders (gt-009, gt-001, gt-008) & Chạy Verification Gates (typecheck, lint)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Cập nhật thông tin chi tiết cho các dạng bài của Workbook 14 (`WB14-D1`, `WB14-D2`, `WB14-D3`).
- **Hành động cụ thể:**
  1. Rà soát các hàng `WB14-D1`, `WB14-D2`, và bổ sung hàng `WB14-D3` trong Bảng 1:
     - `WB14-D1`: Khuôn đề xuất `GT-009` (loại trừ theo manh mối) & `GT-008` (kéo số vào ô khuyết CPA). Trạng thái: **Nhận (Lô B - A2)**. Mô tả: *Phương trình hình ảnh CPA sơ đẳng & Loại trừ số qua 2 manh mối (Lớn hơn/Bé hơn, Chẵn/Lẻ)*.
     - `WB14-D2`: Chuyển từ *Hoãn* sang **Nhận (Lô B - A2)**. Khuôn đề xuất `GT-001` (chạm chọn 1 trong 3 chìa khóa / thẻ số tròn). Mô tả: *Trắc nghiệm chọn số bí ẩn 3 phương án (Chìa khóa vàng, Thẻ ghim gỗ, Ô khóa cửa vòm)*.
     - `WB14-D3`: Thêm/cập nhật hàng `WB14-D3`. Khuôn đề xuất `GT-008` (kéo thả vào ô trống phương trình và hàng ổ khóa mật mã). Trạng thái: **Nhận (Lô B - A2)**. Mô tả: *Tự điền số bí ẩn theo biến thiên vị trí (đầu, giữa, đảo vế c = [] + a) & Chuỗi mật mã 6 số mở rương báu*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 3 hàng `WB14-D1`, `WB14-D2`, `WB14-D3` phản ánh chính xác cấu trúc 24 trang của Chặng 14.
  - [ ] Khớp 100% với đặc tả tại `chang-14-spec.md`.
  - [ ] Không xuất hiện bất kỳ mã khuôn `GT-038+` nào.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Đồng bộ mục 7.1, 7.3 và 7.9 cho Workbook 14.
- **Hành động cụ thể:**
  1. Cập nhật dòng 14 trong Bảng 7.1:
     - Workbook: `14 | Tìm số bí ẩn | 4-5 | C3 | C3.DED · C1.ADD · C1.SUB`
     - Khuôn lô A: `GT-001` (chạm chọn chìa khóa / thẻ số)
     - Cơ chế lô B: `GT-009` loại trừ theo manh mối · `GT-008` kéo vào ô khuyết & chuỗi mật mã
  2. Cập nhật mục 7.9 và phân bổ dạng bài nhận:
     - Ghi nhận việc chia sẻ các dạng bài của WB14 sang Competency C3 (`C3.DED.01`, `C3.DED.02`, `C3.DED.03`), giải tỏa khoảng trống 0 Montessori level của Competency C3.
     - Bổ sung vào các skill số học cốt lõi `C1.ADD.03` và `C1.SUB.03`.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 14 phản ánh đúng các khuôn `GT-009`, `GT-001`, `GT-008`.
  - [ ] Không có bất kỳ vi phạm từ khóa thương mại nào (`BR-MCM-06`).

---

### Task 3: Làm Giàu `SkillDataset` & Bổ Sung 3 Level vào Seeder `C3.DED.01`
- **Tập tin:** `packages/content/src/skills/c3/ded/C3.DED.01.ts`
- **Mục tiêu:** Bổ sung các vật phẩm Thung lũng số bí ẩn và 3 `SkillLevelPlan` chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung các items thám tử vào `items`:
     - Kính lúp thám tử 🔍 (`mag_glass`, val: 1)
     - Chìa khóa vàng 🗝️ (`gold_key`, val: 2)
     - Bản đồ thung lũng 🗺️ (`secret_map`, val: 3)
     - Cánh cổng vòm đá 🚪 (`stone_door`, val: 4)
     - Rương kho báu 📦 (`treasure_chest`, val: 5)
     - Viên ngọc xanh lục 💎 (`blue_gem`, val: 6)
     - Thẻ giấy ghim gỗ 📌 (`pin_note`, val: 7)
     - Huy hiệu thám tử ⭐ (`star_badge`, val: 8)
     - Ổ khóa đồng cổ 🔒 (`lock_padlock`, val: 9)
     - Đèn lồng phát sáng 🏮 (`spark_lamp`, val: 10)
  2. Bổ sung các `relations` đối chiếu thám tử (chìa khóa mở ổ khóa, kính lúp soi thẻ ghim, bản đồ dẫn tới cổng đá, mở rương nhận ngọc).
  3. Cập nhật `phrasing` với câu thoại dẫn dắt của Gấu Logic & Thỏ Quan Sát.
  4. Bổ sung 3 `SkillLevelPlan` vào `C3_DED_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-DED-CLUE-0101",
       template: "GT-009",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D1",
     },
     {
       code: "GL-C3-DED-TAP-0102",
       template: "GT-001",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D2",
     },
     {
       code: "GL-C3-DED-SLOT-0103",
       template: "GT-008",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] 3 level mới mang mã $\ge 0101$, sequence tăng dần.
  - [ ] `access_tier` khớp chính xác `difficulty`: 2=login, 3=standard (`BR-MGL-12`).
  - [ ] `montessori_ref` khớp chuẩn `WB14-D1`, `WB14-D2`, `WB14-D3`.

---

### Task 4: Làm Giàu `SkillDataset` & Bổ Sung 2 Level vào Seeder `C3.DED.02`
- **Tập tin:** `packages/content/src/skills/c3/ded/C3.DED.02.ts`
- **Mục tiêu:** Bổ sung các vật phẩm suy luận điều kiện phủ định và 2 `SkillLevelPlan` chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung items và quan hệ liên quan đến điều kiện phủ định ("không phải...", biển cấm 🚫).
  2. Bổ sung 2 `SkillLevelPlan` vào `C3_DED_02_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-DED-CLUE-0104",
       template: "GT-009",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D1",
     },
     {
       code: "GL-C3-DED-TAP-0105",
       template: "GT-001",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D2",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level $\ge 0101$, sequence không trùng lặp.
  - [ ] `access_tier` khớp độ khó (3=standard, 4=premium).
  - [ ] `montessori_ref` khớp `WB14-D1`, `WB14-D2`.

---

### Task 5: Làm Giàu `SkillDataset` & Bổ Sung 2 Level vào Seeder `C3.DED.03`
- **Tập tin:** `packages/content/src/skills/c3/ded/C3.DED.03.ts`
- **Mục tiêu:** Bổ sung vật phẩm mật mã rương báu và 2 `SkillLevelPlan` chuẩn Montessori (bao gồm Final Capstone).
- **Hành động cụ thể:**
  1. Bổ sung items về mã số và rương báu kho ngọc.
  2. Bổ sung 2 `SkillLevelPlan` vào `C3_DED_03_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-DED-CLUE-0106",
       template: "GT-009",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D1",
     },
     {
       code: "GL-C3-DED-SLOT-0107",
       template: "GT-008",
       band: "5-6",
       difficulty: 5,
       access_tier: "premium",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level $\ge 0101$.
  - [ ] `GL-C3-DED-SLOT-0107` đóng vai trò Final Capstone cho chuỗi mật mã 6 số mở rương báu.
  - [ ] `access_tier` khớp độ khó 4 và 5 (premium).

---

### Task 6: Làm Giàu `SkillDataset` & Bổ Sung 3 Level vào Seeder `C1.ADD.03`
- **Tập tin:** `packages/content/src/skills/c1/add/C1.ADD.03.ts`
- **Mục tiêu:** Bổ sung bài toán tìm số hạng còn thiếu và đẳng thức đảo vế ($c = [ ] + a$).
- **Hành động cụ thể:**
  1. Bổ sung 3 `SkillLevelPlan` vào `C1_ADD_03_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-ADD-SLOT-0101",
       template: "GT-008",
       band: "4-5",
       difficulty: 1,
       access_tier: "free",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D1",
     },
     {
       code: "GL-C1-ADD-TAP-0102",
       template: "GT-001",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D2",
     },
     {
       code: "GL-C1-ADD-SLOT-0103",
       template: "GT-008",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level $\ge 0101$.
  - [ ] `access_tier` khớp độ khó: 1=free, 2=login, 3=standard.
  - [ ] `montessori_ref` khớp `WB14-D1`, `WB14-D2`, `WB14-D3`.

---

### Task 7: Làm Giàu `SkillDataset` & Bổ Sung 3 Level vào Seeder `C1.SUB.03`
- **Tập tin:** `packages/content/src/skills/c1/sub/C1.SUB.03.ts`
- **Mục tiêu:** Bổ sung bài toán tìm số trừ và số bị trừ còn thiếu trong phép trừ.
- **Hành động cụ thể:**
  1. Bổ sung 3 `SkillLevelPlan` vào `C1_SUB_03_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-SUB-SLOT-0101",
       template: "GT-008",
       band: "4-5",
       difficulty: 1,
       access_tier: "free",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D1",
     },
     {
       code: "GL-C1-SUB-TAP-0102",
       template: "GT-001",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D2",
     },
     {
       code: "GL-C1-SUB-SLOT-0103",
       template: "GT-008",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "detective",
       rounds: 3,
       montessori_ref: "WB14-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level $\ge 0101$.
  - [ ] `access_tier` khớp độ khó: 1=free, 2=login, 3=standard.
  - [ ] `montessori_ref` khớp `WB14-D1`, `WB14-D2`, `WB14-D3`.

---

### Task 8: Đồng Bộ Builders & Chạy Verification Gates
- **Tập tin liên quan:**
  - `packages/content/src/builders/gt-009.ts`
  - `packages/content/src/builders/gt-001.ts`
  - `packages/content/src/builders/gt-008.ts`
  - `packages/content/src/builders/build-levels.ts`
- **Hành động cụ thể:**
  1. Đảm bảo các builder `gt-009`, `gt-001`, `gt-008` xử lý trơn tru các dataset mới với theme `detective`.
  2. Chạy lệnh kiểm tra typecheck và lint trên toàn repo:
     ```bash
     pnpm --filter @mindkid/content typecheck
     pnpm --filter @mindkid/content test
     ```
  3. Kiểm tra gate xác thực montessori:
     ```bash
     pnpm --filter @mindkid/content-build test:gates
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có lỗi typecheck TypeScript (`pnpm check` exit 0).
  - [ ] Mọi level mới seed hợp lệ và vượt qua toàn bộ assertions của test gate.
