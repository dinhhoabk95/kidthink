---
spec: PAYMENT-FLOW
title: Luồng thanh toán VietQR duyệt tay
area: foundation
status: approved
mvp: true
phase: P2
reviewed: 2026-08-06
owns:
  - Máy trạng thái payment_orders
  - Ngữ nghĩa soft_unlock
  - Ràng buộc chống duyệt trùng
depends_on:
  - PACKAGE-CATALOG
  - ENTITLEMENT-MODEL
---

# Luồng thanh toán VietQR duyệt tay

## 1. Objective

MVP không có cổng thanh toán tự động. User chuyển khoản qua VietQR, nộp chứng từ, Manager
đối chiếu sao kê rồi duyệt tay.

Đây là luồng doanh thu — nơi một lỗi không tạo ra bug report mà tạo ra mất tiền hoặc mất
khách. Ba thứ phải đúng tuyệt đối: **không duyệt trùng**, **cấp quyền và duyệt cùng một
transaction**, **từ chối thu hồi quyền ngay**.

Spec này sở hữu **máy trạng thái**. UI hai đầu ở `03-account/payment-*` và
`06-admin/payment-*`.

## 2. Actors

| Actor | Làm gì |
|---|---|
| User | Tạo đơn, xem QR, nộp chứng từ, huỷ đơn của chính mình |
| Manager `super_admin` | Xem hàng đợi, duyệt, từ chối, ghi chú |
| Manager `content_reviewer` | ❌ Không thấy bề mặt này |
| Hệ thống | Cấp `soft_unlock` khi nhận chứng từ; hết hạn đơn quá hạn |

## 3. Entry points

| Route | Actor |
|---|---|
| `POST /api/users/orders` | User — tạo đơn |
| `POST /api/users/orders/{uuid}/proof` | User — nộp chứng từ |
| `POST /api/users/orders/{uuid}/cancel` | User — huỷ khi còn `pending` |
| `GET /api/managers/orders` | Manager — hàng đợi |
| `POST /api/managers/orders/{uuid}/approve` | Manager |
| `POST /api/managers/orders/{uuid}/reject` | Manager |

## 4. Main flow

```
User chọn gói + offer
  ↓ POST /api/users/orders
status = pending                     hiện VietQR + nội dung chuyển khoản = mã đơn
  ↓ User chuyển khoản, nhập mã giao dịch + ảnh chứng từ
  ↓ POST /api/users/orders/{uuid}/proof
status = submitted                   → cấp entitlement status = soft_unlock, hết sau 3 ngày
  ↓ Manager mở hàng đợi, đối chiếu sao kê
  ├─ approve → status = approved
  │            entitlement.status = active, expires_at = now + offer.duration_days
  │            audit_logs + notification
  └─ reject  → status = rejected
               entitlement từ đơn đó → cancelled NGAY, cùng transaction
               audit_logs + notification kèm lý do
```

