# Checklist — Task #60: P3.7 — Báo cáo nâng cao

> Kế hoạch: [`60-p3-7-advanced-report-plan.md`](60-p3-7-advanced-report-plan.md).
> Chỉ bắt đầu khi P3.5 (`Task #58`) `implemented`.
> Tuyệt đối: không dự đoán tương lai, không so chuẩn ngoài, không ẩn mục dưới ngưỡng, không gửi
> số liệu của trẻ trong response 403, không sinh gợi ý hành động lúc chạy.
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] P3.5 tick xong; `mastery_state` có dữ liệu thật.
- [ ] Bảng nhãn thành thạo là **một hàm duy nhất** của P3.5.
- [ ] P1.12 [`basic-report.md`](../specs/03-account/basic-report.md) và ràng buộc `BR-REP-*` đã có.
- [ ] `view_advanced_report` cấp được và kiểm được.
- [ ] `child_daily_stats` được telemetry nuôi thật cho khoảng 90 ngày.
- [ ] `play_sessions` ghim version nội dung đã chơi.
- [ ] Đếm lại số skill thật trong taxonomy — con số quyết định khối lượng Task 6.
- [ ] Có người sở hữu và reviewer sư phạm cho thư viện gợi ý hành động.
- [ ] Ngưỡng thời gian truy vấn trang báo cáo do người sở hữu đặt **trước** Task 4.
- [ ] Human approve `D-MY` · `D-MZ` · `D-NA` · `D-NB` · `D-NC` · `D-ND` · `D-NE`.
- [ ] `D-MY` và `D-MZ` duyệt **riêng** — đổi phạm vi công việc.
- [ ] Nhánh riêng.

## Cảnh báo sớm cho Task #58 — chạy trước mọi việc khác

- [ ] Báo cái giá của việc bỏ `hint_rate`: mất mục "Mức độ độc lập" của P3.7.
- [ ] Task #58 **giữ** `hint_rate`: xác nhận tách được theo phiên, không chỉ EMA.
- [ ] Task #58 **bỏ** `hint_rate`: chốt `D-MZ` theo hướng bỏ mục và sửa §7.1 xuống sáu mục.
- [ ] Không giữ một mục vĩnh viễn hiện `Chưa có đủ dữ liệu`.

---

## Task 1 — Sửa contract trước code

- [ ] Bảng `skill_action_suggestions` và `kind` đóng vào spec sở hữu schema.
- [ ] Đường seed theo lô qua PR review ghi rõ; **không** qua studio.
- [ ] Điểm cắt `D-MY`: phủ trước skill của năm chương trình MVP.
- [ ] Câu chốt cho skill chưa có gợi ý được viết ra, không để UI tự nghĩ.
- [ ] Câu hỏi mở số 2 đóng theo `D-MY`.
- [ ] "Phiên có chạm" định nghĩa **một chỗ**, dẫn được từ cả bốn mục dùng ngưỡng.
- [ ] `TrendDirection` ba giá trị và câu tiếng Việt cố định vào §7.
- [ ] "Tuần có dữ liệu" định nghĩa rõ.
- [ ] Alt flow 403 sửa theo `D-NB`: response không chứa số liệu của trẻ.
- [ ] Quy tắc phiên thiếu version ghim vào §7 theo `D-ND`.
- [ ] Danh sách từ cấm đăng ký ở nơi dùng chung với báo cáo cơ bản; không chép hai bản.
- [ ] Câu hỏi mở số 1 đóng hoặc hoãn kèm điều kiện mở lại đo được.
- [ ] Không thêm spec mới; không thêm mã lỗi ngoài registry.
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [ ] T0 và T1 xanh; `D-MZ` đã phản hồi về Task #58.
- [ ] Có người sở hữu và reviewer cho thư viện; nếu chưa thì **dừng Task 6**.
- [ ] Không migration, route hay UI nào viết trước checkpoint này.

---

## Task 2 — Cổng ngôn ngữ có ca âm

