# Bảng Tra Dạng Bài Montessori (Task #98)

> **Căn cứ spec:** [`montessori-corpus-mapping.md`](../specs/05-content/montessori-corpus-mapping.md) & [`montessori-game-level-batch.md`](../specs/05-content/montessori-game-level-batch.md).
> **Quy tắc:** Mã dạng bài `WB<nn>-D<n>` là bất biến sau khi merge. Tổng **59** dạng bài — 34 dạng nhận đợt này (20 Lô A + 14 Lô B), 25 dạng hoãn đợt sau per `D-RQ`.
>
> Số ở mục 2 **đo bằng lệnh trên chính bảng này**, không đếm tay. Cổng `pnpm --filter @mindkid/db test`
> đối chiếu chúng với mục 7.5 của [`montessori-game-level-batch.md`](../../specs/05-content/montessori-game-level-batch.md).
> Con số 57 · 33 · 24 · 19 ở các bản trước là lỗi cộng, đã sửa ở T99 WP99.0 (2026-08-20); mã dạng bài không đổi hàng nào.

---

## 1. Danh Mục Chi Tiết 59 Dạng Bài

| Mã dạng bài | Band | Competency | Strand chính | Lô | Khuôn đề xuất | Trạng thái đợt này | Tên / Mô tả dạng bài |
|---|:---:|:---:|---|:---:|---|:---:|---|
| `WB01-D1` | 3-4 | C1 | `C1.NREC` | A | `GT-001` | **Nhận (Lô A)** | Nhận biết ký hiệu số qua phát âm & hình dạng |
| `WB01-D2` | 3-4 | C1 | `C1.OTO` | A | `GT-001` | **Nhận (Lô A)** | Nối / Chọn số tương ứng với lượng |
| `WB01-D3` | 3-4 | C1 | `C1.CNT` | A | `GT-003` | **Nhận (Lô A)** | Kéo lượng vào rổ số (hái quả vào giỏ) |
| `WB02-D1` | 3-4 | C1 | `C1.NREC` | A | `GT-001` | **Nhận (Lô A)** | Điền số còn thiếu trong chuỗi số tiến (chọn 1 số) |
| `WB02-D2` | 3-4 | C1 | `C1.NREC` | B | `GT-008` | **Nhận (Lô B - A1)** | Số liền trước và liền sau (kéo số vào ô trước/sau) |
| `WB02-D3` | 3-4 | C1 | `C1.SEQ` | A | `GT-006` | **Nhận (Lô A)** | Sắp xếp lại đoàn tàu số bị xáo trộn |
| `WB03-D1` | 3-4 | C4 | `C4.VIS` | A | `GT-001` | **Nhận (Lô A)** | Chọn bóng đúng cho 1 vật mẫu (Single Target) |
| `WB03-D2` | 3-4 | C4 | `C4.VIS` | A | `GT-005` | **Nhận (Lô A)** | Ghép cặp 3 vật thể với 3 bóng tương ứng |
| `WB04-D1` | 3-4 | C1 | `C1.CNT` | B | `GT-012` | *Hoãn* | Chớp mắt nhận diện chấm xúc xắc (1–5) |
| `WB04-D2` | 3-4 | C1 | `C1.CNT` | B | `GT-012` | *Hoãn* | Đếm nhanh ngón tay giơ lên |
| `WB04-D3` | 3-4 | C1 | `C1.CNT` | B | `GT-012` | *Hoãn* | Ghép nhanh thẻ chấm tròn với số |
| `WB05-D1` | 3-4 | C1 | `C1.CNT` | A | `GT-002` | **Nhận (Lô A)** | Đếm tập hợp con đồng nhất (chọn số khớp lượng) |
| `WB05-D2` | 3-4 | C1 | `C1.CNT` | A | `GT-003` | **Nhận (Lô A)** | Đếm đối tượng trong khung cảnh phức hợp & kéo số |
| `WB06-D1` | 3-4 | C1 | `C1.CMP` | A | `GT-001` | **Nhận (Lô A)** | So sánh trực quan 2 nhóm vật (Nhiều hơn / Ít hơn) |
| `WB06-D2` | 3-4 | C1 | `C1.CMP` | A | `GT-003` | **Nhận (Lô A)** | Ghép tương ứng 1-1 để tìm nhóm thừa/thiếu |
| `WB07-D1` | 3-4 | C1 | `C1.NCOMP` | B | `GT-007` | **Nhận (Lô B - A1)** | Tách lượng thành 2 phần bằng hạt màu / thanh số (Ten-frame) |
| `WB07-D2` | 3-4 | C1 | `C1.NCOMP` | B | `GT-007` | **Nhận (Lô B - A1)** | Cây tách gộp sơ đẳng (Number Bond 5) |
| `WB07-D3` | 3-4 | C1 | `C1.NCOMP` | B | `GT-007` | *Hoãn* | Tìm cặp số bạn thân có tổng bằng 5 |
| `WB08-D1` | 4-5 | C1 | `C1.NCOMP` | B | `GT-007` | **Nhận (Lô B - A1)** | Cây tách gộp phạm vi 10 (khuyết 1 nhánh con) |
| `WB08-D2` | 4-5 | C1 | `C1.NCOMP` | B | `GT-007` | **Nhận (Lô B - A1)** | Tách gộp qua dải hạt màu / thanh cọc số 10 |
| `WB08-D3` | 4-5 | C1 | `C1.NCOMP` | B | `GT-007` | *Hoãn* | Tìm tất cả các cách tách của một số $N \le 10$ |
| `WB09-D1` | 4-5 | C2 | `C2.MAZ` | B | `GT-013` | *Hoãn* | Mê cung đường đơn (Không ngã rẽ) |
| `WB09-D2` | 4-5 | C2 | `C2.MAZ` | B | `GT-013` | *Hoãn* | Mê cung ngã rẽ chữ T & chữ Y có bẫy |
| `WB09-D3` | 4-5 | C2 | `C2.MAZ` | B | `GT-013` | *Hoãn* | Mê cung thu thập vật phẩm theo chuỗi |
| `WB10-D1` | 4-5 | C4 | `C4.SEN` | A | `GT-004` | **Nhận (Lô A)** | Phân loại đồ vật theo nhóm màu cơ bản & màu phụ |
| `WB10-D2` | 4-5 | C4 | `C4.SEN` | A | `GT-006` | **Nhận (Lô A)** | Sắp xếp dải sắc độ (Gradient Tint/Shade) |
| `WB11-D1` | 4-5 | C1 | `C1.CNT` | A | `GT-001` | **Nhận (Lô A)** | Đếm nhảy cóc (Skip counting by 2s) chọn số |
| `WB11-D2` | 4-5 | C1 | `C1.CNT` | B | `GT-008` | **Nhận (Lô B - A1)** | Điền số khuyết trên trục số đếm cách quãng (Kéo số) |
| `WB11-D3` | 4-5 | C3 | `C3.RULE` | B | `GT-008` | **Nhận (Lô B - A1)** | Ma trận số $2 \times 2$ có quy luật cộng/trừ đơn giản |
| `WB12-D1` | 4-5 | C1 | `C1.PROB` | B | `GT-010` | **Nhận (Lô B - A2)** | Thay thế trực quan 1 bước: 1 Hình = 1 Số |
| `WB12-D2` | 4-5 | C1 | `C1.PROB` | B | `GT-010` | **Nhận (Lô B - A2)** | Hệ 2 phương trình biểu tượng đơn giản |
| `WB12-D3` | 4-5 | C1 | `C1.PROB` | B | `GT-010` | *Hoãn* | Bàn cân thăng bằng tìm giá trị biểu tượng |
| `WB13-D1` | 4-5 | C1 | `C1.NCOMP` | B | `GT-007` | **Nhận (Lô B - A1)** | Tách gộp số hàng chục và hàng đơn vị ($10 + N$) |
| `WB13-D2` | 4-5 | C1 | `C1.NCOMP` | B | `GT-007` | **Nhận (Lô B - A1)** | Cây tách gộp phạm vi 20 (khuyết nhánh) |
| `WB13-D3` | 4-5 | C1 | `C1.NCOMP` | B | `GT-007` | *Hoãn* | Thử thách thám tử số: Điền các nhánh của tổng 20 |
| `WB14-D1` | 4-5 | C3 | `C3.DED` | B | `GT-009` | **Nhận (Lô B - A2)** | Loại trừ số qua 2 manh mối (Lớn hơn/Bé hơn, Chẵn/Lẻ) |
| `WB14-D2` | 4-5 | C3 | `C3.DED` | B | `GT-009` | *Hoãn* | Tìm số bí ẩn trên lưới 1–10 qua 3 manh mối |
| `WB15-D1` | 5-6 | C1 | `C1.PAT` | A | `GT-006` | **Nhận (Lô A)** | Chuỗi quy luật lặp $AB-ABC-AABB$ kéo/chọn phần tử tiếp |
| `WB15-D2` | 5-6 | C3 | `C3.RULE` | A | `GT-001` | **Nhận (Lô A)** | Quy luật ma trận $2 \times 2$ (Màu sắc & Hình dạng) |
| `WB15-D3` | 5-6 | C3 | `C3.RULE` | B | `GT-008` | **Nhận (Lô B - A1)** | Điền phần tử khuyết vào ma trận quy luật |
| `WB16-D1` | 5-6 | C1 | `C1.MEAS` | B | `GT-014` | *Hoãn* | So sánh khối lượng trực quan qua độ nghiêng cân đòn bẩy |
| `WB16-D2` | 5-6 | C1 | `C1.MEAS` | B | `GT-014` | *Hoãn* | Cân thăng bằng: Thêm vật nặng để cân bằng 2 đĩa |
| `WB16-D3` | 5-6 | C3 | `C3.DED` | B | `GT-014` | *Hoãn* | Suy luận bắc cầu về khối lượng qua 2 bàn cân |
| `WB17-D1` | 5-6 | C3 | `C3.MTX` | B | `GT-015` | *Hoãn* | Sudoku Mini $2 \times 2$ (4 ô, 2 biểu tượng) |
| `WB17-D2` | 5-6 | C3 | `C3.MTX` | B | `GT-015` | *Hoãn* | Sudoku $3 \times 3$ (9 ô, 3 hình dạng/màu sắc) |
| `WB17-D3` | 5-6 | C3 | `C3.MTX` | B | `GT-015` | *Hoãn* | Sudoku $4 \times 4$ cấp độ cơ bản (Khuyết 2–4 ô) |
| `WB18-D1` | 5-6 | C1 | `C1.MEAS` | A | `GT-001` | **Nhận (Lô A)** | Đọc đồng hồ giờ đúng (1:00, 2:00, ..., 12:00) |
| `WB18-D2` | 5-6 | C1 | `C1.MEAS` | A | `GT-005` | **Nhận (Lô A)** | Nối đồng hồ kim với đồng hồ điện tử / hoạt động trong ngày |
| `WB18-D3` | 5-6 | C1 | `C1.MEAS` | B | `GT-016` | *Hoãn* | Xoay kim đồng hồ về đúng giờ yêu cầu |
| `WB19-D1` | 5-6 | C2 | `C2.GEO` | A | `GT-005` | **Nhận (Lô A)** | Nhận diện khối 3D (Cầu, Lập phương, Trụ, Nón) trong đời thực |
| `WB19-D2` | 5-6 | C2 | `C2.PER` | A | `GT-005` | **Nhận (Lô A)** | Đối chiếu hình nhìn từ các hướng (Front/Side/Top view) |
| `WB19-D3` | 5-6 | C2 | `C2.GEO` | B | `GT-017` | *Hoãn* | Đếm khối lập phương trong mô hình xếp chồng 3D |
| `WB20-D1` | 5-6 | C1 | `C1.PROB` | B | `GT-010` | *Hoãn* | Hệ 3 phương trình biểu tượng có chứa phép cộng & trừ |
| `WB20-D2` | 5-6 | C1 | `C1.PROB` | B | `GT-010` | *Hoãn* | Bài toán thay thế có chứa phép nhân sơ đẳng |
| `WB20-D3` | 5-6 | C3 | `C3.DED` | B | `GT-010` | *Hoãn* | Suy luận giá trị biểu tượng với điều kiện ràng buộc bất đẳng thức |
| `WB21-D1` | 5-6 | C3 | `C3.MTX` | B | `GT-011` | **Nhận (Lô B - A2)** | Ma trận logic $2 \times 2$ biến đổi 1 thuộc tính |
| `WB21-D2` | 5-6 | C3 | `C3.MTX` | B | `GT-011` | *Hoãn* | Ma trận $3 \times 3$ biến đổi đồng thời hình dạng & màu sắc |
| `WB21-D3` | 5-6 | C2 | `C2.ROT` | B | `GT-011` | *Hoãn* | Ma trận xoay quy luật theo chiều kim đồng hồ ($90^\circ, 180^\circ$) |
| `WB21-D4` | 5-6 | C3 | `C3.DED` | B | `GT-011` | *Hoãn* | Ma trận logic suy luận tổng hợp đa quy luật |

