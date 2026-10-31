---
spec: MONTESSORI-CHANG-01
title: Chặng 1: Ga Những Con Số Thức Giấc — Nhận Biết Số & CPA 1–10
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-01
workbook_ref: WB01
owns:
  - Phân tích sư phạm và giải mã toàn diện 31 trang PDF Chặng 1 (Chặng 1 - Những con Số - Nhận biết số.pdf)
  - Ánh xạ 5 nhóm dạng bài (WB01-D1..D5) vào các game engine hiện tại GT-000, GT-001, GT-005, GT-008, GT-024, GT-028, GT-037
  - Thiết kế SkillDataset (items, relations, phrasing) tích hợp cốt truyện Gấu Logic & Thỏ Quan Sát
  - Thiết kế SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101)
  - Kế hoạch phổ biến dữ liệu vào seeder packages/content/src/skills/c1/
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 1: Ga Những Con Số Thức Giấc — Nhận Biết Số & CPA 1–10

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này sở hữu đặc tả kỹ thuật và kiến trúc nội dung sư phạm nhằm chuyển thể trọn vẹn dữ liệu từ tài liệu PDF **"Chặng 1: Ga Những Con Số Thức Giấc"** (`docs/montessori/extracted/chang-01/analysis.json`, nguồn: *Chặng 1 - Những con Số - Nhận biết số.pdf*, 31 trang, bộ sách *Gấu Logic & Thỏ Quan Sát - Chuyến Tàu Toán Học*, Nhà xuất bản Dân Trí / Montessori VN) vào nền tảng **TiniMath v2**.

### Mục tiêu chiến lược:
1. **Phổ biến dữ liệu vào các Game Engine hiện hữu (`GT-000`..`GT-037`)**:
   - **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**.
   - Phân giải 31 trang PDF thành 5 nhóm dạng bài (`WB01-D1` đến `WB01-D5`), ánh xạ chính xác vào 7 game engine đã có:
     - `GT-000` (`concept-intro`): Giới thiệu các con số 1–10 và bảng đối chiếu CPA (Trang 1, 2, 3, 31).
     - `GT-001` (`tap-select`): Chạm đánh thức chữ số; chọn nhóm hình khớp số (Trang 2, 4, 6, 21, 28, 30).
     - `GT-005` (`pair-match`): Nối cặp Vật thể ↔ Bàn tay ngón và Bàn tay ngón ↔ Chữ số (Trang 4, 5, 6, 7).
     - `GT-008` (`drag-to-slot`): Kéo dán thẻ lượng vào ô số 1–5 và 6–10 (Trang 8, 9).
     - `GT-024` (`trace-path`): Đồ nét chữ số 1–10 theo điểm neo và hướng mũi tên (Trang 10, 11, 12, 14, 15, 16, 17, 18, 19, 25).
     - `GT-028` (`tap-count`): Chạm tô dải thanh 10 khối vuông Ten-Frame và tô ngón tay (Trang 13, 20, 22, 23, 24, 26, 27, 29, 30).
     - `GT-037` (`symbol-hunt`): Săn tìm chữ số mục tiêu trong ma trận 15 ô (3x5) và ma trận 21 ô (3x7).
2. **Hiện thực hóa Lý thuyết Sư phạm Montessori & Mô hình CPA (Concrete - Pictorial - Abstract)**:
   - **Bài học 3 bước (Three-Period Lesson)**:
     - *Bước 1 (Naming/Gọi tên)*: Nhận diện mặt chữ số qua hoạt cảnh "Đánh thức con số đang ngủ" (`D1`).
     - *Bước 2 (Recognition/Nhận biết - Đối chiếu)*: Đếm vật thật $\leftrightarrow$ Đếm ngón tay (Finger Gnosia) $\leftrightarrow$ Kéo dán ô số $\leftrightarrow$ Dải Ten-Frame (`D2`, `D3`, `D5`).
     - *Bước 3 (Recall & Application/Khắc sâu - Vận dụng)*: Luyện đồ nét chữ số cát Sandpaper Letters (`GT-024`) kết hợp phân biệt thị giác ma trận Symbol Hunt (`GT-037`) và thử thách 3 nhiệm vụ (`D4`, `D5`).
