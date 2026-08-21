# Kế hoạch — Task #99: Thiết kế chín khuôn Montessori còn lại

> **Loại task:** thiết kế contract cộng cài đặt, chín lát dọc S/M.
> Checklist: [`99-montessori-template-designs-todo.md`](99-montessori-template-designs-todo.md).
> **Nối tiếp** [`Task #98`](98-montessori-corpus-intake-plan.md) — phần lô A và nhóm A1 của task đó đã xong trong cây làm việc.
> **Spec sở hữu:** [`montessori-template-batch.md`](../specs/01-platform/montessori-template-batch.md) mục 7.1.

## 1. Outcome

Mười một khuôn Montessori có mã và tên từ Task #98, nhưng chỉ **hai** khuôn có
`content_contract` thật. Chín khuôn còn lại mới có một dòng trong bảng — không đủ để ai ngồi
xuống viết code, và không đủ để người soạn nội dung biết mình sẽ điền gì.

File này đóng khoảng trống đó: mỗi khuôn một bản thiết kế đầy đủ — hình dạng contract, giới
hạn, điều kiện thắng, kiểm soát lỗi tự thân, ba mức gợi ý, và **ba level mẫu ánh xạ tới đúng
dạng bài nguồn**.

Nó cũng đảo lại thứ tự làm. Task #98 xếp theo chi phí engine. Đo lại ngày 2026-08-20 cho thấy
chi phí engine không còn là ràng buộc chặt nhất: **hạn ngạch nội dung mới là**. C1 đã dùng hết
trần, nên bốn khuôn chỉ phục vụ C1 có build xong cũng không seed được nội dung nào.

## 2. Baseline đo được (2026-08-20)

Cây làm việc đã đi trước tài liệu. Số đo, không phải ước lượng:

| Thứ | Trạng thái |
|---|---|
| Khuôn đã build | `GT-007` tách gộp số (`number-bond`) · `GT-008` kéo vào ô chứa (`drag-to-slot`) — cả hai có `template.ts`, `session.ts`, `fixtures.ts` |
| `LayoutId` | **16**, tăng từ 12. Bốn layout mới có **hàm hình học riêng**, không phải hàng registry |
| Hàm hình học | 9, tăng từ 5: thêm `computeNumberBondTreeLayout`, `computeTenFrameSplitLayout`, `computeHorizontalSlotTrackLayout`, `computeMatrixSlotGridLayout` |
| Từ vựng trục `mechanic` | 8 giá trị — đã thêm `number-bond` và `drag-to-slot` |
| Game level Montessori | **50**, mã từ `0101`, 19 file seeder |
| Lesson và activity Montessori | **21 lesson · 21 activity**, ba lô theo band |
| System engine mới | **0** — chưa system nào cho hẹn giờ, mê cung, cân, ràng buộc lưới, xoay kim, phối cảnh |
| Bảng tra dạng bài | [`activity-types-table.md`](../montessori/dataset/activity-types-table.md) có **59** mã `WB<nn>-D<n>` duy nhất, trong khi spec đếm **57** dạng bài. Lệch 2 |

Giả thuyết ở mục 7.3 của spec khuôn — bảy `LayoutId` mới chỉ là hàng registry — **đã bị bác bỏ
cho bốn hàng đầu**: chúng cần hàm hình học riêng. Ba hàng còn lại (`clue-board`,
`equation-rows`, `matrix-3x3`) vẫn chưa đo.

### 2.1 Hạn ngạch đã tiêu

| Competency | Trần | Đã dùng | Còn lại | Trạng thái |
|---|---:|---:|---:|---|
| C1 | 36 | 36 | **0** | Hết trần |
| C2 | 9 | 4 | 5 | Còn chỗ |
| C3 | 15 | 0 | 15 | Chưa chạm |
| C4 | 9 | **10** | −1 | **Vượt trần 1 level** |

Hai hàng phải xử lý trước khi seed thêm:

- **C4 vượt trần 1 level.** `BR-MGL-01` là trần cứng. Phải gỡ một level C4 khỏi lô, hoặc mở
  một quyết định người nới trần kèm lý do. Cấm để nguyên và seed tiếp.
