---
spec: ROUND-SEQUENCE-PLAY
title: Chạy nhiều vòng liên tiếp trong một phiên chơi
area: play
status: implemented
mvp: false
phase: P2
reviewed: 2026-08-21
owns:
  - Vòng đời chạy nhiều vòng trong một phiên chơi
  - Quy tắc chuyển vòng và telemetry vòng
depends_on:
  - ROUND-SET-MODEL
  - GAME-CONFIG-DELIVERY
  - PLAY-SESSION-LIFECYCLE
  - GAME-ENGINE-RUNTIME
  - EVENT-CATALOG
  - SCORING-AND-RESULT
---

# Chạy nhiều vòng liên tiếp trong một phiên chơi

## 1. Objective

[`round-set-model.md`](../05-content/round-set-model.md) sở hữu hình dạng biên tập của một
round set. File này sở hữu thứ còn thiếu: **chạy** nó — engine đi hết dãy vòng trong một
phiên, trẻ làm xong vòng này thì sang vòng kế mà không rời màn chơi và không gọi mạng.

Đây cũng là chỗ đóng một lỗ hiện có. Mô hình điểm ở mục 7.2 của
[`scoring-and-result.md`](scoring-and-result.md) tính
`first_try_ratio = rounds_correct / rounds_total`, nhưng hôm nay **không session nào phát
`round_started`** — chỉ test phát. Hệ quả đo được: `rounds_total = 0` nên
`first_try_ratio = 0` tại
[`packages/shared/src/scoring.ts:255`](../../../packages/shared/src/scoring.ts), và
`normalized_score` trần ở 0,4 trong khi ngưỡng hai sao là 0,55. Mọi trẻ hoàn thành mọi màn
chơi hôm nay đều nhận đúng một sao, và adaptive engine nhận `correct_ratio ≤ 0,4` cho tất cả.

Ràng buộc kiến trúc của file này: **không sửa `TemplateGameSession`**. Vòng chạy bằng cách
**bọc** session hiện có, không bằng cách đổi hợp đồng của 17 template đã publish.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | không có tài khoản | Chơi từng vòng, tự bấm sang vòng kế |
| Engine | — | Giữ con trỏ vòng, dựng và huỷ session mỗi vòng, phát event |
| Server | — | Trả cả set trong một config, dựng lại kết quả từ chuỗi event |
| Guest | — | Chơi được, không ghi `mastery_state` (`BR-PSL-04`) |
| Manager | quyền preview | Chơi thử cả set, `is_preview = true` |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `GET /api/{ns}/levels/{code}/config` | Trẻ, Guest, Manager | Trả cả round set, tạo phiên như tác dụng phụ (`BR-PSL-10`) |
| `POST /api/{ns}/play-sessions/{uuid}/events` | Engine | Nạp event vòng theo lô |
| `POST /api/{ns}/play-sessions/{uuid}/complete` | Engine | Hoàn tất sau vòng cuối |
| [`lesson-session-runner.md`](lesson-session-runner.md) | Người dạy | Một bước `digital_game` mở một round set |

## 4. Main flow

```
1. Client gọi config → server trả rounds[] đầy đủ + tạo play_session
2. Engine dựng RoundRunner với con trỏ round_index = 0
3. Với mỗi vòng:
   a. sessionFactory(config, round) → session mới, setupEntities()
   b. phát round_started + question_shown
   c. trẻ thao tác; session.validateAction() chấm như hiện nay
   d. session.checkWinCondition() true → phát round_completed
   e. session.destroy(); con trỏ tăng
4. Hết vòng cuối → phát game_completed { rounds_total, rounds_correct }
5. Client gọi complete → server tính điểm từ chuỗi event → sao + tổng kết
```

