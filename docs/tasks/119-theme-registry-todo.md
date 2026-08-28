# Checklist — Task #119: Registry chủ đề

> Kế hoạch: [`119-theme-registry-plan.md`](119-theme-registry-plan.md).
> Tuyệt đối: không giữ danh sách chủ đề thứ hai, không nhánh slug dự phòng, không `UPDATE` tag
> bản published, không xoá level `school` để hạ trần.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] Đọc `CANONICAL_THEME_TAGS` ở `packages/db/tests/gates/thinking-coverage.ts:141` — đếm 22.
- [ ] Đọc trục `theme` ở `packages/db/src/seed-master/content-tags.ts` — đếm 12.
- [ ] Đọc mục 7.2 của [`content-tagging.md`](../specs/01-platform/content-tagging.md).
- [ ] Xác nhận `packages/shared/src/constants/` chưa tồn tại.
- [ ] `pnpm --filter @mindkid/db report:tags` — ghi phân bố `theme_tag` thật.
- [ ] Đếm level mang `household` `technology` `art` — kỳ vọng 2 · 1 · 4.
- [ ] Chạy `thinking-coverage.test.ts`, ghi số fail hiện tại (kỳ vọng 1 / 798).
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP119.1 — Chốt từ vựng

**Cỡ:** S · cổng người

- [ ] Trình bảng 7.1a (14 giá trị) và 7.1b (giá trị bị loại) cho người quyết.
- [ ] `Q119-1` — nhận 14 giá trị, hoặc bác bằng danh sách thay thế. Không nhận một phần.
- [ ] `Q119-1` — chốt N: số danh từ tối thiểu mỗi chủ đề.
- [ ] `Q119-2` — trần catalog 25 % hay 20 %.
- [ ] `Q119-2` — trần trong một engine.
- [ ] `Q119-3` — `geometry` đã có trong từ vựng `what` chưa.

## WP119.2 — Một nguồn sự thật

**Cỡ:** M

- [ ] Test RED trước: đếm nơi định nghĩa danh sách chủ đề — kỳ vọng **đỏ** với con số 2 hoặc 3.
- [ ] Tạo `packages/shared/src/constants/content-themes.ts` — 14 mục, mỗi mục `code` `label` `age_floor` `mô tả`.
- [ ] `seed-master/content-tags.ts` trục `theme` import từ file mới, bỏ danh sách riêng.
- [ ] `CANONICAL_THEME_TAGS` import từ file mới, bỏ `Set` viết tay.
- [ ] Mục 7.2 của `content-tagging.md` trỏ về file mới — sửa spec **trong cùng PR**.
- [ ] Khẳng định `packages/shared` không nhận dependency runtime mới; `pnpm lint:deps` xanh.
- [ ] Test đếm chuyển GREEN với con số 1.

## WP119.3 — `check:theme-registry`

**Cỡ:** M

- [ ] Ca âm: chủ đề bịa `banh_trung_thu_2026` (`BR-CTR-02`).
- [ ] Ca âm: `theme_tag` rỗng (`BR-CTR-03`).
- [ ] Ca âm: một chủ đề vượt trần (`BR-CTR-04`).
- [ ] Ca âm: `space` (`age_floor: 5`) gắn cho level band `3-4` (`BR-CTR-09`).
- [ ] Fixture đặt ở `packages/db/tests/**/fixtures/`, không viết thẳng vào file test.
- [ ] Cổng kiểm `BR-CTR-01` — mọi `theme_tag` thuộc 14 giá trị.
- [ ] Cổng kiểm `BR-CTR-03` — mọi `game_level` có `theme_tag` không rỗng.
- [ ] Cổng kiểm `BR-CTR-04` — trần catalog, chế độ bậc thang.
- [ ] Cổng kiểm `BR-CTR-05` — trần trong một engine.
- [ ] Cổng kiểm `BR-CTR-09` — `age_floor`.
- [ ] Nguồn không đọc được → đỏ. Ca kiểm: trỏ vào thư mục rỗng.
- [ ] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [ ] `packages/db/config/theme-caps.json` — ngưỡng hiện tại kèm ngày; test khẳng định chỉ giảm.
- [ ] Bốn ca âm chuyển sang đỏ vì đúng lý do.

## WP119.4 — Gắn lại mười bốn level

**Cỡ:** S · một PR

- [ ] `park` → `nature`, 6 level, version mới.
- [ ] `fruit` → `food`, 3 level, version mới.
- [ ] `household` → `home`, 2 level, version mới.
- [ ] `technology` → `home`, 1 level, version mới.
- [ ] `shape` → bỏ `theme_tag`, thêm tag trục `what` giá trị `geometry`, 2 level, version mới.
- [ ] `art` nhận vào từ vựng — 4 level trở thành hợp lệ, **không** gắn lại.
- [ ] Khẳng định không câu `UPDATE` nào chạm bản published (`BR-CTR-10`).
- [ ] `thinking-coverage.test.ts` xanh — 7 vi phạm `BR-TCM-01` về 0.

## WP119.5 — Vốn từ cho mỗi chủ đề

**Cỡ:** S

- [ ] Mỗi trong 14 chủ đề có ≥ N danh từ kèm emoji trong `emoji_registry`.
- [ ] Bốn chủ đề chưa có level — `family` `body` `weather` `festival` — vẫn phải có vốn từ.
- [ ] Cổng kiểm `BR-CTR-08`; ca âm: bỏ vốn từ của một chủ đề → đỏ.
- [ ] Mọi emoji ref resolve được.

## Nghiệm thu

- [ ] Đúng **một** định nghĩa danh sách chủ đề trong monorepo.
- [ ] `check:theme-registry` xanh, và đỏ với chủ đề bịa đặt.
- [ ] Bốn ca âm đều đỏ vì đúng lý do.
- [ ] `thinking-coverage.test.ts` xanh.
- [ ] 14 level gắn lại bằng version mới; 0 câu `UPDATE`.
- [ ] Mỗi chủ đề có vốn từ, emoji resolve được.
- [ ] `theme-caps.json` có ngày; test khẳng định ngưỡng chỉ giảm.
- [ ] `pnpm --filter @mindkid/db test` xanh; danh sách test trùng khít trừ test mới.
- [ ] `content-theme-registry.md` mang `status: implemented`.
- [ ] `pnpm lint` · `pnpm lint:deps` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Phân bố `theme_tag` trước và sau: ................
- Tỉ lệ `school` trước và sau: ................
- Ngưỡng bậc thang đã chốt: ................
