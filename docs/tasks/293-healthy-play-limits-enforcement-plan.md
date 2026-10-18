# Kế hoạch Task #293: Thực thi giới hạn chơi lành mạnh phía server (Healthy Play Limits Enforcement)

Contract: `docs/specs/04-play/healthy-play-limits.md` main flow bước 3, §7.3, `BR-HPL-*` (trọng tâm `BR-HPL-07`), `docs/specs/04-play/access-gating.md` (bước quota), `docs/specs/04-play/parent-gate.md`.

---

## 1. Bối cảnh & bằng chứng gap

Task #286 làm phía client (modal `apps/web/app/components/kid/play-limit-modal.vue`); server chưa chặn:

| Gap | Bằng chứng |
| --- | --- |
| 402 `DAILY_PLAY_CAP_REACHED` không bao giờ ném | `checkQuotaRemaining` chỉ khai ở `packages/shared/src/access-gating.ts:204,285`; `apps/web/server/utils/game-config-runtime.ts:128-155` (`runContentAccessGuard`) không truyền |
| Rollup xoá giờ cấp thêm | `apps/worker/src/services/rollup.ts:79-87` ghi đè `total_play_time_seconds`, trong khi `apps/web/server/api/users/children/[uuid]/grant-extra-time.post.ts:79-88` trừ phần cấp thêm vào chính cột đó; `children/[uuid]/play-budget.get.ts:38-41` đọc cột này |
| `BR-HPL-07` không trừ thời gian tạm dừng | `rollup.ts:43` SUM `duration_seconds`, không trừ `paused_ms` (event `game_resumed`) |
| Phiên bỏ dở bị tính 30 phút | `packages/play/src/sweep.ts:50` gán cứng 1800 s khi không có duration |
| §7.3 "nút duy nhất qua Parent Gate" | Modal hết giờ còn nút về `/play` |

## 2. Thiết kế

- **Ngân sách = cap + extra − used.** Lưu phần cấp thêm ở cột riêng `child_daily_stats.extra_time_granted_minutes` (đã có ở `packages/db/src/schema/play.ts:136`), **không** trừ vào `total_play_time_seconds`. `grant-extra-time.post.ts` chỉ cộng cột extra; `play-budget.get.ts` tính remaining theo công thức trên. Một hàm thuần duy nhất `computeRemainingPlaySeconds(stats, cap)` trong `packages/play` (hoặc `packages/shared`) dùng chung cho route budget, guard và client.
- **Guard.** `runContentAccessGuard` truyền `checkQuotaRemaining`: đọc `child_daily_stats` hôm nay (múi giờ theo spec) + thời lượng phiên `in_progress` hiện tại; bỏ qua guest, preview của Manager, `lesson_run`/teach nếu spec miễn. Hết ngân sách → ném lỗi domain `DailyPlayCapReachedError` (402) — không try/catch dựng body.
- **Duration.** Thời lượng phiên = (end − start) − Σ `paused_ms` từ cặp `game_paused`/`game_resumed`; rollup dùng duration đã trừ. Sweep phiên bỏ dở: lấy mốc event cuối cùng (không có event → 0 s), bỏ hằng 1800.
- **Modal.** Hết giờ: nút duy nhất mở Parent Gate (gate xong → màn cấp thêm giờ); bỏ nút về `/play` trừ khi spec §7.3 cho phép (sửa spec trước nếu muốn giữ).

## 3. Lát cắt (Slices)

- **S1 — Hàm ngân sách + 402 ở guard.** Test trước: unit `computeRemainingPlaySeconds`; `apps/web/tests/api/healthy-play-limits.test.ts` — trẻ đã dùng hết cap gọi `GET …/levels/{code}/config` → 402 `DAILY_PLAY_CAP_REACHED`; guest và preview không bị chặn; có extra time → 200. Code: guard + lỗi domain.
- **S2 — Rollup không ghi đè giờ cấp thêm.** Test trước: cấp thêm 15' → chạy rollup (`apps/worker/src/consumers/rollup-session.test.ts`) → `play-budget` vẫn còn 15'. Code: dùng cột `extra_time_granted_minutes` có sẵn, sửa `grant-extra-time.post.ts`, `play-budget.get.ts`, `rollup.ts:79-87`.
- **S3 — `BR-HPL-07` paused + sweep.** Test trước: phiên 10' có 4' tạm dừng → rollup 6'; phiên bỏ dở không event → 0 s, có event cuối → tính tới event đó (`packages/play` sweep test, `apps/web/tests/api/sweep-abandoned.test.ts`). Code: `rollup.ts:43`, `sweep.ts:50`.
- **S4 — Modal một nút qua Parent Gate (§7.3).** Test trước: `apps/web/tests/component/kid-play-limit-modal.test.ts` — chỉ có một nút, bấm mở Parent Gate. Code: `play-limit-modal.vue` (bề mặt trẻ: light-only, touch ≥ 64px, không hex).
- **S5 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/healthy-play-limits.test.ts tests/api/game-config-delivery.test.ts tests/api/sweep-abandoned.test.ts tests/component/kid-play-limit-modal.test.ts`; `rtk proxy pnpm --filter @mindkid/worker test`; `rtk proxy pnpm --filter @mindkid/play test`; `rtk proxy pnpm --filter @mindkid/shared test`.
  - Bỏ `open_tasks` + khối "Chưa hoàn thành" ở `healthy-play-limits.md`, nâng `status: implemented`.
  - Commit lên `main`.

## 4. Rủi ro

- `game-config-delivery.test.ts` có thể cần fixture `child_daily_stats`; không nới assert hiện có.
- `apps/web/server/utils/entitlements-runtime.ts` đang bị sửa dở bởi người khác — nếu guard cần đọc entitlement (cap theo gói), kiểm `git status` và phối hợp.
