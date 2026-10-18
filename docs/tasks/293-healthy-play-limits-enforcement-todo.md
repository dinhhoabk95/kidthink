# Task #293 Todo: Thực thi giới hạn chơi lành mạnh phía server

Plan: [`293-healthy-play-limits-enforcement-plan.md`](293-healthy-play-limits-enforcement-plan.md).
Spec: [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) main flow bước 3, §7.3, `BR-HPL-07`.

---

## S1 — Ngân sách + 402
- [ ] Test đỏ unit `computeRemainingPlaySeconds` (cap + extra − used)
- [ ] Test đỏ: hết cap → 402 `DAILY_PLAY_CAP_REACHED`; guest/preview không bị chặn; có extra → 200
- [ ] Truyền `checkQuotaRemaining` trong `runContentAccessGuard` (`game-config-runtime.ts:128-155`)
- [ ] Lỗi domain `DailyPlayCapReachedError` ở `@mindkid/errors`

## S2 — Rollup không ghi đè giờ cấp thêm
- [ ] Test đỏ: cấp thêm 15' rồi chạy rollup, budget vẫn còn 15'
- [ ] Dùng cột `extra_time_granted_minutes` (`packages/db/src/schema/play.ts:136`) thay vì trừ vào `total_play_time_seconds`
- [ ] Sửa `grant-extra-time.post.ts:79-88`, `play-budget.get.ts:38-41`, `rollup.ts:79-87`

## S3 — `BR-HPL-07` + sweep
- [ ] Test đỏ: trừ `paused_ms` khi tính duration
- [ ] Test đỏ: phiên bỏ dở không event → 0 s; có event → tới event cuối
- [ ] Sửa `rollup.ts:43` và bỏ hằng 1800 ở `packages/play/src/sweep.ts:50`

## S4 — Modal §7.3
- [ ] Test đỏ: modal hết giờ chỉ có một nút, mở Parent Gate
- [ ] Sửa `play-limit-modal.vue` (light-only, touch ≥ 64px, không hex)

## S5 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test web/worker/play/shared liên quan xanh
- [ ] Bỏ `open_tasks` + khối "Chưa hoàn thành", nâng `status: implemented`
- [ ] Commit lên `main`
