# Task #320 — Sửa UX event của play surface theo đúng loại game

## Context

Người dùng thấy event kéo-thả / click / Next / voice không khớp ý nghĩa từng loại game. Ví dụ: game chỉ chạm vẫn hiện hiệu ứng kéo. Đã khảo sát (3 agent + đọc code) và tìm ra gốc lỗi:

- Template có khai `input.verbs` (`packages/game-engine/src/templates/GT-xxx/template.ts`, gom trong `generated/input-registry.ts`, export `getTemplateInput`). Nhưng **không chỗ nào ở runtime đọc nó**. Web (`apps/web/app/composables/play/use-play-gesture.ts`) bật kéo cho mọi game: chỉ cần vượt `dragSlopCssPx` và entity có `role:"source"`.
- Registry khai sai so với spec N3 (`docs/specs/01-platform/engines/GT-0xx.md`) và với `toAction` thật. Ví dụ GT-011/030/033 xử lý `drop` nhưng không khai. GT-009/031/032/034/037 có `commit` nhưng không khai.

Lỗi cụ thể đã kiểm bằng cách đọc code:

| # | Lỗi | Vị trí |
|---|---|---|
| E1 | Game chỉ chạm (GT-009/022/025/026/027/034…) vẫn có tiếng nhấc gỗ, ghost bay theo tay, ô đích nhấp nháy, tiếng clack khi hover. Nếu view không có target thì **mọi entity** bị coi là ô đích | `use-play-gesture.ts:456-461, 473-517`; `render/gesture-overlay.ts:330`; `findDropTargetsInEntities` |
| E2 | Tap hơi rung (> slop) trong game chỉ chạm thành `drop` rồi bị nuốt im. Trẻ chạm mà không có gì xảy ra | `buildDragGesture` `:570-607` |
| E3 | GT-019: thả mảnh ra chỗ trống thì rơi vào fallback `adjust`, mảnh bị xoay | `buildDragGesture` |
| E4 | `toAction` bị gọi như một phép thăm dò dù nó có side effect (GT-007/014/019 staging) | `buildDragGesture`, `stepLiveMazeCellIfLegal` |
| E5 | Pickup sound, overlay, `setPointerOver`/`onPointerMove` vẫn chạy khi input đóng (prompt đang đọc, 900ms ăn mừng, reveal) | `handlePointerDown`, `updateDragHoverFeedback` |
| E6 | Sau khi thắng không đóng input, tap vẫn đọc tên và lời mời, chồng lên chuyển lượt | `use-play-session.ts:339-360` (`handleRoundWonInternal`) |
| E7 | Nút "Nghe mẫu" của GT-034 (commit = `play_pattern`) trả `ACTION_CORRECT`: bị tính là đáp án đúng, có pop, reset hint | `GT-034/session.ts:423-428` |
| E8 | GT-006 và GT-018 sequence: mỗi lần `reorder_step` trả `ACTION_CORRECT`, nên mỗi bước trung gian bị tính đúng và có pop | `mechanics/ordering-mechanic.ts` |
| E9 | Bàn phím: `pressActionButton` khi không có zone gửi commit mà không kiểm `canCommit` | `use-play-gesture.ts:730-743` |
| E10 | Bàn phím: `isTwoStepSurface()` chỉ xét có target hay không. GT-009 (tap, nhưng có clue role target) không chọn được đáp án | `:157-159, 679-728` |
| E11 | Mỗi tap đều đọc tên, kể cả lúc trả lời đúng (chồng snap/pop). Tap nhanh làm mất câu retry/pill đã `take` | `handleVerdict :251-301`, `audio-controller.ts:105-112,186-190` |
| E12 | Hai kênh audio: prompt mp3 qua `new Audio` (`use-play-audio.ts:115`) và label/retry qua `engine.audio`, không kênh nào dừng kênh kia, nên chồng tiếng. `[code].vue:496` tạo instance `usePlayAudio` thứ hai mà unmount không dừng được gì | |
| E13 | GT-007 candy: kéo rồi thả lại trên chính khay đã khoá thì bị tính sai | `GT-007/candy-split.ts:123-126` |
| E14 | `dragSlopCssPx` bị định nghĩa ở hai nơi | `use-play-gesture.ts:62`, `play-gesture-helpers.ts:64` |

Chốt với người dùng: làm đủ 4 lát. Tên đồ vật chỉ đọc **lần chạm đầu mỗi lượt**, chạm lại trong 1,5s thì không đọc. Không đọc khi input đóng hoặc đã thắng. Trả lời đúng thì chỉ phát sfx, không đọc tên.

## Spec trước (cùng commit với code của mỗi lát)

- `docs/specs/01-platform/engine-input-contract.md`: thêm `BR-EIC-*` mới:
  - Shell chỉ bật kéo (overlay, sound, hover, `onPointerMove`) khi session nhận `drop`/`stroke`/`adjust`.
  - Kéo không ai nhận thì quy về `tap` tại điểm bắt đầu nếu template nhận `tap` và điểm thả vẫn trên entity ban đầu; còn lại thì float back.
  - Không fallback `adjust` cho kéo bắt đầu từ source.
