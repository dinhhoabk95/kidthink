---
spec: AUDIO-STORAGE
title: Lưu trữ và chuẩn hoá audio asset
area: platform
status: implemented
mvp: false
phase: P2
reviewed: 2026-08-16
owns:
  - Pipeline chuẩn hoá và lưu trữ audio asset
  - Quy tắc sở hữu audio asset theo content item
  - Ràng buộc an toàn âm thanh và bảo vệ dữ liệu trẻ
depends_on:
  - CHILD-DATA-COMPLIANCE
  - CONTENT-LIFECYCLE
  - GAME-ENGINE-RUNTIME
---

# Lưu trữ và chuẩn hoá audio asset

## 1. Objective

Phục vụ lưu trữ, chuẩn hoá và phân phối audio asset (âm thanh hiệu ứng SFX, phát âm từ vựng C5, lời khen và chỉ dẫn âm thanh tùy chỉnh) trong Studio biên soạn (P2).

**Không có thư viện âm thanh dùng chung.** Quyết định đóng contract của Task #80. Tương tự ảnh ([`image-storage.md`](image-storage.md)), audio asset gắn liền với **một content item cụ thể** `(owner_type, owner_id)` — upload trong ngữ cảnh của item đó, không vào pool duyệt dùng lại toàn cục.

