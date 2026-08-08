# Plan — Task #3: P0 bước 7 — khoá contract schema ([`data-model-overview.md`](../specs/01-platform/data-model-overview.md) → `schema-*`)

> **Hồ sơ lưu trữ.** Task #3 kết thúc 2026-08-07. File này giữ nguyên văn phong cũ, tức còn
> dùng ký hiệu và chữ viết tắt mà Task #4 đang loại bỏ. Quy ước viết hiện hành nằm ở
> [`../specs/CONVENTIONS.md`](../specs/CONVENTIONS.md), và lý do đổi nằm ở
> [`04-readability-spec.md`](04-readability-spec.md).
>
> Viết 2026-08-06. Checklist thực thi: [`03-schema-contract-todo.md`](03-schema-contract-todo.md).
> Task #1 lưu trữ: [`01-bootstrap-plan.md`](01-bootstrap-plan.md) · [`01-bootstrap-todo.md`](01-bootstrap-todo.md) (D-A…D-R).
> Task #2 lưu trữ: [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) · [`02-foundation-approve-todo.md`](02-foundation-approve-todo.md) (D-S…D-X).
> Plan này tiếp số từ **D-Y**.
>
> **Ký hiệu:** `Tn` = bước · `` = cổng dừng · `song song được` = song song được · `Mn` = chỗ contract tự
> mâu thuẫn · `D-*` = ledger quyết định · `người` = cần người. Đầy đủ:
> [`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) §4.3.
>
> Contract: [`roadmap.md`](../specs/roadmap.md) P0 bước 7 · [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §3/§10 ·
> [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) `BR-RBS-08` ("đổi contract thì đổi spec trước") · [`../SPEC.md`](../SPEC.md) §13 Cổng ra P0.
>
> Phạm vi: **vẫn chỉ contract**. Cấm `packages/db/src/schema/*.ts`, không migration.
> Viết cột Drizzle là **P0 bước 8**, task sau.

## Context

`BR-RBS-04` đã mở khoá (16/16 `00-foundation` = `approved`, commit `0552c56`…`2cfdb71`).
Việc kế tiếp theo [`roadmap.md`](../specs/roadmap.md) P0 là **bước 7 — Thiết kế schema**, và cổng ra của nó là
**bước 8: migration đầu tiên áp lên DB rỗng**.

Nhưng ba `schema-*` spec được viết **2026-08-04/05**, tức **trước** 11 quyết định đóng OQ của
Task #2 (2026-08-06). Chúng chưa biết những quyết định đó tồn tại. Đo được:

- **2 spec tự mâu thuẫn với chính dependency đã `approved` của nó** (partition, FK curriculum).
- **1 spec `approved` tự mâu thuẫn trong chính nó** — [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7 vẫn ghi `G-…\d{3}`
  trong khi §11 Q1/Q2 của **cùng file đó** đã chốt `GL-…\d{4}`.
- **6 lệch bảng** giữa [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7 (bản đồ module) và ba spec con.
- **2 ràng buộc bất khả thi ở Postgres** nếu viết đúng chữ trong spec (§Rủi ro kỹ thuật).

Đây không phải việc đọc–duyệt như Task #2. Đây là việc **hoà giải contract**: mỗi mâu thuẫn
phải chọn một bên, ghi vì sao, và sửa **bên sai** — kể cả khi bên sai là spec đã `approved`.

Approve ba `schema-*` trong trạng thái hiện tại là ký vào một bản thiết kế bảng mà **migration
bước 8 chắc chắn phải đảo lại**. Đảo một cột trước khi có dữ liệu là sửa một dòng; đảo sau khi
seed 230 skill + 690 LO là hai phase deprecation (`BR-DM-09`).

**Thời điểm này là rẻ nhất.** 0 game level, 0 LO, 0 hàng trong DB. Mọi mã nội dung còn tự do
đổi. Sau bước 9 (seed Lớp 1) thì `skills.code` bất biến theo [`CONVENTIONS.md`](../specs/CONVENTIONS.md).

---

## Trạng thái đo được

| Đo | Kết quả |
|---|---|
| `kidthink/` git | 15 commit, `main` tracking `origin/main` (remote đã có: `dinhhoabk95/kidthink`) |
| Working tree | **bẩn và đang thay đổi**: `M lefthook.yml` · `M scripts/lint-specs.ts` · `M tsconfig.json` · `M vitest.config.ts` · `?? scripts/lint-specs-lib.ts` · `?? scripts/tests/lint-specs.test.ts` · `?? scripts/vitest.config.ts` |
| Lưu ý: Phiên khác đang chạy | Có. File `scripts/lint-specs-lib.ts` (30K) + `scripts/tests/` xuất hiện **trong lúc** viết plan này (mtime 23:11→23:15). Ai đó đang tách `lint-specs.ts` thành lib có test. **T0 phải hoà việc đó trước, không ghi đè** |
| `pnpm check` | Cấm **ĐỎ** — 2 lỗi biome format trong `scripts/lint-specs-lib.ts` (số lỗi đang đổi theo từng phút) |
| `pnpm test` | **73/73** (2 file) — tăng từ 56/56, +17 unit test cho `parseFrontmatter` · C7 · C9 |
| `pnpm lint:specs` | exit 0 — 130 spec · 11 check · **0 error · 228–232 warning** |
| Spec `approved` | **16/130** (đúng 16 file `00-foundation`) |
| Spec cần approve ở task này | **6** (hoặc 7, xem D-Y): [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) · [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) · [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) · 3 × `schema-*` |
| Quyết định T8–T12 đụng schema | **11** — không cái nào được ghi vào [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) |
| OQ trong 6 spec đích | **17** (DMO 3 · SIB 2 · SCT 2 · SPT 2 · TAX 4 · GTC 4) |
| OQ đã bị đóng ở chỗ khác nhưng còn mở ở spec đích | **3** (DMO Q1 · SPT Q1 · SCT Q1) |
| Bảng lệch giữa DMO §7 và schema-* | **6** |
| Spec `01-platform` có cột `Chặn phase`/`Chủ` ở §11 | **0/26** — T7 chỉ làm `00-foundation` |
| Bảng ops mà [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.10 uỷ quyền sang spec `draft` | **6/6** |

### Nợ Task #2 để lại (kéo vào task này)

| # | Nợ | Kéo vào |
|---|---|---|
| 1 | [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §Ràng buộc chờ chưa tạo — 11 quyết định T8–T12 nằm rải trong 16 file OQ | **T5** |
| 2 | [`SPEC.md`](../SPEC.md) §13 Cổng ra P0 thiếu dòng neo **D-W** ([`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 phải có chủ trước P1) và thiếu dòng backup/monitoring (Q4 chốt P0) | **T5** |
| 3 | C6 "cột vì sao không rỗng" hạ xuống warning (`2cfdb71`) — 228 warning tồn | **Ngoài phạm vi**, theo dõi riêng |
| 4 | [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 vẫn ghi chủ = *"cần chủ có tên (D-W)"* — chưa có tên thật, hạn vẫn ghi "chờ P1" chung chung, đúng cái mà todo T7 cấm | **Checkpoint C** |
| 5 | ID quyết định **D-X dùng cho 11 quyết định khác nhau** (T9…T12) — ledger mất tác dụng truy vết | **Ngoài phạm vi**, theo dõi riêng |

---

## Mâu thuẫn đã đo — bảng đối chiếu

Mỗi dòng dưới đây là một chỗ **hai contract nói hai điều khác nhau**. Cột "Bên sai" là đề xuất,
Checkpoint B là nơi người chốt.

| # | Chỗ A | Chỗ B | Bên sai (đề xuất) |
|---|---|---|---|
| M1 | `id-conventions.md:78` — `G-` · `^G-C[1-6]-[A-Z]{2,5}-\d{3}$` · `G-C1-CNT-007` | `id-conventions.md:177-178` §11 Q1/Q2 **đã chốt** `GL-{competency}-{strand}-{template}-{seq}` + `\d{4}` | **A** — thân bài chưa cập nhật sau khi đóng OQ. Cùng một file `approved` |
| M2 | [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.4 `code` = "`G-*`", acceptance dùng `G-C1-CNT-007` | M1 | **A** — kéo theo M1 |
| M3 | `id-conventions.md:112` `Game level trong URL` = `G-C1-CNT-007`; `:133-150` 4 scenario dùng mã cũ | M1 | **A** |
| M4 | [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §11 Q1 "*Partition `telemetry_events` theo tháng ngay từ P0?*" — **còn mở** | [`event-catalog.md`](../specs/00-foundation/event-catalog.md) §11 Q2 **đóng 2026-08-06 (T11)**: **có**, partition quyết định lúc `CREATE TABLE` | **A** — SPT `depends_on: EVENT-CATALOG`, không được mở lại câu dependency đã đóng |
| M5 | [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §11 Q1 cùng câu hỏi partition — **còn mở**, ghi "Chặn P1" | idem M4 | **A** |
| M6 | [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §11 Q1 "*`curriculum_items` ghim `entity_version` hay lấy published mới nhất?*" — còn mở | [`content-versioning.md`](../specs/00-foundation/content-versioning.md) §11 Q2 **đóng (T11)**: **`code` only**, luôn published mới nhất | **A** — đóng bằng tham chiếu |
| M7 | [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.1 (**approved**) — `current_curriculum_id` **FK** | [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.1 — `current_curriculum_code` **varchar**; `BR-SCT-06` + `BR-DM-10` cấm trỏ nội dung bằng `bigserial` | **A** — spec `approved` sai, phải sửa (`BR-RBS-08`) |
| M8 | [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.3 — telemetry được phép `occurred_at` | [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.3 — `occurred_at_ms` int (tương đối) + `ingested_at` | **A** — đổi tên trong danh sách cho phép, không đổi ngữ nghĩa |
| M9 | [`actors.md`](../specs/00-foundation/actors.md) §11 Q1 (đóng T9) — "*Cột `mfa_secret` ở [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md)*" | [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.3 — `mfa_settings.secret_encrypted` (bảng phụ), `managers.mfa_enabled` bool | **A** — closure trỏ tới cột không tồn tại; sửa closure, giữ schema |
| M10 | [`package-catalog.md`](../specs/00-foundation/package-catalog.md) §11 Q2 (đóng T12) — "*Enum `billing_period` giữ chỗ cho `monthly`*" | [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.6 — `packages.offers` JSONB chứa `billing_period_vi` (nhãn tiếng Việt, không phải enum) | người **Checkpoint B** — enum cột thật hay khoá trong JSONB. Xem D-AB |
| M11 | [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) §11 Q1 "*Ai biên soạn ≥690 LO?*" — ghi **Chặn P0** | [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 **D-W** — hạ xuống **chặn P1** | **A** — đồng bộ nhãn theo D-W |

### Lệch bản đồ bảng (6 chỗ)

[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7 khẳng định **11 module** và liệt kê bảng của mỗi module. Ba spec con
định nghĩa bảng không có trong bản đồ đó, và bản đồ có một bảng không spec nào định nghĩa cột:

| Bảng | Có ở | Thiếu ở |
|---|---|---|
| `social_identities` | [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.3a (P0 theo [`roadmap.md`](../specs/roadmap.md) §P0 + [`SPEC.md`](../SPEC.md) §13) | DMO §7 module `identity` |
| `user_tags` | [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.2 | DMO §7 module `tagging` |
| `child_daily_stats` · `level_daily_stats` · `skill_daily_stats` | [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.5 | DMO §7 module `adaptive`/`play` |
| `content_review_log` | DMO §7 module `ops` → uỷ quyền [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md); DMO §7.2 tính nó vào 7 FK polymorphic | **Không spec nào định nghĩa cột.** [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.10 không có nó |

`content_review_log` là chỗ nghiêm trọng nhất: nó được 6 spec tham chiếu
([`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) · [`content-versioning.md`](../specs/00-foundation/content-versioning.md) · [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) · [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) ·
[`publish-and-version.md`](../specs/06-admin/publish-and-version.md) · [`content-review-queue.md`](../specs/06-admin/content-review-queue.md)) và bị tính vào bất biến `BR-DM-04`, nhưng
**không có chủ định nghĩa cột** — `owns` không nêu ở đâu.

---

## Rủi ro kỹ thuật — hai ràng buộc bất khả thi nếu viết đúng chữ trong spec

### R1 — Partition tháng ✗ PK `(session_uuid, seq)`

[`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 (D-X, T11) chốt partition `telemetry_events` theo tháng ngay lúc
`CREATE TABLE`. [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) `BR-SPT-03` chốt PK `(session_uuid, seq)` là **nguồn
idempotency ở tầng DB** (`BR-EVT-03`).

Postgres **bắt buộc** khoá partition phải nằm trong mọi UNIQUE/PK của bảng partitioned. Hai
quyết định này không cùng tồn tại được như đang viết:

- Partition theo `ingested_at` thì PK phải chứa `ingested_at` thì **cùng `(session_uuid, seq)` gửi
  lại ở tháng sau chèn thành công**. Idempotency mất, đúng cái `BR-EVT-03` tồn tại để chặn.
- Không partition thì vi phạm quyết định đã chốt của một spec `approved`.

**D-Z — đã chốt 2026-08-06 (người người dùng): Cấm KHÔNG partition ở P0.** Giữ PK
`(session_uuid, seq)` nguyên vẹn; [`event-catalog.md`](../specs/00-foundation/event-catalog.md) §11 Q2 **mở lại** thành chờ hoãn, chặn **P1**.

Vì sao chọn hướng này: idempotency ở tầng DB là bất biến `BR-EVT-03`, và hai lối kia đều mua
partition bằng cách hạ nó xuống tầng service ("ràng buộc không ép được ở DB là ràng buộc sẽ bị
vi phạm" — `BR-DM-04`). Ba phương án tôi đề xuất còn lại (thêm `session_month`) rẻ về kỹ thuật
nhưng thêm một cột vào bảng lớn nhất để phục vụ một quyết định chưa cần thiết ở P0 — 0 hàng
telemetry tồn tại.

Lưu ý: **Nợ này có giá và phải ghi thành số.** [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 closure nói đúng: chuyển bảng lớn
sang partitioned sau = downtime + rewrite. Vì vậy D-Z **bắt buộc kèm ba điều kiện**, ghi vào
DMO §7.3 và neo vào cổng ra P1:

1. `telemetry_events` giữ **hẹp và không có FK vào nó** — điều kiện để rewrite/`pg_partman`
   khả thi mà không phải sửa bảng khác.
2. Cổng ra P1 thêm một dòng: *quyết định partition phải đóng lại trước khi bảng vượt ngưỡng
   đo được* (đề xuất ngưỡng: 5M hàng hoặc 2GB trên t3.small — chọn ở T6).
3. Q2 mở lại phải có **tên chủ + hạn**, không ghi "chờ P1" chung chung (bài học nợ #4).

### R2 — `age_band` là cột sinh (generated) là không khả thi

[`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.1: `age_band` = "cột sinh (generated) từ `birth_year`".
[`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.1 (approved): "suy ra, không nhập".
[`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §11 Q2 để mở, ghi **chặn P0**.

`GENERATED ALWAYS AS … STORED` của Postgres đòi biểu thức **IMMUTABLE**. `age_band` cần năm
hiện tại thì không immutable thì **không compile được**. Ba lối:

| Lối | Được | Mất |
|---|---|---|
| **a. Tính lúc đọc** (view hoặc hàm ở tầng service) | 0 cột chờ, 0 job, luôn đúng | Mỗi query lọc theo band phải gọi biểu thức; index trên `birth_year` thay thế |
| b. Cột thường + job nền cập nhật đầu năm | Index trực tiếp trên `age_band` | Một job nữa để vận hành và để sai |
| c. Cột thường + trigger lúc INSERT | Đơn giản | **Sai từ lúc trẻ sang tuổi** — chính lỗi cần tránh |

**D-AA — đã chốt 2026-08-06 (người người dùng): lối a.** `age_band` không phải cột trong
`child_profiles`; nó là biểu thức suy từ `birth_year`, kèm index trên `birth_year`. Hệ quả:
`child_profiles` từ **13 cột → 12 cột** (`BR-SPT-01` "13 cột. Không hơn." phải sửa số), và
[`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.1 dòng `age_band` ghi rõ "không phải cột — suy lúc đọc".

---

## Quyết định

### Đã chốt 2026-08-06 (người người dùng)

| ID | Quyết định | Hệ quả |
|---|---|---|
| **D-Y** | Phạm vi = **7 spec** — thêm [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) | `AUTH-TOKENS-SESSIONS` vào `depends_on` của [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md); `approved` 16 → **23/130**; +4 OQ phải phân loại (T11) |
| **D-Z** | Cấm **Không partition** `telemetry_events` ở P0. Giữ PK `(session_uuid, seq)`. [`event-catalog.md`](../specs/00-foundation/event-catalog.md) §11 Q2 **mở lại**, chờ chặn P1 | **T4b mới** — sửa spec `approved` để mở lại closure. T6 giữ PK nguyên, thêm 3 điều kiện nợ (R1). Cổng ra P1 thêm 1 dòng ngưỡng đo được. Cấm thêm `session_month` ở đâu |
| **D-AA** | `age_band` suy lúc đọc, không phải cột | `child_profiles` **12 cột**; `BR-SPT-01` + acceptance §9 sửa số; index trên `birth_year` |
| **M1** | [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7 sửa theo Q1/Q2 — `GL-` + segment `template_code` + `\d{4}` | T3: regex `^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$`, ví dụ `GL-C1-CNT-MATCH-0007`; 5 call site + [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.4/§9 |
| **D-AB** | `billing_period` (M10) — enum cột thật hay khoá trong `packages.offers` JSONB? Chốt: **giữ JSONB** `offers[]`, đổi khoá `billing_period_vi`→`billing_period`, miền đóng `{yearly, monthly}` | T8: SIB §7.6 sửa khoá + ghi miền đóng, MVP chỉ dùng `yearly` |
| **D-AC** | `content_review_log` — spec nào `owns` cột của nó? Chốt: **[`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.10a** | T8: cột chuyển từ [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.2 (bản đầy đủ hơn) sang SIB; CLC giữ ngữ nghĩa |
| **D-AD** | Migration #1 gồm bảng `ops` nào? Chốt: `audit_logs`+`content_review_log`+`backup_log`; hoãn 4 bảng | T8: SIB §7.10 ghi điều kiện chặn — [`audit-log.md`](../specs/01-platform/audit-log.md)+[`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) phải `approved` trước bước 8 |
| **D-AE** | *(phát sinh 2026-08-07 khi làm T8, ngoài phạm vi M1–M11 gốc)* Người dùng: FK/quan hệ đa hình mặc định phải dùng **`id`** khoá chính, không `code`. **Lần 1** tôi giữ ngoại lệ cho taxonomy Lớp 1 + `game_templates` và cho tham chiếu "luôn theo published mới nhất" — người dùng bác: **"FK tất cả phải tham chiếu ID, không có ngoại lệ."** **Lần 2 (chốt)**: **0 ngoại lệ**. Taxonomy Lớp 1/`game_templates` giữ cột `code` (định danh hiển thị/URL, không phải FK) nhưng bảng khác trỏ tới bằng `id`. "Luôn theo published mới nhất" chuyển cơ chế: cột **`entity_id`** (neo dòng dõi, bất biến qua version, gán lúc copy-on-write) — vẫn là `id`, không phải `code` | Thêm cột `entity_id` vào 5 bảng Lớp 2 có version (`game_levels`·`lessons`·`activities`·`curricula`·`worksheets`). Đổi toàn bộ `_code`→`_id`: taxonomy Lớp 1 (`competency_id`/`strand_id`/`skill_id`/`tag_id`), `game_levels.template_id`, `content_review_log.entity_id`, `curriculum_items.entity_id`, `current_curriculum_id`, `activities.ref_id`, `lesson_activities.activity_id`, `my-library.entity_id`, +8 chỗ mirror lệch ở [`content-search.md`](../specs/01-platform/content-search.md)/[`content-tagging.md`](../specs/01-platform/content-tagging.md)/[`worksheet-model.md`](../specs/05-content/worksheet-model.md)/[`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md)/[`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md)/[`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md). **Không đổi** (external-facing, `BR-DM-10` — lớp khác): API request/response body, URL param, event payload JSONB, runtime config gửi client — những chỗ này vẫn hợp lệ dùng `code` |

Lưu ý: **Mọi ID trên đều là quyết định đụng schema.** Mỗi cái phải ghi một dòng vào
[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §Ràng buộc chờ (T5) — đó là chỗ bước 8 đọc lại trước khi viết cột, và là
nợ #1 mà Task #2 để lại.

---

## Dependency graph

`depends_on` thật của 6 spec đích (không đảo được — [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §3 + check C8):

```
                    [16 spec 00-foundation — đã approved ]
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
  TAXONOMY-SERVICE          GAME-TEMPLATE-CONTRACT      DATA-MODEL-OVERVIEW
  deps: GLOSSARY         deps: GLOSSARY           deps: GLOSSARY 
        ID-CONVENTIONS         ID-CONVENTIONS           ID-CONVENTIONS 
                                  CONTENT-LIFECYCLE        CHILD-DATA-COMPLIANCE 
        │                          │                          CONTENT-VERSIONING 
        │                          │                          │
        └──────────┬───────────────┘         ┌────────────────┼─────────────────┐
                   │                         │                │                 │
                   ▼                         ▼                ▼                 ▼
          SCHEMA-CONTENT-TAXONOMY   SCHEMA-IDENTITY-BILLING  SCHEMA-PLAY-TELEMETRY
          deps: DMO · TAX · GTC     deps: DMO · ACTORS     deps: DMO
                CONTENT-VERSIONING      ENTITLEMENT-MODEL       CHILD-DATA-COMPLIANCE 
                                           PAYMENT-FLOW            EVENT-CATALOG 
                                           (+ AUTH-TOKENS-SESSIONS nếu D-Y = 7)
```

Thứ tự thực thi:

```
T0 Commit nợ (check đỏ)  ─▶  T1 Archive Task #2  ─▶  T2 Thêm C12·C13 vào lint:specs
                                                          (chạy ngay thì phải ĐỎ 7 chỗ)
                                                                    │
                                                          CHECKPOINT A
                                                                    │
   T3 id-conventions (M1·M3) ⟂ T4 child-data-compliance (M7·M8) ⟂ T4b event-catalog (mở lại Q2, D-Z)
              ❗ ba spec đang approved — BR-RBS-08: sửa spec trước, bump reviewed
                                                                    │
                                                          CHECKPOINT B ← người chốt D-AB·D-AC·D-AD
                                                                    │
        T5 DMO: §Ràng buộc chờ + 5 bảng + SPEC.md §13   ⟂   T6 SPT   ⟂   T7 SCT   ⟂   T8 SIB
                                                                    │
                                                          CHECKPOINT C
                                                                    │
        T9 approve TAX+GTC  ─▶  T10 approve DMO  ─▶  T11 approve 3 × schema-* (+ ATS)
                                                                    │
                                                          CHECKPOINT D
                                                          mở khoá P0 bước 8
```

T3song song đượcT4song song đượcT4b song song được (file khác nhau). T5…T8 song song được **sau** Checkpoint B, vì
T6/T7/T8 chỉ dán quyết định đã chốt vào file của mình. T9→T11 **tuần tự bắt buộc** — C8 chặn
nếu đảo.

---

## Phase 0 — Nền đo được

### T0 — Đóng nợ working tree Lưu ý: **có phiên khác đang sửa cùng file**

**Mô tả:** `pnpm check` đang **đỏ**. Không mở task mới trên gate đỏ.

Nhưng working tree không chỉ có nợ của tôi. Trong lúc viết plan này (23:11→23:15) một phiên
khác đã tạo `scripts/lint-specs-lib.ts` (30K) · `scripts/tests/lint-specs.test.ts` ·
`scripts/vitest.config.ts` và sửa `tsconfig.json` · `vitest.config.ts` — tức đang **tách
`lint-specs.ts` thành lib có unit test**. `pnpm test` đã lên **73/73** (+17 test cho
`parseFrontmatter` · C7 · C9).

Đó chính là việc trả nợ Task #2 (ca âm cho từng check). **T0 hoà vào việc đó, không ghi đè
và không commit hộ.** Bước một của T0 là xác nhận phiên đó đã dừng.

**Việc**
1. Xác nhận phiên khác đã xong (`git status` không đổi qua 2 lần đo cách nhau vài phút).
2. Đọc `scripts/tests/lint-specs.test.ts` — biết check nào **đã** có test (`parseFrontmatter`,
   C7, C9) để T2 không viết lại.
3. Sửa lỗi biome format còn lại; không refactor thêm.
4. Ca âm cho hai thay đổi hành vi chưa có test.

**Acceptance**
- `pnpm check` exit 0 · `pnpm test` ≥ 73/73.
- **Ca âm C6-trùng**: fixture định nghĩa `BR-DM-01` lần thứ hai ở §6 spec khác thì
  `lint:specs` exit **1**, in `file:line` + `C6`. Xoá fixture thì exit 0.
  *(Diff chưa commit đổi C6 từ `warn` sang `fail` cho ca này — đổi độ nghiêm khắc của cổng thì
  phải có ca âm chứng minh nó bắt được.)*
- **Ca âm C10-codeblock**: `GitHub Actions` **trong** code fence thì **không** báo; ngoài fence
  thì báo. Cả hai chiều.
- `git status --short` rỗng, và số test không giảm so với 73.

### T1 — Lưu trữ Task #2 (đã làm khi viết plan này)

[`plan.md`](../tasks/plan.md)/[`todo.md`](../tasks/todo.md) của Task #2 → `02-foundation-approve-{plan,todo}.md`, kèm banner ghi rõ
checkbox không phản ánh sự thật và ba acceptance chưa xong (nợ #1–#3).

**Acceptance**
- `git log --follow docs/tasks/02-foundation-approve-plan.md` ≥ 2 commit (giữ history sau rename).
- `docs/tasks/plan.md` + [`todo.md`](../tasks/todo.md) = Task #3.
- Mọi link tới [`plan.md`](../tasks/plan.md)/[`todo.md`](../tasks/todo.md) trong corpus vẫn resolve (check C4 xanh).

### T2 — Hai check mới: C12 · C13

**Mô tả:** Sáu lệch bảng và mâu thuẫn `G-`/`GL-` **không có cổng nào bắt được**. Chúng tồn tại
được vì C1–C11 không đọc §7. Sửa tay 6 chỗ mà không thêm cổng thì lần thứ bảy lại lọt.

**C12 — bản đồ bảng khớp hai chiều.** Trích tên bảng từ [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7 (cột `Bảng`)
và từ §7.x của ba `schema-*`; lỗi nếu một bên có mà bên kia không.

**C13 — mã ID trong spec khớp [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7.** Với mỗi hàng của bảng §7
(`prefix`, `regex`, `ví dụ`): (a) `ví dụ` phải khớp `regex` của **cùng hàng** — bắt M1 ngay
trong một file; (b) mọi literal dạng mã trong corpus khớp prefix nào thì phải khớp regex của
prefix đó — bắt M2/M3.

**Acceptance**
- **Chạy ngay khi viết xong, TRƯỚC T3–T8 thì exit 1**, và báo đúng:
  - C12: 6 chỗ (`social_identities` · `user_tags` · 3 × `*_daily_stats` · `content_review_log`).
  - C13: `id-conventions.md:78` (ví dụ `G-C1-CNT-007` ✗ regex sau khi T3 đổi) và ≥5 call site `G-C1-…`.
  - Script mới mà xanh ngay là dấu hiệu nó không đo gì (bài học `ultracite` · `dependency-cruiser` · `check-services`).
- **Ca âm C12**: xoá một bảng khỏi DMO §7 thì exit 1, in tên bảng + spec định nghĩa nó.
- **Ca âm C13**: sửa một `ví dụ` trong [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7 thành mã sai thì exit 1 tại đúng dòng đó.
- Ca âm wiring: gỡ `lint:specs` khỏi `check` thì `pnpm check` không còn kiểm spec.
- [`SPEC.md`](../SPEC.md) §7 + [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10: cập nhật **13 check** (sửa spec trước — `BR-RBS-08`).

### CHECKPOINT A — người duyệt

- [ ] `pnpm check` xanh, working tree sạch.
- [ ] C12 + C13 **đỏ đúng 7 nhóm chỗ đã biết**, kèm 2 ca âm chặn đúng.
- [ ] Duyệt trước khi động vào **nội dung** spec.

---

## Phase 1 — Sửa ba spec đã `approved`

> Quan trọng: T3 · T4 · T4b đều sửa file `status: approved`. `BR-RBS-08` đòi: **đổi contract thì đổi
> spec trước**, ghi lý do, bump `reviewed:`. Diff phải đọc được từng dòng — không sửa hàng
> loạt bằng `sed` toàn corpus.
>
> Ba loại sửa khác nhau, đừng trộn: T3/T4 sửa chỗ **ghi sai quyết định** (quyết định không
> đổi). T4b **mở lại một quyết định đã đóng** — loại nặng hơn, cần ghi vì sao mở và ai giữ.

### T3 — [`id-conventions.md`](../specs/00-foundation/id-conventions.md): `G-…\d{3}` → `GL-…\d{4}` (M1 · M2 · M3)

**Mô tả:** §11 Q1/Q2 của chính file này đã chốt format mới ngày 2026-08-06 nhưng thân bài
không được cập nhật. Kết quả: một spec `approved` khẳng định hai định dạng khác nhau cho cùng
một mã.

**Vì sao làm bây giờ:** 0 game level tồn tại. [`CONVENTIONS.md`](../specs/CONVENTIONS.md) khai `game_levels.code` bất
biến **sau khi published** — chưa có hàng nào published nên đổi format là sửa text. Sau bước 9
(seed) thì mỗi lần đổi là một migration + sửa mọi tham chiếu nội dung.

**Việc**
- §7 hàng `Game Level`: prefix `GL-`, regex `^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$`
  (thêm segment `template_code` theo Q1), ví dụ `GL-C1-CNT-MATCH-0007`.
- §7 dòng "Game level trong URL" + 4 scenario §9 dùng mã cũ → mã mới.
- [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.4 `code` "`G-*`" → "`GL-*`, regex ở [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7" và
  acceptance §9 scenario `BR-SCT-03`.
- Quét toàn corpus mã `G-C…` còn sót.
- `reviewed: 2026-08-06`, thêm dòng lịch sử vào §11 Q1/Q2 ghi "thân bài cập nhật T3".

**Acceptance**
- C13 xanh: mọi `ví dụ` khớp `regex` cùng hàng; 0 literal `G-C…` còn trong corpus.
- `grep -rn 'G-C[1-6]-' docs/` → rỗng (trừ dòng lịch sử đã gạch).
- Diff **không** đổi bất kỳ prefix nào khác (`EMJ-` · `PKG-` · `LO-` …).
- [`id-conventions.md`](../specs/00-foundation/id-conventions.md) vẫn `approved`, `reviewed` = ngày sửa.

### T4 — [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md): 2 tên cột (M7 · M8)

**Việc**
- §7.1 `current_curriculum_id` FK → `current_curriculum_code` varchar, ghi vì sao:
  `BR-DM-10` + `BR-SCT-06` cấm trỏ nội dung có version bằng `bigserial`.
- §7.1 dòng `age_band`: theo D-AA ghi rõ "không phải cột — suy từ `birth_year` lúc đọc".
- §7.3 danh sách cho phép: `occurred_at` → `occurred_at_ms` (int, tương đối so với
  `play_sessions.started_at`) + `ingested_at`. Cấm nới danh sách cấm.
- Cấm **Không** thêm `session_month` — D-Z bỏ partition ở P0.
- `reviewed: 2026-08-06`.

**Acceptance**
- Danh sách cấm §7.1/§7.3 **không đổi một chữ** — diff chỉ chạm dòng cột được phép.
- [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.1 và [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.1 khớp **từng tên cột** (kiểm tay, ghi vào todo).
- C4 · C9 xanh.

### T4b — [`event-catalog.md`](../specs/00-foundation/event-catalog.md): mở lại Q2 theo D-Z song song được

**Mô tả:** D-Z đảo một closure đã đóng ngày 2026-08-06 (T11). Đây là loại sửa nặng nhất trong
task — không phải "ghi sai quyết định" mà là "đổi quyết định". Nó phải để lại vết đọc được, vì
lần tới người đọc [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 sẽ thấy hai lượt kết luận trái nhau.

**Việc**
- §11 Q2: bỏ gạch `~~2~~`, ghi cả hai lượt theo thứ tự thời gian:
  - `2026-08-06 (T11)` chốt **có** partition — lý do gốc (t3.small, prune, vacuum).
  - `2026-08-06 (T4b, D-Z)` **mở lại** — lý do: xung đột `BR-EVT-03`, khoá partition phải nằm
    trong PK thì partition mua bằng cách hạ idempotency xuống tầng service. Chọn giữ bất biến DB.
- Q2 → chờ chặn **P1**, có **tên chủ** + hạn viết bằng câu đo được (không "chờ P1" chung chung).
- Ghi **ngưỡng kích hoạt** đo được vào Q2 — đề xuất: `telemetry_events` vượt **5M hàng** hoặc
  **2GB** trên t3.small thì quyết định partition phải đóng lại trước khi vượt.
- Ghi **điều kiện giữ khả thi**: `telemetry_events` không được có FK trỏ **vào** nó, và giữ cột
  hẹp — nếu không, rewrite ở P1 lan sang bảng khác.
- `reviewed: 2026-08-06`; [`event-catalog.md`](../specs/00-foundation/event-catalog.md) giữ `status: approved`.

**Acceptance**
- §11 Q2 đọc được **cả hai** lượt kết luận và ngày của từng lượt — không xoá lượt cũ.
- Q2 có tên chủ thật + ngưỡng số, không có chữ "sau này"/"khi cần".
- `grep -n 'PARTITION' docs/specs/` → chỉ còn ở Q2 (bảng chờ) và DMO §7.3, không ở
  [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.3 như một ràng buộc phải thi hành.
- C8 xanh — [`event-catalog.md`](../specs/00-foundation/event-catalog.md) vẫn `approved`, mọi spec phụ thuộc nó không đổi trạng thái.

### CHECKPOINT B — người chốt D-AB · D-AC · D-AD

D-Y · D-Z · D-AA · M1 **đã chốt 2026-08-06** (xem §Quyết định). Còn lại:

- [ ] **D-AB** — `billing_period` trong JSONB hay tách bảng `package_offers`?
- [ ] **D-AC** — spec nào `owns` `content_review_log`?
- [ ] **D-AD** — module `ops` trong migration #1 gồm những bảng nào?
- [ ] Nợ #4: [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 — **tên chủ thật** + hạn viết bằng câu đo được.
- [ ] **Chủ + ngưỡng cho [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 vừa mở lại** (T4b) — cùng loại nợ với #4, đừng lặp lại.

---

## Phase 2 — Hoà giải quyết định vào spec (T5…T8 song song)

### T5 — [`data-model-overview.md`](../specs/01-platform/data-model-overview.md): §Ràng buộc chờ + bản đồ + neo [`SPEC.md`](../SPEC.md) §13

**Việc**
- Thêm **§7.3 Ràng buộc chờ** — bảng `| Nguồn | Quyết định | Ngày | Ảnh hưởng cột |`, gồm
  **11 quyết định T8–T12** + **6 quyết định D-Y…D-AD**:

  | Nguồn | Quyết định | Ảnh hưởng |
  |---|---|---|
  | [`id-conventions.md`](../specs/00-foundation/id-conventions.md) Q1·Q2 (T9) | `GL-…{template}…\d{4}` | `game_levels.code` regex |
  | [`actors.md`](../specs/00-foundation/actors.md) Q1 (T9) | Manager MFA bắt buộc từ ngày đầu | `mfa_settings` NOT NULL đường vào |
  | [`actors.md`](../specs/00-foundation/actors.md) Q2 (T9) | `pending_verification` không tạo child | guard tầng service |
  | [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q4 (T9) | backup/monitoring = P0 | `backup_log` vào migration #1 |
  | `monorepo…` Q3 (T9) | `payment`/`notification` inline | không đụng cột |
  | [`access-ladder.md`](../specs/00-foundation/access-ladder.md) Q3 (T10) | giữ enum **4 bậc** `guest·login·standard·premium` | `access_tier` mọi bảng Lớp 2 |
  | [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q3 (T10) | **không** `scheduled` ở MVP | enum status **6** giá trị |
  | [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2 (T11) | curriculum trỏ `code` only | `curriculum_items.entity_code` |
  | [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 (T11 → **mở lại** T4b/D-Z) | **không** partition ở P0; PK `(session_uuid, seq)` giữ nguyên | `telemetry_events` — kèm ngưỡng 5M hàng/2GB + điều kiện không FK trỏ vào |
  | [`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q2 (T12) | chỉ bán **năm** ở MVP | D-AB |
  | **D-Y** (2026-08-06) | phạm vi 7 spec, [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) vào `depends_on` SIB | `active_sessions.refresh_token_hash` · `reauth_at` |
  | **D-AA** (2026-08-06) | `age_band` suy lúc đọc | `child_profiles` **12** cột + index `birth_year` |
  | D-AB · D-AC · D-AD | (điền sau Checkpoint B) | |

- §7 bản đồ module: thêm `social_identities` (identity) · `user_tags` (tagging) ·
  3 × `*_daily_stats`; sửa "**11 module**" nếu số bảng đổi làm lệch câu đếm.
- `content_review_log` theo D-AC: bản đồ trỏ đúng spec `owns`.
- Đóng §11 Q1 (partition) bằng **D-Z**: không partition ở P0; câu hỏi có **một chủ duy nhất** là
  [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 — không để hai spec cùng hỏi một câu. Q2 (retention `audit_logs`) ·
  Q3 (read replica) → hoãn **có chủ + phase**.
- Thêm 2 cột `Chặn phase` · `Chủ` vào §11 (đồng bộ định dạng `00-foundation` sau T7 Task #2).
- **Nợ #2 + D-Z** — [`SPEC.md`](../SPEC.md) §13 thêm đúng **ba** dòng:
  - Cổng ra P0: `[ ] mvp-scope Q1 có chủ có tên trước khi mở P1` (neo D-W).
  - Cổng ra P0: `[ ] backup-and-restore + monitoring-and-alerting approved và backup_log có trong migration P0` (neo Q4/T9).
  - **Cổng ra P1**: `[ ] event-catalog Q2 (partition telemetry_events) đóng lại trước khi bảng vượt 5M hàng / 2GB` (neo D-Z).

**Acceptance**
- C12 xanh — bản đồ khớp hai chiều 100%.
- §7.3 có **≥19 dòng** (11 closure T8–T12 + D-Y…D-AD), mỗi dòng có nguồn (`spec` + `Qn` +
  task) và cột ảnh hưởng.
- [`SPEC.md`](../SPEC.md) §13 tăng đúng **3** ô checklist — 2 ở Cổng ra P0, 1 ở Cổng ra P1.
- `grep -rn 'partition' docs/specs/` → chỉ ở [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 · DMO §7.3 · [`SPEC.md`](../SPEC.md) §13
  Cổng ra P1. Cấm ở [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) như ràng buộc phải thi hành.
- Ca âm: xoá một dòng §7.3 thì *(không có cổng máy bắt được — vì vậy checklist tay ở
  Checkpoint C phải đối chiếu 11 closure với 11 dòng)*. Ghi rõ đây là cổng người, không
  giả vờ là cổng máy.

### T6 — [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) (M4 · R1 · R2 · M7 · M8)

**Việc**
- §7.3: theo **D-Z** giữ PK `(session_uuid, seq)` **nguyên vẹn**; `BR-SPT-03` không đổi. Thêm
  một dòng ghi rõ bảng này **không** partitioned ở P0 và **hai điều kiện giữ đường mở**:
  (a) không FK nào trỏ **vào** `telemetry_events`; (b) giữ cột hẹp — không thêm cột suy được.
  Trỏ [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 làm chủ câu hỏi.
- §7.1: theo **D-AA** bỏ `age_band` khỏi bảng cột, thêm index `birth_year`; `BR-SPT-01`
  "13 cột" → "**12 cột**"; acceptance §9 scenario `BR-SPT-01` sửa 13 → 12 và thêm assert
  "`age_band` không là cột".
- §7.1: `current_curriculum_code` — khớp T4.
- §7.5: 3 bảng rollup — khớp T5 (bản đồ DMO).
- §11 Q1 → **đóng** bằng D-Z (không partition ở P0, chủ câu hỏi = [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2).
  Q2 (`age_band`) → **đóng** bằng D-AA.
- §11 thêm cột `Chặn phase` · `Chủ`.
- §9 thêm scenario cho hai điều kiện của D-Z: quét schema tìm FK trỏ vào `telemetry_events`
  thì **0 kết quả** (nếu có, đường partition ở P1 đã bị chặn).

**Acceptance**
- 0 OQ mở còn lại ở SPT (2/2 đóng, có ngày + vì sao).
- `BR-SPT-03` + PK **không đổi một chữ** so với bản hiện tại — D-Z là quyết định *không làm gì*.
- Số cột `child_profiles` khớp **ba chỗ**: SPT §7.1 · `BR-SPT-01` · acceptance §9.
- [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.1 và SPT §7.1 khớp từng tên cột (đối chiếu tay, ghi kết quả).
- Có ≥1 scenario **fail được** cho điều kiện "0 FK trỏ vào `telemetry_events`".
- `grep -n 'session_month' docs/` → **rỗng** (đề xuất bị bác, không để lại vết trong spec).

### T7 — [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) (M2 · M6)

**Việc**
- §7.4 `code` → `GL-*` (khớp T3); acceptance §9 dùng mã mới.
- §11 Q1 → **đóng** bằng [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2 (T11): `curriculum_items` không ghim
  `entity_version`, luôn published mới nhất. Ghi hệ quả: đổi nội dung published thì mọi
  curriculum thấy bản mới ngay, **không có** đường ghim.
- §11 Q2 (`lesson_activities` copy theo version) → hoãn có chủ, chặn P3.
- §7.2 `user_tags` — khớp T5.
- Xác nhận enum status **6** giá trị, không `scheduled` ([`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q3/T10) — ghi
  tham chiếu vào `BR-SCT-02` để không ai thêm giá trị thứ 7 mà không sửa [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md).
- §11 thêm cột `Chặn phase` · `Chủ`.

**Acceptance**
- C13 xanh trên file này.
- 0 chỗ còn ghi `G-*`; 0 chỗ ghi `scheduled`.
- `BR-SCT-02` trỏ tới [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7 làm nguồn 6 giá trị.

### T8 — [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) (M9 · M10 · D-AC · D-AD · D-Y)

**Việc**
- Theo D-Y: thêm `AUTH-TOKENS-SESSIONS` vào `depends_on`.
- Theo D-AB: `packages.offers` khoá `billing_period_vi` → `billing_period`, miền đóng
  `{yearly, monthly}`, ghi rõ MVP chỉ dùng `yearly` ([`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q2).
- Theo D-AC: thêm §7.10a định nghĩa cột `content_review_log` (INSERT-only,
  `(entity_type, entity_id)` polymorphic — bảng thứ 7 trong `BR-DM-04`), hoặc trỏ spec khác nếu
  Checkpoint B chọn khác.
- Theo D-AD: §7.10 ghi rõ bảng nào vào **migration #1**, bảng nào chờ spec sở hữu — và ghi
  **điều kiện chặn**: [`audit-log.md`](../specs/01-platform/audit-log.md) + [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) phải `approved` trước bước 8.
- Sửa [`actors.md`](../specs/00-foundation/actors.md) Q1 closure (M9): trỏ `mfa_settings.secret_encrypted`, không `mfa_secret`.
  Theo [`actors.md`](../specs/00-foundation/actors.md) Q1 (MFA bắt buộc), ghi rõ bất biến "Manager không hoạt động khi
  `mfa_settings.confirmed_at IS NULL`" và **ép ở đâu** (service, không ép được ở cột).
- §7.3a `social_identities` — khớp T5 (bản đồ DMO).
- §11 thêm cột `Chặn phase` · `Chủ`; 2 OQ hiện có → đóng hoặc hoãn có chủ.

**Acceptance**
- C12 xanh; `content_review_log` có đúng **một** spec `owns`.
- `BR-DM-04` + DMO §7.2 vẫn đếm **7** FK polymorphic sau khi thêm §7.10a.
- [`actors.md`](../specs/00-foundation/actors.md) §11 Q1 và SIB §7.3 nêu **cùng một tên cột**.
- §7.10 nêu rõ bảng ⨯ migration, không để "xem spec X" cho bảng thuộc migration #1.

### CHECKPOINT C

- [ ] `pnpm lint:specs` exit 0 — **13 check** trên 130 spec.
- [ ] `pnpm check` exit 0 · `pnpm test` exit 0 (56/56).
- [ ] Đối chiếu tay: **11 closure T8–T12 <-> 11 dòng** DMO §7.3 (cổng người, không có cổng máy).
- [ ] Nợ #4 đã đóng: [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 có tên chủ thật.
- [ ] 1 commit / task, message ghi rõ đóng M mấy / D nào.

---

## Phase 3 — Approve theo `depends_on` (không đảo)

Mỗi spec đúng 4 bước: (1) checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10 phần thủ công → (2) đóng OQ chặn P0
kèm **vì sao + ngày** → (3) `status: approved` + `reviewed:` → (4) `lint:specs` xanh (C8 gác thứ tự).

### T9 — Layer 1 (song song được)
- [ ] [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) — Q1 → chờ **P1** theo **D-W** (M11), có tên chủ. Q2 hoãn (sau MVP) ·
      Q3 chặn [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) · Q4 chặn nội dung P1. Thêm 2 cột §11.
- [ ] [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) — `phase: P1` nhưng **approve bây giờ** vì
      [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) (P0) `depends_on` nó. Ghi rõ trong §11: `phase` = phase
      *implement*, không phải phase *approve*. Q1 (khảo sát 60 game type) → hoãn, chặn
      **phạm vi P1**, không chặn hình dạng contract. Q2·Q3·Q4 hoãn có chủ.

### T10 — Layer 2
- [ ] [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) — sau T5, 3/3 OQ có kết luận.

### T11 — Layer 3
- [ ] [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) (**D-Y = 7**) — 4 OQ phân loại; deps `ACTORS`·`ERROR-CODES`·`REPO-BOOTSTRAP` .
- [ ] [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) · [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) · [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md).

### CHECKPOINT D — mở khoá P0 bước 8

- [ ] **7** spec đích `status: approved`; tổng `approved` = **23/130**.
- [ ] `pnpm lint:specs` exit 0 · `pnpm check` exit 0 · `pnpm test` exit 0.
- [ ] **Ca âm C8**: đặt [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) về `draft` thì 3 `schema-*` chuyển đỏ.
- [ ] **Ca âm C12**: xoá `social_identities` khỏi DMO §7 thì đỏ.
- [ ] **Ca âm C13**: đổi một ví dụ mã thành `G-C1-CNT-007` thì đỏ.
- [ ] [`todo.md`](../tasks/todo.md) ghi việc kế tiếp: **P0 bước 8** — `packages/db/src/schema/*.ts` + migration #1,
      kèm điều kiện chặn từ D-AD ([`audit-log.md`](../specs/01-platform/audit-log.md) + [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) phải approved trước).
- [ ] người Người duyệt — sau đây là PR schema đầu tiên, đảo lại tốn hai phase deprecation.

---

## Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Sửa 3 spec `approved` (T3·T4·T4b) mở tiền lệ "approved vẫn sửa được tuỳ ý" | **Cao** | T3/T4 chỉ sửa chỗ file **tự mâu thuẫn với chính nó** hoặc với dependency `approved` — quyết định không đổi. T4b là loại khác: **đổi** quyết định, nên phải giữ cả hai lượt kết luận đọc được trong §11. Mỗi sửa: bump `reviewed`, 1 commit riêng, đọc diff từng dòng |
| **D-Z chôn nợ partition**: hoãn sang P1 rồi quên, tới lúc `telemetry_events` đã lớn thì rewrite = downtime | **Cao** | Ba neo bắt buộc: (1) [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 có **tên chủ + ngưỡng số** (5M hàng / 2GB); (2) [`SPEC.md`](../SPEC.md) §13 **Cổng ra P1** có một ô checklist; (3) DMO §7.3 ghi điều kiện giữ đường mở (0 FK trỏ vào bảng, cột hẹp) + §9 có scenario quét FK. Đây đúng loại nợ mà D-W đã mắc một lần (nợ #4) |
| Approve [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) (P1) chỉ để mở đường P0 thì contract chưa chín bị đóng băng | Trung bình | Q1 (khảo sát 60 game type) hoãn **có chủ**; ghi rõ approve = *hình dạng* contract, không phải *phạm vi* 6 template. Nếu khảo sát P1 đổi hình dạng thì version mới của spec, không phải sửa im lặng |
| §Ràng buộc chờ trở thành bãi rác: 17 dòng viết xong không ai đọc ở bước 8 | Trung bình | Checkpoint D ghi rõ bước 8 **bắt đầu** bằng việc đọc §7.3 và tick từng dòng. Mỗi dòng có cột "ảnh hưởng cột" thì ánh xạ trực tiếp sang file Drizzle |
| C12/C13 xanh giả — parse markdown lỏng nên không thấy bảng nào | **Cao** | Bắt buộc **đỏ ngay lần chạy đầu** trên 7 nhóm chỗ đã đo + 2 ca âm. Bài học `ultracite` (exit 0 khi có lỗi) · `dependency-cruiser` (exclude làm 2/3 rule vô dụng) |
| Module `ops` chặn migration #1 muộn: phát hiện ở bước 8 rằng 6/6 bảng uỷ quyền sang spec `draft` | Trung bình | D-AD chốt **ngay ở Checkpoint B**, và Checkpoint D ghi điều kiện chặn vào [`todo.md`](../tasks/todo.md) thay vì để bước 8 tự phát hiện |
| 228 warning `lint:specs` che một warning mới thành ra vô hình | Trung bình | Ngoài phạm vi task này, nhưng todo ghi rõ: **so số warning trước/sau**, tăng thì phải giải thích |

---

## Ngoài phạm vi

| Việc | Vì sao |
|---|---|
| `packages/db/src/schema/*.ts` + migration #1 | Đó là **P0 bước 8**, sau Checkpoint D |
| Approve [`audit-log.md`](../specs/01-platform/audit-log.md) · [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) | P0 nhưng bước 11 / cổng ra P0; D-AD chỉ **ghi điều kiện chặn**, không kéo vào đây |
| Approve [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md) · [`notification-service.md`](../specs/01-platform/notification-service.md) · [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) | P1+, ship cùng tính năng sở hữu |
| Dọn 228 warning C6 "thiếu vì sao" + nâng lại thành error | Nợ Task #2 #3 — task dọn riêng, 130 file |
| Đổi tên `D-X` thành ID riêng cho 11 quyết định T9–T12 | Nợ Task #2 #5 — cosmetic, theo dõi riêng |
| 7 chu trình `depends_on` (C7 warning) ở `02-public` · `03-account` · `06-admin` · `08-quality` | Không chạm 6 spec đích. Sửa khi phase của chúng tới |
| [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) · [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) seed (bước 9) | Sau migration |
| Task khảo sát 60 game type v1 → 6 template | P1, [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) §11 Q1 |

---

## Verification tổng

```bash
# docs/ ở trong kidthink/docs/, cùng git repo code (repo-bootstrap.md §11 Q10, Lượt 3, 2026-08-07)

cd kidthink
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH   # shell mặc định vẫn node v20

# Cổng cơ học
pnpm lint:specs     # 13 check × 130 spec — exit 0, và số warning ≤ 228
pnpm check          # lint · lint:tokens · lint:deps · lint:specs · typecheck
pnpm test           # 56/56
pnpm check:services # PG 17.9 + Valkey 9.1.1 (host port 5433/6380)

# Ca âm bắt buộc — gate không có ca âm là gate chưa tồn tại
#  C6  : định nghĩa lại BR-DM-01 ở spec khác        thì exit 1
#  C8  : data-model-overview → draft                 thì 3 schema-* đỏ
#  C10 : "GitHub Actions" ngoài code fence           thì exit 1; trong fence thì im lặng
#  C12 : xoá social_identities khỏi DMO §7           thì exit 1 + tên bảng
#  C13 : ví dụ mã đổi về G-C1-CNT-007                thì exit 1 tại đúng dòng

# Đo kết quả cuối — grep thẳng file .md, cwd = workspace root (một cấp trên kidthink/)
cd ..
grep -l 'status: approved' docs/specs/**/*.md | wc -l          # 23
grep -rn 'G-C[1-6]-' docs/ | wc -l                             # 0
grep -rn 'session_month' docs/ | wc -l                          # 0  (đề xuất D-Z bị bác)
grep -c 'Ràng buộc chờ' docs/specs/01-platform/data-model-overview.md  # ≥ 1
```

**Cổng ra Task #3:** **7** spec `approved` (23/130) · `lint:specs` 13 check xanh có ca âm ·
[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.3 chứa **≥19 dòng** ràng buộc chờ · [`SPEC.md`](../SPEC.md) §13 có **3** dòng neo mới
(2 P0 + 1 P1) · 0 mã `G-C…` còn trong corpus · [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 mở lại **có chủ + ngưỡng số** ·
[`todo.md`](../tasks/todo.md) ghi điều kiện chặn của bước 8.
