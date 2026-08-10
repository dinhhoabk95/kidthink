# Checklist — Task #20: P0.8b — Sao lưu, quan sát, khung queue

> Kế hoạch: [`20-p0-8b-backup-health-queue-plan.md`](20-p0-8b-backup-health-queue-plan.md).
> Không chạy migration ngoài local, không thao tác production, không đụng secret thật.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] Human approve kế hoạch và bốn quyết định D-DZ · D-EA · D-EB · D-EC.
- [ ] Đọc §11 hai spec; ghi nhận §11 Q1 của backup là **chặn go-live**, chủ là người quyết.
- [ ] Đối chiếu `BR-BAK-*` `BR-HLT-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Xác nhận `D-BT` và `D-BU` — P0 chỉ dựng khung tối thiểu, không kéo [`job-queue.md`](../specs/01-platform/job-queue.md) lên.
- [ ] `docker compose up -d` — PG 17 + Valkey 9 sống.
- [ ] Tạo nhánh riêng.

---

## Khối A — chạy ngay

### Task 1 — `packages/cache`

- [ ] Export driver, **không** export instance client.
- [ ] Là nơi duy nhất khởi tạo kết nối Valkey.
- [ ] `ping()` thật, có timeout ≤ 2s.
- [ ] Ca âm: Valkey tắt → trả fail trong ≤ 2s, không treo.
- [ ] `pnpm --filter @kidthink/cache test` và `pnpm lint:deps` xanh.

### Task 2 — `packages/queue`

- [ ] Tên job là union đóng; payload có kiểu riêng từng job.
- [ ] `enqueue(name, payload, { jobId })` — `jobId` là tham số hạng nhất.
- [ ] Không import gì từ `apps/*` (`BR-MPA-06`).
- [ ] Ca âm: enqueue hai lần cùng `jobId` chỉ tạo một job.
- [ ] Chỉ hai job `backup:postgres` `backup:verify`; job lạ là lỗi biên dịch.
- [ ] `pnpm --filter @kidthink/queue test` xanh.

### Task 3 — `apps/worker`

- [ ] Worker chỉ consume; không có đường enqueue trong `apps/worker`.
- [ ] Tên job không đăng ký → fail rõ ràng, không im lặng.
- [ ] Tắt sạch khi nhận tín hiệu dừng.
- [ ] `pnpm check:services` xanh.

### Task 6 — Port `alert()`

- [ ] Interface `alert(severity, message, context)` + adapter log có cấu trúc.
- [ ] Cổng: mọi nhánh `catch` trong job gọi `alert()`.
- [ ] Ca âm: job nuốt lỗi làm cổng **ĐỎ**.
- [ ] Context không chứa dữ liệu trẻ hay chuỗi kết nối.
- [ ] Ghi rõ adapter thật thuộc P1.16.

### Task 4 — Job `backup:postgres`

- [ ] Dump → nén → mã hoá → upload; khoá từ biến môi trường, không cùng chỗ dump.
- [ ] Ghi `backup_log` mọi lần chạy kèm checksum.
- [ ] Retry 2 lần; fail tiếp gọi `alert()`.
- [ ] Ca âm `BR-BAK-02`: mở file không có khoá thì không đọc được.
- [ ] Ca âm `BR-BAK-04`: fail → `status = failed` **và** `alert()` gọi đúng một lần.
- [ ] Retention 30/12/24 khai thành hằng số có tên.
- [ ] Không đường nào ghi dump ra thư mục người dùng hay bucket công khai.
- [ ] `pnpm --filter @kidthink/worker test -- backup` xanh.

### Task 5 — Job `backup:verify`

- [ ] Ca âm: truy vấn `BR-BAK-06` (`kind = verify AND status = success`) **không chạy được** trên enum hiện tại.
- [ ] Migration đổi `backup_type` sang `dump | verify | drill`.
- [ ] Migration thêm cột `restored_rows` vào `backup_log`.
- [ ] Restore bản mới nhất vào container tạm; đếm hàng bảng chính; chạy 3 truy vấn nghiệp vụ.
- [ ] `restored_rows = 0` là **fail**, không phải success.
- [ ] Verify fail → `alert()` mức cao.
- [ ] Ca âm: trỏ vào DB đang nhận ghi thì job **từ chối chạy**.
- [ ] `pnpm --filter @kidthink/worker test -- backup-verify` xanh.

### Task 7 — `restore.sh` và runbook

- [ ] `infra/scripts/restore.sh` nhận khoá object, tải, giải mã, restore.
- [ ] Từ chối chạy khi target là DB đang nhận ghi.
- [ ] Runbook §7.3 chạy hết trên local, có người ký từng bước.
- [ ] Đo RTO một lần chạy thử, ghi `backup_log` kind `drill`.
- [ ] Script không chứa khoá, mật khẩu, endpoint production.

## Cổng dừng A

- [ ] `packages/queue` · `apps/worker` · `packages/cache` không còn stub.
- [ ] Đúng hai job; không kéo danh mục P1.5 lên.
- [ ] Có ít nhất **một** hàng `backup_log` kind verify status success **thật**.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm lint:deps && pnpm check:progress` xanh.

---

## Khối B — cần Nitro runtime của P0.3

### Task 8 — `GET /api/guest/health`

- [ ] Kiểm song song ba dịch vụ, mỗi cái ≤ 2s, tổng ≤ 3s.
- [ ] `SELECT 1` qua Drizzle · `PING` Valkey · đếm `waiting` queue.
- [ ] Ca âm `BR-HLT-01`: tắt PostgreSQL → **503**, không phải 200.
- [ ] Ca âm `BR-HLT-04`: body không có `version`, `hostname`, chuỗi kết nối.
- [ ] `Cache-Control: no-store`.
- [ ] 503 gọi `alert()`.
- [ ] `pnpm --filter @kidthink/web test -- health` xanh.

### Task 9 — Smoke deploy

- [ ] `deploy.sh` gọi health check sau reload.
- [ ] Non-200 → abort và revert.
- [ ] Ca âm: health giả trả 503 làm deploy revert.
- [ ] Lúc khởi động (migration chưa xong) health trả 503.

## Cổng dừng B

- [ ] Health nói thật ở cả ba ca: đủ dịch vụ · thiếu DB · thiếu Valkey.
- [ ] Deploy không đi tiếp khi smoke fail.
- [ ] Human review diff.

---

## Task 10 — Evidence, cổng go-live, promote

- [ ] Mỗi `BR-BAK-*` `BR-HLT-*` có test tham chiếu mã rule.
- [ ] `BR-BAK-06` ghi thành mục cổng go-live trong [`security-checklist.md`](../specs/08-quality/security-checklist.md).
- [ ] Nêu lại §11 Q1 (chủ sở hữu khoá mã hoá) ở cổng ra P0 — chưa chốt thì chưa go-live.
- [ ] Ghi lệch **tên** cột `backup_log` (`storage_path`/`checksum`) vào [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md), **không** đổi cột.
- [ ] [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) · [`health-check.md`](../specs/01-platform/health-check.md) sang `implemented` chỉ khi đủ evidence.
- [ ] Tick **P0.8b** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

## Cổng dừng cuối

- [ ] Không kéo [`job-queue.md`](../specs/01-platform/job-queue.md) hay [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) lên sớm.
- [ ] Không secret, khoá, hay endpoint production trong source hoặc log.
- [ ] Không chạy job nào chạm dữ liệu production.
- [ ] Sẵn sàng lập plan P0.9.
