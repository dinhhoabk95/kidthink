# Kế hoạch — Task #167: Đóng mạch vòng chơi, chuỗi câu hỏi là đường duy nhất

> **Loại task:** vá một mạch hở đang chảy máu, cộng nợ thi công của [`Task #100`](100-round-sequence-plan.md). Checklist: [`167-round-loop-closure-todo.md`](167-round-loop-closure-todo.md).
> **Không bị task nào chặn.**
> **Spec liên quan:** [`round-set-model.md`](../specs/05-content/round-set-model.md) và [`round-sequence-play.md`](../specs/04-play/round-sequence-play.md) — cả hai `implemented`, task này là **nợ thi công** của chúng, không phải spec mới (quyết định `Q2` ngày 2026-08-31).

## 1. Outcome

Trẻ chơi xong một màn chơi thì **thấy sao**. Hôm nay không trẻ nào thấy.

Yêu cầu ban đầu của chủ dự án: *"mỗi bài học có thể là một chuỗi các câu hỏi nối tiếp nhau hoặc chỉ là 1 trò chơi duy nhất đánh giá theo từng loại game template; trẻ làm xong câu 1 chuyển đến câu tiếp cho tới khi hết thì kết thúc trò chơi."*

Mô hình đó **đã đóng** ở Task #100 với tên *round set*. Nhưng khi đo lại ngày 2026-08-31, không một mảnh nào của nó chạy trên dữ liệu thật, và trong lúc đo lộ ra một thứ nặng hơn: **vòng chơi của web app là một mạch hở** — config đi vào, không có gì đi ra.

Nên task này không thêm tính năng. Nó dùng chuỗi vòng làm **đường duy nhất** để đóng mạch đó, rồi mới soạn nội dung chuỗi.

## 2. Bằng chứng đo được (2026-08-31)

### 2.1 Mạch hở — trẻ không kết thúc được trò chơi nào

| # | Đo được | Bằng chứng |
|---|---|---|
| 1 | Client **chưa bao giờ** gọi `complete` | [`play/[code].vue`](../../apps/web/app/pages/play/[code].vue) chỉ fetch đúng hai URL, cả hai là `…/config` (dòng 554–555) |
| 2 | Client **chưa bao giờ** gửi event | `grep -rln "play-sessions" apps/web/app` trả **0 file**. Bốn endpoint `{guest,users}/play-sessions/[uuid]/{events,complete}.post.ts` tồn tại và không ai gọi |
| 3 | `checkWinCondition()` **không được gọi** ở `apps/web` | Có ở [`core.ts:224`](../../packages/game-engine/src/core.ts) và [`round-runner.ts:132`](../../packages/game-engine/src/round-runner.ts); không hit nào trong `apps/web` |
| 4 | Modal ăn mừng chỉ bật ở **một** chỗ | `showVictoryModal.value = true` xuất hiện đúng dòng 419, nằm trong `onAllRoundsCompleted` của `startMultiRound` |
| 5 | `startMultiRound` **không tới được** | Nhánh ở dòng 578–585 là `rounds.length > 1`. `rounds` luôn rỗng theo mục 2.2, nên mọi phiên đi `startSingleRound` (443–459) — hàm này không kiểm thắng, không bật modal, không cập nhật chỉ báo |
| 6 | Server **có** tạo `play_sessions` và trả `session.uuid` | [`game-config-runtime.ts:175`](../../apps/web/server/utils/game-config-runtime.ts) insert, dòng 333–336 trả uuid. Client nhận rồi bỏ |

**Hệ quả cộng lại:** mỗi lần trẻ mở một màn chơi, server mở một `play_sessions` rồi bỏ đó `in_progress` mãi. Không event, không điểm, không sao, không ăn mừng, không tiến độ. Toàn bộ đường điểm ở [`scoring.ts`](../../packages/shared/src/scoring.ts) và [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) là mã không ai gọi tới từ web.

### 2.2 Chuỗi vòng — cỗ máy đủ, dữ liệu bằng không

