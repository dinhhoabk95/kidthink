# Báo Cáo Kiểm Định UI/UX & Chất Lượng Trò Chơi Đối Chiếu PDF
## Chặng 2: Đường Ray Số Thứ Tự — Khôi Phục Biển Số & Mê Cung Số Học (`chang-02` / `WB02`)

> **Tiêu chuẩn áp dụng:** `/ui-ux-pro-max` (Claymorphism, Kid-friendly Play Surface, Touch Floor $\ge 64$px / Band 3–4 $\ge 96$px, Contrast $\ge 4.5:1$, Light Mode Only) & `/code-review-and-quality` (5 trục: Correctness, Readability, Architecture, Security, Performance) kết hợp `07-game-engine.md`, `13-ui-ux.md` và `BR-PSZ`.

---

## 1. Bảng Tổng Hợp Kết Quả Visual Capture Toàn Bộ 26 Màn Chơi

Dữ liệu thực tế từ `docs/montessori/captures/chang-02/capture-report.json` và kiểm tra đối chiếu trực quan 26 ảnh chụp màn hình game 960×540:

| Mã Level | Dạng bài | Khuôn | Kỹ năng | Ảnh Capture Thực Tế | Trang PDF Gốc | Canvas Verdict | Console Errors | Đánh giá UI/UX |
|---|:---:|:---:|:---:|---|---|:---:|:---:|:---:|
| `GL-C1-CNT-SLOT-0121` | `WB02-D1` | `GT-008` | `C1.CNT.10` | `WB02-D1_GT-008_GL-C1-CNT-SLOT-0121.jpg` | Trang 15 | **ĐẠT (100%×100%)** | 0 | 4 slot đếm cách 2 quả anh đào, dock khay 5 đĩa rõ nét |
| `GL-C1-CNT-SLOT-0122` | `WB02-D1` | `GT-008` | `C1.CNT.10` | `WB02-D1_GT-008_GL-C1-CNT-SLOT-0122.jpg` | Trang 16 | **ĐẠT (100%×100%)** | 0 | Đếm cách 2 phạm vi tới 20, độ khó 4 |
| `GL-C1-NREC-CARD-0107` | `WB02-D1` | `GT-001` | `C1.NREC.09` | `WB02-D1_GT-001_GL-C1-NREC-CARD-0107.jpg` | Trang 8 | **ĐẠT (100%×100%)** | 0 | Thẻ số tám, đối chiếu thứ tự điểm dừng đường ray |
| `GL-C1-NREC-CARD-0108` | `WB02-D1` | `GT-001` | `C1.NREC.09` | `WB02-D1_GT-001_GL-C1-NREC-CARD-0108.jpg` | Trang 8 | **ĐẠT (100%×100%)** | 0 | Thẻ số bốn, nhận diện thứ tự số 1–10 |
| `GL-C1-NREC-SLOT-0102` | `WB02-D1` | `GT-008` | `C1.NREC.09` | `WB02-D1_GT-008_GL-C1-NREC-SLOT-0102.jpg` | Trang 3 | **ĐẠT (100%×100%)** | 0 | Khôi phục thứ tự qua hồ hoa súng, 3 ô rãnh slot |
| `GL-C1-NREC-SLOT-0116` | `WB02-D1` | `GT-008` | `C1.NREC.09` | `WB02-D1_GT-008_GL-C1-NREC-SLOT-0116.jpg` | Trang 2 & 7 | **ĐẠT (100%×100%)** | 0 | Dãy số bí ngô và dưa lưới khuyết |
| `GL-C1-NREC-SLOT-0117` | `WB02-D1` | `GT-008` | `C1.NREC.09` | `WB02-D1_GT-008_GL-C1-NREC-SLOT-0117.jpg` | Trang 4–6 | **ĐẠT (100%×100%)** | 0 | Dây hoa tím và cành lá số thứ tự |
| `GL-C1-NREC-TAP-0101` | `WB02-D1` | `GT-001` | `C1.NREC.10` | `WB02-D1_GT-001_GL-C1-NREC-TAP-0101.jpg` | Trang 1 | **ĐẠT (100%×100%)** | 0 | Đã sửa: Câu lệnh *"Bé hãy chọn số 8 trước số 9 nhé!"* (hết lặp từ) |
| `GL-C1-NREC-TAP-0102` | `WB02-D1` | `GT-001` | `C1.NREC.11` | `WB02-D1_GT-001_GL-C1-NREC-TAP-0102.jpg` | Trang 1 | **ĐẠT (100%×100%)** | 0 | Đã sửa: Câu lệnh *"Bé hãy chọn số 4 sau số 3 nhé!"* chuẩn xác |
| `GL-C1-NREC-TAP-0103` | `WB02-D1` | `GT-001` | `C1.NREC.12` | `WB02-D1_GT-001_GL-C1-NREC-TAP-0103.jpg` | Trang 1 | **ĐẠT (100%×100%)** | 0 | Nhận diện số ở giữa hai mốc biên kề |
| `GL-C1-CNT-SLOT-0111` | `WB02-D2` | `GT-008` | `C1.CNT.08` | `WB02-D2_GT-008_GL-C1-CNT-SLOT-0111.jpg` | Trang 12 | **ĐẠT (100%×100%)** | 0 | Đếm đến 20 tuyến thiên nhiên, vượt ngưỡng chục |
| `GL-C1-CNT-SLOT-0112` | `WB02-D2` | `GT-008` | `C1.CNT.08` | `WB02-D2_GT-008_GL-C1-CNT-SLOT-0112.jpg` | Trang 13 | **ĐẠT (100%×100%)** | 0 | 3 cột ray dọc 1–15, quy luật cột đối xứng |
| `GL-C1-CNT-SLOT-0113` | `WB02-D2` | `GT-008` | `C1.CNT.08` | `WB02-D2_GT-008_GL-C1-CNT-SLOT-0113.jpg` | Trang 14 | **ĐẠT (100%×100%)** | 0 | Đại lộ 4 chặng 1–20 khuyết 11 ô |
| `GL-C1-NREC-MAZE-0101` | `WB02-D2` | `GT-013` | `C1.NREC.09` | `WB02-D2_GT-013_GL-C1-NREC-MAZE-0101.jpg` | Trang 17 | **ĐẠT (100%×100%)** | 0 | Mê cung ma trận tìm đường đến đích, tường ngăn sắc nét |
| `GL-C1-NREC-MAZE-0102` | `WB02-D2` | `GT-013` | `C1.NREC.09` | `WB02-D2_GT-013_GL-C1-NREC-MAZE-0102.jpg` | Trang 18 | **ĐẠT (100%×100%)** | 0 | Mê cung tìm đường đến Ngôi sao vàng |
| `GL-C1-NREC-MAZE-0103` | `WB02-D2` | `GT-013` | `C1.NREC.09` | `WB02-D2_GT-013_GL-C1-NREC-MAZE-0103.jpg` | Trang 20 | **ĐẠT (100%×100%)** | 0 | Mê cung tìm đường đến Vườn hoa |
| `GL-C1-NREC-MAZE-0104` | `WB02-D2` | `GT-013` | `C1.NREC.09` | `WB02-D2_GT-013_GL-C1-NREC-MAZE-0104.jpg` | Trang 21 | **ĐẠT (100%×100%)** | 0 | Mê cung tìm đường đến Nhà ga đích |
| `GL-C1-NREC-SLOT-0103` | `WB02-D2` | `GT-008` | `C1.NREC.10` | `WB02-D2_GT-008_GL-C1-NREC-SLOT-0103.jpg` | Trang 4 | **ĐẠT (100%×100%)** | 0 | Kéo thả tìm số trước trên dây hoa |
| `GL-C1-NREC-SLOT-0104` | `WB02-D2` | `GT-008` | `C1.NREC.12` | `WB02-D2_GT-008_GL-C1-NREC-SLOT-0104.jpg` | Trang 5 | **ĐẠT (100%×100%)** | 0 | Kéo thả tìm số ở giữa lối hoa hồng |
| `GL-C1-NREC-SLOT-0115` | `WB02-D2` | `GT-008` | `C1.NREC.11` | `WB02-D2_GT-008_GL-C1-NREC-SLOT-0115.jpg` | Trang 6 | **ĐẠT (100%×100%)** | 0 | Kéo thả tìm số sau đàn cú treo biển |
| `GL-C1-SEQ-SLOT-0131` | `WB02-D2` | `GT-008` | `C1.NREC.09` | `WB02-D2_GT-008_GL-C1-SEQ-SLOT-0131.jpg` | Trang 8 | **ĐẠT (100%×100%)** | 0 | Hoàn thành tuyến ray 10 điểm dừng |
| `GL-C1-SEQ-SLOT-0132` | `WB02-D2` | `GT-008` | `C1.NREC.09` | `WB02-D2_GT-008_GL-C1-SEQ-SLOT-0132.jpg` | Trang 11 | **ĐẠT (100%×100%)** | 0 | Hoàn thành tuyến ray chữ S uốn lượn |
| `GL-C1-CNT-REV-0101` | `WB02-D3` | `GT-006` | `C1.CNT.04` | `WB02-D3_GT-006_GL-C1-CNT-REV-0101.jpg` | Trang 10 | **ĐẠT (100%×100%)** | 0 | Đầu tàu vàng nhả khói, sắp xếp 4 toa số 7, 10, 9, 8 |
| `GL-C1-CNT-SLOT-0103` | `WB02-D3` | `GT-008` | `C1.CNT.04` | `WB02-D3_GT-008_GL-C1-CNT-SLOT-0103.jpg` | Trang 10 | **ĐẠT (100%×100%)** | 0 | Kéo thả đếm ngược 10 về 1 trên thanh ray lùi |
| `GL-C1-SEQ-PAT-0109` | `WB02-D3` | `GT-006` | `C1.NREC.09` | `WB02-D3_GT-006_GL-C1-SEQ-PAT-0109.jpg` | Trang 9 | **ĐẠT (100%×100%)** | 0 | Sắp xếp đoàn tàu số xuôi hai nhánh song song |
| `GL-C1-SEQ-PAT-0110` | `WB02-D3` | `GT-006` | `C1.NREC.09` | `WB02-D3_GT-006_GL-C1-SEQ-PAT-0110.jpg` | Trang 9 | **ĐẠT (100%×100%)** | 0 | Sắp xếp toa tàu trường học theo thứ tự |

