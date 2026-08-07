---
spec: SUBSCRIPTION-VIEW
title: Xem gói và lịch sử thanh toán
area: account
status: draft
mvp: true
phase: P2
reviewed: 2026-08-04
owns:
  - Màn hình gói hiện tại và lịch sử giao dịch
depends_on:
  - ENTITLEMENT-MODEL
  - PAYMENT-FLOW
---

# Xem gói và lịch sử thanh toán

## 1. Objective

Trả lời **"tôi đang có gì, tới khi nào, và đã trả bao nhiêu"**.

Minh bạch ở đây giảm ca hỗ trợ nhiều hơn bất kỳ trang nào khác — phần lớn câu hỏi về thanh
toán là câu hỏi về trạng thái.

## 2. Actors

User đã đăng nhập.

## 3. Entry points

`/me/subscription` · `GET /api/users/subscription`.

## 4. Main flow

1. Hiện gói đang hiệu lực + ngày hết hạn.
2. Liệt kê **quyền lợi đang mở**, sinh từ `package_entitlements`.
3. Hiện quota đã dùng / còn lại.
4. Lịch sử đơn: mọi đơn, mọi trạng thái.
5. CTA nâng cấp nếu có gói cao hơn.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Không có gói | Hiện quyền lợi mặc định + CTA |
| Nhiều gói cùng lúc | Liệt kê tất cả, hợp quyền lợi |
| Gói `soft_unlock` | Nhãn "đang chờ xác nhận", nêu thời hạn tạm |
| Gói hết hạn | Nhãn hết hạn + CTA gia hạn; **dữ liệu vẫn còn** |
| Có entitlement cấp tay | Hiện nguồn "được cấp", ❌ không hiện lý do nội bộ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SBV-01` | Quyền lợi sinh từ **`package_entitlements`**, ❌ không viết tay | `BR-PKG-06` |
| `BR-SBV-02` | Nói rõ **dữ liệu không mất** khi hết hạn | Lo mất dữ liệu là rào cản gia hạn lớn |
| `BR-SBV-03` | Lịch sử hiện **mọi đơn**, kể cả bị từ chối | Minh bạch |
| `BR-SBV-04` | ❌ **NEVER hiện `admin_note` nội bộ** — chỉ lý do rút gọn | |
| `BR-SBV-05` | Nhiều gói → **hợp** quyền lợi, ❌ không ghi đè | `BR-ENT-02` |
| `BR-SBV-06` | Ownership: chỉ thấy đơn của chính mình | |
| `BR-SBV-07` | Một CTA nâng cấp | `BR-MDB-07` |

## 7. Data

### 7.1 Ba khối

| Khối | Nội dung |
|---|---|
| **Gói hiện tại** | Tên gói · trạng thái · ngày hết hạn · số ngày còn lại · nguồn |
| **Quyền lợi** | Danh sách entitlement đang mở, nhãn tiếng Việt · quota đã dùng / tổng |
| **Lịch sử** | Ngày · gói · số tiền · trạng thái · lý do (nếu từ chối) · link chi tiết |

### 7.2 Câu về dữ liệu khi hết hạn

*"Khi gói hết hạn, hồ sơ của các bé và toàn bộ tiến độ học vẫn được giữ nguyên. Bạn chỉ tạm
thời không truy cập được nội dung trả phí."*

## 8. API contract

### `GET /api/users/subscription`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| 200 | `{ packages: [...], entitlements: [...], quotas: [...], orders: [...] }` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-SBV-01 — quyền lợi sinh từ dữ liệu
  When so danh sách quyền lợi hiển thị với package_entitlements trong DB
  Then hai danh sách khớp nhau

Scenario: BR-SBV-02 — nói rõ dữ liệu không mất
  Given gói của user đã hết hạn
  When mở /me/subscription
  Then hiện câu khẳng định dữ liệu bé được giữ nguyên

Scenario: BR-SBV-03 — hiện cả đơn bị từ chối
  Given user có 1 đơn approved và 2 rejected
  Then lịch sử hiện đủ 3

Scenario: BR-SBV-04 — không lộ ghi chú nội bộ
  Given một đơn bị từ chối có admin_note nội bộ
  When user xem
  Then không hiện nguyên văn ghi chú đó

Scenario: BR-SBV-05 — nhiều gói hợp quyền lợi
  Given user có standard và một add-on cấp tay
  Then danh sách quyền lợi chứa key của cả hai

Scenario: BR-SBV-06 — không thấy đơn người khác
  When gọi API subscription
  Then chỉ có đơn của chính user

Scenario: soft_unlock hiện rõ trạng thái tạm
  Given user có entitlement soft_unlock
  Then hiện nhãn đang chờ xác nhận và thời hạn tạm
```

## 10. Boundaries

**Always**
- Sinh quyền lợi từ dữ liệu.
- Hiện mọi đơn của chính User.
- Nói rõ dữ liệu không mất khi hết hạn.

**Ask first**
- Thêm thông tin vào khối quyền lợi.

**Never**
- Viết tay danh sách quyền lợi.
- Hiện `admin_note` nội bộ.
- Ẩn đơn bị từ chối.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có hiện hoá đơn tải về được không? Cần nếu khách yêu cầu chứng từ | P2 |
