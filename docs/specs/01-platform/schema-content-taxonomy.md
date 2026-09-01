---
spec: SCHEMA-CONTENT-TAXONOMY
title: Schema — taxonomy, nội dung, curriculum
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-07
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
| `BR-SCT-01` (Lớp 1 không có status vòng đời) | Bảng Lớp 1 **không có** cột `status` vòng đời nội dung — chúng chỉ `active`/`deprecated` | Lớp 1 không đi qua cổng duyệt |
| `BR-SCT-02` (Lớp 2 có 6 status) | Bảng Lớp 2 **bắt buộc** có `content_version` + `status` 6 giá trị | 6 giá trị định nghĩa ở [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §7.1 — cấm tự thêm giá trị thứ 7 ở đây |
| `BR-SCT-03` (một published mỗi code) | Partial unique index ép **đúng một** hàng `published` mỗi `code` | [`content-versioning.md`](../00-foundation/content-versioning.md) `BR-VER-02` (đúng một bản published) |
| `BR-SCT-04` | `content_pack` và `difficulty_params` là **hai cột JSONB riêng** | `BR-DM-02` |
| `BR-SCT-05` (trigger chặn UPDATE) | Trigger chặn `UPDATE` hàng `published` | [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) `BR-CLC-01` (bản published bất biến) |
| `BR-SCT-06` (neo dòng dõi) | `curriculum_items` trỏ tới nội dung bằng `(entity_type, entity_id)` — `entity_id` là **neo dòng dõi** (`entity_id` lineage anchor), bất biến qua mọi version, không phải `id` của một hàng version cụ thể | Ghim đúng hàng version thì content update xong curriculum vẫn thấy bản cũ. Neo dòng dõi + `WHERE status='published'` giải quyết mà **vẫn là `id`**, không cần `code` (D-AE, sửa lại 2026-08-07) |
| `BR-SCT-07` (weight CHECK) | `content_skill_map.weight` có `CHECK (weight > 0 AND weight <= 1)` | [`data-model-overview.md`](data-model-overview.md) `BR-DM-03` định nghĩa miền `[0,1]`; `CHECK` là chỗ **duy nhất** ép được — miền ghi trong prose không chặn một seeder ghi `weight = 5`. Cận dưới **loại trừ 0**: một hàng `weight = 0` nghĩa là "có ánh xạ nhưng không đóng góp gì", mâu thuẫn với chính việc hàng đó tồn tại, và nó làm mọi phép chuẩn hoá mastery chia cho tổng bằng 0 |

## 7. Data

> **Quy tắc FK/quan hệ đa hình — không ngoại lệ (D-AE, sửa lại 2026-08-07):** mọi FK dùng
> `id` (bigint). Cấm — **không** bảng nào — kể cả `competencies`/`strands`/`skills`/
> `learning_objectives`/`content_tags`/`game_templates` — được tham chiếu bằng `code` từ bảng
> khác. Các bảng đó **vẫn giữ** cột `code` (định danh hiển thị/URL, [`id-conventions.md`](../00-foundation/id-conventions.md) §7) —
> `code` không biến mất, chỉ không dùng làm FK nữa.
>
> Bảng Lớp 2 có version (`game_levels`·`lessons`·`activities`·`curricula`·`worksheets`) thêm
> cột **`entity_id`** (bigint NOT NULL) — **neo dòng dõi**: version đầu tiên `entity_id = id`
> (tự trỏ), mọi version sau copy nguyên `entity_id` của version trước (cùng lúc copy nội dung
> theo [`content-versioning.md`](../00-foundation/content-versioning.md) §4). `entity_id` bất biến suốt vòng đời một `code`, dùng cho
> tham chiếu cần **luôn theo bản `published` mới nhất** (join kèm `WHERE status='published'`).
> Tham chiếu cần **ghim đúng một version** (dữ liệu lịch sử chơi) dùng `id` của đúng hàng đó.
> Cả hai đều là `id` — khác nhau ở **cột nào**, không khác ở **kiểu dữ liệu**.

### 7.1 Taxonomy — Lớp 1

| Bảng | Cột |
|---|---|
| `competencies` | `id` bigserial PK · `code` UNIQUE (`C1`..`C6`, hiển thị) · `name` · `description` · `color_token` · `icon` · `position` |
| `strands` | `id` bigserial PK · `code` UNIQUE (hiển thị) · `competency_id` FK · `parent_strand_id` FK self (≤1 tầng) · `name` · `description` · `position` |
| `skills` | `id` bigserial PK · `code` UNIQUE (hiển thị) · `strand_id` FK · `name` · `description` · `age_min` `age_max` smallint CHECK 3–6 · `difficulty` smallint CHECK 1–5 · `thinking_processes` text[] · `what_axis` text[] · `status` enum (`seeded`\|`deprecated`) · `position` |
| `skill_prerequisites` | `(skill_id, prerequisite_id)` PK · `strength` numeric CHECK 0–1 |
| `learning_objectives` | `id` bigserial PK · `code` UNIQUE (hiển thị) · `skill_id` FK · `behaviour` · `observable_criteria` · `position` |

### 7.2 Tagging

| Bảng | Cột |
|---|---|
| `content_tags` | `id` bigserial PK · `code` UNIQUE (hiển thị) · `axis` enum (`what`\|`thinking`\|`mechanic`\|`theme`) · `label` · `status` — Lớp 1 |
| `content_tag_map` | `(entity_type, entity_id, tag_id)` PK ghép |
| `content_skill_map` | `(entity_type, entity_id, skill_id)` PK ghép · `weight` numeric CHECK |
| `user_tags` | `id` · `user_id` FK · `label` · UNIQUE `(user_id, label)` |

### 7.3 `game_templates` — Lớp 1

`id` bigserial PK · `code` UNIQUE (hiển thị) · `name` · `mechanic` · `layouts` text[] ·
`content_contract` JSONB (JSON Schema export) · `difficulty_contract` JSONB ·
`limits` JSONB · `age_min` `age_max` · `banned_age_bands` text[] ·
`requires_tap_fallback` bool · `asset_kinds` text[] · `scoring` JSONB · `events` text[] ·
`engine_session` · `status` enum (`active`\|`deprecated`) · `version` int.

### 7.4 `game_levels` — Lớp 2, có version

| Cột | Ghi chú |
|---|---|
| `id` | bigserial PK — của **hàng version này** |
| `entity_id` | bigserial — **neo dòng dõi**: version đầu `entity_id = id`; version sau copy nguyên. Tham chiếu "luôn theo published mới nhất" trỏ vào đây |
| `code` | `GL-*` — format theo [`id-conventions`](../00-foundation/id-conventions.md) §7. **Không** UNIQUE một mình |
| `content_version` | int NOT NULL |
| — | UNIQUE `(code, content_version)` |
| — | UNIQUE `(code) WHERE status = 'published'` — partial |
| `template_id` | FK `game_templates(id)` |
| `title` `description` `instruction` | |
| `instruction_audio_path` | |
| `content_pack` | JSONB NOT NULL |
| `difficulty_params` | JSONB NOT NULL |
| `theme_id` | |
| `age_min` `age_max` `difficulty` | CHECK như `skills` |
| `access_tier` | enum NOT NULL — cấm default `free` |
| `thumbnail_emoji` | ký tự UTF-8 |
| `status` | enum 6 giá trị |
| `origin` | enum (`human`\|`ai_assisted`) — soạn thảo có AI agent IDE hỗ trợ không |
| `authored_in` | enum (`repo_seed`\|`studio`) — hàng này vào DB bằng đường nào |
| `seed_batch_id` | FK `content_seed_batches` nullable |
| `created_by_manager_id` `reviewed_by_manager_id` `published_at` `archived_at` | |

`access_tier` NOT NULL **không có default** — ép người soạn quyết định, thay vì im lặng cho
không nội dung ([`access-ladder.md`](../00-foundation/access-ladder.md) `BR-LAD-02` — access tier do người quyết định).

### 7.5 `lessons` · `activities` · `lesson_activities` — Lớp 2, có version

`lessons`: `id` bigserial PK · `entity_id` bigserial (neo dòng dõi, xem đầu §7) · `code` ·
`content_version` · `title` · `guide` · `target_age_min/max` ·
`estimated_minutes` CHECK 5–45 · `materials` · `warm_up` · `reflection` ·
`assessment` · `extension` · `access_tier` · `status` · `origin` · `authored_in` ·
`seed_batch_id` · audit cột.

`activities`: `id` bigserial PK · `entity_id` bigserial (neo dòng dõi — activity tái sử dụng
qua nhiều lesson, [`activity-authoring.md`](../06-admin/activity-authoring.md) "sửa một lần, mọi lesson dùng nó đều cập nhật") ·
`code` · `content_version` · `kind` enum (10 loại) · `title` · `instruction` ·
`estimated_minutes` · `ref_type` `ref_id` (FK `entity_id` của `game_levels`/`worksheets` tuỳ
`ref_type`, nếu `kind = digital_game`/`worksheet` — luôn bản `published` mới nhất) ·
`access_tier` · `status`.

`lesson_activities`: `(lesson_id, position)` PK ghép · `activity_id` FK `activities(entity_id)`
· `is_required` bool. `lesson_id` là FK `lessons(id)` — hàng này thuộc đúng **một version cụ
thể** của lesson (quan hệ cha-con nội bộ, ghim). `activity_id` trỏ `entity_id` (neo dòng dõi)
của activity — luôn bản `published` mới nhất, khớp mô tả tái sử dụng ở [`activity-authoring.md`](../06-admin/activity-authoring.md).

### 7.6 `curricula` · `curriculum_items` · `curriculum_enrollments` · `curriculum_item_progress`

> **Hai loại quan hệ, đừng trộn (D-AE) — cả hai đều dùng `id`, khác nhau ở CỘT NÀO:**
> (a) quan hệ **cha-con** — một hàng thuộc đúng một version cụ thể của bảng cha, tạo mới mỗi
> lần copy-on-write — dùng `id` của **đúng hàng version đó** (`lesson_activities.lesson_id`,
> `curriculum_items.curriculum_id`, `curriculum_enrollments.curriculum_id`). (b) tham chiếu
> **tới nội dung khác**, cố ý luôn theo bản `published` mới nhất — dùng **`entity_id`** (neo
> dòng dõi, xem đầu §7), không phải `id` của một hàng version cụ thể và không phải `code`
> (`curriculum_items.entity_id`, `activities.ref_id`, `lesson_activities.activity_id`) theo
> `BR-SCT-06` + [`content-versioning.md`](../00-foundation/content-versioning.md) §11 Q2, sửa lại 2026-08-07 theo D-AE.

`curricula`: `id` bigserial PK · `entity_id` bigserial (neo dòng dõi, cho
`current_curriculum_id` ở `child_profiles`) · `code` · `content_version` · `title` ·
`description` · `program_type` enum · `age_min` `age_max` · `duration_weeks` ·
`sessions_per_week` · `access_tier` · `status`.

`curriculum_items`: `id` · `curriculum_id` FK `curricula(id)` (cha-con, ghim) ·
`level_no` `module_no` `week_no` `session_no` `position` ·
`entity_type` enum (`lesson`\|`game_level`) ·
`entity_id` FK `entity_id` của bảng tương ứng theo `entity_type` (luôn bản `published` mới
nhất) · `is_required` bool · `estimated_minutes`.

`curriculum_enrollments`: `(child_id, curriculum_id)` FK `curricula(id)` (cha-con, ghim đúng
version lúc enroll) · `started_at` · `current_week` · `status`.

`curriculum_item_progress`: `(child_id, curriculum_item_id)` · `completed_at` ·
`play_session_uuid`.

### 7.7 `worksheets` · `content_images`

`worksheets`: `id` bigserial PK · `entity_id` bigserial (neo dòng dõi — target được của
`activities.ref_id` khi `ref_type = worksheet`) · `code` · `content_version` · `title` ·
`learning_objective_ids` bigint[] · `pdf_path` · `access_tier` · `status`.

`content_images`: [`image-storage.md`](image-storage.md) §7.1.

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

Scenario: BR-SCT-06 — curriculum trỏ bằng entity_id (neo dòng dõi), không ghim version
  When đọc định nghĩa curriculum_items
  Then cột tham chiếu là entity_id bigint, khoá ngoại tới cột entity_id của bảng đích
  And không phải id của một hàng version cụ thể

Scenario: BR-SCT-06 — entity_id neo dòng dõi bất biến qua các version
  Given một game level code GL-C1-CNT-MATCH-0007 version 1, entity_id = 500
  When manager tạo version 2 (copy-on-write) rồi publish
  Then hàng version 2 mới có entity_id = 500 (giống version 1)
  And curriculum_items trỏ entity_id 500 tự động thấy version 2 sau khi publish

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
- Tham chiếu curriculum/nội dung khác bằng `id` của **một hàng version cụ thể** khi cần luôn
  theo bản published mới nhất — phải dùng `entity_id` (neo dòng dõi). Cấm dùng `code`.
- Lồng strand quá một tầng.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~`curriculum_items` ghim `entity_version` hay luôn lấy bản published mới nhất?~~ **Đóng 2026-08-07 (T7)**: theo [`content-versioning.md`](../00-foundation/content-versioning.md) §11 Q2 — `curriculum_items` **luôn lấy bản `published` mới nhất**, không ghim `entity_version`. Hệ quả: đổi nội dung `published` thì mọi curriculum thấy bản mới ngay lập tức, **không có** đường ghim version. **Sửa cơ chế 2026-08-07 (D-AE lần 2)**: hành vi trên **không đổi**, nhưng cột lưu **không** phải `entity_code` — là `curriculum_items.entity_id` bigint, trỏ cột **`entity_id`** (neo dòng dõi, bất biến qua mọi version) của bảng đích. Join `WHERE entity_id = ? AND status = 'published'`. Theo `BR-DM-13`: FK luôn là `id`, không có ngoại lệ `code` | — | Đã đóng | D-AE |
| 2 | `lesson_activities` khoá theo `lesson_version` làm mọi version copy lại toàn bộ item — chấp nhận được không? | P3 | chờ P3 | hoãn — copy-on-write đắt về dung lượng nhưng không sai; đo lại khi có số hàng thật, cùng lúc [`content-versioning.md`](../00-foundation/content-versioning.md) Q1 (archive S3) |
