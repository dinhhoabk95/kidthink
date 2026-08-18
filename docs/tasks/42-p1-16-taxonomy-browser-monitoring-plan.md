# Kế hoạch — Task #42: P1.16 — Trình duyệt taxonomy & giám sát hệ thống

> Viết 2026-08-10. Bước sở hữu: **P1.16** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) — bước **cuối** của P1.
> Spec sở hữu: [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md) ·
> [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Hai spec không liên quan nhau về kỹ thuật, nhưng cùng một bản chất: **đường phản hồi**. Cả hai
tồn tại để nói cho người biết cái mà hệ thống đã biết mà chưa ai nhìn thấy.

1. **Khoảng trống nội dung.** Người soạn cần biết skill nào chưa có level. Không có màn hình
   này thì chọn soạn gì tiếp là đoán — và đoán ở quy mô 230 skill là đoán sai.
2. **Sự cố tới tay người.** v1 có health check trả 503 đúng cách và **không ai được thông báo**.
   Một health check không có alerting chỉ là một endpoint.

`BR-MON-07` chặn go-live khi thiếu alert nhóm P0 — nghĩa là bước này không chỉ là bước cuối của
P1 mà còn giữ một trong hai cổng go-live (cổng kia là verify restore, `BR-BAK-06`). Và nó chốt
lại đúng chỗ P0.8b để ngỏ: `AlertPort` đã có từ `D-EB`, adapter thật thì chưa.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `TAXONOMY-SERVICE` | P0.9 | 230 skill, ≥690 LO đã seed |
| `ADMIN-AUTH` | P0.11b | `requireManagerAuth()`, hai role, TOTP |
| `HEALTH-CHECK` | P0.8b | `/api/guest/health`, 503 gọi `alert()` |
| `AlertPort` | P0.8b `D-EB` · P1.5 `D-FX` | interface + adapter tạm gửi email vận hành |
| `JOB-QUEUE` | P1.5 | ngưỡng backlog, `failed` queue, retry |
| `CONTENT-TAGGING` | P1.10 | `content_skill_map` — nguồn số đếm |
| ≥120 level `published` | P1.11 | cây có số thật để đếm |

## 1. Đo được

### 1.1 Đã có

`AlertPort` với một adapter gửi email vận hành (`D-FX`); health check và job có ngưỡng; log có
`request_id` từ P0; `apps/admin` với đăng nhập Manager; taxonomy đầy đủ và nội dung thật để đếm.

### 1.2 Chưa có

Adapter Telegram và Healthchecks.io; `infra/monitoring/alerts.yml`; cổng go-live đọc file đó;
bộ lọc PII cho log; thu lỗi client; `GET /api/managers/system/metrics`; toàn bộ màn hình cây
taxonomy và chi tiết skill.

### 1.3 Đã chốt, không mở lại

`D-S` kênh P0 là **Healthchecks.io + Telegram Bot API**, email chỉ dự phòng, chốt ở
[`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1 ·
`D-EB` alert là **port** với adapter thay được · `D-FX` adapter tạm dùng `email:send` ·
`D-W` ai biên soạn ≥690 LO và ≥120 level — cùng câu với [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) §11 Q1 ·
`@sentry/nuxt` là SDK đã chốt ở [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1.

## 2. Quyết định

**D-IQ — P1.16 **thay adapter**, không viết lại `AlertPort`.** P0.8b giao interface, P1.5 giao
adapter email. Bước này thêm Telegram (ngưỡng và crash) và Healthchecks.io (dead-man switch cho
job/cron), giữ email làm dự phòng đúng §7.3. Cổng: mọi chỗ phát alert đi qua port; xuất hiện lời
gọi trực tiếp tới API Telegram ngoài adapter → **đỏ**. Lý do: ba bước đã dựng trên interface đó;
đổi hình dạng ở bước cuối là đi sửa mọi call site trong lúc không còn thời gian đệm.

**D-IR — `alerts.yml` là **dữ liệu**, và cổng go-live đọc **chính** file đó.** `BR-MON-07` chặn
go-live khi thiếu alert nhóm P0. Một mục checklist do người tick là mục sẽ được tick trong lúc
nó chưa đúng. Xử: khai đủ ba nhóm §7.2 vào `infra/monitoring/alerts.yml`; mỗi quy tắc có ngưỡng,
kênh, và **link runbook**. Quy tắc mà nguồn dữ liệu chưa tồn tại (hàng đợi thanh toán — P2.3;
nội dung `in_review` tồn đọng — P2.8) khai `pending_source` kèm bước sở hữu. Cổng: `pending_source`
trên bất kỳ quy tắc **nhóm P0** nào → **đỏ**; ở nhóm P1/P2 thì chấp nhận. Cùng cơ chế với
registry job của P1.5 — khai đủ, đánh dấu chưa bật, và để cổng canh.

**D-IS — chống PII trong log là **bộ lọc lúc chạy**, không phải quy tắc review.** `BR-MON-05`
nói log sống lâu hơn và nhiều người đọc hơn audit log. Nhưng log được viết bởi người đang debug
lúc 2 giờ sáng, nên quy tắc phải đúng **mà không cần họ nhớ**. Xử: redactor trong logger có cấu
trúc, deny-list theo tên trường (`display_name` · `birth_year` · `child_uuid` · `email` ·
`password` · `token` · `authorization`), áp cho **mọi** bản ghi. Ca âm: log một object chứa đủ
bảy trường → đầu ra không còn trường nào. Đây cũng là vế log của `D-IP` ở P1.15.

**D-IT — số đếm hiện kèm `as_of`, và ngưỡng "đủ" **giữ nguyên 3**.** `BR-TXB-06` cache 5 phút;
§11 Q1 của spec nói thẳng **không tự hạ ngưỡng**. Ở MVP có ≥120 level trên 230 skill, nên phần
lớn cây sẽ hiện "mỏng" — đó là **số thật**, không phải lỗi hiển thị. Hai cách hỏng: hạ ngưỡng
cho cây xanh (giết đúng lý do màn hình tồn tại), hoặc hiện số cache như số tức thời (người soạn
tưởng vừa seed xong mà cây chưa đổi là dữ liệu sai). Xử: hằng số có test khoá giá trị 3; `as_of`
hiện ngay cạnh số; chú giải nói rõ "mỏng" là kỳ vọng ở MVP.

**D-IU — nút "soạn level cho skill này" trỏ **đường soạn thật của P1**, tức seeder.**
`BR-TXB-04` đòi nút dẫn thẳng sang studio, nhưng [`game-level-studio.md`](../specs/06-admin/game-level-studio.md)
là **P2.6**. Ý định của rule là "từ phát hiện khoảng trống tới hành động, ít ma sát nhất" — ở P1
hành động đó là soạn seeder theo [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md).
Xử: nút mở đúng đường seeder với `skill_code` đã điền sẵn; P2.6 trỏ lại studio. Cổng: nút
**không bao giờ** dẫn tới 404.

**D-IV — trang taxonomy sống trong `apps/admin` với chrome tối thiểu, và **không** trở thành
admin shell.** [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) là P2.1 và sở hữu
shell. Bước này chỉ thêm một trang dưới layout mà P0.11b đã có; cấm thêm nav toàn cục, breadcrumb
framework, hay hệ thống quyền menu. Lý do: shell mọc ra từ trang đầu tiên là shell không ai
thiết kế, và P2.1 sẽ phải gỡ nó trước khi làm việc của mình.

## 3. Đồ thị

```
T1 adapter Telegram + Healthchecks sau AlertPort (D-IQ)
      └──→ T2 alerts.yml ba nhóm + cổng go-live đọc file (D-IR)
                └──→ T3 log có cấu trúc + redactor PII + thu lỗi client (D-IS)
                          └──→ T4 GET /api/managers/system/metrics: SLO + alert đang mở
  T5 cây taxonomy chỉ đọc: số đếm · as_of · chỉ báo khoảng trống (D-IT)
      └──→ T6 chi tiết skill + nút soạn trỏ seeder (D-IU, D-IV)
                              ── Cổng dừng ──
  T7 evidence, promote 2 spec, nêu hai câu còn chặn cổng ra P1
```

## 4. Task

### Task 1 — Adapter alert thật

**Tiêu chí nghiệm thu**
- [ ] Adapter Telegram Bot API cho ngưỡng và crash; adapter Healthchecks.io làm dead-man switch cho job/cron; email giữ vai trò **dự phòng** (§7.3, `D-S`).
- [ ] `D-IQ` cổng: mọi alert đi qua `AlertPort`; lời gọi trực tiếp tới API Telegram ngoài adapter → **đỏ**.
- [ ] `BR-MON-04` ca âm: hệ thống giám sát ngừng heartbeat 10 phút → alert phát từ **kênh độc lập**.
- [ ] Alert lặp gộp trong cửa sổ **15 phút**; ca âm — điều kiện lỗi kéo dài 1 giờ → **không quá 4** alert.
- [ ] `BR-MON-03` ca âm: quét cấu hình — không quy tắc nào ở trạng thái "tắt"; giảm ồn bằng sửa ngưỡng.
- [ ] Adapter fail (Telegram 5xx) → rơi xuống email, và bản thân việc rơi được ghi lại.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/worker test -- alert-adapters` xanh, assertion tham chiếu `BR-MON-01` `BR-MON-04`.

**Phụ thuộc:** P0.8b · P1.5 · **Cỡ:** M

### Task 2 — `alerts.yml` và cổng go-live

**Tiêu chí nghiệm thu**
- [ ] Ba nhóm §7.2 khai đủ trong `infra/monitoring/alerts.yml`: P0 gọi người ngay · P1 trong giờ làm · P2 báo cáo tuần.
- [ ] `BR-MON-02`: **mỗi** quy tắc có link runbook; ca âm — quy tắc thiếu runbook → **đỏ**.
- [ ] Bảy quy tắc P0 đúng ngưỡng §7.2: health 503 hai lần liên tiếp · 5xx > 5%/5 phút · DB mất kết nối · backup fail · backup verify fail · backlog > 500 job/5 phút · disk < 15%.
- [ ] `D-IR`: quy tắc chưa có nguồn dữ liệu khai `pending_source` kèm bước sở hữu (hàng đợi thanh toán → P2.3; `in_review` tồn đọng → P2.8).
- [ ] `BR-MON-07` + `D-IR` ca âm: đặt một quy tắc **nhóm P0** thành `pending_source` hoặc xoá nó → cổng go-live **đỏ** tại mục giám sát.
- [ ] Cổng đọc **chính** `alerts.yml`, không phải một danh sách chép tay trong checklist.
- [ ] `BR-MON-01` ca âm: DB không truy cập được → alert P0 tới kênh trực tiếp, không chỉ ghi log.

**Kiểm chứng**
- [ ] `pnpm test -- alerts-config` xanh, in ra "7/7 quy tắc P0 có nguồn và runbook".

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Log có cấu trúc và bộ lọc PII

**Tiêu chí nghiệm thu**
- [ ] Hình dạng log đúng §7.4: `level` · `ts` · `request_id` · `actor_type` · `actor_id` · `route` · `code` · `duration_ms`.
- [ ] `D-IS` + `BR-MON-05` ca âm: log một object chứa `display_name` · `birth_year` · `child_uuid` · `email` · `password` · `token` · `authorization` → đầu ra **không** còn trường nào trong bảy trường đó.
- [ ] Redactor áp cho **mọi** bản ghi, gồm cả nhánh `catch` và log của worker.
- [ ] Ca âm nối `D-IP` của P1.15: access token của provider không xuất hiện trong log.
- [ ] `BR-MON-06`: lỗi client thu về `error_log` **có sampling**; tỉ lệ khai dạng cấu hình, không hằng số rải rác.
- [ ] `@sentry/nuxt` đọc DSN từ biến môi trường — đổi giữa SaaS và self-host là đổi DSN, **không** đổi code (xem §5 rủi ro).
- [ ] Thiếu DSN → app chạy bình thường, chỉ mất kênh thu lỗi client.

**Kiểm chứng**
- [ ] `pnpm test -- log-redaction` xanh, assertion tham chiếu `BR-MON-05` `BR-MON-06`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Bề mặt xem trong admin

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/system/metrics` cần `requireManagerAuth()` + role `super_admin`; `content_reviewer` → **403**.
- [ ] Trả snapshot bốn SLO §7.1: uptime 99,7% · API P95 < 800 ms · FPS 60 trên tablet chuẩn · P90 xử lý payment < 12 giờ.
- [ ] Trả danh sách alert **đang mở**, mỗi cái kèm thời điểm phát và link runbook.
- [ ] SLO nào chưa có nguồn dữ liệu (payment — P2.3) hiện trạng thái `pending_source`, không hiện số bịa.
- [ ] Màn hình đầy đủ của nhật ký và hoạt động hệ thống vẫn thuộc P2.10 — bước này chỉ giao endpoint và một bảng đọc.

**Kiểm chứng**
- [ ] `pnpm test -- system-metrics` xanh, assertion tham chiếu `BR-MON-01`.

**Phụ thuộc:** T3 · **Cỡ:** S

### Task 5 — Cây taxonomy

**Tiêu chí nghiệm thu**
- [ ] Cây 4 tầng gấp mở được, đúng hình dạng §7.1.
- [ ] `BR-TXB-01` ca âm: không route `POST` `PATCH` `DELETE` nào dưới `/api/managers/taxonomy`; gọi thử → không tồn tại hoặc **405**.
- [ ] `BR-TXB-02`: mỗi nút hiện số nội dung **published**, đếm riêng `draft`.
- [ ] `BR-TXB-03`: skill 0 level published mang chỉ báo nổi bật.
- [ ] `D-IT` + `BR-TXB-06`: cache **5 phút**, số đếm kèm `as_of` hiện ngay cạnh số.
- [ ] `D-IT`: hằng số ngưỡng "đủ" = **3**, có test khoá giá trị; chú giải nói rõ phần lớn cây hiện "mỏng" ở MVP là **số thật**.
- [ ] Bốn chỉ báo §7.3 đúng: chưa có · mỏng (1–2) · đủ (≥3) · LO chưa phủ.
- [ ] `GET /api/managers/taxonomy?gaps_only=true` chỉ trả skill 0 level published.
- [ ] Cả `super_admin` và `content_reviewer` đọc được (**200**).
- [ ] Skill `deprecated` hiện mờ, không cho soạn mới.

**Kiểm chứng**
- [ ] `pnpm test -- taxonomy-browser` xanh, assertion tham chiếu `BR-TXB-01` `BR-TXB-02` `BR-TXB-06`.

**Phụ thuộc:** P0.9 · P1.10 · P1.11 · **Cỡ:** M

### Task 6 — Chi tiết skill

**Tiêu chí nghiệm thu**
- [ ] Sáu phần §7.2 đủ: định danh · thuộc tính · LO kèm số nội dung · prerequisite · nội dung đang gắn · hành động.
- [ ] `BR-TXB-05`: đồ thị prerequisite hiện cả skill đứng trước và skill mà nó mở khoá.
- [ ] `D-IU` + `BR-TXB-04`: nút "soạn level cho skill này" mở đường seeder của P1.10 với `skill_code` điền sẵn; ca âm — nút **không** dẫn tới 404.
- [ ] Muốn sửa taxonomy → thông báo "đổi qua PR" kèm link tài liệu, không có form.
- [ ] `D-IV` ca âm: trang không thêm nav toàn cục, breadcrumb framework, hay hệ thống quyền menu — shell thuộc P2.1.

**Kiểm chứng**
- [ ] `pnpm test -- taxonomy-skill-detail` xanh, assertion tham chiếu `BR-TXB-04` `BR-TXB-05`.

**Phụ thuộc:** T5 · **Cỡ:** S

### Cổng dừng

- [ ] Alert P0 tới **Telegram thật** trong môi trường staging, không phải mock.
- [ ] Dead-man switch phát alert khi giám sát im 10 phút.
- [ ] Ca âm `BR-MON-07`: bỏ một quy tắc P0 → cổng go-live đỏ.
- [ ] Ca âm `BR-MON-05`: bảy trường PII bị lọc khỏi log.
- [ ] Cây taxonomy chỉ đọc; không route ghi nào tồn tại.
- [ ] Số đếm có `as_of`; ngưỡng "đủ" vẫn là 3.
- [ ] Nút soạn không dẫn tới 404.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 7 — Evidence, promote và cổng ra P1

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-MON-*` `BR-TXB-*` có ít nhất một test tham chiếu mã rule.
- [ ] Hai spec sang `implemented`.
- [ ] Kiểm cổng ra P1 của [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md): 43 spec P1 `implemented`, một trẻ chơi hết một level thật và phụ huynh thấy trong báo cáo.
- [ ] §11 Q1b của [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) — **ai trực?** — nêu cho chủ. Kênh đã chạy nhưng **chưa có người nhận**; theo `BR-MON-07` đây vẫn là "chưa cấu hình xong" và nó **chặn go-live**.
- [ ] §11 Q2 (Sentry SaaS hay GlitchTip tự host) thuộc [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q8 — **không** quyết lại ở đây; T3 đã làm nó thành lựa chọn DSN.
- [ ] §11 Q3 (SLO 99,7% có ràng buộc hợp đồng không) nêu cho chủ — không chặn code.
- [ ] §11 Q1 của [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md) (ngưỡng "đủ" gấp 5,75 lần mục tiêu MVP) giữ nguyên ngưỡng theo `D-IT`; câu hỏi gốc là `D-W` ở [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) §11 Q1.
- [ ] Nợ ghi sang **P2.1**: re-host trang taxonomy vào admin shell; **P2.6**: trỏ nút soạn sang studio; **P2.10**: màn hình nhật ký đầy đủ.
- [ ] Tick **P1.16** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Alert cấu hình xong nhưng không ai trực | `BR-MON-07` vẫn chưa đạt; sự cố im lặng như cũ | §11 Q1b — nêu thẳng, chặn go-live |
| Checklist go-live tick tay | Mục được tick trong lúc alert chưa có | `D-IR` — cổng đọc `alerts.yml` |
| PII lọt vào log | Rò nhanh nhất trong hệ thống, ra ngoài vành đai kiểm soát | `D-IS` — redactor lúc chạy, ca âm bảy trường |
| Viết lại `AlertPort` ở bước cuối | Sửa mọi call site của ba bước trước, không còn thời gian đệm | `D-IQ` — chỉ thay adapter |
| Hạ ngưỡng cho cây xanh | Mất đúng lý do màn hình tồn tại | `D-IT` — test khoá hằng số 3 |
| Số cache hiểu nhầm là tức thời | Người soạn tin dữ liệu cũ, soạn trùng | `BR-TXB-06` — `as_of` cạnh số |
| Trang taxonomy mọc thành admin shell | P2.1 phải gỡ trước khi làm việc của mình | `D-IV` — chrome tối thiểu |
| Alert giả nhiều → có người tắt | Điểm mù vĩnh viễn | `BR-MON-03` — cấm tắt, chỉ sửa ngưỡng; cổng quét |

## 6. Giả định

1. **P1.11 đã đóng** — có ≥120 level published để cây có số thật.
2. **P1.5 đã đóng** — ngưỡng job và `failed` queue có nguồn dữ liệu cho alert.
3. **P0.8b đã đóng** — health check và `AlertPort` chạy được.
4. **Chưa có thanh toán và hàng duyệt nội dung** — hai quy tắc alert khai `pending_source`.
5. **Admin shell chưa có** — trang taxonomy dùng layout tối thiểu của P0.11b.
6. **Người trực chưa được chỉ định** — kênh chạy được, nhưng go-live vẫn bị chặn tới khi có người.

## 7. Ngoài phạm vi

- Admin shell và điều hướng quản trị — P2.1.
- Studio soạn game level — P2.6.
- Màn hình nhật ký audit, lỗi, hoạt động hệ thống — P2.10.
- Sửa taxonomy từ UI — **không bao giờ**; taxonomy đổi qua PR.
- Báo cáo tổng hợp hàng tuần nhóm P2 — khai trong `alerts.yml`, gửi từ P2 trở đi.
