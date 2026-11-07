# Đánh giá `packages/game-engine` + roadmap sửa (Task #313)

## Context

Người dùng yêu cầu đánh giá toàn bộ game-engine (~60K dòng, 38 template GT-000…037) cho trẻ mầm non 3–6 tuổi: UI/UX, logic, base chung, flow chung, rồi nét riêng/sáng tạo từng game. Đầu ra đã chốt: **báo cáo + roadmap sửa**, ý tưởng sáng tạo **được phép thêm asset/cơ chế mới**.

Phát hiện gốc rễ (đã tự kiểm chứng): web host chỉ phát 3 gesture `tap | drop | commit` (`apps/web/app/composables/play/use-play-gesture.ts:337,403,592,600`) — không có `stroke`, `adjust`, `flip_piece`, `tap_rest`. Mọi cơ chế dựa vào chúng chỉ "chạy" trong unit test → nhiều level production **không thể thắng**.

---

## Phần 1 — Báo cáo đánh giá

### 1.1 Base chung & flow chung

**Kiến trúc (giữ):** `usePlaySession` → `RoundRunner` (1 round = 1 session, telemetry, gate prompt) → `GameEngine` (rAF, input gate, `ScaffoldingSystem`, degradation) → template kế thừa `TemplateGameSession` (`setupEntities/computeSlots/validateAction/toAction/commit/getView`). Điểm mạnh: gate narration có cap 12s, timer gắn round token, feedback sai màu amber không trừng phạt, touch floor theo age band (96/76/64 CSS px), tôn trọng `prefers-reduced-motion`, offline buffer dedupe theo `seq`.

**Lỗi logic base (High → Low):**

| # | Mức | Vấn đề | Bằng chứng |
|---|---|---|---|
| B1 | High | Gesture thiếu `stroke/adjust/flip/rest` → GT-019 L3, GT-034 L3 không thắng được; GT-024 trace thành nối thẳng; GT-032 pour, GT-019 xoay theo ngón không chạy | `use-play-gesture.ts:590-607` |
| B2 | High | Fallback "không có giọng" set level 2 nhưng `tick` kế tiếp tính lại về 0; không set `engine.focusIndex` | `systems/scaffolding.ts:204-220`, `:143-162` |
| B3 | High | Chỉ validate content round 0; round sau lỗi trong timer 900ms → kẹt, không màn lỗi | `core.ts:275`, `generated/session-loader.ts:194`, `round-runner.ts:208` |
| B4 | High | Modal chiến thắng chờ upload + `/complete` → offline/mạng chậm: bảng đơ sau fanfare, tụt tier `nice_try` | `use-play-session.ts:315-354` |
| B5 | Med | Pause chỉ dừng vẽ: narration/TTS, `hintTimer`, timer 600/900/500ms vẫn chạy; `duration_ms` tính cả lúc pause (trái BR-HPL-07) | `core.ts:676`, `round-runner.ts:370,637` |
| B6 | Med | Không cooldown sau verdict → 2 tap sai nhanh = 2 miss, nhảy hint L1/L3 | `game-session.ts:451`, `scaffolding.ts:62` |
| B7 | Med | `prepareRound` round 0 chạy 2 lần | `core.ts:330-333` |
| B8 | Med | Scaffolding dùng `hint_after_ms` round 0 cho cả level; RoundRunner có timer hint thứ 2 chỉ log → `hint_count` sai | `core.ts:313`, `round-runner.ts:637-643` |
| B9 | Med | Drag slop 12px / tap 14px quá chặt cho 3 tuổi; tap rung thành drop bị nuốt | `use-play-gesture.ts:465,590` |
| B10 | Med | `allow_retry:false` → skip ngay cùng tick, không cho thấy đáp án, chime chồng feedback | `use-play-gesture.ts:287`, `use-play-session.ts:675` |
| B11 | Med | Skip round cuối để session đã destroy vẫn nhận tap | `round-runner.ts:401` |
| B12 | Low | Replay không `cleanupSession`; `seq` telemetry = index mảng (unshift làm lệch); 2 bảng touch floor lệch (64 vs 76); 2 cờ degradation không ai đọc | `[code].vue:643`, `use-play-telemetry.ts:174`, `interaction.ts:184` vs `layout/constants.ts:28` |

