---
spec: MONTESSORI-CHANG-18-SPEC
title: "Chặng 18: Tháp Đồng Hồ Kỳ Diệu — Khám Phá Giờ Đúng, Giờ Rưỡi & Hoạt Động Trong Ngày"
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-18
workbook_ref: WB18
gem_reward: "Viên Ngọc Thời Gian (Magic Time Gem)"
owns:
  - Phân tích sư phạm và giải mã toàn diện 24 trang PDF Chặng 18 (Tháp Đồng Hồ Kỳ Diệu, WB18)
  - Ánh xạ các nhóm hoạt động (WB18-D1..D3) vào các game engine hiện tại GT-016, GT-001, GT-005, GT-008, GT-000
  - TUYỆT ĐỐI KHÔNG TẠO MỚI GT-038+, hủy bỏ và loại bỏ hoàn toàn dự thảo GT-055 cũ
  - Khắc phục lỗ hổng thiếu level Montessori của WB18 (WB18-D1, WB18-D2, WB18-D3) trong packages/content
  - Thiết kế SkillDataset (items, relations, axes, ladder, phrasing) lấy cảm hứng từ thế giới Tháp Đồng Hồ pastel và nhịp sinh hoạt trong PDF 2026
  - Thiết kế 15 SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101) cho C1.MEAS.13, C1.MEAS.12, C1.MEAS.10
  - Kế hoạch phổ biến dữ liệu vào seeder packages/content/src/skills/c1/meas/
  - Tuân thủ nghiêm ngặt BR-MCM-06 (không chứa từ khóa thương mại IQ/Raven/trí tuệ trong title và instruction)
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 18: Tháp Đồng Hồ Kỳ Diệu — Khám Phá Giờ Đúng, Giờ Rưỡi & Hoạt Động Trong Ngày

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này xác lập đặc tả kỹ thuật và kiến trúc nội dung sư phạm nhằm chuyển thể trọn vẹn dữ liệu từ giáo trình PDF **"Chặng 18: Tháp Đồng Hồ Kỳ Diệu — Khám Phá Giờ Đúng – Giờ Rưỡi – Hoạt Động Trong Ngày"** (`docs/montessori/extracted/chang-18/analysis.json`, nguồn: *WB18*, 24 trang, thuộc bộ giáo trình *Gấu Logic & Thỏ Quan Sát - Chuyến Tàu Toán Học*, Nhà xuất bản Dân Trí / Montessori VN) vào nền tảng **TiniMath v2**.

### 1.1 Bối Cảnh Cốt Truyện & Nhiệm Vụ Học Tập (Narrative Quest)
1. **Bối cảnh cốt truyện**: Chuyến Tàu Toán Học đưa thám tử Gấu Logic và Thỏ Quan Sát dừng chân trước **Tháp Đồng Hồ Kỳ Diệu** (Magic Clock Tower) — tòa tháp thời gian cổ tích sừng sững giữa thiên nhiên xanh biếc với cỗ máy bánh răng khổng lồ. Hệ thống thời gian của Tháp đang bị xáo trộn: nhiều mặt đồng hồ bị dừng lại, các kim giờ kim phút bị biến mất trong xưởng cơ khí, các cánh cửa thời gian bị khóa chặt. Để đưa cỗ máy thời gian hoạt động trở lại và thắp sáng **Viên Ngọc Thời Gian** (Magic Time Gem) tại đỉnh tháp, bé phải giải mã các mặt đồng hồ, phân biệt giờ đúng – giờ rưỡi, sửa chữa những chiếc kim và liên kết mốc thời gian với hoạt động sinh hoạt thường nhật.
2. **Nhiệm vụ học tập (Learning Quest)**:
   - **Làm chủ cấu tạo và chuyển động của đồng hồ kim (Clock Anatomy & Kinematics)**: Phân biệt rõ chức năng của kim giờ (ngắn) và kim phút (dài), hiểu nguyên tắc quay cùng chiều kim đồng hồ quanh tâm tròn 1..12.
   - **Nhận thức thời gian theo tiến trình CPA (Concrete - Pictorial - Abstract)**:
     - *Concrete (Trực quan cụ thể)*: Kết nối thời gian với nhịp sinh học và 10 hoạt động sinh hoạt quen thuộc của trẻ mầm non (thức dậy 6:00, đánh răng 7:00, ăn sáng 8:00, đi học 7:00, ăn trưa 11:30/12:00, tập thể thao 16:00, tắm bồn 17:00, ăn tối 18:00, làm bài 19:30/20:00, đi ngủ 21:00) và 4 buổi trong ngày (Sáng, Trưa, Chiều, Tối).
     - *Pictorial (Hình ảnh trực quan)*: Đọc chính xác giờ đúng (kim phút chỉ số 12) và giờ rưỡi (kim phút chỉ số 6, kim giờ di chuyển đến điểm chính giữa hai số liên tiếp) trên các mặt đồng hồ tròn đa màu sắc.
     - *Abstract (Trừu tượng hóa & Tương tác)*: Chuyển đổi hai chiều giữa đồng hồ kim (Analog) và đồng hồ điện tử (Digital HH:MM), chủ động xoay/vẽ kim giờ và kim phút trên màn hình cảm ứng theo mốc giờ yêu cầu.
   - **Tư duy suy luận loại trừ thời gian phi lý (Temporal Deduction & Reality Check)**: Phát hiện và loại trừ các phương án thời gian bất hợp lý so với đời sống (ví dụ: ăn sáng lúc 12:00 trưa, đi ngủ đêm lúc 12:00 trưa, ăn trưa lúc 1:00 sáng).

