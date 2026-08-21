# Checklist — Task #22: P0.9b — Email và guard tần suất

> Kế hoạch: [`22-p0-9b-notification-ratelimit-plan.md`](22-p0-9b-notification-ratelimit-plan.md).
> Chạm **auth** và **dữ liệu trẻ** — hai trong sáu vùng nhạy cảm của
> [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md). Test âm trước,
> human review diff, không auto-merge.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] Human approve kế hoạch và năm quyết định D-EJ · D-EK · D-EL · D-EM · D-EN.
- [x] **P0.8b đã xong** — `packages/cache` `packages/queue` `apps/worker` có nội dung.
- [x] **P0.3 đã đóng** — context `ACTORS` dùng được.
- [x] Đối chiếu `BR-NOT-*` `BR-RTL-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Xác nhận `D-BU`: `email:send` chạy trên khung tối thiểu, không dựng khung mới.
- [x] Tạo nhánh riêng.

---

## Nhánh email

### Task 1 — Migration `notifications`

- [x] Ca âm: ghi notification `suppressed` **ĐỎ** trên enum hiện tại.
- [x] Enum thêm `suppressed`.
- [x] Thêm `uuid` · `suppressed_reason` · `provider_message_id`.
- [x] Cổng: `channel = 'in_app'` bị từ chối ở MVP, có ca âm.
- [x] `pnpm db:migrate` từ database rỗng không lỗi.

### Task 2 — Registry 11 loại thông báo

- [x] 11 `code` §7.1 khai `as const` kèm `kind` và `optOutAllowed`.
- [x] Ca âm `BR-NOT-01`: `PUT notification-preferences` với `order_approved = false` → **422**.
- [x] Loại giao dịch không xuất hiện trong schema cho phép.
- [x] Code lạ là lỗi biên dịch.
- [x] `BR-NOT-06`: cổng chặn thêm loại tiếp thị.

### Task 3 — Port `sendEmail()`

- [x] Interface `{ to, code, payload }` → `provider_message_id`.
- [x] Adapter P0 ghi ra thư mục local, test đọc được nội dung thật.
- [x] `BR-NOT-02`: kiểu của `to` **không** nhận child profile — lỗi biên dịch, không phải kiểm lúc chạy.
- [x] Tài khoản `deleted` → không gửi gì.
- [x] **Không** chọn provider thật ở bước này.

### Task 4 — Job `email:send`

- [x] Chạy trên khung `packages/queue` + `apps/worker` của P0.8b, không dựng khung mới.
- [x] `jobId = notification_id`; ca âm — chạy lại không gửi email thứ hai.
- [x] `BR-NOT-04`: INSERT trong cùng transaction với sự kiện; ca âm rollback không để hàng mồ côi.
- [x] Retry 5 lần backoff; hết retry → `failed` + `alert()`.
- [x] Opt-out → ghi `suppressed` + `suppressed_reason`, không gửi.
- [x] Bounce cứng → dừng loại định kỳ, **giữ** loại giao dịch.

### Task 5 — Cổng nội dung email

- [x] `BR-NOT-03`: không field trẻ nào ngoài `display_name` vào email; ca âm chèn `birth_year` làm cổng **ĐỎ**.
- [x] `BR-NOT-08`: không ảnh 1×1, không URL theo dõi mở; ca âm là template có pixel.
- [x] `BR-NOT-07`: mọi template định kỳ có link huỷ đăng ký.
- [x] §7.3: tiếng Việt, nói rõ làm gì tiếp, không đếm ngược, không so sánh trẻ — danh sách cụm từ cấm có ca âm.
- [x] Cổng gắn vào `pnpm check`.

---

## Nhánh rate limit

### Task 6 — Bảng hạn mức

- [x] 12 route class §7 khai một chỗ: hạn mức IP, hạn mức account, cửa sổ.
- [x] Test so bảng code với bảng spec — lệch một ô là **ĐỎ**.
- [x] Mỗi class đánh dấu `failMode: open | closed`; auth và thanh toán là `closed`.
- [x] Route không suy ra `route_class` là **lỗi**, không mặc định không giới hạn.

### Task 7 — Token bucket

- [x] Cài trên `packages/cache`; đếm nguyên tử.
- [x] Test đồng thời: 100 request song song, hạn mức 10 → đúng 10 lọt.
- [x] Cửa sổ trượt đúng theo cấu hình từng class.

### Task 8 — Middleware hai trục

- [x] Kiểm cả trục IP và trục account cho route nhạy cảm.
- [x] Ca âm: 50 lần sai từ một IP cho 50 email → IP bị giới hạn.
- [x] Ca âm: 10 lần sai một email từ 10 IP → account bị khoá tạm.
- [x] `BR-RTL-04`: IP từ nguồn tin cậy; ca âm `X-Forwarded-For` giả không đổi kết quả.
- [x] `BR-RTL-03`: 429 kèm `Retry-After` và body đúng §8.
- [x] `BR-RTL-07`: thông báo 429 cho email đã đăng ký và chưa đăng ký **giống hệt nhau**.
- [x] Guest dùng trục `tm_did`; Manager có hạn mức riêng.

### Task 9 — Khoá đăng nhập tăng dần

- [x] 5 → 1 phút · 10 → 5 phút · 15 → 30 phút · reset sau 24 giờ.
- [x] `BR-RTL-05`: không khoá vĩnh viễn; ca âm — chờ hết cửa sổ thì đăng nhập đúng thành công.
- [x] Ngưỡng khai trong bảng Task 6.

### Task 10 — Fail closed

- [x] Valkey mất → auth và thanh toán trả **503**, không xử lý.
- [x] Ca âm: tắt Valkey, `POST login` → 503 và **không** lần thử mật khẩu nào chạm DB.
- [x] Route thường fail open, vẫn phục vụ.
- [x] `BR-RTL-06`: ca âm phiên chơi 30 phút gửi event đều không bị 429.

---

## Cổng dừng

- [x] Email gửi end-to-end qua adapter local, đọc được nội dung.
- [x] Chạy lại job không gửi hai lần.
- [x] Opt-out ghi `suppressed`, có bằng chứng trong DB.
- [x] Hai trục rate limit cùng hoạt động; fail closed đúng chỗ.
- [x] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.
- [x] Human review diff vùng auth và dữ liệu trẻ.

## Task 11 — Evidence và promote

- [x] Mỗi `BR-NOT-*` `BR-RTL-*` có test tham chiếu mã rule.
- [x] Ghi §11 Q1 notification (provider, SPF/DKIM) là **chặn deploy P2**.
- [x] Ghi §11 Q1 rate-limiting (CAPTCHA) là chặn P1, kèm lưu ý CAPTCHA bên thứ ba đụng `BR-CDC-08`.
- [x] [`notification-service.md`](../specs/01-platform/notification-service.md) · [`rate-limiting.md`](../specs/01-platform/rate-limiting.md) sang `implemented` chỉ khi đủ evidence.
- [x] Tick **P0.9b** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.

## Cổng dừng cuối

- [x] Không dựng khung queue thứ hai.
- [x] Không chọn provider email thật.
- [x] Không secret provider trong source hoặc test snapshot.
- [x] Sẵn sàng lập plan P0.10.
