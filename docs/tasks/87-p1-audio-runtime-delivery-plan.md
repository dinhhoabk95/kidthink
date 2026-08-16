# Kế hoạch — Task #87: Triển khai Audio Runtime Delivery và Fallback Tiếng Việt (P1)

> **Loại task:** implementation lát dọc (S/M). Kế thừa contract đã đóng tại [`Task #80`](80-audio-contract-closure-plan.md).
> **Spec sở hữu:** [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) · [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) · [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) · [`accessibility.md`](../specs/08-quality/accessibility.md).

## 1. Outcome

Hiện thực hóa toàn bộ luồng audio runtime phục vụ trẻ mầm non 3–6 tuổi:
1. Phát âm thanh hiệu ứng (SFX) qua Web Audio API (`AudioBufferSourceNode`) tuân thủ trần âm lượng an toàn −16 LUFS, true peak ≤ −1 dBTP, ramp-in ≥ 20ms, ramp-out ≥ 40ms (`BR-ENG-16`).
2. Tích hợp Web Speech API (TTS) cho các chỉ dẫn động bằng tiếng Việt (`vi-VN`), có bộ phát hiện sẵn sàng của voice tiếng Việt trên thiết bị.
3. Cơ chế fallback trực quan hoàn chỉnh (ghost hand, visual highlighting, biểu tượng gợi ý) khi thiết bị không có giọng `vi-VN`, khi chơi offline không có TTS, hoặc khi autoplay bị trình duyệt chặn (`BR-ENG-10`, `BR-A11-11`).
4. Đảm bảo 100% không crash, không im lặng treo màn hình và không thu âm giọng trẻ.

## 2. Bằng chứng cần xử lý

- Contract đã được đóng và duyệt tại [`Task #80`](80-audio-contract-closure-plan.md) và [`audio-storage.md`](../specs/01-platform/audio-storage.md).
- Lenovo Tab M8 2GB RAM (`D-CH`) có thể không cài sẵn voice tiếng Việt chất lượng cao; runtime phải kiểm tra và degrade êm sang visual presentation.
- C5 (`tpl-listen-respond` / D6-09) và các template C1–C4, C6 cần audio playback có thể replay kèm text/icon caption.

## 3. Assumptions và ranh giới

1. **Pure TypeScript**: Toàn bộ logic audio runtime nằm trong `packages/game-engine/src/systems/audioController.ts` và tích hợp vào RAF engine; không import Vue, Pinia, VueUse (`BR-ENG-01`).
2. **Không network call lúc chơi**: Static SFX được preload lúc khởi tạo phiên; không fetch audio trong render loop (`BR-ENG-03`).
3. **An toàn thính giác trẻ**: Cấm âm thanh mang tính trừng phạt (buzzer/còi chát tai) khi trả lời sai; chỉ dùng nhịp hổ phách nhẹ và âm êm dịu (`BR-ENG-07`, `BR-SCF-08`).
4. **Không thu âm trẻ**: Tuyệt đối không gọi `getUserMedia`, MediaRecorder hay thu thập dữ liệu sinh trắc (`BR-CDC-04`, `BR-AST-04`).

## 4. Dependencies và thứ tự

```text
Task #80 audio contract closure (approved)
  └──→ WP87.1 AudioController & Web Audio SFX loader
         └──→ WP87.2 Web Speech TTS adapter (vi-VN voice detection)
                └──→ WP87.3 Visual fallback integration (ghost hand / highlight)
                       └──→ WP87.4 Test suite (Lenovo Tab M8 matrix, offline, no vi-VN)
                              └──→ WP87.5 Verification & Human Gate
```

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP87.1 | S | Hiện thực `AudioController` trong `packages/game-engine`: Web Audio context, buffer caching, master ceiling −16 LUFS, ramp-in ≥ 20ms, ramp-out ≥ 40ms | Unit test kiểm tra gain envelope và volume clipping |
| WP87.2 | S | Hiện thực `SpeechSynthesisAdapter`: detect `vi-VN` voice, handle autoplay policy lock, fallback event | Unit test giả lập có/không voice `vi-VN` và browser rejection |
| WP87.3 | M | Tích hợp vào Session class & Scaffolding system: tự động kích hoạt ghost hand/highlighting khi audio không khả dụng | Test scaffolding kích hoạt visual cue đầy đủ khi audio disabled/unavailable |
| WP87.4 | S | Xây dựng test matrix: online/offline × có/không `vi-VN` × Lenovo Tab M8 profile | Vitest suite phủ 100% các nhánh thiết bị |
| WP87.5 | S | Chạy verification gate (`pnpm check`, `pnpm test`), chuẩn bị human diff review | Không lint/type error, không auto-merge |

## 6. Matrix kiểm thử thiết bị (Lenovo Tab M8 & Fallback)

| Kịch bản | Trạng thái Voice | Kết nối | Hành vi mong đợi |
|---|---|---|---|
| Standard online | Có `vi-VN` voice | Online | Phát TTS chỉ dẫn + SFX tĩnh bình thường |
| Missing voice | Không có `vi-VN` | Online | Degrade êm sang visual highlight + ghost hand, không crash |
| Offline play | Không TTS offline | Offline | Phát SFX tĩnh đã cache + visual ghost hand demo |
| Autoplay blocked | Trình duyệt chặn | Bất kỳ | Đợi first user gesture hoặc kích hoạt visual cue ngay |
| C5 Listen-Respond | Không có voice | Bất kỳ | Hiện nút Replay icon + visual caption + minh hoạ visual |

## 7. Acceptance criteria

```gherkin
Scenario: BR-ENG-16 — Audio master volume tuân thủ trần an toàn
  Given AudioController được khởi tạo
  When phát SFX hoặc narration
  Then gain node áp dụng trần -16 LUFS và ramp-in >= 20ms, ramp-out >= 40ms

Scenario: BR-ENG-10 — Fallback trực quan khi thiết bị thiếu voice tiếng Việt
  Given thiết bị không có voice vi-VN trong window.speechSynthesis
  When engine bắt đầu round chơi cần hướng dẫn
  Then engine phát hiện voice unavailable
  And kích hoạt visual demonstration (ghost hand) trên mục tiêu cần thao tác
  And phiên chơi tiếp diễn bình thường, không xảy ra lỗi

Scenario: Offline play fallback
  Given chế độ offline được bật và không có kết nối mạng
  When trẻ chơi game
  Then các âm thanh tĩnh đã cache được phát bình thường
  And các chỉ dẫn động fallback sang hiển thị trực quan

Scenario: An toàn tuyệt đối không thu âm
  When quét toàn bộ source code của packages/game-engine
  Then không có bất kỳ lời gọi API nào tới mic/camera hoặc ghi âm
```

## 8. Verification

```bash
pnpm --filter @kidthink/game-engine test
pnpm check
pnpm test
```

## 9. Definition of done

- `AudioController` và `SpeechSynthesisAdapter` hoàn thiện với đầy đủ unit test.
- Test matrix bao phủ toàn bộ các trường hợp thiếu voice `vi-VN`, offline và autoplay block.
- `pnpm check` và `pnpm test` xanh 100%.
- PR được mở để người review diff, không auto-merge.
