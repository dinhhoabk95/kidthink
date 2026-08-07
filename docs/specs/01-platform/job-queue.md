---
spec: JOB-QUEUE
title: Hàng đợi job nền
area: platform
status: approved
mvp: true
phase: P1
reviewed: 2026-08-07
owns:
  - Danh sách job và lịch chạy
  - Quy tắc retry và idempotency
  - Ranh giới producer/consumer
depends_on:
  - DATA-MODEL-OVERVIEW
---

# Hàng đợi job nền

## 1. Objective

Việc chậm, việc theo lịch, và việc được phép thất bại không nằm trong đường request.
BullMQ trên Valkey; producer ở `packages/queue`, consumer ở `apps/worker`.

Bài học đắt nhất từ v1: **worker bị tắt mà không ai biết**. Producer vẫn đẩy job, không
consumer nào lấy ra, email và export im lặng không chạy. Spec này ép alert cho tình huống
đó thành điều kiện go-live.

## 2. Actors

| Actor | Vai trò |
|---|---|
| `packages/queue` | Định nghĩa job + producer. ❌ Không chứa consumer |
| `apps/worker` | Consumer. ❌ Không có HTTP endpoint |
| Scheduler | Repeatable job của BullMQ |
| Monitoring | Theo dõi backlog và tỉ lệ fail |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/queue/src/jobs/` | Định nghĩa + type payload |
| `apps/worker/src/consumers/` | Xử lý |
| `GET /api/guest/health` | Báo trạng thái queue |

## 4. Main flow

1. Producer đẩy job kèm `jobId` **xác định** (khoá nghiệp vụ).
2. BullMQ khử trùng theo `jobId`.
3. Consumer xử lý, **idempotent**.
4. Thành công → xoá khỏi queue, ghi metric. Thất bại → retry backoff.
5. Hết retry → `failed` queue + **alert**.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Worker chết | Job dồn. Backlog vượt ngưỡng → **alert** |
| Job chạy hai lần | Consumer idempotent → không tác dụng phụ |
| Valkey mất | Producer fail nhanh, ❌ không chặn request. Health check báo 503 |
| Job treo | Timeout theo loại, chuyển `failed`, alert |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-JOB-01` | Consumer **idempotent** | Retry là hành vi bình thường của queue |
| `BR-JOB-02` | `jobId` xác định từ khoá nghiệp vụ | Chống đẩy trùng ở tầng producer |
| `BR-JOB-03` | Backlog vượt ngưỡng → **alert tới người** | Worker chết im lặng là chế độ hỏng tệ nhất |
| `BR-JOB-04` | `packages/queue` ❌ **NEVER chứa consumer**; `apps/worker` ❌ **NEVER expose HTTP** | Trộn hai vai làm worker trở thành một app web không ai bảo trì |
| `BR-JOB-05` | Job fail hết retry ❌ **NEVER bị bỏ im lặng** | Job nền ❌ không có người dùng đứng chờ để báo hỏng — im lặng là chế độ mặc định của nó. `account:purge` fail im lặng ⇒ vi phạm nghĩa vụ xoá dữ liệu; `backup:postgres` fail im lặng ⇒ đúng bài học v1 (`BR-BAK-04`) |
| `BR-JOB-06` | Job chạm dữ liệu trẻ tuân thủ đủ ràng buộc `child-data-compliance` | Job chạy ngoài ngữ cảnh request dễ quên guard |
| `BR-JOB-07` | Worker **phải có process trong cấu hình production** | v1 comment mất worker và không ai phát hiện |
| `BR-JOB-08` | Job dài chia lô có checkpoint | Job 30 phút fail ở phút 29 mà làm lại từ đầu là lãng phí |

## 7. Data

### 7.1 Danh sách job MVP

| Job | Lịch | Idempotency key | Timeout |
|---|---|---|---|
| `rollup:session` | Sự kiện — sau `game_completed` | `session_uuid` | 30s |
| `rollup:daily` | 02:00 ICT | `date_ict` | 10m |
| `sweep:abandoned` | Mỗi 10 phút | `window_start` | 2m |
| `entitlement:expire` | 00:05 ICT | `date_ict` | 5m |
| `order:expire` | Mỗi giờ | `hour` | 2m |
| `account:purge` | 03:00 ICT | `date_ict` | 15m |
| `email:send` | Sự kiện | `notification_id` | 30s |
| `image:cleanup-orphan` | 04:00 ICT chủ nhật | `week` | 15m |
| `backup:postgres` | 01:00 ICT | `date_ict` | 30m |
| `backup:verify` | 05:00 ICT thứ hai | `week` | 30m |

