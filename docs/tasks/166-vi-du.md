---
task: 166
title: Bảng ví dụ — bảy câu hành vi × 27 engine
status: draft
created: 2026-08-31
depends_on:
  - GAME-ENGINE-RUNTIME
  - SCAFFOLDING-AND-HINTS
  - ACCESSIBILITY
---

# Bảng ví dụ — nhịp khám phá của task 166

Đầu vào của `.feature`. Mỗi engine trả lời bảy câu. Mỗi câu hai vế:

- **Hôm nay** — đo được trong mã ngày 2026-08-31. Sự thật, không phán xét.
- **Phải là** — quyết định hành vi. Đây là thứ đi vào `Examples` của feature file.

Vế "phải là" nào lệch vế "hôm nay" thì đó là một kịch bản **sẽ đỏ** ở P6. Đếm được.

## 1. Bảy câu

1. Bé đặt ngón ngoài mọi đích thì gì xảy ra?
2. Bé thả giữa hai đích — bám đích nào, khoan dung bao nhiêu?
3. Bé nhấc ngón giữa chừng khi đang cầm — vật ở lại hay về chỗ cũ?
4. Fallback chạm-chạm của engine này là chạm gì rồi chạm gì?
5. Bao nhiêu lâu không thao tác thì `nhắc` cấp 1 hiện, và hiện ở đâu?
6. Chạm lần hai vào đích đã chọn — bỏ chọn hay giữ?
7. Phiên đã thắng mà bé còn chạm — nuốt hay không?

## 2. Mặc định toàn hệ — engine chỉ ghi phần lệch

| Câu | Mặc định "phải là" | Nguồn |
|---|---|---|
| 1 | Không method nào chạy. Không phản hồi. `missStreak` cấm — NEVER tăng. Nền cấm — NEVER là câu trả lời sai | `BR-ENG-07` — sai phải có phản hồi, nên cái không phải "sai" thì cấm phát phản hồi sai |
| 2 | Đích gần nhất trong bán kính `max(hitW, hitH) / 2 + 24px` tính từ tâm đích. Hai đích cách đều thì cấm — NEVER bám, vật về chỗ cũ | Khoan dung phải rộng hơn hit band vì ngón trẻ che chính điểm nó nhắm |
| 3 | Về chỗ cũ bằng một nhịp 200ms. Cấm — NEVER ghi event trượt, cấm tăng `missStreak` | Nhấc ngón giữa chừng là đổi ý, không phải trả lời sai |
| 4 | Chạm nguồn → nguồn vào trạng thái `nhắm` → chạm đích → `thả`. Chạm nguồn lần hai thì bỏ `nhắm` | `BR-ENG-06`, và `PlacementMechanic.stageItem` đã có sẵn nguyên thuỷ |
| 5 | Đồng hồ **duy nhất** là `SCAFFOLDING_BY_BAND`: L1 sau 10s (3-4) · 15s (4-5) · 20s (5-6), hoặc đủ `l1_misses`. L1 = vòng hổ phách quanh **một** đích ở `focusIndex`. `difficulty.hint_after_ms` bị **bỏ khỏi contract** | Ba đồng hồ (§3) thì không đồng hồ nào đúng. `BR-SCF-05` đã sở hữu ngưỡng theo band |
| 6 | Engine chọn-một: giữ, cấm — NEVER bỏ chọn. Engine chọn-nhiều: bỏ chọn | Chọn-một mà bỏ chọn được thì bé mất đáp án đã đúng |
| 7 | Nuốt. Không method nào chạy, không event thêm, đúng một `game_completed` | `completeSession()` đã chống gọi hai lần; tầng nhập phải chống theo |

### 2.1 Ba đồng hồ gợi ý hôm nay

| Nguồn | Khoảng | Ai đọc |
|---|---|---|
| `game-template-contract.md:174` | `hint_after_ms` 8000–40000 | không ai |
| `templates/GT-0NN/template.ts` | `hint_after_ms` 5000–40000, mỗi engine một khoảng | không ai |
| `systems/scaffolding.ts` `SCAFFOLDING_BY_BAND` | L1 10s/15s/20s theo band | `core.ts:188` gọi `tick()` rồi bỏ giá trị trả về |

Quyết định: giữ đồng hồ theo band, gỡ `hint_after_ms`. Một đồng hồ.

### 2.2 Hai sự thật nền, đúng cho cả 27

- **Không engine nào kết thúc được một level trên trình duyệt.** `showVictoryModal`
  chỉ bật trong `onAllRoundsCompleted` (`[code].vue:419`), cần
  `roundRunner.completeCurrentRound()` — `grep` toàn app → 0 lần gọi. Nhánh một
  round không nối victory. `engine.on(...)` chưa từng đăng ký, nên
  `game_completed` không rời engine.
- **Hai vế hệ toạ độ lệch 1,25 lần** ở khung 1200×675 (`setupCanvas` tính `scale`
  rồi không áp). Mọi con số px trong tài liệu này là **toạ độ logic 960×540**.

## 3. Lô 1 — GT-001 … GT-009

### GT-001 · chạm · `tap-select`

Nguồn: `options[]`. Đích: chính ô option. `target_item` chỉ là thẻ mẫu, cấm nhận chạm.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | `findHitSlot` trả −1 → không gì. Đúng | mặc định |
| 2 | không áp dụng | không áp dụng |
| 3 | không áp dụng | không áp dụng |
| 4 | không cần (`requires_tap_fallback: false`) | không cần |
| 5 | `hint_after_ms` 5000–30000 khai, không ai đọc | mặc định — L1 quanh option đúng |
| 6 | `onItemLocked` chạy lại, đặt state `wrong` lần nữa, rung lại 400ms | giữ. Chạm lại option **đúng** sau khi đã thắng thì rơi vào câu 7 |
| 7 | `winSession()` đã chạy nhưng tầng nhập không nuốt — `onItemLocked` vẫn ghi `item_selected` | mặc định — nuốt |

