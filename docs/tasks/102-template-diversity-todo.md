# Todo — Task #102: Đa dạng khuôn trò chơi cho một bài học

> Kế hoạch: [`102-template-diversity-plan.md`](102-template-diversity-plan.md).
> Node mặc định của máy là v20 và sẽ chết với `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.
> Chạy dòng này trước mọi lệnh:
>
> ```bash
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] Đọc [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) mục 4 và mục 7.3.
- [x] Đọc [`legacy-v1-template-batch.md`](../specs/01-platform/legacy-v1-template-batch.md) mục 7.2 và mục 11.
- [x] Đo số khuôn có nội dung và số activity `digital_game` trong corpus seed.
- [x] Sao lưu `packages/db/src/seed-content/` ra ngoài repo trước khi chạy codemod.

## WP102.1 — Khôi phục phép đo

- [x] Thêm `packages/db/tests/gates/thinking-coverage-source.ts` đọc corpus seed cộng registry template.
- [x] Bỏ nhánh `catch` trả danh sách rỗng trong `loadItemsFromDatabase()`; nguồn hỏng thì ném lỗi.
- [x] Bỏ giá trị mặc định `"C1"` và `"tap_select"`; hàng không quy được thì nêu mã và dừng.
- [x] Thu `CANONICAL_THINKING_TAGS` về đúng 12 giá trị của spec.
- [x] Thu `CANONICAL_MECHANIC_TAGS` về đúng danh sách `mechanic` của registry.
- [x] Đặt `enforceFloors: true` cho khớp `phase: P3`.
- [x] Codemod gắn lại `thinking_tags`, `what_tags`, `theme_tag` của 170 level theo strand.
- [x] Ca âm: sáu alias seed-master phải làm cổng đỏ.
- [x] Ca âm: competency không quy được phải nêu ra, không gán `C1`.
- [x] Ca âm: template ngoài registry phải nêu ra, không gán `tap-select`.
- [x] Test khẳng định trục `mechanic` khớp từng cái một với registry.
- [x] Sửa mục 4, mục 7, `BR-TCM-03` và mục 11 của [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md).
- [x] `npx tsx packages/db/tests/gates/thinking-coverage.test.ts` xanh với con số thật.

## WP102.2 — Nội dung cho mười sáu khuôn

- [x] Viết spec [`template-coverage-level-batch.md`](../specs/05-content/template-coverage-level-batch.md).
- [x] Ba level mẫu lấp ba ô thủng sàn: `GL-C4-VIS-SCENE-0021` trên `GT-022`, `GL-C5-LIS-AUDIO-0021` trên `GT-018`, `GL-C6-PLN-MAZE-0021` trên `GT-013`.
- [x] Đợt 1: `GT-022` · `GT-018` · `GT-020` · `GT-012` · `GT-013` — 15 level cho C4, C5, C6.
- [x] Đợt 2: `GT-019` · `GT-021` · `GT-023` · `GT-024` · `GT-017` — 15 level cho C2.
- [x] Đợt 3: `GT-009` · `GT-011` · `GT-015` · `GT-010` — 12 level cho C3 và C1 suy luận.
- [x] Đợt 4: `GT-014` · `GT-016` — 6 level cho C1 đo lường.
- [x] Cổng `BR-TCL-04`: mỗi ô có ít nhất một level ngoài rổ `GT-001` tới `GT-008`.
- [x] Ca âm cho `BR-TCL-02`: khuôn chỉ có fixture vẫn bị tính là thiếu level.

## WP102.3 — Luật một bài học nhiều khuôn

- [x] Viết spec [`lesson-template-variety.md`](../specs/05-content/lesson-template-variety.md).
- [x] Thêm activity `kind: digital_game` cho các lesson đang có (hôm nay 0 trên 81).
- [x] Viết `packages/db/tests/gates/lesson-variety.test.ts` dựng bảng `bài học × số khuôn khác nhau`.
- [x] Ca âm: bài học hai bước chơi cùng `template_code` làm cổng đỏ.
- [x] Ca âm: bài học không có bước chơi số nào làm cổng đỏ.
- [x] Nối cổng vào `pnpm check`.

## WP102.4 — Ba khuôn khoảng trống taxonomy

- [x] Viết spec [`taxonomy-gap-batch.md`](../specs/01-platform/taxonomy-gap-batch.md).
- [x] Chốt đường phán quyết cho không-hành-động (mục 7.3 của spec, câu hỏi còn mở số 1).
- [x] `GT-025` `spot-difference`: `template.ts`, `session.ts`, ba fixture.
- [x] `inhibitionSystem` kèm bộ test độc lập với khuôn.
- [x] `GT-026` `go-nogo`: `template.ts`, `session.ts`, ba fixture, `banned_age_bands: ["3-4"]`.
- [x] `ruleSystem` kèm bộ test độc lập với khuôn.
- [x] `GT-027` `rule-switch`: `template.ts`, `session.ts`, ba fixture, báo đổi luật bằng âm và hình.
- [x] Đăng ký ba `mechanic` mới vào mục 7.1 của [`content-tagging.md`](../specs/01-platform/content-tagging.md).
- [x] `pnpm --filter @mindkid/game-engine gen:templates`, kiểm không file viết tay nào ngoài ba thư mục khuôn đổi.
- [x] Cổng phủ báo `inhibit` và `shift` khác 0.

## WP102.5 — Bookkeeping

- [x] Đăng ký ba prefix `BR-TGB`, `BR-TCL`, `BR-LTV` vào mục 7.1 của [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Cập nhật số spec 158 sang 161 ở [`index.md`](../specs/index.md) và mục 14 của [`SPEC.md`](../SPEC.md).
- [x] Thay tham chiếu trần tên lô khoảng trống taxonomy trong lô kế thừa v1 bằng liên kết thật.
- [x] Ba spec chuyển `status: draft` sang `approved` sau khi người quyết duyệt.

## WP102.6 — Verification

- [x] `npx tsx packages/gates/tests/lint-specs.test.ts` xanh, 161 spec, 18 kiểm.
- [x] `npx tsx packages/gates/src/lint-rule-ids.ts` xanh.
- [x] `npx tsx packages/game-engine/tests/gates/templates.test.ts` xanh.
- [x] `npx tsx packages/db/src/seed-content/cli/seed-check.ts` xanh.
- [x] `npx vitest run --root scripts tests/lint-thinking-coverage.test.ts` xanh, 17 ca.
- [x] `npx biome check scripts packages/db/src/seed-content` sạch.
- [x] `npx tsx packages/gates/src/lint-type-safety.ts` xanh, không thêm ép kiểu.
- [x] `pnpm check` toàn bộ xanh (29 cổng, exit 0).

## Câu hỏi mở chuyển tiếp

| # | Câu hỏi | Chuyển cho |
|---|---|---|
| 1 | 169 trên 172 level không parse được bằng `content_contract`. Sửa nội dung hay sửa contract? | mục 11 câu 5 của [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) |
| 2 | Trục `what` và trục `theme` vẫn nới. Gắn lại nội dung hay đóng từ vựng quanh giá trị đang dùng? | mục 11 câu 4 của cùng file |
| 3 | Cơ sở dữ liệu dev dùng chung với test tích hợp nên chứa 281 `game_templates`. Tách hai cơ sở dữ liệu? | chưa có spec sở hữu |
| 4 | Đường phán quyết cho không-hành-động chọn hình dạng nào? | mục 11 câu 1 của [`taxonomy-gap-batch.md`](../specs/01-platform/taxonomy-gap-batch.md) |
