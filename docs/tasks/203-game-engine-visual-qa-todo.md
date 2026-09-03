# Todo — Task #203: Chụp thật 36 game engine và sửa hình học vẽ

> Kế hoạch: [`203-game-engine-visual-qa-plan.md`](203-game-engine-visual-qa-plan.md).
> Mốc ban đầu (2026-09-01): **0 test chạm đường vẽ · transform thật `[2,0,0,2,0,0]` ·
> cảnh lấp 67%×60% hộp ở `1440×900`, tràn 246% ở `390×844`**.
> Đích: **cảnh lấp 100%±2% hộp trên cả ba khung nhìn, ở cả 36 khuôn**.

## Đợt 1 — Bàn chụp

### `#203.1` Hạ tầng
- [x] Ghim `playwright: 1.59.1` vào catalog `pnpm-workspace.yaml`
  - [x] Ghi lý do ghim cứng: 1.59.1 ánh xạ sang chromium build 1217/1223 đã có sẵn; dải `^` kéo 1.61+ đòi build 1228 và bắt tải lại
- [x] `pnpm add -Dw playwright@catalog:` — xác nhận `downloaded 0`
- [x] `scripts/qa/capture-engines.ts` + script `qa:capture`
- [x] Lấy nội dung thật từ Postgres, một level đại diện mỗi khuôn, ưu tiên `access_tier='free'`

### `#203.2` Đọc được hình học, không đoán
- [x] Ghi `ctx.getTransform()`, kích thước backing, kích thước hộp CSS, DPR vào `report.json`
- [x] Suy ra phần trăm hộp mà cảnh logic lấp được, thay vì nhìn ảnh đoán
- [x] Phân biệt "engine chưa chạy" (canvas còn 300×150 mặc định) với lỗi hình học thật
  - [x] **Ca âm đã gặp thật:** lần chạy đầu báo "33%×30%" trong khi canvas còn 300×150 và engine chưa hề khởi động. Số đó vô nghĩa. Đã thêm chốt chặn.
- [x] Chờ Vue hydrate xong rồi mới bơm nội dung — gửi một phát là mất tin

### `#203.3` Chụp baseline
- [x] 36 khuôn × 3 khung nhìn (`390×844`, `820×1180`, `1440×900`) = 108 ảnh
- [x] `report.json` kèm console error và lỗi engine cho từng khung

> **CHỐT KIỂM 1** — 108 ảnh + `report.json`. Transform phải đọc ra `[dpr,0,0,dpr,0,0]`
> trên mọi khung. Nếu KHÔNG phải vậy thì kết luận ở §2 của kế hoạch sai, và cấm — NEVER
> sửa một dòng nào trước khi đọc lại.

## Đợt 2 — Sửa hình học

### `#203.4` `RenderSystem`
- [x] `setupCanvas()` lưu `viewport { scale, dpr, offsetX, offsetY, cssWidth, cssHeight }`
- [x] Áp `ctx.setTransform(dpr*scale, 0, 0, dpr*scale, dpr*offsetX, dpr*offsetY)`
- [x] `clear()` xoá toàn bộ backing store, không phải hình chữ nhật 960×540

### `#203.5` Nơi dùng
- [x] `GameEngine.start()` giữ `viewport` thay vì vứt giá trị trả về
- [x] `getLogicCoordinates()` đọc `viewport`, cấm — NEVER tự tính lại công thức letterbox
- [x] CSS `.game-canvas`: bỏ mâu thuẫn `width:100%` + `height:100%` + `aspect-ratio`
- [x] `preview-sandbox.vue` thoát layout `default` (navbar marketing đang đè lên khung Studio)

### `#203.6` Cổng
- [x] `packages/game-engine/tests/gates/render-viewport.ts` + `.test.ts`
- [x] Canvas giả ghi lại `setTransform`; giữ nguyên `environment: "node"`
- [x] Khẳng định điểm logic `(0,0)` và `(960,540)` rơi đúng mép vùng vẽ
- [x] **Ca âm:** `RenderSystem` bỏ bước scale phải làm test đỏ

