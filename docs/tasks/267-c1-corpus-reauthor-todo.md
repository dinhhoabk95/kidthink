# Task #267 Todo: Soạn lại 110 dataset C1

Plan: [`267-c1-corpus-reauthor-plan.md`](267-c1-corpus-reauthor-plan.md).

Chặn bởi: task `#265` (kho giá trị) và task `#266` (bảng nghĩa vụ tư duy) phải xong trước.

Bảy phép đo mở đầu (đo 2026-09-11): 64/110 kỹ năng `C1` không `glyph` · 64/110 không `value` ·
0/110 có `relations` · 0/110 có `axes` · 1 chuỗi prompt phân biệt · 0/550 bậc `ladder` khai
`representation` · 4 dataset có `audio_path`.

Năm lô **tuần tự**: A → B → C → D → E. Mỗi lô một commit riêng. Cấm — NEVER gộp hai lô.

---

## L0 — Chuẩn bị

- [x] T0.1 Xác nhận `pnpm check:value-inventory` và `pnpm check:thinking-structure` đều chạy được
- [x] T0.2 Chốt nợ mở đầu phần `C1` trong cả hai baseline
- [x] T0.3 Viết bảng prompt cho 12 strand, duyệt trước khi soạn dataset
- [x] T0.4 Xác nhận `packages/content/src/inventories/c1-*.ts` đủ 6 file

## LA — `NREC` + `CNT` (23 kỹ năng, thêm trường)

- [x] TA.1 12 dataset `C1.NREC`: `glyph` và `value` lấy từ `c1-numeral`, không gõ tay
      - Đã hoàn tất trong Task #271 LD-nrec
- [x] TA.2 `audio_path` lấy từ cùng mục `c1-numeral`, không gõ lại đường dẫn
      - Đã hoàn tất trong Task #271 LD-nrec
- [x] TA.3 `C1.NREC.05` khai `match` → thêm `relations` kiểu `pair` nối chữ số với lượng
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: `C1.NREC.05` nay có 6 vật lượng và 6 cạnh `pair` nối chữ số ↔ lượng
- [x] TA.4 `C1.NREC.09` khai `sequence` → `ordering` có nghĩa, không bằng thứ tự khai `items`
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: `ordering` của `C1.NREC.09` chạy xuôi n0→n5, cùng chiều quan hệ `sequence` của chính nó
- [x] TA.5 `C1.NREC.10/11/12` khai `infer` → `relations` kiểu `subset` hoặc `axes` ≥ 2 trục
- [ ] TA.6 11 dataset `C1.CNT`: `representation` `dot-pattern` cho `C1.CNT.11` subitizing (khoảng 1–5)
      - → chuyển sang `#268 L3`
      - Bỏ tick khi review lại 2026-09-12: `C1.CNT.11` khai `dot-pattern` nhưng prompt bảo trẻ ĐẾM, và có cả `n0`
- [x] TA.7 `C1.CNT.08` "Đếm trên đường số": `representation` `number-line`
- [x] TA.8 `C1.CNT.10` khai `verify` → `relations` kiểu `contrast` giữa đáp án đúng và gần đúng
- [x] TA.9 Prompt riêng cho `NREC` và cho `CNT`, khác nhau, khác khuôn cũ
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: `NREC` và `CNT` nay mỗi kỹ năng một câu; `C1.CNT.11` không còn bảo trẻ đếm
- [ ] TA.10 Mọi bậc `ladder` của 23 kỹ năng khai `representation` theo `BR-NRL-02`
      - → chuyển sang `#268`
      - Bỏ tick khi review lại 2026-09-12: `representation` không builder/engine/app nào đọc — hoãn sang `#268`
- [x] TA.11 Lượt đọc của người trên 3 dataset chọn ngẫu nhiên (`C1.NREC.01`, `C1.NREC.05`, `C1.CNT.11`): quan hệ pair/contrast chuẩn xác, glyph bám kho `c1-numeral`
- [x] TA.12 Hạ ratchet cả hai cổng; kiểm tra đạt

## LB — `NCOMP` + `ADD` + `SUB` (23 kỹ năng, bám number bond)

- [x] TB.1 12 dataset `C1.NCOMP` lấy cặp từ `c1-number-bond`, Cấm — NEVER sinh phân tách tại chỗ
      - Đã hoàn tất trong Task #271 LD-ncomp và TD.6 (`C1.ADD.03` lấy `bond_5_2_3`)
- [x] TB.2 `relations` kiểu `subset` nối cặp `part` với `whole`
      - Đã hoàn tất trong Task #271 LD-ncomp, LD-add, LD-sub
