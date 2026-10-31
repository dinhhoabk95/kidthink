---
spec: MONTESSORI-CHANG-03
title: Chặng 3: Thung Lũng Bóng & Hình — Thử Tài Tìm Chiếc Bóng Đúng
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-03
workbook_ref: WB03
owns:
  - Phân tích sư phạm và giải mã toàn diện 23 trang PDF Chặng 3 (3 - Thung lung bong va hinh.pdf)
  - Ánh xạ 3 nhóm dạng bài (WB03-D1, WB03-D2, WB03-D3) vào các game engine hiện tại GT-005, GT-001, GT-002, GT-000 (TUYỆT ĐỐI KHÔNG TẠO GT-038+)
  - Thiết kế cấu trúc SkillDataset giàu ngữ liệu (vật phẩm, bóng silhouette, quan hệ đối chiếu, bẫy distractor có chủ đích, câu thoại song hành Gấu Logic & Thỏ Quan Sát)
  - Thiết kế danh mục SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101, montessori_ref WB03-D<n>, access_tier khớp difficulty, tuân thủ BR-MCM-06)
  - Tích hợp tiến trình Gamification thắp sáng Viên Ngọc Tinh Mắt và đánh dấu Ga 3/20 trên Đường Ray Ánh Sáng
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
  - DESIGN-TOKENS-SYSTEM
---

# Chặng 3: Thung Lũng Bóng & Hình — Thử Tài Tìm Chiếc Bóng Đúng

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này sở hữu đặc tả kỹ thuật và sư phạm nhằm tích hợp dữ liệu trích xuất từ tài liệu PDF **"Chặng 3: Thung Lũng Bóng & Hình"** (`docs/montessori/extracted/chang-03/analysis.json`, nguồn: *3 - Thung lung bong va hinh.pdf*, 23 trang, thuộc bộ sách *Gấu Logic & Thỏ Quan Sát - Chuyến Tàu Toán Học*, Nhà xuất bản Dân Trí, Montessori VN) vào hệ thống học liệu số hóa của **TiniMath v2**.

### 1.1. Mục tiêu sư phạm:
1. **Phát triển năng lực Phân tích Thị giác & Trích xuất Đường viền (`Visual Contour Extraction`)**:
   - Trẻ chuyển đổi nhận thức từ vật thể đa sắc 3D sang bóng đen phẳng 2D đơn sắc (Silhouette / Shadow).
   - Rèn luyện kỹ năng phân biệt Hình - Nền (*Figure-Ground Discrimination*) và trích xuất các đặc trưng hình học đặc thù (mào chim, sừng nai, râu bướm, đuôi sóc, quai cốc, còi đèn nóc xe).
2. **Hình thành Tư duy Bất biến Không gian & Định hướng (`Spatial Invariance & Orientation`)**:
   - Nhận diện vật thể không phụ thuộc vào hướng quay (quay trái, quay phải, bay chếch).
   - Phát hiện các biến đổi bất thường do lật gương trục dọc (*Mirror Symmetry Discrimination*, `C2.MIR.01`).
3. **Phân tích Biến thể Tư thế & Động tác (`Pose Discrimination`)**:
   - Vượt qua ranh giới nhận diện loài: Khi các hình thể có cùng đặc điểm nhận dạng (ví dụ: cùng là chú gấu nâu hoặc cùng là cô bé múa), trẻ bắt buộc phải phân tích mối quan hệ không gian động học giữa các chi (tay, chân) và trục thân thể (`C4.DET.04`).
4. **Phân giải Cấu trúc Bóng Phức hợp & Bóng Chồng Lớp (`Compound Silhouette De-composition`)**:
   - Nhận diện bóng tạo thành từ hai thực thể liên kết (Kangaroo mẹ và con, bé trai và xe trượt scooter, thỏ và củ cà rốt, khinh khí cầu và giỏ mây, lâu đài 3 ngọn tháp).

### 1.2. Mục tiêu kỹ thuật & Tái cấu trúc Engine:
- **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`** (bãi bỏ hoàn toàn các đề xuất spec speculative như `GT-040`).
- Khai thác 100% các khuôn mẫu game engine Canvas 2D hiện hữu:
  - `GT-005` (pair-match): Thực hiện các bài toán nối cặp 1-1 giữa vật thể và bóng đen (`WB03-D1`, Trang 2–11, 20–21).
  - `GT-001` (tap-select): Thực hiện các bài toán trắc nghiệm tìm bóng đúng có 4 phương án với bẫy nhiễu distractor sư phạm (`WB03-D2`, Trang 12–19).
  - `GT-002` (tap-select-multi): Thực hiện thử thách ma trận đa hàng hoặc phân tách bóng chồng lớp phức hợp (`WB03-D3`, Trang 22).
  - `GT-000` (concept-intro / stage-hub): Trình diễn màn mở màn thung lũng đá đêm (Trang 1) và màn ăn mừng hoàn thành chặng, trao "Viên Ngọc Tinh Mắt" (Trang 23).
- Cấp mã level chuẩn `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), gắn nhãn `montessori_ref: "WB03-D<n>"`, phân bổ `access_tier` khớp `difficulty` theo `BR-MGL-12` (1: `free`, 2: `login`, 3: `standard`, 4/5: `premium`), tuân thủ nghiêm ngặt `BR-MCM-06` (tuyệt đối không dùng từ khóa thương mại IQ/Raven/trí tuệ).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò hệ thống | Vai trò sư phạm & Kịch bản tương tác |
|---|---|---|
| **Bé (Kid Player)** | Người chơi chính (3–6 tuổi) | Nhập vai nhà thám hiểm nhí trên Chuyến Tàu Toán Học, dùng mắt quan sát và ngón tay kết nối các chiếc bóng thất lạc về đúng chủ nhân tại Thung Lũng Bóng Hình. |
| **Gấu Logic (`gau_logic`)** | Đồng hành phân tích (Scaffolding Guide) | Đại diện bán cầu não trái. Điềm tĩnh, phân tích đường nét hình học, góc cạnh và tư thế. Thường đưa ra câu hỏi định hướng logic: *"Bé nhìn thật kỹ đường viền nhé!", "Mỗi món đồ đều có một chiếc bóng!", "Cùng một bạn nhưng tư thế đã khác!", "Chiều bơi cũng là một manh mối quan trọng!", "Tư thế càng đặc biệt, chiếc bóng càng thú vị!"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Đồng hành trực quan (Sensory Observer) | Đại diện bán cầu não phải. Hoạt bát, tinh mắt, cầm kính lúp viền đỏ cam rực rỡ, chỉ ra các chi tiết siêu nhỏ: *"Mình bắt đầu với những hình thật dễ nào!", "Bé nhìn chiếc đuôi và hạt dẻ nhé!", "Nhớ nhìn cả hai chiếc râu bướm nhé!", "Bé nhìn sừng, mào và chiếc đuôi nhé!", "Viên Ngọc Tinh Mắt đã sáng lên rồi!"*. |
| **Phụ huynh / Giáo viên** | Hỗ trợ & Khích lệ ngoài đời thực | Hướng dẫn bé quan sát bóng đổ ngoài trời dưới ánh nắng hoặc bóng bàn tay trên tường bằng đèn pin; đồng hành tô 3 ngôi sao nỗ lực và tô màu Viên Ngọc Tinh Mắt ở Trang 23. |
| **Content Seeder Engine** | Trình nạp dữ liệu tự động | Đọc và nạp các `SkillDataset` và `SkillLevelPlan[]` vào cơ sở dữ liệu TiniMath, kiểm duyệt qua bộ cổng `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-03/analysis.json
   │
   ├──> docs/montessori/dataset/activity-types-table.md  (Cập nhật WB03-D1..D3)
   ├──> docs/specs/05-content/montessori-corpus-mapping.md (Cập nhật hàng WB03)
   │
   ├──> packages/content/src/skills/c4/vis/C4.VIS.01.ts (Bổ sung WB03-D1 & WB03-D2 -> GT-005, GT-001)
   ├──> packages/content/src/skills/c1/oto/C1.OTO.01.ts (Bổ sung WB03-D1 -> GT-005)
   ├──> packages/content/src/skills/c2/geo/C2.GEO.01.ts (Bổ sung WB03-D1 & WB03-D2 -> GT-005, GT-001)
   └──> packages/content/src/skills/c4/det/C4.DET.04.ts (Bổ sung WB03-D1, WB03-D2, WB03-D3 -> GT-005, GT-001, GT-002)
```

