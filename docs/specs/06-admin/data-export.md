---
spec: DATA-EXPORT
title: Xuất dữ liệu từ quản trị
area: admin
status: draft
mvp: true
phase: P2
reviewed: 2026-08-04
owns:
  - Loại dữ liệu được xuất và giới hạn
  - Ràng buộc bảo vệ khi xuất
depends_on:
  - AUDIT-LOG
  - CHILD-DATA-COMPLIANCE
---

# Xuất dữ liệu từ quản trị

## 1. Objective

Xuất số liệu để phân tích ngoài hệ thống — báo cáo doanh thu, KPI nội dung, đối chiếu kế
toán.

Đây là **bề mặt rò rỉ dữ liệu lớn nhất** trong toàn hệ thống: một file CSV rời khỏi hạ tầng
là không thu hồi được. Vì vậy nó có danh sách đóng, có giới hạn, và mọi lần xuất đều được
audit.

## 2. Actors

`super_admin` duy nhất.

## 3. Entry points

`/exports` · `GET /api/managers/exports/{kind}`.

## 4. Main flow

1. Chọn loại xuất từ **danh sách đóng** §7.1.
2. Chọn khoảng thời gian, trong trần cho phép.
3. Xác nhận + **lý do bắt buộc**.
4. Hệ thống sinh file, trả qua signed URL ngắn hạn.
5. Ghi `audit_logs` `data_exported` kèm loại, khoảng, số hàng, lý do.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Vượt trần hàng | Chia lô hoặc thu hẹp khoảng thời gian |
| Xuất lớn | Chạy job nền, thông báo khi xong |
| Loại không có trong danh sách | ❌ Không có endpoint |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EXP-01` | **Danh sách đóng** §7.1. ❌ Không có xuất tuỳ ý theo SQL | Xuất tuỳ ý là cửa sau vào mọi bảng |
| `BR-EXP-02` | ❌ **NEVER xuất PII của trẻ** ở bất kỳ loại nào | `child-data-compliance` |
| `BR-EXP-03` | Mọi lần xuất ghi audit kèm **lý do bắt buộc** | |
| `BR-EXP-04` | File qua **signed URL ≤15 phút**, ❌ không link công khai | |
| `BR-EXP-05` | Trần **100.000 hàng** mỗi lần xuất | |
| `BR-EXP-06` | Chỉ `super_admin` | |
| `BR-EXP-07` | Rate limit **5 lần/ngày** mỗi Manager | Xuất liên tục là dấu hiệu bất thường |
| `BR-EXP-08` | Email User bị **hash hoặc rút gọn** trong xuất phân tích; hiện đầy đủ **chỉ** trong xuất kế toán | Phân tích không cần định danh người |

## 7. Data

### 7.1 Danh sách đóng loại xuất

| Loại | Cột | PII |
|---|---|---|
| `revenue` | ngày · gói · số đơn · doanh thu · người duyệt | email đầy đủ (kế toán) |
| `subscriptions` | gói · số đang hiệu lực · hết hạn trong 30 ngày · nguồn | email rút gọn |
| `content_kpi` | level · version · lượt chơi · tỉ lệ hoàn thành · tỉ lệ bỏ · hint TB | ❌ không |
| `skill_coverage` | skill · số level published · số LO · lượt tiếp xúc | ❌ không |
| `curriculum_health` | curriculum · tuần · số hoạt động · số trẻ đang học | ❌ không |
| `audit` | §`audit-log-viewer` §8 | actor là Manager |

**Sáu loại.** ❌ Không có loại nào xuất `child_profiles`, `mastery_state`, hay
`telemetry_events` ở mức cá nhân.

### 7.2 Định dạng

CSV UTF-8 có BOM (Excel tiếng Việt). Ngày theo ICT. Số tiền không định dạng.

## 8. API contract

### `GET /api/managers/exports/{kind}`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `super_admin` |
| Query | `from` `to` `reason` |
| 200 | `{ url, expires_at, row_count }` |
| 422 | Vượt trần hàng · thiếu `reason` |
| 429 | Vượt 5 lần/ngày |
| 404 | `kind` không có trong danh sách đóng |

## 9. Acceptance criteria

```gherkin
Scenario: BR-EXP-01 — không có xuất tuỳ ý
  When gọi export với kind không có trong danh sách
  Then trả 404

Scenario: BR-EXP-02 — không xuất PII trẻ
  When xuất mọi loại trong danh sách
  Then không file nào chứa display_name, birth_year, hay child_uuid của trẻ

Scenario: BR-EXP-03 — audit kèm lý do
  When xuất revenue
  Then audit_logs có data_exported với kind, khoảng, row_count, reason

Scenario: BR-EXP-04 — link hết hạn
  Given một file export
  When mở URL sau 20 phút
  Then bị từ chối

Scenario: BR-EXP-05 — trần hàng
  When yêu cầu xuất khoảng thời gian cho 500.000 hàng
  Then trả 422 kèm gợi ý thu hẹp

Scenario: BR-EXP-07 — rate limit
  When xuất 6 lần trong một ngày
  Then lần thứ 6 trả 429

Scenario: BR-EXP-08 — email rút gọn trong xuất phân tích
  When xuất subscriptions
  Then cột email ở dạng rút gọn
  When xuất revenue
  Then email đầy đủ

Scenario: BR-EXP-06 — content_reviewer bị chặn
  Given manager role content_reviewer
  When gọi export
  Then trả 403
```

## 10. Boundaries

**Always**
- Danh sách đóng loại xuất.
- Lý do bắt buộc + audit.
- Signed URL ngắn hạn.

**Ask first**
- Thêm loại xuất.
- Nâng trần hàng hoặc rate limit.
- Thêm cột chứa PII.

**Never**
- Xuất tuỳ ý theo SQL.
- PII của trẻ ở bất kỳ loại nào.
- Link công khai tới file export.
- Xuất không lý do.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có cần xuất tự động định kỳ gửi email không? Tiện cho kế toán nhưng thêm bề mặt rò rỉ | P2 |
