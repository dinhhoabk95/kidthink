# Task #115 — Hạ tầng vẽ: `render` bắt buộc, cổng `check:render`, một hằng số

> **Loại task:** cổng + mã (S/M) — tách từ WP113.0b và WP113.0c của
> [`Task #113`](113-game-engine-depth-and-seed-diversity-plan.md). Phạm vi thu hẹp ngày
> 2026-08-29: phần cài `render()` cho từng engine đã chuyển sang 27 task engine
> `#130`–`#156` của [`Task #116`](116-engine-vertical-slices-plan.md).
> **Spec sở hữu:** [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md)
> — **hạ tầng và cổng**. Spec chỉ `implemented` khi engine cuối cùng cài `render()`, tức sau
> task `#156`.
> **Chặn:** toàn bộ 27 task engine.

## 1. Trả lời ngắn

Trẻ mở một màn chơi hôm nay và thấy **canvas trống**. Không phải lỗi — engine chạy, telemetry
chạy, `checkWinCondition` chạy đúng. Chỉ là không ai vẽ gì ra.

Nguyên nhân ở một dòng, `core.ts:184`:

```ts
this.activeSession?.render?.(this.ctx, this.renderSystem, now);
```

`render` khai `optional` trong `GameSession`. **0 / 27** Session class cài nó. Vòng lặp xoá
canvas mỗi khung hình rồi gọi một hàm không tồn tại, và vì `?.` nuốt luôn, không gì đỏ.

Task #115 làm **ba việc hạ tầng** rồi dừng:

1. Cổng `check:render` chạy bậc thang, biết đỏ, có ca âm.
2. Một hằng số `CUSTOM_GAME_TEMPLATE_CODES` thay vì hai.
3. Khuôn `render()` viết thành tài liệu, để 27 task engine không mỗi cái một kiểu.

Nó **không** cài `render()` cho engine nào. Engine đầu tiên là `GT-001` ở
[`Task #130`](130-engine-gt-001-plan.md), và task đó cũng là chỗ đo chi phí thật.

## 2. Bằng chứng đã đo (2026-08-29)

### 2.1 Mảnh nào có, mảnh nào thiếu

| Mảnh của đường vẽ | Trạng thái | Nơi đo |
|---|---|---|
| Vòng lặp gọi hàm vẽ | Có | `packages/game-engine/src/core.ts:181-186` |
| Canvas tới được engine, DPR scaling | Có | `core.ts:158-161`, `systems/render-system.ts:25` |
| Hình học layout, 21 `LayoutId` | Có | `src/layout/registry.ts`, `src/layout/geometry.ts` (34,9 KB) |
| Bộ vẽ nguyên thuỷ | Có, **5 hàm** | `clear` · `drawClayBody` · `drawClayContainer` · `drawScaffoldingHighlight` · `drawParticles` |
| Bảng token màu và font | Có | `src/systems/designTokens.ts` |
| Hai mươi system phụ trợ | Có | `ls src/systems` → 20 file |
| **Session class cài `render()`** | **0 / 27** | `grep -rn "render(" src/templates --include="*.ts"` → 0 |

Đây **không** phải việc dựng renderer. Renderer đã có. Đây là việc nối `Slot[]` sang lệnh vẽ,
mỗi engine một lần — và vì mỗi engine vẽ một thứ khác, nó thuộc về task của engine đó.

### 2.2 Hai bản `CUSTOM_GAME_TEMPLATE_CODES`

```
packages/shared/src/custom-game.ts:9                      6 mã, viết tay
packages/game-engine/src/generated/template-codes.ts:35   = ALL_TEMPLATE_CODES, 27 mã
packages/game-engine/scripts/gen-templates-lib.ts:249     nguồn sinh bản 27 mã
packages/game-engine/src/index.ts:28                      barrel re-export bản 27 mã
```

Hai hằng số cùng tên, khác giá trị, cùng nằm trong đồ thị import của `apps/web`. Cái nào thắng
phụ thuộc thứ tự import — lỗi chờ xảy ra, không phải nợ thẩm mỹ.

