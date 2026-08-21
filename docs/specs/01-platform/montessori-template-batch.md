---
spec: MONTESSORI-TEMPLATE-BATCH
title: Lô khuôn trò chơi Montessori — mười một cơ chế còn thiếu
area: platform
status: approved
mvp: false
phase: P4
reviewed: 2026-08-20
owns:
  - Danh mục mười một khuôn trò chơi lô Montessori
  - Thứ tự cấp mã GT cho lô Montessori
  - Điều kiện nghiệm thu một khuôn lô Montessori
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - GAME-TEMPLATE-CONTRACT
  - TEMPLATE-AUTHORING-KIT
  - GAME-LAYOUT-ENGINE
  - DETERMINISTIC-RANDOMNESS
---

# Lô khuôn trò chơi Montessori — mười một cơ chế còn thiếu

## 1. Objective

Mục 7.3 của [`montessori-corpus-mapping.md`](../05-content/montessori-corpus-mapping.md) đếm được mười một cơ chế chơi mà corpus
Montessori cần và sáu khuôn hiện có không phục vụ được. File này biến danh sách đó thành một
danh mục có mã, có band tuổi, có giới hạn và có điều kiện nghiệm thu.

Nó tồn tại vì hai lý do. Thứ nhất, mã `GT-*` bất biến — cấp mã bừa là hỏng vĩnh viễn. Thứ hai,
câu hỏi mở số 2 của [`game-template-contract.md`](game-template-contract.md) từng hoãn khuôn thứ bảy trở đi sang P4 với
lý do chi phí; [`template-authoring-kit.md`](template-authoring-kit.md) đã hạ chi phí đó xuống một file mô tả, nên câu
hỏi cần được trả lời bằng một danh mục chứ không bằng một lần hoãn nữa.

**Mã cấp theo chi phí, không theo thứ tự bảng nguồn.** Đo trên `packages/game-engine/src` ngày
2026-08-20: bốn nguyên thuỷ cơ chế đã có (`ordering`, `pairing`, `placement`, `selection`),
mười hai layout đã có, và **không** system nào cho hẹn giờ, mê cung, cân, ràng buộc lưới, xoay
kim hay phối cảnh đẳng cự. Chi phí thật của một khuôn nằm ở chỗ đó, nên `GT-007` tới `GT-011`
là nhóm chỉ cần layout mới, còn `GT-012` tới `GT-017` là nhóm mỗi khuôn kéo theo một system.
Đọc mã là biết ngay khuôn thuộc lớp chi phí nào.

