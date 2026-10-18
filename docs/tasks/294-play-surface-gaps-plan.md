# Kế hoạch Task #294: Vá các gap trên bề mặt chơi (Play Surface Gaps)

Contract: `docs/specs/04-play/progress-and-mastery.md` §7.2 (`BR-PRG-06`), `docs/specs/04-play/play-entry-and-profile-select.md` (`BR-PEN-05`, `BR-PEN-07`), `docs/specs/04-play/play-event-ingestion.md` (`BR-ING-07`), `docs/specs/04-play/child-competency-explorer.md` (`BR-CCE-08`, main flow bước 4), `docs/specs/04-play/parent-gate.md` §7.3 (`BR-PGT-05`, `BR-PGT-07`).

---

## 1. Bối cảnh & bằng chứng gap

| Spec | Bằng chứng | Thiếu |
| --- | --- | --- |
| progress-and-mastery §7.2 | `packages/play/src/badges.ts:29-32` chỉ truyền `distinctPlayDays` vào `evaluateBadges`; `isFirstStrandComplete` / `isWeekCurriculumComplete` (`packages/adaptive/src/badges.ts:32-41`) không caller nào set | 2/3 huy hiệu (`STRAND_FIRST_COMPLETE`, `WEEK_CURRICULUM_COMPLETE`) không bao giờ trao — modal Task #287 chỉ hiện được `PLAY_DAYS_5`; `BR-PRG-06` không có test nêu mã |
| play-event-ingestion | `infra/nginx/mindkid-limits.conf:8-9` chỉ có zone chung; `apps/web/server/middleware/rate-limit.ts` không nhắc route events | `BR-ING-07`: 600/IP · 300/tài khoản riêng cho `/api/*/play-sessions/*/events` |
| parent-gate §7.3 | Event `parent_gate_shown/passed/failed` có trong `packages/play/src/events/catalog.ts`, rg không thấy client phát trong `apps/web/app` (`components/parent-gate-modal.vue`, `composables/play/parent-gate-state.ts`) | Phát event; test gắn `BR-PGT-05`, `BR-PGT-07` |
| play-entry-and-profile-select | rg không thấy CTA đăng ký trong `pages/play/[code].vue` / `components/kid/victory-modal.vue`; rg không thấy `orientation.lock` (chỉ media query CSS) | `BR-PEN-05` lời mời đăng ký cho guest sau khi chơi (qua Parent Gate); `BR-PEN-07` khoá ngang best-effort |
| child-competency-explorer | `apps/web/app/pages/play/competency/[code].vue` dùng `brand-*` chung, không gọi speech; `is_locked` tính cứng `access_tier === "premium"` ở route `server/api/users/play/competency/[code].get.ts` | `BR-CCE-08` màu theo năng lực + mascot đọc lời giới thiệu; bước 4 khoá theo entitlement thật của gia đình |

## 2. Thiết kế

- **Huy hiệu.** Trong `packages/play/src/badges.ts`, tính `isFirstStrandComplete` từ mastery theo strand (`packages/play/src/mastery.ts`) và `isWeekCurriculumComplete` từ tiến độ curriculum (bảng enrollments/progress mà `curriculum/progress` route đọc). Truyền cả ba điều kiện vào `evaluateBadges`. Trao huy hiệu idempotent (unique `child_badges`).
- **Rate limit events.** Ưu tiên tầng Nginx (CLAUDE.md: Nginx giữ rate limit): zone riêng `play_events_ip` 600 r/m theo `$binary_remote_addr` + `location` khớp route events. Giới hạn 300/tài khoản cần định danh → middleware web dùng `@mindkid/cache` `checkRateLimit` (Redis) cho path events. Lỗi 429 qua lớp domain. Test hạ tầng ở `scripts`/`infra` tests hiện có.
- **Parent gate events.** Phát qua đúng client telemetry đang dùng cho event khác (không `$fetch` trần), payload theo catalog; không gửi đáp án thử thách.
- **Guest CTA.** `victory-modal.vue`: guest thấy nút "Ba mẹ đăng ký để lưu tiến độ" → Parent Gate → `/register`. Bề mặt trẻ: light-only, touch ≥ 64px, không hex, không điểm so sánh.
- **Khoá ngang.** `screen.orientation.lock("landscape")` best-effort khi vào `/play` trên thiết bị hỗ trợ; bỏ qua lỗi bằng nhánh kiểm năng lực (không `catch {}` nuốt im lặng — kiểm `"lock" in screen.orientation` và xử lý promise reject có ghi log debug). Nếu spec muốn khác thì sửa spec trước.
- **Competency explorer.** Màu theo token năng lực (map mã `C1`…`C6` → token có sẵn, không hex); mascot đọc lời giới thiệu bằng `useSpeech`; `is_locked` dùng entitlement thật (đường `access-gating` hiện có), không so `access_tier` cứng.

## 3. Lát cắt (Slices)

- **S1 — Hai huy hiệu còn thiếu (`BR-PRG-06`, §7.2).** Test trước (`packages/play/tests/…badges…`, `apps/web/tests/api/play-map.test.ts`): hoàn thành strand đầu → có `STRAND_FIRST_COMPLETE`; hoàn thành curriculum tuần → có `WEEK_CURRICULUM_COMPLETE`; chạy lại không trao trùng. Code: `badges.ts`.
- **S2 — Rate limit events (`BR-ING-07`).** Test trước: vượt 300 event/tài khoản/phút → 429 (`apps/web/tests/api/event-ingestion.test.ts`); test cấu hình nginx có zone + location. Code: nginx conf + middleware.
- **S3 — Parent gate events (§7.3, `BR-PGT-05/07`).** Test trước (`apps/web/tests/component/parent-gate-modal.test.ts`): mở → `parent_gate_shown`; đúng → `passed`; sai → `failed`; test gắn mã BR. Code: modal/composable.
- **S4 — Guest CTA + khoá ngang (`BR-PEN-05`, `BR-PEN-07`).** Test trước (`victory-modal.test.ts`, `play-lobby-page.test.ts`): guest thấy CTA, đi qua Parent Gate; user không thấy; `orientation.lock` được gọi khi có, không lỗi khi không có. Code.
- **S5 — Competency explorer (`BR-CCE-02`, `BR-CCE-08`, bước 4).** Test trước (`play-competency-page.test.ts`, `apps/web/tests/api/…competency…`): màu theo năng lực, gọi speech khi vào trang; gia đình có entitlement thì `is_locked=false` dù level premium; level ngoài `age_band` vẫn trả về, xếp sau level hợp tuổi (`BR-CCE-02` đổi 2026-10-18). Code. Nếu spec còn thiếu §8–§11 (Task #288 chưa bổ sung) thì bổ sung.
- **S6 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/play test`; `rtk proxy pnpm --filter @mindkid/adaptive test`; `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/play-map.test.ts tests/api/event-ingestion.test.ts tests/api/play-entry.test.ts tests/component/parent-gate-modal.test.ts tests/component/victory-modal.test.ts tests/component/play-competency-page.test.ts tests/component/play-lobby-page.test.ts`.
  - Bỏ `open_tasks` + khối "Chưa hoàn thành" ở 5 spec trong Contract, nâng `status: implemented`.
  - Commit lên `main`.