| # | Đo được | Bằng chứng |
|---|---|---|
| 7 | `game_level_rounds` **không có writer nào trong toàn repo** | Sáu chỗ chạm bảng: khai bảng ([`schema/game.ts:138-170`](../../packages/db/src/schema/game.ts)), DDL migration, **hai SELECT**, hai TRUNCATE (test teardown và [`reset-content.ts:41`](../../packages/db/scripts/reset-content.ts)). [`service.ts`](../../packages/db/src/seed-content/service.ts) insert bảy bảng, không có bảng này. Bảng **rỗng vĩnh viễn** ở mọi DB dựng từ mã này |
| 8 | Corpus seed không có khái niệm vòng | `grep -rc "round" packages/db/src/seed-content/` trả **0**. `ContentSeed` ([`types.ts:37-42`](../../packages/db/src/seed-content/types.ts)) có đúng **một** `content_pack`, **một** `difficulty_params` |
| 9 | `scoring.mode` luôn là `"attempts"` | `const scoringMode = rounds.length > 1 ? "rounds" : "attempts"` — `game-config-runtime.ts:281` và bản **sao y** ở [`guest/levels/[code]/index.get.ts:158`](../../apps/web/server/api/guest/levels/[code]/index.get.ts) |
| 10 | 13 rule `BR-RSM-*` là **mã chết** | [`round-set-validation.ts`](../../packages/shared/src/round-set-validation.ts) cài đủ 13 rule kèm 26 ca âm. Gọi duy nhất từ `checkRoundSetRules` ([`publish-checklist.ts:508-539`](../../packages/shared/src/publish-checklist.ts)), hàm này tự tắt ở dòng 512–515 khi `entity.rounds` không phải mảng. Hai caller thật ([`submit.post.ts:51-61`](../../apps/web/server/api/managers/levels/[code]/[version]/submit.post.ts), [`content-lifecycle.ts:296-299`](../../packages/db/src/services/content-lifecycle.ts)) **không bao giờ** đặt khoá `rounds` |
| 11 | `publish-checklist.test.ts` có **0** lần xuất hiện `rounds:` | Chính chỗ nối bị hở cũng không có test |
| 12 | Không cổng nội dung nào biết tới vòng | Bốn cổng `check:{engine-depth,lesson-supply,theme-registry,go-live}` cộng bảy file `seed-content/gates/` trả **0** khớp "round" |
| 13 | Hợp đồng chiều sâu đếm **level**, không đếm câu hỏi | [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) và [`game-level-model.md`](../specs/05-content/game-level-model.md) trả **0** khớp "round" và "vòng". [`config/engine-depth.json`](../../packages/db/config/engine-depth.json) đang bật bậc 0 là `level_count: 3`; bậc 1 là 6; bậc 2 là 12 |
| 14 | Bộ sinh không sinh được độ khó leo thang | `GeneratorInput` ([`generators/types.ts`](../../packages/game-engine/src/generators/types.ts)) chỉ có `rng · age_band · what · theme · vocabulary`, **không có** trục độ khó. `GT001Generator` lấy `optionCount` thuần từ `age_band`. 19 trên 27 engine có generator |
| 15 | Task #100 còn ba ô chưa tick | Ô "một vòng không parse được trả `422 CONTENT_PACK_INVALID` kèm `round_index`" **đã có ở delivery** (`validateLevelAndRounds`, [`game-config-runtime.ts`](../../apps/web/server/utils/game-config-runtime.ts)) — đo lại 2026-08-31 khi làm WP167.0. Chỗ còn thiếu là đường **publish**, thuộc WP167.5. Hai ô còn lại là so field trước/sau migration, và chơi thử với trẻ |

### 2.3 Điểm với set một vòng chỉ có hai giá trị

Mục 7.2 [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) định nghĩa `normalized_score = clamp01(0.6·first_try_ratio + 0.4·accuracy)` với `first_try_ratio = rounds_correct / rounds_total`. Với set một vòng, `first_try_ratio` chỉ nhận 0 hoặc 1:

| Trẻ làm | `first_try` | `accuracy` | Điểm | Sao |
|---|---:|---:|---:|:--:|
| Đúng ngay | 1 | 1,00 | 1,00 | ba sao |
| Sai một lần rồi đúng | 0 | 0,50 | 0,20 | một sao |
| Sai hai lần rồi đúng | 0 | 0,33 | 0,13 | một sao |

Không có đường nào ra hai sao. `hint_rate = hint_count / rounds_total` cũng vậy — một gợi ý là 1,0.

