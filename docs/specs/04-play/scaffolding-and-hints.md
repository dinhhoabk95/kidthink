---
spec: SCAFFOLDING-AND-HINTS
title: Trợ giúp leo thang
area: play
status: approved
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Ngưỡng leo thang theo band tuổi
  - Ba cấp trợ giúp
depends_on:
  - GAME-ENGINE-RUNTIME
  - EVENT-CATALOG
---

# Trợ giúp leo thang

## 1. Objective

Trẻ 3 tuổi **sẽ không xin trợ giúp**. Nếu hệ thống chờ được yêu cầu, nó sẽ để trẻ ngồi bế
tắc cho tới khi bỏ cuộc.

Vì vậy trợ giúp leo thang **theo đồng hồ hoặc theo số lần miss liên tiếp**, tự động, không
theo yêu cầu.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Trẻ | Nhận trợ giúp, không phải xin |
| Engine | Đếm thời gian và miss, leo thang |
| Adaptive | Dùng `hint_rate` làm tín hiệu, không trừ điểm |

## 3. Entry points

`packages/game-engine/src/systems/scaffolding.ts` — chạy trong vòng lặp engine.

## 4. Main flow

1. Round bắt đầu → khởi động đồng hồ và bộ đếm miss.
2. Chạm ngưỡng L1 → **highlight** target đúng, gán `engine.focusIndex`.
3. Chạm L2 → **ghost hand** trình diễn ở tốc độ thật, một lần.
4. Chạm L3 → ghost hand **0,5×**, lặp cho tới khi trẻ thao tác.
5. Mỗi lần leo thang phát `scaffold_escalated`.
6. Trẻ thao tác đúng → reset về L0 cho round sau.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Trẻ đúng trước ngưỡng | Cấm hiện trợ giúp nào |
| Trẻ vẫn không thao tác sau L3 | Giữ L3, **không** tự làm hộ. Sau 3 chu kỳ → gợi ý chuyển round (`round_skipped`) |
| `prefers-reduced-motion` | Ghost hand thành highlight nhấp nháy chậm, **vẫn có** trình diễn |
| Trẻ chạm liên tục lung tung | Coi là miss, leo thang bình thường |
| Round retry | Đồng hồ reset, bộ đếm miss **không** reset |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SCF-01` | Leo thang theo **đồng hồ hoặc miss**, Cấm — **NEVER theo yêu cầu** | Trẻ 3 tuổi sẽ không xin |
| `BR-SCF-02` | Hint Cấm — **NEVER trừ điểm** | Trừ điểm dạy trẻ đừng nhận trợ giúp |
| `BR-SCF-03` | Scaffolding **phải gán `engine.focusIndex`** | Một phần tử động thu hút chú ý tại một thời điểm — `BR-ENG-09` |
| `BR-SCF-04` | Hệ thống Cấm — **NEVER tự hoàn thành hộ trẻ** | Trẻ phải là người thao tác cuối cùng |
| `BR-SCF-05` | Ngưỡng theo **band tuổi**, không một ngưỡng cho mọi tuổi | 3 tuổi cần trợ giúp sớm gấp đôi 6 tuổi |
| `BR-SCF-06` | `prefers-reduced-motion` **giảm** trình diễn, không bỏ | Bỏ trình diễn là bỏ kênh chỉ dẫn duy nhất cho trẻ chưa đọc |
| `BR-SCF-07` | Mỗi lần leo thang phát event | `hint_rate` là tín hiệu chất lượng nội dung |
| `BR-SCF-08` | Trợ giúp Cấm — **NEVER kèm giọng chê** | Âm và lời luôn khích lệ |

## 7. Data

### 7.1 Ngưỡng theo band

| Band | L1 nudge | L2 hướng dẫn | L3 trình diễn |
|---|---|---|---|
| **3–4** | 1 miss **hoặc** 10s | 2 **hoặc** 18s | 3 **hoặc** 25s |
| **4–5** | 2 **hoặc** 15s | 3 **hoặc** 25s | 4 **hoặc** 35s |
| **5–6** | 2 **hoặc** 20s | 3 **hoặc** 30s | 5 **hoặc** 40s |

Điều kiện **hoặc** — cái nào đến trước.

### 7.2 Ba cấp

| Cấp | Biểu hiện | Âm |
|---|---|---|
| L1 | Highlight target đúng bằng nhịp thở nhẹ | không |
| L2 | Ghost hand đi từ item tới target, tốc độ thật, một lần | Âm nhẹ dẫn hướng |
| L3 | Ghost hand 0,5×, lặp | Lời hướng dẫn tiếng Việt đọc lại |

### 7.3 Event

`scaffold_escalated { round_index, level, trigger: "timer"|"miss_streak", elapsed_ms }`
`demo_shown { round_index, speed }`

Cấm có `hint_requested` với `source: "user"` — không tồn tại đường xin trợ giúp.

## 8. API contract

```ts
interface ScaffoldState { level: 0 | 1 | 2 | 3; sinceMs: number; missStreak: number }
scaffolding.tick(deltaMs, state, ageBand): ScaffoldAction | null;
scaffolding.onMiss(state): void;
scaffolding.onSuccess(state): void;   // reset về 0
```

## 9. Acceptance criteria

```gherkin
Scenario: BR-SCF-01 — trợ giúp tự đến, không cần xin
  Given trẻ band 3-4 không thao tác trong 10 giây
  Then L1 highlight xuất hiện
  And không cần bất kỳ thao tác nào của trẻ

