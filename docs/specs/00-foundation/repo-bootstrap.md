---
spec: REPO-BOOTSTRAP
title: Dependency baseline và gate local
area: foundation
status: approved
mvp: true
phase: P0
reviewed: 2026-10-18
open_tasks:
  - "#308"
owns:
  - Cấu trúc gốc workspace `mindkid/` và trình tự dựng repo
  - Dependency/tech baseline (version tối thiểu từng lớp)
  - Gate chất lượng local (git hook `lefthook`) và cách nó tự cài
depends_on: []
---

# Dependency baseline và gate local

> **Cập nhật 2026-11-24** — `BR-RBS-03` thu gọn còn một job `pre-commit` (`biome-staged`), không còn `pre-push`. Tốc độ commit quan trọng hơn gate nặng ở máy dev; kiểm tra đầy đủ (`pnpm check`, vitest) chạy tay trước khi xong việc (xem `CLAUDE.md`).

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
| lefthook (git hook local) | `pre-commit`: `biome-staged` (Biome `check --write` trên file staged, stage lại bản đã sửa). Không có `pre-push` |

## 3. Entry points

| Nơi | |
|---|---|
| `package.json`, `pnpm-workspace.yaml` | Gốc workspace: `engines`, `overrides:`, `allowBuilds:`, và version tường minh từng `package.json` |
| `apps/*`, `packages/*` | App và package dùng chung (cây đầy đủ ở §8 của [`SPEC.md`](../../SPEC.md)) |
| `lefthook.yml` + `.git/hooks/pre-commit` | Gate local. Không có cổng remote |
| `package.json` gốc, script `check` | `pnpm check` = `lint` + `lint:deps` + `typecheck` (không chạy test). `scripts/check.sh`, `check:fast`, `pnpm services` đã gỡ |
| `docker-compose.yml` | Đã gỡ (D15): không còn dịch vụ ngoài nào cho dev/test (DB, auth keyspace, rate limit, cache, queue đều chạy trong tiến trình trên SQLite) |

## 4. Main flow — dựng và giữ workspace

1. `pnpm-workspace.yaml` khai `apps/*`, `packages/*`, `overrides:` và `allowBuilds:`;
   `package.json` gốc khoá `engines.node >=26.13.1`, `engines.pnpm >=12`.
2. Mỗi `package.json` khai trực tiếp phiên bản tường minh đồng bộ trên toàn monorepo (không dùng
   chuỗi `catalog:`, không khai hai phiên bản lệch nhau cho cùng một gói — `BR-RBS-06`).
3. Cài dependency theo §7.1 vào package/app cần nó — **không** cài bản thấp hơn bảng.
4. `pnpm install` chạy `prepare: lefthook install`, ghi `.git/hooks/*` tự động (`BR-RBS-03a`).
5. Dev/test chạy SQLite qua `node:sqlite` và engine DO trong tiến trình (`packages/local-runtime`, `D15`); không cần dịch vụ ngoài, không cần Docker.
   Production là Cloudflare D1 (`BR-RBS-07` đã ngưng, xem §6).
6. Gate local theo `lefthook.yml`: `pre-commit` chỉ có job `biome-staged` — `biome check --write
   --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}`, `stage_fixed: true`. Không có
   `pre-push`, không nạp PATH nvm trong hook. `pnpm check` (lint + lint:deps + typecheck) và
   vitest của workspace đã đụng chạy tay trước khi xong việc.
