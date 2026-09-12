# Task #271 Todo: Trả corpus về đúng hợp đồng

Plan: [`271-corpus-contract-repair-plan.md`](271-corpus-contract-repair-plan.md).

Chặn bởi: không. Chặn: `#272` (soạn lại `C2`–`C6`).

Bốn phép đo mở đầu (đo 2026-09-12): 233 vật có `glyph` chỉ lặp `image.ref` (58 kỹ năng `C1`) ·
0/444 tệp dataset import kho giá trị · 18 vi phạm toàn vẹn ngoài `C1` (`C2` 11 · `C4` 7) ·
Cổng 9 không chạy trong `pnpm check`.

Năm lô. Bắt buộc tuần tự: **LA → LB → LC**. Song song an toàn: **LD · LE**.
Mỗi lô một commit riêng. Cấm — NEVER gộp `LB` với `LD`: cả hai đụng cùng 110 tệp.

---

## LA — Cổng 9 vào `pnpm check` (S, chặn LB)

- [x] TA.1 Xác nhận `runEightGates` (`packages/content-build/src/gates/runner.ts:598`) không cần database
- [x] TA.2 `packages/content-build/src/cli/check-seed-gates.ts` — chạy tám cổng trên `ALL_SEED_LEVELS`, in nợ theo cổng
- [x] TA.3 Thêm script `check:seed-gates` vào `packages/content-build/package.json`
- [x] TA.4 Nối vào `scripts/check.sh` phase 1, kèm khối `wait $PID` riêng — Cấm — NEVER để job nền nuốt mã thoát
- [x] TA.5 **Ca âm** — dựng một level cố ý không hiện glyph nào → cổng đỏ, nêu đúng mã level và mã kỹ năng
- [x] TA.6 Nếu cổng đỏ ngay: ghi baseline `scripts/seed-gates-baseline.json`, nợ chỉ được GIẢM
- [x] TA.7 Đo lại N4: `pnpm check` chạy Cổng 9; xác nhận bằng cách tạm làm đỏ một level rồi hoàn nguyên

## LB — Tách vai `glyph` và `image` (L, chặn bởi LA)

- [x] TB.1 Liệt kê trọn 58 kỹ năng có `glyph` trùng `image.ref`, kèm engine nào đang chiếu chúng
- [x] TB.2 Phân loại **trọn** 58 kỹ năng thành hai nhóm: dataset **ký hiệu** (dạy chữ số/chữ cái) và dataset **tranh**
- [x] TB.3 Duyệt bảng phân loại trước khi sửa dòng nào — Cấm — NEVER gỡ từng vật lẻ (review 2026-09-12 làm thế và để lại 7 dataset lẫn lộn)
- [x] TB.4 Ghi luật vào mục `glyph` của [`skill-dataset-model.md`](../specs/05-content/skill-dataset-model.md): vật mang `glyph` khi và chỉ khi nó dạy ký hiệu viết được
- [x] TB.5 Dataset tranh: gỡ `glyph`, giữ `image`
- [x] TB.6 Dataset ký hiệu: giữ `glyph` là ký hiệu thật, Cấm — NEVER để `glyph === image.ref`
- [x] TB.7 Thêm luật `BR-SDI-09` vào `scripts/dataset-integrity/rules.ts`: `glyph` không được bằng `image.ref`
- [x] TB.8 **Ca âm** cho `BR-SDI-09` trong `scripts/check-dataset-integrity.test.ts`
- [x] TB.9 Gỡ vật độn `fill_unit_1..6` khỏi `C1.MEAS.05` và `C1.MEAS.06` nếu Cổng 9 đã bỏ qua hai dataset đó
- [x] TB.10 `pnpm db:seed` xanh sau lô; so số item với mốc 6895
- [x] TB.11 Đo lại N1: 0 vật có `glyph` trùng `image.ref`

## LC — 13 level đồng hồ gắn nhầm kỹ năng (M, chặn bởi LB)

- [x] TC.1 Xác nhận lại: 13 level `GL-C1-CLK-*` ở `C1.MEAS.04` / `.14` / `.15` có TRƯỚC `#267` (`git show 59b7d3fc`)
- [x] TC.2 Chốt cách xử lý — thêm kỹ năng đồng hồ mới, hay bỏ bớt level xuống trần `BR-SKQ-04`
- [x] TC.3 Ghi quyết định và lý do vào đây trước khi sửa tệp:
  - **Quyết định**: Bỏ bớt 10 level thừa `GL-C1-CLK-TIM-0001..0010`, gỡ hoàn toàn 13 level đồng hồ và 3 khối độn `clk_hour_1..12` khỏi `C1.MEAS.04`, `C1.MEAS.14`, `C1.MEAS.15`. Chuyển 3 level kinh điển `GL-C1-CLK-HND-0037..0039` (legacy D5-08, được `ACT-0356` tham chiếu) về đúng kỹ năng đồng hồ duy nhất `C1.MEAS.13` (thay thế level trùng lặp `GL-C1-MEAS-CLK-0003`), đạt đúng trần cứng 5 level cho cặp (`C1.MEAS.13`, `GT-016`) theo `BR-SKQ-04`.
  - **Lý do**: Không được sinh thêm skill mới (vi phạm quy tắc bất biến taxonomy 230 skill); `C1.MEAS.04`, `.14`, `.15` sau khi gỡ vẫn có 25–27 level và 6 templates (vượt xa sàn hạn ngạch 20 level / 4 templates); 10 level `GL-C1-CLK-TIM-*` là level thừa sinh tự động không có call site nào.
