---
spec: SYSTEM-ACTIVITY
title: Trạng thái hệ thống trong quản trị
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Bề mặt xem sức khoẻ hệ thống trong admin
depends_on:
  - HEALTH-CHECK
  - JOB-QUEUE
  - BACKUP-AND-RESTORE
  - MONITORING-AND-ALERTING
---

# Trạng thái hệ thống trong quản trị

## 1. Objective

Một màn hình cho câu hỏi **"hệ thống có ổn không"** mà không cần SSH.

Nó không thay hệ thống giám sát — alert vẫn đi tới người qua kênh riêng. Màn hình này là
nơi xác nhận và tra cứu sau khi nhận alert.

## 2. Actors

`super_admin` duy nhất.

## 3. Entry points

`/system` · `GET /api/managers/system/status`.

## 4. Main flow

1. Mở `/system`.
2. Bốn nhóm §7 hiện trạng thái hiện tại + `as_of`.
3. Mỗi mục bất thường có link tới runbook.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Dịch vụ down | Nhóm đó đỏ, kèm thời điểm phát hiện |
| Không lấy được số liệu | Hiện "không xác định", không hiện xanh |
| Backup chưa verify lần nào | Cảnh báo mức cao, chặn checklist go-live |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SYS-01` | Cấm — **NEVER hiện xanh khi không lấy được số liệu** | Không biết ≠ ổn |
| `BR-SYS-02` | Màn hình này **không thay** alerting | Người phải được gọi, không phải tự vào xem |
| `BR-SYS-03` | Mỗi mục bất thường có link runbook | `BR-MON-02` |
| `BR-SYS-04` | Cấm — **NEVER hiện chuỗi kết nối, secret, hay biến môi trường** | Bảo vệ an toàn thông tin hạ tầng và ngăn ngừa nguy cơ lộ bí mật hệ thống theo `BR-SEC-01` |
| `BR-SYS-05` | Chỉ `super_admin` | Giới hạn quyền giám sát hạ tầng cho đúng vai trò quản trị tối cao theo `BR-ADA-02` |
| `BR-SYS-06` | Backup chưa verify → cảnh báo mức cao | `BR-BAK-06` |

## 7. Data

| Nhóm | Mục |
|---|---|
| **Dịch vụ** | PostgreSQL · Valkey · Queue — trạng thái + độ trễ |
| **Job** | Backlog `waiting` · `failed` 24h · job cũ nhất · lần chạy cuối mỗi job định kỳ |
| **Backup** | Dump gần nhất (thời gian, dung lượng) · verify gần nhất (kết quả) · DR drill gần nhất |
| **Lỗi** | 5xx 24h · lỗi client 24h · alert đang mở |

## 8. API contract

### `GET /api/managers/system/status`

200 → bốn nhóm §7 kèm `as_of`. `Cache-Control: no-store`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SYS-01 — không xác định không hiện xanh
  Given không lấy được số liệu queue
  When mở /system
  Then nhóm job hiện "không xác định"
  And không hiện trạng thái ổn

Scenario: BR-SYS-06 — backup chưa verify cảnh báo
  Given chưa có lần verify thành công nào
  When mở /system
  Then nhóm backup cảnh báo mức cao

Scenario: BR-SYS-04 — không lộ cấu hình
  When đọc response
  Then không có chuỗi kết nối, secret, hay biến môi trường

Scenario: BR-SYS-03 — link runbook
  Given một dịch vụ đang down
  Then mục đó có link tới runbook tương ứng

Scenario: BR-SYS-05 — content_reviewer bị chặn
  Given manager role content_reviewer
  When gọi GET /api/managers/system/status
  Then trả 403
```

## 10. Boundaries

**Always**
- Phân biệt "không xác định" với "ổn".
- Link runbook cho mục bất thường.

**Ask first**
- Thêm nhóm hoặc mục theo dõi.

**Never**
- Hiện xanh khi không có số liệu.
- Lộ chuỗi kết nối hay secret.
- Coi màn hình này là thay thế alerting.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Có cho phép thao tác vận hành từ đây (retry job, chạy backup) không? Tiện nhưng mở bề mặt rủi ro | P2 | MVP không hỗ trợ thao tác trực tiếp trên dashboard; chỉ hiển thị trạng thái và link sang công cụ vận hành riêng | người quyết |
