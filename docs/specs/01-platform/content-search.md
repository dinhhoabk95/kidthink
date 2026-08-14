---
spec: CONTENT-SEARCH
title: Tìm kiếm và lọc nội dung
area: platform
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Tập bộ lọc chuẩn
  - Quy tắc lọc theo quyền
  - Xếp hạng kết quả
depends_on:
  - CONTENT-TAGGING
  - ACCESS-LADDER
---

# Tìm kiếm và lọc nội dung

## 1. Objective

Một mặt tìm kiếm dùng chung cho catalog công khai, thư viện của User, và studio của Manager.
Ba bề mặt, cùng một bộ lọc, khác nhau ở **phạm vi quyền** và **trạng thái nội dung thấy
được**.

## 2. Actors

| Actor | Thấy trạng thái | Thấy bậc |
|---|---|---|
| Guest | `published` | metadata mọi bậc, nội dung chỉ `free` |
| User | `published` | theo `allowedTiers()` |
| Manager | mọi trạng thái | mọi bậc |

## 3. Entry points

| Route | |
|---|---|
| `GET /api/guest/levels` | Catalog công khai |
| `GET /api/users/levels` | Có ngữ cảnh quyền |
| `GET /api/managers/levels` | Mọi trạng thái |
| `GET /api/{ns}/lessons` · `/curricula` | Cùng bộ lọc |

## 4. Main flow

