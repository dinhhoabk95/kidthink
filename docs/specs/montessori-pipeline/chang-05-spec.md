---
spec: MONTESSORI-CHANG-05-SPEC
title: Chặng 5: Thành Phố Săn Số — Tìm Thật Nhanh, Điền Thật Đúng
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-05
workbook_ref: WB05
gem_reward: Viên Ngọc Chính Xác (Accuracy Gem)
owns:
  - Phân tích sư phạm và giải mã 23 trang PDF Chặng 5 (Thành phố săn số, WB05)
  - Ánh xạ 3 dạng bài WB05-D1, WB05-D2, WB05-D3 vào các game template hiện có GT-037, GT-002, GT-028
  - Thiết kế SkillDataset (items, relations, axes, ladder, phrasing) lấy cảm hứng từ nông sản, côn trùng cánh nhỏ, cún con hoạt cảnh, tắc kè ngụy trang
  - Thiết kế SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101)
  - Kiến trúc phần thưởng Viên Ngọc Chính Xác & Gamification Chặng 5
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 5: Thành Phố Săn Số — Tìm Thật Nhanh, Điền Thật Đúng

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này sở hữu đặc tả kỹ thuật và sư phạm nhằm tích hợp dữ liệu trích xuất từ tài liệu PDF **"Chặng 5: Thành phố săn số — Tìm thật nhanh, Điền thật đúng"** (`docs/montessori/extracted/chang-05/analysis.json`, nguồn: *Tập 5 bộ sách Gấu Logic & Thỏ Quan Sát - Chuyến Tàu Toán Học*, 23 trang, Montessori VN) vào nền tảng **TiniMath v2**.

### Mục tiêu chiến lược:
1. **Thiết lập Bối cảnh & Nhiệm vụ Gamification (Narrative Quest & Reward)**:
   - **Bối cảnh**: Thành Phố Săn Số — một đô thị cổ tích rực rỡ với quảng trường chợ nông sản nhộn nhịp, đài phun nước trung tâm và các khu vườn sinh vật đa sắc.
   - **Biến cố**: Cơn Bão Lộn Xộn quét qua làm các con số trên các biển chỉ dẫn bị cuốn bay mất và đảo lộn toàn bộ rau củ, đàn côn trùng, các bạn thú nhỏ vào nhau.
   - **Nhiệm vụ học tập**: Bé nhập vai "Thợ săn số đại tài" đồng hành cùng Gấu Logic (cầm clipboard ghi chép) và Thỏ Quan Sát (soi kính lúp thám tử) để tìm đúng từng loại hình, đếm chính xác và gắn số tương ứng, khôi phục lại trật tự cho thành phố.
   - **Phần thưởng chặng**: Thu thập **Viên Ngọc Chính Xác** (*Accuracy Gem* — biểu tượng kim cương lấp lánh `diamond_sparkle`, tượng trưng cho sự kiên trì, quan sát tỉ mỉ, đếm chính xác không bỏ sót và không đếm lặp) và nhận **Mảnh Đường Ray Ánh Sáng số 5**.
2. **Khai thác triệt để các Game Engine hiện hữu (`GT-000`..`GT-037`)**:
   - **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**.
   - Phân giải 23 trang PDF thành 3 dạng bài chuẩn (`WB05-D1`, `WB05-D2`, `WB05-D3`) tương thích 100% với các khuôn đã có:
     - `GT-037` (*symbol-hunt* / Scatter Board Matrix): Săn tìm và khoanh tất cả số mục tiêu hoặc đối tượng mục tiêu giữa mạng lưới bẫy đảo ngược và hình thái vi chi tiết (`WB05-D1`, `WB05-D3`).
     - `GT-002` (*tap-select-multi*): Chọn tất cả các đối tượng/nhóm đối tượng thỏa mãn tiêu chí đếm (`WB05-D1` fallback, `WB05-D2` discrete).
     - `GT-028` (*tap-count* / Tally Counter): Chạm đếm tích lũy từng cá thể trên bàn chơi kèm đánh dấu chấm sáng chống đếm lặp và phát âm đếm nhịp nhàng (`WB05-D2`).
3. **Phổ biến kho ngữ liệu `SkillDataset` & `SkillLevelPlan[]`**:
   - Bổ sung các tập hợp vật phẩm sống động (cà chua, cà rốt, bọ rùa chấm bi, ong mật sọc màu, cún cưng hoạt cảnh, tắc kè ngụy trang định hướng) và câu thoại dẫn dắt vào các seeder kỹ năng:
     - `packages/content/src/skills/c1/nrec/C1.NREC.03.ts` (Nhận biết số 0–10)
     - `packages/content/src/skills/c1/cnt/C1.CNT.01.ts` (Đếm đồ vật)
     - `packages/content/src/skills/c4/vis/C4.VIS.01.ts` (Phân biệt thị giác chi tiết)
   - Cấp mã level chuẩn `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), gắn nhãn `montessori_ref: "WB05-D<n>"`, phân bổ `access_tier` khớp `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4/5: `premium`), tuân thủ nghiêm ngặt `BR-MCM-06` (không chứa từ khóa thương mại IQ/Raven/trí tuệ).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò hệ thống | Vai trò sư phạm & Đặc điểm nhận diện |