**Đây là lý do chuỗi vòng không phải tính năng UX.** Nó là điều kiện để điểm và bộ chọn thích ứng ở [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) có độ phân giải. Với set 10 vòng, `first_try_ratio` có 11 mức và hai ngưỡng 0,55 với 0,85 đều có nghĩa.

### 2.4 Hai lỗi lẻ tìm thấy trên đường

1. **Link "Mở trò chơi" trong tiết học trỏ sai loại mã.** [`lessons/[code]/run.vue:226`](../../apps/web/app/pages/lessons/[code]/run.vue) dựng `/games/${currentStep.activity.code}` — đó là mã `ACT-nnnn`, nhưng `/games/[code]` và `guest/levels/[code]/index.get.ts:25` chỉ nhận `GL-C[1-6]-…`. Runner không giải `activities.refId` sang `game_levels.code`. Bước `digital_game` của mọi tiết học hỏng.
2. **`RoundRunner.roundsCorrect` đếm sai nghĩa.** `completeCurrentRound()` tăng `roundsCorrect++` vô điều kiện (`round-runner.ts:153`), không hỏi `isCurrentRoundWon()`. Mục 7.1 của [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) định nghĩa `rounds_correct` là vòng đúng **ngay lần thử đầu**. Hiện vô hại vì client không gửi gì, nhưng `BR-RSP-12` bắt server tự dựng số này từ chuỗi event, nên biến client này Cấm — NEVER được gửi lên. Đổi tên thành `roundsCompleted`.

## 3. Ba tầng chuỗi, và tầng mà task này chạm

Yêu cầu nói "bài học". Repo có ba tầng lồng nhau, và nhập chúng là đường sai:

| Tầng | Đơn vị | Sở hữu bởi | Trạng thái | Task này |
|---|---|---|---|---|
| **Vòng** | một câu hỏi trong một màn chơi | [`round-set-model`](../specs/05-content/round-set-model.md) · [`round-sequence-play`](../specs/04-play/round-sequence-play.md) | máy đủ, dữ liệu 0 | **CHẠM** — đây là "chuỗi câu hỏi nối tiếp", và "một trò chơi duy nhất" là set một vòng |
| **Bước chơi** | một `activity kind: digital_game` trong một tiết | [`lesson-model`](../specs/05-content/lesson-model.md) · [`lesson-template-variety`](../specs/05-content/lesson-template-variety.md) | chạy được, link hỏng theo mục 2.4 | chỉ vá link, không đổi mô hình |
| **Flow** | dãy tiết trẻ ghi danh | [`lesson-flow-model`](../specs/05-content/lesson-flow-model.md), [`Task #123`](123-lesson-flow-model-plan.md) | chưa thi công | Cấm — NEVER chạm |

Số đo tầng bước chơi: 81 lesson nhân **đúng ba** activity là 243 activity; 239 game level `published`; 27 engine.

Hai rule đứng ở hai tầng khác nhau, **cả hai giữ nguyên**:

- `BR-RSM-01` — mọi vòng trong một set dùng **cùng** một `template_code`.
- `BR-LTV-02` — tiết có từ hai bước chơi thì cấm hai bước cùng `template_code`.

Ghép lại: *"chuỗi câu hỏi cùng một cơ chế"* là **vòng**; *"nhiều hình dạng chơi trong một tiết"* là **bước chơi**. Yêu cầu ban đầu gộp hai thứ này, và tách ra là phần quan trọng nhất của bản kế hoạch này. Nó cũng nói rằng phần *"đánh giá theo từng loại game template"* đã có sẵn: hợp đồng `ActionResult` cộng `checkWinCondition()` giống nhau ở cả 27 template ([`game-session.ts:16-19,51-66`](../../packages/game-engine/src/game-session.ts)), còn tiêu chí thắng thì mỗi template tự cài.

## 4. Assumptions và ranh giới

