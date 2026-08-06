---
spec: CHILD-PROFILE-ARCHIVE
title: Lưu trữ và xoá hồ sơ trẻ
area: account
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Luồng lưu trữ và xoá một hồ sơ trẻ
depends_on:
  - CHILD-PROFILE-CRUD
  - CHILD-DATA-COMPLIANCE
---

# Lưu trữ và xoá hồ sơ trẻ

## 1. Objective

Gỡ một hồ sơ trẻ khỏi danh sách **mà không mất dữ liệu ngay**, và xoá thật khi phụ huynh
thực sự muốn.

Hai thao tác khác nhau: **lưu trữ** là dọn dẹp; **xoá** là thực thi quyền của chủ thể dữ
liệu.

## 2. Actors

User sở hữu hồ sơ. Admin ❌ chỉ lưu trữ theo yêu cầu, ❌ không xoá.

## 3. Entry points

`/me/children/{uuid}` · `POST /api/users/children/{uuid}/archive` · `/restore` ·
`DELETE /api/users/children/{uuid}`.

## 4. Main flow — lưu trữ

1. Chọn "Lưu trữ hồ sơ".
2. Nêu hậu quả: trẻ không chơi tiếp được, dữ liệu **giữ nguyên**, khôi phục bất cứ lúc nào.
3. Xác nhận → `status = archived`, giải phóng **một suất quota**.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Khôi phục | `status = active`, cần còn quota |
| Khôi phục khi hết quota | **402**, gợi ý lưu trữ trẻ khác hoặc nâng gói |
| Xoá vĩnh viễn | Xác nhận bằng **gõ tên trẻ**, xoá sau **30 ngày** |
| Huỷ xoá trong 30 ngày | Khôi phục hoàn toàn |
| Trẻ đang là `active_child_id` | Xoá cookie trước khi lưu trữ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CPR-01` | Lưu trữ **giữ nguyên** mọi dữ liệu | Phụ huynh có thể chỉ muốn dọn danh sách |
| `BR-CPR-02` | Lưu trữ **giải phóng quota** | Nếu không thì lưu trữ vô nghĩa với người tới hạn |
| `BR-CPR-03` | Xoá vĩnh viễn có **30 ngày hoàn tác** | Đối xứng với xoá tài khoản |
| `BR-CPR-04` | Xoá xác nhận bằng **gõ tên trẻ** | Một nút "Xoá" là quá dễ bấm cho thao tác này |
| `BR-CPR-05` | Xoá → `telemetry_events` **ẩn danh**, ❌ không xoá cứng | `BR-CDC-10` |
| `BR-CPR-06` | Admin ❌ **NEVER xoá** hồ sơ trẻ | `BR-CPA-07` |
| `BR-CPR-07` | Trẻ `archived` ❌ không chơi được, nhưng **báo cáo vẫn xem được** | Phụ huynh vẫn có quyền với dữ liệu đã thu |
| `BR-CPR-08` | Lưu trữ ❌ **không cần** Parent Gate; **xoá thì cần mật khẩu** | Mức độ hậu quả khác nhau |

## 7. Data

### 7.1 Ba trạng thái

| `status` | Chơi được | Trong danh sách | Tính quota | Dữ liệu |
|---|:--:|:--:|:--:|---|
| `active` | ✅ | ✅ | ✅ | nguyên |
| `archived` | ❌ | mục "đã lưu trữ" | ❌ | nguyên |
| `pending_deletion` | ❌ | mục "sắp xoá" + đếm ngược | ❌ | xoá sau 30 ngày |

### 7.2 Phạm vi xoá

```
DELETE mastery_state, level_params, play_sessions, child_session_summaries,
       child_daily_stats, curriculum_enrollments, curriculum_item_progress
UPDATE telemetry_events SET child_uuid = NULL
DELETE child_profiles
```

## 8. API contract

### `POST /api/users/children/{uuid}/archive` · `/restore`

restore: **402** `CHILD_LIMIT_EXCEEDED` nếu hết quota.

### `DELETE /api/users/children/{uuid}`

Body `{ password, confirm_name }`. 200 → `{ purge_at }`.
401 sai mật khẩu · 422 `confirm_name` không khớp.

### `POST /api/users/children/{uuid}/delete/cancel`

Chỉ trong 30 ngày.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CPR-01 — lưu trữ giữ dữ liệu
  Given trẻ có 50 phiên chơi
  When lưu trữ hồ sơ
  Then số hàng play_sessions và mastery_state không đổi

Scenario: BR-CPR-02 — lưu trữ giải phóng quota
  Given user gói standard có 3 trẻ active
  When lưu trữ một trẻ
  Then tạo được trẻ mới

Scenario: khôi phục khi hết quota bị chặn
  Given user đã có 3 trẻ active và 1 archived
  When khôi phục trẻ archived
  Then trả 402

Scenario: BR-CPR-04 — xoá cần gõ tên
  When gọi DELETE với confirm_name sai
  Then trả 422

Scenario: BR-CPR-03 — hoàn tác trong 30 ngày
  Given đã yêu cầu xoá trẻ 10 ngày trước
  When huỷ
  Then hồ sơ trở lại archived và dữ liệu còn nguyên

Scenario: BR-CPR-05 — telemetry ẩn danh sau xoá
  Given trẻ bị purge
  Then telemetry_events còn hàng với child_uuid NULL

Scenario: BR-CPR-07 — archived vẫn xem báo cáo
  Given trẻ archived
  When mở báo cáo
  Then xem được, chế độ chỉ đọc

Scenario: BR-CPR-06 — admin không xoá được
  When quét route admin
  Then không route nào DELETE child_profiles
```

## 10. Boundaries

**Always**
- Lưu trữ giữ nguyên dữ liệu và giải phóng quota.
- Xoá cần mật khẩu + gõ tên.
- Ẩn danh telemetry thay vì xoá cứng.

**Ask first**
- Đổi thời hạn 30 ngày.
- Bỏ yêu cầu gõ tên khi xoá.

**Never**
- Admin xoá hồ sơ trẻ.
- Xoá ngay không có thời gian hoàn tác.
- Chặn xem báo cáo của trẻ đã lưu trữ.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Trẻ sang 7 tuổi có tự động archive không, hay để phụ huynh quyết định? | `child-profile-crud` Q2 |