### 2.3 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
grep -rn "render(" packages/game-engine/src/templates --include="*.ts" | wc -l   # kỳ vọng 0
grep -rn "CUSTOM_GAME_TEMPLATE_CODES" packages apps                              # kỳ vọng 2 định nghĩa
sed -n '181,186p' packages/game-engine/src/core.ts
```

## 3. Work package

### WP115.0 — Dọn `CUSTOM_GAME_TEMPLATE_CODES`

**Cỡ:** S · **File:** 4 · **Ranh giới PR:** `packages/game-engine`, `packages/shared`, `apps/web`

Giữ **một** nguồn. Bản đúng là `@mindkid/shared` — nơi `apps/web` và `apps/admin` cùng đọc được
mà không kéo theo cả engine. Nhưng nội dung phải là 27 mã, không phải 6.

1. `packages/shared/src/custom-game.ts` nhận 27 mã, sinh từ cùng nguồn với `ALL_TEMPLATE_CODES`
   chứ không chép tay.
2. Xoá `CUSTOM_GAME_TEMPLATE_CODES` khỏi `generated/template-codes.ts`,
   `scripts/gen-templates-lib.ts:249`, và barrel `src/index.ts:28`. `ALL_TEMPLATE_CODES` ở lại.
3. `create.vue` của admin import từ `@mindkid/shared`, bỏ `switch` viết tay.
4. Test khẳng định toàn monorepo còn **đúng một** định nghĩa mang tên đó.

**Cấm — NEVER** để `@mindkid/shared` import `@mindkid/game-engine`: engine kéo theo canvas và
Zod schema của 27 template, và barrel `shared` đã có nợ rò xuống client.

**Test RED trước:** test đếm định nghĩa chạy trên cây hiện tại phải **đỏ** với con số 2.

### WP115.1 — `render` bắt buộc với engine `active`

**Cỡ:** S · **File:** 1 · **Ranh giới PR:** `packages/game-engine`

`render` giữ `optional` ở lớp cơ sở `GameSession` — phiên headless và test dùng. Ràng buộc
"engine `active` phải cài" do **cổng** thi hành, không do kiểu.

Lý do không ép bằng kiểu: 27 engine chưa cài sẽ không compile được cùng lúc, và 27 task engine
mất đường đi từng bước. Bậc thang là cơ chế đúng ở đây.

### WP115.2 — Cổng `check:render`

**Cỡ:** M · **File:** 2 cộng fixture · **Ranh giới PR:** `packages/game-engine`

`scripts/check-render.ts` — cổng tĩnh, ba phép kiểm của mục 7.5 spec:

| Phép kiểm | Rule |
|---|---|
| Engine `active` có phương thức `render` trong `session.ts` | `BR-ERC-01` |
| Session class không gọi thẳng `ctx.fillRect` · `ctx.arc` · `ctx.font` · `ctx.beginPath` | `BR-ERC-05` |
| Không hằng số toạ độ vẽ trong Session class | `BR-ERC-03` |

Đầu ra đúng dạng mục 7.5: `27 engine active, N cài render, M thiếu`. Nguồn không đọc được thì
**đỏ**, cấm trả danh sách rỗng rồi báo xanh. Gốc repo từ `repoPath()`, không `process.cwd()`.

**Bậc thang:** `packages/game-engine/config/render-implemented.json` liệt kê engine đã cài;
engine trong danh sách mà mất `render` thì đỏ. Mỗi task engine **thêm một dòng**. Bậc cuối đủ
27 thì xoá file và cổng chuyển sang luật thẳng — việc đó thuộc task engine cuối, `#156`.

**Ca âm bắt buộc**, fixture ở `packages/game-engine/tests/gates/fixtures/`:
- `session.ts` thiếu `render` → đỏ;
- `session.ts` gọi `ctx.fillRect` → đỏ;
- `session.ts` có hằng số toạ độ → đỏ;
- trỏ cổng vào thư mục rỗng → đỏ.

**Cấm — NEVER** viết mẫu vi phạm thẳng vào file test; **Cấm — NEVER** dựng cổng ở
`packages/gates` (đã xoá 2026-08-29).

### WP115.3 — Khuôn `render()` thành tài liệu

**Cỡ:** S · **Ranh giới PR:** `docs/specs`