Ghi chú: `winSession()` gọi thẳng trong `onItemLocked` khi `is_correct`, không qua
`checkWinCondition()`. Hành vi đúng, nhưng nghĩa là `checkWinCondition()` không phải
cửa duy nhất — tầng nhập phải hỏi `checkWinCondition()` trước mỗi cử chỉ.

### GT-002 · chạm + chốt · `tap-select-multi`

Nguồn: `items[]`. Đích: chính ô item. Kết thúc bằng **chốt**.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không gì | mặc định |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | `hint_after_ms` 8000–35000, không ai đọc | mặc định |
| 6 | `toggleItemSelection` bật/tắt được | giữ — engine chọn-nhiều thì bỏ chọn được |
| 7 | không nuốt | mặc định |

**Lỗ hành vi:** `onSubmitSelection` là cửa duy nhất gọi `winSession()`, và không có
nút chốt nào trong DOM. Bé bật/tắt mãi không kết thúc. Cử chỉ `chốt` phải có bề mặt
riêng — nút chốt trong lớp 2 của hợp đồng vẽ, sàn chạm `BR-A11-04`.

Nộp sai: mọi item đang chọn mà `!is_correct` đổi state `wrong`, lựa chọn **không bị
xoá**. Giữ — bé sửa tiếp, không phải làm lại từ đầu.

### GT-003 · thả · `drag-to-container`

Nguồn: `items[]`. Đích: **một** `container`, vẽ ở `slots.at(-1)`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | `onItemDropped` nhận ID, không nhận toạ độ — câu hỏi không tới được | mặc định |
| 2 | không có khái niệm khoan dung | mặc định. Một đích nên "gần nhất" luôn là nó; ngoài bán kính thì về chỗ cũ |
| 3 | không có `pointerup` | mặc định |
| 4 | `PlacementMechanic.stageItem` có sẵn, không ai gọi | chạm item → `nhắm` → chạm container → `thả` |
| 5 | `hint_after_ms` 6000–30000, không ai đọc | mặc định — L1 quanh container |
| 6 | không áp dụng | chạm item đang `nhắm` lần hai thì bỏ `nhắm` |
| 7 | không nuốt | mặc định |

**Lỗ hành vi:** thả vào container lạ → `resolveDrop` trả `undefined` → **return im
lặng**, không event, không phản hồi. Vi phạm `BR-ENG-07` ("im lặng cũng là defect").
Phải là: `amber_soft` tại điểm thả + vật về chỗ cũ.

### GT-004 · thả · `sort-groups`

Nguồn: `items[]`. Đích: `groups[]` 2–4 rổ.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không tới được | mặc định |
| 2 | không có | mặc định — nhiều rổ nên hoà là có thật, hoà thì về chỗ cũ |
| 3 | không có | mặc định |
| 4 | không ai gọi `stageItem` | chạm item → chạm rổ |
| 5 | 8000–40000, không ai đọc | mặc định — L1 quanh **rổ đúng** của item ở `focusIndex` |
| 6 | không áp dụng | bỏ `nhắm` |
| 7 | không nuốt | mặc định |

**Lỗ hành vi:** thả sai rổ chỉ `recordEvent("item_sorted", {is_correct:false})` —
**không đổi state, không phản hồi thị giác**, vật vẫn nằm nguyên chỗ nguồn. Bé không
biết mình đã thao tác. Phải là: `amber_soft` trên rổ sai + vật về chỗ cũ + `onMiss()`.

### GT-005 · thả · `pair-match`

Nguồn: `pairs[].left`. Đích: `pairs[].right`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không tới được | mặc định |
| 2 | không có | mặc định |
| 3 | không có | mặc định |
| 4 | `PairingMechanic` **đã giữ staged left** — tức engine này vốn là chạm-chạm | chạm trái → `nhắm` → chạm phải → `thả`. Kéo là đường thứ hai, không phải đường chính |
| 5 | 6000–30000, không ai đọc | mặc định — L1 quanh vế phải đúng của cặp đang `nhắm` |
| 6 | không áp dụng | chạm lại vế trái đang `nhắm` thì bỏ `nhắm` |
| 7 | không nuốt | mặc định |

**Lỗ hành vi:** `onPairMatched` **không có nhánh else**. Cặp sai → `findPair` trả
`undefined` → return im lặng. Vi phạm `BR-ENG-07`. Phải là: `amber_soft` trên cả hai
vế, `drawMatchLine` cấm — NEVER vẽ, `onMiss()`.

### GT-006 · thả (đổi chỗ) + chốt · `sequence-order`

Nguồn: `sequence[]` toa tàu. Đích: **vị trí index** trên ray, không phải trường content.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không tới được | mặc định |
| 2 | không có | đích là khe giữa hai toa; khoan dung nửa bề rộng toa |
| 3 | không có | mặc định |
| 4 | không ai gọi | chạm toa A → `nhắm` → chạm toa B → **hoán vị** A và B |
| 5 | 10000–40000, không ai đọc | mặc định — L1 quanh toa sai vị trí **đầu tiên** tính từ trái |
| 6 | không áp dụng | bỏ `nhắm` |
| 7 | không nuốt | mặc định |

**Lỗ hành vi:** hai chỗ. `reorderSteps` return sớm khi `mechanic.reorder` trả false,
**không event, không phản hồi**. Và `onSubmitSequence` sai chỉ ghi event — không đổi
state. Phải là: đổi chỗ không hợp lệ thì toa về chỗ cũ; chốt sai thì `amber_soft`
trên toàn dải + giữ nguyên thứ tự bé đã xếp.

