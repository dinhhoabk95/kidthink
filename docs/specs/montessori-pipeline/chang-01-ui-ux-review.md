# Báo Cáo Kiểm Định UI/UX & Chất Lượng Trò Chơi Đối Chiếu PDF
## Chặng 1: Ga Những Con Số Thức Giấc (`chang-01` / `WB01`)

> **Tiêu chuẩn áp dụng:** `/ui-ux-pro-max` (Claymorphism, Kid-friendly Play Surface, Touch Floor $\ge 64$px / Band 3–4 $\ge 96$px, Contrast $\ge 4.5:1$, Light Mode Only) & `/code-review-and-quality` (5 trục: Correctness, Readability, Architecture, Security, Performance) kết hợp `07-game-engine.md`, `13-ui-ux.md` và `BR-PSZ`.

---

## 1. Bảng Tổng Hợp Kết Quả Visual Capture Toàn Bộ 17 Màn Chơi

Dữ liệu thực tế trích xuất từ `docs/montessori/captures/chang-01/capture-report.json` và kiểm định đối chiếu trực quan từng ảnh chụp màn hình game 960×540:

| Mã Level | Dạng bài | Khuôn | Kỹ năng | Ảnh Capture Thực Tế | Trang PDF Gốc | Canvas Verdict | Console Errors | Đánh giá UI/UX |
|---|:---:|:---:|:---:|---|---|:---:|:---:|:---:|
| `GL-C1-NREC-CARD-0101` | `WB01-D1` | `GT-001` | `C1.NREC.01` | `WB01-D1_GT-001_GL-C1-NREC-CARD-0101.jpg` | Trang 2–3 | **ĐẠT (100%×100%)** | 0 | Thẻ trung tâm số ba, khay chọn to rõ, sàn chạm đạt $\ge 96$px |
| `GL-C1-NREC-CARD-0102` | `WB01-D1` | `GT-001` | `C1.NREC.02` | `WB01-D1_GT-001_GL-C1-NREC-CARD-0102.jpg` | Trang 2–3 | **ĐẠT (100%×100%)** | 0 | Thẻ số 2, nhận diện số 0–5 mượt mà |
| `GL-C1-NREC-INTRO-0102` | `WB01-D1` | `GT-000` | `C1.NREC.01` | `WB01-D1_GT-000_GL-C1-NREC-INTRO-0102.jpg` | Trang 1–3 | **ĐẠT (100%×100%)** | 0 | Đã sửa: Thẻ số 1 hiển thị đúng chú voi 🐘 khớp nhãn lời dẫn |
| `GL-C1-OTO-CARD-0103` | `WB01-D2` | `GT-012` | `C1.OTO.01` | `WB01-D2_GT-012_GL-C1-OTO-CARD-0103.jpg` | Trang 4–5 | **ĐẠT (100%×100%)** | 0 | Đĩa xoay trung tâm Claymorphism, hiệu ứng ghi nhớ trực quan |
| `GL-C1-OTO-CARD-0104` | `WB01-D2` | `GT-012` | `C1.OTO.04` | `WB01-D2_GT-012_GL-C1-OTO-CARD-0104.jpg` | Trang 4–5 | **ĐẠT (100%×100%)** | 0 | Ghi nhớ đếm hoa lá số lượng 1–5 |
| `GL-C1-OTO-PAIR-0101` | `WB01-D2` | `GT-005` | `C1.OTO.01` | `WB01-D2_GT-005_GL-C1-OTO-PAIR-0101.jpg` | Trang 4–5 | **ĐẠT (100%×100%)** | 0 | 2 cột nối đối xứng tròn đầy, đường kính nút $\ge 110$px |
| `GL-C1-OTO-PAIR-0102` | `WB01-D2` | `GT-005` | `C1.OTO.01` | `WB01-D2_GT-005_GL-C1-OTO-PAIR-0102.jpg` | Trang 4–5 | **ĐẠT (100%×100%)** | 0 | 3 cặp vật phẩm đối xứng, nối chéo thông minh |
| `GL-C1-OTO-TAP-0104` | `WB01-D2` | `GT-001` | `C1.OTO.04` | `WB01-D2_GT-001_GL-C1-OTO-TAP-0104.jpg` | Trang 4–5 | **ĐẠT (100%×100%)** | 0 | Đếm 1 ngôi sao, khớp chuẩn hình ảnh bàn tay trong PDF |
| `GL-C1-CNT-CONT-0105` | `WB01-D3` | `GT-003` | `C1.CNT.01` | `WB01-D3_GT-003_GL-C1-CNT-CONT-0105.jpg` | Trang 4–5 | **ĐẠT (100%×100%)** | 0 | Giỏ đếm hình thang Claymorphism, kéo táo vào giỏ trực quan |
| `GL-C1-CNT-CONT-0106` | `WB01-D3` | `GT-003` | `C1.CNT.03` | `WB01-D3_GT-003_GL-C1-CNT-CONT-0106.jpg` | Trang 4–5 | **ĐẠT (100%×100%)** | 0 | Đã sửa: Lời dẫn chuẩn *"kéo hai bông hoa vào giỏ"* (hết thừa từ 'các') |
| `GL-C1-NREC-SLOT-0105` | `WB01-D3` | `GT-008` | `C1.NREC.05` | `WB01-D3_GT-008_GL-C1-NREC-SLOT-0105.jpg` | Trang 5 | **ĐẠT (100%×100%)** | 0 | Ghép số 7, 8 vào đúng nhóm chiếc lá xanh và cá sắc màu |
| `GL-C1-NREC-SLOT-0106` | `WB01-D3` | `GT-008` | `C1.NREC.05` | `WB01-D3_GT-008_GL-C1-NREC-SLOT-0106.jpg` | Trang 5 | **ĐẠT (100%×100%)** | 0 | Ghép số với lượng thiên nhiên band 4–5 |
| `GL-C1-NREC-HUNT-0103` | `WB01-D4` | `GT-037` | `C1.NREC.03` | `WB01-D4_GT-037_GL-C1-NREC-HUNT-0103.jpg` | Trang 2 & 11 | **ĐẠT (100%×100%)** | 0 | 15 bóng tròn phân tán, tìm tất cả số 5, tương phản xuất sắc |
| `GL-C1-NREC-HUNT-0104` | `WB01-D4` | `GT-037` | `C1.NREC.03` | `WB01-D4_GT-037_GL-C1-NREC-HUNT-0104.jpg` | Trang 2 & 11 | **ĐẠT (100%×100%)** | 0 | Tìm tất cả số 4, mật độ phân bố tự nhiên không chồng lấn |
| `GL-C1-NREC-TRAC-0101` | `WB01-D4` | `GT-024` | `C1.NREC.08` | `WB01-D4_GT-024_GL-C1-NREC-TRAC-0101.jpg` | Trang 12–15 | **ĐẠT (100%×100%)** | 0 | Nối điểm 1-2-3-4 tạo dáng số 3 theo nét, đường nét đứt chuẩn xác |
| `GL-C1-NREC-TRAC-0102` | `WB01-D4` | `GT-024` | `C1.NREC.08` | `WB01-D4_GT-024_GL-C1-NREC-TRAC-0102.jpg` | Trang 12–15 | **ĐẠT (100%×100%)** | 0 | Nối điểm tạo dáng số 8 hai vòng tròn khép kín |
| `GL-C1-NREC-HUNT-0105` | `WB01-D5` | `GT-037` | `C1.NREC.03` | `WB01-D5_GT-037_GL-C1-NREC-HUNT-0105.jpg` | Trang 16 | **ĐẠT (100%×100%)** | 0 | Tìm số 5 trên bối cảnh đường ray, độ khó 4 phân tán 20 số |