|---|---|---|
| **Bé (Kid Player)** | Người chơi chính (3–6 tuổi) | Nhập vai "Thợ săn số", rèn luyện sự kết hợp mắt – tay – não, chạm tìm và đếm từng đối tượng mục tiêu không bỏ sót, không đếm lặp. |
| **Gấu Logic (`gau_logic`)** | Nhân vật đồng hành (Scaffolding Guide) | Đại diện tư duy logic & kiểm soát tiến trình (Left-brain analytical). Ngoại hình: Gấu nâu tròn trĩnh, kính cận xanh tròn, áo gile tím than, tay cầm clipboard danh mục kiểm đếm có các ô số trống. Thường nhắc nhở về tính trật tự: *"Gió đã xáo trộn cả khu vườn rồi! Bé hãy tìm từng loại, đếm xem có bao nhiêu bạn nhé!", "Các chú cún trông gần giống nhau đấy, bé nhớ kiểm tra kỹ nhé!"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Nhân vật đồng hành (Sensory Observer) | Đại diện tư duy trực quan & phân biệt thị giác (Right-brain sensory). Ngoại hình: Thỏ trắng nhanh nhẹn, túi da chéo vàng, kính lúp thám tử viền cam đỏ cán vàng. Lời thoại định hướng chiến lược quét và chống bẫy: *"Bé nhìn thật kỹ đôi cánh và hướng quay nhé!", "Coi chừng những con số nghịch ngợm quay ngược đầu làm bé nhầm lẫn đấy!", "Quét mắt từ trái sang phải, từ trên xuống dưới nào!"*. |
| **Phụ huynh / Giáo viên** | Người đồng hành ngoài màn hình | Hướng dẫn theo mô hình 4 bước của Chặng 5 (`analysis.json:95-156`): (1) Chạm tay đếm trực tiếp $\rightarrow$ (2) Phân đoạn chú ý có chọn lọc $\rightarrow$ (3) Quét thị giác ziczac $\rightarrow$ (4) Đánh dấu chống lặp/sót $\rightarrow$ (5) Chia vùng không gian. |
| **Content Seeder Engine** | Hệ thống tự động | Chuyển hóa `SkillLevelPlan[]` thành `ContentSeed` hợp lệ, xác thực qua bộ cổng kiểm thử `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-05/analysis.json
   │
   ├──> docs/montessori/dataset/activity-types-table.md  (Chuẩn hóa WB05-D1, WB05-D2, WB05-D3)
   ├──> docs/specs/05-content/montessori-corpus-mapping.md (Cập nhật hàng WB05: GT-037, GT-028, GT-002)
   │
   ├──> packages/content/src/skills/c1/nrec/C1.NREC.03.ts (WB05-D1 -> GT-037: GL-C1-NREC-HUNT-0101, WB05-D3 -> GL-C1-NREC-HUNT-0102)
   ├──> packages/content/src/skills/c1/cnt/C1.CNT.01.ts   (WB05-D2 -> GT-028: GL-C1-CNT-TCNT-0101, GL-C1-CNT-TCNT-0102)
   └──> packages/content/src/skills/c4/vis/C4.VIS.01.ts   (WB05-D1 -> GT-037: GL-C4-VIS-HUNT-0101, GL-C4-VIS-HUNT-0102)
```

- **Mã nguồn Engine sử dụng**:
  - `packages/game-engine/src/templates/GT-037/` (`GT037Session` — Symbol Hunt / Scatter Board).
  - `packages/game-engine/src/templates/GT-028/` (`GT028Session` — Tap Count / Cumulative Counting).
  - `packages/game-engine/src/templates/GT-002/` (`TapSelectMultiSession` — Multiple Choice Tap Select).
- **Phạm vi kiểm thử & Xác thực**:
  - `packages/content-build/src/gates/montessori-gate.ts`.
  - `packages/content-build/tests/gates/montessori-corpus.test.ts`.

---

## 4. Main Flow: Kịch Bản Sư Phạm 23 Trang PDF Chặng 5

Trải nghiệm số hóa Chặng 5 được tổ chức thành 5 nấc thang sư phạm tương ứng 5 cấp độ phức tạp tăng tiến:

```
[Trang 1: Mở màn] ──> [Cấp 1: Pages 2–4] ──> [Cấp 2: Pages 5–8] ──> [Cấp 3: Pages 9–16] ──> [Cấp 4: Pages 17–21] ──> [Cấp 5: Page 22] ──> [Trang 23: Về Đích]
  Thành Phố Săn Số     Khởi động trực quan     Mở rộng danh mục       Đồng dạng khác chi tiết    Đánh dấu chống lặp/sót     Tắc kè ngụy trang       Viên Ngọc Chính Xác
  Đài phun nước        (9–11 items, 3 loại)    (16–23 items, 4 loại)  (20–24 items, vi chi tiết) (20–24 items, hành động)    (24 items, hướng L/R)   Mảnh Đường Ray #5
```

### Phân đoạn 0: Trang 1 — Cửa Ngõ Thành Phố Săn Số (`WB05-Intro`)
1. Đoàn tàu Chuyến Tàu Toán Học đỗ tại Quảng Trường Trung Tâm Thành Phố Săn Số rực rỡ ánh nắng.
2. Trên đỉnh đài phun nước, Viên Ngọc Chính Xác khổng lồ tỏa ánh kim cương xanh mát.
3. Cơn Bão Lộn Xộn bất ngờ làm bay mất các con số trên các biển báo: `Ong = ?`, `Cà rốt = ?`, `Cà chua = ?`, `Bướm = ?`.
4. Gấu Logic cầm bảng danh mục: *"Bé hãy cùng chúng mình tìm lại các con số và giúp Thành Phố Săn Số bình yên trở lại nhé!"*.
5. Thỏ Quan Sát giơ kính lúp: *"Sẵn sàng lên đường thôi thợ săn nhí!"*.

