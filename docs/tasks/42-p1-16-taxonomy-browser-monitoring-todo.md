# Checklist — Task #42: P1.16 — Trình duyệt taxonomy & giám sát hệ thống

> Kế hoạch: [`42-p1-16-taxonomy-browser-monitoring-plan.md`](42-p1-16-taxonomy-browser-monitoring-plan.md).
> Bước **cuối** của P1. Hai nhánh chạy song song được: giám sát (T1–T4) và taxonomy (T5–T6).
> Tuyệt đối: cổng go-live đọc `alerts.yml` (`D-IR`); log không bao giờ chứa PII (`D-IS`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P1.11 đã đóng** — ≥120 level published để cây có số thật.
- [x] **P1.5 đã đóng** — ngưỡng job và `failed` queue có nguồn dữ liệu.
- [x] Bot Telegram và project Healthchecks.io đã tạo; token trong biến môi trường.
- [x] Human approve kế hoạch và sáu quyết định D-IQ · D-IR · D-IS · D-IT · D-IU · D-IV.
- [x] Đối chiếu `BR-MON-*` `BR-TXB-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Adapter alert thật

- [x] Adapter Telegram cho ngưỡng và crash.
- [x] Adapter Healthchecks.io làm dead-man switch cho job/cron.
- [x] Email giữ vai trò **dự phòng** đúng §7.3.
- [x] `D-IQ` cổng: gọi API Telegram ngoài adapter → **đỏ**.
- [x] `BR-MON-04` ca âm: giám sát im 10 phút → alert từ kênh **độc lập**.
- [x] Gộp alert lặp trong **15 phút**.
- [x] Ca âm: lỗi kéo dài 1 giờ → không quá **4** alert.
- [x] `BR-MON-03` ca âm: quét cấu hình — không quy tắc nào ở trạng thái tắt.
- [x] Telegram 5xx → rơi xuống email, và việc rơi được ghi lại.

### Task 2 — `alerts.yml` và cổng go-live

- [x] Ba nhóm §7.2 khai đủ trong `infra/monitoring/alerts.yml`.
- [x] Bảy quy tắc P0 đúng ngưỡng: 503 hai lần · 5xx > 5%/5 phút · DB mất kết nối · backup fail · verify fail · backlog > 500/5 phút · disk < 15%.
- [x] `BR-MON-02` mỗi quy tắc có link runbook.
- [x] Ca âm: quy tắc thiếu runbook → **đỏ**.
- [x] `D-IR` quy tắc chưa có nguồn khai `pending_source` + bước sở hữu.
- [x] Hàng đợi thanh toán → `pending_source: P2.3`.
- [x] Nội dung `in_review` tồn đọng → `pending_source: P2.8`.
- [x] `BR-MON-07` ca âm: quy tắc **P0** thành `pending_source` → cổng go-live **đỏ**.
- [x] Cổng đọc chính `alerts.yml`, không phải danh sách chép tay.
- [x] `BR-MON-01` ca âm: DB mất kết nối → alert tới kênh trực tiếp, không chỉ log.

### Task 3 — Log có cấu trúc và bộ lọc PII

- [x] Hình dạng log đúng §7.4 với `request_id`.
- [x] `D-IS` redactor deny-list bảy trường, áp cho **mọi** bản ghi.
- [x] `BR-MON-05` ca âm: log object đủ bảy trường → đầu ra sạch.
- [x] Redactor áp cả nhánh `catch` và log của worker.
- [x] Ca âm nối `D-IP` (P1.15): access token của provider không vào log.
- [x] `BR-MON-06` lỗi client về `error_log` có **sampling**; tỉ lệ khai dạng cấu hình.
- [x] `@sentry/nuxt` đọc DSN từ biến môi trường.
- [x] Thiếu DSN → app chạy bình thường, chỉ mất kênh thu lỗi client.

### Task 4 — Bề mặt xem trong admin

- [x] `GET /api/managers/system/metrics` cần `super_admin`; `content_reviewer` → **403**.
- [x] Trả snapshot bốn SLO §7.1.
- [x] Trả alert **đang mở** kèm thời điểm và link runbook.
- [x] SLO chưa có nguồn (payment) hiện `pending_source`, không hiện số bịa.

### Task 5 — Cây taxonomy

- [x] Cây 4 tầng gấp mở được đúng §7.1.
- [x] `BR-TXB-01` ca âm: không route ghi nào dưới `/api/managers/taxonomy`; gọi thử → 405 hoặc không tồn tại.
- [x] `BR-TXB-02` mỗi nút hiện số **published**, đếm riêng `draft`.
- [x] `BR-TXB-03` skill 0 level published mang chỉ báo nổi bật.
- [x] `BR-TXB-06` cache **5 phút**; số đếm kèm `as_of` hiện cạnh số.
- [x] `D-IT` hằng số ngưỡng "đủ" = **3**, có test khoá giá trị.
- [x] Chú giải nói rõ: "mỏng" là kỳ vọng ở MVP, không phải lỗi.
- [x] Bốn chỉ báo §7.3 đúng: chưa có · mỏng · đủ · LO chưa phủ.
- [x] `?gaps_only=true` chỉ trả skill 0 level published.
- [x] `super_admin` và `content_reviewer` đều đọc được (200).
- [x] Skill `deprecated` hiện mờ, không cho soạn mới.

### Task 6 — Chi tiết skill

- [x] Sáu phần §7.2 đủ.
- [x] `BR-TXB-05` đồ thị prerequisite hai chiều: đứng sau cái gì, mở khoá cái gì.
- [x] `D-IU` nút "soạn level cho skill này" mở đường seeder với `skill_code` điền sẵn.
- [x] Ca âm `D-IU`: nút không dẫn tới 404.
- [x] Muốn sửa taxonomy → thông báo "đổi qua PR" + link tài liệu, không form.
- [x] `D-IV` ca âm: không thêm nav toàn cục · breadcrumb framework · hệ thống quyền menu.

## Cổng dừng

- [x] Alert P0 tới Telegram **thật** trong staging, không phải mock.
- [x] Dead-man switch phát alert khi giám sát im 10 phút.
- [x] Ca âm `BR-MON-07`: bỏ một quy tắc P0 → cổng go-live đỏ.
- [x] Ca âm `BR-MON-05`: bảy trường PII bị lọc khỏi log.
- [x] Cây taxonomy chỉ đọc; không route ghi nào tồn tại.
- [x] Số đếm có `as_of`; ngưỡng "đủ" vẫn là 3.
- [x] Nút soạn không dẫn tới 404.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 7 — Evidence, promote và cổng ra P1

- [x] Mỗi `BR-MON-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-TXB-*` có test tham chiếu mã rule.
- [x] [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md) → `implemented`.
- [x] [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) → `implemented`.
- [x] Kiểm cổng ra P1: 43 spec P1 `implemented`.
- [x] Kiểm cổng ra P1: một trẻ chơi hết một level thật, điểm về server, phụ huynh thấy trong báo cáo.
- [x] Nợ sang **P2.1**: re-host trang taxonomy vào admin shell.
- [x] Nợ sang **P2.6**: trỏ nút soạn sang studio.
- [x] Nợ sang **P2.10**: màn hình nhật ký đầy đủ.
- [x] Tick **P1.16** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] **Ai trực?** — kênh đã chạy nhưng chưa có người nhận. **Chặn go-live** theo `BR-MON-07`, chủ là người quyết.
- [ ] SLO 99,7% có ràng buộc hợp đồng không — **P1**, người quyết, không chặn code.
- [ ] Sentry SaaS hay GlitchTip tự host — thuộc [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q8, chủ là Infra; T3 đã biến nó thành lựa chọn DSN.
- [ ] Ngưỡng "đủ" 3 level so với mục tiêu MVP ≥120 level — câu gốc là `D-W` ở [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) §11 Q1; **không** hạ ngưỡng.
