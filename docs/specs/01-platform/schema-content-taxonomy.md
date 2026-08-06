---
spec: SCHEMA-CONTENT-TAXONOMY
title: Schema — taxonomy, nội dung, curriculum
area: platform
status: draft
mvp: true
phase: P0
reviewed: 2026-08-04
owns:
  - Định nghĩa cột module taxonomy, tagging, game, content, curriculum
depends_on:
  - DATA-MODEL-OVERVIEW
  - TAXONOMY-SERVICE
  - CONTENT-VERSIONING
  - GAME-TEMPLATE-CONTRACT
---

# Schema — taxonomy, nội dung, curriculum

## 1. Objective

Định nghĩa cột cho năm module nội dung. Đây là nơi ranh giới **Lớp 1 / Lớp 2** hiện ra
trong schema.

## 2. Actors

Dev.

## 3. Entry points

`packages/db/src/schema/taxonomy.ts` · `tagging.ts` · `game.ts` · `content.ts` ·
`curriculum.ts`.

## 4. Main flow

Không có.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SCT-01` | Bảng Lớp 1 ❌ **không có** cột `status` vòng đời nội dung — chúng chỉ `active`/`deprecated` | Lớp 1 không đi qua cổng duyệt |
| `BR-SCT-02` | Bảng Lớp 2 **bắt buộc** có `content_version` + `status` 6 giá trị | |
| `BR-SCT-03` | Partial unique index ép **đúng một** hàng `published` mỗi `code` | `content-versioning` `BR-VER-02` |
| `BR-SCT-04` | `content_pack` và `difficulty_params` là **hai cột JSONB riêng** | `BR-DM-02` |
| `BR-SCT-05` | Trigger chặn `UPDATE` hàng `published` | `content-lifecycle` `BR-CLC-01` |
| `BR-SCT-06` | `curriculum_items` trỏ tới nội dung bằng `(code, entity_type)`, ❌ không bằng `bigserial` | Version đổi thì id đổi, `code` thì không |
| `BR-SCT-07` | `content_skill_map.weight` có `CHECK (weight > 0 AND weight <= 1)` | |

## 7. Data

### 7.1 Taxonomy — Lớp 1

| Bảng | Cột |
|---|---|
| `competencies` | `code` PK (`C1`..`C6`) · `name_vi` · `description_vi` · `color_token` · `icon` · `position` |
| `strands` | `code` PK · `competency_code` FK · `parent_strand_id` FK self (≤1 tầng) · `name_vi` · `description_vi` · `position` |
| `skills` | `code` PK · `strand_code` FK · `name_vi` · `description_vi` · `age_min` `age_max` smallint CHECK 3–6 · `difficulty` smallint CHECK 1–5 · `thinking_processes` text[] · `what_axis` text[] · `status` enum (`seeded`\|`deprecated`) · `position` |
| `skill_prerequisites` | `(skill_code, prerequisite_code)` PK · `strength` numeric CHECK 0–1 |
| `learning_objectives` | `code` PK · `skill_code` FK · `behaviour_vi` · `observable_criteria_vi` · `position` |

### 7.2 Tagging

| Bảng | Cột |
|---|---|
| `content_tags` | `code` PK · `axis` enum (`what`\|`thinking`\|`mechanic`\|`theme`) · `label_vi` · `status` — Lớp 1 |
| `content_tag_map` | `(entity_type, entity_id, tag_code)` PK ghép |
| `content_skill_map` | `(entity_type, entity_id, skill_code)` PK ghép · `weight` numeric CHECK |
| `user_tags` | `id` · `user_id` FK · `label` · UNIQUE `(user_id, label)` |

### 7.3 `game_templates` — Lớp 1

`code` PK · `name_vi` · `mechanic` · `layouts` text[] ·
`content_contract` JSONB (JSON Schema export) · `difficulty_contract` JSONB ·
`limits` JSONB · `age_min` `age_max` · `banned_age_bands` text[] ·
`requires_tap_fallback` bool · `asset_kinds` text[] · `scoring` JSONB · `events` text[] ·
`engine_session` · `status` enum (`active`\|`deprecated`) · `version` int.

### 7.4 `game_levels` — Lớp 2, có version

| Cột | Ghi chú |
|---|---|
| `id` | bigserial |
| `code` | `GL-*` — format theo [`id-conventions`](../00-foundation/id-conventions.md) §7. **Không** UNIQUE một mình |
| `content_version` | int NOT NULL |
| — | UNIQUE `(code, content_version)` |
| — | UNIQUE `(code) WHERE status = 'published'` — partial |
| `template_code` | FK `game_templates` |
| `title_vi` `description_vi` `instruction_vi` | |
| `instruction_audio_path` | |
| `content_pack` | JSONB NOT NULL |
| `difficulty_params` | JSONB NOT NULL |
| `theme_id` | |
| `age_min` `age_max` `difficulty` | CHECK như `skills` |
| `access_tier` | enum NOT NULL — ❌ **không** default `free` |
| `thumbnail_emoji` | `EMJ-*` |
| `status` | enum 6 giá trị |
| `origin` | enum (`human`\|`ai_assisted`) — soạn thảo có AI agent IDE hỗ trợ không |
| `authored_in` | enum (`repo_seed`\|`studio`) — hàng này vào DB bằng đường nào |
| `seed_batch_id` | FK `content_seed_batches` nullable |
| `created_by_manager_id` `reviewed_by_manager_id` `published_at` `archived_at` | |

`access_tier` NOT NULL **không có default** — ép người soạn quyết định, thay vì im lặng cho
không nội dung (`access-ladder` `BR-LAD-02`).

### 7.5 `lessons` · `activities` — Lớp 2, có version

`lessons`: `code` · `content_version` · `title_vi` · `guide_vi` · `target_age_min/max` ·
`estimated_minutes` CHECK 5–45 · `materials_vi` · `warm_up_vi` · `reflection_vi` ·
`assessment_vi` · `extension_vi` · `access_tier` · `status` · `origin` · `authored_in` ·
`seed_batch_id` · audit cột.

`activities`: `code` · `content_version` · `kind` enum (10 loại) · `title_vi` ·
`instruction_vi` · `estimated_minutes` · `ref_type` `ref_code` (trỏ game level nếu
`kind = digital_game`) · `access_tier` · `status`.

`lesson_activities`: `(lesson_code, lesson_version, position)` PK · `activity_code` ·
`is_required` bool.

### 7.6 `curricula` · `curriculum_items`

`curricula`: `code` · `content_version` · `title_vi` · `description_vi` ·
`program_type` enum · `age_min` `age_max` · `duration_weeks` · `sessions_per_week` ·
`access_tier` · `status`.

`curriculum_items`: `id` · `curriculum_code` `curriculum_version` ·
`level_no` `module_no` `week_no` `session_no` `position` ·
`entity_type` enum (`lesson`\|`game_level`) · `entity_code` ·
`is_required` bool · `estimated_minutes`.

`curriculum_enrollments`: `(child_id, curriculum_code)` · `curriculum_version` ·
`started_at` · `current_week` · `status`.

`curriculum_item_progress`: `(child_id, curriculum_item_id)` · `completed_at` ·
`play_session_uuid`.

### 7.7 `worksheets` · `content_images`

`worksheets`: `code` · `content_version` · `title_vi` · `learning_objective_codes` text[] ·
`pdf_path` · `access_tier` · `status`.

`content_images`: §`image-storage` §7.1.

## 8. API contract

Không có.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SCT-03 — đúng một bản published
  Given game level GL-C1-CNT-MATCH-0007 version 1 published
  When chèn version 2 với status published mà không archive version 1
  Then partial unique index từ chối

Scenario: BR-SCT-05 — trigger chặn sửa bản published
  Given một hàng game_levels status published
  When chạy UPDATE đổi content_pack
  Then trigger từ chối

Scenario: access_tier không có default
  When chèn game_levels không nêu access_tier
  Then DB từ chối vì NOT NULL không default

Scenario: BR-SCT-07 — weight bị ràng buộc
  When chèn content_skill_map với weight = 1.5
  Then CHECK constraint từ chối

Scenario: BR-SCT-06 — curriculum trỏ bằng code
  When đọc định nghĩa curriculum_items
  Then cột tham chiếu là entity_code varchar
  And không phải khoá ngoại bigserial

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
- Partial unique index cho `published`.
- Trigger chặn sửa hàng `published`.
- CHECK cho mọi enum số (`age`, `difficulty`, `weight`).

**Ask first**
- Thêm cột vào bảng Lớp 2.
- Đổi enum `program_type` hoặc `activity.kind`.

**Never**
- Default `free` cho `access_tier`.
- Trộn nội dung và độ khó vào một cột.
- Tham chiếu curriculum bằng `bigserial`.
- Lồng strand quá một tầng.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | `curriculum_items` ghim `entity_version` hay luôn lấy bản published mới nhất? | `content-versioning` Q2 |
| 2 | `lesson_activities` khoá theo `lesson_version` làm mọi version copy lại toàn bộ item — chấp nhận được không? | P3 |