- **C1 hết trần.** Bốn khuôn (`GT-010`, `GT-012`, `GT-014`, `GT-016`) chỉ phục vụ workbook C1.
  Build xong chúng hôm nay là build một khuôn không có nội dung nào seed được.
- **Mẫu số lệch 2.** Phép chia 33 nhận trên 24 hoãn của `D-RQ` tính trên 57. Bảng tra có 59 mã.
  Một trong hai sai, và hạn ngạch phụ thuộc vào nó — phải đối chiếu trước khi seed lô tiếp.

### 2.2 Nợ event chưa đăng ký

Tám tên event đang dùng trong code **không có** trong [`event-catalog.md`](../specs/00-foundation/event-catalog.md):
`item_selected` · `item_dragged` · `item_dropped` · `item_placed` · `step_reordered` ·
`sequence_submitted` · `bond_selected` · `part_filled`.

Nợ này có từ sáu khuôn gốc, không phải do lô Montessori. Chín khuôn mới sẽ thêm khoảng 20 tên
nữa, nên nó cần đóng **trước**, không phải sau.

## 3. Hai khuôn đã build làm khuôn mẫu

Chín bản thiết kế ở mục 4 theo đúng hình dạng mà `GT-007` và `GT-008` đã chứng minh chạy được:

```text
templates/<mã>/template.ts   Zod content + difficulty, defineTemplate({...})
templates/<mã>/session.ts    Session class, dựng trên nguyên thuỷ ở mechanics/
templates/<mã>/fixtures.ts   Ba level mẫu — KHÔNG tiêu hạn ngạch nội dung
```

`fixtures.ts` là chỗ ba level mẫu của `BR-MTB-06` sống. Chúng chứng minh contract dùng được,
và **không** đi qua `seed-content`, nên không tiêu hạn ngạch competency. Nội dung thật seed
riêng, theo bảng ở mục 5.

Quy ước contract đã chốt qua hai khuôn đầu, chín khuôn sau giữ nguyên:

- `...promptFields()` mở đầu mọi `content_contract`; `prompt` 4–80 ký tự.
- `assetSchema()` gọi **mỗi lần một instance mới** — dùng chung một hằng làm JSON Schema sinh `$ref`.
- Mảng luôn khai `.min()` và `.max()` khớp `limits`.
- `difficulty_contract` luôn có `hint_after_ms` và `allow_retry`; cấm field nội dung.
- `scoring` dùng `STANDARD_SCORING`.

## 4. Chín bản thiết kế

Ký hiệu: **CC** là `content_contract`, **DC** là `difficulty_contract`, **KSL** là kiểm soát
lỗi tự thân (`BR-MTB-14`).

### 4.1 `GT-009` — Loại trừ theo manh mối

| | |
|---|---|
| `mechanic` · `engine_session` | `clue-deduction` · `ClueDeductionSession` |
| Nguyên thuỷ · layout | `selection` · `clue-board` |
| Band · fallback tap | 4–6 · Không |
| `limits` | item 4–10 · distractor 3–9 · target 1–1 |
| `events` | `game_started` · `clue_revealed` · `candidate_eliminated` · `game_completed` |

**CC**: `candidates` mảng 4–10 `{ candidate_id, value: int 1–20, asset }` · `clues` mảng 1–3
`{ clue_id, text ≤40, predicate }` với `predicate` là union phân biệt theo `kind`
(`greater_than` · `less_than` · `not_equal` · `between`) · `answer_candidate_id`.
Hai `refine`: đúng **một** ứng viên thoả mọi manh mối; `answer_candidate_id` là ứng viên đó.

**DC**: `clue_count` 1–3 · `candidate_count` 4–10 · `hint_after_ms` · `allow_retry`.

**Thắng**: chạm đúng `answer_candidate_id`.

**KSL**: chạm một manh mối làm mọi ứng viên vi phạm nó **mờ đi và mang dấu gạch, vẫn hiển thị**.
Trẻ thấy tập thu hẹp dần và tự đi tới đáp án; hệ thống không phải báo sai lần nào.

**Gợi ý**: L1 nhấp nháy manh mối chưa dùng · L2 ghost hand chạm manh mối 1 và gạch nhóm vi phạm
· L3 lặp chậm, từng manh mối một.