### Phân đoạn 1: Cấp độ 1 — Khởi Động Trực Quan (Trang 2–4: Pages 2–4)
- **Đặc trưng sư phạm**: Mật độ thưa (9–11 đối tượng), 3 danh mục, độ tương phản hình thái và màu sắc tối đa (không có bẫy cùng loài).
- **Trang 2 (Vườn rau bị xáo trộn)**: 3 Cà chua đỏ tươi, 4 Cà rốt cam cuống xanh, 2 Cà tím thẫm.
- **Trang 3 (Khu vườn côn trùng nhỏ)**: 3 Bọ rùa đỏ chấm bi đen, 3 Bướm hồng phấn, 4 Ong vàng sọc đen.
- **Trang 4 (Những người bạn bò tí hon)**: 4 Sâu xanh uốn lượn, 4 Ong mật, 3 Nhện tím mắt to.
- **Tương tác**: Trẻ chạm vào thẻ mẫu ở khay trên $\rightarrow$ chạm đếm từng cá thể trên bảng (chấm sáng đánh dấu nảy lên, phát âm 1, 2, 3...) $\rightarrow$ xác nhận số lượng tương ứng.
- **Gợi ý Montessori**: *"Chạm tay vào từng hình khi đếm"*.

### Phân đoạn 2: Cấp độ 2 — Mở Rộng Danh Mục & Mật Độ (Trang 5–8: Pages 5–8)
- **Đặc trưng sư phạm**: Mở rộng 4 loại đối tượng, mật độ dày hơn (16–23 đối tượng), xuất hiện các sinh vật cùng nhóm.
- **Trang 5 (Vũ điệu cánh nhỏ)**: 4 Bướm hồng, 4 Chuồn chuồn xanh mỏng, 4 Bọ rùa đỏ, 4 Ong vàng.
- **Trang 6 (Bữa sáng trong thành phố)**: 4 Bánh mì nướng vàng nâu, 3 Hộp sữa trắng xanh, 5 Trứng ốp la lòng đỏ cam, 4 Xúc xích nướng đỏ nâu.
- **Trang 7 (Khu chợ rau đông vui)**: 6 Cà chua đỏ mọng, 5 Cà rốt cam tươi, 4 Cà tím thẫm, 5 Đậu Hà Lan hạt tròn.
- **Trang 8 (Vũ hội côn trùng)**: 6 Ong vàng, 6 Bọ rùa đỏ, 5 Nhện tím sẫm, 6 Bướm hồng sen.
- **Gợi ý Montessori**: *"Tìm xong một loại rồi mới đếm loại khác"*.

### Phân đoạn 3: Cấp độ 3 — Đồng Nhất Hình Thái, Phân Biệt Vi Chi Tiết (Trang 9–16: Pages 9–16)
- **Đặc trưng sư phạm**: Thách thức thị giác tăng vọt — Các cá thể trong bài có hình dáng giống hệt nhau, CHỈ KHÁC màu sắc hoặc chi tiết nhỏ; số lượng 20–24 cá thể.
- **Trang 9 (Đàn bướm rực rỡ)**: 5 Bướm hồng, 5 Bướm xanh da trời, 5 Bướm tím cà, 5 Bướm vàng tươi (tổng 20).
- **Trang 10 (Biệt đội ong chăm chỉ)**: 5 Ong vàng sọc đen, 5 Ong xanh dương sọc đen, 5 Ong cam sọc đen, 5 Ong tím sọc đen (tổng 20).
- **Trang 11 (Hội bọ rùa chấm bi)**: 5 Bọ rùa đỏ, 5 Bọ rùa vàng, 5 Bọ rùa xanh dương, 5 Bọ rùa hồng (tổng 20).
- **Trang 12 (Biệt đội cún con)**: 6 Cún cam tai nhọn vểnh, 6 Cún trắng kem tai xoăn xù, 6 Cún nâu socola tai cụp, 6 Cún vàng tai cụp nơ hồng (tổng 24).
- **Trang 13 (Sân chơi động tác)**: 6 Chó con cúi người, 6 Kangaroo nhảy vọt, 6 Dê nâu bước đi, 6 Mèo vàng lăn ngửa giơ 4 chân (tổng 24).
- **Trang 14 (Cún con đang làm gì?)**: 5 Cún vẽ tranh giá vẽ, 5 Cún ăn bát xanh, 5 Cún đánh đàn guitar, 5 Cún gặm xương trắng (tổng 20).
- **Trang 15 (Khu rừng đáng yêu)**: 5 Cáo cam đuôi xù, 5 Hà mã xám mập, 5 Hải ly nâu răng thỏ, 5 Sói con tai vểnh (tổng 20).
- **Trang 16 (Bốn sắc thái cún con)**: 5 Cún vàng cười tươi, 5 Cún trắng kem mỉm cười, 5 Cún nâu há miệng lè lưỡi, 5 Cún đốm tai nâu (tổng 20).
- **Gợi ý Montessori**: *"Quét mắt từ trái sang phải, từ trên xuống dưới"*.

### Phân đoạn 4: Cấp độ 4 — Đánh Dấu Kiểm Soát Chống Lặp/Sót (Trang 17–21: Pages 17–21)
- **Đặc trưng sư phạm**: 20–24 cá thể với hành động và đạo cụ đan xen phức tạp. Trẻ bắt buộc phải vận dụng cơ chế ghim đánh dấu trực quan để không đếm lặp.
- **Trang 17 (Rừng xanh thức giấc)**: 6 Sói xám tro, 6 Hươu sừng tấm xòe rộng, 6 Cáo đỏ cam ngồi ngoan, 6 Hải ly socola gặm gỗ (tổng 24).
- **Trang 18 (Vũ hội thú rừng)**: 5 Hà mã xám, 5 Sư tử bờm nâu tròn, 5 Gấu nâu khoanh tay, 5 Mèo rừng tai nhọn (tổng 20).
- **Trang 19 (Đội cún khác biệt)**: 5 Corgi tai to đuôi xù, 5 Chó đốm đứng tai dài, 5 Bulldog nâu vòng cổ đỏ, 5 Chó vàng vươn cổ vểnh tai (tổng 20).
- **Trang 20 (Những cún con bận rộn)**: 5 Cún đeo ba lô xanh, 5 Cún ngồi đọc báo, 5 Cún quàng khăn len xanh, 5 Cún đứng vẽ tranh (tổng 20).
- **Trang 21 (Ngôi nhà mèo tinh nghịch)**: 6 Mèo xanh cuộn ngủ, 6 Mèo mướp cam ngồi, 6 Mèo xanh quàng khăn đỏ, 6 Mèo mướp cam đứng 4 chân (tổng 24).
- **Gợi ý Montessori**: *"Đánh dấu nhẹ những hình bé đã đếm"*.