**10 job.** Job của add-on (export PDF, AI batch) ❌ không tạo ở MVP — ví dụ cụ thể:
`embed:content` (re-embed vector khi publish, xem `07-addon/semantic-search.md` §7.2), dùng
chung hạ tầng BullMQ/Valkey này nhưng không tính vào 10 job MVP trên.

### 7.2 Retry

| Loại | Retry | Backoff |
|---|---|---|
| Rollup, sweep | 3 | exponential 5s |
| Email | 5 | exponential 30s |
| Backup | 2 | fixed 5m |
| Purge dữ liệu | 1 | — · fail → alert ngay, ❌ không tự retry |

Purge chỉ retry một lần vì nó xoá dữ liệu — retry mù trên thao tác phá huỷ là rủi ro lớn
hơn việc chạy muộn một ngày.

### 7.3 Ngưỡng alert

| Chỉ số | Ngưỡng |
|---|---|
| Backlog `waiting` | > 500 trong 5 phút |
| Job `failed` | > 10 trong 1 giờ |
| Không job nào hoàn thành | 15 phút |
| Tuổi job cũ nhất | > 30 phút |

## 8. API contract

```ts
enqueue<T extends JobName>(name: T, payload: JobPayload<T>, opts?: { jobId?: string; delay?: number }): Promise<void>;
```

`jobId` mặc định suy từ payload theo §7.1 — producer ❌ không tự bịa.

## 9. Acceptance criteria

```gherkin
Scenario: BR-JOB-01 — consumer idempotent
  Given job rollup:session cho một phiên đã chạy xong
  When job đó chạy lại
  Then dữ liệu rollup không đổi
  And không hàng trùng nào được tạo

Scenario: BR-JOB-02 — đẩy trùng bị khử
  When enqueue rollup:session hai lần cho cùng session_uuid
  Then queue chỉ có một job

Scenario: BR-JOB-03 — backlog cao phát alert
  Given worker dừng
  When backlog vượt 500 job trong 5 phút
  Then alert được phát tới kênh vận hành

Scenario: BR-JOB-04 — worker không expose HTTP
  When quét apps/worker tìm định nghĩa route
  Then không route HTTP nào ngoài health check nội bộ

Scenario: BR-JOB-07 — worker có process production
  When đọc cấu hình process manager
  Then có mục cho worker và nó không bị comment

Scenario: BR-JOB-05 — job fail không im lặng
  Given một job vượt số retry
  Then job nằm trong failed queue
  And một alert được ghi nhận

Scenario: Valkey mất không chặn request
  Given Valkey không truy cập được
  When user thực hiện một hành động có enqueue job
  Then request vẫn trả thành công cho phần đồng bộ
  And health check trả 503
```

## 10. Boundaries

**Always**
- `jobId` xác định.
- Consumer idempotent.
- Alert khi backlog hoặc fail vượt ngưỡng.
- Checkpoint cho job dài.

**Ask first**
- Thêm job mới.
- Đổi lịch hoặc ngưỡng alert.
- Đổi số retry của job phá huỷ dữ liệu.

**Never**
- Consumer trong `packages/queue`.
- HTTP endpoint trong `apps/worker`.
- Bỏ im lặng job fail.
- Deploy production thiếu process worker.

## 11. Open questions

> `phase: P1` là phase **implement** (khi worker thật sự chạy), ❌ không phải phase **approve**.
> File này approve ở **P0** vì [`backup-and-restore`](backup-and-restore.md) (P0, điều kiện
> chặn migration #1 theo **D-AD**) `depends_on` nó — hai job `backup:postgres`/`backup:verify`
> ở §7.1 là của spec đó. Cùng tiền lệ [`game-template-contract`](game-template-contract.md).
> Approve = *hình dạng* contract job (danh sách, retry, idempotency, ngưỡng alert) đã chốt.

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Alert đi kênh nào — email, Telegram, hay dashboard? Cần một kênh **tới được người**. ⚠️ ❌ **Không chặn migration #1** — không đụng cột nào; nhưng `BR-JOB-03`/`BR-JOB-05` vô nghĩa tới khi có kênh thật | Go-live | 🟡 go-live | hoãn — chốt cùng `monitoring-and-alerting`; ❌ không được để mở tới lúc go-live |
| 2 | Worker chạy cùng instance với web hay tách? Trên t3.small tách là tốn thêm | Vận hành, ❌ không đụng cột | 🟡 P1 | hoãn — chốt khi biết instance type production (`repo-bootstrap` §11 Q9 cùng chủ đề) |
