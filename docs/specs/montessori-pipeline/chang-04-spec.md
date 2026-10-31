---
spec: MONTESSORI-CHANG-04-SPEC
title: "Chặng 4: Quảng Trường Số Lượng — Đếm Nhanh Chọn Đúng & Khôi Phục Biển Số"
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-04
workbook_ref: WB04
owns:
  - Phân tích sư phạm và giải mã 23 trang PDF Chặng 4 (analysis.json)
  - Ánh xạ 3 dạng bài WB04-D1, WB04-D2, WB04-D3 vào các game engine hiện tại GT-000, GT-001, GT-022, GT-028
  - Thiết kế làm giàu SkillDataset (items, relations, phrasing) từ bối cảnh Quảng Trường Số Lượng
  - Thiết kế SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101)
  - Cập nhật định tuyến phân loại từ Lô B (hoãn GT-012) sang Lô A (nhận trên GT-001/028/022/000)
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 4: Quảng Trường Số Lượng — Đếm Nhanh Chọn Đúng & Khôi Phục Biển Số

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu đặc tả này sở hữu thiết kế sư phạm và kỹ thuật nhằm số hóa toàn bộ nội dung từ tài liệu PDF **"Chặng 4: Quảng Trường Số Lượng — Đếm thật nhanh, chọn thật đúng"** (`docs/montessori/extracted/chang-04/analysis.json`, nguồn: *Chuyến Tàu Toán Học Tập 4*, 23 trang, bộ giáo trình toán Montessori mầm non *Gấu Logic & Thỏ Quan Sát*) vào nền tảng **TiniMath v2**.

### 1.1 Mục tiêu chiến lược & Phát hiện cốt lõi
1. **Khắc phục khoảng trống dữ liệu (0 Montessori levels hiện tại)**:
   - Trước phân tích này, `WB04` (`WB04-D1`, `WB04-D2`, `WB04-D3`) bị phân loại nhầm thành "Chớp mắt nhận diện chấm xúc xắc / flash-recall" và bị hoãn vào Lô B chờ khuôn `GT-012`.
   - Dữ liệu trích xuất thực tế từ 23 trang PDF cho thấy `WB04` thực chất là **Quảng Trường Số Lượng (Quantity Square)**: rèn luyện kỹ năng đếm tương ứng 1-1, nhận biết bản số (Cardinality Principle) trong phạm vi 1–12, đối chiếu số với lượng và đếm phân loại trong bối cảnh thực tế.
   - Toàn bộ 23 trang PDF hoàn toàn tương thích và khai thác tối đa **các Game Engine hiện hữu (`GT-001`, `GT-028`, `GT-022`, `GT-000`)**.
2. **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**:
   - Tận dụng 100% năng lực tương tác của 4 engine đã hoàn thiện trong registry `@mindkid/game-engine`:
     - `GT-001` (tap-select): Lựa chọn 1 thẻ số đúng trong 3 thẻ số nhiễu liền kề (D1) hoặc chọn 1 trong 2 nhóm đồ vật khớp số mục tiêu trung tâm (D2).
     - `GT-028` (tap-count): Tương tác chạm đếm tích luỹ từng vật thể (vật chạm phát sáng, nở hiệu ứng hạt và âm đọc số đếm tăng tiến) trước khi đưa ra quyết định chốt số.
     - `GT-022` (hidden-object): Quan sát bức tranh toàn cảnh Quảng trường số lượng, tìm kiếm và đếm số lượng các vật phẩm thất lạc biển số (D3).
     - `GT-000` (concept-intro): Khung cảnh mở màn giới thiệu nhiệm vụ (Page 1) và nghi thức mừng công trao tặng "Viên Ngọc Số Lượng" (Page 23).
3. **Làm giàu kho ngữ liệu `SkillDataset` & Database Seeder**:
   - Bổ sung hệ thống vật phẩm phong phú theo 12 chủ đề gian hàng quảng trường: Trái cây tươi, rau củ mùa thu, vườn côn trùng, tiệm bánh ngọt, thế giới đồ chơi, đồ gốm, khủng long, luống hoa, dụng cụ học tập, đồ dùng ăn uống, dụng cụ thể thao, trứng phục sinh sắc màu.
   - Cấp phát 11 `SkillLevelPlan[]` chuẩn `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), gắn `montessori_ref: "WB04-D1"`, `"WB04-D2"`, `"WB04-D3"`.
   - Phân tầng `access_tier` khớp chính xác `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4/5: `premium`), tuân thủ nghiêm ngặt `BR-MCM-06` (tuyệt đối không chứa từ khóa thương mại IQ/Raven/trí tuệ).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò hệ thống | Vai trò sư phạm & Đặc điểm nhận diện |
