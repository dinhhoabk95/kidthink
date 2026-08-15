---
spec: NEXT-GAME-RECOMMENDATION
title: Gợi ý nội dung kế tiếp
area: play
status: implemented
mvp: true
phase: P3
reviewed: 2026-08-15
owns:
  - Luật gợi ý theo rule
  - Thứ tự ưu tiên nguồn gợi ý
depends_on:
  - ACCESS-GATING
  - ADAPTIVE-ENGINE
  - CURRICULUM-PLAYER
---

# Gợi ý nội dung kế tiếp

## 1. Objective

Sau khi hoàn thành một level, trẻ phải biết **chơi gì tiếp** mà không cần người lớn chọn.

Gợi ý chạy bằng **luật**, không dùng ML. Luật giải thích được, test được, và đủ tốt ở quy mô
120 level.

Spec này thuộc **P3**, không phải P1 (`D-AM`). Hai trong ba `depends_on` của nó —
[`adaptive-engine.md`](../01-platform/adaptive-engine.md) và
[`curriculum-player.md`](curriculum-player.md) — đều là spec P3, và đều là phụ thuộc thật:
gợi ý theo mức thành thạo cần `mastery_state` được engine adaptive nuôi.
[`roadmap.md`](../roadmap.md) §P3 mục 6 đã xếp nó đúng từ đầu; `phase: P1` trong frontmatter
và dòng tương ứng ở [`index.md`](../index.md) là chỗ lệch, đã sửa 2026-08-08.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Trẻ | Nhận 1 gợi ý chính + tối đa 4 lựa chọn khác |
| Người lớn | Thấy lý do gợi ý trong báo cáo |

## 3. Entry points

| Nơi | |
|---|---|
| Màn hình tổng kết phiên | 1 gợi ý chính |
| Sảnh trẻ | 3–5 gợi ý |
| `GET /api/users/play/recommendations` | Gợi ý người dùng (cần active child) |
| `GET /api/guest/play/recommendations` | Gợi ý khách (allow-list free) |

## 4. Main flow — thứ tự ưu tiên (D-MQ, D-MR, D-MS)

```
1. Đang theo curriculum và còn bước chưa xong  → bước kế tiếp của curriculum (bậc 1: curriculum_next)
   (Nếu tuần bị khoá theo tier -> trả rỗng, rơi xuống bậc 2 theo D-MS)
2. Có skill p_learn < 0.4 chạm trong 7 ngày    → level cùng skill, dễ hơn hoặc cùng độ khó (bậc 2: skill_reinforce)
3. Có skill p_learn ≥ 0.8                      → level skill kế tiếp trong DAG prerequisite (bậc 3: skill_progression)
4. Có skill last_seen_at > 7 ngày              → ôn lại theo thời gian (bậc 4: revision)
5. Còn lại                                     → level cùng competency, chưa chơi, hợp tuổi (bậc 5: explore)
6. Không có gì phù hợp                         → level phổ biến nhất hợp tuổi chưa chơi (bậc 6: popular)
7. Hết nội dung mới / fallback                 → level đã chơi, ôn lại (bậc 7: revision)
```

