---
spec: CONTENT-TAGGING
title: Gắn thẻ nội dung ba trục
area: content
status: implemented
mvp: true
phase: P1
reviewed: 2026-10-18
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
| Dev | Định nghĩa từ vựng ba trục (`content_tags`) |
| Người biên soạn & AI agent IDE (lúc soạn seeder) | Gắn tag trong seeder nội dung; **người xác nhận lúc review PR** |
| User | Tag tự do **chỉ** trong My Library cá nhân (`user_tags`) |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/content-build/src/seed-master/content-tags.ts` | Từ vựng `content_tags` |
| `packages/db/src/schema/tagging.ts` | Schema bảng `content_tags`, `content_tag_map`, `content_skill_map`, `user_tags` |
| `01-platform/content-search.md` | Tiêu thụ tag |

## 4. Main flow

1. Người biên soạn khai báo nội dung (`game_level` hoặc `curriculum`) trong seeder và chọn skill mục tiêu.
2. Khai báo tag ba trục (`what`, `thinking`, `mechanic`) và `theme` từ bộ từ vựng đóng.
3. Gắn `content_skill_map` với `weight` cho từng skill.
4. Cổng tự động (`seed:check`) kiểm tra: ≥1 skill, ≥1 tag mỗi trục, từ vựng hợp lệ.
5. Seeder nạp cứng vào `content_tag_map` và `content_skill_map` theo `(entity_type, entity_id)` trong đó `entity_type ∈ {game_level, curriculum}` và `entity_id` là `id` của bảng đích.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Tag không có trong từ vựng | Cổng seed (`seed:check`) báo lỗi — từ vựng là danh sách đóng |
| Tag do User tạo | Sống trong `user_tags`, không vào `content_tags` |
| Skill phụ | `weight` thấp (0.2–0.5), ảnh hưởng mastery ít hơn |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TAG-01` | Từ vựng ba trục là danh sách đóng (`content_tags`) | Tag tự do biến tìm kiếm thành đoán |
| `BR-TAG-02` | Mọi nội dung (`game_level`) có ≥1 tag **mỗi trục** | Thiếu một trục là mất một chiều lọc |
| `BR-TAG-03` | `content_skill_map.weight ∈ (0,1]` — 1.0 mục tiêu chính, 0.3 có chạm tới | Không có nó, một game đếm "dạy" mọi skill nó chạm tới |
| `BR-TAG-04` | Mỗi nội dung có **đúng một** skill `weight = 1.0` | Hai mục tiêu chính là không có mục tiêu chính |
| `BR-TAG-05` | Tag do User tạo Cấm — **NEVER** vào catalog công khai | Tag tự do không qua kiểm duyệt từ vựng — một User đặt tên xúc phạm hay sai chính tả mà lọt vào tìm kiếm công khai thì cả hệ thống thừa hưởng lỗi cá nhân đó |
| `BR-TAG-06` | AI **đề xuất** tag trong seeder, người **xác nhận** qua PR review | Tag sai làm nội dung không tìm thấy hoặc tìm nhầm |
| `BR-TAG-07` | `content_tag_map` và `content_skill_map` là FK polymorphic với `entity_type ∈ {game_level, curriculum}` → **bắt buộc** test bắt orphan | [`data-model-overview.md`](../00-foundation/data-model-overview.md) `BR-DM-04` |

## 7. Data

### 7.1 Ba trục — từ vựng đóng

| Trục | Giá trị |
|---|---|
| **what** | `number` `quantity` `geometry` `space` `pattern` `colour` `size` `category` `sequence` `time` `money` `rule` `letter` `sound` |
| **thinking** | `observe` `compare` `sort` `match` `sequence` `infer` `predict` `plan` `recall` `inhibit` `shift` `count` |
| **mechanic** | `tap-select` `tap-select-multi` `drag-to-container` `sort-groups` `pair-match` `sequence-order` `number-bond` `drag-to-slot` `clue-deduction` `substitution` `matrix-choice` `flash-recall` `maze-route` `balance-scale` `sudoku-mini` `clock-hands` `block-stack` `listen-respond` `rotate-transform` `memory-flip` `mirror-complete` `hidden-object` `construct` `trace-path` `spot-difference` `go-nogo` `rule-switch` `tap-count` `remove-from-set` `measure-with-unit` `coin-compose` `pour-quantity` `weave-grid` `beat-sequence` `command-sequence` `free-create` |

Trục `mechanic` suy ra từ `mechanic` của template — không nhập tay. Ba mươi sáu giá trị
khớp một–một với 36 engine ở [`engines/index.md`](../01-platform/engines/index.md).

### 7.2 Tag chủ đề (trục thứ tư) — chủ đã chuyển

