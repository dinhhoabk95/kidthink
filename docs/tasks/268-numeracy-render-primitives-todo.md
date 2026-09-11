# Task #268 Todo: Primitive biểu diễn lượng

Plan: [`268-numeracy-render-primitives-plan.md`](268-numeracy-render-primitives-plan.md).
Spec: [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) mục 7.7 ·
[`numeracy-representation-ladder.md`](../specs/05-content/numeracy-representation-ladder.md).

Tám phép đo mở đầu (đo 2026-09-11): 1/8 `kind` có hàm vẽ và call site · 0 call site cho
`drawTenFrameBoard` · cỡ chữ canvas toàn hằng px · nhãn ≈ 8 px CSS trên 390×844 · 59 hằng hex thô
· 3 lớp nút dưới sàn 64 px · `GT-007` vẽ chữ số hai lần · 4 khai báo sàn chạm.

Song song an toàn: **L1 · L5 · L6**. Bắt buộc tuần tự: **L1 → L2 → L3 → L4**.

---

## L1 — Thang cỡ chữ theo `LogicSpace`

- [ ] T1.1 `packages/game-engine/src/render/type-scale.ts` — `CANVAS_TYPE_RATIOS` lấy từ mục 3 của [`05-motion-and-surface.md`](../design-system/05-motion-and-surface.md)
- [ ] T1.2 Năm vai trò: `number` 0,089h · `label` 0,052h · `hud` 0,044h · `caption` 0,036h · `prompt` suy từ `hud`
- [ ] T1.3 `canvasFontPx(space, role)` trả px logic, đã kẹp sàn
- [ ] T1.4 `minLegiblePx(space)` quy đổi **sàn 16 px CSS** sang px logic theo tỷ lệ hiện tại
- [ ] T1.5 Thay `LABEL_MIN_FONT_PX` (`shared-render.ts:57`) bằng lời gọi `canvasFontPx`
- [ ] T1.6 Thay cỡ chữ cố định của `drawCounterBadge` (`:1509`), `drawSubPromptText` (`:1202`), `drawFlashcard` (`:1940` `:2002` `:2020`)
- [ ] T1.7 `drawFlashcard` bỏ kích thước cố định 350×320 px, suy từ `LogicSpace` (`BR-ERC-12`)
- [ ] T1.8 **Test ba viewport** — `390x844`, `820x1180`, `1440x900`: mọi cỡ chữ quy về px CSS đều ≥ 16
- [ ] T1.9 **Ca âm** — đặt một tỷ lệ cho ra dưới sàn → test đỏ, nêu đúng vai trò và viewport
- [ ] T1.10 Cấm — NEVER kiểm sàn bằng px logic; phải quy về px CSS

## L2 — Khung yêu cầu không tràn

- [ ] T2.1 `drawPromptText` (`shared-render.ts:1007`) đo và vẽ bằng **cùng một** cỡ chữ (hiện đo 24 vẽ 22)
- [ ] T2.2 Thêm xuống dòng khi vượt bề rộng khả dụng của `LogicSpace` (`BR-ERC-15`)
- [ ] T2.3 Bỏ kẹp cứng 360–860 px; bề rộng suy từ `space.width`
- [ ] T2.4 **Test** — chuỗi 60 ký tự trên logic space rộng 540 → xuống ≥ 2 dòng, không tràn
- [ ] T2.5 **Ca âm** — chuỗi tràn mà không xuống dòng → test đỏ

## L3 — Hồi sinh ten-frame

- [ ] T3.1 Gỡ hardcode `resolveLayout("number-bond-tree")` ở `GT-007/session.ts:127`
- [ ] T3.2 Chọn layout theo `representation` của `content_pack`, không cứng một giá trị
- [ ] T3.3 Xác nhận `computeTenFrameSplitLayout` (`layout/geometry.ts:550`) chạy được
- [ ] T3.4 Xác nhận `drawTenFrameBoard` (`shared-render-shapes.ts:876`) có call site thật
- [ ] T3.5 Vạch phân nhóm đậm sau cột 5 (`BR-NRL-07`)
- [ ] T3.6 Ô đầy và ô trống phân biệt bằng **hai** kênh thị giác, không chỉ màu
- [ ] T3.7 Sửa `BR-ERC-14` — `GT-007` bỏ một trong hai đường vẽ chữ số; giữ chữ trong vòng tròn, bỏ nhãn lặp bên dưới
- [ ] T3.8 Ảnh chụp ba viewport, so với `docs/qa/engine-captures/2026-09-01/GT-007-*`
- [ ] T3.9 `pnpm db:seed` chạy hết; đếm level của `GT-001` và `GT-007` trước và sau, không đổi