3. **Làm giàu hệ thống `SkillDataset` & `SkillLevelPlan[]`**:
   - Cập nhật các seeder kỹ năng cốt lõi tại `packages/content/src/skills/c1/` (`C1.NREC.01`, `C1.NREC.02`, `C1.NREC.03`, `C1.NREC.05`, `C1.NREC.08`, `C1.CNT.01`, `C1.OTO.01`, `C1.OTO.04`).
   - Cấp mã level chuẩn `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), gắn nhãn `montessori_ref: "WB01-D<n>"`.
   - Phân bổ `access_tier` khớp độ khó `difficulty`: 1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`.
   - Tuân thủ nghiêm ngặt `BR-MCM-06` (không chứa từ khóa thương mại IQ/Raven/trí tuệ).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò hệ thống | Vai trò sư phạm & Đặc điểm nhận diện trong Chặng 1 |
|---|---|---|
| **Bé (Kid Player)** | Người chơi chính (3–6 tuổi) | Nhập vai hành khách nhí trên Chuyến Tàu Toán Học, tương tác chạm đánh thức 10 con số, nối dây, kéo dán thẻ lượng, đồ nét số và săn số trong ma trận. |
| **Gấu Logic (`gau_logic`)** | Nhân vật dẫn dắt lý thuyết | Đại diện tư duy logic & cấu trúc cơ số 10. Luôn giải thích bản chất số lượng trước mỗi thử thách: *"Mười con số vẫn đang ngủ!", "Mỗi con số có một số lượng riêng", "Một bàn tay có 5 ngón, đếm thêm bàn tay thứ hai", "Số [N] chỉ [N] đồ vật"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Bạn đồng hành hành động | Đại diện quan sát giác quan & vận động tinh. Cổ vũ hành động, nhắc nhở chi tiết: *"Bé hãy gọi tên để đánh thức các bạn nhé!", "Nối với bàn tay phù hợp nhé!", "Cắt rồi dán vào ô đúng nhé!", "Bé hãy tô và tìm số [N] nhé!", "Hoàn thành để mở cổng nhà ga!"*. |
| **Phụ huynh / Giáo viên** | Hỗ trợ ngoài màn hình | Theo dõi phản hồi xúc giác (ngón tay, nhịp đếm), phối hợp giáo cụ Montessori thực tế (thẻ số nhám, hạt đếm, thanh que). |
| **Content Seeder Engine** | Hệ thống tự động | Biên dịch `SkillLevelPlan[]` thành `ContentSeed` hoàn chỉnh, kiểm tra qua cổng `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-01/analysis.json (31 trang)
   │
   ├──> docs/montessori/dataset/activity-types-table.md
   │      └── Đồng bộ thông tin WB01-D1..D5
   ├──> docs/specs/05-content/montessori-corpus-mapping.md
   │      └── Cập nhật mục 7.1, 7.6 về giải pháp GT-024 (Trace) và GT-037 (Hunt)
   │
   ├──> packages/content/src/skills/c1/nrec/
   │      ├── C1.NREC.01.ts (WB01-D1 -> GT-000: GL-C1-NREC-INTRO-0101; GT-001: GL-C1-NREC-CARD-0101)
   │      ├── C1.NREC.02.ts (WB01-D1 -> GT-001: GL-C1-NREC-CARD-0102)
   │      ├── C1.NREC.03.ts (WB01-D4/D5 -> GT-037: GL-C1-NREC-HUNT-0103, GL-C1-NREC-HUNT-0104)
   │      ├── C1.NREC.05.ts (WB01-D3 -> GT-008: GL-C1-NREC-SLOT-0105, GL-C1-NREC-SLOT-0106)
   │      └── C1.NREC.08.ts (WB01-D4 -> GT-024: GL-C1-NREC-TRAC-0101, GL-C1-NREC-TRAC-0102)
   │
   ├──> packages/content/src/skills/c1/cnt/
   │      └── C1.CNT.01.ts  (WB01-D3 -> GT-003: GL-C1-CNT-CONT-0105; WB01-D5 -> GT-028: GL-C1-CNT-TCNT-0101, GL-C1-CNT-TCNT-0102)
   │
   └──> packages/content/src/skills/c1/oto/
          ├── C1.OTO.01.ts  (WB01-D2 -> GT-005: GL-C1-OTO-PAIR-0101, GL-C1-OTO-PAIR-0102)
          └── C1.OTO.04.ts  (WB01-D2 -> GT-001: GL-C1-OTO-CARD-0104)
```

---

## 4. Phân Tích 5 Nhóm Dạng Bài (D1..D5) & Ánh Xạ Game Engine

