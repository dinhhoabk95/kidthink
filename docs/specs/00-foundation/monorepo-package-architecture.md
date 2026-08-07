---
spec: MONOREPO-PACKAGE-ARCHITECTURE
title: Kiến trúc package/driver trong monorepo
area: foundation
status: approved
mvp: true
phase: P0
reviewed: 2026-08-06
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

Ba app (`web`, `admin`, `worker`) dùng chung cache, queue, và một phần auth. Không có package
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
| `apps/*/package.json` | Khai `@kidthink/*`, không khai thư viện nền mà driver đã bọc |
| cổng tự động dependency-graph check | Chặn `apps/*` phụ thuộc ngược vào nhau, và chặn `apps/*` import thư viện nền đã có driver |

## 4. Main flow — quyết định tách package mới

1. Capability được dùng bởi **≥ 2 app** (vd cache dùng ở `web` + `worker`) → tách package.
2. Package bọc thư viện ngoài (driver) export **interface theo domain của dự án** — hàm,
   type đặt tên theo nghiệp vụ (`getCached`, `enqueueJob`, `requireUserAuth`), không export
   lại type/instance của thư viện nền nguyên trạng.
3. Driver chỉ mình nó import thư viện nền. `apps/*` **không** `import` trực tiếp
   `iovalkey`/`ioredis`/`bullmq`/`nuxt-auth-utils` — chỉ import `@kidthink/cache`,
   `@kidthink/queue`, `@kidthink/auth`.
4. Đổi thư viện nền sau này (vd `ioredis` → `iovalkey`, hoặc BullMQ → lựa chọn khác) chỉ sửa
   trong **một** package + test của package đó xanh — không sửa call site ở `apps/*`.
