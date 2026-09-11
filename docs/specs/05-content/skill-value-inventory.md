---
spec: SKILL-VALUE-INVENTORY
title: Kho giá trị kỹ năng — nguồn sự thật cho dãy giá trị ngôn ngữ và số học
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-09-11
owns:
  - Danh mục kho giá trị kỹ năng ngôn ngữ (chữ cái, chữ ghép, dấu thanh, vần, âm đầu, từ vựng)
  - Danh mục kho giá trị kỹ năng số học (chữ số, số thứ tự, phân tách số, lối biểu diễn lượng, chiều đo, đơn vị lặp)
  - Ràng buộc đối chiếu hai chiều giữa dataset và kho giá trị
  - Cổng kiểm tra check:value-inventory
depends_on:
  - TAXONOMY-SERVICE
  - SKILL-DATASET-MODEL
  - CONCEPT-TOPIC-MODEL
---

# Kho giá trị kỹ năng — nguồn sự thật cho dãy giá trị ngôn ngữ và số học

## 1. Objective

Nhiều kỹ năng ngôn ngữ và nhận thức dạy hoặc kiểm tra một **kho giá trị hữu hạn, xác định**:
29 chữ cái tiếng Việt, 11 chữ ghép, 6 dấu thanh, 53 vần, 22 âm đầu, và các bộ từ vựng theo chủ đề.

Trước Task #255, mã nguồn không có nơi nào nói ra 29 chữ cái hay 6 dấu thanh gồm những gì.
Hệ quả: dataset bị co cụm thành cửa sổ trượt trên vài từ vựng trang trí (`spoon cup bed chair...`),
`C5.ALP.04` ("Nhận đủ 29 chữ cái") chỉ có 5 chữ, và toàn bộ strand `C5.TON` có 0 dấu thanh
nhưng cổng phủ vẫn báo xanh.

Cùng một lỗ tồn tại ở nhánh số học và chưa được lấp. Đo ngày 2026-09-11: **64/110** kỹ năng `C1`
không có một `glyph` nào trong dataset, gồm trọn strand `C1.ORD` (thứ nhất → thứ mười) và
`C1.DAT.01` ("Đếm rồi ghi lại bằng dấu") — hai nhóm kỹ năng **được định nghĩa bằng ký hiệu số**
mà dataset không chứa ký hiệu số nào. Chỉ **46/443** dataset toàn corpus có trường `value`, và
cả 46 đều nằm trong năm strand `C1.ADD` `C1.CNT` `C1.NCOMP` `C1.NREC` `C1.SUB`.

Spec này xác lập **Kho giá trị kỹ năng (Skill Value Inventory)** là nguồn sự thật duy nhất cho
các dãy giá trị học thuật, ở cả hai nhánh ngôn ngữ và số học. Mọi dataset của kỹ năng tương ứng
BẮT BUỘC đối chiếu hai chiều với kho.

Trần của kho số học lấy từ Thông tư 23/2010/TT-BGDĐT — Bộ chuẩn phát triển trẻ em năm tuổi,
chuẩn 23 chỉ số 104: *"Nhận biết con số phù hợp với số lượng trong phạm vi 10"*. Vì vậy 0–10 là
bắt buộc, 11–20 là mở rộng cho band 5-6.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người biên soạn | `content_author` | Soạn dataset bám sát kho giá trị, không tự phát minh giá trị ngoài kho |
| Người duyệt | `content_reviewer` | Đối chiếu danh sách giá trị trước khi duyệt |
| Cổng kiểm tra | CI / `check.sh` | Cưỡng chế hai chiều: dataset ⊆ kho và kho ⊆ hợp các dataset |

## 3. Entry points

| File / Lệnh | Actor | Ghi chú |
|---|---|---|
| `packages/content/src/inventories/c5-*.ts` | Dev / Author | Các hằng số kho giá trị ngôn ngữ |
| `packages/content/src/inventories/c1-*.ts` | Dev / Author | Các hằng số kho giá trị số học |
| `packages/content/src/skills/c5/**` · `packages/content/src/skills/c1/**` | Author | File định nghĩa kỹ năng và dataset |
| `scripts/check-value-inventory.ts` | CI / Dev | Script cổng kiểm tra hai chiều |
| `pnpm check:value-inventory` | CI / Dev | Lệnh chạy cổng trong Phase 1 |

## 4. Main flow

1. Một kỹ năng thuộc nhóm có kho giá trị khai báo tập item trong dataset của nó.
2. Cổng `check:value-inventory` quét toàn bộ dataset của strand/nhóm kỹ năng.
3. Chiều 1 (Tính hợp lệ): Mọi item trong dataset phải thuộc kho giá trị (`dataset ⊆ inventory`).
4. Chiều 2 (Độ bao phủ): Mọi giá trị trong kho phải xuất hiện trong ít nhất một dataset của nhóm (`inventory ⊆ ⋃ dataset`).
5. Nếu vi phạm, cổng báo đỏ chi tiết: giá trị ngoại lai hoặc giá trị còn thiếu trong kho.

