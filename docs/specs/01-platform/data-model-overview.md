---
spec: DATA-MODEL-OVERVIEW
title: Tổng quan mô hình dữ liệu
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-14
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
file này không lặp lại định nghĩa cột.

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
| [`schema-identity-billing.md`](schema-identity-billing.md) · [`schema-content-taxonomy.md`](schema-content-taxonomy.md) · [`schema-play-telemetry.md`](schema-play-telemetry.md) | Chi tiết cột |

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
| Xoá cột | **NEVER một phase.** Deprecate trước, drop sau ≥1 release |
| Bảng lớn cần index | Tạo `CONCURRENTLY` ở production |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-DM-01` | **Taxonomy là bộ xương.** Mọi nội dung khác trỏ về nó bằng FK thật | Sai chính tả bị chặn ở FK |
| `BR-DM-02` | **`content_pack` tách khỏi `difficulty_params`** | Đổi nội dung không cần code; đổi độ khó không cần biên tập |
| `BR-DM-03` | **`content_skill_map.weight ∈ [0,1]`** — 1.0 mục tiêu chính, 0.3 có chạm tới | Không có nó, một game đếm vô tình "dạy" mọi skill nó chạm tới |
| `BR-DM-04` | **FK polymorphic không ép được ở Postgres** → toàn vẹn do tầng service giữ, **bắt buộc** integration test bắt orphan | Ràng buộc không ép được ở DB là ràng buộc sẽ bị vi phạm |
| `BR-DM-05` | Bảng INSERT-only: `audit_logs` `consent_logs` `content_review_log` `telemetry_events` `play_sessions` (chỉ sau `completed`) — ép bằng **quyền DB** | Ép bằng quy ước là không ép |
| `BR-DM-05a` | `BR-DM-05` chỉ có hiệu lực trên đường ghi đi qua `getAppDb()`; đường qua `getOwnerDb()` vượt mọi `REVOKE` | Quyền DB ép theo **role của kết nối**, không theo tên bảng. Đo 2026-08-28: 33 call site dùng `getAppDb()`, 277 dùng `getOwnerDb()`/`getDb()` — `BR-DM-05` phủ ~11% đường ghi. Xem §11 câu 5 |
| `BR-DM-06` | **NEVER raw SQL** — chỉ Drizzle. Ngoại lệ: `sql\`\`` cho tăng nguyên tử và `coalesce` cross-table | Chuỗi SQL nối tay là đường vào injection, và né được typecheck nên đổi schema không làm nó đỏ. Hai ngoại lệ là chỗ Drizzle không diễn đạt được — giữ hẹp, không mở thành cửa chung |
| `BR-DM-07` | Cột và bảng `snake_case`. Payload API giữ nguyên `snake_case`, không transform | Transform hai chiều là hai chỗ để lệch |
| `BR-DM-08` | Mọi bảng có **cả** `created_at` và `updated_at` — không có ngoại lệ, kể cả bảng INSERT-only | Không có mốc thời gian thì không trả lời được "hàng này có từ bao giờ" lúc điều tra sự cố — và thêm cột sau khi đã có dữ liệu thì mọi hàng cũ mang giá trị bịa. Bản cũ chỉ bắt `updated_at` cho "bảng sửa được", nên mỗi lần thêm bảng lại phải cãi xem nó có sửa được không; siết thành mọi bảng (2026-08-16) bỏ hẳn cuộc cãi đó. Trên bảng INSERT-only cột này là cột chết — quyền DB đã REVOKE UPDATE nên không ai ghi được vào nó |
| `BR-DM-09` | **NEVER `DROP COLUMN`** mà không qua 2 phase deprecation | Drop cột là thao tác không revert được bằng `git revert` — code cũ rollback về vẫn đọc cột đã biến mất, và dữ liệu trong đó không lấy lại được nếu backup đã xoay vòng |
| `BR-DM-10` | Định danh **đối ngoại** (API/URL — cái client nhìn thấy) là `uuid` hoặc `code`, không `bigserial` | `bigserial` để lộ quy mô và mời enumeration. **Chỉ áp cho lớp đối ngoại** — xem `BR-DM-13` cho FK nội bộ |
| `BR-DM-11` | Mỗi file schema ≤ **400 dòng**, chia theo domain, không theo kiểu | Một file 3.000 dòng là nơi mọi merge conflict gặp nhau |
| `BR-DM-12` | Trần phân trang ép ở **server** | Một query không trần hạ cả instance trên t3.small |
| `BR-DM-13` | FK/quan hệ đa hình **nội bộ** luôn lưu `id` (bigint) của bảng đích — **không có ngoại lệ**, kể cả taxonomy Lớp 1 (`competencies`·`strands`·`skills`·`learning_objectives`·`content_tags`) và `game_templates`. Các bảng đó **vẫn giữ** cột `code` (định danh hiển thị/URL) nhưng bảng khác **không** được FK bằng `code` của chúng. Bảng Lớp 2 có version thêm cột `entity_id` — **neo dòng dõi**, bất biến qua mọi version của một `code` (gán = `id` ở version đầu, copy nguyên ở version sau) — tham chiếu cần luôn theo bản `published` mới nhất trỏ vào `entity_id`; tham chiếu cần ghim đúng version cụ thể (dữ liệu lịch sử chơi) trỏ vào `id` của đúng hàng đó. **Cả hai đều là `id`**, khác nhau ở cột nào, không khác ở kiểu dữ liệu | `BR-DM-10` nói về lớp đối ngoại; lần đầu (2026-08-07) tôi đọc nhầm thành hai ngoại lệ dùng `code` — người dùng bác: "FK tất cả phải tham chiếu ID, không có ngoại lệ". Sửa lại cùng ngày bằng cơ chế `entity_id` |

