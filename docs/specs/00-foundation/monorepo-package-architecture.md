---
spec: MONOREPO-PACKAGE-ARCHITECTURE
title: Kiến trúc package/driver trong monorepo
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-29
owns:
  - Quy tắc khi nào tách package mới vs viết inline trong app
  - Pattern "driver" bọc thư viện bên thứ ba dùng chung nhiều app
  - Ranh giới phụ thuộc package ↔ package, package ↔ app
  - Bảng ánh xạ capability ↔ package ↔ thư viện nền
depends_on:
  - REPO-BOOTSTRAP
---

# Kiến trúc package/driver trong monorepo

## 1. Objective

Mục 0, quyết định D10 của [`SPEC.md`](../../SPEC.md) (ưu tiên adopt thư viện Nuxt ecosystem đã
kiểm chứng thay vì tự xây từ đầu) chốt: ưu tiên adopt thư viện có sẵn thay vì tự xây, nhưng khi
*có* xây — xây dạng **package driver** dùng chung nhiều app, không rải logic gọi thư viện
thẳng vào từng `apps/*`. File này sở hữu **quy tắc** đó — không sở hữu hành vi nghiệp vụ của
auth, cache hay queue (những spec đó vẫn sở hữu ở
[`auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md),
[`rate-limiting.md`](../01-platform/rate-limiting.md),
[`job-queue.md`](../01-platform/job-queue.md)).

Hai runtime app (`web`, `worker`) và một static admin SPA dùng chung cache, queue, và phần auth
do `web` sở hữu. Không có package
driver, ba app tự import thư viện nền theo cách riêng, và đổi thư viện sau này thành sửa ba
chỗ thay vì một.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Dev | Quyết định tách package mới theo §4, viết driver |
| AI codegen ([`ai-codegen-pipeline.md`](../01-platform/ai-codegen-pipeline.md)) | Sinh code gọi qua package driver, không tự import thư viện nền thẳng vào app |
| Reviewer | Chặn PR import thư viện nền trực tiếp vào `apps/*` khi đã có driver |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/*/src/index.ts` | Bề mặt export duy nhất của một driver — nơi duy nhất thư viện nền được import |
| `apps/*/package.json` | Khai `@mindkid/*`, không khai thư viện nền mà driver đã bọc |
| cổng tự động dependency-graph check | Chặn `apps/*` phụ thuộc ngược vào nhau, và chặn `apps/*` import thư viện nền đã có driver |

## 4. Main flow — quyết định tách package mới

1. Capability được dùng bởi **≥ 2 app** (vd cache dùng ở `web` + `worker`) → tách package.
2. Package bọc thư viện ngoài (driver) export **interface theo domain của dự án** — hàm,
   type đặt tên theo nghiệp vụ (`getCached`, `enqueueJob`, `requireUserAuth`), không export
   lại type/instance của thư viện nền nguyên trạng.
3. Driver chỉ mình nó import thư viện runtime nền. `apps/*` **không** `import` trực tiếp
   `iovalkey`/`ioredis`/`rate-limiter-flexible`/`bullmq`/`otpauth`/`openid-client`/
   `nodemailer`/`mjml` — chỉ import `@mindkid/cache`,
   `@mindkid/queue`, `@mindkid/auth`. `nuxt-auth-utils` là Nuxt module cấu hình theo §5:
   mỗi app được khai trực tiếp trong manifest/`nuxt.config`, và chỉ app được dùng auto-import
   session của module; domain contract không export hoặc import type vendor.
4. Đổi thư viện nền sau này (vd `ioredis` → `iovalkey`, hoặc BullMQ → lựa chọn khác) chỉ sửa
   trong **một** package + test của package đó xanh — không sửa call site ở `apps/*`.
5. Capability chỉ dùng ở **một** app, hoặc là cấu hình khai báo qua `nuxt.config` (không có
   logic gọi runtime cần tái dùng) → **không** cần driver, dùng thẳng trong app đó (§5).

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Nuxt module cấu hình thuần (SEO, sitemap, robots, OG-image) | Chỉ khai trong `nuxt.config`, không có call site logic dùng lại ở app khác | **Không** bọc driver — cấu hình trực tiếp trong `apps/web/nuxt.config.ts` |
| Nuxt auth module cần auto-import/composable của từng app | Module phải đăng ký trong Nuxt app để sinh integration runtime | Chỉ khai `nuxt-auth-utils` trong `apps/web`; sealed cookie chỉ giữ locator, còn Redis session/remember, CSRF và domain type đi qua `@mindkid/auth`. Admin static dùng API client |
| Capability dùng ở đúng 1 app hiện tại nhưng roadmap ghi sẽ dùng ở app thứ 2 | Vd `packages/storage` (S3) hiện chỉ `apps/admin` dùng, `apps/web` sẽ dùng ở P2 | Tách package **ngay** — tách sau khi có app thứ hai là refactor lại toàn bộ call site |
| Driver cần thay thư viện nền nhưng interface cũ không còn diễn tả được API mới | Vd chuyển từ client kiểu ioredis sang client kiểu khác hẳn (mảng thay vì spread arg) | Giữ nguyên interface hướng ra ngoài package (§4 bước 2); viết adapter bên trong driver — không đổi chữ ký hàm ở mọi call site |
| Package driver phình quá 800 dòng | Kiểm tra định kỳ | Tách theo sub-module trong cùng package (`src/session.ts`, `src/oauth.ts`), **không** tách thành package mới nếu vẫn phục vụ một capability |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MPA-01` | `apps/*` **NEVER** import trực tiếp thư viện nền cho capability dùng chung ≥ 2 app — luôn qua package driver ở `@mindkid/*` | Import rải rác làm đổi thư viện nền thành việc sửa N chỗ |
| `BR-MPA-02` | Driver **export interface theo domain dự án**, không export lại type/instance thư viện nền nguyên trạng ra ngoài package | Rò rỉ type thư viện nền ra app làm app khoá cứng vào thư viện đó dù có driver |
| `BR-MPA-03` | Đổi thư viện nền chỉ sửa **trong** driver + test của package đó, **NEVER** sửa call site ở `apps/*` | Đây là lý do tồn tại của driver — nếu vẫn phải sửa app thì driver không có tác dụng |
| `BR-MPA-04` | Nuxt module cấu hình thuần qua `nuxt.config` (không có call site logic runtime) **NEVER** bị ép bọc driver | Bọc driver cho thứ chỉ là cấu hình khai báo là phức tạp hoá không cần thiết |
| `BR-MPA-05` | Package mới bắt buộc có **một** capability rõ trong tên — áp dụng luật "một outcome một file" của mục 1 của [`CONVENTIONS.md`](../CONVENTIONS.md) cho package | Package gộp nhiều capability (`utils`, `common`) là nơi code chết tích tụ |
| `BR-MPA-06` | `packages/*` **NEVER** phụ thuộc ngược vào `apps/*`; cổng tự động kiểm bằng dependency-graph check | Phụ thuộc ngược tạo chu trình, packages không còn tái dùng được độc lập |
| `BR-MPA-07` | Hai `apps/*` **NEVER** phụ thuộc thẳng vào nhau — chia sẻ luôn qua `packages/*` | `apps/admin` gọi thẳng code của `apps/web` là dấu hiệu thiếu một package |
| `BR-MPA-08` | Cấm parent-relative (`../`) module specifier, cấm relative import xuyên package, bắt buộc dùng đúng alias token canonical của từng cây (`~` cho app, `#server` cho web nitro, `#src`/`#tests`/`#scripts` cho `packages/*`) | Import tương đối sâu làm vỡ liên kết khi di chuyển file và che giấu cấu trúc module |
| `BR-MPA-09` | Barrel mà code client (`apps/*/app/**`) import **NEVER** được với tới `node:` builtin hay package chỉ chạy máy chủ, kể cả **gián tiếp**. Package nào vừa phục vụ máy chủ vừa phục vụ trình duyệt phải mở entry thứ hai `./client` chỉ chứa tập con an toàn | Vite **không tree-shake ở chế độ dev**: một trang Vue import barrel là kéo cả cụm máy chủ vào bundle trình duyệt. Đo 2026-08-29 trên `@mindkid/shared`: 11/56 module chạm `node:fs/path/zlib/buffer/crypto` hoặc `@mindkid/config`, `@mindkid/cache`, `@mindkid/auth`, `@mindkid/moderation`; `apps/web` chết lúc khởi tạo (`does not provide an export named 'randomBytes'`) và bản build ship nguyên native addon argon2 xuống trình duyệt |
| `BR-MPA-10` | Native addon (CommonJS + `node-gyp-build`, ví dụ `argon2`) bắt buộc khai external trong `nitro.externals.external` của app nào có nó trong cây phụ thuộc | Nó tới qua workspace package nên Nitro inline mặc định; thân CJS giữ nguyên `__dirname` và server build ESM chết ngay lúc khởi động: `__dirname is not defined in ES module scope` |

## 7. Data

### 7.1 Bảng ánh xạ capability ↔ package ↔ thư viện nền

**Sửa 2026-08-06** sau nghiên cứu: cột "thư viện nền" của Cache và Queue đổi `iovalkey` sang
`ioredis` (không có chỗ dùng thật cho `iovalkey` trong stack này — xem mục 7.1 của
[`repo-bootstrap.md`](repo-bootstrap.md)). **Sửa 2026-08-13**: auth browser đổi sang opaque
cookie session; `nuxt-auth-utils` chỉ giữ locator/projection, còn `packages/auth` sở hữu Redis
adapter fail-closed và vẫn là một driver domain dùng chung. MindKid không còn dependency trực
tiếp `jose`; mọi first-party auth credential đều opaque.

| Capability | Package driver | Thư viện nền | Spec sở hữu hành vi |
|---|---|---|---|
| Auth session + OAuth (`apps/web` sở hữu API) | `packages/auth` cho opaque session/remember/challenge, Redis adapter và CSRF/domain guard; admin chỉ gọi API | `ioredis` client riêng fail-closed + `nuxt-auth-utils` (sealed locator/projection) + `otpauth` + `openid-client`; không `jose` | [`auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md), [`oauth-provider-registry.md`](../01-platform/oauth-provider-registry.md) |
| Cache + rate limit | `packages/cache` | Cache: `unstorage` driver `redis`; rate limit: `rate-limiter-flexible`; mỗi adapter giữ client **`ioredis`** process-long, không tạo theo request | [`rate-limiting.md`](../01-platform/rate-limiting.md) |
| Queue | `packages/queue` (định nghĩa job + producer) · `apps/worker` (consumer, Nitro plugin) | BullMQ, connection object thường (tự dựng **`ioredis`** nội bộ) | [`job-queue.md`](../01-platform/job-queue.md) |
| Payment QR | `packages/payment` (nếu ≥2 app cần) hoặc inline `apps/web/server` (nếu chỉ web) | Gọi API `img.vietqr.io`, không thư viện QR local | [`payment-order-create.md`](../03-account/payment-order-create.md) |
| Email | `packages/notification` | `nodemailer` SMTP transport tới AWS SES + `mjml` renderer | [`notification-service.md`](../01-platform/notification-service.md) |
| Browser push (P5) | `packages/notification` cho server driver; plugin/service worker trong `apps/web` | `firebase-admin` (server) + `firebase` (web); chỉ cài khi Task #84 bắt đầu | [`browser-push.md`](../01-platform/browser-push.md) |
| HTTP hardening | **Không cần driver** — cấu hình tại web và Nginx | `nuxt-security` ở web; Nginx header/static ở admin, tắt limiter/CSRF tích hợp | [`security-checklist.md`](../08-quality/security-checklist.md) |
| Storage ảnh | `packages/storage` | S3 SDK + `sharp` (xử lý server) | [`image-storage.md`](../01-platform/image-storage.md) |
| Error tracking | **Không cần driver riêng** — SDK gắn ở entry mỗi app | `@sentry/nuxt` | [`monitoring-and-alerting.md`](../01-platform/monitoring-and-alerting.md) |
| Logging | `packages/config` (factory logger dùng chung) hoặc `packages/observability` nếu tách | `pino` + `pino-http` (Nitro plugin) | [`monitoring-and-alerting.md`](../01-platform/monitoring-and-alerting.md) |
| Alert tới người | `apps/worker` (job định kỳ ping) + script cổng tự động | Healthchecks.io (`fetch` ping) + Telegram Bot API (`fetch` thô) | [`monitoring-and-alerting.md`](../01-platform/monitoring-and-alerting.md), [`job-queue.md`](../01-platform/job-queue.md) |
| Taxonomy | `packages/taxonomy` | Pure TS, không thư viện ngoài | [`taxonomy-service.md`](../01-platform/taxonomy-service.md) |
| Emoji | `packages/emoji` | Pure TS + data, port từ v1 | [`emoji-registry.md`](../01-platform/emoji-registry.md) |
| Game engine | `packages/game-engine` | Canvas 2D thuần TS, port từ v1 | [`game-template-contract.md`](../01-platform/game-template-contract.md), [`game-engine-runtime.md`](../01-platform/game-engine-runtime.md) |
| Adaptive | `packages/adaptive` | Pure TS (BKT/ZPD), không thư viện ngoài | [`adaptive-engine.md`](../01-platform/adaptive-engine.md) |
| SEO / sitemap / OG-image / schema.org | **Không cần driver** — cấu hình `nuxt.config.ts` trong `apps/web` | `@nuxtjs/seo` (+ `@takumi-rs/core`) | [`seo-and-structured-data.md`](../02-public/seo-and-structured-data.md) |
| Form sinh từ schema (admin) | **Không cần driver** — dùng trực tiếp trong `apps/admin` | `UForm` (Nuxt UI v4) + Zod 4 | [`schema-driven-form.md`](../06-admin/schema-driven-form.md) |
| Rich text hạn chế (admin) | **Không cần driver** — dùng trực tiếp trong `apps/admin` | `Editor` (Nuxt UI v4, nền Tiptap 3) | [`seo-content-admin.md`](../06-admin/seo-content-admin.md) |
| DB | `packages/db` | Drizzle + driver `postgres.js` | [`data-model-overview.md`](../01-platform/data-model-overview.md) và các `schema-*` |
| Kiểm duyệt nội dung UGC (P4, ngoài MVP) | `packages/moderation` | **Chưa chốt** — tự xây danh sách đóng tiếng Việt hay API bên thứ ba, xem [`custom-game-builder.md`](../07-addon/custom-game-builder.md) Q4 (`D-CF`) | [`custom-game-builder.md`](../07-addon/custom-game-builder.md) `BR-CGB-09` |

Package không thuộc bảng trên (`shared`, `config`, `ui`) không bọc thư viện nền theo nghĩa
driver — `shared` chỉ chứa Zod/type/constant, `config` chỉ chứa preset, `ui` là Nuxt Layer
UI kit. Xem mục 8.1 của [`SPEC.md`](../../SPEC.md) cho ranh giới đầy đủ của từng package.

`packages/payment`, `packages/notification` là **package mới** chưa có trong cây thư mục ở
mục 8 của [`SPEC.md`](../../SPEC.md) — thêm vào khi port/dựng thật, đúng theo quy tắc
`BR-MPA-01` (`apps/*` không được import trực tiếp thư viện nền cho capability dùng chung từ
ít nhất 2 app, luôn qua package driver): capability dùng ≥2 app thì tách; nếu MVP chỉ
`apps/web` cần thì để inline, tách khi `apps/admin` cần dùng lại — vd gửi email từ admin khi
duyệt thanh toán.

### 7.2 Ví dụ vi phạm thường gặp

| Sai | Đúng |
|---|---|
| `apps/worker` import `bullmq` trực tiếp để enqueue | `apps/worker` chỉ **consume**; enqueue đi qua `packages/queue` từ `apps/web` |
| `apps/web/server/api/*` gọi `new Redis(...)` (`ioredis`/`iovalkey`) để cache thủ công | Gọi `packages/cache` — package đó là nơi duy nhất khởi tạo client Valkey |
| `apps/admin` import server package, `ioredis`, `@mindkid/db` hoặc session module | Admin là static SPA; chỉ dùng API client và type/UI package, không chứa auth authority hay DB access |
| `apps/web/server/api/*` import `../../../../../utils/auth-runtime` | Dùng `#server/utils/auth-runtime` |
| `packages/shared` import `../../cache/src/index` | Dùng `@mindkid/cache` |
| `apps/admin` import `@/components/...` song song `~/components/...` | Chỉ dùng `~/components/...` làm alias canonical |

## 8. API contract

Không sở hữu route. Ràng buộc áp lên **bề mặt export của mọi package driver**:

| Ràng buộc | |
|---|---|
| Export | Chỉ qua bề mặt **được khai trong `exports`**: `.` (`src/index.ts`) và — chỉ khi `BR-MPA-09` bắt buộc — `./client` (`src/client.ts`). Cấm import path sâu vào nội bộ (`@mindkid/cache/internal/*`, `@mindkid/auth/errors`) từ ngoài package |
| Naming | Hàm/type theo domain dự án (tiếng Anh, `camelCase`/`PascalCase`) — không theo tên API thư viện nền |
| Side effect lúc import | Không kết nối mạng khi module được import — khởi tạo lazy trong hàm gọi đầu tiên |
| Import specifier | Không dùng `../` leo tầng; dùng alias token canonical của từng cây (`~` cho app, `#server` cho web nitro, `#src`/`#tests`/`#scripts` cho package, `@mindkid/*` cho cross-package) |

Ví dụ mẫu — `packages/cache/src/index.ts`:

```ts
// packages/cache/src/index.ts — driver, KHÔNG export instance unstorage/iovalkey ra ngoài
import { createStorage } from "unstorage";
import redisDriver from "unstorage/drivers/redis";

let storage: ReturnType<typeof createStorage> | undefined;

function getStorage() {
  storage ??= createStorage({ driver: redisDriver({ host: process.env.VALKEY_HOST }) });
  return storage;
}

export async function getCached<T>(key: string): Promise<T | null> {
  return (await getStorage().getItem<T>(key)) ?? null;
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await getStorage().setItem(key, value, { ttl: ttlSeconds });
}
```

## 9. Acceptance criteria

```gherkin
Scenario: BR-MPA-01 — app không import thư viện nền trực tiếp
  When quét import trong apps/web, apps/admin, apps/worker
  Then không file runtime nào import "iovalkey", "ioredis", "rate-limiter-flexible", "bullmq", "otpauth", "openid-client", "nodemailer", hoặc "mjml" trực tiếp
  And mọi truy cập đi qua "@mindkid/cache", "@mindkid/queue", "@mindkid/auth", hoặc "@mindkid/notification"
  And toàn repo không có direct dependency hoặc import "jose"
  And "nuxt-auth-utils" chỉ xuất hiện trong manifest, Nuxt module config hoặc app-local integration của hai app
  And "#auth-utils" chỉ xuất hiện trong type augmentation của từng app

Scenario: BR-MPA-06 — packages không phụ thuộc ngược apps
  When chạy dependency-graph check trong cổng tự động
  Then không package nào trong packages/* có import từ apps/*

Scenario: BR-MPA-03 — đổi thư viện nền không đụng call site
  Given packages/cache đổi từ driver redis sang driver khác của unstorage
  When chạy test của apps/web không đổi gì
  Then toàn bộ test apps/web vẫn pass mà không sửa file nào trong apps/web

Scenario: BR-MPA-04 — module cấu hình thuần không bị ép bọc driver
  When rà soát packages/*
  Then không có package nào chỉ chứa lại cấu hình @nuxtjs/seo không có logic gì thêm

Scenario: BR-MPA-09 — bundle trình duyệt không chứa code máy chủ
  When build production apps/web rồi quét mọi chunk trong .output/public/_nuxt
  Then không chunk nào chứa "node-gyp-build", "__dirname", hay thân CJS của argon2
  And không chunk nào tham chiếu "node:fs", "node:crypto", hay "node:zlib"

Scenario: BR-MPA-09 — ca âm, dev phải chết chứ không im lặng
  Given một trang Vue import barrel "." của package có module chạm node: builtin
  When mở trang đó bằng trình duyệt trên dev server
  Then console có SyntaxError "__vite-browser-external"
  And Cấm — NEVER coi "pnpm build" exit 0 là bằng chứng client sạch: Rollup tree-shake được node: builtin ở prod trong khi dev vẫn vỡ

Scenario: BR-MPA-09 — entry ./client không rò ngược
  When quét mọi "export * from" trong packages/*/src/client.ts
  Then không module nào trong danh sách đó import node: builtin
  And không module nào import @mindkid/config, @mindkid/cache, @mindkid/auth, @mindkid/db, @mindkid/queue, @mindkid/storage, @mindkid/notification, hay @mindkid/moderation
  And phép kiểm chạy trên bao đóng bắc cầu, không chỉ import trực tiếp

Scenario: BR-MPA-10 — server build khởi động được
  When build apps/web rồi chạy node .output/server/index.mjs
  Then tiến trình không ném ReferenceError "__dirname is not defined in ES module scope"
  And GET / trả 200

Scenario: BR-MPA-08 — không dùng relative import leo tầng và dùng đúng alias canonical
  When quét module specifier trong apps/ và packages/
  Then không file nào chứa parent-relative specifier "../"
  And không có relative import xuyên package
  And apps/ chỉ dùng alias canonical ("~", "~~", "#server")
  And packages/ chỉ dùng Node subpath imports ("#src/*", "#tests/*", "#scripts/*")
```

## 10. Boundaries

**Always**
- Tách package khi capability dùng ở ≥ 2 app.
- Export interface theo domain dự án, giấu thư viện nền sau `src/index.ts`.
- Đo bundle client bằng bản build **và** bằng console trình duyệt ở dev — hai chế độ hỏng khác nhau.
- Chạy dependency-graph check trong cổng tự động mỗi PR.
- Dùng alias canonical của từng cây thay cho `../`.

**Ask first**
- Gộp hai package đã tách làm một.
- Đổi thư viện nền của một driver đã có nhiều call site.
- Thêm package mới không nằm trong danh sách `../../SPEC.md` §8.

**Never**
- Để `apps/*/app/**` import barrel `.` của package có module chạm `node:` builtin — dùng `./client`.
- Thêm entry `./client` cho package thuần dữ liệu chỉ để "cho gọn": entry thứ hai chỉ mở khi `BR-MPA-09` bắt buộc.
- Import thư viện nền thẳng vào `apps/*` khi đã có driver cho nó.
- Export type/instance của thư viện nền nguyên trạng ra ngoài package driver.
- Để `packages/*` phụ thuộc vào `apps/*`, hoặc hai `apps/*` phụ thuộc thẳng vào nhau.
- Dùng parent-relative import (`../`) hoặc relative import xuyên package thay cho alias canonical.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Dependency-graph check chạy bằng công cụ nào~~ **Đóng 2026-08-06 (`D-DI`)**: `dependency-cruiser ^18.1` — duy nhất hỗ trợ cấm thư viện ngoài cụ thể theo zone (`BR-MPA-01`), không chỉ graph nội bộ. Xem mục 7.1 của [`repo-bootstrap.md`](repo-bootstrap.md) | — | Đã đóng | D-DI |
| ~~2~~ | ~~Tách `packages/auth-oauth`/`packages/auth-jwt`?~~ **Đóng 2026-08-09, sửa 2026-08-13 (`D-DJ`)**: giữ **một** `packages/auth` sở hữu opaque session/remember/challenge Redis adapter, CSRF và OAuth bridge. `nuxt-auth-utils` chỉ khai ở `apps/web`; admin static dùng API client. Không có first-party JWT, không direct dependency `jose`, không phát sinh package auth thứ hai | — | Đã đóng | D-DJ |
| ~~3~~ | ~~Tách `packages/payment` và `packages/notification` ngay từ đầu hay inline~~ **Đóng 2026-08-06 (T9)**: **inline** tới khi `apps/admin` cần dùng lại. Tách sớm tạo package rỗng; inline trước rồi extract khi có 2 consumer | — | Đã đóng | D-X (T9) |
| ~~4~~ | ~~§8 cho phép mấy cửa export mỗi package?~~ **Đóng 2026-08-29**: giữ `.` là cửa mặc định, mở thêm **đúng một** cửa `./client` và **chỉ khi** `BR-MPA-09` bắt buộc. Lý do: một cửa duy nhất ép trang Vue nuốt cả 11 module máy chủ trong barrel `@mindkid/shared` — `apps/web` chết lúc khởi tạo, bản build ship native addon argon2 xuống trình duyệt. Đo trước khi nới: phía máy chủ **146** import site, phía client **17**, nên đổi phía client rẻ hơn và không đụng ranh giới driver. `biome.jsonc` nới `noBarrelFile` cho `packages/*/src/client.ts` kèm lý do. Cấm — NEVER coi đây là giấy phép cho import path sâu vào internal | Bundle client của `apps/web` | Đã đóng | — |
