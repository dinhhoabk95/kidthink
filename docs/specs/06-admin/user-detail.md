---
spec: USER-DETAIL
title: Chi tiết một người dùng
area: admin
status: draft
mvp: true
phase: P2
reviewed: 2026-08-04
owns:
  - Nội dung màn hình chi tiết User
  - Ranh giới dữ liệu được hiện
depends_on:
  - USER-MANAGEMENT
  - CHILD-DATA-COMPLIANCE
---

# Chi tiết một người dùng

## 1. Objective

Đủ ngữ cảnh để hỗ trợ một User, **không hơn**.

Ranh giới dữ liệu ở đây là ràng buộc tuân thủ, không phải lựa chọn UX: vận hành ❌ không cần
dữ liệu học tập của một đứa trẻ cụ thể — phụ huynh cần.

## 2. Actors

`super_admin` đầy đủ. `content_reviewer` ❌ không truy cập.

## 3. Entry points

`/users/{uuid}` · `GET /api/managers/users/{uuid}`.

## 4. Main flow

1. Mở từ danh sách hoặc từ một đơn thanh toán.
2. Hiện bốn nhóm §7.1, **chỉ đọc**.
3. Hành động dẫn sang bề mặt khác: `user-management` (khoá), `entitlement-grant` (cấp
   quyền), `payment-queue` (đơn).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| User `deleted` | Hiện chỉ đọc + `purge_at`, ❌ không thao tác được |
| User chưa xác thực email | Nút gửi lại email xác thực |
| Không có hồ sơ trẻ | Hiện "chưa có", ❌ không hiện 0 gây hiểu nhầm |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-USD-01` | ❌ **NEVER hiện telemetry, mastery, hay lịch sử chơi của một trẻ** | `BR-CDC-14` — vận hành không có nhu cầu nghiệp vụ |
| `BR-USD-02` | Hồ sơ trẻ hiện **`display_name` + `age_band`** để hỗ trợ được; ❌ không hơn | Đủ để nói chuyện với phụ huynh, ❌ không đủ để hồ sơ hoá đứa trẻ |
| `BR-USD-03` | Màn hình **chỉ đọc**; hành động dẫn sang bề mặt có audit riêng | |
| `BR-USD-04` | ❌ **NEVER hiện mật khẩu hash hay token** | |
| `BR-USD-05` | Mở chi tiết User ghi `audit_logs` khi có xem hồ sơ trẻ | Truy cập dữ liệu trẻ phải truy được |
| `BR-USD-06` | Lịch sử đơn hiện **đủ**, kể cả đơn bị từ chối | Ngữ cảnh hỗ trợ |

## 7. Data

### 7.1 Bốn nhóm

| Nhóm | Nội dung |
|---|---|
| **Tài khoản** | email · `display_name` · trạng thái · ngày tạo · xác thực email · hoạt động gần nhất · số phiên đang mở |
| **Hồ sơ trẻ** | Danh sách: `display_name` · `age_band` · trạng thái · ngày tạo. ❌ Không tiến độ, ❌ không lịch sử chơi |
| **Quyền** | Entitlement đang hiệu lực: key · nguồn · `expires_at`. Lịch sử entitlement đã hết |
| **Thanh toán** | Mọi đơn: thời gian · gói · số tiền · trạng thái · người duyệt · ghi chú |

### 7.2 Hành động (dẫn đi nơi khác)

Khoá/mở khoá → `user-management` · Cấp entitlement → `entitlement-grant` ·
Gửi lại email xác thực · Gửi link đặt lại mật khẩu · Xem đơn → `payment-queue`.

## 8. API contract

### `GET /api/managers/users/{uuid}`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `super_admin` |
| 200 | §7.1 |
| 403 | `INSUFFICIENT_ROLE` |
| 404 | Không tồn tại |

## 9. Acceptance criteria

```gherkin
Scenario: BR-USD-01 — không hiện dữ liệu học tập của trẻ
  When gọi GET /api/managers/users/{uuid}
  Then response không chứa mastery, telemetry, hay play_session của trẻ nào

Scenario: BR-USD-02 — hồ sơ trẻ chỉ tên và band tuổi
  When đọc mảng hồ sơ trẻ trong response
  Then mỗi phần tử chỉ có display_name, age_band, status, created_at

Scenario: BR-USD-04 — không lộ bí mật
  When đọc response
  Then không có password_hash, refresh token, hay mfa secret

Scenario: BR-USD-03 — màn hình chỉ đọc
  When quét lời gọi API từ trang chi tiết
  Then không có mutation nào trực tiếp trên trang này

Scenario: BR-USD-05 — xem hồ sơ trẻ được audit
  When manager mở chi tiết một user có hồ sơ trẻ
  Then audit_logs có hàng ghi việc truy cập

Scenario: BR-USD-06 — hiện cả đơn bị từ chối
  Given user có 1 đơn approved và 2 đơn rejected
  Then màn hình hiện đủ 3 đơn
```

## 10. Boundaries

**Always**
- Giữ dữ liệu trẻ ở mức tên + band tuổi.
- Ghi audit khi truy cập hồ sơ trẻ.
- Dẫn hành động sang bề mặt có audit riêng.

**Ask first**
- Hiện thêm loại dữ liệu nào của trẻ.
- Thêm hành động trực tiếp trên trang.

**Never**
- Telemetry, mastery, lịch sử chơi của một trẻ.
- Mật khẩu hash hay token.
- Mutation trực tiếp từ màn hình chi tiết.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có cần ghi chú hỗ trợ gắn với User không? | `user-management` Q1 |
