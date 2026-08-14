# Checklist — Task #54: P3.1 — Mô hình activity, lesson và thư viện nền

> Kế hoạch: [`54-p3-1-lesson-activity-plan.md`](54-p3-1-lesson-activity-plan.md).
> Task này chỉ bắt đầu khi cổng ra P2 xanh. Tuyệt đối: không ánh xạ enum legacy bằng phỏng đoán,
> không tự chọn ngưỡng/reuse lesson, không để cổng máy thay người review, không chạy seed ngoài
> local.
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] Cổng ra P2 trong [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) xanh.
- [ ] P1.10 có `seed:check`, `seed:content --dry-run`, `seed:report` và đủ tám cổng.
- [ ] P2.8 có checklist, review log và snapshot warning.
- [ ] Nhóm Nội dung có người sở hữu và reviewer sư phạm theo `D-CN`.
- [ ] Đo lại code/schema sau P2; không dùng mù số đo tại commit `484ebaf`.
- [ ] Human approve Checkpoint 0 · D-LB · D-LC · D-LD · D-LE.
- [ ] Đối chiếu `BR-ACM-*` `BR-LSM-*` và mục 7.3 của business rules.
- [ ] Tạo nhánh riêng; không trộn working tree P0.9 hiện tại.

---

## Checkpoint 0 — Ngưỡng lesson và reuse

- [ ] Chọn đúng một nhánh: A — giữ ≥60/reuse theo `BR-CRM-09`; hoặc B — ≥126 distinct.
- [ ] Ghi lý do, owner, chi phí review và ảnh hưởng curriculum 42 tuần.
- [ ] Không bắt đầu Task 1 hoặc seed content khi chưa có quyết định canonical.
- [ ] Nếu chọn B, duyệt thay đổi spec trước code; nếu chọn A, vô hiệu hoá checklist nhánh B.

## Task 1 — Sửa contract trước code

- [ ] Căn mọi ngưỡng sở hữu theo đúng nhánh được duyệt; chỉ một ngưỡng là canonical.
- [ ] Query toàn corpus; ngưỡng không được chọn chỉ xuất hiện dưới nhãn proposal/lịch sử.
- [ ] Nhánh A giữ reuse theo `BR-CRM-09`; nhánh B không lặp cùng lesson trong curriculum.
- [ ] Ghi mốc cắt 40 chỉ áp khi bỏ curriculum 42 tuần và ship curriculum 8 tuần.
- [ ] Ghi rõ activity vẫn được tái sử dụng ở nhiều lesson.
- [ ] Thêm `activity` vào `content_seed_batches.kind` và đường `seed-content/activities/*.ts`.
- [ ] Ghi thuật toán band: `max(skill.age_min)` tới `min(skill.age_max)`.
- [ ] Đóng nguồn an toàn theo `D-LE`, có link QCVN/TCVN và Thông tư 45/2021.
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Task 2 — Migration schema activity

- [ ] Viết test âm: hàng `kind = custom` làm migration **ĐỎ** và in code hàng.
- [ ] Enum có đúng 10 giá trị approved.
- [ ] Không còn `hands_on` · `story` · `song` · `art` · `reflection` · `custom`.
- [ ] Không có bảng ánh xạ ngầm giữa enum cũ và mới.
- [ ] Thêm `materials` và các cột provenance/review còn thiếu.
- [ ] CHECK `estimated_minutes` trong [2,20].
- [ ] Có index cho đường phân giải activity theo `entity_id`.
- [ ] Không thêm `target_age_min/max` vào activity.
- [ ] Migration từ DB rỗng xanh; ca lỗi rollback transaction, không để type/bảng tạm.

## Checkpoint A — Contract và schema

- [ ] Nhánh ở Checkpoint 0 và D-LB…D-LE đã được review; migration DB rỗng xanh.
- [ ] Ca enum legacy rollback sạch; full gate hiện tại xanh.

## Task 3 — Model và validator activity

