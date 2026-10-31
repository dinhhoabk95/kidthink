# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 19: Thành Phố Hình Khối (WB19)

> **Căn cứ đặc tả:** [`chang-19-spec.md`](./chang-19-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-19/analysis.json` (*Chặng 19: Thành Phố Hình Khối — Quan Sát, Nhận Biết, Đếm Hình, Giải Mã Hình Ghép*, WB19, 25 trang)  
> **Mục tiêu cốt lõi:** Cung cấp tài liệu hướng dẫn hành động cụ thể cho `montessori_code_implementer` để chuyển hóa dữ liệu Chặng 19 vào các game engine hiện tại (`GT-000`, `GT-001`, `GT-002`, `GT-003`, `GT-005`, `GT-008`, `GT-020`), giải quyết triệt để điểm nghẽn thiếu hụt level Montessori trong các skill `C2.GEO.01..04` và `C2.ROT.01`, đồng thời làm giàu database seeder tại `packages/content/src/skills/c2/`, `c3/cls/`, `c1/cnt/`, `c1/pat/`.  
> **Bất biến kiến trúc:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Hủy bỏ và loại trừ hoàn toàn dự thảo `GT-056` và khuôn `GT-017` (khối 3D xếp chồng cũ). Tuân thủ nghiêm ngặt `BR-MCM-06` (không chứa từ khóa thương mại IQ/Raven/trí tuệ) và `BR-MGL-02` (mọi mã level sequence $\ge 0101$).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung SkillDataset & Level Plans vào C2.GEO.03 (Hình Tam Giác)
   │
   ├──> Task 4: Bổ sung SkillDataset & Level Plans vào C2.GEO.04 (Hình Chữ Nhật)
   │
   ├──> Task 5: Bổ sung SkillDataset & Level Plans vào C2.GEO.02 (Hình Vuông)
   │
   ├──> Task 6: Bổ sung SkillDataset & Level Plans vào C2.GEO.01 (Hình Tròn)
   │
   ├──> Task 7: Bổ sung SkillDataset & Level Plans vào C2.ROT.01 (Bất Biến Phép Quay)
   │
   ├──> Task 8: Bổ sung SkillDataset & Level Plans vào C3.CLS.02 (Phân Biệt Đối Lập & 4 Giỏ)
   │
   ├──> Task 9: Bổ sung Level Plans vào C1.CNT.01 & C1.PAT.01 (Đếm Ma Trận & Chuỗi Lặp)
   │
   ├──> Task 10: Kiểm tra tính tương thích với Projection Builders (GT-001, GT-005, GT-008, GT-002, GT-003)
   │
   └──> Task 11: Chạy cổng kiểm thử & Xác thực chất lượng (pnpm check, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập Nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Hiệu chỉnh định nghĩa dạng bài Chặng 19 từ hiểu lầm khối 3D kỹ thuật cũ (`GT-017`) sang bản chất hình học phẳng 2D và đồ vật thực tế mầm non 3–5 tuổi (`GT-000`, `GT-001`, `GT-002`, `GT-003`, `GT-005`, `GT-008`), loại bỏ hoàn toàn dự thảo `GT-056`.
- **Hành động cụ thể:**
  1. Thay thế các hàng dạng bài của `WB19` tại Mục 1 thành:
     - `WB19-D1` | Band: `3-4` | C2 | `C2.GEO` | Lô: `A` | Khuôn: `GT-001` (kèm `GT-000`, `GT-005`) | Trạng thái: **Nhận (Lô A)** | Tên: *Khám phá thuộc tính giải phẫu hình phẳng 2D (Tam giác, Chữ nhật, Vuông, Tròn: Cạnh, Đỉnh, Góc)*
     - `WB19-D2` | Band: `3-4` | C2 | `C2.ROT` | Lô: `A` | Khuôn: `GT-001` (kèm `GT-005`) | Trạng thái: **Nhận (Lô A)** | Tên: *Nhận diện bất biến qua phép quay (Tam giác xoay hướng, Vuông xoay 45°)*
     - `WB19-D3` | Band: `3-4` | C2 | `C2.GEO` | Lô: `A` | Khuôn: `GT-005` | Trạng thái: **Nhận (Lô A)** | Tên: *Nối hình học với tên gọi tiếng Việt và thuộc tính định nghĩa*
     - `WB19-D4` | Band: `3-5` | C2 | `C2.GEO` | Lô: `A` | Khuôn: `GT-005` (kèm `GT-001`) | Trạng thái: **Nhận (Lô A)** | Tên: *Ánh xạ đồ vật thực tế đời sống sang hình học phẳng 2D (Cửa, sách, bảng, bóng, bánh xe, cửa sổ, pizza, diều)*
     - `WB19-D5` | Band: `4-5` | C1 | `C1.CNT` | Lô: `A` | Khuôn: `GT-002` (kèm `GT-001`) | Trạng thái: **Nhận (Lô A)** | Tên: *Đếm số lượng hình trong ma trận hỗn hợp dày đặc và đếm tập hợp bù*
     - `WB19-D6` | Band: `4-5` | C3 | `C3.CLS` | Lô: `B` | Khuôn: `GT-008` (kèm `GT-003`) | Trạng thái: **Nhận (Lô B)** | Tên: *Phân loại giỏ hình học (Hộp Vuông vs Chữ nhật; 4 giỏ Tam giác/Chữ nhật/Vuông/Tròn)*
     - `WB19-D7` | Band: `4-5` | C1 | `C1.PAT` | Lô: `A` | Khuôn: `GT-003` (kèm `GT-020`) | Trạng thái: **Nhận (Lô A)** | Tên: *Giải mã quy luật chuỗi hình lặp tuần hoàn ABAB và AABAAB*
  2. Ghi nhận `WB19` nằm ở cả hai lô (chủ đạo Lô A với các khuôn cơ bản, Lô B cho phân loại kéo-thả giỏ `GT-008`).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các hàng `WB19-D1..D7` trỏ đúng vào các khuôn hiện hữu (`GT-001`, `GT-005`, `GT-008`, `GT-002`, `GT-003`, `GT-000`).
  - [ ] Không xuất hiện mã `GT-056` và loại bỏ hoàn toàn `GT-017` ra khỏi WB19.

---

### Task 2: Cập Nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật thông tin hàng Workbook 19 tại Bảng 7.1 và điều chỉnh số liệu hạn ngạch C2 tại Bảng 7.9.
- **Hành động cụ thể:**
  1. Cập nhật hàng 19 tại Bảng 7.1:
     ```markdown
     | 19 | Thành phố hình khối | 3-5 | C2 | `C2.GEO` · `C2.ROT` | `GT-001` · `GT-005` · `GT-002` · `GT-003` | `GT-008` kéo vào giỏ phân loại |
     ```
  2. Cập nhật Bảng 7.9 (Phân bổ dạng bài):
     - Ghi nhận `C2.GEO` và `C2.ROT` được bổ sung các level Montessori từ Chặng 19.
     - Điều chỉnh ghi chú giải phóng hiểu lầm 3D kỹ thuật cũ.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng 7.1 và 7.9 phản ánh đúng định hướng chuyển giao `WB19` vào `C2.GEO` và `C2.ROT`.
  - [ ] Tuân thủ tuyệt đối `BR-MCM-06`, không có từ ngữ đo lường trí tuệ thương mại.

---

### Task 3: Bổ Sung SkillDataset & Level Plans Vào Seeder `C2.GEO.03` (Hình Tam Giác)
- **Tập tin:** `packages/content/src/skills/c2/geo/C2.GEO.03.ts`
- **Mục tiêu:** Bù đắp số lượng level thiếu hụt nghiêm trọng (hiện chỉ có 3 level) cho `C2.GEO.03`, bổ sung 3 level Montessori chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items vật phẩm đời sống và hình học vào `C2_GEO_03_DATASET.items`:
     - `geo_triangle_pink`: Hình tam giác hồng (emoji 🔺, 3 cạnh 3 đỉnh).
     - `geo_triangle_purple`: Hình tam giác tím xoay trái (emoji 💜🔺).
     - `geo_triangle_blue`: Hình tam giác lam xoay phải (emoji 🔷🔺).
     - `obj_pizza_slice`: Miếng pizza xúc xích (emoji 🍕).
     - `obj_wind_kite`: Con diều no gió (emoji 🪁).
     - `obj_traffic_sign`: Biển báo tam giác (emoji ⚠️).
  2. Bổ sung các câu thoại Gấu Logic & Thỏ Sáng Tạo vào `phrasing`:
     - Prompt: *"Hình tam giác là hình có 3 cạnh, 3 đỉnh đấy!"*
     - Rotation prompt: *"Tam giác quay hướng nào vẫn là tam giác!"*
  3. Thêm 3 `SkillLevelPlan` chuẩn vào `C2_GEO_03_SEED.levels`:
     - `GL-C2-GEO-CARD-0104` (`GT-001`, band 3-4, diff 1, `free`, `montessori_ref: "WB19-D1"`): Khám phá hình tam giác — Chạm chọn hình tam giác giữa các hình khác.
     - `GL-C2-GEO-MATCH-0103` (`GT-005`, band 3-4, diff 2, `login`, `montessori_ref: "WB19-D3"`): Nối tam giác với tên gọi và đồ vật pizza, con diều.
     - `GL-C2-GEO-CARD-0105` (`GT-001`, band 4-5, diff 3, `standard`, `montessori_ref: "WB19-D1"`): Trắc nghiệm thuộc tính 3 cạnh và 3 đỉnh của tam giác.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level chuẩn định dạng `GL-C2-GEO-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 1=`free`, diff 2=`login`, diff 3=`standard`.

---

### Task 4: Bổ Sung SkillDataset & Level Plans Vào Seeder `C2.GEO.04` (Hình Chữ Nhật)
- **Tập tin:** `packages/content/src/skills/c2/geo/C2.GEO.04.ts`
- **Mục tiêu:** Mở rộng năng lực nhận biết chữ nhật nằm ngang và dựng đứng, thuộc tính 2 cạnh dài 2 cạnh ngắn, thêm 3 level Montessori chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items vật phẩm đời sống chữ nhật vào `C2_GEO_04_DATASET.items`:
     - `geo_rect_green_horiz`: Hình chữ nhật xanh lá nằm ngang (emoji 🟩).
     - `geo_rect_orange_vert`: Hình chữ nhật cam dựng đứng (emoji 🟧).
     - `obj_door_wood`: Cánh cửa gỗ đứng (emoji 🚪).
     - `obj_book_red`: Quyển sách bìa đỏ (emoji 📕).
     - `obj_blackboard`: Bảng đen lớp học (emoji 🪧).
  2. Bổ sung các câu thoại dẫn chuyện vào `phrasing`:
     - Prompt: *"Hình chữ nhật có 4 cạnh, gồm 2 cạnh dài và 2 cạnh ngắn nhé!"*
     - Real-world prompt: *"Cánh cửa và quyển sách rất giống hình chữ nhật đấy!"*
  3. Thêm 3 `SkillLevelPlan` chuẩn vào `C2_GEO_04_SEED.levels`:
     - `GL-C2-GEO-CARD-0106` (`GT-001`, band 3-4, diff 1, `free`, `montessori_ref: "WB19-D1"`): Nhận diện hình chữ nhật nằm ngang và dựng đứng.
     - `GL-C2-GEO-MATCH-0104` (`GT-005`, band 4-5, diff 2, `login`, `montessori_ref: "WB19-D4"`): Nối hình chữ nhật với cánh cửa, quyển sách và bảng đen.
     - `GL-C2-GEO-CARD-0107` (`GT-001`, band 4-5, diff 3, `standard`, `montessori_ref: "WB19-D1"`): Phân biệt thuộc tính 2 cạnh dài và 2 cạnh ngắn đối diện.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ 3 level tuân thủ `GL-C2-GEO-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 1=`free`, diff 2=`login`, diff 3=`standard`.

---

### Task 5: Bổ Sung SkillDataset & Level Plans Vào Seeder `C2.GEO.02` (Hình Vuông)
- **Tập tin:** `packages/content/src/skills/c2/geo/C2.GEO.02.ts`
- **Mục tiêu:** Bổ sung năng lực nhận diện 4 cạnh bằng nhau và các đồ vật dạng vuông trong đời sống, thêm 3 level Montessori chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items vật phẩm đời sống vuông vào `C2_GEO_02_DATASET.items`:
     - `geo_square_yellow`: Hình vuông vàng (emoji 🟨, 4 cạnh bằng nhau).
     - `obj_window_frame`: Khung cửa sổ 4 ô vuông (emoji 🪟).
     - `obj_gift_box`: Hộp quà thắt nơ đỏ (emoji 🎁).
     - `obj_brick_tile`: Viên gạch hoa lát sàn (emoji 🧱).
  2. Bổ sung các câu thoại dẫn chuyện vào `phrasing`:
     - Prompt: *"Hình vuông có 4 cạnh bằng nhau đấy!"*
     - Prompt: *"Bé nhìn xem khung cửa sổ và hộp quà có dạng hình gì nhé!"*
  3. Thêm 3 `SkillLevelPlan` chuẩn vào `C2_GEO_02_SEED.levels`:
     - `GL-C2-GEO-CARD-0103` (`GT-001`, band 3-4, diff 1, `free`, `montessori_ref: "WB19-D1"`): Làm quen hình vuông 4 cạnh bằng nhau.
     - `GL-C2-GEO-MATCH-0102` (`GT-005`, band 3-4, diff 2, `login`, `montessori_ref: "WB19-D4"`): Nối hình vuông với khung cửa sổ, hộp quà và viên gạch lát.
     - `GL-C2-GEO-SLOT-0101` (`GT-008`, band 4-5, diff 3, `standard`, `montessori_ref: "WB19-D1"`): Kéo thả khối hình vuông vào khung lâu đài hình học.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ 3 level tuân thủ `GL-C2-GEO-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 1=`free`, diff 2=`login`, diff 3=`standard`.

---

### Task 6: Bổ Sung SkillDataset & Level Plans Vào Seeder `C2.GEO.01` (Hình Tròn)
- **Tập tin:** `packages/content/src/skills/c2/geo/C2.GEO.01.ts`
- **Mục tiêu:** Mở rộng năng lực khám phá đặc tính cơ học lăn tròn, nối 1-nhiều với các đồ vật tròn, thêm 3 level Montessori chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items vật phẩm đời sống tròn vào `C2_GEO_01_DATASET.items`:
     - `geo_circle_blue`: Hình tròn lam mặt cười (emoji 🔵, lăn được).
     - `obj_beach_ball`: Quả bóng bãi biển sọc màu (emoji ⚽).
     - `obj_sun_shining`: Mặt trời toả nắng vàng (emoji ☀️).
     - `obj_car_wheel`: Bánh xe ô tô vành đúc (emoji 🛞).
  2. Bổ sung các câu thoại dẫn chuyện vào `phrasing`:
     - Prompt: *"Bạn hình tròn lăn được đấy, vì bạn ấy không có cạnh, không có góc nào cả!"*
     - Prompt: *"Bánh xe và quả bóng tròn xoe nên lăn tít được đấy!"*
  3. Thêm 3 `SkillLevelPlan` chuẩn vào `C2_GEO_01_SEED.levels`:
     - `GL-C2-GEO-CARD-0101` (`GT-001`, band 3-4, diff 1, `free`, `montessori_ref: "WB19-D1"`): Khám phá hình tròn không cạnh, không góc.
     - `GL-C2-GEO-MATCH-0101` (`GT-005`, band 3-4, diff 2, `login`, `montessori_ref: "WB19-D4"`): Nối 1-nhiều: Từ hình tròn nối tới quả bóng, mặt trời và bánh xe.
     - `GL-C2-GEO-CARD-0102` (`GT-001`, band 4-5, diff 3, `standard`, `montessori_ref: "WB19-D1"`): Trắc nghiệm lý do hình tròn lăn được.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ 3 level tuân thủ `GL-C2-GEO-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 1=`free`, diff 2=`login`, diff 3=`standard`.

---

### Task 7: Bổ Sung SkillDataset & Level Plans Vào Seeder `C2.ROT.01` (Bất Biến Phép Quay)
- **Tập tin:** `packages/content/src/skills/c2/rot/C2.ROT.01.ts`
- **Mục tiêu:** Khắc phục tình trạng thiếu level cho tư duy bất biến hình học qua phép quay (Tam giác xoay các hướng, Vuông xoay 45°), thêm 2 level Montessori chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items hình xoay góc vào `C2_ROT_01_DATASET.items`:
     - `geo_triangle_up`, `geo_triangle_left`, `geo_triangle_right`: Các trạng thái quay của tam giác.
     - `geo_square_rotated_45`: Hình vuông xoay nghiêng 45 độ (dễ nhầm thành hình thoi).
  2. Bổ sung câu thoại dẫn truyện vào `phrasing`:
     - Prompt: *"Tam giác quay hướng nào vẫn là tam giác!"*
     - Prompt: *"Hình vuông quay đi vẫn là hình vuông, con nhìn xem 4 cạnh có bằng nhau không nhé!"*
  3. Thêm 2 `SkillLevelPlan` chuẩn vào `C2_ROT_01_SEED.levels`:
     - `GL-C2-ROT-CARD-0101` (`GT-001`, band 3-4, diff 2, `login`, `montessori_ref: "WB19-D2"`): Tìm tam giác bất kể hướng quay lên, sang trái hay sang phải.
     - `GL-C2-ROT-CARD-0102` (`GT-001`, band 4-5, diff 3, `standard`, `montessori_ref: "WB19-D2"`): Nhận diện hình vuông xoay nghiêng 45 độ giữa các hình khác.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ 2 level tuân thủ `GL-C2-ROT-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 2=`login`, diff 3=`standard`.

---

### Task 8: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.CLS.02` (Phân Biệt Đối Lập & 4 Giỏ)
- **Tập tin:** `packages/content/src/skills/c3/cls/C3.CLS.02.ts`
- **Mục tiêu:** Bổ sung bài toán phân biệt đối lập tinh vi Vuông vs Chữ nhật và phân loại kéo thả vào 4 giỏ hình học, thêm 2 level Montessori chuẩn.
- **Hành động cụ thể:**
  1. Thêm các giỏ và hộp chứa vào `C3_CLS_02_DATASET.items`:
     - `box_square`: Hộp Hình Vuông.
     - `box_rectangle`: Hộp Hình Chữ Nhật.
     - `basket_triangle`, `basket_rectangle`, `basket_square`, `basket_circle`: 4 giỏ phân loại.
  2. Thêm 2 `SkillLevelPlan` chuẩn vào `C3_CLS_02_SEED.levels`:
     - `GL-C3-CLS-SLOT-0101` (`GT-008`, band 4-5, diff 2, `login`, `montessori_ref: "WB19-D6"`): Phân loại nhị phân — Kéo thả thẻ hình vào Hộp Vuông hoặc Hộp Chữ Nhật.
     - `GL-C3-CLS-BSK-0101` (`GT-008`, band 4-5, diff 3, `standard`, `montessori_ref: "WB19-D6"`): Phân loại 4 giỏ — Kéo thả 8 thẻ hình vào 4 giỏ Tam giác, Chữ nhật, Vuông, Tròn.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ 2 level tuân thủ `GL-C3-CLS-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 2=`login`, diff 3=`standard`.

---

### Task 9: Bổ Sung Level Plans Vào Seeder `C1.CNT.01` & `C1.PAT.01`
- **Tập tin:** `packages/content/src/skills/c1/cnt/C1.CNT.01.ts` và `packages/content/src/skills/c1/pat/C1.PAT.01.ts`
- **Mục tiêu:** Tích hợp thử thách đếm ma trận mật độ cao 18 hình và giải mã quy luật chuỗi hình lặp của Chặng 19.
- **Hành động cụ thể:**
  1. Bổ sung `GL-C1-CNT-TAP-0101` (`GT-002`, band 4-5, diff 3, `standard`, `montessori_ref: "WB19-D5"`) vào `C1.CNT.01.ts`: Đếm ma trận hỗn hợp 18 hình học.
  2. Bổ sung `GL-C1-PAT-SLOT-0101` (`GT-003`, band 4-5, diff 3, `standard`, `montessori_ref: "WB19-D7"`) vào `C1.PAT.01.ts`: Điền hình khuyết theo quy luật chuỗi lặp ABAB / AABAAB.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 2 level tuân thủ `GL-C1-<STRAND>-<MECH>-01xx`, diff 3=`standard`.

---

### Task 10: Kiểm Tra Tính Tương Thích Với Projection Builders
- **Tập tin:** `packages/content/src/builders/`
- **Mục tiêu:** Đảm bảo các `SkillLevelPlan` mới sinh ra `ContentSeed` hợp lệ qua các builder `gt-001.ts`, `gt-005.ts`, `gt-008.ts`, `gt-002.ts`, `gt-003.ts`.
- **Hành động cụ thể:**
  1. Kiểm tra builder `GT-001`: Dataset có $\ge 2$ items, hỗ trợ trắc nghiệm chạm chọn hình đúng và trắc nghiệm câu phát biểu thuộc tính.
  2. Kiểm tra builder `GT-005`: Dataset hỗ trợ ánh xạ 1-1, 1-nhiều và nối hai cánh vào cột hình giữa.
  3. Kiểm tra builder `GT-008`: Dataset hỗ trợ 2 hoặc 4 giỏ kéo thả với snap-in mượt mà.
  4. Kiểm tra builder `GT-002`: Dataset hỗ trợ ma trận đếm nhiều loại hình đồng thời.
  5. Kiểm tra builder `GT-003`: Dataset hỗ trợ quy luật chuỗi lặp ABAB và AABAAB.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàm `buildLevelsForSkill` chạy thành công mà không throw ngoại lệ validation.

---

### Task 11: Chạy Cổng Kiểm Thử & Xác Thực Chất Lượng
- **Lệnh thực thi:**
  ```bash
  pnpm check
  ```
- **Mục tiêu:**
  1. Đảm bảo toàn bộ mã nguồn không phát sinh lỗi TypeScript (`tsc --noEmit`).
  2. Đảm bảo linting và định dạng code đạt chuẩn qua Ultracite / Biome 2 (`pnpm lint:safe`).
  3. Kiểm tra toàn bộ level Montessori mới tuân thủ nghiêm ngặt `BR-MCM-06` (không từ ngữ cấm) và `BR-MGL-02` (sequence $\ge 0101$).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `pnpm check` kết thúc với mã thoát `0`.
  - [ ] Không có lỗi typecheck hoặc linting trên toàn repo.
