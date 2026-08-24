# Task #104 — Ranh giới runtime web và admin

## Overview

Đưa hệ thống về topology đã chốt: `apps/web` sở hữu SSR và toàn bộ `/api/**`; `apps/admin` là
SPA tĩnh trên `admin.{domain}` gọi API tuyệt đối tới `{domain}`. Giữ `nuxt-auth-utils` với
opaque Redis session, tách cookie User/Manager và chọn namespace theo path.

## Architecture decisions

- Không dùng JWT hoặc refresh token first-party; session locator vẫn được resolve trong Redis.
- Dùng hai tên cookie h3 trên cùng web host; Manager session đọc bằng `useSession` trực tiếp.
- Giữ Nginx cho increment này vì `/api/guest/auth/*` vẫn cần `limit_req`; Caddy document được
  cập nhật để không mô tả admin như Node server.
- Admin login chưa có UI sở hữu; ghi thành open item riêng, không dựng route placeholder.

## Increment plan

1. Sửa middleware web để resolve session token qua Redis và test qua middleware thật.
2. Tách session config User/Manager, namespace theo path, và đưa CSRF token vào session response.
3. Di chuyển auth Manager routes và dashboard về `apps/web`.
4. Bật CORS allowlist/preflight và cập nhật origin policy.
5. Biến admin thành static SPA, port API client và loại bỏ server/dependency runtime.
6. Đổi proxy, PM2 và env contract theo topology hai tiến trình server.
7. Thêm gates `BR-ARB-*`, cập nhật agent context/rules/skill và hoàn tất docs.

## Verification

- `pnpm vitest run --project packages/gates`
- `pnpm vitest run --project apps/web -t "middleware auth"`
- `pnpm typecheck:web`
- `pnpm --filter @mindkid/admin build`
- `test ! -d apps/admin/.output/server`

## Risks

| Risk | Mitigation |
|---|---|
| Cookie config sai khiến Manager không được gửi cross-origin same-site | Test h3 session cookie và API client `credentials: "include"` |
| Middleware test tự dựng context rồi bỏ qua bug | Test request cookie đi qua handler middleware thật |
| Admin còn sót URL tương đối | Gate quét toàn bộ `apps/admin/app/**` và fixture âm |
| Xóa admin server làm mất route | Gate duplicate route và inventory route trước/sau |
