# Checklist — Task #30: P1.5 — Hàng đợi công việc & đường ống telemetry

> Kế hoạch: [`30-p1-5-queue-telemetry-plan.md`](30-p1-5-queue-telemetry-plan.md).
> Bài học v1: **worker chết mà không ai biết**. Alert chỉ ghi log **không tính là alert**.
> `rollup:session` → P1.7 · `sweep:abandoned` → P1.6 (`D-FZ`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P0.8b / P0.9b đã đóng** — khung queue + `backup:postgres` + `email:send` chạy được.
- [x] **P0.7 đã đóng** — `telemetry_events`, `play_sessions` có cột.
- [x] Human approve kế hoạch và sáu quyết định D-FW · D-FX · D-FY · D-FZ · D-GA · D-GB.
- [x] Đối chiếu `BR-JOB-*` `BR-TLM-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Đọc [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.3 trước khi khai event schema.
- [x] Tạo nhánh riêng.

---

### Task 1 — Registry job và ranh giới

- [x] Mười job khai dạng dữ liệu: tên · lịch · idempotency key · timeout · `owner_step`.
- [x] Cổng: consumer ngoài registry → đỏ.
- [x] Cổng: `owner_step` đã qua mà thiếu consumer → đỏ.
- [x] `BR-JOB-04` ca âm: consumer trong `packages/queue` → đỏ.
- [x] `BR-JOB-04` ca âm: route HTTP trong `apps/worker` → đỏ.
- [x] Rule `dependency-cruiser` ép hai ranh giới trên.
- [x] `BR-JOB-07` cổng đọc cấu hình process manager production.
- [x] Ca âm `BR-JOB-07`: comment mục worker → cổng đỏ.

### Task 2 — Idempotency và retry

- [x] `BR-JOB-02` `jobId` suy xác định từ khoá nghiệp vụ §7.1.
- [x] Ca âm: enqueue hai lần cùng khoá → queue có **một** job.
- [x] `BR-JOB-01` consumer idempotent — chạy lại không tạo hàng trùng.
- [x] Bảng retry khai dạng dữ liệu: rollup/sweep 3× exp 5s.
- [x] email 5× exp 30s.
- [x] backup 2× fixed 5m.
- [x] purge **1×**, fail → alert ngay, không tự retry.
- [x] `BR-JOB-08` job dài có checkpoint; ca âm chạy lại không làm lại từ đầu.
- [x] Valkey mất → producer fail nhanh, request đồng bộ vẫn 200, health 503.

### Task 3 — Alert tới được người

- [x] `AlertPort` interface + adapter email vận hành qua `email:send`.
- [x] **Ca âm: adapter chỉ ghi log → test đỏ** (`D-FX`).
- [x] Ngưỡng: backlog `waiting` > 500 trong 5 phút.
- [x] Ngưỡng: `failed` > 10 trong 1 giờ.
- [x] Ngưỡng: không job nào hoàn thành trong 15 phút.
- [x] Ngưỡng: tuổi job cũ nhất > 30 phút.
- [x] `BR-JOB-03` ca âm: dừng worker, đẩy > 500 job → alert trong 5 phút.
- [x] `BR-JOB-05` ca âm: job vượt retry → `failed` queue **và** alert.
- [x] `BR-TLM-06` worker chết 10 phút → alert tới kênh.
- [x] Gom alert theo cửa sổ nhưng **không** mất alert đầu tiên.

### Task 4 — Bốn bảng rollup và ranh giới ngày

- [x] `child_session_summaries` khoá `(child_id, session_uuid)`.
- [x] `child_daily_stats` khoá `(child_id, date_ict)`.
- [x] `level_daily_stats` khoá `(level_code, content_version, date_ict)`.
- [x] `skill_daily_stats` khoá `(skill_id, date_ict)`.
- [x] `BR-TLM-08` một hàm ranh giới ngày ICT (`D-GB`).
- [x] Ca âm: phiên 23:50 và 00:10 rơi vào hai `date_ict` khác nhau.
- [x] Migration chạy được **từ đầu** trên DB rỗng.

### Task 5 — `rollup:daily` và `entitlement:expire`

- [x] `rollup:daily` 02:00 ICT, `jobId = date_ict`, timeout 10m.
- [x] `BR-TLM-02` chạy ba lần cùng ngày → kết quả không đổi (so từng hàng).
- [x] `entitlement:expire` 00:05 ICT, `jobId = date_ict`.
- [x] Event tới muộn ≤ 24h vẫn nhận; rollup ngày đó chạy lại được.
- [x] `BR-TLM-05` phiên guest: `child_uuid` NULL, không vào `mastery_state`, không đếm KPI trẻ.
- [x] Rollup fail 3 lần → alert, không âm thầm bỏ.

### Task 6 — Cổng PII đầu đường ống

- [x] `BR-TLM-03` cổng quét schema event.
- [x] `BR-TLM-03` cổng quét cột bảng rollup.
- [x] Ca âm: thêm `child_name` vào event schema → đỏ.
- [x] Định danh trẻ trong telemetry là `child_uuid`; ca âm dùng tên hoặc `child_id` thô → đỏ.
- [x] `BR-JOB-06` job chạm dữ liệu trẻ đi qua guard compliance; ca âm bỏ guard → đỏ.
- [x] Cổng nằm trong `pnpm check`, không phải script chạy tay.

### Task 7 — Retention và route analytics

- [x] `BR-TLM-09` event thô giữ **90 ngày**; job dọn idempotent, có checkpoint.
- [x] Ca âm: dọn chạy hai lần không xoá dữ liệu trong hạn.
- [x] `GET /api/managers/analytics/levels` đọc `level_daily_stats`.
- [x] Query `from` `to` `competency` `sort` `limit` ≤ 100 (`BR-PRF-06`).
- [x] `BR-TLM-01` cổng: không truy vấn báo cáo nào `SELECT` thẳng `telemetry_events`.
- [x] Ca âm: thêm truy vấn như vậy → cổng đỏ.
- [x] Năm ngưỡng chỉ số nội dung §7.2 khai dạng dữ liệu.

## Cổng dừng

- [x] Registry in "10/10 job", mỗi job có `owner_step`.
- [x] Dừng worker → alert tới email vận hành, **kiểm tay một lần**.
- [x] `rollup:daily` ba lần cùng ngày → kết quả không đổi.
- [ ] Không truy vấn báo cáo nào chạm `telemetry_events`.
- [ ] Cổng PII đã đỏ trên fixture.
- [ ] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 8 — Evidence, promote, ghi nợ

- [ ] Mỗi `BR-JOB-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-TLM-*` đã thực thi có test tham chiếu mã rule.
- [ ] [`job-queue.md`](../specs/01-platform/job-queue.md) → `implemented`.
- [ ] [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) **giữ** `approved` — promote ở P1.7.
- [ ] Nợ ghi sang P1.6: `sweep:abandoned`.
- [ ] Nợ ghi sang P1.7: `rollup:session`, `BR-TLM-04` tính điểm ở server.
- [ ] Tick **P1.5** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Q1 kênh alert cuối — `D-FX` dùng email tạm; chốt ở **P1.16**, không để mở tới go-live.
- [ ] Q2 vị trí worker — `D-FY` cùng instance khác process; Infra bác thì chỉ đổi cấu hình deploy.
- [ ] Retention 90 ngày có đủ để replay adaptive — P3.
- [ ] Bảng rollup theo tuần — P3.

## Bổ sung 2026-08-27 — cổng thật cho các ô đã tick

Đo lại toàn bộ sổ này khi sửa hệ thống worker. Các ô ở Task 1 và Task 2 đã tick
nhưng cơ chế cưỡng chế **không tồn tại**: `.dependency-cruiser.cjs` không có
rule nào liên quan `BR-JOB-04`, và không cổng nào quét hai ranh giới đó. Cổng
duy nhất có thật (`validateJobRegistryConsumers`) nhận một danh sách tên
hardcode trong chính test của nó, không đọc dispatcher thật — nên nó không bao
giờ phát hiện được việc `account:purge` có handler mà không có nhánh xử lý.

Nay các ô đó tick đúng, và đây là thứ giữ chúng đúng:

| Ô | Cưỡng chế bởi |
|---|---|
| `BR-JOB-04` consumer trong `packages/queue` → đỏ | `packages/gates/tests/job-boundaries.test.ts` (quét nguồn thật + ca âm ở `tests/fixtures/job-boundaries/queue/`) |
| `BR-JOB-04` route HTTP trong `apps/worker` → đỏ | cùng file trên, ca âm ở `tests/fixtures/job-boundaries/worker/` |
| Rule `dependency-cruiser` ép hai ranh giới | `.dependency-cruiser.cjs` — `no-consumer-in-queue-package`, `no-http-in-worker` |
| Consumer ngoài registry → đỏ | `CONSUMERS` là `Record<JobName, ErasedConsumer>` trong `apps/worker/src/consumers/index.ts`: thiếu **bất kỳ** job nào là lỗi biên dịch. Ca âm ở `apps/worker/tests/fixtures/incomplete-consumer-table.ts` |
| `BR-JOB-02` `jobId` suy xác định từ khoá §7.1 | `idempotencyKey` khai trên từng job trong `packages/queue/src/jobs/`; job theo sự kiện thiếu nó bị `defineJob` từ chối ngay lúc khai |
| Lịch chạy khớp §7.1 | `packages/gates/tests/job-queue-spec.test.ts` đối chiếu từng ô của bảng §7.1 với định nghĩa job, gồm cả giờ trong cron pattern |

Ràng buộc còn để mở, Cấm — **NEVER** coi là đã xong:

- `apps/web/server/api/guest/health.get.ts` trả `{ status }` trong khi
  [`health-check.md`](../specs/01-platform/health-check.md) §7.2 chốt `{ status, checks: { db, cache, auth, queue } }`,
  và chưa có bước sentinel write/read/delete ở auth keyspace mà `BR-HLT-02` đòi.
- `NOTIFICATION_TYPES` thiếu bốn mã mà route đang dùng
  (`email_change_verification`, `email_changed_old_address_notice`,
  `password_changed_notification`, `account_deletion_confirmation`);
  [`notification-service.md`](../specs/01-platform/notification-service.md) §7.1 chốt 11 loại và ghi rõ "Thêm loại mới = thêm
  vào bảng này trước".
