---
spec: DATA-MODEL-OVERVIEW
title: Tổng quan mô hình dữ liệu
area: platform
status: draft
mvp: true
phase: P0
reviewed: 2026-08-07
owns:
  - Danh mục module schema và ranh giới giữa chúng
  - Quy tắc chung áp cho mọi bảng
  - Chiến lược migration
depends_on:
  - GLOSSARY
  - ID-CONVENTIONS
  - CHILD-DATA-COMPLIANCE
  - CONTENT-VERSIONING
---

# Tổng quan mô hình dữ liệu

## 1. Objective

Bản đồ schema và **quy tắc chung** áp cho mọi bảng. Chi tiết từng nhóm ở ba spec con —
file này ❌ không lặp lại định nghĩa cột.

Bốn quyết định định hình toàn bộ schema, mỗi cái là một ràng buộc không thương lượng.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Dev | Thiết kế bảng, viết migration |
| Drizzle | ORM duy nhất |
| Seeder | Nạp Lớp 1 và lô Lớp 2 đầu tiên |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/db/src/schema/` | Một file mỗi module domain, ≤ 400 dòng |
| `packages/db/src/migrations/` | Drizzle migration |
| `schema-identity-billing.md` · `schema-content-taxonomy.md` · `schema-play-telemetry.md` | Chi tiết cột |

## 4. Main flow — thêm một bảng

1. Cập nhật spec sở hữu bảng đó **trước**.
2. Viết định nghĩa Drizzle trong module tương ứng.
3. `pnpm db:generate` sinh migration — **đọc file SQL sinh ra**.
4. Áp lên DB rỗng, chạy seed, chạy integration test.
5. PR có người review.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Đổi kiểu cột | **Ask first.** Hai phase: thêm cột mới → backfill → chuyển đọc → drop cột cũ |
| Xoá cột | ❌ **NEVER một phase.** Deprecate trước, drop sau ≥1 release |
| Bảng lớn cần index | Tạo `CONCURRENTLY` ở production |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-DM-01` | **Taxonomy là bộ xương.** Mọi nội dung khác trỏ về nó bằng FK thật | Sai chính tả bị chặn ở FK |
| `BR-DM-02` | **`content_pack` tách khỏi `difficulty_params`** | Đổi nội dung không cần code; đổi độ khó không cần biên tập |
| `BR-DM-03` | **`content_skill_map.weight ∈ [0,1]`** — 1.0 mục tiêu chính, 0.3 có chạm tới | Không có nó, một game đếm vô tình "dạy" mọi skill nó chạm tới |
| `BR-DM-04` | **FK polymorphic không ép được ở Postgres** → toàn vẹn do tầng service giữ, **bắt buộc** integration test bắt orphan | Ràng buộc không ép được ở DB là ràng buộc sẽ bị vi phạm |
| `BR-DM-05` | Bảng INSERT-only: `audit_logs` `consent_logs` `content_review_log` `telemetry_events` `play_events` — ép bằng **quyền DB** | Ép bằng quy ước là không ép |
| `BR-DM-06` | ❌ **NEVER raw SQL** — chỉ Drizzle. Ngoại lệ: `sql\`\`` cho tăng nguyên tử và `coalesce` cross-table | |
| `BR-DM-07` | Cột và bảng `snake_case`. Payload API giữ nguyên `snake_case`, ❌ không transform | Transform hai chiều là hai chỗ để lệch |
| `BR-DM-08` | Mọi bảng có `created_at`; bảng sửa được có `updated_at` | |
| `BR-DM-09` | ❌ **NEVER `DROP COLUMN`** mà không qua 2 phase deprecation | |
| `BR-DM-10` | Định danh **đối ngoại** (API/URL — cái client nhìn thấy) là `uuid` hoặc `code`, ❌ không `bigserial` | `bigserial` để lộ quy mô và mời enumeration. **Chỉ áp cho lớp đối ngoại** — xem `BR-DM-13` cho FK nội bộ |
| `BR-DM-11` | Mỗi file schema ≤ **400 dòng**, chia theo domain, ❌ không theo kiểu | Một file 3.000 dòng là nơi mọi merge conflict gặp nhau |
| `BR-DM-12` | Trần phân trang ép ở **server** | Một query không trần hạ cả instance trên t3.small |
| `BR-DM-13` | FK/quan hệ đa hình **nội bộ** luôn lưu `id` (bigint) của bảng đích — **không có ngoại lệ**, kể cả taxonomy Lớp 1 (`competencies`·`strands`·`skills`·`learning_objectives`·`content_tags`) và `game_templates`. Các bảng đó **vẫn giữ** cột `code` (định danh hiển thị/URL) nhưng bảng khác ❌ **không** được FK bằng `code` của chúng. Bảng Lớp 2 có version thêm cột `entity_id` — **neo dòng dõi**, bất biến qua mọi version của một `code` (gán = `id` ở version đầu, copy nguyên ở version sau) — tham chiếu cần luôn theo bản `published` mới nhất trỏ vào `entity_id`; tham chiếu cần ghim đúng version cụ thể (dữ liệu lịch sử chơi) trỏ vào `id` của đúng hàng đó. **Cả hai đều là `id`**, khác nhau ở cột nào, không khác ở kiểu dữ liệu | `BR-DM-10` nói về lớp đối ngoại; lần đầu (2026-08-07) tôi đọc nhầm thành hai ngoại lệ dùng `code` — người dùng bác: "FK tất cả phải tham chiếu ID, không có ngoại lệ". Sửa lại cùng ngày bằng cơ chế `entity_id` |

