# Checklist — Task #160: Bảng thứ tự kỹ năng theo tháng tuổi

> Kế hoạch: [`160-skill-age-progression-plan.md`](160-skill-age-progression-plan.md).
> Chỉ bắt đầu khi [`Task #157`](157-competency-allocation-program-todo.md),
> [`Task #123`](123-lesson-flow-model-todo.md) và
> [`Task #124`](124-lesson-corpus-depth-todo.md) đã merge.
>
> Tuyệt đối: Cấm — NEVER dùng bảng để chặn trẻ mở nội dung. Cấm — NEVER chép `BR-CRM-*`.
> Cấm — NEVER sinh bảng bằng máy từ `age_min`/`age_max` rồi gọi đó là nguồn sư phạm.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] Đếm kỹ năng đã đặt tên trong taxonomy — kỳ vọng **230**.
- [ ] Đếm kỹ năng có ≥1 game level — kỳ vọng **45**.
- [ ] Đếm kỹ năng trong thư viện giáo án — kỳ vọng **40**.
- [ ] Hợp hai tập trên, ra số dòng bảng phải phủ ngay: ................
- [ ] Đọc `BR-CRM-01` `BR-CRM-02` `BR-CRM-03` `BR-CRM-11` ở
      [`curriculum-model.md`](../specs/05-content/curriculum-model.md).
- [ ] Đọc `skill_prerequisites` — khẳng định là DAG, không chu trình.
- [ ] Duyệt `docs/montessori/` xem ba giai đoạn phủ được bao nhiêu kỹ năng: ................
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP160.1 — Chốt nguồn của bảng

**Cỡ:** S · **cổng người, không viết mã**

- [ ] So ba đường ở mục 3 của plan, chọn một.
- [ ] Ghi lý do chọn kèm số phủ đo được của đường đó.
- [ ] Nếu chọn Chương trình GDMN: lập bảng ánh xạ lĩnh vực giáo dục → competency `C1`…`C6`.
- [ ] Người sư phạm và người quyết ký duyệt.
- [ ] Trả lời `Q160-1`.

## WP160.2 — Spec `SKILL-AGE-PROGRESSION`

**Cỡ:** M · chỉ `docs/specs/05-content/skill-age-progression.md`

- [ ] Frontmatter đủ 9 trường; `spec: SKILL-AGE-PROGRESSION`, `area: content`, `phase: P4`.
- [ ] `owns` **một** dòng: thứ tự giới thiệu kỹ năng theo tháng tuổi.
- [ ] `depends_on`: `TAXONOMY-SERVICE` · `CURRICULUM-MODEL` · `LESSON-FLOW-MODEL` ·
      `PRESCHOOL-AGE-BANDS`.
- [ ] Mục 1 — nói rõ khác biệt với [`Task #159`](159-preschool-age-bands-todo.md): kia hỏi
      "hợp lứa không", đây hỏi "nằm đúng chỗ nào trong lứa".
- [ ] Mục 6 — bảy rule `BR-SAP-01` … `BR-SAP-07`, mỗi rule kèm **vì sao**.
- [ ] `BR-SAP-03` viết bằng chữ: bảng là gợi ý, cấm — NEVER chặn trẻ.
- [ ] Mục 7 — hình dạng một dòng bảng và nguồn của nó.
- [ ] Mục 9 — Gherkin, mỗi `BR-SAP-*` ≥1 scenario fail được.
- [ ] Mục 9 — scenario khẳng định bảng không chặn trẻ mở nội dung.
- [ ] `status: draft`.

## WP160.3 — Bảng dữ liệu

**Cỡ:** M · chỉ `packages/db/config/skill-age-progression.json`

- [ ] Phủ **100%** kỹ năng đang có level hoặc có tiết. Số dòng: ................
- [ ] Mỗi dòng đủ `skill_code` · `age_slice` · `rank_in_slice` · `source`.
- [ ] `age_slice` ∈ {`36-48m`, `48-60m`, `60-72m`}.
- [ ] Dòng thiếu `source` là dòng đoán — cấm — NEVER để trống.
- [ ] Đối chiếu ngược: mọi prerequisite xếp trước, cùng lát hoặc lát sớm hơn.
- [ ] Trả lời `Q160-2` (kỹ năng trải hai lát).
- [ ] Schema Zod kiểm tệp lúc nạp; tệp sai hình dạng thì cổng đỏ.

## WP160.4 — Cổng `check:skill-progression`

**Cỡ:** M · chỉ `packages/db/src/seed-content/gates/skill-progression.ts` + một dòng script

- [ ] Kiểm 1 — kỹ năng có level hoặc tiết mà thiếu dòng → **đỏ**.
- [ ] Kiểm 2 — thứ hạng vi phạm `skill_prerequisites` → **đỏ**.
- [ ] Kiểm 3 — flow xếp lệch bảng → **cảnh báo**, mã thoát 0.
- [ ] Ranh giới đỏ/cảnh báo ghi rõ trong mã kèm chú thích trỏ về `BR-SAP-03`.
- [ ] Nguồn hỏng → mã thoát ≠ 0 (`BR-SAP-06`).
- [ ] Báo cáo in từng kỹ năng thiếu; cấm — NEVER phần trăm tổng.
- [ ] Thêm `check:skill-progression` vào `packages/db/package.json` — **một dòng**.

## WP160.5 — Ca âm, ca dương, đóng spec

**Cỡ:** S · chỉ `packages/db/tests/gates/`

- [ ] **Ca âm 1** — đảo hai dòng liền kề vi phạm prerequisite → **đỏ**.
- [ ] **Ca âm 2** — xoá dòng của kỹ năng đang có level → **đỏ**.
- [ ] **Ca âm 3** — nguồn trỏ sang thư mục rỗng → **đỏ**, không in "0 vi phạm".
- [ ] **Ca dương** — flow xếp lệch bảng chỉ cảnh báo, mã thoát **0**.
- [ ] Bốn ca đều là test chạy trong `pnpm test`.
- [ ] Spec `status: draft` → `implemented`, ghi ngày.
- [ ] Ghi `Q160-3` sang backlog backend (bộ chọn thích ứng đọc bảng ở bước nào).

## Đóng task

- [ ] Bảy điều kiện nghiệm thu ở mục 4 của plan đều đúng.
- [ ] `D-SI` chưa bị đảo: bảng không chặn ghi danh, không chặn mở nội dung.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Danh sách `trạng-thái | tên-test` trùng khít trước/sau, trừ test mới.
