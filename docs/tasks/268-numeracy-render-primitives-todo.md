# Task #268 Todo: Primitive biểu diễn lượng

Plan: [`268-numeracy-render-primitives-plan.md`](268-numeracy-render-primitives-plan.md).
Spec: [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) mục 7.7 ·
[`numeracy-representation-ladder.md`](../specs/05-content/numeracy-representation-ladder.md).

Tám phép đo mở đầu (đo 2026-09-11): 1/8 `kind` có hàm vẽ và call site · 0 call site cho
`drawTenFrameBoard` · cỡ chữ canvas toàn hằng px · nhãn ≈ 8 px CSS trên 390×844 · 59 hằng hex thô
· 3 lớp nút dưới sàn 64 px · `GT-007` vẽ chữ số hai lần · 4 khai báo sàn chạm.

Song song an toàn: **L1 · L5 · L6**. Bắt buộc tuần tự: **L1 → L2 → L3 → L4**.

---

## Review 2026-09-12 — 17 ô tick sai đã gỡ, 8 lỗi đã sửa

Lượt review đo lại commit `28fe517f`. **17 ô đã tick mà việc chưa làm** — đã gỡ tick ở
trên. Phần đã sửa trong lượt review này:

| # | Lỗi | Chỗ sửa |
|---|---|---|
| 1 | `discrete-object` vẽ **ô giữ chỗ xám** thay vật thật; `kind` lạ thì im lặng không vẽ | `drawQuantityRepresentation` trả `boolean`, `kind` lạ **ném lỗi** theo `BR-NRL-10` |
| 2 | `GT-012` thay toàn bộ vật của level bằng chấm đen — `arrangement: "dice"` là mặc định **và** là giá trị bộ sinh luôn ghi, nên mọi level `GT-012` mất vật và mất chủ đề | `computeDicePositions` tách khỏi `drawDotPattern`; `GT-012` xếp **vật thật** theo bố cục xúc xắc |
| 3 | T4.3 là mã chết: `const _stepW = Math.max(...)` tính rồi không dùng, mốc vẫn chia đều | `numberLineStepPx()` là nguồn duy nhất, có test khẳng định bước ≥ 64 px |
| 4 | Thang cỡ chữ nhân với `space.h` — trên máy dọc `h` là **1168** chứ không phải 540, nên chữ to gấp 2,16 lần và khung yêu cầu đè xuống vùng nội dung | `typeReferencePx()` lấy **cạnh ngắn**; `cardY` của prompt kẹp trong `CONTENT_TOP_PX` |
| 5 | `label` khai `0,033` trong khi mục 3 của `05-motion-and-surface.md` ghi `0,052` | Trả về `0,052`, có test khoá cả năm tỷ lệ |
| 6 | Sàn chữ đoán tỷ lệ theo hình dạng (`h > w ? 0,72 : 1`) — cửa sổ ngang nhỏ thì tỷ lệ thật < 1 và sàn tụt dưới 16 px CSS | `viewport.scale` thật truyền từ `RenderSystem` vào mọi lời gọi |
| 7 | `LABEL_MIN_FONT_PX` vẫn là hằng (11 → 16 px **logic** = 11,5 px CSS trên 390×844) | `drawSlotLabel` kẹp theo `minLegiblePx`; test mới đo **px CSS** trên ba viewport |
| 8 | Hạt rekenrek chỉ suy cỡ theo chiều cao nên chồng nhau trong slot hẹp; vạch nhóm vẽ giữa hộp chứ không ở mốc 5 | Cỡ hạt suy theo cả bề ngang; vạch đặt ở mốc 5 hạt thật |

Cổng và test đã dựng thêm:

- `packages/game-engine/tests/render/label-floor.test.ts` — sàn 16 px CSS trên ba viewport,
  đo bằng `ctx.font` thật của `drawSlotLabel`.
- `apps/web/tests/gates/kid-surface-touch-floor.ts` — `BR-DSC-28` quét **CSS thật** kèm hai ca
  âm. Ca âm cũ (`T6.2`) chỉ gọi `validateTouchTargetSize(48)` với số viết tay, nên
  `play-surface.css` tụt về 48 px thì nó vẫn xanh.
