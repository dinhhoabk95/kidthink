---
spec: MONTESSORI-CHANG-19-SPEC
title: "Chặng 19: Thành Phố Hình Khối — Hình Học Phẳng 2D, Thuộc Tính Cạnh/Đỉnh/Góc, Bất Biến Phép Quay & Ánh Xạ Đời Sống"
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-19
workbook_ref: WB19
badge_reward: "Huy Hiệu Thành Phố Hình Khối (Geometric City Badge)"
owns:
  - Phân tích sư phạm và giải mã toàn diện 25 trang PDF Chặng 19 (Thành Phố Hình Khối, WB19)
  - Ánh xạ các dạng bài (WB19-D1..D6) vào các game engine hiện tại GT-000, GT-001, GT-002, GT-003, GT-005, GT-008, GT-020
  - TUYỆT ĐỐI KHÔNG TẠO MỚI GT-038+, hủy bỏ và thay thế hoàn toàn dự thảo GT-056 cũ và loại bỏ khuôn GT-017 (khối 3D cũ)
  - Khắc phục hiểu lầm về hình khối 3D kỹ thuật, định hình chính xác phạm vi hình học phẳng 2D nền tảng cho trẻ mầm non 3–5 tuổi
  - Thiết kế SkillDataset (items, relations, real-world objects, phrasing) lấy cảm hứng từ nhân vật Gấu Logic & Thỏ Sáng Tạo trong PDF 2026
  - Thiết kế 16 SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101) cho C2.GEO.01..04, C2.ROT.01, C3.CLS.02, C1.CNT.01, C1.PAT.01
  - Kế hoạch phổ biến dữ liệu vào seeder packages/content/src/skills/c2/geo/, c2/rot/, c3/cls/
  - Tuân thủ nghiêm ngặt BR-MCM-06 (không chứa từ khóa thương mại IQ/Raven/trí tuệ trong title và instruction)
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 19: Thành Phố Hình Khối — Hình Học Phẳng 2D, Thuộc Tính Cạnh/Đỉnh/Góc, Bất Biến Phép Quay & Ánh Xạ Đời Sống

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này xác lập đặc tả kỹ thuật và kiến trúc nội dung sư phạm nhằm chuyển thể trọn vẹn dữ liệu từ giáo trình PDF **"Chặng 19: Thành Phố Hình Khối — Quan Sát, Nhận Biết, Đếm Hình, Giải Mã Hình Ghép"** (`docs/montessori/extracted/chang-19/analysis.json`, nguồn: *WB19*, 25 trang, thuộc bộ giáo trình *Gấu Logic & Thỏ Sáng Tạo - Hành Trình 20 Chặng Toán Học*, Nhà xuất bản Dân Trí / Montessori VN) vào nền tảng **TiniMath v2**.

### 1.1 Bối Cảnh Cốt Truyện & Nhiệm Vụ Học Tập (Narrative Quest)
1. **Bối cảnh cốt truyện**: Chuyến Tàu Toán Học đưa Gấu Logic và Thỏ Sáng Tạo (Thỏ Quan Sát) tiến vào cổng vòm nguy nga của **Thành Phố Hình Khối Kỳ Diệu**. Tòa lâu đài trung tâm và các ngôi nhà tại đây được kiến tạo từ 4 hình học phẳng cơ bản: Hình Tam giác (mái nhà, tháp nhọn), Hình Chữ nhật (cửa lớn, bức tường), Hình Vuông (khung cửa sổ, hộp kho báu) và Hình Tròn (bánh xe cỗ xe hoàng gia, mặt trời trên đỉnh thành phố). Để mở cánh cổng cung điện và thắp sáng **Huy Hiệu Thành Phố Hình Khối** (3 sao vàng vinh danh), bé sẽ đồng hành cùng hai bạn nhỏ giải mã các câu đố hình học qua tiến trình 6 chặng nhỏ tinh tế.
2. **Nhiệm vụ học tập (Learning Quest)**:
   - **Nhận thức thuộc tính giải phẫu hình học phẳng (Geometric Anatomy & Attribute Analysis)**:
     - *Hình Tam giác*: Nhận diện cấu tạo 3 cạnh, 3 đỉnh (góc nhọn); hiểu rằng tam giác quay hướng nào (quay lên, sang trái, sang phải, chúc xuống) thì vẫn là hình tam giác (Bất biến phép quay - Rotation Invariance).
     - *Hình Chữ nhật*: Nhận diện 4 cạnh gồm 2 cạnh dài đối diện bằng nhau, 2 cạnh ngắn đối diện bằng nhau và 4 góc; nhận biết chữ nhật nằm ngang hay dựng đứng.
     - *Hình Vuông*: Nhận diện 4 cạnh bằng nhau và 4 góc; phân biệt hình vuông đứng chuẩn và hình vuông xoay nghiêng 45 độ (không bị nhầm thành hình thoi).
     - *Hình Tròn*: Nhận diện đường cong khép kín mượt mà, không có cạnh, không có góc; khám phá đặc tính cơ học chuyển động lăn tròn.
   - **Phân biệt đối lập tinh vi & Tư duy tập hợp bù (Contrast Discrimination & Complementary Logic)**:
     - Đặt hình vuông và hình chữ nhật cạnh nhau để so sánh điểm giống (4 cạnh, 4 góc) và điểm khác biệt cốt lõi (4 cạnh bằng nhau vs 2 dài 2 ngắn).
     - Phân loại bù (Trang 20): Đếm tập hợp hình tròn và đếm tập hợp "không phải hình tròn".
   - **Ánh xạ hai chiều Thực tế - Trừu tượng (CPA Concrete-to-Abstract Bidirectional Mapping)**:
     - Nhận diện các đồ vật quen thuộc trong đời sống tương ứng với từng hình phẳng: Cánh cửa 🚪 / Quyển sách 📕 / Bảng đen 🪧 $\rightarrow$ Hình chữ nhật; Quả bóng ⚽ / Mặt trời ☀️ / Bánh xe 🛞 $\rightarrow$ Hình tròn; Khung cửa sổ 🪟 / Hộp quà 🎁 $\rightarrow$ Hình vuông; Miếng Pizza 🍕 / Con diều 🪁 $\rightarrow$ Hình tam giác.
   - **Đếm số lượng ma trận mật độ cao & Giải mã chuỗi quy luật lặp (Pattern Sequence Completion)**:
     - Quét mắt đếm số lượng 4 loại hình trong ma trận hỗn hợp dày đặc lên tới 18 hình (Trang 23).
     - Nhận diện đơn vị lặp tuần hoàn ABAB và AABAAB của chuỗi hình học và điền hình còn thiếu (Trang 24).
   - **Đại lễ trao thưởng & Vinh danh (Trang 25)**: Trao tặng Huy Hiệu Thành Phố Hình Khối 3 sao và khắc sâu 4 định lý cốt lõi của thế giới hình học.

