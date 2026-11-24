# Khung Đối Chiếu 100 Học Phần Tư Duy Koguma-kai / Kuno Method (Bản Địa Hoá Mầm Non Việt Nam)

> **Mục đích:** Bản thiết kế đối chiếu 1:1 giữa **100 học phần tư duy gốc Koguma-kai / Kuno Method (こぐま会・久野メソッド — Nhật Bản, 3–6 tuổi)** với hệ thống mã kỹ năng bất biến `skills.code` (`C1`–`C6`), 38 khuôn trò chơi (`GT-000`…`GT-037`) và **10 chủ đề Giáo dục Mầm non Việt Nam** (Văn bản hợp nhất số `01/VBHN-BGDĐT`).
> **Contract sở hữu quy tắc chương trình:** [`../specs/05-content/koguma-curriculum-program.md`](../specs/05-content/koguma-curriculum-program.md) · [`../specs/05-content/learning-roadmap-model.md`](../specs/05-content/learning-roadmap-model.md) · [`../specs/05-content/curriculum-model.md`](../specs/05-content/curriculum-model.md).
> **Bất biến tuyệt đối (`BR-CSA-08`, `BR-MCM-04`):** Tài liệu này ánh xạ 100% lên 443 mã `skills.code` và 76 `strands` hiện hành trong [`index.md`](index.md) — **không tự sinh bất kỳ `skills.code` hay `strand` mới nào**.

---

## 1. Triết Lý Sư Phạm Koguma-kai / Kuno Method & Bản Địa Hoá Việt Nam

Phương pháp **Kuno Method** (do nhà giáo dục Yasuyoshi Kuno sáng lập tại **Koguma-kai**, Tokyo) xây dựng nền tảng tư duy tiền tiểu học cho trẻ 3–6 tuổi dựa trên ba trụ cột sư phạm cốt lõi, tương thích trực tiếp với kiến trúc của MindKid:

1. **Giáo dục bằng sự vật thật trước ký hiệu (*Jibutsu Kyoiku* — 事物教育):** Trẻ không học vẹt công thức hay làm phiếu tính cơ học trước tuổi. Mọi khái niệm đi qua thang biểu đạt ba bậc (`BR-NRL-01`): **vận động cơ thể và đồ vật thật ngoài màn hình (`offscreen`) → thao tác vật cụ thể trên bàn chơi (`introduce` / `GT-000`) → luyện tập bán cụ thể và biểu tượng (`practice`)**.
2. **Giáo dục đối thoại & diễn đạt tư duy (*Taiwa Kyoiku* — 対話教育):** Trẻ nắm vững bản chất khi tự giải thích được *"Vì sao bé xếp như thế?"*, *"Điều gì vừa thay đổi?"*. Lời dẫn trên bề mặt trẻ dùng câu hỏi gợi mở tự nhiên của cô giáo mầm non Việt Nam và nhịp đồng dao ấm áp, không chấm điểm hay đếm ngược gây áp lực (`BR-ENG-11`, `BR-PRG-02`).
3. **Cấu trúc xoắn ốc 100 học phần trên 5 miền tư duy nền tảng (*Koguma 100 Units Spiral*):** Thay vì tách rời toán với ngôn ngữ và quan sát đời sống, 100 học phần đan xen 5 miền Kuno xuyên suốt 3 độ tuổi **Mầm (`3-4`) → Chồi (`4-5`) → Lá (`5-6`)**, gắn vào **10 chủ đề năm học mầm non Việt Nam** và chất liệu thị giác **"Tuổi thơ Việt × Giấy Gỗ Mộc"** (tre ngà, chiếu cói, quạt nan, hoa sen, đèn lồng, trống bỏi).

---

## 2. Ma Trận Ánh Xạ 5 Miền Kuno ↔ 6 Năng Lực C1–C6 MindKid

Trong nguyên bản Kuno Method, 100 học phần xoay quanh 6 lĩnh vực gốc (*Đại lượng chưa đo số `未測量` · Biểu tượng vị trí `位置表象` · Số `数` · Hình học `図形` · Ngôn ngữ `言語` · Suy luận – Ghi nhớ – Thường thức đời sống `推理・記憶・常識`*). Khi chuẩn hoá thành **5 trụ cột chương trình Koguma-VN** trên MindKid, toàn bộ 6 năng lực `C1`–`C6` đều được phủ cân bằng (mỗi band phủ đủ 6/6 năng lực theo `BR-CRM-08`, không năng lực nào vượt trần 40% theo `BR-CRM-07`):

| Mã miền Kuno | Trụ cột Koguma-kai / Kuno Method | Lĩnh vực Kuno nguyên bản | Competency MindKid chủ đạo | Số học phần (`Mầm` · `Chồi` · `Lá`) |
|---|---|---|---|---:|
| **`K1`** | **Vị trí – Không gian & Đại lượng trực quan** | `位置表象` (Biểu tượng vị trí) + `未測量` (Đại lượng trực quan: to/nhỏ, dài/ngắn, cao/thấp, nặng/nhẹ, dung tích, thời gian) | `C2` (`ORI`, `DIR`, `GRD`, `MAZ`, `PER`) · `C1` (`CMP`, `MEAS`) | **20** (`6` · `7` · `7`) |
| **`K2`** | **Số lượng & Cấu tạo số** | `数` (Tương ứng 1-1, đếm, số thứ tự, tách–gộp cấu tạo số 2–10, thêm–bớt vật thật, chia đều, đổi ngang giá, biểu đồ vật) | `C1` (`OTO`, `CNT`, `NREC`, `ORD`, `NCOMP`, `ADD`, `SUB`, `PROB`, `DAT`) | **22** (`6` · `8` · `8`) |
| **`K3`** | **Hình học & Cấu trúc khối** | `図形` (Nhận diện hình phẳng, ghép hình/Tangram, khối 3D lăn/đứng, mặt–cạnh–đỉnh, xoay hình, đối xứng gương) | `C2` (`GEO`, `CON`, `SOL`, `ROT`, `MIR`) | **16** (`4` · `5` · `7`) |
| **`K4`** | **Ngôn ngữ tư duy & Tiền đọc viết Việt** | `言語` (Nghe hiểu đa bước, từ vựng sự vật, hỏi–đáp 5W, trình tự truyện, câu nối logic + **bản địa hoá tiếng–vần đồng dao–thanh điệu tiếng Việt** thay cho Kana Nhật) | `C5` (`LIS`, `VOC`, `QUE`, `DES`, `STO`, `GRM`, `BOK`, `PRA`, `PHO`, `RHY`, `TON`, `LET`, `ALP`, `PRN`, `WRT`, `ONS`, `RIM`, `TMK`, `DGR`, `WRD`) | **18** (`5` · `6` · `7`) |
| **`K5`** | **Logic – Phân loại – Quan sát & Điều hành** | `推理・分類・観察・記憶・常識` (Phân loại đa tiêu chí, tập hợp, quy luật, loại suy, ma trận, loại trừ, quan sát tinh, khoa học–xã hội mầm non, trí nhớ làm việc, kìm phản xạ & đổi luật) | `C3` (`CLS`, `SET`, `SRT`, `ANA`, `SEQ`, `RULE`, `MTX`, `DED`, `INF`, `ALG`) · `C4` (`VIS`, `DET`, `MEM`, `SEN`, `AUD`, `TAC`, `OBS`, `EXP`, `CAU`, `LIV`, `MAT`, `SOC`, `HOM`, `SAF`, `ECO`, `TOO`) · `C6` (`ATT`, `WM`, `INH`, `FLX`, `PLN`, `MON`, `PER`, `INI`) | **24** (`7` · `8` · `9`) |
| | **Tổng cộng toàn chương trình** | | **Phủ đủ `C1`–`C6` (443/443 skill liên kết)** | **100** (`28` · `34` · `38`) |

---

## 3. Ràng Buộc Kỹ Thuật Khi Ghép Học Phần Vào Lộ Trình (`RoadmapSeed`)

Để bảng 100 học phần dưới đây dùng trực tiếp được cho bộ lộ trình trong `packages/content/src/roadmaps/` mà đạt 100% cổng kiểm tự động (`roadmap-seed-gate.ts`, `age-band-fit.ts`, `theme-registry.ts`, `engine-content-depth.ts`):

