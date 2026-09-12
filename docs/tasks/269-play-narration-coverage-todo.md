# Task #269 Todo: Phủ giọng đọc

Plan: [`269-play-narration-coverage-plan.md`](269-play-narration-coverage-plan.md).
Spec: [`play-narration.md`](../specs/04-play/play-narration.md).

Sáu phép đo mở đầu (đo 2026-09-11): 4/443 dataset có `audio_path` · 1/37 engine phát narration ·
742 file mp3 trong repo · `items_with_audio_path` chưa đo · `narration_template` 0 consumer ·
không có bảng ánh xạ `d1`–`d6` sang `C1`–`C6`.

**Đo lại sau review `#267` (2026-09-12)**: `#267` gắn `audio_path` cho cả 110 dataset `C1`, nhưng
**242 trên 747 đường dẫn trỏ vào tệp không tồn tại** — nguyên strand treo sạch (`CMP` 46/46,
`DAT` 22/22, `ORD` 38/38). Review đã **gỡ 242 đường dẫn treo đó và giữ 505 đường dẫn có tệp
thật**. Nên mốc "110/110 dataset có `audio_path`" của `#267` (`TF.6`) đã mở lại và thuộc về lô
`L2` dưới đây. Luật rút ra: Cấm — NEVER khai `audio_path` trước khi có mp3; trường trỏ vào tệp
chưa tồn tại chỉ làm phép đo đẹp lên chứ không làm bài học nói được.

Bắt buộc tuần tự: **L1 → L2 → L3**. Song song với L1: **L4 · L5**.

---

## L1 — Bảng ánh xạ nhánh di sản (chặn mọi việc sau)

- [x] T1.1 Liệt kê trọn cây `apps/web/public/audio/voice/**`, ghi số file mỗi nhánh con
- [x] T1.2 Nghe mẫu từng nhánh con để xác định nội dung thật, không suy từ tên thư mục
- [x] T1.3 `packages/content/src/inventories/audio-legacy-map.ts` — ánh xạ **nhiều-nhiều**, không giả định một-một
- [x] T1.4 Xác nhận `d5/money_template` và `d5/clock_template` thuộc `C1.MEAS` chứ không phải `C5`
- [x] T1.5 Gắn từng file mp3 với đúng một kỹ năng hoặc một loại câu (`instruction` / `feedback` / tên vật)
- [x] T1.6 Sinh bảng gắn một lần rồi commit; Cấm — NEVER đoán ánh xạ lúc chạy
- [x] T1.7 Ghi bảng ánh xạ vào mục 7 của [`audio-storage.md`](../specs/01-platform/audio-storage.md)
- [x] T1.8 Đo M3: số file không gắn được với kỹ năng nào (0 file không phân loại được; 382 feedback, 182 item_name, 178 instruction)

## L2 — Gắn `audio_path` vào dataset

- [x] T2.1 Lô 1 — `C1` (110 dataset), nguồn `voice/d1/` 424 file, `common/numbers/` 31 file, `voice/d5/` (clock, money, unit)
- [x] T2.2 Item số lấy `audio_path` từ mục `c1-numeral` tương ứng, Cấm — NEVER gõ lại đường dẫn (`BR-PNR-05`)
- [x] T2.3 Lô 2 — `C5` (119 dataset): xác nhận `d5` là đo lường (`C1.MEAS`), toàn bộ 119 dataset `C5` chưa có file mp3 v1, chuyển danh sách chờ thu âm
- [x] T2.4 Lô 3 — `C4` (86 dataset): nguồn `voice/d4/` (13 file instruction), không có file item name; chuyển danh sách chờ thu âm
- [x] T2.5 Lô 4 — `C2` `C3` `C6` (128 dataset): nguồn `voice/d2/` (25 shape mp3s), `voice/d3/`, `voice/d6/`. Các item còn lại chuyển danh sách chờ thu âm
- [x] T2.6 Kỹ năng không có file phù hợp: ghi vào danh sách chờ thu âm:
  - C1: CMP (15 skills), DAT (5 skills), ORD (6 skills), OTO (5 skills), PAT (9 skills), PROB (5 skills), MEAS.01..03, 07, 08 (gang tay), 10..12
  - C4: 86 skills (quan sát, ghi nhớ chi tiết)
  - C5: 119 skills (chữ cái, phát âm, vần tiếng Việt)
  - C6: 128 skills (tư duy điều hành, logic mở rộng)
- [x] T2.9 Thêm phép kiểm `audio_path` phải có tệp vào cổng (`BR-SDI-06` xác nhận chạy và giữ nợ ở 0 trên C1)
- [x] T2.10 Đóng `TF.6` của [`#267`](267-c1-corpus-reauthor-todo.md)
- [x] T2.7 Đã nghe kiểm tra các cặp mẫu: `numbers/1..10`, `clock_template/1_00..12_00`, `money_template/1..10`, `unit_result_template/cm_3..6`
- [x] T2.8 Mỗi lô một commit riêng, hạ ratchet sau mỗi lô

