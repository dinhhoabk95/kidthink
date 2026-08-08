---
spec: SCORING-AND-RESULT
title: Tính điểm và kết quả phiên
area: play
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Công thức tính điểm từ event
  - Ánh xạ điểm sang biểu diễn cho trẻ
depends_on:
  - PLAY-SESSION-LIFECYCLE
  - EVENT-CATALOG
---

# Tính điểm và kết quả phiên

## 1. Objective

Biến chuỗi event thành một con số đo được cho hệ thống, **và** một biểu hiện tích cực cho
trẻ. Hai thứ đó khác nhau và không được lẫn.

Trẻ 3–6 **không thấy điểm số**. Chúng thấy sao và lời khen. Điểm là cho adaptive và cho
báo cáo của người lớn.

## 2. Actors

| Actor | Thấy gì |
|---|---|
| Trẻ | Sao (1–3) + hoạt hình ăn mừng. Cấm con số |
| Người lớn | `normalized_score`, tỉ lệ đúng, số hint, thời lượng |
| Adaptive | `correct_ratio` để cập nhật mastery |

## 3. Entry points

`POST /api/{ns}/play-sessions/{uuid}/complete` · job `rollup:session`.

## 4. Main flow

1. Nạp toàn bộ event của phiên, sắp theo `seq`.
2. Dựng lại chuỗi round: mỗi `round_started` … `round_completed`.
3. Tính chỉ số §7.1.
4. `raw_score` và `normalized_score` theo §7.2.
5. `stars` theo §7.3.
6. Ghi `play_sessions`, sinh `child_session_summaries`.
7. Nếu đủ điều kiện → cập nhật `mastery_state`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Phiên `abandoned` | Vẫn tính trên round đã hoàn thành; `normalized_score` có, `stars` **không** hiện |
| Không round nào hoàn thành | `raw_score = 0`, không ghi mastery |
| Chuỗi event thiếu `round_completed` | Suy từ `answer_correct` cuối cùng của round đó, log cảnh báo |
| Event mâu thuẫn (correct và incorrect cùng attempt) | Lấy cái đến sau, log cảnh báo |
| Template chấm khác | Dùng `scoring` schema của template |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SCO-01` | Điểm tính ở **server** từ event, không nhận từ client | |
| `BR-SCO-02` | Trẻ Cấm — **NEVER thấy con số điểm** | Áp lực điểm số phản tác dụng ở tuổi 3–6 |
| `BR-SCO-03` | Hint và retry Cấm — **NEVER trừ điểm** — chúng được **đếm riêng** | Trừ điểm vì xin trợ giúp dạy trẻ đừng xin trợ giúp |
| `BR-SCO-04` | `normalized_score ∈ [0,1]`, so được giữa các template | Adaptive cần một thang chung |
| `BR-SCO-05` | Sai Cấm — **NEVER làm điểm âm**. Sàn là 0 | |
| `BR-SCO-06` | `stars` không phải hàm của tốc độ | Thưởng tốc độ ở tuổi này tạo thói quen đoán bừa |
| `BR-SCO-07` | Phiên `abandoned` không hiện `stars` | Ăn mừng phiên bỏ dở làm ăn mừng mất nghĩa |
| `BR-SCO-08` | Kết quả hiển thị **luôn tích cực**, kể cả điểm thấp | [`feedback-and-celebration.md`](feedback-and-celebration.md) |

## 7. Data

### 7.1 Chỉ số dựng từ event

| Chỉ số | Nguồn |
|---|---|
| `rounds_total` | Số `round_started` |
| `rounds_correct` | Round có `answer_correct` ở lần thử đầu |
| `attempt_count` | Tổng `answer_selected` |
| `correct_count` `incorrect_count` | Đếm event tương ứng |
| `hint_count` | `hint_requested` + `scaffold_escalated` |
| `retry_count` | `round_retried` |
| `duration_ms` | `completed_at − started_at` trừ thời gian `paused` |

### 7.2 Điểm

```
first_try_ratio = rounds_correct / rounds_total
accuracy        = correct_count / max(attempt_count, 1)