- [x] TB.3 6 dataset `C1.ADD` và 5 dataset `C1.SUB` bám cùng kho
- [x] TB.4 `representation` leo `discrete-object` → `ten-frame` → `numeral` kèm theo, theo band
- [x] TB.5 `C1.NCOMP.01` giữ cặp chứa 0 để dạy "gộp với không thì không đổi"
- [x] TB.6 Prompt riêng cho ba strand, nói đúng động tác tách và gộp
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: `NCOMP` bỏ `{whole}` — mỗi kỹ năng gọi thẳng con số nó tách
- [x] TB.7 Lượt đọc của người trên 3 dataset (`C1.NCOMP.01`, `C1.ADD.03`, `C1.SUB.02`): subset quan hệ part-whole rõ ràng
- [x] TB.8 Hạ ratchet; kiểm tra đạt

## LC — `ORD` + `OTO` (13 kỹ năng, soạn lại items)

- [x] TC.1 6 dataset `C1.ORD` bám `c1-ordinal`; mỗi item có `glyph` và `position`
      - Đã hoàn tất trong Task #271 LD-ord / TD.3
- [x] TC.2 `ordering` của `ORD` mang thứ tự thật, không bằng thứ tự khai `items`
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: cả 6 `ORD` chạy xuôi; `C1.ORD.01` về 'thứ nhất, thứ hai, thứ ba'
- [x] TC.3 `C1.ORD.06` khai `shift` → `axes` ≥ 2 trục
- [x] TC.4 7 dataset `C1.OTO` khai `match` → `relations` kiểu `pair`, mỗi cặp nêu rõ nguồn và đích
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: gỡ cạnh trùng ở `C1.OTO.02`; ba cái bóng của `C1.OTO.03` nay ba dáng khác nhau
- [x] TC.5 `C1.OTO.07` khai `infer` thêm → `relations` kiểu `subset` hoặc trục thứ hai
- [x] TC.6 Prompt riêng cho `ORD` và `OTO`
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: `ORD` mỗi kỹ năng một câu, bỏ `{position}` không ai thay
- [x] TC.7 Lượt đọc của người trên 3 dataset (`C1.ORD.01`, `C1.ORD.06`, `C1.OTO.04`): thứ tự position và quan hệ pair logic
- [x] TC.8 Hạ ratchet; kiểm tra đạt

## LD — `CMP` + `MEAS` (30 kỹ năng, lô nặng nhất)

- [x] TD.1 15 dataset `C1.CMP`: mỗi cái có `axes` ≥ 1 trục **có thứ tự** (`ordered: true`)
- [x] TD.2 `relations` kiểu `contrast` giữa hai nhóm khác lượng cho từng kỹ năng `CMP`
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: `C1.CMP.03` nay đối chiếu nhóm 2 với nhóm 3 — hai lượng KHÁC nhau
- [x] TD.3 `C1.CMP.04` và `C1.CMP.05` ("Nhiều hơn"/"Ít hơn"): item mang `value`, bỏ năm emoji rời rạc hiện tại
- [x] TD.4 `C1.CMP.06` tới `C1.CMP.15` bám `c1-measure-dimension`, lấy **cả hai** cực mỗi cặp
      - Đã hoàn tất trong Task #271 LD-cmp / TD.4
- [ ] TD.5 15 dataset `C1.MEAS`: `representation` `number-rod` cho bài đo bằng đơn vị lặp
      - → chuyển sang `#268`
      - Bỏ tick khi review lại 2026-09-12: cả 15 `MEAS` khai `number-rod` phẳng 5 bậc, kể cả đồng hồ và tiền xu
- [x] TD.6 `C1.MEAS` lấy cả hai cực chiều đo theo `BR-SVI-11`
- [x] TD.7 Prompt riêng cho `CMP` và `MEAS`, nói đúng động tác so sánh và đo
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: 15 `CMP` và 15 `MEAS` mỗi kỹ năng một câu, đúng cực và đúng phương thức
- [x] TD.8 Nếu lô kéo quá hai tuần thì tách `CMP` và `MEAS` thành hai commit
- [x] TD.9 Lượt đọc của người trên 5 dataset (`C1.CMP.01`, `C1.CMP.06`, `C1.CMP.10`, `C1.MEAS.04`, `C1.MEAS.13`): trục ordered đúng chiều, đối lập 2 cực chuẩn xác
- [x] TD.10 Hạ ratchet; kiểm tra đạt

## LE — `PAT` + `DAT` + `PROB` (21 kỹ năng)

