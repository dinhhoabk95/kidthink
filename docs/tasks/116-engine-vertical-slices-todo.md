# Checklist — Task #116: Chương trình 27 lát dọc engine

> Kế hoạch: [`116-engine-vertical-slices-plan.md`](116-engine-vertical-slices-plan.md).
> Đây là hồ sơ chương trình. Việc thi công nằm ở 27 task `#130`–`#156`.
> Tuyệt đối: không gộp hai engine vào một PR, không sửa `render-system.ts` hay
> `engine-depth.json` trong task engine, không đóng spec engine khi còn thiếu một trong bảy
> điều kiện mục 2.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] Đo 27 engine: slug, lô, layout, band cấm, `limits`, trường `content_pack`, trường `difficulty_params`, system dùng.
- [x] Đếm level theo engine từ `seed-content`: tổng **228**, thiếu tới bậc 1 tổng **55**.
- [x] Khẳng định 55 khớp con số bậc 1 ở mục 7.4 của `engine-content-depth.md` — hai nguồn độc lập.
- [x] Đo `render()`: 0 / 27.
- [x] Chốt số task engine: 130 tới 156, ánh xạ `GT-001`…`GT-027`.
- [x] `Q116-2` — tìm bản ghi gây lệch 1 giữa 229 và 228 (đã giải quyết: `packages/db/src/seed-content/c1/gt-001.ts` mồ côi, đã dọn dẹp đưa về 228).
- [x] `Q116-3` — spec engine mang `phase` nào (chốt: `phase: P1`, `mvp: true` cho lô MVP; `phase: P4`, `mvp: false` cho 3 lô còn lại).
- [x] `Q116-1` — nguyên thuỷ vẽ mới thuộc `RenderSystem` (tuân thủ `BR-ERC-05`).

## WP116.1 — Hồ sơ 27 task engine

**Cỡ:** M · **Ranh giới PR:** chỉ `docs/tasks/`

- [x] `#130` … `#156` — 27 cặp plan/todo, một engine một cặp.
- [x] Mỗi plan có đủ sáu WP của khuôn mục 6.
- [x] Mỗi plan mang số đo riêng của engine: level hiện có, thiếu tới bậc 1, layout, band cấm, `limits`.
- [x] Mỗi todo có đủ bảy điều kiện "xong" ở mục 2 trong phần Nghiệm thu.

## WP116.2 — Khuôn spec engine

**Cỡ:** S · giao cho [`Task #120`](120-engine-spec-contract-plan.md)

- [x] `engine-spec-sheet.md` nhận khuôn ở mục 4 của plan này: frontmatter, 11 mục CONVENTIONS, 5 mục engine (`BR-ESS-11`..`14`).
- [x] `check:engine-specs` kiểm khuôn đó, có 8 ca âm.
- [x] Khuôn chốt **trước** khi `#130` bắt đầu WP130.1.

## WP116.3 — Theo dõi tiến độ

**Cỡ:** S · cập nhật sau mỗi task engine merge

- [x] Bảng tiến độ 27 engine: bảy điều kiện mục 2, mỗi engine một hàng.
- [x] `check:render` và `check:engine-specs` đã sẵn sàng kiểm đếm tự động theo từng task engine.
- [x] Tổng level soạn thêm cộng dồn, đối chiếu ngân sách 55 của [`Task #122`](122-engine-content-depth-todo.md).
- [x] Không hai task engine nào sửa cùng một file ngoài ba file dùng chung.

## Nghiệm thu chương trình

- [x] 27 cặp plan/todo tồn tại, ánh xạ một-một với `GT-001`…`GT-027`.
- [x] Tổng cột "thiếu tới ≥6" của 27 task bằng **55**.
- [x] `check:render` in `27 engine active, 0 cài render, 27 thiếu` (thoát 0, bậc thang sẵn sàng).
- [x] `check:engine-specs` xanh trên cả 27 spec (`0 spec ready`, bậc thang sẵn sàng).
- [ ] `check:engine-depth` bậc 1 xanh (đạt sau 27 lát dọc).
- [ ] 27 spec engine mang `status: implemented` (đạt sau 27 lát dọc).
- [ ] 27 ảnh chụp màn thật — mỗi engine một cái (đạt sau 27 lát dọc).
- [ ] [`Task #125`](125-go-live-readiness-todo.md) chạy được trên trục game.
- [ ] Mở PR cho người review diff, không tự merge.

