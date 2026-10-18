# Task #312 Todo: Đổi định danh code `legacy_v1_*` sang tên dạng game nguồn (Legacy Ref Identifier Rename)

Plan: [`312-legacy-ref-identifier-rename-plan.md`](312-legacy-ref-identifier-rename-plan.md).
Spec: [`source-game-type-coverage.md`](../specs/08-quality/source-game-type-coverage.md) (`BR-LVC-*`), [`data-model-overview.md`](../specs/00-foundation/data-model-overview.md).

---

## S1 — Kiểm kê + chốt bảng tên
- [ ] Đếm theo mẫu và phân loại (cột, khoá TS, khoá JSON/JSONB, hằng, file, script, comment, API/admin)
- [ ] Kiểm định danh có lộ qua API/admin không (nếu có: sửa spec §8 trước)
- [ ] Người dùng chốt bảng tên 2.1

## S2 — Chụp test trước + sao lưu
- [ ] Danh sách `trạng-thái | tên-test` từng workspace (`vitest --reporter=json`)
- [ ] Kết quả `check:legacy-v1`, `typecheck`, `check:migration-hashes` (qua `rtk proxy`)
- [ ] Sao lưu file sẽ ghi ra ngoài repo

## S3 — Migration đổi tên cột
- [ ] Test đỏ: schema có `source_game_type_ref`, dữ liệu giữ nguyên
- [ ] Migration mới `0009_*` (SQL tay + `_journal.json`); không sửa `0001_*`
- [ ] Schema `packages/db/src/schema/game.ts`
- [ ] `rtk proxy pnpm check:migration-hashes` xanh (chỉ thêm)

## S4 — Codemod định danh + tên file
- [ ] Codemod AST (TS/Vue) + JSON, idempotent, in thống kê
- [ ] `git mv` 8 file `legacy-v1*` + symlink `packages/db/config/`
- [ ] Sửa `package.json`, `packages/content-build/package.json`, `scripts/check.sh`, `render-system.ts:2`
- [ ] rg định danh cũ ngoài `0001_*` = 0
- [ ] `rtk proxy pnpm check:source-game-type` = 59/59 bậc 3

## S5 — So test sau
- [ ] Danh sách test sau trùng khít (chỉ khác đường dẫn đã ánh xạ)
- [ ] `typecheck` không tăng nợ; cập nhật đường dẫn trong `scripts/test-baseline.json` nếu cần

## S6 — Seed + nội dung
- [ ] `seed:check` xanh; seed lại DB dev
- [ ] Sinh lại file `@generated` (`gen-levels`)
- [ ] `check:go-live`, `check:intro-coverage`, `check:engine-*` xanh

## S7 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] `check:migration-hashes`, `check:source-game-type`, test workspace bị chạm xanh (qua `rtk proxy`)
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Cập nhật định danh trong spec (source-game-type-coverage, phiếu GT, runtime-gates, index, business-rules)
- [ ] Bỏ `#312` khỏi `open_tasks` + khối "Chưa hoàn thành"; `implemented`; `reviewed`
- [ ] Commit vào `main`
