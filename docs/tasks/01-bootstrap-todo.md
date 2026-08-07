# Todo — Bootstrap `kidthink/` (P0 bước 1)

> Bản 2, 2026-08-06. Chi tiết + acceptance + lý do: [`01-bootstrap-plan.md`](01-bootstrap-plan.md).
> Thứ tự: `T0 → T1 → {T2→T4, T3, T5, T6, T7→T8} → T9`.

## T0 — Prerequisites ⛔ chặn mọi thứ
- [x] ~~node 24~~ **xong** — `v24.15.0` có sẵn ở nvm, không cần cài
- [x] ~~pnpm 11~~ **xong** — `11.16.0` có sẵn dưới node 24, không cần corepack
- [x] ~~Chốt stack lint~~ **xong** — `ultracite ~6.5.1` + `@biomejs/biome ^2.5.7`, smoke test pass (D-H)
- [x] 👤 **Người**: bật OrbStack — xong 2026-08-06, `docker info` sống
- [x] 👤 **Người**: tạo repo GitHub `kidthink` + đưa remote URL (hành động ra ngoài — không tự chạy `gh repo create`) — **chặn T8/T9đk2**

> ⚠️ Mọi lệnh phải prefix `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`
> — shell state không persist giữa các lệnh; shell mặc định vẫn là node v20.17.0.

## T1 — Skeleton + git init
- [x] `mkdir kidthink/` cạnh `tinimath/` (❌ không đụng `tinimath/`)
- [x] `git init -b main` trong `kidthink/` + `.gitignore` + `.npmrc` + `.nvmrc`
- [x] `git remote add origin <url>` — **chờ T0d** (chưa có repo GitHub)
- [x] Commit đầu tiên — xong 2026-08-06, người duyệt nội dung → `1b87a08` local trên `main` (chưa có remote để push)
- [x] `package.json` gốc `@kidthink/monorepo`, `engines: node>=24, pnpm>=11`
- [x] `pnpm-workspace.yaml`: `apps/*` `packages/*` + `catalog:` theo §7.1 + `onlyBuiltDependencies: [sharp]`
- [x] 3 app: `web` `admin` `worker`
- [x] 12 package: `config` `shared` `db` `auth` `cache` `storage` `queue` `taxonomy` `emoji` `game-engine` `adaptive` `ui`
- [x] ✅ `pnpm install` exit 0 · `pnpm ls -r --depth -1` = **16** project (root + 3 app + 12 package)
- [x] ✅ `grep -rn "@tinimath/" . --exclude-dir=node_modules` → rỗng
- [x] ⛔ **CHECKPOINT 1** — xác nhận skeleton sạch trước khi port

## T2 — Tooling config → `packages/config` (sau T1) — mục tiêu **zero-config**
- [x] Port `tsconfig.base.json` + `.dockerignore`
- [x] ❌ **KHÔNG** port `biome.json` 12.9K và `biome.base.jsonc` (D-H: preset ultracite thay)
- [x] ❌ **KHÔNG** port `src/constants.ts` (D-C: `COOKIE_PREFIXES` = auth v1, `superadmin`, prefix `tinimath_`)
- [x] `biome.jsonc` gốc = 4 dòng `extends: ["ultracite/core", "ultracite/vue"]`
- [x] devDep gốc: `ultracite@~6.5.1` + `@biomejs/biome@^2.5.7` (❌ không `^7` — đã sang oxlint)
- [x] `typescript@~5.9.3` + `@types/node@^24` vào `catalog:` (D-I; ❌ chưa TS 7)
- [x] `package.json` → `@kidthink/config`, exports chỉ giữ `./tsconfig.base.json`
- [x] ✅ `pnpm exec ultracite --help` → `check` mô tả "Run **Biome** linter"
- [x] ✅ `pnpm ls -r` **không** có `oxlint`, **không** có `oxfmt`
- [x] ✅ `pnpm lint` exit 0, "No issues found"
- [x] ✅ **ca âm**: thêm file .ts vi phạm → exit 1 + `file:line`; xoá → exit 0 lại
- [x] ✅ `grep -rn "tinimath_sa\|superadmin" .` → rỗng

## T3 — Port `docs/taxonomy/` (sau T1, ⟂ song song)
- [x] Copy nguyên `tinimath/tinimath/docs/taxonomy/` → `kidthink/docs/taxonomy/`
- [x] ✅ `diff -r` nguồn/đích → rỗng

## T4 — Port `packages/emoji` (sau T2)
- [x] Copy `src/` `tests/` `tsconfig.json` `package.json`
- [x] Đổi mọi `@tinimath/` → `@kidthink/` **gồm comment header** (7 chỗ)
- [x] `vitest` dùng **v4** từ `catalog:` (v1 pin `^3.2.1` ở package này — lệch `SPEC.md` §6)
- [x] ✅ `name` = `@kidthink/emoji` · grep `@tinimath` → rỗng
- [x] ✅ `pnpm --filter @kidthink/emoji test` pass