File này **không** định nghĩa `content_contract` của từng khuôn — đó là code, thuộc
[`game-template-contract.md`](game-template-contract.md) mục 7.1. Nó định nghĩa khuôn nào tồn tại, mã nào, và khi nào một
khuôn được coi là xong.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Dev | — | Cấp mã theo mục 7.1, viết file mô tả và Session class, chạy bộ sinh mã |
| Người review PR | — | Đối chiếu khuôn mới với điều kiện nghiệm thu mục 7.5 |
| Người biên soạn | `content_reviewer` | Đọc mục 7.1 để biết khuôn nào đã có, dạng bài lô B nào mở khoá được |
| Manager | `super_admin` | Không đụng gì ở đây. Khuôn là Lớp 1 — `BR-GTC-04` (Lớp 1) |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/src/templates/<mã khuôn>/template.ts` | Dev | File mô tả, viết tay |
| `packages/game-engine/src/templates/<mã khuôn>/session.ts` | Dev | Session class, viết tay |
| `packages/game-engine/src/mechanics/` | Dev | Bốn nguyên thuỷ dùng lại; nhóm A không thêm file ở đây |
| `packages/game-engine/src/layout/registry.ts` | Dev | Nơi bảy `LayoutId` mới của nhóm A được đăng ký |
| `packages/game-engine/src/layout/geometry.ts` | Dev | Chỉ chạm nếu một `LayoutId` không ánh xạ được sang bốn hàm lõi |
| `packages/game-engine/src/systems/` | Dev | Nơi sáu system mới của nhóm B nằm |
| `pnpm --filter @mindkid/game-engine gen:templates` | Dev | Sinh registry và điểm nối, theo [`template-authoring-kit.md`](template-authoring-kit.md) |
| `packages/db/src/seed-master/game-templates.ts` | Dev | Seed Lớp 1 sau khi khuôn xanh |

## 4. Main flow — ship một khuôn lô Montessori

1. Lấy hàng tiếp theo chưa làm trong mục 7.1; mã đã cấp sẵn ở cột đầu, cấm chọn lại.
2. Nhóm A: đăng ký layout mới vào registry trước, kèm hàm hình học và test riêng.
   Nhóm B: viết system mới dưới `systems/` trước, kèm test riêng.
3. Viết `template.ts`: `content_contract`, `difficulty_contract`, `limits`, band tuổi,
   `layouts`, `mechanic`, `scoring`, `events`.
4. Viết `session.ts` dựng trên nguyên thuỷ cơ chế đã có; nhóm B gọi thêm system của chính nó.
5. Lấy bố cục từ [`game-layout-engine.md`](game-layout-engine.md); lấy mọi thứ xáo trộn từ [`deterministic-randomness.md`](deterministic-randomness.md).
6. Chạy `pnpm --filter @mindkid/game-engine gen:templates`.
7. Viết ít nhất ba game level mẫu từ workbook nguồn ghi ở cột cuối mục 7.1.
8. Viết journey E2E cho khuôn.
9. Chạy đủ điều kiện nghiệm thu mục 7.5; đỏ một mục thì khuôn chưa xong.
10. Mở PR; merge là phát hành khuôn.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Cơ chế hoá ra dựng được trên khuôn đã có | Phát hiện lúc viết `content_contract` | Bỏ hàng khỏi mục 7.1, **không tái dùng mã**, ghi lý do vào mục 11 |
| Hai hàng hội tụ về một cơ chế | Ví dụ cây tách gộp phạm vi 10 và 20 | Một khuôn, khác `difficulty_params`. Cấm hai mã cho một mechanic |
| Khuôn nhóm A hoá ra cần một system | Phát hiện lúc viết Session class | Khuôn **chuyển sang lớp chi phí nhóm B** và xếp lại lịch. Mã giữ nguyên — mã bất biến, nhóm chỉ là nhãn chi phí |
| Khuôn không đạt band tuổi đã khai | Thử với trẻ cho kết quả khác | Thu hẹp `age_min` và `age_max`, cập nhật mục 7.1, và dời dạng bài tương ứng sang band khác ở bảng ánh xạ |
| Khuôn cần asset ngoài `emoji` và `image` | Ví dụ video, mô hình ba chiều | **Ask first.** Sáu khuôn hiện có đã khai `emoji`, `image`, `audio`; thêm loại thứ tư kéo theo storage mới |
| Bộ sinh mã không sinh hết điểm nối | Còn nơi phải sửa tay | Sửa bộ sinh mã, không sửa tay điểm nối. Sửa tay là quay lại đúng chi phí mà kit tồn tại để bỏ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MTB-01` (mã cấp tuần tự) | Mã lô Montessori là `GT-007` tới `GT-017`, cấp **tuần tự** theo mục 7.1, cấm bỏ trống số ở giữa | [`id-conventions.md`](../00-foundation/id-conventions.md) — mã bất biến. Số bỏ trống là một lỗ hổng sẽ có người lấp bằng một khuôn không liên quan |
| `BR-MTB-02` (mã cấp theo lớp chi phí) | Cấp mã theo **lớp chi phí**: `GT-007` tới `GT-011` chỉ cần layout mới, `GT-012` tới `GT-017` mỗi khuôn kéo theo một system engine | Bảng nguồn xếp theo thứ tự bài học, không theo chi phí xây. Cấp mã theo bảng nguồn làm dãy mã không nói được gì về công phải bỏ ra, và mọi kế hoạch cắt phạm vi phải tra bảng khác |
| `BR-MTB-03` (một mechanic một khuôn) | Mỗi giá trị `mechanic` chỉ có **một** khuôn. Khác độ khó thì khác `difficulty_params`, không khác mã | `BR-GTC-03` (tách nội dung khỏi độ khó) — hai mã cho một cơ chế làm báo cáo phủ đếm hai lần một thứ |
| `BR-MTB-04` (mechanic phải đăng ký) | Giá trị `mechanic` của khuôn mới phải có trong từ vựng trục `mechanic` của [`content-tagging.md`](content-tagging.md) trước khi khuôn được seed | Trục `mechanic` là một trong ba chiều của [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md). Mechanic không đăng ký làm ô đa dạng cơ chế đếm sai mà không ai thấy |
| `BR-MTB-05` (fallback tap theo band) | Khuôn có cử chỉ kéo mà `age_min` bằng 3 hoặc 4 **bắt buộc** khai `requires_tap_fallback` và có đường xử lý chạm-chạm thật | `BR-GTC-06` (fallback tap) — kéo chính xác ở tuổi 3–4 là thiết kế sai, không phải độ khó cao |
| `BR-MTB-06` (ba level mẫu là điều kiện) | Khuôn chưa có **ít nhất ba** game level mẫu chạy được thì chưa nghiệm thu | Bước 4 mục 4 của [`game-template-contract.md`](game-template-contract.md) — một `content_contract` chưa từng được viết nội dung vào là một giả thuyết, không phải contract |
| `BR-MTB-07` (xáo trộn qua nguồn ngẫu nhiên có seed) | Mọi xáo trộn vị trí, thứ tự distractor, chọn biến thể phải đi qua [`deterministic-randomness.md`](deterministic-randomness.md) | `BR-LAY-08` giao việc xáo trộn cho spec ngẫu nhiên chứ không cho hàm layout. Xáo trộn tự phát làm phiên chơi không tái lập được lúc điều tra lỗi |
| `BR-MTB-08` (điểm nối do bộ sinh mã) | Cấm — **NEVER thêm mã khuôn mới vào một điểm nối bằng tay** | Mục 1 của [`template-authoring-kit.md`](template-authoring-kit.md) — chi phí sửa tay mười một nơi là lý do kit tồn tại. Một lần sửa tay là một nơi sẽ bị bỏ sót ở khuôn sau |
| `BR-MTB-09` (khuôn không gắn skill) | Khuôn lô Montessori **không gắn** skill, competency hay workbook nguồn trong code | `BR-GTC-01` (khuôn không gắn skill) — cột workbook nguồn ở mục 7.1 là ghi chú xuất xứ cho người, cấm thành field |
| `BR-MTB-10` (band tuổi hẹp hơn nguồn) | Khi band tuổi của khuôn hẹp hơn band của workbook nguồn, **khuôn thắng**; dạng bài dời band hoặc chờ | `BR-GTC-05` (band tuổi) ép ở cổng seed. Nới band khuôn để nội dung vừa là đổi quyết định thiết kế bằng áp lực lịch |
| `BR-MTB-11` (lô B mở khoá theo khuôn) | Một dạng bài lô B chỉ được soạn khi khuôn tương ứng đã `active` trong `game_templates` | Soạn nội dung cho khuôn chưa có nghĩa là nội dung không kiểm được bằng `content_contract` — đúng thứ mà `BR-GTC-02` (parse ở server) tồn tại để chặn |
| `BR-MTB-12` (không mở rộng asset im lặng) | Khuôn cần loại asset ngoài `emoji`, `image`, `audio` phải **Ask first** trước khi viết `template.ts` | Mỗi loại asset mới kéo theo storage, quyền, và ngân sách ở [`performance-budgets.md`](../08-quality/performance-budgets.md). Phát hiện điều đó sau khi Session class đã xong là quá muộn |
| `BR-MTB-13` (layout đăng ký trước Session) | Layout mới của nhóm A phải vào registry của [`game-layout-engine.md`](game-layout-engine.md) **trước** khi viết Session class, kèm hàm hình học và test riêng | `BR-LAY-02` ném `LAYOUT_NOT_SUPPORTED` cho layout ngoài registry. Viết Session trước rồi mới thêm layout nghĩa là Session được thử trên toạ độ cứng, và toạ độ cứng sống sót qua review |
| `BR-MTB-14` (kiểm soát lỗi tự thân) | Mỗi khuôn phải cho trẻ **tự nhận ra sai** từ chính vật liệu, trước khi bất kỳ phản hồi đúng-sai nào của hệ thống chạy | Nguyên lý kiểm soát lỗi của nguồn (mục 7.0 của [`montessori-corpus-mapping.md`](../05-content/montessori-corpus-mapping.md)): hình không khớp khuôn, tổng hai bên không cân, lưới lặp giá trị. Khuôn nào chỉ báo sai bằng dấu đỏ là đã bỏ đúng thứ làm giáo cụ Montessori hoạt động |
| `BR-MTB-15` (system mới có test riêng) | Mỗi system của nhóm B có bộ test **độc lập với khuôn dùng nó** | Một system chỉ được thử gián tiếp qua một khuôn thì lỗi của nó bị đọc nhầm thành lỗi của khuôn, và nó không tái dùng được cho khuôn thứ hai |

