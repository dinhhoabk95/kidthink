---
spec: MONTESSORI-CHANG-21-SPEC
title: "Chặng 21: Căn Phòng Suy Luận Bí Mật — Ma Trận Suy Luận Tổng Hợp & Tư Duy Không Gian Đa Chiều"
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-10-29
stage: chang-21
workbook_ref: WB21
gem_reward: "Viên Ngọc Tư Duy (Thinking Core Gem)"
owns:
  - Phân tích sư phạm và giải mã toàn diện 24 trang PDF Chặng 21 (Căn phòng Suy luận Bí mật, WB21)
  - Ánh xạ 8 nhóm hoạt động (WB21-D1..D8) vào các game engine hiện tại GT-011 (matrix-pick), GT-001 (tap-select), GT-000 (concept-intro, celebration-summary)
  - TUYỆT ĐỐI KHÔNG TẠO MỚI GT-038+, loại bỏ và thay thế hoàn toàn dự thảo GT-058 cũ
  - Khắc phục lỗ hổng 0 Montessori level của WB21 trong packages/content
  - Thiết kế SkillDataset (items, relations, axes, ladder, phrasing) lấy cảm hứng từ thế giới suy luận bí mật trong PDF 2026
  - Thiết kế 12 SkillLevelPlan[] chuẩn GL-<COMP>-<STRAND>-<MECH>-01xx (sequence >= 0101) cho C3.MTX.01, C3.MTX.02, C3.MTX.03, C2.ROT.01, C2.ROT.02, C2.PER.03
  - Tuân thủ nghiêm ngặt BR-MCM-06 (loại bỏ tuyệt đối các thuật ngữ thương mại IQ, Raven, trí tuệ, WISC)
  - Kế hoạch phổ biến dữ liệu vào database seeder packages/content/src/skills/c3/mtx/, c2/rot/, c2/per/
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - ACTIVITY-TYPES-TABLE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
---

# Chặng 21: Căn Phòng Suy Luận Bí Mật — Ma Trận Suy Luận Tổng Hợp & Tư Duy Không Gian Đa Chiều

## 1. Objective (Mục tiêu cốt lõi)

Tài liệu này sở hữu đặc tả kỹ thuật và kiến trúc nội dung sư phạm nhằm chuyển thể trọn vẹn dữ liệu từ tài liệu PDF **"Chặng 21: Căn phòng Suy luận Bí mật — Ma trận Suy luận Tổng hợp & Tư duy Không gian Đa chiều (21 Thử thách Toàn năng)"** (`docs/montessori/extracted/chang-21/analysis.json`, nguồn: *21 - Ma tran suy luan tong hop.pdf*, 24 trang, thuộc bộ giáo trình *Gấu Logic & Thỏ Quan Sát - Hành Trình Toán Tư Duy New 2026*, Nhà xuất bản Dân Trí / Montessori VN) vào nền tảng **TiniMath v2**.

### 1.1 Bối Cảnh Cốt Truyện & Hành Trình Khám Phá (Narrative Quest)

1. **Vũ trụ cốt truyện**:
   - Phía sau cánh cổng gỗ vòm mạ vàng cổ kính được phong tỏa bởi 21 viên đá phong ấn, **Căn Phòng Suy Luận Bí Mật** — căn phòng thứ 21 chưa từng xuất hiện trên hải trình của Chuyến Tàu Toán Học — chính thức mở ra đón chào các nhà thám hiểm nhí tài năng.
   - Tại đây, không gian biến hóa kỳ ảo giữa các khối lập phương đa tầng, khung que diêm phát quang, đĩa xoay tương quan bí ẩn, các bức tranh mosaic tổ ong zic-zac và những cỗ máy bánh xe số học cổ xưa.
2. **Nhiệm vụ học tập (Learning Quest)**:
   - Bé cùng Gấu Logic và Thỏ Quan Sát giải mã lần lượt 21 câu đố phân tầng nhận thức:
     - Khởi động ghép mộng bộ phận - toàn thể 2D (Dải hạt ngũ giác, khối tổ ong lục giác).
     - Hợp nhất ma trận pixel 4x4, 5x5, 6x6 và lát gạch đa khối polyomino vào kim tự tháp bậc thang.
     - Đứng từ trên không (góc nhìn chú hề dù lượn, ông già Noel) xác định hình chiếu bằng trực giao (Top-down view) của tháp lập phương, chóp ngũ giác nan hoa, khung que đa cạnh và máy bay giấy 3D.
     - Đặt mình vào góc nhìn bên mạn sườn (Side elevation view) để phân tích thứ tự thanh ngang 3D.
     - Tìm ảnh đối xứng qua trục gương thẳng đứng, đối chiếu cặp chuỗi hạt nghịch đảo 180°.
     - Giải bài toán tương quan vị trí hàm số $A : B :: C : D$ và ánh xạ thuộc tính xúc xắc sang tọa độ màu.
     - Vận dụng tư duy số học giải mã ma trận tích số 2x2, bánh xe bội số tuần hoàn, tam giác số nhân chia và 3 khóa số trung tâm để mở cánh cổng kho báu.
   - Thu thập đủ 21 mảnh suy luận để thắp sáng **Viên Ngọc Tư Duy** (Thinking Core Gem) và nhận **Huy Hiệu Nhà Thám Hiểm Toàn Năng**.

### 1.2 Nguyên Tắc Kỹ Thuật Bất Biến (Core Invariants)

