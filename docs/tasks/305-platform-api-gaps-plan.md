# Kế hoạch Task #305: Lấp gap API và contract nền tảng (Platform API Gaps)

Contract:
- `docs/specs/01-platform/auth-tokens-sessions.md` §8 (`GET/DELETE /api/managers/auth/sessions[/{id}]`)
- `docs/specs/01-platform/audit-log.md` (`BR-AUD-02`, `BR-AUD-03`, danh sách action đóng §7.2)
- `docs/specs/05-content/content-tagging.md` §8 (`PUT /api/managers/content/{type}/{id}/tags`), `BR-TAG-05`, `BR-TAG-06`
- `docs/specs/01-platform/automated-payment.md` §3/§8 (checkout-session, đối soát), `BR-APM-06`
- `docs/specs/01-platform/game-layout-engine.md` (`BR-LAY-02`)
- `docs/specs/00-foundation/data-model-overview.md` (`BR-DM-08`)
- `docs/specs/01-platform/engine-play-language.md` (`BR-EPL-01`…`BR-EPL-06`)
- `docs/specs/01-platform/game-template-contract.md` (`BR-GTC-10`)

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G2 §A, §E):

| Spec | Hụt | Bằng chứng |
|---|---|---|
| auth-tokens-sessions | Route sessions của Manager | Chỉ có `apps/web/server/api/users/auth/sessions.get.ts`, `sessions/[id].delete.ts`; không có bản `managers/auth/sessions*` |
| audit-log | `BR-AUD-02/03` | `apps/web/server/api/managers/users/[uuid]/suspend.post.ts:67-70` insert thẳng `auditLogs` với action `manager.user.suspended` (ngoài danh sách §7.2, bỏ qua `writeAudit` ở `packages/audit/src/index.ts:117`). Các action `user_suspended`, `user_reactivated`, `user_deleted`, `quota_reset`, `bonus_days_granted`, `package_catalog_deployed`, `child_profile_archived`, `child_data_purged` chỉ khai ở `packages/shared/src/audit.ts`, không nơi nào ghi |
| content-tagging | Route PUT tags, `BR-TAG-05/06` | `packages/db/src/tagging.ts` có validator nhưng rg `tagging` trong `apps/web/server` không thấy; chỉ có `guest/tags.get.ts` |
| automated-payment | checkout-session, reconciliation | Webhook + `apps/web/server/services/automated-payment.ts` (`reconcileAutomatedPayments` dòng 274) có; find `checkout-session`, `payments/reconciliation`: không thấy route |
| game-layout-engine | `BR-LAY-02` ở đường PATCH | `levels/index.post.ts:197-206` ép `LAYOUT_NOT_SUPPORTED`, nhưng `apps/web/server/api/managers/levels/[code]/[version].patch.ts:38-39` ghi `difficulty_params` không kiểm `layout_id` |
| data-model-overview | `BR-DM-08` (`updated_at`, không ngoại lệ) | `lesson_run_observations` (`packages/db/src/schema/lesson-runs.ts:105`) không có `updated_at` |
| engine-play-language | `BR-EPL-01..06` không test | Từ vựng ở `packages/game-engine/src/interaction.ts:6-21`; rg `BR-EPL-` trong apps/packages/scripts không thấy |
| game-template-contract | `BR-GTC-10` | Spec tự ghi "chưa nối vào cổng nào"; rg `BR-GTC-10`/round-trip không thấy test |

Mục tiêu: tám spec khớp code, mỗi BR có test trỏ mã.

## 2. Thiết kế