### 4.2 `GT-010` — Thay thế biểu tượng

| | |
|---|---|
| `mechanic` · `engine_session` | `substitution` · `SubstitutionSession` |
| Nguyên thuỷ · layout | `selection` · `equation-rows` |
| Band · fallback tap | 4–6 · Không |
| `limits` | item 2–6 · distractor 1–5 · target 1–1 |
| `events` | `game_started` · `equation_solved` · `value_selected` · `game_completed` |

**CC**: `symbols` mảng 2–3 `{ symbol_id, asset }` · `equations` mảng 2–3
`{ equation_id, left: mảng 1–3 `symbol_id`, right_value: int 1–20 }` ·
`question` union `{ kind: "value", symbol_id }` hoặc `{ kind: "sum", symbol_ids: mảng 2–3 }` ·
`options` mảng 2–6 `{ value: int, is_correct }`.
`refine`: hệ có **đúng một** nghiệm nguyên dương, và đúng một `option` khớp nghiệm.

**DC**: `equation_count` 2–3 · `step_count` 1–3 · `distractor_count` 1–5 · `hint_after_ms` · `allow_retry`.

**Thắng**: chọn đúng giá trị.

**KSL**: giá trị vừa suy ra được **ghim lên biểu tượng ở mọi dòng cùng lúc**. Suy sai thì dòng
kế tiếp hiện ra một số không nguyên, và trẻ thấy ngay mà không cần dấu đỏ.

**Gợi ý**: L1 nhấp nháy dòng giải được trước · L2 ghost hand ghim giá trị vào dòng đó · L3 lặp
chậm, đọc lại phép thay.

### 4.3 `GT-011` — Ma trận chọn hình

| | |
|---|---|
| `mechanic` · `engine_session` | `matrix-choice` · `MatrixChoiceSession` |
| Nguyên thuỷ · layout | `selection` · `matrix-3x3` · `matrix-slot-grid` |
| Band · fallback tap | 5–6 · Không |
| `limits` | item 3–6 · distractor 2–5 · target 1–1 |
| `events` | `game_started` · `option_previewed` · `option_selected` · `game_completed` |

**CC**: `matrix` `{ rows: 2|3, cols: 2|3, cells: mảng { row, col, asset ho��c null } }` ·
`options` mảng 3–6 `{ option_id, asset, is_correct }`.
Hai `refine`: đúng **một** ô `null`; đúng **một** `option` mang `is_correct`.

**DC**: `grid_size` 2 hoặc 3 · `distractor_count` 2–5 · `hint_after_ms` · `allow_retry`.

**Thắng**: chọn đúng option.

**KSL**: chạm một option **đặt thử** nó vào ô trống; hàng và cột chứa ô đó sáng lên khi quy
luật khớp, tắt khi không. Trẻ thử và tự thấy, thay vì đoán rồi bị chấm.

**Gợi ý**: L1 nhấp nháy hàng đầy đủ gần ô trống nhất · L2 ghost hand quét hàng rồi quét cột ·
L3 lặp chậm, dừng ở từng ô của hàng mẫu.

### 4.4 `GT-012` — Nhìn chớp rồi nhớ lại

| | |
|---|---|
| `mechanic` · `engine_session` | `flash-recall` · `FlashRecallSession` |
| System mới · layout | `timerSystem` · `grid` · `horizontal-row` |
| Band · fallback tap | 3–6 · Không |
| `limits` | item 1–6 · distractor 1–5 · target 1–1 |
| `events` | `game_started` · `flash_shown` · `flash_hidden` · `flash_replayed` · `value_selected` · `game_completed` |

**CC**: `flash_items` mảng 1–6 `{ item_id, asset }` · `arrangement` enum
`dice` · `line` · `triangle` · `random` · `hand` · `options` mảng 2–6 `{ value: int, is_correct }`.

**DC**: `flash_ms` int 800–3000 mặc định 1500 (`D-RM`) · `item_count` 1–6 ·
`distractor_count` 1–5 · `allow_replay` boolean · `hint_after_ms` · `allow_retry`.

**Thắng**: chọn đúng số lượng.

