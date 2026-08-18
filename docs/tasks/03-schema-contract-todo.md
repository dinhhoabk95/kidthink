# Todo — Task #3: P0 bước 7 — khoá contract schema

> **Hồ sơ lưu trữ.** Task #3 kết thúc 2026-08-07 với hai ô cuối của Cổng dừng D chưa tick:
> ghi việc kế tiếp cho bước 8, và người duyệt ký. Ô thứ nhất được chuyển sang
> [`todo.md`](todo.md) của Task #4, mục "Việc kế tiếp sau task này". Ô thứ hai vẫn chờ.
>
> Bản 1, 2026-08-06. Chi tiết + acceptance + lý do: [`03-schema-contract-plan.md`](03-schema-contract-plan.md).
> Task #1 lưu trữ: [`01-bootstrap-todo.md`](01-bootstrap-todo.md) ·
> Task #2 lưu trữ: [`02-foundation-approve-todo.md`](02-foundation-approve-todo.md).
>
> Thứ tự: `T0 → T1→ T2 → A → {T3, T4, T4b} → B → {T5, T6, T7, T8} → C → T9 → T10 → T11 → D`
>
> **Ký hiệu file này:** `Tn` = bước · `` = cổng dừng, không đi tiếp khi chưa qua ·
> `song song được` = song song được (chạm file khác nhau) · `Mn` = chỗ contract tự mâu thuẫn ·
> `D-*` = quyết định trong ledger (`grep '| \*\*D-XX\*\*' docs/tasks/`) · `người` = cần người.
> Đầy đủ: [`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) §4.3.
>
> **Đã chốt 2026-08-06 (người):** M1 = sửa [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7 theo Q1/Q2 (`GL-`+template+`\d{4}`) ·
> **D-Y** = 7 spec (thêm [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md)) · **D-Z** = không partition ở P0, mở lại
> [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 · **D-AA** = `age_band` suy lúc đọc (12 cột). Còn chờ: D-AB · D-AC · D-AD.
>
> Lưu ý: Mọi lệnh prefix `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`
> — shell state không persist, shell mặc định vẫn node v20.17.0.
>
> Lưu ý: **2026-08-07 (người)**: quyết định dời `docs/` ra khỏi `mindkid/` (sáng) đã **đảo lại cùng
> ngày** (chiều) — `docs/` ở nguyên trong `mindkid/docs/`, track chung git repo code. Xem
> [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q10 (Lượt 3). Mọi lệnh đo/grep chạy từ `cd mindkid` như cũ, không
> cần `CORPUS_ROOT`.
>
> Lưu ý: Tick checkbox **ngay khi làm**. Task #2 để lại một file 217 dòng toàn ô trống trong khi
> việc đã xong — không lặp lại.

## Mục tiêu đo được

> **Đo lần cuối 2026-08-07 sau T11 + Checkpoint C/D (phần máy):** `pnpm check` exit 0 ·
> `pnpm test` 81/81 · `lint:specs` 0 error / **219** warning · `approved` **23/130** ·
> 3/3 ca âm chặn đúng. Cột "Đạt" bên dưới ghi số đo thật.

| Đo bây giờ | Đo lúc đóng task | Đạt |
|---|---|---|
| `pnpm check` Cấm **đỏ** (biome format trong `scripts/lint-specs-lib.ts`) | exit 0 | exit 0 |
| `pnpm test` 73/73 (phiên khác vừa thêm 17 test) | ≥ **73/73**, không giảm | **81/81** |
| 16/130 spec `approved` | **23/130** (D-Y = 7 spec) | **23/130** |
| `lint:specs` 11 check | **13 check** (thêm C12 · C13), mỗi cái có ca âm | 13, 3 ca âm chạy lại ở CP-D |
| 11 lệch/mâu thuẫn contract (M1–M11) | **0** | 0 — **+2 lệch mới** tìm ở CP-C, đã sửa |
| 6 bảng lệch giữa DMO §7 và `schema-*` | **0** — C12 xanh | 0 |
| `content_review_log` không spec nào `owns` cột | có đúng **1** chủ | SIB §7.10a |
| [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §Ràng buộc chờ | **≥19 dòng** | Lưu ý: **17** — xem ghi chú dưới |
| [`SPEC.md`](../SPEC.md) §13 thiếu 3 dòng neo (D-W · Q4/T9 · D-Z) | có đủ **3** (2 ở P0, 1 ở P1) | 3 |
| [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 đóng "có partition" — xung đột PK | **mở lại**, chờ P1, có tên chủ + ngưỡng 5M hàng/2GB | |
| 17 OQ ở 6 spec đích | 0 mở mà không có `Chặn phase` + `Chủ` | 0 |
| Mã `G-C…` trong corpus | **0** | 0 |
| P0 bước 8 (migration) | **Mở khoá** | Tạm dừng chờ người duyệt CP-D |

> Lưu ý: **§Ràng buộc chờ = 17 dòng, không đạt "≥19"**. Con số 19 đặt ra lúc viết todo là **ước
> lượng trước khi đếm** — thực tế chỉ có 11 closure spec-Q + 6 quyết định D (D-Y·D-AA·D-AB·
> D-AC·D-AD·D-AE) = 17 ràng buộc **thật**. Cấm bịa thêm 2 dòng cho đủ số. Nếu người duyệt
> thấy thiếu ràng buộc nào, thêm dòng đó — không hạ mục tiêu để khớp.

---

## T0 — Đóng nợ working tree (gate đang đỏ) Lưu ý: phiên khác đang sửa cùng file

- [ ] Lưu ý: **Trước hết**: xác nhận phiên khác đã dừng — `git status` không đổi qua 2 lần đo cách
      nhau vài phút. Phiên đó đang tách `scripts/lint-specs-lib.ts` + `scripts/tests/`
      (mtime 23:11→23:15). Cấm ghi đè, không commit hộ
- [ ] Đọc `scripts/tests/lint-specs.test.ts` — ghi lại check nào **đã** có test
      (`parseFrontmatter` · C7 · C9) để T2 không viết lại
- [ ] Sửa lỗi biome format còn lại trong `scripts/lint-specs-lib.ts` — không refactor thêm
- [ ] **Ca âm C6-trùng**: fixture định nghĩa lại `BR-DM-01` ở §6 spec khác thì `lint:specs`
      exit **1**, in `file:line` + `C6`; xoá fixture thì exit 0
- [ ] **Ca âm C10-codeblock** hai chiều: `GitHub Actions` **trong** code fence thì im lặng;
      **ngoài** fence thì exit 1
- [ ] Commit
- [ ] `pnpm check` exit 0 · `pnpm test` ≥ **73/73** (không giảm) · `git status --short` **rỗng**

## T1 — Lưu trữ Task #2 (làm khi viết plan)

- [x] [`plan.md`](../tasks/plan.md) → [`02-foundation-approve-plan.md`](../tasks/02-foundation-approve-plan.md) · [`todo.md`](../tasks/todo.md) → [`02-foundation-approve-todo.md`](../tasks/02-foundation-approve-todo.md) (`git mv`)
- [x] Banner ở đầu file lưu trữ: checkbox không phản ánh sự thật + 3 acceptance chưa xong
- [ ] `git log --follow docs/tasks/02-foundation-approve-plan.md` ≥ 2 commit
- [ ] C4 xanh — mọi link tới [`plan.md`](../tasks/plan.md)/[`todo.md`](../tasks/todo.md) trong corpus còn resolve

## T2 — Hai check mới: C12 · C13

- [x] **Sửa spec trước** (`BR-RBS-08`): [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10 — **13 check** (SPEC.md ko ghi số)
- [x] C12 — tên bảng ở [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7 <-> §7.x của 3 `schema-*`, khớp **hai chiều**
- [x] C13 — (a) `ví dụ` khớp `regex` của **cùng hàng** trong [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7;
      (b) mọi literal mã trong corpus khớp regex của prefix nó mang
- [x] **Chạy ngay khi viết xong, TRƯỚC T3–T8 thì exit 1**, báo đúng:
  - [x] C12: 10 errors — `social_identities` · `user_tags` · `content_review_log` ·
        `mastery_state` × 2 (DMO→SCT vs SPT) · `level_params` × 2 · `lesson_activities` ·
        `curriculum_enrollments` · `curriculum_item_progress` (inline tables ko có §7.x header)
        — `child/level/skill_daily_stats` KO bắt: SPT §7.5 viết inline, ko dùng `| Bảng |` table
  - [x] C13: 12 errors — `GT-xxx` · `GT-00n` · `GT-001..006` × 2 · `GT-001..GT-006` ·
        `G-04021` × 6 · `EMJ-APPLE`
  - [x] Script mới mà xanh ngay là dấu hiệu nó không đo gì — ĐỎ ngay, 
- [x] **Ca âm C12**: unit test `social_identities` + `user_tags` trong `lint-specs.test.ts`
- [x] **Ca âm C13**: unit test `G-04021` fail + valid codes pass trong `lint-specs.test.ts`
- [x] Ca âm wiring: wired `pnpm check → lint:specs` xác nhận trong `package.json`
- [x] Ghi số warning nền **trước** T3: **232** (tăng từ 228 → 232 do phiên khác thêm test)

## CHECKPOINT A — người duyệt

- [ ] `pnpm check` xanh · working tree sạch
- [ ] C12 + C13 **đỏ đúng 7 nhóm chỗ đã đo**
- [ ] 2 ca âm mới chặn đúng
- [ ] Duyệt trước khi động vào **nội dung** spec

---

## T3 — [`id-conventions.md`](../specs/00-foundation/id-conventions.md): `G-…\d{3}` → `GL-…\d{4}` (M1 · M2 · M3) song song được

> Quan trọng: File đang `status: approved`. Chỉ sửa chỗ file **tự mâu thuẫn với §11 của chính nó**.
> Cấm đổi quyết định nào.

- [x] §7 hàng `Game Level`: prefix `GL-` · regex `^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$` ·
      ví dụ `GL-C1-CNT-MATCH-0007`
- [x] §7 dòng "Game level trong URL" (`:112`)
- [x] §9 — 4 scenario dùng mã cũ (`:133` · `:138` · `:140` · `:141` · `:150`)
- [x] [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.4 `code` "`G-*`" → "`GL-*`" + trỏ [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7
- [x] [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §9 scenario `BR-SCT-03` (`G-C1-CNT-007` → `GL-C1-CNT-MATCH-0007`)
- [x] Quét toàn corpus mã `G-C…` còn sót — 9 chỗ ở 5 file + SPEC.md, đã sửa hết
- [x] §11 Q1/Q2 — thêm ghi chú "thân bài cập nhật T3, 2026-08-07"
- [x] `reviewed: 2026-08-06` (giữ nguyên — không đổi quyết định, chỉ cập nhật thân bài)
- [x] C13 xanh cho `G-C` codes · `grep -rn 'G-C[1-6]-' docs/specs/` → **rỗng**
- [x] Diff không chạm prefix nào khác (`EMJ-` · `PKG-` · `LO-` · `LSN-` …)

## T4 — [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md): 2 tên cột (M7 · M8) song song được

> Quan trọng: File đang `status: approved`. Danh sách **cấm** không đổi một chữ.

- [x] §7.1 `current_curriculum_id` FK → `current_curriculum_code` varchar, ghi vì sao
      (`BR-DM-10` + `BR-SCT-06`)
- [x] §7.1 `age_band` → theo **D-AA**: "không phải cột — suy từ `birth_year` lúc đọc"
- [x] §7.3 `occurred_at` → `occurred_at_ms` (int, tương đối `started_at`) + `ingested_at`
- [x] Cấm **KHÔNG** thêm `session_month` — D-Z bác partition ở P0
- [x] `reviewed: 2026-08-06` (giữ nguyên, chỉ sửa tên cột)
- [x] Diff chỉ chạm dòng **cột được phép** — danh sách cấm §7.1/§7.3 nguyên vẹn
- [x] Đối chiếu tay: [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.1 <-> [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.1 khớp
      **từng tên cột** — `current_curriculum_code` ✓, `occurred_at_ms` ✓, `ingested_at` ✓
- [x] C4 · C9 xanh

## T4b — [`event-catalog.md`](../specs/00-foundation/event-catalog.md): mở lại Q2 theo **D-Z** song song được

> Quan trọng: Loại sửa nặng nhất trong task: **đổi** một quyết định đã đóng, không phải sửa chỗ ghi sai.
> Phải để lại vết đọc được — lần tới người đọc Q2 sẽ thấy hai lượt kết luận trái nhau.

- [x] §11 Q2 — bỏ gạch `~~2~~`, ghi **cả hai** lượt theo thứ tự thời gian:
  - [x] `2026-08-06 (T11)` chốt **có** partition — giữ nguyên lý do gốc (t3.small, prune, vacuum)
  - [x] `2026-08-06 (T4b, D-Z)` **mở lại** — lý do: khoá partition phải nằm trong PK thì partition
        mua bằng cách hạ `BR-EVT-03` xuống tầng service. Chọn giữ bất biến ở DB
- [x] Q2 → chờ chặn **P1**, có **tên chủ thật** (D-Z) + hạn viết bằng câu đo được
- [x] Ghi **ngưỡng kích hoạt**: `telemetry_events` vượt **5M hàng** hoặc **2GB** trên t3.small
      thì phải đóng lại quyết định trước khi vượt
- [x] Ghi **điều kiện giữ đường mở**: không FK nào trỏ **vào** `telemetry_events`; giữ cột hẹp
- [x] `reviewed: 2026-08-06`; [`event-catalog.md`](../specs/00-foundation/event-catalog.md) giữ `status: approved`
- [x] §11 Q2 đọc được **cả hai** lượt + ngày từng lượt — không xoá lượt cũ
- [x] Q2 có tên chủ (D-Z) + ngưỡng **số** (5M/2GB) — không có chữ "sau này"/"khi cần"
- [x] C8 xanh — [`event-catalog.md`](../specs/00-foundation/event-catalog.md) vẫn `approved`, spec phụ thuộc không đổi trạng thái

## CHECKPOINT B — người chốt 3 quyết định còn lại + 2 nợ

> Đã chốt 2026-08-06: **M1** · **D-Y** (7 spec) · **D-Z** (không partition ở P0) ·
> **D-AA** (`age_band` suy lúc đọc).

- [x] **D-AB** — `billing_period` (M10). Chốt: giữ `packages.offers` JSONB, đổi khoá
      `billing_period` → `billing_period`, miền đóng `{yearly, monthly}`
- [x] **D-AC** — spec nào `owns` cột `content_review_log`? Chốt: [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.10a
- [x] **D-AD** — module `ops` trong migration #1 gồm bảng nào? Chốt: + `audit_logs` ·
      `content_review_log` · `backup_log`; hoãn `feature_flags` · `notifications` ·
      `content_seed_batches`. Hệ quả: [`audit-log.md`](../specs/01-platform/audit-log.md) + [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) phải approved trước bước 8
- [x] **Nợ #4** — [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1: chủ = D-Z, ngưỡng sẽ ghi trong T5 SPEC.md §13
- [x] **Chủ + ngưỡng** cho [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2: D-Z, 5M hàng/2GB (đã ghi T4b)

---

## T5 — [`data-model-overview.md`](../specs/01-platform/data-model-overview.md): §Ràng buộc chờ + bản đồ + neo [`SPEC.md`](../SPEC.md) §13 song song được

- [x] Thêm **§7.3 Ràng buộc chờ** — 16 dòng, mỗi dòng có nguồn + ngày + ảnh hưởng cột
  - [x] [`id-conventions.md`](../specs/00-foundation/id-conventions.md) Q1·Q2 (T9) — `GL-…\d{4}` thì `game_levels.code`
  - [x] [`actors.md`](../specs/00-foundation/actors.md) Q1 (T9) — Manager MFA bắt buộc thì `mfa_settings`
  - [x] [`actors.md`](../specs/00-foundation/actors.md) Q2 (T9) — `pending_verification` không tạo child thì guard service
  - [x] [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q4 (T9) — backup/monitoring P0 thì `backup_log` vào migration #1
  - [x] `monorepo…` Q3 (T9) — `payment`/`notification` inline thì không đụng cột
  - [x] [`access-ladder.md`](../specs/00-foundation/access-ladder.md) Q3 (T10) — enum **4 bậc** thì `access_tier` mọi bảng Lớp 2
  - [x] [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q3 (T10) — không `scheduled` thì enum status **6** giá trị
  - [x] [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2 (T11) — `code` only thì `curriculum_items.entity_code`
  - [x] [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 (T11 → **mở lại** T4b/D-Z) — không partition ở P0; PK giữ nguyên;
        kèm ngưỡng 5M hàng/2GB + điều kiện 0 FK trỏ vào
  - [x] [`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q2 (T12) — chỉ bán năm thì D-AB
  - [x] **D-Y** — 7 spec, `AUTH-TOKENS-SESSIONS` vào `depends_on` SIB
  - [x] **D-AA** — `age_band` suy lúc đọc thì `child_profiles` 12 cột + index `birth_year`
  - [x] D-AB · D-AC · D-AD — đã chốt Checkpoint B
- [x] §7 bản đồ module: thêm `social_identities` · `user_tags` · `child_daily_stats` ·
      `level_daily_stats` · `skill_daily_stats`
- [x] §7 `content_review_log` — trỏ đúng spec `owns` theo D-AC (SIB §7.10)
- [x] Kiểm lại câu "**11 module**" còn đúng — vẫn 11 module ✓
- [x] §11 Q1 (partition) → **đóng** bằng [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 + D-Z, ghi ngày + vì sao
- [x] §11 Q2 (retention `audit_logs`) · Q3 (read replica) → hoãn **có chủ + phase**
- [x] §11 thêm 2 cột `Chặn phase` · `Chủ`
- [x] **Nợ #2 + D-Z** — [`SPEC.md`](../SPEC.md) §13 thêm đúng **3** dòng:
  - [x] Cổng ra P0: [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 có chủ có tên trước khi mở P1 (neo **D-W**)
  - [x] Cổng ra P0: [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) + [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) approved + `backup_log`
        trong migration P0 (neo **Q4/T9**)
  - [x] **Cổng ra P1**: [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 (partition) đóng lại trước khi `telemetry_events`
        vượt 5M hàng / 2GB (neo **D-Z**)
- [x] C12 xanh — bản đồ khớp hai chiều 100%
- [x] §7.3 có **16 dòng**, mỗi dòng có nguồn (`spec` + `Qn` + task) và cột ảnh hưởng
- [x] [`SPEC.md`](../SPEC.md) §13 tăng đúng **3** ô checklist (2 ở P0, 1 ở P1)
- [x] `grep -rn 'partition' docs/specs/` → chỉ ở [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 · DMO §7.3/§11
- [x] Lưu ý: §7.3 **không có cổng máy** — Checkpoint C phải đối chiếu tay 16 closure <-> 16 dòng

## T6 — [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) (M4 · R1 · R2 · M7 · M8) song song được

- [x] §7.3 theo **D-Z**: giữ PK `(session_uuid, seq)` **nguyên vẹn**, `BR-SPT-03` không đổi
- [x] §7.3 thêm partition note: **không** partitioned ở P0 + **hai điều kiện giữ đường mở**
      — (a) không FK nào trỏ **vào** `telemetry_events`; (b) giữ cột hẹp. Trỏ [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2
- [x] §7.1 theo **D-AA**: bỏ `age_band` khỏi bảng cột, thêm index `birth_year`
- [x] `BR-SPT-01` "13 cột" → "**12 cột**"
- [x] §9 scenario `BR-SPT-01`: 13 → 12 + assert `age_band` không là cột
- [x] §7.1 `current_curriculum_code` — đã khớp T4 ✓
- [x] §7.5 — 3 bảng rollup names in header, khớp DMO (T5)
- [x] §11 Q1 → **đóng** bằng D-Z · Q2 → **đóng** (D-AA)
- [x] §11 thêm 2 cột `Chặn phase` · `Chủ`
- [x] §9 thêm scenario: quét schema tìm FK trỏ **vào** `telemetry_events` thì **0 kết quả**
- [x] 0 OQ mở (2/2 đóng, có ngày + vì sao)
- [x] `BR-SPT-03` + PK **không đổi một chữ** — D-Z là quyết định *không làm gì*
- [x] Số cột `child_profiles` khớp **ba chỗ**: §7.1 (12) · `BR-SPT-01` (12) · §9 (12)
- [x] Đối chiếu tay [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.1 <-> SPT §7.1 — khớp từng tên cột
- [x] `grep -rn 'session_month' docs/specs/` → rỗng (chỉ còn ở event-catalog Q2 history)

## T7 — [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) (M2 · M6) song song được

- [x] §7.4 `code` → `GL-*` (khớp T3) + §9 dùng mã mới — đã xong ở T3
- [x] §11 Q1 → **đóng** bằng [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2 (T11): không ghim `entity_version`
- [x] Ghi hệ quả của Q1: đổi nội dung published thì mọi curriculum thấy bản mới ngay, **không có**
      đường ghim version
- [x] §11 Q2 (`lesson_activities` copy theo version) → hoãn có chủ, chặn **P3**
- [x] §7.2 `user_tags` — khớp bản đồ DMO (T5) — đã khớp sẵn, xác nhận không cần sửa
- [x] `BR-SCT-02` trỏ [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.1 làm nguồn **6** giá trị enum status
- [x] §11 thêm 2 cột `Chặn phase` · `Chủ`
- [x] C13 xanh trên file này
- [x] 0 chỗ ghi `G-*` · 0 chỗ ghi `scheduled`

## T8 — [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) (M9 · M10 · D-AC · D-AD · D-Y) song song được

- [x] Theo **D-Y** (đã chốt): thêm `AUTH-TOKENS-SESSIONS` vào `depends_on`
- [x] Theo **D-AB**: `packages.offers` khoá `billing_period` → `billing_period`, miền đóng
      `{yearly, monthly}`, ghi rõ MVP chỉ dùng `yearly`
- [x] Theo **D-AC**: §7.10a định nghĩa cột `content_review_log` — INSERT-only,
      `(entity_type, entity_id)` polymorphic — **cột lấy nguyên từ [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.2**
      (đầy đủ hơn bản nháp cũ của SIB: `from_status`/`to_status`/`actor_role`/`checklist_snapshot`),
      [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.2 rút gọn thành ngữ nghĩa + trỏ sang đây
- [x] Theo **D-AD**: §7.10 ghi rõ bảng nào vào **migration #1**, bảng nào chờ spec sở hữu
- [x] Theo **D-AD**: ghi **điều kiện chặn** — [`audit-log.md`](../specs/01-platform/audit-log.md) + [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) phải
      `approved` trước bước 8
- [x] **M9**: sửa [`actors.md`](../specs/00-foundation/actors.md) §11 Q1 closure → `mfa_settings.secret_encrypted`
      (không `mfa_secret`)
- [x] Ghi bất biến MFA: Manager không hoạt động khi `mfa_settings.confirmed_at IS NULL`,
      **ép ở tầng service** (không ép được ở cột) — [`actors.md`](../specs/00-foundation/actors.md) Q1
- [x] §7.3a `social_identities` — khớp bản đồ DMO (T5), xác nhận không cần sửa
- [x] §11 thêm 2 cột `Chặn phase` · `Chủ`; 2 OQ hiện có → đóng (Q1, D-AB) hoặc hoãn có chủ (Q2)
- [x] C12 xanh · `content_review_log` có đúng **1** spec `owns` (SIB, sau khi trim
      [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.2)
- [x] `BR-DM-04` + DMO §7.2 vẫn đếm **7** FK polymorphic — không đổi số, chỉ thêm chú thích D-AE
- [x] [`actors.md`](../specs/00-foundation/actors.md) §11 Q1 <-> SIB §7.3 nêu **cùng một** tên cột
- [x] §7.10 không để "xem spec X" cho bảng thuộc migration #1 — `content_review_log` trỏ
      §7.10a **trong cùng file**; `audit_logs`/`backup_log` ghi rõ đang `draft` + chặn bước 8

### Ngoài checklist gốc — phát sinh trong lúc làm T8, người dùng yêu cầu sửa rộng hơn

Khi làm §7.10a phát hiện [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.2 (approved) **đã có sẵn** một định nghĩa
cột `content_review_log` khác — sâu hơn và đang gắn với `BR-CLC-05/06/10/11` thật. Đồng thời
người dùng yêu cầu: **FK/quan hệ đa hình mặc định dùng `id`, trừ taxonomy Lớp 1 + `game_templates`
(có `code` riêng) và tham chiếu cố ý luôn theo bản published mới nhất**. Xử lý cả hai cùng lúc
(quyết định **D-AE**, xem [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.3 + `BR-DM-13` mới):

- [x] [`data-model-overview.md`](../specs/01-platform/data-model-overview.md): làm rõ `BR-DM-10` (chỉ áp lớp đối ngoại) + thêm `BR-DM-13` (FK nội
      bộ mặc định `id`, 2 ngoại lệ) + dòng D-AE ở §7.3
- [x] [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md): `lesson_activities` PK → `(lesson_id, position)`;
      `curriculum_items.curriculum_code+version` → `curriculum_id`; `curriculum_enrollments`
      → `(child_id, curriculum_id)`. `entity_code`/`ref_code` (tham chiếu luôn-mới-nhất) **giữ
      nguyên** — ghi chú phân biệt 2 loại tham chiếu ở đầu §7.6
- [x] [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md): `play_sessions`/`telemetry_events`/`level_daily_stats`/
      `level_params` — `game_level_code`/`curriculum_code`/`lesson_code` → `_id`.
      `current_curriculum_code` (child_profiles) **giữ nguyên** — tham chiếu luôn-mới-nhất
- [x] [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) (approved): viết lại "vì sao" cột `current_curriculum_code` (lý
      do cũ trích `BR-DM-10` giờ đã lỗi thời); allow-list telemetry §7.3 `game_level_code` → `_id`
- [x] [`content-versioning.md`](../specs/00-foundation/content-versioning.md) (approved): §7.4 `game_level_code` → `_id`; §11 Q2 thêm câu làm rõ
      không đổi kết luận
- [x] [`event-catalog.md`](../specs/00-foundation/event-catalog.md) (approved): §7.6 `game_level_code` → `_id`
- [x] [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md): `content_asset_refs` bỏ cột `entity_version` riêng, gộp vào `entity_id`
- [x] [`my-library.md`](../specs/03-account/my-library.md) · [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) · [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) · [`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md) — kiểm
      lại, **không đổi**: `entity_code`/`ref_code` của các file này đã đúng loại "luôn theo bản
      published mới nhất" (my-library có sẵn scenario test đúng hành vi này)
- [ ] Lưu ý: Chưa làm: rà lại 228 warning nền có tăng do các reviewed-date bump này không (đo ở
      Checkpoint C)

### D-AE sửa lại lần 2 (2026-08-07) — người dùng bác ngoại lệ "code cho tham chiếu luôn-mới-nhất"

Lần đầu tôi giữ `code` cho hai nhóm: (a) taxonomy Lớp 1/`game_templates`, (b) tham chiếu cố ý
luôn theo bản published mới nhất. Người dùng bác thẳng: **"FK tất cả phải tham chiếu ID chứ
không phải code, không có ngoại lệ."** Sửa lại đúng:

- [x] Taxonomy Lớp 1 (`competencies`/`strands`/`skills`/`learning_objectives`/`content_tags`)
      + `game_templates`: **vẫn giữ cột `code`** (định danh hiển thị/URL, [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7)
      nhưng **mọi bảng khác trỏ tới chúng bằng `id`**, không còn `_code` FK ở đâu
      (`strands.competency_id`, `skills.strand_id`, `learning_objectives.skill_id`,
      `content_tag_map`/`content_skill_map.tag_id`/`skill_id`, `mastery_state.skill_id`,
      `skill_daily_stats.skill_id`, `game_levels.template_id`)
- [x] Nhóm (b) "luôn theo published mới nhất" — thay cơ chế `code` bằng **`entity_id`** (neo
      dòng dõi): version đầu `entity_id = id`, version sau copy nguyên qua copy-on-write. Vẫn
      là `id`, chỉ khác cột nào (`entity_id` = trôi theo published, `id` = ghim đúng version).
      Áp cho: `curriculum_items.entity_id`, `current_curriculum_id` (child_profiles),
      `activities.ref_id`, `lesson_activities.activity_id`, `my-library.entity_id`,
      [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) PUT body `entity_id`
- [x] Thêm cột `entity_id` vào 5 bảng Lớp 2 có version: `game_levels`·`lessons`·`activities`·
      `curricula`·`worksheets`
- [x] [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) `BR-DM-13` viết lại — bỏ hẳn 2 ngoại lệ, chỉ còn quy tắc
      "id cho FK, code cho định danh hiển thị" + cơ chế `entity_id`
- [x] [`content-versioning.md`](../specs/00-foundation/content-versioning.md) §11 Q2 — thêm lượt sửa thứ 3 (lượt 1: T11 "code only"; lượt 2:
      D-AE lần 1 hôm nay giữ code làm ngoại lệ — **sai**; lượt 3: D-AE lần 2 — `entity_id`)
- [x] Quét toàn corpus, sửa thêm 8 chỗ mirror bị lệch phát hiện thêm:
      [`content-search.md`](../specs/01-platform/content-search.md)/[`content-tagging.md`](../specs/01-platform/content-tagging.md) (`tag_code`→`tag_id`), [`worksheet-model.md`](../specs/05-content/worksheet-model.md)/
      [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) (`learning_objective_codes`→`_ids`), [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md)
      (`skill_codes`→`skill_ids`), [`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md) (`template_code`/`skill_codes`)
- [x] **Không đổi** (external-facing theo `BR-DM-10`, khác lớp với FK nội bộ): API
      request/response body ([`curriculum-player.md`](../specs/04-play/curriculum-player.md) JSON trả `entity_code`, `game-config-
      delivery.md` `template_code`, `game-level-studio.md`/`lesson-authoring.md` Body admin
      submit theo code), URL param (`taxonomy-browser.md /taxonomy/{skill_code}`), event
      payload JSONB tự do ([`event-catalog.md`](../specs/00-foundation/event-catalog.md) §7.1), runtime config gửi xuống client
      ([`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md))
- [x] `pnpm lint:specs` 0 error/231 warning (không tăng) · `pnpm check` exit 0 ·
      `pnpm test` 81/81 — chạy lại sau sửa lần 2

## CHECKPOINT C

- [x] `pnpm lint:specs` exit 0 — **13 check** × 130 spec
- [x] Số warning **≤ 228** → đo được **219** (giảm 12: mỗi spec approve đều phải điền cột
      "vì sao" còn thiếu theo [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10, nên warning C6 giảm theo)
- [x] `pnpm check` exit 0 · `pnpm test` exit 0 (**81/81**, mốc cũ 56/56 đã lỗi thời)
- [x] người Đối chiếu tay: **11 closure <-> 11 dòng** DMO §7.3 — làm xong, **tìm được 2 lệch**:
  - [x] Quan trọng:[`access-ladder.md`](../specs/00-foundation/access-ladder.md) Q3 closure ghi enum 4 bậc là `guest`·`login`·`standard`·`premium` —
        **sai**: `guest` là tên *actor*, tên *bậc* là `free`. Toàn bộ phần còn lại của corpus
        dùng `free` (§7.1 `type AccessTier`, `BR-LAD-01`, [`glossary.md`](../specs/00-foundation/glossary.md), [`access-gating.md`](../specs/04-play/access-gating.md) ma trận,
        DMO §7.3). Đọc closure đó mà viết migration thì tạo nhầm giá trị enum. Đã sửa, không
        đổi kết luận
  - [x] [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.3 trỏ `monorepo-package-map` — file thật là
        [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md). Đã sửa thành link resolve được
  - [x] 9 closure còn lại khớp nguyên văn nguồn ✓
- [x] 1 commit / task, message ghi rõ đóng **M mấy** / **D nào**

---

## Phase 3 — Approve theo `depends_on` (không đảo, C8 gác)

Mỗi spec 4 bước: (1) checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10 thủ công → (2) đóng OQ chặn P0 kèm
**vì sao + ngày** → (3) `status: approved` + `reviewed:` → (4) `lint:specs` xanh.

### T9 — Layer 1 (song song được song song)
- [x] [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) — Q1 → **đóng** theo **D-W** (M11): hạ P0 → chờ P1, đồng bộ nhãn với
      [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 · Q2 hoãn sau MVP · Q3 hoãn chờ P3 ([`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md)) · Q4 hoãn chờ P1 ·
      thêm 2 cột §11 · `approved` + `reviewed: 2026-08-07`
  - [x] Lưu ý: Chủ **thật** của Q1 vẫn chưa có tên — D-W là nhãn, không phải người. Nợ #4 ở
        [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 **chưa đóng**, ghi rõ trong ô Chủ để không đọc nhầm là đã xong
- [x] [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) — ghi rõ trong §11: `phase: P1` là phase **implement**,
      không phải phase **approve**; approve bây giờ vì [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) (P0)
      `depends_on` nó
  - [x] Q1 (khảo sát 60 game type v1) → hoãn có chủ, chặn **phạm vi P1**, không chặn hình
        dạng contract
  - [x] Q2 · Q3 · Q4 hoãn có chủ · thêm 2 cột §11
  - [x] Ngoài checklist: `BR-GTC-08` thiếu cột "vì sao" (C6) — điền, vì [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
        bắt buộc trước khi approve. Warning nền **231 → 230**
- [x] C8 xanh — deps của cả 2 file (`GLOSSARY`·`ID-CONVENTIONS`·`CONTENT-LIFECYCLE`) đều
      đã `approved` từ trước, không đảo thứ tự
- [x] `approved` 16 → **18**/130 · `pnpm check` exit 0 · `pnpm test` 81/81

### T10 — Layer 2
- [x] [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) — sau T5, 3/3 OQ có kết luận (Q1 đóng D-Z · Q2 hoãn chờ P1 ·
      Q3 hoãn chờ P3, cả hai có chủ + phase) · `approved` + `reviewed: 2026-08-07`
- [x] C8 xanh — 4 deps (`GLOSSARY`·`ID-CONVENTIONS`·`CHILD-DATA-COMPLIANCE`·
      `CONTENT-VERSIONING`) đều `approved` từ trước
- [x] Ngoài checklist: 3 `BR-*` thiếu cột "vì sao" (`BR-DM-06`·`08`·`09`) — điền theo
      [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10. Warning nền **230 → 227**
- [x] `approved` 18 → **19**/130 · `pnpm check` exit 0 · `pnpm test` 81/81

### T11 — Layer 3
- [x] [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) (**D-Y = 7**, đã chốt) — 4 OQ phân loại: Q1 đóng (trùng [`actors.md`](../specs/00-foundation/actors.md)
      Q1) · Q2 đã đóng sẵn · Q3 đóng, chủ chuyển sang [`rate-limiting.md`](../specs/01-platform/rate-limiting.md) §7 · Q4 hoãn chờ P1.
      `BR-AUT-05`·`06`·`08`·`11` điền "vì sao"
- [x] [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) — Q2 hoãn có chủ · `BR-SIB-05`·`06` điền "vì sao"
- [x] [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) — Lưu ý: Q1 closure còn ghi "`code` only" (chữ **trước** D-AE lần 2,
      mâu thuẫn `BR-DM-13`) → sửa thành cơ chế `entity_id` · Q2 hoãn có điều kiện đo lại ·
      `BR-SCT-07` điền "vì sao"
- [x] [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) — 2/2 OQ đã đóng từ T6 · `BR-SPT-07` điền "vì sao"

## CHECKPOINT D — mở khoá P0 bước 8

- [x] Tổng `approved` = **23/130** (7 spec đích) — đo bằng `grep -rl '^status: approved'`
- [x] `pnpm lint:specs` exit 0 · `pnpm check` exit 0 · `pnpm test` exit 0 (81/81)
- [x] **Ca âm C8**: [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) → `draft` thì exit 1, đỏ **đúng 3** `schema-*`
- [x] **Ca âm C12**: xoá `social_identities` khỏi DMO §7 thì exit 1, báo đúng tên bảng
- [x] **Ca âm C13**: đổi ví dụ mã về `G-C1-CNT-007` thì exit 1, báo đúng `file:line` + regex
- [x] Phạm vi đo là **corpus** (`docs/specs/` + `docs/SPEC.md`), không phải cả `docs/` —
      `docs/tasks/*.md` là hồ sơ task, chính nó chứa chuỗi đang tìm nên gate viết `docs/`
      **vĩnh viễn không xanh được**. Đo lại đúng phạm vi:
  - [x] `grep -rn 'G-C[1-6]-' docs/specs/ docs/SPEC.md` → **rỗng** ✓
  - [x] `grep -rn 'session_month' docs/specs/ docs/SPEC.md` → **1 hit**, đúng ngoại lệ T6 đã
        ghi: dòng lịch sử quyết định [`event-catalog.md`](../specs/00-foundation/event-catalog.md) §11 Q2 Lượt 2 ✓
- [ ] [`todo.md`](../tasks/todo.md) mới ghi **P0 bước 8** — `packages/db/src/schema/*.ts` + migration #1, kèm điều
      kiện chặn D-AD ([`audit-log.md`](../specs/01-platform/audit-log.md) + [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) approved trước)
- [ ] người Người duyệt — sau đây là PR schema đầu tiên, đảo lại tốn **hai phase deprecation**
      (`BR-DM-09`)

---

## Ngoài task này (theo dõi riêng)

- [ ] **Nợ Task #2 #3** — 228 warning C6 "thiếu cột vì sao", và nâng C6 trở lại error
- [ ] **Nợ Task #2 #5** — `D-X` dùng cho 11 quyết định T9–T12, ledger mất tác dụng truy vết
- [ ] 7 chu trình `depends_on` (C7 warning): `02-public` 3 · `03-account` 1 · `06-admin` 3 ·
      `08-quality` 1
- [x] Approve [`audit-log.md`](../specs/01-platform/audit-log.md) + [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) — **chặn bước 8** theo D-AD. Xong
      2026-08-07 (T12). Lưu ý: Thực tế phải approve **3** spec: [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) `depends_on`
      `JOB-QUEUE` (draft) nên C8 chặn — [`job-queue.md`](../specs/01-platform/job-queue.md) approve cùng lượt (P1 approve ở P0, cùng
      tiền lệ [`game-template-contract.md`](../specs/01-platform/game-template-contract.md)). D-AD ghi 2 spec là **thiếu**; đã ghi chú ở SIB §7.10
      rằng điều kiện chặn nên phát biểu bằng bao đóng `depends_on`, không liệt kê tay
- [ ] Approve [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) seed + [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) — P0 bước 9, sau migration
- [ ] Chuyển `.agents/` vào `mindkid/` theo [`SPEC.md`](../SPEC.md) §8
- [ ] Chuyển `infra/` vào `mindkid/infra/` khi tới deploy
- [ ] `docs/montessori/` — chưa spec nào sở hữu
- [ ] Nhánh lỗi PG trong `check-services.ts` in message rỗng (mất `.message` ECONNREFUSED)
- [ ] Khảo sát 60 game type v1 → 6 template (P1, [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) Q1)
- [ ] Audit `packages/ui` (1.2M) vs [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) (§11 Q1)
- [ ] Cổng server-side thay `--no-verify` ([`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) Q12)
- [ ] Thêm lại service S3 local vào docker-compose khi [`image-storage.md`](../specs/01-platform/image-storage.md) tới
