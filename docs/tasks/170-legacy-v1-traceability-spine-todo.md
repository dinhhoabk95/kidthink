# Todo — Task #170: Xương truy vết v1

> Kế hoạch: [`170-legacy-v1-traceability-spine-plan.md`](170-legacy-v1-traceability-spine-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 1.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [x] Xác nhận v2 không có đường truy vết nào: grep `LEGACY_GAME_TYPE_MAP` `legacy_id` `D1-01` `C1-01` → 0 kết quả.
- [x] Xác nhận tiền lệ `montessori_ref` trong `packages/db/src/seed-content/types.ts`.
- [x] [`Task #169`](169-mechanic-vocabulary-enforcement-plan.md) đã đóng.
- [x] Docker daemon chạy — cổng đọc Postgres `127.0.0.1:5433`.

## WP170.1 — Registry 60 game type v1

- [x] `packages/shared/src/constants/legacy-v1-game-types.ts` — 60 hàng từ [`game-type-migration.md`](../taxonomy/game-type-migration.md).
- [x] Mỗi hàng: `legacy_id` · `competency_id` · `name_vi` · `template_code` · `primary_skills`.
- [x] 9 hàng trỏ tới `GT-028`..`GT-036` (chưa tồn tại) — hợp lệ, cấm — NEVER để trống.
- [x] Property test: song ánh 60 ↔ 60, không trùng, không thiếu.
- [x] Property test: `legacy_id` khớp `^D[1-6]-\d{2}$`, `competency_id` khớp `^C[1-6]-\d{2}$`.
- [x] Property test: mọi `template_code` khớp `^GT-\d{3}$`; mã đã tồn tại thì phải có trong registry engine.
- [x] **Ca âm:** xoá một hàng → test đỏ với thông báo nêu tên mã thiếu.

## WP170.2 — Trường `legacy_v1_ref`

- [x] Thêm `legacy_v1_ref?: string` vào `ContentSeedHeader` kèm ghi chú lý do như `montessori_ref`.
- [x] Cột `legacy_v1_ref text` trên `game_levels` + migration mới (`0001_add_legacy_v1_ref.sql`).
      Cấm — NEVER chạy `drizzle-kit generate` regenerate `0000` — nó xoá 3 dòng `CREATE EXTENSION` viết tay.
- [x] Cấm — NEVER nhét mã vào `content_pack`.
- [x] Cổng seed ép giá trị thuộc 60 mã của registry (Gate 2).
- [x] **Ca âm:** level mang `legacy_v1_ref: "D9-99"` → `seed:check` thoát khác 0.

## WP170.3 — Cổng phủ v1

- [x] `packages/db/src/seed-content/gates/legacy-v1-coverage.ts`.
- [x] CLI `check:legacy-v1` trong `packages/db/package.json`.
- [x] `packages/db/config/legacy-v1-coverage.json` — bốn bậc, `active_step: 0`, có `history`.
- [x] Cổng chỉ đếm level `published`, mang nhãn, **và** qua `content_contract`.
- [x] Cổng in bảng 60 hàng: mã · tên · khuôn · số level · thiếu bao nhiêu.
- [x] Nguồn không đọc được thì thoát khác 0. Cấm — NEVER nhánh trả danh sách rỗng rồi báo xanh.
- [x] **Ca âm 1:** gỡ nhãn của một level đã tính → cổng đỏ.
- [x] **Ca âm 2:** level có nhãn nhưng hỏng `content_contract` → không được tính, cổng đỏ nếu vì thế mà tụt.
- [x] Nối `check:legacy-v1` vào `seed:check`.

## WP170.4 — Audit 250 level hiện có

- [x] Duyệt `ALL_SEED_LEVELS`, gắn `legacy_v1_ref` **chỉ khi dạng bài khớp**, không phải khi khuôn khớp.
- [x] Không xác định được thì để trống. Cấm — NEVER gắn cho đủ số.
- [x] Viết `docs/tasks/170-legacy-audit-report.md` — bảng 60 hàng, hàng 0 level ghi lý do.
- [x] Đặt `min_types_covered` của bậc 0 bằng đúng số audit đo được (20/60). Cấm — NEVER đặt 0.
- [x] Reviewer đối chiếu mẫu ngẫu nhiên 10 level đã gắn.

## WP170.5 — Spec

- [x] Viết `docs/specs/08-quality/legacy-v1-coverage.md`, 11 mục, `status: draft`.
- [x] `owns`: định nghĩa "một game type v1 đã tích hợp" · bậc thang phủ v1 · nguồn sự thật cho `legacy_v1_ref`.
- [x] Đăng ký `BR-LVC-*` vào [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Thêm dòng vào [`docs/specs/index.md`](../specs/index.md).

## Đóng task

- [x] `pnpm --filter @mindkid/shared test` · `pnpm --filter @mindkid/db test` xanh.
- [x] `check:legacy-v1` chạy được và in số thật (20/20 game types Bậc 0).
- [x] `pnpm check` xanh.
- [x] **Báo số audit lên chốt kiểm 1** (20/60 game types đã phủ) — quyết định kích thước sáu task đợt 2.
- [x] Cập nhật dòng `#170` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
