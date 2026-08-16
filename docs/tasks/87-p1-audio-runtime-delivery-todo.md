# Todo — Task #87: Triển khai Audio Runtime Delivery và Fallback Tiếng Việt (P1)

## Preflight

- [ ] Đọc spec sở hữu [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) và [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md).
- [ ] Xác nhận contract audio [`Task #80`](80-audio-contract-closure-plan.md) đã đóng.
- [ ] Kiểm tra baseline code `packages/game-engine/src/systems/audioController.ts`.

## WP87.1 — AudioController & Web Audio SFX Loader

- [ ] Hiện thực Web Audio Context wrapper trong `packages/game-engine`.
- [ ] Cài đặt master gain limiter tuân thủ trần −16 LUFS và true peak ≤ −1 dBTP (`BR-ENG-16`).
- [ ] Cài đặt envelope generator với ramp-in ≥ 20ms và ramp-out ≥ 40ms.
- [ ] Viết unit test cho `AudioController` (gain curve, volume clamping, audio buffer caching).

## WP87.2 — Web Speech TTS Adapter

- [ ] Xây dựng `SpeechSynthesisAdapter` bọc `window.speechSynthesis`.
- [ ] Kiểm tra danh sách voices và lọc voice có `lang = 'vi-VN'`.
- [ ] Xử lý sự kiện lỗi `error`, `audiostart`, `end` và timeout an toàn.
- [ ] Phát hiện sớm thiết bị không có voice tiếng Việt và trả cờ `isVoiceAvailable = false`.
- [ ] Viết unit test giả lập môi trường có voice `vi-VN` và không có voice `vi-VN`.

## WP87.3 — Visual Fallback Integration

- [ ] Tích hợp `SpeechSynthesisAdapter` vào Session class và Scaffolding system.
- [ ] Khi `isVoiceAvailable = false` hoặc `audio_enabled = false`, tự động kích hoạt L2/L3 visual scaffolding (ghost hand, highlighting, icon prompt) (`BR-ENG-10`, `BR-A11-11`).
- [ ] Đảm bảo trẻ 3–6 tuổi hiểu và hoàn thành màn chơi mà không bị chặn.

## WP87.4 — Test Matrix & Edge Cases

- [ ] Viết test cho kịch bản Online có voice `vi-VN`.
- [ ] Viết test cho kịch bản thiết bị thiếu voice `vi-VN` -> fallback trực quan.
- [ ] Viết test cho kịch bản Offline play -> phát SFX cache, visual cue thay cho TTS động.
- [ ] Viết test cho kịch bản Autoplay policy bị trình duyệt khoá -> fallback an toàn.
- [ ] Khẳng định 0 lời gọi ghi âm/mic (`BR-CDC-04`, `BR-AST-04`).

## WP87.5 — Verification & Completion Gate

- [ ] `pnpm --filter @kidthink/game-engine test` pass xanh 100%.
- [ ] `pnpm check` (lint + typecheck) pass xanh.
- [ ] `pnpm test` toàn bộ workspace pass xanh.
- [ ] Mở PR review, không auto-merge.
