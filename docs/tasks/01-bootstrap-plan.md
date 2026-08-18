# Plan — Bootstrap `mindkid/` (P0 bước 1)

> **Bản 2, viết lại 2026-08-06.** Bản 1 dựa trên assumption chưa đo; ba assumption sai, xem §6.
>
> Contract: `docs/specs/00-foundation/repo-bootstrap.md` §4 (`BR-RBS-01..08`) ·
> [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) (`BR-MPA-01..07`) · [`SPEC.md`](../SPEC.md) §6/§7/§8 ·
> `docs/specs/roadmap.md` P0.
>
> Phạm vi: **chỉ dựng repo + tooling**. Cấm route, không schema, không service
> (`BR-RBS-01`, `BR-RBS-04`).

## 1. Trạng thái đo được (không phải suy đoán)

| Đo | Kết quả | Hệ quả |
|---|---|---|
| `mindkid/` | **chưa tồn tại** | T1 tạo từ đầu |
| 16 spec `00-foundation` | **16/16 `status: draft`**, 0 `approved` | `BR-RBS-04` chặn code nghiệp vụ → task #2, ngoài plan này |
| git ở workspace root | **không phải repo** | quyết định D-A §5 |
| git ở `tinimath/` (v1) | repo, remote `dinhhoabk95/tinimath`, branch `main` | v1 tự quản, không đụng |
| `node -v` shell hiện tại | **v20.17.0** — baseline cần **24** | T0; nvm đã có `v24.15.0` |
| `pnpm -v` | **command not found** — baseline cần **11** | T0 |
| Docker daemon | **không chạy** (`.orbstack/run/docker.sock` không tồn tại) | T0, cần người bật OrbStack |
| `.github/workflows/` ở root | **rỗng** | CI viết mới (T8), không có gì để port |
| `pnpm check` theo [`SPEC.md`](../SPEC.md) §7 | `lint` + **`lint:tokens`** + `typecheck` — không gồm test | T7 phải tồn tại để gate T9 chạy đúng contract |
| `packages/emoji` phụ thuộc `@tinimath/*` | **0 import thật** (7 hit đều là comment header + `tsconfig extends @tinimath/config`) | port sạch, nhưng **sau** T3 |
| `packages/game-engine` phụ thuộc `@tinimath/shared` | **48 import**, toàn bộ `D1xx–D4xxConfig` (60 game type v1) | quyết định D-B §5 |
| `packages/config/src/constants.ts` | 12 dòng: `COOKIE_PREFIXES` (`superadmin: "tinimath_sa"`) + `API_PATHS` | quyết định D-C §5 |
| corpus spec | 135 file (130 module + 5 meta) | khớp [`SPEC.md`](../SPEC.md) §14 |
| `ultracite` ≥ 7.0 | peer/dep = **`oxlint` + `oxfmt`, không phải Biome** (mốc: oxlint từ 7.0.0, oxfmt từ 7.8.0). Bản v1 pin `7.9.4` **đã** là oxlint | [`SPEC.md`](../SPEC.md) §6 "Biome 2 qua ultracite" stale → D-H §5 |
| `ultracite@6.5.1` | major cuối còn thuần Biome: `exports: {"./*": "./config/*/biome.jsonc"}`, có preset `core` (637 dòng) + **`vue`**, 0 dep oxlint | D-H — smoke test đã chạy, xem §5 |
| `typescript` latest | **7.0.2** (major viết lại native); TS 5 mới nhất `5.9.3`. §7.1 **không có dòng TypeScript**; v1 dùng `^5.7.0` | D-I §5 |
| `nuxt` latest | `4.5.2` — khớp baseline `^4.5` | — |
| `@biomejs/biome` latest | `2.5.7` — cùng major `2` với v1 `^2.5.5` | — |
| `vitest` latest | `4.1.10` — khớp [`SPEC.md`](../SPEC.md) §6 "Vitest 4" | — |

## 2. Dependency graph

```
T0 Toolchain + remote  (người làm phần bật OrbStack + tạo repo GitHub)
   │
   ▼
T1 Skeleton workspace + git init trong mindkid/
   │
   ├──▶ T2 Port tooling config → packages/config   (tsconfig + biome, KHÔNG constants)
   │      │
   │      └──▶ T4 Port packages/emoji   (tsconfig extends @mindkid/config)
   │
   ├──▶ T3 Port docs/taxonomy/                      ⟂ độc lập
   ├──▶ T5 Script lint:tokens (viết mới)            ⟂ độc lập
   ├──▶ T6 docker-compose PG17 + Valkey9            ⟂ độc lập
   └──▶ T7 Script gate pnpm check/test wiring       ⟂ độc lập
              │
              ▼
         T8 CI workflow (cần T7 xong để biết lệnh gọi gì)
              │
              ▼
         T9 GATE — 3 điều kiện xanh cùng lúc  CHECKPOINT NGƯỜI DUYỆT
              │
              ▼ [ngoài plan này]
      Task #2: 16 spec 00-foundation draft → approved  thì mở khoá BR-RBS-04
      Task #3 (P1): khảo sát 60 game type → 6 template, rồi port game-engine
```

