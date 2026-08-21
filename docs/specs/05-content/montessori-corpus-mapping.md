---
spec: MONTESSORI-CORPUS-MAPPING
title: Ánh xạ corpus Montessori sang taxonomy và khuôn trò chơi
area: content
status: approved
mvp: false
phase: P3
reviewed: 2026-08-20
owns:
  - Ánh xạ bất biến từ workbook Montessori sang strand, band tuổi và khuôn trò chơi
  - Quy tắc tái biên soạn nội dung nguồn bên thứ ba cho corpus Montessori
  - Ranh giới lô A và lô B của corpus Montessori
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - GAME-LEVEL-MODEL
  - TAXONOMY-SERVICE
  - CONTENT-SEED-AUTHORING
---

# Ánh xạ corpus Montessori sang taxonomy và khuôn trò chơi

## 1. Objective

`docs/montessori/dataset/raw-montessori-corpus.md` là bản phân tích 21 tập tài liệu bài tập
mầm non thành cấu trúc bài toán, đáp án, distractor và gợi ý sư phạm. Nó là **nguồn soạn
thảo**, không phải nội dung. Không hàng nào trong đó chạy được cho trẻ.

File này sở hữu bước dịch giữa hai thứ đó: mỗi workbook được gán strand nào của taxonomy,
band tuổi nào, và khuôn trò chơi nào chạy được nó. Nó cũng sở hữu hai ràng buộc mà bản
phân tích không thể tự mang: nội dung gốc là tài liệu của bên thứ ba nên phải **tái biên
soạn**, và một phần lớn dạng bài **chưa có khuôn nào chạy được** nên phải tách ra khỏi
đường găng nội dung.

