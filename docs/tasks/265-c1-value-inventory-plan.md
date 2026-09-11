# Task #265 Plan: Kho giá trị số học C1 — sáu kho, một cổng, nợ về 0

> **Mục tiêu**: Nhánh ngôn ngữ `C5` đã có kho giá trị và cổng đối chiếu hai chiều từ Task #255.
> Nhánh số học `C1` chưa có gì. Hệ quả đo được ngày 2026-09-11: **64/110** kỹ năng `C1` không có
> một `glyph` nào, và chỉ **46/443** dataset toàn corpus có trường `value`.
>
> Task này dựng sáu kho giá trị cho `C1`, mở rộng cổng `check:value-inventory` sang sáu target
> mới, và hạ nợ `value-inventory-baseline.json` từ 30 về 0.

Spec: [`skill-value-inventory.md`](../specs/05-content/skill-value-inventory.md) mục 7.2 và
`BR-SVI-06` tới `BR-SVI-12`.

---

## 1. Bối cảnh

### 1.1 Sáu phép đo mở đầu (đo 2026-09-11)

| # | Phép đo | Hiện tại | Đích |
|---|---|---|---|
| M1 | File kho giá trị dưới `packages/content/src/inventories/` | 6, tất cả `c5-*` | 12 |
| M2 | Kỹ năng `C1` không có `glyph` nào trong dataset | 64 / 110 | 0 |
| M3 | Dataset toàn corpus có trường `value` | 46 / 443 | ≥ 110 |
| M4 | `total_missing_items` của `value-inventory-baseline.json` | 30 | 0 |
| M5 | Target của `check-value-inventory.ts` | 6 | 12 |
| M6 | Strand `C1` có 0 `glyph` **và** 0 `value` | 7 (`CMP` `DAT` `MEAS` `ORD` `OTO` `PAT` `PROB`) | 0 |

Lệnh tái lập M2 và M3:

```bash
node -e '
const fs=require("fs"),{execSync}=require("child_process");
const f=execSync("find packages/content/src/skills/c1 -name \"C1.*.ts\"").toString().trim().split("\n");
let n=0; for(const x of f){const s=fs.readFileSync(x,"utf8");
  if(!/glyph:/.test(s)) n++;}
console.log("C1 khong co glyph:",n,"/",f.length);'
```

### 1.2 Khoản nợ 1 — `C1.ORD` định nghĩa bằng số, dataset không có số

Sáu kỹ năng `C1.ORD.01` tới `C1.ORD.06` dạy thứ tự `thứ nhất` tới `thứ mười`. Cả sáu dataset có
0 `glyph` và 0 `value`. Bài sinh ra từ chúng chạy trên `GT-001` chọn một đáp án, `GT-007`
number-bond, và `GT-016` clock-hands — không engine nào nhận được thông tin thứ tự từ dataset,
nên thứ tự phải được bịa ra ở tầng builder hoặc không tồn tại.

### 1.3 Khoản nợ 2 — `C1.DAT.01` tên là "đếm rồi ghi bằng dấu"

Kỹ năng này định nghĩa bằng chính ký hiệu tally. Dataset của nó có 0 `glyph`. Không có primitive
tally trong tầng render (việc đó thuộc task `#268`), nhưng kho giá trị phải có trước để task
`#268` biết vẽ cái gì.

### 1.4 Khoản nợ 3 — ratchet C5 đứng yên từ Task #255

`scripts/value-inventory-baseline.json` ghi `total_missing_items: 30`, gồm `C5.ALP.04` thiếu
26/29 chữ cái và `C5.TON` thiếu 6/6 dấu thanh. Spec `skill-value-inventory.md` được viết chính
vì hai lỗ này, và cả hai vẫn còn nguyên. Một ratchet đặt ở mức nợ rồi không ai trả là một cổng
trang trí.

---

## 2. Thiết kế

### 2.1 Hình dạng kho — sao chép khuôn C5

Khuôn đối chiếu: `packages/content/src/inventories/c5-tone-mark.ts`. Mỗi file có một
`interface` và một hằng `readonly [...] as const`. Không có logic, không có import ngoài type.

```typescript
// packages/content/src/inventories/c1-numeral.ts
export interface NumeralInventoryItem {
  readonly id: string;
  readonly glyph: string;
  readonly label: string;
  readonly value: number;
  readonly audio_path: string;
  readonly required: boolean;
  readonly group: "C1.NREC.01" | "C1.NREC.02" | "C1.NREC.03" | "C1.NREC.04";
}

export const C1_NUMERAL_INVENTORY: readonly NumeralInventoryItem[] = [
  { id: "num_0", glyph: "0", label: "số không", value: 0,
    audio_path: "/audio/voice/common/numbers/0.mp3", required: true, group: "C1.NREC.01" },
  // … tới num_20
] as const;
```