Bước 3c không đổi một dòng nào so với hôm nay. Toàn bộ phần mới nằm ở 3a, 3b, 3e.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Set một vòng | `rounds.length = 1` | Chạy y hệt, vẫn phát `round_started` (`BR-RSP-02`) |
| Trẻ kẹt ở một vòng | Scaffolding leo hết mức mà vẫn chưa đúng | Phát `round_skipped` với `reason: "scaffold_exhausted"`, sang vòng kế (`BR-RSP-05`) |
| Trẻ thoát giữa chừng | Đóng tab, bấm thoát qua parent gate | Phát `game_abandoned` kèm `last_round_index`. Phiên đóng là `abandoned` |
| Mở lại level đã bỏ dở | Lần chơi sau | Phiên **mới**, bắt đầu từ vòng 0 (`BR-RSP-07`) |
| Hết hạn mức giữa phiên | Chạm trần phút chơi trong ngày | Phiên đang mở chạy hết set, không bị cắt (`BR-PSL-06`) |
| Mất mạng giữa set | Tablet rớt 4G | Chạy hết set bình thường; event đẩy lên khi có mạng lại |
| Một vòng có asset hỏng | Ảnh không phân giải được | Vòng đó dùng placeholder, không bỏ vòng. Phát `asset_load_failed` |
| Tab bị ẩn giữa vòng | Trẻ chuyển app | `game_paused` với `reason: "visibility"`; con trỏ vòng giữ nguyên |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RSP-01` (nạp một lần) | **Toàn bộ** vòng nằm trong một config payload, nạp trước khi phiên bắt đầu | `BR-ENG-03` (cấm network call trong lúc chơi) và `BR-CFG-01` (config chứa mọi thứ cần cho trọn phiên). Gọi mạng giữa hai vòng làm game đứng ở đúng chỗ trẻ đang chờ |
| `BR-RSP-02` (luôn phát vòng) | Engine phát `round_started` và `round_completed` cho **mọi** vòng, kể cả set một vòng | Đây là lỗ đang mở. Không phát thì `rounds_total = 0`, `first_try_ratio = 0`, và không trẻ nào lên được hai sao. Xem mục 1 |
| `BR-RSP-03` (bọc, không sửa) | `RoundRunner` **bọc** `TemplateGameSession`. Cấm — **NEVER sửa hợp đồng `GameSession`** để chạy nhiều vòng | `BR-GTC-08` (đổi contract của template đã publish là breaking change). Sửa base class buộc sửa cả 17 template và migrate mọi level đã seed |
| `BR-RSP-04` (mỗi vòng một session) | Mỗi vòng dựng một session mới bằng `sessionFactory`; session cũ gọi `destroy()` **trước** khi dựng session kế | `setupEntities()` được thiết kế chạy một lần. Dùng lại một session cho vòng sau làm state cũ rò sang vòng mới. `destroy()` trước cũng giữ `BR-ENG-15` (cấm cấp phát mỗi frame) khỏi rò bộ nhớ |
| `BR-RSP-05` (không vòng nào chặn) | Sau khi scaffolding leo hết mức mà vòng vẫn chưa đúng, engine phát `round_skipped` và sang vòng kế | Trẻ kẹt ở vòng 2 thì không bao giờ thấy vòng 3. Một round set mà trẻ không đi hết được là một bài giảng bị cắt giữa chừng |
| `BR-RSP-06` (thắng vòng khác thắng phiên) | `checkWinCondition()` là điều kiện thắng **của một vòng**. Phiên hoàn tất khi vòng cuối `round_completed` hoặc `round_skipped` | Giữ nguyên ngữ nghĩa hàm mà 17 template đang cài. Đổi nghĩa của nó là breaking change trá hình |
| `BR-RSP-07` (không nối phiên) | Bỏ dở rồi mở lại thì bắt đầu từ vòng 0 trong một phiên **mới**. Cấm — **NEVER nối tiếp phiên cũ** | Phiên là đơn vị đo của toàn hệ thống (`BR-PSL-01`). Nối nửa phiên làm `rounds_total` của hai lượt không so được, và `first_try_ratio` mất nghĩa |
| `BR-RSP-08` (scaffolding theo vòng) | Mức scaffolding **reset** mỗi vòng; `hint_count` cộng dồn cả phiên | Trẻ cần gợi ý ở vòng 3 không có nghĩa nó cần gợi ý ngay từ đầu vòng 4. Nhưng `hint_rate = hint_count / rounds_total` ở mục 7.4 [`scoring-and-result.md`](scoring-and-result.md) đo cả phiên |
| `BR-RSP-09` (ăn mừng cuối set) | Ăn mừng lớn **chỉ** sau vòng cuối. Vòng đúng ở giữa chỉ pop nhỏ tại điểm chạm | `BR-ENG-08` (ăn mừng lớn chỉ khi hoàn thành level). Ăn mừng mọi vòng làm ăn mừng mất nghĩa |
| `BR-RSP-10` (chỉ báo phi ngôn ngữ) | Chỉ báo tiến độ vòng dùng **hình**, ví dụ dãy hạt tô dần. Cấm — **NEVER hiện "3/5" hay bất kỳ chữ số nào** | `BR-ENG-10` (chữ không bao giờ mang chỉ dẫn một mình) — trẻ chưa đọc. Và "3/5" là điểm số trá hình, vi phạm `BR-SCO-02` (trẻ không thấy con số điểm) |
| `BR-RSP-11` (chuyển vòng không theo đồng hồ) | Chuyển vòng do trẻ chạm, hoặc tự chuyển sau khi hiệu ứng pop kết thúc. Cấm — **NEVER đồng hồ đếm ngược sang vòng kế** | `BR-ENG-11` (cấm đồng hồ đếm ngược). Đếm ngược biến chuỗi vòng thành cuộc rượt đuổi |
| `BR-RSP-12` (điểm ở server) | Client Cấm — **NEVER gửi kết quả vòng.** Server dựng `rounds_total` và `rounds_correct` từ chuỗi event | `BR-PSL-03` (điểm tính ở server từ chuỗi event) và `BR-SCO-01`. Nhiều vòng nhân số chỗ client có thể nói dối lên nhiều lần |
| `BR-RSP-13` (một phần tử động) | Lúc chuyển vòng chỉ **một** phần tử động chạy tại một thời điểm | `BR-ENG-09` (một phần tử động thu hút chú ý tại một thời điểm). Chuyển cảnh là lúc dễ vi phạm nhất vì có cả pop của vòng cũ lẫn xuất hiện của vòng mới |
| `BR-RSP-14` (ngân sách frame) | Dựng session của vòng kế Cấm — **NEVER làm rớt frame quá 2 frame liên tiếp** ở tablet mục tiêu | `BR-ENG-15` (cấm cấp phát object mỗi frame). Một cú khựng giữa hai vòng đọc như game hỏng |

## 7. Data

**Đọc:** `game_levels` · `game_level_rounds` · `game_templates`.
**Ghi:** `telemetry_events` (qua ingestion) · `play_sessions`.

Không thêm bảng. Round set là dữ liệu **đọc**; thứ duy nhất ghi thêm là event vòng, và
chúng đã có tên trong mục 7.2 của
[`event-catalog.md`](../00-foundation/event-catalog.md).

### 7.1 Event vòng — cái nào bắt buộc

| Event | Bắt buộc | Ghi chú |
|---|---|---|
| `round_started` | Có | Mọi vòng, kể cả set một vòng (`BR-RSP-02`) |
| `question_shown` | Có | Ngay sau `round_started` |
| `answer_correct` · `answer_incorrect` | Có | Mang `attempt_index` để dựng `first_try_ratio` |
| `round_completed` | Có | Khi vòng thắng |
| `round_skipped` | Không | Chỉ khi bỏ vòng, `reason` bắt buộc |
| `round_retried` | Không | Chỉ khi trẻ chơi lại vòng đó |
| `game_completed` | Có | Mang `rounds_total`, `rounds_correct` |
| `game_abandoned` | Không | Mang `last_round_index` |

`round_index` trên event tương tác riêng của template vẫn là tuỳ chọn — xem câu hỏi còn mở
số 1.

### 7.2 Con trỏ vòng

| Field | Nơi giữ | Ghi chú |
|---|---|---|
| `round_index` | Bộ nhớ engine, trong phiên | Không lưu DB. Server dựng lại từ đếm `round_started` |
| `rounds_total` | Suy ra từ `rounds.length` của config | Server đối chiếu với số `round_started` nhận được |
| `attempt_index` | Bộ nhớ session của vòng | Reset về 0 mỗi vòng |

Không lưu con trỏ vào DB là có chủ ý: `BR-RSP-07` đã cấm nối phiên, nên không có ai đọc nó.

## 8. API contract

Không thêm route. Hai payload đổi hình dạng.

### `GET /api/{ns}/levels/{code}/config`

| | |
|---|---|
| Auth | Theo bậc của level, [`access-gating.md`](access-gating.md) |
| 200 | Payload mục 7.1 [`game-config-delivery.md`](game-config-delivery.md), thêm `rounds[]` và `scoring.mode` |
| 402 | `DAILY_PLAY_CAP_REACHED` — hết phút chơi trong ngày |
| 403 | `TIER_LOCKED` — level thuộc tier chưa mở |
| 404 | `NOT_FOUND` — không có bản published |
| 422 | `CONTENT_PACK_INVALID` — một vòng không parse được, `details` mang `round_index` |

```jsonc
{
  "level_code": "GL-C1-CNT-MATCH-0007",
  "content_version": 3,
  "template_code": "GT-003",
  "theme_id": "farm",
  "age_band": "3-4",
  "scoring": { "mode": "rounds", "max_rounds": 4 },
  "rounds": [
    {
      "round_index": 0,
      "instruction": "Bé bỏ quả đỏ vào giỏ nhé!",
      "instruction_audio_url": "https://…/r0.mp3",
      "content_pack": { /* đã phân giải asset ref */ },
      "difficulty_params": { "distractor_count": 0 },
      "layout_seed": 2837491029
    }
  ],
  "session": { "uuid": "…", "started_at": "…" },
  "assets": [ { "ref": "🍎", "kind": "emoji", "glyph": "🍎" } ]
}
```

`scoring.mode` nhận `"rounds"` hoặc `"single"`. Giá trị `"single"` chỉ dùng cho level chưa
migrate và biến mất sau khi câu hỏi còn mở số 2 của
[`round-set-model.md`](../05-content/round-set-model.md) được đóng.

### `POST /api/{ns}/play-sessions/{uuid}/complete`

| | |
|---|---|
| Auth | Chủ sở hữu phiên (`BR-PSL-09`) |
| Body | `{ last_seq }` — không mang điểm, không mang kết quả vòng (`BR-RSP-12`) |
| 200 | `{ stars, rounds_total, rounds_correct }` — `stars` cho trẻ, hai số còn lại cho người lớn |
| 409 | `SESSION_ALREADY_COMPLETED` — complete lần hai |
| 422 | `VALIDATION_FAILED` — chuỗi event thiếu `round_started` trong khi `scoring.mode` là `rounds` |

Mã 422 cuối là cổng chống hồi quy: nó biến lỗi im lặng ở mục 1 thành lỗi kêu thành tiếng.

## 9. Acceptance criteria

```gherkin
Scenario: BR-RSP-01 — không gọi mạng giữa hai vòng
  Given một round set 4 vòng đã nạp
  When trẻ chơi hết cả 4 vòng
  Then engine không phát request mạng nào trong lúc chơi
  And getNetworkRequestCount trả 0

