---
spec: NUMERACY-REPRESENTATION-LADDER
title: Thang biểu diễn lượng số học — vật thật, hình ảnh, rồi mới tới chữ số
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-09-11
owns:
  - Thang ba tầng cụ thể, bán cụ thể, trừu tượng cho mọi lượng hiển thị trên bề mặt trẻ
  - Trường dataset khai lối biểu diễn lượng của một kỹ năng số học
  - Luật chữ số không đứng một mình dưới ngưỡng tuổi
  - Cổng `check:numeracy-ladder`
depends_on:
  - SKILL-DATASET-MODEL
  - SKILL-VALUE-INVENTORY
  - PRESCHOOL-AGE-BANDS
  - GAME-TEMPLATE-CONTRACT
  - ENGINE-RENDER-CONTRACT
---

# Thang biểu diễn lượng số học

## 1. Objective

Một đứa trẻ ba tuổi nhìn ký hiệu `5` không thấy năm thứ gì. Ký hiệu số là tầng trừu tượng cuối
cùng của một chuỗi phát triển, và mọi chương trình số học mầm non đáng tin đều đi qua chuỗi đó
theo thứ tự: trẻ cầm năm vật, rồi nhìn năm chấm có cấu trúc, rồi mới gắn ký hiệu `5` vào.

Nền tảng hiện không có thang đó. Đo ngày 2026-09-11: lối biểu diễn duy nhất chạy được là vật rời
(`drawSlotItem`) và ký hiệu số (`drawTextInSlot`). Hàm vẽ ten-frame đã tồn tại —
`drawTenFrameBoard` tại
[`packages/game-engine/src/render/shared-render-shapes.ts:876`](../../../packages/game-engine/src/render/shared-render-shapes.ts) —
nhưng **không có call site nào**, vì `GT-007/session.ts:127` hardcode
`resolveLayout("number-bond-tree")` nên layout `ten-frame-split` không bao giờ tới được; hàm
`computeTenFrameSplitLayout` tại `layout/geometry.ts:550` chết cùng. Number line, dot pattern,
tally, rekenrek thì chưa từng có. Giá trị `arrangement: "dice"` tồn tại như dữ liệu nội dung mà
không renderer nào đọc.

Hệ quả cụ thể: `C1.CNT.08` tên là *"Đếm trên đường số"* nhưng chạy trên năm engine không engine
nào vẽ đường số; `C1.DAT.01` tên là *"Đếm rồi ghi lại bằng dấu"* nhưng không có primitive tally.
Tên kỹ năng nói một đằng, pixel hiện một nẻo.

Spec này đặt **thang biểu diễn lượng**: mỗi lượng hiện trên bề mặt trẻ phải khai mình thuộc tầng
nào, tầng nào hợp lệ ở band tuổi nào, và khi nào ký hiệu số được phép đứng một mình.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ 3–6 tuổi | không cần đăng nhập tới tier `free` | Nhìn thấy lượng ở tầng biểu diễn phù hợp tuổi mình |
| Người biên soạn | `content_author` | Khai `representation` cho dataset số học theo kho `c1-quantity-rep` |
| Dev engine | — | Hiện thực primitive vẽ cho mỗi `kind` trong kho |
| Cổng kiểm tra | CI / `check.sh` | Chạy `check:numeracy-ladder` |

## 3. Entry points

| Route / file | Actor | Ghi chú |
|---|---|---|
| `/play/:code` | Trẻ | Bề mặt chơi, `apps/web/app/pages/play/[code].vue` |
| `packages/content/src/inventories/c1-quantity-rep.ts` | Author / Dev | Từ vựng đóng tám lối biểu diễn, sở hữu bởi [`skill-value-inventory.md`](skill-value-inventory.md) mục 7.2 |
| `packages/content/src/skills/c1/**` | Author | Nơi khai `representation` cho từng bậc `ladder` |
| `packages/game-engine/src/render/shared-render-shapes.ts` | Dev | Nơi primitive vẽ sống |
| `scripts/check-numeracy-ladder.ts` | CI / Dev | Script cổng, phải dựng mới |