- **Mã nguồn Engine thực thi (100% tái sử dụng các khuôn hiện hữu)**:
  - `packages/game-engine/src/templates/GT-005/` (`PairMatchSession` — Nối cặp đối ứng 1-1).
  - `packages/game-engine/src/templates/GT-001/` (`TapSelectSession` — Trắc nghiệm chạm chọn 1 đáp án đúng).
  - `packages/game-engine/src/templates/GT-002/` (`TapSelectMultiSession` — Ma trận chạm chọn đa hàng / phân tách bóng).
  - `packages/game-engine/src/templates/GT-000/` (`GT000Session` — Màn mở đầu & Màn trao huy hiệu chặng).
- **Hệ thống Design Tokens**:
  - `packages/game-engine/src/systems/designTokens.ts` (màu sắc, kích thước chạm, phông chữ Canvas).

---

## 4. Main Flow: Kịch Bản Số Hóa 23 Trang PDF Chặng 3

Chặng 3 được chia thành 4 phân đoạn trải nghiệm mạch lạc theo tiến trình sư phạm CPA từ dễ đến khó:

### Phân đoạn 1: Mở Màn Thung Lũng Đá Đêm (Trang 1 — `WB03-Hub` — `GT-000`)
1. Đoàn tàu hơi nước 4 toa của Chuyến Tàu Toán Học xình xịch tiến vào Ga Số 3: Thung Lũng Bóng Hình.
2. Khung cảnh hiện lên lộng lẫy trên nền Canvas 2D: Bầu trời đêm xanh thẫm đầy trăng sao lung linh (`nightNavy`), các ngọn đồi đá uốn lượn ven đường ray.
3. Trên vách đá dựng đứng xuất hiện 6 mỏm đá bóng hình bí ẩn (`Silhouette Rocks`): Khối đá hình thỏ con, khối đá voi lớn, khối đá cây cổ thụ, khối đá ô tô, khối đá hoa tulip, khối đá ngôi sao tròn phát sáng.
4. Lồng tiếng tự động:
   - Gấu Logic: *"Chào mừng bé đến với Thung Lũng Bóng Hình! Cơn Bão Lộn Xộn đã làm những chiếc bóng bay lạc khắp nơi!"*
   - Thỏ Quan Sát: *"Bé hãy cùng chúng mình đưa từng chiếc bóng về đúng bạn nhỏ nhé! Đích đến của chúng ta là Đỉnh Kim Cương!"*
5. Trẻ chạm tự do vào các khối đá bóng: Mỗi khối đá phát sáng viền vàng hổ phách, hé lộ nhân vật đầy màu sắc ẩn giấu bên trong kèm âm thanh vui nhộn. Nút "Bắt đầu khám phá" phát sáng mời gọi trẻ bước vào bài tập đầu tiên.

---

### Phân đoạn 2: Nhóm D1 — Nối Cặp 1-1 Giữa Vật Thể & Bóng Đen (Trang 2–11, 20–21 — `WB03-D1` — `GT-005`)
Màn hình bố trí 2 cột: Cột bên trái gồm các vật thể màu sắc sống động; cột bên phải gồm các bóng đen đơn sắc đã bị xáo trộn vị trí. Trẻ nối bằng cách kéo dây từ vật sang bóng hoặc chạm lần lượt vào 2 thẻ tương ứng (cơ chế Tap-Tap Fallback).

Tiến trình 5 bậc thang độ khó của Nhóm D1:
1. **Bậc 1: Khởi động 3 đối tượng đơn giản (Trang 2 — Trái Cây, Band 3–4, Diff 1)**:
   - 3 cặp: Quả táo tròn có cuống lá $\leftrightarrow$ Bóng quả táo; Nải chuối cong lưỡi liềm $\leftrightarrow$ Bóng chuối; Quả dứa hình trứng chùm lá nhọn $\leftrightarrow$ Bóng dứa.
   - Sư phạm: Các hình thể tự nhiên có đường bao cơ bản phân biệt rõ (tròn, cong, gai chóp).
2. **Bậc 2: Mở rộng 4 đối tượng hình học & đời sống (Trang 3–6, Band 3–4, Diff 2)**:
   - *Đồ chơi (Trang 3)*: Ô tô 2 bánh tròn, Gấu bông tai tròn nơ cổ, Con diều hình thoi đuôi nơ, Quả bóng tròn đối xứng hoàn hảo.
   - *Con vật (Trang 4)*: Mèo tai nhọn đuôi cong, Thỏ tai dài đuôi bông, Vịt con mỏ bẹt, Cá vàng đuôi chẻ 2 thùy.
   - *Phương tiện (Trang 5)*: Ô tô khối vòm cong, Xe đạp nan hoa rỗng thanh mảnh, Thuyền buồm 2 cánh tam giác, Máy bay cánh ngang đuôi đứng.
   - *Đồ vật gia đình (Trang 6)*: Cốc nước quai chữ C, Đèn bàn chụp nón cụt, Ghế tựa 4 chân, Chiếc ô gấp móc câu cong.
3. **Bậc 3: Bước ngoặt phân biệt tư thế (Trang 7 — Tư Thế Gấu Con, Band 3–4, Diff 2 & Trang 9 — Bé Vui Chơi, Band 4–5, Diff 3)**:
   - *Tư thế gấu con (Trang 7)*: Cùng là chú gấu nâu, không thể dựa vào loài. Trẻ bắt buộc phân tích tư thế tay chân: Gấu vẫy tay trái, Gấu giơ hai tay hoan hô, Gấu xuôi hai tay sát thân, Gấu chỉ tay phải sang ngang.
   - *Bé vui chơi (Trang 9)*: Bé nhảy dây vòm cung qua đầu, Bé ngồi xếp khối tháp, Bé bơi lội nằm ngang, Bé ngồi đọc sách mở rộng, Bé co chân sút bóng.
4. **Bậc 4: Khối bóng phức hợp kép Mẹ & Bé (Trang 10, Band 4–5, Diff 3 & Trang 11 — Khủng Long, Band 4–5, Diff 3)**:
   - *Mẹ & Bé (Trang 10)*: Bóng không còn là đơn lẻ mà là khối ghép đôi có quan hệ kích thước và lồng ghép: Kangaroo con trong túi bụng mẹ, Mèo mẹ ngồi sát mèo con, Vịt mẹ dẫn vịt con theo sau, Voi mẹ khổng lồ che chở voi con, Gấu mẹ ôm trọn gấu con vào lòng.
   - *Khủng long (Trang 11)*: T-Rex hàm răng mở rộng, Brachiosaurus cổ dài vươn cao, Triceratops 3 sừng diềm cổ, Stegosaurus phiến gai lưng tam giác, Pterodactyl cánh màng bay lượn.