Trục `theme` **không còn thuộc file này**. Từ vựng, trần tập trung, và cổng cưỡng chế đã
chuyển sang [`content-theme-registry.md`](content-theme-registry.md) (Task #113/#119,
2026-08-29). File này giữ nguyên ba trục sư phạm `what`, `thinking`, `mechanic`.

Nguồn sự thật duy nhất cho từ vựng chủ đề định nghĩa tại
`packages/shared/src/constants/content-themes.ts` (`BR-CTR-12`).

Lưu trong `content_tags` với `axis = 'theme'` — cột `axis` của
[`schema-content-taxonomy.md`](../01-platform/schema-content-taxonomy.md) §7.2 khai đúng 4 giá trị
(`what`\|`thinking`\|`mechanic`\|`theme`).

### 7.3 Bảng (`packages/db/src/schema/tagging.ts`)

| Bảng | Nội dung |
|---|---|
| `content_tags` | `id` `code` `axis` `label` `status` |
| `content_tag_map` | `(entity_type, entity_id, tag_id)` — `entity_type` thuộc enum `content_entity_type` (`game_level`\|`curriculum`), `entity_id` trỏ trực tiếp tới `id` của bảng đích |
| `content_skill_map` | `(entity_type, entity_id, skill_id, weight)` — `entity_type` thuộc enum `content_entity_type` (`game_level`\|`curriculum`), `entity_id` trỏ trực tiếp tới `id` của bảng đích |
| `user_tags` | `(user_id, label)` — tách hoàn toàn, chỉ My Library |

Đã xóa `content_objective_map`.

## 8. API contract

### `GET /api/guest/tags`

200 → từ vựng ba trục + tag chủ đề. Cache `public, max-age=3600`.

Đã xóa route authoring `PUT /api/managers/content/{type}/{id}/tags` (mọi tag nội dung được nạp cứng qua seeder).

## 9. Acceptance criteria

```gherkin
Scenario: BR-TAG-01 — tag ngoài từ vựng bị từ chối ở cổng seed
  When một game level trong seeder gắn tag "fun_stuff"
  Then cổng seed:check fail

Scenario: BR-TAG-02 — yêu cầu đủ ba trục
  Given một game level trong seeder thiếu tag trục thinking
  When chạy cổng seed:check
  Then cổng fail và chỉ ra thiếu trục thinking

Scenario: BR-TAG-04 — đúng một skill chính
  When một game level gắn hai skill cùng weight 1.0
  Then cổng seed:check fail

Scenario: BR-TAG-03 — weight điều tiết mastery
  Given một level gắn skill A weight 1.0 và skill B weight 0.3
  When trẻ hoàn thành level với kết quả tốt
  Then p_learn của A tăng nhiều hơn p_learn của B

Scenario: BR-TAG-05 — tag của user không ra công khai
  Given user tạo tag riêng trong My Library
  When guest gọi GET /api/guest/tags
  Then tag đó không xuất hiện

Scenario: BR-TAG-07 — orphan tag map bị bắt
  Given một hàng content_tag_map trỏ tới entity_id không tồn tại
  When chạy integration test toàn vẹn
  Then test fail
```

## 10. Boundaries

**Always**
- Kiểm tag thuộc từ vựng đóng qua cổng tự động trước khi seed.
- Đúng một skill `weight = 1.0`.
- Suy `mechanic` từ template.
- `content_entity_type` chỉ gồm `game_level` và `curriculum`.

**Ask first**
- Thêm giá trị vào một trục.
- Thêm trục thứ năm.

**Never**
- Tag tự do trong catalog công khai.
- AI tự phát hành tag không qua PR review.
- Tag của User trộn vào `content_tags`.
- Thêm lại `content_objective_map` hoặc API sửa tag từ Studio.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Từ vựng `what` và `thinking` đã đủ phủ 230 skill chưa? Cần đối chiếu. **Không chặn approve spec này** — từ vựng là Lớp 1, mở rộng qua PR như mọi hằng số Lớp 1 khác, không phải quyết định kiến trúc | [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) — lộ ra khi seeder thật cố gắn tag cho 230 skill | P1 | hoãn — đo được khi seed |
| 2 | `weight` do người đặt hay suy từ mức độ khớp LO? | [`adaptive-engine.md`](../01-platform/adaptive-engine.md) | P3 | hoãn — P3, engine chưa tồn tại |
| 3 | Trục `what` có 160 trên 239 lượt gắn nằm ngoài từ vựng, toàn chữ viết tắt tự phát. Gắn lại tag cho corpus theo 14 giá trị đang có, hay nâng danh sách viết tắt lên thành từ vựng? | `BR-ECD-04` (đa dạng trục nội dung) của [`engine-content-depth.md`](engine-content-depth.md) không đo được | P4 | người quyết |
