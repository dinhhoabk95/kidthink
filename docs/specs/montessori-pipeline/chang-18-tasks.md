# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 18: Tháp Đồng Hồ Kỳ Diệu (WB18)

> **Căn cứ đặc tả:** [`chang-18-spec.md`](./chang-18-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-18/analysis.json` (*Chặng 18: Tháp Đồng Hồ Kỳ Diệu — Khám Phá Giờ Đúng – Giờ Rưỡi – Hoạt Động Trong Ngày*, WB18, 24 trang)  
> **Mục tiêu cốt lõi:** Cung cấp tài liệu hướng dẫn hành động cụ thể cho `montessori_code_implementer` để chuyển hóa dữ liệu Chặng 18 vào các game engine hiện tại (`GT-016`, `GT-001`, `GT-005`, `GT-008`, `GT-000`), giải quyết dứt điểm điểm nghẽn thiếu level Montessori của `WB18-D1`, `WB18-D2`, `WB18-D3` trong `C1.MEAS`, và làm giàu database seeder tại `packages/content/src/skills/c1/meas/` (`C1.MEAS.13`, `C1.MEAS.12`, `C1.MEAS.10`).  
> **Bất biến kiến trúc:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Hủy bỏ và loại trừ hoàn toàn dự thảo `GT-055`. Tuân thủ nghiêm ngặt `BR-MCM-06` (không chứa từ khóa thương mại IQ/Raven/trí tuệ) và `BR-MGL-02` (mọi mã level sequence $\ge 0101$).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung SkillDataset & Level Plans vào C1.MEAS.13 (Đồng hồ: Giờ Đúng & Giờ Rưỡi)
   │
   ├──> Task 4: Bổ sung SkillDataset & Level Plans vào C1.MEAS.12 (Buổi Trong Ngày: Sáng, Trưa, Chiều, Tối)
   │
   ├──> Task 5: Bổ sung SkillDataset & Level Plans vào C1.MEAS.10 (Thời Gian: Trước/Sau & Timeline Sinh Hoạt)
   │
   ├──> Task 6: Kiểm tra tính tương thích với Projection Builders (GT-016, GT-001, GT-005, GT-008)
   │
   └──> Task 7: Chạy cổng kiểm thử & Xác thực chất lượng (pnpm check, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập Nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ định nghĩa cơ chế và engine của các dạng bài Chặng 18 (`WB18-D1`, `WB18-D2`, `WB18-D3`), khẳng định sử dụng các khuôn hiện hữu (`GT-016`, `GT-001`, `GT-005`, `GT-008`), loại bỏ mọi nguy cơ tạo `GT-055`.
- **Hành động cụ thể:**
  1. Rà soát các hàng dạng bài của `WB18` tại Mục 1:
     - `WB18-D1` | Band: `5-6` | C1 | `C1.MEAS` | Lô: `A` | Khuôn: `GT-016` (kèm `GT-001`, `GT-005`) | Trạng thái: **Nhận (Lô A)** | Tên: *Đọc đồng hồ kim giờ đúng & giờ rưỡi, đối chiếu giờ điện tử HH:MM*
     - `WB18-D2` | Band: `5-6` | C1 | `C1.MEAS` | Lô: `B` | Khuôn: `GT-016` (chế độ xoay kim) | Trạng thái: **Nhận (Lô B)** | Tên: *Xoay kim đồng hồ theo giờ yêu cầu (kim dài 12/6, kim ngắn số giờ hoặc giữa 2 số)*
     - `WB18-D3` | Band: `4-5, 5-6` | C1 | `C1.MEAS` | Lô: `A` | Khuôn: `GT-005` (kèm `GT-001`, `GT-008`) | Trạng thái: **Nhận (Lô A)** | Tên: *Gắn kết thời gian với 10 hoạt động sinh hoạt trong ngày & suy luận mốc thời gian hợp lý*
  2. Ghi nhận `WB18-D1`, `WB18-D2` và `WB18-D3` chuyển sang trạng thái đã có kế hoạch level chuẩn, sẵn sàng được nạp.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các hàng `WB18-D1`, `WB18-D2`, `WB18-D3` trỏ đúng vào các khuôn `GT-016`, `GT-001`, `GT-005`, `GT-008`.
  - [ ] Không xuất hiện mã `GT-055` trong tài liệu.

---

### Task 2: Cập Nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật thông tin hàng Workbook 18 tại Bảng 7.1 và ghi nhận nạp 15 level Montessori vào Competency C1 (`C1.MEAS`).
- **Hành động cụ thể:**
  1. Cập nhật hàng 18 tại Bảng 7.1:
     ```markdown
     | 18 | Tháp đồng hồ kỳ diệu | 5-6 | C1 | `C1.MEAS` | `GT-001` · `GT-005` | `GT-016` xoay kim đồng hồ · `GT-008` kéo vào timeline |
     ```
  2. Cập nhật Bảng 7.9 (Phân bổ dạng bài):
     - Ghi nhận strand `C1.MEAS` được nạp 15 level Montessori từ Chặng 18 phân bổ cho `C1.MEAS.13`, `C1.MEAS.12`, `C1.MEAS.10`.
     - Số lượng level nạp vẫn nằm an toàn dưới trần hạn ngạch C1 (180 level).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng 7.1 và 7.9 phản ánh đúng định hướng chuyển giao `WB18-D1..D3` vào `C1.MEAS`.
  - [ ] Tuân thủ tuyệt đối `BR-MCM-06`, không có từ ngữ đo lường trí tuệ thương mại.

---

### Task 3: Bổ Sung SkillDataset & Level Plans Vào Seeder `C1.MEAS.13`
- **Tập tin:** `packages/content/src/skills/c1/meas/C1.MEAS.13.ts`
- **Mục tiêu:** Mở rộng phạm vi từ giờ đúng sang cả giờ rưỡi và xoay kim tương tác, sửa lỗi level thiếu `code`, thêm 9 level Montessori chuẩn.
- **Hành động cụ thể:**
  1. Dọn dẹp object lỗi ở cuối file `levels` (object thiếu trường `code` ở dòng 398): Xóa hoặc thay thế bằng level chuẩn có code đầy đủ.
  2. Thêm các items đồng hồ giờ đúng (1:00 đến 12:00), giờ rưỡi (1:30, 4:30, 6:30, 7:30, 10:30, 11:30) và các vật phẩm Tháp Thời Gian (`tower_gear_gold`, `tower_golden_key`, `pocket_watch_detective`, `magic_time_gem`) vào `C1_MEAS_13_DATASET.items`.
  3. Bổ sung các câu thoại Gấu Logic & Thỏ Quan Sát vào `phrasing`:
     - Prompt: *"Kim dài chỉ 12, bé nhìn xem kim ngắn đang chỉ số mấy nào!"* / *"Kim phút ở số 6, bé hãy xoay kim giờ đến giữa hai số nhé!"*
     - Narration: *"Cùng Gấu Logic và Thỏ Quan Sát khám phá Tháp Đồng Hồ Kỳ Diệu nhé!"*
  4. Thêm 9 `SkillLevelPlan` chuẩn vào `C1_MEAS_13_SEED.levels`:
     - `GL-C1-MEAS-CLK-0101` (`GT-016`, band 5-6, diff 1, `free`, `montessori_ref: "WB18-D1"`): Làm quen đồng hồ giờ đúng (1:00 đến 6:00).
     - `GL-C1-MEAS-TAP-0101` (`GT-001`, band 5-6, diff 2, `login`, `montessori_ref: "WB18-D1"`): Mắt tinh xem giờ tròn (trắc nghiệm 3 lựa chọn).
     - `GL-C1-MEAS-CLK-0102` (`GT-016`, band 5-6, diff 2, `login`, `montessori_ref: "WB18-D1"`): Khám phá 12 mặt số (đọc giờ đúng 1..12).
     - `GL-C1-MEAS-PAIR-0101` (`GT-005`, band 5-6, diff 2, `login`, `montessori_ref: "WB18-D1"`): Nối đồng hồ kim với thẻ giờ điện tử HH:00.
     - `GL-C1-MEAS-CLK-0103` (`GT-016`, band 5-6, diff 3, `standard`, `montessori_ref: "WB18-D2"`): Xưởng sửa kim giờ đúng (xoay kim giờ theo yêu cầu).
     - `GL-C1-MEAS-CLK-0104` (`GT-016`, band 5-6, diff 3, `standard`, `montessori_ref: "WB18-D1"`): Bước vào giờ rưỡi (đọc đồng hồ kim phút chỉ 6).
     - `GL-C1-MEAS-CLK-0105` (`GT-016`, band 5-6, diff 4, `premium`, `montessori_ref: "WB18-D1"`): Thám tử phân biệt giờ (đọc hỗn hợp giờ đúng vs giờ rưỡi).
     - `GL-C1-MEAS-CLK-0106` (`GT-016`, band 5-6, diff 4, `premium`, `montessori_ref: "WB18-D2"`): Thử tài đặt kim giờ rưỡi (xoay kim phút 6, kim giờ giữa 2 số).
     - `GL-C1-MEAS-CLK-0107` (`GT-016`, band 5-6, diff 5, `premium`, `montessori_ref: "WB18-D2"`): Đại thử thách Tháp Thời Gian (xoay kim độc lập không trợ giúp).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] File không còn object level thiếu `code`.
  - [ ] Mọi mã level Montessori tuân thủ `GL-C1-MEAS-<MECH>-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 1=`free`, diff 2=`login`, diff 3=`standard`, diff 4/5=`premium`.
  - [ ] Không chứa từ khóa thương mại IQ/Raven/trí tuệ theo `BR-MCM-06`.

---

### Task 4: Bổ Sung SkillDataset & Level Plans Vào Seeder `C1.MEAS.12`
- **Tập tin:** `packages/content/src/skills/c1/meas/C1.MEAS.12.ts`
- **Mục tiêu:** Mở rộng ngữ liệu các hoạt động trong ngày của bé gắn với mốc thời gian và 4 buổi, thêm 3 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm các items 10 hoạt động sinh hoạt (`routine_wake_up`, `routine_brush_teeth`, `routine_eat_breakfast`, `routine_go_to_school`, `routine_eat_lunch`, `routine_play_sports`, `routine_take_bath`, `routine_eat_dinner`, `routine_do_homework`, `routine_go_to_sleep`) và 4 biểu tượng buổi (`period_morning_sun`, `period_noon_sun`, `period_afternoon_sky`, `period_night_moon`) vào `C1_MEAS_12_DATASET.items`.
  2. Bổ sung các câu thoại Gấu Logic & Thỏ Quan Sát vào `phrasing`:
     - Prompt: *"Bé hãy chọn chiếc đồng hồ có thời gian phù hợp với hoạt động nhé!"*
     - Narration: *"Cùng Gấu Logic và Thỏ Quan Sát khám phá một ngày bận rộn của bé nhé!"*
  3. Thêm 3 `SkillLevelPlan` chuẩn vào `C1_MEAS_12_SEED.levels`:
     - `GL-C1-MEAS-TAP-0102` (`GT-001`, band 4-5, diff 2, `login`, `montessori_ref: "WB18-D3"`): Sáng, trưa hay tối? — So sánh 2 đồng hồ và chọn đồng hồ hợp lý cho hoạt động.
     - `GL-C1-MEAS-PAIR-0102` (`GT-005`, band 4-5, diff 3, `standard`, `montessori_ref: "WB18-D3"`): Một ngày của bé — Nối 4 tranh hoạt động sinh hoạt với đồng hồ kim tương ứng.
     - `GL-C1-MEAS-TAP-0103` (`GT-001`, band 5-6, diff 3, `standard`, `montessori_ref: "WB18-D3"`): Xem đồng hồ chọn hoạt động — Nhìn đồng hồ kim và chọn tranh sinh hoạt phù hợp trong 3 tranh.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level chuẩn `GL-C1-MEAS-TAP-01xx`, `GL-C1-MEAS-PAIR-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 2=`login`, diff 3=`standard`.

---

### Task 5: Bổ Sung SkillDataset & Level Plans Vào Seeder `C1.MEAS.10`
- **Tập tin:** `packages/content/src/skills/c1/meas/C1.MEAS.10.ts`
- **Mục tiêu:** Gắn kết khái niệm thời gian trước/sau với trình tự các hoạt động sinh hoạt trong ngày của bé, thêm 3 level chuẩn.
- **Hành động cụ thể:**
  1. Thêm quan hệ trình tự `relations` (sequence) giữa các hoạt động buổi sáng: thức dậy $\rightarrow$ đánh răng $\rightarrow$ ăn sáng $\rightarrow$ đi học.
  2. Thêm 3 `SkillLevelPlan` chuẩn vào `C1_MEAS_10_SEED.levels`:
     - `GL-C1-MEAS-SLOT-0101` (`GT-008`, band 4-5, diff 1, `free`, `montessori_ref: "WB18-D3"`): Chuỗi buổi sáng thức dậy — Kéo thả 3 thẻ sinh hoạt vào đúng thứ tự trước/sau.
     - `GL-C1-MEAS-PAIR-0103` (`GT-005`, band 4-5, diff 2, `login`, `montessori_ref: "WB18-D3"`): Ghép cặp nhịp sinh học — Nối tranh hoạt động với biểu tượng buổi tương ứng (Sáng, Trưa, Tối).
     - `GL-C1-MEAS-SLOT-0102` (`GT-008`, band 5-6, diff 3, `standard`, `montessori_ref: "WB18-D3"`): Lịch trình timeline một ngày — Kéo thả các thẻ mốc giờ vào các chặng sinh hoạt trên dòng thời gian.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level chuẩn `GL-C1-MEAS-SLOT-01xx`, `GL-C1-MEAS-PAIR-01xx`.
  - [ ] `access_tier` khớp độ khó: diff 1=`free`, diff 2=`login`, diff 3=`standard`.

---

### Task 6: Kiểm Tra Tính Tương Thích Với Projection Builders
- **Tập tin:**
  - `packages/content/src/builders/gt-016.ts`
  - `packages/content/src/builders/gt-001.ts`
  - `packages/content/src/builders/gt-005.ts`
  - `packages/content/src/builders/gt-008.ts`
- **Mục tiêu:** Đảm bảo `SkillDataset` mới cung cấp đầy đủ các trường dữ liệu mà các builder yêu cầu (`glyph`, `image`, `ordering`, `label`, `category`).
- **Hành động cụ thể:**
  1. Xác nhận `gt-016.ts` tạo payload hợp lệ với `mode: "read"` và `mode: "set"`.
  2. Xác nhận `gt-005.ts` tạo được các cặp đối chiếu (Left: glyph/text, Right: image/emoji).
  3. Xác nhận `gt-001.ts` tạo được câu hỏi trắc nghiệm với prompt template thay thế `{label}` mượt mà.
  4. Xác nhận `gt-008.ts` tạo được slot và các thẻ kéo thả tương ứng.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Không có lỗi runtime khi chiếu dataset qua các builder.

---

### Task 7: Chạy Cổng Kiểm Thử & Xác Thực Chất Lượng
- **Lệnh thực thi:**
  ```bash
  pnpm check
  pnpm --filter @mindkid/content-build test
  ```
- **Mục tiêu:** Đảm bảo mã nguồn đạt 100% tiêu chuẩn chất lượng hệ thống TiniMath v2.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `pnpm check` exit 0 (0 lỗi lint Biome, 0 lỗi TypeScript strict, tuyệt đối không có `any` hay `unknown`).
  - [ ] Mọi mã level Montessori tuân thủ regex `^GL-C[1-6]-[A-Z]{3,4}-[A-Z]{3,4}-01\d{2}$`.
  - [ ] `access_tier` khớp chính xác với `difficulty` (`BR-MGL-12`).
  - [ ] Không vi phạm trần hạn ngạch C1 (180 level).
  - [ ] Không chứa bất kỳ từ khóa cấm nào theo `BR-MCM-06`.
