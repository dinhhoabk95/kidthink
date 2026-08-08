---
spec: NEXT-GAME-RECOMMENDATION
title: Gợi ý nội dung kế tiếp
area: play
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
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

P1 dùng **luật**, không dùng ML. Luật giải thích được, test được, và đủ tốt ở quy mô 120
level.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Trẻ | Nhận 1 gợi ý chính + 2 lựa chọn khác |
| Người lớn | Thấy lý do gợi ý trong báo cáo |

## 3. Entry points

| Nơi | |
|---|---|
| Màn hình tổng kết phiên | 1 gợi ý chính |
| Sảnh trẻ | 3–5 gợi ý |
| `GET /api/users/play/recommendations` | |

## 4. Main flow — thứ tự ưu tiên

```
1. Đang theo curriculum và còn bước chưa xong  → bước kế tiếp của curriculum
2. Có skill p_learn < 0.4 chạm gần đây          → level cùng skill, dễ hơn
3. Có skill p_learn ≥ 0.8                        → level skill kế tiếp trong DAG
4. Có skill last_seen_at > 7 ngày                → ôn lại
5. Còn lại                                       → level cùng competency, chưa chơi, hợp tuổi
6. Không có gì phù hợp                           → level phổ biến nhất hợp tuổi chưa chơi
```

Mỗi ứng viên phải qua **gating** trước khi vào danh sách gợi ý.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Không đủ dữ liệu mastery (< 3 lần) | Nhảy tới bước 5 |
| Mọi ứng viên đều bị khoá bậc | Gợi ý **1 level mở được** + 1 level khoá kèm mời nâng cấp **trên bề mặt người lớn** |
| Trẻ vừa chơi level đó | Cấm gợi ý lại ngay; loại 3 level gần nhất |
| Hết nội dung phù hợp | Gợi ý ôn lại, không để trống |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-REC-01` | Gợi ý phải qua **gating** trước khi hiện | Gợi ý thứ không chơi được là quảng cáo trá hình trên bề mặt trẻ |
| `BR-REC-02` | Curriculum **luôn ưu tiên hơn** adaptive | Adaptive không phủ quyết thứ tự sư phạm — `BR-ADP-05` |
| `BR-REC-03` | Loại 3 level chơi gần nhất | Lặp lại ngay làm trẻ chán |
| `BR-REC-04` | Gợi ý luôn hợp **band tuổi** của trẻ | |
| `BR-REC-05` | Mỗi gợi ý có `reason_vi` giải thích được | Người lớn cần hiểu vì sao |
| `BR-REC-06` | Cấm — **NEVER gợi ý dựa trên "trẻ khác cũng chơi"** | Không so sánh trẻ; và dữ liệu hành vi tập thể của trẻ là vùng nhạy cảm |
| `BR-REC-07` | Ưu tiên nội dung **mở được**; nội dung khoá tối đa **1** trong danh sách | Danh sách toàn ổ khoá gây nản |
| `BR-REC-08` | P1 dùng **luật**, không ML | Giải thích được và test được |

## 7. Data

### 7.1 Response

```jsonc
{
  "primary": {
    "level_code": "GL-C1-CNT-MATCH-0008",
    "title_vi": "Đếm quả cam",
    "thumbnail_emoji": "EMJ-orange",
    "reason_vi": "Cùng chủ đề, khó hơn một chút",
    "reason_code": "skill_progression"
  },
  "alternatives": [ /* tối đa 4 */ ]
}
```

### 7.2 `reason_code`

| Code | `reason_vi` |
|---|---|
| `curriculum_next` | "Bài tiếp theo trong chương trình" |
| `skill_reinforce` | "Luyện thêm kỹ năng này" |
| `skill_progression` | "Cùng chủ đề, khó hơn một chút" |
| `revision` | "Ôn lại điều đã học" |
| `explore` | "Thử một trò chơi mới" |
| `popular` | "Nhiều bé thích trò này" |

`popular` là code duy nhất chạm tới dữ liệu tập thể, và nó chỉ dùng **số lượt chơi tổng**,
không dùng hành vi cá nhân của trẻ khác (`BR-REC-06`).

## 8. API contract

### `GET /api/users/play/recommendations`

| | |
|---|---|
| Auth | `requireUserAuth()` + `assertActiveChild()` |
| Query | `?limit=5` |
| 200 | §7.1 |
| 428 | `NO_ACTIVE_CHILD` |

### `GET /api/guest/play/recommendations`

Trả từ allow-list `free`, chọn theo `explore` và `popular`.

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
  Then mỗi item có reason_code và reason_vi không rỗng

Scenario: BR-REC-06 — không gợi ý theo hành vi trẻ khác
  When đọc implementation của recommendation
  Then không truy vấn nào đọc lịch sử chơi của child_profile khác

Scenario: không bao giờ trả rỗng
  Given trẻ đã chơi hết nội dung hợp tuổi
  When lấy gợi ý
  Then vẫn có primary với reason_code revision
```

## 10. Boundaries

**Always**
- Gating trước khi gợi ý.
- Curriculum ưu tiên hơn adaptive.
- Kèm `reason_code` và `reason_vi`.

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

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Loại 3 level gần nhất có đủ không? Với 120 level thì trẻ sẽ gặp lại khá nhanh | P1 |
| 2 | `popular` dùng số lượt chơi tổng — có rủi ro tạo vòng lặp tự củng cố không? | P3 |
