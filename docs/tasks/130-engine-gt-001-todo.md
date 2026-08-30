# Checklist — Task #130: Engine `GT-001` Chọn một đáp án

> Kế hoạch: [`130-engine-gt-001-plan.md`](130-engine-gt-001-plan.md).
> Vị trí **1 / 27** trong chương trình [`Task #116`](116-engine-vertical-slices-todo.md).
> Chỉ bắt đầu khi [`Task #115`](115-render-contract-core-todo.md) và
> [`Task #120`](120-engine-spec-contract-todo.md) đã merge.
>
> Tuyệt đối: không sửa `render-system.ts`, không sửa `engine-depth.json`, không chạm file của
> engine khác, không `UPDATE` bản published, không so pixel, không đóng spec khi còn thiếu một
> trong bảy điều kiện.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight — đo sáu số đo của `GT-001`

- [x] `level_count` — kỳ vọng **38**. Đo: **37**.
- [x] `min_band_count` trên 3 band hợp lệ: **3-4:28 4-5:7 5-6:2 min=2**.
- [x] `thinking_span`: **8**.
- [x] `what_span`: **10**.
- [x] `theme_span`: **7**.
- [x] `difficulty_span`: **4**.
- [x] `out_of_band_count`: **0**.
- [x] Số level `GT-001` không parse được `content_contract`: **37**.
- [x] Số level `GT-001` có `access_tier` là `free` hoặc `login`: **30**.
- [x] Đọc `packages/game-engine/src/templates/GT-001/template.ts` và `session.ts` (68 dòng).
- [x] Đọc khuôn `render()` và bảy phép kiểm ở mục 7 của [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md).
- [x] Đọc khuôn spec 16 mục ở mục 4 của [`116-engine-vertical-slices-plan.md`](116-engine-vertical-slices-plan.md).
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP130.1 — Nâng phiếu thành spec đủ khuôn SDD

**Cỡ:** S · chỉ `docs/specs/01-platform/engines/GT-001.md`

- [x] Frontmatter đủ 9 trường; `spec: ENGINE-GT001`, `engine: tap-select`, `batch: mvp`.
- [x] `owns` ba dòng — cấm chồng với spec lô hoặc `game-template-contract` (`BR-ESS-14`).
- [x] `depends_on` bốn spec.
- [x] Ánh xạ 11 mục cũ sang mục 1, 3, 7, 12, 13, 14 — giữ nguyên nội dung.
- [x] Viết mới mục 2 Actors.
- [x] Viết mới mục 4 Main flow — một lượt chơi đúng từ `content_pack` tới thắng.
- [x] Viết mới mục 5 Alternative flows — sai, hết giờ, gợi ý, asset hỏng, thiết bị yếu.
- [x] Viết mới mục 6 — `BR-E001-01` trở đi, ≥1 rule sinh từ ca sai; mỗi rule kèm lý do (`BR-ESS-12`).
- [x] Viết mới mục 8 — ghi rõ "không có API, engine chạy trong tiến trình".
- [x] Viết mới mục 9 — Gherkin, mỗi `BR-E001-*` ≥1 scenario (`BR-ESS-13`).
- [x] Mục 15 — trường trích kèm nguồn dòng: `layouts`, `limits`, `banned_age_bands`, `asset_kinds` (`BR-ESS-02`).
- [x] Viết mới mục 16 — sáu số đo từ Preflight.
- [x] Không khai `content_contract` hay Zod schema (`BR-ESS-03`); không khai `skill_id` (`BR-ESS-04`).
- [x] `status: draft` → `approved`.
- [x] Thêm `GT-001` vào `engine-spec-ready.json` — **một dòng**.
- [x] `check:engine-specs` xanh với `GT-001` trong bậc thang.

## WP130.2 — Cài `render()`

**Cỡ:** M · chỉ `packages/game-engine/src/templates/GT-001/`