**Spec drift base:** hint L1/L2/L3 vẽ cùng một aura amber — không ghost hand, không đọc lại đề (spec §7.2) nhưng vẫn emit `demo_shown` (`core.ts:436,616-657`); skip sau 60s thay vì 3 chu kỳ L3; mascot `celebrate` không ai gọi; `hint-ladder.ts:19` chỉ biết GT-032 → đa số template hint L1 = chỉ thẳng đáp án.

**UI/UX base cho mầm non:**
- Sai không nói gì (`RETRY_ENCOURAGEMENTS` không dùng); tap vào nút commit disabled bị nuốt im lặng.
- Hint amber `#ffbf00` vs retry `#f59e0b` gần như trùng; amber trên trắng ~2:1.
- Input đóng tới 12s khi narration, trẻ tap không phản hồi âm thanh nào.
- Pill Montessori "(2/5)" là chữ, không narration; khen chiến thắng chỉ TTS (máy không có giọng Việt → im).
- Nút intro GT-000 64px < sàn 96px cho 3–4; tolerance hit-test cố định 24 logic px (~17 CSS px).

### 1.2 Pattern xuyên template

1. **Spec drift "control of error"**: spec bảo khám phá không chấm (000, 009, 011, 014, 015, 020, 022, 026, 029–031) → code chấm RETRY từng tap.
2. **Hint chỉ thẳng đáp án**, template kéo-thả chỉ trỏ item nguồn, không trỏ đích (004, 005, 007, 008, 014); hint GT-031 greedy dẫn ngõ cụt.
3. **Generator thoái hoá**: 006 thứ tự tuỳ ý, 008 nhãn "Ô 1/2/3", 011 đáp án luôn `b`, 015 mọi ô trống cùng ký hiệu, 016 set-mode đã giải sẵn, 012 vượt cap BR-E012-03; band generator lệch `age_min` (011, 015, 017).
4. **Shuffle không phải derangement** (`rng/shuffle.ts:6`) → 006/007/008/018 có thể bắt đầu đã đúng.
5. **Trường difficulty chết**: `shuffle_items`, `step`, `exact_change`, `gap_tolerance_pct`, `peek_all_initial_ms`, `show_target_counter`, `item_count`.
6. **Timer sai hand-written ~15 lần** (260/350/400ms), trộn 2 đồng hồ `update+=delta` vs `render=timeMs` (008–015). `themeId` bị rơi ở 012/014/016.
7. **Chữ phải đọc**: sub-prompt 028/029/035/036, nhãn 019 "90°", 023 "nhỏ/vừa/lớn", 032 "(4/8)", 008 nhãn ô, 009 manh mối chữ.
8. **Trùng lặp**: 001 ≈ 018-select ≈ 012; 003 = 004 một rổ; 022/025/037 đều "tap mục tiêu trên lưới"; 028/029/031 cùng tap-cộng-dồn; 006 vs 018-sequence ngược semantics commit.

### 1.3 Từng game — vấn đề chính + ý tưởng đặc sắc

Điểm: (logic / độ hợp mầm non, 1–5). 🔴 = nằm trong top cần sửa.