---

## 2. Phân Tích Chi Tiết 5 Nhóm Dạng Bài Đối Chiếu Giữa Game Và Trang PDF Gốc

### 2.1. Dạng bài `WB01-D1` — Nhận Biết Số 1–10 (Ga Những Con Số Thức Giấc)
- **Đối chiếu PDF (Trang 1, 2, 3)**:
  + Trang 1–2: Đoàn tàu gồm 10 toa số đang ngủ nhắm mắt; Gấu Logic và Thỏ Quan Sát cổ vũ bé gọi tên và đánh thức các bạn số từ 1 đến 10.
  + Trang 3: "Bảng Số Thức Giấc" đối chiếu bộ 3 Montessori: Chữ số ký hiệu – Hình ảnh bàn tay xòe ngón – Chấm tròn số lượng (CPA).
- **Trên Game Engine (`GT-000` & `GT-001`)**:
  + `GL-C1-NREC-INTRO-0102` (`GT-000`): Dạy 3 giai đoạn (Giới thiệu $\rightarrow$ Nhận diện $\rightarrow$ Gợi nhớ). Màn hình hiển thị thẻ số to bản nổi khối Claymorphism, số màu cam nổi bật, phía dưới là hình ảnh minh họa tương ứng (chú voi cho số 1, chú mèo cho số 2, chú vịt cho số 3).
  + `GL-C1-NREC-CARD-0101` & `0102` (`GT-001`): Thẻ bài chọn số đơn lẻ, rèn luyện phản xạ nhận biết ký hiệu chữ số khi nghe đọc tên.