## 7. Data — bản đồ module

| Module | Bảng | Spec chi tiết |
|---|---|---|
| `identity` | `users` `managers` `active_sessions` `mfa_settings` `mfa_recovery_codes` `verification_tokens` `consent_logs` `social_identities` | `schema-identity-billing` |
| `billing` | `packages` `package_entitlements` `entitlement_keys` `entitlements` `payment_orders` `quota_usage` | idem |
| `child` | `child_profiles` `child_session_summaries` | `schema-play-telemetry` |
| `taxonomy` | `competencies` `strands` `skills` `skill_prerequisites` `learning_objectives` | `schema-content-taxonomy` |
| `tagging` | `content_tags` `content_tag_map` `content_skill_map` `user_tags` | idem |
| `game` | `game_templates` `game_levels` | idem |
| `content` | `lessons` `activities` `lesson_activities` `worksheets` `content_images` | idem |
| `curriculum` | `curricula` `curriculum_items` `curriculum_enrollments` `curriculum_item_progress` | idem |
| `play` | `play_sessions` `telemetry_events` `child_daily_stats` `level_daily_stats` `skill_daily_stats` | `schema-play-telemetry` |
| `adaptive` | `mastery_state` `level_params` | `schema-play-telemetry` |
| `ops` | `audit_logs` `content_review_log` `backup_log` | `schema-identity-billing` |

**11 module.** Bảng của add-on (`lesson_plans`, `custom_games`, `ai_usage_log`) ❌ **không
tạo ở MVP** — tạo cùng lúc với tính năng. Để bảng rỗng nằm đó là mời code tham chiếu vào
thứ chưa có contract.

### 7.1 Quy ước cột chung

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `bigserial` PK | Nội bộ, ❌ không ra ngoài |
| `uuid` | `uuid` UNIQUE | Đối ngoại, cho bảng người dùng chạm tới |
| `code` | `varchar` UNIQUE | Đối ngoại, cho nội dung |
| `created_at` `updated_at` | `timestamptz` | UTC. Hiển thị đổi sang ICT ở tầng UI |
| `status` | enum | ❌ không dùng chuỗi tự do |

### 7.2 FK polymorphic — danh sách đóng

| Bảng | Cột | Test bắt buộc |
|---|---|---|
| `content_tag_map` | `(entity_type, entity_id)` | orphan target |
| `content_skill_map` | `(entity_type, entity_id)` | orphan target |
| `content_images` | `(owner_type, owner_id)` | orphan owner |
| `content_review_log` | `(entity_type, entity_id)` | orphan target — `entity_id`, khớp `BR-DM-13` (D-AE) |
| `active_sessions` · `mfa_settings` · `mfa_recovery_codes` · `verification_tokens` | `(account_type, account_id)` | orphan account |

Bảy chỗ. Mỗi chỗ **bắt buộc** một integration test bắt orphan — đây không phải khuyến nghị.

