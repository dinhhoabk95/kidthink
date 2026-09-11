# Task #267 Plan: Soạn lại 110 dataset C1 — bám kho giá trị, mang cấu trúc tư duy

> **Mục tiêu**: Sau task `#265` có kho giá trị số học và sau task `#266` có bảng nghĩa vụ tư duy,
> 110 dataset `C1` vẫn là bản sao của một khuôn máy. Task này soạn lại chúng để corpus dạy đúng
> kỹ năng nó gắn.
>
> Đây là task **nội dung**, không phải task hạ tầng. Nó tiêu thụ hai cổng đã dựng và hạ nợ của
> chúng theo từng strand.

Spec: [`skill-value-inventory.md`](../specs/05-content/skill-value-inventory.md) ·
[`skill-thinking-structure.md`](../specs/05-content/skill-thinking-structure.md) ·
[`numeracy-representation-ladder.md`](../specs/05-content/numeracy-representation-ladder.md).

Chặn bởi: task `#265` và task `#266` phải xong trước. Soạn nội dung trước khi có cổng đo là cách
sinh ra 443 bản sao lần thứ hai.

---

## 1. Bối cảnh

### 1.1 Bảy phép đo mở đầu (đo 2026-09-11)

| # | Phép đo | Hiện tại | Đích |
|---|---|---|---|
| M1 | Kỹ năng `C1` không có `glyph` nào | 64 / 110 | 0 |
| M2 | Kỹ năng `C1` không có `value` nào | 64 / 110 | 0 cho strand số, giữ nguyên cho `PAT` |
| M3 | Kỹ năng `C1` viết `relations` | 0 / 110 | ≥ 80 |
| M4 | Kỹ năng `C1` viết `axes` | 0 / 110 | ≥ 40 |
| M5 | Chuỗi `prompt_template` phân biệt trong `C1` | 1 | ≥ 12, một cho mỗi strand |
| M6 | Bậc `ladder` của `C1` khai `representation` | 0 / 550 | 550 |
| M7 | Item của `C1` có `audio_path` | 4 dataset | 110 dataset |

### 1.2 Hiện trạng theo strand

| Strand | Kỹ năng | `glyph` | `value` | Tư duy khai | Việc phải làm |
|---|---:|---:|---:|---|---|
| `C1.NREC` | 12 | 12 | 12 | `observe` `match` `sequence` `infer` `describe` | Bám `c1-numeral`; thêm `relations` cho `match` và `sequence` |
| `C1.CNT` | 11 | 11 | 11 | `count` `observe` `sequence` `verify` `predict` `sort` `infer` | Thêm `representation` `dot-pattern` cho subitizing, `number-line` cho `C1.CNT.08` |
| `C1.NCOMP` | 12 | 12 | 12 | — | Bám `c1-number-bond`; `relations` kiểu `subset` |
| `C1.ADD` | 6 | 6 | 6 | — | Bám `c1-number-bond` |
| `C1.SUB` | 5 | 5 | 5 | — | Bám `c1-number-bond` |
| `C1.CMP` | 15 | **0** | **0** | `compare` `count` | **Viết lại trọn**: `axes` có thứ tự, `relations` kiểu `contrast`, cả hai cực chiều đo |
| `C1.MEAS` | 15 | **0** | **0** | `compare` `observe` | **Viết lại trọn**: bám `c1-measure-dimension`, `representation` `number-rod` |
| `C1.PAT` | 10 | **0** | **0** | `observe` `infer` `predict` `create` | Bám `c1-pattern-unit`; `relations` kiểu `sequence` |
| `C1.OTO` | 7 | **0** | **0** | `match` `observe` `sequence` `infer` | `relations` kiểu `pair` bắt buộc |
| `C1.ORD` | 6 | **0** | **0** | `sequence` `count` `observe` `infer` `shift` | Bám `c1-ordinal`; `ordering` phải có nghĩa |
| `C1.PROB` | 6 | **0** | **0** | `plan` `solve` `verify` `sort` `infer` `deduce` | Kế thừa tầng của kỹ năng tiên quyết |
| `C1.DAT` | 5 | **0** | **0** | `count` `create` `compare` `observe` `infer` | `representation` `tally`; chờ primitive của task `#268` |

### 1.3 Ca chứng minh — `C1.CMP.04`

Kỹ năng *"Nhiều hơn"*, khai `["compare","count"]`. Dataset hiện tại:

```typescript
items: [
  { id: "chair",      label: "cái ghế",     image: { kind: "emoji", ref: "🪑" }, category: { type: "đồ dùng" } },
  { id: "apple",      label: "quả táo",     image: { kind: "emoji", ref: "🍎" }, category: { type: "hoa quả" } },
  { id: "banana",     label: "quả chuối",   image: { kind: "emoji", ref: "🍌" }, category: { type: "hoa quả" } },
  { id: "watermelon", label: "dưa hấu",     image: { kind: "emoji", ref: "🍉" }, category: { type: "hoa quả" } },
  { id: "carrot",     label: "củ cà rốt",   image: { kind: "emoji", ref: "🥕" }, category: { type: "rau củ" } },
],
phrasing: { prompt_template: "Bé hãy chọn đúng {label} nhé!", … }
```

Năm vật rời rạc, không lượng, không quan hệ, không trục. Prompt mô tả động tác **nhận diện**.
Bài sinh ra từ đây là bài từ vựng mang nhãn `compare`.