5. Capability chỉ dùng ở **một** app, hoặc là cấu hình khai báo qua `nuxt.config` (không có
   logic gọi runtime cần tái dùng) → **không** cần driver, dùng thẳng trong app đó (§5).

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Nuxt module cấu hình thuần (SEO, sitemap, robots, OG-image) | Chỉ khai trong `nuxt.config`, không có call site logic dùng lại ở app khác | **Không** bọc driver — cấu hình trực tiếp trong `apps/web/nuxt.config.ts` |
| Capability dùng ở đúng 1 app hiện tại nhưng roadmap ghi sẽ dùng ở app thứ 2 | Vd `packages/storage` (S3) hiện chỉ `apps/admin` dùng, `apps/web` sẽ dùng ở P2 | Tách package **ngay** — tách sau khi có app thứ hai là refactor lại toàn bộ call site |
| Driver cần thay thư viện nền nhưng interface cũ không còn diễn tả được API mới | Vd chuyển từ client kiểu ioredis sang client kiểu khác hẳn (mảng thay vì spread arg) | Giữ nguyên interface hướng ra ngoài package (§4 bước 2); viết adapter bên trong driver — không đổi chữ ký hàm ở mọi call site |
| Package driver phình quá 800 dòng | Kiểm tra định kỳ | Tách theo sub-module trong cùng package (`src/session.ts`, `src/oauth.ts`), **không** tách thành package mới nếu vẫn phục vụ một capability |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MPA-01` | `apps/*` **NEVER** import trực tiếp thư viện nền cho capability dùng chung ≥ 2 app — luôn qua package driver ở `@kidthink/*` | Import rải rác làm đổi thư viện nền thành việc sửa N chỗ |
| `BR-MPA-02` | Driver **export interface theo domain dự án**, không export lại type/instance thư viện nền nguyên trạng ra ngoài package | Rò rỉ type thư viện nền ra app làm app khoá cứng vào thư viện đó dù có driver |
| `BR-MPA-03` | Đổi thư viện nền chỉ sửa **trong** driver + test của package đó, **NEVER** sửa call site ở `apps/*` | Đây là lý do tồn tại của driver — nếu vẫn phải sửa app thì driver không có tác dụng |
| `BR-MPA-04` | Nuxt module cấu hình thuần qua `nuxt.config` (không có call site logic runtime) **NEVER** bị ép bọc driver | Bọc driver cho thứ chỉ là cấu hình khai báo là phức tạp hoá không cần thiết |
| `BR-MPA-05` | Package mới bắt buộc có **một** capability rõ trong tên — áp dụng luật "một outcome một file" của mục 1 của [`CONVENTIONS.md`](../CONVENTIONS.md) cho package | Package gộp nhiều capability (`utils`, `common`) là nơi code chết tích tụ |
| `BR-MPA-06` | `packages/*` **NEVER** phụ thuộc ngược vào `apps/*`; cổng tự động kiểm bằng dependency-graph check | Phụ thuộc ngược tạo chu trình, packages không còn tái dùng được độc lập |
| `BR-MPA-07` | Hai `apps/*` **NEVER** phụ thuộc thẳng vào nhau — chia sẻ luôn qua `packages/*` | `apps/admin` gọi thẳng code của `apps/web` là dấu hiệu thiếu một package |

## 7. Data

### 7.1 Bảng ánh xạ capability ↔ package ↔ thư viện nền

**Sửa 2026-08-06** sau nghiên cứu: cột "thư viện nền" của Cache và Queue đổi `iovalkey` →
`ioredis` (không có chỗ dùng thật cho `iovalkey` trong stack này — xem mục 7.1 của
[`repo-bootstrap.md`](repo-bootstrap.md)). Auth xác nhận dùng **chung một driver cho cả 2
app**, không tách.

| Capability | Package driver | Thư viện nền | Spec sở hữu hành vi |
|---|---|---|---|
| Auth session + OAuth (cả `apps/web` và `apps/admin`) | `packages/auth` | `nuxt-auth-utils` (OAuth, session) + `otpauth` (TOTP Manager) + `jose` (JWT service-to-service) | [`auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md), [`oauth-provider-registry.md`](../01-platform/oauth-provider-registry.md) |
| Cache + rate limit | `packages/cache` | `unstorage` (driver `redis`) trên Valkey 9, client **`ioredis`** | [`rate-limiting.md`](../01-platform/rate-limiting.md) |
| Queue | `packages/queue` (định nghĩa job + producer) · `apps/worker` (consumer, Nitro plugin) | BullMQ, connection object thường (tự dựng **`ioredis`** nội bộ) | [`job-queue.md`](../01-platform/job-queue.md) |
| Payment QR | `packages/payment` (nếu ≥2 app cần) hoặc inline `apps/web/server` (nếu chỉ web) | Gọi API `img.vietqr.io`, không thư viện QR local | [`payment-order-create.md`](../03-account/payment-order-create.md) |
| Email | `packages/notification` | `@aws-sdk/client-ses` | [`notification-service.md`](../01-platform/notification-service.md) |
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
| `apps/admin` import kiểu `UserSession` từ `nuxt-auth-utils` thẳng | Import type domain (`AuthenticatedUser`) export từ `packages/auth` |

## 8. API contract

Không sở hữu route. Ràng buộc áp lên **bề mặt export của mọi package driver**:

| Ràng buộc | |
|---|---|
| Export | Chỉ qua `src/index.ts`, không import path sâu (`@kidthink/cache/internal/*`) từ ngoài package |
| Naming | Hàm/type theo domain dự án (tiếng Anh, `camelCase`/`PascalCase`) — không theo tên API thư viện nền |
| Side effect lúc import | Không kết nối mạng khi module được import — khởi tạo lazy trong hàm gọi đầu tiên |

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
  Then không file nào import "iovalkey", "ioredis", "bullmq", hoặc "nuxt-auth-utils" trực tiếp
  And mọi truy cập đi qua "@kidthink/cache", "@kidthink/queue", hoặc "@kidthink/auth"

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
```

## 10. Boundaries

**Always**
- Tách package khi capability dùng ở ≥ 2 app.
- Export interface theo domain dự án, giấu thư viện nền sau `src/index.ts`.
- Chạy dependency-graph check trong cổng tự động mỗi PR.

**Ask first**
- Gộp hai package đã tách làm một.
- Đổi thư viện nền của một driver đã có nhiều call site.
- Thêm package mới không nằm trong danh sách `../../SPEC.md` §8.

**Never**
- Import thư viện nền thẳng vào `apps/*` khi đã có driver cho nó.
- Export type/instance của thư viện nền nguyên trạng ra ngoài package driver.
- Để `packages/*` phụ thuộc vào `apps/*`, hoặc hai `apps/*` phụ thuộc thẳng vào nhau.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Dependency-graph check chạy bằng công cụ nào~~ **Đóng 2026-08-06**: `dependency-cruiser ^18.1` — duy nhất hỗ trợ cấm thư viện ngoài cụ thể theo zone (`BR-MPA-01`), không chỉ graph nội bộ. Xem mục 7.1 của [`repo-bootstrap.md`](repo-bootstrap.md) | — | Hoãn, chặn phase P1 | hoãn |
| ~~2~~ | ~~Tách `packages/auth-oauth`/`packages/auth-jwt`?~~ **Đóng 2026-08-06**: giữ **một** `packages/auth` — `nuxt-auth-utils` dùng chung cho cả 2 app, `jose` chỉ phần service-to-service riêng biệt trong cùng package. Không cần tách vì không có 2 cơ chế song song nữa | — | Hoãn, chặn phase P1 | hoãn |
| ~~3~~ | ~~Tách `packages/payment` và `packages/notification` ngay từ đầu hay inline~~ **Đóng 2026-08-06 (T9)**: **inline** tới khi `apps/admin` cần dùng lại. Tách sớm tạo package rỗng; inline trước rồi extract khi có 2 consumer | — | Đã đóng | D-X (T9) |
