---
spec: PLAY-STAGE-ZONES
title: Bàn chơi năm vùng — bố cục chung của mọi game engine trên bề mặt trẻ
area: platform
status: approved
mvp: true
phase: P4
reviewed: 2026-10-03
owns:
  - Năm vùng của bàn chơi, thứ tự và vị trí của chúng theo hướng màn hình
  - Ranh giới shell và engine — vùng nào ai vẽ, ai nhận chạm
  - Hàm hình học vùng `computeStageZones` và kiểu `StageZones`
  - Vị trí duy nhất của nút hành động và của chỉ báo tiến độ vòng
depends_on:
  - GAME-ENGINE-RUNTIME
  - GAME-LAYOUT-ENGINE
  - ENGINE-RENDER-CONTRACT
  - ENGINE-INPUT-CONTRACT
  - ACCESSIBILITY
---

# Bàn chơi năm vùng — bố cục chung của mọi game engine trên bề mặt trẻ

## 1. Objective

Trẻ 3–6 tuổi chưa đọc được và học giao diện bằng **vị trí**, không bằng nhãn. Đo ngày 2026-09-25:
37 session engine tự vẽ lời dẫn, bàn, khay và nút lên canvas ở chỗ mỗi engine tự chọn — nút nộp
bài nằm ở bốn vị trí khác nhau (GT-002 dưới giữa, GT-034 trên, GT-035 góc trên phải, GT-036
`y=465`), tiến độ vòng hiện hai lần ở bốn engine, và GT-028 chỉ nộp được bài qua gesture `commit`
mà trang chơi chỉ gửi từ nút intro của GT-000.

File này chốt **một khung năm vùng** cho mọi engine: dải HUD, vùng lời dẫn, sân khấu, khay, nút
hành động. Trẻ học năm vị trí một lần rồi dùng lại cho mọi trò, nên sức chú ý dồn vào bài toán
trên sân khấu thay vì đi tìm nút. Hình học slot bên trong sân khấu vẫn thuộc
[`game-layout-engine.md`](game-layout-engine.md); cách vẽ vẫn thuộc
[`engine-render-contract.md`](engine-render-contract.md). File này chỉ sở hữu **khung** bao quanh
chúng.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Child | — | Chạm vào vùng lời dẫn, sân khấu, khay, nút hành động; không tới được khoá phụ huynh bằng một chạm |
| Shell web | — | Sở hữu HUD, tính vùng, nhận chạm ở vùng lời dẫn và nút hành động |
| Engine | — | Vẽ trong sân khấu và khay theo rect được cấp; khai `needsCommit`, `needsTray` |
| Dev | — | Chuyển một engine vào khung; thêm biến thể vùng qua PR sửa spec này trước |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/play/{code}` — [`apps/web/app/pages/play/[code].vue`](../../../apps/web/app/pages/play/[code].vue) | Child | Bề mặt chơi duy nhất đang sống |
| `/play/preview-sandbox` | Manager qua Studio | Cùng khung, không HUD — xem mục 5 |
| `packages/game-engine/src/layout/` | Dev | Nơi ở của `computeStageZones` |

## 4. Main flow

```
landscape                                   portrait
+------------------------------------------+  +----------------------+
| [khoá PH]    o o * . .          [loa]    |  | [khoá]  o o * .  [loa]|  1 HUD (DOM)
+------------------------------------------+  +----------------------+
| mascot  [loa]  [picto mục tiêu]          |  | mascot [loa] [picto]  |  2 lời dẫn
+------------------------------------------+  +----------------------+
|                                          |  |                      |
|              SÂN KHẤU                    |  |       SÂN KHẤU       |  3 sân khấu
|                                          |  |                      |
+----------------------------------+-------+  +----------------------+
|  khay                            |  [v]  |  | khay                 |  4 khay
+----------------------------------+-------+  +--------------+-------+
                                              |              |  [v]  |  5 hành động
                                              +--------------+-------+
