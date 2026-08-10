# Checklist — Task #38: P1.12 — Báo cáo cơ bản, trang chính phụ huynh & thư viện cá nhân

> Kế hoạch: [`38-p1-12-report-dashboard-library-plan.md`](38-p1-12-report-dashboard-library-plan.md).
> Ràng buộc khó nhất là **ngôn ngữ**: báo cáo nói về *hiệu suất trong hệ thống*, không phải
> *năng lực của đứa trẻ*. Cấm chẩn đoán, cấm so sánh, cấm phần trăm thành thạo.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.11b đã đóng** — lớp truy vấn tìm kiếm dùng chung.
- [ ] **P1.11 đã đóng** — có nội dung thật.
- [ ] **P1.7 đã đóng** — rollup có số thật.
- [ ] Human approve kế hoạch và sáu quyết định D-HS · D-HT · D-HU · D-HV · D-HW · D-HX.
- [ ] Đối chiếu `BR-BRP-*` `BR-MDB-*` `BR-MLB-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Bảng nhãn và cổng ngôn ngữ

- [ ] Năm nhãn §7.3 khai thành enum.
- [ ] Mọi chuỗi nhãn trong báo cáo lấy từ enum đó.
- [ ] Câu miễn trừ §7.2 là hằng số một chỗ.
- [ ] `BR-BRP-03` câu miễn trừ hiện trên **mọi** màn hình báo cáo.
- [ ] Cổng quét: "chậm" · "kém" · "có vấn đề" · "dưới chuẩn" · "IQ" · "rối loạn" · "chẩn đoán" → đỏ.
- [ ] `BR-BRP-04` cổng quét so sánh: "hơn" · "so với các bé" · "chuẩn độ tuổi" → đỏ.
- [ ] Ca âm cho **từng** nhóm chuỗi.
- [ ] `BR-BRP-02` nhãn khớp bảng của adaptive-engine §7.4.

### Task 2 — Báo cáo cơ bản

- [ ] `GET /api/users/children/{uuid}/reports/basic?period=7d|30d`.
- [ ] Mục 1 Hoạt động: số phiên · tổng phút · số ngày chơi.
- [ ] Mục 2 Hoàn thành: tỉ lệ hoàn thành level đã mở.
- [ ] Mục 3 Kỹ năng đã tiếp xúc: skill + nhãn thành thạo.
- [ ] Mục 4 Trò chơi yêu thích: 3 level chơi nhiều nhất.
- [ ] Mục 5 Gần đây: 5 phiên gần nhất + sao.
- [ ] Mục 6 Gợi ý: 3 hoạt động tuần tới, **≥1 ngoài màn hình** (`D-BB`).
- [ ] `BR-BRP-07` mỗi mục có một câu giải thích tiếng Việt thường.
- [ ] `BR-BRP-01` ca âm: không truy vấn nào chạm `telemetry_events`.
- [ ] `D-HT` ca âm: không truy vấn nào chạm `mastery_state`.
- [ ] `BR-BRP-06` < 3 phiên → nhãn `Chưa có đủ dữ liệu`.
- [ ] `BR-BRP-08` ca âm: response không có `p_learn` hay phần trăm thành thạo.
- [ ] `BR-BRP-05` trẻ của người khác → **404**.
- [ ] Thiếu `view_basic_report` → **403**.
- [ ] Chưa chơi lần nào → thông báo thân thiện + 3 gợi ý game.
- [ ] Trẻ `archived` xem được, chỉ đọc.
- [ ] Nhiều version nội dung → ghi chú "nội dung đã cập nhật".

### Task 3 — Digest tuần

- [ ] Nội dung dựng từ cùng dữ liệu báo cáo 7 ngày.
- [ ] Dùng cùng bảng nhãn và câu miễn trừ.
- [ ] Cờ `weekly_digest_enabled` mặc định **true**.
- [ ] Ca âm: cờ `false` → không gửi.
- [ ] Gửi qua `email:send`, `jobId = notification_id` (`BR-NOT-05`).
- [ ] Ca âm: gửi hai lần cùng tuần → **một** email.
- [ ] Trẻ chưa chơi gì trong tuần → không gửi email rỗng.
- [ ] Ghi nợ: màn hình tắt/bật → **P1.14**.

### Task 4 — Trang chính phụ huynh

- [ ] `GET /api/users/dashboard` trả đủ 5 khoá; khối rỗng là mảng rỗng.
- [ ] Khối 1 Việc cần xử lý; ẩn khi không có.
- [ ] Khối 2 Các bé.
- [ ] Khối 3 Tiến độ gần đây + link báo cáo.
- [ ] Khối 4 Chương trình đang học — **ẩn hoàn toàn ở P1** (`D-HV`).
- [ ] Khối 5 Gói của bạn.
- [ ] `BR-MDB-01` chưa có hồ sơ trẻ → chỉ CTA tạo hồ sơ.
- [ ] Thẻ trẻ đủ 6 mục §7.2.
- [ ] `BR-MDB-06` không so sánh giữa các trẻ; không điểm số, không xếp hạng.
- [ ] `BR-MDB-02` "Cho bé chơi" gọi endpoint activate của P1.9.
- [ ] `BR-MDB-04` ca âm: không quét event thô.
- [ ] `BR-MDB-05` quota chỉ hiện khi **>80%**.
- [ ] `BR-MDB-07` cổng đếm: tối đa **một** CTA nâng cấp mỗi trang; hai → đỏ.
- [ ] Nhánh: chưa xác thực email → banner.
- [ ] Nhánh: gói sắp hết hạn <7 ngày → banner, không chặn.
- [ ] Nhánh: gói hết hạn → banner + nội dung trả phí hiện khoá.
- [ ] Nhánh: có đơn thanh toán chờ → khối trạng thái trên cùng.

### Task 5 — Thư viện cá nhân

- [ ] Bảng `library_items` PK `(user_id, entity_type, entity_id)`.
- [ ] Bảng collection.
- [ ] `BR-MLB-01` ca âm: bản gốc đổi tiêu đề → thư viện hiện tiêu đề mới.
- [ ] `BR-MLB-02` lưu được nội dung khoá; thẻ hiện khoá + CTA.
- [ ] `BR-MLB-03` ca âm: `user_tags` không lộ qua `GET /api/guest/tags`.
- [ ] `BR-MLB-04` ca âm: không route nào trả thư viện user khác.
- [ ] `BR-MLB-05` nội dung `archived` vẫn hiện, nhãn "không còn khả dụng".
- [ ] `BR-MLB-06` quota collection **20**; vượt → 402.
- [ ] `BR-MLB-07` không chứa nội dung do User tạo.
- [ ] `GET /api/users/library` trần 100.
- [ ] `POST /api/users/library/items` → 201; đã lưu → **409**.
- [ ] `DELETE /api/users/library/items/{type}/{id}` chỉ xoá bookmark.
- [ ] `POST /api/users/collections` → 402 nếu vượt 20.
- [ ] `D-HW` tìm kiếm trong thư viện dùng lớp truy vấn P1.11b; ca âm không truy vấn riêng.
- [ ] Chưa lưu gì → gợi ý 5 nội dung phù hợp trẻ đang hoạt động.

## Cổng dừng

- [ ] Phụ huynh thật: đăng nhập → dashboard → báo cáo của con → sáu mục có nghĩa.
- [ ] Cổng ngôn ngữ **đỏ** trên fixture chẩn đoán và fixture so sánh.
- [ ] Không truy vấn báo cáo nào chạm `telemetry_events` hay `mastery_state`.
- [ ] Mỗi trang người lớn tối đa **một** CTA nâng cấp.
- [ ] Thư viện không rò sang user khác; nội dung khoá không mang `content_pack`.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence và promote

- [ ] Mỗi `BR-BRP-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-MDB-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-MLB-*` có test tham chiếu mã rule.
- [ ] [`basic-report.md`](../specs/03-account/basic-report.md) → `implemented`.
- [ ] [`member-dashboard.md`](../specs/03-account/member-dashboard.md) → `implemented`.
- [ ] [`my-library.md`](../specs/03-account/my-library.md) → `implemented`.
- [ ] Nợ sang P1.14: màn hình tắt/bật digest tuần.
- [ ] Nợ sang P3: khối curriculum · bố cục nhiều trẻ · thư viện theo từng trẻ.
- [ ] Tick **P1.12** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.
