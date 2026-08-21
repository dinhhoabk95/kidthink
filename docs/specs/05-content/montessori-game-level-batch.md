---
spec: MONTESSORI-GAME-LEVEL-BATCH
title: Lô game level Montessori — hạn ngạch, mã và thứ tự nạp
area: content
status: approved
mvp: false
phase: P3
reviewed: 2026-08-20
owns:
  - Hạn ngạch lô game level Montessori theo competency
  - Khối mã dành riêng cho game level Montessori
  - Thứ tự nạp lô A và lô B của game level Montessori
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - CONTENT-SEED-AUTHORING
  - GAME-LEVEL-MODEL
  - THINKING-COVERAGE-MATRIX
---

# Lô game level Montessori — hạn ngạch, mã và thứ tự nạp

## 1. Objective

Bảng ánh xạ ở [`montessori-corpus-mapping.md`](montessori-corpus-mapping.md) nói workbook nào đi với strand nào. Đường
ống nạp ở [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) nói nội dung vào database bằng đường nào. File
này nói thứ nằm giữa: **bao nhiêu level, mã nào, nạp theo thứ tự nào**.

Nó tồn tại vì corpus Montessori lệch nặng về một competency. Nguồn có 14 workbook lấy C1 làm
competency chính và **không workbook nào** lấy C5 hay C6. Catalog hiện tại cân bằng 20 game
level mỗi competency. Nạp corpus theo đúng hình dạng của nguồn sẽ đẩy tỉ lệ competency cao
nhất trên thấp nhất vượt ba lần, và đó chính là điều `BR-TCM-07` (luật cân bằng) chặn từ P4.

