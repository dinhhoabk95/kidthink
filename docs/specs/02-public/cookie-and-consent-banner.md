---
spec: COOKIE-AND-CONSENT-BANNER
title: Cookie và banner đồng ý
area: public
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-13
owns:
  - Danh sách cookie sử dụng
  - Hành vi banner đồng ý
depends_on:
  - CHILD-DATA-COMPLIANCE
  - LEGAL-PAGES
---

# Cookie và banner đồng ý

## 1. Objective

Sản phẩm này dùng **rất ít cookie**, và không cookie nào phục vụ quảng cáo hay theo dõi
bên thứ ba. Đó là lựa chọn thiết kế, không phải hệ quả kỹ thuật.

Vì vậy banner ở đây **đơn giản** — nó thông báo, không thương lượng, vì không có cookie
tuỳ chọn nào để bật tắt.

## 2. Actors

Guest · User.

## 3. Entry points

Banner ở lần truy cập đầu · `/cookie`.

## 4. Main flow

1. Lần đầu vào site → banner mỏng ở chân trang.
2. Nội dung: một câu nói dùng cookie **kỹ thuật thiết yếu**, link chính sách, nút "Đã hiểu".
3. Bấm → lưu localStorage, không hiện lại 12 tháng.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Cấm bấm gì | Banner vẫn hiện, **không chặn** nội dung |
| Bề mặt trẻ `/play/**` | Cấm — **NEVER hiện banner** — trẻ không cho đồng ý được |
| Xoá localStorage | Hiện lại |
| Thêm cookie không thiết yếu trong tương lai | Cần cơ chế đồng ý thật, không dùng banner này |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CKB-01` | Chỉ dùng cookie **kỹ thuật thiết yếu** ở MVP | Cấm quảng cáo, không theo dõi bên thứ ba |
| `BR-CKB-02` | Banner Cấm — **NEVER chặn nội dung** — không modal toàn màn hình | Chặn nội dung để ép đồng ý là ép buộc |
| `BR-CKB-03` | Cấm — **NEVER hiện banner trên bề mặt trẻ** | Trẻ không cho đồng ý được |
| `BR-CKB-04` | Cấm — **NEVER cookie bên thứ ba** | `BR-CDC-08` |
| `BR-CKB-05` | Trang `/cookie` liệt kê **từng cookie**: tên, mục đích, thời hạn | Minh bạch cụ thể hơn tuyên bố chung |
| `BR-CKB-06` | Thêm cookie không thiết yếu → **cần đồng ý thật**, không dùng banner thông báo | Tuân thủ quy định pháp lý privacy (GDPR / ePrivacy) và bảo vệ sự riêng tư của người dùng |
| `BR-CKB-07` | Banner không hiện lại **12 tháng** sau khi đóng | Tránh gây phiền hà cho người dùng trong các lần truy cập tiếp theo |

## 7. Data

### 7.1 Danh sách cookie — đầy đủ

| Cookie | Mục đích | Thời hạn | Thiết yếu |
|---|---|---|:--:|
| `kidthink-user-session` | Opaque session User | 1 giờ | |
| `tm_u_remember` | Ghi nhớ User khi chủ động chọn | tối đa 1 năm | |
| `tm_u_csrf` | Chống CSRF | 1 giờ hoặc theo remember | |
| `kidthink-manager-session` · `tm_m_remember` · `tm_m_csrf` | Tương ứng cho quản trị | tối đa 1 năm | |
| `active_child_id` | Ghi nhớ bé đang chơi | 30 ngày | |
| `tm_did` | Định danh thiết bị cho khách chơi thử | 1 năm | |

**Sáu nhóm. Không có cookie nào khác.** Thêm cookie = cập nhật bảng này **trước**.

### 7.2 localStorage / IndexedDB

| Khoá | Mục đích |
|---|---|
| `cookie_notice_ack` | Đã đóng banner |
| `parent_gate_trusted_until` | Cửa sổ tin cậy Parent Gate |
| `emoji_recent` | 12 emoji gần đây (admin) |
| `pending_events` | Buffer event offline |

Không phải cookie, nhưng liệt kê ở `/cookie` vì người dùng không phân biệt.

### 7.3 Nội dung banner

> Chúng tôi chỉ dùng cookie cần thiết để đăng nhập và ghi nhớ bé đang chơi. Chúng tôi không
> dùng cookie quảng cáo hay theo dõi. [Tìm hiểu thêm] [Đã hiểu]

## 8. API contract

Không có. Hoàn toàn client-side.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CKB-04 — không cookie bên thứ ba
  When duyệt mọi trang public
  Then không cookie nào có domain khác domain chính

Scenario: BR-CKB-03 — không banner trên bề mặt trẻ
  When mở /play
  Then không có banner cookie

Scenario: BR-CKB-02 — banner không chặn nội dung
  When mở trang chủ lần đầu
  Then nội dung đọc được ngay
  And banner chỉ chiếm dải mỏng ở chân trang

Scenario: BR-CKB-05 — trang cookie liệt kê đầy đủ
  When so danh sách trên /cookie với cookie thực tế trình duyệt nhận
  Then hai danh sách khớp

Scenario: BR-CKB-07 — không hiện lại sau khi đóng
  Given đã bấm "Đã hiểu"
  When quay lại site
  Then banner không hiện

Scenario: BR-CKB-01 — chỉ cookie thiết yếu
  When kiểm mọi cookie được đặt
  Then mỗi cookie có trong bảng §7.1
```

## 10. Boundaries

**Always**
- Chỉ cookie kỹ thuật thiết yếu.
- Liệt kê đầy đủ ở `/cookie`.
- Banner mỏng, không chặn.

**Ask first**
- Thêm bất kỳ cookie nào.
- Thêm công cụ đo lường.

**Never**
- Cookie bên thứ ba.
- Banner trên bề mặt trẻ.
- Modal chặn nội dung.
- Thêm cookie không thiết yếu mà không có cơ chế đồng ý thật.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Analytics tự host có cần thêm cookie không?~~ **Đóng 2026-08-09 (T13, `D-AW`)**: P1 không dùng analytics tự host, không phát sinh thêm cookie — khớp [`landing-page.md`](landing-page.md) Q1 | Cookie analytics | Đã đóng | D-AW |