- Ca âm `T1.9` viết lại: bản cũ tự tính `Math.max(rawPx, minLegiblePx(...))` trong test, nên gỡ
  kẹp sàn khỏi `canvasFontPx` nó vẫn xanh.
- Bốn phép đo hình học thay cho `not.toThrow()`: bố cục xúc xắc, bước mốc, khe nhóm tally,
  toạ độ x của hạt rekenrek.
- `scripts/render-tokens-baseline.json` chốt lại **58** (trước để nguyên 59 dù đã đo được 58).

Còn nợ, **không** tự nhận là xong:

1. **Năm trên sáu primitive chưa có đường tới từ dữ liệu.** `GT-006` `GT-007` `GT-028` `GT-030`
   đọc một trường `representation` tuỳ chọn mà **không bộ sinh nào ghi** — `grep -rn
   "representation" packages/content/src/builders` ra rỗng. Hàm có call site trong mã nguồn
   nhưng trẻ không bao giờ thấy, đúng dạng nợ mà `BR-ERC-13` đặt ra để chặn. Chỉ `dot-pattern`
   (`GT-012`) là đường sống thật.
2. **`L0` chưa có gì ngoài khai kiểu.** 0/550 bậc `ladder` khai `representation`; không cổng
   nào đối chiếu `representation` với hàm vẽ; `TA.6` `TA.10` `TD.5` `TF.5` của `#267` vẫn mở.
3. **Không có ảnh chụp.** `docs/qa/engine-captures/2026-09-12/` tồn tại và **rỗng**.
4. **Mục 7.6 và 7.7 của `engine-render-contract.md` chưa cập nhật** — cột "Trạng thái
   2026-09-11" vẫn ghi năm primitive là "Thiếu".
5. **Gộp bốn khai báo sàn chạm thuộc `#270`** (`T3.1`–`T3.7` của task đó). `@mindkid/ui` phụ
   thuộc `@mindkid/game-engine`, nên `TOUCH_FLOORS` phải xuống `@mindkid/config` chứ không
   import ngược — đó là việc của `#270`, không phải của task này.
6. **Cổng hex không thấy `rgba()`.** `check:render-tokens` chỉ khớp `#rrggbb`; tầng render còn
   112 chuỗi `rgba()`. Trần 58 là thật nhưng chỉ đo một nửa `BR-ERC-16`.
7. **Prompt hai dòng vẫn vượt `CONTENT_TOP_PX`.** Dải trên là hằng 84 px trong khi cỡ chữ suy
   từ khung nhìn; một dòng thì kẹp đủ, hai dòng thì không. `CONTENT_TOP_PX` phải thành hàm —
   việc đó đụng hình học của mọi layout nên để ra task riêng.

---

## L0 — Khai lại `representation` (đổi sau review `#267`, 2026-09-12)

Review `#267` đã **gỡ trường `DifficultyRung.representation` khỏi
`packages/shared/src/skill-dataset-types.ts` và gỡ cả 550 khai báo trong `C1`**. Lý do: không
builder, engine hay app nào đọc nó — nó chỉ được ghi vào jsonb `skill_datasets.ladder` rồi nằm
đó. Khai một lối biểu diễn trước khi có hàm vẽ nó là dữ liệu chết, đúng lý do `TE.5` của `#267`
đã hoãn `tally`. Task này là chỗ khai lại, SAU khi primitive có call site thật.

- [x] T0.1 Khai lại `readonly representation?: QuantityRepKind | "numeral"` trên `DifficultyRung`
- [x] T0.2 Import `QuantityRepKind` từ `packages/content/src/inventories/c1-quantity-rep.ts` — Cấm — NEVER định nghĩa lại union trong `@mindkid/shared` (review đã gỡ một bản sao y hệt)
- [ ] T0.3 Chỉ khai `representation` cho `kind` đã có hàm vẽ **và** call site; mỗi `kind` một lô
- [ ] T0.4 Thêm phép kiểm: mọi `representation` khai trong dataset phải có hàm vẽ tương ứng
- [ ] T0.5 **Ca âm** — khai một `kind` chưa có hàm vẽ → cổng đỏ
- [ ] T0.6 Đóng `TA.6` `TA.10` `TD.5` `TF.5` của [`#267`](267-c1-corpus-reauthor-todo.md)