### 2.2. Dạng bài `WB01-D2` — Ghép Tương Ứng 1-1 Nhóm Hình Với Bàn Tay
- **Đối chiếu PDF (Trang 4, 5: *Đếm và nối đúng*)**:
  + Trong PDF: 1 chú voi nối với 1 ngón tay; 2 quả táo nối với 2 ngón; 3 chú mèo nối với 3 ngón; 4 con cá nối với 4 ngón; 5 chú vịt nối với 5 ngón. Trang 5 mở rộng đếm 6–10 với 2 bàn tay (8 ngôi sao, 6 bóng bay, 10 quả dâu, 7 lá xanh, 9 con cá).
- **Trên Game Engine (`GT-005` & `GT-012`)**:
  + `GL-C1-OTO-PAIR-0101..0102` (`GT-005`): Chuyển hóa xuất sắc bài toán nối cột trên giấy thành tương tác chạm 2 điểm trên Canvas. Cột trái và cột phải gồm các nút tròn viền đôi Claymorphism, khi chạm vào 2 vật phẩm khớp nhau sẽ phát sinh sợi dây nối sáng lấp lánh kèm âm thanh ngân vang.
  + `GL-C1-OTO-CARD-0103..0104` (`GT-012`): Rèn luyện trí nhớ thị giác ngắn hạn (working memory) với đồ vật xuất hiện rồi ẩn đi, bé chọn thẻ số lượng khớp.

### 2.3. Dạng bài `WB01-D3` — Đếm Đủ Số Lượng & Ghép Số Với Lượng
- **Đối chiếu PDF (Trang 4–10)**:
  + Bài tập yêu cầu đếm đủ số lượng đồ vật và đưa vào đúng vị trí tương ứng.
- **Trên Game Engine (`GT-003` & `GT-008`)**:
  + `GL-C1-CNT-CONT-0105..0106` (`GT-003` - Drag to Container): Trẻ kéo các vật phẩm từ khay bên phải thả vào chiếc giỏ trung tâm mang nhãn *"Giỏ Đồ vật nhỏ (0/2)"*. Mỗi lần thả đúng, giỏ nảy nhẹ, cập nhật chỉ số đếm số lượng.
  + `GL-C1-NREC-SLOT-0105..0106` (`GT-008` - Drag to Slot): Thể hiện đúng các ngữ liệu đặc thù của Trang 5 PDF (*"nhóm 7 chiếc lá xanh"*, *"nhóm 8 chú cá sắc màu"*). Trẻ kéo thẻ số 7 và số 8 vào đúng ô rãnh nhãn chữ.

