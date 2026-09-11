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

- [ ] T1.1 Chốt cách xử lý `deduce`: thêm vào `CANONICAL_THINKING_TAGS`, hoặc ánh xạ tường minh về `infer`
- [ ] T1.2 Áp cách đã chốt vào `normalizeThinkingTags` (`packages/content/src/builders/build-levels.ts:256`)
- [ ] T1.3 Đổi nhánh `else` ở dòng 291 thành **ném lỗi** nêu đúng giá trị không ánh xạ được (`BR-STS-05`)
- [ ] T1.4 Ghi sáu ánh xạ có chủ ý vào mục 7.2 của spec, kèm lý do từng cái (`BR-STS-06`)
- [ ] T1.5 **Ca âm** — gọi `normalizeThinkingTags(["khong_ton_tai"])` → ném lỗi, không trả `observe`
- [ ] T1.6 **Ca âm** — gọi với `"deduce"` → không trả `observe`
- [ ] T1.7 Chạy `pnpm db:seed` xác nhận không đỏ sau khi đổi nhánh `else`

## L2 — `axes` xuống được DB

- [ ] T2.1 Thêm `axes` vào câu `INSERT` của `seedSkillDatasetsStep` (`seed-master/taxonomy/index.ts:624`)
- [ ] T2.2 Thêm `axes` vào nhánh `onConflictDoUpdate`
- [ ] T2.3 Thêm `extendsSkillCode` vào cả hai chỗ
- [ ] T2.4 Test tích hợp: ghi một dataset có `axes` một trục tên `"size"`, đọc lại từ `skill_datasets`, khẳng định cột khác `null` và chứa trục đó (`BR-STS-04`)
- [ ] T2.5 Test tích hợp: chạy seeder hai lần, khẳng định `axes` không bị ghi đè thành `null` ở lần hai
- [ ] T2.6 Không cần migration — cột đã có; xác nhận bằng `\d skill_datasets`

## L3 — Một từ vựng tư duy

- [ ] T3.1 Liệt kê mọi giá trị `thinking_tags` tự do trong `packages/content/src/activities/c*.ts`
- [ ] T3.2 Ánh xạ từng giá trị sang đúng một giá trị của union `ThinkingProcess`
- [ ] T3.3 Đổi kiểu trường `thinking_tags` của `ActivitySeed` sang `readonly ThinkingProcess[]`
- [ ] T3.4 **Ca âm `BR-STS-08`** — khai `thinking_tags: ["counting"]` → cổng đỏ, nêu đúng chuỗi ngoài union
- [ ] T3.5 Không đổi số lượng activity; chỉ đổi từ vựng

## L4 — Cổng `check:thinking-structure`

- [ ] T4.1 `scripts/check-thinking-structure.ts` đọc `SKILL_DATASETS` và `SKILL_IDENTITIES` qua import, Cấm — NEVER đọc file bằng regex
- [ ] T4.2 Cài đủ 18 luật của bảng nghĩa vụ mục 7.1 của spec
- [ ] T4.3 Ratchet `scripts/thinking-structure-baseline.json` với ba trục theo mục 7.4 của spec
- [ ] T4.4 `total_unproven_skills` và mọi ô `unproven_by_*` — chỉ giảm
- [ ] T4.5 `distinct_prompt_templates` — **chỉ tăng**, kiểm riêng, không gộp vòng lặp chung
- [ ] T4.6 Báo cáo in cả số kỹ năng **bỏ qua** và lý do bỏ qua, không chỉ số đã duyệt
- [ ] T4.7 Nợ ghi theo **mã kỹ năng**, không chỉ ghi tổng
- [ ] T4.8 `--update` hạ được baseline; Cấm — NEVER nâng
- [ ] T4.9 Nối `check:thinking-structure` vào `package.json` và `scripts/check.sh`
- [ ] T4.10 Đo thời gian chạy; vượt 10 giây thì chuyển sang `lefthook` thay vì `check.sh` phase 1

