---
spec: CONTENT-TAGGING
title: Gắn thẻ nội dung ba trục
area: platform
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Từ vựng ba trục what/thinking/mechanic
  - content_skill_map và weight
  - Quy tắc tag hệ thống vs tag tự do
depends_on:
  - TAXONOMY-SERVICE
  - GLOSSARY
---

# Gắn thẻ nội dung ba trục

## 1. Objective

Một asset **không** gắn vào một kỹ năng duy nhất. Nó gắn trên **ba trục độc lập** —
học *cái gì*, rèn *cách nghĩ* nào, chơi *bằng cách nào*.

Hệ quả: một template phục vụ hàng chục mục tiêu học tập, và tìm kiếm nội dung trả lời được
câu hỏi thật của người soạn bài ("game phân loại cho trẻ 4 tuổi rèn suy luận") thay vì chỉ
lọc theo một cây.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Dev | Định nghĩa từ vựng ba trục (Lớp 1) |
| Manager | Gắn tag khi soạn nội dung |
| AI agent IDE (lúc soạn seeder) | Đề xuất tag trong file; **người xác nhận lúc review PR** |
| User | Tag tự do **chỉ** trong My Library cá nhân |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/db/src/seed-master/content-tags.ts` | Từ vựng Lớp 1 |
| `06-admin/game-level-studio.md` | Gắn tag |
| `01-platform/content-search.md` | Tiêu thụ tag |

## 4. Main flow

1. Manager soạn nội dung, chọn skill mục tiêu.
2. Hệ thống **gợi ý** tag ba trục từ skill đã chọn.
3. Manager xác nhận hoặc sửa.
4. Gắn `content_skill_map` với `weight` cho từng skill.
5. Cổng publish kiểm: ≥1 skill, ≥1 LO, ≥1 tag mỗi trục.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Tag không có trong từ vựng | **422** — từ vựng là danh sách đóng |
| Tag do User tạo | Sống trong `user_tags`, không vào `content_tags` |
| Skill phụ | `weight` thấp (0.2–0.5), ảnh hưởng mastery ít hơn |
| Đổi skill của nội dung `published` | Bump version — [`content-versioning.md`](../00-foundation/content-versioning.md) §7.2 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TAG-01` | Từ vựng ba trục là **Lớp 1**, danh sách đóng | Tag tự do biến tìm kiếm thành đoán |
| `BR-TAG-02` | Mọi nội dung `published` có ≥1 tag **mỗi trục** | Thiếu một trục là mất một chiều lọc |
| `BR-TAG-03` | `content_skill_map.weight ∈ [0,1]` — 1.0 mục tiêu chính, 0.3 có chạm tới | Không có nó, một game đếm "dạy" mọi skill nó chạm tới |
| `BR-TAG-04` | Mỗi nội dung có **đúng một** skill `weight = 1.0` | Hai mục tiêu chính là không có mục tiêu chính |
| `BR-TAG-05` | Tag do User tạo Cấm — **NEVER** vào catalog công khai | Tag tự do không qua kiểm duyệt từ vựng — một User đặt tên xúc phạm hay sai chính tả mà lọt vào tìm kiếm công khai thì cả hệ thống thừa hưởng lỗi cá nhân đó |
| `BR-TAG-06` | AI **đề xuất** tag, người **xác nhận**. Cấm tự gắn | Tag sai làm nội dung không tìm thấy hoặc tìm nhầm |
| `BR-TAG-07` | `content_tag_map` là FK polymorphic → **bắt buộc** test bắt orphan | [`data-model-overview.md`](data-model-overview.md) `BR-DM-04` — FK đa hình không ép được ở Postgres, nên đây là 1 trong 9 chỗ đóng phải có integration test, không phải khuyến nghị |

## 7. Data

### 7.1 Ba trục — từ vựng đóng