Thiếu bề mặt **chốt** giống GT-002.

### GT-007 · thả · `number-bond`

Nguồn: `options[]`. Đích: `parts[]` có `is_target === true`. `whole` cấm nhận thao tác.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không tới được | mặc định |
| 2 | không có | mặc định |
| 3 | không có | mặc định |
| 4 | không ai gọi | chạm option → chạm ô part trống |
| 5 | 6000–30000, không ai đọc | mặc định — L1 quanh ô part trống đầu tiên |
| 6 | không áp dụng | bỏ `nhắm` |
| 7 | không nuốt | mặc định |

**Lỗ hành vi:** `checkWinCondition()` trả `true` **ngay** khi không part nào có
`is_target`. Một `content_pack` parse sạch mà không có part mục tiêu thì thắng trước
khi bé chạm. Phải là: 0 part mục tiêu là content **không hợp lệ** — cổng seed đỏ,
runtime cấm — NEVER thắng.

`onPartFilled(optionId, partId?)` — `partId` optional. Với ≥2 part mục tiêu thì
"điền vào part nào" là không xác định. Phải là: `partId` bắt buộc khi có ≥2 part.

### GT-008 · thả · `drag-to-slot`

Nguồn: `items[]`. Đích: `slots[]`, mỗi ô chờ đúng một `expected_item_id`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không tới được | mặc định |
| 2 | không có | mặc định. Ô kề nhau trên `horizontal-slot-track` nên hoà xảy ra thật |
| 3 | không có | mặc định |
| 4 | không ai gọi | chạm item → chạm ô |
| 5 | 6000–30000, không ai đọc | mặc định — L1 quanh ô trống đầu tiên theo thứ tự đọc |
| 6 | không áp dụng | bỏ `nhắm` |
| 7 | không nuốt | mặc định |

**Lỗ hành vi:** cùng loại GT-007 — `content.slots` rỗng → `checkWinCondition()` trả
`true`. Thắng trước khi chạm.

Thả vào ô đã có vật: hôm nay không định nghĩa. Phải là: vật cũ về khay, vật mới vào ô
(**hoàn** ngầm), một nhịp 200ms, cấm — NEVER coi là trượt.

### GT-009 · chạm + lộ · `clue-deduction`

Nguồn: hai loại — `clues[]` (lật) và `candidates[]` (chọn). Đích: ứng viên đúng.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không gì | mặc định |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần (`requires_tap_fallback: false`) | không cần |
| 5 | 6000–30000, không ai đọc | mặc định. L1 = lật hộ **một** manh mối chưa lật, cấm — NEVER chỉ thẳng đáp án (`BR-SCF-04`) |
| 6 | `onClueRevealed` return sớm nếu clue đã lật | giữ — manh mối đã lật thì cấm lật lại, và cấm — NEVER coi là trượt |
| 7 | không nuốt | mặc định |

**Lỗ hành vi:** `onCandidateSelected` **không có nhánh else**. Chọn ứng viên sai →
im lặng hoàn toàn. Vi phạm `BR-ENG-07` nặng nhất trong lô: đây là engine suy luận,
bé cần biết mình vừa loại sai. Phải là: `amber_soft` trên ứng viên đã chọn,
`onMiss()`, ứng viên **không** bị loại khỏi bàn.

`validateAction` trả `ACTION_IGNORED` cho `reveal_clue` — đúng: lật manh mối là
`lộ`, không phải câu trả lời, nên cấm — NEVER sinh phản hồi đúng/sai.

## 4. Lô 2 — GT-010 … GT-018

### GT-010 · chỉnh + chạm · `substitution`

Nguồn: `options[]` thẻ số. Đích: không có ô đích. `equations[]` chỉ để nhìn.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không gì | mặc định |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | 6000–30000, không ai đọc | mặc định — L1 quanh phương trình chưa giải đầu tiên |
| 6 | `selectValue` không bỏ chọn được | giữ — chọn-một |
| 7 | không nuốt | mặc định |

**Hai cử chỉ, một cửa thắng.** `pinSymbolValue(symbolId, value)` là **chỉnh** — ghim
giá trị nháp cho một ký hiệu, `validateAction` trả `ACTION_IGNORED` cho `pin_symbol`.
Đúng: ghim là nháp, cấm — NEVER sinh phán quyết đúng/sai. Nhưng hôm nay ghim
**không có bề mặt nào** trên canvas. Phải là: ghim là cử chỉ hạng nhất, có ô nháp
cạnh mỗi ký hiệu, và L1 gợi ý ghim trước khi gợi ý đáp án.

### GT-011 · lộ + chạm · `matrix-choice`

Nguồn: `options[]`. Đích: đúng một ô trống trong `matrix.cells[]`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không gì | mặc định |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | 6000–30000, không ai đọc | mặc định — L1 quanh ô trống của ma trận, cấm — NEVER quanh option đúng (`BR-SCF-04`) |
| 6 | không áp dụng | giữ — chọn-một |
| 7 | không nuốt | mặc định |

`onOptionPreviewed(optionId)` là **lộ**: đặt thử option vào ô trống để nhìn, không
chốt. Đúng về sư phạm — trẻ 5–6 cần thử trước khi cam kết. Hôm nay không bề mặt nào
gọi nó. Phải là: giữ ngón trên option → xem thử; nhấc ngón mà chưa rời option →
chốt. Cấm — NEVER dùng long-press (đã dành cho thoát, `BR-ENG-12`) — dùng
`pointerdown` giữ tại chỗ.

**Lỗ hành vi:** `onOptionSelected` với id lạ return sớm, không event. Im lặng.

### GT-012 · lộ + chạm · `flash-recall`