- **Route mới** theo mẫu route cùng loại đã có: guard (`requireManagerAuth`), Zod parse body/param cùng file (`BR-SEC-04`), ném lớp lỗi `@mindkid/errors` — **không** `try/catch` trong route. Ghi audit bằng `writeAudit(tx, …)` trong cùng transaction.
- **Audit:** sửa `suspend.post.ts`, `reactivate.post.ts` sang `writeAudit(tx, { action: "user_suspended" | "user_reactivated" })`; nối các luồng còn lại. `apps/worker/src/consumers/account-purge.ts` đang có thay đổi dở trong cây làm việc → kiểm `git status` trước khi sửa, không ghi đè. Thêm test bảo đảm action ghi vào DB thuộc danh sách đóng §7.2 (quét `auditLogs` insert trực tiếp ngoài `packages/audit` → đỏ).
- **Tags PUT:** gọi validator `packages/db/src/tagging.ts`; nội dung `published` → 409 bằng lớp lỗi domain; audit.
- **Checkout-session / reconciliation:** `apps/web/server/api/users/orders/[uuid]/checkout-session.post.ts`; `apps/web/server/api/managers/payments/reconciliation/{index.get,run.post}.ts` gọi `reconcileAutomatedPayments`. Các file webhook/payment đang dở trong cây làm việc (git status) — đồng bộ với người đang sửa trước.
- **PATCH level:** kiểm `difficulty_params.layout_id ∈ template.layouts`, ném `LayoutNotSupportedError` (dùng chung hàm kiểm với `index.post.ts`, không chép).
- **`updated_at`:** migration **mới** thêm cột (không sửa migration cũ — `check:migration-hashes`); cập nhật schema Drizzle.
- **BR-EPL:** test ở `packages/game-engine/tests/` gắn mã: nuốt cử chỉ sau thắng (04), không đỏ/buzzer (05), fallback tap-tap band 3-4…
- **BR-GTC-10:** test round-trip toàn bộ level seed × `content_contract` ở `packages/content-build/tests/gates/`, có ca âm (fixture level lệch contract trong `tests/**/fixtures/`), nối vào `scripts/check.sh`. Cổng không đọc `process.cwd()` — dùng `repoPath()`.

## 3. Lát cắt dọc

- **S1 — Manager sessions** — Test trước: GET liệt kê phiên của manager; DELETE phiên khác → thu hồi; DELETE phiên người khác → 404. Xong khi: test API xanh; spec §8 khớp.
- **S2 — Audit đúng action** — Test trước: suspend/reactivate ghi `user_suspended`/`user_reactivated` qua `writeAudit`; ca âm insert `auditLogs` trực tiếp ngoài `packages/audit` → cổng đỏ. Nối lần lượt `quota_reset`, `bonus_days_granted`, `package_catalog_deployed`, `child_profile_archived`, `child_data_purged`, `user_deleted`, mỗi action một test. Xong khi: 8 action có nơi ghi + test.
- **S3 — PUT tags** — Test trước `BR-TAG-05/06`: tag sai từ điển → 422; nội dung published → 409; hợp lệ → 200 + audit. Xong khi: test xanh.
- **S4 — Checkout-session + đối soát** — Test trước: tạo checkout-session cho đơn của chính user; đơn người khác → 404; reconciliation GET/POST run gọi service và ghi audit (`BR-APM-06`). Xong khi: test xanh.
- **S5 — PATCH level kiểm layout** — Test trước: PATCH `layout_id` ngoài `template.layouts` → `LAYOUT_NOT_SUPPORTED`. Xong khi: xanh.
- **S6 — `updated_at` cho `lesson_run_observations`** — Test trước: schema test đòi mọi bảng có `updated_at` (`BR-DM-08`). Migration mới; `rtk proxy pnpm check:migration-hashes` xanh.
- **S7 — Test `BR-EPL-01..06`** — Viết test gắn mã; nếu một BR không đúng với code → mở lỗi, sửa code (không nới spec). Nâng status engine-play-language khi đủ.
- **S8 — Cổng round-trip `BR-GTC-10`** — Ca âm trước, rồi quét corpus thật; nối `scripts/check.sh`.
- **S9 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, test web/worker/game-engine/content-build liên quan, `rtk proxy pnpm check:migration-hashes`, `rtk proxy pnpm check:error-codes`, `rtk proxy pnpm check:test-ratchet`; `security-checklist.test.ts` xanh cho route mới.
  - Spec: 8 file — bỏ `#305` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `status: implemented` (engine-play-language từ `draft`); `reviewed`.
  - Commit vào `main`.
