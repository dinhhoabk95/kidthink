# Task #264 Plan: Nền xử lý chung cho tầng API — đóng sáu khoản nợ đo được

> **Mục tiêu**: 259 route handler của `apps/web/server/api` đang tự tay dựng lại cùng một
> đường ống (auth → CSRF → guard → validate → db → shape). Không có một factory nào trong
> `server/`. Hệ quả không phải là code xấu, mà là **luật đúng chỉ áp lên một phần bề mặt**:
> trần kích thước body chỉ phủ 30/102 route mutating thực sự đọc body (29%), same-origin chỉ
> nằm ở 14/259 route (5%), và một bản vá IP đã landed ở nhánh user
> thì nhánh manager vẫn giữ lỗi cũ.
>
> Task này (a) dựng cổng đo để mọi con số dưới đây chỉ được giảm, (b) đóng hai lỗi bảo mật
> và hai lỗi đúng-sai đo được, (c) dựng `defineApiRoute` làm nền cho phần còn lại.

---

## 1. Bối cảnh

### 1.1 Bảy phép đo mở đầu (đo 2026-09-09)

| #   | Phép đo                                                                              | Hiện tại                                    | Đích                       |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------- | -------------------------- |
| M1  | Route handler dưới `apps/web/server/api/**`                                          | 259                                         | — (mẫu số)                 |
| M2  | Route mutating (`post`/`put`/`patch`/`delete`) đọc body **không** có trần kích thước | 72 / 102 route đọc body (144 mutating)      | 0                          |
| M3  | Lần xuất hiện guard same-origin trong source                                         | 28 (14 import + 14 call, trên 14/259 route) | 0 (chuyển sang middleware) |
| M4  | Route ném `ZodError` trần qua `Schema.parse(`                                        | 12                                          | 0                          |
| M5  | Vị trí gọi `getManagerRemoteIp`                                                      | 25 (19 file)                                | 0                          |
| M6  | Vị trí gọi `readBody(...)` thay vì `readRequestBody`                                 | 101                                         | giảm dần                   |
| M7  | Route import barrel `#server/services/index.js`                                      | 74                                          | giảm dần                   |

### 1.2 Khoản nợ 1 — IP của nhánh manager không đi qua proxy

`getManagerRemoteIp` (`apps/web/server/utils/admin-auth-runtime.ts:32`) đọc **chỉ**
`req.socket.remoteAddress`. nginx trong repo đặt `X-Real-IP $remote_addr`
(`infra/nginx/conf.d/root.conf`, snippet proxy) và đẩy tới upstream `web:3000`
(`infra/nginx/conf.d/upstream.conf:2`). Sau proxy, mọi request manager giải ra **một địa chỉ
hằng**.

Hai hệ quả, cả hai đang sống:

| Đường                                | Vị trí                                                                                                      | Hỏng ra sao                                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Giới hạn tần suất đăng nhập manager  | `api/guest/auth/managers/login.post.ts:54`, `mfa.post.ts:126`, `mfa-setup.post.ts:68`                       | Trục IP sụp thành **một bucket dùng chung cho toàn bộ manager**. Một kẻ tấn công tiêu hết bucket là khoá cửa mọi quản trị viên |
| Nhật ký kiểm toán hành động quản trị | 20 vị trí ghi `ipAddress` / `ip_address` / `ip` — suspend, cấp quyền lợi, duyệt đơn, hoàn tất khôi phục MFA | Toàn bộ dấu vết pháp y ghi cùng một địa chỉ hằng                                                                               |

Nhánh user đã có bản đúng: `getVerifiedRemoteIp` (`utils/auth-runtime.ts:76`) đọc `X-Real-IP`
**chỉ khi** peer nằm trong `TRUSTED_PROXY_IPS`. Nhánh manager chưa bao giờ được di trú. Đây là
lý do trực tiếp cho việc gộp hai runtime ở lát L4: một bản vá landed một nửa là dạng lỗi mà
bản sao sinh ra.