## L5 — Ca âm cổng (mỗi luật một ca, bắt buộc)

- [ ] T5.1 **Ca âm `BR-STS-01`** — `C1.CMP.04` khai `compare`, dataset không có `axes` → đỏ, nêu thiếu trục có thứ tự
- [ ] T5.2 **Ca âm `BR-STS-02`** — kỹ năng khai `match`, `relations` rỗng → đỏ, nêu thiếu quan hệ `pair`
- [ ] T5.3 **Ca âm `BR-STS-03`** — trục phân loại có nhóm chỉ 1 item → đỏ
- [ ] T5.4 **Ca âm `count`** — kỹ năng khai `count`, 0 item có `value` → đỏ
- [ ] T5.5 **Ca âm `sequence`** — `ordering` đúng bằng `items.map(id)` theo thứ tự khai và không có quan hệ `sequence` → đỏ
- [ ] T5.6 **Ca âm `deduce`** — chỉ có 1 trục `axes` → đỏ (luật đòi ≥2 trục **và** quan hệ `subset`)
- [ ] T5.7 **Ca âm `listen`** — có item thiếu `audio_path` → đỏ
- [ ] T5.8 **Ca âm `BR-STS-09` chiều giảm** — bớt một prompt phân biệt → đỏ
- [ ] T5.9 **Ca dương `BR-STS-09` chiều tăng** — thêm một prompt phân biệt → **xanh**, không đỏ
- [ ] T5.10 **Ca âm `BR-STS-11`** — nợ tăng từ 300 lên 301 → đỏ, liệt kê đúng mã kỹ năng mới rơi vào nợ
- [ ] T5.11 Mỗi ca âm chạy độc lập, không phụ thuộc thứ tự

## L6 — Phán quyết bốn trường

- [ ] T6.1 Ghi bảng phán quyết mục 7.3 của spec vào `skill-dataset-model.md` dưới dạng liên kết, không copy
- [ ] T6.2 Xoá `success_message` khỏi `SkillPhrasing` (`packages/shared/src/skill-dataset-types.ts`)
- [ ] T6.3 Xoá `hint_message` khỏi `SkillPhrasing`
- [ ] T6.4 Codemod dựa trên AST xoá hai trường khỏi 443 file; Cấm — NEVER dùng `sed` mù
- [ ] T6.5 Đọc diff từng file sau codemod; `pnpm test` trước và sau phải cùng kết quả
- [ ] T6.6 Một lần ghi lại `skill_datasets.phrasing` dọn dữ liệu cũ trong DB
- [ ] T6.7 Giữ `ladder`, `narration_template`, `extends`, `skill_dataset_id` — ghi lý do giữ và task nối chúng

## L7 — Chốt số

- [ ] T7.1 Chạy `pnpm check:thinking-structure --update`, chốt baseline
- [ ] T7.2 Đo lại M5: 0 kỹ năng `deduce` bị ép thành `observe`
- [ ] T7.3 Đo lại M7: 4 trường 0 consumer giảm còn 2 (`ladder`, `narration_template` — có task nối)
- [ ] T7.4 Đo lại M8: `axes` ghi được xuống DB
- [ ] T7.5 `pnpm check` xanh; `pnpm typecheck` không thêm nợ
- [ ] T7.6 Xác nhận `pnpm db:seed` chạy hết không đỏ

---

## Chưa làm trong task này

- Soạn lại nội dung dataset: `C1` ở task `#267`; `C2`–`C6` chờ lát cắt sau.
- Nối `ladder` vào `packages/adaptive/src/level-params.ts` — chờ câu hỏi mở 1 của spec.
- Sửa `skill-template-affinity` theo `BR-STS-10` — chờ câu hỏi mở 3 của spec.
- Nâng `relations` và `axes` thành bắt buộc trong type — chỉ khi `total_unproven_skills` về 0.
