---
spec: JOB-QUEUE
title: Hàng đợi job nền
area: platform
status: implemented
mvp: true
phase: P1
reviewed: 2026-10-18
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
Producer ở `packages/queue`, consumer ở `apps/worker` qua giao diện Pluggable `QueueDriver`:
- **Giai đoạn 1 (`QUEUE_DRIVER=cloudflare-do`, `< 1.000 DAU`):** Producer `await` RPC `enqueueBatch` vào `JobQueueDO` ngay trong request/cron (không dùng `waitUntil`: nó thuộc về từng request nên không đặt toàn cục được, và enqueue là một RPC ngắn) (Durable Objects SQLite + cơ chế `Single-Pending-Alarm` gom lô cửa sổ `3–5s`, đáp ứng `50.000–200.000+ jobs/ngày` trên gói Free) kết hợp 1 Cron Dispatcher `*/5 * * * *` và cảm biến `ops:graduation-check` (cảnh báo ở `850 DAU` hoặc `65%` quota ngày).
- **Giai đoạn 2 (`QUEUE_DRIVER=bullmq`, `≥ 1.000 DAU`):** BullMQ trên Valkey 9 chạy trong tiến trình `apps/worker` trên VPS.

Hỏng đắt nhất của job nền: **worker bị tắt mà không ai biết**. Producer vẫn đẩy job, không
consumer nào lấy ra, email và export im lặng không chạy. Spec này ép alert cho tình huống
đó thành điều kiện go-live.

## 2. Actors