|---|---|---|
| **Bé (Kid Player)** | Người học chính (3–6 tuổi) | Hóa thân thành Hiệp sĩ Toán học nhí, ghé thăm Quảng Trường Số Lượng để giúp đỡ các chủ gian hàng tìm lại và khôi phục những tấm biển số bị thất lạc. |
| **Gấu Logic (`gau_logic`)** | Nhân vật dẫn dắt tư duy (Cognitive Guide) | Đại diện tư duy phân tích, quy tắc và chiến lược đếm hệ thống (đếm từ trái sang phải, đếm hàng trên trước hàng dưới sau). Gấu nâu đeo kính tròn xanh, áo gile xanh cúc vàng, cầm sổ kiểm kê checklist. Câu thoại tiêu biểu: *"Các tấm biển số đã biến mất rồi!", "Mỗi loại rau củ cần một tấm biển số!", "Mỗi con số chỉ mở được một nhóm đúng!", "Bé đã khôi phục đủ những tấm biển số lượng!"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Trợ lý giác quan & Tinh mắt (Sensory Assistant) | Đại diện khả năng quan sát chi tiết, phân biệt hình - nền, kiểm soát lỗi đếm sót và đếm lặp. Thỏ trắng mang túi đeo chéo cam, tay cầm kính lúp viền đỏ cam. Câu thoại tiêu biểu: *"Bé đếm từng nhóm và tìm số đúng nhé!", "Bé đếm thật chậm để không bỏ sót nhé!", "Bé nhìn từ trái sang phải rồi đếm nhé!", "Bé đếm cả hai bên rồi khoanh nhé!", "Viên Ngọc Số Lượng đã sáng lên rồi!"*. |
| **Phụ huynh / Giáo viên** | Người đồng hành ngoại tuyến | Thực hiện gợi ý 3 mức Montessori: (1) Nhắc trẻ chỉ tay vào từng hình; (2) Hướng dẫn chia nhóm theo hàng; (3) Hướng dẫn đếm kiểm tra lại hai lần. |
| **Content Seeder Engine** | Bộ dựng cấp phát nội dung | Đọc cấu hình `SkillSeed` từ `packages/content/src/skills/c1/` để sinh `ContentSeed` xác thực qua bộ cổng `montessori-gate`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-04/analysis.json (23 trang PDF)
   │
   ├──> docs/montessori/dataset/activity-types-table.md
   │      (Chuyển WB04-D1..D3 từ Hoãn Lô B/GT-012 sang Nhận Lô A/GT-001, GT-028, GT-022, GT-000)
   ├──> docs/specs/05-content/montessori-corpus-mapping.md
   │      (Cập nhật hàng 04 sang Khuôn Lô A: GT-001, GT-028, GT-022, GT-000)
   │
   ├──> packages/content/src/skills/c1/cnt/C1.CNT.01.ts
   │      ├── Level WB04-D1 (GT-001): GL-C1-CNT-TAP-0121 (diff 1, free)
   │      ├── Level WB04-D1 (GT-028): GL-C1-CNT-TCNT-0122 (diff 1, free)
   │      └── Level WB04-D3 (GT-022): GL-C1-CNT-HIDE-0129 (diff 2, login)
   ├──> packages/content/src/skills/c1/cnt/C1.CNT.06.ts
   │      └── Level WB04-D1 (GT-001): GL-C1-CNT-TAP-0123 (diff 2, login)
   ├──> packages/content/src/skills/c1/cnt/C1.CNT.07.ts
   │      ├── Level WB04-D1 (GT-001): GL-C1-CNT-TAP-0124 (diff 3, standard)
   │      ├── Level WB04-D1 (GT-028): GL-C1-CNT-TCNT-0125 (diff 4, premium)
   │      └── Level WB04-D3 (GT-022): GL-C1-CNT-HIDE-0130 (diff 3, standard)
   ├──> packages/content/src/skills/c1/cmp/C1.CMP.04.ts
   │      ├── Level WB04-D2 (GT-001): GL-C1-CMP-TAP-0126 (diff 1, free)
   │      └── Level WB04-D2 (GT-001): GL-C1-CMP-TAP-0127 (diff 2, login)
   └──> packages/content/src/skills/c1/oto/C1.OTO.01.ts
          ├── Level WB04-D2 (GT-001): GL-C1-OTO-TAP-0128 (diff 2, login)
          └── Level WB04-D3 (GT-000): GL-C1-OTO-INTRO-0131 (diff 1, free)
