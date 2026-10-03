---
spec: CHILD-LESSON-FLOW
title: Trẻ tự học một bài — làm quen, chuỗi trò chơi, phần thưởng
area: play
status: approved
mvp: false
phase: P4
reviewed: 2026-10-03
owns:
  - Khuôn một bài học trên bề mặt trẻ (làm quen → trò chơi → thưởng)
  - Lượt học của trẻ (`child_lesson_plays`) và cách suy bước hiện tại
depends_on:
  - LESSON-FLOW-MODEL
  - CONCEPT-INTRO-GATE
  - PLAY-SESSION-LIFECYCLE
  - FEEDBACK-AND-CELEBRATION
  - PARENT-GATE
---

# Trẻ tự học một bài — làm quen, chuỗi trò chơi, phần thưởng

## 1. Objective

Hôm nay `lessons` chỉ có đường chạy cho người lớn dẫn ([`lesson-session-runner.md`](lesson-session-runner.md)).
Trẻ ở nhà thì chơi từng level rời, không có khuôn bài. Các app mầm non trẻ quen dùng (tham chiếu
KidsUP Pro) đều theo một nhịp: bài 5–7 phút, mở bằng thẻ làm quen, luyện bằng vài trò chơi, kết
bằng phần thưởng.

Spec này dựng đúng nhịp đó từ dữ liệu có sẵn: `lessons → lesson_activities → activities(game_level)`,
cùng bài làm quen GT-000 của [`concept-intro-gate.md`](concept-intro-gate.md). Không cần player mới,
vì mỗi bước là một lượt chơi level bình thường.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động (cookie `active_child_id`) của user đã đăng nhập | Đi qua các bước của một bài, nhận thưởng cuối bài |
| Người lớn | Cổng phụ huynh | Thoát khỏi bài giữa chừng |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/play/lesson/{code}` | Trẻ | Trang bài: hạt tiến độ, mascot, nút ▶ vào bước kế |
| `/play/{levelCode}?lesson={code}` | Trẻ | Trang chơi level; xong thì quay về trang bài |
| `POST /api/users/play/lessons/{code}/progress` | Trẻ | Mở hoặc tiếp lượt học, trả trạng thái từng bước |
| `GET /api/users/play/lessons` | Trẻ | Danh sách bài gợi ý cho sảnh trẻ |

## 4. Main flow

1. Trẻ chọn một bài ở sảnh, hoặc từ curriculum player.
2. Trang bài gọi `progress`. Chưa có lượt `in_progress` của (trẻ, bài) thì server tạo lượt mới và
   **chụp kế hoạch bước** vào lượt đó. Kế hoạch gồm:
   - các level của `lesson_activities` theo `position`, chỉ lấy hoạt động `digital_game` trỏ tới level `published`;
   - trước mỗi level, bài làm quen GT-000 mà `checkLevelIntroRequired` đòi (`BR-CIG`), mỗi bài làm quen
     xuất hiện nhiều nhất một lần.
3. Server suy bước nào đã xong (`BR-CLF-03`) và trả bước hiện tại.
4. Trẻ bấm ▶, sang `/play/{levelCode}?lesson={code}`. Chơi xong, nút tiếp của màn tổng kết đưa về trang bài.
5. Trang bài gọi lại `progress`. Mọi bước đã xong thì server đóng lượt (`completed`) và trả
   `just_completed: true`. Trang hiện màn thưởng: mascot `celebrate`, sao, lời khen đọc thành tiếng.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Thoát giữa chừng | Trẻ qua cổng phụ huynh để ra ngoài | Lượt giữ `in_progress`. Lần sau vào lại, tiếp đúng bước chưa xong đầu tiên |
| Bài đổi version | Lesson publish version mới khi lượt đang dở | Lượt giữ kế hoạch đã chụp (`BR-CLF-02`) |
| Bước bị khoá bậc | Level của bước vượt bậc quyền | Bước hiện dạng khoá và **không chặn** hoàn thành bài (giống `BR-CUR-05`). Lời mời nâng cấp chỉ ở bề mặt người lớn |
| Bài không có level chơi được | Không hoạt động nào trỏ tới level `published` | `progress` trả `NOT_FOUND` — bài không có đường cho trẻ |
| Mở lại bài đã xong | Lượt gần nhất `completed` | Tạo lượt mới. Tiến độ cũ vẫn giữ trong bảng |
| Tuổi trẻ ngoài khoảng của bài | `target_age_*` không phủ tuổi trẻ | Vẫn chơi được: tuổi là gợi ý, không chặn (`BR-LFM-02`). Chỉ danh sách gợi ý dùng tuổi để xếp |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CLF-01` | Thứ tự bước cố định: làm quen (nếu cổng đòi) → level theo `position` → thưởng. Trẻ không chọn bước | Sư phạm là thứ tự có chủ đích — cùng lý do `BR-CUR-01` |
| `BR-CLF-02` | Kế hoạch bước được **chụp một lần** khi mở lượt và không đổi trong lượt | Bước làm quen biến mất khi đã xong; tính lại mỗi lần thì hạt tiến độ co giãn và trẻ mất chỗ |
| `BR-CLF-03` | Bước "xong" **chỉ** suy từ `play_sessions` của chính trẻ, `completion_status = 'completed'`, không preview. Level chơi phải xong sau `started_at` của lượt; bài làm quen thì xong lúc nào cũng tính. Client không gửi "đã xong bước N" | Tiến độ phải dựa trên dữ liệu server tự ghi, không dựa vào query string |
| `BR-CLF-04` | Mỗi (trẻ, bài) có nhiều nhất **một** lượt `in_progress` | Hai lượt dở song song làm "tiếp tục" mơ hồ |
| `BR-CLF-05` | Thoát giữa bài **chỉ** qua cổng phụ huynh; trang bài không có liên kết rời trang nào khác | `BR-PSZ-11`, `BR-PGT-01` |
| `BR-CLF-06` | Trang bài không dựa vào chữ: tiến độ là hạt, nút vào bước là icon ▶, nhãn chữ chỉ ở `aria-label` | `BR-ENG-10` — trẻ 3–6 chưa đọc |
| `BR-CLF-07` | Tuổi chỉ dùng để **xếp** danh sách gợi ý, không chặn bài nào | `BR-LFM-02` |
| `BR-CLF-08` | Bài xong thì có màn thưởng: mascot `celebrate`, lời khen §7.2 của `feedback-and-celebration.md` đọc thành tiếng. Không điểm, không so sánh | `BR-FBK-04`, `BR-FBK-08`, `BR-FBK-12` |

