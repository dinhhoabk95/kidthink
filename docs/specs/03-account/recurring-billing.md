---
spec: RECURRING-BILLING
title: Gia hạn thuê bao tự động và quản lý chu kỳ
area: account
status: approved
mvp: false
phase: P5
reviewed: 2026-08-16
owns:
  - Đăng ký gia hạn tự động và snapshot consent định kỳ
  - Quản lý trạng thái subscription recurring và huỷ gia hạn
  - Xử lý retry dunning và thu hồi quyền lợi khi gia hạn thất bại
depends_on:
  - AUTOMATED-PAYMENT
  - SUBSCRIPTION-VIEW
  - CONSENT-MANAGEMENT
  - ENTITLEMENT-MODEL
  - AUDIT-LOG
  - ERROR-CODES
  - EVENT-CATALOG
  - BUSINESS-RULES
---

# Gia hạn thuê bao tự động và quản lý chu kỳ

## 1. Objective

Cung cấp tính năng gia hạn gói học tập tự động định kỳ (tháng/năm) cho phụ huynh nhằm duy trì trải
nghiệm học tập liên tục không gián đoạn cho trẻ. Tính năng bảo đảm tính minh bạch tuyệt đối theo
quy định pháp luật Việt Nam: yêu cầu sự đồng ý tường minh của người lớn (explicit opt-in consent),
lưu vết snapshot điều khoản và mức giá, gửi thông báo trước mỗi kỳ gia hạn, và cho phép phụ huynh
huỷ gia hạn tự động bất kỳ lúc nào một cách dễ dàng ngay trên trang cài đặt tài khoản.

