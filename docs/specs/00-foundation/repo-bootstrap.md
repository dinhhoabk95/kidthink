---
spec: REPO-BOOTSTRAP
title: Khởi tạo repo và dependency baseline
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-13
owns:
  - Cấu trúc thư mục gốc `mindkid/` và trình tự dựng repo
  - Dependency/tech baseline (version tối thiểu từng lớp)
  - Danh sách port có chọn lọc từ `tinimath/` (v1)
  - Gate chất lượng local (git hook) xanh trước khi viết business logic
depends_on: []
---

# Khởi tạo repo và dependency baseline

## 1. Objective

Mục P0 bước 7 của [`roadmap.md`](../roadmap.md) ghi "Dựng repo, migration, cổng tự động" nhưng
không có spec sở hữu — đây là lỗ hổng duy nhất trong 128 spec gốc. File này lấp nó, và là **spec
đầu tiên thực thi**, trước cả [`glossary.md`](glossary.md) và
[`id-conventions.md`](id-conventions.md), vì mọi spec khác giả định đã có repo để đặt code vào.

Quyết định nền: **khởi tạo từ đầu trong `mindkid/`**, nằm cạnh `tinimath/` (v1, tham khảo
đọc-only) trong cùng workspace — không update dần trên code cũ (quyết định D9 — khởi tạo source
mới từ đầu trong `mindkid/` thay vì update dần code cũ, mục 0 của [`SPEC.md`](../../SPEC.md)).
Port có chọn lọc, không copy nguyên khối; phần lớn thư viện nền adopt từ hệ sinh thái đã kiểm
chứng thay vì tự viết (quyết định D10 — ưu tiên adopt thư viện Nuxt ecosystem đã kiểm chứng thay
vì tự xây từ đầu, cùng mục).

## 2. Actors

| Actor | Vai trò |
|---|---|
| Dev (người hoặc AI agent IDE) | Chạy trình tự bootstrap, port asset, cấu hình gate local |
| Reviewer | Duyệt PR bootstrap đầu tiên — PR này **không chứa business logic** |
| lefthook (git hook local) | `pre-commit`: `pnpm lint` + `pnpm lint:deps`. `pre-push`: `pnpm services` + `pnpm check` (lint · deps · typecheck · test). Kể từ commit đầu tiên |

## 3. Entry points

| Nơi | |
|---|---|
| `mindkid/package.json`, `pnpm-workspace.yaml` | Gốc workspace |
| `mindkid/apps/*`, `mindkid/packages/*` | Khung app/package rỗng |
| `mindkid/lefthook.yml` + `.git/hooks/pre-commit`·`pre-push` | Gate lint+typecheck+test, chạy local. Không có cổng remote |
| `mindkid/docker-compose.yml` | PostgreSQL 17 + Valkey 9 cho dev local |
| `tinimath/tinimath/**` (v1, đọc-only) | Nguồn port — xem §7.3 |

## 4. Main flow — trình tự bootstrap

1. Tạo `mindkid/` cạnh `tinimath/` (v1) trong workspace hiện tại. Không xoá, không sửa
   `tinimath/` — nó vẫn là tham khảo đọc-only.
2. Port có chọn lọc theo §7.3 — chỉ những gì trong bảng, đổi scope `@tinimath/*` →
   `@mindkid/*` ngay khi port, không để sót bản cũ.
3. Khởi tạo `pnpm-workspace.yaml` (`apps/*`, `packages/*`) + `catalog:` cho dependency dùng
   chung (xem §7.1) + `package.json` gốc với `engines.node` và `engines.pnpm` khoá theo §7.1.
4. Cài dependency baseline theo §7.1 vào từng package/app tương ứng — **không** cài phiên
   bản thấp hơn bảng đó.
5. Dựng `docker-compose.yml` chạy PostgreSQL 17 + Valkey 9, verify kết nối được từ Node
   trước khi viết schema.
