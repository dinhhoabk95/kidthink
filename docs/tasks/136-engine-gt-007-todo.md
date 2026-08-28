# Checklist — Task #136: Engine `GT-007` Tách gộp số

> Kế hoạch: [`136-engine-gt-007-plan.md`](136-engine-gt-007-plan.md).
> Vị trí **7 / 27** trong chương trình [`Task #116`](116-engine-vertical-slices-todo.md).
> Chỉ bắt đầu khi [`Task #130`](130-engine-gt-001-todo.md) đã merge — pilot chứng minh khuôn spec và khuôn `render()`.
> Chỉ bắt đầu khi [`Task #115`](115-render-contract-core-todo.md) và
> [`Task #120`](120-engine-spec-contract-todo.md) đã merge.
>
> Tuyệt đối: không sửa `render-system.ts`, không sửa `engine-depth.json`, không chạm file của
> engine khác, không `UPDATE` bản published, không so pixel, không đóng spec khi còn thiếu một
> trong bảy điều kiện.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight — đo sáu số đo của `GT-007`

- [ ] `level_count` — kỳ vọng **6**.
- [ ] `min_band_count` trên 3 band hợp lệ (`3-4`, `4-5`, `5-6`): ................
- [ ] `thinking_span`: ................
- [ ] `what_span`: ................
- [ ] `theme_span`: ................
- [ ] `difficulty_span`: ................
- [ ] `out_of_band_count`: ................
- [ ] Số level `GT-007` không parse được `content_contract`: ................
- [ ] Số level `GT-007` có `access_tier` là `free` hoặc `login`: ................
- [ ] Đọc `packages/game-engine/src/templates/GT-007/template.ts` và `session.ts` (94 dòng).
- [ ] Đọc khuôn `render()` và bảy phép kiểm ở mục 7 của [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md).
- [ ] Đọc khuôn spec 16 mục ở mục 4 của [`116-engine-vertical-slices-plan.md`](116-engine-vertical-slices-plan.md).
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP136.1 — Nâng phiếu thành spec đủ khuôn SDD

**Cỡ:** S · chỉ `docs/specs/01-platform/engines/GT-007.md`

- [ ] Frontmatter đủ 9 trường; `spec: ENGINE-GT007`, `engine: number-bond`, `batch: montessori`.
- [ ] `owns` ba dòng — cấm chồng với spec lô hoặc `game-template-contract` (`BR-ESS-14`).
- [ ] `depends_on` bốn spec.
- [ ] Ánh xạ 11 mục cũ sang mục 1, 3, 7, 12, 13, 14 — giữ nguyên nội dung.
- [ ] Viết mới mục 2 Actors.
- [ ] Viết mới mục 4 Main flow — một lượt chơi đúng từ `content_pack` tới thắng.
- [ ] Viết mới mục 5 Alternative flows — sai, hết giờ, gợi ý, asset hỏng, thiết bị yếu.
- [ ] Viết mới mục 6 — `BR-E007-01` trở đi, ≥1 rule sinh từ ca sai; mỗi rule kèm lý do (`BR-ESS-12`).
- [ ] Viết mới mục 8 — ghi rõ "không có API, engine chạy trong tiến trình".
- [ ] Viết mới mục 9 — Gherkin, mỗi `BR-E007-*` ≥1 scenario (`BR-ESS-13`).
- [ ] Mục 15 — trường trích kèm nguồn dòng: `layouts`, `limits`, `banned_age_bands`, `asset_kinds` (`BR-ESS-02`).
- [ ] Viết mới mục 16 — sáu số đo từ Preflight.
- [ ] Không khai `content_contract` hay Zod schema (`BR-ESS-03`); không khai `skill_id` (`BR-ESS-04`).
- [ ] `status: draft` → `approved`.
- [ ] Thêm `GT-007` vào `engine-spec-ready.json` — **một dòng**.
- [ ] `check:engine-specs` xanh với `GT-007` trong bậc thang.

## WP136.2 — Cài `render()`

**Cỡ:** M · chỉ `packages/game-engine/src/templates/GT-007/`

