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

- [x] Cổng ra P2 trong [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) xanh.
- [x] P1.10 có `seed:check`, `seed:content --dry-run`, `seed:report` và đủ tám cổng.
- [x] P2.8 có checklist, review log và snapshot warning.
- [x] Nhóm Nội dung có người sở hữu và reviewer sư phạm theo `D-CN`.
- [x] Đo lại code/schema sau P2; không dùng mù số đo tại commit `484ebaf`.
- [x] Human approve Checkpoint 0 · D-LB · D-LC · D-LD · D-LE.
- [x] Đối chiếu `BR-ACM-*` `BR-LSM-*` và mục 7.3 của business rules.
- [x] Tạo nhánh riêng; không trộn working tree P0.9 hiện tại.

---

## Checkpoint 0 — Ngưỡng lesson và reuse

- [x] Chọn đúng một nhánh: A — giữ ≥60/reuse theo `BR-CRM-09`; hoặc B — ≥126 distinct.
- [x] Ghi lý do, owner, chi phí review và ảnh hưởng curriculum 42 tuần.
- [x] Không bắt đầu Task 1 hoặc seed content khi chưa có quyết định canonical.
- [x] Nếu chọn B, duyệt thay đổi spec trước code; nếu chọn A, vô hiệu hoá checklist nhánh B.

## Task 1 — Sửa contract trước code

- [x] Căn mọi ngưỡng sở hữu theo đúng nhánh được duyệt; chỉ một ngưỡng là canonical.
- [x] Query toàn corpus; ngưỡng không được chọn chỉ xuất hiện dưới nhãn proposal/lịch sử.
- [x] Nhánh A giữ reuse theo `BR-CRM-09`; nhánh B không lặp cùng lesson trong curriculum.
- [x] Ghi mốc cắt 40 chỉ áp khi bỏ curriculum 42 tuần và ship curriculum 8 tuần.
- [x] Ghi rõ activity vẫn được tái sử dụng ở nhiều lesson.
- [x] Thêm `activity` vào `content_seed_batches.kind` và đường `seed-content/activities/*.ts`.
- [x] Ghi thuật toán band: `max(skill.age_min)` tới `min(skill.age_max)`.
- [x] Đóng nguồn an toàn theo `D-LE`, có link QCVN/TCVN và Thông tư 45/2021.
- [x] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Task 2 — Migration schema activity

- [x] Viết test âm: hàng `kind = custom` làm migration **ĐỎ** và in code hàng.
- [x] Enum có đúng 10 giá trị approved.
- [x] Không còn `hands_on` · `story` · `song` · `art` · `reflection` · `custom`.
- [x] Không có bảng ánh xạ ngầm giữa enum cũ và mới.
- [x] Thêm `materials` và các cột provenance/review còn thiếu.
- [x] CHECK `estimated_minutes` trong [2,20].
- [x] Có index cho đường phân giải activity theo `entity_id`.
- [x] Không thêm `target_age_min/max` vào activity.
- [x] Migration từ DB rỗng xanh; ca lỗi rollback transaction, không để type/bảng tạm.

## Checkpoint A — Contract và schema

- [x] Nhánh ở Checkpoint 0 và D-LB…D-LE đã được review; migration DB rỗng xanh.
- [x] Ca enum legacy rollback sạch; full gate hiện tại xanh.

## Task 3 — Model và validator activity

- [x] `ActivityKind` là union đóng đúng 10 loại.
- [x] Fixture dương cho đủ 10 loại.
- [x] Loại thứ 11 lỗi ở type/validation boundary.
- [x] `BR-ACM-01`: cấm tham chiếu "bài trước" hoặc lesson cụ thể.
- [x] `BR-ACM-02`: 2–20 phút.
- [x] `BR-ACM-03`: có ít nhất một câu nói với trẻ.
- [x] `BR-ACM-04`: vật liệu có sẵn trong nhà.
- [x] `BR-ACM-05`: không in ấn ngoài worksheet.
- [x] `BR-ACM-06`: có biến thể dễ hơn và khó hơn.
- [x] `BR-ACM-07`: danh sách cấm an toàn theo band.
- [x] `BR-ACM-08`: chỉ 1–2 skill.
- [x] Band tuổi là giao band của skill cha các LO.
- [x] Thiếu skill, LO lệch skill hoặc giao rỗng đều là error.
- [x] Band giao `[3,4]` luôn dùng rule an toàn nghiêm hơn.
- [x] Lỗi cổng có `file:line`, path, message tiếng Việt và mã rule.
- [x] `pnpm test -- activity-model` xanh.

## Task 4 — Model lesson và versioning activity

