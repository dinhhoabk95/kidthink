# Task #313 — Todo: game-engine cho trẻ mầm non

Nguồn: `313-game-engine-preschool-plan.md`. Mỗi mục: spec trước (nếu đổi hành vi đã chốt) → test đỏ → sửa → `rtk proxy pnpm check`.

## Phase 0 — Level không thắng được
- [x] Web phát gesture `stroke` từ `trailPoints` (`apps/web/app/composables/play/use-play-gesture.ts`)
- [x] Web phát `adjust` (kéo xoay / kéo mức) cho GT-019, GT-032
- [x] Entity nút `flip` (GT-019) và pad `rest` (GT-034) qua tap
- [x] Gate `packages/game-engine/tests/gates/`: mọi fixture giải được chỉ bằng gesture web phát ra + ca âm trong `tests/**/fixtures/`
- [x] GT-031: hint subset-sum thay greedy (`pickCoinHint` trong `templates/GT-031/template.ts`)
- [x] GT-018: refine schema (select có đúng/sai, sequence hợp lệ, không giải sẵn)
- [x] GT-018: sequence không tự thắng, cần nút nộp (session)
- [x] GT-016: `initial_time ≠ target`; match-mode phải có nghiệm (superRefine trong `GT-016/template.ts`)
- [x] GT-035: gate `isSolvableWithinMaxCommands` (fixture + generator đều đạt; chưa nối vào ingest content)

## Phase 1 — Base flow
- [x] B2 fallback không giọng giữ hint level + `focusIndex` (`systems/scaffolding.ts`)
- [x] B3 validate content mọi round lúc load; lỗi factory → màn lỗi
- [x] B4 modal chiến thắng hiện ngay, tier/sao fetch nền
- [x] B5 pause dừng narration + timer; `game_resumed`; `duration_ms` trừ pause
- [x] B6 cooldown ~400ms sau verdict
- [x] B8 một đồng hồ hint, `hint_after_ms` theo round
- [x] B9 drag slop theo age band; drop cực ngắn = tap (chưa làm: whoosh khi spring-back — chưa có asset âm)
- [x] B7 bỏ `prepareRound` trùng · [x] B10 `allow_retry:false` cho thấy đáp án trước khi skip · [x] B11 khoá input khi skip round cuối
- [x] B12 replay gọi `cleanupSession`; thống nhất bảng touch floor; nút GT-000 ≥ sàn chạm band (`--hud-touch-floor`)
- [ ] B12 còn lại: `seq` telemetry ổn định (unshift `game_started` chỉ lệch nếu upload trước nó — chưa có bằng chứng xảy ra); 2 cờ degradation không ai đọc

## Phase 2 — Hint/feedback thống nhất
- [x] Hạ tầng hint nguồn + đích: `HintTarget.slot.toIndex`, `getHintDestinationIndex()`, bàn tay ma (`RenderSystem.renderGhostHand`) ở L2/L3
- [x] Hint L3 đọc lại đề (web `isRereadPromptEscalation` → `replayCurrentRoundNarration`, một lần mỗi vòng)
- [x] `getHintDestinationIndex` cho GT-004/005/006/007/008/014 (chế độ balance)/019/021/023/031/035
- [ ] `getHintDestinationIndex` GT-015, GT-029, GT-036: hợp đồng hint hiện trỏ vào ô đích/ô chạm (sudoku trỏ ô trống, 029 kéo ra ngoài nhóm không có slot đích, 036 phần tử đã cầm sẵn nên chỉ chạm ô dải); muốn bàn tay ma kéo cần đổi hợp đồng hint hoặc thêm đích dạng toạ độ — để quyết định riêng
- [x] `demo_shown` chỉ khi demo vẽ thật
- [x] Helper `WrongFlash` (`src/systems/wrong-flash.ts`, một thời lượng 400ms, đồng hồ khung do session truyền) thay bản `wrongTimestamp` tự viết ở GT-007/008/009/010/011/012/014/015/022/023/025/026
- [ ] Chuyển nốt các bản đếm ngược/khác nền thời gian sang `WrongFlash`: GT-001 (`wrongTimers` theo vật), GT-002/006/018 (đếm lùi theo `update(delta)`), GT-003/004 (`transientStateMs` theo vật, 260ms), GT-027/029/030 (`*UntilMs`), GT-037 (`Date.now()`, 800ms) — cần biến thể theo khoá và quyết định thời lượng riêng
- [x] Retry nói câu khích lệ xoay vòng (`BR-FBK-13`; TTS khi có giọng Việt, mp3 `RETRY_ENCOURAGEMENT_AUDIO` khi không) và đọc pill Montessori (`BR-PNR-12`, `takePillNarration`)
- [ ] Thu 3 file mp3 `apps/web/public/audio/voice/common/feedback/retry-*.mp3` (đường dẫn trong `RETRY_ENCOURAGEMENT_AUDIO`); thiếu file thì máy không giọng Việt chỉ còn âm mềm và nhịp hổ phách
- [x] Tách màu hint vs retry, tăng tương phản: hint hai lớp (viền `amberDark` + nét `amber`, nét đứt) qua `RenderSystem.strokeHintPath`; retry một nét liền `retry[500]`
- [x] Helper derangement trong `src/rng/` (`deriveDerangement`, Sattolo; chưa nối vào generator — Phase 4)