## 5. Alternative flows

| Tình huống | Hành vi |
|---|---|
| Kỹ năng mới ở Phase 1 gieo khung (chưa có level) | Ghi nhận nợ độ phủ vào baseline, đo lường giảm dần qua từng lát cắt |
| Dataset chứa item rác (ví dụ: `cup` trong bài chữ cái) | Cổng đỏ ngay lập tức, chặn commit |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SVI-01` (khai báo kho giá trị) | Mọi strand/kỹ năng có dãy giá trị học thuật xác định BẮT BUỘC có kho giá trị trong `packages/content/src/inventories/` | Không thể kiểm tra tính trung thực của bài học nếu không có nguồn sự thật cho các giá trị cần dạy |
| `BR-SVI-02` (dataset là tập con của kho) | Dataset của kỹ năng BẮT BUỘC chỉ chứa các giá trị thuộc kho giá trị tương ứng (`dataset ⊆ inventory`). Cấm — NEVER mượn từ vựng từ bộ từ trang trí | Tránh hiện tượng bài dạy chữ cái hay dấu thanh nhưng lại chứa thìa, cốc, giường, ghế |
| `BR-SVI-03` (kho được phủ trọn) | Hợp các dataset trong nhóm kỹ năng BẮT BUỘC phủ đủ 100% các giá trị trong kho tương ứng (`inventory ⊆ ⋃ dataset`) khi hoàn thành lát cắt | Đảm bảo chương trình không bỏ quên chữ cái, dấu thanh hay âm vần nào |
| `BR-SVI-04` (đối chiếu tự động) | Cổng `check:value-inventory` kiểm tra tự động hai chiều, không dựa vào mắt người duyệt | Người duyệt không thể đếm tay từng chữ cái qua hàng trăm file dataset |
| `BR-SVI-05` (nguồn chung cho dạy và chấm) | Kho giá trị là nguồn sự thật cho cả level dạy `GT-000` (`concept.values[]`) và level chấm `GT-*` | Đảm bảo bài dạy và bài kiểm tra thống nhất hoàn toàn về tập giá trị |
| `BR-SVI-06` (kho số học tồn tại) | Sáu kho số học BẮT BUỘC tồn tại dưới `packages/content/src/inventories/c1-*.ts`: `c1-numeral` · `c1-ordinal` · `c1-number-bond` · `c1-quantity-rep` · `c1-measure-dimension` · `c1-pattern-unit` | Không có nguồn sự thật cho chữ số thì không đo được một bài đếm có chữ số nào không — đúng lỗ đã mắc với 29 chữ cái |
| `BR-SVI-07` (trần chữ số theo Bộ chuẩn) | `c1-numeral` phủ 0–20. Các giá trị 0–10 gắn `required: true`, 11–20 gắn `required: false`. Cổng chỉ đòi phủ trọn phần `required` | Chuẩn 23 chỉ số 104 của Thông tư 23/2010/TT-BGDĐT chỉ bắt buộc trong phạm vi 10; đòi 11–20 ở band 3-4 là đặt sàn trên năng lực thật |
| `BR-SVI-08` (chữ số mang cả ba kênh) | Mỗi mục `c1-numeral` BẮT BUỘC có đủ `glyph` (ký hiệu), `value` (lượng), và `audio_path` (giọng đọc tiếng Việt) | Trẻ 3–6 tuổi chưa đọc được chữ. Một chữ số không có giọng đọc là một hình vẽ; một chữ số không có `value` thì cổng không kiểm được bài đếm |
| `BR-SVI-09` (kỹ năng số học bám kho) | Dataset của kỹ năng thuộc `C1.NREC` `C1.CNT` `C1.NCOMP` `C1.ADD` `C1.SUB` `C1.ORD` BẮT BUỘC chỉ lấy `glyph`/`value` từ `c1-numeral` hoặc `c1-ordinal` | Cùng lý do `BR-SVI-02`: cấm bài đếm mượn vật trang trí thay cho chữ số |
| `BR-SVI-10` (kho phân tách số đóng) | `c1-number-bond` liệt kê trọn 65 phân tách có thứ tự của 1–10. Cấm — NEVER sinh phân tách tại chỗ trong dataset | Tập phân tách là hữu hạn và đếm được; sinh tại chỗ thì không cổng nào biết bài nào còn thiếu |
| `BR-SVI-11` (chiều đo đi theo cặp) | `c1-measure-dimension` khai theo cặp đối lập (`dài–ngắn`, `nặng–nhẹ`, …). Dataset của `C1.MEAS` và `C1.CMP` BẮT BUỘC lấy **cả hai** cực của một cặp, không lấy một cực | So sánh chỉ có một cực thì không phải so sánh — đúng ca `C1.CMP.04` hiện có 5 emoji rời rạc, không trục |
| `BR-SVI-12` (nợ độ phủ về 0) | `scripts/value-inventory-baseline.json` là ratchet một chiều: mỗi lát cắt chỉ được giảm `total_missing_items`, không được tăng. Đích cuối là 0 | Ratchet đặt ở mức nợ hiện tại rồi không ai trả là cách một cổng thật biến thành cổng trang trí; số hiện tại là 30 và đã đứng yên từ Task #255 |

## 7. Data & Inventories

### 7.1 Kho giá trị ngôn ngữ (C5) — đã có

- `c5-letter.ts`: 29 chữ cái tiếng Việt (5 nhóm `LET.01..05`)
- `c5-digraph.ts`: 11 chữ ghép (`DGR.01..02`)
- `c5-tone-mark.ts`: 6 dấu thanh (`TMK.01..03`)
- `c5-rime.ts`: 53 vần tiếng Việt (`RIM.01..06`)
- `c5-onset.ts`: 22 âm đầu tiếng Việt (`ONS.01..04`)
- `c5-vocabulary.ts`: 15 bộ từ vựng GDMN 8–12 từ mỗi bộ (`VOC.06..20`)

### 7.2 Kho giá trị số học (C1) — phải dựng

Cùng hình dạng với kho C5: một `interface` khai `id` `label` `group`, và một hằng
`readonly [...] as const`. Khuôn đối chiếu:
[`packages/content/src/inventories/c5-tone-mark.ts`](../../../packages/content/src/inventories/c5-tone-mark.ts).

| File | Số mục | Trường riêng ngoài `{id,label,group}` | Strand tiêu thụ |
|---|---:|---|---|
| `c1-numeral.ts` | 21 | `glyph` `value` `audio_path` `required` | `C1.NREC` `C1.CNT` `C1.NCOMP` `C1.ADD` `C1.SUB` |
| `c1-ordinal.ts` | 10 | `glyph` `position` `audio_path` | `C1.ORD` |
| `c1-number-bond.ts` | 65 | `whole` `part_a` `part_b` | `C1.NCOMP` `C1.ADD` `C1.SUB` |
| `c1-quantity-rep.ts` | 8 | `kind` `min_value` `max_value` `concreteness` | toàn `C1`, và là từ vựng cho [`numeracy-representation-ladder.md`](numeracy-representation-ladder.md) |
| `c1-measure-dimension.ts` | 6 cặp | `pole_more` `pole_less` `unit_kind` | `C1.MEAS` `C1.CMP` |
| `c1-pattern-unit.ts` | 6 | `signature` `period` | `C1.PAT` |

**`c1-numeral.ts`** — 0–20. `audio_path` trỏ tài sản đã có sẵn trong repo:
`/audio/voice/common/numbers/{value}.mp3` (31 file, đã kiểm ngày 2026-09-11). Nhãn tiếng Việt
viết nguyên văn: `"số không"` … `"số hai mươi"`. `required: true` cho 0–10 theo `BR-SVI-07`.

**`c1-ordinal.ts`** — `thứ nhất` … `thứ mười`. `glyph` dùng dạng viết tắt trẻ đọc được trên thẻ
(`1.` … `10.`), `position` là số nguyên 1–10.

**`c1-number-bond.ts`** — mọi phân tách **có thứ tự** của 1–10. Với mỗi `whole` từ 1 đến 10, liệt
kê `(part_a, part_b)` với `part_a` chạy từ 0 tới `whole`, tức `whole + 1` mục. Tổng
`2 + 3 + … + 11 = 65`.

Giữ **cả hai** cặp đối xứng `(a, b)` và `(b, a)` vì `C1.NCOMP` dạy tính giao hoán bằng chính cặp
đó. Giữ cả cặp chứa 0 vì `C1.NCOMP.01` dạy "gộp với không thì không đổi". Không có `whole = 0`
vì không có bài nào tách số không.

**`c1-quantity-rep.ts`** — từ vựng đóng cho lối biểu diễn một lượng, xếp theo độ cụ thể giảm dần:

| `kind` | `concreteness` | Khoảng dùng tốt | Ghi chú |
|---|---|---:|---|
| `discrete-object` | `concrete` | 1–10 | vật rời đếm được, mặc định hiện nay |
| `finger` | `concrete` | 1–10 | ngón tay, kênh trẻ tự có |
| `number-rod` | `concrete` | 1–10 | thanh liên tục, giáo cụ Montessori |
| `rekenrek` | `semi-concrete` | 1–20 | hạt theo cụm 5 |
| `ten-frame` | `semi-concrete` | 1–20 | cấu trúc nhóm 5 và 10 |
| `dot-pattern` | `semi-concrete` | 1–6 | mặt xúc xắc, nền của subitizing tri giác |
| `tally` | `semi-abstract` | 1–20 | dấu gạch, kênh của `C1.DAT.01` |
| `number-line` | `semi-abstract` | 0–20 | trục có thứ tự, kênh của `C1.CNT.08` |

Chữ số (`numeral`) **không** nằm trong kho này — nó là tầng `abstract` và đã có kho riêng
`c1-numeral.ts`. Luật ghép chữ số với biểu diễn lượng nằm ở
[`numeracy-representation-ladder.md`](numeracy-representation-ladder.md).

**`c1-measure-dimension.ts`** — sáu cặp đối lập, khai cả hai cực trong một mục theo `BR-SVI-11`:
`dài–ngắn` · `cao–thấp` · `nặng–nhẹ` · `to–nhỏ` · `rộng–hẹp` · `đầy–vơi`.

**`c1-pattern-unit.ts`** — `AB` · `AAB` · `ABB` · `ABC` · `ABBA` · `AABB`. `signature` là chuỗi
chữ cái, `period` là độ dài chu kỳ.

### 7.3 Mở rộng cổng

[`scripts/check-value-inventory.ts`](../../../scripts/check-value-inventory.ts) đã có
`InventoryCheckTarget` và `groupItemsByField`. Thêm sáu target `buildC1*Target()` theo đúng khuôn
`buildC5LetTarget()`; không cần đổi lõi so khớp.

## 8. Acceptance criteria

Mỗi scenario map sang đúng một test, tên test mang mã scenario.

```gherkin
Scenario: BR-SVI-02 — item ngoài kho làm cổng đỏ
  Given dataset của C5.LET.03 có thêm một item id "cup"
  When chạy pnpm check:value-inventory
  Then cổng thoát khác 0
  And báo cáo nêu đúng id "cup" là giá trị ngoại lai của target C5.LET