| Trục | Giá trị |
|---|---|
| **what** | `number` `quantity` `geometry` `space` `pattern` `colour` `size` `category` `sequence` `time` `money` `rule` `letter` `sound` |
| **thinking** | `observe` `compare` `sort` `match` `sequence` `infer` `predict` `plan` `recall` `inhibit` `shift` `count` |
| **mechanic** | `tap-select` `tap-select-multi` `drag-to-container` `sort-groups` `pair-match` `sequence-order` `number-bond` `drag-to-slot` `clue-deduction` `substitution` `matrix-choice` `flash-recall` `maze-route` `balance-scale` `sudoku-mini` `clock-hands` `block-stack` `listen-respond` `rotate-transform` `memory-flip` `mirror-complete` `hidden-object` `construct` `trace-path` `spot-difference` `go-nogo` `rule-switch` |

Trục `mechanic` suy ra từ `game_templates.mechanic` — không nhập tay. Hai mươi bảy giá trị
khớp một–một với 27 engine ở [`engines/index.md`](engines/index.md).

**Độ trôi đo ngày 2026-08-29 trên 228 game level:**

| Trục | Lượt gắn trong từ vựng | Lượt gắn ngoài | Giá trị ngoài | Giá trị trong từ vựng chưa dùng |
|---|---:|---:|---|---|
| `thinking` | 284 | **0** | không có | không có |
| `what` | 79 | **160** | `mem` `cnt` `shp` `voc` `spt` `pat` `cmp` `cls` `fnc` `log` `msr` | `quantity` `pattern` `size` `money` `letter` |

Trục `thinking` đã được đóng thật kèm ca âm bởi `BR-TCM-01` (từ vựng đóng thật) và số đo
chứng minh điều đó. Mười một giá trị ngoài của trục `what` là chữ viết tắt của
`seed-master/content-tags.ts` (`mem` cho trí nhớ, `cnt` cho đếm, `shp` cho hình), không phải
khái niệm mới.

**Trục `what` có cổng, nhưng cổng đó ép trên một bộ khác.** `CANONICAL_WHAT_TAGS` ở
`packages/db/tests/gates/thinking-coverage.ts` chứa **28** giá trị: 14 của mục 7.1 này cộng
14 chữ viết tắt của Lớp 1, kèm chú thích `// DB seed-master abbreviations`. Vì vậy cổng xanh
trong khi corpus dùng lẫn hai bộ.

Cùng file đó **đã từ chối** làm đúng như vậy cho trục `thinking`: 12 giá trị viết tắt của Lớp
1 từng được thêm vào rồi bị gỡ, với lý do ghi ngay trong mã nguồn — *"đúng thứ AGENTS.md cấm:
không nới rule chỉ để code hiện tại qua được cổng"*. Trục `thinking` do đó đóng thật và corpus
sạch. Trục `what` giữ nguyên phần nới. Đó là toàn bộ chênh lệch giữa 0 và 160 ở bảng trên.

Xem câu hỏi 3 ở mục 11.

### 7.2 Tag chủ đề (trục thứ tư) — chủ đã chuyển

Trục `theme` **không còn thuộc file này**. Từ vựng, trần tập trung, và cổng cưỡng chế đã
chuyển sang [`content-theme-registry.md`](../05-content/content-theme-registry.md) (Task #113,
2026-08-29). File này giữ nguyên ba trục sư phạm `what`, `thinking`, `mechanic`.

Vì sao chuyển: mười hai giá trị từng nằm ở đây (`animal` `fruit` `vegetable` `vehicle` `shape`
`family` `school` `weather` `festival` `body` `food` `nature`) là một danh sách không ai sở
hữu và không cổng nào ép — `BR-TAG-02` (mỗi nội dung `published` có ≥1 tag mỗi trục) cố ý chỉ
ép ba trục sư phạm. Đo ngày 2026-08-29: **100 trên 228** game level mang giá trị ngoài danh
sách đó, và giá trị dùng nhiều thứ hai toàn corpus (`farm`, 42 level) nằm ngoài. Một danh
sách không có chủ và không có cổng là một danh sách sẽ trôi.