### 1.3 Khoản nợ 2 — `TRUSTED_PROXY_IPS` có thể không khớp cách triển khai

`.env:20` và `.env.example:20` đều đặt `TRUSTED_PROXY_IPS=127.0.0.1,::1`. Giá trị đó đúng khi
nginx chạy **trên host** và proxy về loopback. Cấu hình nginx trong repo lại proxy tới tên
service Docker `web:3000`, nghĩa là peer sẽ là một địa chỉ trên bridge network chứ không phải
`127.0.0.1`. Nếu đó là topology thật thì `getVerifiedRemoteIp` cũng rơi về địa chỉ socket, và
bản vá của nhánh user **cũng** đang inert trong production.

Chưa xác nhận được topology production từ trong repo (`docker-compose.yml` chỉ có DB + cache
cho dev). Ghi thành câu hỏi mở Q1, có chủ, và lát L1 giao kèm một phép đo runtime để trả lời
nó bằng số chứ không bằng suy đoán.

### 1.4 Khoản nợ 3 — `ZodError` trần trả 500 thay vì 422

`throwValidationError` (`utils/api-error.ts:26`) tồn tại đúng cho việc này và được dùng 68 lần.
12 route gọi `Schema.parse(` thay vì `safeParse`. `ZodError` không phải `AppError` và không mang
`statusCode`, nên `server/error.ts` rơi xuống `bodyFromH3Error` và trả
**`500 INTERNAL_ERROR`**. Client nhận lỗi máy chủ cho lỗi đầu vào của chính nó, và hình dạng
`details.fields[]` của ERROR-CODES §7.7 bị bỏ qua.

Cổng hiện có **không** bắt được: `apps/web/tests/security/route-validation.ts` tính `.parse(`
là bằng chứng đã validate. Nó đo _có validate không_, không đo _validate hỏng ra status nào_.

12 file: 6 dưới `managers/`, 5 dưới `users/`, 1 dưới `guest/`.

### 1.5 Khoản nợ 4 — kết quả validate bị vứt đi

`api/managers/content/search.get.ts:53` parse query vào `parsed`, rồi cả ba nhánh truyền
**`rawQuery`** xuống service (dòng 58, 74, 90). Chỉ `parsed.type` được đọc. Coercion, clamp, và
trần `limit ≤ 100` không bao giờ tới `searchLessons` / `searchGameLevels` / `searchActivities`.
Một `limit` không giới hạn đi thẳng vào query builder.

### 1.6 Khoản nợ 5 — cổng consent tốn 4 query mỗi request

`middleware/consent-gate.ts` chạy cho **mọi** request `/api/users/**` của người đã đăng nhập
(118 route file). Nó gọi `assertUserTermsAndPrivacyConsent`, hàm này `await` tuần tự hai lần
`requireConsentActive` (`utils/consent-guard.ts:98-99`), mỗi lần phát 2 query. Không có cache,
dù `@mindkid/cache` đã export `getCached` / `setCached`.

### 1.7 Khoản nợ 6 — N+1 trong hàng chờ duyệt

`api/managers/content/review-queue/index.get.ts` (469 dòng, file route lớn nhất):

- dòng 75: `getIncompleteCurriculumItems` phát **một query mỗi tuần chưa đủ bài**
- dòng 146: vòng lặp theo hàng phát **một query `contentSkillMap` mỗi level trả về**

Cả hai gộp được thành một query nhóm với mệnh đề `IN`.

### 1.8 Cái đã đúng sẵn, cần giữ