1. **Cấm — NEVER sửa hợp đồng `GameSession`** (`BR-RSP-03`). `RoundRunner` bọc, không sửa. 27 template không đổi một dòng nào.
2. **Cấm — NEVER đổi `content_contract` của khuôn đã publish.** Vòng là dữ liệu tầng level, không phải tầng khuôn.
3. **Cấm — NEVER ép mọi level thành nhiều vòng** (`BR-RSM-09`). 239 level hiện có chạy tiếp không cần soạn lại.
4. **Cấm — NEVER hiện chữ số tiến độ** (`BR-RSP-10`). Chỉ báo là hình, ví dụ dãy hạt tô dần.
5. **Cấm — NEVER nối tiếp phiên bỏ dở** (`BR-RSP-07`). Mở lại là phiên mới từ vòng 0.
6. **Cấm — NEVER nới sàn [`engine-depth.json`](../../packages/db/config/engine-depth.json)** để cổng xanh (`BR-ECD-08`).
7. **Cấm — NEVER nới trần nào khác của `BR-RSM-*` ngoài trần vòng.** `D-167A` cho phép đúng một thứ là `MAX_ROUNDS_BY_BAND`. Trần item mỗi vòng (mục 7.1 [`game-level-model.md`](../specs/05-content/game-level-model.md)), trần payload, trần từ của chỉ dẫn: giữ nguyên. Trần payload còn bị **siết thêm**, xem `Q3`.
8. Sàn chiều sâu vẫn đếm **level**; vòng là trục **song song**, Cấm — NEVER nhân vào `level_count`. Nếu đổi thành đếm câu hỏi thì 3 level nhân 4 vòng đã vượt bậc 2 là 12, và sàn mất nghĩa ngay.
9. `BR-RSP-11` đã trả lời sẵn câu "có nút câu tiếp hay tự chuyển": tự chuyển sau khi hiệu ứng pop kết thúc, hoặc trẻ chạm. Cấm — NEVER đếm ngược. Không cần quyết thêm.

### 4.1 `D-167A` — trần vòng nâng lên 10 (chủ dự án, 2026-08-31)

Trần cũ là thang theo band, cài ở `MAX_ROUNDS_BY_BAND` ([`round-set-validation.ts:42-46`](../../packages/shared/src/round-set-validation.ts)) và mục 7.1 [`round-set-model.md`](../specs/05-content/round-set-model.md): band 3–4 là 4, band 4–5 là 6, band 5–6 là 8.

Quyết định: **tối đa 10 vòng.**

| Kiểm | Kết quả |
|---|---|
| Trần thời lượng `BR-RSM-12`, tối đa 5 phút một set | 10 vòng nhân khoảng 20 giây là **3,3 phút**, còn dư. Kể cả 30 giây một vòng vẫn đúng 5,0 phút |
| Trần phút chơi trong ngày, mục 7.1 [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md), mặc định 30/45/60 | Set 3 tới 5 phút cho 6 tới 12 set một ngày. Không vỡ |
| Độ phân giải điểm | 10 vòng cho `first_try_ratio` **11 mức**. Ngưỡng 0,55 và 0,85 đều có nghĩa |
| Trần payload `BR-RSM-10`, 200 KB gzipped **cả set** | 10 vòng cho ngân sách **20 KB một vòng**. Đây là chỗ trần dễ vỡ nhất, và là lý do `Q3` phải làm cùng lô |

Một điểm phải nói thẳng: lý do gốc của thang theo band là *"trí nhớ làm việc và sức chú ý của trẻ 3 tuổi không giữ được một dãy dài"* (`BR-RSM-03`). Trần thời lượng không bảo vệ điều đó, vì 10 vòng band 3–4 vẫn dưới 5 phút mà vẫn là một dãy dài với trẻ 3 tuổi. Nên bản thi công **giữ hình dạng thang** và nâng cả ba mức, với 10 là mức cao nhất:

| Band | Trần cũ | Trần mới |
|---|---:|---:|
| 3–4 | 4 | **6** |
| 4–5 | 6 | **8** |
| 5–6 | 8 | **10** |

Cách này đạt "tối đa 10" mà không đảo ngược lý do sư phạm của band nhỏ, và giữ nguyên hình dạng mà 26 ca âm của validator đang kiểm. Nếu ý là 10 cho cả ba band thì `MAX_ROUNDS_BY_BAND` thành `{3-4: 10, 4-5: 10, 5-6: 10}` — một dòng đổi, xem `Q4`.

## 5. Thứ tự

