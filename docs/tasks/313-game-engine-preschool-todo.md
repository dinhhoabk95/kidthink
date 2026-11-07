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
- [ ] 020 · [x] 021 (một phần: lật gương khi vẽ) · [x] 022 (một phần: hình mẫu ghim) · [x] 023 (một phần: mảnh thay nhau, neo giữ hình) · [x] 026 (một phần: go bỏ sót trung tính, nút dừng, hạ độ khó) · [x] 029 (một phần: vật bớt rời nhóm) · [x] 030 (một phần: ô không vẽ sẵn, khe/chồng nhìn thấy) · [x] 031 (một phần: nút trả tiền, hint tới nút trả)
- [ ] 032 · [ ] 034 (chấm timing) · [ ] 035 (chạy từng bước) · [ ] 036 · [ ] 037

- [ ] 007 (còn lại) — cơ chế kéo/gộp vật thật giữa ô tổng và hai khay phần: viết lại session (toAction/getView/render, bài sinh nội dung `discrete-object`); quá lớn cho một commit, cần plan riêng
- [ ] 010 (còn lại) — đổi nội dung 4–5 tuổi sang bảng tra/bảng giá một ẩn (không hệ hai phương trình): cần đổi schema/generator, thuộc Phase 4/5
- [ ] 012 (còn lại) — `flash_ms` vẫn cố định 1500 ở bộ sinh: co giãn theo band/độ khó (đã nằm ở Phase 4 "Generator 012"); N4/N6 hiện lại nhóm vật sau khi chọn đúng chưa có code
- [ ] 013 (còn lại) — mê cung ~50% tường, nhiều lối: giảm mật độ tường và số lối ở bộ sinh/fixture 4–5 tuổi (nội dung/generator, Phase 4); GT-013#2 vẫn nằm trong sổ nợ web-gesture
- [ ] 014 (còn lại) — ẩn số khối lượng khỏi vật khay/đĩa (đang in nên thành phép trừ): cần kích thước vật tỉ lệ khối lượng (BR-E014-03, hiện ô khay cùng cỡ) trước khi ẩn số, không thì bài không giải được; thuộc Phase 5

- [ ] 015 (còn lại) — puzzle thoái hoá (2×2 hai ô trống cùng đáp án, đề không cần suy luận): đổi bộ sinh/fixture, thuộc Phase 4 "Generator 015"; thang hint L1–L3 theo Task #301; GT-015#1-2 vẫn trong sổ nợ web-gesture (chưa có cử chỉ nhấc ký hiệu ra)

- [ ] 021 (còn lại) — nửa phản chiếu dùng asset bất đối xứng thật (giày trái/phải, khủng long) và "Gương thần" hiện live: nội dung/asset, Phase 5; ánh sáng ô đối xứng lúc nhấc (N4) chưa có code

- [ ] 022 (còn lại) — cảnh có lớp che thật (vật nấp sau bụi, layering): hiện cảnh xếp lưới theo slot nên không vật nào đè vật nào; cần mô hình lớp + toạ độ tương đối trong stage, thuộc Phase 5; sân khấu rất chật (điện thoại ngang, level 12 vật) chưa có hàng ghim

- [ ] 023 (còn lại) — mảnh khác cỡ thật (người tuyết 3 cỡ: hiện 3 khối cùng asset nên thay nhau được hết) và bảng bóng hình Montessori: asset/nội dung, Phase 5; sân khấu rất chật vẫn lùi về lưới; legacy (không stage) vẫn lệch hệ toạ độ giữa neo và khay

- [ ] 026 (còn lại) — thang hạ độ khó chạy theo số lượt bỏ sót, chưa theo `hint_after_ms` (Task #301); đèn giao thông/mascot đứng hình (Phase 5); GT-026#0-2 đã gỡ khỏi sổ nợ web-gesture (solver nay biết chờ `update()`)

- [ ] 029 (còn lại) — chữ phụ "Đã bớt: n/m" ở caption, ô số ban đầu giữ nguyên và thẻ "bớt đi n" bằng hình (chữ phải đọc: Phase 4 "Gỡ chữ"); mèo ăn cá thật sự (Phase 5); lưới lẻ cột thì vật bớt chia hàng với nhóm nên không có dock riêng

## Phase 4 — Generator & difficulty
- [ ] Generator 006, 008, 011, 012, 015, 016; band khớp `age_min` (011, 015, 017)
- [ ] Nối/xoá trường difficulty chết theo spec sở hữu
- [ ] Gỡ chữ phải đọc khỏi UI trẻ (008, 009, 019, 023, 028, 029, 032, 035, 036)

## Phase 5 — Đặc sắc từng game
- [ ] Đợt demo: 001, 003, 020, 025, 026, 037
- [ ] Khác biệt hoá cặp trùng: 003↔004, 022/025/037, 028/029/031, 001/012/018
- [ ] Các game còn lại theo cột "Hướng đặc sắc" trong plan §1.3
- [ ] 030 (còn lại) — dải đo vẫn là lưới ô có thể xuống nhiều hàng ở khung hẹp, chưa phải một dải liền kéo tự do theo thước; `representation: number-rod` chưa hiện khe/chồng. Cần thiết kế lại zone-layout (Phase 5 "Dải kéo tự do có snap")
- [ ] 031 (còn lại) — mệnh giá phi thực tế ("3đ") và xu chỉ khác số: thuộc nội dung/Phase 4-5 (xu quả kích cỡ/màu theo giá trị, hạt Montessori); nhãn "Đã góp: x / y đ" vẫn là bản số trên canvas
- [ ] 032 (còn lại) — animation rót giữa hai cốc rồi mới hỏi, `L2` hiện số vạch và `L3` tách cột nước xếp cạnh nhau chưa có code (hint hiện chỉ vẽ vạch); cốc `fluted` vẫn vẽ như cốc thường
