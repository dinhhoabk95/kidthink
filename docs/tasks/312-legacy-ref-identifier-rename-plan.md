# Kế hoạch Task #312: Đổi định danh code `legacy_v1_*` sang tên dạng game nguồn (Legacy Ref Identifier Rename)

Contract: `docs/specs/08-quality/source-game-type-coverage.md` (id `SOURCE-GAME-TYPE-COVERAGE`, tiền tố `BR-LVC-*` giữ nguyên), `docs/specs/00-foundation/data-model-overview.md` (quy ước đặt tên cột), `docs/specs/00-foundation/business-rules.md` (`BR-REG2-*`: không đổi số BR); cổng `check:migration-hashes` (migration đã apply cấm sửa).

Cỡ: **L** (khoảng 152 file, 753 lần xuất hiện ngoài `docs/`, trong đó ~668 ở `packages/content`). Theo mục "Refactor diện rộng" của `CLAUDE.md`: **codemod**, không sửa tay.

---

## 1. Bối cảnh & Mục tiêu

Đợt #288 đã xoá chữ "v1" khỏi văn xuôi spec và đổi tên spec `legacy-v1-coverage.md` → `source-game-type-coverage.md`, nhưng giữ nguyên định danh code (spec dòng 26: "Tên code sẽ đổi ở Task #312"). Bằng chứng (audit G9 §B, G3 §B, G4 §B; đo lại 2026-10-18 bằng `rtk proxy rg`):

- Cột DB `game_levels.legacy_v1_ref` (`packages/db/src/schema/game.ts:66`), thêm bởi migration đã apply `packages/db/src/migrations/0001_add_legacy_v1_ref.sql` (hash nằm trong `scripts/migration-hashes.json` → **không được sửa**).
- Phân bố file chứa `legacy_v1_ref|LEGACY_V1|legacy-v1|legacyV1` ngoài `docs/`: `packages/content` 131, `packages/content-build` 9, `packages/shared` 4, `packages/db` 3, `scripts/content` 2, `scripts/migration-hashes.json`, `scripts/check.sh`, `package.json`.
- File mang tên `legacy-v1`:
  - `packages/shared/src/constants/legacy-v1-game-types.ts` (+ `packages/shared/tests/legacy-v1-game-types.test.ts`)
  - `packages/content-build/src/gates/legacy-v1-coverage.ts` (+ `tests/gates/legacy-v1-coverage.test.ts`)
  - `packages/content-build/src/thresholds/legacy-v1-coverage.json` và symlink `packages/db/config/legacy-v1-coverage.json`
  - `packages/game-engine/tests/legacy-v1-template-batch.test.ts`, `legacy-v1-engine-rules.test.ts`
- Script `check:legacy-v1` (`package.json:60`, `packages/content-build/package.json:37`), gọi ở `scripts/check.sh:177` (comment dòng 176 "Cổng độ phủ v1 legacy").
- Comment `packages/game-engine/src/systems/render-system.ts:2` "ported & adapted from v1 tinimath".

Mục tiêu: không còn định danh code mang chữ `legacy_v1`/`LEGACY_V1`/`legacy-v1` (trừ migration lịch sử `0001_*` và tài liệu task lịch sử `docs/tasks/1xx-*`), hành vi không đổi, dữ liệu DB giữ nguyên.

## 2. Thiết kế

### 2.1 Bảng đổi tên (chốt ở S1, đề xuất)

| Cũ | Mới |
|---|---|
| cột `legacy_v1_ref`, khoá object `legacy_v1_ref` | `source_game_type_ref` |
| `legacyV1Ref` (nếu có) | `sourceGameTypeRef` |
| `LEGACY_V1_GAME_TYPES` | `SOURCE_GAME_TYPES` |
| `LEGACY_V1_ID_SET` | `SOURCE_GAME_TYPE_ID_SET` |
| `LEGACY_V1_*` khác | `SOURCE_GAME_TYPE_*` |
| `legacy-v1-game-types.ts` | `source-game-types.ts` |
| `legacy-v1-coverage.{ts,json,test.ts}` | `source-game-type-coverage.{ts,json,test.ts}` |
| `check:legacy-v1` | `check:source-game-type` |
| `legacy-v1-template-batch.test.ts`, `legacy-v1-engine-rules.test.ts` | tên theo lô mới của đợt #288 (vd `activity-catalog-*`) |

### 2.2 Codemod

- Viết codemod TypeScript trong scratchpad/`scripts/codemods/` (xoá sau khi xong hoặc giữ nếu repo có quy ước), dùng **AST** (ts-morph hoặc TypeScript compiler API) cho `.ts`/`.vue` script và parser JSON cho `.json` — không regex trên nguồn thô (bài học CLAUDE.md: regex bắt cả chữ trong văn xuôi và chuỗi). Khoá chuỗi trong object literal (`legacy_v1_ref: "D1-10"`) là property name → đổi qua AST.
- Đổi tên file bằng `git mv` để giữ lịch sử; cập nhật mọi import.
- Chạy được nhiều lần (idempotent), in thống kê số thay thế theo file để đối chiếu với số đo ở S1.
- Sao lưu các file sẽ ghi ra ngoài repo trước khi chạy (cây làm việc có thay đổi dở của người khác — **không** dùng `git checkout` để hoàn tác).

### 2.3 Migration

