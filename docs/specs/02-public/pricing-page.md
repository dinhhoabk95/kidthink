---
spec: PRICING-PAGE
title: Trang giá
area: public
status: approved
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Trình bày gói và giá cho khách
depends_on:
  - PACKAGE-CATALOG
  - PAYMENT-ORDER-CREATE
---

# Trang giá

## 1. Objective

Trả lời **"tôi trả bao nhiêu và được gì"** không mơ hồ, và không gây bất ngờ ở bước
thanh toán.

Sản phẩm cho trẻ em bán bằng **niềm tin**. Giá mập mờ phá niềm tin nhanh hơn giá cao.

## 2. Actors

Guest · User.

## 3. Entry points

`/bang-gia` · từ trang chủ · từ mọi CTA nâng cấp.

## 4. Main flow

1. Bảng so sánh: **Miễn phí** · Tiêu chuẩn · Premium.
2. Mỗi cột: giá, chu kỳ, danh sách quyền lợi **sinh từ dữ liệu**.
3. CTA theo trạng thái: đăng ký · mua · "gói hiện tại của bạn".
4. Dưới bảng: câu hỏi thường gặp về thanh toán.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| User đã có gói | Cột đó đánh dấu "gói hiện tại", CTA thành "gia hạn" |
| User có premium | Cột standard hiện "đã bao gồm" |
| Add-on chưa bán | Cấm xuất hiện |
| Giá đổi | Trang tự cập nhật từ catalog sau deploy |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PRC-01` | Giá và quyền lợi **sinh từ `PACKAGE_CATALOG` + `package_entitlements`** | `BR-PKG-06` |
| `BR-PRC-02` | Cột **Miễn phí** hiện rõ, không giấu | Miễn phí là lối vào, không phải thứ phải che |
| `BR-PRC-03` | Nói rõ **thanh toán chuyển khoản + duyệt tay**, và thời gian dự kiến | Bất ngờ ở bước thanh toán là nơi mất khách |
| `BR-PRC-04` | Nói rõ **dữ liệu không mất** khi hết hạn | `BR-SBV-02` |
| `BR-PRC-05` | Cấm — **NEVER đếm ngược giả hay "chỉ còn X suất"** | Sản phẩm cho trẻ em bán bằng niềm tin |
| `BR-PRC-06` | Add-on chưa bán **không xuất hiện** | `BR-PKG-05` |
| `BR-PRC-07` | Nêu rõ **không tự động gia hạn** | Không có cổng thanh toán tự động; kỳ vọng sai tạo khiếu nại |
| `BR-PRC-08` | Structured data `Product` + `Offer` từ dữ liệu | Tối ưu SEO và khai báo giá chính thức cho các máy tìm kiếm theo chuẩn Schema.org |

## 7. Data

### 7.1 Bảng so sánh

| Dòng | Miễn phí | Tiêu chuẩn | Premium |
|---|---|---|---|
| Giá | 0 | từ catalog | từ catalog |
| Số hồ sơ bé | 1 | 3 | 5 |
| Trò chơi | 6 game mẫu | thư viện Tiêu chuẩn | toàn bộ |
| Lưu tiến độ | Cấm | | |
| Báo cáo cơ bản | Cấm | | |
| Báo cáo nâng cao | Cấm | | |
| Chương trình đặc biệt | Cấm | Cấm | |
| Phút chơi mỗi ngày | 30 | 60 | 90 |

Mọi ô sinh từ dữ liệu, không viết tay.

### 7.2 Ba câu phải có dưới bảng

- "Thanh toán bằng chuyển khoản ngân hàng. Chúng tôi xác nhận trong vòng 12 giờ làm việc, và
  bạn dùng được ngay trong lúc chờ."
- "Gói **không tự động gia hạn**. Bạn chủ động mua lại khi hết hạn."
- "Khi hết hạn, hồ sơ và tiến độ học của bé vẫn được giữ nguyên."

## 8. API contract

`GET /api/guest/packages` — xem [`package-catalog.md`](../00-foundation/package-catalog.md) §8.
Trang prerender, revalidate khi catalog đổi.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PRC-01 — quyền lợi sinh từ dữ liệu
  When so bảng giá với package_entitlements trong DB
  Then hai bên khớp hoàn toàn

Scenario: BR-PRC-05 — không có đếm ngược giả
  When đọc toàn bộ trang
  Then không có đồng hồ đếm ngược hay thông báo khan hiếm

Scenario: BR-PRC-06 — add-on không hiện
  When mở trang giá
  Then chỉ có 3 cột: miễn phí, tiêu chuẩn, premium

Scenario: BR-PRC-03 — nói rõ duyệt tay
  When mở trang giá
  Then có câu nêu thanh toán chuyển khoản và thời gian xác nhận

Scenario: BR-PRC-07 — nói rõ không tự gia hạn
  When mở trang giá
  Then có câu khẳng định gói không tự động gia hạn

Scenario: BR-PRC-04 — nói rõ dữ liệu không mất
  When mở trang giá
  Then có câu khẳng định dữ liệu bé được giữ khi hết hạn

Scenario: user đã có gói thì đánh dấu
  Given user có gói standard
  When mở trang giá
  Then cột Tiêu chuẩn đánh dấu là gói hiện tại
```

## 10. Boundaries

**Always**
- Sinh giá và quyền lợi từ dữ liệu.
- Nêu rõ duyệt tay, không tự gia hạn, dữ liệu không mất.

**Ask first**
- Thêm cột hoặc dòng vào bảng.
- Thêm khuyến mãi.

**Never**
- Viết tay quyền lợi.
- Đếm ngược giả hay khan hiếm giả.
- Hiện add-on chưa bán.
- Giấu gói miễn phí.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | **Giá cuối** — chặn phát hành trang này | P2 | Giữ mở — giá trị cấu hình constant trong `PACKAGE_CATALOG`; trỏ sang [`package-catalog.md`](../00-foundation/package-catalog.md) Q1 | người quyết |
| 2 | Có gói dùng thử có thời hạn không, hay chỉ tier miễn phí vĩnh viễn? | P2 | Tier miễn phí vĩnh viễn với quyền lợi giới hạn cho MVP; đánh giá gói dùng thử ở P3 | người quyết |
