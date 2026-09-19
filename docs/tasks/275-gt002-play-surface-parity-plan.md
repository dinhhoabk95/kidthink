# Task #275 Plan: GT-002 — rà lại UI/UX theo các lỗi đã sửa ở GT-001

> **Mục tiêu**: Người đặt việc yêu cầu (2026-09-19) nghiên cứu lại UI/UX của GT-002 và sửa các
> vấn đề tương tự GT-001 (Task #273, #274). Khảo sát cùng ngày trên code và DB dev: GT-002
> **không thắng được trên bề mặt web** — không có đường `commit` nào, và chọn đủ tập đúng thì bàn
> khoá cứng, "Bỏ qua" cũng bị từ chối. Cộng thêm 3 lỗi cùng lớp GT-001 (R3, R6, E4/E5) và 5 lỗi
> nội dung đo được trên 1.833 vòng.

Spec: [`engines/GT-002.md`](../specs/01-platform/engines/GT-002.md) ·
[`engine-input-contract.md`](../specs/01-platform/engine-input-contract.md) ·
[`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) ·
[`play-narration.md`](../specs/04-play/play-narration.md) ·
[`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) ·
[`deterministic-randomness.md`](../specs/01-platform/deterministic-randomness.md).

Việc trước: [`274-play-surface-audio-hint-followup-plan.md`](274-play-surface-audio-hint-followup-plan.md).

---

## 1. Bối cảnh

### 1.1 Đối chiếu lỗi GT-001 → GT-002

| GT-001 | Vấn đề ở GT-001 | GT-002 hiện tại | Bằng chứng | Lát |
|---|---|---|---|---|
| R1 | Nói theo bắt buộc | Không áp dụng — chỉ GT-000 có `speak_along` | — | — |
| R2 | Gợi ý bật sau 1 lần sai | **Đã phủ chung.** Band 4-5/5-6 bật L1 ở 2 miss; chọn/bỏ chọn trả `feedback: none`, không tính miss | `scaffolding.ts:68-81`, `GT-002/session.ts:73-79` | — |
| R3 | Đáp án cố định vị trí | **Lỗi.** `displayItems = [...content.items]` — không xáo lúc chơi. Thứ tự chốt lúc build, chơi lại vẫn cùng một bàn: trái `N7` và nhánh 8 | `GT-002/session.ts:43` | S4 |
| R4 | Câu dẫn không có mp3 | Chặn chung (câu hỏi mở 1 của #274). GT-002: 0/1.833 vòng | M7 | ngoài phạm vi |
| R5 | Chạm trước khi câu dẫn đọc xong | **Đã phủ chung** qua `engine.acceptingInput` | `use-play-gesture.ts:134` | kiểm ở Checkpoint 2 |
| R6 | Chạm lại minh hoạ đọc từ khoá | **Lỗi.** `getView()` không mang `glyph`/`label`/`spokenLabel`/`spokenAudioPath`: chạm vật im lặng, screen reader đọc `Ô đích GL-…_t1` (role `target`, trái §12 "mọi slot `role: neutral`") | `GT-002/session.ts:113-146`, `[code].vue:355-370` | S5 |
| E1 | Hai entity cùng id | Không: id `_t{n}`/`_d{n}` duy nhất; test chung của #274 S1a đã phủ | `tests/templates/gt-001.test.ts` | — |
| E2, E3, E6 | Hẹn giờ vòng, mp3 lỗi, settle | Đã phủ chung ở web | — | — |
| E4/E5 | Hai hình học chạm lệch nhau | **Lỗi.** `toAction()` dùng hình vuông `max(hitW,w)/2 + 24`, trong khi vẽ đĩa gỗ tròn (`drawWoodenPlate` → `arc`) và web tìm entity bằng hình tròn (`findHitEntity`) → vành góc chọn được mà không đọc tên | `GT-002/session.ts:157-175`, `shared-render-shapes.ts:695-725` | S5 |
| E7 | Thẻ đề lộ đáp án | Dạng khác: câu dẫn lệch nhiệm vụ (M4) và distractor giống hệt đáp án (M2) | §1.3 | S6 |

### 1.2 Lỗi riêng của GT-002 (đọc code 2026-09-19, chưa chạy trên trình duyệt)

| # | Lỗi | Chỗ | Hậu quả |
|---|---|---|---|
| G1 | Không có đường `commit` trên web | `[code].vue:447,455,463` — ba chỗ phát `commit` đều là `intent` của bài làm quen GT-000. GT-002 không vẽ nút xong trên canvas dù `N1` và §12 lớp 2 đòi | Không có cách nộp. Harness engine gửi thẳng `commit` (`all-templates-interactive-harness.test.ts:233`) nên xanh — cổng đo khả năng của engine, không đo bề mặt |
| G2 | Chọn đủ tập đúng là bàn khoá cứng | `checkWinCondition()` override trả `true` ngay khi tập chọn khớp, không cần `commit` (`GT-002/session.ts:203-209`) | Chuỗi ba bước: (a) chọn/bỏ chọn trả `feedback: none` nên `handleVerdict` thoát trước khi gọi `onRoundWon` (`use-play-gesture.ts:104-110`); (b) `dispatch()` nuốt mọi cử chỉ sau đó (`game-session.ts:262`) — không bỏ chọn được; (c) "Bỏ qua" và hết trợ giúp bị từ chối vì `skipCurrentRoundIfUnwon` thấy vòng "đã thắng" (`play-round-token.ts:133`, thêm ở #274 S1b). Trẻ chỉ thoát được bằng cách rời trang. Scenario `BR-E002-02` và test `mvp-engine-rules.test.ts:57-78` đang chốt đúng hành vi sai này — mâu thuẫn `N4` ("chấm chỉ xảy ra khi `commit`") và `N6` |
| G3 | Commit sai làm lệch trạng thái hình với mechanic | `onSubmitSelection` gán `wrong` cho vật sai nhưng để nguyên chúng trong `mechanic`; `toggleItemSelection` suy trạng thái mới từ trạng thái hình (`current === "selected" ? "idle" : "selected"`, `session.ts:62-66`) | Chạm lại vật `wrong` → mechanic **bỏ** chọn, hình hiện **đã chọn**. Nhãn đếm (`getSelectedCount` đếm `selected\|correct`) lệch mechanic. Tô `wrong` từng vật cũng là chấm từng vật — trái nhánh 1 (nhịp hổ phách trên nút xong, giữ nguyên tập để sửa) |
| G4 | View web không đồng bộ khi chọn/bỏ chọn | `feedback: none` thoát trước `syncView()` (`use-play-gesture.ts:104`) | Nút DOM cho bàn phím và screen reader giữ trạng thái cũ; không có `aria-pressed` |
| G5 | "Đã chọn" thiếu dấu tick | `drawSlotItem` chỉ vẽ tick khi `correct` (`shared-render.ts:1476`) | Trái §12: "viền dày cộng dấu tick" cho trạng thái đã chọn chưa xác nhận |

### 1.3 Phép đo mở đầu (DB dev, 2026-09-19)

| # | Phép đo | Hiện tại | Đích |
|---|---|---|---|
| M1 | Vòng GT-002 published | 1.833 (611 level: 453 band 4-5, 158 band 5-6) | — |
| M2 | Vòng có distractor **trùng asset** đáp án | 360 / 1.833 | 0 |
| M3 | Vòng có hai distractor trùng asset nhau | 347 / 1.833 | 0 |
| M4 | Câu dẫn lệch nhiệm vụ (`bao nhiêu\|mấy\|nào …hơn\|bên nào`) · câu dẫn có dấu nhiều (`tất cả\|những\|các`) | 351 · 24 | 0 · 1.833 |
| M5 | Vòng band 4-5 có `target_count > 3` (`BR-E002-03`) | 21 (7 level) | 0 |
| M6 | Vòng có mp3 từ khoá trên item | 0 / 1.833 | bằng số vòng mà item của dataset có `audio_path` (đo ở S6c) |
| M7 | Vòng có `instruction_audio_path` | 0 / 1.833 | ngoài phạm vi |
| M8 | Đường `commit` của GT-002 trên web | 0 | 1 |
| M9 | Vòng có tập đúng là N bản sao **một** asset | 1.833 / 1.833 | câu hỏi mở 1 |
| M10 | Vòng `allow_retry = false` | 0 | — (nhánh 2 không có level để chơi) |

Mẫu M2 — trẻ không thể phân biệt bằng mắt:

| Level | Câu dẫn | Tiêu chí | Vật (✓ = đúng) |
|---|---|---|---|
| `GL-C5-VOC-MULTI-0062` | Bé hãy chọn đúng hình thoi nhé! | Chọn các hình thoi | 📝✓ 📝 📝 📝✓ |
| `GL-C1-MEAS-TCNT-0008` | Cốc nào đựng được nhiều nước hơn hả bé? | Chọn tất cả số không | 🏺✓ 🏺 🏺✓ 🏺 |
| `GL-C1-MEAS-TCNT-0038` | Bé xếp các vật từ nhỏ nhất đến to nhất nhé! | Chọn tất cả số năm | ⚽✓ ⚽ ⚽✓ ⚽ ⚽✓ |

Lệnh tái lập M1–M6, M9 (Postgres dev trong container `mindkid-db-1`):

```bash
docker exec mindkid-db-1 psql -U postgres -d mindkid -At -F' | ' -c "
with r as (
  select l.age_max, r.content_pack cp, r.difficulty_params dp
  from game_level_rounds r join game_levels l on l.id = r.game_level_id
  where l.template_code = 'GT-002' and l.status = 'published')
select count(*) rounds,
  count(*) filter (where exists (select 1 from jsonb_array_elements(cp->'items') a, jsonb_array_elements(cp->'items') b
    where (a->>'is_correct')::boolean and not (b->>'is_correct')::boolean and a->'asset' = b->'asset')) m2_same_as_answer,
  count(*) filter (where (select count(distinct i->'asset') from jsonb_array_elements(cp->'items') i where not (i->>'is_correct')::boolean)
    < (select count(*) from jsonb_array_elements(cp->'items') i where not (i->>'is_correct')::boolean)) m3_dup_distractor,
  count(*) filter (where cp->>'prompt' ~* 'bao nhiêu|mấy|nào .*hơn|bên nào') m4_off_task,
  count(*) filter (where cp->>'prompt' ~* '(tất cả|những|các )') m4_multi_marker,
  count(*) filter (where (dp->>'target_count')::int > 3 and age_max <= 5) m5_over_wm,
  count(*) filter (where exists (select 1 from jsonb_array_elements(cp->'items') i where i->'asset' ? 'audio_path')) m6_item_mp3,
  count(*) filter (where (select count(distinct i->'asset') from jsonb_array_elements(cp->'items') i where (i->>'is_correct')::boolean) = 1) m9_identical_targets
from r;"
```

---

## 2. Quyết định — giả định đã ghi, người đặt việc sửa nếu sai

| Mã | Giả định | Vì sao | Đổi lại tốn gì |
|---|---|---|---|
| `D-275-1` | Nút **Xong** do session vẽ trên canvas (spec §12 lớp 2 đã đòi), cộng một entity `neutral` id `commit:done` trong `getView()` cho đường bàn phím. Chạm trúng nút → `submit_selection`. Không thêm trường vào `EngineView`, không thêm nút DOM riêng cho GT-002 | Nút DOM theo `input.verbs` sẽ bật cho cả GT-006/GT-018/GT-028 chưa ai kiểm — gộp ngang nhiều engine. Primitive vẽ nút đặt ở `render/` để engine sau dùng lại | Chuyển sang nút DOM: đổi `toAction` và bỏ primitive |
| `D-275-2` | Thắng **chỉ** khi `commit`: bỏ override `checkWinCondition()`, dùng `isWon` của lớp gốc. Sửa scenario `BR-E002-02` trước | `N4`, `N6` và nhánh 1 đều nói chấm chỉ xảy ra khi `commit`; scenario hiện tại mâu thuẫn chính spec | Một override |
| `D-275-3` | Commit sai: giữ nguyên tập chọn, Cấm — NEVER tô đúng/sai từng vật; nhịp hổ phách trên nút Xong; tính một miss. Trạng thái hình **suy ra từ mechanic** (một nguồn sự thật) | Nhánh 1 của spec; bỏ được cả lớp lỗi lệch trạng thái G3 | — |
| `D-275-4` | Xáo vị trí vật lúc chơi bằng `deriveStream(layoutSeed, "items")`, luôn bật. Không thêm `shuffle_items` vào hợp đồng độ khó | `N7` và nhánh 8 đòi vị trí đổi theo seed; không level nào cần tắt (YAGNI) | Một trường Zod nếu sau này cần |
| `D-275-5` | Distractor phải khác asset đáp án và khác nhau từng đôi. Dataset không đủ vật phân biệt được → builder ném lỗi, level **không sinh**; Cấm — NEVER hạ `item_count` dưới hợp đồng để lách | Vòng không phân biệt được bằng mắt là vòng không thắng được bằng suy nghĩ; `BR-E002-02` chấm toàn vẹn nên mọi lần chạm "nhầm" vào bản sao đều bị phạt | Có thể mất level — đo trước khi commit (S6a) |
| `D-275-6` | Câu dẫn GT-002 luôn dựng từ tiêu chí: `Bé hãy chọn tất cả {số nhiều} nhé!`; bỏ `phrasing.prompt_template` của dataset | `prompt_template` viết cho dạng câu hỏi khác (M4: 351 câu lệch, chỉ 24/1.833 có dấu nhiều). `N2`: `prompt` mang `target_criterion` | Người soạn muốn câu riêng thì thêm `phrasing.multi_prompt_template` sau |
| `D-275-7` | Kẹp `target_count` theo `opts.band` ở builder: ≤3 band 4-5, ≤4 band 5-6 | `BR-E002-03`; M5 = 21 vòng vi phạm | — |
| `D-275-8` | Chọn/bỏ chọn giữ `feedback: none` (không chấm từng vật), nhưng web vẫn `syncView()` và đọc tên vật | `N4` cấm chấm lúc đang chọn; view DOM phải theo kịp canvas; đọc tên là R6 | — |

---

## 3. Lát cắt

Mỗi lát một commit, một mối quan tâm. Cấm — NEVER gộp lát. Mọi lát bắt đầu bằng test đỏ tái lập lỗi
(RED), và có **ca âm**: bỏ phần sửa thì test đỏ lại.

### S1a — Thắng chỉ khi `commit` (G2, `D-275-2`)

- Sửa `GT-002.md` trước: §6 `BR-E002-02` thêm "khi `commit`"; §9 scenario `BR-E002-02` thêm bước bấm
  Xong, thêm scenario "chọn đủ tập đúng nhưng chưa bấm Xong → chưa thắng, vẫn bỏ chọn được".
- Bỏ override `checkWinCondition()`; thắng qua `winSession()` trong `onSubmitSelection`.
- Test engine (file mới `tests/templates/gt-002.test.ts`): chọn đủ → `checkWinCondition() === false`,
  `dispatch` tap lần nữa vẫn bỏ chọn được; `commit` → thắng. Sửa test `BR-E002-02` trong
  `mvp-engine-rules.test.ts` theo scenario mới.
- Test web (`play-round-token.test.ts`): GT-002 thật, chọn đủ tập đúng → `skipCurrentRoundIfUnwon`
  trả `true` (không bị từ chối).

Sau lát này GT-002 vẫn chưa nộp được trên web, nhưng hết khoá cứng: "Bỏ qua" chạy.

### S1b — Nút Xong trên canvas (G1, `D-275-1`)

- Primitive `drawCommitButton(ctx, rs, rect, { enabled, pulseMs })` ở `render/`, xuất qua barrel.
- Session tính hình chữ nhật nút từ `this.logicSpace` (cùng chỗ tính slot, không đè lưới
  `grid-2x4`, nhãn đếm góc phải trên, câu dẫn), vẽ mờ khi chưa chọn vật nào (`N1`).
- `toAction()`: tap trúng nút (hình chữ nhật + `TAP_TOLERANCE_PX`) và có ≥1 vật chọn →
  `submit_selection`; 0 vật chọn → `null` (nuốt, Cấm — NEVER tính miss). `gesture.type === "commit"`
  giữ nguyên cho harness.
- `getView()`: thêm entity `{ id: "commit:done", role: "neutral", label: "Xong" }` — đường bàn phím
  đi qua `handleAccessibleEntityTap` → tap tại tâm nút.
- Test engine: tap nút khi tập đúng → thắng; tập sai → `ACTION_RETRY`; 0 chọn → `ACTION_IGNORED`.
  Test web (`play-gesture.test.ts`, session GT-002 thật): chọn đủ, chạm nút → `onRoundWon` đúng một
  lần; Enter trên entity `commit:done` cho cùng kết quả.

### S2 — Commit sai giữ tập chọn, trạng thái một nguồn (G3, G5, `D-275-3`)

- Trạng thái hình suy từ mechanic: `correct` khi đã thắng và vật đúng; `selected` khi
  `mechanic.isSelected`; còn lại `idle`. Xoá `itemStates` và nhánh gán `wrong`.
- Commit sai: ghi mốc `lastFrameMs` để nút Xong nháy hổ phách ~400ms (cùng đồng hồ với `render()`,
  bài học `lastFrameMs` của GT-001).
- Nhãn đếm đọc `mechanic.getSelectedIds().length`.
- Dấu tick cho `selected`, Cấm — NEVER dùng màu `success`/`retry` (§12).
- Ca âm: chọn distractor → commit sai → chạm lại distractor → `getView()` báo `idle` **và**
  `mechanic.isSelected` là `false`; sau commit sai không entity nào ở `incorrect`.

### S3 — View web đồng bộ khi chọn/bỏ chọn (G4, `D-275-8`)

- `use-play-gesture.ts`: `syncView()` chạy trước nhánh thoát `feedback === "none"`.
- `[code].vue`: `:aria-pressed` cho entity ở `selected`.
- Test web: chạm vật GT-002 → `viewEntities` báo `selected`; chạm lại → `idle`; không gọi `onMiss`.

### S4 — Vị trí vật xáo theo seed (R3, `D-275-4`)

- `setupEntities()` xáo `content.items` bằng `deriveStream(this.layoutSeed, "items")`.
- Test: cùng seed → cùng thứ tự; 20.000 seed → tỉ lệ vật đúng ở ô 0 lệch ≤1 điểm phần trăm so với
  `target_count / item_count` (cách đo R3 của #274); `getHintTargetIndex()` vẫn trỏ đúng vật đúng
  sau khi xáo.

### S5 — Chạm vật đọc tên, một hình học chạm (R6, E4/E5)

- Chuyển `resolveAssetLabels` của GT-001 thành helper dùng chung ở `labels/`. GT-001 import lại —
  danh sách `trạng-thái | tên-test` của `gt-001.test.ts` trước/sau phải trùng khít.
- GT-002 `getView()` mang `glyph`/`label`/`spokenLabel`/`spokenAudioPath`, `role: "neutral"` (§12).
- `toAction()` dùng `findHitSlotIndex(slots, x, y, "circle", TAP_TOLERANCE_PX)` — khớp đĩa gỗ tròn
  và `findHitEntity` của web.
- Test: quét lưới điểm trên toàn logic space, mỗi điểm chỉ số slot engine chọn == entity web tìm
  được; điểm ở góc hình vuông cũ nhưng ngoài vòng tròn → `null`; entity emoji/text có
  `spokenLabel`, glyph không tên thì không có (`BR-PNR-02`, #274 S7).

### S6 — Nội dung GT-002 (M2–M6, `D-275-5..7`)

Sửa `GT-002.md` trước: §6 thêm `BR-E002-04` (distractor khác asset đáp án và khác nhau từng đôi),
§14 thêm ca sai thứ ba (mẫu M2). Chạy lại `check:engine-specs` và `check:engine-turn`.

- **S6a** — builder lọc distractor theo asset đã resolve, bỏ trùng; thiếu → ném `[BR-E002-04]`.
  **Đo trước khi commit**: số level GT-002 còn lại theo band, so sàn §16 (`check:engine-depth`) và
  ma trận §13 (`check:engine-seed-matrix`). Tụt dưới sàn thì dừng, hỏi (câu hỏi mở 2). Test builder
  + quét toàn corpus qua `buildLevelsForSkill` (nguồn `narration-level-scan.ts` dùng) → 0 vi phạm;
  ca âm là dataset fixture toàn 📝.
- **S6b** — câu dẫn dựng từ tiêu chí (`D-275-6`), kẹp `target_count` theo `opts.band`
  (`D-275-7`). Test: mọi `prompt` GT-002 trong corpus chứa `tất cả`; không vòng band 4-5 nào có
  `target_count > 3`.
- **S6c** — mang `audio_path` của item vào asset như GT-001 (`keywordAsset`, #274 S6a) — chuyển
  `keywordAsset` sang `builders/utils.ts` dùng chung, không chép.
- Sau S6: `db:seed` lại DB dev, chạy lại lệnh SQL §1.3, ghi số đo vào todo.

---

## 4. Thứ tự và đồ thị phụ thuộc

```
S1a (thắng chỉ khi commit) ──► S1b (nút Xong) ──► S2 (commit sai) ──┐
                                   │                                 ├─► Checkpoint 2 (trình duyệt)
                                   └─► S3 (view web) ────────────────┤
S4 (xáo theo seed) ──────────────────────────────────────────────────┤
S5 (đọc tên + hình học chạm) ────────────────────────────────────────┘
S6a ──► S6b ──► S6c ──► db:seed ──► Checkpoint 3 (đo lại §1.3)
```

S1a trước tiên: đó là lỗi khoá cứng đang chạy trên bề mặt trẻ. S1b–S5 cùng sửa
`GT-002/session.ts` nên làm tuần tự dù về logic độc lập. S6 chỉ chạm `packages/content` và spec —
chạy song song được với S2–S5.

## 5. Không làm trong task này

- mp3 câu dẫn (R4, M7) — chờ câu hỏi mở 1 của #274.
- Nhánh 2 (`allow_retry = false`) — 0 vòng dùng (M10).
- **Cùng lớp lỗi ở engine khác** — mỗi engine một task (1 spec = 1 plan):
  - GT-006, GT-018 (`response_mode: sequence`), GT-028 khai `commit` trong `input.verbs` nhưng web
    không phát `commit` cho chúng. Chưa đo chúng có khoá cứng như G2 không.
  - GT-001: 497/2.976 vòng có distractor trùng asset đáp án — cùng lớp M2, đo bằng câu SQL §1.3 trên
    `options`.
- Gợi ý khi đã chọn đủ vật đúng cộng một distractor: `getHintTargetIndex()` trả `null` nên không có
  gợi ý "bỏ vật thừa". Cần sửa `scaffolding-and-hints.md` trước — ghi lại, không làm.

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| S6a xoá nhiều level, tụt dưới sàn §16/§13 | Cao | Đo trước khi commit; dừng và hỏi nếu tụt sàn |
| Nút Xong đè lưới `grid-2x4` ở 8 vật hoặc màn hẹp | Trung bình | Tính từ `logicSpace`; ảnh chụp ở 390×844 và 1280×800 tại Checkpoint 2 |
| Chuyển `resolveAssetLabels` đổi hành vi GT-001 | Trung bình | So danh sách test trước/sau trùng khít |
| Bộ test đỏ sẵn che lỗi mới | Trung bình | So danh sách file đỏ trước/sau qua `check:test-ratchet`, không tin "1 failed" của `--bail` |

## 7. Câu hỏi mở

1. **Tập đúng luôn là N bản sao một hình** (M9: 1.833/1.833). GT-002 thành "tìm hình giống nhau",
   không phải "tất cả những cái thoả tiêu chí" như spec §1 (vd "tất cả những quả màu đỏ" — nhiều vật
   khác nhau cùng một thuộc tính). Đổi sang tiêu chí thuộc tính cần dữ liệu thuộc tính trên item
   dataset — task nội dung riêng. Người đặt việc có muốn mở không?
2. Nếu S6a làm tụt số level GT-002 dưới sàn: chấp nhận ít level hơn, hay soạn thêm dataset trước?