### 7.3 Ràng buộc chờ — quyết định từ OQ đã đóng

| Nguồn | Quyết định | Ngày | Ảnh hưởng cột |
|---|---|---|---|
| `id-conventions` Q1 (T9) | Game Level mang `template_code` trong mã | 2026-08-06 | `game_levels.code` format `GL-{C}-{strand}-{template}-{seq}` |
| `id-conventions` Q2 (T9) | 4 chữ số (`\d{4}`) cho Game Level | 2026-08-06 | `game_levels.code` regex mở rộng |
| `actors` Q1 (T9) | Manager MFA bắt buộc | 2026-08-06 | `mfa_settings` bắt buộc cho mọi manager |
| `actors` Q2 (T9) | `pending_verification` ❌ không tạo child | 2026-08-06 | Guard ở tầng service, không ảnh hưởng cột |
| `mvp-scope` Q4 (T9) | Backup/monitoring vào P0 | 2026-08-06 | `backup_log` vào migration #1 |
| `monorepo-package-map` Q3 (T9) | `payment`/`notification` inline | 2026-08-06 | Không đụng cột — ảnh hưởng cấu trúc package |
| `access-ladder` Q3 (T10) | Enum 4 bậc | 2026-08-06 | `access_tier` enum (`free`·`login`·`standard`·`premium`) mọi bảng Lớp 2 |
| `content-lifecycle` Q3 (T10) | ❌ không `scheduled` | 2026-08-06 | `status` enum 6 giá trị (`draft`·`review`·`approved`·`published`·`archived`·`rejected`) |
| `content-versioning` Q2 (T11) | Luôn theo bản published mới nhất (không ghim version) | 2026-08-06, cơ chế sửa 2026-08-07 (D-AE) | `curriculum_items.entity_id` bigint FK `entity_id` (neo dòng dõi) của bảng đích — ❌ không `entity_code`, không cần `entity_version` |
| `event-catalog` Q2 (T11→T4b) | ❌ không partition P0 — **mở lại** | 2026-08-07 | PK `(session_uuid, seq)` giữ nguyên; ngưỡng 5M hàng/2GB; 0 FK trỏ vào |
| `package-catalog` Q2 (T12) | Chỉ bán năm | 2026-08-06 | `billing_period` miền đóng `{yearly, monthly}` (D-AB) |
| D-Y | 7 spec thêm `depends_on AUTH-TOKENS-SESSIONS` | 2026-08-06 | SIB thêm `AUTH-TOKENS-SESSIONS` vào `depends_on` |
| D-AA | `age_band` suy lúc đọc | 2026-08-06 | `child_profiles` 12 cột (bỏ `age_band`), index `birth_year` |
| D-AB | `billing_period_vi` → `billing_period` | 2026-08-07 | `packages.offers` JSONB key đổi tên |
| D-AC | `content_review_log` thuộc SIB | 2026-08-07 | `schema-identity-billing` §7.10 |
| D-AD | `ops` P0: 3 bảng | 2026-08-07 | `audit_logs` · `content_review_log` · `backup_log`; hoãn 4 bảng |
| D-AE | Làm rõ `BR-DM-10` (chỉ áp lớp đối ngoại) + thêm `BR-DM-13` — FK/quan hệ đa hình nội bộ **luôn** dùng `id`, **không ngoại lệ** (kể cả taxonomy Lớp 1 + `game_templates` — các bảng đó giữ `code` làm định danh hiển thị nhưng không dùng làm FK). Bảng Lớp 2 có version thêm cột `entity_id` (neo dòng dõi, bất biến qua version) cho tham chiếu cần luôn theo bản published mới nhất — **sửa lại 2026-08-07** sau khi người dùng bác đề xuất ban đầu (giữ `code` cho 2 nhóm ngoại lệ) | 2026-08-07 | Toàn bộ taxonomy Lớp 1 (`strands.competency_id`, `skills.strand_id`, `learning_objectives.skill_id`, `content_tag_map`/`content_skill_map.tag_id`/`skill_id`, `mastery_state.skill_id`, `skill_daily_stats.skill_id`) · `game_levels.template_id` · `content_review_log.entity_id` (SIB) · `lesson_activities.lesson_id`+`activity_id` · `curriculum_items.curriculum_id`+`entity_id` · `curriculum_enrollments.curriculum_id` · `activities.ref_id` · `current_curriculum_id` (child_profiles) · `play_sessions`/`telemetry_events`/`level_daily_stats`/`level_params`.`game_level_id`/`template_id`/`curriculum_id`/`lesson_id` · `content_asset_refs.entity_id` · **`entity_id` (cột mới)** trên `game_levels`/`lessons`/`activities`/`curricula`/`worksheets` |

