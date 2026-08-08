---
spec: FAQ-AND-HELP
title: Câu hỏi thường gặp và hướng dẫn
area: public
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Nội dung FAQ và trang hướng dẫn
depends_on:
  - SEO-AND-STRUCTURED-DATA
---

# Câu hỏi thường gặp và hướng dẫn

## 1. Objective

Giảm ca hỗ trợ và **trả lời câu hỏi chặn quyết định mua** ngay tại chỗ.

Đây cũng là nội dung SEO tốt: phụ huynh tìm "trẻ 4 tuổi nên chơi game bao lâu" không tìm
tên sản phẩm.

## 2. Actors

Guest · User.

## 3. Entry points

`/faq` · `/huong-dan` · khối FAQ trên trang chủ và trang giá.

## 4. Main flow

1. Nhóm câu hỏi theo chủ đề §7.1.
2. Mỗi câu là một accordion, **mở được trực tiếp bằng URL neo**.
3. Sinh schema `FAQPage`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Không tìm thấy câu trả lời | Link tới `/lien-he` |
| Câu hỏi liên quan chính sách | Link tới trang pháp lý, không copy nội dung |
| User đã đăng nhập | Hiện thêm nhóm câu hỏi về tài khoản |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-FAQ-01` | Mỗi câu có **URL neo riêng** | Hỗ trợ gửi được link chính xác |
| `BR-FAQ-02` | Câu trả lời liên quan pháp lý **link tới** trang chính sách, không copy | Copy sẽ drift khỏi văn bản có hiệu lực |
| `BR-FAQ-03` | Schema `FAQPage` sinh từ dữ liệu | |
| `BR-FAQ-04` | Nội dung sửa qua [`seo-content-admin.md`](../06-admin/seo-content-admin.md), không hardcode | |
| `BR-FAQ-05` | Trả lời **thẳng câu hỏi ở câu đầu**, chi tiết sau | Người đọc FAQ đang vội |
| `BR-FAQ-06` | Cấm — **NEVER né câu hỏi khó** — nói thẳng giới hạn của sản phẩm | Né tránh làm mất niềm tin hơn là thừa nhận |

## 7. Data

### 7.1 Năm nhóm

| Nhóm | Câu hỏi mẫu |
|---|---|
| **Về sản phẩm** | Dành cho bé mấy tuổi? · Bé cần biết chữ chưa? · Chơi bao lâu mỗi ngày là hợp lý? |
| **Về nội dung** | Chương trình dựa trên cơ sở nào? · Ai biên soạn? · Bao lâu có nội dung mới? |
| **Về tài khoản** | Một tài khoản mấy bé? · Bé có tài khoản riêng không? · Đổi bé đang chơi thế nào? |
| **Về thanh toán** | Thanh toán thế nào? · Bao lâu được xác nhận? · Hết hạn thì mất dữ liệu không? · Có hoàn tiền không? |
| **Về quyền riêng tư** | Thu thập gì của bé? · Có quảng cáo không? · Xoá dữ liệu thế nào? |

### 7.2 Câu khó phải trả lời thẳng

| Câu hỏi | Nguyên tắc trả lời |
|---|---|
| "Chơi có giúp bé thông minh hơn không?" | Nói rõ sản phẩm **rèn luyện tư duy qua hoạt động có cấu trúc**, không hứa tăng trí thông minh |
| "Báo cáo có đánh giá được bé không?" | Nói rõ báo cáo phản ánh **hoạt động trong ứng dụng**, không phải đánh giá phát triển |
| "Vì sao phải chuyển khoản tay?" | Nói thẳng: chưa tích hợp cổng thanh toán, xác nhận trong 12 giờ làm việc |
| "Dữ liệu bé có an toàn không?" | Nêu cụ thể thu gì, không thu gì, link chính sách |

## 8. API contract

Prerender tĩnh. Nội dung từ `seo_pages` với `page_type = 'faq'`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-FAQ-01 — mỗi câu có URL neo
  When mở /faq và bấm một câu hỏi
  Then URL chứa neo của câu đó
  And mở URL đó trực tiếp thì câu đã bung sẵn

Scenario: BR-FAQ-03 — schema FAQPage hợp lệ
  When kiểm JSON-LD của /faq
  Then có FAQPage với đủ cặp câu hỏi và trả lời

Scenario: BR-FAQ-02 — không copy nội dung pháp lý
  When đọc câu trả lời về quyền riêng tư
  Then có link tới trang chính sách
  And không copy nguyên đoạn chính sách

Scenario: BR-FAQ-06 — trả lời thẳng câu khó
  When đọc câu về "giúp bé thông minh hơn"
  Then câu trả lời không hứa hẹn kết quả
  And nói rõ sản phẩm làm gì

Scenario: BR-FAQ-04 — sửa được không cần deploy
  Given manager sửa một câu FAQ và publish
  Then nội dung mới hiện trên /faq mà không deploy
```

## 10. Boundaries

**Always**
- URL neo mỗi câu.
- Link tới chính sách thay vì copy.
- Trả lời thẳng ở câu đầu.

**Ask first**
- Thêm nhóm câu hỏi.

**Never**
- Copy nội dung pháp lý.
- Né câu hỏi khó.
- Hardcode nội dung FAQ.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có kênh hỗ trợ trực tiếp không (email, Zalo)? Cần cho câu "không tìm thấy câu trả lời" | Go-live |