`T2·T3·T5·T6·T7` chạy song song được sau T1. `T4` chờ `T2`. `T8` chờ `T7`.

## 3. Task

### T0 — Prerequisites (chặn mọi thứ)

| # | Việc | Ai | Verify |
|---|---|---|---|
| a | `nvm use 24` (đã có `v24.15.0`) | agent | `node -v` → `v24.x` |
| b | Cài **pnpm 11** (`corepack enable && corepack prepare pnpm@11 --activate`) | agent | `pnpm -v` → `11.x` |
| c | **Bật OrbStack** (daemon đang chết) | người **người** | `docker info` không lỗi socket |
| d | Tạo repo GitHub cho `mindkid` + lấy remote URL | người **người** (hoặc `gh repo create`, cần xác nhận) | `git ls-remote <url>` trả về |

Lưu ý: (c) và (d) là việc người làm — (d) là hành động **ra ngoài** (tạo repo trên GitHub), cần
bạn xác nhận hoặc tự làm. Không tự chạy `gh repo create` mà chưa hỏi.

**Gate T0:** `node -v` = 24 · `pnpm -v` = 11 · `docker info` sống · remote tồn tại.

---

### T1 — Skeleton workspace + git init

**Làm:**
- `mkdir mindkid/` cạnh `tinimath/`. Cấm xoá/sửa `tinimath/`.
- `git init` **trong `mindkid/`** + `git remote add origin <url từ T0d>` (quyết định D-A).
- `.gitignore`: `node_modules`, `.nuxt`, `.output`, `dist`, `.env*`, `pgdata_*`.
- `package.json` gốc: `name: "@mindkid/monorepo"`, `private: true`, `type: "module"`,
  `engines: { node: ">=24", pnpm: ">=11" }`, scripts theo **[`SPEC.md`](../SPEC.md) §7** (T7 lấp nội dung).
