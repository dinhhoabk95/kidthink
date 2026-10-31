---
spec: MONTESSORI-CHANG-17-SPEC
title: "Chặng 17: Lâu Đài Sudoku Bí Ẩn — Ma Trận Sudoku 4x4 Số, Chữ Cái & Biểu Tượng Hình Học"
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-17
workbook_ref: WB17
gem_reward: "Viên Ngọc Ma Trận (Mystery Matrix Gem)"
owns:
  - Phân tích sư phạm và giải mã toàn diện 24 trang PDF Chặng 17 (Lâu Đài Sudoku Bí Ẩn, WB17)
  - Ánh xạ các nhóm hoạt động (WB17-D1..D3) vào các game engine hiện tại GT-015, GT-008, GT-011, GT-001, GT-000
  - TUYỆT ĐỐI KHÔNG TẠO MỚI GT-038+, hủy bỏ và thay thế hoàn toàn dự thảo GT-054 cũ
  - Khắc phục lỗ hổng 0 Montessori level của WB17 (WB17-D1, WB17-D2, WB17-D3) trong packages/content
  - Thiết kế SkillDataset (items, relations, axes, ladder, phrasing) lấy cảm hứng từ thế giới lâu đài Sudoku số, chữ, hình trong PDF 2026
  - Thiết kế 14 SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101) cho C3.MTX.01, C3.MTX.02, C3.MTX.03
  - Kế hoạch phổ biến dữ liệu vào seeder packages/content/src/skills/c3/mtx/
  - Tuân thủ nghiêm ngặt BR-MCM-06 (không chứa từ khóa thương mại IQ/Raven/trí tuệ trong title và instruction)
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 17: Lâu Đài Sudoku Bí Ẩn — Ma Trận Sudoku 4x4 Số, Chữ Cái & Biểu Tượng Hình Học

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này xác lập đặc tả kỹ thuật và kiến trúc nội dung sư phạm nhằm chuyển thể trọn vẹn dữ liệu từ giáo trình PDF **"Chặng 17: Lâu Đài Sudoku Bí Ẩn — Thử Thách Tư Duy Với Số, Chữ Và Hình"** (`docs/montessori/extracted/chang-17/analysis.json`, nguồn: *WB17*, 24 trang, thuộc bộ giáo trình *Gấu Logic & Thỏ Quan Sát - Chuyến Tàu Toán Học*, Nhà xuất bản Dân Trí / Montessori VN) vào nền tảng **TiniMath v2**.

### 1.1 Bối Cảnh Cốt Truyện & Nhiệm Vụ Học Tập (Narrative Quest)
1. **Bối cảnh cốt truyện**: Chuyến Tàu Toán Học đưa Gấu Logic và Thỏ Quan Sát dừng chân trước **Lâu Đài Sudoku Bí Ẩn** — một tòa lâu đài nguy nga mang phong cách cổ tích tím mộng mơ với các tháp nhọn và những cánh cổng ma trận bằng đá. Để bước qua từng căn phòng và thắp sáng **Viên Ngọc Ma Trận** (Mystery Matrix Gem) trên bệ đá hoàng gia tại đỉnh tháp, bé phải giải mã các câu đố ma trận Sudoku $4 \times 4$ với 3 hình thái biểu diễn tăng tiến: Chữ số, Ký tự chữ cái tiếng Anh và Biểu tượng hình học trừu tượng.
2. **Nhiệm vụ học tập (Learning Quest)**:
   - **Làm chủ 3 ràng buộc không gian đồng thời (Multi-constraint Matrix Reasoning)**: Trong mỗi lưới ma trận $4 \times 4$, mỗi hàng ngang, mỗi cột dọc và mỗi khối con $2 \times 2$ đều phải chứa đầy đủ 4 phần tử phân biệt mà không bị trùng lặp.
   - **Tư duy suy luận loại trừ logic (Elimination Logic / Single Candidate Heuristic)**: Quét mắt tìm kiếm các hàng, cột hoặc khối con $2 \times 2$ đã có sẵn 3 phần tử để điền ngay phần tử còn thiếu duy nhất (Naked Single); phân tích giao điểm giữa hàng và cột để loại bỏ các ứng viên bị trùng (Cross-referencing & Intersection strategy).
   - **Tiến trình chuyển dịch biểu diễn CPA linh hoạt (Cognitive Flexibility)**:
     - *Khởi động Sudoku số 1–4* (Trang 2–4): Mật độ gợi ý dày (6–8 số cho trước/bảng) giúp trẻ hình thành phản xạ quét lưới và nhận diện luật chơi cơ bản.
     - *Sudoku chữ cái từ vựng tiếng Anh* (Trang 5–8): Thay số bằng 4 bộ chữ cái thân thuộc ghép thành từ vựng có nghĩa (`LION`, `BEAR`, `FISH`, `BOAT`), giúp trẻ hiểu bản chất Sudoku là quan hệ vị trí trong tập hợp 4 phần tử độc lập giá trị độ lớn số học, đồng thời tích hợp liên môn Toán - Ngôn ngữ (CLIL).
     - *Thử thách Sudoku số tăng tiến* (Trang 9–13): Chuỗi 30 bảng ma trận số đánh số liên tục 1–30 với mật độ gợi ý giảm dần (chỉ còn 4–5 số), đòi hỏi suy luận loại trừ đa bước và rèn luyện sự kiên nhẫn.
     - *Thử thách Sudoku biểu tượng hình học trừu tượng* (Trang 14–23): 60 bảng ma trận sử dụng 4 hình học cơ bản (Hình tròn ◯, Hình vuông □, Hình tam giác △, Dấu chéo ✕), giải phóng trẻ khỏi gánh nặng xử lý số học để kích hoạt trực giác không gian và bán cầu não phải.
     - *Đại lễ mở cổng & Trao thưởng* (Trang 24): Tổng kết 4 năng lực tư duy (Quan sát, Tập trung, Suy luận, Kiên nhẫn) và trao Viên Ngọc Ma Trận.