- [x] TC.4 Thi hành; `C1.MEAS.13` không vượt 5 level cho cặp (kỹ năng, `GT-016`)
- [x] TC.5 Gỡ ba khối `clk_hour_1..12` độn ở `C1.MEAS.04` / `.14` / `.15` cùng ghi chú nợ của chúng
- [x] TC.6 `pnpm --filter @mindkid/content-build check:skill-quota` xanh
- [x] TC.7 `pnpm --filter @mindkid/game-engine gen:engine-depth-section` rồi `check:engine-specs` xanh
- [x] TC.8 `pnpm db:seed` xanh

## LD — Dataset `C1` import kho giá trị (L, song song với LB được nếu khác strand)

- [ ] TD.1 `packages/content/src/inventories/index.ts` xuất đủ hàm tra cứu cho 6 kho `c1-*`
- [ ] TD.2 Lô `NREC` + `CNT` + `NCOMP` + `ADD` + `SUB`: `glyph`, `value`, `audio_path` lấy từ `c1-numeral` và `c1-number-bond`
- [ ] TD.3 Lô `ORD`: lấy từ `c1-ordinal`; thêm trường `position` cho từng vật (đóng `TC.1` của `#267`)
- [ ] TD.4 Lô `CMP` + `MEAS`: lấy từ `c1-measure-dimension`; Cấm — NEVER bịa `unit_kind` ngoài 6 cái kho định nghĩa
- [ ] TD.5 Lô `PAT`: lấy từ `c1-pattern-unit`
- [ ] TD.6 `C1.ADD.03` bỏ phân tách sinh tại chỗ, lấy `bond_id` từ kho (đóng `TB.1` của `#267`)
- [ ] TD.7 Thêm luật `BR-SDI-10`: giá trị `glyph`/`value` của vật phải khớp mục kho tương ứng
- [ ] TD.8 **Ca âm** cho `BR-SDI-10`
- [ ] TD.9 Mỗi strand một commit; `pnpm check` và `pnpm db:seed` sau mỗi strand
- [ ] TD.10 Đo lại N2: ≥ 110 tệp dataset import `inventories/`

## LE — Nợ toàn vẹn ngoài `C1` (S, độc lập)

- [x] TE.1 Liệt kê 13 cặp `<mã kỹ năng>|<luật>` trong `scripts/dataset-integrity-baseline.json`
- [x] TE.2 12 vi phạm `BR-SDI-05` (`identity.name` khác `concept_label`): sửa nhãn theo tên kỹ năng
- [x] TE.3 1 vi phạm `BR-SDI-02` (`C4.DET.01` — `ordering` trỏ vào 5 id không có trong `items`)
- [x] TE.4 Hạ `max_total_violations` về 0; xoá `known_violation_keys`
- [x] TE.5 Đo lại N3: `check:dataset-integrity` đạt 0/0 trên cả 6 năng lực

---

## Chốt số

- [ ] TF.1 N1 về 0 — không vật nào có `glyph` trùng `image.ref`
- [ ] TF.2 N2 ≥ 110 — trọn `C1` lấy giá trị từ kho
- [ ] TF.3 N3 về 0 — `check:dataset-integrity` sạch cả 6 năng lực
- [ ] TF.4 N4 — Cổng 9 chạy trong `pnpm check`, có ca âm chứng minh nó đỏ được
- [ ] TF.5 `pnpm check` xanh cả ba pha; test ratchet không tăng quá 42
- [ ] TF.6 `pnpm db:seed` chạy hết, số item ghi lại ở đây
- [ ] TF.7 Đóng 11 mục còn mở của [`#267`](267-c1-corpus-reauthor-todo.md) hoặc chuyển chúng sang `#268` / `#269`

---

## Chưa làm trong task này

- `C2`–`C6`: 333 kỹ năng, hiện 0 `relations` · 0 `axes` · 1 prompt mỗi năng lực — plan riêng `#272`.
- Trường `representation` và primitive vẽ — task [`#268`](268-numeracy-render-primitives-todo.md).
- Thu âm và gắn `audio_path` còn thiếu — task [`#269`](269-play-narration-coverage-todo.md).
