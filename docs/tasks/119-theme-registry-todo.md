# Checklist — Task #119: Registry chủ đề

> Kế hoạch: [`119-theme-registry-plan.md`](119-theme-registry-plan.md).
> Tuyệt đối: không giữ danh sách chủ đề thứ hai, không nhánh slug dự phòng, không `UPDATE` tag
> bản published, không xoá level `school` để hạ trần.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] Đọc `CANONICAL_THEME_TAGS` ở `packages/db/tests/gates/thinking-coverage.ts:141` — đếm 22.
- [x] Đọc trục `theme` ở `packages/db/src/seed-master/content-tags.ts` — đếm 12.
- [x] Đọc mục 7.2 của [`content-tagging.md`](../specs/01-platform/content-tagging.md).
- [x] Xác nhận `packages/shared/src/constants/` chưa tồn tại.
- [x] `pnpm --filter @mindkid/db report:tags` — ghi phân bố `theme_tag` thật.
- [x] Đếm level mang `household` `technology` `art` — kỳ vọng 2 · 1 · 4.
- [x] Chạy `thinking-coverage.test.ts`, ghi số fail hiện tại (kỳ vọng 1 / 798).
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP119.1 — Chốt từ vựng

**Cỡ:** S · cổng người

- [x] Trình bảng 7.1a (14 giá trị) và 7.1b (giá trị bị loại) cho người quyết.
- [x] `Q119-1` — nhận 14 giá trị, hoặc bác bằng danh sách thay thế. Không nhận một phần.
- [x] `Q119-1` — chốt N: số danh từ tối thiểu mỗi chủ đề.
- [x] `Q119-2` — trần catalog 25 % hay 20 %.
- [x] `Q119-2` — trần trong một engine.
- [x] `Q119-3` — `geometry` đã có trong từ vựng `what` chưa.

## WP119.2 — Một nguồn sự thật

**Cỡ:** M

- [x] Test RED trước: đếm nơi định nghĩa danh sách chủ đề — kỳ vọng **đỏ** với con số 2 hoặc 3.
- [x] Tạo `packages/shared/src/constants/content-themes.ts` — 14 mục, mỗi mục `code` `label` `age_floor` `mô tả`.
- [x] `seed-master/content-tags.ts` trục `theme` import từ file mới, bỏ danh sách riêng.
- [x] `CANONICAL_THEME_TAGS` import từ file mới, bỏ `Set` viết tay.
- [x] Mục 7.2 của `content-tagging.md` trỏ về file mới — sửa spec **trong cùng PR**.
- [x] Khẳng định `packages/shared` không nhận dependency runtime mới; `pnpm lint:deps` xanh.
- [x] Test đếm chuyển GREEN với con số 1.

## WP119.3 — `check:theme-registry`

**Cỡ:** M

- [x] Ca âm: chủ đề bịa `banh_trung_thu_2026` (`BR-CTR-02`).
- [x] Ca âm: `theme_tag` rỗng (`BR-CTR-03`).
- [x] Ca âm: một chủ đề vượt trần (`BR-CTR-04`).
- [x] Ca âm: `space` (`age_floor: 5`) gắn cho level band `3-4` (`BR-CTR-09`).
- [x] Fixture đặt ở `packages/db/tests/**/fixtures/`, không viết thẳng vào file test.
- [x] Cổng kiểm `BR-CTR-01` — mọi `theme_tag` thuộc 14 giá trị.
- [x] Cổng kiểm `BR-CTR-03` — mọi `game_level` có `theme_tag` không rỗng.
- [x] Cổng kiểm `BR-CTR-04` — trần catalog, chế độ bậc thang.
- [x] Cổng kiểm `BR-CTR-05` — trần trong một engine.
- [x] Cổng kiểm `BR-CTR-09` — `age_floor`.
- [x] Nguồn không đọc được → đỏ. Ca kiểm: trỏ vào thư mục rỗng.
- [x] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [x] `packages/db/config/theme-caps.json` — ngưỡng hiện tại kèm ngày; test khẳng định chỉ giảm.
- [x] Bốn ca âm chuyển sang đỏ vì đúng lý do.

## WP119.4 — Gắn lại mười bốn level

**Cỡ:** S · một PR

- [x] `park` → `nature`, 6 level, version mới.
- [x] `fruit` → `food`, 3 level, version mới.
- [x] `household` → `home`, 2 level, version mới.
- [x] `technology` → `home`, 1 level, version mới.
- [x] `shape` → bỏ `theme_tag`, thêm tag trục `what` giá trị `geometry`, 2 level, version mới.
- [x] `art` nhận vào từ vựng — 4 level trở thành hợp lệ, **không** gắn lại.
- [x] Khẳng định không câu `UPDATE` nào chạm bản published (`BR-CTR-10`).
- [x] `thinking-coverage.test.ts` xanh — 7 vi phạm `BR-TCM-01` về 0.

## WP119.5 — Vốn từ cho mỗi chủ đề

**Cỡ:** S

- [x] Mỗi trong 14 chủ đề có ≥ N danh từ kèm emoji trong `emoji_registry`.
- [x] Bốn chủ đề chưa có level — `family` `body` `weather` `festival` — vẫn phải có vốn từ.
- [x] Cổng kiểm `BR-CTR-08`; ca âm: bỏ vốn từ của một chủ đề → đỏ.
- [x] Mọi emoji ref resolve được.

## Nghiệm thu

- [x] Đúng **một** định nghĩa danh sách chủ đề trong monorepo.
- [x] `check:theme-registry` xanh, và đỏ với chủ đề bịa đặt.
- [x] Bốn ca âm đều đỏ vì đúng lý do.
- [x] `thinking-coverage.test.ts` xanh.
- [x] 14 level gắn lại bằng version mới; 0 câu `UPDATE`.
- [x] Mỗi chủ đề có vốn từ, emoji resolve được.
- [x] `theme-caps.json` có ngày; test khẳng định ngưỡng chỉ giảm.
- [x] `pnpm --filter @mindkid/db test` xanh; danh sách test trùng khít trừ test mới.
- [x] `content-theme-registry.md` mang `status: implemented`.
- [x] `pnpm lint` · `pnpm lint:deps` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Phân bố `theme_tag` trước và sau: 14 chủ đề chuẩn hoá, 0 ngoài từ vựng.
- Tỉ lệ `school` trước và sau: tuân thủ ceiling trong theme-caps.json.
- Ngưỡng bậc thang đã chốt: Tier 1 active.
