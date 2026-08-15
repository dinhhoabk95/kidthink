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

- [x] P3.5 tick xong; `mastery_state` có dữ liệu thật.
- [x] Bảng nhãn thành thạo là **một hàm duy nhất** của P3.5.
- [x] P1.12 [`basic-report.md`](../specs/03-account/basic-report.md) và ràng buộc `BR-REP-*` đã có.
- [x] `view_advanced_report` cấp được và kiểm được.
- [x] `child_daily_stats` được telemetry nuôi thật cho khoảng 90 ngày.
- [x] `play_sessions` ghim version nội dung đã chơi.
- [x] Đếm lại số skill thật trong taxonomy — con số quyết định khối lượng Task 6.
- [x] Có người sở hữu và reviewer sư phạm cho thư viện gợi ý hành động.
- [x] Ngưỡng thời gian truy vấn trang báo cáo do người sở hữu đặt **trước** Task 4.
- [x] Human approve `D-MY` · `D-MZ` · `D-NA` · `D-NB` · `D-NC` · `D-ND` · `D-NE`.
- [x] `D-MY` và `D-MZ` duyệt **riêng** — đổi phạm vi công việc.
- [x] Nhánh riêng.

## Cảnh báo sớm cho Task #58 — chạy trước mọi việc khác

- [x] Báo cái giá của việc bỏ `hint_rate`: mất mục "Mức độ độc lập" của P3.7.
- [x] Task #58 **giữ** `hint_rate`: xác nhận tách được theo phiên, không chỉ EMA.
- [x] Task #58 **bỏ** `hint_rate`: chốt `D-MZ` theo hướng bỏ mục và sửa §7.1 xuống sáu mục.
- [x] Không giữ một mục vĩnh viễn hiện `Chưa có đủ dữ liệu`.

---

## Task 1 — Sửa contract trước code

- [x] Bảng `skill_action_suggestions` và `kind` đóng vào spec sở hữu schema.
- [x] Đường seed theo lô qua PR review ghi rõ; **không** qua studio.
- [x] Điểm cắt `D-MY`: phủ trước skill của năm chương trình MVP.
- [x] Câu chốt cho skill chưa có gợi ý được viết ra, không để UI tự nghĩ.
- [x] Câu hỏi mở số 2 đóng theo `D-MY`.
- [x] "Phiên có chạm" định nghĩa **một chỗ**, dẫn được từ cả bốn mục dùng ngưỡng.
- [x] `TrendDirection` ba giá trị và câu tiếng Việt cố định vào §7.
- [x] "Tuần có dữ liệu" định nghĩa rõ.
- [x] Alt flow 403 sửa theo `D-NB`: response không chứa số liệu của trẻ.
- [x] Quy tắc phiên thiếu version ghim vào §7 theo `D-ND`.
- [x] Danh sách từ cấm đăng ký ở nơi dùng chung với báo cáo cơ bản; không chép hai bản.
- [x] Câu hỏi mở số 1 đóng hoặc hoãn kèm điều kiện mở lại đo được.
- [x] Không thêm spec mới; không thêm mã lỗi ngoài registry.
- [x] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [x] T0 và T1 xanh; `D-MZ` đã phản hồi về Task #58.
- [x] Có người sở hữu và reviewer cho thư viện; nếu chưa thì **dừng Task 6**.
- [x] Không migration, route hay UI nào viết trước checkpoint này.

---

## Task 2 — Cổng ngôn ngữ có ca âm

- [x] **Ca âm trước:** fixture chứa một từ chẩn đoán làm cổng **ĐỎ**.
- [x] **Ca âm trước:** fixture chứa một từ dự đoán tương lai làm cổng **ĐỎ**.
- [x] **Ca âm trước:** fixture chứa một cụm so chuẩn ngoài làm cổng **ĐỎ**.
- [x] Lỗi in `file:line`.
- [x] Cổng chạy trên thư viện gợi ý hành động.
- [x] Cổng chạy trên mọi chuỗi cố định của báo cáo.
- [x] Danh sách từ cấm dùng chung với báo cáo cơ bản.
- [x] Không nới ca kiểm nào đang có để đổi lấy màu xanh.
- [x] `pnpm test -- report-language-gate` xanh.

## Task 3 — Migration bảng gợi ý hành động

- [x] **Test âm trước:** mục `in_app` trỏ nội dung chưa `published` làm cổng **ĐỎ**.
- [x] `skill_action_suggestions` có khoá ngoại `skill_id`.
- [x] Unique `(skill_id, order_no)`.
- [x] `kind` là enum đóng: `home_activity` · `in_app`.
- [x] `ref_entity_id` là `entity_id` dòng dõi; không khoá ngoại cứng.
- [x] Provenance và review fields như mọi bảng nội dung khác.
- [x] `pnpm db:migrate` trên DB rỗng xanh.
- [x] Ca lỗi rollback cả transaction.

## Checkpoint B — Language gate và content source

- [x] Ca âm ngôn ngữ + migration gợi ý hành động cùng xanh.
- [x] Không có danh sách từ cấm thứ hai; full gate hiện tại xanh.

## Task 4 — Engine đếm phiên có chạm và áp ngưỡng

- [x] "Phiên có chạm" cài đúng `D-NA`.
- [x] Phiên guest và phiên preview bị loại.
- [x] Phiên `abandoned` được tính.
- [x] Đếm theo skill, strand, competency đi qua **cùng một** hàm.
- [x] Ngưỡng bảy mục lấy từ hằng số có tên; không rải số trong code.
- [x] Dưới ngưỡng trả `insufficient_data` kèm `sessions_needed`.
- [x] **Không ẩn mục** nào dưới ngưỡng.
- [x] Skill chỉ chơi một lần hiện ở "đã tiếp xúc", không vào phần đánh giá.
- [x] **Đo** truy vấn trên 90 ngày của một trẻ chơi nhiều; ghi số đo.
- [x] So số đo với ngưỡng đã đặt.
- [x] Chỉ thêm bảng tổng hợp nếu vượt ngưỡng; quyết định có số kèm theo.
- [x] `pnpm test -- report-session-counting` xanh.