5. **Bậc 5: Thử thách cực hạn 6 đối tượng (Trang 20 — Lễ Hội & Trang 21 — Rừng Rậm, Band 5–6, Diff 4)**:
   - *Lễ hội (Trang 20)*: Mũ sinh nhật chóp nhọn quả bông, Trống dùi chữ X, Kèn trumpet 3 nút loa xòe, Chùm bóng bay nơ ruy băng, Đàn guitar thùng số 8, Bánh sinh nhật cắm nến.
   - *Rừng rậm (Trang 21)*: Cáo đuôi xù tai nhọn, Cú mèo cành cây khô, Nhím gai lởm chởm, Ếch ngồi bành đùi, Ốc sên vỏ xoắn râu mắt, Nai vàng sừng phân nhánh dũng mãnh.
   - Chiến lược sư phạm: Thỏ Quan Sát hướng dẫn phương pháp loại trừ: *"Bắt đầu với hình dáng dễ nhận nhất trước, rồi nối các hình còn lại!"*.

---

### Phân đoạn 3: Nhóm D2 — Trắc Nghiệm Tìm Bóng Đúng & Phân Tích Nhiễu (Trang 12–19 — `WB03-D2` — `GT-001`)
Màn hình Canvas hiển thị 1 hình mẫu màu sắc ở trung tâm phía trên; phía dưới là 4 ô lựa chọn A, B, C, D gồm đúng 1 bóng chính xác và 3 bóng nhiễu (*Distractors*) được thiết kế có chủ đích sư phạm sâu sắc.

Bảng phân tích 8 bài toán trắc nghiệm Nhóm D2:
| Trang | Hình mẫu | Hướng quay | Bóng đúng | Bẫy A | Bẫy B | Bẫy C | Bẫy D | Năng lực trọng tâm |
|:---:|---|:---:|:---:|---|---|---|---|---|
| **12** | Chú sóc ôm hạt dẻ | Quay phải | **B** | Đuôi duỗi thẳng ngang (Sai hình thái đuôi) | **ĐÚNG** | Lật gương quay trái (Sai hướng không gian) | Thiếu hạt dẻ trên tay (Thiếu phụ kiện) | `C4.VIS.01`, `C2.ORI.02`, `C2.MIR.01` |
| **13** | Bướm xinh xòe cánh | Bay chếch phải | **B** | Chỉ có 1 chiếc râu (Thiếu chi tiết nhỏ) | **ĐÚNG** | Lật gương bay chếch trái (Sai hướng không gian) | Cánh thon nhọn lá liễu (Sai đường cong viền) | `C4.VIS.01`, `C1.CNT.01` (đếm râu), `C2.MIR` |
| **14** | Chú cá vàng bơi lội | Bơi sang trái | **A** | **ĐÚNG** | Lật gương bơi sang phải (Sai hướng không gian) | Mất chiếc vây lưng nhọn (Thiếu bộ phận giải phẫu) | Đuôi tròn vo không chẻ thùy (Sai hình dáng) | `C2.ORI.01` (trái), `C4.DET.02` |
| **15** | Rô-bốt thông minh | Nhìn thẳng | **D** | Thiếu ăng-ten ngôi sao (Thiếu chi tiết đỉnh) | Cả 2 tay đều giơ cao chữ U (Sai tư thế đối xứng) | Hoán đổi tay: Trái ngang, phải giơ (Đảo tay) | **ĐÚNG** | `C4.DET.04`, `C2.GEO.04` |
| **16** | Bé đi xe trượt scooter | Chạy sang phải | **A** | **ĐÚNG** | Góc chân sau chúc xuống đất (Sai góc gập chân) | Mũ đầu tròn không có lưỡi trai (Thiếu chi tiết mũ) | Hai chân đứng thẳng song song (Sai tư thế động) | `C4.DET.04` (động học), `C2.ORI` |
| **17** | Cô bé múa ballet | Nghiêng sang phải | **B** | Cả hai tay uốn cong trên đầu (Sai tư thế tay) | **ĐÚNG** | Tay ngang chĩa ngược ra sau lưng (Sai hướng tay) | Hai chân đứng thẳng khép vào nhau (Sai chân) | `C4.DET.04` (tư thế nghệ thuật), `C2.ORI` |
| **18** | Chim công xòe đuôi | Đầu quay trái | **D** | Đầu trơn không có 3 chùm mào (Thiếu mào vương miện) | Lật gương đầu quay phải (Sai hướng không gian) | Đuôi cụp dài xuôi xuống đất (Sai trạng thái xòe) | **ĐÚNG** | `C4.VIS.01`, `C2.ORI.01`, `C2.MIR` |
| **19** | Xe cứu hỏa chuyên dụng | Đầu quay phải | **B** | Thiếu còi đèn báo động trên nóc (Thiếu phụ kiện) | **ĐÚNG** | Lật gương đầu quay trái (Sai hướng không gian) | Thang cứu hỏa nằm ngang bằng phẳng (Sai góc nghiêng) | `C2.ORI.02`, `C2.GEO.03`, `C4.VIS` |

Phản hồi tương tác chuẩn mực (`GT-001`):
- **Khi chọn ĐÚNG**: Thẻ bóng bừng sáng viền xanh ngọc (`emeraldGreen`), hình mẫu màu sắc nảy pop vui vẻ đáp vào tâm chiếc bóng, phát âm thanh chuông ngân tinh tế (*ting!*), giọng đọc vang lên: *"Đúng rồi! Chiếc bóng của chú sóc!"*.
- **Khi chọn SAI**: Thẻ bóng nhấp nháy nhịp thở hổ phách dịu (`amber_soft`, 340ms), giọng đọc ấm áp khích lệ: *"Bé nhìn chiếc đuôi và hạt dẻ xem nào!"*, thẻ bóng trở về trạng thái bình thường; tuyệt đối không điểm đỏ, không trừ điểm.

---

### Phân đoạn 4: Nhóm D3 — Đại Thử Thách Ma Trận Đa Hàng (Trang 22 — `WB03-D3` — `GT-002`)
Trang 22 là thử thách tổng hợp tối cao của Chặng 3, tổ chức theo cấu trúc ma trận 3 hàng $\times$ 3 lựa chọn (A, B, C):
1. **Hàng 1 (Vật thể sinh học & Đạo cụ cầm tay)**:
   - Thỏ trắng ôm cà rốt quay sang phải.
   - Bẫy: A (thiếu cà rốt), B (**ĐÚNG**), C (lật gương quay trái).
2. **Hàng 2 (Cấu trúc hình học đối xứng đa khối)**:
   - Khinh khí cầu: Quả khí cầu tròn bè + 2 dây cáp + giỏ mây chữ nhật.
   - Bẫy: A (thiếu giỏ mây và dây cáp), B (biến dạng thành hình oval thon hẹp), C (**ĐÚNG**).
3. **Hàng 3 (Kiến trúc phức hợp đa hình khối — Composite Architecture)**:
   - Lâu đài cổ tích gồm 3 ngọn tháp chóp nón nhọn (tháp giữa cao nhất gắn cờ bay, tường thành răng cưa).
   - Bẫy: A (**ĐÚNG**), B (thiếu ngọn tháp giữa cắm cờ), C (cắt cụt thành tháp bằng phẳng răng cưa, thiếu mái chóp nhọn).

