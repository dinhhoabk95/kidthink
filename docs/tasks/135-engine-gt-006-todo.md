# Checklist — Task #135: Engine `GT-006` Sắp xếp thứ tự

> Kế hoạch: [`135-engine-gt-006-plan.md`](135-engine-gt-006-plan.md).
> Vị trí **6 / 27** trong chương trình [`Task #116`](116-engine-vertical-slices-todo.md).
> Chỉ bắt đầu khi [`Task #130`](130-engine-gt-001-todo.md) đã merge — pilot chứng minh khuôn spec và khuôn `render()`.
> Chỉ bắt đầu khi [`Task #115`](115-render-contract-core-todo.md) và
> [`Task #120`](120-engine-spec-contract-todo.md) đã merge.
>
> Tuyệt đối: không sửa `render-system.ts`, không sửa `engine-depth.json`, không chạm file của
> engine khác, không `UPDATE` bản published, không so pixel, không đóng spec khi còn thiếu một
> trong bảy điều kiện.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight — đo sáu số đo của `GT-006`

- [x] `level_count` — kỳ vọng **21**. Đo: **21**.
- [x] `min_band_count` trên 1 band hợp lệ (`5-6`): ................
- [x] `thinking_span`: **7**.
- [x] `what_span`: **11**.
- [x] `theme_span`: **6**.
- [x] `difficulty_span`: **4**.
- [x] `out_of_band_count`: **19**.
- [x] Số level `GT-006` không parse được `content_contract`: **21**.
- [x] Số level `GT-006` có `access_tier` là `free` hoặc `login`: **3**.
- [x] Đọc `packages/game-engine/src/templates/GT-006/template.ts` và `session.ts` (78 dòng).
- [x] Đọc khuôn `render()` và bảy phép kiểm ở mục 7 của [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md).
- [x] Đọc khuôn spec 16 mục ở mục 4 của [`116-engine-vertical-slices-plan.md`](116-engine-vertical-slices-plan.md).
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP135.1 — Nâng phiếu thành spec đủ khuôn SDD

**Cỡ:** S · chỉ `docs/specs/01-platform/engines/GT-006.md`

- [x] Frontmatter đủ 9 trường; `spec: ENGINE-GT006`, `engine: sequence-order`, `batch: mvp`.
- [x] `owns` ba dòng — cấm chồng với spec lô hoặc `game-template-contract` (`BR-ESS-14`).
- [x] `depends_on` bốn spec.
- [x] Ánh xạ 11 mục cũ sang mục 1, 3, 7, 12, 13, 14 — giữ nguyên nội dung.
- [x] Viết mới mục 2 Actors.
- [x] Viết mới mục 4 Main flow — một lượt chơi đúng từ `content_pack` tới thắng.
- [x] Viết mới mục 5 Alternative flows — sai, hết giờ, gợi ý, asset hỏng, thiết bị yếu.
- [x] Viết mới mục 6 — `BR-E006-01` trở đi, ≥1 rule sinh từ ca sai; mỗi rule kèm lý do (`BR-ESS-12`).
- [x] Viết mới mục 8 — ghi rõ "không có API, engine chạy trong tiến trình".
- [x] Viết mới mục 9 — Gherkin, mỗi `BR-E006-*` ≥1 scenario (`BR-ESS-13`).
- [x] Mục 15 — trường trích kèm nguồn dòng: `layouts`, `limits`, `banned_age_bands`, `asset_kinds` (`BR-ESS-02`).
- [x] Viết mới mục 16 — sáu số đo từ Preflight.
- [x] Không khai `content_contract` hay Zod schema (`BR-ESS-03`); không khai `skill_id` (`BR-ESS-04`).
- [x] `status: draft` → `approved`.
- [x] Thêm `GT-006` vào `engine-spec-ready.json` — **một dòng**.
- [x] `check:engine-specs` xanh với `GT-006` trong bậc thang.

## WP135.2 — Cài `render()`

**Cỡ:** M · chỉ `packages/game-engine/src/templates/GT-006/`

