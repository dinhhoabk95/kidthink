---
spec: OFFLINE-CURRICULUM-PACK
title: Gói học tập ngoại tuyến và quản lý hạn mức
area: platform
status: implemented
mvp: false
phase: P5
reviewed: 2026-08-16
owns:
  - Manifest gói học tập offline và xác thực tính toàn vẹn asset
  - Cơ chế cấp quyền hạn lease, kiểm soát hết hạn và thu hồi gói offline
  - Đồng bộ tiến độ học tập offline và quản lý hạn mức lưu trữ IndexedDB
depends_on:
  - PWA-INSTALL
  - OFFLINE-PLAY
  - CURRICULUM-PLAYER
  - ACCESS-GATING
  - ENTITLEMENT-MODEL
  - AUDIT-LOG
  - ERROR-CODES
  - EVENT-CATALOG
  - BUSINESS-RULES
---

# Gói học tập ngoại tuyến và quản lý hạn mức

## 1. Objective

Cho phép người lớn chủ động tải trước toàn bộ nội dung của một tuần hoặc một chủ đề học tập
(curriculum pack) về bộ nhớ cục bộ trên thiết bị tablet của trẻ để chơi mượt mà khi không có kết
nối Internet (ví dụ khi đi du lịch, trên xe ô tô hoặc khu vực sóng yếu). Hệ thống bảo đảm tính
toàn vẹn dữ liệu qua manifest có chữ ký băm, kiểm soát hạn mức lưu trữ của trình duyệt (IndexedDB /
Cache Storage), cấp quyền hạn theo cơ chế lease có thời hạn (tối đa 7 ngày), và tự động đồng bộ
tiến độ khi thiết bị có mạng trở lại.