## T5 — Script `lint:tokens` viết mới (sau T1, ⟂ song song)
- [x] Viết `kidthink/scripts/lint-tokens.ts` (❌ không port bản v1 — gắn path engine v1, mà engine không port)
- [x] Quét hex literal `#rgb`/`#rrggbb` trong `apps/**` + `packages/**`, allow `designTokens.ts`
- [x] ✅ ca dương: `pnpm lint:tokens` exit 0 trên repo rỗng
- [x] ✅ **ca âm**: thêm file tạm có `#ff0000` → exit 1 + in `file:line`; xoá → exit 0 lại

## T6 — docker-compose PG17 + Valkey9 (sau T1, ⟂ song song)
- [x] Port khung từ v1
- [x] **Bump `valkey:8-alpine` → `valkey:9-alpine`** (D-G, có chủ đích)
- [x] `POSTGRES_DB: tinimath` → `kidthink`
- [x] Bỏ service `rustfs` (chưa spec nào cần)
- [x] ✅ `docker compose up -d` → cả hai **healthy**
- [x] ✅ PostgreSQL **17.9**
- [x] ✅ Valkey **9.1.1**
- [x] ✅ **§4 bước 5** — `pnpm check:services` nối được **từ Node**, khẳng định major version (D-P)
- [x] 🐛 **Fix 2026-08-06**: host port `5432`/`6379` xung đột với stack khác (`hlo-api`) đã chiếm trên máy dev → đổi host port sang `5433`/`6380` (container bên trong giữ nguyên `5432`/`6379`, không đụng contract). Verify lại: `check:services` PG 17.9 + Valkey 9.1.1 qua port mới
- [x] 🐛 **Fix 2026-08-06 (thứ hai) — XANH GIẢ**: fix trên chỉ đổi `docker-compose.yml`, **quên `scripts/check-services.ts`** — default vẫn `5432`/`6379`, tức `pnpm check:services` không env var thì nối vào `hlo-api-postgres-1`/`hlo-api-valkey-1` và in `✅ Valkey 9.1.0` — **khẳng định version của service không thuộc repo này**. Lần verify trước xanh vì truyền `DATABASE_URL`/`VALKEY_PORT` bằng tay. Sửa default → `5433`/`6380` (commit `1def069`)
  - [x] ✅ ca dương: `pnpm check:services` **không** env var → PG **17.9** + Valkey **9.1.1**, exit 0
  - [x] ✅ ca âm: port chết `5499`/`6499` → exit 1
  - [x] ⚠️ Còn nợ nhỏ: nhánh lỗi PG in `❌ PostgreSQL: ` **rỗng** (mất `.message` của lỗi ECONNREFUSED). Không gây xanh giả (vẫn exit 1) — theo dõi riêng

## T10 — `dependency-cruiser` (mới; D-N — plan bản 2 thiếu)
- [x] `dependency-cruiser@^18.1.1` + `.dependency-cruiser.cjs` + script `lint:deps`
- [x] Rule `no-packages-to-apps` (`BR-MPA-06`)
- [x] Rule `no-app-to-app` (`BR-MPA-07`)
- [x] Rule `no-app-direct-base-lib` — ioredis/iovalkey/bullmq/nuxt-auth-utils/unstorage (`BR-MPA-01`)
- [x] Rule `no-circular`
- [x] ✅ ca dương: 50 module, 0 vi phạm
- [x] ✅ **ca âm × 3**: cả 3 rule đều bắt đúng `from → to`
- [x] ⚠️ Sửa D-O: `node_modules` phải ở `doNotFollow`, **không** `exclude` — `exclude` xoá cạnh làm 2/3 rule xanh giả

## T7 — Wiring script `package.json` (sau T1, ⟂ song song)
- [x] `lint` `lint:fix` `lint:tokens` `typecheck` `check` `test` `format` theo `SPEC.md` §7
- [x] ⚠️ `lint` = **`biome check .`**, ❌ không `ultracite check .` — wrapper exit 0 khi có lỗi (D-H b, đo trên Biome 2.5.7/2.5.5/2.4.0)
- [x] ❌ **Chưa** khai `db:*` / `dev*` / `build` (trỏ vào chỗ trống = xanh giả)
- [x] ✅ `pnpm check` chạy đủ 3 bước lint → lint:tokens → typecheck, exit 0
- [x] ✅ `pnpm check` **không** chạy test (contract §7)
- [x] ✅ **ca âm**: `pnpm test` chạy test emoji thật, ❌ không phải "no test files found"

