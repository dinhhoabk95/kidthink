# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 11: Lâu Đài Ô Số (WB11)

> **Căn cứ đặc tả:** [`chang-11-spec.md`](./chang-11-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-11/analysis.json` (*Chặng 11: Lâu Đài Ô Số — Giải Mã Những Ô Trống*, WB11, 22 trang)  
> **Mục tiêu cốt lõi:** Cung cấp tài liệu hướng dẫn hành động cụ thể cho `montessori_code_implementer` để chuyển hóa dữ liệu Chặng 11 vào các game engine hiện tại (`GT-001`, `GT-006`, `GT-008`, `GT-000`), giải quyết dứt điểm điểm nghẽn 0 Montessori level của `WB11-D3` trong `C3.RULE`, và làm giàu database seeder tại `packages/content/src/skills/c3/rule/` và `c1/cnt/`.  
> **Bất biến kiến trúc:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Hủy bỏ và loại trừ hoàn toàn dự thảo `GT-048`. Tuân thủ nghiêm ngặt `BR-MCM-06` (không chứa từ khóa thương mại IQ/Raven/đo trí tuệ) và `BR-MGL-02` (mọi mã level sequence $\ge 0101$).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung SkillDataset & Level Plans vào C3.RULE.01 (Ma trận 2x2 & Giao điểm hai chiều)
   │
   ├──> Task 4: Bổ sung SkillDataset & Level Plans vào C3.RULE.02 (Kiến trúc đan xen, Pháo đài & Cầu treo)
   │
   ├──> Task 5: Làm giàu SkillDataset & Level Plans vào C1.CNT.09 & C1.CNT.10 (Số thứ tự & Đếm cách 2)
   │
   ├──> Task 6: Kiểm tra tính tương thích với Projection Builders (GT-001, GT-006, GT-008)
   │
   └──> Task 7: Chạy cổng kiểm thử & Xác thực chất lượng (typecheck, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập Nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ định nghĩa cơ chế và engine của các dạng bài Chặng 11 (`WB11-D1`, `WB11-D2`, `WB11-D3`), loại bỏ hoàn toàn mọi tham chiếu đến engine dự thảo `GT-048`.
- **Hành động cụ thể:**
  1. Rà soát các hàng dạng bài của `WB11` tại Bảng 1:
     - `WB11-D1` | Band: `4-5` | C1 | `C1.CNT` | Lô: `A` | Khuôn: `GT-001` (kèm `GT-008` cơ bản) | Trạng thái: **Nhận (Lô A)** | Tên: *Đếm nhảy cóc chọn số & Ma trận giao điểm 2 chiều cơ bản*
     - `WB11-D2` | Band: `4-5` | C1 | `C1.CNT` | Lô: `B` | Khuôn: `GT-008` (kèm `GT-006` cho chuỗi số) | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Điền số khuyết trên cấu trúc kiến trúc (Kéo số vào ô khuyết)*
     - `WB11-D3` | Band: `4-5` | C3 | `C3.RULE` | Lô: `B` | Khuôn: `GT-008` (kèm `GT-001`) | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Ma trận số $2 \times 2$ có quy luật cộng/trừ đơn giản & Pháo đài liên hợp*
  2. Cập nhật phần tổng kết số lượng dạng bài đã soạn: Ghi nhận `WB11-D3` được giải quyết và chuyển sang danh mục đã có kế hoạch level, xóa khỏi danh sách "dạng bài chờ khuôn mới".
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các hàng `WB11-D1`, `WB11-D2`, `WB11-D3` trỏ đúng vào các khuôn hiện có `GT-001`, `GT-006`, `GT-008`.
  - [ ] Không xuất hiện mã `GT-048` trong tài liệu.

---

### Task 2: Cập Nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật thông tin hàng Workbook 11 tại Bảng 7.1 và điều chỉnh số liệu hạn ngạch C3 tại Bảng 7.9.
- **Hành động cụ thể:**
  1. Cập nhật hàng 11 tại Bảng 7.1:
     ```markdown
     | 11 | Điền số thông minh | 4-5 | C3 | `C3.RULE` · `C1.CNT` | `GT-001` · `GT-006` | `GT-008` kéo vào ô khuyết |
     ```
  2. Cập nhật Bảng 7.9 (Phân bổ dạng bài):
     - Ghi nhận strand `C3.RULE` được nạp 10 level Montessori từ Chặng 11.
     - Cột `Level đã soạn` của C3 nâng từ `0` lên `10` (trong trần hạn ngạch 15 level của C3).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng 7.1 và 7.9 phản ánh đúng định hướng chuyển giao `WB11-D3` vào `C3.RULE`.
  - [ ] Tuân thủ tuyệt đối `BR-MCM-06`, không có từ ngữ đo lường trí tuệ thương mại.

---

### Task 3: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.RULE.01`
- **Tập tin:** `packages/content/src/skills/c3/rule/C3.RULE.01.ts`
- **Mục tiêu:** Giải quyết điểm nghẽn 0 Montessori level cho `C3.RULE.01`, làm giàu ngữ liệu chủ đề Lâu Đài Ô Số và thêm 4 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items Lâu Đài Ô Số vào `C3_RULE_01_DATASET.items`:
     - `castle_gate`: Cổng vòm đá lâu đài (emoji 🏰).
     - `ancient_key`: Chìa khóa cổ đầu tròn (emoji 🗝️).
     - `magic_brick_blue`, `magic_brick_yellow`, `magic_brick_green`: Các khối gạch số màu (🟦, 🟨, 🟩).
     - `castle_gem`: Viên ngọc tím lâu đài (emoji 💎).
  2. Bổ sung các câu thoại Gấu Logic & Thỏ Quan Sát vào `phrasing`:
     - Prompt: *"Bé hãy tính theo hàng ngang và hàng dọc, rồi kéo {label} vào ô trống nhé!"*
     - Narration: *"Cùng Gấu Logic và Thỏ Quan Sát giải mã các ô số bí ẩn để mở khóa lâu đài nhé!"*
  3. Thêm 4 `SkillLevelPlan` chuẩn vào `C3_RULE_01_SEED.levels`:
     - `GL-C3-RULE-CARD-0101` (`GT-001`, band 4-5, diff 1, `free`, `montessori_ref: "WB11-D1"`): Cánh Cửa Đầu Tiên — Giao điểm 2 phép tính phạm vi 10.
     - `GL-C3-RULE-CARD-0102` (`GT-001`, band 4-5, diff 2, `login`, `montessori_ref: "WB11-D1"`): Ngã Tư Phép Tính — Nút giao 2 phép tính phạm vi 15.
     - `GL-C3-RULE-SLOT-0101` (`GT-008`, band 4-5, diff 2, `login`, `montessori_ref: "WB11-D3"`): Ma Trận 2x2 Lâu Đài — Kéo 2 thẻ số vào lưới quy luật cộng/trừ liên hoàn.
     - `GL-C3-RULE-SLOT-0102` (`GT-008`, band 4-5, diff 3, `standard`, `montessori_ref: "WB11-D3"`): Chìa Khóa Cổ Điển — Kéo 3 thẻ số vào đầu và thân chìa khóa phạm vi 20.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level chuẩn định dạng `GL-C3-RULE-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 1=`free`, diff 2=`login`, diff 3=`standard`.
  - [ ] `pnpm --filter @mindkid/content typecheck` pass sạch lỗi.

---

### Task 4: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.RULE.02`
- **Tập tin:** `packages/content/src/skills/c3/rule/C3.RULE.02.ts`
- **Mục tiêu:** Mở rộng năng lực suy luận quy luật đan xen, công trình pháo đài và cầu treo cho `C3.RULE.02`, thêm 6 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items kiến trúc liên hoàn vào `C3_RULE_02_DATASET.items`:
     - `train_engine`: Đầu tàu hỏa ống khói (emoji 🚂).
     - `train_carriage`: Toa tàu ô số (emoji 🚃).
     - `ziggurat_stair`: Bậc thang giật cấp (emoji 🪜).
     - `fortress_t`: Pháo đài chữ T đối xứng (emoji 🏛️).
     - `royal_crown`: Vương miện ba đỉnh gắn ngọc (emoji 👑).
     - `treasure_chest`: Rương kho báu bừng sáng (emoji 📦).
  2. Bổ sung các câu thoại dẫn truyện vào `phrasing`.
  3. Thêm 6 `SkillLevelPlan` chuẩn vào `C3_RULE_02_SEED.levels`:
     - `GL-C3-RULE-ORD-0101` (`GT-006`, band 4-5, diff 2, `login`, `montessori_ref: "WB11-D2"`): Đoàn Tàu Ô Số — Sắp xếp 4 toa tàu theo quy luật bước nhảy đan xen.
     - `GL-C3-RULE-ORD-0102` (`GT-006`, band 4-5, diff 3, `standard`, `montessori_ref: "WB11-D2"`): Bậc Thang Ziggurat — Sắp xếp 5 nấc thang số tăng dần lũy tiến.
     - `GL-C3-RULE-SLOT-0111` (`GT-008`, band 4-5, diff 3, `standard`, `montessori_ref: "WB11-D3"`): Pháo Đài Chữ T — Cân bằng hai cánh ngang và trụ dọc pháo đài.
     - `GL-C3-RULE-SLOT-0112` (`GT-008`, band 5-6, diff 4, `premium`, `montessori_ref: "WB11-D3"`): Tháp Đôi Cầu Treo — Cầu treo dữ liệu liên kết 2 tháp lâu đài.
     - `GL-C3-RULE-SLOT-0113` (`GT-008`, band 5-6, diff 4, `premium`, `montessori_ref: "WB11-D5"`): Vòng Thành Khép Kín — 4 cạnh khép kín rương báu.
     - `GL-C3-RULE-SLOT-0114` (`GT-008`, band 5-6, diff 5, `premium`, `montessori_ref: "WB11-D5"`): Đại Mật Mã Viên Ngọc — Đại thử thách 5 ô slot mở khóa Ngọc Lâu Đài.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ 6 level tuân thủ `GL-C3-RULE-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 2=`login`, diff 3=`standard`, diff 4/5=`premium`.

---

### Task 5: Làm Giàu SkillDataset & Level Plans Cho `C1.CNT.09` & `C1.CNT.10`
- **Tập tin:**
  - `packages/content/src/skills/c1/cnt/C1.CNT.09.ts` (Số thứ tự)
  - `packages/content/src/skills/c1/cnt/C1.CNT.10.ts` (Đếm cách 2)
- **Mục tiêu:** Kế thừa ngữ liệu Chặng 11 vào competency C1, chuẩn bị sẵn sàng cho việc mở rộng hạn ngạch.
- **Hành động cụ thể:**
  1. Trong `C1.CNT.09.ts`:
     - Thêm items vị trí toa tàu 1–5 chở vật phẩm lâu đài.
     - Thêm level `GL-C1-CNT-ORD-0101` (`GT-006`, band 4-5, diff 2, `login`, `montessori_ref: "WB11-D2"`): Sắp xếp đoàn tàu số thứ tự từ toa thứ nhất đến toa thứ năm.
  2. Trong `C1.CNT.10.ts`:
     - Thêm items bước nhảy $+2$ hành lang lâu đài.
     - Thêm level `GL-C1-CNT-CARD-0121` (`GT-001`, band 4-5, diff 2, `login`, `montessori_ref: "WB11-D1"`): Đếm nhảy cóc $+2$ chọn viên gạch số tiếp theo.
     - Thêm level `GL-C1-CNT-SLOT-0135` (`GT-008`, band 4-5, diff 3, `standard`, `montessori_ref: "WB11-D2"`): Khôi phục trục số nhảy bước $+2$ phạm vi 20.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Dataset có thêm các items bối cảnh Chặng 11.
  - [ ] Mã level tuân thủ quy tắc `01xx`.

---

### Task 6: Kiểm Tra Tính Tương Thích Với Projection Builders
- **Tập tin:** `packages/content/src/builders/`
- **Mục tiêu:** Đảm bảo các `SkillLevelPlan` mới sinh ra `ContentSeed` hợp lệ qua các builder `gt-001.ts`, `gt-006.ts`, `gt-008.ts`.
- **Hành động cụ thể:**
  1. Kiểm tra builder `GT-001`: Dataset có $\ge 2$ items, có `label` hợp lệ để hiển thị trong câu hỏi.
  2. Kiểm tra builder `GT-006`: Dataset có $\ge 3$ items, có `ordering` hoặc `value` số học rõ ràng để sắp xếp.
  3. Kiểm tra builder `GT-008`: Dataset có $\ge 2$ items, tạo đúng số lượng `slots` và `items` tương ứng với độ khó.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàm `buildLevelsForSkill` chạy thành công mà không throw ngoại lệ validation.

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
     - Kiểm tra hạn ngạch C3 không vượt quá 15 level.
     - Kiểm tra sequence level $\ge 0101$.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ lệnh kiểm tra thoát mã 0 (exit code 0).
