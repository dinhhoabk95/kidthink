---
spec: CURRICULUM-PLAYER
title: Chạy lộ trình chương trình
area: play
status: implemented
mvp: true
phase: P3
reviewed: 2026-08-15
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
| Trẻ | Chơi bước kế tiếp, không chọn tuần |
| Adaptive | Chọn **biến thể trong bước**, không nhảy bước |

## 3. Entry points

| Route | |
|---|---|
| `POST /api/users/children/{uuid}/enrollments` | Ghi danh |
| `POST /api/users/children/{uuid}/enrollments/withdraw` | Rút khỏi curriculum |
| `GET /api/users/children/{uuid}/curriculum/next` | Bước kế tiếp |
| `GET /api/users/children/{uuid}/curriculum/progress` | Tiến độ |
| Sảnh trẻ — thẻ "Tiếp tục" | |

## 4. Main flow

1. Người lớn chọn curriculum, ghi danh trẻ → `curriculum_enrollments`. Tuổi là tín hiệu đề
   xuất, cấm — NEVER dùng để chặn (`BR-LFM-02`).
2. Player xác định **bước hiện tại**: item chưa hoàn thành, mở được, nhỏ nhất theo
   `(week_no, session_no, position)` trong tuần nhỏ nhất còn item bắt buộc mở được chưa xong (`D-MG`).
3. Gating item đó. Bị khoá → hiện lời mời nâng cấp **trên bề mặt người lớn**.
4. Trẻ chơi → hoàn thành → ghi `curriculum_item_progress` (idempotent qua upsert — `D-MC`).
5. Xong mọi item **bắt buộc mở được** của tuần (và ít nhất 1 item hoàn thành trong tuần) → mở tuần kế tiếp (`BR-CUR-03`, `BR-CUR-10`).
6. Xong curriculum → màn hình hoàn thành + gợi ý curriculum tiếp.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Item tuỳ chọn chưa xong | Cấm chặn mở tuần mới (`BR-CUR-03`) |
| Item bị khoá bậc | Bỏ qua trong tính "hoàn thành tuần", nhưng hiện trong danh sách kèm khoá (`BR-CUR-05`) |
| Curriculum publish version mới | Trẻ đang học **giữ version đã ghi danh** — `BR-CUR-04` (`D-MA`) |
| Lesson publish version mới | Trẻ thấy nội dung bản `published` mới nhất qua `entity_id` (`D-MA`, `D-AE`) |
| Trẻ đã có enrollment `active` | Từ chối ghi danh thứ hai với **409** `ALREADY_ENROLLED` (`D-MB`) |
| Rút khỏi curriculum | `enrollment.status = 'withdrawn'`, giữ tiến độ cũ; ghi danh lại tạo enrollment mới |
| Tuần toàn item khoá bậc | Không tự hoàn thành; trả `week_blocked_by_tier: true` (`BR-CUR-10`, `D-ME`) |
| Nâng bậc quyền | Mẫu số giãn, tiến độ tính lại tại thời điểm đọc; enrollment `completed` quay lại `active` nếu tiến độ < 1.0 (`BR-CUR-09`, `D-MD`) |
| Prerequisite chưa đạt | Item hiện dạng "chưa mở", nêu cần hoàn thành gì trước |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CUR-01` | Trẻ **không chọn tuần**. Thứ tự do người biên soạn quyết định | Sư phạm là thứ tự có chủ đích |
| `BR-CUR-02` | Adaptive điều chỉnh **trong** bước, Cấm — **NEVER nhảy bước** | `BR-ADP-05` |
| `BR-CUR-03` | Tuần mở khi xong mọi item **bắt buộc mở được**; item tuỳ chọn không chặn | Tạo ranh giới rõ ràng giữa nội dung cốt lõi bắt buộc và nội dung mở rộng tuỳ chọn |
| `BR-CUR-04` | Ghi danh **ghim `curriculum_version`** | Đổi chương trình giữa chừng làm tiến độ vô nghĩa |
| `BR-CUR-05` | Item bị khoá bậc **không chặn** tiến độ | Người trả gói thấp vẫn phải đi hết được lộ trình mở của họ |
| `BR-CUR-06` | Lời mời nâng cấp hiện **trên bề mặt người lớn**, không trên bề mặt trẻ | `BR-PEN-04` |
| `BR-CUR-07` | Tiến độ tính theo **item bắt buộc mở được**, không theo tổng item | Mẫu số gồm nội dung không mở được làm tiến độ vĩnh viễn dưới 100% |
| `BR-CUR-08` | Curriculum **không có hạn thời gian** — "tuần 3" là thứ tự, không phải lịch | Trẻ nghỉ 2 tuần không nên bị coi là chậm |
| `BR-CUR-09` | Mẫu số tiến độ co giãn theo bậc quyền tại thời điểm đọc; nâng bậc mở lại enrollment `completed` thành `active` nếu tiến độ < 1.0; hạ bậc không tự đặt `completed` | Tránh báo cáo sai lệch khi quyền thay đổi và giữ tính trung thực của tiến độ học tập |
| `BR-CUR-10` | Tuần rỗng-vì-khoá không tự mở tuần sau (trả `week_blocked_by_tier: true`); ghi danh bị chặn 422 nếu không mở được item bắt buộc nào | Ngăn ngừa việc hoàn thành lộ trình ảo trong 0 giây đối với tài khoản không có quyền |

## 7. Data

### 7.0 Ba tầng ghim (`D-MA`)

| Tầng | Ghim gì | Quy tắc |
|---|---|---|
| Cấu trúc lộ trình | Version curriculum tại thời điểm ghi danh | Ghim `curriculum_id` (trỏ bản version cụ thể) trong `curriculum_enrollments` (`BR-CUR-04`) |
| Nội dung một item | Bản `published` mới nhất qua `entity_id`, **không** ghim | Phân giải động qua `entity_id` lúc player tải item (`D-AE`) |
| Dữ liệu chơi đã xảy ra | Version thật đã chơi | Ghim `content_version` ở `play_sessions` (`D-AE`) |

Mọi truy vấn của player đi qua enrollment (theo `D-LV`), không qua con trỏ `child_profiles`.

### 7.1 Trạng thái ghi danh

`active` · `completed` · `withdrawn` · `paused`.
Trong MVP, các luồng nghiệp vụ hoạt động với `active`, `completed`, `withdrawn`. Tối đa 1 enrollment `active` cho mỗi trẻ (`D-MB`).

### 7.2 Tính tiến độ

```
denominator = item bắt buộc, mở được với quyền hiện tại của user, trong curriculum version đã ghim
numerator   = item trong denominator đã có curriculum_item_progress.completed_at
progress    = denominator > 0 ? (numerator / denominator) : 0
```

### 7.3 Bước kế tiếp

```jsonc
{
  "week_no": 3,
  "session_no": 2,
  "item": {
    "entity_type": "game_level",
    "entity_code": "GL-C1-CNT-MATCH-0008",
    "title": "Đếm quả táo",
    "locked": false
  },
  "week_progress": { "done": 3, "total": 5 },
  "curriculum_progress": 0.28,
  "week_blocked_by_tier": false
}
```

## 8. API contract

### `POST /api/users/children/{uuid}/enrollments`

Body `{ curriculum_code }`. 201 → ghim `curriculum_version` hiện tại.
**409** `ALREADY_ENROLLED` (nếu đã có enrollment `active`) · **422** nếu không mở được item bắt buộc nào.

**Đổi 2026-08-29 (`D-SI`):** điều kiện **422 khi tuổi trẻ ngoài khoảng curriculum** đã bỏ. Ghi
danh thành công bất kể tuổi, response mang `age_gap` để giao diện dựng cảnh báo. Lý do và luật
đầy đủ ở [`lesson-flow-model.md`](../05-content/lesson-flow-model.md) `BR-LFM-02`. Quyết định
`D-ME` bị thay thế.

### `POST /api/users/children/{uuid}/enrollments/withdraw`

Đặt enrollment hiện tại sang `withdrawn`, giữ nguyên dữ liệu tiến độ đã đạt.

### `GET /api/users/children/{uuid}/curriculum/next`

200 → §7.3. **404** nếu chưa ghi danh curriculum nào.

### `GET /api/users/children/{uuid}/curriculum/progress`

200 → Chi tiết tiến độ lộ trình, danh sách tuần và trạng thái mở khoá.

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
  Given trẻ ở tuần 3
  When gọi selectVariant cho bước hiện tại
  Then vị trí week_no, session_no, position không đổi

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

Scenario: BR-CUR-09 — đổi bậc quyền cập nhật mẫu số và mở lại enrollment completed
  Given trẻ hoàn thành 100% curriculum ở bậc standard và enrollment là completed
  When người lớn nâng cấp lên premium
  Then mẫu số tăng thêm các item premium
  And curriculum_progress giảm xuống dưới 1.0
  And enrollment quay lại trạng thái active

Scenario: BR-CUR-10 — tuần toàn khoá không tự nhảy qua
  Given tuần 2 có tất cả item bắt buộc đều thuộc bậc premium
  And trẻ thuộc user free
  When lấy bước tiếp theo
  Then week_blocked_by_tier là true
  And tuần 3 không tự động mở
```