```

Điện thoại ngang thấp (784x250 canvas, xem mục 5) đổi bố cục thành ba cột: lời dẫn bên trái, sân
khấu ở giữa, khay (nếu có) và nút hành động bên phải.

```
+-------+------------------------+-----+-------+
| mascot|                        |     |       |
| [loa] | SÂN KHẤU               | khay|       |
| picto |                        | cột |  [v]  |
+-------+------------------------+-----+-------+
```

1. Trang chơi mở trong layout trẻ, chiếm trọn viewport, không navbar và footer công khai.
2. Shell đo viewport, lấy không gian logic từ
   [`game-engine-runtime.md`](game-engine-runtime.md) mục 7.1 và tỉ lệ `cssPerLogic`.
3. Shell hỏi session `needsTray` và `needsCommit`, gọi `computeStageZones` một lần, nhận
   `StageZones`. Shell chỉ vẽ vùng lời dẫn khi session khai `usesPromptZone` (xem mục 5).
4. Shell dựng HUD bằng DOM phía trên canvas. Bốn vùng còn lại nằm trong canvas.
5. Engine nhận `zones.stage` (và `zones.tray` nếu có) qua `prepareRound`; hàm layout slot tính
   trong rect đó thay cho toàn canvas.
6. Chạm vào canvas đi qua `toLogicPoint`. Shell kiểm vùng trước: trong `zones.promptSpeaker` thì
   phát lại lời dẫn của vòng; trong `zones.action` thì gửi gesture `commit`; còn lại chuyển cho
   `dispatch` của engine.
7. Phản hồi đúng hoặc sai hiện tại điểm chạm trên sân khấu, và mascot ở vùng lời dẫn đổi dáng
   cùng lúc với tiếng.
8. Viewport đổi (xoay máy, đổi cỡ cửa sổ) thì quay lại bước 2, rồi `syncView()` để lớp truy cập
   bằng bàn phím và screen reader dùng toạ độ mới.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Engine chưa dời vào khung | `usesPromptZone` là `false` (mặc định) | Shell **không** vẽ `drawPromptZone`; engine vẫn tự vẽ lời dẫn bằng `drawPromptText` — đúng một nơi vẽ lời dẫn cho mỗi khung hình. Engine đã dời đặt `usesPromptZone = true` và cấm gọi `drawPromptText`. `RoundRunner` cấp `stageRect` cho mọi session nên sự có mặt của `stageRect` không thay được cờ này. Dời một engine thì đổi cờ trong cùng PR |
| Engine không cần khay | `needsTray` là `false` | Sân khấu lấy luôn chiều cao khay. Portrait: trọn ngang, dừng trên nút hành động. Landscape: kéo xuống đáy canvas và dừng trước cột nút hành động, không dừng trên đỉnh nút — điện thoại ngang band `3-4` sàn 96 thành 208 logic px, dừng trên nút thì sân khấu chỉ còn 60. HUD, lời dẫn, nút hành động giữ nguyên chỗ |
| Engine không cần nộp bài | `needsCommit` là `false` | Rect `action` vẫn được tính và để trống — không engine nào được vẽ nút khác vào đó |
| Không đủ chỗ ở sàn chạm | Portrait hẹp, band `3-4` | Thu vùng lời dẫn còn một dòng trước, rồi để hàm layout slot giảm cột và **thêm hàng** — không phân trang (`BR-PSZ-13`). Cấm thu nút |
| Khay chứa nhiều vật hơn một hàng | Session khai `trayItemCount` lớn hơn số vật một hàng ở sàn chạm (GT-004 tới 10 vật, GT-008 tới 9, GT-023 tới 8) | Khay **cao theo số vật**: `computeStageZones` nhận `trayItems`, xếp vật thành nhiều hàng cạnh sàn chạm và cộng chiều cao khay, nhưng chừa cho sân khấu ít nhất hai hàng ô (`2 × sàn + SLOT_GAP_PX`). Mọi vật hiện cùng lúc, không nút trang (`BR-PSZ-13`). Vật không nhỏ hơn sàn chạm (`BR-PSZ-04`). Chạm hoặc nhả vật chọn **tâm slot gần nhất** trong các vùng chạm trúng điểm. Số ca còn vi phạm vì sân khấu không còn chỗ đo theo mã và khung ở `tests/layout/stage-engines-b*.test.ts`, chỉ được giảm |
| Điện thoại ngang thấp | Landscape mà sân khấu của canvas (không khay) dưới bốn hàng ô ở sàn chạm — điện thoại 784x250 ở cả ba band, canvas ≈ 844x390 không HUD ở band 5-6 | **Lời dẫn thành cột bên trái** (mascot ở đầu cột, loa ngay dưới, picto dưới loa nếu còn chỗ, không có chữ phụ) và **khay thành cột** bên trái nút hành động, cao tới trọn chiều cao canvas; vật xếp vào cột nhiều hàng. Sân khấu lấy phần còn lại ở giữa và cao tới đáy canvas — dải lời dẫn trên cùng ăn 165–208 logic px trong 540 nên không chừa nổi hai hàng ô. Quyết định chỉ phụ thuộc viewport và band, **không** phụ thuộc `needsTray` hay `trayItems`, nên prompt, promptSpeaker và action vẫn bằng nhau ở mọi engine (`BR-PSZ-03`). `zones.promptPlacement` là `"side"`; máy tính bảng và màn rộng giữ `"top"` |
| Vòng không có picto mục tiêu | Content không mang hình mục tiêu | Vùng lời dẫn chỉ có mascot và loa; chữ phụ vẫn ẩn khỏi trẻ |
| Studio preview | `/play/preview-sandbox` | Không HUD; `?fit=fill` cho canvas lấp đầy khung (xem portrait, điện thoại ngang) thay vì hộp 16:9 của Studio, và xoay máy tính lại vùng. Trang tính `computeZonesForSession`, cấp `stage` và `tray` cho `prepareRound`, vẽ `drawPromptZone` và `drawCommitButton` như trang chơi (#283) — Manager thấy đúng bố cục trẻ thấy. Engine đã dời không còn nhánh dự phòng vẽ lời dẫn; gate `zone-primitives-only` cấm mọi lệnh `drawPromptText` ở engine đã dời |
| Intro GT-000 | Engine làm quen khái niệm | **Chạy ngoài khung năm vùng** (quyết 2026-10-03, câu hỏi mở số 5): màn làm quen không chấm điểm, không `needsCommit`, không khay. Ba nút Trước, Nghe lại, Tiếp tục là DOM của trang như hiện nay, `usesPromptZone` giữ `false`, gate `zone-primitives-only` miễn GT-000 và ghi lý do ở đây. Đổi khi có nhu cầu: đưa intro vào khung thì sửa `concept-intro-gate.md` trước |
| Hành động chính không phải nộp | GT-034 nghe mẫu nhịp, GT-035 chạy chương trình | Nút ở `zones.action` mang `commitIcon` của session (▶ chạy, loa nghe mẫu — không chữ, `BR-FBK-12`); chạm gửi `commit`, session đổi thành `play_pattern` hoặc `run_program`. Chuỗi của GT-034 vẫn tự chấm khi đủ bước |
| Engine từng có nút xoá | GT-036 | Không vẽ nút xoá. Chạm ô đã đặt đúng vật đang cầm thì gỡ vật đó; chạm vật khác thì thay |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PSZ-01` | Mọi engine active chơi trong **đúng năm vùng**, đúng thứ tự từ trên xuống: HUD, lời dẫn, sân khấu, khay, hành động. Engine chỉ vẽ trong `stage` và `tray` | Trẻ chưa đọc học giao diện bằng vị trí; bốn vị trí nút nộp bài khác nhau là bốn giao diện phải học lại |
| `BR-PSZ-02` | `computeStageZones` là **hàm thuần** của `{ logicW, logicH, ageBand, cssPerLogic, needsTray, needsCommit, trayItems }` | Cùng lý do `BR-LAY-01` (hàm layout thuần) — test hình học chạy không cần trình duyệt và bố cục chụp lại được |
| `BR-PSZ-03` | Vị trí HUD, lời dẫn và hành động **không phụ thuộc engine** — cùng viewport cho cùng ba rect ở mọi engine. Chỉ sân khấu đổi cao khi không có khay | Khung đổi theo trò thì trẻ không học được khung |
| `BR-PSZ-04` | Sàn chạm của `BR-A11-04` (sàn chạm theo band tuổi) áp trên **px CSS thật**: mọi vùng chạm trong bốn vùng canvas và mọi slot có `hitW × cssPerLogic` không dưới sàn | Sàn đang áp ở logic px nên co theo canvas: portrait 390px biến 96 thành khoảng 69px thật mà mọi test vẫn xanh |
| `BR-PSZ-05` | Nút nộp bài **chỉ** sống ở `zones.action`, vẽ bằng primitive dùng chung `drawCommitButton`, và chạm vào đó được shell đổi thành gesture `commit`. Engine cấm tự vẽ nút nộp, nút chạy, nút xoá hay nút nghe lại. Engine có **một** hành động chính khác nộp (chạy chương trình, nghe mẫu) thì hành động đó chiếm nút này: session khai `commitIcon`, `toAction` đổi `commit` thành hành động của mình. Nút xoá không có chỗ — gỡ từng vật ngay trên sân khấu | Nút tự vẽ là lý do GT-028 có thể không bao giờ nộp được bài: engine chờ `commit` mà trang không có đường gửi. Hai nút trong vùng hành động là vùng thứ sáu trá hình |
| `BR-PSZ-06` | Tiến độ vòng có **một nguồn**: `KidRoundProgressIndicator` ở HUD, dạng hạt, không số. Engine cấm vẽ tiến độ | Hai chỉ báo cùng lúc (HUD và `drawProgressBadge`) có lúc lệch nhau; số trên màn là điểm trá hình — `BR-ENG-11` (không áp lực) |
| `BR-PSZ-07` | HUD chỉ có ba nút: khoá phụ huynh ở góc trên phía đầu dòng, loa nghe lại ở góc trên phía cuối dòng, hạt tiến độ ở giữa. Nhãn chữ chỉ là `aria-label` | `BR-ENG-10` (chữ không đủ) — "Bỏ qua", "Nghe lại" trẻ không đọc được. Khoá phụ huynh xa nút hành động nhất có thể để chạm nhầm khó xảy ra — `BR-PGT-01` (nút thoát không tap trúng được) |
| `BR-PSZ-08` | Loa trong vùng lời dẫn **bắt chạm thật** và phát lại đúng đường lời dẫn của vòng (`replayCurrentRoundNarration`). Hình trông bấm được mà không bấm được bị cấm | Badge loa vẽ trên canvas hôm nay không có ai nghe chạm — trẻ bấm và không có gì xảy ra, trái `BR-ENG-07` (không im lặng) |
| `BR-PSZ-09` | Vùng lời dẫn mang mascot và picto mục tiêu; câu chữ của đề chỉ là chữ phụ cho người lớn, không phải kênh duy nhất | `BR-A11-11` (không chỉ dẫn bằng chữ một mình) |
| `BR-PSZ-10` | Mascot ở vùng lời dẫn là **kênh hình** của mọi lời khen và lời động viên phát ra bằng tiếng, và không leo thang theo số lần sai | `BR-ETS-05` (mọi lời đọc có kênh hình) và `BR-FBK` — tắt tiếng thì trẻ vẫn thấy mình được khen |
| `BR-PSZ-11` | Trang chơi của trẻ không có navbar, footer hay liên kết rời trang nào ngoài khoá phụ huynh | Liên kết công khai trên bề mặt trẻ là lối thoát một chạm, vượt qua `BR-PGT-01` |
| `BR-PSZ-12` | Mỗi lần viewport đổi, shell tính lại vùng, engine tính lại slot, và lớp truy cập `syncView()` trong cùng một nhịp | Tính lại slot mà không đồng bộ view làm nút ẩn cho screen reader trỏ toạ độ cũ |
| `BR-PSZ-13` | **Không phân trang.** Mọi vật của một vòng hiện cùng lúc ở sân khấu hoặc khay: khay và lưới thêm hàng (hoặc khay thành cột ở điện thoại ngang thấp), không có nút trang, không vật ẩn ngoài màn. Shell tính lại vùng ở **đầu mỗi vòng** vì số vật khay đổi theo vòng. Vật không nhỏ hơn sàn chạm; nếu sàn chạm làm vòng không thể vừa thì ghi vào nợ đo, không thu dưới sàn | Trẻ 3–6 tuổi không biết có vật ẩn sau trang, nút trang nhỏ khó chạm trúng và làm bài dừng ở "đủ vật" trong khi vật còn nằm trang sau. Hướng dẫn thiết kế cho trẻ nhỏ khuyên hạn chế cuộn và phân trang, một màn hình cho một việc ([NN/g — Design for Kids Based on Their Stage of Physical Development](https://www.nngroup.com/articles/children-ux-physical-development/), [Smashing — A Practical Guide To Designing For Children](https://www.smashingmagazine.com/2024/02/practical-guide-design-children/)); NN/g đo vùng chạm tối thiểu khoảng 2 × 2 cm cho trẻ nhỏ — cùng ý với sàn chạm `BR-PSZ-04` |

## 7. Data

**Đọc:** band tuổi của phiên, không gian logic từ [`game-engine-runtime.md`](game-engine-runtime.md)
mục 7.1, `needsTray`, `trayItemCount` và `needsCommit` của session.
**Ghi:** không ghi gì. Vùng không có trạng thái.

### 7.1 Hình dạng

```ts
interface ZoneRect {
  x: number; y: number;   // góc trên trái, không gian logic
  w: number; h: number;
}

interface StageZonesInput {
  logicW: number;          // cạnh dài, từ runtime mục 7.1
  logicH: number;          // cạnh ngắn cố định 540
  ageBand: AgeBand;
  cssPerLogic: number;     // px CSS trên một logic px, shell đo
  needsTray: boolean;
  needsCommit: boolean;
  trayItems?: number;      // số vật khay của vòng; bỏ trống là một hàng (`BR-PSZ-13`)
  trayLabels?: boolean;    // vật khay có nhãn vẽ dưới thân: mỗi hàng khay cao thêm một dải nhãn
}

interface StageZones {
  orientation: "landscape" | "portrait";
  promptPlacement: "top" | "side"; // side: landscape thấp, lời dẫn là cột bên trái (`BR-PSZ-13`)
  prompt: ZoneRect;
  promptSpeaker: ZoneRect; // vùng chạm của loa, nằm trong prompt
  stage: ZoneRect;
  tray: ZoneRect | null;
  action: ZoneRect;        // luôn có, để trống khi needsCommit là false
}

type ComputeStageZones = (input: StageZonesInput) => StageZones;

// Session khai cho shell (`BR-PSZ-05`)
interface StageSessionFlags {
  needsTray: boolean;
  trayItemCount: number;   // số vật nguồn trong khay của vòng này; 0 khi không có khay
  trayHasLabels: boolean;  // vật khay có nhãn dưới thân (GT-030, 031, 033)
  needsCommit: boolean;
  canCommit(): boolean;    // false thì nút vẽ mờ và chạm bị nuốt
  commitIcon?: "check" | "play" | "listen"; // bỏ trống là ✓; ▶ chạy, loa nghe mẫu
  usesPromptZone: boolean; // mặc định false; true thì shell vẽ lời dẫn, engine không vẽ (`BR-PSZ-08..10`)
  getHintTarget(): { kind: "slot"; index: number } | { kind: "action" } | null; // gợi ý trỏ vật hoặc nút hành động
}
```

Khi `getHintTarget()` trả `{ kind: "action" }` (bước kế là nộp bài), `GameEngine.actionHinted`
bật và shell nháy vòng hổ phách quanh nút ở `zones.action`; không vẽ vòng quanh slot nào.
Nút hành động cũng có bản DOM cho Tab và Enter/Space (`aria-disabled` khi `canCommit()` là
`false`, không dùng `disabled`); Enter/Space đi cùng đường với chạm vào `zones.action`.

HUD không có rect trong kiểu này vì nó là DOM ở ngoài canvas; chiều cao HUD được trừ khỏi viewport
trước khi đo canvas.

### 7.2 Hằng số

Hằng số chiều cao vùng lời dẫn, chiều cao khay và cạnh nút hành động sống cạnh `CONTENT_TOP_PX`
trong `packages/game-engine/src/layout/constants.ts`. Sàn chạm lấy qua hàm của
[`accessibility.md`](../08-quality/accessibility.md) `BR-A11-04`, cấm chép số vào đây.

### 7.3 Ai sở hữu vùng nào

| Vùng | Ai vẽ | Ai nhận chạm | Rule |
|---|---|---|---|
| HUD | Shell, DOM | Shell | `BR-PSZ-06`, `BR-PSZ-07` |
| Lời dẫn | Primitive dùng chung | Shell (loa), không ai (phần còn lại) | `BR-PSZ-08..10` |
| Sân khấu | Engine | Engine qua `dispatch` | [`engine-render-contract.md`](engine-render-contract.md) |
| Khay | Primitive `drawWoodenTokenDock` với dữ liệu của engine | Engine qua `dispatch` | `BR-PSZ-01` |
| Hành động | Primitive `drawCommitButton` | Shell, đổi thành `commit` | `BR-PSZ-05` |

## 8. API contract

Không sở hữu route. Vùng tính hoàn toàn trên client.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PSZ-01 — engine không vẽ ngoài sân khấu và khay
  Given mỗi engine active với level mẫu
  When render một khung hình với canvas ghi lại mọi lệnh vẽ
  Then mọi lệnh vẽ của session nằm trong zones.stage hoặc zones.tray

Scenario: BR-PSZ-02 — hàm vùng thuần
  Given cùng StageZonesInput
  When gọi computeStageZones 50 lần
  Then 50 kết quả bằng nhau từng field và không lần nào chạm window hay Date

Scenario: BR-PSZ-03 — khung không đổi theo engine
  Given viewport 844x390 và band "4-5"
  When tính vùng cho needsTray true và needsTray false
  Then prompt, promptSpeaker và action bằng nhau ở hai lần

Scenario: BR-PSZ-04 — sàn chạm trên px thật ở portrait hẹp
  Given viewport 390x844, band "3-4"
  When tính vùng và slot cho mọi LayoutId ở slotCount lớn nhất
  Then mọi vùng chạm có cạnh nhân cssPerLogic không dưới sàn chạm band 3-4
  And layout nhận `stage` và `cssPerLogic` (`LayoutInput`, `game-layout-engine.md` mục 7.1);
    một hàm layout tính sàn ở logic px (cssPerLogic = 1) bị phép kiểm báo vi phạm

Scenario: BR-PSZ-13 — khay nhiều vật không phân trang
  Given viewport 390x844, band "4-5" và một session khay 10 vật
  When tính vùng với trayItems = 10 và đặt slot nguồn trong zones.tray
  Then mọi slot nguồn có page 0 và nằm trong zones.tray
  And không cặp vùng chạm nào cách nhau dưới SLOT_GAP_PX
  And zones.stage còn cao ít nhất 2 × sàn chạm + SLOT_GAP_PX

Scenario: BR-PSZ-13 — điện thoại ngang thấp dùng cột khay
  Given viewport 784x250, band "4-5" và một session khay 6 vật
  When tính vùng
  Then zones.tray là cột bên trái zones.action, không chồng zones.stage
  And prompt, promptSpeaker và action bằng với cùng viewport khi needsTray là false

Scenario: BR-PSZ-13 — landscape thấp đặt lời dẫn ở cột bên trái
  Given viewport 784x250 và band "4-5"
  When tính vùng
  Then zones.promptPlacement là "side" và zones.prompt không chồng zones.stage
  And zones.stage cao bằng canvas trừ hai lề, đủ ba hàng ô ở sàn chạm

Scenario: BR-PSZ-13 — số vật khay đổi theo vòng
  Given một level có vòng 1 khay 4 vật và vòng 2 khay 10 vật
  When vòng 2 bắt đầu
  Then shell tính lại zones với trayItems = 10 và slot của vòng 2 nằm trong khay mới

Scenario: BR-PSZ-05 — GT-028 nộp được bài từ trang chơi
  Given trang /play với một level GT-028 và đã chạm đủ số lượng đúng
  When chạm vào tâm zones.action
  Then engine nhận gesture commit và vòng kết thúc thắng

Scenario: BR-PSZ-05 — engine có nút phụ vào khung ở portrait hẹp
  Given viewport 390x844, band "5-6", mọi level đã seed của GT-034, GT-035, GT-036
  When tính slot trong zones.stage và render một khung hình
  Then không cặp vùng chạm nào chồng nhau hoặc cách nhau dưới SLOT_GAP_PX
  And mọi lệnh vẽ của session nằm trong zones.stage
  And không slot nào là nút chạy, nút xoá hay nút nghe lại

Scenario: BR-PSZ-06 — một nguồn tiến độ
  When render một khung hình của GT-002, GT-026, GT-027, GT-028
  Then không session nào gọi drawProgressBadge

Scenario: BR-PSZ-08 — loa bắt chạm thật
  Given vòng đang chờ trẻ
  When chạm vào tâm zones.promptSpeaker
  Then replayCurrentRoundNarration được gọi đúng một lần
  And engine không nhận gesture nào

Scenario: BR-PSZ-11 — không lối thoát một chạm
  When mở /play/{code}
  Then trang không có phần tử a[href] nào ngoài khoá phụ huynh

Scenario: BR-PSZ-12 — xoay máy đồng bộ view
  Given trang chơi ở 844x390
  When viewport đổi sang 390x844
  Then nút ẩn của entity đầu tiên có toạ độ khớp slot mới
```

## 10. Boundaries

**Always**
- Lấy rect vùng qua `computeStageZones`, không tính toạ độ vùng trong session.
- Kiểm sàn chạm trên px CSS thật.
- Chuyển engine vào khung theo từng engine, mỗi engine một lát có ca âm.

**Ask first**
- Thêm vùng thứ sáu hoặc đổi thứ tự vùng.
- Đổi phía của nút hành động (câu hỏi mở 3).
- Cho một engine ngoại lệ vẽ ngoài sân khấu.

**Never**
- Tự vẽ nút nộp, nút nghe lại hay tiến độ trong session.
- Thu nút xuống dưới sàn chạm để vừa màn hình.
- Vẽ hình trông bấm được mà không có đường nhận chạm.
- Để liên kết công khai trên trang chơi của trẻ.

## 11. Open questions

Quyết định ngày 2026-10-03 — người đặt việc giao tôi tự chốt các câu mở đối chiếu hướng dẫn thiết kế cho trẻ nhỏ
công bố (NN/g, Smashing Magazine; chưa kiểm từng app thương mại bằng tay) và theo tiêu chí trẻ 3–6 tuổi: ít thao tác ẩn, chạm to, mọi vật nhìn thấy cùng lúc.

| # | Câu hỏi | Quyết | Lý do | Trạng thái |
|---|---|---|---|---|
| ~~1~~ | ~~Mascot dùng asset vẽ thật hay tiếp tục emoji gấu?~~ | **Đóng 2026-10-03 (#279)**: sprite SVG/PNG đặt ngoài, engine giữ hợp đồng sáu dáng và bản vẽ thay thế bằng primitive — [`feedback-and-celebration.md`](../04-play/feedback-and-celebration.md) §7.4. Mascot là Gấu Con, bốn sprite có sẵn ở `public/mascot/` | — | Đã đóng |
| 2 | Có thêm chế độ chơi tự do không đáp án trong cùng khung năm vùng — sân khấu và khay giữ nguyên, vùng hành động thành nút "xong rồi" không chấm? | **Hoãn tới P5.** Chưa làm trong #283 | Đây là một **loại trò mới** (miền tự tạo của [`engine-behavior-domain.md`](engine-behavior-domain.md)), không phải một hạn chế của khung. Khung năm vùng không chặn nó; cần quyết riêng về ghi điểm, sticker và sự kiện không có `is_correct` trước khi dựng. Hoãn không làm hỏng khung nào | Hoãn |
| 3 | Nút hành động có đổi phía cho trẻ thuận tay trái không? | **Hoãn, giữ cuối dòng.** | `BR-PSZ-03` cần cùng một chỗ cho mọi engine để trẻ học một lần; chưa có số đo tay thuận nào. Khi có phản hồi phụ huynh thì thêm cài đặt ở hồ sơ trẻ, không đổi mặc định | Hoãn |
| 4 | Khay một hàng chỉ chứa 3–4 vật ở sàn chạm portrait, nhưng GT-004 có tới 10 vật, GT-008 tới 9, GT-023 tới 8. Phân trang khay hay tăng chiều cao khay? | **Không phân trang. Khay cao theo số vật (nhiều hàng), mọi vật hiện cùng lúc; điện thoại ngang thấp đặt khay thành cột bên trái nút hành động.** Vật không nhỏ hơn sàn chạm; không đủ chỗ thì ghi nợ đo chứ không thu dưới sàn — `BR-PSZ-13` | Trẻ 3–6 tuổi không hiểu vật ẩn sau trang và chạm trượt nút trang nhỏ; hướng dẫn thiết kế cho trẻ nhỏ khuyên một màn hình, hạn chế cuộn và phân trang (xem `BR-PSZ-13`). Vật tái dùng (GT-007, GT-021) không rời khay nên phân trang vốn không khả thi cho chúng. Điện thoại ngang chỉ có 250 px CSS cao: dải khay phía dưới ăn hết sân khấu, cột bên cạnh dùng chiều ngang đang dư | Đóng, đã dựng ở #283 |
| 5 | GT-000 (làm quen khái niệm) nằm trong hay ngoài khung năm vùng? | **Ngoài khung.** Ba nút DOM của trang như hiện nay | Màn làm quen không chấm điểm, không khay, không nộp bài; khung sinh ra để chuẩn hoá nút nộp và khay, hai thứ GT-000 không có. Đưa vào khung chỉ để thêm nghi thức mà không giúp trẻ — xem mục 5 hàng "Intro GT-000" | Đóng |
