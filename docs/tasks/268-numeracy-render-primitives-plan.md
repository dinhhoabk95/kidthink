# Task #268 Plan: Primitive biểu diễn lượng — hồi sinh ten-frame, thêm năm cái còn thiếu, ép cỡ chữ theo không gian logic

> **Mục tiêu**: Nền tảng dạy số học cho trẻ mầm non hiện chỉ vẽ được hai lối biểu diễn lượng: vật
> rời và ký hiệu số. Hàm vẽ ten-frame đã tồn tại và **chết** — 0 call site. Number line, dot
> pattern, tally, rekenrek, number rod chưa từng có.
>
> Cùng lúc, cỡ chữ trên canvas đặt bằng hằng số px trong khi spec thiết kế quy định tỷ lệ theo
> không gian logic; hệ quả là nhãn 11 px ra khoảng 8 px CSS trên máy dọc 390 px, dưới sàn 16 px
> của `BR-A11-08`.

Spec: [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) mục 7.7 và
`BR-ERC-12` tới `BR-ERC-16` ·
[`numeracy-representation-ladder.md`](../specs/05-content/numeracy-representation-ladder.md).

---

## 1. Bối cảnh

### 1.1 Tám phép đo mở đầu (đo 2026-09-11)

| # | Phép đo | Hiện tại | Đích |
|---|---|---|---|
| M1 | `kind` của `c1-quantity-rep` có hàm vẽ **và** call site | 1 / 8 (`discrete-object`) | 8 / 8 |
| M2 | Call site của `drawTenFrameBoard` | 0 | ≥ 1 |
| M3 | Cỡ chữ canvas đặt bằng hằng số px | mọi chỗ | 0 |
| M4 | Sàn cỡ chữ nhãn trên viewport 390×844 | ≈ 8 px CSS | ≥ 16 px CSS |
| M5 | Hằng hex thô trong tầng render | 59 (42 + 17) | 0 |
| M6 | Nút bề mặt trẻ dưới sàn chạm 64 px | 3 lớp trong `play-surface.css:381` | 0 |
| M7 | Engine vẽ chữ số hai lần trong một khung nhìn | 1 (`GT-007`) | 0 |
| M8 | Khai báo sàn chạm trong repo | 4 (3 TS + 1 lớp Tailwind) | 1 |

Lệnh tái lập M2 và M5:

```bash
grep -rn "drawTenFrameBoard" packages/game-engine/src --include=*.ts | grep -v "export function"
grep -oE "#[0-9a-fA-F]{3,8}" packages/game-engine/src/render/shared-render.ts | wc -l
grep -oE "#[0-9a-fA-F]{3,8}" packages/game-engine/src/render/shared-render-shapes.ts | wc -l
```

### 1.2 Khoản nợ 1 — ten-frame chết vì một dòng hardcode

`GT-007/template.ts` khai `layouts: ["number-bond-tree", "ten-frame-split"]`. Nhưng
`GT-007/session.ts:127` gọi `resolveLayout("number-bond-tree")` cứng, nên nhánh thứ hai không bao
giờ tới được. Kéo theo hai thứ chết cùng:

- `computeTenFrameSplitLayout` (`packages/game-engine/src/layout/geometry.ts:550`)
- `drawTenFrameBoard` (`packages/game-engine/src/render/shared-render-shapes.ts:876`)

Đây là dạng lỗi đắt nhất trong repo: công đã bỏ ra, hàm đã viết, test có thể đã có, mà năng lực
thì không tồn tại. `BR-ERC-13` yêu cầu cổng kiểm **cả hai vế** — có hàm và có call site.

### 1.3 Khoản nợ 2 — cỡ chữ là hằng số, không phải tỷ lệ

Mục 3 của [`05-motion-and-surface.md`](../design-system/05-motion-and-surface.md) quy định cỡ chữ
canvas là tỷ lệ của chiều cao logic 540, và "không bao giờ dưới 16 px". Code làm ngược:

