---
spec: PARENT-GATE
title: Cổng phụ huynh
area: play
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Cơ chế xác minh người lớn
  - Nơi bắt buộc có cổng
depends_on:
  - CHILD-DATA-COMPLIANCE
  - GAME-ENGINE-RUNTIME
---

# Cổng phụ huynh

## 1. Objective

Ngăn trẻ tự rời khu vực chơi vào bề mặt quản lý, thanh toán, hoặc cấu hình.

Đây là ràng buộc **pháp lý và sản phẩm**: `child-data-compliance` `BR-CDC-12`. Nó cũng ngăn
tình huống thực tế nhất — trẻ chạm lung tung và thoát ra giữa chừng.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Trẻ | Bị chặn |
| Người lớn | Qua cổng bằng thử thách §7.1 |

## 3. Entry points

| Nơi | Bắt buộc có cổng |
|---|---|
| Nút thoát khu vực chơi | ✅ |
| Chuyển sang `/me/**` từ `/play/**` | ✅ |
| Đổi child profile | ✅ |
| Cài đặt âm thanh, chuyển động | ❌ — trẻ tự chỉnh được |
| Bất kỳ bề mặt thanh toán nào | ✅ |

## 4. Main flow

1. Trẻ chạm nút thoát → yêu cầu **long-press 800ms** (không tap trúng được).
2. Long-press đạt → hiện thử thách §7.1.
3. Đúng → chuyển sang bề mặt người lớn, mở "cửa sổ tin cậy" 5 phút.
4. Sai → quay lại game, ❌ không thông báo tiêu cực.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Sai 3 lần | Quay lại game, khoá cổng 60 giây |
| Đang trong cửa sổ tin cậy | ❌ Không hỏi lại |
| Trẻ nhấn nút hệ thống (back trình duyệt) | Không chặn được — đó là lý do khuyến nghị PWA/chế độ toàn màn hình |
| Người lớn quên đáp án | Thử thách là phép tính đơn giản, ❌ không phải mật khẩu |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PGT-01` | Nút thoát ❌ **NEVER tap trúng được** — long-press 800ms | Trẻ chạm ngẫu nhiên rất nhiều |
| `BR-PGT-02` | Thử thách phải **ngoài tầm** trẻ 3–6 nhưng **tức thì** với người lớn | Mật khẩu làm phụ huynh bỏ cuộc; phép tính hai chữ số thì không |
| `BR-PGT-03` | Sai ❌ **NEVER thông báo tiêu cực cho trẻ** | Trẻ có thể là người thao tác |
| `BR-PGT-04` | Cửa sổ tin cậy **5 phút**, gắn với tab hiện tại | Đủ để làm việc, ❌ không đủ để trẻ tận dụng sau đó |
| `BR-PGT-05` | ❌ **NEVER hiện dữ liệu thanh toán** trong khu vực chơi, kể cả sau cổng | Khu vực chơi là bề mặt trẻ |
| `BR-PGT-06` | Cổng là **client-side UX**, ❌ **không thay guard server** | Nó ngăn tai nạn, không ngăn tấn công |
| `BR-PGT-07` | Thử thách ❌ **NEVER dùng chữ cần đọc trôi chảy** — dùng chữ số | Người lớn khiếm thị/khó đọc vẫn phải qua được |

## 7. Data

### 7.1 Thử thách

Phép nhân hai số một chữ số, kết quả hai chữ số: `7 × 8 = ?`, nhập bằng bàn phím số lớn.

Chọn cách này vì: trẻ 3–6 chưa nhân được; người lớn làm trong 2 giây; ❌ không cần đọc chữ;
❌ không cần nhớ gì.

**Không** dùng: mật khẩu tài khoản (phiền, và gõ trước mặt trẻ là rủi ro) · năm sinh
(đoán được) · giữ nút lâu (trẻ làm được) · ngày tháng hiện tại (người lớn cũng có thể sai).

### 7.2 Trạng thái

`parent_gate_trusted_until` — sessionStorage, ❌ không cookie (không cần gửi lên server).

### 7.3 Event

`parent_gate_shown { trigger }` · `parent_gate_passed { attempts }` ·
`parent_gate_failed { attempts }`.

Tỉ lệ fail cao là tín hiệu thử thách quá khó — theo dõi trong KPI.

## 8. API contract

Không có route. Hoàn toàn client-side.

Server ❌ **không** tin cổng này — mọi endbề mặt người lớn vẫn kiểm `requireUserAuth()`
(`BR-PGT-06`).

## 9. Acceptance criteria

```gherkin
Scenario: BR-PGT-01 — nút thoát không tap trúng được
  Given trẻ đang chơi
  When trẻ tap nhanh vào nút thoát
  Then không có gì xảy ra
  And chỉ long-press 800ms mới mở cổng

Scenario: BR-PGT-02 — thử thách ngoài tầm trẻ
  When cổng hiện ra
  Then thử thách là phép nhân hai số một chữ số
  And không phải giữ nút hay đếm số

Scenario: BR-PGT-03 — sai không trách trẻ
  Given nhập sai đáp án
  Then quay lại game
  And không có thông báo tiêu cực nào

Scenario: BR-PGT-04 — cửa sổ tin cậy 5 phút
  Given đã qua cổng
  When mở bề mặt người lớn lần thứ hai trong 3 phút
  Then không hỏi lại
  When mở lần nữa sau 6 phút
  Then hỏi lại

Scenario: BR-PGT-06 — cổng không thay guard server
  Given client bỏ qua cổng bằng cách sửa sessionStorage
  When gọi API bề mặt người lớn
  Then server vẫn kiểm auth bình thường

Scenario: BR-PGT-05 — không có dữ liệu thanh toán trong khu vực chơi
  When quét mọi component dưới pages/play
  Then không component nào hiện số tiền, gói, hay đơn hàng

Scenario: sai 3 lần thì khoá tạm
  Given nhập sai 3 lần liên tiếp
  Then cổng bị khoá 60 giây
  And trẻ quay lại game bình thường
```

## 10. Boundaries

**Always**
- Long-press 800ms trước khi hiện cổng.
- Thử thách bằng chữ số, ❌ không cần đọc.
- Ghi event để theo dõi tỉ lệ fail.

**Ask first**
- Đổi loại thử thách.
- Đổi độ dài cửa sổ tin cậy.
- Thêm nơi bắt buộc có cổng.

**Never**
- Nút thoát tap trúng được.
- Thông báo tiêu cực khi sai.
- Coi cổng là thay thế cho guard server.
- Hiện dữ liệu thanh toán trong khu vực chơi.
- Dùng mật khẩu tài khoản làm thử thách.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Nút back của trình duyệt không chặn được — có bắt buộc PWA toàn màn hình cho trải nghiệm trẻ không? | `pwa-install` |
| 2 | Tỉ lệ fail bao nhiêu thì coi là thử thách quá khó? | KPI P1 |