Hạn ngạch ở mục 7.1 là kết quả chính của file này: một trần cứng cho mỗi competency, tính
ngược từ cổng phủ chứ không từ độ dày của nguồn.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người biên soạn | `content_reviewer` | Đọc hạn ngạch trước khi soạn; xin mã trong khối dành riêng |
| Người review PR | `content_reviewer` | Từ chối PR vượt hạn ngạch, kể cả khi từng bản đều đạt chất lượng |
| Cổng phủ | — | Đo lại ba ma trận sau mỗi lô, chặn khi ô tụt sàn |
| Cổng seed | — | Chạy tám cổng; hạn ngạch là cổng thứ chín ở tầng review, không ở tầng script |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/db/src/seed-content/c1/` tới `c6/` | Người biên soạn | File seeder, chia theo competency như quy ước hiện có |
| `pnpm seed:report` | Người biên soạn | Xem khoảng trống và mức tiêu thụ hạn ngạch |
| `pnpm seed:check` | Người biên soạn | Tám cổng, không chạm database |
| `pnpm check:coverage` | Cổng phủ | Ba ma trận và sàn |

## 4. Main flow

1. Chọn workbook theo thứ tự ở mục 7.3.
2. Đối chiếu hạn ngạch còn lại của competency tương ứng ở mục 7.1; hết hạn ngạch thì dừng,
   không soạn tiếp.
3. Cấp mã trong khối dành riêng ở mục 7.2.
4. Soạn seeder theo hình dạng ở mục 7.2 của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md).
5. Chạy `pnpm seed:check` cho tới khi tám cổng xanh.
6. Chạy `pnpm check:coverage` trên tập published cộng lô đang soạn; ô nào tụt sàn thì sửa
   phân bổ band trước khi mở PR.
7. Mở PR một batch một lần; người review đọc từng bản.
8. Merge, rồi `pnpm seed:content --batch=SEED-MONT-…`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Hết hạn ngạch competency | C1 chạm trần trước khi hết workbook | Dừng lô cho competency đó. Workbook còn lại chờ quyết định ở mục 11 |
| Lô làm thủng một ô phủ | Phân bổ band lệch | Sửa phân bổ, không nới sàn. `BR-TCM-08` chặn publish làm thủng sàn |
| Khuôn lô B chưa `active` | Dạng bài cần khuôn chưa ship | Batch bị chặn ở cổng 1. Chờ [`montessori-template-batch.md`](../01-platform/montessori-template-batch.md) |
| Hai level cùng skill quá giống nhau | Chỉ khác số liệu | Cổng 6 bắt. Đổi bối cảnh và cấu trúc distractor, không chỉ đổi số |
| Một workbook sinh ra ít level hơn dự kiến | Dạng bài trùng nhau sau khi tái biên soạn | Trả hạn ngạch về, ghi vào báo cáo lô. Cấm bù bằng level lặp |
| Emoji cần chưa có trong registry | Vật liệu của workbook | Đăng ký trước theo [`emoji-registry.md`](../01-platform/emoji-registry.md), hoặc đổi vật liệu |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MGL-01` (hạn ngạch là trần cứng) | Hạn ngạch mỗi competency ở mục 7.1 là **trần cứng**; PR vượt trần bị từ chối kể cả khi từng bản đạt chất lượng | Trần tính ngược từ `BR-TCM-07` (luật cân bằng). Vượt trần rồi sửa sau nghĩa là archive nội dung tốt, hoặc nới sàn — cả hai đều tệ hơn dừng đúng lúc |
| `BR-MGL-02` (khối mã dành riêng) | Level Montessori dùng khối số thứ tự từ `0101` trở lên trong mỗi competency | Khối `0001` tới `0020` đã seed. Khối liền kề làm không phân biệt được lô nào khi cần thu hồi một lô sai |
| `BR-MGL-03` (một dạng bài ít nhất hai level) | Mỗi dạng bài đưa vào lô sinh **ít nhất hai** level khác độ khó | Một level cho một dạng bài không đủ để trẻ luyện, và không kiểm được `BR-GLM-08` (tăng một chiều) |
| `BR-MGL-04` (tăng một chiều trong một dạng bài) | Trong cùng một dạng bài, level sau chỉ tăng **một chiều** so với level trước | `BR-GLM-08` (tăng một chiều) — tăng cả số item lẫn số nhiễu cùng lúc làm không biết cái nào gây khó |
| `BR-MGL-05` (đo phủ trước khi mở PR) | Chạy cổng phủ trên tập published cộng lô đang soạn **trước khi** mở PR | Phát hiện ô thủng lúc review là phát hiện sau khi đã tốn công đọc từng bản |
| `BR-MGL-06` (lô A trước lô B) | Nạp hết lô A trước khi mở batch lô B đầu tiên | Lô A không phụ thuộc code mới. Chạy song song hai lô làm đường găng nội dung trộn với đường găng engine |
| `BR-MGL-07` (một batch một workbook) | Một batch chứa level của **đúng một** workbook | Khi một workbook hoá ra sai về bản quyền hoặc sư phạm, thu hồi được nguyên lô bằng một mã batch |
| `BR-MGL-08` (không bù bằng level lặp) | Hạn ngạch chưa dùng hết cấm — **NEVER lấp bằng biến thể chỉ đổi số liệu** | `BR-GLM-07` (level cùng skill phải khác nội dung) — đổi 3 quả thành 4 quả không phải bài học mới. Hạn ngạch là trần, không phải chỉ tiêu |
| `BR-MGL-09` (band theo bảng ánh xạ) | Band tuổi của level lấy từ mục 7.1 của [`montessori-corpus-mapping.md`](montessori-corpus-mapping.md), không chọn lại theo cảm tính khi soạn | `BR-MCM-07` (band tuổi theo phần nguồn) — ba phần của nguồn là một thang tiến trình; chọn lại từng level làm thang đó biến mất |
| `BR-MGL-10` (đa dạng cơ chế trong mỗi ô) | Mỗi ô `competency × band` mà lô Montessori chạm phải giữ **ít nhất hai** mechanic khác nhau | `BR-TCM-05` (đa dạng cơ chế) — một năng lực chỉ luyện qua một cơ chế thì trẻ đang học cơ chế, không học năng lực |
| `BR-MGL-11` (báo cáo lô) | Mỗi batch merge kèm một dòng báo cáo: workbook nguồn, số level, hạn ngạch còn lại, ô phủ bị chạm | Không có dòng đó thì hạn ngạch chỉ tồn tại trong spec, và người soạn thứ hai không biết còn bao nhiêu |
| `BR-MGL-12` (tier gán lúc soạn) | Mọi level Montessori khai `access_tier` tường minh trong seeder | `BR-CSA` yêu cầu `access_tier` là `NOT NULL` không default; nguồn không mang trường này (mục 7.5 của [`montessori-corpus-mapping.md`](montessori-corpus-mapping.md)) nên nó luôn là quyết định của người soạn |