6. Cấu hình gate local bằng `lefthook`: `pre-commit` chạy `pnpm lint` + `pnpm lint:deps`
   (nhanh); `pre-push` chạy `pnpm services` rồi `pnpm check` = lint · lint:deps ·
   typecheck · test. Cổng nội dung/spec/an toàn kiểu **là test vitest** trong package
   sở hữu đường dẫn chúng quét, nên `pnpm test` phủ hết — Cấm — NEVER thêm script `lint:*`
   mới cho một rule. Chạy `lefthook install` để ghi `.git/hooks/*`, rồi bắt xanh
   trên **commit rỗng** — và kiểm **ca âm** (file vi phạm thì hook chặn commit) trước khi
   PR đầu tiên chứa business logic được mở. Hook không có ca âm đã đo là hook chưa tồn tại.
7. Gate ra: `pnpm check` xanh tại chỗ, `lefthook run pre-commit`/`pre-push` xanh **và** ca âm
   chặn đúng, `docker compose up -d` chạy được PG + Valkey — rồi mới bắt đầu viết
   [`glossary.md`](glossary.md) và [`id-conventions.md`](id-conventions.md) (P0 bước 1 kế tiếp
   theo [`roadmap.md`](../roadmap.md)).

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Asset v1 không tương thích [`design-system-contract.md`](../08-quality/design-system-contract.md) mới | Kiểm khi port `packages/ui` | Viết lại theo contract mới, **không** port nguyên trạng — ghi lại quyết định ở §11 |
| Dependency ở §7.1 có bản vá bảo mật mới hơn version chốt | Trước khi cài | Lấy bản vá mới nhất trong cùng major/minor đã chốt, không tự ý nhảy major |
| Thư viện ở §7.1 ngừng bảo trì trước khi bootstrap xong | Phát hiện lúc cài | Dừng, quay lại Specify — sửa bảng §7.1 trước khi tiếp tục, không âm thầm đổi trong PR code |
| Gate local đỏ mà cần commit/push gấp | Áp lực lịch trình | Không dùng `--no-verify`. Sửa lỗi, hoặc `git stash` phần chưa xong — xem Boundaries |
| Người clone repo mới nhưng chưa chạy `lefthook install` | `.git/hooks/` rỗng | Hook **không tồn tại** và git im lặng. `pnpm install` phải kéo `lefthook install` theo (`prepare` script) — đây là điểm hỏng mặc định của mọi gate local |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RBS-01` | Repo mới **NEVER copy trực tiếp** route/schema/service từ v1 — chỉ 3 tài sản + tooling config ở §7.3, trừ khi có audit riêng bổ sung | Mục 1 của [`AUDIT-v1.md`](../AUDIT-v1.md) đã đo: ~26% nội dung v1 là "nợ" gắn với code sẽ bỏ. Copy nguyên khối mang nợ đó sang |
| `BR-RBS-02` | Mọi package port từ v1 **phải đổi scope** `@tinimath/*` → `@mindkid/*` trong cùng PR port, không để hai scope cùng tồn tại | Hai scope trộn lẫn làm import path không nhất quán và dễ import nhầm bản cũ |
| `BR-RBS-03` | Gate local `lefthook` (lint + lint:tokens + lint:deps + typecheck + test) phải xanh trên commit rỗng **và** chặn đúng ở ca âm, **trước khi** PR đầu tiên chứa business logic mở | Bootstrap xong mà gate chưa chạy là nợ kỹ thuật ghi nhận ngay từ dòng code đầu tiên. Ca âm bắt buộc vì gate exit 0 khi có lỗi là chuyện **đã xảy ra** ở project này (`ultracite check`, `check:services`) |
| `BR-RBS-03a` | `lefthook install` phải chạy tự động qua `prepare` script của `package.json` — không dựa vào người mới clone tự nhớ | Hook chỉ tồn tại trong `.git/hooks/` (không được commit). Người clone mà không cài hook thì gate im lặng biến mất, và git không báo gì |
| `BR-RBS-04` | **NEVER viết code nghiệp vụ** trước khi toàn bộ spec `00-foundation` đạt `status: approved` | Nguyên tắc 1 của [`roadmap.md`](../roadmap.md) — contract trước implementation |
| `BR-RBS-05` | Dependency ở §7.1 **ưu tiên adopt** thư viện phổ biến; chỉ tự viết khi không có thư viện phù hợp hoặc cần bọc dùng chung nhiều app (driver) | Mục 0, quyết định D10 của [`SPEC.md`](../../SPEC.md) |
| `BR-RBS-06` | Version pin ở `engines` (root) + pnpm `catalog:` — package con **không tự ý** khai version khác catalog | Version rải rác từng package là nguồn drift kinh điển trong monorepo |
| `BR-RBS-07` | `docker-compose.yml` dev phải chạy **đúng major version** production (PG 17, Valkey 9) trước khi bất kỳ ai viết schema | Test trên version khác production là kiểm tra sai thứ |
| `BR-RBS-08` | Đổi bảng §7.1 (thêm/gỡ thư viện nền, đổi major version) là đổi spec — **không** sửa âm thầm trong PR cài dependency | Bảng này là contract; sửa không qua Specify làm mất lý do quyết định |

## 7. Data

### 7.1 Dependency/tech baseline — chốt 2026-08-05, rà lại 2026-08-13

**Sửa 2026-08-06:** `iovalkey` bị gỡ khỏi baseline — nghiên cứu xác nhận **không có chỗ dùng
thật**: BullMQ tự dựng client `ioredis` nội bộ khi nhận config dạng object thường (không
`instanceof` check, không cần client instance ngoài), và driver `redis` của `unstorage`
hardcode `ioredis` không nhận client khác. Cả hai điểm chạm Valkey duy nhất trong stack này
đều đi qua `ioredis` — dùng thẳng, không thêm `iovalkey` làm phụ thuộc thứ hai vô nghĩa.

| Lớp | Chọn | Version tối thiểu | Ghi chú |
|---|---|---|---|
| Runtime | Node | 24 (LTS, hỗ trợ tới 04/2028) | Không dùng Node 20 (EOL 03/2026), chưa pin Node 26 (chưa LTS) |
| Package manager | pnpm | 11 | Bật `catalog:`; SQLite store index; supply-chain cooldown 1 ngày mặc định |
| Web framework | Nuxt | `^4.5` | Nuxt 3 EOL 31/07/2026. Nuxt 5 chưa phát hành tại thời điểm chốt |
| DB | PostgreSQL | 17 | Giữ nguyên từ v1 — chưa có lý do kỹ thuật để bump, xem §11 Q2 |
| ORM | Drizzle | `^0.45` (drizzle-kit `^0.31`, lockstep) | Driver `postgres.js`, singleton `postgres()`+`drizzle()` **một lần mỗi tiến trình PM2** (không tạo client mỗi request — đó là anti-pattern của serverless, không áp dụng ở đây). `prepare: true` (mặc định) — chỉ tắt nếu sau này có pooler transaction-mode (PgBouncer/RDS Proxy) đứng trước |
| Valkey server | Valkey | 9 (9.1) | Linux Foundation, tương thích Redis protocol ~90% (không còn 1:1) |
| Valkey client (Node) | **`ioredis`** `^5.11` | — | Không dùng `iovalkey` (xem ghi chú sửa ở trên) — pin khớp version BullMQ tự test (`5.11.1`). Pin `^5.11` **có chủ đích**, không nâng `^6` dù npm báo đó là bản mới nhất. `iovalkey ^0.4` chỉ dùng **nếu sau này** có code tự viết gọi Valkey trực tiếp ngoài BullMQ/unstorage (hiện chưa có) |
| Ngôn ngữ | TypeScript | `~5.9.3` | Không pin theo `latest` npm (`7.0.2` là bản viết lại native compiler) — Nuxt 4.5.2 không pin TS, `vue-tsc@3.3.9` chỉ khai `>=5.0.0` (*cho phép*, không phải *đã kiểm chứng*). Giữ major 5, boring tech (mục 6 của [`SPEC.md`](../../SPEC.md)). Đánh giá TS 7 là task riêng khi có code thật để đo |
| Cache abstraction | `unstorage` | `^1.17` | Driver `redis` built-in, trỏ thẳng `host`/`port` Valkey — không cần workaround, không cần driver tự viết |
| Rate limit | `rate-limiter-flexible` | `^11.2` | Chỉ dùng trong `packages/cache`, trên singleton `ioredis`; `unstorage` chỉ làm cache. Giữ hai trục, `Retry-After`, trusted-proxy và fail-open/closed của [`rate-limiting.md`](../01-platform/rate-limiting.md), không bật limiter của `nuxt-security` |
| Queue | BullMQ | `^6.0` | `connection: {host, port, password}` — object thường, BullMQ tự dựng `ioredis` nội bộ (tự set `maxRetriesPerRequest: null` cho Worker). Không dùng `createValkeyGlideClient` (đó là path cho HA/cluster kiểu AWS, không cần ở self-host Docker) |
| Queue — Nuxt wrapper | Không dùng `nuxt-simple-bullmq` | — | Solo-maintainer, README tự nhận chỉ test Node 21, tác giả khuyên dùng lựa chọn khác cho production. Nối BullMQ trực tiếp qua Nitro plugin trong `apps/worker` |
| Auth — trạng thái Nuxt (cả 2 app) | `nuxt-auth-utils` | `^0.5.30` | **Dùng cho cả `apps/web` VÀ `apps/admin`**. Module chỉ seal opaque locator và cung cấp projection/`useUserSession`; identity/role/reauth/remember nằm trong Redis. Cookie session host-only, tuyệt đối 1 giờ; remember tuỳ chọn, tuyệt đối tối đa 365 ngày. Pin tối thiểu `0.5.30`; không dùng OAuth/password/WebAuthn helper, AuthJS hoặc `next-auth` |
| Auth — Redis session authority | `ioredis` trong `packages/auth` | `^5.11` | Client process-long riêng, fail-closed; Lua/transaction nguyên tử cho rotate/revoke; production AOF + `noeviction`. Không đi qua cache API fail-open, không file/memory/DB fallback |
| Auth — OAuth/OIDC backend bridge | `openid-client` | `^6.8` | `packages/auth/src/oauth/` dùng cho discovery, PKCE, authorization URL, code exchange và token validation. Không dùng `defineOAuth*EventHandler` của `nuxt-auth-utils`, không đổi sang AuthJS và không tự viết protocol primitive |
| Auth — TOTP (Manager bắt buộc, User P2 tuỳ chọn) | `otpauth` | `^9.5` | Dùng cho sinh secret, URI và validate RFC 4226/6238; cấm dùng password helper của `nuxt-auth-utils`, tự viết HMAC/Base32/TOTP hoặc dùng `speakeasy` |
| HTTP hardening | `nuxt-security` | `^2.6` | Khai trực tiếp ở `apps/web` và `apps/admin`: CSP/nonce, security headers, CORS và request-size. **Tắt** rate limiter + CSRF của module; hai contract đó vẫn thuộc `packages/cache` và `packages/auth` |
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
| Gate chất lượng | **`lefthook` `^2.1`** (git hook local) | — | **Không cổng remote** — không cổng tự động, không GitLab cổng tự động, không Jenkins (quyết định người dùng 2026-08-06, xem §11 Q5). Không dùng `husky` + `lint-staged` (hai package, hook là shell script — lefthook là một binary Go, config một file, có `{staged_files}` sẵn). pnpm: khai **`allowBuilds: {lefthook: false}`** ở `pnpm-workspace.yaml`. Binary tới từ `optionalDependencies` theo platform (`lefthook-darwin-x64`…), `postinstall` **không cần chạy** — đo được: `.modules.yaml` ghi `ignoredBuilds: [lefthook@2.1.10]` mà `lefthook version` vẫn ra `2.1.10`. Không khai thì `pnpm install` trên **clone mới** exit 1 (`ERR_PNPM_IGNORED_BUILDS`) — vỡ onboarding. `onlyBuiltDependencies: [lefthook]` và `ignoredBuiltDependencies: [lefthook]` đều **không** tắt được lỗi này (đã đo trên pnpm 11.16) |
| Lint/format | `ultracite@~6.5.1` (**preset only**) + `@biomejs/biome@^2.5.7` (**CLI chạy thật**) | **Không** nâng `ultracite` lên `^7` — từ 7.0 bỏ Biome sang oxlint/oxfmt, kể cả bản v1 pin `7.9.4` đã là oxlint. **Không** dùng CLI `ultracite check` làm gate — đo trên Biome 2.5.7/2.5.5/2.4.0: wrapper báo `Failed to parse Biome output` rồi **exit 0** dù có lỗi lint thật (nuốt lỗi). Script `lint` gọi thẳng `biome check .` |
| Test | Vitest · Playwright · `fast-check` · k6 · `@axe-core/playwright` | giữ nguyên | |
| Storage | S3 SDK | giữ nguyên | |
| Deploy | Docker (PG 17 + Valkey 9) · PM2 · Nginx · EC2 | giữ nguyên | |

Version cụ thể ở bảng trên là **version tối thiểu được rà lại tại 2026-08-13**. Lúc bootstrap thực tế,
lấy bản vá/minor mới nhất cùng major đã chốt — không hạ version, không tự ý nhảy major (quy tắc
`BR-RBS-08` — đổi bảng §7.1 là đổi spec, không sửa âm thầm trong PR cài dependency). Nguồn
nghiên cứu chi tiết (npm registry, GitHub issue, docs) — xem lịch sử phiên làm việc 2026-08-05/06,
không lặp lại ở đây theo [`CONVENTIONS.md`](../CONVENTIONS.md) (spec khác link tới, không copy).

### 7.2 Cấu trúc thư mục

Không lặp lại — xem [`../../SPEC.md`](../../SPEC.md) §8 Project structure. File đó là nguồn
sở hữu cây thư mục `mindkid/`; file này chỉ sở hữu **trình tự dựng** nó.

### 7.3 Danh sách port từ v1 (`tinimath/tinimath/`)

| Tài sản v1 | Đích ở `mindkid/` | Điều kiện port |
|---|---|---|
| `docs/taxonomy/` | `docs/taxonomy/` | Port nguyên — registry C1–C6 + 230 skill là dữ liệu, không phải code |
| `packages/emoji/` | `packages/emoji/` | Port nguyên, đổi scope. 32 nhóm emoji cố định không đổi theo spec v2 |
| `packages/game-engine/` | `packages/game-engine/` | Port **có điều kiện**, đổi scope — không "port nguyên": đo được là bất khả thi. **48 import** `D1xx–D4xxConfig` từ `@tinimath/shared` — package ngoài danh sách port ở bảng này; v1 `handlers/d1..d6/` 86 file / 60 game type vs v2 `templates/` `GT-001`…`GT-006`. Phụ thuộc mục 11 câu hỏi 1 của [`game-template-contract.md`](../01-platform/game-template-contract.md) — khảo sát % port được **trước khi cam kết**. Task riêng, ngoài P0 bước 1 |
| `biome.json`, TSConfig base, `.dockerignore`, `docker-compose*.yml` skeleton | `packages/config/`, gốc `mindkid/` | Port làm điểm khởi đầu, chỉnh version dependency theo §7.1 |
| `packages/config/src/constants.ts` | Không port | `COOKIE_PREFIXES` (`superadmin: "tinimath_sa"`) + `API_PATHS` là bề mặt auth v1 — actor `superadmin` (v2 dùng `manager`), prefix `tinimath_`. Auth tuân theo cổng review vùng nhạy cảm và ngoại lệ Task #14 tại mục 5 của [`ai-codegen-pipeline.md`](../01-platform/ai-codegen-pipeline.md); không port contract v1 |
| Workflow v1 (`.github/workflows/`) | Không port | Không có cổng remote ở v2 (§7.1 dòng "Gate chất lượng", §11 Q5). Bản port ngày 2026-08-06 đã **xoá lại** cùng cả thư mục `.github/` |
| `packages/ui/` (Nuxt UI v4 + Tailwind preset, brand component) | `packages/ui/` | Port **có điều kiện** — chỉ phần đã khớp [`design-system-contract.md`](../08-quality/design-system-contract.md); phần lệch thì viết lại, không ép port. Cần audit riêng trước khi merge — xem §11 Q1 |
| Mọi route API, Drizzle schema, service, session class | Không port | Business logic viết mới hoàn toàn theo 128 spec v2 — đây chính là lý do greenfield (quyết định D9 ở mục 0 của [`SPEC.md`](../../SPEC.md)) |

## 8. API contract

Không sở hữu route nào.

## 9. Acceptance criteria

```gherkin
Scenario: BR-RBS-03 — gate local xanh trước business logic
  Given repo mindkid/ mới tạo với commit rỗng
  When chạy `git push` thật (không phải `lefthook run pre-push` thủ công — lệnh
    thủ công thiếu ref data trên stdin mà git thật cung cấp, lefthook đọc thành
    "0 file cần push" và **skip cả 3 job, exit 0 giả** — đo được 2026-08-06.
    Muốn test thủ công đúng: thêm `--force`)
  Then mọi job pass với exit code 0 — đã đo thật: check+test+services xanh,
    push `75febf6..d4860b7` thành công lên `origin/main`
  And chưa có PR nào chứa route/schema/service được mở

Scenario: BR-RBS-03 — ca âm, gate chặn commit vi phạm
  Given một file .ts vi phạm rule biome được `git add`
  When chạy `git commit`
  Then commit thất bại với exit code khác 0
  And HEAD không đổi
  And output in ra đường dẫn file kèm số dòng vi phạm

Scenario: BR-RBS-03a — hook tự cài khi cài dependency
  Given repo vừa clone, .git/hooks/ chưa có pre-commit
  When chạy `pnpm install`
  Then lệnh exit 0
  And .git/hooks/pre-commit và .git/hooks/pre-push tồn tại
  And `lefthook version` in ra version của §7.1

Scenario: BR-RBS-02 — scope package đổi khi port
  Given packages/emoji được port từ tinimath/tinimath/packages/emoji
  When đọc package.json của package vừa port
  Then name là "@mindkid/emoji"
  And không còn tham chiếu "@tinimath/" nào trong package đó

Scenario: BR-RBS-07 — docker compose đúng version production
  When chạy `docker compose up -d` ở mindkid/
  Then Postgres báo version 17
  And Valkey báo version 9

Scenario: BR-RBS-01 — không port business logic
  When quét diff của PR bootstrap đầu tiên
  Then không có file trong apps/*/server/api hoặc packages/db/src/schema
  And chỉ có file thuộc danh sách §7.3

