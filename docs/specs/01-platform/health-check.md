---
spec: HEALTH-CHECK
title: Health check dịch vụ
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-13
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
| Nginx / LB | Quyết định gửi traffic |
| Deploy script | Smoke sau khi reload |
| Giám sát | Phát alert |

## 3. Entry points

`GET /api/guest/health` — công khai, không rate limit, không auth.

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
| `BR-HLT-02` | Kiểm dịch vụ **thật** — `SELECT 1` qua Drizzle, `PING` Valkey cache, write/read/delete sentinel ở auth keyspace, đếm queue | Kiểm biến môi trường hoặc chỉ `PING` không chứng minh session store ghi/đọc được |
| `BR-HLT-03` | 503 **phải được thông báo cho người** | Health check không alerting chỉ là một endpoint |
| `BR-HLT-04` | Response **không lộ** version, hostname, hay chuỗi kết nối | Bề mặt công khai |
| `BR-HLT-05` | Timeout mỗi dịch vụ ≤ 2s, tổng ≤ 3s | Health check chậm bị LB coi là fail |
| `BR-HLT-06` | Deploy **abort và revert** khi smoke non-200 | Tiếp deploy lên instance hỏng là tản traffic vào ổ đã biết chết |

## 7. Data

### 7.1 Dịch vụ kiểm

| Dịch vụ | Cách kiểm | Critical |
|---|---|---|
| PostgreSQL | `SELECT 1` qua Drizzle | Có |
| Valkey cache/rate limit | `PING` | Có |
| Valkey auth session | `PING` + write/read/delete sentinel ở auth keyspace; failure làm readiness 503 | Có |
| BullMQ | Đếm `waiting` | Có |

### 7.2 Response

```jsonc
// 200
{ "status": "ok", "checks": { "db": "ok", "cache": "ok", "auth": "ok", "queue": "ok" } }
// 503
{ "status": "degraded", "checks": { "db": "ok", "cache": "ok", "auth": "fail", "queue": "unknown" } }
```

Cấm `version`, không `hostname`, không thời gian uptime.

## 8. API contract

### `GET /api/guest/health`

| | |
|---|---|
| Auth | không |
| 200 | Mọi dịch vụ critical ok |
| 503 | Ít nhất một dịch vụ critical fail |
| Header | `Cache-Control: no-store` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-HLT-01 — DB chết thì trả 503
  Given PostgreSQL không truy cập được
  When gọi GET /api/guest/health
  Then trả 503
  And checks.db là fail

Scenario: BR-HLT-02 — kiểm dịch vụ thật
  When quét implementation của health check
  Then có truy vấn DB thật, PING Valkey cache thật, và đếm queue thật
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
