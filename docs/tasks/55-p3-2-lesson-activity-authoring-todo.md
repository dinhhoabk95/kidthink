# Checklist — Task #55: P3.2 — Studio soạn lesson và activity

> Kế hoạch: [`55-p3-2-lesson-activity-authoring-plan.md`](55-p3-2-lesson-activity-authoring-plan.md).
> Task này chỉ bắt đầu khi cổng ra P2 xanh **và** P3.1 (`Task #54`) `implemented`.
> Tuyệt đối: không miễn cổng duyệt cho lesson, không viết mười form tay, không thêm route
> `DELETE` activity, không sinh nội dung trong Task #55, không chạy migration ngoài local.
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] Cổng ra P2 trong [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) xanh.
- [ ] P3.1 tick xong; [`lesson-model.md`](../specs/05-content/lesson-model.md) và
      [`activity-model.md`](../specs/05-content/activity-model.md) `implemented`.
- [ ] Validator dùng chung của P3.1 có `ActivityKind`, `ActivityInstruction`, `LessonGuide`,
      `ValidationResult` export được.
- [ ] Bảng `activities` đã có `origin`, `authored_in`, `created_by_manager_id`; thiếu thì sửa ở
      Task #54, không vá ở đây.
- [ ] Enum `activity_kind` đúng 10 giá trị approved; không còn giá trị legacy.
- [ ] P2.5 `zodIntrospect` + `configDictionary` chạy được; P2.6 autosave và `expected_version`
      đã ship; P2.8 hàng đợi, review log, checklist snapshot đã chạy cho game level.
- [ ] P1.11b [`content-search.md`](../specs/01-platform/content-search.md) có cursor và trần chung.
- [ ] Đo lại [`content.ts`](../../packages/db/src/schema/content.ts) và
      [`publish-checklist.ts`](../../packages/shared/src/publish-checklist.ts); ghi đè số đo mục 1
      của kế hoạch.
- [ ] Human approve `D-LF` · `D-LG` · `D-LH` · `D-LI` · `D-LJ` · `D-LK` · `D-LL` · `D-LM` ·
      `D-LN` · `D-LO` · `D-LP` · `D-LQ` · `D-LR`.
- [ ] `D-LH`, `D-LI`, `D-LJ` duyệt **riêng** — ba quyết định này sửa spec P0/P2.
- [ ] Nhánh riêng; không trộn working tree đang chạy.

---

## Task 1 — Sửa contract trước code

### 1a. Bảng "Bắt buộc" hỏng

- [ ] [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) §7.1: `Cấm` thành `Không`,
      ô rỗng thành `Có`.
- [ ] [`lesson-model.md`](../specs/05-content/lesson-model.md) §7.1: `Cấm khuyến nghị` và `Cấm`
      viết lại theo `D-LF`.
- [ ] [`lesson-model.md`](../specs/05-content/lesson-model.md) §7.3: đầu cột `Cấm Tránh` thành
      `Tránh`.