### 1.2 Nguyên Tắc Bất Biến Về Công Nghệ & Phạm Vi
1. **Tuyệt Đối Không Tạo Game Engine Mới (`GT-038+`)**:
   - Toàn bộ cơ chế đọc giờ, xoay kim và đối chiếu thời gian của Chặng 18 được tích hợp 100% vào các game engine hiện hữu:
     - `GT-016` (`clock-face` / `clock-hands`): Engine chuyên dụng mặt đồng hồ tròn. Hỗ trợ 2 chế độ:
       - Chế độ `read`: Hiển thị mặt đồng hồ kim và các phương án chọn giờ điện tử / giờ chữ (đáp ứng `WB18-D1`).
       - Chế độ `set`: Cho phép trẻ chạm/kéo xoay kim giờ và kim phút từ tâm quay đến góc đích (bước nhảy `minute_step = 30` cho giờ đúng và giờ rưỡi) kèm cơ chế snap tự hút vào vạch số (đáp ứng `WB18-D2`).
     - `GT-001` (`tap-select`): Trắc nghiệm chạm chọn 1 trong 3 đáp án giờ đúng (Trang 2, 6); so sánh chọn đồng hồ hợp lý cho hoạt động (Trang 4); nhìn đồng hồ kim chọn tranh hoạt động phù hợp (Trang 5) (đáp ứng `WB18-D1`, `WB18-D3`).
     - `GT-005` (`pair-match`): Nối tranh hoạt động trong ngày với đồng hồ kim tương ứng; nối đồng hồ kim với thẻ giờ điện tử (đáp ứng `WB18-D1`, `WB18-D3`).
     - `GT-008` (`drag-to-slot`): Kéo thả thẻ hoạt động hoặc thẻ giờ vào các mốc trên dòng thời gian Timeline của một ngày (đáp ứng `WB18-D3`).
     - `GT-000` (`concept-intro` & `celebration-summary`): Hoạt cảnh bước vào Tháp Thời Gian (Trang 1) và Đại lễ vinh danh nhận Huy Hiệu Chinh Phục Đồng Hồ (Trang 24).
   - **Hủy bỏ và nghiêm cấm dự thảo `GT-055` cũ**: Đề xuất tạo `GT-055` trong ghi chép cũ bị **hủy bỏ hoàn toàn** vì vi phạm giới hạn trần kiến trúc engine (`GT-000`..`GT-037`).
2. **Khắc Phục Lỗ Hổng Thiếu Level Montessori Của `WB18` Trong `packages/content`**:
   - Hiện tại, `WB18` mới chỉ có 2 level Montessori sơ khai (`GL-C1-MEAS-CARD-0123`, `GL-C1-MEAS-CARD-0124`) gắn nhãn `WB18-D1` trong `C1.MEAS.13.ts` và còn thiếu hoàn toàn level cho `WB18-D2` (xoay kim) và `WB18-D3` (hoạt động sinh hoạt).
   - Tài liệu này thiết kế bổ sung 15 level Montessori chất lượng cao phân bổ vào `C1.MEAS.13` (Đồng hồ giờ đúng & giờ rưỡi), `C1.MEAS.12` (Buổi trong ngày) và `C1.MEAS.10` (Thời gian trước/sau), giải quyết triệt để sự thiếu hụt nội dung của Chặng 18.
