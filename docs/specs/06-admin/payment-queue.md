---
spec: PAYMENT-QUEUE
title: Hàng đợi đơn thanh toán
area: admin
status: approved
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Danh sách đơn chờ xử lý và bộ lọc
  - Bề mặt đối chiếu chứng từ
depends_on:
  - PAYMENT-FLOW
  - ADMIN-AUTH
---

# Hàng đợi đơn thanh toán

## 1. Objective

Nơi Manager **tìm và đối chiếu** đơn. Hành động duyệt/từ chối ở [`payment-approval.md`](payment-approval.md) — tách
ra để màn hình danh sách không có nút gây hậu quả tài chính.

SLA vận hành: **P90 < 12 giờ** từ lúc User nộp chứng từ tới lúc có quyết định.

## 2. Actors

| Actor | Quyền |
|---|---|
| `super_admin` | Đầy đủ |
| `content_reviewer` | Cấm truy cập |

## 3. Entry points

`/payments` · `GET /api/managers/orders` · `GET /api/managers/orders/{uuid}` ·
`GET /api/managers/orders/{uuid}/proof-url`.

## 4. Main flow

1. Mở `/payments`, mặc định lọc `submitted` + `under_review`, sắp theo **cũ nhất trước**.
2. Mở một đơn → xem: User, gói, số tiền, mã giao dịch, ảnh chứng từ.
3. Ảnh chứng từ mở qua **signed URL 15 phút**.
4. Manager đối chiếu với sao kê ngân hàng ngoài hệ thống.
5. Chuyển sang [`payment-approval.md`](payment-approval.md) để quyết định.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Nhận đơn để xử lý | `submitted → under_review`, gắn `reviewed_by_manager_id` tạm |
| Đơn đang `under_review` bởi người khác | Cảnh báo, vẫn mở được (một người ở MVP) |
| Chứng từ không đọc được | Từ chối kèm lý do, User nộp lại |
| Trùng mã giao dịch với đơn khác | **Cảnh báo nổi bật** — dấu hiệu nộp lại chứng từ cũ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PQU-01` | Danh sách **không có nút duyệt** | Nút gây hậu quả tài chính không nằm trên màn hình lướt nhanh |
| `BR-PQU-02` | Sắp mặc định **cũ nhất trước** | Người chờ lâu nhất được xử lý trước |
| `BR-PQU-03` | Ảnh chứng từ qua **signed URL ≤15 phút** | Chứng từ chứa thông tin ngân hàng |
| `BR-PQU-04` | Cảnh báo khi `bank_txn_ref` **trùng** đơn khác | Nộp lại chứng từ cũ là gian lận phổ biến nhất của duyệt tay |
| `BR-PQU-05` | Cấm — **NEVER hiện dữ liệu trẻ** trong màn hình đơn | `BR-CDC-14` |
| `BR-PQU-06` | Trần phân trang **100** | Hạn chế tài nguyên bộ nhớ server và ngăn cản việc tải dữ liệu quá mức |
| `BR-PQU-07` | Đơn cũ nhất > 24h → **cảnh báo trên dashboard** | SLA |
| `BR-PQU-08` | `content_reviewer` không truy cập | Phân tách vai trò theo nguyên tắc quyền tối thiểu — chỉ super_admin mới được xem dữ liệu tài chính |

## 7. Data

### 7.1 Bộ lọc

`status` (mặc định `submitted,under_review`) · `package_code` · `amount_min/max` ·
`submitted_from/to` · `q` (email hoặc `bank_txn_ref`) · `sort` (`oldest` mặc định) ·
`limit` ≤100.

### 7.2 Cột danh sách

Thời gian nộp · Chờ bao lâu · Email User · Gói + chu kỳ · Số tiền · Mã giao dịch ·
Trạng thái · Cờ cảnh báo (trùng mã / User đã bị từ chối trước).

### 7.3 Màn hình chi tiết đơn

| Vùng | Nội dung |
|---|---|
| Đơn | uuid · gói · offer · số tiền · `transfer_note` · trạng thái · thời gian |
| User | email · tên · ngày tạo · **số** hồ sơ trẻ · lịch sử đơn trước |
| Chứng từ | Ảnh (signed URL) · `bank_txn_ref` |
| Cảnh báo | Trùng mã giao dịch · User có đơn bị từ chối trước |
| Hành động | Nút chuyển sang [`payment-approval.md`](payment-approval.md) |

## 8. API contract

### `GET /api/managers/orders`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `super_admin` |
| Query | §7.1 |
| 200 | `{ items, next_cursor, stats: { pending_count, oldest_waiting_hours } }` |

### `GET /api/managers/orders/{uuid}/proof-url`

200 → `{ url, expires_at }`. TTL 15 phút. Ghi audit `proof_viewed`.

### `POST /api/managers/orders/{uuid}/claim`

`submitted → under_review`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PQU-01 — danh sách không có nút duyệt
  When render trang /payments
  Then không có nút approve hay reject trên danh sách

Scenario: BR-PQU-03 — chứng từ chỉ mở qua signed URL
  Given một đơn có proof_path
  When truy cập URL S3 trực tiếp
  Then bị từ chối
  When lấy signed URL và mở trong 15 phút
  Then ảnh hiện ra
  When mở lại sau 20 phút
  Then bị từ chối

Scenario: BR-PQU-04 — cảnh báo trùng mã giao dịch
  Given đơn A và đơn B có cùng bank_txn_ref
  When mở đơn B
  Then hiện cảnh báo nổi bật kèm link tới đơn A

Scenario: BR-PQU-02 — cũ nhất trước
  When mở hàng đợi không đổi bộ lọc
  Then đơn có submitted_at sớm nhất xếp đầu

Scenario: BR-PQU-05 — không lộ dữ liệu trẻ
  When mở chi tiết một đơn
  Then chỉ hiện số lượng hồ sơ trẻ
  And không hiện tên, tuổi, hay tiến độ của trẻ

Scenario: BR-PQU-08 — content_reviewer bị chặn
  Given manager role content_reviewer
  When gọi GET /api/managers/orders
  Then trả 403

Scenario: xem chứng từ được audit
  When manager lấy signed URL
  Then audit_logs có hàng ghi lại việc xem chứng từ
```

## 10. Boundaries

**Always**
- Signed URL ngắn hạn cho chứng từ.
- Cảnh báo trùng `bank_txn_ref`.
- Sắp cũ nhất trước.
- Audit khi xem chứng từ.

**Ask first**
- Đổi TTL signed URL.
- Thêm cờ cảnh báo mới.
- Nâng trần phân trang.

**Never**
- Nút duyệt trên danh sách.
- Chứng từ truy cập công khai.
- Hiện dữ liệu trẻ.
- Cho `content_reviewer` truy cập.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Có tích hợp API/webhook ngân hàng để đối chiếu tự động không? Thuần tay giới hạn ở vài chục đơn/ngày | P2 | Hoãn sang P2 nâng cao / P3 — trỏ sang [`payment-flow.md`](../00-foundation/payment-flow.md) Q1 | người quyết |
| 2 | Cờ cảnh báo nào nữa đáng có? Ví dụ User tạo nhiều đơn liên tiếp | P2 | Đủ cờ cho MVP (trùng mã giao dịch, đã bị từ chối trước) — bổ sung cờ khác khi phát sinh mẫu thực tế | người quyết |
