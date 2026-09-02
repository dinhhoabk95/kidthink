# Kế hoạch — Task #203: Chụp thật 36 game engine và sửa hình học vẽ

> **Loại task:** sửa lỗi nền (M) — một khiếm khuyết ở tầng vẽ, hiện ra trên cả 36 engine.
> **Đích:** cảnh vẽ của mọi engine lấp đúng hộp canvas ở mọi khung nhìn, và điểm chạm
> rơi đúng ô. Kèm một cổng để lỗi này không quay lại.
> **Cho phép:** thêm Playwright làm devDependency gốc và một thư mục `scripts/qa/`.

## 1. Trả lời ngắn

Toàn bộ 36 engine vẽ vào **một thẻ `<canvas>`**. `RenderSystem.setupCanvas()` tính hệ số
scale để đưa toạ độ logic 960×540 về pixel thiết bị, rồi **trả về mà không áp dụng**.
`GameEngine.start()` gọi nó và **vứt giá trị trả về**. Kết quả: ngữ cảnh vẽ ở lại không
gian CSS pixel, trong khi mọi `render()` vẽ theo toạ độ logic.

Đây không phải vùng chưa chốt. [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) §7.1
đã ghi: *"Logic cố định 960×540, scale theo DPR, `object-fit: contain`. Mọi toạ độ trong
Session class là toạ độ logic — cấm dùng pixel thiết bị."* Mã vi phạm chính spec của nó.

Lý do lọt: **không test nào chạm đường vẽ**. `vitest` chạy `environment: "node"`, không có
DOM, và không file test nào tham chiếu `setupCanvas`. Vẽ là vùng mù duy nhất của kho.

## 2. Đo được (2026-09-01)

Đo bằng trình duyệt thật, đọc thẳng `ctx.getTransform()` của canvas trong trang. Không
phải nhìn mắt.

| Khung nhìn | Hộp canvas | Transform thật | Cảnh logic lấp được | Kết luận |
|---|---|---|---|---|
| `390×844` | 390×844 @dpr2 | `[2,0,0,2,0,0]` | 246% × 64% | Cắt mất 3/5 chiều ngang |
| `820×1180` | 820×1180 @dpr2 | `[2,0,0,2,0,0]` | 117% × 46% | Cắt ngang, thừa dọc |
| `1440×900` | 1440×900 @dpr2 | `[2,0,0,2,0,0]` | 67% × 60% | Cảnh dồn góc trên-trái |

`[2,0,0,2,0,0]` với `devicePixelRatio = 2` nghĩa là hệ số vẽ **đúng bằng DPR** — không có
bước scale logic nào. Đúng như đọc mã: `render-system.ts` chỉ chạy `ctx.scale(dpr, dpr)`.

Ảnh chứng: [`docs/qa/engine-captures/2026-09-01/`](../qa/engine-captures/2026-09-01/).

### 2.1 Hệ quả kéo theo

| # | Hệ quả | Nơi |
|---|---|---|
| 1 | `clear()` chỉ xoá vùng 960×540 nên pixel ngoài vùng đó không bao giờ được xoá | `render-system.ts` `clear()` |
| 2 | `getLogicCoordinates()` tự tính lại công thức letterbox, không khớp cách vẽ thật, nên điểm chạm lệch | `apps/web/app/pages/play/[code].vue` |
| 3 | CSS `.game-canvas` khai cả `width:100%` lẫn `height:100%` nên `aspect-ratio: 16/9` bị vô hiệu | `apps/web/app/pages/play/[code].vue` |
| 4 | `preview-sandbox.vue` không khai `definePageMeta` nên rơi vào layout `default` — navbar và footer marketing đè lên khung game của Studio | `apps/web/app/pages/play/preview-sandbox.vue` |

### 2.2 Đo được nhưng KHÔNG thuộc task này

> **Sửa lại số đã ghi sai.** Lần đo đầu grep chuỗi `"EMJ-<slug>"` trong
> `packages/emoji/src/data/*.ts` và kết luận 21 mã thiếu, 40 level hỏng. Phép đo đó
> sai: `getByCode()` khớp **cả** mã **suy ra** từ từ khoá tiếng Anh của mỗi mục
> (`getEmojiCode()` ở `packages/emoji/src/query.ts`), chứ mã không nằm sẵn trong
> file dữ liệu. Đo lại bằng chính `getByCode` cho 16 mã và 18 level. Năm mã từng bị
> kết tội oan: `EMJ-coin`, `EMJ-barn`, `EMJ-battery`, `EMJ-satellite`, `EMJ-yarn`.
>
> Corpus cũng đã đổi giữa chừng: một phiên khác seed từ **384** lên **3.647** level
> published trong lúc task này chạy.

| Việc | Số đo | Giao cho |
|---|---|---|
| 16 mã `EMJ-*` không resolve được qua `getByCode`, làm level vẽ ô xám thay vì emoji | 18 level trên 3.647 published: GT-036 6/10 · GT-035 4/10 · GT-030 3/24 · GT-031 3/84 · GT-017 1/12 · GT-028 1/26 | [`#202`](202-emoji-package-single-source-plan.md) đang bỏ hẳn không gian mã `EMJ-*` |
| Hướng dẫn chỉ có chữ trên bề mặt trẻ | `instruction_audio_path` rỗng trên 3.647/3.647 level published | Task #204 |
| `<canvas>` không có `role`, `aria-label`, `tabindex` | 0 thuộc tính tiếp cận trên cả hai trang chơi | Task #205 |

`validateKidInstruction()` ở `packages/ui/src/kid-surface/contracts.ts` cưỡng chế đúng luật
`BR-A11-11`, nhưng grep toàn kho cho thấy **không nơi nào gọi nó**. Luật không có cổng thì trôi.

## 3. Cách sửa

Một nguồn sự thật cho hình học, dùng chung giữa vẽ và chạm.

`setupCanvas()` tính và **lưu** `viewport { scale, dpr, offsetX, offsetY, cssWidth, cssHeight }`,
rồi áp thẳng lên ngữ cảnh:

```
ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY)
```

`clear()` xoá toàn bộ backing store, không phải một hình chữ nhật 960×540.
`getLogicCoordinates()` **đọc** `viewport` thay vì tự tính lại — đây mới là thứ diệt cả lớp
lỗi, chứ không chỉ một ca.

## 4. Cổng

`packages/game-engine/tests/gates/render-viewport.ts` cùng ca âm, theo luật ở
[`AGENTS.md`](../../AGENTS.md): cổng phạm vi một workspace nằm ở `<workspace>/tests/gates/`
và bắt buộc có hai phần — quét nguồn thật và một mẫu vi phạm làm test đỏ.

`vitest` chạy `environment: "node"`; cấm — NEVER đổi env cho cả project chỉ vì một cổng.
Dùng canvas giả ghi lại lời gọi `setTransform`.

## 5. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Ảnh chụp có nên nằm trong git không, hay đẩy ra ngoài kho | Kích thước kho | Không chặn | người quyết |
| 2 | Có dựng cổng so ảnh theo pixel không, hay dừng ở cổng số học | Hồi quy thị giác về sau | P5 | hoãn — mở lại khi baseline ảnh đứng yên qua 2 lần chạy |
| 3 | Sandbox nên dùng layout `kid` hay `layout: false` | Khung xem trước của Studio | Không chặn | Studio UI |
