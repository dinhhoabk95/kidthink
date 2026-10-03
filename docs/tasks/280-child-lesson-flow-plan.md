# Task #280 Plan: Trẻ tự học một bài — làm quen → trò chơi → thưởng

Todo: [`280-child-lesson-flow-todo.md`](280-child-lesson-flow-todo.md).
Spec: [`child-lesson-flow.md`](../specs/04-play/child-lesson-flow.md) `BR-CLF-01..08`.

## 1. Vì sao

Tham chiếu KidsUP Pro: mỗi bài 5–7 phút, mở bằng thẻ làm quen, luyện bằng vài trò chơi, kết bằng
thưởng. MindKid có đủ nguyên liệu nhưng chưa có khuôn đó:
- 126 bài `lessons`, mỗi bài 2 hoạt động `digital_game`.
- Cổng làm quen GT-000.
- Trang chơi level.

Đường duy nhất để chạy bài là [`lesson-session-runner`](../specs/04-play/lesson-session-runner.md),
dành cho **người lớn** dẫn. Trẻ ở nhà chỉ chơi từng level rời.

## 2. Cách làm

**Bảng `child_lesson_plays`** (migration 0007)
- Tách khỏi `lesson_runs`, vì bảng đó resume theo user và có con trỏ bước do người dạy bấm.
- Lượt học chụp kế hoạch bước (`steps` jsonb) một lần (`BR-CLF-02`).
- Unique một phần: mỗi (trẻ, bài) có một lượt dở (`BR-CLF-04`).

**Tiến độ suy từ server** (`BR-CLF-03`)
- Một bước xong khi có `play_sessions` completed của chính trẻ.
- Level chơi phải xong sau `started_at` của lượt; bài làm quen thì xong lúc nào cũng tính.
- Client không gửi "đã xong".

**Code**
- Logic thuần nằm ở `server/services/child-lesson-steps.ts`; phần DB ở `child-lesson-flow.ts`.
- Route `POST /api/users/play/lessons/{code}/progress` và `GET /api/users/play/lessons`.
- `requireOwnedActiveChild` gom phần kiểm cookie trẻ.

**Tái dùng trang chơi**
- Trang bài điều hướng tới `/play/{level}?lesson={code}`.
- Nút tiếp của màn tổng kết đưa về `/play/lesson/{code}`.
- Đường làm quen giữ `lesson` qua `return_to`.

**Giao diện trẻ**
- Trang `/play/lesson/[code]`: khoá phụ huynh nhấn giữ, Gấu Con, hạt mỗi bước, nút ▶.
- Màn thưởng tái dùng `KidVictoryModal`.
- Composable `useParentLockHold` dùng chung với trang chơi.
- Hàng `KidLessonRow` ở sảnh `/play`.

## 3. Phát hiện trong lúc làm

- `activities.ref_id` trỏ `game_levels.entity_id` (khoá đa version), không trỏ `id`. Join sai cho
  ra 0 level chơi được ở cả 126 bài.
- Plan tổng ban đầu ghi "lọc band, ca âm bài khác band". Ý đó trái `BR-LFM-02` (tuổi là gợi ý,
  không chặn). Đã sửa: tuổi chỉ dùng để xếp danh sách (`BR-CLF-07`).

## 4. Ngoài phạm vi

- Sticker sưu tập cuối bài: task #282.
- Bản đồ chủ đề tuần: task #281.
- Lượt dở quá hạn: spec mục 11, câu 1.
- Khách (guest): spec mục 11, câu 2.
