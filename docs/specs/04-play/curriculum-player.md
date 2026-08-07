---
spec: CURRICULUM-PLAYER
title: Chạy lộ trình chương trình
area: play
status: draft
mvp: true
phase: P3
reviewed: 2026-08-04
owns:
  - Luồng đi qua curriculum
  - Quy tắc mở khoá bước
depends_on:
  - CURRICULUM-MODEL
  - ACCESS-GATING
  - PLAY-SESSION-LIFECYCLE
---

# Chạy lộ trình chương trình

## 1. Objective

Curriculum biến thư viện rời rạc thành **lộ trình**. Đây là thứ giữ trẻ quay lại 4–8 tuần —
tiêu chí MVP thành công.

Player trả lời một câu hỏi mỗi lần mở: **hôm nay học gì tiếp**.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Người lớn | Ghi danh trẻ vào một curriculum, xem tiến độ |
| Trẻ | Chơi bước kế tiếp, ❌ không chọn tuần |
| Adaptive | Chọn **biến thể trong bước**, ❌ không nhảy bước |

## 3. Entry points

| Route | |
|---|---|
| `POST /api/users/children/{uuid}/enrollments` | Ghi danh |
| `GET /api/users/children/{uuid}/curriculum/next` | Bước kế tiếp |
| `GET /api/users/children/{uuid}/curriculum/progress` | Tiến độ |
| Sảnh trẻ — thẻ "Tiếp tục" | |

## 4. Main flow

1. Người lớn chọn curriculum hợp tuổi, ghi danh trẻ → `curriculum_enrollments`.
2. Player xác định **bước hiện tại**: item chưa hoàn thành có `position` nhỏ nhất trong tuần
   hiện tại.
