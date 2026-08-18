---
spec: GAME-LAYOUT-ENGINE
title: Bố cục màn chơi — từ vựng layout và hình học slot
area: platform
status: draft
mvp: true
phase: P1
reviewed: 2026-08-17
owns:
  - Từ vựng LayoutId
  - Hình học slot và vùng chạm của một slot
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - GAME-ENGINE-RUNTIME
  - ACCESSIBILITY
---

# Bố cục màn chơi — từ vựng layout và hình học slot

## 1. Objective

`GameTemplate.layouts` là mảng `LayoutId` — trường đã có trong hợp đồng ở
[`game-template-contract.md`](game-template-contract.md) §7.1 và đã được cả sáu template MVP khai. Nhưng không spec
nào định nghĩa `LayoutId` là gì, và không code nào biến nó thành toạ độ.

File này lấp đúng khoảng đó: một layout là **hàm thuần** biến số lượng slot cộng band tuổi
thành danh sách hình chữ nhật trong không gian logic 960×540. Tách nó ra khỏi Session class
là điều kiện để thêm template không phải viết lại hình học — hai template khác cơ chế vẫn
dùng chung `grid`.

Đây cũng là chỗ duy nhất sàn chạm theo band tuổi được áp vào hình học. Sàn chạm sống trong
một hàm ([`accessibility.md`](../08-quality/accessibility.md) `BR-A11-04`); layout là nơi gọi hàm đó.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Dev | — | Thêm `LayoutId` mới, viết hàm layout, viết test hình học |
| Engine | — | Gọi layout để lấy slot, dùng slot để vẽ và để hit-test |
| Session class | — | **Chỉ đọc** slot. Cấm tự tính toạ độ |
| Manager | `content_reviewer` | Chọn một `LayoutId` trong danh sách template cho phép, khi tạo game level |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/src/layout/` | Dev | Nơi ở của từ vựng và các hàm layout |
| `GameEngine.load()` | Engine | Chọn hàm layout theo `difficulty_params.layout_id`, mặc định `layouts[0]` |
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Manager | Dropdown layout, giới hạn theo `template.layouts` |

## 4. Main flow

1. Engine đọc `template.layouts` và `difficulty_params.layout_id`.
2. Không có `layout_id` thì lấy `layouts[0]`.
3. Engine gọi `resolveLayout(layout_id)` để lấy hàm layout.
4. Engine gọi hàm đó với `{ slotCount, ageBand, viewport }`, nhận về `Slot[]`.
5. Engine kiểm mọi slot đạt sàn chạm của band. Không đạt thì layout đã sai — ném lỗi lúc
   `load()`, không lúc trẻ chạm.
6. Session class nhận `Slot[]` qua `setupEntities()` và gắn thực thể vào từng slot theo thứ tự.
7. Vòng lặp vẽ dùng cùng `Slot[]` đó; `InteractionManager` hit-test cũng dùng cùng `Slot[]` đó.

Một nguồn hình học duy nhất cho cả vẽ và chạm — hai nguồn thì chúng sẽ lệch, và lệch kiểu
này biểu hiện thành "bé chạm đúng chỗ mà không ăn".

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| `layout_id` không thuộc `template.layouts` | Manager gửi level sai | 422 `LAYOUT_NOT_SUPPORTED`, không ghi |
| `slotCount` vượt `limits.item_count[1]` | Nội dung sai | 422 `CONTENT_PACK_INVALID` từ [`game-template-contract.md`](game-template-contract.md) `BR-GTC-02`, không tới layout |
| Số slot không đủ chỗ ở sàn chạm | Band 3–4, nhiều item | Layout giảm số cột. Hết cột thì phân trang. Cấm thu nhỏ slot |
| Viewport hẹp hơn tỉ lệ logic | Màn hình lạ | Engine giữ tỉ lệ 960×540 và thêm viền, layout không đổi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LAY-01` | Hàm layout **thuần** — cùng đầu vào cho cùng `Slot[]`, không đọc `window`, không đọc đồng hồ, không sinh ngẫu nhiên | Test hình học phải chạy không cần trình duyệt, và bố cục phải tái dựng được để chụp lại lỗi |
| `BR-LAY-02` | `LayoutId` là **từ vựng đóng**, khai ở Lớp 1 trong engine. Thêm giá trị mới là PR code | Chuỗi tự do trong `difficulty_params` sẽ trỏ tới hàm không tồn tại, và lộ ra lúc trẻ mở màn chơi |
| `BR-LAY-03` | Không slot nào nhỏ hơn sàn chạm của band tuổi. Sàn lấy qua **một hàm duy nhất**, cấm chép số | Sàn chạm là ràng buộc an toàn vận động, không phải tham số thẩm mỹ — `BR-ENG-05` |
| `BR-LAY-04` | Không đủ chỗ thì **giảm cột rồi phân trang**. Cấm thu nhỏ slot xuống dưới sàn | Thu nhỏ để vừa màn hình là cách phổ biến nhất phá `BR-LAY-03` mà vẫn trông ổn trên máy dev |
| `BR-LAY-05` | Vùng chạm của hai slot **không chồng nhau**, và cách nhau tối thiểu `SLOT_GAP_PX` | Ngón tay trẻ 3 tuổi chạm lệch vài chục pixel; hai vùng dính nhau biến lệch thành chọn nhầm |
| `BR-LAY-06` | Hàm layout **không đọc nội dung học** — không biết đáp án đúng, không biết nhãn | Layout biết đáp án thì vị trí sẽ rò rỉ đáp án, và layout mất tính dùng lại giữa các template |
| `BR-LAY-07` | Mọi template khai ≥1 `LayoutId`, và mọi `LayoutId` khai phải có hàm cài đặt | Trường khai rồi bỏ đó là trạng thái hiện tại, và là lý do file này tồn tại |
| `BR-LAY-08` | Vị trí slot **ổn định theo chỉ số**: slot thứ `i` luôn ở cùng chỗ với cùng đầu vào | Xáo trộn là việc của [`deterministic-randomness.md`](deterministic-randomness.md), không phải của layout. Trộn hai thứ thì không tái dựng được |
| `BR-LAY-09` | Layout làm việc trong không gian logic **960×540**. Quy đổi ra pixel thật là việc của `RenderSystem` | Một hệ toạ độ cho mọi thiết bị; layout không cần biết DPR |
| `BR-LAY-10` | Đổi hình học của một `LayoutId` **đã publish** là breaking change, cần kiểm lại mọi level dùng nó | Cùng lý do `BR-GTC-08`: level đã seed giả định hình học cũ |

