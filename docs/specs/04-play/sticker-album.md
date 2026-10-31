---
spec: STICKER-ALBUM
title: Album sticker — phần thưởng sưu tập khi trẻ chơi xong một màn chơi
area: play
status: implemented
mvp: false
phase: P4
reviewed: 2026-10-03
owns:
  - Việc trao sticker khi một phiên chơi của trẻ hoàn thành (`child_stickers`)
  - Danh mục sticker theo chủ đề và cách chọn chủ đề, chọn sticker
  - Trang album sticker của trẻ (`/play/stickers`)
depends_on:
  - PLAY-SESSION-LIFECYCLE
  - FEEDBACK-AND-CELEBRATION
  - PROGRESS-AND-MASTERY
  - CONTENT-THEME-REGISTRY
  - PARENT-GATE
---

# Album sticker — phần thưởng sưu tập khi trẻ chơi xong một màn chơi

## 1. Objective

Mỗi phiên chơi kết thúc bằng màn thưởng: Gấu Con ăn mừng, sao, lời khen. Màn thưởng đó biến mất khi
trẻ rời trang, nên trẻ không có gì để **giữ lại** từ màn chơi đã hoàn thành.

Spec này thêm một phần thưởng giữ được: mỗi phiên chơi hoàn thành cho trẻ **một sticker** theo chủ đề
của màn chơi, dán vào album riêng của trẻ. Người quyết chốt 2026-10-03 (#282): phần thưởng là **sao và
sticker sưu tập**. Không xu, không chuỗi ngày, không mất sticker, không so sánh giữa các trẻ.

Album là **kỷ niệm**, giống huy hiệu ở [`progress-and-mastery.md`](progress-and-mastery.md) §7.2.
Nó không phải bảng để "săn": trẻ chỉ thấy sticker mình đã có, không thấy ô trống hay con số.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động (cookie `active_child_id`) của user đã đăng nhập | Nhận sticker khi xong màn chơi, xem album của mình |
| Người lớn | Cổng phụ huynh | Rời trang album |
| Server | — | Trao sticker khi hoàn thành phiên chơi. Client không tự xin sticker |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `POST /api/users/play/sessions/{id}/complete` | Trẻ | Hoàn thành phiên chơi trả thêm `sticker` vừa trao |
| Màn thưởng của `/play/{code}` | Trẻ | `KidVictoryModal` hiện sticker vừa nhận |
| `GET /api/users/play/stickers` | Trẻ | Album của trẻ đang hoạt động |
| `/play/stickers` | Trẻ | Trang album, layout `kid` |
| Nút sticker ở sảnh `/play` | Trẻ | Icon vào album, chữ chỉ ở `aria-label` |

## 4. Main flow

1. Trẻ hoàn thành màn chơi. Trang gọi endpoint hoàn thành phiên chơi (`play_sessions`).
2. Server đóng phiên chơi (`completion_status = 'completed'`). **Cùng transaction** đó, server
   trao một sticker cho đúng phiên vừa hoàn thành (`BR-STK-01`):
   1. chọn chủ đề của màn chơi theo `BR-STK-04`;
   2. chọn sticker trong chủ đề theo `BR-STK-05`;
   3. ghi một hàng `child_stickers`, chụp `emoji` và `label` của sticker (`BR-STK-02`).
3. Phản hồi hoàn thành phiên trả kèm `sticker: { theme_code, emoji, label }`.
4. Màn thưởng hiện sao, Gấu Con `celebrate` và sticker vừa nhận.
5. Ở sảnh, trẻ bấm icon sticker để mở `/play/stickers`. Trang gọi `GET /api/users/play/stickers`
   và hiện sticker đã có, gom theo chủ đề.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Gọi hoàn thành lần nữa sau khi đóng | Phiên đã `completed` | Không trao thêm sticker (`BR-STK-01`) |
| Hai yêu cầu đóng phiên song song | Cùng một phiên | Chỉ một yêu cầu đóng được phiên (`UPDATE … WHERE completion_status = 'in_progress'`), nên chỉ một sticker. Unique `(child_profile_id, play_session_id)` chặn lớp thứ hai |
| Phiên chưa xong | `completion_status != 'completed'` | `sticker = null`. Không trao gì |
| Chủ đề đã đủ mọi sticker | Trẻ có hết sticker của chủ đề đó | Trao lại theo vòng (`BR-STK-05`). Album vẫn hiện mỗi sticker một lần |
| Màn chơi không có chủ đề hợp lệ | `theme_id` của màn chơi không thuộc registry | Chọn chủ đề tất định từ mã màn chơi (`BR-STK-04`) |
| Phiên chơi bị xoá | Hàng `play_sessions` bị xoá | Sticker ở lại, `play_session_id` thành `null` (`BR-STK-02`) |
| Album trống | Trẻ chưa hoàn thành màn chơi nào | Trang hiện Gấu Con, không chữ, không ô trống |
| Cookie trẻ không thuộc user | `requireOwnedActiveChild` từ chối | `NO_ACTIVE_CHILD`, không lộ album của trẻ khác (`BR-STK-07`) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-STK-01` | Mỗi phiên chơi **hoàn thành thành công** trao **đúng một** sticker, trong cùng transaction với việc đóng phiên. Unique `(child_profile_id, play_session_id)`; gọi lại không trao thêm. Client không có đường xin sticker | Phần thưởng gắn với phiên chơi đã xong, do server tự suy. Trao hai lần hay trao khi chưa xong làm sticker mất nghĩa |
| `BR-STK-02` | Sticker **không bao giờ mất**: bảng chỉ INSERT, không route nào sửa hay xoá. Hàng chụp `emoji` và `label` lúc trao, nên đổi danh mục không đổi sticker đã có. Xoá phiên chơi thì `play_session_id` thành `null`, sticker ở lại. Chỉ xoá hồ sơ trẻ mới xoá sticker | Cùng lý do `BR-PRG-04`: phần thưởng mất đi đọc thành trừng phạt |
| `BR-STK-03` | Sticker **không phải tiền tệ**: không tiêu, không đổi, không mua, không chuỗi ngày, không hạn giờ. Album không hiện số đếm, phần trăm, ô trống hay "còn thiếu" | `BR-PRG-02`, `BR-PRG-07`; huy hiệu cấm có bảng để "săn" (`progress-and-mastery.md` §7.2) |
| `BR-STK-04` | Chủ đề của sticker lấy từ `game_levels.theme_id` của màn chơi vừa hoàn thành, chỉ tính giá trị thuộc registry (`CONTENT_THEMES`). Không có giá trị hợp lệ thì chọn tất định từ mã màn chơi trong các chủ đề `age_floor = 3` | Sticker hợp với màn chơi trẻ vừa hoàn thành |
| `BR-STK-05` | Danh mục sticker của một chủ đề là `nouns` của chủ đề đó trong `CONTENT_THEMES`, theo thứ tự khai. Trao sticker **đầu tiên trẻ chưa có**; có đủ rồi thì trao `nouns[số sticker đã có trong chủ đề mod số noun]` | `BR-CTR-12` — một nguồn sự thật cho vốn từ chủ đề. Thứ tự tất định để test được, và mỗi màn chơi đầu tiên của một chủ đề luôn cho sticker mới |
| `BR-STK-06` | Bề mặt trẻ đi bằng icon: sticker là emoji lớn, tên sticker và chủ đề chỉ ở `aria-label`. Trang album không có liên kết rời trang; thoát **chỉ** qua khoá phụ huynh nhấn giữ. Tiêu đề nhóm chủ đề **không** là emoji hay ô nào (dải màu trang trí), để số ô trên màn bằng đúng số sticker | `BR-ENG-10`, `BR-PGT-01` |
| `BR-STK-07` | Album chỉ của **trẻ đang hoạt động**, thuộc đúng user. Không API nào trả sticker của trẻ khác hay gộp nhiều trẻ | `BR-FBK-08`, `BR-PRG-05` — không so sánh giữa trẻ, kể cả trong cùng tài khoản |
| `BR-STK-08` | Màn thưởng cuối màn chơi hiện sticker vừa trao cùng sao và Gấu Con `celebrate`. Sticker chỉ hiện ở lần gọi đóng phiên | `BR-FBK-04` — ăn mừng lớn chỉ khi hoàn thành |

## 7. Data

**Đọc:** `play_sessions`, `game_levels`, `child_profiles`, `CONTENT_THEMES`
(`packages/shared/src/constants/content-themes.ts`).
**Ghi:** `child_stickers` (chỉ INSERT).

### 7.1 `child_stickers`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigint identity | PK |
| `child_profile_id` | bigint | FK `child_profiles`, cascade khi xoá trẻ |
| `play_session_id` | bigint | FK `play_sessions`, `SET NULL` khi phiên bị xoá (`BR-STK-02`) |
| `theme_code` | varchar(30) | mã chủ đề trong registry lúc trao |
| `emoji` | varchar(16) | chụp lúc trao |
| `label` | varchar(100) | tên tiếng Việt, chụp lúc trao — chỉ dùng cho `aria-label` |
| `awarded_at` | timestamptz | mặc định `now()` |

Unique `(child_profile_id, play_session_id)` (`BR-STK-01`). Index `child_profile_id`.

### 7.2 Album

Album gom theo `theme_code`, mỗi `(theme_code, emoji)` một lần. Chủ đề xếp theo lần đầu trẻ nhận
sticker của chủ đề đó; sticker trong chủ đề cũng theo lần đầu nhận. Mỗi chủ đề mang
`icon_emoji` của registry; chủ đề không còn trong registry thì dùng emoji của sticker đầu tiên.

## 8. API contract

### `POST /api/users/play/sessions/{id}/complete` (bổ sung)

| | |
|---|---|
| 2xx | Thêm `sticker: { theme_code, emoji, label } \| null` khi đóng phiên cho hồ sơ trẻ đang hoạt động |

### `GET /api/users/play/stickers`

| | |
|---|---|
| Auth | Phiên user + cookie `active_child_id` thuộc user |
| Query | `theme` tuỳ chọn — mã chủ đề trong registry, lọc album về một chủ đề |
| 2xx | `200 { themes: [{ theme_code, icon_emoji, stickers: [{ emoji, label }] }] }` |
| 4xx | `NO_ACTIVE_CHILD` — chưa chọn hồ sơ trẻ hoặc hồ sơ không thuộc user · `VALIDATION_FAILED` — `theme` không thuộc registry |

## 9. Acceptance criteria

```gherkin
Scenario: BR-STK-01 — hoàn thành phiên chơi thì nhận đúng một sticker
  Given trẻ đã hoàn thành một phiên chơi
  When trang gọi complete
  Then sticker khác null
  And child_stickers có đúng một hàng cho phiên đó

Scenario: BR-STK-01 — chưa xong thì không có sticker (ca âm)
  Given trẻ mới mở phiên chơi
  Then child_stickers không có hàng nào cho phiên đó

Scenario: BR-STK-04 — chủ đề theo màn chơi
  Given màn chơi mang theme_id "farm"
  When trẻ hoàn thành phiên chơi
  Then sticker.theme_code = "farm"

Scenario: BR-STK-05 — màn chơi thứ hai cùng chủ đề cho sticker mới
  Given trẻ đã có sticker đầu tiên của "farm"
  When trẻ hoàn thành thêm một màn chơi chủ đề "farm"
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
- Trao sticker ở server, cùng transaction với việc đóng phiên.
- Chụp emoji và tên sticker vào hàng lúc trao.
- Chữ trên bề mặt trẻ chỉ nằm ở `aria-label`.

**Ask first**
- Thêm sticker không lấy từ `nouns` của registry (sticker vẽ riêng, sticker theo mùa).
- Cho người lớn xem album ở bề mặt phụ huynh.

**Never**
- Xoá, thu hồi hay làm hết hạn sticker.
- Biến sticker thành tiền tệ: tiêu, đổi, mua, chuỗi ngày, đếm ngược.
- Hiện số đếm, ô trống hay so sánh giữa trẻ trên album.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Sticker có nên là hình vẽ riêng thay vì emoji hệ thống (emoji khác nhau giữa các máy)? | Mỹ thuật album | P5 | người quyết |
| 2 | Người lớn có cần xem album của từng trẻ ở bề mặt phụ huynh không? | Bề mặt phụ huynh | P5 | người quyết |
