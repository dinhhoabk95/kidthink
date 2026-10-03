# Task #282 Todo: Album sticker cuối bài

Plan: [`282-sticker-album-plan.md`](282-sticker-album-plan.md).

Lệnh kiểm (chạy qua `rtk proxy`):
- `pnpm lint`
- `pnpm typecheck --only root` / `web:app` / `web:server`
- `pnpm check:migration-hashes`
- Các file test dưới đây
- `pnpm check:test-ratchet`

## Spec — 2026-10-03

- [x] `04-play/sticker-album.md` mới, `BR-STK-01..08`
- [x] `index.md` (04-play 20, tổng 196), prefix `BR-STK` ở `business-rules.md`
- [x] §7.5 ở `feedback-and-celebration.md`, mục Boundaries của `child-lesson-flow.md`
- [x] Người đặt việc duyệt, đổi `status: draft` sang `approved` (2026-10-03)

## S1 — DB

- [x] `schema/child-stickers.ts`, export ở `schema/index.ts`
- [x] `0008_child_stickers.sql` + journal idx 8, `db:migrate`, `check:migration-hashes:update`
- [x] `schema-tables.test.ts` 83 → 84

## S2 — Logic thuần

- [x] `tests/unit/child-sticker-pick.test.ts` viết trước (đỏ), 12 test:
  - danh mục;
  - chủ đề số đông, hoà;
  - ca âm: giá trị ngoài registry;
  - dự phòng tất định;
  - sticker chưa có, quay vòng;
  - ca âm: chủ đề không danh mục;
  - gom album.

## S3 — Service + API

- [x] `completeAndAward`: đóng lượt và trao sticker trong một transaction
- [x] `GET /api/users/play/stickers`
- [x] `tests/api/child-stickers.test.ts` trên DB test, 9 test:
  - trao một lần;
  - ca âm: chưa xong thì không trao;
  - ca âm: DB chặn sticker thứ hai cho cùng lượt;
  - sticker mới ở lần hai;
  - xoá lượt thì sticker ở lại;
  - album chỉ của trẻ đang hoạt động;
  - lọc theo theme;
  - ca âm: theme sai → `VALIDATION_FAILED`;
  - ca âm: hồ sơ của user khác → `NO_ACTIVE_CHILD`.

## S4 — Giao diện

- [x] Prop `sticker` của `KidVictoryModal`, thêm 2 test (có một ca âm)
- [x] Trang bài truyền sticker, thêm 1 test
- [x] `KidParentLockButton` dùng chung
- [x] `/play/stickers` cùng `tests/component/play-stickers-page.test.ts`, 7 test:
  - không chữ số;
  - không liên kết;
  - khoá phụ huynh → `/play`;
  - album trống;
  - ca âm: API lỗi.
- [x] Icon album ở sảnh `/play`

## Checkpoint — trình duyệt thật

- [ ] Xong một bài → màn thưởng có sticker → icon sảnh → album hiện sticker
- [ ] Đọc màn hình đọc đúng tên sticker

- [x] QA 2026-10-03: tiêu đề chủ đề album là dải màu, không emoji — số ô trên màn = số sticker (2 sticker → 2 ô; ảnh `after-modal-album-fix/album-*.png`, `BR-STK-06`)