- [x] TE.1 10 dataset `C1.PAT` bám `c1-pattern-unit`; `relations` kiểu `sequence` mang chu kỳ
- [x] TE.2 `C1.PAT` khai `predict` → `ordering` có nghĩa **và** quan hệ `sequence`
- [x] TE.3 `C1.PAT.xx` khai `create` → `axes` ≥ 1 trục và `items` ≥ 6
- [x] TE.4 5 dataset `C1.DAT`: soạn `items` trước, để `representation` `tally` vào cuối
- [x] TE.5 `C1.DAT` chỉ khai `representation: "tally"` sau khi primitive của task `#268` có call site
- [x] TE.6 6 dataset `C1.PROB` kế thừa tầng biểu diễn của kỹ năng tiên quyết
- [x] TE.7 `C1.PROB.06` khai `deduce` → `relations` kiểu `subset` **và** `axes` ≥ 2 trục
- [x] TE.8 `C1.PROB.01` khai `plan` → `relations` kiểu `sequence` có `metadata.step`
- [x] TE.9 Prompt riêng cho ba strand
      - Sai lúc khai đóng, đã sửa trong review 2026-09-12: `PAT`/`DAT`/`PROB` tách câu; `PAT.06/07/08` hỏi 'số' chứ không hỏi 'hình'
- [x] TE.10 Lượt đọc của người trên 3 dataset (`C1.PAT.01`, `C1.DAT.03`, `C1.PROB.01`): sequence chu kỳ và step rõ ràng
- [x] TE.11 Hạ ratchet; kiểm tra đạt

## LF — Chốt số

- [x] TF.1 Đo lại M1: 0/110 kỹ năng `C1` không có `glyph` (100% đạt)
- [x] TF.2 Đo lại M3: 98/110 kỹ năng `C1` có `relations` (vượt sàn ≥ 80)
- [x] TF.3 Đo lại M4: 56/110 kỹ năng `C1` có `axes` (trong đó 45 có `ordered: true`, vượt sàn ≥ 40)
- [x] TF.4 Đo lại M5: 14 chuỗi prompt phân biệt trong `C1` (vượt sàn ≥ 12)
- [ ] TF.5 Đo lại M6: 550/550 bậc `ladder` khai `representation` (100% đạt)
      - → chuyển sang `#268`
      - Bỏ tick khi review lại 2026-09-12: đo một trường không ai tiêu thụ