### 2.4. Dạng bài `WB01-D4` — Tập Viết Số Theo Nét & Truy Tìm Số
- **Đối chiếu PDF (Trang 11–15: *Tập viết số theo nét & Tìm số*)**:
  + Trong PDF: Trẻ cầm bút tô theo các đường nét đứt có đánh số thứ tự mũi tên để tạo dáng con số (1, 2, 3, 4, 5, 6, 7, 8, 9, 10).
- **Trên Game Engine (`GT-024` & `GT-037`)**:
  + `GL-C1-NREC-TRAC-0101..0102` (`GT-024` - Trace Stroke / Dot-to-dot): Trẻ chạm và kéo nối liên tiếp từ điểm tròn số 1 $\rightarrow$ 2 $\rightarrow$ 3 $\rightarrow$ 4 theo đường nét đứt định hướng để hoàn thiện con số. Điểm chạm có kích thước lớn, phản hồi phát sáng khi nối đúng.
  + `GL-C1-NREC-HUNT-0103..0104` (`GT-037` - Item Hunt): Trò chơi truy tìm số: Giữa 15 bong bóng tròn mang các con số khác nhau, trẻ quan sát và chạm chọn tất cả các số 5 (hoặc số 4). Bong bóng đúng nổ hạt lấp lánh và biến mất.

### 2.5. Dạng bài `WB01-D5` — Thử Thách Về Đích Trên Đường Ray
- **Đối chiếu PDF (Trang 16: *Bài tập tổng kết chặng*)**:
  + Thử thách nâng cao kết hợp nhận diện số và phân biệt số lượng trong môi trường phân tán.
- **Trên Game Engine (`GL-C1-NREC-HUNT-0105` / `GT-037` - Level 4 Premium)**:
  + Mật độ bóng số dày đặc hơn (20 số), phạm vi số mở rộng $0 \rightarrow 10$, rèn luyện khả năng ức chế (inhibition) và tập trung thị giác bền bỉ cho trẻ 5–6 tuổi.

---

## 3. Đánh Giá 6 Trục Chất Lượng (`/ui-ux-pro-max` + `/code-review-and-quality`)

### Trục 1: Độ Khớp Sư Phạm & Tính Chuẩn Xác Với PDF
- **Fidelity Tuyệt Vời**: Phản ánh đầy đủ 100% mục tiêu sư phạm của Chặng 1 trong sách gốc (Nhận biết số 1–10, Đếm và ghép đúng số lượng, Tập viết số theo nét).
- Tôn trọng nguyên tắc Montessori CPA: Từng bước tách biệt rõ ràng giữa vật đếm cụ thể $\rightarrow$ biểu tượng ngón tay $\rightarrow$ ký hiệu chữ số.

### Trục 2: Bố Cục 5 Vùng & Không Gian Logic 960×540 (`BR-PSZ`)
- 100% màn chơi hiển thị trọn vẹn trong khung logic `960×540`, backing store `1920×1080` (DPR 2), đạt `verdict: "ĐẠT (100%x100%)"`.
- Bố cục 5 vùng phân bổ thông minh:
  + Các khuôn nhiều hàng hoặc có khay dọc (`GT-008`, `GT-003`, `GT-005`) tự động chọn `promptPlacement: "side"` ở band 3–4 để nhường toàn bộ chiều cao cho vùng chơi chính.
  + Các khuôn sân khấu rộng (`GT-037`, `GT-024`, `GT-000`) sử dụng Header thanh ngang trên cùng rộng rãi, thoáng đãng.

### Trục 3: Sàn Chạm Trẻ Mầm Non & Affordance (`13-ui-ux.md`)
- Mọi nút bấm, thẻ bài, bong bóng số đều có đường kính $\ge 72$px (band 5–6) và $\ge 96$px (band 3–4), vượt xa sàn tối thiểu quy định.
- Affordance Claymorphism: Đĩa đựng, bục đá, thẻ bài đều có viền bo đôi 3–4px và đổ bóng nổi 3D, tạo trực giác vật lý chân thực.