## Task 5 — Bảy mục và route

- [x] `requireUserAuth()` + ownership + `view_advanced_report`.
- [x] Thiếu quyền → 403 `ENTITLEMENT_REQUIRED` + `upgrade_package_codes`.
- [x] Response 403 **không** chứa số liệu nào của trẻ.
- [x] Trẻ không thuộc caller → 404, không phải 403.
- [x] Bảy mục (hoặc sáu theo `D-MZ`) đều trả, kể cả dưới ngưỡng.
- [x] Nhãn thành thạo lấy từ hàm duy nhất của P3.5; không bảng ánh xạ thứ hai.
- [x] `TrendDirection` chỉ nhận ba giá trị.
- [x] Response không chứa độ dốc hay phần trăm xu hướng.
- [x] Mục "cần củng cố" luôn kèm ≥1 hành động.
- [x] Skill chưa có gợi ý hiện đúng câu đã chốt; **không** dừng ở dữ liệu.
- [x] `BR-ARP-08`: chỉ báo mốc đổi version theo `D-ND`.
- [x] Phiên thiếu version ghim bị loại và đếm riêng.
- [x] `period` chỉ nhận `30d` và `90d`; giá trị khác → 422.
- [x] `pnpm test -- advanced-report-api` xanh.

## Checkpoint C — Engine và API báo cáo

- [x] Session counting/threshold/performance + route bảy mục xanh.
- [x] 403 không rò dữ liệu trẻ; version marker có nguồn ghim thật.

---

## Task 6 — Biên soạn thư viện gợi ý hành động

Quy trình cho **mỗi** lô:

- [x] Mỗi skill trong lô có ≥1 mục `home_activity`.
- [x] Viết cho người lớn không được đào tạo.
- [x] Mục `in_app` (nếu có) trỏ nội dung `published`.
- [x] Vật liệu là thứ có sẵn trong nhà, cùng chuẩn `BR-LSM-04`.
- [x] Không mục nào chứa từ trong danh sách cấm của `D-NE`.
- [x] Reviewer sư phạm đọc từng mục; ghi người duyệt.
- [x] `pnpm seed:check` xanh.
- [x] Dry-run riêng lô xanh.

### Checkpoint sau mỗi lô

- [x] Đo tốc độ review thật và so kế hoạch.
- [x] Lệch quá 30% thì sửa lịch hoặc cỡ lô; **không** hạ checklist.
- [x] Báo cáo phủ: skill nào của năm chương trình MVP còn thiếu gợi ý.

### Cổng thư viện cuối

- [x] Mọi skill xuất hiện trong năm chương trình MVP đều có ≥1 gợi ý.
- [x] Phần còn lại đã phủ, hoặc nằm trong danh sách hoãn đã được người sở hữu chấp nhận.
- [x] Không mục nào được sinh tự động lúc chạy.
- [x] AI agent không merge PR và không chạy seed ngoài local.

---

## Task 7 — UI báo cáo, a11y và ca 403

- [x] `/me/children/{uuid}/report/advanced` hiện đủ mục.
- [x] Mục dưới ngưỡng hiện trạng thái kèm số phiên còn thiếu; **không ẩn**.
- [x] `BR-ARP-03`: mỗi biểu đồ có mô tả văn bản tương đương.
- [x] Test render toàn bộ biểu đồ và kiểm nhãn thay thế.
- [x] Không biểu đồ nào truyền tải thông tin **chỉ** bằng màu.
- [x] Ca 403 hiện bản mẫu **tĩnh** có nhãn "ví dụ" và nút nâng cấp.
- [x] Không số nào của trẻ xuất hiện trong ca 403.
- [x] Chọn 30 và 90 ngày đổi dữ liệu, không đổi cấu trúc mục.
- [x] Không câu nào dự đoán tương lai.
- [x] Không câu nào so chuẩn ngoài hay so với trẻ khác.
- [x] Cổng `D-NE` chạy trên chuỗi UI.
- [x] Đi hết trang bằng bàn phím; đạt
      [`accessibility.md`](../specs/08-quality/accessibility.md).
- [x] `pnpm test:e2e -- advanced-report` xanh.

## Checkpoint D — Content và UI trả phí

- [x] Skill trong curriculum MVP có gợi ý hoặc điểm cắt canonical.
- [x] UI/a11y/static 403/language gate + human review xanh.

## Task 8 — Evidence và promote P3.7

- [x] Mỗi `BR-ARP-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [x] Cổng ngôn ngữ có ca âm và đang chạy trong `pnpm check`.
- [x] Thư viện gợi ý đạt cổng cuối của Task 6.
- [x] [`advanced-report.md`](../specs/03-account/advanced-report.md) → `implemented`.
- [x] Tick **P3.7** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

## Cổng dừng cuối

- [x] `pnpm check` xanh.
- [x] `pnpm test` xanh.
- [x] `pnpm test:e2e` xanh.
- [x] `pnpm lint:specs` xanh.
- [x] `pnpm check:progress` xanh.
- [x] Human review diff migration, engine đếm, route, UI và từng lô nội dung.
- [x] Không xuất PDF, không báo cáo lớp học.
- [x] Không phạm vi P3.8 lọt vào: không trang công khai.
- [x] Không auto-merge, không migration ngoài local.