**Runtime trước, nội dung sau.** Soạn round set trước khi đóng mạch là soạn nội dung không ai chơi hết được, và không có số đo nào chứng minh nó tốt hơn. Đóng mạch trước thì mỗi round set soạn thêm đo được ngay bằng phân bố sao.

```text
WP167.0  Nâng trần vòng lên 10, siết trần payload sang delivery
  │
WP167.1  Vòng mặc định ở delivery — rounds[] Cấm — NEVER rỗng
  └──→ WP167.2  Một đường chạy: xoá startSingleRound, nối thắng sang hoàn tất
         └──→ WP167.3  Nối event và complete, ra sao thật
                │        [CHECKPOINT A: một trẻ chơi xong một màn và thấy sao]
                ├──→ WP167.4  Vá link ACT- sang GL- ở lesson run   (độc lập, ship sớm)
                └──→ WP167.5  Nối BR-RSM-* vào đường publish thật
                       └──→ WP167.6  ContentSeed.rounds, seeder ghi bảng
                              └──→ WP167.7  Generator nhận trục độ khó
                                     └──→ WP167.8  Lô round set đầu, cổng, đóng spec
```

`WP167.4` không phụ thuộc gì ngoài `WP167.3`. Nếu phần còn lại trượt phase, nó vẫn phải đi — nó vá một bước hỏng của mọi tiết học.