- Migration **mới** (số kế tiếp, hiện là `0009_*`) chỉ có `ALTER TABLE "game_levels" RENAME COLUMN "legacy_v1_ref" TO "source_game_type_ref";` (+ đổi tên index nếu có index theo tên cột). Viết tay SQL + entry `meta/_journal.json` theo cách các migration `0001`…`0008` đã làm (drizzle-kit hỏi tương tác khi rename — môi trường không hỗ trợ). Cập nhật `scripts/migration-hashes.json` bằng lệnh của cổng, chỉ **thêm** dòng mới.
- Không sửa `0001_add_legacy_v1_ref.sql`.
- Rename cột giữ dữ liệu; không cần backfill. Nếu `legacy_v1_ref` còn nằm trong JSONB (`content_pack`/`difficulty_params`) thì cần migration dữ liệu riêng — S1 phải đo.

### 2.4 Bất biến hành vi

- Chụp danh sách `trạng-thái | tên-test` của **toàn repo** trước và sau (`vitest --reporter=json`, chạy từng workspace để tránh timeout tích hợp DB khi gộp) — yêu cầu trùng khít, chỉ cho phép đổi **đường dẫn file** của các test bị `git mv` (đối chiếu theo bảng đổi tên).
- `check:source-game-type` cho kết quả giống `check:legacy-v1` trước đó (59/59, bậc 3).

## 3. Lát cắt dọc

- **S1 — Kiểm kê + chốt bảng tên**
  - `rtk proxy rg -c` theo từng mẫu, tách: cột DB, khoá object TS, khoá JSON/JSONB, hằng, tên file, script, comment, API response/admin UI. Ghi số vào plan.
  - Kiểm `legacy_v1_ref` có lộ ra API (`apps/web/server/api/**`) hay admin (`apps/admin/**`) không → đó là đổi contract API: sửa spec sở hữu §8 trước.
  - Trình bảng 2.1 cho người dùng chốt.
  - Xong khi: bảng tên chốt; danh sách phân loại có số.
- **S2 — Chụp test trước + sao lưu**
  - Danh sách test toàn repo (từng workspace), kết quả `rtk proxy pnpm check:legacy-v1`, `rtk proxy pnpm typecheck`, `rtk proxy pnpm check:migration-hashes`.
  - Sao lưu file trong danh sách S1 ra ngoài repo.
  - Xong khi: snapshot lưu ở scratchpad.
- **S3 — Migration đổi tên cột** (test trước)
  - Test trước (`packages/db/tests`): schema có `source_game_type_ref`, không còn `legacy_v1_ref`; migration áp trên DB dev (`127.0.0.1:5433`) giữ nguyên giá trị.
  - Đổi schema Drizzle `game.ts:66` cùng lúc.
  - Xong khi: test xanh; `rtk proxy pnpm check:migration-hashes` xanh (chỉ thêm hash mới).
- **S4 — Codemod định danh + tên file**
  - Chạy codemod trên `packages/*`, `apps/*`, `scripts/*`; `git mv` file; sửa `package.json` script, `scripts/check.sh` (cả comment dòng 176, thông báo dòng 332), symlink `packages/db/config/`, comment `render-system.ts:2`.
  - Test trước: chính snapshot S2 là test; thêm một test tìm kiếm: rg định danh cũ trong `apps/ packages/ scripts/` (trừ `0001_*`, `migration-hashes.json` dòng cũ) = 0.
  - Xong khi: rg = 0; `rtk proxy pnpm check:source-game-type` = 59/59 bậc 3.
- **S5 — So test sau**
  - Chạy lại danh sách test toàn repo; so với S2 → trùng khít (chỉ khác đường dẫn đã ánh xạ). `rtk proxy pnpm typecheck` không tăng nợ; `check:test-ratchet`: số suite không tụt, cập nhật đường dẫn file trong `scripts/test-baseline.json` nếu file đổi tên có mặt ở đó.
  - Xong khi: diff snapshot rỗng.
- **S6 — Seed + nội dung**
  - `rtk proxy pnpm --filter @mindkid/content-build seed:check` và seed lại DB dev; level giữ đúng `source_game_type_ref`.
  - Xong khi: seed xanh; `check:go-live`, `check:intro-coverage`, `check:engine-*` xanh.
- **S7 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, `rtk proxy pnpm check:migration-hashes`, `rtk proxy pnpm check:source-game-type`, `rtk proxy pnpm check:test-ratchet`, test từng workspace bị chạm.
  - Spec: cập nhật định danh trong `source-game-type-coverage.md` (bỏ câu "di sản đặt tên" dòng 26, đổi lệnh/đường dẫn), phiếu `engines/GT-0NN.md` có trích `legacy_v1_ref`, `runtime-gates.md`, `index.md`, `business-rules.md` (đường dẫn file) — chỉ định danh, không đổi BR. Bỏ `#312` khỏi `open_tasks` + khối "Chưa hoàn thành" ở mọi file trong `rtk proxy rg -l '#312' docs/specs`; giữ `status: implemented`; `reviewed`.
  - Tài liệu lịch sử `docs/tasks/1xx-*` giữ nguyên.
  - Commit vào `main` (một commit migration + codemod, một commit spec — hoặc gộp nếu reviewer muốn diff một chỗ).

## 4. Rủi ro

- Môi trường đã deploy: migration rename chạy trước khi code mới lên — deploy cùng lúc, kiểm `release-deploy.md` thứ tự migrate → restart. Không có pha chuyển tiếp hai tên vì không có client ngoài đọc cột này (S1 xác nhận).
- Cache build/seed artefact chứa tên cũ (`.output`, file sinh `@generated`) → sinh lại sau codemod (`gen-levels`).
