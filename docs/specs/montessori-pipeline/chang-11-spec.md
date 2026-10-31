---
spec: MONTESSORI-CHANG-11-CASTLE
title: "Chặng 11: Lâu Đài Ô Số — Giải Mã Những Ô Trống & Ma Trận Số Học"
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-11
workbook_ref: WB11
owns:
  - Phân tích sư phạm và giải mã toàn diện 22 trang PDF Chặng 11 (analysis.json / WB11)
  - Ánh xạ 5 nhóm hoạt động (WB11-D1..D5) vào các game engine hiện tại GT-000, GT-001, GT-006, GT-008
  - TUYỆT ĐỐI KHÔNG TẠO MỚI GT-038+, hủy bỏ và thay thế hoàn toàn dự thảo GT-048 cũ
  - Khắc phục lỗ hổng 0 Montessori level của WB11-D3 thuộc strand C3.RULE trong packages/content
  - Thiết kế SkillDataset (items, relations, ladders, phrasing) lấy cảm hứng từ nhân vật & vật phẩm Chặng 11
  - Thiết kế SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101)
  - Kế hoạch phổ biến dữ liệu vào seeder packages/content/src/skills/c3/rule/ và c1/cnt/
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 11: Lâu Đài Ô Số — Giải Mã Những Ô Trống & Ma Trận Số Học

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này xác lập đặc tả kỹ thuật và kiến trúc nội dung sư phạm nhằm chuyển thể trọn vẹn dữ liệu từ tài liệu PDF **"Chặng 11: Lâu Đài Ô Số — Giải Mã Những Ô Trống"** (`docs/montessori/extracted/chang-11/analysis.json`, nguồn: *WB11*, 22 trang, bộ sách *Gấu Logic & Thỏ Quan Sát - Chuyến Tàu Toán Học*, Nhà xuất bản Dân Trí / Montessori VN) vào nền tảng **TiniMath v2**.

### 1.1 Nguyên Tắc Bất Biến Về Công Nghệ & Phạm Vi
1. **Tuyệt Đối Không Tạo Game Engine Mới (`GT-038+`)**:
   - Toàn bộ cơ chế toán học và tư duy ma trận của Chặng 11 được phân bổ 100% vào các game engine hiện hành trong hệ thống:
     - `GT-008` (`drag-to-slot`): Kéo thẻ số vào ô khuyết (slot) trong ma trận số $2 \times 2$, lưới giao điểm hai chiều, cấu trúc chìa khóa liên hợp, pháo đài chữ T và vòng thành khép kín.
     - `GT-001` (`tap-select`): Chạm chọn ô khuyết rồi chọn số từ khay số / bàn phím số (chế độ fallback tap-tap cho trẻ mầm và bài toán xác định giá trị tại nút giao hai chiều).
     - `GT-006` (`sequence-order`): Sắp xếp chuỗi số theo thứ tự luồng dữ liệu (bước nhảy quy luật $+2$, đoàn tàu số liên hoàn, bậc thang ziggurat giật cấp).
     - `GT-000` (`concept-intro`): Giới thiệu cổng thành Lâu Đài Ô Số huyền bí (Trang 1) và màn tổng kết trao Đại Mật Mã Viên Ngọc Lâu Đài (Trang 22).
   - **Quyết định hủy bỏ dự thảo `GT-048`**: Đề xuất `GT-048` (*cross-math-grid*) trong các tài liệu nháp trước đây bị **hủy bỏ hoàn toàn**. Việc tạo `GT-048` vi phạm trực tiếp nguyên tắc bảo toàn tập game engine hiện hữu (`GT-000`..`GT-037`), làm tăng chi phí bảo trì và phân mảnh logic canvas. Mọi bài toán ma trận ô số được chuyển hóa sáng tạo và thanh lịch vào `GT-008`, `GT-001` và `GT-006`.

