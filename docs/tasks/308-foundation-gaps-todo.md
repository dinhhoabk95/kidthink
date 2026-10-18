# Task #308 Todo: Lấp gap nền móng (Foundation Gaps)

Plan: [`308-foundation-gaps-plan.md`](308-foundation-gaps-plan.md).
Spec: [`access-ladder.md`](../specs/00-foundation/access-ladder.md) `BR-LAD-07`, [`api-error-client.md`](../specs/00-foundation/api-error-client.md) `BR-AEC-02/03`, [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) `BR-CLC-01`, [`content-versioning.md`](../specs/00-foundation/content-versioning.md) `BR-VER-03`.

---

## S1 — Guest đúng 6 level (`BR-LAD-07`)
- [ ] Test đỏ: level `free` ngoài allow-list → `TIER_LOCKED`; bất biến allow-list trên corpus
- [ ] Allow-list một nguồn trong `packages/shared`; áp ở `access-ladder.ts` và route `guest/levels/**`

## S2 — Error client helper (`BR-AEC-03`)
- [ ] Chốt kiểu `getFieldErrors` (sửa spec trước nếu giữ mảng)
- [ ] Test đỏ `isApiErrorCode` (type guard) + `getFieldErrors`
- [ ] Cài trong `packages/errors/src/client.ts`; cập nhật chỗ gọi

## S3 — Bỏ `$fetch(` trần (`BR-AEC-02`)
- [ ] Cổng + ca âm ở `apps/web/tests/gates/` (fixture trong `tests/**/fixtures/`)
- [ ] Chụp danh sách test web (trước)
- [ ] Chuyển 30 chỗ sang `useApi()` (codemod nếu diff > 500 dòng)
- [ ] Chụp danh sách test (sau) — trùng khít

## S4 — Trigger `BR-CLC-01`
- [ ] Test đỏ `UPDATE` hàng published bị từ chối; archive qua được
- [ ] Migration mới tạo trigger cho `game_levels`, `lessons`, `activities`, `curricula`
- [ ] `rtk proxy pnpm check:migration-hashes` xanh

## S5 — `content_version` NOT NULL (`BR-VER-03`)
- [ ] Kiểm có event không gắn level không (nếu có: sửa spec trước)
- [ ] Test đỏ insert thiếu `content_version`
- [ ] Migration mới (xử lý hàng NULL cũ) + Zod event bắt buộc

## S5b — `pre-push` = `pnpm check` (`BR-RBS-03`)
- [ ] `lefthook.yml`: job `check` chạy `pnpm services && pnpm check`
- [ ] Ca âm: test DB đỏ tạm → push bị chặn; Postgres tắt → push bị chặn

## S6 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test shared/errors/db/web liên quan + `check:migration-hashes` xanh
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Kiểm lại `repo-bootstrap.md` `BR-RBS-03` khớp `lefthook.yml`
- [ ] Bỏ `#308` khỏi `open_tasks` + khối "Chưa hoàn thành" ở 4 spec; nâng `implemented`; `reviewed`
- [ ] Commit vào `main`
