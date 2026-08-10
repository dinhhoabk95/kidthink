# Checklist — Task #31: P1.6 — Vòng đời phiên, nạp event idempotent & mất mạng

> Kế hoạch: [`31-p1-6-session-ingestion-offline-plan.md`](31-p1-6-session-ingestion-offline-plan.md).
> Nguyên tắc xuyên bước: **không bao giờ chặn gameplay**.
> Điểm số **không** làm ở đây — P1.7 sở hữu (`D-GE`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.4 đã đóng** — route config tạo hàng phiên tối thiểu.
- [ ] **P1.5 đã đóng** — registry job, alert, bảng rollup.
- [ ] Human approve kế hoạch và sáu quyết định D-GC · D-GD · D-GE · D-GF · D-GG · D-GH.
- [ ] Đối chiếu `BR-PSL-*` `BR-ING-*` `BR-OFF-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Đọc lại `BR-EVT-03` `BR-EVT-05` ở [`event-catalog.md`](../specs/00-foundation/event-catalog.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Máy trạng thái phiên

- [ ] Cột `completion_status` và `access_tier_at_start`.
- [ ] `BR-PSL-08` ghim `access_tier_at_start` lúc tạo.
- [ ] `BR-PSL-02` ghim `content_version` lúc tạo; ca âm publish v4 giữa chừng → phiên vẫn v3.
- [ ] `completed`/`abandoned` là **terminal**; ca âm mọi đường quay lại `in_progress` bị chặn.
- [ ] `BR-PSL-10` cổng: không route nào chỉ tạo `play_session`.
- [ ] Đổi trẻ giữa chừng → phiên cũ `abandoned`, phiên mới tạo (`D-DG`).

### Task 2 — Route nạp event

- [ ] `POST /api/users/play-sessions/{uuid}/events` + bản `guest`.
- [ ] `BR-ING-01` ca âm: chèn thẳng hai hàng cùng `(session_uuid, seq)` → **vi phạm PK**.
- [ ] Gửi lại lô y hệt → 200, `accepted = 0`, `skipped = 20`, số hàng không đổi.
- [ ] Trùng một phần → ghi phần mới, 200.
- [ ] `seq` lùi → **409** `EVENT_OUT_OF_ORDER` + log.
- [ ] Gap `seq` → WARN log, **không** fail (`D-DD`).
- [ ] `BR-ING-03` tên event lạ → **422 cả lô**, không ghi hàng nào.
- [ ] Payload thừa field → strip + log cảnh báo.
- [ ] `BR-ING-02` phiên terminal → **200**, bỏ event.
- [ ] Lô > 100 event → 413; body > 64 KB → 413.
- [ ] `BR-ING-08` payload có `score` → strip; ca âm không giá trị client nào vào cột điểm.
- [ ] `BR-ING-04` ownership kiểm ở DB; user B → **404**.
- [ ] `BR-ING-07` rate limit 600/IP · 300/account · 10 phút.
- [ ] Event trễ ≤ 24 giờ vẫn nhận.
- [ ] Response `{ accepted, skipped, last_seq }`.

### Task 3 — Buffer bền và flush

- [ ] `BR-OFF-03` ghi IndexedDB mỗi 10 giây; store `pending_events` + `session_meta`.
- [ ] Flush: 20 event · 10 giây · phiên kết thúc · `visibilitychange`.
- [ ] `BR-ING-06` trang ẩn → `sendBeacon`.
- [ ] `BR-OFF-04` flush theo thứ tự `seq`, server khử trùng.
- [ ] `BR-ING-05` server 500 → game **không** dừng, event ở lại buffer.
- [ ] Ca âm: đóng tab offline → mở lại có mạng → đủ số event được gửi.
- [ ] `BR-OFF-05` buffer > 24 giờ → bỏ, log local.
- [ ] Buffer > 5 MB → bỏ event cũ nhất, **giữ** `game_started` và `game_completed`.
- [ ] `BR-OFF-06` guest được buffer, không lưu tiến độ.
- [ ] `seq` bắt đầu từ 1; `game_started` là `seq = 1`.

### Task 4 — Service worker phạm vi hẹp

- [ ] Shell/JS/CSS cache-first theo build.
- [ ] Asset phiên hiện tại cache-first, **xoá khi phiên kết thúc**.
- [ ] Config network-first.
- [ ] API **cấm cache**.
- [ ] `BR-OFF-07` ca âm: cache của guest **không** chứa `content_pack` bậc cao.
- [ ] `BR-OFF-02` preload toàn bộ asset trước khi bắt đầu; ca âm bắt đầu sớm → lỗi.
- [ ] Offline lúc mở → màn hình "cần kết nối" thân thiện, level đã cache vẫn chơi được.
- [ ] `BR-OFF-08` chỉ báo nhỏ ở góc; ca âm modal chặn màn hình → đỏ.
- [ ] Không dựng PWA install (P5).

### Task 5 — Route complete

- [ ] `POST /api/users/play-sessions/{uuid}/complete`, body `{ last_seq }`.
- [ ] `BR-PSL-01` complete lần hai → **409**; điểm và mastery không đổi.
- [ ] Phiên > 4 giờ → **410** `SESSION_EXPIRED`.
- [ ] Phiên không thuộc caller → **404**.
- [ ] Trả `rounds_correct` / `rounds_total` đếm từ chuỗi event.
- [ ] `score` / `normalized_score` / `stars` = **null** cho tới P1.7 (`D-GE`).
- [ ] Ca âm: client không có nhánh tự tính điểm.
- [ ] `BR-PSL-06` hết hạn mức/hết gói giữa chừng → phiên hiện tại chạy hết; phiên mới 402.

### Task 6 — `sweep:abandoned`

- [ ] Chạy mỗi 10 phút, `jobId = window_start`, timeout 2 phút.
- [ ] Không event và không complete sau **30 phút** → `abandoned`.
- [ ] `BR-PSL-07` cộng thời gian chơi vào `child_daily_stats`.
- [ ] `BR-PSL-07` tăng lượt bỏ ở `level_daily_stats`.
- [ ] Idempotent: chạy lại không đóng nhầm phiên đang hoạt động, không đếm hai lần.
- [ ] Event tới phiên `abandoned` → 200, bỏ.

### Task 7 — Hàm gác mastery

- [ ] Bốn điều kiện §7.3 trong **một** hàm, cửa duy nhất.
- [ ] `BR-PSL-04` guest → không ghi.
- [ ] `BR-PSL-05` preview → không ghi, không đếm KPI.
- [ ] Level không gắn skill → không ghi.
- [ ] Bốn nhánh từ chối đều có test (dù P1 chưa ghi gì).
- [ ] Ca âm: đường ghi mastery bỏ qua hàm gác → cổng đỏ.

## Cổng dừng

- [ ] Phiên thật: mở → chơi → mất mạng → chơi tiếp → có mạng → event đủ, không trùng.
- [ ] Complete hai lần → 409, số liệu không đổi.
- [ ] Idempotency ép ở **PK**, chứng minh bằng chèn thẳng DB.
- [ ] Test offline dùng chế độ offline **thật**; không chuỗi `navigator.onLine` trong test.
- [ ] Cache service worker không chứa nội dung trả phí.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 8 — Evidence và promote

- [ ] Mỗi `BR-PSL-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-ING-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-OFF-*` có test tham chiếu mã rule.
- [ ] [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) → `implemented`.
- [ ] [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) → `implemented`.
- [ ] [`offline-play.md`](../specs/01-platform/offline-play.md) → `implemented`.
- [ ] Nợ sang P1.7: điểm · `normalized_score` · `stars` · `rollup:session`.
- [ ] Tick **P1.6** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Tải trước một tuần curriculum để chơi offline — **P5**, chủ Infra.
