---
task: 166
title: Hành vi chơi dẫn ra thiết kế — ngôn ngữ chung, feature file, hợp đồng nhập
status: planned
created: 2026-08-31
owns_specs:
  - docs/specs/01-platform/engine-play-language.md
  - docs/specs/01-platform/engine-input-contract.md
  - docs/specs/01-platform/engine-spec-sheet.md
depends_on:
  - GAME-ENGINE-RUNTIME
  - ENGINE-RENDER-CONTRACT
  - ENGINE-SPEC-SHEET
  - GAME-LAYOUT-ENGINE
  - ACCESSIBILITY
---

# Task 166 — Hành vi chơi dẫn ra thiết kế

BDD ở đây là **behaviour driven design**: hành vi viết trước, thiết kế là thứ
rơi ra. Không phải "viết Gherkin cho thiết kế đã có". Thứ tự bắt buộc là
khám phá → diễn đạt → tự động hoá → **rồi mới** tới interface.

## 1. Vì sao — thiếu ngôn ngữ, không thiếu tài liệu

Đo trên cây làm việc ngày 2026-08-31.

### 1.1 Bốn mươi bảy tên hàm cho sáu hành vi

Đếm method vào của 27 session (bỏ vòng đời và getter):
**51 tên, trong đó 4 là predicate → 47 động từ vào.**

```
onItemLocked · toggleItemSelection · onCandidateSelected · selectValue · onOptionSelected
selectOption · matchCard · onItemSelect · onTapCard · onTapObject · onTapStimulus · onSelectItem
onItemDropped · onItemSorted · onPairMatched · onPartFilled · onItemPlaced · placeItem · fillCell
onPlacePiece · onPlaceOption · onSnapPart · onAssemblePart · reorderSteps · onReorderStep
onPathStep · onTracePoint · onRotatePiece · onFlipPiece · rotateModel · setHour · setMinute
pinSymbolValue · selectSymbol · selectSide · onSubmitSelection · onSubmitSequence
onPathSubmitted · submitCurrentTime · returnItemToTray · clearCell · onArrowPressed
onClueRevealed · onOptionPreviewed · onRevealObject · replayFlash · closeMismatch
```

Đọc kỹ danh sách: `onItemDropped` · `onItemSorted` · `onPartFilled` · `onItemPlaced` ·
`placeItem` · `onPlacePiece` · `onPlaceOption` · `onSnapPart` — **tám tên cho một
hành vi**: bé đưa một vật vào một chỗ. Bốn mươi bảy tên đang mô tả sáu hành vi.

Không có ngôn ngữ chung thì không có interface chung. Không có interface chung thì
tầng UI **buộc phải đoán**. Và nó đoán:

```ts
// apps/web/app/pages/play/[code].vue:337
if (trySelectValue(session, hitIdx) || tryItemAction(session, hitIdx)) return;
tryOtherAction(session, hitIdx);
```

Năm tên đoán: `selectValue` · `onItemLocked` · `toggleItemSelection` · `flipCard` ·
`tapObject`. Hai tên cuối **không session nào có** (`flipCard` chỉ ở
`systems/card-system.ts:76`, gọi nội bộ; `tapObject` không tồn tại — GT-022 và
GT-025 đặt `onTapObject`).

**Nhận được cử chỉ: GT-001 · GT-002 · GT-010 · GT-012. Bốn trên hai mươi bảy.**
23 engine còn lại không có cử chỉ nào chạm tới.

Và không engine nào trong bốn cái đó **kết thúc** được một level:
`showVictoryModal` chỉ bật trong `onAllRoundsCompleted` (`[code].vue:419`), cần
`roundRunner.completeCurrentRound()` — `grep` toàn app → **0 lần gọi**. Nhánh một
round không nối victory. `engine.on(...)` chưa từng được đăng ký, nên
`game_completed` không rời engine. **Không level nào kết thúc được trên trình duyệt.**