```

- **Game Engine Templates tương thích**:
  - `GT-001`: `packages/game-engine/src/templates/GT-001/` (Single Choice Tap Select).
  - `GT-028`: `packages/game-engine/src/templates/GT-028/` (Cumulative Tap Count).
  - `GT-022`: `packages/game-engine/src/templates/GT-022/` (Hidden Object / Find and Count).
  - `GT-000`: `packages/game-engine/src/templates/GT-000/` (Concept Introduction / Onboarding Scene).
- **Phạm vi kiểm thử & Xác thực**:
  - `packages/content-build/tests/gates/montessori-corpus.test.ts`.
  - `packages/content/tests/builders/gt-001.test.ts`.
  - `packages/content/tests/builders/build-levels.test.ts`.

---

## 4. Phân Tích Sư Phạm & Ánh Xạ Dạng Bài (D1, D2, D3)

### 4.1 Dạng 1 (`WB04-D1`): Đếm vật thể và chọn số đúng trong 3 lựa chọn
- **Số trang PDF nguồn**: 17 trang (Trang 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22), tổng cộng 51 câu hỏi/rounds.
- **Mô tả sư phạm Montessori & CPA**:
  - Trẻ quan sát nhóm vật thể trực quan (Concrete/Pictorial), thực hiện đếm tương ứng 1-1 (One-to-one correspondence), kích hoạt nguyên lý bản số (Cardinality: số đếm cuối cùng đại diện cho tổng số lượng), sau đó đối chiếu và chọn đúng 1 trong 3 thẻ chữ số tượng trưng (Abstract Symbol).
- **Quy luật tạo phương án gây nhiễu (Distractor Rule)**:
  - 2 số gây nhiễu luôn là số liền trước ($N - 1$) và số liền sau ($N + 1$) của số lượng đúng $N$ (hoặc trong khoảng $\pm 1, \pm 2$). Ví dụ: đúng 4 $\rightarrow$ lựa chọn $[5, 3, 4]$ hoặc $[3, 4, 5]$.
  - Mục đích sư phạm: Ngăn chặn triệt để đoán mò, bẫy các lỗi đếm phổ biến của trẻ mầm non (đếm thiếu 1 do bỏ sót hoặc đếm thừa 1 do chạm lặp).
- **Tiến trình tăng tiến 4 giai đoạn**:
  - *Giai đoạn 1 (Cơ bản 1–5, Trang 2–6)*: Xếp 1 hàng ngang hoặc tam giác thưa. Vật quen thuộc: Táo (2), Chuối (3), Lê (4), Bí ngô (1), Cà rốt (3), Cà chua (5), Bướm (2), Bọ rùa (4), Ong (3), Bánh sừng bò (3), Bánh mì (5), Cupcake (4), Gấu bông (2), Khối gỗ (3), Ô tô (5).
  - *Giai đoạn 2 (Mở rộng 1–8, Trang 7–11)*: Bố cục 2 hàng ngang song song, bắt đầu rèn luyện chiến lược đếm từ trái sang phải. Vật: Mèo (4), Chó (6), Cá (5), Hoa cúc (7), Hướng dương (6), Hồng (8), Xe tải (5), Cứu thương (6), Trực thăng (7), Tách trà (6), Bình gốm (7), Đĩa (8).
  - *Giai đoạn 3 (Phát triển 5–10, Trang 12–16)*: Mật độ dày, kiểm soát đếm sót. Khủng long bạo chúa (7), Bay (8), Cổ dài (9), Tulip (8), Cẩm chướng (9), Hướng dương (10), Bút chì (7), Thước kẻ (8), Cọ vẽ (9), Thìa (8), Dĩa (9), Cốc (10).
  - *Giai đoạn 4 (Thử thách tối đa 8–12, Trang 20–22)*: Cấu trúc Ten-frame mở rộng và ma trận 2 hàng ($5+4, 5+5, 6+5, 6+6$). Bóng đá (9), Bóng rổ (10), Cầu lông (11), Trứng phục sinh (10, 11, 12), Hộp quà (10), Khối lập phương (11), Chuông vàng (12).
- **Ánh xạ Engine**:
  - **`GT-001` (Tap-Select)**: Hiển thị nhóm đối tượng trên Canvas, 3 nút bấm thẻ số phía dưới với sàn cảm ứng $\ge 72\text{px}$ – $96\text{px}$.
  - **`GT-028` (Tap-Count)**: Chế độ đếm tích luỹ. Khi trẻ chạm vào từng vật thể, vật thể rung rinh nhẹ, âm thanh đọc số "Một", "Hai", "Ba"... vang lên và để lại dấu sao sáng, giúp trẻ không bị đếm lặp.

### 4.2 Dạng 2 (`WB04-D2`): Nhìn số ở giữa và chọn nhóm có số lượng đúng
- **Số trang PDF nguồn**: 3 trang (Trang 17, 18, 19), tổng cộng 9 câu hỏi/rounds.
- **Mô tả sư phạm Montessori & CPA**:
  - Cơ chế truy vấn ngược (Reverse Matching): Ở trung tâm là một huy hiệu số màu vàng (Target Number $N$). Hai bên trái và phải là hai nhóm đồ vật khác nhau về chủng loại và số lượng.
  - Trẻ phải quan sát số mục tiêu, đếm độc lập cả hai nhóm (Nhóm A và Nhóm B), thực hiện so sánh lượng ($N_A = N$ hay $N_B = N$) và chạm chọn nhóm chính xác.
- **Quy luật tạo phương án gây nhiễu & Bẫy thị giác**:
  - Nhóm sai có số lượng lệch 1–2 vật so với mục tiêu (ví dụ Target = 4: Trái = 2 dưa hấu, Phải = 4 cam; Target = 3: Trái = 3 kiến, Phải = 2 cá; Target = 5: Trái = 2 nhà ngói, Phải = 5 nhà nhỏ).
  - Bẫy thị giác kích thước (Size illusion trap): Trang 19 sử dụng 1 tòa chung cư cao tầng nhiều cửa sổ để bẫy trẻ đếm số tầng thay vì đếm số lượng tòa nhà.
- **Ánh xạ Engine**:
  - **`GT-001` (Tap-Select với bố cục đối xứng `split-left-right`)**: Huy hiệu Target Number đặt ở trục giữa trên đỉnh. Hai ô chọn lớn đại diện cho nhóm Trái và nhóm Phải. Chạm vào nhóm đúng sẽ nở hoa ăn mừng.

### 4.3 Dạng 3 (`WB04-D3`): Bức tranh Quảng trường số lượng: Đếm phân loại và khôi phục biển số
- **Số trang PDF nguồn**: 2 trang (Trang 1 mở đầu & Trang 23 kết thúc).
- **Mô tả sư phạm Montessori & CPA**:
  - Bối cảnh toàn cảnh Quảng trường trung tâm thị trấn: Các gian hàng rau củ, xe hoa quả, tiệm bánh, chùm bóng bay, giỏ gấu bông đều bị mất biển số (cắm cờ dấu hỏi `?`).
  - Trẻ rèn luyện năng lực tách lọc hình - nền (Figure-Ground Discrimination): Tìm kiếm các đối tượng nằm rải rác trong khung cảnh phức hợp, đếm số lượng từng loại và gắn lại biển số tương ứng.
- **Ánh xạ Engine**:
  - **`GT-022` (Hidden-Object / Find-and-Count)**: Bức tranh Quảng trường hiển thị trên Canvas $960 \times 540$. Trẻ nhận nhiệm vụ tìm và đếm đủ số lượng của đối tượng chỉ định (ví dụ: "Bé hãy tìm đủ 4 quả táo đỏ trong quảng trường nhé!"). Mỗi lần tap trúng vật thể ẩn, đối tượng phát sáng bay về khay kiểm đếm.
  - **`GT-000` (Concept-Intro / Celebration)**: Onboarding giới thiệu cốt truyện Chuyến Tàu Toán Học tới Ga số 4 và Lễ mừng công trao tặng "Viên Ngọc Số Lượng" khi hoàn thành.

---

## 5. Business Rules & Bộ Tiêu Chuẩn Kỹ Thuật

| ID | Quy tắc nghiệp vụ | Căn cứ & Cách cưỡng chế |
|---|---|---|
| `BR-MCM-06` | **Tuyệt đối không dùng từ khóa thương mại đo trí tuệ** | Cấm mọi từ ngữ: IQ, Raven, bài test trí tuệ trong toàn bộ title, instruction, metadata. Nội dung thuần túy sư phạm Montessori cảm thức số học. |
| `BR-MGL-02` | **Khối mã số thứ tự dành riêng cho Montessori** | Mọi mã `SkillLevelPlan` tạo ra phải có sequence $\ge 0101$ (ví dụ: `GL-C1-CNT-TAP-0121`, `GL-C1-CMP-TAP-0126`). Không được chen vào dải 0001–0050. |
| `BR-MGL-04` | **Tăng tiến một chiều (One-dimension progression)** | Trong cùng một dạng bài, level sau chỉ tăng duy nhất 1 chiều độ khó (tăng dải số $1–5 \rightarrow 1–8 \rightarrow 1–12$, hoặc tăng số lượng lựa chọn gây nhiễu), không đổi đồng thời cả bố cục lẫn dải số. |
| `BR-MGL-12` | **Phân tầng `access_tier` khớp chính xác `difficulty`** | Độ khó 1 = `free`; Độ khó 2 = `login`; Độ khó 3 = `standard`; Độ khó 4/5 = `premium`. Tuyệt đối không để trống `access_tier`. |
| `BR-E001-01` | **Sàn cảm ứng đạt chuẩn theo lứa tuổi (Touch Floor)** | Band 3–4 tuổi: Hitbox đường kính $\ge 96\text{px}$; Band 4–5 và 5–6 tuổi: Hitbox $\ge 72\text{px}$. Kích thước thẻ số trên Canvas $960 \times 540$ đạt tối thiểu $120\text{px} \times 80\text{px}$. |
| `BR-E001-02` | **100% Design Tokens, 0 Hex Literals** | Toàn bộ màu vẽ Canvas lấy từ `designTokens.colors` (`brand-500`, `amber-400`, `surface-100`...). Cấm chuỗi `#hex` trong code rendering. |
| `BR-E001-03` | **Phản hồi không trừng phạt & Kiểm soát lỗi tự thân** | Khi bấm sai số: Thẻ số rung nhẹ nhịp thở hổ phách (`amber_soft`, 340ms), âm thanh nhẹ nhàng, không đổi màu đỏ, không phát tiếng buzzer còi báo động lỗi. |
| `BR-E028-01` | **Chạm đếm tích luỹ có neo âm thanh chuẩn tiếng Việt** | Trong `GT-028`, mỗi lần chạm vật thể phát âm rõ ràng từ số ("Một", "Hai"...), số thứ tự hiện nổi 400ms trên đầu vật thể rồi mờ dần, vật thể chuyển trạng thái `counted`. |

