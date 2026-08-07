---
spec: MEMBER-DASHBOARD
title: Trang chính của người dùng
area: account
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Nội dung trang /me
  - Thứ tự ưu tiên thông tin
depends_on:
  - CHILD-PROFILE-CRUD
  - BASIC-REPORT
  - ENTITLEMENT-MODEL
---

# Trang chính của người dùng

## 1. Objective

Trang đầu tiên sau đăng nhập. Trả lời ba câu trong một lần nhìn: **con tôi đang thế nào**,
**tôi chơi tiếp thế nào**, **gói của tôi ra sao**.

Đây là bề mặt người lớn — nó có thể dày chữ, có dark mode, và có thông tin thương mại.

## 2. Actors

User đã đăng nhập. ❌ Trẻ không thấy trang này.

## 3. Entry points

`/me` · `GET /api/users/dashboard`.

## 4. Main flow

1. Đăng nhập → `/me`.
2. Hiện năm khối §7.1 theo thứ tự ưu tiên.
3. Chọn một trẻ → vào khu vực chơi (đặt `active_child_id`).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chưa xác thực email | Banner nhắc trên cùng |
| Chưa có hồ sơ trẻ | Khối đầu tiên là CTA tạo hồ sơ, ẩn các khối khác |
| Gói sắp hết hạn (<7 ngày) | Banner nhắc, ❌ không chặn |
| Gói đã hết hạn | Banner + nội dung trả phí hiện dạng khoá |
| Có đơn thanh toán chờ | Khối trạng thái đơn hiện trên cùng |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MDB-01` | Chưa có hồ sơ trẻ → **chỉ** hiện CTA tạo hồ sơ | Trang đầy widget rỗng làm người mới bối rối |
| `BR-MDB-02` | Vào khu vực chơi **phải chọn trẻ** trước | `BR-PEN-02` |
| `BR-MDB-03` | Thông tin thương mại được phép ở đây, ❌ **NEVER trên bề mặt trẻ** | `BR-PEN-04` |
| `BR-MDB-04` | Đọc từ **rollup**, ❌ không quét event thô | |
| `BR-MDB-05` | Hiện quota còn lại khi **gần hết** (>80%), ❌ không phải lúc nào | Hiện thường trực tạo cảm giác bị giới hạn |
| `BR-MDB-06` | ❌ **NEVER so sánh giữa các trẻ** trong cùng tài khoản | `BR-PRG-05` |
| `BR-MDB-07` | Nhắc nâng cấp tối đa **một chỗ** mỗi trang | Nhiều lời mời cùng lúc đọc thành ép mua |

## 7. Data

### 7.1 Năm khối, theo thứ tự

| # | Khối | Nội dung |
|---|---|---|
| 1 | **Việc cần xử lý** | Xác thực email · đơn thanh toán chờ · gói sắp hết hạn. Ẩn khi không có |
| 2 | **Các bé** | Thẻ mỗi trẻ: avatar, tên, hoạt động 7 ngày, nút "Cho bé chơi" |
| 3 | **Tiến độ gần đây** | Mỗi trẻ một dòng tóm tắt + link báo cáo |
| 4 | **Chương trình đang học** | Curriculum + tuần hiện tại + tiến độ. Ẩn nếu chưa ghi danh |
| 5 | **Gói của bạn** | Gói hiện tại, ngày hết hạn, quota gần hết, một CTA nâng cấp |

### 7.2 Thẻ trẻ

Avatar · tên · band tuổi · số ngày chơi trong 7 ngày · level gần nhất ·
nút **"Cho bé chơi"** (đặt `active_child_id` rồi chuyển `/play`).

❌ Không hiện điểm số, ❌ không hiện xếp hạng giữa các trẻ.

## 8. API contract

### `GET /api/users/dashboard`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| 200 | `{ todo: [...], children: [...], recent_progress: [...], curriculum: {...}, subscription: {...} }` |

Khối rỗng trả mảng rỗng, client tự ẩn.

## 9. Acceptance criteria

```gherkin
Scenario: BR-MDB-01 — người mới chỉ thấy CTA
  Given user vừa xác thực email, chưa có hồ sơ trẻ
  When mở /me
  Then chỉ hiện CTA tạo hồ sơ bé
  And không hiện khối tiến độ hay chương trình

Scenario: BR-MDB-02 — chọn trẻ trước khi chơi
  When bấm "Cho bé chơi" trên thẻ một trẻ
  Then active_child_id được đặt
  And chuyển tới /play

Scenario: BR-MDB-06 — không so sánh giữa trẻ
  Given tài khoản có 3 trẻ
  When mở /me
  Then không có xếp hạng hay so sánh nào giữa ba trẻ

Scenario: BR-MDB-05 — quota chỉ hiện khi gần hết
  Given user dùng 50% quota hồ sơ trẻ
  Then không hiện chỉ báo quota
  Given user dùng 90%
  Then hiện chỉ báo

Scenario: BR-MDB-07 — một CTA nâng cấp
  When mở /me
  Then có tối đa một lời mời nâng cấp

Scenario: đơn chờ hiện trên cùng
  Given user có đơn thanh toán ở trạng thái submitted
  When mở /me
  Then khối việc cần xử lý hiện đầu tiên với trạng thái đơn

Scenario: BR-MDB-04 — không quét event thô
  When đọc truy vấn phục vụ dashboard
  Then không truy vấn nào SELECT từ telemetry_events
```

## 10. Boundaries

**Always**
- Ẩn khối rỗng.
- Chọn trẻ trước khi vào khu vực chơi.
- Đọc từ rollup.

**Ask first**
- Thêm khối vào dashboard.
- Đổi thứ tự khối.

**Never**
- Hiện widget rỗng cho người mới.
- So sánh giữa các trẻ.
- Quá một CTA nâng cấp mỗi trang.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Tài khoản nhiều trẻ (giáo viên) cần bố cục khác không? 5 thẻ trẻ đã chật | P3 |