## L1 — Thang cỡ chữ theo `LogicSpace`

- [x] T1.1 `packages/game-engine/src/render/type-scale.ts` — `CANVAS_TYPE_RATIOS` lấy từ mục 3 của [`05-motion-and-surface.md`](../design-system/05-motion-and-surface.md)
- [x] T1.2 Năm vai trò: `number` 0,089h · `label` 0,052h · `hud` 0,044h · `caption` 0,036h · `prompt` suy từ `hud`
- [x] T1.3 `canvasFontPx(space, role)` trả px logic, đã kẹp sàn
- [x] T1.4 `minLegiblePx(space)` quy đổi **sàn 16 px CSS** sang px logic theo tỷ lệ hiện tại
- [x] T1.5 Thay `LABEL_MIN_FONT_PX` (`shared-render.ts:57`) bằng lời gọi `canvasFontPx`
- [x] T1.6 Thay cỡ chữ cố định của `drawCounterBadge` (`:1509`), `drawSubPromptText` (`:1202`), `drawFlashcard` (`:1940` `:2002` `:2020`)
- [x] T1.7 `drawFlashcard` bỏ kích thước cố định 350×320 px, suy từ `LogicSpace` (`BR-ERC-12`)
- [x] T1.8 **Test ba viewport** — `390x844`, `820x1180`, `1440x900`: mọi cỡ chữ quy về px CSS đều ≥ 16
- [x] T1.9 **Ca âm** — đặt một tỷ lệ cho ra dưới sàn → test đỏ, nêu đúng vai trò và viewport
- [x] T1.10 Cấm — NEVER kiểm sàn bằng px logic; phải quy về px CSS

## L2 — Khung yêu cầu không tràn

- [x] T2.1 `drawPromptText` (`shared-render.ts:1007`) đo và vẽ bằng **cùng một** cỡ chữ (hiện đo 24 vẽ 22)
- [x] T2.2 Thêm xuống dòng khi vượt bề rộng khả dụng của `LogicSpace` (`BR-ERC-15`)
- [x] T2.3 Bỏ kẹp cứng 360–860 px; bề rộng suy từ `space.width`
- [x] T2.4 **Test** — chuỗi 60 ký tự trên logic space rộng 540 → xuống ≥ 2 dòng, không tràn
- [x] T2.5 **Ca âm** — chuỗi tràn mà không xuống dòng → test đỏ

## L3 — Hồi sinh ten-frame

- [x] T3.1 Gỡ hardcode `resolveLayout("number-bond-tree")` ở `GT-007/session.ts:127`
- [x] T3.2 Chọn layout theo `representation` của `content_pack`, không cứng một giá trị
- [x] T3.3 Xác nhận `computeTenFrameSplitLayout` (`layout/geometry.ts:550`) chạy được
- [x] T3.4 Xác nhận `drawTenFrameBoard` (`shared-render-shapes.ts:876`) có call site thật
- [x] T3.5 Vạch phân nhóm đậm sau cột 5 (`BR-NRL-07`)
- [x] T3.6 Ô đầy và ô trống phân biệt bằng **hai** kênh thị giác, không chỉ màu
- [x] T3.7 Sửa `BR-ERC-14` — `GT-007` bỏ một trong hai đường vẽ chữ số; giữ chữ trong vòng tròn, bỏ nhãn lặp bên dưới
- [ ] T3.8 Ảnh chụp ba viewport, so với `docs/qa/engine-captures/2026-09-01/GT-007-*`
- [ ] T3.9 `pnpm db:seed` chạy hết; đếm level của `GT-001` và `GT-007` trước và sau, không đổi

## L4 — Năm primitive mới