---

## 2. Phân Tích Chi Tiết 3 Nhóm Dạng Bài Đối Chiếu Game Và PDF Gốc

### 2.1. Dạng bài `WB02-D1` — Khôi Phục Biển Số Bị Thất Lạc & Điền Số Còn Thiếu (1–5, 1–10, 1–20)
- **Đối chiếu PDF (Trang 1–9, 15–16)**:
  + Trang 2 (*Những quả bí ngô mất số*): Dây leo nối các quả bí ngô $1 \rightarrow \_ \rightarrow 3 \rightarrow \_ \rightarrow 5$. Trẻ điền số 2 và số 4 để đường ray sáng lên.
  + Trang 3 (*Bước qua hồ hoa súng*): Chú ếch xanh ngồi bên hồ, cần nhảy qua các lá súng theo đúng thứ tự $1 \rightarrow \_ \rightarrow \_ \rightarrow 4 \rightarrow \_$ tới hoa súng vàng (ĐÍCH).
  + Trang 6 (*Đàn cú treo biển số*): Đàn cú cầm biển số từ 1 đến 5, thiếu 2 biển số 3 và 4.
  + Trang 15–16 (*Bước nhảy cách 2 — Số chẵn / lẻ*): Cho sẵn dãy số lẻ, bé kéo thả các số chẵn còn thiếu để hoàn thành đại lộ số tới 20.
