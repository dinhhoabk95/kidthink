# Task #274 Todo: Hậu kiểm Task #273

Plan: [`274-play-surface-audio-hint-followup-plan.md`](274-play-surface-audio-hint-followup-plan.md).

Luật tick: một ô chỉ được tick khi lệnh kiểm ở cuối lát chạy qua `rtk proxy` và exit 0, **và** ca
âm của lát đó đỏ khi bỏ phần sửa. Test một vòng không đủ cho lát nào chạm chuyển vòng.

## S1 — Lỗi hồi quy của #273

- [x] S1a — id thẻ đề GT-001 là `prompt:${item_id}`; test chung "id trong `getView()` là duy nhất"
      chạy trên mọi template có fixture
- [x] S1b — hẹn giờ tự sang vòng neo `roundIndex`, huỷ ở `cleanupSession()`
- [x] S1b — test nhiều vòng: thắng vòng 1 → vòng 2 mở → câu dẫn vòng 2 phát → settle → cử chỉ mở
- [x] S1b — ca âm: "Bỏ qua" trong 900ms sau khi thắng Cấm — NEVER đóng vòng kế tiếp
- [ ] S1c — mỗi bậc phát rơi xuống bậc sau đúng một lần; ca âm `onerror` + `play()` reject cùng bắn
- [ ] S1d — GT-001 vùng chạm khớp hình thẻ đang vẽ; không nhỏ hơn bản trước #273 ở góc thẻ
- [ ] S1d — bề mặt web tìm entity bị chạm bằng primitive của `hit-test.ts`, cùng dung sai với `toAction()`
- [ ] S1e — `onSettled` mang token vòng; token lệch thì bỏ qua; hẹn giờ 600ms huỷ khi rời trang và
      khi chơi lại
- [ ] S1e — sửa comment "hằng số 8" ở `GT-001/session.ts` cho khớp lịch sử git

Kiểm: `rtk proxy npx vitest run` trong `packages/game-engine` và `apps/web`,
`rtk proxy pnpm typecheck --only root`, `rtk proxy pnpm typecheck --only web:app`.

## S8 — Web Speech

- [ ] Giữ tham chiếu utterance đang phát trên instance adapter
- [ ] Utterance bị `cancel()` cắt ngang Cấm — NEVER gọi `onError`/`onEnd` của nó, Cấm — NEVER xoá
      hẹn giờ an toàn của utterance mới
- [ ] `addEventListener("voiceschanged")` thay cho gán `onvoiceschanged`
- [ ] Đo trước/sau trên Chrome Android, Safari iOS, Chrome Windows không giọng `vi-VN`: vòng 2+
      có tiếng, cổng chờ đọc mở trong ≤ 1s sau khi đọc xong

## S5 — Cổng đo mp3 thật

- [ ] Trục `rounds_with_instruction_audio` theo template (M1)
- [ ] Trục `assets_with_audio` (M2) và `glyphs_without_vi_name` (M3)
- [ ] Ca âm trong `scripts/**/fixtures/`: một vòng mất `instruction_audio_path` → cổng đỏ
- [ ] Baseline ghi số đo 2026-09-19: M1 = 0/2.976, M2 = 37/325, M3 = 25/182

## S3 — Ngưỡng gợi ý (`D-274-1`)

- [ ] Sửa `scaffolding-and-hints.md` §7.1 và scenario `BR-SCF-05` trước
- [ ] `SCAFFOLDING_BY_BAND["3-4"]`: miss `2/3/4`, thời gian giữ nguyên
- [ ] Test: band 3–4, 1 lần sai → L0; 2 lần sai → L1

## S4 — `speak_along` trọn vẹn (`D-274-2`)

- [ ] Sửa `GT-000.md` `BR-E000-11` (mặc định) trước
- [ ] `.default("off")`; fixture khai tường minh
- [ ] `off`: chữ và lời đọc bước `echo` là câu trình bày, không còn "Bé nói theo cô nhé"
- [ ] Help của `speak_along` trong `config-dictionary.ts` khớp giá trị `tap`/`off`
- [ ] Trường hiện trong form admin sửa level

## S2 — GT-000 chờ đọc ở mức bước (`D-274-4`)

- [ ] Sửa `GT-000.md` §5 trước
- [ ] `toAction()` trả `null` khi `prompt_line` của bước chưa đọc xong; trần 12s
- [ ] Test: chạm trong lúc đọc → không tính; sau khi đọc → tính

## S7 — Đọc lại từ khoá ưu tiên mp3

- [ ] `handleVerdict` phát `audio_path` của entity trước TTS
- [ ] Tên tiếng Việt cho 25 glyph thiếu; glyph lặp đọc thành cụm đếm
- [ ] `formatSpokenLabel` thành helper dùng chung; xoá `resolveAssetLabels` riêng của GT-001
- [ ] Thiếu tên thì không có `spokenLabel` — Cấm — NEVER đọc glyph thô

## S6 — Sinh mp3 (`D-274-3`)

- [ ] Nối 700 mp3 mồ côi có sẵn trước
- [ ] Chốt nhà cung cấp TTS (câu hỏi mở 1 của plan)
- [ ] Sửa `audio-storage.md` và `contracts/shared-fields.ts` (`audio_path` tuỳ chọn cho asset) trước
- [ ] Script build sinh mp3 theo hash nội dung; seeder ghi `instruction_audio_path`
- [ ] M1 và M2 đạt đích, cổng S5 ratchet lên