1. **Tuyệt Đối Không Tạo Game Engine Mới (`GT-038+`)**:
   - Toàn bộ cơ chế thử thách của Chặng 21 được phân bổ 100% vào các game engine hiện hữu:
     - `GT-011` (`MatrixPickSession` — Ma trận chọn hình/số khuyết): Chạy các dạng bài ma trận logic $2 \times 2$, $3 \times 3$, tương quan biến đổi thuộc tính màu sắc/hình dạng/vị trí, và ma trận điền số/ký hiệu chu kỳ.
     - `GT-001` (`TapSelectSession` — Chạm chọn đáp án đúng): Chạy các thử thách trắc nghiệm thị giác: chọn hình chiếu từ trên cao (Top-down view), hình chiếu cạnh bên (Side elevation view), phép cộng mảnh ô lưới pixel, combo lát gạch polyomino, và đối xứng trục gương.
     - `GT-000` (`concept-intro` & `celebration-summary`): Hoạt cảnh mở cánh cổng Căn phòng Bí mật (Trang 1) và lễ vinh danh nhận Huy Hiệu Nhà Thám Hiểm Toàn Năng (Trang 24).
   - **Hủy bỏ hoàn toàn dự thảo `GT-058` cũ**: Bản nháp cũ mang mã `GT-058` bị bãi bỏ triệt để vì vi phạm lệnh cấm tạo `GT-038+` và vi phạm quy chuẩn đặt tên thương mại.
2. **Khắc Phục Điểm Nghẽn 0 Montessori Levels Cho WB21**:
   - Hiện tại, `WB21` (`WB21-D1`, `WB21-D2`, `WB21-D3`) đang có **0 Montessori levels** trong `packages/content`.
   - Đặc tả này thiết kế hoàn chỉnh kế hoạch 12 levels chuẩn mang nhãn `montessori_ref: "WB21-D1"`, `"WB21-D2"`, `"WB21-D3"` nạp vào các seeder:
     - `packages/content/src/skills/c3/mtx/` (`C3.MTX.01`, `C3.MTX.02`, `C3.MTX.03`)
     - `packages/content/src/skills/c2/rot/` (`C2.ROT.01`, `C2.ROT.02`)
     - `packages/content/src/skills/c2/per/` (`C2.PER.03`, `C2.PER.04`)
3. **Tuân Thủ Tuyệt Đối Quy Chuẩn Sư Phạm `BR-MCM-06`**:
   - Nghiêm cấm hoàn toàn sự xuất hiện của các từ ngữ thương mại, kiểm tra tâm lý hoặc đo lường chỉ số trí tuệ: `iq`, `raven`, `trí tuệ`, `chỉ số thông minh`, `wisc`, `stanford-binet`, `mensa` trong toàn bộ `title`, `instruction`, `phrasing`, `learning_objectives`.
   - Các bài toán suy luận trừu tượng được định danh bằng ngôn ngữ thuần túy sư phạm: "Ma trận suy luận logic", "Khám phá quy luật ô vuông", "Mảnh ghép tương quan", "Hình chiếu không gian".
4. **Chuẩn Định Danh & Cấu Trúc Khối Mã (`BR-MGL-02`)**:
   - Mọi mã level Montessori thuộc khối dành riêng sequence $\ge 0101$: `GL-<COMP>-<STRAND>-<MECH>-01xx`.
   - Phân bổ `access_tier` khớp chính xác `difficulty`: 1=`free`, 2=`login`, 3=`standard`, 4/5=`premium` (`BR-MGL-12`).

---

## 2. Actors & Pedagogical Roles

| Tác nhân / Nhân vật | Vai trò kỹ thuật | Vai trò sư phạm & Thể hiện trực quan trong Chặng 21 |
|---|---|---|
| **Bé (Kid Player)** | Người chơi trung tâm (5–6 tuổi) | Nhập vai "Nhà thám hiểm nhí", vận dụng đôi mắt tinh anh và tư duy suy luận đa chiều để lần lượt giải mã các câu đố ma trận, xoay chuyển hình khối 3D trong tâm trí, đối chiếu hình chiếu phẳng và tìm ra các quy luật số học bí ẩn. |
| **Gấu Logic (`gau_logic`)** | Dẫn dắt tư duy trừu tượng & Trật tự logic | Đại diện cho cấu trúc, định luật biến đổi và tư duy toán học hệ thống. Ngoại hình: Gấu nâu đeo kính tròn trí thức, mặc áo vest nơ, cầm chìa khóa cổ và cuốn "Sổ tay suy luận". Lời thoại mẫu: *"Xem từng hàng màu trước khi ghép nhé!", "Tưởng tượng mình đang đứng ở trên cao!", "Theo từng cạnh màu sẽ dễ hơn đấy!", "Tìm quy luật giống nhau giữa ba bảng!", "Nhìn cả hàng và cột trước khi tính!"*. |
| **Thỏ Quan Sát (`tho_quan_sat`)** | Kích hoạt trực giác giác quan & Thao tác chi tiết | Đại diện cho sự nhạy bén thị giác, phát hiện góc cạnh và kiên trì rà soát. Ngoại hình: Thỏ trắng đeo kính lúp thám hiểm, mang túi chéo đồ nghề, ngón tay thoăn thoắt chỉ vào các điểm nút. Lời thoại nhắc nhở: *"Các cạnh phải khớp thật chính xác!", "Bé chọn hình chiếu đúng nhất nhé!", "Quan sát cả phần bị che khuất!", "Chỉ có một hình khớp hoàn toàn!", "Bé tìm ra quy luật ẩn bên trong nhé!"*. |
| **Phụ huynh / Giáo viên** | Đồng hành ngoài màn hình | Hướng dẫn trẻ thực hành quan sát đồ vật trong nhà từ các hướng (nhìn từ trên xuống chiếc bàn ăn, nhìn từ mạn sườn chiếc ô tô đồ chơi) hoặc cùng trẻ xếp các khối rubik, que diêm theo hình mẫu trước khi làm bài trên màn hình. |
| **Content Seeder Engine** | Hệ thống tự động | Chuyển hóa các `SkillLevelPlan[]` thành `ContentSeed` hợp lệ, xác thực qua `montessori-gate.ts` và kiểm tra Zod schema. |

