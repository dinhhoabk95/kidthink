---
spec: ENGINE-RENDER-CONTRACT
title: Hợp đồng vẽ của engine — từ content_pack ra pixel
area: platform
status: draft
mvp: false
phase: P4
reviewed: 2026-08-29
owns:
  - Hình dạng hợp đồng vẽ của một game engine
  - Luật mọi engine active phải cài đặt render
  - Ánh xạ slot layout sang phần tử vẽ và trạng thái phản hồi thị giác
depends_on:
  - GAME-ENGINE-RUNTIME
  - GAME-LAYOUT-ENGINE
  - GAME-TEMPLATE-CONTRACT
  - ENGINE-SPEC-SHEET
  - DESIGN-SYSTEM-CONTRACT
  - ACCESSIBILITY
---

# Hợp đồng vẽ của engine — từ `content_pack` ra pixel

## 1. Objective

Mọi mảnh của đường vẽ đã tồn tại, trừ mảnh cuối.

Đo ngày 2026-08-29 bằng cách đọc mã nguồn:

| Mảnh | Trạng thái |
|---|---|
| Vòng lặp gọi hàm vẽ — `GameEngine.loop()` gọi `activeSession?.render?.(ctx, rs, now)` | Có |
| Canvas tới được engine — `start(canvas)`, `renderSystem.setupCanvas(canvas)` | Có |
| Hình học layout — 21 `LayoutId`, `resolveLayout()` trả `Slot[]` kèm vùng chạm theo band | Có |
| Bộ vẽ nguyên thuỷ — `drawClayBody`, `drawClayContainer`, `drawScaffoldingHighlight`, `drawParticles` | Có |
| **Engine cài đặt `render()`** | **0 trên 27** |

`render` khai `optional` trong `GameSession`. Không engine nào cài, nên mỗi khung hình vòng
lặp xoá canvas rồi gọi một hàm không tồn tại. Kết quả là màn hình trống — không phải lỗi, và
vì vậy không cổng nào bắt.

