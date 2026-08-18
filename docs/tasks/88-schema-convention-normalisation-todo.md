# Todo — Task #88: Chuẩn hoá 5 quy ước schema toàn cục

> Kế hoạch: [`88-schema-convention-normalisation-plan.md`](88-schema-convention-normalisation-plan.md)

## P1 — Bỏ hậu tố `_vi`

- [x] Rà toàn repo: 29 token `snake_case`, 23 token `camelCase`
- [x] Đổi tên trên 183 file code (1.900 lượt); loại trừ `docs/` vì `billing_period_vi` ở đó là
      vết quyết định D-AB, đổi sẽ làm câu chữ vô nghĩa
- [x] Gộp 7 interface từng khai cả `title` lẫn `title_vi` thành một field
- [x] Rút gọn 17 biểu thức `x ?? x` mà lần đổi tên tạo ra
- [x] Xác nhận `image_visibility` không bị đụng (regex dùng `_vi\b`)
- [x] `pnpm typecheck` xanh · `pnpm db:migrate` + `db:seed` trên DB rỗng exit 0
- [x] `packages/db` 728/728

## P2 — Bỏ refresh token

- [x] Xác nhận tầng refresh đã mồ côi: `packages/auth/src/index.ts` không export
      `refresh.ts`/`user-session.ts`/`manager-session.ts`, và `getUserRefreshService` phía web
      đã là stub trả chuỗi cứng
- [x] Xoá `refresh.ts` · `user-session.ts` · `manager-session.ts` + 4 test của chúng
- [x] Xoá hai route `/api/users/auth/refresh` và `/api/managers/auth/refresh`
- [x] `contracts.ts`: bỏ `refresh_token_version` khỏi `UserTokenPayload`/`ManagerTokenPayload`
- [x] `ports.ts`: bỏ `refresh_token_hash`, `refresh_token_version`, `rotate()`,
      `updateSessionTokenHash()`, `RotateSessionInput`, `RotateSessionResult`; thêm `remembered`
      vào `createSession`
- [x] `auth-namespace.ts`: bỏ `accessCookieName`/`refreshCookieName`/`refreshPath`/
      `refreshTtlSeconds`/`audience`/`issuer` — chỉ còn `namespace` + `csrfCookieName`
- [x] Gỡ 78 khai báo `refresh_token_version` trong fixture của 57 file test
- [x] Thêm ca âm: `auth-namespace.test.ts` đỏ nếu ai dựng lại token thứ hai qua đường config
- [x] `packages/auth` 85/85

**Hệ quả ngoài dự kiến (tốt):** `apps/web/server/api/users/password.{post,put}.ts` từng đọc
`users.refreshTokenVersion` — một cột không có trong schema Drizzle, hỏng ở runtime. Bỏ refresh
token làm hai handler này về đúng `session_version`. Spec
[`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) §280 vốn **đã** ghi
"hai route `/auth/refresh` cũ bị xoá" — code đi sau spec, nên P2 không phải sửa spec.

## P3 — `created_at` + `updated_at` mọi bảng

- [x] Vá 52 bảng trên 15 file schema
- [x] Thêm import `timestamp` cho `tagging.ts`, `taxonomy.ts`
- [x] Sửa `BR-DM-08` trong [`data-model-overview.md`](../specs/01-platform/data-model-overview.md):
      "bảng sửa được có `updated_at`" → "mọi bảng có cả hai, không ngoại lệ"
- [x] Mở rộng allow-list cột của `telemetry_events` thêm `updated_at` — cột chết trên bảng
      INSERT-only, không nới `BR-CDC-05`
- [x] Kiểm DB: 0/78 bảng thiếu `created_at`, 0/78 thiếu `updated_at`

## P4 — Index cặp đa hình, không khoá ngoại

- [x] Đo: 10/19 cặp thiếu index phủ
- [x] Thêm 9 index thường + 1 UNIQUE (`mfa_settings (account_type, account_id)` — code vốn đã
      tự upsert tay, UNIQUE biến bất biến đó thành ép được)
- [x] Tách `content_images` + `content_asset_refs` sang [`assets.ts`] mới vì `content.ts` chạm
      trần 400 dòng của `BR-DM-11`
- [x] Kiểm DB: 19/19 cặp có index, 0 cặp là khoá ngoại

## P5 — `id` tự tăng, PK pivot theo cột khoá ngoại

- [x] Thêm `id` cho 9 bảng rollup/1–1, chuyển PK ghép cũ thành UNIQUE
- [x] `lesson_activities`: PK `(lesson_id, position)` → `(lesson_id, activity_id)`; thứ tự giữ
      bằng UNIQUE `(lesson_id, position)`
- [x] 7 bảng pivot giữ PK ghép, không thêm `id`
- [x] Kiểm DB: 11 bảng không có `id` = 7 pivot (đúng ý) + 4 khoá tự nhiên (xem dưới)

## Còn treo — cần người quyết định

- [ ] Bốn bảng vẫn dùng khoá tự nhiên thay vì `id` tự tăng, vì spec sở hữu định nghĩa rõ:
      `packages(code)`, `entitlement_keys(key)`, `telemetry_events(session_uuid, seq)`,
      `consent_requirements(consent_type)`. `packages.code` và `entitlement_keys.key` còn đang là
      đích của FK thật (`BR-SIB-02`), đổi sang `id` phải sửa cả FK ở `package_entitlements`,
      `entitlements`, `payment_orders`, `recurring_subscriptions`. Muốn ép quy ước 5 lên cả bốn
      thì sửa spec trước rồi mở task riêng.
- [ ] Đổi tên cột đa hình sang đúng `model_type`/`model_id` kiểu Laravel (hiện là
      `entity_`/`owner_`/`account_`/`ref_`/`recipient_`). Task riêng, ~40 file + 3 spec schema.
