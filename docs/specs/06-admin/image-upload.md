---
spec: IMAGE-UPLOAD
title: Tải và cắt ảnh trong studio
area: admin
status: draft
mvp: true
phase: P2
reviewed: 2026-08-04
owns:
  - Giao diện crop và upload
  - Ràng buộc phía client
depends_on:
  - IMAGE-STORAGE
  - SCHEMA-DRIVEN-FORM
---

# Tải và cắt ảnh trong studio

## 1. Objective

Ảnh dùng khi emoji không diễn tả được. **Không có thư viện** — mỗi content item upload ảnh
của chính nó ([`SPEC.md`](../../SPEC.md) D4).

Crop ở client là quyết định **biên tập**; resize ở server là ràng buộc **kỹ thuật**. Hai việc
khác nhau và không thay thế nhau.

## 2. Actors

`content_reviewer` · `super_admin`.

## 3. Entry points

Mọi field `uiHint = image` · `POST /api/managers/images`.

## 4. Main flow

```
Chọn hoặc kéo thả ảnh
  → modal crop: khung 1:1 mặc định · nút xoay 90° · preview CỠ THẬT TRONG GAME
  → canvas cắt ở client
  → upload multipart kèm alt_vi
  → server: magic bytes · WebP · ≤960×960 · thumbnail
  → field nhận path, preview studio cập nhật
```

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| File > 2 MB | Chặn ở client kèm thông báo rõ; server cũng chặn |
| SVG | Chặn ở cả hai phía |
| Ảnh sai hướng (từ điện thoại) | Nút xoay 90° |
| Upload fail | **Giữ nguyên** crop đã làm, cho thử lại |
| Thay ảnh | Path mới, không ghi đè file cũ |
| Xoá ảnh đang dùng | 409 kèm danh sách nơi dùng |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-IUP-01` | Tỉ lệ crop mặc định **1:1** | Vật đếm được trong game là hình vuông |
| `BR-IUP-02` | Preview ở **cỡ thật trong game** | Ảnh ổn ở 400px có thể vô nghĩa ở 96px |
| `BR-IUP-03` | Nút **xoay 90°** | Ảnh từ điện thoại thường sai hướng |
| `BR-IUP-04` | Kiểm giới hạn ở **cả client và server** | Client để trải nghiệm; server để an toàn |
| `BR-IUP-05` | `alt_vi` **bắt buộc** | A11y, và nó cũng là mô tả để tra sau này |
| `BR-IUP-06` | Upload dùng client có **CSRF token**, Cấm — **NEVER raw `$fetch`** | |
| `BR-IUP-07` | Upload fail **không mất crop đã làm** | `BR-STU-03` |
| `BR-IUP-08` | Cấm — **NEVER upload ảnh chụp trẻ em** — nhắc rõ trên UI | `BR-CDC-04` |
| `BR-IUP-09` | Ghi `audit_logs` mọi upload và xoá | |

## 7. Data

### 7.1 Modal crop

| Thành phần | Ghi chú |
|---|---|
| Khung crop | 1:1 mặc định; đổi được sang 4:3, 16:9 nếu template cho phép |
| Xoay | 90° mỗi lần bấm |
| Zoom | Kéo thả trong khung |
| Preview cỡ thật | Hộp bên cạnh, kích thước lấy từ layout của template |
| `alt_vi` | Input bắt buộc |
| Cảnh báo | "Không dùng ảnh chụp trẻ em" hiện thường trực |

### 7.2 Giới hạn client

| Ràng buộc | Giá trị |
|---|---|
| MIME | jpeg · png · webp |
| Kích thước file | ≤ 2 MB |
| Kích thước ảnh vào | ≥ 200×200 (nhỏ hơn thì cảnh báo) |
| Kết quả crop | Gửi lên dạng WebP hoặc PNG, ≤ 1200×1200 |

## 8. API contract

Xem `01-platform/image-storage.md` §8.

## 9. Acceptance criteria

```gherkin
Scenario: BR-IUP-02 — preview cỡ thật
  Given template hiển thị item ở 96px
  When mở modal crop
  Then có hộp preview ở đúng 96px

Scenario: BR-IUP-07 — upload fail không mất crop
  Given manager đã crop và xoay ảnh
  When upload thất bại vì mạng
  Then modal giữ nguyên crop
  And có nút thử lại

Scenario: BR-IUP-05 — alt_vi bắt buộc
  When upload không điền alt_vi
  Then nút upload bị vô hiệu

Scenario: BR-IUP-04 — giới hạn kiểm hai phía
  When chọn file 5 MB
  Then client chặn trước khi gửi
  When gửi file 5 MB bằng curl
  Then server trả 413

Scenario: BR-IUP-06 — upload có CSRF token
  When quan sát request upload
  Then header x-csrf-token có mặt

Scenario: BR-IUP-08 — cảnh báo ảnh trẻ em
  When mở modal crop
  Then có cảnh báo không dùng ảnh chụp trẻ em

Scenario: SVG bị chặn
  When chọn file .svg
  Then client chặn
  And server cũng trả 415 nếu bị bỏ qua client

Scenario: thay ảnh không ghi đè file cũ
  Given field đang dùng ảnh path A
  When upload ảnh mới
  Then field trỏ path B
  And file A còn trên S3
```

## 10. Boundaries

**Always**
- Crop 1:1 mặc định, có xoay.
- Preview cỡ thật.
- `alt_vi` bắt buộc.
- Giữ crop khi upload fail.

**Ask first**
- Thêm tỉ lệ crop.
- Nới giới hạn kích thước.

**Never**
- Raw `$fetch` cho upload.
- SVG.
- Ảnh chụp trẻ em.
- Ghi đè file gốc.
- Mất crop khi lỗi.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Xoá nền tự động có đáng làm không? Nhiều ảnh nền trắng sẽ trông rời rạc trên canvas màu | P4 |