## Phase 3 — Spec drift "control of error"
- [x] 000 · [x] 007 (một phần: lỗi báo trên ô tổng) · [x] 009 · [x] 010 (một phần) · [x] 012 (một phần) · [x] 013 (một phần) · [x] 014 (một phần) · [x] 015 (một phần: verdict/hint; bộ sinh thoái hoá còn lại)
- [x] 020 (lật lệch không phải lỗi, peek chạy thật, trần cặp theo band) · [x] 021 (một phần: lật gương khi vẽ) · [x] 022 (một phần: hình mẫu ghim) · [x] 023 (một phần: mảnh thay nhau, neo giữ hình) · [x] 026 (một phần: go bỏ sót trung tính, nút dừng, hạ độ khó) · [x] 029 (một phần: vật bớt rời nhóm) · [x] 030 (một phần: ô không vẽ sẵn, khe/chồng nhìn thấy) · [x] 031 (một phần: nút trả tiền, hint tới nút trả)
- [x] 032 (một phần: diện tích nước công bằng, bỏ nhãn lộ đáp án, rót tới vạch phải chốt) · [x] 034 (một phần: chấm nhịp, không chấm từng bước, mẫu không in sẵn) · [x] 035 (một phần: chạy từng bước, hụt có phản hồi, hàng lệnh giữ nguyên) · [x] 036 (một phần: bắt ≥2 loại, chưa có luật không phải sai, bỏ chữ thô) · [x] 037 (một phần: dựng lại bảng giữ ô đã khoanh, item_count trần theo band)

- [ ] 007 (còn lại) — cơ chế kéo/gộp vật thật giữa ô tổng và hai khay phần: viết lại session (toAction/getView/render, bài sinh nội dung `discrete-object`); quá lớn cho một commit, cần plan riêng
- [ ] 010 (còn lại) — bộ sinh band 4-5 đã sang bảng giá một bước (Phase 4, BR-E010-05); fixture 4-5 ghim tay (hệ hai phương trình) và nội dung đã seed trong DB chưa đổi
- [ ] 012 (còn lại) — N4/N6 hiện lại nhóm vật sau khi chọn đúng chưa có code (`flash_ms` co giãn ở bộ sinh đã xong ở Phase 4)
- [ ] 013 (còn lại) — lưới 4×4 trở lên chưa có hàng riêng ở khung không stage (`resolveLayout("grid")` chồng hàng cuối lên hàng hai; band 5-6 sinh 5×5/6×6 chưa được bộ giải cử chỉ web kiểm)
- [ ] 014 (còn lại) — ẩn số khối lượng khỏi vật khay/đĩa (đang in nên thành phép trừ): cần kích thước vật tỉ lệ khối lượng (BR-E014-03, hiện ô khay cùng cỡ) trước khi ẩn số, không thì bài không giải được; thuộc Phase 5