3. Gating item đó. Bị khoá → hiện lời mời nâng cấp **trên bề mặt người lớn**.
4. Trẻ chơi → hoàn thành → ghi `curriculum_item_progress`.
5. Xong mọi item **bắt buộc** của tuần → mở tuần kế tiếp.
6. Xong curriculum → màn hình hoàn thành + gợi ý curriculum tiếp.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Item tuỳ chọn chưa xong | ❌ Không chặn mở tuần mới |
| Item bị khoá bậc | Bỏ qua trong tính "hoàn thành tuần", nhưng hiện trong danh sách kèm khoá |
| Curriculum publish version mới | Trẻ đang học **giữ version đã ghi danh** — `BR-CUR-04` |
| Trẻ ghi danh 2 curriculum | Cho phép; sảnh hiện cái đang hoạt động gần nhất |
| Rút khỏi curriculum | `enrollment.status = 'withdrawn'`, giữ tiến độ |
| Prerequisite chưa đạt | Item hiện dạng "chưa mở", nêu cần hoàn thành gì trước |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CUR-01` | Trẻ ❌ **không chọn tuần**. Thứ tự do người biên soạn quyết định | Sư phạm là thứ tự có chủ đích |
| `BR-CUR-02` | Adaptive điều chỉnh **trong** bước, ❌ **NEVER nhảy bước** | `BR-ADP-05` |
| `BR-CUR-03` | Tuần mở khi xong mọi item **bắt buộc**; item tuỳ chọn ❌ không chặn | |
| `BR-CUR-04` | Ghi danh **ghim `curriculum_version`** | Đổi chương trình giữa chừng làm tiến độ vô nghĩa |
| `BR-CUR-05` | Item bị khoá bậc ❌ **không chặn** tiến độ | Người trả gói thấp vẫn phải đi hết được lộ trình mở của họ |
| `BR-CUR-06` | Lời mời nâng cấp hiện **trên bề mặt người lớn**, ❌ không trên bề mặt trẻ | `BR-PEN-04` |
| `BR-CUR-07` | Tiến độ tính theo **item bắt buộc mở được**, ❌ không theo tổng item | Mẫu số gồm nội dung không mở được làm tiến độ vĩnh viễn dưới 100% |
| `BR-CUR-08` | Curriculum ❌ **không có hạn thời gian** — "tuần 3" là thứ tự, không phải lịch | Trẻ nghỉ 2 tuần không nên bị coi là chậm |

## 7. Data

### 7.1 Trạng thái ghi danh

`active` · `completed` · `withdrawn` · `paused`.

### 7.2 Tính tiến độ

```
denominator = item bắt buộc, mở được với quyền hiện tại, trong curriculum version đã ghim
numerator   = item trong denominator đã có curriculum_item_progress.completed_at
progress    = numerator / denominator
```

### 7.3 Bước kế tiếp

```jsonc
{
  "week_no": 3, "session_no": 2,
  "item": { "entity_type": "game_level", "entity_code": "GL-C1-CNT-MATCH-0008", "locked": false },
  "week_progress": { "done": 3, "total": 5 },
  "curriculum_progress": 0.28
}
```

## 8. API contract

### `POST /api/users/children/{uuid}/enrollments`

Body `{ curriculum_code }`. 201 → ghim `curriculum_version` hiện tại.
**409** `ALREADY_ENROLLED` · **422** nếu tuổi trẻ ngoài khoảng curriculum.

### `GET /api/users/children/{uuid}/curriculum/next`

200 → §7.3. **404** nếu chưa ghi danh.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CUR-04 — ghi danh ghim version
  Given trẻ ghi danh curriculum ở version 2
  When manager publish version 3
  Then trẻ vẫn đi theo version 2
  And tiến độ không bị đặt lại

Scenario: BR-CUR-03 — item tuỳ chọn không chặn tuần mới
  Given tuần 2 có 4 item bắt buộc và 2 tuỳ chọn
  When trẻ xong 4 item bắt buộc
  Then tuần 3 mở

Scenario: BR-CUR-05 — item khoá không chặn tiến độ
  Given tuần 3 có 1 item premium và trẻ thuộc user standard
  When trẻ xong mọi item khác
  Then tuần 4 mở
  And item premium hiện kèm khoá

Scenario: BR-CUR-07 — mẫu số chỉ gồm item mở được
  Given curriculum có 20 item bắt buộc, 5 trong đó là premium
  And trẻ thuộc user standard đã xong 15 item
  Then curriculum_progress là 1.0

Scenario: BR-CUR-02 — adaptive không nhảy bước
  Given trẻ ở tuần 3 và mọi skill đều p_learn ≥ 0.9
  When lấy bước kế tiếp
  Then vẫn là item trong tuần 3

Scenario: BR-CUR-01 — trẻ không chọn tuần
  When quét UI bề mặt trẻ
  Then không có control nào cho chọn tuần hay nhảy bước

Scenario: BR-CUR-06 — mời nâng cấp không hiện cho trẻ
  Given bước kế tiếp bị khoá bậc
  When trẻ mở sảnh
  Then hiện ổ khoá trung tính
  And không hiện giá hay nút mua

Scenario: BR-CUR-08 — nghỉ lâu không bị phạt
  Given trẻ không chơi 3 tuần
  When quay lại
  Then vẫn ở đúng bước đã dừng
  And không có thông báo trách móc
```

## 10. Boundaries

**Always**
- Ghim `curriculum_version` lúc ghi danh.
- Gating từng item.
- Tính tiến độ trên mẫu số mở được.

**Ask first**
- Đổi luật mở khoá tuần.
- Cho trẻ chọn bước.

**Never**
- Cho adaptive nhảy bước.
- Chặn tiến độ vì item bị khoá bậc.
- Hiện nội dung thương mại trên bề mặt trẻ.
- Gắn hạn thời gian vào tuần.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Curriculum item trỏ tới bản `published` mới nhất hay ghim version của item? | `content-versioning` Q2 |
| 2 | Trẻ ghi danh nhiều curriculum cùng lúc có gây rối không? Cân nhắc giới hạn 1 | P3 UX |
