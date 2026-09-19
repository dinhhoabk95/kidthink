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
- [x] S1c — mỗi bậc phát rơi xuống bậc sau đúng một lần; ca âm `onerror` + `play()` reject cùng bắn
- [x] S1d — GT-001 vùng chạm khớp hình token tròn đang vẽ (E4 rút lại: không phải lỗi co vùng chạm)
- [x] S1d — bề mặt web tìm entity bị chạm bằng primitive của `hit-test.ts`, cùng dung sai với `toAction()`
- [x] S1e — `onSettled` mang token vòng; token lệch thì bỏ qua; hẹn giờ 600ms huỷ khi rời trang và
      khi chơi lại
- [x] S1e — sửa comment "hằng số 8" ở `GT-001/session.ts` cho khớp lịch sử git

Kiểm: `rtk proxy npx vitest run` trong `packages/game-engine` và `apps/web`,
`rtk proxy pnpm typecheck --only root`, `rtk proxy pnpm typecheck --only web:app`.

## S8 — Web Speech

- [x] Giữ tham chiếu utterance đang phát trên instance adapter (GC không đo được trong node — cấu trúc, không có test)
- [x] Utterance bị `cancel()` cắt ngang kết thúc bằng `onEnd` đúng một lần, Cấm — NEVER `onError`;
      sự kiện trễ của nó Cấm — NEVER xoá hẹn giờ an toàn của utterance mới
- [x] `addEventListener("voiceschanged")` thay cho gán `onvoiceschanged`
- [x] `AudioController.speakPrompt`: tín hiệu thị giác và `onEnd` mỗi cái đúng một lần
- [ ] Đo trước/sau trên Chrome Android, Safari iOS, Chrome Windows không giọng `vi-VN`: vòng 2+
      có tiếng, cổng chờ đọc mở trong ≤ 1s sau khi đọc xong

## S5 — Cổng đo mp3 thật

- [x] Trục `rounds_with_instruction_audio` tổng và theo template (M1) — `scripts/narration-level-scan.ts`, nguồn `buildLevelsForSkill` khớp DB (6.380 level)
- [x] Trục `level_assets_with_audio` (M2) và `glyphs_without_vi_name` (M3)
- [x] Ca âm trong `scripts/fixtures/narration-levels.fixture.ts`: một vòng mất `instruction_audio_path` → cổng đỏ (tổng và theo template); asset mất mp3; glyph không tên dày thêm
- [x] Baseline ghi số đo 2026-09-19 trên **toàn corpus**: 0/19.046 vòng có mp3 câu dẫn (GT-001 0/2.976), 37 asset có mp3, 68/268 glyph không tên (GT-001 25/182)

## S3 — Ngưỡng gợi ý (`D-274-1`)

- [x] Sửa `scaffolding-and-hints.md` §7.1 và scenario `BR-SCF-05` trước (kèm bảng §7.3 của `game-engine-runtime.md`)
- [x] `SCAFFOLDING_BY_BAND["3-4"]`: miss `2/3/4`, thời gian giữ nguyên
- [x] Test: band 3–4, 1 lần sai → L0; 2 lần sai → L1

## S4 — `speak_along` trọn vẹn (`D-274-2`)

- [x] Sửa `GT-000.md` `BR-E000-11` (mặc định) trước
- [x] `.default(SPEAK_ALONG_DEFAULT)` = `off`; runtime đọc cùng hằng qua `resolveSpeakAlong` (session nhận `difficulty_params` thô, `.default()` của Zod không chạy lúc chơi); fixture giữ `tap` tường minh
- [x] `off`: chữ bước `echo` là câu trình bày; lời đọc vốn chỉ đọc từ khoá (không mời) — không đổi
- [x] Help của `speak_along` trong `config-dictionary.ts` khớp giá trị `tap`/`off`
- [x] Trường hiện trong form admin sửa level — có sẵn: `zod-introspect` biến `ZodDefault`+`ZodEnum` thành ô chọn, không cần sửa

## S2 — GT-000 chờ đọc ở mức bước (`D-274-4`)

- [x] Sửa `GT-000.md` §5 trước (nhánh 9, `BR-E000-12`, hai scenario)
- [x] `toAction()` trả `null` khi `prompt_line` của bước chưa đọc xong; trần 12s qua `update()`; `isAcceptingInput()` cho web (nuốt trọn, không đọc nhãn) và engine (`isInputOpen()` dừng đồng hồ trợ giúp)
- [x] Test: chạm trong lúc đọc → không tính; sau khi đọc → tính; trần 12s; máy không có giọng thì không chặn

## S7 — Đọc lại từ khoá ưu tiên mp3

- [x] `handleVerdict` phát `audio_path` của entity (`ViewEntity.spokenAudioPath`) trước TTS; mp3 lỗi mới rơi xuống TTS
- [x] Tên tiếng Việt cho glyph thiếu: `spokenKeywordForAsset` đọc được glyph lặp, keycap nhiều số, chữ trong ô, chữ trần, nghề có giới tính (68 → 28); 28 glyph còn lại có tên trong catalog `@mindkid/emoji` (28 → **0**/268, baseline khoá 0)
- [x] `spokenKeywordForAsset` (engine, dựng trên `formatSpokenLabel`) là helper dùng chung cho GT-001 và cổng narration
- [x] Thiếu tên thì không có `spokenLabel` — Cấm — NEVER đọc glyph thô

## S6 — Sinh mp3 (`D-274-3`)

- [x] Nối mp3 có sẵn trước: bộ dựng GT-001 mang `audio_path` của item dataset vào asset từ khoá — asset có mp3 37 → 2.637, 591/2.976 vòng GT-001 có từ khoá đọc bằng mp3 (cần `db:seed` lại). 700 file mồ côi **không** ghép được chắc chắn với 413 câu dẫn: kho di sản chỉ có mô tả tóm tắt, không có lời thoại
- [ ] Chốt nhà cung cấp TTS (câu hỏi mở 1 của plan)
- [x] Hợp đồng `audio_path` tuỳ chọn cho asset `emoji`/`text` (`contracts/shared-fields.ts`) — làm ở S7b; spec sở hữu là `play-narration.md` §7, không phải `audio-storage.md` (spec đó lo upload/lưu trữ)
- [ ] Script build sinh mp3 theo hash nội dung; seeder ghi `instruction_audio_path`
- [ ] M1 và M2 đạt đích, cổng S5 ratchet lên
