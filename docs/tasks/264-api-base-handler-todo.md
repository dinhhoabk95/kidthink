# Task #264 Todo: Nền xử lý chung cho tầng API

Plan: [`264-api-base-handler-plan.md`](264-api-base-handler-plan.md).

Bảy phép đo mở đầu (đo 2026-09-09, hiệu chỉnh L0 ngày 2026-09-10): 259 route · 72/102 route
đọc body không trần (trên 144 mutating) · 28 lần xuất hiện same-origin ở 14 route · 12
`.parse()` trần · 25 `getManagerRemoteIp` · 101 `readBody` thô · 74 import barrel.

Song song an toàn: **L1 · L2 · L6**. Bắt buộc tuần tự: **L4 → L5 → L7**.

---

## L0 — Cổng đo `check:api-surface`

- [x] T0.1 `scripts/check-api-surface.ts` — tái dùng `listApiRoutes()` (`apps/web/tests/gates/rate-limit-coverage.ts`) và `stripCommentsAndStrings()` (`apps/web/tests/security/route-validation.ts`)
- [x] T0.2 Dùng khung bậc thang `scripts/typecheck/ratchet.ts`, baseline `scripts/api-surface-baseline.json`
- [x] T0.3 Chốt baseline: `body_size_missing: 72` · `same_origin_in_route: 28` · `raw_zod_parse: 12` · `manager_remote_ip: 25` · `raw_read_body: 101`
- [x] T0.4 `--update` hạ được baseline; Cấm — NEVER nâng
- [x] T0.5 Nối `check:api-surface` vào `package.json` và `scripts/check.sh` phase 1
- [x] T0.6 **Ca âm 1** — thêm route mutating đọc body không trần → đỏ
- [x] T0.7 **Ca âm 2** — thêm một `Schema.parse(` → đỏ
- [x] T0.8 **Ca âm 3** — thêm một `getManagerRemoteIp` → đỏ
- [x] T0.9 **Ca âm 4** — nhắc `assertRequestBodySize` trong comment → số KHÔNG đổi
- [x] T0.10 **Ca âm 5** — gỡ cổng khỏi `check.sh` → test riêng bắt được
- [x] T0.11 Chạy bằng binary Node v24.15.0

### Chốt A

- [x] `pnpm check:api-surface` xanh, baseline khớp §1.1
- [x] 5 ca âm đều bắt đúng regression tương ứng
- [x] `bash scripts/check.sh --fast` xanh
- [x] **Người đặt việc duyệt trước khi sang L1** — duyệt ngày 2026-09-10

---

## L1 — Sự thật về IP sau proxy

- [ ] T1.1a Xoá `getManagerRemoteIp` khỏi `apps/web/server/utils/admin-auth-runtime.ts:32`
- [ ] T1.1b Sửa 3 vị trí rate-limit: `guest/auth/managers/login.post.ts:54`, `mfa.post.ts:126`, `mfa-setup.post.ts:68`
- [ ] T1.1c Sửa 20 vị trí audit (`ipAddress` / `ip_address` / `ip`) — tách ≤5 file mỗi commit
- [ ] T1.1d `manager_remote_ip` về **0**
- [ ] T1.1e Test: `X-Real-IP` từ peer tin cậy → audit ghi IP thật
- [ ] T1.1f **Ca âm** — `X-Real-IP` từ peer ngoài danh sách tin cậy → ghi địa chỉ socket
- [ ] T1.1g **Ca âm** — hai IP khác nhau đăng nhập sai → hai bucket rate-limit riêng
- [ ] T1.2a Log một lần lúc khởi động: `socketIp` quan sát được + có trong `TRUSTED_PROXY_IPS` hay không
- [ ] T1.2b Chạy staging, đọc số, ghi kết quả vào §7 của plan (trả lời **Q1**)
- [ ] T1.2c Chốt `TRUSTED_PROXY_IPS` trong `.env.example` theo số đo
- [ ] T1.2d Nếu địa chỉ không ổn định: `getTrustedProxyIps` nhận CIDR + ca âm cho địa chỉ ngoài dải

---

## L2 — Hợp đồng validate ra đúng một hình dạng

