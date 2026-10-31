# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 2: Đường Ray Số Thứ Tự (WB02)

> **Căn cứ đặc tả:** [`chang-02-spec.md`](./chang-02-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-02/analysis.json` (*Chặng 2: Đường Ray Số Thứ Tự*, WB02, 23 trang)  
> **Mục tiêu cốt lõi:** Cung cấp hướng dẫn hành động cụ thể cho `montessori_code_implementer` để phổ biến dữ liệu Chặng 2 vào các game engine hiện tại (`GT-008`, `GT-013`, `GT-006`, `GT-001`, `GT-000`) và cập nhật seeder tại `packages/content/src/skills/c1/`.  
> **Bất biến kiến trúc:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Hủy bỏ hoàn toàn `GT-039`. Tuân thủ nghiêm ngặt `BR-MCM-06` (không từ khóa thương mại IQ/Raven) và `BR-MGL-02` (mọi mã level sequence $\ge 0101$).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung SkillDataset & Level Plans vào C1.NREC.09 (Thứ tự số & Mê cung 1-16)
   │
   ├──> Task 4: Bổ sung SkillDataset & Level Plans vào C1.NREC.10, C1.NREC.11, C1.NREC.12
   │            (Số trước, Số sau, Số ở giữa)
   │
   ├──> Task 5: Bổ sung SkillDataset & Level Plans vào C1.CNT.04, C1.CNT.08, C1.CNT.10
   │            (Đếm lùi 10-1, Đếm đến 20, Nhảy cách 2 chẵn/lẻ)
   │
   ├──> Task 6: Kiểm tra tính tương thích với Projection Builders (GT-008, GT-013, GT-006, GT-001)
   │
   └──> Task 7: Chạy cổng kiểm thử & Xác thực chất lượng (seed:check, typecheck)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập Nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ định nghĩa cơ chế và engine của các dạng bài Chặng 2 (`WB02-D1`, `WB02-D2`, `WB02-D3`).
- **Hành động cụ thể:**
  1. Kiểm tra 3 hàng dạng bài của `WB02` tại Bảng 1:
     - `WB02-D1` | Band: `3-4` | C1 | `C1.NREC` | Lô: `A` | Khuôn: `GT-001` (kèm `GT-008` cơ bản) | Trạng thái: **Nhận (Lô A)** | Tên: *Điền số còn thiếu trong chuỗi số tiến (chọn 1 số hoặc kéo thả)*
     - `WB02-D2` | Band: `3-4` | C1 | `C1.NREC` | Lô: `B` | Khuôn: `GT-008` (kèm `GT-013` cho ma trận) | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Số liền trước, liền sau, ở giữa & Mê cung thứ tự số 1–16*
     - `WB02-D3` | Band: `3-4` | C1 | `C1.SEQ` | Lô: `A` | Khuôn: `GT-006` | Trạng thái: **Nhận (Lô A)** | Tên: *Sắp xếp lại đoàn tàu số bị xáo trộn & Tuyến tàu chạy lùi 10 về 1*
  2. Bổ sung ghi chú giải thích việc mở rộng không gian mê cung ma trận $5 \times 5$ (Trang 17–22 trong PDF) sử dụng khuôn `GT-013` (maze-path) đã có sẵn trong hệ thống, không phát sinh engine mới.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng `WB02-D1`, `WB02-D2`, `WB02-D3` phản ánh đúng các engine `GT-001`, `GT-008`, `GT-006`, `GT-013`.
  - [ ] Tuyệt đối không đề cập đến mã `GT-039`.

---

### Task 2: Cập Nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật thông tin hàng Workbook 02 tại Bảng 7.1.
- **Hành động cụ thể:**
  1. Rà soát hàng 02 trong Bảng 7.1:
     ```markdown
     | 02 | Thứ tự dãy số | 3-4 | C1 | `C1.NREC` · `C1.CNT` | `GT-001` · `GT-006` | `GT-008` kéo vào ô khuyết · `GT-013` mê cung số |
     ```
  2. Đảm bảo cột `Cơ chế lô B còn thiếu` ghi nhận việc sử dụng `GT-008` và `GT-013` (cả 2 khuôn này đều đã `active` trong hệ thống).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 02 khớp với thiết kế phân bổ của `chang-02-spec.md`.
  - [ ] Tuân thủ `BR-MCM-06`, không có từ ngữ thương mại đo trí tuệ.

---

### Task 3: Bổ Sung SkillDataset & Level Plans Vào Seeder `C1.NREC.09`
- **Tập tin:** `packages/content/src/skills/c1/nrec/C1.NREC.09.ts`
- **Mục tiêu:** Làm giàu kho ngữ liệu `SkillDataset` với các vật phẩm Chặng 2 và bổ sung các `SkillLevelPlan` trên nền `GT-008` và `GT-013`.
- **Hành động cụ thể:**
  1. Thêm các items lấy cảm hứng từ PDF vào `C1_NREC_09_DATASET.items`:
     - `item_pumpkin_01` .. `item_pumpkin_05` (Bí ngô trên dây leo, glyph 1–5, emoji 🎃).
     - `item_lilypad_01` .. `item_lilypad_05` (Phiến lá hoa súng, glyph 1–5, emoji 🪷).
     - `item_melon_01` .. `item_melon_12` (Quả dưa lưới trên giàn 12 quả, emoji 🍈).
     - `dest_rainbow`, `dest_star`, `dest_flower_garden`, `dest_station`, `dest_gift_chest` (Các trạm đích mê cung).
  2. Bổ sung các câu thoại dẫn truyện của Gấu Logic & Thỏ Quan Sát vào dataset phrasing.
  3. Thêm các `SkillLevelPlan` chuẩn vào mảng `C1_NREC_09_SEED.levels`:
     - `GL-C1-NREC-SLOT-0101` (GT-008, band 3-4, diff 1, `free`, `montessori_ref: "WB02-D1"`): Dây bí ngô 1–5 khuyết 2 ô kẹp giữa $[1, \_, 3, \_, 5]$.
     - `GL-C1-NREC-SLOT-0102` (GT-008, band 3-4, diff 2, `login`, `montessori_ref: "WB02-D1"`): Hồ hoa súng 1–5 khuyết liên tiếp $[1, \_, \_, 4, \_]$.
     - `GL-C1-NREC-SLOT-0106` (GT-008, band 4-5, diff 3, `standard`, `montessori_ref: "WB02-D1"`): Giàn dưa lưới 12 quả khuyết 5 quả.
     - `GL-C1-NREC-SLOT-0107` (GT-008, band 4-5, diff 3, `standard`, `montessori_ref: "WB02-D1"`): Đường ray xanh uốn lượn 1–10 đảo chiều.
     - `GL-C1-NREC-MAZE-0101` (GT-013, band 4-5, diff 3, `standard`, `montessori_ref: "WB02-D2"`): Mê cung số 1–16 đường đến Cầu Vồng (start r1c1, end r5c2).
     - `GL-C1-NREC-MAZE-0102` (GT-013, band 4-5, diff 4, `premium`, `montessori_ref: "WB02-D2"`): Mê cung số 1–16 đường đến Ngôi Sao (start r1c5, end r4c1).
     - `GL-C1-NREC-MAZE-0103` (GT-013, band 5-6, diff 4, `premium`, `montessori_ref: "WB02-D2"`): Mê cung số 1–16 đường đến Vườn Hoa & Nhà Ga.
     - `GL-C1-NREC-MAZE-0104` (GT-013, band 5-6, diff 5, `premium`, `montessori_ref: "WB02-D2"`): Mê cung số 1–16 đường đến Hộp Quà (đích r4c3).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ mã level tuân thủ `GL-C1-NREC-<MECH>-01xx`.
  - [ ] `access_tier` khớp đúng `difficulty` theo `BR-MGL-12`.
  - [ ] Typecheck pass xanh (`pnpm --filter @mindkid/content typecheck`).

---

### Task 4: Bổ Sung SkillDataset & Level Plans Vào `C1.NREC.10`, `C1.NREC.11`, `C1.NREC.12`
- **Tập tin:**
  - `packages/content/src/skills/c1/nrec/C1.NREC.10.ts` (Số trước)
  - `packages/content/src/skills/c1/nrec/C1.NREC.11.ts` (Số sau)
  - `packages/content/src/skills/c1/nrec/C1.NREC.12.ts` (Số ở giữa)
- **Mục tiêu:** Tích hợp các dạng bài số liền kề từ Trang 4, 5, 6 vào seeder chuyên biệt.
- **Hành động cụ thể:**
  1. Trong `C1.NREC.10.ts` (Số trước):
     - Thêm item cành hoa tím khuyết mốc đầu tiên.
     - Thêm level `GL-C1-NREC-SLOT-0103` (GT-008, band 3-4, diff 2, `login`, `montessori_ref: "WB02-D2"`): Dãy $[\_, 2, 3, \_, \_] \rightarrow$ xác định số 1 đứng trước 2.
     - Thêm level `GL-C1-NREC-TAP-0101` (GT-001, band 3-4, diff 1, `free`, `montessori_ref: "WB02-D1"`): Thám tử số trước (chọn số đứng trước 2, 3, 5).
  2. Trong `C1.NREC.11.ts` (Số sau):
     - Thêm item đàn cú treo biển số trên dây cờ.
     - Thêm level `GL-C1-NREC-SLOT-0105` (GT-008, band 3-4, diff 3, `standard`, `montessori_ref: "WB02-D2"`): Dãy $[1, 2, \_, \_, 5] \rightarrow$ đếm tiếp xác định số liền sau 3, 4.
     - Thêm level `GL-C1-NREC-TAP-0102` (GT-001, band 3-4, diff 2, `login`, `montessori_ref: "WB02-D1"`): Thám tử số sau.
  3. Trong `C1.NREC.12.ts` (Số ở giữa):
     - Thêm item khóm hoa hồng trên lối hoa dẫn đường.
     - Thêm level `GL-C1-NREC-SLOT-0104` (GT-008, band 3-4, diff 3, `standard`, `montessori_ref: "WB02-D2"`): Dãy khuyết số lẻ $[\_, 2, \_, 4, \_] \rightarrow$ xác định số 3 ở giữa 2 và 4.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Phân định rõ 3 quan hệ: số trước ($n - 1$), số sau ($n + 1$), số ở giữa kẹp 2 mốc.
  - [ ] Mã level sequence $\ge 0101$, `montessori_ref` trỏ đúng `WB02-D1` hoặc `WB02-D2`.

---

### Task 5: Bổ Sung SkillDataset & Level Plans Vào `C1.CNT.04`, `C1.CNT.08`, `C1.CNT.10`
- **Tập tin:**
  - `packages/content/src/skills/c1/cnt/C1.CNT.04.ts` (Đếm ngược)
  - `packages/content/src/skills/c1/cnt/C1.CNT.08.ts` (Đếm đến 20)
  - `packages/content/src/skills/c1/cnt/C1.CNT.10.ts` (Đếm cách 2)
- **Mục tiêu:** Tích hợp bài toán tàu chạy lùi 10–1, đại lộ 20 số và bước nhảy số chẵn / số lẻ.
- **Hành động cụ thể:**
  1. Trong `C1.CNT.04.ts` (Đếm ngược):
     - Thêm items đoàn tàu chạy lùi về ga đích (Trang 10).
     - Thêm level `GL-C1-CNT-REV-0101` (GT-006, band 4-5, diff 3, `standard`, `montessori_ref: "WB02-D3"`): Sắp xếp đoàn tàu số lùi từ 10 về 1.
     - Thêm level `GL-C1-CNT-SLOT-0103` (GT-008, band 4-5, diff 3, `standard`, `montessori_ref: "WB02-D3"`): Tuyến 10–6 khuyết 9, 8, 6 và Tuyến 5–1 khuyết 5, 4, 3.
  2. Trong `C1.CNT.08.ts` (Đếm đến 20):
     - Thêm items đại lộ 20 chặng và ba cột dọc (Trang 12, 13, 14).
     - Thêm level `GL-C1-CNT-SLOT-0111` (GT-008, band 4-5, diff 4, `premium`, `montessori_ref: "WB02-D2"`): Tuyến ray nối tiếp 1–15 khuyết 10 vị trí.
     - Thêm level `GL-C1-CNT-SLOT-0112` (GT-008, band 4-5, diff 4, `premium`, `montessori_ref: "WB02-D2"`): Ba cột ray dọc 1–15 khuyết theo cặp.
     - Thêm level `GL-C1-CNT-SLOT-0113` (GT-008, band 5-6, diff 4, `premium`, `montessori_ref: "WB02-D2"`): Đại lộ số 1–20 khuyết 11 ô.
  3. Trong `C1.CNT.10.ts` (Đếm cách 2):
     - Thêm items bảng số chẵn và số lẻ phạm vi 20 (Trang 15, 16).
     - Thêm level `GL-C1-CNT-SLOT-0121` (GT-008, band 5-6, diff 3, `standard`, `montessori_ref: "WB02-D1"`): Cho số lẻ, kéo 10 số chẵn $[2, 4, \dots, 20]$.
     - Thêm level `GL-C1-CNT-SLOT-0122` (GT-008, band 5-6, diff 4, `premium`, `montessori_ref: "WB02-D1"`): Cho số chẵn, kéo 10 số lẻ $[1, 3, \dots, 19]$.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các level đếm lùi, đại lộ 20 và đếm cách 2 được cấu hình đúng template (`GT-006` và `GT-008`).
  - [ ] `access_tier` khớp độ khó (diff 3: `standard`, diff 4: `premium`).

---

### Task 6: Kiểm Tra Tính Tương Thích Với Projection Builders
- **Tập tin:**
  - `packages/content/src/builders/gt-008.ts`
  - `packages/content/src/builders/gt-013.ts`
  - `packages/content/src/builders/gt-006.ts`
  - `packages/content/src/builders/gt-001.ts`
- **Mục tiêu:** Đảm bảo dữ liệu từ `SkillDataset` chiếu mượt mà sang `content_pack` của từng game template mà không gây lỗi runtime.
- **Hành động cụ thể:**
  1. Kiểm tra `projectGT008`: Đảm bảo `slots` và `items` được trích xuất chính xác theo số lượng yêu cầu của từng difficulty level.
  2. Kiểm tra `projectGT013`: Đảm bảo mê cung kích thước $5 \times 5$ (band 5-6) hoặc $4 \times 4$ (band 4-5) nhận diện tốt prompt và không bị lỗi thiếu items.
  3. Kiểm tra `projectGT006`: Đảm bảo sắp xếp chuỗi giảm dần (đếm ngược) hoặc tăng dần lấy đúng trường `ordering` từ dataset items.
  4. Kiểm tra `projectGT001`: Đảm bảo danh sách lựa chọn tạo ra distractors hợp lệ từ cùng `contrast_group`.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có assertion hay invariant failure nào khi chạy builder.

---

### Task 7: Chạy Cổng Kiểm Thử & Verification Gates
- **Mục tiêu:** Bảo đảm tính toàn vẹn của mã nguồn, types và dữ liệu seeder trước khi tích hợp vào nhánh chính.
- **Lệnh thực thi:**
  ```bash
  # 1. Kiểm tra kiểu dữ liệu TypeScript trong packages/content
  pnpm --filter @mindkid/content typecheck

  # 2. Chạy cổng kiểm tra hạt nhân Montessori
  pnpm --filter @mindkid/content-build test
  ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Lệnh typecheck trả về exit code 0.
  - [ ] Các bài kiểm tra gate `montessori-corpus.test.ts` pass xanh 100%.
  - [ ] Không xuất hiện bất kỳ cảnh báo hex literal hay vi phạm rule nào.
