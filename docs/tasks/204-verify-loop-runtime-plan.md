# Task #204 — Rút thời gian cổng verify (format · typecheck · test)

## Context

Mỗi task hiện phải chạy `pnpm check` để verify, và vòng đó **quá dài để dùng được**.
Đo hôm nay (2026-09-02, máy 8 core / 16 GB, Node 24.15.0, PG 17 + Valkey 9 đang chạy,
cây làm việc đang dở Task #202 nên một số cổng đỏ — số đo vẫn đúng vì đo wall-clock):

| Cổng | Wall clock | Ghi chú |
|---|---|---|
| `pnpm lint` | **9,9 s** | 1.598 file — không phải vấn đề |
| `pnpm lint:deps` | **10,3 s** | 1.815 module — không phải vấn đề |
| root `tsc --noEmit` | **73 s** | check 55 s, 242k dòng TS, **không có `incremental`** |
| `apps/web` `vue-tsc -b` | **256 s nguội / 184 s "ấm"** | 4 project chạy nối đuôi |
| ├ `web:app` | 96 s | 2.772 file, 243k dòng |
| ├ `web:server` | 32 s | |
| ├ `web:node` / `web:shared` | 8 s / 6 s | |
| `apps/admin` | 18 s | |
| `apps/worker` | 22 s | |
| **vitest, 18 project chạy TÁCH** | **788 s ≈ 13,1 phút** | 391 file, xanh toàn bộ (đo lại 12:10–12:23, máy rảnh). Nặng nhất: `web` 273 s · `db` 260 s · `game-engine` 74 s |
| **`pnpm test` chạy GỘP** | **chưa hết nổi** | lượt duy nhất thử được dừng ở **36/388 file sau ~15 phút** — chậm hơn hẳn tổng của 18 lượt tách |

Ba nguyên nhân, cả ba đều **đo được**, không phải suy đoán.

### 1. Test tuần tự cho cả 17 project, kể cả 13 project không chạm DB

`SEQUENTIAL_DEFAULTS` (`packages/config/vitest/base.ts:110`) đặt
`fileParallelism:false, maxWorkers:1, pool:"forks", forks:{singleFork:true}` cho **mọi**
workspace qua `defineWorkspaceTest`. Lý do ghi trong comment là thật — integration test
dùng PostgreSQL thật (`BR-TST-02`) nên hai file song song tranh cùng hàng dữ liệu.
Nhưng nó chỉ đúng với **139/388** file test:

| Workspace | file test | file chạm DB |
|---|---|---|
| `apps/web` | 103 | 77 |
| `packages/db` | 112 | 54 |
| `apps/worker` | 10 | 6 |
| `packages/shared` | 48 | 1 |
| `packages/adaptive` | 3 | 1 |
| **13 workspace còn lại** | **113** | **0** |

Thí nghiệm trên `packages/game-engine` (65 file, 1.039 test, 0 file chạm DB). Mọi lượt
đo trên **máy rảnh, cache ấm**, và đều ra 65 file / 1.039 test xanh:

| Cấu hình | Wall clock | so với hiện tại |
|---|---|---|
| `SEQUENTIAL_DEFAULTS` (đang dùng) | **74,0 s** | — |
| `forks` + song song | 21,9 s | 3,4× |
| **`threads` + song song + `isolate`** | **16,3 s** | **4,5×** |
| `threads` + song song, `isolate:false` | 9,0 s | 8,2× |

**4,5×, cùng số test, cùng kết quả.** Phần lớn 74 s là `import` — mỗi file test dựng lại
module registry mà không có worker nào chạy song song. `isolate:false` nhanh hơn nữa
nhưng **không dùng**: nó bỏ ranh giới module giữa các file test, và một lượt xanh không
chứng minh được không có rò state.

### 2. `globalSetup` (migrate + TRUNCATE 81 bảng) gắn vào cả 17 project

`defineWorkspaceTest` khai `globalSetup: [DATABASE_GLOBAL_SETUP]` cho mọi workspace, nên
mỗi `vitest run` đều chạy migration + `TRUNCATE` dù package đó không mở kết nối nào.
Chi phí cố định, A/B trên **cùng** `packages/taxonomy` (1 file), 3 lượt, máy rảnh:

| | lượt 1 | lượt 2 | lượt 3 |
|---|---|---|---|
| có `globalSetup` | 4,12 s | 4,65 s | 4,91 s |
| không `globalSetup` | 2,85 s | 3,14 s | 3,26 s |

→ **~1,5 s tiền phạt cố định mỗi lần gọi vitest**, trả cả khi chạy đúng một file.

Đáng kể hơn tiền phạt thời gian: hai `vitest run` cùng chạm `mindkid_test` thì **deadlock**
(`PostgresError: deadlock detected`, đo 2026-09-02). Workspace không chạm DB mà vẫn mang
`globalSetup` là mở rộng cửa sổ đó ra vô cớ.

### 3. Typecheck vứt cache mỗi lần chạy, và có hai đường không khớp nhau

- `packages/config/tsconfig.base.json` không bật `incremental` → lưới root luôn kiểm lại
  toàn bộ 1.984 file.
- `apps/*` dùng `vue-tsc -b`. Build mode coi project **có lỗi** là "chưa dựng xong" nên
  **bỏ cache và kiểm lại từ đầu mỗi lần** — mà repo đỏ là trạng thái bình thường ở đây
  (bậc thang `typecheck-baseline.json`). Đo được: `.nuxt/tsconfig.app.tsbuildinfo` chỉ
  **2,8 KB** sau khi chạy, tức không chứa gì.
- Thí nghiệm với `--noEmit -p` + `--incremental --tsBuildInfoFile` trên `web:app`:

  | Lần chạy | Wall clock | Lỗi báo ra |
  |---|---|---|
  | nguội (dựng cache) | 221 s * | 2 |
  | **ấm (không sửa gì)** | **51 s** * | 2 |

  \* đo khi CPU đang chạy song song bộ test → cả hai đều bị thổi lên; **tỉ lệ 4,3×** mới
  là con số đáng tin. Buildinfo ra **772 KB** — cache thật. Quan trọng: **lỗi được giữ
  nguyên qua cache**, khác hẳn `-b`.

- `vue-tsc -b` chạy 4 project `.nuxt/tsconfig.*.json` **nối đuôi** (96+32+8+6 s) trong khi
  chúng độc lập.
- Hai đường typecheck cùng tồn tại và **không đồng ý với nhau**:
  `pnpm typecheck` → `scripts/typecheck-parallel.sh` (không có bậc thang), còn
  `pnpm typecheck:gate` → `scripts/typecheck/typecheck-gate.ts` (có bậc thang, chạy 10
  project **tuần tự** bằng `spawnSync` trong `.map()`, `typecheck-gate.ts:266`).
  `AGENTS.md:73` mô tả `pnpm typecheck` **là** cổng bậc thang và `AGENTS.md:93` ghi
  workspace ❌ NEVER khai script `typecheck` riêng — nhưng cả ba app đều đang có.

### 4. Không có vòng verify hẹp

`pnpm check` luôn đo cả cây. Sửa một file trong `packages/game-engine` vẫn kéo theo
migration DB, 103 file test của `apps/web`, và 73 s typecheck root.

### Kết quả nhắm tới

| | Bây giờ | Sau |
|---|---|---|
| `pnpm verify <path>` (vòng trong khi làm task) | *không có* | **< 30 s** |
| `pnpm check:fast` | chưa chạy hết nổi | **< 4 phút** |
| `pnpm check` (cổng pre-push) | chưa chạy hết nổi | **< 6 phút** |

Trần của `pnpm test` **gộp** vẫn chưa chốt được (lượt duy nhất thử không chạy hết). Mốc ở
trên lấy theo 788 s của 18 lượt tách — số thật đo được, ❌ không phải ngoại suy.

> **Cảnh báo phương pháp — đã trả giá trong chính task này.** Lượt đo đầu chạy khi máy còn
> tiến trình nặng khác, và ba con số của nó **sai tới mức đảo kết luận**: `globalSetup`
> "11 s" (thật: 1,5 s), `isolate:false` "chậm hơn" (thật: nhanh hơn gần gấp đôi), song song
> "3,9×" (thật: 4,5×). Cấm — NEVER đo khi máy còn việc nặng khác.

## Ràng buộc contract — không được vi phạm

| Nguồn | Ràng buộc | Ảnh hưởng plan |
|---|---|---|
| `testing-strategy.md` §8 | `pnpm check` = lint + lint:deps + typecheck + test + test:deploy, **cả năm phải xanh** | Chỉ đổi *cách chạy*, ❌ NEVER bớt bước. Có ca âm cho chính điều này |
| `BR-TST-02` | Cấm mock DB — PostgreSQL thật | Không đụng tới; nhóm DB vẫn dùng PG thật |
| `BR-TST-05` | Cấm chạm DB ngoài loopback | `assertDisposableDatabaseUrl` giữ nguyên, áp cho **mọi** database mới sinh |
| `testing-strategy.md` §5 | "Test chậm → **Tách suite**, không bỏ" | Chính là việc đang làm |
| `testing-strategy.md` §11 Q1 | "Giữ một suite; **chỉ tách khi P95 vượt 120 s**" | 18 project cộng lại **788 s**; riêng `web` 273 s và `db` 260 s đã vượt một mình → điều kiện tách đã thoả. Ghi thành mục quyết định trong spec kèm số Phase 0 |
| `runtime-gates.md`, memory *gate-silent-pass-patterns* | Cổng ❌ NEVER xanh giả | Mỗi thay đổi dưới đây kèm **ca âm** bắt buộc |
| `repo-bootstrap.md` §4 b.6 | Cấm thêm script `lint:*` mới cho một rule | Cổng mới là test vitest, không phải script |

## Kiến trúc — bốn quyết định

**D-1 · Tách hai nhóm test theo *nhu cầu DB*, không theo workspace.**
`defineWorkspaceTest` nhận cờ mới `database: boolean` (mặc định `true` — an toàn khi
quên khai). `database:false` → `pool:"threads"`, `fileParallelism:true`,
`maxWorkers: cpus-1`, **không** `globalSetup`, **không** `test.env` DB. `database:true` →
giữ nguyên `SEQUENTIAL_DEFAULTS` như hiện tại. Workspace hỗn hợp (`web`, `db`, `worker`,
`shared`, `adaptive`) khai **hai** project vitest — `<tên>` (thuần, song song) và
`<tên>:db` (tuần tự) — phân tách bằng `include`/`exclude` theo thư mục
(`tests/integration/**`, `tests/gates/**` đụng DB → nhóm db).

*Vì sao không mở song song luôn cho nhóm DB:* mỗi worker cần một database riêng
(`CREATE DATABASE ... TEMPLATE`). Đó là thay đổi lớn hơn và **chỉ đáng làm nếu nhóm DB
vẫn là nút thắt sau D-1** — để ở Phase 4, có cổng đo trước.

**D-2 · Một đường typecheck duy nhất, có cache, chạy song song.**
`scripts/typecheck/typecheck-gate.ts` là **chỗ duy nhất** (đúng như `AGENTS.md:73–78` đã
mô tả). Mỗi project chạy `--noEmit -p <cfg> --incremental --tsBuildInfoFile
node_modules/.cache/typecheck/<name>.tsbuildinfo`, và 10 project chạy qua pool giới hạn 4
tiến trình thay vì `.map()` tuần tự. Xoá `scripts/typecheck-parallel.sh` và ba script
`typecheck` của `apps/*`. Bật `incremental` trong `tsconfig.base.json` cho lưới root.

**D-3 · `check.sh` chồng lấn ba pha độc lập.**
lint · typecheck · test không phụ thuộc nhau → chạy đồng thời, gom kết quả, báo **mọi**
pha đỏ chứ không chỉ pha đầu. Bỏ `--max-workers=1 --no-file-parallelism` ở dòng gọi
vitest: đó là bản sao của config và là đúng thứ chặn D-1.

**D-4 · Thêm vòng trong hẹp `pnpm verify [path...]`.**
biome trên file đã đổi · typecheck **chỉ** project sở hữu file đó · `vitest related` trên
file đã đổi. Không thay `pnpm check`, chỉ là thứ dùng *trong lúc* làm task.

## Phase 0 — Chốt đường cơ sở (bắt buộc chạy trước)

Không sửa gì. Chạy và lưu số vào `docs/tasks/204-*-todo.md`:

```bash
export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"   # node PATH là v20 → pnpm chết
for p in $(pnpm exec vitest --project '' 2>&1 | grep -oE '@mindkid/[a-z-]+'); do … done
```

- [ ] Bảng `project | số file | wall-clock` cho cả 17 project (11 project đầu đã đo, ở §Context)
- [ ] Tổng `pnpm test` thật (chạy nền, ghi số — không ngoại suy)
- [ ] Danh sách `trạng-thái | tên-test` của toàn bộ suite, lưu ra file

> **`AGENTS.md` §Test:** khi refactor, ❌ đừng lấy "test xanh" làm cổng — chụp danh sách
> `trạng-thái | tên-test` trước/sau và đòi **trùng khít**. Cây đang đỏ vì Task #202;
> đường cơ sở phải chụp **đúng trạng thái đỏ đó**, và sau refactor phải đỏ y hệt.

---

## Phase 1 — Test: tách nhóm thuần khỏi nhóm DB

### Task 1.1 · Cờ `database` trong `defineWorkspaceTest` — S

**Mô tả:** thêm tham số `database` (mặc định `true`) vào `defineWorkspaceTest`; khi
`false` thì trả cấu hình song song và **không** gắn `globalSetup`/`test.env` DB. Chưa
workspace nào dùng — hành vi toàn repo không đổi.

**Acceptance**
- [ ] `PARALLEL_DEFAULTS` mới đứng cạnh `SEQUENTIAL_DEFAULTS`, có comment nói vì sao
      (đo 2026-09-02 máy rảnh: tuần tự 74,0 s · forks song song 21,9 s · threads song song
      **16,3 s** · threads + `isolate:false` 9,0 s. Không bật `isolate:false` — lý do là
      ngữ nghĩa, không phải tốc độ)
- [ ] Quên khai `database` → vẫn tuần tự + có globalSetup (fail-safe)

**Verify**
- [ ] `pnpm exec vitest run --project @mindkid/game-engine` — 64 file / 1.033 test, **giống hệt** đường cơ sở
- [ ] Ca âm: `packages/config/tests/vitest-contract.test.ts` gọi `defineWorkspaceTest()`
      không tham số và assert `globalSetup` có mặt + `fileParallelism === false`

**Files:** `packages/config/vitest/base.ts`, `packages/config/tests/vitest-contract.test.ts` (mới)
**Deps:** Phase 0

### Task 1.2 · Lật 13 workspace không chạm DB — M

**Mô tả:** `database:false` cho `game-engine · auth · admin · queue · ui · notification ·
config · cache · taxonomy · storage · moderation · emoji` (+ project `scripts` đã sẵn không
có globalSetup). Đây là 113 file test, 0 file chạm DB — đã đếm bằng grep
`@mindkid/db|from "postgres"|getOwnerDb|drizzle-orm`.

**Acceptance**
- [ ] 12 `vitest.config.ts` khai `database:false`
- [ ] Chạy riêng từng project: **cùng số test, cùng trạng thái** với đường cơ sở
- [ ] `packages/queue` (dùng Valkey, không dùng PG) vẫn xanh — nó đã tự cô lập bằng
      `VALKEY_QUEUE_PREFIX = test-${process.pid}` (`packages/db/tests/setup.ts`); kiểm rằng
      prefix vẫn duy nhất khi nhiều worker cùng chạy (`pid` giống nhau giữa các thread! →
      đổi sang `${process.pid}-${VITEST_POOL_ID}`)

**Verify**
- [ ] `game-engine` ≤ 20 s (đường cơ sở 74 s; đã đo 16,3 s qua chính cờ này)
- [ ] Tổng 13 project ≤ 60 s (đường cơ sở 156 s)
- [ ] Ca âm: chạy 3 lần liên tiếp, kết quả trùng khít — bắt flaky do song song

**Files:** 12 × `packages/*/vitest.config.ts`, `apps/admin/vitest.config.ts`, `packages/db/tests/setup.ts`
**Deps:** 1.1

### Checkpoint A
- [ ] `pnpm test` vẫn chạy hết, danh sách `trạng-thái | tên-test` **trùng khít** Phase 0
- [ ] Không project nào mất file test (xem Task 1.5)
- [ ] Ghi số mới vào todo

### Task 1.3 · Tách `apps/web` thành `web` (thuần) + `web:db` — M

**Mô tả:** 103 file, 77 chạm DB. Chia bằng thư mục: `tests/api/**` +
`tests/integration/**` → `web:db` (tuần tự); `tests/unit/**`, `tests/gates/**`,
`tests/security/**`, `src/**` → `web` (song song). Phân loại phải **đo bằng grep, không đoán**
— file nào trong nhóm thuần mà import `@mindkid/db` thì chuyển sang nhóm db.

**Acceptance**
- [ ] `103 = |web| + |web:db|`, không file nào ở cả hai, không file nào rơi ra ngoài
- [ ] `web` không mở kết nối PG nào (kiểm bằng `pg_stat_activity` trong lúc chạy, hoặc
      bỏ `DATABASE_URL` khỏi `test.env` của nhóm đó và đòi vẫn xanh)

**Verify**
- [ ] Danh sách test của `web` + `web:db` hợp lại trùng khít baseline `apps/web`
- [ ] Ca âm: thêm một file test import `@mindkid/db` vào `tests/unit/` → cổng 1.5 đỏ

**Files:** `apps/web/vitest.config.ts`, `apps/web/tests/setup.ts`
**Deps:** 1.2

### Task 1.4 · Tách `packages/db`, `apps/worker`, `packages/shared`, `packages/adaptive` — M

**Mô tả:** cùng khuôn 1.3. `shared` (47/48 thuần) và `adaptive` (2/3 thuần) gần như lật
nguyên; `db` (58/112 thuần) và `worker` (4/10 thuần) chia đôi thật.

**Acceptance**
- [ ] Bốn workspace, mỗi cái đủ `|thuần| + |db| = tổng`
- [ ] `packages/shared` ≤ 20 s (đường cơ sở 41 s)

**Verify**
- [ ] Danh sách test hợp lại trùng khít baseline từng workspace
**Deps:** 1.3

### Task 1.5 · Cổng: không file test nào rơi ra ngoài mọi project — S

**Mô tả:** đóng lỗ hổng mà `base.ts:141` đã tự ghi: *"bỏ sót một nhánh là test **im lặng
không chạy**… Cổng giữ bất biến này đã bị gỡ 2026-08-29"*. Việc tách project ở 1.3/1.4
làm lỗ hổng đó **nguy hiểm hơn hẳn**, nên cổng phải quay lại **trong cùng phase**.

**Acceptance**
- [ ] Test quét mọi `*.{test,spec}.{ts,tsx}` dưới `apps/*` và `packages/*` (trừ
      `fixtures/`), đối chiếu với `include`/`exclude` đã giải của từng project vitest
- [ ] File thuộc 0 project → đỏ. File thuộc ≥2 project → đỏ
- [ ] Ca âm: fixture một file test ngoài mọi `include` → cổng đỏ

**Verify**
- [ ] `pnpm exec vitest run --project @mindkid/config` xanh, và ca âm đỏ đúng chỗ

**Files:** `packages/config/tests/vitest-projects.test.ts` (mới),
`packages/config/tests/fixtures/orphan-test-file.ts.txt` (mới)
**Deps:** 1.2 · **làm trước khi merge 1.3/1.4**

### Checkpoint B
- [ ] `pnpm test` toàn bộ: danh sách trùng khít Phase 0
- [ ] Đo lại tổng — mục tiêu **≤ 4 phút** (đường cơ sở 788 s = 13,1 phút)
- [ ] Chạy 3 lần, kết quả giống nhau (không flaky)
- [ ] **Review với người trước khi sang Phase 2**

---

## Phase 2 — Typecheck: một đường, có cache, song song

### Task 2.1 · `incremental` cho lưới root — S

**Acceptance**
- [ ] `incremental: true` + `tsBuildInfoFile: "node_modules/.cache/typecheck/root.tsbuildinfo"`
- [ ] `.gitignore` bỏ qua `node_modules/.cache/` (đã sẵn qua `node_modules`)
- [ ] Lần chạy ấm ≤ 25 s (đường cơ sở 73 s)

**Verify**
- [ ] **Ca âm cache (bắt buộc):** sửa một file `packages/*/src/*.ts` thành sai kiểu → chạy
      ấm phải **báo đúng lỗi mới**. Cache im lặng nuốt lỗi là đúng dạng "cổng xanh giả"
      mà repo đã trả giá nhiều lần
- [ ] Số lỗi lần ấm **bằng** lần nguội

**Files:** `packages/config/tsconfig.base.json`
**Deps:** không

### Task 2.2 · Cổng bậc thang chạy song song + incremental — M

**Mô tả:** trong `typecheck-gate.ts`, đổi `projects.map(reportProject)` sang pool 4 tiến
trình (`spawn` + `Promise`, không `spawnSync`), và thêm
`--incremental --tsBuildInfoFile node_modules/.cache/typecheck/<name>.tsbuildinfo` vào
lệnh compiler. `TYPECHECK_PROJECTS` (`typecheck-delta.ts:38`) giữ nguyên — vẫn là nguồn
sự thật.

**Acceptance**
- [ ] 10 project chạy tối đa 4 cùng lúc; thứ tự **output** vẫn cố định theo
      `TYPECHECK_PROJECTS` (báo cáo phải deterministic)
- [ ] Nguội ≤ 150 s · **ấm ≤ 60 s** (đường cơ sở: `-b` không bao giờ ấm)
- [ ] Lỗi được giữ qua cache — đã đo trên `web:app`: 2 lỗi ở cả nguội và ấm

**Verify**
- [ ] `pnpm typecheck` và `pnpm typecheck --only web` cùng ra một số cho `web:*`
- [ ] **Ca âm 1:** tiêm lỗi kiểu vào `apps/web/app/**` → ấm vẫn đỏ đúng file
- [ ] **Ca âm 2:** xoá `.nuxt/` → báo "chạy nuxt prepare", ❌ không xanh im lặng
      (nhánh này đã có ở `typecheck-gate.ts:60`, phải còn nguyên)
- [ ] `scripts/typecheck/typecheck-gate.test.ts` xanh

**Files:** `scripts/typecheck/typecheck-gate.ts`, `scripts/typecheck/typecheck-gate.test.ts`
**Deps:** 2.1

### Task 2.3 · Gỡ đường typecheck thứ hai — S

**Mô tả:** `pnpm typecheck` trỏ thẳng vào cổng bậc thang. Xoá
`scripts/typecheck-parallel.sh`, `typecheck:seq`, `typecheck:apps`, `typecheck:root`, và
script `typecheck` của `apps/web`·`apps/admin`·`apps/worker` — `AGENTS.md:93` vốn đã ghi
workspace ❌ NEVER khai script đó.

**Acceptance**
- [ ] Còn đúng một script: `"typecheck": "node scripts/typecheck/typecheck-gate.ts"`
- [ ] `check.sh` gọi `pnpm typecheck` (không gọi thẳng file .sh nữa)
- [ ] `AGENTS.md` §"Cổng nào thật" khớp thực tế trở lại

**Verify**
- [ ] `grep -rn "typecheck-parallel\|typecheck:seq" .` → 0 kết quả ngoài git history
- [ ] `pnpm typecheck` phủ đủ 10 project (đọc từ output)

**Files:** `package.json`, `apps/*/package.json`, `scripts/check.sh`, `AGENTS.md`
**Deps:** 2.2

### Checkpoint C
- [ ] `pnpm typecheck` ấm ≤ 60 s, số lỗi bằng đường cơ sở từng project
- [ ] Cả hai ca âm của 2.2 đỏ đúng chỗ

---

## Phase 3 — Vòng verify

### Task 3.1 · `check.sh` chạy chồng lấn, báo đủ mọi pha đỏ — S

**Mô tả:** lint · typecheck · test là ba pha độc lập → chạy đồng thời. Bỏ
`--max-workers=1 --no-file-parallelism` (bản sao config, và chính nó vô hiệu hoá Phase 1).
Fail-fast hiện tại còn có tật: pha 1 đỏ thì **không bao giờ thấy** lỗi typecheck/test, nên
một task phải sửa–chạy–sửa nhiều vòng. Đổi sang: chạy hết, báo mọi thứ đỏ, exit 1.

**Acceptance**
- [ ] Năm bước của `testing-strategy.md` §8 còn nguyên (lint · lint:deps · typecheck · test · test:deploy)
- [ ] `--fast` bỏ `test:deploy`, giữ bốn bước còn lại
- [ ] Output tóm tắt: từng pha `✓/✗` kèm số giây

**Verify**
- [ ] **Ca âm (chống thu hẹp cổng — đã xảy ra 2 lần, xem `108-quality-gate-convergence-plan.md`):**
      test trong `packages/config/tests/` đọc `scripts/check.sh` và đòi đủ 5 lệnh; xoá một
      lệnh → đỏ
- [ ] Tiêm lỗi lint **và** lỗi kiểu cùng lúc → output báo **cả hai**

**Files:** `scripts/check.sh`, `packages/config/tests/check-script-contract.test.ts` (mới)
**Deps:** 1.4, 2.3

### Task 3.2 · `pnpm verify [path...]` — vòng trong của task — M

**Mô tả:** cổng hẹp cho lúc *đang* làm, không thay `pnpm check`.
Mặc định không tham số → lấy file đổi từ `git diff --name-only HEAD` + untracked.

1. `biome check --write` trên đúng các file đó
2. `pnpm typecheck --only <project>` cho project sở hữu các file đó (suy từ
   `TYPECHECK_PROJECTS` + đường dẫn; `packages/*` → `root`)
3. `vitest related <files>` — vitest 4 có sẵn (đã kiểm `vitest --help`)

**Acceptance**
- [ ] Sửa 1 file trong `packages/game-engine` → verify **≤ 30 s**
- [ ] Không file nào đổi → không chạy gì, thoát 0, nói rõ lý do
- [ ] In ra **chính xác** nó đã chạy gì — ❌ NEVER để người đọc tưởng nó phủ nhiều hơn thực tế

**Verify**
- [ ] Ca âm: tiêm lỗi kiểu vào file đã sửa → `verify` đỏ
- [ ] **Ca âm quan trọng:** tiêm lỗi vào file **không** sửa → `verify` xanh và **phải in
      cảnh báo** rằng nó chỉ đo phạm vi hẹp; `pnpm check` mới là cổng

**Files:** `scripts/verify.ts` (mới), `package.json`
**Deps:** 3.1

### Task 3.3 · `lefthook` dùng đúng tầng — S

**Mô tả:** `pre-push` đang **bị comment hết** (`lefthook.yml:60–78`) — hiện không có cổng
nào lúc push. Mở lại sau khi `pnpm check` đã đủ nhanh để dùng thật.

**Acceptance**
- [ ] `pre-commit` giữ nguyên (format staged + lint + deps ≈ 12 s)
- [ ] `pre-push` mở lại: `pnpm services` → `pnpm check`
- [ ] `pre-push` đo được ≤ 6 phút

**Verify**
- [ ] Ca âm: commit một file vi phạm lint → `lefthook run pre-commit` chặn
- [ ] Ca âm: push với lỗi kiểu → `lefthook run pre-push` chặn

**Files:** `lefthook.yml`
**Deps:** 3.1 · **Cấm mở lại trước khi Checkpoint B + C xanh** — bật một cổng 13 phút là
đảm bảo người ta gõ `--no-verify`

### Checkpoint D
- [ ] `pnpm verify` < 30 s · `pnpm check:fast` < 4 phút · `pnpm check` < 6 phút
- [ ] Toàn bộ ca âm của Phase 1–3 đỏ đúng chỗ
- [ ] Danh sách `trạng-thái | tên-test` trùng khít Phase 0

---

## Phase 4 — Chỉ làm nếu số đo đòi

### Task 4.1 · Database riêng cho từng worker — L · **có cổng vào**

**Điều kiện khởi động:** sau Checkpoint B, nhóm `*:db` vẫn > 3 phút. Nếu không, **đóng
task này, không làm** — memory *tinimath-contract-integrity-over-speed*: đo cái mà luật
thật sự chặn trước khi nới nó.

**Phác thảo:** `mindkid_test` thành template; mỗi worker dùng
`mindkid_test_${VITEST_POOL_ID}` tạo bằng `CREATE DATABASE … TEMPLATE mindkid_test`
(chép nhị phân, nhanh hơn chạy lại migration). `assertDisposableDatabaseUrl` +
kiểm hậu tố `_test` áp cho **mọi** tên sinh ra. `truncateAllTestTables` chuyển sang
per-worker, gỡ hẳn cửa sổ TRUNCATE-giữa-chừng mà `global-setup.ts:246` đã mô tả.

**Rủi ro:** `CREATE DATABASE … TEMPLATE` đòi không có kết nối nào tới template. Cần cổng
đo trước.

### Task 4.2 · Cập nhật spec cho khớp thực tế — S

**Acceptance**
- [ ] `testing-strategy.md` §11 Q1 đóng lại: điều kiện "P95 > 120 s" đã thoả (788 s ngày
      2026-09-02, riêng `web` 273 s và `db` 260 s đã vượt một mình), suite tách thành
      nhóm thuần / nhóm DB
- [ ] §7.1 thêm dòng phân nhóm và luật "test chạm DB thì thuộc nhóm `*:db`"
- [ ] `type-safety.md` §8 khớp đường typecheck mới
- [ ] `AGENTS.md` bảng cổng khớp `package.json` thật
- [ ] Ghi mục quyết định `D-…` kèm **số đo**, không kèm ý kiến

**Deps:** mọi phase trước

---

## Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Test song song lộ flaky đang ẩn (state chia sẻ, thứ tự ngầm) | **Cao** | Chỉ lật workspace **0 file chạm DB**; chạy 3 lượt đòi trùng khít; `BR-TST-07` — flaky thì quarantine, ❌ NEVER xoá |
| Tách project làm file test **im lặng không chạy** | **Cao** | Task 1.5 làm **trước** khi merge 1.3/1.4; cổng + ca âm |
| Cache typecheck nuốt lỗi mới | **Cao** | Ca âm bắt buộc ở 2.1 và 2.2: tiêm lỗi → lần chạy ấm phải đỏ |
| `pnpm check` bị thu hẹp lần thứ ba | Trung bình | Task 3.1 ca âm đọc chính `check.sh`, đòi đủ 5 lệnh |
| Cây đang đỏ (Task #202 emoji) làm khó phân biệt "đỏ cũ" / "đỏ mới" | Trung bình | Phase 0 chụp đúng trạng thái đỏ hiện tại làm chuẩn so sánh |
| `VALKEY_QUEUE_PREFIX = test-${pid}` không còn duy nhất khi chạy threads | Trung bình | Task 1.2 đổi sang `${pid}-${VITEST_POOL_ID}` |
| `node` trên PATH là v20 → `pnpm` chết `ERR_UNKNOWN_BUILTIN_MODULE` | Thấp | Mọi lệnh đo phải `export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"` (v24.14.1 hỏng — dùng **v24.15.0**) |
| Hook `rtk` bóp méo output cổng | Thấp | Đọc số bằng `rtk proxy "<lệnh>"` khi nghi ngờ |

## Câu hỏi mở

1. **`packages/db` 112 file / 54 chạm DB** — 58 file thuần trong đó phần lớn là *cổng quét
   corpus* (`tests/gates/`). Chúng đọc file nguồn, không đọc DB — nhưng vài cổng đọc DB
   thật (`curriculum-items-supply.test.ts` gọi `seed()`, 24 s/test). Phân loại theo
   **thư mục** hay theo **grep import**? Plan chọn **grep import** (đo được), thư mục chỉ
   là gợi ý.
2. **6 file gọi `seed()` (13 call site, 5–24 s mỗi lần)** — gieo một lần cho cả nhóm db
   rồi cho các test đọc chung sẽ nhanh hơn nhiều, nhưng đó là đổi *hợp đồng cô lập* của
   test, không phải đổi cách chạy. Để ngoài phạm vi task này; ghi thành task riêng.
3. `pnpm test:deploy` (`infra/scripts/tests/run.sh`, 21 KB shell) **chưa đo**. Nếu Phase 0
   cho thấy nó > 60 s thì thêm task; nếu không thì bỏ qua.

## Verification tổng

```bash
export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"
docker compose up -d && pnpm services

# 1. Danh sách test trùng khít đường cơ sở — cổng chính của refactor
pnpm exec vitest run --reporter=json > after.json
node scripts/compare-test-lists.mjs before.json after.json   # đòi TRÙNG KHÍT

# 2. Số đo
time pnpm verify                 # < 30 s
time pnpm check:fast             # < 4 phút
time pnpm check                  # < 6 phút
time pnpm typecheck              # ấm < 60 s

# 3. Ca âm — mỗi cái PHẢI đỏ
#    a. file test ngoài mọi include        → Task 1.5 đỏ
#    b. lỗi kiểu tiêm vào, chạy typecheck ấm → Task 2.2 đỏ
#    c. xoá một lệnh khỏi check.sh          → Task 3.1 đỏ
#    d. xoá .nuxt/                          → typecheck báo lỗi, không xanh im lặng
#    e. lỗi lint trong file staged          → lefthook pre-commit chặn
```

**Định nghĩa hoàn thành:** ba mốc thời gian đạt · năm ca âm đỏ đúng chỗ · danh sách test
trùng khít · spec và `AGENTS.md` khớp `package.json` thật.

---