| Hằng | Giá trị | Vị trí |
|---|---:|---|
| `LABEL_MIN_FONT_PX` | 11 | `shared-render.ts:57` |
| `drawCounterBadge` | 14 | `shared-render.ts:1509` |
| `drawSubPromptText` | 16 | `shared-render.ts:1202` |
| `PROMPT_FONT_PX` | 24 (đo) nhưng vẽ ở 22 | `shared-render.ts:54` và `:1053` |

Trên viewport 390×844 tỷ lệ CSS khoảng 0,72. Nhãn 11 px ra ≈ 8 px CSS; badge 14 px ra ≈ 10 px CSS.
Ghi chú trong `systems/degradation.ts:6` nói rõ cỡ chữ là sàn khả năng tiếp cận không bao giờ được
tuột — nhưng chính cái sàn ấy đang là 11.

### 1.4 Khoản nợ 3 — `GT-007` vẽ chữ số hai lần

`GT-007/session.ts` truyền cả `text: String(value)` lẫn `label` vào `drawSlotItem`, nên mỗi nút
number-bond hiện chữ số to trong vòng tròn và lặp lại chữ số bé 11 px ngay dưới. Thấy rõ ở
`docs/qa/engine-captures/2026-09-01/GT-007-mobile-390x844.png`.

### 1.5 Khoản nợ 4 — khung yêu cầu tràn trên máy dọc

`drawPromptText` (`shared-render.ts:1007`) đo bằng `PROMPT_FONT_PX` là 24 rồi vẽ bằng `bold 22px`,
kẹp bề rộng khung trong khoảng 360–860 px và **không xuống dòng**. Trên không gian logic rộng 540
(máy dọc), khung tràn và bị phần tử khác đè lên.

---

## 2. Thiết kế

### 2.1 Thang cỡ chữ suy từ `LogicSpace`

Thay mọi hằng px bằng một hàm:

```typescript
// packages/game-engine/src/render/type-scale.ts
export function canvasFontPx(space: LogicSpace, role: CanvasTypeRole): number {
  const ratio = CANVAS_TYPE_RATIOS[role];          // từ 05-motion-and-surface.md §3
  const raw = space.height * ratio;
  return Math.max(raw, minLegiblePx(space));        // sàn 16 px CSS quy về px logic
}
```

`minLegiblePx` quy đổi ngược: sàn là **16 px CSS**, nên sàn tính bằng px logic phụ thuộc tỷ lệ
hiện tại. Đây là điểm dễ sai nhất của task — sàn 16 px logic **không** bằng sàn 16 px CSS.

Năm vai trò theo spec thiết kế: `number` (0,089h) · `label` (0,052h) · `hud` (0,044h) ·
`caption` (0,036h) · `prompt` (suy từ `hud`).

### 2.2 Sáu primitive

| `kind` | Hình học bắt buộc | Ghi chú thi công |
|---|---|---|
| `ten-frame` | Lưới 2×5, vạch phân nhóm đậm sau cột 5; ô đầy và ô trống phân biệt bằng hai kênh | Hàm đã có; việc chính là gỡ hardcode ở `GT-007/session.ts:127` |
| `dot-pattern` | Bố cục chấm chuẩn mặt xúc xắc cho 1–6; Cấm — NEVER bố cục ngẫu nhiên | Nhận-tức-thì dựa vào hình dạng cố định; ngẫu nhiên thì mất trọn giá trị |
| `number-line` | Trục ngang, mốc chia đều, nhãn số ở mốc, con trỏ vị trí | Khoảng cách hai mốc không nhỏ hơn sàn chạm khi mốc chạm được — xem câu hỏi mở 3 của spec thang |
| `tally` | Nhóm năm gạch, gạch thứ năm bắc ngang; nhóm cách nhau ≥ một bề rộng gạch | Kênh của `C1.DAT.01` |
| `rekenrek` | Hai hàng mười hạt, mỗi hàng 5 đỏ 5 trắng; đã đẩy và chưa đẩy phân biệt bằng **vị trí**, không chỉ màu | Phân biệt bằng màu thôi thì hỏng với trẻ mù màu |
| `number-rod` | Thanh liên tục chia đốt bằng nhau, đốt xen kẽ hai màu | Giáo cụ Montessori; lượng liên tục đối lập rời rạc |