**17 ràng buộc.** Mỗi dòng có nguồn spec + mã OQ + task + ngày. ⚠️ Bảng này **không có cổng
máy** — Checkpoint C phải đối chiếu tay.

## 8. API contract

Không có route. Ràng buộc lên tầng data access:

```ts
// ✅ Map từng field
await db.update(users).set({ display_name: p.display_name }).where(eq(users.id, uid));
// ❌ Mass assignment
await db.update(users).set(parsed).where(eq(users.id, uid));
```

Cột đặc quyền ❌ **NEVER** nhận từ payload: `managers.role` · `users.status` ·
`users.refresh_token_version` · `entitlements.status` · `payment_orders.status` ·
mọi `*.status` của bảng nội dung · `*.content_version`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-DM-05 — bảng INSERT-only ép ở tầng DB
  Given một hàng audit_logs tồn tại
  When chạy UPDATE hoặc DELETE trên hàng đó bằng role của ứng dụng
  Then quyền DB từ chối

Scenario: BR-DM-04 — orphan polymorphic bị bắt
  Given một hàng content_tag_map trỏ tới entity_id không tồn tại
  When chạy integration test toàn vẹn
  Then test fail và chỉ ra hàng orphan

Scenario: BR-DM-06 — không raw SQL
  When quét source tìm chuỗi SQL thô ngoài Drizzle
  Then chỉ tìm thấy sql`` cho tăng nguyên tử và coalesce

Scenario: BR-DM-10 — bigserial không ra ngoài
  When kiểm mọi response của API công khai
  Then không field nào tên id mang giá trị bigserial của bảng nội dung

Scenario: BR-DM-11 — file schema đủ nhỏ
  When đếm dòng mỗi file trong packages/db/src/schema
  Then không file nào vượt 400 dòng

Scenario: migration áp được lên DB rỗng
  Given một DB PostgreSQL 17 rỗng
  When chạy pnpm db:migrate và pnpm db:seed
  Then cả hai kết thúc exit 0
  And chạy lại pnpm db:seed không đổi số hàng

Scenario: BR-DM-12 — trần phân trang ép ở server
  When gọi bất kỳ route danh sách nào với limit = 10000
  Then số bản ghi trả về không vượt trần đã khai báo của route đó
```

## 10. Boundaries

**Always**
- Drizzle cho mọi truy cập DB.
- Map từng field khi `update().set()`.
- Integration test orphan cho cả bảy FK polymorphic.
- Đọc file SQL migration sinh ra trước khi commit.

**Ask first**
- Thêm/xoá bảng, đổi kiểu cột, đổi PK.
- Thêm một FK polymorphic thứ tám.
- Tạo bảng cho tính năng chưa vào scope.

**Never**
- Raw SQL ngoài hai ngoại lệ.
- Mass assignment.
- `DROP COLUMN` một phase.
- `bigserial` trong payload công khai.
- Bảng rỗng cho tính năng chưa có contract.
- Chuỗi tự do thay cho enum.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Partition `telemetry_events` theo tháng ngay từ đầu?~~ **Đóng 2026-08-07 (T5)**: quyết định sống ở `event-catalog` Q2 — xem §7.3 dòng `event-catalog Q2`. ❌ Không partition ở P0; PK giữ `(session_uuid, seq)`. Ngưỡng kích hoạt: 5M hàng/2GB | — | ✅ đóng | D-Z |
| 2 | Retention `audit_logs` — giữ vĩnh viễn hay archive sang S3 sau N năm? | Vận hành | 🟡 P1 | hoãn — cần ước tính dung lượng sau khi có seeder |
| 3 | Có cần read replica cho báo cáo không, hay index đủ? | Hiệu năng | 🟡 P3 | hoãn — tuning khi có lưu lượng |
