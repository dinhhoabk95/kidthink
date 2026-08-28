# Checklist — Task #158: Spec và cổng ma trận phân bổ lĩnh vực tư duy

> Kế hoạch: [`158-engine-competency-allocation-plan.md`](158-engine-competency-allocation-plan.md).
> Chỉ bắt đầu khi [`Task #157`](157-competency-allocation-program-todo.md) đã merge (bản đồ
> tương hợp và trần ngoại lệ phải có trước).
>
> Tuyệt đối: Cấm — NEVER sửa [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md)
> ngoài một link. Cấm — NEVER chép `BR-ECD-*`. Cấm — NEVER soạn level. Cấm — NEVER cho cổng
> xanh khi nguồn không đọc được.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] `packages/db/config/engine-competency-allocation.json` đã có bản duyệt từ
      [`#157`](157-competency-allocation-program-todo.md).
- [ ] Con số ngân sách hợp nhất của WP157.1: ................
- [ ] Trần ngoại lệ đã chốt: ................
- [ ] Đọc mục 6 và mục 7 của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md)
      để biết `BR-ECD-*` sở hữu gì — cấm — NEVER chồng lấn.
- [ ] Đọc `packages/db/src/seed-content/gates/runner.ts` để biết kiểu hỏng phải tránh.
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP158.1 — Spec `ENGINE-COMPETENCY-ALLOCATION`

**Cỡ:** M · chỉ `docs/specs/05-content/engine-competency-allocation.md`

- [ ] Frontmatter đủ 9 trường; `spec: ENGINE-COMPETENCY-ALLOCATION`, `area: content`,
      `mvp: false`, `phase: P4`.
- [ ] `owns` ba dòng: bản đồ tương hợp · sàn K mỗi ô · khuôn và trần ngoại lệ.
- [ ] `owns` không chồng với `ENGINE-CONTENT-DEPTH` — sàn **số level** thuộc file kia.
- [ ] `depends_on`: `ENGINE-CONTENT-DEPTH` · `TAXONOMY-SERVICE` · `CONTENT-TAGGING` ·
      `GAME-TEMPLATE-CONTRACT`.
- [ ] Mục 1 Objective — nói rõ nó **cộng thêm** vào chiều sâu, cấm — NEVER thay thế.
- [ ] Mục 4 Main flow — bảy bước cổng chạy, đánh số.
- [ ] Mục 5 Alternative flows — engine `deprecated` · band bị cấm · engine mới chưa có nội dung
      · level `draft` · archive làm thủng ô.
- [ ] Mục 6 — chín rule `BR-ECA-01` … `BR-ECA-09`, mỗi rule kèm **vì sao**.
- [ ] Mục 7 Data — nguồn đọc, không ghi database, đầu ra là báo cáo và mã thoát.
- [ ] Mục 8 — ghi rõ "không sở hữu route"; số đo cấm — NEVER lộ ra bề mặt công khai.
- [ ] Mục 9 — Gherkin, mỗi `BR-ECA-*` ≥1 scenario **fail được**.
- [ ] Mục 10 Boundaries · mục 11 Open questions đầy đủ.
- [ ] `status: draft`.

## WP158.2 — Cấu hình

**Cỡ:** S · chỉ `packages/db/config/engine-competency-allocation.json`

- [ ] `k` = **3**.
- [ ] `affinity` đủ **27** dòng; mỗi dòng có `engine` · `allows` (≥3) · `forbids` · `reasons`.
- [ ] Mỗi lĩnh vực trong `allows` có đúng một câu `reasons` neo vào `mechanic`.
- [ ] `exceptions` — mỗi ô đủ `engine` · `band` · `reason` · `decided_by` · `date`.
- [ ] `exception_cap` = con số của WP157.3.
- [ ] Schema Zod kiểm tệp này lúc nạp; tệp sai hình dạng thì cổng đỏ, cấm — NEVER bỏ qua.

## WP158.3 — Cổng `check:engine-allocation`

**Cỡ:** M · chỉ `packages/db/src/seed-content/gates/allocation.ts` + một dòng script

- [ ] Đọc corpus seed **và** registry engine; nguồn hỏng → mã thoát ≠ 0 (`BR-ECA-08`).
- [ ] `banned_age_bands` đọc từ registry, cấm — NEVER hằng số ba band (`BR-ECA-04`).
- [ ] Competency suy từ tiền tố `skill_codes`, đối chiếu `affinity` (`BR-ECA-01`).
- [ ] Level gắn lĩnh vực ngoài `allows` của engine → đỏ (`BR-ECA-03`).
- [ ] In **mọi** ngoại lệ ở mỗi lần chạy, kể cả khi xanh (`BR-ECA-06`).
- [ ] Báo cáo in ô nào thiếu lĩnh vực nào; cấm — NEVER phần trăm tổng (`BR-ECA-09`).
- [ ] Gợi ý lĩnh vực còn trống lấy từ `allows` trừ đi lĩnh vực đã có.
- [ ] Phép đo xuất thành **một hàm** cho [`#161`](161-cell-aware-level-generator-todo.md) gọi lại.
- [ ] Thêm `check:engine-allocation` vào `packages/db/package.json` — **một dòng**.

## WP158.4 — Ba ca âm

**Cỡ:** S · chỉ `packages/db/tests/gates/`

- [ ] **Ca âm 1** — đổi `skill_codes` của level giữ ô duy nhất → cổng **đỏ**. Hoàn tác sau khi
      ghi bằng chứng.
- [ ] **Ca âm 2** — ngoại lệ thiếu `reason` → cổng **đỏ**.
- [ ] **Ca âm 3** — corpus trỏ sang thư mục rỗng → cổng **đỏ**, không in "0 vi phạm".
- [ ] Ca âm 4 (nếu chốt `Q158-1`) — level gắn hai kỹ năng khác lĩnh vực.
- [ ] Mỗi ca âm là một test chạy trong `pnpm test`, không phải một lần thử tay.

## WP158.5 — Đóng spec

**Cỡ:** S

- [ ] Chạy cổng trên corpus hôm nay → **đỏ**.
- [ ] Số ô thiếu in ra: ................ — phải khớp con số WP157.1.
- [ ] Lệch thì **dừng lại**, tìm nguyên nhân; cấm — NEVER chỉnh con số cho khớp.
- [ ] Đưa cổng vào chuỗi chạy trước merge.
- [ ] Spec `status: draft` → `implemented`, ghi ngày.

## Đóng task

- [ ] Bảy điều kiện nghiệm thu ở mục 4 của plan đều đúng.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Danh sách `trạng-thái | tên-test` trùng khít trước/sau, trừ test mới.
- [ ] `Q158-1` và `Q158-2` đã có câu trả lời ghi trong spec.
