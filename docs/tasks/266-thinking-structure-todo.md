# Task #266 Todo: Cấu trúc tư duy

Plan: [`266-thinking-structure-plan.md`](266-thinking-structure-plan.md).
Spec: [`skill-thinking-structure.md`](../specs/05-content/skill-thinking-structure.md).

Tám phép đo mở đầu (đo 2026-09-11): 0/443 `relations` · 0/443 `axes` · 1 chuỗi prompt phân biệt ·
4 chuỗi `observable_criteria` trên 1.329 LO · 30/30 kỹ năng `deduce` bị ép thành `observe` ·
182/725 giá trị tư duy mất trên đường xuống DB · 4 trường 0 consumer · `axes` không có trong câu
`INSERT`.

Song song an toàn: **L1 · L2 · L3**. Bắt buộc tuần tự: **L1 → L4 → L5 → L6 → L7**.

---

## L1 — Sửa mất dữ liệu im lặng

- [x] T1.1 Chốt cách xử lý `deduce`: thêm vào `CANONICAL_THINKING_TAGS`, hoặc ánh xạ tường minh về `infer`
- [x] T1.2 Áp cách đã chốt vào `normalizeThinkingTags` (`packages/content/src/builders/build-levels.ts:256`)
- [x] T1.3 Đổi nhánh `else` ở dòng 291 thành **ném lỗi** nêu đúng giá trị không ánh xạ được (`BR-STS-05`)
- [x] T1.4 Ghi sáu ánh xạ có chủ ý vào mục 7.2 của spec, kèm lý do từng cái (`BR-STS-06`)
- [x] T1.5 **Ca âm** — gọi `normalizeThinkingTags(["khong_ton_tai"])` → ném lỗi, không trả `observe`
- [x] T1.6 **Ca âm** — gọi với `"deduce"` → không trả `observe`
- [x] T1.7 Chạy `pnpm db:seed` xác nhận không đỏ sau khi đổi nhánh `else`

## L2 — `axes` xuống được DB

- [x] T2.1 Thêm `axes` vào câu `INSERT` của `seedSkillDatasetsStep` (`seed-master/taxonomy/index.ts:624`)
- [x] T2.2 Thêm `axes` vào nhánh `onConflictDoUpdate`
- [x] T2.3 Thêm `extendsSkillCode` vào cả hai chỗ
- [x] T2.4 Test tích hợp: ghi một dataset có `axes` một trục tên `"size"`, đọc lại từ `skill_datasets`, khẳng định cột khác `null` và chứa trục đó (`BR-STS-04`)
- [x] T2.5 Test tích hợp: chạy seeder hai lần, khẳng định `axes` không bị ghi đè thành `null` ở lần hai
- [x] T2.6 Không cần migration — cột đã có; xác nhận bằng `\d skill_datasets`

## L3 — Một từ vựng tư duy

- [x] T3.1 Liệt kê mọi giá trị `thinking_tags` tự do trong `packages/content/src/activities/c*.ts`
- [x] T3.2 Ánh xạ từng giá trị sang đúng một giá trị của union `ThinkingProcess`
- [x] T3.3 Đổi kiểu trường `thinking_tags` của `ActivitySeed` sang `readonly ThinkingProcess[]`
- [x] T3.4 **Ca âm `BR-STS-08`** — khai `thinking_tags: ["counting"]` → cổng đỏ, nêu đúng chuỗi ngoài union
- [x] T3.5 Không đổi số lượng activity; chỉ đổi từ vựng

## L4 — Cổng `check:thinking-structure`

- [x] T4.1 `scripts/check-thinking-structure.ts` đọc `SKILL_DATASETS` và `SKILL_IDENTITIES` qua import, Cấm — NEVER đọc file bằng regex
- [x] T4.2 Cài đủ 18 luật của bảng nghĩa vụ mục 7.1 của spec
- [x] T4.3 Ratchet `scripts/thinking-structure-baseline.json` với ba trục theo mục 7.4 của spec
- [x] T4.4 `total_unproven_skills` và mọi ô `unproven_by_*` — chỉ giảm
- [x] T4.5 `distinct_prompt_templates` — **chỉ tăng**, kiểm riêng, không gộp vòng lặp chung
- [x] T4.6 Báo cáo in cả số kỹ năng **bỏ qua** và lý do bỏ qua, không chỉ số đã duyệt
- [x] T4.7 Nợ ghi theo **mã kỹ năng**, không chỉ ghi tổng
- [x] T4.8 `--update` hạ được baseline; Cấm — NEVER nâng
- [x] T4.9 Nối `check:thinking-structure` vào `package.json` và `scripts/check.sh`
- [x] T4.10 Đo thời gian chạy; vượt 10 giây thì chuyển sang `lefthook` thay vì `check.sh` phase 1

## L5 — Ca âm cổng (mỗi luật một ca, bắt buộc)