| Thứ                                                                         | Vì sao giữ                                                                                                                                                                               |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `middleware/rate-limit.ts` + `packages/shared/src/rate-limit-routes.ts`     | Đã chứng minh mô hình "luật phổ quát ở middleware + registry ba chế độ `middleware`/`in-route`/`exempt`". Lát L3 tái dùng đúng registry này, Cấm — NEVER dựng registry thứ hai song song |
| `listApiRoutes()` ở `apps/web/tests/gates/rate-limit-coverage.ts`           | Bộ liệt kê route từ hệ thống file đã có và đã đúng. Cổng mới ở L0 tái dùng, không viết lại                                                                                               |
| `stripCommentsAndStrings()` ở `apps/web/tests/security/route-validation.ts` | Đã có ghi chú vì sao Cấm — NEVER đo trên nguồn thô. Cổng mới tái dùng                                                                                                                    |
| `scripts/typecheck/ratchet.ts`                                              | Khung bậc thang dùng chung của 7 cổng hiện có. Cổng L0 dùng cùng khung, cùng dạng baseline JSON                                                                                          |
| `server/error.ts`                                                           | Đã là chỗ **duy nhất** dựng body lỗi. L2 thêm một nhánh vào đây, Cấm — NEVER thêm chỗ dựng body thứ hai                                                                                  |

---

## 2. Giả định

| #   | Giả định                                                                                       | Cái bị loại và vì sao                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Same-origin và trần kích thước body là **luật phổ quát**, không phải quyết định của từng route | Rải theo route chỉ phủ 14/259 route same-origin và 30/102 route đọc body có trần. Một luật mà phần lớn bề mặt không gọi là luật trên giấy |
| A2  | `defineApiRoute` **không** thay `defineEventHandler` bằng một lượt sed                         | 259 route, nhiều route có nhánh riêng. Di trú theo bậc thang, không theo sweep. Vết sed hàng loạt trong corpus spec là tiền lệ đã trả giá |
| A3  | Hai auth runtime gộp lại bằng **factory theo namespace**, giữ nguyên tên hàm đang export       | 426 vị trí gọi. Đổi tên là đổi 426 file cho 0 lợi ích. Giữ `auth-runtime.ts` / `admin-auth-runtime.ts` làm shim re-export                 |
| A4  | Cache consent đặt ở `@mindkid/cache` (Valkey), **không** phải cache trong tiến trình           | Nhiều tiến trình Node sau nginx. Cache trong tiến trình cho ra kết quả khác nhau tuỳ instance, và rút đồng ý sẽ không lan                 |
| A5  | Không đổi hình dạng response của bất kỳ route nào trong task này                               | Đây là task nền + vá lỗi. Đổi contract response là task khác, có phiếu riêng                                                              |
| A6  | `getManagerRemoteIp` bị **khai tử**, không phải sửa tại chỗ                                    | Sửa tại chỗ để lại hai hàm cùng nghĩa. Đó chính là cơ chế đã sinh ra khoản nợ này                                                         |

---

## 3. Đồ thị phụ thuộc

```
L0  Cổng đo check:api-surface  (nền của mọi lát sau)
     │
     ├── L1  Sự thật về IP            ── độc lập, làm sớm nhất (bảo mật)
     │
     ├── L2  Hợp đồng validate        ── độc lập
     │
     ├── L3  Guard vào middleware     ── dùng registry của rate-limit
     │
     ├── L6  Hiệu năng                ── độc lập, song song được với L1..L3
     │
     └── L4  Gộp auth runtime         ── sau L1 (để L1 không phải sửa hai lần)
              │
              └── L5  defineApiRoute  ── sau L2 + L3 + L4
                       │
                       └── L7  Vệ sinh ── sau L5
```

Song song an toàn: **L1 · L2 · L6** chạy được cùng lúc, chạm ba vùng file rời nhau.
Bắt buộc tuần tự: **L4 → L5 → L7**.

---

## 4. Thi công theo lát

### L0 — Cổng đo `check:api-surface`

**Mô tả**: Dựng cổng bậc thang đo 5 con số của bảng §1.1 (M2, M3, M4, M5, M6). Không sửa một
route nào. Baseline chốt đúng hiện trạng; mọi lát sau chỉ được kéo số xuống.