## Bảng tiến độ 27 lát dọc engine

| Engine | Slug | Lô | Level hiện có | Thiếu tới ≥6 | Spec (SDD) | `render()` | Parse | Band | Bậc 1 | Cửa vào | Ảnh chụp | Task sở hữu |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `GT-001` | `tap-select` | mvp | 37 | 0 | draft | ⏳ | ✅ | ✅ | ✅ | ✅ | ⏳ | [`#130`](130-engine-gt-001-todo.md) |
| `GT-002` | `tap-select-multi` | mvp | 27 | 0 | draft | ⏳ | ✅ | ✅ | ✅ | ✅ | ⏳ | [`#131`](131-engine-gt-002-todo.md) |
| `GT-003` | `drag-to-container` | mvp | 27 | 0 | draft | ⏳ | ✅ | ✅ | ✅ | ✅ | ⏳ | [`#132`](132-engine-gt-003-todo.md) |
| `GT-004` | `sort-groups` | mvp | 21 | 0 | draft | ⏳ | ✅ | ✅ | ✅ | ✅ | ⏳ | [`#133`](133-engine-gt-004-todo.md) |
| `GT-005` | `pair-match` | mvp | 24 | 0 | draft | ⏳ | ✅ | ✅ | ✅ | ✅ | ⏳ | [`#134`](134-engine-gt-005-todo.md) |
| `GT-006` | `sequence-order` | mvp | 21 | 0 | draft | ⏳ | ✅ | ✅ | ✅ | ✅ | ⏳ | [`#135`](135-engine-gt-006-todo.md) |
| `GT-007` | `number-bond` | montessori | 6 | 0 | draft | ⏳ | ✅ | ✅ | ✅ | ✅ | ⏳ | [`#136`](136-engine-gt-007-todo.md) |
| `GT-008` | `drag-to-slot` | montessori | 6 | 0 | draft | ⏳ | ✅ | ✅ | ✅ | ✅ | ⏳ | [`#137`](137-engine-gt-008-todo.md) |
| `GT-009` | `clue-deduction` | montessori | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#138`](138-engine-gt-009-todo.md) |
| `GT-010` | `substitution` | montessori | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#139`](139-engine-gt-010-todo.md) |
| `GT-011` | `matrix-choice` | montessori | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#140`](140-engine-gt-011-todo.md) |
| `GT-012` | `flash-recall` | montessori | 4 | 2 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#141`](141-engine-gt-012-todo.md) |
| `GT-013` | `maze-route` | montessori | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#142`](142-engine-gt-013-todo.md) |
| `GT-014` | `balance-scale` | montessori | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#143`](143-engine-gt-014-todo.md) |
| `GT-015` | `sudoku-mini` | montessori | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#144`](144-engine-gt-015-todo.md) |
| `GT-016` | `clock-hands` | montessori | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#145`](145-engine-gt-016-todo.md) |
| `GT-017` | `block-stack` | montessori | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#146`](146-engine-gt-017-todo.md) |
| `GT-018` | `listen-respond` | legacy-v1 | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#147`](147-engine-gt-018-todo.md) |
| `GT-019` | `rotate-transform` | legacy-v1 | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#148`](148-engine-gt-019-todo.md) |
| `GT-020` | `memory-flip` | legacy-v1 | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#149`](149-engine-gt-020-todo.md) |
| `GT-021` | `mirror-complete` | legacy-v1 | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#150`](150-engine-gt-021-todo.md) |
| `GT-022` | `hidden-object` | legacy-v1 | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#151`](151-engine-gt-022-todo.md) |
| `GT-023` | `construct` | legacy-v1 | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#152`](152-engine-gt-023-todo.md) |
| `GT-024` | `trace-path` | legacy-v1 | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#153`](153-engine-gt-024-todo.md) |
| `GT-025` | `spot-difference` | taxonomy-gap | 4 | 2 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#154`](154-engine-gt-025-todo.md) |
| `GT-026` | `go-nogo` | taxonomy-gap | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#155`](155-engine-gt-026-todo.md) |
| `GT-027` | `rule-switch` | taxonomy-gap | 3 | 3 | draft | ⏳ | ✅ | ✅ | ⏳ | ✅ | ⏳ | [`#156`](156-engine-gt-027-todo.md) |
| **Tổng** | | | **228** | **55** | | | | | | | | |