- `docs/specs/04-play/play-narration.md`: chốt câu hỏi mở #3 thành rule `BR-PNR-*`. Bỏ câu "TTS đọc" trong BR-FBK-13 để khỏi mâu thuẫn với BR-PNR-06.
- `engines/GT-034.md`, `GT-006.md`, `GT-018.md`: "Nghe mẫu" và từng bước sắp xếp **không** phải verdict (feedback quiet).
- Thêm dòng vào `docs/specs/00-foundation/business-rules.md`. Plan và todo ở `docs/tasks/320-play-input-ux-plan.md`, `320-play-input-ux-todo.md`.

## Lát S1 — Verb một nguồn, chặn kéo vô nghĩa (E1, E5, E14)

1. Sửa `input.verbs` trong `template.ts` cho khớp spec N3 và `toAction`:
   - Thêm `drop` cho GT-000/011/013/016/017/018/024/030/033.
   - Thêm `commit` cho GT-000/009/031/032/034/037.
   - Chạy lại script sinh `generated/input-registry.ts` (tìm generator trong `packages/game-engine/scripts`). Nếu chỉ import `.input` thì không cần sinh lại.
2. `TemplateGameSession` (`packages/game-engine/src/game-session.ts`) thêm `acceptedVerbs(): readonly PlayVerb[] | null`. Mặc định `null` nghĩa là dùng registry. Override theo mode:
   - GT-016: `read`/`match` thì `tap`.
   - GT-018: `choice` thì `tap`.
   - GT-032: không phải `pour_to_mark` thì `tap`.
   - GT-037: `auto` thì `tap`.
3. Web: helper `sessionAcceptsDrag(session, templateCode)` trong `play-gesture-helpers.ts`, trả true khi có `drop`/`stroke`/`adjust`. Ưu tiên `session.acceptedVerbs()`, rơi về `getTemplateInput(code)`. `usePlayGesture` nhận `templateCode` từ `[code].vue`. Khi không cho kéo:
   - không phát `playWoodPickupCue`;
   - `isDragging` không bật;
   - không `updateDragHoverFeedback`;
   - overlay chỉ vẽ `drawPressedEntityOverlay`.
4. Gate `engine.acceptingInput && session.isAcceptingInput()` (dùng lại `getActiveSession`) cho pickup cue, hover, `setPointerOver`, `onPointerMove`.
5. Xoá bản `dragSlopCssPx` trùng. Giữ một bản ở `play-gesture-helpers.ts`.
6. `findDropTargetsInEntities`: bỏ nhánh "không có target thì mọi entity là đích" khi session không nhận `drop`.

## Lát S2 — Kéo thành tap / fallback (E2, E3, E4, E13)

1. `buildDragGesture`:
   - Bỏ việc thăm dò bằng `toAction`. Chọn gesture theo verb:
     - có `stroke` và trail ≥ 2 điểm thì `stroke`;
     - có `drop` thì `drop`;
     - có `adjust` và kéo **không** bắt đầu trên source thì `adjust`.
   - Không còn verb nào khớp mà template nhận `tap`, entity lúc thả trùng entity lúc bắt đầu, thì gửi `tap` tại điểm bắt đầu.
   - Ca thứ hai cần giữ hành vi: GT-013/024 nhận cả `stroke` lẫn `drop`. Phải kiểm cách session đọc `stroke` vs `drop` trước khi bỏ probe. Nếu buộc phải thăm dò, thêm `previewGesture`-style **pure** check (BR-EIC-04 đã có tên `previewGesture`) thay vì `toAction`.
   - `stepLiveMazeCellIfLegal` cũng đổi sang check pure.
2. GT-007 `candy-split.ts`: kiểm same-tray trước `isLocked`, để thả tại chỗ thành ignored.
3. `buildDragFlight`: khi drag bị quy về tap, dùng `buildTapFlight`.

## Lát S3 — Commit / Next đúng nghĩa (E6, E7, E8, E9, E10)

1. `handleRoundWonInternal`: đặt `engine.acceptingInput = false` ngay khi thắng, mở lại ở round mới (xem chỗ round mới set `true`).
2. GT-034: commit `play_pattern` trả `ACTION_QUIET_OK` (hằng có sẵn, GT-032 đang dùng) thay vì `ACTION_CORRECT`.
3. `OrderingMechanic`: `reorder_step` trả quiet. Chỉ commit mới chấm. Rà các template dùng mechanic này (GT-006/013/018/024) xem có template nào dựa vào verdict của từng bước không. GT-013/024 có thể **cần** đúng từng bước, nên làm thành tham số của mechanic (`gradeEachStep`) thay vì đổi mặc định.
4. `pressActionButton`: kiểm `canCommit()` trên cả nhánh không có zone (dùng chung `handleActionTap`).
5. `isTwoStepSurface()`: thêm điều kiện session nhận `drop`.

