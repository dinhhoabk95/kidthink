# Task #287 Todo: Modal Chúc mừng Huy hiệu Kỷ niệm tại Sảnh chơi (Badge Milestone Celebration Modal)

Plan: [`287-badge-celebration-modal-plan.md`](287-badge-celebration-modal-plan.md).
Spec: [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) §4 item 5, §7.2, `BR-PRG-02`, `BR-PRG-04`, `BR-PRG-07`.

---

## S1 — Metadata Huy hiệu & Composable `useBadgeCelebration`
- [x] Tạo `apps/web/app/composables/play/use-badge-celebration.ts`
- [x] Định nghĩa metadata: `STRAND_FIRST_COMPLETE`, `WEEK_CURRICULUM_COMPLETE`, `PLAY_DAYS_5`
- [x] Logic lọc huy hiệu mới chưa xem và hàm đánh dấu đã xem theo `childUuid`
- [x] Viết unit test cho composable `use-badge-celebration.test.ts`

## S2 — UI Component `KidBadgeCelebrationModal`
- [x] Tạo `apps/web/app/components/kid/badge-celebration-modal.vue`
- [x] Thiết kế Kid Claymorphism: Mascot Gấu Con ăn mừng, huy hiệu rực rỡ, hạt pháo hoa nhẹ nhàng
- [x] Nút "Tuyệt vời bé ơi!" sàn touch $\ge 64$px, không dùng mã màu hex
- [x] Hỗ trợ nút loa phát âm thanh chúc mừng
- [x] Viết component test cho `KidBadgeCelebrationModal`

## S3 — Tích hợp Sảnh chơi `/play/index.vue`
- [x] Tích hợp `useBadgeCelebration` và `KidBadgeCelebrationModal` vào `apps/web/app/pages/play/index.vue`
- [x] Kích hoạt modal khi API `/api/users/play/map` trả về huy hiệu chưa xem
- [x] Đóng modal và lưu trạng thái đã xem vào localStorage khi trẻ bấm nút xác nhận
- [x] Bổ sung component test tích hợp trong `play-lobby-page.test.ts`

## S4 — Nghiệm thu & Verification
- [x] Chạy Biome check sạch sẽ 0 lỗi
- [x] Chạy typecheck sạch sẽ
- [x] Toàn bộ test liên quan pass 100%
- [x] Commit lên nhánh `main`