## T8 — CI workflow (sau T7) — **SUPERSEDED 2026-08-06, xem T8b**
- [x] `kidthink/.github/workflows/ci.yml` — port khung cú pháp từ v1
- [x] `pnpm/action-setup` version `10` → **`11`**
- [x] Job: `install --frozen-lockfile` → `check` → `check:services` → `test`
- [x] `services:` PG 17-alpine + Valkey 9-alpine (SPEC.md §10 cấm mock DB)
- [x] ❌ **Bỏ step `pnpm build`** của v1 (D-E: skeleton rỗng → xanh giả)
- [x] ✅ Mọi lệnh CI gọi đều **đã chạy xanh tại chỗ**
- [x] ~~⏸ CI chạy thật trên remote~~ — không còn áp dụng. Quyết định người dùng 2026-08-06
  (lần 2, sau lần tạm tắt): **bỏ hẳn CI remote**, xoá `.github/workflows/ci.yml` + `.github/`.
  Xem T8b

## T8b — lefthook thay CI (mới, D-S)
- [x] Xoá `.github/workflows/ci.yml` + `.github/` — không dùng CI remote (GitHub Actions,
  GitLab CI, Jenkins đều không)
- [x] `lefthook@^2.1.10` devDep + `lefthook.yml`: `pre-commit` (biome file staged +
  `lint:tokens` toàn repo) · `pre-push` (`check` + `test` + `check:services`)
- [x] `package.json` script `prepare: "lefthook install"` — tự cài hook khi `pnpm install`,
  không dựa người clone tự nhớ (`BR-RBS-03a`)
- [x] `pnpm-workspace.yaml`: `allowBuilds: {lefthook: false}` — binary tới từ
  `optionalDependencies` theo platform, không cần postinstall build. ⚠️ Không khai thì
  `pnpm install` trên **clone mới** exit 1 (`ERR_PNPM_IGNORED_BUILDS`) — đã đo
  `onlyBuiltDependencies`/`ignoredBuiltDependencies` **đều không** tắt được lỗi này (pnpm 11.16)
- [x] ✅ Ca âm (đo lượt trước): file vi phạm biome → `git commit` exit 1, HEAD không đổi;
  file hex literal → `lint-tokens` chặn
- [x] ✅ Ca dương thật: **`git push` thật** (không phải `lefthook run pre-push` trần — thiếu
  ref stdin, lefthook skip cả 3 job và exit 0 giả, đo được) → 3 job chạy qua hook thật, exit 0,
  PG 17.9 + Valkey 9.1.1 sống, push `75febf6..d4860b7` thành công lên `origin/main`, commit
  `d4860b7`
- [x] Sửa 7 file corpus còn viết "cổng CI"/"CI xanh" → "cổng tự động": `mvp-scope.md` ·
  `content-lifecycle.md` · `content-seed-authoring.md` (2 chỗ) · `roadmap.md` · `index.md` ·
  `SPEC.md` (4 chỗ)
- [ ] ⏸ Rủi ro nhận biết, chưa xử lý: `git commit --no-verify` bỏ qua được, không gì
  server-side chặn lại — **chấp nhận đến P1** (quyết định người dùng). Trước
  `content-seed-authoring` chạy thật phải quyết định branch protection GitHub (required PR
  review). `repo-bootstrap.md` §11 Q12

## T9 — GATE ⛔ (sau T2·T3·T4·T5·T6·T7·T8·T8b·T10 — 3 điều kiện xanh **cùng lúc**)
- [x] ✅ `pnpm check` exit 0 local (4 bước: lint · lint:tokens · lint:deps · typecheck)
- [x] ✅ `pnpm test` exit 0 — 56/56
- [x] ✅ **Đk2 đổi nghĩa (D-S — không còn CI remote)**: `lefthook pre-push` xanh qua **`git push`
  thật** (không phải `lefthook run pre-push` trần — xem T8b) — 3 job pass, push
  `75febf6..d4860b7`, commit `d4860b7`. Ca âm cùng lượt: biome + hex-token đều chặn đúng
