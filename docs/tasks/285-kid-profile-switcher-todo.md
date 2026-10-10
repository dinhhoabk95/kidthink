# Task #285 Todo: Đổi hồ sơ bé an toàn tại Sảnh chơi (Kid Profile Switcher)

Plan: [`285-kid-profile-switcher-plan.md`](285-kid-profile-switcher-plan.md).
Spec: [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md) (`BR-CPS-01..07`) · [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) (`BR-PEN-01..07`).

---

## S1 — Composable & Data Management

- [x] Tạo composable `apps/web/app/composables/play/use-kid-profile.ts`
- [x] Xử lý đọc danh sách trẻ, tính toán `activeChild`, quản lý `switchChild(uuid, gateToken)`
- [x] Viết unit test tại `apps/web/tests/unit/use-kid-profile.test.ts` (5/5 pass)

## S2 — UI Components

- [x] Tạo component `apps/web/app/components/kid/profile-badge.vue` (Avatar + Tên bé + icon đổi bé, touch target $\ge 64$px)
- [x] Tạo component `apps/web/app/components/kid/profile-switcher-modal.vue` (Modal chọn bé yêu, chuẩn Kid Surface claymorphism, không màu hex)
- [x] Viết component test tại `apps/web/tests/component/kid-profile-components.test.ts` (7/7 pass)

## S3 — Tích hợp Sảnh Chơi (`/play/index.vue`)

- [x] Gắn `KidProfileBadge` vào Top Bar của sảnh chơi `/play/index.vue`
- [x] Kết nối luồng mở `ParentGateModal` để lấy `gate_token` trước khi mở `KidProfileSwitcherModal`
- [x] Đồng bộ và cập nhật lại bài học `KidLessonRow` khi đổi bé thành công qua `:key="activeChildUuid"`
- [x] Cập nhật component test `apps/web/tests/component/play-lobby-page.test.ts` (7/7 pass)

## S4 — Nghiệm thu & Verification

- [x] Chạy `biome check .` sạch sẽ (0 lỗi, 2446 files)
- [x] Chạy `pnpm typecheck` đạt 0 lỗi toàn repo (10/10 target)
- [x] Chạy `bash scripts/check.sh --fast` đạt 100% pass (140/140 test suite, 2816 tests pass)
- [x] Commit hoàn tất lên nhánh `main`
