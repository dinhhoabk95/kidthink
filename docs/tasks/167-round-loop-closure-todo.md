# Todo — Task #167: Đóng mạch vòng chơi, chuỗi câu hỏi là đường duy nhất

> Lý do và work package: [`167-round-loop-closure-plan.md`](167-round-loop-closure-plan.md).
> Không bị task nào chặn. Là nợ thi công của [`Task #100`](100-round-sequence-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`
> (node trên PATH mặc định là v20.17.0, repo cần từ v24).

## Preflight

- [ ] Đọc [`round-set-model.md`](../specs/05-content/round-set-model.md) §6, §7, §11.
- [ ] Đọc [`round-sequence-play.md`](../specs/04-play/round-sequence-play.md) §4, §5, §6.
- [ ] Chụp snapshot `trạng-thái | tên-test` của 27 khuôn **trước** khi chạm play surface.
- [ ] Đếm baseline `pnpm test` và `pnpm typecheck` để so delta sau.
- [ ] Đo lại sáu số ở mục 2.1 của plan — đừng tin bản ghi cũ, kể cả bản ghi này.

## WP167.0 — Trần vòng 10, trần payload siết sang delivery

- [x] Ca âm trước: ba test `accepts` đỏ ở trần cũ (`6/8/10` vòng), ba test `rejects` xanh ở cả trần cũ và mới. Chỉ **cặp kề nhau** mới chứng minh cổng bám đúng con số.
- [x] `MAX_ROUNDS_BY_BAND` ([`round-set-validation.ts`](../../packages/shared/src/round-set-validation.ts)) sang `{3-4: 6, 4-5: 8, 5-6: 10}`.
- [x] Test: band 3–4 xanh ở 6 đỏ ở 7; band 4–5 xanh ở 8 đỏ ở 9; band 5–6 xanh ở 10 đỏ ở 11. Thêm test thông báo vi phạm phải nêu band và trần đã ép.
- [x] Sửa bảng mục 7.1 [`round-set-model.md`](../specs/05-content/round-set-model.md) cho khớp, ghi trần cũ để đọc lại được.
- [x] Ghi `D-167A` thành câu hỏi 5 mục 11 của spec kèm ngày, chủ quyết, bốn số đo hậu thuẫn. Câu hỏi 3 (trần band 3–4 chưa đo với trẻ) **vẫn mở** — `D-167A` nâng bằng lập luận thời lượng, không bằng dữ liệu quan sát.
- [x] `measureRoundSetPayloadBytes` export từ `@mindkid/shared`, dùng chung cho cả `BR-RSM-10` lúc duyệt và `BR-CFG-08` lúc giao.
- [x] Guard `assertPayloadWithinCap` ở [`game-config-runtime.ts`](../../apps/web/server/utils/game-config-runtime.ts), trả `422 PAYLOAD_TOO_LARGE` kèm `measured_bytes` và `limit_bytes`.
- [x] Đặt guard **trước** `createPlaySessionRecord` — chặn sau khi tạo phiên để lại hàng `in_progress` không ai đóng được, đúng loại rác task này đang dọn.
- [x] Ca âm: level payload vượt trần bị chặn, và **không** tạo `play_session`. Trước khi sửa cả hai test đỏ với `promise resolved instead of rejecting`.
- [x] Cập nhật `BR-RSM-10` trong spec: trần đo ở **hai** chỗ, kèm lý do một chỗ là không đủ.
- [x] `pnpm vitest run packages/shared` xanh 449/449; `game-config-delivery.test.ts` xanh 19/19.
- [x] `biome check` exit 0; `tsc --noEmit` gốc exit 0; `vue-tsc -b` của web exit 0.

### Ghi chú sửa plan sau khi đo lại

- Ô "một vòng không parse được trả `422 CONTENT_PACK_INVALID` kèm `round_index`" mà [`100-round-sequence-todo.md`](100-round-sequence-todo.md) để mở **đã có** ở delivery (`validateLevelAndRounds`, `game-config-runtime.ts`). Chỗ còn thiếu là đường **publish**, thuộc WP167.5. Mục 2.2 số đo 15 của plan nói "chưa cài" — sai, đã sửa lại.
- Test `BR-CFG-08` cũ (`game-config-delivery.test.ts`) đo chính fixture nhỏ của nó nên không bao giờ đỏ được dù server không đo gì. Giữ lại làm test hồi quy, nhưng ca âm thật nằm ở khối `WP167.0` mới.

## WP167.1 — rounds[] Cấm — NEVER rỗng

- [x] Ca âm trước: hai test đỏ với `expected [] to have a length of 1` và `expected 'attempts' to be 'rounds'`.
- [x] Helper dùng chung [`round-set-runtime.ts`](../../apps/web/server/utils/round-set-runtime.ts): `loadRoundSet` cộng hằng `RUNTIME_SCORING_MODE`. Gộp bản sao y ở cả hai file, xoá luôn import `gameLevelRounds` và `asc` không còn dùng.
- [x] Rỗng thì dựng một vòng từ `content_pack`, `difficulty_params`, `instruction`, `instructionAudioPath`, `difficulty` của level với `round_index = 0` (`BR-RSM-09`).
- [x] `scoring.mode` thành `rounds` luôn ở **cả hai** file.
- [x] Thêm bốn cột vào select của endpoint chi tiết game — nó thiếu `contentPack`, `difficultyParams`, `instruction`, `instructionAudioPath` nên không dựng được vòng mặc định. Không sửa thì `/games/[code]` hiện 0 vòng còn `/play/[code]` hiện 1.
- [x] Test: `rounds.length === 1`, `content_pack`/`difficulty_params`/`instruction` trùng khít level.
- [x] Test: level có 3 hàng vòng thì trả đúng 3, `round_index` là `[0,1,2]`, không thêm vòng dựng.
- [x] `game-config-delivery.test.ts` 22/22 xanh; `guest-level-detail-cta.test.ts` gộp lại 28/28 xanh.
- [x] `biome check` 6 file exit 0. Cổng bậc thang `typecheck-gate.ts`: web:app/server/shared/node đều **0 lỗi, baseline 0**.

### Sửa hai chỗ đi lệch contract khi làm WP167.1

- `PAYLOAD_TOO_LARGE` **đã có** trong `packages/auth/src/errors.ts` là **413**, và mục 7 [`error-codes.md`](../specs/00-foundation/error-codes.md) để cột "Khi nào" **rỗng** vì nó là mã chung. Bản nháp đầu tôi ném `createError` với 422 — sai cả status lẫn cách ném. Đã đổi sang `appError("PAYLOAD_TOO_LARGE", …)` theo luật "route chỉ ném mã" của [`CLAUDE.md`](../../CLAUDE.md).
- Message của mã đó là *"Dữ liệu sự kiện vượt quá giới hạn."* — chỉ đúng cho một trong sáu chỗ đang ném nó (hai guard body, upload ảnh, ảnh chứng từ, lô event, và trần config mới). Sửa thành *"Dữ liệu vượt quá giới hạn cho phép."*; không test nào assert chuỗi cũ.

## Chặn ngoài phạm vi — đo được 2026-08-31, KHÔNG sửa trong task này

1. **Role `mindkid_app` không tồn tại trong container dev.** `docker exec mindkid-db-1 psql -U postgres -d mindkid -tAc "select rolname from pg_roles..."` trả **đúng một** role: `postgres`. Và **không file nào trong repo tạo role đó** — grep `mindkid_app` toàn repo chỉ hit [`packages/db/src/client.ts`](../../packages/db/src/client.ts), không có migration, script, hay file infra nào `CREATE ROLE`.

   Hệ quả: **mọi test dùng `getAppDb()` chết ngay ở kết nối** với `FATAL: role "mindkid_app" does not exist`. Đó là toàn bộ đợt đỏ hàng loạt khi chạy `pnpm test`: login, xác thực email, mass-assignment, ownership, lesson session runner, exemplar set. Không liên quan Task #167 — nhưng nó làm `pnpm test` **không dùng được làm cổng** ở máy dev, nên đừng đọc "test đỏ" ở đây là hồi quy.

2. **10 lỗi typecheck mới ở project `root`** đến từ [`packages/db/tests/integration/seed-accounts.test.ts`](../../packages/db/tests/integration/seed-accounts.test.ts) — file **untracked** (`??`), việc dở của người khác, toàn bộ là `TS18048` `'record' is possibly 'undefined'`. Chín project còn lại 0 lỗi trên baseline 0.

3. **`validateRoundEvents`** ([`round-event-gate.ts`](../../packages/shared/src/round-event-gate.ts)) — cổng chống hồi quy của WP100.7 — cũng **không có caller production**, chỉ test gọi. Chỗ đúng của nó là `complete.post.ts`, thuộc WP167.3. Đây là mảnh chết thứ tư của Task #100, cùng loại với ba mảnh ở mục 2.2 của plan.

4. **Bốn test `packages/db` đỏ vì trigger, không vì task này.** `curriculum.test.ts`, `lifecycle-service.test.ts` (2 ca), `worksheet-lifecycle.test.ts` chết ở `PostgresError: BR-SCT-05: Cannot update published content`, do trigger `prevent_published_update()` chặn chính lệnh archive mà dịch vụ lifecycle phát ra. Diff của Task #167 trong `play-session.ts` chỉ đổi object trả về và một dòng import — không thể gây ra lỗi trigger trên `game_levels`. Còn lại **900/904** xanh.

### Đếm mảnh chết của Task #100

Bảy mảnh, không phải ba. Cả bảy đều có mã và test, đều **không có đường chạy thật**:

| # | Mảnh | Trạng thái sau Task #167 |
|---|---|---|
| 1 | `game_level_rounds` không có writer | Vá tạm ở delivery (WP167.1); writer thật ở WP167.6 |
| 2 | `RoundRunner` không bao giờ được dựng | **Đã nối** (WP167.2) |
| 3 | 13 rule `BR-RSM-*` tự tắt ở publish | Còn nợ — WP167.5 |
| 4 | `validateRoundEvents` không có caller | Còn nợ, cần quyết định |
| 5 | `formatKidSurfaceResponse` không có caller | **Đã nối** (WP167.3) |
| 6 | `completePlaySession` trả `stars: null` | **Đã sửa** (WP167.3) |
| 7 | `KidVictoryModal` bỏ qua prop `stars` | Còn nợ, đổi thứ người dùng thấy |

## WP167.2 — Một đường chạy

- [x] Xoá `startSingleRound` và nhánh `rounds.length > 1` ở [`play/[code].vue`](../../apps/web/app/pages/play/[code].vue). `startMultiRound` đổi tên thành `startRounds` — nó là đường duy nhất.
- [x] `settleRoundIfWon()` gọi sau `dispatchSlotAction` trong `handlePointerDown` → `roundRunner.completeCurrentRound()`. Đây là mảnh còn thiếu: hàm đó **chưa từng được gọi** ở bất kỳ đâu trong `apps/web`.
- [x] **Chọn chỗ dò bằng số đo, không bằng cảm giác.** Cả **31** lời gọi `winSession()` trong 27 template đều nằm trong một hàm hành động (`selectOption`, `onTapCard`, `onSubmitSequence`, `placeItem`, …); **0** cái nằm trong `update()`. Nên dò sau hành động là tất định và đủ, và **không phải sửa `GameEngine`** — giữ nguyên `BR-RSP-03`.
- [x] `onRoundCompleted` hết là stub rỗng: gọi `engine.scaffolding.resetOnSuccess()` (`BR-RSP-08`).
- [x] Ăn mừng lớn vẫn chỉ ở `onAllRoundsCompleted` (`BR-RSP-09`); chỉ báo tiến độ cập nhật ở `onRoundStarted`.
- [x] `rounds` rỗng ở client thì **ném lỗi đọc được**, không im lặng dựng vòng — delivery đã bảo đảm không rỗng, nên rỗng ở đây là payload sai hợp đồng.
- [x] `handleReplayGame` đi cùng một đường, phiên mới từ vòng 0 (`BR-RSP-07`).
- [x] Đổi tên `roundsCorrect` → `roundsCompleted` ([`round-runner.ts`](../../packages/game-engine/src/round-runner.ts)) kèm doc nói rõ Cấm — NEVER gửi nó lên server và Cấm — NEVER dùng làm `rounds_correct` của mục 7.1 scoring.
- [x] Hai test mới ở `round-runner.test.ts` cho đúng cơ chế `settleRoundIfWon` dựa vào, mỗi test có **ca âm** `isCurrentRoundWon() === false` trước hành động: set 3 vòng đi hết `[0,1,2]` và gọi `onAllRoundsCompleted` đúng **một** lần; set một vòng đi qua cùng đường và phát cả `round_started` lẫn `round_completed`.
- [x] `packages/game-engine` 733/733 xanh; gộp với `packages/shared` là **1.184/1.184**.
- [x] `biome check` 153 file exit 0; cổng bậc thang web 4/4 project **0 lỗi**.

### Hai chỗ suýt thành no-op im lặng

- `ScaffoldingSystem` **không có** `reset()`; tên thật là `resetOnSuccess()`. Bản nháp đầu tôi viết `engine?.scaffolding?.reset?.()` — optional call nên nó sẽ **im lặng không làm gì** và không cổng nào bắt được.
- Bản nháp đầu còn gán lại `engine.activeSession` sau `completeCurrentRound()`. Dư: `startRound()` gọi `onRoundStarted`, và callback đó đã gán. Đã bỏ.

## WP167.3 — Nối event và complete · **XONG MỘT PHẦN**

- [x] `uploadTelemetry()` đẩy `getAllTelemetry()` lên `POST {guest,users}/play-sessions/[uuid]/events`, chia lô 100 theo `.max(100)` của `EventsSchema`, `seq` đánh từ 1 và tăng dần.
- [x] `finishSession()` gọi `POST …/complete`, nhận `stars`, đổ vào `earnedStars`.
- [x] Client chỉ gửi **chuỗi event**, Cấm — NEVER gửi `roundsCompleted` hay kết quả vòng nào (`BR-RSP-12`).
- [x] Lỗi mạng không chặn ăn mừng của trẻ, nhưng **kêu ở `console.error`** — không nuốt im lặng.
- [x] **Kiểm trước khi gửi thô, không đoán:** cả **37** tên event mà 27 template phát ra đều nằm trong `ALLOWED_EVENT_NAMES` (55 tên) — 0 tên ngoài whitelist. `cleanEventPayload` **lược** field lạ chứ không lỗi. Nên gửi thô an toàn, và **không** cần lọc phía client (lọc phía client chính là chỗ event thật bị rơi im lặng).
- [x] Sửa response của `completePlaySession` cho khớp mục 8 [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md): trả `stars` và `celebration`, bỏ hai khoá `score`/`normalized_score` mà spec **cấm** đưa xuống bề mặt trẻ. Dùng lại `formatKidSurfaceResponse` đã có sẵn thay vì chép logic.
- [x] Ca âm: test cũ assert `expect(res.stars).toBeNull()` — nó **khoá chính lỗi**. Đổi thành `stars === 1` cộng `celebration === "nice_try"` cộng hai assert `not.toHaveProperty`. Đỏ trước khi sửa với `expected null to be 1`.
- [x] `session-complete` + `game-config-delivery` + `guest-level-detail-cta` gộp 31/31 xanh; `shared` + `game-engine` 1.184/1.184; cổng bậc thang web 4/4 project 0 lỗi.

### CHẶN — "sao thật" chưa đạt được, và lý do đo được

- [ ] **CHECKPOINT A** — chưa chạy được đúng nghĩa. Phiên đóng được, event lên được, nhưng **mọi trẻ sẽ nhận đúng 1 sao mãi mãi.**

Hai lỗ, cả hai nằm ngoài phần mã của WP167.3:

1. **Ba tín hiệu mà điểm dựa vào chưa bao giờ được phát.** `answer_selected`, `answer_correct`, `answer_incorrect` **không xuất hiện một lần nào** trong `packages/game-engine/src` (grep toàn thư mục, không có emitter động nào). Nhưng mục 7.1 `scoring-and-result.md` dựng `attempt_count` từ `answer_selected`, và `evaluateRoundsCorrect` ([`scoring.ts`](../../packages/shared/src/scoring.ts)) đếm vòng có **lần thử đầu** là `answer_correct`. Nên:

   `rounds_correct = 0` · `attempt_count = 0` · `accuracy = 0` · `first_try_ratio = 0` · `normalized_score = 0` → **1 sao, cho mọi trẻ, mọi engine, mọi lần chơi.**

   Nguyên nhân sâu hơn: 27 template không nhận input qua `validateAction(GameAction)` — trang gọi thẳng phương thức riêng của từng khuôn (`selectValue`, `flipCard`, `tapObject`, `onSubmitSequence`, …), và chính các phương thức đó `recordEvent` bằng **từ vựng riêng của khuôn** (`option_selected`, `item_placed`, `pair_matched`, …). Hợp đồng input và từ vựng event của engine là phạm vi của [`Task #166`](166-engine-play-behavior-bdd-plan.md) (`status: planned`, sở hữu `engine-play-language.md` và `engine-input-contract.md`) — **không** kéo vào task này.

   Cấm — NEVER vá bằng cách phát `answer_incorrect` từ trang mỗi khi chạm mà chưa thắng: với khuôn nhiều bước, đặt đúng mảnh thứ nhất trong ba mảnh **không phải** một câu trả lời sai. Bịa event còn tệ hơn thiếu event.

2. **`KidVictoryModal` bỏ qua chính prop của nó.** [`victory-modal.vue`](../../apps/web/app/components/kid/victory-modal.vue) khai `stars?: number` ở dòng 69 rồi hardcode **ba** ⭐ cộng dòng chữ "+100 Điểm Tư Duy". Trang giờ đã truyền `:stars="earnedStars"`, nhưng modal chưa vẽ theo nó. Nối vào là việc nhỏ, **nhưng nó đổi thứ người dùng thấy**: từ ba sao trang trí sang một sao thật. Đó là quyết định sản phẩm, không phải quyết định của tôi.

- [ ] `validateRoundEvents` ([`round-event-gate.ts`](../../packages/shared/src/round-event-gate.ts)) vẫn chưa nối vào `complete.post.ts`. Nối nó bây giờ sẽ **chặn** phiên hoàn tất không có `round_started`, mà `session-complete.test.ts` hiện có một ca hoàn tất phiên **không có event nào** và mong nó thành công. Hai thứ đó xung đột — cần một quyết định, không phải một dòng mã.

## WP167.4 — Vá link bước chơi của tiết học

- [ ] Ca âm trước: test khẳng định link mang mã `ACT-` — phải đỏ sau khi sửa.
- [ ] Giải `activities.refId` sang `game_levels.code` trong [`lesson-session-runner.ts`](../../packages/db/src/services/lesson-session-runner.ts) quanh dòng 311.
- [ ] [`run.vue:226`](../../apps/web/app/pages/lessons/[code]/run.vue) link tới `/play/<GL-…>`.
- [ ] Test: bước `digital_game` của một tiết mở đúng màn chơi mà activity trỏ tới.
- [ ] Xử lý ca `refId` không giải được: hiện lý do đọc được, Cấm — NEVER link chết im lặng.

## WP167.5 — Nối 13 rule vào đường publish thật

- [ ] Ca âm trước: test **qua publish-checklist** khẳng định round set vi phạm `BR-RSM-05` vẫn qua được — phải đỏ sau khi sửa.
- [ ] `submit.post.ts:51-61` truyền `rounds` vào `entity`.
- [ ] `content-lifecycle.ts:189-231` thêm nhánh `extraData` cho `game_level`.
- [ ] `checkRoundSetRules` ([`publish-checklist.ts:512-515`](../../packages/shared/src/publish-checklist.ts)) hết tự tắt.
- [ ] 13 test đi **qua publish-checklist**, mỗi rule một ca âm. Vá lỗ ở số đo 11 của plan.
- [ ] Một vòng không parse được trả `422 CONTENT_PACK_INVALID` kèm `round_index` — ô còn nợ của Task #100.

## WP167.6 — ContentSeed.rounds và seeder

- [ ] `ContentSeedRound` mới trong [`types.ts`](../../packages/db/src/seed-content/types.ts): `instruction`, `instruction_audio_path?`, `content_pack`, `difficulty_params`, `difficulty`.
- [ ] `ContentSeed` thêm `rounds?: ContentSeedRound[]`, optional.
- [ ] [`service.ts:137`](../../packages/db/src/seed-content/service.ts) insert `gameLevelRounds` sau `gameLevels`.
- [ ] Vắng `rounds` thì ghi đúng một hàng `round_index = 0` từ `content_pack` của header (`BR-RSM-09`).
- [ ] Test: 239 level seed hiện có ra kết quả y hệt trước khi sửa.
- [ ] Test: seed có `rounds` bốn phần tử tạo đúng bốn hàng, `round_index` liên tục từ 0.
- [ ] `pnpm --filter @mindkid/db test` xanh.

## WP167.7 — Generator nhận trục độ khó

- [ ] `GeneratorInput` ([`generators/types.ts`](../../packages/game-engine/src/generators/types.ts)) thêm `escalation_step?: number`, mặc định 0 giữ hành vi cũ.
- [ ] 19 generator honour `escalation_step` theo **đúng một** chiều ở mục 7.3 [`round-set-model.md`](../specs/05-content/round-set-model.md).
- [ ] Cấm — NEVER vượt trần item của band ở mục 7.1 [`game-level-model.md`](../specs/05-content/game-level-model.md): band 3–4 tối đa 4 item và 1 nhiễu.
- [ ] Test: `escalation_step = 0` cho đầu ra **y hệt** trước khi sửa, từng generator.
- [ ] [`gen-levels.ts:150`](../../packages/db/src/seed-content/cli/gen-levels.ts) nhận `--rounds=n` và xuất `rounds[]`.
- [ ] Test: set bốn vòng `GT-001` band 3–4 qua `validateRoundSet`, vòng 0 dễ nhất, mỗi bước leo đúng một chiều.

## WP167.8 — Lô round set đầu, cổng, đóng spec

- [ ] Đo phân bố sao **trước** lô: bao nhiêu phần trăm một sao, hai sao, ba sao. In ra số.
- [ ] Soạn lô round set bốn vòng cho engine đã chọn (`Q5`).
- [ ] Cổng `check:round-sets` trong `seed-content/gates/` ép `BR-RSM-*` trên corpus.
- [ ] Ca âm cổng: một set leo hai chiều cùng lúc phải làm cổng đỏ.
- [ ] Thêm script `check:round-sets` vào [`packages/db/package.json`](../../packages/db/package.json).
- [ ] Đo phân bố sao **sau** lô. So với số trước. Ghi cả hai vào PR.
- [ ] Ghi mục nợ thi công vào [`round-set-model.md`](../specs/05-content/round-set-model.md) và [`round-sequence-play.md`](../specs/04-play/round-sequence-play.md), giữ `status: implemented` (`Q2`).
- [ ] Tick ba ô còn nợ của [`100-round-sequence-todo.md`](100-round-sequence-todo.md), hoặc ghi lý do vẫn để mở.

## Câu hỏi còn mở

- [ ] `Q4` — `D-167A` áp thang `6/8/10` hay phẳng `10/10/10`? Đang thi công theo thang. Một dòng đổi ở `MAX_ROUNDS_BY_BAND`.
- [ ] `Q5` — số vòng mặc định khi soạn lô đầu. Đang lấy 4.

## Verification cuối

- [ ] `pnpm lint` xanh.
- [ ] `pnpm typecheck` không tăng so baseline preflight.
- [ ] `pnpm test` không tăng so baseline preflight.
- [ ] `pnpm --filter @mindkid/db check:engine-depth` xanh.
- [ ] `pnpm --filter @mindkid/db check:lesson-supply` xanh.
- [ ] `pnpm --filter @mindkid/db check:round-sets` xanh, và có ca âm.
- [ ] Chơi thật một level một vòng và một level bốn vòng; cả hai ra sao.
- [ ] `psql`: không phiên nào của lượt chơi thử bị bỏ lại `in_progress`.
