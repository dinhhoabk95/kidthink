---
spec: STICKER-DIORAMA
title: Sân chơi dán sticker bối cảnh — bày tranh sáng tạo từ bộ sưu tập của trẻ
area: play
status: implemented
mvp: false
phase: P4
reviewed: 2026-11-15
owns:
  - Trải nghiệm tương tác chạm phát tiếng và kéo bày sticker lên bức tranh chủ đề tại `/play/stickers`
  - Bảng lưu toạ độ bày sticker trên tranh (`child_sticker_placements`)
  - API đọc và lưu bố cục tranh sticker (`GET` / `PUT /api/users/play/sticker-diorama`)
depends_on:
  - STICKER-ALBUM
  - CONTENT-THEME-REGISTRY
  - PLAY-NARRATION
  - PARENT-GATE
---

# Sân chơi dán sticker bối cảnh — bày tranh sáng tạo từ bộ sưu tập của trẻ

## 1. Objective

[`sticker-album.md`](sticker-album.md) trao cho trẻ một sticker kỷ niệm sau mỗi phiên hoàn thành, nhưng việc chỉ hiển thị danh sách tĩnh làm trẻ xem xong trong vài giây rồi rời trang.

Spec này nâng cấp trang `/play/stickers` thành **Sân chơi dán sticker bối cảnh (Sticker Diorama)** lấy cảm hứng từ *Sago Mini* và *Khan Academy Kids*: trẻ vừa xem lại bộ sưu tập của mình, vừa **chạm vào từng sticker để nghe đọc tên tiếng Việt kèm hiệu ứng nảy đàn hồi**, vừa **kéo sticker đặt lên bức tranh phong cảnh chủ đề** (Nông trại, Trường học, Động vật, Thiên nhiên, Đại dương, Vũ trụ...) để tự tay tạo nên bức tranh kỷ niệm riêng mà không bao giờ làm mất sticker gốc.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động (`active_child_id`) | Chạm sticker nghe đọc tên, kéo bày hoặc cất sticker trên tranh chủ đề |
| Người lớn | Cổng phụ huynh | Thoát khỏi khu vực `/play` về bề mặt người lớn |
| Server | — | Kiểm chứng trẻ thực sự sở hữu sticker trong `child_stickers` trước khi lưu vị trí bày |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/play/stickers` | Trẻ | Trang album kiêm sân chơi bối cảnh sticker, layout `kid` |
| `GET /api/users/play/sticker-diorama` | Trẻ | Tải bố cục vị trí sticker đã bày trên các chủ đề của trẻ |
| `PUT /api/users/play/sticker-diorama` | Trẻ | Lưu bố cục vị trí sticker trên một bức tranh chủ đề |

## 4. Main flow

1. Trẻ mở `/play/stickers`. Trang gọi song song `GET /api/users/play/stickers` (sở hữu bởi [`sticker-album.md`](sticker-album.md)) và `GET /api/users/play/sticker-diorama`.
2. Nếu trẻ đã có sticker, trang mở chủ đề đầu tiên trong album cùng **Bức tranh bối cảnh chủ đề** phía trên và **Khay gỗ chứa các sticker đã đạt** phía dưới.
3. Khi trẻ **chạm nhẹ (tap)** vào sticker (ở khay hoặc trên tranh): sticker nảy đàn hồi (`squash & stretch`), phát tiếng nhạc vui và đọc to nhãn tiếng Việt (`label`) của sticker đó.
4. Khi trẻ **kéo (drag)** một sticker từ khay thả lên bức tranh (hoặc chạm chọn ở khay rồi chạm vị trí trên tranh — fallback tap-tap cho trẻ 3–4 tuổi): sticker bám vào vị trí `(norm_x, norm_y)` trên tranh kèm hiệu ứng hạt sáng nhỏ.
5. Trạng thái bố cục của chủ đề đang mở được đồng bộ nền (`PUT /api/users/play/sticker-diorama`) để lần sau trẻ mở lại bức tranh vẫn giữ nguyên.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Trẻ chưa có sticker nào | `themes.length === 0` | Giữ nguyên hành vi [`sticker-album.md`](sticker-album.md): hiện Gấu Con thân thiện và nút icon ngôi nhà về Phòng Chơi `/play`, không ô trống |
| Kéo sticker ra khỏi khung tranh về lại khay | Thả bên dưới ranh giới tranh hoặc bấm nút dọn nhẹ trên sticker | Xoá bản bày trên tranh, sticker gốc vẫn nằm nguyên trong khay bộ sưu tập (`BR-SDM-02`) |
| Mạng chập chờn khi đang bày tranh | `PUT` lỗi tạm thời | Giữ nguyên bố cục trên màn hình trẻ đang chơi, không bật popup báo lỗi chữ làm gián đoạn trẻ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SDM-01` | Lưu vị trí bày cảnh ở bảng riêng `child_sticker_placements`; **tuyệt đối không UPDATE hay DELETE bảng `child_stickers`** | Giữ nguyên bất biến INSERT-only `BR-STK-02` của `sticker-album.md` |
| `BR-SDM-02` | Bày sticker lên tranh hoặc gỡ khỏi tranh **không bao giờ làm mất hay tiêu hao sticker** trong bộ sưu tập | Sticker là kỷ niệm vĩnh viễn, không phải vật phẩm tiêu hao (`BR-STK-02`, `BR-STK-03`) |
| `BR-SDM-03` | Server chỉ chấp nhận lưu vị trí cho cặp `(theme_code, emoji)` mà trẻ thực sự đang sở hữu trong `child_stickers` | Ngăn client giả mạo request để bày sticker chưa mở khoá (`BR-SEC-05`) |
| `BR-SDM-04` | Chạm vào bất kỳ sticker nào luôn phát phản hồi âm thanh + đọc tên tiếng Việt (`label`), có fallback âm thanh mộc cầm khi trình duyệt thiếu giọng TTS | `BR-ENG-10`, `BR-PNR-01` — gắn kết vốn từ tiếng Việt theo chủ đề cho trẻ chưa biết đọc |
| `BR-SDM-05` | Hỗ trợ cả hai cử chỉ **kéo-thả** và **chạm-chọn rồi chạm-đích (tap-tap)** trên bức tranh, vùng chạm sticker ≥ 64px CSS | Trẻ 3–4 tuổi chưa vững cử chỉ kéo dài (`07-game-engine.md`) vẫn tự bày tranh được dễ dàng |
| `BR-SDM-06` | Không hiển thị số đếm lượng sticker, phần trăm hoàn thành hay ô trống bóng mờ ở cả khay lẫn bức tranh | Bảo toàn nguyên tắc không săn thưởng của `BR-STK-03` và `BR-PRG-02` |
| `BR-SDM-07` | Giới hạn tối đa 24 vị trí bày trên mỗi chủ đề ở cả client và Zod schema server; toạ độ lưu dạng tỷ lệ chuẩn hoá `norm_x, norm_y ∈ [0.05, 0.95]` | Đảm bảo hiển thị đúng tỷ lệ trên cả tablet ngang lẫn điện thoại dọc và chống payload phình to |