## 7. Data

**Đọc:** `lessons`, `lesson_activities`, `activities`, `game_levels`, `play_sessions`, `child_profiles`.
**Ghi:** `child_lesson_plays`.

### 7.1 `child_lesson_plays`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigint identity | PK |
| `uuid` | uuid | unique, mặc định ngẫu nhiên |
| `child_profile_id` | bigint | FK `child_profiles`, cascade khi xoá trẻ |
| `lesson_id` | bigint | FK `lessons` — đúng hàng version đã chụp |
| `content_version` | integer | version bài lúc mở lượt |
| `status` | varchar(20) | `in_progress` \| `completed` |
| `steps` | jsonb | mảng `{ kind: "intro" \| "game", level_code }` đã chụp (`BR-CLF-02`) |
| `started_at` | timestamptz | mặc định `now()` |
| `completed_at` | timestamptz | null tới khi xong |

Unique một phần: `(child_profile_id, lesson_id) WHERE status = 'in_progress'` (`BR-CLF-04`).

## 8. API contract

### `POST /api/users/play/lessons/{code}/progress`

| | |
|---|---|
| Auth | Phiên user + cookie `active_child_id` thuộc user |
| Body | Không có |
| 2xx | `200 { lesson: { code, title }, play_uuid, steps: [{ index, kind, level_code, title, thumbnail_emoji, done, locked }], current_step, status, just_completed }` — `current_step` là `null` khi mọi bước đã xong |
| 4xx | `NO_ACTIVE_CHILD` — chưa chọn hồ sơ trẻ · `NOT_FOUND` — mã bài sai, bài chưa publish, hoặc bài không có level chơi được |

### `GET /api/users/play/lessons`

| | |
|---|---|
| Auth | Như trên |
| Query | `limit` 1–12, mặc định 6 |
| 2xx | `200 [{ code, title, estimated_minutes, in_progress, fits_age }]`: bài đang dở xếp trước, rồi tới bài hợp tuổi |
| 4xx | `NO_ACTIVE_CHILD` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-CLF-01 — thứ tự bước theo position, làm quen đứng trước
  Given bài có hai hoạt động level ở position 2 và 1
  And level ở position 1 cần bài làm quen chưa xong
  When trẻ mở bài
  Then bước 0 là bài làm quen, bước 1 là level position 1, bước 2 là level position 2

Scenario: BR-CLF-02 — kế hoạch không co lại khi làm quen xong
  Given trẻ đã mở bài và kế hoạch có một bước làm quen
  When trẻ chơi xong bài làm quen rồi gọi lại progress
  Then số bước không đổi và bước làm quen có done = true

Scenario: BR-CLF-03 — level chơi trước khi mở lượt không tính
  Given trẻ đã chơi xong level của bước 1 từ hôm qua
  When trẻ mở lượt mới hôm nay
  Then bước 1 có done = false

Scenario: BR-CLF-04 — vào lại thì tiếp đúng bước
  Given trẻ xong bước 0 rồi thoát
  When trẻ mở lại bài
  Then cùng play_uuid và current_step = 1

Scenario: BR-CLF-08 — xong mọi bước thì đóng lượt một lần
  Given mọi bước đã xong
  When trang gọi progress
  Then status = completed và just_completed = true
  When trang gọi progress lần nữa
  Then một lượt mới được mở

Scenario: BR-CLF-07 — bài ngoài tuổi vẫn mở được
  Given trẻ 3 tuổi và bài có target_age_min = 5
  When trẻ mở bài
  Then progress trả 200
```

## 10. Boundaries

**Always**
- Chụp kế hoạch bước khi mở lượt.
- Suy tiến độ từ `play_sessions` của server.
- Thoát chỉ qua cổng phụ huynh.

**Ask first**
- Thêm loại bước không phải level (video, truyện).
- Thêm phần thưởng tích luỹ khác ngoài sticker. Sticker cuối bài: [`sticker-album.md`](sticker-album.md) (Task #282).

**Never**
- Nhận "đã xong bước" từ client.
- Chặn bài theo tuổi.
- Hiện điểm số hay so sánh trên màn thưởng.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Lượt dở quá lâu (vd. 7 ngày như `BR-LSR-11`) có tự bỏ không? | Danh sách "đang dở" ở sảnh | P4 | hoãn — khi có số đo lượt dở thật |
| 2 | Khách (guest) có được học theo bài không? Hiện chỉ user có hồ sơ trẻ | Bề mặt khách | P5 | người quyết |
