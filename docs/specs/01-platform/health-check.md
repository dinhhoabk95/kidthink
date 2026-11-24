---
spec: HEALTH-CHECK
title: Health check dịch vụ
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-10-18
owns:
  - Endpoint health và ngữ nghĩa mã trả về
  - Danh sách dịch vụ critical
depends_on:
  - DATA-MODEL-OVERVIEW
---

# Health check dịch vụ

## 1. Objective

Trả lời **thật** câu hỏi "instance này phục vụ được không". Load balancer và người trực đều
tin vào nó, nên nó không được nói dối.

> Health check luôn trả 200 **tệ hơn** không có health check — nó làm hạ tầng tin vào một
> instance đã chết.

## 2. Actors

| Actor | Dùng để |
|---|---|
| Cloudflare | Quyết định gửi traffic |
| Workflow deploy | Smoke sau khi deploy |
| Giám sát | Phát alert |

## 3. Entry points

| Route | Auth | Làm gì |
|---|---|---|
| `GET`/`HEAD /api/guest/health` | không; rate limit `read:public` | Liveness nông: 200 `{status:"ok"}`, **không** chạm D1, DO auth hay queue DO |
| `GET /api/guest/health/deep` | header `x-health-token` = `HEALTHCHECK_TOKEN` | Kiểm sâu ba dịch vụ §7.1, 200/503, alert khi fail |

## 4. Main flow

1. Kiểm **song song** ba dịch vụ §7.1, mỗi cái timeout 2 giây.
2. Đủ ba → **200**. Bất kỳ dịch vụ critical nào fail → **503**.
3. Trả chi tiết từng dịch vụ để chẩn đoán.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Timeout một dịch vụ | Coi là fail |
| Dịch vụ không critical (queue) fail | **503** — job im lặng không chạy là chế độ hỏng thật |
| Đang khởi động | 503 tới khi migration và kết nối sẵn sàng |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-HLT-01` | Cấm — **NEVER trả 200 cứng** | Làm LB tin vào instance đã chết |
| `BR-HLT-02` | Kiểm dịch vụ **thật** — `SELECT 1` qua Drizzle (D1/SQLite), write/read/delete sentinel ở auth keyspace (`AuthCoordinatorDO`), đếm queue (`JobQueueDO`) | Kiểm biến môi trường hoặc chỉ `PING` không chứng minh session store ghi/đọc được |
| `BR-HLT-03` | 503 **phải được thông báo cho người** | Health check không alerting chỉ là một endpoint |
| `BR-HLT-04` | Response **không lộ** version, hostname, hay chuỗi kết nối | Bề mặt công khai |
| `BR-HLT-05` | Timeout mỗi dịch vụ ≤ 2s, tổng ≤ 3s | Health check chậm bị LB coi là fail |
| `BR-HLT-06` | Deploy **abort và revert** khi smoke non-200 (smoke gọi route sâu `/health/deep` kèm token) | Tiếp deploy lên instance hỏng là tản traffic vào ổ đã biết chết |
| `BR-HLT-07` | Health công khai (`GET`/`HEAD /api/guest/health`) Cấm — **NEVER** chạm D1, DO auth hay queue DO và chỉ trả liveness nông; kiểm sâu chỉ sau `x-health-token` so khớp **thời gian hằng** với `HEALTHCHECK_TOKEN`, sai/thiếu/chưa cấu hình → 404. Cả hai nằm trong bucket `read:public` | Route công khai, miễn rate limit, mỗi lần gọi ghi DO auth + D1 + queue DO và phát alert: flood làm nghẽn DO `global-auth-v1` |

## 7. Data

### 7.1 Dịch vụ kiểm

| Dịch vụ | Cách kiểm | Critical |
|---|---|---|
| D1 (production) / SQLite (dev, test) | `SELECT 1` qua Drizzle | Có |
| Auth session (`AuthCoordinatorDO`) | write/read/delete sentinel ở auth keyspace; chỉ kiểm khi binding `AUTH_COORDINATOR` có mặt; failure làm readiness 503 | Có |
| Queue (`JobQueueDO`) | Đếm `waiting`; chỉ kiểm khi binding `JOB_QUEUE_DO` có mặt | Có |

Trạng thái hiện tại (2026-11-25): runtime `sqlite` (dev/test) chỉ kiểm DB; runtime `d1` kiểm DB cộng hai Durable Object nếu binding có. Valkey/BullMQ không còn là phụ thuộc runtime của health check (chỉ còn adapter dev local, sẽ gỡ đợt sau).

### 7.2 Response

```jsonc
// 200
{ "status": "ok", "checks": { "db": "ok", "cache": "ok", "auth": "ok", "queue": "ok" } }
// 503
{ "status": "degraded", "checks": { "db": "ok", "cache": "ok", "auth": "fail", "queue": "unknown" } }
```

Cấm `version`, không `hostname`, không thời gian uptime.

## 8. API contract

### `GET`/`HEAD /api/guest/health`

| | |
|---|---|
| Auth | không |
| 200 | Luôn (liveness); HEAD không body |
| Header | `Cache-Control: no-store` |

### `GET /api/guest/health/deep`

| | |
|---|---|
| Auth | header `x-health-token` |
| 200 | Mọi dịch vụ critical ok |
| 503 | Ít nhất một dịch vụ critical fail |
| 404 | Thiếu/sai token hoặc `HEALTHCHECK_TOKEN` chưa cấu hình |
| Header | `Cache-Control: no-store` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-HLT-01 — DB chết thì trả 503
  Given D1/SQLite không truy cập được
  When gọi GET /api/guest/health/deep kèm token đúng
  Then trả 503
  And checks.db là fail

Scenario: BR-HLT-07 — probe công khai không chạm DO
  When gọi GET hoặc HEAD /api/guest/health
  Then trả 200 mà không truy cập D1, DO auth hay queue
  And gọi /api/guest/health/deep thiếu hoặc sai token thì trả 404

Scenario: BR-HLT-02 — kiểm dịch vụ thật
  When quét implementation của health check
  Then có truy vấn DB thật và đếm queue thật
  And auth keyspace thực hiện write/read/delete sentinel thành công
  And sentinel không còn tồn tại sau phép kiểm

Scenario: BR-HLT-04 — không lộ thông tin hệ thống
  When gọi health check
  Then body không chứa version, hostname, hay chuỗi kết nối

Scenario: BR-HLT-05 — phản hồi đủ nhanh
  Given mọi dịch vụ bình thường
  When gọi health check 100 lần
  Then P95 dưới 3 giây

Scenario: BR-HLT-06 — deploy revert khi smoke fail
  Given deploy vừa reload process
  When smoke trả non-200
  Then script abort và revert
```

## 10. Boundaries

**Always**
- Kiểm dịch vụ thật, song song, có timeout.
- `no-store`.
- Alert khi 503.

**Ask first**
- Thêm dịch vụ vào danh sách kiểm.
- Đổi một dịch vụ từ critical sang non-critical.

**Never**
- Trả 200 cứng.
- Lộ version, hostname, chuỗi kết nối.
- Deploy tiếp khi smoke fail.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có cần tách `/health/live` và `/health/ready` không? Hiện một endpoint làm cả hai vai | Vận hành | P1 | Infra |