## 4. Main flow

1. Người biên soạn xác định khoảng số của kỹ năng từ `c1-numeral` và band tuổi từ `SkillIdentity`.
2. Với mỗi bậc `ladder` của dataset, khai `representation` là một `kind` thuộc `c1-quantity-rep`.
3. Cổng đối chiếu `kind` với bảng mục 7.1: tầng cụ thể có được phép ở band này không, khoảng số
   của `kind` có chứa khoảng của kỹ năng không.
4. Builder chiếu dataset vào `content_pack`, mang theo `representation` của bậc đang dựng.
5. Engine đọc `representation` và gọi đúng primitive vẽ.
6. Nếu engine không hiện thực `kind` đó, cổng `check:numeracy-ladder` đỏ trước khi seed chạy.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Kỹ năng không phải số học | `competency_code` khác `C1` | Cổng bỏ qua; thang này chỉ ràng buộc lượng |
| Kỹ năng dạy chính ký hiệu số | Strand là `C1.NREC` | Ký hiệu số được phép là tầng chính, nhưng vẫn phải kèm một lượng ở tầng thấp hơn theo `BR-NRL-04` |
| `kind` chưa có primitive vẽ | Engine không hiện thực `kind` | Cổng đỏ với danh sách `kind` thiếu; không fallback im lặng về vật rời |
| Trẻ bật `reduced_motion` | Cờ phiên | Không đổi tầng biểu diễn; chỉ đổi chuyển động. Tầng biểu diễn là contract sư phạm, không phải hiệu ứng |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-NRL-01` (mọi lượng khai tầng) | Mỗi bậc `ladder` của dataset thuộc `C1` BẮT BUỘC khai `representation` là một `kind` thuộc `c1-quantity-rep`, hoặc `numeral` cho tầng trừu tượng | Không khai thì mọi lượng mặc định thành vật rời, và nền tảng không bao giờ dùng tới bảy lối còn lại |
| `BR-NRL-02` (thang không nhảy cóc) | Trong một dataset, `concreteness` của `representation` BẮT BUỘC không tăng độ trừu tượng quá một tầng giữa hai bậc `ladder` liền kề | Nhảy từ vật rời thẳng sang ký hiệu số bỏ mất tầng trung gian, đúng chỗ trẻ hình thành cấu trúc nhóm 5 và 10 |
| `BR-NRL-03` (tầng theo band tuổi) | Band `3-4` chỉ dùng `concrete`; band `4-5` dùng tới `semi-concrete`; band `5-6` dùng tới `semi-abstract`. Tầng `abstract` chỉ được là tầng **kèm theo**, không bao giờ là tầng duy nhất dưới 5 tuổi | Theo Thông tư 23/2010/TT-BGDĐT chuẩn 23 chỉ số 104, việc gắn con số với số lượng là mốc của trẻ **năm tuổi**; đặt ký hiệu trần cho trẻ ba tuổi là đặt sàn trên năng lực thật |
| `BR-NRL-04` (chữ số không đứng một mình) | Dưới band `5-6`, một ký hiệu số hiện trên bề mặt BẮT BUỘC kèm một biểu diễn lượng tương ứng trong cùng khung nhìn | Ký hiệu không kèm lượng là một hình vẽ; trẻ học thuộc hình dạng chứ không học số |
| `BR-NRL-05` (khoảng số nằm trong khoảng của `kind`) | `kind` được chọn BẮT BUỘC có `[min_value, max_value]` chứa trọn khoảng số của kỹ năng | `dot-pattern` tốt tới 6 và hỏng ở 9; ép nó vẽ 9 chấm thì mất chính cái tính nhận-tức-thì làm nên giá trị của nó |
| `BR-NRL-06` (primitive phải tồn tại thật) | Một `kind` chỉ được dùng trong dataset khi engine đã có hàm vẽ **và** hàm đó có ít nhất một call site. Cổng kiểm cả hai vế | `drawTenFrameBoard` đã tồn tại từ lâu với 0 call site; "có hàm" không đồng nghĩa với "chạy được" |
| `BR-NRL-07` (cấu trúc nhóm năm) | `ten-frame` và `rekenrek` BẮT BUỘC vẽ vạch phân nhóm ở mốc 5 | Toàn bộ giá trị sư phạm của hai giáo cụ này nằm ở chỗ mắt đọc được "5 và thêm mấy" mà không đếm lại |
| `BR-NRL-08` (subitizing tách hai kiểu) | Kỹ năng subitizing tri giác dùng `dot-pattern` trong khoảng 1–5; kỹ năng subitizing khái niệm dùng `ten-frame` hoặc `rekenrek` trong khoảng 6–10 | Clements và Sarama tách hai năng lực này; gộp vào một kỹ năng thì ladder không leo được và trẻ tưởng đếm lại là sai |
| `BR-NRL-09` (một lượng, một cách đọc) | Mọi biểu diễn lượng BẮT BUỘC có `spokenLabel` phát được bằng giọng Việt, trỏ tài sản theo [`play-narration.md`](../04-play/play-narration.md) | Trẻ chưa đọc được chữ; một ten-frame không nói được là một lưới chấm câm |
| `BR-NRL-10` (cấm fallback im lặng) | Khi engine gặp `kind` nó không hiện thực, BẮT BUỘC ném lỗi. Cấm — NEVER vẽ vật rời thay thế | Fallback im lặng làm bài "đếm trên đường số" biến thành bài đếm vật rời mà báo cáo vẫn ghi là đã dạy đường số |

## 7. Data

**Đọc:** `c1-quantity-rep` và `c1-numeral` từ `packages/content/src/inventories/`;
`SkillIdentity.age_min`/`age_max`; `DifficultyRung` của dataset.
**Ghi:** `content_pack.representation` trên mỗi vòng; `scripts/numeracy-ladder-baseline.json`.

### 7.1 Thang ba tầng và trần theo band tuổi

| Tầng | `concreteness` | `kind` | Khoảng tốt | Band `3-4` | Band `4-5` | Band `5-6` |
|---|---|---|---:|---|---|---|
| Cụ thể | `concrete` | `discrete-object` | 1–10 | Có | Có | Có |
| Cụ thể | `concrete` | `finger` | 1–10 | Có | Có | Có |
| Cụ thể | `concrete` | `number-rod` | 1–10 | Có | Có | Có |
| Bán cụ thể | `semi-concrete` | `dot-pattern` | 1–6 | Không | Có | Có |
| Bán cụ thể | `semi-concrete` | `ten-frame` | 1–20 | Không | Có | Có |
| Bán cụ thể | `semi-concrete` | `rekenrek` | 1–20 | Không | Có | Có |
| Bán trừu tượng | `semi-abstract` | `tally` | 1–20 | Không | Không | Có |
| Bán trừu tượng | `semi-abstract` | `number-line` | 0–20 | Không | Không | Có |
| Trừu tượng | `abstract` | `numeral` | 0–20 | Chỉ kèm theo | Chỉ kèm theo | Có |

"Chỉ kèm theo" là điều kiện của `BR-NRL-04`: ký hiệu được hiện, nhưng khung nhìn phải đồng thời
mang một biểu diễn lượng ở tầng thấp hơn.

### 7.2 Trường dataset

`DifficultyRung` nhận thêm một trường:

```typescript
export interface DifficultyRung {
  readonly rung: number;
  readonly dimension: string;
  readonly description: string;
  /** Lối biểu diễn lượng của bậc này — `BR-NRL-01`. Bắt buộc với dataset C1. */
  readonly representation?: QuantityRepKind | "numeral";
}
```

`QuantityRepKind` là union tám giá trị sinh từ `c1-quantity-rep`, không gõ tay.

`content_pack` của mỗi vòng mang `representation` xuống engine; hình dạng chính xác thuộc
[`game-template-contract.md`](../01-platform/game-template-contract.md).

### 7.3 Primitive vẽ — trạng thái và nghĩa vụ

| `kind` | Hàm vẽ | Trạng thái ngày 2026-09-11 |
|---|---|---|
| `discrete-object` | `drawSlotItem` (`shared-render.ts:1348`) | Chạy, 37 engine dùng |
| `numeral` | `drawTextInSlot` (`shared-render.ts:1307`) · `drawFlashcard` (`:2028`) | Chạy |
| `ten-frame` | `drawTenFrameBoard` (`shared-render-shapes.ts:876`) | **Chết** — 0 call site; `GT-007/session.ts:127` hardcode layout khác |
| `dot-pattern` | — | **Thiếu**. Dữ liệu `arrangement: "dice"` đã tồn tại mà không renderer nào đọc |
| `number-line` | — | **Thiếu**. `C1.CNT.08` là "Đếm trên đường số" |
| `tally` | — | **Thiếu**. `C1.DAT.01` là "Đếm rồi ghi lại bằng dấu" |
| `rekenrek` | — | **Thiếu** |
| `number-rod` | — | **Thiếu** |
| `finger` | — | **Thiếu** |

Nghĩa vụ hình dạng cho primitive mới thuộc
[`engine-render-contract.md`](../01-platform/engine-render-contract.md) mục 7; spec này chỉ sở
hữu việc `kind` nào tồn tại và dùng được ở đâu.

### 7.4 Ánh xạ kỹ năng C1 sang tầng bắt buộc

Bảng này là đích của lát cắt, không phải hiện trạng. Trích các strand hiện có 0 `glyph` và 0
`value`:

| Strand | Số kỹ năng | Tầng bắt buộc thấp nhất | Ghi chú |
|---|---:|---|---|
| `C1.ORD` | 6 | `discrete-object` + `numeral` kèm theo | Thứ tự vị trí cần một hàng vật có đầu và cuối |
| `C1.OTO` | 7 | `discrete-object` | Tương ứng một-một là bài nối vật với vật |
| `C1.CMP` | 15 | `discrete-object`, lên `ten-frame` ở band `5-6` | So sánh lượng cần hai nhóm cạnh nhau cùng lối biểu diễn |
| `C1.DAT` | 5 | `tally` | `C1.DAT.01` định nghĩa bằng chính dấu gạch |
| `C1.CNT` | 11 | `dot-pattern` cho subitizing, `number-line` cho `C1.CNT.08` | Xem `BR-NRL-08` |
| `C1.MEAS` | 15 | `number-rod` | Đo bằng đơn vị lặp cần lượng liên tục, không rời |
| `C1.PAT` | 10 | `discrete-object` | Quy luật lặp đọc bằng vật, không bằng số |
| `C1.PROB` | 6 | theo kỹ năng nguồn | Giải bài kế thừa tầng của kỹ năng tiên quyết |

## 8. API contract

Không có bề mặt HTTP mới. `representation` đi theo `content_pack` của
`GET /api/guest/levels/{code}/config` và `GET /api/users/levels/{code}/config`, hình dạng do
[`game-config-delivery.md`](../04-play/game-config-delivery.md) sở hữu.

## 9. Acceptance criteria

```gherkin
Scenario: BR-NRL-01 — bậc ladder C1 không khai representation thì cổng đỏ
  Given dataset của C1.CNT.03 có một bậc ladder không có trường representation
  When chạy pnpm check:numeracy-ladder
  Then cổng thoát khác 0
  And báo cáo nêu đúng số hiệu bậc còn thiếu