7. Gate ra của một thay đổi: `pnpm check` xanh tại máy, hook `pre-commit` xanh **và** ca âm chặn đúng (`BR-RBS-03`).

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Dependency ở §7.1 có bản vá bảo mật mới hơn version chốt | Trước khi cài | Lấy bản vá mới nhất trong cùng major/minor đã chốt, không tự ý nhảy major |
| Thư viện ở §7.1 ngừng bảo trì | Phát hiện lúc cài hoặc rà | Dừng, quay lại Specify — sửa bảng §7.1 trước, không âm thầm đổi trong PR code (`BR-RBS-08`) |
| Gate local đỏ mà cần commit/push gấp | Áp lực lịch trình | Không dùng `--no-verify`. Sửa lỗi, hoặc `git stash` phần chưa xong — xem Boundaries |
| Người clone repo mới nhưng `.git/hooks/` rỗng | Chưa chạy `pnpm install` | Hook **không tồn tại** và git im lặng. `pnpm install` kéo `lefthook install` theo (`prepare` script) — đây là điểm hỏng mặc định của mọi gate local |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RBS-01` | **Ngưng — 2026-10-18.** Rule về giới hạn tài sản được chuyển vào repo lúc khởi tạo; giai đoạn đó đã xong. Nguyên tắc còn hiệu lực nằm ở D9 của [`SPEC.md`](../../SPEC.md). Không tái dùng số (`BR-REG2-02`) | Hết đối tượng |
| `BR-RBS-02` | Mọi workspace package (`package.json` gốc, `apps/*`, `packages/*`) mang scope `@mindkid/*`; không scope nào khác cùng tồn tại | Hai scope trộn lẫn làm import path không nhất quán và dễ import nhầm. Test `packages/shared/tests/foundation-contracts.test.ts` trích mã này |
| `BR-RBS-03` | Gate local `lefthook` chỉ gồm `pre-commit` với một job `biome-staged` (§4 bước 6), không có `pre-push`; hook phải chặn đúng ở ca âm. Thêm hoặc bớt job trong `lefthook.yml` là đổi spec này | Gate exit 0 khi có lỗi là chuyện **đã xảy ra** ở project này (`ultracite check`, `check:services`). Gate không có ca âm đã đo là gate chưa tồn tại. Hook nặng (lint toàn cây, typecheck) làm mỗi commit chậm tới mức người ta bỏ qua; `pnpm check` đã đo cùng thứ đó ở lệnh chạy tay |
| `BR-RBS-03a` | `lefthook install` phải chạy tự động qua `prepare` script của `package.json` — không dựa vào người mới clone tự nhớ | Hook chỉ tồn tại trong `.git/hooks/` (không được commit). Người clone mà không cài hook thì gate im lặng biến mất, và git không báo gì |
| `BR-RBS-04` | **Ngưng — 2026-10-18.** Rule chặn code nghiệp vụ trước khi foundation được duyệt; giai đoạn đó đã qua. Nguyên tắc "contract trước implementation" vẫn ở [`roadmap.md`](../roadmap.md). Không tái dùng số (`BR-REG2-02`) | Hết đối tượng |
| `BR-RBS-05` | Dependency ở §7.1 **ưu tiên adopt** thư viện phổ biến; chỉ tự viết khi không có thư viện phù hợp hoặc cần bọc dùng chung nhiều app (driver) | Mục 0, quyết định D10 của [`SPEC.md`](../../SPEC.md) |
| `BR-RBS-06` | Version pin ở `engines` (root) và ghi trực tiếp phiên bản tường minh đồng nhất trong từng `package.json` (không dùng `catalog:`; cùng một dependency ngoại phải khớp chính xác chuỗi version giữa mọi workspace) | Khai trực tiếp giúp từng app/package hiển thị rõ phiên bản thật, còn kiểm đồng nhất chặn drift giữa các workspace |
| `BR-RBS-07` | **Ngưng — 2026-11-24.** Production là Cloudflare D1 (SQLite) nên Postgres không còn là bản production để khớp. Nguyên văn cũ: `docker-compose.yml` dev phải chạy **đúng major version** production (PG 18, Valkey 9) | Test trên version khác production là kiểm tra sai thứ |
| `BR-RBS-08` | Đổi bảng §7.1 (thêm/gỡ thư viện nền, đổi major version) là đổi spec — **không** sửa âm thầm trong PR cài dependency | Bảng này là contract; sửa không qua Specify làm mất lý do quyết định |
| `BR-RBS-09` | Thư viện nào bị **hai** phụ thuộc kéo về hai version phải chốt về một bản bằng `overrides` trong `pnpm-workspace.yaml`, kèm lý do | Hai bản cùng tồn tại là hai instance runtime. Đo 2026-08-29: nuxt 4.5.2 khai `unhead ^3.3.1`, `@nuxt/ui` 4.11 khai `@unhead/vue ^3.3.2`, lockfile chốt cả 3.3.1 lẫn 3.4.0 |
| `BR-RBS-10` | Cổng dev của từng app pin bằng **cờ CLI** trong `dev` script, không để rơi vào biến `PORT` | `PORT=3000` ở `.env` gốc được `require-env` nạp cho mọi tiến trình, nên `pnpm dev:all` cho web và admin tranh nhau 3000 — ai khởi động trước thắng, và `NUXT_PUBLIC_API_BASE_URL=http://localhost:3000` có lúc trỏ ngược vào chính admin |

## 7. Data

### 7.1 Dependency/tech baseline — chốt 2026-08-05, nâng cấp major 2026-11-16

Valkey/Redis/BullMQ/`ioredis` đã gỡ khỏi baseline (`D15`): queue, rate limit, cache và auth keyspace dùng engine DO chạy trên SQLite.

| Lớp | Chọn | Version tối thiểu | Ghi chú |
|---|---|---|---|
| Runtime | Node | `>=26.13.1` (LTS Lithium) | `.nvmrc` ghim `26.13.1` (CI dùng `node-version-file: .nvmrc`) |
| Package manager | pnpm | 12 (`pnpm@12.21.0`) | Ghi trực tiếp version trong từng `package.json`; SQLite store index |
| Web framework | Nuxt | `^4.6.4` + `vue` `3.6.0-rc.15` | Nitropack `^2.13.6` + `h3@^1.15.11` (`h3` giữ v1 khớp Nitro 2); `overrides` hợp nhất `vue` về `3.6.0-rc.15` |
| DB | SQLite (`node:sqlite`) dev/test · Cloudflare D1 production | Node 26 built-in / D1 | Không có server DB cục bộ |
| ORM | Drizzle | `1.0.0-rc.5` (`drizzle-kit` `1.0.0-rc.5`, lockstep) | Driver SQLite/D1; singleton `drizzle()` một lần mỗi tiến trình/isolate |
| Ngôn ngữ | TypeScript | `~6.0.3` | Major cao nhất còn giữ JS Compiler API (`lib/typescript.js`) cho `vue-tsc@3.3.14` (`@volar/typescript` đòi `<7`) và `dependency-cruiser@18.8.0-beta-2` |
| Auth — trạng thái Nuxt của web | `nuxt-auth-utils` | `^0.6.2` | **Chỉ dùng trong `apps/web`**. Module seal opaque locator và cung cấp projection/`useUserSession`; identity/role/reauth/remember nằm trong Redis. Admin SPA chỉ gọi API tuyệt đối với `credentials: "include"`. Cookie session host-only, tuyệt đối 1 giờ; remember tuỳ chọn, tuyệt đối tối đa 365 ngày |
| Auth — OAuth/OIDC backend bridge | `openid-client` | `^6.9.0` | `packages/auth/src/oauth/` dùng cho discovery, PKCE, authorization URL, code exchange và token validation. Không dùng `defineOAuth*EventHandler` của `nuxt-auth-utils`, không đổi sang AuthJS và không tự viết protocol primitive |
| Auth — TOTP (Manager bắt buộc, User P2 tuỳ chọn) | `otpauth` | `^9.6.0` | Dùng cho sinh secret, URI và validate RFC 4226/6238; cấm dùng password helper của `nuxt-auth-utils`, tự viết HMAC/Base32/TOTP hoặc dùng `speakeasy` |
| HTTP hardening | `nuxt-security` + proxy headers | `^2.7.0` | `nuxt-security` chỉ khai ở `apps/web`; `apps/admin/public/_headers` đặt header cho admin static. Web giữ CSP/nonce, SRI, security headers (HSTS 1 năm + preload, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, COOP/CORP), CORS và request-size. **Tắt** rate limiter, CSRF và xssValidator của module; các contract đó thuộc `packages/cache`, `packages/auth`, Zod (`BR-SEC-04`) và `packages/moderation` |
| Env validation & Schema | `@t3-oss/env-nuxt` `^0.13.11` + `zod` `^4.6.7` | — | Zod 4 native (`z.toJSONSchema` tích hợp sẵn). Khai `env.ts` ở `apps/web` và `apps/admin` đồng bộ với `ENV_REGISTRY` (`@mindkid/config` giữ vai trò zero-dep validator trước `pnpm install`, xem [`env-contract.md`](../01-platform/env-contract.md)) |
| SEO | `@nuxtjs/seo` | `^5.3` (pin chính xác, không float `^`) | Bundle: `@nuxtjs/robots` `@nuxtjs/sitemap` `nuxt-og-image` (renderer **Takumi**, cài thêm `@takumi-rs/core`) `nuxt-schema-org` `nuxt-site-config`. Sitemap động qua `defineSitemapEventHandler()` + `chunks: 5000` (tính trước cho lúc scale ngàn trang). Thứ tự module: `@nuxt/ui` → `@nuxtjs/seo` → layer khác |
| UI kit | Nuxt UI v4 (`^4.12.2`) + Tailwind v4 (`^4.3.5`) | | Ép light-mode `pages/play/**` qua `middleware/force-play-light.global.ts` set `to.meta.colorMode = 'light'` (route-group, không phải `definePageMeta` từng file) |
| Form (admin) | `UForm` (Nuxt UI v4) + Zod 4 (Standard Schema, không cần adapter) | | Không có lib "Zod → form" đủ chín cho schema lồng nhau — hand-author field layout mỗi content type. `@norbiros/nuxt-auto-form` chỉ pilot cho form phẳng, chưa dùng critical path |
| Rich text (admin) | `Editor` component có sẵn trong Nuxt UI v4 (nền Tiptap 3) | | Set `starter-kit` về đúng bold/italic/link/heading. Lưu **markdown** (`html: false` khi render) thay vì HTML — biên an toàn tự nhiên hơn allowlist. Nếu chọn HTML: dùng `sanitize-html` server-side, không dùng `dompurify` server-side |
| Payment QR | Gọi `img.vietqr.io` (Quick Link API) trực tiếp | | Không tự sinh EMVCo/CRC16, không dùng package `vietqr` npm (stale từ 2022). Fetch + lưu PNG bytes lúc tạo order, không chỉ hotlink |
| Email — transport | `nodemailer` → AWS SES SMTP | `^10.6.0` | SMTP pool, TLS bắt buộc (587 STARTTLS hoặc 465 TLS wrapper). SMTP credential theo region và **không phải** AWS access key; quản lý ngoài repo. Không dùng `@aws-sdk/client-ses` cho đường gửi mail này |
| Email — template | `mjml` | `^5.4.1` | Template tĩnh trong repo, compile/validate strict; runtime chỉ nội suy biến typed đã escape. Không gọi MJML cloud API, không tracking pixel |
| Browser notification — hoãn P5 | FCM Web (`firebase` client; server gọi FCM HTTP v1 qua `fetch`, không cài `firebase-admin`) | `^13.3.0` / — | Đã chốt provider ở Task #84. FCM là best-effort; inbox nội bộ là nguồn xem lại, service worker và endpoint rotation do [`browser-push.md`](../01-platform/browser-push.md) sở hữu |
| Ảnh — xử lý server (không còn dùng trong `packages/storage`, giữ khai `onlyBuiltDependencies`/`allowBuilds` vì còn phụ thuộc bắc cầu `wrangler` → `miniflare` → `sharp`, đo bằng `pnpm why sharp` ngày 2026-11-25; gỡ khai khi cây không còn kéo sharp) | `sharp` | `^0.35.5` | Vẫn chuẩn 2026. pnpm: khai `onlyBuiltDependencies: [sharp]` ở `pnpm-workspace.yaml`. Docker: build native binary **trong** stage cùng base image runtime, không copy từ host |
| Ảnh — crop client | `vue-advanced-cropper` | | Vue-3-native, có `&lt;Preview&gt;` khớp yêu cầu "xem trước cỡ thật". Mount `&lt;ClientOnly&gt;` (SSR không đụng canvas) |
| Error tracking | `@sentry/nuxt` (SaaS Team tier) | | GlitchTip self-host là fallback nếu chi phí/lưu trú dữ liệu VN sau này bắt buộc — cùng giao thức ingest, đổi DSN là xong |
| Logging | `pino` + `pino-http` nối trực tiếp Nitro plugin | | Không dùng wrapper Nuxt (`nuxt-pino-log` bỏ hoang từ 2022) |
| Alert tới người | Healthchecks.io (free) cho liveness job/cron + Telegram Bot API (`fetch` thô) cho ngưỡng/crash | | Email chỉ là kênh dự phòng — VN dev quen Telegram hơn, tới nhanh hơn |
| Dependency-boundary | `dependency-cruiser` `18.8.0-beta-2` | | Duy nhất trong 4 lựa chọn khảo sát hỗ trợ cấm **thư viện ngoài cụ thể** theo từng zone (quy tắc `BR-MPA-01` của [`monorepo-package-architecture.md`](monorepo-package-architecture.md) — app không được import trực tiếp thư viện nền cho capability dùng chung từ ít nhất 2 app, phải qua package driver), không chỉ graph nội bộ |
| Gate chất lượng | **`lefthook` `^2.2.2`** (git hook local) | — | **Không cổng remote** — không GitHub Actions, GitLab CI hay Jenkins (quyết định người dùng 2026-08-06, xem §11 Q5). pnpm: khai **`allowBuilds: {lefthook: false}`** ở `pnpm-workspace.yaml` |
| Lint/format | `ultracite@~8.2.1` (**preset `ultracite/biome/core` + `ultracite/biome/vue`**) + `@biomejs/biome@~2.6.8` (**CLI chạy thật**) | Script `lint` gọi thẳng `biome check .`; `biome.jsonc` giữ nguyên tập rule baseline đã chốt (không bật các rule ngoài contract `BR-*` mà `ultracite` 8 mới thêm) |
| Test | Vitest `^5.1.0` · Playwright `1.65.1` · `fast-check` `^4.10.2` · `@axe-core/playwright` `^4.14.0` | | `@vitest/coverage-v8` ghim cứng cùng bản `5.1.0` với `vitest` |
| Storage | S3 SDK | giữ nguyên | |
| Deploy | Cloudflare Workers + D1 + Durable Objects (`D14`); không có Docker/dịch vụ ngoài cho dev (`D15`) | đổi theo `D14` | |

Version cụ thể ở bảng trên là **version tối thiểu được rà lại tại 2026-08-13**. Khi cài, lấy bản
vá/minor mới nhất cùng major đã chốt — không hạ version, không tự ý nhảy major (`BR-RBS-08`).
Nguồn nghiên cứu chi tiết không lặp lại ở đây theo [`CONVENTIONS.md`](../CONVENTIONS.md) (spec
khác link tới, không copy).

### 7.1a Chốt version chồng chéo và cổng dev — thêm 2026-08-29

`pnpm-workspace.yaml` sở hữu hai khối cấu hình dùng chung cho toàn monorepo:

| Khối | Dùng cho | Ghi chú |
|---|---|---|
| `overrides:` | Ép về **một** bản khi hai phụ thuộc kéo hai version | `BR-RBS-09`. Hiện có: `unhead`/`@unhead/vue` chốt `3.4.3`, `vue`/`@vue/shared` chốt `3.6.0-rc.15`, `@biomejs/biome` chốt `2.6.8` |
| `allowBuilds:` | Cho phép postinstall của native package | `lefthook: false` (§7.1 dòng "Gate chất lượng") |

Bộ icon local của kit khai trực tiếp trong `packages/ui/package.json` (`@iconify-json/lucide`) chứ không để Nuxt Icon gọi
`api.iconify.design` lúc chạy — xem `BR-DSC-23` của
[`design-system-contract.md`](../08-quality/design-system-contract.md).

Cổng dev (`BR-RBS-10`) — đây là cổng **máy trạm**, không phải bảng cổng production ở §7.3 của
[`release-deploy.md`](../01-platform/release-deploy.md) (production không có cổng cho
admin: Workers Static Assets phục vụ static trực tiếp):

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
Scenario: BR-RBS-03 — ca âm, gate chặn commit vi phạm
  Given một file .ts có `var x = 1` (rule biome không tự sửa được) được `git add`
  When chạy `git commit`
  Then job "biome-staged" thất bại và commit thất bại với exit code khác 0
  And HEAD không đổi
  And output in ra đường dẫn file kèm dòng vi phạm

Scenario: BR-RBS-03a — hook tự cài khi cài dependency
  Given repo vừa clone, .git/hooks/ chưa có pre-commit
  When chạy `pnpm install`
  Then lệnh exit 0
  And .git/hooks/pre-commit tồn tại
  And `lefthook version` in ra version của §7.1

Scenario: BR-RBS-02 — một scope package duy nhất
  When đọc package.json gốc và package.json của mọi thư mục trong apps/ và packages/
  Then mọi name khớp ^@mindkid/
  And pnpm-workspace.yaml không chứa scope nào khác

Scenario: BR-RBS-07 — (ngưng 2026-11-24) docker compose đúng version production
  When chạy `docker compose up -d` ở gốc repo
  Then Postgres báo version 18
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
- Pin version qua `engines` (root) và khai phiên bản tường minh đồng bộ trong từng `package.json` (`BR-RBS-06`).
- Chạy `pnpm check` và vitest của workspace đã đụng trước khi coi một thay đổi là xong (không còn `pre-push`).
- Thêm job vào `lefthook.yml` kèm ca âm đã đo.

**Ask first**
- Đổi major version bất kỳ dòng nào trong §7.1.
- Thêm dependency mới ngoài bảng §7.1 trước khi có spec cần nó.
- Thêm lại `pre-push` hoặc thêm job nặng vào `pre-commit` (§4 bước 6).

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
| 9 | Kích thước pool `postgres.js` (`max`) và `PG max_connections` phải tính theo **loại EC2 instance thật** (số vCPU × số instance; chỉ còn áp dụng cho chế độ dev/test, production dùng D1) — chưa chốt vì chưa biết instance type production | [`data-model-overview.md`](data-model-overview.md), deploy | Hoãn, chặn phase P1 | hoãn |
| ~~10~~ | ~~Chiến lược version control cho corpus spec~~ **Đóng 2026-08-09 (`D-U`)**: corpus spec ([`SPEC.md`](../../SPEC.md) + `docs/specs/` + `docs/tasks/` + `docs/taxonomy/` + `docs/montessori/`) nằm trong `mindkid/docs/`, cùng git repo và dòng lịch sử với code. `mindkid/SPEC.md` là symlink → `docs/SPEC.md` | — | Đã đóng | D-U |
| ~~11~~ | ~~Bật lại CI cổng tự động khi nào~~ **Đóng 2026-08-06**: không còn CI để bật. `BR-RBS-03` đo bằng hook thật + ca âm tại máy | — | Đã đóng | D-S (T1) |
| ~~12~~ | ~~Gate local bỏ qua được bằng `--no-verify`~~ **Đóng 2026-08-09 (`D-CL`)**: giữ lefthook làm phản hồi nhanh local; `main` cấm direct/force push, bắt buộc PR + ít nhất một approving human review và dismiss approval khi có commit mới. **Thay thế 2026-10-18**: `CLAUDE.md` mục "Git workflow" chốt commit thẳng vào `main`; không còn PR bắt buộc hay branch protection. Lefthook (`BR-RBS-03`) là gate duy nhất, `--no-verify` vẫn bỏ qua được | — | Đã đóng | D-CL (đã thay) |