Dataset đích phải có: một trục `axes` đếm được và **có thứ tự**, ít nhất một quan hệ `contrast`
giữa hai nhóm khác lượng, item mang `value`, và prompt nói đúng động tác so sánh.

---

## 2. Thiết kế

### 2.1 Thứ tự soạn — dễ trước, khó sau

Năm strand đã có `glyph` và `value` (`NREC` `CNT` `NCOMP` `ADD` `SUB`, 46 kỹ năng) chỉ cần **thêm**
`relations`, `axes`, `representation`, `audio_path` và viết lại prompt. Bảy strand còn lại (64 kỹ
năng) phải soạn lại `items` từ đầu.

| Lô | Strand | Kỹ năng | Tính chất |
|---|---|---:|---|
| A | `NREC` `CNT` | 23 | Thêm trường, giữ `items` |
| B | `NCOMP` `ADD` `SUB` | 23 | Thêm trường, bám `c1-number-bond` |
| C | `ORD` `OTO` | 13 | Soạn lại `items`, cấu trúc đơn giản |
| D | `CMP` `MEAS` | 30 | Soạn lại `items` và trục; lô nặng nhất |
| E | `PAT` `DAT` `PROB` | 21 | Soạn lại; `DAT` chờ primitive tally của task `#268` |

Mỗi lô hạ ratchet của cả hai cổng và commit riêng. Cấm gộp hai lô vào một commit — gộp thì không
truy được lô nào làm hỏng số.

### 2.2 Prompt — một cho mỗi strand, không một cho mỗi kỹ năng

Câu hỏi mở 2 của `skill-thinking-structure.md` chưa chốt đích cuối. Task này đặt mốc trung gian:
**ít nhất một `prompt_template` phân biệt cho mỗi strand `C1`**, tức ≥ 12. Prompt nói đúng động
tác, không nói tên kỹ năng:

| Strand | Hình dạng prompt |
|---|---|
| `C1.CMP` | "Bên nào có nhiều {label} hơn?" |
| `C1.ORD` | "Bạn nào đứng thứ {position}?" |
| `C1.CNT` | "Bé đếm xem có mấy {label}?" |
| `C1.NCOMP` | "Thêm mấy nữa thì đủ {whole}?" |

Chuỗi hiển thị viết nguyên văn tiếng Việt theo mục 8 của `CONVENTIONS.md`.

### 2.3 `representation` cho mỗi bậc `ladder`

`BR-NRL-01` đòi mỗi bậc khai `representation`. `BR-NRL-02` cấm nhảy quá một tầng giữa hai bậc
liền kề. Hình dạng chuẩn cho một kỹ năng band `5-6`:

| Bậc | `representation` | `concreteness` |
|---|---|---|
| 1 | `discrete-object` | `concrete` |
| 2 | `discrete-object` | `concrete` |
| 3 | `ten-frame` | `semi-concrete` |
| 4 | `ten-frame` | `semi-concrete` |
| 5 | `numeral` kèm `ten-frame` | `abstract` kèm theo |

Band `3-4` dừng ở `concrete` cho cả năm bậc; band `4-5` lên tới `semi-concrete`.

### 2.4 `audio_path` cho item số

Item lấy `glyph` từ `c1-numeral` thì lấy luôn `audio_path` từ cùng mục — không gõ lại đường dẫn.
Đây là cách `BR-PNR-05` tránh sinh hai bản đọc cho cùng một con số.

Item không phải số (`C1.CMP` `C1.MEAS` `C1.PAT`) cần giọng riêng; nguồn là nhánh `d1` với 424
file. Ánh xạ nhánh di sản thuộc task `#269`; task này chỉ gắn những file đã ánh xạ được.

---

## 3. Rủi ro

| Rủi ro | Dấu hiệu | Cách chặn |
|---|---|---|
| Soạn để cổng xanh, không để trẻ học | Cổng xanh, `relations` có nhưng nội dung vô nghĩa | Mỗi lô có một lượt đọc của người trên 3 dataset chọn ngẫu nhiên; ghi kết quả vào todo |
| Lặp lại khuôn máy lần hai | 110 dataset khác khuôn cũ nhưng giống nhau | M5 đo số prompt phân biệt; thêm phép đo số `axes` phân biệt theo strand |
| Lô D quá nặng rồi bỏ dở | Lô A–C xong, lô D treo nhiều tuần | Chia lô D thành `CMP` và `MEAS` nếu quá hai tuần |
| `C1.DAT` chặn bởi task `#268` | Lô E treo chờ primitive tally | Soạn `items` của `DAT` trước, để `representation` `tally` vào cuối; hai task chạy song song |
| Cổng ratchet bị hạ bằng cách nới luật | Nợ giảm nhanh bất thường | Ratchet và M1–M7 đo độc lập; cả hai phải cùng đạt |

---

## 4. Phạm vi

**Trong phạm vi**: 110 file dưới `packages/content/src/skills/c1/`; hạ ratchet của
`value-inventory-baseline.json` và `thinking-structure-baseline.json` phần `C1` về 0.

**Ngoài phạm vi**: `C2`–`C6` (333 kỹ năng) — lát cắt sau, cùng công thức. Primitive vẽ — task
`#268`. Gắn 742 file mp3 — task `#269`.