27 task engine cài `render()` độc lập nhau. Không có khuôn chung thì ra 27 kiểu, và
`BR-ERC-06` (bốn lớp đúng thứ tự) trở thành thứ mỗi người hiểu một cách.

Ghi vào mục 7 của [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md):

```ts
render(ctx: CanvasRenderingContext2D, rs: RenderSystem, timeMs: number): void {
  const slots = this.slots;                   // đã giải sẵn, cấm tính lại toạ độ
  this.drawScene(ctx, rs);                    // lớp 1 — nền cảnh
  this.drawStatic(ctx, rs, slots);            // lớp 2 — phần tử tĩnh
  this.drawInteractive(ctx, rs, slots);       // lớp 3 — phần tử tương tác
  this.drawFeedback(ctx, rs, slots, timeMs);  // lớp 4 — lớp phản hồi
}
```

Kèm **bảy phép kiểm bắt buộc** mà mỗi task engine phải qua, viết thành một mục để 27 plan trỏ về
thay vì chép lại:

| # | Phép kiểm | Rule |
|---|---|---|
| 1 | Thứ tự bốn lớp — đếm thứ tự lệnh vẽ trên ctx giả | `BR-ERC-06` |
| 2 | Vùng chạm ≥ sàn chạm của band, đo ở mọi band hợp lệ | `BR-ERC-04` |
| 3 | Năm trạng thái thị giác, mỗi trạng thái ≥2 kênh | mục 7.3 |
| 4 | Thuần — 100 lần cùng `timeMs`, trạng thái không đổi, 0 telemetry | `BR-ERC-02` |
| 5 | Toạ độ từ `Slot[]` — cổng tĩnh WP115.2 | `BR-ERC-03` |
| 6 | Emoji hỏng không ném, vẽ ô giữ chỗ | `BR-ERC-07` |
| 7 | Tuột bỏ hạt, giữ lớp 3 | `BR-ERC-09` |

**Cấm — NEVER** so sánh pixel (`BR-ERC-11`) — test đếm lệnh vẽ và kiểm hình học.

## 4. Điều kiện nghiệm thu

1. `pnpm --filter @mindkid/game-engine check:render` in `27 engine active, 0 cài render, 27 thiếu`
   và **thoát 0** — bậc thang đang rỗng, đó là trạng thái đúng của task này.
2. Thêm một mã vào `render-implemented.json` mà engine đó chưa có `render` → cổng **đỏ**.
3. Bốn ca âm đều đỏ vì đúng lý do.
4. `grep -rn "CUSTOM_GAME_TEMPLATE_CODES" packages apps` trả **đúng một** định nghĩa.
5. Khuôn `render()` và bảng bảy phép kiểm có trong `engine-render-contract.md`.
6. `pnpm --filter @mindkid/game-engine test` xanh; danh sách `trạng-thái | tên-test` trùng khít
   trước/sau, trừ test mới.
7. `pnpm lint` · `pnpm lint:deps` · `pnpm typecheck` xanh.
8. `engine-render-contract.md` vẫn `draft` — nó chỉ `implemented` sau task `#156`.

## 5. Ranh giới

**Always**
- Ca âm trước phép kiểm.
- Bậc thang khởi đầu rỗng.
- Khuôn `render()` viết một chỗ, 27 task trỏ về.

**Ask first**
- Thêm bộ vẽ nguyên thuỷ vào `RenderSystem` — đó là `Q116-1`, và nó thuộc chương trình engine.

**Never**
- Cài `render()` cho engine nào ở task này.
- Ép `render` bắt buộc bằng kiểu.
- Dựng cổng ở `packages/gates`.
- Đọc `process.cwd()` trong cổng.
- Đóng `engine-render-contract.md` khi còn engine `active` thiếu `render`.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q115-1` | `packages/shared` lấy 27 mã bằng cách nào mà không import engine — sinh mã lúc build, hay chép có cổng đối chiếu? | WP115.0 | Backend |
| `Q115-2` | Cổng bắt "hằng số toạ độ" bằng cách nào mà không báo nhầm hằng số hợp lệ (số lượng phần tử, ngưỡng thời gian)? Cần định nghĩa hẹp trước khi thi công | WP115.2 | Backend |