## 6. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP167.0 | S | `D-167A`: `MAX_ROUNDS_BY_BAND` sang `{3-4: 6, 4-5: 8, 5-6: 10}`; sửa mục 7.1 [`round-set-model.md`](../specs/05-content/round-set-model.md) cùng bảng đó; ghi `D-167A` kèm ngày và lý do vào mục 11 của spec. Cùng lô: `MAX_PAYLOAD_BYTES_GZIPPED` đo **cả** ở delivery-time, không chỉ publish-time (`Q3`) | Ca âm: set 11 vòng band 5–6 đỏ `BR-RSM-03`; set 10 vòng band 5–6 xanh; set 7 vòng band 3–4 đỏ. Set 10 vòng có ảnh vượt 200 KB gzipped bị chặn **ở delivery** kèm số byte đo được |
| WP167.1 | S | Khi `game_level_rounds` rỗng, delivery **dựng** một vòng từ `game_levels.content_pack`, `difficulty_params`, `instruction` với `round_index = 0`, thay vì trả `rounds: []`. `scoring.mode` thành `rounds` luôn. Gộp bản sao y giữa `game-config-runtime.ts:265-281` và `guest/levels/[code]/index.get.ts:145-158` vào **một** helper | Test: level không có hàng vòng trả `rounds.length === 1`, nội dung trùng khít `content_pack`. Ca âm: test khẳng định `rounds: []` phải đỏ trước khi sửa |
| WP167.2 | M | [`play/[code].vue`](../../apps/web/app/pages/play/[code].vue): xoá `startSingleRound` (443–459) và nhánh `rounds.length > 1` (578–585). Luôn `RoundRunner`. Nối `GameEngine.checkWinCondition()` ([`core.ts:224`](../../packages/game-engine/src/core.ts)) sang `roundRunner.completeCurrentRound()`. Cài `onRoundCompleted` (đang là stub rỗng, dòng 415–417): reset scaffolding, pop nhỏ, Cấm — NEVER ăn mừng lớn (`BR-RSP-09`), Cấm — NEVER đếm ngược (`BR-RSP-11`). Đổi tên `roundsCorrect` sang `roundsCompleted` (`round-runner.ts:153`) | Level một vòng: chơi đúng thì modal ăn mừng hiện. Chỉ báo tiến độ cập nhật. Số request mạng giữa hai vòng bằng 0 (`BR-RSP-01`). Snapshot hành vi 27 template trùng khít trước và sau (`BR-RSP-03`) |
| WP167.3 | M | Nối `session.uuid` (payload dòng 333) vào `POST {guest,users}/play-sessions/[uuid]/events` từ `getAllTelemetry()`, và `onAllRoundsCompleted` sang `POST …/complete` để nhận sao rồi đổ vào modal. Client Cấm — NEVER gửi `roundsCompleted` hay bất kỳ kết quả vòng nào (`BR-RSP-12`) | E2E: một phiên đi từ `in_progress` sang `completed`, DB có hàng event, modal hiện đúng số sao server trả. Ca âm: test khẳng định client không gửi trường kết quả nào |
| WP167.4 | S | [`run.vue:226`](../../apps/web/app/pages/lessons/[code]/run.vue): giải `activities.refId` sang `game_levels.code` ở service ([`lesson-session-runner.ts:311`](../../packages/db/src/services/lesson-session-runner.ts) chỗ đang lấy `activities.code`), link tới `/play/<GL-…>` | Bước `digital_game` của một tiết mở đúng màn chơi. Ca âm: test khẳng định link mang mã `ACT-` phải đỏ |
| WP167.5 | S | Truyền `rounds` vào `entity` trên đường publish: `submit.post.ts:51-61` và `content-lifecycle.ts:189-231` (thêm nhánh `extraData` cho `game_level`). `checkRoundSetRules` (`publish-checklist.ts:512-515`) hết tự tắt | 13 rule `BR-RSM-*` chạy thật. Test **qua publish-checklist**, không phải gọi `validateRoundSet` trực tiếp, đỏ trên fixture vi phạm từng rule. Vá lỗ ở số đo 11 |
| WP167.6 | M | `ContentSeed` ([`types.ts:37-42`](../../packages/db/src/seed-content/types.ts)) thêm `rounds?: ContentSeedRound[]`, mỗi phần tử mang `instruction`, `instruction_audio_path?`, `content_pack`, `difficulty_params`, `difficulty`. Vắng `rounds` là set một vòng (`BR-RSM-09`) và 239 level hiện có **không sửa một dòng**. `service.ts:137` insert `gameLevelRounds` sau `gameLevels` | `pnpm --filter @mindkid/db test` xanh; corpus cũ ra kết quả y hệt; một seed có `rounds` bốn phần tử tạo đúng bốn hàng với `round_index` liên tục từ 0 |
| WP167.7 | M | `GeneratorInput` ([`generators/types.ts`](../../packages/game-engine/src/generators/types.ts)) thêm `escalation_step?: number`, mặc định 0 là như hiện nay. 19 generator honour nó theo **đúng một** chiều ở mục 7.3 [`round-set-model.md`](../specs/05-content/round-set-model.md), Cấm — NEVER vượt trần item của band. `generateLevelsCore` ([`gen-levels.ts:150`](../../packages/db/src/seed-content/cli/gen-levels.ts)) nhận `--rounds=n` và xuất `rounds[]` | Sinh set bốn vòng cho `GT-001` band 3–4: mỗi vòng parse được, vòng 0 dễ nhất, mỗi bước leo đúng một chiều, không vòng nào vượt 4 item. `validateRoundSet` xanh trên đầu ra của bộ sinh |
| WP167.8 | M | Lô round set đầu tiên: chọn engine có generator và nội dung đã ổn, soạn set **bốn vòng** (`Q5`). Thêm cổng `check:round-sets` vào `seed-content/gates/` ép `BR-RSM-*` trên corpus, kèm ca âm. Ghi mục nợ thi công vào hai spec Task #100 kèm số đo mục 2.1 và 2.2, giữ `status: implemented` (`Q2`) | Cổng đỏ trên fixture vi phạm, xanh trên corpus. Phân bố sao đo được **trước và sau** lô này, in ra số |

## 7. Acceptance criteria