### 1.2 Nguyên Tắc Bất Biến Về Công Nghệ & Phạm Vi
1. **Tuyệt Đối Không Tạo Game Engine Mới (`GT-038+`)**:
   - Toàn bộ cơ chế Sudoku của Chặng 17 được tích hợp 100% vào các game engine hiện hữu:
     - `GT-015` (`sudoku-grid` / `sudoku-mini`): Lưới ma trận tương tác giải đố Sudoku, hỗ trợ chạm chọn ô rồi chọn số/chữ/hình từ thanh công cụ bên dưới; tự động highlight hàng, cột và khối con khi chọn ô để scaffolding trực quan.
     - `GT-008` (`drag-to-slot`): Kéo thả các thẻ số 1–4, khối chữ cái in hoa hoặc khối hình khối ◯, □, △, ✕ từ khay công cụ vào các ô khuyết trên lưới; hỗ trợ nam châm snap tự hút và fallback tap-tap cho trẻ mầm non.
     - `GT-011` (`matrix-pick`): Ma trận tương tác chọn nhanh hình/số khuyết duy nhất tại giao điểm hàng và cột từ bảng 3–4 phương án gợi ý.
     - `GT-001` (`tap-select`): Trắc nghiệm chạm chọn 1 đáp án khuyết duy nhất cho hàng hoặc cột đã có sẵn 3 phần tử.
     - `GT-000` (`concept-intro` & `celebration-summary`): Hoạt cảnh giới thiệu Cánh Cổng Lâu Đài Sudoku (Trang 1) và Màn đại lễ thắp sáng Viên Ngọc Ma Trận (Trang 24).
   - **Hủy bỏ hoàn toàn dự thảo `GT-054` cũ**: Dự thảo `GT-054` trong các ghi chép trước đây bị **hủy bỏ hoàn toàn**. Việc tạo thêm `GT-054` vi phạm nghiêm ngặt giới hạn kiến trúc engine (`GT-000`..`GT-037`).
2. **Khắc Phục Lỗ Hổng 0 Montessori Level Của `WB17` Trong `packages/content`**:
   - Hiện tại, `WB17` (`WB17-D1`, `WB17-D2`, `WB17-D3`) đang có **0 level Montessori** trong database seeder.
   - Tài liệu này mở khóa nạp 14 level Montessori chất lượng cao vào strand `C3.MTX` (`C3.MTX.01`, `C3.MTX.02`, `C3.MTX.03`), bù đắp khoảng trống sư phạm cho Competency C3 trong hạn ngạch cho phép mà không làm phá vỡ cân bằng hệ thống.
