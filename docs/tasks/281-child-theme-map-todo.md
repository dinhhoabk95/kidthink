# Task #281 Todo: Bản đồ chủ đề tuần cho trẻ tự học

Plan: [`281-child-theme-map-plan.md`](281-child-theme-map-plan.md).
Spec: [`child-theme-map.md`](../specs/04-play/child-theme-map.md).

## S1 — Spec & Registry

- [x] Tạo spec `docs/specs/04-play/child-theme-map.md` với các rules `BR-WTM-01..08`
- [x] Đăng ký prefix `BR-WTM` ở `docs/specs/00-foundation/business-rules.md`
- [x] Cập nhật số đếm spec ở `docs/specs/index.md` (04-play: 21, Tổng: 197)

## S2 — Backend API

- [x] Tạo endpoint `apps/web/server/api/users/play/theme-map.get.ts`
- [x] Truy vấn lộ trình `RM-*-year-01` theo độ tuổi trẻ (`active_child_id`)
- [x] Lấy danh sách bài học `lessons` và trạng thái `child_lesson_plays` của trẻ
- [x] Định vị trạm học tiếp theo (vị trí Gấu Con)

## S3 — Giao diện Bản đồ trẻ (`/play/map`)

- [x] Tạo trang `apps/web/app/pages/play/map.vue` với layout `kid`
- [x] Bố cục trạm tuần & đảo chủ đề theo phong cách Kid Surface (không hex, hit area ≥64px)
- [x] Tích hợp Mascot Gấu Con `KidMascot` tại trạm hiện tại
- [x] Lối thoát an toàn bằng `KidParentLockButton` về sảnh `/play`

## S4 — Kết nối Sảnh Chơi & Dọn dẹp

- [x] Thêm nút mở Bản đồ tại sảnh `/play/index.vue`
- [x] Sửa lỗi vi phạm hex color `#fff` tại `apps/web/app/components/kid/lesson-row.vue`

## S5 — Nghiệm thu & Verification

- [x] Chạy `bash scripts/check.sh --fast` đạt 100% pass (lint, typecheck, gates)
- [x] Commit hoàn tất lên nhánh `main`