**KSL**: `allow_replay` cho xem lại **một lần**. Trẻ tự đối chiếu trí nhớ với hiện thực trước
khi trả lời, thay vì bị chấm sai ngay lần đầu.

**`timerSystem`**: hiện đúng `flash_ms` rồi ẩn. Nó **không** đo thời gian trả lời — sàn 800ms
tồn tại để bài này là nhận biết nhanh, không phải đo phản xạ.

**Gợi ý**: L1 tăng `flash_ms` thêm 500ms cho lần hiện sau · L2 hiện lại kèm ghost hand chỉ từng
vật theo nhịp · L3 hiện lại và **không ẩn**, ghost hand đếm chậm.

### 4.5 `GT-013` — Tìm đường mê cung

| | |
|---|---|
| `mechanic` · `engine_session` | `maze-route` · `MazeRouteSession` |
| System mới · layout | `mazeSystem` · `grid` |
| Band · fallback tap | 4–6 · Có |
| `limits` | item 1–1 · distractor 0–6 · target 1–1 |
| `events` | `game_started` · `path_step` · `path_blocked` · `path_submitted` · `game_completed` |

**CC**: `grid` `{ rows: 3–7, cols: 3–7, walls: mảng { row, col, side: "n"\|"e"\|"s"\|"w" },
start: { row, col }, goal: { row, col } }` · `required_cells` mảng 0–2 `{ row, col }` ·
`input_mode` enum `draw` · `arrows`.
`refine`: tồn tại ít nhất một đường hợp lệ đi qua mọi `required_cells`.

**DC**: `dead_end_count` 0–6 · `required_cell_count` 0–2 · `hint_after_ms` · `allow_retry`.

**Thắng**: đường từ `start` tới `goal` không xuyên tường và qua đủ `required_cells`.

**KSL**: nét vẽ **dừng ở tường** và lùi về ngã ba gần nhất kèm âm nhẹ, không phạt. Ngõ cụt tự
nói nó là ngõ cụt.

**Quyết định đóng câu hỏi mở số 7 của spec khuôn**: giữ **cả hai** `input_mode`, khai trong
`content_pack` chứ không hardcode. Mặc định `draw` cho band 4-5 (một cử chỉ liên tục),
`arrows` cho band 5-6 (lập kế hoạch trước khi chạy — đúng phần `C6.PLN` mà workbook nhắm tới).

**Gợi ý**: L1 nhấp nháy ô kế tiếp đúng · L2 ghost hand vẽ hai bước đầu · L3 ghost hand vẽ chậm
tới ngã ba tiếp theo rồi dừng.

### 4.6 `GT-014` — Cân hai bên

| | |
|---|---|
| `mechanic` · `engine_session` | `balance-scale` · `BalanceScaleSession` |
| System mới · layout | `balanceSystem` · `split-columns` |
| Band · fallback tap | 5–6 · Có |
| `limits` | item 2–6 · distractor 0–4 · target 1–4 |
| `events` | `game_started` · `item_placed` · `balance_changed` · `game_completed` |

**CC**: `left_pan` và `right_pan` mảng 0–4 `{ item_id, asset, weight: int 1–10 }` ·
`tray` mảng 2–6 `{ item_id, asset, weight }` · `goal` enum `balance` · `pick_heavier`.
`refine`: với `goal: "balance"`, tồn tại tổ hợp từ `tray` làm hai bên bằng nhau.

**DC**: `tray_count` 2–6 · `weight_span` 1–10 · `hint_after_ms` · `allow_retry`.

**Thắng**: hiệu tổng khối lượng hai bên bằng 0, hoặc chọn đúng bên nặng hơn.

**KSL**: đòn cân **nghiêng theo hiệu khối lượng, liên tục**. Nghiêng chính **là** câu trả lời.
Khuôn này cấm hiện dấu đúng-sai trước khi trẻ đặt xong — làm vậy là bỏ toàn bộ lý do nó tồn tại.

**`balanceSystem`**: tính hiệu hai bên, ánh xạ sang góc nghiêng, nội suy mượt. Phản hồi liên
tục nằm ở tầng render; `checkWinCondition()` vẫn nhị phân (`D-RO`).

**Gợi ý**: L1 nhấp nháy bên nhẹ hơn · L2 ghost hand nhấc một vật đúng từ khay · L3 ghost hand
đặt vật đó vào đúng đĩa, chậm.

