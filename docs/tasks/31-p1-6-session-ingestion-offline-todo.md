# Checklist — Task #31: P1.6 — Vòng đời phiên, nạp event idempotent & mất mạng

> Kế hoạch: [`31-p1-6-session-ingestion-offline-plan.md`](31-p1-6-session-ingestion-offline-plan.md).
> Nguyên tắc xuyên bước: **không bao giờ chặn gameplay**.
> Điểm số **không** làm ở đây — P1.7 sở hữu (`D-GE`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P1.4 đã đóng** — route config tạo hàng phiên tối thiểu.
- [x] **P1.5 đã đóng** — registry job, alert, bảng rollup.
- [x] Human approve kế hoạch và sáu quyết định D-GC · D-GD · D-GE · D-GF · D-GG · D-GH.
- [x] Đối chiếu `BR-PSL-*` `BR-ING-*` `BR-OFF-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Đọc lại `BR-EVT-03` `BR-EVT-05` ở [`event-catalog.md`](../specs/00-foundation/event-catalog.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Máy trạng thái phiên

- [x] Cột `completion_status` và `access_tier_at_start`.
- [x] `BR-PSL-08` ghim `access_tier_at_start` lúc tạo.
- [x] `BR-PSL-02` ghim `content_version` lúc tạo; ca âm publish v4 giữa chừng → phiên vẫn v3.
- [x] `completed`/`abandoned` là **terminal**; ca âm mọi đường quay lại `in_progress` bị chặn.
- [x] `BR-PSL-10` cổng: không route nào chỉ tạo `play_session`.
- [x] Đổi trẻ giữa chừng → phiên cũ `abandoned`, phiên mới tạo (`D-DG`).

### Task 2 — Route nạp event

- [x] `POST /api/users/play-sessions/{uuid}/events` + bản `guest`.
- [x] `BR-ING-01` ca âm: chèn thẳng hai hàng cùng `(session_uuid, seq)` → **vi phạm PK**.
- [x] Gửi lại lô y hệt → 200, `accepted = 0`, `skipped = 20`, số hàng không đổi.
- [x] Trùng một phần → ghi phần mới, 200.
- [x] `seq` lùi → **409** `EVENT_OUT_OF_ORDER` + log.
- [x] Gap `seq` → WARN log, **không** fail (`D-DD`).
- [x] `BR-ING-03` tên event lạ → **422 cả lô**, không ghi hàng nào.
- [x] Payload thừa field → strip + log cảnh báo.
- [x] `BR-ING-02` phiên terminal → **200**, bỏ event.
- [x] Lô > 100 event → 413; body > 64 KB → 413.
- [x] `BR-ING-08` payload có `score` → strip; ca âm không giá trị client nào vào cột điểm.
- [x] `BR-ING-04` ownership kiểm ở DB; user B → **404**.
- [x] `BR-ING-07` rate limit 600/IP · 300/account · 10 phút.
- [x] Event trễ ≤ 24 giờ vẫn nhận.
- [x] Response `{ accepted, skipped, last_seq }`.

### Task 3 — Buffer bền và flush

- [x] `BR-OFF-03` ghi IndexedDB mỗi 10 giây; store `pending_events` + `session_meta`.
- [x] Flush: 20 event · 10 giây · phiên kết thúc · `visibilitychange`.
- [x] `BR-ING-06` trang ẩn → `sendBeacon`.
- [x] `BR-OFF-04` flush theo thứ tự `seq`, server khử trùng.
- [x] `BR-ING-05` server 500 → game **không** dừng, event ở lại buffer.
- [x] Ca âm: đóng tab offline → mở lại có mạng → đủ số event được gửi.
- [x] `BR-OFF-05` buffer > 24 giờ → bỏ, log local.
- [x] Buffer > 5 MB → bỏ event cũ nhất, **giữ** `game_started` và `game_completed`.
- [x] `BR-OFF-06` guest được buffer, không lưu tiến độ.
- [x] `seq` bắt đầu từ 1; `game_started` là `seq = 1`.

### Task 4 — Service worker phạm vi hẹp

- [x] Shell/JS/CSS cache-first theo build.
- [x] Asset phiên hiện tại cache-first, **xoá khi phiên kết thúc**.
- [x] Config network-first.
- [x] API **cấm cache**.
- [x] `BR-OFF-07` ca âm: cache của guest **không** chứa `content_pack` bậc cao.
- [x] `BR-OFF-02` preload toàn bộ asset trước khi bắt đầu; ca âm bắt đầu sớm → lỗi.
- [x] Offline lúc mở → màn hình "cần kết nối" thân thiện, level đã cache vẫn chơi được.
- [x] `BR-OFF-08` chỉ báo nhỏ ở góc; ca âm modal chặn màn hình → đỏ.
- [x] Không dựng PWA install (P5).

### Task 5 — Route complete

- [x] `POST /api/users/play-sessions/{uuid}/complete`, body `{ last_seq }`.
- [x] `BR-PSL-01` complete lần hai → **409**; điểm và mastery không đổi.
- [x] Phiên > 4 giờ → **410** `SESSION_EXPIRED`.
- [x] Phiên không thuộc caller → **404**.
- [x] Trả `rounds_correct` / `rounds_total` đếm từ chuỗi event.
- [x] `score` / `normalized_score` / `stars` = **null** cho tới P1.7 (`D-GE`).
- [x] Ca âm: client không có nhánh tự tính điểm.
- [x] `BR-PSL-06` hết hạn mức/hết gói giữa chừng → phiên hiện tại chạy hết; phiên mới 402.

### Task 6 — `sweep:abandoned`

- [x] Chạy mỗi 10 phút, `jobId = window_start`, timeout 2 phút.
- [x] Không event và không complete sau **30 phút** → `abandoned`.
- [x] `BR-PSL-07` cộng thời gian chơi vào `child_daily_stats`.
- [x] `BR-PSL-07` tăng lượt bỏ ở `level_daily_stats`.
- [x] Idempotent: chạy lại không đóng nhầm phiên đang hoạt động, không đếm hai lần.
- [x] Event tới phiên `abandoned` → 200, bỏ.

### Task 7 — Hàm gác mastery

- [x] Bốn điều kiện §7.3 trong **một** hàm, cửa duy nhất.
- [x] `BR-PSL-04` guest → không ghi.
- [x] `BR-PSL-05` preview → không ghi, không đếm KPI.
- [x] Level không gắn skill → không ghi.
- [x] Bốn nhánh từ chối đều có test (dù P1 chưa ghi gì).
- [x] Ca âm: đường ghi mastery bỏ qua hàm gác → cổng đỏ.

## Cổng dừng

- [x] Phiên thật: mở → chơi → mất mạng → chơi tiếp → có mạng → event đủ, không trùng.
- [x] Complete hai lần → 409, số liệu không đổi.
- [x] Idempotency ép ở **PK**, chứng minh bằng chèn thẳng DB.
- [x] Test offline dùng chế độ offline **thật**; không chuỗi `navigator.onLine` trong test.
- [x] Cache service worker không chứa nội dung trả phí.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 8 — Evidence và promote

- [x] Mỗi `BR-PSL-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-ING-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-OFF-*` có test tham chiếu mã rule.
- [x] [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) → `implemented`.
- [x] [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) → `implemented`.
- [x] [`offline-play.md`](../specs/01-platform/offline-play.md) → `implemented`.
- [x] Nợ sang P1.7: điểm · `normalized_score` · `stars` · `rollup:session`.
- [x] Tick **P1.6** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Tải trước một tuần curriculum để chơi offline — **P5**, chủ Infra.
