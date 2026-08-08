---
spec: SEO-AND-STRUCTURED-DATA
title: SEO kỹ thuật và dữ liệu có cấu trúc
area: public
status: approved
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Meta tag, sitemap, robots, canonical
  - Schema JSON-LD toàn site
depends_on: []
---

# SEO kỹ thuật và dữ liệu có cấu trúc

## 1. Objective

Tìm kiếm tự nhiên là kênh acquisition rẻ nhất cho sản phẩm này — phụ huynh tìm "trò chơi tư
duy cho bé 4 tuổi", không tìm tên thương hiệu.

Spec này sở hữu **hạ tầng SEO**; nội dung trang ở [`seo-content-admin.md`](../06-admin/seo-content-admin.md).

Đây là contract **cắt ngang**: trang công khai tuân theo nó, nó không phụ thuộc trang nào.
Ba trang tiêu thụ contract này là [`game-catalog-public.md`](game-catalog-public.md),
[`game-detail-public.md`](game-detail-public.md) và
[`program-showcase.md`](program-showcase.md) — cả ba khai `depends_on` về đây, không có
chiều ngược lại (`D-AJ`).

## 2. Actors

Công cụ tìm kiếm · Guest.

## 3. Entry points

`/sitemap.xml` · `/robots.txt` · head của mọi trang public.

## 4. Main flow

1. Mỗi trang public sinh meta đầy đủ §7.1.
2. Sitemap sinh **động** từ nội dung `published`, chia nhóm.
3. JSON-LD sinh **từ dữ liệu**, không gõ tay.
4. Canonical trỏ URL chuẩn, không tham số.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Trang có bộ lọc | Canonical về URL không tham số; tổ hợp phổ biến được index riêng |
| Nội dung archived | 410 + gỡ khỏi sitemap |
| Trang cần đăng nhập | `noindex` |
| Bề mặt trẻ `/play/**` | **`noindex`** toàn bộ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SEO2-01` | Bề mặt trẻ và bề mặt tài khoản **`noindex`** | Nội dung sau đăng nhập không nên vào kết quả tìm kiếm |
| `BR-SEO2-02` | Sitemap sinh **động** từ nội dung `published` | Sitemap tay sẽ lệch trong một tuần |
| `BR-SEO2-03` | JSON-LD sinh **từ dữ liệu** | `BR-SEO-06` |
| `BR-SEO2-04` | Mọi trang public có `title`, `meta description`, `canonical`, `og:*` | |
| `BR-SEO2-05` | Nội dung chính render **server-side**, không phụ thuộc JS | |
| `BR-SEO2-06` | Cấm — **NEVER cloaking** — nội dung cho bot và người phải giống nhau | |
| `BR-SEO2-07` | Nội dung archived: **410** + gỡ khỏi sitemap | |
| `BR-SEO2-08` | Cấm — **NEVER script bên thứ ba** trên trang pháp lý | `BR-CDC-08` |
| `BR-SEO2-09` | `hreflang` chỉ `vi-VN` ở MVP | Một thị trường |

## 7. Data

### 7.1 Meta mỗi trang

`title` ≤60 · `meta description` ≤160 · `canonical` · `og:title` `og:description`
`og:image` `og:type` · `twitter:card` · `robots`.

### 7.2 Sitemap

| Nhóm | Nội dung |
|---|---|
| `sitemap-static.xml` | Trang chủ, giá, FAQ, pháp lý |
| `sitemap-games.xml` | Mọi game `published` |
| `sitemap-programs.xml` | Chương trình theo tuổi và theo năng lực |
| `sitemap-topics.xml` | Trang competency và strand |

`sitemap.xml` là index trỏ tới bốn cái trên. Mỗi nhóm ≤50.000 URL.

### 7.3 JSON-LD

| Phạm vi | Schema |
|---|---|
| Toàn site | `Organization` · `WebSite` |
| Trang game | `LearningResource` · `BreadcrumbList` |
| Trang chương trình | `Course` · `BreadcrumbList` |
| Trang competency/strand | `Course` hoặc `Article` |
| Trang có FAQ | `FAQPage` |
| Trang giá | `Product` + `Offer` |

### 7.4 `robots.txt`

```
User-agent: *
Disallow: /play/
Disallow: /me/
Disallow: /api/
Sitemap: https://{domain}/sitemap.xml
```

## 8. API contract

`GET /sitemap.xml` · `/sitemap-*.xml` — cache 1 giờ, sinh từ DB.
`GET /robots.txt` — tĩnh.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SEO2-01 — bề mặt trẻ không index
  When kiểm head của mọi trang dưới /play
  Then có meta robots noindex

Scenario: BR-SEO2-02 — sitemap khớp nội dung published
  Given có 120 game published
  When tải sitemap-games.xml
  Then có đúng 120 URL

Scenario: BR-SEO2-07 — nội dung archived gỡ khỏi sitemap
  Given một game bị archive
  When tải lại sitemap
  Then URL của game đó không còn

Scenario: BR-SEO2-05 — nội dung render server-side
  Given JavaScript bị tắt
  When mở trang game bất kỳ
  Then tiêu đề và mô tả vẫn hiển thị

Scenario: BR-SEO2-03 — JSON-LD hợp lệ
  When kiểm JSON-LD mọi loại trang
  Then mọi schema hợp lệ và khớp nội dung hiển thị

Scenario: BR-SEO2-06 — không cloaking
  When so nội dung trả cho user agent bot và trình duyệt thường
  Then giống nhau

Scenario: BR-SEO2-04 — meta đầy đủ
  When kiểm mọi trang public
  Then mỗi trang có title, description, canonical, og:image

Scenario: BR-SEO2-08 — trang pháp lý sạch script
  When mở trang chính sách
  Then không request tới domain bên thứ ba
```

## 10. Boundaries

**Always**
- Sinh sitemap và JSON-LD từ dữ liệu.
- `noindex` bề mặt sau đăng nhập và bề mặt trẻ.
- Render nội dung chính server-side.

**Ask first**
- Thêm loại schema.
- Thêm ngôn ngữ / `hreflang`.
- Thêm bất kỳ script bên thứ ba nào.

**Never**
- Cloaking.
- Sitemap viết tay.
- Index bề mặt trẻ hoặc tài khoản.
- Script bên thứ ba trên trang pháp lý.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Tổ hợp bộ lọc nào đáng index riêng? | Cấu hình index bộ lọc | P1 | Chốt: Chỉ index 6 trang competency (`C1..C6`) và 3 trang độ tuổi; bộ lọc khác dùng canonical hoặc noindex |
| 2 | `og:image` sinh động cho từng game hay dùng ảnh chung? | Render og:image | P1 | Chốt: Sinh og:image động từ emoji + tiêu đề + background template bằng Nuxt OgImage |

