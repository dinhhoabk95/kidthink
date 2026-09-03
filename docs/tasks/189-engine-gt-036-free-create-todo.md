# Todo — Task #189: `GT-036` Tự tạo quy luật

> Kế hoạch: [`189-engine-gt-036-free-create-plan.md`](189-engine-gt-036-free-create-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 4, task cuối.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [x] [`#188`](188-engine-gt-035-command-sequence-plan.md) đã đóng.
- [x] Đọc `tinimath/.../d3/FreeCreateSession.ts` và `systems/freeCreateSystem.ts` — chú ý ghi chú về màu phản hồi lọt vào bảng màu. Cấm — NEVER copy mã.
- [x] Xác nhận thang chấm ở mục 1 của plan trước khi viết dòng nào.

## WP189.1 — `RuleDetectionSystem`

- [x] `systems/rule-detection-system.ts` — tìm mô-típ ngắn nhất lặp ≥ `min_repetitions`.
- [x] Trả `{ motif, repetitions, distinct_elements }`.
- [x] Chấm theo thang: 0 · 60 khi đạt · +10 mỗi lần lặp thêm tới 80 · tới 100 theo số phần tử khác nhau.
- [x] Hai chế độ `relaxed` và `strict` cho đuôi dở dang.
- [x] Cấm — NEVER so với mẫu dựng sẵn. Cấm — NEVER phụ thuộc thứ tự trẻ đặt ô.
- [x] `tests/rule-detection-system.test.ts` ≥10 ca, dựng độc lập.
- [x] **Ca bắt buộc:** hàm thuần — cùng chuỗi chạy 100 lần cho cùng điểm.
- [x] **Ca bắt buộc:** hai chuỗi khác nhau cùng thoả quy luật → cả hai đạt.
- [x] **Ca bắt buộc:** chuỗi ngẫu nhiên không mô-típ → 0 điểm.
- [x] **Ca bắt buộc:** cùng chuỗi đuôi dở — `relaxed` đạt, `strict` không.

## WP189.2 — Khuôn

- [x] `new:template GT-036 'Tự tạo quy luật' free-create`
- [x] Contract theo mục 3 của plan: `palette` · `track_length` · `min_repetitions`.
- [x] `refine`: `palette` đủ để dựng mô-típ lặp `min_repetitions` lần trong `track_length`.
- [x] `scoring: STANDARD_SCORING` — cấm — NEVER thêm `ScoringSchema` mới.
- [x] Band `5-6`; `layouts` `free-scene` · `horizontal-track`.
- [x] Event `element_placed` `element_removed` `creation_submitted` `rule_detected` đăng ký vào catalog **và** `ALLOWED_EVENT_NAMES`.

## WP189.3 — Phiên chơi và bộ sinh

- [x] `session.ts` trên nguyên thuỷ `placement`.
- [x] **Kiểm màu:** không phần tử `palette` nào dùng token màu phản hồi. Test quét cả 10 level.
- [x] `fixtures.ts` — 3 level: `palette` 2 phần tử, 3 phần tử, chế độ `strict`.
- [x] `tests/gt-036-free-create.test.ts` ≥12 ca, có ca trẻ đặt → bỏ → đặt lại.
- [x] `generators/gt036.ts` ≥8 chủ đề, band `5-6`.

## WP189.4 — Phiếu, sinh mã, 10 level

- [x] `docs/specs/01-platform/engines/GT-036.md` — 10 mục; mục 11 ghi thang chấm và vì sao nó đóng được câu hỏi "không có đáp án đúng".
- [x] `gen:templates` không sinh diff · `gen:engine-index` có `GT-036` · `check:engine-specs` xanh.
- [x] `gen:levels --engine=GT-036 --seed=189` — 10 level, ≥3 chủ đề.
- [x] Gắn `legacy_v1_ref: "D3-05"` cho cả 10.

## Đóng task và mở chốt kiểm 4

- [x] `check:legacy-v1` lên **60/60**, ≥**600** level.
- [x] `check:theme-registry` · `check:engine-depth` xanh.
- [x] `pnpm check` xanh · `status` vẫn `draft`.
- [x] Cập nhật dòng `#189` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
- [x] **Chốt kiểm 4:** 9 khuôn `draft` → `published`, bật `engine-depth` **bậc 2**,
      hạ `stepwise_caps.school` theo tỉ lệ mới, kiểm `RESERVED_MECHANICS` đã rỗng.