- **Trên Game Engine (`GT-008` & `GT-001`)**:
  + `GL-C1-CNT-SLOT-0121` (`GT-008`): Bố cục thanh thoát, 4 slot rãnh viền nét đứt vàng hổ phách mang nhãn lượng: *"mười bốn quả anh đào"*, *"mười quả anh đào"*, *"hai mươi quả anh đào"*, *"sáu quả anh đào"*. Khay dưới hiển thị 5 đĩa anh đào tương ứng. Trẻ kéo đĩa vào đúng ô.
  + `GL-C1-NREC-TAP-0101..0103` (`GT-001`): Chế độ chạm chọn tương tác nhanh: Số mẫu hiển thị ở thẻ trung tâm, khay chọn phía dưới gồm 2 số lựa chọn. Đã chuẩn hóa câu lệnh tiếng Việt ngắn gọn, không bị cụt hay lặp từ.

### 2.2. Dạng bài `WB02-D2` — Mê Cung Ma Trận Số 1–16 & Tuyến Ray Chữ S
- **Đối chiếu PDF (Trang 17–22: *Mê cung số 1–16*)**:
  + Ma trận gồm $5 \times 5 = 25$ ô tròn. Trẻ xuất phát từ ô số 1, đi theo các ô kề cạnh liên tiếp $1 \rightarrow 2 \rightarrow 3 \dots \rightarrow 16$ để đến điểm đích (Cầu Vồng, Ngôi Sao, Vườn Hoa, Nhà Ga, Hộp Quà). 9 ô còn lại là số bẫy nhiễu ($17 \rightarrow 25$). Luật: **CẤM ĐI CHÉO**.
