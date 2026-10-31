# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 17: Lâu Đài Sudoku Bí Ẩn (WB17)

> **Căn cứ đặc tả:** [`chang-17-spec.md`](./chang-17-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-17/analysis.json` (*Chặng 17: Lâu Đài Sudoku Bí Ẩn — Thử Thách Tư Duy Với Số, Chữ Và Hình*, WB17, 24 trang)  
> **Mục tiêu cốt lõi:** Cung cấp tài liệu hướng dẫn hành động cụ thể cho `montessori_code_implementer` để chuyển hóa dữ liệu Chặng 17 vào các game engine hiện tại (`GT-015`, `GT-008`, `GT-011`, `GT-001`, `GT-000`), giải quyết dứt điểm điểm nghẽn 0 Montessori level của `WB17-D1`, `WB17-D2` và `WB17-D3` trong `C3.MTX`, và làm giàu database seeder tại `packages/content/src/skills/c3/mtx/` (`C3.MTX.01`, `C3.MTX.02`, `C3.MTX.03`).  
> **Bất biến kiến trúc:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Hủy bỏ và loại trừ hoàn toàn dự thảo `GT-054`. Tuân thủ nghiêm ngặt `BR-MCM-06` (không chứa từ khóa thương mại IQ/Raven/trí tuệ) và `BR-MGL-02` (mọi mã level sequence $\ge 0101$).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung SkillDataset & Level Plans vào C3.MTX.01 (Sudoku Biểu Tượng Hình Học 4x4)
   │
   ├──> Task 4: Bổ sung SkillDataset & Level Plans vào C3.MTX.02 (Sudoku Chữ Số 1–4 Khởi Động & Nâng Cao)
   │
   ├──> Task 5: Bổ sung SkillDataset & Level Plans vào C3.MTX.03 (Sudoku Chữ Cái LION, BEAR, FISH, BOAT)
   │
   ├──> Task 6: Kiểm tra tính tương thích với Projection Builders (GT-015, GT-008, GT-011, GT-001)
   │
   └──> Task 7: Chạy cổng kiểm thử & Xác thực chất lượng (typecheck, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập Nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ định nghĩa cơ chế và engine của các dạng bài Chặng 17 (`WB17-D1`, `WB17-D2`, `WB17-D3`), khẳng định sử dụng các khuôn hiện hữu (`GT-015`, `GT-008`, `GT-011`, `GT-001`), loại bỏ mọi nguy cơ tạo `GT-054`.
- **Hành động cụ thể:**
  1. Rà soát các hàng dạng bài của `WB17` tại Mục 1:
     - `WB17-D1` | Band: `5-6` | C3 | `C3.MTX` | Lô: `B` | Khuôn: `GT-015` (kèm `GT-008`, `GT-001`) | Trạng thái: **Nhận (Lô B)** | Tên: *Sudoku số 1–4 khởi động cơ bản (lưới 4x4, 6–8 gợi ý/bảng)*
     - `WB17-D2` | Band: `5-6` | C3 | `C3.MTX` | Lô: `B` | Khuôn: `GT-015` (kèm `GT-008`, `GT-001`) | Trạng thái: **Nhận (Lô B)** | Tên: *Sudoku ký tự chữ cái tiếng Anh 4x4 (LION, BEAR, FISH, BOAT)*
     - `WB17-D3` | Band: `5-6` | C3 | `C3.MTX` | Lô: `B` | Khuôn: `GT-015` (kèm `GT-011`) | Trạng thái: **Nhận (Lô B)** | Tên: *Thử thách Sudoku số và hình học tăng tiến độ khó (4–5 gợi ý/bảng)*
  2. Ghi nhận `WB17-D1`, `WB17-D2` và `WB17-D3` chuyển sang trạng thái đã có kế hoạch level chuẩn, sẵn sàng được nạp.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các hàng `WB17-D1`, `WB17-D2`, `WB17-D3` trỏ đúng vào các khuôn `GT-015`, `GT-008`, `GT-011`, `GT-001`.
  - [ ] Không xuất hiện mã `GT-054` trong tài liệu.

---

### Task 2: Cập Nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật thông tin hàng Workbook 17 tại Bảng 7.1 và điều chỉnh số liệu hạn ngạch C3 tại Bảng 7.9.
- **Hành động cụ thể:**
  1. Cập nhật hàng 17 tại Bảng 7.1:
     ```markdown
     | 17 | Thử thách Sudoku | 5-6 | C3 | `C3.MTX` | — | `GT-015` lưới không lặp · `GT-008` kéo vào ô khuyết · `GT-011` ma trận chọn hình |
     ```
  2. Cập nhật Bảng 7.9 (Phân bổ dạng bài):
     - Ghi nhận strand `C3.MTX` được nạp 14 level Montessori từ Chặng 17.
     - Cột `Dạng bài đã soạn` và `Level đã soạn` của C3 tăng lên tương ứng.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng 7.1 và 7.9 phản ánh đúng định hướng chuyển giao `WB17-D1..D3` vào `C3.MTX`.
  - [ ] Tuân thủ tuyệt đối `BR-MCM-06`, không có từ ngữ đo lường trí tuệ thương mại.

---

### Task 3: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.MTX.01`
- **Tập tin:** `packages/content/src/skills/c3/mtx/C3.MTX.01.ts`
- **Mục tiêu:** Giải quyết điểm nghẽn 0 Montessori level cho `C3.MTX.01`, làm giàu ngữ liệu chủ đề Biểu tượng hình học Lâu Đài Sudoku và thêm 4 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items hình học Lâu Đài Sudoku vào `C3_MTX_01_DATASET.items`:
     - `geo_circle_blue`: Hình tròn xanh lam (emoji 🔵).
     - `geo_square_red`: Hình vuông đỏ (emoji 🟥).
     - `geo_triangle_yellow`: Hình tam giác vàng (emoji 🔺).
     - `geo_cross_purple`: Dấu chéo tím (emoji ✖️).
     - `castle_block_cube`: Khối đá lâu đài (emoji 🧱).
     - `mystery_matrix_gem`: Viên ngọc ma trận (emoji 💎).
  2. Bổ sung các câu thoại Gấu Logic & Thỏ Quan Sát vào `phrasing`:
     - Prompt: *"Điền các hình tròn, hình vuông, hình tam giác và dấu X sao cho mỗi hàng, mỗi cột, mỗi vùng đều có đủ 4 hình nhé!"*
     - Narration: *"Cùng Gấu Logic và Thỏ Quan Sát giải mã ma trận hình học trong Lâu Đài Sudoku nhé!"*
  3. Thêm 4 `SkillLevelPlan` chuẩn vào `C3_MTX_01_SEED.levels`:
     - `GL-C3-MTX-GRID-0101` (`GT-015`, band 5-6, diff 2, `login`, `montessori_ref: "WB17-D1"`): Khởi động Sudoku hình học — Lưới ma trận biểu tượng 6–7 hình cho sẵn.
     - `GL-C3-MTX-SLOT-0101` (`GT-008`, band 5-6, diff 3, `standard`, `montessori_ref: "WB17-D1"`): Kéo khối hình không lặp — Kéo thả khối hình nổi ◯, □, △, ✕ vào ô khuyết.
     - `GL-C3-MTX-MATRX-0101` (`GT-011`, band 5-6, diff 3, `standard`, `montessori_ref: "WB17-D3"`): Ô vuông hình học đối chiếu — Chạm chọn hình khuyết tại ô giao cắt ma trận.
     - `GL-C3-MTX-GRID-0102` (`GT-015`, band 5-6, diff 4, `premium`, `montessori_ref: "WB17-D3"`): Đại thử thách Sudoku hình 55–60 — Bảng ma trận hình học mật độ gợi ý thấp.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [x] Mã level chuẩn định dạng `GL-C3-MTX-<MECH>-01xx`.
  - [x] `access_tier` khớp độ khó: diff 2=`login`, diff 3=`standard`, diff 4=`premium`.
  - [x] Không chứa từ khóa cấm theo `BR-MCM-06`.

---

### Task 4: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.MTX.02`
- **Tập tin:** `packages/content/src/skills/c3/mtx/C3.MTX.02.ts`
- **Mục tiêu:** Mở rộng năng lực Sudoku chữ số 1–4 cơ bản và nâng cao cho `C3.MTX.02`, thêm 6 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items chữ số 1–4 Lâu Đài Sudoku vào `C3_MTX_02_DATASET.items`:
     - `digit_one_gold`: Chữ số 1 vàng kim (emoji 1️⃣).
     - `digit_two_emerald`: Chữ số 2 xanh ngọc (emoji 2️⃣).
     - `digit_three_orange`: Chữ số 3 cam tươi (emoji 3️⃣).
     - `digit_four_purple`: Chữ số 4 tím hoàng gia (emoji 4️⃣).
     - `magnifier_observer`: Kính lúp quan sát (emoji 🔍).
     - `castle_main_gate`: Cánh cổng ma trận lâu đài (emoji 🏰).
  2. Bổ sung các câu thoại dẫn truyện vào `phrasing`:
     - Prompt: *"Mỗi hàng, mỗi cột và mỗi vùng đều phải có đủ các số 1, 2, 3, 4 nhé!"*
     - Single candidate hint: *"Quan sát hàng hoặc cột đã có 3 số để tìm số còn thiếu duy nhất nhé!"*
  3. Thêm 6 `SkillLevelPlan` chuẩn vào `C3_MTX_02_SEED.levels`:
     - `GL-C3-MTX-GRID-0103` (`GT-015`, band 5-6, diff 1, `free`, `montessori_ref: "WB17-D1"`): Khởi động Sudoku số 1–4 — Lưới ma trận số 7–8 số cho trước.
     - `GL-C3-MTX-CARD-0101` (`GT-001`, band 5-6, diff 2, `login`, `montessori_ref: "WB17-D1"`): Tìm số khuyết hàng ngang — Chạm chọn số hoàn thiện hàng đã có 3 số.
     - `GL-C3-MTX-SLOT-0102` (`GT-008`, band 5-6, diff 2, `login`, `montessori_ref: "WB17-D1"`): Mảnh ghép vùng con 2x2 — Kéo thả thẻ số vào 2 ô khuyết trong khối $2 \times 2$.
     - `GL-C3-MTX-GRID-0104` (`GT-015`, band 5-6, diff 3, `standard`, `montessori_ref: "WB17-D3"`): Thử thách Sudoku số 1–15 — Ma trận số với 5–6 gợi ý, đối chiếu chéo hàng - cột.
     - `GL-C3-MTX-MATRX-0102` (`GT-011`, band 5-6, diff 4, `premium`, `montessori_ref: "WB17-D3"`): Giao điểm ma trận số — Phân tích ô giao thoa để tìm nghiệm duy nhất.
     - `GL-C3-MTX-GRID-0105` (`GT-015`, band 5-6, diff 5, `premium`, `montessori_ref: "WB17-D3"`): Cực đỉnh Sudoku số 25–30 — Bảng số thử thách cao nhất với 4–5 gợi ý.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [x] Toàn bộ 6 level tuân thủ `GL-C3-MTX-<MECH>-01xx`.
  - [x] `access_tier` khớp độ khó: diff 1=`free`, diff 2=`login`, diff 3=`standard`, diff 4/5=`premium`.

---

### Task 5: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.MTX.03`
- **Tập tin:** `packages/content/src/skills/c3/mtx/C3.MTX.03.ts`
- **Mục tiêu:** Mở rộng năng lực Sudoku ký tự chữ cái tiếng Anh liên môn (LION, BEAR, FISH, BOAT) cho `C3.MTX.03`, thêm 4 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items chữ cái và linh vật vào `C3_MTX_03_DATASET.items`:
     - Bộ từ LION: `letter_L`, `letter_I`, `letter_O`, `letter_N`, `mascot_lion` (emoji 🦁).
     - Bộ từ BEAR: `letter_B`, `letter_E`, `letter_A`, `letter_R`, `mascot_bear` (emoji 🐻).
     - Bộ từ FISH: `letter_F`, `letter_S`, `letter_H`, `mascot_fish` (emoji 🐟).
     - Bộ từ BOAT: `letter_T`, `mascot_boat` (emoji ⛵).
  2. Rà soát và loại bỏ từ khóa "Raven" trong `C3_MTX_03_IDENTITY.learning_objectives` để tuân thủ triệt để `BR-MCM-06`.
  3. Bổ sung các câu thoại dẫn truyện vào `phrasing`:
     - Prompt: *"Điền các chữ cái vào ô trống sao cho mỗi hàng, mỗi cột và mỗi vùng đều có đủ 4 chữ cái nhé!"*
  4. Thêm 4 `SkillLevelPlan` chuẩn vào `C3_MTX_03_SEED.levels`:
     - `GL-C3-MTX-GRID-0106` (`GT-015`, band 5-6, diff 2, `login`, `montessori_ref: "WB17-D2"`): Sudoku chữ cái LION — Ma trận 4 chữ cái L, I, O, N kèm chú sư tử con.
     - `GL-C3-MTX-SLOT-0103` (`GT-008`, band 5-6, diff 3, `standard`, `montessori_ref: "WB17-D2"`): Khối chữ cái BEAR — Kéo thả khối chữ cái B, E, A, R vào ô khuyết vùng $2 \times 2$.
     - `GL-C3-MTX-GRID-0107` (`GT-015`, band 5-6, diff 3, `standard`, `montessori_ref: "WB17-D2"`): Sudoku chữ cái FISH — Giải mã lưới chữ cái F, I, S, H kèm chú cá bơi.
     - `GL-C3-MTX-CARD-0102` (`GT-001`, band 5-6, diff 4, `premium`, `montessori_ref: "WB17-D2"`): Con thuyền chữ cái BOAT — Chạm chọn chữ cái khuyết hoàn thiện từ vựng thuyền buồm.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [x] Toàn bộ 4 level tuân thủ `GL-C3-MTX-<MECH>-01xx`.
  - [x] `access_tier` khớp độ khó: diff 2=`login`, diff 3=`standard`, diff 4=`premium`.
  - [x] Loại bỏ hoàn toàn từ khóa "Raven" trong file.

---

### Task 6: Kiểm Tra Tính Tương Thích Với Projection Builders
- **Tập tin:** `packages/content/src/builders/`
- **Mục tiêu:** Đảm bảo các `SkillLevelPlan` mới sinh ra `ContentSeed` hợp lệ qua các builder `gt-015.ts`, `gt-008.ts`, `gt-011.ts`, `gt-001.ts`.
- **Hành động cụ thể:**
  1. Kiểm tra builder `GT-015`: Dataset có $\ge 2$ items, hỗ trợ ánh xạ symbols và cells không lặp.
  2. Kiểm tra builder `GT-008`: Dataset có $\ge 2$ items, hỗ trợ tạo đúng số lượng `slots` và `items`.
  3. Kiểm tra builder `GT-011`: Lưới ma trận có dữ kiện hàng và cột rõ ràng, 1 ô slot khuyết và danh sách phương án lựa chọn.
  4. Kiểm tra builder `GT-001`: Dataset có $\ge 2$ items, có `label` hợp lệ để hiển thị câu hỏi và các distractors.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [x] Hàm `buildLevelsForSkill` chạy thành công mà không throw ngoại lệ validation.

---

### Task 7: Chạy Cổng Kiểm Thử & Xác Thực Chất Lượng
- **Lệnh thực thi:**
  ```bash
  pnpm --filter @mindkid/content typecheck
  pnpm --filter @mindkid/content-build test
  ```
- **Hành động cụ thể:**
  1. Kiểm tra strict TypeScript: 0 lỗi type, 0 `any`, 0 `unknown`.
  2. Chạy bộ test cổng `montessori-corpus.test.ts` và `montessori-gate.ts`:
     - Kiểm tra không có level nào chứa từ khóa cấm theo `BR-MCM-06`.
     - Kiểm tra hạn ngạch C3 không vượt quá giới hạn.
     - Kiểm tra sequence level $\ge 0101$.
     - Kiểm tra `access_tier` khớp độ khó `difficulty`.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [x] Toàn bộ lệnh kiểm tra thoát mã 0 (exit code 0).
