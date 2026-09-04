# Kế hoạch — Task #209: Chương trình runtime engine — đóng mạch vòng chơi, hợp đồng nhập, chi phí mỗi khung

> Danh sách việc: [`209-engine-runtime-program-todo.md`](209-engine-runtime-program-todo.md)
>
> **Loại task:** chương trình (M). File này chia trục và sinh ra các lát dọc; nó Cấm — NEVER
> tự thi công. Tiền lệ: [`116-engine-vertical-slices-plan.md`](116-engine-vertical-slices-plan.md).
>
> **File này cấm — NEVER chứa contract.** Contract nằm trong `docs/specs/`; mục 2 của
> [`CONVENTIONS.md`](../specs/CONVENTIONS.md) sở hữu luật đó.
>
> Spec liên quan: [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md)
> (vòng lặp, ngân sách, ranh giới engine) ·
> [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) (hình dạng `GameTemplate`) ·
> [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) (hợp đồng vẽ) ·
> [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) (từ vựng layout, hình học slot) ·
> [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) · [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) ·
> [`runtime-gates.md`](../specs/08-quality/runtime-gates.md) (sổ cưỡng chế)
>
> **Chặn bởi:** không task nào. **Chặn:** [`166`](166-engine-play-behavior-bdd-plan.md) (hợp đồng nhập)
> phụ thuộc đợt 1 của task này.

## 0. Từ điển

*lát dọc* (vertical slice) · *cổng* (gate) · *ca âm* (negative case: test chứng minh cổng bắt được lỗi) ·
*ảnh nền* (baseline: danh sách `trạng thái | tên test` chụp trước khi sửa) ·
*khuôn trò chơi* (template) · *cử chỉ* (gesture) · *nhịp* (system beat) ·
*bố cục* (layout) · *ô* (slot) · *subpath* (đường nhập con của `exports`).

## 1. Vì sao — ba việc, không phải một

Yêu cầu ban đầu là "tối ưu performance và làm sạch kiến trúc `packages/game-engine` và
`packages/play` theo gom nhóm theo khuôn trò chơi, input → process → output". Đo trên cây làm việc
ngày 2026-09-04 thì hoá ra chỗ cần làm sạch chính là chỗ đang hỏng.

### 1.1 Không có ảnh nền xanh

```
node node_modules/vitest/vitest.mjs run --project '@mindkid/game-engine'
Test Files  5 failed | 60 passed (65)
     Tests  9 failed | 1038 passed (1047)
```

Cả chín ca đỏ đều là `GT-000`:

| File | Ca | Luật |
|---|---|---|
| `packages/game-engine/tests/gates/templates.test.ts:18,23,28` | 3 | `BR-TAK-01`, `BR-TAK-09`, `BR-TAK-03` |
| `packages/game-engine/tests/template-compliance.test.ts:90,179,210` | 3 | danh sách mã cứng còn 36 |
| `packages/game-engine/tests/round-runner-snapshot.test.ts:100` | 1 | fixture |
| `packages/game-engine/tests/all-templates-interactive-harness.test.ts:159` | 1 | fixture |
| `packages/game-engine/tests/contract.test.ts:176` | 1 | `ALL_GAME_MECHANICS` đã là 37, test assert 36 |

`GT-000` hạ cánh bằng cách **sửa tay cả sáu file `src/generated/*`**, không phải bằng
`pnpm gen:templates`. Hai chứng cứ độc lập: `scripts/gen-templates-lib.ts:198` sinh định danh bằng
`t.code.replace("-","")` tức `GT000Session`, trong khi `src/templates/GT-000/session.ts:78` khai
`export class GT037Session` và không có bảng alias nào trong generator; và `discoverTemplates`
(`gen-templates-lib.ts:56`) sắp bằng `localeCompare` nên `GT-000` phải đứng **đầu**, còn
`src/generated/template-codes.ts:40` để nó **cuối**.

Hệ quả: luật *"chụp `trạng thái | tên test` trước và sau, đòi trùng khít"* của `CLAUDE.md` không dùng
được. Mọi khác biệt về sau đều mơ hồ. Đây là lát 0 và nó chặn tất cả.

### 1.2 Vòng hai trở đi không chơi được ở 28 trên 37 khuôn

`RoundRunner.startRound` (`packages/game-engine/src/round-runner.ts:225-245`) dựng session **mới** mỗi
vòng và chỉ gọi `setupEntities()`. Nó Cấm — NEVER gọi `resolveSlots`. `onRoundStarted` ở
`apps/web/app/pages/play/[code].vue:1246-1250` cũng chỉ gán `engine.activeSession = session`.

