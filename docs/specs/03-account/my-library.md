---
spec: MY-LIBRARY
title: Thư viện cá nhân
area: account
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Lưu và tổ chức nội dung yêu thích
depends_on:
  - CONTENT-SEARCH
  - ENTITLEMENT-MODEL
---

# Thư viện cá nhân

## 1. Objective

Nơi User lưu lại nội dung muốn dùng sau — game hay, bài học phù hợp, chương trình định theo.

Ở MVP đây là **bookmark có tổ chức**, ❌ không phải nơi chứa nội dung do User tạo. Nội dung
tự tạo là add-on, ngoài MVP.

## 2. Actors

User đã đăng nhập.

## 3. Entry points

`/me/library` · nút lưu trên mọi thẻ nội dung ·
`GET /api/users/library` · `POST /api/users/library/items`.

## 4. Main flow

1. Bấm lưu trên một game level, lesson, hoặc curriculum.
2. Vào `/me/library` xem theo loại.
3. Tạo **collection** cá nhân, kéo item vào.
4. Gắn tag cá nhân (`user_tags`) để tìm lại.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Nội dung đã lưu bị archive | Vẫn hiện, gắn nhãn "không còn khả dụng" |
| Nội dung đã lưu bị khoá bậc (gói hết hạn) | Vẫn hiện, gắn khoá + CTA nâng cấp |
| Xoá item khỏi thư viện | Chỉ xoá bookmark, ❌ không ảnh hưởng nội dung |
| Chưa lưu gì | Gợi ý 5 nội dung phù hợp trẻ đang hoạt động |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MLB-01` | Thư viện lưu **tham chiếu**, ❌ không copy nội dung | Copy sẽ drift khi bản gốc đổi |
| `BR-MLB-02` | Lưu được nội dung **chưa mở khoá** | Lưu thứ muốn mua là tín hiệu ý định mua |
| `BR-MLB-03` | `user_tags` **tách hoàn toàn** khỏi `content_tags` | `BR-TAG-05` |
| `BR-MLB-04` | Thư viện **riêng tư**, ❌ không chia sẻ được ở MVP | Chia sẻ kéo theo kiểm duyệt |
| `BR-MLB-05` | Nội dung archived vẫn hiện, gắn nhãn | Xoá âm thầm khỏi thư viện làm người dùng tưởng mất |
| `BR-MLB-06` | Quota collection: **20** ở MVP | |
| `BR-MLB-07` | ❌ **NEVER chứa nội dung do User tạo** ở MVP | Đó là add-on, chưa có |

## 7. Data

### 7.1 Bảng

`library_items`: `(user_id, entity_type, entity_id)` PK ghép · `entity_id` FK `entity_id`
(neo dòng dõi, D-AE) của bảng tương ứng theo `entity_type` — luôn bản `published` mới nhất ·
`collection_id` nullable · `note` nullable · `created_at`.

`collections`: `id` · `user_id` · `name` · `position`.

`user_tags` + `user_tag_map`: tag cá nhân.

### 7.2 Loại lưu được

`game_level` · `lesson` · `curriculum` · `activity`.

Ngoài MVP (add-on): `lesson_plan` · `custom_game`.

### 7.3 Màn hình

Tab theo loại · lưới thẻ · bộ lọc theo collection và tag cá nhân · tìm kiếm trong thư viện.

## 8. API contract

### `GET /api/users/library`

Query `entity_type` `collection_id` `tag` `q`. Trần 100.

### `POST /api/users/library/items`

Body `{ entity_type, entity_id, collection_id? }`. 201. 409 nếu đã lưu.

### `DELETE /api/users/library/items/{entity_type}/{entity_id}`

### `POST /api/users/collections`

Body `{ name }`. 402 nếu vượt 20.

## 9. Acceptance criteria

```gherkin
Scenario: BR-MLB-01 — lưu tham chiếu không copy
  Given user lưu một game level
  When level đó publish version mới với tiêu đề khác
  Then thư viện hiện tiêu đề mới

Scenario: BR-MLB-02 — lưu được nội dung khoá
  Given user gói standard
  When lưu một level premium
  Then lưu thành công
  And thẻ hiện khoá kèm CTA nâng cấp

Scenario: BR-MLB-05 — nội dung archived vẫn hiện
  Given một lesson đã lưu bị archive
  When mở thư viện
  Then lesson vẫn hiện với nhãn không còn khả dụng

Scenario: BR-MLB-03 — tag cá nhân không ra công khai
  Given user tạo tag riêng
  When guest gọi GET /api/guest/tags
  Then tag đó không xuất hiện

Scenario: BR-MLB-04 — thư viện riêng tư
  When quét route
  Then không route nào trả thư viện của user khác

Scenario: BR-MLB-06 — quota collection
  Given user đã có 20 collection
  When tạo cái thứ 21
  Then trả 402

Scenario: xoá bookmark không ảnh hưởng nội dung
  When xoá một item khỏi thư viện
  Then game level đó vẫn tồn tại và vẫn published
```

## 10. Boundaries

**Always**
- Lưu tham chiếu.
- Giữ nội dung archived trong thư viện với nhãn.
- Tách `user_tags` khỏi `content_tags`.

**Ask first**
- Thêm loại nội dung lưu được.
- Đổi quota collection.
- Cho chia sẻ thư viện.

**Never**
- Copy nội dung vào thư viện.
- Trộn tag cá nhân vào catalog công khai.
- Chứa nội dung do User tạo ở MVP.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có cần thư viện riêng theo từng trẻ không, hay chung cho tài khoản? | P3 |