| GT | Tên | Điểm | Vấn đề chính | Hướng đặc sắc (asset/cơ chế mới OK) |
|---|---|---|---|---|
| 000 | Làm quen khái niệm 🔴 | 2/3 | Tap ở `present` nhảy bước; `recognise` sai hiện "wrong" (spec cấm); `link` sai im lặng; không gọi `winSession` | Bài học 3 giai đoạn Montessori với cô giáo-mascot: "Đây là… / Chỉ cho cô… / Cái gì đây?"; sai → mascot thì thầm tên lại; recall = "đồ vật trốn sau rèm" |
| 001 | Chọn một đáp án | 4/4 | Tap lại cùng ô sai không rung (`session.ts:154`) | "Đi chợ giúp Mèo": mẫu nằm trong bong bóng thoại, đúng → nhảy vào giỏ |
| 002 | Chọn nhiều đáp án | 3/3 | Hint trỏ nút Done khi đã chọn thừa; sai không chỉ ra món nào; tiêu chí trừu tượng "chủ đề X" | Lưới đánh cá: bấm kéo lưới, cá sai bơi ra; giỏ có số ô trống = số đáp án |
| 003 | Kéo vào đích | 4/4 | Ổn | Rổ có miệng "nhai" món đúng; chấm đếm trên rổ |
| 004 | Phân loại vào nhóm | 3/3 | Hint không trỏ rổ đích; feedback đặt sai chỗ | "Dọn nhà": đồ chơi→hộp, quần áo→tủ; khay phân loại kèm thẻ kiểm tra hình |
| 005 | Ghép cặp | 3/3 | Tap chỉ trái→phải; item giống hệt bị từ chối; generator chỉ "ảnh giống hệt" | Mẹ–con con vật, ghép tất trên dây phơi, âm thanh–hình; dây nối "tách" |
| 006 | Sắp xếp thứ tự 🔴 | 2/3 | Generator thứ tự vô nghĩa; có thể bắt đầu đã đúng; insert thay vì swap | Cuộn phim/truyện tranh tự "chạy" khi đúng; cây lớn dần từng thẻ |
| 007 | Tách gộp số 🔴 | 2/2 | Code là "chọn số còn thiếu", không phải thao tác vật thật như spec; không có "gộp" | "Chia kẹo cho hai bạn" kéo kẹo thật; khung 10 / thanh hạt Montessori; số tổng sáng khi đủ |
| 008 | Kéo vào ô chứa | 2/2 | Ô chỉ có chữ, mapping tuỳ ý → đoán mò | Bảng bóng hình (núm trụ Montessori), "đỗ xe vào chuồng đúng màu", ô "thở" khi lại gần |
| 009 | Loại trừ manh mối 🔴 | 2/2 | Engine tự loại trừ thay trẻ, không commit; manh mối chữ + số tới 14 | "Ai đang trốn?": manh mối bằng icon (có mũ, không đỏ), trẻ tự úp thẻ; mascot thám tử kính lúp |
| 010 | Thay thế biểu tượng 🔴 | 2/1 | Đại số 2 phương trình cho 4–5 tuổi; `pin_symbol` không với tới; frame 0 kẹt đỏ | Bảng giá chợ (🍎=2 xu) trả bằng xu; biểu thức biến thành đồ thật |
| 011 | Ma trận chọn hình | 3/3 | Không "đặt thử"; đáp án luôn `b`; chỉ Latin square | Luống hoa mỗi hàng/cột một loại; lựa chọn trượt vào ô để thử trước khi chốt |
| 012 | Nhìn chớp rồi nhớ | 3/2 | Tự đếm ngược (spec cấm); vượt cap số lượng; `flash_ms` cố định | Nghi thức "mở nắp chuông" do trẻ bấm; đáp bằng chấm/ngón tay; đom đóm nhấp nháy |
| 013 | Mê cung | 3/3 | Đụng tường xoá đường đã vẽ (spec cấm); mê cung ~50% tường, nhiều lối | Chuột tìm phô mai để lại dấu chân; nhặt sao dọc đường; "boing" + mascot nhún vai |
| 014 | Cân hai bên | 3/3 | Chấm sai khi quá nặng (spec: không đúng/sai); tự đẩy món về khay; in khối lượng → thành phép trừ | Ẩn khối lượng, đĩa cân lún kèm tiếng kẽo kẹt; bập bênh bạn thú |
| 015 | Lưới không lặp 🔴 | 2/2 | Puzzle thoái hoá; verdict mâu thuẫn validate/commit; hint ngõ cụt khi đầy | "Xếp chỗ ngồi" thú không trùng hàng; hàng/cột sáng khi xong; khay gạch màu |
| 016 | Xoay kim đồng hồ | 2/2 | Set-mode giải sẵn; match-mode có thể vô nghiệm; nhãn số "7:30" | Vòng sinh hoạt ngày (7 giờ ăn sáng 🍳), mặt trời/mặt trăng, kim "tích tắc" khi kéo |
| 017 | Xếp khối phối cảnh | 3/2 | Trẻ không hề xếp khối; không validate đáp án = số khối | Xếp lại mô hình trên lưới; mỗi tầng một màu; chạm khối "bụp" đếm có tiếng |
| 018 | Nghe rồi làm 🔴 | 2/2 | Có thể vô nghiệm; sequence tự thắng không submit; caption lộ đáp án; phụ thuộc TTS | "Thỏ bảo…" (Simon says); máy hát mascot nhảy; nhận âm thanh con vật; dải icon khi tắt tiếng |
| 019 | Xoay và lật mảnh 🔴 | 2/2 | Flip không với tới → L3 không thắng; hình đối xứng xoay góc khác bị chấm sai; nhãn "90°" | "Đèn pin chiếu bóng": khớp bóng; núm xoay trên mảnh; đích chỉ là viền ma |
| 020 | Lật thẻ tìm cặp | 3/3 | Lật sai tính RETRY (spec: không phải lỗi); `peek_all_initial_ms` chết; 6 cặp cho 3 tuổi | Cap 3 cặp cho 3–4; thẻ tiếng kêu con vật; mascot "nhớ hộ" 1 thẻ làm hint |
| 021 | Hoàn thiện đối xứng | 2/3 | Không vẽ lật gương → chỉ là copy emoji | "Gương thần" hiện nửa đối xứng live; asset bất đối xứng (giày trái/phải, khủng long) |
| 022 | Tìm vật thể ẩn | 2/3 | Stage layout ghi đè toạ độ → không gì bị che; không có ảnh mục tiêu ghim | Vật nấp sau bụi (layering), kính lúp, mascot tìm đồ chơi lạc |
| 023 | Lắp ghép hình thể | 2/2 | Mảnh giống hệt bị gắn cứng anchor; stage biến anchor thành lưới, mất hình nhà/xe; lệch hệ toạ độ | Bảng bóng hình kiểu puzzle Montessori; người tuyết 3 cỡ thật; "click" khi khớp |
| 024 | Vẽ theo nét 🔴 | 1/2 | Không có `stroke` → nối thẳng, mỗi cử chỉ 1 điểm; không kiểm đường đi | Dùng `trailPoints` sẵn có làm stroke; "dẫn kiến về tổ"; texture khay cát (chữ nhám) |
| 025 | Tìm điểm khác biệt | 4/4 | Chỉ khác emoji | Thêm khác màu/cỡ/thiếu vật; khoanh tròn chỗ chạm; huy hiệu "thám tử nhí" |
| 026 | Chỉ chạm khi đúng dấu | 3/3 | Lỡ "go" bị RETRY; untimed: tap ra ngoài = "nhịn"; chưa có nhánh hạ về untimed | "Đèn giao thông"/"Thỏ ơi chạy đi"; mascot đứng hình khi nhịn đúng |
| 027 | Đổi luật giữa chừng | 2/2 | Tap lại item đúng vẫn tính; 🌟 gắn "blue"; không item thoả cả 2 luật → không test switch | Thẻ luật bằng hình lật kèm tiếng còi; định dạng DCCS 2 hộp |
| 028 | Chạm đếm tích luỹ | 3/2 | `step` chết; tally chỉ vẽ khi không stage; đếm 10 tới 50 cho 4 tuổi | Tất theo đôi (2), bàn tay (5), bó que tính (10); ếch nhảy trên tia số |
| 029 | Bớt khỏi nhóm | 3/3 | Item bớt vẫn nằm tại chỗ kèm chữ "Đã bớt" | Mèo ăn cá thật sự, nhóm còn lại co nhỏ thấy được |
| 030 | Đo bằng đơn vị | 2/3 | Vẽ sẵn đúng số ô = lộ đáp án; tự snap nên không có khe/chồng | Dải kéo tự do có snap; đo cá sấu bằng kẹp giấy / bước chân |
| 031 | Gộp tiền xu 🔴 | 2/2 | Hint greedy dẫn ngõ cụt (`session.ts:106`); xu giống hệt chỉ khác số; không commit "trả tiền"; tiền "3đ" phi thực tế | "Xu quả" kích cỡ/màu theo giá trị (hạt Montessori: 1 hạt, thanh 5); chợ quê, heo đất |
| 032 | So lượng chất lỏng 🔴 | 2/2 | Diện tích nước 2D lệch ~16% cho "bằng nhau"; nhãn "(4/8)" lộ đáp án; spam tap thắng pour; bẫy bảo toàn trái Piaget ở 5 tuổi | Animation rót giữa 2 cốc rồi mới hỏi; "rót nước cho voi uống" |
| 033 | Dệt hoa văn lưới | 3/2 | Đặt hợp lệ cục bộ bị tô đỏ cả hàng+cột; 5×5 4 màu quá khó | Bắt đầu 2×3 hai màu; dệt khăn thổ cẩm, animation kéo sợi |
| 034 | Gõ theo nhịp 🔴 | 1/3 | Không gesture `tap_rest` → L3 không thắng; **không chấm timing** (`beat-system.ts:113` không ai gọi); replay limit | Pad "nghỉ" (tay đặt môi); chấm theo phách với bóng nảy; trống cơm/phách/mõ |
| 035 | Xếp hàng lệnh | 3/2 | Không chạy từng bước (`isExecuting` không bao giờ true); sai thì về đầu, xoá lệnh cuối im lặng; level có thể vô nghiệm theo `max_commands` | Robot kiểu Bee-Bot đi từng bước "bíp"; mũi tên tuyệt đối ↑→↓← cho 5 tuổi |
| 036 | Tự tạo quy luật | 3/3 | "AAAA" vẫn thắng; overlay in ID thô "[red - blue]"; sáng tạo tự do bị RETRY | Bắt ≥2 loại; mascot hát quy luật thành bài; giao diện xâu hạt |
| 037 | Tìm hết ký hiệu | 4/3 | `computeSlots` đổi band → reset `foundTargets` giữa round; 30 item quá dày cho 4 tuổi | "Nhặt sao rơi", lọ tiến độ đầy dần |

