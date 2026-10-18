# Task #294 Todo: Vá các gap trên bề mặt chơi

Plan: [`294-play-surface-gaps-plan.md`](294-play-surface-gaps-plan.md).
Spec: `04-play/` progress-and-mastery (`BR-PRG-06`, §7.2), play-entry-and-profile-select (`BR-PEN-05/07`), play-event-ingestion (`BR-ING-07`), child-competency-explorer (`BR-CCE-08`), parent-gate (§7.3, `BR-PGT-05/07`).

---

## S1 — Huy hiệu strand/tuần
- [ ] Test đỏ: trao `STRAND_FIRST_COMPLETE` khi xong strand đầu
- [ ] Test đỏ: trao `WEEK_CURRICULUM_COMPLETE` khi xong curriculum tuần
- [ ] Test đỏ: không trao trùng; gắn mã `BR-PRG-06`
- [ ] Tính hai điều kiện trong `packages/play/src/badges.ts` và truyền vào `evaluateBadges`

## S2 — Rate limit events (`BR-ING-07`)
- [ ] Test đỏ: vượt 300/tài khoản → 429
- [ ] Zone nginx 600/IP + location route events (`infra/nginx/mindkid-limits.conf`)
- [ ] Middleware Redis cho giới hạn theo tài khoản

## S3 — Parent gate events
- [ ] Test đỏ: phát `parent_gate_shown/passed/failed`; gắn `BR-PGT-05/07`
- [ ] Phát event từ `parent-gate-modal.vue` / `parent-gate-state.ts`

## S4 — Guest CTA + khoá ngang
- [ ] Test đỏ: guest thấy CTA đăng ký sau khi chơi, qua Parent Gate (`BR-PEN-05`)
- [ ] Test đỏ: `orientation.lock` best-effort (`BR-PEN-07`)
- [ ] Sửa `victory-modal.vue` + vào `/play`

## S5 — Competency explorer
- [ ] Test đỏ: màu theo năng lực + speech lời giới thiệu (`BR-CCE-08`)
- [ ] Test đỏ: `is_locked` theo entitlement gia đình
- [ ] Sửa `pages/play/competency/[code].vue` và route `competency/[code].get.ts`
- [ ] Bổ sung §8–§11 cho spec nếu #288 chưa làm

## S6 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test play/adaptive/web liên quan xanh
- [ ] Bỏ `open_tasks` + khối "Chưa hoàn thành" ở 5 spec, nâng `status: implemented`
- [ ] Commit lên `main`