## 7. Data — bản đồ module

| Module | Bảng | Spec chi tiết |
|---|---|---|
| `identity` | `users` `managers` `active_sessions` `mfa_settings` `mfa_recovery_codes` `verification_tokens` `consent_logs` `consent_requirements` `social_identities` | [`schema-identity-billing.md`](schema-identity-billing.md) |
| `billing` | `packages` `package_entitlements` `entitlement_keys` `entitlements` `payment_orders` `quota_usage` | idem |
| `child` | `child_profiles` `child_session_summaries` | [`schema-play-telemetry.md`](schema-play-telemetry.md) |
| `taxonomy` | `competencies` `strands` `skills` `skill_prerequisites` `learning_objectives` `skill_datasets` | [`schema-content-taxonomy.md`](schema-content-taxonomy.md) |
| `tagging` | `content_tags` `content_tag_map` `content_skill_map` `content_objective_map` `user_tags` | idem |
| `game` | `game_templates` `game_levels` | idem |
| `content` | `lessons` `activities` `lesson_activities` `worksheets` `content_images` | idem |
| `curriculum` | `curricula` `curriculum_items` `curriculum_enrollments` `curriculum_item_progress` | idem |
| `play` | `play_sessions` `telemetry_events` `child_daily_stats` `level_daily_stats` `skill_daily_stats` | [`schema-play-telemetry.md`](schema-play-telemetry.md) |
| `adaptive` | `mastery_state` `level_params` | [`schema-play-telemetry.md`](schema-play-telemetry.md) |
| `ops` | `audit_logs` `content_review_log` `backup_log` `notifications` `notification_deliveries`; P5 thêm `notification_reads` `notification_endpoints` | [`schema-identity-billing.md`](schema-identity-billing.md) |

**11 module.** Bảng của add-on (`lesson_plans`, `custom_games`, `ai_usage_log`) **không
tạo ở MVP** — tạo cùng lúc với tính năng. Để bảng rỗng nằm đó là mời code tham chiếu vào
thứ chưa có contract.

### 7.1 Quy ước cột chung

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `bigserial` PK | Nội bộ, không ra ngoài |
| `uuid` | `uuid` UNIQUE | Đối ngoại, cho bảng người dùng chạm tới |
| `code` | `varchar` UNIQUE | Đối ngoại, cho nội dung |
| `created_at` `updated_at` | `timestamptz` | UTC. Hiển thị đổi sang ICT ở tầng UI |
| `status` | enum | Không dùng chuỗi tự do |

### 7.2 FK polymorphic — danh sách đóng

