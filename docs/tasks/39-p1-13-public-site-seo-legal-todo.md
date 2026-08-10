# Checklist — Task #39: P1.13 — Public site, SEO & trang pháp lý

> Kế hoạch: [`39-p1-13-public-site-seo-legal-plan.md`](39-p1-13-public-site-seo-legal-plan.md).
> Thứ tự: SEO → catalog → detail → landing → legal → FAQ → banner (`D-HY`).
> Tuyệt đối: **không script bên thứ ba** trên trang công khai (`D-IC`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.11 + P1.11b đã đóng** — 120 game và lớp truy vấn chung.
- [ ] **P1.1 đã đóng** — ngân sách LCP/bundle có cổng.
- [ ] Human approve kế hoạch và sáu quyết định D-HY · D-HZ · D-IA · D-IB · D-IC · D-ID.
- [ ] Đối chiếu `BR-SEO2-*` `BR-GCP-*` `BR-GDP-*` `BR-LND-*` `BR-LGL-*` `BR-FAQ-*` `BR-CKB-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Hạ tầng SEO

- [ ] `BR-SEO2-04` mọi trang public có `title` · `meta description` · `canonical` · `og:*`.
- [ ] `BR-SEO2-02` sitemap sinh động; ca âm publish level → có trong sitemap không cần deploy.
- [ ] `BR-SEO2-03` JSON-LD sinh từ dữ liệu.
- [ ] `BR-SEO2-01` `/play/**` và `/me/**` mang `noindex`; ca âm quét.
- [ ] `D-CT` `og:image` sinh động từ emoji + tiêu đề + background.
- [ ] `BR-SEO2-09` `hreflang` chỉ `vi-VN`.
- [ ] `D-IB` bảng index: 6 trang competency + 3 trang độ tuổi.
- [ ] Tổ hợp bộ lọc khác → canonical hoặc `noindex`.
- [ ] `robots.txt` khớp bảng cấu hình.

### Task 2 — Hai cổng cắt ngang

- [ ] Cổng quét `<script src=` host ngoài trên trang công khai → đỏ.
- [ ] Cổng quét iframe bên thứ ba · font CDN ngoài · pixel → đỏ.
- [ ] Ca âm: thêm script bên thứ ba vào trang pháp lý → đỏ.
- [ ] E2E **JS tắt**: trang chủ có nội dung chính.
- [ ] E2E **JS tắt**: catalog có danh sách game.
- [ ] E2E **JS tắt**: trang chi tiết có tiêu đề và mô tả.
- [ ] `BR-SEO2-06` ca âm cloaking: render cho bot và cho người **giống nhau**.
- [ ] `BR-LND-08` LCP < **2,5 s** trên 4G throttle.
- [ ] Trang public đầu tiên ≤ **500 KB**.

### Task 3 — Catalog công khai

- [ ] `BR-GCP-01` hiện metadata mọi game, kể cả game khoá.
- [ ] `BR-GCP-02` ca âm: game khoá **không** có `content_pack` trong response.
- [ ] `BR-GCP-06` chỉ game `published`.
- [ ] `BR-GCP-03` bộ lọc phản ánh vào URL.
- [ ] `BR-GCP-08` trần **60**; `D-CU` phân trang **số**, không cuộn vô hạn.
- [ ] `BR-GCP-04` prerender/ISR, không phụ thuộc JS.
- [ ] `BR-GCP-05` trạng thái khoá **trung tính**, không hù doạ.
- [ ] `BR-GCP-07` mỗi game có URL riêng index được.
- [ ] Dùng lớp truy vấn P1.11b, không truy vấn riêng.

### Task 4 — Trang chi tiết game

- [ ] `BR-GDP-01` 120 URL index được.
- [ ] `BR-GDP-02` mô tả không tiết lộ đáp án.
- [ ] `BR-GDP-03` game `archived` → **410**, không 404.
- [ ] `D-IA` game archived **không** còn trong sitemap.
- [ ] Cổng: mọi URL trong sitemap trả **200**.
- [ ] `BR-GDP-04` JSON-LD `LearningResource` sinh từ dữ liệu.
- [ ] `BR-GDP-05` khoá → không `content_pack`.
- [ ] `BR-GDP-06` CTA đổi theo bậc thiếu; ca âm ba trạng thái người xem.
- [ ] `BR-GDP-07` link tới trang skill và competency.
- [ ] `BR-GDP-08` không hứa hẹn kết quả học tập.
- [ ] `D-CV` 3 ảnh xem trước tĩnh từ Designer.

### Task 5 — Trang chủ

- [ ] `BR-LND-01` nút chơi thử ở màn hình đầu, không cần cuộn.
- [ ] `BR-LND-02` chơi thử không cần đăng ký.
- [ ] `D-AY` 6 game nổi bật trùng allow-list guest.
- [ ] `BR-LND-03` prerender tĩnh.
- [ ] `BR-LND-05` giá từ `PACKAGE_CATALOG`; ca âm không số tiền hardcode.
- [ ] `BR-LND-06` cổng ngôn ngữ: không "thông minh hơn" · "tăng IQ" · hứa hẹn kết quả.
- [ ] `BR-LND-07` ca âm: không ảnh trẻ em thật (quét ảnh và alt text).
- [ ] `BR-LND-04` không tracking bên thứ ba.

### Task 6 — Trang pháp lý

- [ ] Mỗi chính sách có **số version** và **ngày hiệu lực** hiển thị.
- [ ] `BR-LGL-02` ca âm: URL version cũ vẫn 200 sau khi có version mới.
- [ ] `BR-LGL-04` chính sách trẻ em là trang **riêng**.
- [ ] `BR-LGL-08` link chính sách trẻ em ở **chân mọi trang**.
- [ ] `BR-LGL-06` mỗi mục có tóm tắt đầu mục.
- [ ] `BR-LGL-05` đổi version → thông báo User đã đăng nhập.
- [ ] `BR-LGL-03` không script bên thứ ba.
- [ ] `D-HZ` cờ `legal_review_status` trên mỗi bản chính sách.
- [ ] Cổng deploy production **đỏ** khi còn bản `pending_review`.
- [ ] Ca âm: đặt một chính sách `pending_review` → cổng deploy đỏ.
- [ ] Đồng ý của User trỏ **version cụ thể** trong `consent_logs`.

### Task 7 — FAQ và banner cookie

- [ ] `BR-FAQ-01` mỗi câu có URL neo riêng.
- [ ] `BR-FAQ-02` câu pháp lý **link** tới chính sách, không copy.
- [ ] `BR-FAQ-03` schema `FAQPage` sinh từ dữ liệu.
- [ ] `BR-FAQ-04` nội dung là **dữ liệu**, không hardcode trong component.
- [ ] `BR-FAQ-05` trả lời thẳng ở câu đầu.
- [ ] `BR-FAQ-06` có câu nói thẳng giới hạn sản phẩm.
- [ ] `D-AX` hiển thị email `support@kidthink.vn` + Zalo OA.
- [ ] `BR-CKB-01` chỉ cookie kỹ thuật thiết yếu.
- [ ] `BR-CKB-04` không cookie bên thứ ba.
- [ ] `BR-CKB-05` `/cookie` liệt kê từng cookie: tên · mục đích · thời hạn, sinh từ dữ liệu.
- [ ] `BR-CKB-02` banner không chặn nội dung, không modal toàn màn hình.
- [ ] `BR-CKB-03` ca âm: không banner trên bề mặt trẻ.
- [ ] `BR-CKB-07` đóng banner → không hiện lại **12 tháng**.
- [ ] `BR-CKB-06` ca âm: thêm cookie không thiết yếu → cổng đòi cơ chế đồng ý thật.

## Cổng dừng

- [ ] Tắt JS: trang chủ · catalog · chi tiết vẫn đọc được.
- [ ] Không cloaking.
- [ ] Không script bên thứ ba trên trang công khai nào.
- [ ] Sitemap ↔ 410 nhất quán hai chiều.
- [ ] Chỉ 6 trang competency + 3 trang tuổi được index.
- [ ] Mọi chính sách có version và URL vĩnh viễn; `pending_review` chặn deploy.
- [ ] Không ảnh trẻ em thật; không hứa hẹn kết quả học tập.
- [ ] LCP < 2,5 s trên 4G; trang đầu ≤500 KB.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 8 — Evidence và promote

- [ ] Mỗi `BR-SEO2-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-GCP-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-GDP-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-LND-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-LGL-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-FAQ-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-CKB-*` có test tham chiếu mã rule.
- [ ] Bảy spec `02-public` → `implemented`.
- [ ] Nợ sang **P2.8**: sửa nội dung FAQ/SEO qua studio.
- [ ] Tick **P1.13** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] DPIA có phải đăng ký với cơ quan quản lý — **chặn P1**, chủ là người quyết.
- [ ] Chính sách hoàn tiền — **P2.3**, chủ là người quyết.