## 7. Data

**Đọc:** mục 7.1 và 7.3 của [`montessori-corpus-mapping.md`](../05-content/montessori-corpus-mapping.md).
**Ghi:** `game_templates` Lớp 1, qua seeder, sau khi khuôn nghiệm thu.

### 7.0 Năng lực engine đo được, 2026-08-20

| Thứ | Đã có | Chưa có |
|---|---|---|
| Nguyên thuỷ cơ chế | `ordering` · `pairing` · `placement` · `selection` | không cần thêm |
| Layout | **18** `LayoutId` trên **11** hàm hình học (4 lõi + 7 riêng) | 1 `LayoutId` còn lại của nhóm A: `equation-rows` |
| System | audio · feedback · render · scaffolding · sfx · speech · degradation · design token · **`mazeSystem`** (T99 WP99.3) | 5 system còn lại của nhóm B |
| Nguồn ngẫu nhiên có seed | có | — |
| Loại asset khuôn nhận | `emoji` · `image` · `audio` | — |
| Bậc gợi ý | L1 highlight · L2 ghost hand tốc độ thật · L3 ghost hand 0,5× lặp | — |

Ba hàng đầu là toàn bộ chi phí của lô này. Hàng cuối đáng chú ý: ba bậc gợi ý của engine khớp
**một-một** với ba mức Nudge, Guidance, Demo mà nguồn mô tả, nên phần gợi ý của 18 workbook
còn thiếu là việc viết lời, không phải việc xây cơ chế.

### 7.1 Danh mục mười một khuôn

**Nhóm A — chỉ cần layout mới.** Dùng lại bốn nguyên thuỷ đã có, không thêm system.

| Mã | Tên | `mechanic` | Nguyên thuỷ | Layout mới | Band | Fallback tap | Workbook nguồn |
|---|---|---|---|---|:--:|:--:|---|
| `GT-007` | Cây tách gộp | `number-bond` | `placement` | `number-bond-tree` · `ten-frame-split` | 3–6 | Có | 07 · 08 · 13 |
| `GT-008` | Kéo vào ô khuyết | `drag-to-slot` | `placement` | `horizontal-slot-track` · `matrix-slot-grid` | 4–6 | Có | 02 · 11 · 15 |
| `GT-009` | Loại trừ theo manh mối | `clue-deduction` | `selection` | `clue-board` | 4–6 | Không | 14 |
| `GT-010` | Thay thế biểu tượng | `substitution` | `selection` | `equation-rows` | 4–6 | Không | 12 · 20 |
| `GT-011` | Ma trận chọn hình | `matrix-choice` | `selection` | `matrix-3x3` | 5–6 | Không | 15 · 21 |

