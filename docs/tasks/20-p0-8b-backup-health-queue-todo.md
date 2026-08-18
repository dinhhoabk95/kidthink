# Checklist — Task #20: P0.8b — Sao lưu, quan sát, khung queue

> Kế hoạch: [`20-p0-8b-backup-health-queue-plan.md`](20-p0-8b-backup-health-queue-plan.md).
> Không chạy migration ngoài local, không thao tác production, không đụng secret thật.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] Human approve kế hoạch và bốn quyết định D-DZ · D-EA · D-EB · D-EC.
- [x] Đọc §11 hai spec; ghi nhận §11 Q1 của backup là **chặn go-live**, chủ là người quyết.
- [x] Đối chiếu `BR-BAK-*` `BR-HLT-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Xác nhận `D-BT` và `D-BU` — P0 chỉ dựng khung tối thiểu, không kéo [`job-queue.md`](../specs/01-platform/job-queue.md) lên.
- [x] `docker compose up -d` — PG 17 + Valkey 9 sống.
- [x] Tạo nhánh riêng.

---

## Khối A — chạy ngay

### Task 1 — `packages/cache`

- [x] Export driver, **không** export instance client.
- [x] Là nơi duy nhất khởi tạo kết nối Valkey.
- [x] `ping()` thật, có timeout ≤ 2s.
- [x] Ca âm: Valkey tắt → trả fail trong ≤ 2s, không treo.
- [x] `pnpm --filter @mindkid/cache test` và `pnpm lint:deps` xanh.

### Task 2 — `packages/queue`

- [x] Tên job là union đóng; payload có kiểu riêng từng job.
- [x] `enqueue(name, payload, { jobId })` — `jobId` là tham số hạng nhất.
- [x] Không import gì từ `apps/*` (`BR-MPA-06`).
- [x] Ca âm: enqueue hai lần cùng `jobId` chỉ tạo một job.
- [x] Chỉ hai job `backup:postgres` `backup:verify`; job lạ là lỗi biên dịch.
- [x] `pnpm --filter @mindkid/queue test` xanh.

### Task 3 — `apps/worker`

- [x] Worker chỉ consume; không có đường enqueue trong `apps/worker`.
- [x] Tên job không đăng ký → fail rõ ràng, không im lặng.
- [x] Tắt sạch khi nhận tín hiệu dừng.
- [x] `pnpm check:services` xanh.

### Task 6 — Port `alert()`
Em 
- [x] Interface `alert(severity, message, context)` + adapter log có cấu trúc.
- [x] Cổng: mọi nhánh `catch` trong job gọi `alert()`.
- [x] Ca âm: job nuốt lỗi làm cổng **ĐỎ**.
- [x] Context không chứa dữ liệu trẻ hay chuỗi kết nối.
- [x] Ghi rõ adapter thật thuộc P1.16.

### Task 4 — Job `backup:postgres`

- [x] Dump → nén → mã hoá → upload; khoá từ biến môi trường, không cùng chỗ dump.
- [x] Ghi `backup_log` mọi lần chạy kèm checksum.
- [x] Retry 2 lần; fail tiếp gọi `alert()`.
- [x] Ca âm `BR-BAK-02`: mở file không có khoá thì không đọc được.
- [x] Ca âm `BR-BAK-04`: fail → `status = failed` **và** `alert()` gọi đúng một lần.
- [x] Retention 30/12/24 khai thành hằng số có tên.
- [x] Không đường nào ghi dump ra thư mục người dùng hay bucket công khai.
- [x] `pnpm --filter @mindkid/worker test -- backup` xanh.

### Task 5 — Job `backup:verify`

- [x] Migration đổi `backup_type` sang `dump | verify | drill`.
- [x] Migration thêm cột `restored_rows` vào `backup_log`.
- [x] Restore bản mã hoá mới nhất → verify schema → select count → xoá → ghi log.
- [x] Cấu hình cron.h; chạy 3 truy vấn nghiệp vụ.
- [x] `restored_rows = 0` là **fail**, không phải success.
- [x] Verify fail → `alert()` mức cao.
- [x] Ca âm: trỏ vào DB đang nhận ghi thì job **từ chối chạy**.
- [x] `pnpm --filter @mindkid/worker test -- backup-verify` xanh.

### Task 7 — `restore.sh` và runbook

- [x] `infra/scripts/restore.sh` nhận khoá object, tải, giải mã, restore.
- [x] Từ chối chạy khi target là DB đang nhận ghi.
- [x] Runbook §7.3 chạy hết trên local, có người ký từng bước.
- [x] Đo RTO một lần chạy thử, ghi `backup_log` kind `drill`.
- [x] Script không chứa khoá, mật khẩu, endpoint production.

## Cổng dừng A

- [x] `packages/queue` · `apps/worker` · `packages/cache` không còn stub.
- [x] Đúng hai job; không kéo danh mục P1.5 lên.
- [x] Có ít nhất **một** hàng `backup_log` kind verify status success **thật**.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm lint:deps && pnpm check:progress` xanh.

---

## Khối B — cần Nitro runtime của P0.3

### Task 8 — `GET /api/guest/health`

- [x] Kiểm song song ba dịch vụ, mỗi cái ≤ 2s, tổng ≤ 3s.
- [x] `SELECT 1` qua Drizzle · `PING` Valkey · đếm `waiting` queue.
- [x] Ca âm `BR-HLT-01`: tắt PostgreSQL → **503**, không phải 200.
- [x] Ca âm `BR-HLT-04`: body không có `version`, `hostname`, chuỗi kết nối.
- [x] `Cache-Control: no-store`.
- [x] 503 gọi `alert()`.
- [x] `pnpm --filter @mindkid/web test -- health` xanh.

### Task 9 — Smoke deploy

- [x] `deploy.sh` gọi health check sau reload.
- [x] Non-200 → abort và revert.
- [x] Ca âm: health giả trả 503 làm deploy revert.
- [x] Lúc khởi động (migration chưa xong) health trả 503.

## Cổng dừng B

- [x] Health nói thật ở cả ba ca: đủ dịch vụ · thiếu DB · thiếu Valkey.
- [x] Deploy không đi tiếp khi smoke fail.
- [x] Human review diff.

---

## Task 10 — Evidence, cổng go-live, promote

- [x] Mỗi `BR-BAK-*` `BR-HLT-*` có test tham chiếu mã rule.
- [x] `BR-BAK-06` ghi thành mục cổng go-live trong [`security-checklist.md`](../specs/08-quality/security-checklist.md).
- [x] Nêu lại §11 Q1 (chủ sở hữu khoá mã hoá) ở cổng ra P0 — chưa chốt thì chưa go-live.
- [x] Ghi lệch **tên** cột `backup_log` (`storage_path`/`checksum`) vào [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md), **không** đổi cột.
- [x] [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) · [`health-check.md`](../specs/01-platform/health-check.md) sang `implemented` chỉ khi đủ evidence.
- [x] Tick **P0.8b** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

## Cổng dừng cuối

- [x] Không kéo [`job-queue.md`](../specs/01-platform/job-queue.md) hay [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) lên sớm.
- [x] Không secret, khoá, hay endpoint production trong source hoặc log.
- [x] Không chạy job nào chạm dữ liệu production.
- [x] Sẵn sàng lập plan P0.9.