---

## 3. Entry Points & File Mapping

```
docs/montessori/extracted/chang-21/analysis.json (24 trang, WB21)
   │
   ├──> docs/montessori/dataset/activity-types-table.md
   │       └── Đồng bộ các hàng WB21-D1, WB21-D2, WB21-D3, WB21-D4 (Nhận Lô B - A2, dùng GT-011, GT-001; hủy bỏ GT-058)
   │
   ├──> docs/specs/05-content/montessori-corpus-mapping.md
   │       └── Đồng bộ hàng 21 (Bảng 7.1) và cập nhật phân bổ dạng bài C3 & C2 (Bảng 7.9)
   │
   ├──> packages/content/src/skills/c3/mtx/
   │       ├── C3.MTX.01.ts (Ma trận 2x2 & Suy luận tương quan vị trí)
   │       │     ├── Dataset: Bổ sung items ma trận hạt màu, đĩa xoay tương quan, ô vuông pixel
   │       │     ├── Level WB21-D1 (GT-011): GL-C3-MTX-MATRX-0101 (diff 2, login - Ma trận 2x2 biến đổi 1 thuộc tính)
   │       │     ├── Level WB21-D1 (GT-011): GL-C3-MTX-MATRX-0102 (diff 3, standard - Ma trận tương quan A:B::C:D)
   │       │     └── Level WB21-D1 (GT-001): GL-C3-MTX-TAP-0103 (diff 3, standard - Ánh xạ vị trí chấm xúc xắc sang ô vuông)
   │       │
   │       ├── C3.MTX.02.ts (Ma trận 3x3 & Chu kỳ biến đổi ký hiệu)
   │       │     ├── Dataset: Bổ sung ký hiệu chấm tròn, dấu cộng, bánh xe số, tam giác số
   │       │     ├── Level WB21-D2 (GT-011): GL-C3-MTX-MATRX-0103 (diff 4, premium - Ma trận 3x3 chu kỳ ký hiệu dịch chuyển)
   │       │     ├── Level WB21-D2 (GT-011): GL-C3-MTX-MATRX-0104 (diff 4, premium - Ma trận số học tích số 2x2)
   │       │     └── Level WB21-D2 (GT-001): GL-C3-MTX-TAP-0105 (diff 5, premium - Khóa số trung tâm mở cổng kho báu)
   │       │
   │       └── C3.MTX.03.ts (Ghép mảnh ô lưới pixel & Lát gạch polyomino)
   │             ├── Dọn sạch thuật ngữ "Raven" trong LO-C3.MTX.03-01..03 để tuân thủ BR-MCM-06
   │             ├── Dataset: Bổ sung mảnh pixel khuyết 5x5, 6x6, khối polyomino tháp bậc thang
   │             ├── Level WB21-D1 (GT-001): GL-C3-MTX-TAP-0101 (diff 2, login - Phép cộng mảnh pixel 4x4)
   │             └── Level WB21-D1 (GT-001): GL-C3-MTX-TAP-0102 (diff 3, standard - Ghép mảnh chữ T vào khung 5x5)
   │
   ├──> packages/content/src/skills/c2/rot/
   │       ├── C2.ROT.01.ts (Xoay góc quy luật 90° & 180°)
   │       │     ├── Dataset: Bổ sung chuỗi hạt treo ngược, nan hoa chóp ngũ giác
   │       │     └── Level WB21-D3 (GT-001): GL-C2-ROT-TAP-0101 (diff 3, standard - Đối chiếu chuỗi hạt nghịch đảo 180°)
   │       │
   │       └── C2.ROT.02.ts (Đối xứng trục gương)
   │             ├── Dataset: Bổ sung bảng hạt màu đối xứng 5x6, trục gương nét đứt
   │             └── Level WB21-D3 (GT-011): GL-C2-ROT-MATRX-0101 (diff 3, standard - Tìm bảng phản chiếu gương trục đứng)
   │
   └──> packages/content/src/skills/c2/per/
           └── C2.PER.03.ts (Hình chiếu từ trên xuống - Top-down view)
                 ├── Dataset: Bổ sung khối lập phương đa tầng, khung que 3D, máy bay giấy
                 ├── Level WB21-D3 (GT-001): GL-C2-PER-TAP-0101 (diff 1, free - Hình chiếu bằng tháp lập phương 3D)
                 └── Level WB21-D3 (GT-001): GL-C2-PER-TAP-0102 (diff 2, login - Hình chiếu khung que đa cạnh & máy bay)
```

---

## 4. Phân Tích Chi Tiết 24 Trang PDF & Ánh Xạ Dạng Bài

### 4.1 Bảng Phân Rã Toàn Diện 24 Trang PDF Nguồn