3. **Tuân Thủ Tuyệt Đối Quy Tắc Doanh Nghiệp & Sư Phạm**:
   - `BR-MCM-06`: Tuyệt đối không chứa từ khóa thương mại, bài kiểm tra tâm lý hoặc tuyên bố đo lường chỉ số trí tuệ (`raven`, `iq`, `trí tuệ`, `chỉ số thông minh`, `wisc`). Trong PDF gốc có cụm từ "Viên Ngọc Trí Tuệ", spec này chuẩn hóa thành **"Viên Ngọc Thời Gian"** / **"Huy Hiệu Chinh Phục Đồng Hồ"**.
   - `BR-MGL-02`: Mọi mã level Montessori thuộc khối dành riêng từ `0101` trở lên: `GL-<COMP>-<STRAND>-<MECH>-01xx`.
   - `BR-MGL-03` & `BR-MGL-04`: Mỗi dạng bài có ít nhất 2 level khác độ khó, tăng lũy tiến một chiều (cô lập thuộc tính theo `BR-MCM-13`).
   - `BR-MGL-12`: Cấp bậc truy cập (`access_tier`) đồng bộ chặt chẽ với độ khó (`difficulty`: 1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`).
   - `BR-MCM-14` & `BR-MCM-15`: Giữ trọn vẹn kiểm soát lỗi tự thân (Control of Error) và trình tự cụ thể đến trừu tượng (CPA).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò hệ thống | Vai trò sư phạm & Thể hiện trong Chặng 18 |
|---|---|---|
| **Bé (Kid Player)** | Người chơi trung tâm (4–6 tuổi) | Nhập vai thám tử nhí thời gian cùng Gấu Logic và Thỏ Quan Sát khám phá Tháp Đồng Hồ Kỳ Diệu, đọc giờ kim, sửa chữa xoay kim đồng hồ và sắp xếp lịch trình sinh hoạt để nhận Viên Ngọc Thời Gian. |
| **Gấu Logic (`gau_logic`)** | Nhân vật dẫn dắt tư duy quy luật | Đại diện cho tư duy trật tự thời gian, quy ước đo lường và định vị kim. Ngoại hình: Gấu nâu mặc áo măng tô thám tử, tay cầm đồng hồ quả quýt. Lời thoại tiêu biểu: *"Đồng hồ giúp mình biết bây giờ là lúc mấy giờ đấy!", "Cánh cửa đầu tiên đã mở rồi, giờ mình tự đọc đồng hồ nhé!", "Kim dài vẫn ở số 12 nhé! Còn kim ngắn chỉ số giờ yêu cầu!", "Khi kim phút chỉ số 6, mình đã đi qua nửa giờ rồi!", "Có chiếc là giờ tròn, có chiếc lại là giờ rưỡi đấy!", "Giỏi quá! Bé đã giúp Tháp Đồng Hồ hoạt động trở lại rồi!"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Nhân vật kích hoạt quan sát thị giác | Đại diện cho khả năng quan sát chi tiết (kim ngắn đỏ vs kim dài xanh), đối chiếu tranh sinh hoạt và động viên kiên trì. Ngoại hình: Thỏ trắng váy hồng, tay cầm kính lúp và bút chì vẽ kim. Lời thoại tiêu biểu: *"Bé nhìn kim giờ rồi điền thật chính xác nhé!", "Kim dài chỉ số 12, bé nhìn xem kim ngắn đang chỉ số mấy nào!", "Nhớ nhìn kim ngắn trước khi viết đáp án nhé!", "Vẽ thật ngay ngắn từ tâm đồng hồ nhé: Kim dài = phút, Kim ngắn = giờ!", "Lúc đó kim giờ sẽ nằm giữa hai số đấy nhé!", "Bé nhìn kim phút trước nhé: số 12 hay số 6?"*. |
| **Phụ huynh / Giáo viên** | Hỗ trợ ngoài màn hình | Hướng dẫn trẻ thực hành với mô hình đồng hồ kim đồ chơi bằng gỗ/bìa carton có thể xoay kim, liên hệ đồng hồ thực tế trong nhà và nhắc nhở thời gian biểu sinh hoạt. |
| **Content Seeder Engine** | Hệ thống nạp tự động | Chuyển hóa các `SkillLevelPlan[]` thành `ContentSeed` cho DB, xác thực qua `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-18/analysis.json (24 trang, WB18)
   │
   ├──> docs/montessori/dataset/activity-types-table.md
   │       └── Cập nhật WB18-D1, WB18-D2, WB18-D3 (Khẳng định dùng GT-016, GT-001, GT-005, GT-008; loại bỏ GT-055)
   │
   ├──> docs/specs/05-content/montessori-corpus-mapping.md
   │       └── Đồng bộ hàng Workbook 18 (C1.MEAS) và ghi nhận nạp 15 level Montessori cho C1.MEAS
   │
   └──> packages/content/src/skills/c1/meas/
           ├── C1.MEAS.13.ts (Đồng hồ: giờ đúng & giờ rưỡi -> GT-016, GT-001, GT-005: 9 levels)
           ├── C1.MEAS.12.ts (Buổi trong ngày: sáng · trưa · chiều · tối -> GT-001, GT-005: 3 levels)
           └── C1.MEAS.10.ts (Thời gian: trước/sau & Trình tự một ngày -> GT-008, GT-005: 3 levels)
```

---

## 4. Phân Tích Chi Tiết 3 Nhóm Hoạt Động & Ánh Xạ Game Engine Hiện Hữu

Toàn bộ 24 trang tài liệu PDF Chặng 18 được phân thành 3 nhóm hoạt động sư phạm chuẩn mực:

### 4.1 `WB18-D1`: Đọc Giờ Đồng Hồ Kim & Đối Chiếu Giờ Điện Tử (Trang 2, 3, 5, 6, 7–11, 17, 18–21)
- **Tên bài học**: *Đọc Đồng Hồ Giờ Đúng & Giờ Rưỡi* (Trang 1, 2, 4, 5, 6, 7, 8, 9, 10, 16, 17, 18, 19, 20 của sách).
- **Mục tiêu sư phạm**:
  - Nhận biết cấu tạo mặt đồng hồ tròn với 12 mốc số, phân biệt kim ngắn (giờ) và kim dài (phút).
  - Quy tắc giờ đúng: Kim dài luôn chỉ số 12, kim ngắn chỉ vào số nào thì đó là số giờ (ví dụ: kim ngắn chỉ 3, kim dài chỉ 12 $\rightarrow$ 3 giờ đúng hay 3:00).
  - Quy tắc giờ rưỡi: Kim dài chạy đến số 6 (nửa vòng quay, tương ứng 30 phút), kim ngắn di chuyển tới điểm chính giữa khoảng cách giữa hai số liên tiếp (ví dụ: 7:30 $\rightarrow$ kim dài chỉ 6, kim ngắn ở giữa 7 và 8).
  - Chiến lược tư duy quét mắt (Visual Scanning Strategy): Khi gặp đồng hồ hỗn hợp, trẻ rèn thói quen kiểm tra vị trí kim phút trước (số 12 hay số 6) để phân loại loại giờ, sau đó nhìn kim ngắn để đọc giá trị giờ.
- **Cơ chế tương tác số hóa (GT-016, GT-001, GT-005)**:
  - `GT-016` (`clock-face` chế độ `read`): Hiển thị mặt đồng hồ kim sắc nét với kim giờ đỏ/cam và kim phút xanh dương; bên dưới hiển thị 3 thẻ giờ điện tử HH:MM (1 đáp án đúng và 2 bẫy nhiễu). Trẻ chạm chọn thẻ giờ chính xác.
  - `GT-001` (`tap-select`): Trắc nghiệm chạm chọn 1 trong 3 đáp án giờ chữ hoặc số giờ (ví dụ: Đồng hồ 7:00 $\rightarrow$ chọn giữa "6 giờ", "7 giờ", "8 giờ").
  - `GT-005` (`pair-match`): Nối thẻ đồng hồ kim với thẻ giờ điện tử HH:00 tương ứng.
- **Kỹ năng liên kết**: `C1.MEAS.13` (Đồng hồ: giờ đúng), `C1.NREC.03`, `C3.DED.01`.

---

### 4.2 `WB18-D2`: Vẽ & Xoay Kim Đồng Hồ Theo Giờ Yêu Cầu (Trang 12–16, 22, 23)
- **Tên bài học**: *Xưởng Sửa Kim Đồng Hồ & Thử Thách Xoay Kim* (Trang 11, 12, 13, 14, 15, 21, 22 của sách).
- **Mục tiêu sư phạm**:
  - Chuyển hóa từ tri giác thụ động (đọc giờ) sang hành động chủ động (vẽ/xoay kim).
  - Đề bài cho mốc giờ điện tử bên dưới (ví dụ: 6:00, 9:00 hoặc 6:30, 7:30) trên mặt đồng hồ trống chỉ có các vạch số 1..12 và chấm tâm quay.
  - Trẻ điều khiển hai chiếc kim: kim phút dài và kim giờ ngắn xuất phát từ tâm quay đến đúng vị trí tương ứng.
  - Kiểm soát độ dài tương đối: Kim phút dài vươn tới vạch số (~85% bán kính), kim giờ ngắn dừng ở khoảng 60% bán kính.
  - Định vị góc quay giờ rưỡi: Kim phút hướng thẳng xuống số 6 (180°), kim giờ chỉ vào điểm giữa giữa hai số (ví dụ 6:30 $\rightarrow$ 195°, giữa 6 và 7).
- **Cơ chế tương tác số hóa (GT-016)**:
  - `GT-016` (`clock-face` chế độ `set`): Trên canvas tương tác 960x540, trẻ chạm vào đầu mút kim hoặc kéo xoay kim quanh tâm tròn. Hệ thống cung cấp góc quay mượt mà kèm cơ chế nam châm tự hút (Snap & Lock) vào các mốc 30° (vạch giờ) hoặc 15° (vạch nửa giờ giữa hai số).
  - Hỗ trợ thao tác chạm chạm (Tap-tap fallback): Chạm vào vạch số 12 để kim phút snap tới, chạm vào vạch số giờ để kim ngắn snap tới.
- **Kỹ năng liên kết**: `C1.MEAS.13`, `C2.ROT.01`, `C3.RULE.01`.

---

### 4.3 `WB18-D3`: Gắn Kết Thời Gian Với Hoạt Động & Suy Luận Lịch Trình Sinh Hoạt (Trang 2, 3, 4, 5, 6, 24)
- **Tên bài học**: *Một Ngày Của Bé — Sáng, Trưa Hay Tối?* (Trang 1, 2, 3, 4, 5, 23 của sách).
- **Mục tiêu sư phạm**:
  - Kết nối khái niệm thời gian trừu tượng với trải nghiệm sống thực tế của trẻ em qua 10 hoạt động sinh hoạt quen thuộc.
  - Phân biệt 4 buổi trong ngày (Sáng 🌅, Trưa ☀️, Chiều 🌇, Tối 🌙) và nhịp sinh hoạt tương ứng.
  - Suy luận loại trừ mốc thời gian phi lý (Temporal Plausibility Reasoning): Trẻ so sánh 2 đồng hồ đối chiếu và chọn mốc giờ hợp lý cho hoạt động (ví dụ: Ăn sáng lúc 7:00 hay 12:00? Ăn trưa lúc 11:00 hay 1:00 đêm?).
  - Nhận biết đồng hồ kim và chọn tranh sinh hoạt phù hợp nhất với thời điểm đó (ví dụ: Đồng hồ 17:00 $\rightarrow$ chọn Tắm bồn hoặc Tập thể thao ngoài trời; Đồng hồ 21:00 $\rightarrow$ chọn Đi ngủ).
- **Cơ chế tương tác số hóa (GT-005, GT-001, GT-008)**:
  - `GT-005` (`pair-match`): Nối tranh hoạt động (bên trái) với mặt đồng hồ kim và mốc giờ điện tử (bên phải).
  - `GT-001` (`tap-select`): Chạm chọn đồng hồ hợp lý trong 2 đồng hồ đối sánh; hoặc nhìn đồng hồ chạm chọn 1 trong 3 bức tranh sinh hoạt đúng.
  - `GT-008` (`drag-to-slot`): Kéo thả các thẻ hoạt động vào các ô mốc giờ trên thanh dòng thời gian Timeline 24 giờ.
  - `GT-000` (`concept-intro` & `celebration-summary`): Hoạt cảnh chào đón tại Cổng Tháp Thời Gian và Lễ vinh danh nhận Huy Hiệu Chinh Phục Chặng 18.
- **Kỹ năng liên kết**: `C1.MEAS.12` (Buổi trong ngày), `C1.MEAS.10` (Thời gian trước/sau), `C3.DED.01`, `C4.MAT.03`.

---

## 5. Thiết Kế SkillDataset Lấy Cảm Hứng Từ Tháp Đồng Hồ PDF

Bộ dữ liệu được thiết kế phong phú, ngôn ngữ thuần Việt trong sáng, hỗ trợ đa dạng chủng loại tài sản (emoji, nhãn chữ, thuộc tính giờ và buổi).

### 5.1 Kho Ngữ Liệu `C1_MEAS_13_DATASET` (Đồng Hồ Giờ Đúng & Giờ Rưỡi Tháp Thời Gian)
```typescript
export const C1_MEAS_13_CLOCK_ITEMS = [
  // --- Giờ Đúng (O'clock) ---
  {
    id: "clock_1_oclock",
    label: "1 giờ đúng",
    glyph: "1:00",
    image: { kind: "emoji", ref: "🕐" },
    category: { type: "oclock", hour: 1, minute: 0, period: "afternoon" },
    contrast_group: "oclock_hours",
    value: 1,
    ordering: 1,
  },
  {
    id: "clock_2_oclock",
    label: "2 giờ đúng",
    glyph: "2:00",
    image: { kind: "emoji", ref: "🕑" },
    category: { type: "oclock", hour: 2, minute: 0, period: "afternoon" },
    contrast_group: "oclock_hours",
    value: 2,
    ordering: 2,
  },
  {
    id: "clock_3_oclock",
    label: "3 giờ đúng",
    glyph: "3:00",
    image: { kind: "emoji", ref: "🕒" },
    category: { type: "oclock", hour: 3, minute: 0, period: "afternoon" },
    contrast_group: "oclock_hours",
    value: 3,
    ordering: 3,
  },
  {
    id: "clock_4_oclock",
    label: "4 giờ đúng",
    glyph: "4:00",
    image: { kind: "emoji", ref: "🕓" },
    category: { type: "oclock", hour: 4, minute: 0, period: "afternoon" },
    contrast_group: "oclock_hours",
    value: 4,
    ordering: 4,
  },
  {
    id: "clock_5_oclock",
    label: "5 giờ đúng",
    glyph: "5:00",
    image: { kind: "emoji", ref: "🕔" },
    category: { type: "oclock", hour: 5, minute: 0, period: "afternoon" },
    contrast_group: "oclock_hours",
    value: 5,
    ordering: 5,
  },
  {
    id: "clock_6_oclock",
    label: "6 giờ đúng",
    glyph: "6:00",
    image: { kind: "emoji", ref: "🕕" },
    category: { type: "oclock", hour: 6, minute: 0, period: "morning" },
    contrast_group: "oclock_hours",
    value: 6,
    ordering: 6,
  },
  {
    id: "clock_7_oclock",
    label: "7 giờ đúng",
    glyph: "7:00",
    image: { kind: "emoji", ref: "🕖" },
    category: { type: "oclock", hour: 7, minute: 0, period: "morning" },
    contrast_group: "oclock_hours",
    value: 7,
    ordering: 7,
  },
  {
    id: "clock_8_oclock",
    label: "8 giờ đúng",
    glyph: "8:00",
    image: { kind: "emoji", ref: "🕗" },
    category: { type: "oclock", hour: 8, minute: 0, period: "morning" },
    contrast_group: "oclock_hours",
    value: 8,
    ordering: 8,
  },
  {
    id: "clock_9_oclock",
    label: "9 giờ đúng",
    glyph: "9:00",
    image: { kind: "emoji", ref: "🕘" },
    category: { type: "oclock", hour: 9, minute: 0, period: "night" },
    contrast_group: "oclock_hours",
    value: 9,
    ordering: 9,
  },
  {
    id: "clock_10_oclock",
    label: "10 giờ đúng",
    glyph: "10:00",
    image: { kind: "emoji", ref: "🕙" },
    category: { type: "oclock", hour: 10, minute: 0, period: "morning" },
    contrast_group: "oclock_hours",
    value: 10,
    ordering: 10,
  },
  {
    id: "clock_11_oclock",
    label: "11 giờ đúng",
    glyph: "11:00",
    image: { kind: "emoji", ref: "🕚" },
    category: { type: "oclock", hour: 11, minute: 0, period: "noon" },
    contrast_group: "oclock_hours",
    value: 11,
    ordering: 11,
  },
  {
    id: "clock_12_oclock",
    label: "12 giờ đúng",
    glyph: "12:00",
    image: { kind: "emoji", ref: "🕛" },
    category: { type: "oclock", hour: 12, minute: 0, period: "noon" },
    contrast_group: "oclock_hours",
    value: 12,
    ordering: 12,
  },

  // --- Giờ Rưỡi (Half-past) ---
  {
    id: "clock_1_30",
    label: "1 giờ rưỡi",
    glyph: "1:30",
    image: { kind: "emoji", ref: "🕜" },
    category: { type: "half_past", hour: 1, minute: 30, period: "afternoon" },
    contrast_group: "half_past_hours",
    value: 13,
    ordering: 13,
  },
  {
    id: "clock_4_30",
    label: "4 giờ rưỡi",
    glyph: "4:30",
    image: { kind: "emoji", ref: "🕟" },
    category: { type: "half_past", hour: 4, minute: 30, period: "afternoon" },
    contrast_group: "half_past_hours",
    value: 14,
    ordering: 14,
  },
  {
    id: "clock_6_30",
    label: "6 giờ rưỡi",
    glyph: "6:30",
    image: { kind: "emoji", ref: "🕡" },
    category: { type: "half_past", hour: 6, minute: 30, period: "evening" },
    contrast_group: "half_past_hours",
    value: 15,
    ordering: 15,
  },
  {
    id: "clock_7_30",
    label: "7 giờ rưỡi",
    glyph: "7:30",
    image: { kind: "emoji", ref: "🕢" },
    category: { type: "half_past", hour: 7, minute: 30, period: "morning" },
    contrast_group: "half_past_hours",
    value: 16,
    ordering: 16,
  },
  {
    id: "clock_10_30",
    label: "10 giờ rưỡi",
    glyph: "10:30",
    image: { kind: "emoji", ref: "🕥" },
    category: { type: "half_past", hour: 10, minute: 30, period: "morning" },
    contrast_group: "half_past_hours",
    value: 17,
    ordering: 17,
  },
  {
    id: "clock_11_30",
    label: "11 giờ rưỡi",
    glyph: "11:30",
    image: { kind: "emoji", ref: "🕦" },
    category: { type: "half_past", hour: 11, minute: 30, period: "noon" },
    contrast_group: "half_past_hours",
    value: 18,
    ordering: 18,
  },

  // --- Vật Phẩm Thế Giới Tháp Đồng Hồ ---
  {
    id: "tower_gear_gold",
    label: "bánh răng tháp thời gian",
    glyph: "⚙️",
    image: { kind: "emoji", ref: "⚙️" },
    category: { type: "prop", role: "mechanism" },
    contrast_group: "tower_props",
    value: 20,
    ordering: 19,
  },
  {
    id: "tower_golden_key",
    label: "chìa khóa vàng mở cổng",
    glyph: "🗝️",
    image: { kind: "emoji", ref: "🗝️" },
    category: { type: "prop", role: "key" },
    contrast_group: "tower_props",
    value: 21,
    ordering: 20,
  },
  {
    id: "pocket_watch_detective",
    label: "đồng hồ quả quýt thám tử",
    glyph: "⏱️",
    image: { kind: "emoji", ref: "⏱️" },
    category: { type: "prop", role: "mascot_tool" },
    contrast_group: "tower_props",
    value: 22,
    ordering: 21,
  },
  {
    id: "magic_time_gem",
    label: "viên ngọc thời gian",
    glyph: "💎",
    image: { kind: "emoji", ref: "💎" },
    category: { type: "reward", role: "stage_gem" },
    contrast_group: "rewards",
    value: 100,
    ordering: 22,
  },
];
```

### 5.2 Kho Ngữ Liệu `C1_MEAS_12_DATASET` (Buổi Trong Ngày & Hoạt Động Của Bé)
```typescript
export const C1_MEAS_12_ROUTINE_ITEMS = [
  // --- 10 Hoạt Động Sinh Hoạt Trong Ngày ---
  {
    id: "routine_wake_up",
    label: "bé thức dậy vươn vai",
    glyph: "6:00",
    image: { kind: "emoji", ref: "🌅" },
    category: { type: "activity", period: "morning", default_hour: 6 },
    contrast_group: "daily_routines",
    value: 1,
    ordering: 1,
  },
  {
    id: "routine_brush_teeth",
    label: "bé đánh răng súc miệng",
    glyph: "7:00",
    image: { kind: "emoji", ref: "🪥" },
    category: { type: "activity", period: "morning", default_hour: 7 },
    contrast_group: "daily_routines",
    value: 2,
    ordering: 2,
  },
  {
    id: "routine_eat_breakfast",
    label: "bé ngồi ăn sáng",
    glyph: "8:00",
    image: { kind: "emoji", ref: "🥪" },
    category: { type: "activity", period: "morning", default_hour: 8 },
    contrast_group: "daily_routines",
    value: 3,
    ordering: 3,
  },
  {
    id: "routine_go_to_school",
    label: "bé đeo ba lô đi học",
    glyph: "7:00",
    image: { kind: "emoji", ref: "🏫" },
    category: { type: "activity", period: "morning", default_hour: 7 },
    contrast_group: "daily_routines",
    value: 4,
    ordering: 4,
  },
  {
    id: "routine_eat_lunch",
    label: "bé ăn trưa ngon miệng",
    glyph: "12:00",
    image: { kind: "emoji", ref: "🍲" },
    category: { type: "activity", period: "noon", default_hour: 12 },
    contrast_group: "daily_routines",
    value: 5,
    ordering: 5,
  },
  {
    id: "routine_play_sports",
    label: "bé đá bóng thể thao",
    glyph: "16:00",
    image: { kind: "emoji", ref: "⚽" },
    category: { type: "activity", period: "afternoon", default_hour: 16 },
    contrast_group: "daily_routines",
    value: 6,
    ordering: 6,
  },
  {
    id: "routine_take_bath",
    label: "bé tắm bọt xà phòng",
    glyph: "17:00",
    image: { kind: "emoji", ref: "🛁" },
    category: { type: "activity", period: "afternoon", default_hour: 17 },
    contrast_group: "daily_routines",
    value: 7,
    ordering: 7,
  },
  {
    id: "routine_eat_dinner",
    label: "bé ăn tối cùng gia đình",
    glyph: "18:00",
    image: { kind: "emoji", ref: "🍚" },
    category: { type: "activity", period: "evening", default_hour: 18 },
    contrast_group: "daily_routines",
    value: 8,
    ordering: 8,
  },
  {
    id: "routine_do_homework",
    label: "bé ngồi bàn làm bài",
    glyph: "20:00",
    image: { kind: "emoji", ref: "📖" },
    category: { type: "activity", period: "evening", default_hour: 20 },
    contrast_group: "daily_routines",
    value: 9,
    ordering: 9,
  },
  {
    id: "routine_go_to_sleep",
    label: "bé đi ngủ trăng sao",
    glyph: "21:00",
    image: { kind: "emoji", ref: "🌙" },
    category: { type: "activity", period: "night", default_hour: 21 },
    contrast_group: "daily_routines",
    value: 10,
    ordering: 10,
  },

  // --- Biểu Tượng 4 Buổi Trong Ngày ---
  {
    id: "period_morning_sun",
    label: "buổi sáng bình minh",
    glyph: "Sáng",
    image: { kind: "emoji", ref: "🌅" },
    category: { type: "period_badge", period: "morning" },
    contrast_group: "day_periods",
    value: 11,
    ordering: 11,
  },
  {
    id: "period_noon_sun",
    label: "buổi trưa nắng vàng",
    glyph: "Trưa",
    image: { kind: "emoji", ref: "☀️" },
    category: { type: "period_badge", period: "noon" },
    contrast_group: "day_periods",
    value: 12,
    ordering: 12,
  },
  {
    id: "period_afternoon_sky",
    label: "buổi chiều hoàng hôn",
    glyph: "Chiều",
    image: { kind: "emoji", ref: "🌇" },
    category: { type: "period_badge", period: "afternoon" },
    contrast_group: "day_periods",
    value: 13,
    ordering: 13,
  },
  {
    id: "period_night_moon",
    label: "buổi tối trăng sao",
    glyph: "Tối",
    image: { kind: "emoji", ref: "🌙" },
    category: { type: "period_badge", period: "night" },
    contrast_group: "day_periods",
    value: 14,
    ordering: 14,
  },
];
```

### 5.3 Phrasing Sư Phạm Chặng 18 (Tuân Thủ `BR-MCM-06`)
- **Prompt Templates**:
  - `GT-016` (Đọc giờ): *"Bé hãy xem đồng hồ chỉ mấy giờ nhé!"*
  - `GT-016` (Xoay kim giờ đúng): *"Kim dài ở số 12, bé hãy xoay kim ngắn đến đúng số giờ nhé!"*
  - `GT-016` (Xoay kim giờ rưỡi): *"Kim phút ở số 6, bé hãy xoay kim giờ đến giữa hai số nhé!"*
  - `GT-001` (Trắc nghiệm chọn giờ): *"Kim dài chỉ 12, bé nhìn xem kim ngắn đang chỉ số mấy nào!"*
  - `GT-001` (Chọn đồng hồ hợp lý): *"Bé hãy chọn chiếc đồng hồ có thời gian phù hợp với hoạt động nhé!"*
  - `GT-005` (Ghép cặp hoạt động & đồng hồ): *"Bé hãy nối đồng hồ với hoạt động đúng thời điểm nhé!"*
  - `GT-008` (Sắp xếp timeline): *"Bé hãy kéo hoạt động vào đúng mốc thời gian trong ngày nhé!"*
- **Narration Templates**:
  - *"Chào mừng bé đến với Tháp Đồng Hồ Kỳ Diệu cùng Gấu Logic và Thỏ Quan Sát!"*
  - *"Đúng rồi! Cỗ máy thời gian đang quay thêm một bánh răng nữa đấy!"*
  - *"Một cánh cửa thời gian vừa bật mở, bé thật tinh mắt!"*
  - *"Tháp Đồng Hồ đã chạy lại rực rỡ, chúng mình cùng nhận Huy Hiệu Chinh Phục Đồng Hồ nào!"*

---

## 6. Danh Mục `SkillLevelPlan[]` Chi Tiết

Toàn bộ 15 level Montessori thiết kế từ Chặng 18 tuân thủ nghiêm ngặt định dạng mã `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), gắn nhãn `montessori_ref: "WB18-D1"`, `"WB18-D2"`, `"WB18-D3"`, phân bổ `access_tier` đồng bộ với `difficulty` (1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`), và tuyệt đối không chứa từ khóa thương mại.

| Mã Level (`code`) | Template | Skill Code | Band | Diff | Access Tier | Montessori Ref | Tên Hoạt Động & Cấu Trúc Bài Toán Sư Phạm |
|---|---|---|:---:|:---:|---|---|---|
| `GL-C1-MEAS-CLK-0101` | `GT-016` | `C1.MEAS.13` | 5-6 | 1 | `free` | `WB18-D1` | **Làm Quen Đồng Hồ Giờ Đúng**: Đọc các mốc giờ quen thuộc (1:00 đến 6:00), kim phút cố định tại 12, chọn 1 trong 3 thẻ giờ điện tử. |
| `GL-C1-MEAS-TAP-0101` | `GT-001` | `C1.MEAS.13` | 5-6 | 2 | `login` | `WB18-D1` | **Mắt Tinh Xem Giờ Tròn**: Trắc nghiệm 3 phương án số giờ lân cận chênh nhau 1 tiếng (ví dụ: đồng hồ 7:00 $\rightarrow$ chọn giữa 6 giờ, 7 giờ, 8 giờ). |
| `GL-C1-MEAS-CLK-0102` | `GT-016` | `C1.MEAS.13` | 5-6 | 2 | `login` | `WB18-D1` | **Khám Phá 12 Mặt Số**: Đọc toàn bộ dải giờ đúng 1:00 đến 12:00 trên mặt đồng hồ viền màu pastel, rèn thói quen nhìn kim ngắn đỏ. |
| `GL-C1-MEAS-PAIR-0101` | `GT-005` | `C1.MEAS.13` | 5-6 | 2 | `login` | `WB18-D1` | **Nối Đồng Hồ Với Giờ Điện Tử**: Ghép cặp mặt đồng hồ kim tròn với thẻ số điện tử HH:00 tương ứng. |
| `GL-C1-MEAS-CLK-0103` | `GT-016` | `C1.MEAS.13` | 5-6 | 3 | `standard` | `WB18-D2` | **Xưởng Sửa Kim Giờ Đúng**: Tương tác kéo xoay kim ngắn đến đúng số giờ yêu cầu, kim dài khóa chặt tại vạch 12. |
| `GL-C1-MEAS-CLK-0104` | `GT-016` | `C1.MEAS.13` | 5-6 | 3 | `standard` | `WB18-D1` | **Bước Vào Giờ Rưỡi**: Đọc đồng hồ kim giờ rưỡi khi kim phút chỉ số 6 (nửa giờ :30), kim giờ nằm giữa 2 số (ví dụ: 7:30, 9:30). |
| `GL-C1-MEAS-CLK-0105` | `GT-016` | `C1.MEAS.13` | 5-6 | 4 | `premium` | `WB18-D1` | **Thám Tử Phân Biệt Giờ**: Đọc hỗn hợp giờ đúng vs giờ rưỡi, trẻ phải kiểm tra vị trí kim phút trước (12 hay 6) để giải mã bánh răng. |
| `GL-C1-MEAS-CLK-0106` | `GT-016` | `C1.MEAS.13` | 5-6 | 4 | `premium` | `WB18-D2` | **Thử Tài Đặt Kim Giờ Rưỡi**: Xoay kim phút về số 6 và kim giờ vào vị trí chính giữa hai con số liên tiếp theo giờ điện tử cho trước. |
| `GL-C1-MEAS-CLK-0107` | `GT-016` | `C1.MEAS.13` | 5-6 | 5 | `premium` | `WB18-D2` | **Đại Thử Thách Tháp Thời Gian**: Tự tay xoay đặt hoàn chỉnh cả hai kim cho các mốc giờ hỗn hợp không còn khung mẫu hướng dẫn. |
| `GL-C1-MEAS-TAP-0102` | `GT-001` | `C1.MEAS.12` | 4-5 | 2 | `login` | `WB18-D3` | **Sáng, Trưa Hay Tối?**: So sánh 2 đồng hồ và chạm chọn chiếc đồng hồ hợp lý cho hoạt động (ví dụ: Bé ăn sáng lúc 7:00 hay 12:00?). |
| `GL-C1-MEAS-PAIR-0102` | `GT-005` | `C1.MEAS.12` | 4-5 | 3 | `standard` | `WB18-D3` | **Một Ngày Của Bé**: Nối 4 tranh sinh hoạt thường nhật (thức dậy, ăn trưa, đá bóng, đi ngủ) với đồng hồ kim tương ứng. |
| `GL-C1-MEAS-TAP-0103` | `GT-001` | `C1.MEAS.12` | 5-6 | 3 | `standard` | `WB18-D3` | **Xem Đồng Hồ Chọn Hoạt Động**: Quan sát mặt đồng hồ kim chỉ mốc giờ và chọn 1 trong 3 bức tranh sinh hoạt phù hợp nhất. |
| `GL-C1-MEAS-SLOT-0101` | `GT-008` | `C1.MEAS.10` | 4-5 | 1 | `free` | `WB18-D3` | **Chuỗi Buổi Sáng Thức Dậy**: Kéo thả 3 thẻ sinh hoạt vào đúng thứ tự trước/sau: Thức dậy $\rightarrow$ Đánh răng $\rightarrow$ Ăn sáng. |
| `GL-C1-MEAS-PAIR-0103` | `GT-005` | `C1.MEAS.10` | 4-5 | 2 | `login` | `WB18-D3` | **Ghép Cặp Nhịp Sinh Học**: Nối tranh hoạt động với biểu tượng buổi trong ngày (Bình minh sáng, Nắng trưa, Trăng đêm). |
| `GL-C1-MEAS-SLOT-0102` | `GT-008` | `C1.MEAS.10` | 5-6 | 3 | `standard` | `WB18-D3` | **Lịch Trình Timeline Một Ngày**: Kéo thả các thẻ mốc giờ 6:00, 12:00, 17:00, 21:00 vào các chặng sinh hoạt trên dòng thời gian. |

---

## 7. Ma Trận Sư Phạm, Cân Bằng Hạn Ngạch & Kiểm Soát Lỗi Tự Thân

### 7.1 Phân Bổ Hạn Ngạch & Cân Bằng Competency C1
- **Hiện trạng hạn ngạch C1**:
  - Trần hạn ngạch toàn hệ thống của C1: 180 level (`MONTESSORI_QUOTA_LIMITS.C1 = 180`).
  - Phân bổ đợt này từ Chặng 18: **15 level Montessori** phân bổ khoa học vào 3 skill của `C1.MEAS`:
    - `C1.MEAS.13` (Đồng hồ: giờ đúng & giờ rưỡi): 9 levels (`GL-C1-MEAS-CLK-0101`, `GL-C1-MEAS-TAP-0101`, `GL-C1-MEAS-CLK-0102`, `GL-C1-MEAS-PAIR-0101`, `GL-C1-MEAS-CLK-0103`, `GL-C1-MEAS-CLK-0104`, `GL-C1-MEAS-CLK-0105`, `GL-C1-MEAS-CLK-0106`, `GL-C1-MEAS-CLK-0107`)
    - `C1.MEAS.12` (Buổi trong ngày: sáng · trưa · chiều · tối): 3 levels (`GL-C1-MEAS-TAP-0102`, `GL-C1-MEAS-PAIR-0102`, `GL-C1-MEAS-TAP-0103`)
    - `C1.MEAS.10` (Thời gian: trước/sau): 3 levels (`GL-C1-MEAS-SLOT-0101`, `GL-C1-MEAS-PAIR-0103`, `GL-C1-MEAS-SLOT-0102`)
  - Kết quả: Không làm vượt hạn ngạch C1 (tổng số level C1 vẫn nằm an toàn trong trần 180), đồng thời hoàn thiện dứt điểm trụ cột đo lường thời gian vốn đang thiếu hụt trầm trọng.

### 7.2 Kiểm Soát Lỗi Tự Thân (Control of Error)
1. **Phản hồi nhịp hổ phách (`amber_soft`) & Trôi về vị trí (`drift_back`)**:
   - Khi trẻ chạm chọn sai đáp án trắc nghiệm hoặc kéo thả sai vị trí thẻ, thẻ tương ứng rung nhẹ màu hổ phách và trôi êm về vị trí cũ. Tuyệt đối không có âm thanh buzzer, dấu chéo đỏ hay trừ điểm trừng phạt.
2. **Khóa khớp nam châm (Snap & Lock)**:
   - Trong `GT-016` (chế độ xoay kim), khi kim được kéo đến gần góc đích ($\pm 15^\circ$), kim tự động snap khớp vào vạch số với hiệu ứng lóe sáng vàng nhẹ (`gold_glow`) và âm thanh leng keng trong trẻo (`bell_soft`).
3. **Phản hồi hình ảnh trực quan đối chiếu**:
   - Khi đọc giờ sai, hệ thống highlight nhẹ kim phút để trẻ nhận ra kim đang ở số 12 hay số 6, giúp trẻ tự điều chỉnh nhận thức mà không cần người lớn can thiệp.

### 7.3 Thang Scaffolding 3 Bậc (Hỗ Trợ Tự Động Theo Thời Gian & Lần Thử)
- **Mức 1 (Nudge - Nhắc nhẹ / 10s hoặc 1 miss)**:
  - Nhấp nháy viền sáng nhẹ xung quanh kim phút (số 12 hoặc số 6) hoặc nhấp nháy viền ô kết quả cần chú ý.
- **Mức 2 (Guidance - Hướng dẫn / 18s hoặc 2 miss)**:
  - Giọng đọc Thỏ Quan Sát cất lên gợi ý: *"Kim dài đang chỉ số 12, bé nhìn xem kim ngắn màu đỏ đang chỉ số mấy nào!"* hoặc *"Giờ rưỡi thì kim phút luôn chỉ số 6 bé nhé!"*.
- **Mức 3 (Demo - Trình diễn / 25s hoặc 3 miss)**:
  - Bàn tay mờ (Ghost Hand) xuất hiện mô phỏng chuyển động xoay kim từ từ từ tâm quay đến đúng vị trí với tốc độ $0.5 \times$ để bé quan sát và làm theo.

---

## 8. Verification & Test Plan

1. **Kiểm tra cú pháp & Type Safety**:
   - Chạy `pnpm check`: Tuyệt đối 0 lỗi type, 0 `any`, 0 `unknown` trong các file seeder `C1.MEAS.13.ts`, `C1.MEAS.12.ts`, `C1.MEAS.10.ts`.
2. **Kiểm tra cổng dữ liệu Montessori (`montessori-gate`)**:
   - Chạy `pnpm --filter @mindkid/content-build test`:
     - Mọi mã level khớp regex `^GL-C[1-6]-[A-Z]{3,4}-[A-Z]{3,4}-01\d{2}$`.
     - `access_tier` khớp 100% với `difficulty` (`BR-MGL-12`): diff 1=`free`, diff 2=`login`, diff 3=`standard`, diff 4/5=`premium`.
     - Hạn ngạch C1 tuân thủ nghiêm ngặt (`MONTESSORI_QUOTA_LIMITS.C1 = 180`).
     - Tuyệt đối không chứa từ khóa thương mại IQ/Raven/trí tuệ (`BR-MCM-06`).
3. **Kiểm tra tương thích Projection Builders**:
   - Xác nhận `buildLevelsForSkill` sinh ra `ContentSeed` hợp lệ qua các builder `gt-016.ts`, `gt-001.ts`, `gt-005.ts`, `gt-008.ts`.
