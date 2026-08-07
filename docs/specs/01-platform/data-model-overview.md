---
spec: DATA-MODEL-OVERVIEW
title: Tổng quan mô hình dữ liệu
area: platform
status: draft
mvp: true
phase: P0
reviewed: 2026-08-04
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
| `BR-DM-10` | Định danh đối ngoại là `uuid` hoặc `code`, ❌ không `bigserial` | `bigserial` để lộ quy mô và mời enumeration |
| `BR-DM-11` | Mỗi file schema ≤ **400 dòng**, chia theo domain, ❌ không theo kiểu | Một file 3.000 dòng là nơi mọi merge conflict gặp nhau |
| `BR-DM-12` | Trần phân trang ép ở **server** | Một query không trần hạ cả instance trên t3.small |

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
| `play` | `play_sessions` `telemetry_events` | `schema-play-telemetry` |
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
| `content_review_log` | `(entity_type, entity_id)` | orphan target |
| `active_sessions` · `mfa_settings` · `mfa_recovery_codes` · `verification_tokens` | `(account_type, account_id)` | orphan account |

Bảy chỗ. Mỗi chỗ **bắt buộc** một integration test bắt orphan — đây không phải khuyến nghị.

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

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Partition `telemetry_events` theo tháng ngay từ đầu? Nó sẽ là bảng lớn nhất và trên t3.small dung lượng là ràng buộc thật | P1 |
| 2 | Retention `audit_logs` — giữ vĩnh viễn hay archive sang S3 sau N năm? | Vận hành |
| 3 | Có cần read replica cho báo cáo không, hay index đủ? | P3 |