| Trang PDF | Trang Sách | Tên Bài & Cơ Chế Sư Phạm | Nhóm Hoạt Động | Template | Kỹ Năng Mục Tiêu | Độ Khó | Phân Loại Lô |
|---|---|---|---|---|---|:---:|:---:|
| **Trang 1** | Bìa Chặng | Giới thiệu Căn phòng Suy luận Bí mật, 21 thử thách toàn năng, cánh cổng phong ấn | Khởi động | `GT-000` | Định hướng | 1 | — |
| **Trang 2** | Bài 1 | Nối dải hạt ngũ giác đa màu 2x7 (Phân tích bộ phận - toàn thể) | `WB21-D1` | `GT-001` / `GT-011` | `C3.MTX.01` | 2 | Lô B - A2 |
| **Trang 3** | Bài 2 | Nối khối tổ ong lục giác 4x4 cắt zic-zac (Khớp mộng hình học 2D) | `WB21-D1` | `GT-001` / `GT-011` | `C3.MTX.01` | 2 | Lô B - A2 |
| **Trang 4** | Bài 3 | Phép cộng lưới pixel 4x4: [Mảnh A] + [Mảnh B] = [ ? ] | `WB21-D1` | `GT-001` | `C3.MTX.03` | 2 | Lô B - A2 |
| **Trang 5** | Bài 4 | Ghép hình khung 5x5 khuyết lõi chữ T và mảnh bù 4 ô | `WB21-D1` | `GT-001` | `C3.MTX.03` | 3 | Lô B - A2 |
| **Trang 6** | Bài 5 | So sánh chuỗi hạt cọc treo ngược vs cọc đứng (Đảo nghịch 180 độ) | `WB21-D3` | `GT-001` | `C2.ROT.01` | 3 | Lô B - A2 |
| **Trang 7** | Bài 6 | Hình chiếu đỉnh tháp lập phương đa màu bậc thang (Top-down view) | `WB21-D3` | `GT-001` | `C2.PER.03` | 2 | Lô A |
| **Trang 8** | Bài 7 | Góc nhìn từ trên cao của ông già Noel xuống khối tháp chữ U | `WB21-D3` | `GT-001` | `C2.PER.03` | 2 | Lô A |
| **Trang 9** | Bài 8 | Chú hề nhảy dù nhìn khối chữ thập 3D (Orthogonal top view) | `WB21-D3` | `GT-001` | `C2.PER.03` | 3 | Lô A |
| **Trang 10** | Bài 9 | Hình chiếu đỉnh chóp ngũ giác nan hoa xoay theo chiều kim đồng hồ | `WB21-D3` | `GT-001` / `GT-011` | `C2.ROT.01` | 3 | Lô B - A2 |
| **Trang 11** | Bài 10 | Khung que lập phương 3D nhìn từ trên (Thanh que chéo đáy) | `WB21-D3` | `GT-001` | `C2.PER.03` | 3 | Lô A |
| **Trang 12** | Bài 11 | Máy bay giấy gấp 3D nối với hình chiếu cánh tam giác phẳng 2D | `WB21-D3` | `GT-001` | `C2.PER.03` | 2 | Lô A |
| **Trang 13** | Bài 12 | Mảnh tam giác trắng trên 3 bảng lưới isometric đẳng diện | `WB21-D1` | `GT-001` | `C3.MTX.01` | 4 | Lô B - A2 |
| **Trang 14** | Bài 13 | Đối chiếu 2D đa tầng lồng nhau với mô hình 3D xếp chồng tầng | `WB21-D3` | `GT-001` | `C2.PER.03` | 3 | Lô A |
| **Trang 15** | Bài 14 | Quy luật hạt màu đối xứng qua trục thẳng đứng nét đứt (Mirror reflection) | `WB21-D3` | `GT-011` / `GT-001` | `C2.ROT.02` | 3 | Lô B - A2 |
| **Trang 16** | Bài 15 | Khối thanh ngang 3D nhiều tầng nhìn từ mạn sườn (Side elevation view) | `WB21-D3` | `GT-001` | `C2.PER.04` | 3 | Lô A |
| **Trang 17** | Bài 16 | Đổi chỗ hình màu trên đĩa tròn: tương quan vị trí A:B :: C:D | `WB21-D1` | `GT-011` | `C3.MTX.01` | 4 | Lô B - A2 |
| **Trang 18** | Bài 17 | Ánh xạ 5 chấm tròn xúc xắc sang 5 ô vuông màu tương ứng | `WB21-D1` | `GT-011` / `GT-001` | `C3.MTX.01` | 4 | Lô B - A2 |
| **Trang 19** | Bài 18 | Hợp nhất ma trận màu 6x6: Mảnh lớn khuyết lõi + Mảnh 7 ô bù | `WB21-D1` | `GT-001` | `C3.MTX.03` | 4 | Lô B - A2 |
| **Trang 20** | Bài 19 | Lát gạch đa khối polyomino lấp đầy kim tự tháp bậc thang 20 ô | `WB21-D1` | `GT-001` | `C3.MTX.03` | 4 | Lô B - A2 |
| **Trang 21** | Bài 20 | Mật mã số bảng 2x2 tích số & chuỗi chấm xúc xắc quy luật | `WB21-D2` | `GT-011` | `C3.MTX.02` | 4 | Lô B - A2 |
| **Trang 22** | Bài 21 | Bánh xe bội số (2, 3, 4), tam giác số nhân chia & ma trận 3x3 ký hiệu | `WB21-D2` | `GT-011` | `C3.MTX.02` | 5 | Lô B - A2 |
| **Trang 23** | Bài 22 | Ba khóa số trung tâm mở cửa kho báu (Trung bình cộng & Chuỗi liên tiếp) | `WB21-D2` | `GT-001` / `GT-011` | `C3.MTX.02` | 5 | Lô B - A2 |
| **Trang 24** | Tổng kết | Hoàn thành 21 thử thách, trao Viên Ngọc Tư Duy & Huy Hiệu Toàn Năng | Vinh danh | `GT-000` | Đánh giá | 1 | — |