- [x] ✅ `docker compose up -d` đúng version — PG **17.9** + Valkey **9.1.1**, cả hai healthy (host port 5433/6380 sau fix xung đột)
- [x] ✅ Quét diff: `apps/*/server/api/*` và `packages/db/src/schema/*` **rỗng** (`BR-RBS-01`)
- [x] ✅ `grep -rn "@tinimath/"` → rỗng (`BR-RBS-02`)
- [x] ✅ Commit đầu tiên trên `main` (local) — `1b87a08`, người đã duyệt nội dung
- [x] ✅ **Push lên GitHub — xong 2026-08-06**: `git push -u origin main` → `refs/heads/main` = `75febf6`, `main` tracking `origin/main`, không ahead. Quét trước publish: `.env*` đã gitignore, `git grep` pattern secret trên 90 file tracked → 0 match, secret duy nhất là `POSTGRES_PASSWORD: postgres` (mặc định dev)
- [x] ✅ **CHECKPOINT 2 — 3/3 điều kiện xanh, đo thật** (đk2 đổi nghĩa theo D-S, không còn hoãn)
  - ✅ đk1 `pnpm check` exit 0 · ✅ đk2 lefthook `pre-push` xanh qua `git push` thật · ✅ đk3 docker đúng version
  - `BR-RBS-03` **thoả** — gate local đo được, ca âm chặn đúng. Không còn "bật lại CI" — không có CI để bật
  - `BR-RBS-04` **vẫn chặn** — **130/130** spec còn `draft`, gồm 16 spec `00-foundation` (task #2, ngoài phạm vi lượt này)

## Sửa spec (❌ không âm thầm trong PR code — `BR-RBS-08`) — xong 2026-08-06
- [x] `repo-bootstrap.md` §7.3: `game-engine` "port nguyên" → **port có điều kiện** (48 import `@tinimath/shared`, phụ thuộc `game-template-contract` §11 Q1)
- [x] `repo-bootstrap.md` §7.3: thêm `packages/config/src/constants.ts` ❌ không port
- [x] `repo-bootstrap.md` §11: đóng **Q5** = GitHub Actions — **superseded 2026-08-06 (lần 2, D-S)**: không CI remote nào, lefthook local. Xem T8b
- [x] `repo-bootstrap.md` §11: thêm Q10 về chiến lược git (corpus spec root untracked — D-A)
- [x] `repo-bootstrap.md` §7.1: dòng Lint/format → `ultracite ~6.5.1` preset only + `biome ^2.5.7` CLI thật, ghi rõ ❌ không `^7` và ❌ không CLI `ultracite check`
- [x] `repo-bootstrap.md` §7.1: ghi rõ `ioredis` pin `^5.11` có chủ đích, ❌ không nâng `^6`
- [x] `repo-bootstrap.md` §7.1: thêm dòng `TypeScript ~5.9.3` (bảng thiếu hẳn)
- [x] `SPEC.md` §6: dòng Lint/format khớp `repo-bootstrap.md` §7.1
- [x] `SPEC.md` §7: `pnpm lint`/`lint:fix` → `biome check .` / `biome check --write .`; `check` thêm `lint:deps`; thêm dòng `pnpm check:services`

## Ngoài plan này (theo dõi riêng)
- [x] ~~⛔ Bật lại CI + xanh remote~~ — **không còn áp dụng 2026-08-06**: không có CI để bật lại (D-S, T8b). `BR-RBS-03` đã thoả bằng lefthook + `git push` thật, xem T9
- [ ] ⛔ **Quyết định branch protection GitHub trước `content-seed-authoring` (P1)** — lefthook bỏ qua được bằng `--no-verify`, không gì server-side chặn. Chấp nhận đến P1 (quyết định người dùng), nhưng phải quyết định thật (required PR review) trước khi seeder nội dung nền chạy. `repo-bootstrap.md` §11 Q12
- [ ] **Task #2** — 16 spec `00-foundation` `draft` → `approved` ⇒ mở khoá `BR-RBS-04`
  - Đã đo trước 2026-08-06: corpus sạch cơ học (130/130 đủ 9 field frontmatter · 0/267 `owns` trùng · 0/167 link vỡ · 11 section đúng, 6 spec `07-addon` = 7 section theo `CONVENTIONS.md` §4 cho phép)
  - ❌ **1 vi phạm `CONVENTIONS.md` §10 phải sửa**: `PARENT_GATE_REQUIRED` dùng ở `03-account/child-profile-switching.md:81` + `04-play/play-entry-and-profile-select.md:102` mà **không** có trong `00-foundation/error-codes.md`
  - **51 open question** trong 16 spec foundation (`repo-bootstrap` 11 · `mvp-scope`/`payment-flow`/`package-catalog`/`child-data-compliance` 4 mỗi cái) — cần chốt bar approve: OQ nào phải đóng trước `approved`
- [ ] Nhánh lỗi PG trong `check-services.ts` in message rỗng (mất `.message` ECONNREFUSED)
- [ ] **Task #3 (P1)** — khảo sát 60 game type v1 → 6 template, rồi port `game-engine` (§11 Q1)
- [ ] Audit `packages/ui` (1.2M) vs `design-system-contract.md`
- [ ] Cân nhắc bump PostgreSQL > 17 (§11 Q2)
- [ ] `packages/payment` / `packages/notification`: tách ngay hay inline (`monorepo-package-architecture` §11 Q3)
- [ ] Pool size `postgres.js` + `PG max_connections` (§11 Q9 — chờ EC2 instance type)
- [ ] Thêm lại service S3 local vào docker-compose khi `image-storage` tới
- [ ] Thêm lại step `pnpm build` vào CI khi có app thật