### 4.7 `GT-015` — Lưới không lặp

| | |
|---|---|
| `mechanic` · `engine_session` | `sudoku-mini` · `SudokuMiniSession` |
| System mới · layout | `constraintSystem` · `matrix-slot-grid` |
| Band · fallback tap | 5–6 · Có |
| `limits` | item 2–4 · distractor 0–2 · target 1–3 |
| `events` | `game_started` · `cell_filled` · `constraint_violated` · `game_completed` |

**CC**: `grid_size` 2 · 3 · 4 · `symbols` mảng 2–4 `{ symbol_id, asset }` ·
`cells` mảng `{ row, col, symbol_id hoặc null }` · `regions` enum `row_col` · `row_col_box`.
`refine`: lưới có **đúng một** nghiệm.

**DC**: `blank_count` 1–3 · `hint_after_ms` · `allow_retry`.

**Thắng**: mọi ô đầy và không ràng buộc nào bị vi phạm.

**KSL**: ô vừa đặt **sáng lên cùng lúc với ô trùng giá trị** trong hàng, cột hoặc vùng của nó.
Va chạm hiện ra như một sự kiện thị giác, không như một lời phán.

**Gợi ý**: L1 nhấp nháy hàng có ít ô trống nhất · L2 ghost hand chỉ lần lượt ba giá trị đã có
trong hàng đó · L3 ghost hand đặt đúng một ô, chậm.

### 4.8 `GT-016` — Xoay kim đồng hồ

| | |
|---|---|
| `mechanic` · `engine_session` | `clock-hands` · `ClockHandsSession` |
| System mới · layout | `rotationSystem` · `grid` |
| Band · fallback tap | 5–6 · Có |
| `limits` | item 2–4 · distractor 1–3 · target 1–1 |
| `events` | `game_started` · `hand_rotated` · `time_submitted` · `game_completed` |

**CC**: `mode` enum `read` · `set` · `match` · `target_time` `{ hour: 1–12, minute: 0 hoặc 30 }` ·
`initial_time` cùng dạng · `options` mảng 0–4 `{ hour, minute, is_correct }` (chỉ `mode: read`) ·
`activity_cards` mảng 0–3 `{ card_id, asset, hour, minute }` (chỉ `mode: match`).
`refine`: `mode` nào thì mảng tương ứng phải không rỗng.

**DC**: `minute_step` 30 hoặc 60 · `distractor_count` 1–3 · `hint_after_ms` · `allow_retry`.

**Thắng**: `mode: read` chọn đúng thẻ giờ; `mode: set` hai kim trùng `target_time`;
`mode: match` ghép đủ cặp tranh với giờ.

**KSL**: kim **nhảy theo nấc**, không dừng được giữa hai nấc, và hai kim ràng buộc nhau như
bánh răng thật. Đặt sai không bao giờ trông giống đặt đúng.

**Gợi ý**: L1 nhấp nháy con số đích trên mặt số · L2 ghost hand xoay kim ngắn tới đích · L3
xoay chậm cả hai kim, lặp.

### 4.9 `GT-017` — Xếp khối và phối cảnh

| | |
|---|---|
| `mechanic` · `engine_session` | `block-stack` · `BlockStackSession` |
| System mới · layout | `isometricSystem` · `split-columns` · `grid` |
| Band · fallback tap | 5–6 · Không |
| `limits` | item 2–6 · distractor 1–5 · target 1–1 |
| `events` | `game_started` · `model_rotated` · `option_selected` · `game_completed` |

**CC**: `model` mảng 1–10 `{ x: int 0–3, y: int 0–3, z: int 0–3 }` — toạ độ khối lập phương
đơn vị · `question` enum `count_cubes` · `top_view` · `match_solid` ·
`options` mảng 2–6 `{ option_id, asset, is_correct }`.
`refine`: `model` liên thông và không có khối lơ lửng.

**DC**: `hidden_cube_count` 0–3 · `distractor_count` 1–5 · `allow_rotate` boolean ·
`hint_after_ms` · `allow_retry`.

**Thắng**: chọn đúng option.