1. **Khớp trần độ tuổi & độ khó (`BR-PAR-01`):**
   - **Band `3-4` (Mầm — 28 học phần `KGM-001`…`KGM-028`):** Mọi `Primary Skill` đều thoả `age_min <= 4`, `age_max >= 3`, và `difficulty <= 2`. Chỉ dùng nhóm khuôn hợp lệ cho `3-4`: `GT-000`, `GT-001`, `GT-003`, `GT-005`, `GT-007`, `GT-008`, `GT-012`, `GT-020`. Chỉ gắn các mã `theme` có `age_floor = 3` (`school`, `farm`, `home`, `animal`, `nature`, `food`, `vehicle`, `family`, `body`, `weather`, `job`).
   - **Band `4-5` (Chồi — 34 học phần `KGM-029`…`KGM-062`):** Mọi `Primary Skill` đều thoả `age_min <= 5`, `age_max >= 4`, và `difficulty <= 3`. Không dùng khuôn bị khoá ở `4-5` (`GT-006`, `GT-011`, `GT-014`…`GT-017`, `GT-024`, `GT-027`, `GT-030`…`GT-036`). Chỉ gắn `theme` có `age_floor <= 4` (không dùng `space`).
   - **Band `5-6` (Lá — 38 học phần `KGM-063`…`KGM-100`):** Mọi `Primary Skill` đều thoả `age_min <= 6`, `age_max >= 5`, và `difficulty <= 5`. Mở toàn bộ 38 khuôn `GT-000`…`GT-037` và toàn bộ 16 mã `theme` trong `CONTENT_THEMES`.
2. **Thứ tự tiên quyết (`BR-CRM-01` & `BR-LRM-11`):** Các kỹ năng tiền đề thuộc band thấp hơn (`age_max < low`) được cổng lộ trình miễn lặp lại tự động; các kỹ năng tiền đề nằm cùng band được sắp xếp xuất hiện ở học phần trước.

---

## 4. Bảng Thiết Kế Chi Tiết 100 Học Phần Tư Duy Koguma-VN (`KGM-001`…`KGM-100`)

### 4.1 Khối Mầm (`3-4` tuổi — 28 học phần: `KGM-001`…`KGM-028`)

| Mã HP | Miền | Tên học phần Koguma-VN (Tiếng Việt) | Khái niệm Kuno gốc | Primary Skill | Kỹ năng bổ trợ cùng cụm | Engine chuẩn (`3-4`) | Chủ đề GDMN & Mã `theme` | Đồ dùng thật / Gợi ý bản địa Việt |
|---|:---:|---|---|---|---|---|---|---|
| `KGM-001` | `K1` | So sánh độ lớn: To hơn – Nhỏ hơn | 大小比較 | `C1.CMP.01` | `C1.CMP.02` | `GT-000`, `GT-001`, `GT-003` | Trường mầm non (`school`) | Bóng mây to, viên bi gỗ nhỏ, cặp sách của bé |
| `KGM-002` | `K1` | So sánh trực quan: Dài – Ngắn, Cao – Thấp | 長短・高低比較 | `C1.MEAS.01` | `C1.MEAS.02`, `C1.CMP.06`, `C1.CMP.07`, `C1.CMP.08`, `C1.CMP.09` | `GT-000`, `GT-001`, `GT-008` | Thực vật (`nature`) | Đũa tre dài/ngắn, cây chuối cao/cây nấm thấp |
| `KGM-003` | `K1` | Vị trí không gian: Phía trên – Phía dưới | 上下関係 | `C2.ORI.03` | `C2.ORI.04` | `GT-000`, `GT-001`, `GT-003` | Gia đình (`home`) | Đặt chén lên mặt bàn gỗ, để dép dưới gầm ghế |
| `KGM-004` | `K1` | Vị trí đóng mở: Bên trong – Bên ngoài | 内外関係 | `C2.ORI.07` | `C2.ORI.08` | `GT-001`, `GT-003` | Động vật (`farm`) | Gà con trong lồng tre, vịt con ngoài sân |
| `KGM-005` | `K1` | Vị trí hàng dọc: Phía trước – Phía sau | 前後関係 | `C2.ORI.05` | `C2.ORI.06` | `GT-001`, `GT-003` | Giao thông (`vehicle`) | Đoàn tàu gỗ nối đuôi, xe đi trước – xe đi sau |
| `KGM-006` | `K1` | Định hướng từ cơ thể bé: Trái – Phải, Lên – Xuống | 自分の左右・上下移動 | `C2.ORI.01` | `C2.ORI.02`, `C2.DIR.01`, `C2.DIR.02`, `C2.MAZ.01` | `GT-001`, `GT-003`, `GT-020` | Bản thân (`body`) | Tay cầm thìa, tay giữ bát; bước lên/xuống bậc thềm |
| `KGM-007` | `K2` | Tương ứng 1–1 bằng đồ vật thật | 一対一対応 | `C1.OTO.01` | — | `GT-000`, `GT-003`, `GT-005` | Gia đình (`family`) | Bày mỗi người một chiếc bát gốm và một đôi đũa |
| `KGM-008` | `K2` | Ghép sự vật với chiếc bóng tương ứng | 影絵と実物の対応 | `C1.OTO.03` | — | `GT-001`, `GT-005` | Động vật (`animal`) | Soi bóng thú rối trên vách giấy dó |
| `KGM-009` | `K2` | Nhiều hơn – Ít hơn – Bằng nhau qua ghép đôi | 多少比較・同数発見 | `C1.CMP.04` | `C1.CMP.05`, `C1.CMP.03`, `C1.MEAS.04` | `GT-000`, `GT-001`, `GT-003`, `GT-012` | Thực vật & Quả quê (`food`) | Hai mẹt táo và chuối xếp sóng đôi không cần đếm chữ số |
| `KGM-010` | `K2` | Đếm sự vật từ 1 đến 3 | 3までの計数 | `C1.CNT.01` | `C1.NREC.01` | `GT-000`, `GT-001`, `GT-003`, `GT-005` | Động vật (`farm`) | Đếm 1, 2, 3 chú gà vàng trên sân rơm |
| `KGM-011` | `K2` | Đếm đủ không bỏ sót trong phạm vi 5 | 5までの計数 | `C1.CNT.03` | `C1.NREC.02` | `GT-003`, `GT-008` | Thực vật (`nature`) | Chạm từng bông hoa hướng dương xếp vào giỏ mây |
| `KGM-012` | `K2` | Gắn lượng vật với thẻ chấm và chữ số 1–5 | 数と量の対応（1〜5） | `C1.NREC.05` | — | `GT-005`, `GT-008`, `GT-012` | Trường mầm non (`school`) | Thẻ chấm gỗ mộc ghép đúng rổ đồ chơi |
| `KGM-013` | `K3` | Nhận diện Hình tròn quanh bé | 基本図形：まる | `C2.GEO.01` | — | `GT-000`, `GT-001`, `GT-005`, `GT-020` | Thực phẩm (`food`) | Chiếc mẹt tre tròn, bánh dày tròn, mặt trống |
| `KGM-014` | `K3` | Nhận diện Hình vuông & phân biệt với Hình tròn | 基本図形：しかく | `C2.GEO.02` | — | `GT-000`, `GT-001`, `GT-003`, `GT-008` | Gia đình (`home`) | Khăn mùi soa vuông, viên gạch bông, bánh chưng xanh |
| `KGM-015` | `K3` | Nhận diện Hình tam giác | 基本図形：さんかく | `C2.GEO.03` | — | `GT-001`, `GT-003`, `GT-005` | Thực vật (`nature`) | Mái lều tre, cánh buồm nhỏ, chiếc nón lá nhìn ngang |
| `KGM-016` | `K3` | Xếp ghép hình cơ bản theo mẫu | 基本図形の構成 | `C2.CON.01` | — | `GT-001`, `GT-008` | Trường mầm non (`school`) | Ghép mái tam giác lên thân nhà vuông trên khay gỗ |
| `KGM-017` | `K4` | Gọi tên sự vật: Con vật, Trái cây, Cơ thể bé | 事物の名称（動物・果物・体） | `C5.VOC.01` | `C5.VOC.02`, `C5.VOC.09` | `GT-000`, `GT-001`, `GT-003`, `GT-005` | Động vật (`animal`) | Nghe tên gọi thân thuộc và chạm đúng tranh vật thật |
| `KGM-018` | `K4` | Từ vựng Gia đình, Xe cộ & Lời chào lễ phép | 生活語彙とあいさつ | `C5.VOC.04` | `C5.VOC.05`, `C5.PRA.01` | `GT-001`, `GT-003` | Gia đình (`family`) | Ông bà, cha mẹ, lời khoanh tay chào và cảm ơn |
| `KGM-019` | `K4` | Lắng nghe và làm theo lời cô dặn 1–2 nhịp | 話を聞いて行動する | `C5.LIS.01` | `C5.LIS.02` | `GT-000`, `GT-001`, `GT-003`, `GT-020` | Trường mầm non (`school`) | Nghe trọn câu dặn ngắn rồi cất đúng món đồ chơi |
| `KGM-020` | `K4` | Hỏi – đáp tư duy "Ai?" và "Cái gì?" | 疑問詞の基礎（だれ・なに） | `C5.QUE.01` | `C5.QUE.02` | `GT-001`, `GT-007` | Nghề nghiệp (`job`) | Bác nông dân cầm cuốc, cô giáo cầm phấn |
| `KGM-021` | `K4` | Miêu tả đồ vật & Làm quen lật sách tranh | 物の特徴説明・絵本の扱い | `C5.DES.01` | `C5.BOK.01`, `C5.BOK.02` | `GT-000`, `GT-001`, `GT-005` | Gia đình (`home`) | Góc đọc sách chiếu cói, nhận biết bìa sách và lật từng trang |
| `KGM-022` | `K5` | Tinh mắt tìm cặp giống hệt nhau | 同図形発見 | `C3.ANA.01` | `C4.VIS.02` | `GT-000`, `GT-001`, `GT-005`, `GT-008` | Gia đình (`home`) | Ghép đôi dép mây, đôi tất, đôi chén hoa giống hệt nhau |
| `KGM-023` | `K5` | Phân loại theo 1 dấu hiệu: Màu, Hình, Cỡ | 単一基準の分類 | `C3.CLS.01` | `C3.CLS.02`, `C3.CLS.03` | `GT-000`, `GT-003`, `GT-005`, `GT-020` | Thực phẩm (`food`) | Chia quả chín đỏ và quả xanh vào hai rổ tre |
| `KGM-024` | `K5` | Nhận biết vật thuộc nhóm và khác nhóm | 仲間集め・仲間はずれ基礎 | `C3.SET.01` | — | `GT-003`, `GT-008` | Động vật (`farm`) | Tìm các bạn vật nuôi cùng chuồng trại |
| `KGM-025` | `K5` | Xếp thứ tự lớn dần & Chuỗi lặp AB đầu tiên | 系列化・ABパターン導入 | `C3.SRT.01` | `C3.SRT.04`, `C1.PAT.01`, `C1.PAT.09`, `C1.PAT.10`, `C3.SEQ.01` | `GT-000`, `GT-001`, `GT-003`, `GT-008` | Thực vật (`nature`) | Xâu hạt gỗ đỏ–vàng xen kẽ và xếp tháp cốc từ nhỏ tới lớn |
| `KGM-026` | `K5` | Khám phá 5 giác quan: Màu, Hình, Âm thanh, Bề mặt | 感覚観察・音の聞き分け | `C4.DET.01` | `C4.DET.02`, `C4.DET.03`, `C4.AUD.01`, `C4.AUD.02`, `C4.TAC.01`, `C4.TAC.02`, `C4.OBS.01` | `GT-000`, `GT-001`, `GT-003`, `GT-012` | Bản thân (`body`) | Nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn |
| `KGM-027` | `K5` | Thường thức quanh bé: Cây cối, Con vật & Thời tiết | 自然と生活の常識基礎 | `C4.LIV.01` | `C4.LIV.02`, `C4.MAT.01`, `C4.SOC.01`, `C4.SOC.02` | `GT-001`, `GT-003`, `GT-005` | Hiện tượng tự nhiên (`weather`) | Nhận biết lá – hoa – quả, trời nắng đội mũ, trời mưa che ô |
| `KGM-028` | `K5` | Tập trung chú ý, Lật thẻ nhớ cặp & Nhớ làm 2 bước | 集中・位置記憶・2段階指示 | `C6.ATT.01` | `C6.ATT.02`, `C4.MEM.01`, `C6.WM.01`, `C6.INH.02`, `C6.PER.01`, `C6.INI.01` | `GT-000`, `GT-001`, `GT-005`, `GT-012`, `GT-020` | Trường mầm non (`school`) | Trò chơi úp bát tìm hạt sen, kiên trì hoàn thành lượt chơi |

