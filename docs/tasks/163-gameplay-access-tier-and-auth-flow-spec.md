# Task #163 Spec — Gameplay Access Tier & Auth Flow Fix

> **Outcome:** Khắc phục triệt để lỗi phân quyền chơi game, điều chỉnh đúng ma trận truy cập 4 bậc (Free/Login/Standard/Premium) × 5 loại caller theo `BR-GAT-05`, hoàn thiện UI auth và luồng chuyển trang (Header Navbar, Hero CTA, Catalog, Detail, Gameplay và trang Login/Register).

---

## 1. Problem Statement

1. **Truy cập game bị buộc đăng nhập hoặc lỗi 428/404**:
   - Game `free` (chơi thử không cần tài khoản) bị chặn 428 khi user đã login nhưng chưa chọn profile bé.
   - User đã mua gói Standard/Premium bị chặn 403 `TIER_LOCKED` ở `/api/users/levels/[code]/config` do thiếu truyền `activeKeys` từ Redis entitlement cache vào `assertContentAccess`.
   - Các đường link chơi thử ở Header (`PublicNavbar.vue`), Hero banner (`LandingHero.vue`), SEO metadata (`public-seo.ts`), và `home.get.ts` trỏ tới mã game không tồn tại (`GL-C1-001`), gây lỗi 404.
2. **Thiếu hiển thị Auth State & Navigation**:
   - Header Navbar không nhận diện session đăng nhập của User, thiếu nút chuyển vào "Sảnh chơi bé" (`/play`) và "Tài khoản" (`/me`).
   - Guest không có trang `/login` độc lập trên web app (trước đó bị `[slug].vue` bắt nhầm và báo 404 Not Found).
   - Nút lỗi ở màn hình gameboard `/play/[code]` không giữ tham số `redirect` sau khi đăng nhập / chọn hồ sơ bé.

---

## 2. Scope & Boundaries

### In Scope
- **Ma trận phân quyền Gameplay (`BR-GAT-05`)**:
  - `guest`: Chơi được level `free` (Status 200); `login`/`standard`/`premium` -> 403.
  - `user` (chưa chọn bé): Chơi được level `free` (Status 200); `login`/`standard`/`premium` -> 428 `NO_ACTIVE_CHILD`.
  - `user` (đã chọn bé, chưa mua gói): Chơi được `free` và `login` (Status 200); `standard`/`premium` -> 403 `TIER_LOCKED`.
  - `user` (Standard): Chơi được `free`, `login`, `standard` (Status 200); `premium` -> 403.
  - `user` (Premium): Chơi được toàn bộ 4 bậc (`free`, `login`, `standard`, `premium` -> Status 200).
- **Backend Runtime**:
  - `auth-runtime.ts`: Thêm `getOptionalActiveChildUuid(event)`.
  - `game-config-runtime.ts`: Thêm `activeKeys` vào `GameConfigDeliveryOptions` và `assertContentAccess`.
  - `users/levels/[code]/config.get.ts`: Nạp entitlements qua `resolveUserActiveEntitlements(user.user_id)` và dùng `getOptionalActiveChildUuid`.
  - `guest/levels/[code]/index.get.ts` & `guest/levels/index.get.ts`: Nhận diện optional user session, tính chính xác `locked` và `cta` (play, login, select_child, upgrade_standard, upgrade_premium).
  - `public-seo.ts` & `guest/home.get.ts`: Cập nhật mã game mẫu `GL-C1-CNT-CARD-0001` .. `GL-C6-MEM-CARD-0001`.
- **Frontend App**:
  - `PublicNavbar.vue`: Nhận diện `loggedIn`, hiển thị link Đăng nhập / Chơi thử (Guest) hoặc Sảnh chơi bé / Tài khoản (User).
  - `LandingHero.vue`: Nút CTA trỏ tới `GL-C1-CNT-CARD-0001`.
  - `games/index.vue` & `games/[code].vue`: Nút CTA đổi theo trạng thái auth và tier còn thiếu (`/login?redirect=...`, `/me/children?redirect=...`, `/pricing`).
  - `play/[code].vue`: Xử lý lỗi 403/428 kèm redirect url.
  - `login.vue`: Tạo trang `/login` hỗ trợ cả Đăng nhập và Đăng ký, tự động chuyển hướng theo `redirect` query param.

### Out of Scope
- Sửa đổi cấu trúc DB schema (đã có đủ các cột `access_tier`, `entitlements`, `child_profiles`).
- Chỉnh sửa logic gameplay canvas engine (đã tuân thủ `07-game-engine.md`).

---

## 3. Acceptance Criteria

- [x] **AC-1**: Khách vãng lai (Guest) truy cập `/play/GL-C1-CNT-CARD-0001` (level `free`) chơi được ngay lập tức, không bị báo yêu cầu đăng nhập.
- [x] **AC-2**: Khách vãng lai bấm chơi level `login` được điều hướng đến `/login?redirect=/play/...` và sau khi đăng nhập/đăng ký thành công thì quay lại chơi tiếp.
- [x] **AC-3**: User đã đăng nhập nhưng chưa chọn bé truy cập level `free` chơi được bình thường (200 OK); truy cập level `login`/`standard`/`premium` được hiển thị nút "Chọn hồ sơ bé" trỏ tới `/me/children?redirect=/play/...`.
- [x] **AC-4**: User có gói Standard/Premium nạp đúng cấu hình game các bài tương ứng mà không bị lỗi 403 `TIER_LOCKED`.
- [x] **AC-5**: Navbar hiển thị trạng thái đăng nhập chính xác (Guest: Đăng nhập + Chơi thử; User: Sảnh chơi bé + Tên tài khoản).
- [x] **AC-6**: Toàn bộ codebase vượt qua `pnpm check` (lint:safe, typecheck) không có lỗi TypeScript hay Biome formatting.
