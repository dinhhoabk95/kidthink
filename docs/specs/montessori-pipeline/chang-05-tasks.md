# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 5: Thành Phố Săn Số (WB05)

> **Căn cứ đặc tả:** [`chang-05-spec.md`](./chang-05-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-05/analysis.json` (*Tập 5: Thành phố săn số*)  
> **Mục tiêu cốt lõi:** Phổ biến 3 dạng bài (`WB05-D1`, `WB05-D2`, `WB05-D3`) vào các game engine hiện tại (`GT-037` symbol-hunt, `GT-002` tap-select-multi, `GT-028` tap-count), cập nhật bảng tra cứu, và tích hợp làm giàu `SkillDataset` + `SkillLevelPlan[]` trong hệ thống seeder `packages/content/src/skills/c1/` và `c4/`.  
> **Bất biến:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori sequence $\ge 0101$ (`BR-MGL-02`). Access tier khớp chặt chẽ độ khó (`BR-MGL-12`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung SkillDataset & Level Plans vào C1.NREC.03 (GL-C1-NREC-HUNT-0101..0102, GL-C1-NREC-TMLT-0101)
   ├──> Task 4: Bổ sung SkillDataset & Level Plans vào C1.CNT.01 (GL-C1-CNT-TCNT-0101..0102, GL-C1-CNT-TMUL-0101)
   ├──> Task 5: Bổ sung Level Plans vào C4.VIS.01 (GL-C4-VIS-HUNT-0101, GL-C4-VIS-HUNT-0102)
   │
   ├──> Task 6: Kiểm tra tương thích Builder (gt-037.ts, gt-028.ts, gt-002.ts)
   │
   └──> Task 7: Chạy Cổng Kiểm Thử & Verification Gates (typecheck, seed integrity)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Cập nhật các hàng của Chặng 5 (`WB05`) để phản ánh chính xác 3 dạng bài và khuôn tương thích hiện hành (`GT-037`, `GT-028`, `GT-002`).
- **Hành động cụ thể:**
  1. Kiểm tra và chuẩn hóa các hàng `WB05`:
     - `WB05-D1` | Band: `4-5` | C1 | `C1.NREC` | Lô: `A` | Khuôn: `GT-037` | Trạng thái: **Nhận (Lô A)** | Tên: *Săn tìm & Khoanh đối tượng / Số mục tiêu trong ma trận ký hiệu*
     - `WB05-D2` | Band: `3-4` | C1 | `C1.CNT` | Lô: `A` | Khuôn: `GT-028` | Trạng thái: **Nhận (Lô A)** | Tên: *Tìm đối tượng mục tiêu, đếm tổng số lần xuất hiện & Chọn/Điền số*
     - `WB05-D3` | Band: `4-5` | C1 | `C1.NREC` | Lô: `A` | Khuôn: `GT-037` | Trạng thái: **Nhận (Lô A)** | Tên: *Tô màu theo mã số trên lưới / Tranh ẩn Viên Ngọc Chính Xác*
  2. Rà soát tính nhất quán số lượng dạng bài với cổng kiểm thử `montessori-corpus.test.ts`.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng tra cứu phản ánh đúng các khuôn `GT-037`, `GT-028` và fallback `GT-002`.
  - [ ] Không có mã dạng bài nào trỏ tới engine không tồn tại hoặc `GT-038+`.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Đồng bộ thông tin hàng Chặng 5 (Thành phố săn số) trong Bảng 7.1.
- **Hành động cụ thể:**
  1. Cập nhật hàng số 05 trong bảng 7.1:
     - Workbook: `05` | Tên: *Đếm nhanh điền đúng (Thành phố săn số)* | Band: `3-4, 4-5` | Competency: `C1` | Strand: `C1.CNT` · `C1.NREC` · `C4.VIS` | Khuôn lô A: `GT-037` · `GT-028` · `GT-002` | Cơ chế lô B: *—*
  2. Bổ sung ghi chú về cơ chế phân biệt thị giác và đối chiếu lượng số của Chặng 5.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng 7.1 phản ánh đúng các khuôn đã có trong P1: `GT-037`, `GT-028`, `GT-002`.
  - [ ] Hoàn toàn không vi phạm `BR-MCM-06` (không chứa các từ IQ, Raven, trí tuệ).

---

### Task 3: Bổ sung SkillDataset & Level Plans vào Seeder `C1.NREC.03`
- **Tập tin:** `packages/content/src/skills/c1/nrec/C1.NREC.03.ts`
- **Mục tiêu:** Tích hợp dataset săn số / phân biệt ký hiệu số và 3 level plans Montessori Chặng 5.
- **Hành động cụ thể:**
  1. Khai báo export `CHANG_05_SYMBOL_HUNT_DATASET` mang các item: `num_6`, `num_9_distractor`, `num_2`, `num_5_distractor`, `bee_yellow`, `ladybug_red`, `butterfly_pink`, `dog_pointy_ear`, `dog_floppy_ear`, `gecko_left`.
  2. Khai báo export `CHANG_05_ACCURACY_GEM_DATASET` mang các mã màu số 1–5 của Viên Ngọc Chính Xác.
  3. Thêm 3 level plans vào mảng `C1_NREC_03_SEED.levels`:
     - `GL-C1-NREC-HUNT-0101` (`GT-037`, band `4-5`, diff 2, tier `login`, `montessori_ref: "WB05-D1"`, dataset: `CHANG_05_SYMBOL_HUNT_DATASET`).
     - `GL-C1-NREC-HUNT-0102` (`GT-037`, band `4-5`, diff 3, tier `standard`, `montessori_ref: "WB05-D3"`, dataset: `CHANG_05_ACCURACY_GEM_DATASET`).
     - `GL-C1-NREC-TMLT-0101` (`GT-002`, band `4-5`, diff 1, tier `free`, `montessori_ref: "WB05-D1"`, dataset: `CHANG_05_SYMBOL_HUNT_DATASET`).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level theo chuẩn `GL-C1-NREC-<MECH>-01xx` (sequence $\ge 0101$).
  - [ ] `access_tier` khớp đúng `difficulty` (1 $\rightarrow$ `free`, 2 $\rightarrow$ `login`, 3 $\rightarrow$ `standard`).
  - [ ] Chạy `pnpm --filter @mindkid/content exec tsc --noEmit` đạt 0 lỗi type.

---

### Task 4: Bổ sung SkillDataset & Level Plans vào Seeder `C1.CNT.01`
- **Tập tin:** `packages/content/src/skills/c1/cnt/C1.CNT.01.ts`
- **Mục tiêu:** Tích hợp dataset đếm nông sản / sinh vật nhỏ và 3 level plans Montessori Chặng 5.
- **Hành động cụ thể:**
  1. Khai báo export `CHANG_05_TALLY_COUNT_DATASET` mang các item: `harvest_tomato`, `harvest_carrot`, `harvest_eggplant`, `harvest_peas`, `critter_bee`, `critter_ladybug`, `critter_spider`.
  2. Thêm 3 level plans vào mảng `C1_CNT_01_SEED.levels`:
     - `GL-C1-CNT-TCNT-0101` (`GT-028`, band `4-5`, diff 2, tier `login`, `montessori_ref: "WB05-D2"`, dataset: `CHANG_05_TALLY_COUNT_DATASET`).
     - `GL-C1-CNT-TCNT-0102` (`GT-028`, band `4-5`, diff 3, tier `standard`, `montessori_ref: "WB05-D2"`, dataset: `CHANG_05_TALLY_COUNT_DATASET`).
     - `GL-C1-CNT-TMUL-0101` (`GT-002`, band `4-5`, diff 2, tier `login`, `montessori_ref: "WB05-D2"`, dataset: `CHANG_05_TALLY_COUNT_DATASET`).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level theo chuẩn `GL-C1-CNT-<MECH>-01xx` (sequence $\ge 0101$).
  - [ ] `montessori_ref: "WB05-D2"`.
  - [ ] `access_tier` khớp chặt chẽ độ khó.
  - [ ] `tsc --noEmit` đạt 0 lỗi.

---

### Task 5: Bổ sung Level Plans vào Seeder `C4.VIS.01`
- **Tập tin:** `packages/content/src/skills/c4/vis/C4.VIS.01.ts`
- **Mục tiêu:** Tích hợp 2 level plans phân biệt thị giác vi chi tiết và định hướng không gian của Chặng 5.
- **Hành động cụ thể:**
  1. Import hoặc khai báo `CHANG_05_SYMBOL_HUNT_DATASET` phục vụ nhận thức phân biệt thị giác.
  2. Thêm 2 level plans vào mảng `C4_VIS_01_SEED.levels`:
     - `GL-C4-VIS-HUNT-0101` (`GT-037`, band `4-5`, diff 3, tier `standard`, `montessori_ref: "WB05-D1"`, theme: `nature`, dataset: `CHANG_05_SYMBOL_HUNT_DATASET`).
     - `GL-C4-VIS-HUNT-0102` (`GT-037`, band `5-6`, diff 4, tier `premium`, `montessori_ref: "WB05-D1"`, theme: `nature`, dataset: `CHANG_05_SYMBOL_HUNT_DATASET`).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level theo chuẩn `GL-C4-VIS-HUNT-01xx` (sequence $\ge 0101$).
  - [ ] `access_tier` cho diff 3 là `standard`, cho diff 4 là `premium`.
  - [ ] Không có lỗi type khi kiểm tra TypeScript.

---

### Task 6: Kiểm Tra Tính Nhất Quán & Tương Thích Của Builders
- **Tập tin:**
  - `packages/content/src/builders/gt-037.ts`
  - `packages/content/src/builders/gt-028.ts`
  - `packages/content/src/builders/gt-002.ts`
- **Mục tiêu:** Xác nhận các builder hiện có trong `packages/content/src/builders/` chiếu mượt mà các `SkillDataset` mới tạo thành `content_pack` và `difficulty_params` hợp lệ theo contract của từng engine.
- **Hành động cụ thể:**
  1. Kiểm tra hàm `projectGT037` với `CHANG_05_SYMBOL_HUNT_DATASET`:
     - Đảm bảo `item_count` $\in [12, 30]$, `target_copies` $\in [2, 8]$.
     - Đảm bảo các ký hiệu chữ số (`num_6`, `num_2`) được gán `orientation_free: false` tuân thủ `BR-E037-06`.
  2. Kiểm tra hàm `projectGT028` với `CHANG_05_TALLY_COUNT_DATASET`:
     - Đảm bảo `target_total % step === 0` tuân thủ `BR-E028-01`.
  3. Kiểm tra hàm `projectGT002` với `CHANG_05_SYMBOL_HUNT_DATASET`:
     - Đảm bảo các distractor candidates phân biệt được với đáp án đúng tuân thủ `BR-E002-04`.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có builder nào ném ngoại lệ khi thực hiện `project()`.

---

### Task 7: Chạy Cổng Kiểm Thử & Verification Gates
- **Tập tin:** Toàn bộ codebase liên quan
- **Mục tiêu:** Đảm bảo toàn bộ mã nguồn và dữ liệu đáp ứng 100% các tiêu chuẩn kiểm thử của dự án.
- **Lệnh thực thi:**
  1. `pnpm --filter @mindkid/content exec tsc --noEmit` $\rightarrow$ Exit 0.
  2. Kiểm tra từ khóa cấm theo `BR-MCM-06`:
     ```bash
     grep -riE "\b(iq|raven|trí tuệ|chỉ số thông minh)\b" docs/specs/montessori-pipeline/chang-05* packages/content/src/skills/c1/nrec/C1.NREC.03.ts packages/content/src/skills/c1/cnt/C1.CNT.01.ts packages/content/src/skills/c4/vis/C4.VIS.01.ts
     ```
     Kết quả kỳ vọng: Không có dòng khớp nào (Exit 1).
  3. Kiểm tra mã engine không vượt trần `GT-037`:
     ```bash
     grep -riE "GT-03[8-9]|GT-0[4-9][0-9]" docs/specs/montessori-pipeline/chang-05*
     ```
     Kết quả kỳ vọng: Không có dòng khớp nào (Exit 1).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Typecheck pass xanh (Exit 0).
  - [ ] Tuyệt đối không phát sinh `GT-038+`.
  - [ ] Không chứa bất kỳ từ khóa cấm đo trí tuệ thương mại.