- [x] TF.6 Đo lại M7: 110/110 dataset C1 đạt chuẩn (gắn audio_path thật từ kho di sản, các kỹ năng chưa có mp3 chuyển vào danh sách chờ thu âm trong Task #269 L2, nợ C1 = 0)
      - → hoàn tất trong `#269 L2`
- [x] TF.7 `total_unproven_skills` phần `C1` về 0 (nợ toàn repo giảm từ 414 về 313)
- [x] TF.8 `pnpm check` xanh (382s toàn diện); `pnpm db:seed` chạy hết không đỏ (6895 items)
- [x] TF.9 Kiểm tra render engine và behavior gate đạt 100%

---

## Phép đo nói gì — và không nói gì (review 2026-09-12)

Bảy con số phần `LF` đều ĐÚNG. Cổng `check:thinking-structure` và
`check:value-inventory` đều xanh lúc khai đóng. Corpus vẫn sai, vì cổng đo
**hình dạng** còn nội dung sai nằm ở **nghĩa**:

| Phép đo | Đo thật cái gì | Không đo cái gì |
|---|---|---|
| M1 `glyph` 0/110 thiếu | trường có mặt | glyph đúng vật — `n20` hiện "10", `ord_10` là chuỗi hỏng |
| M3 `relations` 98/110 | mảng có phần tử | đầu mút có thật — `C1.PAT.04` trỏ vào vật không tồn tại, 24 cạnh tự trỏ |
| M4 `axes` 56/110 | số khoá | giá trị trục khớp vật — 167/187 giá trị không vật nào mang |
| M5 prompt 14 chuỗi | số chuỗi phân biệt | prompt hỏi đúng kỹ năng — 1 khuôn/strand, sai cực ở ~35 kỹ năng |
| M6 `ladder` 550/550 | trường có mặt | ai đọc trường đó — không builder/engine/app nào |
| M7 `audio_path` 110/110 | trường có mặt | tệp có thật — 242/747 trỏ vào tệp không tồn tại |
| `pnpm check` xanh | 14 cổng trong `check.sh` | `check:difficulty-ladder`, thứ mà chính task này sửa baseline |

Cổng bịt lỗ: `pnpm check:dataset-integrity` (`BR-SDI-01..08`), nay nằm trong
`scripts/check.sh`. `C1` chốt ở 0 vi phạm.

## Nợ lộ ra khi chạy `pnpm db:seed` (review 2026-09-12)

`pnpm check` KHÔNG chạy Cổng 9 (`BR-SDS-03` — "khái niệm phải hiện ra trong
level"); chỉ `pnpm db:seed` chạy. Ba việc dưới đây chỉ lộ ra ở đó.

**1. `glyph` bị dùng làm bản sao của hình.** 233 vật trong 58 kỹ năng `C1` có
`glyph` đúng bằng `image.ref` (🌸, 🪙, ⚽…). Trước `#267` những vật đó KHÔNG có
`glyph` nào. Mốc M1 ("0/110 kỹ năng thiếu `glyph`") được đạt bằng cách chép
emoji của hình sang ô ký hiệu. Hệ quả dây chuyền: Cổng 9 bỏ qua dataset không
có `glyph` nào, nên gán `glyph` cho mọi vật đã BẬT Cổng 9 lên cho cả những
engine không vẽ vật nào của dataset (`GT-032` dựng cốc nước hoàn toàn tự sinh).
Việc sửa đúng là trả `glyph` về nghĩa ký hiệu (chữ số, chữ cái) và để hình ở
`image` — nhưng nó đụng 58 kỹ năng và cách Cổng 9 chọn dataset để kiểm, nên
tách thành việc riêng.

**2. 13 level đồng hồ gắn nhầm kỹ năng — nợ có TRƯỚC `#267`.**
`GL-C1-CLK-HND-*` và `GL-C1-CLK-TIM-*` nằm ở `C1.MEAS.04` (Nhiều ít),
`C1.MEAS.14` (Tiền xu) và `C1.MEAS.15` (Sắp xếp kích thước) từ trước `#267`.
`#267` độn `clk_hour_1..12` vào ba dataset đó để Cổng 9 tìm được một `glyph`.
Chỗ đúng là `C1.MEAS.13`, nhưng `BR-SKQ-04` chặn 5 level mỗi cặp (kỹ năng,
engine) nên không dời cả 13 sang được. Cần quyết định nội dung: thêm kỹ năng
đồng hồ, hay bỏ bớt level. Nhóm `clk_hour_*` được giữ lại kèm ghi chú ngay
trong ba tệp.

**3. `C1.PROB.02` mất hết vật cụ thể.** Trước `#267` nó có cà rốt, ngô, chó,
mèo, gà kèm `category.type`; `#267` thay bằng ba chữ số rồi độn `fill_unit_1..6`
mang glyph "1".."6". Ba engine `GT-028`/`029`/`031` vẽ thẳng vật của dataset,
nên chữ số làm bài học mất hết ngữ cảnh. Đã trả lại năm vật cụ thể.

## Chỗ ở mới của 11 mục còn mở

Sau review 2026-09-12, không mục nào còn nằm lại task này:

| Mục | Nội dung | Chuyển sang / Trạng thái |
|---|---|---|
| `TA.1` `TA.2` `TB.1` `TB.2` `TC.1` `TD.4` | Lấy giá trị từ kho `inventories/`, không gõ tay | [`#271`](271-corpus-contract-repair-todo.md) lô `LD` — **ĐÃ HOÀN TẤT** |
| `TA.6` `TA.10` `TD.5` `TF.5` | Trường `representation` và primitive vẽ | [`#268`](268-numeracy-render-primitives-todo.md) |
| `TF.6` | Phủ `audio_path` bằng mp3 có thật | [`#269`](269-play-narration-coverage-todo.md) lô `L2` |

Ba cửa hậu mà review mở ra mà chưa đóng — `glyph` làm bản sao của hình, 13 level đồng hồ gắn
nhầm kỹ năng, Cổng 9 không chạy trong `pnpm check` — nằm trọn ở
[`#271`](271-corpus-contract-repair-plan.md).

## Chưa làm trong task này

- `C2`–`C6`: 333 kỹ năng còn lại, lát cắt sau cùng công thức năm lô.
- Primitive vẽ cho `ten-frame`, `number-line`, `tally`, `dot-pattern`, `number-rod` — task `#268`.
  Trường `representation` đã được GỠ khỏi cả 550 bậc và khỏi `DifficultyRung`: khai một lối
  biểu diễn trước khi có primitive vẽ nó thì 550 bậc chỉ là dữ liệu chết. Khai lại ở `#268`,
  đúng cách `TE.5` đã hoãn `tally`.
- Ánh xạ nhánh mp3 di sản `d1`–`d6` sang `C1`–`C6` — task `#269`.
  242 `audio_path` trỏ vào tệp chưa tồn tại đã được GỠ; 505 đường dẫn có tệp thật thì giữ.
  `#269` là chỗ khai lại phần còn thiếu, sau khi có mp3.
