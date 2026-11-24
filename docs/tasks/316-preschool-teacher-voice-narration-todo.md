# Checklist Thực Thi — Task #316

- [x] **Pha 1 — Kiến Trúc Hợp Đồng, Băm Tất Định & Kịch Bản Ngữ Âm (`voice-architect`)**
  - [x] Xây dựng `packages/shared/src/voice-path.ts` thuần TypeScript không phụ thuộc `node:*`: `TEACHER_VOICE_PROFILE` (`"teacher-v1"`), `normalizeVoiceLookupKey`, `sha256HexSync` (FIPS 180-4 đồng bộ khớp `100%` `node:crypto`), `computeVoiceHash`, `resolveTeacherVoicePath`, `formatVietnameseCardinal` (`0..999` miền Bắc) và `toSpokenVietnameseScript`
  - [x] Xuất subpath `"./voice-path": "./src/voice-path.ts"` trong `packages/shared/package.json`
  - [x] Viết và chạy xanh bộ kiểm thử đơn vị `packages/shared/tests/voice-path.test.ts` (`11/11` test pass, `tsc --noEmit` và `biome check` sạch `0` lỗi)
  - [x] Cập nhật hợp đồng [`../specs/04-play/play-narration.md`](../specs/04-play/play-narration.md) (§5, §6 `BR-PNR-05` & `BR-PNR-06`, §7.1–7.2 thứ tự dự phòng 2 bậc không giọng robot trình duyệt, §9, §10, §11 đóng câu hỏi mở `1, 2, 4` theo `T316`)
  - [x] Ban hành kế hoạch kỹ thuật [`316-preschool-teacher-voice-narration-plan.md`](316-preschool-teacher-voice-narration-plan.md) và checklist theo dõi tiến độ

- [ ] **Pha 2 — Xây Dựng CLI Trích Xuất Corpus & Pipeline TTS Đa Cấu Hình (`voice-cli-builder`)**
  - [ ] Dựng bộ quét tự động toàn bộ câu thoại từ `2.135` level (`6.192` vòng), `106` bài `GT-000`, `443` kỹ năng, kho từ vựng vật phẩm/số/hình/chữ/dấu thanh, câu khen đồng dao và mẫu pill Montessori
  - [ ] Tích hợp 4 adapter TTS Neural tiếng Việt miễn phí không cần API key (`VieNeu-TTS` ONNX, `VieNeu` Voice Clone, `Piper VAIS-1000`, `Edge-TTS`) dùng chung `toSpokenVietnameseScript` và `computeVoiceHash` từ `@mindkid/shared/voice-path`
  - [ ] Tích hợp hậu kỳ âm thanh chuẩn hoá `-16 LUFS`, true peak `<= -1 dBTP`, trim khoảng lặng an toàn (fade-in `>= 20 ms`, fade-out `>= 40 ms`) và ghi sổ `manifest.json` idempotent

- [ ] **Pha 3 — Pha 0 Audition & Kết Xuất Hàng Loạt `~6.700` File `.mp3` (`voice-batch-producer`)**
  - [ ] Chạy chế độ `--audition` trên bộ câu mẫu mầm non đối chứng cả 4 cấu hình Neural TTS và chốt cấu hình giọng cô giáo miền Bắc ấm áp, rõ chữ nhất cho profile `teacher-v1`
  - [ ] Kết xuất đầy đủ `~6.700` file `.mp3` vào `apps/web/public/audio/voice/teacher-v1/{2-hex}/{16-hex}.mp3` kèm `manifest.json`
  - [ ] Kiểm tra tự động `0` file rỗng/hỏng frame và cập nhật mốc `scripts/narration-coverage-baseline.json`

- [ ] **Pha 4 — Đấu Nối Đường Dẫn Giọng Thống Nhất Ở Tầng Nội Dung (`content-voice-wiring`)**
  - [ ] Gắn tất định `instruction_audio_path` và `audio_path` từ `resolveTeacherVoicePath` vào các builder của `@mindkid/content` cho toàn bộ vòng chơi, thẻ `GT-000` và vật phẩm
  - [ ] Loại bỏ tham chiếu chéo sang kho giọng rời rạc cũ (`common/numbers/`, `d1..d6/`) để bảo đảm `1` giọng duy nhất xuyên suốt phiên học (`BR-PNR-05`)
  - [ ] Chạy xanh toàn bộ suite test của `@mindkid/content` và `@mindkid/content-build`

- [ ] **Pha 5 — Gỡ Bỏ Hoàn Toàn JS Web Speech API & Chuẩn Hoá UI Hiển Thị (`engine-web-tts-remover`)**
  - [ ] Xoá toàn bộ nhánh gọi `window.speechSynthesis` / `SpeechSynthesisAdapter` khỏi `@mindkid/game-engine` (`AudioController`, `RoundRunner`) và `apps/web` (`use-play-audio.ts`, `/play/**`)
  - [ ] Đấu nối tra cứu `resolveTeacherVoicePath` cho câu dẫn mở vòng, chạm đọc tên vật, câu khen và lời đọc pill Montessori (`takePillNarration`, `BR-PNR-12`)
  - [ ] Bảo đảm khi file `.mp3` lỗi hoặc quá hạn `3s`, hệ thống rơi thẳng xuống bậc 2 tín hiệu thị giác (`ghostHand` + nhấp nháy khung yêu cầu `1200 ms`, `BR-PNR-06`) và mở cử chỉ đúng hạn không treo màn chơi (`BR-PNR-09`, `BR-PNR-11`)
  - [ ] Đồng bộ câu chữ hiển thị trên HUD `/play/**` khớp chuẩn sư phạm với kịch bản giọng đọc cô giáo

- [ ] **Pha 6 — Cổng Độ Phủ `check:narration-coverage` & Kiểm Định Cuối (`voice-qa-gatekeeper`)**
  - [ ] Cập nhật `scripts/check-narration-coverage.ts` kiểm tra `100%` file `.mp3` thuộc `teacher-v1` tồn tại thật trên đĩa và `0` lệnh gọi `speechSynthesis` ở runtime
  - [ ] Chạy `pnpm check` (`biome check`, `pnpm lint:deps`, `pnpm typecheck`) và toàn bộ Vitest các workspace liên quan đạt `exit 0`
  - [ ] Kiểm thử E2E Playwright trên `/play` & `/play/:code` xác nhận âm thanh cô giáo phát chuẩn xác, nút "Nghe lại" hoạt động đúng hợp đồng (`BR-PNR-07`, `BR-PNR-08`) và `0` lỗi console