### D1: `WB01-D1` — Đánh thức số & Bảng CPA 1–10 (Trang 2, 3)
- **Tên bài học**: *Đánh thức số & Bảng đối chiếu CPA 1–10*.
- **Vị trí PDF**: Trang 2 (Đánh thức 10 con số), Trang 3 (Bảng CPA 10 số).
- **Mục tiêu sư phạm**:
  - Khởi động chặng học bằng hoạt cảnh nhân cách hóa: 10 chữ số đang nhắm mắt ngủ trong cửa sổ toa xe lửa (Trang 2).
  - Đối chiếu đồng thời 3 hệ thống biểu diễn số học (Trang 3): Chấm tròn (Concrete) $\leftrightarrow$ Bàn tay cử chỉ (Semi-concrete) $\leftrightarrow$ Ký hiệu chữ số (Abstract).
- **Cơ chế tương tác số hóa**:
  - `GT-000` (`concept-intro`): Giới thiệu 10 chữ số nhân cách hóa, nhấp vào từng số để nghe Gấu Logic gọi tên chuẩn tiếng Việt kèm biểu diễn bàn tay ngón.
  - `GT-001` (`tap-select`): Chạm ô số để đánh thức các bạn số (trạng thái ngủ `sleeping` với mi mắt khép $\rightarrow$ thức giấc `awake` mắt mở tròn, nảy pop vui vẻ, chân đế sao vàng bừng sáng).
  - `GT-028` (`tap-count`): Chạm tuần tự từng chấm tròn trên bảng CPA để phát âm nhịp đếm tăng dần $1 \dots 10$.
- **Kỹ năng liên kết**: `C1.NREC.01` (số 0–3), `C1.NREC.02` (số 0–5), `C1.NREC.03` (số 0–10), `C1.NREC.07` (đọc số), `C1.CNT.11` (subitizing 1–5).

---

### D2: `WB01-D2` — Đếm nối nhóm hình – bàn tay – chữ số (Trang 4, 5, 6, 7)
- **Tên bài học**: *Đếm nối nhóm hình, bàn tay và chữ số*.
- **Vị trí PDF**:
  - Trang 4: Vật thể 1–5 (3 mèo, 1 voi, 5 vịt, 2 táo, 4 cá) $\leftrightarrow$ Bàn tay 1–5 ngón.
  - Trang 5: Vật thể 6–10 (8 sao, 6 bóng bay, 10 dâu tây, 7 lá, 9 cá) $\leftrightarrow$ Hai bàn tay 6–10 ngón (neo 5: $5+3, 5+1, 5+5, 5+2, 5+4$).
  - Trang 6: Bàn tay 1–5 ngón (4, 5, 1, 3, 2 ngón) $\leftrightarrow$ Chữ số 1–5 (2, 4, 5, 1, 3).
  - Trang 7: Cặp bàn tay 6–10 ngón ($5+3, 5+1, 5+5, 5+2, 5+4$) $\leftrightarrow$ Chữ số 6–10 (7, 9, 6, 10, 8).
- **Mục tiêu sư phạm**:
  - Thiết lập phản xạ tương ứng 1-1 không nhầm lẫn giữa lượng thực tế và biểu diễn cơ thể (ngón tay).
  - Khắc sâu cấu trúc neo 5 (Finger Gnosia): Các số 6–10 được tạo thành từ 1 bàn tay đầy (5 ngón) cộng thêm các ngón ở bàn tay thứ hai.
  - Chuyển dịch mượt mà từ biểu diễn bán cụ thể (ngón tay) sang ký hiệu số trừu tượng (chữ số).
- **Cơ chế tương tác số hóa**:
  - `GT-005` (`pair-match`): Nối dây giữa 2 cột (hoặc chạm nguồn - chạm đích). Dây nối neon phát sáng khi đúng, tan biến êm dịu khi sai kèm item trôi về chỗ cũ.
  - `GT-001` (`tap-select`): Chế độ fallback tap-tap dành cho trẻ mầm 3–4 tuổi khi khả năng kéo vuốt chưa thuần thục.
- **Kỹ năng liên kết**: `C1.CNT.01`, `C1.CNT.03`, `C1.OTO.01`, `C1.OTO.04`, `C1.NREC.02`, `C1.NREC.03`.

---

### D3: `WB01-D3` — Đếm, cắt và dán nhóm hình vào ô số (Trang 8, 9)
- **Tên bài học**: *Đếm và kéo dán nhóm hình vào ô số tương ứng*.
- **Vị trí PDF**:
  - Trang 8: Phạm vi 1–5 (Ô đích: 1, 2, 3, 4, 5. Thẻ nguồn: 4 tên lửa, 1 mặt trời, 3 hành tinh, 5 ngôi sao, 2 đám mây).
  - Trang 9: Phạm vi 6–10 (Ô đích: 6, 7, 8, 9, 10. Thẻ nguồn: 8 cá, 6 bóng bay, 10 quả cam, 7 chiếc lá, 9 bông hoa).