Spec này sở hữu manifest gói học tập, cơ chế lease/revocation và quản lý lưu trữ offline nâng cao;
kế thừa cơ chế đệm phiên cục bộ từ [`offline-play.md`](offline-play.md) và cài đặt ứng dụng từ
[`pwa-install.md`](pwa-install.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| User | Đã đăng nhập (`requireUserAuth`), có entitlement hợp lệ | Chọn tuần học, kiểm tra dung lượng và bấm tải/xoá gói offline |
| Trẻ (Child) | Đang mở màn hình chơi offline | Chơi các bài học trong gói đã tải mà không cần kết nối mạng |
| Service Worker | Cache Storage & IndexedDB client | Phục vụ asset offline, lưu hàng đợi sự kiện và kích hoạt đồng bộ nền |

## 3. Entry points

| Route / Màn hình | Actor | Ghi chú |
|---|---|---|
| `/me/curricula/{uuid}/offline` | User | Giao diện quản lý các gói tải trước và tình trạng dung lượng bộ nhớ |
| `GET /api/users/curricula/{uuid}/offline-pack` | User | Lấy manifest gói học tập đã ký kèm danh sách URLs asset |
| `POST /api/users/offline/sync` | Service Worker | Đẩy lô sự kiện telemetry/progress tích luỹ trong thời gian offline |

## 4. Main flow

1. User mở giao diện chương trình học của trẻ tại `/me/curricula/{uuid}/offline`.
2. Hệ thống kiểm tra entitlement của User (gói standard / premium) và dung lượng khả dụng của
   trình duyệt qua `navigator.storage.estimate()`.
3. User chọn tuần học muốn tải (ví dụ: Tuần 3 — Hình học không gian, dung lượng ~25 MB).
4. Client gọi `GET /api/users/curricula/{uuid}/offline-pack?week=3` để lấy manifest có chữ ký số
   kèm token lease có thời hạn (7 ngày).
5. Service Worker tải toàn bộ game configs, hình ảnh và audio tương ứng vào Cache Storage chuyên
   biệt `mindkid-offline-pack-v1`, xác minh checksum từng file.
6. Khi trẻ chơi offline:
   - Hệ thống nạp bài học từ local cache mà không cần gửi request mạng.
   - Các sự kiện chơi (`telemetry_events`) được lưu vào IndexedDB cục bộ với số thứ tự `seq`.
7. Khi thiết bị kết nối mạng trở lại, Service Worker tự động đẩy lô sự kiện lên
   `POST /api/users/offline/sync` và làm mới token lease nếu gói dịch vụ vẫn còn hiệu lực.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Bộ nhớ không đủ | Dung lượng trống < dung lượng gói + 50 MB buffer | Báo lỗi `STORAGE_QUOTA_INSUFFICIENT`, hướng dẫn người lớn dọn dẹp |
| Hết hạn lease offline | Quá 7 ngày không kết nối mạng xác thực lại | Khóa gói offline (`OFFLINE_PACK_EXPIRED`), yêu cầu kết nối mạng để mở lại |
| File tải bị lỗi/hỏng | Checksum hash không khớp manifest | Báo lỗi `OFFLINE_PACK_CORRUPTED`, tự động thử tải lại file hỏng |
| Quyền gói dịch vụ bị huỷ | User bị thu hồi entitlement hoặc logout | Dọn dẹp toàn bộ dữ liệu gói offline khỏi Cache Storage & IndexedDB |
| Mạng chập chờn khi sync | Request sync bị gián đoạn giữa chừng | Giữ nguyên dữ liệu trong IndexedDB, thử lại khi mạng ổn định (idempotent) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-OCP-01` | Gói học offline là quyền hạn có thời hạn (lease tối đa 7 ngày), không phải bản sao chép nội dung vĩnh viễn | Ngăn chặn việc sao chép lậu nội dung độc quyền và bảo đảm tính cập nhật sư phạm |
| `BR-OCP-02` | Tải gói offline chỉ được thực hiện từ bề mặt người lớn (`/me/curriculum`) sau khi xác thực quyền sở hữu và entitlement hợp lệ | Trẻ không được tự ý tải làm đầy bộ nhớ thiết bị |
| `BR-OCP-03` | Cấm — **NEVER** lưu cache nội dung trả phí cho User không có entitlement tại thời điểm tải gói | Bảo vệ hệ thống paywall và ngăn ngừa lỗ hổng rò rỉ nội dung |
| `BR-OCP-04` | Manifest gói học tập offline phải có chữ ký số hoặc checksum băm để đảm bảo tính toàn vẹn asset trước khi cho phép chơi ngoại tuyến | Tránh việc crash game engine do tải thiếu hoặc lỗi file |
| `BR-OCP-05` | Khi User đăng xuất, đổi thiết bị hoặc quyền lợi bị thu hồi, toàn bộ gói học tập offline được đánh dấu vô hiệu và dọn dẹp khỏi cache/storage | Đảm bảo an toàn dữ liệu trên thiết bị dùng chung |
| `BR-OCP-06` | Đồng bộ tiến độ học tập khi có mạng trở lại theo thứ tự sự kiện `seq` và xử lý trùng lặp an toàn | Bảo toàn chính xác kết quả học tập và trạng thái mastery của trẻ |
| `BR-OCP-07` | Kiểm tra hạn mức dung lượng thiết bị trước khi tải — từ chối tải nếu không đủ dung lượng khả dụng và thông báo rõ ràng cho người lớn | Tránh làm đầy bộ nhớ gây treo trình duyệt hoặc lỗi hệ thống |

## 7. Data

**Đọc:** `curricula`, `curriculum_items`, `game_levels`, `entitlements`.
**Ghi:** `telemetry_events`, `mastery_state`, `audit_logs`.

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `pack_id` | string | Định danh gói (ví dụ: `PACK-W03`) |
| `content_version` | integer | Phiên bản nội dung được ghim |
| `lease_expires_at` | timestamp | Mặc định: thời điểm cấp + 7 ngày |
| `assets_count` | integer | Tổng số tệp tin trong gói |
| `total_size_bytes` | integer | Tổng dung lượng nén của gói |
| `checksum_sha256` | string | Mã băm toàn vẹn của manifest |

## 8. API contract

### `GET /api/users/curricula/{uuid}/offline-pack`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Query | `week`: integer (1..42) |
| 200 | `{ "pack_id": string, "lease_token": string, "expires_at": string, "assets": Array<{ "path": string, "size": number, "sha256": string }> }` |
| 403 | `ENTITLEMENT_REQUIRED` — Cần gói Standard/Premium để tải offline |
| 404 | `NOT_FOUND` — Không tìm thấy curriculum hoặc tuần học |

### `POST /api/users/offline/sync`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Body | `{ "events": Array<{ "session_uuid": string, "seq": number, "event_name": string, "payload": object }> }` |
| 200 | `{ "synced_count": number, "duplicates_skipped": number }` |
| 400 | `VALIDATION_FAILED` — Danh sách sự kiện không đúng định dạng |

## 9. Acceptance criteria

```gherkin
Scenario: BR-OCP-02 — chỉ User có entitlement mới được cấp manifest tải offline
  Given User chỉ có quyền free
  When gọi GET /api/users/curricula/CUR-001/offline-pack?week=1
  Then hệ thống trả mã lỗi 403
  And mã lỗi là ENTITLEMENT_REQUIRED

Scenario: BR-OCP-04 — xác thực toàn vẹn manifest gói offline
  Given gói offline PACK-W01 được tải về máy client
  When một tệp âm thanh bị lỗi tải dở và sai checksum sha256
  Then client đánh dấu gói là OFFLINE_PACK_CORRUPTED
  And không cho phép kích hoạt phiên chơi offline cho tuần này

Scenario: BR-OCP-06 — đồng bộ tiến độ offline an toàn và khử trùng lặp
  Given thiết bị tích luỹ 15 sự kiện chơi trong lúc mất mạng
  When thiết bị có mạng trở lại và gọi POST /api/users/offline/sync
  Then hệ thống ghi nhận đúng 15 sự kiện vào telemetry_events
  And cập nhật điểm số và mastery_state cho trẻ tương ứng
```

## 10. Boundaries

**Always**
- Kiểm tra dung lượng bộ nhớ khả dụng của thiết bị trước khi bắt đầu tải tệp.
- Giới hạn thời gian lease offline tối đa không quá 7 ngày kể từ lần kết nối mạng cuối.
- Xác thực checksum sha256 cho toàn bộ assets của gói học tập.

**Ask first**
- Tăng kích thước tối đa cho phép của một gói học tập offline vượt quá 100 MB.
- Thay đổi thời hạn hiệu lực của lease token offline.

**Never**
- Cho phép trẻ em tự động bấm tải gói ngoại tuyến từ giao diện Game Zone.
- Cache các dữ liệu định danh PII hoặc thông tin thanh toán vào bộ nhớ offline.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Dung lượng tối đa khuyến nghị cho mỗi gói tuần học tập offline là bao nhiêu MB (25MB, 50MB hay 100MB)? | Thiết kế asset nén | P5 | Infra |
| 2 | Trình duyệt iOS Safari có giới hạn hạn mức lưu trữ IndexedDB nghiêm ngặt sau 7 ngày không dùng — xử lý cảnh báo thế nào? | UX thông báo | P5 | Studio UI |