---

## 6. Thiết Kế Làm Giàu `SkillDataset` (Bổ Sung Vào Seeder)

Để phục vụ tốt nhất 11 level mới từ Chặng 4, các file seeder trong `packages/content/src/skills/c1/` cần được làm giàu các vật phẩm, quan hệ và câu thoại lấy cảm hứng trực tiếp từ 23 trang PDF.

### 6.1 Bổ sung vào `C1.CNT.01` (`packages/content/src/skills/c1/cnt/C1.CNT.01.ts`)
- **Vật phẩm bổ sung (`items`)**:
  ```typescript
  // Gian hàng trái cây & Rau củ Chặng 4
  {
    id: "cnt01_wb04_apple_pair",
    label: "hai quả táo đỏ",
    glyph: "🍎🍎",
    value: 2,
    contrast_group: "fruit",
    ordering: 6,
    category: { type: "trái cây chợ" },
    image: { kind: "emoji", ref: "🍎" },
  },
  {
    id: "cnt01_wb04_banana_trio",
    label: "ba quả chuối vàng",
    glyph: "🍌🍌🍌",
    value: 3,
    contrast_group: "fruit",
    ordering: 7,
    category: { type: "trái cây chợ" },
    image: { kind: "emoji", ref: "🍌" },
  },
  {
    id: "cnt01_wb04_pear_four",
    label: "bốn quả lê xanh",
    glyph: "🍐🍐🍐🍐",
    value: 4,
    contrast_group: "fruit",
    ordering: 8,
    category: { type: "trái cây chợ" },
    image: { kind: "emoji", ref: "🍐" },
  },
  {
    id: "cnt01_wb04_tomato_five",
    label: "năm quả cà chua",
    glyph: "🍅🍅🍅🍅🍅",
    value: 5,
    contrast_group: "vegetable",
    ordering: 9,
    category: { type: "rau củ chợ" },
    image: { kind: "emoji", ref: "🍅" },
  }
  ```
