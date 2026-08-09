# Kế hoạch — Task #17: P0.4 — Ràng buộc dữ liệu trẻ trở thành ràng buộc cột

> Viết 2026-08-09, đo tại commit `5a1bb2b`, nhánh `main`. Bước sở hữu: **P0.4** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md).
> Quy trình tám việc: [`14-implementation-sequence-plan.md`](14-implementation-sequence-plan.md) mục 5.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

[`roadmap.md`](../specs/roadmap.md) đặt P0.4 **trước** khi thiết kế bảng trẻ. Thực tế đã chạy
ngược: P0.7 và P0.8 đã tick, `child_profiles` và `telemetry_events` đã tồn tại trong
migration, và [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) đã
mang `status: implemented`.

Đo lại schema thật đối chiếu danh sách đóng: **6 trong 12 cột của `child_profiles` không
thuộc danh sách đóng**, và `telemetry_events` **không có cột `child_uuid`** — tức là cơ chế ẩn
danh hoá mà `BR-CDC-10` và `BR-SPT-04` dựa vào chưa tồn tại.

Vậy P0.4 không phải "viết một spec ràng buộc rồi đi tiếp". Nó là bước **sửa lại schema đã
ship** cho khớp hợp đồng, và dựng cổng máy đọc được để lệch đó không tái diễn.

## 0. Điều kiện tiên quyết — đo được tại `5a1bb2b`

| Đo | Giá trị |
|---|---|
| Spec `implemented` | 11/130 |
| Bước P0 đã tick | P0.0 · P0.0b · P0.1 · P0.2 · P0.7 · P0.8 |
| Bước P0 đang chạy | **P0.3** — [`16-p0-3-auth-foundation-todo.md`](16-p0-3-auth-foundation-todo.md) Task 0–2 xong, Task 3–8 chưa |
| `pnpm check:progress` | xanh |
| Migration mới nhất | `0011_soft_scarecrow` |