## 7. Data

**Đọc:** `game_templates.layouts` · `game_levels.difficulty_params.layout_id` · band tuổi của phiên.
**Ghi:** không ghi gì. Layout không có trạng thái.

### 7.1 Hình dạng

```ts
type LayoutId =
  | "grid" | "horizontal-row"                                  // GT-001
  | "grid-2x4" | "flex-wrap"                                   // GT-002
  | "top-source-bottom-target" | "left-source-right-target"    // GT-003
  | "multi-bucket-bottom" | "split-columns"                    // GT-004
  | "two-column-matching" | "card-flip-grid"                   // GT-005
  | "horizontal-track" | "step-ladder";                        // GT-006

interface Slot {
  index: number;
  x: number; y: number;            // tâm slot, không gian logic
  w: number; h: number;            // kích thước vẽ
  hitW: number; hitH: number;      // vùng chạm, luôn >= sàn chạm của band
  page: number;                    // 0 khi không phân trang
  role: "source" | "target" | "neutral";
}

interface LayoutInput {
  slotCount: number;
  ageBand: AgeBand;
  targetCount?: number;            // với layout có hai vùng, ví dụ drag-to-container
}

type LayoutFn = (input: LayoutInput) => Slot[];
```

`hitW`/`hitH` tách khỏi `w`/`h` là có chủ ý: một quả táo vẽ 64px vẫn phải có vùng chạm 96px
ở band 3–4. Gộp hai cặp này lại thì hoặc hình bị phình, hoặc sàn chạm bị vi phạm.

### 7.2 Hằng số

| Hằng | Ý nghĩa |
|---|---|
| `LOGIC_WIDTH` `LOGIC_HEIGHT` | 960 × 540, đã có trong `RenderSystem` |
| `SLOT_GAP_PX` | Khoảng cách tối thiểu giữa hai vùng chạm |
| `SAFE_MARGIN_PX` | Lề an toàn quanh mép canvas, tránh cạnh màn hình |
| Sàn chạm | Không khai ở đây. Lấy qua hàm của [`accessibility.md`](../08-quality/accessibility.md) `BR-A11-04` |

### 7.3 Vai trò slot theo layout

