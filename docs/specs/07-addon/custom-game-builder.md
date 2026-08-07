---
spec: CUSTOM-GAME-BUILDER
title: Công cụ tạo trò chơi cá nhân
area: addon
status: draft
mvp: false
phase: P4
reviewed: 2026-08-04
owns:
  - Luồng User tạo game từ template
  - Ràng buộc validation cho game do User tạo
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - GAME-LEVEL-MODEL
  - ENTITLEMENT-MODEL
---

# Công cụ tạo trò chơi cá nhân

> **Add-on — ❌ không bán ở MVP.**

## 1. Objective

Giáo viên tạo game riêng từ template có sẵn — cùng cơ chế Manager dùng trong studio, nhưng
kết quả **chỉ trẻ của chính User đó chơi được**.

Ranh giới: game do User tạo ❌ **NEVER vào catalog công khai**. Muốn công khai thì qua duyệt
của Manager, và đó là một luồng khác chưa có ở phiên bản này.

## 2. Actors

| Actor | Cần entitlement |
|---|---|
| User | `create_custom_game` |
| Trẻ của User đó | Chơi được |
| Trẻ của User khác | ❌ Không thấy |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CGB-01` | Game do User tạo **chỉ trẻ của User đó** chơi được | ❌ Không có kiểm duyệt; nội dung chưa duyệt ❌ không được tới trẻ khác |
| `BR-CGB-02` | ❌ **NEVER vào catalog công khai** | |
| `BR-CGB-03` | Dùng **cùng `content_contract`** và **cùng validation** với studio | Một bộ luật, ❌ không hai |
| `BR-CGB-04` | Chỉ dùng **emoji registry**; ảnh upload trừ quota `upload_mb` | `BR-EMJ-01` |
| `BR-CGB-05` | Validation §7.1 chạy ở **server** trước khi lưu | Sai schema làm crash engine trước mặt trẻ |
| `BR-CGB-06` | Game custom ❌ **không cập nhật `mastery_state`** | Nội dung chưa kiểm duyệt ❌ không được đẩy dữ liệu học chính thức |
| `BR-CGB-07` | Chỉ **6 template MVP** dùng được | |
| `BR-CGB-08` | Quota `custom_games_saved` theo gói add-on | |
| `BR-CGB-09` | Nội dung do User tạo qua `packages/moderation` trước khi lưu | UGC, dù riêng tư, vẫn tới trẻ |
| `BR-CGB-10` | Áp **mọi ràng buộc biên tập** của `game-level-model` §7.1 | Trẻ 3 tuổi không phân biệt game của ai |

## 7. Data

`custom_games`: `id` · `uuid` · `user_id` · `template_id` · `title` · `instruction` ·
`content_pack` JSONB · `difficulty_params` JSONB · `theme_id` · `age_min` `age_max` ·
`skill_ids` nullable · `status` (`draft`\|`ready`) · `created_at`.

❌ Không `access_tier` — luôn riêng tư. ❌ Không `content_version` — ❌ không có publish công khai.

### 7.1 Validation trước khi lưu `ready`

- `content_pack` parse được bằng `content_contract`
- Có ít nhất một đáp án đúng
- ❌ Không câu hỏi rỗng, ❌ không asset lỗi
- Số item trong trần của template **và** của band tuổi (`game-level-model` §7.1)
- Có band tuổi
- Chỉ dẫn ≤12 từ, ❌ không phủ định
- Qua bộ lọc kiểm duyệt nội dung

## 8. API contract

| Route | Ghi chú |
|---|---|
| `POST /api/users/custom-games` | Tạo, trả về `draft` |
| `PATCH /api/users/custom-games/{uuid}` | |
| `POST /api/users/custom-games/{uuid}/validate` | Chạy §7.1, trả `issues[]` |
| `GET /api/users/custom-games/{uuid}/config` | Chỉ trẻ của chính User |

403 `ENTITLEMENT_REQUIRED` · 402 `QUOTA_EXCEEDED` · 422 `CONTENT_PACK_INVALID`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CGB-01 — chỉ trẻ của User đó chơi được
  Given user A tạo một game custom
  When trẻ của user B mở URL game đó
  Then trả 404

Scenario: BR-CGB-02 — không vào catalog
  When guest duyệt catalog công khai
  Then không game custom nào xuất hiện

Scenario: BR-CGB-06 — không cập nhật mastery
  Given trẻ chơi xong một game custom
  Then mastery_state không đổi
  And play_sessions vẫn ghi để phụ huynh xem

Scenario: BR-CGB-05 — validation ở server
  Given content_pack thiếu đáp án đúng
  When lưu ở trạng thái ready
  Then trả 422

Scenario: BR-CGB-10 — áp ràng buộc biên tập
  Given game custom cho band 3-4 có 8 item
  When validate
  Then báo lỗi vượt trần item của band

Scenario: BR-CGB-04 — chỉ emoji trong registry
  When dùng emoji ngoài registry
  Then trả 422

Scenario: BR-CGB-09 — qua kiểm duyệt nội dung
  Given tiêu đề chứa từ không phù hợp
  When lưu
  Then bị từ chối
```

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có luồng gửi game custom lên duyệt để vào catalog công khai không? | P5 |
| 2 | Quota `custom_games_saved` là bao nhiêu? | Lên catalog |
| 3 | Game custom có nên gắn skill để ít nhất hiện trong "đã tiếp xúc" của báo cáo không? | P4 |
