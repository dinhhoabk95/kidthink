# Task #286 Todo: Màn hình Giới hạn Giờ chơi Lành mạnh cho Trẻ em (Kid Play Limit Surface)

Plan: [`286-healthy-play-limits-kid-surface-plan.md`](286-healthy-play-limits-kid-surface-plan.md).
Spec: [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) (`BR-HPL-01..08`, §7.3).

---

## S1 — Composable & Xử lý lỗi
- [x] Bổ sung trạng thái `isPlayLimitReached` vào `apps/web/app/composables/play/use-play-error.ts`
- [x] Bắt mã lỗi `DAILY_PLAY_CAP_REACHED` / HTTP 402 với thông điệp ấm áp
- [x] Viết unit test cho `usePlayError` kiểm tra mã lỗi 402

## S2 — UI Component `KidPlayLimitModal`
- [x] Tạo `apps/web/app/components/kid/play-limit-modal.vue`
- [x] Mascot Gấu Con ấm áp, lời nhắc tiếng Việt thân thiện, 2 hoạt động ngoài màn hình
- [x] Tích hợp `ParentGateModal` để phụ huynh cấp thêm 15/30 phút (`POST /api/users/children/[uuid]/grant-extra-time`)
- [x] Nút về sảnh chơi `/play` (sàn chạm $\ge 64$px, không hex)
- [x] Viết component test cho `KidPlayLimitModal`

## S3 — Tích hợp Trang chơi (`/play/[code].vue`)
- [x] Gắn `KidPlayLimitModal` vào `apps/web/app/pages/play/[code].vue`
- [x] Sửa các đường link lỗi từ `/games` về `/play` trên bề mặt trẻ
- [x] Kiểm tra tương tác pause game và đồng bộ khi cấp thêm giờ thành công

## S4 — Nghiệm thu & Verification
- [x] Biome check sạch sẽ 0 lỗi
- [x] Typecheck web pass sạch sẽ
- [x] Toàn bộ test liên quan pass 100%
- [x] Commit hoàn tất lên nhánh `main`