- [ ] `ActivityKind` là union đóng đúng 10 loại.
- [ ] Fixture dương cho đủ 10 loại.
- [ ] Loại thứ 11 lỗi ở type/validation boundary.
- [ ] `BR-ACM-01`: cấm tham chiếu "bài trước" hoặc lesson cụ thể.
- [ ] `BR-ACM-02`: 2–20 phút.
- [ ] `BR-ACM-03`: có ít nhất một câu nói với trẻ.
- [ ] `BR-ACM-04`: vật liệu có sẵn trong nhà.
- [ ] `BR-ACM-05`: không in ấn ngoài worksheet.
- [ ] `BR-ACM-06`: có biến thể dễ hơn và khó hơn.
- [ ] `BR-ACM-07`: danh sách cấm an toàn theo band.
- [ ] `BR-ACM-08`: chỉ 1–2 skill.
- [ ] Band tuổi là giao band của skill cha các LO.
- [ ] Thiếu skill, LO lệch skill hoặc giao rỗng đều là error.
- [ ] Band giao `[3,4]` luôn dùng rule an toàn nghiêm hơn.
- [ ] Lỗi cổng có `file:line`, path, message tiếng Việt và mã rule.
- [ ] `pnpm test -- activity-model` xanh.

## Task 4 — Model lesson và versioning activity

- [ ] `LessonGuide` có đủ outcome, chuẩn bị, mở đầu, khi bé làm được, khi bé cần giúp.
- [ ] Có khởi động → hoạt động chính → đúc kết.
- [ ] Có ít nhất một activity ngoài màn hình hoặc warning bắt buộc xác nhận.
- [ ] Toàn bộ lesson seed nền **không** dùng warning thiếu activity ngoài màn hình.
- [ ] `BR-LSM-04`: không yêu cầu mua vật liệu chuyên dụng.
- [ ] `BR-LSM-05`: 15–30 không warning; 5–14/31–45 warning; >45 error.
- [ ] `BR-LSM-06`: assessment mô tả hành vi quan sát được.
- [ ] `BR-LSM-07`: không giả định trẻ biết đọc.
- [ ] LO của lesson thuộc một cụm liên quan; reviewer xác nhận phần heuristic.
- [ ] Publish activity version mới giữ `entity_id`.
- [ ] Lesson phân giải đúng bản activity published mới nhất theo `D-AE`.
- [ ] Version cũ và hàng published không bị UPDATE tại chỗ.
- [ ] `pnpm test -- lesson-model activity-versioning` xanh.

## Checkpoint B — Model dùng chung

- [ ] Validator phủ đủ `BR-ACM-*` và `BR-LSM-*`.
- [ ] Versioning giữ lineage; hàng `published` bất biến; test model xanh.

## Task 5 — Mở rộng seeder và pilot

- [ ] `activities/*.ts` chạy trước `lessons/*.ts` trong cùng transaction.
- [ ] Batch kind nhận `activity`.
- [ ] Tám cổng chạy cho cả activity và lesson.
- [ ] Warning đã xác nhận nằm trong checklist snapshot.
- [ ] Pilot có 6 lesson distinct, ≥3 competency, ≥3 band tuổi.
- [ ] Mỗi lesson pilot có activity ngoài màn hình.
- [ ] Pilot chỉ dry-run; chưa tính vào corpus published.
- [ ] Đo phút review, lỗi cổng bắt và lỗi người bắt.
- [ ] So baseline 3 lesson/người/ngày.
- [ ] Lệch >30% thì sửa lịch hoặc batch size; không hạ checklist.
- [ ] Sửa sáu lesson pilot sau review để đưa vào Batch 01.
- [ ] `pnpm seed:check` xanh.
- [ ] `pnpm seed:content --dry-run` xanh.
- [ ] Test idempotency và rollback xanh.

## Checkpoint C — Pilot nội dung

- [ ] Sáu lesson pilot qua tám cổng + human review.
- [ ] Số đo review đã chốt batch size; idempotency/rollback xanh.

---

## Task 6 — Batch nội dung theo nhánh được duyệt

### Nhánh A — giữ ≥60/reuse

- [ ] Chỉ chạy khi Checkpoint 0 chọn A; vô hiệu hoá toàn bộ manifest nhánh B.
- [ ] 10 batch × 6 lesson; Batch 01 là sáu lesson pilot đã sửa.
- [ ] Sau mỗi hai batch: coverage, tốc độ review, full gate và human review.
- [ ] Cổng cuối ≥60 lesson published; reuse curriculum tuân thủ `BR-CRM-09`.

### Nhánh B — nâng ≥126 distinct

- [ ] Chỉ chạy khi Checkpoint 0 chọn B và canonical specs đã được duyệt.

Quy trình cho **mỗi** batch:

- [ ] Đúng 7 lesson mới; code bất biến, không trùng hoặc gần-trùng.
- [ ] Guide đủ năm phần; assessment quan sát được.
- [ ] Mỗi lesson có activity ngoài màn hình.
- [ ] Skill/LO tồn tại; band suy ra không rỗng.
- [ ] Vật liệu qua cổng an toàn.
- [ ] Reviewer sư phạm mở và đọc từng lesson.
- [ ] Ghi người duyệt và checklist snapshot.
- [ ] `seed:check` và dry-run riêng batch xanh.

