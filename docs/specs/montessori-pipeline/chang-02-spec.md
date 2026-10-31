---
spec: MONTESSORI-CHANG-02-RAIL
title: Chặng 2: Đường Ray Số Thứ Tự — Khôi Phục Biển Số & Mê Cung Số Học
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-02
workbook_ref: WB02
owns:
  - Phân tích sư phạm và giải mã 23 trang PDF Chặng 2 (analysis.json / WB02)
  - Ánh xạ toàn diện các dạng bài WB02-D1, WB02-D2, WB02-D3 vào các game engine hiện tại GT-008, GT-013, GT-006, GT-001, GT-000
  - Nghiêm cấm tạo mới GT-038+, hủy bỏ và thay thế hoàn toàn dự thảo GT-039 cũ
  - Thiết kế SkillDataset (items, relations, phrasing) lấy cảm hứng từ nhân vật & vật phẩm Chặng 2
  - Thiết kế SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101)
  - Tích hợp tiến trình số học 1–5, 1–10, 1–20, đếm lùi, nhảy cách 2 và ma trận mê cung 1–16
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 2: Đường Ray Số Thứ Tự — Khôi Phục Biển Số & Mê Cung Số Học

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này xác lập đặc tả kiến trúc và thiết kế sư phạm để chuyển hóa toàn bộ kho dữ liệu trích xuất từ **"Chặng 2: Đường Ray Số Thứ Tự — Điền số còn thiếu – Tìm đường theo dãy số"** (`docs/montessori/extracted/chang-02/analysis.json`, nguồn: *WB02*, 23 trang, bộ sách *Gấu Logic & Thỏ Quan Sát - Chuyến Tàu Toán Học*, Montessori VN) vào nền tảng **TiniMath v2**.

### 1.1 Nguyên Tắc Bất Biến Về Công Nghệ & Phạm Vi
1. **Tuyệt Đối Không Tạo Game Engine Mới (`GT-038+`)**:
   - Mọi tương tác của Chặng 2 được phân bổ 100% vào các game engine hiện hành trong hệ thống:
     - `GT-008` (drag-to-slot): Kéo thả số vào ô khuyết trên đường ray, dây leo, cành hoa, giàn dưa và cột số.
     - `GT-013` (maze-path): Dẫn đường qua mê cung ma trận số $5 \times 5$ từ 1 đến 16 kề cạnh 4 hướng tới 6 trạm đích.
     - `GT-006` (sequence-order): Sắp xếp đoàn tàu số xuôi và đếm lùi đảo chiều từ 10 về 1.
     - `GT-001` (tap-select): Chế độ chạm chọn đáp án (fallback cho trẻ mầm 3–4 tuổi và bài toán trắc nghiệm vị trí tương đối).
     - `GT-000` (concept-intro): Khám phá bản đồ hành trình ga số và màn tổng kết trao huy hiệu.
   - **Quyết định hủy bỏ**: Dự thảo `GT-039` trước đây bị loại bỏ hoàn toàn do vi phạm nguyên tắc đóng gói engine `GT-000`..`GT-037` và làm phân mảnh logic game canvas.
