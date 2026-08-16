---
spec: PAYMENT-APPROVAL
title: Duyệt và từ chối đơn thanh toán
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Thao tác approve/reject và hậu quả
  - Cấp bù ngày
depends_on:
  - PAYMENT-FLOW
  - ENTITLEMENT-MODEL
  - AUDIT-LOG
---

# Duyệt và từ chối đơn thanh toán

## 1. Objective

Một thao tác, ba hậu quả: đổi trạng thái đơn, cấp hoặc thu hồi entitlement, ghi audit.
**Cả ba xảy ra hoặc không cái nào xảy ra.**

Đây là điểm nhạy cảm nhất của toàn hệ thống về mặt tiền bạc.

## 2. Actors

| Actor | Quyền |
|---|---|
| `super_admin` | Duyệt, từ chối, cấp bù ngày |
| `content_reviewer` | Cấm truy cập |

## 3. Entry points

`/payments/{uuid}/decide` · `POST /api/managers/orders/{uuid}/approve` · `/reject`.

## 4. Main flow — approve

```
BEGIN TRANSACTION
  1. Khoá hàng đơn (SELECT ... FOR UPDATE)
  2. Kiểm status ∈ {submitted, under_review}     → không: 409
  3. Đổi status = approved, ghi reviewed_by, admin_note
  4. Với mỗi entitlement_key của package:
        UPSERT entitlements status=active
        expires_at = max(now, expires_at cũ) + duration_days + bonus_days
  5. Ghi audit_logs order_approved
  6. INSERT notifications order_approved
COMMIT
```