**Top cần sửa trước:** 034, 024, 019 (không thắng được/cơ chế tắt), 031, 032, 009, 007, 015, 018, 010, 000.

---

## Phần 2 — Roadmap sửa

Quy trình mỗi task: đọc spec engine `docs/specs/01-platform/engines/GT-0xx.md` → nếu đổi hành vi spec đã chốt thì sửa spec trước → TDD (test đỏ trước) → `rtk proxy pnpm check` → commit thẳng `main`. Ghi `docs/tasks/313-game-engine-preschool-plan.md` + `313-game-engine-preschool-todo.md` (thư mục `docs/tasks/` chưa tồn tại, tạo mới).

### Phase 0 — Chặn level không thắng được (High, nhỏ)
- Thêm gesture còn thiếu ở web: `stroke` (dựng từ `trailPoints` sẵn có trong `use-play-gesture.ts`), `adjust` (kéo xoay/kéo mức), nút `flip` và pad `rest` qua tap vào entity chuyên dụng. Tái dùng kiểu `GameAction` ở `src/game-session.ts:34`.
- Test gate mới `packages/game-engine/tests/gates/`: mọi fixture level phải giải được **chỉ bằng gesture web phát ra** (dùng `toAction` thật), kèm ca âm fixture vi phạm trong `tests/**/fixtures/`.
- Sửa ngay: GT-031 hint (thay greedy bằng subset-sum nhỏ), GT-018 refine "đúng 1 đáp án", GT-016 `initial_time ≠ target` + match-mode phải có nghiệm, GT-035 kiểm nghiệm theo `max_commands`.