Duck-typing không phải lỗi cẩu thả của trang chơi. Nó là **triệu chứng đúng** của
một hệ không có ngôn ngữ. Task này chữa nguyên nhân.

### 1.2 Hai hệ toạ độ không khớp

`RenderSystem.setupCanvas` (`packages/game-engine/src/systems/render-system.ts:34`)
tính `scale` rồi trả về mà **không áp** — chỉ `ctx.scale(dpr, dpr)`.

| Bên | Giả định |
|---|---|
| Session vẽ (`shared-render.ts:140`) | logic 960×540 |
| `ctx` sau `setupCanvas` | pixel CSS — 1200×675 trên khung rộng |
| Trang chơi `getLogicCoordinates` (`[code].vue:265`) | letterbox contain, chia cho `scale` = 1,25 |

Ba giả định, hai hệ. Hệ quả đo được:

- Cảnh chiếm góc trên-trái 960×540 của khay 1200×675 — 64% diện tích. `clear()`
  cũng chỉ xoá vùng đó nên rìa giữ vệt cũ. Đó là "quá sơ sài".
- Trang chia 1,25, renderer không nhân → điểm chạm lệch 20% khung vào trong. Band
  3–4 thẻ 96 px thì lệch **qua ô bên cạnh**. Bé chạm đúng, máy báo sai.

`getLogicCoordinates` sống trong file `.vue` — không test nào với tới được. Đó là
lý do lỗi này sống sót qua mọi cổng.

### 1.3 Bốn hệ thống khai mà không ai đọc

| Thứ | Khai ở | Ai đọc |
|---|---|---|
| `difficulty.hint_after_ms` | contract của 27 engine, mọi fixture | **Không ai** — `grep` ngoài `template.ts`/`fixtures.ts` → 0 |
| `ScaffoldingSystem` | `core.ts:140` khởi tạo · `core.ts:188` `tick()` | Không session đọc mức leo thang; không gì vẽ ra |
| `session.degradation` | khai ở cả 27 session | Không chỗ nào gán → nhánh tuột thiết bị yếu là mã chết |
| `InteractionManager` | `interaction.ts` — fallback tap-tap `BR-ENG-06`, long-press thoát | `engine.interaction` không được app tham chiếu lần nào |

§5 "Alternative flows" của cả 27 spec engine mô tả gợi ý và tuột thiết bị yếu như
hành vi đang có. Chúng chưa tồn tại. Tài liệu đang nói dối có hệ thống — thêm tài
liệu nữa không chữa được, chỉ có hành vi chạy được mới chữa.

### 1.4 Cổng xanh vì test gọi tắt

`tests/all-templates-interactive-harness.test.ts` có đúng 27 ca "Complete Gameplay
Winning Simulation", tất cả xanh. Tất cả gọi `session.onItemDropped(...)`,
`session.onSnapPart(...)` **thẳng**. Không ca nào đi qua `pointerdown` →
`getLogicCoordinates` → dispatcher.

Cổng đo đường nó tự dựng. Bé đi đường khác.

## 2. Kết quả mong muốn

1. **Một ngôn ngữ chung** cho hành vi chơi, tiếng Việt, do một spec sở hữu. 47
   động từ vào co về sáu, và tên trong mã đọc giống tên trong feature file.
2. **Feature file chạy được** là nguồn sự thật của hành vi — không phải khối
   Gherkin chép trong markdown. Đơn vị tổ chức là **hành vi**, engine là tham số.
3. **Interface rơi ra từ hành vi**, không ngược lại: `EngineInput` viết sau khi
   feature file đỏ, và đỏ vì lý do đúng.
4. Cổng đi qua **toạ độ con trỏ thật**. Cấm — NEVER cổng nào gọi tắt method session.
5. Spec engine trỏ tới feature file, cấm — NEVER chép lại (`BR-ESS-03` mở rộng).

## 3. Giả định — chốt ở đây, sửa nếu sai

