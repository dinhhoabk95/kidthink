---
spec: IMAGE-STORAGE
title: Lưu trữ và chuẩn hoá ảnh upload
area: platform
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-13
owns:
  - Pipeline chuẩn hoá ảnh
  - Quy tắc sở hữu ảnh theo content item
  - Ràng buộc bảo mật upload
depends_on:
  - CHILD-DATA-COMPLIANCE
  - CONTENT-LIFECYCLE
---

# Lưu trữ và chuẩn hoá ảnh upload

## 1. Objective

**Không có thư viện ảnh.** Quyết định D4 của `../SPEC.md`.

Emoji là kho dùng chung. Ảnh thì gắn với **một content item cụ thể** — upload trong ngữ
cảnh của nó, không vào pool duyệt lại được.

Lý do: thư viện ảnh dùng chung kéo theo governance — ai xoá được, xoá thì content nào chết,
bản quyền của ai, ai dọn ảnh mồ côi. Chi phí đó không đáng ở MVP, và bỏ nó đi không mất
tính năng nào người dùng thấy.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Manager | Upload trong studio, crop, thay thế |
| Server | Kiểm MIME thật, chuẩn hoá WebP, lưu S3 |
| Engine | Nạp qua URL dựng từ `path` |
| User | Cấm upload gì ở MVP (add-on mới có) |

## 3. Entry points

| Nơi | |
|---|---|
| `POST /api/managers/images` | Upload |
| `DELETE /api/managers/images/{id}` | Xoá, có kiểm đang dùng |
| `packages/storage/` | S3 ops + pipeline ảnh |
| `06-admin/image-upload.md` | UI crop |

## 4. Main flow