**Nhóm B — mỗi khuôn kéo theo một system engine mới.**

| Mã | Tên | `mechanic` | System mới | Nguyên thuỷ | Band | Fallback tap | Workbook nguồn |
|---|---|---|---|---|:--:|:--:|---|
| `GT-012` | Nhìn chớp rồi nhớ lại | `flash-recall` | `timerSystem` | `selection` | 3–6 | Không | 04 |
| `GT-013` | Tìm đường mê cung | `maze-route` | `mazeSystem` | `ordering` | 4–6 | Có | 09 |
| `GT-014` | Cân hai bên | `balance-scale` | `balanceSystem` | `placement` | 5–6 | Có | 16 |
| `GT-015` | Lưới không lặp | `sudoku-mini` | `constraintSystem` | `placement` | 5–6 | Có | 17 |
| `GT-016` | Xoay kim đồng hồ | `clock-hands` | `rotationSystem` | `placement` | 5–6 | Có | 18 |
| `GT-017` | Xếp khối và phối cảnh | `block-stack` | `isometricSystem` | `selection` | 5–6 | Không | 19 |

Cột `Workbook nguồn` là ghi chú xuất xứ cho người đọc, cấm thành field trong code
(`BR-MTB-09`). Giới hạn `limits` chốt trong file mô tả của từng khuôn và phải nằm trong trần
theo band ở mục 7.1 của [`game-level-model.md`](../05-content/game-level-model.md).

### 7.2 Vì sao mười một, không phải ít hơn

| Cơ chế | Vì sao không gộp vào khuôn đã có |
|---|---|
| `number-bond` | Đích đến là **hai ô ràng buộc lẫn nhau** theo một tổng cố định, không phải một rổ độc lập như `drag-to-container` |
| `drag-to-slot` | Ô đích **có vị trí đúng duy nhất** trong một chuỗi; `drag-to-container` chấp nhận mọi vật trong nhóm |
| `clue-deduction` | Mỗi manh mối **thu hẹp tập ứng viên**; cần trạng thái loại trừ tích luỹ, và bảng ứng viên vượt trần 6 item của `GT-001` |
| `substitution` | Trạng thái mang **giá trị đã suy ra ở bước trước**; sáu khuôn hiện có đều không mang trạng thái giữa các bước |
| `matrix-choice` | Đáp án đúng suy ra từ **quan hệ hai chiều** giữa các ô, không từ thuộc tính của một vật |
| `flash-recall` | Kích thích **biến mất trước khi** trẻ trả lời; mọi khuôn hiện có giữ kích thích trên màn hình |
| `maze-route` | Đầu vào là một **đường đi**, không phải một lựa chọn |
| `balance-scale` | Phản hồi là **liên tục** theo tổng khối lượng hai bên, không phải đúng hoặc sai |
| `sudoku-mini` | Một ô đúng hay sai **phụ thuộc các ô khác**; kiểm thắng là kiểm ràng buộc toàn lưới |
| `clock-hands` | Đầu vào là **góc quay**, và hai kim ràng buộc nhau |
| `block-stack` | Đáp án phụ thuộc **khối bị che khuất**, thứ không hiển thị |

Bảng này là lý do lô B không ép được sang lô A (`BR-MCM-10`). Mỗi hàng nêu một thứ mà sáu
khuôn hiện có **không biểu diễn được**, không phải một thứ chúng làm kém hơn.

Hai hàng cần nói rõ vì trông như đã chạy được:

- `clue-deduction`: `GT-001` nhận tối đa **6** phương án và `prompt` tối đa **80** ký tự. Một
  bảng số 1 tới 10 với ba manh mối vượt cả hai trần, và việc gạch dần ứng viên không có chỗ
  biểu diễn trong contract của `GT-001`.
- `matrix-choice`: một ma trận ba nhân ba **dựng thành một ảnh** thì `GT-001` nhận được, vì nó
  khai `image` trong `asset_kinds`. Nhưng khi đó mỗi level cần một ảnh vẽ riêng, mất khả năng
  sinh biến thể từ dữ liệu, và không kiểm được quan hệ hàng-cột bằng `content_contract`.
  Khuôn riêng giữ ma trận ở dạng dữ liệu.

### 7.3 Bảy layout mới của nhóm A

`D-LB` đã gộp 12 `LayoutId` hiện có về **bốn hàm hình học lõi** — `computeGridLayout`,
`computeBipartiteLayout`, `computeMultiBucketLayout`, `computeTrackLayout` — cộng một hàm bọc
(`computeHorizontalRowLayout` chỉ gọi `computeGridLayout` với một hàng). Mỗi `LayoutId` là một
hàng registry ánh xạ một-một sang hàm lõi kèm tham số.