- [ ] T2.1a `server/error.ts` — map `ZodError` trần (kể cả trong `cause`) → 422 `VALIDATION_FAILED` + `details.fields[]`
- [ ] T2.1b Không đổi hành vi `AppError`, lỗi Postgres, H3Error trần
- [ ] T2.1c Cảnh báo `[api error:fallback-guess]` KHÔNG nổ cho ZodError
- [ ] T2.1d Ca test vào `apps/web/tests/integration/app-error-h3-contract.test.ts`
- [ ] T2.2 Nhóm managers (6 file) — `error-logs/[fingerprint].patch.ts` · `seo-pages/[slug]/[version].patch.ts` · `content/[type]/[id]/transition.post.ts` · `content/search.get.ts` · `notification-templates/[code]/preview.post.ts` · `levels/[code]/[version].patch.ts`
- [ ] T2.3 Nhóm users + guest (6 file) — `users/library/index.get.ts` · `users/library/items.post.ts` · `users/children/[uuid]/index.delete.ts` · `users/children/[uuid]/activate.post.ts` · `users/collections/index.post.ts` · `guest/client-errors.post.ts`
- [ ] T2.3b `raw_zod_parse` về **0**
- [ ] T2.3c `apps/web/tests/security/route-validation.ts` — bỏ `.parse(` khỏi regex `VALIDATES`
- [ ] T2.4a `content/search.get.ts` dòng 58 · 74 · 90 truyền `parsed` thay `rawQuery`
- [ ] T2.4b Test `?limit=100000` → clamp về 100 trước khi tới service
- [ ] T2.4c Test tham số lạ không xuống query builder

---

## L3 — Guard phổ quát về middleware

- [ ] T3.1a `middleware/request-guards.ts` — same-origin + trần body cho mọi `/api/*`
- [ ] T3.1b Đặt tên file cho middleware chạy **sau** `auth`, **trước** `rate-limit`; ghi lý do ở đầu file
- [ ] T3.1c Mở rộng `packages/shared/src/rate-limit-routes.ts`: trần riêng theo route class, Cấm — NEVER khai rải trong handler
- [ ] T3.1d Trần mặc định 128 KiB (chờ **Q2** cho route studio nhận `content_pack`)
- [ ] T3.1e Webhook `/api/guest/webhooks/**` giữ nguyên hành vi
- [ ] T3.1f **Ca âm** — `Content-Length` vượt trần → 413 và KHÔNG tiêu lượt rate-limit
- [ ] T3.1g **Ca âm** — `Sec-Fetch-Site: cross-site` → 403 `CSRF_INVALID`
- [ ] T3.1h **Ca âm** — `Origin` ngoài `NUXT_ALLOWED_ORIGINS` → 403
- [ ] T3.1i **Ca âm** — route mới không khai gì → chế độ mặc định CÓ TÊN, Cấm — NEVER nhánh không giới hạn
- [ ] T3.1j Chốt **Q4** (route cố ý cho cross-site) trước khi bật
- [ ] T3.2a Gỡ 14 lời gọi same-origin và 14 import tương ứng khỏi route
- [ ] T3.2b Gỡ 30 lời gọi trần body thủ công khỏi route
- [ ] T3.2c `body_size_missing` và `same_origin_in_route` về **0**

---

## L4 — Gộp hai auth runtime

- [ ] T4.1 `utils/auth-runtime-factory.ts` — `createAuthRuntime(namespace)` sinh 9 hàm trùng đôi
- [ ] T4.2 Một định nghĩa duy nhất cho `CSRF_TOKEN` và `INTEGER_TEXT`
- [ ] T4.3 `auth-runtime.ts` + `admin-auth-runtime.ts` thu về shim re-export; tổng dòng của cả ba file < 450
- [ ] T4.4 426 vị trí gọi KHÔNG phải sửa import
- [ ] T4.5 Bề mặt export không đổi — đối chiếu `nitro-imports.d.ts` sinh lại
- [ ] T4.6 Test: hai namespace dùng **cùng** một cài đặt trần body
- [ ] T4.7 `pnpm typecheck:web` xanh

---

## L5 — `defineApiRoute`

