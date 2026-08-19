---
spec: LESSON-SESSION-RUNNER
title: Chạy một tiết học — bề mặt của người dạy
area: play
status: implemented
mvp: false
phase: P4
reviewed: 2026-08-17
owns:
  - Luồng người dạy chạy một tiết học
  - Quy tắc chuyển giữa hoạt động ngoài màn hình và game level
depends_on:
  - LESSON-MODEL
  - ACTIVITY-MODEL
  - PLAY-SESSION-LIFECYCLE
  - CHILD-DATA-COMPLIANCE
---

# Chạy một tiết học — bề mặt của người dạy

## 1. Objective

[`lesson-model.md`](../05-content/lesson-model.md) sở hữu ràng buộc biên tập của một lesson.
[`lesson-authoring.md`](../06-admin/lesson-authoring.md) sở hữu luồng soạn nó. Không spec nào sở hữu luồng **chạy** nó.

Hệ quả: hôm nay một lesson là văn bản. Người lớn phải tự đọc, tự nhớ mình đang ở phần nào,
tự chuyển sang màn chơi rồi tự quay lại. Phần lớn giá trị của lesson nằm ở hoạt động ngoài
màn hình (`BR-LSM-02`), và đúng phần đó là phần không có gì đỡ.

File này sở hữu bề mặt chạy tiết học: một bước tại một thời điểm, người dạy giữ nhịp, phần
ngoài màn hình được đỡ ngang phần trên màn hình, và phần đánh giá thu được thành dữ liệu
quan sát chứ không thành văn bản tự do về đứa trẻ.