Bảy `LayoutId` mới của nhóm A, kèm hàm lõi dự kiến:

| Layout | Dùng cho | Hình dạng | Hàm lõi dự kiến |
|---|---|---|---|
| `number-bond-tree` | `GT-007` | Một đỉnh, hai nhánh con, đường nối | `computeBipartiteLayout` dọc, một nguồn hai đích |
| `ten-frame-split` | `GT-007` | Khung mười ô, chia theo màu | `computeGridLayout` cố định năm cột hai hàng |
| `horizontal-slot-track` | `GT-008` | Dải ô liền nhau, một tới ba ô trống, khay nguồn phía dưới | `computeTrackLayout` |
| `matrix-slot-grid` | `GT-008` | Lưới hai nhân hai hoặc ba nhân ba, ô trống mang dấu hỏi | `computeGridLayout` cố định cột |
| `clue-board` | `GT-009` | Bảng ứng viên kèm dải manh mối phía trên | `computeBipartiteLayout` dọc |
| `equation-rows` | `GT-010` | Hai tới ba dòng phương trình, mỗi dòng một hàng biểu tượng | `computeGridLayout` cố định cột |
| `matrix-3x3` | `GT-011` | Lưới ba nhân ba, ô cuối mang dấu hỏi, khay chọn phía dưới | `computeGridLayout` cố định ba cột |

Cột cuối là **giả thuyết, và nó đã bị bác bỏ ở năm hàng đầu.** Đo được:

| Layout | Giả thuyết | Đo được | Bằng chứng |
|---|---|---|---|
| `number-bond-tree` | Hàng registry | **Hàm riêng** `computeNumberBondTreeLayout` | T98 WP98.9 |
| `ten-frame-split` | Hàng registry | **Hàm riêng** `computeTenFrameSplitLayout` | T98 WP98.9 |
| `horizontal-slot-track` | Hàng registry | **Hàm riêng** `computeHorizontalSlotTrackLayout` | T98 WP98.9 |
| `matrix-slot-grid` | Hàng registry | **Hàm riêng** `computeMatrixSlotGridLayout` | T98 WP98.9 |
| `clue-board` | Hàng registry | **Hàm riêng** `computeClueBoardLayout` | T99 WP99.1 |
| `matrix-3x3` | Hàng registry | **Hàm riêng** `computeMatrix3x3Layout` | T99 WP99.2 |
| `equation-rows` | Hàng registry | Chưa đo | — |

`clue-board` bác bỏ giả thuyết bằng một số đo, không bằng ý kiến: `computeBipartiteLayout` dọc
xếp cả hai vùng trên **một hàng**, nên ở 10 ứng viên band 4-5 nó cho slot rộng 76px trải từ
28 tới 932 trong khi vùng an toàn là 32..928 — tràn lề và chạm sàn chạm cùng lúc. Ứng viên phải
**xuống hàng**, và không tham số nào của hàm lõi làm được điều đó. Test
`clue-board — bảng loại trừ của GT-009` giữ cả hai chiều: bảng mới nằm trong lề, và bipartite
vẫn tràn ở đúng ca đó.

`matrix-3x3` bác bỏ giả thuyết vì lý do khác `clue-board`: `computeGridLayout` chỉ sinh **một
vùng `neutral`** duy nhất, không tách được ô ma trận với thẻ chọn, nên không tham số nào cho ra
hai vai trò slot. `computeMatrixSlotGridLayout` cũng không thay được — nó đặt khay bên **phải**,
còn mục 7.3 đòi khay nằm **dưới**.

Giả định mặc định cho hàng cuối (`equation-rows`) giờ là **cần hàm riêng**, không phải hàng
registry. Hàm mới nằm ở `geometry.ts` và có test riêng như bốn hàm lõi.

**Nợ phát hiện lúc đo (T99 WP99.2).** Quét BR-LAY-09 trên đúng dải `limits` mà từng khuôn khai
cho thấy sáu cặp khuôn-layout đặt slot ra ngoài lề an toàn — test BR-LAY-09 cũ chỉ gọi mỗi
layout một lần với `slotCount: 4` nên không thấy. `GT-008` · `matrix-slot-grid` đã sửa (336 slot
tràn về 0); năm cặp còn lại ghi ở `packages/game-engine/tests/layout-safe-area-debt.json` và có
cổng chặn nợ lớn thêm.

Ứng viên bị loại **vẫn hiển thị** ở `clue-board` là chủ ý, không phải thiếu sót: trẻ nhìn thấy
cái mình đã loại là cách bảng số tự kiểm soát lỗi (`BR-MTB-14`).

### 7.4 Sáu system mới của nhóm B