## 7. Data

**Đọc:** `child_profiles`, `child_stickers`, `CONTENT_THEMES`.
**Ghi:** `child_sticker_placements` (upsert/replace theo `(child_profile_id, theme_code)`).

### 7.1 `child_sticker_placements`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigint identity | PK |
| `child_profile_id` | bigint | FK `child_profiles(id)` `ON DELETE CASCADE` |
| `theme_code` | varchar(30) | Mã chủ đề thuộc `CONTENT_THEMES` |
| `emoji` | varchar(16) | Phải tồn tại trong `child_stickers` của cùng trẻ và chủ đề |
| `instance_index` | smallint | `0..23`, cho phép bày các sticker trong giới hạn trần 24 món/tranh |
| `norm_x` | double precision | `0.05 ≤ norm_x ≤ 0.95` |
| `norm_y` | double precision | `0.05 ≤ norm_y ≤ 0.95` |
| `scale` | double precision | `0.75 ≤ scale ≤ 1.35`, mặc định `1.0` |

Unique `(child_profile_id, theme_code, emoji, instance_index)`.

## 8. API contract

### `GET /api/users/play/sticker-diorama`

| | |
|---|---|
| Auth | Phiên User + `requireOwnedActiveChild` |
| Query | `theme` tuỳ chọn — lọc theo mã chủ đề trong `CONTENT_THEMES` |
| 200 | `{ placements_by_theme: Record<string, Array<{ emoji: string, label: string, instance_index: number, norm_x: number, norm_y: number, scale: number }>> }` |
| 428 | `NO_ACTIVE_CHILD` — chưa chọn hồ sơ trẻ hợp lệ |

### `PUT /api/users/play/sticker-diorama`

| | |
|---|---|
| Auth | Phiên User + CSRF `x-csrf-token` + `requireOwnedActiveChild` |
| Body | `{ theme_code: string, placements: Array<{ emoji: string, instance_index: number, norm_x: number, norm_y: number, scale?: number }> }` (tối đa 24 phần tử) |
| 200 | `{ theme_code: string, placements: Array<{ emoji: string, label: string, instance_index: number, norm_x: number, norm_y: number, scale: number }> }` |
| 422 | `VALIDATION_FAILED` — chủ đề không hợp lệ, toạ độ ngoài biên, hoặc `emoji` trẻ chưa sở hữu trong `child_stickers` |
| 428 | `NO_ACTIVE_CHILD` — chưa chọn hồ sơ trẻ hợp lệ |

## 9. Acceptance criteria

```gherkin
Scenario: BR-SDM-01 & BR-SDM-02 — bày và gỡ sticker trên tranh không làm đổi bảng child_stickers
  Given trẻ có 2 hàng trong child_stickers thuộc chủ đề "farm"
  When gọi PUT /api/users/play/sticker-diorama đặt 1 sticker rồi gọi lại với placements rỗng
  Then bảng child_stickers vẫn giữ nguyên đúng 2 hàng ban đầu

Scenario: BR-SDM-03 — từ chối bày sticker trẻ chưa đạt được (ca âm)
  Given trẻ chỉ có sticker "🐮" trong chủ đề "farm"
  When gọi PUT /api/users/play/sticker-diorama với emoji "🚜"
  Then trả 422 VALIDATION_FAILED

Scenario: BR-SDM-05 — hỗ trợ đặt sticker bằng tap-tap trên bề mặt trẻ
  Given trang /play/stickers đang mở chủ đề "farm" có sticker "🐮"
  When trẻ chạm vào sticker "🐮" ở khay rồi chạm vào bức tranh bối cảnh
  Then sticker "🐮" xuất hiện trên bức tranh bối cảnh
```

## 10. Boundaries

**Always**
- Lưu toạ độ chuẩn hoá `[0.05, 0.95]` để không bị tràn mép khi đổi khung màn hình.
- Kiểm tra quyền sở hữu sticker từ `child_stickers` trên server trước mọi thao tác ghi.

**Ask first**
- Tăng trần quá 24 vật thể trên một bức tranh chủ đề.
- Cho phép xuất bức tranh của trẻ ra file ảnh tải về ở bề mặt người lớn.

**Never**
- Sửa hoặc xoá hàng trong `child_stickers`.
- Hiện con số đếm hoặc bóng mờ các sticker chưa mở khoá.

## 11. Open questions

Không có.
