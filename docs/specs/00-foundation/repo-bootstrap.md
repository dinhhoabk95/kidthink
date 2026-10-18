---
spec: REPO-BOOTSTRAP
title: Dependency baseline và gate local
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-10-18
owns:
  - Cấu trúc gốc workspace `mindkid/` và trình tự dựng repo
  - Dependency/tech baseline (version tối thiểu từng lớp)
  - Gate chất lượng local (git hook `lefthook`) và cách nó tự cài
depends_on: []
---

# Dependency baseline và gate local

## 1. Objective

File này sở hữu ba thứ mà mọi spec khác giả định đã có: workspace pnpm để đặt code vào, bảng
dependency baseline (§7.1) chốt version từng lớp, và gate local `lefthook` chặn commit/push
vi phạm. Nó là spec P0 thực thi đầu tiên, trước cả [`glossary.md`](glossary.md) và
[`id-conventions.md`](id-conventions.md).

Nguyên tắc nền: route, schema, service viết theo spec sở hữu, không chuyển nguyên khối từ
nguồn ngoài (quyết định D9, mục 0 của [`SPEC.md`](../../SPEC.md)); thư viện nền ưu tiên adopt
hệ sinh thái Nuxt đã kiểm chứng thay vì tự viết (quyết định D10, cùng mục).

## 2. Actors

| Actor | Vai trò |
|---|---|
| Dev (người hoặc AI agent IDE) | Cài dependency, chạy gate local, sửa bảng §7.1 qua Specify |
| Reviewer | Duyệt PR đổi bảng §7.1 hoặc đổi `lefthook.yml` |
| lefthook (git hook local) | `pre-commit`: `format` (Biome `--write` trên file staged) → `lint-and-deps` (`pnpm lint` + `pnpm lint:deps`) → `engine-gates` (chỉ khi commit chạm cây engine/nội dung). `pre-push`: `pnpm check:fast` |

## 3. Entry points

| Nơi | |
|---|---|
| `package.json`, `pnpm-workspace.yaml` | Gốc workspace: `engines`, `catalog:`, `overrides:`, `allowBuilds:` |
| `apps/*`, `packages/*` | App và package dùng chung (cây đầy đủ ở §8 của [`SPEC.md`](../../SPEC.md)) |
| `lefthook.yml` + `.git/hooks/pre-commit`·`pre-push` | Gate local. Không có cổng remote |
| `scripts/check.sh` | Pipeline `pnpm check` (đầy đủ) và `pnpm check:fast` |
| `docker-compose.yml` | PostgreSQL 17 (`pgvector/pgvector:pg17`) + Valkey 9 cho dev local |
| `scripts/check-services.ts` | `pnpm services`: kiểm PG + Valkey đang chạy đúng major |

## 4. Main flow — dựng và giữ workspace

1. `pnpm-workspace.yaml` khai `apps/*`, `packages/*` và `catalog:` cho dependency dùng chung
   (§7.1); `package.json` gốc khoá `engines.node >=24`, `engines.pnpm >=11`.
2. Mỗi package con khai dependency bằng `catalog:`, không phiên bản rời (`BR-RBS-06`).
3. Cài dependency theo §7.1 vào package/app cần nó — **không** cài bản thấp hơn bảng, và chỉ
   thêm vào `catalog:` khi có package dùng tới.
4. `pnpm install` chạy `prepare: lefthook install`, ghi `.git/hooks/*` tự động (`BR-RBS-03a`).
5. `docker compose up -d` chạy PostgreSQL 17 + Valkey 9; `pnpm services` xác nhận kết nối được
   và đúng major trước khi chạy test cần DB (`BR-RBS-07`).