`finger` để lại — câu hỏi mở 2 của spec thang chưa chốt vẽ bằng emoji hay hình riêng.

### 2.3 Gỡ hardcode `GT-007`

`session.ts:127` phải chọn layout theo `content_pack`, không cứng một giá trị. Layout nào dùng do
`representation` của bậc `ladder` quyết định (task `#267` khai nó).

Kèm sửa `BR-ERC-14`: bỏ một trong hai đường vẽ chữ số, giữ chữ số trong vòng tròn, bỏ nhãn lặp
bên dưới.

### 2.4 Gộp bốn khai báo sàn chạm

Bốn nơi hiện khai 96/76/64:

| Nơi | Hình thức | Ghi chú |
|---|---|---|
| `packages/ui/src/index.ts:13` | `TOUCH_FLOORS` | chú thích tự nhận là "single source of truth" |
| `packages/game-engine/src/layout/constants.ts:22` | `getTouchFloor()` | |
| `packages/game-engine/src/interaction.ts:7` | `MIN_TOUCH_PX` | chú thích ghi "Never re-declare these numbers elsewhere" |
| `packages/ui/app.config.ts:24` | lớp `min-h-19` | 76 px viết dưới dạng Tailwind |

Hai nơi cùng tự nhận là nguồn duy nhất. Giữ `TOUCH_FLOORS` ở `packages/ui`, ba nơi còn lại import.
Việc này thuộc `BR-CFO-07` và chồng lấn task `#270`; làm ở task nào cũng được, nhưng **chỉ một**.

### 2.5 Cổng hex thô trở lại

`BR-DSC-02` cấm hex thô trong `packages/game-engine` ngoài `designTokens.ts`. Cổng đo nó mất cùng
`packages/gates`. Dựng lại với ratchet mở đầu 59, chỉ giảm.

---

## 3. Rủi ro

| Rủi ro | Dấu hiệu | Cách chặn |
|---|---|---|
| Sàn 16 px logic nhầm với 16 px CSS | Cổng xanh, chữ vẫn nhỏ trên máy dọc | Test khẳng định trên **ba viewport** cụ thể, tính ra px CSS thật, không tính px logic |
| Primitive mới đẹp trên desktop, vỡ trên máy dọc | Ảnh chụp chỉ có một viewport | Mỗi primitive bắt buộc ba ảnh: `390x844`, `820x1180`, `1440x900` |
| Gỡ hardcode `GT-007` làm vỡ 992 level của `GT-001` | Seed đỏ hàng loạt | `GT-007` và `GT-001` là hai template khác nhau; kiểm bằng `pnpm db:seed` và đếm level trước/sau |
| Ten-frame "sống" nhưng chỉ chạy ở một nhánh không ai vào | M2 đếm được call site mà trẻ không bao giờ thấy | Cổng kiểm call site **và** ảnh chụp phải thấy ten-frame thật |
| Rekenrek phân biệt chỉ bằng màu | Trẻ mù màu không chơi được | Test khẳng định hạt đã đẩy và chưa đẩy khác nhau về toạ độ x |

---

## 4. Phạm vi

**Trong phạm vi**: thang cỡ chữ theo `LogicSpace`; sáu primitive; gỡ hardcode `GT-007`; sửa vẽ
chữ số hai lần; sửa khung yêu cầu tràn; cổng hex thô; nâng ba lớp nút dưới sàn chạm.

**Ngoài phạm vi**: primitive `finger` (chờ câu hỏi mở 2). Khai `representation` trong dataset —
task `#267`. Gộp bốn khai báo sàn chạm nếu task `#270` làm trước.
