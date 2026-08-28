# Task #110 — Env: một nền chung, ba mẫu, không thêm cổng

## 1. Vì sao

Đo ngày 2026-08-28, ba sự thật:

1. **Bộ nạp `.env` che mất file gốc.** `packages/config/src/require-env.ts` đi ngược từ
   `process.cwd()` lên, gặp `.env` **đầu tiên** thì dừng. `pnpm dev` chạy với cwd `apps/web`
   nên nạp `apps/web/.env` — **hai** tên — rồi dừng; `.env` gốc **44** tên không bao giờ được
   nạp. `SITE_URL`, `DATABASE_URL`, `MFA_ENCRYPTION_KEY`, `PARENT_GATE_SECRET` chỉ còn trông
   vào shell của người chạy. Đây không phải chuyện thẩm mỹ: nó là cấu hình đúng một nửa, đúng
   loại lỗi mà [`env-contract.md`](../specs/01-platform/env-contract.md) §1 nói là đắt nhất.

2. **`.env` gốc lệch registry hai chiều.** Thừa `WEB_JWT_SECRET`, `ADMIN_JWT_SECRET` — cả hai
   nằm trong `DEPRECATED_ENV_NAMES` của `packages/gates/src/lint-env-names.ts`. Thiếu tám tên:
   `TRUSTED_PROXY_IPS`, `NUXT_PUBLIC_API_BASE_URL`, `BACKUP_S3_*` (sáu).

3. **Không có mẫu cho ba file env máy chủ.** `.env.example` ở gốc gộp cả **51** tên của ba
   tiến trình, trong khi `infra/pm2/ecosystem.config.cjs` và `infra/scripts/lib/build.sh` đòi
   **mỗi tiến trình một file đầy đủ và tách bạch** (`BR-SUP-04`, `BR-ENV-04`). Người vận hành
   viết `/etc/mindkid/env/worker.env` phải tự lọc tay 51 dòng — và một lần lọc thừa là worker
   cầm khoá session nó Cấm — NEVER được đọc.

## 2. Quyết định kiến trúc

**Phân lớp, nạp từ gần ra xa. Không thêm dòng code xử lý nào.**

- `.env` ở gốc = nền chung của monorepo trên máy trạm.
- `apps/<app>/.env` = **tuỳ chọn**, chỉ tạo khi một tên phải khác nhau giữa các app.
- Bộ nạp đi từ `cwd` lên và nạp **mọi** `.env` gặp trên đường. `process.loadEnvFile` Cấm — NEVER
  ghi đè một tên đã có giá trị (đo trực tiếp: biến export sẵn trong shell thắng nội dung file),
  nên file gần `cwd` nhất tự thắng và file gốc chỉ lấp chỗ trống. Thay đổi là **xoá** `break`
  và biến `loaded`: ít dòng hơn bản cũ.
- Cấm — NEVER dùng `nuxt dev --dotenv`, Cấm — NEVER thêm `--env-file` vào script, Cấm — NEVER
  thêm thư viện. Cả hai `nuxt.config.ts` đã `import { requireEnv } from "@mindkid/config"` ở
  dòng đầu, nên bộ nạp chạy trước khi Nitro áp env override cho `runtimeConfig`.
- `.env.example` sinh thêm bản theo từng app, lọc bằng trường `apps` đã có sẵn trong registry.

**Cấm — NEVER thêm cổng mới, Cấm — NEVER thêm `BR-ENV-14`.** `BR-ENV-09` đã phủ ".env.example
sinh từ registry, cấm sửa tay"; giờ nó sinh bốn file thay vì một. Chỉ tham số hoá test đã có.

## 3. Việc

| # | Việc | File |
| - | ---- | ---- |
| T1 | Bộ nạp phân lớp + ca âm | `packages/config/src/require-env.ts`, `packages/config/tests/require-env.test.ts` |
| T2 | Sinh `.env.example` theo app | `packages/config/scripts/generate-env-example.ts`, `packages/config/tests/env-example.test.ts` |
| T3 | Dọn `.env` máy trạm, bỏ hai file app lạc | `.env`, `apps/web/.env`, `apps/admin/.env` |
| T4 | Spec + cổng thật | `docs/specs/01-platform/env-contract.md` |

## 4. Ranh giới

Cấm — NEVER đổi `ENV_REGISTRY` (thêm, bớt, đổi tên biến) — chạm vào đó là chạm `BR-ENV-10` và
chạm luôn `infra/scripts/tests/run.sh`, nơi string-replace đúng literal khai báo `ENV_REGISTRY`.
Cấm — NEVER đụng `infra/scripts/**`, `infra/pm2/**`, `validate-env-file.ts`, `env-file.ts`.
Cấm — NEVER thêm thư viện dotenv; chỉ dùng `process.loadEnvFile` của Node 24.

## 5. Phát hiện thêm, chưa xử ở task này

| Việc | Chỗ |
| ---- | --- |
| `MINDKID_SSH_HOST` đọc mà không có trong registry (vi phạm `BR-ENV-01`) | `scripts/deploy/cli.ts` |
| `DB_TRUNCATE_ON_SETUP` đọc mà không có trong registry | `packages/db/tests/global-setup.ts` |
| `docker-compose.smoke.yml` thiếu bốn biến `BACKUP_S3_*` mà `offsite.ts` gọi `requireEnv` | smoke |
| `apps/worker/dist/index.js` là artifact đã commit, nhúng bản bộ nạp cũ | worker |
