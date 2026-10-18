# Task #305 Todo: Lấp gap API và contract nền tảng (Platform API Gaps)

Plan: [`305-platform-api-gaps-plan.md`](305-platform-api-gaps-plan.md).
Spec: [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md), [`audit-log.md`](../specs/01-platform/audit-log.md), [`content-tagging.md`](../specs/05-content/content-tagging.md), [`automated-payment.md`](../specs/01-platform/automated-payment.md), [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md), [`data-model-overview.md`](../specs/00-foundation/data-model-overview.md), [`engine-play-language.md`](../specs/01-platform/engine-play-language.md), [`game-template-contract.md`](../specs/01-platform/game-template-contract.md).

---

## S1 — Manager sessions
- [ ] Test đỏ GET/DELETE `/api/managers/auth/sessions[/{id}]`
- [ ] Route theo mẫu bản users

## S2 — Audit đúng action (`BR-AUD-02/03`)
- [ ] Cổng/ca âm: insert `auditLogs` ngoài `packages/audit` → đỏ
- [ ] `suspend.post.ts`, `reactivate.post.ts` → `writeAudit`
- [ ] Nối `quota_reset`, `bonus_days_granted`, `package_catalog_deployed`, `child_profile_archived`, `child_data_purged`, `user_deleted` (kiểm thay đổi dở ở `account-purge.ts` trước)

## S3 — PUT tags (`BR-TAG-05/06`)
- [ ] Test đỏ 422 / 409 / 200 + audit
- [ ] Route gọi validator `packages/db/src/tagging.ts`

## S4 — Checkout-session + đối soát (`BR-APM-06`)
- [ ] Test đỏ checkout-session (chủ đơn / không phải chủ)
- [ ] Test đỏ reconciliation GET + POST run
- [ ] Route mới gọi `reconcileAutomatedPayments`

## S5 — PATCH level kiểm layout (`BR-LAY-02`)
- [ ] Test đỏ `LAYOUT_NOT_SUPPORTED` ở PATCH
- [ ] Dùng chung hàm kiểm với `index.post.ts`

## S6 — `updated_at` (`BR-DM-08`)
- [ ] Test đỏ mọi bảng có `updated_at`
- [ ] Migration mới + schema `lesson-runs.ts`
- [ ] `rtk proxy pnpm check:migration-hashes` xanh

## S7 — Test `BR-EPL-01..06`
- [ ] Test gắn mã cho 6 BR; sửa code nếu lệch

## S8 — Cổng round-trip `BR-GTC-10`
- [ ] Fixture ca âm trong `tests/**/fixtures/`
- [ ] Quét corpus thật; nối `scripts/check.sh`

## S9 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test liên quan + `check:migration-hashes` + `check:error-codes` xanh
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Bỏ `#305` khỏi `open_tasks` + khối "Chưa hoàn thành" ở 8 spec; nâng `implemented`; `reviewed`
- [ ] Commit vào `main`