`group` gắn mỗi giá trị vào kỹ năng phải dạy nó, giống cách `c5-letter.ts` gắn 29 chữ vào 5 nhóm
`C5.LET.01..05`. Phân nhóm theo khoảng của chính taxonomy:

| `group` | Kỹ năng | Khoảng | `required` |
|---|---|---|---|
| `C1.NREC.01` | Nhận biết số 0–3 | 0–3 | `true` |
| `C1.NREC.02` | Nhận biết số 0–5 | 4–5 | `true` |
| `C1.NREC.03` | Nhận biết số 0–10 | 6–10 | `true` |
| `C1.NREC.04` | Nhận biết số 11–20 | 11–20 | `false` |

`required: false` cho 11–20 theo `BR-SVI-07`: Thông tư 23/2010/TT-BGDĐT chuẩn 23 chỉ số 104 chỉ
bắt buộc trong phạm vi 10.

### 2.2 Sáu file và kích thước

| File | Mục | Ghi chú kích thước |
|---|---:|---|
| `c1-numeral.ts` | 21 | 0–20 |
| `c1-ordinal.ts` | 10 | thứ nhất → thứ mười |
| `c1-number-bond.ts` | 65 | với mỗi `whole` 1–10, `part_a` chạy 0→`whole`, tức `whole+1` mục; tổng `2+3+…+11` |
| `c1-quantity-rep.ts` | 8 | tám `kind`, xem mục 7.2 của spec |
| `c1-measure-dimension.ts` | 6 | sáu cặp đối lập, mỗi mục mang cả hai cực |
| `c1-pattern-unit.ts` | 6 | `AB` `AAB` `ABB` `ABC` `ABBA` `AABB` |

`c1-number-bond.ts` sinh bằng tay hay bằng script sinh một lần rồi commit — **không** sinh lúc
chạy. `BR-SVI-10` cấm sinh phân tách tại chỗ vì tập sinh tại chỗ thì cổng không đếm được cái gì
còn thiếu.

### 2.3 Mở rộng cổng

`scripts/check-value-inventory.ts` đã có `InventoryCheckTarget`, `groupItemsByField`, và khung
ratchet. Thêm sáu hàm `buildC1*Target()` theo đúng khuôn `buildC5LetTarget()` tại dòng 65. Lõi so
khớp hai chiều không đổi.

Ba target cần luật riêng ngoài so khớp `id`:

- `c1-numeral`: kiểm thêm mọi mục có đủ `glyph`, `value`, `audio_path` (`BR-SVI-08`), và file
  `audio_path` trỏ tới tồn tại thật trên đĩa.
- `c1-measure-dimension`: kiểm dataset lấy **cả hai** cực của một cặp (`BR-SVI-11`).
- Mọi target: chỉ đòi phủ trọn phần `required: true`.

### 2.4 Trình tự trả nợ

Sáu kho dựng trước, cổng mở rộng sau, rồi mới hạ ratchet. Không hạ ratchet trước khi có dữ liệu
— hạ trước là tự tạo ra một cổng đỏ không sửa được.

Nợ C5 (30 mục) trả trong cùng task này vì nó nhỏ và đã đứng yên quá lâu: soạn thêm 26 chữ cái
vào `C5.ALP.04` và 6 dấu thanh vào strand `C5.TON`.

---

## 3. Rủi ro

| Rủi ro | Dấu hiệu | Cách chặn |
|---|---|---|
| Cổng xanh vì đọc sai đường dẫn | Cổng báo "0 vi phạm" ngay lần chạy đầu trên corpus chưa sửa | Ca âm bắt buộc: xoá một mục khỏi kho, cổng phải đỏ và nêu đúng `id` |
| `audio_path` trỏ file không có | Không ai phát hiện tới khi trẻ vào màn chơi | Cổng kiểm tồn tại file trên đĩa, không chỉ kiểm chuỗi |
| Hạ ratchet bằng cách nới định nghĩa | `total_missing_items` về 0 mà `C1` vẫn 0 `glyph` | M2 và M3 đo độc lập với ratchet; cả ba phải cùng đạt |
| 65 mục number-bond gõ sai tay | Cổng xanh, bài toán sai | Test khẳng định `part_a + part_b === whole` cho cả 65 mục, và đếm đúng 65 |

---

## 4. Phạm vi

**Trong phạm vi**: sáu file kho `C1`, mở rộng `scripts/check-value-inventory.ts`, trả nợ 30 mục
C5, cập nhật `packages/content/src/inventories/index.ts`.

**Ngoài phạm vi**: soạn lại 110 dataset `C1` để **dùng** kho — đó là task `#267` và nó cần cả
task `#266` xong trước. Task này chỉ dựng nguồn sự thật và cổng.
