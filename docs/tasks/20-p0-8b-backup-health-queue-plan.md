# Kế hoạch — Task #20: P0.8b — Sao lưu, quan sát, và khung queue tối thiểu

> Viết 2026-08-09, đo tại commit `5a1bb2b`. Bước sở hữu: **P0.8b** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) ·
> [`health-check.md`](../specs/01-platform/health-check.md).
> Hai quyết định cạnh đảo phase áp vào đây: **`D-BT`** và **`D-BU`**.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Đây là bước đầu tiên của P0 **có hạ tầng chạy nền**. Nó tồn tại vì P0.8 đã tạo dữ liệu thật:
có dữ liệu rồi mới có thứ để mất.

Ba việc, đúng thứ tự phụ thuộc:

1. **Khung queue tối thiểu** — `packages/queue` (định nghĩa job + producer) và `apps/worker`
   (consumer). Cả hai hiện là stub `export {}`. `D-BT` bắt P0 phải có khung này cho
   `backup:postgres`; `D-BU` dùng lại đúng khung đó cho `email:send` ở P0.9b. Danh mục job
   đầy đủ, retry policy và alerting backlog vẫn ở P1.5.
2. **Backup và restore** — job dump, job verify, runbook, và cổng go-live.
3. **Health check** — endpoint nói thật về ba dịch vụ.

`packages/cache` cũng là stub. Health check phải `PING` Valkey thật (`BR-HLT-02`), nên bước
này là nơi `packages/cache` có nội dung lần đầu.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `DATA-MODEL-OVERVIEW` | `implemented` | |
| `JOB-QUEUE` (P1.5) | chưa | `D-BT` — P0 chỉ dựng khung tối thiểu, không kéo spec nguyên khối lên |
| Nitro runtime của `apps/web` | đang dựng ở P0.3 | Health check là route Nuxt server |

Health check cần `apps/web` chạy được. P0.3 đang dựng đúng phần đó. Vậy:

- **Khối A** — khung queue, job backup, script restore, cột `backup_log`. Không cần route. Chạy ngay.
- **Khối B** — `GET /api/guest/health` + smoke deploy. Cần Nitro runtime của P0.3.

## 1. Đo được

### 1.1 Ba package rỗng

| Đường dẫn | Nội dung hiện tại |
|---|---|
| [`packages/queue/src/index.ts`](../../packages/queue/src/index.ts) | `export {}` |
| [`packages/cache/src/index.ts`](../../packages/cache/src/index.ts) | `export {}` |
| `apps/worker` | chỉ `package.json`, không có `src` |

[`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md)
đã chốt hình dạng: `packages/queue` định nghĩa job + producer, `apps/worker` **chỉ consume**,
enqueue luôn đi qua `packages/queue`. `packages/cache` là nơi **duy nhất** khởi tạo client
Valkey. Bước này phải giữ đúng ranh giới đó ngay từ dòng đầu — sửa sau là sửa mọi call site.

### 1.2 `backup_log` không ghi được `verify` và `drill`

[`ops.ts`](../../packages/db/src/schema/ops.ts) có `backup_type` `status` `size_bytes`
`storage_path` `checksum` `started_at` `finished_at` `error_message`.

Hai lệch, một nặng hơn nhiều so với lệch còn lại.

**Nặng — enum `backup_type` là `["database", "storage"]`.** §7.2 khai `kind` với ba giá trị
`dump | verify | drill`. Đây không phải lệch tên: `verify` và `drill` **không có chỗ để ghi**.

Hệ quả đo được: `BR-BAK-06` là cổng go-live, và câu kiểm của nó ở §9 là *"chưa có hàng
`backup_log` nào kind verify status success"*. Với enum hiện tại, câu đó không truy vấn được —
cổng go-live quan trọng nhất của bước này không có dữ liệu để đọc. `BR-BAK-08` (DR drill ghi
RTO đo được) cũng vậy.

**Nhẹ — thiếu cột `restored_rows`.** Đó là chỗ `backup:verify` ghi số hàng đếm được sau khi
restore thử. Thiếu nó thì `BR-BAK-01` chỉ ghi được `success`/`failed` mà không ghi được **bằng
chứng** rằng dữ liệu restore ra thật sự có nội dung.

Các tên còn lại khác spec (`backup_type` vs `kind`, `storage_path` vs `s3_key`, `checksum` vs
`sha256`) nhưng ngữ nghĩa khớp — lệch tên, không phải lệch hợp đồng. Ghi vào spec, không đổi cột.

### 1.3 `infra/scripts/restore.sh` chưa tồn tại

`infra/scripts/` hiện chỉ có `deploy.sh`. §7.3 bước 4 của runbook gọi thẳng `restore.sh`.
Runbook trỏ tới một file không tồn tại là runbook chưa chạy được.

## 2. Quyết định

**D-DZ — Khung queue tối thiểu nghĩa là một job, không phải một danh mục.** P0.8b định nghĩa
đúng hình dạng job (`name`, `payload` có kiểu, `jobId` idempotent) và **hai** job cụ thể
(`backup:postgres`, `backup:verify`). Retry policy đầy đủ, alerting backlog, dead-letter là
P1.5. Cám dỗ ở đây là dựng luôn "hạ tầng queue hoàn chỉnh" — đó là kéo P1 lên P0.

**D-EA — `jobId` là khoá idempotent từ ngày đầu.** `D-BU` nói `BR-NOT-05` cần
`jobId = notification_id`. Nếu P0.8b dựng producer không có chỗ nhận `jobId`, P0.9b phải sửa
chữ ký hàm mà mọi job đã dùng. Rẻ hơn nhiều nếu có sẵn từ job đầu tiên.

**D-EB — Alerting ở P0.8b là một cổng, không phải một hệ thống.** `BR-BAK-04` và `BR-HLT-03`
đòi "fail phải tới tay người". [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md)
là P1.16. P0.8b giao một **port** `alert(severity, message)` với một adapter ghi log có cấu
trúc, và ca âm chứng minh mọi nhánh fail đều gọi nó. P1.16 thay adapter, không sửa call site.

**D-EC — Khoá mã hoá đọc từ biến môi trường; quyền sở hữu khoá là câu hỏi người.** §11 Q1 của
[`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) ghi "chặn go-live, không
hoãn thêm được", chủ là **người quyết**. P0.8b cài `BR-BAK-02` đúng kỹ thuật (mã hoá, khoá
không nằm cùng chỗ dump) và **nêu lại** câu hỏi ở cổng ra; nó không tự chốt quy trình xoay khoá.

