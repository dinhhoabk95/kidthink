# Checklist — Task #39: P1.13 — Public site, SEO & trang pháp lý

> Kế hoạch: [`39-p1-13-public-site-seo-legal-plan.md`](39-p1-13-public-site-seo-legal-plan.md).
> Thứ tự: SEO → catalog → detail → landing → legal → FAQ → banner (`D-HY`).
> Tuyệt đối: **không script bên thứ ba** trên trang công khai (`D-IC`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P1.11 + P1.11b đã đóng** — 120 game và lớp truy vấn chung.
- [x] **P1.1 đã đóng** — ngân sách LCP/bundle có cổng.
- [x] Human approve kế hoạch và sáu quyết định D-HY · D-HZ · D-IA · D-IB · D-IC · D-ID.
- [x] Đối chiếu `BR-SEO2-*` `BR-GCP-*` `BR-GDP-*` `BR-LND-*` `BR-LGL-*` `BR-FAQ-*` `BR-CKB-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Hạ tầng SEO

- [x] `BR-SEO2-04` mọi trang public có `title` · `meta description` · `canonical` · `og:*`.
- [x] `BR-SEO2-02` sitemap sinh động; ca âm publish level → có trong sitemap không cần deploy.
- [x] `BR-SEO2-03` JSON-LD sinh từ dữ liệu.
- [x] `BR-SEO2-01` `/play/**` và `/me/**` mang `noindex`; ca âm quét.
- [x] `D-CT` `og:image` sinh động từ emoji + tiêu đề + background.
- [x] `BR-SEO2-09` `hreflang` chỉ `vi-VN`.
- [x] `D-IB` bảng index: 6 trang competency + 3 trang độ tuổi.
- [x] Tổ hợp bộ lọc khác → canonical hoặc `noindex`.
- [x] `robots.txt` khớp bảng cấu hình.

### Task 2 — Hai cổng cắt ngang

- [x] Cổng quét `<script src=` host ngoài trên trang công khai → đỏ.
- [x] Cổng quét iframe bên thứ ba · font CDN ngoài · pixel → đỏ.
- [x] Ca âm: thêm script bên thứ ba vào trang pháp lý → đỏ.
- [x] E2E **JS tắt**: trang chủ có nội dung chính.
- [x] E2E **JS tắt**: catalog có danh sách game.
- [x] E2E **JS tắt**: trang chi tiết có tiêu đề và mô tả.
- [x] `BR-SEO2-06` ca âm cloaking: render cho bot và cho người **giống nhau**.
- [x] `BR-LND-08` LCP < **2,5 s** trên 4G throttle.
- [x] Trang public đầu tiên ≤ **500 KB**.

### Task 3 — Catalog công khai

- [x] `BR-GCP-01` hiện metadata mọi game, kể cả game khoá.
- [x] `BR-GCP-02` ca âm: game khoá **không** có `content_pack` trong response.
- [x] `BR-GCP-06` chỉ game `published`.
- [x] `BR-GCP-03` bộ lọc phản ánh vào URL.
- [x] `BR-GCP-08` trần **60**; `D-CU` phân trang **số**, không cuộn vô hạn.
- [x] `BR-GCP-04` prerender/ISR, không phụ thuộc JS.
- [x] `BR-GCP-05` trạng thái khoá **trung tính**, không hù doạ.
- [x] `BR-GCP-07` mỗi game có URL riêng index được.
- [x] Dùng lớp truy vấn P1.11b, không truy vấn riêng.

### Task 4 — Trang chi tiết game

- [x] `BR-GDP-01` 120 URL index được.
- [x] `BR-GDP-02` mô tả không tiết lộ đáp án.
- [x] `BR-GDP-03` game `archived` → **410**, không 404.
- [x] `D-IA` game archived **không** còn trong sitemap.
- [x] Cổng: mọi URL trong sitemap trả **200**.
- [x] `BR-GDP-04` JSON-LD `LearningResource` sinh từ dữ liệu.
- [x] `BR-GDP-05` khoá → không `content_pack`.
- [x] `BR-GDP-06` CTA đổi theo bậc thiếu; ca âm ba trạng thái người xem.
- [x] `BR-GDP-07` link tới trang skill và competency.
- [x] `BR-GDP-08` không hứa hẹn kết quả học tập.
- [x] `D-CV` 3 ảnh xem trước tĩnh từ Designer.

### Task 5 — Trang chủ

- [x] `BR-LND-01` nút chơi thử ở màn hình đầu, không cần cuộn.
- [x] `BR-LND-02` chơi thử không cần đăng ký.
- [x] `D-AY` 6 game nổi bật trùng allow-list guest.
- [x] `BR-LND-03` prerender tĩnh.
- [x] `BR-LND-05` giá từ `PACKAGE_CATALOG`; ca âm không số tiền hardcode.
- [x] `BR-LND-06` cổng ngôn ngữ: không "thông minh hơn" · "tăng IQ" · hứa hẹn kết quả.
- [x] `BR-LND-07` ca âm: không ảnh trẻ em thật (quét ảnh và alt text).
- [x] `BR-LND-04` không tracking bên thứ ba.

### Task 6 — Trang pháp lý

- [x] Mỗi chính sách có **số version** và **ngày hiệu lực** hiển thị.
- [x] `BR-LGL-02` ca âm: URL version cũ vẫn 200 sau khi có version mới.
- [x] `BR-LGL-04` chính sách trẻ em là trang **riêng**.
- [x] `BR-LGL-08` link chính sách trẻ em ở **chân mọi trang**.
- [x] `BR-LGL-06` mỗi mục có tóm tắt đầu mục.
- [x] `BR-LGL-05` đổi version → thông báo User đã đăng nhập.
- [x] `BR-LGL-03` không script bên thứ ba.
- [x] `D-HZ` cờ `legal_review_status` trên mỗi bản chính sách.
- [x] Cổng deploy production **đỏ** khi còn bản `pending_review`.
- [x] Ca âm: đặt một chính sách `pending_review` → cổng deploy đỏ.
- [x] Đồng ý của User trỏ **version cụ thể** trong `consent_logs`.

### Task 7 — FAQ và banner cookie

- [x] `BR-FAQ-01` mỗi câu có URL neo riêng.
- [x] `BR-FAQ-02` câu pháp lý **link** tới chính sách, không copy.
- [x] `BR-FAQ-03` schema `FAQPage` sinh từ dữ liệu.
- [x] `BR-FAQ-04` nội dung là **dữ liệu**, không hardcode trong component.
- [x] `BR-FAQ-05` trả lời thẳng ở câu đầu.
- [x] `BR-FAQ-06` có câu nói thẳng giới hạn sản phẩm.
- [x] `D-AX` hiển thị email `support@kidthink.vn` + Zalo OA.
- [x] `BR-CKB-01` chỉ cookie kỹ thuật thiết yếu.
- [x] `BR-CKB-04` không cookie bên thứ ba.
- [x] `BR-CKB-05` `/cookie` liệt kê từng cookie: tên · mục đích · thời hạn, sinh từ dữ liệu.
- [x] `BR-CKB-02` banner không chặn nội dung, không modal toàn màn hình.
- [x] `BR-CKB-03` ca âm: không banner trên bề mặt trẻ.
- [x] `BR-CKB-07` đóng banner → không hiện lại **12 tháng**.
- [x] `BR-CKB-06` ca âm: thêm cookie không thiết yếu → cổng đòi cơ chế đồng ý thật.

## Cổng dừng

- [x] Tắt JS: trang chủ · catalog · chi tiết vẫn đọc được.
- [x] Không cloaking.
- [x] Không script bên thứ ba trên trang công khai nào.
- [x] Sitemap ↔ 410 nhất quán hai chiều.
- [x] Chỉ 6 trang competency + 3 trang tuổi được index.
- [x] Mọi chính sách có version và URL vĩnh viễn; `pending_review` chặn deploy.
- [x] Không ảnh trẻ em thật; không hứa hẹn kết quả học tập.
- [x] LCP < 2,5 s trên 4G; trang đầu ≤500 KB.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 8 — Evidence và promote

- [x] Mỗi `BR-SEO2-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-GCP-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-GDP-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-LND-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-LGL-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-FAQ-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-CKB-*` có test tham chiếu mã rule.
- [x] Bảy spec `02-public` → `implemented`.
- [x] Nợ sang **P2.8**: sửa nội dung FAQ/SEO qua studio.
- [x] Tick **P1.13** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] DPIA có phải đăng ký với cơ quan quản lý — **chặn P1**, chủ là người quyết.
- [ ] Chính sách hoàn tiền — **P2.3**, chủ là người quyết.