### Batch 01–03 — 21 lesson đầu

- [ ] `SEED-LESSON-01` — 6 lesson pilot đã sửa + 1 lesson mới.
- [ ] `SEED-LESSON-02` — 7 lesson.
- [ ] `SEED-LESSON-03` — 7 lesson.
- [ ] Checkpoint 1: đủ 21, đo tốc độ review, báo cáo phủ, full gate, human review.

### Batch 04–06 — 42 lesson

- [ ] `SEED-LESSON-04` — 7 lesson.
- [ ] `SEED-LESSON-05` — 7 lesson.
- [ ] `SEED-LESSON-06` — 7 lesson.
- [ ] Checkpoint 2: đủ 42, đo tốc độ review, báo cáo phủ, full gate, human review.

### Batch 07–09 — 63 lesson

- [ ] `SEED-LESSON-07` — 7 lesson.
- [ ] `SEED-LESSON-08` — 7 lesson.
- [ ] `SEED-LESSON-09` — 7 lesson.
- [ ] Checkpoint 3: đủ 63, đo tốc độ review, báo cáo phủ, full gate, human review.

### Batch 10–12 — 84 lesson

- [ ] `SEED-LESSON-10` — 7 lesson.
- [ ] `SEED-LESSON-11` — 7 lesson.
- [ ] `SEED-LESSON-12` — 7 lesson.
- [ ] Checkpoint 4: đủ 84, đo tốc độ review, báo cáo phủ, full gate, human review.

### Batch 13–15 — 105 lesson

- [ ] `SEED-LESSON-13` — 7 lesson.
- [ ] `SEED-LESSON-14` — 7 lesson.
- [ ] `SEED-LESSON-15` — 7 lesson.
- [ ] Checkpoint 5: đủ 105, đo tốc độ review, báo cáo phủ, full gate, human review.

### Batch 16–18 — 126 lesson

- [ ] `SEED-LESSON-16` — 7 lesson.
- [ ] `SEED-LESSON-17` — 7 lesson.
- [ ] `SEED-LESSON-18` — 7 lesson.
- [ ] Checkpoint 6: đủ 126, đo tốc độ review, báo cáo phủ, full gate, human review.

### Cổng corpus

- [ ] Nhánh A: ≥60 published và reuse đúng `BR-CRM-09`; hoặc nhánh B: đúng 126 distinct,
      không phải 132.
- [ ] Chính sách lặp trong curriculum đúng nhánh canonical; không áp checklist nhánh kia.
- [ ] Activity được tái sử dụng có chủ ý; không copy activity thành mã mới để né kiểm trùng.
- [ ] Mọi lesson có provenance và `content_review_log`.
- [ ] AI agent không merge PR và không chạy seed ngoài local.

---

## Task 7 — Dashboard, evidence và promote

- [ ] Thẻ `lesson published` của `D-IX` dùng nguồn DB thật.
- [ ] Thẻ không còn `pending_source: P3.1` sau khi nguồn và test cùng xanh.
- [ ] Tier curriculum của `D-KK` vẫn `pending_source: P3.3`.
- [ ] Export `curriculum_health` của `D-KP` vẫn `pending_source: P3.3`.
- [ ] Mỗi `BR-ACM-*` có ít nhất một test tham chiếu.
- [ ] Mỗi `BR-LSM-*` có ít nhất một test tham chiếu.
- [ ] [`activity-model.md`](../specs/05-content/activity-model.md) → `implemented`.
- [ ] [`lesson-model.md`](../specs/05-content/lesson-model.md) → `implemented`.
- [ ] [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) và
      [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) vẫn `approved` cho P3.2.
- [ ] Tick **P3.1** trong Task #14 chỉ khi `check:progress` tự xanh.

## Cổng dừng cuối

- [ ] `pnpm check` xanh.
- [ ] `pnpm test` xanh.
- [ ] `pnpm lint:specs` xanh.
- [ ] `pnpm check:progress` xanh.
- [ ] Human review diff migration, validator và từng batch nội dung.
- [ ] Không route/UI P3.2 lọt vào Task #54.
- [ ] Không nợ P3.3 bị bật sớm.
- [ ] Không secret, ảnh trẻ, dữ liệu trẻ hoặc nội dung published bị sửa trực tiếp.
