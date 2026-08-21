# Kế hoạch — Task #7: P0 bước 8, migration đầu tiên (`packages/db`)

> Việc tiếp theo của dự án theo Cổng dừng C của Task #5
> ([`05-p0-spec-closure-todo.md`](05-p0-spec-closure-todo.md)): "roadmap P0 bước 8 — migration
> đầu tiên, task viết code đầu tiên". Đây là task **viết code** đầu tiên của dự án — mọi spec
> `00-foundation` và ba spec `schema-*` đã `approved`, gate đóng ở Task #5.
>
> Checklist chạy từng bước: [`07-first-migration-todo.md`](07-first-migration-todo.md).
>
> Mọi lệnh chạy từ thư mục `mindkid/`. Đặt lại đường dẫn Node trước mỗi phiên shell mới:
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## 0. Bối cảnh và phạm vi

**Trong phạm vi:**
- 11 file `packages/db/src/schema/*.ts` (bản đồ module của
  [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7).
- Migration Drizzle áp được lên DB rỗng (`docker-compose.yml` đã có PG 17 + Valkey 9).
- Cơ chế ép ràng buộc mà Drizzle schema DSL không diễn đạt được: INSERT-only bằng quyền DB,
  trigger chặn sửa hàng `published`/phiên đã `completed`.
- Seed script tối thiểu, idempotent (chỉ dữ liệu Lớp 1 **không phụ thuộc taxonomy**).
- Integration test cho 7 (hoặc nhiều hơn — xem §2a) FK polymorphic + mọi CHECK/trigger có
  acceptance criteria trong bốn spec `schema-*` cùng
  [`data-model-overview.md`](../specs/01-platform/data-model-overview.md),
  [`audit-log.md`](../specs/01-platform/audit-log.md) và
  [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md).

**Ngoài phạm vi — cố ý:**
- Seed đầy đủ taxonomy Lớp 1 (230 skill, C1–C6) — thuộc roadmap P0 **bước 9**
  ([`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md)), task riêng sau task này.
- Seed `game_templates` — thuộc P1 bước 1 ([`game-template-contract.md`](../specs/01-platform/game-template-contract.md)),
  chưa tới lượt.
- Bất kỳ route API nào — bước 10 trở đi (auth end-to-end) mới chạm `apps/web/server`.
- Giá `standard`/`premium` — **chưa chốt** ([`package-catalog.md`](../specs/00-foundation/package-catalog.md) §11 Q1). Xem §4.

## 1. Đồ thị phụ thuộc — 11 module schema

```
                          hạ tầng packages/db (driver, role, script)
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
   identity.ts                    taxonomy.ts                     (độc lập)
   (users, managers,                    │
    social_identities,        ┌─────────┼─────────┐
    4 bảng auth phụ,          │         │         │
    consent_logs)         tagging.ts  game.ts   (chờ Cổng dừng A)
        │                     │         │
        ├──→ billing.ts       │         │
        │    (FK→users,       │         │
        │     FK→entitlement_keys)      │
        │                     │         │
        └──→ ops.ts           │         │
             (FK→managers,    │         │
              polymorphic     │         │
              content_review_log)       │
                              │         │
                    ══════ Cổng dừng A ══════
                    (xem §2a — đóng lỗ hổng
                     spec trước khi viết
                     content.ts/curriculum.ts)
                              │         │
                              ▼         ▼
                         content.ts  curriculum.ts
                         (self-FK    (self-FK entity_id,
                          entity_id,  polymorphic
                          polymorphic curriculum_items.entity_id)
                          activities.ref_id)
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                                                               │
   child.ts (FK→users)                                                  │
        │                                                               │
        └──→ play.ts (FK→game.ts, →curriculum.ts, →content.ts) ◄────────┘
                │
                └──→ adaptive.ts (FK→taxonomy.ts skills)

                              seed (entitlement_keys + packages,
                                    chỉ phụ thuộc billing.ts)

                    integration test sweep + Cổng dừng cuối
```

Thứ tự viết code theo đúng đồ thị này — không viết `play.ts` trước `game.ts` vì
`play_sessions.game_level_id` là FK thật (D-AE: FK luôn dùng `id`).

## 2. Ba quyết định kỹ thuật cần chốt trước khi viết dòng code đầu tiên

Không spec nào đặc tả **cơ chế** cho ba điểm này — chỉ đặc tả **hành vi bắt buộc**. Cần
quyết định trước khi viết `packages/db`, ghi lại đây để không mỗi module tự chọn một cách
khác nhau.

### D1 — Hai profile kết nối DB (owner vs runtime)

`BR-DM-05`/`BR-SIB-06`/`BR-AUD-01` yêu cầu INSERT-only **ép bằng quyền DB**, không bằng quy
ước code. Điều đó chỉ có nghĩa nếu app **không** kết nối bằng role có quyền `UPDATE`/`DELETE`
trên các bảng đó.

- **Role `postgres`** (superuser, đã có sẵn trong `docker-compose.yml`) — chỉ dùng cho
  `drizzle-kit migrate` (DDL, cần quyền tạo bảng/role/trigger).
- **Role mới `mindkid_app`** (`LOGIN`, không superuser) — app runtime (`apps/*`) kết nối bằng
  role này. `REVOKE UPDATE, DELETE` trên `audit_logs` · `consent_logs` · `content_review_log` ·
  `telemetry_events` cho role này ngay sau khi tạo bảng (migration SQL, không phải bước
  riêng — xem D2).
- Tạo role này bằng **custom SQL migration** (`drizzle-kit generate --custom`), chạy một lần
  trong migration đầu tiên. Thêm `DATABASE_URL_APP` bên cạnh `DATABASE_URL` (owner) trong
  `.env` mẫu — `packages/db/src/index.ts` export hai factory riêng, app chỉ import cái dùng
  role `mindkid_app`.
- `play_sessions` **không** nằm trong danh sách REVOKE — nó mở cho `UPDATE` tới lúc
  `completed` (`BR-SPT-07`), ép bằng **trigger** (D2), không phải quyền DB.

### D2 — Trigger cho bất biến sau-một-thời-điểm

Hai chỗ cần "cấm UPDATE **sau khi** đạt trạng thái X" — quyền DB kiểu REVOKE không diễn đạt
được ("cấm có điều kiện", không phải "cấm luôn"):

| Bảng | Điều kiện chặn | Rule |
|---|---|---|
| `game_levels`, `lessons`, `activities`, `curricula`, `worksheets` | `OLD.status = 'published'` | `BR-SCT-05` |
| `play_sessions` | `OLD.completion_status = 'completed'` | `BR-SPT-07` |

Viết bằng `CREATE FUNCTION ... RETURNS TRIGGER` + `CREATE TRIGGER BEFORE UPDATE`, đặt trong
migration SQL do `drizzle-kit generate --custom` sinh khung rồi viết tay thân hàm. **Đây
không vi phạm `BR-DM-06`** ("NEVER raw SQL") — rule đó cấm raw SQL trong **code truy vấn ứng
dụng**, không cấm raw SQL trong **migration DDL**; mọi ORM (kể cả Drizzle) đều chấp nhận DDL
tay trong migration cho thứ ORM không có DSL bậc nhất (ở đây: trigger). Ghi rõ comment này
ngay trong file migration để người review sau không nhầm là vi phạm.

### D3 — `entity_id` self-FK là FK Postgres bình thường, không cần bảng registry phụ

`BR-DM-13`/D-AE mô tả `entity_id` là "neo dòng dõi": hàng version đầu `entity_id = id` (tự
trỏ), hàng version sau copy nguyên. Điều này **là** một self-referencing FK hợp lệ:
`entity_id BIGINT NOT NULL REFERENCES <bảng>(id)` — nhiều hàng version được phép cùng trỏ một
`id` (many-to-one bình thường), kể cả hàng gốc trỏ vào chính `id` của nó (self-loop, Postgres
cho phép). Không cần bảng phụ kiểu `game_level_entities(id)` để làm "registry" — `id` của
chính bảng đó đã là mục tiêu FK hợp lệ vì `id` luôn UNIQUE (PK).

## 2a. Lỗ hổng spec — bắt buộc đóng trước khi viết `content.ts` và `curriculum.ts`

**Phát hiện khi đọc chéo ba spec, chưa ai ghi nhận:**
[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.2 khai "danh sách
đóng" **bảy chỗ** FK polymorphic bắt buộc test orphan. Nhưng
[`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) mô tả thêm
**hai chỗ polymorphic thật** không có trong danh sách đó:

| Cột | Polymorphic theo | Ở đâu |
|---|---|---|
| `activities.ref_id` | `ref_type` (`game_level` hoặc `worksheet`) | §7.5 |
| `curriculum_items.entity_id` | `entity_type` (`lesson` hoặc `game_level`) | §7.6 |

[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) Boundaries ghi rõ **"Ask first: Thêm một FK polymorphic thứ tám"** —
nghĩa là con số bảy được coi là chốt, thêm cái thứ tám (ở đây là **hai** cái, thứ 8 và thứ 9)
là đổi hợp đồng, không phải chi tiết triển khai tự quyết được. Nguyên tắc của
[`roadmap.md`](../specs/roadmap.md): "Đổi contract thì đổi spec trước".

**Việc phải làm ở Bước 8 (xem todo), trước khi viết code Bước 9/10:**
1. Cập nhật [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.2 — thêm hai dòng (`activities.ref_id`,
   `curriculum_items.entity_id`) vào danh sách đóng, cùng cột "Test bắt buộc".
2. Cập nhật số đếm "Bảy chỗ" → "Chín chỗ" trong văn xuôi.
3. `reviewed` cập nhật ngày làm, giữ `status: approved` (đây là sửa lỗi sót, không phải mở
   lại toàn bộ approval flow của Task #5 — nhưng vẫn cần `pnpm --filter @mindkid/gates test` xanh sau khi sửa).
4. Ghi quyết định vào sổ cái theo đúng định dạng các mục D- trước đó trong spec.
5. **Không tự quyết định âm thầm trong PR code** — đây là lý do Bước 8 đứng thành bước riêng,
   có gate dừng, không gộp vào Bước 9.

## 3. Hạ tầng cần dựng thêm (chưa có gì trong repo hôm nay)

Kiểm tra thực tế trạng thái repo trước khi lập kế hoạch này:

| Gì | Hiện tại | Cần |
|---|---|---|
| `packages/db/src/index.ts` | `export {}` (rỗng) | Driver connection thật (owner + app, xem D1) |
| `packages/db/package.json` | Không có dependency nào | Thêm `drizzle-orm` `drizzle-kit` `postgres` |
| `pnpm-workspace.yaml` catalog | Chỉ có `postgres` driver (cho `check-services.ts`) | Thêm `drizzle-orm@^0.45`, `drizzle-kit@^0.31` (version đã chốt ở [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1 — **lockstep**, không lệch minor) |
| `package.json` gốc — scripts | Không có `db:generate`/`db:migrate`/`db:seed` | Thêm cả ba — [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §4 và acceptance criteria đòi hỏi đúng ba lệnh này |
| `docker-compose.yml` | Chỉ user `postgres` (superuser) | Thêm bước tạo role `mindkid_app` (xem D1) — làm trong migration SQL, **không** sửa `docker-compose.yml` (role là dữ liệu trong DB, không phải hạ tầng container) |
| `drizzle.config.ts` | Chưa tồn tại | Tạo ở gốc `packages/db/`, trỏ `schema: "./src/schema/*.ts"`, `out: "./src/migrations"` |

## 4. Giá gói MVP — chưa chốt, đừng tự bịa số

[`package-catalog.md`](../specs/00-foundation/package-catalog.md) §11 Q1: giá `standard` và
`premium` **"chờ chốt"**, chủ là "người quyết", chặn P2 (mở thanh toán) — **không chặn**
migration #1. Seed ở Bước 14 vẫn tạo hai hàng `packages` (`PKG-standard`, `PKG-premium`) vì
`entitlements.entitlement_key` cần chúng tồn tại để FK không rỗng, nhưng
`offers[].price_vnd` đặt hằng số `PENDING_PRICE_VND = 0` kèm comment trỏ về §11 Q1 — **không**
đoán một con số thật. Đổi từ `0` sang giá thật là việc của lúc đóng Q1, không phải việc âm
thầm chọn một số nghe hợp lý.

## 5. Task breakdown — 15 bước, cắt dọc theo module

| # | Task | File chính | Rule cốt lõi | Deps | Cỡ |
|---|---|---|---|---|---|
| 1 | Hạ tầng driver + role + script | `packages/db/src/index.ts`, `drizzle.config.ts`, migration custom #0 (role + grant) | D1, D2 (khung) | — | M |
| 2 | `identity.ts` | 8 bảng | `BR-SIB-01`…`11` | 1 | M |
| 3 | `billing.ts` | 6 bảng | `BR-SIB-02` | 1, 2 | S |
| 4 | `ops.ts` | `audit_logs`·`content_review_log`·`backup_log` | `BR-AUD-*`, `BR-BAK-03` | 1, 2 | S |
| — | **Cổng dừng A** | | | | |
| 5 | `taxonomy.ts` | 5 bảng | `BR-SCT-01` | 1 | M |
| 6 | `tagging.ts` | 4 bảng | `BR-DM-03`, `BR-SCT-07` | 5 | S |
| 7 | `game.ts` | `game_templates`·`game_levels` | `BR-SCT-02/03/05` | 5 | M |
| — | **Cổng dừng B** | | | | |
| 8 | Đóng lỗ hổng spec (§2a) | [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) | — | — | XS, **spec, không code** |
| 9 | `content.ts` | 5 bảng | `BR-SCT-05`, polymorphic mới ở §2a | 6, 7, 8 | M |
| 10 | `curriculum.ts` | 4 bảng | `BR-SCT-06`, polymorphic mới ở §2a | 9, 8 | M |
| — | **Cổng dừng C** | | | | |
| 11 | `child.ts` | `child_profiles`·`child_session_summaries` | `BR-SPT-01/02` | 2 | S |
| 12 | `play.ts` | 5 bảng | `BR-SPT-03/04/06/07` | 7, 9, 10, 11 | M |
| 13 | `adaptive.ts` | `mastery_state`·`level_params` | `BR-SPT-05/08` | 5, 11 | S |
| 14 | Seed idempotent | `packages/db/src/seed.ts` | Acceptance "seed lại không đổi số hàng" | 3 | S — **song song được với 5–13** |
| 15 | Sweep test + Cổng dừng cuối | toàn bộ | `BR-DM-04` (9 orphan test), `BR-DM-11` | tất cả | M |

Cỡ theo thang của kỹ năng lập kế hoạch: XS = 1 file không phải code, S = 1–2 file, M = 3–5
file. Không có task nào L/XL — nếu một bước phình quá cỡ lúc làm thật (ví dụ `content.ts`
kéo theo sửa nhiều hơn dự kiến), tách tiếp, đừng gộp.

**Song song được:** Bước 5–7 (nhóm taxonomy/tagging/game) độc lập với Bước 2–4 (nhóm
identity/billing/ops) — cả hai chỉ phụ thuộc Bước 1. Bước 14 (seed) chỉ phụ thuộc Bước 3, có
thể chạy bất kỳ lúc nào sau đó.

## 6. Cổng dừng

### Cổng dừng A — sau Bước 4 (identity + billing + ops)
- `pnpm db:generate` sinh migration sạch cho 3 module, đọc lại file SQL trước commit.
- Áp lên DB rỗng (`docker compose down -v && docker compose up -d && pnpm db:migrate`) — exit 0.
- Test orphan cho 4 bảng auth phụ (`BR-SIB-04`) + test INSERT-only cho `consent_logs`
  (`BR-SIB-06`) và `audit_logs` (`BR-AUD-01`) đều xanh.
- `pnpm check` xanh.

### Cổng dừng B — sau Bước 7 (taxonomy + tagging + game), **trước Bước 8**
- 7 file schema tồn tại, mỗi file ≤400 dòng.
- Trigger `BR-SCT-05` (chặn UPDATE `game_levels` khi `published`) có test xanh.
- **Dừng lại đọc §2a** trước khi động vào `content.ts`/`curriculum.ts` — đây là điểm quyết
  định cần xác nhận, không phải chỗ lướt qua.

### Cổng dừng C — sau Bước 10 (content + curriculum, hậu Bước 8)
- [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.2 đã có 9 (không phải 7) dòng, `pnpm --filter @mindkid/gates test` 0 lỗi.
- Test orphan cho `activities.ref_id` và `curriculum_items.entity_id` xanh — hai ca mới sinh
  ra từ Bước 8, không phải hai ca "cho đủ số".
- `BR-SCT-06` — test entity_id bất biến qua version (given/when/then đã có sẵn trong spec).

### Cổng dừng cuối (sau Bước 15)
- `pnpm check && pnpm test && pnpm services` xanh tại chỗ.
- 11/11 file schema tồn tại, ≤400 dòng mỗi file (`BR-DM-11`).
- 9 test orphan polymorphic pass (7 gốc + 2 mới từ §2a).
- INSERT-only: `UPDATE`/`DELETE` bằng role `mindkid_app` bị DB từ chối trên
  `audit_logs`·`consent_logs`·`content_review_log`·`telemetry_events` — verify bằng test
  thật kết nối role đó, không chỉ đọc migration SQL bằng mắt.
- Trigger chặn sửa hàng `published` (5 bảng Lớp 2) và phiên `completed` — mỗi cái có test.
- `pnpm db:seed` chạy hai lần liên tiếp, số hàng không đổi lần thứ hai.
- Không raw SQL trong code ứng dụng ngoài hai ngoại lệ của `BR-DM-06` (migration DDL không
  tính — xem D2).
- Đã push `origin/main`, mỗi bước một commit (không gộp nhiều bảng vào một commit).

## 7. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Bỏ sót Bước 8, viết `content.ts`/`curriculum.ts` với polymorphic không có test orphan | Orphan row lặng lẽ tồn tại, chỉ lộ ra khi có dữ liệu thật (mất curriculum item trỏ vào lesson đã xoá) | Cổng dừng B chặn cứng — không tiến tới Bước 9 khi §2a chưa đóng |
| Role `mindkid_app` bị quên revoke đúng bảng, hoặc app lỡ dùng owner connection cho runtime | INSERT-only chỉ là quy ước, âm thầm mất tác dụng | Test integration kết nối **bằng đúng role app**, không test bằng owner — nếu owner cũng bị chặn thì test dương tính giả |
| `drizzle-kit generate` không sinh được trigger/role (chỉ hiểu DDL từ schema DSL) | Thiếu D2/D1 nếu chỉ dựa vào generate tự động | Dùng `drizzle-kit generate --custom` để tạo khung migration rỗng, viết tay phần SQL không biểu diễn được bằng schema |
| File schema vượt 400 dòng khi viết đủ cột + CHECK + comment | Vi phạm `BR-DM-11`, phải tách giữa chừng | Đếm dòng sau mỗi module (Bước 15 sweep), tách sớm nếu áp sát 350 dòng thay vì đợi vượt |
| Giá gói giả `PENDING_PRICE_VND = 0` bị quên, lọt vào chỗ khác dùng làm giá thật | Hiển thị "0đ" cho user | Đặt tên hằng số rõ ràng + comment, và đây chỉ là seed **dev**, không chạm production tới khi §11 Q1 đóng |