- [ ] Slot lấy từ `resolveLayout()` — không hằng số toạ độ.
- [ ] Bốn lớp đúng thứ tự: nền cảnh · tĩnh · tương tác · phản hồi.
- [ ] Phép kiểm 1 — thứ tự bốn lớp (`BR-ERC-06`).
- [ ] Phép kiểm 2 — vùng chạm ≥ sàn chạm, đo ở 3 band hợp lệ (`3-4`, `4-5`, `5-6`) (`BR-ERC-04`).
- [ ] Phép kiểm 3 — năm trạng thái thị giác, mỗi trạng thái ≥2 kênh.
- [ ] Phép kiểm 4 — thuần: 100 lần cùng `timeMs`, trạng thái không đổi, 0 telemetry (`BR-ERC-02`).
- [ ] Phép kiểm 5 — toạ độ từ `Slot[]`, cổng tĩnh xanh (`BR-ERC-03`).
- [ ] Phép kiểm 6 — emoji hỏng không ném, vẽ ô giữ chỗ (`BR-ERC-07`).
- [ ] Phép kiểm 7 — tuột bỏ hạt, giữ lớp 3 (`BR-ERC-09`).
- [ ] Test vẽ chạy trên canvas ngoài màn hình; **không** so pixel (`BR-ERC-11`).
- [ ] Thêm `GT-007` vào `render-implemented.json` — **một dòng, không sửa dòng khác**.
- [ ] Ca âm: xoá `render()` của `GT-007` → `check:render` đỏ. Hoàn tác sau khi ghi bằng chứng.

## WP136.3 — Nợ `content_pack` của engine

**Cỡ:** S · chỉ corpus của `GT-007`

- [ ] Đo: bao nhiêu trong 6 level trượt, thiếu trường nào.
- [ ] Sửa bằng **version mới**; 0 câu `UPDATE` chạm bản published (`BR-CSA-01`).
- [ ] Số trượt của `GT-007` về **0**.
- [ ] Nếu đo ra 0 trượt: ghi con số và bỏ WP này kèm lý do.

## WP136.4 — Level ngoài band

**Cỡ:** S

- [ ] Engine không khai `banned_age_bands`. Đo để khẳng định `out_of_band_count` = **0**.
- [ ] Ghi con số và bỏ WP này.

## WP136.5 — Nội dung tới sàn bậc 1

**Cỡ:** S · một PR

- [ ] `level_count` ≥6.
- [ ] `min_band_count` ≥1 trên mọi band hợp lệ.
- [ ] `thinking_span` ≥2.
- [ ] `what_span` ≥2, giá trị thuộc từ vựng đóng.
- [ ] `theme_span` ≥2, giá trị thuộc 14 chủ đề của [`Task #119`](119-theme-registry-todo.md).
- [ ] `difficulty_span` ≥2.
- [ ] **≥1 level `access_tier` là `free` hoặc `login`** (`BR-ECD-07`).
- [ ] Level mới đi qua đủ tám cổng của [`Task #117`](117-seed-gate-truth-todo.md).
- [ ] Khung sinh bằng `gen:levels` nếu engine thuộc lô đầu của [`Task #121`](121-level-generator-kit-todo.md).
- [ ] Tag ba trục và câu lệnh tiếng Việt **viết tay** (`BR-LGK-08`, `BR-LGK-10`).
- [ ] Ghi số level đã soạn sang ngân sách 55 của [`Task #122`](122-engine-content-depth-todo.md) — không đếm hai lần.

## WP136.6 — Mở màn thật và đóng spec

**Cỡ:** S

- [ ] Mở một màn `GT-007` thật trong `apps/web`, **nhìn thấy hình**; đính ảnh chụp vào PR.
- [ ] Kiểm tay: chạm đúng thắng · chạm sai có phản hồi · gợi ý hiện sau `hint_after_ms`.
- [ ] Spec `GT-007` đổi `status: approved` → `implemented`, ghi ngày.

## Nghiệm thu — bảy điều kiện

- [ ] 1. Spec `GT-007` đủ khuôn 16 mục; `check:engine-specs` xanh.
- [ ] 2. `check:render` in `GT-007` đã cài; bảy phép kiểm vẽ xanh; ca âm đỏ.
- [ ] 3. Mọi `content_pack` của `GT-007` parse được contract.
- [ ] 4. `out_of_band_count` của `GT-007` = 0.
- [ ] 5. `check:engine-depth` bậc 1 xanh cho `GT-007`.
- [ ] 6. `GT-007` có ≥1 level `free` hoặc `login`.
- [ ] 7. Ảnh chụp màn `GT-007` thật trong PR.
- [ ] 0 câu `UPDATE` chạm bản published.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Danh sách `trạng-thái | tên-test` trùng khít trước/sau, trừ test mới.
- [ ] Cập nhật hàng `GT-007` ở bảng tiến độ của [`Task #116`](116-engine-vertical-slices-todo.md).
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Sáu số đo trước và sau: ................
- `BR-E007-*` đã viết: ................
- Số level trượt parse, trước và sau: ................
- Số level đã soạn thêm: ................
- Chi phí thật của WP136.2 (giờ): ................
