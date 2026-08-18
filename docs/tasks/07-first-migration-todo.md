# Checklist — Task #7: P0 bước 8, migration đầu tiên

> Bối cảnh, đồ thị phụ thuộc, ba quyết định kỹ thuật (D1–D3), và lỗ hổng spec §2a:
> [`07-first-migration-plan.md`](07-first-migration-plan.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```
>
> **Tick ô ngay khi làm xong.** Một bước một commit — không gộp nhiều bảng vào một commit
> (Task #5 nguyên tắc "Bảy việc phải làm cho mỗi spec" bước 7, áp dụng tương tự cho code: một
> module một commit).

## Thứ tự làm

```
Bước 1 -> Bước 2 -> Bước 3 -> Bước 4 -> Cổng dừng A
                                            |
              +-----------------------------+
              |                             |
         (đã xong ở trên)              Bước 5 -> 6 -> 7 -> Cổng dừng B
                                            |
                                       Bước 8 (spec, không code)
                                            |
                                       Bước 9 -> Bước 10 -> Cổng dừng C
                                            |
                              Bước 11 -> Bước 12 -> Bước 13
                                            |
                          Bước 14 (song song được, chỉ cần Bước 3)
                                            |
                              Bước 15 -> Cổng dừng cuối
```

---

## Bước 1 — Hạ tầng `packages/db`: driver, role, script

- [x] Thêm `drizzle-orm` `^0.45`, `drizzle-kit` `^0.31` vào `catalog:` của
      `pnpm-workspace.yaml` (lockstep — không lệch minor giữa hai gói, theo
      [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1)
- [x] `packages/db/package.json` — thêm dependency `drizzle-orm`, `postgres` (`catalog:`);
      devDependency `drizzle-kit` (`catalog:`)
- [x] Tạo `packages/db/drizzle.config.ts` — `schema: "./src/schema/*.ts"`,
      `out: "./src/migrations"`, `dialect: "postgresql"`
- [x] `packages/db/src/index.ts` — hai factory kết nối (D1 trong plan):
      - `getOwnerDb()` — dùng `DATABASE_URL` (role `postgres`, cho script migration)
      - `getAppDb()` — dùng `DATABASE_URL_APP` (role `mindkid_app`, cho `apps/*` runtime)
      - Cả hai lazy-init, không kết nối lúc import module (khớp
        [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) §8 "side effect lúc import")
- [x] `.env` mẫu (`.env.example` ở gốc) — thêm `DATABASE_URL_APP`
- [x] Root `package.json` — thêm script `db:generate` (`drizzle-kit generate`),
      `db:migrate` (script tự viết chạy migration bằng owner connection),
      `db:seed` (chạy `packages/db/src/seed.ts`)
- [x] Migration custom đầu tiên (`pnpm db:generate --custom` hoặc tương đương của
      `drizzle-kit`) — tạo role `mindkid_app` `NOLOGIN` → sau đó `ALTER ROLE ... LOGIN
      PASSWORD ...` (đọc từ biến môi trường lúc chạy migration, không hardcode), `GRANT
      CONNECT` lên DB `mindkid`
- [x] `docker compose up -d` (đã chạy sẵn nếu chưa dừng từ Task #5) → `pnpm db:migrate` exit 0
      trên DB rỗng
- [x] `pnpm check` xanh (chưa có bảng nghiệp vụ nào, chỉ hạ tầng)
- [x] Commit `feat(db): P0 bước 8.1 — driver, role mindkid_app, script db:*`

## Bước 2 — `schema/identity.ts`

File: `packages/db/src/schema/identity.ts` — 8 bảng theo
[`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.1–7.4

- [x] `users` — đúng cột §7.1, **không** cột `role`/`persona`/`tier` (`BR-SIB-01`)
- [x] `email` kiểu `citext` UNIQUE (cần `CREATE EXTENSION citext` trong migration —
      thêm vào migration custom Bước 1 hoặc migration riêng của bảng này)
- [x] `managers` — đúng cột §7.2
- [x] 4 bảng auth phụ polymorphic (`active_sessions`·`mfa_settings`·`mfa_recovery_codes`·
      `verification_tokens`) — cột chung `(account_type, account_id)` theo §7.3
- [x] `social_identities` — FK thẳng `users(id)` **ON DELETE CASCADE** (`BR-SIB-11`), hai
      UNIQUE `(provider, provider_user_id)` và `(user_id, provider)` (`BR-SIB-09`), **không**
      cột `access_token`/`refresh_token`/`id_token`/`avatar_url` (`BR-SIB-10`)
- [x] `consent_logs` — INSERT-only: `REVOKE UPDATE, DELETE ... FROM mindkid_app` trong cùng
      migration (`BR-SIB-06`)
- [x] `pnpm db:generate` — đọc file SQL sinh ra trước khi tiếp tục
- [x] `pnpm db:migrate` trên DB rỗng — exit 0
- [x] Integration test (`packages/db/tests/integration/identity.test.ts`, PG Docker thật,
      không mock — `BR-TST-02`):
      - [x] `BR-SIB-04` — orphan `active_sessions.account_id` bị bắt
      - [x] `BR-SIB-07` — `A@X.com` trùng `a@x.com` → UNIQUE từ chối
      - [x] `BR-SIB-08` — `users` không `password_hash` vẫn INSERT được
      - [x] `BR-SIB-09` — cả hai UNIQUE của `social_identities` đều bị bắt (2 test)
      - [x] `BR-SIB-10` — đọc định nghĩa bảng, không có 4 cột token
      - [x] `BR-SIB-11` — xoá `users` → 0 hàng `social_identities` còn lại
      - [x] `BR-SIB-06` — `UPDATE`/`DELETE` trên `consent_logs` bằng role `mindkid_app` bị từ
            chối (kết nối **bằng đúng role app**, không phải owner)
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.2 — schema identity`

## Bước 3 — `schema/billing.ts`

File: `packages/db/src/schema/billing.ts` — 6 bảng theo
[`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.5–7.9

- [x] `entitlement_keys` — PK `key` varchar, cột theo §7.5
- [x] `packages` · `package_entitlements` — cột theo §7.6, `offers` JSONB
- [x] `entitlements` — `entitlement_key` **FK thật** tới `entitlement_keys` (`BR-SIB-02`)
- [x] `payment_orders` — `amount_vnd` snapshot, không tính toán lại từ `packages` lúc đọc
      (`BR-SIB-03` — verify bằng test, không chỉ bằng kiểu cột)
- [x] `quota_usage` — PK ghép `(user_id, quota_key, period_start)`
- [x] `pnpm db:generate` → đọc SQL → `pnpm db:migrate`
- [x] Integration test:
      - [x] `BR-SIB-02` — insert `entitlements` với `entitlement_key` không tồn tại → FK từ chối
      - [x] `BR-SIB-03` — đổi giá trong `packages` sau khi đơn đã tạo, `amount_vnd` đơn cũ
            không đổi
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.3 — schema billing`

## Bước 4 — `schema/ops.ts`

File: `packages/db/src/schema/ops.ts` — theo
[`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.10/7.10a,
[`audit-log.md`](../specs/01-platform/audit-log.md) §7.1, [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) §7.2,
[`notification-service.md`](../specs/01-platform/notification-service.md) §7.2

Bốn bảng, không phải ba — `notifications` gia nhập module `ops` ở `D-AP` (Task #6 bước 12b,
sau khi [`notification-service.md`](../specs/01-platform/notification-service.md) chuyển
P2→P0). Bỏ sót bảng này thì
[`email-verification.md`](../specs/03-account/email-verification.md)/[`password-recovery.md`](../specs/03-account/password-recovery.md)
(P0) không có chỗ ghi log gửi email theo `BR-NOT-04`.

- [x] `audit_logs` — cột theo [`audit-log.md`](../specs/01-platform/audit-log.md) §7.1, index ba cột theo §7.1
- [x] `content_review_log` — polymorphic `(entity_type, entity_id)`, đây là **1 trong 9** chỗ
      đóng của [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.2
- [x] `backup_log` — cột theo [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) §7.2
- [x] `notifications` — cột theo [`notification-service.md`](../specs/01-platform/notification-service.md) §7.2
      (`recipient_type`/`recipient_id` polymorphic **nhưng không** nằm trong danh sách đóng 9
      chỗ của DMO §7.2 — xác nhận lại trước khi bỏ qua test orphan cho nó, đừng tự loại trừ)
- [x] `REVOKE UPDATE, DELETE ... FROM mindkid_app` trên `audit_logs` và `content_review_log`
      (`BR-AUD-01`, INSERT-only) — `backup_log` **không** insert-only (job ghi `finished_at`
      sau khi đã ghi `started_at`, cần UPDATE); `notifications` **không** insert-only (worker
      cập nhật `status`/`dispatched_at`/`error` sau khi gửi)
- [x] `pnpm db:generate` → đọc SQL → `pnpm db:migrate`
- [x] Integration test:
      - [x] `BR-AUD-01` — `UPDATE`/`DELETE` trên `audit_logs` bằng role app bị từ chối
      - [x] orphan `content_review_log.entity_id` — 1 trong 9 test bắt buộc của `BR-DM-04`
      - [x] `BR-NOT-04` — insert `notifications` trong cùng transaction với sự kiện kích hoạt
            nó (test tối thiểu: transaction rollback thì cả hai cùng không tồn tại)
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.4 — schema ops`

## Cổng dừng A

- [x] 3 file schema tồn tại (`identity.ts`, `billing.ts`, `ops.ts`), mỗi file ≤400 dòng
- [x] `docker compose down -v && docker compose up -d && pnpm db:migrate` sạch từ đầu — exit 0
- [x] Mọi test Bước 2–4 xanh, chạy bằng PG Docker thật (không mock — `BR-TST-02`)
- [x] `pnpm check` xanh
- [x] `git status` sạch

---

## Bước 5 — `schema/taxonomy.ts`

File: `packages/db/src/schema/taxonomy.ts` — 5 bảng theo
[`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.1

- [x] `competencies` · `strands` · `skills` · `skill_prerequisites` · `learning_objectives`
- [x] `strands.parent_strand_id` self-FK — CHECK/constraint đảm bảo lồng **≤1 tầng** (`BR-SCT`
      boundaries — cấm lồng quá một tầng). Drizzle không diễn đạt "độ sâu tối đa" bằng CHECK
      đơn giản trên một hàng — ghi rõ đây là ràng buộc **service-layer + integration test**,
      không phải DB CHECK (khác với age/difficulty là CHECK được vì so sánh trong-hàng)
- [x] `skills.age_min`/`age_max` CHECK 3–6, `difficulty` CHECK 1–5
- [x] CHECK regex cho `code` mọi bảng — dùng đúng regex đã có ở
      `packages/shared/src/ids.ts` (đừng viết regex thứ hai lệch bản gốc)
- [x] `pnpm db:generate` → đọc SQL → `pnpm db:migrate`
- [x] Integration/property test:
      - [x] `skills.code` sai định dạng (`"c1.cnt.3"`) → CHECK từ chối
      - [x] strand lồng 2 tầng → từ chối (service-layer test, không phải DB CHECK)
      - [x] property test: `skill_prerequisites` là DAG ở mọi trạng thái seed
            ([`testing-strategy.md`](../specs/08-quality/testing-strategy.md) §7.2 — dùng `fast-check`)
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.5 — schema taxonomy`

## Bước 6 — `schema/tagging.ts`

File: `packages/db/src/schema/tagging.ts` — theo
[`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.2

- [x] `content_tags` · `content_tag_map` · `content_skill_map` · `user_tags`
- [x] `content_skill_map.weight` — `CHECK (weight > 0 AND weight <= 1)` (`BR-SCT-07` — cận
      dưới loại trừ 0, đọc lại vì sao trong spec trước khi viết CHECK)
- [x] `pnpm db:generate` → đọc SQL → `pnpm db:migrate`
- [x] Integration test:
      - [x] `BR-SCT-07` — insert `weight = 1.5` → CHECK từ chối; `weight = 0` → CHECK từ chối
      - [x] orphan `content_tag_map.(entity_type, entity_id)` — 1 trong 7 (`BR-DM-04`)
      - [x] orphan `content_skill_map.(entity_type, entity_id)` — 1 trong 7 (`BR-DM-04`)
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.6 — schema tagging`

## Bước 7 — `schema/game.ts`

File: `packages/db/src/schema/game.ts` — theo
[`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.3–7.4

- [x] `game_templates` — Lớp 1, không `status` vòng đời nội dung (`BR-SCT-01`)
- [x] `game_levels` — Lớp 2: `entity_id` self-FK tới `game_levels(id)` (D3 trong plan),
      UNIQUE `(code, content_version)`, partial UNIQUE `(code) WHERE status = 'published'`
      (`BR-SCT-03`), `access_tier` NOT NULL **không default** (cấm mặc định `free`)
- [x] Trigger `BEFORE UPDATE` chặn sửa hàng `status = 'published'` (`BR-SCT-05`, D2 trong
      plan — custom SQL migration, viết tay thân hàm trigger)
- [x] `pnpm db:generate --custom` cho phần trigger, `pnpm db:generate` cho phần bảng → đọc SQL
      → `pnpm db:migrate`
- [x] Integration test:
      - [x] `BR-SCT-03` — insert version 2 `published` mà chưa archive version 1 → partial
            unique index từ chối
      - [x] `BR-SCT-05` — `UPDATE content_pack` trên hàng `published` → trigger từ chối
      - [x] `access_tier` không nêu → NOT NULL từ chối (không âm thầm nhận default)
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.7 — schema game`

## Cổng dừng B — dừng trước khi chạm `content.ts`/`curriculum.ts`

- [x] 7 file schema tồn tại, mỗi file ≤400 dòng
- [x] Trigger `BR-SCT-05` có test xanh (game_levels)
- [x] `pnpm check && pnpm test` xanh
- [x] **Đọc lại §2a của plan.md trước khi làm Bước 8** — đây là điểm quyết định thật, không
      phải thủ tục

---

## Bước 8 — Đóng lỗ hổng spec: [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.2 (KHÔNG viết code)

Xem lý do đầy đủ ở [`07-first-migration-plan.md`](07-first-migration-plan.md) §2a.

- [x] **Đã đóng trước khi Task #7 bắt đầu.** Task #6 bước 15 tìm đúng lỗ hổng này khi đối
      chiếu spec P1 và sửa nó ở đó, sớm hơn kế hoạch — `D-AQ`, commit
      [`06-p1-spec-closure-todo.md`](06-p1-spec-closure-todo.md) bước 15. Danh sách đóng ở
      [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.2 đã là
      **9 chỗ** (thêm `activities.ref_id`, `curriculum_items.entity_id`), `status: approved`,
      `reviewed: 2026-08-08`
- [x] Xác nhận không cần làm lại: `pnpm lint:specs` 0 lỗi, danh sách đã có 9 dòng
- [x] Bỏ qua các ô còn lại của Bước 8 gốc (đọc §7.5/§7.6, thêm dòng, sửa văn xuôi, ghi sổ cái) —
      đã làm ở Task #6, không lặp lại

## Bước 9 — `schema/content.ts`

File: `packages/db/src/schema/content.ts` — theo
[`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.5, §7.7

- [x] `lessons` — Lớp 2, `entity_id` self-FK (D3)
- [x] `activities` — Lớp 2, `entity_id` self-FK; `ref_id` polymorphic theo `ref_type`
      (`game_level`|`worksheet`) — **không** FK đơn bảng, giữ nguyên polymorphic (đã đóng ở
      Bước 8)
- [x] `lesson_activities` — `(lesson_id, position)` PK ghép, `lesson_id` FK `lessons(id)`
      (cha-con, ghim), `activity_id` FK `activities(entity_id)` (D3 — many-to-one hợp lệ)
- [x] `worksheets` — Lớp 2, `entity_id` self-FK
- [x] `content_images` — theo [`image-storage.md`](../specs/01-platform/image-storage.md) §7.1
      (spec `draft` — chỉ tạo cột đã có acceptance criteria rõ ở [`data-model-overview.md`](../specs/01-platform/data-model-overview.md),
      **ask first** nếu cột nào không rõ nguồn)
- [x] Trigger `BR-SCT-05` mở rộng cho 3 bảng Lớp 2 mới (`lessons`·`activities`·`worksheets`)
- [x] `pnpm db:generate` (+ `--custom` cho trigger) → đọc SQL → `pnpm db:migrate`
- [x] Integration test:
      - [x] orphan `content_images.(owner_type, owner_id)` — 1 trong 9 chỗ đóng (DMO §7.2)
      - [x] orphan `activities.(ref_type, ref_id)` — 1 trong 9 chỗ đóng, đã ghi ở DMO §7.2 từ Task #6
      - [x] `BR-SCT-05` — trigger chặn sửa `lessons`/`activities`/`worksheets` khi `published`
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.9 — schema content`

## Bước 10 — `schema/curriculum.ts`

File: `packages/db/src/schema/curriculum.ts` — theo
[`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.6

- [x] `curricula` — Lớp 2, `entity_id` self-FK
- [x] `curriculum_items` — `curriculum_id` FK `curricula(id)` (cha-con, ghim); `entity_id`
      polymorphic theo `entity_type` (`lesson`|`game_level`) trỏ `entity_id` của bảng tương
      ứng — **không** ghim version cụ thể (`BR-SCT-06`)
- [x] `curriculum_enrollments` — `(child_id, curriculum_id)`, FK `curricula(id)` (cha-con,
      ghim đúng version lúc enroll)
- [x] `curriculum_item_progress` — `(child_id, curriculum_item_id)`
- [x] Trigger `BR-SCT-05` mở rộng cho `curricula`
- [x] `pnpm db:generate` (+ `--custom`) → đọc SQL → `pnpm db:migrate`
- [x] Integration test:
      - [x] orphan `curriculum_items.(entity_type, entity_id)` — 1 trong 9 chỗ đóng, đã ghi ở DMO §7.2 từ Task #6
      - [x] `BR-SCT-06` — tạo version 2 của một game level (copy-on-write) rồi publish; xác
            nhận `curriculum_items` trỏ `entity_id` cũ tự động thấy version mới
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.10 — schema curriculum`

## Cổng dừng C

- [x] [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.2 có đúng 9 dòng, `pnpm lint:specs` 0 lỗi
- [x] 9/9 file schema tồn tại (identity, billing, ops, taxonomy, tagging, game, content,
      curriculum — 8 vừa xong; child/play/adaptive còn ở Bước 11–13)
- [x] 6 test orphan polymorphic xanh (content_tag_map, content_skill_map, content_images,
      content_review_log, activities.ref_id, curriculum_items.entity_id) — còn 2 (auth phụ +
      auth phụ gộp 4 bảng) đã xanh từ Cổng dừng A, tổng cộng đủ 9 sau bước này
- [x] `pnpm check && pnpm test` xanh

---

## Bước 11 — `schema/child.ts`

File: `packages/db/src/schema/child.ts` — theo
[`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.1, §7.4

- [x] `child_profiles` — **đúng 12 cột**, `user_id` FK `users(id)` **ON DELETE CASCADE**,
      `birth_year` CHECK theo tuổi 3–6, **không** cột `full_name`/`birth_date`/`school`/
      `photo_path`/`age_band` (`BR-SPT-01`, `BR-SPT-02`)
- [x] `child_session_summaries` — theo §7.4
- [x] `pnpm db:generate` → đọc SQL → `pnpm db:migrate`
- [x] Integration test:
      - [x] `BR-SPT-01` — đếm cột `child_profiles` = 12 chính xác, kiểm danh sách tên cột
            bằng `information_schema.columns` (không chỉ đếm số, phải xác nhận đúng tên cấm)
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.11 — schema child`

## Bước 12 — `schema/play.ts`

File: `packages/db/src/schema/play.ts` — theo
[`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.2, §7.3, §7.5

- [x] `play_sessions` — CHECK `(child_profile_id IS NOT NULL) OR (guest_device_id IS NOT
      NULL)`; FK `game_level_id`/`content_version`/`template_id` (D-AE — ghim đúng hàng version
      lúc chơi, không dùng `entity_id`)
- [x] Trigger `BEFORE UPDATE` chặn sửa khi `OLD.completion_status = 'completed'` (`BR-SPT-07`,
      D2 trong plan)
- [x] `telemetry_events` — PK ghép `(session_uuid, seq)`, INSERT-only (REVOKE UPDATE/DELETE
      cho `mindkid_app`), **không** FK nào trỏ **vào** bảng này (D-Z)
- [x] `child_daily_stats` · `level_daily_stats` · `skill_daily_stats` — cột chi tiết theo
      [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) §7.1 (spec `draft`
      — chỉ tạo cột khoá chính đã rõ trong [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.5, **ask first** nếu
      cột nào chỉ có ở [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) và chưa rõ ràng)
- [x] `pnpm db:generate` (+ `--custom` cho trigger) → đọc SQL → `pnpm db:migrate`
- [x] Integration test:
      - [x] `BR-SPT-03` — hai hàng `telemetry_events` cùng `(session_uuid, seq)` → PK từ chối
      - [x] `BR-SPT-06` — `play_sessions` không `content_version` → NOT NULL từ chối
      - [x] `BR-SPT-07` (trigger) — `UPDATE` trên `play_sessions` đã `completed` → từ chối;
            `UPDATE` khi còn `in_progress` → cho phép (test cả hai nhánh, không chỉ nhánh chặn)
      - [x] CHECK `child_profile_id`/`guest_device_id` — thiếu cả hai → từ chối
      - [x] D-Z — quét toàn schema, không FK nào target `telemetry_events`
      - [x] `telemetry_events` INSERT-only — `UPDATE` bằng role app bị từ chối
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.12 — schema play`

## Bước 13 — `schema/adaptive.ts`

File: `packages/db/src/schema/adaptive.ts` — theo
[`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.6–7.7

- [x] `mastery_state` — `(child_profile_id, skill_id)` PK ghép, `skill_id` **FK thật** tới
      `skills.id` (`BR-SPT-05` — không chuỗi tự do), `p_learn` CHECK `>= 0 AND <= 1`
      (`BR-SPT-08`), `ema_correct` CHECK 0–1
- [x] `level_params` — `(child_profile_id, game_level_id)`
- [x] `pnpm db:generate` → đọc SQL → `pnpm db:migrate`
- [x] Integration/property test:
      - [x] `BR-SPT-05` — `mastery_state.skill_id` không tồn tại → FK từ chối
      - [x] `BR-SPT-08` — `p_learn = 1.5` → CHECK từ chối
      - [x] property test: `p_learn ∈ [0,1]` sau mọi chuỗi cập nhật giả lập
            ([`testing-strategy.md`](../specs/08-quality/testing-strategy.md) §7.2)
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.13 — schema adaptive`

## Bước 14 — Seed idempotent (song song được, chỉ cần Bước 3 xong)

File: `packages/db/src/seed.ts`

- [x] Seed `entitlement_keys` — đúng 16 key theo
      [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) §7.1, upsert theo
      `key` (idempotent)
- [x] Seed `packages` — `PKG-standard`, `PKG-premium` theo
      [`package-catalog.md`](../specs/00-foundation/package-catalog.md) §7.1, `offers[].price_vnd
      = PENDING_PRICE_VND` (hằng số = 0, comment trỏ [`package-catalog.md`](../specs/00-foundation/package-catalog.md) §11 Q1 — **không**
      bịa giá thật, xem plan.md §4), upsert theo `code`
- [x] Seed `package_entitlements` — bảng ánh xạ theo §7.1 của [`package-catalog.md`](../specs/00-foundation/package-catalog.md)
      ("Entitlement mở" — `standard` 5 key, `premium` 7 key), upsert theo `(package_code,
      entitlement_key)`
- [x] **Không** seed `game_templates`, taxonomy Lớp 1, hay bất kỳ bảng nào ngoài ba bảng trên
      — đó là việc của roadmap P0 bước 9 / P1, ngoài phạm vi task này
- [x] `pnpm db:seed` — exit 0, đếm số hàng ba bảng
- [x] `pnpm db:seed` lần thứ hai — số hàng **không đổi** (test tự động, không chỉ chạy tay)
- [x] `pnpm test` xanh
- [x] Commit `feat(db): P0 bước 8.14 — seed idempotent entitlement_keys + packages`

## Bước 15 — Sweep test toàn corpus + đóng task

- [x] Đếm dòng mỗi file `packages/db/src/schema/*.ts` — không file nào > 400 dòng (`BR-DM-11`)
- [x] Đếm test orphan polymorphic — đúng **9** ca, khớp danh sách đóng 9 dòng của DMO §7.2
      (`BR-DM-04`)
- [x] Quét `packages/db/src` tìm chuỗi SQL thô ngoài Drizzle — chỉ còn `sql\`\`` cho tăng
      nguyên tử/coalesce và trigger trong migration (`BR-DM-06`, D2)
- [x] `docker compose down -v && docker compose up -d` — khôi phục hoàn toàn từ đầu
- [x] `pnpm db:migrate` trên DB rỗng — exit 0, toàn bộ 11 module
- [x] `pnpm db:seed` — exit 0, chạy lại lần hai số hàng không đổi
- [x] `pnpm check` xanh
- [x] `pnpm test` xanh (toàn bộ integration test của 11 module)
- [x] `pnpm check:services` xanh
- [x] `lefthook run pre-push` xanh (chạy thật bằng `git push`, không chỉ lệnh thủ công — xem
      cảnh báo ở [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §9 về lệnh thủ công thiếu ref data)
- [x] Push `origin/main`
- [x] Commit cuối `docs(tasks): T7 — đóng task migration đầu tiên`

## Cổng dừng cuối — kết thúc task

- [x] 11/11 file schema tồn tại và migrate được từ DB rỗng
- [x] 9/9 test orphan polymorphic pass
- [x] INSERT-only verify bằng role `mindkid_app` thật (không phải owner) trên 4 bảng:
      `audit_logs` · `consent_logs` · `content_review_log` · `telemetry_events`
- [x] 2 trigger (`published` bất biến, `play_sessions` hậu-completed bất biến) có test cả
      nhánh chặn và nhánh cho phép
- [x] Seed idempotent verify bằng test tự động
- [x] `pnpm check && pnpm test && pnpm check:services` xanh
- [x] Đã push `origin/main`
- [x] Việc tiếp theo của dự án: roadmap P0 bước 9 — taxonomy service + seed Lớp 1
      ([`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md),
      [`emoji-registry.md`](../specs/01-platform/emoji-registry.md)) — task riêng, không gộp
      vào đây