| # | Giả định | Vì sao |
|---|---|---|
| A1 | Vòng BDD đủ ba nhịp: khám phá (bảng ví dụ) → diễn đạt (`.feature`) → tự động hoá (binding). Bỏ nhịp nào thì thành "viết test sau" | Ba nhịp là định nghĩa của BDD. Hai nhịp là TDD đội tên khác |
| A2 | Feature file `.feature` thật, chạy bằng `@amiceli/vitest-cucumber` qua catalog pnpm. Nếu cấm thêm dependency thì hạ xuống DSL `Given/When/Then` tự viết trên vitest 4 | Gherkin trong markdown cấm — NEVER chạy được, và spec không chạy được là spec sẽ lệch |
| A3 | Đơn vị của feature file là **hành vi**, không phải engine. 27 engine vào bảng `Examples` | 27 file × 6 kịch bản giống nhau là 162 bản sao chờ lệch. Một file `thả.feature` × 12 dòng `Examples` thì sửa một chỗ |
| A4 | Binding lái **bề mặt thật**: toạ độ client px → `toLogicPoint` → hit test → engine. Cấm — NEVER binding nào gọi method session trực tiếp | Lỗi §1.2 sống sót đúng vì mọi cổng đều gọi tắt |
| A5 | `getLogicCoordinates` chuyển từ `[code].vue` vào `packages/game-engine/src/interaction.ts`, đổi tên `toLogicPoint`. App và cổng dùng **một** bản | Hai bản sao của một phép biến đổi toạ độ là lỗi §1.2 lần nữa |
| A6 | Task này viết hành vi + interface dẫn ra từ hành vi. Sửa mã 27 session theo interface mới là task 167 | Feature file phải đỏ trước. Sửa mã trong cùng task thì không ai biết nó từng đỏ |
| A7 | Hành vi mô tả trạng thái **đúng**, không phải trạng thái hiện tại | Feature file xanh ngay từ đầu là feature file vô dụng |

## 4. Nhịp 1 — Khám phá: ngôn ngữ chung của lượt chơi

Rút từ 47 động từ vào, gom theo **cái bé làm**, không theo cái engine gọi.

### 4.1 Sáu cử chỉ của bé

| Tiếng Việt | Định danh | Nghĩa | Gom từ |
|---|---|---|---|
| **chạm** | `tap` | đặt ngón lên một đích, nhấc ra ngay | `onItemLocked` `toggleItemSelection` `onCandidateSelected` `selectValue` `onOptionSelected` `selectOption` `matchCard` `onItemSelect` `onTapCard` `onTapObject` `onTapStimulus` `onSelectItem` `selectSymbol` `selectSide` |
| **thả** | `drop` | đưa một nguồn vào một đích | `onItemDropped` `onItemSorted` `onPairMatched` `onPartFilled` `onItemPlaced` `placeItem` `fillCell` `onPlacePiece` `onPlaceOption` `onSnapPart` `onAssemblePart` `reorderSteps` `onReorderStep` |
| **nét** | `stroke` | chuỗi điểm liên tục, ngón không nhấc | `onPathStep` `onTracePoint` |
| **chỉnh** | `adjust` | đổi trạng thái một vật tại chỗ | `onRotatePiece` `onFlipPiece` `rotateModel` `setHour` `setMinute` `pinSymbolValue` `onArrowPressed` |
| **chốt** | `commit` | xác nhận trạng thái hiện tại là câu trả lời | `onSubmitSelection` `onSubmitSequence` `onPathSubmitted` `submitCurrentTime` |
| **hoàn** | `revert` | trả một vật về chỗ cũ, xoá thứ đã đặt | `returnItemToTray` `clearCell` |

Bốn mươi bảy về sáu. Mọi tên còn lại không phải cử chỉ của bé:

### 4.2 Ba nhịp của hệ