- **Bộ câu thoại (`phrasing`)**:
  ```typescript
  phrasing: {
    prompt_template: "Bé hãy đếm xem có bao nhiêu {label} rồi chọn số đúng nhé!",
    narration_template: "Gấu Logic và Thỏ Quan Sát đang cùng bé đếm số lượng tại quảng trường.",
  }
  ```

### 6.2 Bổ sung vào `C1.CNT.07` (`packages/content/src/skills/c1/cnt/C1.CNT.07.ts`)
- **Vật phẩm bổ sung (`items`) cho dải đếm 6–12**:
  ```typescript
  {
    id: "cnt07_wb04_soccer_nine",
    label: "chín quả bóng đá",
    glyph: "⚽",
    value: 9,
    contrast_group: "sport",
    ordering: 11,
    category: { type: "dụng cụ thể thao" },
    image: { kind: "emoji", ref: "⚽" },
  },
  {
    id: "cnt07_wb04_basket_ten",
    label: "mười quả bóng rổ",
    glyph: "🏀",
    value: 10,
    contrast_group: "sport",
    ordering: 12,
    category: { type: "dụng cụ thể thao" },
    image: { kind: "emoji", ref: "🏀" },
  },
  {
    id: "cnt07_wb04_egg_eleven",
    label: "mười một quả trứng phục sinh",
    glyph: "🥚",
    value: 11,
    contrast_group: "festival",
    ordering: 13,
    category: { type: "lễ hội" },
    image: { kind: "emoji", ref: "🥚" },
  },
  {
    id: "cnt07_wb04_bell_twelve",
    label: "mười hai chiếc chuông vàng",
    glyph: "🔔",
    value: 12,
    contrast_group: "festival",
    ordering: 14,
    category: { type: "lễ hội" },
    image: { kind: "emoji", ref: "🔔" },
  }
  ```

