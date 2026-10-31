---
spec: MONTESSORI-CHANG-15-SPEC
title: "Chặng 15: Thung Lũng Quy Luật — Quy Luật Chu Kỳ, Dãy Số Biến Đổi, Ma Trận 2x2 & Hình Học Phát Triển"
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-15
workbook_ref: WB15
gem_reward: "Viên Ngọc Quy Luật (Pattern Matrix Gem)"
owns:
  - Phân tích sư phạm và giải mã toàn diện 22 trang PDF Chặng 15 (Thung Lũng Quy Luật, WB15)
  - Ánh xạ 7 nhóm hoạt động (AG-01..AG-07 / WB15-D1..D3) vào các game engine hiện tại GT-000, GT-001, GT-006, GT-008, GT-011
  - TUYỆT ĐỐI KHÔNG TẠO MỚI GT-038+, hủy bỏ và thay thế hoàn toàn dự thảo GT-052 cũ
  - Khắc phục lỗ hổng 0 Montessori level của WB15-D2 và WB15-D3 thuộc strand C3.RULE trong packages/content
  - Thiết kế SkillDataset (items, relations, axes, ladder, phrasing) lấy cảm hứng từ thế giới quy luật kỳ diệu trong PDF 2026
  - Thiết kế SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101)
  - Kế hoạch phổ biến dữ liệu vào seeder packages/content/src/skills/c3/rule/, c3/mtx/, c1/pat/
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 15: Thung Lũng Quy Luật — Quy Luật Chu Kỳ, Dãy Số Biến Đổi, Ma Trận 2x2 & Hình Học Phát Triển

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này xác lập đặc tả kỹ thuật và kiến trúc nội dung sư phạm nhằm chuyển thể trọn vẹn dữ liệu từ tài liệu PDF **"Chặng 15: Thung Lũng Quy Luật — Cùng Bé Tìm Quy Luật"** (`docs/montessori/extracted/chang-15/analysis.json`, nguồn: *WB15*, 22 trang, bộ giáo trình *Gấu Logic & Thỏ Quan Sát - Chuyến Tàu Toán Học*, Nhà xuất bản Dân Trí / Montessori VN) vào nền tảng **TiniMath v2**.

### 1.1 Mục Tiêu Chiến Lược & Bối Cảnh Cốt Truyện (Narrative Quest)
1. **Bối cảnh cốt truyện**: Chuyến Tàu Toán Học đưa Gấu Logic và Thỏ Quan Sát đến với **Thung Lũng Quy Luật** — một thung lũng bí ẩn nơi mọi loài hoa quả, con đường sỏi đá, đoàn tàu và hàng rào đều vận hành theo những trật tự toán học nhiệm màu. Để mở cánh cổng đá cổ thụ bước tiếp sang Chặng 16, bé phải giải mã các quy luật chu kỳ, con đường số nhảy đều, bông hoa số cân bằng, ma trận ô vuông và mô hình điểm chấm lớn dần.
2. **Nhiệm vụ học tập (Learning Quest)**:
   - Nhận diện đơn vị lặp cơ sở (core unit) của các chuỗi chu kỳ $AB, AAB, ABB, ABC$ trên các đối tượng cụ thể (hoa quả, muông thú, hình học màu sắc).
   - Khám phá quy luật biến thiên dãy số: đếm cách đều ($+2, -2, +3, +5, -5, +10$), dãy gia số tăng dần ($+1, +2, +3...$), dãy số Fibonacci và dãy số chính phương.
   - Giải mã dãy số đôi xen kẽ (Interleaved Sequences) và mô hình bông hoa số không gian đối xứng (Tổng hai cánh đối diện = Số ở nhụy).
   - Phân tích ma trận hai chiều $2 \times 2$ và giải hệ ẩn số đại số sớm ($A$ và $B$).
   - Kết nối hình học không gian và số học qua mô hình điểm chấm phát triển (Growing Dot Patterns).
   - Thu thập 6 ký tự mật mã `[B, A, A, A, B, C]` tương ứng `[Lê, 10, 7, 4, 11, 16]` tại Đại Thử Thách Cánh Cổng để đoạt **Viên Ngọc Quy Luật** (Pattern Matrix Gem).

### 1.2 Nguyên Tắc Bất Biến Về Công Nghệ & Phạm Vi
1. **Tuyệt Đối Không Tạo Game Engine Mới (`GT-038+`)**:
   - Toàn bộ cơ chế tư duy quy luật của Chặng 15 được phân bổ 100% vào các game engine hiện hành trong hệ thống:
     - `GT-001` (`tap-select`): Trắc nghiệm chạm chọn đáp án nhanh 1 trong 3 phương án (chọn hình/số tiếp theo, trắc nghiệm ẩn số ma trận, giải mã ô khóa).
     - `GT-006` (`sequence-order`): Kéo thả phần tử vào vị trí khuyết cuối chuỗi quy luật lặp 1D, xếp toa xe lửa, bước nhảy trên đá sỏi, bậc thang gia số tăng dần.
     - `GT-011` (`matrix-pick`): Giải mã ma trận $2 \times 2$ hai chiều (chọn hình/số phù hợp đồng thời cả hàng ngang và cột dọc).
     - `GT-008` (`drag-to-slot`): Kéo thẻ số vào cánh hoa khuyết (mô hình bông hoa số cân bằng tổng) và các ô khuyết của đoàn tàu số đôi.
     - `GT-000` (`concept-intro` & `celebration-summary`): Hoạt cảnh giới thiệu Cánh Cổng Thung Lũng (Trang 1) và màn đại lễ mở cổng chiến thắng trao Viên Ngọc Quy Luật (Trang 22).
   - **Hủy bỏ hoàn toàn dự thảo `GT-052` cũ**: Dự thảo `GT-052` trong các bản nháp trước đây bị **hủy bỏ hoàn toàn**. Việc tạo `GT-052` vi phạm nguyên tắc bảo toàn hệ thống engine (`GT-000`..`GT-037`), làm phân mảnh logic canvas. Các bài toán quy luật được chuyển hóa xuất sắc vào `GT-001`, `GT-006`, `GT-011` và `GT-008`.