- [ ] **Ca âm trước:** fixture chứa một từ chẩn đoán làm cổng **ĐỎ**.
- [ ] **Ca âm trước:** fixture chứa một từ dự đoán tương lai làm cổng **ĐỎ**.
- [ ] **Ca âm trước:** fixture chứa một cụm so chuẩn ngoài làm cổng **ĐỎ**.
- [ ] Lỗi in `file:line`.
- [ ] Cổng chạy trên thư viện gợi ý hành động.
- [ ] Cổng chạy trên mọi chuỗi cố định của báo cáo.
- [ ] Danh sách từ cấm dùng chung với báo cáo cơ bản.
- [ ] Không nới ca kiểm nào đang có để đổi lấy màu xanh.
- [ ] `pnpm test -- report-language-gate` xanh.

## Task 3 — Migration bảng gợi ý hành động

- [ ] **Test âm trước:** mục `in_app` trỏ nội dung chưa `published` làm cổng **ĐỎ**.
- [ ] `skill_action_suggestions` có khoá ngoại `skill_id`.
- [ ] Unique `(skill_id, order_no)`.
- [ ] `kind` là enum đóng: `home_activity` · `in_app`.
- [ ] `ref_entity_id` là `entity_id` dòng dõi; không khoá ngoại cứng.
- [ ] Provenance và review fields như mọi bảng nội dung khác.
- [ ] `pnpm db:migrate` trên DB rỗng xanh.
- [ ] Ca lỗi rollback cả transaction.

## Checkpoint B — Language gate và content source

- [ ] Ca âm ngôn ngữ + migration gợi ý hành động cùng xanh.
- [ ] Không có danh sách từ cấm thứ hai; full gate hiện tại xanh.

## Task 4 — Engine đếm phiên có chạm và áp ngưỡng

- [ ] "Phiên có chạm" cài đúng `D-NA`.
- [ ] Phiên guest và phiên preview bị loại.
- [ ] Phiên `abandoned` được tính.
- [ ] Đếm theo skill, strand, competency đi qua **cùng một** hàm.
- [ ] Ngưỡng bảy mục lấy từ hằng số có tên; không rải số trong code.
- [ ] Dưới ngưỡng trả `insufficient_data` kèm `sessions_needed`.
- [ ] **Không ẩn mục** nào dưới ngưỡng.
- [ ] Skill chỉ chơi một lần hiện ở "đã tiếp xúc", không vào phần đánh giá.
- [ ] **Đo** truy vấn trên 90 ngày của một trẻ chơi nhiều; ghi số đo.
- [ ] So số đo với ngưỡng đã đặt.
- [ ] Chỉ thêm bảng tổng hợp nếu vượt ngưỡng; quyết định có số kèm theo.
- [ ] `pnpm test -- report-session-counting` xanh.

## Task 5 — Bảy mục và route

- [ ] `requireUserAuth()` + ownership + `view_advanced_report`.
- [ ] Thiếu quyền → 403 `ENTITLEMENT_REQUIRED` + `upgrade_package_codes`.
- [ ] Response 403 **không** chứa số liệu nào của trẻ.
- [ ] Trẻ không thuộc caller → 404, không phải 403.
- [ ] Bảy mục (hoặc sáu theo `D-MZ`) đều trả, kể cả dưới ngưỡng.
- [ ] Nhãn thành thạo lấy từ hàm duy nhất của P3.5; không bảng ánh xạ thứ hai.
- [ ] `TrendDirection` chỉ nhận ba giá trị.
- [ ] Response không chứa độ dốc hay phần trăm xu hướng.
- [ ] Mục "cần củng cố" luôn kèm ≥1 hành động.
- [ ] Skill chưa có gợi ý hiện đúng câu đã chốt; **không** dừng ở dữ liệu.
- [ ] `BR-ARP-08`: chỉ báo mốc đổi version theo `D-ND`.
- [ ] Phiên thiếu version ghim bị loại và đếm riêng.
- [ ] `period` chỉ nhận `30d` và `90d`; giá trị khác → 422.
- [ ] `pnpm test -- advanced-report-api` xanh.