**Files**: `scripts/check-api-surface.ts`, `scripts/api-surface-baseline.json`,
`scripts/check-api-surface.test.ts`, `package.json`, `scripts/check.sh`.

**Tiêu chí chấp nhận**

- [x] Tái dùng `listApiRoutes()` và `stripCommentsAndStrings()`, không viết lại bộ liệt kê route
- [x] Dùng `compareToBaseline` / `refuseIncrease` của `scripts/typecheck/ratchet.ts`
- [x] Baseline chốt: `body_size_missing: 72`, `same_origin_in_route: 28`, `raw_zod_parse: 12`, `manager_remote_ip: 25`, `raw_read_body: 101`
- [x] `--update` hạ được baseline, Cấm — NEVER nâng

**Ca âm (≥5, bắt buộc)** — mỗi ca là một fixture làm cổng **đỏ**:

- [x] Thêm một route mutating đọc body không trần → `body_size_missing` tăng → đỏ
- [x] Thêm một `Schema.parse(` → `raw_zod_parse` tăng → đỏ
- [x] Thêm một `getManagerRemoteIp` → đỏ
- [x] Nhắc `assertRequestBodySize` **trong comment** → Cấm tính là bằng chứng → số không đổi
- [x] Xoá cổng khỏi `check.sh` → test riêng phát hiện được (chống dạng "cổng không tồn tại")

**Kiểm chứng**: `pnpm check:api-surface` xanh trên cây sạch; `pnpm vitest run scripts/check-api-surface.test.ts` xanh; `bash scripts/check.sh --fast` xanh.

**Phụ thuộc**: Không. **Cỡ**: M (5 file).

---

### L1 — Sự thật về IP sau proxy

#### T1.1 — Khai tử `getManagerRemoteIp`

**Mô tả**: Xoá `getManagerRemoteIp`, thay 25 vị trí gọi bằng `getVerifiedRemoteIp`.

**Tiêu chí chấp nhận**

- [ ] `getManagerRemoteIp` không còn tồn tại trong `apps/web/server/**`
- [ ] 3 vị trí rate-limit (`managers/login.post.ts:54`, `mfa.post.ts:126`, `mfa-setup.post.ts:68`) dùng `getVerifiedRemoteIp`
- [ ] 20 vị trí audit dùng `getVerifiedRemoteIp`
- [ ] `manager_remote_ip` của L0 về **0**

**Kiểm chứng**

- [ ] Test: request có `X-Real-IP: 203.0.113.9` từ peer **trong** `TRUSTED_PROXY_IPS` → audit ghi `203.0.113.9`
- [ ] Ca âm: cùng header từ peer **ngoài** danh sách tin cậy → ghi địa chỉ socket, Cấm — NEVER ghi giá trị header
- [ ] Ca âm: hai IP khác nhau đăng nhập sai mật khẩu → hai bucket rate-limit riêng, không phải một

**Files**: `utils/admin-auth-runtime.ts` + 19 file route. **Cỡ**: L → tách theo namespace nếu vượt 5 file mỗi commit. **Phụ thuộc**: L0.

#### T1.2 — Trả lời Q1 bằng số, không bằng suy đoán

**Mô tả**: Thêm log một lần lúc khởi động in `socketIp` quan sát được của request đầu tiên và
việc nó có nằm trong `TRUSTED_PROXY_IPS` hay không. Chạy trên staging, đọc số, rồi chốt giá trị
biến (hoặc chuyển sang so khớp CIDR nếu địa chỉ bridge network không ổn định).

**Tiêu chí chấp nhận**

- [ ] Có số đo thật từ staging, ghi vào plan này ở mục §7
- [ ] `TRUSTED_PROXY_IPS` trong `.env.example` khớp topology đã đo
- [ ] Nếu địa chỉ không ổn định: `getTrustedProxyIps` nhận CIDR, kèm ca âm cho địa chỉ ngoài dải