Tách bạch hoàn toàn khỏi pipeline lưu trữ ảnh ([`image-storage.md`](image-storage.md) của Task #49). P1 dùng audio clip tĩnh đóng gói sẵn kết hợp Web Speech API (TTS `vi-VN`) và visual fallback; P2 mở rộng khả năng upload/quản lý audio asset qua studio với các tiêu chuẩn an toàn âm thanh nghiêm ngặt.

Tuyệt đối cấm thu âm hoặc lưu trữ giọng nói của trẻ em dưới mọi hình thức, tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và Nghị định 13/2023.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Manager | Upload audio asset trong Studio biên soạn, kiểm tra preview, thay thế |
| Server | Kiểm tra MIME bằng magic bytes, chuẩn hoá audio (mono, 44.1kHz, chuẩn hoá âm lượng), lưu S3 |
| Engine | Nạp audio asset qua URL tương đối dựng từ `path` và phát qua Web Audio API |
| Trẻ 3–6 | Nghe âm thanh với mức âm lượng an toàn (trần −16 LUFS), không bao giờ bị thu âm |

## 3. Entry points

| Nơi | Vai trò |
|---|---|
| `POST /api/managers/audio` | Upload file audio cho content item |
| `DELETE /api/managers/audio/{id}` | Xoá audio asset, có kiểm tra ràng buộc đang sử dụng |
| `packages/storage/` | S3 ops + pipeline xử lý audio asset |
| `06-admin/schema-driven-form.md` | Widget chọn/upload audio (`uiHint: audio`) |

## 4. Main flow

```text
Chọn file audio trong Studio
  → Client validate sơ bộ (MIME, dung lượng ≤ 500 KB, thời lượng ≤ 30s)
  → Upload multipart kèm owner_type và owner_id
  → Server: kiểm MIME thật qua magic bytes · từ chối file thực thi/script · chặn file > 500 KB
  → Server chuẩn hoá: mono, 44.1 kHz, áp trần âm lượng −16 LUFS, true peak ≤ −1 dBTP, fade-in ≥ 20ms, fade-out ≥ 40ms
  → Lưu S3, ghi content_audio với (owner_type, owner_id)
  → Trả { id, path, duration_ms, mime_type }
```

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| MIME khai báo ≠ magic bytes | Magic bytes không khớp định dạng audio hợp lệ | Trả **415** `AUDIO_FORMAT_INVALID`, không lưu file |
| Dung lượng > 500 KB | File vượt quá ngưỡng dung lượng | Trả **413** `AUDIO_SIZE_LIMIT_EXCEEDED` |
| Thời lượng > 30s | Audio clip dài hơn quy định cho micro-lesson/cue | Trả **422** `VALIDATION_FAILED` kèm thông báo |
| Xoá audio đang được content `published` dùng | Có ràng buộc FK hoặc asset ref từ content đang live | Trả **409** `CONTENT_IN_USE` kèm danh sách nơi đang dùng |
| Content bị xoá | Content item bị xoá cứng | Audio chuyển trạng thái `orphan`, worker dọn sau 30 ngày |
| Upload lỗi giữa chừng | Mất mạng hoặc gián đoạn | Form trong studio giữ nguyên dữ liệu, không mất công tác biên tập |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-AST-01` | Cấm — **NEVER thư viện audio dùng chung.** Audio thuộc `(owner_type, owner_id)` | Tránh rủi ro bản quyền và governance phức tạp ở MVP; nội dung nào quản lý audio nấy |
| `BR-AST-02` | Kiểm tra MIME bằng **magic bytes**, từ chối mọi file không phải audio chuẩn (`audio/mpeg`, `audio/mp4`, `audio/ogg`, `audio/webm`, `audio/wav`) | Tránh lỗ hổng bảo mật tải lên script/payload độc hại |
| `BR-AST-03` | Ràng buộc kỹ thuật âm thanh: mono, 44.1 kHz, dung lượng ≤ **500 KB**, thời lượng ≤ **30s**, trần master −16 LUFS, true peak ≤ −1 dBTP, ramp-in ≥ 20ms, ramp-out ≥ 40ms (`BR-ENG-16`) | Đảm bảo băng thông tải trên mạng 4G, tiết kiệm bộ nhớ thiết bị trẻ và tránh âm thanh đột ngột gây giật mình |
| `BR-AST-04` | Cấm — **NEVER thu âm, lưu trữ, hoặc suy luận giọng nói của trẻ em** dưới bất kỳ hình thức nào | Ràng buộc bảo vệ dữ liệu trẻ em theo Luật 91/2025/QH15 và Nghị định 13/2023 (`BR-CDC-04`) |
| `BR-AST-05` | DB lưu **`path` tương đối**, URL dựng lúc đọc qua `storage.url()` | Cho phép linh hoạt thay đổi CDN hoặc bucket hạ tầng mà không làm hỏng dữ liệu nội dung |
| `BR-AST-06` | Cấm — **NEVER ghi đè file audio gốc khi thay thế.** Thay audio = tạo path mới | Giữ tính bất biến của các version nội dung đã phát hành |
| `BR-AST-07` | Cấm — **NEVER raw `$fetch` cho route upload audio** — bắt buộc `useApiClient` có gắn `x-csrf-token` | Chống tấn công CSRF upload file độc hại |
| `BR-AST-08` | Mọi hành động upload và xoá audio ghi `audit_logs` (`actor_type = 'manager'`) | Duy trì audit trail trách nhiệm quản trị viên (`BR-AUD-01`) |

## 7. Data

### 7.1 Bảng `content_audio`

| Field | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Định danh duy nhất |
| `owner_type` | `varchar(50)` | NOT NULL | `game_level` \| `lesson` \| `activity` |
| `owner_id` | `varchar(64)` | NOT NULL | ID/code của content item sở hữu |
| `path` | `varchar(255)` | NOT NULL | Đường dẫn tương đối (ví dụ `audio/2026/08/cd34ef.mp3`) |
| `duration_ms` | `integer` | NOT NULL | Thời lượng tính bằng milliseconds |
| `mime_type` | `varchar(50)` | NOT NULL | `audio/mpeg` \| `audio/ogg` \| `audio/webm` \| `audio/mp4` |
| `file_size_bytes` | `integer` | NOT NULL, ≤ 512000 | Dung lượng file sau chuẩn hoá |
| `status` | `varchar(20)` | NOT NULL, default `'active'` | `'active'` \| `'orphan'` \| `'archived'` |
| `uploaded_by_manager_id` | `integer` | NOT NULL | FK `managers.id` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Thời điểm upload |

### 7.2 Ràng buộc kỹ thuật

| Tiêu chí | Giá trị |
|---|---|
| MIME cho phép | `audio/mpeg` (`.mp3`), `audio/ogg` (`.ogg`), `audio/webm` (`.webm`), `audio/mp4` (`.m4a`), `audio/wav` (`.wav`) |
| Dung lượng file upload tối đa | ≤ 500 KB |
| Thời lượng tối đa | ≤ 30 giây |
| Kênh âm thanh (channels) | Mono (1 channel) |
| Tần số lấy mẫu (sample rate) | 44.1 kHz |
| Mức âm lượng chuẩn hoá | Trần −16 LUFS, true peak ≤ −1 dBTP |
| Onset & Decay | Ramp-in ≥ 20ms, ramp-out ≥ 40ms |

## 8. API contract

### `POST /api/managers/audio`

| Thuộc tính | Giá trị |
|---|---|
| Auth | `requireManagerAuth()` + header `x-csrf-token` |
| Body | Multipart form: `file` (binary), `owner_type` (string), `owner_id` (string), `label_vi` (string) |
| 201 | `{ "id": "uuid", "path": "audio/2026/08/x.mp3", "duration_ms": 3500, "mime_type": "audio/mpeg" }` |
| 413 | `AUDIO_SIZE_LIMIT_EXCEEDED` — file vượt quá 500 KB |
| 415 | `AUDIO_FORMAT_INVALID` — magic bytes không phải định dạng audio được hỗ trợ |
| 422 | `VALIDATION_FAILED` — thiếu trường hoặc thời lượng > 30s |

### `DELETE /api/managers/audio/{id}`

| Thuộc tính | Giá trị |
|---|---|
| Auth | `requireManagerAuth()` + header `x-csrf-token` |
| 200 | `{ "success": true }` |
| 404 | `NOT_FOUND` — audio asset không tồn tại |
| 409 | `CONTENT_IN_USE` — audio đang được liên kết với content item ở trạng thái `published` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-AST-02 — File không phải audio hoặc giả mạo extension bị từ chối
  Given một file thực thi .exe được đổi tên thành prompt.mp3
  When Manager upload qua POST /api/managers/audio
  Then Server kiểm tra magic bytes và trả về 415 AUDIO_FORMAT_INVALID
  And không có file nào được lưu lên S3

Scenario: BR-AST-03 — File vượt quá dung lượng bị chặn
  Given một file audio có dung lượng 1.5 MB
  When Manager upload qua POST /api/managers/audio
  Then Server từ chối với mã 413 AUDIO_SIZE_LIMIT_EXCEEDED

Scenario: BR-AST-04 — Đảm bảo an toàn không thu âm giọng trẻ
  When kiểm tra toàn bộ endpoint và schema của hệ thống
  Then không có endpoint nào tiếp nhận stream hoặc file ghi âm từ phía Child
  And không có bảng DB nào lưu trữ dữ liệu âm thanh sinh trắc học của trẻ

Scenario: BR-AST-05 — DB lưu path tương đối
  Given một file audio upload thành công
  When đọc bản ghi trong bảng content_audio
  Then trường path là đường dẫn tương đối không chứa schema https:// hoặc tên S3 bucket

Scenario: BR-AST-06 — Thay thế audio tạo bản ghi mới, không ghi đè
  Given content item đang sử dụng audio tại path_A
  When Manager upload file audio mới thay thế
  Then bản ghi audio mới được tạo với path_B khác path_A
  And file path_A cũ trên S3 vẫn được giữ nguyên

Scenario: Xoá audio đang dùng bị chặn 409
  Given một audio asset đang được sử dụng trong game_level trạng thái published
  When Manager thực hiện DELETE /api/managers/audio/{id}
  Then Server trả về 409 CONTENT_IN_USE kèm danh sách level đang dùng
```

## 10. Boundaries

**Always**
- Kiểm tra MIME thật bằng magic bytes tại server trước khi đẩy lên S3.
- Chuẩn hoá mono, 44.1 kHz, kiểm tra trần âm lượng −16 LUFS và ramp-in/out.
- Lưu đường dẫn tương đối và dựng URL khi trả về client.
- Ghi nhật ký `audit_logs` cho mọi thao tác upload/xoá của manager.
- Kiểm tra ràng buộc nội dung `published` trước khi xoá.

**Ask first**
- Nâng trần dung lượng 500 KB hoặc thời lượng 30s.
- Bổ sung định dạng audio codec mới ngoài danh sách đóng.
- Thêm `owner_type` mới ngoài các thực thể nội dung đã định nghĩa.

**Never**
- Thư viện audio dùng chung ngoài phạm vi scoped content item.
- Thu âm, phân tích hoặc lưu trữ giọng nói/dữ liệu sinh trắc của trẻ.
- Lưu URL tuyệt đối hoặc tên bucket vào DB.
- Ghi đè file audio gốc khi cập nhật.
- Sử dụng raw `$fetch` không có CSRF token cho thao tác upload.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Lưu trữ audio P2 có gộp vào image pipeline Task #49 không?~~ **Đóng 2026-08-16 (Task #80)**: Không gộp; audio asset có pipeline, bảng `content_audio`, MIME và ràng buộc LUFS riêng biệt tại spec này | — | Đã đóng | D-AS |