### Phân đoạn 5: Cấp độ 5 — Thử Thách Đỉnh Cao: Tắc Kè Ngụy Trang & Hướng Không Gian (Trang 22: Page 22)
- **Đặc trưng sư phạm**: 24 chú tắc kè ngụy trang xanh lá hòa vào phông nền, phân biệt cực kỳ tinh vi giữa màu sọc lưng và hướng quay đầu (Trái vs Phải).
- **4 nhóm mục tiêu**:
  1. 6 Tắc kè sọc vàng quay trái
  2. 6 Tắc kè sọc đỏ quay phải
  3. 6 Tắc kè xanh ngọc quay phải
  4. 6 Tắc kè sọc lam quay trái
- **Gợi ý Montessori**: *"Chia khu vực nhỏ để đếm không bị sót"*.

### Phân đoạn 6: Trang 23 — Về Đích & Tỏa Sáng Viên Ngọc Chính Xác (`WB05-Reward`)
1. Bé hoàn thành toàn bộ các thử thách săn số. Đài phun nước trung tâm phát sáng lung linh.
2. Hoạt cảnh mở thưởng: Viên Ngọc Chính Xác xoay 3D với hào quang kim cương rực rỡ (`diamond_sparkle`).
3. Mini-game giải mã màu theo số: Bé chọn màu cho từng vùng số 1–5 để tô sáng hoàn thiện viên ngọc.
4. Mảnh Đường Ray Ánh Sáng số 5 ghép vào Chuyến Tàu Toán Học. Mốc số 5 trên bản đồ hành trình tick xanh hoàn thành.
5. Còi tàu hụ vang: *"Tu tu xình xịch! Sẵn sàng lên tàu đến Chặng 6: Thung lũng cân bằng!"*.

---

## 5. Alternative Flows & Xử Lý Biên

| # | Tình huống / Biên | Phản hồi của hệ thống | Cơ sở Sư phạm & Kỹ thuật |
|---|---|---|---|
| 1 | Trẻ chần chừ không thao tác sau 10 giây | Kích hoạt Scaffolding L1 (Nudge): 1 đối tượng mục tiêu chưa đếm nhấp nháy ánh vàng dịu (`amberGlow`). | Scaffolding tự động leo thang không cần xin trợ giúp. |
| 2 | Trẻ dừng lại sau 18–25 giây | Kích hoạt Scaffolding L2 (Guide): Bàn tay ma (`ghostHand`) chỉ đường quét mẫu từ góc trên trái sang phải hình chữ Z. | Định hình thói quen quét thị giác có hệ thống. |
| 3 | Trẻ chạm nhầm vào vật không thuộc nhóm mục tiêu | Vật chạm sai phát xung nhịp thở hổ phách mềm mại (`amber_soft`, 300ms), âm mộc "cốc" êm ái (ramp $\ge 20\text{ms}$). Tuyệt đối KHÔNG có dấu X đỏ, KHÔNG có tiếng buzzer báo động lỗi, KHÔNG trừ điểm. | Kiểm soát lỗi tự thân (Control of Error) không phán xét. |
| 4 | Trẻ chạm vào đối tượng đã được đếm | Cá thể phát xung nhịp rung rinh vui vẻ và đọc lại số thứ tự tương ứng, không tính là thao tác sai. | Tránh phạt trẻ khi trẻ muốn kiểm tra lại kết quả đếm. |
| 5 | Trẻ bấm quá nhanh liên tục vào màn hình | Hệ thống áp dụng debounce cảm ứng 200ms, khử rung vi chạm (touch jitter). | Giữ tính ổn định của game loop 60fps trên Canvas 2D. |
| 6 | Trẻ bỏ sót đối tượng khi xác nhận hoàn thành | Giọng Gấu Logic gợi ý dịu dàng: *"Vẫn còn bạn nhỏ đang trốn đấy, bé tìm kỹ thêm nhé!"*, thẻ mục tiêu phát nhịp hổ phách nhẹ. | Khuyến khích tính kiên trì và kiểm tra lại kết quả. |
| 7 | Bật chế độ giảm chuyển động (`prefers-reduced-motion`) | Tắt toàn bộ hiệu ứng breathing scale và pháo hoa rực rỡ; chuyển trạng thái đánh dấu thành vòng sáng tĩnh cố định; hào quang viên ngọc chuyển thành mờ chồng (cross-fade 200ms). | Tuân thủ Accessibility WCAG 2.1 AA. |
| 8 | Thiết bị tắt tiếng / audio lỗi | Mọi thông tin đều được biểu đạt đồng thời bằng hình ảnh: Thẻ mục tiêu nổi bật, vòng sáng khóa đối tượng, bộ đếm số hiện rõ trên thanh HUD. | Kênh thị giác đa chiều độc lập với âm thanh. |

---

## 6. Business Rules & Sư Phạm Bất Biến