### 6.3 Bổ sung vào `C1.CMP.04` (`packages/content/src/skills/c1/cmp/C1.CMP.04.ts`)
- **Dataset đối chiếu 2 nhóm D2**:
  ```typescript
  const CHANG_04_D2_DATASET: SkillDataset = {
    skill_code: "C1.CMP.04",
    concept_label: "Nhìn số ở giữa chọn nhóm đúng",
    surface: "game",
    items: [
      {
        id: "d2_target_3_strawberries",
        label: "ba quả dâu tây",
        glyph: "🍓🍓🍓",
        value: 3,
        contrast_group: "fruit_compare",
        ordering: 1,
        category: { type: "nhóm đúng" },
        image: { kind: "emoji", ref: "🍓" },
      },
      {
        id: "d2_distractor_2_lemons",
        label: "hai quả chanh vàng",
        glyph: "🍋🍋",
        value: 2,
        contrast_group: "fruit_compare",
        ordering: 2,
        category: { type: "nhóm sai" },
        image: { kind: "emoji", ref: "🍋" },
      },
      {
        id: "d2_target_4_grasshoppers",
        label: "bốn chú cào cào",
        glyph: "🦗🦗🦗🦗",
        value: 4,
        contrast_group: "insect_compare",
        ordering: 3,
        category: { type: "nhóm đúng" },
        image: { kind: "emoji", ref: "🦗" },
      },
      {
        id: "d2_distractor_1_caterpillar",
        label: "một chú sâu xanh",
        glyph: "🐛",
        value: 1,
        contrast_group: "insect_compare",
        ordering: 4,
        category: { type: "nhóm sai" },
        image: { kind: "emoji", ref: "🐛" },
      },
      {
        id: "d2_target_5_cottages",
        label: "năm ngôi nhà tí hon",
        glyph: "🏡🏡🏡🏡🏡",
        value: 5,
        contrast_group: "house_compare",
        ordering: 5,
        category: { type: "nhóm đúng" },
        image: { kind: "emoji", ref: "🏡" },
      },
      {
        id: "d2_distractor_2_houses",
        label: "hai căn nhà lớn",
        glyph: "🏠🏠",
        value: 2,
        contrast_group: "house_compare",
        ordering: 6,
        category: { type: "nhóm sai" },
        image: { kind: "emoji", ref: "🏠" },
      },
    ],
    relations: [
      { type: "contrast", source_id: "d2_target_3_strawberries", target_id: "d2_distractor_2_lemons" },
      { type: "contrast", source_id: "d2_target_4_grasshoppers", target_id: "d2_distractor_1_caterpillar" },
      { type: "contrast", source_id: "d2_target_5_cottages", target_id: "d2_distractor_2_houses" },
    ],
    phrasing: {
      prompt_template: "Bé hãy nhìn số ở giữa và chọn nhóm có số lượng đúng nhé!",
      narration_template: "Thỏ Quan Sát nhắc bé đếm cả hai nhóm trước khi đưa ra quyết định nhé!",
    },
    ordering: [
      "d2_target_3_strawberries",
      "d2_distractor_2_lemons",
      "d2_target_4_grasshoppers",
      "d2_distractor_1_caterpillar",
      "d2_target_5_cottages",
      "d2_distractor_2_houses",
    ],
  };
  ```

---

## 7. Danh Mục Chi Tiết 11 `SkillLevelPlan[]` (Khối Mã $\ge 0101$)

Bảng ma trận 11 level được phân bổ khoa học, đảm bảo bao phủ trọn vẹn 3 dạng bài D1, D2, D3, đủ 3 band tuổi (3–4, 4–5, 5–6), đủ 4 bậc thang difficulty (1, 2, 3, 4) và các access tiers tương ứng.