`soft_unlock` tồn tại vì duyệt tay có độ trễ người. **Người đã trả tiền không nên chờ.**

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Đơn `pending` quá 48h không có chứng từ | Job đặt `expired`. User tạo đơn mới được |
| `soft_unlock` hết 3 ngày mà chưa duyệt | Entitlement → `expired`. Đơn vẫn `submitted`, vẫn duyệt được. Duyệt sau đó cấp lại quyền đủ hạn |
| User đã có đơn `pending`/`submitted` cho cùng gói | **409** `ORDER_ALREADY_PENDING` |
| Approve một đơn đã `approved` | **409** `ORDER_ALREADY_PROCESSED` — ❌ không tạo thêm subscription |
| Approve fail giữa chừng khi cấp entitlement | Transaction rollback. Đơn **không** thành `approved` |
| Manager cấp bù ngày | `entitlement.expires_at` cộng thêm, ghi `grant_reason` bắt buộc |
| User mua gói khi đang có gói cùng loại còn hạn | Cho phép. `expires_at` mới = `expires_at` cũ + `duration_days` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PAY-01` | Chỉ đơn `submitted` hoặc `under_review` mới approve/reject được | |
| `BR-PAY-02` | **Idempotent theo `order_uuid`.** Approve lần hai → 409, ❌ không tạo thêm entitlement | Duyệt trùng tạo hai subscription và mất tiền |
| `BR-PAY-03` | Approve chạy trong **một transaction**: đổi status + cấp entitlement + ghi audit. Fail bất kỳ bước nào → rollback toàn bộ | Đơn `approved` mà không có quyền là ca hỗ trợ tệ nhất |
| `BR-PAY-04` | Reject thu hồi entitlement sinh từ đơn đó **ngay, cùng transaction**. ❌ Không chờ cron | `soft_unlock` là tin tưởng có thời hạn; rút tin tưởng thì quyền hết cùng lúc |
| `BR-PAY-05` | ❌ **NEVER kích hoạt gói chỉ dựa trên việc upload chứng từ.** Upload cấp `soft_unlock`, **không** cấp `active` | Ảnh chứng từ giả mạo được. Duyệt tay là bước xác minh thật |
| `BR-PAY-06` | Số tiền đọc từ `PACKAGE_CATALOG`, ❌ không từ client | |
| `BR-PAY-07` | Mọi approve/reject **bắt buộc** có `admin_note` ≥ 10 ký tự | Luồng tiền phải trả lời được vì sao |
| `BR-PAY-08` | ❌ **NEVER xoá** hàng `payment_orders`. Huỷ = đổi status | Lịch sử giao dịch là nghĩa vụ kế toán |
| `BR-PAY-09` | Nội dung chuyển khoản **là mã đơn**, ép định dạng, hiện nổi bật | Sai nội dung chuyển khoản là nguyên nhân số một của đối chiếu thủ công thất bại |
| `BR-PAY-10` | Ảnh chứng từ lưu **private**, truy cập qua signed URL hết hạn 15 phút | Chứng từ chứa thông tin ngân hàng |
| `BR-PAY-11` | `content_reviewer` ❌ không thấy route thanh toán nào | Tách nhiệm vụ |

## 7. Data

### 7.1 Máy trạng thái `payment_orders`

```
draft ──► pending ──► submitted ──► under_review ──► approved
            │            │              │
            │            │              └──────────► rejected
            ├──► cancelled (User huỷ)
            └──► expired  (48h không chứng từ)
