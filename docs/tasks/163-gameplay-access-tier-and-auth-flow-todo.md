# Task #163 Checklist — Gameplay Access Tier & Auth Flow Fix

- [x] T1.1: Cập nhật mã game free đại diện C1–C6 trong `public-seo.ts` và `home.get.ts`
- [x] T1.2: Thêm `getOptionalActiveChildUuid` trong `auth-runtime.ts`
- [x] T1.3: Cập nhật `GameConfigDeliveryOptions` và `assertContentAccess` trong `game-config-runtime.ts`
- [x] T1.4: Nạp `activeKeys` và dùng `getOptionalActiveChildUuid` trong `users/levels/[code]/config.get.ts`
- [x] T2.1: Tối ưu `guest/levels/[code]/index.get.ts` nhận diện user session, tính CTA và hạ cognitive complexity
- [x] T2.2: Tối ưu `guest/levels/index.get.ts` nhận diện user session và entitlements
- [x] T3.1: Thêm Auth State trong `PublicNavbar.vue` (Guest vs Logged-in User)
- [x] T3.2: Cập nhật CTA Hero trong `LandingHero.vue`
- [x] T3.3: Cập nhật điều hướng nút CTA trong `games/index.vue` và `games/[code].vue`
- [x] T3.4: Cập nhật xử lý redirect khi gặp lỗi 403/428 trong `play/[code].vue`
- [x] T3.5: Tạo mới trang `apps/web/app/pages/login.vue` (Đăng nhập + Đăng ký)
- [x] T4.1: Chạy `pnpm check` (lint:safe + typecheck) pass exit 0
- [x] T4.2: Chạy unit tests cho web app