Scenario: BR-NRL-02 — nhảy hai tầng giữa hai bậc liền kề thì cổng đỏ
  Given bậc 2 của một dataset khai representation "discrete-object"
  And bậc 3 khai representation "numeral"
  When chạy pnpm check:numeracy-ladder
  Then cổng thoát khác 0
  And báo cáo nêu bước nhảy từ concrete sang abstract bỏ qua hai tầng

Scenario: BR-NRL-03 — dùng ten-frame ở band 3-4 thì cổng đỏ
  Given một kỹ năng có age_min 3 và age_max 4
  And một bậc ladder của nó khai representation "ten-frame"
  When chạy pnpm check:numeracy-ladder
  Then cổng thoát khác 0
  And báo cáo nêu ten-frame là semi-concrete, ngoài trần của band 3-4

Scenario: BR-NRL-04 — chữ số đứng một mình dưới 5 tuổi thì cổng đỏ
  Given một kỹ năng có age_max 4
  And một bậc ladder chỉ khai representation "numeral"
  When chạy pnpm check:numeracy-ladder
  Then cổng thoát khác 0
  And báo cáo nêu bậc đó không có biểu diễn lượng kèm theo

Scenario: BR-NRL-05 — dot-pattern vượt khoảng thì cổng đỏ
  Given C1.CNT.05 dạy khoảng số tới 10
  And một bậc ladder của nó khai representation "dot-pattern"
  When chạy pnpm check:numeracy-ladder
  Then cổng thoát khác 0
  And báo cáo nêu dot-pattern chỉ phủ tới 6