- [ ] 015 (còn lại) — bộ sinh đã sửa (Phase 4); fixture ghim tay (#0 2×2 hai ô trống cùng đáp án, #1 ba ô cùng đáp án) chưa đổi vì nhiều test bám vào chúng; thang hint L1–L3 theo Task #301; GT-015#1-2 vẫn trong sổ nợ web-gesture (chưa có cử chỉ nhấc ký hiệu ra)

- [ ] 021 (còn lại) — nửa phản chiếu dùng asset bất đối xứng thật (giày trái/phải, khủng long) và "Gương thần" hiện live: nội dung/asset, Phase 5; ánh sáng ô đối xứng lúc nhấc (N4) chưa có code

- [ ] 022 (còn lại) — cảnh có lớp che thật (vật nấp sau bụi, layering): hiện cảnh xếp lưới theo slot nên không vật nào đè vật nào; cần mô hình lớp + toạ độ tương đối trong stage, thuộc Phase 5; sân khấu rất chật (điện thoại ngang, level 12 vật) chưa có hàng ghim

- [ ] 023 (còn lại) — mảnh khác cỡ thật (người tuyết 3 cỡ: hiện 3 khối cùng asset nên thay nhau được hết) và bảng bóng hình Montessori: asset/nội dung, Phase 5; sân khấu rất chật vẫn lùi về lưới; legacy (không stage) vẫn lệch hệ toạ độ giữa neo và khay

- [ ] 026 (còn lại) — thang hạ độ khó chạy theo số lượt bỏ sót, chưa theo `hint_after_ms` (Task #301); đèn giao thông/mascot đứng hình (Phase 5); GT-026#0-2 đã gỡ khỏi sổ nợ web-gesture (solver nay biết chờ `update()`)

- [ ] 029 (còn lại) — chữ phụ "Đã bớt: n/m" đã thành `-m` + chấm (BR-E029-05); câu "bớt đi n" là câu dẫn shell đọc, ô số ban đầu giữ nguyên; mèo ăn cá thật sự (Phase 5); lưới lẻ cột thì vật bớt chia hàng với nhóm nên không có dock riêng

## Phase 4 — Generator & difficulty
- [x] Generator 006 (số đếm tăng dần, session xáo bằng Sattolo, BR-E006-02/04)
- [x] Generator 008 (ô mang tên vật, khay không xếp sẵn, số ô/hint theo band, BR-E008-04; `distractor_count` còn chết — session ràng items = ô)
- [x] Generator 011 (hình vuông Latin hoán vị, ô trống/lưới 2x2-3x3 đổi theo seed, chỉ band 5-6, BR-E011-04)
- [x] Generator 012 (`flash_ms` theo band×số vật 800–3000, số vật cap-1..cap, nhiễu/hint/arrangement theo band-seed, BR-E012-05)
- [x] Generator 015 (3×3 Latin hoán vị, 2–3 ô trống ngẫu nhiên đạt nghiệm duy nhất/đáp án khác nhau/ô trống liên kết, chỉ band 5-6, BR-E015-06)
- [x] Generator 016 (hai bậc minute_step 60/30, nhiễu ngẫu nhiên + bẫy cùng giờ khác phút, hint theo bậc, BR-E016-04)
- [x] Band khớp `age_min` (011, 015 đã ở commit riêng; 017 + 022 thêm; test chung `generator-degeneracy.test.ts` quét mọi generator, BR-E017-04, BR-E022-06)
- [x] Giảm mật độ tường/số lối GT-013 4–5 tuổi (3×3, 3 tường, ≤3 đường, ≤2 ngõ cụt, fixture #2 đổi 3×3, gỡ GT-013#2 khỏi sổ nợ, BR-E013-05)
- [x] Nối trường difficulty chết, đợt 1: GT-037 `show_target_counter` (BR-E037-09); GT-020 `peek_all_initial_ms` đã nối ở Phase 3
- [ ] Nối/xoá trường difficulty chết, phần còn lại (đo bằng quét `src/` ngoài `template.ts`/`fixtures.ts`/`generators/`; spec sở hữu đều đã nhắc, nên NỐI chứ không xoá):
  - Chưa ai đọc ở bất kỳ đâu: GT-018 `auto_play_audio` · GT-022 `show_target_counter` (chưa có bộ đếm vẽ) · GT-024 `show_guide_lines` · GT-025 `show_counter`, `show_difference_counter`
  - Session đọc `content.*` thay vì `difficulty.*` (trường lặp lại content, cần chốt nguồn thật): GT-028 `step` (+ `shuffle_items`) · GT-029 `shuffle_items`, `initial_count`, `remove_count` · GT-008 `slot_count` · GT-011 `grid_size` · GT-013 `dead_end_count`, `required_cell_count` · GT-015/033 `blank_count` · GT-009 `clue_count`, `candidate_count` · GT-010 `equation_count`, `step_count` · GT-014 `tray_count`, `weight_span` · GT-007 `part_count` · GT-017 `hidden_cube_count` · GT-030 `length_in_units` · GT-031 `coin_kind_count`, `target_amount` · GT-032 `cup_count`, `level_steps`, `conservation_trap` · GT-036 `palette_size`, `min_repetitions`
  - Cờ tính năng chưa có code: GT-023 `show_anchor_outline` · GT-024 `show_numbered_dots` · GT-034 `tempo_bpm`, `instrument_count` · GT-035 `allow_loop`, `obstacle_count`, `collectible_count` · GT-019 `rotation_step`
  - `distractor_count` (GT-001/002/003/004/007/008/010/011/012/016/017/025) và `target_count` (GT-002/003/025/027) chỉ là số đo lại của content; `hint_after_ms` ở mọi engine chờ thang trợ giúp Task #301
  - `shuffle_items` 028/029: session truy cập `content.items[i]` theo chỉ số, xáo phải đổi cả test thứ tự; để riêng một commit
- [x] Gỡ chữ phải đọc khỏi UI trẻ (008, 009, 019, 023, 028, 029, 032, 035, 036) — đợt 4B xong cho 9 game, mỗi game một commit và một `BR-E0xx` mới
  - [x] 008 (ô đích hiện bóng mờ của vật nhận, khay chỉ hình, tên chỉ đọc thành tiếng, BR-E008-05)
  - [x] 009 (thẻ manh mối: kính lúp khi chưa mở, ký hiệu số + mũi tên khi mở, câu chữ chỉ đọc, BR-E009-06)
  - [x] 019 (bỏ nhãn độ dưới ô/mảnh và chữ "Lật", góc nhìn từ hình mờ, số độ chỉ đọc, BR-E019-06)
  - [x] 023 (neo rỗng hiện bóng mờ mảnh nhận, bỏ nhãn "Khung n" và tên mảnh, tên chỉ đọc, BR-E023-06)
  - [x] 028 (dải phụ "Bước nhảy/Đã đếm/Mục tiêu" thành +n, chấm đã nhảy, số đích; BR-E028-05)
  - [x] 029 (một phần: dải phụ "Đã bớt n/m" thành -m + m chấm, BR-E029-05; thẻ "bớt đi n" là câu dẫn do shell đọc)
  - [x] 031 (còn lại Phase 3: "Đã góp x/y đ" thành hàng chấm xu lấp dần, thẻ giá chỉ chữ số, xu bỏ "đ", BR-E031-07)
  - [x] 032 (bỏ dòng phụ bố cục cũ và label "Cốc n", tên cốc chỉ đọc, BR-E032-08)
  - [x] 035 (còn lại Phase 3: thẻ lệnh chỉ biểu tượng, bỏ chữ "Đích"/"Đã xếp"/tên lệnh trong view, tên lệnh chỉ đọc, BR-E035-10)
  - [x] 036 (bỏ dòng mời và lời khen vẽ ở bố cục cũ, label hình mẫu/ô dải, lời chỉ đọc, BR-E036-09)
  - Chưa gỡ (ngoài phạm vi 4B): pill sai Montessori dùng chung (`drawMontessoriControlOfErrorPill`, vẽ `reasonVi` bằng chữ), pill câu dẫn của shell, nhãn rổ GT-003 (`container-shapes.ts`)

## Phase 5 — Đặc sắc từng game
- [x] Đợt demo: 001, 003, 020, 025, 026, 037 (đợt 5A: mỗi game một khung chuyện nói được + một cue âm tổng hợp + một tâm trạng mascot; hạ tầng `BR-FBK-14..16`)
  - [x] 001 (khung chuyện Gấu Con đi chợ, tiếng gỗ `wood_tap`, mascot `wonder` sau khi chọn sai, BR-E001-05)
  - [x] 003 (khung chuyện Gấu Con dọn nhà, tiếng bịch `drop_thud` khi vật đúng vào rổ, mascot `cheer` từ vật đúng đầu tiên, BR-E003-08)
  - [x] 020 (khung chuyện Gấu Con giấu các bạn dưới thẻ, tiếng lật `card_flip`, mascot `wonder` khi một thẻ chờ cặp, BR-E020-07)
  - [x] 025 (khung chuyện Gấu Con vẽ hai bức tranh, tiếng lấp lánh `sparkle_find` khi tìm ra điểm khác, mascot `wonder` từ điểm đầu tới điểm cuối, BR-E025-05)
  - [x] 026 (khung chuyện đèn xanh/đèn đỏ, `go_chime` khi chạm đúng và `stop_hum` khi kìm được, mascot `cheer`/`freeze` sau kết quả lượt — không báo trước đáp án, BR-E026-11)
  - [x] 037 (khung chuyện Gấu Con nhặt đồ bỏ vào lọ, tiếng leng keng `star_collect` khi tìm ra ô đích, mascot `cheer` 1200 ms, BR-E037-10)
  - [ ] Đợt 5A (còn lại) — cần asset thu/vẽ thật: (1) giọng thu thật cho sáu khung chuyện (hiện chỉ TTS, `BR-FBK-16`); (2) sprite SVG riêng cho `wonder`/`freeze`/`cheer` (hiện dùng chung `thinking`/`waiting`/`jumping`, `MASCOT_SPRITE_FILES`); (3) GT-037 lọ đầy dần/ngôi sao bay vào lọ; (4) GT-026 vẽ đèn giao thông thật thay kích thích emoji; (5) GT-020 thẻ lật 3D và GT-025 vòng khoanh lấp lánh quanh điểm tìm ra; (6) GT-003 rổ rung nhẹ khi vật rơi vào. Chưa kiểm tay trên trình duyệt (run skill) và `preview-sandbox.vue` chưa nối cue/story
- [x] Đợt 5B — khác biệt hoá cặp trùng (mỗi game: khung chuyện + cue âm + mascot, spec ghi điểm khác game cùng cặp)
  - [x] 004 (khung chuyện Cún Con xếp gọn đồ, tiếng nắp hộp `lid_click`, mascot `happy`/`wonder` 1500 ms mỗi lần xếp; khác 003 ở khung/âm/nhịp mascot, BR-E004-04)
  - [x] 012 (khung chuyện đom đóm dưới nắp chuông, tiếng chuông `bell_open` khi mở nắp/xem lại, mascot `wonder` suốt pha nhìn–nhớ, không theo đáp án; khác 001/018, BR-E012-06)
  - [x] 018 (khung chuyện "Thỏ bảo", tiếng `rabbit_hop` chỉ khi làm đúng, mascot `happy` 600 ms theo bước xếp và `wonder` sau đáp án chưa đúng, không báo trước; khác 001/012, BR-E018-04). Còn lại: dải icon khi tắt tiếng (cần trạng thái âm của shell), nhận âm thanh con vật (cần asset thu)
  - [x] 022 (khung chuyện Vịt Con cầm kính lúp tìm đồ lạc, tiếng `lens_pop` khi tìm ra, mascot `happy` 1000 ms khi tìm ra và `encourage` khi chạm nhầm; khác 025/037, BR-E022-07). Còn lại: lớp che thật (vật nấp sau bụi) và vẽ kính lúp, giữ ở dòng "022 (còn lại)"
  - [x] 028 (khung chuyện Ếch Xanh nhảy cóc trên tia số, tiếng `frog_hop` mỗi vật thêm, mascot `happy` 700 ms theo bước và `wonder` sau lần nộp chưa đủ; khác 029/031, BR-E028-06). Còn lại: vẽ tia số/ếch, tất theo đôi/bàn tay/bó que tính theo `step` (asset vẽ)
  - [x] 029 (khung chuyện Mèo Mướp đói bụng, tiếng `cat_munch` mỗi vật bớt, mascot `cheer` 1000 ms và `wonder` sau đáp án chưa đúng; khác 028/031, BR-E029-06). Còn lại: nhóm còn lại co nhỏ có chuyển động và vẽ mèo (asset vẽ)
  - [x] 031 (khung chuyện Heo Đất đi chợ quê, tiếng xu rơi `coin_clink`, mascot im tới khi trả chưa đủ rồi `encourage` 1500 ms; khác 028/029, BR-E031-08)
  - [ ] Đợt 5B (còn lại) — cần asset vẽ/thu: (1) 004 khay phân loại kèm thẻ kiểm tra hình, hộp/tủ vẽ riêng; (2) 012 đom đóm nhấp nháy và nắp chuông vẽ thật; (3) 018 dải icon khi tắt tiếng (cần trạng thái âm của shell), nhận âm thanh con vật (cần thu); (4) 022 lớp che thật và vẽ kính lúp (đã có ở dòng 022 còn lại); (5) 028 tia số/ếch, tất theo đôi, bàn tay, bó que tính theo `step`; (6) 029 nhóm còn lại co nhỏ có chuyển động, vẽ mèo; (7) 031 xu quả kích cỡ/màu theo giá trị, vẽ heo đất và quầy chợ. Cue âm mới (`lid_click`, `bell_open`, `rabbit_hop`, `lens_pop`, `frog_hop`, `cat_munch`, `coin_clink`) là âm tổng hợp, chưa nghe thử trên thiết bị thật; `preview-sandbox.vue` chưa nối cue/story
  - [x] 002 (khung chuyện thả lưới bắt cá, tiếng `net_splash` mỗi lần chọn cá — đúng hay sai như nhau, mascot `cheer` 800 ms và `wonder` sau lần kéo lưới chưa đúng; BR-E002-05). Còn lại: cá sai bơi ra khỏi lưới và giỏ có số ô trống bằng số đáp án (chuyển động/hình vẽ)
  - [x] 000 (khung chuyện Cô Cú nghe–chỉ–nói, tiếng `teacher_chime` khi đúng ở recognise/link/recall, mascot `happy` 1000 ms và `listen` 1500 ms thì thầm lại tên khi chạm nhầm mà không báo sai; recall sai im lặng, không chạm cổng `BR-E000-12`; BR-E000-15). Còn lại: rèm che "đồ vật trốn sau rèm" cho recall (hình vẽ)
  - [x] 005 (khung chuyện Sóc Nâu kẹp đồ lên dây phơi, tiếng `peg_clip` mỗi cặp đúng, mascot `cheer` 1000 ms và `wonder` sau cặp chưa đúng; BR-E005-04). Còn lại: dây phơi nối "tách" khi gỡ cặp và vẽ Sóc (hình vẽ/asset)
  - [x] 005 (khung chuyện Sóc Nâu kẹp đồ lên dây phơi, tiếng `peg_clip` mỗi cặp đúng, mascot `cheer` 1000 ms và `wonder` sau cặp chưa đúng; BR-E005-04). Còn lại: dây phơi nối "tách" khi gỡ cặp và vẽ Sóc (hình vẽ/asset)
  - [x] 006 (khung chuyện Rùa Con kể chuyện bằng cuộn phim, tiếng `film_tick` mỗi lần đổi chỗ thẻ — như nhau dù đúng hay sai chỗ, mascot `happy` 700 ms và `wonder` sau lần bấm xong chưa đúng; BR-E006-05). Còn lại: cuộn phim tự chạy khi đúng và cây lớn dần từng thẻ (chuyển động/hình vẽ)
  - [x] 007 (chỉ lớp trải nghiệm: khung chuyện Khỉ Nhỏ chia kẹo cho hai bạn, tiếng `candy_drop` khi thả phần đúng, mascot `cheer` 1000 ms và `wonder` sau phần chưa đúng; xem trước không phản ứng; BR-E007-05). Còn lại: cơ chế kéo/gộp kẹo thật (dòng 007 (còn lại) Phase 3) và vẽ Khỉ Nhỏ (asset)
  - [x] 008 (khung chuyện Voi Con giữ bãi đỗ, tiếng `park_thunk` khi vật vào đúng ô, mascot `cheer` 1000 ms và `wonder` sau lần thả sai; không phản ứng khi mới kéo lại gần; BR-E008-06). Còn lại: ô "thở" khi vật lại gần (phải thở với mọi ô hợp lệ), chuồng đúng màu và vẽ Voi Con (chuyển động/hình vẽ)
  - [x] 009 (khung chuyện Chồn Thám Tử tìm bạn đang trốn, tiếng `clue_ping` khi chạm manh mối mới, mascot `listen` 1200 ms và `wonder` sau ứng viên chưa đúng; úp nháp và manh mối engine tự lật không phản ứng; khác 022; BR-E009-07). Còn lại: kính lúp soi từng ứng viên và vẽ Chồn (hình vẽ/asset)
  - [x] 010 (khung chuyện Cô Gà Mái bán hàng ở chợ, tiếng `price_bell` khi chọn giá đúng, mascot `wonder` 1500 ms sau giá chưa đúng; tra luật không phản ứng; BR-E010-06). Còn lại: biểu thức biến thành đồ thật trên bảng giá và vẽ Cô Gà Mái (hình vẽ/asset)
  - [x] 011 (khung chuyện Bướm Nhỏ trồng luống hoa, tiếng `seed_plop` khi chọn đúng, mascot `wonder` 1500 ms sau lựa chọn chưa đúng; xem trước không phản ứng; BR-E011-05). Còn lại: hàng/cột sáng lên khi khớp và vẽ Bướm Nhỏ (chuyển động/hình vẽ)
- [ ] Các game còn lại theo cột "Hướng đặc sắc" trong plan §1.3
- [ ] 030 (còn lại) — dải đo vẫn là lưới ô có thể xuống nhiều hàng ở khung hẹp, chưa phải một dải liền kéo tự do theo thước; `representation: number-rod` chưa hiện khe/chồng. Cần thiết kế lại zone-layout (Phase 5 "Dải kéo tự do có snap")
- [ ] 031 (còn lại) — mệnh giá phi thực tế ("3đ") và xu chỉ khác số: thuộc nội dung/Phase 4-5 (xu quả kích cỡ/màu theo giá trị, hạt Montessori); nhãn "Đã góp: x / y đ" đã thay bằng hàng chấm xu lấp dần (đợt 4B, BR-E031-07)
- [ ] 032 (còn lại) — animation rót giữa hai cốc rồi mới hỏi, `L2` hiện số vạch và `L3` tách cột nước xếp cạnh nhau chưa có code (hint hiện chỉ vẽ vạch); cốc `fluted` vẫn vẽ như cốc thường
- [ ] 034 (còn lại) — bóng nảy theo phách và trống cơm/phách/mõ (Phase 5); mốc dung sai 160 ms (`BEAT_TIMING_TOLERANCE_MS`) chưa đo với trẻ thật (open question #1); `L2` nháy nhạc cụ đúng và `L3` phát nửa tốc độ chưa có code
- [ ] 035 (còn lại) — robot kiểu Bee-Bot "bíp" và mũi tên tuyệt đối ↑→↓← cho 5 tuổi (Phase 5); chữ trên thẻ lệnh/nhãn lưới đã gỡ ở đợt 4B (BR-E035-10); `L2`/`L3` của phiếu chưa có code; chưa có nút dừng giữa lúc robot đang chạy
- [ ] 036 (còn lại) — mô-típ sáng lần lượt kèm lời mời bằng giọng nói (hiện chỉ sáng đồng loạt, không có audio mời); mascot hát quy luật, giao diện xâu hạt (Phase 5); nút xoá dải riêng chưa có
- [ ] 037 (còn lại) — mật độ 4 tuổi: trần 10 ô đã chặn nhưng vùng chạm/ký hiệu gây nhầm (confusable) chưa giảm theo band; `Date.now()` 800ms vẫn thuộc dòng WrongFlash ở trên; thuộc Phase 4/5