- **Mục tiêu sư phạm**:
  - Mô phỏng thao tác vận động tinh (cắt - dán thẻ hình) trong tài liệu in bằng tương tác kéo thả định vị (Drag-to-slot).
  - Rèn luyện kỹ năng đếm cẩn thận, quét tuần tự các đối tượng trong nhóm lớn (6–10) và gắn lượng vào ô chữ số đích.
- **Cơ chế tương tác số hóa**:
  - `GT-008` (`drag-to-slot`): Kéo thẻ hình từ khay nguồn phía dưới lên ô số tương ứng ở phía trên. Nam châm snap tự hút khi thả gần đích (hit band multiplier 1.5x). Hỗ trợ chạm thẻ nguồn $\rightarrow$ chạm ô đích cho trẻ 3–4 tuổi.
  - `GT-003` (`drag-to-container`): Hộp thả thẻ số lượng tương thích.
- **Kỹ năng liên kết**: `C1.CNT.01`, `C1.CNT.03`, `C1.NREC.05`, `C1.OTO.04`.

---

### D4: `WB01-D4` — Tô số theo nét chấm & Săn tìm số trong lưới (Trang 10–12, 14–19, 25)
- **Tên bài học**: *Đồ nét chữ số chuẩn & Săn tìm chữ số trong lưới*.
- **Vị trí PDF**: 10 trang chuyên sâu cho từng số từ 1 đến 10:
  - Trang 10: Số 1 (1 Mặt Trời, 10 lần tô nét số 1, ma trận 3x5 săn số 1).
  - Trang 11: Số 2 (2 Đám Mây, 10 lần tô nét số 2, ma trận 3x5 săn số 2).
  - Trang 12: Số 3 (3 Chú Vịt, 10 lần tô nét số 3, ma trận 3x5 săn số 3).
  - Trang 14: Số 4 (4 Quả Bóng Bay, 10 lần tô nét số 4, ma trận 3x5 săn số 4).
  - Trang 15: Số 5 (5 Quả Táo, 10 lần tô nét số 5, ma trận 3x5 săn số 5).
  - Trang 16: Số 6 (6 Chú Cá, 10 lần tô nét số 6, ma trận 3x5 săn số 6).
  - Trang 17: Số 7 (7 Bông Hoa, 10 lần tô nét số 7, ma trận 3x5 săn số 7).
  - Trang 18: Số 8 (8 Ngôi Sao, 10 lần tô nét số 8, ma trận 3x5 săn số 8).
  - Trang 19: Số 9 (9 Quả Cam, 10 lần tô nét số 9, ma trận 3x5 săn số 9).
  - Trang 25: Số 10 (10 Viên Ngọc, 10 lần tô nét số 10, ma trận 3x5 săn số 10).
- **Mục tiêu sư phạm**:
  - **Khắc sâu hình thái chữ số (Orthographic representation)**: Tái hiện giáo cụ thẻ chữ số nhám Montessori (Sandpaper Numerals). Trẻ dùng ngón tay cảm nhận quy tắc chuyển động nét (Stroke sequence: bắt đầu từ điểm neo, đi theo chiều mũi tên).
  - **Phân biệt thị giác (Visual Discrimination)**: Phát hiện chữ số mục tiêu giữa các chữ số gây nhiễu lân cận trong ma trận 15 ô (3 hàng x 5 cột).
- **Cơ chế tương tác số hóa**:
  - `GT-024` (`trace-path`): Cơ chế vẽ theo nét. Điểm neo xuất phát nhấp nháy, đường dẫn nét có mũi tên định hướng, đường vẽ tự bắt dính (snap) theo nét đứt, phát sáng neon rực rỡ khi vẽ đúng.
  - `GT-037` (`symbol-hunt`): Chế độ tìm hết ký hiệu trong ma trận 15 ô. Chạm vào chữ số đúng: số bừng sáng, vòng tròn bút màu vẽ bao quanh, âm chuông ngân vang. Chạm số sai: số rung nhẹ 200ms không trừ điểm.
- **Kỹ năng liên kết**: `C1.NREC.01`, `C1.NREC.02`, `C1.NREC.03`, `C1.NREC.06`, `C1.NREC.08`.

---

