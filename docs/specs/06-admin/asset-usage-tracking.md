---
spec: ASSET-USAGE-TRACKING
title: Theo dõi nơi asset đang được dùng
area: admin
status: approved
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Truy vấn ngược từ asset về nội dung dùng nó
  - Cảnh báo trước khi xoá asset
depends_on:
  - IMAGE-STORAGE
  - EMOJI-REGISTRY
  - CONTENT-LIFECYCLE
---

# Theo dõi nơi asset đang được dùng

## 1. Objective

Trả lời **"xoá cái này thì hỏng cái gì"** trước khi xoá, không phải sau.

Xoá một ảnh đang được ba game level published dùng sẽ tạo ra ba màn hình lỗi trước mặt trẻ,
và không có cách phát hiện tự động ngoài việc một đứa trẻ gặp phải.

## 2. Actors

`content_reviewer` · `super_admin`.

## 3. Entry points

Modal xác nhận xoá asset · `/studio/assets/{id}/usage` ·
`GET /api/managers/assets/{id}/usage`.

## 4. Main flow

1. Manager định xoá một ảnh (hoặc dev định deprecate một emoji).
2. Hệ thống quét ngược: `content_pack` của mọi `game_levels`, `lessons`, `worksheets`,
   `seo_pages` chứa ref đó.
3. Có nơi dùng → hiện danh sách kèm trạng thái nội dung, **chặn xoá**.
4. Không nơi nào dùng → cho xoá, ghi audit.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chỉ dùng ở bản `archived` | Cho xoá, cảnh báo bản cũ sẽ hỏng preview |
| Dùng ở bản `draft` | Cho xoá, cảnh báo draft sẽ không publish được |
| Dùng ở bản `published` | **Chặn** — 409 |
| Emoji `deprecated` | Cấm xoá khỏi registry, chỉ ẩn khỏi picker |
| Ảnh `orphan` (owner đã xoá) | Job dọn sau 30 ngày |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-AUT2-01` | Xoá asset đang dùng ở nội dung `published` → **409** kèm danh sách | Xoá cứng làm mồ côi nội dung trẻ đang chơi |
| `BR-AUT2-02` | Emoji Cấm — **NEVER xoá cứng** — chỉ `deprecated` | Nội dung đã publish trỏ tới nó |
| `BR-AUT2-03` | Quét ngược trên **`content_pack` JSONB**, có index hỗ trợ | Quét toàn bảng mỗi lần xoá là không chấp nhận được |
| `BR-AUT2-04` | Danh sách nơi dùng hiện **trạng thái nội dung** | Dùng ở `draft` khác dùng ở `published` |
| `BR-AUT2-05` | Ảnh `orphan` dọn tự động sau **30 ngày** | Giữ mãi tốn dung lượng; xoá ngay mất khả năng khôi phục |
| `BR-AUT2-06` | Mọi xoá ghi `audit_logs` | Đảm bảo khả năng truy vết và giải trình theo `BR-AUD-01` đối với mọi thao tác xoá tài nguyên |

## 7. Data

### 7.1 Kết quả truy vấn ngược

```jsonc
{
  "asset_ref": "content/2026/08/ab12cd.webp",
  "used_by": [
    { "entity_type": "game_level", "code": "GL-C1-CNT-MATCH-0007", "version": 3, "status": "published", "title": "Đếm quả táo" },
    { "entity_type": "lesson", "code": "LES-0042", "version": 1, "status": "draft", "title": "…" }
  ],
  "can_delete": false,
  "block_reason": "used_by_published"
}
```

### 7.2 Index hỗ trợ

GIN trên `game_levels.content_pack` để tìm ref trong JSONB, cộng bảng phụ
`content_asset_refs (entity_type, entity_id, asset_kind, asset_ref)` cập nhật khi lưu nội
dung. `entity_id` trỏ đúng hàng version cụ thể (D-AE) — gộp luôn ý nghĩa của
`entity_version` cũ, vì mỗi version giờ là một hàng `id` riêng.

Bảng phụ tồn tại vì quét JSONB toàn bảng ở mỗi lần xoá không mở rộng được — nó là chỉ mục
ngược được duy trì chủ động.

## 8. API contract

### `GET /api/managers/assets/{ref}/usage`

200 → §7.1. Trần 200 nơi dùng.

### `DELETE /api/managers/images/{id}`

200 khi `can_delete`. **409** `CONTENT_IN_USE` + `details.used_by[]`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-AUT2-01 — chặn xoá asset đang dùng
  Given một ảnh dùng bởi một game level published
  When manager xoá ảnh
  Then trả 409 CONTENT_IN_USE
  And danh sách nêu rõ level nào

Scenario: BR-AUT2-04 — hiện trạng thái nơi dùng
  Given một ảnh dùng ở 1 bản published và 2 bản draft
  When xem usage
  Then mỗi mục hiện đúng trạng thái của nó

Scenario: BR-AUT2-02 — emoji không xoá cứng
  When quét route admin
  Then không route nào xoá hàng emoji_registry

Scenario: BR-AUT2-03 — truy vấn ngược đủ nhanh
  Given DB có 3000 game level
  When gọi usage cho một asset
  Then P95 dưới 200 ms

Scenario: chỉ mục ngược cập nhật khi lưu nội dung
  Given một level được sửa để thêm một ảnh mới
  When lưu
  Then content_asset_refs có hàng mới cho ảnh đó

Scenario: BR-AUT2-05 — ảnh orphan dọn sau 30 ngày
  Given một ảnh có owner đã bị xoá 31 ngày trước
  When job dọn chạy
  Then file bị xoá khỏi S3
  And hàng content_images bị xoá
```

## 10. Boundaries

**Always**
- Kiểm nơi dùng trước khi xoá.
- Duy trì chỉ mục ngược khi lưu nội dung.
- Ghi audit mọi xoá.

**Ask first**
- Đổi thời hạn dọn `orphan`.
- Cho xoá asset đang dùng ở `published`.

**Never**
- Xoá cứng emoji.
- Xoá asset đang dùng ở nội dung published.
- Quét JSONB toàn bảng ở đường request.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Chỉ mục ngược có cần rebuild định kỳ để chống lệch không? | P4 | Hoãn sang P4 — thêm script rebuild vào CLI vận hành khi có dữ liệu lớn | người quyết |