## 7. Data

**Đọc:** `game_levels` · `skills` · `content_tag_map` · bảng ánh xạ Montessori.
**Ghi:** `game_levels` `published` qua `pnpm seed:content`, kèm `content_seed_batches` và
`content_review_log` theo `BR-CSA-03` (bằng chứng phát hành).

### 7.1 Hạn ngạch theo competency

Trần tính ngược từ `BR-TCM-07`: sau khi nạp hết lô, competency nhiều level nhất không được
vượt ba lần competency ít nhất. C5 và C6 không có workbook nguồn nên giữ nguyên 20, và
chúng là mẫu số của phép chia đó.

| Competency | Level published hiện có | Trần lô Montessori | Tổng sau lô |
|---|---:|---:|---:|
| C1 Mathematical Thinking | 20 | 36 | 56 |
| C2 Spatial Thinking | 20 | 9 | 29 |
| C3 Logical Thinking | 20 | 15 | 35 |
| C4 Observation Thinking | 20 | 9 | 29 |
| C5 Language Thinking | 20 | 0 | 20 |
| C6 Executive Function | 20 | 0 | 20 |
| **Tổng** | **120** | **69** | **189** |

Tỉ lệ sau lô là 56 trên 20, tức 2,8 lần — dưới trần ba lần với biên an toàn. Nếu C5 hoặc C6
được bổ sung từ một nguồn khác, trần C1 tính lại theo cùng công thức, không nới bằng tay.

Trần C1 **bị ràng buộc**: 14 workbook C1 với ít nhất hai level mỗi dạng bài vượt xa 36. Đó
là chủ ý — nguồn dày hơn chỗ catalog cần, và thứ tự ở mục 7.3 quyết định workbook nào được
dùng hạn ngạch trước.

### 7.2 Khối mã và mã batch

Mã level giữ nguyên định dạng bốn đoạn ở mục 7.1 của [`id-conventions.md`](../00-foundation/id-conventions.md): competency,
strand, mechanic, số thứ tự bốn chữ số.

| Đoạn | Giá trị cho lô Montessori |
|---|---|
| Competency | Competency chính ở mục 7.1 của [`montessori-corpus-mapping.md`](montessori-corpus-mapping.md) |
| Strand | Strand của skill chính, lấy từ [`taxonomy/index.md`](../../taxonomy/index.md) |
| Mechanic | Đoạn mã ở bảng dưới, với khuôn lô B |
| Số thứ tự | Từ `0101` trở lên, cấp tăng dần trong mỗi competency |
| `batch_code` | `SEED-MONT-<lô><workbook 2 chữ số>` — ví dụ `SEED-MONT-A01`, `SEED-MONT-B16` |

Đoạn `<MECHANIC>` cho mười một khuôn lô B, để mã đọc được ngay từ dòng đầu của diff:

| Khuôn | Đoạn mã | Khuôn | Đoạn mã |
|---|---|---|---|
| `GT-007` cây tách gộp | `NBOND` | `GT-013` tìm đường mê cung | `MAZE` |
| `GT-008` kéo vào ô khuyết | `SLOT` | `GT-014` cân hai bên | `BALAN` |
| `GT-009` loại trừ theo manh mối | `CLUE` | `GT-015` lưới không lặp | `SUDOK` |
| `GT-010` thay thế biểu tượng | `SUBST` | `GT-016` xoay kim đồng hồ | `CLOCK` |
| `GT-011` ma trận chọn hình | `MATRX` | `GT-017` xếp khối và phối cảnh | `BLOCK` |
| `GT-012` nhìn chớp rồi nhớ lại | `FLASH` | | |

### 7.3 Thứ tự nạp

| Bước | Lô | Nhóm khuôn | Workbook | Chặn bởi |
|---:|:--:|:--:|---|---|
| 1 | A | — | 01 · 03 · 05 · 06 · 10 | không gì — chạy được ngay |
| 2 | A | — | 02 · 11 · 15 · 18 · 19 (chỉ dạng bài lô A) | không gì |
| 3 | B | A1 | 07 · 08 · 13 | `GT-007` |
| 4 | B | A1 | 02 · 11 · 15 (dạng bài còn lại) | `GT-008` |
| 5 | B | A2 | 14 | `GT-009` |
| 6 | B | A2 | 12 · 20 | `GT-010` |
| 7 | B | A2 | 21 | `GT-011` |
| 8 | B | B1 | 04 · 09 | `GT-012` · `GT-013` |
| 9 | B | B2 | 16 · 17 · 18 · 19 (dạng bài còn lại) | `GT-014` tới `GT-017` |

Bước 1 và 2 là toàn bộ phần chạy được mà không cần dòng code engine nào. Chúng cũng là phần
duy nhất ước lượng được chắc chắn hôm nay; từ bước 3 trở đi, ngày phụ thuộc lịch của lô khuôn.

Cột `Nhóm khuôn` trỏ về mục 7.6 của [`montessori-template-batch.md`](../01-platform/montessori-template-batch.md). Bước 3 tới 7 chỉ cần
layout mới; bước 8 và 9 cần system engine chưa tồn tại. Nếu phải cắt, cắt bước 9 trước — nó
tốn bốn system cho bốn workbook.

### 7.4 Phân bổ theo band trong một workbook

| Band của workbook | Trần item mỗi level | Nhiễu tối đa | Số level tối thiểu mỗi dạng bài |
|---|---:|---:|---:|
| 3-4 | 4 | 1 | 2 |
| 4-5 | 6 | 2 | 2 |
| 5-6 | 8 | 3 | 2 |

Trần item và nhiễu chép chiếu từ mục 7.1 của [`game-level-model.md`](game-level-model.md) và không được nới
ở đây. Khi một dạng bài gốc vượt trần, chia nhỏ theo `BR-MCM-08` (trần item thắng nguồn).

### 7.5 Phân bổ đợt này — dạng bài nào được nhận

Nguồn có **59 dạng bài** sau chuẩn hoá (`D-RI`). Ở hai level mỗi dạng bài, nạp hết là 118 level
và tỉ lệ cân bằng lên 4,8 lần. Trần ở mục 7.1 chỉ chứa được một phần.

Số ở bảng dưới **đo bằng lệnh** trên [`activity-types-table.md`](../../montessori/dataset/activity-types-table.md)
và trên chính seeder, không ước lượng. Cổng `pnpm lint:montessori-corpus` giữ hai chỗ khớp nhau.

| Competency | Dạng bài trong nguồn | Trần level | Dạng bài nhận đợt này | Dạng bài đã soạn | Level đã soạn |
|---|---:|---:|---:|---:|---:|
| C1 | 35 | 36 | 23 | 18 | 36 |
| C2 | 7 | 9 | 2 | 2 | 4 |
| C3 | 13 | 15 | 5 | 0 | 0 |
| C4 | 4 | 9 | 4 | 4 | 9 |
| **Tổng** | **59** | **69** | **34** | **24** | **49** |