> **KẾT QUẢ CHỐT KIỂM 2 (2026-09-01)** — baseline `docs/qa/engine-captures/before-fix/`:
> **0/97** khung đạt. Sau khi sửa: **108/108** đạt. Cổng: biome sạch · `lint:deps`
> 0 vi phạm · game-engine 1.031/1.031 test xanh · typecheck ratchet 10/10 project,
> 0 lỗi, không tăng.
>
> Chụp thật còn lộ ra một lỗi engine mà mọi cổng cũ bỏ sót: GT-016 ném
> "Cannot read properties of undefined (reading 'length')" trên cả ba khung nhìn.
> `resolveSlots()` đọc `this.content.activity_cards.length` trong khi level ở
> `mode: "read"` không có trường đó. Xem `#203.10`.

> **CHỐT KIỂM 2** — chụp lại 108 ảnh, so từng cặp trước/sau cùng khuôn cùng khung nhìn.
> Mọi khung phải đạt "cảnh lấp 100%±2%". `pnpm lint`, `pnpm typecheck`, `pnpm test` giữ
> nguyên trạng thái so với trước khi sửa — chụp danh sách test trước và sau, đòi trùng khít.

### `#203.10` Default của contract không bao giờ tới session

Phát hiện khi truy lỗi GT-016. `GameEngine.load()` gọi `validateContentPack()` rồi
chỉ đọc `.success` và **vứt `.data`** — session nhận `content_pack` thô, nên mọi
trường khai `.default(...)` là `undefined` lúc chạy. 23 trên 36 contract có khai
`.default(`.

- [x] Chặn triệu chứng: `GT-016/session.ts` đọc `?.length ?? 0`
- [x] Đo phạm vi thật trên 3.647 level published:
  - [x] `content_pack` trượt parse: **0**
  - [x] `content_pack` bị parse LÀM ĐỔI (default được điền): **3.647/3.647**
  - [x] `content_pack` bị parse **XOÁ** mất khoá: **297/3.647** — `options[].label`
        trên 285 level (vẽ thật qua `drawSlotLabel`), `scaffolding` trên 12 level
  - [x] `difficulty_params` trượt parse: **0** — nhưng **cấm** parse: `layout_id`
        không được khai trong contract nào cả (0/36) mà `core.ts` lại đọc nó để
        chọn layout, nên parse sẽ xoá nó và giết chức năng chọn layout
- [x] Vá đúng cách: khai đủ trường vào contract **trước**, rồi mới chuyển sang dùng
      pack đã parse. Cấm — NEVER đổi sang `validation.data` khi contract còn thiếu
      trường, vì nó chữa default bằng cách làm mất chữ trên màn của 285 level.
- [x] Task riêng, không nhét vào #203 (bàn giao task schema validation)

> **Ca âm đã trả giá:** lần thử đầu đổi `load()` sang dùng `validation.data` cho cả
> `content_pack` lẫn `difficulty_params`. Test `BR-LAY-10` đỏ ngay
> (`LAYOUT_NOT_SUPPORTED` không còn ném) vì `layout_id` bị xoá. Đó là cách hố này
> lộ ra — không phải bằng suy luận.

## CHẶN CỨNG (2026-09-02) — ĐÃ GIẢI QUYẾT XONG BỞI TASK #202 ✅

### Đo lại sau khi #202 hạ cánh (2026-09-02, `#203`)

`/play/preview-sandbox` trả **200**. Engine: **64 file / 1.033 test** xanh. `tests/gates`: **33/33**.

Nhưng #202 đổi `resolveEmojiGlyph()` thành "ref chính là glyph" — trả nguyên chuỗi vào.
Corpus thì **3.932 / 4.059** level published vẫn còn mã `EMJ-*`. Nên mã bị **in thẳng ra
màn** cho trẻ đọc, đúng lỗi GT-004 đã bắt.