Scenario: BR-RBS-04 — chặn code nghiệp vụ trước foundation approved
  Given một spec 00-foundation còn status "draft"
  When có PR mở thêm route hoặc bảng DB ngoài §7.3
  Then reviewer từ chối, trỏ về roadmap.md nguyên tắc 1
```

## 10. Boundaries

**Always**
- Chạy đúng trình tự §4 — repo trước, dependency baseline trước, gate local xanh (kèm ca âm)
  trước business logic.
- Đổi scope package ngay khi port, trong cùng PR.
- Pin version qua `engines` + pnpm `catalog:`, không rải version rời.

**Ask first**
- Mở rộng danh sách port ở §7.3.
- Đổi major version bất kỳ dòng nào trong §7.1.
- Thêm dependency mới ngoài bảng §7.1 trước khi có spec cần nó.

**Never**
- Copy route/schema/service từ v1.
- Để hai scope package (`@tinimath/*` và `@mindkid/*`) cùng tồn tại sau khi port xong.
- Merge PR business logic khi gate local chưa xanh.
- `git commit --no-verify` / `git push --no-verify` — không có cổng tự động remote đỡ phía sau, bỏ qua
  hook là bỏ qua **toàn bộ** kiểm tra tự động của project này.
- Hạ version xuống dưới §7.1 vì tiện.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | `packages/ui` (Nuxt UI v4 + Tailwind preset + brand component ở v1) có đủ khớp [`design-system-contract.md`](../08-quality/design-system-contract.md) mới để port nguyên, hay phải viết lại phần lớn? Cần audit riêng, không đoán ở đây | Bước port §7.3, và mọi UI apps/web sau đó | Hoãn, chặn phase P1 | hoãn |
| ~~2~~ | ~~PostgreSQL có nên bump theo major mới nhất~~ **Đóng 2026-08-06 (T8)**: **giữ PG 17** — đã kiểm chứng ở v1, PG 18 chưa GA, đúng yêu cầu của quy tắc `BR-RBS-07` (chạy đúng major version production trước khi viết schema), chốt trước migration | — | Đã đóng | D-X (T8) |
| ~~3~~ | ~~Mô hình session lõi~~ **Đóng 2026-08-09, sửa lần cuối 2026-08-13 (`D-CO`)**: thay Sidebase và toàn bộ first-party JWT/JWS bằng opaque Redis credential cho cả hai app, kể cả MFA challenge. `nuxt-auth-utils` chỉ seal locator/projection; Redis trong `packages/auth` là authority. Session tuyệt đối 1 giờ; remember tuỳ chọn, rotate-on-use, tuyệt đối tối đa 365 ngày. Gỡ direct dependency `jose`; cấm refresh route cũ và fallback file/memory/DB/JWT. OAuth P1 tiếp tục qua backend bridge — xem [`auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md) | — | Đã đóng | D-CO |
| ~~4~~ | ~~Thư viện TOTP~~ **Đóng 2026-08-06 (`D-CP`)**: `otpauth` — xem §7.1 | — | Đã đóng | D-CP |
| ~~5~~ | ~~CI provider~~ **Đóng lại 2026-08-06 (lần 2, quyết định người dùng)**: **không dùng cổng tự động remote nào**. `.github/workflows/ci.yml` đã xoá cùng cả thư mục `.github/`. Thay bằng `lefthook` chạy local (§7.1). Lần đóng trước cùng ngày ghi "cổng tự động" — **sai, đã thay** | — | Đã đóng | D-S (T1) |
| 6 | Chấp nhận phụ thuộc runtime vào `img.vietqr.io` (bên thứ ba, ngoài tầm kiểm soát) cho toàn bộ luồng thanh toán MVP? Không có lựa chọn tự-host tương đương đủ tin cậy ở §7.1 | [`payment-order-create.md`](../03-account/payment-order-create.md) | Hoãn, chặn phase P2 | hoãn |
| 7 | Xin production access AWS SES trước khi nào — cần review thời gian duyệt của AWS trước go-live P2 (không tự chốt được, phụ thuộc AWS) | Go-live P2, [`notification-service.md`](../01-platform/notification-service.md) | Hoãn, chặn go-live | người quyết |
| 8 | Sentry SaaS Team tier ($26/mo) hay tự host GlitchTip ngay từ đầu — quyết định chi phí, không phải kỹ thuật (đổi qua lại chỉ là đổi DSN) | Ngân sách vận hành | Hoãn, chặn phase P1 | hoãn |
| 9 | Kích thước pool `postgres.js` (`max`) và `PG max_connections` phải tính theo **loại EC2 instance thật** (số vCPU × số PM2 instance) — chưa chốt vì chưa biết instance type production | [`data-model-overview.md`](../01-platform/data-model-overview.md), deploy | Hoãn, chặn phase P1 | hoãn |
| ~~10~~ | ~~Chiến lược version control cho corpus spec ở workspace root.~~ **Đóng 2026-08-09 (T13)**: Lượt 3 khôi phục Lượt 1 (`D-U`) — corpus ở nguyên trong `mindkid/docs/`. **Ba lượt quyết định:** | — | Đã đóng | D-U |
| | **Lượt 1 — 2026-08-06 (D-U, T2)**: chốt corpus spec ([`SPEC.md`](../../SPEC.md) + `docs/specs/` + `docs/tasks/`) chuyển vào `mindkid/docs/`, thuộc git repo code. `mindkid/SPEC.md` = symlink → `docs/SPEC.md`. `git log --follow` truy được vết. 223 link `.md` resolve, 0 vỡ. | | | |
| | **Lượt 2 — 2026-08-07 sáng (quyết định người dùng)**: **đảo lại** — corpus spec ra khỏi `mindkid/`, về `docs/` ở workspace root (sibling của `mindkid/`), **không** track chung git repo code. Lý do lúc đó: docs đổi nhịp khác code và người duyệt khác nhau — tách để diff/review code không lẫn thay đổi markdown. Chưa kịp code hoá (`CORPUS_ROOT` chưa thêm vào `packages/gates/src/lint-specs-lib.ts`) thì đã đảo lại ở Lượt 3 — bản ghi lượt này giữ lại làm lịch sử, không phải trạng thái hiện hành | | | |
| | **Lượt 3 — 2026-08-07 chiều (quyết định người dùng, đảo lại Lượt 2)**: **khôi phục Lượt 1** — corpus spec ([`SPEC.md`](../../SPEC.md) + `docs/specs/` + `docs/tasks/` + `docs/taxonomy/` + `docs/montessori/`) ở nguyên trong `mindkid/docs/`, thuộc git repo code, commit chung dòng lịch sử với task code (ví dụ Task #3). Lý do: tách riêng repo docs mới chỉ là quyết định trên giấy — chưa mang lại lợi ích gì (chưa review-tách-luồng nào từng chạy) mà đã phát sinh rủi ro thật: một bản `docs/` cũ bị bỏ quên ở workspace root làm `mindkid/SPEC.md` (symlink) trỏ nhầm sang nội dung lỗi thời. `mindkid/SPEC.md` = symlink → `docs/SPEC.md` (khôi phục, bỏ `../`). Xoá bản `docs/` trùng ở workspace root | | | |
| ~~11~~ | ~~Bật lại CI cổng tự động khi nào~~ **Đóng 2026-08-06**: câu hỏi biến mất cùng provider — không còn CI để bật. Quy tắc `BR-RBS-03` (gate local phải xanh và chặn đúng ca âm trước khi mở PR chứa business logic) giờ đo bằng `lefthook run pre-push` + ca âm tại máy | — | Đã đóng | D-S (T1) |
| ~~12~~ | ~~Gate local bỏ qua được bằng `--no-verify`~~ **Đóng dứt điểm 2026-08-09 (`D-CL`)**: giữ lefthook làm phản hồi nhanh local; `main` cấm direct/force push, bắt buộc PR + ít nhất một approving human review và dismiss approval khi có commit mới. Người bật rule trước PR seeder đầu tiên | — | Đã đóng | D-CL |
| ~~13~~ | ~~"Cổng CI" còn sót ở spec khác~~ **Đóng 2026-08-06**: đo lại chính xác là **7 file** (không phải 15 — số cũ ước lượng sai), đã sửa hết thành "cổng tự động": [`mvp-scope.md`](mvp-scope.md) · [`content-lifecycle.md`](content-lifecycle.md) · [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) (2 chỗ, gồm câu "không có cờ bỏ qua" ở Q12) · [`roadmap.md`](../roadmap.md) · [`index.md`](../index.md) · [`SPEC.md`](../../SPEC.md) (4 chỗ). `grep -rn "cổng tự động\|CI xanh\|cổng tự động" docs/specs/ SPEC.md` chỉ còn khớp trong chính file này (lịch sử quyết định, không phải khẳng định hiện tại) | — | Đã đóng | D-V (T4) |
