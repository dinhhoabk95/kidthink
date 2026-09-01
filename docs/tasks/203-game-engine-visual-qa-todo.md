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
- [ ] 36 khuôn × 3 khung nhìn (`390×844`, `820×1180`, `1440×900`) = 108 ảnh
- [ ] `report.json` kèm console error và lỗi engine cho từng khung

> **CHỐT KIỂM 1** — 108 ảnh + `report.json`. Transform phải đọc ra `[dpr,0,0,dpr,0,0]`
> trên mọi khung. Nếu KHÔNG phải vậy thì kết luận ở §2 của kế hoạch sai, và cấm — NEVER
> sửa một dòng nào trước khi đọc lại.

## Đợt 2 — Sửa hình học

### `#203.4` `RenderSystem`
- [ ] `setupCanvas()` lưu `viewport { scale, dpr, offsetX, offsetY, cssWidth, cssHeight }`
- [ ] Áp `ctx.setTransform(dpr*scale, 0, 0, dpr*scale, dpr*offsetX, dpr*offsetY)`
- [ ] `clear()` xoá toàn bộ backing store, không phải hình chữ nhật 960×540

### `#203.5` Nơi dùng
- [ ] `GameEngine.start()` giữ `viewport` thay vì vứt giá trị trả về
- [ ] `getLogicCoordinates()` đọc `viewport`, cấm — NEVER tự tính lại công thức letterbox
- [ ] CSS `.game-canvas`: bỏ mâu thuẫn `width:100%` + `height:100%` + `aspect-ratio`
- [ ] `preview-sandbox.vue` thoát layout `default` (navbar marketing đang đè lên khung Studio)

### `#203.6` Cổng
- [ ] `packages/game-engine/tests/gates/render-viewport.ts` + `.test.ts`
- [ ] Canvas giả ghi lại `setTransform`; giữ nguyên `environment: "node"`
- [ ] Khẳng định điểm logic `(0,0)` và `(960,540)` rơi đúng mép vùng vẽ
- [ ] **Ca âm:** `RenderSystem` bỏ bước scale phải làm test đỏ

> **CHỐT KIỂM 2** — chụp lại 108 ảnh, so từng cặp trước/sau cùng khuôn cùng khung nhìn.
> Mọi khung phải đạt "cảnh lấp 100%±2%". `pnpm lint`, `pnpm typecheck`, `pnpm test` giữ
> nguyên trạng thái so với trước khi sửa — chụp danh sách test trước và sau, đòi trùng khít.

## Đợt 3 — Phân loại phần còn lại

### `#203.7` Bảng lỗi theo engine
- [ ] Đọc 108 ảnh sau khi sửa gốc, lập bảng `khuôn | khung nhìn | triệu chứng | file:line | mức`
- [ ] Cấm — NEVER sửa engine nào chưa có dòng trong bảng
- [ ] Đối chiếu sàn cảm ứng theo band: 96 / 76 / 64 px (`packages/game-engine/src/interaction.ts`)

> **CHỐT KIỂM 3** — bảng phủ đủ 36 khuôn, mỗi dòng có `file:line`.

## Đợt 4 — Chốt lại spec

### `#203.8` Vá lỗ đã cho lỗi lọt
- [ ] [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) §7.1: thêm rule buộc `RenderSystem` sở hữu phép biến đổi logic sang thiết bị, và hit-test phải đọc cùng `viewport` đó
- [ ] [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) §1: bảng còn ghi "Engine cài đặt `render()` — 0 trên 27". Sai đã lâu; đo lại và viết lại
- [ ] Spec mới cho khung màn chơi: hiện **không spec nào sở hữu** `pages/play/[code].vue`, HUD, victory modal, hay bố cục đáp ứng
- [ ] Theo [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §11: cấm ký hiệu trong văn xuôi, cột nhị phân dùng `Có`/`Không`, không đụng `reviewed` ở frontmatter, bảng §11 đúng 5 cột
- [ ] Cấm — NEVER `sed` hàng loạt trên corpus spec

### `#203.9` Bàn giao phần không thuộc task
- [ ] Task #204: hướng dẫn có kênh audio cho 384 level (`BR-A11-11`, `BR-ENG-10`)
- [ ] Task #205: mặt tiếp cận cho `<canvas>`
- [ ] 21 mã emoji thiếu: đo lại sau khi [`#202`](202-emoji-package-single-source-plan.md) hạ cánh, cấm — NEVER dựng bảng mã song song
