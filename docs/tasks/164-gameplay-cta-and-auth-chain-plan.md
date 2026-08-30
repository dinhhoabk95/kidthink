# Task #164 Plan — CTA theo bậc truy cập và xích chuyền auth

> **Outcome:** Nút trên mọi bề mặt người lớn dẫn đúng bước kế tiếp mà người dùng tự gỡ
> được, và luồng đăng nhập giữ được đích đến cho tới khi vào được trò chơi.

---

## 1. Vì sao có task này

Task #163 (`ac118a0`) đã chạm đúng vùng nhưng còn ba lỗ:

1. `games/index.vue` không hề được sửa dù checklist tick `[x]` — trang danh sách vẫn là
   nhánh nhị phân `locked ? "Xem chi tiết" : "Chơi ngay"`.
2. CTA và error handler trỏ tới `/me/children`, route **không tồn tại**.
3. Từ vựng CTA, tham số `redirect` và route `/login` do #163 tự đặt, **không có trong**
   `docs/specs/`. `AGENTS.md` chốt: đổi hành vi spec đã chốt thì sửa spec trước, cùng PR.

Ngoài ra phát hiện nguyên nhân gốc nằm ngoài phạm vi #163: cookie `active_child_id` bị
ghi bằng **hai định dạng** khác nhau, khiến user đã đăng nhập nhận 404 cho mọi level bậc
≥ `login`.

## 2. Nguyên nhân gốc

| Nơi ghi cookie | Giá trị |
|---|---|
| `users/children/[uuid]/activate.post.ts:119` | `targetChild.uuid` — UUID |
| `me/index.vue:593-594` `enterPlayMode` | `String(childId)` — id số |
| `me/index.vue:601-602` `playNextCurriculumItem` | `String(childId)` — id số |

Người đọc `game-config-runtime.ts:53` query `eq(childProfiles.uuid, ...)`. Cookie id số
không khớp hàng nào → `resolveOwnedChild` ném 404 `NOT_FOUND`.

Gốc ở tầng kiểu: `access-ladder.ts:15` khai `active_child_id?: string | null` (UUID),
`packages/auth/src/contracts.ts:9` khai `active_child_id?: number` (id). Cùng tên, hai
kiểu; `auth-runtime.ts:224` bắc cầu bằng `String()`.

## 3. Ma trận CTA phải đạt

| Bậc | Guest | User không gói | User Standard | User Premium |
|---|---|---|---|---|
| `free` | Chơi ngay → `/play/{code}` | như trái | như trái | như trái |
| `login` | Đăng nhập để chơi → `/login?redirect=…` | chưa bé: Chọn hồ sơ bé; có bé: chơi | chơi | chơi |
| `standard` | Nâng cấp Gói Tiêu chuẩn → `/pricing` | Nâng cấp Gói Tiêu chuẩn → `/pricing` | chưa bé: chọn bé; có bé: chơi | chơi |
| `premium` | Nâng cấp Gói Premium → `/pricing` | Nâng cấp Gói Premium → `/pricing` | Nâng cấp Gói Premium → `/pricing` | chưa bé: chọn bé; có bé: chơi |

CTA và mã HTTP **tách nhau**: ô 428 của ma trận `access-gating.md` §7.1 giữ nguyên 428,
còn CTA trỏ tới rào chắn mà người dùng tự gỡ được.

## 4. Lát cắt

### S0 — Spec
- `02-public/game-detail-public.md`: §7 bảng từ vựng CTA đóng; §8 thêm `cta`; `BR-GDP-09`; §9 scenario.
- `02-public/game-catalog-public.md`: §4/§5 CTA theo bậc trên thẻ; `BR-GCP-09` hai pha SSR/hydrate; §8 `items[].cta`.
- `04-play/access-gating.md`: §7.1 ghi chú tách CTA khỏi mã HTTP; `BR-GAT-09`; §9 scenario.
- `04-play/play-entry-and-profile-select.md`: §5 `/me/children/new` → `/me/children/create`; hàng `redirect`.
- `03-account/login-and-session.md`: §3 `/login`; sửa `BR-LGN-08`, `BR-LGN-11`; thêm `BR-LGN-12`; §7.2; §9.
- `03-account/registration.md`: §3 `/register`.
- `03-account/social-login.md`: `/login`, `/register`, `/register/consent`.

### S1 — Vá nguyên nhân gốc
`me/index.vue` gọi endpoint activate bằng uuid; bỏ trường `active_child_id` số ở
`contracts.ts`; bỏ nhánh fallback `event.context` trong `getOptionalActiveChildUuid`.

### S2 — Một nguồn sự thật CTA
`packages/shared/src/access-cta.ts` với `resolveLevelCta`, export qua `.` và `./client`.
Xoá `canAccessTier`.

### S3 — Server phát `cta`
List trả CTA góc nhìn guest (session-independent); detail trả CTA theo session; thêm
`GET /api/users/access-context`; sửa lỗi `packageCode` ở `users/levels/index.get.ts:10`;
`buildTierLockedResponse` dùng hàm suy từ `PACKAGE_CATALOG`.

### S4 — Trang hồ sơ bé
`/me/children` và `/me/children/create`, kèm modal Parent Gate.

### S5 — Tách `/login` và `/register`
Chuyển `sanitizeReturnTo` sang `packages/shared`; thêm MFA, consent, pending, social,
`rememberMe` mặc định false; xích chuyền sau đăng nhập.

### S6 — Nối CTA vào giao diện
`games/index.vue` hai pha; `games/[code].vue` dùng `cta.href`; `play/[code].vue` xử lý
401 và 410; navbar và hero trỏ `/play/{code}`.

### S7 — Middleware giữ đích đến
`user-auth.ts` gắn `redirect`; mở rộng phạm vi canh.

## 5. Kiểm thử

| File | Khẳng định |
|---|---|
| `packages/shared/tests/access-cta.test.ts` | 20 ô CTA |
| `apps/web/tests/api/guest-levels-catalog.test.ts` | List session-independent |
| `apps/web/tests/api/guest-level-detail-cta.test.ts` | Detail theo session; 428 kèm CTA nâng cấp |
| `apps/web/tests/api/users-levels-entitlements.test.ts` | Hồi quy lỗi `packageCode` |
| `apps/web/tests/gates/active-child-cookie-format.ts` | Cấm client ghi thẳng cookie; có ca âm |

## 6. Ngoài phạm vi

`/me/orders/create` (luồng mua gói) — CTA dừng ở `/pricing`, tách task riêng.