Scenario: BR-NRL-06 — kind có hàm vẽ nhưng 0 call site vẫn bị coi là chưa tồn tại
  Given drawTenFrameBoard được export và không có call site nào ngoài chính nó
  And một dataset khai representation "ten-frame"
  When chạy pnpm check:numeracy-ladder
  Then cổng thoát khác 0
  And báo cáo nêu ten-frame chưa có call site trong tầng engine

Scenario: BR-NRL-10 — engine gặp kind lạ thì ném lỗi, không vẽ thay
  Given content_pack của một vòng mang representation "rekenrek"
  And engine chưa hiện thực rekenrek
  When engine dựng vòng đó
  Then engine ném lỗi nêu đúng kind chưa hiện thực
  And engine không vẽ discrete-object thay thế
```

## 10. Boundaries

**Always**
- Mỗi primitive mới kèm ảnh chụp ở cả ba viewport `390x844`, `820x1180`, `1440x900`, đặt cạnh bộ
  `docs/qa/engine-captures/2026-09-01/` để so được trước và sau.
- Cỡ chữ và cỡ nét của primitive suy từ `LogicSpace`, không đặt bằng hằng số px. Tầng render hiện
  dùng hằng số cố định và trên máy dọc 390 px nhãn 11 px ra khoảng 8 px CSS.
- Mọi primitive mới dùng token từ `designTokens.ts`, không viết hằng hex thô.
- Cổng lấy gốc repo từ `REPO_ROOT` hoặc `repoPath()` của `@mindkid/config/paths`, Cấm — NEVER
  đọc `process.cwd()`.
- Cổng mới đặt ở `scripts/` hoặc `<workspace>/tests/gates/`. Cấm — NEVER dựng lại
  `packages/gates`; package đó đã bị gỡ 2026-08-29 và việc dựng lại cần hỏi trước.

**Ask first**
- Thêm `kind` thứ chín vào `c1-quantity-rep`. Kho là từ vựng đóng; mở thêm một giá trị là mở thêm
  một nghĩa vụ hiện thực cho tầng engine.
- Đổi trần band tuổi ở bảng 7.1. Trần lấy từ Bộ chuẩn quốc gia, không phải từ tiện lợi thi công.

**Never**
- Cấm — NEVER để engine tự chọn lối biểu diễn khi `content_pack` không khai; thiếu thì đỏ.
- Cấm — NEVER dùng ký hiệu số làm tầng duy nhất cho band `3-4` và `4-5`.
- Cấm — NEVER vẽ ten-frame hay rekenrek không có vạch phân nhóm ở mốc 5.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | `C1.CNT.11` hiện gộp subitizing tri giác và khái niệm vào một kỹ năng; tách thành hai mã mới hay giữ một mã với hai bậc ladder | `BR-NRL-08` | P1 | Nội dung |
| 2 | `finger` vẽ bằng emoji bàn tay hay bằng hình vẽ riêng — emoji khác nhau giữa các nền tảng nên số ngón có thể đọc sai | Primitive `finger` | P2 | Studio UI |
| 3 | `number-line` ở band `5-6` có mốc chia tới 20 hay dừng ở 10; mốc 20 trên logic space rộng 960 cho ra khoảng cách mốc dưới sàn chạm 64 px | Primitive `number-line` | P1 | Studio UI |