`depends_on` của [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
là `GLOSSARY` + `ACTORS`. `GLOSSARY` đã `implemented`; **`ACTORS` chưa** — nó thuộc P0.3.

Theo việc 2 của quy trình, lệch này phải xử lý chứ không im lặng bỏ qua. Xử lý bằng cách
**tách P0.4 thành hai khối**, không bằng cách nới `depends_on`:

- **Khối A** — ràng buộc ở tầng schema và tầng contract. Không đụng guard, không cần `ACTORS`.
  Chạy được **ngay**, song song với phần còn lại của P0.3.
- **Khối B** — ràng buộc ở tầng tác nhân (đồng ý, quyền đọc, xoá). Cần `ACTORS` và
  `AUTH-TOKENS-SESSIONS` đã `implemented`. Chỉ mở sau khi P0.3 đóng.

## 1. Phát hiện — schema đã `implemented` lệch danh sách đóng

Nguồn hợp đồng: [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
§7.1 và [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.1
(hai spec khai **cùng một** bộ 12 cột). Nguồn thực tế:
[`child.ts`](../../packages/db/src/schema/child.ts).

### 1.1 `child_profiles` — 6 cột khớp, 6 thiếu, 6 thừa

| Cột trong hợp đồng | Có trong schema? | Ghi chú |
|---|---|---|
| `id` `user_id` `display_name` `birth_year` `created_at` `updated_at` | có | `display_name` là `varchar(50)`, hợp đồng ghi `varchar(40)` |
| `uuid` | thiếu | Định danh đối ngoại; cũng là nguồn của `telemetry_events.child_uuid` |
| `avatar_id` varchar(24) | thiếu | |
| `relationship` enum | thiếu | |
| `current_curriculum_id` bigint | thiếu | FK `curricula.entity_id` (D-AE) |
| `daily_play_cap_minutes` smallint | thiếu | Hạn mức giờ chơi |
| `status` enum `active\|archived\|pending_deletion` | thiếu | Có `is_active` bool + `archived_at` thay thế — **không biểu diễn được `pending_deletion`**, tức là §7.4 không có chỗ để ghi trạng thái |

Sáu cột thừa, không cột nào nằm trong danh sách đóng:

| Cột thừa | Rule bị vi phạm |
|---|---|
| `gender` varchar(20) | `BR-CDC-01` `BR-SPT-01` — trường ngoài danh sách đóng |
| `avatar_url` text | `BR-CDC-04` `BR-SPT-02` — **"NEVER path ảnh upload"**, đúng chữ trong spec |
| `avatar_emoji` varchar(10) | `BR-CDC-01` — không phải `avatar_id` |
| `theme_preference` varchar(50) | `BR-CDC-01` |
| `is_active` bool | thay `status`, xem trên |
| `archived_at` timestamptz | thay `status`, xem trên |

`CHECK` của `birth_year` là `>= 2010 AND <= 2035`. Hợp đồng
([`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.1) ghi
`[năm hiện tại − 7, năm hiện tại − 2]`. Khoảng đang dùng nhận cả năm sinh **trong tương lai**.

### 1.2 `telemetry_events` — thiếu chính cột dùng để ẩn danh hoá

[`play.ts`](../../packages/db/src/schema/play.ts) có đúng 6 cột: `session_uuid` `seq`
`event_name` `payload` `client_timestamp` `created_at`.

Hợp đồng §7.3 đòi thêm: `child_uuid` (nullable) · `game_level_id` · `content_version` ·
`template_id` · `occurred_at_ms` · `ingested_at`.

`BR-SPT-04` và `BR-CDC-10` đều nói ẩn danh hoá bằng `UPDATE telemetry_events SET child_uuid
= NULL`. Không có cột đó thì cả hai rule không thực thi được, và cũng không test được.

### 1.3 Vì sao cổng hiện tại không bắt được

[`child.test.ts`](../../packages/db/tests/integration/child.test.ts) khai phủ
`BR-SPT-01` và `BR-SPT-02`, nhưng chỉ khẳng định hai điều: số cột **bằng 12**, và không có cột
tên `full_name` `birth_date` `school` `photo_path` `age_band`.

Schema thật có đúng 12 cột và không mang năm tên đó — nên test xanh. `gender`, `avatar_url`,
`theme_preference` đi lọt.

Đây là đúng bài học đã ghi ở [`14-implementation-sequence-plan.md`](14-implementation-sequence-plan.md)
mục 10: **cổng không đo gì là cổng chưa tồn tại**. Đếm 12 không phải là kiểm danh sách đóng;
kiểm danh sách đóng là so khớp **tập hợp tên cột**, hai chiều.

## 2. Quyết định

**D-DN — Sửa schema, không sửa spec.** Hai spec độc lập
([`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.1 và
[`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.1) khai cùng
một bộ cột, viết ở hai thời điểm khác nhau. Code là bên duy nhất lệch. Việc 7 của quy trình
chỉ cho sửa spec khi **code chứng minh spec sai** — ở đây không có chứng minh nào, chỉ có
schema soạn trước khi đọc hợp đồng.

**D-DO — Không hạ [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md)
xuống `approved`.** Hạ trạng thái không sửa
được gì và làm mất dấu vết P0.7/P0.8 đã chạy. Thay vào đó P0.4 sửa cột **và** siết cổng, rồi
ghi nợ đã trả vào chính spec đó. Cổng `check:progress` không kiểm lại ô đã tick nên hạ trạng
thái cũng không làm nó đỏ — tức là hạ trạng thái là thao tác không đo được gì.

**D-DP — Migration tiến tới, không sửa migration cũ.** Chưa có database production
(P0, chỉ chạy local qua `docker-compose.yml`), nên không cần backfill. Vẫn thêm migration mới
thay vì sửa `0000`–`0011`, vì kiểm giữa phase sau P0.8 đã tick là "migration chạy được từ đầu
trên database rỗng" — sửa file cũ làm mất chính bằng chứng đó.

**D-DQ — Chỉ sửa cột mà `BR-CDC-*` sở hữu.** Đo được ở mục 1.4 dưới đây: `play_sessions` và
`child_session_summaries` cũng lệch spec, nhưng lệch của chúng là hình dạng điểm số và rollup
— thuộc P1.6/P1.7, không phải ràng buộc pháp lý. P0.4 **ghi nợ có chủ**, không kéo vào.

### 1.4 Nợ đo được nhưng **ngoài** phạm vi P0.4

| Bảng | Lệch | Bước sở hữu |
|---|---|---|
| `play_sessions` | Thiếu `user_id` `curriculum_id` `curriculum_item_id` `lesson_id` `access_tier_at_start` `duration_ms` `rounds_*` `attempt_count` `correct_count` `incorrect_count` `hint_count` `retry_count` `raw_score` `normalized_score` `difficulty` `device` `is_preview`; thừa `stars_earned` `score` `duration_seconds` | P1.6 · P1.7 |
| `child_session_summaries` | Hợp đồng §7.4 đòi PK `(child_profile_id, session_uuid)` · `date_ict` · `skill_ids` bigint[]; schema dùng `id` + `date` varchar(10) + `total_play_time_seconds` | P1.6 |
| `child_daily_stats` `level_daily_stats` `skill_daily_stats` | Cột không khớp [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) §7.1 | P1.5 |

Nợ này phải **ghi vào spec** (bảng nợ trong
[`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §11), không chỉ ghi ở
file kế hoạch — file kế hoạch không ai đọc lại lúc làm P1.6.

## 3. Đồ thị phụ thuộc và lát cắt

```
Khối A — chạy ngay, không cần P0.3
  T1 cổng danh sách đóng (ca âm, phải ĐỎ)
        │
        ├──→ T2 child_profiles đúng 12 cột  ──┐
        ├──→ T3 telemetry_events + child_uuid ─┼──→ T4 kiểm kê + ghi nợ
        └──→ T5 contract Zod danh sách đóng ───┘
                    │
                    ├──→ T6 avatar_id preset (BR-CDC-04)
                    └──→ T7 khoảng birth_year theo năm hiện tại
                                      │
                              ── Cổng dừng A ──

Khối B — mở sau khi P0.3 đóng (ACTORS + AUTH-TOKENS-SESSIONS `implemented`)
  T8 cổng đồng ý (428/409) ──→ T9 content_reviewer không đọc dữ liệu trẻ
  T10 xoá + ẩn danh hoá 30 ngày
  T11 cổng tĩnh: tracking · credential trẻ · payload LLM
                                      │
                              ── Cổng dừng B ──
  T12 evidence và promote status  ──→ Cổng dừng cuối
```

Mỗi task là một lát dọc **kèm cổng đo được**: không task nào chỉ đổi cột mà không kèm test so
khớp hai chiều, và không test nào được viết sau code.

## 4. Task

### Task 1 — Ca âm cho cổng danh sách đóng

**Mô tả.** Viết lại kiểm tra `child_profiles` thành so khớp **tập hợp** tên cột với danh sách
đóng: thiếu là lỗi, thừa cũng là lỗi. Test phải **ĐỎ** trên schema hiện tại — nếu nó xanh
ngay thì nó chưa đo gì.

**Tiêu chí nghiệm thu**
- [ ] Danh sách đóng khai **một chỗ duy nhất** trong code, test đọc từ đó.
- [ ] Test đỏ với thông báo nêu **tên** cột thừa (`gender`, `avatar_url`, `avatar_emoji`, `theme_preference`, `is_active`, `archived_at`) và cột thiếu.
- [ ] Bổ sung ca âm cho `BR-SPT-02`: cột nào tên khớp `%_url` / `%_path` / `photo%` trên bảng dữ liệu trẻ là lỗi.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/db test -- child` — **đỏ**, đúng lý do trên.

**Phụ thuộc:** không · **Chạm:** [`child.test.ts`](../../packages/db/tests/integration/child.test.ts) · **Cỡ:** S

### Task 2 — `child_profiles` đúng danh sách đóng

**Mô tả.** Sửa [`child.ts`](../../packages/db/src/schema/child.ts) về đúng 12 cột hợp đồng và
sinh migration mới.

**Tiêu chí nghiệm thu**
- [ ] Thêm `uuid` UNIQUE · `avatar_id` varchar(24) NOT NULL · `relationship` enum nullable · `current_curriculum_id` bigint nullable · `daily_play_cap_minutes` smallint NOT NULL default · `status` enum `active|archived|pending_deletion`.
- [ ] Bỏ `gender` `avatar_url` `avatar_emoji` `theme_preference` `is_active` `archived_at`.
- [ ] `display_name` về `varchar(40)`.
- [ ] Index đơn trên `birth_year` (§7.1 đòi "index đơn cho lookup theo tuổi").
- [ ] Migration mới, **không** sửa `0000`–`0011` (D-DP).

**Kiểm chứng**
- [ ] `pnpm db:generate` sinh `0012_*`; đọc SQL trước khi chạy.
- [ ] `pnpm db:migrate` trên database rỗng chạy từ `0000` tới `0012` không lỗi.
- [ ] Test của Task 1 chuyển **xanh**.

**Phụ thuộc:** T1 · **Chạm:** `child.ts` · `migrations/0012_*` · `meta/` · **Cỡ:** M

### Task 3 — `telemetry_events` có `child_uuid` và cột hợp đồng

**Mô tả.** Không có `child_uuid` thì `BR-CDC-10` và `BR-SPT-04` không thực thi được. Thêm cột
theo §7.3 và viết ca âm cho PII.

**Tiêu chí nghiệm thu**
- [ ] Thêm `child_uuid` **nullable** · `game_level_id` · `content_version` · `template_id` · `occurred_at_ms` int · `ingested_at`.
- [ ] Không FK nào trỏ **vào** `telemetry_events` (D-Z giữ nguyên).
- [ ] Cổng allow-list: mọi cột của `telemetry_events` phải nằm trong bộ cho phép §7.3; cột lạ là lỗi.
- [ ] Ca âm `BR-SPT-04`: `UPDATE … SET child_uuid = NULL` chạy được và **số hàng không giảm**.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/db test -- play` xanh, có assertion tham chiếu `BR-SPT-04` và `BR-CDC-05`.

**Phụ thuộc:** T1 · **Chạm:** `play.ts` · migration · [`play.test.ts`](../../packages/db/tests/integration/play.test.ts) · **Cỡ:** M

### Task 4 — Kiểm kê phần còn lại và ghi nợ vào spec

**Mô tả.** Lệch ở mục 1.4 không thuộc P0.4 nhưng phải được ghi ở nơi người làm P1.5–P1.7 sẽ
đọc, không phải ở file kế hoạch này.

**Tiêu chí nghiệm thu**
- [ ] Bảng nợ vào [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §11, mỗi dòng có bước sở hữu.
- [ ] Ghi D-DN · D-DO · D-DP · D-DQ vào sổ quyết định của [`data-model-overview.md`](../specs/01-platform/data-model-overview.md).
- [ ] Không đổi bất kỳ cột nào thuộc bảng nợ trong PR này.

**Kiểm chứng**
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo.

**Phụ thuộc:** T2 · T3 · **Chạm:** 2 file spec · **Cỡ:** S

### Task 5 — Contract danh sách đóng ở tầng ứng dụng

**Mô tả.** `BR-CDC-01` nói ép ở **cả** Zod và schema DB (§10 "Always"). Route
`POST /api/users/children` thuộc P1.9, nên P0.4 chỉ giao **contract** dùng lại được, không
giao route.

**Tiêu chí nghiệm thu**
- [ ] Schema Zod `strict` cho input tạo/sửa child profile, đặt trong [`packages/shared`](../../packages/shared/src) — **không** tạo package mới (`BR-MPA` chỉ cho tách package khi ≥2 app dùng).
- [ ] Field ngoài danh sách đóng → lỗi ánh xạ `CHILD_FIELD_NOT_ALLOWED` (400) theo [`error-codes.md`](../specs/00-foundation/error-codes.md).
- [ ] Ca âm: body chứa `full_name` và `school` bị từ chối và **không** trả về giá trị đã gửi trong thông báo lỗi.
- [ ] Bộ tên cột dùng chung một nguồn với cổng DB ở Task 1 — hai chỗ không được khai hai bản.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/shared test` xanh, assertion tham chiếu `BR-CDC-01`.

**Phụ thuộc:** T1 · **Chạm:** `packages/shared/src/*` · test · **Cỡ:** M

### Task 6 — `avatar_id` chỉ nhận preset

**Mô tả.** `BR-CDC-04` cấm ảnh chụp trẻ. Bộ preset thật thuộc
[`emoji-registry.md`](../specs/01-platform/emoji-registry.md) ở P0.9, nên P0.4 giao **hình
dạng** và validator, không giao danh mục.

**Tiêu chí nghiệm thu**
- [ ] Validator từ chối mọi giá trị có dạng path hoặc URL (`/`, `\`, `http`, `data:`).
- [ ] Cột `avatar_url` không còn tồn tại ở bất kỳ bảng dữ liệu trẻ nào (đã bỏ ở T2, khẳng định lại bằng test).
- [ ] Ghi rõ trong test rằng danh mục preset do P0.9 cung cấp; validator không tự chế danh mục.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/shared test` xanh, assertion tham chiếu `BR-CDC-04`.

**Phụ thuộc:** T5 · **Chạm:** `packages/shared/src/*` · test · **Cỡ:** S

### Task 7 — Khoảng `birth_year` tính theo năm hiện tại

**Mô tả.** `CHECK` hiện tại (`2010`–`2035`) nhận năm sinh tương lai. Hợp đồng là
`[năm hiện tại − 7, năm hiện tại − 2]`.

**Tiêu chí nghiệm thu**
- [ ] Hàm tính khoảng nằm ở `packages/shared`, nhận "năm hiện tại" làm tham số — không đọc đồng hồ bên trong, để test được.
- [ ] `CHECK` ở DB siết lại; ghi rõ trong spec cách xử lý khi khoảng trượt sang năm mới (`CHECK` tĩnh không tự trượt — nêu đây là ràng buộc **sàn**, ứng dụng ép khoảng chính xác).
- [ ] Ca âm: năm sinh tương lai và năm sinh của trẻ 10 tuổi đều bị từ chối ở tầng ứng dụng.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/shared test` và `pnpm --filter @kidthink/db test -- child` xanh.

**Phụ thuộc:** T2 · T5 · **Cỡ:** S

### Cổng dừng A — hết khối A

- [ ] `child_profiles` đúng 12 cột hợp đồng; test so khớp **hai chiều** xanh.
- [ ] `telemetry_events` có `child_uuid` nullable; ca âm ẩn danh hoá xanh.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human review diff — đây là **vùng nhạy cảm "dữ liệu trẻ"** theo [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md); không auto-merge.
- [ ] Khối B **chưa** bắt đầu nếu P0.3 chưa đóng.

### Task 8 — Cổng đồng ý trước khi thu

**Mô tả.** §4: không có hàng `consent_logs` hợp lệ thì form tạo trẻ không mở. `consent_logs`
đã tồn tại và đã INSERT-only ở tầng quyền DB (test `BR-SIB-06`), nên phần còn thiếu là **cổng
đọc** và ngữ nghĩa rút đồng ý.

**Tiêu chí nghiệm thu**
- [ ] Hàm kiểm đồng ý: thiếu → `CONSENT_REQUIRED` (428); có nhưng `policy_version` cũ → `CONSENT_VERSION_STALE` (409).
- [ ] Ca âm `BR-CDC-07`: rút đồng ý **thêm hàng**, hàng cũ không đổi một byte.
- [ ] Chính sách đổi version chặn **tạo trẻ mới** nhưng **không** chặn đọc dữ liệu đã có (§5).

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/db test -- identity` xanh, assertion tham chiếu `BR-CDC-07`.

**Phụ thuộc:** P0.3 đóng · T5 · **Cỡ:** M

### Task 9 — `content_reviewer` không chạm dữ liệu trẻ

**Mô tả.** `BR-CDC-13` và `BR-CDC-14`. Dùng guard của P0.3, không tự chế guard mới.

**Tiêu chí nghiệm thu**
- [ ] Contract test: manager role `content_reviewer` gọi bất kỳ đường đọc dữ liệu trẻ nào → 403.
- [ ] Bề mặt admin không có đường đọc telemetry/mastery/lịch sử chơi của **một trẻ cụ thể** (`BR-CDC-14`) — khẳng định bằng cổng quét, không bằng lời.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/auth test -- actor-boundaries` xanh, assertion tham chiếu `BR-CDC-13`.

**Phụ thuộc:** P0.3 đóng (T7 của [`16-...-todo.md`](16-p0-3-auth-foundation-todo.md)) · **Cỡ:** M

### Task 10 — Xoá và ẩn danh hoá theo §7.4

**Mô tả.** Logic purge viết thành hàm thuần + SQL, test được **không cần** hàng đợi.
Lập lịch định kỳ thuộc P0.8b — không kéo lên đây.

**Tiêu chí nghiệm thu**
- [ ] Yêu cầu xoá → `users.status='deleted'` + `child_profiles.status='pending_deletion'` + `purge_at` = D+30.
- [ ] Huỷ được trong 30 ngày, khôi phục đủ.
- [ ] Sau 30 ngày: xoá `child_profiles` `mastery_state` `play_sessions` `child_session_summaries`; `telemetry_events.child_uuid` về NULL; `audit_logs` và `consent_logs` **còn nguyên**.
- [ ] Ca âm: chạy purge ở ngày D+29 **không** xoá gì.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/db test -- purge` xanh, assertion tham chiếu `BR-CDC-10` và `BR-SPT-04`.

**Phụ thuộc:** T2 · T3 · P0.3 đóng · **Cỡ:** M

### Task 11 — Ba cổng tĩnh cho thứ chưa có code

**Mô tả.** `BR-CDC-06` (payload LLM), `BR-CDC-08` (tracking bên thứ ba), `BR-CDC-11` (không
credential cho trẻ) đều nói về code **chưa viết**. Cổng phải tồn tại **trước** code đó, giống
`lint:tokens`, kèm ca âm chứng minh cổng đỏ được.

**Tiêu chí nghiệm thu**
- [ ] Cổng quét: không script/domain bên thứ ba trong bề mặt `/play/**` và trang pháp lý.
- [ ] Cổng quét: không cột/route nào cấp credential cho child profile (`password%`, `token%` trên bảng dữ liệu trẻ; route `/children/login`).
- [ ] Cổng contract: hàm dựng payload gửi provider ngoài chỉ nhận số liệu tổng hợp — truyền `child_uuid`/`display_name`/`birth_year` vào là lỗi kiểu **và** lỗi runtime.
- [ ] Mỗi cổng có **ca âm** riêng: một fixture vi phạm làm cổng đỏ.

**Kiểm chứng**
- [ ] `pnpm check` gọi cổng mới; ca âm chạy trong `pnpm test`.

**Phụ thuộc:** T5 · **Cỡ:** M

### Cổng dừng B — hết khối B

- [ ] Không thu được dữ liệu trẻ khi chưa có đồng ý hợp lệ.
- [ ] `content_reviewer` không đọc được gì thuộc trẻ.
- [ ] Xoá thật sự xảy ra, ẩn danh hoá thật sự xảy ra, cả hai có ca âm.
- [ ] Human thứ hai review theo [`security-checklist.md`](../specs/08-quality/security-checklist.md) mục dữ liệu trẻ.

### Task 12 — Evidence và promote status

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-CDC-01`…`BR-CDC-14` có ít nhất một test tham chiếu **mã rule** và assertion đúng hành vi; rule nào chưa phủ được ở P0.4 thì ghi bước sở hữu, không tick.
- [ ] [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) sang `implemented` **chỉ khi** đủ evidence.
- [ ] [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) giữ `implemented` và mang bảng nợ của Task 4.
- [ ] Tick P0.4 ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.

**Kiểm chứng**
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

**Phụ thuộc:** mọi task trên · **Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Sửa cột trên bảng đã ship kéo theo bảng khác | `telemetry_events` và `play_sessions` tham chiếu trẻ | D-DQ giới hạn phạm vi; T4 ghi nợ thay vì sửa lan |
| Ba rule `BR-CDC-06/08/11` không có code để gắn vào | Viết "đã tuân thủ" mà không đo gì — đúng lỗi mục 1.3 | T11 dựng cổng **kèm ca âm** trước khi code tồn tại |
| Khối B chạy sớm khi P0.3 chưa đóng | Guard nửa vời, `ACTORS` chưa `implemented` | Cổng dừng A chặn; khối B không có task nào chạy trước |
| Danh sách đóng khai hai bản (DB và Zod) trôi khỏi nhau | Đúng loại lỗi mà spec này tồn tại để chặn | T5 bắt hai cổng đọc **cùng một** nguồn |
| Bỏ `avatar_url`/`gender` làm hỏng seed hoặc test khác | Gate đỏ ở chỗ không liên quan | Chạy `pnpm test` đủ bộ sau T2, sửa call site trong cùng PR |
| `CHECK` tĩnh không trượt theo năm | Năm 2027 khoảng sai một năm | T7 ghi rõ `CHECK` là ràng buộc sàn; khoảng chính xác ép ở ứng dụng |

## 6. Giả định — không chặn, ghi để phản đối được

1. **Chưa có database production.** Đo: chỉ có `docker-compose.yml` và `.env.example`, không
   có tài liệu deploy nào. Nếu sai, D-DP phải viết lại kèm kế hoạch backfill.
2. **P0.4 không giao route HTTP.** `POST /api/users/children` thuộc P1.9
   ([`child-profile-crud.md`](../specs/03-account/child-profile-crud.md)); P0.4 giao contract
   và schema để P1.9 gắn vào.
3. **Không tạo package mới.** `BR-MPA` chỉ cho tách khi ≥2 app dùng. Contract vào
   `packages/shared`, ràng buộc cột vào `packages/db`.
4. **Lập lịch job purge thuộc P0.8b.** P0.4 giao logic thuần + SQL và test của nó.
5. **Bộ preset avatar thuộc P0.9.** P0.4 giao validator hình dạng, không giao danh mục.
6. **Khối A không chờ P0.3.** Không task nào của khối A đọc `ACTORS` hay guard.

## 7. Ngoài phạm vi

- Bốn câu hỏi mở của [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
  §11 (ngân sách rà soát pháp lý, DPIA, retention telemetry, COPPA/GDPR-K) — hai câu đầu chặn
  go-live, hai câu sau chặn P5. Không câu nào chặn P0.
- Hình dạng cột `play_sessions` và các bảng rollup — mục 1.4, thuộc P1.5–P1.7.
- Parent Gate (`BR-CDC-12`) — [`parent-gate.md`](../specs/04-play/parent-gate.md), P1.8.
  P0.4 chỉ khẳng định rule tồn tại và có chủ, không dựng UI.
- Hoàn tất P0.3 — [`16-p0-3-auth-foundation-plan.md`](16-p0-3-auth-foundation-plan.md) sở hữu.
