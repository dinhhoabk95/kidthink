# Todo — Task #189: `GT-036` Tự tạo quy luật

> Kế hoạch: [`189-engine-gt-036-free-create-plan.md`](189-engine-gt-036-free-create-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 4, task cuối.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [ ] [`#188`](188-engine-gt-035-command-sequence-plan.md) đã đóng.
- [ ] Đọc `tinimath/.../d3/FreeCreateSession.ts` và `systems/freeCreateSystem.ts` — chú ý ghi chú về màu phản hồi lọt vào bảng màu. Cấm — NEVER copy mã.
- [ ] Xác nhận thang chấm ở mục 1 của plan trước khi viết dòng nào.

## WP189.1 — `RuleDetectionSystem`

- [ ] `systems/rule-detection-system.ts` — tìm mô-típ ngắn nhất lặp ≥ `min_repetitions`.
- [ ] Trả `{ motif, repetitions, distinct_elements }`.
- [ ] Chấm theo thang: 0 · 60 khi đạt · +10 mỗi lần lặp thêm tới 80 · tới 100 theo số phần tử khác nhau.
- [ ] Hai chế độ `relaxed` và `strict` cho đuôi dở dang.
- [ ] Cấm — NEVER so với mẫu dựng sẵn. Cấm — NEVER phụ thuộc thứ tự trẻ đặt ô.
- [ ] `tests/rule-detection-system.test.ts` ≥10 ca, dựng độc lập.
- [ ] **Ca bắt buộc:** hàm thuần — cùng chuỗi chạy 100 lần cho cùng điểm.
- [ ] **Ca bắt buộc:** hai chuỗi khác nhau cùng thoả quy luật → cả hai đạt.
- [ ] **Ca bắt buộc:** chuỗi ngẫu nhiên không mô-típ → 0 điểm.
- [ ] **Ca bắt buộc:** cùng chuỗi đuôi dở — `relaxed` đạt, `strict` không.

## WP189.2 — Khuôn

- [ ] `new:template GT-036 'Tự tạo quy luật' free-create`
- [ ] Contract theo mục 3 của plan: `palette` · `track_length` · `min_repetitions`.
- [ ] `refine`: `palette` đủ để dựng mô-típ lặp `min_repetitions` lần trong `track_length`.
- [ ] `scoring: STANDARD_SCORING` — cấm — NEVER thêm `ScoringSchema` mới.
- [ ] Band `5-6`; `layouts` `free-scene` · `horizontal-track`.
- [ ] Event `element_placed` `element_removed` `creation_submitted` `rule_detected` đăng ký vào catalog **và** `ALLOWED_EVENT_NAMES`.

## WP189.3 — Phiên chơi và bộ sinh

- [ ] `session.ts` trên nguyên thuỷ `placement`.
- [ ] **Kiểm màu:** không phần tử `palette` nào dùng token màu phản hồi. Test quét cả 10 level.
- [ ] `fixtures.ts` — 3 level: `palette` 2 phần tử, 3 phần tử, chế độ `strict`.
- [ ] `tests/gt-036-free-create.test.ts` ≥12 ca, có ca trẻ đặt → bỏ → đặt lại.
- [ ] `generators/gt036.ts` ≥8 chủ đề, band `5-6`.

## WP189.4 — Phiếu, sinh mã, 10 level

- [ ] `docs/specs/01-platform/engines/GT-036.md` — 10 mục; mục 11 ghi thang chấm và vì sao nó đóng được câu hỏi "không có đáp án đúng".
- [ ] `gen:templates` không sinh diff · `gen:engine-index` có `GT-036` · `check:engine-specs` xanh.
- [ ] `gen:levels --engine=GT-036 --seed=189` — 10 level, ≥3 chủ đề.
- [ ] Gắn `legacy_v1_ref: "D3-05"` cho cả 10.

## Đóng task và mở chốt kiểm 4

- [ ] `check:legacy-v1` lên **60/60**, ≥**600** level.
- [ ] `check:theme-registry` · `check:engine-depth` xanh.
- [ ] `pnpm check` xanh · `status` vẫn `draft`.
- [ ] Cập nhật dòng `#189` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
- [ ] **Chốt kiểm 4:** mở PR riêng — 9 khuôn `draft` → `published`, bật `engine-depth` **bậc 2**,
      hạ `stepwise_caps.school` theo tỉ lệ mới, kiểm `RESERVED_MECHANICS` đã rỗng.