**KSL**: `allow_rotate` cho **xoay mô hình** để nhìn thấy khối bị che. Câu hỏi về khối ẩn tự
trả lời được bằng cách nhìn từ hướng khác — đó là toàn bộ bài học về phối cảnh.

**`isometricSystem`**: vẽ khối theo phép chiếu đẳng cự bằng canvas, không ảnh dựng sẵn (`D-RL`).

**Gợi ý**: L1 nhấp nháy cột khối cao nhất · L2 ghost hand xoay mô hình 90 độ một lần · L3 xoay
chậm và đếm từng khối theo nhịp.

## 5. Mapping level mẫu và nội dung thật

Ba level mẫu của mỗi khuôn sống trong `fixtures.ts` và **không tiêu hạn ngạch**. Nội dung thật
đi qua `seed-content` và tiêu hạn ngạch.

| Khuôn | Level mẫu trong `fixtures.ts` | Nội dung thật | Competency | Hạn ngạch còn |
|---|---|---|:--:|---|
| `GT-009` | WB14 dạng 1 · dạng 2 · biến thể dạng 2 với 2 manh mối | WB14 | C3 | 15 — đủ |
| `GT-010` | WB12 dạng 1 · dạng 2 · WB20 hệ 2 bước | WB12 · WB20 | C1 | **0 — chặn** |
| `GT-011` | WB21 dạng 1 · WB15 ma trận 2×2 · biến thể xoay | WB21 (C3) · WB15 (C1) | C3 · C1 | C3 đủ, C1 chặn |
| `GT-012` | WB04 dạng 1 · dạng 2 · dạng 3 | WB04 | C1 | **0 — chặn** |
| `GT-013` | WB09 dạng 1 · dạng 2 · dạng 3 | WB09 | C2 | 5 — đủ |
| `GT-014` | WB16 dạng cân · dạng bắc cầu · biến thể 3 quả cân | WB16 | C1 | **0 — chặn** |
| `GT-015` | WB17 dạng 1 (2×2) · dạng 2 (3×3) · dạng 3 (4×4) | WB17 | C3 | 15 — đủ |
| `GT-016` | WB18 dạng 1 · dạng 2 · dạng 3 | WB18 | C1 | **0 — chặn** |
| `GT-017` | WB19 dạng 1 · dạng 2 · biến thể khối ẩn | WB19 | C2 | 5 — đủ |

Hai ràng buộc phải nhớ khi viết level mẫu và nội dung thật:

- **Trần item theo band thắng bảng nguồn.** WB14 ở band 4-5 nên trần là 6 item, trong khi nguồn
  dùng bảng số 1 tới 10. Level phải dùng bảng 1 tới 6, hoặc dời lên band 5-6. `BR-MCM-08`.
- **WB19 dạng 3** (ghép vật thực với khối) là `pair-match`, đã chạy trên `GT-005` ở lô A. Không
  lặp lại nó trong `GT-017`.

## 6. Thứ tự — hạn ngạch quyết định, không phải chi phí engine

Task #98 xếp theo chi phí engine. Số đo ở mục 2.1 đảo lại: bốn khuôn phục vụ C1 có build xong
cũng không seed được gì.

```text
WP99.0  Sửa C4 vượt trần + đăng ký event  (cổng, chặn mọi việc sau)
  │
  ├──→ WP99.1  GT-009 clue-deduction     nhóm A · C3 còn 15
  │      └──→ WP99.2  GT-011 matrix-choice   nhóm A · C3 còn 15
  │             │
  │             └── CHECKPOINT 1: hai khuôn nhóm A xong, nội dung C3 seed được
  │
  └──→ WP99.3  GT-013 maze-route          nhóm B · C2 còn 5
         └──→ WP99.4  GT-015 sudoku-mini      nhóm B · C3
                └──→ WP99.5  GT-017 block-stack   nhóm B · C2
                       │
                       └── CHECKPOINT 2: năm khuôn có nội dung seed được đã xong

CHECKPOINT 3 — cổng người: mở trần C1 hay dừng lô
  └──→ WP99.6  GT-010 · GT-012 · GT-014 · GT-016   (chỉ khi trần C1 mở)
```

