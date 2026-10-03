# Task #280 Todo: Trẻ tự học một bài

Plan: [`280-child-lesson-flow-plan.md`](280-child-lesson-flow-plan.md).

Lệnh kiểm (chạy qua `rtk proxy`):
- `pnpm lint`
- `pnpm typecheck --only root` / `web:app` / `web:server`
- `pnpm check:migration-hashes`
- Test của `apps/web` cho các file dưới đây, chạy với `pnpm services` đang bật

## Spec — 2026-10-03

- [x] `04-play/child-lesson-flow.md` mới, `BR-CLF-01..08`
- [x] `index.md`, prefix `BR-CLF` ở `business-rules.md`, liên kết từ `lesson-flow-model.md`
- [x] Người đặt việc duyệt, đổi `status: draft` sang `approved` (2026-10-03)

## S1 — Dữ liệu

- [x] `packages/db/src/schema/child-lesson-plays.ts` và migration `0007_child_lesson_plays.sql`; đã apply ở DB dev, hash đã chốt

## S2 — Logic thuần

- [x] RED: `tests/unit/child-lesson-steps.test.ts` — đỏ vì module chưa có
- [x] `buildStepPlan` (thứ tự, làm quen trước, khử trùng) và `deriveStepStates` (xong sau `started_at`, bước khoá không chặn)
- [x] Ca âm: mọi level đều khoá thì bài KHÔNG tự xong

## S3 — API

- [x] `openLessonProgress`, `listLessonsForChild`; `requireOwnedActiveChild`
- [x] `tests/api/child-lesson-flow.test.ts` trên DB test, 8 test:
  - thứ tự theo `position`
  - vào lại tiếp đúng bước
  - level chơi trước khi mở lượt không tính
  - đóng lượt một lần
  - bài ngoài tuổi vẫn mở được
  - ca âm: mã bài sai → 404
  - ca âm: hồ sơ trẻ của user khác → `NO_ACTIVE_CHILD`
  - danh sách xếp bài dở lên đầu

- [x] `check:test-ratchet` (DB bật) bắt hai lỗi, đã sửa:
  - `schema-tables.test.ts` đếm 82 bảng → 83.
  - Test API đỏ khi chạy gộp vì `started_at` lấy `now()` của DB, còn `play_sessions.completed_at` lấy giờ app; khi hai đồng hồ lệch, bước vừa chơi bị tính là chơi trước lượt. Sửa: `started_at` dùng giờ app. Ratchet giữ 42/42.

## S4 — Giao diện

- [x] `/play/lesson/[code]` cùng `tests/component/play-lesson-page.test.ts`, 6 test, gồm ca âm "chưa xong thì không thưởng"
- [x] Trang chơi: `?lesson=` → nút tiếp về trang bài; đường làm quen giữ `lesson`
- [x] `useParentLockHold` thay code nhấn giữ viết tại chỗ ở trang chơi
- [x] `KidLessonRow` ở sảnh `/play`

## Checkpoint — trình duyệt thật

QA trình duyệt 2026-10-03 ([`docs/qa/engine-captures/2026-10-03/`](../qa/engine-captures/2026-10-03/README.md)) cho kết quả:
- Mọi bài seed đều trả 404, vì service join `lesson_activities.activity_id` với `activities.id`. Spec `schema-content-taxonomy.md` §7 chốt cột này trỏ `entity_id`.
- Fixture cũ cũng dùng `id`, nên test vẫn xanh.
- Đã sửa cả service lẫn fixture: fixture giờ trỏ `entity_id` như seed. Sau sửa, cả 126 bài seed đều ra 2 level.
- `lesson-plan.ts`, `lesson-session-runner.ts`, `lesson-exemplar.ts` đã chuyển join sang `activities.entity_id` + `status = 'published'` (D-AE, `schema-content-taxonomy.md` §7); fixture test đổi pivot sang `entityId`. Đã đóng.


- [ ] Chơi trọn một bài band 3–4: làm quen → các level → màn thưởng có tiếng
- [ ] Thoát giữa chừng qua khoá phụ huynh, vào lại thì tiếp đúng bước
