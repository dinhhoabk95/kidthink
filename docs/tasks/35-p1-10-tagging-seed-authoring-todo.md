# Checklist — Task #35: P1.10 — Gắn tag nội dung & seeder nội dung nền

> Kế hoạch: [`35-p1-10-tagging-seed-authoring-plan.md`](35-p1-10-tagging-seed-authoring-plan.md).
> **Đường găng dài nhất của MVP** — chặn bởi năng lực đọc review của người, không bởi tốc độ gõ.
> Ranh giới cứng: AI **soạn file**, chỉ **người** merge. Không LLM nào chạy trong hệ thống.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.2 đã đóng** — sáu `content_contract` ổn định.
- [ ] **P0.9 đã đóng** — ≥690 LO, 230 skill, `emoji_registry` có dữ liệu.
- [ ] **P0.6 đã đóng** — checklist publish ở **tầng service**, không chỉ ở route.
- [ ] Human approve kế hoạch và bảy quyết định D-GZ · D-HA · D-HB · D-HC · D-HD · D-HE · D-HF.
- [ ] Đối chiếu `BR-TAG-*` `BR-CSA-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Xác nhận có người review đủ chuyên môn sư phạm.
- [ ] Tạo nhánh riêng.

---

### Task 1 — Đối chiếu từ vựng × 230 skill (làm **trước** mọi việc khác)

- [ ] Bảng: mỗi skill → tag `what` khả dĩ.
- [ ] Bảng: mỗi skill → tag `thinking` khả dĩ.
- [ ] Tính **% phủ** của từ vựng hiện tại.
- [ ] Liệt kê giá trị cần thêm (nếu có).
- [ ] Giá trị thêm vào seed Lớp 1 qua **PR riêng** có người duyệt.
- [ ] Ghi kết quả vào file này — đóng §11 Q1 của tagging.

### Task 2 — Từ vựng tag và bản đồ skill

- [ ] Seed `content_tags`: 14 `what` · 12 `thinking` · 6 `mechanic` · 12 `theme`.
- [ ] `BR-TAG-01` ca âm: gắn `fun_stuff` → **422**.
- [ ] `BR-TAG-02` publish thiếu tag một trục sư phạm → chặn.
- [ ] `theme` **không** nằm trong ràng buộc `BR-TAG-02` (`D-HB`).
- [ ] `mechanic` suy từ `game_templates.mechanic`; ca âm nhập tay lệch → đỏ.
- [ ] `BR-TAG-03` `weight ∈ [0,1]`.
- [ ] `BR-TAG-04` ca âm: hai skill cùng `weight = 1.0` → 422.
- [ ] `BR-TAG-05` ca âm: `GET /api/guest/tags` không trả `user_tags`.
- [ ] `BR-TAG-07` integration test bắt **orphan** trong `content_tag_map`.
- [ ] `BR-TAG-06` không đường nào tự gắn tag — AI đề xuất, người xác nhận.
- [ ] `GET /api/guest/tags` cache `public, max-age=3600`.

### Task 3 — Hình dạng seeder và provenance

- [ ] `ContentSeed<"GT-00x">` lấy kiểu từ `content_contract`.
- [ ] `BR-CSA-12` ca âm: thiếu field → lỗi **`tsc`**, không phải runtime.
- [ ] Bố cục `seed-content/c1..c6/gt-00x.ts` theo competency × template.
- [ ] `content_seed_batches` đủ field §7.4 (gồm `git_sha`, `pr_url`, `approved_by_manager_id`, `gate_results`).
- [ ] Cột `origin ∈ {human, ai_assisted}`.
- [ ] Cột `authored_in ∈ {repo_seed, studio}`.
- [ ] `seed_batch_id` nullable.
- [ ] Ca âm: `origin` không đổi sau khi người sửa.
- [ ] Không cột `ai_generated`, không bảng `content_generation_runs`.
- [ ] `BR-CSA-10` ca âm: đổi `code` đã seed → cổng 0 đỏ.

### Task 4 — Tám cổng (mỗi cổng một ca âm)

- [ ] `T4a` (M): cổng 0–3 + fail-before-DB, một PR và fixture âm từng cổng.
- [ ] `T4b` (M): cổng 4–5 + ca band tuổi âm, một PR.
- [ ] `T4c` (M): cổng 6–7 + blocklist + nhãn heuristic/stop-first, một PR.
- [ ] T4a → T4b → T4c; package trước xanh mới mở package sau.
- [ ] Cổng 0 **Định danh** — `code` duy nhất, đúng format, không đụng version cũ.
- [ ] Ca âm cổng 0: hai file cùng `code` → fail **trước khi mở kết nối DB**.
- [ ] Cổng 1 **Schema** — Zod thật, còn đủ `refine`, cả hai contract.
- [ ] Cổng 2 **Cấu trúc** — ≥1 đáp án đúng · prompt không rỗng · trong `limits` · không đáp án trùng.
- [ ] Cổng 3 **Asset** — emoji ref có trong registry; `image_path` resolve được.
- [ ] Cổng 4 **Ngôn ngữ** *(heuristic)* — câu ≤12 từ · từ vựng 3–6 tuổi · không từ cấm · không lỗi dấu.
- [ ] Cổng 5 **Sư phạm** — FK skill/LO thật · tuổi ∈ [3,6] · `difficulty ∈ [1,5]` · mechanic hợp band.
- [ ] Ca âm cổng 5: `GT-006` với `age_min = 3` → fail.
- [ ] Cổng 6 **Trùng lặp** *(heuristic)* — chuẩn hoá rồi so với bản `published`.
- [ ] Cổng 7 **An toàn** *(heuristic)* — dùng `packages/moderation/src/child-content-blocklist.ts`.
- [ ] Seed blocklist Lớp 1 đủ nhóm §7.5.
- [ ] Báo cáo in `file:line` + nhãn `xác định`/`heuristic` (`D-HA`).
- [ ] Trượt cổng nào → dừng ở đó, PR không merge được.

### Task 5 — Ba lệnh CLI và đường ghi

- [ ] `T5a` (M): `seed:check` + dry-run/rollback, không persistent write.
- [ ] `T5b` (M): transaction + INSERT/version/archive + review log + idempotency.
- [ ] `T5c` (M): against-db/report + studio conflict + agent/request guards.
- [ ] T5a → T5b → T5c; mỗi package có negative test RED và PR riêng.
- [ ] `pnpm seed:check` — 8 cổng, **không chạm DB**.
- [ ] `pnpm seed:content --dry-run` — DB tạm → seed → checklist → rollback.
- [ ] `pnpm seed:content --batch=SEED-*` — ghi thật.
- [ ] `BR-CSA-05` một batch = một transaction; cấm seed một phần.
- [ ] `BR-CSA-01` ca âm: sửa `content_pack` giữ nguyên version → thoát ≠ 0, DB không đổi.
- [ ] Khai version mới → INSERT bản mới + archive bản cũ trong **một** transaction.
- [ ] `BR-CSA-02` ghi thẳng `published`, không qua `draft`/`in_review`.
- [ ] `BR-CSA-03` mỗi hàng có `content_review_log` với `actor_manager_id` = người approve PR.
- [ ] `checklist_snapshot` chứa kết quả đủ 8 cổng.
- [ ] `BR-CSA-04` ca âm: một bản thiếu LO → **rollback cả batch**, nêu `code`.
- [ ] `BR-CSA-06` chạy lại → `rows_inserted = 0`, không UPDATE hàng nào.
- [ ] `BR-CSA-11` `seed:check --against-db` chạy trong cổng tự động; drift → **đỏ**.
- [ ] `pnpm seed:report` in phủ theo competency · skill · template + khoảng trống.
- [ ] Xung đột với bản studio cùng `code` → seed **từ chối**, studio thắng.
- [ ] `BR-CSA-07` ca âm: AI agent không chạy được `seed:content` ngoài local.
- [ ] `BR-CSA-07` ca âm: AI agent không merge được PR.
- [ ] `BR-CSA-08` ca âm: AI agent không chạm `skills`/`strands`.
- [ ] Ca âm: không đường request nào gọi seed.

### Task 6 — Lô mẫu và đo tốc độ review

- [ ] Một lô **≤30 bản** đi hết: soạn → `seed:check` → PR → review → merge → `seed:content`.
- [ ] `BR-CSA-09` LO (nếu có trong lô) chịu đúng 8 cổng và PR review.
- [ ] Ghi số: **số bản** trong lô.
- [ ] Ghi số: **số phút review thật**.
- [ ] Ghi số: **số lỗi người bắt được** sau khi cổng heuristic đã xanh.
- [ ] PR template có dòng: cổng 4, 6, 7 là heuristic, không thay mắt người.
- [ ] Người review mở **từng bản**, không approve theo lô mù.

## Cổng dừng

- [ ] Tám cổng đều đã **đỏ** trên fixture riêng.
- [ ] Seed chạy lại là no-op; sửa bản `published` bị từ chối.
- [ ] Trượt checklist → rollback cả batch.
- [ ] `--against-db` bắt được drift cố ý trong cổng tự động.
- [ ] Không đường nào cho AI merge hay seed ngoài local.
- [ ] Ba số đo review đã ghi lại.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 7 — Evidence và promote

- [ ] Mỗi `BR-TAG-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-CSA-*` có test tham chiếu mã rule.
- [ ] [`content-tagging.md`](../specs/01-platform/content-tagging.md) → `implemented`.
- [ ] [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) → `implemented`.
- [ ] Ba số `D-HE` + khảo sát port v1 (P1.2 T1) bàn giao cho kế hoạch **P1.11**.
- [ ] Tick **P1.10** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] `weight` do người đặt hay suy từ mức khớp LO — **P3**.
