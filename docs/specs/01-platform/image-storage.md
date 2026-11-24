---
spec: IMAGE-STORAGE
title: Lưu trữ đối tượng ảnh và tệp private
area: platform
status: implemented
mvp: true
phase: P1
reviewed: 2026-11-24
owns:
  - Driver lưu trữ đối tượng đang hoạt động (ObjectStorageDriver) theo runtime
  - Đường đọc tệp private qua URL ký (`GET /private/<path>`)
  - Quy tắc đường dẫn tương đối an toàn cho storage
depends_on:
  - ENV-CONTRACT
---

# Lưu trữ đối tượng ảnh và tệp private

## 1. Objective

Một chỗ duy nhất định nghĩa nơi byte của ảnh chứng từ thanh toán và PDF export được lưu, và
cách chúng được đọc lại. Tệp **private** (chứng từ, PDF) chỉ đọc được qua URL ký có hạn; tệp
**public** là ảnh nội dung gắn content item. Pipeline WebP/crop ảnh nội dung nằm ở
`06-admin/image-upload.md`, không ở đây.

## 2. Actors

| Actor | Làm được gì ở đây |
|---|---|
| User | Tải chứng từ (qua [`payment-proof-upload`](../03-account/payment-proof-upload.md)), mở URL ký của chính mình |
| Manager | Mở URL ký của chứng từ khi duyệt đơn |
| Hệ thống | Ghi/xoá tệp private (PDF export, CSV export, dọn hạn) |

## 3. Entry points

| Nơi | Ghi chú |
|---|---|
| `packages/storage` | `uploadPrivateAsset`, `readPrivateAsset`, `deletePrivateAsset`, `getPrivateSignedUrl`, `verifySignedUrlToken` |
| `GET /private/<path>?expires=<ms>&signature=<hex>` | Đọc tệp private |

## 4. Main flow

1. Producer gọi `uploadPrivateAsset` → driver đang hoạt động ghi byte.
2. Producer gọi `getPrivateSignedUrl` → URL `${STORAGE_BASE_URL}/private/<path>?expires&signature`.
3. Client mở URL → route kiểm HMAC và hạn → đọc byte từ driver → trả về.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Chữ ký sai hoặc hết hạn | HMAC không khớp, `expires` quá khứ | `403`, không đọc driver |
| Tệp không tồn tại | Đã xoá hoặc quá hạn lưu | `404` |
| Đường dẫn không an toàn | `..`, `\`, ký tự điều khiển | `403` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-IMG-05` | Khoá storage là đường dẫn **tương đối**, không chứa `..`, `\`, ký tự điều khiển | Chặn path traversal |
| `BR-IMG-06` | Ảnh public không bị ghi đè | Cache vĩnh viễn theo đường dẫn |
| `BR-IMG-10` | Tệp private chỉ đọc được qua `GET /private/<path>` với HMAC-SHA256 trên `<path>:<expires>`, khoá `STORAGE_SIGNING_SECRET`, so sánh hằng thời gian | Chứng từ chứa dữ liệu tài chính |
| `BR-IMG-11` | Driver đang hoạt động: **D1 blobs** (`stored_blobs` trên `mindkid-blobs`) trên Cloudflare; **in-memory** (giới hạn 200 mục) ở dev/test khi chưa đặt driver. Mọi upload/đọc/xoá private đi qua driver, không có đường song song | Bản in-memory riêng làm chứng từ biến mất khi isolate khởi động lại |
| `BR-IMG-12` | Response `/private/*` luôn có `Cache-Control: private, no-store` và `X-Content-Type-Options: nosniff`; không phải ảnh thì `Content-Disposition: attachment` | Chống cache chung và đoán kiểu |
| `BR-IMG-13` | Trên Cloudflare `STORAGE_BASE_URL` = `SITE_URL` (cùng origin với route đọc) | URL ký phải trỏ tới Worker phục vụ nó |
| `BR-IMG-14` | Driver D1 lưu **byte thô** trong cột `body` kiểu `BLOB` (không base64) và từ chối ghi tệp > `D1_MAX_BLOB_BYTES` (1 900 000 byte) bằng `PayloadTooLargeError` (413). Ảnh chứng từ bị chặn sớm hơn ở 1,5 MB (`PROOF_MAX_IMAGE_SIZE_BYTES` = 1 572 864) | D1 giới hạn khoảng 2 MB mỗi dòng/giá trị; vượt là lỗi 500 khó chẩn đoán |
| `BR-IMG-15` | `uploadPrivateAsset` nhận `expiresAt?`. Producer đặt hạn: CSV export admin = **1 ngày**, PDF export = **7 ngày** (`BR-PDF-08`), chứng từ thanh toán = không hạn. `getObject` không trả tệp quá hạn; driver có `deleteExpired(now)` (D1 xoá mọi dòng có `expires_at` khác rỗng và `<= now`) được gọi bởi `sweep:pdf-cleanup` hằng ngày | Không có hạn thì CSV chứa dữ liệu quản trị nằm lại D1 mãi và làm đầy quota |

## 7. Data

**Ghi/đọc:** bảng `stored_blobs(bucket, key, content_type, byte_size, body BLOB, expires_at, created_at)`,
khoá chính `(bucket, key)`, DDL là hằng `STORED_BLOBS_DDL` ở `packages/storage`, được
`scripts/deploy/sync-wrangler-ids.ts` ghi ra `.d1-ddl/blobs.sql`.

## 8. API contract

### `GET /private/<path>?expires=<ms>&signature=<hex>`

| | |
|---|---|
| Auth | Chữ ký URL (không cần session) |
| 2xx | Byte tệp, `Content-Type` đã lưu |
| 4xx | `403` chữ ký/hạn/đường dẫn · `404` không có tệp |

## 9. Acceptance criteria

```gherkin
Scenario: BR-IMG-10 — URL ký đọc lại đúng byte
  Given một chứng từ đã upload
  When mở URL ký còn hạn
  Then nhận đúng byte đã upload

Scenario: BR-IMG-10 — chữ ký sai hoặc hết hạn
  When mở URL bị sửa chữ ký, hoặc đã quá expires
  Then 403

Scenario: BR-IMG-11 — xoá đi qua driver
  When deletePrivateAsset rồi readPrivateAsset
  Then không còn byte

Scenario: BR-IMG-14 — tệp quá lớn bị từ chối có kiểm soát
  When putObject với tệp > 1 900 000 byte trên driver D1
  Then ném PayloadTooLargeError, không ghi dòng nào

Scenario: BR-IMG-15 — sweep xoá tệp quá hạn
  Given tệp private có expiresAt trong quá khứ và một tệp không hạn
  When chạy deleteExpired(now)
  Then chỉ tệp quá hạn bị xoá, trả về số dòng đã xoá

Scenario: BR-IMG-12 — header an toàn
  When đọc tệp private
  Then Cache-Control là private, no-store và có nosniff
```

## 10. Boundaries

**Always**
- Đi qua driver đang hoạt động cho mọi thao tác private.

**Ask first**
- Đổi driver production (D1 → R2/S3).

**Never**
- Phục vụ tệp private mà không kiểm chữ ký.
- Giữ bản lưu in-memory riêng ngoài driver.

## 11. Open questions

Không có.