Scenario: BR-RSP-02 — set một vòng vẫn phát round_started
  Given một level có đúng một vòng
  When trẻ hoàn thành nó
  Then chuỗi event chứa đúng một round_started
  And game_completed mang rounds_total bằng 1

Scenario: BR-RSP-02 — điểm không còn trần ở 0,4
  Given một round set 4 vòng
  And trẻ làm đúng cả 4 vòng ngay lần thử đầu
  When server tính kết quả
  Then normalized_score bằng 1,0
  And trẻ nhận 3 sao

Scenario: BR-RSP-03 — hợp đồng GameSession không đổi
  Given 17 template đã publish
  When RoundRunner chạy một round set
  Then không template nào phải đổi content_contract
  And không template nào phải đổi chữ ký setupEntities hay validateAction

Scenario: BR-RSP-04 — session vòng cũ bị huỷ trước vòng mới
  Given trẻ vừa xong vòng 1
  When engine dựng session của vòng 2
  Then destroy của session vòng 1 đã được gọi trước đó
  And telemetry của vòng 2 không chứa event của vòng 1

Scenario: BR-RSP-05 — kẹt một vòng không chặn vòng sau
  Given trẻ ở vòng 2 và scaffolding đã leo hết mức
  When trẻ vẫn chưa trả lời đúng
  Then engine phát round_skipped với reason scaffold_exhausted
  And vòng 3 bắt đầu