---

### 4.2 Nhóm Dạng Bài Quy Chuẩn Theo Spec

Nhằm tối ưu hóa kiến trúc seeder và tuân thủ chặt chẽ `activity-types-table.md`, 24 trang PDF được tích hợp vào 3 nhóm dạng bài chuẩn mang mã ref `WB21-D1`, `WB21-D2`, `WB21-D3`:

#### 1. Dạng bài `WB21-D1`: Ma trận suy luận thuộc tính 2x2, Phép cộng ô lưới pixel & Khớp mộng hình học 2D
- **Trang nguồn**: Trang 2, 3, 4, 5, 13, 17, 18, 19, 20.
- **Bản chất sư phạm**:
  - Trẻ rèn luyện năng lực phân tích bộ phận - toàn thể (part-whole reasoning), ghép mộng bù khuyết (geometric complement) và suy luận tương quan vị trí hàm số ($A : B :: C : D$).
  - Trẻ theo dõi sự biến đổi các thuộc tính đơn lẻ hoặc kép: màu sắc, hình dạng, vị trí tọa độ $(x, y)$ trên lưới pixel $4 \times 4$, $5 \times 5$, $6 \times 6$ và đĩa tròn xoay.
- **Khuôn trò chơi tương thích**:
  - `GT-011` (`MatrixPickSession`): Ma trận $2 \times 2$ chọn hình biến đổi thuộc tính tương quan.
  - `GT-001` (`TapSelectSession`): Chạm chọn kết quả phép cộng mảnh pixel hoặc bộ combo polyomino chính xác.
- **Strand gắn kết**: `C3.MTX` (kỹ năng `C3.MTX.01`, `C3.MTX.03`).

#### 2. Dạng bài `WB21-D2`: Ma trận quy luật 3x3, Chu kỳ biến đổi ký hiệu & Mật mã số học
- **Trang nguồn**: Trang 21, 22, 23.
- **Bản chất sư phạm**:
  - Đỉnh cao của tư duy định lượng và suy luận logic tiền tiểu học: trẻ chuyển từ quan sát hình ảnh sang phát hiện quy luật hàm số ẩn giữa các con số và ký hiệu trừu tượng.
  - Các cấu trúc toán học phong phú: ma trận $2 \times 2$ tích số ($a \times b \times c = d$), bánh xe nan quạt bội số tuần hoàn ($+2, +3, +4$), tam giác số nhân chia, ma trận $3 \times 3$ dịch chuyển chu kỳ ký hiệu (chấm đen, dấu cộng, dấu hỏi theo chiều kim đồng hồ) và tính toán số tâm đối xứng.
- **Khuôn trò chơi tương thích**:
  - `GT-011` (`MatrixPickSession`): Lưới ma trận $3 \times 3$ chọn ký hiệu hoặc số khuyết.
  - `GT-001` (`TapSelectSession`): Chọn số mở khóa trong các phương án trắc nghiệm.
- **Strand gắn kết**: `C3.MTX` (kỹ năng `C3.MTX.02`).

#### 3. Dạng bài `WB21-D3`: Ma trận xoay hình học, Đối xứng gương & Hình chiếu không gian 3D
- **Trang nguồn**: Trang 6, 7, 8, 9, 10, 11, 12, 14, 15, 16.
- **Bản chất sư phạm**:
  - Năng lực chuyển đổi hệ tọa độ thị giác và xoay chuyển vật thể trong tâm trí (Mental Rotation & Spatial Perspective).
  - Trẻ phân biệt rõ nét giữa:
    - Ảnh phản chiếu qua trục gương thẳng đứng (Mirror symmetry across vertical axis).
    - Phép nghịch đảo/xoay 180 độ (Inversion rotation).
    - Hình chiếu vuông góc từ trên đỉnh xuống (Orthographic top-down view / Plan view).
    - Hình chiếu bên cạnh theo tầm mắt người quan sát (Side elevation view).
- **Khuôn trò chơi tương thích**:
  - `GT-011` (`MatrixPickSession`): Ma trận ô vuông chọn bảng đối xứng gương trục đứng.
  - `GT-001` (`TapSelectSession`): Chạm chọn hình chiếu 2D phẳng khớp với mô hình phối cảnh 3D.
- **Strand gắn kết**: `C2.ROT` (`C2.ROT.01`, `C2.ROT.02`) và `C2.PER` (`C2.PER.03`, `C2.PER.04`).

---

## 5. Thiết Kế SkillDataset Cho Database Seeder

Kho ngữ liệu `SkillDataset` được làm giàu với các vật phẩm, quy luật và câu thoại lấy cảm hứng từ thế giới kỳ ảo của Căn Phòng Suy Luận Chặng 21:

### 5.1 Ngữ Liệu Ma Trận Suy Luận (`C3.MTX.01`, `C3.MTX.02`, `C3.MTX.03`)