Ranh giới lô A và lô B ở mục 7.3 là kết quả chính của file này. Không có nó, mọi kế hoạch
nội dung Montessori đều ngầm giả định mười một khuôn trò chơi mới đã tồn tại.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người biên soạn | `content_reviewer` | Đọc bảng ánh xạ để biết một workbook đi vào lô nào, gắn strand nào |
| Người review PR | `content_reviewer` | Đối chiếu seeder với hàng ánh xạ tương ứng trước khi approve |
| Dev | — | Đọc mục 7.3 để biết khuôn nào còn thiếu trước khi nhận việc lô B |
| AI agent IDE | — | Soạn seeder theo hàng ánh xạ. Cấm tự gán strand không có trong bảng |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `docs/montessori/dataset/raw-montessori-corpus.md` | Người biên soạn | Nguồn soạn thảo, đọc-only. Cấm sửa để khớp bảng ánh xạ |
| `docs/montessori/Phần 1 - khởi đầu/` … `Phần 3 - Phát triển/` | Người biên soạn | 21 tập PDF gốc của bên thứ ba. Chỉ tra cứu, không trích xuất tài sản |
| [`taxonomy/index.md`](../../taxonomy/index.md) | Người biên soạn | Nguồn sự thật của strand và skill code |
| [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | Người biên soạn | Đường ống nạp nội dung sau khi ánh xạ xong |

## 4. Main flow

1. Chọn một workbook trong bảng 7.1.
2. Tách workbook thành **dạng bài** — đơn vị nhỏ nhất có một chỉ dẫn, một đáp án đúng, một
   bộ distractor.
3. Với mỗi dạng bài, tra hàng 7.1 để lấy strand và band tuổi.
4. Phân giải strand thành **skill code thật** trong [`taxonomy/index.md`](../../taxonomy/index.md); không có skill khớp
   thì dừng và mở câu hỏi cho chủ taxonomy, cấm tự đặt skill mới.
5. Tra cột khuôn của hàng 7.1: dạng bài chạy được trên sáu khuôn hiện có thì vào **lô A**;
   ngược lại vào **lô B**.
6. Tái biên soạn dạng bài theo mục 7.4 — đổi bối cảnh, đổi số liệu, viết lại chỉ dẫn.
7. Lô A đi tiếp sang [`montessori-game-level-batch.md`](montessori-game-level-batch.md). Lô B dừng lại chờ khuôn ở
   [`montessori-template-batch.md`](../01-platform/montessori-template-batch.md).

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Không có skill code khớp dạng bài | Strand tồn tại nhưng chưa có skill mô tả đúng hành vi | Dừng. Mở câu hỏi cho chủ taxonomy. Cấm seed với skill gần đúng |
| Dạng bài vượt trần item của band | Trần ở mục 7.1 của [`game-level-model.md`](game-level-model.md) | Chia nhỏ dạng bài, hoặc dời lên band cao hơn nếu strand cho phép. Cấm nới trần |
| Workbook thiếu phần gợi ý sư phạm | 18 trên 21 workbook không có | Người biên soạn tự viết ba mức theo [`scaffolding-and-hints.md`](../04-play/scaffolding-and-hints.md). Cấm seed level không có gợi ý |
| Dạng bài mang tên một bộ test có bản quyền | Workbook 21 nêu tên một bộ test tâm lý thương mại | Giữ cấu trúc bài toán, bỏ tên bộ test, bỏ mọi tuyên bố đo chỉ số trí tuệ |
| Dạng bài chỉ chạy được với khuôn chưa có | 11 khuôn ở mục 7.3 | Ghi vào lô B. Cấm ép sang khuôn gần đúng để ship sớm |
| Emoji trong dataset không có trong registry | `EMJ-*` chưa đăng ký | Đăng ký emoji trước theo [`emoji-registry.md`](../01-platform/emoji-registry.md), hoặc đổi vật liệu |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MCM-01` (dataset là nguồn, không phải nội dung) | Dataset là **nguồn soạn thảo**, cấm nạp thẳng vào bảng nội dung bằng bất kỳ script nào | Nó không có `code`, không có `access_tier`, không qua tám cổng của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md). Nạp thẳng là đi vòng qua toàn bộ cổng chất lượng |
| `BR-MCM-02` (ánh xạ bất biến) | Hàng ánh xạ ở mục 7.1 **bất biến** sau khi spec này `approved`; đổi strand hay band của một workbook là version mới của spec | Mã game level mang competency và strand ngay trong hai đoạn đầu của chính nó, theo mục 7.1 của [`id-conventions.md`](../00-foundation/id-conventions.md). Đổi ánh xạ sau khi seed là đổi mã đã published |
| `BR-MCM-03` (strand phân giải thành skill thật) | Cột strand ở 7.1 là **gợi ý tra cứu**, không phải giá trị seed. Seeder phải mang skill code có thật trong [`taxonomy/index.md`](../../taxonomy/index.md) | Strand không phải đơn vị gắn được vào `content_skill_map`. Seed strand là seed một thứ không tồn tại |
| `BR-MCM-04` (cấm tự đặt skill) | Người biên soạn và AI agent IDE cấm — **NEVER tạo skill hay strand mới** để khớp một workbook | `BR-CSA-08` (AI không sinh taxonomy) — taxonomy là Lớp 1. Một workbook không khớp taxonomy là tín hiệu về taxonomy, không phải giấy phép mở rộng nó |
| `BR-MCM-05` (tái biên soạn bắt buộc) | Mọi dạng bài phải **tái biên soạn** theo mục 7.4 trước khi vào seeder: đổi bối cảnh, đổi số liệu, viết lại chỉ dẫn | Nguồn là tài liệu của bên thứ ba. Cơ chế bài toán không độc quyền được, nhưng lời văn, bố cục trang và hình vẽ thì có |
| `BR-MCM-06` (cấm tuyên bố đo trí tuệ) | Cấm — **NEVER dùng tên một bộ test tâm lý thương mại**, cấm mọi câu chữ nói nội dung đo chỉ số trí tuệ của trẻ | `BR-PED-01` cấm tuyên bố hiệu quả không có bằng chứng; tên bộ test thương mại còn là vấn đề nhãn hiệu. Xem [`pedagogical-evidence.md`](../08-quality/pedagogical-evidence.md) |
| `BR-MCM-07` (band tuổi theo phần nguồn) | Band tuổi lấy từ phần chứa workbook: Phần 1 là `3-4`, Phần 2 là `4-5`, Phần 3 là `5-6`. Đổi band của một workbook cần lý do sư phạm viết ra | Ba phần của nguồn đã là một thang tiến trình. Xáo trộn nó mà không nêu lý do là mất thông tin duy nhất nguồn mang theo |
| `BR-MCM-08` (trần item thắng nguồn) | Khi dạng bài gốc vượt trần item của band, **trần thắng** — chia nhỏ dạng bài, cấm nới trần | Trần ở mục 7.1 của [`game-level-model.md`](game-level-model.md) là lý do từ chối duyệt. Một nguồn giấy không có giới hạn trí nhớ làm việc như một màn chơi |
| `BR-MCM-09` (gợi ý sư phạm là bắt buộc) | Dạng bài không có ba mức gợi ý thì người biên soạn **phải viết**, cấm seed level thiếu gợi ý | Đo trên dataset: 3 trên 21 workbook có phần gợi ý. Coi im lặng là "không cần gợi ý" thì 18 workbook ra level không có đường thoát cho trẻ đang bí |
| `BR-MCM-10` (lô B không ép sang khuôn gần đúng) | Dạng bài thuộc lô B cấm — **NEVER ép sang một khuôn lô A** để phát hành sớm | Ép một bài cân bằng vào khuôn chọn-một-đáp-án giữ được câu hỏi và mất toàn bộ cơ chế. Trẻ học cơ chế, không học nội dung |
| `BR-MCM-11` (mã khuôn của nguồn không ràng buộc) | Mã `GT-*` trong bảng tổng kết của dataset là **đề xuất của người phân tích**, không ràng buộc. Mã thật do [`montessori-template-batch.md`](../01-platform/montessori-template-batch.md) cấp | Dataset đề xuất `GT-008`..`GT-018` và bỏ trống `GT-007`. Mã `GT-*` bất biến theo [`id-conventions.md`](../00-foundation/id-conventions.md); cấp mã theo một tài liệu không phải spec sở hữu là cách tạo lỗ hổng |
| `BR-MCM-12` (dạng bài là đơn vị ánh xạ) | Đơn vị ánh xạ là **dạng bài**, không phải workbook. Một workbook có thể vừa có dạng lô A vừa có dạng lô B | Workbook 18 vừa có dạng đọc giờ chạy được ngay trên khuôn chọn-một-đáp-án, vừa có dạng xoay kim cần khuôn mới. Ánh xạ theo workbook thì mất nửa nội dung dùng được |
| `BR-MCM-13` (cô lập thuộc tính) | Mỗi dạng bài đưa vào hệ thống chỉ **biến thiên một thuộc tính** so với dạng bài trước cùng skill: màu, kích thước, số lượng, hoặc hình dạng — không đổi hai thứ cùng lúc | Nguyên lý cô lập thuộc tính của nguồn (mục 7.0), và `BR-GLM-08` (tăng một chiều) nói đúng cùng một điều từ phía biên tập. Đổi hai thuộc tính cùng lúc thì trẻ không biết mình đang học cái nào, và người lớn không biết trẻ hỏng ở đâu |
| `BR-MCM-14` (giữ kiểm soát lỗi tự thân) | Mỗi dạng bài phải ghi lại **vật liệu tự báo sai bằng cách nào**; dạng bài mất cơ chế đó khi chuyển sang màn hình thì ghi rõ là mất | Đây là thứ làm giáo cụ Montessori hoạt động mà không cần người lớn phán xét. Chuyển lên màn hình rồi thay bằng dấu đỏ là giữ hình thức và bỏ nguyên lý — `BR-MTB-14` ép điều này ở phía khuôn |
| `BR-MCM-15` (thứ tự CPA) | Trong cùng một workbook, dạng bài dùng vật đếm được đứng **trước** dạng bài dùng biểu tượng, và biểu tượng đứng trước ký hiệu số | Nguồn xếp theo tiến trình cụ thể tới trừu tượng. Đảo thứ tự này là đưa ký hiệu trước khi trẻ có nghĩa để gắn vào nó |

## 7. Data

**Đọc:** dataset và 21 tập PDF nguồn · [`taxonomy/index.md`](../../taxonomy/index.md) · `emoji_registry`.
**Ghi:** không ghi vào database. Đầu ra là bảng ánh xạ trong chính file này.

### 7.0 Bốn nguyên lý sư phạm của nguồn

21 workbook không phải một tập bài tập rời. Chúng dựng trên bốn nguyên lý, và mỗi nguyên lý đã
có một chỗ tương ứng trong hệ thống. Bỏ nguyên lý mà giữ bài tập là giữ vỏ.

| Nguyên lý của nguồn | Nghĩa | Chỗ tương ứng trong hệ thống |
|---|---|---|
| CPA — cụ thể tới trừu tượng | Vật đếm được, rồi biểu tượng hình ảnh, rồi ký hiệu số | Thứ tự dạng bài trong một workbook, `BR-MCM-15`; thang `difficulty` 1 tới 5 ở mục 7.2 của [`game-level-model.md`](game-level-model.md) |
| Cô lập thuộc tính | Mỗi bài chỉ biến thiên **một** chiều: màu, kích thước, số lượng, hình dạng | `BR-MCM-13`, và `BR-GLM-08` (tăng một chiều) ở phía biên tập |
| Kiểm soát lỗi tự thân | Vật liệu tự báo sai: hình không khớp khuôn, hai bên cân không thăng bằng, lưới lặp giá trị | `BR-MCM-14` ở phía nội dung, `BR-MTB-14` ở phía khuôn |
| Scaffolding ba mức | Nudge nhấp nháy, Guidance đếm nhịp chậm, Demo bàn tay làm mẫu | Ba bậc L1, L2, L3 đã có trong engine — L1 highlight, L2 ghost hand tốc độ thật, L3 ghost hand 0,5× lặp, theo [`scaffolding-and-hints.md`](../04-play/scaffolding-and-hints.md) |

Hàng cuối là tin tốt đo được: ba mức gợi ý của nguồn khớp **một-một** với ba bậc đã có trong
`packages/game-engine/src/systems/scaffolding.ts`. 18 workbook thiếu phần gợi ý (mục 7.5) cần
người **viết lời**, không cần ai xây cơ chế.

Hàng thứ ba là hàng dễ mất nhất. Một bài cân đòn bẩy chuyển lên màn hình mà chỉ hiện dấu đỏ khi
sai thì đã bỏ đúng thứ khiến bài đó dạy được: đòn cân nghiêng **là** câu trả lời.

### 7.1 Bảng ánh xạ 21 workbook

Cột `Khuôn lô A` liệt kê khuôn đã tồn tại chạy được **ít nhất một** dạng bài của workbook.
Cột `Khuôn lô B` nêu cơ chế còn thiếu; mã do [`montessori-template-batch.md`](../01-platform/montessori-template-batch.md) cấp.

| # | Workbook | Band | Competency | Strand | Khuôn lô A | Cơ chế lô B còn thiếu |
|---:|---|:--:|:--:|---|---|---|
| 01 | Nhận biết số | 3-4 | C1 | `C1.NREC` · `C1.OTO` | `GT-001` · `GT-003` | — |
| 02 | Thứ tự dãy số | 3-4 | C1 | `C1.NREC` | `GT-001` · `GT-006` | `GT-008` kéo vào ô khuyết |
| 03 | Tìm bóng đúng | 3-4 | C4 | `C4.VIS` | `GT-001` · `GT-005` | — |
| 04 | Đếm nhanh chọn đúng | 3-4 | C1 | `C1.CNT` | — | `GT-012` nhìn chớp rồi nhớ lại |
| 05 | Đếm nhanh điền đúng | 3-4 | C1 | `C1.CNT` | `GT-002` · `GT-003` | — |
| 06 | So sánh số lượng | 3-4 | C1 | `C1.CMP` | `GT-001` · `GT-003` | — |
| 07 | Tách gộp số lượng | 3-4 | C1 | `C1.NCOMP` | — | `GT-007` cây tách gộp |
| 08 | Tách gộp phạm vi 10 | 4-5 | C1 | `C1.NCOMP` | — | `GT-007` cây tách gộp |
| 09 | Vượt mê cung | 4-5 | C2 | `C2.MAZ` · `C6.PLN` | — | `GT-013` tìm đường mê cung |
| 10 | Tư duy màu sắc | 4-5 | C4 | `C4.SEN` · `C3.CLS` | `GT-004` · `GT-006` | — |
| 11 | Điền số thông minh | 4-5 | C1 | `C1.CNT` · `C3.RULE` | `GT-001` | `GT-008` kéo vào ô khuyết |
| 12 | Bài toán thay thế sơ đẳng | 4-5 | C1 | `C1.PROB` · `C3.INF` | — | `GT-010` thay thế biểu tượng |
| 13 | Tách gộp phạm vi 20 | 4-5 | C1 | `C1.NCOMP` | — | `GT-007` cây tách gộp |
| 14 | Tìm số bí ẩn | 4-5 | C3 | `C3.DED` · `C6.WM` | — | `GT-009` loại trừ theo manh mối |
| 15 | Cùng bé tìm quy luật | 5-6 | C1 | `C1.PAT` · `C3.RULE` | `GT-001` · `GT-006` | `GT-011` ma trận chọn hình |
| 16 | Tư duy cân bằng | 5-6 | C1 | `C1.MEAS` · `C3.DED` | — | `GT-014` cân hai bên |
| 17 | Thử thách Sudoku | 5-6 | C3 | `C3.MTX` | — | `GT-015` lưới không lặp |
| 18 | Làm quen với đồng hồ | 5-6 | C1 | `C1.MEAS` | `GT-001` · `GT-005` | `GT-016` xoay kim đồng hồ |
| 19 | Tư duy hình khối | 5-6 | C2 | `C2.GEO` · `C2.PER` | `GT-005` | `GT-017` xếp khối và phối cảnh |
| 20 | Bài toán thay thế nâng cao | 5-6 | C1 | `C1.PROB` · `C3.DED` | — | `GT-010` thay thế biểu tượng |
| 21 | Ma trận suy luận tổng hợp | 5-6 | C3 | `C3.MTX` · `C2.ROT` | — | `GT-011` ma trận chọn hình |

Cột `Competency` ghi competency **chính** — thứ quyết định tiền tố mã level.

**Strand phụ không vào `skill_codes`** (quyết định `D-RH`, 2026-08-20). Trường `skill_codes`
của seeder là một mảng phẳng không mang trọng số, nên nó không biểu diễn được `weight = 1.0`
mà `BR-GLM-01` (một mục tiêu học tập mỗi level) nói tới. Mỗi level Montessori mang **đúng một**
skill code, lấy từ strand đầu tiên của hàng; strand phụ đi vào tag trục `what` và `thinking`
theo [`content-tagging.md`](../01-platform/content-tagging.md).

### 7.2 Phân bố competency của nguồn

| Competency | Số workbook có competency chính |
|---|---:|
| C1 Mathematical Thinking | 14 |
| C2 Spatial Thinking | 2 |
| C3 Logical Thinking | 3 |
| C4 Observation Thinking | 2 |
| C5 Language Thinking | 0 |
| C6 Executive Function | 0 |

Nguồn **không phủ** C5, và chỉ chạm C6 ở vị trí strand phụ. Đây là dữ kiện chặn: catalog
hiện tại cân bằng 20 level mỗi competency, và `BR-TCM-07` (luật cân bằng) chặn từ P4 khi
competency nhiều nhất vượt ba lần competency ít nhất. Nạp corpus này mà không kèm kế hoạch
C5 là đẩy catalog về phía cổng đó. Hạn ngạch thuộc [`montessori-game-level-batch.md`](montessori-game-level-batch.md).

### 7.3 Ranh giới lô A và lô B

| Lô | Định nghĩa | Chạy được từ | Số workbook có ít nhất một dạng bài |
|---|---|---|---:|
| A | Dạng bài chạy được trên `GT-001`…`GT-006` | ngay, không dòng code engine nào | 10 |
| B | Dạng bài cần khuôn chưa tồn tại | sau khi khuôn tương ứng ship | 16 |

Năm workbook (02, 11, 15, 18, 19) nằm ở **cả hai lô**, năm workbook (01, 03, 05, 06, 10)
chỉ ở lô A, mười một workbook còn lại chỉ ở lô B. Cộng lại đúng 21 — đó là hệ quả trực tiếp
của `BR-MCM-12` (dạng bài là đơn vị ánh xạ).

Mười một cơ chế còn thiếu, gom từ cột cuối của mục 7.1, đã được cấp mã ở mục 7.1 của
[`montessori-template-batch.md`](../01-platform/montessori-template-batch.md): `GT-007` cây tách gộp · `GT-008` kéo vào ô khuyết ·
`GT-009` loại trừ theo manh mối · `GT-010` thay thế biểu tượng · `GT-011` ma trận chọn hình ·
`GT-012` nhìn chớp rồi nhớ lại · `GT-013` tìm đường mê cung · `GT-014` cân hai bên ·
`GT-015` lưới không lặp · `GT-016` xoay kim đồng hồ · `GT-017` xếp khối và phối cảnh.

Mã cấp theo **lớp chi phí**, không theo thứ tự workbook: `GT-007` tới `GT-011` chỉ cần layout
mới, `GT-012` tới `GT-017` mỗi khuôn kéo theo một system engine chưa tồn tại.

### 7.4 Quy tắc tái biên soạn

| Thành phần nguồn | Được lấy | Phải thay |
|---|---|---|
| Cơ chế bài toán | Có | — |
| Cấu trúc distractor và lý do gây nhiễu | Có | — |
| Tiến trình độ khó giữa các dạng | Có | — |
| Số liệu cụ thể của một bài | Không | Sinh lại bộ số khác, giữ nguyên cấu trúc |
| Lời dẫn nguyên văn | Không | Viết lại theo mục 7.3 của [`game-level-model.md`](game-level-model.md) |
| Bối cảnh và nhân vật | Không | Chọn lại từ theme đã đăng ký |
| Hình vẽ, bố cục trang | Không | Dựng lại bằng emoji trong `emoji_registry` |
| Tên bộ test tâm lý thương mại | Không | Bỏ hẳn, không thay bằng tên khác |

### 7.5 Độ đầy đủ đo được của dataset

Đo ngày 2026-08-20 trên [`raw-montessori-corpus.md`](../../montessori/dataset/raw-montessori-corpus.md):

| Thuộc tính | Số đo | Hệ quả |
|---|---|---|
| Workbook | 21 | — |
| Dạng bài tách được bằng cú pháp thống nhất | 57 | Đơn vị đếm hạn ngạch ở [`montessori-game-level-batch.md`](montessori-game-level-batch.md) |
| Workbook chưa tách dạng | 0 | Chuẩn hoá xong 2026-08-20 (`D-RI`); workbook 09 và 17 đã tách |
| Workbook có phần gợi ý sư phạm ba mức | 3 | 18 workbook cần người viết gợi ý, `BR-MCM-09` |
| Workbook khai `access_tier` | 0 | Toàn bộ phải gán tier lúc soạn seeder |
| Workbook khai learning objective code | 0 | Phải phân giải từ strand lúc soạn seeder |

Ba hàng cuối là lý do dataset không phải một seeder chờ chạy: nó thiếu đúng những trường mà
cổng 5 của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) bắt buộc.

### 7.6 Khoảng trống đã biết — tô nét số

Mục tiêu giáo dục của workbook 01 nêu "tập tô nét số", và phương pháp Montessori tương đương là
thẻ số cát. Đó là cơ chế `trace-path` — vẽ theo nét, có kiểm soát lỗi tự thân rõ nhất trong cả
nguồn: ngón tay trượt ra khỏi nét là trẻ tự biết.

**Nó không nằm trong lô này**, vì hai lý do đo được:

1. Dataset không có dạng bài nào cho nó. Nó chỉ xuất hiện ở dòng mục tiêu giáo dục của workbook
   01, không thành một bài có chỉ dẫn, đáp án và distractor. `BR-MCM-12` (dạng bài là đơn vị
   ánh xạ) nên nó không có đơn vị để ánh xạ.
2. Nó cần một system vẽ nét và chấm điểm sai lệch mà `packages/game-engine/src/systems` chưa có,
   và không workbook nào khác dùng lại được — đòn bẩy thấp nhất trong mọi cơ chế còn thiếu.

Ghi ở đây để lần sau không ai phải phát hiện lại. Mở nó cần một dạng bài viết mới trong dataset
trước, rồi mới tới quyết định khuôn.

## 8. API contract

Không sở hữu route. Bảng ánh xạ là tài liệu, đọc bằng mắt lúc soạn và lúc review PR.

## 9. Acceptance criteria

```gherkin
Scenario: BR-MCM-01 — dataset không nạp thẳng vào database
  When quét mọi script dưới packages/db và scripts
  Then không script nào đọc docs/montessori/dataset/raw-montessori-corpus.md
  And không đường nào ghi vào game_levels mà bỏ qua tám cổng seed

Scenario: BR-MCM-03 — seeder mang skill code thật, không mang strand
  Given một seeder Montessori khai skill_codes là "C1.NREC"
  When chạy pnpm --filter @mindkid/db seed:check
  Then cổng 5 fail
  And thông báo nêu giá trị không khớp regex skill code

Scenario: BR-MCM-04 — seeder không tạo được skill mới
  Given một seeder Montessori khai một skill code chưa có trong taxonomy
  When chạy pnpm --filter @mindkid/db seed:check
  Then cổng 5 fail với thông báo taxonomy là Lớp 1

Scenario: BR-MCM-06 — tên bộ test thương mại bị chặn
  Given một level Montessori có title chứa tên một bộ test tâm lý thương mại
  When chạy pnpm --filter @mindkid/db seed:check
  Then cổng 7 fail
  And thông báo nêu đúng chuỗi vi phạm

Scenario: BR-MCM-06 — không tuyên bố đo trí tuệ
  When đọc title và instruction của mọi level Montessori published
  Then không chuỗi nào nói nội dung đo chỉ số trí tuệ của trẻ

Scenario: BR-MCM-08 — dạng bài vượt trần item bị chia nhỏ
  Given workbook 01 dạng ba có 8 vật ở band 3-4
  When soạn level tương ứng
  Then level mang tối đa 4 item
  And phần còn lại thành một level khác cùng skill

Scenario: BR-MCM-09 — level thiếu gợi ý bị chặn
  Given một level Montessori không khai gợi ý mức nào
  When gửi duyệt
  Then trả 422
  And lý do nêu thiếu gợi ý sư phạm

Scenario: BR-MCM-10 — dạng bài lô B không ép sang khuôn lô A
  Given workbook 16 dạng cân đòn bẩy
  When kiểm mọi level Montessori published
  Then không level nào dùng GT-001 tới GT-006 cho dạng bài đó

Scenario: BR-MCM-11 — mã khuôn của dataset không vào code
  When quét packages/game-engine/src/templates
  Then không thư mục khuôn nào lấy mã từ bảng tổng kết của dataset mà không qua montessori-template-batch

Scenario: BR-MCM-02 — ánh xạ bất biến sau khi approved
  Given spec này ở trạng thái approved
  When một hàng ở mục 7.1 đổi strand hoặc band
  Then thay đổi đi kèm version mới của spec
  And mọi mã level đã seed theo hàng cũ giữ nguyên
```

## 10. Boundaries

**Always**
- Tách workbook thành dạng bài trước khi ánh xạ.
- Phân giải strand thành skill code có thật.
- Tái biên soạn số liệu, lời dẫn và bối cảnh.
- Ghi rõ dạng bài thuộc lô A hay lô B trước khi mở PR seeder.

**Ask first**
- Đổi band tuổi của một workbook so với phần nguồn của nó.
- Thêm workbook mới vào bảng 7.1.
- Gắn một workbook vào competency chính khác với mục 7.1.

**Never**
- Nạp dataset thẳng vào database.
- Tạo skill hoặc strand mới để khớp một workbook.
- Dùng tên bộ test tâm lý thương mại, hoặc tuyên bố đo chỉ số trí tuệ.
- Ép dạng bài lô B sang khuôn lô A.
- Nới trần item của band để giữ nguyên một dạng bài gốc.
- Sao chép nguyên văn lời dẫn, số liệu hoặc hình vẽ của nguồn.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~21 tập PDF nguồn có giấy phép sử dụng nào?~~ **Đóng 2026-08-20 (T98, `D-RG`)**: mặc định coi nguồn là **có bản quyền đầy đủ**. Mục 7.4 đã là posture chặt nhất — chỉ cơ chế bài toán được tái dùng, mọi lời văn, số liệu, bố cục và hình vẽ phải viết lại. Một giấy phép rộng hơn chỉ **nới** được posture này, không siết thêm, nên nó không chặn lô A. Vẫn cần người quyết trước khi **nêu tên nguồn ra công khai** hoặc dùng lại ảnh chụp trang | — | Đã đóng | D-RG |
| ~~2~~ | ~~Strand phụ ở mục 7.1 gắn vào `content_skill_map` với trọng số bao nhiêu?~~ **Đóng 2026-08-20 (T98, `D-RH`)**: không gắn. `skill_codes` là mảng phẳng không mang trọng số nên không biểu diễn được `weight = 1.0`; mỗi level mang đúng một skill code, strand phụ đi vào tag — xem mục 7.1 | — | Đã đóng | D-RH |
| ~~3~~ | ~~Hai workbook chưa tách dạng (09, 17) chuẩn hoá thế nào?~~ **Đóng 2026-08-20 (T98, `D-RI`)**: sửa cú pháp trong chính dataset. "Đọc-only" cấm sửa **nội dung** để khớp bảng ánh xạ, không cấm chuẩn hoá **cú pháp**. Sau chuẩn hoá: 21 workbook, 59 dạng bài (đếm lại ở T99 WP99.0) | — | Đã đóng | D-RI |
| ~~4~~ | ~~Corpus Montessori có phải nguồn duy nhất của đợt nội dung này?~~ **Đóng 2026-08-20 (T98, `D-RJ`)**: có, ở Task #98. Hạn ngạch mục 7.1 của [`montessori-game-level-batch.md`](montessori-game-level-batch.md) đã tính với C5 và C6 giữ nguyên 20 level, nên luật cân bằng `BR-TCM-07` không bị chạm. Nguồn cho C5 và C6 là quyết định phạm vi của một đợt sau | — | Đã đóng | D-RJ |