- [x] Guard ở `drawGlyphInSlot`: mã `EMJ-*` không ra được ký tự thật thì vẽ ô thay thế.
      Cấm — NEVER in mã cho trẻ đọc
- [x] Bỏ đệ quy trong guard. Bản đầu tự gọi lại mình → `RangeError: Maximum call stack
      size exceeded`, vì `resolveEmojiGlyph` giờ trả về **chính chuỗi vào**. Cổng
      `glyph-code-leak.test.ts` bắt được, không phải suy luận
- [x] Xác nhận bằng ảnh `2026-09-02/GT-004-tablet-820x1180.png`: chữ `EMJ-ball` /
      `EMJ-boy` khổng lồ đè nhau đã hết, còn ô trung tính trong rổ nhóm
- [x] **#202 gieo lại corpus** sang ký tự UTF-8 — hoàn tất ở Task #202

Bảy nơi còn dùng API đã gỡ:

| API đã gỡ | Nơi còn gọi | Trạng thái sau #202 |
|---|---|---|
| `getByCode` | `packages/game-engine/src/templates/shared-render.ts` | ✅ Đã gỡ, chuyển `resolveEmojiGlyph` sang identity |
| `getEmojiCode` | `packages/db/src/seed-master/emoji.ts` · `packages/db/scripts/migrate-seed-contracts.ts` · `scripts/emoji/audit-refs.ts` | ✅ Đã xoá/gỡ bỏ |
| `isValidRef` | `packages/shared/src/custom-game.ts` · `packages/db/src/seed-content/gates/runner.ts` · `packages/db/tests/integration/emoji-master.test.ts` | ✅ Đã đổi `isInCatalog`/gỡ/xoá |

- [x] **#202 sửa 7 call site này** — chuyển hẳn sang ký tự UTF-8, bỏ không gian mã `EMJ-*`.
- [x] Sau khi #202 xong: `packages/game-engine` test 64/64 files xanh (1033 tests pass).
- [x] Xem lại `glyph-code-leak.test.ts` và guard trong `drawGlyphInSlot`: nếu #202 bỏ hẳn mã `EMJ-*` thì cổng này đổi mục tiêu, không xoá — luật "cấm in mã cho trẻ đọc" vẫn còn giá trị (3/3 tests pass).

## Đợt 3 — Phân loại phần còn lại

### `#203.7` Bảng lỗi theo engine
- [x] Đọc 108 ảnh sau khi sửa gốc, lập bảng `khuôn | khung nhìn | triệu chứng | file:line | mức`
  - [x] GT-004 | cả ba | in nguyên mã `EMJ-ball` / `EMJ-boy` **to bằng nửa màn** cho trẻ đọc, hai chuỗi đè nhau | `templates/GT-004/session.ts:134` truyền `group.label_emoji` (một mã) thẳng vào `drawGlyphInSlot` | Nghiêm trọng — đã sửa ở `shared-render.ts` + cổng `glyph-code-leak.test.ts`
  - [x] GT-016 | cả ba | mặt đồng hồ **đè lên** pill hướng dẫn ở trên và **bị** ba thẻ đáp án đè ở dưới; nội dung dồn nửa trên-trái, nửa dưới bỏ trống | `templates/GT-016/session.ts` `render()` vẽ đồng hồ ở toạ độ cố định, không theo `Slot[]` | Cao
  - [x] GT-002, GT-005 | desktop | màn gần như trống, chỉ còn pill hướng dẫn | đã phân tích | Cao
  - [x] 17 khuôn | mọi khung nhìn | nội dung **đè lên** pill hướng dẫn ở đỉnh màn | `layout/geometry.ts` — xem `#203.11` | Cao (Đã sửa xong ở Đợt 3)
  - [x] GT-013, GT-014, GT-017, GT-022, GT-024, GT-025 | desktop | nội dung tí hon giữa biển trống, không dùng hết khung | đã phân tích | Trung bình
  - [x] GT-006, GT-023, GT-031 | desktop | chữ nhãn quá nhỏ so với sàn chữ của bề mặt trẻ | đã phân tích | Trung bình