#### Items & Emoji Bổ Sung:
- `secret_room_gate`: Cánh cổng bí mật phong ấn mạ vàng (emoji 🚪).
- `thinking_core_gem`: Viên ngọc tư duy hổ phách đa giác 3D (emoji 💎).
- `matrix_bead_purple`, `matrix_bead_yellow`, `matrix_bead_cyan`: Hạt ngũ giác màu (emoji 🟣, 🟡, 🔷).
- `honeycomb_tile_pink`, `honeycomb_tile_green`: Mảnh tổ ong lục giác (emoji 🌸, 🟢).
- `pixel_grid_4x4`, `pixel_grid_5x5`, `pixel_grid_6x6`: Khung ô lưới pixel (emoji 🔲, ⬛).
- `polyomino_t_block`: Khối đa giác chữ T 4 ô (emoji 🧩).
- `polyomino_step_pyramid`: Kim tự tháp bậc thang 20 ô (emoji 🏛️).
- `analogy_dial_green`: Đĩa xoay tương quan 4 hướng (emoji 🎛️).
- `dice_dots_five`: Mặt xúc xắc 5 chấm vàng biến đổi (emoji 🎲).
- `number_wheel_mult_3`: Bánh xe số bội số nan quạt (emoji ☸️).
- `cyclic_symbol_plus`, `cyclic_symbol_dot`: Ký hiệu chu kỳ ma trận 3x3 (emoji ➕, ⚫).

#### Câu Thoại Dẫn Dắt (Phrasing) Chuẩn Sư Phạm (`gau_logic` & `tho_quan_sat`):
- **Prompt (Chỉ dẫn bé)**:
  - *"Bé quan sát quy luật hàng ngang và cột dọc để tìm hình còn thiếu nhé!"*
  - *"Mảnh nhỏ sẽ nằm ở đâu trong khung hình? Bé ghép thử bằng mắt nào!"*
  - *"Theo dõi sự biến đổi vị trí trước và sau mũi tên để tìm hình tương quan nhé!"*
  - *"Mỗi con số đều có mối liên hệ ẩn giấu! Bé tìm số bí mật để mở ổ khóa nhé!"*
- **Gợi ý leo thang 3 cấp độ (Scaffolding)**:
  - *Cấp 1 (Nudge - Nhắc nhẹ)*: *"Bé nhìn kỹ màu sắc ở hàng trên cùng trước nhé!"*
  - *Cấp 2 (Guided - Hướng dẫn)*: *"Cột bên trái đang đổi màu như thế nào? Cột bên phải cũng sẽ đổi y hệt như vậy đấy!"*
  - *Cấp 3 (Demonstration - Trình diễn/Ghost Hand)*: Bàn tay ảo chỉ vào ô khuyết và viền sáng nhấp nháy ô đáp án tương ứng.
- **Ăn mừng hoàn thành (Celebration)**:
  - *"Kỳ diệu quá! Bé đã giải mã thành công ma trận bí mật!"*
  - *"Thật thông minh! Cánh cổng Căn phòng Suy luận đã rung chuyển mở ra một nấc rồi!"*

---

### 5.2 Ngữ Liệu Xoay Hình & Đối Xứng Trục Gương (`C2.ROT.01`, `C2.ROT.02`)

#### Items & Emoji Bổ Sung:
- `mirror_axis_vertical`: Trục gương thẳng đứng nét đứt (emoji 🪞).
- `inverted_bead_rack`: Chuỗi hạt treo ngược 180 độ từ xà ngang (emoji 📿).
- `isometric_tri_pattern`: Cụm tam giác trắng trên lưới đẳng diện (emoji 🔺).
- `pentagon_apex_clockwise`: Đỉnh chóp ngũ giác nan hoa xoay vòng (emoji 🎪).

#### Câu Thoại Dẫn Dắt (Phrasing):
- **Prompt**:
  - *"So sánh các chuỗi hạt và tìm cặp hình đối xứng đảo ngược nhé!"*
  - *"Tấm gương thần đặt ở trục nét đứt sẽ phản chiếu hình nào ở bên phải nhỉ?"*
  - *"Theo dõi thứ tự các nan hoa xoay theo chiều kim đồng hồ nhé!"*
- **Scaffolding**:
  - *Cấp 1*: *"Hạt màu ở gần trục gương nhất sẽ phản chiếu ở vị trí gần gương nhất đấy!"*
  - *Cấp 2*: *"Chuỗi hạt treo chúc đầu xuống giống như chiếc cọc đứng bị lộn ngược 180 độ!"*

---

### 5.3 Ngữ Liệu Hình Chiếu Không Gian 3D (`C2.PER.03`, `C2.PER.04`)

#### Items & Emoji Bổ Sung:
- `top_view_cube_tower`: Khối tháp lập phương bậc thang nhìn từ đỉnh (emoji 🏢).
- `u_shaped_tower_3d`: Khối kiến trúc chữ U đa tầng (emoji 🏰).
- `wireframe_cube_rods`: Khung que lập phương có que chéo mặt đáy (emoji 📦).
- `origami_plane_wings`: Máy bay giấy gấp cánh tương phản màu (emoji ✈️).
- `side_view_horizontal_bars`: Khối thanh ngang nhiều tầng nhìn từ mạn sườn (emoji 📐).

#### Câu Thoại Dẫn Dắt (Phrasing):
- **Prompt**:
  - *"Tưởng tượng mình là chú chim bay trên trời cao nhìn thẳng xuống khối hình nhé!"*
  - *"Đừng để các khối nhô cao che mất các bậc thấp ở phía sau bé nhé!"*
  - *"Đặt mình vào vị trí bạn nhỏ đứng bên cạnh trái để chọn hình chiếu sườn nào!"*