**Kiểm chứng**: log staging cho thấy peer nằm trong danh sách tin cậy; một request thật từ Internet ghi đúng IP nguồn.

**Phụ thuộc**: T1.1. **Cỡ**: S (2 file + một lượt chạy staging).

---

### L2 — Hợp đồng validate ra đúng một hình dạng

#### T2.1 — Lưới an toàn ở `server/error.ts`

**Mô tả**: Map `ZodError` trần sang 422 `VALIDATION_FAILED` bằng `toValidationFields`, để một
route lọt lưới vẫn xuống đúng status thay vì 500.

**Tiêu chí chấp nhận**

- [ ] `ZodError` (kể cả khi h3 bọc vào `cause`) → 422, body có `details.fields[]`
- [ ] Không đổi hành vi của `AppError`, lỗi Postgres, và H3Error trần
- [ ] Cảnh báo `[api error:fallback-guess]` vẫn nổ cho H3Error trần, không nổ cho ZodError

**Kiểm chứng**: bổ sung ca vào `apps/web/tests/integration/app-error-h3-contract.test.ts`.

**Files**: `apps/web/server/error.ts` + 1 test. **Cỡ**: S. **Phụ thuộc**: L0.

#### T2.2 — 12 route bỏ `.parse()` (nhóm managers, 6 file)

#### T2.3 — 12 route bỏ `.parse()` (nhóm users + guest, 6 file)

**Mô tả**: Đổi `Schema.parse(x)` sang `safeParse` + `throwValidationError`.

**Tiêu chí chấp nhận**

- [ ] `raw_zod_parse` của L0 về **0**
- [ ] Mỗi route trả 422 với `details.fields[]` khi query/body sai
- [ ] `route-validation.ts` cập nhật: `.parse(` **không** còn được tính là bằng chứng validate hợp lệ

**Kiểm chứng**: một test cho mỗi nhóm gửi payload sai và khẳng định status 422 + hình dạng body.

**Cỡ**: M mỗi task (6 file). **Phụ thuộc**: T2.1.

#### T2.4 — `content/search.get.ts` dùng kết quả validate

**Mô tả**: Ba nhánh truyền `parsed` thay vì `rawQuery`.

**Tiêu chí chấp nhận**

- [ ] Ba lời gọi service ở dòng 58, 74, 90 nhận `parsed`
- [ ] `?limit=100000` bị clamp về 100 trước khi tới service
- [ ] Tham số lạ không xuống tới query builder

**Kiểm chứng**: test `?limit=100000` trả ≤100 hàng; test tham số lạ không đổi kết quả.

**Files**: 1 route + 1 test. **Cỡ**: S. **Phụ thuộc**: T2.2.

---

### L3 — Guard phổ quát về middleware

**Mô tả**: Thêm `middleware/request-guards.ts` chạy same-origin và trần kích thước body cho mọi
`/api/*`, tái dùng registry ba chế độ của rate-limit. Gỡ lời gọi thủ công khỏi route sau khi
middleware đã phủ.

**Thứ tự middleware của Nitro là theo tên file**, hiện là `auth` → `consent-gate` →
`rate-limit` → `security-headers`. `request-guards` phải chạy **trước** `rate-limit` (từ chối
request quá khổ trước khi tiêu một lượt bucket) và **sau** `auth`. Đặt tên file cho đúng thứ tự
đó; ghi lý do vào đầu file như `rate-limit.ts` đã làm.

**Tiêu chí chấp nhận**

- [ ] Mọi route `/api/*` đi qua guard, trừ những đường có lý do **đã đặt tên** trong registry
- [ ] Trần mặc định 128 KiB; route cần trần khác khai trong registry, Cấm — NEVER khai rải trong handler
- [ ] `body_size_missing` và `same_origin_in_route` của L0 về **0**
- [ ] Webhook nhà cung cấp (`/api/guest/webhooks/**`) giữ nguyên hành vi hiện tại