3. **Tuân Thủ Tuyệt Đối Quy Tắc Doanh Nghiệp & Sư Phạm**:
   - `BR-MCM-06`: Tuyệt đối không chứa từ khóa thương mại, bài kiểm tra tâm lý hoặc tuyên bố đo lường chỉ số trí tuệ (`raven`, `iq`, `trí tuệ`, `chỉ số thông minh`, `wisc`). Trong PDF gốc có dùng cụm từ "Viên Ngọc Trí Tuệ", spec này chuẩn hóa thành **"Viên Ngọc Ma Trận"** trong toàn bộ title, instruction, dialogue và gameplay.
   - `BR-MGL-02`: Mọi mã level Montessori thuộc khối dành riêng từ `0101` trở lên: `GL-<COMP>-<STRAND>-<MECH>-01xx`.
   - `BR-MGL-03` & `BR-MGL-04`: Mỗi dạng bài có ít nhất 2 level khác độ khó, tăng lũy tiến một chiều (cô lập thuộc tính theo `BR-MCM-13`).
   - `BR-MGL-12`: Cấp bậc truy cập (`access_tier`) đồng bộ chặt chẽ với độ khó (`difficulty`: 1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`).
   - `BR-MCM-14` & `BR-MCM-15`: Giữ trọn vẹn kiểm soát lỗi tự thân (Control of Error) và trình tự cụ thể đến trừu tượng (CPA).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò hệ thống | Vai trò sư phạm & Thể hiện trong Chặng 17 |
|---|---|---|
| **Bé (Kid Player)** | Người chơi trung tâm (5–6 tuổi) | Nhập vai nhà thám hiểm nhí cùng Gấu Logic và Thỏ Quan Sát mở từng cánh cửa ma trận trong Lâu Đài Sudoku, suy luận điền các số 1–4, ghép chữ cái LION/BEAR/FISH/BOAT và xếp các hình ◯, □, △, ✕ để đoạt Viên Ngọc Ma Trận. |
| **Gấu Logic (`gau_logic`)** | Nhân vật dẫn dắt tư duy trừu tượng | Đại diện cho tư duy trật tự ma trận, quy tắc không lặp và suy luận loại trừ. Ngoại hình: Gấu nâu mặc áo măng tô thám tử, đeo kính tròn thông thái, tay cầm sổ tay quy luật. Lời thoại tiêu biểu: *"Mỗi hàng, mỗi cột và mỗi vùng đều phải có đủ 1, 2, 3, 4 nhé!", "Lần này mình dùng chữ cái thay cho số nhé!", "Tên BEAR nghe giống bạn gấu nhỉ!", "Những bảng này ít gợi ý hơn đấy!", "Sudoku hình nhìn vui mắt nhưng cũng cần suy luận kỹ!", "Đây là những thử thách cuối cùng của Lâu đài Sudoku!"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Nhân vật kích hoạt trực giác giác quan | Đại diện cho quan sát chi tiết, quét lưới thị giác và động viên kiên trì. Ngoại hình: Thỏ trắng đeo túi chéo vàng, tay cầm kính lúp. Lời thoại tiêu biểu: *"Bé quan sát thật kỹ rồi điền vào các ô trống nhé!", "Bé hãy điền đủ L - I - O - N vào mỗi bảng nhé!", "Bé nhớ kiểm tra cả hàng, cột và vùng nhé!", "Mỗi hàng, mỗi cột, mỗi vùng phải đủ 4 hình khác nhau!", "Bé nhìn xem trong mỗi ô 2x2 còn thiếu hình nào nhé!", "Mình cùng nhận viên ngọc ma trận và bước sang chặng mới nhé!"*. |
| **Phụ huynh / Giáo viên** | Hỗ trợ ngoài màn hình | Hướng dẫn trẻ làm quen với các tấm thẻ bìa số 1–4 hoặc 4 nắp chai khác màu xếp trên lưới ô vuông kẻ trên giấy theo triết lý Montessori. |
| **Content Seeder Engine** | Hệ thống nạp tự động | Chuyển hóa các `SkillLevelPlan[]` thành `ContentSeed` cho DB, xác thực qua `montessori-gate.ts`. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-17/analysis.json (24 trang, WB17)
   │
   ├──> docs/montessori/dataset/activity-types-table.md
   │       └── Cập nhật WB17-D1, WB17-D2, WB17-D3 (Khẳng định dùng GT-015, GT-008, GT-011, GT-001; loại bỏ GT-054)
   │
   ├──> docs/specs/05-content/montessori-corpus-mapping.md
   │       └── Đồng bộ hàng Workbook 17 (C3.MTX) và ghi nhận nạp 14 level Montessori cho C3.MTX
   │
   └──> packages/content/src/skills/c3/mtx/
           ├── C3.MTX.01.ts (Sudoku Biểu tượng hình học 4x4 ◯, □, △, ✕ -> GT-015, GT-008, GT-011: 4 levels)
           ├── C3.MTX.02.ts (Sudoku Chữ số 1–4 cơ bản & nâng cao 1-30 -> GT-015, GT-001, GT-008, GT-011: 6 levels)
           └── C3.MTX.03.ts (Sudoku Ký tự chữ cái tiếng Anh LION, BEAR, FISH, BOAT -> GT-015, GT-008, GT-001: 4 levels)
```

---

## 4. Phân Tích Chi Tiết 5 Nhóm Hoạt Động & Ánh Xạ Game Engine Hiện Hữu

Toàn bộ 24 trang tài liệu PDF Chặng 17 được cấu trúc thành 5 nhóm hoạt động mạch lạc:

### 4.1 `WB17-D1`: Sudoku Số 1–4 Khởi Động Cơ Bản (Trang 2–4, 18 Bảng)
- **Tên bài học**: *Sudoku Số 1–4 Khởi Động* (Trang 1, 2, 3 của sách).
- **Vị trí PDF**: Trang 2 đến Trang 4; 6 bảng mỗi trang $\times 3$ trang = 18 bảng ma trận.
- **Mục tiêu sư phạm**:
  - Trẻ tiếp nhận 3 quy tắc bất biến đồng thời: Không lặp số trên hàng ngang (Row constraint), Không lặp số trên cột dọc (Column constraint), và Không lặp số trong vùng con $2 \times 2$ (Box constraint).
  - Mật độ gợi ý dày đặc (6–8 số cho sẵn trên lưới 16 ô), nhiều hàng/cột đã có sẵn 3 số, trẻ chỉ cần tìm số thứ tư khuyết thiếu (Single Candidate).
  - Tự động hóa kỹ năng quét lưới (Visual scanning automation): hình thành phản xạ tìm hàng/cột/vùng có ít ô trống nhất để điền trước.
- **Cơ chế tương tác số hóa (GT-015, GT-001, GT-008)**:
  - `GT-015` (`sudoku-grid`): Lưới 4x4 chia 4 khối $2 \times 2$ bằng đường viền đậm. Trẻ chạm vào ô trống, hàng và cột tương ứng sẽ sáng nhẹ màu vàng nhạt giúp trẻ dễ dàng nhìn ra số còn thiếu; thanh bàn phím tròn dưới màn hình hiển thị 4 số [1, 2, 3, 4] để chọn điền.
  - `GT-001` (`tap-select`): Trắc nghiệm chọn số còn thiếu duy nhất trong hàng/cột đã có 3 số (ví dụ: hàng có [4, 2, 3, ?], chọn 1 trong 3 đáp án: 1 / 3 / 4).
  - `GT-008` (`drag-to-slot`): Kéo thả các thẻ số 1, 2, 3, 4 vào các ô khuyết của vùng con $2 \times 2$.
- **Kỹ năng liên kết**: `C3.MTX.02`, `C3.LOG.01`, `C1.NREC.01`.

---

### 4.2 `WB17-D2`: Sudoku Ký Tự Chữ Cái Từ Vựng Tiếng Anh (Trang 5–8, 16 Bảng)
- **Tên bài học**: *Sudoku Chữ LION, BEAR, FISH, BOAT* (Trang 4, 5, 6, 7 của sách).
- **Vị trí PDF**: Trang 5 đến Trang 8; 4 bảng mỗi trang $\times 4$ trang = 16 bảng ma trận.
- **Mục tiêu sư phạm**:
  - Chuyển dịch nhận thức linh hoạt (Cognitive Flexibility): Thay thế các con số bằng 4 chữ cái tiếng Anh tạo thành từ vựng chủ đề (`L-I-O-N` 🦁, `B-E-A-R` 🐻, `F-I-S-H` 🐟, `B-O-A-T` ⛵).
  - Trẻ nhận ra bản chất cốt lõi của Sudoku là quan hệ loại trừ logic giữa các phần tử trong tập hợp 4 phần tử, không phụ thuộc vào giá trị độ lớn số học.
  - Tích hợp học từ vựng tiếng Anh và ngữ âm phonics (CLIL).
- **Cơ chế tương tác số hóa (GT-015, GT-008, GT-001)**:
  - `GT-015` (`sudoku-grid` letter-mode): Mỗi lần điền đúng một chữ cái, âm thanh phát âm phonics của chữ cái đó vang lên (`/l/`, `/aɪ/`, `/oʊ/`, `/n/`), khi hoàn thành cả bảng sẽ phát âm cả từ *"LION!"* kèm tiếng gầm sư tử vui nhộn.
  - `GT-008` (`drag-to-slot`): Kéo thả các khối chữ cái in hoa nhiều màu vào các ô trống trong lưới.
  - `GT-001` (`tap-select`): Chạm chọn chữ cái còn thiếu để hoàn thiện hàng chữ cái.
- **Kỹ năng liên kết**: `C3.MTX.03`, `C3.LOG.01`.

---

### 4.3 `WB17-D3`: Thử Thách Sudoku Số 1–4 Tăng Tiến Độ Khó (Trang 9–13, 30 Bảng)
- **Tên bài học**: *Thử Thách Sudoku Số 1–30* (Trang 8, 9, 10, 11, 12 của sách).
- **Vị trí PDF**: Trang 9 đến Trang 13; 6 bảng mỗi trang $\times 5$ trang = 30 bảng thử thách đánh số từ 1 đến 30.
- **Mục tiêu sư phạm**:
  - Tăng tiến độ khó có kiểm soát: Số lượng gợi ý giảm dần từ 6 số xuống còn 4–5 số cho trước.
  - Rèn luyện chiến thuật suy luận loại trừ đa bước (Multi-step elimination): Đối chiếu chéo (Cross-referencing) giữa hàng và cột, kết hợp chiến thuật ưu tiên vùng con $2 \times 2$ (Subgrid-first Strategy) để thu hẹp phạm vi tìm kiếm.
  - Rèn luyện tính kiên nhẫn và khả năng tập trung chú ý kéo dài (Sustained Attention).
- **Cơ chế tương tác số hóa (GT-015, GT-011)**:
  - `GT-015` (`sudoku-grid` challenge ladder): Mỗi bảng hoàn thành sẽ thắp sáng một ngôi sao vàng trên thanh tiến độ thử thách (Level 1/30 đến 30/30).
  - `GT-011` (`matrix-pick`): Đối chiếu hàng và cột để chọn số đúng điền vào ô giao thoa quan trọng.
- **Kỹ năng liên kết**: `C3.MTX.02`, `C3.LOG.01`, `C3.SPA.02`.

---

### 4.4 `WB17-D4` (Mở Rộng Chuyên Sâu): Thử Thách Sudoku Biểu Tượng Hình Học Trừu Tượng (Trang 14–23, 60 Bảng)
- **Tên bài học**: *Thử Thách Sudoku Hình 1–60* (Trang 13 đến 22 của sách).
- **Vị trí PDF**: Trang 14 đến Trang 23; 6 bảng mỗi trang $\times 10$ trang = 60 bảng thử thách hình học đánh số từ 1 đến 60.
- **Mục tiêu sư phạm**:
  - Chuyển giao năng lực trừu tượng hóa sang biểu tượng thị giác: Sử dụng 4 hình học cơ bản: Hình tròn (◯), Hình vuông (□), Hình tam giác (△) và Dấu chéo (✕).
  - Giải phóng trẻ khỏi áp lực đếm số học, kích hoạt tối đa tư duy không gian trực quan (Visual-spatial reasoning) của bán cầu não phải.
  - Độ khó leo thang đỉnh cao: Các bảng 55–60 chỉ còn 3–4 gợi ý, đòi hỏi áp dụng chiến lược giao thoa (Intersection strategy) để xác định vị trí của hình.
  - Xây dựng tính tự chủ và khả năng tự sửa lỗi (Self-correction / Error control) theo triết lý Montessori.
- **Cơ chế tương tác số hóa (GT-015, GT-008, GT-011)**:
  - `GT-015` (`sudoku-grid` symbol-mode): Khay công cụ dưới màn hình hiển thị 4 nút hình khối nổi claymorphism nhiều màu sắc: ◯ đỏ, □ xanh lá, △ vàng, ✕ tím. Chạm hoặc kéo thả vào ô lưới.
  - `GT-008` (`drag-to-slot`): Kéo thả các khối hình học vào các ô trống.
  - `GT-011` (`matrix-pick`): Chạm chọn hình dạng còn thiếu cho ô ma trận.
- **Kỹ năng liên kết**: `C3.MTX.01`, `C3.LOG.01`, `C3.SPA.02`.

---

### 4.5 `WB17-D5`: Màn Đại Lễ Mở Cổng Lâu Đài & Trao Viên Ngọc Ma Trận (Trang 24)
- **Tên bài học**: *Tổng Kết Chặng 17 — Chinh Phục Lâu Đài Sudoku Bí Ẩn* (Trang 23 của sách).
- **Vị trí PDF**: Trang 24.
- **Mục tiêu sư phạm**:
  - Tổng kết và hệ thống hóa 3 phương thức Sudoku mà trẻ đã làm chủ (Số - Chữ - Hình).
  - Vinh danh 4 năng lực tư duy cốt lõi theo chuẩn giáo dục sớm Montessori:
    1. *Quan sát*: Nhìn nhận bao quát hàng, cột và vùng con $2 \times 2$.
    2. *Tập trung*: Duy trì chú ý liên tục không phân tâm.
    3. *Suy luận*: Dùng logic loại trừ để tìm nghiệm duy nhất.
    4. *Kiên nhẫn*: Không bỏ cuộc trước các bảng câu đố khó.
  - Trao Huy hiệu Hoàn Thành Chặng 17 và hoạt động xúc giác thắp sáng Viên Ngọc Ma Trận.
- **Cơ chế tương tác số hóa (GT-000)**:
  - `GT-000` (`concept-intro` & `celebration-summary`): Cánh cổng Lâu Đài Sudoku mở toang với hiệu ứng ánh sáng hoàng kim rực rỡ, pháo hoa ăn mừng, Gấu Logic và Thỏ Quan Sát trao Huy hiệu Thám Tử Ma Trận và thắp sáng Viên Ngọc Ma Trận trên bản đồ hành trình.

---

## 5. Thiết Kế SkillDataset Mở Rộng Cho Database Seeder

### 5.1 Kho Ngữ Liệu `C3_MTX_01_DATASET` (Biểu Tượng Hình Học Trừu Tượng ◯, □, △, ✕)
```typescript
export const C3_MTX_01_CASTLE_ITEMS = [
  {
    id: "geo_circle_blue",
    label: "hình tròn xanh",
    image: { kind: "emoji", ref: "🔵" },
    category: { type: "symbol", shape: "circle", color: "blue" },
    contrast_group: "geometric_symbols",
    value: 1,
    ordering: 1,
  },
  {
    id: "geo_square_red",
    label: "hình vuông đỏ",
    image: { kind: "emoji", ref: "🟥" },
    category: { type: "symbol", shape: "square", color: "red" },
    contrast_group: "geometric_symbols",
    value: 2,
    ordering: 2,
  },
  {
    id: "geo_triangle_yellow",
    label: "hình tam giác vàng",
    image: { kind: "emoji", ref: "🔺" },
    category: { type: "symbol", shape: "triangle", color: "yellow" },
    contrast_group: "geometric_symbols",
    value: 3,
    ordering: 3,
  },
  {
    id: "geo_cross_purple",
    label: "dấu chéo tím",
    image: { kind: "emoji", ref: "✖️" },
    category: { type: "symbol", shape: "cross", color: "purple" },
    contrast_group: "geometric_symbols",
    value: 4,
    ordering: 4,
  },
  {
    id: "castle_block_cube",
    label: "khối đá lâu đài",
    image: { kind: "emoji", ref: "🧱" },
    category: { type: "castle_part", role: "wall" },
    contrast_group: "castle_props",
    value: 5,
    ordering: 5,
  },
  {
    id: "mystery_matrix_gem",
    label: "viên ngọc ma trận",
    image: { kind: "emoji", ref: "💎" },
    category: { type: "reward", role: "stage_gem" },
    contrast_group: "rewards",
    value: 100,
    ordering: 6,
  },
];
```

### 5.2 Kho Ngữ Liệu `C3_MTX_02_DATASET` (Chữ Số 1–4 & Thám Tử Ma Trận Số)
```typescript
export const C3_MTX_02_CASTLE_ITEMS = [
  {
    id: "digit_one_gold",
    label: "chữ số 1",
    image: { kind: "emoji", ref: "1️⃣" },
    category: { type: "digit", value: 1, color: "gold" },
    contrast_group: "digits_1_to_4",
    value: 1,
    ordering: 1,
  },
  {
    id: "digit_two_emerald",
    label: "chữ số 2",
    image: { kind: "emoji", ref: "2️⃣" },
    category: { type: "digit", value: 2, color: "emerald" },
    contrast_group: "digits_1_to_4",
    value: 2,
    ordering: 2,
  },
  {
    id: "digit_three_orange",
    label: "chữ số 3",
    image: { kind: "emoji", ref: "3️⃣" },
    category: { type: "digit", value: 3, color: "orange" },
    contrast_group: "digits_1_to_4",
    value: 3,
    ordering: 3,
  },
  {
    id: "digit_four_purple",
    label: "chữ số 4",
    image: { kind: "emoji", ref: "4️⃣" },
    category: { type: "digit", value: 4, color: "purple" },
    contrast_group: "digits_1_to_4",
    value: 4,
    ordering: 4,
  },
  {
    id: "magnifier_observer",
    label: "kính lúp quan sát",
    image: { kind: "emoji", ref: "🔍" },
    category: { type: "tool", role: "scaffolding" },
    contrast_group: "tools",
    value: 5,
    ordering: 5,
  },
  {
    id: "castle_main_gate",
    label: "cánh cổng ma trận",
    image: { kind: "emoji", ref: "🏰" },
    category: { type: "scenery", role: "gate" },
    contrast_group: "castle_props",
    value: 6,
    ordering: 6,
  },
];
```

### 5.3 Kho Ngữ Liệu `C3_MTX_03_DATASET` (Chữ Cái Tiếng Anh LION, BEAR, FISH, BOAT)
```typescript
export const C3_MTX_03_CASTLE_ITEMS = [
  // Bộ từ LION 🦁
  { id: "letter_L", label: "chữ L", image: { kind: "emoji", ref: "🇱" }, category: { type: "letter", word: "LION" }, contrast_group: "word_lion", value: 1, ordering: 1 },
  { id: "letter_I", label: "chữ I", image: { kind: "emoji", ref: "🇮" }, category: { type: "letter", word: "LION" }, contrast_group: "word_lion", value: 2, ordering: 2 },
  { id: "letter_O", label: "chữ O", image: { kind: "emoji", ref: "🇴" }, category: { type: "letter", word: "LION" }, contrast_group: "word_lion", value: 3, ordering: 3 },
  { id: "letter_N", label: "chữ N", image: { kind: "emoji", ref: "🇳" }, category: { type: "letter", word: "LION" }, contrast_group: "word_lion", value: 4, ordering: 4 },
  { id: "mascot_lion", label: "chú sư tử con", image: { kind: "emoji", ref: "🦁" }, category: { type: "mascot", word: "LION" }, contrast_group: "mascots", value: 10, ordering: 5 },

  // Bộ từ BEAR 🐻
  { id: "letter_B", label: "chữ B", image: { kind: "emoji", ref: "🇧" }, category: { type: "letter", word: "BEAR" }, contrast_group: "word_bear", value: 5, ordering: 6 },
  { id: "letter_E", label: "chữ E", image: { kind: "emoji", ref: "🇪" }, category: { type: "letter", word: "BEAR" }, contrast_group: "word_bear", value: 6, ordering: 7 },
  { id: "letter_A", label: "chữ A", image: { kind: "emoji", ref: "🇦" }, category: { type: "letter", word: "BEAR" }, contrast_group: "word_bear", value: 7, ordering: 8 },
  { id: "letter_R", label: "chữ R", image: { kind: "emoji", ref: "🇷" }, category: { type: "letter", word: "BEAR" }, contrast_group: "word_bear", value: 8, ordering: 9 },
  { id: "mascot_bear", label: "bạn gấu nâu", image: { kind: "emoji", ref: "🐻" }, category: { type: "mascot", word: "BEAR" }, contrast_group: "mascots", value: 11, ordering: 10 },

  // Bộ từ FISH 🐟
  { id: "letter_F", label: "chữ F", image: { kind: "emoji", ref: "🇫" }, category: { type: "letter", word: "FISH" }, contrast_group: "word_fish", value: 9, ordering: 11 },
  { id: "letter_S", label: "chữ S", image: { kind: "emoji", ref: "🇸" }, category: { type: "letter", word: "FISH" }, contrast_group: "word_fish", value: 10, ordering: 12 },
  { id: "letter_H", label: "chữ H", image: { kind: "emoji", ref: "🇭" }, category: { type: "letter", word: "FISH" }, contrast_group: "word_fish", value: 11, ordering: 13 },
  { id: "mascot_fish", label: "chú cá vàng", image: { kind: "emoji", ref: "🐟" }, category: { type: "mascot", word: "FISH" }, contrast_group: "mascots", value: 12, ordering: 14 },

  // Bộ từ BOAT ⛵
  { id: "letter_T", label: "chữ T", image: { kind: "emoji", ref: "🇹" }, category: { type: "letter", word: "BOAT" }, contrast_group: "word_boat", value: 12, ordering: 15 },
  { id: "mascot_boat", label: "chiếc thuyền buồm", image: { kind: "emoji", ref: "⛵" }, category: { type: "mascot", word: "BOAT" }, contrast_group: "mascots", value: 13, ordering: 16 },
];
```

### 5.4 Phrasing Đậm Chất Sư Phạm Chặng 17 (Tuân Thủ `BR-MCM-06`)
- **Prompt Templates**:
  - `GT-015` (Sudoku số): *"Mỗi hàng, mỗi cột và mỗi vùng đều phải có đủ các số 1, 2, 3, 4 nhé!"*
  - `GT-001` (Chạm chọn số còn thiếu): *"Quan sát hàng hoặc cột đã có 3 số để tìm số còn thiếu duy nhất nhé!"*
  - `GT-015` (Sudoku chữ LION/BEAR/FISH/BOAT): *"Điền các chữ cái vào ô trống sao cho mỗi hàng, mỗi cột và mỗi vùng đều có đủ 4 chữ cái nhé!"*
  - `GT-015` (Sudoku hình ◯, □, △, ✕): *"Điền các hình tròn, hình vuông, hình tam giác và dấu X sao cho mỗi hàng, mỗi cột, mỗi vùng đều có đủ 4 hình nhé!"*
  - `GT-008` (Kéo thả vào ô): *"Bé hãy kéo các hình thích hợp vào ô trống tương ứng nhé!"*
  - `GT-011` (Ma trận chọn hình): *"Bé hãy quan sát cả hàng ngang và cột dọc để tìm hình đúng nhất nhé!"*
- **Narration Templates**:
  - *"Chào mừng bé đến với Lâu Đài Sudoku Bí Ẩn cùng Gấu Logic và Thỏ Quan Sát!"*
  - *"Tuyệt vời! Bé đã điền đúng ô số còn thiếu rồi đấy!"*
  - *"Một hàng ngang đã hoàn thành rực rỡ, bé thật tinh mắt!"*
  - *"Cánh cửa lâu đài đang mở ra, chúng mình cùng nhận Viên Ngọc Ma Trận nào!"*

---

## 6. Danh Mục `SkillLevelPlan[]` Chi Tiết

Toàn bộ 14 level Montessori thiết kế từ Chặng 17 tuân thủ nghiêm ngặt định dạng mã `GL-<COMP>-<STRAND>-<MECH>-01xx` (sequence $\ge 0101$), gắn nhãn `montessori_ref: "WB17-D1"`, `"WB17-D2"`, `"WB17-D3"`, phân bổ `access_tier` đồng bộ với `difficulty` (1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`), và tuyệt đối không chứa từ khóa thương mại.

| Mã Level (`code`) | Template | Skill Code | Band | Diff | Access Tier | Montessori Ref | Tên Hoạt Động & Cấu Trúc Bài Toán Sư Phạm |
|---|---|---|:---:|:---:|---|---|---|
| `GL-C3-MTX-GRID-0103` | `GT-015` | `C3.MTX.02` | 5-6 | 1 | `free` | `WB17-D1` | **Khởi Động Sudoku Số 1–4**: Lưới ma trận số với 7–8 số cho trước, trẻ tìm các ô khuyết duy nhất trên hàng hoặc cột. |
| `GL-C3-MTX-CARD-0101` | `GT-001` | `C3.MTX.02` | 5-6 | 2 | `login` | `WB17-D1` | **Tìm Số Khuyết Hàng Ngang**: Chạm chọn 1 trong 3 số để hoàn thiện hàng đã có 3 số (ví dụ: [4, 2, 3, ?] $\rightarrow$ chọn 1). |
| `GL-C3-MTX-SLOT-0102` | `GT-008` | `C3.MTX.02` | 5-6 | 2 | `login` | `WB17-D1` | **Mảnh Ghép Vùng Con 2x2**: Kéo thả thẻ số 1–4 vào 2 ô khuyết trong một khối con $2 \times 2$. |
| `GL-C3-MTX-GRID-0104` | `GT-015` | `C3.MTX.02` | 5-6 | 3 | `standard` | `WB17-D3` | **Thử Thách Sudoku Số 1–15**: Chuỗi ma trận số với 5–6 số gợi ý, đòi hỏi đối chiếu chéo hàng và cột. |
| `GL-C3-MTX-MATRX-0102` | `GT-011` | `C3.MTX.02` | 5-6 | 4 | `premium` | `WB17-D3` | **Giao Điểm Ma Trận Số**: Phân tích ô giao thoa giữa hàng và cột để chọn số duy nhất không bị trùng lặp. |
| `GL-C3-MTX-GRID-0105` | `GT-015` | `C3.MTX.02` | 5-6 | 5 | `premium` | `WB17-D3` | **Cực Đỉnh Sudoku Số 25–30**: Bảng số thử thách cao nhất với chỉ 4–5 gợi ý, rèn luyện suy luận loại trừ đa bước. |
| `GL-C3-MTX-GRID-0106` | `GT-015` | `C3.MTX.03` | 5-6 | 2 | `login` | `WB17-D2` | **Sudoku Chữ Cái LION**: Điền các chữ cái L, I, O, N vào lưới ma trận không lặp (kèm hình chú sư tử con 🦁). |
| `GL-C3-MTX-SLOT-0103` | `GT-008` | `C3.MTX.03` | 5-6 | 3 | `standard` | `WB17-D2` | **Khối Chữ Cái BEAR**: Kéo thả khối chữ cái B, E, A, R vào ô khuyết của vùng con $2 \times 2$ (kèm bạn gấu 🐻). |
| `GL-C3-MTX-GRID-0107` | `GT-015` | `C3.MTX.03` | 5-6 | 3 | `standard` | `WB17-D2` | **Sudoku Chữ Cái FISH**: Giải mã lưới chữ cái F, I, S, H và nghe phát âm từ vựng chú cá nhỏ 🐟. |
| `GL-C3-MTX-CARD-0102` | `GT-001` | `C3.MTX.03` | 5-6 | 4 | `premium` | `WB17-D2` | **Con Thuyền Chữ Cái BOAT**: Chạm chọn chữ cái còn thiếu để hoàn thiện từ vựng thuyền buồm ⛵. |
| `GL-C3-MTX-GRID-0101` | `GT-015` | `C3.MTX.01` | 5-6 | 2 | `login` | `WB17-D1` | **Khởi Động Sudoku Hình Học**: Lưới ma trận biểu tượng với 6–7 hình ◯, □, △, ✕ cho sẵn. |
| `GL-C3-MTX-SLOT-0101` | `GT-008` | `C3.MTX.01` | 5-6 | 3 | `standard` | `WB17-D1` | **Kéo Khối Hình Không Lặp**: Kéo thả các khối hình nổi ◯, □, △, ✕ vào ô trống tương ứng. |
| `GL-C3-MTX-MATRX-0101` | `GT-011` | `C3.MTX.01` | 5-6 | 3 | `standard` | `WB17-D3` | **Ô Vuông Hình Học Đối Chiếu**: Chạm chọn hình dạng thích hợp cho ô giao cắt ma trận từ 4 phương án. |
| `GL-C3-MTX-GRID-0102` | `GT-015` | `C3.MTX.01` | 5-6 | 4 | `premium` | `WB17-D3` | **Đại Thử Thách Sudoku Hình 55–60**: Bảng hình học phức tạp mật độ gợi ý thấp, kích hoạt tư duy không gian trực quan. |

---

## 7. Ma Trận Sư Phạm, Cân Bằng Hạn Ngạch & Kiểm Soát Lỗi Tự Thân

### 7.1 Phân Bổ Hạn Ngạch & Cân Bằng Competency C3
- **Hiện trạng hạn ngạch C3**:
  - Hạn ngạch toàn hệ thống của C3: 60 level (`MONTESSORI_QUOTA_LIMITS.C3 = 60`).
  - Hạn ngạch trong `montessori-corpus-mapping.md`: 15 level Montessori.
  - Phân bổ đợt này từ Chặng 17: **14 level Montessori** phân bổ đều vào 3 skill của `C3.MTX`:
    - `C3.MTX.01`: 4 levels (`GL-C3-MTX-GRID-0101`, `GL-C3-MTX-SLOT-0101`, `GL-C3-MTX-MATRX-0101`, `GL-C3-MTX-GRID-0102`)
    - `C3.MTX.02`: 6 levels (`GL-C3-MTX-GRID-0103`, `GL-C3-MTX-CARD-0101`, `GL-C3-MTX-SLOT-0102`, `GL-C3-MTX-GRID-0104`, `GL-C3-MTX-MATRX-0102`, `GL-C3-MTX-GRID-0105`)
    - `C3.MTX.03`: 4 levels (`GL-C3-MTX-GRID-0106`, `GL-C3-MTX-SLOT-0103`, `GL-C3-MTX-GRID-0107`, `GL-C3-MTX-CARD-0102`)
  - Kết quả: Giải quyết dứt điểm tình trạng thiếu hụt nội dung của `C3.MTX`, tạo đà hoàn thiện toàn diện cho Competency C3.

### 7.2 Kiểm Soát Lỗi Tự Thân (Control of Error)
1. **Phản hồi nhịp hổ phách (`amber_soft`) & Trôi về vị trí (`drift_back`)**:
   - Khi trẻ đặt một số hoặc hình bị trùng với một ô đã có trong cùng hàng, cột hoặc vùng con $2 \times 2$, ô bị trùng sẽ rung nhẹ màu hổ phách cảnh báo nhẹ nhàng và vật phẩm trôi về vị trí cũ. Tuyệt đối không có âm thanh buzzer, dấu chéo đỏ hay trừ điểm.
2. **Khóa khớp nam châm (Snap & Lock)**:
   - Trong `GT-008` và `GT-015`, vật phẩm đúng tự động hút khớp vào ô lưới với hiệu ứng lóe sáng vàng nhẹ (`gold_glow`) và âm thanh leng keng trong trẻo (`bell_soft`).
3. **Tự phát hiện ngõ cụt (Self-discovered Dead-end)**:
   - Nếu trẻ điền nhầm một ô mà chưa vi phạm ngay, trẻ sẽ gặp ngõ cụt ở ô cuối cùng (còn lại 1 ứng viên nhưng bị trùng) và tự động dùng nút **"Làm lại" (Undo)** để điều chỉnh lại bước trước đó theo đúng tinh thần Montessori.

### 7.3 Thang Scaffolding 3 Bậc (Hỗ Trợ Tự Động Theo Thời Gian & Lần Thử)
- **Mức 1 (Nudge - Nhắc nhẹ / 10s hoặc 1 miss)**:
  - Nhấp nháy viền sáng nhẹ tại hàng, cột hoặc khối con $2 \times 2$ có nhiều dữ kiện nhất (chỉ thiếu 1 ô).
- **Mức 2 (Guidance - Hướng dẫn / 18s hoặc 2 miss)**:
  - Giọng đọc Thỏ Quan Sát cất lên gợi ý: *"Hàng này đã có 1, 2, 4 rồi, còn thiếu số mấy bé nhỉ?"* hoặc *"Trong ô vuông 2x2 này còn thiếu bạn chữ nào nhỉ?"*.
- **Mức 3 (Demo - Trình diễn / 25s hoặc 3 miss)**:
  - Bàn tay mờ (Ghost Hand) xuất hiện chỉ từ thanh công cụ vào ô trống đúng với tốc độ $0.5 \times$ để bé làm theo.

---

## 8. Verification & Test Plan

1. **Kiểm tra cú pháp & Type Safety**:
   - `pnpm --filter @mindkid/content typecheck`: Tuyệt đối 0 lỗi type, 0 `any`, 0 `unknown` trong các file seeder `C3.MTX.01.ts`, `C3.MTX.02.ts`, `C3.MTX.03.ts`.
2. **Kiểm tra cổng dữ liệu Montessori (`montessori-gate`)**:
   - Chạy `pnpm --filter @mindkid/content-build test`:
     - Mọi mã level khớp regex `^GL-C[1-6]-[A-Z]{3,4}-[A-Z]{3,4}-01\d{2}$`.
     - `access_tier` khớp 100% với `difficulty` (`BR-MGL-12`).
     - Hạn ngạch C3 tuân thủ nghiêm ngặt (`BR-MGL-01`).
     - Tuyệt đối không chứa từ khóa thương mại IQ/Raven/trí tuệ (`BR-MCM-06`).
3. **Kiểm tra tương thích Projection Builders**:
   - Xác nhận `buildLevelsForSkill` sinh ra `ContentSeed` hợp lệ qua các builder `gt-015.ts`, `gt-008.ts`, `gt-011.ts`, `gt-001.ts`.
