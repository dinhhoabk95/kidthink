---
spec: AUDIT-LOG-VIEWER
title: Xem nhật ký kiểm toán
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Bề mặt tra cứu audit
depends_on:
  - AUDIT-LOG
  - ADMIN-AUTH
---

# Xem nhật ký kiểm toán

## 1. Objective

Trả lời **"ai đổi gì lúc nào"** trong vài giây khi có sự cố.

Nhật ký không tra cứu được là nhật ký không tồn tại. Đó là lý do bề mặt này có mặt ở MVP
thay vì để "sau này viết query tay".

## 2. Actors

`super_admin` **duy nhất**. `content_reviewer` không truy cập.

## 3. Entry points

`/audit` · `GET /api/managers/audit-logs` · link từ chi tiết entity ("xem lịch sử").

## 4. Main flow

1. Mở `/audit`, mặc định 24 giờ gần nhất.
2. Lọc theo actor, action, entity, khoảng thời gian.
3. Mở một hàng → xem `before_data`/`after_data` dạng **diff**, không dump JSON thô.
4. Từ một entity bất kỳ (level, user, đơn) mở được lịch sử của riêng nó.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Khoảng thời gian quá rộng | Ép trần 90 ngày mỗi truy vấn |
| `before`/`after` lớn | Hiện diff rút gọn + nút xem đầy đủ |
| Không có kết quả | Nói rõ bộ lọc nào đang áp |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ALV-01` | **Chỉ đọc**. Cấm xoá, không sửa, không export tuỳ tiện | `audit_logs` là INSERT-only |
| `BR-ALV-02` | Chỉ `super_admin` | `BR-AUD-09` |
| `BR-ALV-03` | Trần phân trang **200** | Ngăn ngừa truy vấn quá lớn hạ gục instance DB trên t3.small |
| `BR-ALV-04` | Hiện diff, không dump JSON thô | JSON thô không đọc được khi đang xử lý sự cố |
| `BR-ALV-05` | Từ mọi entity có audit, có link "xem lịch sử" | Tra cứu bắt đầu từ đối tượng, không từ danh sách phẳng |
| `BR-ALV-06` | Export audit **là hành động được audit** (`data_exported`) | Đảm bảo mọi thao tác trích xuất dữ liệu nhạy cảm đều được ghi lại để chống lậu hoặc rò rỉ dữ liệu |
| `BR-ALV-07` | Cấm — **NEVER hiện PII của trẻ**, mật khẩu, hay token — chúng vốn không có trong bảng | Lưới an toàn thứ hai |

## 7. Data

### 7.1 Bộ lọc

`actor_type` · `actor_id` · `action` (multi-select từ 28 hành động) · `entity_type` ·
`entity_id` · `from` `to` (trần 90 ngày) · `q` (tìm trong `reason`) · `limit` ≤200 · `cursor`.

### 7.2 Cột

Thời gian (ICT) · Actor (loại + tên) · Action (nhãn tiếng Việt) · Entity · Tóm tắt thay đổi
· IP.

### 7.3 Chi tiết một hàng

Diff field-by-field · `reason` · IP · user agent · `request_id` để nối với `error_log`.

## 8. API contract

### `GET /api/managers/audit-logs`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `super_admin` |
| Query | §7.1 |
| 200 | `{ items, next_cursor }` |
| 403 | `INSUFFICIENT_ROLE` |
| 422 | Khoảng thời gian > 90 ngày |

### `GET /api/managers/audit-logs/export`

CSV, trần 10.000 hàng, ghi audit `data_exported`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ALV-02 — chỉ super_admin
  Given manager role content_reviewer
  When gọi GET /api/managers/audit-logs
  Then trả 403

Scenario: BR-ALV-01 — không sửa được
  When quét route audit
  Then không route nào PATCH hay DELETE audit_logs

Scenario: BR-ALV-04 — hiện diff không dump JSON
  Given một hàng audit có before và after
  When mở chi tiết
  Then hiện danh sách field đã đổi
  And không hiện chuỗi JSON thô

Scenario: BR-ALV-03 — trần phân trang
  When gọi với limit = 5000
  Then trả không quá 200 hàng

Scenario: BR-ALV-06 — export được audit
  When export CSV
  Then audit_logs có hàng data_exported

Scenario: BR-ALV-05 — mở lịch sử từ entity
  Given một game level
  When bấm "xem lịch sử"
  Then audit đã lọc sẵn theo entity đó

Scenario: khoảng thời gian quá rộng bị chặn
  When truy vấn khoảng 200 ngày
  Then trả 422
```

## 10. Boundaries

**Always**
- Chỉ đọc, chỉ `super_admin`.
- Hiện diff.
- Ghi audit khi export.

**Ask first**
- Nâng trần 90 ngày hoặc 200 hàng.
- Cho role khác đọc.

**Never**
- Sửa hoặc xoá audit.
- Dump JSON thô.
- Export không giới hạn.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Khi `audit_logs` lớn, tìm theo `reason` có cần full-text index không? | P2 | MVP dùng `ilike` cơ bản với trần 90 ngày; full-text index hoãn sang P4 | người quyết |
