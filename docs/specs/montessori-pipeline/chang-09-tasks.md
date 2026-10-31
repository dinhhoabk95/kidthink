# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 9: Khu Rừng Ngã Rẽ (WB09)

> **Căn cứ đặc tả:** [`chang-09-spec.md`](./chang-09-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-09/analysis.json` (*9 - Me cung dinh huong tim duong.pdf*, 19 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 3 dạng bài chuẩn (`WB09-D1`, `WB09-D2`, `WB09-D3`) vào các game engine hiện tại (`GT-013` maze-path, `GT-024` trace-path, `GT-001` tap-select), đồng bộ bảng tra cứu, và tích hợp vào hệ thống database seeder kỹ năng `packages/content/src/skills/` (`C2.MAZ.01..03`, `C2.DIR.01..02`, `C3.ALG.01`).  
> **Bất biến cốt lõi:** **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori sequence $\ge 0101$ (`BR-MGL-02`). Phân tầng `access_tier` khớp đúng `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4/5: `premium`).

---

## 1. Sơ Đồ Trình Tự Thực Thi (Execution DAG)

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Cập nhật Seeder C2.MAZ.01 (Mê cung đơn: GL-C2-MAZ-MAZE-0101, GL-C2-MAZ-TRAC-0101)
   ├──> Task 4: Cập nhật Seeder C2.MAZ.02 (Mê cung rẽ nhánh: GL-C2-MAZ-MAZE-0102, GL-C2-MAZ-MAZE-0103)
   ├──> Task 5: Cập nhật Seeder C2.MAZ.03 (Tối ưu đường đi: GL-C2-MAZ-TAP-0101, GL-C2-MAZ-TAP-0102)
   ├──> Task 6: Cập nhật Seeder C2.DIR.01 & C2.DIR.02 (Đi lên / Đi xuống: GL-C2-DIR-MAZE-0101, 0102)
   └──> Task 7: Cập nhật Seeder C3.ALG.01 (Lộ trình checkpoint: GL-C3-ALG-MAZE-0101)
         │
         └──> Task 8: Chạy Cổng Kiểm Thử & Verification Gates (typecheck, lint, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ trạng thái của 3 dạng bài `WB09-D1`, `WB09-D2`, `WB09-D3` từ *Hoãn* sang tiếp nhận vào Lô B với các game template hiện có (`GT-013`, `GT-024`, `GT-001`).
- **Hành động cụ thể:**
  1. Cập nhật các dòng hiện có của WB09 tại Bảng 1:
     - `WB09-D1` | Band: `4-5` | C2 | `C2.MAZ` | Lô: `B` | Khuôn: `GT-013` · `GT-024` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Mê cung một đường & rẽ nhánh cơ bản (Tìm đường tới cánh cổng/bông hoa/cây cầu)*
     - `WB09-D2` | Band: `4-5` | C2 | `C2.MAZ` | Lô: `B` | Khuôn: `GT-013` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Mê cung có điều kiện checkpoint (Thu thập chìa khóa/vật phẩm theo chuỗi trước khi về đích)*
     - `WB09-D3` | Band: `5-6` | C2 | `C2.MAZ` | Lô: `B` | Khuôn: `GT-001` · `GT-013` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *So sánh và lựa chọn tuyến đường tối ưu (Đường không bị cụt / Đường ngắn hơn)*
  2. Điều chỉnh thống kê tại Mục 2:
     - Dạng bài nhận đợt này của C2 tăng thêm 3 dạng bài ($2 \rightarrow 5$).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng `WB09-D1`, `WB09-D2`, `WB09-D3` hiển thị chính xác các template `GT-013`, `GT-024`, `GT-001`.
  - [ ] Tuyệt đối không đề cập đến `GT-038+`.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật Hàng 09 trong bảng ánh xạ mục 7.1 phản ánh đầy đủ năng lực số hóa của Chặng 9.
- **Hành động cụ thể:**
  1. Sửa dòng số 09 trong bảng mục 7.1:
     ```markdown
     | 09 | Vượt mê cung & Định hướng | 4-5 | C2 | `C2.MAZ` · `C2.DIR` · `C6.PLN` | `GT-001` · `GT-024` | `GT-013` tìm đường mê cung |
     ```
  2. Cập nhật phân tích sư phạm về 4 nấc thang chiến lược nhận thức (Finger Tracing $\rightarrow$ Lookahead & Backtracking $\rightarrow$ Global Planning $\rightarrow$ Mastery Grid).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 09 ghi nhận đầy đủ 3 khuôn `GT-013`, `GT-024`, `GT-001`.
  - [ ] Không chứa từ khóa thương mại đo trí tuệ theo `BR-MCM-06`.

---

### Task 3: Cập nhật Seeder `C2.MAZ.01` (Mê cung một đường)
- **Tập tin:** `packages/content/src/skills/c2/maz/C2.MAZ.01.ts`
- **Mục tiêu:** Bổ sung kho ngữ liệu Chặng 9 vào `SkillDataset` và khai báo 2 level plan chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung các vật phẩm Chặng 9 vào `C2_MAZ_01_DATASET.items`:
     - `gate_green_leaf` (Cánh cổng lá xanh, 🚪🌿)
     - `sunflower_goal` (Bông hoa mặt trời, 🌻)
     - `wooden_bridge` (Cây cầu gỗ bên suối, 🪵🌉)
  2. Cập nhật `phrasing` với câu thoại đồng hành của Gấu Logic & Thỏ Quan Sát:
     - Prompt: *"Bé hãy tìm đường qua mê cung đến {label} nhé!"*
     - Hint: *"Gợi ý từ Thỏ: Dùng ngón tay thử đường trước khi đi nhé!"*
  3. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C2-MAZ-MAZE-0101",
       template: "GT-013",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "forest",
       rounds: 3,
       montessori_ref: "WB09-D1",
     },
     {
       code: "GL-C2-MAZ-TRAC-0101",
       template: "GT-024",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "forest",
       rounds: 3,
       montessori_ref: "WB09-D1",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C2-MAZ-MAZE-0101` và `GL-C2-MAZ-TRAC-0101` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB09-D1"`.
  - [ ] `access_tier` khớp đúng `difficulty` (2 = `login`, 3 = `standard`).

---

### Task 4: Cập nhật Seeder `C2.MAZ.02` (Mê cung nhiều nhánh)
- **Tập tin:** `packages/content/src/skills/c2/maz/C2.MAZ.02.ts`
- **Mục tiêu:** Bổ sung các vật phẩm đích và checkpoint vào `SkillDataset`, khai báo 2 level plan cho D1 và D2.
- **Hành động cụ thể:**
  1. Bổ sung các vật phẩm vào `C2_MAZ_02_DATASET.items`:
     - `honey_pot` (Hũ mật ong rừng, 🍯)
     - `misty_gate` (Cửa rừng sương mờ, ⛩️🌲)
     - `golden_key` (Chìa khóa vàng mở cổng, 🔑)
     - `owl_tower` (Tháp cú quan sát, 🦉🏯)
  2. Cập nhật `relations` và `ladder` phản ánh chiến lược quay lui (backtracking) và checkpoint.
  3. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C2-MAZ-MAZE-0102",
       template: "GT-013",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "forest",
       rounds: 3,
       montessori_ref: "WB09-D1",
     },
     {
       code: "GL-C2-MAZ-MAZE-0103",
       template: "GT-013",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "forest",
       rounds: 3,
       montessori_ref: "WB09-D2",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Level 0102 thuộc `WB09-D1` (mê cung ngã ba có quay lui).
  - [ ] Level 0103 thuộc `WB09-D2` (mê cung checkpoint nhặt chìa khóa trước khi mở cửa rừng sương mờ).
  - [ ] `access_tier` khớp đúng `difficulty` (3 = `standard`, 4 = `premium`).

---

### Task 5: Cập nhật Seeder `C2.MAZ.03` (Tìm đường ngắn nhất)
- **Tập tin:** `packages/content/src/skills/c2/maz/C2.MAZ.03.ts`
- **Mục tiêu:** Bổ sung các thẻ lựa chọn tuyến đường màu vào `SkillDataset` và khai báo 2 level plan cho D3.
- **Hành động cụ thể:**
  1. Bổ sung các item vào `C2_MAZ_03_DATASET.items`:
     - `route_green` (Đường màu Xanh lục, 🟢)
     - `route_amber` (Đường màu Cam, 🟠)
     - `route_purple` (Đường màu Tím, 🟣)
     - `crystal_cube` (Khối pha lê bí ẩn, 💎✨)
  2. Cập nhật `phrasing`:
     - Prompt: *"Bé hãy chọn con đường thông suốt không bị ngõ cụt để đến {label} nhé!"*
  3. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C2-MAZ-TAP-0101",
       template: "GT-001",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "forest",
       rounds: 3,
       montessori_ref: "WB09-D3",
     },
     {
       code: "GL-C2-MAZ-TAP-0102",
       template: "GT-001",
       band: "5-6",
       difficulty: 5,
       access_tier: "premium",
       theme: "forest",
       rounds: 3,
       montessori_ref: "WB09-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C2-MAZ-TAP-0101` và `GL-C2-MAZ-TAP-0102` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB09-D3"`.
  - [ ] Template `GT-001`.

---

### Task 6: Cập nhật Seeder `C2.DIR.01` (Đi lên) & `C2.DIR.02` (Đi xuống)
- **Tập tin:** `packages/content/src/skills/c2/dir/C2.DIR.01.ts` & `packages/content/src/skills/c2/dir/C2.DIR.02.ts`
- **Mục tiêu:** Bổ sung bối cảnh thám hiểm Chặng 9 và khai báo level plan mê cung định hướng `GT-013`.
- **Hành động cụ thể:**
  1. Trong `C2.DIR.01.ts` (Đi lên):
     - Bổ sung item `cave_lantern` (Chiếc đèn hang đá, 🏮).
     - Khai báo level plan:
       ```typescript
       {
         code: "GL-C2-DIR-MAZE-0101",
         template: "GT-013",
         band: "3-4",
         difficulty: 1,
         access_tier: "free",
         theme: "nature",
         rounds: 3,
         montessori_ref: "WB09-D1",
       }
       ```
  2. Trong `C2.DIR.02.ts` (Đi xuống):
     - Bổ sung item `moonlight_stream` (Bờ suối ánh trăng, 🌙🌊).
     - Khai báo level plan:
       ```typescript
       {
         code: "GL-C2-DIR-MAZE-0102",
         template: "GT-013",
         band: "3-4",
         difficulty: 1,
         access_tier: "free",
         theme: "nature",
         rounds: 3,
         montessori_ref: "WB09-D1",
       }
       ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Level 0101 và 0102 có `access_tier: "free"` khớp với `difficulty: 1`.
  - [ ] `montessori_ref: "WB09-D1"`.

---

### Task 7: Cập nhật Seeder `C3.ALG.01` (Làm theo hai bước)
- **Tập tin:** `packages/content/src/skills/c3/alg/C3.ALG.01.ts`
- **Mục tiêu:** Bổ sung level plan lộ trình 2 chặng điều kiện (WB09-D2).
- **Hành động cụ thể:**
  1. Bổ sung các bước lộ trình thám hiểm vào `C3_ALG_01_DATASET.items`.
  2. Khai báo level plan:
     ```typescript
     {
       code: "GL-C3-ALG-MAZE-0101",
       template: "GT-013",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB09-D2",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `code: "GL-C3-ALG-MAZE-0101"`, `montessori_ref: "WB09-D2"`.
  - [ ] `access_tier: "login"` khớp với `difficulty: 2`.

---

### Task 8: Verification Gates & Kiểm Thử Chất Lượng
- **Tập tin:** Toàn bộ các file seeder đã sửa đổi và tests.
- **Hành động cụ thể:**
  1. Chạy typecheck và linting:
     ```bash
     pnpm check
     ```
  2. Chạy test suite xác thực Montessori corpus:
     ```bash
     pnpm --filter @mindkid/content-build test
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `pnpm check` exit code 0 (không lỗi strict TypeScript, không có `any`).
  - [ ] Mọi level mới khai báo đều compile thành công qua `build-levels.ts`.
  - [ ] Không có hex literal ngoài token trong bất kỳ file nào.
