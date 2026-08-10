# Kế hoạch — Task #45: P2.3 — Luồng tiền, hai đầu

> Viết 2026-08-10. Bước sở hữu: **P2.3** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) — bước **lớn nhất** của P2.
> Spec sở hữu: [`payment-flow.md`](../specs/00-foundation/payment-flow.md) ·
> [`pricing-page.md`](../specs/02-public/pricing-page.md) ·
> [`payment-order-create.md`](../specs/03-account/payment-order-create.md) ·
> [`payment-proof-upload.md`](../specs/03-account/payment-proof-upload.md) ·
> [`payment-queue.md`](../specs/06-admin/payment-queue.md) ·
> [`payment-approval.md`](../specs/06-admin/payment-approval.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Sáu spec, một luồng: khách chọn gói → chuyển khoản → nộp chứng từ → được dùng tạm → Manager
đối chiếu sao kê → duyệt hoặc từ chối. Đây là nơi **một lỗi không tạo bug report mà tạo mất
tiền hoặc mất khách**.

Ba thứ phải đúng tuyệt đối, và cả ba đều là bài toán đồng thời chứ không phải bài toán UI:

1. **Không duyệt trùng.** Hai request approve cùng lúc phải cho đúng một kết quả.
2. **Duyệt và cấp quyền cùng một transaction.** Đơn `approved` mà không có quyền là ca hỗ trợ
   tệ nhất trong hệ thống.
3. **Từ chối thu hồi quyền ngay.** Không chờ cron — và, chỗ dễ bỏ sót nhất, **không chờ cache
   hết hạn**.

Một điều kiện ngoài code: **giá chưa chốt**. Cổng ra P2 ở
[`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) đòi giá `standard`
và `premium` đã chốt. Bước này viết được hết mà không cần con số, nhưng **không phát hành được
trang giá** khi con số còn là `PENDING_PRICE_VND`.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `PACKAGE-CATALOG` | P0.5 | `PACKAGE_CATALOG`, `package_entitlements`, cổng `lint:prices` |
| `ENTITLEMENT-MODEL` | P0.5 | `entitlements.status` gồm `soft_unlock` |
| `ACCESS-GATING` | P1.3 | hàm resolve quyền — chỗ duy nhất hiểu `soft_unlock` |
| `AUDIT-LOG` | P0.11 | `BR-AUD-01`, lý do bắt buộc |
| `NOTIFICATION-SERVICE` | P0.9b | `order_submitted` · `order_approved` · `order_rejected` |
| `JOB-QUEUE` | P1.5 | hai job hết hạn của bước này |
| `packages/storage` | P0.1 | S3 client thô — đường của ảnh chứng từ theo `D-CB` |
| Admin shell | P2.1 | layout `manager`; thẻ tiền đang `pending_source: P2.3` |
| Cổng quét route | P2.2 | mở rộng lần nữa cho `BR-PAY-08` |

## 1. Đo được

### 1.1 Đã có

Bảng `payment_orders` và `entitlements` với đủ cột và enum `status` từ P0.7 (`D-BQ` đã chốt là
contract-only: P0 tạo cột, P2 làm luồng); `PACKAGE_CATALOG` và cổng `lint:prices`; hàm resolve
quyền của P1.3; BullMQ và `apps/worker` của P1.5; `packages/storage`; shell admin của P2.1.

### 1.2 Chưa có

Toàn bộ sáu bề mặt; máy trạng thái được thi hành; sinh VietQR; upload chứng từ private; signed
URL; cảnh báo trùng mã giao dịch; transaction duyệt có khoá hàng; hai job hết hạn; và **con số
giá thật**.

### 1.3 Đã chốt, không mở lại

`D-BQ` P0 tạo cột, P2 làm luồng · `D-CB` ảnh chứng từ dùng S3 thô ở `packages/storage`, **không**
qua pipeline của [`image-storage.md`](../specs/01-platform/image-storage.md) · `SOFT_UNLOCK_DAYS = 3` ·
đơn `pending` hết hạn sau **48 giờ** · `BR-PKG-03` số tiền đọc từ catalog · giá còn mở là
[`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q1, không quyết lại ở đây.

## 2. Quyết định

**D-JG — Giá chưa chốt **không** chặn code, nhưng chặn **phát hành** trang giá.** Bốn spec
trong lô này chạy được với `PENDING_PRICE_VND`; chỉ [`pricing-page.md`](../specs/02-public/pricing-page.md)
là không — một trang giá công khai in ra số giả là thứ tệ hơn một trang giá không tồn tại.
Xử: mọi đường tính tiền đọc từ `PACKAGE_CATALOG`; thêm một cổng vào `pnpm check` — nếu bất kỳ
gói `sellable` nào còn `PENDING_PRICE_VND` thì route `/bang-gia` **không** được build vào
production và cổng ra P2 báo **đỏ** tại mục giá. Dev và staging vẫn chạy đủ luồng với giá tạm.
Cổng: xoá cổng này hoặc hardcode số để "cho qua" → `lint:prices` **đỏ**.

**D-JH — Approve và reject là **một transaction có khoá hàng**, và ca âm đồng thời chạy trên
Postgres thật.** `BR-PAP-01` đòi hai request đồng thời cho đúng một kết quả. Test bằng mock
transaction sẽ xanh với mọi cách cài đặt sai, kể cả cách kiểm-rồi-ghi không khoá. Xử: `SELECT
… FOR UPDATE` trên hàng đơn là bước **đầu tiên** trong transaction; kiểm `status ∈ {submitted,
under_review}` **sau** khi đã khoá; test đồng thời chạy hai kết nối thật tới Postgres của
`docker compose`, không phải hai promise trên cùng một mock. Ca âm bắt buộc: ghi `entitlements`
fail giữa chừng → đơn **vẫn** `submitted`, không entitlement nào, **không notification nào**.

**D-JI — `soft_unlock` là hiệu lực tại **một** hàm resolve, và commit **vô hiệu hoá cache quyền
ngay**.** `BR-PAY-04` nói reject thu hồi quyền "không cần chờ job nào chạy". Chỗ hỏng thật
không phải cron — là **cache**. P1.3 cache kết quả resolve quyền; nếu reject chỉ ghi DB thì
request kế tiếp vẫn 200 cho tới khi cache hết hạn, và spec sẽ được coi là đạt vì test chạy với
cache tắt. Xử: `soft_unlock` được hiểu ở đúng một chỗ — hàm resolve của P1.3, cấm mọi call site
tự so `status`; transaction approve/reject kết thúc bằng việc xoá khoá cache quyền của User đó;
**ca âm chạy với cache bật**: reject → request kế tiếp tới nội dung trả phí trả **403**.

**D-JJ — Checklist đối chiếu ép ở **server**; nút disable chỉ là lớp hai.** `BR-PAP-08` đòi 5
mục tick mới bật nút duyệt. Một ràng buộc chỉ sống ở UI là ràng buộc biến mất khi ai đó gọi API
trực tiếp — và ở luồng tiền, "ai đó" gồm cả script nội bộ viết vội lúc tồn đơn. Xử: body
`checklist` là 5 boolean bắt buộc; thiếu một mục → **422**; kết quả lưu vào `admin_note` dạng
cấu trúc để sau này đọc lại được đã đối chiếu những gì. UI vẫn disable nút, nhưng đó là tiện
lợi, không phải cơ chế.

**D-JK — Ảnh chứng từ đi đường `packages/storage` thô, private, và **mỗi lần phát signed URL
ghi audit**.** `D-CB` đã chốt đường lưu. Phần bước này thêm: URL sống **15 phút**; bucket cấm
đọc công khai — kiểm bằng ca âm gọi thẳng URL S3; và mỗi lần Manager lấy URL ghi một hàng
`audit_logs` `proof_viewed`. Lý do ghi audit ở **lúc phát URL** chứ không lúc mở ảnh: sau khi
phát, hệ thống không còn nhìn thấy lượt mở nữa.

**D-JL — Hai job hết hạn, hai hằng số, một chỗ khai.** Đơn `pending` quá **48 giờ** → `expired`;
entitlement `soft_unlock` quá **3 ngày** → `expired`. Hai hằng số này xuất hiện trên màn hình
khách ("dùng ngay 3 ngày"), trong job, và trong test — rải ba chỗ là ba chỗ lệch nhau. Xử: khai
trong `packages/config`, job đăng ký vào registry của P1.5. Ràng buộc dễ mất nhất, viết thành
ca âm riêng: `soft_unlock` hết hạn **không** làm đơn hết hiệu lực — đơn vẫn `submitted`, vẫn
duyệt được, và duyệt sau đó cấp lại **đủ** `duration_days`.

## 3. Đồ thị

```
T1 máy trạng thái + hằng số + cổng "không xoá đơn" (D-JL, BR-PAY-08)
      └──→ T2 POST /api/users/orders + màn VietQR (D-JG số tiền từ catalog)
                └──→ T3 nộp chứng từ + soft_unlock + storage private (D-JI, D-JK)
                          ├──→ T4 hàng đợi admin + signed URL + cờ trùng mã (D-JK)
                          │         └──→ T5 duyệt/từ chối: transaction · checklist · cộng dồn (D-JH, D-JI, D-JJ)
                          └──→ T6 hai job hết hạn (D-JL)
  T7 trang giá công khai + structured data + cổng phát hành (D-JG)
  T8 bật hai thẻ tiền trên dashboard P2.1 (trả nợ)
                              ── Cổng dừng: E2E xuyên hai app ──
                                    T9 evidence, promote 6 spec, nợ
```

## 4. Task

### Task 1 — Máy trạng thái và hằng số

**Tiêu chí nghiệm thu**
- [ ] Bảng chuyển trạng thái §7.1 của [`payment-flow.md`](../specs/00-foundation/payment-flow.md) cài thành **một** hàm; mọi đổi trạng thái đi qua nó.
- [ ] Bốn trạng thái terminal (`approved` · `rejected` · `cancelled` · `expired`) **không** có cạnh đi ra; ca âm: thử mọi cặp bị cấm → `INVALID_STATUS_TRANSITION`.
- [ ] `SOFT_UNLOCK_DAYS = 3` và `ORDER_PENDING_TTL_HOURS = 48` khai trong `packages/config`; grep hai con số ngoài đó → **đỏ**.
- [ ] `BR-PAY-08` + `BR-PAP-09`: mở rộng cổng quét route của P2.2 — không route nào `DELETE` hàng `payment_orders`; ca âm fixture → cổng **đỏ**.
- [ ] `transfer_note` sinh từ `uuid` rút gọn, ép định dạng, **duy nhất**; có unique index.
- [ ] Index cho `bank_txn_ref` (phục vụ cờ trùng) và cho `(status, submitted_at)` (phục vụ hàng đợi cũ-nhất-trước).

**Kiểm chứng**
- [ ] `pnpm test -- order-state-machine` xanh, phủ **mọi** ô của bảng §7.1.

**Phụ thuộc:** P0.7 · P2.2 · **Cỡ:** M

### Task 2 — Tạo đơn và màn hình chuyển khoản

**Tiêu chí nghiệm thu**
- [ ] `POST /api/users/orders` cần `requireUserAuth()` **và email đã xác thực**; chưa xác thực → **403**.
- [ ] `BR-POC-01` + `BR-PAY-06` ca âm: body chứa `amount_vnd = 1000` → đơn tạo với số tiền từ `PACKAGE_CATALOG`, giá trị client **bị bỏ qua**.
- [ ] `amount_vnd`, `package_code`, `offer_code` **snapshot** lên đơn; đổi giá sau không đụng đơn cũ.
- [ ] `BR-POC-04` ca âm: đã có đơn `pending` cùng gói → **409** `ORDER_ALREADY_PENDING`, response dẫn tới đơn cũ.
- [ ] Gói không `sellable` (add-on) → **400** `PACKAGE_NOT_SELLABLE`.
- [ ] Màn hình chuyển khoản đúng thứ tự nhấn mạnh §7.1: QR lớn nhất, `transfer_note` **nổi bật nhất trong phần chữ**, rồi số tiền, rồi thông tin ngân hàng.
- [ ] `BR-POC-03`: mỗi trường có nút sao chép riêng — số tài khoản, chủ tài khoản, số tiền, nội dung chuyển khoản.
- [ ] `BR-POC-05` ca âm: đang còn 100 ngày, mua gói 365 ngày → tóm tắt nêu rõ thời hạn mới **465 ngày**.
- [ ] `BR-POC-07`: màn hình nêu rõ duyệt tay, thời gian dự kiến, và quyền dùng tạm.
- [ ] `BR-POC-08` cổng: luồng này **không** xuất hiện trên bề mặt trẻ; quét route và component của `/play`.
- [ ] `POST /api/users/orders/{uuid}/cancel` chỉ chạy khi `pending`; trạng thái khác → **409**.
- [ ] QR VietQR sinh ở **server**, đã điền sẵn số tiền và nội dung.

**Kiểm chứng**
- [ ] `pnpm test -- order-create` xanh · `pnpm test:e2e -- checkout-transfer` xanh.

**Phụ thuộc:** T1 · **Cỡ:** L

### Task 3 — Nộp chứng từ và quyền tạm

**Tiêu chí nghiệm thu**
- [ ] `POST /api/users/orders/{uuid}/proof` cần auth + **ownership** + CSRF; `BR-PPU-06` ca âm: quét mã — không `$fetch` thô cho upload này.
- [ ] `bank_txn_ref` bắt buộc 4–64 ký tự; thiếu → **422** `PAYMENT_PROOF_REQUIRED`. Ảnh **tuỳ chọn**.
- [ ] Ảnh > 5 MB → **413**; định dạng ngoài jpeg/png/webp → **415**.
- [ ] `BR-PPU-01` ca âm: sau khi nộp, entitlement có `status = soft_unlock`, **không** `active`.
- [ ] `D-JK` + `BR-PPU-03`: ảnh lưu private qua `packages/storage`; ca âm — gọi thẳng URL S3 → **bị từ chối**.
- [ ] `BR-PPU-05` ca âm: nộp lại → `proof_path` trỏ ảnh mới, **vẫn một đơn**, không tạo đơn thứ hai.
- [ ] Đơn `approved` hoặc `expired` → không nộp được (**409**).
- [ ] `BR-PPU-07`: màn xác nhận nêu rõ đã dùng được ngay **và** thời hạn tạm.
- [ ] §7.3: sáu trạng thái đơn hiện đúng câu cho User; `rejected` hiện lý do **rút gọn, lịch sự** — ca âm: `admin_note` nội bộ **không** xuất hiện nguyên văn.
- [ ] Notification `order_submitted` gửi qua job `email:send` của P0.9b.

**Kiểm chứng**
- [ ] `pnpm test -- proof-upload` xanh, assertion tham chiếu `BR-PPU-01` `BR-PPU-03` `BR-PPU-04` `BR-PPU-05`.

**Phụ thuộc:** T2 · **Cỡ:** L

### Task 4 — Hàng đợi đơn

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/orders` cần `super_admin`; `content_reviewer` → **403** (`BR-PAY-11`, `BR-PQU-08`).
- [ ] `BR-PQU-02`: mặc định lọc `submitted,under_review`, sắp **cũ nhất trước**.
- [ ] Bộ lọc §7.1 đủ, Zod parse, trần **100** ép trong schema (`BR-PQU-06`); dùng lại mẫu `D-JC` của P2.2 cho `q`.
- [ ] `stats` trả `pending_count` và `oldest_waiting_hours`.
- [ ] `BR-PQU-01` cổng: quét trang danh sách — **không** nút approve/reject.
- [ ] `D-JK` + `BR-PQU-03` ca âm ba vế: URL S3 trực tiếp → từ chối; signed URL trong 15 phút → mở được; sau 20 phút → từ chối.
- [ ] Mỗi lần gọi `proof-url` ghi `audit_logs` `proof_viewed`.
- [ ] `BR-PQU-04` ca âm: hai đơn cùng `bank_txn_ref` → mở đơn sau hiện **cảnh báo nổi bật** kèm link tới đơn trước.
- [ ] Cờ "User đã có đơn bị từ chối trước" hiện đúng.
- [ ] `BR-PQU-05` ca âm: chi tiết đơn chỉ hiện **số lượng** hồ sơ trẻ — đi qua projection `D-JF` của P2.2.
- [ ] `POST /api/managers/orders/{uuid}/claim` chuyển `submitted → under_review`; đơn đang `under_review` bởi người khác → cảnh báo, vẫn mở được.

**Kiểm chứng**
- [ ] `pnpm test -- payment-queue` xanh · `pnpm test:e2e -- admin-payments` xanh.

**Phụ thuộc:** T3 · P2.1 · **Cỡ:** L

### Task 5 — Duyệt và từ chối

**Tiêu chí nghiệm thu**
- [ ] `D-JH`: transaction bắt đầu bằng `SELECT … FOR UPDATE` trên hàng đơn; kiểm `status` **sau** khi khoá.
- [ ] `BR-PAP-01` ca âm đồng thời — **hai kết nối Postgres thật**: hai request approve cùng lúc → đúng **một** thành công, cái còn lại **409** `ORDER_ALREADY_PROCESSED`, số hàng `entitlements` **không tăng gấp đôi**.
- [ ] `BR-PAP-02` ca âm rollback: ghi `entitlements` fail → đơn **vẫn** `submitted`, không entitlement, **không notification**.
- [ ] `BR-PAP-05` ca âm cộng dồn: còn 100 ngày, duyệt gói 365 ngày → `expires_at` = **465 ngày** kể từ hôm nay, tính bằng `max(now, expires_at cũ) + duration_days`.
- [ ] `BR-PAP-07` ca âm: form gửi `duration_days = 9999` → bỏ qua, tính theo offer trong `PACKAGE_CATALOG` theo snapshot trên đơn.
- [ ] `BR-PAP-04`: `admin_note` < 10 ký tự → **422** `ADMIN_NOTE_REQUIRED`, đơn không đổi.
- [ ] `D-JJ` + `BR-PAP-08` ca âm: gọi API với checklist thiếu một mục → **422**, kể cả khi UI không gửi.
- [ ] `BR-PAP-06` ca âm: `bonus_days = 60` → **422**; `bonus_days ≤ 30` cần lý do, ghi audit.
- [ ] `BR-PAP-03` + `D-JI` ca âm **chạy với cache bật**: reject đơn đã có `soft_unlock` → cùng request entitlement thành `cancelled`, request kế tiếp tới nội dung trả phí trả **403**, không chờ job nào.
- [ ] Approve đơn `expired` hoặc terminal → **409**.
- [ ] Audit `order_approved` / `order_rejected` kèm before/after; notification tới User.

**Kiểm chứng**
- [ ] `pnpm test -- payment-approval` xanh, assertion tham chiếu `BR-PAP-01`…`BR-PAP-08`; test đồng thời **không** dùng mock transaction.

**Phụ thuộc:** T4 · **Cỡ:** L

### Task 6 — Hai job hết hạn

**Tiêu chí nghiệm thu**
- [ ] Job `order:expire` — đơn `pending` quá **48 giờ** không có chứng từ → `expired`; User tạo đơn mới được.
- [ ] Job `entitlement:soft-unlock-expire` — `soft_unlock` quá **3 ngày** → `expired`.
- [ ] `D-JL` ca âm quan trọng nhất: `soft_unlock` đã hết hạn → đơn **vẫn** `submitted` và **vẫn duyệt được**; duyệt sau đó cấp `active` với **đủ** `duration_days`.
- [ ] Hai job đăng ký vào registry job của P1.5, có retry policy và có mặt trong danh mục.
- [ ] Job chạy hai lần trên cùng dữ liệu → kết quả không đổi (idempotent).
- [ ] Ngưỡng backlog và alert của hai job này khai trong `alerts.yml` — gỡ `pending_source: P2.3` mà P1.16 đã đặt.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/worker test -- payment-jobs` xanh.

**Phụ thuộc:** T3 · P1.5 · **Cỡ:** M

### Task 7 — Trang giá công khai

**Tiêu chí nghiệm thu**
- [ ] `BR-PRC-01` ca âm: so từng ô của bảng §7.1 với `package_entitlements` trong DB → **khớp hoàn toàn**; không ô nào viết tay.
- [ ] `BR-PRC-02`: cột **Miễn phí** hiện rõ, không thu nhỏ, không đặt cuối.
- [ ] `BR-PRC-06` ca âm: đúng **ba** cột; add-on chưa bán **không** xuất hiện.
- [ ] `BR-PRC-05` ca âm: quét toàn trang — không đồng hồ đếm ngược, không thông báo khan hiếm.
- [ ] Ba câu §7.2 xuất hiện đủ: duyệt tay + thời gian xác nhận (`BR-PRC-03`) · không tự động gia hạn (`BR-PRC-07`) · dữ liệu bé giữ nguyên khi hết hạn (`BR-PRC-04`).
- [ ] `BR-PRC-08`: structured data `Product` + `Offer` sinh từ dữ liệu, hợp lệ khi kiểm.
- [ ] CTA theo trạng thái: Guest → đăng ký · User chưa mua → mua · User đang có gói → "gói hiện tại" + gia hạn · User premium → cột standard hiện "đã bao gồm".
- [ ] `D-JG` cổng phát hành: còn gói `sellable` mang `PENDING_PRICE_VND` → route `/bang-gia` **không** vào build production, và cổng ra P2 đỏ tại mục giá.
- [ ] Trang prerender, revalidate khi catalog đổi.

**Kiểm chứng**
- [ ] `pnpm test -- pricing-page` xanh · `pnpm test:e2e -- pricing` xanh · ca âm `D-JG` chứng minh cổng chặn được.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 8 — Trả nợ dashboard

**Tiêu chí nghiệm thu**
- [ ] Hai thẻ `pending_source: P2.3` của [`43-p2-1-admin-shell-plan.md`](43-p2-1-admin-shell-plan.md) chuyển sang có nguồn thật: **đơn chờ duyệt** và **doanh thu tháng**.
- [ ] `BR-PQU-07`: đơn cũ nhất > **24 giờ** → thẻ đổi màu cảnh báo trên dashboard.
- [ ] Doanh thu tháng tính theo **ngày đơn được `approved`** — theo `BR-PAY-03` và đề xuất chốt của §11 Q1 [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md).
- [ ] Nút "xem đơn" trên chi tiết User (nợ P2.2) bật, trỏ đúng đơn.
- [ ] `D-IZ` vẫn giữ: hai thẻ đọc từ rollup hoặc truy vấn có index, **không** quét bảng thô.

**Kiểm chứng**
- [ ] `pnpm test -- dashboard-cards` xanh, in ra "3 thẻ pending_source" (giảm từ 5).

**Phụ thuộc:** T5 · **Cỡ:** S

### Cổng dừng — E2E xuyên hai app

- [ ] Một đơn thật đi hết: tạo trên web → nộp chứng từ → dùng được nội dung trả phí ngay → Manager đối chiếu trên admin → duyệt → User nhận thông báo → vẫn chơi được, `expires_at` đúng.
- [ ] Nhánh từ chối: reject → **403** ở request kế tiếp, **cache bật**.
- [ ] Hai request approve đồng thời → một 200, một 409, không nhân đôi entitlement.
- [ ] Rollback: ghi entitlement fail → đơn vẫn `submitted`, không notification.
- [ ] Chứng từ không mở được bằng URL trực tiếp; signed URL chết sau 15 phút.
- [ ] `content_reviewer` bị **403** ở cả hàng đợi lẫn màn duyệt.
- [ ] Không route nào xoá được `payment_orders`.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm lint:prices && pnpm check:progress` xanh.

### Task 9 — Evidence, promote và nợ chuyển tiếp

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-PAY-*` `BR-POC-*` `BR-PPU-*` `BR-PQU-*` `BR-PAP-*` `BR-PRC-*` có ít nhất một test tham chiếu mã rule.
- [ ] Sáu spec sang `implemented`.
- [ ] **Câu chặn cổng ra P2, nêu thẳng cho chủ:** giá `standard` và `premium`. Chủ là [`package-catalog.md`](../specs/00-foundation/package-catalog.md) §11 Q1; [`pricing-page.md`](../specs/02-public/pricing-page.md) §11 Q1 chỉ trỏ tới đó. Còn `PENDING_PRICE_VND` thì `D-JG` chặn phát hành.
- [ ] §11 Q1 của [`payment-flow.md`](../specs/00-foundation/payment-flow.md) và Q1 của [`payment-queue.md`](../specs/06-admin/payment-queue.md) là **cùng một câu** (đối chiếu sao kê tự động) — đóng một lần: hoãn; ghi rõ giới hạn quy mô **vài chục đơn/ngày** của duyệt tay.
- [ ] §11 Q2 của [`payment-flow.md`](../specs/00-foundation/payment-flow.md) và Q1 của [`payment-proof-upload.md`](../specs/03-account/payment-proof-upload.md) là **cùng một câu** (3 ngày có đủ nếu nộp cuối tuần) — đóng một lần: đủ cho MVP, kèm quy trình trực cuối tuần; nối với câu "ai trực?" còn mở từ P1.16.
- [ ] §11 Q2 của [`payment-order-create.md`](../specs/03-account/payment-order-create.md) (thời gian duyệt cam kết) — chốt **12 giờ làm việc**; con số này đã lên màn hình khách nên đổi sau là đổi lời hứa.
- [ ] §11 Q1 của [`payment-order-create.md`](../specs/03-account/payment-order-create.md) (mã giảm giá) — đóng: không ở MVP.
- [ ] §11 Q2 của [`pricing-page.md`](../specs/02-public/pricing-page.md) (gói dùng thử) — đóng: tier miễn phí vĩnh viễn, đánh giá lại ở P3.
- [ ] §11 Q2 của [`payment-approval.md`](../specs/06-admin/payment-approval.md) (huỷ duyệt) — đóng: không có thao tác huỷ duyệt; sửa bằng điều chỉnh entitlement tay ở **P2.4**.
- [ ] §11 Q3 và Q4 của [`payment-flow.md`](../specs/00-foundation/payment-flow.md) (hoàn tiền, cổng tự động) giữ nguyên **P5**.
- [ ] Nợ ghi sang **P2.4**: thao tác thu hồi/điều chỉnh entitlement tay — lối thoát duy nhất cho ca duyệt nhầm.
- [ ] Tick **P2.3** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Duyệt trùng do kiểm-rồi-ghi không khoá | Hai subscription cho một lần trả tiền | `D-JH` — `FOR UPDATE`, ca âm hai kết nối thật |
| Reject nhưng cache quyền còn sống | Người bị từ chối vẫn dùng tiếp — đúng thứ `BR-PAY-04` cấm | `D-JI` — vô hiệu cache trong transaction, ca âm cache bật |
| Test đồng thời dùng mock | Xanh với mọi cách cài sai | `D-JH` — cấm mock ở đúng test đó |
| Checklist chỉ sống ở UI | Gọi API trực tiếp là duyệt không đối chiếu | `D-JJ` — ép ở server, 422 |
| Trang giá lên production với `PENDING_PRICE_VND` | Số giả trước mặt khách; mất niềm tin không lấy lại được | `D-JG` — cổng phát hành |
| Ảnh chứng từ lộ | Thông tin ngân hàng của khách ra ngoài | `D-JK` — private + signed 15 phút + audit |
| `soft_unlock` hết hạn bị hiểu là đơn hết hiệu lực | Người đã trả tiền mất luôn đơn | `D-JL` — ca âm riêng |
| Hai hằng số thời hạn rải nhiều chỗ | Màn hình hứa 3 ngày, job cắt sau 2 | `D-JL` — khai một chỗ |
| Nộp lại chứng từ cũ cho đơn mới | Gian lận phổ biến nhất của duyệt tay | `BR-PQU-04` — cờ trùng `bank_txn_ref` + index |
| Duyệt tay không mở rộng được | Trần vài chục đơn/ngày; tới ngưỡng là sự cố vận hành, không phải bug | §11 Q1 — nêu thẳng cho chủ, hoãn có ghi giới hạn |

## 6. Giả định

1. **P2.1 và P2.2 đã đóng** — shell, projection dữ liệu trẻ, cổng quét route dùng lại được.
2. **P1.3 đã đóng** — có đúng một hàm resolve quyền để `soft_unlock` cắm vào.
3. **P1.5 đã đóng** — BullMQ chạy, registry job nhận thêm hai job.
4. **Giá chưa chốt lúc bắt đầu** — mọi thứ trừ trang giá vẫn làm được.
5. **Một Manager duyệt** — `under_review` không cần khoá phân tán; cảnh báo là đủ.
6. **Ngân hàng không có API** — đối chiếu là mắt người, và quy mô bị giới hạn ở đó.

## 7. Ngoài phạm vi

- Cấp entitlement bằng tay và điều chỉnh thời hạn — P2.4.
- Trang xem gói của User — P2.4, [`subscription-view.md`](../specs/03-account/subscription-view.md).
- Đối chiếu sao kê tự động qua API ngân hàng — hoãn, §11 Q1.
- Hoàn tiền — P5.
- Cổng thanh toán tự động — P5.
- OCR mã giao dịch từ ảnh — P4.
- Mã giảm giá — không ở MVP.