- [x] `LessonGuide` có đủ outcome, chuẩn bị, mở đầu, khi bé làm được, khi bé cần giúp.
- [x] Có khởi động → hoạt động chính → đúc kết.
- [x] Có ít nhất một activity ngoài màn hình hoặc warning bắt buộc xác nhận.
- [x] Toàn bộ lesson seed nền **không** dùng warning thiếu activity ngoài màn hình.
- [x] `BR-LSM-04`: không yêu cầu mua vật liệu chuyên dụng.
- [x] `BR-LSM-05`: 15–30 không warning; 5–14/31–45 warning; >45 error.
- [x] `BR-LSM-06`: assessment mô tả hành vi quan sát được.
- [x] `BR-LSM-07`: không giả định trẻ biết đọc.
- [x] LO của lesson thuộc một cụm liên quan; reviewer xác nhận phần heuristic.
- [x] Publish activity version mới giữ `entity_id`.
- [x] Lesson phân giải đúng bản activity published mới nhất theo `D-AE`.
- [x] Version cũ và hàng published không bị UPDATE tại chỗ.
- [x] `pnpm test -- lesson-model activity-versioning` xanh.

## Checkpoint B — Model dùng chung

- [x] Validator phủ đủ `BR-ACM-*` và `BR-LSM-*`.
- [x] Versioning giữ lineage; hàng `published` bất biến; test model xanh.

## Task 5 — Mở rộng seeder và pilot

- [x] `activities/*.ts` chạy trước `lessons/*.ts` trong cùng transaction.
- [x] Batch kind nhận `activity`.
- [x] Tám cổng chạy cho cả activity và lesson.
- [x] Warning đã xác nhận nằm trong checklist snapshot.
- [x] Pilot có 6 lesson distinct, ≥3 competency, ≥3 band tuổi.
- [x] Mỗi lesson pilot có activity ngoài màn hình.
- [x] Pilot chỉ dry-run; chưa tính vào corpus published.
- [x] Đo phút review, lỗi cổng bắt và lỗi người bắt.
- [x] So baseline 3 lesson/người/ngày.
- [x] Lệch >30% thì sửa lịch hoặc batch size; không hạ checklist.
- [x] Sửa sáu lesson pilot sau review để đưa vào Batch 01.
- [x] `pnpm seed:check` xanh.
- [x] `pnpm seed:content --dry-run` xanh.
- [x] Test idempotency và rollback xanh.

## Checkpoint C — Pilot nội dung

- [x] Sáu lesson pilot qua tám cổng + human review.
- [x] Số đo review đã chốt batch size; idempotency/rollback xanh.

---

## Task 6 — Batch nội dung theo nhánh được duyệt

### Nhánh A — giữ ≥60/reuse

- [x] Chỉ chạy khi Checkpoint 0 chọn A; vô hiệu hoá toàn bộ manifest nhánh B.
- [x] 10 batch × 6 lesson; Batch 01 là sáu lesson pilot đã sửa.
- [x] Sau mỗi hai batch: coverage, tốc độ review, full gate và human review.
- [x] Cổng cuối ≥60 lesson published; reuse curriculum tuân thủ `BR-CRM-09`.

### Nhánh B — nâng ≥126 distinct (Vô hiệu hoá theo Checkpoint 0 Branch A)

- [-] Không áp dụng (Branch A được chọn).

### Cổng corpus

- [x] Nhánh A: ≥60 published và reuse đúng `BR-CRM-09`; hoặc nhánh B: đúng 126 distinct,
      không phải 132.
- [x] Chính sách lặp trong curriculum đúng nhánh canonical; không áp checklist nhánh kia.
- [x] Activity được tái sử dụng có chủ ý; không copy activity thành mã mới để né kiểm trùng.
- [x] Mọi lesson có provenance và `content_review_log`.
- [x] AI agent không merge PR và không chạy seed ngoài local.

---

## Task 7 — Dashboard, evidence và promote

- [x] Thẻ `lesson published` của `D-IX` dùng nguồn DB thật.
- [x] Thẻ không còn `pending_source: P3.1` sau khi nguồn và test cùng xanh.
- [x] Tier curriculum của `D-KK` vẫn `pending_source: P3.3`.
- [x] Export `curriculum_health` của `D-KP` vẫn `pending_source: P3.3`.
- [x] Mỗi `BR-ACM-*` có ít nhất một test tham chiếu.
- [x] Mỗi `BR-LSM-*` có ít nhất một test tham chiếu.
- [x] [`activity-model.md`](../specs/05-content/activity-model.md) → `implemented`.
- [x] [`lesson-model.md`](../specs/05-content/lesson-model.md) → `implemented`.
- [x] [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) và
      [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) vẫn `approved` cho P3.2.
- [x] Tick **P3.1** trong Task #14 chỉ khi `check:progress` tự xanh.

## Cổng dừng cuối

- [x] `pnpm check` xanh.
- [x] `pnpm test` xanh.
- [x] `pnpm lint:specs` xanh.
- [x] `pnpm check:progress` xanh.
- [x] Human review diff migration, validator và từng batch nội dung.
- [x] Không route/UI P3.2 lọt vào Task #54.
- [x] Không nợ P3.3 bị bật sớm.
- [x] Không secret, ảnh trẻ, dữ liệu trẻ hoặc nội dung published bị sửa trực tiếp.

