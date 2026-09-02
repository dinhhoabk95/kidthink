# Todo — Task #204: Rút thời gian cổng verify (format · typecheck · test)

> Kế hoạch: [`204-verify-loop-runtime-plan.md`](204-verify-loop-runtime-plan.md).
> Mốc ban đầu (2026-09-02, 8 core / 16 GB, Node 24.15.0, PG 17 + Valkey 9 sống,
> cây đang dở Task #202 nên một số cổng đỏ):
> **lint 9,9 s · lint:deps 10,3 s · tsc root 73 s · apps/web `vue-tsc -b` 184–256 s ·
> vitest 18 project chạy tách 788 s; chạy GỘP thì chưa hết nổi (36/388 file sau ~15 phút)**.
> Đích: **`pnpm verify` < 30 s · `check:fast` < 5 phút · `check` < 8 phút**.

## Đợt 0 — Đường cơ sở (cấm — NEVER sửa gì trong đợt này)

### `#204.0` Đo và ghi số

> Đo **hai lượt**. Lượt 1 (11:0x–12:02) chạy khi máy còn tiến trình đo khác và cây
> đang dở Task #202. Lượt 2 (12:10–12:23) máy rảnh, cây đã xanh. **Lấy lượt 2 làm
> chuẩn** — lượt 1 giữ lại vì nó chỉ ra đúng một bài học: đo lúc máy bận thì số sai,
> và sai tới mức đảo cả kết luận (xem `#204.0c`).

| project | file | lượt 1 | **lượt 2 (chuẩn)** |
|---|---|---|---|
| `@mindkid/web` | 103 | 462 s | **273 s** |
| `@mindkid/db` | 112 | 363 s (2 đỏ) | **260 s** |
| `@mindkid/game-engine` | 65 | 92 s | **74 s** |
| `@mindkid/worker` | 10 | 36 s | **51 s** |
| `@mindkid/shared` | 48 | 175 s | **41 s** |
| `@mindkid/auth` | 14 | 44 s | **16 s** |
| `@mindkid/admin` | 11 | 34 s | **13 s** |
| `@mindkid/ui` | 4 | 32 s | **9 s** |
| `@mindkid/notification` | 3 | 8 s | **8 s** |
| `@mindkid/queue` | 6 | 50 s | **7 s** |
| `@mindkid/config` | 4 | 11 s | **7 s** |
| `@mindkid/adaptive` | 3 | 14 s | **5 s** |
| `@mindkid/taxonomy` | 1 | 17 s | **5 s** |
| `@mindkid/emoji` | 2 | 14 s | **5 s** |
| `@mindkid/storage` | 1 | 21 s | **4 s** |
| `@mindkid/moderation` | 1 | 17 s | **4 s** |
| `@mindkid/cache` | 2 | 21 s | **3 s** |
| `scripts` | 1 | 6 s | **3 s** |
| **CỘNG 18 project** | **391** | 1.417 s | **788 s ≈ 13,1 phút** |

- [x] `pnpm lint` — **9,9 s**, 1.598 file
- [x] `pnpm lint:deps` — **10,3 s**, 1.815 module, 0 vi phạm
- [x] `tsc --noEmit -p tsconfig.json` — **73 s** (check 55 s), 1.984 file, 242k dòng TS, **không có `incremental`**
- [x] `apps/web` `vue-tsc -b` — **256 s nguội / 184 s ấm**; 4 project nối đuôi
  - [x] `web:app` 96 s (2.772 file) · `web:server` 32 s · `web:node` 8 s · `web:shared` 6 s
- [x] `apps/admin` **18 s** · `apps/worker` **22 s**
- [x] Lượt 2 **xanh toàn bộ 18/18 project** — hai file `packages/db` đỏ ở lượt 1 (`level-theme-mapping`, `migration-expand`) đã được phiên khác sửa xong trong lúc đo
- [ ] Số `pnpm test` **gộp** chạy hết — vẫn CHƯA CHỐT. Lượt gộp duy nhất thử được dừng ở 36/388 file sau ~15 phút, tức **chậm hơn hẳn** tổng của 18 lượt tách (788 s). Khớp `AGENTS.md` §Test: chạy gộp thì test tích hợp DB tranh dữ liệu
- [ ] `pnpm test:deploy` (`infra/scripts/tests/run.sh`) — chưa đo; > 60 s thì mở task con
- [ ] Chụp danh sách `trạng-thái | tên-test` toàn suite ra `docs/qa/204-baseline-tests.txt`

### `#204.0b` Bằng chứng cho các nguyên nhân — **đo lại lượt 2, máy rảnh**

Tất cả trên `packages/game-engine` (65 file, 1.039 test, 0 file chạm DB); mọi lượt
đều ra 65 file / 1.039 test xanh:

| Cấu hình | Wall clock | so với hiện tại |
|---|---|---|
| `SEQUENTIAL_DEFAULTS` (đang dùng) | 74,0 s | — |
| `forks` + song song | 21,9 s | 3,4× |
| **`threads` + song song + `isolate`** | **16,3 s** | **4,5×** |
| `threads` + song song, `isolate:false` | 9,0 s | 8,2× |

- [x] `pool:"threads"` thắng `forks` — 16,3 s vs 21,9 s
- [x] **Chi phí `globalSetup`, A/B trên cùng `packages/taxonomy` (1 file), 3 lượt:**
      có 4,12 / 4,65 / 4,91 s · không 2,85 / 3,14 / 3,26 s → **~1,5 s**
- [x] **Cache typecheck dùng được cả khi đỏ:** `web:app` với `--incremental --tsBuildInfoFile` → nguội 221 s / ấm 51 s (đo lúc máy bận, tỉ lệ 4,3× mới là thứ đáng tin), buildinfo **772 KB**, **2 lỗi ở cả hai lần**
- [x] `-b` không bao giờ ấm khi project đỏ: `.nuxt/tsconfig.app.tsbuildinfo` chỉ **2,8 KB**
- [x] `tsc 5.9.3` chấp nhận `noEmit` + `incremental` — thử riêng, exit 0, ghi `.tsbuildinfo`
- [x] `vitest 4.1.10` có sẵn `related` và `--changed`
- [x] Đếm file chạm DB: **139/388** (`apps/web` 77/103 · `packages/db` 54/112 · `apps/worker` 6/10 · `packages/shared` 1/48 · `packages/adaptive` 1/3 · **13 workspace còn lại 0/113**)
- [x] **Hai `vitest run` cùng chạm `mindkid_test` ⇒ `PostgresError: deadlock detected`** — tự dính khi chạy đo song song với baseline. Đúng cửa sổ mà `global-setup.ts:246` mô tả

### `#204.0c` Ba con số của lượt 1 đã bị bác bỏ — ghi lại để không ai dùng lại

| Claim lượt 1 | Sự thật lượt 2 |
|---|---|
| `globalSetup` tốn **~11 s** mỗi lần gọi | **~1,5 s**. Số 11 s là hiệu của hai project khác nhau đo lúc cache nguội, không phải A/B |
| `isolate:false` **CHẬM HƠN** (43,9 s) | **NHANH HƠN** (9,0 s vs 16,3 s). Lý do giữ `isolate:true` là **ngữ nghĩa** — bỏ ranh giới module giữa các file test — chứ không phải tốc độ |
| song song nhanh hơn **3,9×** | **4,5×** (74,0 → 16,3 s) |

> Bài học đã trả giá: **cấm — NEVER đo khi còn tiến trình nặng khác trên máy.** Một
> phép đo bẩn ở đây không chỉ sai số, nó đảo cả kết luận và suýt chốt thành comment
> trong `base.ts`.

> **⚠ CÂY ĐANG ĐƯỢC SỬA SONG SONG (2026-09-02)**
>
> Phiên khác đang làm Task #202: **224 file `.ts`** đổi sau 11:00, `git status` **282
> mục**, và trong lúc tôi đo thì `packages/db/src/schema/taxonomy.ts` đổi lúc 12:09:32
> — sau khi baseline `db` kết thúc 12:02:33. Hệ quả đo được: `tsc -p tsconfig.json`
> lúc ~11:26 báo **18 lỗi** `@mindkid/emoji`, lúc 12:05 báo **0 lỗi**.
>
> Số wall-clock vẫn dùng được. Danh sách `trạng-thái | tên-test` thì **không** — chụp
> lại khi Task #202 đóng. Cấm — NEVER lật 12 `vitest.config.ts` (`#204.2`) lúc cây
> còn 282 mục dở.

## Đợt 1 — Tách nhóm test thuần khỏi nhóm DB

### `#204.1` Cờ `database` trong `defineWorkspaceTest` (S) — **XONG 2026-09-02**
- [x] `PARALLEL_DEFAULTS` đứng cạnh `SEQUENTIAL_DEFAULTS` trong `packages/config/vitest/base.ts`
- [x] Comment ghi số đo lượt 2: threads 16,3 s vs forks 21,9 s vs tuần tự 74,0 s. `isolate:false` (9,0 s) NHANH hơn nhưng không bật — lý do là ngữ nghĩa, không phải tốc độ
- [x] `database` mặc định `true` → quên khai thì vẫn tuần tự + có globalSetup (fail-safe)
- [x] `database:false` KHÔNG bỏ trống `DATABASE_URL` mà trỏ vào database **không tồn tại** trên loopback. Bỏ trống thì `requireEnv` nạp `.env` gốc và một test lỡ mở kết nối sẽ ghi vào **database dev** — đúng sự cố 1.117 dòng fixture ngày 2026-08-30
- [x] **Sửa kèm — hai khoá cấu hình CHẾT:** `SEQUENTIAL_DEFAULTS` khai `minWorkers: 1` và `forks: { singleFork: true }`; **vitest 4 đã gỡ cả hai** (`poolOptions`/`forks`/`threads`/`minWorkers` không còn trong `InlineConfig`). Spread object `as const` vào `test:` không kích hoạt excess property check nên TypeScript im lặng. Hệ quả: thứ thật sự ép tuần tự là `fileParallelism:false`, còn `singleFork` — gom mọi file vào MỘT tiến trình — đã hết hiệu lực từ lúc nâng vitest 4, nên mỗi file vẫn dựng lại module registry — đo lượt 2 ở `game-engine`: `Duration 72,75 s (transform 4,99 s, import 25,00 s, tests 12,67 s)`, việc thật chỉ 12,67 s
- [x] **Ca âm 1 ĐÃ ĐO ĐỎ:** lật mặc định `?? true` → `?? false` ⇒ 3 test đỏ ("giữ globalSetup", "giữ chạy tuần tự", "cùng pool và cùng số worker")
- [x] **Ca âm 2 ĐÃ ĐO ĐỎ:** nhét lại `minWorkers` + `forks:{singleFork:true}` ⇒ 1 test đỏ ("SEQUENTIAL_DEFAULTS không còn khoá nào bị vitest 4 bỏ qua")
- [x] `pnpm exec vitest run --project @mindkid/config` — **4 file / 47 test xanh** (7 s ở lượt 2); 3 file cũ giữ nguyên 34 test, không mất bài nào
- [x] `biome check` sạch trên cả hai file
- [x] `tsc -p tsconfig.json` — 0 lỗi ở `base.ts` và `vitest-contract.test.ts`

### `#204.2` Lật 13 workspace không chạm DB (M)
- [ ] `database:false` cho `game-engine · auth · admin · queue · ui · notification · config · cache · taxonomy · storage · moderation · emoji`
- [ ] `VALKEY_QUEUE_PREFIX` đổi `test-${pid}` → `test-${pid}-${VITEST_POOL_ID}` (threads dùng chung pid!)
- [ ] `game-engine` ≤ 20 s (cơ sở 74 s; đã đo được 16,3 s qua chính cờ này)
- [ ] Tổng 13 project ≤ 60 s (cơ sở 156 s ở lượt 2)
- [ ] **Ca âm:** chạy 3 lượt liên tiếp, danh sách test trùng khít — bắt flaky do song song
- [ ] Test flaky lộ ra thì **quarantine** (`BR-TST-07`), cấm — NEVER xoá

> **CHỐT KIỂM A** — `pnpm test` vẫn chạy hết, danh sách `trạng-thái | tên-test` trùng khít Đợt 0.

### `#204.5` Cổng: không file test nào rơi ra ngoài mọi project (S) — **làm TRƯỚC #204.3**
- [ ] `packages/config/tests/vitest-projects.test.ts` quét mọi `*.{test,spec}.{ts,tsx}` dưới `apps/*` + `packages/*` (trừ `fixtures/`)
- [ ] File thuộc 0 project → đỏ · file thuộc ≥2 project → đỏ
- [ ] **Ca âm:** fixture một file test nằm ngoài mọi `include` → cổng đỏ
- [ ] Ghi vào comment: đây là cổng đã bị gỡ 2026-08-29 và `base.ts` tự nhận là đang thiếu

### `#204.3` Tách `apps/web` → `web` + `web:db` (M)
- [ ] Phân loại bằng **grep import**, không bằng thư mục (thư mục chỉ là gợi ý)
- [ ] `103 = |web| + |web:db|`, không chồng lấn, không rơi rớt
- [ ] Nhóm `web` không mở kết nối PG nào — kiểm bằng bỏ `DATABASE_URL` khỏi `test.env` nhóm đó mà vẫn xanh
- [ ] Hợp hai danh sách = baseline `apps/web`

### `#204.4` Tách `packages/db` · `apps/worker` · `packages/shared` · `packages/adaptive` (M)
- [ ] Bốn workspace, mỗi cái `|thuần| + |db| = tổng`
- [ ] `packages/shared` ≤ 20 s (cơ sở 41 s ở lượt 2)
- [ ] Hợp danh sách = baseline từng workspace

> **CHỐT KIỂM B** — tổng `pnpm test` ≤ 6 phút · 3 lượt giống nhau · danh sách trùng khít.
> **Dừng lại, review với người trước khi sang Đợt 2.**

## Đợt 2 — Typecheck: một đường, có cache, song song

### `#204.6` `incremental` cho lưới root (S) — **XONG 2026-09-02**
- [x] `incremental: true` + `tsBuildInfoFile` ở `packages/config/tsconfig.base.json`
- [x] Dùng **`${configDir}`** (TS 5.5+), không phải đường dẫn tương đối trần: đường dẫn trong file `extends` được giải theo vị trí file **base**, nên `"node_modules/.cache/..."` trần sẽ khiến MỌI project chung một buildinfo trong `packages/config/` và đạp lên cache của nhau
- [x] Đo lại máy rảnh: root tsc **11,3 s nguội → 3,2 s ấm** (1.988 file). ⚠ Con số **73 s** ghi ở Đợt 0 là số bẩn — xem `#204.0c`
- [x] Buildinfo rơi vào `node_modules/.cache/typecheck/`, cây nguồn sạch (`git status` không có `.tsbuildinfo`)
- [x] **Ca âm cache (chạy `tsc` thật, không mock):** `scripts/typecheck/incremental-cache.test.ts` — dựng cache trên mã sạch → tiêm lỗi → lượt ấm phải đỏ đúng file, đúng `TS2322`; rồi sửa lại → lượt ấm phải xanh (cache không giữ lỗi cũ)

### `#204.7` Cổng bậc thang: pool 4 tiến trình + incremental (M) — **XONG 2026-09-02**
- [x] `typecheck-gate.ts` đổi `projects.map(reportProject)` (spawnSync tuần tự) → `spawn` async + `mapWithConcurrency` tối đa **4**
- [x] Giới hạn 4 chứ không phải số core: mỗi `vue-tsc` trên project Nuxt ngốn ~1 GB, máy chuẩn 16 GB
- [x] `compilerArgs()` thêm `--incremental --tsBuildInfoFile <cwd>/node_modules/.cache/typecheck/<name>.tsbuildinfo` — **mỗi project một file**, đã kiểm 10 file rời nhau
- [x] `TYPECHECK_PROJECTS` giữ nguyên là nguồn sự thật; `mapWithConcurrency` trả kết quả **theo thứ tự đầu vào** nên báo cáo vẫn deterministic — đã kiểm thứ tự in ra khớp `root worker web:app web:server web:shared web:node admin:app admin:server admin:shared admin:node`
- [x] `main()` thành async ⇒ bọc `.catch` in lỗi + `exit 1`. Gọi trần thì một promise bị từ chối có thể kết thúc mà **không in gì**, và "không in gì" đọc y hệt "xanh"
- [x] **Đo lại (cơ sở thật: tuần tự không cache 62 s, không phải ~330 s tôi ước):** nguội **35 s** · ấm **13–15 s** → **2,4–4,7×**
- [x] **Ca âm 1 ĐÃ ĐO ĐỎ:** tiêm lỗi vào project `root` (tsc), chạy ẤM ⇒ `❌ root 1 lỗi (baseline 0, +1)`, exit 1
- [x] **Ca âm 2 ĐÃ ĐO ĐỎ:** tiêm lỗi vào `apps/web/app/**` (vue-tsc), chạy ẤM ⇒ `❌ web:app 1 lỗi (baseline 0, +1)`, exit 1
- [x] Gỡ lỗi tiêm ⇒ cổng xanh lại, 10/10 project 0 lỗi, exit 0
- [x] Nhánh thiếu `.nuxt/` giữ nguyên (`typecheck-gate.ts`) — cấm — NEVER xanh im lặng
- [x] `scripts/typecheck/typecheck-gate.test.ts` xanh, +7 bài mới cho `compilerArgs` và `mapWithConcurrency` (gồm ca âm "không chạy quá 4 cùng lúc" và "một việc ném thì cả lượt ném")

### `#204.8` Gỡ đường typecheck thứ hai (S) — **XONG 2026-09-02**
- [x] Xoá `scripts/typecheck-parallel.sh`
- [x] Xoá `typecheck:seq` · `typecheck:apps` · `typecheck:root` · `typecheck:gate` khỏi `package.json` gốc
- [x] Xoá script `typecheck` của `apps/web` · `apps/admin` · `apps/worker`
- [x] Còn đúng một: `"typecheck": "node scripts/typecheck/typecheck-gate.ts"`
- [x] **Thêm `typecheck:update`** — cổng in ra "chạy `pnpm typecheck:update`" ở hai nhánh nhưng script đó **chưa từng tồn tại**; lời khuyên trỏ vào hư không
- [x] `check.sh` gọi `pnpm typecheck`
- [x] **Cổng mới `scripts/script-surface.test.ts`** giữ cả hai bất biến: (a) typecheck chỉ có một đường và là cổng bậc thang; (b) `check.sh` giữ đủ **năm** bước của `testing-strategy.md` §8 — thứ đã bị thu hẹp hai lần trong lịch sử repo
- [x] `AGENTS.md` cập nhật: nợ baseline **0/10 project** (số cũ ghi 3.142), thêm mục về pool 4 + incremental và vì sao cấm `vue-tsc -b`

> **CHỐT KIỂM C** — `pnpm typecheck` ấm ≤ 60 s, số lỗi từng project bằng Đợt 0, hai ca âm đỏ đúng chỗ.

## Đợt 3 — Vòng verify

### `#204.9` `check.sh` chồng lấn, báo đủ mọi pha đỏ (S)
- [ ] lint · typecheck · test chạy đồng thời; gom kết quả; báo **mọi** pha đỏ, không chỉ pha đầu
- [ ] Bỏ `--max-workers=1 --no-file-parallelism` ở dòng gọi vitest (bản sao config, và chính nó vô hiệu hoá Đợt 1)
- [ ] Đủ 5 bước theo `testing-strategy.md` §8; `--fast` chỉ bỏ `test:deploy`
- [ ] Tóm tắt cuối: từng pha `✓/✗` kèm số giây
- [ ] **Ca âm chống thu hẹp cổng:** `packages/config/tests/check-script-contract.test.ts` đọc `scripts/check.sh` và đòi đủ 5 lệnh; xoá một lệnh → đỏ (đã xảy ra 2 lần, xem `108-quality-gate-convergence-plan.md`)
- [ ] Tiêm đồng thời lỗi lint + lỗi kiểu → output báo **cả hai**

### `#204.10` `pnpm verify [path...]` (M)
- [ ] `scripts/verify.ts`: biome trên file đã đổi → `typecheck --only <project sở hữu>` → `vitest related <files>`
- [ ] Không tham số → lấy từ `git diff --name-only HEAD` + untracked
- [ ] Sửa 1 file `packages/game-engine` → ≤ 30 s
- [ ] Không file nào đổi → không chạy gì, exit 0, nói rõ lý do
- [ ] In **chính xác** đã chạy gì — cấm — NEVER để người đọc tưởng nó phủ nhiều hơn thực tế
- [ ] **Ca âm:** lỗi kiểu trong file đã sửa → đỏ
- [ ] **Ca âm quan trọng:** lỗi trong file **không** sửa → xanh **kèm cảnh báo** rằng đây là phạm vi hẹp, `pnpm check` mới là cổng

### `#204.11` `lefthook` đúng tầng (S) — **cấm mở trước CHỐT KIỂM B + C**
- [ ] `pre-commit` giữ nguyên (~12 s)
- [ ] `pre-push` mở lại (đang bị comment hết ở `lefthook.yml:60–78` → hiện **không có cổng nào lúc push**): `pnpm services` → `pnpm check`
- [ ] `pre-push` đo được ≤ 8 phút
- [ ] **Ca âm:** file vi phạm lint → `lefthook run pre-commit` chặn
- [ ] **Ca âm:** lỗi kiểu → `lefthook run pre-push` chặn

> **CHỐT KIỂM D** — `verify` < 30 s · `check:fast` < 5 phút · `check` < 8 phút ·
> toàn bộ ca âm Đợt 1–3 đỏ đúng chỗ · danh sách test trùng khít Đợt 0.

## Đợt 4 — Chỉ làm nếu số đo đòi

### `#204.12` Database riêng cho từng worker (L) — **có cổng vào**
- [ ] **Điều kiện khởi động:** sau CHỐT KIỂM B, nhóm `*:db` vẫn > 3 phút. Không thoả → **đóng, không làm**
- [ ] `mindkid_test` thành template; worker dùng `mindkid_test_${VITEST_POOL_ID}` qua `CREATE DATABASE … TEMPLATE`
- [ ] `assertDisposableDatabaseUrl` + kiểm hậu tố `_test` áp cho **mọi** tên sinh ra (`BR-TST-05`)
- [ ] `truncateAllTestTables` chuyển per-worker → gỡ hẳn cửa sổ TRUNCATE-giữa-chừng (`global-setup.ts:246`)
- [ ] Rủi ro: `CREATE DATABASE … TEMPLATE` đòi không còn kết nối nào tới template — cần cổng đo trước

### `#204.13` Spec khớp thực tế (S)
- [ ] `testing-strategy.md` §11 Q1 đóng: điều kiện "P95 > 120 s" đã thoả (số đo 2026-09-02)
- [ ] `testing-strategy.md` §7.1 thêm luật "test chạm DB thì thuộc nhóm `*:db`"
- [ ] `type-safety.md` §8 khớp đường typecheck mới
- [ ] `AGENTS.md` bảng cổng khớp `package.json` thật
- [ ] Mục quyết định `D-…` ghi **số đo**, cấm — NEVER ghi ý kiến

## Việc tách ra khỏi phạm vi task này

- [ ] 6 file test gọi `seed()` (13 call site, 5–24 s mỗi lần) — gieo một lần cho cả nhóm db là đổi **hợp đồng cô lập** của test, không phải đổi cách chạy. Mở task riêng.
