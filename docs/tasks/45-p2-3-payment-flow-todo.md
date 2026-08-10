# Checklist — Task #45: P2.3 — Luồng tiền, hai đầu

> Kế hoạch: [`45-p2-3-payment-flow-plan.md`](45-p2-3-payment-flow-plan.md).
> Bước lớn nhất của P2 và là nơi lỗi tạo ra **mất tiền**, không phải bug report.
> Tuyệt đối: không duyệt trùng (`D-JH`) · reject cắt quyền ngay **kể cả khi cache bật** (`D-JI`)
> · trang giá không lên production với `PENDING_PRICE_VND` (`D-JG`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P2.1 và P2.2 đã đóng** — shell, projection dữ liệu trẻ, cổng quét route.
- [ ] **P1.3 đã đóng** — có đúng một hàm resolve quyền.
- [ ] **P1.5 đã đóng** — BullMQ và registry job nhận thêm job mới.
- [ ] Tài khoản ngân hàng nhận tiền và thông tin VietQR đã có trong biến môi trường.
- [ ] Human approve kế hoạch và sáu quyết định D-JG · D-JH · D-JI · D-JJ · D-JK · D-JL.
- [ ] Đối chiếu `BR-PAY-*` `BR-POC-*` `BR-PPU-*` `BR-PQU-*` `BR-PAP-*` `BR-PRC-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Máy trạng thái và hằng số

- [ ] Bảng chuyển trạng thái §7.1 cài thành **một** hàm; mọi đổi trạng thái đi qua nó.
- [ ] Ca âm: mọi cặp bị cấm → `INVALID_STATUS_TRANSITION`.
- [ ] Bốn trạng thái terminal không có cạnh đi ra.
- [ ] `SOFT_UNLOCK_DAYS = 3` khai trong `packages/config`.
- [ ] `ORDER_PENDING_TTL_HOURS = 48` khai trong `packages/config`.
- [ ] Grep: hai con số không xuất hiện ngoài `packages/config`.
- [ ] `BR-PAY-08` mở rộng cổng quét: không route `DELETE payment_orders`.
- [ ] Ca âm: fixture route xoá đơn → cổng **đỏ**.
- [ ] `transfer_note` sinh từ `uuid`, ép định dạng, có unique index.
- [ ] Index `bank_txn_ref` và `(status, submitted_at)`.

### Task 2 — Tạo đơn và màn hình chuyển khoản

- [ ] `POST /api/users/orders` cần auth **và email đã xác thực**; chưa xác thực → **403**.
- [ ] `BR-POC-01` ca âm: body `amount_vnd = 1000` → dùng giá catalog.
- [ ] `amount_vnd` · `package_code` · `offer_code` snapshot lên đơn.
- [ ] `BR-POC-04` ca âm: đã có đơn `pending` cùng gói → **409**, dẫn tới đơn cũ.
- [ ] Gói không `sellable` → **400** `PACKAGE_NOT_SELLABLE`.
- [ ] Thứ tự nhấn mạnh §7.1: QR lớn nhất, `transfer_note` nổi bật nhất trong phần chữ.
- [ ] `BR-POC-03` nút sao chép cho **từng** trường.
- [ ] `BR-POC-05` ca âm: còn 100 ngày + mua 365 ngày → tóm tắt nêu **465 ngày**.
- [ ] `BR-POC-07` nêu rõ duyệt tay, thời gian dự kiến, quyền dùng tạm.
- [ ] `BR-POC-08` cổng: luồng không xuất hiện trên bề mặt trẻ.
- [ ] `POST .../cancel` chỉ khi `pending`; khác → **409**.
- [ ] QR VietQR sinh ở server, điền sẵn số tiền và nội dung.

### Task 3 — Nộp chứng từ và quyền tạm

- [ ] Auth + **ownership** + CSRF.
- [ ] `BR-PPU-06` ca âm: không `$fetch` thô cho upload này.
- [ ] `bank_txn_ref` bắt buộc 4–64 ký tự; thiếu → **422** `PAYMENT_PROOF_REQUIRED`.
- [ ] Ảnh tuỳ chọn; > 5 MB → **413**; sai định dạng → **415**.
- [ ] `BR-PPU-01` ca âm: entitlement là `soft_unlock`, **không** `active`.
- [ ] `D-JK` ca âm: URL S3 trực tiếp → **bị từ chối**.
- [ ] `BR-PPU-05` ca âm: nộp lại → ảnh mới, **vẫn một đơn**.
- [ ] Đơn `approved` hoặc `expired` → nộp lại **409**.
- [ ] `BR-PPU-07` màn xác nhận nêu quyền tạm **và** thời hạn.
- [ ] §7.3 sáu trạng thái hiện đúng câu cho User.
- [ ] Ca âm: `admin_note` nội bộ **không** xuất hiện nguyên văn ở phía User.
- [ ] Notification `order_submitted` gửi qua job `email:send`.

### Task 4 — Hàng đợi đơn

- [ ] `GET /api/managers/orders` cần `super_admin`; `content_reviewer` → **403**.
- [ ] `BR-PQU-02` mặc định `submitted,under_review`, sắp **cũ nhất trước**.
- [ ] Bộ lọc §7.1 đủ, Zod parse, trần **100** ép trong schema.
- [ ] `stats` trả `pending_count` và `oldest_waiting_hours`.
- [ ] `BR-PQU-01` cổng: danh sách **không** có nút approve/reject.
- [ ] `BR-PQU-03` ca âm 1: URL S3 trực tiếp → từ chối.
- [ ] `BR-PQU-03` ca âm 2: signed URL trong 15 phút → mở được.
- [ ] `BR-PQU-03` ca âm 3: sau 20 phút → từ chối.
- [ ] Mỗi lần gọi `proof-url` ghi `audit_logs` `proof_viewed`.
- [ ] `BR-PQU-04` ca âm: hai đơn trùng `bank_txn_ref` → cảnh báo nổi bật + link đơn trước.
- [ ] Cờ "User đã có đơn bị từ chối trước" hiện đúng.
- [ ] `BR-PQU-05` ca âm: chỉ hiện **số lượng** hồ sơ trẻ, qua projection `D-JF`.
- [ ] `POST .../claim` chuyển `submitted → under_review`.
- [ ] Đơn đang `under_review` bởi người khác → cảnh báo, vẫn mở được.

### Task 5 — Duyệt và từ chối

- [ ] `D-JH`: `SELECT … FOR UPDATE` là bước **đầu tiên** trong transaction.
- [ ] Kiểm `status` **sau** khi khoá, không trước.
- [ ] `BR-PAP-01` ca âm đồng thời, **hai kết nối Postgres thật**: một 200, một **409**.
- [ ] Ca âm đồng thời: số hàng `entitlements` không nhân đôi.
- [ ] `BR-PAP-02` ca âm rollback: ghi entitlement fail → đơn vẫn `submitted`.
- [ ] Ca âm rollback: **không** notification nào được gửi.
- [ ] `BR-PAP-05` ca âm cộng dồn: 100 ngày + 365 ngày → **465 ngày**.
- [ ] `BR-PAP-07` ca âm: form gửi `duration_days = 9999` → bỏ qua, dùng catalog.
- [ ] `BR-PAP-04`: `admin_note` < 10 ký tự → **422**, đơn không đổi.
- [ ] `D-JJ` ca âm: gọi API với checklist thiếu một mục → **422**.
- [ ] Kết quả checklist lưu vào `admin_note` dạng cấu trúc.
- [ ] `BR-PAP-06` ca âm: `bonus_days = 60` → **422**.
- [ ] `bonus_days ≤ 30` cần lý do, ghi audit.
- [ ] `D-JI` ca âm **cache bật**: reject → entitlement `cancelled` trong cùng request.
- [ ] `D-JI` ca âm **cache bật**: request kế tiếp tới nội dung trả phí → **403**, không chờ job.
- [ ] Approve đơn `expired` hoặc terminal → **409**.
- [ ] Audit `order_approved` / `order_rejected` kèm before/after; notification tới User.

### Task 6 — Hai job hết hạn

- [ ] Job `order:expire` — `pending` quá 48 giờ → `expired`.
- [ ] Sau khi `expired`, User tạo đơn mới được.
- [ ] Job `entitlement:soft-unlock-expire` — `soft_unlock` quá 3 ngày → `expired`.
- [ ] `D-JL` ca âm: `soft_unlock` hết hạn → đơn **vẫn** `submitted`, **vẫn duyệt được**.
- [ ] `D-JL` ca âm: duyệt sau đó cấp `active` với **đủ** `duration_days`.
- [ ] Hai job có mặt trong registry job của P1.5 kèm retry policy.
- [ ] Job chạy hai lần trên cùng dữ liệu → kết quả không đổi.
- [ ] Gỡ `pending_source: P2.3` khỏi quy tắc alert trong `alerts.yml`.

### Task 7 — Trang giá công khai

- [ ] `BR-PRC-01` ca âm: từng ô bảng §7.1 khớp `package_entitlements` trong DB.
- [ ] Không ô nào viết tay.
- [ ] `BR-PRC-02` cột **Miễn phí** hiện rõ, không thu nhỏ, không đặt cuối.
- [ ] `BR-PRC-06` ca âm: đúng **ba** cột, add-on không xuất hiện.
- [ ] `BR-PRC-05` ca âm: không đếm ngược, không thông báo khan hiếm.
- [ ] `BR-PRC-03` câu về duyệt tay + thời gian xác nhận.
- [ ] `BR-PRC-07` câu về **không tự động gia hạn**.
- [ ] `BR-PRC-04` câu về dữ liệu bé giữ nguyên khi hết hạn.
- [ ] `BR-PRC-08` structured data `Product` + `Offer` sinh từ dữ liệu, hợp lệ.
- [ ] CTA đúng cho Guest · User chưa mua · User đang có gói · User premium.
- [ ] `D-JG` cổng phát hành: còn `PENDING_PRICE_VND` → `/bang-gia` không vào build production.
- [ ] Ca âm `D-JG`: cổng chặn được, chứng minh bằng test.
- [ ] Trang prerender, revalidate khi catalog đổi.

### Task 8 — Trả nợ dashboard

- [ ] Thẻ **đơn chờ duyệt** có nguồn thật.
- [ ] Thẻ **doanh thu tháng** có nguồn thật, tính theo ngày đơn `approved`.
- [ ] `BR-PQU-07`: đơn cũ nhất > 24 giờ → thẻ đổi màu cảnh báo.
- [ ] Nút "xem đơn" trên chi tiết User (nợ P2.2) bật, trỏ đúng đơn.
- [ ] `D-IZ` giữ nguyên: hai thẻ không quét bảng thô.
- [ ] `pnpm test -- dashboard-cards` in ra "3 thẻ pending_source".

## Cổng dừng — E2E xuyên hai app

- [ ] Đơn thật đi hết: tạo → nộp chứng từ → dùng được ngay → Manager duyệt → thông báo → `expires_at` đúng.
- [ ] Nhánh từ chối: reject → **403** ở request kế tiếp, **cache bật**.
- [ ] Hai approve đồng thời → một 200, một 409, không nhân đôi entitlement.
- [ ] Rollback: ghi entitlement fail → đơn vẫn `submitted`, không notification.
- [ ] Chứng từ không mở bằng URL trực tiếp; signed URL chết sau 15 phút.
- [ ] `content_reviewer` bị **403** ở hàng đợi và màn duyệt.
- [ ] Không route nào xoá được `payment_orders`.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm lint:prices && pnpm check:progress` xanh.

---

## Task 9 — Evidence, promote và nợ chuyển tiếp

- [ ] Mỗi `BR-PAY-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-POC-*` và `BR-PPU-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-PQU-*` và `BR-PAP-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-PRC-*` có test tham chiếu mã rule.
- [ ] [`payment-flow.md`](../specs/00-foundation/payment-flow.md) → `implemented`.
- [ ] [`pricing-page.md`](../specs/02-public/pricing-page.md) → `implemented`.
- [ ] [`payment-order-create.md`](../specs/03-account/payment-order-create.md) → `implemented`.
- [ ] [`payment-proof-upload.md`](../specs/03-account/payment-proof-upload.md) → `implemented`.
- [ ] [`payment-queue.md`](../specs/06-admin/payment-queue.md) → `implemented`.
- [ ] [`payment-approval.md`](../specs/06-admin/payment-approval.md) → `implemented`.
- [ ] Nợ sang **P2.4**: thao tác thu hồi/điều chỉnh entitlement tay — lối thoát duy nhất cho ca duyệt nhầm.
- [ ] Tick **P2.3** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] **Giá `standard` và `premium`** — chặn cổng ra P2. Chủ là [`package-catalog.md`](../specs/00-foundation/package-catalog.md) §11 Q1. Còn `PENDING_PRICE_VND` thì `D-JG` chặn phát hành trang giá.
- [ ] **Đối chiếu sao kê tự động** — cùng một câu ở hai spec, đóng **một lần**: hoãn, ghi rõ trần **vài chục đơn/ngày** của duyệt tay.
- [ ] **3 ngày soft unlock có đủ nếu nộp cuối tuần** — cùng một câu ở hai spec, đóng **một lần**: đủ cho MVP kèm quy trình trực cuối tuần; nối với câu "ai trực?" còn mở từ P1.16.
- [ ] **Thời gian duyệt cam kết** — chốt **12 giờ làm việc**; con số đã lên màn hình khách, đổi sau là đổi lời hứa.
- [ ] **Mã giảm giá** — không ở MVP.
- [ ] **Gói dùng thử** — không; tier miễn phí vĩnh viễn, đánh giá lại ở P3.
- [ ] **Huỷ duyệt** — không có thao tác này; sửa bằng điều chỉnh entitlement tay ở P2.4.
- [ ] **Hoàn tiền** và **cổng thanh toán tự động** — giữ nguyên P5.
