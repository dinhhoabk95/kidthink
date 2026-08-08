---
spec: ENTITLEMENT-GRANT
title: Cấp và thu hồi quyền thủ công
area: admin
status: approved
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Thao tác cấp/thu hồi entitlement bằng tay
  - Giới hạn và audit của thao tác này
depends_on:
  - ENTITLEMENT-MODEL
  - AUDIT-LOG
  - ADMIN-AUTH
---

# Cấp và thu hồi quyền thủ công

## 1. Objective

Đường thoát cho ca ngoại lệ: chuyển khoản không đối chiếu được, bồi thường sự cố, tài khoản
dùng thử cho đối tác, game custom theo yêu cầu.

Đây cũng là **đường lạm dụng dễ nhất** trong hệ thống — nên nó có giới hạn cứng và audit đầy
đủ.

## 2. Actors

| Actor | Quyền |
|---|---|
| `super_admin` | Cấp, thu hồi |
| `content_reviewer` | Cấm truy cập |

## 3. Entry points

`/users/{uuid}/entitlements` · `POST /api/managers/users/{uuid}/entitlements` ·
`DELETE /api/managers/entitlements/{id}`.

## 4. Main flow

1. Mở từ [`user-detail.md`](user-detail.md).
2. Chọn **package** (không chọn key lẻ) + thời hạn + lý do.
3. Xác nhận → transaction: tạo entitlement `source = manual_grant`, ghi audit.
4. User nhận thông báo.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| User đã có gói đó còn hạn | **Cộng dồn** từ `expires_at` cũ |
| Thu hồi | `status = cancelled`, hiệu lực ngay, audit |
| Cấp gói add-on chưa bán | **Cho phép** — đây là đường duy nhất mở add-on ở MVP |
| Thời hạn > 365 ngày | Cần xác nhận thêm một bước |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EGR-01` | Cấp theo **package**, không theo key lẻ | Cấp key lẻ tạo tổ hợp quyền không tồn tại trong catalog, và không ai test |
| `BR-EGR-02` | `grant_reason` **bắt buộc** ≥20 ký tự | Đây là đường lạm dụng dễ nhất |
| `BR-EGR-03` | Mọi thao tác ghi `audit_logs` kèm before/after | Đảm bảo khả năng giải trình và truy vết theo `BR-AUD-01` đối với thao tác tài chính thủ công |
| `BR-EGR-04` | Thời hạn tối đa **365 ngày** một lần cấp | Cấp vĩnh viễn bằng tay là mất kiểm soát doanh thu |
| `BR-EGR-05` | Chỉ `super_admin` | Quyền tối cao về tài chính chỉ thuộc về người quản trị cao nhất để giảm nguy cơ trục lợi |
| `BR-EGR-06` | Thu hồi có hiệu lực **ngay**, invalidate cache | `BR-ENT-06` |
| `BR-EGR-07` | Cộng dồn khi còn hạn, không ghi đè | `BR-PAP-05` |
| `BR-EGR-08` | Cấp tay **không tạo** `payment_orders` giả | Doanh thu và quyền là hai sổ khác nhau |
| `BR-EGR-09` | Báo cáo cấp tay hàng tháng gửi cho `super_admin` | Tự giám sát |

## 7. Data

### 7.1 Form cấp

| Trường | Ràng buộc |
|---|---|
| `package_code` | Từ catalog, **gồm cả** add-on `is_public = false` |
| `duration_days` | 1–365 |
| `grant_reason` | ≥20 ký tự |
| `notify_user` | Mặc định bật |

### 7.2 Bảng entitlement của User

Key · nguồn (`payment_order` \| `manual_grant` \| `promo` \| `default`) · trạng thái ·
`granted_at` · `expires_at` · người cấp · lý do · nút thu hồi.

Cột "nguồn" quan trọng: phân biệt quyền đã trả tiền với quyền cấp tay là điều kiện để báo
cáo doanh thu đúng.

## 8. API contract

### `POST /api/managers/users/{uuid}/entitlements`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `super_admin` |
| Body | `{ package_code, duration_days, grant_reason, notify_user }` |
| 201 | `{ entitlements: [{ key, expires_at }] }` |
| 422 | `VALIDATION_FAILED` — lý do quá ngắn, thời hạn ngoài khoảng |
| 404 | `PACKAGE_NOT_FOUND` |

### `DELETE /api/managers/entitlements/{id}`

Body `{ reason }`. 200 → `cancelled` ngay.

## 9. Acceptance criteria

```gherkin
Scenario: BR-EGR-01 — không cấp key lẻ
  When gọi API cấp với một entitlement_key thay vì package_code
  Then trả 422

Scenario: BR-EGR-02 — lý do bắt buộc và đủ dài
  When cấp với grant_reason 10 ký tự
  Then trả 422

Scenario: BR-EGR-04 — giới hạn thời hạn
  When cấp với duration_days = 3650
  Then trả 422

Scenario: BR-EGR-06 — thu hồi có hiệu lực ngay
  Given user có entitlement premium cấp tay
  When manager thu hồi
  Then request tiếp theo tới nội dung premium trả 403
  And không cần chờ cache hết hạn

Scenario: BR-EGR-07 — cộng dồn khi còn hạn
  Given user có premium còn 50 ngày
  When cấp thêm 100 ngày
  Then expires_at là 150 ngày kể từ hôm nay

Scenario: BR-EGR-08 — không tạo đơn giả
  When cấp tay một gói
  Then không hàng payment_orders nào được tạo

Scenario: BR-EGR-03 — audit đầy đủ
  When cấp rồi thu hồi
  Then audit_logs có entitlement_granted và entitlement_revoked
  And cả hai có reason không rỗng

Scenario: cấp được add-on chưa bán
  When cấp package_code = PKG-addon_lesson_plan
  Then thành công
  And user có entitlement create_lesson_plan

Scenario: BR-EGR-05 — content_reviewer bị chặn
  Given manager role content_reviewer
  When gọi API cấp entitlement
  Then trả 403
```

## 10. Boundaries

**Always**
- Cấp theo package.
- Lý do ≥20 ký tự.
- Audit before/after.
- Invalidate cache khi thu hồi.

**Ask first**
- Nâng trần 365 ngày.
- Cho role khác cấp quyền.
- Cấp entitlement key lẻ.

**Never**
- Cấp key lẻ ngoài package.
- Cấp không lý do.
- Tạo `payment_orders` giả.
- Ghi đè thời hạn còn lại.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Báo cáo cấp tay hàng tháng gửi cho ai khi chỉ có một `super_admin`? | P2 | Gửi email thông báo tổng hợp tới chính email `super_admin` duy nhất ở MVP | người quyết |
| 2 | Có cần ngưỡng cảnh báo khi cấp tay vượt N lần/tháng không? | P2 | Chưa ở MVP — `super_admin` tự kiểm soát qua `audit_logs`; bổ sung cảnh báo ở P3 | người quyết |
