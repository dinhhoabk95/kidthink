# Kế hoạch — Task #31: P1.6 — Vòng đời phiên, nạp event idempotent & mất mạng

> Viết 2026-08-09. Bước sở hữu: **P1.6** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) ·
> [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) ·
> [`offline-play.md`](../specs/01-platform/offline-play.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Phiên chơi là **đơn vị đo** của toàn hệ thống: báo cáo, mastery, KPI nội dung đều dựng trên nó.
Nó phải mở đúng một lần, đóng đúng một lần, và luôn biết mình gắn với version nội dung nào.

Ba spec là ba lớp của cùng một đường dữ liệu:

1. **Vòng đời** — máy trạng thái `in_progress → completed | abandoned`, hai trạng thái cuối là
   **terminal**, không có đường về.
2. **Nạp event** — idempotent theo `(session_uuid, seq)` **ép ở PK của DB**, không ép bằng logic
   ứng dụng.
3. **Mất mạng** — phiên đang chạy **không bị ngắt**; buffer bền trong IndexedDB.

Ràng buộc chung xuyên ba spec: **không bao giờ chặn gameplay**. `BR-ING-05` và `BR-OFF-01` nói
cùng một điều từ hai phía — trẻ không chờ mạng.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `GAME-CONFIG-DELIVERY` | P1.4 | hàng phiên tối thiểu đã tạo (`D-FR`) |
| `EVENT-CATALOG` | P0 registry | tên + schema event; `BR-EVT-03` `BR-EVT-05` |
| `CONTENT-VERSIONING` | P0.6 | `content_version` ghim lúc tạo |
| `JOB-QUEUE` | P1.5 | `sweep:abandoned` là nợ của bước này (`D-FZ`) |
| `GAME-ENGINE-RUNTIME` | P1.2 | buffer, `sendBeacon`, `BR-ENG-03` |
| `RATE-LIMITING` | P0.9b đã xong | hạn mức riêng, rộng cho ingest |
| `SCORING-AND-RESULT` | P1.7 — **sau** | xem `D-GE` |

## 1. Đo được

### 1.1 Đã có

Sau P1.4: hàng `play_sessions` tối thiểu (`uuid`, `child_id`, `level_code`, `content_version`,
`is_preview`, `started_at`). Sau P1.5: registry job, chính sách retry, ngưỡng alert, bảng rollup.
Sau P1.2: engine có buffer và đường `sendBeacon` khi trang ẩn.

### 1.2 Chưa có

Route ingest, route complete, `sweep:abandoned`, cột `access_tier_at_start` và
`completion_status`, IndexedDB buffer bền, service worker, và bốn điều kiện §7.3 chặn ghi
mastery.

### 1.3 Đã chốt, không mở lại

`D-DF` 30 phút sweep · `D-DG` phiên `abandoned` là terminal, quay lại là phiên **mới** ·
`D-DD` gap `seq` → WARN log, không fail request · `D-DE` không nén custom ở P1 ·
`D-CR` buffer 5 MB là dư cho một phiên.

## 2. Quyết định

**D-GC — `sweep:abandoned` làm ở bước này, đúng địa chỉ nợ của `D-FZ`.** P1.5 cố tình không
ship nó vì vòng đời phiên chưa tồn tại. Ở đây nó có đủ thứ cần: trạng thái, ngưỡng 30 phút
(`D-DF`), và `BR-PSL-07` — phiên bỏ dở **vẫn được đếm** vào thời gian chơi và KPI bỏ game.

**D-GD — P1.6 **mở rộng** hàng phiên của P1.4, không tạo đường thứ hai.** `BR-PSL-10`: tạo
phiên là **tác dụng phụ của lấy config**, cấm endpoint riêng. P1.6 thêm cột
`access_tier_at_start` (`BR-PSL-08`) và `completion_status`, thêm đường đóng phiên — nhưng
đường **tạo** vẫn là route config của P1.4. Cổng: quét mọi route, không route nào chỉ tạo
`play_session` mà không trả config.

**D-GE — route `complete` đóng phiên và **đếm**, nhưng **không** tính điểm; điểm là của P1.7.**
`BR-PSL-03` và `BR-TLM-04` bắt điểm tính ở server từ chuỗi event. Công thức điểm, `normalized_score`
và `stars` do [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) sở hữu — ship một
công thức tạm ở đây rồi đổi ở P1.7 là ghi số sai vào `play_sessions` của những phiên thật đầu
tiên. Xử: P1.6 trả `rounds_correct` / `rounds_total` **đếm thuần từ chuỗi event**, và
`score` / `normalized_score` / `stars` là `null` cho tới P1.7. Ca âm: client **không** được tự
tính điểm khi thấy `null` — test khẳng định không có nhánh tính điểm nào ở client.

**D-GF — test offline dùng chế độ offline **thật** của Playwright; mock `navigator.onLine` là
lỗi cổng.** Spec ghi thẳng ở §9 và §10. Lý do đủ mạnh để thành cổng: mock `onLine` cho qua mọi
thứ mà mạng thật vẫn hỏng — `fetch` treo, `sendBeacon` rơi, IndexedDB ghi nửa chừng. Cổng quét
chuỗi `navigator.onLine` trong test → đỏ.

**D-GG — service worker ở P1 chỉ cache **shell + asset của phiên hiện tại**, và cache nội dung
trả phí là lỗi bảo mật.** `BR-OFF-07`: cache là đường rò nội dung. [`pwa-install.md`](../specs/01-platform/pwa-install.md)
là P5 — bước này **không** dựng PWA đầy đủ. Bốn chiến lược §7.2 khai dạng dữ liệu, và có ca âm:
guest duyệt catalog → kiểm cache → **không** `content_pack` của level bậc cao nào được lưu.

**D-GH — bốn điều kiện ghi `mastery_state` là **một hàm gác**, gọi ở đúng một chỗ.** §7.3 liệt
kê bốn điều kiện (`child_profile_id` khác NULL, `is_preview = false`,
`completion_status = 'completed'`, level có ít nhất một skill). Rải bốn `if` ở bốn nơi là bốn cơ
hội quên một cái, và hậu quả là dữ liệu học tập nhiễu — thứ không dọn ngược được. Ở P1 hàm này
**chưa ghi gì** (mastery là P3), nhưng nó tồn tại, có test, và là cửa duy nhất.

## 3. Đồ thị

```
T1 máy trạng thái + cột access_tier_at_start · completion_status (mở rộng hàng P1.4)
      ├──→ T2 route events: idempotent ở PK · seq · lô ≤100 · 8 nhánh lỗi
      │         └──→ T3 buffer IndexedDB + flush + sendBeacon + thứ tự seq
      │                   └──→ T4 service worker: shell + asset phiên, cấm cache trả phí
      ├──→ T5 route complete: đóng một lần, 409/410, đếm rounds (D-GE)
      └──→ T6 sweep:abandoned (nợ D-FZ) + đếm KPI bỏ game
                ├──→ T7 hàm gác mastery (bốn điều kiện, chưa ghi)
                          ── Cổng dừng ──
  T8 E2E offline thật · evidence · promote (gồm telemetry-pipeline phần P1.6)
```

## 4. Task

### Task 1 — Máy trạng thái phiên

**Tiêu chí nghiệm thu**
- [ ] Cột `completion_status` (`in_progress` | `completed` | `abandoned`) và `access_tier_at_start`.
- [ ] `BR-PSL-08`: `access_tier_at_start` ghim **lúc tạo** (ở route config của P1.4).
- [ ] `BR-PSL-02`: `content_version` ghim lúc tạo, **không** đọc lại lúc complete; ca âm — publish version 4 giữa chừng, phiên vẫn ghi version 3.
- [ ] Hai trạng thái cuối **terminal**; ca âm — mọi đường ghi đưa `completed`/`abandoned` về `in_progress` bị chặn ở tầng DB hoặc code.
- [ ] `BR-PSL-10` cổng: không route nào chỉ tạo `play_session` mà không trả config (`D-GD`).
- [ ] Đổi trẻ giữa chừng → phiên cũ `abandoned`, phiên mới tạo (`D-DG`).

**Kiểm chứng**
- [ ] `pnpm test -- session-state` xanh, assertion tham chiếu `BR-PSL-02` `BR-PSL-08` `BR-PSL-10`.

**Phụ thuộc:** P1.4 · **Cỡ:** M

### Task 2 — Route nạp event

**Tiêu chí nghiệm thu**
- [ ] `POST /api/users/play-sessions/{uuid}/events` và bản `guest`.
- [ ] `BR-ING-01`: idempotent ép ở **PK `(session_uuid, seq)`**; ca âm — chèn thẳng hai hàng cùng khoá → vi phạm PK (không phải chỉ logic app chặn).
- [ ] Gửi lại lô y hệt → 200, `accepted = 0`, `skipped = 20`, số hàng không đổi.
- [ ] Trùng một phần → ghi phần mới, bỏ phần trùng, 200.
- [ ] `seq` lùi so với `last_seq` → **409** `EVENT_OUT_OF_ORDER` + log.
- [ ] Gap `seq` → **WARN** log, **không** fail request (`D-DD`).
- [ ] `BR-ING-03`: tên event lạ → **422 cho cả lô**, không ghi hàng nào.
- [ ] Payload thừa field → strip, ghi phần hợp lệ, log cảnh báo.
- [ ] `BR-ING-02`: phiên `completed`/`abandoned` → **200**, bỏ event (không lỗi, để client không retry vô hạn).
- [ ] Lô > 100 event → **413**; body > 64 KB → 413.
- [ ] `BR-ING-08`: payload chứa `score` → **strip**; ca âm khẳng định không giá trị nào từ client vào cột điểm.
- [ ] `BR-ING-04`: ownership kiểm ở **DB**; user B gửi vào phiên user A → **404**.
- [ ] `BR-ING-07`: rate limit riêng 600/IP · 300/account · 10 phút, dùng bảng hạn mức P0.9b.
- [ ] Event trễ ≤ **24 giờ** vẫn nhận.
- [ ] Response đúng `{ accepted, skipped, last_seq }`.

**Kiểm chứng**
- [ ] `pnpm test -- event-ingestion` xanh, assertion tham chiếu `BR-ING-01` `BR-ING-03` `BR-ING-08`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Buffer bền và flush

**Tiêu chí nghiệm thu**
- [ ] `BR-OFF-03`: buffer ghi IndexedDB mỗi 10 giây; store `pending_events` và `session_meta` đúng §7.1.
- [ ] Flush khi: đủ 20 event · hết 10 giây · phiên kết thúc · `visibilitychange` ẩn.
- [ ] `BR-ING-06` / `BR-OFF-04`: trang ẩn → `navigator.sendBeacon`; còn lại `fetch` có retry; flush theo thứ tự `seq`.
- [ ] `BR-ING-05`: server trả 500 → **game không dừng**, event ở lại buffer để gửi lại.
- [ ] Ca âm: đóng tab khi offline → mở lại có mạng → đúng số event được gửi.
- [ ] `BR-OFF-05`: buffer quá **24 giờ** bị bỏ, ghi log local.
- [ ] Buffer quá **5 MB** → bỏ event cũ nhất, **giữ** `game_started` và `game_completed`.
- [ ] `BR-OFF-06`: guest cũng được buffer, không lưu tiến độ.
- [ ] `seq` bắt đầu từ **1**, `game_started` luôn `seq = 1`.

**Kiểm chứng**
- [ ] `pnpm test -- offline-buffer` xanh; `pnpm test:e2e -- offline` dùng chế độ offline thật.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Service worker phạm vi hẹp

**Tiêu chí nghiệm thu**
- [ ] Bốn chiến lược §7.2 khai dạng dữ liệu: shell/JS/CSS cache-first theo build · asset phiên hiện tại cache-first, **xoá khi phiên kết thúc** · config network-first · API **cấm cache**.
- [ ] `BR-OFF-07` ca âm: guest duyệt catalog → cache **không** chứa `content_pack` của level bậc cao (`D-GG`).
- [ ] `BR-OFF-02`: preload **toàn bộ** asset của phiên trước khi bắt đầu; ca âm — bắt đầu khi còn asset đang tải là lỗi.
- [ ] Offline khi **mở** game → chỉ chơi được level đã cache; còn lại hiện màn hình "cần kết nối" **thân thiện**.
- [ ] `BR-OFF-08`: chỉ báo offline nhỏ ở góc, **không** modal che màn hình; ca âm quét modal chặn.
- [ ] Không dựng PWA install — đó là P5.

**Kiểm chứng**
- [ ] `pnpm test:e2e -- sw-cache` xanh, assertion tham chiếu `BR-OFF-07` `BR-OFF-08`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Route complete

**Tiêu chí nghiệm thu**
- [ ] `POST /api/users/play-sessions/{uuid}/complete`, body `{ last_seq }`, auth + ownership.
- [ ] `BR-PSL-01`: complete lần hai → **409** `SESSION_ALREADY_COMPLETED`; điểm và mastery **không đổi**.
- [ ] Phiên quá 4 giờ → **410** `SESSION_EXPIRED` khi gửi event.
- [ ] Phiên không thuộc caller → **404**.
- [ ] Trả `rounds_correct` / `rounds_total` đếm thuần từ chuỗi event; `score` / `normalized_score` / `stars` **null** cho tới P1.7 (`D-GE`).
- [ ] Ca âm: **không** nhánh tính điểm nào ở client khi thấy `null`.
- [ ] `BR-PSL-06`: hết hạn mức hoặc hết gói giữa chừng → phiên hiện tại **chạy hết**; phiên mới → 402 (dùng gating P1.3).

**Kiểm chứng**
- [ ] `pnpm test -- session-complete` xanh, assertion tham chiếu `BR-PSL-01` `BR-PSL-06`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 6 — `sweep:abandoned` (nợ `D-FZ`)

**Tiêu chí nghiệm thu**
- [ ] Job chạy mỗi 10 phút, `jobId = window_start`, timeout 2 phút (registry P1.5).
- [ ] Phiên không event và không complete sau **30 phút** → `abandoned` (`D-DF`).
- [ ] `BR-PSL-07`: phiên bỏ dở **vẫn** cộng thời gian chơi vào `child_daily_stats` và **vẫn** tăng lượt bỏ ở `level_daily_stats`.
- [ ] Job idempotent: chạy lại không đóng nhầm phiên đang hoạt động, không đếm hai lần.
- [ ] Phiên `abandoned` là terminal — event tới sau trả 200 và bị bỏ.

**Kiểm chứng**
- [ ] `pnpm test -- sweep-abandoned` xanh, assertion tham chiếu `BR-PSL-07`.

**Phụ thuộc:** T5 · P1.5 · **Cỡ:** M

### Task 7 — Hàm gác mastery

**Tiêu chí nghiệm thu**
- [ ] Bốn điều kiện §7.3 nằm trong **một** hàm, là cửa duy nhất (`D-GH`).
- [ ] `BR-PSL-04`: guest → `child_profile_id` NULL, **không** ghi mastery.
- [ ] `BR-PSL-05`: preview → `is_preview = true`, **không** ghi mastery, **không** đếm KPI.
- [ ] Level không gắn skill nào → không ghi.
- [ ] Ở P1 hàm **chưa ghi gì** (mastery là P3) nhưng có test cho cả bốn nhánh từ chối.
- [ ] Ca âm: gọi thẳng đường ghi mastery bỏ qua hàm gác → cổng đỏ.

**Kiểm chứng**
- [ ] `pnpm test -- mastery-guard` xanh, assertion tham chiếu `BR-PSL-04` `BR-PSL-05`.

**Phụ thuộc:** T6 · **Cỡ:** S

### Cổng dừng

- [ ] Một phiên thật: mở → chơi → mất mạng → chơi tiếp → có mạng → event đủ, không trùng.
- [ ] Complete hai lần → 409, số liệu không đổi.
- [ ] Idempotency ép ở **PK**, chứng minh bằng chèn thẳng vào DB.
- [ ] Test offline dùng chế độ offline **thật**; không chuỗi `navigator.onLine` nào trong test (`D-GF`).
- [ ] Cache service worker không chứa nội dung trả phí.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 8 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-PSL-*` `BR-ING-*` `BR-OFF-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec của bước sang `implemented`.
- [ ] [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) vẫn `approved` — còn `rollup:session` ở P1.7.
- [ ] Nợ ghi sang P1.7: điểm, `normalized_score`, `stars`, `rollup:session`.
- [ ] Tick **P1.6** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Idempotency chỉ ép ở tầng ứng dụng | Hai request song song ghi trùng, mastery và KPI nhân đôi | `BR-ING-01` — ca âm chèn thẳng vào DB |
| Complete hai lần | Nhân đôi mastery và KPI | `BR-PSL-01` — 409, ca âm số liệu không đổi |
| Ship công thức điểm tạm | Phiên thật đầu tiên mang số sai, không sửa ngược được | `D-GE` — trả `null`, P1.7 sở hữu điểm |
| Test offline mock `navigator.onLine` | Test xanh, mạng thật vẫn hỏng | `D-GF` — cổng quét chuỗi, dùng Playwright offline |
| Service worker cache nội dung trả phí | Rò nội dung — cùng loại thiệt hại với bug gating | `D-GG` — ca âm kiểm cache của guest |
| Ngắt phiên khi mất mạng hoặc hết hạn mức | Trẻ đang chơi bị cắt ngang | `BR-OFF-01` `BR-PSL-06` — ca âm cả hai |
| Bốn điều kiện mastery rải nhiều nơi | Nhiễu dữ liệu học tập, không dọn ngược được | `D-GH` — một hàm gác, cửa duy nhất |
| Phiên mồ côi do tách endpoint tạo | Dữ liệu rác, KPI sai | `BR-PSL-10` — cổng quét route |

## 6. Giả định

1. **P1.4 đã đóng** — hàng phiên tối thiểu và route config đã tạo phiên.
2. **P1.5 đã đóng** — registry job, alert, bảng rollup có sẵn cho `sweep:abandoned`.
3. **Mastery ở P3** — hàm gác tồn tại nhưng chưa ghi.
4. **Hạn mức giờ chơi ở P1.8** — ở đây chỉ cần đường 402 cho phiên **mới**, phiên đang chạy không bị cắt.
5. **PWA đầy đủ ở P5** — service worker phạm vi hẹp.
6. **Không nén payload custom** (`D-DE`).

## 7. Ngoài phạm vi

- Công thức điểm, `stars`, màn hình tổng kết — P1.7, P1.8.
- `rollup:session` — P1.7.
- `mastery_state` thật — P3.5.
- Tải trước cả thư viện để chơi offline hoàn toàn — P5 (§11 Q1).
- PWA install — P5.
