# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 3: Thung Lũng Bóng & Hình (WB03)

> **Căn cứ đặc tả:** [`chang-03-spec.md`](./chang-03-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-03/analysis.json` (*3 - Thung lung bong va hinh.pdf*)  
> **Mục tiêu cốt lõi:** Phổ biến 3 dạng bài (`WB03-D1`, `WB03-D2`, `WB03-D3`) và Hub mở đầu/kết thúc vào các game engine hiện tại (`GT-005` pair-match, `GT-001` tap-select, `GT-002` tap-select-multi, `GT-000` intro/outro), cập nhật bảng tra cứu dạng bài, và tích hợp vào hệ thống seeder kỹ năng `packages/content/src/skills/c4/`, `c1/`, `c2/`.  
> **Bất biến kiến trúc:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+` (loại bỏ hoàn toàn template ảo `GT-040`). Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori $\ge 0101$ (`BR-MGL-02`). `access_tier` khớp `difficulty` theo `BR-MGL-12`.

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Cập nhật Seeder C4.VIS.01 (SkillDataset & 5 SkillLevelPlan GL-C4-VIS-*)
   ├──> Task 4: Cập nhật Seeder C1.OTO.01 (2 SkillLevelPlan GL-C1-OTO-*)
   ├──> Task 5: Cập nhật Seeder C2.GEO.01 (1 SkillLevelPlan GL-C2-GEO-*)
   └──> Task 6: Cập nhật Seeder C4.DET.04 (SkillDataset & 3 SkillLevelPlan GL-C4-DET-*)
         │
         ├──> Task 7: Cập nhật Builders / Projections liên quan (nếu cần)
         │
         └──> Task 8: Chạy Cổng Kiểm Thử & Verification Gates (typecheck, test-ratchet)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết Cho Implementer

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ hóa các dạng bài của Workbook 03 (Chặng 3) khớp với phân tích PDF thực tế và các khuôn game engine hiện hữu `GT-005`, `GT-001`, `GT-002`.
- **Hành động cụ thể:**
  1. Cập nhật các dòng liên quan đến `WB03` trong Bảng 1:
     - `WB03-D1` | Band: `3-4` | C4 | `C4.VIS` | Lô: `A` | Khuôn: `GT-005` | Trạng thái: **Nhận (Lô A)** | Tên: *Ghép cặp 1-1 vật thể với bóng tương ứng (Trái cây, Đồ chơi, Con vật, Tư thế gấu, Mẹ & Bé, Lễ hội)*
     - `WB03-D2` | Band: `3-4` | C4 | `C4.VIS` | Lô: `A` | Khuôn: `GT-001` | Trạng thái: **Nhận (Lô A)** | Tên: *Trắc nghiệm tìm bóng đúng 4 lựa chọn có phân tích bẫy nhiễu (Sóc, Bướm, Cá, Rô-bốt, Vũ công, Xe cứu hỏa)*
     - `WB03-D3` | Band: `4-5` | C4 | `C4.VIS` | Lô: `A` | Khuôn: `GT-002` | Trạng thái: **Nhận (Lô A)** | Tên: *Đại thử thách ma trận đa hàng & Phân giải bóng phức hợp (Thỏ, Khí cầu, Lâu đài)*
  2. Cập nhật số liệu thống kê ở Mục 2:
     - Tổng số dạng bài nhận đợt này điều chỉnh tăng thêm 1 do ghi nhận `WB03-D3`.
     - Phân bổ competency C4 tăng thêm 1 dạng bài nhận.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng tra cứu hiển thị đầy đủ 3 mã `WB03-D1`, `WB03-D2`, `WB03-D3`.
  - [ ] Khuôn đề xuất: `WB03-D1` $\rightarrow$ `GT-005`, `WB03-D2` $\rightarrow$ `GT-001`, `WB03-D3` $\rightarrow$ `GT-002`.
  - [ ] Tuyệt đối không đề xuất `GT-038+` hay `GT-040`.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật hàng số 03 trong Bảng 7.1 để phản ánh đầy đủ các khuôn Lô A và các strand phụ phục vụ Chặng 3.
- **Hành động cụ thể:**
  1. Sửa hàng 03 tại Mục 7.1:
     ```markdown
     | 03 | Tìm bóng đúng | 3-4 | C4 | `C4.VIS` · `C4.DET` · `C1.OTO` · `C2.GEO` | `GT-001` · `GT-002` · `GT-005` | — |
     ```
  2. Bổ sung ghi chú giải thích: Dạng bài `WB03-D3` (ma trận đa hàng) được vận hành trên khuôn `GT-002` (tap-select-multi) có sẵn trong Lô A, không phát sinh cơ chế Lô B.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 03 liệt kê đầy đủ 3 khuôn `GT-001`, `GT-002`, `GT-005`.
  - [ ] Không có cơ chế Lô B nào bị thiếu (`—`).
  - [ ] Tuân thủ `BR-MCM-06` không chứa từ khóa thương mại IQ/Raven.

---

### Task 3: Làm giàu SkillDataset & Bổ sung 5 SkillLevelPlan vào Seeder `C4.VIS.01`
- **Tập tin:** `packages/content/src/skills/c4/vis/C4.VIS.01.ts`
- **Mục tiêu:** Tích hợp bộ ngữ liệu bóng hình Chặng 3 và bổ sung 5 level Montessori cho `C4.VIS.01`.
- **Hành động cụ thể:**
  1. Mở rộng `C4_VIS_01_DATASET`:
     - Thêm các items trái cây: `fruit_apple` (🍎), `fruit_banana` (🍌), `fruit_pineapple` (🍍).
     - Thêm các items đồ chơi: `toy_car` (🚗), `toy_teddy` (🧸), `toy_kite` (🪁), `toy_ball` (⚽).
     - Thêm các items động vật và bẫy trắc nghiệm: `target_squirrel` (🐿️), `target_butterfly` (🦋), `target_goldfish` (🐟), `target_peacock` (🦚).
     - Thêm các items phức hợp: `target_fire_truck` (🚒), `target_hot_air_balloon` (🎈), `target_castle` (🏰).
     - Bổ sung các quan hệ `pair` và `contrast` phản ánh các bẫy nhiễu sư phạm (lật gương, thiếu phụ kiện, sai đường viền).
     - Bổ sung lời thoại đồng hành của Gấu Logic & Thỏ Quan Sát vào `phrasing`.
  2. Bổ sung 5 `SkillLevelPlan` vào mảng `C4_VIS_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C4-VIS-PAIR-0101",
       template: "GT-005",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB03-D1",
       skill_codes: ["C4.VIS.01", "C4.VIS.02"],
     },
     {
       code: "GL-C4-VIS-PAIR-0102",
       template: "GT-005",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB03-D1",
       skill_codes: ["C4.VIS.01", "C4.DET.02"],
     },
     {
       code: "GL-C4-VIS-TAP-0103",
       template: "GT-001",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB03-D2",
       skill_codes: ["C4.VIS.01", "C2.ORI.02", "C2.MIR.01"],
     },
     {
       code: "GL-C4-VIS-TAP-0104",
       template: "GT-001",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB03-D2",
       skill_codes: ["C4.VIS.01", "C2.ORI.01"],
     },
     {
       code: "GL-C4-VIS-MTX-0105",
       template: "GT-002",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "school",
       rounds: 3,
       montessori_ref: "WB03-D3",
       skill_codes: ["C4.VIS.01", "C2.GEO.03"],
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level sequence $\ge 0101$ (`GL-C4-VIS-*-0101..0105`).
  - [ ] `montessori_ref` trỏ đúng `WB03-D1`, `WB03-D2`, `WB03-D3`.
  - [ ] `access_tier` khớp chuẩn xác với `difficulty`: 1=`free`, 2=`login`, 3=`standard`.
  - [ ] Không có lỗi lint hoặc strict TypeScript error.

---

### Task 4: Bổ sung 2 SkillLevelPlan vào Seeder `C1.OTO.01`
- **Tập tin:** `packages/content/src/skills/c1/oto/C1.OTO.01.ts`
- **Mục tiêu:** Tích hợp bài toán ghép tương ứng 1-1 đồ vật gia đình (`Trang 6`) và cặp mẹ - con (`Trang 10`) của Chặng 3.
- **Hành động cụ thể:**
  1. Bổ sung 2 `SkillLevelPlan` vào mảng `C1_OTO_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-OTO-PAIR-0101",
       template: "GT-005",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "home",
       rounds: 3,
       montessori_ref: "WB03-D1",
       skill_codes: ["C1.OTO.01", "C4.VIS.02"],
     },
     {
       code: "GL-C1-OTO-PAIR-0102",
       template: "GT-005",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "animal",
       rounds: 3,
       montessori_ref: "WB03-D1",
       skill_codes: ["C1.OTO.01", "C1.CMP.01"],
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C1-OTO-PAIR-0101` và `GL-C1-OTO-PAIR-0102` được định nghĩa chính xác.
  - [ ] `montessori_ref: "WB03-D1"`.
  - [ ] `access_tier` khớp `difficulty` (1=`free`, 2=`login`).

---

### Task 5: Bổ sung 1 SkillLevelPlan vào Seeder `C2.GEO.01`
- **Tập tin:** `packages/content/src/skills/c2/geo/C2.GEO.01.ts`
- **Mục tiêu:** Tích hợp bài toán phân tích bóng hình học phương tiện giao thông (`Trang 5`) vào kỹ năng nhận biết hình thể phẳng.
- **Hành động cụ thể:**
  1. Bổ sung 1 `SkillLevelPlan` vào mảng `C2_GEO_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C2-GEO-PAIR-0101",
       template: "GT-005",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "vehicle",
       rounds: 3,
       montessori_ref: "WB03-D1",
       skill_codes: ["C2.GEO.01", "C2.GEO.03", "C2.GEO.04"],
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C2-GEO-PAIR-0101` được định nghĩa chính xác.
  - [ ] `montessori_ref: "WB03-D1"`.
  - [ ] `access_tier: "free"`, `difficulty: 1`.

---

### Task 6: Làm giàu SkillDataset & Bổ sung 3 SkillLevelPlan vào Seeder `C4.DET.04`
- **Tập tin:** `packages/content/src/skills/c4/det/C4.DET.04.ts`
- **Mục tiêu:** Tích hợp bài toán phân biệt tư thế gấu con (`Trang 7`), tư thế nghệ thuật & vận động (`Trang 16, 17`) và thử thách 6 cặp cực hạn (`Trang 20, 21`).
- **Hành động cụ thể:**
  1. Mở rộng `C4_DET_04_DATASET`:
     - Thêm 4 tư thế gấu con: `bear_wave_left`, `bear_cheer_both`, `bear_arms_down`, `bear_point_right`.
     - Thêm tư thế vận động & vũ công: `dancer_ballet`, `boy_scooter`.
     - Thêm các quan hệ `contrast` phân biệt tư thế tay chân đối xứng vs bất đối xứng.
  2. Bổ sung 3 `SkillLevelPlan` vào mảng `C4_DET_04_SEED.levels`:
     ```typescript
     {
       code: "GL-C4-DET-PAIR-0101",
       template: "GT-005",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "home",
       rounds: 3,
       montessori_ref: "WB03-D1",
       skill_codes: ["C4.DET.04", "C2.ORI.01", "C2.ORI.02"],
     },
     {
       code: "GL-C4-DET-TAP-0102",
       template: "GT-001",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "school",
       rounds: 3,
       montessori_ref: "WB03-D2",
       skill_codes: ["C4.DET.04", "C2.ORI.02"],
     },
     {
       code: "GL-C4-DET-PAIR-0103",
       template: "GT-005",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB03-D1",
       skill_codes: ["C4.DET.04", "C4.VIS.01"],
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bổ sung đầy đủ 3 level `GL-C4-DET-*` với sequence $\ge 0101$.
  - [ ] `access_tier` khớp: Diff 2 $\rightarrow$ `login`, Diff 3 $\rightarrow$ `standard`, Diff 4 $\rightarrow$ `premium`.
  - [ ] Dataset phong phú, thể hiện rõ nguyên lý `Pose Discrimination`.

---

### Task 7: Kiểm Tra Khả Năng Chiếu Dự Án (Builders & Projections Check)
- **Tập tin:** `packages/content/src/builders/`
- **Mục tiêu:** Xác minh các projector hiện hữu cho `GT-005` (pair-match), `GT-001` (tap-select) và `GT-002` (tap-select-multi) chiếu đúng các dataset và quan hệ mới mà không bị crash.
- **Hành động cụ thể:**
  1. Kiểm tra projector của `GT-005` xử lý mảng `relations` kiểu `pair` trơn tru.
  2. Kiểm tra projector của `GT-001` sinh đúng danh sách distractor từ các quan hệ `contrast`.
  3. Kiểm tra projector của `GT-002` xử lý ma trận nhiều mục tiêu đúng chuẩn.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có exception khi chạy projection thử nghiệm trên dataset mới.

---

### Task 8: Chạy Toàn Bộ Cổng Kiểm Thử & Verification Gates
- **Lệnh thực thi:**
  ```bash
  pnpm --filter @mindkid/content typecheck
  pnpm --filter @mindkid/content-build test
  pnpm check:test-ratchet
  ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `typecheck` thoát với mã 0 (zero errors).
  - [ ] Không có `any` hoặc `unknown` vi phạm strict TypeScript.
  - [ ] Toàn bộ vitest suites vượt qua suôn sẻ.