| Mã Rule | Tên quy tắc | Nội dung & Lý do cưỡng chế |
|---|---|---|
| `BR-ENG-FIXED` | **Tuyệt đối không tạo `GT-038+`** | Mọi tương tác của Chặng 5 bắt buộc phải sử dụng các khuôn mẫu hiện có trong hệ thống: `GT-037` (symbol-hunt), `GT-002` (tap-select-multi), `GT-028` (tap-count). Cấm tạo engine mới. |
| `BR-MCM-06` | **Cấm từ khóa thương mại & đo trí tuệ** | Cấm — **NEVER dùng các từ "IQ", "Raven", "trí tuệ", "chỉ số thông minh", "WISC", "Stanford-Binet"**. Tên chặng và các danh hiệu phải mang tính giáo dục Montessori: "Thành phố săn số", "Thợ săn số đại tài", "Viên Ngọc Chính Xác". |
| `BR-MGL-02` | **Khối mã số thứ tự dành riêng Montessori** | Mọi mã game level Montessori sử dụng số thứ tự từ `0101` trở lên: `GL-<COMP>-<STRAND>-<MECH>-01xx`. Mã tham chiếu `montessori_ref` là duy nhất (`WB05-D1`, `WB05-D2`, `WB05-D3`). |
| `BR-MGL-12` | **Access Tier khớp chặt chẽ Độ khó** | `difficulty: 1` $\rightarrow$ `access_tier: "free"`; `difficulty: 2` $\rightarrow$ `access_tier: "login"`; `difficulty: 3` $\rightarrow$ `access_tier: "standard"`; `difficulty: 4/5` $\rightarrow$ `access_tier: "premium"`. |
| `BR-MCM-13` | **Cô lập một thuộc tính (Isolation of Property)** | Mỗi màn chơi chỉ biến thiên một chiều nhận thức: Cấp 1 cô lập chủng loại; Cấp 3 cô lập màu sắc sọc; Cấp 5 cô lập hướng quay đầu trái/phải. |
| `BR-MCM-15` | **Tiến trình nhận thức CPA** | Trẻ tương tác từ vật thể cụ thể (rau củ, côn trùng, cún cưng) $\rightarrow$ hình ảnh biểu trưng và đếm tương ứng 1-1 $\rightarrow$ ghi nhận vào ký hiệu số trừu tượng (1–10). |
| `BR-MLS-07` | **100% Audio dẫn dắt tiếng Việt** | Trẻ mầm non 3–6 tuổi chưa biết đọc; toàn bộ chỉ dẫn, tên con vật, số đếm và lời thoại của Gấu Logic, Thỏ Quan Sát phải có lồng tiếng chuẩn tiếng Việt. |
| `BR-E037-01` | **Hợp đồng kích thước `GT-037`** | `item_count` phải nằm trong khoảng $[12, 30]$, `target_copies` nằm trong khoảng $[2, 8]$, và `item_count > target_copies + confusable_ids.length`. |
| `BR-E037-06` | **Cấm xoay ký hiệu chữ số trên `GT-037`** | Khi asset là chữ số hoặc chữ cái Unicode (`DIGIT_OR_LETTER_REGEX`), cấm tuyệt đối khai báo `orientation_free: true` để tránh làm sai lệch nhận thức số học của trẻ. |
| `BR-E037-07` | **Không trùng lặp glyph trên `GT-037`** | Mọi ký hiệu trong `symbols` phải phân biệt được sau khi chuẩn hóa Unicode NFC; ký hiệu gây nhiễu cấm trùng glyph với ký hiệu đích. |
| `BR-E028-01` | **Hợp đồng chia hết của `GT-028`** | `target_total` phải chia hết cho `step` (ở Chặng 5 áp dụng đếm 1-1 với `step: 2` hoặc đếm tích lũy tương thích). |
| `BR-E002-04` | **Phân biệt distractor trên `GT-002`** | Các phương án gây nhiễu trên `GT-002` phải có asset phân biệt rõ ràng với đáp án đúng và khác nhau từng đôi. |

---

## 7. Ma Trận Ánh Xạ Dạng Bài Montessori Chặng 5

| Mã dạng bài | Tên dạng bài | Khuôn hiện hành | Strand chính | Skill Code | Band | Diff | Tier | Lô | Trạng thái |
|---|---|:---:|---|---|:---:|:---:|:---:|:---:|:---:|
| `WB05-D1` | Săn tìm & Khoanh đối tượng / Số mục tiêu trong ma trận ký hiệu | `GT-037` *(fallback `GT-002`)* | `C1.NREC` / `C4.VIS` | `C1.NREC.03`, `C4.VIS.01` | 4–5 | 2–4 | `login` / `standard` / `premium` | A | Nhận (Lô A) |
| `WB05-D2` | Tìm đối tượng mục tiêu, đếm tổng số lần xuất hiện & Chọn/Điền số | `GT-028` *(kết hợp `GT-002`)* | `C1.CNT` | `C1.CNT.01`, `C1.CNT.03`, `C1.CNT.06` | 3–4, 4–5 | 1–3 | `free` / `login` / `standard` | A | Nhận (Lô A) |
| `WB05-D3` | Tô màu theo mã số trên lưới / Tranh ẩn Viên Ngọc Chính Xác | `GT-037` *(chế độ declare)* | `C1.NREC` | `C1.NREC.03` | 4–5 | 3 | `standard` | A | Nhận (Lô A) |

---

## 8. Thiết Kế SkillDataset Cho Từng Dạng Bài

### 8.1. Dataset cho `WB05-D1` — Săn Tìm & Phân Biệt Thị Giác (`C1.NREC.03` & `C4.VIS.01`)