| Tiếng Việt | Định danh | Nghĩa | Gom từ |
|---|---|---|---|
| **lộ** | `reveal` | hệ mở một manh mối, một xem trước, một chớp | `onClueRevealed` `onOptionPreviewed` `onRevealObject` `replayFlash` |
| **nhắc** | `hint` | leo thang scaffolding theo đồng hồ hoặc số lần trượt | *(chưa có tên — `hint_after_ms` không ai đọc)* |
| **hết nhịp** | `timeout` | cửa sổ thời gian đóng mà bé không thao tác | `closeMismatch` |

`nhắc` không có tên trong mã hôm nay. Đó chính là §1.3 — hành vi có trong contract,
không có trong ngôn ngữ, nên không có trong mã.

### 4.3 Trạng thái một vật chơi

`nghỉ` → `nhắm` (ngón đang ở trên) → `cầm` (đang kéo) → `đặt` → `khoá`
và hai nhánh phản hồi `mừng` · `nhắc lại`. Nối thẳng vào năm trạng thái thị giác
§7.3 của [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) —
cấm — NEVER dựng bộ trạng thái thứ hai.

### 4.4 Bảng ví dụ — mỗi engine một lượt

Nhịp khám phá cho mỗi engine trả lời đúng bảy câu. Hôm nay không spec nào trong 27
file trả lời được câu nào:

1. Bé đặt ngón ngoài mọi đích thì gì xảy ra?
2. Bé thả giữa hai đích — bám đích nào, khoan dung bao nhiêu px?
3. Bé nhấc ngón giữa chừng khi đang kéo — vật ở lại hay về chỗ cũ?
4. Fallback chạm-chạm của engine này là chạm gì rồi chạm gì?
5. Bao nhiêu mili giây không thao tác thì `nhắc` cấp 1 hiện, và hiện **ở đâu**?
6. Chạm lần hai vào đích đã chọn — bỏ chọn hay giữ?
7. Phiên đã thắng mà bé còn chạm — nuốt hay không?

Bảy câu × 27 engine = 189 ví dụ. Đó là đầu vào của nhịp 2.

## 5. Nhịp 2 — Diễn đạt: feature theo hành vi, engine là tham số

`packages/game-engine/features/`. Mười hai file, không phải hai mươi bảy.

| File | Phủ | Engine |
|---|---|:--:|
| `cham.feature` | chạm trúng · chạm nền · chạm lại · bật-tắt | 18 |
| `tha.feature` | bám đích · thả giữa hai đích · nhấc giữa chừng · thả sai đích | 12 |
| `net.feature` | lấy mẫu · rời nét · nét ngược chiều | 2 |
| `chinh.feature` | bước xoay · chạm biên · chỉnh rồi chốt | 6 |
| `chot.feature` | chốt khi đủ · chốt khi thiếu · chốt hai lần | 5 |
| `hoan.feature` | hoàn về chỗ cũ · hoàn khi đã khoá | 2 |
| `toa-do.feature` | một hệ toạ độ giữa vẽ và chạm, mọi cỡ khung | 27 |
| `fallback-cham-cham.feature` | `BR-ENG-06` — mọi engine `drag-drop`/`stroke` | 13 |
| `nhac.feature` | leo thang `hint_after_ms` → `ScaffoldingSystem` | 27 |
| `sai-khong-phat.feature` | `BR-ENG-07` — sai có phản hồi, cấm đỏ, cấm trừ điểm | 27 |
| `nuot-input.feature` | sau thắng · lúc tạm dừng · lúc chuyển round | 27 |
| `san-cham.feature` | `BR-A11-04` sàn 96/76/64 px đo trên hit band thật | 27 |

Mẫu `tha.feature` — hành vi là đơn vị, engine là dòng `Examples`:

```gherkin
Tính năng: Bé thả một vật vào một đích

  Bối cảnh:
    Cho một level <engine> band <band> đang chạy
    Và khung canvas 1200×675 px CSS

  Kịch bản khung: thả trúng đích thì vật bám vào đích
    Khi bé cầm nguồn "<nguồn>" và nhấc ngón trên tâm đích "<đích>"
    Thì vật ở trạng thái "khoá" tại đích "<đích>"
    Và phản hồi là "pop_celebrate" tại điểm nhấc ngón
    Và cấm — NEVER có màu đỏ trên canvas

    Ví dụ:
      | engine | band | nguồn    | đích      |
      | GT-003 | 3-4  | item_1   | nest_1    |
      | GT-008 | 4-5  | shape_2  | slot_2    |
      | GT-021 | 4-5  | wing_1   | mirror_1  |

  Kịch bản khung: nhấc ngón giữa hai đích thì vật về chỗ cũ
    Khi bé cầm nguồn "<nguồn>" và nhấc ngón ở điểm cách mọi đích quá <khoan_dung> px
    Thì vật về vị trí xuất phát bằng một nhịp 200ms
    Và cấm — NEVER ghi event trượt
    Và bộ đếm trượt của scaffolding cấm — NEVER tăng
```

Ba luật hình dạng:

- Một `Tính năng` = một cử chỉ ở §4.1 hoặc một luật xuyên suốt. Cấm — NEVER một
  tính năng = một engine.
- Mọi `Thì` phải đo được ở bề mặt bé chạm: trạng thái vật, phản hồi, event,
  toạ độ. Cấm — NEVER `Thì` nào nói về tên method.
- Engine đứng ở `Examples`. Engine mới chỉ thêm dòng, không thêm file.

## 6. Nhịp 3 — Tự động hoá qua bề mặt thật

Binding cấm — NEVER chạm vào method session. Nó đi đúng đường bé đi:

```
toạ độ client px  →  toLogicPoint()  →  hitTest(slots)  →  EngineInput.dispatch()  →  session
```

Hai tầng:

| Tầng | Chạy gì | Bao nhiêu |
|---|---|---|
| vitest + `@amiceli/vitest-cucumber` | toàn bộ 12 feature, canvas ảo nhiều cỡ khung (960×540 · 1200×675 · 800×450 · 375×211) | mọi kịch bản |
| Playwright | một engine mỗi họ trên trình duyệt thật, chạm bằng toạ độ CSS thật | 3 ca khói |

Bốn cỡ khung là ca âm của §1.2: khung 960×540 che lỗi vì `scale` = 1, ba cỡ còn
lại phơi nó ra. Đây là ca âm mà `BR-ESS-09` đòi.

## 7. Nhịp 4 — Thiết kế rơi ra

Viết **sau khi** feature đỏ, và chỉ đủ để feature xanh.

### 7.1 `EngineInput` — hợp đồng nhập tường minh

Thay duck-typing bằng một bảng session tự khai:

```ts
type PlayVerb = "tap" | "drop" | "stroke" | "adjust" | "commit" | "revert";

interface EngineInput {
  readonly verbs: readonly PlayVerb[];
  dispatch(gesture: Gesture): ActionResult;   // thuần, BR-ENG-13
  readonly tapFallback?: { source: string; target: string };
}
```

Trang chơi không còn đoán tên. Nó gửi cử chỉ, engine tự dịch. Nhánh
`tryOtherAction` mã chết bị gỡ, và `flipCard`/`tapObject` — hai tên không tồn tại —
chết theo.

### 7.2 Ba spec

| Spec | Sở hữu |
|---|---|
| `engine-play-language.md` mới | §4 — sáu cử chỉ, ba nhịp hệ, năm trạng thái vật. `BR-EPL-01`… |
| `engine-input-contract.md` mới | `EngineInput`, vòng đời con trỏ ba họ, hit band, fallback chạm-chạm, nuốt input, leo thang nhắc. `BR-EIC-01`… |
| `engine-spec-sheet.md` sửa | §17 mới của spec engine: khai cử chỉ dùng, vai nguồn/đích, khoan dung, và **trỏ** tới feature file. `BR-ESS-15` · `BR-ESS-16` |

§17 của spec engine dài khoảng mười lăm dòng, cấm — NEVER chứa Gherkin. Gherkin ở
`.feature`, một nguồn.

### 7.3 Ba họ nhập và 27 engine