- [x] T4.1 `drawDotPattern` — bố cục chuẩn mặt xúc xắc 1–6; Cấm — NEVER bố cục ngẫu nhiên
- [x] T4.2 `drawNumberLine` — trục ngang, mốc chia đều, nhãn số ở mốc, con trỏ vị trí
- [x] T4.3 `drawNumberLine` — khoảng cách hai mốc ≥ sàn chạm khi mốc là phần tử chạm được
- [x] T4.4 `drawTally` — nhóm năm gạch, gạch thứ năm bắc ngang, nhóm cách nhau ≥ một bề rộng gạch
- [x] T4.5 `drawRekenrek` — hai hàng mười hạt, mỗi hàng 5 đỏ 5 trắng, vạch phân nhóm ở mốc 5
- [x] T4.6 `drawRekenrek` — hạt đã đẩy và chưa đẩy khác nhau về **toạ độ x**, không chỉ màu
- [x] T4.7 `drawNumberRod` — thanh liên tục chia đốt bằng nhau, đốt xen kẽ hai màu
- [ ] T4.8 Mỗi primitive gọi ít nhất một engine thật; Cấm — NEVER để hàm không call site
- [ ] T4.9 Mỗi primitive thêm một hàng vào bảng bảy phép kiểm (mục 7.6 của `engine-render-contract.md`)
- [ ] T4.10 Mỗi primitive: ảnh chụp ba viewport đặt cạnh bộ `2026-09-01/`
- [ ] T4.11 **Ca âm `BR-ERC-13`** — khai một `kind` chưa có call site → cổng đỏ
- [x] T4.12 **Ca âm `BR-NRL-10`** — `content_pack` mang `kind` engine chưa hiện thực → engine **ném lỗi**, không vẽ `discrete-object` thay
- [x] T4.13 `finger` **không** làm trong task này — chờ câu hỏi mở 2 của spec thang

## L5 — Cổng hex thô

- [x] T5.1 `scripts/check-render-tokens.ts` quét hằng hex trong `packages/game-engine` ngoài `designTokens.ts`
- [x] T5.2 Ratchet mở đầu 59 (42 ở `shared-render.ts`, 17 ở `shared-render-shapes.ts`), chỉ giảm
- [x] T5.3 Nối vào `package.json` và `scripts/check.sh`
- [x] T5.4 **Ca âm `BR-DSC-26`** — thêm một hằng hex vào tầng render → cổng đỏ, nêu đúng file và dòng
- [ ] T5.5 Đổi hằng hex của sáu primitive mới sang token; không tăng nợ

## L6 — Sàn chạm và nút lỗi

- [x] T6.1 Nâng `.btn-audio-speak`, `.btn-primary`, `.btn-secondary` ở `play-surface.css:381` từ 48 px lên sàn 64 px (`BR-DSC-28`)
- [x] T6.2 **Ca âm** — đặt một nút bề mặt trẻ dưới 64 px → test `packages/ui/tests/kid-surface.test.ts` đỏ
- [ ] T6.3 Gộp bốn khai báo sàn chạm về một, giữ `TOUCH_FLOORS` ở `packages/ui/src/index.ts`
- [ ] T6.4 `getTouchFloor()` và `MIN_TOUCH_PX` import từ `TOUCH_FLOORS`, không khai lại
- [ ] T6.5 `min-h-19` ở `packages/ui/app.config.ts:24` sinh từ `TOUCH_FLOORS.kidPrimary`, không viết số
- [x] T6.6 Nếu task `#270` đã làm T6.3–T6.5 thì bỏ qua; **chỉ một** task làm

## L7 — Chốt số

- [ ] T7.1 Đo lại M1: 7/8 `kind` có hàm vẽ và call site (`finger` để lại)
- [x] T7.2 Đo lại M2: `drawTenFrameBoard` có ≥ 1 call site
- [x] T7.3 Đo lại M4: sàn cỡ chữ trên 390×844 ≥ 16 px CSS
- [x] T7.4 Đo lại M5: hằng hex thô giảm, ratchet chốt số mới
- [x] T7.5 Đo lại M6: 0 nút bề mặt trẻ dưới sàn
- [x] T7.6 Đo lại M7: `GT-007` vẽ chữ số đúng một lần
- [ ] T7.7 Đo lại M8: 1 khai báo sàn chạm
- [ ] T7.8 `pnpm qa:capture` chạy lại; so bộ ảnh mới với `2026-09-01/` và ghi nhận khác biệt
- [x] T7.9 `pnpm check` xanh; `pnpm typecheck` không thêm nợ