Con số 57 · 33 · 24 của các bản trước là lỗi cộng, sửa ở T99 WP99.0 (2026-08-20). Mã dạng bài
không đổi hàng nào — chỉ tổng đổi.

**Trần C1 đã đầy.** 36 level của C1 chỉ chứa 18 dạng bài ở sàn 2 level mỗi dạng, và 18 dạng ấy
đã soạn xong. Năm dạng C1 còn lại trong nhóm "nhận đợt này" không seed được cho tới khi cổng
người ở CHECKPOINT 3 của Task #99 mở trần hoặc dừng lô. Build khuôn chỉ phục vụ C1 trước cổng
đó là build code chết.

**25 dạng bài còn lại không bị loại** — chúng vẫn nằm trong bảng ánh xạ và chờ đợt sau, sau khi
C5 hoặc C6 có nguồn bổ sung làm mẫu số lớn lên (quyết định `D-RQ`, 2026-08-20). Cắt workbook
khỏi bảng ánh xạ là mất thông tin; hoãn dạng bài thì không.

Thứ tự ưu tiên khi chọn dạng bài, áp theo đúng ba bước:

1. Band thấp trước — 3-4, rồi 4-5, rồi 5-6. Trẻ nhỏ có ít nội dung phù hợp nhất.
2. Dạng bài lô A trước dạng bài lô B. Lô A không chờ khuôn nào.
3. Trong cùng workbook, dạng bài số nhỏ trước — thứ tự nguồn đã là thứ tự tăng độ khó.

### 7.6 Phân bổ `access_tier` theo độ khó

| `difficulty` | `access_tier` |
|---:|---|
| 1 | `free` |
| 2 | `login` |
| 3 | `standard` |
| 4 hoặc 5 | `premium` |

Quy tắc máy kiểm được, và khớp bậc bao hàm của [`access-ladder.md`](../00-foundation/access-ladder.md): level dễ nhất là
mặt tiếp xúc đầu tiên của khách chưa đăng nhập, level khó nhất nằm sau gói trả phí (quyết định
`D-RR`, 2026-08-20). Nó cũng giữ tỉ lệ bốn tier của 120 level đã seed thay vì tự đặt một tỉ lệ mới.

## 8. API contract

Không sở hữu route. Giao diện là CLI seeder và cổng phủ; cả hai thoát khác 0 khi hỏng, không
trả mã lỗi HTTP.

## 9. Acceptance criteria

```gherkin
Scenario: BR-MGL-01 — batch vượt hạn ngạch bị từ chối
  Given competency C1 đã nạp 36 level Montessori
  When mở PR thêm một batch C1 Montessori nữa
  Then người review từ chối PR
  And lý do nêu hạn ngạch đã dùng hết

Scenario: BR-MGL-02 — mã Montessori nằm trong khối dành riêng
  When đọc mã của mọi level thuộc batch có tiền tố SEED-MONT
  Then mọi số thứ tự đều từ 0101 trở lên

Scenario: BR-MGL-03 — dạng bài chỉ có một level bị chặn
  Given một batch chỉ có một level cho một dạng bài
  When người review kiểm checklist lô
  Then mục số level mỗi dạng bài không tick được

Scenario: BR-MGL-05 — lô làm thủng ô phủ bị chặn trước PR
  Given lô đang soạn làm ô C2 band 5-6 chỉ còn một mechanic
  When chạy pnpm check:coverage trên tập published cộng lô
  Then cổng thoát với mã khác 0
  And nêu ô thiếu đa dạng cơ chế

Scenario: BR-MGL-06 — batch lô B mở trước khi lô A xong bị chặn
  Given còn workbook lô A chưa nạp
  When mở batch SEED-MONT-B07
  Then người review từ chối PR
  And lý do nêu thứ tự lô ở mục 7.3

Scenario: BR-MGL-07 — một batch một workbook
  When đọc mọi batch có tiền tố SEED-MONT
  Then mỗi batch chỉ chứa level của đúng một workbook nguồn

Scenario: BR-MGL-08 — level chỉ khác số liệu bị loại
  Given hai level cùng skill chỉ khác số lượng vật
  When chạy pnpm seed:check
  Then cổng 6 fail
  And nêu mã của cả hai bản

Scenario: BR-MGL-09 — band lệch bảng ánh xạ bị bắt
  Given workbook 09 được xếp band 4-5 ở bảng ánh xạ
  When một seeder khai band 5-6 cho level của workbook đó
  Then người review từ chối PR

Scenario: BR-MGL-12 — level thiếu access_tier không seed được
  Given một seeder Montessori không khai access_tier
  When chạy pnpm typecheck
  Then biên dịch fail
  And lỗi trỏ đúng file và dòng của item thiếu

Scenario: BR-MGL-11 — mỗi batch có dòng báo cáo
  When đọc content_seed_batches sau khi nạp một lô Montessori
  Then mỗi hàng có workbook nguồn, số level và hạn ngạch còn lại
```

