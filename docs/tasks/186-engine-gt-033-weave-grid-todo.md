# Todo — Task #186: `GT-033` Dệt hoa văn lưới

> Kế hoạch: [`186-engine-gt-033-weave-grid-plan.md`](186-engine-gt-033-weave-grid-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 3.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.
> Một PR, một engine.

## Preflight

- [x] Chốt kiểm 2 xanh — cổng phủ v1 ở 51/60.
- [x] Đọc `tinimath/packages/game-engine/src/handlers/d3/WeavingPatternSession.ts` lấy **dạng bài**. Cấm — NEVER copy mã.
- [x] `weave-grid` đã có trong `GameMechanic` — [`#169`](169-mechanic-vocabulary-enforcement-plan.md).

## WP186.1 — Khuôn

- [x] `pnpm --filter @mindkid/game-engine new:template GT-033 'Dệt hoa văn lưới' weave-grid`
- [x] `template.ts`: contract zod theo mục 2 của plan, `status: draft`, `scoring: STANDARD_SCORING`.
- [x] Tài sản tham chiếu bằng `EMJ-<slug>`, cấm — NEVER glyph thô.
- [x] Band `5-6` — `banned_age_bands: ["3-4", "4-5"]` · `layouts` `weave-grid` **mới**.
- [x] Event mới đăng ký vào [`event-catalog.md`](../specs/00-foundation/event-catalog.md) §7.2 **và** `ALLOWED_EVENT_NAMES`.

## WP186.2 — Phiên chơi

- [x] `session.ts` dựng trên `placement`.
- [x] Hệ thống mới: Không — dùng lại `constraint-system`
- [x] `fixtures.ts` — 3 level mẫu, khác band hoặc khác dạng bài.
- [x] `tests/gt-033-weave-grid.test.ts` ≥12 ca, có ≥1 ca trẻ hành động **trước** phản hồi hệ thống.

## WP186.3 — Bộ sinh

- [x] `generators/gt033.ts` khai ≥8 chủ đề và mọi band hợp lệ; đăng ký vào `generators/index.ts`.
- [x] Test: mọi cặp `(band, theme)` sinh được và qua `content_contract`.
- [x] Test: hai chủ đề khác nhau cùng seed cho nội dung khác nhau.

## WP186.4 — Phiếu engine và sinh mã

- [x] `docs/specs/01-platform/engines/GT-033.md` — 10 mục theo [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md).
- [x] `gen:templates` → không sinh diff · `gen:engine-index` → danh mục có `GT-033`.
- [x] `check:engine-specs` xanh, 0 mồ côi.

## WP186.5 — 10 level legacy

- [x] `gen:levels --engine=GT-033 --seed=186` — 10 level, trải ≥3 chủ đề và mọi band hợp lệ.
- [x] Gắn `legacy_v1_ref: "D3-07"` cho cả 10.
- [x] `check:legacy-v1` tăng đúng 1 game type.
- [x] `check:theme-registry` xanh · `check:engine-depth` xanh.

## Đóng task

- [x] `layout-safe-area-debt.json` không thêm dòng nào.
- [x] `pnpm check` xanh.
- [x] `status` vẫn `draft` — cấm — NEVER đặt `published` trong PR này.
- [x] Cập nhật dòng `#186` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