- [ ] T5.1a `utils/define-api-route.ts` — sở hữu auth + CSRF, validate qua `throwValidationError`, cấp `db`, đặt status
- [ ] T5.1b Handler KHÔNG nhận query/body thô
- [ ] T5.1c `auth: "guest"` vẫn chạy guard, bỏ phần đòi phiên
- [ ] T5.1d Test đơn vị: 4 giá trị `auth` · nhánh validate hỏng · nhánh status
- [ ] T5.2a Pilot 5 route (1 GET manager có query · 1 POST manager có body · 1 GET user · 1 POST user · 1 guest), chọn từ nhóm 50 file >150 dòng
- [ ] T5.2b 5 route giữ NGUYÊN hình dạng response và status
- [ ] T5.2c Mỗi route giảm ≥15 dòng
- [ ] T5.2d Test hiện có của 5 route xanh, KHÔNG sửa test
- [ ] T5.3a Thêm phép đo `not_on_factory` vào `check:api-surface`, baseline **254**
- [ ] T5.3b Route mới viết `defineEventHandler` trần → cổng đỏ
- [ ] T5.3c Cấm — NEVER sweep 254 route còn lại trong một commit

---

## L6 — Hiệu năng (song song với L1..L3)

- [ ] T6.1a `assertUserTermsAndPrivacyConsent` — hai loại consent trong MỘT `Promise.all`
- [ ] T6.1b Cache theo `userId` qua `@mindkid/cache`; TTL là hằng CÓ TÊN (chờ **Q3**)
- [ ] T6.1c Đường ghi consent và rút consent XOÁ cache của user đó
- [ ] T6.1d **Ca âm** — rút đồng ý → request kế tiếp trả 428, Cấm — NEVER phục vụ cache cũ
- [ ] T6.1e **Ca âm** — `reconsentRequiredAt` lùi về quá khứ → user đang cache vẫn bị chặn
- [ ] T6.1f Test đếm query: request đã cache = 0 query consent
- [ ] T6.2a `review-queue/index.get.ts:75` — một query nhóm thay một query mỗi tuần
- [ ] T6.2b `review-queue/index.get.ts:146` — gộp tra `contentSkillMap` thành một query `IN`
- [ ] T6.2c Xếp hạng ưu tiên tier 1..4 KHÔNG đổi
- [ ] T6.2d Test: số query ≤ hằng số bất kể số hàng trả về

---

## L7 — Vệ sinh

- [ ] T7.1a Sửa chú thích `utils/request-body.ts` cho khớp sự thật (3/101 và 1/39 vị trí gọi)
- [ ] T7.1b `raw_read_body` gắn vào bậc thang, chỉ giảm
- [ ] T7.2a Chuyển 74 import barrel `#server/services/index.js` sang subpath
- [ ] T7.2b Thêm phép đo barrel vào bậc thang
- [ ] T7.2c `pnpm check:bundle` không xấu đi

---

## Chốt chặn

### Chốt B — sau L1 + L2 + L6

- [ ] `manager_remote_ip: 0` · `raw_zod_parse: 0`
- [ ] **Q1** đã trả lời bằng số đo staging, ghi vào §7 của plan
- [ ] `bash scripts/check.sh` xanh đủ 4 bước
- [ ] So **danh sách file test đỏ** trước/sau — không có file đỏ mới (Cấm — NEVER so bằng số, `--bail 1` che số thật)

### Chốt C — sau L3 + L4

- [ ] `body_size_missing: 0` · `same_origin_in_route: 0`
- [ ] Bề mặt export hai auth runtime không đổi
- [ ] Request quá khổ bị từ chối TRƯỚC khi tiêu lượt rate-limit

### Chốt D — sau L5

- [ ] 5 route pilot giữ nguyên response và status
- [ ] `not_on_factory` chốt baseline và chặn được route mới kiểu cũ
- [ ] **Người đặt việc duyệt trước khi sang L7**

### Chốt E — hoàn tất

- [ ] Bảy phép đo §1.1 đạt đích hoặc có bậc thang đang giảm
- [ ] KHÔNG phép đo nào bị nâng baseline trong toàn bộ task

---

## Câu hỏi mở

- [ ] **Q1** Topology production: nginx trên host về loopback, hay nginx trong Docker tới `web:3000`? Địa chỉ peer quan sát được? → **Hạ tầng**, chặn T1.2
- [ ] **Q2** Trần body 128 KiB có đúng cho route studio nhận `content_pack`? → **Nội dung / Studio**, chặn T3.1
- [ ] **Q3** TTL cache consent chấp nhận được là bao lâu? → **Pháp lý**, chặn T6.1
- [ ] **Q4** Route nào cố ý cho phép cross-site? → **Backend**, chặn T3.1