### Phase 1 — Base flow (High/Med)
- B2 fallback giữ hint level + set `focusIndex` (`scaffolding.ts`).
- B3 validate content mọi round lúc load; lỗi factory → màn lỗi (`core.ts`, `round-runner.ts`).
- B4 hiện modal chiến thắng ngay, tier/sao fetch nền, không tụt `nice_try` vì mạng (`use-play-session.ts`).
- B5 pause dừng narration + mọi timer, emit `game_resumed`, `duration_ms` trừ thời gian pause.
- B6 cooldown ~400ms sau verdict trong `TemplateGameSession.dispatch`.
- B8 một đồng hồ hint duy nhất, `hint_after_ms` theo round; bỏ timer trùng ở RoundRunner.
- B9 slop drag theo age band (20–30 CSS px cho 3–4), drop cực ngắn = tap; whoosh khi spring-back.
- B7, B10, B11, B12 dọn dẹp.

### Phase 2 — Hệ hint/feedback thống nhất
- Hint ladder chung: L1 = rung nhẹ vùng đúng/đích, L2 = ghost hand (kéo item → đích), L3 = đọc lại đề + demo; `demo_shown` chỉ khi vẽ thật. Mở rộng `systems/hint-ladder.ts` thay vì chỉ GT-032; API `getHintTargetForLevel` trả cả nguồn + đích.
- Helper `WrongFlash` dùng chung (1 clock, 1 thời lượng) thay ~15 bản tự viết.
- Retry nói câu khích lệ xoay vòng (`RETRY_ENCOURAGEMENTS`) + mp3 fallback; narration pill Montessori; tách màu hint vs retry, tăng tương phản.
- Helper `deriveDerangement` trong `src/rng/` cho shuffle không bắt đầu đã đúng.

