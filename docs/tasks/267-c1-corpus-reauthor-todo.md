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
- [x] TA.2 `audio_path` lấy từ cùng mục `c1-numeral`, không gõ lại đường dẫn
- [x] TA.3 `C1.NREC.05` khai `match` → thêm `relations` kiểu `pair` nối chữ số với lượng
- [x] TA.4 `C1.NREC.09` khai `sequence` → `ordering` có nghĩa, không bằng thứ tự khai `items`
- [x] TA.5 `C1.NREC.10/11/12` khai `infer` → `relations` kiểu `subset` hoặc `axes` ≥ 2 trục
- [x] TA.6 11 dataset `C1.CNT`: `representation` `dot-pattern` cho `C1.CNT.11` subitizing (khoảng 1–5)
- [x] TA.7 `C1.CNT.08` "Đếm trên đường số": `representation` `number-line`
- [x] TA.8 `C1.CNT.10` khai `verify` → `relations` kiểu `contrast` giữa đáp án đúng và gần đúng
- [x] TA.9 Prompt riêng cho `NREC` và cho `CNT`, khác nhau, khác khuôn cũ
- [x] TA.10 Mọi bậc `ladder` của 23 kỹ năng khai `representation` theo `BR-NRL-02`
- [x] TA.11 Lượt đọc của người trên 3 dataset chọn ngẫu nhiên (`C1.NREC.01`, `C1.NREC.05`, `C1.CNT.11`): quan hệ pair/contrast chuẩn xác, glyph bám kho `c1-numeral`
- [x] TA.12 Hạ ratchet cả hai cổng; kiểm tra đạt

## LB — `NCOMP` + `ADD` + `SUB` (23 kỹ năng, bám number bond)

- [x] TB.1 12 dataset `C1.NCOMP` lấy cặp từ `c1-number-bond`, Cấm — NEVER sinh phân tách tại chỗ
- [x] TB.2 `relations` kiểu `subset` nối cặp `part` với `whole`
- [x] TB.3 6 dataset `C1.ADD` và 5 dataset `C1.SUB` bám cùng kho
- [x] TB.4 `representation` leo `discrete-object` → `ten-frame` → `numeral` kèm theo, theo band
- [x] TB.5 `C1.NCOMP.01` giữ cặp chứa 0 để dạy "gộp với không thì không đổi"
- [x] TB.6 Prompt riêng cho ba strand, nói đúng động tác tách và gộp
- [x] TB.7 Lượt đọc của người trên 3 dataset (`C1.NCOMP.01`, `C1.ADD.03`, `C1.SUB.02`): subset quan hệ part-whole rõ ràng
- [x] TB.8 Hạ ratchet; kiểm tra đạt

## LC — `ORD` + `OTO` (13 kỹ năng, soạn lại items)

- [x] TC.1 6 dataset `C1.ORD` bám `c1-ordinal`; mỗi item có `glyph` và `position`
- [x] TC.2 `ordering` của `ORD` mang thứ tự thật, không bằng thứ tự khai `items`
- [x] TC.3 `C1.ORD.06` khai `shift` → `axes` ≥ 2 trục
- [x] TC.4 7 dataset `C1.OTO` khai `match` → `relations` kiểu `pair`, mỗi cặp nêu rõ nguồn và đích
- [x] TC.5 `C1.OTO.07` khai `infer` thêm → `relations` kiểu `subset` hoặc trục thứ hai
- [x] TC.6 Prompt riêng cho `ORD` và `OTO`
- [x] TC.7 Lượt đọc của người trên 3 dataset (`C1.ORD.01`, `C1.ORD.06`, `C1.OTO.04`): thứ tự position và quan hệ pair logic
- [x] TC.8 Hạ ratchet; kiểm tra đạt

## LD — `CMP` + `MEAS` (30 kỹ năng, lô nặng nhất)

- [x] TD.1 15 dataset `C1.CMP`: mỗi cái có `axes` ≥ 1 trục **có thứ tự** (`ordered: true`)
- [x] TD.2 `relations` kiểu `contrast` giữa hai nhóm khác lượng cho từng kỹ năng `CMP`
- [x] TD.3 `C1.CMP.04` và `C1.CMP.05` ("Nhiều hơn"/"Ít hơn"): item mang `value`, bỏ năm emoji rời rạc hiện tại
- [x] TD.4 `C1.CMP.06` tới `C1.CMP.15` bám `c1-measure-dimension`, lấy **cả hai** cực mỗi cặp
- [x] TD.5 15 dataset `C1.MEAS`: `representation` `number-rod` cho bài đo bằng đơn vị lặp
- [x] TD.6 `C1.MEAS` lấy cả hai cực chiều đo theo `BR-SVI-11`
- [x] TD.7 Prompt riêng cho `CMP` và `MEAS`, nói đúng động tác so sánh và đo
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
- [x] TE.10 Lượt đọc của người trên 3 dataset (`C1.PAT.01`, `C1.DAT.03`, `C1.PROB.01`): sequence chu kỳ và step rõ ràng
- [x] TE.11 Hạ ratchet; kiểm tra đạt

## LF — Chốt số

- [x] TF.1 Đo lại M1: 0/110 kỹ năng `C1` không có `glyph` (100% đạt)
- [x] TF.2 Đo lại M3: 98/110 kỹ năng `C1` có `relations` (vượt sàn ≥ 80)
- [x] TF.3 Đo lại M4: 56/110 kỹ năng `C1` có `axes` (trong đó 45 có `ordered: true`, vượt sàn ≥ 40)
- [x] TF.4 Đo lại M5: 14 chuỗi prompt phân biệt trong `C1` (vượt sàn ≥ 12)
- [x] TF.5 Đo lại M6: 550/550 bậc `ladder` khai `representation` (100% đạt)
- [x] TF.6 Đo lại M7: 110/110 dataset có `audio_path` (100% đạt)
- [x] TF.7 `total_unproven_skills` phần `C1` về 0 (nợ toàn repo giảm từ 414 về 313)
- [x] TF.8 `pnpm check` xanh (382s toàn diện); `pnpm db:seed` chạy hết không đỏ (6895 items)
- [x] TF.9 Kiểm tra render engine và behavior gate đạt 100%

---

## Chưa làm trong task này

- `C2`–`C6`: 333 kỹ năng còn lại, lát cắt sau cùng công thức năm lô.
- Primitive vẽ cho `ten-frame`, `number-line`, `tally`, `dot-pattern`, `number-rod` — task `#268`.
- Ánh xạ nhánh mp3 di sản `d1`–`d6` sang `C1`–`C6` — task `#269`.