Scenario: BR-SVI-03 — thiếu một giá trị trong kho thì cổng chỉ ra đúng giá trị đó
  Given kho c5-letter.ts có 29 chữ và hợp các dataset C5.LET thiếu chữ "r"
  When chạy pnpm check:value-inventory
  Then cổng thoát khác 0
  And báo cáo liệt kê đúng một id thiếu là "let_r"

Scenario: BR-SVI-06 — thiếu kho số học thì cổng đỏ
  Given packages/content/src/inventories/ không có file c1-numeral.ts
  When chạy pnpm check:value-inventory
  Then cổng thoát khác 0
  And báo cáo nêu target C1.NREC không có kho giá trị

Scenario: BR-SVI-08 — chữ số thiếu giọng đọc thì cổng đỏ
  Given một mục của c1-numeral.ts không có trường audio_path
  When chạy pnpm check:value-inventory
  Then cổng thoát khác 0
  And báo cáo nêu đúng value của mục thiếu audio_path

Scenario: BR-SVI-09 — bài đếm mượn vật trang trí thay chữ số thì cổng đỏ
  Given dataset của C1.ORD.01 chỉ chứa các item emoji không có glyph và không có value
  When chạy pnpm check:value-inventory
  Then cổng thoát khác 0
  And báo cáo nêu C1.ORD.01 không lấy giá trị nào từ c1-ordinal

Scenario: BR-SVI-11 — chiều đo chỉ có một cực thì cổng đỏ
  Given dataset của C1.CMP.04 chỉ chứa cực "nhiều" mà không chứa cực "ít"
  When chạy pnpm check:value-inventory
  Then cổng thoát khác 0
  And báo cáo nêu cặp chiều đo bị khuyết một cực

Scenario: BR-SVI-12 — nợ tăng thì cổng đỏ
  Given scripts/value-inventory-baseline.json ghi total_missing_items là 30
  And corpus hiện đo ra 31 giá trị còn thiếu
  When chạy pnpm check:value-inventory
  Then cổng thoát khác 0
  And báo cáo nêu ratchet đi lùi từ 30 lên 31
```

**Số đo hiện trạng ngày 2026-09-11**, dùng làm mốc đối chiếu khi bắt đầu lát cắt:

| Target | Nợ hiện tại |
|---|---:|
| `C5.ALP.04` | thiếu 26/29 chữ cái |
| `C5.TON` | thiếu 6/6 dấu thanh |
| `total_missing_items` | 30 |
| Kỹ năng `C1` không có `glyph` nào | 64/110 |
| Dataset toàn corpus có `value` | 46/443 |