| Bảng | Cột | Test bắt buộc |
|---|---|---|
| `content_tag_map` | `(entity_type, entity_id)` | orphan target |
| `content_skill_map` | `(entity_type, entity_id)` | orphan target |
| `content_objective_map` | `(entity_type, entity_id)` | orphan target |
| `content_images` | `(owner_type, owner_id)` | orphan owner |
| `content_review_log` | `(entity_type, entity_id)` | orphan target — `entity_id`, khớp quy tắc `BR-DM-13` (quyết định D-AE) |
| `active_sessions` · `mfa_settings` · `mfa_recovery_codes` · `verification_tokens` | `(account_type, account_id)` | orphan account |
| `activities.ref_id` | `(ref_type, ref_id)` — trỏ `game_levels.entity_id` hoặc `worksheets.entity_id` tuỳ `ref_type` | orphan target |
| `curriculum_items.entity_id` | `(entity_type, entity_id)` — trỏ `lessons.entity_id` hoặc `game_levels.entity_id` tuỳ `entity_type` | orphan target |

Mười chỗ (`D-AQ`, 2026-08-08 — thêm hai dòng cuối; `content_objective_map` thêm 2026-09-03). Mỗi chỗ **bắt buộc** một integration
test bắt orphan — đây không phải khuyến nghị. Hai dòng mới phát hiện khi soạn kế hoạch
migration đầu tiên: [`schema-content-taxonomy.md`](schema-content-taxonomy.md) §7.5 và §7.6
mô tả `activities.ref_id` và `curriculum_items.entity_id` là polymorphic thật, nhưng danh
sách này — vốn tự nhận là "đóng" — không có chúng. `§10` Boundaries của chính file này ghi
"Ask first: Thêm một FK polymorphic thứ tám", tức thêm là đổi contract, không phải chi tiết
triển khai tự quyết — sửa spec trước, đúng nguyên tắc [`roadmap.md`](../roadmap.md).