## 10. Boundaries

**Always**
- Đối chiếu hạn ngạch trước khi soạn bản đầu tiên của một workbook.
- Cấp mã trong khối dành riêng.
- Chạy cổng phủ trước khi mở PR.
- Một batch một workbook.
- Khai `access_tier` tường minh cho từng level.

**Ask first**
- Nới trần của một competency ở mục 7.1.
- Đảo thứ tự nạp ở mục 7.3.
- Cho một workbook chiếm quá một phần tư hạn ngạch của competency nó thuộc về.

**Never**
- Vượt hạn ngạch rồi sửa sau bằng archive.
- Lấp hạn ngạch còn thừa bằng biến thể chỉ đổi số liệu.
- Nới trần item hoặc trần nhiễu theo band.
- Nạp batch lô B khi lô A chưa xong.
- Chọn lại band tuổi khác bảng ánh xạ.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Đoạn thứ ba của mã level đang trôi: 13 giá trị đã seed không giá trị nào khớp tên khuôn~~ **Đóng 2026-08-20 (T98, `D-RP`)**: đoạn đó là **mechanic viết tắt**, đúng như ví dụ ở mục 7.1 của [`id-conventions.md`](../00-foundation/id-conventions.md). 13 giá trị đã seed **giữ nguyên** — mã published bất biến, sửa lại là đổi neo của telemetry. Lô Montessori dùng bảng ở mục 7.2 | — | Đã đóng | D-RP |
| ~~2~~ | ~~Trần C1 bằng 36 chặn nguồn lại còn khoảng một phần ba. Cắt workbook nào?~~ **Đóng 2026-08-20 (T98, `D-RQ`)**: không cắt workbook nào. Nhận 34 trên 59 dạng bài theo thứ tự ưu tiên ở mục 7.5; 25 dạng còn lại hoãn sang đợt sau, vẫn nằm trong bảng ánh xạ. Mẫu số đếm lại ở T99 WP99.0: 59, không phải 57 | — | Đã đóng | D-RQ |
| ~~3~~ | ~~Lô Montessori phân bổ `access_tier` ra sao?~~ **Đóng 2026-08-20 (T98, `D-RR`)**: theo `difficulty`, 1 là `free` tới 4–5 là `premium` — xem mục 7.6. Quyết định này chỉ áp cho lô Montessori; câu hỏi mở số 6 của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) về tỉ lệ toàn corpus vẫn để ngỏ | — | Đã đóng | D-RR |
| ~~4~~ | ~~Sàn phủ có cần tính lại sau khi thêm level lệch về C1 không?~~ **Đóng 2026-08-20 (T98, `D-RS`)**: giữ nguyên sàn. Sàn là mức không được tụt xuống, không phải mục tiêu; để biên an toàn lớn dần là hành vi đúng của một sàn | — | Đã đóng | D-RS |