## L4 — Năm primitive mới

- [ ] T4.1 `drawDotPattern` — bố cục chuẩn mặt xúc xắc 1–6; Cấm — NEVER bố cục ngẫu nhiên
- [ ] T4.2 `drawNumberLine` — trục ngang, mốc chia đều, nhãn số ở mốc, con trỏ vị trí
- [ ] T4.3 `drawNumberLine` — khoảng cách hai mốc ≥ sàn chạm khi mốc là phần tử chạm được
- [ ] T4.4 `drawTally` — nhóm năm gạch, gạch thứ năm bắc ngang, nhóm cách nhau ≥ một bề rộng gạch
- [ ] T4.5 `drawRekenrek` — hai hàng mười hạt, mỗi hàng 5 đỏ 5 trắng, vạch phân nhóm ở mốc 5
- [ ] T4.6 `drawRekenrek` — hạt đã đẩy và chưa đẩy khác nhau về **toạ độ x**, không chỉ màu
- [ ] T4.7 `drawNumberRod` — thanh liên tục chia đốt bằng nhau, đốt xen kẽ hai màu
- [ ] T4.8 Mỗi primitive gọi ít nhất một engine thật; Cấm — NEVER để hàm không call site
- [ ] T4.9 Mỗi primitive thêm một hàng vào bảng bảy phép kiểm (mục 7.6 của `engine-render-contract.md`)
- [ ] T4.10 Mỗi primitive: ảnh chụp ba viewport đặt cạnh bộ `2026-09-01/`
- [ ] T4.11 **Ca âm `BR-ERC-13`** — khai một `kind` chưa có call site → cổng đỏ
- [ ] T4.12 **Ca âm `BR-NRL-10`** — `content_pack` mang `kind` engine chưa hiện thực → engine **ném lỗi**, không vẽ `discrete-object` thay
- [ ] T4.13 `finger` **không** làm trong task này — chờ câu hỏi mở 2 của spec thang

## L5 — Cổng hex thô

- [ ] T5.1 `scripts/check-render-tokens.ts` quét hằng hex trong `packages/game-engine` ngoài `designTokens.ts`
- [ ] T5.2 Ratchet mở đầu 59 (42 ở `shared-render.ts`, 17 ở `shared-render-shapes.ts`), chỉ giảm
- [ ] T5.3 Nối vào `package.json` và `scripts/check.sh`
- [ ] T5.4 **Ca âm `BR-DSC-26`** — thêm một hằng hex vào tầng render → cổng đỏ, nêu đúng file và dòng
- [ ] T5.5 Đổi hằng hex của sáu primitive mới sang token; không tăng nợ

## L6 — Sàn chạm và nút lỗi

- [ ] T6.1 Nâng `.btn-audio-speak`, `.btn-primary`, `.btn-secondary` ở `play-surface.css:381` từ 48 px lên sàn 64 px (`BR-DSC-28`)
- [ ] T6.2 **Ca âm** — đặt một nút bề mặt trẻ dưới 64 px → test `packages/ui/tests/kid-surface.test.ts` đỏ
- [ ] T6.3 Gộp bốn khai báo sàn chạm về một, giữ `TOUCH_FLOORS` ở `packages/ui/src/index.ts`
- [ ] T6.4 `getTouchFloor()` và `MIN_TOUCH_PX` import từ `TOUCH_FLOORS`, không khai lại
- [ ] T6.5 `min-h-19` ở `packages/ui/app.config.ts:24` sinh từ `TOUCH_FLOORS.kidPrimary`, không viết số
- [ ] T6.6 Nếu task `#270` đã làm T6.3–T6.5 thì bỏ qua; **chỉ một** task làm

## L7 — Chốt số

- [ ] T7.1 Đo lại M1: 7/8 `kind` có hàm vẽ và call site (`finger` để lại)
- [ ] T7.2 Đo lại M2: `drawTenFrameBoard` có ≥ 1 call site
- [ ] T7.3 Đo lại M4: sàn cỡ chữ trên 390×844 ≥ 16 px CSS
- [ ] T7.4 Đo lại M5: hằng hex thô giảm, ratchet chốt số mới
- [ ] T7.5 Đo lại M6: 0 nút bề mặt trẻ dưới sàn
- [ ] T7.6 Đo lại M7: `GT-007` vẽ chữ số đúng một lần
- [ ] T7.7 Đo lại M8: 1 khai báo sàn chạm
- [ ] T7.8 `pnpm qa:capture` chạy lại; so bộ ảnh mới với `2026-09-01/` và ghi nhận khác biệt
- [ ] T7.9 `pnpm check` xanh; `pnpm typecheck` không thêm nợ
