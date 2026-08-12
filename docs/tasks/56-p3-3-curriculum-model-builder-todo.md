# Checklist — Task #56: P3.3 — Mô hình và builder curriculum

> Kế hoạch: [`56-p3-3-curriculum-model-builder-plan.md`](56-p3-3-curriculum-model-builder-plan.md).
> Chỉ bắt đầu khi P3.1 (`Task #54`) và P3.2 (`Task #55`) `implemented`.
> Tuyệt đối: không suy `week_no` từ `position`, không để rule `Never` thành thanh cảnh báo,
> không hai nguồn sự thật về curriculum của trẻ, không chạy migration ngoài local.
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] P3.1 và P3.2 tick xong; bốn spec của chúng `implemented`.
- [ ] Thư viện lesson và activity đã `published`.
- [ ] Cơ chế họ thực thể, bản xem thử và checklist của Task #55 mở rộng được cho loại thứ ba.
- [ ] `skill_prerequisites` của P0.9 có dữ liệu thật.
- [ ] P2.8 hàng đợi và P2.9 sáu loại xuất đã chạy.
- [ ] Đo lại [`curriculum.ts`](../../packages/db/src/schema/curriculum.ts) sau P3.1 và P3.2.
- [ ] Human approve `D-LS` · `D-LT` · `D-LU` · `D-LV` · `D-LW` · `D-LX` · `D-LY` · `D-LZ`.
- [ ] `D-LU` và `D-LV` duyệt **riêng** — hai quyết định này đụng nguồn ngoài P3.3.
- [ ] Nhánh riêng.

## Cảnh báo sớm cho Task #54 — chạy trước mọi việc khác

- [ ] Xác minh Task #54 T1 đã sửa hai câu hỏi mở số 2 về 42 tuần theo `D-LA`.
- [ ] Còn đề xuất "chấp nhận dùng lại mỗi lesson 2 lần" ở
      [`curriculum-model.md`](../specs/05-content/curriculum-model.md) §11 thì sửa trước.
- [ ] Còn đề xuất đó ở [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) §11
      thì sửa trước.
- [ ] Tính cầu lesson thật từ §7.1 và §7.3 của
      [`curriculum-model.md`](../specs/05-content/curriculum-model.md).
- [ ] Gửi người sở hữu ba phương án ở mục 1.3 của kế hoạch.
- [ ] Task #54 **chưa** chạy Task 6: chốt `D-LU` trước batch đầu tiên.
- [ ] Task #54 **đã** chạy Task 6: **DỪNG** batch cho tới khi `D-LU` chốt; ghi số lesson đã soạn.
- [ ] Ba nguồn (`D-LA`, §7.1, §7.3) nói cùng một con số sau khi chốt.

---

## Task 1 — Sửa contract trước code

### 1a. Chiều tuần và buổi

- [ ] `week_no` và `session_no` vào spec sở hữu schema, kiểu và ràng buộc rõ.
- [ ] Tuần rỗng định nghĩa bằng đối chiếu `duration_weeks`, không đoán từ khoảng trống.
- [ ] `position` giữ nghĩa thứ tự **trong một buổi**.

### 1b. Cấu hình curriculum

- [ ] `program_type` enum đóng: `age_based` · `journey`.
- [ ] `target_age_min` · `target_age_max` · `duration_weeks` · `sessions_per_week`.
- [ ] Bảng `curriculum_weeks (curriculum_id, week_no, goal_vi)` cho `BR-CRM-10`.
- [ ] `BR-CRM-08` ghi rõ chỉ áp cho `program_type = age_based`.
- [ ] Ghi lại trần `CUR-###` là 999 chương trình.

### 1c. Nguồn sự thật và cực dữ liệu