## 3. Đồ thị

```
Khối A — chạy ngay
  T1 packages/cache — client Valkey, nơi duy nhất khởi tạo
  T2 packages/queue — hình dạng job + producer có jobId
        └──→ T3 apps/worker — consumer + đăng ký job
                  ├──→ T4 job backup:postgres (dump · nén · mã hoá · upload · backup_log)
                  │         └──→ T5 job backup:verify + cột restored_rows
                  └──→ T6 port alert() + ca âm mọi nhánh fail
  T7 infra/scripts/restore.sh + runbook chạy được
                              ── Cổng dừng A ──

Khối B — cần Nitro runtime của P0.3
  T8 GET /api/guest/health
        └──→ T9 smoke deploy abort-and-revert
                              ── Cổng dừng B ──
  T10 evidence, cổng go-live, promote
```

## 4. Task

### Task 1 — `packages/cache`

**Tiêu chí nghiệm thu**
- [ ] Export driver, **không** export instance client (mẫu ở [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) §7).
- [ ] Là nơi duy nhất khởi tạo kết nối Valkey; cổng `lint:deps` chặn app khởi tạo trực tiếp.
- [ ] `ping()` trả kết quả thật, có timeout.
- [ ] Ca âm: Valkey tắt → `ping()` trả fail trong ≤ 2s, **không** treo.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/cache test` xanh · `pnpm lint:deps` xanh.

**Phụ thuộc:** không · **Cỡ:** S

### Task 2 — `packages/queue`

**Tiêu chí nghiệm thu**
- [ ] Kiểu job khai tập trung: tên job là union đóng, payload có kiểu riêng từng job.
- [ ] `enqueue(name, payload, { jobId })` — `jobId` là tham số hạng nhất (D-EA).
- [ ] Producer **không** import gì từ `apps/*` (`BR-MPA-06`).
- [ ] Ca âm: enqueue hai lần cùng `jobId` chỉ tạo một job.
- [ ] Chỉ khai hai job của bước này; job lạ là lỗi biên dịch (D-DZ).

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/queue test` xanh · `pnpm lint:deps` xanh.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — `apps/worker`

**Tiêu chí nghiệm thu**
- [ ] Worker **chỉ** consume; không có đường enqueue trong `apps/worker`.
- [ ] Đăng ký handler theo tên job; tên không đăng ký → fail rõ ràng, không im lặng.
- [ ] Tắt sạch khi nhận tín hiệu dừng, không bỏ dở job đang chạy.
- [ ] `pnpm check:services` vẫn xanh (PG 17 + Valkey 9).

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/worker test` xanh.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Job `backup:postgres`

**Tiêu chí nghiệm thu**
- [ ] Dump toàn bộ → nén → **mã hoá** → upload; khoá đọc từ biến môi trường, **không** nằm cùng chỗ dump (`BR-BAK-02`, D-EC).
- [ ] Ghi `backup_log` mọi lần chạy, kèm `checksum` (`BR-BAK-03`).
- [ ] Retry 2 lần; fail tiếp → gọi `alert()` (`BR-BAK-04`).
- [ ] Ca âm `BR-BAK-02`: file tải về mở không có khoá thì không đọc được.
- [ ] Ca âm `BR-BAK-04`: dump fail → `backup_log.status = failed` **và** `alert()` được gọi đúng một lần.
- [ ] Retention 30 daily / 12 weekly / 24 monthly khai thành hằng số có tên, không số rải rác (`BR-BAK-05`).
- [ ] Không đường nào ghi dump ra thư mục người dùng hoặc bucket công khai (`BR-BAK-07`).

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/worker test -- backup` xanh, assertion tham chiếu `BR-BAK-02` `BR-BAK-03` `BR-BAK-04`.

**Phụ thuộc:** T3 · T6 · **Cỡ:** M

### Task 5 — Job `backup:verify`, enum `kind`, cột `restored_rows`

**Tiêu chí nghiệm thu**
- [ ] Ca âm trước: truy vấn của `BR-BAK-06` (`kind = verify AND status = success`) — **không chạy được** trên enum hiện tại.
- [ ] Migration đổi `backup_type` sang `dump | verify | drill` (§7.2).
- [ ] Migration thêm `restored_rows` vào `backup_log` (§7.2).
- [ ] Job restore bản mới nhất vào container tạm, đếm hàng các bảng chính, chạy 3 truy vấn nghiệp vụ.
- [ ] Ghi `restored_rows`; số hàng bằng 0 là **fail**, không phải success.
- [ ] Verify fail → `alert()` mức cao (`BR-BAK-01`).
- [ ] **Không** restore lên database đang nhận ghi — ca âm: trỏ vào DB chính thì job từ chối chạy.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/worker test -- backup-verify` xanh, assertion tham chiếu `BR-BAK-01`.

**Phụ thuộc:** T4 · **Cỡ:** M

### Task 6 — Port `alert()`

**Tiêu chí nghiệm thu**
- [ ] Interface `alert(severity, message, context)`; adapter P0 ghi log có cấu trúc (D-EB).
- [ ] Cổng: mọi nhánh `catch` trong job phải gọi `alert()` — ca âm là một job nuốt lỗi làm cổng **đỏ**.
- [ ] Context **không** chứa dữ liệu trẻ hay chuỗi kết nối.
- [ ] Ghi rõ trong spec rằng adapter thật thuộc P1.16, đổi adapter không đụng call site.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/worker test -- alert` xanh, assertion tham chiếu `BR-BAK-04`.

**Phụ thuộc:** T3 · **Cỡ:** S

### Task 7 — `infra/scripts/restore.sh` và runbook

**Tiêu chí nghiệm thu**
- [ ] Script nhận khoá object, tải, giải mã, restore; từ chối chạy khi target là DB đang nhận ghi.
- [ ] Runbook §7.3 chạy được từ đầu tới cuối trên môi trường local, có người ký từng bước.
- [ ] Đo RTO của một lần chạy thử, ghi vào `backup_log` kind `drill` (`BR-BAK-08`).
- [ ] Script **không** chứa khoá, mật khẩu, hay endpoint production.

**Kiểm chứng**
- [ ] Chạy tay một lần trên local, ghi kết quả vào checklist.

**Phụ thuộc:** T5 · **Cỡ:** M

### Cổng dừng A

- [ ] `packages/queue` · `apps/worker` · `packages/cache` không còn là stub.
- [ ] Đúng hai job được khai; không kéo danh mục P1.5 lên (D-DZ).
- [ ] Ít nhất **một** lần `backup:verify` thành công có thật trong `backup_log` (`BR-BAK-06`).
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm lint:deps && pnpm check:progress` xanh.

### Task 8 — `GET /api/guest/health`

**Tiêu chí nghiệm thu**
- [ ] Kiểm **song song** ba dịch vụ, mỗi cái timeout ≤ 2s, tổng ≤ 3s (`BR-HLT-05`).
- [ ] `SELECT 1` qua Drizzle · `PING` Valkey · đếm `waiting` của queue — dịch vụ thật (`BR-HLT-02`).
- [ ] Bất kỳ dịch vụ nào fail → **503**; ca âm `BR-HLT-01`: tắt PostgreSQL thì trả 503, không phải 200.
- [ ] Body đúng §7.2; ca âm `BR-HLT-04`: không `version`, không `hostname`, không chuỗi kết nối.
- [ ] `Cache-Control: no-store`.
- [ ] 503 gọi `alert()` (`BR-HLT-03`).

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/web test -- health` xanh, assertion tham chiếu `BR-HLT-01` `BR-HLT-02` `BR-HLT-04`.

**Phụ thuộc:** P0.3 dựng xong Nitro runtime · T1 · T2 · **Cỡ:** M

### Task 9 — Smoke deploy abort-and-revert

**Tiêu chí nghiệm thu**
- [ ] `infra/scripts/deploy.sh` gọi health check sau khi reload.
- [ ] Non-200 → **abort và revert** (`BR-HLT-06`); ca âm: health giả trả 503 làm deploy revert.
- [ ] Trong lúc khởi động (migration chưa xong) health trả 503, không 200.

**Kiểm chứng**
- [ ] Chạy thử kịch bản revert trên local, ghi kết quả.

**Phụ thuộc:** T8 · **Cỡ:** S

### Cổng dừng B

- [ ] Health check nói **thật** trong cả ba ca: đủ dịch vụ, thiếu DB, thiếu Valkey.
- [ ] Deploy không đi tiếp được khi smoke fail.
- [ ] Human review diff.

### Task 10 — Evidence, cổng go-live, promote

- [ ] Mỗi `BR-BAK-*` `BR-HLT-*` có ít nhất một test tham chiếu mã rule.
- [ ] `BR-BAK-06` ghi thành mục **cổng go-live**: chưa có hàng `backup_log` kind verify status success thì checklist fail.
- [ ] Nêu lại §11 Q1 (chủ sở hữu khoá mã hoá) ở cổng ra P0 — **chưa chốt thì chưa go-live** (D-EC).
- [ ] Ghi lệch tên cột `backup_log` (§1.2) vào spec, không đổi cột.
- [ ] Hai spec sang `implemented` chỉ khi đủ evidence; tick P0.8b chỉ khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Dựng "hạ tầng queue hoàn chỉnh" ở P0 | Kéo P1.5 lên, bước phình ra không kiểm soát | D-DZ — đúng hai job, job lạ là lỗi biên dịch |
| Producer không có `jobId` | P0.9b phải sửa chữ ký mà mọi job đã dùng | D-EA — `jobId` hạng nhất từ job đầu tiên |
| `alert()` chưa có hệ thống nhận | Cám dỗ bỏ trống nhánh fail | D-EB — port + ca âm chặn job nuốt lỗi |
| Backup chạy nhưng chưa từng restore | Đúng chế độ hỏng mà v1 đã có | `BR-BAK-06` thành cổng go-live đo được, T5 bắt `restored_rows` khác 0 |
| Enum `backup_type` không có `verify`/`drill` | Cổng go-live không có dữ liệu để đọc — cổng tồn tại trên giấy | T5 sửa enum, ca âm là chính truy vấn của `BR-BAK-06` |
| Khoá mã hoá không có chủ | `BR-BAK-02` không thi hành được; mất khoá = mất toàn bộ backup | D-EC — nêu lại ở cổng ra P0, chủ là người quyết |
| Health check trả 200 cứng cho "đỡ phiền" | Hạ tầng tin vào instance đã chết | `BR-HLT-01` có ca âm tắt DB thật |

## 6. Giả định

1. **Không có hạ tầng production.** P0.8b chạy và kiểm chứng trên local qua `docker-compose.yml`. Bucket, domain, instance thật thuộc câu hỏi hạ tầng ở [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
2. **`apps/web` sẽ có Nitro runtime từ P0.3.** Nếu P0.3 đổi hướng, khối B phải xếp lại.
3. **Lệch tên cột `backup_log` không sửa.** Ngữ nghĩa khớp; đổi tên cột đã ship để hợp chữ trong spec là chi phí không mua thêm gì.
4. **Không tạo package mới.** Job và producer vào `packages/queue`; adapter alert vào cùng chỗ tới khi P1.16 tách ra.

## 7. Ngoài phạm vi

- Danh mục job đầy đủ, retry policy, dead-letter, alerting backlog — [`job-queue.md`](../specs/01-platform/job-queue.md), P1.5.
- Hệ thống alert thật (kênh, ngưỡng, on-call) — [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md), P1.16.
- Job `email:send` — P0.9b, dựng **trên** khung của bước này (`D-BU`).
- Tách `/health/live` và `/health/ready` (§11 Q1 của [`health-check.md`](../specs/01-platform/health-check.md)) — P1.
- WAL archiving, cross-region backup — §11 Q2 và Q4, chặn ngân sách/chi phí.