Lưu ý đếm: dòng "`active_sessions` · `mfa_settings` · `mfa_recovery_codes` ·
`verification_tokens`" gộp bốn bảng vào một dòng nhưng bốn bảng đó là bốn `(account_type,
account_id)` độc lập trên bốn bảng khác nhau. Đếm theo **tên bảng** thay vì theo **dòng**,
tổng trước khi thêm hai dòng mới đã là tám, không phải bảy như văn xuôi cũ ghi — sai số này
có từ bản viết gốc (2026-08-04), không liên quan tới D-AQ. Không sửa ở đây vì cần quyết định
"chỗ" đếm theo bảng hay theo mẫu dùng chung trước khi đổi con số — để lại cho người review
Task #7 xác nhận trước khi viết integration test, đừng lặng lẽ đếm theo cách khác nhau giữa
văn xuôi và test thật.

### 7.3 Ràng buộc chờ — quyết định từ open question đã đóng

| Nguồn | Quyết định | Ngày | Ảnh hưởng cột |
|---|---|---|---|
| [`id-conventions.md`](../00-foundation/id-conventions.md) Q1 (T9) | Game Level mang `template_code` trong mã | 2026-08-06 | `game_levels.code` format `GL-{C}-{strand}-{template}-{seq}` |
| [`id-conventions.md`](../00-foundation/id-conventions.md) Q2 (T9) | 4 chữ số (`\d{4}`) cho Game Level | 2026-08-06 | `game_levels.code` regex mở rộng |
| [`actors.md`](../00-foundation/actors.md) Q1 (T9) | Manager MFA bắt buộc | 2026-08-06 | `mfa_settings` bắt buộc cho mọi manager |
| [`actors.md`](../00-foundation/actors.md) Q2 (T9) | `pending_verification` không tạo child | 2026-08-06 | Guard ở tầng service, không ảnh hưởng cột |
| [`mvp-scope.md`](../00-foundation/mvp-scope.md) Q4 (T9) | Backup/monitoring vào P0 | 2026-08-06 | `backup_log` vào migration #1 |
| [`monorepo-package-architecture.md`](../00-foundation/monorepo-package-architecture.md) Q3 (T9) | `payment`/`notification` inline | 2026-08-06 | Không đụng cột — ảnh hưởng cấu trúc package |
| Task #15 mục 4 phát hiện #2 (T15) | **D-BV**: `BR-DM-05` gọi nhầm `play_events` — bảng thật là `telemetry_events` (khớp [`schema-play-telemetry.md`](schema-play-telemetry.md) BR-SPT-07 và code); thêm `play_sessions` vào danh sách INSERT-only cho khớp BR-SPT-07 | 2026-08-09 | Không đụng cột — sửa tên trong `BR-DM-05` và `../../SPEC.md` §5.1/§5.5 |
| [`access-ladder.md`](../00-foundation/access-ladder.md) Q3 (T10) | Enum 4 bậc | 2026-08-06 | `access_tier` enum (`free`·`login`·`standard`·`premium`) mọi bảng Lớp 2 |
| [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) Q3 (T10) | Không `scheduled` | 2026-08-06 | `status` enum 6 giá trị (`draft`·`review`·`approved`·`published`·`archived`·`rejected`) |
| [`content-versioning.md`](../00-foundation/content-versioning.md) Q2 (T11) | Luôn theo bản published mới nhất (không ghim version) | 2026-08-06, cơ chế sửa 2026-08-07 (D-AE) | `curriculum_items.entity_id` bigint FK `entity_id` (neo dòng dõi) của bảng đích — không `entity_code`, không cần `entity_version` |
| [`event-catalog.md`](../00-foundation/event-catalog.md) Q2 (T11 sang T4b) | Không partition P0 — **mở lại** | 2026-08-07 | PK `(session_uuid, seq)` giữ nguyên; ngưỡng 5M hàng/2GB; 0 FK trỏ vào |
| [`package-catalog.md`](../00-foundation/package-catalog.md) Q2 (T12) | Chỉ bán năm | 2026-08-06 | `billing_period` miền đóng `{yearly, monthly}` (D-AB) |
| D-Y | 7 spec thêm `depends_on AUTH-TOKENS-SESSIONS` | 2026-08-06 | [`schema-identity-billing.md`](schema-identity-billing.md) thêm `AUTH-TOKENS-SESSIONS` vào `depends_on` |
| D-AA | `age_band` suy lúc đọc | 2026-08-06 | `child_profiles` 12 cột (bỏ `age_band`), index `birth_year` |
| D-AB | `billing_period_vi` sang `billing_period` | 2026-08-07 | `packages.offers` JSONB key đổi tên |
| D-AC | `content_review_log` thuộc [`schema-identity-billing.md`](schema-identity-billing.md) | 2026-08-07 | [`schema-identity-billing.md`](schema-identity-billing.md) §7.10 |
| D-AD | `ops` P0: 3 bảng | 2026-08-07 | `audit_logs` · `content_review_log` · `backup_log`; hoãn 4 bảng |
| D-AP | `ops` P0: thêm bảng thứ 4 — `notifications` | 2026-08-08 | [`notification-service.md`](notification-service.md) chuyển P2→P0 ở `D-AF` (Task #5) nhưng bảng của nó bị bỏ sót trong danh sách hoãn của [`schema-identity-billing.md`](schema-identity-billing.md) §7.10b — sửa lại vì `BR-NOT-04` áp dụng cho hai spec P0 ([`email-verification.md`](../03-account/email-verification.md), [`password-recovery.md`](../03-account/password-recovery.md)) cần gửi email thật từ migration #1 |
| D-ND | `ops` tách logical notification khỏi channel delivery | 2026-08-13 | P0 có `notifications` + `notification_deliveries`; P5 mới tạo `notification_reads` + `notification_endpoints` theo Task #84 |
| D-AE | Làm rõ `BR-DM-10` (chỉ áp lớp đối ngoại) + thêm `BR-DM-13` — FK/quan hệ đa hình nội bộ **luôn** dùng `id`, **không ngoại lệ** (kể cả taxonomy Lớp 1 + `game_templates` — các bảng đó giữ `code` làm định danh hiển thị nhưng không dùng làm FK). Bảng Lớp 2 có version thêm cột `entity_id` (neo dòng dõi, bất biến qua version) cho tham chiếu cần luôn theo bản published mới nhất — **sửa lại 2026-08-07** sau khi người dùng bác đề xuất ban đầu (giữ `code` cho 2 nhóm ngoại lệ) | 2026-08-07 | Toàn bộ taxonomy Lớp 1 (`strands.competency_id`, `skills.strand_id`, `learning_objectives.skill_id`, `content_tag_map`/`content_skill_map.tag_id`/`skill_id`, `mastery_state.skill_id`, `skill_daily_stats.skill_id`) · `game_levels.template_id` · `content_review_log.entity_id` ([`schema-identity-billing.md`](schema-identity-billing.md)) · `lesson_activities.lesson_id`+`activity_id` · `curriculum_items.curriculum_id`+`entity_id` · `curriculum_enrollments.curriculum_id` · `activities.ref_id` · `current_curriculum_id` (child_profiles) · `play_sessions`/`telemetry_events`/`level_daily_stats`/`level_params`.`game_level_id`/`template_id`/`curriculum_id`/`lesson_id` · `content_asset_refs.entity_id` · **`entity_id` (cột mới)** trên `game_levels`/`lessons`/`activities`/`curricula`/`worksheets` |

**17 ràng buộc.** Mỗi dòng có nguồn spec + mã open question + task + ngày. Lưu ý: bảng này **không có cổng
máy** — Checkpoint C phải đối chiếu tay.

## 8. API contract

Không có route. Ràng buộc lên tầng data access:

```ts
// Đúng — map từng field
await db.update(users).set({ display_name: p.display_name }).where(eq(users.id, uid));
// Sai — mass assignment
await db.update(users).set(parsed).where(eq(users.id, uid));
```

Cột đặc quyền **NEVER** nhận từ payload: `managers.role` · `users.status` ·
`users.session_version` · `entitlements.status` · `payment_orders.status` ·
mọi `*.status` của bảng nội dung · `*.content_version`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-DM-05 — bảng INSERT-only ép ở tầng DB
  Given một hàng audit_logs tồn tại
  When chạy UPDATE hoặc DELETE trên hàng đó bằng role của ứng dụng
  Then quyền DB từ chối

Scenario: BR-DM-05a — cùng câu lệnh đó bằng role owner thì không bị chặn
  Given một hàng audit_logs tồn tại
  When chạy UPDATE trên hàng đó bằng kết nối getOwnerDb()
  Then câu lệnh thành công
  And đó là lý do trích BR-DM-05 như bảo đảm phải kèm tên client của đường ghi

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
- Thêm một FK polymorphic thứ mười (chín chỗ hiện tại đã là con số chốt, xem `D-AQ`).
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
| ~~1~~ | ~~Partition `telemetry_events` theo tháng ngay từ đầu?~~ **Đóng 2026-08-07 (T5)**: quyết định sống ở [`event-catalog.md`](../00-foundation/event-catalog.md) Q2 — xem §7.3 dòng `event-catalog Q2`. Không partition ở P0; PK giữ `(session_uuid, seq)`. Ngưỡng kích hoạt: 5M hàng/2GB | — | đóng | D-Z |
| 2 | Retention của `audit_logs` — giữ vĩnh viễn hay archive sang S3 sau 2 năm? | Vận hành — xem [`audit-log.md`](audit-log.md) §11 Q1, chủ duy nhất (cùng một câu hỏi, luật "một outcome một chủ") | P1 | hoãn — cần số dung lượng thật sau khi có seeder (`BR-AUD-08`) |
| 3 | Có cần read replica cho báo cáo không, hay index đủ? | Hiệu năng | P3 | hoãn — tuning khi có lưu lượng |
| 5 | Chuyển bao nhiêu trong 277 call site `getOwnerDb()` sang `getAppDb()`? Một số thật sự cần quyền owner (migration, seeder, job dọn dẹp); phần còn lại đang vượt `BR-DM-05` mà không ai biết. Cần một danh sách đường ghi **phải** đi role hẹp, rồi một cổng đếm | `BR-DM-05a` — bảo đảm INSERT-only chỉ đúng trên 11% đường ghi | P1 | người quyết |
| ~~4~~ | ~~Sửa schema hay sửa spec khi `child_profiles` và `telemetry_events` đã ship lệch contract?~~ **Đóng 2026-08-09 (P0.4)**: Sửa schema cho khớp spec (D-DN). Không hạ trạng thái spec (D-DO). Migration tiến tới (D-DP). Chỉ sửa cột thuộc P0.4 (D-DQ). | — | đóng | D-DN |