Bước 4 dùng `max(now, expires_at cũ)` để mua khi còn hạn thì **cộng dồn**, không mất phần
còn lại.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Approve đơn đã terminal | **409** `ORDER_ALREADY_PROCESSED` |
| Cấp entitlement fail | **Rollback toàn bộ** — đơn không thành `approved` |
| Reject | Đổi `rejected`, entitlement từ đơn đó → `cancelled` **ngay, cùng transaction** |
| Cấp bù ngày | `bonus_days` ≤ 30, ghi lý do bắt buộc |
| Đơn `expired` | Cấm duyệt được; User tạo đơn mới |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PAP-01` | **Idempotent theo `order_uuid`.** Approve lần hai → 409 | Duyệt trùng tạo hai subscription và mất tiền |
| `BR-PAP-02` | Toàn bộ trong **một transaction**, có khoá hàng | Đơn `approved` mà không có quyền là ca hỗ trợ tệ nhất |
| `BR-PAP-03` | Reject thu hồi entitlement **ngay, cùng transaction** | `soft_unlock` là tin tưởng có thời hạn |
| `BR-PAP-04` | `admin_note` **bắt buộc** ≥10 ký tự cho cả approve và reject | Luồng tiền phải trả lời được vì sao |
| `BR-PAP-05` | Mua khi còn hạn → **cộng dồn** từ `expires_at` cũ | Người dùng không mất phần đã trả |
| `BR-PAP-06` | `bonus_days` ≤ **30**, lý do bắt buộc, ghi audit | Cấp bù không giới hạn là đường lạm dụng |
| `BR-PAP-07` | Số tiền và thời hạn đọc từ **`PACKAGE_CATALOG`** theo `package_code`/`offer_code` snapshot trên đơn | không nhận từ form |
| `BR-PAP-08` | Màn hình quyết định hiện **checklist đối chiếu** | Duyệt theo thói quen là nơi sai xảy ra |
| `BR-PAP-09` | Cấm — **NEVER xoá đơn.** Huỷ = đổi trạng thái | Nghĩa vụ kế toán |

## 7. Data

### 7.1 Checklist đối chiếu — hiện trước nút duyệt

- [ ] Số tiền trên chứng từ **khớp** số tiền đơn
- [ ] Nội dung chuyển khoản **chứa** `transfer_note`
- [ ] Mã giao dịch **chưa dùng** cho đơn khác
- [ ] Thời gian chuyển khoản **sau** thời điểm tạo đơn
- [ ] Ảnh chứng từ **đọc được**, không cắt xén phần quan trọng

Cả 5 tick mới bật nút duyệt. Kết quả lưu vào `admin_note` dạng cấu trúc.

### 7.2 Hậu quả approve

| Đối tượng | Thay đổi |
|---|---|
| `payment_orders` | `status = approved`, `reviewed_at`, `reviewed_by_manager_id`, `admin_note` |
| `entitlements` | Mỗi key của gói → `active`, `expires_at` tính theo §4 bước 4 |
| `audit_logs` | `order_approved` kèm before/after |
| `notifications` | `order_approved` tới User |

### 7.3 Hậu quả reject

`status = rejected` · entitlement từ đơn đó → `cancelled` **ngay** ·
audit `order_rejected` · notification kèm lý do (rút gọn, lịch sự).

## 8. API contract

### `POST /api/managers/orders/{uuid}/approve`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `super_admin` |
| Body | `{ admin_note, checklist, bonus_days? }` |
| 200 | `{ status, entitlements: [{ key, expires_at }] }` |
| 409 | `ORDER_ALREADY_PROCESSED` |
| 422 | `ADMIN_NOTE_REQUIRED` · checklist chưa đủ |

### `POST /api/managers/orders/{uuid}/reject`

Body `{ admin_note }`. 200 → `{ status, revoked_entitlements }`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PAP-01 — approve hai lần bị chặn
  Given một đơn đã approved
  When gọi approve lần nữa
  Then trả 409 ORDER_ALREADY_PROCESSED
  And số hàng entitlements không tăng

Scenario: BR-PAP-01 — approve đồng thời từ hai request
  Given hai request approve cùng lúc cho một đơn
  Then đúng một request thành công
  And request còn lại nhận 409

Scenario: BR-PAP-02 — cấp quyền fail thì rollback
  Given việc ghi entitlements sẽ thất bại
  When approve
  Then đơn vẫn ở submitted
  And không entitlement nào được tạo
  And không notification nào được gửi

Scenario: BR-PAP-03 — reject thu hồi ngay
  Given đơn đã cấp soft_unlock
  When reject
  Then trong cùng request entitlement chuyển cancelled
  And truy cập nội dung trả phí trả 403 ngay sau đó

Scenario: BR-PAP-05 — mua khi còn hạn thì cộng dồn
  Given user có entitlement premium hết hạn sau 100 ngày
  When approve một đơn premium 365 ngày
  Then expires_at mới là 465 ngày kể từ hôm nay

Scenario: BR-PAP-04 — bắt buộc ghi chú
  When approve với admin_note rỗng
  Then trả 422

Scenario: BR-PAP-08 — checklist bắt buộc
  When approve mà chưa tick đủ 5 mục
  Then trả 422
  And nút duyệt trên UI bị vô hiệu

Scenario: BR-PAP-06 — cấp bù giới hạn
  When approve với bonus_days = 60
  Then trả 422

Scenario: BR-PAP-07 — thời hạn đọc từ catalog
  Given form gửi kèm duration_days = 9999
  When approve
  Then expires_at tính theo duration_days của offer trong PACKAGE_CATALOG

Scenario: E2E xuyên hai app
  Given user nộp chứng từ trên web
  When manager duyệt trên admin
  Then user nhận thông báo
  And user chơi được nội dung premium ngay
```

## 10. Boundaries

**Always**
- Một transaction, có khoá hàng.
- Checklist đối chiếu trước khi bật nút.
- `admin_note` bắt buộc.
- Cộng dồn thời hạn khi còn hạn.

**Ask first**
- Đổi giới hạn `bonus_days`.
- Đổi checklist đối chiếu.
- Cho role khác duyệt.

**Never**
- Approve hai lần.
- Ghi entitlement ngoài transaction của đơn.
- Nhận số tiền hoặc thời hạn từ form.
- Xoá đơn.
- Duyệt không ghi chú.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Luồng hoàn tiền thiết kế thế nào?~~ **Đóng 2026-08-16 (D-RF)**: không có tính năng hoàn tiền trong ứng dụng; hoàn tiền ngoài hệ thống qua Zalo OA / Messenger / Email và chuyển khoản thủ công | Đã đóng | Không có refund trong app | D-RF |
| 2 | Duyệt nhầm rồi phát hiện sau — có thao tác "huỷ duyệt" không, hay chỉ thu hồi entitlement tay? | P2 | Không ở MVP — dùng thao tác thu hồi/điều chỉnh entitlement thủ công qua [`entitlement-grant.md`](entitlement-grant.md) | người quyết |