## Checkpoint C — Engine và API báo cáo

- [ ] Session counting/threshold/performance + route bảy mục xanh.
- [ ] 403 không rò dữ liệu trẻ; version marker có nguồn ghim thật.

---

## Task 6 — Biên soạn thư viện gợi ý hành động

Quy trình cho **mỗi** lô:

- [ ] Mỗi skill trong lô có ≥1 mục `home_activity`.
- [ ] Viết cho người lớn không được đào tạo.
- [ ] Mục `in_app` (nếu có) trỏ nội dung `published`.
- [ ] Vật liệu là thứ có sẵn trong nhà, cùng chuẩn `BR-LSM-04`.
- [ ] Không mục nào chứa từ trong danh sách cấm của `D-NE`.
- [ ] Reviewer sư phạm đọc từng mục; ghi người duyệt.
- [ ] `pnpm seed:check` xanh.
- [ ] Dry-run riêng lô xanh.

### Checkpoint sau mỗi lô

- [ ] Đo tốc độ review thật và so kế hoạch.
- [ ] Lệch quá 30% thì sửa lịch hoặc cỡ lô; **không** hạ checklist.
- [ ] Báo cáo phủ: skill nào của năm chương trình MVP còn thiếu gợi ý.

### Cổng thư viện cuối

- [ ] Mọi skill xuất hiện trong năm chương trình MVP đều có ≥1 gợi ý.
- [ ] Phần còn lại đã phủ, hoặc nằm trong danh sách hoãn đã được người sở hữu chấp nhận.
- [ ] Không mục nào được sinh tự động lúc chạy.
- [ ] AI agent không merge PR và không chạy seed ngoài local.

---

## Task 7 — UI báo cáo, a11y và ca 403

- [ ] `/me/children/{uuid}/report/advanced` hiện đủ mục.
- [ ] Mục dưới ngưỡng hiện trạng thái kèm số phiên còn thiếu; **không ẩn**.
- [ ] `BR-ARP-03`: mỗi biểu đồ có mô tả văn bản tương đương.
- [ ] Test render toàn bộ biểu đồ và kiểm nhãn thay thế.
- [ ] Không biểu đồ nào truyền tải thông tin **chỉ** bằng màu.
- [ ] Ca 403 hiện bản mẫu **tĩnh** có nhãn "ví dụ" và nút nâng cấp.
- [ ] Không số nào của trẻ xuất hiện trong ca 403.
- [ ] Chọn 30 và 90 ngày đổi dữ liệu, không đổi cấu trúc mục.
- [ ] Không câu nào dự đoán tương lai.
- [ ] Không câu nào so chuẩn ngoài hay so với trẻ khác.
- [ ] Cổng `D-NE` chạy trên chuỗi UI.
- [ ] Đi hết trang bằng bàn phím; đạt
      [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] `pnpm test:e2e -- advanced-report` xanh.

## Checkpoint D — Content và UI trả phí

- [ ] Skill trong curriculum MVP có gợi ý hoặc điểm cắt canonical.
- [ ] UI/a11y/static 403/language gate + human review xanh.

## Task 8 — Evidence và promote P3.7

- [ ] Mỗi `BR-ARP-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Cổng ngôn ngữ có ca âm và đang chạy trong `pnpm check`.
- [ ] Thư viện gợi ý đạt cổng cuối của Task 6.
- [ ] [`advanced-report.md`](../specs/03-account/advanced-report.md) → `implemented`.
- [ ] Tick **P3.7** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

## Cổng dừng cuối

- [ ] `pnpm check` xanh.
- [ ] `pnpm test` xanh.
- [ ] `pnpm test:e2e` xanh.
- [ ] `pnpm lint:specs` xanh.
- [ ] `pnpm check:progress` xanh.
- [ ] Human review diff migration, engine đếm, route, UI và từng lô nội dung.
- [ ] Không xuất PDF, không báo cáo lớp học.
- [ ] Không phạm vi P3.8 lọt vào: không trang công khai.
- [ ] Không auto-merge, không migration ngoài local.