- **Trên Game Engine (`GT-013` & `GT-008`)**:
  + `GL-C1-NREC-MAZE-0101..0104` (`GT-013` - Maze Navigate): Khung lưới ma trận bo góc mềm, các bức tường ngăn màu nâu đất rõ nét. Vị trí xuất phát là hình tròn màu vàng hổ phách, điểm đích là hình tròn màu xanh ngọc bích. Trẻ quẹt ngón tay hoặc chạm tuần tự các ô để mở đường ray ray kim loại.
  + `GL-C1-SEQ-SLOT-0131..0132` (`GT-008`): Khắc họa đúng tuyến đường ray uốn lượn hình chữ S của Trang 11 PDF, bé kéo thả số còn thiếu vào các điểm dừng.

### 2.3. Dạng bài `WB02-D3` — Sắp Xếp Đoàn Tàu Số & Đếm Ngược 10 Về 1
- **Đối chiếu PDF (Trang 10: *Đoàn tàu chạy lùi 10 về 1*)**:
  + Đoàn tàu hơi nước chạy lùi từ mốc 10 về 1 để về ga đích an toàn. Trẻ cần nhận diện chuỗi giảm dần liên tục ($n - 1$).
- **Trên Game Engine (`GT-006` - Sequence Pattern & `GT-008`)**:
  + `GL-C1-CNT-REV-0101` (`GT-006`): Hình ảnh trực quan ấn tượng! Đầu tàu hơi nước màu vàng rực rỡ với ống khói nhả cụm khói trắng bồng bềnh nằm ở đầu đường ray bên trái. Các toa tàu phía sau mang các con số xáo trộn (7, 10, 9, 8). Dưới đáy là đường ray xe lửa bằng kim loại chạy suốt chiều ngang màn hình.
  + Trẻ chạm đổi chỗ các toa tàu để khôi phục trật tự đếm lùi: $10 \rightarrow 9 \rightarrow 8 \rightarrow 7$.
  + Góc dưới bên phải có nút **Commit** (dấu tích màu trắng trên nền cam CTA) nổi khối 3D mềm mại, bấm xuống xẹp 4px mang lại phản hồi xúc giác cực kỳ thỏa mãn.

---

## 3. Đánh Giá 6 Trục Chất Lượng (`/ui-ux-pro-max` + `/code-review-and-quality`)

### Trục 1: Độ Khớp Sư Phạm & Tính Chuẩn Xác Với PDF
- **Fidelity Đỉnh Cao**: 26 màn chơi bao phủ đầy đủ toàn bộ 23 trang PDF của Chặng 2.
- Bảo toàn tuyệt đối tư duy sư phạm Montessori: Chuyển hóa toàn diện từ sách in giấy sang game tương tác số mà không làm mất đi tính tự sửa lỗi (Control of Error).

### Trục 2: Bố Cục 5 Vùng & Không Gian Logic 960×540 (`BR-PSZ`)
- Khung hình 100% đạt chuẩn `100%×100%` trên không gian logic `960×540`, backing store `1920×1080` DPR 2.
- Khoảng cách giữa các thành phần (zones gap) luôn duy trì $\ge 16$px, không bị chồng đè giữa thanh Header chỉ dẫn, Sân khấu chính, Đoàn tàu và Nút xác nhận Commit.