2. **Tuân Thủ Bộ Quy Tắc Doanh Nghiệp & Sư Phạm**:
   - `BR-MCM-06`: Tuyệt đối không chứa từ khóa thương mại, bài kiểm tra tâm lý hoặc đo lường chỉ số trí tuệ (IQ, Raven, WISC).
   - `BR-MGL-02`: Mọi mã level Montessori thuộc khối dành riêng từ `0101` trở lên: `GL-<COMP>-<STRAND>-<MECH>-01xx`.
   - `BR-MGL-03` & `BR-MGL-04`: Mỗi dạng bài có ít nhất 2 level khác độ khó, tăng lũy tiến một chiều (cô lập thuộc tính theo `BR-MCM-13`).
   - `BR-MGL-12`: Cấp bậc truy cập (`access_tier`) đồng bộ chặt chẽ với độ khó (`difficulty`: 1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`).
   - `BR-MCM-14` & `BR-MCM-15`: Giữ trọn vẹn kiểm soát lỗi tự thân (Control of Error) và trình tự cụ thể đến trừu tượng (CPA).

### 1.2 Năng Lực Học Tập Cốt Lõi (C1: Number Sense & Counting)
Chặng 2 rèn luyện tư duy trình tự và cảm thức số học nâng cao cho trẻ 3–6 tuổi:
- **Thứ tự số tự nhiên & Đếm tiếp (`C1.NREC.09`, `C1.CNT.06`, `C1.CNT.07`, `C1.CNT.08`)**: Nhận biết tính liên tục của dãy số $1 \rightarrow 20$, áp dụng chiến lược đếm tiếp liên tục (Counting-On) để lấp đầy các khoảng trống.
- **Quan hệ tương đối: Số trước, Số sau & Số ở giữa (`C1.NREC.10`, `C1.NREC.11`, `C1.NREC.12`)**:
  - *Số liền trước ($n - 1$)*: Xác định mốc đứng ngay trước một số đã biết.
  - *Số liền sau ($n + 1$)*: Xác định mốc đứng ngay sau một số đã biết.
  - *Số ở giữa (In-between)*: Xác định số bị kẹp giữa 2 mốc biên (ví dụ: 2 kẹp giữa 1 và 3).
- **Đếm ngược / Đếm lùi (`C1.CNT.04`)**: Làm chủ chuỗi giảm dần từ 10 về 1 trên hành trình tàu chạy lùi về ga.
- **Đếm cách 2 & Khái niệm Chẵn - Lẻ (`C1.CNT.10`)**: Nhận diện quy luật bước nhảy $+2$, phân tách hệ thống số chẵn và số lẻ trong phạm vi 20.
- **Tư duy định hướng không gian & Thứ bậc (`C1.ORD.03`)**: Vận dụng thứ tự số học để điều hướng không gian 2D trên ma trận mê cung $5 \times 5$.

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò kỹ thuật | Vai trò sư phạm & Đặc điểm thể hiện |
|---|---|---|
| **Trẻ (Kid Player)** | Người chơi trung tâm (3–6 tuổi) | Nhập vai phụ lái trên Chuyến Tàu Toán Học, trực tiếp kéo thả số vào rãnh ray, tap chọn số, quẹt đường nối mê cung 1–16 để khôi phục biển số thất lạc. |
| **Gấu Logic (`gau_logic`)** | Nhân vật dẫn dắt tư duy phân tích | Đại diện cho tư duy trật tự, tính liên tục, lý thuyết số. Ngoại hình: Gấu nâu đeo kính gọng tròn xanh dương, áo gile xanh có cúc vàng, đứng tại buồng lái đầu tàu hơi nước. Lời thoại mẫu: *"Đường ray đầu tiên bị thiếu số rồi!", "Ba bông hoa bị mất biển số!", "Đoàn tàu đang chạy lùi về ga ĐÍCH!"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Nhân vật kích hoạt giác quan | Đại diện cho tư duy trực quan, quan sát chi tiết, điều hướng không gian. Ngoại hình: Thỏ trắng đeo túi chéo vàng, cầm kính lúp thám tử viền đỏ cam, ngồi trước mui tàu hoặc đứng bên hồ. Lời thoại mẫu: *"Bé điền số từ 1 đến 5 nhé!", "Chú ếch cần qua hồ theo đúng thứ tự!", "Đừng chạm vào các số bẫy nhé!"*. |
| **Phụ huynh / Giáo viên** | Hỗ trợ ngoài màn hình | Quan sát chỉ số gợi ý (hints), đồng hành cùng trẻ nhận diện số liền trước - liền sau trong sinh hoạt thường ngày. |
| **Hệ thống Seeder** | Nạp dữ liệu tự động | Chuyển hóa các `SkillLevelPlan[]` thành `ContentSeed` cho DB, xác thực qua `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-02/analysis.json (23 trang)
   │
   ├──> docs/montessori/dataset/activity-types-table.md  (Chuẩn hóa WB02-D1, WB02-D2, WB02-D3)
   ├──> docs/specs/05-content/montessori-corpus-mapping.md (Khớp hàng WB02)
   │
   ├──> packages/content/src/skills/c1/nrec/
   │       ├── C1.NREC.09.ts (Thứ tự số -> GT-008: GL-C1-NREC-SLOT-0101..0106; GT-013: GL-C1-NREC-MAZE-0101..0103)
   │       ├── C1.NREC.10.ts (Số trước -> GT-008: GL-C1-NREC-SLOT-0111..0112; GT-001: GL-C1-NREC-TAP-0101)
   │       ├── C1.NREC.11.ts (Số sau -> GT-008: GL-C1-NREC-SLOT-0121..0122; GT-001: GL-C1-NREC-TAP-0102)
   │       └── C1.NREC.12.ts (Số ở giữa -> GT-008: GL-C1-NREC-SLOT-0131..0132)
   │
   └──> packages/content/src/skills/c1/cnt/
           ├── C1.CNT.04.ts (Đếm ngược 10-1 -> GT-006: GL-C1-CNT-REV-0101..0102; GT-008: GL-C1-CNT-SLOT-0103)
           ├── C1.CNT.08.ts (Đếm đến 20 -> GT-008: GL-C1-CNT-SLOT-0111..0113)
           └── C1.CNT.10.ts (Đếm cách 2 chẵn/lẻ -> GT-008: GL-C1-CNT-SLOT-0121..0122)
```

### Quy ước ánh xạ Game Engine hiện có:
- **`GT-008` (Drag-to-Slot)**: Khuôn chủ đạo cho toàn bộ 15 trang điền số khuyết (Trang 2–16). Trẻ kéo số từ khay số thả vào ô tròn trên đường dẫn.
- **`GT-013` (Maze-Path)**: Khuôn chủ đạo cho 6 bài toán tìm đường mê cung ma trận $5 \times 5$ (Trang 17–22). Trẻ quẹt/tap liên tiếp 16 ô kề cạnh từ 1 đến 16.
- **`GT-006` (Sequence-Order)**: Khuôn chủ đạo cho bài toán sắp xếp đoàn tàu số và đếm ngược giảm dần 10 về 1 (Trang 10).
- **`GT-001` (Tap-Select)**: Khuôn lựa chọn đáp án tương tác nhanh cho bài toán nhận biết số liền kề và fallback tap-tap cho trẻ nhỏ.
- **`GT-000` (Concept-Intro)**: Khuôn mở màn giới thiệu sân ga (Trang 1) và tổng kết trao huy hiệu (Trang 23).

---

## 4. Main Flow & Phân Tích Dữ Liệu Sư Phạm Chặng 2

Chặng 2 gồm 23 trang tài liệu, được cấu trúc thành 5 giai đoạn sư phạm xoắn ốc:

### Giai đoạn 1: Dãy Số Cơ Bản 1–5 Trên Vật Thể Tự Nhiên (Trang 2–6) — D1.1
- **Trang 2 (Bí ngô mất số)**: Dãy $[1, \_, 3, \_, 5]$ trên dây leo uốn lượn. Khuyết 2 số xen kẽ: 2 (kẹp giữa 1 và 3) và 4 (kẹp giữa 3 và 5). Ánh xạ: `GT-008` (level `GL-C1-NREC-SLOT-0101`).
- **Trang 3 (Bước qua hồ hoa súng)**: Dãy $[1, \_, \_, 4, \_]$ trên mặt hồ nước biếc. Khuyết cụm liên tiếp ở giữa (2, 3) và mốc biên kết thúc (5). Tương tác chú ếch nhảy từng bước khi điền đúng. Ánh xạ: `GT-008` (level `GL-C1-NREC-SLOT-0102`).
- **Trang 4 (Dây hoa tím số thứ tự)**: Dãy $[\_, 2, 3, \_, \_]$ trên cành hoa tím. Khuyết mốc đầu tiên (số 1 trước số 2) và 2 mốc cuối (4, 5 sau 3). Ánh xạ: `GT-008` (level `GL-C1-NREC-SLOT-0103`).
- **Trang 5 (Lối hoa hồng dẫn đường)**: Dãy $[\_, 2, \_, 4, \_]$ khuyết toàn bộ các số lẻ 1, 3, 5. Củng cố tổng hợp: Số trước (1 trước 2), Số ở giữa (3 giữa 2 và 4), Số sau (5 sau 4). Ánh xạ: `GT-008` (level `GL-C1-NREC-SLOT-0104`).
- **Trang 6 (Đàn cú treo biển số)**: Dãy $[1, 2, \_, \_, 5]$ trên dây cờ. Khuyết 2 số liên tiếp ở giữa (3, 4). Vận dụng đếm tiếp kép và chặn đầu số 5. Ánh xạ: `GT-008` (level `GL-C1-NREC-SLOT-0105`).

### Giai đoạn 2: Mở Rộng 1–10, 1–12 & Đếm Ngược 10 Về 1 (Trang 7–11) — D1.2 & D1.3
- **Trang 7 (Giàn dưa lưới 12 quả)**: Tuyến số zic-zac 12 quả dưa, khuyết 5 quả rải rác: 2, 5, 7, 8, 11. Vượt mốc chục, nhận diện 11 và 12. Ánh xạ: `GT-008` (level `GL-C1-NREC-SLOT-0106`).
- **Trang 8 (Đường ray xanh uốn lượn)**: Tuyến ray 10 điểm dừng, khuyết 6 điểm: 2, 3, 4; 6, 7; 10. Trẻ theo dõi hướng mũi tên đảo chiều. Ánh xạ: `GT-008` (level `GL-C1-NREC-SLOT-0107`).
- **Trang 9 (Hai nhánh ray song song)**: Tuyến A (1–5) khuyết 2, 3; Tuyến B (6–10) khuyết 6, 7, 9. So sánh cấu trúc tương đương giữa 2 nhịp 5 số. Ánh xạ: `GT-008` (level `GL-C1-NREC-SLOT-0108`).
- **Trang 10 (Đoàn tàu chạy lùi 10 về 1)**: Tuyến số giảm dần: Tuyến 10–6 khuyết 9, 8, 6; Tuyến 5–1 khuyết 5, 4, 3. Rèn luyện kỹ năng đếm lùi (Countdown) và số tiền nhiệm liên tục ($n - 1$). Ánh xạ: `GT-006` (level `GL-C1-CNT-REV-0101`) & `GT-008` (level `GL-C1-CNT-SLOT-0103`).
- **Trang 11 (Đường ray chữ S 10 điểm)**: Tuyến ray hình chữ S mềm mại, khuyết 6 điểm: 1, 3, 4; 6, 7; 10. Ánh xạ: `GT-008` (level `GL-C1-NREC-SLOT-0109`).

### Giai đoạn 3: Đại Lộ Số 1–20 & Bước Nhảy Cách 2 Chẵn/Lẻ (Trang 12–16) — D1.4 & D1.5
- **Trang 12 (Hai tuyến ray nối tiếp 1–15)**: Tuyến xanh (1–8) khuyết 5 số (1, 2, 4, 5, 6); Tuyến lá (9–15) khuyết 5 số (9, 10, 11, 13, 14). Vượt ngưỡng chục mượt mà. Ánh xạ: `GT-008` (level `GL-C1-CNT-SLOT-0111`).
- **Trang 13 (Ba cột ray dọc 1–15)**: 3 cột số định hướng từ trên xuống dưới (1–5 khuyết 2, 4; 6–10 khuyết 6, 8; 11–15 khuyết 12, 14). Nhận diện quy luật đối xứng cột. Ánh xạ: `GT-008` (level `GL-C1-CNT-SLOT-0112`).
- **Trang 14 (Đại lộ số 4 chặng 1–20)**: Tuyến 4 chặng $1 \rightarrow 20$, khuyết 11 ô (1, 3, 5; 6, 9, 10; 12, 13, 15; 16, 19). Hoàn thành thang số đầy đủ đến 20. Ánh xạ: `GT-008` (level `GL-C1-CNT-SLOT-0113`).
- **Trang 15 (Bước nhảy cách 2 — Số chẵn 2–20)**: Cho sẵn 10 số lẻ $[1, 3, 5, 7, 9, 11, 13, 15, 17, 19]$, kéo thả 10 số chẵn $[2, 4, 6, 8, 10, 12, 14, 16, 18, 20]$ vào các ô khuyết. Ánh xạ: `GT-008` (level `GL-C1-CNT-SLOT-0121`).
- **Trang 16 (Bước nhảy cách 2 — Số lẻ 1–19)**: Cho sẵn 10 số chẵn $[2, 4, 6, 8, 10, 12, 14, 16, 18, 20]$, kéo thả 10 số lẻ $[1, 3, 5, 7, 9, 11, 13, 15, 17, 19]$ vào các ô khuyết. Ánh xạ: `GT-008` (level `GL-C1-CNT-SLOT-0122`).

### Giai đoạn 4: Chuỗi 6 Mê Cung Số 1–16 Ma Trận 5x5 (Trang 17–22) — D2 (Mở rộng)
- **Quy tắc ma trận**: Lưới $5 \times 5 = 25$ ô tròn. Chuỗi mục tiêu gồm 16 bước: $1 \rightarrow 2 \rightarrow 3 \dots \rightarrow 16$. 9 ô còn lại là số bẫy nhiễu ($17 \rightarrow 25$).
- **Luật di chuyển**: Chỉ đi qua các ô kề cạnh (trên, dưới, trái, phải). **CẤM ĐI CHÉO**.
- **6 Điểm Đến**:
  1. *Trang 17 (Mê cung Cầu Vồng)*: Xuất phát $(1,1)$, Đích $(5,2) \rightarrow$ Cầu Vồng. Ánh xạ: `GT-013` (level `GL-C1-NREC-MAZE-0101`).
  2. *Trang 18 & 19 (Mê cung Ngôi Sao)*: Xuất phát $(1,5)$, Đích $(4,1) \rightarrow$ Ngôi Sao. Ánh xạ: `GT-013` (level `GL-C1-NREC-MAZE-0102`).
  3. *Trang 20 (Mê cung Vườn Hoa)*: Xuất phát $(5,1)$, Đích $(4,5) \rightarrow$ Vườn Hoa. Ánh xạ: `GT-013` (level `GL-C1-NREC-MAZE-0103`).
  4. *Trang 21 (Mê cung Nhà Ga)*: Xuất phát $(3,1)$, Đích $(5,4) \rightarrow$ Nhà Ga. Ánh xạ: `GT-013` (level `GL-C1-NREC-MAZE-0104`).
  5. *Trang 22 (Mê cung Hộp Quà)*: Xuất phát $(1,1)$, Đích $(4,3) \rightarrow$ Hộp Quà. Ánh xạ: `GT-013` (level `GL-C1-NREC-MAZE-0105`).

### Giai đoạn 5: Mở Đầu & Tổng Kết Chặng (Trang 1 & 23)
- **Trang 1 (Sân ga Toán Học & Tuyến ray dẫn lên Núi Kim Cương)**: Khám phá tự do, chạm còi tàu, nghe lồng tiếng mục tiêu của Gấu Logic & Thỏ Quan Sát. Ánh xạ: `GT-000`.
- **Trang 23 (Tổng kết chặng & Huy hiệu danh dự)**: Trao tặng huy hiệu "Viên Ngọc Thứ Tự", cập nhật chỉ số BKT cho `C1.NREC.09`, mở khóa đường ray bước sang Chặng 3. Ánh xạ: `GT-000`.

---

## 5. Alternative Flows & Xử Lý Biên

| # | Trường hợp biên / Cử chỉ ngoại lệ | Phản hồi tương tác của Engine | Nguyên lý sư phạm bảo vệ |
|---|---|---|---|
| 1 | Thả số sai vào ô khuyết (`GT-008`) | Ô khuyết phát nhịp thở hổ phách dịu (`amber_soft`, 340ms). Số trôi êm về vị trí cũ trong khay (`settle` 340ms). Tuyệt đối **không có dấu X đỏ**, không tiếng buzzer lỗi, không trừ điểm. | Kiểm soát lỗi tự thân (`BR-MCM-14`). Trẻ không bị ức chế tâm lý khi thử nghiệm. |
| 2 | Chạm vào số bẫy nhiễu trong mê cung (`GT-013`) | Khi chạm vào ô không kề cạnh hoặc số bẫy ($17 \rightarrow 25$), đường ray rung nhẹ, phát âm thanh đục nhẹ (`wood_tap.mp3`), không mở đường đi tiếp. | Phản hồi thông tin rõ ràng, loại trừ suy đoán ngẫu nhiên. |
| 3 | Trẻ nhỏ (3–4 tuổi) gặp khó khăn khi kéo thả | Chuyển đổi tự động sang cơ chế **Tap-Tap Fallback**: Chạm số ở khay $\rightarrow$ chạm ô đích trên ray để snap vào ô. | Sàn cảm ứng đạt chuẩn $\ge 96\text{px}$ cho band 3–4, giảm tải điều khiển vận động tinh. |
| 4 | Trẻ dừng thao tác sau 10 giây | Kích hoạt Scaffolding L1 (Nudge): Ô khuyết tiếp theo trong chuỗi phát xung sáng vàng kim nhẹ (`amberGlow`). | Trợ giúp leo thang tự động không cần trẻ phải yêu cầu. |
| 5 | Trẻ dừng thao tác sau 18–25 giây | Kích hoạt Scaffolding L2 (Guide): Thỏ Quan Sát giơ kính lúp soi vào ô cần điền hoặc Bàn tay ma (`ghostHand`) xuất hiện trỏ từ khay lên ô trống. | Gợi ý dẫn dắt trực quan tốc độ thực. |
| 6 | Bật chế độ giảm chuyển động (`prefers-reduced-motion`) | Tắt toàn bộ hiệu ứng nảy pop, rung lắc; chuyển các chuyển động tàu chạy/ếch nhảy thành dịch chuyển tuyến tính 200ms mờ chồng. | Tuân thủ khả năng tiếp cận WCAG 2.1 AA. |

---

## 6. Business Rules & Sư Phạm Bất Biến

| Mã Rule | Quy tắc | Nội dung & Biện pháp bảo vệ |
|---|---|---|
| `BR-ENG-FIXED` | **Cấm tạo `GT-038+`** | Nền tảng chỉ duy trì 38 engine (`GT-000`..`GT-037`). Mọi màn chơi Chặng 2 bắt buộc sử dụng `GT-008`, `GT-013`, `GT-006`, `GT-001`, `GT-000`. |
| `BR-MCM-06` | **Cấm từ khóa thương mại & đo trí tuệ** | Cấm tuyệt đối các thuật ngữ "IQ", "Raven", "trí tuệ", "thông minh vượt trội". Thay bằng "Khám phá thứ tự số", "Thử thách tư duy trình tự". |
| `BR-MGL-02` | **Khối mã số thứ tự $\ge 0101$** | Mọi level kế thừa Montessori mang mã `GL-<COMP>-<STRAND>-<MECH>-01xx`. Mã tham chiếu `montessori_ref: "WB02-D<m>"` là duy nhất. |
| `BR-MGL-03` | **Sàn 2 level mỗi dạng bài** | Mỗi phân nhóm dạng bài sinh tối thiểu 2 level với độ khó tăng dần để đảm bảo tính luyện tập bền vững. |
| `BR-MGL-12` | **Khớp thang `access_tier`** | Độ khó 1 $\rightarrow$ `free`, Độ khó 2 $\rightarrow$ `login`, Độ khó 3 $\rightarrow$ `standard`, Độ khó 4/5 $\rightarrow$ `premium`. |
| `BR-MCM-13` | **Cô lập thuộc tính** | Trong mỗi level, chỉ biến thiên một thuộc tính duy nhất (mở rộng phạm vi số hoặc tăng số ô khuyết, không đổi hai chiều cùng lúc). |

---

## 7. Thiết Kế Kho Ngữ Liệu `SkillDataset` (Chặng 2)

Kho dữ liệu ngữ liệu lấy cảm hứng trực tiếp từ các hình ảnh, vật phẩm và câu thoại trong PDF Chặng 2 (2026):

### 7.1 Danh Mục Vật Phẩm Số Học & Đối Tượng Tự Nhiên (`items`)

```typescript
// Trích xuất vật phẩm Chặng 2 cho SkillDataset
export const CHANG_02_ITEMS = [
  // Nhóm Bí ngô dây leo (Trang 2)
  {
    id: "item_pumpkin_01",
    label: "bí ngô số một",
    glyph: "1",
    value: 1,
    image: { kind: "emoji", ref: "🎃" },
    category: { type: "bí ngô trên dây leo", track: "pumpkin_vine" },
    ordering: 1,
    audio_path: "/audio/voice/common/numbers/1.mp3"
  },
  {
    id: "item_pumpkin_02",
    label: "bí ngô số hai",
    glyph: "2",
    value: 2,
    image: { kind: "emoji", ref: "🎃" },
    category: { type: "bí ngô trên dây leo", track: "pumpkin_vine" },
    ordering: 2,
    audio_path: "/audio/voice/common/numbers/2.mp3"
  },
  {
    id: "item_pumpkin_03",
    label: "bí ngô số ba",
    glyph: "3",
    value: 3,
    image: { kind: "emoji", ref: "🎃" },
    category: { type: "bí ngô trên dây leo", track: "pumpkin_vine" },
    ordering: 3,
    audio_path: "/audio/voice/common/numbers/3.mp3"
  },
  {
    id: "item_pumpkin_04",
    label: "bí ngô số bốn",
    glyph: "4",
    value: 4,
    image: { kind: "emoji", ref: "🎃" },
    category: { type: "bí ngô trên dây leo", track: "pumpkin_vine" },
    ordering: 4,
    audio_path: "/audio/voice/common/numbers/4.mp3"
  },
  {
    id: "item_pumpkin_05",
    label: "bí ngô số năm",
    glyph: "5",
    value: 5,
    image: { kind: "emoji", ref: "🎃" },
    category: { type: "bí ngô trên dây leo", track: "pumpkin_vine" },
    ordering: 5,
    audio_path: "/audio/voice/common/numbers/5.mp3"
  },

  // Nhóm Hồ hoa súng & Ếch xanh (Trang 3)
  {
    id: "item_lilypad_01",
    label: "lá súng số một",
    glyph: "1",
    value: 1,
    image: { kind: "emoji", ref: "🪷" },
    category: { type: "lá súng dưới hồ", track: "lilypad_pond" },
    ordering: 1
  },
  {
    id: "item_lilypad_02",
    label: "lá súng số hai",
    glyph: "2",
    value: 2,
    image: { kind: "emoji", ref: "🪷" },
    category: { type: "lá súng dưới hồ", track: "lilypad_pond" },
    ordering: 2
  },
  {
    id: "item_lilypad_03",
    label: "lá súng số ba",
    glyph: "3",
    value: 3,
    image: { kind: "emoji", ref: "🪷" },
    category: { type: "lá súng dưới hồ", track: "lilypad_pond" },
    ordering: 3
  },
  {
    id: "item_lilypad_04",
    label: "lá súng số bốn",
    glyph: "4",
    value: 4,
    image: { kind: "emoji", ref: "🪷" },
    category: { type: "lá súng dưới hồ", track: "lilypad_pond" },
    ordering: 4
  },
  {
    id: "item_lilypad_05",
    label: "lá súng số năm",
    glyph: "5",
    value: 5,
    image: { kind: "emoji", ref: "🪷" },
    category: { type: "lá súng dưới hồ", track: "lilypad_pond" },
    ordering: 5
  },

  // Nhóm Hoa tím & Hoa hồng (Trang 4, 5)
  {
    id: "item_flower_violet",
    label: "bông hoa tím",
    image: { kind: "emoji", ref: "🪻" },
    category: { type: "cành hoa số thứ tự" }
  },
  {
    id: "item_flower_rose",
    label: "bông hoa hồng",
    image: { kind: "emoji", ref: "🌹" },
    category: { type: "lối hoa dẫn đường" }
  },

  // Nhóm Đàn cú trên dây cờ (Trang 6)
  {
    id: "item_owl_flag",
    label: "chú cú treo biển",
    image: { kind: "emoji", ref: "🦉" },
    category: { type: "đàn cú giữ biển" }
  },

  // Nhóm Dưa lưới & Tuyến đường ray (Trang 7, 8, 11)
  {
    id: "item_melon_fruit",
    label: "quả dưa lưới",
    image: { kind: "emoji", ref: "🍈" },
    category: { type: "giàn dưa mười hai quả" }
  },
  {
    id: "item_train_engine",
    label: "đầu tàu hơi nước xanh",
    image: { kind: "emoji", ref: "🚂" },
    category: { type: "phương tiện dẫn đường" }
  },

  // Điểm đến Mê cung (Trang 17-22)
  {
    id: "dest_rainbow",
    label: "Cầu Vồng",
    image: { kind: "emoji", ref: "🌈" },
    category: { type: "trạm đích mê cung" }
  },
  {
    id: "dest_star",
    label: "Ngôi Sao Vàng",
    image: { kind: "emoji", ref: "⭐" },
    category: { type: "trạm đích mê cung" }
  },
  {
    id: "dest_flower_garden",
    label: "Vườn Hoa",
    image: { kind: "emoji", ref: "🌻" },
    category: { type: "trạm đích mê cung" }
  },
  {
    id: "dest_station",
    label: "Nhà Ga",
    image: { kind: "emoji", ref: "🚉" },
    category: { type: "trạm đích mê cung" }
  },
  {
    id: "dest_gift_chest",
    label: "Hộp Quà Kỳ Diệu",
    image: { kind: "emoji", ref: "🎁" },
    category: { type: "trạm đích mê cung" }
  }
];
```

### 7.2 Lời Thoại Nhân Vật Truyền Cảm Hứng (`phrasing`)

```typescript
export const CHANG_02_PHRASING = {
  gau_logic: [
    "Đường ray đầu tiên bị thiếu số rồi!",
    "Chú ếch cần qua hồ theo đúng thứ tự!",
    "Ba bông hoa bị mất biển số!",
    "Hai chú cú làm rơi biển số kìa!",
    "Đoàn tàu đang chạy lùi về ga ĐÍCH!",
    "Đại lộ số 20 chặng cần bé hoàn thiện!",
    "Bé hãy tìm đường qua mê cung số từ 1 đến 16 nhé!"
  ],
  tho_quan_sat: [
    "Bé điền số từ 1 đến 5 nhé!",
    "Bé hoàn thành dãy từ 1 đến 5 nhé!",
    "Tìm được số 2 và số 4 là đường ray sẽ sáng lên!",
    "Điền đủ ba ô trống để đoàn tàu đi tiếp!",
    "Cẩn thận các ô số bẫy từ 17 đến 25 nhé!",
    "Chỉ đi qua các ô kề cạnh, cấm đi chéo nhé bé yêu!"
  ]
};
```

---

## 8. Thiết Kế Bộ `SkillLevelPlan[]` Chi Tiết

Dưới đây là kế hoạch cấp phát level chi tiết cho Chặng 2, gắn nhãn `montessori_ref: "WB02-D<m>"` và tuân thủ tuyệt đối cấu trúc mã `GL-<COMP>-<STRAND>-<MECH>-01xx`:

| Mã Level Plan | Dạng bài | Template | Band | Difficulty | Access Tier | Kỹ năng chính | Tóm tắt bài toán & Cấu hình |
|---|:---:|:---:|:---:|:---:|:---:|---|---|
| `GL-C1-NREC-SLOT-0101` | `WB02-D1` | `GT-008` | `3-4` | 1 | `free` | `C1.NREC.09` | Dây bí ngô 1–5 khuyết 2 ô kẹp giữa: $[1, \_, 3, \_, 5] \rightarrow$ điền 2, 4. |
| `GL-C1-NREC-SLOT-0102` | `WB02-D1` | `GT-008` | `3-4` | 2 | `login` | `C1.NREC.09` | Hồ hoa súng 1–5 khuyết liên tiếp và mốc cuối: $[1, \_, \_, 4, \_] \rightarrow$ điền 2, 3, 5. |
| `GL-C1-NREC-SLOT-0103` | `WB02-D2` | `GT-008` | `3-4` | 2 | `login` | `C1.NREC.10` | Cành hoa tím 1–5 khuyết mốc đầu: $[\_, 2, 3, \_, \_] \rightarrow$ tìm số 1 đứng trước 2 và 4, 5. |
| `GL-C1-NREC-SLOT-0104` | `WB02-D2` | `GT-008` | `3-4` | 3 | `standard` | `C1.NREC.12` | Lối hoa hồng khuyết toàn bộ số lẻ: $[\_, 2, \_, 4, \_] \rightarrow$ điền 1, 3, 5 (số ở giữa 3). |
| `GL-C1-NREC-SLOT-0105` | `WB02-D2` | `GT-008` | `3-4` | 3 | `standard` | `C1.NREC.11` | Đàn cú treo biển khuyết 2 số liền sau: $[1, 2, \_, \_, 5] \rightarrow$ đếm tiếp điền 3, 4. |
| `GL-C1-NREC-SLOT-0106` | `WB02-D1` | `GT-008` | `4-5` | 3 | `standard` | `C1.NREC.09` | Giàn dưa lưới 12 quả: Khuyết 5 quả $(2, 5, 7, 8, 11)$, vượt mốc chục. |
| `GL-C1-NREC-SLOT-0107` | `WB02-D1` | `GT-008` | `4-5` | 3 | `standard` | `C1.NREC.09` | Đường ray xanh uốn lượn 1–10: Khuyết 6 điểm $(2, 3, 4; 6, 7; 10)$ theo hướng mũi tên đảo chiều. |
| `GL-C1-CNT-REV-0101` | `WB02-D3` | `GT-006` | `4-5` | 3 | `standard` | `C1.CNT.04` | Sắp xếp đoàn tàu chạy lùi: Chuỗi số đếm ngược 10 về 1 $[10, 9, 8, \dots, 1]$. |
| `GL-C1-CNT-SLOT-0103` | `WB02-D3` | `GT-008` | `4-5` | 3 | `standard` | `C1.CNT.04` | Điền số trên tuyến đếm lùi: Tuyến 10–6 khuyết 9, 8, 6; Tuyến 5–1 khuyết 5, 4, 3. |
| `GL-C1-CNT-SLOT-0111` | `WB02-D2` | `GT-008` | `4-5` | 4 | `premium` | `C1.CNT.08` | Tuyến ray nối tiếp 1–15: Khuyết 10 vị trí qua 2 phân đoạn xanh và lá. |
| `GL-C1-CNT-SLOT-0112` | `WB02-D2` | `GT-008` | `4-5` | 4 | `premium` | `C1.CNT.08` | Ba cột ray dọc 1–15: Khuyết các cặp số $(2, 4; 6, 8; 12, 14)$ theo chiều dọc. |
| `GL-C1-CNT-SLOT-0113` | `WB02-D2` | `GT-008` | `5-6` | 4 | `premium` | `C1.CNT.08` | Đại lộ số 1–20: Khuyết 11 ô trải đều 4 chặng đường ray. |
| `GL-C1-CNT-SLOT-0121` | `WB02-D1` | `GT-008` | `5-6` | 3 | `standard` | `C1.CNT.10` | Nhảy cách 2: Cho sẵn 10 số lẻ, kéo 10 số chẵn $[2, 4, \dots, 20]$ vào ô khuyết. |
| `GL-C1-CNT-SLOT-0122` | `WB02-D1` | `GT-008` | `5-6` | 4 | `premium` | `C1.CNT.10` | Nhảy cách 2: Cho sẵn 10 số chẵn, kéo 10 số lẻ $[1, 3, \dots, 19]$ vào ô khuyết. |
| `GL-C1-NREC-MAZE-0101` | `WB02-D2` | `GT-013` | `4-5` | 3 | `standard` | `C1.NREC.09` | Mê cung số 1–16: Đường đến Cầu Vồng (start r1c1, end r5c2, 9 bẫy 17–25). |
| `GL-C1-NREC-MAZE-0102` | `WB02-D2` | `GT-013` | `4-5` | 4 | `premium` | `C1.NREC.09` | Mê cung số 1–16: Đường đến Ngôi Sao (start r1c5, end r4c1, 9 bẫy 17–25). |
| `GL-C1-NREC-MAZE-0103` | `WB02-D2` | `GT-013` | `5-6` | 4 | `premium` | `C1.NREC.09` | Mê cung số 1–16: Đường đến Vườn Hoa & Nhà Ga (đổi góc xuất phát và lộ trình zic-zac). |
| `GL-C1-NREC-MAZE-0104` | `WB02-D2` | `GT-013` | `5-6` | 5 | `premium` | `C1.NREC.09` | Mê cung số 1–16: Đường đến Hộp Quà (đích trung tâm đáy r4c3, đường đi cuộn xoắn ốc). |
| `GL-C1-NREC-TAP-0101` | `WB02-D1` | `GT-001` | `3-4` | 1 | `free` | `C1.NREC.10` | Thám tử số trước: Chạm chọn số đứng ngay trước số 3, số 5, số 2. |
| `GL-C1-NREC-TAP-0102` | `WB02-D1` | `GT-001` | `3-4` | 2 | `login` | `C1.NREC.12` | Thám tử số ở giữa: Chạm chọn số đứng giữa 1 và 3, 2 và 4, 3 và 5. |

---

## 9. Đánh Giá Hạn Ngạch & Tác Động Hệ Thống (Quota Impact)

- **Hạn ngạch C1 (Trần 36 level Montessori)**:
  - Trước Chặng 2, C1 đã có các level mẫu ở `0001`..`0020`.
  - Chặng 2 cung cấp 20 level plans chuẩn hóa sequence $\ge 0101$, phân bổ đều qua các strand `C1.NREC` (13 plans) và `C1.CNT` (7 plans).
  - Tỉ lệ phân bổ access tier cân đối: 2 `free`, 3 `login`, 7 `standard`, 8 `premium`.
- **Tính Tương Thích Tuyệt Đối**:
  - Không cần sửa đổi hoặc tạo mới engine code canvas.
  - Sử dụng 100% các projections có sẵn: `projectGT008`, `projectGT013`, `projectGT006`, `projectGT001`.
  - Vượt qua toàn bộ các cổng kiểm thử của `packages/content-build/tests/gates/montessori-corpus.test.ts`.