| System | Trách nhiệm | Kiểm soát lỗi tự thân biểu hiện thế nào |
|---|---|---|
| `timerSystem` | Hiện kích thích trong khoảng đã khai rồi ẩn; không đo phản xạ | Trẻ thấy vật biến mất, biết mình cần nhìn lại — không cần ai báo sai |
| `mazeSystem` | Lưới ô, tường, đường đi hợp lệ, phát hiện ngõ cụt | Nét vẽ dừng ở tường; ngõ cụt lùi về ngã ba gần nhất |
| `balanceSystem` | Tổng khối lượng hai bên, góc nghiêng đòn cân | Đòn cân nghiêng là câu trả lời; không cần dấu đúng sai |
| `constraintSystem` | Luật không lặp theo hàng, cột, vùng | Ô vừa đặt sáng lên cùng ô trùng giá trị với nó |
| `rotationSystem` | Góc quay theo nấc, ràng buộc giữa hai kim | Kim nhảy theo nấc; đặt sai không dừng được ở giữa hai nấc |
| `isometricSystem` | Vẽ khối theo phép chiếu đẳng cự, đếm khối thấy và khối ẩn | Xoay được mô hình để thấy khối bị che |

Mỗi system có bộ test độc lập với khuôn dùng nó (`BR-MTB-15`).

### 7.5 Điều kiện nghiệm thu một khuôn

| # | Điều kiện | Kiểm bằng |
|---:|---|---|
| 1 | `content_contract` và `difficulty_contract` parse được và suy ra kiểu TS | `pnpm typecheck` |
| 2 | `content_contract` xuất được sang JSON Schema | Test xuất contract |
| 3 | Không key độ khó nằm trong `content_contract` | Test `BR-GTC-03` |
| 4 | `checkWinCondition()` thuần | Test gọi lặp, `BR-GTC-09` |
| 5 | Có đường xử lý chạm-chạm nếu khai fallback tap | Test và journey E2E |
| 6 | Ít nhất ba game level mẫu parse được và chơi hết | `pnpm --filter @mindkid/db seed:check` và E2E |
| 7 | Một journey E2E xanh | Bộ E2E |
| 8 | Mọi xáo trộn đi qua nguồn ngẫu nhiên có seed | Test tái lập phiên |
| 9 | Layout lấy từ registry, không toạ độ cứng | Đọc diff, `BR-MTB-13` |
| 10 | `mechanic` có trong từ vựng trục `mechanic` | Cổng phủ |
| 11 | Không điểm nối nào sửa tay | `pnpm --filter @mindkid/game-engine gen:templates` chạy lại không sinh diff |
| 12 | Ngân sách hiệu năng của band tuổi thấp nhất khuôn nhận | [`performance-budgets.md`](../08-quality/performance-budgets.md) |
| 13 | **Kiểm soát lỗi tự thân** biểu hiện được, mô tả trong file mô tả khuôn | Journey E2E có một bước trẻ tự sửa trước khi hệ thống báo |
| 14 | Nhóm B: system có test độc lập với khuôn | Bộ test của `systems/` |
| 15 | Ba mức gợi ý L1, L2, L3 nối được vào khuôn | Test scaffolding |

Trượt một mục thì khuôn chưa xong. Không mục nào là việc làm sau khi ship.

### 7.6 Thứ tự và chi phí

| Nhóm | Khuôn | Chi phí thêm | Mở khoá | Ghi chú thứ tự |
|---|---|---|---:|---|
| A1 | `GT-007` · `GT-008` | 4 hàng registry | 6 workbook | Làm trước — đòn bẩy cao nhất trên mỗi đơn vị công |
| A2 | `GT-009` · `GT-010` · `GT-011` | 3 hàng registry | 5 workbook | Ba khuôn dùng chung nguyên thuỷ `selection`; làm song song được |
| B1 | `GT-012` · `GT-013` | 2 system | 2 workbook | Hai system đơn giản nhất, dùng để chốt khuôn viết một system |
| B2 | `GT-014` · `GT-015` · `GT-016` · `GT-017` | 4 system | 4 workbook | Nặng nhất về dựng hình và tương tác; làm sau cùng |

Nhóm A mở khoá **12 trên 16 workbook lô B** mà không thêm dòng system nào. Nếu lô Montessori
phải cắt vì lịch, cắt từ B2 lên, không cắt ngang một nhóm.

Lô ship theo **bốn nhóm**, không ship một lần (quyết định `D-RN`, 2026-08-20). Giữa hai nhóm là
một cổng người: nhóm trước phải có nội dung thật chạy được ở [`montessori-game-level-batch.md`](../05-content/montessori-game-level-batch.md)
trước khi nhóm sau bắt đầu. Ship cả mười một khuôn rồi mới soạn nội dung là dựng mười một
`content_contract` chưa cái nào bị nội dung thật thử.

### 7.7 Năm quyết định thiết kế đã chốt

