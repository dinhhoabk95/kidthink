# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 15: Thung Lũng Quy Luật (WB15)

> **Căn cứ đặc tả:** [`chang-15-spec.md`](./chang-15-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-15/analysis.json` (*Chặng 15: Thung Lũng Quy Luật — Cùng Bé Tìm Quy Luật*, WB15, 22 trang)  
> **Mục tiêu cốt lõi:** Cung cấp tài liệu hướng dẫn hành động cụ thể cho `montessori_code_implementer` để chuyển hóa dữ liệu Chặng 15 vào các game engine hiện tại (`GT-001`, `GT-006`, `GT-008`, `GT-011`, `GT-000`), giải quyết dứt điểm điểm nghẽn 0 Montessori level của `WB15-D2` và `WB15-D3` trong `C3.RULE`, và làm giàu database seeder tại `packages/content/src/skills/c3/rule/` và `c1/pat/`.  
> **Bất biến kiến trúc:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Hủy bỏ và loại trừ hoàn toàn dự thảo `GT-052`. Tuân thủ nghiêm ngặt `BR-MCM-06` (không chứa từ khóa thương mại IQ/Raven/đo trí tuệ) và `BR-MGL-02` (mọi mã level sequence $\ge 0101$).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung SkillDataset & Level Plans vào C3.RULE.01 (Bước nhảy cố định & Ma trận 2x2)
   │
   ├──> Task 4: Bổ sung SkillDataset & Level Plans vào C3.RULE.02 (Gia số tăng dần, Bông hoa số & Ẩn số A/B)
   │
   ├──> Task 5: Bổ sung SkillDataset & Level Plans vào C3.RULE.03 (Dãy số đôi xen kẽ, Điểm chấm & Boss Door)
   │
   ├──> Task 6: Bổ sung SkillDataset & Level Plans vào C1.PAT.01..04 (Quy luật chu kỳ AB, ABB, AAB, ABC)
   │
   ├──> Task 7: Kiểm tra tính tương thích với Projection Builders (GT-001, GT-006, GT-008, GT-011)
   │
   └──> Task 8: Chạy cổng kiểm thử & Xác thực chất lượng (typecheck, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập Nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ định nghĩa cơ chế và engine của các dạng bài Chặng 15 (`WB15-D1`, `WB15-D2`, `WB15-D3`), khẳng định sử dụng các khuôn hiện hữu (`GT-001`, `GT-006`, `GT-011`, `GT-008`), loại bỏ mọi nguy cơ tạo `GT-052`.
- **Hành động cụ thể:**
  1. Rà soát các hàng dạng bài của `WB15` tại Bảng 1:
     - `WB15-D1` | Band: `5-6` | C1 | `C1.PAT` | Lô: `A` | Khuôn: `GT-006` (kèm `GT-001`) | Trạng thái: **Nhận (Lô A)** | Tên: *Chuỗi quy luật lặp $AB-ABC-AABB$ kéo/chọn phần tử tiếp*
     - `WB15-D2` | Band: `5-6` | C3 | `C3.RULE` | Lô: `A` | Khuôn: `GT-001` (kèm `GT-011`) | Trạng thái: **Nhận (Lô A)** | Tên: *Quy luật ma trận $2 \times 2$ (Màu sắc, Hình dạng & Số học)*
     - `WB15-D3` | Band: `5-6` | C3 | `C3.RULE` | Lô: `B` | Khuôn: `GT-011` (kèm `GT-008`) | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Điền phần tử khuyết vào ma trận quy luật, Bông hoa số & Dãy số đôi*
  2. Ghi nhận `WB15-D2` và `WB15-D3` chuyển sang trạng thái đã có kế hoạch level chuẩn, sẵn sàng được nạp.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các hàng `WB15-D1`, `WB15-D2`, `WB15-D3` trỏ đúng vào các khuôn `GT-001`, `GT-006`, `GT-011`, `GT-008`.
  - [ ] Không xuất hiện mã `GT-052` trong tài liệu.

---

### Task 2: Cập Nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật thông tin hàng Workbook 15 tại Bảng 7.1 và điều chỉnh số liệu hạn ngạch C3 tại Bảng 7.9.
- **Hành động cụ thể:**
  1. Cập nhật hàng 15 tại Bảng 7.1:
     ```markdown
     | 15 | Thung lũng quy luật | 5-6 | C3 | `C3.RULE` · `C1.PAT` | `GT-006` · `GT-001` | `GT-011` ma trận chọn hình · `GT-008` kéo vào ô khuyết |
     ```
  2. Cập nhật Bảng 7.9 (Phân bổ dạng bài):
     - Ghi nhận strand `C3.RULE` được nạp 11 level Montessori từ Chặng 15.
     - Cột `Dạng bài đã soạn` của C3 tăng lên, nâng tổng số level đã soạn của C3 lên mức an toàn trong hạn ngạch 15 level.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng 7.1 và 7.9 phản ánh đúng định hướng chuyển giao `WB15-D2` và `WB15-D3` vào `C3.RULE`.
  - [ ] Tuân thủ tuyệt đối `BR-MCM-06`, không có từ ngữ đo lường trí tuệ thương mại.

---

### Task 3: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.RULE.01`
- **Tập tin:** `packages/content/src/skills/c3/rule/C3.RULE.01.ts`
- **Mục tiêu:** Giải quyết điểm nghẽn 0 Montessori level cho `C3.RULE.01`, làm giàu ngữ liệu chủ đề Thung Lũng Quy Luật và thêm 3 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items Thung Lũng Quy Luật vào `C3_RULE_01_DATASET.items`:
     - `stone_step_2`..`stone_step_10`: Phiến đá số bước nhảy $+2$ (emoji 🪨).
     - `matrix_grid_orange`, `matrix_grid_blue`: Lưới ma trận $2 \times 2$ (emoji 🔲, 🟦).
     - `gate_lock_gem`: Viên ngọc quy luật (emoji 💎).
  2. Bổ sung các câu thoại Gấu Logic & Thỏ Quan Sát vào `phrasing`:
     - Prompt: *"Các số đang tăng hoặc giảm đều đấy! Bé hãy tìm số tiếp theo nhé!"*
     - Narration: *"Cùng Gấu Logic và Thỏ Quan Sát tìm quy luật để mở cánh cổng Thung Lũng nhé!"*
  3. Thêm 3 `SkillLevelPlan` chuẩn vào `C3_RULE_01_SEED.levels`:
     - `GL-C3-RULE-CARD-0103` (`GT-001`, band 5-6, diff 2, `login`, `montessori_ref: "WB15-D2"`): Con đường số nhảy đều — Chọn số tiếp theo trên đường ray đá sỏi theo bước nhảy cộng/trừ đều.
     - `GL-C3-RULE-MATRX-0101` (`GT-011`, band 5-6, diff 2, `login`, `montessori_ref: "WB15-D2"`): Ô vuông phép thuật 2x2 — Ma trận $2 \times 2$ biến đổi màu sắc & hình dạng trực quan.
     - `GL-C3-RULE-MATRX-0102` (`GT-011`, band 5-6, diff 3, `standard`, `montessori_ref: "WB15-D3"`): Ma trận số học 2x2 — Điền số còn thiếu vào ô ma trận thỏa mãn đồng thời hàng ngang và cột dọc.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level chuẩn định dạng `GL-C3-RULE-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 2=`login`, diff 3=`standard`.
  - [ ] `pnpm --filter @mindkid/content typecheck` pass sạch lỗi.

---

### Task 4: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.RULE.02`
- **Tập tin:** `packages/content/src/skills/c3/rule/C3.RULE.02.ts`
- **Mục tiêu:** Mở rộng năng lực gia số biến đổi, bông hoa số và hệ ẩn số ma trận cho `C3.RULE.02`, thêm 4 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items bông hoa số và hình học phát triển vào `C3_RULE_02_DATASET.items`:
     - `flower_center_8`: Nhụy hoa số 8 (emoji 🌼).
     - `flower_petal_top_3`, `flower_petal_bottom_5`, `flower_petal_left_4`, `flower_petal_right_4`: Cánh hoa số đối xứng (emoji 🌸).
     - `growing_dots_line`, `growing_dots_l_shape`, `growing_dots_cross`, `growing_dots_square`: Các cấu trúc chấm tròn lớn dần (emoji 🟣).
  2. Bổ sung các câu thoại dẫn truyện vào `phrasing`:
     - Prompt: *"Mỗi bông hoa ẩn chứa quy luật kỳ diệu! Gợi ý: Số ở nhụy giữa = tổng hai cánh đối diện!"*
  3. Thêm 4 `SkillLevelPlan` chuẩn vào `C3_RULE_02_SEED.levels`:
     - `GL-C3-RULE-ORD-0103` (`GT-006`, band 5-6, diff 3, `standard`, `montessori_ref: "WB15-D1"`): Bậc thang gia số tăng dần — Sắp xếp các nấc thang số có bước nhảy tăng dần ($+1, +2, +3, +4...$).
     - `GL-C3-RULE-SLOT-0121` (`GT-008`, band 5-6, diff 3, `standard`, `montessori_ref: "WB15-D3"`): Bông hoa số bí mật — Kéo thả số vào cánh hoa khuyết thỏa mãn quy tắc cân bằng tổng đối diện.
     - `GL-C3-RULE-CARD-0104` (`GT-001`, band 5-6, diff 4, `premium`, `montessori_ref: "WB15-D2"`): Bậc thang Fibonacci & Chính phương — Chạm chọn số tiếp theo theo quy luật Fibonacci hoặc chính phương.
     - `GL-C3-RULE-MATRX-0103` (`GT-011`, band 5-6, diff 4, `premium`, `montessori_ref: "WB15-D3"`): Thám tử tìm A và B — Chuỗi ma trận $2 \times 2$ tịnh tiến tìm cặp ẩn số $A$ và $B$.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ 4 level tuân thủ `GL-C3-RULE-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 3=`standard`, diff 4=`premium`.

---

### Task 5: Bổ Sung SkillDataset & Level Plans Vào Seeder `C3.RULE.03`
- **Tập tin:** `packages/content/src/skills/c3/rule/C3.RULE.03.ts`
- **Mục tiêu:** Mở rộng năng lực nhận diện dãy số đôi xen kẽ, hình học điểm chấm và thử thách Boss Door mở cổng cho `C3.RULE.03`, thêm 4 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items đoàn tàu số và cánh cổng đá vào `C3_RULE_03_DATASET.items`:
     - `train_engine_steam`: Đầu tàu hỏa hơi nước (emoji 🚂).
     - `train_car_yellow_even`, `train_car_blue_odd`: Toa số màu vàng chẵn và xanh lẻ (emoji 🚃).
     - `cipher_key_door`: Chìa khóa mật mã 6 ký tự (emoji 🗝️).
     - `valley_ancient_gate`: Cánh cổng thung lũng đá cổ thụ (emoji ⛩️).
  2. Bổ sung các câu thoại dẫn truyện vào `phrasing`:
     - Prompt: *"Có hai dãy số đang chạy xen kẽ nhau đấy! Bé tìm hai số tiếp theo cho mỗi dãy nhé!"*
     - Boss prompt: *"Chỉ còn một bước nữa thôi! Bé hãy giải 6 mật mã để mở cánh cổng nhé!"*
  3. Thêm 4 `SkillLevelPlan` chuẩn vào `C3_RULE_03_SEED.levels`:
     - `GL-C3-RULE-ORD-0104` (`GT-006`, band 5-6, diff 3, `standard`, `montessori_ref: "WB15-D1"`): Dãy số đôi xen kẽ — Sắp xếp và tìm cặp 2 số tiếp theo của chuỗi số đa luồng vị trí chẵn/lẻ.
     - `GL-C3-RULE-SLOT-0122` (`GT-008`, band 5-6, diff 4, `premium`, `montessori_ref: "WB15-D3"`): Hai đoàn tàu số — Ghép 2 toa tàu vào khớp nối đuôi đoàn tàu xe lửa hai màu.
     - `GL-C3-RULE-CARD-0105` (`GT-001`, band 5-6, diff 4, `premium`, `montessori_ref: "WB15-D2"`): Hàng rào lớn dần — Tính số lượng điểm chấm phát triển của góc L, chữ U, dấu cộng và viền vuông.
     - `GL-C3-RULE-CARD-0106` (`GT-001`, band 5-6, diff 5, `premium`, `montessori_ref: "WB15-D3"`): Đại mật mã mở cổng thung lũng — Boss Door 6 bước mật mã `[B, A, A, A, B, C]` mở cổng trao Ngọc Quy Luật.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ 4 level tuân thủ `GL-C3-RULE-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 3=`standard`, diff 4/5=`premium`.

---

### Task 6: Làm Giàu SkillDataset & Level Plans Cho `C1.PAT.01..04`
- **Tập tin:**
  - `packages/content/src/skills/c1/pat/C1.PAT.01.ts` (Quy luật AB)
  - `packages/content/src/skills/c1/pat/C1.PAT.02.ts` (Quy luật ABB)
  - `packages/content/src/skills/c1/pat/C1.PAT.03.ts` (Quy luật AAB)
  - `packages/content/src/skills/c1/pat/C1.PAT.04.ts` (Quy luật ABC)
- **Mục tiêu:** Kế thừa kho ngữ liệu hoa quả, muông thú Chặng 15 vào competency C1, chuẩn bị sẵn sàng cho lộ trình phát triển.
- **Hành động cụ thể:**
  1. Trong `C1.PAT.01.ts`:
     - Thêm các items hoa quả tươi và bạn thú rừng xanh.
     - Thêm level `GL-C1-PAT-ORD-0101` (`GT-006`, band 5-6, diff 1, `free`, `montessori_ref: "WB15-D1"`): Cánh cổng AB — Kéo hình tiếp theo vào ô khuyết chuỗi AB.
     - Thêm level `GL-C1-PAT-CARD-0101` (`GT-001`, band 5-6, diff 2, `login`, `montessori_ref: "WB15-D1"`): Hai hình thay phiên — Chạm chọn hình tiếp theo trong chuỗi AB mở rộng.
  2. Trong `C1.PAT.02.ts`:
     - Thêm level `GL-C1-PAT-CARD-0102` (`GT-001`, band 5-6, diff 2, `login`, `montessori_ref: "WB15-D1"`): Quy luật ABB — Chạm chọn hình tiếp theo theo cấu trúc 1 hình trước 2 hình sau.
  3. Trong `C1.PAT.03.ts`:
     - Thêm level `GL-C1-PAT-CARD-0103` (`GT-001`, band 5-6, diff 2, `login`, `montessori_ref: "WB15-D1"`): Quy luật AAB — Chạm chọn hình tiếp theo theo cấu trúc 2 hình trước 1 hình sau.
  4. Trong `C1.PAT.04.ts`:
     - Thêm level `GL-C1-PAT-ORD-0102` (`GT-006`, band 5-6, diff 3, `standard`, `montessori_ref: "WB15-D1"`): Ba người bạn luân phiên — Kéo thả hình hoàn thành chu kỳ lặp 3 phần tử ABC.
     - Thêm level `GL-C1-PAT-CARD-0104` (`GT-001`, band 5-6, diff 3, `standard`, `montessori_ref: "WB15-D1"`): Mật mã hình học 2 thuộc tính — Phân tích đồng thời hình dạng và màu sắc.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Dataset có thêm các items hoa quả, muông thú, hình học từ Chặng 15.
  - [ ] Mã level tuân thủ quy tắc `01xx`.

---

### Task 7: Kiểm Tra Tính Tương Thích Với Projection Builders
- **Tập tin:** `packages/content/src/builders/`
- **Mục tiêu:** Đảm bảo các `SkillLevelPlan` mới sinh ra `ContentSeed` hợp lệ qua các builder `gt-001.ts`, `gt-006.ts`, `gt-008.ts`, `gt-011.ts`.
- **Hành động cụ thể:**
  1. Kiểm tra builder `GT-001`: Dataset có $\ge 2$ items, có `label` hợp lệ để hiển thị câu hỏi và các distractors.
  2. Kiểm tra builder `GT-006`: Dataset có $\ge 3$ items, có `ordering` hoặc `value` số học rõ ràng để sắp xếp.
  3. Kiểm tra builder `GT-008`: Dataset có $\ge 2$ items, hỗ trợ tạo đúng số lượng `slots` và `items` tương ứng với cánh hoa và toa xe.
  4. Kiểm tra builder `GT-011`: Lưới ma trận $2 \times 2$ có dữ kiện hàng và cột rõ ràng, 1 ô slot khuyết và danh sách phương án lựa chọn.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàm `buildLevelsForSkill` chạy thành công mà không throw ngoại lệ validation.

---

### Task 8: Chạy Cổng Kiểm Thử & Xác Thực Chất Lượng
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
     - Kiểm tra `access_tier` khớp độ khó `difficulty`.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ lệnh kiểm tra thoát mã 0 (exit code 0).