6. Gate local theo `lefthook.yml`:
   - `pre-commit`, chạy tuần tự:
     1. `format`: `biome check --write` chỉ trên `{staged_files}`, `stage_fixed: true` stage
        lại bản đã định dạng.
     2. `lint-and-deps`: `pnpm lint` (`biome check .` trên toàn cây) và `pnpm lint:deps`
        (dependency-cruiser) chạy song song; một trong hai đỏ là commit đỏ.
     3. `engine-gates`: chỉ chạy khi commit chạm `docs/specs/01-platform/engines/**`,
        `docs/specs/05-content/**`, `packages/game-engine/{src,config}/**`,
        `packages/content/src/**` hoặc `packages/content-build/src/**`. Chạy song song tám
        cổng engine (`check:engine-specs`, `check:render`, `check:engine-depth`,
        `check:engine-turn`, `check:engine-behavior`, `check:difficulty-ladder`,
        `check:hardcoded-params`, `check:engine-seed-matrix`).
   - `pre-push`: `pnpm check:fast` = `scripts/check.sh --fast` — Phase 1 lint và các cổng
     `check:*`, Phase 2 `pnpm typecheck`, Phase 3 vitest **chỉ** project
     `@mindkid/game-engine`.
   - Điểm mù có chủ đích: test tích hợp cần DB và `check:test-ratchet` chỉ chạy ở
     `pnpm check` đầy đủ (Phase 3 đỏ nếu `pnpm services` lỗi). `pnpm test:deploy` (Phase 4)
     không nằm trong `check`, chạy tay khi phát hành.