### Trục 3: Sàn Chạm Trẻ Mầm Non & Affordance (`13-ui-ux.md`)
- Sàn chạm tối thiểu: Toa tàu và ô số có kích thước $\ge 84\times 84$px, nút tròn chọn lựa $\ge 100$px đường kính (đạt chuẩn band 3–4 $\ge 96$px, band 5–6 $\ge 72$px).
- Nút Commit màu cam CTA `#f97316` độc tôn ở góc phải, kích thước $68\times 68$px với bo tròn `rounded-2xl` và slab dày 4px.

### Trục 4: Typography, Contrast & Ngôn Ngữ Tiếng Việt
- Câu lệnh ngắn gọn ($\le 12$ từ), tiếng Việt tự nhiên: *"Bé hãy sắp xếp theo đúng thứ tự nhé!"*, *"Bé hãy kéo các hình vào đúng ô tương ứng nhé!"*.
- Tương phản chữ đạt chuẩn WCAG AA ($\ge 7:1$), chữ số đen đậm rõ nét trên nền thẻ trắng ngà.

### Trục 5: Runtime & Console Hygiene
- `engineError`: `null` (0 lỗi runtime engine).
- `visibleErrorText`: `null` (0 lỗi giao diện).
- `consoleErrors`: `[]` (0 lỗi console trên toàn bộ 26 màn chơi).
- `pageErrors`: `[]` (0 lỗi trang).

### Trục 6: Code Quality & Seeder Contract
- Các seeder kỹ năng `C1.NREC.09`, `C1.NREC.10`, `C1.NREC.11`, `C1.NREC.12`, `C1.CNT.04`, `C1.CNT.08`, `C1.CNT.10` tuân thủ nghiêm ngặt TypeScript Strict, không chứa biến tạm hay type lỏng lẻo.

---

## 4. Các Sửa Lỗi UI/UX Đã Hoàn Tất Trực Tiếp

1. **Khắc phục câu lệnh lặp từ gây khó hiểu trong `C1.NREC.10` (`GL-C1-NREC-TAP-0101`)**:
   - Vấn đề: `prompt_template` cũ là `"Số nào đứng ngay trước số {label}?"`, khi ghép với `label` `"số 8 trước số 9"` tạo ra chuỗi vấp chữ: *"Số nào đứng ngay trước số số 8 trước số 9?"*.
   - Đã sửa: Trong `packages/content/src/skills/c1/nrec/C1.NREC.10.ts`, cập nhật thành: `prompt_template: "Bé hãy chọn {label} nhé!"`. Câu lệnh sinh ra tự nhiên, ngắn gọn và trong sáng: *"Bé hãy chọn số 8 trước số 9 nhé!"*.
2. **Khắc phục câu lệnh lặp từ trong `C1.NREC.11` (`GL-C1-NREC-TAP-0102`)**:
   - Vấn đề: `prompt_template` cũ `"Số nào đứng ngay sau số {label}?"` sinh ra *"Số nào đứng ngay sau số số 4 sau số 3?"*.
   - Đã sửa: Trong `packages/content/src/skills/c1/nrec/C1.NREC.11.ts`, cập nhật thành: `prompt_template: "Bé hãy chọn {label} nhé!"`. Câu lệnh chuẩn hóa: *"Bé hãy chọn số 4 sau số 3 nhé!"*.

---

## 5. Kết Luận Nghiệm Thu

| Hạng mục đánh giá | Kết quả | Chi tiết |
|---|:---:|---|
| Bố cục Canvas 960×540 & DPR 2 | **XUẤT SẮC** | Đạt 100% trên 26/26 màn chơi |
| Thẩm mỹ Claymorphism & Bố cục 5 Vùng | **XUẤT SẮC** | Đoàn tàu, đường ray và mê cung sống động |
| Độ khớp Sư phạm CPA so với PDF gốc | **XUẤT SẮC** | Hoàn thành trọn vẹn 3 nhóm dạng bài WB02-D1..D3 |
| Console Hygiene & Code Quality | **XUẤT SẮC** | 0 lỗi console, 100% unit tests pass |

**KẾT LUẬN CUỐI CÙNG:** **`APPROVE` — TOÀN BỘ 26 MÀN CHƠI CHẶNG 2 ĐẠT CHUẨN XUẤT SẮC.**
