---
spec: FEATURE-FLAGS-ADMIN
title: Quản lý cờ tính năng
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Bề mặt bật/tắt cờ trong admin
depends_on:
  - FEATURE-FLAG-SERVICE
  - AUDIT-LOG
---

# Quản lý cờ tính năng

## 1. Objective

Tắt nhanh một tính năng hỏng **mà không cần deploy**. Đó là toàn bộ giá trị của màn hình
này — và nó chỉ có giá trị nếu thao tác mất dưới 30 giây.

## 2. Actors

`super_admin` duy nhất. `content_reviewer` không thấy.

## 3. Entry points

`/flags` · `GET /api/managers/feature-flags` · `PATCH /api/managers/feature-flags/{key}`.

## 4. Main flow

1. Mở `/flags`, thấy mọi cờ khai báo trong code.
2. Mỗi cờ hiện: trạng thái, phạm vi, mặc định an toàn, **ngày hết hạn**, ai đổi lần cuối.
3. Bật/tắt → nhập **lý do bắt buộc** → xác nhận.
4. Có hiệu lực trong ≤30 giây (TTL cache).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Cờ quá hạn | Đánh dấu đỏ, hiện số ngày quá hạn |
| Cờ không có trong code | Hiện "mồ côi", gợi ý xoá khỏi DB |
| Cờ trong code chưa có hàng DB | Hiện với giá trị mặc định |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-FFA-01` | Đổi cờ **bắt buộc lý do** ≥10 ký tự, ghi audit | `BR-FLG-04` |
| `BR-FFA-02` | Hiện **ngày hết hạn** và cảnh báo khi quá | Cờ vĩnh viễn là nhánh code chết |
| `BR-FFA-03` | Chỉ `super_admin` | Giới hạn quyền thao tác hạ tầng cho đúng vai trò quản trị tối cao theo `BR-ADA-02` |
| `BR-FFA-04` | Danh sách cờ **suy từ code**, không từ DB | DB có thể có cờ mồ côi; code là nguồn sự thật |
| `BR-FFA-05` | Hiện **mặc định an toàn** cạnh trạng thái hiện tại | Người bấm cần biết fallback là gì |
| `BR-FFA-06` | Cấm — **NEVER cờ gate ràng buộc tuân thủ** — không hiện cờ nào như vậy | `BR-FLG-06` |

## 7. Data

| Cột | Nội dung |
|---|---|
| Key | `snake_case` |
| Mô tả | Từ khai báo trong code |
| Trạng thái | on/off |
| Mặc định an toàn | |
| Phạm vi | global / user_ids / percentage |
| Hết hạn | ngày + cảnh báo |
| Đổi lần cuối | ai, khi nào, lý do |

## 8. API contract

### `GET /api/managers/feature-flags`

200 → danh sách hợp nhất code + DB.

### `PATCH /api/managers/feature-flags/{key}`

Body `{ enabled, scope, scope_value, reason }`. 422 khi `reason` quá ngắn.
403 với `content_reviewer`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-FFA-01 — đổi cờ bắt buộc lý do
  When PATCH với reason rỗng
  Then trả 422
  And cờ không đổi

Scenario: BR-FFA-04 — danh sách suy từ code
  Given một hàng feature_flags trong DB không có khai báo trong code
  When mở /flags
  Then cờ đó hiện dạng mồ côi

Scenario: BR-FFA-02 — cảnh báo cờ quá hạn
  Given một cờ có expires_at đã qua
  Then hiện đỏ kèm số ngày quá hạn

Scenario: hiệu lực nhanh
  When tắt một cờ
  Then trong 30 giây ứng dụng phản ánh trạng thái mới

Scenario: BR-FFA-03 — content_reviewer bị chặn
  Given manager role content_reviewer
  When gọi GET /api/managers/feature-flags
  Then trả 403

Scenario: BR-FFA-01 — audit đầy đủ
  When đổi một cờ
  Then audit_logs có feature_flag_changed kèm before, after, reason
```

## 10. Boundaries

**Always**
- Lý do bắt buộc + audit.
- Hiện hạn và mặc định an toàn.
- Suy danh sách từ code.

**Ask first**
- Thêm cờ mới (khai báo trong code trước).
- Gia hạn một cờ.

**Never**
- Đổi cờ không lý do.
- Cờ gate ràng buộc tuân thủ.
- Cho `content_reviewer` truy cập.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Có cần lịch sử đổi cờ ngay trên màn hình không, hay tra audit là đủ? | P2 | MVP hiện thông tin lần đổi gần nhất trên thẻ cờ; xem lịch sử đầy đủ qua [`audit-log-viewer.md`](audit-log-viewer.md) | người quyết |
