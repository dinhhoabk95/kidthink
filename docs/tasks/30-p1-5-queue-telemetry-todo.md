# Checklist — Task #30: P1.5 — Hàng đợi công việc & đường ống telemetry

> Kế hoạch: [`30-p1-5-queue-telemetry-plan.md`](30-p1-5-queue-telemetry-plan.md).
> Bài học v1: **worker chết mà không ai biết**. Alert chỉ ghi log **không tính là alert**.
> `rollup:session` → P1.7 · `sweep:abandoned` → P1.6 (`D-FZ`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P0.8b / P0.9b đã đóng** — khung queue + `backup:postgres` + `email:send` chạy được.
- [ ] **P0.7 đã đóng** — `telemetry_events`, `play_sessions` có cột.
- [ ] Human approve kế hoạch và sáu quyết định D-FW · D-FX · D-FY · D-FZ · D-GA · D-GB.
- [ ] Đối chiếu `BR-JOB-*` `BR-TLM-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Đọc [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.3 trước khi khai event schema.
- [ ] Tạo nhánh riêng.

---

### Task 1 — Registry job và ranh giới

- [ ] Mười job khai dạng dữ liệu: tên · lịch · idempotency key · timeout · `owner_step`.
- [ ] Cổng: consumer ngoài registry → đỏ.
- [ ] Cổng: `owner_step` đã qua mà thiếu consumer → đỏ.
- [ ] `BR-JOB-04` ca âm: consumer trong `packages/queue` → đỏ.
- [ ] `BR-JOB-04` ca âm: route HTTP trong `apps/worker` → đỏ.
- [ ] Rule `dependency-cruiser` ép hai ranh giới trên.
- [ ] `BR-JOB-07` cổng đọc cấu hình process manager production.
- [ ] Ca âm `BR-JOB-07`: comment mục worker → cổng đỏ.

### Task 2 — Idempotency và retry

- [ ] `BR-JOB-02` `jobId` suy xác định từ khoá nghiệp vụ §7.1.
- [ ] Ca âm: enqueue hai lần cùng khoá → queue có **một** job.
- [ ] `BR-JOB-01` consumer idempotent — chạy lại không tạo hàng trùng.
- [ ] Bảng retry khai dạng dữ liệu: rollup/sweep 3× exp 5s.
- [ ] email 5× exp 30s.
- [ ] backup 2× fixed 5m.
- [ ] purge **1×**, fail → alert ngay, không tự retry.
- [ ] `BR-JOB-08` job dài có checkpoint; ca âm chạy lại không làm lại từ đầu.
- [ ] Valkey mất → producer fail nhanh, request đồng bộ vẫn 200, health 503.

### Task 3 — Alert tới được người

- [ ] `AlertPort` interface + adapter email vận hành qua `email:send`.
- [ ] **Ca âm: adapter chỉ ghi log → test đỏ** (`D-FX`).
- [ ] Ngưỡng: backlog `waiting` > 500 trong 5 phút.
- [ ] Ngưỡng: `failed` > 10 trong 1 giờ.
- [ ] Ngưỡng: không job nào hoàn thành trong 15 phút.
- [ ] Ngưỡng: tuổi job cũ nhất > 30 phút.
- [ ] `BR-JOB-03` ca âm: dừng worker, đẩy > 500 job → alert trong 5 phút.
- [ ] `BR-JOB-05` ca âm: job vượt retry → `failed` queue **và** alert.
- [ ] `BR-TLM-06` worker chết 10 phút → alert tới kênh.
- [ ] Gom alert theo cửa sổ nhưng **không** mất alert đầu tiên.

### Task 4 — Bốn bảng rollup và ranh giới ngày

- [ ] `child_session_summaries` khoá `(child_id, session_uuid)`.
- [ ] `child_daily_stats` khoá `(child_id, date_ict)`.
- [ ] `level_daily_stats` khoá `(level_code, content_version, date_ict)`.
- [ ] `skill_daily_stats` khoá `(skill_id, date_ict)`.
- [ ] `BR-TLM-08` một hàm ranh giới ngày ICT (`D-GB`).
- [ ] Ca âm: phiên 23:50 và 00:10 rơi vào hai `date_ict` khác nhau.
- [ ] Migration chạy được **từ đầu** trên DB rỗng.

### Task 5 — `rollup:daily` và `entitlement:expire`

- [ ] `rollup:daily` 02:00 ICT, `jobId = date_ict`, timeout 10m.
- [ ] `BR-TLM-02` chạy ba lần cùng ngày → kết quả không đổi (so từng hàng).
- [ ] `entitlement:expire` 00:05 ICT, `jobId = date_ict`.
- [ ] Event tới muộn ≤ 24h vẫn nhận; rollup ngày đó chạy lại được.
- [ ] `BR-TLM-05` phiên guest: `child_uuid` NULL, không vào `mastery_state`, không đếm KPI trẻ.
- [ ] Rollup fail 3 lần → alert, không âm thầm bỏ.

### Task 6 — Cổng PII đầu đường ống

- [ ] `BR-TLM-03` cổng quét schema event.
- [ ] `BR-TLM-03` cổng quét cột bảng rollup.
- [ ] Ca âm: thêm `child_name` vào event schema → đỏ.
- [ ] Định danh trẻ trong telemetry là `child_uuid`; ca âm dùng tên hoặc `child_id` thô → đỏ.
- [ ] `BR-JOB-06` job chạm dữ liệu trẻ đi qua guard compliance; ca âm bỏ guard → đỏ.
- [ ] Cổng nằm trong `pnpm check`, không phải script chạy tay.

### Task 7 — Retention và route analytics

- [ ] `BR-TLM-09` event thô giữ **90 ngày**; job dọn idempotent, có checkpoint.
- [ ] Ca âm: dọn chạy hai lần không xoá dữ liệu trong hạn.
- [ ] `GET /api/managers/analytics/levels` đọc `level_daily_stats`.
- [ ] Query `from` `to` `competency` `sort` `limit` ≤ 100 (`BR-PRF-06`).
- [ ] `BR-TLM-01` cổng: không truy vấn báo cáo nào `SELECT` thẳng `telemetry_events`.
- [ ] Ca âm: thêm truy vấn như vậy → cổng đỏ.
- [ ] Năm ngưỡng chỉ số nội dung §7.2 khai dạng dữ liệu.

## Cổng dừng

- [ ] Registry in "10/10 job", mỗi job có `owner_step`.
- [ ] Dừng worker → alert tới email vận hành, **kiểm tay một lần**.
- [ ] `rollup:daily` ba lần cùng ngày → kết quả không đổi.
- [ ] Không truy vấn báo cáo nào chạm `telemetry_events`.
- [ ] Cổng PII đã đỏ trên fixture.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

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
