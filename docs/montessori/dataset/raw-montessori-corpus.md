# BỘ DỮ LIỆU THÔ (RAW DATASET) — 21 BÀI GIẢNG MONTESSORI & TƯ DUY TOÁN MẦM NON

> **Nguồn dữ liệu gốc:** Thư mục `/mindkid/docs/montessori/` gồm 21 tập tài liệu PDF bài tập mầm non (3–6 tuổi), chia thành 3 phần: Khởi đầu, Khám phá, Phát triển.
> **Mục đích tài liệu:** Tập hợp toàn bộ dữ liệu bài học thô (Raw Data), quy luật tự nhiên, danh mục assets (background, vật thể, thẻ bài), cấu trúc bài toán, đáp án đúng/sai, phương án gây nhiễu (distractors), gợi ý (scaffolding) và cơ chế sư phạm để phục vụ biên soạn Game Templates và Seeder Config.

---

# MỤC LỤC TỔNG QUAN

- [PHẦN 1: KHỞI ĐẦU (3–4 TUỔI) — NỀN TẢNG CẢM QUAN & SỐ ĐẾM](#phần-1-khởi-đầu-34-tuổi--nền-tảng-cảm-quan--số-đếm)
  - [Workbook 01: Nhận biết số (Phạm vi 0–10)](#workbook-01-nhận-biết-số-phạm-vi-010)
  - [Workbook 02: Thứ tự dãy số](#workbook-02-thứ-tự-dãy-số)
  - [Workbook 03: Thử tài tìm bóng đúng](#workbook-03-thử-tài-tìm-bóng-đúng)
  - [Workbook 04: Đếm nhanh chọn đúng (Subitizing)](#workbook-04-đếm-nhanh-chọn-đúng-subitizing)
  - [Workbook 05: Thử tài đếm nhanh - Điền đúng (Tập hợp con)](#workbook-05-thử-tài-đếm-nhanh---điền-đúng-tập-hợp-con)
  - [Workbook 06: So sánh số lượng (Nhiều hơn / Ít hơn / Bằng nhau)](#workbook-06-so-sánh-số-lượng-nhiều-hơn--ít-hơn--bằng-nhau)
  - [Workbook 07: Tách gộp số lượng (Number Bond 5–10)](#workbook-07-tách-gộp-số-lượng-number-bond-510)
- [PHẦN 2: KHÁM PHÁ (4–5 TUỔI) — PHÂN LOẠI, SUY LUẬN & ĐỊNH HƯỚNG](#phần-2-khám-phá-45-tuổi--phân-loại-suy-luận--định-hướng)
  - [Workbook 08: Thám tử số học - Tách gộp phạm vi 10](#workbook-08-thám-tử-số-học---tách-gộp-phạm-vi-10)
  - [Workbook 09: Bé vượt mê cung](#workbook-09-bé-vượt-mê-cung)
  - [Workbook 10: Tư duy màu sắc (Sắc độ & Phân loại màu)](#workbook-10-tư-duy-màu-sắc-sắc-độ--phân-loại-màu)
  - [Workbook 11: Thử tài điền số thông minh (Nhảy cóc & Ma trận số)](#workbook-11-thử-tài-điền-số-thông-minh-nhảy-cóc--ma-trận-số)
  - [Workbook 12: Phát triển tư duy qua bài toán thay thế sơ đẳng](#workbook-12-phát-triển-tư-duy-qua-bài-toán-thay-thế-sơ-đẳng)
  - [Workbook 13: Thám tử số học - Tách gộp phạm vi 20](#workbook-13-thám-tử-số-học---tách-gộp-phạm-vi-20)
  - [Workbook 14: Bé tìm số bí ẩn (Suy luận loại trừ qua manh mối)](#workbook-14-bé-tìm-số-bí-ẩn-suy-luận-loại-trừ-qua-manh-mối)
- [PHẦN 3: PHÁT TRIỂN (5–6 TUỔI & TIỀN TIỂU HỌC) — LOGIC PHỨC HỢP, HÌNH HỌC & ĐẠI SỐ HÌNH](#phần-3-phát-triển-56-tuổi--tiền-tiểu-học--logic-phức-hợp-hình-học--đại-số-hình)
  - [Workbook 15: Cùng bé tìm quy luật (Patterns đa tầng & Ma trận)](#workbook-15-cùng-bé-tìm-quy-luật-patterns-đa-tầng--ma-trận)
  - [Workbook 16: Tư duy cân bằng (Cân đòn bẩy trực quan)](#workbook-16-tư-duy-cân-bằng-cân-đòn-bẩy-trực-quan)
  - [Workbook 17: Thử thách Sudoku cùng bé (Sudoku mini 2×2, 3×3, 4×4)](#workbook-17-thử-thách-sudoku-cùng-bé-sudoku-mini-22-33-44)
  - [Workbook 18: Làm quen với đồng hồ (Giờ đúng, nửa giờ & Chuỗi thời gian)](#workbook-18-làm-quen-với-đồng-hồ-giờ-đúng-nửa-giờ--chuỗi-thời-gian)
  - [Workbook 19: Tư duy hình khối (Khối 3D, đếm khối lập phương & Phối cảnh)](#workbook-19-tư-duy-hình-khối-khối-3d-đếm-khối-lập-phương--phối-cảnh)
  - [Workbook 20: Phát triển tư duy qua bài toán thay thế nâng cao](#workbook-20-phát-triển-tư-duy-qua-bài-toán-thay-thế-nâng-cao)
  - [Workbook 21: Bài toán IQ cực hay (Raven Progressive Matrices & Suy luận tổng hợp)](#workbook-21-bài-toán-iq-cực-hay-raven-progressive-matrices--suy-luận-tổng-hợp)

---

# PHẦN 1: KHỞI ĐẦU (3–4 TUỔI) — NỀN TẢNG CẢM QUAN & SỐ ĐẾM

---

## Workbook 01: Nhận biết số (Phạm vi 0–10)
- **Tập tin nguồn:** `Phần 1 - khởi đầu/1 - Nhận biết số.pdf` (29 trang)
- **Mục tiêu giáo dục:** Nhận diện ký hiệu mặt số (0–10), liên kết ký hiệu số với số lượng thực tế (1-1 correspondence), tập tô nét số.
- **Phương pháp Montessori tương đương:** Thẻ số cát (Sandpaper Numbers), Hộp thoi số (Spindle Boxes), Thẻ số & Chấm tròn (Cards & Counters).

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Phòng học Montessori (kệ gỗ, thảm trải sàn sáng màu), Khu vườn nông trại ngập nắng.
- **Tài nguyên hình ảnh (Entities):**
  - Mặt số: Thẻ số gỗ / số vẽ cát lớn (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10).
  - Đối tượng đếm: Trái cây (🍎 Táo, 🍌 Chuối, 🍓 Dâu, 🍊 Cam), Động vật nhỏ (🦆 Vịt, 🐰 Thỏ, 🐱 Mèo, 🐶 Cún), Hạt tròn màu (Red Counters).
  - Vùng chứa: Khay gỗ, giỏ mây, rổ có gắn nhãn số.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Nhận biết ký hiệu số qua phát âm & hình dạng**
  - *Lời dẫn tự nhiên:* "Bé hãy chạm vào số 3 nhé!"
  - *Dữ liệu hiển thị:* Thẻ số `3` cùng 2 thẻ gây nhiễu `8`, `5`.
  - *Đáp án đúng:* Thẻ `3`.
  - *Distractors (gây nhiễu):* `8` (dễ nhầm cấu trúc cong), `5` (đảo chiều).
- **Dạng 2: Nối / Chọn số tương ứng với lượng**
  - *Lời dẫn tự nhiên:* "Có bao nhiêu chú vịt đang bơi? Bé hãy chọn số đúng nhé!"
  - *Dữ liệu hiển thị:* Cụm 4 chú vịt vàng dàn hàng ngang hoặc hình tam giác; 3 thẻ số lựa chọn `3`, `4`, `5`.
  - *Đáp án đúng:* `4`.
  - *Distractors:* `3` (đếm thiếu 1), `5` (đếm lặp 1).
- **Dạng 3: Kéo lượng vào rổ số**
  - *Lời dẫn tự nhiên:* "Bé hãy hái đúng 5 quả táo bỏ vào giỏ nhé!"
  - *Dữ liệu hiển thị:* Cây táo có 8 quả; 1 giỏ mây có số `5`.
  - *Tương tác:* Bé kéo thả từng quả táo vào giỏ. Mỗi quả rơi vào giỏ phát âm đếm: "Một... Hai... Ba... Bốn... Năm! Đủ rồi!"

### 3. Gợi ý sư phạm (Scaffolding)
- *L1 (Nudge):* Nhấp nháy viền thẻ số mục tiêu hoặc phát sáng nhẹ quả táo tiếp theo.
- *L2 (Guidance):* Bàn tay ảo chỉ vào từng quả táo đếm "1, 2, 3, 4, 5" với nhịp điệu chậm.
- *L3 (Demo):* Bàn tay ảo tự động kéo 1 quả táo vào giỏ làm mẫu.

---

## Workbook 02: Thứ tự dãy số
- **Tập tin nguồn:** `Phần 1 - khởi đầu/2- THỨ TỰ DÃY SỐ.pdf` (31 trang)
- **Mục tiêu giáo dục:** Thứ tự tự nhiên của dãy số (1–10), nhận biết số liền trước, số liền sau, điền số còn thiếu vào khoảng trống.
- **Phương pháp Montessori tương đương:** Thang số hạt (Short Bead Stair), Gậy số (Number Rods).

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Đường ray xe lửa trên thảo nguyên, Vết chân động vật trên cát, Cầu vồng 7 sắc.
- **Tài nguyên hình ảnh:**
  - Đoàn tàu hỏa có các toa tàu đánh số từ 1 đến 10.
  - Toa xe trống (toa có dấu chấm hỏi `?`).
  - Hàng cây số, con sâu bướm nhiều đốt mang số.
  - Thẻ số rời để kéo thả: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Điền số còn thiếu trong chuỗi số tiến (Dãy xuôi)**
  - *Bài tập mẫu 1:* Dãy `1` → `2` → `[ ? ]` → `4` → `5`.
    - *Đáp án đúng:* `3`.
    - *Distractors:* `2` (lặp số trước), `4` (nhầm số sau), `6` (nhảy cóc).
  - *Bài tập mẫu 2:* Dãy `6` → `[ ? ]` → `8` → `9` → `10`.
    - *Đáp án đúng:* `7`.
    - *Distractors:* `5` (đếm ngược), `8` (lặp số), `6`.
- **Dạng 2: Số liền trước và liền sau (Before & After)**
  - *Bài tập:* Toa xe giữa mang số `4`. Hai bên là `[ ? ]` và `[ ? ]`.
    - *Đáp án:* Ô trước = `3`, Ô sau = `5`.
    - *Khay lựa chọn:* Thẻ `2`, `3`, `5`, `6`.
- **Dạng 3: Sắp xếp lại đoàn tàu số bị xáo trộn**
  - *Bài tập:* 4 toa tàu bị đảo lộn thứ tự `[ 4 ] [ 2 ] [ 1 ] [ 3 ]`.
    - *Mục tiêu:* Kéo các toa về trật tự đúng `[ 1 ] → [ 2 ] → [ 3 ] → [ 4 ]`.

### 3. Gợi ý sư phạm (Scaffolding)
- *L1:* Đọc thành tiếng dãy số ngắt quãng: "Một, hai... [dừng lại chờ bé]".
- *L2:* Bàn tay ảo chỉ vào ô trống và phóng to thẻ số đúng trên khay lựa chọn.
- *L3:* Bàn tay ảo kéo số đúng vào ô khuyết mẫu.

---

## Workbook 03: Thử tài tìm bóng đúng
- **Tập tin nguồn:** `Phần 1 - khởi đầu/3- Thử tài tìm bóng đúng.pdf` (29 trang)
- **Mục tiêu giáo dục:** Khả năng tri giác hình dạng (Visual Discrimination), tách chi tiết khỏi bóng đặc (Silhouette Matching), nhận diện đặc trưng viền đối tượng.
- **Phương pháp Montessori tương đương:** Tủ hình học (Geometric Cabinet), Thẻ đối chiếu hình bóng.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Sân khấu múa rối bóng đêm trăng, Căn phòng chiếu bóng đèn ngủ ấm áp.
- **Tài nguyên hình ảnh:**
  - Cặp Đồ vật - Bóng:
    - 🐘 Voi (đặc trưng: vòi dài, tai to) ↔ Bóng voi đen.
    - 🦒 Hươu cao cổ (đặc trưng: cổ dài, sừng nhỏ) ↔ Bóng hươu.
    - 🚗 Xe ô tô (đặc trưng: bánh xe tròn, mui xe) ↔ Bóng ô tô.
    - ✈️ Máy bay (đặc trưng: cánh ngang, đuôi đứng) ↔ Bóng máy bay.
    - 🦋 Bướm (đặc trưng: cánh xòe đối xứng) ↔ Bóng bướm.
    - 🍎 Quả táo có cuống lá ↔ Bóng quả táo.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Chọn bóng đúng cho 1 vật mẫu (Single Target)**
  - *Bài tập:* Hình mẫu chú hươu cao cổ 🦒 đang đứng.
  - *Phương án lựa chọn:*
    - Bóng A: Bóng hươu cao cổ (ĐÚNG).
    - Bóng B: Bóng chú ngựa (Gây nhiễu: cũng 4 chân nhưng cổ ngắn).
    - Bóng C: Bóng chú voi (Gây nhiễu: thân to, có vòi).
    - Bóng D: Bóng hươu nhưng bị biến dạng tỷ lệ cổ cụt (Bẫy chi tiết).
- **Dạng 2: Ghép cặp 3 vật thể với 3 bóng tương ứng (Two-column match)**
  - *Cột trái:* 🐱 Mèo, 🐰 Thỏ tai dài, 🐢 Rùa mai tròn.
  - *Cột phải (xáo trộn):* Bóng rùa, Bóng mèo đuôi cong, Bóng thỏ hai tai vểnh.
  - *Tương tác:* Kéo nối hoặc chạm lần lượt từng cặp vật - bóng.

### 3. Gợi ý sư phạm (Scaffolding)
- *L1:* Nhấp nháy đường viền (contour outline) của vật mẫu trùng khít với bóng đúng.
- *L2:* Phủ bóng mờ của vật mẫu đè lên bóng thật để bé thấy sự tương đồng hình học.

---

## Workbook 04: Đếm nhanh chọn đúng (Subitizing)
- **Tập tin nguồn:** `Phần 1 - khởi đầu/4- Đếm nhanh chọn đúng.pdf` (30 trang)
- **Mục tiêu giáo dục:** Khả năng Subitizing (nhận biết số lượng 1–5 ngay lập tức mà không cần đếm từng vật), đếm nhóm hạt xúc xắc, đếm nhanh ngón tay giơ lên.
- **Phương pháp Montessori tương đương:** Thẻ chấm tròn xúc xắc (Subitizing Dot Cards), Thẻ bàn tay đếm ngón.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Bầu trời đêm đầy sao lấp lánh, Bàn chơi xúc xắc gỗ.
- **Tài nguyên hình ảnh:**
  - Thẻ chấm tròn cấu trúc chuẩn (Xúc xắc 1, 2, 3, 4, 5, 6).
  - Thẻ chấm tròn phân tán ngẫu nhiên (Random dots 1–5).
  - Bàn tay giơ ngón (1 ngón trỏ, 2 ngón chữ V, 3 ngón, 5 ngón cả bàn tay).
  - Thẻ số tròn nhiều màu để bé chọn: `1`, `2`, `3`, `4`, `5`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Flash Subitizing (Hiện chớp nhoáng 1.5s)**
  - *Lời dẫn:* "Bé nhìn thật nhanh xem có mấy ngôi sao nhé!"
  - *Hiển thị:* Màn hình hiện 3 ngôi sao theo hình tam giác trong 1.5 giây → Tự động biến mất vào mây.
  - *Lựa chọn:* 3 nút số `2`, `3`, `4`.
  - *Đáp án đúng:* `3`.
- **Dạng 2: Đếm nhanh thẻ chấm xúc xắc**
  - *Bài tập:* Mặt xúc xắc 4 chấm (4 góc đối xứng).
  - *Đáp án đúng:* `4`.
  - *Distractors:* `5` (nhầm có chấm ở giữa), `3` (nhầm đường chéo).
- **Dạng 3: Ghép bàn tay với số ngón tương ứng**
  - *Bài tập:* Hình ảnh bàn tay xòe 3 ngón.
  - *Đáp án đúng:* Thẻ số `3`.

---

## Workbook 05: Thử tài đếm nhanh - Điền đúng (Tập hợp con)
- **Tập tin nguồn:** `Phần 1 - khởi đầu/5 - Thử tài Đếm nhanh - điền đúng.pdf` (27 trang)
- **Mục tiêu giáo dục:** Phân loại và đếm các nhóm đối tượng khác nhau trong cùng một bức tranh phức hợp (Counting sub-collections), lập bảng thống kê mini trực quan.
- **Phương pháp Montessori tương đương:** Hoạt động đếm đồ vật môi trường sống, Khay phân loại 3 ngăn có số lượng.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Khu rừng nhiệt đới, Bãi biển mùa hè, Cửa hàng bánh kẹo ngọt ngào.
- **Tài nguyên hình ảnh:**
  - Bức tranh tổng hợp: 3 chú khỉ 🐒, 5 chú vẹt 🦜, 2 chú hổ 🐯 rải rác trong rừng.
  - Bảng thống kê bên dưới:
    - Ô `[ Ảnh Khỉ ] = [ ? ]`
    - Ô `[ Ảnh Vẹt ] = [ ? ]`
    - Ô `[ Ảnh Hổ ] = [ ? ]`
  - Bàn phím số hoặc thẻ số nổi: `1`, `2`, `3`, `4`, `5`, `6`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Cấu trúc bài tập mẫu:**
  - *Khung cảnh:* Bể cá đại dương có 4 cá hề cam 🐠, 2 sao biển đỏ ⭐, 3 sứa hồng 🪼.
  - *Nhiệm vụ 1:* Đếm cá hề. Bé chạm vào từng con cá hề trên màn hình (mỗi con chạm vào sáng lên kèm âm pop: "1, 2, 3, 4!"). Kéo số `4` vào ô cá hề.
  - *Nhiệm vụ 2:* Đếm sao biển. Chạm 2 sao biển → Kéo số `2` vào ô sao biển.
  - *Nhiệm vụ 3:* Đếm sứa. Chạm 3 sứa → Kéo số `3` vào ô sứa.
- **Quy tắc kiểm soát lỗi:**
  - Đối tượng đã đếm sẽ được đóng dấu sao nhỏ để tránh bé đếm trùng hoặc bỏ sót.

---

## Workbook 06: So sánh số lượng (Nhiều hơn / Ít hơn / Bằng nhau)
- **Tập tin nguồn:** `Phần 1 - khởi đầu/6 - So sánh số Lượng.pdf` (22 trang)
- **Mục tiêu giáo dục:** Khái niệm "Nhiều hơn", "Ít hơn", "Bằng nhau" qua so sánh trực quan và tương ứng 1-1, bước đầu làm quen dấu so sánh.
- **Phương pháp Montessori tương đương:** So sánh gậy số đỏ/xanh, Ghép cặp đối ứng hạt màu (One-to-one correspondence counters).

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Bàn ăn dã ngoại (Picnic table), Hai đĩa thức ăn cho hai bạn thú cưng.
- **Tài nguyên hình ảnh:**
  - Bên trái: Đĩa thỏ có 5 củ cà rốt 🥕.
  - Bên phải: Đĩa gấu có 3 củ cà rốt 🥕.
  - Nhân vật biểu cảm: Bạn thỏ vui mừng, Bạn gấu xoa bụng đói.
  - Thẻ biểu tượng: Nút chọn bên Trái / bên Phải; Thẻ dấu Cá sấu há miệng `>` `<` `=`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Chọn nhóm nhiều hơn / ít hơn trực quan**
  - *Lời dẫn:* "Đĩa nào có NHIỀU cà rốt hơn hả bé?"
  - *Dữ liệu:* Đĩa A (5 cà rốt), Đĩa B (2 cà rốt).
  - *Đáp án đúng:* Chạm vào Đĩa A.
  - *Phản hồi:* Bàn tay ảo nối từng củ cà rốt đĩa A sang đĩa B: "Đĩa A còn thừa 3 củ, nên đĩa A nhiều hơn!"
- **Dạng 2: Tìm hai nhóm BẰNG NHAU**
  - *Lời dẫn:* "Tìm hai đĩa có số kẹo BẰNG NHAU nhé!"
  - *Dữ liệu:* Đĩa 1 (3 kẹo), Đĩa 2 (4 kẹo), Đĩa 3 (3 kẹo).
  - *Đáp án đúng:* Chọn Đĩa 1 và Đĩa 3.
- **Dạng 3: Miệng cá sấu há to về bên nhiều hơn**
  - *Dữ liệu:* Cột trái (4 con cá), Cột phải (6 con cá).
  - *Đáp án:* Kéo biểu tượng miệng cá sấu há sang phải `<` vào giữa hai cột.

---

## Workbook 07: Tách gộp số lượng (Number Bond 5–10)
- **Tập tin nguồn:** `Phần 1 - khởi đầu/7 - Tách Gộp Số Lượng.pdf` (30 trang)
- **Mục tiêu giáo dục:** Khái niệm phân rã số (Number Composition / Number Bond) trong phạm vi 5–10, nền tảng cho phép cộng trừ không nhớ.
- **Phương pháp Montessori tương đương:** Rắn số cộng trừ (Addition Snake Game), Khung 10 ô (Ten-frame counters).

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Tổ chim trên cây có 2 nhánh, Bến xe bus với 2 tầng xe, Sơ đồ bóng bay chùm.
- **Tài nguyên hình ảnh:**
  - Sơ đồ Number Bond chuẩn: 1 vòng tròn tổng (Tổng thể / Whole) nối xuống 2 vòng tròn thành phần (Bộ phận / Parts).
  - Hạt tròn màu (Đỏ / Xanh), Quả táo đỏ, Chú chim nhỏ.
  - Thẻ số: `1` đến `10`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Tách một nhóm thành 2 phần theo màu sắc/loại**
  - *Bối cảnh:* Trên cành có 5 chú chim (3 chim xanh 🐦, 2 chim đỏ 🪶).
  - *Sơ đồ:* Vòng tròn tổng có số `5`. Hai nhánh con có `[ 3 ]` và `[ ? ]`.
  - *Đáp án đúng:* `2`.
  - *Distractors:* `1`, `3` (lặp lại), `4`.
- **Dạng 2: Gộp 2 nhóm thành một số tổng**
  - *Sơ đồ:* Nhánh trái có `2` hạt, Nhánh phải có `2` hạt. Vòng tròn đỉnh là `[ ? ]`.
  - *Đáp án đúng:* `4`.
  - *Distractors:* `3`, `5`, `2`.
- **Dạng 3: Tìm tất cả các cách tách số 5**
  - $5 = 1 + 4$
  - $5 = 2 + 3$
  - $5 = 3 + 2$
  - $5 = 4 + 1$
  - Bé kéo thả các cặp số tương ứng vào 4 hàng của ngôi nhà số 5.

---

# PHẦN 2: KHÁM PHÁ (4–5 TUỔI) — PHÂN LOẠI, SUY LUẬN & ĐỊNH HƯỚNG

---

## Workbook 08: Thám tử số học - Tách gộp phạm vi 10
- **Tập tin nguồn:** `Phần 2 - Khám phá/8- Thám tử số học - tách gộp Phạm vi 10.pdf` (29 trang)
- **Mục tiêu giáo dục:** Làm chủ hoàn toàn cấu trúc tách gộp của các số từ 6 đến 10, phát triển tư duy ẩn số (Missing addend: $a + ? = c$).
- **Phương pháp Montessori tương đương:** Bảng cộng có dải gỗ (Addition Strip Board), Hạt cườm màu Seguin.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Phòng thí nghiệm của Thám tử nhí (Kính lúp, dấu chân, bảng manh mối).
- **Tài nguyên hình ảnh:**
  - Ngôi nhà số (Số trên nóc nhà là số tổng, các tầng là các cặp số tách gộp).
  - Kính lúp thần kỳ soi vào ô số ẩn.
  - Các thẻ số từ `0` đến `10`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng bài tập điển hình:**
  - *Ngôi nhà số 10:*
    - Nóc nhà: Số `10`.
    - Tầng 1: `[ 9 ]` và `[ ? ]` → Đáp án: `1`.
    - Tầng 2: `[ 8 ]` và `[ ? ]` → Đáp án: `2`.
    - Tầng 3: `[ 7 ]` và `[ ? ]` → Đáp án: `3`.
    - Tầng 4: `[ 6 ]` và `[ ? ]` → Đáp án: `4`.
    - Tầng 5: `[ 5 ]` và `[ ? ]` → Đáp án: `5`.
- **Dạng bài tập trắc nghiệm suy luận:**
  - "Thám tử tìm hạt dẻ còn thiếu: Chú sóc có tổng cộng 8 hạt dẻ. Trong giỏ có 5 hạt. Hỏi trong hốc cây giấu mấy hạt?"
  - *Phép tính ngầm định:* $5 + ? = 8$.
  - *Đáp án đúng:* `3`.
  - *Distractors:* `2` (nhầm $5+2=7$), `4` (nhầm $5+4=9$), `5` (lặp số đã có).

---

## Workbook 09: Bé vượt mê cung
- **Tập tin nguồn:** `Phần 2 - Khám phá/9- Bé Vượt mê cung.pdf` (31 trang)
- **Mục tiêu giáo dục:** Khả năng định hướng không gian (Spatial Navigation), lập kế hoạch trước khi hành động (Executive Planning C6.PLN), phối hợp tay-mắt và kiềm chế hành vi đi vào ngõ cụt.
- **Phương pháp Montessori tương đương:** Mê cung ngón tay trên bảng gỗ, Bài tập vẽ đường nét không gian Kogumakai.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Khu rừng cổ tích, Hang động kẹo ngọt, Không gian vũ trụ giữa các vì sao.
- **Tài nguyên hình ảnh:**
  - Nhân vật di chuyển: 🐰 Chú thỏ trắng (đi tìm củ cà rốt), 🚀 Tàu vũ trụ (về Trái Đất), 🐝 Chú ong (về tổ hoa).
  - Bản đồ mê cung dạng lưới (Grid-based Maze 5×5 hoặc 7×7) với các bức tường đá, bụi cây, hố nước.
  - Vật phẩm thu thập trên đường: Ngôi sao vàng ⭐, Chìa khóa mở cổng 🗝️.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Vẽ đường liên tục từ Start đến Finish**
  - *Tương tác:* Bé dùng ngón tay kéo nét vẽ liên tục từ vạch Start đến Finish.
  - *Dữ liệu hiển thị:* Lưới mê cung 5×5 (mức dễ) hoặc 7×7 (mức khó), một lối ra đúng duy nhất.
  - *Đáp án đúng:* Nét vẽ nối Start tới Finish không chạm tường.
  - *Distractors:* Các ngõ cụt trong lưới.
- **Dạng 2: Lập chuỗi lệnh di chuyển bằng mũi tên**
  - *Tương tác:* Bé xếp chuỗi mũi tên `[ ⬆️ ] [ ⬆️ ] [ ➡️ ] [ ➡️ ] [ ⬇️ ]` để nhân vật tự động chạy theo lộ trình.
  - *Dữ liệu hiển thị:* Khay mũi tên rời và một ô chứa chuỗi lệnh.
  - *Đáp án đúng:* Chuỗi lệnh đưa nhân vật tới đích.
  - *Distractors:* Chuỗi thiếu một bước, chuỗi đảo hai bước liền nhau.
- **Dạng 3: Bắt buộc thu thập vật phẩm trên đường**
  - *Tương tác:* Như Dạng 1, nhưng lộ trình phải đi qua ô có 🗝️ Chìa khóa mới mở được cửa đích.
  - *Đáp án đúng:* Lộ trình qua ô chìa khóa rồi tới đích.
  - *Distractors:* Lộ trình ngắn hơn nhưng bỏ qua ô chìa khóa.
- **Ràng buộc kiểm tra lỗi:**
  - Nếu nét vẽ chạm vào tường đá hoặc đi vào ngõ cụt → Nét vẽ nhẹ nhàng lùi lại ngã ba gần nhất kèm tiếng sột soạt vui tai (không phạt).
  - Level nâng cao: Bắt buộc đi qua ô có 🗝️ Chìa khóa mới mở được cửa đích.

---

## Workbook 10: Tư duy màu sắc (Sắc độ & Phân loại màu)
- **Tập tin nguồn:** `Phần 2 - Khám phá/10 - Tư duy màu sắc.pdf` (22 trang)
- **Mục tiêu giáo dục:** Phân biệt sắc độ đậm - nhạt (Color Grading), phối màu cơ bản (Color Mixing: Đỏ + Vàng = Cam), phân loại đồ vật theo thuộc tính màu sắc.
- **Phương pháp Montessori tương đương:** Hộp màu số 3 Montessori (Color Tablets Box 3 - 63 thẻ màu chuyển sắc 7 cấp độ).

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Xưởng vẽ của họa sĩ nhí, Cầu vồng nghệ thuật.
- **Tài nguyên hình ảnh:**
  - Dải 5 thẻ màu chuyển sắc: Xanh lam cực nhạt → Nhạt → Vừa → Đậm → Cực đậm.
  - Ống nghiệm pha màu nước: Ống Đỏ, Ống Vàng, Ống Xanh dương.
  - Vật thể phân loại theo màu: Lọ hoa Đỏ, Vàng, Xanh và các bông hoa đa sắc.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Sắp xếp dải màu từ nhạt nhất đến đậm nhất (Seriation by gradient)**
  - *Dữ liệu:* 4 thẻ màu tím với 4 sắc độ bị xáo trộn.
  - *Nhiệm vụ:* Kéo xếp vào 4 khung theo thứ tự: `[ Nhạt nhất ] → [ ... ] → [ ... ] → [ Đậm nhất ]`.
  - *Đáp án đúng:* Trật tự tăng dần sắc độ màu.
- **Dạng 2: Phối màu sắc (Color Mixing)**
  - *Câu hỏi:* "Trộn giọt nước Đỏ và giọt nước Vàng sẽ tạo ra màu gì?"
  - *Lựa chọn:* 🟠 Màu Cam, 🟢 Màu Xanh lá, 🟣 Màu Tím.
  - *Đáp án đúng:* 🟠 Màu Cam.
- **Dạng 3: Phân nhóm đa màu sắc**
  - Kéo các vật thể vào 3 thùng sơn: Thùng Vàng, Thùng Đỏ, Thùng Xanh lá.

---

## Workbook 11: Thử tài điền số thông minh (Nhảy cóc & Ma trận số)
- **Tập tin nguồn:** `Phần 2 - Khám phá/11- Thử tài điền số thông minh.pdf` (17 trang)
- **Mục tiêu giáo dục:** Nhận diện quy luật số học, đếm nhảy cóc (Skip Counting by 2, by 5), điền số vào ma trận giao thoa hàng và cột.
- **Phương pháp Montessori tương đương:** Bảng 100 số (Hundred Board), Chuỗi hạt cườm đếm cách (Skip Counting Chains).

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Ao sen chú ếch nhảy lá sen, Bảng phi thuyền vũ trụ.
- **Tài nguyên hình ảnh:**
  - Hàng lá sen trên mặt nước mang số: `2`, `4`, `6`, `8`, `10`...
  - Chú ếch xanh nhảy từng bước 2 lá.
  - Ma trận số 2×2, 3×3 với một ô khuyết mang dấu `?`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Dãy số nhảy cách 2 (Skip counting by 2)**
  - *Dãy bài tập:* `2` → `4` → `6` → `[ ? ]` → `10`.
    - *Quy luật:* Mỗi bước cộng thêm 2 ($+2$).
    - *Đáp án đúng:* `8`.
    - *Distractors:* `7` (đếm tiến 1), `9`, `12`.
- **Dạng 2: Dãy số đếm lùi (Countdown)**
  - *Dãy bài tập:* `10` → `9` → `8` → `[ ? ]` → `6` → `5`.
    - *Đáp án đúng:* `7`.
    - *Distractors:* `8` (lặp lại), `6`, `9`.
- **Dạng 3: Ma trận số đơn giản (Cộng theo hàng/cột)**
  - Hàng trên: `1` + `2` = `3`.
  - Hàng dưới: `2` + `2` = `[ ? ]`.
  - *Đáp án đúng:* `4`.

---

## Workbook 12: Phát triển tư duy qua bài toán thay thế sơ đẳng
- **Tập tin nguồn:** `Phần 2 - Khám phá/12 - Phát triển tư duy qua bài toán thay thế.pdf` (25 trang)
- **Mục tiêu giáo dục:** Tư duy tiền đại số (Early Algebraic Thinking), quy tắc thay thế tương đương biểu tượng ($1 A = k B$), suy luận giá trị đại diện của hình vẽ.
- **Phương pháp Montessori tương đương:** Cân đĩa đại số Montessori, Trò chơi đổi tiền xu/vật phẩm giá trị tương đương.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Hội chợ trao đổi đồ vật của muôn thú, Cửa hàng trái cây kỳ diệu.
- **Tài nguyên hình ảnh:**
  - Bảng quy đổi mẫu:
    - 🍎 1 Quả táo = 🍌 🍌 2 Quả chuối.
    - 🐻 1 Chú gấu = 🐰 🐰 2 Chú thỏ.
    - 🚗 1 Ô tô = 🚲 🚲 🚲 3 Xe đạp.
  - Khay kết quả cần tìm và giỏ đựng vật phẩm.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Bài toán mẫu 1 (Quy đổi thuận):**
  - *Cho biết:* 1 Quả dưa hấu 🍉 = 2 Quả dứa 🍍.
  - *Hỏi:* 2 Quả dưa hấu 🍉 🍉 = Mấy quả dứa 🍍?
  - *Tư duy giải quyết:* $2 \times 2 = 4$ quả dứa.
  - *Đáp án đúng:* 4 Quả dứa (🍍 🍍 🍍 🍍).
  - *Distractors:* 2 Quả (quên nhân), 3 Quả, 5 Quả.
- **Bài toán mẫu 2 (Thay thế tính tổng):**
  - *Cho biết:* 🐱 = 2, 🐶 = 3.
  - *Hỏi:* 🐱 + 🐶 = ?
  - *Đáp án đúng:* `5`.
  - *Distractors:* `4`, `6`, `23`.
- **Bài toán mẫu 3 (Tìm giá trị của 1 biểu tượng):**
  - *Cho biết:* ⭐ + ⭐ = 6.
  - *Hỏi:* 1 Ngôi sao ⭐ = ?
  - *Đáp án đúng:* `3` (vì $3 + 3 = 6$).
  - *Distractors:* `2` ($2+2=4$), `4` ($4+4=8$), `6`.

---

## Workbook 13: Thám tử số học - Tách gộp phạm vi 20
- **Tập tin nguồn:** `Phần 2 - Khám phá/13- Thám tử số học - tách gộp Phạm vi 20.pdf` (26 trang)
- **Mục tiêu giáo dục:** Cấu trúc số có 2 chữ số (Số hàng chục và số đơn vị: $10 + n = 1n$), tách gộp trong phạm vi 11–20.
- **Phương pháp Montessori tương đương:** Bảng chữ số tuổi Teen (Seguin Teen Boards: ghép thẻ 10 với thẻ 1..9), Bó 10 que tính / Khung Ten-Frame đôi.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Trạm vũ trụ không gian (Nạp năng lượng bình 10 pin + pin lẻ).
- **Tài nguyên hình ảnh:**
  - Khung Ten-frame kép (1 khung 10 đầy + 1 khung lẻ).
  - Bó que tính 10 que cột ruy băng đỏ + các que lẻ.
  - Các số từ `11` đến `20`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Cấu trúc số 10 + n**
  - *Bài tập:* Hình ảnh 1 hộp đầy 10 chiếc bánh donut 🍩 + 4 chiếc donut rời bên ngoài.
  - *Câu hỏi:* "Có tất cả bao nhiêu chiếc bánh donut?"
  - *Tư duy:* $10 + 4 = 14$.
  - *Đáp án đúng:* `14`.
  - *Distractors:* `13`, `15`, `41` (nghịch đảo số).
- **Dạng 2: Tách gộp số tuổi Teen (11–19)**
  - *Sơ đồ:* Số đỉnh = `16`. Nhánh trái = `10`. Nhánh phải = `[ ? ]`.
  - *Đáp án đúng:* `6`.
  - *Distractors:* `5`, `7`, `16`.
- **Dạng 3: Hoàn thành phương trình tách gộp 20**
  - $20 = 15 + [ ? ] \rightarrow 5$.
  - $20 = 18 + [ ? ] \rightarrow 2$.

---

## Workbook 14: Bé tìm số bí ẩn (Suy luận loại trừ qua manh mối)
- **Tập tin nguồn:** `Phần 2 - Khám phá/14 - Bé Tìm số bí ẩn.pdf` (19 trang)
- **Mục tiêu giáo dục:** Rèn luyện khả năng suy luận logic loại trừ (Deductive Elimination C3.DED), giữ nhiều điều kiện trong trí nhớ làm việc (Working Memory C6.WM).
- **Phương pháp Montessori tương đương:** Trò chơi Thám tử tìm đồ vật ẩn giấu theo tiêu chí loại trừ.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Bảng số bí mật trong mật thất thám tử, Kính lúp và đèn soi dấu vết.
- **Tài nguyên hình ảnh:**
  - Bảng số 1–10 hoặc 1–20 xếp thành lưới 2×5 hoặc 4×5.
  - Thẻ manh mối (Clue cards) có giọng đọc và icon minh họa:
    - 🚫 Biểu tượng gạch chéo đỏ nhẹ.
    - ⚖️ Biểu tượng Lớn hơn / Nhỏ hơn.
    - 🔢 Biểu tượng Chẵn / Lẻ (hoặc có bạn cặp / không có bạn cặp).

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Bài toán mẫu 1 (Bảng số 1–10):**
  - *Bảng số hiển thị:* `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`.
  - *Manh mối 1:* "Tôi là số LỚN HƠN 4." $\rightarrow$ Bé gạch bỏ các số $1, 2, 3, 4$ (còn lại $5, 6, 7, 8, 9, 10$).
  - *Manh mối 2:* "Tôi là số NHỎ HƠN 8." $\rightarrow$ Bé gạch bỏ $8, 9, 10$ (còn lại $5, 6, 7$).
  - *Manh mối 3:* "Tôi là số đứng liền trước số 7." $\rightarrow$ Xác định số duy nhất.
  - *Đáp án đúng:* `6`.
- **Bài toán mẫu 2 (Manh mối hình dạng):**
  - *Manh mối 1:* "Tôi có nét tròn cong." (Loại 1, 4, 7).
  - *Manh mối 2:* "Tôi lớn hơn 5 nhưng nhỏ hơn 7."
  - *Đáp án đúng:* `6`.

---

# PHẦN 3: PHÁT TRIỂN (5–6 TUỔI & TIỀN TIỂU HỌC) — LOGIC PHỨC HỢP, HÌNH HỌC & ĐẠI SỐ HÌNH

---

## Workbook 15: Cùng bé tìm quy luật (Patterns đa tầng & Ma trận)
- **Tập tin nguồn:** `Phần 3 - Phát triển/15 - Cùng bé tìm quy luật.pdf` (21 trang)
- **Mục tiêu giáo dục:** Khái niệm quy luật lặp lại (Repeating Patterns: AB, ABB, AAB, ABC, AABB), quy luật tăng trưởng (Growing Patterns $+1, +2$), ma trận quy luật 2 chiều 2×2.
- **Phương pháp Montessori tương đương:** Thẻ xếp chuỗi quy luật hạt cườm, Ma trận khối hình Dienes.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Băng chuyền đóng gói quà tặng, Chuỗi vòng ngọc trai công chúa.
- **Tài nguyên hình ảnh:**
  - Chuỗi hạt màu / Trái cây / Con vật / Hình học:
    - Hình tròn đỏ, 🔷 Hình thoi xanh, ⭐ Ngôi sao vàng, 🔺 Tam giác cam.
    - 🍎 Táo, 🍌 Chuối, 🍇 Nho.
  - Khay chứa các phần tử lựa chọn để kéo thả vào ô trống `[ ? ]`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Quy luật lặp AB, AAB, ABB, ABC**
  - *Quy luật AB:* Tròn đỏ 🔷 Tròn đỏ 🔷 Tròn đỏ `[ ? ]` $\rightarrow$ Đáp án: 🔷.
  - *Quy luật ABB:* 🍎 🍌 🍌 🍎 🍌 `[ ? ]` $\rightarrow$ Đáp án: 🍌.
  - *Quy luật AAB:* 🚗 🚗 ✈️ 🚗 🚗 `[ ? ]` $\rightarrow$ Đáp án: ✈️.
  - *Quy luật ABC:* 🐶 🐱 🐰 🐶 🐱 `[ ? ]` $\rightarrow$ Đáp án: 🐰.
  - *Quy luật AABB:* Đỏ Đỏ Vàng Vàng Đỏ Đỏ `[ ? ]` Vàng $\rightarrow$ Đáp án: Vàng.
- **Dạng 2: Quy luật tăng trưởng số lượng (Growing Pattern)**
  - Cụm 1: 1 bông hoa 🌸.
  - Cụm 2: 2 bông hoa 🌸 🌸.
  - Cụm 3: 3 bông hoa 🌸 🌸 🌸.
  - Cụm 4: `[ ? ]` $\rightarrow$ Đáp án: Cụm 4 bông hoa (🌸 🌸 🌸 🌸).
- **Dạng 3: Ma trận quy luật 2×2 (Matrix Pattern)**
  - Hàng 1: [ Tròn đỏ ] [ Tròn xanh 🔵 ]
  - Hàng 2: [ Vuông đỏ 🟥 ] [ `[ ? ]` ]
  - *Tư duy:* Giao giữa hàng Vuông và cột Xanh.
  - *Đáp án đúng:* [ Vuông xanh 🟦 ].
  - *Distractors:* Vuông đỏ 🟥, Tròn xanh 🔵, Tam giác xanh 🔷.

---

## Workbook 16: Tư duy cân bằng (Cân đòn bẩy trực quan)
- **Tập tin nguồn:** `Phần 3 - Phát triển/16- Tư Duy cân bằng.pdf` (26 trang)
- **Mục tiêu giáo dục:** Khái niệm thăng bằng (Equilibrium / Balance Scale), so sánh trọng lượng gián tiếp và tính chất bắc cầu ($A > B$ và $B > C \Rightarrow A > C$), giải phương trình thăng bằng hình ảnh.
- **Phương pháp Montessori tương đương:** Cân đòn bẩy hai đĩa thật với các quả cân gỗ / khối kim loại.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Sân chơi bập bênh công viên, Phòng thí nghiệm cân đo khoa học.
- **Tài nguyên hình ảnh:**
  - Cân đĩa 2 bên (Balance scale) có trục xoay vật lý (nghiêng trái, nghiêng phải, cân bằng ngang).
  - Quả cân có đánh số (`1kg`, `2kg`, `3kg`, `5kg`).
  - Động vật / Trái cây đặt lên cân: 🐘 Voi, 🐻 Gấu, 🦊 Cáo, 🐰 Thỏ, 🍉 Dưa hấu, 🍎 Táo.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Đọc trạng thái cân nặng - nhẹ**
  - *Hình ảnh:* Đĩa bên trái đựng Quả dưa hấu 🍉 chúc xuống dưới, Đĩa bên phải đựng Quả táo 🍎 nâng lên cao.
  - *Câu hỏi:* "Quả nào NẶNG HƠN?"
  - *Đáp án đúng:* Quả dưa hấu 🍉 (bên trũng xuống là bên nặng hơn).
- **Dạng 2: Bắc cầu so sánh 3 vật thể (Transitive relation)**
  - *Cân 1:* 1 Con Chó 🐶 nặng bằng 2 Con Mèo 🐱 🐱.
  - *Cân 2:* 1 Con Mèo 🐱 nặng bằng 2 Con Chuột 🐭 🐭.
  - *Hỏi:* 1 Con Chó 🐶 nặng bằng mấy Con Chuột 🐭?
  - *Tư duy:* $1 \text{ Chó} = 2 \text{ Mèo} = 2 \times 2 = 4 \text{ Chuột}$.
  - *Đáp án đúng:* 4 Con Chuột 🐭 🐭 🐭 🐭.
- **Dạng 3: Đặt quả cân để tạo thăng bằng (Make it balance)**
  - *Đĩa trái:* Khối số `8`.
  - *Đĩa phải:* Khối số `5` và ô trống `[ ? ]`.
  - *Nhiệm vụ:* Kéo quả cân đúng vào đĩa phải để kim cân chỉ thẳng đứng ở giữa.
  - *Đáp án đúng:* Quả cân `3` (vì $5 + 3 = 8$).
  - *Distractors:* `2`, `4`, `5`.

---

## Workbook 17: Thử thách Sudoku cùng bé (Sudoku mini 2×2, 3×3, 4×4)
- **Tập tin nguồn:** `Phần 3 - Phát triển/17 - Thử thách Sudoku cùng bé.pdf` (24 trang)
- **Mục tiêu giáo dục:** Tư duy logic ràng buộc không gian 2 chiều (2D Constraint Satisfaction), quy tắc không trùng lặp theo hàng, cột và khối nhỏ.
- **Phương pháp Montessori tương đương:** Bảng ma trận hình học không lặp lại (Latin Square Puzzle).

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Bàn cờ gỗ thông minh Nhật Bản, Khung tranh ô cửa sổ sắc màu.
- **Tài nguyên hình ảnh:**
  - Bảng lưới Sudoku: Lưới 2×2 (dành cho bé 4–5t), Lưới 3×3 (5–6t), Lưới 4×4 (6t & tiền tiểu học).
  - Bộ 4 biểu tượng chủ đề:
    - Chủ đề Hoa quả: 🍎 Táo, 🍌 Chuối, 🍇 Nho, 🍓 Dâu.
    - Chủ đề Hình học: Tròn đỏ, 🟦 Vuông xanh, Tam giác vàng, 🟢 Ngôi sao xanh.
    - Chủ đề Chữ số: `1`, `2`, `3`, `4`.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Quy tắc luật chơi (Natural Language):**
  - "Mỗi hàng ngang, mỗi hàng dọc và mỗi ô vuông nhỏ chỉ được có đúng 1 hình của mỗi loại, không được trùng nhau nhé!"
- **Dạng 1: Lưới 2×2 một ô khuyết (mức vào bài)**
  - *Dữ liệu hiển thị:* Lưới 2×2 với hai biểu tượng, ba ô đã điền, một ô mang `[ ? ]`.
  - *Đáp án đúng:* Biểu tượng chưa xuất hiện trong hàng và cột của ô khuyết.
  - *Distractors:* Biểu tượng trùng hàng, biểu tượng trùng cột.
- **Dạng 2: Lưới 3×3 một ô khuyết**
  - Hàng 1: 🍎 | 🍌 | 🍇
  - Hàng 2: 🍇 | 🍎 | 🍌
  - Hàng 3: 🍌 | `[ ? ]` | 🍎
  - *Tư duy:*
    - Xét hàng 3: Đã có 🍌 và 🍎 $\rightarrow$ Thiếu 🍇.
    - Xét cột 2: Đã có 🍌 và 🍎 $\rightarrow$ Khẳng định thiếu 🍇.
  - *Đáp án đúng:* 🍇 Quả nho.
  - *Distractors:* 🍎 (trùng hàng hoặc cột), 🍌 (trùng hàng hoặc cột), 🍓 (ngoài tập hợp).
- **Dạng 3: Lưới 4×4 hai ô khuyết**
  - *Tương tác:* Bé kéo thả lần lượt 2 biểu tượng còn thiếu vào 2 ô trống để hoàn thành bức tranh.
  - *Đáp án đúng:* Hai biểu tượng thoả cả ràng buộc hàng, cột và khối nhỏ.
  - *Distractors:* Cặp thoả hàng nhưng vi phạm cột; cặp đảo vị trí hai ô.

---

## Workbook 18: Làm quen với đồng hồ (Giờ đúng, nửa giờ & Chuỗi thời gian)
- **Tập tin nguồn:** `Phần 3 - Phát triển/18 - Làm quen với đồng hồ.pdf` (26 trang)
- **Mục tiêu giáo dục:** Đọc đồng hồ kim (giờ đúng: 1:00, 2:00..., nửa giờ: 1:30, 2:30...), phân biệt kim ngắn (kim giờ) và kim dài (kim phút), liên kết mốc thời gian với hoạt động sinh hoạt trong ngày.
- **Phương pháp Montessori tương đương:** Đồng hồ gỗ tương tác Montessori có bánh răng đồng bộ 2 kim.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Tháp đồng hồ Big Ben cổ tích, Phòng ngủ ấm cúng của bé.
- **Tài nguyên hình ảnh:**
  - Mặt đồng hồ tròn có 12 số rõ ràng, kim ngắn màu đỏ (Kim giờ), kim dài màu xanh lam (Kim phút).
  - Thẻ đồng hồ điện tử: `07:00`, `12:00`, `19:30`...
  - Thẻ tranh sinh hoạt: Bé thức dậy đánh răng (7h sáng), Bé ăn trưa ở trường (11h30 trưa), Bé đi ngủ (9h tối).

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Đọc giờ đúng (O'clock)**
  - *Hình ảnh:* Kim ngắn chỉ số `3`, Kim dài chỉ thẳng số `12`.
  - *Câu hỏi:* "Bây giờ là mấy giờ hả bé?"
  - *Lựa chọn:* `3:00`, `12:00`, `3:30`.
  - *Đáp án đúng:* `3:00` (3 giờ đúng).
- **Dạng 2: Xoay kim đồng hồ đến giờ yêu cầu (Interactive Clock Setting)**
  - *Lời dẫn:* "Bé hãy quay đồng hồ đến 8 giờ sáng để cùng đi học nhé!"
  - *Tương tác:* Bé dùng ngón tay kéo xoay kim ngắn/dài trên màn hình cảm ứng đến khi kim ngắn chỉ số 8 và kim dài chỉ số 12.
- **Dạng 3: Ghép tranh sinh hoạt với mốc giờ đúng**
  - Nối tranh "Bé ăn cơm trưa" ↔ Thẻ giờ `11:30`.
  - Nối tranh "Bé thức dậy thấy mặt trời" ↔ Thẻ giờ `06:30`.

---

## Workbook 19: Tư duy hình khối (Khối 3D, đếm khối lập phương & Phối cảnh)
- **Tập tin nguồn:** `Phần 3 - Phát triển/19- Tư Duy Hình Khối.pdf` (18 trang)
- **Mục tiêu giáo dục:** Nhận diện và phân biệt các khối hình không gian 3D (Khối lập phương, Khối hộp chữ nhật, Khối trụ, Khối cầu, Khối nón), đếm số lượng khối lập phương trong hình xếp phức hợp (gồm cả khối nhìn thấy và khối bị che khuất).
- **Phương pháp Montessori tương đương:** Khối hình học 3D (Geometric Solids), Tháp hồng (Pink Tower), Khối nhị thức / Tam thức (Binomial / Trinomial Cubes).

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Thành phố kiến trúc kỳ quan, Công trường xây dựng lego của bé.
- **Tài nguyên hình ảnh:**
  - Các khối 3D cơ bản render Isometric:
    - 🧊 Khối lập phương (Cube).
    - 🧱 Khối hộp chữ nhật (Rectangular Prism).
    - 🥫 Khối trụ tròn (Cylinder).
    - ⚽ Khối cầu tròn (Sphere).
    - 🍦 Khối nón (Cone).
  - Mô hình tháp xếp bằng các khối lập phương nhỏ $1 \times 1 \times 1$.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Dạng 1: Đếm số khối lập phương trong hình ghép (3D Cube Counting)**
  - *Mô hình bài tập:* Một khối bậc thang gồm:
    - Cột 1: 1 khối.
    - Cột 2: 2 khối chồng lên nhau.
    - Cột 3: 3 khối chồng lên nhau.
  - *Câu hỏi:* "Có tất cả bao nhiêu khối vuông nhỏ để xếp thành hình này?"
  - *Tư duy:* $1 + 2 + 3 = 6$ khối.
  - *Đáp án đúng:* `6`.
  - *Distractors:* `5` (quên đếm khối ẩn ở chân cột 3), `7`, `3`.
- **Dạng 2: Phối cảnh từ trên xuống (Top View Projection)**
  - *Hình ảnh:* Mô hình 3D chữ L bằng 3 khối lập phương.
  - *Câu hỏi:* "Nếu bé nhìn từ trên đỉnh nhìn xuống, bé sẽ thấy hình gì?"
  - *Lựa chọn:* Hình chữ L phẳng 2D, Hình thẳng 1 cột 3 ô, Hình vuông 2×2.
  - *Đáp án đúng:* Hình chữ L phẳng 2D.
- **Dạng 3: Ghép vật thực tế với khối 3D tương ứng**
  - Quả bóng đá ⚽ ↔ Khối cầu.
  - Lon nước ngọt 🥫 ↔ Khối trụ.
  - Hộp quà sinh nhật 🎁 ↔ Khối lập phương.
  - Chiếc mũ sinh nhật 🥳 ↔ Khối nón.

---

## Workbook 20: Phát triển tư duy qua bài toán thay thế nâng cao
- **Tập tin nguồn:** `Phần 3 - Phát triển/20 - Phát triển tư duy qua bài toán thay thế.pdf` (27 trang)
- **Mục tiêu giáo dục:** Hệ phương trình biểu tượng 2–3 ẩn số dạng hình ảnh trực quan (Visual Simultaneous Equations), kết hợp các phép tính cộng, trừ nhiều bước.
- **Phương pháp Montessori tương đương:** Đại số trực quan nâng cao Singapore Math CPA / Kogumakai.

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Bảng giải mã mật mã của điệp viên nhí.
- **Tài nguyên hình ảnh:**
  - Biểu tượng nhân vật / hoa quả: 🍎 Táo, 🍌 Chuối, 🥥 Dừa, 🦊 Cáo, 🐰 Thỏ, 🐻 Gấu.
  - Bảng hệ phương trình hiển thị rõ ràng từng dòng.

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Hệ phương trình mẫu 1 (2 bước suy luận):**
  - *Dòng 1:* 🍎 + 🍎 = 10 $\rightarrow$ Bé suy ra: 1 Quả táo 🍎 = `5`.
  - *Dòng 2:* 🍎 + 🍌 = 8 $\rightarrow$ Thay 🍎 = 5 vào: $5 + 🍌 = 8 \rightarrow$ 1 Quả chuối 🍌 = `3`.
  - *Dòng 3 (Câu hỏi):* 🍌 = ?
  - *Đáp án đúng:* `3`.
  - *Distractors:* `5`, `8`, `2`.
- **Hệ phương trình mẫu 2 (3 bước có tính tổng cuối):**
  - *Dòng 1:* 🌸 + 🌸 + 🌸 = 9 $\rightarrow$ 1 Hoa 🌸 = `3`.
  - *Dòng 2:* 🌸 + 🍀 = 7 $\rightarrow 3 + 🍀 = 7 \rightarrow$ 1 Cỏ 🍀 = `4`.
  - *Dòng 3 (Câu hỏi tính tổng):* 🌸 + 🍀 = ?
  - *Đáp án đúng:* `7`.
- **Bẫy chi tiết nâng cao (Quan sát số lượng chi tiết):**
  - Nải 4 quả chuối $= 4 \rightarrow$ 1 quả chuối $= 1$. Ở dòng cuối chỉ xuất hiện nải 3 quả chuối. Rèn luyện tư duy quan sát cực kỳ sắc bén C4.VIS.

---

## Workbook 21: Bài toán IQ cực hay (Raven Progressive Matrices & Suy luận tổng hợp)
- **Tập tin nguồn:** `Phần 3 - Phát triển/21 - Bài toán IQ cực hay.pdf` (31 trang)
- **Mục tiêu giáo dục:** Đỉnh cao tư duy trừu tượng mầm non: Ma trận tiến tiến Raven 3×3, quy luật xoay hình 90°/180°, quy luật gập giấy mở hình, tìm kẻ lạc loài (Odd-one-out) đa tiêu chí.
- **Phương pháp Montessori / Stanford-Binet tương đương:** Bài test IQ mầm non quốc tế Raven's Coloured Progressive Matrices (CPM).

### 1. Bối cảnh & Visual Assets
- **Background đề xuất:** Viện nghiên cứu vũ trụ thông minh, Bảo tàng ma trận huyền bí.
- **Tài nguyên hình ảnh:**
  - Ma trận 3×3 (9 ô với 8 ô đã có hình theo quy luật 2 chiều ngang-dọc, ô thứ 9 mang dấu chấm hỏi `?`).
  - Hình vẽ gấp giấy: Giấy gấp đôi cắt 1 lỗ tam giác $\rightarrow$ Mở ra thành hình gì?
  - 6 hình lựa chọn bên dưới (1 hình đúng và 5 hình bẫy xoay/lật/thiếu nét).

### 2. Mô tả bài toán & Dữ liệu chi tiết
- **Bài toán mẫu 1: Ma trận biến đổi hình dạng theo hàng (Shape Morphing)**
  - Hàng 1: [ Tròn đặc ] $\rightarrow$ [ ⭕ Tròn rỗng ] $\rightarrow$ [ 🔘 Tròn có chấm tâm ]
  - Hàng 2: [ ⬛ Vuông đặc ] $\rightarrow$ [ ⬜ Vuông rỗng ] $\rightarrow$ [ 🔲 Vuông có chấm tâm ]
  - Hàng 3: [ 🔺 Tam giác đặc ] $\rightarrow$ [ 🛆 Tam giác rỗng ] $\rightarrow$ `[ ? ]`
  - *Tư duy:* Quy luật cột 3 là "Hình cùng loại nhưng có chấm ở tâm".
  - *Đáp án đúng:* [ Tam giác có chấm tâm ].
  - *Distractors:* Tam giác rỗng, Tròn có chấm tâm, Vuông có chấm tâm, Tam giác có 2 chấm.
- **Bài toán mẫu 2: Gấp giấy cắt hình (Spatial Folding & Unfolding)**
  - *Dữ liệu:* Tờ giấy vuông gấp đôi từ trái sang phải $\rightarrow$ Đục 1 lỗ tròn ở mép gấp $\rightarrow$ Mở tờ giấy ra.
  - *Đáp án đúng:* Tờ giấy có 2 lỗ tròn đối xứng qua trục giữa.
  - *Distractors:* Tờ giấy có 1 lỗ tròn ở góc, Tờ giấy có 4 lỗ tròn, Tờ giấy có lỗ tam giác.
- **Bài toán mẫu 3: Tìm hình khác biệt (Odd One Out - Trục xoay)**
  - *Dữ liệu:* 4 chú cá bơi cùng chiều sang phải (dù xoay nghiêng các góc 0°, 45°, 90°), 1 chú cá bị lật gương bơi sang trái.
  - *Đáp án đúng:* Chú cá bơi sang trái.

---

# TỔNG KẾT BẢN ĐỒ ÁNH XẠ SEEDER & TEMPLATE ENGINE

| STT | Tập PDF Bài giảng | Competency & Strand chính | Template Engine đề xuất | Loại cơ chế Game | Phù hợp độ tuổi |
|---|---|---|---|---|---|
| **01** | `1 - Nhận biết số` | `C1.NREC.01..05` | `GT-001` / `GT-003` | Tap-select / Drag to basket | 3–4 tuổi |
| **02** | `2- THỨ TỰ DÃY SỐ` | `C1.NREC.09..12` | `GT-006` / `GT-008` | Drag sequence / Fill slot | 3–4 tuổi |
| **03** | `3- Thử tài tìm bóng đúng` | `C4.VIS.02` / `C1.OTO.03` | `GT-001` / `GT-005` | Silhouette Tap / Pair match | 3–4 tuổi |
| **04** | `4- Đếm nhanh chọn đúng` | `C1.CNT.11` (Subitizing) | `GT-009` (Flash) | Flash Recall Tap | 3–4 tuổi |
| **05** | `5 - Thử tài Đếm nhanh điền đúng` | `C1.CNT.01..03` | `GT-002` / `GT-008` | Multi-count sub-collections | 3–4 tuổi |
| **06** | `6 - So sánh số Lượng` | `C1.CMP.04..05` | `GT-001` / `GT-003` | Tap compare / Drag comparator | 3–4 tuổi |
| **07** | `7 - Tách Gộp Số Lượng` | `C1.NCOMP.01..04` | `GT-010` (Number Bond) | Tree branch placement | 3–4 tuổi |
| **08** | `8- Tách gộp PV 10` | `C1.NCOMP.05..09` | `GT-010` (Number Bond) | Number Bond Tree & Ten-frame | 4–5 tuổi |
| **09** | `9- Bé Vượt mê cung` | `C2.MAZ.01..02` / `C6.PLN.01` | `GT-011` (Maze Route) | Path drawing / Tile navigate | 4–5 tuổi |
| **10** | `10 - Tư duy màu sắc` | `C4.SEN.01` / `C3.CLS.01` | `GT-004` / `GT-006` | Gradient seriation / Sort groups | 4–5 tuổi |
| **11** | `11- Điền số thông minh` | `C1.CNT.05` / `C3.RULE.02` | `GT-008` (Drag-to-slot) | Skip count sequence fill | 4–5 tuổi |
| **12** | `12 - Bài toán thay thế` | `C1.PROB.06` / `C3.INF.01` | `GT-013` (Substitution) | Symbolic value replacement | 4–5 tuổi |
| **13** | `13- Tách gộp PV 20` | `C1.NCOMP.10..12` | `GT-010` (Number Bond) | Double Ten-frame split | 4–5 tuổi |
| **14** | `14 - Bé Tìm số bí ẩn` | `C3.DED.01..02` / `C6.WM.03` | `GT-014` (Clue Deduction) | Grid elimination tap | 4–5 tuổi |
| **15** | `15 - Cùng bé tìm quy luật` | `C1.PAT.01..05` / `C3.RULE.01` | `GT-008` / `GT-012` | Pattern slot fill / 2×2 Matrix | 5–6 tuổi |
| **16** | `16- Tư Duy cân bằng` | `C1.MEAS.07` / `C3.DED.02` | `GT-015` (Balance Scale) | Physical balance torque placement | 5–6 tuổi |
| **17** | `17 - Sudoku cùng bé` | `C3.MTX.01..02` | `GT-016` (Sudoku Mini) | 2D Constraint matrix fill | 5–6 tuổi |
| **18** | `18 - Làm quen với đồng hồ` | `C1.MEAS.13` / `C1.MEAS.10` | `GT-017` (Interactive Clock)| Clock hands rotation & match | 5–6 tuổi |
| **19** | `19- Tư Duy Hình Khối` | `C2.GEO.06..08` / `C2.PER.03` | `GT-018` (3D Block Stack) | Isometric counting & perspective | 5–6 tuổi |
| **20** | `20 - Thay thế nâng cao` | `C1.PROB.06` / `C3.DED.03` | `GT-013` (Adv Substitution) | 2-3 step equation solving | 5–6 tuổi |
| **21** | `21 - Bài toán IQ cực hay` | `C3.MTX.03` / `C2.ROT.04` | `GT-012` (Raven 3×3) | 3×3 Progressive Matrix Choice | 5–6 tuổi |

---
*Tài liệu dữ liệu thô này sẵn sàng làm đầu vào trực tiếp cho việc cấu hình seeder bài học, định nghĩa Zod Content Contracts và dựng các khung Game Templates.*