Mỗi ứng viên phải qua **gating theo lô** trước khi vào danh sách gợi ý.
Hàm xếp hạng nhận `seed` làm tham số để đảm bảo tính tái lập trong test và ổn định trong ngày (`D-MV`).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Không đủ dữ liệu mastery (< 3 lần chơi) | Nhảy tới bước 5 (`explore`) |
| Mọi ứng viên đều bị khoá bậc | Gợi ý **1 level khoá** (và không có level mở) kèm mời nâng cấp **trên bề mặt người lớn** (`D-MT`) |
| Trẻ vừa chơi level đó | Cấm gợi ý lại ngay; loại 3 level gần nhất (`BR-REC-03`) |
| Hết nội dung mới phù hợp | Gợi ý ôn lại (bậc 7: `revision`), bảo đảm không bao giờ để trống (`D-MQ`) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-REC-01` | Gợi ý phải qua **gating** trước khi hiện | Gợi ý thứ không chơi được là quảng cáo trá hình trên bề mặt trẻ |
| `BR-REC-02` | Curriculum **luôn ưu tiên hơn** adaptive | Adaptive không phủ quyết thứ tự sư phạm — `BR-ADP-05` |
| `BR-REC-03` | Loại 3 level chơi gần nhất | Lặp lại ngay làm trẻ chán |
| `BR-REC-04` | Gợi ý luôn hợp **band tuổi** của trẻ | Đảm bảo nội dung vừa sức phát triển nhận thức của từng nhóm tuổi mầm non |
| `BR-REC-05` | Mỗi gợi ý có `reason` giải thích được | Người lớn cần hiểu vì sao |
| `BR-REC-06` | Cấm — **NEVER gợi ý dựa trên "trẻ khác cũng chơi"** | Không so sánh trẻ; và dữ liệu hành vi tập thể của trẻ là vùng nhạy cảm. `popular` chỉ đọc `level_daily_stats.plays_count` (`D-MU`) |
| `BR-REC-07` | Ưu tiên nội dung **mở được**; nội dung khoá tối đa **1** trong danh sách | Danh sách toàn ổ khoá gây nản. Ngoại lệ duy nhất: khi mọi ứng viên đều khoá thì danh sách chỉ có đúng 1 item khoá và 0 item mở (`D-MT`) |
| `BR-REC-08` | Dùng **luật**, không ML | Giải thích được và test được |

## 7. Data

### 7.1 Response

```jsonc
{
  "primary": {
    "level_code": "GL-C1-CNT-MATCH-0008",
    "title": "Đếm quả cam",
    "thumbnail_emoji": "EMJ-orange",
    "reason": "Cùng chủ đề, khó hơn một chút",
    "reason_code": "skill_progression",
    "locked": false
  },
  "alternatives": [ /* tối đa 4 */ ]
}
```

### 7.2 `reason_code`

| Code | `reason` |
|---|---|
| `curriculum_next` | "Bài tiếp theo trong chương trình" |
| `skill_reinforce` | "Luyện thêm kỹ năng này" |
| `skill_progression` | "Cùng chủ đề, khó hơn một chút" |
| `revision` | "Ôn lại điều đã học" |
| `explore` | "Thử một trò chơi mới" |
| `popular` | "Nhiều bé thích trò này" |

`popular` là code duy nhất chạm tới dữ liệu tập thể, và nó chỉ dùng **số lượt chơi tổng** từ `level_daily_stats`,
không dùng hành vi cá nhân của trẻ khác (`BR-REC-06`, `D-MU`).

## 8. API contract

### `GET /api/users/play/recommendations`

| | |
|---|---|
| Auth | `requireUserAuth()` + `assertActiveChild()` |
| Query | `?limit=5` (trần tối đa 5) |
| 200 | §7.1 |
| 428 | `NO_ACTIVE_CHILD` |

### `GET /api/guest/play/recommendations`

TrẢ từ allow-list `free`, chọn theo `explore` và `popular` (`D-MW`). Nhận tham số tuỳ chọn `?age_band=3-4|4-5|5-6&limit=5`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-REC-01 — không gợi ý thứ không chơi được
  Given trẻ thuộc user không gói
  When lấy gợi ý
  Then mọi item trong alternatives đều mở được
  Or tối đa một item có locked = true

Scenario: BR-REC-02 — curriculum ưu tiên hơn adaptive
  Given trẻ đang theo curriculum ở tuần 3
  And có skill p_learn = 0.9 gợi ý bước xa hơn
  When lấy gợi ý
  Then primary là bước kế tiếp của curriculum

Scenario: BR-REC-03 — không lặp level vừa chơi
  Given trẻ vừa chơi 3 level A, B, C
  When lấy gợi ý
  Then không item nào là A, B, hay C

Scenario: BR-REC-04 — gợi ý hợp tuổi
  Given trẻ band 3-4
  When lấy gợi ý
  Then mọi item có age_min ≤ 4

Scenario: BR-REC-05 — mọi gợi ý có lý do
  When lấy gợi ý
  Then mỗi item có reason_code và reason không rỗng

Scenario: BR-REC-06 — không gợi ý theo hành vi trẻ khác
  When đọc implementation của recommendation
  Then không truy vấn nào nối play_sessions hay telemetry_events theo child_profile khác

Scenario: BR-REC-07 — giới hạn nội dung khoá
  Given trẻ không có gói trả phí
  When lấy gợi ý
  Then danh sách có tối đa 1 item bị locked

Scenario: BR-REC-08 — luật thay vì ML
  When kiểm tra implementation
  Then thuật toán là rule-based deterministic không dùng ML model

Scenario: không bao giờ trả rỗng
  Given trẻ đã chơi hết nội dung hợp tuổi
  When lấy gợi ý
  Then vẫn có primary với reason_code revision
```

## 10. Boundaries

**Always**
- Gating trước khi gợi ý.
- Curriculum ưu tiên hơn adaptive.
- Kèm `reason_code` và `reason`.

**Ask first**
- Đổi thứ tự ưu tiên §4.
- Thêm `reason_code` mới.
- Dùng ML thay luật.

**Never**
- Gợi ý nội dung không chơi được (quá 1 item).
- Gợi ý theo hành vi cá nhân của trẻ khác.
- Trả danh sách rỗng.
- Cho adaptive phủ quyết curriculum.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Loại 3 level gần nhất có đủ không? Với 120 level thì trẻ sẽ gặp lại khá nhanh | P3 | Giữ loại 3 level gần nhất cho MVP; mở rộng cửa sổ loại trừ nếu ghi nhận hiện tượng lặp lại quá nhanh ở P4 (đóng theo D-MV) | Backend |
| 2 | `popular` dùng số lượt chơi tổng — có rủi ro tạo vòng lặp tự củng cố không? | P3 | Kết hợp popular với trọng số xáo trộn có hạt giống (seed) để tái lập trong test và tránh tự củng cố (đóng theo D-MV) | Backend |
 Then vẫn có primary với reason_code revision
```

## 10. Boundaries

**Always**
- Gating trước khi gợi ý.
- Curriculum ưu tiên hơn adaptive.
- Kèm `reason_code` và `reason`.

**Ask first**
- Đổi thứ tự ưu tiên §4.
- Thêm `reason_code` mới.
- Dùng ML thay luật.

**Never**
- Gợi ý nội dung không chơi được (quá 1 item).
- Gợi ý theo hành vi cá nhân của trẻ khác.
- Trả danh sách rỗng.
- Cho adaptive phủ quyết curriculum.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Loại 3 level gần nhất có đủ không? Với 120 level thì trẻ sẽ gặp lại khá nhanh | P3 | Giữ loại 3 level gần nhất cho MVP; mở rộng cửa sổ loại trừ nếu ghi nhận hiện tượng lặp lại quá nhanh ở P4 | Backend |
| 2 | `popular` dùng số lượt chơi tổng — có rủi ro tạo vòng lặp tự củng cố không? | P3 | Kết hợp popular với trọng số xáo trộn ngẫu nhiên nhẹ (random noise) để tránh hiện tượng hiệu ứng đám đông | Backend |