Đây là bề mặt của **người lớn**. Trẻ nhìn thấy nó chỉ trong lúc một activity kiểu game level
đang chạy.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người dạy | `requireUserAuth()` cộng một child profile đang chọn | Mở lesson, chuyển bước, ghi quan sát, dừng giữa chừng, kết thúc |
| Trẻ | không có tài khoản | Chơi phần game level. Không thấy đồng hồ, không thấy điểm |
| Engine | — | Nhận bàn giao cho activity kiểu game level, trả quyền điều khiển khi xong |
| Server | — | Giữ trạng thái lượt chạy để mở lại đúng chỗ |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/lessons/{code}/run` | Người dạy | Bề mặt chính |
| `/lessons/{code}` | Người dạy | Trang xem trước, có nút bắt đầu |
| [`curriculum-player.md`](curriculum-player.md) | Người dạy | Một `curriculum_item` trỏ tới lesson mở thẳng vào đây |

## 4. Main flow

1. Người dạy mở `/lessons/{code}/run` với một child profile đang chọn.
2. Server mở một lượt chạy, trả về lesson đã publish cùng thứ tự activity.
3. Bề mặt hiện **màn chuẩn bị**: một câu mục tiêu, danh sách vật liệu, câu mở đầu để nói với
   bé — đúng năm câu mà `BR-LSM-03` bắt `guide` phải trả lời.
4. Người dạy bấm bắt đầu. Bề mặt hiện **một bước tại một thời điểm**.
5. Bước ngoài màn hình: hiện hướng dẫn cho người lớn, cộng hai nhánh "nếu bé làm được ngay"
   và "nếu bé chưa làm được". Không đồng hồ đếm ngược. Người dạy bấm xong khi xong.
6. Bước game level: bàn giao cho engine theo [`play-session-lifecycle.md`](play-session-lifecycle.md). Xong màn chơi thì
   quyền điều khiển quay lại bề mặt này.
7. Bước đúc kết: hiện câu hỏi đúc kết cho người dạy hỏi bé.
8. Màn đánh giá: hiện các mô tả hành vi quan sát được của lesson. Người dạy tick từng mô tả
   theo ba mức ở §7.2.
9. Kết thúc: bề mặt hiện phần mở rộng nếu lesson có, và ghi lượt chạy là đã xong.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Đóng giữa chừng | Trẻ mệt, có việc | Lượt chạy giữ nguyên bước đang dở. Mở lại vào đúng bước đó |
| Mở lại sau 7 ngày | Bỏ lâu | Lượt chạy cũ đóng lại là bỏ dở. Mở lượt mới từ đầu |
| Bỏ qua một bước | Người dạy chủ động | Cho phép, đánh dấu bước là bỏ qua. Không chặn |
| Lesson bị archive giữa chừng | Nội dung đổi | Lượt đang chạy chạy tiếp bản đã ghim. Lượt mới trả `CONTENT_ARCHIVED` |
| Không có child profile đang chọn | Chưa chọn bé | 409 `NO_ACTIVE_CHILD` |
| Lesson thuộc tier chưa mở | Chưa mua gói | 403 `TIER_LOCKED` |
| Mất mạng giữa chừng | Chơi ở nhà | Bước ngoài màn hình chạy tiếp bình thường; tiến độ đẩy lên khi có mạng lại, theo [`offline-play.md`](../01-platform/offline-play.md) |
| Hết hạn mức chơi trong ngày | Đã chạm trần | Bước game level bị chặn với `DAILY_PLAY_CAP_REACHED`; các bước ngoài màn hình **vẫn chạy** |

Nhánh cuối là có chủ ý: hạn mức tồn tại để giới hạn thời gian màn hình, không phải để giới
hạn việc học.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LSR-01` | Bề mặt hiện **một bước tại một thời điểm** | Người dạy đang nhìn một đứa trẻ, không nhìn màn hình. Danh sách dài buộc họ tìm lại vị trí sau mỗi lần ngẩng lên |
| `BR-LSR-02` | **Người dạy giữ nhịp.** Không bước nào tự chuyển theo đồng hồ | Nhịp của một đứa trẻ ba tuổi không đoán trước được. Đồng hồ tự chuyển biến tiết học thành cuộc rượt đuổi |
| `BR-LSR-03` | Cấm — **NEVER** hiện đồng hồ đếm ngược hay điểm số ở nơi trẻ nhìn thấy | Giữ đúng `BR-ENG-11`. Một tiết học không được lách ràng buộc mà màn chơi phải theo |
| `BR-LSR-04` | Bước ngoài màn hình được đỡ **ngang** bước trên màn hình: có hướng dẫn, có hai nhánh xử lý, có nút xong | `BR-LSM-02` bắt lesson có hoạt động ngoài màn hình. Nếu bề mặt chỉ đỡ phần số thì phần bắt buộc kia thành phần bị bỏ |
| `BR-LSR-05` | Quan sát ghi bằng **danh sách đóng ba mức**, không có ô chữ tự do về đứa trẻ | [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) đóng danh sách field của trẻ. Ô chữ tự do là đường rò dữ liệu trẻ không kiểm soát được |
| `BR-LSR-06` | Mỗi mức quan sát gắn với một **mô tả hành vi quan sát được** của lesson, không phải một mức độ trừu tượng | `BR-LSM-06` đã ép điều này ở khâu biên tập. Bề mặt chạy phải giữ, nếu không thì ràng buộc kia vô nghĩa |
| `BR-LSR-07` | Lượt chạy **ghim** bản lesson tại thời điểm mở | Đổi nội dung giữa chừng làm người dạy đọc một bản, bé làm một bản khác |
| `BR-LSR-08` | Bỏ qua một bước **được phép** và không bị cảnh báo | Người dạy ở trong phòng, hệ thống thì không. `BR-LSM-09` đã coi phần mở rộng là tuỳ chọn; nguyên tắc đó áp cho cả nhịp chạy |
| `BR-LSR-09` | Hạn mức thời gian màn hình chỉ chặn bước game level, **không** chặn bước ngoài màn hình | Hạn mức nhắm vào màn hình. Chặn cả hoạt động với hạt đậu và chiếc cốc là hiểu sai mục đích của nó |
| `BR-LSR-10` | Cấm — **NEVER giả định trẻ đọc được chữ** ở bất kỳ màn nào trẻ nhìn thấy | `BR-LSM-07`. Bề mặt chạy là nơi dễ vi phạm nhất vì phần lớn chữ ở đây viết cho người lớn |
| `BR-LSR-11` | Lượt chạy dở quá 7 ngày thì đóng là bỏ dở, không nối tiếp | Một tiết học nối lại sau hai tuần không còn là một tiết học |

## 7. Data

**Đọc:** `lessons` bản đã publish · `lesson_activities` · `activities` · child profile đang chọn.
**Ghi:** `lesson_runs` · `lesson_run_steps` · `lesson_run_observations`.