Nguồn: `options[]` thẻ số. `flash_items[].asset` loé rồi đậy nắp, cấm nhận chạm.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không gì | mặc định |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | 6000–30000, không ai đọc | mặc định. L1 = **lộ lại** một lần (`replayFlash`), cấm — NEVER chỉ thẳng thẻ số |
| 6 | không áp dụng | giữ |
| 7 | không nuốt | mặc định |

Engine duy nhất trong lô có `update(deltaMs)` thật: `FlashTimer` đếm `flash_ms`
800–3000, chuyển `running → expired`, ghi `flash_hidden`. Cử chỉ trong lúc còn loé
phải bị **nuốt** — bảng câu 7 mở rộng: nuốt không chỉ sau thắng mà cả trong cửa sổ
`lộ`.

**Lỗ hành vi:** `checkWinCondition()` so `selectedValue === content.flash_items.length`
— **bỏ qua `is_correct` của options**. Một `content_pack` mà option đánh dấu đúng có
`value` khác số vật thì bé chọn đúng theo nhãn vẫn thua, và chọn thẻ sai nhãn lại
thắng. Hai nguồn sự thật cho một đáp án. Phải là: `is_correct` là nguồn duy nhất, và
cổng seed đỏ khi `is_correct` lệch `flash_items.length`.

### GT-013 · nét + chốt · `maze-route`

Nguồn: chính ngón tay. Đích: ô kề tiếp theo, đích cuối `grid.goal`, qua đủ `required_cells`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | `canMove` sai → `ACTION_IGNORED` | mặc định |
| 2 | ô kề, không có khoan dung px | nét bám ô mà tâm ngón gần nhất, trong bán kính nửa cạnh ô + 16px |
| 3 | không có `pointerup` | nhấc ngón **giữ nguyên** đường đã đi. Nét là tích luỹ, cấm — NEVER xoá khi nhấc |
| 4 | **content đã có** `input_mode: "draw" \| "arrows"` | `arrows` là fallback chính thức. Band 3-4 cấm engine này nên fallback phục vụ vận động tinh yếu, không phải tuổi |
| 5 | 6000–30000, không ai đọc | mặc định — L1 sáng ô kề đúng tiếp theo, **một** ô (`BR-ENG-09`) |
| 6 | đi lại ô đã đi | phải là: lùi về, cắt đuôi đường tại ô đó. Cấm — NEVER coi là trượt |
| 7 | không nuốt | mặc định |

`winSession()` **chỉ** trong `onPathSubmitted()` — tới đích không tự thắng. Cần bề
mặt **chốt** như GT-002 và GT-006. Ba engine cùng thiếu một thứ.

Hành vi tốt sẵn có, giữ nguyên: đâm tường ở ngõ cụt thì tự lùi về ngã ba
(`retreated_to`) và ghi `path_blocked`.

### GT-014 · thả + hoàn + chạm · `balance-scale`

Nguồn: `tray[]` vật có `weight`. Đích: `left_pan` / `right_pan`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không tới được | mặc định |
| 2 | không có | hai đĩa cách xa nhau nên hoà hiếm; ngoài bán kính thì về khay |
| 3 | không có | mặc định |
| 4 | không ai gọi | chạm vật → chạm đĩa |
| 5 | 6000–30000, không ai đọc | mặc định — L1 quanh **đĩa nhẹ hơn** khi goal là `balance` |
| 6 | không áp dụng | bỏ `nhắm` |
| 7 | không nuốt | mặc định |

**Lỗi đúng-sai, không phải lỗi tầng nhập.** `validateAction` nhánh `select_side`:

```ts
const expected = leftW > rightW ? "left" : "right";
```

Luôn kỳ vọng **bên nặng**, kể cả khi `content.goal === "pick_lighter"`.
`checkWinCondition()` thì có rẽ nhánh theo `goal` đúng. Nên với `pick_lighter`, bé
chọn đúng bên nhẹ sẽ nhận `ACTION_RETRY` — nhịp hổ phách "thử lại" — trong khi phiên
đã thắng. Phản hồi mâu thuẫn với kết quả.

**Lỗ hành vi thứ hai:** `resolveSlots` dùng `slotCount = this.trayItems.length` —
**state hiện tại**, không phải `content.tray.length`. Mỗi lần bé đặt một vật lên đĩa,
khay còn ít vật hơn, layout tính lại, **mọi vật còn lại nhảy chỗ**. Vi phạm
`BR-ENG-13` tinh thần (layout tính một lần, tính lại chỉ khi resize) và là lỗi thị
giác nhìn thấy được. Phải là: `slotCount` từ `content.tray.length`, ô trống giữ chỗ.

`returnItemToTray` là **hoàn** — engine duy nhất trong 27 có cử chỉ này tường minh.

### GT-015 · chạm + thả + hoàn · `sudoku-mini`

Nguồn: `symbols[]` bảng màu. Đích: ô `cells[]` có `symbol_id === null`. Ô đầu khoá.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | ô không tồn tại hoặc `isInitial` → `ACTION_IGNORED` | mặc định. Chạm ô khoá phải có phản hồi **nhẹ** khác im lặng: nhịp "ô này cố định" |
| 2 | ô lưới kề nhau | mặc định |
| 3 | không có | mặc định |
| 4 | **đã là chạm-chạm sẵn**: `selectSymbol` rồi `fillCell` | giữ. Kéo là đường thứ hai |
| 5 | 6000–30000, không ai đọc | mặc định — L1 quanh ô trống có ít khả năng hợp lệ nhất |
| 6 | `clearCell` xoá ô | giữ — **hoàn** |
| 7 | không nuốt | mặc định |