| LayoutId | `source` | `target` | Ghi chú |
|---|---|---|---|
| `grid` `horizontal-row` `grid-2x4` `flex-wrap` | không | không | Mọi slot `neutral` — chọn tại chỗ |
| `top-source-bottom-target` `left-source-right-target` | có | có | Kéo từ vùng nguồn sang vùng đích |
| `multi-bucket-bottom` `split-columns` | có | có | Nhiều đích, đích là rổ |
| `two-column-matching` | có | có | Hai cột đối xứng |
| `card-flip-grid` | không | không | Lật tại chỗ |
| `horizontal-track` `step-ladder` | có | có | Đích là vị trí trong dãy |

## 8. API contract

Không sở hữu route. Layout chạy hoàn toàn trên client trong engine.

Ràng buộc `layout_id` được ép ở đường ghi game level của
[`game-level-studio.md`](../06-admin/game-level-studio.md), dùng mã lỗi `LAYOUT_NOT_SUPPORTED`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LAY-01 — hàm layout thuần
  Given layout "grid" với slotCount 6 và ageBand "3-4"
  When gọi hàm layout 50 lần liên tiếp
  Then 50 kết quả bằng nhau từng field
  And không lần gọi nào chạm window hay Date

Scenario: BR-LAY-03 — slot không nhỏ hơn sàn chạm
  Given ageBand "3-4"
  When sinh slot cho mọi LayoutId với slotCount ở cả hai đầu limits
  Then mọi slot có hitW và hitH lớn hơn hoặc bằng sàn chạm của band 3-4

Scenario: BR-LAY-04 — hết chỗ thì phân trang, không thu nhỏ
  Given ageBand "3-4" và layout "grid" với slotCount 10
  When sinh slot
  Then tồn tại slot có page lớn hơn 0
  And không slot nào có hitW nhỏ hơn sàn chạm

Scenario: BR-LAY-05 — vùng chạm không chồng nhau
  When sinh slot cho mọi LayoutId với mọi slotCount hợp lệ
  Then không cặp slot nào cùng page có vùng chạm giao nhau
  And khoảng cách giữa hai vùng chạm gần nhất lớn hơn hoặc bằng SLOT_GAP_PX

Scenario: BR-LAY-06 — layout không đọc nội dung
  When kiểm chữ ký của mọi LayoutFn
  Then đầu vào chỉ gồm slotCount, ageBand, targetCount
  And không hàm nào nhận content_pack

Scenario: BR-LAY-07 — mọi LayoutId khai đều có cài đặt
  When đọc trường layouts của cả sáu template MVP
  Then mọi giá trị resolveLayout được
  And không giá trị nào trả về undefined

Scenario: BR-LAY-08 — vị trí ổn định theo chỉ số
  Given cùng LayoutInput
  When sinh slot hai lần và so sánh theo index
  Then slot thứ i có cùng x và y ở cả hai lần

Scenario: BR-LAY-09 — slot nằm trong không gian logic
  When sinh slot cho mọi LayoutId
  Then mọi slot nằm trọn trong hình chữ nhật 960x540 trừ SAFE_MARGIN_PX

Scenario: LAYOUT_NOT_SUPPORTED khi layout_id ngoài danh sách template
  Given template GT-001 khai layouts grid và horizontal-row
  When manager tạo level với layout_id "card-flip-grid"
  Then hệ thống trả 422 LAYOUT_NOT_SUPPORTED
  And không hàng nào được ghi
```

## 10. Boundaries

**Always**
- Lấy sàn chạm qua đúng một hàm, không chép số.
- Giữ hàm layout thuần và không trạng thái.
- Dùng cùng một `Slot[]` cho cả vẽ và hit-test.

**Ask first**
- Thêm một `LayoutId` mới.
- Đổi hình học của `LayoutId` đã publish.
- Đổi `SLOT_GAP_PX` hoặc `SAFE_MARGIN_PX`.

**Never**
- Thu nhỏ slot xuống dưới sàn chạm để vừa màn hình.
- Cho hàm layout đọc `content_pack`.
- Xáo trộn vị trí bên trong hàm layout.
- Tính toạ độ trong Session class.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Phân trang ở band 3–4 có cần điều hướng nhìn thấy được không, hay engine tự chuyển trang sau khi trang hiện tại xong? Trẻ 3 tuổi chưa chắc hiểu nút sang trang | Hành vi `BR-LAY-04` khi `slotCount` lớn | P1 | người quyết |
| 2 | Mười hai `LayoutId` hiện tại có gộp được không? `grid` và `grid-2x4` có thể là một hàm với tham số cột | Số hàm phải viết ở P1 | P1 | Backend |
| 3 | Layout có cần biến thể cho màn hình dọc không? Bản MVP giả định chơi ngang | Phạm vi P1 | chờ P4 | hoãn |