### D5: `WB01-D5` — Thử thách số 1–10: Ba nhiệm vụ tích hợp (Trang 13, 20–24, 26–30)
- **Tên bài học**: *Thử thách tổng hợp ba nhiệm vụ củng cố từng số 1–10*.
- **Vị trí PDF**: 10 trang thử thách tương ứng 10 con số:
  - Trang 13: Thử thách số 1 (Tô 1 khối vuông; Điền số 1 vào đầu sâu số; Tô 1 ngón tay; Săn số 1 trong ma trận 3x7 = 21 ô).
  - Trang 20: Thử thách số 2 (Tô 2 khối vuông; Tô 2 cánh bướm; Tô 2 ngón tay; Săn số 2 trong ma trận 3x7).
  - Trang 21: Thử thách số 3 (Tô 3 khối vuông; Điền số 3 vào toa tàu khuyết; Tô 3 ngón tay; Săn số 3 trong ma trận 3x7).
  - Trang 22: Thử thách số 4 (Tô 4 khối vuông; Tô 4 cánh chuồn chuồn; Tô 4 ngón tay; Săn số 4 trong ma trận 3x7).
  - Trang 23: Thử thách số 5 (Tô 5 khối vuông; Tô 5 đốt sâu; Tô 5 ngón tay của 1 bàn tay; Săn số 5 trong ma trận 3x7).
  - Trang 24: Thử thách số 6 (Tô 6 khối vuông; Khoanh ô có 6 cánh diều; Tô 6 ngón tay gồm 5+1; Săn số 6 trong ma trận 3x7).
  - Trang 26: Thử thách số 7 (Tô 7 khối vuông; Điền số 7 vào toa tàu khuyết; Tô 7 ngón tay gồm 5+2; Săn số 7 trong ma trận 3x7).
  - Trang 27: Thử thách số 8 (Tô 8 khối vuông; Tô 8 chân & 8 mắt nhện; Tô 8 ngón tay gồm 5+3; Săn số 8 trong ma trận 3x7).
  - Trang 28: Thử thách số 9 (Tô 9 khối vuông; Khoanh ô có 9 chú châu chấu; Tô 9 ngón tay gồm 5+4; Săn số 9 trong ma trận 3x7).
  - Trang 30: Thử thách số 10 (Tô trọn vẹn thanh 10 khối vuông; Khoanh ô có 10 viên ngọc; Tô 10 ngón tay của 2 bàn tay; Săn số 10 trong ma trận 3x7; Vinh danh mở cổng ga).
- **Mục tiêu sư phạm**:
  - Đánh giá năng lực tổng hợp (Mastery Assessment) thông qua 3 chiều kích:
    1. Cấu trúc lượng cơ bản qua dải thanh 10 ô vuông tuyến tính (Linear Ten-Frame).
    2. Ứng dụng ngữ cảnh đa dạng (điền khuyết chuỗi số, tô đối tượng tự nhiên, chọn nhóm số lượng).
    3. Phân biệt ký hiệu mật độ cao (ma trận 21 ô với 13–14 số gây nhiễu).
- **Cơ chế tương tác số hóa**:
  - `GT-028` (`tap-count`): Chạm tô tuần tự từng khối vuông trên thanh Ten-Frame và tô ngón tay.
  - `GT-001` (`tap-select`): Khoanh chọn ô đáp án đúng trong các bài chọn nhóm hình (Số 6 diều, Số 9 châu chấu, Số 10 ngọc).
  - `GT-006` (`sequence-order`): Điền số khuyết trên đoàn tàu và chú sâu (Số 1, 3, 7).
  - `GT-037` (`symbol-hunt`): Săn tìm 7–8 chữ số mục tiêu trong ma trận 21 ô (3x7).
- **Kỹ năng liên kết**: `C1.NREC.03`, `C1.NREC.09`, `C1.CNT.01`, `C1.CNT.03`, `C1.CNT.08`, `C1.OTO.01`.

---

## 5. Thiết Kế SkillDataset & Phrasing (Lấy cảm hứng từ PDF)

### 5.1. Bộ ngữ liệu Vật phẩm (`items`)
Tích hợp toàn bộ vật phẩm tiêu biểu xuất hiện trong 31 trang PDF Chặng 1 vào các dataset:
1. **Chủ đề Vũ trụ & Bầu trời** (Trang 8, 10, 11, 18):
   - `rocket` (🚀 Tên lửa vũ trụ), `sun` (☀️ Mặt trời rực rỡ), `planet` (🪐 Hành tinh xanh), `star` (⭐ Ngôi sao vàng), `cloud` (☁️ Đám mây trắng).
2. **Chủ đề Động vật & Côn trùng** (Trang 4, 12, 16, 20, 22, 23, 27, 28):
   - `cat` (🐱 Chú mèo), `elephant` (🐘 Chú voi), `duck` (🦆 Vịt con), `fish` (🐟 Cá sắc màu), `butterfly` (🦋 Bướm xinh), `dragonfly` (🪁 Chuồn chuồn), `caterpillar` (🐛 Chú sâu ngộ nghĩnh), `spider` (🕷️ Chú nhện 8 chân), `grasshopper` (🦗 Châu chấu xanh).