---

## 2. Tổng Hợp Thống Kê

| Số đo | Giá trị |
|---|---:|
| Tổng số dạng bài trong nguồn | **59** |
| Số workbook | 21 |
| Dạng bài Lô A nhận đợt này | 20 |
| Dạng bài Lô B nhận đợt này | 14 |
| **Tổng nhận đợt này** | **34** |
| Dạng bài hoãn sang đợt sau (`D-RQ`) | 25 |

Nguồn theo competency: C1 35 · C2 7 · C3 13 · C4 4. Nhận đợt này theo competency:
C1 23 · C2 2 · C3 5 · C4 4.

- **Lô A (20):** `WB01-D1..D3` · `WB02-D1` · `WB02-D3` · `WB03-D1..D2` · `WB05-D1..D2` ·
  `WB06-D1..D2` · `WB10-D1..D2` · `WB11-D1` · `WB15-D1..D2` · `WB18-D1..D2` · `WB19-D1..D2`
- **Lô B (14):** `WB02-D2` · `WB07-D1..D2` · `WB08-D1..D2` · `WB11-D2..D3` · `WB12-D1..D2` ·
  `WB13-D1..D2` · `WB14-D1` · `WB15-D3` · `WB21-D1`

**24 trên 34 dạng bài nhận đã soạn thành level** (49 level, tính tới T99 WP99.0). Mười dạng còn
lại chờ khuôn `GT-009` tới `GT-017`: `WB07-D2` · `WB08-D2` · `WB11-D3` · `WB12-D1..D2` ·
`WB13-D2` · `WB14-D1` · `WB15-D3` · `WB18-D2` · `WB21-D1`.

**Trần C1 chặn 5 trong số đó.** Trần 36 level của C1 chỉ chứa 18 dạng bài ở sàn 2 level mỗi
dạng, và 18 dạng ấy đã soạn xong. Năm dạng C1 còn lại (`WB07-D2` · `WB08-D2` · `WB12-D1..D2` ·
`WB13-D2` · `WB18-D2`) không seed được cho tới khi cổng người ở CHECKPOINT 3 của Task #99 mở
trần hoặc dừng lô.