---

### 4.2 Khối Chồi (`4-5` tuổi — 34 học phần: `KGM-029`…`KGM-062`)

| Mã HP | Miền | Tên học phần Koguma-VN (Tiếng Việt) | Khái niệm Kuno gốc | Primary Skill | Kỹ năng bổ trợ cùng cụm | Engine chuẩn (`4-5`) | Chủ đề GDMN & Mã `theme` | Đồ dùng thật / Gợi ý bản địa Việt |
|---|:---:|---|---|---|---|---|---|---|
| `KGM-029` | `K1` | Cảm nhận và so sánh Nặng hơn – Nhẹ hơn | 重さの直接比較 | `C1.MEAS.03` | `C1.CMP.10`, `C1.CMP.11`, `C4.TAC.04` | `GT-000`, `GT-002`, `GT-004`, `GT-008` | Thực phẩm (`food`) | Đặt quả bưởi và quả chanh lên hai lòng bàn tay ước lượng |
| `KGM-030` | `K1` | Khoảng cách Xa – Gần & Xếp chuỗi kích thước | 遠近比較・量の系列化 | `C1.MEAS.15` | `C1.CMP.12`, `C1.CMP.13`, `C3.SRT.02` | `GT-001`, `GT-004`, `GT-008` | Thực vật (`nature`) | Xếp 5 ống tre từ cao nhất xuống thấp nhất |
| `KGM-031` | `K1` | Trình tự thời gian: Trước – Sau, Sáng – Trưa – Chiều – Tối | 時間の前後・一日の生活順序 | `C1.MEAS.12` | `C1.MEAS.10`, `C1.MEAS.11`, `C4.MAT.03` | `GT-001`, `GT-002`, `GT-005`, `GT-008` | Gia đình (`family`) | Chuỗi sinh hoạt ngày mới từ gà gáy sáng đến trăng lên tối |
| `KGM-032` | `K1` | Vị trí tương đối: Ở giữa và Ở góc | 真ん中・角・相対位置 | `C2.ORI.09` | `C2.ORI.10`, `C4.DET.04` | `GT-001`, `GT-002` | Gia đình (`home`) | Tìm bạn ngồi giữa hàng ghế gỗ, đặt bình hoa ở góc bàn |
| `KGM-033` | `K1` | Rẽ trái – Rẽ phải & Đi theo dấu mũi tên | 左右の方向転換・矢印移動 | `C2.DIR.03` | `C2.DIR.04`, `C2.DIR.05` | `GT-009`, `GT-013`, `GT-022` | Giao thông (`vehicle`) | Lái xe đạp nhỏ theo biển mũi tên quanh sân trường |
| `KGM-034` | `K1` | Làm quen Hàng ngang và Cột dọc trên lưới ô | 方眼上の位置（行と列） | `C2.GRD.01` | — | `GT-000`, `GT-003`, `GT-004`, `GT-008` | Trường mầm non (`school`) | Kệ tủ gỗ chia ngăn hàng ngang – cột dọc cất đồ dùng |
| `KGM-035` | `K1` | Quan sát vật thể nhìn từ phía trước | 正面からの観察・視点導入 | `C2.PER.01` | — | `GT-001`, `GT-005` | Quê hương (`homeland`) | Nhìn mặt trước ngôi đình làng và cổng trường |
| `KGM-036` | `K2` | Đếm 1–1 khi vật xê dịch & Nhận lượng tức thì 1–5 | 移動計数・5までの瞬時把握 | `C1.CNT.02` | `C1.CNT.11`, `C1.CNT.09` | `GT-000`, `GT-001`, `GT-012`, `GT-028` | Động vật (`farm`) | Nhìn nhanh chấm hạt đậu trên đĩa gỗ biết ngay mấy hạt |
| `KGM-037` | `K2` | Nhận biết chữ số và gắn lượng từ 0 đến 10 | 0の概念と10までの数・量対応 | `C1.NREC.03` | `C1.OTO.04`, `C1.NREC.06`, `C1.NREC.07` | `GT-000`, `GT-002`, `GT-008`, `GT-020`, `GT-037` | Lễ hội & Tết (`festival`) | Giỏ bánh rỗng là số 0; đếm đủ 10 chiếc đèn lồng |
| `KGM-038` | `K2` | Dãy số thứ tự, Số liền trước – Liền sau & Đếm ngược | 数の系列・前後・逆唱 | `C1.NREC.09` | `C1.NREC.10`, `C1.NREC.11`, `C1.CNT.04` | `GT-000`, `GT-003`, `GT-008`, `GT-013` | Giao thông (`vehicle`) | Đếm toa tàu đánh số 1–10 và tìm toa đứng liền trước/liền sau |
| `KGM-039` | `K2` | Số thứ tự trong hàng: Thứ nhất đến Thứ năm | 順序数（1番目〜5番目） | `C1.ORD.01` | `C1.ORD.02`, `C1.ORD.03` | `GT-001`, `GT-002`, `GT-008` | Động vật (`animal`) | Phân biệt "5 bạn thú" (tổng lượng) với "bạn đứng thứ năm" (vị trí) |
| `KGM-040` | `K2` | Tương ứng một – nhiều (1 xe có 2 bánh, 1 bàn có 4 chân) | 一対多対応 | `C1.OTO.02` | `C1.OTO.05`, `C1.OTO.06` | `GT-001`, `GT-008`, `GT-010` | Nghề nghiệp (`job`) | Mỗi bác thợ mộc cần 2 thanh gỗ, 3 bác cần mấy thanh |
| `KGM-041` | `K2` | Cấu tạo số: Tách số 2, 3, 4 và Tách số 5 bằng vật thật | 5の構成と分解 | `C1.NCOMP.04` | `C1.NCOMP.01`, `C1.NCOMP.02`, `C1.NCOMP.03` | `GT-005`, `GT-007`, `GT-008` | Thực phẩm (`food`) | Chia 5 quả quýt vào 2 đĩa mây theo nhiều cách khác nhau |
| `KGM-042` | `K2` | Chuyện thêm vào – bớt đi bằng đồ vật phạm vi 5 | 増える・減るお話（具体物加減） | `C1.ADD.01` | `C1.NCOMP.10`, `C1.SUB.01`, `C1.ADD.04`, `C1.SUB.03` | `GT-002`, `GT-007`, `GT-008`, `GT-029` | Đại dương (`ocean`) | 3 chú cá bơi tới thêm 2 chú cá; 5 con cua bò đi 2 con |
| `KGM-043` | `K2` | Đếm phân loại và ghi lại bằng vạch dấu / cột vật | 数えて印をつける・絵グラフ基礎 | `C1.DAT.01` | `C1.DAT.02` | `GT-001`, `GT-003`, `GT-007` | Hiện tượng tự nhiên (`weather`) | Gắn thẻ mây/nắng lên bảng gỗ theo dõi thời tiết tuần |
| `KGM-044` | `K3` | Nhận diện Hình chữ nhật và Hình bầu dục | 長方形と楕円の弁別 | `C2.GEO.04` | `C2.GEO.05` | `GT-000`, `GT-002`, `GT-004`, `GT-008` | Gia đình (`home`) | Chiếu cói hình chữ nhật, quả trứng gà hình bầu dục |
| `KGM-045` | `K3` | Khối cầu & Thử nghiệm vật lăn được – vật đứng yên | 球と転がる立体の実験 | `C2.SOL.01` | `C2.SOL.02` | `GT-001`, `GT-002`, `GT-004` | Trường mầm non (`school`) | Thả quả bóng mây và khối gỗ vuông trên tấm ván nghiêng |
| `KGM-046` | `K3` | Phân biệt Khối trụ, Khối lập phương & Khối hộp chữ nhật | 基本立体（円柱・立方体・直方体） | `C2.SOL.04` | `C2.SOL.03`, `C2.SOL.05` | `GT-001`, `GT-002`, `GT-004` | Nghệ thuật (`art`) | Ống tre tròn (khối trụ), hộp trà vuông (lập phương), gạch mộc |
| `KGM-047` | `K3` | Lắp ghép khối gỗ xây dựng theo mẫu đơn giản | 積木構成の基礎 | `C2.CON.03` | — | `GT-000`, `GT-008`, `GT-023` | Quê hương (`homeland`) | Xếp cổng làng và cầu gỗ bằng bộ khối mộc tự nhiên |
| `KGM-048` | `K3` | Nhận biết hình cân đối đối xứng qua trục dọc | 線対称図形の導入 | `C2.MIR.01` | — | `GT-019`, `GT-021` | Lễ hội & Tết (`festival`) | Cánh bướm mùa xuân, chiếc quạt giấy, đèn lồng cân đối hai bên |
| `KGM-049` | `K4` | Mở rộng vốn từ: Nghề nghiệp, Đồ bếp, Thời tiết, Sinh vật biển | 生活・自然カテゴリー語彙 | `C5.VOC.03` | `C5.VOC.06`, `C5.VOC.07`, `C5.VOC.08`, `C5.VOC.10`, `C5.VOC.11`, `C5.VOC.12`, `C5.VOC.13`, `C5.VOC.17`, `C5.VOC.18` | `GT-000`, `GT-001`, `GT-002`, `GT-003` | Nghề nghiệp (`job`) | Gọi tên dụng cụ nghề mộc, nghề gốm, nghề y và trang phục bốn mùa |
| `KGM-050` | `K4` | Hỏi – đáp "Ở đâu?", Miêu tả tranh & So sánh bằng lời trọn câu | 疑問詞「どこ」・情景表現・比較表現 | `C5.QUE.03` | `C5.DES.02`, `C5.DES.03`, `C5.GRM.01` | `GT-002`, `GT-004`, `GT-028` | Thực vật (`nature`) | Tập nói câu đủ chủ–vị miêu tả khu vườn quê |
| `KGM-051` | `K4` | Nghe truyện kể và nhớ lại chi tiết câu chuyện | お話の記憶（基礎） | `C5.STO.01` | `C5.BOK.03`, `C5.PRA.02` | `GT-000`, `GT-003`, `GT-009`, `GT-012` | Gia đình (`family`) | Nghe chuyện cổ tích ngắn rồi chọn đúng nhân vật và sự việc |
| `KGM-052` | `K4` | Vỗ tay tách tiếng & Đếm số tiếng trong từ tiếng Việt | 音節分解・ことばの数打ち | `C5.PHO.02` | `C5.PHO.01`, `C5.PHO.03` | `GT-000`, `GT-002`, `GT-018`, `GT-023` | Trường mầm non (`school`) | Gõ phách tre theo từng tiếng: "con-gà" (2 tiếng), "hoa-hướng-dương" (3 tiếng) |
| `KGM-053` | `K4` | Đọc đồng dao bắt vần & Nghe phân biệt thanh điệu | わらべうたの韻・声調弁別基礎 | `C5.RHY.03` | `C5.RHY.01`, `C5.TON.01` | `GT-002`, `GT-005`, `GT-009` | Lễ hội & Tết (`festival`) | Đồng dao "Nu na nu nống", "Dung dăng dung dẻ" nghe tiếng bắt vần |
| `KGM-054` | `K4` | Ý thức chữ viết quanh ta, Nguyên âm Việt & Nét bút đầu tiên | 文字への関心・母音導入・基本運筆 | `C5.LET.02` | `C5.LET.01`, `C5.ALP.01`, `C5.ALP.02`, `C5.PRN.01`, `C5.PRN.02`, `C5.PRN.03`, `C5.WRT.01`, `C5.WRT.02` | `GT-000`, `GT-001`, `GT-002`, `GT-037` | Nghệ thuật (`art`) | Nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang |
| `KGM-055` | `K5` | Phân loại theo công dụng, số lượng & Tìm vật lạ trong nhóm | 用途別分類・仲間はずれ発見 | `C3.CLS.04` | `C3.CLS.05`, `C3.SET.02` | `GT-002`, `GT-004` | Gia đình (`home`) | Nhóm đồ để ăn vs đồ để mặc; tìm món không cùng công dụng |
| `KGM-056` | `K5` | Tìm và nối tiếp quy luật ABB, AAB, ABC & Sắc độ đậm nhạt | パターン発見（ABB・AAB・ABC） | `C3.RULE.02` | `C3.RULE.01`, `C1.PAT.02`, `C1.PAT.03`, `C1.PAT.04`, `C3.SRT.03` | `GT-000`, `GT-004`, `GT-008`, `GT-021` | Nghệ thuật (`art`) | Chuỗi nan quạt màu và dải màu chàm từ đậm tới nhạt |
| `KGM-057` | `K5` | Chuỗi hành động hợp lý, Đoán vật thiếu & Nhân quả đời sống | 行為の順序・欠所補完・因果基礎 | `C3.INF.01` | `C3.SEQ.02`, `C3.SEQ.03`, `C4.CAU.01`, `C4.CAU.02` | `GT-000`, `GT-004`, `GT-009`, `GT-010` | Hiện tượng tự nhiên (`weather`) | Mây đen kéo đến → trời mưa → mặc áo mưa; tìm bộ phận còn thiếu |
| `KGM-058` | `K5` | Quan sát tinh: Tìm điểm khác giữa hai tranh & Tìm vật ẩn | 異同弁別・隠れた形の発見 | `C4.VIS.01` | `C4.VIS.03`, `C4.SEN.01`, `C4.SEN.02`, `C4.SEN.03`, `C4.OBS.02`, `C4.AUD.03`, `C4.AUD.04`, `C4.AUD.05` | `GT-004`, `GT-012`, `GT-022`, `GT-025`, `GT-037` | Đại dương (`ocean`) | So hai bức tranh rạn san hô tìm chi tiết đổi khác |
| `KGM-059` | `K5` | Thí nghiệm dự đoán Chìm – Nổi, Bốn mùa & Nơi sống sinh vật | 理科的観察（浮沈・四季・生息地） | `C4.EXP.02` | `C4.EXP.01`, `C4.LIV.03`, `C4.LIV.04`, `C4.LIV.05`, `C4.MAT.02`, `C4.MAT.04`, `C4.TAC.03` | `GT-000`, `GT-002`, `GT-019`, `GT-028` | Thực vật (`nature`) | Thả chiếc lá tre và viên sỏi xuống chậu nước đoán vật nổi – vật chìm |
| `KGM-060` | `K5` | Thường thức xã hội Việt Nam: Tết, Trung thu, Nghề nghiệp & Giao thông | 社会的常識（年中行事・職業・安全） | `C4.HOM.02` | `C4.HOM.01`, `C4.HOM.03`, `C4.SOC.03`, `C4.SOC.04`, `C4.SAF.01`, `C4.SAF.02`, `C4.SAF.03`, `C4.ECO.01`, `C4.ECO.02`, `C4.TOO.01`, `C4.TOO.02` | `GT-002`, `GT-004`, `GT-005`, `GT-009` | Quê hương (`homeland`) | Mâm ngũ quả Tết, rước đèn ông sao Trung thu, đèn tín hiệu giao thông |
| `KGM-061` | `K5` | Ghi nhớ vị trí bị che khuất, Nhớ chuỗi hình & Làm theo 2 bước | 位置記憶・系列記憶・2手順実行 | `C6.WM.03` | `C6.WM.04`, `C4.MEM.02`, `C4.MEM.03`, `C3.ALG.01` | `GT-000`, `GT-005`, `GT-012`, `GT-018` | Động vật (`animal`) | Nhìn nhanh chú sóc giấu hạt dẻ vào hốc cây nào rồi mở lại |
| `KGM-062` | `K5` | Kìm phản xạ theo hiệu lệnh, Bỏ qua nhiễu & Thử lại bình tĩnh | 抑制制御（合図で行動）・選択的注意 | `C6.INH.03` | `C6.ATT.03`, `C6.INH.01`, `C6.PER.02` | `GT-000`, `GT-003`, `GT-020`, `GT-026`, `GT-037` | Trường mầm non (`school`) | Trò chơi "Trời nắng – Trời mưa", nghe đúng tiếng trống mới chạm |