Scenario: BR-RSP-07 — mở lại bắt đầu từ vòng 0
  Given một phiên abandoned ở last_round_index bằng 2
  When trẻ mở lại cùng level đó
  Then một phiên mới được tạo
  And vòng đầu tiên có round_index bằng 0

Scenario: BR-RSP-08 — scaffolding reset mỗi vòng
  Given trẻ dùng 2 gợi ý ở vòng 1
  When vòng 2 bắt đầu
  Then mức scaffolding của vòng 2 là mức thấp nhất
  And hint_count của phiên vẫn là 2

Scenario: BR-RSP-09 — không ăn mừng lớn giữa set
  Given một round set 4 vòng
  When trẻ hoàn thành vòng 2
  Then chỉ có hiệu ứng pop nhỏ tại điểm chạm
  And hiệu ứng ăn mừng lớn không chạy

Scenario: BR-RSP-10 — không chữ số ở chỉ báo tiến độ
  When đọc mọi phần tử hiển thị trong lúc chơi một round set
  Then không phần tử nào chứa chữ số dạng tiến độ vòng

Scenario: BR-RSP-11 — không đồng hồ chuyển vòng
  Given trẻ vừa xong vòng 1
  When để yên 60 giây không thao tác
  Then vòng 2 không tự bắt đầu bằng đếm ngược hiển thị

