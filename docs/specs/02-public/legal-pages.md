---
spec: LEGAL-PAGES
title: Trang pháp lý và chính sách
area: public
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Danh sách trang pháp lý bắt buộc
  - Quy tắc version hoá chính sách
depends_on:
  - CHILD-DATA-COMPLIANCE
  - CONSENT-MANAGEMENT
---

# Trang pháp lý và chính sách

## 1. Objective

Nghĩa vụ pháp lý, ❌ không phải nội dung marketing. Chúng phải **chính xác**, **có version**,
và **truy được** — vì đồng ý của User trỏ tới một version cụ thể.

> Mọi chính sách cần được **chuyên gia pháp lý tại Việt Nam rà soát** trước khi phát hành
> chính thức. Spec này định nghĩa cấu trúc và ràng buộc kỹ thuật, ❌ không thay tư vấn pháp lý.

## 2. Actors

Guest · User · cơ quan quản lý.

## 3. Entry points

`/dieu-khoan` · `/quyen-rieng-tu` · `/chinh-sach-tre-em` · `/cookie` ·
`/thanh-toan` · `/hoan-tien` · `/lien-he` · `/gioi-thieu`.

## 4. Main flow

1. Truy cập trang → nội dung version **hiện hành**.
2. Đầu trang: ngày hiệu lực + số version + link **các version trước**.
3. Có bản mới → banner cho User đã đăng nhập, dẫn tới `consent-management`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Xem version cũ | `/{slug}/v/{version}` — giữ vĩnh viễn |
| User đồng ý version cũ | `consent-management` hiện diff |
| Chưa có bản dịch | Chỉ tiếng Việt ở MVP |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LGL-01` | Mỗi chính sách có **số version và ngày hiệu lực** hiển thị | Đồng ý trỏ tới version cụ thể |
| `BR-LGL-02` | Version cũ **giữ vĩnh viễn**, truy cập được qua URL | Phải chứng minh được User đã đồng ý với văn bản nào |
| `BR-LGL-03` | ❌ **NEVER script bên thứ ba** trên trang pháp lý | Trang giải thích quyền riêng tư mà tự nó theo dõi là mâu thuẫn không giải thích được |
| `BR-LGL-04` | Chính sách trẻ em là **trang riêng**, ❌ không nhét vào privacy | Nó là nghĩa vụ riêng theo Luật Trẻ em |
| `BR-LGL-05` | Đổi version → thông báo User đã đăng nhập | `BR-CSM-03` |
| `BR-LGL-06` | Ngôn ngữ **rõ ràng**, có tóm tắt đầu mỗi mục | Chính sách không đọc được là chính sách không có |
| `BR-LGL-07` | ❌ **NEVER phát hành chính sách chưa qua rà soát pháp lý** | |
| `BR-LGL-08` | Link tới chính sách trẻ em ở **chân mọi trang** | |

## 7. Data

### 7.1 Tám trang bắt buộc

| Trang | Bắt buộc | Ghi chú |
|---|:--:|---|
| Điều khoản sử dụng | ✅ | Có version, cần đồng ý |
| Chính sách quyền riêng tư | ✅ | Có version, cần đồng ý |
| **Chính sách bảo vệ trẻ em** | ✅ | Có version, cần đồng ý riêng |
| Chính sách cookie | ✅ | Có version |
| Chính sách thanh toán | ✅ | Không cần đồng ý riêng |
| Chính sách hoàn tiền | ✅ | idem |
| Giới thiệu | ✅ | Không version |
| Liên hệ | ✅ | Không version |

### 7.2 Chính sách trẻ em phải nêu

Dữ liệu **nào** được thu (danh sách đóng `child-data-compliance` §4.1) · vì sao ·
lưu bao lâu · ai truy cập được · ❌ không chia sẻ với bên thứ ba · quyền của phụ huynh
(xem, sửa, xoá, rút đồng ý) · cách thực hiện từng quyền · liên hệ.

### 7.3 Version

`seo_pages` với `page_type = 'legal'`, `content_version`, `effective_from`.
Version cũ `archived` nhưng **truy cập được** — ngoại lệ có chủ ý so với
`content-lifecycle` §5.

## 8. API contract

Trang tĩnh prerender. `GET /api/guest/legal/{slug}` trả nội dung + version hiện hành.
`GET /api/guest/legal/{slug}/versions` trả lịch sử.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LGL-01 — hiện version và ngày hiệu lực
  When mở bất kỳ trang chính sách nào
  Then đầu trang có số version và ngày hiệu lực

Scenario: BR-LGL-02 — version cũ truy cập được
  Given chính sách đã lên version 3
  When mở /quyen-rieng-tu/v/1
  Then nội dung version 1 hiển thị đầy đủ

Scenario: BR-LGL-03 — không script bên thứ ba
  When mở mọi trang pháp lý
  Then không request tới domain bên thứ ba

Scenario: BR-LGL-04 — chính sách trẻ em là trang riêng
  When mở /chinh-sach-tre-em
  Then trang tồn tại và có version riêng

Scenario: BR-LGL-05 — thông báo khi đổi version
  Given chính sách quyền riêng tư lên version mới
  When user đã đăng nhập mở bất kỳ trang nào
  Then hiện banner yêu cầu xem lại

Scenario: BR-LGL-08 — link ở chân mọi trang
  When kiểm chân trang của mọi trang public
  Then có link tới chính sách trẻ em

Scenario: chính sách trẻ em nêu đủ mục bắt buộc
  When đọc trang chính sách trẻ em
  Then có đủ 8 mục ở §7.2
```

## 10. Boundaries

**Always**
- Hiện version và ngày hiệu lực.
- Giữ version cũ truy cập được.
- Link chính sách trẻ em ở chân mọi trang.

**Ask first**
- Sửa bất kỳ nội dung pháp lý nào.
- Thêm hoặc bỏ một trang.

**Never**
- Script bên thứ ba trên trang pháp lý.
- Xoá version cũ.
- Phát hành chính sách chưa qua rà soát pháp lý.
- Gộp chính sách trẻ em vào privacy.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | **Ngân sách và đơn vị rà soát pháp lý?** Đây là điều kiện go-live | Go-live |
| 2 | Có cần đăng ký hồ sơ đánh giá tác động (DPIA) với cơ quan quản lý không? | `child-data-compliance` Q2 |
| 3 | Chính sách hoàn tiền chưa có nội dung — chính sách thương mại là gì? | `payment-approval` Q1 |