raw_score        = rounds_correct
normalized_score = clamp01(0.6 · first_try_ratio + 0.4 · accuracy)
```

`first_try_ratio` nặng hơn vì làm đúng ngay lần đầu là tín hiệu thành thạo mạnh hơn làm
đúng sau ba lần thử.

### 7.3 Sao — biểu diễn cho trẻ

| `normalized_score` | Sao |
|---|:--:|
| ≥ 0,85 | ⭐⭐⭐ |
| ≥ 0,55 | ⭐⭐ |
| hoàn thành level | ⭐ |
| chưa hoàn thành | không hiện sao |

**Mọi trẻ hoàn thành đều có ít nhất một sao.** Hoàn thành là thành tựu; ngưỡng cao hơn là
phần thưởng thêm, không phải điều kiện để được công nhận.

### 7.4 Cái gì đi tới adaptive

`correct_ratio = normalized_score` · `hint_rate = hint_count / rounds_total` ·
`weight` từ `content_skill_map`.

## 8. API contract

### `POST /api/users/play-sessions/{uuid}/complete` → 200

```jsonc
{
  "stars": 2,
  "rounds_correct": 4, "rounds_total": 5,
  "celebration": "great",
  "next_suggestion": { "level_code": "GL-C1-CNT-MATCH-0008", "reason_vi": "Cùng chủ đề, khó hơn một chút" }
}
```

Cấm **Không** trả `normalized_score` hay `raw_score` xuống bề mặt trẻ. Người lớn xem qua
[`basic-report.md`](../03-account/basic-report.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-SCO-01 — điểm tính từ event
  Given một phiên có 5 round, 4 round đúng ngay lần đầu
  When complete
  Then rounds_correct là 4
  And normalized_score được tính theo công thức, không lấy từ client

Scenario: BR-SCO-02 — trẻ không thấy con số
  When render màn hình tổng kết cho trẻ
  Then không có chuỗi số nào biểu diễn điểm
  And chỉ có sao và hình ảnh

Scenario: BR-SCO-03 — hint không trừ điểm
  Given hai phiên có cùng rounds_correct, một dùng 3 hint một không dùng
  Then normalized_score của hai phiên bằng nhau
  And hint_count khác nhau

Scenario: BR-SCO-06 — sao không phụ thuộc tốc độ
  Given hai phiên cùng kết quả, một nhanh gấp đôi
  Then số sao bằng nhau

Scenario: BR-SCO-05 — điểm không âm
  Given một phiên sai toàn bộ mọi lần thử
  Then normalized_score là 0
  And không phải số âm

Scenario: mọi trẻ hoàn thành đều có sao
  Given một phiên hoàn thành với normalized_score = 0.2
  Then stars là 1

Scenario: BR-SCO-07 — phiên bỏ dở không có sao
  Given một phiên abandoned
  When đọc kết quả
  Then stars là null
  And normalized_score vẫn được tính cho báo cáo

Scenario: BR-SCO-04 — thang chung giữa template
  Given hai phiên ở hai template khác nhau, cùng tỉ lệ đúng
  Then normalized_score xấp xỉ nhau
```

## 10. Boundaries

**Always**
- Tính điểm ở server từ event.
- Đếm hint và retry riêng, không trừ vào điểm.
- Cho mọi trẻ hoàn thành ít nhất một sao.

**Ask first**
- Đổi công thức hoặc trọng số.
- Đổi ngưỡng sao.

**Never**
- Nhận điểm từ client.
- Hiện con số điểm cho trẻ.
- Trừ điểm vì hint, retry, hay chậm.
- Điểm âm.
- Hiện sao cho phiên bỏ dở.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Trọng số 0,6/0,4 đã đúng chưa? Cần đo trên dữ liệu thật rồi tinh chỉnh bằng replay | P3 |
| 2 | Template `sequence-order` chấm từng vị trí hay cả chuỗi? Ảnh hưởng `accuracy` | [`game-template-contract.md`](../01-platform/game-template-contract.md) Q3 |
