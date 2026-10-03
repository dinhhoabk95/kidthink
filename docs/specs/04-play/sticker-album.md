---
spec: STICKER-ALBUM
title: Album sticker — phần thưởng sưu tập khi trẻ học xong một bài
area: play
status: draft
mvp: false
phase: P4
reviewed: 2026-10-03
owns:
  - Việc trao sticker khi một lượt học của trẻ đóng (`child_stickers`)
  - Danh mục sticker theo chủ đề và cách chọn chủ đề, chọn sticker
  - Trang album sticker của trẻ (`/play/stickers`)
depends_on:
  - CHILD-LESSON-FLOW
  - FEEDBACK-AND-CELEBRATION
  - PROGRESS-AND-MASTERY
  - CONTENT-THEME-REGISTRY
  - PARENT-GATE
---

# Album sticker — phần thưởng sưu tập khi trẻ học xong một bài

## 1. Objective

[`child-lesson-flow.md`](child-lesson-flow.md) kết mỗi bài bằng màn thưởng: Gấu Con ăn mừng, sao,
lời khen. Màn thưởng đó biến mất khi trẻ rời trang, nên trẻ không có gì để **giữ lại** từ bài đã học.

Spec này thêm một phần thưởng giữ được: mỗi lượt học xong cho trẻ **một sticker** theo chủ đề của
bài, dán vào album riêng của trẻ. Người quyết chốt 2026-10-03 (#282): phần thưởng là **sao và
sticker sưu tập**. Không xu, không chuỗi ngày, không mất sticker, không so sánh giữa các trẻ.

Album là **kỷ niệm**, giống huy hiệu ở [`progress-and-mastery.md`](progress-and-mastery.md) §7.2.
Nó không phải bảng để "săn": trẻ chỉ thấy sticker mình đã có, không thấy ô trống hay con số.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động (cookie `active_child_id`) của user đã đăng nhập | Nhận sticker khi xong bài, xem album của mình |
| Người lớn | Cổng phụ huynh | Rời trang album |
| Server | — | Trao sticker khi đóng lượt học. Client không tự xin sticker |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `POST /api/users/play/lessons/{code}/progress` | Trẻ | Lần gọi đóng lượt (`just_completed: true`) trả thêm `sticker` vừa trao |
| Màn thưởng của `/play/lesson/{code}` | Trẻ | `KidVictoryModal` hiện sticker vừa nhận |
| `GET /api/users/play/stickers` | Trẻ | Album của trẻ đang hoạt động |
| `/play/stickers` | Trẻ | Trang album, layout `kid` |
| Nút sticker ở sảnh `/play` | Trẻ | Icon vào album, chữ chỉ ở `aria-label` |

## 4. Main flow

1. Trẻ chơi xong bước cuối của một bài. Trang bài gọi `progress`.
2. Server đóng lượt (`markCompleted` của `child-lesson-flow.ts`). **Cùng transaction** đó, server
   trao một sticker cho đúng lượt vừa đóng (`BR-STK-01`):
   1. chọn chủ đề của bài theo `BR-STK-04`;
   2. chọn sticker trong chủ đề theo `BR-STK-05`;
   3. ghi một hàng `child_stickers`, chụp `emoji` và `label` của sticker (`BR-STK-02`).
3. `progress` trả `just_completed: true` kèm `sticker: { theme_code, emoji, label }`.
4. Màn thưởng hiện sao, Gấu Con `celebrate` và sticker vừa nhận.
5. Ở sảnh, trẻ bấm icon sticker để mở `/play/stickers`. Trang gọi `GET /api/users/play/stickers`
   và hiện sticker đã có, gom theo chủ đề.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Gọi `progress` lần nữa sau khi đóng | Lượt đã `completed` | Mở lượt mới như `child-lesson-flow.md` §5. `sticker = null`, không trao thêm |
| Hai yêu cầu đóng lượt song song | Cùng một lượt | Chỉ một yêu cầu đóng được lượt (`UPDATE … WHERE status = 'in_progress'`), nên chỉ một sticker. Unique `(child_profile_id, child_lesson_play_id)` chặn lớp thứ hai |
| Lượt chưa xong | `just_completed: false` | `sticker = null`. Không trao gì |
| Chủ đề đã đủ mọi sticker | Trẻ có hết sticker của chủ đề đó | Trao lại theo vòng (`BR-STK-05`). Album vẫn hiện mỗi sticker một lần |
| Bài không có chủ đề hợp lệ | Không level nào của bài mang `theme_id` thuộc registry | Chọn chủ đề tất định từ mã bài (`BR-STK-04`) |
| Bài bị xoá | Hàng `lessons` bị xoá, kéo theo `child_lesson_plays` | Sticker ở lại, `child_lesson_play_id` thành `null` (`BR-STK-02`) |
| Album trống | Trẻ chưa xong bài nào | Trang hiện Gấu Con, không chữ, không ô trống |
| Cookie trẻ không thuộc user | `requireOwnedActiveChild` từ chối | `NO_ACTIVE_CHILD`, không lộ album của trẻ khác (`BR-STK-07`) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-STK-01` | Mỗi lượt học **đóng thành công** trao **đúng một** sticker, trong cùng transaction với việc đóng lượt. Unique `(child_profile_id, child_lesson_play_id)`; gọi lại không trao thêm. Client không có đường xin sticker | Phần thưởng gắn với việc học đã xong, do server tự suy (`BR-CLF-03`). Trao hai lần hay trao khi chưa xong làm sticker mất nghĩa |
| `BR-STK-02` | Sticker **không bao giờ mất**: bảng chỉ INSERT, không route nào sửa hay xoá. Hàng chụp `emoji` và `label` lúc trao, nên đổi danh mục không đổi sticker đã có. Xoá bài thì `child_lesson_play_id` thành `null`, sticker ở lại. Chỉ xoá hồ sơ trẻ mới xoá sticker | Cùng lý do `BR-PRG-04`: phần thưởng mất đi đọc thành trừng phạt |
| `BR-STK-03` | Sticker **không phải tiền tệ**: không tiêu, không đổi, không mua, không chuỗi ngày, không hạn giờ. Album không hiện số đếm, phần trăm, ô trống hay "còn thiếu" | `BR-PRG-02`, `BR-PRG-07`; huy hiệu cấm có bảng để "săn" (`progress-and-mastery.md` §7.2) |
| `BR-STK-04` | Chủ đề của sticker là chủ đề **xuất hiện nhiều nhất** trong `game_levels.theme_id` của các bước `game` đã chụp, chỉ tính giá trị thuộc registry (`CONTENT_THEMES`). Hoà thì lấy chủ đề gặp trước theo thứ tự bước. Không có giá trị hợp lệ thì chọn tất định từ mã bài trong các chủ đề `age_floor = 3` | Sticker hợp với bài trẻ vừa học. `lessons` chưa có tag trục `theme` (đo 2026-10-03: 0 hàng `content_tag_map` loại `lesson`), còn `theme_id` của level phủ toàn corpus |
| `BR-STK-05` | Danh mục sticker của một chủ đề là `nouns` của chủ đề đó trong `CONTENT_THEMES`, theo thứ tự khai. Trao sticker **đầu tiên trẻ chưa có**; có đủ rồi thì trao `nouns[số sticker đã có trong chủ đề mod số noun]` | `BR-CTR-12` — một nguồn sự thật cho vốn từ chủ đề. Thứ tự tất định để test được, và mỗi bài đầu tiên của một chủ đề luôn cho sticker mới |
| `BR-STK-06` | Bề mặt trẻ đi bằng icon: sticker là emoji lớn, tên sticker và chủ đề chỉ ở `aria-label`. Trang album không có liên kết rời trang; thoát **chỉ** qua khoá phụ huynh nhấn giữ | `BR-ENG-10`, `BR-CLF-05`, `BR-PGT-01` |
| `BR-STK-07` | Album chỉ của **trẻ đang hoạt động**, thuộc đúng user. Không API nào trả sticker của trẻ khác hay gộp nhiều trẻ | `BR-FBK-08`, `BR-PRG-05` — không so sánh giữa trẻ, kể cả trong cùng tài khoản |
| `BR-STK-08` | Màn thưởng cuối bài hiện sticker vừa trao cùng sao và Gấu Con `celebrate`. Sticker chỉ hiện ở lần gọi đóng lượt (`just_completed`) | `BR-CLF-08`, `BR-FBK-04` — ăn mừng lớn chỉ khi hoàn thành |

## 7. Data

**Đọc:** `child_lesson_plays`, `game_levels`, `child_profiles`, `CONTENT_THEMES`
(`packages/shared/src/constants/content-themes.ts`).
**Ghi:** `child_stickers` (chỉ INSERT).

### 7.1 `child_stickers`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigint identity | PK |
| `child_profile_id` | bigint | FK `child_profiles`, cascade khi xoá trẻ |
| `child_lesson_play_id` | bigint | FK `child_lesson_plays`, `SET NULL` khi lượt bị xoá (`BR-STK-02`) |
| `theme_code` | varchar(30) | mã chủ đề trong registry lúc trao |
| `emoji` | varchar(16) | chụp lúc trao |
| `label` | varchar(100) | tên tiếng Việt, chụp lúc trao — chỉ dùng cho `aria-label` |
| `awarded_at` | timestamptz | mặc định `now()` |

Unique `(child_profile_id, child_lesson_play_id)` (`BR-STK-01`). Index `child_profile_id`.

### 7.2 Album

Album gom theo `theme_code`, mỗi `(theme_code, emoji)` một lần. Chủ đề xếp theo lần đầu trẻ nhận
sticker của chủ đề đó; sticker trong chủ đề cũng theo lần đầu nhận. Mỗi chủ đề mang
`icon_emoji` của registry; chủ đề không còn trong registry thì dùng emoji của sticker đầu tiên.

## 8. API contract

### `POST /api/users/play/lessons/{code}/progress` (bổ sung)

| | |
|---|---|
| 2xx | Như `child-lesson-flow.md` §8, thêm `sticker: { theme_code, emoji, label } \| null` — khác `null` **chỉ** khi `just_completed: true` |

### `GET /api/users/play/stickers`

| | |
|---|---|
| Auth | Phiên user + cookie `active_child_id` thuộc user |
| Query | `theme` tuỳ chọn — mã chủ đề trong registry, lọc album về một chủ đề |
| 2xx | `200 { themes: [{ theme_code, icon_emoji, stickers: [{ emoji, label }] }] }` |
| 4xx | `NO_ACTIVE_CHILD` — chưa chọn hồ sơ trẻ hoặc hồ sơ không thuộc user · `VALIDATION_FAILED` — `theme` không thuộc registry |

## 9. Acceptance criteria

```gherkin
Scenario: BR-STK-01 — xong bài thì nhận đúng một sticker
  Given trẻ đã xong mọi bước của một bài
  When trang gọi progress
  Then just_completed = true và sticker khác null
  And child_stickers có đúng một hàng cho lượt đó
  When trang gọi progress lần nữa
  Then sticker = null và vẫn chỉ một hàng cho lượt cũ

Scenario: BR-STK-01 — chưa xong thì không có sticker (ca âm)
  Given trẻ mới mở bài
  When trang gọi progress
  Then sticker = null và child_stickers không có hàng nào của trẻ

Scenario: BR-STK-04 — chủ đề theo level của bài
  Given hai level của bài mang theme_id "farm"
  When trẻ xong bài
  Then sticker.theme_code = "farm"

Scenario: BR-STK-05 — bài thứ hai cùng chủ đề cho sticker mới
  Given trẻ đã có sticker đầu tiên của "farm"
  When trẻ xong thêm một bài chủ đề "farm"
  Then sticker mới khác sticker đã có

Scenario: BR-STK-07 — không xem được album của trẻ khác (ca âm)
  Given cookie trỏ hồ sơ trẻ của user khác
  When gọi GET /api/users/play/stickers
  Then lỗi NO_ACTIVE_CHILD

Scenario: BR-STK-03 — album không có số đếm hay ô trống
  Given trẻ có hai sticker
  When mở /play/stickers
  Then trang hiện đúng hai sticker, không chữ số, không ô trống

Scenario: BR-STK-06 — album chỉ thoát bằng khoá phụ huynh
  When mở /play/stickers
  Then trang không có liên kết rời trang nào và có khoá phụ huynh
```

## 10. Boundaries

**Always**
- Trao sticker ở server, cùng transaction với việc đóng lượt.
- Chụp emoji và tên sticker vào hàng lúc trao.
- Chữ trên bề mặt trẻ chỉ nằm ở `aria-label`.

**Ask first**
- Trao sticker cho việc khác ngoài xong bài (chơi level rời, bài làm quen).
- Thêm sticker không lấy từ `nouns` của registry (sticker vẽ riêng, sticker theo mùa).
- Cho người lớn xem album ở bề mặt phụ huynh.

**Never**
- Xoá, thu hồi hay làm hết hạn sticker.
- Biến sticker thành tiền tệ: tiêu, đổi, mua, chuỗi ngày, đếm ngược.
- Hiện số đếm, ô trống hay so sánh giữa trẻ trên album.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Khi `lessons` có tag trục `theme` thật, tag của bài có thắng `theme_id` của level không? | `BR-STK-04` | P4 | người quyết — khi có tag bài |
| 2 | Sticker có nên là hình vẽ riêng thay vì emoji hệ thống (emoji khác nhau giữa các máy)? | Mỹ thuật album | P5 | người quyết |
| 3 | Người lớn có cần xem album của từng trẻ ở bề mặt phụ huynh không? | Bề mặt phụ huynh | P5 | người quyết |