**Ca âm (≥4)**

- [ ] `Content-Length` vượt trần → 413, và **không** tiêu lượt rate-limit
- [ ] `Sec-Fetch-Site: cross-site` → 403 `CSRF_INVALID`
- [ ] `Origin` ngoài `NUXT_ALLOWED_ORIGINS` → 403
- [ ] Route thêm mới không khai gì → giải ra chế độ mặc định có tên, Cấm — NEVER rơi vào nhánh không giới hạn

**Kiểm chứng**: mở rộng `apps/web/tests/gates/rate-limit-coverage.test.ts` sang phủ guard; `bash scripts/check.sh --fast` xanh.

**Files**: `middleware/request-guards.ts`, `packages/shared/src/rate-limit-routes.ts` (mở rộng), 2 test, gỡ lời gọi ở route (theo đợt). **Cỡ**: L → tách thành T3.1 (middleware + registry + test) và T3.2 (gỡ lời gọi thủ công). **Phụ thuộc**: L0, T2.1.

---

### L4 — Gộp hai auth runtime

**Mô tả**: `createAuthRuntime(namespace)` sinh 9 hàm hiện đang trùng đôi: assert trần body,
assert rate-limit, assert same-origin, ensure/validate CSRF, 3 hàm cookie remember, và hàm đáp
lỗi auth. Giữ `auth-runtime.ts` và `admin-auth-runtime.ts` làm shim re-export để 426 vị trí gọi
không phải đổi.

**Tiêu chí chấp nhận**

- [ ] Một định nghĩa duy nhất cho `CSRF_TOKEN` và `INTEGER_TEXT`
- [ ] Hai file cũ chỉ còn re-export, tổng số dòng của cả ba file **giảm** so với 450
- [ ] Không vị trí gọi nào phải sửa import
- [ ] Bề mặt export không đổi (đối chiếu bằng `nitro-imports.d.ts` sinh lại)

**Kiểm chứng**: `pnpm typecheck` xanh; test auth hiện có xanh không sửa; một test khẳng định hai namespace dùng **cùng** một cài đặt trần body.

**Files**: `utils/auth-runtime-factory.ts` (mới), 2 file cũ thu gọn, 1 test. **Cỡ**: M. **Phụ thuộc**: T1.1.

---

### L5 — `defineApiRoute`

#### T5.1 — Dựng factory

```ts
export default defineApiRoute({
  auth: "manager", // "user" | "manager" | "super_admin" | "guest"
  query: LevelSearchSchema, // parse → 422, handler Cấm — NEVER thấy query thô
  body: CreateLevelSchema,
  maxBodyBytes: 16 * 1024,
  status: 201,
  async handler({ actor, db, query, body, event }) {
    /* chỉ logic nghiệp vụ */
  },
});
```

**Tiêu chí chấp nhận**

- [ ] Factory sở hữu: auth + CSRF, validate schema qua `throwValidationError`, cấp `db`, đặt status thành công
- [ ] Handler **không** nhận được query/body thô — khoản nợ §1.5 trở thành không viết ra được
- [ ] `auth: "guest"` vẫn chạy guard, chỉ bỏ phần đòi phiên

**Kiểm chứng**: test đơn vị cho factory: 4 giá trị `auth`, nhánh validate hỏng, nhánh status.

**Files**: `utils/define-api-route.ts` + 1 test. **Cỡ**: S. **Phụ thuộc**: L2, L3, L4.

#### T5.2 — Pilot 5 route

**Mô tả**: Di trú 5 route đại diện: 1 GET manager có query, 1 POST manager có body, 1 GET user,
1 POST user, 1 route guest. Chọn từ nhóm 50 file trên 150 dòng.

**Tiêu chí chấp nhận**

- [ ] 5 route giữ **nguyên** hình dạng response và status
- [ ] Mỗi route giảm ≥15 dòng
- [ ] Test hiện có của 5 route xanh, không sửa test