- [ ] [`legal-pages.md`](../specs/02-public/legal-pages.md) §7: ô rỗng thành `Có`.
- [ ] Sửa **tay từng ô**; không `sed` toàn corpus theo
      [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §11.6.
- [ ] Đọc lại diff từng dòng; tự hỏi chỗ nào đổi nghĩa.

### 1b. Khung lesson

- [ ] Bắt buộc: `title` · ≥1 LO · `target_age_min`/`max` · `estimated_minutes` · `guide`
      năm phần · ≥1 activity · `warm_up` · `reflection` · `assessment` · `access_tier` ·
      tag ba trục.
- [ ] `extension` tuỳ chọn theo `BR-LSM-09`.
- [ ] `materials` bắt buộc khi có activity khai vật liệu; phải bao được toàn bộ vật liệu đó.
- [ ] Mâu thuẫn cung bậc ở §7.1 đóng về phía `BR-LSM-01`; §7.1 và mục 10 `Always` nói cùng một điều.

### 1c. Thời lượng

- [ ] Ba đại lượng có tên riêng: `estimated_minutes` khai báo · `total_activity_minutes` suy ra ·
      trần sư phạm `BR-LSM-05`.
- [ ] Alt flow §5 của [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) đổi thành:
      cảnh báo ở 31–45, chặn ở trên 45.
- [ ] Khớp acceptance criteria §9 của [`lesson-model.md`](../specs/05-content/lesson-model.md).
- [ ] Ghi rõ lệch quá 5 phút giữa hai số là warning.
- [ ] CHECK DB `check_lessons_estimated_minutes` giữ nguyên.

### 1d. Checklist publish

- [ ] Thêm hàng `activities` vào
      [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.3 theo `D-LH`.
- [ ] Điều kiện tuổi hàng "Mọi" đổi thành band tuổi hiệu lực không rỗng, nằm trong `[3,6]`.
- [ ] Ghi rõ activity lấy band từ giao skill (`D-LC`), lesson và game level lấy từ cột.
- [ ] Bộ lọc `age` của activity ghi rõ là lọc trên band suy ra.

### 1e. Hàng đợi duyệt

- [ ] `BR-CRQ-02` mở rộng: lesson và activity dùng bản xem thử cho người dạy (`D-LI`).
- [ ] `BR-CRQ-07` sửa thành "đầy đủ bộ mục của họ thực thể, không rút gọn theo từng bản".
- [ ] Thêm bộ mục họ lesson/activity vào
      [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) §7.2.
- [ ] Ghi lại rule đang chặn gì trước và sau khi sửa; bản sửa vẫn chặn rút gọn tuỳ tiện.

### 1f. Route và tìm kiếm

- [ ] `PUT /api/managers/lessons/{code}/{version}/activities` thêm `expected_version`.
- [ ] Acceptance criteria "When xoá" của
      [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) đổi thành "When archive".
- [ ] `activities` vào entry point và bộ lọc của
      [`content-search.md`](../specs/01-platform/content-search.md).
- [ ] Bỏ trần 100 riêng; spec authoring chỉ viện dẫn trần chung.
- [ ] Ghi `GET .../teaching-view` vào §8 của
      [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md).
- [ ] Ghi rõ P3.2 dùng route transition chung, không thêm `/submit` (`D-LQ`).

### 1g. Phụ thuộc, cờ, rule dùng chung

- [ ] `depends_on: SCHEMA-DRIVEN-FORM` thêm vào
      [`activity-authoring.md`](../specs/06-admin/activity-authoring.md); kiểm không sinh chu trình.
- [ ] Cờ khoá `kind = worksheet` đăng ký ở
      [`feature-flags.md`](../specs/06-admin/feature-flags.md), mặc định tắt.
- [ ] Hai spec authoring viện dẫn `BR-STU-03` · `BR-STU-05` · `BR-STU-06` · `BR-STU-07` ·
      `BR-STU-08` · `BR-STU-09` và autosave 30 giây (`D-LP`).
- [ ] Phạm vi `BR-STU-01` mở rộng: studio lesson/activity cấm ghi `game_templates`, `skills`,
      `learning_objectives`.

### 1h. Cổng ra của Task 1

- [ ] Câu hỏi mở còn lại của bốn spec P3 đóng, hoặc hoãn kèm điều kiện mở lại đo được.
- [ ] Không thêm spec thứ 131.
- [ ] Không thêm mã lỗi ngoài [`error-codes.md`](../specs/00-foundation/error-codes.md).
- [ ] `pnpm --filter @mindkid/gates test` 0 lỗi, 0 cảnh báo mới.

## Task 1b — Cổng máy cho ô bảng nhị phân

- [ ] **Viết ca âm trước:** fixture có một ô `Cấm` và một ô rỗng làm cổng **ĐỎ**.
- [ ] Lỗi in `file:line` và tên cột.
- [ ] Kiểm tra mới trong [`lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts): cột tên đúng
      `Bắt buộc` chỉ nhận `Có`, `Không`, hoặc lượng từ dạng `≥n`.
- [ ] Chạy trên corpus: đúng bốn file ở mục 1.1 của kế hoạch đỏ **trước** T1.
- [ ] Sau T1 cả bốn xanh; không file nào khác đỏ oan.
- [ ] Không nới ca kiểm hiện có để đổi lấy cổng mới xanh.
- [ ] `pnpm test -- lint-specs` xanh.

## Checkpoint A — Contract

- [ ] T1 và T1b xanh; human đã đọc diff contract.
- [ ] Không migration, route hay UI nào viết trước checkpoint này.
- [ ] Mọi phụ thuộc ở §0.1 của kế hoạch `implemented`; nếu chưa thì **dừng**.

---

## Task 2 — Migration `lesson_activities`

- [ ] **Test âm trước:** lắp cùng một `activity_id` hai lần vào một lesson làm cổng **ĐỎ**.
- [ ] Unique `(lesson_id, activity_id)`.
- [ ] Index trên `lesson_activities.activity_id`.
- [ ] Đổi chỗ hai activity trong một transaction chạy được; test chứng minh không đụng khoá ở
      bước trung gian.
- [ ] Chọn một cách và ghi rõ: ràng buộc DEFERRABLE hoặc ghi lại toàn bộ danh sách.
- [ ] Không thêm khoá ngoại lên `activity_id` — giữ `entity_id` dòng dõi theo `D-AE`.
- [ ] `pnpm db:migrate` trên DB rỗng xanh.
- [ ] Ca lỗi rollback cả transaction, không để index hay constraint nửa vời.

## Task 3 — Checklist publish dùng chung

- [ ] Hàng `activities` thực thi trong
      [`publish-checklist.ts`](../../packages/shared/src/publish-checklist.ts).
- [ ] Seeder P3.1 và route P3.2 gọi **cùng một hàm**; test quét chứng minh không có bản thứ hai.
- [ ] `kind` hợp lệ.
- [ ] 2–20 phút.
- [ ] `instruction` đủ bốn phần: chuẩn bị, các bước, dễ hơn, khó hơn.
- [ ] ≥1 câu nói với trẻ.
- [ ] 1–2 skill.
- [ ] Vật liệu bắt buộc với kind ngoài màn hình.
- [ ] Qua cổng an toàn theo band suy ra.
- [ ] Ràng buộc riêng theo kind của
      [`activity-model.md`](../specs/05-content/activity-model.md) §7.2.
- [ ] `digital_game` trỏ level `published`.
- [ ] Band giao rỗng, LO lệch skill, thiếu skill đều là error kèm mã rule.
- [ ] 422 trả `details.missing[]`; không publish một phần.
- [ ] Mỗi mục có ca dương và ca âm.
- [ ] `pnpm test -- publish-checklist` xanh.

## Checkpoint B — Schema và checklist

- [ ] Migration quan hệ + publish checklist cùng xanh.
- [ ] Seeder và Studio dùng cùng validator; full gate hiện tại xanh.

## Task 4 — Route activity và schema theo `kind`

- [ ] `POST /api/managers/activities` nhận `{ kind }`, trả mã `ACT-####` sinh ở server.
- [ ] `PATCH` cần `expected_version`; lệch trả 409 `VERSION_CONFLICT`.
- [ ] Discriminated union Zod đủ mười kind.
- [ ] `zodIntrospect` suy widget từ quy ước tên field; không thêm bảng mapping (`BR-SDF-02`).
- [ ] Client và server dùng **cùng** schema (`BR-SDF-05`).
- [ ] Nhãn tiếng Việt đủ cho mọi field hiện ra (`BR-SDF-06`).
- [ ] Đổi `kind` sau khi điền: cảnh báo mất field, yêu cầu xác nhận.
- [ ] Dữ liệu không tương thích không âm thầm còn lại trong hàng sau khi đổi `kind`.
- [ ] `digital_game` trỏ level không `published` → 422 (`BR-ACA-02`).
- [ ] `worksheet` bị cờ khoá → 422 nêu rõ lý do MVP (`D-LN`).
- [ ] Bật cờ trong test: vẫn 422 vì bảng `worksheets` rỗng, không phải lỗi khác.
- [ ] Sửa activity `published` tạo version mới (`BR-ACA-07`); hàng cũ không bị `UPDATE`.
- [ ] Mọi thao tác ghi `audit_logs` (`BR-STU-05`).
- [ ] `pnpm test -- activity-authoring` xanh, phủ đủ mười kind.

## Task 5 — Route lesson và lắp activity nguyên tử

- [ ] `POST /api/managers/lessons` trả mã `LES-####` sinh ở server.
- [ ] `PATCH` cần `expected_version`.
- [ ] `PUT .../activities` ghi lại toàn bộ danh sách trong một transaction.
- [ ] `expected_version` lệch → 409 `VERSION_CONFLICT`.
- [ ] **Race test:** hai request sắp xếp đồng thời → đúng một thành công, không trạng thái lai.
- [ ] Lắp cùng một activity hai lần → 422.
- [ ] Kéo activity thứ ba lên vị trí một: `position` đúng, tổng thời lượng không đổi.
- [ ] Lesson rỗng không gửi duyệt được (`BR-LSA-01`).
- [ ] Lesson trỏ activity `draft` → 422 nêu tên activity (`BR-LSA-03`).
- [ ] `guide` rỗng → 422 (`BR-LSA-04`).
- [ ] Phân giải activity theo bản `published` mới nhất qua `entity_id` (`D-AE`).
- [ ] Publish version mới của activity: mọi lesson dùng nó thấy bản mới (`BR-LSA-05`).
- [ ] Sửa lesson `published` tạo version mới ở `draft`; hàng cũ không bị `UPDATE`.
- [ ] `pnpm test -- lesson-authoring lesson-composition` xanh, gồm race test.

## Task 6 — Bản xem thử cho người dạy

- [ ] `GET .../teaching-view` trả đúng hình dạng `TeachingView` ở §3.2 của kế hoạch.
- [ ] `total_activity_minutes` tính từ activity đang lắp, không đọc cột.
- [ ] Vật liệu gộp từ lesson và mọi activity, khử trùng lặp.
- [ ] Hoạt động ngoài màn hình có nhãn.
- [ ] Activity `digital_game` nhúng preview engine của level được trỏ, dùng lại
      [`live-preview.md`](../specs/06-admin/live-preview.md).
- [ ] Không có cơ chế preview thứ hai trong repo.
- [ ] Không dựng được thì hiện rõ lý do, không để trống im lặng.
- [ ] Route read-only; không đường nào của nó ghi dữ liệu.
- [ ] `pnpm test -- teaching-view` xanh.

## Checkpoint C — API authoring và preview

- [ ] Activity/lesson routes, race composition và teaching-view xanh.
- [ ] Audit + bất biến `published` xanh; human review diff route.

## Task 7 — Hàng đợi duyệt nhận lesson và activity

- [ ] `entity_type` nhận `lesson` và `activity`.
- [ ] Response trả đủ `origin`, `authored_in`, `created_by_manager_id`.
- [ ] **Test âm:** duyệt trước khi mở bản xem thử là **ĐỎ** (`D-LI`).
- [ ] Checklist họ lesson/activity hiện đủ bộ mục của họ đó.
- [ ] Không mục nào chỉ có nghĩa với game level lọt vào.
- [ ] Kết quả lưu `checklist_snapshot`.
- [ ] Warning đã xác nhận theo `D-LD` nằm trong snapshot, không bị nuốt.
- [ ] Từ chối bắt buộc lý do ≥10 ký tự (`BR-CRQ-03`).
- [ ] Mọi quyết định ghi `content_review_log` và `audit_logs` (`BR-CRQ-06`).
- [ ] Duyệt theo lô vẫn cấm (`BR-CRQ-01`); từ chối theo lô vẫn được.
- [ ] Bản `origin = ai_assisted` vẫn gắn nhãn (`BR-CRQ-04`).
- [ ] Ưu tiên mục 1 của §7.1 vẫn `pending_source: P3.3`, không thay bằng 0.
- [ ] `pnpm test -- review-queue-lesson-activity` xanh.

## Task 8 — Archive activity và `CONTENT_IN_USE`

- [ ] Không có route `DELETE` activity trong repo; test quét chứng minh.
- [ ] Archive đi qua route transition chung.
- [ ] Còn lesson `draft`/`in_review`/`approved`/`published` tham chiếu → 409 `CONTENT_IN_USE`.
- [ ] `details.used_by[]` gồm code và status từng lesson.
- [ ] Truy vấn `used_by` dùng index của T2; test đo không quét toàn bảng.
- [ ] Archive lesson không bị chặn bởi activity.
- [ ] Test chứng minh không tồn tại được lesson `published` trỏ activity `archived`.
- [ ] `pnpm test -- activity-archive` xanh.

## Task 9 — Tìm kiếm activity qua mặt tìm kiếm dùng chung

- [ ] `GET /api/managers/activities` chạy trên đường của
      [`content-search.md`](../specs/01-platform/content-search.md).
- [ ] Cursor, trần chung, phạm vi trạng thái theo actor.
- [ ] Bộ lọc `kind` · `skill` · `duration_max` · `status` chạy.
- [ ] `age` lọc trên band suy ra qua join taxonomy, không đọc cột.
- [ ] `limit` vượt trần bị ép về trần, không lỗi.
- [ ] Truy vấn text tham số hoá, không nối chuỗi.
- [ ] Không đường truy vấn activity thứ hai trong repo; test quét chứng minh.
- [ ] `pnpm test -- content-search-activities` xanh.

## Checkpoint D — Đường ghi hoàn chỉnh

- [ ] T2 tới T9 xanh.
- [ ] Race test sắp xếp và test archive đều đúng một người thắng.
- [ ] `pnpm check` xanh.
- [ ] `pnpm test` xanh.
- [ ] Human đọc diff migration và diff route.
- [ ] Không chạy migration ngoài local.

---

## Task 10 — Hai màn studio

- [ ] `/studio/activities` và `/studio/activities/new` chạy.
- [ ] `/studio/lessons`, `/studio/lessons/new`, `/studio/lessons/{code}/{version}` chạy.
- [ ] Nav admin thêm mục; không tạo shell thứ hai.
- [ ] Bố cục lesson theo §7.2: form trái, danh sách activity kéo thả phải, ô tìm activity dưới.
- [ ] Tổng thời lượng chạy hiện ngay khi lắp hoặc bỏ activity.
- [ ] Autosave 30 giây và khi rời field.
- [ ] Lưu fail giữ nguyên **toàn bộ** form (`BR-STU-03`); test mô phỏng mất mạng.
- [ ] Lỗi validate hiện cạnh field (`BR-STU-09`).
- [ ] Mật độ theo `BR-STU-08`; input `font-size ≥ 16px` (`BR-SDF-07`).
- [ ] `access_tier` bắt buộc chọn, không mặc định (`BR-STU-06`).
- [ ] Tạo activity ngay trong luồng soạn lesson rồi quay lại đúng vị trí; nháp lesson không mất.
- [ ] Kéo thả đi được **bằng bàn phím**.
- [ ] Thứ tự đọc của screen reader khớp thứ tự hiển thị theo
      [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] Cảnh báo thiếu hoạt động ngoài màn hình yêu cầu xác nhận rõ ràng, không tự tick
      (`BR-LSA-06`).
- [ ] Không thành phần zone Kid nào lọt vào studio theo
      [`design-system-contract.md`](../specs/08-quality/design-system-contract.md).
- [ ] Không secret, không dữ liệu trẻ trong log hoặc analytics của studio.
- [ ] `pnpm test:e2e -- studio-lessons studio-activities` xanh, gồm ca bàn phím.

## Task 11 — Evidence và promote P3.2

- [ ] Mỗi `BR-LSA-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Mỗi `BR-ACA-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] `D-LR`: một lesson và ba activity soạn tay đi hết `draft → in_review → approved →
      published` trong studio.
- [ ] Trong ba activity đó có một `digital_game` và hai kind ngoài màn hình khác nhau.
- [ ] Có review log và checklist snapshot thật cho vòng nghiệm thu đó.
- [ ] [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) → `implemented`.
- [ ] [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) → `implemented`.
- [ ] Spec bị P3.2 sửa giữ nguyên trạng thái cũ, có ghi task nguồn của lần sửa.
- [ ] `D-KK` tier curriculum vẫn `pending_source: P3.3`.
- [ ] `D-KP` export `curriculum_health` vẫn `pending_source: P3.3`.
- [ ] Không thẻ dashboard nào bị bật sớm.
- [ ] Tick **P3.2** trong Task #14 chỉ khi `node packages/gates/scripts/check-progress.ts` tự xanh.

## Cổng dừng cuối

- [ ] `pnpm check` xanh.
- [ ] `pnpm test` xanh.
- [ ] `pnpm test:e2e` xanh.
- [ ] `pnpm --filter @mindkid/gates test` xanh.
- [ ] `node packages/gates/scripts/check-progress.ts` xanh.
- [ ] Human review diff contract, migration, route và hai màn studio.
- [ ] Không nội dung nền nào được soạn trong Task #55 — đó là Task #54.
- [ ] Không phạm vi P3.3 lọt vào: không curriculum, không builder, không `curriculum_health`.
- [ ] Không route `DELETE` activity, không `/submit` mới, không cơ chế preview thứ hai, không
      đường tìm kiếm activity thứ hai.
- [ ] Không auto-merge, không migration ngoài local, không publish tự động.
