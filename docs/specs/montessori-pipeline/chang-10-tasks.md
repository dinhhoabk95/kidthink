# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 10: Thung Lũng Sắc Màu (WB10)

> **Căn cứ đặc tả:** [`chang-10-spec.md`](./chang-10-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-10/analysis.json` (*Chặng 10 - Thung lũng màu sắc.pdf*, 22 trang, Montessori VN)  
> **Mục tiêu cốt lõi:** Phổ biến 4 nhóm dạng bài chuẩn (`WB10-D1`, `WB10-D2`, `WB10-D3`, `WB10-D4`) vào các game engine hiện tại (`GT-000` intro/summary, `GT-001` tap-select, `GT-002` tap-fill/multi, `GT-005` pair-match, `GT-008` drag-to-slot), cập nhật bảng tra cứu, và tích hợp vào hệ thống database seeder kỹ năng `packages/content/src/skills/` (`C4.SEN.01`, `C4.VIS.01`, `C1.ADD`, `C1.SUB`, `C2.GEO`, `C2.MIR`, `C4.PAT`).  
> **Bất biến cốt lõi:** **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori sequence $\ge 0101$ (`BR-MGL-02`). Phân tầng `access_tier` khớp đúng `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4/5: `premium`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Làm giàu Seeder C4.SEN.01 (Dataset Thung Lũng Sắc Màu, GL-C4-SEN-FILL-0101, GL-C4-SEN-PAIR-0101, 0103)
   ├──> Task 4: Cập nhật Seeder C4.VIS.01 (GL-C4-VIS-CARD-0104, GL-C4-VIS-PAIR-0102)
   ├──> Task 5: Cập nhật Seeder Phép tính C1.ADD & C1.SUB (Mã hóa phép tính: GL-C1-OPS-FILL-0102..0105)
   ├──> Task 6: Cập nhật Seeder Không gian & Đối xứng C2.GEO & C2.MIR (Mảnh khuyết & Đồng tâm: GL-C2-GEO-SLOT-0101..0102, GL-C2-MIR-PAIR-0103, GL-C2-GEO-PAIR-0104)
   └──> Task 7: Cập nhật Seeder Quy luật & Logic C4.PAT & C4.LOG (Đại thử thách: GL-C4-PAT-CARD-0101, GL-C4-LOG-SLOT-0102)
         │
         └──> Task 8: Chạy Cổng Kiểm Thử & Verification Gates (typecheck, lint, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ và cập nhật các hàng `WB10-D1`, `WB10-D2` và bổ sung `WB10-D3`, `WB10-D4` vào Bảng 1.
- **Hành động cụ thể:**
  1. Cập nhật các dòng hiện có của WB10:
     - `WB10-D1` | Band: `4-5` | C1/C4 | `C4.SEN` · `C1.OPS` | Lô: `A` | Khuôn: `GT-002` · `GT-001` | Trạng thái: **Nhận (Lô A)** | Tên: *Tô màu giải mã phép tính cộng trừ (Color by Calculation Code)*
     - `WB10-D2` | Band: `4-5` | C4/C2 | `C4.SEN` · `C4.VIS` | Lô: `A` | Khuôn: `GT-005` · `GT-001` | Trạng thái: **Nhận (Lô A)** | Tên: *Trích xuất & đối chiếu tổ hợp ba màu sắc (Multi-Color Triplet Matching)*
  2. Bổ sung các hàng mới `WB10-D3` và `WB10-D4`:
     - `WB10-D3` | Band: `4-5` | C2 | `C2.GEO` · `C2.MIR` | Lô: `B` | Khuôn: `GT-008` · `GT-005` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Mảnh ghép khuyết dải màu & Ghép đôi huy hiệu đối xứng đồng tâm 3 lớp*
     - `WB10-D4` | Band: `5-6` | C4 | `C4.PAT` · `C4.LOG` | Lô: `A` | Khuôn: `GT-001` · `GT-008` | Trạng thái: **Nhận (Lô A)** | Tên: *Đại thử thách sắc màu (Chuỗi tuần hoàn ABC, Trích xuất bộ màu, Ma trận Sudoku màu 3x3)*
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng tra cứu hiển thị đầy đủ 4 mã `WB10-D1` đến `WB10-D4`.
  - [ ] Khuôn đề xuất liệt kê chính xác các template hiện hữu: `GT-001`, `GT-002`, `GT-005`, `GT-008`.
  - [ ] Tuyệt đối không đề cập đến `GT-038+`.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật hàng 10 tại Mục 7.1 phản ánh đầy đủ năng lực số hóa của Chặng 10.
- **Hành động cụ thể:**
  1. Sửa dòng số 10 trong bảng ánh xạ:
     ```markdown
     | 10 | Tư duy màu sắc & Thung lũng sắc màu | 4-5 | C4 | `C4.SEN` · `C4.VIS` · `C1.OPS` | `GT-001` · `GT-002` · `GT-005` | `GT-008` kéo vào ô khuyết |
     ```
  2. Bổ sung diễn giải sư phạm về cơ chế giải mã phép tính (Math-to-Color Code), tính bất biến trật tự không gian của tập hợp màu, và đối xứng đồng tâm 3 lớp.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 10 ghi nhận đầy đủ các khuôn `GT-001`, `GT-002`, `GT-005`, `GT-008`.
  - [ ] Khớp đúng với quy định không chứa từ khóa thương mại đo trí tuệ theo `BR-MCM-06`.

---

### Task 3: Làm giàu Seeder `C4.SEN.01` (Phân biệt sắc độ màu & Tổ hợp màu)
- **Tập tin:** `packages/content/src/skills/c4/sen/C4.SEN.01.ts`
- **Mục tiêu:** Bổ sung kho ngữ liệu Thung Lũng Sắc Màu vào dataset và khai báo 3 level plan chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung các item Chặng 10 vào `CHANG_10_COLOR_VALLEY_DATASET` (cánh cổng ma thuật, diều gió, lâu đài bảy sắc, ngôi nhà pha lê, cỗ xe cầu vồng, thuyền buồm, thỏ pha lê, cá heo sóng biển, mèo giữ ngọc, gấu trúc rương kho báu, xe hoa, bướm, đèn cổ tích, khinh khí cầu, ô tô pha lê, tường cầu vồng tam giác, tường sao, huy hiệu đồng tâm, vòng tròn góc phần tư, viên ngọc sắc màu).
  2. Cập nhật phrasing câu thoại của Gấu Logic & Thỏ Quan Sát.
  3. Khai báo 3 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C4-SEN-FILL-0101",
       template: "GT-002",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "art",
       rounds: 1,
       montessori_ref: "WB10-D1",
     },
     {
       code: "GL-C4-SEN-PAIR-0101",
       template: "GT-005",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 5,
       montessori_ref: "WB10-D2",
     },
     {
       code: "GL-C4-SEN-PAIR-0103",
       template: "GT-005",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "adventure",
       rounds: 5,
       montessori_ref: "WB10-D2",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các mã level sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB10-D1"` và `"WB10-D2"`.
  - [ ] `access_tier` khớp `difficulty` (1 = `free`, 2 = `login`, 3 = `standard`).
  - [ ] File compile sạch không lỗi typecheck.

---

### Task 4: Cập nhật Seeder `C4.VIS.01` (Quan sát chi tiết thị giác)
- **Tập tin:** `packages/content/src/skills/c4/vis/C4.VIS.01.ts`
- **Mục tiêu:** Bổ sung các level trích xuất bộ ba màu xe hoa, xe pha lê và cơ chế tap-select fallback.
- **Hành động cụ thể:**
  1. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C4-VIS-CARD-0104",
       template: "GT-001",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB10-D2",
     },
     {
       code: "GL-C4-VIS-PAIR-0102",
       template: "GT-005",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "city",
       rounds: 5,
       montessori_ref: "WB10-D2",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Cả 2 level plan đều có `montessori_ref: "WB10-D2"`.
  - [ ] `access_tier` khớp đúng độ khó.

---

### Task 5: Cập nhật Seeder Phép Tính `C1.ADD` & `C1.SUB` (Mã hóa phép tính - màu sắc)
- **Tập tin:** `packages/content/src/skills/c1/sub/C1.SUB.02.ts` và `packages/content/src/skills/c1/add/C1.ADD.02.ts`
- **Mục tiêu:** Tích hợp các bài toán tô màu giải mã phép tính (Trang 2, 4, 5, 6, 11).
- **Hành động cụ thể:**
  1. Trong `C1.SUB.02.ts`:
     - Khai báo level `GL-C1-OPS-FILL-0102` (`GT-002`, band `4-5`, diff 2, `login`, theme `magic`, `montessori_ref: "WB10-D1"`).
     - Khai báo level `GL-C1-OPS-FILL-0104` (`GT-002`, band `4-5`, diff 3, `standard`, theme `crystal`, `montessori_ref: "WB10-D1"`).
  2. Trong `C1.ADD.02.ts`:
     - Khai báo level `GL-C1-OPS-FILL-0103` (`GT-002`, band `4-5`, diff 3, `standard`, theme `castle`, `montessori_ref: "WB10-D1"`).
     - Khai báo level `GL-C1-OPS-FILL-0105` (`GT-002`, band `5-6`, diff 4, `premium`, theme `forest`, `montessori_ref: "WB10-D1"`).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các level đều có `montessori_ref: "WB10-D1"`.
  - [ ] Độ khó 4 được gán `access_tier: "premium"`.

---

### Task 6: Cập nhật Seeder Không Gian & Đối Xứng `C2.GEO` & `C2.MIR`
- **Tập tin:** `packages/content/src/skills/c2/geo/C2.GEO.02.ts`, `C2.GEO.03.ts` và `packages/content/src/skills/c2/mir/C2.MIR.01.ts`
- **Mục tiêu:** Khai báo 4 level plan cho mảnh ghép khuyết dải màu, đối xứng đồng tâm và vòng tròn góc phần tư.
- **Hành động cụ thể:**
  1. Trong `C2.GEO.02.ts`:
     - Khai báo `GL-C2-GEO-SLOT-0101` (`GT-008`, band `4-5`, diff 2, `login`, theme `art`, `montessori_ref: "WB10-D3"` — Mảnh ghép tam giác tường 6 dải màu).
     - Khai báo `GL-C2-GEO-SLOT-0102` (`GT-008`, band `5-6`, diff 4, `premium`, theme `magic`, `montessori_ref: "WB10-D3"` — Mảnh ghép ngôi sao tường 7 tầng màu).
  2. Trong `C2.MIR.01.ts`:
     - Khai báo `GL-C2-MIR-PAIR-0103` (`GT-005`, band `4-5`, diff 3, `standard`, theme `space`, `montessori_ref: "WB10-D3"` — Ghép đôi huy hiệu bán nguyệt đối xứng đồng tâm).
  3. Trong `C2.GEO.03.ts`:
     - Khai báo `GL-C2-GEO-PAIR-0104` (`GT-005`, band `5-6`, diff 4, `premium`, theme `puzzle`, `montessori_ref: "WB10-D3"` — Vòng tròn 4 góc phần tư).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các level plan mang tiền tố `GL-C2-...-01xx`.
  - [ ] Gắn nhãn `montessori_ref: "WB10-D3"`.

---

### Task 7: Cập nhật Seeder Quy Luật & Logic `C4.PAT` & `C4.LOG`
- **Tập tin:** `packages/content/src/skills/c4/pat/C4.PAT.01.ts` và `packages/content/src/skills/c4/exp/C4.EXP.01.ts`
- **Mục tiêu:** Khai báo 2 level plan cho bài kiểm tra tổng hợp Đại thử thách sắc màu (Trang 21).
- **Hành động cụ thể:**
  1. Trong `C4.PAT.01.ts`:
     - Khai báo `GL-C4-PAT-CARD-0101` (`GT-001`, band `4-5`, diff 3, `standard`, theme `art`, `montessori_ref: "WB10-D4"` — Chuỗi tuần hoàn hạt màu ABC).
  2. Trong `C4.EXP.01.ts` (hoặc ma trận logic ô khuyết):
     - Khai báo `GL-C4-LOG-SLOT-0102` (`GT-008`, band `5-6`, diff 4, `premium`, theme `magic`, `montessori_ref: "WB10-D4"` — Ma trận Latin Square Sudoku màu 3x3).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Gắn nhãn `montessori_ref: "WB10-D4"`.
  - [ ] Sequence $\ge 0101$.

---

### Task 8: Chạy Cổng Kiểm Thử & Verification Gates
- **Hành động cụ thể:**
  1. Chạy Biome lint:
     ```bash
     pnpm lint:safe
     ```
  2. Chạy typecheck trên toàn workspace:
     ```bash
     pnpm check
     ```
  3. Kiểm tra cổng seed Montessori:
     ```bash
     pnpm --filter @mindkid/content-build seed:check
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có lỗi lint hoặc formatting.
  - [ ] Strict TypeScript pass không có lỗi type. Zero `any`, zero `unknown`.
  - [ ] Cổng seed gate `montessori-gate.ts` pass xanh 100%.