---

### 4.3 Khối Lá (`5-6` tuổi — 38 học phần: `KGM-063`…`KGM-100`)

| Mã HP | Miền | Tên học phần Koguma-VN (Tiếng Việt) | Khái niệm Kuno gốc | Primary Skill | Kỹ năng bổ trợ cùng cụm | Engine chuẩn (`5-6`) | Chủ đề GDMN & Mã `theme` | Đồ dùng thật / Gợi ý bản địa Việt |
|---|:---:|---|---|---|---|---|---|---|
| `KGM-063` | `K1` | Cân đĩa thăng bằng & Suy luận bắc cầu nặng – nhẹ | シーソーと重さの三者比較 | `C1.MEAS.07` | `C3.SRT.05` | `GT-014`, `GT-006`, `GT-008` | Thực phẩm (`food`) | Đòn gánh tre cân thăng bằng bưởi – cam – chanh (suy luận A > B > C) |
| `KGM-064` | `K1` | Bảo toàn lượng nước & So sánh dung tích bình chứa | 水の量・液量保存と推理 | `C1.MEAS.05` | `C1.MEAS.06` | `GT-000`, `GT-032`, `GT-006` | Đại dương (`ocean`) | Rót cùng một gáo nước vào bình rộng thấp và ống cao hẹp |
| `KGM-065` | `K1` | Đo độ dài bằng đơn vị lặp phi chuẩn & Làm quen thước đo | 個別単位による長さ測定 | `C1.MEAS.08` | `C1.MEAS.09`, `C4.TOO.04` | `GT-030`, `GT-007` | Trường mầm non (`school`) | Đo chiều dài mặt bàn bằng que tính tre và gang tay |
| `KGM-066` | `K1` | Xem đồng hồ giờ đúng & So sánh chuyển động Nhanh – Chậm | 時計の読み・速さ比較 | `C1.MEAS.13` | `C1.CMP.14`, `C1.CMP.15` | `GT-016`, `GT-006`, `GT-005` | Giao thông (`vehicle`) | Xoay kim đồng hồ gỗ đúng giờ vào lớp, giờ ăn trưa, giờ tan trường |
| `KGM-067` | `K1` | Toạ độ Hàng – Cột, Sơ đồ lớp học & Ghi lại đường đi trên lưới | 方眼上の位置と移動記録・地図 | `C2.GRD.03` | `C2.GRD.02`, `C2.GRD.04`, `C2.GRD.05`, `C2.DIR.06`, `C2.DIR.07` | `GT-006`, `GT-013`, `GT-024`, `GT-033`, `GT-035` | Quê hương (`homeland`) | Tìm ô trên bàn cờ tre và đọc bản đồ đường làng nhiều bước |
| `KGM-068` | `K1` | Mê cung có điều kiện nhiều nhánh & Tìm đường ngắn nhất | 条件迷路・最短経路 | `C2.MAZ.02` | `C2.MAZ.03` | `GT-013`, `GT-006`, `GT-005` | Động vật (`animal`) | Dẫn trâu về chuồng qua đường rơm ngắn nhất không vướng vũng bùn |
| `KGM-069` | `K1` | Phối cảnh bốn phía: Nhìn từ sau, từ trên xuống & từ bên cạnh | 四方からの観察 | `C2.PER.03` | `C2.PER.02`, `C2.PER.04`, `C4.MAT.06` | `GT-017`, `GT-023`, `GT-005`, `GT-006` | Vũ trụ (`space`) | Đặt ấm trà gốm giữa bàn, đoán hình dáng khi bạn Gấu nhìn từ đối diện/trên cao |
| `KGM-070` | `K2` | Đếm đến 20, Đếm cách 2 theo đôi & Số ở giữa trên trục số | 20までの数・2とび計数・数直線 | `C1.CNT.07` | `C1.CNT.05`, `C1.CNT.06`, `C1.CNT.08`, `C1.CNT.10`, `C1.NREC.04`, `C1.NREC.08`, `C1.NREC.12` | `GT-000`, `GT-006`, `GT-024`, `GT-028` | Thực vật (`nature`) | Đếm từng đôi đũa tre (2, 4, 6, 8, 10) và kiểm tra lại kết quả đếm |
| `KGM-071` | `K2` | Số thứ tự đến thứ mười & Đếm thứ tự ngược từ cuối hàng lên | 順序数の応用（前後逆転・途中から） | `C1.ORD.04` | `C1.ORD.05`, `C1.ORD.06` | `GT-006`, `GT-007`, `GT-013` | Giao thông (`vehicle`) | Đoàn thuyền rồng 10 chiếc: tìm thuyền thứ 3 từ mũi và thứ 3 từ lái |
| `KGM-072` | `K2` | Cấu tạo số 6, 7, 8, 9 bằng vật cụ thể | 6〜9の数の構成 | `C1.NCOMP.07` | `C1.NCOMP.05`, `C1.NCOMP.06`, `C1.NCOMP.08` | `GT-007`, `GT-008`, `GT-031` | Động vật (`farm`) | Chia 7–8 hạt sen vào hai ngăn khay tre, tìm phần ẩn dưới lá sen |
| `KGM-073` | `K2` | Cấu tạo số 10 & Tư duy tách – gộp toàn phần – bộ phận | 10の構成・数の合成と分解 | `C1.NCOMP.09` | `C1.NCOMP.11`, `C1.NCOMP.12` | `GT-007`, `GT-008`, `GT-014`, `GT-031` | Lễ hội & Tết (`festival`) | Khung 10 hạt gỗ mộc: nắm vững mọi cặp bù 10 chuẩn bị nền tảng tiểu học |
| `KGM-074` | `K2` | Bài toán câu chuyện Thêm vào trên vật thật và trục số phạm vi 10 | 増えるお話（10までの合併・増加） | `C1.ADD.05` | `C1.ADD.02`, `C1.ADD.03`, `C1.ADD.06` | `GT-000`, `GT-006`, `GT-008`, `GT-010`, `GT-031` | Thực phẩm (`food`) | Gộp hai rổ bánh cốm qua câu chuyện hình ảnh (không ép tính dọc trên giấy) |
| `KGM-075` | `K2` | Bài toán câu chuyện Bớt đi & Tìm phần còn lại phạm vi 10 | 減るお話・残りと差の思考 | `C1.SUB.05` | `C1.SUB.02`, `C1.SUB.04` | `GT-000`, `GT-007`, `GT-008`, `GT-029`, `GT-031` | Gia đình (`family`) | Đĩa nhãn có 9 quả, biếu ông bà 4 quả, suy ra phần còn trên đĩa |
| `KGM-076` | `K2` | Chia đều đồ vật cho các bạn & Chia nhóm bằng nhau | 一対多と等分・分配の思考 | `C1.PROB.03` | `C1.PROB.04`, `C1.PROB.05`, `C1.OTO.07` | `GT-003`, `GT-004`, `GT-008`, `GT-010`, `GT-031` | Gia đình (`home`) | Chia đều 8 chiếc bánh đậu xanh vào 4 đĩa nhỏ không cần phép chia ký hiệu |
| `KGM-077` | `K2` | Đổi ngang giá, Gộp tiền xu lì xì & Đọc biểu đồ hai cột | 交換・お金の合成・グラフ読み取り | `C1.MEAS.14` | `C1.PROB.01`, `C1.PROB.02`, `C1.PROB.06`, `C1.DAT.03`, `C1.DAT.04`, `C1.DAT.05` | `GT-010`, `GT-014`, `GT-031`, `GT-004` | Lễ hội & Tết (`festival`) | Đổi 1 quả dưa lấy 2 quả cam; gộp xu gỗ đi chợ quê; đọc biểu đồ cột quả |
| `KGM-078` | `K3` | Hình ngũ giác, Hình lục giác & Khảo sát số cạnh đa giác | 多角形と辺・角の数 | `C2.GEO.08` | `C2.GEO.06`, `C2.GEO.07` | `GT-001`, `GT-008`, `GT-030`, `GT-037` | Nghệ thuật (`art`) | Xếp que tre thành hình 5 cạnh, 6 cạnh như mắt đan rổ rá |
| `KGM-079` | `K3` | Tách – ghép đa giác & Trò chơi xếp hình Tangram 7 mảnh | 図形分割と構成（タングラム） | `C2.CON.02` | — | `GT-023`, `GT-006`, `GT-008` | Quê hương (`homeland`) | Ghép mảnh gỗ Tangram thành con cò, thuyền buồm, mái chùa |
| `KGM-080` | `K3` | Đếm khối lập phương chồng khuất & Sao chép cấu trúc khối 3D | 積木の数・見取り図構成 | `C2.CON.04` | `C2.CON.05` | `GT-017`, `GT-023`, `GT-000` | Trường mầm non (`school`) | Đếm cả khối gỗ nằm khuất tầng dưới làm trụ đỡ cho khối tầng trên |
| `KGM-081` | `K3` | Khối nón & Nhận biết Mặt – Cạnh – Đỉnh của hình khối 3D | 立体の構成要素（面・辺・頂点） | `C2.SOL.07` | `C2.SOL.06` | `GT-001`, `GT-003`, `GT-017` | Nghề nghiệp (`job`) | Chiếc nón lá (khối nón), đếm mặt phẳng của hộp gỗ thợ mộc |
| `KGM-082` | `K3` | Tưởng tượng xoay hình phẳng 90° và 180° | 回転図形（90度・180度） | `C2.ROT.01` | `C2.ROT.02` | `GT-000`, `GT-011`, `GT-017`, `GT-019` | Vũ trụ (`space`) | Xoay chong chóng tre nửa vòng và một góc tư để đoán vị trí cánh màu |
| `KGM-083` | `K3` | Xoay nhiều bước & Nhận ra hình bất biến sau phép xoay | 重ね図形・回転後の同図形発見 | `C2.ROT.04` | `C2.ROT.03` | `GT-019`, `GT-011` | Nghệ thuật (`art`) | Tìm viên gạch hoa văn giống mẫu dù đã xoay sang hướng khác |
| `KGM-084` | `K3` | Ảnh gương phản chiếu & Hoàn thiện nửa hoa văn đối xứng | 鏡映像・線対称の完成 | `C2.MIR.02` | `C2.MIR.03` | `GT-021`, `GT-019`, `GT-033` | Thực vật (`nature`) | Bóng sen soi mặt hồ và dệt nốt nửa lá cờ hội đối xứng |
| `KGM-085` | `K4` | Nghe thực hiện chuỗi 3 chỉ dẫn & Từ vựng vị trí, nhạc cụ, cảm xúc | 複数条件の聞き取り・抽象語彙 | `C5.LIS.03` | `C5.VOC.14`, `C5.VOC.15`, `C5.VOC.16`, `C5.VOC.19`, `C5.VOC.20` | `GT-018`, `GT-034`, `GT-000` | Lễ hội & Tết (`festival`) | Nghe nhớ trọn câu 3 việc liên tiếp không cần nhắc lại giữa chừng |
| `KGM-086` | `K4` | Xếp tranh kể chuyện 4 bước, Đoán kết thúc & Nhân quả truyện kể | お話の順序・結末予測と因果 | `C5.STO.02` | `C5.STO.03`, `C5.STO.04`, `C3.SEQ.04` | `GT-006`, `GT-004`, `GT-012`, `GT-033` | Quê hương (`homeland`) | Sắp xếp 4 tranh truyện dân gian theo trình tự hợp lý và đoán đoạn kết |
| `KGM-087` | `K4` | Hỏi – đáp "Khi nào?", "Tại sao?" & Trình bày ý kiến có lý do | 疑問詞「いつ・なぜ」・理由の言語化 | `C5.QUE.05` | `C5.QUE.04`, `C5.DES.04`, `C5.PRA.03`, `C5.PRA.04`, `C5.PRA.05`, `C5.PRA.06`, `C5.BOK.04`, `C5.BOK.05` | `GT-001`, `GT-003`, `GT-006`, `GT-034` | Gia đình (`family`) | Tập giải thích mạch lạc lý do chọn phương án (đối thoại Kuno) |
| `KGM-088` | `K4` | Trật tự từ, Từ nối logic ("và, rồi, nhưng, vì") & Dấu câu cơ bản | 文の組み立て・接続詞の論理 | `C5.GRM.03` | `C5.GRM.02`, `C5.GRM.04`, `C5.GRM.05`, `C5.PRN.04`, `C5.PRN.05` | `GT-006`, `GT-008`, `GT-004` | Trường mầm non (`school`) | Nối mệnh đề nhân quả bằng từ nối tiếng Việt tự nhiên, phân biệt câu hỏi/kể |
| `KGM-089` | `K4` | Nhận thức âm đầu & Tách – ghép âm đầu với vần tiếng Việt | 音韻認識（ベトナム語頭音と韻の分解） | `C5.PHO.05` | `C5.PHO.04`, `C5.PHO.06`, `C5.PHO.07`, `C5.ONS.01`, `C5.ONS.02`, `C5.ONS.03`, `C5.ONS.04` | `GT-000`, `GT-001`, `GT-003`, `GT-034` | Thực vật (`nature`) | Bản địa hoá chuẩn ngữ âm tiếng Việt: tách tiếng thành âm đầu + vần bằng tai |
| `KGM-090` | `K4` | Tìm tiếng cùng vần, Hệ thống vần & Sáu thanh điệu tiếng Việt | 韻の仲間集め・6声調と声調記号 | `C5.RHY.02` | `C5.RHY.04`, `C5.RHY.05`, `C5.RHY.06`, `C5.RHY.07`, `C5.RHY.08`, `C5.RIM.01`, `C5.RIM.02`, `C5.RIM.03`, `C5.RIM.04`, `C5.RIM.05`, `C5.RIM.06`, `C5.TON.02`, `C5.TON.03`, `C5.TON.04`, `C5.TON.05`, `C5.TON.06`, `C5.TMK.01`, `C5.TMK.02`, `C5.TMK.03` | `GT-000`, `GT-001`, `GT-003`, `GT-034`, `GT-036` | Quê hương (`homeland`) | Nghe đồng dao tìm cặp vần và nhận diện 6 thanh điệu làm đổi nghĩa từ |
| `KGM-091` | `K4` | Nhận đủ 29 chữ cái Việt, Nối từ với hình & Tô nét tiền tiểu học | 29文字の認識・語と絵の対応・運筆完成 | `C5.WRT.05` | `C5.LET.03`, `C5.LET.04`, `C5.LET.05`, `C5.ALP.03`, `C5.ALP.04`, `C5.ALP.05`, `C5.ALP.06`, `C5.ALP.07`, `C5.ALP.08`, `C5.DGR.01`, `C5.DGR.02`, `C5.WRT.03`, `C5.WRT.04`, `C5.WRT.06`, `C5.WRT.07`, `C5.WRD.01`, `C5.WRD.02`, `C5.WRD.03`, `C5.WRD.04`, `C5.WRD.05`, `C5.WRD.06` | `GT-024`, `GT-000`, `GT-001`, `GT-005`, `GT-008` | Trường mầm non (`school`) | Luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng Việt |
| `KGM-092` | `K5` | Phân loại đa tiêu chí & Tập hợp hai vòng giao nhau (Vừa… vừa…) | 二次元分類・集合の交わり（ベン図） | `C3.SET.05` | `C3.CLS.06`, `C3.SET.03`, `C3.SET.04`, `C3.SET.06` | `GT-004`, `GT-015`, `GT-027`, `GT-033` | Đại dương (`ocean`) | Hai vòng mây đan nhau: tìm sinh vật "vừa màu đỏ vừa có càng" |
| `KGM-093` | `K5` | Quy luật AABB, Chuỗi tăng – giảm & Phát hiện mắt xích đặt sai | 発展パターン・系列の誤り発見 | `C3.RULE.03` | `C1.PAT.05`, `C1.PAT.06`, `C1.PAT.07`, `C1.PAT.08` | `GT-033`, `GT-035`, `GT-036`, `GT-006` | Nghệ thuật (`art`) | Dệt chiếu hoa văn lưới, phát hiện một nan đan sai quy luật và tự tạo mẫu mới |
| `KGM-094` | `K5` | Tư duy loại suy quan hệ tương ứng `A : B = C : ?` | 関係推理（類推） | `C3.ANA.02` | `C3.ANA.03` | `GT-010`, `GT-003`, `GT-005` | Nghề nghiệp (`job`) | Bác sĩ gắn với ống nghe thì Hoạ sĩ gắn với cọ vẽ |
| `KGM-095` | `K5` | Ma trận quy luật hai chiều `2×2`, `3×3` & Lưới hình không lặp | マトリクス構成・魔法の箱（ミニ数独） | `C3.MTX.01` | `C3.MTX.02`, `C3.MTX.03` | `GT-011`, `GT-015`, `GT-008` | Vũ trụ (`space`) | Phối hợp đồng thời quy luật hàng ngang + cột dọc và xếp khay gỗ không trùng |
| `KGM-096` | `K5` | Suy luận loại trừ theo manh mối & Điều kiện "Nếu… thì…" | 条件推理・消去法 | `C3.DED.01` | `C3.DED.02`, `C3.DED.03`, `C3.INF.02`, `C3.INF.03` | `GT-009`, `GT-022`, `GT-006` | Động vật (`animal`) | Từ 2–3 gợi ý loại trừ dần để tìm đúng ngôi nhà của từng bạn thú |
| `KGM-097` | `K5` | Quan sát hình che khuất, Chuỗi nhân quả 2 bước & Thí nghiệm đối chứng | 重ね図形・理科的実験と因果推論 | `C4.CAU.03` | `C4.VIS.04`, `C4.CAU.04`, `C4.CAU.05`, `C4.EXP.03`, `C4.EXP.04`, `C4.EXP.05`, `C4.EXP.06`, `C4.OBS.03`, `C4.OBS.04`, `C4.OBS.05`, `C4.TAC.05`, `C4.SEN.04`, `C4.AUD.06` | `GT-022`, `GT-010`, `GT-014`, `GT-030`, `GT-032` | Hiện tượng tự nhiên (`weather`) | Thử nghiệm muối tan trong nước, nam châm hút sắt, đoán vật trong túi vải bí mật |
| `KGM-098` | `K5` | Vòng đời sinh vật, Ba thể của nước, Danh thắng Việt & Bảo vệ môi trường | 自然の循環・郷土文化・環境と安全 | `C4.LIV.07` | `C4.LIV.06`, `C4.MAT.05`, `C4.MAT.07`, `C4.HOM.04`, `C4.HOM.05`, `C4.HOM.06`, `C4.SOC.05`, `C4.SOC.06`, `C4.SOC.07`, `C4.SAF.04`, `C4.SAF.05`, `C4.SAF.06`, `C4.ECO.03`, `C4.ECO.04`, `C4.ECO.05`, `C4.TOO.03`, `C4.TOO.05` | `GT-006`, `GT-004`, `GT-015`, `GT-026` | Quê hương (`homeland`) | Vòng đời tằm–kén–bướm, danh thắng Việt Nam, ẩm thực ba miền, phân loại rác |
| `KGM-099` | `K5` | Ghi nhớ chuỗi âm thanh/nhịp gõ & Lập chuỗi lệnh đường đi tới đích | 音とリズムの記憶・手順計画（アルゴリズム） | `C3.ALG.02` | `C3.ALG.03`, `C3.ALG.04`, `C3.ALG.05`, `C3.ALG.06`, `C4.MEM.04`, `C6.WM.02` | `GT-034`, `GT-035`, `GT-006`, `GT-020` | Giao thông (`vehicle`) | Gõ nhịp trống bỏi/mộc cầm và xếp thẻ mũi tên dẫn thuyền về bến |
| `KGM-100` | `K5` | Đổi luật linh hoạt giữa vòng, Phản xạ dừng đúng lúc & Tự kiểm lỗi | ルール転換・Go/No-Go・計画と自己点検 | `C6.FLX.01` | `C6.FLX.02`, `C6.FLX.03`, `C6.INH.04`, `C6.PLN.01`, `C6.PLN.02`, `C6.PLN.03`, `C6.MON.01`, `C6.MON.02`, `C6.MON.03`, `C6.PER.03`, `C6.PER.04`, `C6.PER.05`, `C6.INI.02`, `C6.INI.03`, `C6.INI.04`, `C6.INI.05` | `GT-027`, `GT-026`, `GT-013`, `GT-037` | Trường mầm non (`school`) | Đang phân loại theo màu chuyển sang theo hình; tự rà lại khay gỗ trước khi hoàn tất |