1. Parse query bằng Zod, ép trần `limit`.
2. Dựng điều kiện: trạng thái theo actor · bậc theo `allowedTiers()` · bộ lọc §7.1.
3. Truy vấn với index phù hợp, phân trang bằng cursor.
4. Với mỗi kết quả bị chặn bậc: trả **metadata + cờ `locked`**, không trả `content_pack`.
5. Xếp hạng §7.2.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Không kết quả | Trả rỗng + gợi ý nới bộ lọc nào |
| Truy vấn text có ký tự đặc biệt | Parameterize, không nối chuỗi |
| Lọc theo bậc cao hơn quyền | Trả kết quả kèm `locked: true` — để bán được |
| `limit` quá trần | Ép về trần, không lỗi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SRC-01` | Nội dung bị chặn bậc vẫn **hiện trong kết quả** kèm `locked`, nhưng không kèm `content_pack` | Người dùng phải thấy được thứ mình đang bỏ lỡ để có lý do nâng cấp |
| `BR-SRC-02` | Trần `limit` ép ở **server** — level ≤ 60, lesson ≤ 40, admin ≤ 100 | Query không trần hạ instance trên t3.small |
| `BR-SRC-03` | Zod parse **mọi** query param, kể cả route chỉ đọc | Param đi vào `ilike`/`gte` là đường vào injection |
| `BR-SRC-04` | Phân trang bằng **cursor**, không offset ở bảng lớn | Offset sâu quét toàn bảng |
| `BR-SRC-05` | Guest không thấy nội dung khác `published` | Bảo vệ tính bảo mật của nội dung chưa chính thức phát hành |
| `BR-SRC-06` | Cấm — **NEVER cache** kết quả có nội dung trả phí | [`access-ladder.md`](../00-foundation/access-ladder.md) `BR-LAD-09` |
| `BR-SRC-07` | Tìm text hoạt động **cả có dấu lẫn không dấu** tiếng Việt | Người dùng gõ không dấu là mặc định |

## 7. Data

### 7.1 Bộ lọc chuẩn

| Tham số | Kiểu | Áp cho |
|---|---|---|
| `q` | text | title, description, tag |
| `age_min` `age_max` | int 3–6 | mọi |
| `competency` | `C1..C6` | mọi |
| `strand` `skill` | code | mọi |
| `learning_objective` | code | mọi |
| `difficulty` | 1–5 | level |
| `duration_max` | phút | lesson |
| `what` `thinking` `mechanic` | tag | mọi |
| `theme` | tag chủ đề | level |
| `access_tier` | enum | mọi |
| `template` | mã GT (ví dụ `GT-003`) | level |
| `status` | enum | **chỉ** admin |
| `curriculum` | code | mọi |
| `sort` | `relevance` \| `newest` \| `popular` \| `difficulty` | |

### 7.2 Xếp hạng mặc định (`relevance`)

1. Khớp text ở title > tag > description.
2. Nội dung **mở được** với quyền hiện tại xếp trên nội dung `locked`.
3. Khớp band tuổi của `active_child_id` xếp trên.
4. Lượt chơi cao hơn xếp trên (từ `level_daily_stats`).
5. Mới hơn xếp trên.

Quy tắc 2 quan trọng: đẩy nội dung `locked` lên đầu làm catalog trông như một paywall,
không phải một thư viện.

### 7.3 Index cần có

`game_levels(status, access_tier, age_min, age_max)` ·
`content_tag_map(tag_id, entity_type)` ·
`content_skill_map(skill_id, entity_type)` ·
GIN trên `to_tsvector('simple', unaccent(title || ' ' || description))`.

MVP dùng Postgres full-text với `unaccent`. Cấm thêm search engine riêng — một dịch vụ
nữa để vận hành không đáng cho 120 level.

## 8. API contract

### `GET /api/users/levels`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Query | §7.1 |
| 200 | `{ items: [{ code, title, thumbnail_emoji, competency, age_min, age_max, difficulty, access_tier, locked }], next_cursor }` |
| 422 | `VALIDATION_FAILED` |

`items[].locked = true` → không có `content_pack`, không có `difficulty_params`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SRC-01 — nội dung khoá hiện nhưng không kèm nội dung
  Given user standard tìm level không lọc bậc
  When kết quả chứa level premium
  Then item đó có locked = true
  And item đó không có content_pack

Scenario: BR-SRC-02 — trần limit ép ở server
  When gọi GET /api/users/levels?limit=5000
  Then số item trả về không vượt 60

Scenario: BR-SRC-03 — ký tự đặc biệt không gây lỗi SQL
  When gọi tìm kiếm với q chứa dấu nháy đơn và phần trăm
  Then trả 200
  And không lỗi SQL

Scenario: BR-SRC-07 — tìm không dấu ra kết quả
  Given một level tên "Đếm quả táo"
  When tìm với q = "dem qua tao"
  Then level đó xuất hiện trong kết quả

Scenario: BR-SRC-05 — guest không thấy draft
  Given tồn tại level ở trạng thái draft
  When guest tìm kiếm
  Then level đó không xuất hiện

Scenario: xếp hạng ưu tiên nội dung mở được
  Given user standard tìm kiếm
  When kết quả có cả level standard và premium
  Then level standard xuất hiện trước

Scenario: BR-SRC-06 — không cache kết quả trả phí
  Given user premium tìm kiếm
  When đọc header response
  Then Cache-Control chứa no-store
```

## 10. Boundaries

**Always**
- Zod parse mọi query param.
- Ép trần `limit` ở server.
- Phân trang cursor.
- Trả `locked` thay vì ẩn nội dung trả phí.

**Ask first**
- Thêm bộ lọc mới.
- Đổi thuật toán xếp hạng.
- Thêm search engine ngoài Postgres.

**Never**
- Nối chuỗi vào truy vấn.
- Trả `content_pack` của nội dung `locked`.
- Cache kết quả có nội dung trả phí.
- Cho guest thấy trạng thái khác `published`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Postgres full-text đủ tới bao nhiêu nội dung? | Ngưỡng nâng cấp search engine — chịu tải tốt tới 50.000 items | Sau MVP | Infra |
| ~~2~~ | ~~Tìm kiếm ngữ nghĩa (embedding) thuộc add-on AI hay tính năng chung?~~ **Đã chốt 2026-08-05 (`D-CQ`)**: add-on AI (`use_ai_search`), không đưa vào tìm kiếm cơ bản này. Spec: [`07-addon/semantic-search`](../07-addon/semantic-search.md) | — | Đã đóng | D-CQ |