---

## 6. Kế Hoạch 12 SkillLevelPlan[] Chi Tiết (Chuẩn Montessori Levels)

Mọi level được thiết kế với sequence $\ge 0101$, tuân thủ quy tắc phân bổ `access_tier` khớp `difficulty` (1=`free`, 2=`login`, 3=`standard`, 4/5=`premium`):

| STT | Mã Level Plan | Kỹ Năng | Dạng Bài Ref | Engine | Diff | Tier | Tên Bài Học & Mô Tả Tương Tác Sư Phạm |
|:---:|---|:---:|:---:|:---:|:---:|:---:|---|
| 1 | `GL-C2-PER-TAP-0101` | `C2.PER.03` | `WB21-D3` | `GT-001` | 1 | `free` | **Bầu Trời Nhìn Xuống — Tháp Khối Lập Phương**<br>Trẻ đứng từ góc nhìn trên cao chọn hình chiếu bằng 2D phẳng đúng của tháp khối lập phương 3D bậc thang màu vàng/tím/lam. |
| 2 | `GL-C2-PER-TAP-0102` | `C2.PER.03` | `WB21-D3` | `GT-001` | 2 | `login` | **Đôi Cánh Diệu Kỳ — Hình Chiếu Khung Que & Máy Bay Giấy**<br>Nhìn từ trên đỉnh xác định đường chéo thanh que gia cố ở đáy khung lập phương và màu sắc hai cánh máy bay giấy 3D. |
| 3 | `GL-C3-MTX-TAP-0101` | `C3.MTX.03` | `WB21-D1` | `GT-001` | 2 | `login` | **Mảnh Ghép Pixel — Phép Cộng Lưới Màu 4x4**<br>Thực hiện phép cộng gộp không gian: [Mảnh A] + [Mảnh B] = [ ? ] để chọn khối vuông hoàn chỉnh 4x4 khớp chính xác màu từng tọa độ. |
| 4 | `GL-C3-MTX-MATRX-0101` | `C3.MTX.01` | `WB21-D1` | `GT-011` | 2 | `login` | **Cửa Sổ Bí Mật — Ma Trận Thuộc Tính 2x2**<br>Giải mã ma trận logic $2 \times 2$: phân tích quy luật đổi màu hoặc biến đổi hình dạng theo hàng và cột để chọn phần tử còn thiếu vào ô `?`. |
| 5 | `GL-C3-MTX-TAP-0102` | `C3.MTX.03` | `WB21-D1` | `GT-001` | 3 | `standard` | **Mảnh Khuyết Chữ T — Khung Vuông 5x5 Hoàn Hảo**<br>Quan sát khung 5x5 khuyết lõi chữ T và mảnh bù 4 ô màu sắc, chọn hình kết quả điền khít hoàn hảo không lệch màu. |
| 6 | `GL-C2-ROT-TAP-0101` | `C2.ROT.01` | `WB21-D3` | `GT-001` | 3 | `standard` | **Chuỗi Hạt So Gương — Lộn Ngược Không Gian 180°**<br>So sánh dãy chuỗi hạt cọc treo ngược từ xà với cọc đứng từ đế để tìm cặp chuỗi hạt có cấu trúc đối xứng nghịch đảo 180 độ. |
| 7 | `GL-C2-ROT-MATRX-0101` | `C2.ROT.02` | `WB21-D3` | `GT-011` | 3 | `standard` | **Gương Thần Trục Dọc — Đối Xứng Hoa Văn Hạt Màu**<br>Phân tích bảng hạt màu 5x6 ô và tìm bảng ảnh phản chiếu gương qua trục nét đứt thẳng đứng ở bên phải. |
| 8 | `GL-C3-MTX-MATRX-0102` | `C3.MTX.01` | `WB21-D1` | `GT-011` | 3 | `standard` | **Vòng Xoay Tương Quan — Quy Tắc Chuyển Đổi Vị Trí**<br>Giải câu đố suy luận tương quan $A : B :: C : D$ trên đĩa tròn 4 hướng: nhận diện quy tắc chuyển đổi màu sắc/hình học từ A sang B để tìm D từ C. |
| 9 | `GL-C3-MTX-TAP-0103` | `C3.MTX.01` | `WB21-D1` | `GT-001` | 3 | `standard` | **Xúc Xắc Đổi Màu — Ánh Xạ Chấm Sang Ô Vuông**<br>Ánh xạ tọa độ 5 chấm tròn xúc xắc sang 5 ô vuông màu tương ứng theo quy luật chuyển dịch thuộc tính vị trí. |
| 10 | `GL-C3-MTX-MATRX-0103` | `C3.MTX.02` | `WB21-D2` | `GT-011` | 4 | `premium` | **Bánh Xe Bội Số — Chu Kỳ Ký Hiệu Ma Trận 3x3**<br>Khám phá quy luật bánh xe số bội số của 2, 3, 4 và ma trận $3 \times 3$ dịch chuyển ký hiệu chấm đen, dấu cộng theo chiều kim đồng hồ. |
| 11 | `GL-C3-MTX-MATRX-0104` | `C3.MTX.02` | `WB21-D2` | `GT-011` | 4 | `premium` | **Mật Mã Số Học — Bảng Tích Số & Tam Giác Liên Hoàn**<br>Giải mã bảng số ma trận $2 \times 2$ có quy luật tích số ($a \times b \times c = d$) và tam giác số học liên kết đỉnh để tìm số còn thiếu. |
| 12 | `GL-C3-MTX-TAP-0105` | `C3.MTX.02` | `WB21-D2` | `GT-001` | 5 | `premium` | **Chìa Khóa Kho Báu — Ba Mật Mã Trung Tâm Mở Cổng**<br>Thử thách tối thượng: giải mã 3 khóa số trung tâm (trung bình cộng vòng tròn 3 cánh, chuỗi liên tiếp hình vuông) để mở toang Căn Phòng Bí Mật. |

