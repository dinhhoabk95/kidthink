# Kế hoạch — Task #30: P1.5 — Hàng đợi công việc & đường ống telemetry

> Viết 2026-08-09. Bước sở hữu: **P1.5** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`job-queue.md`](../specs/01-platform/job-queue.md) ·
> [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Hai spec, một bài học chung: **im lặng là chế độ hỏng tệ nhất**. Ở v1, worker bị tắt và không
ai biết — producer vẫn đẩy, không consumer nào lấy, email và export im lặng không chạy.
`BR-JOB-03` `BR-JOB-05` `BR-JOB-07` `BR-TLM-06` đều là con của một lần hỏng đó.

Khung tối thiểu đã dựng ở P0: `packages/queue` producer + `apps/worker` với `backup:postgres`
(`D-BT`) và `email:send` (`D-BU`). Bước này mở ra **đầy đủ**: 10 job, chính sách retry, ngưỡng
alert, và đường ống telemetry với bốn bảng rollup.

Ràng buộc nền: trên t3.small, `telemetry_events` là bảng lớn nhất và **không bao giờ nhỏ lại**.
`BR-TLM-01` cấm báo cáo đọc thẳng bảng đó. Rollup không phải tối ưu sớm — nó là điều kiện để
báo cáo tồn tại.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `DATA-MODEL-OVERVIEW` · `SCHEMA-PLAY-TELEMETRY` | P0.7 đã xong | cột `telemetry_events`, `play_sessions` |
| Khung queue tối thiểu | P0.8b / P0.9b | `packages/queue`, `apps/worker`, 2 job đã chạy |
| `EVENT-CATALOG` | P0 registry | tên event, `BR-EVT-03` idempotent theo `(session_uuid, seq)` |
| `CHILD-DATA-COMPLIANCE` | P0.4 | §7.3 — cấm PII |
| `PLAY-EVENT-INGESTION` | P1.6 — **sau** | route ingest; xem `D-FZ` |
| `SCORING-AND-RESULT` | P1.7 — **sau** | `rollup:session` tính điểm; xem `D-FZ` |
| `MONITORING-AND-ALERTING` | P1.16 — **sau** | kênh alert cuối; xem `D-FX` |

## 1. Đo được

### 1.1 Đã có

`packages/queue` với producer và `apps/worker` với hai job backup + `email:send`. Bảng
`telemetry_events` và `play_sessions` có cột từ P0.7. `D-Z` đã chốt: **không** partition
`telemetry_events` ở P0, giữ PK `(session_uuid, seq)`.

### 1.2 Chưa có

Tám job còn lại, chính sách retry theo loại, ngưỡng alert, bốn bảng rollup, retention 90 ngày,
và cổng nào canh việc worker có mặt trong cấu hình production.

### 1.3 Ba job chưa có chủ dữ liệu ở bước này

| Job | Dữ liệu đến từ |
|---|---|
| `order:expire` | P2.3 thanh toán |
| `account:purge` | P1.14 xoá tài khoản |
| `image:cleanup-orphan` | P2.7 storage |

Cộng thêm `rollup:session` (cần P1.6 + P1.7) và `sweep:abandoned` (cần P1.6). Xử ở `D-FW` và
`D-FZ`.

## 2. Quyết định

**D-FW — danh mục 10 job là **dữ liệu**, mỗi job khai **bước sở hữu**; job chưa tới bước thì
khai `pending`, và cổng canh.** Cách hỏng cũ: viết 10 consumer rỗng để đủ số, rồi quên bật.
Cách hỏng mới: chỉ viết job làm được rồi quên bảy job còn lại. Xử: registry job khai đủ 10 dòng
kèm `owner_step`; cổng đỏ khi (a) job có `owner_step` đã qua mà chưa có consumer, hoặc (b) có
consumer không nằm trong registry. Số 10 vì vậy đo được ở mọi thời điểm, không phải lời hứa.

**D-FX — alert phải **tới được người** ngay ở P1.5, dùng `email:send` làm kênh tạm.** §11 Q1 của
[`job-queue.md`](../specs/01-platform/job-queue.md) để mở kênh alert tới go-live, nhưng chính
spec đó viết: `BR-JOB-03`/`BR-JOB-05` **vô nghĩa** tới khi có kênh thật. Ghi log không phải kênh
— không ai đọc log lúc 2 giờ sáng. Xử: khai một cổng `AlertPort` với **một** adapter thật là
email tới địa chỉ vận hành (dùng `email:send` đã có từ P0.9b). P1.16 thay hoặc thêm adapter
(Telegram, dashboard) mà không sửa call site. Ca âm: alert chỉ ghi log → test **đỏ**.

**D-FY — worker chạy **cùng instance, khác process** trên t3.small; cấu hình production có mục
worker và cổng đọc được.** §11 Q2 để mở "cùng instance hay tách". Đo: t3.small có 2 vCPU / 2 GB
dùng chung cho PG, Valkey, web, worker ([`performance-budgets.md`](../specs/08-quality/performance-budgets.md) §7.4) — tách instance là tăng chi
phí trước khi có doanh thu. Chọn cùng instance, khác process, giới hạn concurrency. `BR-JOB-07`
thành **cổng**: đọc cấu hình process manager, thiếu mục worker hoặc bị comment → đỏ. **Nếu Infra
bác**: đổi là chuyển `apps/worker` sang instance riêng — đổi cấu hình deploy và biến môi trường
Valkey, **không** đổi code producer/consumer. Ghi rõ để quyết định sau không thành viết lại.

**D-FZ — `rollup:session` và `sweep:abandoned` **không** ship ở bước này.** Cả hai cần thứ chưa
tồn tại: `rollup:session` tính điểm (P1.7) và cần event thật (P1.6); `sweep:abandoned` cần vòng
đời phiên (P1.6). Ship consumer rỗng bây giờ là ship một job **im lặng không làm gì** — đúng chế
độ hỏng mà cả hai spec chống. P1.5 giao: hạ tầng, registry, chính sách retry, ngưỡng alert, bốn
bảng rollup, `rollup:daily`, `entitlement:expire`, retention. `rollup:session` ở **P1.7**,
`sweep:abandoned` ở **P1.6** — ghi nợ có địa chỉ.

**D-GA — cổng PII đặt ở **đầu** đường ống, không ở cuối.** `BR-TLM-03` nói rõ lý do: một event
chứa tên hay ngày sinh thì rollup, export, dashboard đều thừa hưởng, và không cổng nào ở cuối
dọn lại được. Xử: cổng quét **schema** event và **cột** rollup, chặn trường có hình dạng PII
(tên, email, ngày sinh, số điện thoại); định danh trẻ trong telemetry là `child_uuid`, không
phải `child_id` hay tên. Ca âm: thêm trường `child_name` vào một event schema → cổng đỏ.

**D-GB — ranh giới ngày ICT khai **một hàm duy nhất**.** `BR-TLM-08` là loại lỗi chỉ hiện ra ở
biên: phiên 23:50 và 00:10 phải rơi vào hai ngày khác nhau theo **UTC+7**. Mọi job và mọi truy
vấn rollup đọc từ một hàm; ca âm hai mốc đó là test bắt buộc.

## 3. Đồ thị

```
T1 registry 10 job (dữ liệu) + cổng đếm + ranh giới producer/consumer
      ├──→ T2 chính sách retry theo loại + jobId xác định + idempotent
      │         └──→ T3 AlertPort + adapter email + 4 ngưỡng alert
      └──→ T4 bốn bảng rollup + hàm ranh giới ngày ICT
                ├──→ T5 rollup:daily idempotent + entitlement:expire
                ├──→ T6 cổng PII đầu đường ống
                └──→ T7 retention 90 ngày + route analytics levels
                          ── Cổng dừng ──
  T8 evidence, promote, ghi nợ rollup:session (P1.7) và sweep:abandoned (P1.6)
```

## 4. Task

### Task 1 — Registry job và ranh giới

**Tiêu chí nghiệm thu**
- [ ] Mười job §7.1 khai dạng dữ liệu: tên, lịch, idempotency key, timeout, `owner_step` (`D-FW`).
- [ ] Cổng: consumer không có trong registry → đỏ; job có `owner_step` đã qua mà thiếu consumer → đỏ.
- [ ] `BR-JOB-04`: `packages/queue` **không** chứa consumer; `apps/worker` **không** expose HTTP (ngoài health nội bộ). Hai ca âm riêng, ép thêm bằng rule `dependency-cruiser`.
- [ ] `BR-JOB-07`: cấu hình process manager production có mục worker, **không** bị comment; cổng đọc file cấu hình (`D-FY`).
- [ ] Ca âm `BR-JOB-07`: comment mục worker → cổng đỏ.

**Kiểm chứng**
- [ ] `pnpm test -- job-registry` xanh, in ra "10/10 job khai báo".

**Phụ thuộc:** P0.8b · **Cỡ:** M

### Task 2 — Idempotency và retry

**Tiêu chí nghiệm thu**
- [ ] `BR-JOB-02`: `jobId` suy **xác định** từ khoá nghiệp vụ theo §7.1; producer không tự bịa.
- [ ] Ca âm: `enqueue` hai lần cùng khoá → queue có **một** job.
- [ ] `BR-JOB-01`: consumer idempotent — chạy lại không tạo hàng trùng, không đổi kết quả.
- [ ] Bảng retry §7.2 khai dạng dữ liệu: rollup/sweep 3× exp 5s · email 5× exp 30s · backup 2× fixed 5m · **purge 1×, fail → alert ngay, không tự retry**.
- [ ] `BR-JOB-08`: job dài chia lô có checkpoint; ca âm — job fail giữa chừng chạy lại **không** làm lại từ đầu.
- [ ] Valkey mất: producer **fail nhanh**, request đồng bộ vẫn thành công, health check 503.

**Kiểm chứng**
- [ ] `pnpm test -- job-idempotency` xanh, assertion tham chiếu `BR-JOB-01` `BR-JOB-02`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Alert tới được người

**Tiêu chí nghiệm thu**
- [ ] `AlertPort` là interface; **một** adapter thật gửi email vận hành qua `email:send` (`D-FX`).
- [ ] Ca âm: adapter chỉ ghi log → test **đỏ**.
- [ ] Bốn ngưỡng §7.3 khai dạng dữ liệu: backlog `waiting` > 500 trong 5 phút · `failed` > 10 trong 1 giờ · không job nào hoàn thành trong 15 phút · tuổi job cũ nhất > 30 phút.
- [ ] `BR-JOB-03` ca âm: dừng worker, đẩy > 500 job → alert phát trong 5 phút.
- [ ] `BR-JOB-05` ca âm: job vượt retry → nằm trong `failed` queue **và** alert được ghi nhận.
- [ ] `BR-TLM-06`: worker chết 10 phút → alert; test khẳng định alert **tới kênh**, không chỉ log.
- [ ] Chống bão alert: gom theo cửa sổ, nhưng **không** làm mất alert đầu tiên.

**Kiểm chứng**
- [ ] `pnpm test -- alerting` xanh, assertion tham chiếu `BR-JOB-03` `BR-JOB-05` `BR-TLM-06`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Bốn bảng rollup và ranh giới ngày

**Tiêu chí nghiệm thu**
- [ ] Migration tạo `child_session_summaries` `(child_id, session_uuid)` · `child_daily_stats` `(child_id, date_ict)` · `level_daily_stats` `(level_code, content_version, date_ict)` · `skill_daily_stats` `(skill_id, date_ict)`.
- [ ] Khoá chính đúng §7.1 — khoá là thứ làm rollup idempotent được.
- [ ] `BR-TLM-08`: một hàm ranh giới ngày ICT (`D-GB`); ca âm hai phiên 23:50 và 00:10 rơi hai ngày.
- [ ] Migration chạy được **từ đầu** trên database rỗng, không chỉ chạy tiếp.

**Kiểm chứng**
- [ ] `pnpm db:migrate` trên DB rỗng xanh; `pnpm --filter @kidthink/db test -- rollup-schema` xanh.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 5 — `rollup:daily` và `entitlement:expire`

**Tiêu chí nghiệm thu**
- [ ] `rollup:daily` chạy 02:00 ICT, `jobId = date_ict`, timeout 10 phút.
- [ ] `BR-TLM-02`: chạy lại cùng ngày cho **cùng** kết quả; ca âm chạy 3 lần, so từng hàng.
- [ ] `entitlement:expire` chạy 00:05 ICT, `jobId = date_ict`; dùng dữ liệu entitlement của P0.5.
- [ ] Event tới muộn ≤ 24h vẫn nhận và rollup ngày đó **chạy lại được**.
- [ ] `BR-TLM-05`: phiên guest ghi event với `child_uuid` NULL, **không** vào `mastery_state`, **không** đếm KPI trẻ.
- [ ] Rollup fail 3 lần → alert, **không** âm thầm bỏ.

**Kiểm chứng**
- [ ] `pnpm test -- rollup-daily` xanh, assertion tham chiếu `BR-TLM-02` `BR-TLM-05`.

**Phụ thuộc:** T4 · T3 · **Cỡ:** M

### Task 6 — Cổng PII đầu đường ống

**Tiêu chí nghiệm thu**
- [ ] `BR-TLM-03`: cổng quét **schema event** và **cột rollup**; trường hình dạng PII (tên, email, ngày sinh, điện thoại) → đỏ (`D-GA`).
- [ ] Định danh trẻ trong telemetry là `child_uuid`; ca âm — dùng tên trẻ hoặc `child_id` thô → đỏ.
- [ ] `BR-JOB-06`: job chạm dữ liệu trẻ đi qua đúng guard của [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md); ca âm — job bỏ guard → đỏ.
- [ ] Cổng chạy trong `pnpm check`, không phải script chạy tay.

**Kiểm chứng**
- [ ] `pnpm test -- telemetry-pii` xanh; fixture thêm `child_name` vào event schema → đỏ.

**Phụ thuộc:** T4 · **Cỡ:** M

### Task 7 — Retention và route analytics

**Tiêu chí nghiệm thu**
- [ ] `BR-TLM-09`: event thô giữ **90 ngày**, sau đó chỉ giữ rollup; job dọn có checkpoint và idempotent.
- [ ] Ca âm: dọn chạy hai lần không xoá nhầm dữ liệu trong hạn.
- [ ] `GET /api/managers/analytics/levels` đọc `level_daily_stats`, có `from` `to` `competency` `sort` `limit` ≤100.
- [ ] `BR-TLM-01`: cổng quét mọi truy vấn phục vụ route báo cáo — **không** truy vấn nào `SELECT` thẳng `telemetry_events`; ca âm thêm một truy vấn như vậy → đỏ.
- [ ] `BR-PRF-06`: trần phân trang ép ở server.
- [ ] Năm chỉ số nội dung §7.2 tính được từ rollup (tỉ lệ bỏ > 40%, tỉ lệ đúng < 30%, < 5 lượt/tuần, skill 0 level, tuần < 3 hoạt động) — ngưỡng khai dạng dữ liệu.

**Kiểm chứng**
- [ ] `pnpm test -- analytics-levels` xanh, assertion tham chiếu `BR-TLM-01` `BR-TLM-09`.

**Phụ thuộc:** T5 · **Cỡ:** M

### Cổng dừng

- [ ] Registry in ra 10/10 job, mỗi job có `owner_step`.
- [ ] Dừng worker → alert **tới email vận hành** trong ngưỡng, kiểm bằng tay một lần.
- [ ] `rollup:daily` chạy ba lần cho cùng ngày → kết quả không đổi.
- [ ] Không truy vấn báo cáo nào chạm `telemetry_events`.
- [ ] Cổng PII đã đỏ được trên fixture.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

### Task 8 — Evidence, promote, ghi nợ

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-JOB-*` và `BR-TLM-*` có ít nhất một test tham chiếu mã rule.
- [ ] [`job-queue.md`](../specs/01-platform/job-queue.md) sang `implemented` **khi** registry đủ và ba job `pending` có địa chỉ bước sở hữu.
- [ ] [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) **giữ** `approved` — `rollup:session` còn ở P1.7 (`D-FZ`); promote ở P1.7.
- [ ] Nợ ghi vào todo của P1.6 (`sweep:abandoned`) và P1.7 (`rollup:session`, `BR-TLM-04`).
- [ ] §11 Q1 kênh alert: ghi `D-FX` là kênh tạm, chốt cuối ở P1.16 — **không** để mở tới go-live.
- [ ] §11 Q2 vị trí worker: ghi `D-FY` và điều kiện đảo quyết định.
- [ ] Tick **P1.5** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Worker chết im lặng | Đúng bài học đắt nhất của v1 | `D-FX` — alert tới người, ca âm log-only đỏ |
| Ship consumer rỗng cho đủ 10 job | Job im lặng không làm gì, tệ hơn không có | `D-FZ` + `D-FW` — registry có `owner_step`, cổng đếm |
| PII lọt vào event | Mọi tầng sau thừa hưởng, không dọn ngược được | `D-GA` — cổng ở đầu đường ống |
| Rollup không idempotent | Chạy lại làm số liệu nhân đôi, báo cáo sai với phụ huynh | `BR-TLM-02` — ca âm chạy 3 lần |
| Báo cáo đọc `telemetry_events` | Query trên bảng lớn nhất trong đường vào màn hình → hạ instance | `BR-TLM-01` — cổng quét truy vấn |
| Ranh giới ngày dùng UTC | Phiên 23:50 ICT rơi nhầm ngày, phụ huynh thấy số sai | `D-GB` — một hàm, ca âm hai mốc |
| `purge` retry mù | Retry trên thao tác xoá là rủi ro lớn hơn chạy muộn | §7.2 — purge 1 lần, fail → alert ngay |
| Alert bão | Người tắt thông báo, quay lại im lặng | T3 — gom theo cửa sổ, giữ alert đầu tiên |

## 6. Giả định

1. **P0.8b và P0.9b đã đóng** — khung queue, `backup:postgres`, `email:send` chạy được.
2. **P0.7 đã đóng** — `telemetry_events`, `play_sessions` có cột.
3. **Không partition `telemetry_events`** (`D-Z`) — giữ PK `(session_uuid, seq)`.
4. **Chưa có event thật** — rollup test chạy trên dữ liệu seed; số thật đến ở P1.6.
5. **Adaptive và mastery ở P3** — `rollup:session` cập nhật `mastery_state` là việc của P3; P1.7 chỉ ghi điểm và summary.
6. **t3.small, một instance** (`D-FY`) cho tới khi Infra nói khác.

## 7. Ngoài phạm vi

- Route ingest event và khử trùng lô — P1.6.
- `sweep:abandoned` — P1.6.
- `rollup:session` và tính điểm — P1.7.
- Dashboard giám sát, kênh alert cuối — P1.16.
- `order:expire` — P2.3 · `image:cleanup-orphan` — P2.7 · `account:purge` — P1.14.
- Bảng rollup theo tuần, replay adaptive — P3.
