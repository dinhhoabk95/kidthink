---
spec: SEO-CONTENT-ADMIN
title: Quản lý nội dung SEO
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-14
owns:
  - Soạn nội dung trang SEO
  - Ràng buộc meta và structured data
depends_on:
  - SEO-AND-STRUCTURED-DATA
  - CONTENT-LIFECYCLE
---

# Quản lý nội dung SEO

## 1. Objective

Landing page theo competency, theo skill, theo độ tuổi là kênh acquisition chính. Chúng phải
sửa được **không cần deploy**.

Đây là loại nội dung Lớp 2 duy nhất nhắm tới **người lớn tìm kiếm**, không nhắm tới trẻ.

## 2. Actors

`content_reviewer` · `super_admin`.

## 3. Entry points

`/studio/seo` · `/studio/seo/{slug}/{version}`.

## 4. Main flow

1. Chọn loại trang: `competency` · `skill` · `age_program` · `topic` · `static`.
2. Điền: `slug` · `title` · `meta_description` · nội dung (rich text hạn chế) ·
   `og_image` · structured data.
3. Chọn nội dung liên quan để nhúng (level, lesson, curriculum) — nhúng **tham chiếu**,
   không copy.
4. Preview cả desktop và mobile + preview kết quả tìm kiếm.
5. Gửi duyệt → publish.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| `slug` trùng | 409 |
| Đổi `slug` của trang đã published | Tạo redirect 301 tự động từ slug cũ |
| Nội dung nhúng bị archive | Trang vẫn render, ẩn mục đó, cảnh báo trong admin |
| `meta_description` quá dài | Cảnh báo, không chặn |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SEO-01` | Đổi `slug` đã published **tự tạo 301** | Link chia sẻ và thứ hạng tìm kiếm không được chết |
| `BR-SEO-02` | Rich text **hạn chế** — chỉ heading, đoạn, danh sách, link, ảnh. Cấm HTML tự do | HTML tự do là đường XSS và là đường phá vỡ design system |
| `BR-SEO-03` | Nội dung nhúng là **tham chiếu**, không copy | Copy sẽ drift khi nội dung gốc đổi |
| `BR-SEO-04` | Cấm — **NEVER tracking script bên thứ ba** trên trang pháp lý | `BR-CDC-08` |
| `BR-SEO-05` | `title` ≤60 ký tự, `meta_description` ≤160 — cảnh báo khi vượt | Đảm bảo hiển thị tối ưu trên thẻ kết quả tìm kiếm của Google mà không bị cắt tỉa bớt nội dung |
| `BR-SEO-06` | Structured data sinh **từ dữ liệu**, không gõ tay JSON-LD | JSON-LD gõ tay sẽ lệch khỏi nội dung thật |
| `BR-SEO-07` | Trang SEO đi qua cùng vòng đời duyệt như nội dung khác | Kiểm soát chất lượng nội dung công khai và ngăn ngừa thông tin không chính xác hoặc vi phạm quy định |
| `BR-SEO-08` | Cấm — **NEVER nội dung nhắm tới trẻ** trên trang SEO | Trang SEO là bề mặt người lớn |
| `BR-SEO-09` | `/terms`, `/privacy`, `/child-privacy` và mọi tài liệu pháp lý cấm nằm trong `seo_pages` hay editor này | Legal document là singleton code-owned cần diff PR và legal review; editor runtime sẽ tạo một nguồn contract thứ hai |

## 7. Data

### 7.1 Trường

`slug` · `page_type` · `title` · `meta_description` · `h1` · `body` (rich text hạn chế) ·
`og_image_path` · `canonical_url` · `noindex` · `related_content_refs[]` ·
`faq_items[]` (câu hỏi + trả lời, sinh FAQPage schema) · `access_tier` = luôn `free` ·
`status` · `content_version`.

`page_type='static'` chỉ dành cho trang marketing tĩnh. Danh sách slug legal thuộc
[`legal-pages.md`](../02-public/legal-pages.md) bị schema/handler từ chối, không chỉ ẩn khỏi UI.

### 7.2 Structured data sinh tự động

| Loại trang | Schema |
|---|---|
| `competency` · `skill` | `Course` + `BreadcrumbList` |
| `age_program` | `Course` |
| `topic` | `Article` |
| Có FAQ | + `FAQPage` |
| Toàn site | `Organization` · `WebSite` |

### 7.3 Preview

Desktop · mobile · **snippet kết quả tìm kiếm** (title + URL + description ở độ dài thật).

## 8. API contract

### `POST /api/managers/seo-pages` · `PATCH .../{slug}/{version}`

409 `CODE_ALREADY_EXISTS` khi trùng slug. 422 khi rich text chứa thẻ ngoài allow-list.

### `GET /api/managers/seo-pages/{slug}/preview`

Trả HTML render kèm structured data đã sinh.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SEO-01 — đổi slug tạo 301
  Given trang published có slug "tu-duy-toan-hoc"
  When đổi slug thành "tu-duy-so-hoc" và publish
  Then truy cập slug cũ trả 301 tới slug mới

Scenario: BR-SEO-02 — HTML tự do bị chặn
  When lưu body chứa thẻ script
  Then trả 422
  And thẻ bị loại

Scenario: BR-SEO-03 — nội dung nhúng là tham chiếu
  Given trang nhúng một game level
  When level đó đổi tiêu đề và publish version mới
  Then trang SEO hiện tiêu đề mới mà không sửa gì

Scenario: BR-SEO-06 — structured data sinh từ dữ liệu
  When quét form soạn trang
  Then không có ô nhập JSON-LD thô

Scenario: BR-SEO-04 — không tracking trên trang pháp lý
  When render trang chính sách
  Then không request tới domain bên thứ ba

Scenario: BR-SEO-05 — cảnh báo độ dài
  When title dài 90 ký tự
  Then hiện cảnh báo
  And vẫn lưu được

Scenario: BR-SEO-09 — editor không nhận slug pháp lý
  When manager tạo seo_page với slug privacy
  Then trả 422
  And không tạo record

Scenario: preview snippet đúng độ dài thật
  When mở preview
  Then snippet cắt title và description ở đúng ngưỡng hiển thị
```

## 10. Boundaries

**Always**
- 301 khi đổi slug đã published.
- Rich text hạn chế theo allow-list.
- Sinh structured data từ dữ liệu.

**Ask first**
- Thêm loại trang.
- Thêm thẻ vào allow-list rich text.

**Never**
- HTML tự do.
- Copy nội dung thay vì tham chiếu.
- Tracking bên thứ ba trên trang pháp lý.
- Nội dung nhắm tới trẻ trên trang SEO.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Bao nhiêu trang SEO ở MVP? 6 competency + 41 strand là 47 trang cần nội dung | P2 | MVP có 6 trang competency + 1 trang chủ (tổng 7 trang); 41 trang strand hoãn sang P4 | người quyết |
| 2 | Có dùng AI agent IDE soạn mô tả SEO thành seeder không? Nếu có thì vẫn qua PR review | P2 | Có — cho phép dùng AI soạn file seeder trong repo theo quy trình [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | người quyết |