- [x] T5.1 **Ca âm `compare`** — dataset không có `axes` ordered: true → đỏ, nêu thiếu trục có thứ tự
- [x] T5.2 **Ca âm `sort`** — trục phân loại có nhóm chỉ 1 item → đỏ; đa trục mà 1 trục hỏng → đỏ
- [x] T5.3 **Ca âm `match`** — kỹ năng khai `match`, `relations` thiếu `pair` → đỏ
- [x] T5.4 **Ca âm `count`** — 0 item có `value` → đỏ; thiếu giá trị theo `c1-numeral` → đỏ
- [x] T5.5 **Ca âm `sequence`** — `ordering` đúng bằng `items.map(id)` và không có quan hệ `sequence` → đỏ
- [x] T5.6 **Ca âm `infer`** — không có quan hệ `subset` và `axes` dưới 2 trục → đỏ
- [x] T5.7 **Ca âm `predict`** — có quan hệ `sequence` nhưng `ordering` rỗng hoặc tầm thường → đỏ
- [x] T5.8 **Ca âm `deduce`** — chỉ có 1 trục `axes` → đỏ (đòi ≥2 trục và quan hệ `subset`)
- [x] T5.9 **Ca âm `solve`** — `axes` < 2 trục và `relations` < 3 quan hệ → đỏ
- [x] T5.10 **Ca âm `verify`** — thiếu quan hệ `contrast` với `near_miss` hoặc cùng `contrast_group` → đỏ
- [x] T5.11 **Ca âm `create`** — `axes` thiếu hoặc `items` < 6 → đỏ
- [x] T5.12 **Ca âm `plan`** — có `sequence` nhưng thiếu `metadata.step` → đỏ
- [x] T5.13 **Ca âm `recall`** — `contrast_group` dưới 2 nhóm phân biệt → đỏ
- [x] T5.14 **Ca âm `inhibit`** — có 2 nhóm nhưng thiếu `is_lure` → đỏ
- [x] T5.15 **Ca âm `shift`** — `axes` dưới 2 trục → đỏ
- [x] T5.16 **Ca âm `describe`** — có item thiếu `label` hoặc `audio_path` → đỏ
- [x] T5.17 **Ca âm `listen`** — có item thiếu `audio_path` → đỏ
- [x] T5.18 **Ca âm `observe`** — items không có facet phân biệt bằng mắt → đỏ
- [x] T5.19 **Ca âm `BR-STS-09` chiều giảm** — bớt một prompt phân biệt → đỏ
- [x] T5.20 **Ca dương `BR-STS-09` chiều tăng** — thêm một prompt phân biệt → **xanh**, không đỏ
- [x] T5.21 **Ca âm `BR-STS-11`** — nợ tăng → đỏ, liệt kê đúng mã kỹ năng mới rơi vào nợ kèm chi tiết lỗi
- [x] T5.22 **Ca âm `BR-STS-11`** — số kỹ năng kiểm tra giảm dưới `min_inspected_skills` → đỏ
- [x] T5.23 **Ca âm baseline** — baseline thiếu file, JSON hỏng, hoặc thiếu khoá bắt buộc → đỏ, ném lỗi đọc được
- [x] T5.24 Mỗi ca âm chạy độc lập, không phụ thuộc thứ tự

## L6 — Phán quyết bốn trường

- [x] T6.1 Ghi bảng phán quyết mục 7.3 của spec vào `skill-dataset-model.md` dưới dạng liên kết, không copy
- [x] T6.2 Xoá `success_message` khỏi `SkillPhrasing` (`packages/shared/src/skill-dataset-types.ts`)
- [x] T6.3 Xoá `hint_message` khỏi `SkillPhrasing`
- [x] T6.4 Codemod dựa trên AST xoá hai trường khỏi 443 file; Cấm — NEVER dùng `sed` mù
- [x] T6.5 Đọc diff từng file sau codemod; `pnpm test` trước và sau phải cùng kết quả
- [x] T6.6 Một lần ghi lại `skill_datasets.phrasing` dọn dữ liệu cũ trong DB
- [x] T6.7 Giữ `ladder`, `narration_template`, `extends`, `skill_dataset_id` — ghi lý do giữ và task nối chúng

## L7 — Chốt số

- [x] T7.1 Chạy `pnpm check:thinking-structure --update`, chốt baseline
- [x] T7.2 Đo lại M5: 0 kỹ năng `deduce` bị ép thành `observe`
- [x] T7.3 Đo lại M7: 4 trường 0 consumer giảm còn 2 (`ladder`, `narration_template` — có task nối)
- [x] T7.4 Đo lại M8: `axes` ghi được xuống DB
- [x] T7.5 `pnpm check` xanh; `pnpm typecheck` không thêm nợ
- [x] T7.6 Xác nhận `pnpm db:seed` chạy hết không đỏ

---

## Chưa làm trong task này

- Soạn lại nội dung dataset: `C1` ở task `#267`; `C2`–`C6` chờ lát cắt sau.
- Nối `ladder` vào `packages/adaptive/src/level-params.ts` — chờ câu hỏi mở 1 của spec.
- Sửa `skill-template-affinity` theo `BR-STS-10` — chờ câu hỏi mở 3 của spec.
- Nâng `relations` và `axes` thành bắt buộc trong type — chỉ khi `total_unproven_skills` về 0.