| Mã Level Plan | Ref Montessori | Template | Kỹ năng chính | Band | Diff | Access Tier | Số lượt | Mô tả sư phạm |
|---|---|:--:|---|:--:|:--:|:--:|:--:|---|
| `GL-C1-CNT-TAP-0121` | `WB04-D1` | `GT-001` | `C1.CNT.01` | `3-4` | 1 | `free` | 3 | Đếm trái cây tươi phạm vi 1–5 (Táo, Chuối, Lê), chọn 1 trong 3 thẻ số liền kề. Bố cục 1 hàng ngang. |
| `GL-C1-CNT-TCNT-0122` | `WB04-D1` | `GT-028` | `C1.CNT.01` | `3-4` | 1 | `free` | 3 | Chạm đếm tích luỹ từng quả rau củ (Bí ngô, Cà rốt, Cà chua) phát âm số đếm 1, 2, 3... trước khi chốt số. |
| `GL-C1-CNT-TAP-0123` | `WB04-D1` | `GT-001` | `C1.CNT.06` | `4-5` | 2 | `login` | 3 | Đếm nhóm thú cưng và bánh ngọt phạm vi 1–8 (Mèo, Chó, Bánh sừng bò, Cupcake), xếp 2 hàng song song. |
| `GL-C1-CNT-TAP-0124` | `WB04-D1` | `GT-001` | `C1.CNT.07` | `5-6` | 3 | `standard` | 3 | Đếm các bạn khủng long và hoa cúc phạm vi 6–10, bố cục mật độ dày, rèn đếm từ trái qua phải. |
| `GL-C1-CNT-TCNT-0125` | `WB04-D1` | `GT-028` | `C1.CNT.07` | `5-6` | 4 | `premium` | 3 | Thử thách đếm chạm dụng cụ thể thao & trứng phục sinh phạm vi 8–12 (Bóng đá, Trứng màu, Chuông vàng). |
| `GL-C1-CMP-TAP-0126` | `WB04-D2` | `GT-001` | `C1.CMP.04` | `3-4` | 1 | `free` | 3 | Nhìn số mục tiêu ở giữa (3, 4), đếm và chọn nhóm quả đúng giữa 2 lựa chọn trái/phải. |
| `GL-C1-CMP-TAP-0127` | `WB04-D2` | `GT-001` | `C1.CMP.04` | `4-5` | 2 | `login` | 3 | Nhìn số mục tiêu ở giữa (4, 5), đếm và chọn đội côn trùng (Cào cào vs Sâu; Kiến vs Cá). |
| `GL-C1-OTO-TAP-0128` | `WB04-D2` | `GT-001` | `C1.OTO.01` | `3-4` | 2 | `login` | 3 | Đối chiếu số trung tâm (5, 6) với khu phố nhà sắc màu; vượt bẫy kích cỡ to/nhỏ của tòa nhà. |
| `GL-C1-CNT-HIDE-0129` | `WB04-D3` | `GT-022` | `C1.CNT.01` | `4-5` | 2 | `login` | 3 | Bức tranh Quảng trường: Tìm kiếm và đếm 2–5 vật thể bị mất biển số (Táo đỏ, Gấu bông, Bóng bay). |
| `GL-C1-CNT-HIDE-0130` | `WB04-D3` | `GT-022` | `C1.CNT.07` | `5-6` | 3 | `standard` | 3 | Bức tranh Quảng trường: Tìm kiếm và đếm 6–10 vật thể phân tán (Bánh kem, Hoa ngũ sắc, Chim nhỏ). |
| `GL-C1-OTO-INTRO-0131` | `WB04-D3` | `GT-000` | `C1.OTO.01` | `3-4` | 1 | `free` | 1 | Bài học 3 bước mở đầu & Mừng công hoàn thành khôi phục toàn bộ biển số, nhận Viên Ngọc Số Lượng. |

---

## 8. Hợp Đồng Vẽ Canvas 2D & Game Loop (Logic Space $960 \times 540$)

### 8.1 Bố cục Canvas cho từng khuôn

1. **`GT-001` (Bố cục D1 — Đếm vật chọn 1 trong 3 số)**:
   - **Vùng trên (y = 40 đến 340)**: Khung trưng bày vật thể `item_container`. Kích thước $800\text{px} \times 280\text{px}$, căn giữa x = 480.
     - Các item được bố trí theo thuật toán Flex/Grid tự động: 1 hàng (cho 1–5 vật) hoặc 2 hàng cân xứng (cho 6–12 vật).
     - Khoảng cách giữa các vật $\ge 24\text{px}$ để tránh chạm nhầm.
   - **Vùng dưới (y = 380 đến 500)**: Khay 3 thẻ số đáp án `options_tray`.
     - 3 ô chữ nhật kích thước $180\text{px} \times 96\text{px}$, bo góc $24\text{px}$, viền $4\text{px}$ màu `surface-300`.
     - Chữ số hiển thị font Nunito/Fredoka cực đại ($48\text{px}$), màu `brand-700`.