**Vi phạm `BR-ENG-07` trực tiếp:** nước đi gây xung đột vẫn được ghi vào ô, rồi
**tô đỏ** cả ô sai lẫn ô xung đột. `BR-ENG-07` viết rõ: "Cấm đỏ, cấm buzzer, cấm trừ
điểm". Phải là: hổ phách trên ô vừa điền + hổ phách nhạt trên ô xung đột, giữ nguyên
giá trị để bé tự thấy và tự `hoàn`.

### GT-016 · chỉnh + chạm + chốt · `clock-hands`

Ba chế độ trong một engine: `read` (chạm thẻ giờ) · `set` (xoay kim rồi chốt) ·
`match` (ghép thẻ hoạt động với giờ).

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không gì | mặc định |
| 2 | không có | mode `set`: kim bám nấc `minute_step` (30 hoặc 60), khoan dung nửa nấc |
| 3 | không có | mode `set`: nhấc ngón **giữ** góc kim đang có. Kim là chỉnh, không phải kéo-thả |
| 4 | `requires_tap_fallback: true` nhưng không đường nào | mode `set`: hai nút ±nấc cạnh mặt đồng hồ |
| 5 | 6000–30000, không ai đọc | mặc định — L1 khác nhau theo mode |
| 6 | không áp dụng | mode `read`/`match`: giữ |
| 7 | không nuốt | mặc định |

**Lỗ hành vi:** `matchCard` sai giờ trả `false` và **không ghi event nào**. Im lặng.
Vi phạm `BR-ENG-07`.

Ba mode trong một engine nghĩa là ba hợp đồng nhập. Câu hỏi mở: tách thành ba engine,
hay §17 khai ba nhánh theo `content.mode`? Đề xuất: một §17, ba nhánh — tách engine
sẽ phá song ánh `BR-ESS-01` với registry.

### GT-017 · chỉnh + chạm · `block-stack`

Nguồn: `options[]`. Đích: không có ô đích. `model[]` chỉ để nhìn và xoay.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không gì | mặc định |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | 6000–30000, không ai đọc | mặc định. L1 = xoay hộ mô hình **một** nấc, cấm — NEVER chỉ đáp án |
| 6 | không áp dụng | giữ |
| 7 | không nuốt | mặc định |

`rotateModel(direction)` là **chỉnh** — bốn góc `[0,90,180,270]`, vòng bằng
`(idx+1)%4`. Cấm — NEVER cử chỉ xoay hai ngón (`BR-ENG-12`); phải là hai nút xoay.

**Lỗ hành vi:** `allow_rotate === false` thì `rotateModel` trả góc hiện tại, không
ghi event, không phản hồi. Bé bấm nút xoay mà không có gì xảy ra. Phải là: nút xoay
**cấm — NEVER vẽ** khi `allow_rotate` tắt.

### GT-018 · chạm + thả + chốt · `listen-respond`

Hai chế độ: `select` (chạm vật) · `sequence` (sắp thứ tự rồi chốt).

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | id lạ → `ACTION_IGNORED` | mặc định |
| 2 | mode `sequence`: không có | khe giữa hai vật, khoan dung nửa bề rộng |
| 3 | không có | mặc định |
| 4 | `requires_tap_fallback: false` nhưng mode `sequence` là kéo | mode `sequence` **phải** khai `true`: chạm A → chạm B → hoán vị |
| 5 | 5000–30000, không ai đọc | mặc định. L1 = **phát lại `audio_prompt`**, không phải highlight — đây là engine nghe |
| 6 | không áp dụng | mode `select` chọn-một: giữ |
| 7 | không nuốt | mặc định |

`audio_prompt` + `auto_play_audio` là engine duy nhất mà chỉ dẫn **là** nội dung, chứ
không phải phụ trợ. `BR-ENG-10` (chữ không đủ) ở đây thành: audio hỏng thì engine
này cấm — NEVER chơi được, phải báo lỗi thay vì tiếp tục im lặng.

Lệch tên nhỏ: `onSubmitSequence()` trả `ACTION_RETRY` đúng khi sai, nhưng
`validateAction` nhận type `"submit_order"` còn event ghi tên `"sequence_submitted"`.
Hai tên cho một việc — gom khi làm ngôn ngữ chung.

## 5. Lô 3 — GT-019 … GT-027

### GT-019 · chỉnh + thả · `rotate-transform`

Nguồn: `pieces[]` có `initial_rotation`/`initial_flip`. Đích: `target_slots[]` có
`target_rotation`/`target_flip`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không tới được | mặc định |
| 2 | không có | mặc định |
| 3 | không có | mặc định |
| 4 | `PlacementMechanic.stageItem` có, không ai gọi | chạm mảnh → chạm ô |
| 5 | 5000–30000, không ai đọc | mặc định. L1 = xoay hộ **một** nấc mảnh ở `focusIndex` |
| 6 | không áp dụng | bỏ `nhắm` |
| 7 | không nuốt | mặc định |

Engine duy nhất mà thắng cần **hai** điều kiện độc lập: đặt đúng ô **và** khớp
`rotation`+`flip`. Nên phản hồi phải phân biệt hai loại sai: sai ô (vật về chỗ cũ) và
đúng ô nhưng sai hướng (vật **ở lại ô**, nhịp hổ phách trên nút xoay). Hôm nay cả hai
đều trả `ACTION_RETRY` không phân biệt.

`rotation_step` là literal `90` — cấm — NEVER cử chỉ xoay tự do (`BR-ENG-12`).
`allow_flip: false` thì `validateAction` trả `ACTION_IGNORED` cho flip; nút lật phải
biến mất, không phải im lặng.

### GT-020 · chạm + hết nhịp · `memory-flip`