Lưu trong `content_tags` với `axis = 'theme'` — cột `axis` của
[`schema-content-taxonomy.md`](schema-content-taxonomy.md) §7.2 khai đúng 4 giá trị
(`what`\|`thinking`\|`mechanic`\|`theme`); đây vẫn là chỗ giá trị thứ tư đó được dùng, và ràng
buộc trên nó nay đọc ở spec mới.

### 7.3 Bảng

| Bảng | Nội dung |
|---|---|
| `content_tags` | `code` `axis` `label` `status` — Lớp 1 |
| `content_tag_map` | `(entity_type, entity_id, tag_id)` |
| `content_skill_map` | `(entity_type, entity_id, skill_id, weight)` |
| `user_tags` | `(user_id, label)` — tách hoàn toàn, chỉ My Library |

## 8. API contract

### `GET /api/guest/tags`

200 → từ vựng ba trục + tag chủ đề. Cache `public, max-age=3600`.

### `PUT /api/managers/content/{type}/{id}/tags`

| | |
|---|---|
| Auth | `requireManagerAuth()` |
| Body | `{ tags: string[], skills: [{skill_code, weight}] }` |
| 200 | |
| 422 | `VALIDATION_FAILED` — tag ngoài từ vựng, hoặc không có skill `weight = 1.0` |
| 409 | `CONTENT_IMMUTABLE` — nội dung đã published |

## 9. Acceptance criteria

```gherkin
Scenario: BR-TAG-01 — tag ngoài từ vựng bị từ chối
  When gắn tag "fun_stuff" cho một game level
  Then trả 422

Scenario: BR-TAG-02 — publish yêu cầu đủ ba trục
  Given một game level thiếu tag trục thinking
  When manager publish
  Then trả 422 PUBLISH_CHECKLIST_FAILED
  And missing chứa "tag_axis_thinking"

Scenario: BR-TAG-04 — đúng một skill chính
  When gắn hai skill cùng weight 1.0
  Then trả 422

Scenario: BR-TAG-03 — weight điều tiết mastery
  Given một level gắn skill A weight 1.0 và skill B weight 0.3
  When trẻ hoàn thành level với kết quả tốt
  Then p_learn của A tăng nhiều hơn p_learn của B

Scenario: BR-TAG-05 — tag của user không ra công khai
  Given user tạo tag riêng trong My Library
  When guest gọi GET /api/guest/tags
  Then tag đó không xuất hiện

Scenario: BR-TAG-07 — orphan tag map bị bắt
  Given một hàng content_tag_map trỏ tới entity không tồn tại
  When chạy integration test toàn vẹn
  Then test fail
```

## 10. Boundaries

**Always**
- Kiểm tag thuộc từ vựng đóng ở server.
- Đúng một skill `weight = 1.0`.
- Suy `mechanic` từ template.

**Ask first**
- Thêm giá trị vào một trục.
- Thêm trục thứ năm.
- Đổi `weight` của nội dung đã published.

**Never**
- Tag tự do trong catalog công khai.
- AI tự gắn tag không qua người.
- Tag của User trộn vào `content_tags`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Từ vựng `what` và `thinking` đã đủ phủ 230 skill chưa? Cần đối chiếu. **Không chặn approve spec này** — từ vựng là Lớp 1, mở rộng qua PR như mọi hằng số Lớp 1 khác, không phải quyết định kiến trúc | [`content-seed-authoring.md`](content-seed-authoring.md) — lộ ra khi seeder thật cố gắn tag cho 230 skill | P1 | hoãn — đo được khi seed |
| 2 | `weight` do người đặt hay suy từ mức độ khớp LO? | [`adaptive-engine.md`](adaptive-engine.md) | P3 | hoãn — P3, engine chưa tồn tại |
| 3 | Trục `what` có 160 trên 239 lượt gắn nằm ngoài từ vựng, toàn chữ viết tắt tự phát. Gắn lại tag cho corpus theo 14 giá trị đang có, hay nâng danh sách viết tắt lên thành từ vựng? Bản published bất biến nên mọi cách đều là INSERT version mới | `BR-ECD-04` (đa dạng trục nội dung) của [`engine-content-depth.md`](../05-content/engine-content-depth.md) không đo được | P4 | người quyết |
