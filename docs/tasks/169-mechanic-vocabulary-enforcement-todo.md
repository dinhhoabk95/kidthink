# Todo — Task #169: Từ vựng `mechanic` khớp registry và ép bằng kiểu

> Kế hoạch: [`169-mechanic-vocabulary-enforcement-plan.md`](169-mechanic-vocabulary-enforcement-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 1.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [x] Đo lệch: 5 mồ côi (`drag-to-order` `tap-count` `balance` `sequence-arrange` `free-create`), 3 thiếu (`spot-difference` `go-nogo` `rule-switch`).
- [x] Xác nhận `GameMechanic` chỉ được dùng ở chính file khai và một dòng re-export `packages/taxonomy/src/types.ts:27`.
- [x] Ghi lại số trước: `grep -c 'mechanic: "' packages/game-engine/src/templates/GT-*/template.ts`.

## WP169.1 — Sửa union

- [x] Bỏ `drag-to-order` · `balance` · `sequence-arrange` khỏi `GameMechanic`.
- [x] Thêm 3 giá trị đang chạy: `spot-difference` · `go-nogo` · `rule-switch`.
- [x] Thêm 7 giá trị chương trình: `remove-from-set` · `measure-with-unit` · `coin-compose` ·
      `pour-quantity` · `weave-grid` · `beat-sequence` · `command-sequence`.
- [x] Union đúng **36** giá trị.
- [x] Thêm `RESERVED_MECHANICS` — 9 giá trị chưa có template, mỗi giá trị kèm mã task sẽ dùng.

## WP169.2 — Ép bằng kiểu

- [x] `GameTemplate.mechanic` ở `packages/game-engine/src/contracts/types.ts` đổi `string` → `GameMechanic`.
- [x] Sửa mọi `template.ts` đỏ sau khi đổi kiểu.
- [x] `pnpm lint:deps` xanh — cấm — NEVER tạo vòng `shared` ↔ `game-engine`.
- [x] Cấm — NEVER nhân đôi union sang `game-engine` để né vòng phụ thuộc.

## WP169.3 — Cổng đối chiếu

- [x] Test: mọi `mechanic` trong `ALL_TEMPLATES` nằm trong union.
- [x] Test: mọi giá trị union có template dùng, hoặc nằm trong `RESERVED_MECHANICS`.
- [x] Test: `RESERVED_MECHANICS` không chứa giá trị đã có template.
- [x] **Ca âm 1:** đặt `mechanic: "khong-co-that"` vào một `template.ts` → `pnpm typecheck:gate` đỏ. Ghi đầu ra vào PR, rồi hoàn tác.
- [x] **Ca âm 2:** thêm `"xyz"` vào union, không đặt trước → test đỏ. Ghi đầu ra, rồi hoàn tác.

## WP169.4 — Đồng bộ tài liệu

- [x] Mục 7.1 của [`content-tagging.md`](../specs/01-platform/content-tagging.md) liệt kê đúng 36 giá trị, đánh dấu 9 giá trị đặt trước.
- [x] Ghi vào `docs/specs/00-foundation/business-rules.md` nếu phát sinh `BR` mới.

## Đóng task

- [x] `pnpm --filter @mindkid/game-engine test` xanh.
- [x] `pnpm typecheck:gate` xanh.
- [x] `pnpm check` xanh.
- [x] Cập nhật dòng `#169` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