| Actor | Vai trò |
|---|---|
| `packages/queue` | Định nghĩa job + producer. Cấm chứa consumer |
| `apps/worker` | Consumer. Cấm có HTTP endpoint |
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
| Valkey mất | Producer fail nhanh, không chặn request. Health check báo 503 |
| Job treo | Timeout theo loại, chuyển `failed`, alert |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-JOB-01` | Consumer **idempotent** | Retry là hành vi bình thường của queue |
| `BR-JOB-02` | `jobId` xác định từ khoá nghiệp vụ | Chống đẩy trùng ở tầng producer |
| `BR-JOB-03` | Backlog vượt ngưỡng → **alert tới người** | Worker chết im lặng là chế độ hỏng tệ nhất |
| `BR-JOB-04` | `packages/queue` Cấm — **NEVER chứa consumer**; `apps/worker` Cấm — **NEVER expose HTTP** | Trộn hai vai làm worker trở thành một app web không ai bảo trì |
| `BR-JOB-05` | Job fail hết retry Cấm — **NEVER bị bỏ im lặng** | Job nền không có người dùng đứng chờ để báo hỏng — im lặng là chế độ mặc định của nó. `account:purge` fail im lặng thì vi phạm nghĩa vụ xoá dữ liệu; `backup:postgres` fail im lặng thì mất bản sao lưu mà không ai biết (`BR-BAK-04`) |
| `BR-JOB-06` | Job chạm dữ liệu trẻ tuân thủ đủ ràng buộc [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) | Job chạy ngoài ngữ cảnh request dễ quên guard |
| `BR-JOB-07` | Worker **phải có process trong cấu hình production** | Worker bị comment khỏi cấu hình thì không ai phát hiện |
| `BR-JOB-08` | Job dài chia lô có checkpoint | Job 30 phút fail ở phút 29 mà làm lại từ đầu là lãng phí |
| `BR-JOB-09` | Trên Cloudflare, scheduler là **một** cron trigger `*/5 * * * *`; mỗi lần chạy kiểm **mọi** `schedule.pattern` của `JOB_DEFINITIONS` theo giờ ICT (`Asia/Ho_Chi_Minh`, UTC+7, không DST) và đẩy job đến hạn với `jobId` = `<tên>:<YYYY-MM-DDTHH:mm ICT>` | Một nguồn lịch duy nhất (registry) — danh sách job trong cron không được trôi khỏi registry như bản `*/15` cũ đã bỏ sót `billing:*`, `soft-unlock`, `manual-grants`, `pdf-cleanup` |
| `BR-JOB-10` | Trên Cloudflare `backup:postgres` và `backup:verify` **không** được dispatch (`CLOUDFLARE_SKIPPED_JOBS`); mọi job theo lịch còn lại phải được dispatch ít nhất một lần/chu kỳ của nó | Backup D1 do workflow riêng ([`backup-and-restore.md`](backup-and-restore.md) `BR-BAK-09`); test drift chặn việc thêm job mà quên scheduler |
| `BR-JOB-11` | Trên Cloudflare chỉ có **một** Durable Object hàng đợi (`JobQueueDO`, tên `queue-v1`), không sharding; `JobQueueDO` và `AuthCoordinatorDO` cùng nằm trong Worker `mindkid-worker`, web gọi qua binding `script_name: "mindkid-worker"` | Sharding theo ký tự đầu `jobId` làm job trùng khử không được (`BR-JOB-02`) và vỡ `getStats`; hai DO chung một script để có một migration, một bundle |
| `BR-JOB-12` | Trên Cloudflare, nối port **đóng-khi-lỗi**: `env` chỉ được ghi nhận là đã nối **sau khi** mọi port nối xong; thiếu binding `AUTH_COORDINATOR` hoặc `DB_BLOBS` (web) / `DB_CORE`, `DB_BLOBS`, `AUTH_COORDINATOR` (worker) thì ném lỗi rõ ràng, không chạy nửa vời | Nối dở rồi đánh dấu xong làm mọi request sau đó chạy với port thiếu mà không ai biết |
| `BR-JOB-14` | `JobQueueDO` giữ bảng `completed_job_ids(job_id PRIMARY KEY, done_at)` **48 giờ**: `enqueueBatch` bỏ qua `jobId` đã hoàn tất trong cửa sổ đó; mỗi job xoá khỏi `queued_jobs` và ghi vào `completed_job_ids` **ngay sau khi chạy xong** (không gom cuối lô); `drainBatch` dọn dòng `done_at` quá 48 giờ; lỗi ném từ `onDeadLetter` bị nuốt và log, không làm lô chạy lại | Alarm bị ngắt/ném giữa lô thì job đã chạy xong không được chạy lại; cron `*/5` đẩy lại id cũ trong 48 giờ không được chạy trùng |
| `BR-JOB-13` | Engine của `JobQueueDO` không bao giờ được đăng ký toàn cục; `scheduled()` và web enqueue qua stub DO | Engine gắn với I/O context của DO — dùng từ ngoài DO là lỗi "different request" hoặc ghi sai chỗ |

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

**10 job.** Job của add-on (export PDF, AI batch) không tạo ở MVP — ví dụ cụ thể:
`embed:content` (re-embed vector khi publish, xem `07-addon/semantic-search.md` §7.2), dùng
chung hạ tầng BullMQ/Valkey này nhưng không tính vào 10 job MVP trên.

### 7.2 Retry

| Loại | Retry | Backoff |
|---|---|---|
| Rollup, sweep | 3 | exponential 5s |
| Email | 5 | exponential 30s |
| Backup | 2 | fixed 5m |
| Purge dữ liệu | 1 | — · fail → alert ngay, không tự retry |

Purge chỉ retry một lần vì nó xoá dữ liệu — retry mù trên thao tác phá huỷ là rủi ro lớn
hơn việc chạy muộn một ngày.

### 7.3 Ngưỡng alert

| Chỉ số | Ngưỡng |
|---|---|
| Backlog `waiting` | > 500 trong 5 phút |
| Job `failed` | > 10 trong 1 giờ |
| Không job nào hoàn thành | 15 phút |
| Tuổi job cũ nhất | > 30 phút |

### 7.3b Dọn blob hết hạn

`sweep:pdf-cleanup` (04:00 ICT) làm hai việc: xoá tệp PDF của job export quá hạn (`BR-PDF-08`) **và**
gọi `deleteExpired(now)` của driver storage để xoá mọi blob private có `expires_at` đã qua (CSV
export admin hạn 1 ngày — `BR-IMG-15`).

### 7.4 Scheduler trên Cloudflare

`scheduled()` (mỗi 5 phút) → `scheduledEnvelopesAt(ms)` → `JobQueueDO.enqueueBatch`. Pattern hỗ trợ:
`*`, `*/n`, số, danh sách phân cách dấu phẩy, khoảng `a-b` (field thứ: `7` là Chủ nhật nên `a-7` khớp cả Chủ nhật); field ngày-trong-tháng và thứ cùng bị
giới hạn thì khớp khi **một trong hai** khớp (đúng cron chuẩn). Mọi pattern hiện có có phút là bội
số của 5; pattern lệch 5 phút được dispatch ở tick 5 phút phủ nó. Cảm biến `ops:graduation-check`
chạy ở tick 02:00 ICT.

**Không bù tick bị lỡ (no catch-up):** nếu một tick `*/5` không chạy (outage Cloudflare, deploy lỗi),
job đến hạn trong tick đó **không** được dispatch bù ở tick sau — `scheduledEnvelopesAt` chỉ xét đúng
phút của tick. Hậu quả: job theo lịch có thể bỏ lỡ một chu kỳ (vd. `billing:renew` 00:30 ICT). Các job
quét trạng thái (`billing:*`, `order:expire`, `entitlement:expire`) tự bắt kịp ở lần chạy kế tiếp vì
chọn theo điều kiện thời gian, không theo tick; job chạy một lần mỗi chu kỳ dài (`rollup:daily`,
`account:purge`) cần người vận hành chạy lại tay khi phát hiện tick lỡ.

Port (D1, auth, cache, queue, storage) nối bằng `register*Port` toàn cục một lần cho mỗi `env`,
không dùng `AsyncLocalStorage.enterWith`: workerd báo `enterWith() is not implemented` (đã đo
bằng `wrangler dev`).

Cổng queue **không** đăng ký chung một chỗ: ngoài `JobQueueDO` (web, `scheduled()`) là **stub** của DO
(`namespace.get(idFromName("queue-v1"))`); engine SQLite chỉ hiệu lực **bên trong** ngữ cảnh async của
consumer chạy trong DO (`runWithCloudflareQueuePort`, dùng `AsyncLocalStorage.run`, khác `enterWith`).
Không biến toàn cục nào trỏ vào engine của DO từ ngoài DO (`BR-JOB-13`).

## 8. API contract

```ts
enqueue<T extends JobName>(name: T, payload: JobPayload<T>, opts?: { jobId?: string; delay?: number }): Promise<void>;
```

`jobId` mặc định suy từ payload theo §7.1 — producer không tự bịa.

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

Scenario: BR-JOB-09 — cron Cloudflare dispatch job đến hạn
  Given tick `scheduled()` lúc 00:30 ICT
  Then `billing:renew` được đẩy vào JobQueueDO với jobId `billing:renew:<ngày>T00:30`

Scenario: BR-JOB-10 — không job theo lịch nào bị bỏ sót
  When mô phỏng một tuần tick 5 phút
  Then mọi job `kind: cron` được dispatch ít nhất một lần, trừ `backup:postgres` và `backup:verify`

Scenario: BR-JOB-11 — enqueue trong DO không chạm BullMQ
  Given consumer chạy trong JobQueueDO gọi `enqueue`
  Then job vào queue của chính DO đó, BullMQ không được nạp

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

> `phase: P1` là phase **implement** (khi worker thật sự chạy), không phải phase **approve**.
> File này approve ở **P0** vì [`backup-and-restore`](backup-and-restore.md) (P0, điều kiện
> chặn migration #1 theo **D-AD**) `depends_on` nó — hai job `backup:postgres`/`backup:verify`
> ở §7.1 là của spec đó. Cùng tiền lệ [`game-template-contract`](game-template-contract.md).
> Approve = *hình dạng* contract job (danh sách, retry, idempotency, ngưỡng alert) đã chốt.

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Alert đi kênh nào — email, Telegram, hay dashboard? Cần một kênh **tới được người**. Lưu ý: Cấm **Không chặn migration #1** — không đụng cột nào; nhưng `BR-JOB-03`/`BR-JOB-05` vô nghĩa tới khi có kênh thật | Go-live | chờ go-live | hoãn — chốt cùng [`monitoring-and-alerting.md`](monitoring-and-alerting.md); không được để mở tới lúc go-live |
| 2 | Worker chạy cùng instance với web hay tách? Trên t3.small tách là tốn thêm | Vận hành, không đụng cột | chờ P1 | hoãn — chốt khi biết instance type production ([`repo-bootstrap.md`](../00-foundation/repo-bootstrap.md) §11 Q9 cùng chủ đề) |