### 1.2 Nguyên Tắc Bất Biến Về Công Nghệ & Phạm Vi
1. **Tuyệt Đối Không Tạo Game Engine Mới (`GT-038+`)**:
   - Toàn bộ cơ chế tương tác của Chặng 19 được tích hợp 100% vào các game engine hiện hữu:
     - `GT-000` (`concept-intro` & `summary-badge`): Giới thiệu cánh cổng Thành phố hình khối (Trang 1) và Lễ trao Huy hiệu vinh danh (Trang 25).
     - `GT-001` (`tap-select`): Chạm khoanh chọn hình đúng, trắc nghiệm thuộc tính định nghĩa (A/B/C), nhận diện hình xoay góc.
     - `GT-002` (`counting-tap`): Chạm đếm số lượng hình từng loại trong ma trận hỗn hợp, đánh dấu số đếm trực quan.
     - `GT-003` (`pattern-completion` / `bucket-sort`): Điền hình khuyết theo quy luật chuỗi lặp ABAB/AABAAB hoặc phân loại vào khay màu.
     - `GT-005` (`pair-matching`): Kéo dây nối hình với tên gọi, nối hình với thuộc tính đặc điểm, nối đồ vật thực tế với hình chuẩn (hỗ trợ cả nối 1-nhiều và nối hai cánh vào giữa).
     - `GT-008` (`drag-to-slot` / `basket-sorting`): Kéo thả các thẻ hình vào 2 hộp đối lập (Vuông vs Chữ nhật) hoặc 4 giỏ hình học (Tam giác, Chữ nhật, Vuông, Tròn).
     - `GT-020` (`sequence-order`): Sắp xếp chuỗi hình quy luật tăng tiến.
   - **Hủy bỏ hoàn toàn dự thảo `GT-056` cũ và loại bỏ khuôn `GT-017` (xếp khối 3D)**:
     - Tài liệu dự thảo cũ từng đề xuất `GT-056` và gán nhầm WB19 vào `GT-017` (đếm khối lập phương 3D bị khuất / hình chiếu kỹ thuật). Điều này hoàn toàn sai lệch với dữ liệu thực tế 25 trang của PDF Chặng 19.
     - Sách tập trung hoàn toàn vào hình học phẳng 2D và đồ vật thực tế cho trẻ mầm non 3–5 tuổi. Việc tạo `GT-056` hoặc gượng ép dùng `GT-017` bị **hủy bỏ vĩnh viễn**.
2. **Khắc Phục Điểm Nghẽn Thiếu Level Trong Seeder `packages/content/src/skills/c2/`**:
   - Hiện tại, các skill `C2.GEO.03` (Tam giác) chỉ có 3 level, `C2.GEO.04` (Chữ nhật) có 6 level, `C2.ROT.01` (Phép quay) có 4 level.
   - Tài liệu này mở khóa nạp 16 level Montessori chất lượng cao vào các strand `C2.GEO`, `C2.ROT`, `C3.CLS`, `C1.CNT`, `C1.PAT`, bổ sung nguồn học liệu chuẩn mực cho mầm non.