**Kiểm chứng**: diff response trước/sau bằng test; `pnpm typecheck` xanh.

**Cỡ**: M. **Phụ thuộc**: T5.1.

#### T5.3 — Bậc thang di trú

**Mô tả**: Thêm phép đo thứ 6 vào `check:api-surface`: số route **chưa** dùng `defineApiRoute`.
Baseline 254. Chỉ được giảm. Di trú phần còn lại theo nhịp của các task sau, Cấm — NEVER sweep.

**Tiêu chí chấp nhận**

- [ ] Baseline `not_on_factory: 254` chốt
- [ ] Route mới viết bằng `defineEventHandler` trần làm cổng đỏ

**Cỡ**: S. **Phụ thuộc**: T5.2.

---

### L6 — Hiệu năng (song song được với L1..L3)

#### T6.1 — Cổng consent

**Tiêu chí chấp nhận**

- [ ] `assertUserTermsAndPrivacyConsent` chạy hai loại consent trong **một** `Promise.all` (4 query → 1 lượt song song)
- [ ] Kết quả cache theo `userId` qua `@mindkid/cache`, TTL đặt thành hằng có tên
- [ ] Ghi consent và rút consent **xoá** cache của user đó

**Ca âm (≥2)**

- [ ] Rút đồng ý → request kế tiếp trả 428, Cấm — NEVER phục vụ từ cache cũ
- [ ] `reconsentRequiredAt` lùi về quá khứ → user đang cache vẫn bị chặn

**Kiểm chứng**: test đếm số query trên một request đã cache (kỳ vọng 0) và request lạnh.

**Files**: `utils/consent-guard.ts`, `middleware/consent-gate.ts`, route ghi consent, 1 test. **Cỡ**: M. **Phụ thuộc**: L0.

#### T6.2 — N+1 hàng chờ duyệt

**Tiêu chí chấp nhận**

- [ ] `getIncompleteCurriculumItems` dùng **một** query nhóm thay cho một query mỗi tuần
- [ ] Tra `contentSkillMap` gộp thành một query `IN` trước vòng lặp
- [ ] Kết quả xếp hạng ưu tiên (tier 1..4) **không đổi**

**Kiểm chứng**: test so sánh output trước/sau trên cùng dữ liệu seed; đếm query ≤ hằng số bất kể số hàng trả về.

**Files**: 1 route + 1 test. **Cỡ**: S. **Phụ thuộc**: L0.

---

### L7 — Vệ sinh

#### T7.1 — Ranh giới đọc body và query

**Mô tả**: `readRequestBody` có 3 vị trí gọi so với 101 `readBody(...)`; `readRequestQuery` có
1 vị trí gọi so với 39 `getQuery(...)`. Sau L5, factory sở hữu việc đọc, nên con số này giảm
theo nhịp di trú. Task
này chỉ chốt phép đo và sửa chú thích của `request-body.ts` cho khớp sự thật.

**Tiêu chí chấp nhận**

- [ ] Chú thích không còn khẳng định điều chưa đúng
- [ ] `raw_read_body` gắn vào bậc thang, chỉ giảm

**Cỡ**: XS. **Phụ thuộc**: T5.3.

#### T7.2 — Barrel `#server/services/index.js`

**Mô tả**: 74 route import barrel gộp 22 service. Chuyển sang import subpath. Cùng dạng lỗi với
barrel `@mindkid/shared` đã biết.

**Tiêu chí chấp nhận**

- [ ] Số route import barrel giảm; thêm phép đo vào bậc thang
- [ ] `pnpm check:bundle` không xấu đi

**Cỡ**: M. **Phụ thuộc**: T7.1.

---

## 5. Chốt chặn

### Chốt A — sau L0