Nguồn: `pairs[]` làm phẳng thành `displayCards`, trộn theo `deriveStream`. Đích: thẻ
cùng `pair_key`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không gì | mặc định |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | 5000–30000, không ai đọc | mặc định. L1 = lật hé **một** thẻ khớp rồi úp lại |
| 6 | thẻ không ở `face_down` → `ACTION_IGNORED` | giữ — thẻ đang mở cấm chạm lại |
| 7 | không nuốt | mặc định |

**Engine hỏng nặng nhất trong 27.** `flip_back_delay_ms` (500–3000, mặc định 1200) và
`peek_all_initial_ms` (0–5000) **không được đọc ở đâu trong session**. Không
`update(deltaMs)`. `closeMismatch()` tồn tại nhưng cấu trúc gọi nó là bên ngoài —
không ai gọi. Nghĩa là **lật sai cặp thì hai thẻ nằm mở vĩnh viễn**, và trò chơi trí
nhớ mất chính cơ chế của nó.

Phải là: `update(deltaMs)` đếm `flip_back_delay_ms` rồi tự `closeMismatch()`. Đây là
cử chỉ **hết nhịp** của hệ, không phải việc của tầng UI. Và `peek_all_initial_ms` mở
toàn bàn lúc vào, đếm bằng cùng đồng hồ.

### GT-021 · thả · `mirror-complete`

Nguồn: `options[]` khớp bằng `asset_ref`. Đích: `target_slots[]` có
`expected_asset_ref`. `reference_pattern[]` chỉ để nhìn.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | không tới được | mặc định |
| 2 | không có | mặc định |
| 3 | không có | mặc định |
| 4 | không ai gọi | chạm option → chạm ô đối xứng |
| 5 | 5000–30000, không ai đọc | mặc định. L1 sáng **cặp** — ô mẫu bên này và ô trống đối xứng bên kia |
| 6 | không áp dụng | bỏ `nhắm` |
| 7 | không nuốt | mặc định |

Engine sạch nhất lô: `validateAction` phân biệt `ACTION_IGNORED` (tra không ra) và
`ACTION_RETRY` (sai `asset_ref`) đúng cách. Dùng làm mẫu cho `tha.feature`.

`show_axis_guide` tắt là biến thể khó — trục đối xứng biến mất khỏi lớp 2. Phải ghi
vào §17 vì nó đổi cái bé nhìn, không đổi cái bé chạm.

### GT-022 · chạm + lộ · `hidden-object`

Nguồn: không có vật cầm. Đích: `scene_objects[]` có `is_target`. Toạ độ thiếu thì
sinh xác định từ `deriveStream(layoutSeed, "items")`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | id không có trong `resolvedObjects` → `ACTION_IGNORED` | mặc định — nền cảnh rộng nên chạm trượt là chuyện thường, cấm — NEVER phạt |
| 2 | không áp dụng | vật chồng lớp: chạm trúng vật có `layer` **cao nhất** tại điểm đó |
| 3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | 5000–30000, không ai đọc | mặc định. L1 = khoanh vùng **một phần tư** cảnh chứa vật chưa tìm, cấm — NEVER chỉ thẳng vật |
| 6 | vật đã tìm ra | chạm lại vật đã tìm: nuốt, cấm — NEVER trượt |
| 7 | không nuốt | mặc định |

`is_hidden` + `layer` là engine duy nhất có **chiều sâu chồng lớp**. Hit test theo
slot chữ nhật của 26 engine kia không đủ — cần thứ tự lớp. Ghi vào hợp đồng nhập.

**Lỗ hành vi:** `onTapObject` không trả `ActionResult`, chỉ ghi telemetry
`is_target: false`. Chạm vật không phải mục tiêu → im lặng.

### GT-023 · thả · `construct`

Nguồn: `parts[]`. Đích: `anchors[]` có `x`, `y` **thật** trong 960×540.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | `onSnapPart` trả `null` khi ngoài `snap_radius_px` | mặc định + vật về chỗ cũ, cấm — NEVER im lặng |
| 2 | **`snap_radius_px` 30–100, mặc định 60** — engine duy nhất có khoan dung thật | giữ. Chuẩn hoá tên: khoan dung toàn hệ dùng chung tên này |
| 3 | không có `pointerup` | mặc định |
| 4 | không ai gọi | chạm mảnh → chạm mỏ neo |
| 5 | 5000–30000, không ai đọc | mặc định. L1 sáng mỏ neo của mảnh ở `focusIndex` |
| 6 | không áp dụng | bỏ `nhắm` |
| 7 | không nuốt | mặc định |

**`onSnapPart(partId, x, y)` là method duy nhất trong 27 engine nhận toạ độ.** Nó là
hình mẫu đúng của cử chỉ `thả`: tầng nhập đưa điểm nhấc ngón, engine tự phân giải
đích gần nhất. 10 engine `drag-drop` còn lại nhận ID và do đó đẩy việc phân giải ra
ngoài — ra đúng chỗ không ai làm. Hợp đồng nhập lấy chữ ký này làm chuẩn.

Ghi chú vẽ: `render` dựng slot từ `anchor.x/anchor.y` bằng `slotAtPoint`, **không**
dùng slot target của layout. Nên hit band của mỏ neo không đi qua `getTouchFloor` —
sàn chạm `BR-A11-04` không được bảo đảm ở engine này. Kiểm trong `san-cham.feature`.

### GT-024 · nét · `trace-path`

Nguồn: chính ngón tay. Đích: `waypoints[]` theo `order`, khoan dung `tolerance_px`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | ngoài `tolerance_px` → `ACTION_RETRY` | **sai**. Ngón đi giữa hai waypoint là chuyện bình thường của một nét. Phải là `ACTION_IGNORED`, cấm — NEVER trượt |
| 2 | `tolerance_px` 20–80, mặc định 40 | đổi tên về khoan dung chung |
| 3 | không có | nhấc ngón giữa nét: giữ tiến độ đã đi. Đặt lại ngón tiếp tục từ waypoint kế |
| 4 | `requires_tap_fallback: false` | **sai với `BR-ENG-06`** — nét là cử chỉ khó nhất. Fallback: chạm lần lượt từng chấm số |
| 5 | 5000–30000, không ai đọc | mặc định. L1 sáng chấm kế tiếp |
| 6 | không áp dụng | chạm lại chấm đã qua: nuốt |
| 7 | không nuốt | mặc định |