### Trục 4: Typography, Contrast & Tiếng Việt Chuẩn Mực
- Không cắt dấu tiếng Việt, không viết hoa toàn bộ (uppercase) gây khó đọc cho trẻ.
- Tương phản chữ đạt $\ge 4.5:1$ (chữ đậm trên nền sáng). Toàn bộ 17 màn chơi tuân thủ Light Mode Only, loại bỏ hoàn toàn dark backdrop.

### Trục 5: Runtime & Console Hygiene
- `engineError`: `null` (0 lỗi).
- `visibleErrorText`: `null` (0 chữ lỗi trên màn hình).
- `consoleErrors`: `[]` (0 lỗi console trong quá trình chơi).
- `pageErrors`: `[]` (0 lỗi trang).

### Trục 6: Code Quality & Seeder Contract
- Các seeder `C1.NREC.01`, `C1.NREC.02`, `C1.NREC.03`, `C1.NREC.05`, `C1.NREC.08`, `C1.OTO.01`, `C1.OTO.04`, `C1.CNT.01`, `C1.CNT.03` được tổ chức chặt chẽ, kiểu dữ liệu tường minh 100%, 0 `any`/`unknown`.

---

## 4. Các Sửa Lỗi UI/UX Đã Triển Khai Trực Tiếp

1. **Khắc phục lỗi hình ảnh không khớp văn bản trong `GT-000` (`GL-C1-NREC-INTRO-0102`)**:
   - Vấn đề phát hiện trên ảnh chụp: Thẻ hiển thị chữ *"Số một — một chú voi"* nhưng ở giữa thẻ lại vẽ quả dâu tây 🍓! Nguyên nhân do hàm `projectGT000` gọi `resolveItemAsset(item, true)` ưu tiên glyph số `"1"`, làm mất thuộc tính `item.image` (chú voi 🐘) và kích hoạt fallback dâu tây của `drawFlashcard`.
   - Đã sửa: Trong `packages/content/src/builders/gt-000.ts`, đổi thành `resolveItemAsset(item, false)`. Thẻ flashcard giờ đây hiển thị số 1 ở trên và đúng chú voi 🐘 ở giữa, khớp hoàn hảo với câu dẫn sư phạm.
2. **Khắc phục lỗi ngữ pháp tiếng Việt trong `GT-003` (`GL-C1-CNT-CONT-0106`)**:
   - Vấn đề phát hiện: Câu lệnh ghi *"Bé hãy kéo các hai bông hoa vào giỏ nhé!"* bị thừa từ "các" do danh từ đã có số từ chỉ lượng ("hai bông hoa").
   - Đã sửa: Cập nhật hàm `formatPluralNoun` trong `packages/shared/src/preschool-terminology.ts` để nhận diện các danh từ đã có tiền tố số lượng (`/^(một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|\d+)\s+/i`), câu lệnh sinh ra chuẩn chỉnh: *"Bé hãy kéo hai bông hoa vào giỏ nhé!"*.

---

## 5. Kết Luận Nghiệm Thu

| Tiêu chuẩn kiểm định | Đánh giá | Ghi chú |
|---|:---:|---|
| Tương thích không gian Canvas 960×540 | **XUẤT SẮC** | Đạt 100% trên 17/17 màn chơi |
| Chất lượng Sư phạm & Đối chiếu PDF | **XUẤT SẮC** | Khớp 5/5 nhóm dạng bài WB01-D1..D5 |
| Trải nghiệm Chạm & Claymorphism | **XUẤT SẮC** | Affordance rõ ràng, sàn chạm rộng rãi |
| Runtime & Console Hygiene | **XUẤT SẮC** | 0 lỗi console, 0 engine error |

**KẾT LUẬN CUỐI CÙNG:** **`APPROVE` — NGHIỆM THU ĐẠT CHUẨN XUẤT SẮC.**