7. Gate ra của một thay đổi: `pnpm check` xanh tại máy (đã bật PG + Valkey), hook
   `pre-commit`/`pre-push` xanh **và** ca âm chặn đúng (`BR-RBS-03`).

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Dependency ở §7.1 có bản vá bảo mật mới hơn version chốt | Trước khi cài | Lấy bản vá mới nhất trong cùng major/minor đã chốt, không tự ý nhảy major |
| Thư viện ở §7.1 ngừng bảo trì | Phát hiện lúc cài hoặc rà | Dừng, quay lại Specify — sửa bảng §7.1 trước, không âm thầm đổi trong PR code (`BR-RBS-08`) |
| Gate local đỏ mà cần commit/push gấp | Áp lực lịch trình | Không dùng `--no-verify`. Sửa lỗi, hoặc `git stash` phần chưa xong — xem Boundaries |
| Người clone repo mới nhưng `.git/hooks/` rỗng | Chưa chạy `pnpm install` | Hook **không tồn tại** và git im lặng. `pnpm install` kéo `lefthook install` theo (`prepare` script) — đây là điểm hỏng mặc định của mọi gate local |
| `pnpm services` exit 1 khi chạy `pnpm check` | PG/Valkey chưa bật | `check.sh` **đỏ**, in hướng dẫn `docker compose up -d`; không tự hạ xuống tập con `--fast` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RBS-01` | **Ngưng — 2026-10-18.** Rule về giới hạn tài sản được chuyển vào repo lúc khởi tạo; giai đoạn đó đã xong. Nguyên tắc còn hiệu lực nằm ở D9 của [`SPEC.md`](../../SPEC.md). Không tái dùng số (`BR-REG2-02`) | Hết đối tượng |
| `BR-RBS-02` | Mọi workspace package (`package.json` gốc, `apps/*`, `packages/*`) mang scope `@mindkid/*`; không scope nào khác cùng tồn tại | Hai scope trộn lẫn làm import path không nhất quán và dễ import nhầm. Test `packages/shared/tests/foundation-contracts.test.ts` trích mã này |
| `BR-RBS-03` | Gate local `lefthook` (§4 bước 6: `pre-commit` = format + lint + lint:deps + engine-gates; `pre-push` = `check:fast`) phải xanh **và** chặn đúng ở ca âm. Thêm hoặc bớt job trong `lefthook.yml` là đổi spec này | Gate exit 0 khi có lỗi là chuyện **đã xảy ra** ở project này (`ultracite check`, `check:services`, và cổng typecheck khi trình biên dịch bị OOM kill). Gate không có ca âm đã đo là gate chưa tồn tại |
| `BR-RBS-03a` | `lefthook install` phải chạy tự động qua `prepare` script của `package.json` — không dựa vào người mới clone tự nhớ | Hook chỉ tồn tại trong `.git/hooks/` (không được commit). Người clone mà không cài hook thì gate im lặng biến mất, và git không báo gì |
| `BR-RBS-04` | **Ngưng — 2026-10-18.** Rule chặn code nghiệp vụ trước khi foundation được duyệt; giai đoạn đó đã qua. Nguyên tắc "contract trước implementation" vẫn ở [`roadmap.md`](../roadmap.md). Không tái dùng số (`BR-REG2-02`) | Hết đối tượng |
| `BR-RBS-05` | Dependency ở §7.1 **ưu tiên adopt** thư viện phổ biến; chỉ tự viết khi không có thư viện phù hợp hoặc cần bọc dùng chung nhiều app (driver) | Mục 0, quyết định D10 của [`SPEC.md`](../../SPEC.md) |
| `BR-RBS-06` | Version pin ở `engines` (root) + pnpm `catalog:` — package con **không tự ý** khai version khác catalog | Version rải rác từng package là nguồn drift kinh điển trong monorepo |
| `BR-RBS-07` | `docker-compose.yml` dev phải chạy **đúng major version** production (PG 17, Valkey 9) | Test trên version khác production là kiểm tra sai thứ |
| `BR-RBS-08` | Đổi bảng §7.1 (thêm/gỡ thư viện nền, đổi major version) là đổi spec — **không** sửa âm thầm trong PR cài dependency | Bảng này là contract; sửa không qua Specify làm mất lý do quyết định |
| `BR-RBS-09` | Thư viện nào bị **hai** phụ thuộc kéo về hai version phải chốt về một bản bằng `overrides` trong `pnpm-workspace.yaml`, kèm lý do | Hai bản cùng tồn tại là hai instance runtime. Đo 2026-08-29: nuxt 4.5.2 khai `unhead ^3.3.1`, `@nuxt/ui` 4.11 khai `@unhead/vue ^3.3.2`, lockfile chốt cả 3.3.1 lẫn 3.4.0 |
| `BR-RBS-10` | Cổng dev của từng app pin bằng **cờ CLI** trong `dev` script, không để rơi vào biến `PORT` | `PORT=3000` ở `.env` gốc được `require-env` nạp cho mọi tiến trình, nên `pnpm dev:all` cho web và admin tranh nhau 3000 — ai khởi động trước thắng, và `NUXT_PUBLIC_API_BASE_URL=http://localhost:3000` có lúc trỏ ngược vào chính admin |

## 7. Data

### 7.1 Dependency/tech baseline — chốt 2026-08-05, rà lại 2026-08-13

`iovalkey` không nằm trong baseline: BullMQ tự dựng client `ioredis` nội bộ khi nhận config
dạng object thường, và driver `redis` của `unstorage` hardcode `ioredis`. Cả hai điểm chạm Valkey
đều đi qua `ioredis` — dùng thẳng, không thêm phụ thuộc thứ hai.

| Lớp | Chọn | Version tối thiểu | Ghi chú |
|---|---|---|---|
| Runtime | Node | 24 (LTS, hỗ trợ tới 04/2028) | Không dùng Node 20 (EOL 03/2026), chưa pin Node 26 (chưa LTS) |
| Package manager | pnpm | 11 | Bật `catalog:`; SQLite store index; supply-chain cooldown 1 ngày mặc định |
| Web framework | Nuxt | `^4.5` | Nuxt 3 EOL 31/07/2026. Nuxt 5 chưa phát hành tại thời điểm chốt |
| DB | PostgreSQL | 17 | Chưa có lý do kỹ thuật để bump, xem §11 Q2 |
| ORM | Drizzle | `^0.45` (drizzle-kit `^0.31`, lockstep) | Driver `postgres.js`, singleton `postgres()`+`drizzle()` **một lần mỗi tiến trình PM2** (không tạo client mỗi request — đó là anti-pattern của serverless, không áp dụng ở đây). `prepare: true` (mặc định) — chỉ tắt nếu sau này có pooler transaction-mode (PgBouncer/RDS Proxy) đứng trước |
| Valkey server | Valkey | 9 (9.1) | Linux Foundation, tương thích Redis protocol ~90% (không còn 1:1) |
| Valkey client (Node) | **`ioredis`** `^5.11` | — | Không dùng `iovalkey` (xem ghi chú ở trên) — pin khớp version BullMQ tự test (`5.11.1`). Pin `^5.11` **có chủ đích**, không nâng `^6` dù npm báo đó là bản mới nhất. `iovalkey ^0.4` chỉ dùng **nếu sau này** có code tự viết gọi Valkey trực tiếp ngoài BullMQ/unstorage (hiện chưa có) |
| Ngôn ngữ | TypeScript | `~5.9.3` | Không pin theo `latest` npm (`7.0.2` là bản viết lại native compiler) — Nuxt 4.5.2 không pin TS, `vue-tsc@3.3.9` chỉ khai `>=5.0.0` (*cho phép*, không phải *đã kiểm chứng*). Giữ major 5, boring tech (mục 6 của [`SPEC.md`](../../SPEC.md)). Đánh giá TS 7 là task riêng khi có code thật để đo |
| Cache abstraction | `unstorage` | `^1.17` | Driver `redis` built-in, trỏ thẳng `host`/`port` Valkey — không cần workaround, không cần driver tự viết |
| Rate limit | `rate-limiter-flexible` | `^11.2` | Chỉ dùng trong `packages/cache`, trên singleton `ioredis`; `unstorage` chỉ làm cache. Giữ hai trục, `Retry-After`, trusted-proxy và fail-open/closed của [`rate-limiting.md`](../01-platform/rate-limiting.md), không bật limiter của `nuxt-security` |
| Queue | BullMQ | `^6.0` | `connection: {host, port, password}` — object thường, BullMQ tự dựng `ioredis` nội bộ (tự set `maxRetriesPerRequest: null` cho Worker). Không dùng `createValkeyGlideClient` (đó là path cho HA/cluster kiểu AWS, không cần ở self-host Docker) |
| Queue — Nuxt wrapper | Không dùng `nuxt-simple-bullmq` | — | Solo-maintainer, README tự nhận chỉ test Node 21, tác giả khuyên dùng lựa chọn khác cho production. Nối BullMQ trực tiếp qua Nitro plugin trong `apps/worker` |
| Auth — trạng thái Nuxt của web | `nuxt-auth-utils` | `^0.5.30` | **Chỉ dùng trong `apps/web`**. Module seal opaque locator và cung cấp projection/`useUserSession`; identity/role/reauth/remember nằm trong Redis. Admin SPA chỉ gọi API tuyệt đối với `credentials: "include"`. Cookie session host-only, tuyệt đối 1 giờ; remember tuỳ chọn, tuyệt đối tối đa 365 ngày. Pin tối thiểu `0.5.30`; không dùng OAuth/password/WebAuthn helper, AuthJS hoặc `next-auth` |
| Auth — Redis session authority | `ioredis` trong `packages/auth` | `^5.11` | Client process-long riêng, fail-closed; Lua/transaction nguyên tử cho rotate/revoke; production AOF + `noeviction`. Không đi qua cache API fail-open, không file/memory/DB fallback |
| Auth — OAuth/OIDC backend bridge | `openid-client` | `^6.8` | `packages/auth/src/oauth/` dùng cho discovery, PKCE, authorization URL, code exchange và token validation. Không dùng `defineOAuth*EventHandler` của `nuxt-auth-utils`, không đổi sang AuthJS và không tự viết protocol primitive |
| Auth — TOTP (Manager bắt buộc, User P2 tuỳ chọn) | `otpauth` | `^9.5` | Dùng cho sinh secret, URI và validate RFC 4226/6238; cấm dùng password helper của `nuxt-auth-utils`, tự viết HMAC/Base32/TOTP hoặc dùng `speakeasy` |
| HTTP hardening | `nuxt-security` + proxy headers | `^2.6` | `nuxt-security` chỉ khai ở `apps/web`; Nginx đặt header cho admin static. Web giữ CSP/nonce, security headers, CORS và request-size. **Tắt** rate limiter + CSRF của module; hai contract đó vẫn thuộc `packages/cache` và `packages/auth` |
| SEO | `@nuxtjs/seo` | `^5.3` (pin chính xác, không float `^`) | Bundle: `@nuxtjs/robots` `@nuxtjs/sitemap` `nuxt-og-image` (renderer **Takumi**, cài thêm `@takumi-rs/core`) `nuxt-schema-org` `nuxt-site-config`. Sitemap động qua `defineSitemapEventHandler()` + `chunks: 5000` (tính trước cho lúc scale ngàn trang). Thứ tự module: `@nuxt/ui` → `@nuxtjs/seo` → layer khác |
| UI kit | Nuxt UI v4 (`^4.10`, pin do #6184 peer-dep vue-router) + Tailwind v4 | | Ép light-mode `pages/play/**` qua `middleware/force-play-light.global.ts` set `to.meta.colorMode = 'light'` (route-group, không phải `definePageMeta` từng file) |
| Form (admin) | `UForm` (Nuxt UI v4) + Zod 4 (Standard Schema, không cần adapter) | | Không có lib "Zod → form" đủ chín cho schema lồng nhau — hand-author field layout mỗi content type. `@norbiros/nuxt-auto-form` chỉ pilot cho form phẳng, chưa dùng critical path |
| Rich text (admin) | `Editor` component có sẵn trong Nuxt UI v4 (nền Tiptap 3) | | Set `starter-kit` về đúng bold/italic/link/heading. Lưu **markdown** (`html: false` khi render) thay vì HTML — biên an toàn tự nhiên hơn allowlist. Nếu chọn HTML: dùng `sanitize-html` server-side, không dùng `dompurify` server-side |
| Payment QR | Gọi `img.vietqr.io` (Quick Link API) trực tiếp | | Không tự sinh EMVCo/CRC16, không dùng package `vietqr` npm (stale từ 2022). Fetch + lưu PNG bytes lúc tạo order, không chỉ hotlink |
| Email — transport | `nodemailer` → AWS SES SMTP | `^9.0` | SMTP pool, TLS bắt buộc (587 STARTTLS hoặc 465 TLS wrapper). SMTP credential theo region và **không phải** AWS access key; quản lý ngoài repo. Không dùng `@aws-sdk/client-ses` cho đường gửi mail này |
| Email — template | `mjml` | `^5.4` | Template tĩnh trong repo, compile/validate strict; runtime chỉ nội suy biến typed đã escape. Không gọi MJML cloud API, không tracking pixel |
| Browser notification — hoãn P5 | FCM Web (`firebase` + `firebase-admin`) | Chốt version ở Task #84 | Đã chốt provider nhưng **không cài trong Task #83**. FCM là best-effort; inbox nội bộ là nguồn xem lại, service worker và endpoint rotation do [`browser-push.md`](../01-platform/browser-push.md) sở hữu |
| Ảnh — xử lý server | `sharp` | | Vẫn chuẩn 2026. pnpm: khai `onlyBuiltDependencies: [sharp]` ở `pnpm-workspace.yaml`. Docker: build native binary **trong** stage cùng base image runtime, không copy từ host |
| Ảnh — crop client | `vue-advanced-cropper` | | Vue-3-native, có `&lt;Preview&gt;` khớp yêu cầu "xem trước cỡ thật". Mount `&lt;ClientOnly&gt;` (SSR không đụng canvas) |
| Error tracking | `@sentry/nuxt` (SaaS Team tier) | | GlitchTip self-host là fallback nếu chi phí/lưu trú dữ liệu VN sau này bắt buộc — cùng giao thức ingest, đổi DSN là xong |
| Logging | `pino` + `pino-http` nối trực tiếp Nitro plugin | | Không dùng wrapper Nuxt (`nuxt-pino-log` bỏ hoang từ 2022) |
| Alert tới người | Healthchecks.io (free) cho liveness job/cron + Telegram Bot API (`fetch` thô) cho ngưỡng/crash | | Email chỉ là kênh dự phòng — VN dev quen Telegram hơn, tới nhanh hơn |
| Dependency-boundary | `dependency-cruiser` `^18.1` | | Duy nhất trong 4 lựa chọn khảo sát hỗ trợ cấm **thư viện ngoài cụ thể** theo từng zone (quy tắc `BR-MPA-01` của [`monorepo-package-architecture.md`](monorepo-package-architecture.md) — app không được import trực tiếp thư viện nền cho capability dùng chung từ ít nhất 2 app, phải qua package driver), không chỉ graph nội bộ. `sherif` giữ làm lint dependency-hygiene bổ sung, không thay được việc này |
| Gate chất lượng | **`lefthook` `^2.1`** (git hook local) | — | **Không cổng remote** — không GitHub Actions, GitLab CI hay Jenkins (quyết định người dùng 2026-08-06, xem §11 Q5). Không dùng `husky` + `lint-staged` (hai package, hook là shell script — lefthook là một binary Go, config một file, có `{staged_files}` sẵn). pnpm: khai **`allowBuilds: {lefthook: false}`** ở `pnpm-workspace.yaml`. Binary tới từ `optionalDependencies` theo platform (`lefthook-darwin-x64`…), `postinstall` **không cần chạy** — đo được: `.modules.yaml` ghi `ignoredBuilds: [lefthook@2.1.10]` mà `lefthook version` vẫn ra `2.1.10`. Không khai thì `pnpm install` trên **clone mới** exit 1 (`ERR_PNPM_IGNORED_BUILDS`) — vỡ onboarding. `onlyBuiltDependencies: [lefthook]` và `ignoredBuiltDependencies: [lefthook]` đều **không** tắt được lỗi này (đã đo trên pnpm 11.16) |
| Lint/format | `ultracite@~6.5.1` (**preset only**) + `@biomejs/biome@^2.5.7` (**CLI chạy thật**) | **Không** nâng `ultracite` lên `^7` — từ 7.0 bỏ Biome sang oxlint/oxfmt. **Không** dùng CLI `ultracite check` làm gate — đo trên Biome 2.5.7/2.5.5/2.4.0: wrapper báo `Failed to parse Biome output` rồi **exit 0** dù có lỗi lint thật (nuốt lỗi). Script `lint` gọi thẳng `biome check .` |
| Test | Vitest · Playwright · `fast-check` · k6 · `@axe-core/playwright` | giữ nguyên | |
| Storage | S3 SDK | giữ nguyên | |
| Deploy | Docker (PG 17 + Valkey 9) · PM2 · Nginx · EC2 | giữ nguyên | |

Version cụ thể ở bảng trên là **version tối thiểu được rà lại tại 2026-08-13**. Khi cài, lấy bản
vá/minor mới nhất cùng major đã chốt — không hạ version, không tự ý nhảy major (`BR-RBS-08`).
Nguồn nghiên cứu chi tiết không lặp lại ở đây theo [`CONVENTIONS.md`](../CONVENTIONS.md) (spec
khác link tới, không copy).

### 7.1a Chốt version chồng chéo và cổng dev — thêm 2026-08-29

`pnpm-workspace.yaml` sở hữu ba thứ, không chỉ `catalog:`:

| Khối | Dùng cho | Ghi chú |
|---|---|---|
| `catalog:` | Version của dependency dùng chung | Nguồn duy nhất (`BR-RBS-06`) |
| `overrides:` | Ép về **một** bản khi hai phụ thuộc kéo hai version | `BR-RBS-09`. Hiện có: `unhead` và `@unhead/vue` chốt `3.4.0` |
| `allowBuilds:` | Cho phép postinstall của native package | `lefthook: false` (§7.1 dòng "Gate chất lượng") |

Bộ icon local của kit nằm trong `catalog:` (`@iconify-json/lucide`) chứ không để Nuxt Icon gọi
`api.iconify.design` lúc chạy — xem `BR-DSC-23` của
[`design-system-contract.md`](../08-quality/design-system-contract.md).

Cổng dev (`BR-RBS-10`) — đây là cổng **máy trạm**, không phải bảng cổng production ở §7.3 của
[`server-provisioning.md`](../01-platform/server-provisioning.md) (production không có cổng cho
admin: nginx phục vụ static trực tiếp):

| App | Script | Cổng |
|---|---|---|
| `apps/web` | `nuxt dev --port 3000` | 3000 |
| `apps/admin` | `nuxt dev --port 3001` | 3001 |
| `apps/worker` | `tsx watch src/index.ts` | Không mở HTTP (`BR-JOB-04`) |

`NUXT_ALLOWED_ORIGINS` phải liệt kê cả hai origin đó, nếu không admin gọi API sẽ vỡ CORS.

### 7.2 Cấu trúc thư mục

Không lặp lại — xem [`../../SPEC.md`](../../SPEC.md) §8 Project structure. File đó là nguồn
sở hữu cây thư mục `mindkid/`; file này chỉ sở hữu **trình tự dựng** và gate của nó.

## 8. API contract

Không sở hữu route nào.

## 9. Acceptance criteria

```gherkin
Scenario: BR-RBS-03 — pre-push chạy check:fast
  Given lefthook đã cài vào .git/hooks
  When chạy `git push` thật (không phải `lefthook run pre-push` thủ công — lệnh
    thủ công thiếu ref data trên stdin mà git thật cung cấp, lefthook đọc thành
    "0 file cần push" và skip mọi job, exit 0 giả. Muốn test thủ công đúng: thêm `--force`)
  Then job "check" chạy `pnpm check:fast`
  And push chỉ đi tiếp khi lệnh đó exit 0

Scenario: BR-RBS-03 — ca âm, gate chặn commit vi phạm
  Given một file .ts vi phạm rule biome không tự sửa được được `git add`
  When chạy `git commit`
  Then job "lint-and-deps" thất bại và commit thất bại với exit code khác 0
  And HEAD không đổi
  And output in ra đường dẫn file kèm số dòng vi phạm

Scenario: BR-RBS-03 — engine-gates chỉ chạy khi chạm cây engine/nội dung
  Given commit chỉ đổi file trong packages/game-engine/src
  When chạy `git commit`
  Then job "engine-gates" chạy đủ tám cổng engine
  And commit chỉ đổi docs/specs/00-foundation thì job "engine-gates" bị bỏ qua

Scenario: BR-RBS-03a — hook tự cài khi cài dependency
  Given repo vừa clone, .git/hooks/ chưa có pre-commit
  When chạy `pnpm install`
  Then lệnh exit 0
  And .git/hooks/pre-commit và .git/hooks/pre-push tồn tại
  And `lefthook version` in ra version của §7.1

Scenario: BR-RBS-02 — một scope package duy nhất
  When đọc package.json gốc và package.json của mọi thư mục trong apps/ và packages/
  Then mọi name khớp ^@mindkid/
  And pnpm-workspace.yaml không chứa scope nào khác

Scenario: BR-RBS-07 — docker compose đúng version production
  When chạy `docker compose up -d` ở gốc repo
  Then Postgres báo version 17
  And Valkey báo version 9

Scenario: BR-RBS-09 — mỗi thư viện chồng chéo chỉ còn một bản
  When đọc pnpm-lock.yaml
  Then mỗi tên trong khối overrides chỉ xuất hiện đúng một version
  And node_modules/.pnpm/<nuxt>/node_modules/unhead và của @nuxt/ui trỏ cùng một thư mục

Scenario: BR-RBS-10 — hai app dev không tranh cổng
  Given .env gốc có PORT=3000
  When chạy pnpm dev:all
  Then apps/web nghe 3000 và apps/admin nghe 3001, không phụ thuộc thứ tự khởi động
  And NUXT_ALLOWED_ORIGINS chứa cả http://localhost:3000 và http://localhost:3001

Scenario: BR-RBS-10 — ca âm, admin gọi API cross-origin không vỡ CORS
  When gửi OPTIONS tới http://localhost:3000/api/managers/auth/session với Origin http://localhost:3001
  Then trả 204
  And header access-control-allow-origin đúng bằng http://localhost:3001
  And header access-control-allow-credentials là true
```

## 10. Boundaries

**Always**
- Pin version qua `engines` + pnpm `catalog:`, không rải version rời.
- Chạy `pnpm check` đầy đủ (PG + Valkey đã bật) trước khi coi một thay đổi là xong: `pre-push`
  chỉ là tập con.
- Thêm job vào `lefthook.yml` kèm ca âm đã đo.

**Ask first**
- Đổi major version bất kỳ dòng nào trong §7.1.
- Thêm dependency mới ngoài bảng §7.1 trước khi có spec cần nó.
- Đổi phân tầng `pre-commit`/`pre-push` ở §4 bước 6.

**Never**
- Merge thay đổi khi gate local chưa xanh.
- `git commit --no-verify` / `git push --no-verify` — không có cổng tự động remote đỡ phía sau, bỏ qua
  hook là bỏ qua **toàn bộ** kiểm tra tự động của project này.
- Hạ version xuống dưới §7.1 vì tiện.
- Thêm scope package khác `@mindkid/*`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~`packages/ui` có khớp `design-system-contract.md`?~~ **Đóng 2026-10-18**: `packages/ui` đã tồn tại (Nuxt UI v4 + Tailwind preset, có `tests/`); việc khớp contract do [`design-system-contract.md`](../08-quality/design-system-contract.md) đo | — | Đã đóng | — |
| ~~2~~ | ~~PostgreSQL có nên bump theo major mới nhất~~ **Đóng 2026-08-06 (T8)**: **giữ PG 17** — PG 18 chưa GA, đúng yêu cầu của `BR-RBS-07`, chốt trước migration | — | Đã đóng | D-X (T8) |
| ~~3~~ | ~~Mô hình session lõi~~ **Đóng 2026-08-09, sửa lần cuối 2026-08-13 (`D-CO`)**: thay Sidebase và toàn bộ first-party JWT/JWS bằng opaque Redis credential cho cả hai app, kể cả MFA challenge. `nuxt-auth-utils` chỉ seal locator/projection; Redis trong `packages/auth` là authority. Session tuyệt đối 1 giờ; remember tuỳ chọn, rotate-on-use, tuyệt đối tối đa 365 ngày. Gỡ direct dependency `jose`; cấm refresh route cũ và fallback file/memory/DB/JWT. OAuth P1 tiếp tục qua backend bridge — xem [`auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md) | — | Đã đóng | D-CO |
| ~~4~~ | ~~Thư viện TOTP~~ **Đóng 2026-08-06 (`D-CP`)**: `otpauth` — xem §7.1 | — | Đã đóng | D-CP |
| ~~5~~ | ~~CI provider~~ **Đóng 2026-08-06 (quyết định người dùng)**: **không dùng cổng tự động remote nào**. Thay bằng `lefthook` chạy local (§7.1) | — | Đã đóng | D-S (T1) |
| 6 | Chấp nhận phụ thuộc runtime vào `img.vietqr.io` (bên thứ ba, ngoài tầm kiểm soát) cho toàn bộ luồng thanh toán MVP? Không có lựa chọn tự-host tương đương đủ tin cậy ở §7.1 | [`payment-order-create.md`](../03-account/payment-order-create.md) | Hoãn, chặn phase P2 | hoãn |
| 7 | Xin production access AWS SES trước khi nào — cần review thời gian duyệt của AWS trước go-live P2 (không tự chốt được, phụ thuộc AWS) | Go-live P2, [`notification-service.md`](../01-platform/notification-service.md) | Hoãn, chặn go-live | người quyết |
| 8 | Sentry SaaS Team tier ($26/mo) hay tự host GlitchTip ngay từ đầu — quyết định chi phí, không phải kỹ thuật (đổi qua lại chỉ là đổi DSN) | Ngân sách vận hành | Hoãn, chặn phase P1 | hoãn |
| 9 | Kích thước pool `postgres.js` (`max`) và `PG max_connections` phải tính theo **loại EC2 instance thật** (số vCPU × số PM2 instance) — chưa chốt vì chưa biết instance type production | [`data-model-overview.md`](data-model-overview.md), deploy | Hoãn, chặn phase P1 | hoãn |
| ~~10~~ | ~~Chiến lược version control cho corpus spec~~ **Đóng 2026-08-09 (`D-U`)**: corpus spec ([`SPEC.md`](../../SPEC.md) + `docs/specs/` + `docs/tasks/` + `docs/taxonomy/` + `docs/montessori/`) nằm trong `mindkid/docs/`, cùng git repo và dòng lịch sử với code. `mindkid/SPEC.md` là symlink → `docs/SPEC.md` | — | Đã đóng | D-U |
| ~~11~~ | ~~Bật lại CI cổng tự động khi nào~~ **Đóng 2026-08-06**: không còn CI để bật. `BR-RBS-03` đo bằng hook thật + ca âm tại máy | — | Đã đóng | D-S (T1) |
| ~~12~~ | ~~Gate local bỏ qua được bằng `--no-verify`~~ **Đóng 2026-08-09 (`D-CL`)**: giữ lefthook làm phản hồi nhanh local; `main` cấm direct/force push, bắt buộc PR + ít nhất một approving human review và dismiss approval khi có commit mới | — | Đã đóng | D-CL |