Spec này sở hữu luồng vòng đời thuê bao định kỳ và quy trình xử lý gia hạn thất bại (dunning);
kế thừa các quy tắc quản lý quyền lợi từ [`../00-foundation/entitlement-model.md`](../00-foundation/entitlement-model.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| User | Đã đăng nhập (`requireUserAuth`) | Đăng ký gia hạn định kỳ, xem lịch sử chu kỳ và huỷ tự động gia hạn |
| Worker | Job queue nội bộ | Tự động tạo lệnh gia hạn định kỳ, gửi email nhắc trước kỳ và chạy retry dunning |
| Manager | `super_admin` (`requireSuperAdminAuth`) | Tra cứu trạng thái subscription, tạm dừng hoặc huỷ chu kỳ khi có tranh chấp |

## 3. Entry points

| Route / Màn hình | Actor | Ghi chú |
|---|---|---|
| `/me/subscription` | User | Giao diện quản lý gói đang dùng và nút huỷ gia hạn định kỳ |
| `POST /api/users/subscriptions/recurring/opt-in` | User | Đăng ký bật chế độ tự động gia hạn kèm snapshot consent |
| `POST /api/users/subscriptions/recurring/cancel` | User | Huỷ tự động gia hạn (giữ quyền lợi tới hết chu kỳ) |
| `GET /api/users/subscriptions/recurring` | User | Xem thông tin chu kỳ hiện tại, ngày thu tiền kế tiếp và giá niêm yết |

## 4. Main flow

1. Khi chọn mua gói dịch vụ, phụ huynh chủ động tích chọn "Tự động gia hạn theo chu kỳ".
2. Hệ thống hiển thị rõ ràng điều khoản gia hạn, chu kỳ thu phí, mức phí và phương thức huỷ; ghi
   nhận `recurring_consent_snapshot` kèm phiên bản tài liệu pháp lý.
3. Khi chu kỳ kết thúc sắp đến (trước 3 ngày), worker gửi email thông báo nhắc nhở kèm số tiền dự
   kiến thu và hướng dẫn huỷ nếu phụ huynh không còn nhu cầu.
4. Đến ngày đáo hạn chu kỳ, worker kích hoạt giao dịch thanh toán tự động qua cổng đối tác
   ([`../01-platform/automated-payment.md`](../01-platform/automated-payment.md)).
5. Khi thanh toán thành công:
   - Cập nhật thời hạn `current_period_end` của subscription.
   - Gia hạn thời hạn `expires_at` của `entitlements` liên kết.
   - Ghi nhận `audit_logs` và gửi biên lai điện tử qua email cho phụ huynh.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Phụ huynh chủ động huỷ | Bấm huỷ tự gia hạn ở `/me/subscription` | Chuyển `auto_renew = false`, giữ nguyên quyền lợi đến hết chu kỳ đã trả tiền |
| Thu phí thất bại lần 1 | Thẻ hết hạn / số dư không đủ | Chuyển sang trạng thái `past_due`, gửi email thông báo và thử lại sau 24h |
| Thu phí thất bại lần 2 & 3 | Tiếp tục không thể trừ tiền | Thử lại tối đa 3 lần trong 7 ngày ân hạn (grace period) |
| Hết thời gian ân hạn | Quá 7 ngày không thu được tiền | Chuyển subscription sang `cancelled`, thu hồi quyền lợi gói (`entitlements.status = 'expired'`) |
| Đơn giá gói thay đổi | Quản trị viên cập nhật catalog giá | Chỉ áp dụng giá mới khi đã thông báo và User đồng ý lại |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RBL-01` | Gia hạn tự động yêu cầu sự đồng ý tường minh — Cấm — **NEVER** tự động chuyển đổi thanh toán một lần sang định kỳ tự gia hạn | Tôn trọng quyền tự quyết của người tiêu dùng và tuân thủ Luật Bảo vệ người tiêu dùng |
| `BR-RBL-02` | Snapshot điều khoản và giá tại thời điểm đăng ký subscription — User luôn được thông báo trước khi gia hạn ít nhất 3 ngày qua email | Đảm bảo tính minh bạch tài chính, tránh phát sinh khiếu nại trừ tiền bất ngờ |
| `BR-RBL-03` | Huỷ gia hạn tự động bất cứ lúc nào qua giao diện `/me/subscription` — quyền lợi hiện tại được giữ nguyên cho đến hết chu kỳ đã thanh toán | Người dùng đã trả tiền cho trọn vẹn chu kỳ nên quyền lợi phải được bảo lưu đầy đủ |
| `BR-RBL-04` | Cơ chế dunning và thử lại thông minh (tối đa 3 lần trong 7 ngày) khi thanh toán định kỳ thất bại — gửi thông báo nhắc nhở mà không spam | Tối ưu tỉ lệ duy trì thuê bao nhưng không làm phiền phụ huynh |
| `BR-RBL-05` | Thu hồi quyền lợi khi hết thời gian ân hạn thanh toán định kỳ thất bại — chuyển trạng thái subscription sang `cancelled` | Bảo vệ mô hình kinh doanh và không duy trì dịch vụ trả phí miễn phí vô hạn |
| `BR-RBL-06` | Thay đổi giá subscription chỉ áp dụng cho chu kỳ tiếp theo sau khi User nhận được thông báo và đồng ý theo quy định pháp luật | Nghiêm cấm tự ý tăng giá định kỳ khi chưa có sự chấp thuận của khách hàng |

## 7. Data

**Đọc:** `packages`, `entitlements`, `users`, `recurring_subscriptions`.
**Ghi:** `recurring_subscriptions`, `entitlements`, `audit_logs`, `consent_logs`.

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `user_id` | integer | FK `users.id` |
| `package_id` | integer | FK `packages.id` |
| `auto_renew` | boolean | Mặc định `false` trừ khi có opt-in |
| `current_period_start` | timestamp | Ngày bắt đầu chu kỳ hiện tại |
| `current_period_end` | timestamp | Ngày kết thúc chu kỳ hiện tại |
| `status` | enum | `active`, `past_due`, `cancelled`, `expired` |
| `dunning_attempts` | integer | Đếm số lần thử lại (tối đa 3) |

## 8. API contract

### `POST /api/users/subscriptions/recurring/opt-in`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Body | `{ "package_code": string, "billing_period": "monthly" \| "annual", "consent_accepted": true }` |
| 200 | `{ "subscription_id": string, "auto_renew": true, "next_billing_date": string }` |
| 400 | `PACKAGE_NOT_SELLABLE` — Gói không hỗ trợ thanh toán định kỳ |
| 422 | `VALIDATION_FAILED` — Chưa xác nhận đồng ý điều khoản |

### `POST /api/users/subscriptions/recurring/cancel`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Body | `{ "reason": string? }` |
| 200 | `{ "auto_renew": false, "active_until": string }` |
| 404 | `NOT_FOUND` — Không tìm thấy subscription định kỳ nào đang hoạt động |
| 409 | `SUBSCRIPTION_ALREADY_CANCELLED` — Gói đã được huỷ tự gia hạn trước đó |

## 9. Acceptance criteria

```gherkin
Scenario: BR-RBL-01 — opt-in tường minh khi đăng ký gia hạn
  Given User chọn mua gói standard
  When User tích chọn tự động gia hạn và bấm thanh toán
  Then hệ thống tạo bản ghi recurring_subscriptions với auto_renew = true
  And lưu vết snapshot điều khoản và phiên bản đồng ý

Scenario: BR-RBL-03 — huỷ gia hạn giữ quyền lợi đến hết chu kỳ
  Given User có subscription đang hoạt động đến ngày 31/12/2026
  When User bấm huỷ tự động gia hạn vào ngày 15/10/2026
  Then hệ thống cập nhật auto_renew = false
  And quyền lợi gói standard vẫn duy trì đến hết ngày 31/12/2026

Scenario: BR-RBL-05 — thu hồi quyền lợi sau khi hết 7 ngày ân hạn
  Given subscription của User ở trạng thái past_due từ ngày 01/10/2026
  When sau 3 lần thử lại và quá 7 ngày vẫn không thu được tiền
  Then trạng thái subscription chuyển sang cancelled
  And entitlement chuyển sang expired
```

## 10. Boundaries

**Always**
- Yêu cầu người lớn xác nhận đồng ý tường minh trước khi lưu thông tin gia hạn định kỳ.
- Duy trì quyền lợi của User đến hết ngày kết thúc chu kỳ khi có thao tác huỷ gia hạn.
- Gửi email thông báo nhắc nhở tối thiểu 3 ngày trước ngày thu phí định kỳ kế tiếp.

**Ask first**
- Thay đổi chu kỳ thu phí hoặc thời gian ân hạn dunning.
- Điều chỉnh chính sách giá của các gói đăng ký định kỳ đang hoạt động.

**Never**
- Tự ý bật tính năng gia hạn định kỳ từ một đơn hàng thanh toán đơn lẻ.
- Ngắt quyền lợi của User ngay lập tức khi họ mới chỉ bấm huỷ tính năng tự gia hạn.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Mẫu email thông báo nhắc gia hạn trước 3 ngày đã có bản thiết kế UI chưa? | Template email | P5 | Studio UI |
| 2 | Gói tháng (monthly) có được kích hoạt đồng thời cùng gói năm ở P5 không? | Catalog pricing | P5 | Kế toán |