## Lát S4 — Voice (E11, E12)

1. `speakEntityKeyword`:
   - Thêm `Map<entityId, lastSpokenAtMs>`, reset trong `setupEntities` / round mới.
   - Đọc nếu là lần đầu trong lượt, hoặc đã qua 1,5s (`ENTITY_NAME_REPEAT_MS` để trong constants).
   - Bỏ qua khi input đóng.
   - Trả lời đúng thì không đọc tên.
   - Sai thì vẫn đọc tên trước rồi chuỗi retry (BR-FBK-13).
2. Không để mất retry/pill: khi tap mới cắt ngang mà chưa đến lượt retry, tap mới không đọc label (retry ưu tiên). Hoặc dùng hàng đợi một phần tử trong `AudioController.speakPrompt`. Chọn cách đầu, đơn giản hơn.
3. Một kênh voice: prompt mp3 trong `use-play-audio.ts` gọi `engine.audio.stopVoice()` (hoặc tương đương) trước khi phát. Label/retry dừng prompt audio đang phát, **trừ** khi prompt đang bắt buộc (BR-PNR-11 đã nuốt tap lúc đó). Riêng replay: tap entity thì cắt replay.
4. `[code].vue:496`: bỏ instance `usePlayAudio` thứ hai, lấy từ `usePlaySession`.

## File chính

- `apps/web/app/composables/play/use-play-gesture.ts`, `play-gesture-helpers.ts`, `use-play-session.ts`, `use-play-audio.ts`
- `apps/web/app/pages/play/[code].vue`
- `packages/game-engine/src/game-session.ts`, `render/gesture-overlay.ts`, `audio-controller` (đường dẫn theo import), `mechanics/ordering-mechanic.ts`
- `packages/game-engine/src/templates/GT-{000,007,009,011,013,016,017,018,024,030,031,032,033,034,037}/template.ts|session.ts`
- Spec: `engine-input-contract.md`, `play-narration.md`, `engines/GT-006|018|034.md`, `business-rules.md`

## Test (TDD, viết đỏ trước)

- `packages/game-engine/tests/engine-play-language.test.ts`: thêm ca mỗi template, chạy fixture seed và gửi `drop`/`commit`. Nếu `toAction` ≠ null thì verb đó phải có trong `acceptedVerbs ?? input.verbs`. Đây là cổng chống drift, gồm quét thật và ca âm qua fixture template giả trong `tests/fixtures/`.
- Test engine: GT-034 commit thì quiet. Ordering step quiet khi bật cờ. GT-007 same-tray thì ignored.
- `apps/web` (vitest, test composable hiện có của `use-play-gesture`):
  - tap-only không bật drag và không phát pickup;
  - wobble tap ra `tap`;
  - GT-019 thả trống không ra `adjust`;
  - input đóng sau khi thắng;
  - tên chỉ đọc một lần trong 1,5s;
  - keyboard commit tôn trọng `canCommit`.
- Trước khi sửa, chụp `trạng-thái | tên-test` của `packages/game-engine` và `apps/web`. Sau khi sửa so lại, chỉ các test liên quan lỗi trên mới được đổi.

## Verification

1. `rtk proxy pnpm check; echo EXIT=$?`
2. `cd packages/game-engine && rtk proxy npx vitest run --reporter=dot; echo EXIT=$?`, và tương tự cho `apps/web`.
3. Chạy app (`pnpm dev`, Node 26), mở chrome-devtools MCP, rồi thử bằng tay:
   - GT-009/026 (kéo không có ghost; tap rung vẫn ăn)
   - GT-003 (kéo-thả và tap-tap vẫn chạy)
   - GT-019 (thả trống không xoay)
   - GT-034 (Nghe mẫu không pop)
   - GT-006 (bước sắp xếp không pop, chỉ commit chấm)
   - chạm liên tục 1 đồ vật (đọc 1 lần), chạm lúc ăn mừng (im)
4. Mỗi lát một commit trên `main`.

## Ghi chú thực thi (2026-11-27)

- Verb khai báo gắn vào phiên trong `createGameSessionSync` (`setDeclaredVerbs`); web chỉ đọc `session.acceptedVerbs()`, không cần mã template.
- Probe `toAction` trong `buildDragGesture` được giữ, nhưng chỉ cho verb phiên nhận và chỉ với `stroke`/`drop`/`adjust`. Các nhánh này của mọi template hiện không đổi trạng thái; chỉ nhánh `tap` mới staging (GT-007/014/018/019). Không thêm `previewGesture` riêng.
- `OrderingMechanic.reorder_step` đổi thẳng sang quiet: chỉ GT-006/GT-018 dùng `reorder_step`. GT-013/GT-024 dùng mechanic nhưng không đi nhánh này, nên không cần cờ `gradeEachStep`.
- Spec engine GT-006/GT-034 đã ghi đúng ý (chỉ nộp mới chấm, "Nghe mẫu" không phải nộp), không sửa.