**Mở rộng tương tác số hóa trên `GT-002`**:
- Trẻ chạm vào đúng chiếc bóng ở từng hàng ($1 \rightarrow 2 \rightarrow 3$). Khi cả 3 hàng đều được chọn chính xác, toàn bộ ma trận liên kết thành một chuỗi ánh sáng vàng rực rỡ.
- Tính năng mở rộng: Trẻ có thể chạm để "bóc tách" các mảng bóng lồng nhau (tách giỏ mây rời khỏi khí cầu, tách 3 ngọn tháp rời khỏi tường thành) để củng cố tư duy phân tích hình khối không gian (`C2.GEO` & `C4.VIS.04`).

---

### Phân đoạn 5: Kết Thúc Chặng — Thắp Sáng Viên Ngọc Tinh Mắt (Trang 23 — `GT-000` Outro)
1. Sau khi vượt qua thử thách Trang 22, Chuyến Tàu Toán Học tiến thẳng lên Đỉnh Kim Cương.
2. Gấu Logic và Thỏ Quan Sát xuất hiện hân hoan chúc mừng bé:
   - Gấu Logic: *"Bé đã tìm lại những chiếc bóng thật chính xác!"*
   - Thỏ Quan Sát: *"Viên Ngọc Tinh Mắt đã sáng lên rồi!"*
3. Chiếc huy hiệu "Viên Ngọc Tinh Mắt" (`Observer Jewel` — hình viên kim cương tỏa ánh hào quang đa sắc) xuất hiện giữa màn hình.
4. Trẻ chạm vào viên ngọc: Hiệu ứng pháo hoa sao vàng nở bừng rực rỡ, phát huy hiệu chứng nhận hoàn thành Chặng 3.
5. Cột tiến trình đường ray ánh sáng cập nhật mốc: **Ga 3/20 hoàn thành**! Còi tàu vang lên tiếng tu tu giòn giã mở khóa Chặng 4.

---

## 5. Alternative Flows & Xử Lý Biên

| # | Nhánh tình huống | Điều kiện kích hoạt | Hành vi hệ thống |
|---|---|---|---|
| 1 | Nối nhầm bóng sai cặp (D1 - `GT-005`) | Trẻ kéo dây từ Quả táo sang bóng Nải chuối | Sợi dây nối co lại êm dịu trong 300ms, slot bóng nhấp nháy nhịp hổ phách (`amber_soft`); không có âm buzzer trừng phạt, giữ nguyên các cặp đã nối đúng trước đó. |
| 2 | Trẻ gặp khó khăn khi vuốt kéo (D1) | Trẻ mầm non 3 tuổi hoặc thiết bị cảm ứng ma sát cao | Tự động kích hoạt cơ chế **Tap-Tap Fallback**: Chạm chọn thẻ vật thể ở cột trái (thẻ nảy nhẹ và viền sáng kích hoạt) $\rightarrow$ chạm tiếp vào bóng ở cột phải để kết nối. |
| 3 | Chạm nhầm bóng nhiễu (D2 - `GT-001`) | Trẻ chạm vào bóng lật gương hoặc thiếu phụ kiện | Thẻ bóng phát xung nhịp thở hổ phách (340ms), giọng đọc định hướng ấm áp của Thỏ Quan Sát nhắc nhẹ: *"Bé hãy nhìn kỹ hướng quay / phụ kiện nhé!"*. |
| 4 | Trẻ dừng thao tác $\ge 10\text{s}$ | Không có cử chỉ chạm hoặc kéo trong thời gian quy định | Kích hoạt thang trợ giúp Scaffolding: `L1` (nhấp nháy viền đối tượng), `L2` (Bàn tay ma ghostHand chỉ đường nối), `L3` (Bàn tay ma thực hiện mẫu tốc độ $0.5\times$). |
| 5 | Bật chế độ giảm chuyển động (`prefers-reduced-motion`) | Thiết bị hoặc phụ huynh bật cờ trợ năng | Tắt bỏ hoạt ảnh nảy pop, rung lắc và pháo hoa hạt; thay bằng chuyển đổi mờ chồng mềm mại (cross-fade 250ms). |
| 6 | Môi trường tắt tiếng / Âm thanh lỗi | Mute volume hoặc lỗi nạp audio | Mọi chỉ dẫn và phản hồi đều có biểu tượng thị giác song hành: Viền phát sáng, icon bàn tay chỉ hướng, nhãn chữ to rõ $\ge 18\text{px}$. |
| 7 | Thoát màn chơi dở dang | Trẻ hoặc phụ huynh nhấn nút thoát | Lưu tiến trình đã hoàn thành của chặng; giải phóng RAF loop và interaction listeners, không làm crash ứng dụng. |

---

## 6. Business Rules & Sư Phạm Bất Biến

| ID | Quy tắc nghiệp vụ | Căn cứ & Lý do sư phạm |
|---|---|---|
| `BR-CHANG03-01` | **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`** | Tuân thủ chỉ thị kiến trúc nền tảng: Sử dụng 100% các khuôn mẫu game engine Canvas 2D hiện hữu (`GT-005`, `GT-001`, `GT-002`, `GT-000`). Bãi bỏ triệt để các mã template ảo như `GT-040`. |
| `BR-CHANG03-02` | **100% Design Tokens, cấm tuyệt đối Hex Literals** | Mọi màu sắc (nền đêm thung lũng, viền phát sáng, bóng đen silhouette, nhịp hổ phách), font chữ và bán kính bo góc phải lấy từ `designTokens` (`packages/game-engine/src/systems/designTokens.ts`). |
| `BR-CHANG03-03` | **Không màu đỏ, không âm báo trừng phạt (Montessori Invariant)** | Sai lầm là cơ hội học tập. Khi thao tác sai, hệ thống chỉ phản hồi nhịp thở hổ phách dịu (`amber_soft`), sợi dây co về vị trí cũ, kèm lời gợi ý ấm áp của Thỏ Quan Sát. |
| `BR-CHANG03-04` | **Sàn cảm ứng đạt chuẩn theo lứa tuổi** | Tuân thủ Rule 07: Band 3–4 tối thiểu $96\text{px}$; band 5–6 tối thiểu $72\text{px}$. Kích thước các thẻ vật phẩm và thẻ bóng $\ge 84\text{px} \times 84\text{px}$, khoảng cách mép an toàn $\ge 16\text{px}$. |
| `BR-CHANG03-05` | **Bắt buộc hỗ trợ cơ chế Tap-Tap Fallback trên `GT-005`** | Cử chỉ kéo thả (Drag) là rào cản lớn với trẻ 3–4 tuổi. Mọi màn chơi dạng nối cặp phải cho phép chạm chọn 2 bước để trẻ không bị bế tắc vận động tinh. |
| `BR-CHANG03-06` | **Tuân thủ quy chuẩn không thương mại hóa (`BR-MCM-06`)** | Tuyệt đối không chứa các từ khóa thương mại đo trí tuệ (IQ, Raven, bài test thông minh) trong mọi metadata, tiêu đề, hướng dẫn hoặc lời thoại. |
| `BR-CHANG03-07` | **Quy chuẩn mã level Montessori (`BR-MGL-02`)** | Toàn bộ mã game level phải có định dạng `GL-<COMP>-<STRAND>-<MECH>-01xx` với sequence $\ge 0101$, gắn nhãn `montessori_ref: "WB03-D<n>"`. |
| `BR-CHANG03-08` | **Phân bổ Access Tier khớp Difficulty (`BR-MGL-12`)** | Độ khó 1 $\rightarrow$ `free`; Độ khó 2 $\rightarrow$ `login`; Độ khó 3 $\rightarrow$ `standard`; Độ khó 4/5 $\rightarrow$ `premium`. |
| `BR-CHANG03-09` | **Trần item và dung lượng chú ý theo lứa tuổi** | Mầm 3–4 tuổi: 3–4 cặp; Chồi 4–5 tuổi: 4–5 cặp; Lá 5–6 tuổi: tối đa 6 cặp (chạm trần trí nhớ làm việc thị giác mầm non). |
| `BR-CHANG03-10` | **Trần âm thanh an toàn trẻ em** | Master volume $\le -16\text{ LUFS}$, true peak $\le -1\text{ dBTP}$. Mọi SFX có ramp-in $\ge 20\text{ms}$ và ramp-out $\ge 40\text{ms}$. |

---

## 7. Ma Trận Ánh Xạ Dạng Bài Montessori Chặng 3

| Mã dạng bài | Phân đoạn trang PDF | Tên dạng bài | Khuôn hiện hành | Strand chính | Skill Code đề xuất | Độ khó & Tier |
|:---:|:---:|---|:---:|:---:|:---:|:---:|
| `WB03-D1` | Trang 2–11, 20–21 | Nối cặp 1-1 vật thể với bóng tương ứng | `GT-005` (pair-match) | `C4.VIS` / `C1.OTO` / `C4.DET` | `C4.VIS.01`, `C1.OTO.01`, `C4.DET.04` | Diff 1 (`free`) $\rightarrow$ Diff 4 (`premium`) |
| `WB03-D2` | Trang 12–19 | Trắc nghiệm tìm bóng đúng (4 lựa chọn, phân tích bẫy) | `GT-001` (tap-select) | `C4.VIS` / `C2.GEO` / `C4.DET` | `C4.VIS.01`, `C2.GEO.01`, `C4.DET.04` | Diff 2 (`login`) $\rightarrow$ Diff 3 (`standard`) |
| `WB03-D3` | Trang 22 | Đại thử thách đa hàng & Phân giải bóng phức hợp | `GT-002` (tap-select-multi) | `C4.VIS` / `C4.DET` / `C2.GEO` | `C4.VIS.01`, `C4.DET.04` | Diff 3 (`standard`) $\rightarrow$ Diff 4 (`premium`) |
| `WB03-Hub` | Trang 1 & 23 | Khám phá Thung Lũng Đá Đêm & Trao Huy Hiệu Viên Ngọc Tinh Mắt | `GT-000` (concept-intro) | `C4.VIS` / `C4.DET` | `C4.VIS.01` | Diff 1 (`free`) |

---

## 8. Thiết Kế SkillDataset Cho Từng Dạng Bài

### 8.1. SkillDataset Bổ Sung Cho `C4.VIS.01` (Tìm Điểm Khác Biệt & Ghép Cặp Bóng)

```typescript
import type { SkillDataset } from "@mindkid/shared";