### Phase 3 — Sửa spec drift theo nhóm "control of error"
Mỗi game một task nhỏ, spec trước: 000, 009 (trẻ tự loại trừ + commit), 014 (bỏ đúng/sai), 015, 020, 022, 026, 029–031 (commit "trả tiền"), 007 (thao tác vật thật), 010 (bảng tra), 012 (nút bắt đầu, cap số lượng), 013, 021 (lật gương thật), 023 (mảnh giống nhau hoán đổi được), 030, 032 (công bằng thể tích, bỏ nhãn), 034 (chấm timing qua `getTimingToleranceMs`), 035 (chạy từng bước), 036, 037.

### Phase 4 — Generator & difficulty
- Sửa generator thoái hoá: 006, 008, 011, 015, 016, 012; khớp band với `age_min`.
- Nối hoặc xoá trường difficulty chết (theo spec sở hữu, không tự xoá field spec đã chốt).
- Gỡ chữ phải đọc khỏi UI trẻ (019, 023, 028, 029, 032, 035, 036, 008, 009) → icon/âm thanh.

### Phase 5 — Đặc sắc từng game (asset/cơ chế mới)
Dùng cột "Hướng đặc sắc" bảng 1.3. Mỗi game: 1 khung chuyện + 1 phản hồi vật lý/âm thanh đặc trưng + 1 phản ứng mascot. Ưu tiên game đã ổn logic (001, 003, 025, 037, 020, 026) để có demo sớm. Ghi spec outcome trong `docs/specs/01-platform/engines/GT-0xx.md` trước, asset theo `docs/design-system/`. Gộp/khác biệt hoá cặp trùng: 003↔004, 022/025/037, 028/029/031, 001/012/018.

---

## Xác minh

- Mỗi task: test đỏ trước rồi xanh; chụp danh sách `trạng-thái | tên-test` trước/sau khi refactor phải trùng khít ngoài test mới.
- Cổng: `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, `rtk proxy pnpm check:engine-specs`, `check:engine-turn`, `check:engine-behavior`, `check:hint-target`, `check:test-ratchet`, cuối cùng `rtk proxy pnpm check` (đọc exit code).
- Gate mới Phase 0: chạy mọi fixture qua gesture web → 0 level không thắng.
- Kiểm thử tay trên trình duyệt (`run` skill / chrome-devtools) cho 034, 024, 019, 031, 032 ở viewport điện thoại portrait-gate + tablet, age band 3–4.