| Họ | Vòng đời con trỏ | Engine | Số |
|---|---|---|:--:|
| `tap` | `down` → hit → khoá | GT-001·002·009·010·011·012·016·017·018·020·022·025·026·027 | 14 |
| `drag-drop` | `down` → `move` bám ngón → `up` snap hoặc trả về | GT-003·004·005·006·007·008·014·015·019·021·023 | 11 |
| `stroke` | `down` → chuỗi `move` lấy mẫu → `up` chấm nét | GT-013·024 | 2 |

13 engine họ `drag-drop`/`stroke` bắt buộc có fallback chạm-chạm (`BR-ENG-06`) —
đúng 13 engine hôm nay không có đường nhập nào.

## 8. Kế hoạch

| Pha | Nhịp | Việc | Ra cái gì |
|---|---|---|---|
| P1 ✅ | khám phá | Bảng ví dụ 7 câu × 27 engine — **xong 2026-08-31**, 189 ô, 21 lỗ hành vi | [`166-vi-du.md`](166-vi-du.md) |
| P2 | khám phá | Chốt ngôn ngữ chung, viết `engine-play-language.md` | 1 spec mới |
| P3 | diễn đạt | Sáu feature cử chỉ | 6 `.feature` |
| P4 | diễn đạt | Sáu feature xuyên suốt | 6 `.feature` |
| P5 | tự động hoá | `toLogicPoint` chuyển vào `interaction.ts`; harness con trỏ 4 cỡ khung | 1 module + harness |
| P6 | tự động hoá | Binding 12 feature. **Kỳ vọng: đỏ** — ghi lại đỏ ở đâu, vì sao | báo cáo đỏ ban đầu |
| P7 | thiết kế | `engine-input-contract.md` + `EngineInput` | 1 spec mới + interface |
| P8 | thiết kế | `engine-spec-sheet.md` 16 → 17 mục; §17 cho 27 spec; nâng cổng `check-engine-specs.ts` | 1 spec sửa + 27 spec + cổng |

Task 167 (mã, tách riêng): áp `scale` trong `setupCanvas`; 27 session cài
`EngineInput`; nối `pointermove`/`pointerup`; nối `hint_after_ms` vào
`ScaffoldingSystem`; gán `degradation`; gỡ dispatcher duck-typing. Xong khi 12
feature xanh.

## 9. Cổng và ca âm

| Cổng | Bắt gì | Ca âm bắt buộc |
|---|---|---|
| `test:features` | 12 feature qua bề mặt thật | Bỏ `scale` trong `setupCanvas` → `toa-do.feature` đỏ ở 3 trên 4 cỡ khung |
| `check:engine-specs` §17 | Spec thiếu §17, hoặc khai cử chỉ không có trong `verbs` của session | Xoá một `PlayVerb` khỏi session → đỏ |
| phủ hành vi | Mọi engine trong registry có mặt ở `Examples` của đúng một feature họ | Thêm GT-028 không thêm dòng → đỏ |
| Playwright khói | 3 ca, chạm bằng toạ độ CSS thật | Lệch hit test 1,25 → đỏ |

## 10. Cấm — NEVER

- Cấm — NEVER viết feature file mô tả hành vi hiện tại. Feature mô tả hành vi đúng;
  nó đỏ trước, mã đuổi theo.
- Cấm — NEVER binding nào gọi thẳng method session. Đó là lỗi của
  `all-templates-interactive-harness.test.ts`, cấm lặp lại.
- Cấm — NEVER một tính năng cho một engine. Engine là dòng `Examples`.
- Cấm — NEVER chép Gherkin vào markdown spec. Spec trỏ tới `.feature`.
- Cấm — NEVER khai lại sàn touch trong feature. Dẫn từ `BR-A11-04`.
- Cấm — NEVER thêm cử chỉ thứ bảy mà không sửa `engine-play-language.md` trước.
- Cấm — NEVER pinch, xoay hai ngón, drag tính giờ (`BR-ENG-12`).