### 7.1 `lesson_runs`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `uuid` | uuid | Định danh đối ngoại |
| `lesson_id` | bigint | FK, ghim theo `content_version` |
| `content_version` | int | Bản đã ghim, `BR-LSR-07` |
| `child_profile_id` | bigint | FK |
| `status` | enum | `in_progress` `completed` `abandoned` |
| `current_step` | int | Bước đang dở, để mở lại |
| `started_at` `ended_at` | timestamp | |

### 7.2 Ba mức quan sát

| Mức | Nghĩa | Ai đọc |
|---|---|---|
| `did_it` | Bé làm được, không cần đỡ | Báo cáo tiến bộ của người lớn |
| `with_help` | Bé làm được khi có người đỡ | Báo cáo tiến bộ của người lớn |
| `not_yet` | Bé chưa làm được hôm nay | Báo cáo tiến bộ của người lớn |

Ba mức, không phải thang điểm. Thang điểm mời gọi so sánh giữa các trẻ, và sản phẩm không
tồn tại để làm việc đó — xem [`pedagogical-evidence.md`](../08-quality/pedagogical-evidence.md) `BR-PED-01`.

`not_yet` chứ không phải `failed`: cùng một dữ liệu, khác một mặc định trong đầu người đọc.

### 7.3 Bước

| Field | Kiểu | Ghi chú |
|---|---|---|
| `step_index` | int | Thứ tự trong lesson |
| `activity_id` | bigint | FK, null với bước đúc kết |
| `kind` | enum | `warm_up` `off_screen` `digital_game` `reflection` `assessment` |
| `outcome` | enum | `done` `skipped` |

## 8. API contract

### `POST /api/users/lesson-runs`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Body | `{ lesson_code, child_profile_uuid }` |
| 201 | `{ run_uuid, lesson, steps, current_step }` |
| 403 | `TIER_LOCKED` — lesson thuộc tier chưa mở |
| 403 | `ENTITLEMENT_REQUIRED` — thiếu quyền sử dụng |
| 404 | `NOT_FOUND` — không có bản published của lesson |
| 409 | `NO_ACTIVE_CHILD` — chưa chọn child profile |
| 422 | `CONTENT_ARCHIVED` — lesson đã archive |

### `PATCH /api/users/lesson-runs/{run_uuid}`

| | |
|---|---|
| Auth | `requireUserAuth()` cộng sở hữu lượt chạy |
| Body | `{ step_index, outcome }` — `outcome` thuộc `done` hoặc `skipped` |
| 200 | `{ current_step, status }` |
| 409 | `SESSION_ALREADY_COMPLETED` — lượt chạy đã kết thúc |
| 422 | `VALIDATION_FAILED` — `step_index` không thuộc lesson |

### `POST /api/users/lesson-runs/{run_uuid}/observations`

| | |
|---|---|
| Auth | `requireUserAuth()` cộng sở hữu lượt chạy |
| Body | `{ objective_code, level }` — `level` thuộc `did_it`, `with_help`, `not_yet` |
| 201 | `{ recorded: true }` |
| 422 | `CHILD_FIELD_NOT_ALLOWED` — body mang field ngoài danh sách đóng |
| 422 | `VALIDATION_FAILED` — `level` ngoài ba giá trị |

### `POST /api/users/lesson-runs/{run_uuid}/complete`

| | |
|---|---|
| Auth | `requireUserAuth()` cộng sở hữu lượt chạy |
| 200 | `{ status: "completed", observations_count }` |
| 409 | `SESSION_ALREADY_COMPLETED` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-LSR-01 — một bước tại một thời điểm
  Given một lesson có 5 bước
  When người dạy mở bề mặt chạy
  Then màn hình hiện đúng một bước
  And không hiện nội dung của bước kế tiếp

Scenario: BR-LSR-02 — không bước nào tự chuyển
  Given người dạy đang ở bước hoạt động chính
  When để yên 10 phút không thao tác
  Then bề mặt vẫn ở đúng bước đó

Scenario: BR-LSR-03 — trẻ không thấy đồng hồ hay điểm
  When đọc mọi màn mà trẻ nhìn thấy trong lượt chạy
  Then không màn nào hiện đồng hồ đếm ngược
  And không màn nào hiện điểm số

