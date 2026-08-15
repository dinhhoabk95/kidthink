---
spec: ERROR-LOG-VIEWER
title: Xem nhật ký lỗi
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Bề mặt tra cứu lỗi server và client
depends_on:
  - MONITORING-AND-ALERTING
  - ADMIN-AUTH
---

# Xem nhật ký lỗi

## 1. Objective

Lỗi trên tablet của người dùng không thấy được từ server. Màn hình này gom cả hai nguồn để
trả lời **"cái gì đang hỏng và với bao nhiêu người"**.

## 2. Actors

`super_admin` duy nhất.

## 3. Entry points

`/errors` · `GET /api/managers/error-logs` · `POST /api/guest/client-errors` (nhận từ client).

## 4. Main flow

1. Client gặp lỗi → gửi báo cáo rút gọn, có sampling.
2. Server ghi `error_log` với `source = 'client'`.
3. Manager mở `/errors`, thấy lỗi **gom nhóm theo dấu vân tay**, không phải danh sách phẳng.
4. Mở một nhóm → số lần, số người ảnh hưởng, mẫu ngữ cảnh.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Cùng lỗi lặp nghìn lần | Gom một nhóm, đếm |
| Lỗi từ một client lỗi thời | Gắn nhãn phiên bản, không alert |
| Lỗi chứa dữ liệu nhạy cảm | Bị strip ở tầng nhận — `BR-ELV-03` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ELV-01` | Gom nhóm theo **dấu vân tay** (code + route + stack rút gọn) | Danh sách phẳng 10.000 hàng không đọc được |
| `BR-ELV-02` | Đếm **số người ảnh hưởng**, không chỉ số lần | Một lỗi 1.000 lần với 1 người khác một lỗi 1.000 lần với 1.000 người |
| `BR-ELV-03` | Cấm — **NEVER PII trong `error_log`** — strip ở tầng nhận | `BR-MON-05` |
| `BR-ELV-04` | Client error có **sampling**, không nhận toàn bộ | Một lỗi vòng lặp sẽ tự DDoS endpoint nhận |
| `BR-ELV-05` | Endpoint nhận lỗi client có **rate limit** riêng | Ngăn ngừa nguy cơ bị tấn công từ chối dịch vụ (DDoS) hoặc cạn kiệt tài nguyên lưu trữ log |
| `BR-ELV-06` | Chỉ `super_admin` | Giới hạn quyền tiếp cận thông tin nhạy cảm của hệ thống cho đúng vai trò quản trị tối cao |
| `BR-ELV-07` | Nhóm lỗi đánh dấu **đã xử lý** được, kèm ghi chú | Không thì mọi lỗi cũ lẫn với lỗi mới |

## 7. Data

### 7.1 `error_log`

`id` · `source` (`server`\|`client`) · `level` · `code` · `message` · `fingerprint` ·
`context` JSONB (route, phiên bản app, loại thiết bị) · `request_id` · `user_id` (nullable,
không `child_uuid`) · `created_at`.

### 7.2 Nhóm

`fingerprint` · lần đầu · lần cuối · số lần · **số người ảnh hưởng** · trạng thái
(`open`\|`ack`\|`resolved`) · ghi chú.

### 7.3 Sampling client

| Loại | Tỉ lệ |
|---|---|
| Lỗi tải asset | 10% |
| Lỗi engine | 100% |
| Lỗi mạng | 5% |
| Lỗi chưa phân loại | 50% |

## 8. API contract

### `GET /api/managers/error-logs`

Query `source` `level` `status` `from` `to` `q`. Trần 100. Trả nhóm, không trả hàng lẻ.

### `POST /api/guest/client-errors`

Body `{ code, message, fingerprint, context }`. Rate limit 10/phút/IP. **Strip** mọi field
không có trong allow-list.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ELV-01 — gom nhóm theo fingerprint
  Given 500 lỗi cùng fingerprint
  When mở /errors
  Then hiện một nhóm với số lần 500

Scenario: BR-ELV-02 — đếm người ảnh hưởng
  Given một nhóm lỗi từ 3 user khác nhau
  Then nhóm hiện 3 người ảnh hưởng

Scenario: BR-ELV-03 — PII bị strip
  When client gửi lỗi kèm display_name của trẻ
  Then hàng error_log không chứa field đó

Scenario: BR-ELV-04 — sampling hoạt động
  Given 1000 lỗi tải asset từ một client
  Then số hàng ghi xấp xỉ 100

Scenario: BR-ELV-05 — rate limit endpoint nhận lỗi
  When gửi 100 báo cáo lỗi trong 1 phút từ một IP
  Then phần vượt bị 429

Scenario: BR-ELV-07 — đánh dấu đã xử lý
  When đánh dấu một nhóm là resolved
  Then nhóm đó không hiện ở bộ lọc mặc định
  And lỗi mới cùng fingerprint mở lại nhóm
```

## 10. Boundaries

**Always**
- Gom nhóm, đếm người ảnh hưởng.
- Strip PII ở tầng nhận.
- Sampling và rate limit cho lỗi client.

**Ask first**
- Đổi tỉ lệ sampling.
- Thêm field vào allow-list context.

**Never**
- PII trong `error_log`.
- Nhận toàn bộ lỗi client không sampling.
- Danh sách phẳng không gom nhóm.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Dùng Sentry hay tự xây?~~ **Đóng 2026-08-09 (D-CD, T15)**: câu hỏi sai tiền đề — `@sentry/nuxt` đã là SDK baseline từ P0 ([`repo-bootstrap.md`](../00-foundation/repo-bootstrap.md) §7.1, [`monitoring-and-alerting.md`](../01-platform/monitoring-and-alerting.md)), không phải lựa chọn còn mở ở P2. Câu hỏi thật: bảng `error_log` §7.1 dưới đây là **UI tiện dụng cho Manager** trong app, đọc từ cùng lỗi mà `pino`/Nitro plugin ghi — **không thay** Sentry, Sentry vẫn chạy song song cho alerting kỹ sư. Giữ nguyên thiết kế tự xây ở phần còn lại của spec | P2 | Đã đóng | D-CD |
