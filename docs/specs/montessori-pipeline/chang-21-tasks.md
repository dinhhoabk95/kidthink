# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 21: Căn Phòng Suy Luận Bí Mật (WB21)

> **Căn cứ đặc tả:** [`chang-21-spec.md`](./chang-21-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-21/analysis.json` (*21 - Ma tran suy luan tong hop.pdf*, 24 trang)  
> **Mục tiêu cốt lõi:** Cung cấp tài liệu hướng dẫn hành động cụ thể cho `montessori_code_implementer` để chuyển hóa dữ liệu Chặng 21 vào các game engine hiện tại (`GT-011` matrix-pick, `GT-001` tap-select, `GT-000` concept-intro & celebration), giải quyết dứt điểm điểm nghẽn 0 Montessori level của `WB21` trong `packages/content`, làm giàu `SkillDataset` và bổ sung 12 `SkillLevelPlan[]` chuẩn vào các seeder thuộc `packages/content/src/skills/c3/mtx/`, `c2/rot/`, `c2/per/`.  
> **Bất biến kiến trúc:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Hủy bỏ và loại trừ hoàn toàn dự thảo `GT-058` cũ. Tuân thủ nghiêm ngặt `BR-MCM-06` (không chứa từ khóa thương mại IQ/Raven/trí tuệ) và `BR-MGL-02` (mọi mã level Montessori sequence $\ge 0101$).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung SkillDataset & Level Plans vào C3.MTX.01 (GL-C3-MTX-MATRX-0101, GL-C3-MTX-MATRX-0102, GL-C3-MTX-TAP-0103)
   │
   ├──> Task 4: Bổ sung SkillDataset & Level Plans vào C3.MTX.02 (GL-C3-MTX-MATRX-0103, GL-C3-MTX-MATRX-0104, GL-C3-MTX-TAP-0105)
   │
   ├──> Task 5: Bổ sung SkillDataset, Dọn sạch từ "Raven" & Bổ sung Level Plans vào C3.MTX.03 (GL-C3-MTX-TAP-0101, GL-C3-MTX-TAP-0102)
   │
   ├──> Task 6: Bổ sung SkillDataset & Level Plans vào C2.ROT.01 & C2.ROT.02 (GL-C2-ROT-TAP-0101, GL-C2-ROT-MATRX-0101)
   │
   ├──> Task 7: Bổ sung SkillDataset & Level Plans vào C2.PER.03 (GL-C2-PER-TAP-0101, GL-C2-PER-TAP-0102)
   │
   └──> Task 8: Chạy cổng kiểm thử & Xác thực chất lượng (typecheck, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập Nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ định nghĩa cơ chế và engine của các dạng bài Chặng 21 (`WB21-D1`, `WB21-D2`, `WB21-D3`, `WB21-D4`), khẳng định sử dụng các khuôn hiện hữu (`GT-011`, `GT-001`), loại bỏ mọi nguy cơ tạo `GT-058`.
- **Hành động cụ thể:**
  1. Rà soát các hàng dạng bài của `WB21` tại Bảng 1:
     - `WB21-D1` | Band: `5-6` | C3 | `C3.MTX` | Lô: `B` | Khuôn: `GT-011` (kèm `GT-001`) | Trạng thái: **Nhận (Lô B - A2)** | Tên: *Ma trận logic $2 \times 2$ biến đổi thuộc tính & ghép mảnh ô lưới pixel*
     - `WB21-D2` | Band: `5-6` | C3 | `C3.MTX` | Lô: `B` | Khuôn: `GT-011` (kèm `GT-001`) | Trạng thái: **Nhận (Lô B - A2)** | Tên: *Ma trận quy luật $3 \times 3$, chu kỳ ký hiệu dịch chuyển & mật mã số học*
     - `WB21-D3` | Band: `5-6` | C2 | `C2.ROT` | Lô: `B` | Khuôn: `GT-011` (kèm `GT-001`) | Trạng thái: **Nhận (Lô B - A2)** | Tên: *Ma trận xoay hình học, đối xứng gương qua trục thẳng đứng & hình chiếu không gian 3D*
     - `WB21-D4` | Band: `5-6` | C3 | `C3.MTX` | Lô: `B` | Khuôn: `GT-011` (kèm `GT-001`) | Trạng thái: **Nhận (Lô B - A2)** | Tên: *Suy luận tương quan vị trí hàm số $A:B::C:D$ và khóa số trung tâm mở cổng*
  2. Ghi nhận `WB21-D1`, `WB21-D2`, `WB21-D3` chuyển sang trạng thái đã có kế hoạch level chuẩn, sẵn sàng được nạp vào seeder.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các hàng `WB21-D1`, `WB21-D2`, `WB21-D3` trỏ đúng vào các khuôn hiện hành `GT-011`, `GT-001`.
  - [ ] Tuyệt đối không xuất hiện mã `GT-058` trong tài liệu.

---

### Task 2: Cập Nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật thông tin hàng Workbook 21 tại Bảng 7.1 và điều chỉnh số liệu phân bổ dạng bài tại Bảng 7.9.
- **Hành động cụ thể:**
  1. Cập nhật dòng 21 tại Bảng 7.1:
     ```markdown
     | 21 | Ma trận suy luận tổng hợp | 5-6 | C3 | `C3.MTX` · `C2.ROT` | `GT-001` chạm chọn đáp án | `GT-011` ma trận chọn hình |
     ```
  2. Cập nhật Bảng 7.9 (Phân bổ dạng bài):
     - Ghi nhận việc chia sẻ các level sang competency C3 (`C3.MTX.01`, `C3.MTX.02`, `C3.MTX.03`) và competency C2 (`C2.ROT.01`, `C2.ROT.02`, `C2.PER.03`), giải tỏa nghẽn cho WB21 hiện đang có 0 levels.
     - Cập nhật số level đã soạn của C3 và C2 tuân thủ nghiêm ngặt trần hạn ngạch ở Bảng 7.7.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 21 phản ánh đúng các khuôn `GT-011` và `GT-001`.
  - [ ] Tuyệt đối không vi phạm `BR-MCM-06` (không chứa từ khóa thương mại IQ, Raven, trí tuệ).

---

### Task 3: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.MTX.01`
- **Tập tin:** `packages/content/src/skills/c3/mtx/C3.MTX.01.ts`
- **Mục tiêu:** Khắc phục tình trạng 0 Montessori level cho `C3.MTX.01`, làm giàu ngữ liệu chủ đề Căn Phòng Suy Luận Bí Mật và bổ sung 3 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items Căn Phòng Bí Mật vào `C3_MTX_01_DATASET.items`:
     - `matrix_bead_purple`: Hạt ngũ giác tím (emoji 🟣).
     - `matrix_bead_yellow`: Hạt ngũ giác vàng (emoji 🟡).
     - `matrix_bead_cyan`: Hạt ngũ giác xanh ngọc (emoji 🔷).
     - `analogy_dial_green`: Đĩa xoay tương quan vị trí 4 hướng (emoji 🎛️).
     - `dice_dots_five`: Mặt xúc xắc 5 chấm vàng biến đổi (emoji 🎲).
  2. Bổ sung câu thoại Gấu Logic & Thỏ Quan Sát vào `phrasing`:
     - Prompt: *"Bé quan sát quy luật biến đổi theo hàng và cột để tìm hình còn thiếu nhé!"*
     - Narration: *"Cùng Gấu Logic và Thỏ Quan Sát tìm quy tắc chuyển đổi màu sắc và vị trí nào!"*
  3. Thêm 3 `SkillLevelPlan` chuẩn vào `C3_MTX_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-MTX-MATRX-0101",
       template: "GT-011",
       band: "5-6",
       difficulty: 2,
       access_tier: "login",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D1",
     },
     {
       code: "GL-C3-MTX-MATRX-0102",
       template: "GT-011",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D1",
     },
     {
       code: "GL-C3-MTX-TAP-0103",
       template: "GT-001",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D1",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level chuẩn định dạng `GL-C3-MTX-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 2=`login`, diff 3=`standard`.
  - [ ] `pnpm --filter @mindkid/content typecheck` pass sạch lỗi.

---

### Task 4: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.MTX.02`
- **Tập tin:** `packages/content/src/skills/c3/mtx/C3.MTX.02.ts`
- **Mục tiêu:** Mở rộng năng lực ma trận quy luật 3x3, chu kỳ dịch chuyển ký hiệu và mật mã số học, bổ sung 3 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items chu kỳ ký hiệu và bánh xe số vào `C3_MTX_02_DATASET.items`:
     - `cyclic_symbol_dot`: Ký hiệu chấm đen ma trận (emoji ⚫).
     - `cyclic_symbol_plus`: Ký hiệu dấu cộng ma trận (emoji ➕).
     - `number_wheel_mult_3`: Bánh xe số bội số nan quạt (emoji ☸️).
     - `secret_vault_lock`: Khóa số mật mã mở cửa kho báu (emoji 🔐).
  2. Bổ sung câu thoại dẫn dắt vào `phrasing`:
     - Prompt: *"Tìm mối liên hệ giữa các con số theo hàng và cột trước khi tính nhé!"*
  3. Thêm 3 `SkillLevelPlan` chuẩn vào `C3_MTX_02_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-MTX-MATRX-0103",
       template: "GT-011",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D2",
     },
     {
       code: "GL-C3-MTX-MATRX-0104",
       template: "GT-011",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D2",
     },
     {
       code: "GL-C3-MTX-TAP-0105",
       template: "GT-001",
       band: "5-6",
       difficulty: 5,
       access_tier: "premium",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D2",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level chuẩn định dạng `GL-C3-MTX-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 4/5=`premium`.
  - [ ] `pnpm --filter @mindkid/content typecheck` pass sạch lỗi.

---

### Task 5: Bổ Sung SkillDataset, Làm Sạch Từ Khóa & Thêm Level Plans Vào Seeder `C3.MTX.03`
- **Tập tin:** `packages/content/src/skills/c3/mtx/C3.MTX.03.ts`
- **Mục tiêu:** Dọn sạch vi phạm `BR-MCM-06` trong LO hiện tại, bổ sung items ô lưới pixel/polyomino và cấu hình 2 level chuẩn.
- **Hành động cụ thể:**
  1. **Quan trọng — Sửa lỗi vi phạm `BR-MCM-06`**:
     - Thay thế cụm từ "Raven đơn giản" trong `C3_MTX_03_IDENTITY.learning_objectives` (dòng 17, 24, 31) thành:
       - `LO-C3.MTX.03-01`: *"Nhận biết và thực hành ghép mảnh quy luật ô lưới ở mức cơ bản"*
       - `LO-C3.MTX.03-02`: *"Vận dụng ghép mảnh quy luật ô lưới trong môi trường tương tác"*
       - `LO-C3.MTX.03-03`: *"Giải quyết vấn đề nâng cao liên quan tới ghép mảnh quy luật ô lưới"*
  2. Thêm items ô lưới pixel và đa khối polyomino vào `C3_MTX_03_DATASET.items`:
     - `pixel_grid_4x4`: Lưới pixel 4x4 đa màu (emoji 🔲).
     - `pixel_grid_5x5_t`: Khung vuông 5x5 khuyết lõi chữ T (emoji ⬛).
     - `polyomino_t_block`: Mảnh chữ T 4 ô bù khuyết (emoji 🧩).
     - `polyomino_step_pyramid`: Kim tự tháp bậc thang 20 ô (emoji 🏛️).
  3. Bổ sung 2 `SkillLevelPlan` chuẩn vào `C3_MTX_03_SEED.levels`:
     ```typescript
     {
       code: "GL-C3-MTX-TAP-0101",
       template: "GT-001",
       band: "5-6",
       difficulty: 2,
       access_tier: "login",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D1",
     },
     {
       code: "GL-C3-MTX-TAP-0102",
       template: "GT-001",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D1",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Tuyệt đối sạch từ khóa "Raven" trong toàn bộ file `C3.MTX.03.ts`.
  - [ ] Thêm đủ 2 level chuẩn sequence $\ge 0101$.
  - [ ] `pnpm --filter @mindkid/content typecheck` pass sạch lỗi.

---

### Task 6: Bổ Sung SkillDataset & Level Plans Vào Seeder `C2.ROT.01` & `C2.ROT.02`
- **Tập tin:**
  - `packages/content/src/skills/c2/rot/C2.ROT.01.ts`
  - `packages/content/src/skills/c2/rot/C2.ROT.02.ts`
- **Mục tiêu:** Mở rộng năng lực xoay đảo 180° và đối xứng trục gương thẳng đứng từ dữ liệu Chặng 21.
- **Hành động cụ thể:**
  1. Trong `C2.ROT.01.ts`:
     - Thêm item `inverted_bead_rack`: Chuỗi hạt treo ngược từ xà ngang (emoji 📿).
     - Thêm 1 `SkillLevelPlan`:
       ```typescript
       {
         code: "GL-C2-ROT-TAP-0101",
         template: "GT-001",
         band: "5-6",
         difficulty: 3,
         access_tier: "standard",
         theme: "room_secret",
         rounds: 3,
         montessori_ref: "WB21-D3",
       },
       ```
  2. Trong `C2.ROT.02.ts`:
     - Thêm item `mirror_axis_vertical`: Trục gương nét đứt thẳng đứng (emoji 🪞).
     - Thêm item `color_bead_table_5x6`: Bảng hạt màu 5x6 ô đối xứng (emoji 🎨).
     - Thêm 1 `SkillLevelPlan`:
       ```typescript
       {
         code: "GL-C2-ROT-MATRX-0101",
         template: "GT-011",
         band: "5-6",
         difficulty: 3,
         access_tier: "standard",
         theme: "room_secret",
         rounds: 3,
         montessori_ref: "WB21-D3",
       },
       ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả hai level đều mang nhãn `montessori_ref: "WB21-D3"`.
  - [ ] `access_tier: "standard"` khớp với `difficulty: 3`.

---

### Task 7: Bổ Sung SkillDataset & Level Plans Vào Seeder `C2.PER.03`
- **Tập tin:** `packages/content/src/skills/c2/per/C2.PER.03.ts`
- **Mục tiêu:** Bổ sung các bài toán hình chiếu vuông góc từ trên cao (Top-down view) từ 24 trang PDF Chặng 21 vào `C2.PER.03`.
- **Hành động cụ thể:**
  1. Thêm items hình chiếu 3D vào `C2_PER_03_DATASET.items`:
     - `top_view_cube_tower`: Khối tháp lập phương bậc thang nhìn từ đỉnh (emoji 🏢).
     - `wireframe_cube_rods`: Khung que lập phương có thanh chéo đáy (emoji 📦).
     - `origami_plane_wings`: Máy bay giấy gấp cánh tương phản màu (emoji ✈️).
  2. Bổ sung câu thoại chỉ dẫn góc nhìn từ trên cao vào `phrasing`.
  3. Thêm 2 `SkillLevelPlan` chuẩn vào `C2_PER_03_SEED.levels`:
     ```typescript
     {
       code: "GL-C2-PER-TAP-0101",
       template: "GT-001",
       band: "5-6",
       difficulty: 1,
       access_tier: "free",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D3",
     },
     {
       code: "GL-C2-PER-TAP-0102",
       template: "GT-001",
       band: "5-6",
       difficulty: 2,
       access_tier: "login",
       theme: "room_secret",
       rounds: 3,
       montessori_ref: "WB21-D3",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Level `GL-C2-PER-TAP-0101` có `difficulty: 1` và `access_tier: "free"`.
  - [ ] Level `GL-C2-PER-TAP-0102` có `difficulty: 2` và `access_tier: "login"`.
  - [ ] Cả hai level đều mang nhãn `montessori_ref: "WB21-D3"`.

---

### Task 8: Chạy Cổng Kiểm Thử & Xác Thực Chất Lượng (Verification Gates)
- **Mục tiêu:** Đảm bảo toàn bộ mã nguồn seeder và tài liệu ánh xạ vượt qua các bài kiểm tra tự động của monorepo.
- **Hành động cụ thể:**
  1. Chạy typecheck:
     ```bash
     pnpm --filter @mindkid/content typecheck
     ```
  2. Chạy cổng kiểm tra seed:
     ```bash
     pnpm --filter @mindkid/content-build seed:check
     ```
  3. Rà soát quét toàn bộ các file vừa sửa để đảm bảo không vi phạm `BR-MCM-06`:
     ```bash
     grep -rnE "(iq|raven|trí tuệ|chỉ số thông minh)" packages/content/src/skills/c3/mtx/
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ lệnh typecheck và seed:check exit code 0.
  - [ ] Không phát hiện bất kỳ từ khóa vi phạm `BR-MCM-06`.
  - [ ] Toàn bộ 12 levels của WB21 được hệ sinh thái công nhận là hợp lệ.