`GT-009` trước `GT-011` vì cả hai dùng `selection` và `GT-009` đơn giản hơn — nó chốt hình dạng
`clue-board` mà `GT-011` không cần nhưng cùng họ.

`GT-013` mở nhánh nhóm B sớm vì `mazeSystem` là system đơn giản nhất trong sáu cái, và nó
chứng minh khuôn viết một system trước khi ba system nặng hơn bắt đầu.

## 7. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP99.0 | S | Gỡ một level C4 khỏi lô hoặc mở quyết định nới trần; đăng ký 8 event đang thiếu vào catalog; đối chiếu 57 với 59 mã dạng bài | Hạn ngạch C4 về ≤9; mọi `events` của 8 khuôn tra được trong catalog; một con số duy nhất cho tổng dạng bài, ghi vào cả spec lẫn bảng tra |
| WP99.1 | M | `GT-009`: layout `clue-board`, template, session, fixtures 3 level, journey E2E | 15 điều kiện nghiệm thu mục 7.5 spec khuôn; KSL gạch ứng viên chạy trước phản hồi hệ thống |
| WP99.2 | M | `GT-011`: layout `matrix-3x3`, template, session, fixtures 3 level, journey E2E | Như trên; đặt thử option làm sáng hàng và cột |
| WP99.3 | M | `mazeSystem` + `GT-013`; system có test độc lập với khuôn | `BR-MTB-15`; nét vẽ dừng ở tường trong test, không chỉ trong E2E |
| WP99.4 | M | `constraintSystem` + `GT-015` | Như trên; ca âm lưới hai nghiệm bị `refine` chặn |
| WP99.5 | M | `isometricSystem` + `GT-017` | Như trên; test đếm khối ẩn |
| WP99.6 | M | Nội dung thật cho `GT-009` · `GT-011` · `GT-013` · `GT-015` · `GT-017`: WB14 · WB21 · WB09 · WB17 · WB19 | `seed:check` xanh; C3 và C2 không vượt trần; cổng phủ không tụt ô nào |
| WP99.7 | S | Cổng người: quyết định mở trần C1 hay dừng lô ở đây | Quyết định ghi vào spec kèm lý do; `GT-010` · `GT-012` · `GT-014` · `GT-016` chỉ bắt đầu sau đó |
| WP99.8 | M | `timerSystem` + `GT-012` — **chỉ khi** WP99.7 mở trần | Như WP99.3 |
| WP99.9 | M | `balanceSystem` + `GT-014` — **chỉ khi** WP99.7 mở trần | Như WP99.3; phản hồi liên tục không rò vào `checkWinCondition()` |
| WP99.10 | M | `rotationSystem` + `GT-016` — **chỉ khi** WP99.7 mở trần | Như WP99.3; kim không dừng được giữa hai nấc |
| WP99.11 | M | `GT-010` — **chỉ khi** WP99.7 mở trần | 15 điều kiện nghiệm thu |
| WP99.12 | S | Cập nhật spec khuôn theo hình dạng thật đã build; lật `implemented` | Mọi số ở mục 7.1 spec khuôn khớp code; `pnpm --filter @mindkid/gates test` xanh |

## 8. Acceptance criteria