- [x] `pnpm check:api-surface` xanh, baseline khớp 5 con số của §1.1
- [x] 5 ca âm đều bắt đúng regression tương ứng
- [x] Cổng đã nằm trong `scripts/check.sh` phase 1 và test riêng bắt được việc gỡ nó
- [x] **Người đặt việc duyệt trước khi sang L1** — duyệt ngày 2026-09-10

### Chốt B — sau L1 + L2 + L6

- [ ] `manager_remote_ip: 0`, `raw_zod_parse: 0`
- [ ] Q1 đã trả lời bằng số đo staging, ghi vào §7
- [ ] `bash scripts/check.sh` xanh đủ 4 bước
- [ ] So danh sách file test đỏ trước/sau: **không có file đỏ mới**

### Chốt C — sau L3 + L4

- [ ] `body_size_missing: 0`, `same_origin_in_route: 0`
- [ ] Bề mặt export của hai auth runtime không đổi
- [ ] Một request quá khổ bị từ chối **trước** khi tiêu lượt rate-limit

### Chốt D — sau L5

- [ ] 5 route pilot giữ nguyên response và status
- [ ] `not_on_factory` chốt baseline và chặn được route mới viết kiểu cũ
- [ ] **Người đặt việc duyệt trước khi sang L7**

### Chốt E — hoàn tất

- [ ] Bảy phép đo của §1.1 đạt đích hoặc có bậc thang đang giảm
- [ ] Không phép đo nào được nâng baseline trong toàn bộ task

---

## 6. Rủi ro

| Rủi ro                                                            | Mức        | Giảm thiểu                                                                                                                   |
| ----------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Cổng L0 xanh giả — đo đường dẫn sai hoặc nuốt mã thoát            | Cao        | 5 ca âm bắt buộc, một trong đó là "gỡ cổng khỏi `check.sh`". Đây là dạng lỗi lặp lại nhiều lần trong repo này                |
| Chuyển guard sang middleware làm hỏng webhook hoặc OAuth callback | Cao        | Registry ba chế độ có sẵn; webhook đã có lý do miễn **đã đặt tên**. Test phủ trước khi gỡ lời gọi thủ công (T3.1 trước T3.2) |
| Cache consent phục vụ đồng ý đã rút                               | Cao        | Hai ca âm bắt buộc; xoá cache ở đường ghi, không dựa vào TTL                                                                 |
| Di trú `defineApiRoute` đổi hình dạng response ngoài ý muốn       | Trung bình | Pilot 5 route, test diff response, bậc thang thay cho sweep                                                                  |
| Bộ test đã đỏ sẵn che lỗi mới                                     | Trung bình | `pnpm test` có `--bail 1`. So **danh sách file đỏ** trước/sau ở mỗi chốt, không so số                                        |
| `pnpm typecheck` bỏ sót server Nuxt                               | Trung bình | Dùng `pnpm typecheck:web`; cổng bậc thang 10 project đang ở nợ 0, giữ nguyên                                                 |
| T1.1 chạm 19 file route trong một commit                          | Thấp       | Tách theo namespace, ≤5 file mỗi commit                                                                                      |

---

## 7. Câu hỏi mở

| #   | Câu hỏi                                                                                                                                     | Chủ               | Chặn lát nào           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------- |
| Q1  | Topology production thật: nginx trên host proxy về loopback, hay nginx trong Docker proxy tới `web:3000`? Địa chỉ peer quan sát được là gì? | Hạ tầng           | T1.2 (không chặn T1.1) |
| Q2  | Trần kích thước body mặc định 128 KiB có đúng cho route nhận `content_pack` của studio không? Nếu không, trần riêng là bao nhiêu?           | Nội dung / Studio | T3.1                   |
| Q3  | TTL cache consent: bao lâu là chấp nhận được giữa lúc rút đồng ý và lúc mọi instance thấy?                                                  | Pháp lý           | T6.1                   |
| Q4  | Có route nào **cố ý** cho phép cross-site không (nhúng, đối tác)? Nếu có, khai vào registry trước khi L3 bật                                | Backend           | T3.1                   |