| Khuôn | Quyết định | Vì sao |
|---|---|---|
| `GT-012` | Thời gian hiện kích thích thuộc `difficulty_params`: sàn 800ms, trần 3000ms, mặc định 1500ms (`D-RM`) | Cố định thì không tăng độ khó được. Sàn 800ms giữ nó là bài nhận biết nhanh, không thành bài đo phản xạ; mặc định lấy từ giá trị nguồn |
| `GT-014` | Dùng `scoring` schema chung. Trạng thái cân là phản hồi liên tục ở tầng render; `checkWinCondition()` vẫn nhị phân (`D-RO`) | Một nhánh `scoring` riêng cho một khuôn làm báo cáo phải xử lý hai hình dạng điểm. Phản hồi liên tục là việc của hiển thị, không phải của điểm |
| `GT-015` · `GT-017` | Vẽ bằng canvas trong Session class, không cần ảnh dựng riêng cho từng level. `asset_kinds` giống sáu khuôn hiện có (`D-RL`) | `GameSession.render` đã nhận `CanvasRenderingContext2D`. Ảnh dựng riêng mỗi level mất khả năng sinh biến thể từ dữ liệu và đội chi phí biên tập |
| `GT-013` | Giữ **cả hai** dạng đầu vào. `input_mode` là enum `draw` · `arrows` trong `content_pack`, không hardcode trong Session. Mặc định của người soạn: `draw` cho band 4-5, `arrows` cho band 5-6 (`D-RY`) | Workbook 09 có cả hai dạng ở ba dạng bài nguồn. Ép một dạng bỏ mất một nửa dạng bài, và `arrows` là thứ duy nhất bắt trẻ lập kế hoạch trước khi chạy — đúng phần `C6.PLN` mà workbook nhắm tới. Hai dạng dùng chung một nét vẽ và một điều kiện thắng, nên chi phí là một enum, không phải hai đường xử lý |
| Cả lô | Giá trị `mechanic` đăng ký vào mục 7.1 của [`content-tagging.md`](content-tagging.md) trong **cùng PR** ship khuôn (`D-RK`) | Đăng ký trước hàng loạt thì có giá trị trỏ vào khuôn chưa tồn tại; đăng ký sau thì cổng phủ đếm sai trong khoảng giữa |

## 8. API contract

Không thêm route. Khuôn lô Montessori xuất hiện trên hai route đã có ở mục 8 của
[`game-template-contract.md`](game-template-contract.md) ngay khi hàng `game_templates` thành `active`.

### `GET /api/guest/templates`

| | |
|---|---|
| Auth | không |
| 200 | Danh sách mở rộng thêm mười một hàng sau khi lô ship |

### `GET /api/managers/templates/{code}/contract`

| | |
|---|---|
| Auth | `requireManagerAuth()` |
| 200 | Contract của khuôn lô Montessori, cùng hình dạng với sáu khuôn hiện có |
| 422 | `TEMPLATE_NOT_SUPPORTED` — mã nằm trong khoảng lô Montessori nhưng khuôn chưa ship |

## 9. Acceptance criteria

```gherkin
Scenario: BR-MTB-01 — mã cấp tuần tự, không bỏ trống
  When đọc thư mục packages/game-engine/src/templates
  Then mọi mã từ GT-001 tới mã cao nhất đã ship đều tồn tại
  And không mã nào bị bỏ trống ở giữa

Scenario: BR-MTB-02 — mã khớp lớp chi phí
  When đọc mười một khuôn lô Montessori
  Then GT-007 tới GT-011 không thêm file nào dưới systems
  And GT-012 tới GT-017 mỗi khuôn thêm đúng một system

Scenario: BR-MTB-03 — một mechanic một khuôn
  When đọc trường mechanic của mọi khuôn
  Then không hai khuôn nào cùng một giá trị mechanic

Scenario: BR-MTB-04 — mechanic chưa đăng ký bị chặn
  Given một khuôn khai mechanic không có trong từ vựng trục mechanic
  When chạy cổng phủ
  Then cổng thoát với mã khác 0
  And nêu tên mechanic và mã khuôn

Scenario: BR-MTB-05 — khuôn kéo ở band thấp có fallback tap
  When đọc mọi khuôn lô Montessori có age_min bằng 3 hoặc 4 và mechanic dùng cử chỉ kéo
  Then requires_tap_fallback là true
  And Session class có đường xử lý chạm-chạm

Scenario: BR-MTB-06 — khuôn không có ba level mẫu thì chưa nghiệm thu
  Given khuôn GT-007 có hai game level mẫu
  When chạy cổng nghiệm thu khuôn
  Then cổng thoát với mã khác 0
  And nêu số level mẫu còn thiếu

Scenario: BR-MTB-07 — phiên chơi tái lập được
  Given một phiên chơi GT-011 với một seed cố định
  When chạy lại phiên với cùng seed
  Then thứ tự và vị trí mọi phần tử giống hệt lần trước

Scenario: BR-MTB-08 — không điểm nối nào sửa tay
  Given cây làm việc sạch sau khi thêm một khuôn
  When chạy pnpm --filter @mindkid/game-engine gen:templates
  Then không file nào trong thư mục sinh mã bị thay đổi

Scenario: BR-MTB-09 — khuôn không mang skill
  When đọc file mô tả của mười một khuôn lô Montessori
  Then không khuôn nào có field skill, competency hay workbook

Scenario: BR-MTB-10 — band khuôn thắng band nguồn
  Given GT-014 khai age_min bằng 5
  And bảng ánh xạ xếp workbook 16 ở band 5-6
  When một seeder khai age_min bằng 4 cho một level GT-014
  Then cổng 5 fail

Scenario: BR-MTB-11 — nội dung cho khuôn chưa ship bị chặn
  Given GT-014 chưa active
  When chạy pnpm --filter @mindkid/db seed:check trên một batch khai template_code GT-014
  Then cổng 1 fail
  And thông báo nêu khuôn chưa tồn tại

Scenario: BR-MTB-13 — layout ngoài registry bị chặn
  Given một Session class yêu cầu layout number-bond-tree chưa đăng ký
  When dựng phiên
  Then engine ném LAYOUT_NOT_SUPPORTED

Scenario: BR-MTB-14 — kiểm soát lỗi tự thân có thật
  Given journey E2E của một khuôn lô Montessori
  When đọc các bước của journey
  Then có một bước trẻ tự sửa sau khi vật liệu báo sai
  And bước đó xảy ra trước khi hệ thống hiện phản hồi đúng sai

Scenario: BR-MTB-15 — system có test độc lập
  When đọc bộ test của mỗi system nhóm B
  Then mỗi system có ít nhất một test không nạp khuôn nào
```

