---
spec: MONITORING-AND-ALERTING
title: Giám sát và cảnh báo
area: platform
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Danh sách metric và ngưỡng alert
  - Kênh nhận alert
  - Định nghĩa SLO
depends_on:
  - HEALTH-CHECK
  - JOB-QUEUE
---

# Giám sát và cảnh báo

## 1. Objective

v1 có health check trả 503 đúng cách và **không ai được thông báo**. Một health check không
có alerting chỉ là một endpoint.

Alert phải **tới được người**, không chỉ ghi vào log mà không ai đọc.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Ứng dụng | Phát metric và log có cấu trúc |
| Hệ thống giám sát | Thu thập, đánh giá ngưỡng |
| Người trực | Nhận alert, xử lý theo runbook |

## 3. Entry points

| Nơi | |
|---|---|
| `/api/guest/health` | Kiểm dịch vụ phụ thuộc |
| `infra/monitoring/alerts.yml` | Định nghĩa ngưỡng |
| `06-admin/system-activity.md` | Bề mặt xem trong admin |

## 4. Main flow

1. Ứng dụng ghi log có cấu trúc + phát metric.
2. Bộ thu thập gom theo chu kỳ.
3. Quy tắc đánh giá ngưỡng §7.2.
4. Vi phạm → alert tới kênh §7.3, kèm link runbook.
5. Alert được xác nhận và đóng, ghi lại thời gian phản hồi.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Alert lặp | Gộp trong cửa sổ 15 phút, ❌ không spam |
| Hệ thống giám sát chết | Heartbeat ngoài — dead-man switch |
| Alert giả nhiều lần | Điều chỉnh ngưỡng, ❌ **NEVER tắt alert** |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MON-01` | Alert **tới người**, ❌ không chỉ ghi log | Log không ai đọc bằng không có |
| `BR-MON-02` | Mỗi alert có **runbook** kèm theo | Alert không nói làm gì tiếp thì người trực đoán |
| `BR-MON-03` | ❌ **NEVER tắt một alert** để giảm ồn — sửa ngưỡng hoặc sửa nguyên nhân | Alert bị tắt là điểm mù vĩnh viễn |
| `BR-MON-04` | Có **dead-man switch** — hệ thống giám sát im lặng cũng là alert | Giám sát chết trông giống mọi thứ đều ổn |
| `BR-MON-05` | Log ❌ **NEVER chứa PII của trẻ**, mật khẩu, hay token | |
| `BR-MON-06` | Lỗi client được thu về `error_log` với sampling | Lỗi trên tablet của người dùng không thấy được từ server |
| `BR-MON-07` | Go-live ❌ **không được** khi chưa có alert cho §7.2 nhóm P0 | |

## 7. Data

### 7.1 SLO

| SLO | Mục tiêu |
|---|---|
| Uptime | 99,7% |
| API P95 | < 800 ms |
| Game engine FPS | 60 trên tablet chuẩn |
| Thời gian xử lý payment request | P90 < 12 giờ |

### 7.2 Alert

**P0 — gọi người ngay**

| Alert | Ngưỡng | Runbook |
|---|---|---|
| Health check 503 | 2 lần liên tiếp | Kiểm DB, Valkey, queue |
| Lỗi 5xx | > 5% trong 5 phút | Xem `error_log` |
| DB không kết nối được | ngay | Kiểm container, disk |
| Backup fail | ngay | `backup-and-restore` §7.3 |
| Backup verify fail | ngay | idem |
| Worker backlog | > 500 job / 5 phút | Kiểm worker process |
| Disk còn | < 15% | Dọn log, archive telemetry |

**P1 — trong giờ làm việc**

| Alert | Ngưỡng |
|---|---|
| API P95 | > 800 ms trong 15 phút |
| Job fail | > 10 / giờ |
| Đơn thanh toán chờ | > 20 hoặc đơn cũ nhất > 24 giờ |
| Nội dung `in_review` tồn đọng | > 50 |
| Tỉ lệ bỏ game một level | > 40% trong 7 ngày |

**P2 — báo cáo hàng tuần**

Level lượt chơi thấp · skill thiếu nội dung · tuần curriculum chưa đủ hoạt động ·
chi phí LLM tích luỹ.

### 7.3 Kênh

| Mức | Kênh |
|---|---|
| P0 | Kênh trực tiếp tới người (chốt ở §11) + email |
| P1 | Email + dashboard admin |
| P2 | Báo cáo tổng hợp hàng tuần |

### 7.4 Log có cấu trúc

```jsonc
{ "level": "error", "ts": "...", "request_id": "...", "actor_type": "user", "actor_id": 123,
  "route": "/api/users/levels", "code": "TIER_LOCKED", "duration_ms": 42 }
```

❌ Không tên trẻ, không `child_uuid`, không email, không token.

## 8. API contract

### `GET /api/managers/system/metrics`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `super_admin` |
| 200 | Snapshot SLO + alert đang mở |

## 9. Acceptance criteria

```gherkin
Scenario: BR-MON-01 — 503 phát alert tới người
  Given DB không truy cập được
  When health check trả 503 hai lần liên tiếp
  Then một alert P0 được gửi tới kênh trực tiếp
  And không chỉ ghi vào log

Scenario: BR-MON-04 — dead-man switch
  Given hệ thống giám sát ngừng gửi heartbeat 10 phút
  Then một alert được phát từ kênh độc lập

Scenario: BR-MON-05 — log không chứa PII
  Given một request lỗi liên quan tới dữ liệu trẻ
  When đọc log tương ứng
  Then không có display_name, birth_year, email, hay token

Scenario: BR-MON-02 — alert kèm runbook
  When bất kỳ alert P0 nào được phát
  Then nội dung alert chứa link runbook

Scenario: BR-MON-07 — go-live bị chặn khi thiếu alert P0
  Given một alert trong nhóm P0 chưa được cấu hình
  When chạy checklist go-live
  Then checklist fail tại mục giám sát

Scenario: alert lặp được gộp
  Given cùng một điều kiện lỗi kéo dài 1 giờ
  Then số alert gửi đi không vượt 4
```

## 10. Boundaries

**Always**
- Gắn runbook vào mọi alert.
- Dead-man switch cho chính hệ thống giám sát.
- Log có cấu trúc, có `request_id`.

**Ask first**
- Đổi ngưỡng alert.
- Thêm alert mới.
- Đổi kênh nhận.

**Never**
- Tắt alert để giảm ồn.
- PII, mật khẩu, hay token trong log.
- Go-live thiếu alert P0.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | **Kênh P0 là gì và ai trực?** Chưa có người trực thì alert P0 không có nghĩa | Go-live |
| 2 | Dùng Sentry + Grafana hay dịch vụ gộp? Trên t3.small self-host Grafana tốn RAM | Ngân sách |
| 3 | SLO 99,7% có ràng buộc hợp đồng nào không, hay chỉ mục tiêu nội bộ? | Cam kết |