```gherkin
Scenario: WP167.0 — trần vòng mới có ca âm hai đầu
  Given một round set 10 vòng band 5-6 hợp lệ ở mọi rule khác
  When gọi validateRoundSet
  Then kết quả ok
  And một set 11 vòng cùng band trả vi phạm BR-RSM-03

Scenario: WP167.0 — trần payload chặn ở delivery
  Given một level có round set vượt 200 KB gzipped
  When client gọi config
  Then server chặn kèm số byte đo được

Scenario: WP167.1 — level không có hàng vòng vẫn ra một vòng
  Given một game level published không có hàng game_level_rounds nào
  When client gọi config
  Then payload trả rounds có đúng một phần tử
  And content_pack của phần tử đó trùng khít content_pack của level
  And scoring.mode là rounds

Scenario: WP167.2 — trẻ chơi xong một level một vòng thì thấy sao
  Given một level một vòng đã nạp
  When trẻ hoàn thành điều kiện thắng của vòng đó
  Then modal ăn mừng hiện
  And không phần tử nào hiện chữ số tiến độ

Scenario: WP167.2 — không gọi mạng giữa hai vòng
  Given một round set bốn vòng đã nạp
  When trẻ chơi hết cả bốn vòng
  Then số request mạng phát sinh giữa các vòng bằng 0

Scenario: WP167.2 — 27 khuôn không đổi hành vi
  Given snapshot kết quả test của 27 khuôn trước khi sửa play surface
  When RoundRunner thành đường duy nhất
  Then danh sách trạng-thái và tên-test trùng khít snapshot cũ

Scenario: WP167.3 — phiên đóng được và sao do server tính
  Given trẻ hoàn thành vòng cuối của một set
  When client gọi complete
  Then play_sessions của phiên đó có status completed
  And modal hiện đúng số sao server trả
  And client không gửi trường kết quả vòng nào

Scenario: WP167.4 — bước chơi của tiết học mở đúng màn chơi
  Given một lesson run đang ở bước kind digital_game
  When người dạy bấm mở trò chơi
  Then đường dẫn mang mã GL- của game level mà activity trỏ tới

Scenario: WP167.5 — 13 rule biên tập chạy qua publish checklist
  Given một round set leo hai chiều độ khó cùng lúc
  When gửi duyệt qua đường publish thật
  Then trả 422 VALIDATION_FAILED
  And details nêu round_index vi phạm

Scenario: WP167.6 — corpus cũ không đổi hành vi
  Given 239 level seed hiện có, không seed nào khai rounds
  When chạy db:seed
  Then mỗi level có đúng một hàng game_level_rounds với round_index 0
  And đọc level đó cho kết quả y hệt trước khi sửa
```

## 8. Verification

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH

# Cổng hiện có, giữ baseline
pnpm lint
pnpm --filter @mindkid/shared test
pnpm --filter @mindkid/game-engine test
pnpm --filter @mindkid/db test
pnpm typecheck
pnpm test

# Cổng nội dung
pnpm --filter @mindkid/db check:engine-depth
pnpm --filter @mindkid/db check:lesson-supply
pnpm --filter @mindkid/db check:round-sets   # mới ở WP167.8

# Đường thật, không chỉ test
pnpm db:seed && pnpm dev
#  mở /play/<GL-…> của một level một vòng: chơi đúng thì modal sao hiện
#  psql: play_sessions của phiên đó status = 'completed', và có hàng event
#  mở /lessons/<LES-…>/run: bước digital_game mở đúng màn chơi
```

Mỗi WP có **ca âm**: một test khẳng định hành vi cũ, phải **đỏ trước khi sửa**. Đây là điều kiện của `BR-TYP-07`, và là thứ duy nhất phân biệt cổng thật với cổng xanh giả — bốn cổng ở số đo 12 và `checkRoundSetRules` ở số đo 10 xanh suốt vì thiếu đúng thứ này.

`pnpm test` và `pnpm typecheck` là cổng **delta**: đếm trước khi sửa, yêu cầu không tăng.

## 9. Definition of done

- Trẻ chơi xong một màn chơi bất kỳ thì thấy sao, và `play_sessions` của phiên đó đóng ở `completed`.
- `apps/web` gửi event và gọi `complete`; không phiên nào bị bỏ lại `in_progress` vì client im lặng.
- `startSingleRound` không còn tồn tại; mọi màn chơi đi qua `RoundRunner`.
- Trần vòng là 10 ở band 5–6, có ca âm hai đầu; trần payload đo cả ở delivery.
- 13 rule `BR-RSM-*` chạy trên đường publish thật, mỗi rule có ca âm **qua publish-checklist**.
- `ContentSeed` khai được `rounds`; seeder ghi `game_level_rounds`; 239 level cũ không đổi hành vi.
- Bộ sinh xuất được round set leo thang một chiều, không vượt trần item của band.
- Bước `digital_game` của tiết học mở đúng màn chơi.
- Cổng `check:round-sets` chạy trên corpus, có ca âm.
- Hai spec Task #100 có mục nợ thi công ghi rõ đã đóng những gì.
- Phân bố sao in ra số, đo trước và sau lô round set đầu.