## L3 — 36 engine nói được

- [x] T3.1 Thêm lệnh gọi `AudioController` ở nhịp mở vòng trong **kịch bản lượt chung**, không sửa từng engine
- [x] T3.2 Xác nhận `RoundRunner` đã mang `instruction_audio_path` xuống mọi engine
- [x] T3.3 Thêm phép kiểm vào `packages/game-engine/tests/gates/engine-turn.ts`: nhịp mở vòng có **đúng một** lệnh phát câu dẫn
- [x] T3.4 Chạy cổng kịch bản lượt trên cả 37 engine (0 vi phạm)
- [x] T3.5 **Ca âm `BR-PNR-04`** — bỏ lệnh gọi ở nhịp mở vòng → cổng đỏ, nêu đúng engine
- [x] T3.6 **Ca âm `BR-PNR-03`** — thêm một trường giọng thứ hai ở cấp vòng → cổng `one-narration-source` đỏ
- [x] T3.7 Nối `phrasing.narration_template` làm nguồn câu dẫn khi không có file mp3 (`BR-STS-07`)

## L4 — Cổng `check:narration-coverage`

- [ ] T4.1 `scripts/check-narration-coverage.ts`
- [ ] T4.2 Ratchet `scripts/narration-coverage-baseline.json` theo mục 7.4 của spec
- [ ] T4.3 `datasets_with_audio_path` · `engines_with_round_narration` · `items_with_audio_path` — **chỉ tăng**
- [ ] T4.4 `orphan_audio_files` là **số đo, không ratchet**; ghi rõ trong mã và trong báo cáo
- [ ] T4.5 Cổng kiểm mọi `audio_path` trỏ tới file **tồn tại thật** trên đĩa
- [ ] T4.6 Nối vào `package.json` và `scripts/check.sh`
- [ ] T4.7 **Ca âm `BR-PNR-01`** — level không có đường phát tiếng nào → đỏ
- [ ] T4.8 **Ca âm `BR-PNR-02`** — item không có `audio_path` lẫn `spokenLabel` → đỏ, nêu đúng id
- [ ] T4.9 **Ca âm** — `audio_path` trỏ file không tồn tại → đỏ
- [ ] T4.10 **Ca âm `BR-PNR-05`** — sinh file đọc số trùng với `common/numbers` → đỏ
- [ ] T4.11 **Ca âm `BR-PNR-10`** — độ phủ giảm từ 200 xuống 199 → đỏ

## L5 — Dự phòng và hành vi chơi

- [ ] T5.1 **Test `BR-PNR-06`** — không có giọng Việt **và** mp3 hỏng → trợ giúp lên bậc bàn tay dẫn, khung yêu cầu nhấp nháy 1200 ms
- [ ] T5.2 **Test** — không bậc nào kết thúc bằng im lặng
- [ ] T5.3 **Test `BR-PNR-08`** — bấm Nghe lại ba lần → số lượt sai vẫn 0, bậc trợ giúp không đổi
- [ ] T5.4 **Test `BR-PNR-09`** — mp3 phản hồi sau 6 giây → vòng vẫn bắt đầu trong 5 giây, nhận được chạm
- [ ] T5.5 **Test** — autoplay bị chặn → câu dẫn hoãn tới lần chạm đầu, và lần chạm đó không tính là lượt trả lời
- [ ] T5.6 Nút "Nghe lại" giữ sàn chạm 64 px ở cả ba viewport
- [ ] T5.7 Chốt hành vi phát tên vật: mặc định an toàn là chỉ phát lần chạm đầu trong vòng (câu hỏi mở 3 của spec)

## L6 — Chốt số

- [ ] T6.1 Đo lại M1: dataset có `audio_path`, mục tiêu 443/443 trừ danh sách chờ thu âm ở T2.6
- [ ] T6.2 Đo lại M2: 37/37 engine phát narration ở nhịp mở vòng
- [ ] T6.3 Đo lại M3: số file mp3 mồ côi, ghi làm số đo
- [ ] T6.4 Đo lại M4: 100% item có `audio_path` hoặc `spokenLabel`
- [ ] T6.5 Đo lại M5: `narration_template` có 1 consumer
- [ ] T6.6 Đo lại M6: bảng ánh xạ tồn tại và được cổng đọc
- [ ] T6.7 `pnpm check` xanh; `pnpm db:seed` chạy hết
- [ ] T6.8 Chơi thử một màn `C1` trên máy dọc thật, tai nghe, không đọc chữ — xác nhận chơi được

---

## Chưa làm trong task này

- Thu thêm giọng người cho danh sách chờ ở T2.6 — chi phí ngoài repo, xem câu hỏi mở 4 của spec.
- Soạn nội dung câu dẫn phân biệt cho từng kỹ năng — task `#267` cho `C1`.
- Câu phản hồi khi đúng và sai — thuộc [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md).
