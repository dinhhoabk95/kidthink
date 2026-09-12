# Task #271 Plan: Trả corpus về đúng hợp đồng — `glyph`, kho giá trị, Cổng 9

> **Mục tiêu**: Review task `#267` (2026-09-12) đã sửa xong phần nghĩa của 110 dataset `C1`,
> nhưng để lộ ba cửa hậu mà chính nó không đóng được trong phạm vi của nó. Task này đóng chúng.
>
> Đây là task **hợp đồng**, không phải task nội dung. Nó không soạn thêm dataset nào; nó sửa
> chỗ dữ liệu và cổng nói dối nhau.

Spec: [`skill-dataset-model.md`](../specs/05-content/skill-dataset-model.md) ·
[`skill-value-inventory.md`](../specs/05-content/skill-value-inventory.md) ·
[`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md).

Chặn bởi: không. Chặn: `#272` (soạn lại `C2`–`C6`) — soạn 333 dataset trước khi bịt ba cửa
này là sinh lại đúng lớp lỗi của `#267` lần thứ hai.

---

## 1. Bối cảnh

Task `#267` đạt cả bảy phép đo `LF` và hai cổng đều xanh lúc khai đóng, trong khi corpus vẫn
sai. Review đã sửa phần nghĩa (7 commit, `pnpm check` xanh, `db:seed` 6895 item) và dựng cổng
`check:dataset-integrity`. Ba việc còn lại **cố ý** không làm trong review, vì mỗi việc là một
quyết định vượt phạm vi "sửa lỗi task 267".

### 1.1 Bốn phép đo mở đầu (đo 2026-09-12)

| # | Phép đo | Hiện tại | Đích |
|---|---|---|---|
| N1 | Vật có `glyph` chỉ lặp lại `image.ref` | 233 vật / 58 kỹ năng `C1` | 0 |
| N2 | Dataset import kho giá trị `inventories/` | 0 / 444 tệp | ≥ 110 (trọn `C1`) |
| N3 | Nợ `check:dataset-integrity` ngoài `C1` | 18 (`C2` 11 · `C4` 7) | 0 |
| N4 | Cổng 9 (`BR-SDS-03`) chạy trong `pnpm check` | Không | Có |

### 1.2 Ba cửa hậu

**Cửa 1 — `glyph` bị dùng làm bản sao của hình.**
`glyph` là ô **ký hiệu** (chữ số, chữ cái); `image` mới là hình. 233 vật có `glyph` đúng bằng
`image.ref` (🌸, 🪙, ⚽…). Trước `#267` những vật đó không có `glyph` nào; mốc M1 *"0/110 kỹ năng
thiếu `glyph`"* được đạt bằng cách chép emoji sang ô ký hiệu.

Hệ quả dây chuyền, đây mới là chỗ đau:

```
Cổng 9 bỏ qua dataset không có glyph nào  (glyphs.size === 0 → pass)
        │
        └── #267 gán glyph cho MỌI vật để đạt M1
                │
                └── Cổng 9 BẬT cho cả engine không vẽ vật nào của dataset
                    (GT-032 dựng cốc nước tự sinh; GT-016 chỉ vẽ kim đồng hồ)
                        │
                        └── phải ĐỘN vật giả mang chữ số cho cổng có cái để thấy
                            (clk_hour_1..12, fill_unit_1..6)
```

Review đã thử gỡ sạch 257 `glyph` trùng hình một lượt: còn lại 7 dataset ở trạng thái lẫn lộn
(một nửa vật có ký hiệu, một nửa không) và đỏ Cổng 9 theo kiểu khác. Nên việc này phải làm có
kế hoạch cho trọn 58 kỹ năng, kèm quyết định *"dataset nào là dataset ký hiệu, dataset nào là
dataset hình"* — không gỡ dần được.

**Cửa 2 — kho giá trị `#265` không có call site nào.**
`packages/content/src/inventories/c1-*.ts` là "nguồn duy nhất" của glyph, value, ordinal,
number bond, chiều đo. **0 trên 444** tệp dataset import nó; mọi giá trị là chữ gõ tay.
`TA.1` `TA.2` `TB.1` `TC.1` `TD.4` của `#267` đều nói "lấy từ kho, không gõ tay" và đều đang mở.
Hệ quả đã đo được: 242 `audio_path` trỏ vào tệp không tồn tại, `n20` hiện "10", `ord_10` là
chuỗi hỏng, và 12 `unit_kind` bịa ngoài 6 cái kho định nghĩa.

**Cửa 3 — 13 level đồng hồ gắn nhầm kỹ năng.**
`GL-C1-CLK-HND-*` và `GL-C1-CLK-TIM-*` nằm ở `C1.MEAS.04` (Nhiều ít), `C1.MEAS.14` (Tiền xu),
`C1.MEAS.15` (Sắp xếp kích thước) — **nợ có trước `#267`**, `#267` chỉ độn `clk_hour_*` để Cổng 9
không thấy. Chỗ đúng là `C1.MEAS.13`, nhưng `BR-SKQ-04` chặn 5 level mỗi cặp (kỹ năng, engine)
nên không dời cả 13 sang được. Đây là quyết định **nội dung**, không phải quyết định kỹ thuật.

### 1.3 Vì sao Cổng 9 phải vào `pnpm check`

`runEightGates` (`packages/content-build/src/gates/runner.ts:598`) là hàm thuần — **0 tham chiếu
database**. Nhưng nó chỉ được gọi trong đường `db:seed`. Suốt review, `pnpm check` xanh ba lần
trong khi `db:seed` đỏ; ba lỗi Cổng 9 chỉ lộ ra ở bước xác minh cuối. Cổng chạy được mà không
chạy là cổng mù.

---

## 2. Kiến trúc — hai quyết định

**QĐ1. `glyph` và `image` tách vai, không chồng.**
Một vật mang `glyph` khi và chỉ khi nó dạy một **ký hiệu viết được** (chữ số, chữ cái, dấu).
Vật là tranh (quả táo, con chó, mặt đồng hồ) thì chỉ có `image`. Kéo theo: Cổng 9 đo "khái niệm
hiện ra" bằng `glyph` sẽ tự động **bỏ qua** dataset tranh — đúng như trước `#267` — và những vật
độn mang chữ số mất lý do tồn tại.

**QĐ2. Kho giá trị là nguồn, dataset là chỗ dùng.**
Dataset import từ `inventories/` thay vì gõ tay. Bắt được cả một lớp lỗi mà cổng hiện tại không
thấy: đường dẫn mp3 sai, emoji sai, `unit_kind` bịa. Làm theo strand, mỗi strand một commit, vì
sửa đồng loạt 110 tệp là cách [[kidthink-cam-bulk-replacement-damage]] đã xảy ra một lần.

---

## 3. Phạm vi

**Trong phạm vi**: 58 kỹ năng `C1` có `glyph` trùng hình · 110 dataset `C1` chuyển sang import kho ·
18 vi phạm toàn vẹn ngoài `C1` · Cổng 9 vào `pnpm check` · 13 level đồng hồ.

**Cấm — NEVER trong task này**: soạn lại nội dung `C2`–`C6` (việc của `#272`) · khai lại
`representation` (việc của `#268`) · gắn `audio_path` mới (việc của `#269`) · nới bất kỳ ngưỡng
nào của `BR-SKQ-04` hay `check:dataset-integrity` để cho qua.

---

## 4. Năm lô

| Lô | Nội dung | Chặn bởi | Cỡ |
|---|---|---|---|
| `LA` | Cổng 9 vào `pnpm check`, kèm ca âm | — | S |
| `LB` | Tách vai `glyph` / `image` trên 58 kỹ năng | `LA` | L |
| `LC` | 13 level đồng hồ — quyết định và thi hành | `LB` | M |
| `LD` | Dataset `C1` import kho giá trị, theo strand | `LA` | L |
| `LE` | Hạ nợ toàn vẹn ngoài `C1` về 0 | — | S |

`LA` chạy trước vì nó biến "sửa đúng chưa" từ phỏng đoán thành phép đo. `LE` độc lập, chạy song
song được với bất kỳ lô nào.

---

## 5. Rủi ro

| Rủi ro | Mức | Cách chặn |
|---|---|---|
| Gỡ `glyph` làm dataset lẫn lộn, đỏ Cổng 9 kiểu khác (đã xảy ra 1 lần trong review) | Cao | `LB` phân loại TRỌN 58 kỹ năng thành "ký hiệu" / "tranh" trước khi sửa dòng nào; Cấm — NEVER gỡ từng vật |
| Đưa Cổng 9 vào `pnpm check` làm cổng đỏ ngay | Trung bình | `LA` chạy trước `LB`; nếu đỏ thì đó là đo được nợ thật, ghi baseline rồi hạ dần |
| Dời level đồng hồ vỡ `BR-SKQ-04` | Trung bình | `LC` chốt cách xử lý (thêm kỹ năng đồng hồ hay bỏ bớt level) **trước** khi động vào tệp |
| Chuyển sang import kho làm lệch giá trị đang chạy | Trung bình | `LD` làm theo strand, mỗi strand một commit, `db:seed` sau mỗi lô |

---

## 6. Chưa làm trong task này

- `C2`–`C6`: 333 kỹ năng, hiện **0 relations · 0 axes · 1 prompt** mỗi năng lực — đúng trạng thái
  `C1` trước `#267`. Cần plan riêng (`#272`) sau khi task này xong.
- Primitive vẽ và trường `representation` — task [`#268`](268-numeracy-render-primitives-plan.md).
- Thu âm và gắn `audio_path` còn thiếu — task [`#269`](269-play-narration-coverage-plan.md).