---

## 5. Phân Bổ 100 Học Phần Theo 10 Chủ Đề Năm Học Giáo Dục Mầm Non Việt Nam

Bảng dưới đây kết nối lịch năm học 36 tuần của trường mầm non Việt Nam ([`moet-alignment.md`](moet-alignment.md) §4 & [`learning-roadmap-model.md`](../specs/05-content/learning-roadmap-model.md) §7.1a) với 100 học phần Koguma-VN ở cả 3 lứa tuổi:

| STT | Chủ đề năm học Bộ GD&ĐT | Tuần năm học | Mã `theme` hợp lệ (`CONTENT_THEMES`) | Học phần Mầm (`3-4`) | Học phần Chồi (`4-5`) | Học phần Lá (`5-6`) |
|---:|---|---|---|:-:|:-:|:-:|
| 1 | **Trường mầm non** | Tuần 1–3 | `school` | `KGM-001`, `012`, `016`, `019`, `028` | `KGM-034`, `045`, `052`, `062` | `KGM-065`, `080`, `088`, `091`, `100` |
| 2 | **Bản thân & Ngũ quan** | Tuần 4–7 | `body` | `KGM-006`, `026` | *(tích hợp ôn qua `KGM-029`, `052`)* | *(tích hợp ôn qua `KGM-085`, `100`)* |
| 3 | **Gia đình & Ngôi nhà thân yêu** | Tuần 8–10 | `family`, `home` | `KGM-003`, `007`, `014`, `018`, `021`, `022` | `KGM-031`, `032`, `044`, `051`, `055` | `KGM-075`, `076`, `087` |
| 4 | **Nghề nghiệp quanh bé** | Tuần 11–14 | `job`, `art` (`4-5`+) | `KGM-020` | `KGM-040`, `046`, `049`, `054`, `056` | `KGM-078`, `081`, `083`, `093`, `094` |
| 5 | **Thế giới thực vật & Quả quê** | Tuần 15–18 | `nature`, `food` | `KGM-002`, `009`, `011`, `013`, `015`, `023`, `025` | `KGM-029`, `030`, `041`, `050`, `059` | `KGM-063`, `070`, `074`, `084`, `089` |
| 6 | **Thế giới động vật & Đại dương** | Tuần 19–22 | `animal`, `farm`, `ocean` (`4-5`+) | `KGM-004`, `008`, `010`, `017`, `024` | `KGM-036`, `039`, `042`, `058`, `061` | `KGM-064`, `068`, `072`, `092`, `096` |
| 7 | **Phương tiện & An toàn giao thông** | Tuần 23–25 | `vehicle` | `KGM-005` | `KGM-033`, `038` | `KGM-066`, `071`, `099` |
| 8 | **Nước, Hiện tượng tự nhiên & Vũ trụ** | Tuần 26–29 | `weather`, `space` (`5-6`) | `KGM-027` | `KGM-043`, `057` | `KGM-069`, `082`, `095`, `097` |
| 9 | **Quê hương – Đất nước – Bác Hồ** | Tuần 30–33 | `homeland` (`4-5`+, Mầm mượn `nature`/`home`) | *(lồng bối cảnh làng quê vào `KGM-014`, `015`)* | `KGM-035`, `047`, `060` | `KGM-067`, `079`, `086`, `090`, `098` |
| 10 | **Tết, Lễ hội truyền thống & Hành trang lên lớp** | Tuần 34–36 | `festival` (`4-5`+, Mầm mượn `family`/`food`) | *(ôn tập tổng hợp cả năm Mầm)* | `KGM-037`, `048`, `053` | `KGM-073`, `077`, `085` |