Scenario: BR-RSP-12 — client gửi điểm bị bỏ qua
  Given client gọi complete với body chứa rounds_correct bằng 99
  When server tính kết quả
  Then rounds_correct được dựng từ chuỗi event
  And giá trị 99 không xuất hiện trong kết quả

Scenario: BR-RSP-12 — thiếu round_started bị bắt
  Given scoring.mode là rounds
  And chuỗi event không có round_started nào
  When client gọi complete
  Then trả 422 VALIDATION_FAILED
```

## 10. Boundaries

**Always**
- Nạp cả set trong một config trước khi phiên bắt đầu.
- Phát `round_started` và `round_completed` cho mọi vòng.
- Dựng session mới mỗi vòng và huỷ session cũ trước.
- Reset scaffolding mỗi vòng.
- Dựng `rounds_total` và `rounds_correct` ở server từ chuỗi event.

**Ask first**
- Cho phép nối tiếp một phiên bỏ dở.
- Đổi điều kiện bỏ vòng ở `BR-RSP-05`.
- Thêm một event vòng mới vào [`event-catalog.md`](../00-foundation/event-catalog.md).
- Cho phép round set trộn nhiều template.

**Never**
- Sửa hợp đồng `GameSession` hay `TemplateGameSession` để chạy nhiều vòng.
- Gọi mạng giữa hai vòng.
- Hiện chữ số tiến độ vòng ở nơi trẻ nhìn thấy.
- Đếm ngược để chuyển vòng.
- Nhận kết quả vòng từ client.
- Ăn mừng lớn ở vòng giữa set.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ | Quyết định / Trạng thái |
|---|---|---|---|---|---|
| 1 | Mục 7.2 của [`event-catalog.md`](../00-foundation/event-catalog.md) viết "khuôn một vòng không phát nó" về `round_index`. Câu này đang bị đọc rộng thành "khuôn một vòng không phát event vòng", và đó là nguyên nhân của lỗ ở mục 1. Có sửa câu đó thành chỉ nói về trường `round_index` không? | Cổng chống hồi quy `BR-RSP-02` | P2 | người quyết | **Đã sửa (Task #100 WP100.1).** Câu đó chỉ nói về **trường** `round_index` trong payload event tương tác (tuỳ chọn khi set một vòng), KHÔNG nói về event `round_started`/`round_completed`. Event vòng **luôn phải phát** cho mọi set kể cả set một vòng (`BR-RSP-02`). Đã sửa [`event-catalog.md`](../00-foundation/event-catalog.md) §7.2 dòng 111 để tránh đọc rộng |
| 2 | ~~Lỗ điểm ở mục 1 có được vá ngay ở P1 bằng một guard `rounds_total = 0` trong [`packages/shared/src/scoring.ts`](../../../packages/shared/src/scoring.ts), hay chờ round set ở P2?~~ | Số sao trẻ nhận, dữ liệu vào adaptive engine | P1 | người quyết | **Đã vá (Task #100 WP100.0).** Khi `rounds_total = 0` và `attempt_count > 0`, `first_try_ratio` fallback về `correct_count / attempt_count` (= accuracy). Phiên rỗng giữ nguyên 0. Hành vi khi `rounds_total > 0` không đổi. |
| 3 | Chuyển vòng: trẻ tự chạm, hay tự chuyển sau khi pop xong? Tự chạm cho trẻ giữ nhịp nhưng thêm một cử chỉ mỗi vòng; tự chuyển mượt hơn nhưng dễ trượt thành nhịp máy áp lên trẻ | Thiết kế màn chuyển | P2 | người quyết | Chờ. `BR-RSP-11` cấm đếm ngược ở cả hai phương án |
| 4 | Trẻ có được chơi lại một vòng đã sai trong cùng phiên không? Event `round_retried` đã có tên trong catalog nhưng chưa spec nào định nghĩa khi nào phát | Ngữ nghĩa `rounds_correct` khi có retry | P2 | người quyết | Chờ. Mục 7.1 của [`scoring-and-result.md`](scoring-and-result.md) đã đếm `retry_count` riêng, nên retry không trừ điểm dù quyết thế nào |
| 5 | Ngân sách frame lúc chuyển vòng ở `BR-RSP-14` nêu "2 frame" theo suy luận, chưa đo trên tablet mục tiêu | Ngưỡng nghiệm thu hiệu năng | P2 nghiệm thu | Infra | Chờ số đo thật trên tablet mục tiêu, ngưỡng do [`performance-budgets.md`](../08-quality/performance-budgets.md) sở hữu |