## 10. Boundaries

**Always**
- Ghim `curriculum_version` lúc ghi danh.
- Gating từng item.
- Tính tiến độ trên mẫu số mở được tại thời điểm đọc.
- Tối đa 1 enrollment `active` cho mỗi trẻ ở MVP.

**Ask first**
- Đổi luật mở khoá tuần.
- Cho trẻ chọn bước.

**Never**
- Cho adaptive nhảy bước.
- Chặn tiến độ vì item bị khoá bậc lẻ.
- Hiện nội dung thương mại trên bề mặt trẻ.
- Gắn hạn thời gian vào tuần.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Curriculum item trỏ tới bản `published` mới nhất hay ghim version của item?~~ **Đóng 2026-08-09 (D-VER-02 không tồn tại, dùng D-AE, T15)**: `D-VER-02` không có trong corpus — trích dẫn sai. Quyết định thật là **`D-AE`** ở [`content-versioning.md`](../00-foundation/content-versioning.md) §7.4: player đọc curriculum item **luôn theo bản `published` mới nhất** qua `entity_id`, **không ghim**. Khi trẻ **chơi xong** một item, `play_sessions` mới ghim đúng version đã chơi — đó là dữ liệu chơi, khác với tham chiếu cấu trúc curriculum | P3 | Đã đóng | D-AE |
| ~~2~~ | ~~Trẻ ghi danh nhiều curriculum cùng lúc có gây rối không? Cân nhắc giới hạn 1~~ **Đóng 2026-08-11 (`D-MB`)**: Giới hạn tối đa 1 curriculum hoạt động đồng thời cho mỗi trẻ trong MVP để tránh phân tán tiến độ. Ghi danh khi đã có enrollment `active` trả 409 `ALREADY_ENROLLED`. | P3 | Đã đóng | D-MB |