File này sở hữu **hợp đồng vẽ**: hình dạng của `render()`, ánh xạ từ `Slot[]` sang phần tử
trên màn hình, tập trạng thái thị giác bắt buộc, và luật một engine `active` phải vẽ được.
Nó cấm — NEVER định nghĩa lại vòng lặp hay ngân sách khung hình; hai thứ đó thuộc
[`game-engine-runtime.md`](game-engine-runtime.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Dev | — | Cài `render()` cho một engine theo mục 11 của phiếu engine tương ứng |
| Vòng lặp engine | — | Gọi `render()` mỗi khung hình sau khi `clear()` |
| Cổng vẽ | — | Chặn khi một engine `active` không cài `render()`, hoặc vẽ ngoài ngân sách |
| Trẻ 3–6 | — | Người duy nhất đọc đầu ra. Mọi ràng buộc ở đây tồn tại vì lứa này |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/src/templates/<code>/session.ts` | Dev | Nơi cài `render()` |
| `packages/game-engine/src/systems/render-system.ts` | Dev | Bộ vẽ nguyên thuỷ dùng chung. Cấm vẽ tay ngoài bộ này |
| `packages/game-engine/src/layout/registry.ts` | Engine | `resolveLayout()` trả `Slot[]` |
| `pnpm --filter @mindkid/game-engine check:render` | Cổng vẽ | Chạy trong cổng tự động trước khi merge |
| `docs/specs/01-platform/engines/GT-<nnn>.md` mục 11 | Dev | Hợp đồng vẽ riêng của engine đó |

## 4. Main flow

1. Vòng lặp gọi `session.render(ctx, renderSystem, timeMs)` sau `renderSystem.clear(ctx)`.
2. Engine lấy `Slot[]` đã giải từ layout — cấm tự tính toạ độ.
3. Engine vẽ **nền cảnh** trước, rồi **phần tử tĩnh**, rồi **phần tử tương tác**, rồi **lớp
   phản hồi** (hiệu ứng đúng sai, gợi ý), theo đúng thứ tự đó.
4. Mọi màu và font lấy từ `designTokens.ts` — `BR-ENG-04`.
5. Engine cấm — NEVER đổi trạng thái phiên trong `render()`. Nó thuần đọc.
6. Vòng lặp xin khung hình kế.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Chạy headless (test, seed) | Không có canvas | `start()` không nhận canvas, vòng lặp bỏ qua phần vẽ. `render()` cấm được gọi |
| Asset ảnh chưa tải xong | Mạng chậm | Vẽ ô giữ chỗ theo token, cấm — NEVER để trống. Trẻ phải thấy có thứ gì đó ở đó |
| Emoji ref không resolve | Dữ liệu hỏng | Vẽ ô giữ chỗ và ghi telemetry lỗi. Cấm ném lỗi trong `render()` — một exception mỗi khung hình làm treo bề mặt |
| Thiết bị yếu | `degradation.ts` báo tụt khung hình | Bỏ lớp phản hồi trang trí trước, giữ phần tử tương tác. Thứ tự bỏ ghi ở mục 7.4 |
| Engine `deprecated` | Không nhận level mới | Vẫn phải vẽ được. Level cũ vẫn chạy |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ERC-01` (bắt buộc cài) | Mọi engine `status: active` **phải** cài `render()`. Cổng đỏ nếu thiếu | `render` để `optional` là lý do 0 trên 27 engine vẽ được mà không cổng nào kêu |
| `BR-ERC-02` (thuần) | `render()` cấm — NEVER đổi trạng thái phiên, cấm sinh telemetry, cấm gọi `validateAction` | Nó chạy 60 lần mỗi giây. Cùng lý do `BR-GTC-09` giữ `checkWinCondition` thuần |
| `BR-ERC-03` (toạ độ từ layout) | Toạ độ phần tử tương tác lấy từ `Slot[]` của `resolveLayout()`. Cấm hằng số toạ độ trong Session class | Vùng chạm theo band tuổi nằm trong `Slot`. Tự tính toạ độ là tự bỏ sàn chạm |
| `BR-ERC-04` (sàn chạm) | Mọi phần tử chạm được vẽ trong `hitW × hitH` của slot, không nhỏ hơn sàn chạm của band | Ngón tay trẻ 3 tuổi không trúng ô nhỏ hơn sàn. Đây là ràng buộc a11y, không phải thẩm mỹ |
| `BR-ERC-05` (chỉ dùng bộ nguyên thuỷ) | Vẽ qua `RenderSystem`. Cấm gọi thẳng `ctx.fillRect`, `ctx.arc`, `ctx.font` trong Session class | Vẽ tay rải rác làm bề mặt lệch khỏi bảng token — cùng nợ mà `BR-DSC-02` đã ghi |
| `BR-ERC-06` (bốn lớp đúng thứ tự) | Thứ tự vẽ: nền cảnh, phần tử tĩnh, phần tử tương tác, lớp phản hồi | Lớp phản hồi vẽ dưới phần tử tương tác thì trẻ không thấy mình vừa làm đúng |
| `BR-ERC-07` (không ném lỗi) | `render()` cấm — NEVER ném. Dữ liệu thiếu thì vẽ ô giữ chỗ | Một exception mỗi khung hình là màn hình đứng, không phải thông báo lỗi |
| `BR-ERC-08` (ngân sách khung hình) | Một lượt `render()` ở mức nội dung tối đa của engine phải xong trong ngân sách khung hình của [`game-engine-runtime.md`](game-engine-runtime.md) | Ngân sách đã có chủ; file này chỉ ràng buộc engine phải nằm trong đó và phải đo được |
| `BR-ERC-09` (tuột mượt, không tắt) | Khi `degradation` báo tụt, engine bỏ theo thứ tự ở mục 7.4 — trang trí trước, tương tác sau cùng | Bỏ nhầm thứ tự làm màn chơi không chơi được thay vì chỉ kém đẹp |
| `BR-ERC-10` (mỗi engine có mục 11) | Mỗi phiếu engine phải có mục 11 mô tả: slot nào vẽ gì, tập trạng thái thị giác, thứ tự tuột | Một hợp đồng vẽ chung không đủ để cài `GT-013` mê cung; mỗi engine vẽ thứ khác nhau |
| `BR-ERC-11` (test ảnh chụp) | Mỗi engine có test vẽ trên canvas ngoài màn hình, khẳng định số lệnh vẽ và vùng chạm, không so pixel | So pixel giòn và đỏ vì lý do sai. Đếm lệnh vẽ và kiểm hình học thì ổn định |

## 7. Data

**Đọc:** `content_pack` đã parse · `Slot[]` từ layout · `designTokens.ts` · trạng thái phiên.
**Ghi:** không ghi gì. `render()` chỉ vẽ.

### 7.1 Hình dạng `render()`

```ts
render(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  timeMs: number
): void;
```

Ba tham số là toàn bộ đầu vào. Không đọc DOM, không đọc `window`, không đọc đồng hồ hệ thống
— `timeMs` là nguồn thời gian duy nhất, để test tua được.

### 7.2 Bốn lớp vẽ và khuôn mẫu chuẩn

```ts
render(ctx: CanvasRenderingContext2D, rs: RenderSystem, timeMs: number): void {
  const slots = this.slots;                   // đã giải sẵn từ layout, cấm tự tính toạ độ
  this.drawScene(ctx, rs);                    // lớp 1 — nền cảnh
  this.drawStatic(ctx, rs, slots);            // lớp 2 — phần tử tĩnh
  this.drawInteractive(ctx, rs, slots);       // lớp 3 — phần tử tương tác
  this.drawFeedback(ctx, rs, slots, timeMs);  // lớp 4 — lớp phản hồi
}
```

| Lớp | Nội dung | Ví dụ |
|---|---|---|
| 1. Nền cảnh | Nền theo token, đường dẫn hướng, khung vùng | Nền `two-column-matching`, lưới mê cung |
| 2. Phần tử tĩnh | Thứ không chạm được | Nhãn nhóm, mẫu tham chiếu, kim đồng hồ đích |
| 3. Phần tử tương tác | Thứ chạm hoặc kéo được, vẽ trong slot | Thẻ chọn, vật kéo, ô lưới |
| 4. Lớp phản hồi | Hiệu ứng đúng sai, gợi ý, hạt | `drawScaffoldingHighlight`, `drawParticles` |

### 7.3 Tập trạng thái thị giác tối thiểu

Mỗi phần tử tương tác phải phân biệt được **năm** trạng thái, và phân biệt bằng nhiều hơn một
kênh thị giác — cấm chỉ dùng màu, theo [`accessibility.md`](../08-quality/accessibility.md).

| Trạng thái | Kênh bắt buộc |
|---|---|
| Nghỉ | mặc định |
| Đang chạm hoặc đang kéo | Đổi kích thước hoặc đổ bóng, không chỉ đổi màu |
| Đã chọn | Viền dày cộng dấu tick |
| Đúng | Màu cộng hình dấu, cộng hạt của lớp 4 |
| Sai | Màu cộng rung ngắn, cấm — NEVER dùng đỏ làm kênh duy nhất |

### 7.4 Thứ tự tuột khi thiết bị yếu

Bỏ dần theo thứ tự này, dừng ngay khi khung hình về ngân sách:

1. Hạt và hiệu ứng trang trí của lớp 4.
2. Đổ bóng và chuyển động mượt.
3. Nền cảnh trang trí của lớp 1, giữ khung vùng.
4. Không bao giờ bỏ: lớp 3 và vùng chạm của nó.

### 7.5 Hình dạng cổng vẽ

```
check:render
  27 engine active, 27 cài render, 0 thiếu
  GT-014: vẽ ngoài slot — 2 lệnh drawClayBody có toạ độ hằng số   LỖI
  exit 1
```

Cổng kiểm ba thứ tĩnh được: engine `active` có `render`; Session class không gọi thẳng
`ctx.*`; không có hằng số toạ độ. Phần còn lại thuộc test ảnh chụp ở `BR-ERC-11`.

### 7.6 Bảy phép kiểm bắt buộc cho mỗi engine

Mỗi task engine (trong 27 task `#130`–`#156`) phải vượt qua đủ 7 phép kiểm sau:

| # | Phép kiểm | Ràng buộc kiểm tra | Rule |
|---|---|---|---|
| 1 | Thứ tự bốn lớp | Đếm thứ tự gọi các hàm vẽ trên `CanvasRenderingContext2D` giả | `BR-ERC-06` |
| 2 | Sàn vùng chạm | Vùng chạm `hitW × hitH` ≥ sàn chạm của band tuổi (3-4: 96px, 4-5: 72px, 5-6: 64px) | `BR-ERC-04` |
| 3 | Năm trạng thái thị giác | Mỗi trạng thái (nghỉ, chạm, chọn, đúng, sai) có ≥ 2 kênh thị giác | mục 7.3 |
| 4 | Hàm thuần | 100 lần gọi `render()` cùng `timeMs` giữ nguyên trạng thái phiên, 0 telemetry | `BR-ERC-02` |
| 5 | Toạ độ từ `Slot[]` | Cổng tĩnh `check:render` xanh, không hằng số toạ độ trong session | `BR-ERC-03` |
| 6 | Xử lý emoji hỏng | Emoji ref không resolve không ném ngoại lệ, vẽ ô giữ chỗ | `BR-ERC-07` |
| 7 | Tuột mượt | `degradation` kích hoạt thì bỏ hạt lớp 4, bảo toàn lớp 3 | `BR-ERC-09` |

**Cấm — NEVER so sánh pixel (`BR-ERC-11`)**: Mọi test vẽ chạy trên canvas ngoài màn hình (`vitest-canvas-mock` hoặc mock context) kiểm tra cấu trúc lệnh gọi và kích thước hình học, không so sánh ảnh chụp pixel bitmap.


## 8. API contract

Không có. `render()` là hàm trong tiến trình, không phải route.

Mã lỗi liên quan đã đăng ký: `LAYOUT_NOT_SUPPORTED` (422) khi `layout_id` không thuộc
`layouts` của template — thuộc [`game-layout-engine.md`](game-layout-engine.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-ERC-01 — engine active thiếu render làm cổng đỏ
  Given GT-014 có status active và Session class không có phương thức render
  When chạy check:render
  Then cổng thoát với mã khác 0
  And thông báo nêu GT-014

Scenario: BR-ERC-02 — render thuần
  Given một phiên đang chạy
  When gọi render 100 lần liên tiếp với cùng timeMs
  Then trạng thái phiên không đổi
  And không telemetry event nào được sinh

Scenario: BR-ERC-03 — toạ độ lấy từ layout
  When đọc mọi session.ts của engine active
  Then không file nào chứa hằng số toạ độ vẽ

Scenario: BR-ERC-04 — phần tử chạm đạt sàn chạm của band
  Given một level band 3-4 với 6 slot
  When dựng phiên và đọc vùng chạm từng phần tử tương tác
  Then mọi vùng chạm không nhỏ hơn sàn chạm của band 3-4

Scenario: BR-ERC-05 — không vẽ tay ngoài RenderSystem
  When đọc mọi session.ts của engine active
  Then không file nào gọi ctx.fillRect, ctx.arc, hay ctx.font

Scenario: BR-ERC-07 — emoji hỏng không làm render ném
  Given một content_pack có emoji ref không resolve
  When gọi render
  Then không exception nào được ném
  And một ô giữ chỗ được vẽ

Scenario: BR-ERC-09 — tuột bỏ trang trí trước, giữ tương tác
  Given degradation báo tụt khung hình
  When gọi render
  Then số lệnh vẽ hạt bằng 0
  And số lệnh vẽ phần tử tương tác không đổi

Scenario: BR-ERC-11 — mỗi engine có test vẽ
  When đọc thư mục test của game-engine
  Then mỗi engine active có ít nhất một test gọi render trên canvas ngoài màn hình
```

## 10. Boundaries

**Always**
- Lấy toạ độ từ `resolveLayout()`.
- Vẽ qua `RenderSystem` và `designTokens.ts`.
- Vẽ đủ bốn lớp đúng thứ tự.
- Phân biệt trạng thái bằng nhiều hơn một kênh thị giác.

**Ask first**
- Thêm một bộ vẽ nguyên thuỷ mới vào `RenderSystem`.
- Cho một engine bỏ qua một lớp trong bốn lớp.
- Đổi thứ tự tuột ở mục 7.4.

**Never**
- Đổi trạng thái phiên hoặc sinh telemetry trong `render()`.
- Hằng số toạ độ trong Session class.
- Gọi thẳng `ctx.*` ngoài `RenderSystem`.
- Ném lỗi trong `render()`.
- Dùng màu làm kênh phân biệt duy nhất.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Cài `render()` cho 27 engine là bao nhiêu việc? Cần đo một engine mẫu trước khi cam kết lịch — `GT-001` đơn giản nhất, `GT-013` mê cung phức tạp nhất | Lịch go-live của tầng game | P4 | Backend |
| 2 | `RenderSystem` hiện có 4 bộ vẽ nguyên thuỷ. Đủ cho 27 engine, hay cần thêm bộ vẽ cho mê cung, đồng hồ, cân? Thêm bộ nào là quyết định kiến trúc, không phải tuỳ engine | Cài `render()` cho `GT-013` `GT-014` `GT-016` | P4 | Backend |
| 3 | Test ảnh chụp đếm lệnh vẽ cần một `CanvasRenderingContext2D` giả. Dùng thư viện có sẵn hay tự viết bộ ghi lệnh? | `BR-ERC-11` | P4 | Backend |