```

| Từ ↓ / Sang → | pending | submitted | under_review | approved | rejected | cancelled | expired |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **draft** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **pending** | — | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **submitted** | ❌ | — | ✅ | ✅ | ✅ | ❌ | ❌ |
| **under_review** | ❌ | ❌ | — | ✅ | ✅ | ❌ | ❌ |
| **approved** / **rejected** / **cancelled** / **expired** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

Bốn trạng thái cuối là **terminal**.

### 7.2 Bảng `payment_orders`

| Field | Ghi chú |
|---|---|
| `uuid` | Định danh đối ngoại |
| `user_id` | FK |
| `package_code` `offer_code` | Snapshot lúc tạo đơn |
| `amount_vnd` `currency` | **Snapshot** — giá đổi sau không ảnh hưởng đơn đã tạo |
| `status` | §7.1 |
| `transfer_note` | = `uuid` rút gọn, dùng làm nội dung chuyển khoản |
| `bank_txn_ref` | Mã giao dịch User nhập |
| `proof_path` | Path S3 private |
| `submitted_at` `reviewed_at` `reviewed_by_manager_id` `admin_note` | |
| `created_at` `expires_at` | |

### 7.3 `entitlements.status` liên quan

| Trạng thái | Khi nào |
|---|---|
| `soft_unlock` | Nhận chứng từ, chưa duyệt. Hết sau `SOFT_UNLOCK_DAYS = 3` |
| `active` | Đã duyệt |
| `cancelled` | Đơn nguồn bị reject |
| `expired` | Quá `expires_at` |

## 8. API contract

### `POST /api/users/orders`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Body | `{ package_code, offer_code }` |
| 201 | `{ uuid, amount_vnd, transfer_note, qr_payload, bank_info, expires_at }` |
| 400 | `PACKAGE_NOT_SELLABLE` · `OFFER_NOT_FOUND` |
| 409 | `ORDER_ALREADY_PENDING` |

### `POST /api/users/orders/{uuid}/proof`

| | |
|---|---|
| Body | multipart — `bank_txn_ref` (string) + `proof` (image ≤ 5MB, jpeg/png/webp) |
| 200 | `{ status: "submitted", soft_unlock_until }` |
| 409 | `INVALID_STATUS_TRANSITION` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |

### `POST /api/managers/orders/{uuid}/approve`

| | |
|---|---|
| Auth | `requireManagerAuth()` + role `super_admin` |
| Body | `{ admin_note, bonus_days? }` |
| 200 | `{ status: "approved", entitlements: [{key, expires_at}] }` |
| 409 | `ORDER_ALREADY_PROCESSED` |
| 422 | `ADMIN_NOTE_REQUIRED` |

### `POST /api/managers/orders/{uuid}/reject`

Body `{ admin_note }` — bắt buộc. 200 `{ status: "rejected", revoked_entitlements: [...] }`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PAY-02 — không duyệt trùng
  Given một đơn thanh toán đã ở trạng thái approved
  When manager gọi approve lần thứ hai trên cùng uuid
  Then hệ thống trả 409 ORDER_ALREADY_PROCESSED
  And số hàng entitlements của user không tăng

Scenario: BR-PAY-03 — approve là nguyên tử
  Given một đơn ở trạng thái submitted
  And việc ghi entitlements sẽ thất bại
  When manager approve
  Then đơn vẫn ở trạng thái submitted
  And không có entitlement nào được tạo

Scenario: BR-PAY-04 — reject thu hồi quyền ngay
  Given một đơn submitted đã cấp entitlement soft_unlock
  When manager reject đơn đó
  Then trong cùng request, entitlement chuyển cancelled
  And request tiếp theo tới nội dung premium trả 403
  And không cần chờ job nào chạy

Scenario: BR-PAY-05 — upload chứng từ không kích hoạt gói
  Given user nộp chứng từ cho một đơn
  When kiểm entitlements của user
  Then status là soft_unlock
  And không phải active

Scenario: BR-PAY-06 — số tiền không nhận từ client
  Given user tạo đơn cho PKG-premium offer annual
  When body chứa amount_vnd = 1000
  Then đơn được tạo với số tiền từ PACKAGE_CATALOG
  And amount_vnd trong body bị bỏ qua

Scenario: BR-PAY-07 — duyệt bắt buộc có ghi chú
  Given một đơn submitted
  When manager approve với admin_note rỗng
  Then hệ thống trả 422 ADMIN_NOTE_REQUIRED
  And đơn vẫn submitted

Scenario: BR-PAY-08 — không xoá lịch sử giao dịch
  Given một đơn ở trạng thái rejected
  When gọi bất kỳ route nào để xoá đơn
  Then route không tồn tại
  And hàng vẫn còn trong payment_orders

Scenario: BR-PAY-10 — chứng từ không truy cập công khai
  Given một đơn đã có proof_path
  When truy cập trực tiếp URL S3 của ảnh
  Then bị từ chối
  And chỉ signed URL từ API admin mới mở được

Scenario: BR-PAY-11 — content_reviewer không vào được thanh toán
  Given manager có role content_reviewer
  When gọi GET /api/managers/orders
  Then hệ thống trả 403 INSUFFICIENT_ROLE

Scenario: E2E xuyên hai app
  Given user tạo đơn trên web và nộp chứng từ
  When manager duyệt trên admin
  Then user nhận thông báo
  And user chơi được nội dung premium ngay sau đó
```

## 10. Boundaries

**Always**
- Approve/reject trong một transaction cùng với cấp/thu hồi entitlement.
- Idempotent theo `order_uuid`.
- Đọc số tiền từ `PACKAGE_CATALOG`.
- Ghi `audit_logs` + `admin_note` mọi lần duyệt.
- Lưu chứng từ private, phát signed URL hết hạn ngắn.

**Ask first**
- Đổi `SOFT_UNLOCK_DAYS` hoặc thời hạn 48h của đơn `pending`.
- Thêm cổng thanh toán tự động.
- Cho `content_reviewer` thấy bề mặt thanh toán.
- Đổi máy trạng thái §7.1.

**Never**
- Kích hoạt gói chỉ dựa trên upload chứng từ.
- Duyệt hai lần.
- Nhận số tiền từ client.
- Xoá hàng `payment_orders`.
- Duyệt không ghi chú.
- Để chứng từ truy cập công khai.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có tự động đối chiếu sao kê ngân hàng (webhook/API) không, hay thuần mắt người? Thuần tay giới hạn quy mô ở vài chục đơn/ngày | Quy mô vận hành | 🟡 P2 | hoãn |
| 2 | `SOFT_UNLOCK_DAYS = 3` đủ chưa nếu duyệt vào cuối tuần? | SLA duyệt | 🟡 P2 | hoãn |
| 3 | Có hoàn tiền không, và luồng hoàn tiền thế nào? Chưa có spec | Chính sách hoàn tiền | 🟡 P5 | hoãn |
| 4 | Giữ VietQR duyệt tay vĩnh viễn hay chuyển cổng tự động ở P5? | Payment roadmap | 🟡 P5 | hoãn |
