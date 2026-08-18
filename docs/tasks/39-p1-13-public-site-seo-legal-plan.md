# Kế hoạch — Task #39: P1.13 — Public site, SEO & trang pháp lý

> Viết 2026-08-09. Bước sở hữu: **P1.13** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) ·
> [`game-catalog-public.md`](../specs/02-public/game-catalog-public.md) ·
> [`game-detail-public.md`](../specs/02-public/game-detail-public.md) ·
> [`landing-page.md`](../specs/02-public/landing-page.md) ·
> [`legal-pages.md`](../specs/02-public/legal-pages.md) ·
> [`faq-and-help.md`](../specs/02-public/faq-and-help.md) ·
> [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md).
>
> **Ghi chú lịch sử 2026-08-14:** phần legal version/history của Task #39 đã được root D12 và
> `D-QV` của [Task #40](40-p1-14-account-consent-deletion-plan.md) thay thế bằng document
> singleton current-only. Evidence SEO, catalog, landing, FAQ và cookie vẫn giữ nguyên.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Bảy spec, hai mục tiêu không liên quan nhau về kỹ thuật nhưng cùng sống trên một bề mặt:

1. **Kênh acquisition rẻ nhất.** Phụ huynh tìm *"trò chơi tư duy cho bé 4 tuổi"*, không tìm tên
   thương hiệu. Với 120 game, đó là **120 trang đích** — nhưng chỉ khi mỗi trang render được
   server-side, có structured data sinh từ dữ liệu, và có URL index được.
2. **Nghĩa vụ pháp lý.** Trang chính sách không phải nội dung marketing: chúng phải **chính xác**,
   **có version**, và **truy được** — vì đồng ý của User trỏ tới một version cụ thể.

Ràng buộc xuyên suốt và tuyệt đối: **không script bên thứ ba** trên trang công khai. Bốn spec
nói cùng điều đó từ bốn góc (`BR-LND-04`, `BR-SEO2-08`, `BR-LGL-03`, `BR-CKB-04`) — nên nó phải
là **một** cổng, không phải bốn lời nhắc.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `CONTENT-SEARCH` | P1.11b | catalog công khai dùng lớp truy vấn chung |
| `ACCESS-GATING` | P1.3 | metadata hiện, `content_pack` không |
| `CHILD-DATA-COMPLIANCE` | P0.4 | `BR-CDC-08` cấm tracking bên thứ ba |
| `PACKAGE-CATALOG` | P0.5 | giá lấy từ `PACKAGE_CATALOG` (`BR-PKG-02`) |
| Nội dung thật | P1.11 | 120 trang đích cần 120 game |
| `PERFORMANCE-BUDGETS` | P1.1 | LCP < 2,5 s, trang đầu ≤500 KB |

## 1. Đo được

### 1.1 Đã có

Lớp truy vấn tìm kiếm (P1.11b); ≥120 level `published` (P1.11); ngân sách LCP/CLS và cổng bundle
(P1.1); `PACKAGE_CATALOG` (P0.5); Nuxt 4.5 trong `apps/web`.

### 1.2 Chưa có

Toàn bộ trang công khai; sitemap động; JSON-LD; `og:image` động; trang pháp lý và cơ chế version;
banner cookie.

### 1.3 Đã chốt, không mở lại

`D-AW` **không** analytics tự host ở P1 · `D-AY` 6 game nổi bật trùng allow-list guest ·
`D-CU` catalog công khai dùng **phân trang số**, cuộn vô hạn chỉ ở sảnh trẻ ·
`D-CV` P1 dùng **3 ảnh xem trước tĩnh** do Designer cung cấp ·
`D-CS` chỉ index **6 trang competency + 3 trang độ tuổi** ·
`D-CT` `og:image` sinh động bằng Nuxt OgImage · `D-AS` ngân sách pháp lý 50M VND ·
`D-AX` hỗ trợ qua email + Zalo OA.

### 1.4 Hai câu hỏi mở còn lại

| Câu | Ở đâu | Chặn |
|---|---|---|
| DPIA có phải đăng ký với cơ quan quản lý? | legal §11 Q2 (trùng [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) Q2) | **P1**, chủ là người quyết |
| Chính sách hoàn tiền là gì? | legal §11 Q3 | P2, chủ là người quyết |

## 2. Quyết định

**D-HY — thứ tự trong bước: SEO → catalog → detail → landing → legal → FAQ → banner.**
[`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) khai
`depends_on: []` và tự mô tả là **contract cắt ngang** — làm nó trước nghĩa là sáu trang sau chỉ
việc tuân theo, thay vì mỗi trang tự phát minh meta tag. Legal trước banner vì banner
`depends_on: LEGAL-PAGES`. Landing sau catalog vì nó khai `depends_on: GAME-CATALOG-PUBLIC`.

**D-HZ — chính sách phát hành với **nhãn "chưa rà soát pháp lý"**, và nhãn đó là **cổng chặn
production**.** `BR-LGL-07` cấm phát hành chính sách chưa qua rà soát; rà soát là việc người, đã
có ngân sách (`D-AS`) nhưng chưa có kết quả. Hai đường sai: chờ rà soát xong mới viết gì (chặn cả
bước), hoặc phát hành thầm lặng bản nháp (vi phạm rule). Xử: P1.13 giao **cấu trúc, version, URL
vĩnh viễn, cơ chế đồng ý trỏ version** với nội dung nháp mang cờ `legal_review_status`; cổng
deploy production **đỏ** khi còn bản nào `pending_review`. Cờ trong dữ liệu, không phải trong đầu
ai đó.

**D-IA — `410` cho nội dung đã bỏ, và cổng kiểm cả hai chiều với sitemap.** `BR-GDP-03` +
`BR-SEO2-07`: archived → **410** (không 404) **và** gỡ khỏi sitemap. Hai vế phải đi cùng nhau —
410 mà còn trong sitemap là gửi bot vào ngõ cụt; gỡ sitemap mà trả 404 thì bot giữ URL lâu hơn
cần thiết. Cổng: mọi URL trong sitemap trả 200; mọi level `archived` trả 410 và **không** có
trong sitemap.

**D-IB — cấu hình index là **dữ liệu**: 6 trang competency + 3 trang độ tuổi, còn lại canonical
hoặc `noindex`.** `D-CS` đã chốt. Khai thành bảng, vì tổ hợp bộ lọc sinh ra vô số URL và mỗi lần
thêm bộ lọc là một lần có người muốn index thêm. Bảng khai tường minh cái được index; mọi thứ
khác mặc định `noindex` + canonical về trang gốc.

**D-IC — "không script bên thứ ba" là **một cổng**, không phải bốn lời nhắc.** Gom
`BR-LND-04` `BR-SEO2-08` `BR-LGL-03` `BR-CKB-04` `BR-CDC-08`: cổng quét mọi trang công khai tìm
`<script src=` trỏ host ngoài, iframe bên thứ ba, font từ CDN ngoài, pixel. Ca âm: thêm một
`<script src="https://…">` vào trang bất kỳ → **đỏ**. Đây cũng là lý do `D-AW` (không analytics
tự host) không tạo ngoại lệ nào cần bảo trì.

**D-ID — trang công khai render **server-side**, và điều đó đo bằng **tắt JS**, không bằng niềm
tin.** `BR-LND-03` `BR-GCP-04` `BR-SEO2-05`: nội dung chính không phụ thuộc JS. Ca âm: chạy
Playwright với JS **tắt**, trang chủ và trang chi tiết vẫn có tiêu đề, mô tả, và danh sách game.
`BR-SEO2-06` cấm cloaking: nội dung cho bot và người **giống nhau** — ca âm so hai lần render.

## 3. Đồ thị

```
T1 SEO contract: meta · canonical · sitemap động · JSON-LD · og:image · robots
      ├──→ T2 cổng "không script bên thứ ba" + cổng render không JS (D-IC, D-ID)
      └──→ T3 catalog công khai: metadata mọi game · lọc vào URL · phân trang số
                └──→ T4 chi tiết game: 120 URL · 410 khi archived · CTA theo bậc thiếu
                          └──→ T5 landing: chơi thử không đăng ký · giá từ catalog
  T6 legal: version · URL vĩnh viễn · cờ rà soát (D-HZ)
      └──→ T7 FAQ + banner cookie
                              ── Cổng dừng ──
  T8 evidence, promote 7 spec
```

## 4. Task

### Task 1 — Hạ tầng SEO

**Tiêu chí nghiệm thu**
- [ ] `BR-SEO2-04`: mọi trang public có `title`, `meta description`, `canonical`, `og:*`.
- [ ] `BR-SEO2-02`: sitemap sinh **động** từ nội dung `published`; ca âm — publish một level → xuất hiện trong sitemap không cần deploy.
- [ ] `BR-SEO2-03`: JSON-LD sinh **từ dữ liệu**, không viết tay.
- [ ] `BR-SEO2-01`: bề mặt trẻ (`/play/**`) và tài khoản (`/me/**`) mang `noindex`; ca âm quét.
- [ ] `D-CT`: `og:image` sinh động từ emoji + tiêu đề + background (Nuxt OgImage).
- [ ] `BR-SEO2-09`: `hreflang` chỉ `vi-VN`.
- [ ] `D-IB`: bảng cấu hình index — 6 trang competency + 3 trang độ tuổi được index; tổ hợp khác `noindex` + canonical.
- [ ] `robots.txt` khớp bảng cấu hình.

**Kiểm chứng**
- [ ] `pnpm test -- seo-infra` xanh, assertion tham chiếu `BR-SEO2-01` `BR-SEO2-02` `BR-SEO2-03`.

**Phụ thuộc:** P1.11 · **Cỡ:** M

### Task 2 — Hai cổng cắt ngang

**Tiêu chí nghiệm thu**
- [ ] `D-IC`: cổng quét mọi trang công khai — `<script src=` host ngoài, iframe bên thứ ba, font CDN ngoài, pixel → **đỏ**.
- [ ] Ca âm: thêm một script bên thứ ba vào trang pháp lý → cổng đỏ.
- [ ] `D-ID`: E2E với **JS tắt** — trang chủ, catalog, chi tiết vẫn có nội dung chính.
- [ ] `BR-SEO2-06`: ca âm cloaking — render cho user-agent bot và cho trình duyệt cho **cùng** nội dung.
- [ ] `BR-LND-08`: LCP < **2,5 s** trên 4G throttle, dùng cổng của P1.1.
- [ ] Trang public đầu tiên ≤ **500 KB** tổng (ngân sách P1.1).

**Kiểm chứng**
- [ ] `pnpm test:e2e -- no-js && pnpm lint:public-scripts` xanh; fixture vi phạm → đỏ.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Catalog công khai

**Tiêu chí nghiệm thu**
- [ ] `BR-GCP-01`: hiện **metadata mọi game**, kể cả game khoá.
- [ ] `BR-GCP-02`: ca âm — response **không** chứa `content_pack` cho game khoá (dùng lại `D-HM` của P1.11b).
- [ ] `BR-GCP-06`: chỉ game `published`.
- [ ] `BR-GCP-03`: bộ lọc phản ánh vào **URL**, chia sẻ được và index được theo bảng `D-IB`.
- [ ] `BR-GCP-08` + `D-CU`: **phân trang số**, trần **60**; không cuộn vô hạn.
- [ ] `BR-GCP-04`: prerender/ISR, không phụ thuộc JS (kiểm bằng T2).
- [ ] `BR-GCP-05`: trạng thái khoá hiện **trung tính**, không hù doạ.
- [ ] `BR-GCP-07`: mỗi game có URL riêng index được.
- [ ] Dùng lớp truy vấn của P1.11b, không truy vấn riêng.

**Kiểm chứng**
- [ ] `pnpm test -- public-catalog` xanh, assertion tham chiếu `BR-GCP-01` `BR-GCP-02` `BR-GCP-08`.

**Phụ thuộc:** T2 · P1.11b · **Cỡ:** M

### Task 4 — Trang chi tiết game

**Tiêu chí nghiệm thu**
- [ ] `BR-GDP-01`: **mỗi** game một URL index được — 120 trang.
- [ ] `BR-GDP-02`: mô tả đủ hiểu game dạy gì **mà không tiết lộ đáp án**; dòng checklist khi soạn nội dung.
- [ ] `BR-GDP-03` + `D-IA`: game `archived` → **410**, **không** 404; và **không** còn trong sitemap.
- [ ] Cổng hai chiều: mọi URL trong sitemap trả 200; mọi level archived trả 410.
- [ ] `BR-GDP-04`: JSON-LD `LearningResource` sinh từ dữ liệu.
- [ ] `BR-GDP-05`: khoá → không `content_pack`.
- [ ] `BR-GDP-06`: CTA đổi theo **bậc còn thiếu** — "Đăng nhập" và "Nâng cấp Premium" là hai CTA khác nhau; ca âm ba trạng thái người xem.
- [ ] `BR-GDP-07`: link tới trang skill và competency.
- [ ] `BR-GDP-08`: không hứa hẹn kết quả học tập (dùng chung cổng ngôn ngữ với `BR-LND-06`).
- [ ] `D-CV`: 3 ảnh xem trước **tĩnh** do Designer cung cấp.

**Kiểm chứng**
- [ ] `pnpm test -- game-detail-public` xanh, assertion tham chiếu `BR-GDP-03` `BR-GDP-06`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Trang chủ

**Tiêu chí nghiệm thu**
- [ ] `BR-LND-01`: nút **chơi thử** ở màn hình đầu, không cần cuộn.
- [ ] `BR-LND-02`: chơi thử **không cần đăng ký**; 6 game nổi bật trùng allow-list guest (`D-AY`).
- [ ] `BR-LND-03`: prerender tĩnh, nội dung chính không phụ thuộc JS.
- [ ] `BR-LND-05`: giá lấy từ `PACKAGE_CATALOG`; ca âm — không số tiền hardcode trong trang.
- [ ] `BR-LND-06`: cổng ngôn ngữ — không "thông minh hơn", "tăng IQ", hay hứa hẹn kết quả học tập.
- [ ] `BR-LND-07`: **không** ảnh trẻ em thật; ca âm quét thư mục ảnh và alt text.
- [ ] `BR-LND-04`: không tracking bên thứ ba (cổng T2).
- [ ] `BR-LND-08`: LCP < 2,5 s trên 4G.

**Kiểm chứng**
- [ ] `pnpm test -- landing` xanh, assertion tham chiếu `BR-LND-02` `BR-LND-05` `BR-LND-06`.

**Phụ thuộc:** T4 · **Cỡ:** M

### Task 6 — Trang pháp lý

**Tiêu chí nghiệm thu**
- [ ] Danh sách trang bắt buộc, mỗi trang có **số version** và **ngày hiệu lực** hiển thị (`BR-LGL-01`).
- [ ] `BR-LGL-02`: version cũ **giữ vĩnh viễn**, truy cập được qua URL; ca âm — URL version cũ vẫn 200 sau khi có version mới.
- [ ] `BR-LGL-04`: chính sách trẻ em là **trang riêng**, không nhét vào privacy.
- [ ] `BR-LGL-08`: link tới chính sách trẻ em ở **chân mọi trang**.
- [ ] `BR-LGL-06`: mỗi mục có tóm tắt đầu mục, ngôn ngữ rõ ràng.
- [ ] `BR-LGL-05`: đổi version → thông báo User đã đăng nhập (nối `BR-CSM-03`, màn hình đồng ý ở P1.14).
- [ ] `BR-LGL-03`: không script bên thứ ba (cổng T2).
- [ ] `BR-LGL-07` + `D-HZ`: cờ `legal_review_status`; cổng deploy production **đỏ** khi còn bản `pending_review`.
- [ ] Ca âm: đặt một chính sách về `pending_review` → cổng deploy đỏ.
- [ ] Đồng ý của User trỏ **version cụ thể** (dữ liệu `consent_logs` của P0.4).

**Kiểm chứng**
- [ ] `pnpm test -- legal-pages` xanh, assertion tham chiếu `BR-LGL-02` `BR-LGL-07`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 7 — FAQ và banner cookie

**Tiêu chí nghiệm thu**
- [ ] `BR-FAQ-01`: mỗi câu có **URL neo riêng**.
- [ ] `BR-FAQ-02`: câu liên quan pháp lý **link** tới trang chính sách, không copy nội dung.
- [ ] `BR-FAQ-03`: schema `FAQPage` sinh từ dữ liệu.
- [ ] `BR-FAQ-04`: nội dung sửa qua [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md) (P2.8) — ở P1 lưu dạng dữ liệu, **không** hardcode trong component.
- [ ] `BR-FAQ-05`: trả lời thẳng ở câu đầu.
- [ ] `BR-FAQ-06`: có ít nhất một câu nói thẳng giới hạn sản phẩm.
- [ ] `D-AX`: kênh hỗ trợ email `support@mindkid.vn` + Zalo OA hiển thị.
- [ ] `BR-CKB-01` `BR-CKB-04`: chỉ cookie **kỹ thuật thiết yếu**, không cookie bên thứ ba.
- [ ] `BR-CKB-05`: `/cookie` liệt kê **từng** cookie: tên, mục đích, thời hạn — sinh từ danh sách dữ liệu, không viết tay.
- [ ] `BR-CKB-02`: banner **không** chặn nội dung, không modal toàn màn hình.
- [ ] `BR-CKB-03`: **không** hiện banner trên bề mặt trẻ; ca âm.
- [ ] `BR-CKB-07`: đóng banner → không hiện lại **12 tháng**.
- [ ] `BR-CKB-06`: ca âm — thêm một cookie **không** thiết yếu vào danh sách → cổng yêu cầu cơ chế đồng ý thật, banner thông báo **không đủ**.

**Kiểm chứng**
- [ ] `pnpm test -- faq-cookie` xanh, assertion tham chiếu `BR-FAQ-02` `BR-CKB-03` `BR-CKB-06`.

**Phụ thuộc:** T6 · **Cỡ:** M

### Cổng dừng

- [ ] Tắt JS: trang chủ, catalog, chi tiết vẫn đọc được; không cloaking.
- [ ] Không script bên thứ ba trên bất kỳ trang công khai nào.
- [ ] Sitemap ↔ 410 nhất quán hai chiều.
- [ ] Chỉ 6 trang competency + 3 trang tuổi được index; còn lại canonical/noindex.
- [ ] Mọi chính sách có version, URL vĩnh viễn; bản `pending_review` chặn deploy production.
- [ ] Không ảnh trẻ em thật, không hứa hẹn kết quả học tập.
- [ ] LCP < 2,5 s trên 4G; trang đầu ≤500 KB.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 8 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-SEO2-*` `BR-GCP-*` `BR-GDP-*` `BR-LND-*` `BR-LGL-*` `BR-FAQ-*` `BR-CKB-*` có ít nhất một test tham chiếu mã rule.
- [ ] Bảy spec sang `implemented`.
- [ ] §11 Q2 của legal (DPIA) nêu lại cho chủ — **chặn P1**, cùng câu với [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) Q2.
- [ ] §11 Q3 của legal (chính sách hoàn tiền) chuyển **P2.3**.
- [ ] Nợ ghi sang P2.8: sửa nội dung FAQ/SEO qua studio.
- [ ] Tick **P1.13** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Một script bên thứ ba lẻn vào | Vi phạm `BR-CDC-08` trên trang nói về quyền riêng tư trẻ em | `D-IC` — một cổng, ca âm |
| Nội dung chỉ render bằng JS | Mất kênh acquisition rẻ nhất, không ai phát hiện ngay | `D-ID` — E2E với JS tắt |
| Chính sách nháp lên production | Vi phạm `BR-LGL-07`, rủi ro pháp lý thật | `D-HZ` — cờ + cổng deploy |
| 410 và sitemap lệch nhau | Bot vào ngõ cụt hoặc giữ URL chết | `D-IA` — cổng hai chiều |
| Index tổ hợp bộ lọc | Nội dung mỏng, loãng chỉ mục | `D-IB` — bảng cấu hình |
| `content_pack` lọt ra trang công khai | Rò nội dung trả phí ở bề mặt lớn nhất | `BR-GCP-02` `BR-GDP-05` — dùng lại `D-HM` |
| Giá hardcode trên landing | Lệch với `PACKAGE_CATALOG` khi đổi giá | `BR-LND-05` — ca âm quét số tiền |
| Câu hứa hẹn kết quả học tập | Vượt ranh giới sản phẩm giáo dục, rủi ro pháp lý | `BR-LND-06` — dùng chung cổng ngôn ngữ với P1.12 |

## 6. Giả định

1. **P1.11 và P1.11b đã đóng** — có 120 game và lớp truy vấn chung.
2. **P1.1 đã đóng** — ngân sách LCP và bundle có cổng.
3. **Rà soát pháp lý chưa xong** — nội dung là bản nháp có cờ, không phát hành production.
4. **Không analytics tự host ở P1** (`D-AW`) — đo phễu bằng server log và telemetry.
5. **Trang giá đầy đủ ở P2.3** — landing chỉ hiện giá từ `PACKAGE_CATALOG`.
6. **Sửa nội dung FAQ/SEO qua studio ở P2.8** — ở P1 nội dung là dữ liệu seed.

## 7. Ngoài phạm vi

- Trang giá và thanh toán — P2.3.
- Studio sửa nội dung SEO/FAQ — P2.8.
- Ảnh chụp màn hình tự động — P2 (`D-CV`).
- Trưng bày chương trình học — P3.8.
- Analytics tự host — ngoài P1 (`D-AW`).
