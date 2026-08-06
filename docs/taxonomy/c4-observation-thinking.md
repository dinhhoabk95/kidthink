# C4 — Observation Thinking

> Nguồn: Montessori (giáo dục cảm quan), Reggio Emilia (quan sát kỹ lưỡng, ghi
> chép trực quan), Kogumakai (tìm điểm khác, vật ẩn).
> Legend + quy ước mã: [`index.md`](./index.md).

**Strand:** 4 · **Skill đã đặt tên:** 16 · **Mục tiêu:** ~60 · **Còn thiếu:** 44
**Game type hiện có:** 3 (D2-08, D6-04, D6-06)

> ⚠️ **Khoảng trống lớn nhất của sản phẩm.** 16/60 skill, 3/60 game type.
> Ưu tiên nội dung số 1 cùng với [C5](./c5-language-thinking.md).

---

## C4.VIS — Visual Attention (4)

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Status |
|---|---|---|---|---|---|---|
| C4.VIS.01 | Tìm điểm khác giữa hai tranh | 4 | 3 | — | `observe` `compare` | 🟡 |
| C4.VIS.02 | Tìm vật giống nhau trong nhóm | 3 | 2 | — | `observe` `match` | 🟡 |
| C4.VIS.03 | Tìm vật ẩn trong tranh (Hidden Object) | 4 | 3 | C4.VIS.02 | `observe` | ✅ |
| C4.VIS.04 | Tìm hình bị che một phần | 5 | 4 | C4.VIS.03 | `observe` `infer` | ✅ |

## C4.DET — Detail Recognition (4)

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Status |
|---|---|---|---|---|---|---|
| C4.DET.01 | Quan sát màu | 3 | 1 | — | `observe` | 🟡 |
| C4.DET.02 | Quan sát hình | 3 | 1 | C2.GEO.01 | `observe` | 🟡 |
| C4.DET.03 | Quan sát kích thước | 3 | 2 | C1.CMP.01 | `observe` `compare` | 🟡 |
| C4.DET.04 | Quan sát vị trí | 4 | 3 | C2.ORI.03 | `observe` | 🟡 |

## C4.MEM — Memory (4)

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Status |
|---|---|---|---|---|---|---|
| C4.MEM.01 | Memory Card — tìm cặp | 3 | 2 | C3.ANA.01 | `recall` `match` | 🟡 |
| C4.MEM.02 | Nhớ chuỗi hình | 4 | 3 | C4.DET.02 | `recall` `sequence` | 🟡 |
| C4.MEM.03 | Nhớ chuỗi màu | 4 | 3 | C4.DET.01 | `recall` `sequence` | 🟡 |
| C4.MEM.04 | Nhớ chuỗi âm thanh | 5 | 4 | — | `recall` `listen` | 🟡 |

## C4.SEN — Sensory Discrimination (4)

Phân biệt bằng cảm quan. Montessori: tách biệt một thuộc tính mỗi lần.

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Status |
|---|---|---|---|---|---|---|
| C4.SEN.01 | Phân biệt sắc độ màu | 4 | 3 | C4.DET.01 | `compare` `observe` | 🟡 |
| C4.SEN.02 | Phân biệt hình gần giống | 4 | 3 | C4.DET.02 | `compare` `observe` | 🟡 |
| C4.SEN.03 | Phân biệt kết cấu | 4 | 3 | — | `compare` `observe` | ⬜ |
| C4.SEN.04 | Phân biệt cao độ / âm sắc | 5 | 4 | — | `compare` `listen` | ⬜ |

---

## Khoảng trống cần biên soạn (44 skill)

Đây là danh sách công việc nội dung lớn nhất trong toàn bộ taxonomy.

| Strand | Thêm | Hướng mở rộng |
|---|---:|---|
| C4.VIS | +12 | Tìm 3 / 5 / 7 điểm khác · tìm vật lạ trong bối cảnh · tìm vật theo hai đặc điểm · quét theo hàng có hệ thống · tìm trong tranh đông đúc · tìm bóng đúng · tìm nửa còn lại · tìm vật bị lộn ngược · tìm vật đổi màu · tìm vật thiếu chi tiết · đếm vật trùng lặp · tìm vật xuất hiện nhiều nhất |
| C4.DET | +10 | Quan sát hướng · số lượng chi tiết · nét mặt / cảm xúc · chất liệu · độ dày–mỏng · hoa văn · đối xứng của chi tiết · thứ tự chi tiết · chi tiết thay đổi giữa hai lần xem · chi tiết bất thường |
| C4.MEM | +12 | Nhớ vị trí 4 / 6 / 9 ô · nhớ chuỗi 3 / 4 / 5 phần tử · nhớ tranh sau 5 giây · nhớ vật bị lấy đi · nhớ thứ tự xuất hiện · nhớ cặp đôi liên kết · nhớ đường đi vừa xem · nhớ chuỗi kết hợp hình + màu |
| C4.SEN | +10 | Phân biệt độ đậm nhạt 5 bậc · dài–ngắn bằng mắt không đo · nặng–nhẹ bằng tay · nóng–lạnh · mùi (offline worksheet) · vị (offline) · âm lượng to–nhỏ · nhịp nhanh–chậm · tiếng động vật · tiếng đồ vật |

**Ràng buộc kỹ thuật cần lưu ý:** C4.SEN.03 (kết cấu), mùi, vị không thể hiện
thực hoá trên canvas — thuộc nhóm **worksheet / hoạt động offline**, phải gắn
`asset_type = worksheet` và có `parent_guide` mô tả vật liệu thật cần chuẩn bị.

**Cơ hội tái sử dụng template:** hầu hết C4.VIS và C4.MEM dùng được ngay
`tap-select`, `flash-recall`, `memory-flip` — ba mechanic đã có base class trong
engine. Ước tính ≥ 30/44 skill mới **không cần code engine mới**, chỉ cần
`content_pack` + theme.
