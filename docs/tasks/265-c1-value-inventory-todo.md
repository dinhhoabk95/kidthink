# Task #265 Todo: Kho giá trị số học C1

Plan: [`265-c1-value-inventory-plan.md`](265-c1-value-inventory-plan.md).
Spec: [`skill-value-inventory.md`](../specs/05-content/skill-value-inventory.md).

Sáu phép đo mở đầu (đo 2026-09-11): 6 file kho, tất cả `c5-*` · 64/110 kỹ năng `C1` không có
`glyph` · 46/443 dataset có `value` · `total_missing_items` 30 · 6 target cổng · 7 strand `C1`
trắng cả `glyph` lẫn `value`.

Song song an toàn: **L1 · L2 · L3**. Bắt buộc tuần tự: **L1 → L4 → L5 → L6**.

---

## L1 — Sáu file kho

- [x] T1.1 `c1-numeral.ts` — 21 mục 0–20, mỗi mục đủ `glyph` `label` `value` `audio_path` `required` `group`
- [x] T1.2 `audio_path` trỏ `/audio/voice/common/numbers/{value}.mp3`; xác nhận 21 file tồn tại (`common/numbers/` hiện có 31 file `0.mp3`–`30.mp3`)
- [x] T1.3 `required: true` cho 0–10, `false` cho 11–20 theo `BR-SVI-07`
- [x] T1.4 `c1-ordinal.ts` — 10 mục `thứ nhất` → `thứ mười`, mỗi mục có `position` 1–10
- [x] T1.5 `c1-number-bond.ts` — 65 mục; với mỗi `whole` 1–10, `part_a` chạy 0→`whole`
- [x] T1.6 `c1-quantity-rep.ts` — 8 `kind` với `concreteness`, `min_value`, `max_value` theo mục 7.2 của spec
- [x] T1.7 `c1-measure-dimension.ts` — 6 cặp, mỗi mục mang cả `pole_more` và `pole_less`
- [x] T1.8 `c1-pattern-unit.ts` — 6 mục với `signature` và `period`
- [x] T1.9 Thêm 6 dòng `export *` vào `packages/content/src/inventories/index.ts`
- [x] T1.10 Không import gì ngoài type trong sáu file; không có logic, không có hàm

## L2 — Test kho

- [x] T2.1 `c1-numeral`: đúng 21 mục, `value` phủ trọn 0–20 không trùng không sót
- [x] T2.2 `c1-numeral`: mọi `audio_path` tồn tại thật trên đĩa
- [x] T2.3 `c1-number-bond`: đúng 65 mục, và `part_a + part_b === whole` cho từng mục
- [x] T2.4 `c1-number-bond`: với mỗi `whole` 1–10 có đúng `whole + 1` mục
- [x] T2.5 `c1-quantity-rep`: 8 `kind` phân biệt, `min_value ≤ max_value` cho từng mục
- [x] T2.6 `c1-measure-dimension`: 6 mục, `pole_more` khác `pole_less` cho từng mục
- [x] T2.7 `c1-ordinal`: `position` phủ trọn 1–10

## L3 — Trả nợ C5 (30 mục)

- [x] T3.1 Soạn thêm 26 chữ cái còn thiếu vào dataset `C5.ALP.04`, lấy `id` từ `c5-letter.ts`
- [x] T3.2 Soạn thêm 6 dấu thanh vào dataset của strand `C5.TON`, lấy `id` từ `c5-tone-mark.ts`
- [x] T3.3 Chạy `pnpm check:value-inventory`, xác nhận `total_missing_items` về 0 cho phần C5
- [x] T3.4 Cấm — NEVER hạ ratchet bằng cách bỏ giá trị khỏi kho

## L4 — Mở rộng cổng

- [x] T4.1 `buildC1NumeralTarget()` theo khuôn `buildC5LetTarget()` (`scripts/check-value-inventory.ts:65`)
- [x] T4.2 `buildC1OrdinalTarget()` · `buildC1BondTarget()` · `buildC1RepTarget()` · `buildC1MeasureTarget()` · `buildC1PatternTarget()`
- [x] T4.3 Luật riêng `c1-numeral`: mọi mục phải đủ `glyph` `value` `audio_path` (`BR-SVI-08`)
- [x] T4.4 Luật riêng `c1-numeral`: file trỏ bởi `audio_path` phải tồn tại trên đĩa
- [x] T4.5 Luật riêng `c1-measure-dimension`: dataset phải lấy cả hai cực (`BR-SVI-11`)
- [x] T4.6 Cổng chỉ đòi phủ trọn phần `required: true`
- [x] T4.7 Không đổi lõi so khớp hai chiều; chỉ thêm target

## L5 — Ca âm (mỗi luật một ca, bắt buộc)

- [x] T5.1 **Ca âm `BR-SVI-02`** — thêm `id: "cup"` vào dataset `C5.LET.03` → cổng đỏ, nêu đúng `"cup"`
- [x] T5.2 **Ca âm `BR-SVI-03`** — xoá `let_r` khỏi hợp các dataset `C5.LET` → cổng đỏ, nêu đúng `let_r`
- [x] T5.3 **Ca âm `BR-SVI-06`** — bỏ file `c1-numeral.ts` → cổng đỏ, nêu target `C1.NREC` không có kho
- [x] T5.4 **Ca âm `BR-SVI-08`** — một mục `c1-numeral` thiếu `audio_path` → cổng đỏ, nêu đúng `value`
- [x] T5.5 **Ca âm `BR-SVI-08`** — `audio_path` trỏ file không tồn tại → cổng đỏ
- [x] T5.6 **Ca âm `BR-SVI-09`** — dataset `C1.ORD.01` chỉ có emoji, không `glyph` không `value` → cổng đỏ
- [x] T5.7 **Ca âm `BR-SVI-11`** — dataset `C1.CMP.04` chỉ có cực "nhiều" → cổng đỏ, nêu cặp khuyết cực
- [x] T5.8 **Ca âm `BR-SVI-12`** — corpus đo 31 trong khi baseline ghi 30 → cổng đỏ, nêu ratchet đi lùi
- [x] T5.9 Mỗi ca âm chạy được độc lập, không phụ thuộc thứ tự

## L6 — Chốt số

- [x] T6.1 Chạy `pnpm check:value-inventory --update`, chốt baseline mới
- [x] T6.2 Đo lại M1: 12 file kho
- [x] T6.3 Đo lại M4: `total_missing_items` là 0 cho phần C5; phần C1 ghi nợ mở đầu và chỉ được giảm
- [x] T6.4 Đo lại M5: 12 target
- [x] T6.5 `pnpm check` xanh; `pnpm typecheck` không thêm nợ
- [x] T6.6 Cập nhật mục 7.2 của spec nếu số mục thực tế lệch bảng

---

## Chưa làm trong task này

M2 (64/110 kỹ năng `C1` không có `glyph`) và M3 (46/443 dataset có `value`) **không** đóng ở đây.
Chúng cần soạn lại dataset, và việc đó cần cả bảng nghĩa vụ tư duy của task `#266`. Xem task
`#267`.