3. **Tuân Thủ Tuyệt Đối Quy Tắc Doanh Nghiệp & Sư Phạm**:
   - `BR-MCM-06`: Tuyệt đối không chứa từ khóa thương mại, bài kiểm tra tâm lý hoặc tuyên bố đo lường chỉ số trí tuệ (`raven`, `iq`, `trí tuệ`, `chỉ số thông minh`, `wisc`). Phần thưởng hoàn thành chặng chuẩn hóa thành **"Huy Hiệu Thành Phố Hình Khối" (Geometric City Badge)**.
   - `BR-MGL-02`: Mọi mã level Montessori thuộc khối dành riêng từ `0101` trở lên: `GL-<COMP>-<STRAND>-<MECH>-01xx`.
   - `BR-MGL-03` & `BR-MGL-04`: Mỗi dạng bài có ít nhất 2 level khác độ khó, tăng lũy tiến một chiều (cô lập thuộc tính theo `BR-MCM-13`).
   - `BR-MGL-12`: Cấp bậc truy cập (`access_tier`) đồng bộ chặt chẽ với độ khó (`difficulty`: 1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`).
   - `BR-MCM-14` & `BR-MCM-15`: Giữ trọn vẹn kiểm soát lỗi tự thân (Control of Error) và trình tự cụ thể đến trừu tượng (CPA).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò hệ thống | Vai trò sư phạm & Thể hiện trong Chặng 19 |
|---|---|---|
| **Bé (Kid Player)** | Người chơi trung tâm (3–5 tuổi) | Nhập vai kiến trúc sư nhí cùng Gấu Logic và Thỏ Sáng Tạo bước vào Thành Phố Hình Khối, nhận biết các hình học 2D, chỉ ra các cạnh và góc, phân biệt hình quay, nối đồ vật đời sống và giải mã chuỗi quy luật để nhận Huy Hiệu Thành Phố Hình Khối. |
| **Gấu Logic (`gau_logic`)** | Nhân vật dẫn dắt tư duy trừu tượng | Đại diện cho phân tích thuộc tính cấu trúc hình học, số cạnh, số đỉnh và tính bất biến khi quay. Lời thoại tiêu biểu: *"Hình tam giác là hình có 3 cạnh, 3 đỉnh đấy!", "Hình chữ nhật có 4 cạnh, gồm 2 cạnh dài và 2 cạnh ngắn!", "Hình vuông có 4 cạnh bằng nhau nhé!", "Tam giác quay hướng nào vẫn là tam giác!", "Hình vuông quay đi vẫn là hình vuông!", "Hình vuông và hình chữ nhật hơi giống nhau đấy, con xem cạnh của chúng nhé!"*. |
| **Thỏ Sáng Tạo (`tho_sang_tao` / `tho_quan_sat`)** | Nhân vật kích hoạt trực giác giác quan | Đại diện cho quan sát thị giác, liên hệ đồ vật thực tế đời sống và cảm nhận cơ học. Lời thoại tiêu biểu: *"Cùng nhau học thật tốt để mở cánh cổng nhé!", "Cửa và quyển sách rất giống hình chữ nhật đấy!", "Bạn hình tròn lăn được đấy, vì bạn ấy không có góc nào cả!", "Bé nhìn xem trong các đồ vật quen thuộc có những hình nào nhé!", "Chúc mừng bé đã trở thành bạn nhỏ thật giỏi về hình khối!"*. |
| **Phụ huynh / Giáo viên** | Hỗ trợ ngoài màn hình | Hướng dẫn trẻ quan sát đồ vật trong nhà (cửa ra vào, bánh xe, hộp bánh, miếng dưa hấu) theo gợi ý tại chân trang sách (`parent_tips`). |
| **Content Seeder Engine** | Hệ thống nạp tự động | Chuyển hóa các `SkillLevelPlan[]` thành `ContentSeed` cho DB, xác thực qua `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-19/analysis.json (25 trang, WB19)
   │
   ├──> docs/montessori/dataset/activity-types-table.md
   │       └── Cập nhật WB19-D1..D6 (Dùng GT-000, GT-001, GT-002, GT-003, GT-005, GT-008; loại bỏ GT-056 & GT-017)
   │
   ├──> docs/specs/05-content/montessori-corpus-mapping.md
   │       └── Hiệu chỉnh hàng Workbook 19 (C2.GEO, C2.ROT) và cập nhật hạn ngạch C2
   │
   ├──> packages/content/src/skills/c2/geo/
   │       ├── C2.GEO.01.ts (Hình tròn: Bổ sung items đời sống, lời thoại Thỏ & Gấu, 3 levels Montessori)
   │       ├── C2.GEO.02.ts (Hình vuông: Bổ sung items đời sống, thuộc tính 4 cạnh bằng nhau, 3 levels Montessori)
   │       ├── C2.GEO.03.ts (Hình tam giác: Bổ sung items đời sống, thuộc tính 3 cạnh 3 đỉnh, 3 levels Montessori)
   │       └── C2.GEO.04.ts (Hình chữ nhật: Bổ sung items đời sống, phân biệt 2 dài 2 ngắn, 3 levels Montessori)
   │
   ├──> packages/content/src/skills/c2/rot/
   │       └── C2.ROT.01.ts (Bất biến qua phép quay: Tam giác các hướng, Vuông xoay 45°, 2 levels Montessori)
   │
   └──> packages/content/src/skills/c3/cls/
           └── C3.CLS.02.ts (Phân biệt đối lập Vuông vs Chữ nhật & Phân loại 4 giỏ hình học, 2 levels Montessori)
```

---

## 4. Phân Tích Chi Tiết 7 Dạng Bài Trong PDF WB19 & Ánh Xạ Game Engine Hiện Hữu

Toàn bộ 25 trang tài liệu PDF Chặng 19 được cấu trúc thành 7 nhóm hoạt động sư phạm mạch lạc:

### 4.1 `WB19-D1`: Khám Phá Thuộc Tính Giải Phẫu Hình Học 2D (Concept Introduction & Attribute Exploration)
- **Tên bài học**: *Làm quen & Khám phá thuộc tính hình tam giác, chữ nhật, vuông, tròn* (Trang 1, 4, 6, 8, 11, 14, 17 của sách).
- **Vị trí PDF**: Trang 2, 5, 7, 9, 12, 15, 18.
- **Mục tiêu sư phạm**:
  - Trẻ hình thành biểu tượng hình học trực quan nhân hoá (hình mặt cười sinh động).
  - Khám phá thuộc tính giải phẫu hình học (Geometric Anatomy):
    - Tam giác: 3 cạnh, 3 đỉnh.
    - Chữ nhật: 4 cạnh (2 cạnh dài đối diện bằng nhau, 2 cạnh ngắn đối diện bằng nhau), 4 góc.
    - Vuông: 4 cạnh bằng nhau, 4 góc.
    - Tròn: Đường cong kín, 0 cạnh, 0 góc, đặc tính cơ học lăn tròn mượt mà.
- **Cơ chế tương tác số hóa (GT-000, GT-001, GT-005)**:
  - `GT-000` (`concept-intro`): Màn hình flashcard tương tác. Trẻ chạm vào cạnh hoặc góc của hình, cạnh đó sáng lên lấp lánh kèm âm thanh đếm nhịp nhàng: *"Một cạnh... Hai cạnh... Ba cạnh! Bạn tam giác có 3 cạnh!"*.
  - `GT-001` (`tap-select`): Trắc nghiệm chọn câu phát biểu đúng: *"Hình vuông có đặc điểm gì?"* $\rightarrow$ Lựa chọn: [Hình vuông có 4 cạnh bằng nhau] / [Hình vuông có 3 cạnh] / [Hình vuông không có cạnh].
- **Kỹ năng liên kết**: `C2.GEO.01`, `C2.GEO.02`, `C2.GEO.03`, `C2.GEO.04`.

---

### 4.2 `WB19-D2`: Nhận Diện Bất Biến Qua Phép Quay Không Gian (Shape Recognition & Rotation Invariance)
- **Tên bài học**: *Tìm hình & Nhận diện bất biến qua phép quay* (Trang 2, 3, 7, 13, 16 của sách).
- **Vị trí PDF**: Trang 3, 4, 8, 14, 17, 22.
- **Mục tiêu sư phạm**:
  - Phát triển tư duy hình học Cấp độ 1 (Van Hiele): Trẻ nhận ra bản chất hình học không thay đổi khi vị trí hoặc góc xoay thay đổi.
  - Hình tam giác xoay đỉnh lên trên, quay sang trái, quay sang phải hay lộn ngược vẫn giữ nguyên 3 cạnh, 3 đỉnh $\rightarrow$ Vẫn là hình tam giác.
  - Hình vuông khi xoay nghiêng 45 độ (dễ bị trẻ nhìn nhầm thành hình thoi) vẫn có 4 cạnh bằng nhau và 4 góc vuông $\rightarrow$ Vẫn là hình vuông.
  - Hình chữ nhật nằm ngang hay dựng đứng vẫn có 2 cạnh dài và 2 cạnh ngắn $\rightarrow$ Vẫn là hình chữ nhật.
- **Cơ chế tương tác số hóa (GT-001, GT-005)**:
  - `GT-001` (`tap-select`): Hiển thị hàng/lưới các hình đa dạng màu sắc và hướng quay. Trẻ chạm khoanh vào tất cả các hình tam giác (kể cả tam giác quay ngang, quay ngược) hoặc hình vuông xoay 45 độ. Khi chạm đúng, hình phát sáng và xoay nhẹ vui nhộn.
  - `GT-005` (`pair-matching`): Nối các biến thể quay của cùng một hình về ô hình mẫu ở trung tâm.
- **Kỹ năng liên kết**: `C2.ROT.01`, `C2.GEO.02`, `C2.GEO.03`, `C2.GEO.04`.

---

### 4.3 `WB19-D3`: Nối Hình Học Với Tên Gọi & Thuộc Tính Định Nghĩa (Semantic Label & Definition Matching)
- **Tên bài học**: *Nối hình với tên gọi và đặc điểm đúng* (Trang 2, 3, 9, 10, 12, 13, 20 của sách).
- **Vị trí PDF**: Trang 3, 4, 10, 11, 13, 14, 21.
- **Mục tiêu sư phạm**:
  - Liên kết biểu tượng thị giác (Visual Symbol) với nhãn ngôn ngữ tiếng Việt (Semantic Label) và định nghĩa thuộc tính (Definitional Attribute).
  - Giúp trẻ khắc sâu vốn từ vựng toán học mầm non chuẩn xác.
- **Cơ chế tương tác số hóa (GT-005)**:
  - `GT-005` (`pair-matching`): Giao diện 2 cột tương tác. Cột trái là các hình phẳng màu sắc (Tam giác hồng, Chữ nhật xanh lá, Vuông vàng, Tròn lam); cột phải là các nhãn tên đóng khung chữ Fredoka rõ nét ("Hình tam giác", "Hình chữ nhật", "Hình vuông", "Hình tròn") hoặc nhãn thuộc tính ("Có 3 cạnh", "Có 4 cạnh", "Có 4 cạnh bằng nhau", "Không có cạnh"). Trẻ kéo dây nối chạm-thả mượt mà.
- **Kỹ năng liên kết**: `C2.GEO.01`, `C2.GEO.02`, `C2.GEO.03`, `C2.GEO.04`, `C3.CLS.01`.

---

### 4.4 `WB19-D4`: Ánh Xạ Đồ Vật Đời Sống Sang Hình Học Phẳng 2D (Real-World Concrete to Abstract Geometry Matching)
- **Tên bài học**: *Hình học trong đời sống xung quanh ta* (Trang 5, 9, 15, 18, 23 của sách).
- **Vị trí PDF**: Trang 6, 10, 16, 19, 24.
- **Mục tiêu sư phạm**:
  - Cầu nối sư phạm CPA (Concrete to Abstract): Chuyển hóa kinh nghiệm trực quan từ các đồ vật thực tế 3D quen thuộc trong sinh hoạt hàng ngày về dạng hình học phẳng 2D trừu tượng.
  - Nhận thức rằng các mặt bao quanh của vật thể mang hình dáng hình học xác định.
- **Cơ chế tương tác số hóa (GT-005, GT-001)**:
  - `GT-005` (`pair-matching`):
    - Chế độ 1-1: Nối Đồ vật $\rightarrow$ Hình học tương ứng (Cánh cửa 🚪 $\rightarrow$ Hình chữ nhật, Bánh xe 🛞 $\rightarrow$ Hình tròn).
    - Chế độ 1-nhiều (Trang 19): Một hình tròn nét rỗng ở giữa nối tới 3 đồ vật tròn cùng lúc (Quả bóng ⚽, Mặt trời ☀️, Bánh xe 🛞).
    - Chế độ Hai Cánh (Trang 24 - Đỉnh cao thử thách): Cột hình chuẩn ở giữa (4 hình), cánh trái gồm 4 đồ vật, cánh phải gồm 4 đồ vật; trẻ nối cả hai bên về đúng hình ở giữa.
  - `GT-001` (`tap-select`): Câu hỏi *"Đồ vật nào có dạng hình chữ nhật?"* $\rightarrow$ Bé chạm chọn các đồ vật đúng giữa các vật thể làm nhiễu.
- **Kỹ năng liên kết**: `C2.GEO.01..04`, `C2.SOL.01`, `C4.OBS.01`.

---

### 4.5 `WB19-D5`: Đếm Số Lượng Hình Trong Tập Hợp Hỗn Hợp & Đếm Bổ Sung (Mixed Shape Counting & Complementary Logic)
- **Tên bài học**: *Đếm số hình trong ma trận hỗn hợp và đếm tập bù* (Trang 2, 5, 7, 9, 12, 15, 18, 19, 20, 22 của sách).
- **Vị trí PDF**: Trang 3, 6, 8, 10, 13, 16, 19, 20, 21, 23.
- **Mục tiêu sư phạm**:
  - Rèn luyện kỹ năng phân biệt hình - nền (Figure-ground Perception) và lọc nhiễu thị giác.
  - Đếm chính xác số lượng của từng loại hình trong một ma trận hỗn hợp nhiều kích thước, màu sắc và góc xoay.
  - Phát triển tư duy tập hợp bù (Complementary Logic - Trang 20): Đếm tổng số phần tử $N$, đếm số phần tử mang thuộc tính $A$, suy ra số phần tử "Không phải $A$" ($N - A$).
  - Thử thách đếm ma trận mật độ cao 18 hình (Trang 23): Đếm đồng thời 4 loại hình (5 tam giác, 4 chữ nhật, 6 vuông, 3 tròn).
- **Cơ chế tương tác số hóa (GT-002, GT-001)**:
  - `GT-002` (`counting-tap`): Trẻ chạm vào từng hình mục tiêu trong ma trận, mỗi cú chạm để lại một dấu tick sao nhỏ và phát âm số đếm tự nhiên (1, 2, 3, 4...).
  - `GT-001` (`tap-select`): Trắc nghiệm chọn đáp án đếm đúng (A. 3, B. 4, C. 5).
- **Kỹ năng liên kết**: `C1.CNT.01`, `C1.CNT.02`, `C3.CLS.02`.

---

### 4.6 `WB19-D6`: Phân Loại & Gom Nhóm Hình Học Vào Giỏ (Geometric Basket Sorting & Classification)
- **Tên bài học**: *Phân loại hình vào nhóm phù hợp* (Trang 13, 16, 20 của sách).
- **Vị trí PDF**: Trang 14, 17, 21.
- **Mục tiêu sư phạm**:
  - Phân loại nhị phân tinh vi (Fine binary sorting - Trang 17): Đặt Hình vuông và Hình chữ nhật cạnh nhau để phân loại vào 2 hộp "Hộp Hình Vuông" và "Hộp Hình Chữ Nhật". Rèn luyện khả năng chú ý đặc tính tỉ lệ cạnh (Aspect ratio).
  - Phân loại toàn diện 4 nhóm (Trang 21): Kéo thả 8 thẻ hình nhiều màu sắc vào 4 giỏ: Giỏ Tam Giác, Giỏ Chữ Nhật, Giỏ Vuông, Giỏ Tròn.
- **Cơ chế tương tác số hóa (GT-008, GT-003)**:
  - `GT-008` (`drag-to-slot` / `basket-sorting`): Dưới màn hình là hàng thẻ hình trôi nhẹ; phía trên là 2 hoặc 4 chiếc giỏ rực rỡ mang nhãn tên và hình mẫu. Trẻ kéo thẻ hình thả vào đúng giỏ; cơ chế nam châm tự hút snap-in mượt mà, hỗ trợ fallback tap-tap cho trẻ 3 tuổi.
- **Kỹ năng liên kết**: `C3.CLS.01`, `C3.CLS.02`.

---

### 4.7 `WB19-D7`: Giải Mã Chuỗi Quy Luật Hình Lặp Tuần Hoàn (Pattern Sequence Completion)
- **Tên bài học**: *Giải mã quy luật hình ghép Thành phố hình khối* (Trang 23 của sách).
- **Vị trí PDF**: Trang 24.
- **Mục tiêu sư phạm**:
  - Khám phá cấu trúc trật tự lặp lại có chu kỳ của các hình học phẳng.
  - Nhận diện đơn vị chu kỳ lặp (Pattern Core Unit):
    - Chuỗi lặp 2 phần tử luân phiên ABAB: [Tam giác - Chữ nhật - Tam giác - Chữ nhật - ?] $\rightarrow$ Đáp án: Tam giác.
    - Chuỗi lặp 3 phần tử AABAAB: [Vuông - Vuông - Tròn - Vuông - Vuông - ?] $\rightarrow$ Đáp án: Tròn.
    - Chuỗi lặp kết hợp màu sắc và hình dạng: [Chữ nhật xanh - Vuông tím - Chữ nhật xanh - Vuông tím - ?] $\rightarrow$ Đáp án: Chữ nhật xanh.
- **Cơ chế tương tác số hóa (GT-003, GT-020)**:
  - `GT-003` (`pattern-completion`): Băng chuyền chuỗi hình học chạy qua màn hình với một ô khuyết mang dấu hỏi chấm [?]. Bên dưới hiển thị 3 thẻ hình lựa chọn; trẻ chạm hoặc kéo hình đúng vào ô trống để tàu chạy tiếp.
- **Kỹ năng liên kết**: `C1.PAT.01`, `C1.PAT.02`, `C3.PAT.01`.

---

## 5. Thiết Kế SkillDataset Toàn Diện

Hệ thống ngữ liệu lấy cảm hứng trực tiếp từ phong cách đồ họa vui tươi, bảng màu sinh động và câu thoại của Gấu Logic & Thỏ Sáng Tạo trong PDF Chặng 19 (WB19).

### 5.1 Bảng Danh Mục Vật Phẩm Hình Học & Đồ Vật Thực Tế (`items`)

| ID Vật phẩm | Nhãn hiển thị | Biểu tượng (Emoji/Ref) | Loại / Danh mục | Thuộc tính hình học / Đặc điểm |
|---|---|:---:|---|---|
| `geo_triangle_pink` | hình tam giác hồng | 🔺 | hình phẳng 2D | 3 cạnh, 3 đỉnh, màu hồng |
| `geo_triangle_purple`| hình tam giác tím | 💜🔺 | hình phẳng 2D | 3 cạnh, 3 đỉnh, hướng xoay trái |
| `geo_triangle_blue` | hình tam giác lam | 🔷🔺 | hình phẳng 2D | 3 cạnh, 3 đỉnh, hướng xoay phải |
| `geo_rect_green_horiz`| hình chữ nhật xanh nằm | 🟩 | hình phẳng 2D | 4 cạnh (2 dài, 2 ngắn), nằm ngang |
| `geo_rect_orange_vert`| hình chữ nhật cam đứng | 🟧 | hình phẳng 2D | 4 cạnh (2 dài, 2 ngắn), dựng đứng |
| `geo_rect_purple_horiz`| hình chữ nhật tím | 🟪 | hình phẳng 2D | 4 cạnh, 4 góc, màu tím |
| `geo_square_yellow` | hình vuông vàng | 🟨 | hình phẳng 2D | 4 cạnh bằng nhau, 4 góc, đứng chuẩn |
| `geo_square_rotated_45`| hình vuông xoay nghiêng | 💠 | hình phẳng 2D | 4 cạnh bằng nhau, xoay 45 độ |
| `geo_square_blue` | hình vuông lam | 🟦 | hình phẳng 2D | 4 cạnh bằng nhau, màu lam |
| `geo_circle_blue` | hình tròn lam | 🔵 | hình phẳng 2D | 0 cạnh, 0 góc, lăn tròn được |
| `geo_circle_red` | hình tròn đỏ | 🔴 | hình phẳng 2D | 0 cạnh, đường cong kín, màu đỏ |
| `geo_circle_green` | hình tròn lục | 🟢 | hình phẳng 2D | 0 cạnh, màu lục tươi |
| `obj_door_wood` | cánh cửa gỗ | 🚪 | đồ vật thực tế | dạng hình chữ nhật |
| `obj_book_red` | quyển sách đỏ | 📕 | đồ vật thực tế | dạng hình chữ nhật |
| `obj_blackboard` | bảng đen lớp học | 🪧 | đồ vật thực tế | dạng hình chữ nhật |
| `obj_window_frame` | khung cửa sổ 4 ô | 🪟 | đồ vật thực tế | dạng hình vuông |
| `obj_gift_box` | hộp quà thắt nơ | 🎁 | đồ vật thực tế | dạng hình vuông |
| `obj_brick_tile` | viên gạch hoa lát | 🧱 | đồ vật thực tế | dạng hình vuông |
| `obj_beach_ball` | quả bóng bãi biển | ⚽ | đồ vật thực tế | dạng hình tròn |
| `obj_sun_shining` | mặt trời toả nắng | ☀️ | đồ vật thực tế | dạng hình tròn |
| `obj_car_wheel` | bánh xe ô tô | 🛞 | đồ vật thực tế | dạng hình tròn |
| `obj_pizza_slice` | miếng pizza xúc xích | 🍕 | đồ vật thực tế | dạng hình tam giác |
| `obj_wind_kite` | con diều no gió | 🪁 | đồ vật thực tế | dạng hình tam giác |
| `obj_traffic_sign` | biển báo tam giác | ⚠️ | đồ vật thực tế | dạng hình tam giác |
| `badge_geo_city` | huy hiệu thành phố hình khối| 🎖️ | phần thưởng vinh danh | 3 sao vàng rực rỡ chặng 19 |

### 5.2 Ngữ Thoại Hướng Dẫn & Phản Hồi Sư Phạm (`phrasing`)

```typescript
export const CHANG_19_PHRASING = {
  prompts: {
    intro_city: "Chào mừng bé đến với Thành Phố Hình Khối! Cùng khám phá các hình học kỳ diệu để thắp sáng huy hiệu kho báu nhé!",
    triangle_explore: "Hình tam giác là hình có 3 cạnh và 3 đỉnh đấy!",
    triangle_rotation: "Tam giác quay hướng nào vẫn là tam giác! Bé hãy tìm các bạn tam giác nhé!",
    rect_explore: "Hình chữ nhật có 4 cạnh, gồm 2 cạnh dài và 2 cạnh ngắn nhé!",
    square_explore: "Hình vuông có 4 cạnh bằng nhau đấy!",
    square_rotation: "Hình vuông quay đi vẫn là hình vuông, con nhìn xem 4 cạnh có bằng nhau không nhé!",
    circle_explore: "Bạn hình tròn lăn được đấy, vì bạn ấy không có cạnh, không có góc nào cả!",
    contrast_square_rect: "Hình vuông và hình chữ nhật hơi giống nhau đấy, con xem cạnh của chúng để xếp vào đúng hộp nhé!",
    real_world_match: "Đồ vật nào giống hình chữ nhật? Bé hãy nối đồ vật với hình tương ứng nhé!",
    mixed_counting: "Có tất cả bao nhiêu hình tam giác? Bé hãy đếm thật kỹ rồi chọn số đúng nhé!",
    complement_counting: "Có mấy hình tròn, và có mấy hình không phải hình tròn nhỉ?",
    pattern_sequence: "Điền hình còn thiếu vào ô trống theo đúng quy luật chuỗi nhé!",
    celebration_badge: "Chúc mừng con đã trở thành bạn nhỏ thật giỏi về hình khối! Bé nhận được Huy Hiệu Thành Phố Hình Khối 3 sao rồi nè!"
  },
  hints: {
    count_edge_triangle: "Bé thử đếm xem bạn ấy có mấy cạnh nhé: 1, 2, 3!",
    count_edge_square: "Bạn này có 4 cạnh dài bằng nhau chằn chặn đấy!",
    rect_sides: "Bạn này có 2 cạnh dài và 2 cạnh ngắn đối diện nhau!",
    circle_roll: "Bạn này tròn xoe, lăn lông lốc được vì không vướng góc nào!",
    pattern_repeat: "Bé nhìn lại xem: Tam giác, Chữ nhật, Tam giác, Chữ nhật... Tiếp theo sẽ là hình gì nào?"
  },
  affirmations: [
    "Đúng rồi! Bé giỏi quá!",
    "Chính xác! Một phát hiện tuyệt vời!",
    "Bé quan sát tinh mắt lắm!",
    "Tuyệt cú mèo! Cánh cổng lâu đài đã mở thêm một bậc rồi!"
  ]
};
```

---

## 6. Danh Sách 16 SkillLevelPlan[] Chuẩn Hóa

Toàn bộ các level tuân thủ nghiêm ngặt định dạng mã `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), đồng bộ độ khó và `access_tier` theo `BR-MGL-12` (1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`).

### 6.1 Nhóm Skill `C2.GEO.03` — Hình Tam Giác (3 Cạnh, 3 Đỉnh, Bất Biến Hướng)

#### 1. `GL-C2-GEO-CARD-0104` (Khám Phá Hình Tam Giác & Nhận Diện Đơn)
- **Engine**: `GT-001` (`tap-select`)
- **Band**: `3-4` | **Difficulty**: `1` | **Access Tier**: `free`
- **Montessori Ref**: `WB19-D1` (Trang 2 PDF)
- **Nội dung sư phạm**: Bé chạm chọn các hình tam giác hồng/tím giữa hình tròn và hình vuông làm nhiễu. Gấu Logic giới thiệu 3 cạnh và 3 đỉnh của tam giác.
- **Thông số cấu hình**:
  ```json
  {
    "target_shape": "triangle",
    "total_items": 5,
    "target_count": 2,
    "has_audio_guidance": true,
    "theme": "shapes_city"
  }
  ```

#### 2. `GL-C2-GEO-MATCH-0103` (Nối Tam Giác Với Đồ Vật Thực Tế & Tên Gọi)
- **Engine**: `GT-005` (`pair-matching`)
- **Band**: `3-4` | **Difficulty**: `2` | **Access Tier**: `login`
- **Montessori Ref**: `WB19-D3`, `WB19-D4` (Trang 3, 24 PDF)
- **Nội dung sư phạm**: Nối Hình tam giác với nhãn "Hình tam giác" và nối với đồ vật đời sống: Miếng Pizza 🍕, Con diều 🪁.
- **Thông số cấu hình**:
  ```json
  {
    "pairs_count": 3,
    "left_items": ["geo_triangle_pink", "geo_square_yellow", "geo_circle_blue"],
    "right_items": ["label_triangle", "label_square", "label_circle"],
    "snap_tolerance": 48
  }
  ```

#### 3. `GL-C2-GEO-CARD-0105` (Trắc Nghiệm Thuộc Tính Giải Phẫu Tam Giác)
- **Engine**: `GT-001` (`tap-select`)
- **Band**: `4-5` | **Difficulty**: `3` | **Access Tier**: `standard`
- **Montessori Ref**: `WB19-D1` (Trang 4 PDF)
- **Nội dung sư phạm**: Bé chọn số cạnh và số đỉnh đúng của hình tam giác: [Hình tam giác có 3 cạnh và 3 đỉnh] giữa các đáp án nhiễu 4 cạnh, 0 cạnh.

---

### 6.2 Nhóm Skill `C2.GEO.04` — Hình Chữ Nhật (4 Cạnh: 2 Dài, 2 Ngắn, Ngang & Đứng)

#### 4. `GL-C2-GEO-CARD-0106` (Làm Quen & Nhận Diện Hình Chữ Nhật Ngang - Đứng)
- **Engine**: `GT-001` (`tap-select`)
- **Band**: `3-4` | **Difficulty**: `1` | **Access Tier**: `free`
- **Montessori Ref**: `WB19-D1`, `WB19-D2` (Trang 5 PDF)
- **Nội dung sư phạm**: Khoanh chọn hình chữ nhật ở cả hai trạng thái: nằm ngang và dựng đứng.
- **Thông số cấu hình**:
  ```json
  {
    "target_shape": "rectangle",
    "orientations": ["horizontal", "vertical"],
    "total_items": 6,
    "target_count": 3
  }
  ```

#### 5. `GL-C2-GEO-MATCH-0104` (Ánh Xạ Đồ Vật Dạng Chữ Nhật Trong Đời Sống)
- **Engine**: `GT-005` (`pair-matching`)
- **Band**: `4-5` | **Difficulty**: `2` | **Access Tier**: `login`
- **Montessori Ref**: `WB19-D4` (Trang 6, 24 PDF)
- **Nội dung sư phạm**: Nối hình chữ nhật với Cánh cửa gỗ đứng 🚪, Quyển sách bìa đỏ 📕, Bảng đen lớp học 🪧.

#### 6. `GL-C2-GEO-CARD-0107` (Phân Biệt Cạnh Dài & Cạnh Ngắn Chữ Nhật)
- **Engine**: `GT-001` (`tap-select`)
- **Band**: `4-5` | **Difficulty**: `3` | **Access Tier**: `standard`
- **Montessori Ref**: `WB19-D1` (Trang 12 PDF)
- **Nội dung sư phạm**: Bé trả lời câu hỏi: *"Hình chữ nhật có mấy cạnh dài và mấy cạnh ngắn?"* $\rightarrow$ [2 cạnh dài và 2 cạnh ngắn].

---

### 6.3 Nhóm Skill `C2.GEO.02` — Hình Vuông (4 Cạnh Bằng Nhau, Đứng & Xoay 45°)

#### 7. `GL-C2-GEO-CARD-0103` (Làm Quen Với Hình Vuông 4 Cạnh Bằng Nhau)
- **Engine**: `GT-001` (`tap-select`)
- **Band**: `3-4` | **Difficulty**: `1` | **Access Tier**: `free`
- **Montessori Ref**: `WB19-D1` (Trang 7 PDF)
- **Nội dung sư phạm**: Chạm chọn hình vuông vàng má hồng giữa tam giác và hình tròn; khẳng định đặc điểm 4 cạnh bằng nhau.

#### 8. `GL-C2-GEO-MATCH-0102` (Nối Hình Vuông Với Khung Cửa Sổ & Hộp Quà)
- **Engine**: `GT-005` (`pair-matching`)
- **Band**: `3-4` | **Difficulty**: `2` | **Access Tier**: `login`
- **Montessori Ref**: `WB19-D4` (Trang 16, 24 PDF)
- **Nội dung sư phạm**: Nối hình vuông với Khung cửa sổ 4 ô vuông 🪟, Hộp quà thắt nơ đỏ 🎁, Viên gạch lát 🧱.

#### 9. `GL-C2-GEO-SLOT-0101` (Kéo Thả Khối Vuông Vào Khung Cung Điện)
- **Engine**: `GT-008` (`drag-to-slot`)
- **Band**: `4-5` | **Difficulty**: `3` | **Access Tier**: `standard`
- **Montessori Ref**: `WB19-D1` (Trang 15 PDF)
- **Nội dung sư phạm**: Kéo thả các khối hình vuông kích thước khác nhau vào các ô khuyết tường thành lâu đài.

---

### 6.4 Nhóm Skill `C2.GEO.01` — Hình Tròn (Đường Cong Kín, Không Cạnh Góc, Lăn Tròn)

#### 10. `GL-C2-GEO-CARD-0101` (Khám Phá Hình Tròn Lăn Lông Lốc)
- **Engine**: `GT-001` (`tap-select`)
- **Band**: `3-4` | **Difficulty**: `1` | **Access Tier**: `free`
- **Montessori Ref**: `WB19-D1` (Trang 9, 18 PDF)
- **Nội dung sư phạm**: Thỏ Sáng Tạo giới thiệu hình tròn không có cạnh, không có góc, lăn được. Bé chạm chọn các hình tròn màu sắc.

#### 11. `GL-C2-GEO-MATCH-0101` (Nối 1-Nhiều: Hình Tròn Và Các Đồ Vật Tròn)
- **Engine**: `GT-005` (`pair-matching` 1-to-many)
- **Band**: `3-4` | **Difficulty**: `2` | **Access Tier**: `login`
- **Montessori Ref**: `WB19-D4` (Trang 10, 19 PDF)
- **Nội dung sư phạm**: Từ 1 hình tròn ở giữa, bé kéo dây nối tới cả 3 đồ vật tròn: Quả bóng ⚽, Mặt trời ☀️, Bánh xe ô tô 🛞.

#### 12. `GL-C2-GEO-CARD-0102` (Trắc Nghiệm Đặc Tính Cơ Học Lăn Của Hình Tròn)
- **Engine**: `GT-001` (`tap-select`)
- **Band**: `4-5` | **Difficulty**: `3` | **Access Tier**: `standard`
- **Montessori Ref**: `WB19-D1` (Trang 18 PDF)
- **Nội dung sư phạm**: Câu hỏi: *"Vì sao bạn hình tròn lăn được?"* $\rightarrow$ [Vì bạn ấy không có góc, không có cạnh cản trở].

---

### 6.5 Nhóm Skill `C2.ROT.01` — Tính Bất Biến Qua Phép Quay Không Gian

#### 13. `GL-C2-ROT-CARD-0101` (Tam Giác Xoay Các Hướng Vẫn Là Tam Giác)
- **Engine**: `GT-001` (`tap-select`)
- **Band**: `3-4` | **Difficulty**: `2` | **Access Tier**: `login`
- **Montessori Ref**: `WB19-D2` (Trang 3, 4 PDF)
- **Nội dung sư phạm**: Lưới 8 hình có tam giác xoay hướng lên, xoay sang trái, xoay sang phải. Bé khoanh chọn tất cả các hình tam giác bất kể hướng quay.

#### 14. `GL-C2-ROT-CARD-0102` (Hình Vuông Xoay Nghiêng 45 Độ)
- **Engine**: `GT-001` (`tap-select`)
- **Band**: `4-5` | **Difficulty**: `3` | **Access Tier**: `standard`
- **Montessori Ref**: `WB19-D2` (Trang 8 PDF)
- **Nội dung sư phạm**: Bé tìm và khoanh hình vuông chuẩn và hình vuông xoay nghiêng 45 độ (dễ nhầm thành hình thoi); phân biệt với hình tam giác và chữ nhật nhiễu.

---

### 6.6 Nhóm Skill `C3.CLS.02` — Phân Biệt Đối Lập & Phân Loại 4 Giỏ Hình Học

#### 15. `GL-C3-CLS-SLOT-0101` (Phân Loại Nhị Phân: Hộp Vuông vs Hộp Chữ Nhật)
- **Engine**: `GT-008` (`drag-to-slot` / basket)
- **Band**: `4-5` | **Difficulty**: `2` | **Access Tier**: `login`
- **Montessori Ref**: `WB19-D6` (Trang 17 PDF)
- **Nội dung sư phạm**: 6 thẻ hình (3 vuông, 3 chữ nhật) trôi trên khay. Bé kéo thả vào đúng 2 hộp: "Hộp Hình Vuông" và "Hộp Hình Chữ Nhật".

#### 16. `GL-C3-CLS-BSK-0101` (Phân Loại Tổng Hợp 4 Giỏ: Tam Giác, Chữ Nhật, Vuông, Tròn)
- **Engine**: `GT-008` (`drag-to-slot` 4 baskets)
- **Band**: `4-5` | **Difficulty**: `3` | **Access Tier**: `standard`
- **Montessori Ref**: `WB19-D6` (Trang 21 PDF)
- **Nội dung sư phạm**: Phân loại 8 thẻ hình hỗn hợp vào 4 giỏ màu sắc tươi sáng mang nhãn 4 hình học cơ bản.

---

### 6.7 Nhóm Skill Bổ Trợ `C1.CNT.01` & `C1.PAT.01` (Đếm Ma Trận & Quy Luật Chuỗi Lặp)

#### 17. `GL-C1-CNT-TAP-0101` (Đếm Ma Trận Hình Mật Độ Cao 18 Hình)
- **Engine**: `GT-002` (`counting-tap`)
- **Band**: `4-5` | **Difficulty**: `3` | **Access Tier**: `standard`
- **Montessori Ref**: `WB19-D5` (Trang 23 PDF)
- **Nội dung sư phạm**: Ma trận 18 hình học trộn lẫn. Bé đếm số lượng của từng loại hình: 5 tam giác, 4 chữ nhật, 6 vuông, 3 tròn. Chạm vào hình để đếm và hiển thị sao tick.

#### 18. `GL-C1-PAT-SLOT-0101` (Giải Mã Chuỗi Quy Luật Hình Lặp ABAB / AABAAB)
- **Engine**: `GT-003` (`pattern-completion`)
- **Band**: `4-5` | **Difficulty**: `3` | **Access Tier**: `standard`
- **Montessori Ref**: `WB19-D7` (Trang 24 PDF)
- **Nội dung sư phạm**: Băng chuyền hình tuần hoàn: [Tam giác - Chữ nhật - Tam giác - Chữ nhật - ?] hoặc [Vuông - Vuông - Tròn - Vuông - Vuông - ?]. Bé chọn hình đúng kéo vào ô trống để thông đoàn tàu.

---

## 7. Ma Trận Đối Chiếu & Bù Đắp Lỗ Hổng

| Dạng bài trong PDF | Trang PDF | Engine hiện hữu | Skill Code | Level Plan ID | Difficulty / Tier | Giải quyết điểm nghẽn |
|---|---|:---:|:---:|:---:|:---:|---|
| Khám phá Tam giác (3 cạnh, 3 đỉnh) | 2, 4 | `GT-001` | `C2.GEO.03` | `GL-C2-GEO-CARD-0104`<br>`GL-C2-GEO-CARD-0105` | Diff 1 (`free`)<br>Diff 3 (`standard`) | Bù đắp cho C2.GEO.03 vốn chỉ có 3 level |
| Nối Tam giác với đồ vật Pizza/Diều | 3, 24 | `GT-005` | `C2.GEO.03` | `GL-C2-GEO-MATCH-0103` | Diff 2 (`login`) | Tích hợp liên hệ đồ vật thực tế |
| Khám phá Chữ nhật (2 dài, 2 ngắn) | 5, 12 | `GT-001` | `C2.GEO.04` | `GL-C2-GEO-CARD-0106`<br>`GL-C2-GEO-CARD-0107` | Diff 1 (`free`)<br>Diff 3 (`standard`) | Bổ sung nhận diện chữ nhật ngang/đứng |
| Nối Chữ nhật với Cửa gỗ/Sách | 6, 24 | `GT-005` | `C2.GEO.04` | `GL-C2-GEO-MATCH-0104` | Diff 2 (`login`) | Gắn liền vật thể đời sống quen thuộc |
| Khám phá Vuông (4 cạnh bằng nhau) | 7, 15 | `GT-001`<br>`GT-008` | `C2.GEO.02` | `GL-C2-GEO-CARD-0103`<br>`GL-C2-GEO-SLOT-0101` | Diff 1 (`free`)<br>Diff 3 (`standard`) | Rèn luyện nhận diện cạnh bằng nhau |
| Nối Vuông với Khung cửa sổ/Hộp quà | 16, 24 | `GT-005` | `C2.GEO.02` | `GL-C2-GEO-MATCH-0102` | Diff 2 (`login`) | Khắc sâu hình khối vuông đời sống |
| Khám phá Tròn (0 cạnh góc, lăn được)| 9, 18 | `GT-001` | `C2.GEO.01` | `GL-C2-GEO-CARD-0101`<br>`GL-C2-GEO-CARD-0102` | Diff 1 (`free`)<br>Diff 3 (`standard`) | Khám phá đặc tính cơ học lăn tròn |
| Nối 1-Nhiều Tròn: Bóng/Mặt trời/Bánh xe | 10, 19 | `GT-005` | `C2.GEO.01` | `GL-C2-GEO-MATCH-0101` | Diff 2 (`login`) | Nối 1 hình tới nhiều vật thể cùng loại |
| Tam giác xoay hướng & Vuông nghiêng 45° | 3, 8, 14 | `GT-001` | `C2.ROT.01` | `GL-C2-ROT-CARD-0101`<br>`GL-C2-ROT-CARD-0102` | Diff 2 (`login`)<br>Diff 3 (`standard`) | Củng cố tính bất biến phép quay |
| Phân loại hộp Vuông vs Chữ nhật | 17 | `GT-008` | `C3.CLS.02` | `GL-C3-CLS-SLOT-0101` | Diff 2 (`login`) | Phân biệt đối lập tỉ lệ cạnh |
| Phân loại tổng hợp 4 giỏ | 21 | `GT-008` | `C3.CLS.02` | `GL-C3-CLS-BSK-0101` | Diff 3 (`standard`) | Hoạt động tổng hợp phân loại 4 nhóm |
| Đếm ma trận hỗn hợp 18 hình | 23 | `GT-002` | `C1.CNT.01` | `GL-C1-CNT-TAP-0101` | Diff 3 (`standard`) | Lọc nhiễu & đếm đa nhóm đồng thời |
| Quy luật chuỗi lặp ABAB/AABAAB | 24 | `GT-003` | `C1.PAT.01` | `GL-C1-PAT-SLOT-0101` | Diff 3 (`standard`) | Tư duy quy luật tuần hoàn |

---

## 8. Tiêu Chuẩn Đảm Bảo Chất Lượng & Tuân Thủ Quy Tắc (QA & Rule Compliance)

1. **Tuân thủ Tuyệt Đối `BR-MCM-06`**:
   - Toàn bộ văn bản không chứa bất kỳ từ khóa cấm nào: `raven`, `iq`, `trí tuệ`, `chỉ số thông minh`, `wisc`, `trắc nghiệm trí tuệ`.
   - Danh hiệu thưởng là **"Huy Hiệu Thành Phố Hình Khối"** (Geometric City Badge).
2. **Quy tắc Naming & Architecture**:
   - Toàn bộ mã level chuẩn định dạng `GL-<COMP>-<STRAND>-<MECH>-01xx` với sequence $\ge 0101$ (`BR-MGL-02`).
   - Cấp bậc truy cập `access_tier` khớp chính xác với `difficulty`: 1=`free`, 2=`login`, 3=`standard`, 4/5=`premium` (`BR-MGL-12`).
   - Không tạo mới engine `GT-038+`. Hủy bỏ hoàn toàn `GT-056` và `GT-017` cho WB19.
3. **Tiêu Chuẩn Game Engine & Canvas 2D (`07-game-engine.md`)**:
   - Độ phân giải logic cố định: 960x540.
   - Không sử dụng hex literal trực tiếp; 100% màu sắc và font chữ lấy từ `designTokens.ts`.
   - Bán kính chạm (Touch floor) $\ge 64$px cho mầm non.
   - Phản hồi Montessori: Đúng pop nhẹ tại điểm chạm; sai hiển thị nhịp hổ phách (`amber_soft`) kèm âm thanh ramp $\ge 20$ms, không buzzer, không trừ điểm.
