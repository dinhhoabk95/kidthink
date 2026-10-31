---
spec: SCHEMA-CONTENT-TAXONOMY
title: Schema — taxonomy, nội dung, curriculum
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-10-18
owns:
  - Định nghĩa cột module taxonomy, tagging, game, curriculum
depends_on:
  - DATA-MODEL-OVERVIEW
  - TAXONOMY-SERVICE
  - GAME-TEMPLATE-CONTRACT
---

# Schema — taxonomy, nội dung, curriculum

## 1. Objective

Định nghĩa cột cho bốn module nội dung (`taxonomy`, `tagging`, `game`, `curriculum`). Toàn bộ nội dung (`game_levels`, `curricula`, `skill_datasets`) được gán cứng qua seeder dữ liệu, mỗi `code` là `UNIQUE` (1 dòng duy nhất) và dùng `id` trực tiếp. Đã xóa hoàn toàn `content.ts`, `assets.ts`, `versioning.ts` và `content_objective_map`.

## 2. Actors

Dev.

## 3. Entry points

`packages/db/src/schema/taxonomy.ts` · `tagging.ts` · `game.ts` · `curriculum.ts`.

## 4. Main flow

Không có.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SCT-01` (Không dùng cơ chế đa version hay cổng duyệt Studio) | Toàn bộ bảng nội dung (`game_levels`, `curricula`, `skill_datasets`) không có các cột `entity_id`, `content_version`, `status` vòng đời Studio, `origin`, `authored_in`, `seed_batch_id`, `created_by_manager_id`, `reviewed_by_manager_id`, `published_at`, `archived_at` | Nội dung được quản lý phiên bản trong Git và nạp cứng qua seeder |
| `BR-SCT-03` (Mỗi `code` là UNIQUE) | Mỗi `code` trong `game_levels`, `curricula`, `skill_datasets` có ràng buộc `UNIQUE` trực tiếp (1 dòng duy nhất mỗi mã) | Đảm bảo mỗi mã nội dung tương ứng đúng 1 bản ghi duy nhất trong DB |
| `BR-SCT-04` | `content_pack` và `difficulty_params` là **hai cột JSONB riêng** | `BR-DM-02` |
| `BR-SCT-06` (Tham chiếu trực tiếp bằng `id`) | `curriculum_items` trỏ tới nội dung bằng `(entity_type, entity_id)` trong đó `entity_id` là `id` (bigint) trực tiếp của `game_levels` | Không còn đa version nên không cần cột neo dòng dõi riêng; tham chiếu thẳng vào `id` của bản ghi |
| `BR-SCT-07` (weight CHECK) | `content_skill_map.weight` có `CHECK (weight > 0 AND weight <= 1)` | [`data-model-overview.md`](../00-foundation/data-model-overview.md) `BR-DM-03` định nghĩa miền `[0,1]`; `CHECK` là chỗ **duy nhất** ép được — miền ghi trong prose không chặn một seeder ghi `weight = 5`. Cận dưới **loại trừ 0**: một hàng `weight = 0` nghĩa là "có ánh xạ nhưng không đóng góp gì", mâu thuẫn với chính việc hàng đó tồn tại, và nó làm mọi phép chuẩn hoá mastery chia cho tổng bằng 0 |
| `BR-SCT-08` (từ vựng `entity_type` đóng) | `entity_type` (`content_entity_type`) của `content_skill_map`, `content_tag_map` nhận đúng bộ giá trị `game_level` · `curriculum`, ép bằng enum ở tầng database | Đã xóa `content.ts` (`worksheets`, `lessons`, `activities`) và `content_objective_map`; enum ở tầng DB chặn mọi chuỗi sai chính tả |

## 7. Data

> **Quy tắc FK/quan hệ đa hình — không ngoại lệ (`BR-DM-13`):** mọi FK dùng
> `id` (bigint). Cấm — **không** bảng nào — kể cả `competencies`/`strands`/`skills`/
> `learning_objectives`/`content_tags`/`game_levels`/`curricula` — được tham chiếu bằng `code` từ bảng
> khác. Các bảng đó **vẫn giữ** cột `code` UNIQUE (định danh hiển thị/URL, [`id-conventions.md`](../00-foundation/id-conventions.md) §7) —
> `code` không biến mất, chỉ không dùng làm FK. Mỗi `code` trong `game_levels`, `curricula`, `skill_datasets` là 1 dòng duy nhất và được trỏ trực tiếp qua `id` (đã xóa cột `entity_id` và `content_version`).

### 7.1 Taxonomy

| Bảng | Cột |
|---|---|
| `competencies` | `id` bigserial PK · `code` UNIQUE (`C1`..`C6`, hiển thị) · `name` · `description` · `color_token` · `icon` · `position` |
| `strands` | `id` bigserial PK · `code` UNIQUE (hiển thị) · `competency_id` FK · `parent_strand_id` FK self (≤1 tầng) · `name` · `description` · `position` |
| `skills` | `id` bigserial PK · `code` UNIQUE (hiển thị) · `strand_id` FK · `name` · `description` · `age_min` `age_max` smallint CHECK 3–6 · `difficulty` smallint CHECK 1–5 · `thinking_processes` text[] · `what_axis` text[] · `status` enum (`seeded`\|`deprecated`) · `position` |
| `skill_prerequisites` | `(skill_id, prerequisite_id)` PK · `strength` numeric CHECK 0–1 |
| `learning_objectives` | `id` bigserial PK · `code` UNIQUE (hiển thị) · `skill_id` FK · `behaviour` · `observable_criteria` · `position` |
| `skill_datasets` | `id` bigserial PK · `code` UNIQUE (= `skill_code`, hiển thị) · `skill_id` FK · `concept_label` · `surface` enum (`game`\|`worksheet`) · `items` jsonb · `axes` jsonb · `ladder` jsonb · `phrasing` jsonb · `created_at` `updated_at` — hình dạng ở mục 7.1 của [`skill-dataset-model.md`](../05-content/skill-dataset-model.md) |

### 7.2 Tagging (`packages/db/src/schema/tagging.ts`)

| Bảng | Cột |
|---|---|
| `content_tags` | `id` bigserial PK · `code` UNIQUE (hiển thị) · `axis` enum (`what`\|`thinking`\|`mechanic`\|`theme`) · `label` · `status` |
| `content_tag_map` | `(entity_type, entity_id, tag_id)` PK ghép — `entity_type` thuộc `content_entity_type` (`game_level`\|`curriculum`) |
| `content_skill_map` | `(entity_type, entity_id, skill_id)` PK ghép · `weight` numeric CHECK — `entity_type` thuộc `content_entity_type` (`game_level`\|`curriculum`) |

Đã xóa `content_objective_map`, `user_tags`, `user_tag_map`.

### 7.3 Templates (Code Registry)

Templates được quản lý thuần trong mã nguồn qua registry `ALL_TEMPLATES` của `@mindkid/game-engine` (không lưu bảng DB `game_templates`).
Mỗi template định nghĩa `code`, `name`, `mechanic`, `layouts`, `content_contract`, `difficulty_contract`, `limits`, `age_min`/`age_max`,
`requires_tap_fallback`, `asset_kinds`, `kind`, `scoring`, `engine_session`, `status`, `version`.

### 7.4 `game_levels` — Nạp cứng từ seeder, 1 dòng mỗi `code`

| Cột | Ghi chú |
|---|---|
| `id` | bigserial PK — dùng trực tiếp cho mọi FK và tham chiếu |
| `code` | `GL-*` UNIQUE NOT NULL — format theo [`id-conventions`](../00-foundation/id-conventions.md) §7 |
| `template_code` | varchar(20) NOT NULL — mã template trong registry `ALL_TEMPLATES` (không FK) |
| `title` `description` `instruction` | |
| `instruction_audio_path` | |
| `content_pack` | JSONB NOT NULL |
| `difficulty_params` | JSONB NOT NULL |
| `theme_id` | |
| `age_min` `age_max` `difficulty` | CHECK như `skills` |
| `access_tier` | enum NOT NULL — cấm default `free` |
| `thumbnail_emoji` | ký tự UTF-8 |
| `skill_dataset_id` | FK `skill_datasets(id)` nullable — level chiếu từ dataset nào |
| `projection_ref` | varchar nullable — bộ chiếu nào dựng `content_pack`; `NULL` nghĩa là soạn tay (nhóm G, mục 7.5 của [`skill-dataset-model.md`](../05-content/skill-dataset-model.md)) |
| `created_at` `updated_at` | timestamptz NOT NULL |

Đã xóa các cột `entity_id`, `content_version`, `status`, `origin`, `authored_in`, `seed_batch_id`, `created_by_manager_id`, `reviewed_by_manager_id`, `published_at`, `archived_at`.
`access_tier` NOT NULL **không có default** — ép người soạn quyết định, thay vì im lặng cho
không nội dung ([`access-ladder.md`](../00-foundation/access-ladder.md) `BR-LAD-02`).

### 7.5 `curricula` · `curriculum_items` · `curriculum_enrollments` · `curriculum_item_progress`

`curricula`: `id` bigserial PK · `code` UNIQUE NOT NULL · `title` ·
`description` · `program_type` enum · `age_min` `age_max` · `duration_weeks` ·
`sessions_per_week` · `access_tier` · `created_at` `updated_at` (đã xóa `entity_id`, `content_version`, `status`, và các cột duyệt Studio).

`curriculum_items`: `id` · `curriculum_id` FK `curricula(id)` ·
`level_no` `module_no` `week_no` `session_no` `position` ·
`entity_type` enum (`game_level`) ·
`entity_id` bigint NOT NULL (trỏ `game_levels.id`) · `is_required` bool · `estimated_minutes`.

`curriculum_enrollments`: `(child_id, curriculum_id)` FK `curricula(id)` · `started_at` · `current_week` · `status`.

`curriculum_item_progress`: `(child_id, curriculum_item_id)` · `completed_at` ·
`play_session_uuid`.

## 8. API contract

Không có.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SCT-03 — mỗi code là duy nhất
  Given một hàng game_levels với code GL-C1-CNT-MATCH-0007 đã tồn tại
  When chèn thêm một hàng game_levels khác có cùng code GL-C1-CNT-MATCH-0007
  Then ràng buộc UNIQUE từ chối

Scenario: access_tier không có default
  When chèn game_levels không nêu access_tier
  Then DB từ chối vì NOT NULL không default

Scenario: BR-SCT-08 — entity_type ngoài từ vựng bị chặn
  Given một hàng content_skill_map với entity_type là 'level' hoặc 'worksheet'
  When ghi vào database
  Then database từ chối vì giá trị không thuộc enum content_entity_type (game_level, curriculum)

Scenario: BR-SCT-07 — weight bị ràng buộc
  When chèn content_skill_map với weight = 1.5
  Then CHECK constraint từ chối

Scenario: BR-SCT-06 — curriculum_items trỏ trực tiếp vào id của game_levels
  When đọc định nghĩa curriculum_items và game_levels
  Then game_levels không có cột entity_id hay content_version
  And curriculum_items.entity_id lưu id (bigint) của game_levels

Scenario: skill code đúng định dạng
  When chèn skills với code "c1.cnt.3"
  Then CHECK regex từ chối

Scenario: strand lồng tối đa một tầng
  Given strand A có parent là strand B
  When đặt strand B có parent là strand C
  Then ràng buộc từ chối
```

## 10. Boundaries

**Always**
- `access_tier` NOT NULL không default.
- `code` UNIQUE trên `game_levels`, `curricula`, `skill_datasets`.
- CHECK cho mọi enum số (`age`, `difficulty`, `weight`).

**Ask first**
- Thêm cột vào `game_levels`, `curricula`, `skill_datasets`.
- Đổi enum `program_type` hoặc `content_entity_type`.

**Never**
- Default `free` cho `access_tier`.
- Trộn nội dung và độ khó vào một cột.
- Thêm lại cơ chế đa version (`entity_id`, `content_version`) hoặc bảng `content.ts`, `assets.ts`, `content_objective_map`.
- Lồng strand quá một tầng.

## 11. Open questions

Không còn câu hỏi mở.