Đây là engine mà câu 1 và câu 4 **đảo mặc định**, và cả hai đều là lỗi hôm nay. Mọi
mẫu lấy dọc đường giữa hai chấm phải im lặng, không phải "thử lại" — nếu không, một
nét chữ O sẽ sinh hàng trăm lần trượt.

Ghi chú vẽ: `render` **không dùng `this.slots`**, vẽ thẳng `content.waypoints`. Cùng
vấn đề sàn chạm với GT-023.

### GT-025 · chạm · `spot-difference`

Nguồn: không có vật cầm. Đích: `differences[]` — chạm trúng `left_id` **hoặc**
`right_id` là tính.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | id không phải string → `ACTION_IGNORED`; id không thuộc `differences` → `ACTION_RETRY` | giữ `ACTION_RETRY` — ở engine tìm khác biệt, chạm vật giống nhau **là** một phán đoán sai, không phải trượt tay |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | 5000–30000, không ai đọc | mặc định. L1 khoanh **một nửa** bảng chứa khác biệt chưa tìm |
| 6 | điểm đã tìm → `ACTION_IGNORED` | giữ — nuốt |
| 7 | không nuốt | mặc định |

`content.target_count` **không được đọc ở đâu** trong session; thắng đếm theo
`differences.length`. Hai nguồn cho một số. Phải là: bỏ `target_count` khỏi content,
hoặc cổng seed ép `target_count === differences.length`.

### GT-026 · chạm + hết nhịp · `go-nogo`

Nguồn: không có. Đích: **một** ô kích thích `slots[0]`, hiện `go_stimulus` hoặc
`nogo_stimulus` theo `trials[i].kind`.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | `getState() !== "stimulus"` → `ACTION_IGNORED` | mặc định — chạm trong `isi_ms` bị nuốt |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | 5000–30000, không ai đọc | **engine này cấm — NEVER nhắc.** Gợi ý trong bài đo ức chế là làm hỏng phép đo. Gỡ `hint_after_ms` khỏi contract của GT-026 |
| 6 | không áp dụng | chạm lần hai trong cùng trial: nuốt (`hasActedCurrentTrial`) |
| 7 | không nuốt | mặc định |

Engine duy nhất mà **không chạm là câu trả lời đúng**. `update(deltaMs)` trả
`ACTION_CORRECT`/`ACTION_RETRY` cho phán quyết timeout, ghi
`action_type: "timeout_no_tap"`. Hợp đồng nhập phải cho phép **phản hồi phát ra từ
`update()`, không từ cử chỉ** — 26 engine kia không có nhu cầu này.

Lệch nhỏ: nhánh hết lượt trong `update()` gọi `completeSession()` chứ không
`winSession()`, sau khi tự đặt `isWon` theo ngưỡng 60%. Hai đường kết thúc phiên.

`stimulus_window_ms` 1000–3000 vs `BR-ENG-11` (cấm đồng hồ đếm ngược): cửa sổ kích
thích **không phải** đồng hồ đếm ngược vì nó cấm — NEVER hiển thị. Ghi rõ vào §17 để
người sau không gỡ nhầm.

### GT-027 · chạm + lộ · `rule-switch`

Nguồn: không có vật cầm. Đích: luật đang hiệu lực trong `rules[]`, đổi sau mỗi
`switch_after_trials` lần đúng.

| # | Hôm nay | Phải là |
|---|---|---|
| 1 | id lạ → `ACTION_IGNORED` | mặc định |
| 2–3 | không áp dụng | không áp dụng |
| 4 | không cần | không cần |
| 5 | 5000–30000, không ai đọc | **cấm — NEVER nhắc luật đang hiệu lực.** Nhắc là làm hỏng phép đo chuyển hướng. L1 chỉ được nhắc "nhìn lại tín hiệu" |
| 6 | không áp dụng | giữ |
| 7 | không nuốt | mặc định |

`update(deltaMs)` đếm `signal_duration_ms` 1000–4000 rồi tắt báo hiệu đổi luật — đây
là **lộ** do hệ phát, và là khoảnh khắc quan trọng nhất của engine. Cử chỉ trong lúc
báo hiệu: phải nuốt hay nhận? Quyết định: **nhận**, vì bé phản xạ theo luật cũ chính
là dữ liệu mà engine đo.

## 6. Kết toán

### 6.1 Hai mươi mốt lỗ hành vi có tên

