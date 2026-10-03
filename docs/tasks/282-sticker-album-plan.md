# Task #282 Plan: Album sticker cuối bài

Todo: [`282-sticker-album-todo.md`](282-sticker-album-todo.md).
Spec: [`sticker-album.md`](../specs/04-play/sticker-album.md) `BR-STK-01..08`.

## 1. Vì sao

Task #280 kết mỗi bài bằng màn thưởng: sao, Gấu Con, lời khen. Màn đó biến mất khi trẻ rời trang,
nên trẻ không giữ lại được gì từ bài đã học.

Người quyết chốt 2026-10-03:
- Phần thưởng là **sao và sticker sưu tập**.
- Không xu, không chuỗi ngày, không mất sticker, không so sánh giữa trẻ.

## 2. Cách làm

**Bảng `child_stickers`** (migration 0008)
- Chỉ INSERT.
- `emoji` và `label` được chụp lúc trao (`BR-STK-02`).
- Unique `(child_profile_id, child_lesson_play_id)` (`BR-STK-01`).
- FK tới lượt học là `SET NULL`: xoá bài không xoá sticker.

**Trao sticker** (`child-lesson-flow.ts` → `completeAndAward`)
- Đóng lượt và trao sticker trong **một** transaction.
- Chỉ yêu cầu chuyển được lượt `in_progress → completed` mới trao, nên gọi song song hay gọi lại
  đều không trao thêm.
- `just_completed` bây giờ suy từ việc có sticker vừa trao.

**Chọn sticker** (`child-sticker-pick.ts`, logic thuần)
- Chủ đề lấy theo số đông `game_levels.theme_id` của các bước game.
- Không có chủ đề hợp lệ thì chọn tất định từ mã bài, trong các chủ đề `age_floor 3`.
- `lessons` chưa có tag trục theme: đo được 0 hàng `content_tag_map` loại `lesson`.
- Danh mục sticker là `nouns` của `CONTENT_THEMES` (`BR-CTR-12`), không giữ danh sách riêng.
- Trao sticker đầu tiên trẻ chưa có; đủ rồi thì quay vòng.

**API**
- `progress` trả thêm `sticker`.
- `GET /api/users/play/stickers?theme=`: Zod `safeParse`, `ValidationError` khi `theme` ngoài
  registry, `requireOwnedActiveChild`.

**Giao diện**
- `KidVictoryModal` có prop tuỳ chọn `sticker`.
- Trang `/play/stickers`:
  - layout `kid`;
  - sticker là emoji, tên ở `aria-label`;
  - không số, không ô trống;
  - thoát chỉ qua khoá phụ huynh.
- Icon album ở sảnh `/play`.
- `KidParentLockButton` tách từ trang bài, dùng chung cho trang bài và album.

## 3. Phát hiện

- `child_badges` (`BR-PRG-04`) đã cấm "bảng để săn". Album tuân theo đúng lập trường đó: chỉ hiện
  sticker đã có, không ô trống.
- Lead báo `lesson_activities.activity_id` trỏ `activities.entity_id` (D-AE); bản sửa join nằm ở
  main. Fixture của task này đặt `entity_id = id` nên đúng ở cả hai phía của bản sửa đó.

## 4. Ngoài phạm vi

- Tag theme cho bài: spec mục 11, câu 1.
- Sticker vẽ riêng thay emoji: câu 2.
- Album ở bề mặt phụ huynh: câu 3.