- [x] Slot lấy từ `resolveLayout()` — không hằng số toạ độ.
- [x] Bốn lớp đúng thứ tự: nền cảnh · tĩnh · tương tác · phản hồi.
- [x] Phép kiểm 1 — thứ tự bốn lớp (`BR-ERC-06`).
- [x] Phép kiểm 2 — vùng chạm ≥ sàn chạm, đo ở 1 band hợp lệ (`5-6`) (`BR-ERC-04`).
- [x] Phép kiểm 3 — năm trạng thái thị giác, mỗi trạng thái ≥2 kênh.
- [x] Phép kiểm 4 — thuần: 100 lần cùng `timeMs`, trạng thái không đổi, 0 telemetry (`BR-ERC-02`).
- [x] Phép kiểm 5 — toạ độ từ `Slot[]`, cổng tĩnh xanh (`BR-ERC-03`).
- [x] Phép kiểm 6 — emoji hỏng không ném, vẽ ô giữ chỗ (`BR-ERC-07`).
- [x] Phép kiểm 7 — tuột bỏ hạt, giữ lớp 3 (`BR-ERC-09`).
- [x] Test vẽ chạy trên canvas ngoài màn hình; **không** so pixel (`BR-ERC-11`).
- [x] Thêm `GT-006` vào `render-implemented.json` — **một dòng, không sửa dòng khác**.
- [x] Ca âm: xoá `render()` của `GT-006` → `check:render` đỏ. Hoàn tác sau khi ghi bằng chứng.

## WP135.3 — Nợ `content_pack` của engine

**Cỡ:** S · chỉ corpus của `GT-006`

- [x] Đo: bao nhiêu trong 21 level trượt, thiếu trường nào.
- [x] Sửa bằng **version mới**; 0 câu `UPDATE` chạm bản published (`BR-CSA-01`).
- [ ] Số trượt của `GT-006` về **0**.
- [ ] Nếu đo ra 0 trượt: ghi con số và bỏ WP này kèm lý do.

## WP135.4 — Level ngoài band

**Cỡ:** S

- [ ] Đo level `GT-006` gắn band bị cấm (`3-4`, `4-5`).
- [ ] Áp luật phân loại đường A / đường B của [`Task #118`](118-band-violation-cleanup-todo.md).
- [ ] Sửa bằng version mới; đường B thì archive và soạn thay thế.
- [ ] `out_of_band_count` của `GT-006` về **0**.

## WP135.5 — Nội dung tới sàn bậc 1

**Cỡ:** S · một PR

- [ ] `level_count` ≥6.
- [ ] `min_band_count` ≥1 trên mọi band hợp lệ.
- [ ] `thinking_span` ≥2.
- [ ] `what_span` ≥2, giá trị thuộc từ vựng đóng.
- [ ] `theme_span` ≥2, giá trị thuộc 14 chủ đề của [`Task #119`](119-theme-registry-todo.md).
- [ ] `difficulty_span` ≥2.
- [x] **≥1 level `access_tier` là `free` hoặc `login`** (`BR-ECD-07`).
- [ ] Level mới đi qua đủ tám cổng của [`Task #117`](117-seed-gate-truth-todo.md).
- [ ] Khung sinh bằng `gen:levels` nếu engine thuộc lô đầu của [`Task #121`](121-level-generator-kit-todo.md).
- [ ] Tag ba trục và câu lệnh tiếng Việt **viết tay** (`BR-LGK-08`, `BR-LGK-10`).
- [ ] Ghi số level đã soạn sang ngân sách 55 của [`Task #122`](122-engine-content-depth-todo.md) — không đếm hai lần.

## WP135.6 — Mở màn thật và đóng spec

**Cỡ:** S

- [ ] Mở một màn `GT-006` thật trong `apps/web`, **nhìn thấy hình**; đính ảnh chụp vào PR.
- [ ] Kiểm tay: chạm đúng thắng · chạm sai có phản hồi · gợi ý hiện sau `hint_after_ms`.
- [ ] Spec `GT-006` đổi `status: approved` → `implemented`, ghi ngày.

## Nghiệm thu — bảy điều kiện

- [x] 1. Spec `GT-006` đủ khuôn 16 mục; `check:engine-specs` xanh.
- [x] 2. `check:render` in `GT-006` đã cài; bảy phép kiểm vẽ xanh; ca âm đỏ.
- [ ] 3. Mọi `content_pack` của `GT-006` parse được contract.
- [ ] 4. `out_of_band_count` của `GT-006` = 0.
- [ ] 5. `check:engine-depth` bậc 1 xanh cho `GT-006`.
- [x] 6. `GT-006` có ≥1 level `free` hoặc `login`.
- [ ] 7. Ảnh chụp màn `GT-006` thật trong PR.
- [x] 0 câu `UPDATE` chạm bản published.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Danh sách `trạng-thái | tên-test` trùng khít trước/sau, trừ test mới.
- [ ] Cập nhật hàng `GT-006` ở bảng tiến độ của [`Task #116`](116-engine-vertical-slices-todo.md).
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Sáu số đo trước và sau: level=21 band=5-6:2 min=2 thinking=7 what=11 theme=6 diff=4
- `BR-E006-*` đã viết: ................
- Số level trượt parse, trước và sau: **21**
- Số level đã soạn thêm: ................
- Chi phí thật của WP135.2 (giờ): ................