2. **`GT-001` (Bố cục D2 — Số ở giữa chọn nhóm đúng)**:
   - **Trục giữa trên (x = 480, y = 90)**: Huy hiệu tròn màu vàng `target_badge` đường kính $110\text{px}$, viền đôi vàng ánh kim `amber-400`, bên trong là số mục tiêu cỡ $56\text{px}$.
   - **Hai cánh Trái - Phải (y = 180 đến 480)**:
     - Khung Trái: $x \in [60, 440]$, kích thước $380\text{px} \times 300\text{px}$, bo góc $28\text{px}$.
     - Khung Phải: $x \in [520, 900]$, kích thước $380\text{px} \times 300\text{px}$, bo góc $28\text{px}$.
     - Mỗi khung chứa một nhóm vật thể trực quan rõ ràng, hitbox bao phủ toàn bộ diện tích khung ($380 \times 300\text{px} \gg 96\text{px}$).

3. **`GT-022` (Bố cục D3 — Bức tranh Quảng trường tìm vật ẩn)**:
   - Toàn màn hình $960 \times 540$ hiển thị bức tranh minh họa Quảng trường trung tâm (các gian hàng, lều rạp, tháp đồng hồ, đường ray).
   - Thanh HUD nhiệm vụ ở mép trên ($960 \times 70\text{px}$): Thỏ Quan Sát cầm kính lúp bên cạnh icon vật cần tìm và bộ đếm tiến trình (ví dụ: `🍎 2 / 4`).

### 8.2 Bảng 4 lớp Render chuẩn

| Lớp | Z-Index | Nội dung vẽ | Hệ thống phụ trách |
|---|:---:|---|---|
| **L1 Nền** | 0 | Gradient bầu trời dịu mát, mặt đất quảng trường lát đá cổ tích, lều bạt gian hàng | `renderSystem.drawBackground()` |
| **L2 Khung chứa & Vật thể** | 10 | Các nhóm trái cây, rau củ, thú cưng, bóng bay, thẻ số mục tiêu, biển báo cờ `?` | `renderSystem.drawEntities()` |
| **L3 Tương tác & Scaffolding** | 20 | Hiệu ứng nhịp thở hổ phách (`amberGlow`), bàn tay ma chỉ dẫn (`ghostHand`), đường nối tương tác | `scaffoldingSystem.render()` |
| **L4 Hiệu ứng & HUD** | 30 | Hạt nổ pop sao vàng, pháo hoa giấy mừng công, thanh tiến trình, icon nhân vật đồng hành | `particleSystem.render()`, HUD |

---

## 9. Scaffolding 3 Mức (Hỗ Trợ Leo Thang)

Tuân thủ nghiêm ngặt quy định không trừng phạt và leo thang hỗ trợ theo thời gian hoặc số lần chạm sai liên tiếp:

- **Mức L1 (Nudge - Nhấp nháy nhẹ sau 10s hoặc 1 lần miss)**:
  - D1: Thẻ số đúng hoặc vùng đồ vật nhấp nháy ánh vàng hổ phách nhẹ (`amber_soft`, độ trong suốt 0.3–0.8 theo chu kỳ 800ms).
  - D2: Nhóm đồ vật có số lượng khớp nhấp nháy viền nhẹ.
- **Mức L2 (Guide - Hướng dẫn sau 18s hoặc 2 lần miss)**:
  - Bàn tay ma (`ghostHand`) xuất hiện trôi từ từ đến chỉ thẳng vào nhóm hoặc thẻ số cần chọn.
  - Giọng Thỏ Quan Sát nhắc nhẹ: *"Bé đếm từng hình từ trái qua phải nhé!"*.
- **Mức L3 (Demonstrate - Trình diễn mẫu sau 25s hoặc 3 lần miss)**:
  - Bàn tay ma thực hiện cử chỉ chạm mẫu chậm $0.5\times$ vào từng vật thể kèm âm đếm "Một", "Hai", "Ba"... rồi trôi xuống chỉ vào thẻ số đúng.

---

## 10. Verification Gates (Kế Hoạch Kiểm Thử)

1. **Typecheck & Lint**:
   - `pnpm --filter @mindkid/content typecheck` exit 0 (không `any`, không `unknown`).
   - `pnpm lint:safe` không vi phạm quy tắc Biome 2.
2. **Kiểm tra Gate nội dung**:
   - `pnpm --filter @mindkid/content-build test packages/content-build/tests/gates/montessori-corpus.test.ts` pass xanh.
   - Xác nhận 11 level mới xuất hiện trong `ALL_SEED_LEVELS`, `montessori_ref` khớp chuẩn.
3. **Round-trip Builder Test**:
   - Chạy `pnpm --filter @mindkid/content test` bảo đảm các builder `GT-001`, `GT-028`, `GT-022`, `GT-000` tạo ra `content_pack` và `difficulty_params` hợp lệ theo schema.