3. **Chủ đề Hoa quả & Thiên nhiên** (Trang 4, 5, 9, 15, 17, 19, 24, 25, 30):
   - `apple` (🍎 Quả táo đỏ), `orange` (🍊 Quả cam mọng), `strawberry` (🍓 Dâu tây ngọt ngào), `leaf` (🍃 Chiếc lá xanh), `flower` (🌸 Bông hoa nở), `balloon` (🎈 Bóng bay đỏ), `kite` (🪁 Cánh diều no gió), `gem` (💎 Viên ngọc lấp lánh).
4. **Biểu diễn Bàn tay & Cấu trúc Khối**:
   - `hand_1` .. `hand_5`: Bàn tay 1 đến 5 ngón giơ chuẩn.
   - `hand_6` .. `hand_10`: Cặp hai bàn tay giơ $5+1$ đến $5+5$ ngón.
   - `ten_frame_block`: Khối vuông màu xanh ngọc trên thanh 10 ô.

### 5.2. Mẫu câu thoại (`phrasing`) của Gấu Logic & Thỏ Quan Sát

| Ngữ cảnh hoạt động | Lời thoại Gấu Logic (`gau_logic`) | Lời thoại Thỏ Quan Sát (`tho_quan_sat`) |
|---|---|---|
| **D1: Đánh thức số** | *"Mười con số vẫn đang ngủ! Mỗi con số đều mang một lượng riêng."* | *"Bé hãy gọi tên và chạm vào để đánh thức các bạn số nhé!"* |
| **D2: Đếm nối bàn tay** | *"Đếm từng nhóm hình. Một bàn tay có 5 ngón, hãy đếm thêm ở bàn tay thứ hai."* | *"Nối nhóm hình với bàn tay có số ngón phù hợp nhé!"* |
| **D3: Cắt dán ô số** | *"Đếm chậm và đều từng hình để không bị bỏ sót nhé."* | *"Kéo dán thẻ hình vào ô số đúng trên bảng nào!"* |
| **D4: Đồ nét & Săn số** | *"Số [N] chỉ [N] đồ vật. Bắt đầu từ chấm tròn và đi theo mũi tên."* | *"Bé hãy tô số [N] thật đẹp rồi săn tìm các bạn số [N] trong lưới nhé!"* |
| **D5: Thử thách 3 nhiệm vụ** | *"Thử thách số [N] có ba nhiệm vụ đang chờ chúng mình!"* | *"Tô khối vuông, tìm hình đúng và săn hết chữ số [N] để mở cổng ga nhé!"* |
| **Hoàn thành chặng (Trang 31)** | *"Bé nhận biết số từ 1 đến 10 thật xuất sắc!"* | *"Nhà ga đã rực sáng ánh đèn! Chúng mình cùng lên tàu đến Chặng 2 thôi!"* |

---

## 6. Thiết Kế Danh Sách Game Level (`SkillLevelPlan[]`)

