# Task #163 Plan — Gameplay Access Tier & Auth Flow Fix

> **Outcome:** Thực hiện theo từng lát cắt dọc từ Backend Gating Runtime -> API Endpoints -> UI Components -> Verification.

---

## 1. Work Breakdown Structure

### Phase 1: Gating & Auth Runtime Fix
- **T1.1**: Sửa `packages/shared/src/public-seo.ts` và `apps/web/server/api/guest/home.get.ts` cập nhật 6 mã game free thực tế (`GL-C1-CNT-CARD-0001` .. `GL-C6-MEM-CARD-0001`).
- **T1.2**: Sửa `apps/web/server/utils/auth-runtime.ts` xuất hàm `getOptionalActiveChildUuid(event)`.
- **T1.3**: Sửa `apps/web/server/utils/game-config-runtime.ts` nhận `activeKeys?: EntitlementKey[]` và truyền vào `assertContentAccess`.
- **T1.4**: Sửa `apps/web/server/api/users/levels/[code]/config.get.ts` nạp `activeKeys` qua `resolveUserActiveEntitlements(user.user_id)` và sử dụng `getOptionalActiveChildUuid`.

### Phase 2: Guest API Session Awareness
- **T2.1**: Sửa `apps/web/server/api/guest/levels/[code]/index.get.ts` nhận diện optional user session, tính chính xác `locked` và `cta` (play, login, select_child, upgrade_standard, upgrade_premium), tách nhỏ các hàm phụ để đảm bảo cognitive complexity < 15.
- **T2.2**: Sửa `apps/web/server/api/guest/levels/index.get.ts` nhận diện user session và entitlements để hiển thị trạng thái `locked: false` chính xác cho user.

### Phase 3: Frontend UI & Auth State Integration
- **T3.1**: Sửa `apps/web/app/components/public-navbar.vue` tích hợp `useUserSession()` hiển thị Guest (Đăng nhập / Chơi thử) và User (Sảnh chơi bé `/play` / Tài khoản `/me`).
- **T3.2**: Sửa `apps/web/app/components/landing-hero.vue` liên kết CTA trỏ tới level free thực tế.
- **T3.3**: Sửa `apps/web/app/pages/games/index.vue` và `apps/web/app/pages/games/[code].vue` điều hướng nút CTA theo trạng thái auth và gói học.
- **T3.4**: Sửa `apps/web/app/pages/play/[code].vue` xử lý lỗi 403 và 428 kèm tham số `redirect`.
- **T3.5**: Tạo mới trang `apps/web/app/pages/login.vue` hỗ trợ Đăng nhập và Đăng ký kèm điều hướng `redirect`.

### Phase 4: Quality Gate & Verification
- **T4.1**: Chạy `pnpm lint:safe` và `pnpm check` đảm bảo typecheck và linting xanh 100%.
- **T4.2**: Chạy unit tests cho các luồng auth, access gating, và config delivery.
