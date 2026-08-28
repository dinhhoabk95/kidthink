# Checklist — Task #159: Contract biên soạn theo band tuổi mầm non

> Kế hoạch: [`159-preschool-age-bands-plan.md`](159-preschool-age-bands-plan.md).
> Chỉ bắt đầu khi [`Task #157`](157-competency-allocation-program-todo.md) và
> [`Task #123`](123-lesson-flow-model-todo.md) đã merge.
>
> Tuyệt đối: Cấm — NEVER chặn ghi danh theo tuổi (`D-SI` giữ nguyên, cầu vẫn 126 tiết).
> Cấm — NEVER chép `BR-ECD-13`. Cấm — NEVER sửa nội dung trong task này. Cấm — NEVER đặt trần
> lỏng tới mức cổng xanh ngay lần đầu.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] Đọc mục 7.1 của [`lesson-flow-model.md`](../specs/05-content/lesson-flow-model.md) để
      biết `D-SI` nói gì chính xác.
- [ ] Đọc `BR-CRM-01` … `BR-CRM-11` ở [`curriculum-model.md`](../specs/05-content/curriculum-model.md)
      — ràng buộc sư phạm đã có, cấm — NEVER nói lại.
- [ ] Đọc `BR-ECD-13` ở [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md).
- [ ] Đếm lesson `published` — kỳ vọng **81** (`3-4`: 19 · `4-5`: 26 · `5-6`: 36).
- [ ] Đếm level `published` — kỳ vọng **228**.
- [ ] Phân bố `difficulty` theo band, đo hiện trạng: ................
- [ ] Phân bố `estimated_minutes` theo band, đo hiện trạng: ................
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP159.1 — Spec `PRESCHOOL-AGE-BANDS`

**Cỡ:** M · chỉ `docs/specs/05-content/preschool-age-bands.md`

- [ ] Frontmatter đủ 9 trường; `spec: PRESCHOOL-AGE-BANDS`, `area: content`, `phase: P4`.
- [ ] `owns` **một** dòng: ràng buộc biên soạn của nội dung theo band tuổi mầm non.
- [ ] `depends_on`: `LESSON-MODEL` · `LESSON-FLOW-MODEL` · `CURRICULUM-MODEL` ·
      `GAME-LEVEL-MODEL` · `TAXONOMY-SERVICE`.
- [ ] Mục 1 — nói rõ nó ép **nội dung**, cấm — NEVER ép ghi danh.
- [ ] Mục 7 — bảng ba band × năm ràng buộc, **mỗi ô một con số**, mỗi con số có nguồn.
- [ ] Trần `difficulty` mỗi band: `3-4` ....... · `4-5` ....... · `5-6` .......
- [ ] Trần `estimated_minutes` mỗi band: `3-4` ....... · `4-5` ....... · `5-6` .......
- [ ] Trần số bước chơi mỗi band: ................
- [ ] Trần `item_count` hiển thị cùng lúc mỗi band: ................
- [ ] Trần số tiêu chí phải giữ cùng lúc mỗi band: ................
- [ ] Mục 6 — bảy rule `BR-PAR-01` … `BR-PAR-07`, mỗi rule kèm **vì sao**.
- [ ] `BR-PAR-03` **link** tới `BR-ECD-13`, cấm — NEVER chép nội dung.
- [ ] `BR-PAR-04` viết bằng chữ: contract này cấm dùng để chặn ghi danh.
- [ ] Mục 9 — Gherkin, mỗi `BR-PAR-*` ≥1 scenario fail được.
- [ ] Mục 9 — thêm scenario khẳng định **không** route nào chặn ghi danh vì tuổi.
- [ ] Người sư phạm ký duyệt bảng ở mục 7. Trả lời `Q159-1`.

## WP159.2 — Cổng `check:age-band-fit`

**Cỡ:** M · chỉ `packages/db/src/seed-content/gates/age-band-fit.ts` + một dòng script

- [ ] Chạy trên **cả** 228 level và 81 tiết.
- [ ] Trần đọc từ tệp cấu hình, cấm — NEVER hằng số trong mã.
- [ ] In dạng `mã | band | trần bị vượt | giá trị hiện có`.
- [ ] Cấm — NEVER in phần trăm tổng (`BR-PAR-06`).
- [ ] Nguồn hỏng → mã thoát ≠ 0 (`BR-PAR-05`).
- [ ] Thêm `check:age-band-fit` vào `packages/db/package.json` — **một dòng**.
- [ ] Chạy lần đầu → **đỏ**. Nếu xanh: trần quá lỏng hoặc cổng không đo. Dừng lại, tìm nguyên nhân.

## WP159.3 — Ba ca âm và một ca dương

**Cỡ:** S · chỉ `packages/db/tests/gates/`

- [ ] **Ca âm 1** — hạ `age_min` một tiết `5-6` xuống 3 → cổng **đỏ**.
- [ ] **Ca âm 2** — nâng `estimated_minutes` một tiết `3-4` vượt trần → cổng **đỏ**.
- [ ] **Ca âm 3** — nguồn trỏ sang thư mục rỗng → cổng **đỏ**, không in "0 vi phạm".
- [ ] **Ca dương** — khẳng định không rule nào chặn ghi danh theo tuổi (`BR-PAR-04`).
- [ ] Bốn ca đều là test chạy trong `pnpm test`.

## WP159.4 — Đo món nợ và đóng spec

**Cỡ:** S

- [ ] Số level lệch band trên 228: ................
- [ ] Số tiết lệch band trên 81: ................
- [ ] Chuyển hai con số sang [`Task #124`](124-lesson-corpus-depth-todo.md).
- [ ] Trả lời `Q159-2`: sửa bằng đổi band hay đổi nội dung.
- [ ] Cấm — NEVER sửa nội dung trong task này.
- [ ] Spec `status: draft` → `implemented`, ghi ngày.

## Đóng task

- [ ] Bảy điều kiện nghiệm thu ở mục 4 của plan đều đúng.
- [ ] `D-SI` chưa bị đảo: cầu giáo án vẫn **126** tiết.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Danh sách `trạng-thái | tên-test` trùng khít trước/sau, trừ test mới.