28 khuôn (`GT-001`…`GT-028`) khai `slots: readonly Slot[] = []` và không tự gọi `resolveSlots`, nên
từ vòng hai `slots` vẫn là mảng rỗng. Trang chơi đọc
`const slots = session.slots || engine.slots || []` (`[code].vue:959,1002,1068`) — mà **mảng rỗng là
giá trị đúng trong JavaScript**, nên nhánh `engine.slots` là mã chết. Đã kiểm bằng `node`:
`[] || [1,2,3]` cho `[]`.

`render()` cũng đọc `this.slots`. Nên từ vòng hai, 28 khuôn chỉ vẽ nền và câu lệnh, `findHitSlot`
luôn trả `-1`, `checkWinCondition` không bao giờ thoả, `completeCurrentRound` không bao giờ bắn.

Số lượng vật **có** đổi giữa các vòng, nên vá bằng cách làm nhánh dự phòng đến được cũng sai:
`packages/content-build/src/cli/gen-levels.ts:265-273` truyền thẳng chỉ số vòng làm bậc leo thang
(`escalationStep: r`), và `packages/game-engine/src/generators/gt001.ts` trả
`min(max, base + escalationStep)` — band `3-4` có 3 lựa chọn ở vòng một, 4 ở vòng hai. Bố cục 3 ô cho
4 lựa chọn vẫn là sai. Chỉ tính lại mỗi vòng mới đúng, và
[`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) §7.1 đã ghi thẳng:
*"Layout tính một lần lúc nạp là sai."*

Chín khuôn còn lại sống sót qua các vòng nhưng **cứng band tuổi**: `GT-000` tự tính lại mỗi bước
trong `updateCurrentStepLayout()` (`session.ts:120-140`) với `ageBand: "3-4"`; `GT-029` cứng `"4-5"`;
`GT-030`…`GT-036` cứng `"5-6"`. `getTouchFloor("3-4")` là 96 px, nên một đứa ba tuổi chơi `GT-030`
nhận sàn chạm của band 5-6 — vi phạm sàn tiếp cận.

Kèm một lỗi thứ tự: `core.ts:171` gọi `resolveSlots` **trước** `core.ts:173` gọi `setupEntities()`,
trong khi `GT-001/session.ts:80` đọc `this.displayOptions` do chính `setupEntities` điền. Vòng một
chạy được chỉ vì factory của trang chơi trả session mà `round-runner.ts:242` đã gọi `setupEntities`
rồi — tức `setupEntities` chạy **hai lần** cho vòng một.

### 1.3 Hợp đồng nhập đã khai là mã chết; đường thật chỉ với tới 8 trên 37 khuôn

`grep -rn "handleAction\|validateAction" apps packages --include="*.ts" --include="*.vue"` cho **0 call
site production**. `RoundRunner.handleAction` (`round-runner.ts:132`) chỉ có tám lần gọi, tất cả trong
`tests/round-runner.test.ts`.

Đường thật là duck-typing trong một trang `.vue` 1805 dòng:
`apps/web/app/pages/play/[code].vue:181-231` tự khai `interface InteractiveSession` với 22 thành viên
tuỳ chọn, rồi dò bằng 17 chỗ `typeof session.X === "function"` (9 tên).

Đối chiếu tên trang dò với tên khuôn thật khai:

| Trạng thái | Khuôn |
|---|---|
| Nhận được cử chỉ | `GT-001` `GT-002` `GT-003` `GT-004` `GT-005` `GT-008` `GT-010` `GT-012` — **tám** |
| Trang khai mà không bao giờ gọi | `selectOption?` khai ở `:216`, grep cả file cho đúng một lần xuất hiện → `GT-016` và `GT-017` không nối |
| Trang gọi mà không khuôn nào khai | `flipCard` gọi ở `:799-800`; `GT-020` khai `onTapCard` (`session.ts:95`), `flipCard` chỉ có trên `CardSystem` → `GT-020` không nối. `tapObject` và `connectPair` cũng không khuôn nào khai |
| Không có đường nhập | 29 khuôn còn lại, trong đó 9 khuôn (`GT-000`, `GT-029`…`GT-036`) không khai động từ nhập nào cả |

Nhánh cuối `dispatchSlotAction` (`[code].vue:810-818`) hết đường thì dừng, Cấm — NEVER rơi về
`validateAction`. Nên với 29 khuôn, chạm màn không gọi gì và không báo lỗi — trong khi `BR-ENG-07`
ghi *"im lặng cũng là defect"*.

Từ vựng thay thế **đã thiết kế xong** ở [`166-engine-play-behavior-bdd-plan.md`](166-engine-play-behavior-bdd-plan.md)
(`status: planned`, không có file `-todo.md`, hai spec nó sở hữu chưa tồn tại): 47 động từ nhập gom về
sáu cử chỉ của trẻ cộng ba nhịp của hệ, kèm bảng khám phá
[`166-vi-du.md`](166-vi-du.md) 693 dòng. Task này thi công nó, Cấm — NEVER thiết kế lại.

### 1.4 Chi phí mỗi khung có mục tiêu số, có luật, không còn cổng nào đo

`BR-ENG-15` cấm cấp phát object mỗi khung; §7.2 đặt "cấp phát mỗi frame = 0"; `BR-ENG-17` đặt trần
bundle 80 KB gzip mỗi khuôn, đo bằng *"cổng tự động size check"*. Đã grep cả repo cho
`size-limit`/`bundlesize`/`gzipSize` → **không có cổng nào**. Và §3 của
[`runtime-gates.md`](../specs/08-quality/runtime-gates.md) ghi `lint-perf-budget.ts` cưỡng chế
`BR-PRF-01/02/08` là **MẤT**, kèm câu hỏi mở `Q-RG-2`. Task này trả lời `Q-RG-2` bằng `D-NO` ở §9:
wire vào, không hạ luật — nhưng wire ở **hai nhịp**, vì hai lớp lỗi có chi phí đo chênh nhau ba bậc.

Đo được, tất cả nằm trong thân `render()` chạy 60 lần mỗi giây:

- Gradient dựng lại mỗi khung ở sáu hàm vẽ (`shared-render.ts:128,155,163,190`;
  `shared-render-shapes.ts:724,747,792,1142`). `GT-002`/`GT-012` vẽ 8 khay, mỗi khay 2 gradient
  toả tròn — **16 gradient mỗi khung**.
- `this.slots.filter(...)` ở **11 khuôn, 21 chỗ**, trong khi `slots` bất biến sau khi tính.
- `new Map`/`new Set` dựng lại từ `this.content` đã đóng băng ở **9 khuôn**.
- `GT-019/session.ts:270-276`: `[...placements.entries()].find(...)` cho **từng đích, mỗi khung** —
  O(n²) cấp phát và so sánh.
- `GT-010/session.ts:175-181`: `.find()` tuyến tính mỗi glyph mỗi khung, chi phí
  `số phương trình × số toán hạng × số ký hiệu`.
- Sort thừa: `shared-render-shapes.ts:555` sort lại dữ liệu `trace-system.ts:32` đã sort;
  `:454-455` gọi `rotateModelZ` hai lần vì `sortCubesForRender` xoay lại bên trong.

Và `src/utils/object-pool.ts` — cơ chế mà §7.2 kê để đạt "cấp phát = 0" — có **0 call site
production**; chỉ `src/index.ts:459` tái xuất và `tests/core.test.ts:83` khẳng định hộ nó. Trong khi
`Particle`, thứ churn thật, cấp phát thô ở `shared-render.ts:799,831`.

### 1.5 Barrel kéo ba phần tư nguồn vào mọi consumer

`packages/game-engine/package.json` khai đúng `"exports": { ".": "./src/index.ts" }` — không subpath
nào, nên **mọi** consumer bị ép qua barrel. Barrel 459 dòng, 150 câu `export`, tái xuất
`session-loader` (static-import cả 37 session), `template-registry` (static-import cả 37
`template.ts`), `generators/index` (37 import), `offline-buffer` (browser-only), toàn bộ `systems/*`
(canvas, Web Audio), **và cả 37 bộ `GT0xx_FIXTURES`** — dữ liệu test trong entry production.

Đo bằng `du -sk`: `src/templates` 756 KB + `src/generators` 172 KB + `src/generated` 80 KB =
**1.008 KB trên 1.328 KB nguồn, tức 76%**, kéo eager.

Có khoảng 55 chỗ import trên 8 package cộng `scripts/`. Nặng nhất là `packages/content-build`
(~25 chỗ). Tám route và util **server** của `apps/web` import cùng barrel đó cho vài ký hiệu registry.
Và `packages/ui/src/index.ts:2` import `designTokens` — `packages/ui` là Nuxt layer của **cả**
`apps/web` lẫn `apps/admin` (`nuxt.config.ts:15` và `:6`), nên client của admin cũng kéo cả cây engine
cho một object 148 dòng. `packages/db/package.json:14` thì khai dependency mà không import gì.

`session-loader.ts` đã có sẵn `loadGameSession` dùng `await import()` (`:47`) — **0 caller**. Sản xuất
đi đường `createGameSessionSync` (`:205`). Vì cùng những specifier đó đã bị static-import ở đầu file
(`:5-41`), các `await import()` không tách được gì. Chú thích `BR-TAK-08` ở `:43-46` nói
*"chỉ tải mã của khuôn đang chơi"* là sai so với mã sinh ra.

### 1.6 `packages/play` là một file 1463 dòng, và nó nuốt payload của `GT-000`

Theo dòng: hằng số và catalog `L28-336` (21%), Zod schema `L338-759` (29%), kiểu `L761-811`, handler
`L813-1463` (45%). Nửa file — khoảng 750 dòng, 51% — là kiểm tra đầu vào thuần, không chạm cơ sở dữ
liệu.

Ba bảng, ba con số: `ALLOWED_EVENT_NAMES` **83** tên, `EVENT_PAYLOAD_FIELDS` **84**,
`EVENT_PAYLOAD_SCHEMAS` **78**. Hiệu tập hợp `allowed − schemas` là đúng năm tên —
`intro_period_started`, `intro_item_presented`, `intro_item_deferred`, `intro_recall_answered`,
`tts_unavailable` — và `cleanEventPayload:902-905` trả `{}` khi không có schema. Đó đúng là các sự kiện
`GT-000` phát (`GT-000/session.ts:129,143,211,267`), nên **mọi dòng telemetry của bài làm quen đang ghi
`payload` rỗng**. `GT-000` cũng là khuôn không có file test nào, nên mất dữ liệu vô hình từ cả hai đầu.
Chiều ngược lại, `fields − allowed` là đúng `scaffold_resolved`, nên sự kiện đó làm
`validateBatchPayload:827-829` loại **cả lô** với `UNKNOWN_EVENT_NAME`.

Không có transaction nào trong cả file. `completePlaySession` commit `completed` (`:1327-1343`, có
kiểm tra và đặt nguyên tử) **trước** khi ghi mastery (`:1098-1124`) và huy hiệu (`:1162-1170`); ghi
hỏng thì retry gặp `SESSION_ALREADY_COMPLETED` (`:1293`) và mastery mất vĩnh viễn.

## 2. Kết quả mong muốn

1. `pnpm test` xanh và `pnpm gen:templates` không sinh diff, nên mọi lát sau đo được.
2. Bố cục tính đúng một lần mỗi vòng, sau `setupEntities`, với band tuổi thật — cả 37 khuôn chơi
   được từ vòng hai.
3. Hợp đồng nhập là **một**, nằm trong engine, có kiểu, có cổng — chạm màn có phản hồi ở cả 37 khuôn.
4. Trạng thái suy ra tính một lần mỗi vòng chứ không mỗi khung; gradient dựng một lần mỗi khung vẽ.
5. Consumer nhập theo subpath: server không kéo canvas, client `apps/admin` không kéo 37 khuôn.
6. `packages/play` là 12 module sau một barrel không đổi, và ba bảng sự kiện có cổng giữ cho khớp nhau.

## 3. Giả định — chốt ở đây, sửa nếu sai

| # | Giả định | Vì sao |
|---|---|---|
| A1 | Sửa lỗi chức năng đi trước tối ưu. Đợt 1 và 2 chạm người dùng thật; đợt 3 và 4 là chi phí | Tối ưu một thứ đang không chạy là làm đẹp mã chết |
| A2 | Từ vựng cử chỉ lấy nguyên từ [`166`](166-engine-play-behavior-bdd-plan.md) §4.1 và §4.2 | Thiết kế lại là bỏ một nhịp khám phá đã trả tiền, và tạo từ vựng thứ hai |
| A3 | `validateAction` **ở lại** và thành nửa phán quyết thuần; nửa ghi đi qua `dispatch` cài một lần ở lớp cơ sở của họ | [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) đã chốt phép tách này; 168 chỗ gọi trong 19 file test giữ nguyên; và purity thành đúng theo cấu trúc chứ không theo review |
| A4 | Họ là **ba vòng đời con trỏ** (`tap` 20 khuôn, `drag-drop` 15, `stroke` 2), chỉ ở tầng kiểu | Trục `mechanic` là căn cước 1:1 với mã nên gom được gì; trục lô dựng dự đoán đúng hình dạng nhưng đó là **thứ tự viết**, đóng băng nó vào hệ kiểu là làm tai nạn thành vĩnh viễn |
| A5 | Thư mục `src/templates/` giữ nguyên đúng 37 mục; Cấm — NEVER thêm `src/families/` hay `src/pipeline/` | `tests/gates/render.test.ts:31-35` ghim 37/37/0 và chuỗi báo cáo; `discoverTemplates` lọc `/^GT-\d{3}$/` |
| A6 | Hợp đồng nhập về `src/interaction.ts` | File đó vốn đã sở hữu `BR-ENG-05` và `BR-ENG-06`, và vốn không consumer nào dùng |
| A7 | Dòng `pipeline/ ProcessPipeline + stage` ở §7.4 là bản phác đã mục, sửa chứ không thi công | Chính danh sách đó thiếu hẳn `layout/`, `rng/`, `contracts/`, `generated/`, `generators/`, `round-runner.ts`, `offline-buffer.ts`, và kê hai class `DragDropSession`/`TapSelectSession` không tồn tại |
| A8 | Primitive vẽ chuyển sang `src/render/` **chỉ sau** khi nới gốc quét `BR-ERC-05` lên `src/` ở một commit riêng trước đó | Chuyển không thôi đúng là lối lách mà comment ở `tests/gates/render.ts:44-49` sinh ra để chặn. Nhưng bất biến đó đã sai sẵn: `src/systems/render-system.ts` có 41 chỗ gọi `ctx` thô ngoài tầm quét, và `src/templates/<thư-mục-khác>/` hôm nay là lối lách có sẵn |
| A9 | Giữ hạt bất biến, sửa §7.2 thay vì cài object pool cho hạt | `shared-render.ts:817-823` ghi rõ vì sao: bản trước cộng dồn tại chỗ nên replay và snapshot đọc phải trạng thái đã trôi. Pool hạt tái lập đúng việc chia sẻ đó |
| A10 | Loader giữ đồng bộ, thêm `preloadGameSession` | `GameEngine.load` → `sessionFactory` → `startRound` → `advanceToNextRound` → `completeCurrentRound` đều đồng bộ và mắt cuối gọi từ đường `pointerup`. Async sẽ thò vào tận handler nhập |
| A11 | Test cho `ingestPlayEvents` viết ở `apps/web/tests/api/`, Cấm — NEVER lật `packages/play` sang `{ database: true }` | `defineWorkspaceTest` gắn globalSetup cho cả project và đổi sang chạy nối đuôi; và `packages/play` cũng đang đỏ vì `tests/adaptive-mastery.test.ts` cần Postgres thật |
| A12 | Transaction và batch insert là task riêng sau khi có test | `ingestPlayEvents` chưa có test nào trong package, và `packages/db/src/client.ts:16` đặt `{ max: 1 }` nên một lời gọi `db` thay vì `tx` lọt vào trong transaction sẽ tự khoá |

## 4. Trục chia — sáu đợt, mỗi mục một lát dọc

Chi tiết từng mục ở [`209-engine-runtime-program-todo.md`](209-engine-runtime-program-todo.md).

| Đợt | Mã | Kết quả một dòng |
|---|---|---|
| 0 | `#210` | Ảnh nền xanh trở lại |
| 1 | `#211`–`#216` | Bố cục tính một lần mỗi vòng, cả 37 khuôn chơi được từ vòng hai |
| 2 | `#217`–`#22x` | Hợp đồng nhập là một, có kiểu, có cổng |
| 3 | `#230`–`#234` | Cấp phát mỗi khung về không cho gradient và trạng thái suy ra |
| 4 | `#240`–`#246` | Subpath: server không kéo canvas, client không kéo 37 khuôn |
| 5 | `#250`–`#252` | `packages/play` là 12 module; ba bảng sự kiện có cổng |

Đợt 4 Cấm — NEVER phụ thuộc đợt 1 và 2 (không chung file nào), nên chạy song song được nếu ưu tiên
là bundle.

## 5. Ranh giới

**Always**
- Mọi lệnh chạy dưới Node 24: `export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"`. Node trên
  PATH là v20 và `vitest` chết ngay dưới v20 với `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` — một cổng
  đọc nhầm thành xanh.
- Chụp ảnh nền trước và sau mỗi lát, đòi trùng khít. Đỏ-thành-xanh cũng phải giải trình.
- Cổng mới nào cũng đi kèm ca âm dưới `tests/**/fixtures/`, và ca âm phải đỏ **vì đúng lý do**.

**Ask first**
- Bất kỳ bước nào chạm hơn một Session class — §10 của
  [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) kê nó dưới "Ask first".
  Ngoại lệ duy nhất là codemod một-hình-dạng, và phải chứng minh bằng `git diff --numstat`.
- Thêm gì vào vòng lặp; đổi ngân sách bundle; đổi không gian canvas 960×540.
- Thêm file vào danh sách miễn trừ `BR-ERC-05`.

**Never**
- Dùng `pnpm check` làm bằng chứng: `scripts/check.sh:76-101` đã comment Phase 3 (`vitest run`) và
  Phase 4, nên nó chỉ chạy lint và typecheck.
- Thêm script `typecheck` riêng cho `packages/game-engine`. Project `root` đã phủ, và
  `scripts/typecheck/typecheck-baseline.json` rỗng toàn bộ 10 project nên bất kỳ lỗi kiểu mới nào
  cũng là regression.
- Sửa tay `src/generated/*`. Đi qua `scripts/gen-templates-lib.ts` rồi `pnpm gen:templates`.
- Đổi `core.ts:141-152` sang dùng `validation.data`. Xem mục 6.
- "Tối ưu" `updateParticles` thành sửa tại chỗ.

## 6. Ngoài phạm vi — ghi ra để không ai đi sửa

| Thứ | Vì sao để yên |
|---|---|
| `core.ts:141-152` bỏ `validation.data` | Đã đo trên 3.647 level: parse điền default cho tất cả nhưng **xoá** khoá không khai ở 297 level — `options[].label` trên 285 level được vẽ thật qua `drawSlotLabel`. Và `layout_id` không được khai trong contract nào (0/36) mà `core.ts` lại đọc nó, nên parse là giết chức năng chọn bố cục. [`#203`](203-game-engine-visual-qa-todo.md) đã trả giá bằng test `BR-LAY-10` đỏ. Task riêng |
| `updateParticles` trả mảng mới | Bất biến là yêu cầu để snapshot tất định |
| `LayoutInput.logic` và `deriveLogicSpace` nối đầu-cuối | `RenderSystem.LOGIC_WIDTH`/`LOGIC_HEIGHT` là literal `readonly` và `src/render/*` đọc chúng ở khoảng 40 chỗ. Rơi vào "Ask first — đổi không gian canvas". `prepareRound` của đợt 1 là điều kiện tiên quyết. Payload thật: sàn chạm 39 px CSS so với 44 px của WCAG ở khung `390×844` |
| `[code].vue:443` `getBoundingClientRect()` | `viewport` không giữ vị trí phần tử trên trang, nên cache phải vô hiệu hoá theo scroll, resize, và transform tổ tiên. Đổi một rủi ro đúng-sai âm thầm lấy một lần đọc bố cục mỗi sự kiện con trỏ — không đáng |
| `engine_session` sai ở 17 trên 37 | Là cột cơ sở dữ liệu đi qua `template-seed.ts` bị so byte. Đổi tên là 37 file cộng đổi seed cộng sinh lại, đổi lấy 0 thay đổi hành vi vì `session-loader.ts` suy tên từ thư mục. Task riêng |
| `update()` trả `ActionResult` bị `core.ts:206` bỏ | Là nhịp `timeout` của [`166`](166-engine-play-behavior-bdd-plan.md), và câu hỏi mở của nó vẫn Mở. Nối lén còn làm `game_completed` bắn đôi |
| `hint_after_ms` trong contract của 37 khuôn | Bỏ nó là đổi phá vỡ `BR-GTC-08` với mọi `difficulty_params` đã gieo. Migration riêng, có backfill |
| `collectSessionTelemetry` chạy trước `completeSession()` | Nên `game_completed` do `BaseGameSession` ghi không bao giờ được thu. Thật, ảnh hưởng cả 37, nhưng thuộc địa hạt catalog sự kiện |
| Xoá `InteractionManager`, `OfflineEventBuffer`, `DegradationManager` | Ba task nhỏ riêng. Lưu ý cực guard `degradation` lệch: `=== false` ở `GT-001`…`GT-028`, `!== false` ở `GT-029`…`GT-036`. **Xoá** guard thì an toàn, **nối** `degradation` sẽ lật hành vi của 8 khuôn — Cấm — NEVER chung một commit |
| Lỗi lệch hệ toạ độ 20% mà [`166`](166-engine-play-behavior-bdd-plan.md) §1.2 đo được | **Đã chữa 2026-09-01.** `render-system.ts:70-79` áp một phép biến đổi tuyệt đối, `clear()` xoá toàn bộ backing store, `toLogicPoint` (`:95-105`) là hàm dùng chung mà `[code].vue:438-450` gọi đúng. Nêu ở đây để không ai đi sửa lại |

## 7. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~`Q209-1`~~ | ~~`GT-000` hoà giải theo cách nào?~~ **Đóng 2026-09-04 (`D-NN`): đổi tên `GT037*` → `GT000*`.** Generator giữ nguyên hợp đồng — nó vốn sinh định danh bằng `t.code.replace("-","")`, nên đổi tên là làm mã khớp lại generator chứ không phải bẻ generator theo mã. Bán kính đo ở §8 | — | Đã đóng | `D-NN` |
| ~~`Q209-2`~~ | ~~Dựng cổng bundle-size thật, hay hạ `BR-PRF-01`?~~ **Đóng 2026-09-04 (`D-NO`): không hạ luật, tách cưỡng chế làm hai theo chi phí đo.** Xem §9 | — | Đã đóng | `D-NO` |
| ~~`Q209-3`~~ | ~~`GT-016` ba chế độ: một phiếu hay ba engine?~~ **Đóng 2026-09-04 (`D-NP`): một engine, một phiếu. Ba chế độ là trục động từ, không phải trục engine.** Xem §10 | — | Đã đóng | `D-NP` |

## 8. Bán kính đổi tên `GT037*` → `GT000*` (`D-NN`, đo 2026-09-04)

**17 định danh**, tất cả cùng tiền tố: `GT037`, `GT037Asset`, `GT037AssetKind`, `GT037AssetKindSchema`,
`GT037AssetSchema`, `GT037Content`, `GT037ContentSchema`, `GT037Difficulty`, `GT037DifficultySchema`,
`GT037Session`, `GT037Step`, `GT037StepLinkSchema`, `GT037StepPresentSchema`, `GT037StepRecallSchema`,
`GT037StepRecogniseSchema`, `GT037StepSchema`, `GT037Template`.

| File | Số lần | Loại |
|---|---|---|
| `packages/game-engine/src/templates/GT-000/template.ts` | 24 | sửa tay |
| `packages/game-engine/src/templates/GT-000/session.ts` | 20 | sửa tay |
| `packages/game-engine/src/templates/GT-000/fixtures.ts` | 4 | sửa tay |
| `packages/game-engine/src/generated/template-seed.ts` | 16 | **sinh lại** |
| `packages/game-engine/src/generated/template-exports.ts` | 5 | **sinh lại** |
| `packages/game-engine/src/generated/studio-options.ts` | 5 | **sinh lại** |
| `packages/game-engine/src/generated/session-loader.ts` | 3 | **sinh lại** |
| `packages/game-engine/src/generated/template-registry.ts` | 2 | **sinh lại** |
| `docs/specs/01-platform/engines/GT-000.md:2` | 1 | sửa tay — frontmatter `spec: ENGINE-GT037` |

**Không có lần xuất hiện nào ngoài `packages/game-engine` và `docs/`.** Không app nào, không package
nào khác chạm tới các định danh này. Ba file nguồn sửa tay, năm file sinh lại bằng `pnpm gen:templates`.

### Thứ tự `ALL_TEMPLATE_CODES` — chỉ một consumer nhạy cảm

Sau khi đổi tên và sinh lại, `discoverTemplates` sắp bằng `localeCompare` nên `GT-000` chuyển từ
**cuối** lên **đầu**. Đã soát cả 14 chỗ dùng `ALL_TEMPLATE_CODES`:

- Không chỗ nào đọc theo chỉ số (`[0]`, `.at(`, `.slice(`) — đã grep, rỗng.
- 4 chỗ dùng `for...of`, không phụ thuộc thứ tự.
- 1 chỗ dùng `toContain`, không phụ thuộc thứ tự.
- **Đúng một chỗ nhạy cảm thứ tự**: `packages/game-engine/tests/template-compliance.test.ts:90` dùng
  `toEqual([...])` với danh sách cứng `GT-001`…`GT-036` — và nó **thiếu hẳn `GT-000`**, nên nó nằm
  trong chín ca đang đỏ. Sửa nó là thêm `"GT-000"` lên **đầu** mảng.

Nên rủi ro thứ tự bằng không ngoài một dòng test đã đỏ sẵn.

## 9. Cưỡng chế ngân sách bundle — tách hai theo chi phí đo (`D-NO`)

Không hạ `BR-PRF-01` và cũng không nhét một lần `nuxt build` vào `pnpm test`. Cả hai đều sai, vì
`BR-ENG-17` (80 KB gzip mỗi khuôn) có **hai lớp lỗi** với chi phí đo chênh nhau ba bậc.

**Đo được gì, với giá nào:**

- `apps/web/package.json:7` có `nuxt build`, nhưng `.output/` nằm trong `.gitignore` và chưa từng
  được dựng trong cây làm việc. Một lần build là hàng phút.
- `pnpm test:deploy` **không** phải chỗ đặt: `infra/scripts/tests/run.sh` tự khai
  *"Nothing here touches a real server"* — nó chạy trên binary giả trong `fakebin/`, không dựng app.
- Vòng verify đã đắt sẵn: chỉ riêng typecheck là 73 giây (root) cộng 256 giây (`apps/web`), và
  [`#204`](204-verify-loop-runtime-plan.md) đang rút số đó, mới xong 48/97 việc. Thêm một lần build
  vào vòng trong là đi ngược task đang chạy.

**Hai lớp lỗi, hai cổng, hai nhịp:**

| Lớp lỗi | Cách nó xảy ra | Cổng | Chi phí | Nhịp |
|---|---|---|---|---|
| Kéo cả 37 khuôn vào entry client | Một `import` tĩnh lẻn lại vào `src/index.ts` hoặc loader sinh ra | **Quét nguồn**: không module nào tới được từ entry client được phép static-import `templates/GT-*/session` hoặc `fixtures` | mili giây | `pnpm test` |
| Một khuôn tự phình quá trần | Nội dung hoặc phụ thuộc của một template lớn dần | **Đo gzip thật**: `nuxt build` rồi đo từng chunk theo `BR-ENG-17` | hàng phút | `pnpm check:bundle`, chạy trước phát hành và trong CI |

Vì sao đây là tối ưu chứ không phải thoả hiệp: lớp thứ nhất là lớp **hồi quy âm thầm** — nó quay lại
bằng một dòng import mà không ai thấy, và nó là **chính xác** cái đợt 4 đi sửa. Bắt nó tốn mili giây.
Lớp thứ hai chỉ trôi từ từ theo nội dung và chỉ cần biết lúc sắp ship. Đặt cả hai vào `pnpm test`
không mua thêm gì mà lấy đi hàng phút mỗi vòng lặp.

Cổng thứ nhất cũng là thứ làm lời khai `BR-TAK-08` ở `session-loader.ts:43-46` thành **thật** —
hôm nay nó nói *"chỉ tải mã của khuôn đang chơi"* trong khi 37 session bị static-import ở đầu file.

Ca âm bắt buộc cho cổng thứ nhất: một fixture thêm lại `import ... from "./templates/GT-001/session"`
vào một module trong đường tới entry client, và cổng phải đỏ.

Trả lời `Q-RG-2` của [`runtime-gates.md`](../specs/08-quality/runtime-gates.md): **wire vào, không hạ
luật** — nhưng wire ở hai nhịp, và ghi cả hai vào §1 và §2 của sổ cưỡng chế.

## 10. `GT-016` — một engine, ba chế độ là trục động từ (`D-NP`)

Câu hỏi hoá ra đã được contract trả lời sẵn. `GT-016/template.ts:29` khai:

```
mode: z.enum(["read", "set", "match"]).default("read")
```

`mode` là **một trường trong content contract**, và `GT016ContentSchema` dùng `.refine()` để bắt buộc
điều kiện riêng cho từng chế độ (`read` cần ≥2 `options` và đúng một `is_correct` khớp `target_time`;
`match` cần ≥2 `activity_cards`). Nên ba chế độ đã là **một engine, một contract, một trường dữ liệu**
— phép tách đã có sẵn và nó nằm ở tầng dữ liệu, không phải tầng engine.

[`166-vi-du.md`](166-vi-du.md) §GT-016 xác nhận cùng cách đọc, và quan trọng hơn: §6.3 của nó đã xếp
`GT-016` vào **hai** feature file — `chinh.feature` (kim đồng hồ là *chỉnh*) và `chot.feature`
(chế độ `set` là *chốt*). Tức nhịp khám phá vốn đã coi `mode` là trục **động từ**, không phải trục
engine.

Tách thành ba engine sẽ: phá `tests/gates/render.test.ts` (ghim 37/37/0 và chuỗi báo cáo), thêm hai
thư mục template, đòi hai phiếu spec mới cho song ánh `BR-ESS-01`, đổi `engine-spec-ready.json`, đổi
`template-seed.ts` (là cột cơ sở dữ liệu, bị so byte), và đổi mọi `content_pack` đã gieo có mang
`mode`. Chi phí lớn, lợi ích hành vi bằng không — vì `mode` đã phân biệt đúng ở tầng contract.

**Quyết định:** giữ một engine, một phiếu spec. Ba chế độ đi vào chỗ đã dành sẵn cho chúng:

- `template.ts` khai `input.verbs` là **hợp** các động từ của cả ba chế độ (`tap`, `adjust`, `commit`).
  Đó là từ vựng đầy đủ của engine.
- Thu hẹp theo chế độ xảy ra **lúc chạy**, ở `toAction`: động từ không hợp lệ trong `mode` hiện tại
  thì trả `null`, và `dispatch` biến nó thành `ACTION_IGNORED`. Đó đúng là việc `ACTION_IGNORED` sinh ra
  để làm.
- Bảng `Examples` của feature file có **ba hàng** cho `GT-016`, mỗi chế độ một hàng. Bảy câu hành vi
  vốn có đáp án khác nhau theo chế độ (`166-vi-du.md` hàng 2, 3, 4 chỉ áp cho `set`; hàng 6 chỉ áp cho
  `read` và `match`) — ba hàng `Examples` là chỗ ghi đúng sự khác nhau đó.
- §17 của phiếu spec có ba nhánh; `BR-ESS-13` vốn đòi mỗi rule một `Scenario`, nên ba chế độ là ba
  scenario, không phải ba file.

Quyết định này rơi thẳng ra từ `A4` ở mục 3 — họ và bộ động từ là **hai khai báo tách rời**. Nếu gộp
chúng, `GT-016` sẽ ép ta tách engine; vì tách rời, nó không.