```typescript
import type { SkillDataset } from "@mindkid/shared";

export const CHANG_05_SYMBOL_HUNT_DATASET: SkillDataset = {
  skill_code: "C1.NREC.03",
  concept_label: "Thành Phố Săn Số — Phân Biệt Số & Hình Mục Tiêu",
  surface: "game",
  items: [
    {
      id: "num_6",
      label: "Số 6",
      glyph: "6",
      value: 6,
      audio_path: "/audio/voice/common/numbers/6.mp3",
      image: { kind: "text", text: "6" },
      category: { type: "chữ số", parity: "chẵn" },
      contrast_group: "number_hunt",
    },
    {
      id: "num_9_distractor",
      label: "Số 9",
      glyph: "9",
      value: 9,
      audio_path: "/audio/voice/common/numbers/9.mp3",
      image: { kind: "text", text: "9" },
      category: { type: "chữ số", parity: "lẻ" },
      contrast_group: "number_hunt",
    },
    {
      id: "num_2",
      label: "Số 2",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: { kind: "text", text: "2" },
      category: { type: "chữ số", parity: "chẵn" },
      contrast_group: "number_hunt",
    },
    {
      id: "num_5_distractor",
      label: "Số 5",
      glyph: "5",
      value: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      image: { kind: "text", text: "5" },
      category: { type: "chữ số", parity: "lẻ" },
      contrast_group: "number_hunt",
    },
    {
      id: "bee_yellow",
      label: "Ong vàng sọc đen",
      audio_path: "/audio/voice/montessori/chang05/bee_yellow.mp3",
      image: { kind: "emoji", ref: "🐝" },
      category: { type: "côn trùng", color: "vàng" },
      contrast_group: "insect_hunt",
    },
    {
      id: "ladybug_red",
      label: "Bọ rùa đỏ chấm bi",
      audio_path: "/audio/voice/montessori/chang05/ladybug_red.mp3",
      image: { kind: "emoji", ref: "🐞" },
      category: { type: "côn trùng", color: "đỏ" },
      contrast_group: "insect_hunt",
    },
    {
      id: "butterfly_pink",
      label: "Bướm hồng phấn",
      audio_path: "/audio/voice/montessori/chang05/butterfly_pink.mp3",
      image: { kind: "emoji", ref: "🦋" },
      category: { type: "côn trùng", color: "hồng" },
      contrast_group: "insect_hunt",
    },
    {
      id: "dog_pointy_ear",
      label: "Cún cam tai vểnh",
      audio_path: "/audio/voice/montessori/chang05/dog_pointy.mp3",
      image: { kind: "emoji", ref: "🐕" },
      category: { type: "thú cưng", detail: "tai vểnh" },
      contrast_group: "dog_hunt",
    },
    {
      id: "dog_floppy_ear",
      label: "Cún nâu tai cụp",
      audio_path: "/audio/voice/montessori/chang05/dog_floppy.mp3",
      image: { kind: "emoji", ref: "🐶" },
      category: { type: "thú cưng", detail: "tai cụp" },
      contrast_group: "dog_hunt",
    },
    {
      id: "gecko_left",
      label: "Tắc kè sọc vàng quay trái",
      audio_path: "/audio/voice/montessori/chang05/gecko_left.mp3",
      image: { kind: "emoji", ref: "🦎" },
      category: { type: "bò sát", orientation: "trái" },
      contrast_group: "gecko_hunt",
    },
  ],
  axes: {
    category: { values: ["chữ số", "côn trùng", "thú cưng", "bò sát"] },
  },
  relations: [
    { type: "contrast", source_id: "num_6", target_id: "num_9_distractor" },
    { type: "contrast", source_id: "num_2", target_id: "num_5_distractor" },
    { type: "contrast", source_id: "dog_pointy_ear", target_id: "dog_floppy_ear" },
  ],
  ladder: [
    { rung: 1, dimension: "contrast", description: "Săn tìm số giữa các chữ số có độ tương phản cao" },
    { rung: 2, dimension: "confusable", description: "Phân biệt số mục tiêu với số đảo ngược (6 vs 9, 2 vs 5)" },
    { rung: 3, dimension: "visual_feature", description: "Phân biệt các đối tượng cùng loài khác màu sắc hoặc kiểu tai" },
    { rung: 4, dimension: "spatial_direction", description: "Phát hiện đối tượng ngụy trang theo hướng không gian (Trái vs Phải)" },
  ],
  phrasing: {
    prompt_template: "Thợ săn nhí ơi! Bé hãy tìm tất cả {label} đang ẩn nấp nhé!",
    narration_template: "Gió đã xáo trộn Thành Phố Săn Số, chúng mình cùng tìm các bạn mục tiêu nhé!",
  },
  ordering: ["num_6", "num_9_distractor", "num_2", "num_5_distractor", "bee_yellow", "ladybug_red", "butterfly_pink", "dog_pointy_ear", "dog_floppy_ear", "gecko_left"],
};
```

---

### 8.2. Dataset cho `WB05-D2` — Đếm Từng Loại Trong Tranh Hỗn Hợp (`C1.CNT.01`)