```gherkin
Scenario: WP99.0 — hạn ngạch C4 về trong trần trước khi seed tiếp
  Given lô Montessori đang có 10 level C4 và trần là 9
  When chạy cổng lô Montessori
  Then cổng thoát với mã khác 0
  And sau khi gỡ một level, cổng xanh

Scenario: WP99.0 — mọi event của khuôn đều đăng ký
  When đọc trường events của tám khuôn hiện có
  Then mọi tên event tra được trong event-catalog.md

Scenario: Level mẫu không tiêu hạn ngạch
  Given ba level mẫu của một khuôn nằm trong fixtures.ts
  When chạy pnpm --filter @mindkid/db seed:report
  Then chúng không xuất hiện trong số đếm hạn ngạch competency

Scenario: BR-MTB-14 — kiểm soát lỗi tự thân chạy trước phản hồi hệ thống
  Given journey E2E của GT-009
  When trẻ chạm một manh mối
  Then ứng viên vi phạm mờ đi và mang dấu gạch
  And chưa phản hồi đúng sai nào của hệ thống được hiện

Scenario: GT-014 — phản hồi liên tục không rò vào điều kiện thắng
  Given một phiên GT-014 với hai bên chưa cân
  When gọi checkWinCondition 100 lần
  Then kết quả luôn là false
  And góc nghiêng của đòn cân không đổi

Scenario: GT-013 — hai input_mode đều chạy
  Given hai level GT-013, một khai input_mode draw, một khai arrows
  When chơi hết cả hai
  Then cả hai đạt điều kiện thắng

Scenario: GT-015 — lưới nhiều nghiệm bị chặn ở contract
  Given một content_pack GT-015 có lưới hai nghiệm
  When parse bằng content_contract
  Then parse fail và nêu refine bị vi phạm

Scenario: GT-012 — sàn thời gian hiện kích thích được ép
  Given một difficulty_params khai flash_ms bằng 400
  When parse bằng difficulty_contract
  Then parse fail

Scenario: WP99.6 — nội dung mới không làm thủng ô phủ
  Given cổng phủ xanh trước khi seed
  When seed nội dung của năm khuôn và chạy lại cổng phủ
  Then không ô nào tụt dưới sàn

Scenario: WB14 tôn trọng trần item theo band
  When đọc mọi level GT-009 ở band 4-5
  Then không level nào có quá 6 ứng viên
```

## 9. Verification

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm lint                 # biome check ., KHÔNG dùng ultracite check
pnpm --filter @mindkid/gates test
pnpm --filter @mindkid/gates test
pnpm typecheck
pnpm --filter @mindkid/game-engine gen:templates        # chạy lại không được sinh diff
pnpm vitest run packages/game-engine
pnpm --filter @mindkid/db seed:check
pnpm --filter @mindkid/db test
pnpm --filter @mindkid/db seed:report
```

## 10. Definition of done

- Hạn ngạch C4 về trong trần; tám event thiếu đã đăng ký.
- Năm khuôn `GT-009` · `GT-011` · `GT-013` · `GT-015` · `GT-017` qua đủ 15 điều kiện nghiệm thu.
- Ba system mới (`mazeSystem`, `constraintSystem`, `isometricSystem`) có test **độc lập với khuôn**.
- Mỗi khuôn có ba level mẫu trong `fixtures.ts` và một journey E2E.
- Nội dung thật của năm khuôn đó seed xong; C2 và C3 không vượt trần.
- Quyết định về trần C1 ghi vào spec, không để lửng.
- Spec khuôn cập nhật theo hình dạng thật; `pnpm --filter @mindkid/game-engine gen:templates` không sinh diff.

## 11. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Bốn khuôn C1 được build trước khi có hạn ngạch, thành code chết | Cao | WP99.8 tới WP99.11 khoá sau cổng người WP99.7 |
| System viết riêng cho một khuôn, không tái dùng được | Cao | `BR-MTB-15` đòi test độc lập với khuôn — không viết được test độc lập là dấu hiệu system dính vào khuôn |
| `refine` nghiệm duy nhất của `GT-010` và `GT-015` tốn thời gian chạy | Trung bình | Giới hạn kích thước nhỏ (hệ 2–3 ẩn, lưới tối đa 4×4) làm vét cạn rẻ; đo trong test |
| Kiểm soát lỗi tự thân bị cắt khi gần deadline, thay bằng dấu đỏ | Trung bình | Điều kiện nghiệm thu 13 và ca Gherkin đòi một bước E2E trẻ tự sửa **trước** phản hồi hệ thống |
| Ba `LayoutId` còn lại hoá ra cần hàm hình học riêng như bốn cái đầu | Thấp | Bốn cái đầu đã cần, nên giả định mặc định giờ là **cần**; WP99.1 đo lại và cập nhật spec |

## 12. Ngoài phạm vi

- Nới trần C1 (quyết định người ở WP99.7).
- Khuôn tô nét số `trace-path` — mục 7.6 của [`montessori-corpus-mapping.md`](../specs/05-content/montessori-corpus-mapping.md).
- Siết nhánh slug dự phòng của trục `what` và `thinking`.
- Ghép lesson Montessori vào chương trình (`D-RU`).
- Nạp 24 dạng bài đang hoãn (`D-RQ`).