2. **Khắc Phục Điểm Nghẽn Sư Phạm `WB11-D3` Thuộc `C3.RULE`**:
   - Theo thống kê từ `docs/specs/05-content/montessori-corpus-mapping.md` (Mục 7.9) và `packages/content/src/skills/`:
     - Competency **C1** đã chạm trần 36 level Montessori.
     - Competency **C3** có hạn ngạch 15 level Montessori nhưng hiện có **0 level** được nạp!
     - Dạng bài `WB11-D3` ("*Ma trận số $2 \times 2$ có quy luật cộng/trừ đơn giản*") thuộc strand `C3.RULE` đang có **0 Montessori levels** trong toàn bộ database seeder.
   - Tài liệu này mở khóa trực tiếp việc nạp dữ liệu cho `C3.RULE.01` ("*Tìm quy luật*") và `C3.RULE.02` ("*Quy luật đan xen*"), giải phóng tiềm năng của kho ngữ liệu Chặng 11 mà không làm vi phạm trần hạn ngạch của C1.

3. **Tuân Thủ Bộ Quy Tắc Doanh Nghiệp & Sư Phạm**:
   - `BR-MCM-06`: Tuyệt đối không chứa từ khóa thương mại, bài kiểm tra tâm lý hoặc tuyên bố đo lường chỉ số trí tuệ (IQ, Raven, WISC).
   - `BR-MGL-02`: Mọi mã level Montessori thuộc khối dành riêng từ `0101` trở lên: `GL-<COMP>-<STRAND>-<MECH>-01xx`.
   - `BR-MGL-03` & `BR-MGL-04`: Mỗi dạng bài có ít nhất 2 level khác độ khó, tăng lũy tiến một chiều (cô lập thuộc tính theo `BR-MCM-13`).
   - `BR-MGL-12`: Cấp bậc truy cập (`access_tier`) đồng bộ chặt chẽ với độ khó (`difficulty`: 1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`).
   - `BR-MCM-14` & `BR-MCM-15`: Giữ trọn vẹn kiểm soát lỗi tự thân (Control of Error) và trình tự cụ thể đến trừu tượng (CPA).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò kỹ thuật | Vai trò sư phạm & Đặc điểm thể hiện trong Chặng 11 |
|---|---|---|
| **Bé (Kid Player)** | Người chơi trung tâm (3–6 tuổi) | Nhập vai nhà thám hiểm nhí cùng Chuyến Tàu Toán Học, trực tiếp kéo thả thẻ số vào ô khuyết, tap chọn số, giải mã các cánh cổng đá, tháp số, pháo đài và thu thập Viên Ngọc Lâu Đài. |
| **Gấu Logic (`gau_logic`)** | Nhân vật dẫn dắt tư duy phân tích | Đại diện cho tư duy trật tự, lý thuyết số học và tính liên quán hai chiều. Ngoại hình: Gấu nâu đeo kính tròn, gile xanh, cầm bảng vẽ kiến trúc. Lời thoại mẫu: *"Cánh cửa có rất nhiều ô trống!", "Mỗi ngã tư nối với hai phép tính!", "Tám ô cửa đang chờ được thắp sáng!", "Làm những hàng có nhiều số trước nhé!"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Nhân vật kích hoạt giác quan | Đại diện cho quan sát giác quan, định hướng không gian và phản xạ hành động. Ngoại hình: Thỏ trắng đeo túi chéo vàng, cầm kính lúp thám tử viền cam. Lời thoại mẫu: *"Bé tính theo cả hai hướng nhé!", "Mở từng bậc thang giúp mình nhé!", "Thắp sáng ô cửa nhé!", "Nối lại đoàn tàu giúp mình nhé!"*. |
| **Phụ huynh / Giáo viên** | Hỗ trợ ngoài màn hình | Theo dõi phản hồi gợi ý (hints), đồng hành cùng trẻ đếm ngón tay, dùng que tính hoặc bảng gạch số học gỗ ngoài đời thực để mô phỏng ma trận $2 \times 2$. |
| **Hệ thống Seeder** | Nạp dữ liệu tự động | Chuyển hóa các `SkillLevelPlan[]` thành `ContentSeed` cho DB, xác thực qua `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-11/analysis.json (22 trang)
   │
   ├──> docs/montessori/dataset/activity-types-table.md
   │       └── Cập nhật WB11-D1, WB11-D2, WB11-D3 (Loại bỏ hoàn toàn tham chiếu GT-048)
   │
   ├──> docs/specs/05-content/montessori-corpus-mapping.md
   │       └── Đồng bộ hàng Workbook 11 (C1.CNT & C3.RULE) và ghi nhận cơ chế GT-008, GT-001, GT-006
   │
   ├──> packages/content/src/skills/c3/rule/
   │       ├── C3.RULE.01.ts (Tìm quy luật ma trận 2x2 -> GT-008: GL-C3-RULE-SLOT-0101..0102; GT-001: GL-C3-RULE-CARD-0101..0102)
   │       └── C3.RULE.02.ts (Quy luật đan xen kiến trúc -> GT-008: GL-C3-RULE-SLOT-0111..0112; GT-006: GL-C3-RULE-ORD-0101..0102)
   │
   └──> packages/content/src/skills/c1/cnt/
           ├── C1.CNT.09.ts  (Số thứ tự 1-5 toa tàu & bậc thang -> GT-006: GL-C1-CNT-ORD-0101)
           ├── C1.CNT.10.ts  (Đếm cách 2 hành lang lâu đài -> GT-001: GL-C1-CNT-CARD-0121; GT-008: GL-C1-CNT-SLOT-0135)
           └── C1.CNT.05.ts  (Đã có sẵn 4 level WB11-D1, WB11-D2: GL-C1-CNT-CARD-0119..0120, GL-C1-CNT-SLOT-0133..0134)
```

---

## 4. Phân Tích 5 Nhóm Dạng Bài & Ánh Xạ Game Engine Hiện Hữu

Toàn bộ 22 trang tài liệu PDF Chặng 11 được chia thành 5 nhóm tiến trình sư phạm từ cơ bản đến nâng cao.

### 4.1 `WB11-D1`: Ma Trận Lưới Số Học 2 Chiều Cơ Bản & Đếm Nhảy Cóc (Trang 2–6)
- **Tên bài học**: *Cánh Cửa Đầu Tiên & Ngã Tư Phép Tính*.
- **Vị trí PDF**: Trang 2 (Cánh cửa đầu tiên - 13 ô), Trang 3 (Hành lang hàng ngang - 14 ô), Trang 4 (Tháp số hàng dọc - 15 ô), Trang 5 (Ngã tư phép tính - 15 ô), Trang 6 (Bậc thềm bị khuyết - 17 ô).
- **Mục tiêu sư phạm**:
  - Trẻ hiểu nguyên lý ràng buộc 2 chiều (2D Constraint Satisfaction): Giá trị tại mỗi ô giao điểm phải thỏa mãn đồng thời phép tính hàng ngang (từ trái sang phải) và hàng dọc (từ trên xuống dưới).
  - Vận dụng tư duy kiểm chứng hai chiều để phát hiện lỗi sai tự thân.
  - Áp dụng kỹ năng đếm nhảy cóc (Skip counting by 2s) và tính toán trong phạm vi 10–20.
- **Cơ chế tương tác số hóa (GT-001 & GT-008)**:
  - `GT-001` (`tap-select`): Hiển thị lưới phương trình $2 \times 2$ hoặc $3 \times 3$ với 1 ô khuyết tại giao điểm then chốt. Trẻ chạm vào ô khuyết, hệ thống hiển thị khay 3–4 số lựa chọn (1 đáp án đúng, 2–3 distractor do tính nhầm một chiều).
  - `GT-008` (`drag-to-slot`): Ma trận có 2–3 ô khuyết. Trẻ kéo các khối gạch số từ khay phía dưới thả vào các ô slot có viền nét đứt màu vàng viền cam. Nam châm tự hút khi thả trúng vùng hit-box.
- **Kỹ năng liên kết**: `C3.RULE.01`, `C1.CNT.10`, `C1.CNT.05`.

---

### 4.2 `WB11-D2`: Cấu Trúc Hình Học & Kiến Trúc Biểu Tượng (Trang 7–10)
- **Tên bài học**: *Cầu Thang Ô Số, Ngôi Nhà & Đoàn Tàu Phép Tính*.
- **Vị trí PDF**: Trang 7 (Cầu thang ziggurat giật cấp - 17 ô), Trang 8 (Ngôi nhà phép tính mái tam giác - 18 ô), Trang 9 (Đoàn tàu ô số có ống khói & bánh xe - 19 ô), Trang 10 (Vương miện hoàng gia 3 đỉnh - 20 ô).
- **Mục tiêu sư phạm**:
  - Phá vỡ tư duy đối xứng hộp chữ nhật: Rèn luyện khả năng thích ứng với các bố cục hình học phi quy ước.
  - Xác định "điểm bắt đầu chiến lược" (Strategic Entry Point): Giải từ mái nhà trước (nơi có bài toán đơn $12 - 4 = 8$), giải từ đầu tàu đến toa cuối, giải từ bậc thềm thấp nhất lên đỉnh tháp.
- **Cơ chế tương tác số hóa (GT-006 & GT-008)**:
  - `GT-006` (`sequence-order`): Sắp xếp các toa tàu hoặc bậc thang ziggurat theo luồng dữ liệu liên hoàn (ví dụ: $[4 \rightarrow 9 \rightarrow 6 \rightarrow 13]$ theo quy luật $+5, -3, +7$).
  - `GT-008` (`drag-to-slot`): Thả các số vào vị trí kiến trúc khuyết (ô mái nhà, ô bánh xe, ô đỉnh vương miện).
- **Kỹ năng liên kết**: `C3.RULE.02`, `C1.CNT.09`, `C1.CNT.10`.

---

### 4.3 `WB11-D3`: Cấu Trúc Pháo Đài & Chìa Khóa Liên Hợp (Trang 11–15)
- **Tên bài học**: *Chìa Khóa Cổ Điển & Pháo Đài Chữ T Đối Xứng*.
- **Vị trí PDF**: Trang 11 (Chìa khóa cổ đầu tròn viền đỏ - 17 ô), Trang 12 (Tường thành zíc zắc viền gạch đôi - 18 ô), Trang 13 (Tháp bậc thang 3 tầng đỉnh tháp - 19 ô), Trang 14 (Pháo đài chữ T đối xứng - 20 ô), Trang 15 (Cổng vòm đôi đối xứng hai cánh - 21 ô).
- **Mục tiêu sư phạm**:
  - Khắc sâu tư duy phân đoạn (Clustering / Modular Reasoning): Chia một công trình lớn thành các cụm nhỏ độc lập (cụm đầu chìa khóa, cụm thân chìa khóa, cụm răng khóa; hoặc cánh trái, cánh phải, trụ giữa pháo đài).
  - Hội tụ dữ liệu tại nút then chốt để mở khóa toàn bộ hệ thống.
- **Cơ chế tương tác số hóa (GT-008 & GT-001)**:
  - `GT-008` (`drag-to-slot`): Trọng tâm giải quyết cho `C3.RULE.01` và `C3.RULE.02`. Trẻ kéo thả các số vào các ô slot của chìa khóa hoặc hai cánh pháo đài chữ T. Khi thả đúng một cụm, hiệu ứng ánh sáng bừng sáng báo hiệu cụm đó đã mở khóa.
  - `GT-001` (`tap-select`): Chạm giải mã nhanh ô trung tâm của pháo đài chữ T kết nối giữa cánh ngang và trụ dọc.
- **Kỹ năng liên kết**: `C3.RULE.01`, `C3.RULE.02`.

---

### 4.4 `WB11-D4`: Mạng Lưới Liên Kết Đa Cụm & Cầu Nối Song Song (Trang 16–19)
- **Tên bài học**: *Tháp Đôi Lâu Đài & Cầu Treo Bắc Ngang*.
- **Vị trí PDF**: Trang 16 (Bản đồ thành trì zíc zắc - 20 ô), Trang 17 (Huy hiệu khiên nhọn - 20 ô), Trang 18 (Cầu thành song song hai nhịp - 21 ô), Trang 19 (Tháp đôi lâu đài nối cầu treo tím - 21 ô).
- **Mục tiêu sư phạm**:
  - Mô hình hóa đồ thị mạng lưới (Network Graphs): Dữ liệu từ Tháp 1 truyền qua cầu treo sang Tháp 2.
  - Rèn luyện trí nhớ làm việc (Working Memory) và kiểm soát ức chế khi xử lý song song hai cấu trúc số học.
- **Cơ chế tương tác số hóa (GT-008 & GT-006)**:
  - `GT-008` (`drag-to-slot`): Kéo số vào nhịp cầu nối giữa hai tháp lâu đài.
  - `GT-006` (`sequence-order`): Sắp xếp chuỗi liên kết bắc qua cầu treo.
- **Kỹ năng liên kết**: `C3.RULE.02`, `C3.RULE.03`.

---

### 4.5 `WB11-D5`: Mạch Khép Kín & Đại Thử Thách Đỉnh Cao (Trang 20–22)
- **Tên bài học**: *Cửa Sổ Chữ Thập & Đại Mật Mã Viên Ngọc Lâu Đài*.
- **Vị trí PDF**: Trang 20 (Cửa sổ chữ thập 4 hướng - 22 ô), Trang 21 (Vòng thành khép kín Closed Loop - 22 ô), Trang 22 (Đại mật mã viên ngọc 7 khối ô liên hoàn bao bọc Viên Ngọc Tối Thượng).
- **Mục tiêu sư phạm**:
  - Giải quyết bài toán ràng buộc vòng tròn (Circular / Closed-loop Constraint): Chuỗi suy luận xuất phát từ ô bắt đầu, đi qua 4 cạnh của vòng thành và phải quay về khớp chính xác với giá trị ban đầu.
  - Tổng kết toàn bộ năng lực tư duy tiền đại số và phép tính trong phạm vi 20.
- **Cơ chế tương tác số hóa (GT-008 & GT-000)**:
  - `GT-008` (`drag-to-slot`): Kéo thẻ số vào ô trung tâm chữ thập (chi phối 4 nhánh) và các khối ngọc bao quanh rương báu.
  - `GT-000` (`concept-intro`): Màn trình diễn chiến thắng hoành tráng khi Đại Mật Mã hoàn thành, cánh cổng lâu đài mở toang, Viên Ngọc Lâu Đài tỏa sáng rực rỡ và trao Huy Hiệu Đại Thám Tử Ô Số.
- **Kỹ năng liên kết**: `C3.RULE.02`, `C3.RULE.03`.

---

## 5. Thiết Kế SkillDataset Mở Rộng

### 5.1 Kho Ngữ Liệu Cho `C3.RULE.01` (Quy luật hàng và cột / Ma trận $2 \times 2$)
```typescript
// C3_RULE_01_DATASET bổ sung các vật phẩm Lâu Đài Ô Số
export const C3_RULE_01_CASTLE_ITEMS = [
  {
    id: "castle_gate",
    label: "cổng vòm đá lâu đài",
    image: { kind: "emoji", ref: "🏰" },
    category: { type: "công trình", structure: "gate" },
    contrast_group: "castle",
    value: 1,
    ordering: 1,
  },
  {
    id: "ancient_key",
    label: "chìa khóa cổ đầu tròn",
    image: { kind: "emoji", ref: "🗝️" },
    category: { type: "vật phẩm", structure: "key" },
    contrast_group: "castle",
    value: 2,
    ordering: 2,
  },
  {
    id: "magic_brick_blue",
    label: "viên gạch số màu xanh dương",
    image: { kind: "emoji", ref: "🟦" },
    category: { type: "khối số", color: "blue" },
    contrast_group: "bricks",
    value: 3,
    ordering: 3,
  },
  {
    id: "magic_brick_yellow",
    label: "viên gạch số màu vàng",
    image: { kind: "emoji", ref: "🟨" },
    category: { type: "khối số", color: "yellow" },
    contrast_group: "bricks",
    value: 4,
    ordering: 4,
  },
  {
    id: "magic_brick_green",
    label: "viên gạch số màu xanh lá",
    image: { kind: "emoji", ref: "🟩" },
    category: { type: "khối số", color: "green" },
    contrast_group: "bricks",
    value: 5,
    ordering: 5,
  },
  {
    id: "castle_gem",
    label: "viên ngọc tím lâu đài",
    image: { kind: "emoji", ref: "💎" },
    category: { type: "kho báu", structure: "gem" },
    contrast_group: "castle",
    value: 6,
    ordering: 6,
  },
];
```

### 5.2 Kho Ngữ Liệu Cho `C3.RULE.02` (Quy luật đan xen & Kiến trúc liên hoàn)
```typescript
export const C3_RULE_02_CASTLE_ITEMS = [
  {
    id: "train_engine",
    label: "đầu tàu hỏa ống khói",
    image: { kind: "emoji", ref: "🚂" },
    category: { type: "phương tiện", part: "engine" },
    contrast_group: "train",
    value: 1,
    ordering: 1,
  },
  {
    id: "train_carriage",
    label: "toa tàu ô số",
    image: { kind: "emoji", ref: "🚃" },
    category: { type: "phương tiện", part: "carriage" },
    contrast_group: "train",
    value: 2,
    ordering: 2,
  },
  {
    id: "ziggurat_stair",
    label: "bậc thang giật cấp",
    image: { kind: "emoji", ref: "🪜" },
    category: { type: "kiến trúc", part: "stair" },
    contrast_group: "structure",
    value: 3,
    ordering: 3,
  },
  {
    id: "fortress_t",
    label: "pháo đài chữ T đối xứng",
    image: { kind: "emoji", ref: "🏛️" },
    category: { type: "kiến trúc", part: "fortress" },
    contrast_group: "structure",
    value: 4,
    ordering: 4,
  },
  {
    id: "royal_crown",
    label: "vương miện ba đỉnh gắn ngọc",
    image: { kind: "emoji", ref: "👑" },
    category: { type: "hoàng gia", part: "crown" },
    contrast_group: "treasure",
    value: 5,
    ordering: 5,
  },
  {
    id: "treasure_chest",
    label: "rương kho báu bừng sáng",
    image: { kind: "emoji", ref: "📦" },
    category: { type: "kho báu", part: "chest" },
    contrast_group: "treasure",
    value: 6,
    ordering: 6,
  },
];
```

### 5.3 Phrasing Đậm Chất Sư Phạm Chặng 11
- **Prompt Templates**:
  - `GT-008`: *"Bé hãy tính theo hàng ngang và hàng dọc, rồi kéo {label} vào ô trống nhé!"*
  - `GT-001`: *"Bé hãy chạm vào ô ngã tư và chọn số đúng cả hai chiều nhé!"*
  - `GT-006`: *"Bé hãy sắp xếp {label} theo đúng quy luật của đoàn tàu nhé!"*
- **Narration Templates**:
  - *"Cùng Gấu Logic và Thỏ Quan Sát giải mã các ô số bí ẩn để mở khóa lâu đài nhé!"*
  - *"Mỗi ô trống đều thuộc về hai phép tính, bé quan sát thật kỹ nhé!"*
  - *"Viên Ngọc Lâu Đài sắp xuất hiện rồi, cố lên bé ơi!"*

---

## 6. Danh Mục `SkillLevelPlan[]` Chi Tiết

Bảng dưới đây quy hoạch đầy đủ các level Montessori được thiết kế từ Chặng 11, đảm bảo tuân thủ nghiêm ngặt quy tắc đặt mã (`GL-<COMP>-<STRAND>-<MECH>-01xx`), khớp `access_tier` với `difficulty`, và giải quyết triệt để vấn đề 0 Montessori levels của `C3.RULE`.

| Mã Level (`code`) | Template | Skill Code | Band | Diff | Access Tier | Montessori Ref | Tên Hoạt Động & Cấu Trúc Bài Toán |
|---|---|---|:---:|:---:|---|---|---|
| `GL-C3-RULE-CARD-0101` | `GT-001` | `C3.RULE.01` | 4-5 | 1 | `free` | `WB11-D1` | **Cánh Cửa Đầu Tiên**: Chạm chọn số còn thiếu tại giao điểm 2 phép tính phạm vi 10 (Ví dụ: $5 + [?] = 9$ ngang và $[?] - 2 = 2$ dọc). |
| `GL-C3-RULE-CARD-0102` | `GT-001` | `C3.RULE.01` | 4-5 | 2 | `login` | `WB11-D1` | **Ngã Tư Phép Tính**: Chạm chọn số tại nút giao phạm vi 15 (Ví dụ: $7 + [?] = 11$ ngang và $[?] + 6 = 10$ dọc). |
| `GL-C3-RULE-SLOT-0101` | `GT-008` | `C3.RULE.01` | 4-5 | 2 | `login` | `WB11-D3` | **Ma Trận 2x2 Lâu Đài**: Kéo 2 thẻ số vào 2 ô khuyết trong lưới $2 \times 2$ có quy luật cộng/trừ liên hoàn phạm vi 15. |
| `GL-C3-RULE-SLOT-0102` | `GT-008` | `C3.RULE.01` | 4-5 | 3 | `standard` | `WB11-D3` | **Chìa Khóa Cổ Điển**: Kéo 3 thẻ số vào đầu chìa khóa và thân chìa khóa theo quy luật liên kết ngang - dọc phạm vi 20. |
| `GL-C3-RULE-ORD-0101` | `GT-006` | `C3.RULE.02` | 4-5 | 2 | `login` | `WB11-D2` | **Đoàn Tàu Ô Số**: Sắp xếp 4 toa tàu theo quy luật bước nhảy số học đan xen ($+2, -1, +2$). |
| `GL-C3-RULE-ORD-0102` | `GT-006` | `C3.RULE.02` | 4-5 | 3 | `standard` | `WB11-D2` | **Bậc Thang Ziggurat**: Sắp xếp 5 nấc thang số theo quy luật tăng dần lũy tiến từ bậc thấp lên đỉnh tháp. |
| `GL-C3-RULE-SLOT-0111` | `GT-008` | `C3.RULE.02` | 4-5 | 3 | `standard` | `WB11-D3` | **Pháo Đài Chữ T**: Kéo 3 thẻ số cân bằng hai cánh ngang và trụ dọc của pháo đài đối xứng. |
| `GL-C3-RULE-SLOT-0112` | `GT-008` | `C3.RULE.02` | 5-6 | 4 | `premium` | `WB11-D3` | **Tháp Đôi Cầu Treo**: Giải mã 4 ô khuyết trên cầu treo liên kết dữ liệu giữa hai tháp lâu đài phạm vi 20 có nhớ. |
| `GL-C3-RULE-SLOT-0113` | `GT-008` | `C3.RULE.02` | 5-6 | 4 | `premium` | `WB11-D5` | **Vòng Thành Khép Kín**: Kéo 4 thẻ số vào vòng thành 4 cạnh khép kín (closed-loop constraint) mở cổng rương kho báu. |
| `GL-C3-RULE-SLOT-0114` | `GT-008` | `C3.RULE.02` | 5-6 | 5 | `premium` | `WB11-D5` | **Đại Mật Mã Viên Ngọc**: Thử thách đỉnh cao 5 ô slot bao quanh Viên Ngọc Lâu Đài kết hợp toàn diện tư duy ma trận. |
| `GL-C1-CNT-ORD-0101` | `GT-006` | `C1.CNT.09` | 4-5 | 2 | `login` | `WB11-D2` | **Thứ Tự Toa Tàu 1–5**: Sắp xếp các toa tàu theo số thứ tự từ toa thứ nhất đến toa thứ năm chở vật phẩm lâu đài. |
| `GL-C1-CNT-CARD-0121` | `GT-001` | `C1.CNT.10` | 4-5 | 2 | `login` | `WB11-D1` | **Bước Nhảy Hành Lang**: Đếm nhảy cóc $+2$ chọn viên gạch số tiếp theo trên đường ray đá ($2, 4, 6, [?], 10$). |
| `GL-C1-CNT-SLOT-0135` | `GT-008` | `C1.CNT.10` | 4-5 | 3 | `standard` | `WB11-D2` | **Khôi Phục Trục Số Nhảy**: Kéo các số chẵn hoặc số lẻ vào 3 ô khuyết trên trục số bước nhảy $+2$ phạm vi 20. |

---

## 7. Ma Trận Sư Phạm, Cân Bằng Hạn Ngạch & Kiểm Soát Lỗi Tự Thân

### 7.1 Phân Bổ Hạn Ngạch & Cân Bằng Competency
- **Hiện trạng hạn ngạch C3**:
  - Hạn ngạch tối đa: 15 level Montessori.
  - Số level C3 đã soạn trước đợt này: **0 level**.
  - Đợt quy hoạch Chặng 11 bổ sung **10 level Montessori** cho C3 (`C3.RULE.01`: 4 level; `C3.RULE.02`: 6 level).
  - Số dư hạn ngạch C3 còn lại: 5 level (dành riêng cho các chặng logic tiếp theo như Chặng 15, 17, 21).
  - Tỉ lệ cân bằng toàn hệ thống sau khi nạp: C1 = 36 level (giữ nguyên trần, 3 level C1 trên chỉ mang tính kế thừa/làm giàu dataset và mở khi cổng người nới hạn ngạch), C3 = 10 level $\rightarrow$ Tỉ lệ $\frac{36}{10} = 3.6$ lần (tiến gần mục tiêu cân bằng hoàn hảo $\le 3.0$ lần theo `BR-TCM-07`).

### 7.2 Kiểm Soát Lỗi Tự Thân (Control of Error) Theo Triết Lý Montessori
1. **Kiểm tra chéo hai chiều (Bidirectional Cross-checking)**:
   - Trong `GT-008`, nếu trẻ đặt số làm đúng hàng ngang nhưng làm sai hàng dọc, ô số tại giao điểm phát ra nhịp thở hổ phách (`amber_soft`) và hiển thị đường dẫn sáng nhấp nháy dọc theo cột bị mâu thuẫn để trẻ tự đối chiếu mà không cần người lớn can thiệp.
2. **Khung Snap Nam Châm Có Chọn Lọc**:
   - Chỉ khi số kéo vào thỏa mãn cả hai ràng buộc thì ô slot mới phát âm thanh thanh thoát (`bell_soft`), chốt khóa vị trí và tỏa hào quang vàng.
3. **Phản hồi phi trừng phạt**:
   - Tuyệt đối không dùng màu đỏ, dấu chéo hay âm thanh buzzer trừng phạt. Số không đúng nhẹ nhàng trôi về khay nguồn (`drift_back`) kèm gợi ý trực quan từ Thỏ Quan Sát.

### 7.3 Thang Scaffolding 3 Bậc (Hỗ Trợ Tự Động Theo Thời Gian & Lần Thử)
- **Mức 1 (Nudge - Nhắc nhẹ / 10s hoặc 1 lần thử sai)**:
  - Nhấp nháy viền ô có nhiều dữ kiện nhất (ví dụ hàng có 2 số đã biết, chỉ khuyết 1 số) để định hướng "điểm bắt đầu chiến lược".
- **Mức 2 (Guidance - Hướng dẫn / 18s hoặc 2 lần thử sai)**:
  - Bàn tay mờ (Ghost Hand) chỉ vào phép tính ngang, đọc to phép tính: *"Năm cộng mấy bằng chín nhỉ?"*.
- **Mức 3 (Demo - Trình diễn / 25s hoặc 3 lần thử sai)**:
  - Bàn tay mờ thực hiện thao tác kéo mẫu thẻ số 4 từ khay vào ô trống ở tốc độ $0.5 \times$ rồi trả lại để trẻ tự làm.

---

## 8. Verification & Test Plan

1. **Kiểm tra cú pháp & Type Safety**:
   - `pnpm --filter @mindkid/content typecheck`: Tuyệt đối không có lỗi type trong các file seeder `C3.RULE.01.ts`, `C3.RULE.02.ts`, `C1.CNT.09.ts`, `C1.CNT.10.ts`.
2. **Kiểm tra cổng dữ liệu Montessori (`montessori-gate`)**:
   - Chạy `pnpm --filter @mindkid/content-build test`:
     - Xác nhận mọi mã level tuân thủ regex `^GL-C[1-6]-[A-Z]{3,4}-[A-Z]{3,4}-01\d{2}$`.
     - Xác nhận `access_tier` khớp 100% với `difficulty` (`BR-MGL-12`).
     - Xác nhận không vượt trần hạn ngạch 15 level của C3 (`BR-MGL-01`).
     - Xác nhận không có từ khóa cấm đo lường trí tuệ (`BR-MCM-06`).
3. **Kiểm tra tính tương thích của Projection Builders**:
   - Chạy `buildLevelsForSkill` cho `C3.RULE.01` và `C3.RULE.02`, đảm bảo `projectGT001`, `projectGT006`, `projectGT008` sinh ra `ContentSeed` hoàn chỉnh, không văng ngoại lệ `[BR-SDS-05]`.