```
Chọn/kéo ảnh
  → modal crop (mặc định 1:1, xoay 90°, preview CỠ THẬT TRONG GAME)
  → canvas cắt ở client
  → upload multipart
  → server: kiểm MIME THẬT (magic bytes) · từ chối SVG · giới hạn 2MB
  → chuẩn hoá: WebP, ≤960×960, sinh thumbnail 160×160
  → lưu S3, ghi content_images với (owner_type, owner_id)
  → trả { id, path }
```

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| MIME khai báo ≠ magic bytes | **415**, không lưu |
| SVG | **415** — có thể chứa script |
| > 2 MB | **413** |
| Ảnh nhỏ hơn 160×160 | Chấp nhận, không phóng to |
| Xoá ảnh đang được content `published` dùng | **409** kèm danh sách nơi dùng |
| Content bị xoá cứng | Ảnh của nó chuyển `orphan`, job dọn sau 30 ngày |
| Upload fail giữa chừng | Cấm mất dữ liệu form — studio giữ nguyên trạng thái |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-IMG-01` | Cấm — **NEVER thư viện ảnh dùng chung.** Ảnh thuộc `(owner_type, owner_id)` | §1 |
| `BR-IMG-02` | Cấm — **NEVER cho upload SVG** | Có thể chứa script |
| `BR-IMG-03` | Kiểm MIME bằng **magic bytes**, không tin header client | Header đổi được |
| `BR-IMG-04` | Kiểm giới hạn ở **cả client và server** | Client để trải nghiệm; server để an toàn |
| `BR-IMG-05` | DB lưu **`path` tương đối**, URL dựng lúc đọc | Đổi CDN/bucket không làm chết mọi content đã tạo |
| `BR-IMG-06` | Cấm — **NEVER ghi đè file gốc.** Thay ảnh = path mới | Version nội dung cũ vẫn trỏ ảnh cũ |
| `BR-IMG-07` | Crop ở client là quyết định **biên tập**; resize ở server là ràng buộc **kỹ thuật**. Hai việc khác nhau, không thay thế nhau | Crop giữ đúng góc nhìn sư phạm do manager chọn; resize server đảm bảo băng thông và memory canvas của thiết bị trẻ |
| `BR-IMG-08` | Preview ở **cỡ thật trong game** | Ảnh ổn ở 400px có thể vô nghĩa ở 96px |
| `BR-IMG-09` | Cấm — **NEVER ảnh chụp trẻ em** ở bất kỳ đâu, kể cả avatar | [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) `BR-CDC-04` |
| `BR-IMG-10` | Ảnh chứng từ thanh toán lưu **private**, signed URL 15 phút | Chứa thông tin ngân hàng |
| `BR-IMG-11` | Cấm — **NEVER raw `$fetch` cho route upload** — mất `x-csrf-token` | Opaque cookie session không thay contract CSRF; raw `$fetch` không đi qua wrapper double-submit của KidThink, dễ bị tấn công CSRF upload file độc hại |
| `BR-IMG-12` | Mọi upload/xoá ghi `audit_logs` | Bắt buộc để vết trách nhiệm quản trị viên khi có sự cố phát tán ảnh hoặc xoá nhầm asset của content published (`BR-AUD-01`) |

## 7. Data

### 7.1 Bảng `content_images`

| Field | Ghi chú |
|---|---|
| `id` `uuid` | |
| `owner_type` `owner_id` | Polymorphic — `game_level` \| `lesson` \| `activity` \| `worksheet` \| `payment_order` \| `payment_proof` \| `custom_game` \| `user_avatar` \| `manager_avatar` |
| `path` | Tương đối, ví dụ `content/2026/08/ab12cd.webp` |
| `thumb_path` | |
| `width` `height` `bytes` `mime` | Sau chuẩn hoá |
| `alt` | Bắt buộc — a11y |
| `visibility` | `public` \| `private` |
| `status` | `active` \| `orphan` \| `archived` |
| `uploaded_by_manager_id` `created_at` | |

Polymorphic → **bắt buộc** integration test bắt orphan owner.

### 7.2 Ràng buộc

| Ràng buộc | Giá trị |
|---|---|
| MIME chấp nhận | `image/jpeg` `image/png` `image/webp` |
| Kích thước file vào | ≤ 2 MB |
| Kích thước ra | ≤ 960×960, WebP chất lượng 82 |
| Thumbnail | 160×160, crop giữa |
| Tỉ lệ crop mặc định | 1:1 — vật đếm được trong game là hình vuông |
| Chứng từ thanh toán | `visibility = private`, ≤ 5 MB |

### 7.3 Dựng URL

```ts
storage.url(path, { variant: "full" | "thumb" }): string;
storage.signedUrl(path, ttlSeconds): string;   // chỉ cho private
```

Cấm — **NEVER** lưu URL tuyệt đối vào DB.

## 8. API contract

### `POST /api/managers/images`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `x-csrf-token` |
| Body | multipart — `file` · `owner_type` · `owner_id` · `alt` |
| 201 | `{ id, path, thumb_path, width, height }` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | `VALIDATION_FAILED` — thiếu `alt` |

### `DELETE /api/managers/images/{id}`

200 khi xoá được. **409** `CONTENT_IN_USE` kèm `details.used_by[]`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-IMG-02 — SVG bị từ chối
  When upload một file .svg
  Then trả 415
  And không file nào được ghi lên S3

Scenario: BR-IMG-03 — MIME giả bị bắt
  Given một file .exe đổi tên thành .png
  When upload
  Then server đọc magic bytes và trả 415

Scenario: BR-IMG-05 — DB lưu path tương đối
  Given một ảnh đã upload
  When đọc hàng content_images
  Then path không chứa https:// hay tên bucket

Scenario: BR-IMG-06 — thay ảnh không ghi đè file gốc
  Given content dùng ảnh path A
  When manager thay bằng ảnh mới
  Then ảnh mới có path B khác A
  And file A vẫn tồn tại trên S3

Scenario: BR-IMG-01 — không có pool ảnh dùng lại
  When quét mọi route quản lý ảnh
  Then không route nào liệt kê ảnh không kèm owner_type và owner_id

Scenario: xoá ảnh đang dùng bị chặn
  Given một ảnh được một game level published dùng
  When manager xoá ảnh
  Then trả 409 CONTENT_IN_USE
  And body liệt kê level đang dùng

Scenario: BR-IMG-10 — chứng từ không công khai
  Given một ảnh chứng từ thanh toán
  When truy cập URL S3 trực tiếp
  Then bị từ chối
  And chỉ signed URL còn hạn mới mở được

Scenario: kết quả chuẩn hoá đúng giới hạn
  Given upload một ảnh JPEG 3000x2000
  Then file lưu là WebP
  And chiều lớn nhất không vượt 960px
  And có thumbnail 160x160

Scenario: alt bắt buộc
  When upload không kèm alt
  Then trả 422
```

## 10. Boundaries

**Always**
- Kiểm magic bytes ở server.
- Lưu path tương đối, dựng URL lúc đọc.
- Sinh thumbnail và giữ file gốc.
- Bắt buộc `alt`.
- Ghi audit mọi upload/xoá.

**Ask first**
- Nới giới hạn kích thước hoặc MIME.
- Thêm `owner_type` mới.
- Cho User upload ảnh.

**Never**
- Thư viện ảnh dùng chung.
- SVG · tin MIME client · ghi đè file gốc.
- URL tuyệt đối trong DB.
- Ảnh chụp trẻ em.
- Raw `$fetch` cho upload.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Xoá nền tự động có vào P4 không? Trỏ sang [`image-upload.md`](../06-admin/image-upload.md) Q1 | Chất lượng nội dung | P4 | Studio UI |
| 2 | CDN trước S3 ngay từ đầu hay sau? Ảnh hưởng độ trễ tải asset trên 4G | Hạ tầng | P2 | Infra |
| 3 | Job dọn ảnh `orphan` chạy tần suất nào? (D-BD: 01:00 UTC hàng ngày, dọn ảnh orphan > 30 ngày) | Vận hành | P2 | Backend |
