# Task #296 Todo: Trả nợ lời dẫn có tiếng và tên đọc được

Plan: [`296-play-narration-debt-plan.md`](296-play-narration-debt-plan.md).
Spec: [`play-narration.md`](../specs/04-play/play-narration.md) `BR-PNR-02/03/04/05/10`, §11 câu 4.

---

## S0 — Chốt nguồn giọng + đo lại
- [ ] `rtk proxy pnpm check:narration-coverage`, ghi số nợ hôm nay
- [ ] Hỏi người dùng §11 câu 4: (a) thu giọng người hay (b) chấp nhận TTS bậc 2
- [ ] (b) Sửa spec trước, không đổi cách đếm cổng để nợ giảm giả

## S1 — `spokenLabel` lô 1 (số, đếm)
- [ ] Test đỏ: dataset số/đếm không còn item thiếu tên
- [ ] Codemod gán `/audio/voice/common/numbers/{value}.mp3` hoặc `spokenLabel` (`BR-PNR-05`)
- [ ] `check:narration-coverage:update` (nợ giảm)

## S2 — `spokenLabel` lô 2 (vật, hình, màu)
- [ ] Test đỏ cho lô dataset mục tiêu
- [ ] Codemod + ratchet
- [ ] `items_without_spoken_name = 0` hoặc liệt kê phần còn lại kèm lý do

## S3 — Hạ tầng nhập câu dẫn
- [ ] Test đỏ: script nhập lô gắn `instruction_audio_path` đúng round, báo file thiếu
- [ ] (a) Xuất danh sách câu cần thu (CSV)

## S4 — Câu dẫn theo engine
- [ ] Lô engine `C1` — test đỏ `rounds_with_instruction_audio_by_template > 0`
- [ ] Các lô engine còn lại tới 37/37
- [ ] Ratchet sau mỗi lô

## S5 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] `check:narration-coverage` + test content/scripts xanh
- [ ] Đạt điều kiện (0 item thiếu tên, 37/37 engine có câu dẫn): bỏ `open_tasks` + khối "Chưa hoàn thành", nâng `status: implemented`; chưa đạt: cập nhật số nợ trong khối
- [ ] Commit lên `main`