export const CHANG_03_SILHOUETTE_DATASET: SkillDataset = {
  skill_code: "C4.VIS.01",
  concept_label: "Nhận biết bóng hình & Phân biệt chi tiết đường viền",
  surface: "game",
  items: [
    // --- Nhóm Trái Cây (Trang 2) ---
    {
      id: "fruit_apple",
      label: "quả táo đỏ",
      image: { kind: "emoji", ref: "🍎" },
      contrast_group: "fruit_contour",
      category: { type: "trái cây", contour: "tròn có cuống lá" },
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/apple.mp3",
    },
    {
      id: "fruit_banana",
      label: "nải chuối vàng",
      image: { kind: "emoji", ref: "🍌" },
      contrast_group: "fruit_contour",
      category: { type: "trái cây", contour: "cong lưỡi liềm" },
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/banana.mp3",
    },
    {
      id: "fruit_pineapple",
      label: "quả dứa chín",
      image: { kind: "emoji", ref: "🍍" },
      contrast_group: "fruit_contour",
      category: { type: "trái cây", contour: "chùm lá nhọn" },
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/pineapple.mp3",
    },

    // --- Nhóm Đồ Chơi & Hình Khối (Trang 3) ---
    {
      id: "toy_car",
      label: "ô tô đồ chơi",
      image: { kind: "emoji", ref: "🚗" },
      contrast_group: "toy_shape",
      category: { type: "đồ chơi", shape: "vòm cong 2 bánh xe" },
      value: 4,
      ordering: 4,
    },
    {
      id: "toy_teddy",
      label: "chú gấu bông",
      image: { kind: "emoji", ref: "🧸" },
      contrast_group: "toy_shape",
      category: { type: "đồ chơi", shape: "đầu tai tròn nơ cổ" },
      value: 5,
      ordering: 5,
    },
    {
      id: "toy_kite",
      label: "cánh diều bay",
      image: { kind: "emoji", ref: "🪁" },
      contrast_group: "toy_shape",
      category: { type: "đồ chơi", shape: "tứ giác nhọn đuôi lượn sóng" },
      value: 6,
      ordering: 6,
    },
    {
      id: "toy_ball",
      label: "quả bóng tròn",
      image: { kind: "emoji", ref: "⚽" },
      contrast_group: "toy_shape",
      category: { type: "đồ chơi", shape: "hình cầu đối xứng tròn vo" },
      value: 7,
      ordering: 7,
    },

    // --- Nhóm Động Vật & Trắc Nghiệm Distractor (Trang 12, 13, 14, 18) ---
    {
      id: "target_squirrel",
      label: "chú sóc ôm hạt dẻ",
      image: { kind: "emoji", ref: "🐿️" },
      contrast_group: "animal_distractor",
      category: { type: "động vật", orientation: "quay phải", feature: "đuôi chữ S hạt dẻ" },
      value: 8,
      ordering: 8,
      metadata: { correct_shadow: "shadow_squirrel_correct" },
    },
    {
      id: "target_butterfly",
      label: "bướm xinh xòe cánh",
      image: { kind: "emoji", ref: "🦋" },
      contrast_group: "animal_distractor",
      category: { type: "động vật", orientation: "bay chếch phải", feature: "2 râu xoắn cánh lượn sóng" },
      value: 9,
      ordering: 9,
      metadata: { correct_shadow: "shadow_butterfly_correct" },
    },
    {
      id: "target_goldfish",
      label: "cá vàng bơi lội",
      image: { kind: "emoji", ref: "🐟" },
      contrast_group: "animal_distractor",
      category: { type: "động vật", orientation: "bơi sang trái", feature: "vây lưng nhọn đuôi chẻ đôi" },
      value: 10,
      ordering: 10,
      metadata: { correct_shadow: "shadow_goldfish_correct" },
    },
    {
      id: "target_peacock",
      label: "chim công xòe đuôi",
      image: { kind: "emoji", ref: "🦚" },
      contrast_group: "animal_distractor",
      category: { type: "động vật", orientation: "đầu quay trái", feature: "3 chùm mào đuôi xòe quạt" },
      value: 11,
      ordering: 11,
      metadata: { correct_shadow: "shadow_peacock_correct" },
    },

    // --- Nhóm Phức Hợp & Đại Thử Thách (Trang 19, 22) ---
    {
      id: "target_fire_truck",
      label: "xe cứu hỏa",
      image: { kind: "emoji", ref: "🚒" },
      contrast_group: "vehicle_ladder",
      category: { type: "phương tiện", orientation: "đầu quay phải", feature: "còi đèn thang nghiêng" },
      value: 12,
      ordering: 12,
    },
    {
      id: "target_hot_air_balloon",
      label: "khinh khí cầu",
      image: { kind: "emoji", ref: "🎈" },
      contrast_group: "compound_shape",
      category: { type: "cấu trúc đa khối", feature: "quả cầu tròn giỏ mây chữ nhật" },
      value: 13,
      ordering: 13,
    },
    {
      id: "target_castle",
      label: "lâu đài cổ tích",
      image: { kind: "emoji", ref: "🏰" },
      contrast_group: "compound_shape",
      category: { type: "kiến trúc đa khối", feature: "3 tháp chóp nón tháp giữa cắm cờ" },
      value: 14,
      ordering: 14,
    },
  ],
  relations: [
    // Nối cặp tương đồng 1-1 giữa vật và bóng (pair)
    { type: "pair", source_id: "fruit_apple", target_id: "shadow_apple", explanation: "Bóng quả táo có cuống và chiếc lá nghiêng" },
    { type: "pair", source_id: "fruit_banana", target_id: "shadow_banana", explanation: "Bóng nải chuối cong hình lưỡi liềm" },
    { type: "pair", source_id: "fruit_pineapple", target_id: "shadow_pineapple", explanation: "Bóng quả dứa có chùm lá nhọn xòe trên đỉnh" },
    { type: "pair", source_id: "toy_car", target_id: "shadow_toy_car", explanation: "Bóng ô tô có vòm mui cong và 2 bánh xe tròn" },
    { type: "pair", source_id: "toy_teddy", target_id: "shadow_teddy", explanation: "Bóng gấu bông có 2 tai tròn và nơ cổ" },
    { type: "pair", source_id: "toy_kite", target_id: "shadow_kite", explanation: "Bóng con diều hình thoi có đuôi dây lượn sóng" },
    { type: "pair", source_id: "toy_ball", target_id: "shadow_ball", explanation: "Bóng quả bóng tròn vo đối xứng tuyệt đối" },

    // Quan hệ tương phản và bẫy nhiễu có chủ đích (contrast)
    { type: "contrast", source_id: "target_squirrel", target_id: "shadow_squirrel_straight_tail", explanation: "Bẫy biến đổi hình thái: Đuôi duỗi thẳng ngang thay vì uốn chữ S" },
    { type: "contrast", source_id: "target_squirrel", target_id: "shadow_squirrel_mirror", explanation: "Bẫy lật gương đối xứng: Chú sóc quay mặt sang trái" },
    { type: "contrast", source_id: "target_squirrel", target_id: "shadow_squirrel_no_nut", explanation: "Bẫy khuyết phụ kiện: Chú sóc không ôm hạt dẻ trên tay" },
    { type: "contrast", source_id: "target_butterfly", target_id: "shadow_butterfly_one_antenna", explanation: "Bẫy đếm số lượng chi tiết: Chỉ có 1 chiếc râu trên đầu" },
    { type: "contrast", source_id: "target_butterfly", target_id: "shadow_butterfly_mirror", explanation: "Bẫy hướng bay: Bướm bay chếch sang bên trái" },
    { type: "contrast", source_id: "target_butterfly", target_id: "shadow_butterfly_pointed_wings", explanation: "Bẫy đường bao: Cánh thon nhọn lá liễu mất gợn sóng" },
    { type: "contrast", source_id: "target_goldfish", target_id: "shadow_goldfish_mirror", explanation: "Bẫy hướng bơi: Cá bơi sang bên phải" },
    { type: "contrast", source_id: "target_goldfish", target_id: "shadow_goldfish_no_dorsal_fin", explanation: "Bẫy khuyết chi tiết: Thiếu vây lưng nhọn" },
    { type: "contrast", source_id: "target_goldfish", target_id: "shadow_goldfish_round_tail", explanation: "Bẫy hình dạng đuôi: Đuôi tròn vo không chẻ thùy" },
    { type: "contrast", source_id: "target_castle", target_id: "shadow_castle_no_center_spire", explanation: "Bẫy cấu trúc: Khuyết ngọn tháp chính giữa cắm cờ" },
    { type: "contrast", source_id: "target_castle", target_id: "shadow_castle_flat_towers", explanation: "Bẫy hình khối: Cắt cụt các chóp nón nhọn thành tháp bằng phẳng" },
  ],
  ladder: [
    { rung: 1, dimension: "item_count", description: "Ghép cặp 3 vật thể hình học cơ bản (Trái cây)" },
    { rung: 2, dimension: "item_count", description: "Ghép cặp 4 vật thể có chi tiết phụ kiện (Đồ chơi, Phương tiện)" },
    { rung: 3, dimension: "distractor_subtlety", description: "Trắc nghiệm 4 lựa chọn phân tích bẫy lật gương và thiếu chi tiết" },
    { rung: 4, dimension: "pose_and_compound", description: "Phân biệt tư thế nhân vật và bóc tách bóng kép mẹ - con" },
    { rung: 5, dimension: "max_capacity_matrix", description: "Đại thử thách ma trận đa hàng và nối 6 cặp cực hạn" },
  ],
  phrasing: {
    prompt_template: "Bé hãy tìm chiếc bóng đúng của {label} nhé!",
    narration_template: "Chúng mình cùng thám hiểm Thung Lũng Bóng Hình cùng Gấu Logic và Thỏ Quan Sát nhé!",
  },
  ordering: [
    "fruit_apple",
    "fruit_banana",
    "fruit_pineapple",
    "toy_car",
    "toy_teddy",
    "toy_kite",
    "toy_ball",
    "target_squirrel",
    "target_butterfly",
    "target_goldfish",
    "target_peacock",
    "target_fire_truck",
    "target_hot_air_balloon",
    "target_castle",
  ],
};
```

---

### 8.2. SkillDataset Bổ Sung Cho `C4.DET.04` (Quan Sát Tư Thế & Động Tác)

```typescript
export const CHANG_03_POSE_DATASET: SkillDataset = {
  skill_code: "C4.DET.04",
  concept_label: "Phân biệt biến thể tư thế & cử động của cùng một nhân vật",
  surface: "game",
  items: [
    // --- 4 Tư Thế Gấu Con (Trang 7) ---
    {
      id: "bear_wave_left",
      label: "chú gấu vẫy tay trái",
      image: { kind: "emoji", ref: "🧸" },
      contrast_group: "bear_pose",
      category: { character: "gấu con", pose_arm: "tay trái giơ vẫy, tay phải xuôi" },
      value: 1,
      ordering: 1,
    },
    {
      id: "bear_cheer_both",
      label: "chú gấu giơ hai tay",
      image: { kind: "emoji", ref: "🧸" },
      contrast_group: "bear_pose",
      category: { character: "gấu con", pose_arm: "hai tay giơ cao hoan hô" },
      value: 2,
      ordering: 2,
    },
    {
      id: "bear_arms_down",
      label: "chú gấu xuôi hai tay",
      image: { kind: "emoji", ref: "🧸" },
      contrast_group: "bear_pose",
      category: { character: "gấu con", pose_arm: "hai tay khép sát thân buông xuôi" },
      value: 3,
      ordering: 3,
    },
    {
      id: "bear_point_right",
      label: "chú gấu chỉ tay phải",
      image: { kind: "emoji", ref: "🧸" },
      contrast_group: "bear_pose",
      category: { character: "gấu con", pose_arm: "tay phải duỗi ngang chỉ sang phải" },
      value: 4,
      ordering: 4,
    },

    // --- Tư Thế Nghệ Thuật & Thể Thao (Trang 16, 17) ---
    {
      id: "dancer_ballet",
      label: "vũ công múa ballet",
      image: { kind: "emoji", ref: "🩰" },
      contrast_group: "action_pose",
      category: { character: "vũ công", pose_detail: "tay cong trên đầu, tay duỗi ngang, chân co lùi" },
      value: 5,
      ordering: 5,
    },
    {
      id: "boy_scooter",
      label: "bé trai đi xe trượt",
      image: { kind: "emoji", ref: "🛴" },
      contrast_group: "action_pose",
      category: { character: "bé trai", pose_detail: "đội mũ bảo hiểm lưỡi trai, chân co đạp gió" },
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    { type: "contrast", source_id: "bear_wave_left", target_id: "bear_cheer_both", explanation: "Khác biệt giữa giơ 1 tay và giơ cả 2 tay" },
    { type: "contrast", source_id: "bear_arms_down", target_id: "bear_point_right", explanation: "Khác biệt giữa tay xuôi và tay chỉ ngang" },
    { type: "contrast", source_id: "dancer_ballet", target_id: "shadow_dancer_both_arms_up", explanation: "Bẫy tư thế: Cả hai tay uốn cong trên đầu" },
    { type: "contrast", source_id: "dancer_ballet", target_id: "shadow_dancer_arm_behind", explanation: "Bẫy tư thế: Cánh tay duỗi ngang bị chĩa ngược ra sau lưng" },
  ],
  ladder: [
    { rung: 1, dimension: "limb_symmetry", description: "Phân biệt tư thế tay đối xứng vs bất đối xứng" },
    { rung: 2, dimension: "orientation_angle", description: "Phân biệt góc gập của chân và góc chỉ của cánh tay" },
    { rung: 3, dimension: "full_body_pose", description: "Phân tích tư thế nghệ thuật kết hợp trọng tâm cơ thể" },
  ],
  phrasing: {
    prompt_template: "Bé hãy nhìn kỹ tay và chân để chọn đúng bóng của {label} nhé!",
    narration_template: "Gấu Logic nhắc: 'Cùng một bạn nhỏ nhưng tư thế đã khác nhau rồi đấy!'",
  },
  ordering: ["bear_wave_left", "bear_cheer_both", "bear_arms_down", "bear_point_right", "dancer_ballet", "boy_scooter"],
};
```

---

## 9. Thiết Kế SkillLevelPlan[] Chi Tiết

Dưới đây là danh mục 10 `SkillLevelPlan` chuẩn mực phân bổ vào 4 file seeder kỹ năng hiện hữu trong `packages/content/src/skills/`:

### 9.1. Kế hoạch Level cho `C4.VIS.01` (`packages/content/src/skills/c4/vis/C4.VIS.01.ts`)

```typescript
// Bổ sung vào mảng C4_VIS_01_SEED.levels:
export const CHANG_03_C4_VIS_LEVELS: SkillLevelPlan[] = [
  // 1. WB03-D1 (GT-005): Cấp độ 1 - Khởi động bóng trái cây 3 cặp (Trang 2)
  {
    code: "GL-C4-VIS-PAIR-0101",
    template: "GT-005",
    band: "3-4",
    difficulty: 1,
    access_tier: "free",
    theme: "food",
    rounds: 3,
    montessori_ref: "WB03-D1",
    skill_codes: ["C4.VIS.01", "C4.VIS.02"],
  },

  // 2. WB03-D1 (GT-005): Cấp độ 2 - Bóng đồ chơi & con vật 4 cặp (Trang 3, 4)
  {
    code: "GL-C4-VIS-PAIR-0102",
    template: "GT-005",
    band: "3-4",
    difficulty: 2,
    access_tier: "login",
    theme: "nature",
    rounds: 3,
    montessori_ref: "WB03-D1",
    skill_codes: ["C4.VIS.01", "C4.DET.02"],
  },

  // 3. WB03-D2 (GT-001): Trắc nghiệm tìm bóng đúng có bẫy nhiễu - Sóc ôm hạt dẻ & Bướm xinh (Trang 12, 13)
  {
    code: "GL-C4-VIS-TAP-0103",
    template: "GT-001",
    band: "3-4",
    difficulty: 2,
    access_tier: "login",
    theme: "nature",
    rounds: 3,
    montessori_ref: "WB03-D2",
    skill_codes: ["C4.VIS.01", "C2.ORI.02", "C2.MIR.01"],
  },

  // 4. WB03-D2 (GT-001): Trắc nghiệm tìm bóng đúng - Cá vàng & Chim công xòe đuôi (Trang 14, 18)
  {
    code: "GL-C4-VIS-TAP-0104",
    template: "GT-001",
    band: "4-5",
    difficulty: 3,
    access_tier: "standard",
    theme: "nature",
    rounds: 3,
    montessori_ref: "WB03-D2",
    skill_codes: ["C4.VIS.01", "C2.ORI.01"],
  },

  // 5. WB03-D3 (GT-002): Đại thử thách ma trận bóng đa hàng & Khinh khí cầu, Lâu đài (Trang 22)
  {
    code: "GL-C4-VIS-MTX-0105",
    template: "GT-002",
    band: "4-5",
    difficulty: 3,
    access_tier: "standard",
    theme: "school",
    rounds: 3,
    montessori_ref: "WB03-D3",
    skill_codes: ["C4.VIS.01", "C2.GEO.03"],
  },
];
```

### 9.2. Kế hoạch Level cho `C1.OTO.01` (`packages/content/src/skills/c1/oto/C1.OTO.01.ts`)

```typescript
// Bổ sung vào mảng C1_OTO_01_SEED.levels:
export const CHANG_03_C1_OTO_LEVELS: SkillLevelPlan[] = [
  // 6. WB03-D1 (GT-005): Ghép tương ứng 1-1 đồ vật quen thuộc & cốc nước, ô gấp (Trang 6)
  {
    code: "GL-C1-OTO-PAIR-0101",
    template: "GT-005",
    band: "3-4",
    difficulty: 1,
    access_tier: "free",
    theme: "home",
    rounds: 3,
    montessori_ref: "WB03-D1",
    skill_codes: ["C1.OTO.01", "C4.VIS.02"],
  },

  // 7. WB03-D1 (GT-005): Ghép 1-1 khối bóng phức hợp Mẹ & Bé (Trang 10)
  {
    code: "GL-C1-OTO-PAIR-0102",
    template: "GT-005",
    band: "4-5",
    difficulty: 2,
    access_tier: "login",
    theme: "animal",
    rounds: 3,
    montessori_ref: "WB03-D1",
    skill_codes: ["C1.OTO.01", "C1.CMP.01"],
  },
];
```

### 9.3. Kế hoạch Level cho `C2.GEO.01` (`packages/content/src/skills/c2/geo/C2.GEO.01.ts`)

```typescript
// Bổ sung vào mảng C2_GEO_01_SEED.levels:
export const CHANG_03_C2_GEO_LEVELS: SkillLevelPlan[] = [
  // 8. WB03-D1 (GT-005): Nhận diện bóng hình học phương tiện giao thông (Trang 5)
  {
    code: "GL-C2-GEO-PAIR-0101",
    template: "GT-005",
    band: "3-4",
    difficulty: 1,
    access_tier: "free",
    theme: "vehicle",
    rounds: 3,
    montessori_ref: "WB03-D1",
    skill_codes: ["C2.GEO.01", "C2.GEO.03", "C2.GEO.04"],
  },
];
```

### 9.4. Kế hoạch Level cho `C4.DET.04` (`packages/content/src/skills/c4/det/C4.DET.04.ts`)

```typescript
// Bổ sung vào mảng C4_DET_04_SEED.levels:
export const CHANG_03_C4_DET_LEVELS: SkillLevelPlan[] = [
  // 9. WB03-D1 (GT-005): Phân biệt tư thế tay gấu con 4 tư thế (Trang 7)
  {
    code: "GL-C4-DET-PAIR-0101",
    template: "GT-005",
    band: "3-4",
    difficulty: 2,
    access_tier: "login",
    theme: "home",
    rounds: 3,
    montessori_ref: "WB03-D1",
    skill_codes: ["C4.DET.04", "C2.ORI.01", "C2.ORI.02"],
  },

  // 10. WB03-D2 (GT-001): Trắc nghiệm tư thế động học - Bé đi xe trượt & Cô bé múa (Trang 16, 17)
  {
    code: "GL-C4-DET-TAP-0102",
    template: "GT-001",
    band: "4-5",
    difficulty: 3,
    access_tier: "standard",
    theme: "school",
    rounds: 3,
    montessori_ref: "WB03-D2",
    skill_codes: ["C4.DET.04", "C2.ORI.02"],
  },

  // 11. WB03-D1 (GT-005): Thử thách cực hạn 6 cặp Lễ hội & Rừng rậm (Trang 20, 21)
  {
    code: "GL-C4-DET-PAIR-0103",
    template: "GT-005",
    band: "5-6",
    difficulty: 4,
    access_tier: "premium",
    theme: "nature",
    rounds: 3,
    montessori_ref: "WB03-D1",
    skill_codes: ["C4.DET.04", "C4.VIS.01"],
  },
];
```

---

## 10. Kiến Trúc Gamification & World Map Hub

### 10.1. Mốc Ga Số 3 Trên Bản Đồ Tuyến Đường Ray Ánh Sáng:
- Khi hoàn thành level cuối cùng của Chặng 3:
  - Bản đồ World Map Hub đánh dấu Ga số 3 chuyển sang trạng thái `active_completed` (đèn lồng ga bừng sáng xanh ngọc).
  - Thanh tiến trình tổng thể hiển thị: `3 / 20 Ga Hoàn Thành` ($15\%$).
  - Mảnh Đường Ray Ánh Sáng số 3 (Mảnh Đường Ray Thạch Anh Khắc Hình Kim Cương) bay lên ráp khít vào lỗ hổng trên tuyến đường ray chính.

### 10.2. Hệ Thống Huy Hiệu Thưởng (Reward Badge):
- **Tên huy hiệu**: Viên Ngọc Tinh Mắt (`Observer Jewel`).
- **Hình thức**: Viên kim cương xanh ngọc phát quang đa sắc viền vàng rực rỡ.
- **Ý nghĩa sư phạm**: Tôn vinh khả năng quan sát nhạy bén, kiên nhẫn đối chiếu chi tiết đường viền và phân biệt tư thế không gian của trẻ.
- **Tương tác Canvas**: Trẻ chạm vào viên kim cương để kích hoạt hiệu ứng pháo hoa sao vàng $360^\circ$ và mở khóa tính năng tô màu tự do 3 ngôi sao nỗ lực (mô phỏng theo Trang 23 của sách bài tập in).

---

## 11. BDD Gherkin Scenarios

### Kịch bản 1: Nối đúng cặp bóng quả táo trên `GT-005` (Trang 2)
```gherkin
Feature: Ghép cặp 1-1 vật thể và bóng đen (WB03-D1)
  Scenario: Trẻ kéo dây nối quả táo với bóng quả táo chính xác
    Given Màn hình chơi GT-005 đang mở với chủ đề "Bóng Của Trái Cây"
    And Cột trái hiển thị "Quả táo đỏ" tại vị trí 1
    And Cột phải hiển thị "Bóng quả táo" tại vị trí 3
    When Trẻ chạm vào Quả táo và kéo dây thả vào tâm Bóng quả táo
    Then Sợi dây nối bừng sáng thành dải sáng vàng neon
    And Quả táo và chiếc bóng nảy pop nhẹ nhàng (scale 1.15)
    And Âm thanh "ting!" ngân vang trong trẻo
    And Giọng đọc tiếng Việt phát: "Quả táo - Đúng rồi!"
    And Cặp quả táo được khóa cố định, không thể kéo lại
```

### Kịch bản 2: Bẫy lật gương khi tìm bóng chú sóc trên `GT-001` (Trang 12)
```gherkin
Feature: Trắc nghiệm tìm bóng đúng và phân tích bẫy nhiễu (WB03-D2)
  Scenario: Trẻ chọn nhầm phương án lật gương trục dọc (Đáp án C)
    Given Màn hình chơi GT-001 hiển thị hình mẫu "Chú sóc ôm hạt dẻ quay sang phải"
    And 4 ô đáp án A, B, C, D hiển thị bên dưới
    When Trẻ chạm vào ô đáp án C (Bóng chú sóc quay sang trái)
    Then Ô đáp án C phát nhịp thở màu hổ phách dịu (amber_soft) trong 340ms
    And Tuyệt đối không xuất hiện dấu X đỏ và không có âm buzzer trừng phạt
    And Thỏ Quan Sát phát giọng đọc gợi ý: "Bé nhìn lại hướng quay của chú sóc nhé!"
    And Ô đáp án C trở lại trạng thái bình thường để trẻ chọn lại
```

### Kịch bản 3: Hoàn thành đại thử thách ma trận đa hàng trên `GT-002` (Trang 22)
```gherkin
Feature: Đại thử thách ma trận đa hàng (WB03-D3)
  Scenario: Trẻ hoàn thành chính xác 3 hàng bóng phức hợp
    Given Màn hình chơi GT-002 hiển thị ma trận 3 hàng: Thỏ, Khí cầu, Lâu đài
    When Trẻ chạm chọn đúng bóng ở Hàng 1 (Thỏ ôm cà rốt)
    And Trẻ chạm chọn đúng bóng ở Hàng 2 (Khí cầu đủ giỏ mây)
    And Trẻ chạm chọn đúng bóng ở Hàng 3 (Lâu đài 3 ngọn tháp cắm cờ)
    Then Cả 3 hàng đồng loạt bừng sáng hào quang vàng rực rỡ
    And Âm nhạc marimba ăn mừng rộn rã vang lên
    And Chuyến Tàu Toán Học xuất hiện hụ còi xình xịch
    And Hệ thống chuyển cảnh sang màn Outro trao "Viên Ngọc Tinh Mắt"
```

---

## 12. Verification & Safety Checklist

- [ ] **Quy chuẩn Engine**: 100% sử dụng `GT-005`, `GT-001`, `GT-002`, `GT-000`. TUYỆT ĐỐI KHÔNG xuất hiện `GT-038` hay `GT-040`.
- [ ] **Quy chuẩn Token**: 0 hex literals trong gameplay code; toàn bộ màu từ `designTokens.colors`.
- [ ] **Sàn cảm ứng**: Hitbox $\ge 96\text{px}$ (band 3–4) và $\ge 72\text{px}$ (band 5–6).
- [ ] **Cơ chế Fallback**: Đảm bảo game drag-drop (`GT-005`) có đầy đủ cơ chế chạm chọn 2 bước (Tap-Tap Fallback).
- [ ] **Phản hồi sư phạm**: Không có bất kỳ màu đỏ trừng phạt hay âm báo lỗi tiêu cực; sai chỉ thở hổ phách (`amber_soft`).
- [ ] **Mã định danh Level**: Mọi mã đều tuân thủ `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$).
- [ ] **Quy chuẩn Access Tier**: `difficulty 1` $\rightarrow$ `free`, `difficulty 2` $\rightarrow$ `login`, `difficulty 3` $\rightarrow$ `standard`, `difficulty 4` $\rightarrow$ `premium`.
- [ ] **Kiểm soát nhãn hiệu (`BR-MCM-06`)**: Không chứa bất kỳ từ khóa IQ, Raven, bài test trí tuệ.
- [ ] **Kiểm tra biên dịch**: Chạy `pnpm --filter @mindkid/content typecheck` và `pnpm check:test-ratchet` đạt kết quả xanh sạch.