```typescript
import type { SkillDataset } from "@mindkid/shared";

export const CHANG_05_TALLY_COUNT_DATASET: SkillDataset = {
  skill_code: "C1.CNT.01",
  concept_label: "Thành Phố Săn Số — Đếm Từng Loại Nông Sản & Côn Trùng",
  surface: "game",
  items: [
    {
      id: "harvest_tomato",
      label: "Cà chua đỏ mọng",
      glyph: "🍅",
      value: 1,
      audio_path: "/audio/voice/montessori/chang05/tomato.mp3",
      image: { kind: "emoji", ref: "🍅" },
      category: { type: "rau củ", color: "đỏ" },
      contrast_group: "vegetables",
    },
    {
      id: "harvest_carrot",
      label: "Cà rốt cam cuống xanh",
      glyph: "🥕",
      value: 1,
      audio_path: "/audio/voice/montessori/chang05/carrot.mp3",
      image: { kind: "emoji", ref: "🥕" },
      category: { type: "rau củ", color: "cam" },
      contrast_group: "vegetables",
    },
    {
      id: "harvest_eggplant",
      label: "Cà tím thẫm",
      glyph: "🍆",
      value: 1,
      audio_path: "/audio/voice/montessori/chang05/eggplant.mp3",
      image: { kind: "emoji", ref: "🍆" },
      category: { type: "rau củ", color: "tím" },
      contrast_group: "vegetables",
    },
    {
      id: "harvest_peas",
      label: "Đậu Hà Lan hạt tròn",
      glyph: "🫛",
      value: 1,
      audio_path: "/audio/voice/montessori/chang05/peas.mp3",
      image: { kind: "emoji", ref: "🫛" },
      category: { type: "rau củ", color: "xanh lá" },
      contrast_group: "vegetables",
    },
    {
      id: "critter_bee",
      label: "Ong mật chăm chỉ",
      glyph: "🐝",
      value: 1,
      audio_path: "/audio/voice/montessori/chang05/bee.mp3",
      image: { kind: "emoji", ref: "🐝" },
      category: { type: "sinh vật nhỏ" },
      contrast_group: "insects",
    },
    {
      id: "critter_ladybug",
      label: "Bọ rùa chấm bi",
      glyph: "🐞",
      value: 1,
      audio_path: "/audio/voice/montessori/chang05/ladybug.mp3",
      image: { kind: "emoji", ref: "🐞" },
      category: { type: "sinh vật nhỏ" },
      contrast_group: "insects",
    },
    {
      id: "critter_spider",
      label: "Nhện tím tí hon",
      glyph: "🕷️",
      value: 1,
      audio_path: "/audio/voice/montessori/chang05/spider.mp3",
      image: { kind: "emoji", ref: "🕷️" },
      category: { type: "sinh vật nhỏ" },
      contrast_group: "insects",
    },
  ],
  axes: {
    category: { values: ["rau củ", "sinh vật nhỏ"] },
  },
  relations: [
    { type: "subset", source_id: "harvest_tomato", target_id: "harvest_carrot" },
    { type: "contrast", source_id: "critter_bee", target_id: "critter_spider" },
  ],
  ladder: [
    { rung: 1, dimension: "count_range", description: "Đếm tập hợp 3–4 đối tượng trực quan rõ ràng" },
    { rung: 2, dimension: "count_range", description: "Đếm tập hợp 5–6 đối tượng trong nhóm 4 danh mục" },
    { rung: 3, dimension: "distractor_density", description: "Đếm có hệ thống từ trái qua phải chống đếm lặp" },
  ],
  phrasing: {
    prompt_template: "Bé hãy tìm từng loại, đếm xem có bao nhiêu {label} nhé!",
    narration_template: "Quét mắt từ trái sang phải, đếm bạn nào thì chạm tay đánh dấu bạn đó nha!",
  },
  ordering: ["harvest_tomato", "harvest_carrot", "harvest_eggplant", "harvest_peas", "critter_bee", "critter_ladybug", "critter_spider"],
};
```

---

### 8.3. Dataset cho `WB05-D3` — Viên Ngọc Chính Xác & Tranh Ẩn Màu Số (`C1.NREC.03`)

```typescript
import type { SkillDataset } from "@mindkid/shared";

export const CHANG_05_ACCURACY_GEM_DATASET: SkillDataset = {
  skill_code: "C1.NREC.03",
  concept_label: "Viên Ngọc Chính Xác — Giải Mã Màu Sắc Theo Số",
  surface: "game",
  items: [
    {
      id: "gem_color_1",
      label: "Số 1 — Màu xanh dương",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: { kind: "emoji", ref: "💎" },
      category: { type: "mã màu", color: "xanh dương" },
      contrast_group: "gem_palette",
    },
    {
      id: "gem_color_2",
      label: "Số 2 — Màu vàng óng",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: { kind: "emoji", ref: "⭐" },
      category: { type: "mã màu", color: "vàng" },
      contrast_group: "gem_palette",
    },
    {
      id: "gem_color_3",
      label: "Số 3 — Màu cam tươi",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: { kind: "emoji", ref: "🔸" },
      category: { type: "mã màu", color: "cam" },
      contrast_group: "gem_palette",
    },
    {
      id: "gem_color_4",
      label: "Số 4 — Màu đỏ ngọc",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: { kind: "emoji", ref: "❤️" },
      category: { type: "mã màu", color: "đỏ" },
      contrast_group: "gem_palette",
    },
    {
      id: "gem_color_5",
      label: "Số 5 — Màu tím huyền bí",
      glyph: "5",
      value: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      image: { kind: "emoji", ref: "🔮" },
      category: { type: "mã màu", color: "tím" },
      contrast_group: "gem_palette",
    },
  ],
  axes: {
    category: { values: ["mã màu"] },
  },
  relations: [
    { type: "sequence", source_id: "gem_color_1", target_id: "gem_color_2" },
    { type: "sequence", source_id: "gem_color_2", target_id: "gem_color_3" },
    { type: "sequence", source_id: "gem_color_3", target_id: "gem_color_4" },
    { type: "sequence", source_id: "gem_color_4", target_id: "gem_color_5" },
  ],
  ladder: [
    { rung: 1, dimension: "color_code", description: "Nhận diện mã màu cho số 1 đến 3" },
    { rung: 2, dimension: "color_code", description: "Nhận diện mã màu cho số 1 đến 5" },
    { rung: 3, dimension: "color_code", description: "Hoàn thiện bức tranh Viên Ngọc Chính Xác tỏa sáng" },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng màu cho số {glyph} để thắp sáng Viên Ngọc Chính Xác nhé!",
    narration_template: "Bức tranh bí mật bị che mờ bởi những ô số, chúng mình cùng giải mã nào!",
  },
  ordering: ["gem_color_1", "gem_color_2", "gem_color_3", "gem_color_4", "gem_color_5"],
};
```

---

## 9. Thiết Kế SkillLevelPlan[] Chi Tiết Cho Từng Dạng Bài

### 9.1. Các Level Cho Seeder `C1.NREC.03` (`packages/content/src/skills/c1/nrec/C1.NREC.03.ts`)