- [x] Slot lấy từ `resolveLayout()` — không hằng số toạ độ.
- [x] Bốn lớp đúng thứ tự: nền cảnh · tĩnh · tương tác · phản hồi.
- [x] Phép kiểm 1 — thứ tự bốn lớp (`BR-ERC-06`).
- [x] Phép kiểm 2 — vùng chạm ≥ sàn chạm, đo ở 3 band hợp lệ (`3-4`, `4-5`, `5-6`) (`BR-ERC-04`).
- [x] Phép kiểm 3 — năm trạng thái thị giác, mỗi trạng thái ≥2 kênh.
- [x] Phép kiểm 4 — thuần: 100 lần cùng `timeMs`, trạng thái không đổi, 0 telemetry (`BR-ERC-02`).
- [x] Phép kiểm 5 — toạ độ từ `Slot[]`, cổng tĩnh xanh (`BR-ERC-03`).
- [x] Phép kiểm 6 — emoji hỏng không ném, vẽ ô giữ chỗ (`BR-ERC-07`).
- [x] Phép kiểm 7 — tuột bỏ hạt, giữ lớp 3 (`BR-ERC-09`).
- [x] Test vẽ chạy trên canvas ngoài màn hình; **không** so pixel (`BR-ERC-11`).
- [x] Thêm `GT-001` vào `render-implemented.json` — **một dòng, không sửa dòng khác**.
- [x] Ca âm: xoá `render()` của `GT-001` → `check:render` đỏ. Hoàn tác sau khi ghi bằng chứng.

## WP130.3 — Nợ `content_pack` của engine

**Cỡ:** S · chỉ corpus của `GT-001`

- [x] Đo: bao nhiêu trong 38 level trượt, thiếu trường nào.
- [x] Sửa bằng **version mới**; 0 câu `UPDATE` chạm bản published (`BR-CSA-01`).
- [ ] Số trượt của `GT-001` về **0**.
- [ ] Nếu đo ra 0 trượt: ghi con số và bỏ WP này kèm lý do.

## WP130.4 — Level ngoài band

**Cỡ:** S

- [x] Engine không khai `banned_age_bands`. Đo để khẳng định `out_of_band_count` = **0**.
- [x] Ghi con số và bỏ WP này.

## WP130.5 — Nội dung tới sàn bậc 1

**Cỡ:** S · một PR

- [x] `level_count` ≥6.
- [x] `min_band_count` ≥1 trên mọi band hợp lệ.
- [x] `thinking_span` ≥2.
- [x] `what_span` ≥2, giá trị thuộc từ vựng đóng.
- [x] `theme_span` ≥2, giá trị thuộc 14 chủ đề của [`Task #119`](119-theme-registry-todo.md).
- [x] `difficulty_span` ≥2.
- [x] **≥1 level `access_tier` là `free` hoặc `login`** (`BR-ECD-07`).
- [ ] Level mới đi qua đủ tám cổng của [`Task #117`](117-seed-gate-truth-todo.md).
- [ ] Khung sinh bằng `gen:levels` nếu engine thuộc lô đầu của [`Task #121`](121-level-generator-kit-todo.md).
- [ ] Tag ba trục và câu lệnh tiếng Việt **viết tay** (`BR-LGK-08`, `BR-LGK-10`).
- [ ] Ghi số level đã soạn sang ngân sách 55 của [`Task #122`](122-engine-content-depth-todo.md) — không đếm hai lần.

## WP130.6 — Mở màn thật và đóng spec

**Cỡ:** S

- [ ] Mở một màn `GT-001` thật trong `apps/web`, **nhìn thấy hình**; đính ảnh chụp vào PR.
- [ ] Kiểm tay: chạm đúng thắng · chạm sai có phản hồi · gợi ý hiện sau `hint_after_ms`.
- [ ] Spec `GT-001` đổi `status: approved` → `implemented`, ghi ngày.

## Nghiệm thu — bảy điều kiện

- [x] 1. Spec `GT-001` đủ khuôn 16 mục; `check:engine-specs` xanh.
- [x] 2. `check:render` in `GT-001` đã cài; bảy phép kiểm vẽ xanh; ca âm đỏ.
- [ ] 3. Mọi `content_pack` của `GT-001` parse được contract.
- [x] 4. `out_of_band_count` của `GT-001` = 0.
- [x] 5. `check:engine-depth` bậc 1 xanh cho `GT-001`.
- [x] 6. `GT-001` có ≥1 level `free` hoặc `login`.
- [ ] 7. Ảnh chụp màn `GT-001` thật trong PR.
- [x] 0 câu `UPDATE` chạm bản published.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Danh sách `trạng-thái | tên-test` trùng khít trước/sau, trừ test mới.
- [ ] Cập nhật hàng `GT-001` ở bảng tiến độ của [`Task #116`](116-engine-vertical-slices-todo.md).
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Sáu số đo trước và sau: level=37 band=3-4:28 4-5:7 5-6:2 min=2 thinking=8 what=10 theme=7 diff=4
- `BR-E001-*` đã viết: ................
- Số level trượt parse, trước và sau: **37**
- Số level đã soạn thêm: ................
- Chi phí thật của WP130.2 (giờ): ................
