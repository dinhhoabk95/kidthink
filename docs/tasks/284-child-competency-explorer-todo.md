# Task #284 Todo: Khám phá trò chơi theo năng lực cho trẻ

Plan: [`284-child-competency-explorer-plan.md`](284-child-competency-explorer-plan.md).
Spec: [`child-competency-explorer.md`](../specs/04-play/child-competency-explorer.md).

## S1 — Spec & Registry

- [x] Tạo spec `docs/specs/04-play/child-competency-explorer.md` với các rules `BR-CCE-01..08`
- [x] Đăng ký prefix `BR-CCE` ở `docs/specs/00-foundation/business-rules.md`
- [x] Cập nhật số đếm spec ở `docs/specs/index.md` (04-play: 22, Tổng: 198)

## S2 — Backend API & Service

- [x] Tạo service `apps/web/server/services/child-competency-explorer.ts`
- [x] Export service tại `apps/web/server/services/index.ts`
- [x] Tạo endpoint `apps/web/server/api/users/play/competency/[code].get.ts`
- [x] Lọc game level theo năng lực `code` và `age_band` của trẻ đang chọn
- [x] Truy vấn thành tích sao và số lượt chơi từ `play_sessions`
- [x] Viết unit test cho service tại `apps/web/tests/unit/child-competency-explorer.test.ts`

## S3 — Giao diện Khám phá Năng lực (`/play/competency/[code]`)

- [x] Tạo trang `apps/web/app/pages/play/competency/[code].vue` với layout `kid`
- [x] Thiết kế Kid Top Bar: nút quay lại sảnh (≥64px), mascot Gấu Con, khoá phụ huynh
- [x] Lưới trò chơi trực quan: card claymorphism (≥64px), emoji lớn, sao vàng / ổ khoá trung tính
- [x] Chạm vào trò chơi mở trực tiếp `/play/[code]`
- [x] Viết component test tại `apps/web/tests/component/play-competency-page.test.ts`

## S4 — Kết nối Sảnh Chơi (`/play/index.vue`)

- [x] Thay đổi liên kết 6 thẻ năng lực ở `apps/web/app/pages/play/index.vue` sang `/play/competency/${c.code}`
- [x] Cập nhật test `apps/web/tests/component/play-lobby-page.test.ts`

## S5 — Nghiệm thu & Verification

- [x] Chạy `biome check .` sạch sẽ
- [x] Chạy `pnpm typecheck` xanh 10/10 target
- [x] Chạy `bash scripts/check.sh --fast` đạt 100% pass (lint, typecheck, vitest)
- [x] Commit hoàn tất lên nhánh `main`