```typescript
// Bổ sung vào mảng C1_NREC_03_SEED.levels:
{
  code: "GL-C1-NREC-HUNT-0101",
  template: "GT-037",
  band: "4-5",
  difficulty: 2,
  access_tier: "login",
  theme: "homeland",
  rounds: 3,
  montessori_ref: "WB05-D1",
  dataset: CHANG_05_SYMBOL_HUNT_DATASET,
  sequence_no: 101,
  skill_codes: ["C1.NREC.03"],
},
{
  code: "GL-C1-NREC-HUNT-0102",
  template: "GT-037",
  band: "4-5",
  difficulty: 3,
  access_tier: "standard",
  theme: "festival",
  rounds: 3,
  montessori_ref: "WB05-D3",
  dataset: CHANG_05_ACCURACY_GEM_DATASET,
  sequence_no: 102,
  skill_codes: ["C1.NREC.03"],
},
{
  code: "GL-C1-NREC-TMLT-0101",
  template: "GT-002",
  band: "4-5",
  difficulty: 1,
  access_tier: "free",
  theme: "homeland",
  rounds: 3,
  montessori_ref: "WB05-D1",
  dataset: CHANG_05_SYMBOL_HUNT_DATASET,
  sequence_no: 103,
  skill_codes: ["C1.NREC.03"],
}
```

---

### 9.2. Các Level Cho Seeder `C1.CNT.01` (`packages/content/src/skills/c1/cnt/C1.CNT.01.ts`)

```typescript
// Bổ sung vào mảng C1_CNT_01_SEED.levels:
{
  code: "GL-C1-CNT-TCNT-0101",
  template: "GT-028",
  band: "4-5",
  difficulty: 2,
  access_tier: "login",
  theme: "farm",
  rounds: 3,
  montessori_ref: "WB05-D2",
  dataset: CHANG_05_TALLY_COUNT_DATASET,
  sequence_no: 101,
  skill_codes: ["C1.CNT.01"],
},
{
  code: "GL-C1-CNT-TCNT-0102",
  template: "GT-028",
  band: "4-5",
  difficulty: 3,
  access_tier: "standard",
  theme: "nature",
  rounds: 3,
  montessori_ref: "WB05-D2",
  dataset: CHANG_05_TALLY_COUNT_DATASET,
  sequence_no: 102,
  skill_codes: ["C1.CNT.01"],
},
{
  code: "GL-C1-CNT-TMUL-0101",
  template: "GT-002",
  band: "4-5",
  difficulty: 2,
  access_tier: "login",
  theme: "farm",
  rounds: 3,
  montessori_ref: "WB05-D2",
  dataset: CHANG_05_TALLY_COUNT_DATASET,
  sequence_no: 103,
  skill_codes: ["C1.CNT.01"],
}
```

---

### 9.3. Các Level Cho Seeder `C4.VIS.01` (`packages/content/src/skills/c4/vis/C4.VIS.01.ts`)

```typescript
// Bổ sung vào mảng C4_VIS_01_SEED.levels:
{
  code: "GL-C4-VIS-HUNT-0101",
  template: "GT-037",
  band: "4-5",
  difficulty: 3,
  access_tier: "standard",
  theme: "nature",
  rounds: 3,
  montessori_ref: "WB05-D1",
  dataset: CHANG_05_SYMBOL_HUNT_DATASET,
  sequence_no: 101,
  skill_codes: ["C4.VIS.01"],
},
{
  code: "GL-C4-VIS-HUNT-0102",
  template: "GT-037",
  band: "5-6",
  difficulty: 4,
  access_tier: "premium",
  theme: "nature",
  rounds: 3,
  montessori_ref: "WB05-D1",
  dataset: CHANG_05_SYMBOL_HUNT_DATASET,
  sequence_no: 102,
  skill_codes: ["C4.VIS.01"],
}
```

---

## 10. Hệ Thống Gamification & Đo Kiểm Telemetry

### 10.1. Cơ Chế Thưởng Chặng 5: Viên Ngọc Chính Xác
- **Tên vật phẩm**: Viên Ngọc Chính Xác (*Accuracy Gem*).
- **Biểu tượng**: Kim cương đa diện phát sáng `diamond_sparkle`.
- **Hiệu ứng khi mở khóa**:
  - Hào quang xanh ngọc bừng sáng quanh đỉnh đài phun nước trung tâm.
  - Còi tàu hơi nước số 5 vang lừng: *"Tu tu xình xịch!"*.
  - Bảng tiến trình hiển thị Mảnh Đường Ray Ánh Sáng số 5 khớp vào đoàn tàu.
  - Mở khóa trạm kế tiếp trên bản đồ: **Chặng 6 — Thung Lũng Cân Bằng** (*WB06*).

### 10.2. Telemetry Events (Đo kiểm hành vi không chứa PII)

```typescript
// 1. Ghi nhận mỗi lần chạm vào đối tượng trên bảng
emit("target_item_tapped", {
  stage_id: "chang-05",
  level_id: level.code,
  item_id: item.id,
  is_correct: item.is_correct,
  elapsed_ms: performance.now() - turnStartMs,
});

// 2. Ghi nhận khi hoàn thành đếm một nhóm mục tiêu
emit("slot_number_filled", {
  stage_id: "chang-05",
  level_id: level.code,
  category_id: category.id,
  expected_count: target.expected_count,
  input_count: userCount,
  is_correct: userCount === target.expected_count,
  attempts: attemptCount,
});

// 3. Ghi nhận hoàn thành màn chơi
emit("stage_completed", {
  stage_id: "chang-05",
  level_id: level.code,
  total_time_ms: totalDurationMs,
  accuracy_rate: correctTaps / totalTaps,
  stars_awarded: computedStars,
  gem_unlocked: "accuracy_gem",
});
```