Các level được thiết kế tuân thủ nghiêm ngặt quy tắc mã `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), gắn nhãn `montessori_ref: "WB01-D<m>"`, `access_tier` khớp `difficulty`, không chứa từ khóa thương mại đo trí tuệ:

| Mã Game Level | Template | Dạng bài | Skill Code | Band | Diff | Tier | Tên hiển thị (Tiếng Việt) | Rounds |
|---|:---:|:---:|---|:---:|:---:|:---:|---|:---:|
| `GL-C1-NREC-INTRO-0101` | `GT-000` | `WB01-D1` | `C1.NREC.01` | 3-4 | 1 | `free` | Làm quen các bạn số thức giấc 1–5 | 1 |
| `GL-C1-NREC-CARD-0101` | `GT-001` | `WB01-D1` | `C1.NREC.01` | 3-4 | 1 | `free` | Đánh thức các bạn số 1–3 | 3 |
| `GL-C1-NREC-CARD-0102` | `GT-001` | `WB01-D1` | `C1.NREC.02` | 3-4 | 2 | `login` | Đánh thức các bạn số 1–5 | 3 |
| `GL-C1-OTO-PAIR-0101` | `GT-005` | `WB01-D2` | `C1.OTO.01` | 3-4 | 1 | `free` | Nối nhóm đồ vật với bàn tay ngón 1–5 | 3 |
| `GL-C1-OTO-PAIR-0102` | `GT-005` | `WB01-D2` | `C1.OTO.01` | 4-5 | 2 | `login` | Nối nhóm đồ vật với bàn tay ngón 6–10 | 3 |
| `GL-C1-OTO-CARD-0104` | `GT-001` | `WB01-D2` | `C1.OTO.04` | 3-4 | 2 | `login` | Chọn bàn tay ngón khớp số lượng | 3 |
| `GL-C1-NREC-SLOT-0105` | `GT-008` | `WB01-D3` | `C1.NREC.05` | 3-4 | 1 | `free` | Kéo dán thẻ lượng vũ trụ vào ô số 1–5 | 2 |
| `GL-C1-NREC-SLOT-0106` | `GT-008` | `WB01-D3` | `C1.NREC.05` | 4-5 | 2 | `login` | Kéo dán thẻ lượng thiên nhiên vào ô số 6–10 | 2 |
| `GL-C1-CNT-CONT-0105` | `GT-003` | `WB01-D3` | `C1.CNT.01` | 3-4 | 1 | `free` | Đếm và thả quả vào giỏ số tương ứng | 3 |
| `GL-C1-NREC-TRAC-0101` | `GT-024` | `WB01-D4` | `C1.NREC.08` | 4-5 | 2 | `login` | Bé tập đồ nét chữ số 1–5 | 5 |
| `GL-C1-NREC-TRAC-0102` | `GT-024` | `WB01-D4` | `C1.NREC.08` | 5-6 | 3 | `standard` | Bé tập đồ nét chữ số 6–10 | 5 |
| `GL-C1-NREC-HUNT-0103` | `GT-037` | `WB01-D4` | `C1.NREC.03` | 4-5 | 2 | `login` | Săn tìm chữ số trong lưới 15 ô (Phạm vi 1–5) | 3 |
| `GL-C1-NREC-HUNT-0104` | `GT-037` | `WB01-D4` | `C1.NREC.03` | 5-6 | 3 | `standard` | Săn tìm chữ số trong lưới 15 ô (Phạm vi 6–10) | 3 |
| `GL-C1-CNT-TCNT-0101` | `GT-028` | `WB01-D5` | `C1.CNT.01` | 3-4 | 1 | `free` | Chạm tô thanh Ten-Frame phạm vi 1–5 | 3 |
| `GL-C1-CNT-TCNT-0102` | `GT-028` | `WB01-D5` | `C1.CNT.01` | 4-5 | 2 | `login` | Chạm tô thanh Ten-Frame phạm vi 6–10 | 3 |
| `GL-C1-NREC-HUNT-0105` | `GT-037` | `WB01-D5` | `C1.NREC.03` | 5-6 | 4 | `premium` | Thử thách thám tử số ma trận 21 ô | 3 |

---

## 7. Business Rules & Cương Lĩnh Sư Phạm Bất Biến

| Mã Quy Tắc | Tên Quy Tắc | Cương Lĩnh Cưỡng Chế |
|---|---|---|
| `BR-NO-GT038` | **Cấm tạo mới `GT-038+`** | Hệ thống giữ vững danh mục `GT-000`..`GT-037`. Mọi dạng bài Chặng 1 được hiện thực hóa qua `GT-000`, `GT-001`, `GT-005`, `GT-008`, `GT-024`, `GT-028`, `GT-037`. |
| `BR-MCM-06` | **Không từ khóa thương mại đo trí tuệ** | Tuyệt đối không dùng các từ "IQ", "Raven", "trí tuệ", "chỉ số thông minh", "WISC", "Mensa". Chuyển hóa toàn bộ thành "Thử Thách Ga Toán Học", "Căn Phòng Vinh Danh". |
| `BR-MGL-02` | **Dải mã Montessori $\ge 0101$** | Tất cả các game level chuyển thể từ Chặng 1 mang mã `GL-<COMP>-<STRAND>-<MECH>-01xx` với số thứ tự bắt đầu từ `0101` trở lên. |
| `BR-MGL-12` | **Gán `access_tier` khớp `difficulty`** | Cưỡng chế: Diff 1 $\rightarrow$ `free`, Diff 2 $\rightarrow$ `login`, Diff 3 $\rightarrow$ `standard`, Diff 4/5 $\rightarrow$ `premium`. |
| `BR-TOUCH-FLOOR` | **Sàn cảm ứng đạt chuẩn lứa tuổi** | Band 3–4 tuổi có sàn diện tích chạm tối thiểu đường kính $96\text{px}$; Band 5–6 tuổi tối thiểu $72\text{px}$. Các ô toa tàu và nút bấm ma trận tuân thủ nghiêm ngặt. |
| `BR-NO-RED-BUZZER`| **Kiểm soát lỗi tự thân không trừng phạt** | Tuyệt đối không có dấu gạch chéo đỏ, không âm thanh buzzer trừng phạt khi trẻ chọn sai. Phản hồi sai bằng nhịp thở hổ phách dịu (`amber_soft`, 400ms), item trôi về chỗ cũ. |
| `BR-TRACE-BAND` | **Giới hạn lứa tuổi cho cơ chế vẽ nét `GT-024`** | Chỉ áp dụng `GT-024` cho Band 4–5 và Band 5–6; cấm áp dụng cho Band 3–4 do cơ vận động tinh chưa hoàn thiện (theo `BR-LVB-06`). |

---

## 8. Data Contract & Fixtures

### 8.1. Fixture cho `GT-005` (Ghép cặp D2 - Trang 4: Vật thể ↔ Bàn tay ngón)
```json
{
  "left_column": [
    { "id": "cats_3", "label": "3 chú mèo", "image": { "kind": "emoji", "ref": "🐱" }, "count": 3 },
    { "id": "elephant_1", "label": "1 chú voi", "image": { "kind": "emoji", "ref": "🐘" }, "count": 1 },
    { "id": "ducks_5", "label": "5 chú vịt", "image": { "kind": "emoji", "ref": "🦆" }, "count": 5 },
    { "id": "apples_2", "label": "2 quả táo", "image": { "kind": "emoji", "ref": "🍎" }, "count": 2 }
  ],
  "right_column": [
    { "id": "hand_1", "label": "1 ngón tay", "value": 1 },
    { "id": "hand_3", "label": "3 ngón tay", "value": 3 },
    { "id": "hand_2", "label": "2 ngón tay", "value": 2 },
    { "id": "hand_5", "label": "5 ngón tay", "value": 5 }
  ],
  "correct_pairs": [
    { "left": "cats_3", "right": "hand_3" },
    { "left": "elephant_1", "right": "hand_1" },
    { "left": "ducks_5", "right": "hand_5" },
    { "left": "apples_2", "right": "hand_2" }
  ]
}
```

### 8.2. Fixture cho `GT-008` (Kéo vào ô chứa D3 - Trang 8: Thẻ lượng vũ trụ)
```json
{
  "slots": [
    { "slot_id": "slot_1", "target_number": 1, "label": "Ô số 1" },
    { "slot_id": "slot_2", "target_number": 2, "label": "Ô số 2" },
    { "slot_id": "slot_3", "target_number": 3, "label": "Ô số 3" },
    { "slot_id": "slot_4", "target_number": 4, "label": "Ô số 4" },
    { "slot_id": "slot_5", "target_number": 5, "label": "Ô số 5" }
  ],
  "source_cards": [
    { "card_id": "card_rockets_4", "count": 4, "image": "🚀", "label": "4 tên lửa" },
    { "card_id": "card_sun_1", "count": 1, "image": "☀️", "label": "1 mặt trời" },
    { "card_id": "card_planets_3", "count": 3, "image": "🪐", "label": "3 hành tinh" },
    { "card_id": "card_stars_5", "count": 5, "image": "⭐", "label": "5 ngôi sao" },
    { "card_id": "card_clouds_2", "count": 2, "image": "☁️", "label": "2 đám mây" }
  ]
}
```

### 8.3. Fixture cho `GT-037` (Tìm hết ký hiệu D4 - Trang 10: Săn số 1 trong lưới 3x5)
```json
{
  "target_symbol": "1",
  "grid_rows": 3,
  "grid_cols": 5,
  "cells": [
    { "id": "c1", "value": "1", "is_target": true },
    { "id": "c2", "value": "2", "is_target": false },
    { "id": "c3", "value": "1", "is_target": true },
    { "id": "c4", "value": "3", "is_target": false },
    { "id": "c5", "value": "4", "is_target": false },
    { "id": "c6", "value": "5", "is_target": false },
    { "id": "c7", "value": "1", "is_target": true },
    { "id": "c8", "value": "2", "is_target": false },
    { "id": "c9", "value": "4", "is_target": false },
    { "id": "c10", "value": "1", "is_target": true },
    { "id": "c11", "value": "3", "is_target": false },
    { "id": "c12", "value": "5", "is_target": false },
    { "id": "c13", "value": "2", "is_target": false },
    { "id": "c14", "value": "1", "is_target": true },
    { "id": "c15", "value": "4", "is_target": false }
  ],
  "target_total_count": 5
}
```