2. **Khắc Phục Điểm Nghẽn Sư Phạm `WB15-D2` & `WB15-D3` Thuộc `C3.RULE`**:
   - Theo thống kê từ `montessori-corpus-mapping.md` (Mục 7.9) và database seeder:
     - Competency **C1** đã chạm trần 36 level Montessori.
     - Competency **C3** có hạn ngạch 15 level Montessori nhưng hiện có **0 level** được nạp!
     - Dạng bài `WB15-D2` (*Quy luật ma trận $2 \times 2$*) và `WB15-D3` (*Điền phần tử khuyết vào ma trận quy luật*) thuộc strand `C3.RULE` đang có **0 Montessori levels** trong toàn bộ database seeder!
   - Tài liệu này mở khóa trực tiếp việc nạp dữ liệu cho `C3.RULE.01` (*Dãy số tăng giảm đều & Ma trận 2x2 cơ bản*), `C3.RULE.02` (*Gia số tăng dần, Bông hoa số & Điểm chấm phát triển*), `C3.RULE.03` (*Dãy số đôi xen kẽ*), đồng thời làm giàu kho ngữ liệu `C1.PAT.01..04` mà không làm vượt trần hạn ngạch.

3. **Tuân Thủ Bộ Quy Tắc Doanh Nghiệp & Sư Phạm**:
   - `BR-MCM-06`: Tuyệt đối không chứa từ khóa thương mại, bài kiểm tra tâm lý hoặc tuyên bố đo lường chỉ số trí tuệ (IQ, Raven, WISC).
   - `BR-MGL-02`: Mọi mã level Montessori thuộc khối dành riêng từ `0101` trở lên: `GL-<COMP>-<STRAND>-<MECH>-01xx`.
   - `BR-MGL-03` & `BR-MGL-04`: Mỗi dạng bài có ít nhất 2 level khác độ khó, tăng lũy tiến một chiều (cô lập thuộc tính theo `BR-MCM-13`).
   - `BR-MGL-12`: Cấp bậc truy cập (`access_tier`) đồng bộ chặt chẽ với độ khó (`difficulty`: 1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`).
   - `BR-MCM-14` & `BR-MCM-15`: Giữ trọn vẹn kiểm soát lỗi tự thân (Control of Error) và trình tự cụ thể đến trừu tượng (CPA).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò kỹ thuật | Vai trò sư phạm & Đặc điểm thể hiện trong Chặng 15 |
|---|---|---|
| **Bé (Kid Player)** | Người chơi trung tâm (5–6 tuổi) | Nhập vai nhà thám hiểm nhí cùng Chuyến Tàu Toán Học, trực tiếp kéo thả quả/hoa/thú vào chuỗi chu kỳ, điền số trên bậc thang đá, cân bằng cánh hoa số, giải mã ma trận 2x2 và mở khóa 6 ổ mật mã. |
| **Gấu Logic (`gau_logic`)** | Nhân vật dẫn dắt tư duy trừu tượng | Đại diện cho tư duy trật tự, công thức toán học và suy luận hệ thống. Ngoại hình: Gấu nâu đeo kính tròn, cầm kính lúp và Sổ tay quy luật. Lời thoại mẫu: *"Các hình đang lặp lại theo thứ tự đấy!", "Hai hình giống nhau rồi đến một hình khác!", "Các số đang tăng hoặc giảm đều đấy!", "Số ở giữa = tổng hai cánh đối diện!", "Sang phải và đi xuống luôn theo cùng một mức thay đổi!"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Nhân vật kích hoạt trực giác giác quan | Đại diện cho quan sát trực quan, nhạy bén phát hiện nhịp điệu và kiểm chứng chi tiết. Ngoại hình: Thỏ trắng đeo túi chéo vàng, giơ tay cổ vũ nhiệt tình. Lời thoại mẫu: *"Bé hãy tìm hình xuất hiện tiếp theo nhé!", "Nhớ đủ ba bạn rồi chọn hình nhé!", "Mỗi lần dãy số tăng nhiều hơn một chút!", "Quan sát thật kỹ, tìm ra A và B nhé!", "Giải 6 mật mã để mở cánh cổng nào!"*. |
| **Phụ huynh / Giáo viên** | Hỗ trợ ngoài màn hình | Hướng dẫn trẻ quan sát nhịp điệu đời sống (tiếng vỗ tay, nhịp bước chân, ngày và đêm), sử dụng hột hạt hoặc que tính xếp hình học điểm chấm ngoài đời thực theo phương pháp Montessori. |
| **Hệ thống Seeder** | Nạp dữ liệu tự động | Chuyển hóa các `SkillLevelPlan[]` thành `ContentSeed` cho DB, xác thực qua `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-15/analysis.json (22 trang)
   │
   ├──> docs/montessori/dataset/activity-types-table.md
   │       └── Cập nhật WB15-D1, WB15-D2, WB15-D3 (Khẳng định dùng GT-006, GT-001, GT-011, GT-008; loại bỏ GT-052)
   │
   ├──> docs/specs/05-content/montessori-corpus-mapping.md
   │       └── Đồng bộ hàng Workbook 15 (C3.RULE · C1.PAT) và ghi nhận nạp level cho C3.RULE
   │
   ├──> packages/content/src/skills/c3/rule/
   │       ├── C3.RULE.01.ts (Bước nhảy cố định & Ma trận 2x2 -> GT-001: GL-C3-RULE-CARD-0103; GT-011: GL-C3-RULE-MATRX-0101..0102)
   │       ├── C3.RULE.02.ts (Gia số tăng dần, Bông hoa số & Điểm chấm -> GT-006: GL-C3-RULE-ORD-0103; GT-008: GL-C3-RULE-SLOT-0121; GT-001: GL-C3-RULE-CARD-0104; GT-011: GL-C3-RULE-MATRX-0103)
   │       └── C3.RULE.03.ts (Dãy số đôi xen kẽ & Boss Door -> GT-006: GL-C3-RULE-ORD-0104; GT-008: GL-C3-RULE-SLOT-0122; GT-001: GL-C3-RULE-CARD-0105..0106)
   │
   └──> packages/content/src/skills/c1/pat/
           ├── C1.PAT.01.ts (Quy luật AB -> GT-006: GL-C1-PAT-ORD-0101; GT-001: GL-C1-PAT-CARD-0101)
           ├── C1.PAT.02.ts (Quy luật ABB -> GT-001: GL-C1-PAT-CARD-0102)
           ├── C1.PAT.03.ts (Quy luật AAB -> GT-001: GL-C1-PAT-CARD-0103)
           └── C1.PAT.04.ts (Quy luật ABC & Hình học màu sắc -> GT-006: GL-C1-PAT-ORD-0102; GT-001: GL-C1-PAT-CARD-0104)
```

---

## 4. Phân Tích 7 Nhóm Hoạt Động & Ánh Xạ Game Engine Hiện Hữu

Toàn bộ 22 trang tài liệu PDF Chặng 15 được phân bổ vào 7 nhóm hoạt động sư phạm mạch lạc:

### 4.1 `WB15-D1`: Quy Luật Lặp Chu Kỳ 1 Chiều AB, AAB, ABB, ABC (Trang 2–11, Trang 21, 22)
- **Tên bài học**: *Cánh Cổng AB, Hai Hình Thay Phiên, Quy Luật AAB & ABB, Khu Vườn Hoa Bí Mật, Quầy Trái Cây Kỳ Lạ, Đoàn Thú Nối Đuôi, Ba Người Bạn Luân Phiên, Mật Mã Hình Học*.
- **Vị trí PDF**: Trang 2 đến Trang 11 (Workbook trang 1 đến 10); Trang 21 (Manh mối 1); Trang 22 (Ổ khóa 1).
- **Mục tiêu sư phạm**:
  - Trẻ nhận diện cấu trúc lõi (unit of repeat: $[A, B]$, $[A, A, B]$, $[A, B, B]$, $[A, B, C]$).
  - Phân tách và phối hợp các chiều thuộc tính: loại vật thể (trái cây, hoa, động vật), màu sắc và hình dạng hình học 2D.
  - Dự đoán chính xác phần tử tiếp theo ở đuôi chuỗi hoặc điền vào ô trống giữa chuỗi.
- **Cơ chế tương tác số hóa (GT-006 & GT-001)**:
  - `GT-006` (`sequence-order`): Hiển thị ray trượt mang chuỗi vật phẩm có 1 ô slot trống ở cuối. Khay chọn bên dưới chứa 2–3 quân cờ để trẻ kéo thả vào vị trí khuyết.
  - `GT-001` (`tap-select`): Hiển thị chuỗi quy luật kèm dấu hỏi chấm $[?]$. Trẻ chạm chọn 1 trong 3 đáp án chia bởi dấu gạch chéo (/), hỗ trợ phản hồi nhanh.
- **Kỹ năng liên kết**: `C1.PAT.01`, `C1.PAT.02`, `C1.PAT.03`, `C1.PAT.04`.

---

### 4.2 `WB15-D2` (Phần 1): Dãy Số Tăng/Giảm Đều & Bước Nhảy Cố Định (Trang 12, Trang 21, 22)
- **Tên bài học**: *Con Đường Số Nhảy Đều*.
- **Vị trí PDF**: Trang 12 (Workbook trang 11); Trang 21 (Manh mối 2a, 2c); Trang 22 (Ổ khóa 2).
- **Mục tiêu sư phạm**:
  - Trẻ phân tích khoảng cách cố định giữa các số liên tiếp (bước nhảy cộng đều: $+2, +3, +5, +10$; bước nhảy trừ đều: $-2, -3, -5$).
  - Nhận biết thứ tự số chẵn ($2, 4, 6, 8, 10...$) và số lẻ ($1, 3, 5, 7, 9...$).
  - Nền tảng tư duy phép nhân (đếm nhảy cóc / skip counting) và trục số.
- **Cơ chế tương tác số hóa (GT-001 & GT-006)**:
  - `GT-001` (`tap-select`): Trắc nghiệm 3 lựa chọn chọn số điền vào phiến đá cuối đường đi.
  - `GT-006` (`sequence-order`): Sắp xếp các viên đá số trên đường ray sỏi đá theo thứ tự bước nhảy.
- **Kỹ năng liên kết**: `C3.RULE.01`.

---

### 4.3 `WB15-D2` (Phần 2): Dãy Số Gia Số Biến Đổi & Bậc Thang Tăng Dần (Trang 13–14, Trang 21)
- **Tên bài học**: *Bậc Thang Tăng Dần & Bậc Thang Khó Hơn*.
- **Vị trí PDF**: Trang 13 (Workbook trang 12); Trang 14 (Workbook trang 13); Trang 21 (Manh mối 2b).
- **Mục tiêu sư phạm**:
  - Quy luật cấp hai (Second-order sequences): Khoảng cách giữa các số không cố định mà tăng dần đều ($+1, +2, +3, +4, +5...$), tăng theo số chẵn ($+2, +4, +6...$), số lẻ ($+1, +3, +5...$), hoặc bội của 3 ($+3, +6, +9...$).
  - Tiếp cận các dãy số toán học tinh hoa: Dãy số Fibonacci ($1, 2, 3, 5, 8, 13, 21...$ — số sau bằng tổng hai số trước) và Dãy số chính phương ($1, 4, 9, 16, 25, 36...$ — diện tích hình vuông $n \times n$).
- **Cơ chế tương tác số hóa (GT-006 & GT-001)**:
  - `GT-006` (`sequence-order`): Kéo các khối đá bậc thang gắn vào nấc thang tiếp theo để Gấu leo lên đỉnh núi.
  - `GT-001` (`tap-select`): Chạm chọn số đúng từ 3 biển gỗ gợi ý $A, B, C$.
- **Kỹ năng liên kết**: `C3.RULE.02`.

---

### 4.4 `WB15-D3` (Phần 1): Dãy Số Xen Kẽ / Dãy Số Đôi (Trang 15–16, Trang 21, 22)
- **Tên bài học**: *Dãy Số Đôi & Hai Đoàn Tàu Số*.
- **Vị trí PDF**: Trang 15 (Workbook trang 14); Trang 16 (Workbook trang 15); Trang 21 (Manh mối 3); Trang 22 (Ổ khóa 3).
- **Mục tiêu sư phạm**:
  - Tư duy đa luồng (Multi-stream thinking): Tách một chuỗi số thành 2 dãy số độc lập đan xen ở vị trí lẻ và chẵn (Ví dụ: vị trí lẻ tăng 2, vị trí chẵn giảm 2; hoặc xen kẽ giữa cấp số cộng và cấp số nhân).
  - Rèn luyện kiểm soát ức chế (inhibitory control) để bỏ qua phần tử chen ngang.
- **Cơ chế tương tác số hóa (GT-006 & GT-008)**:
  - `GT-006` (`sequence-order`): Kéo thả 2 toa tàu (màu vàng và màu xanh) ghép vào đuôi đoàn tàu hỏa hơi nước.
  - `GT-008` (`drag-to-slot`): 2 slot trống chờ nhận cặp giá trị số tương ứng $[x, y]$.
- **Kỹ năng liên kết**: `C3.RULE.03`.

---

### 4.5 `WB15-D3` (Phần 2): Quy Luật Bông Hoa Số Không Gian Đối Xứng (Trang 17, Trang 21, 22)
- **Tên bài học**: *Bông Hoa Số Bí Mật*.
- **Vị trí PDF**: Trang 17 (Workbook trang 16); Trang 21 (Manh mối 4b); Trang 22 (Ổ khóa 4).
- **Mục tiêu sư phạm**:
  - Tư duy quan hệ không gian đối xứng (Spatial Relational Thinking): Mô hình bông hoa 4 cánh (Trên, Dưới, Trái, Phải) và nhụy ở giữa.
  - Quy tắc bảo toàn tổng: $\text{Trên} + \text{Dưới} = \text{Nhụy}$ và $\text{Trái} + \text{Phải} = \text{Nhụy}$.
  - Trẻ tìm số còn thiếu ở một cánh hoa hoặc suy luận số ở nhụy hoa.
- **Cơ chế tương tác số hóa (GT-008 & GT-001)**:
  - `GT-008` (`drag-to-slot`): Bông hoa hiển thị với 1 cánh hoa mang ô slot nét đứt. Trẻ kéo số từ các chú bướm bay quanh thả vào cánh hoa.
  - `GT-001` (`tap-select`): Chạm chọn số đúng từ 3 cánh bướm mang số.
- **Kỹ năng liên kết**: `C3.RULE.02`.

---

### 4.6 `WB15-D2` & `WB15-D3` (Phần 3): Ma Trận 2x2 & Hệ Ẩn Số Đại Số Sớm (Trang 18–19, Trang 21, 22)
- **Tên bài học**: *Ô Vuông Phép Thuật & Tìm A và B*.
- **Vị trí PDF**: Trang 18 (Workbook trang 17); Trang 19 (Workbook trang 18); Trang 21 (Manh mối 4a, 4c); Trang 22 (Ổ khóa 5).
- **Mục tiêu sư phạm**:
  - Tư duy ma trận 2 chiều (2x2 Matrix Logic): Hiểu quan hệ biến thiên số học đồng thời theo hàng ngang ($\Delta x$) và cột dọc ($\Delta y$).
  - Nhận diện quy luật tịnh tiến giữa các ô ma trận liên tiếp (mỗi ô $+k$).
  - Giải tìm cặp ẩn số $A$ và $B$ trong lưới ma trận, đặt nền móng cho tư duy phương trình và đại số sớm.
- **Cơ chế tương tác số hóa (GT-011 & GT-001)**:
  - `GT-011` (`matrix-pick`): Hiển thị lưới ma trận $2 \times 2$ với 1 ô khuyết tại góc dưới phải. Trẻ phân tích hàng ngang và cột dọc rồi chạm chọn ô số chính xác từ bảng gợi ý 4 lựa chọn.
  - `GT-001` (`tap-select`): Chọn cặp nghiệm $(A, B)$ từ 3 phương án gợi ý của Thỏ Quan Sát.
- **Kỹ năng liên kết**: `C3.RULE.01`, `C3.RULE.02`.

---

### 4.7 Mở Rộng: Hình Học Điểm Chấm Phát Triển & Đại Thử Thách Mở Cổng (Trang 20–22)
- **Tên bài học**: *Hàng Rào Lớn Dần & Mật Mã Mở Cánh Cổng*.
- **Vị trí PDF**: Trang 20 (Workbook trang 20); Trang 21, 22 (Workbook trang 21, 22).
- **Mục tiêu sư phạm**:
  - Quy luật hình học điểm chấm phát triển (Growing Geometric Dot Patterns): Đếm số hạt chấm tròn phát triển theo cấu trúc hình học (đoạn thẳng $+2$, góc L $+2$, rãnh U $+4$, dấu cộng $+4$, viền vuông $+4$, viền tam giác $+3$).
  - Tổng kết toàn bộ năng lực tư duy quy luật của chặng qua bài thi mở khóa 6 ổ mật mã `[B, A, A, A, B, C]` để mở Cánh Cổng Thung Lũng Quy Luật.
- **Cơ chế tương tác số hóa (GT-001 & GT-000)**:
  - `GT-001` (`tap-select`): Chạm chọn số lượng chấm của hình tiếp theo và giải từng bước trong 6 ổ khóa mật mã.
  - `GT-000` (`concept-intro` & `celebration`): Khi đủ 6 viên đá mật mã, cánh cổng đá thần phủ dây leo mở toang với luồng ánh sáng rực rỡ và pháo hoa ăn mừng, trao Viên Ngọc Quy Luật.
- **Kỹ năng liên kết**: `C3.RULE.02`, `C3.RULE.03`.

---

## 5. Thiết Kế SkillDataset Mở Rộng

### 5.1 Kho Ngữ Liệu `C1_PAT_DATASET` (Quy Luật Chu Kỳ Trái Cây, Hoa Cỏ, Muông Thú & Hình Học)
```typescript
export const C1_PAT_VALLEY_ITEMS = [
  // Trái cây tươi ngon
  { id: "apple_red", label: "quả táo đỏ", image: { kind: "emoji", ref: "🍎" }, category: { type: "fruit", color: "red" }, contrast_group: "fruits", value: 1, ordering: 1 },
  { id: "pear_green", label: "quả lê xanh", image: { kind: "emoji", ref: "🍐" }, category: { type: "fruit", color: "green" }, contrast_group: "fruits", value: 2, ordering: 2 },
  { id: "orange_round", label: "quả cam tròn", image: { kind: "emoji", ref: "🍊" }, category: { type: "fruit", color: "orange" }, contrast_group: "fruits", value: 3, ordering: 3 },
  { id: "strawberry", label: "quả dâu tây", image: { kind: "emoji", ref: "🍓" }, category: { type: "fruit", color: "red" }, contrast_group: "fruits", value: 4, ordering: 4 },
  { id: "banana_yellow", label: "quả chuối vàng", image: { kind: "emoji", ref: "🍌" }, category: { type: "fruit", color: "yellow" }, contrast_group: "fruits", value: 5, ordering: 5 },
  { id: "grape_purple", label: "chùm nho tím", image: { kind: "emoji", ref: "🍇" }, category: { type: "fruit", color: "purple" }, contrast_group: "fruits", value: 6, ordering: 6 },
  { id: "watermelon", label: "miếng dưa hấu", image: { kind: "emoji", ref: "🍉" }, category: { type: "fruit", color: "green" }, contrast_group: "fruits", value: 7, ordering: 7 },

  // Hoa cỏ thung lũng
  { id: "flower_rose", label: "bông hoa hồng", image: { kind: "emoji", ref: "🌹" }, category: { type: "flower", color: "red" }, contrast_group: "flowers", value: 8, ordering: 8 },
  { id: "flower_sunflower", label: "hoa hướng dương", image: { kind: "emoji", ref: "🌻" }, category: { type: "flower", color: "yellow" }, contrast_group: "flowers", value: 9, ordering: 9 },
  { id: "flower_tulip", label: "hoa tulip hồng", image: { kind: "emoji", ref: "🌷" }, category: { type: "flower", color: "pink" }, contrast_group: "flowers", value: 10, ordering: 10 },
  { id: "flower_daisy", label: "hoa cúc trắng", image: { kind: "emoji", ref: "🌼" }, category: { type: "flower", color: "white" }, contrast_group: "flowers", value: 11, ordering: 11 },

  // Bạn thú rừng xanh
  { id: "bear_brown", label: "chú gấu nâu", image: { kind: "emoji", ref: "🐻" }, category: { type: "animal", role: "logic" }, contrast_group: "animals", value: 12, ordering: 12 },
  { id: "rabbit_white", label: "chú thỏ trắng", image: { kind: "emoji", ref: "🐰" }, category: { type: "animal", role: "observer" }, contrast_group: "animals", value: 13, ordering: 13 },
  { id: "fox_orange", label: "chú cáo cam", image: { kind: "emoji", ref: "🦊" }, category: { type: "animal", role: "friend" }, contrast_group: "animals", value: 14, ordering: 14 },
  { id: "puppy_cute", label: "chú chó con", image: { kind: "emoji", ref: "🐶" }, category: { type: "animal", role: "friend" }, contrast_group: "animals", value: 15, ordering: 15 },
  { id: "kitten_sweet", label: "mèo con xinh", image: { kind: "emoji", ref: "🐱" }, category: { type: "animal", role: "friend" }, contrast_group: "animals", value: 16, ordering: 16 },

  // Hình học & màu sắc
  { id: "geo_circle_blue", label: "hình tròn xanh", image: { kind: "emoji", ref: "🔵" }, category: { type: "shape", shape: "circle", color: "blue" }, contrast_group: "shapes", value: 17, ordering: 17 },
  { id: "geo_square_red", label: "hình vuông đỏ", image: { kind: "emoji", ref: "🟥" }, category: { type: "shape", shape: "square", color: "red" }, contrast_group: "shapes", value: 18, ordering: 18 },
  { id: "geo_triangle_yellow", label: "tam giác vàng", image: { kind: "emoji", ref: "🔺" }, category: { type: "shape", shape: "triangle", color: "yellow" }, contrast_group: "shapes", value: 19, ordering: 19 },
  { id: "geo_star_yellow", label: "ngôi sao vàng", image: { kind: "emoji", ref: "⭐" }, category: { type: "shape", shape: "star", color: "yellow" }, contrast_group: "shapes", value: 20, ordering: 20 },
];
```

### 5.2 Kho Ngữ Liệu `C3_RULE_01_DATASET` (Dãy Số Bước Nhảy Cố Định & Ma Trận 2x2)
```typescript
export const C3_RULE_01_VALLEY_ITEMS = [
  { id: "stone_step_2", label: "phiến đá số 2", image: { kind: "emoji", ref: "🪨" }, category: { type: "stone", step: 2 }, contrast_group: "stones", value: 2, ordering: 1 },
  { id: "stone_step_4", label: "phiến đá số 4", image: { kind: "emoji", ref: "🪨" }, category: { type: "stone", step: 2 }, contrast_group: "stones", value: 4, ordering: 2 },
  { id: "stone_step_6", label: "phiến đá số 6", image: { kind: "emoji", ref: "🪨" }, category: { type: "stone", step: 2 }, contrast_group: "stones", value: 6, ordering: 3 },
  { id: "stone_step_8", label: "phiến đá số 8", image: { kind: "emoji", ref: "🪨" }, category: { type: "stone", step: 2 }, contrast_group: "stones", value: 8, ordering: 4 },
  { id: "stone_step_10", label: "phiến đá số 10", image: { kind: "emoji", ref: "🪨" }, category: { type: "stone", step: 2 }, contrast_group: "stones", value: 10, ordering: 5 },
  { id: "matrix_grid_orange", label: "lưới ma trận cam 2x2", image: { kind: "emoji", ref: "🔲" }, category: { type: "matrix", grid: "2x2" }, contrast_group: "matrices", value: 1, ordering: 6 },
  { id: "matrix_grid_blue", label: "lưới ma trận xanh 2x2", image: { kind: "emoji", ref: "🟦" }, category: { type: "matrix", grid: "2x2" }, contrast_group: "matrices", value: 2, ordering: 7 },
  { id: "gate_lock_gem", label: "viên ngọc quy luật", image: { kind: "emoji", ref: "💎" }, category: { type: "gem", state: "locked" }, contrast_group: "rewards", value: 100, ordering: 8 },
];
```

### 5.3 Kho Ngữ Liệu `C3_RULE_02_DATASET` (Gia Số Tăng Dần, Bông Hoa Số & Điểm Chấm)
```typescript
export const C3_RULE_02_VALLEY_ITEMS = [
  { id: "flower_center_8", label: "nhụy hoa số 8", image: { kind: "emoji", ref: "🌼" }, category: { type: "flower_part", part: "center" }, contrast_group: "flowers", value: 8, ordering: 1 },
  { id: "flower_petal_top_3", label: "cánh hoa trên 3", image: { kind: "emoji", ref: "🌸" }, category: { type: "flower_part", part: "petal" }, contrast_group: "flowers", value: 3, ordering: 2 },
  { id: "flower_petal_bottom_5", label: "cánh hoa dưới 5", image: { kind: "emoji", ref: "🌸" }, category: { type: "flower_part", part: "petal" }, contrast_group: "flowers", value: 5, ordering: 3 },
  { id: "flower_petal_left_4", label: "cánh hoa trái 4", image: { kind: "emoji", ref: "🌸" }, category: { type: "flower_part", part: "petal" }, contrast_group: "flowers", value: 4, ordering: 4 },
  { id: "flower_petal_right_4", label: "cánh hoa phải 4", image: { kind: "emoji", ref: "🌸" }, category: { type: "flower_part", part: "petal" }, contrast_group: "flowers", value: 4, ordering: 5 },
  { id: "growing_dots_line", label: "chuỗi hạt hàng ngang", image: { kind: "emoji", ref: "🟣" }, category: { type: "dot_pattern", shape: "line" }, contrast_group: "dots", value: 2, ordering: 6 },
  { id: "growing_dots_l_shape", label: "chuỗi hạt góc L", image: { kind: "emoji", ref: "🟣" }, category: { type: "dot_pattern", shape: "l_shape" }, contrast_group: "dots", value: 3, ordering: 7 },
  { id: "growing_dots_cross", label: "chuỗi hạt dấu cộng", image: { kind: "emoji", ref: "🟣" }, category: { type: "dot_pattern", shape: "cross" }, contrast_group: "dots", value: 5, ordering: 8 },
  { id: "growing_dots_square", label: "chuỗi hạt khung vuông", image: { kind: "emoji", ref: "🟣" }, category: { type: "dot_pattern", shape: "square" }, contrast_group: "dots", value: 4, ordering: 9 },
];
```

### 5.4 Kho Ngữ Liệu `C3_RULE_03_DATASET` (Dãy Số Đôi Xen Kẽ & Đoàn Tàu Số)
```typescript
export const C3_RULE_03_VALLEY_ITEMS = [
  { id: "train_engine_steam", label: "đầu tàu hỏa hơi nước", image: { kind: "emoji", ref: "🚂" }, category: { type: "train", part: "engine" }, contrast_group: "train", value: 0, ordering: 1 },
  { id: "train_car_yellow_even", label: "toa số vàng (dãy chẵn)", image: { kind: "emoji", ref: "🚃" }, category: { type: "train", color: "yellow", stream: "even" }, contrast_group: "train", value: 2, ordering: 2 },
  { id: "train_car_blue_odd", label: "toa số xanh (dãy lẻ)", image: { kind: "emoji", ref: "🚃" }, category: { type: "train", color: "blue", stream: "odd" }, contrast_group: "train", value: 1, ordering: 3 },
  { id: "cipher_key_door", label: "chìa khóa mật mã 6 ký tự", image: { kind: "emoji", ref: "🗝️" }, category: { type: "key", role: "cipher" }, contrast_group: "boss", value: 6, ordering: 4 },
  { id: "valley_ancient_gate", label: "cánh cổng thung lũng đá cổ thụ", image: { kind: "emoji", ref: "⛩️" }, category: { type: "gate", role: "boss_door" }, contrast_group: "boss", value: 1, ordering: 5 },
];
```

### 5.5 Phrasing Đậm Chất Sư Phạm Chặng 15
- **Prompt Templates**:
  - `GT-006` (Quy luật chu kỳ & dãy số): *"Các hình đang lặp lại theo thứ tự đấy! Bé hãy tìm hình xuất hiện tiếp theo nhé!"*
  - `GT-001` (Trắc nghiệm chạm chọn): *"Ba hình sẽ lặp lại theo thứ tự A - B - C! Bé nhớ đủ ba bạn rồi chọn hình tiếp theo nhé!"*
  - `GT-001` (Dãy số bước nhảy): *"Các số đang tăng hoặc giảm đều đấy! Bé hãy tìm số tiếp theo nhé!"*
  - `GT-006` (Bậc thang gia số): *"Mỗi lần dãy số tăng nhiều hơn một chút! Bé xem quy luật tăng dần rồi điền số nhé!"*
  - `GT-008` (Bông hoa số): *"Mỗi bông hoa ẩn chứa quy luật kỳ diệu! Gợi ý: Số ở nhụy giữa = tổng hai cánh đối diện!"*
  - `GT-011` (Ma trận 2x2): *"Mỗi ô vuông có quy luật riêng! Sang phải và đi xuống luôn theo cùng một mức thay đổi!"*
  - `GT-001` (Boss Door): *"Chỉ còn một bước nữa thôi! Bé hãy giải 6 mật mã để mở cánh cổng Thung Lũng nhé!"*
- **Narration Templates**:
  - *"Chào mừng bé đến với Thung Lũng Quy Luật cùng Gấu Logic và Thỏ Quan Sát!"*
  - *"Tuyệt vời! Bé đã tìm ra nhịp điệu lặp lại của hoa quả rồi đấy!"*
  - *"Đoàn tàu số đã khớp nối hoàn hảo, tiếng còi tàu vang lên tu tu xình xịch!"*
  - *"Bông hoa số bừng sáng rực rỡ, cánh cổng thung lũng đang mở ra!"*

---

## 6. Danh Mục `SkillLevelPlan[]` Chi Tiết

Toàn bộ các level Montessori thiết kế từ Chặng 15 tuân thủ nghiêm ngặt định dạng mã `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), gắn nhãn `montessori_ref: "WB15-D<n>"`, phân bổ `access_tier` đồng bộ với `difficulty` (1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`), và không chứa từ khóa thương mại.

| Mã Level (`code`) | Template | Skill Code | Band | Diff | Access Tier | Montessori Ref | Tên Hoạt Động & Cấu Trúc Bài Toán Sư Phạm |
|---|---|---|:---:|:---:|---|---|---|
| `GL-C1-PAT-ORD-0101` | `GT-006` | `C1.PAT.01` | 5-6 | 1 | `free` | `WB15-D1` | **Cánh Cổng AB**: Kéo vật phẩm trái cây/con vật tiếp theo vào ô khuyết chuỗi chu kỳ $AB$ (Táo - Lê - Táo - Lê - Táo - [?]). |
| `GL-C1-PAT-CARD-0101` | `GT-001` | `C1.PAT.01` | 5-6 | 2 | `login` | `WB15-D1` | **Hai Hình Thay Phiên**: Chạm chọn hình tiếp theo trong chuỗi luân phiên $AB$ 5 phần tử (Dâu tây - Cam - Dâu tây - Cam - Dâu tây - [?]). |
| `GL-C1-PAT-CARD-0102` | `GT-001` | `C1.PAT.02` | 5-6 | 2 | `login` | `WB15-D1` | **Quy Luật ABB**: Chạm chọn hình tiếp theo theo quy tắc 1 hình trước 2 hình sau (Táo - Lê - Lê - Táo - Lê - [?]). |
| `GL-C1-PAT-CARD-0103` | `GT-001` | `C1.PAT.03` | 5-6 | 2 | `login` | `WB15-D1` | **Quy Luật AAB**: Chạm chọn hình tiếp theo theo quy tắc 2 hình trước 1 hình sau (Táo - Táo - Lê - Táo - Táo - [?]). |
| `GL-C1-PAT-ORD-0102` | `GT-006` | `C1.PAT.04` | 5-6 | 3 | `standard` | `WB15-D1` | **Ba Người Bạn Luân Phiên**: Kéo thả quân cờ hoàn thành chu kỳ lặp 3 phần tử $ABC$ (Thỏ - Gấu - Cáo - Thỏ - Gấu - [?]). |
| `GL-C1-PAT-CARD-0104` | `GT-001` | `C1.PAT.04` | 5-6 | 3 | `standard` | `WB15-D1` | **Mật Mã Hình Học**: Phân tích quy luật lặp trên cả 2 thuộc tính hình dạng & màu sắc (Tròn xanh - Vuông đỏ - Tròn xanh - Vuông đỏ - Tròn xanh - [?]). |
| `GL-C3-RULE-CARD-0103` | `GT-001` | `C3.RULE.01` | 5-6 | 2 | `login` | `WB15-D2` | **Con Đường Số Nhảy Đều**: Chạm chọn số tiếp theo trên đường ray đá theo bước nhảy cộng/trừ cố định ($2, 4, 6, 8, [?]$ hoặc $20, 18, 16, 14, [?]$). |
| `GL-C3-RULE-MATRX-0101` | `GT-011` | `C3.RULE.01` | 5-6 | 2 | `login` | `WB15-D2` | **Ô Vuông Phép Thuật 2x2 Trực Quan**: Ma trận $2 \times 2$ biến đổi trực quan màu sắc và hình dạng, tìm ô góc còn thiếu. |
| `GL-C3-RULE-MATRX-0102` | `GT-011` | `C3.RULE.01` | 5-6 | 3 | `standard` | `WB15-D3` | **Ma Trận Số Học 2x2**: Xác định số còn thiếu trong lưới $2 \times 2$ thỏa mãn đồng thời phép biến thiên hàng ngang và cột dọc. |
| `GL-C3-RULE-ORD-0103` | `GT-006` | `C3.RULE.02` | 5-6 | 3 | `standard` | `WB15-D1` | **Bậc Thang Gia Số Tăng Dần**: Sắp xếp các nấc thang số có bước nhảy tăng dần ($2 \xrightarrow{+1} 3 \xrightarrow{+2} 5 \xrightarrow{+3} 8 \xrightarrow{+4} 12 \xrightarrow{+5} [?]$). |
| `GL-C3-RULE-SLOT-0121` | `GT-008` | `C3.RULE.02` | 5-6 | 3 | `standard` | `WB15-D3` | **Bông Hoa Số Bí Mật**: Kéo thả thẻ số vào cánh hoa khuyết (Quy tắc: Nhụy giữa = Trên + Dưới = Trái + Phải). |
| `GL-C3-RULE-CARD-0104` | `GT-001` | `C3.RULE.02` | 5-6 | 4 | `premium` | `WB15-D2` | **Bậc Thang Fibonacci & Chính Phương**: Suy luận số tiếp theo trong dãy Fibonacci ($1, 2, 3, 5, 8, 13, [?]$) hoặc chính phương ($1, 4, 9, 16, 25, [?]$). |
| `GL-C3-RULE-MATRX-0103` | `GT-011` | `C3.RULE.02` | 5-6 | 4 | `premium` | `WB15-D3` | **Thám Tử Tìm A và B**: Giải chuỗi 3 ma trận tịnh tiến liên tiếp để tìm giá trị của 2 ẩn số $A$ và $B$. |
| `GL-C3-RULE-ORD-0104` | `GT-006` | `C3.RULE.03` | 5-6 | 3 | `standard` | `WB15-D1` | **Dãy Số Đôi Xen Kẽ**: Nhận diện chuỗi số đa luồng và tìm cặp số tiếp theo ($2, 10, 4, 12, 6, 14, [?], [?]$). |
| `GL-C3-RULE-SLOT-0122` | `GT-008` | `C3.RULE.03` | 5-6 | 4 | `premium` | `WB15-D3` | **Hai Đoàn Tàu Số**: Kéo 2 toa xe lửa mang số vào khớp nối đuôi đoàn tàu hỏa gồm các toa màu vàng và xanh xen kẽ. |
| `GL-C3-RULE-CARD-0105` | `GT-001` | `C3.RULE.03` | 5-6 | 4 | `premium` | `WB15-D2` | **Hàng Rào Lớn Dần**: Đếm và tính số lượng chấm tròn tiếp theo của mô hình hình học phát triển (góc L $+2$, rãnh U $+4$, viền vuông $+4$). |
| `GL-C3-RULE-CARD-0106` | `GT-001` | `C3.RULE.03` | 5-6 | 5 | `premium` | `WB15-D3` | **Đại Mật Mã Mở Cổng Thung Lũng**: Boss Door 6 ổ khóa liên hoàn `[B, A, A, A, B, C]` mở toang Cánh Cổng Thung Lũng trao Viên Ngọc Quy Luật. |

---

## 7. Ma Trận Sư Phạm, Cân Bằng Hạn Ngạch & Kiểm Soát Lỗi Tự Thân

### 7.1 Phân Bổ Hạn Ngạch & Cân Bằng Competency
- **Hiện trạng hạn ngạch C3**:
  - Hạn ngạch tối đa: 15 level Montessori.
  - Số level C3 đã nạp trước đợt này: **0 level**.
  - Đợt quy hoạch Chặng 15 bổ sung **11 level Montessori** cho C3:
    - `C3.RULE.01`: 3 level (`GL-C3-RULE-CARD-0103`, `GL-C3-RULE-MATRX-0101`, `GL-C3-RULE-MATRX-0102`)
    - `C3.RULE.02`: 4 level (`GL-C3-RULE-ORD-0103`, `GL-C3-RULE-SLOT-0121`, `GL-C3-RULE-CARD-0104`, `GL-C3-RULE-MATRX-0103`)
    - `C3.RULE.03`: 4 level (`GL-C3-RULE-ORD-0104`, `GL-C3-RULE-SLOT-0122`, `GL-C3-RULE-CARD-0105`, `GL-C3-RULE-CARD-0106`)
  - Số dư hạn ngạch C3 còn lại: 4 level (dành cho Chặng 17 và 21).
  - Tỉ lệ cân bằng toàn hệ thống: C1 = 36 level (giữ nguyên trần, 6 level C1 ở trên là làm giàu dataset và kế thừa lộ trình), C3 = 11 level $\rightarrow$ Tỉ lệ $\frac{36}{11} \approx 3.27$ lần (tiệm cận chuẩn cân bằng $\le 3.0$ lần theo `BR-TCM-07`).

### 7.2 Kiểm Soát Lỗi Tự Thân (Control of Error)
1. **Âm thanh và Phản hồi nhịp hổ phách (`amber_soft`)**:
   - Khi chọn sai hoặc kéo thả nhầm vị trí, vật phẩm nhẹ nhàng rung hổ phách và trôi về vị trí ban đầu (`drift_back`). Tuyệt đối không có âm thanh buzzer, dấu chéo đỏ hay trừ điểm.
2. **Khóa khớp nam châm (Snap & Lock)**:
   - Trong `GT-006` và `GT-008`, vật phẩm đúng tự động hút khớp vào slot với hiệu ứng ánh sáng vàng (`gold_glow`) và âm thanh thanh thoát (`bell_soft`).
3. **Kiểm tra chéo hai chiều trên ma trận $2 \times 2$**:
   - Trong `GT-011`, nếu trẻ chọn số thỏa mãn hàng ngang nhưng sai cột dọc, hệ thống hiển thị đường dẫn sáng nhấp nháy dọc theo cột bị mâu thuẫn để trẻ tự phát hiện lỗi.

### 7.3 Thang Scaffolding 3 Bậc (Hỗ Trợ Tự Động Theo Thời Gian & Lần Thử)
- **Mức 1 (Nudge - Nhắc nhẹ / 10s hoặc 1 miss)**:
  - Nhấp nháy viền đơn vị lặp cơ sở (core unit) hoặc viền ô có nhiều dữ kiện nhất.
- **Mức 2 (Guidance - Hướng dẫn / 18s hoặc 2 miss)**:
  - Giọng đọc Thỏ Quan Sát cất lên đọc to quy luật: *"Một táo, một lê, rồi lại một táo... tiếp theo là bạn nào nhỉ?"* hoặc *"Hai cộng mấy bằng sáu nhỉ?"*.
- **Mức 3 (Demo - Trình diễn / 25s hoặc 3 miss)**:
  - Bàn tay mờ (Ghost Hand) xuất hiện trỏ từ quy luật sang đáp án đúng với tốc độ $0.5 \times$ để trẻ làm theo.

---

## 8. Verification & Test Plan

1. **Kiểm tra cú pháp & Type Safety**:
   - `pnpm --filter @mindkid/content typecheck`: Tuyệt đối 0 lỗi type, 0 `any`, 0 `unknown` trong các file seeder `C3.RULE.01.ts`, `C3.RULE.02.ts`, `C3.RULE.03.ts`, `C1.PAT.01.ts..04.ts`.
2. **Kiểm tra cổng dữ liệu Montessori (`montessori-gate`)**:
   - Chạy `pnpm --filter @mindkid/content-build test`:
     - Mọi mã level khớp regex `^GL-C[1-6]-[A-Z]{3,4}-[A-Z]{3,4}-01\d{2}$`.
     - `access_tier` khớp 100% với `difficulty` (`BR-MGL-12`).
     - Hạn ngạch C3 không vượt quá 15 level (`BR-MGL-01`).
     - Tuyệt đối không chứa từ khóa thương mại IQ/Raven/WISC (`BR-MCM-06`).
3. **Kiểm tra tương thích Projection Builders**:
   - Xác nhận `buildLevelsForSkill` sinh ra `ContentSeed` hợp lệ qua các builder `gt-001.ts`, `gt-006.ts`, `gt-008.ts`, `gt-011.ts`.