Scenario: BR-SCF-01 — không có nút xin trợ giúp
  When quét UI bề mặt trẻ
  Then không có control nào gọi hint theo yêu cầu

Scenario: BR-SCF-05 — ngưỡng khác nhau theo band
  Given cùng một level chơi ở band 3-4 và band 5-6
  When cả hai không thao tác 12 giây
  Then band 3-4 đã ở L1
  And band 5-6 vẫn ở L0

Scenario: BR-SCF-02 — hint không trừ điểm
  Given một phiên dùng 4 lần trợ giúp
  Then normalized_score không bị giảm vì trợ giúp
  And hint_count là 4

Scenario: BR-SCF-04 — hệ thống không làm hộ
  Given trẻ ở L3 và không thao tác thêm 60 giây
  Then round không tự hoàn thành
  And hệ thống gợi ý chuyển round

Scenario: BR-SCF-03 — focusIndex được gán
  Given scaffolding đang ở L1
  Then engine.focusIndex trỏ tới target đúng
  And chỉ một phần tử đang động

Scenario: BR-SCF-06 — reduced-motion vẫn có trình diễn
  Given prefers-reduced-motion bật
  When scaffolding tới L2
  Then vẫn có chỉ dẫn hình ảnh về target
  And chuyển động được giảm

Scenario: BR-SCF-08 — không có giọng chê
  When phát mọi chuỗi audio của scaffolding
  Then không câu nào mang nghĩa trách hoặc so sánh
```

## 10. Boundaries

**Always**
- Leo thang tự động theo band tuổi.
- Gán `engine.focusIndex` mỗi lần scaffolding hoạt động.
- Phát event mỗi lần leo thang.

**Ask first**
- Đổi ngưỡng leo thang.
- Thêm cấp thứ tư.

**Never**
- Trợ giúp theo yêu cầu.
- Trừ điểm vì hint.
- Tự hoàn thành hộ trẻ.
- Bỏ trình diễn khi reduced-motion.
- Giọng chê trong trợ giúp.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Ngưỡng thời gian cần kiểm chứng với trẻ thật | Kiểm chứng UX — ngưỡng §7.1 hiện là số ước lượng, cần đo đạc thực tế | P1 nghiệm thu | Studio UI |
| 2 | `hint_rate` cao trên một level nên coi là nội dung khó hay nội dung sai? | Phân tích KPI — `hint_rate` > 40% + `drop_rate` > 20% là tín hiệu level bị sai độ khó | P1 | Nội dung |