---

## 6. Khoảng Trống & Ứng Viên Mở Rộng Sau MVP (Gap & Future Skill Candidates)

Theo nguyên tắc bất biến `BR-CSA-08` và `BR-MCM-04`, giai đoạn hiện hành **tuyệt đối không tự tạo `skills.code` hay `strands` mới**. Bảy dạng bài đặc thù trong bộ *Hitoride Tokkun 100* (ひとりでとっくん100) của Koguma-kai đang được ánh xạ trung thực vào kỹ năng tương đương gần nhất kết hợp hoạt động `offscreen`, và được ghi nhận tại đây làm ứng viên mở rộng cho chương trình taxonomy hậu MVP (do chuyên gia sư phạm chủ trì duyệt):

| # | Dạng bài Kuno đặc thù (Nhật Bản) | Cách đáp ứng trung thực trong MVP hiện tại | Ứng viên kỹ năng / khuôn mở rộng sau MVP (Chờ người quyết) |
|---:|---|---|---|
| 1 | **Gấp giấy & Bấm lỗ mở ra (*Origami Tenkai* — 折り紙展開)** | Ánh xạ vào `C2.MIR.02` & `C2.MIR.03` trên `GT-021` (`mirror-complete`) + tiết `offscreen` gấp đôi giấy màu cắt hoa văn thật cùng cha mẹ. | Ứng viên skill mới thuộc `C2.MIR` (dự đoán hình sau 1–2 lần gấp giấy) + biến thể `content_pack` lưới gấp đối xứng hai trục. |
| 2 | **Trái – Phải theo góc nhìn người đối diện (*Aite kara mita Sayu* — 相手から見た左右)** | Ánh xạ vào cụm `C2.PER.02` + `C2.ORI.01`/`C2.ORI.02` trên `GT-005` & `GT-019`. | Ứng viên skill mới thuộc `C2.ORI` hoặc `C2.PER` (định hướng trái–phải đảo ngược từ điểm nhìn nhân vật đối diện ở tuổi 5–6). |
| 3 | **Mặt cắt ngang của khối & rau củ (*Rittai no Danmen* — 立体の断面)** | Ánh xạ vào `C2.SOL.07` + `C2.PER.04` kết hợp tiết `offscreen` bổ ngang quả khế (ngôi sao), ngó sen (lỗ tròn), quả cam cùng người lớn. | Ứng viên skill mới thuộc `C2.PER` (nhận diện lát cắt phẳng của vật thể 3D). |
| 4 | **Lăn khối xúc xắc đổi mặt (*Saikoro Korogashi* — サイコロころがし)** | Ánh xạ vào `C2.SOL.04` + `C2.ROT.03` trên `GT-017` (`block-stack`) và `GT-019` (`rotate-transform`). | Ứng viên skill mới thuộc `C2.ROT` (theo dõi mặt trên của khối lập phương sau 1–2 nhịp lật cạnh). |
| 5 | **Chuyển động tương đối trên đường đua (*Ugoki no Suiri* — 動きの推理)** | Ánh xạ vào `C1.CMP.14`, `C1.CMP.15` và `C1.ADD.03` (bước nhảy trên trục số). | Ứng viên skill mới thuộc `C1.PROB` (so sánh quãng đường + vận tốc trực quan bằng ô bước nhảy). |
| 6 | **Bóng đổ theo hướng mặt trời & Phản chiếu mặt nước (*Kage to Suimen* — 影の向き・水面の映り)** | Ánh xạ vào `C4.MAT.06` (Ánh sáng và bóng) + `C2.MIR.02` (Ảnh gương trục ngang). | Ứng viên mở rộng `skill_datasets` cho `C4.MAT.06` với trục nguồn sáng trái/giữa/phải. |
| 7 | **Kể chuyện sáng tạo & Giải thích miệng mở (*Ohanashi-zukuri* — 自由発話説明)** | Chạy qua nhịp `echo` tự nói không thu âm (`BR-CIR-23`) + gợi ý đối thoại cho cha mẹ ở tiết `offscreen` (tuân thủ `BR-CDC-01..06`: cấm thu/lưu giọng nói trẻ). | Khi Phase 2 mở lại, người lớn có thể chấm thủ công qua `mastery_state.assessed_by` theo [`SPEC.md`](../SPEC.md) mà vẫn không thu âm giọng trẻ. |