Scenario: BR-LSR-04 — bước ngoài màn hình có đủ hai nhánh
  Given một bước kiểu off_screen
  When bề mặt hiện bước đó
  Then hiện hướng dẫn cho người lớn
  And hiện nhánh nếu bé làm được ngay
  And hiện nhánh nếu bé chưa làm được

Scenario: BR-LSR-05 — không có ô chữ tự do về trẻ
  When gọi POST observations với body chứa field note
  Then hệ thống trả 422 CHILD_FIELD_NOT_ALLOWED
  And không hàng nào được ghi

Scenario: BR-LSR-07 — lượt chạy ghim bản lesson
  Given một lượt chạy đang dở ở version 3
  When lesson được publish version 4
  Then lượt chạy đó vẫn hiện nội dung version 3

Scenario: BR-LSR-08 — bỏ qua bước không bị chặn
  Given người dạy đang ở bước mở rộng
  When bấm bỏ qua
  Then bước ghi outcome skipped
  And lượt chạy sang bước kế tiếp

Scenario: BR-LSR-09 — hết hạn mức vẫn chạy được bước ngoài màn hình
  Given child profile đã chạm trần phút chơi trong ngày
  When lượt chạy tới một bước kiểu off_screen
  Then bước đó chạy bình thường
  And khi tới bước digital_game thì trả DAILY_PLAY_CAP_REACHED

Scenario: BR-LSR-11 — lượt dở quá 7 ngày bị đóng
  Given một lượt chạy in_progress mở cách đây 8 ngày
  When người dạy mở lesson đó
  Then lượt cũ có status abandoned
  And hệ thống mở một lượt mới từ bước đầu
```

## 10. Boundaries

**Always**
- Hiện một bước tại một thời điểm.
- Để người dạy giữ nhịp.
- Đỡ bước ngoài màn hình ngang bước trên màn hình.
- Ghim bản lesson vào lượt chạy.

**Ask first**
- Thêm một `kind` bước mới.
- Đổi ba mức quan sát.
- Đổi ngưỡng 7 ngày.

**Never**
- Hiện đồng hồ đếm ngược hay điểm ở nơi trẻ thấy.
- Nhận ô chữ tự do mô tả đứa trẻ.
- Tự chuyển bước theo đồng hồ.
- Chặn hoạt động ngoài màn hình bằng hạn mức thời gian màn hình.
- Giả định trẻ đọc được chữ.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ | Quyết định / Trạng thái |
|---|---|---|---|---|---|
| 1 | Ba mức quan sát có đủ để dựng báo cáo tiến bộ có ích không, hay cần thêm mức thứ tư cho "bé làm được và giải thích được"? | Hình dạng báo cáo tiến bộ | P4 | người quyết | **Đã đóng (Task #95 WP95.0):** Ba mức quan sát (`did_it`, `with_help`, `not_yet`) là chuẩn hóa danh sách đóng ở P4 để người dạy ghi nhận hành vi rõ ràng mà không tạo thang điểm cạnh tranh/so sánh (`BR-PED-01`). Mức giải thích sâu được theo dõi định tính ở P5 nếu cần rubric mở rộng. |
| 2 | Một lượt chạy cho nhiều trẻ cùng lúc có cần không? Hôm nay mỗi lượt gắn một child profile | Phạm vi P4 | chờ P5 | hoãn — trùng câu hỏi 2 ở [`lesson-model.md`](../05-content/lesson-model.md) §11 | Hoãn chờ P5. Hiện tại một lượt chạy gắn đúng một `child_profile_id`. |
| 3 | Quan sát có nên chảy vào mastery của [`adaptive-engine.md`](../01-platform/adaptive-engine.md) không? Nó là đánh giá của người lớn, khác hẳn nguồn telemetry máy đo | Nguồn dữ liệu mastery | P4 | người quyết | **Đã đóng (Task #95 WP95.0):** Quan sát của người lớn được lưu riêng biệt trong `lesson_run_observations` và phục vụ báo cáo định tính (Parent/Teacher dashboard), **KHÔNG** trộn trực tiếp vào `telemetry_events` hay `mastery_state` của adaptive engine vốn chỉ tiêu thụ tín hiệu telemetry máy đo khách quan (tránh bias người lớn làm méo mó BKT/ZPD). |