- [ ] `D-LV` vào [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7
      và spec schema: enrollment ghim version, con trỏ hồ sơ chỉ để hiển thị.
- [ ] Mọi truy vấn tiến độ đọc qua enrollment.
- [ ] `is_optional` bị bỏ khỏi contract và cột; chỉ còn `is_required`, mặc định `true`.
- [ ] `estimated_minutes` bị bỏ khỏi body `PUT .../items` (`D-LX`).

### 1d. Rule sư phạm

- [ ] Rule mới "không giới thiệu skill mới trong ba tuần cuối" vào
      [`curriculum-model.md`](../specs/05-content/curriculum-model.md) §6, mã `BR-CRM-*` kế tiếp.
- [ ] Ghi rõ `BR-CRM-03` đo trên **skill**, `BR-CRM-09` đo trên **item**.
- [ ] Hạng chặn theo `D-LZ`: `BR-CRM-01` · `BR-CRM-06` · `BR-CRM-07` · `BR-CRM-09` ·
      `BR-CBD-02` · `BR-CBD-03` · `BR-CBD-04`.
- [ ] Hạng cảnh báo cần xác nhận: `BR-CRM-02` · `BR-CRM-04` · `BR-CRM-05` · `BR-CRM-08`.
- [ ] Hàng `curricula` của §7.3
      [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) mở rộng theo hạng chặn.

### 1e. Route

- [ ] `expected_version` thêm vào `PUT .../items` và `PUT .../weeks`.
- [ ] `PUT .../weeks` ghi vào §8 của
      [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md).
- [ ] `POST .../duplicate` ghi vào §8.
- [ ] Ghi rõ P3.3 dùng route transition chung, không thêm `/submit`.

### 1f. Cổng ra Task 1

- [ ] Không thêm spec mới.
- [ ] Không thêm mã lỗi ngoài [`error-codes.md`](../specs/00-foundation/error-codes.md).
- [ ] Câu hỏi mở còn lại của hai spec P3.3 đóng hoặc hoãn kèm điều kiện mở lại đo được.
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [ ] T0 và T1 xanh; human đã đọc diff.
- [ ] `D-LU` đã chốt và đã phản hồi về Task #54.
- [ ] Không migration, route hay UI nào viết trước checkpoint này.

---

## Task 2 — Migration tuần, buổi, tuần-mục-tiêu và enrollment

- [ ] **Test âm trước:** hàng `curriculum_items` thiếu `week_no` làm migration **ĐỎ**.
- [ ] **Test âm trước:** hai enrollment `active` cùng `(child_id, curriculum_id)` là **ĐỎ**.
- [ ] `week_no` và `session_no` `NOT NULL`, kiểu `smallint`.
- [ ] Unique `(curriculum_id, week_no, session_no, position)`.
- [ ] Index `(curriculum_id, week_no)`.
- [ ] Index `curriculum_items.entity_id`.
- [ ] Bốn cột cấu hình trên `curricula`; `program_type` là enum đóng.
- [ ] Bảng `curriculum_weeks`, unique `(curriculum_id, week_no)`.
- [ ] `is_optional` thành `is_required`; DB rỗng đổi thẳng, có dữ liệu thì **abort** và in số hàng.
- [ ] `curriculum_enrollments`: khoá ngoại `child_profiles`.
- [ ] `curriculum_enrollments.status` thành enum.
- [ ] Unique một enrollment `active` cho mỗi cặp `(child_id, curriculum_id)`.
- [ ] `curriculum_item_progress.status` thành enum.
- [ ] `pnpm db:migrate` trên DB rỗng xanh.
- [ ] Ca lỗi rollback cả transaction.

## Task 3 — Engine cân bằng và cổng publish dùng chung

- [ ] Sáu chỉ báo và cổng publish gọi **cùng một hàm**; test quét chứng minh không có bản thứ hai.
- [ ] `BR-CRM-01` prerequisite ngược → error.
- [ ] `BR-CRM-02` số competency mỗi tuần → warning.
- [ ] `BR-CRM-03` ôn lại skill trong tuần N+1…N+3, đo trên **skill**.
- [ ] `BR-CRM-04` độ dốc → warning.
- [ ] `BR-CRM-05` ≥1 hoạt động ngoài màn hình mỗi tuần → warning.
- [ ] `BR-CRM-06` tuần đầu dễ hơn trung bình → error.
- [ ] `BR-CRM-07` không competency nào quá 40% → error.
- [ ] `BR-CRM-08` phủ 6 competency, chỉ với `age_based` → warning.
- [ ] `BR-CRM-09` không lặp item trong 4 tuần, đo trên **item** → error.
- [ ] `BR-CRM-10` mỗi tuần có câu mục tiêu → error.
- [ ] Rule ba tuần cuối của `D-LY` có ca dương và ca âm.
- [ ] `BR-CBD-02` · `BR-CBD-03` · `BR-CBD-04` → error.
- [ ] `skill_prerequisites` đọc từ taxonomy thật, không bảng cứng.
- [ ] Thời lượng buổi suy ra tại thời điểm đọc, không đọc cột (`D-LX`).
- [ ] Warning đã xác nhận vào `checklist_snapshot`.
- [ ] Chương trình 8 tuần hợp lệ chạy hết engine dưới ngưỡng thời gian đã đặt.
- [ ] `pnpm test -- curriculum-balance publish-checklist-curricula` xanh.

## Checkpoint B — Schema và engine sư phạm

- [ ] Migration + balance engine xanh; publish/builder dùng cùng bộ rule.
- [ ] Full gate hiện tại xanh trước route ghi.

## Task 4 — Route curriculum và ghi item nguyên tử

- [ ] `POST /api/managers/curricula` nhận cấu hình `D-LT`, trả mã `CUR-###` sinh ở server.
- [ ] `PATCH` cần `expected_version`.
- [ ] `PUT .../items` thay **toàn bộ** danh sách trong một transaction.
- [ ] `PUT .../weeks` thay toàn bộ, cùng quy tắc.
- [ ] `expected_version` lệch → 409 `VERSION_CONFLICT`.
- [ ] **Race test:** hai request ghi item đồng thời → đúng một thành công.
- [ ] `week_no` vượt `duration_weeks` → 422.
- [ ] Giảm `duration_weeks` cảnh báo item sẽ mất, cần xác nhận rõ ràng.
- [ ] `duplicate` tạo mã mới, copy đủ item và week; bản gốc không đổi.
- [ ] Sửa curriculum `published` tạo version mới (`BR-CBD-08`).
- [ ] Xoá curriculum không đụng lesson hay game level (`BR-CBD-01`).
- [ ] Item trỏ `entity_id` dòng dõi, phân giải bản `published` mới nhất (`D-AE`).
- [ ] Mọi thao tác ghi `audit_logs`.
- [ ] `pnpm test -- curriculum-builder-api` xanh, gồm race test.

## Task 5 — Builder UI lưới tuần × buổi

- [ ] `/studio/curricula` và `/studio/curricula/{code}/{version}` chạy.
- [ ] Bố cục theo §7.3: lưới trái 65%, thư viện phải 35%, chỉ báo trên, cảnh báo dưới.
- [ ] Kéo thả từ thư viện vào ô tuần × buổi.
- [ ] Thư viện dùng mặt tìm kiếm chung; không viết bộ lọc thứ hai.
- [ ] Sáu chỉ báo hiện thường trực, cập nhật khi lưới đổi (`BR-CBD-05`).
- [ ] Error và warning phân biệt được bằng nhiều hơn màu sắc.
- [ ] Kéo thả đi được **bằng bàn phím**.
- [ ] Thứ tự đọc screen reader khớp lưới theo
      [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] Autosave và giữ form khi lưu fail (`BR-STU-03`).
- [ ] Mật độ theo `BR-STU-08`; lỗi cạnh field theo `BR-STU-09`.
- [ ] Không hiển thị ngày tháng gắn với tuần (`BR-CBD-07`).
- [ ] Câu mục tiêu tuần sửa ngay trên lưới.
- [ ] `pnpm test:e2e -- studio-curricula` xanh, gồm ca bàn phím.

## Checkpoint C — Đường dựng curriculum

- [ ] Route/race test và builder keyboard journey xanh.
- [ ] Không rule riêng trong UI; human review diff route + UI.

## Task 6 — Hàng đợi duyệt nhận curriculum

- [ ] `entity_type` nhận `curriculum`.
- [ ] Dùng lại cơ chế họ thực thể và bản xem thử của Task #55; không cơ chế thứ ba.
- [ ] Bản xem thử là **lộ trình**: tuần, buổi, item, mục tiêu tuần, chỉ báo cân bằng.
- [ ] **Test âm:** duyệt trước khi mở lộ trình là **ĐỎ**.
- [ ] Checklist họ curriculum hiện đủ bộ mục của họ đó.
- [ ] Warning đã xác nhận vào `checklist_snapshot`.
- [ ] Từ chối bắt buộc lý do ≥10 ký tự.
- [ ] Mọi quyết định ghi `content_review_log` và `audit_logs`.
- [ ] `pnpm test -- review-queue-curriculum` xanh.

## Task 7 — Trả nợ `D-KK` và `D-KP`

- [ ] Tầng ưu tiên 1 của hàng đợi bật nguồn thật, tính từ `week_no`.
- [ ] Loại xuất `curriculum_health` bật, nằm trong union type đóng.
- [ ] `kind` sai vẫn 404 và **không** mở kết nối.
- [ ] Truy vấn riêng cho loại xuất mới; không truy vấn tổng quát.
- [ ] Trần và rate limit như năm loại còn lại.
- [ ] Signed URL và audit như năm loại còn lại.
- [ ] **Ca âm:** không có curriculum nào thì trả tập rỗng, không phải số 0 giả.
- [ ] Không thẻ dashboard nào còn `pending_source: P3.3`.
- [ ] `pnpm test -- review-queue-priority data-export-curriculum-health` xanh.

---

## Checkpoint D — Review và vận hành

- [ ] Review/audit/dashboard/export dùng nguồn curriculum thật.
- [ ] Không `pending_source` giả; full gate hiện tại xanh.

## Task 8 — Năm chương trình MVP

Quy trình cho **mỗi** chương trình:

- [ ] Cấu hình đúng `program_type`, band tuổi, `duration_weeks`, `sessions_per_week`.
- [ ] Engine cân bằng trả **0 error**.
- [ ] Mọi warning có người xác nhận kèm lý do trong snapshot.
- [ ] Mỗi tuần có câu mục tiêu do người viết.
- [ ] Reviewer sư phạm đọc **cả lộ trình**, không chỉ từng item.
- [ ] Ghi người duyệt và checklist snapshot.
- [ ] Dry-run riêng chương trình xanh.

### Danh sách

- [ ] `CUR-BE3` — Bé 3 tuổi, 8 tuần, band 3–4.
- [ ] `CUR-BE4` — Bé 4 tuổi, 8 tuần, band 4–5.
- [ ] `CUR-BE5` — Bé 5 tuổi, 8 tuần, band 5–6.
- [ ] `CUR-BE6` — Bé 6 tuổi, 8 tuần, band 6.
- [ ] `CUR-J42` — Hành trình 42 tuần, phát hành theo mốc đã chốt ở `D-LU`.

### Cổng chương trình

- [ ] Cả bốn chương trình theo tuổi phủ đủ 6 competency.
- [ ] Không chương trình nào có competency vượt 40%.
- [ ] Không chương trình nào lặp item trong cửa sổ 4 tuần.
- [ ] Điểm cắt [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) §5 ghi rõ: thiếu nguồn lực
      thì giữ **một** chương trình theo tuổi, không hạ checklist.
- [ ] `pnpm seed:check` xanh.

## Checkpoint E — Corpus curriculum

- [ ] Từng curriculum qua balance, dry-run và reviewer sư phạm.
- [ ] Số chương trình khớp contract/điểm cắt canonical; không seed ngoài local.

## Task 9 — Evidence và promote P3.3

- [ ] Mỗi `BR-CRM-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Mỗi `BR-CBD-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] [`curriculum-model.md`](../specs/05-content/curriculum-model.md) → `implemented`.
- [ ] [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) → `implemented`.
- [ ] Spec bị P3.3 sửa giữ nguyên trạng thái cũ, có ghi task nguồn của lần sửa.
- [ ] `D-KK` và `D-KP` không còn `pending_source`.
- [ ] Tick **P3.3** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

## Cổng dừng cuối

- [ ] `pnpm check` xanh.
- [ ] `pnpm test` xanh.
- [ ] `pnpm test:e2e` xanh.
- [ ] `pnpm lint:specs` xanh.
- [ ] `pnpm check:progress` xanh.
- [ ] Human review diff contract, migration, engine cân bằng, builder và từng chương trình.
- [ ] Không phạm vi P3.4 lọt vào: không mở khoá buổi, không tiến độ trẻ, không xử lý bỏ dở.
- [ ] Không tầng `Level` hay `Module` được build ở MVP.
- [ ] Không auto-merge, không migration ngoài local, không publish tự động.