## 10. Boundaries

**Always**
- Cấp mã tuần tự theo lớp chi phí ở mục 7.1.
- Đăng ký layout vào registry trước khi viết Session class.
- Đăng ký `mechanic` vào từ vựng trước khi seed khuôn.
- Viết ít nhất ba level mẫu trước khi coi khuôn là xong.
- Mô tả kiểm soát lỗi tự thân của khuôn trong file mô tả.
- Cho mỗi system nhóm B một bộ test độc lập.

**Ask first**
- Thêm một khuôn ngoài mười một hàng ở mục 7.1.
- Thêm loại asset ngoài `emoji`, `image`, `audio`.
- Nới band tuổi của một khuôn sau khi đã ship.
- Bỏ một hàng khỏi mục 7.1 vì cơ chế dựng được trên khuôn đã có.
- Chuyển một khuôn nhóm A sang nhóm B sau khi đã cấp mã.

**Never**
- Hai mã cho một `mechanic`.
- Thêm mã khuôn vào một điểm nối bằng tay.
- Toạ độ cứng thay cho layout trong registry.
- Gắn skill, competency hay workbook vào khuôn.
- Soạn nội dung cho khuôn chưa `active`.
- Tái dùng mã của một hàng đã bị bỏ.
- Ship một khuôn chỉ báo sai bằng dấu đỏ, không có kiểm soát lỗi tự thân.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Trục `mechanic` có hai bộ từ vựng khác nhau; `BR-MTB-04` cần một bộ thắng~~ **Đóng 2026-08-20 (T98, `D-RK`)**: mục 7.1 của [`content-tagging.md`](content-tagging.md) thắng — nó khai đúng sáu giá trị khớp code và tự nói trục này suy ra từ `game_templates.mechanic`, không nhập tay. Trục 3 của [`taxonomy/index.md`](../../taxonomy/index.md) là **danh mục thiết kế**, không phải từ vựng thi hành. Mỗi khuôn thêm giá trị của nó vào §7.1 trong cùng PR. Nợ nhánh slug dự phòng của trục `what` và `thinking` **không** thuộc phạm vi này | — | Đã đóng | D-RK |
| ~~2~~ | ~~`GT-015` và `GT-017` dùng ảnh dựng sẵn hay vẽ bằng canvas?~~ **Đóng 2026-08-20 (T98, `D-RL`)**: vẽ bằng canvas trong Session class — xem mục 7.7 | — | Đã đóng | D-RL |
| ~~3~~ | ~~Thời gian hiện kích thích của khuôn nhìn chớp cố định hay thuộc `difficulty_params`?~~ **Đóng 2026-08-20 (T98, `D-RM`)**: thuộc `difficulty_params`, sàn 800ms, trần 3000ms, mặc định 1500ms — xem mục 7.7 | — | Đã đóng | D-RM |
| ~~4~~ | ~~Ship một lô hay bốn nhóm?~~ **Đóng 2026-08-20 (T98, `D-RN`)**: bốn nhóm, cổng người giữa các nhóm — xem mục 7.6 | — | Đã đóng | D-RN |
| ~~5~~ | ~~`GT-014` có cần nhánh `scoring` riêng không?~~ **Đóng 2026-08-20 (T98, `D-RO`)**: không. Dùng schema chung ở [`scoring-and-result.md`](../04-play/scoring-and-result.md) — xem mục 7.7 | — | Đã đóng | D-RO |
| 6 | Cột "hàm lõi dự kiến" ở mục 7.3 đoán cả bảy `LayoutId` mới dựng lại được từ bốn hàm lõi mà `D-LB` đã chốt. **Đã đo 6 trên 7 hàng (T98 WP98.9, T99 WP99.1, T99 WP99.2): cả sáu cần hàm hình học riêng, giả thuyết sai.** Còn `equation-rows` chưa đo — đóng khi làm `GT-010`, và `GT-010` đang khoá sau cổng trần C1 | Ước lượng chi phí `GT-010` | P4 | Backend |
| ~~7~~ | ~~`mazeSystem` nhận đầu vào là nét vẽ liên tục hay chuỗi lệnh mũi tên?~~ **Đóng 2026-08-21 (T99 WP99.3, `D-RY`)**: giữ **cả hai**, khai ở `input_mode` của `content_pack` — xem mục 7.7 | — | Đã đóng | D-RY |