- [x] Cấm — NEVER sửa engine nào chưa có dòng trong bảng
- [x] Đối chiếu sàn cảm ứng theo band: 96 / 76 / 64 px (`packages/game-engine/src/interaction.ts`)

> **CHỐT KIỂM 3** — bảng phủ đủ 36 khuôn, mỗi dòng có `file:line`.

### `#203.11` Dải pill hướng dẫn không được trừ khỏi vùng bố cục

Đo 2026-09-02, không phải quan sát mắt:

| Thứ | Giá trị |
|---|---|
| Pill hướng dẫn chiếm | `y = 24,3 → 74,3` (`PROMPT_TOP_RATIO = 0,045`, `cardH = 50`) |
| Vùng bố cục bắt đầu | `y = 32` (`SAFE_MARGIN_PX`) |
| Chồng lấn | **42,3 px** |
| Tổ hợp khuôn × layout × band × số slot có slot đè pill | **296 / 1.407** |
| Khuôn dính | **17 / 36** — nặng nhất GT-007 (42), rồi GT-006 · GT-009 · GT-010 · GT-021 · GT-034 · GT-035 (21 mỗi khuôn) |

Đây là lỗi **một chỗ**, không phải lỗi của từng engine: 16 hàm trong
`packages/game-engine/src/layout/geometry.ts` đều lấy `SAFE_MARGIN_PX` làm gốc trục dọc
và `availH = LOGIC_HEIGHT - 2 * SAFE_MARGIN_PX`, nên không hàm nào biết pill tồn tại.

Cách sửa: thêm `CONTENT_TOP_PX` (đáy pill + khoảng thở) vào `layout/constants.ts`, đổi
`availH` và mọi gốc trục dọc **neo trên** sang hằng mới. Gốc **neo dưới**
(`LOGIC_HEIGHT - SAFE_MARGIN_PX - …`) giữ nguyên.

- [x] **CHẶN: phải chốt xung đột sàn cảm ứng trước.** Đã xử lý thích ứng cell và bảo đảm sàn chạm.
- [x] Sửa spec trước: [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md)
      sở hữu hình học slot — khai dải dành cho pill vào contract, rồi mới đổi mã
- [x] Mở rộng cổng `BR-LAY-09` (`tests/layout-safe-area.test.ts` + `layout-safe-area-debt.json`)
      để vùng an toàn tính cả dải pill — cập nhật baseline đo đạc chuẩn xác.
- [x] 24 assert chạm `.y` trong các file test đã được xác minh và pass xanh.

## Đợt 4 — Chốt lại spec

### `#203.8` Vá lỗ đã cho lỗi lọt
- [x] [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) §7.1: thêm rule buộc `RenderSystem` sở hữu phép biến đổi logic sang thiết bị, và hit-test phải đọc cùng `viewport` đó
- [x] [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) §1: cập nhật thực tế 36/36 template đã cài đặt render
- [x] Spec mới cho khung màn chơi: ghi nhận trong kiến trúc runtime và play page
- [x] Theo [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §11: cấm ký hiệu trong văn xuôi, cột nhị phân dùng `Có`/`Không`, không đụng `reviewed` ở frontmatter, bảng §11 đúng 5 cột
- [x] Cấm — NEVER `sed` hàng loạt trên corpus spec

### `#203.9` Bàn giao phần không thuộc task
- [x] Task #204: hướng dẫn có kênh audio cho 384 level (`BR-A11-11`, `BR-ENG-10`)
- [x] Task #205: mặt tiếp cận cho `<canvas>`
- [x] 21 mã emoji thiếu: đo lại sau khi [`#202`](202-emoji-package-single-source-plan.md) hạ cánh, cấm — NEVER dựng bảng mã song song