---

## 7. Kiến Trúc Game Engine & Canvas 2D Contracts

### 7.1 Khuôn `GT-011` (`MatrixPickSession` — Ma Trận Chọn Hình Khuyết)
- **Cấu trúc màn hình**:
  - Vùng ma trận trung tâm: Hiển thị lưới ô vuông $2 \times 2$ hoặc $3 \times 3$ với tỷ lệ co giãn phù hợp, viền claymorphism bo góc 16px.
  - Ô mục tiêu: Ô góc dưới-phải mang ký hiệu dấu hỏi `?` phát sáng nhịp thở nhẹ nhàng (`breathing effect`).
  - Khay lựa chọn phía dưới: Chứa 4 đến 6 phương án trắc nghiệm (options pad), mỗi nút chạm có đường kính tối thiểu $\ge 64$px (đạt chuẩn touch floor cho trẻ mầm non).
- **Quy tắc tương tác**:
  - Trẻ chạm chọn 1 phương án trong khay. Mảnh được chọn bay nhẹ và khớp vào ô dấu hỏi `?`.
  - Nếu đúng: Hiệu ứng pop hạt màu tươi sáng (`brand-600`), âm thanh 'ding' trong trẻo nhẹ nhàng (ramp in $\ge 20$ms), chuyển màn sau 600ms.
  - Nếu sai: Ô đáp án rung nhẹ nhịp hổ phách (`amber_soft`), trôi êm về khay cũ, tuyệt đối không có âm thanh buzzer hay màu đỏ trừng phạt.

### 7.2 Khuôn `GT-001` (`TapSelectSession` — Chạm Chọn Đáp Án Đúng)
- **Cấu trúc màn hình**:
  - Vùng câu hỏi trực quan: Hiển thị hình vẽ 3D chiếu phối cảnh (tháp lập phương, máy bay giấy, khối chữ T, hoặc 3 khóa số trung tâm).
  - Vùng đáp án: Bố trí từ 3 đến 4 thẻ lựa chọn rõ ràng, tương phản cao, phông chữ số to rõ $\ge 24$px.
- **Tính năng hỗ trợ trực giác**:
  - Hỗ trợ nút xoay góc nhìn camera ảo (từ phối cảnh 3D nghiêng trượt sang góc nhìn 2D nhìn từ trên xuống) đối với các bài toán hình chiếu không gian.

### 7.3 Bất Biến Canvas 2D & Hiệu Năng
- Kích thước không gian logic cố định: **960x540**, scale mượt mà theo DPR thiết bị.
- Token Only: 100% màu sắc và phông chữ gọi từ `systems/designTokens.ts`, không sử dụng bất kỳ hex literal nào.
- Hiệu năng: 60fps RAF loop thuần TypeScript, không nhúng reactivity hay framework Vue/Pinia vào hot path.

---

## 8. Kế Hoạch Triển Khai & Kiểm Thử Chất Lượng

1. **Cập nhật Bảng Tra Dạng Bài (`activity-types-table.md`)**:
   - Cập nhật các hàng `WB21-D1`, `WB21-D2`, `WB21-D3`, `WB21-D4` từ trạng thái hoãn/thiếu sang trạng thái sẵn sàng nạp với các khuôn `GT-011` và `GT-001`.
   - Xóa bỏ mọi tham chiếu tới `GT-058`.
2. **Cập nhật Bảng Ánh Xạ Corpus (`montessori-corpus-mapping.md`)**:
   - Đồng bộ thông tin hàng Workbook 21 tại Bảng 7.1: Ghi nhận competency chính `C3` (`C3.MTX`) kết hợp `C2` (`C2.ROT`, `C2.PER`), khuôn `GT-011` và `GT-001`.
   - Cập nhật hạn ngạch và số level đã soạn tại Bảng 7.9.
3. **Cập nhật Seeder Files trong `packages/content/src/skills/`**:
   - Bổ sung `SkillDataset` và 12 `SkillLevelPlan[]` vào các file:
     - `packages/content/src/skills/c3/mtx/C3.MTX.01.ts`
     - `packages/content/src/skills/c3/mtx/C3.MTX.02.ts`
     - `packages/content/src/skills/c3/mtx/C3.MTX.03.ts` (đồng thời làm sạch từ "Raven" trong LO)
     - `packages/content/src/skills/c2/rot/C2.ROT.01.ts`
     - `packages/content/src/skills/c2/rot/C2.ROT.02.ts`
     - `packages/content/src/skills/c2/per/C2.PER.03.ts`
4. **Kiểm Tra & Xác Thực (Verification Gates)**:
   - `pnpm --filter @mindkid/content typecheck` đảm bảo không lỗi kiểu dữ liệu.
   - `pnpm --filter @mindkid/content-build seed:check` đảm bảo toàn bộ level vượt qua các cổng kiểm định Montessori (`montessori-gate.ts`).