| # | Engine | Lỗ | Vi phạm | Mức |
|---:|---|---|---|---|
| 1 | mọi engine | Không level nào kết thúc được: `completeCurrentRound()` không ai gọi, `engine.on()` không đăng ký | — | chặn |
| 2 | mọi engine | Vẽ và chạm lệch 1,25 lần ở khung 1200×675 | `BR-ENG-14` §7.1 | chặn |
| 3 | GT-020 | `flip_back_delay_ms` không ai đọc, không `update()` → thẻ sai nằm mở vĩnh viễn | — | chặn |
| 4 | GT-014 | `select_side` luôn kỳ vọng bên **nặng**, kể cả `goal: pick_lighter` → phản hồi ngược kết quả | — | chặn |
| 5 | GT-014 | `slotCount` lấy từ `trayItems.length` (state) → vật còn lại nhảy chỗ sau mỗi lần đặt | `BR-ENG-13` | cao |
| 6 | GT-015 | Tô **đỏ** ô sai và ô xung đột | `BR-ENG-07` cấm đỏ | cao |
| 7 | GT-024 | Mẫu giữa hai waypoint trả `ACTION_RETRY` → một nét chữ O sinh hàng trăm lần trượt | `BR-ENG-07` | cao |
| 8 | GT-024 | `requires_tap_fallback: false` cho cử chỉ nét | `BR-ENG-06` | cao |
| 9 | GT-018 | `requires_tap_fallback: false` trong khi mode `sequence` là kéo | `BR-ENG-06` | cao |
| 10 | GT-012 | Thắng so `flash_items.length`, bỏ qua `is_correct` → hai nguồn cho một đáp án | — | cao |
| 11 | GT-007 | 0 part `is_target` → `checkWinCondition()` trả `true` trước khi bé chạm | — | cao |
| 12 | GT-008 | `content.slots` rỗng → thắng trước khi chạm | — | cao |
| 13 | GT-003 | Thả vào container lạ → return im lặng | `BR-ENG-07` | cao |
| 14 | GT-004 | Thả sai rổ chỉ ghi event, không phản hồi thị giác | `BR-ENG-07` | cao |
| 15 | GT-005 | `onPairMatched` không có nhánh else → cặp sai im lặng | `BR-ENG-07` | cao |
| 16 | GT-009 | `onCandidateSelected` không có nhánh else → chọn sai im lặng | `BR-ENG-07` | cao |
| 17 | GT-016 | `matchCard` sai giờ không ghi event nào | `BR-ENG-07` | cao |
| 18 | GT-022 | `onTapObject` không trả `ActionResult` cho vật không phải mục tiêu | `BR-ENG-07` | cao |
| 19 | GT-006 | `reorderSteps` thất bại im lặng; chốt sai không đổi state | `BR-ENG-07` | cao |
| 20 | GT-023 · GT-024 | `render` dựng slot riêng, bỏ qua layout → sàn chạm không đi qua `getTouchFloor` | `BR-A11-04` | cao |
| 21 | GT-002 · GT-006 · GT-013 | Cử chỉ **chốt** không có bề mặt nào → chơi mãi không kết thúc | — | cao |

Chín engine im lặng khi bé trả lời sai. `BR-ENG-07` viết đúng chữ: **"im lặng cũng
là defect"**. Không cổng nào đang đo câu đó.

### 6.2 Ô lệch giữa "hôm nay" và "phải là"

| Họ | Engine | Ô lệch mỗi engine | Tổng |
|---|:--:|:--:|:--:|
| `tap` | 14 | 2 (câu 5, câu 7) | 28 |
| `drag-drop` | 11 | 6 (câu 1–5, 7) | 66 |
| `stroke` | 2 | 5 | 10 |
| | | | **104 / 189** |

Cộng 21 lỗ ở §6.1. Đó là số kịch bản **kỳ vọng đỏ** ở P6. Nếu P6 đỏ ít hơn nhiều thì
binding đang gọi tắt ở đâu đó — kiểm lại trước khi mừng.

### 6.3 Ví dụ nào vào feature nào

| Feature | Lấy ví dụ từ | Engine mẫu |
|---|---|---|
| `cham.feature` | câu 1, 6, 7 của 14 engine `tap` | GT-001 sạch nhất |
| `tha.feature` | câu 1–4 của 11 engine `drag-drop` | GT-021 sạch nhất; GT-023 cấp chữ ký chuẩn |
| `net.feature` | GT-013 · GT-024, gồm ca đảo mặc định câu 1 | GT-013 |
| `chinh.feature` | GT-010 ghim · GT-016 kim · GT-017 xoay · GT-019 xoay/lật | GT-019 |
| `chot.feature` | GT-002 · GT-006 · GT-013 · GT-016 `set` · GT-018 `sequence` | GT-018 |
| `hoan.feature` | GT-014 `returnItemToTray` · GT-015 `clearCell` · GT-008 thả đè | GT-014 |
| `toa-do.feature` | 27 engine × 4 cỡ khung | mọi engine |
| `fallback-cham-cham.feature` | 13 engine, cộng GT-024 và GT-018 phải đổi cờ | GT-005 (đã sẵn chạm-chạm) |
| `nhac.feature` | 25 engine; GT-026 · GT-027 là ca **cấm nhắc** | GT-009 |
| `sai-khong-phat.feature` | 9 engine im lặng ở §6.1 + GT-015 tô đỏ | GT-005 |
| `nuot-input.feature` | 27 engine sau thắng; cộng GT-012 lúc `lộ`, GT-026 lúc `isi` | GT-012 |
| `san-cham.feature` | 27 engine; GT-023 · GT-024 là ca âm sẵn có | GT-023 |

### 6.4 Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| 1 | GT-016 có ba mode (`read`/`set`/`match`) — một §17 ba nhánh, hay tách ba engine? Tách sẽ phá song ánh `BR-ESS-01` | `chinh.feature` · `chot.feature` | Engine |
| 2 | Gỡ `hint_after_ms` khỏi 27 contract là breaking change `BR-GTC-08` — làm trong task 167 hay task riêng? | P8 | Backend |
| 3 | GT-026 · GT-027 cấm nhắc: gỡ `hint_after_ms` riêng hai engine này, hay thêm cờ `hint_forbidden`? | `nhac.feature` | Sư phạm |
| 4 | Khoan dung chung `max(hitW,hitH)/2 + 24px` — con số 24 chưa đo trên trẻ thật | `tha.feature` | Sư phạm |
| 5 | GT-011 xem thử bằng giữ ngón tại chỗ — có đụng long-press thoát 800ms không? | `chinh.feature` | Engine |