- `pnpm-workspace.yaml`: `packages: [apps/*, packages/*]` + `catalog:` theo
  [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1 (lấy patch/minor mới nhất **cùng major đã chốt** — `BR-RBS-08`,
  không hạ, không nhảy major) + `onlyBuiltDependencies: [sharp]`.
- **3 app**: `apps/{web,admin,worker}/package.json` → `@mindkid/{web,admin,worker}`.
- **12 package** theo [`SPEC.md`](../SPEC.md) §8: `config` `shared` `db` `auth` `cache` `storage` `queue`
  `taxonomy` `emoji` `game-engine` `adaptive` `ui` — mỗi cái `package.json` +
  `src/index.ts` chứa `export {};`.

**Acceptance:**
```gherkin
Scenario: workspace cài sạch
  When chạy `pnpm install` tại mindkid/
  Then exit 0, không lỗi resolve workspace
  And `pnpm ls -r --depth -1` liệt kê 15 workspace project (3 app + 12 package)

Scenario: BR-RBS-02 — không sót scope cũ
  When grep "@tinimath/" trong mindkid/ (trừ node_modules)
  Then 0 kết quả
```
**Verify:**
```bash
cd mindkid && pnpm install && pnpm ls -r --depth -1
grep -rn "@tinimath/" . --exclude-dir=node_modules ; echo "exit=$?"   # mong đợi exit=1
```

**CHECKPOINT 1** — xác nhận skeleton cài sạch trước khi port. Port vào skeleton hỏng làm
lẫn lỗi skeleton với lỗi port.

---

### T2 — Port tooling config → `packages/config`

**Mục tiêu: gần zero-config.** Lint không port config 12.9K của v1 nữa — dùng preset của
`ultracite` (D-H). Config lint rút còn 4 dòng.

| Port | Đích | Ghi chú |
|---|---|---|
| `packages/config/tsconfig.base.json` | `packages/config/tsconfig.base.json` | đổi scope trong `paths` nếu có; rà `target`/`lib` theo TS 5.9 |
| `.dockerignore` | `mindkid/.dockerignore` | |

| Cấm port | Lý do |
|---|---|
| `biome.json` (root, **12.9K**) | Thay bằng 4 dòng `extends` preset ultracite — chính là zero-config (D-H). Rule riêng chỉ thêm **khi** có vi phạm thật, không copy trước |
| `packages/config/biome.base.jsonc` | Cùng lý do — preset `ultracite/core` đã bao |
| `packages/config/src/constants.ts` | `COOKIE_PREFIXES = { superadmin: "tinimath_sa", user: "tinimath_user" }` — bề mặt **auth v1** + actor `superadmin` (v2 dùng `manager`) + prefix `tinimath_`. Auth = 1 trong 6 vùng cấm ([`SPEC.md`](../SPEC.md) §0 D7). `API_PATHS` viết lại khi có spec cần. §7.3 **không** liệt kê `constants.ts` |
| `packages/config/node_modules/` | build artifact |

**Lint stack (D-H, đã smoke test):**
```jsonc
// mindkid/biome.jsonc — toàn bộ config lint
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "root": true,
  "extends": ["ultracite/core", "ultracite/vue"]
}
```
- devDep gốc: `ultracite@~6.5.1` + `@biomejs/biome@^2.5.7`.
- Lưu ý: Preset `core` bật `vcs: { enabled, clientKind: git, useIgnoreFile: true, defaultBranch: "main" }`
  → **bắt buộc** có `.gitignore` + git repo branch `main`, nếu không Biome báo
  `internalError/fs: couldn't find an ignore file`. Đã có ở T1.
- `package.json` → `@mindkid/config`, `exports` giữ `./tsconfig.base.json`, **bỏ**
  `"."`, `"./constants"`, `"./biome.base.jsonc"`.

**Acceptance:**
```gherkin
Scenario: D-H — ultracite thật sự chạy Biome, không oxlint
  When chạy `pnpm exec ultracite --help`
  Then subcommand check mô tả là "Run Biome linter without fixing files"
  And `pnpm ls -r` không có oxlint và không có oxfmt

Scenario: lint xanh trên skeleton
  When chạy `pnpm lint`
  Then exit 0, "No issues found"

Scenario: ca âm — lint thật sự chặn
  Given tạm thêm file .ts vi phạm rule preset
  When chạy `pnpm lint`
  Then exit 1 và in đúng file:line; xoá file tạm → exit 0 lại

Scenario: không mang constants v1
  Then packages/config/src/ không tồn tại
  And grep "tinimath_sa\|superadmin" trong mindkid/ → 0 kết quả
```

---

### T3 — Port `docs/taxonomy/` (độc lập)

`tinimath/tinimath/docs/taxonomy/` (72K) → `mindkid/docs/taxonomy/`. Port **nguyên** — data
registry C1–C6 + 230 skill, không phải code, không có scope để đổi.

**Acceptance:**
```gherkin
Scenario: taxonomy port đủ
  When so số file và tổng dòng giữa nguồn và đích
  Then khớp 100%
  And grep "@tinimath" trong mindkid/docs/taxonomy/ → 0 kết quả
```
**Verify:** `diff -r tinimath/tinimath/docs/taxonomy mindkid/docs/taxonomy` → rỗng.

---

### T4 — Port `packages/emoji` (chờ T2)

Đo trước: **0 import thật** từ `@tinimath/*` — 7 hit đều là comment header (`* @tinimath/emoji
— Search`) + `tsconfig.json` `extends "@tinimath/config/tsconfig.base.json"`. Port sạch.

**Làm:** copy `src/` `tests/` `tsconfig.json` `package.json` → đổi mọi `@tinimath/` →
`@mindkid/` (gồm comment header — `BR-RBS-02` nói "không còn tham chiếu `@tinimath/` nào
trong package đó"). Version `vitest`: v1 pin `^3.2.1` ở emoji nhưng `4.1.5` ở root →
**dùng 4** ([`SPEC.md`](../SPEC.md) §6 chốt Vitest 4), lấy từ `catalog:`.

**Acceptance:**
```gherkin
Scenario: BR-RBS-02 — scope đổi hết
  When đọc packages/emoji/package.json
  Then name là "@mindkid/emoji"
  And grep "@tinimath" trong packages/emoji/ → 0 kết quả

Scenario: test emoji xanh sau port
  When chạy `pnpm --filter @mindkid/emoji test`
  Then toàn bộ test pass
```

---

### T5 — Script `lint:tokens` (viết mới, độc lập)

[`SPEC.md`](../SPEC.md) §7 định nghĩa `pnpm check` = `lint` + **`lint:tokens`** + `typecheck`. `lint:tokens`
= "cấm hex literal ngoài `designTokens.ts`". Ở v1 script này nằm trong
`packages/game-engine/scripts/lint-tokens.ts` — nhưng game-engine **không port ở đợt này**
(D-B). → viết mới tại `mindkid/scripts/lint-tokens.ts` (quyết định D-D).

**Làm:** script quét hex literal (`#rrggbb`/`#rgb`) trong `apps/**` + `packages/**`, allow-list
đúng file `designTokens.ts`, exit 1 nếu vi phạm. Không port bản v1 (nó gắn đường dẫn engine v1).

**Acceptance:**
```gherkin
Scenario: lint:tokens chạy được trên repo rỗng
  When chạy `pnpm lint:tokens`
  Then exit 0 (chưa có hex literal nào)

Scenario: lint:tokens thật sự chặn
  Given tạm thêm một file có literal "#ff0000" ngoài designTokens.ts
  When chạy `pnpm lint:tokens`
  Then exit 1, in đúng file:line
  And xoá file tạm, chạy lại → exit 0
```
Ca thứ hai là bắt buộc — script luôn exit 0 vì repo rỗng là gate hình thức, không phải gate.

---

### T6 — `docker-compose.yml` dev (độc lập)

Port **khung** từ `tinimath/tinimath/docker-compose.yml`, ba thay đổi có chủ đích:
- `valkey/valkey:8-alpine` → **`valkey/valkey:9-alpine`** (v1 ở 8; baseline §7.1 chốt 9).
- `POSTGRES_DB: tinimath` → `mindkid`.
- Bỏ service `rustfs` (S3 local) — chưa có spec nào ở bootstrap cần nó; thêm khi
  [`image-storage.md`](../specs/01-platform/image-storage.md) tới.
- Giữ `postgres:17-alpine` + healthcheck.

**Acceptance (`BR-RBS-07`):**
```gherkin
Scenario: đúng major version production
  When chạy `docker compose up -d` ở mindkid/
  Then service db healthy và báo server_version 17.x
  And service valkey báo valkey_version 9.x
```
**Verify:**
```bash
docker compose up -d
docker compose exec -T db psql -U postgres -tAc "SHOW server_version;"
docker compose exec -T valkey valkey-cli INFO server | grep valkey_version
```

---

### T7 — Wiring script `pnpm check` / `pnpm test` (độc lập)

Lấp `scripts` của `package.json` gốc đúng theo [`SPEC.md`](../SPEC.md) §7 — chỉ những lệnh **chạy được ở
bootstrap**:

| Script | Nội dung | Chạy được ở bootstrap? |
|---|---|---|
| `lint` | `ultracite check .` | |
| `lint:fix` | `ultracite fix .` | |
| `lint:tokens` | `node --experimental-strip-types scripts/lint-tokens.ts` | (T5) |
| `typecheck` | `pnpm -r run typecheck` | (package rỗng → no-op) |
| `check` | `pnpm lint && pnpm lint:tokens && pnpm typecheck` | |
| `test` | `vitest run` | (T4 có test emoji) |
| `format` | `biome format --write .` | |
| `db:*`, `dev*`, `build` | — | Cấm **chưa** — khai sau khi có `packages/db` / app thật. Khai script trỏ vào chỗ trống làm `pnpm check` xanh giả |

**Acceptance:**
```gherkin
Scenario: pnpm check đúng contract SPEC.md §7
  When chạy `pnpm check`
  Then chạy đủ 3 bước lint → lint:tokens → typecheck
  And exit 0
  And không chạy test (test là lệnh riêng)

Scenario: pnpm test chạy thật
  When chạy `pnpm test`
  Then test của @mindkid/emoji chạy và pass
  And không phải "no test files found"
```
Ca thứ hai chặn cái bẫy "CI xanh vì không có test nào".

---

### T8 — CI workflow (chờ T7)

`mindkid/.github/workflows/ci.yml`. Port **khung cú pháp** từ v1 (`concurrency`,
`actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4` + `cache: pnpm`), ba
thay đổi:
- `pnpm/action-setup` version `10` → **`11`**.
- Job = `pnpm install --frozen-lockfile` → `pnpm check` → `pnpm test`.
- Cấm **Bỏ step `pnpm build`** của v1 — chưa có gì để build; step build trên skeleton rỗng là
  xanh giả (quyết định D-E). Thêm lại khi `apps/web` có code.

**Acceptance (`BR-RBS-03`):**
```gherkin
Scenario: CI xanh trên commit bootstrap
  Given mindkid/ chỉ chứa skeleton + asset port (không route/schema/service)
  When push lên remote và CI chạy
  Then job pass: install, check, test
  And log check hiện đủ 3 bước lint / lint:tokens / typecheck
```

---

### T9 — GATE (chờ T2·T3·T4·T5·T6·T7·T8)

Đóng P0 bước 1 khi **cả 3 xanh cùng lúc**, không xanh rời rạc:

| # | Điều kiện | Verify |
|---|---|---|
| 1 | `pnpm check` exit 0 tại chỗ | `cd mindkid && pnpm check; echo $?` |
| 2 | CI xanh trên remote | GitHub Actions run status |
| 3 | `docker compose up -d` đúng version | T6 verify block |

**Quét diff trước khi merge (`BR-RBS-01`):**
```bash
git diff --stat main...HEAD -- 'apps/*/server/api/*' 'packages/db/src/schema/*'   # phải rỗng
grep -rn "@tinimath/" . --exclude-dir=node_modules                                # phải rỗng
```

**CHECKPOINT 2 — quan trọng nhất.** Merge PR bootstrap là hành động khó đảo ngược (mở đường
cho mọi PR sau). Cần bạn duyệt, và xác nhận hiểu rằng **task #2 (đưa 16 spec sang `approved`)
chưa nằm trong PR này** — nên `BR-RBS-04` vẫn đang chặn code nghiệp vụ sau khi merge.

## 4. Không nằm trong plan này

| # | Việc | Vì sao để sau | Nguồn |
|---|---|---|---|
| 1 | **Task #2** — 16 spec `00-foundation` `draft` → `approved` | Là việc đọc-duyệt contract, khác loại hẳn với tooling. **Mở khoá `BR-RBS-04`** | [`roadmap.md`](../specs/roadmap.md) P0 |
| 2 | **Task #3 (P1)** — khảo sát 60 game type v1 → 6 template, rồi port `game-engine` | [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) §11 Q1 **còn mở**: "port được bao nhiêu %? Cần khảo sát trước khi cam kết" | D-B §5 |
| 3 | Audit `packages/ui` (1.2M) khớp [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) tới đâu | [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q1 — cần audit riêng, không đoán | §11 Q1 |
| 4 | Bump PostgreSQL > 17 | Chưa nghiên cứu; giữ 17 đã kiểm chứng ở v1 | §11 Q2 |
| 5 | `packages/payment` / `packages/notification` tách ngay hay inline | Chưa có spec nào ở bootstrap cần | [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) §11 Q3 |
| 6 | Pool size `postgres.js` + `PG max_connections` | Phụ thuộc EC2 instance type chưa chốt | [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q9 |
| 7 | Service `rustfs`/S3 local trong docker-compose | Thêm khi [`image-storage.md`](../specs/01-platform/image-storage.md) tới | T6 |
| 8 | Step `pnpm build` trong CI | Thêm khi có app thật | D-E |

## 5. Quyết định của plan này (18 cái, ghi để truy vết)

| ID | Quyết định | Ai chốt | Đánh đổi |
|---|---|---|---|
| **D-A** | `git init` **chỉ trong `mindkid/`**, remote riêng | người người dùng, 2026-08-06 | Lưu ý: 135 spec ở workspace root **vẫn không được version control** — đổi spec không truy được vết, và [`plan.md`](../tasks/plan.md)/[`todo.md`](../tasks/todo.md) này cũng untracked. Đã nêu; giữ nguyên lựa chọn |
| **D-B** | `packages/game-engine` = **skeleton rỗng** ở bootstrap, port toàn bộ thành task P1 | người người dùng, 2026-08-06 | [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.3 ghi "port nguyên" — **đo được là bất khả thi**: 48 import `D1xx–D4xxConfig` từ `@tinimath/shared` (ngoài danh sách port), v1 `handlers/d1..d6/` 86 file / 60 game type vs v2 `templates/GT-001..006/`. Lưu ý: §7.3 **cần sửa spec** (§7 dưới) |
| **D-C** | Port `packages/config` **chỉ tooling** (tsconfig + biome), không `src/constants.ts` | agent, đo được | `COOKIE_PREFIXES` là bề mặt auth v1 (`superadmin`, prefix `tinimath_`); auth = vùng cấm [`SPEC.md`](../SPEC.md) §0 D7. §7.3 không liệt kê `constants.ts` |
| **D-D** | `lint-tokens.ts` **viết mới** ở `mindkid/scripts/`, không port bản v1 | agent | Bản v1 ở `packages/game-engine/scripts/`, gắn path engine v1 — mà engine không port (D-B). [`SPEC.md`](../SPEC.md) §7 vẫn buộc `lint:tokens` trong `pnpm check` |
| **D-E** | CI = `check` + `test`, **không** step `build` | agent | v1 CI có `pnpm build`; trên skeleton rỗng nó xanh giả. Thêm lại khi có app |
| **D-F** | CI provider = **GitHub Actions** | agent | Đóng [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 **Q5**. Root đã có `.github/`, v1 dùng Actions — không có lý do đổi |
| **D-G** | Valkey **8 → 9** khi port docker-compose | baseline §7.1 | v1 chạy Valkey 8. Bump có chủ đích, không phải port nguyên trạng (`BR-RBS-07`) |
| **D-H** | Lint = `ultracite@~6.5.1` **chỉ làm preset** + `@biomejs/biome@^2.5.7` **chạy CLI**. `biome.jsonc` = 4 dòng `extends`. Script `lint` = `biome check .`, **không** `ultracite check .` | người người dùng, 2026-08-06 ("vẫn dùng ultracite với biome, gần zero-config") + đo được | Hai phát hiện: **(a)** `ultracite ≥7.0` bỏ Biome sang oxlint/oxfmt — kể cả `7.9.4` mà v1 pin; `6.5.1` là major cuối thuần Biome (`exports {"./*": "./config/*/biome.jsonc"}`, preset `core`+`vue`, 0 dep oxlint). **(b)** Lưu ý: **CLI `ultracite check` hỏng với vai trò gate** — báo `Error: Failed to parse Biome output` rồi **exit 0**. Đo trên cùng cây file: `ultracite EXIT=0` vs `biome EXIT=1`, lặp lại y hệt trên Biome **2.5.7 / 2.5.5 / 2.4.0** → không phải lệch version, là lỗi wrapper. Giữ preset (đó là phần zero-config có giá trị), bỏ CLI. **Hệ quả cho v1:** `pnpm check` của v1 gọi `ultracite check .` nên đã **nuốt toàn bộ lỗi lint** từ trước tới nay |
| **D-J** | Sửa 3 chỗ trong code emoji vừa port để qua gate: bỏ 2 non-null assertion (destructuring swap), tách `scoreEntry`/`scoreKeywords` khỏi `searchEmoji` (cognitive complexity 38 → dưới 15) | agent | Preset ultracite chặt hơn `biome.json` 12.9K của v1 nên code v1 không qua. Cấm nới rule để né. Hành vi chứng minh không đổi: **56/56 test pass** trước và sau. `!` vốn thừa — tsconfig không bật `noUncheckedIndexedAccess` |
| **D-K** | `biome.jsonc` override **duy nhất**: tắt `noBarrelFile` cho đúng `packages/*/src/index.ts` | agent | [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) §8 **bắt buộc** "Export chỉ qua `src/index.ts`" — kiến trúc yêu cầu barrel. Override có căn cứ contract, phạm vi hẹp; ngoài file đó rule vẫn bật |
| **D-L** | `tsconfig.base.json`: `noImplicitOverride` `false` → **`true`** | agent | v1 nới để chịu code cũ. Greenfield không có legacy cần lối thoát đó |
| **D-M** | Root `vitest.config.ts` khai `projects: ["apps/*", "packages/*"]` | agent | Không có nó, `pnpm test` ở root báo "no test files found" và **xanh giả** — đúng bẫy T7 ca âm |
| **D-N** | **Thêm T10** — `dependency-cruiser ^18.1.1` + `.dependency-cruiser.cjs` + script `lint:deps`, đưa vào `check` **và** CI | agent | **Lỗ hổng của plan bản 2**: [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) là spec-đầu-tiên thứ hai, §10 yêu cầu "chạy dependency-graph check trong CI mỗi PR", §7.1 pin `dependency-cruiser ^18.1` — plan không có task nào sở hữu. Không có nó, `BR-MPA-01/06/07` chỉ là chữ. Lưu ý: `pnpm check` giờ có **4** bước, [`SPEC.md`](../SPEC.md) §7 ghi 3 → sửa spec (§7 dưới) |
| **D-O** | `.dependency-cruiser.cjs`: `node_modules` đi vào `doNotFollow`, **không** `exclude` | agent, đo được | `exclude` **xoá cạnh khỏi graph** → rule `no-app-direct-base-lib` không bao giờ thấy import `ioredis` và xanh giả. Ca âm phát hiện: 2/3 rule ban đầu vô dụng. Sau sửa cả 3 rule đều bắt đúng |
| **D-P** | `scripts/check-services.ts` + `pnpm check:services`, driver `postgres@^3.4.9` + `ioredis@^5.11.1` ở devDep gốc | agent | [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §4 **bước 5** yêu cầu "verify kết nối được **từ Node**" — `docker compose ps` chỉ nói container sống. Script khẳng định luôn major version (`BR-RBS-07`). Cấm `ioredis@6` dù là latest — §7.1 pin `^5.11` để khớp version BullMQ tự test. Driver để ở gốc vì `packages/db`/`packages/cache` chưa được dựng (`BR-RBS-04`); chuyển vào đó khi dựng thật |
| **D-Q** | CI Actions **tạm tắt** — trigger `push`/`pull_request` comment, chỉ giữ `workflow_dispatch` | người người dùng, 2026-08-06 | Lưu ý: `BR-RBS-03` **mất cưỡng chế tự động**; mọi lần đo về lại thủ công tại chỗ. Rule **vẫn chặn** PR business logic đầu tiên → bật lại là điều kiện tiên quyết, không phải việc tuỳ chọn. Giữ `workflow_dispatch` thay vì comment sạch block `on:` vì workflow không có event nào bị GitHub báo *invalid workflow file* + annotation đỏ — đỏ giả dạy người ta bỏ qua màu. Nội dung job giữ nguyên, bật lại = uncomment 4 dòng. Spec [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q11 |
| **D-R** | `check-services.ts` default port `5432`/`6379` → **`5433`/`6380`** cho khớp `docker-compose.yml` | agent, đo được | Lưu ý: **Xanh giả đã ship**: fix host port trước đó chỉ đổi compose, quên script. `pnpm check:services` không env var thì nối vào `hlo-api-postgres-1`/`hlo-api-valkey-1` (stack khác trên cùng máy dev) và in `Valkey 9.1.0` — khẳng định version của service **không thuộc repo này**; version thật là 9.1.1. Lần verify T6 trước xanh vì truyền `DATABASE_URL`/`VALKEY_PORT` bằng tay, che mất default hỏng. Bài học lặp lại D-O/D-M: **gate nào cũng phải chạy đúng đường mặc định, và phải có ca âm** |
| **D-I** | TypeScript pin **`~5.9.3`**, Cấm chưa lên 7.x | agent | §7.1 **không có** dòng TypeScript (khoảng trống, không phải override contract). TS 7.0.2 là bản viết lại native compiler; Nuxt 4.5.2 không pin TS, `vue-tsc@3.3.9` chỉ khai `>=5.0.0` — *cho phép*, không phải *đã kiểm chứng*. Khớp nguyên tắc "boring tech để ổn định" ([`SPEC.md`](../SPEC.md) §6). Đánh giá TS 7 = task riêng khi có code thật để đo. **Nói rõ để bạn bác nếu muốn** |
| **D-S** | **D-F và D-Q superseded 2026-08-06**: không CI remote nào (không GitHub Actions, không GitLab CI). Gate chuyển hẳn sang **`lefthook ^2.1`** local (`pre-commit` + `pre-push`) | người người dùng, 2026-08-06 | Xoá `.github/workflows/ci.yml` + cả `.github/`. `BR-RBS-03` đo bằng `lefthook run pre-push --force` (thủ công) hoặc `git push` thật (không phải `lefthook run pre-push` trần — thiếu ref stdin, lefthook đọc "0 file cần push" và **skip cả 3 job, exit 0 giả**, đo được). Verify thật: commit `d4860b7`, push `75febf6..d4860b7` — 3 job (check/test/services) chạy qua hook thật, exit 0, PG 17.9 + Valkey 9.1.1 sống. Ca âm cùng lượt: file vi phạm biome → `git commit` exit 1, HEAD không đổi; file hex literal → `lint-tokens` chặn. `pnpm-workspace.yaml` cần `allowBuilds: {lefthook: false}` — không khai thì `pnpm install` trên clone mới exit 1 (`ERR_PNPM_IGNORED_BUILDS`); `onlyBuiltDependencies`/`ignoredBuiltDependencies` đều không tắt được lỗi này (đo trên pnpm 11.16). Rủi ro nhận biết: `git commit --no-verify` bỏ qua được, không gì server-side chặn — chấp nhận đến P1, cần branch protection GitHub trước [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) chạy thật ([`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q12) |

## 6. Bản 1 sai gì (để không lặp lại)

| Bản 1 nói | Thực tế đo được |
|---|---|
| "CI xanh trên remote" là điều kiện gate, không nêu prerequisite | Workspace root **không phải git repo**, **không có remote** → gate không thể chạy. Thiếu hẳn T0 |
| "T2c: port `game-engine` nguyên, đổi scope" | **48 import** `D1xx–D4xxConfig` từ `@tinimath/shared` — package ngoài danh sách port. Port nguyên = bất khả thi |
| Không nhắc `lint:tokens` | `pnpm check` ([`SPEC.md`](../SPEC.md) §7) **gồm** `lint:tokens`; bỏ qua thì gate T9 không đúng contract |
| Không kiểm toolchain local | node **v20.17.0** (cần 24) · pnpm **chưa cài** (cần 11) · Docker daemon **chết** |
| Đọc [`SPEC.md`](../SPEC.md) §7/§13 | Đọc **sai file** — bash cwd dính `cd tinimath/`, đọc SPEC.md của v1 |

## 7. Việc cần sửa spec (không sửa âm thầm trong PR code — `BR-RBS-08`)

| Spec | Sửa gì | Vì sao |
|---|---|---|
| [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.3 | Dòng `packages/game-engine`: "Port nguyên, đổi scope" → **port có điều kiện**, phụ thuộc [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) §11 Q1, ghi rõ 48 import `@tinimath/shared` | Đo được là bất khả thi (D-B) |
| [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.3 | Thêm dòng: `packages/config/src/constants.ts` **không port** | D-C |
| [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 | Đóng **Q5** (CI provider) = GitHub Actions | D-F |
| [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 | Thêm Q mới: chiến lược git — corpus spec ở workspace root không được version control (D-A) | Rủi ro chưa spec nào sở hữu |
| [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1 + [`SPEC.md`](../SPEC.md) §6 | Dòng Lint/format: "Biome qua `ultracite` · giữ nguyên (v1 đã dùng)" → **`ultracite ~6.5.1` làm preset + `@biomejs/biome ^2.5.7` chạy CLI**; ghi chú không nâng ultracite lên `^7` (bỏ Biome) và không dùng CLI `ultracite check` (exit 0 khi có lỗi) | Câu hiện tại **sai sự thật hai lần**: bản v1 pin (`7.9.4`) không chạy Biome, và CLI wrapper nuốt lỗi (D-H) |
| [`SPEC.md`](../SPEC.md) §7 | Dòng `pnpm lint` = `ultracite check .` → **`biome check .`**; `lint:fix` → `biome check --write .` | D-H (b) — lệnh hiện tại không chặn được gì |
| [`SPEC.md`](../SPEC.md) §7 | `check` = "lint + lint:tokens + typecheck" → **thêm `lint:deps`** (4 bước). Thêm dòng `pnpm check:services` | D-N, D-P |
| [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1 | Ghi rõ `ioredis` pin `^5.11` là **có chủ đích**, không nâng `^6` dù npm báo latest | D-P |
| [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1 | **Thêm dòng mới** `TypeScript ~5.9.3` — bảng đang thiếu hẳn | D-I; không pin thì mỗi package tự trôi (`BR-RBS-06`) |
| [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) toàn file | CI → lefthook: owns bullet, actors, entry points, main flow bước 6-7, alternative flows, `BR-RBS-03`+`BR-RBS-03a` mới, port table (không port CI workflow v1), Gherkin, boundaries, §11 (Q5 đóng lần 2, Q11/Q12/Q13 đóng) | D-S |
| [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) · [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) · [[`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md)](../specs/01-platform/content-seed-authoring.md) · [`roadmap.md`](../specs/roadmap.md) · [`index.md`](../specs/index.md) · [`SPEC.md`](../SPEC.md) (4 chỗ) | "8 cổng CI" / "cổng CI" → "8 cổng tự động" / "cổng tự động"; [[`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md)](../specs/01-platform/content-seed-authoring.md) sửa thêm câu "không có cờ bỏ qua" cho đúng thực tế (`--no-verify` tồn tại ở máy cá nhân) | D-S — corpus phải nhất quán, không nói CI khi không còn CI ([`CONVENTIONS.md`](../specs/CONVENTIONS.md) §8) |
| [`error-codes.md`](../specs/00-foundation/error-codes.md) §7.2/§7.3/§7.4/§7.5 | Đăng ký 6 mã đang dùng nhưng chưa có trong registry: `PARENT_GATE_REQUIRED`, `UNKNOWN_ENTITLEMENT_KEY`, `CANNOT_ROLLBACK_TO_CURRENT`, `CODE_ALLOCATION_FAILED`, `VERSION_NOT_FOUND`, `ALREADY_ENROLLED` | Vi phạm [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10 ("Mọi mã lỗi có trong error-codes.md") — phát hiện lúc khảo sát Task #2 |

## 8. Boundaries suốt plan

**Always** — chạy đúng trình tự §2 · đổi scope ngay trong cùng PR port · pin version qua
`engines` + `catalog:` · mỗi acceptance có ca **âm** (chứng minh gate thật sự chặn).

**Ask first** — mở rộng danh sách port ngoài §7.3 · đổi major bất kỳ dòng nào ở §7.1 · thêm
dependency ngoài §7.1 trước khi có spec cần · tạo repo/remote trên GitHub (T0d).

**Never** — copy route/schema/service từ v1 · để hai scope `@tinimath/*` + `@mindkid/*` cùng
tồn tại · merge PR bootstrap khi T9 chưa đủ 3 điều kiện · hạ version dưới §7.1 · khai script
`package.json` trỏ vào chỗ trống để `check` xanh · sửa bảng §7.1/§7.3 âm thầm trong PR code.
