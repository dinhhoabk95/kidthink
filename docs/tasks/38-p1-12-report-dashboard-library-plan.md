# Kế hoạch — Task #38: P1.12 — Báo cáo cơ bản, trang chính phụ huynh & thư viện cá nhân

> Viết 2026-08-09. Bước sở hữu: **P1.12** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`basic-report.md`](../specs/03-account/basic-report.md) ·
> [`member-dashboard.md`](../specs/03-account/member-dashboard.md) ·
> [`my-library.md`](../specs/03-account/my-library.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Đây là bước **bề mặt người lớn** đầu tiên có nội dung thật, và là nơi giá trị sản phẩm trở nên
nhìn thấy được: *"con tôi đã chơi gì và có tiến bộ không"*. Spec nói thẳng — một phụ huynh thấy
giá trị qua báo cáo sẽ nâng gói; một phụ huynh không thấy gì sẽ rời đi sau hai tuần.

Ràng buộc khó nhất ở đây **không** phải kỹ thuật mà là **ngôn ngữ**. Báo cáo phản ánh *hiệu suất
trong hệ thống*, không phải *năng lực của đứa trẻ*. Cấm ngôn ngữ chẩn đoán, cấm so sánh với trẻ
khác hay "chuẩn độ tuổi", cấm số phần trăm thành thạo. Đây là ràng buộc pháp lý và đạo đức, và
nó phải thành **cổng quét chuỗi**, không phải hướng dẫn viết lách.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `TELEMETRY-PIPELINE` | P1.5/P1.7 | bốn bảng rollup, `BR-TLM-01` |
| `ENTITLEMENT-MODEL` | P0.5 | `view_basic_report`, quota |
| `CONTENT-SEARCH` | **P1.11b** | my-library dùng chung mặt tìm kiếm (`D-CA`) |
| `CHILD-PROFILE-*` | P1.9 | thẻ trẻ, ownership |
| `NOTIFICATION-SERVICE` | P0.9b | kênh gửi digest tuần (`D-CW`) |
| Nội dung thật | P1.11 | báo cáo rỗng không kiểm được gì |

## 1. Đo được

### 1.1 Đã có

Bốn bảng rollup và `rollup:daily`/`rollup:session`; hồ sơ trẻ và quyền; lớp truy vấn tìm kiếm
dùng chung (P1.11b); `email:send` và notification service (P0.9b).

### 1.2 Chưa có

Ba màn hình, ba nhóm route, bảng `library_items` và `collections`, bảng nhãn báo cáo, và digest
tuần.

### 1.3 Đã chốt, không mở lại

`D-AK` báo cáo cơ bản **dừng trước** mastery — bản đồ tiến bộ và huy hiệu là P3 ·
`D-CW` gửi digest tuần qua email, **mặc định bật**, tắt được trong cài đặt ·
`D-BB` gợi ý ngoài màn hình dùng danh sách tĩnh 12 hoạt động.

## 2. Quyết định

**D-HS — bảng nhãn và danh sách chuỗi cấm là **dữ liệu + cổng**, không phải hướng dẫn.** Năm
nhãn được dùng (`Chưa có đủ dữ liệu` · `Mới làm quen` · `Đang phát triển` · `Khá ổn định` ·
`Thành thạo trong phạm vi bài tập`) khai thành enum; mọi chuỗi hiển thị trong báo cáo lấy từ đó.
Cổng quét toàn bộ chuỗi báo cáo tìm "chậm", "kém", "có vấn đề", "dưới chuẩn", "IQ", "rối loạn",
và mọi so sánh — có là **đỏ**. Lý do thành cổng: đây là loại lỗi do một câu copy vô tình, không
do thiết kế sai, nên review người sẽ bỏ sót.

**D-HT — báo cáo cơ bản **không** đọc `mastery_state`, kể cả khi bảng đã tồn tại.** `D-AK` đã
chốt ranh giới. Ở P1 `mastery_state` chưa được ghi (hàm gác của `D-GH` chưa ghi gì) — nên cám dỗ
nhỏ; nhưng khi P3 bật mastery, báo cáo cơ bản vẫn phải dừng ở rollup. Ca âm: quét truy vấn phục
vụ route báo cáo cơ bản, không truy vấn nào chạm `mastery_state`.

**D-HU — digest tuần: **nội dung và job ở bước này**, **màn hình tắt/bật ở P1.14**.** `D-CW` nói
mặc định bật khi đăng ký. Cần ba mảnh: (1) nội dung digest — thuộc báo cáo, làm ở đây; (2) job
gửi — dùng `email:send` đã có; (3) chỗ tắt — thuộc [`account-settings.md`](../specs/03-account/account-settings.md)
(P1.14). Ở P1.12 lưu cờ `weekly_digest_enabled` mặc định `true` và **tôn trọng** nó; UI ở P1.14.
Ca âm: cờ `false` → không gửi.

**D-HV — khối 4 "Chương trình đang học" **ẩn hoàn toàn** ở P1.** Curriculum là P3. `BR-MDB-01`
đã có tinh thần đó cho trường hợp chưa có hồ sơ trẻ: trang đầy widget rỗng làm người mới bối
rối. Không dựng khối giả, không "sắp có". API trả mảng rỗng, client ẩn.

**D-HW — my-library **dùng lại** lớp truy vấn của P1.11b, không viết truy vấn riêng.** Thư viện
là một trong ba bề mặt của cùng mặt tìm kiếm (`D-CA`). Viết truy vấn riêng là chỗ thứ tư để quên
`BR-SRC-01` (locked không mang nội dung) và `BR-SRC-06` (không cache nội dung trả phí).

**D-HX — "một chỗ nhắc nâng cấp mỗi trang" thành **cổng đếm**.** `BR-MDB-07`. Nhiều lời mời cùng
lúc đọc thành ép mua, và số lượng CTA là thứ tăng dần theo từng PR marketing. Đếm được thì giữ
được: cổng đếm phần tử mang thuộc tính CTA nâng cấp trên mỗi trang người lớn, > 1 là đỏ.

## 3. Đồ thị

```
T1 bảng nhãn + cổng quét ngôn ngữ (D-HS)
      └──→ T2 báo cáo cơ bản: 6 mục từ rollup · miễn trừ · <3 phiên
                └──→ T3 digest tuần: nội dung + cờ mặc định bật (D-HU)
  T4 dashboard: 5 khối (khối 4 ẩn) · thẻ trẻ · cổng đếm CTA
  T5 my-library: bookmark · collection ≤20 · user_tags · dùng lớp truy vấn P1.11b
                          ── Cổng dừng ──
  T6 evidence, promote 3 spec
```

## 4. Task

### Task 1 — Bảng nhãn và cổng ngôn ngữ

**Tiêu chí nghiệm thu**
- [ ] Năm nhãn §7.3 khai thành enum; mọi chuỗi nhãn trong báo cáo lấy từ đó (`D-HS`).
- [ ] Câu miễn trừ §7.2 là hằng số một chỗ, hiện trên **mọi** màn hình báo cáo (`BR-BRP-03`).
- [ ] Cổng quét chuỗi cấm: "chậm", "kém", "có vấn đề", "dưới chuẩn", "IQ", "rối loạn", "chẩn đoán" → **đỏ**.
- [ ] `BR-BRP-04`: cổng bắt so sánh — "hơn", "kém hơn", "so với các bé", "chuẩn độ tuổi".
- [ ] Ca âm cho từng nhóm chuỗi.
- [ ] `BR-BRP-02`: nhãn dùng đúng bảng của [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) §7.4.

**Kiểm chứng**
- [ ] `pnpm test -- report-language` xanh; fixture chứa "dưới chuẩn" → cổng đỏ.

**Phụ thuộc:** P1.7 · **Cỡ:** M

### Task 2 — Báo cáo cơ bản

**Tiêu chí nghiệm thu**
- [ ] `GET /api/users/children/{uuid}/reports/basic?period=7d|30d`, auth + ownership.
- [ ] Sáu mục §7.1: hoạt động · hoàn thành · kỹ năng đã tiếp xúc · trò chơi yêu thích · gần đây · gợi ý (≥1 hoạt động ngoài màn hình, `D-BB`).
- [ ] `BR-BRP-07`: **mỗi** mục có một câu giải thích tiếng Việt thường.
- [ ] `BR-BRP-01` + `D-HT`: đọc **rollup**; ca âm — không truy vấn nào chạm `telemetry_events` **hoặc** `mastery_state`.
- [ ] `BR-BRP-06`: < 3 phiên → nhãn `Chưa có đủ dữ liệu`.
- [ ] `BR-BRP-08`: response **không** chứa `p_learn` hay phần trăm thành thạo; ca âm quét schema.
- [ ] `BR-BRP-05`: trẻ của người khác → **404**.
- [ ] Thiếu entitlement `view_basic_report` → **403** `ENTITLEMENT_REQUIRED`.
- [ ] Chưa chơi lần nào → thông báo thân thiện + **3 gợi ý game**.
- [ ] Trẻ `archived` → xem được, chỉ đọc (`BR-CPR-07`).
- [ ] Nhiều version nội dung → ghi chú "nội dung đã cập nhật" tại mốc đổi.
- [ ] Trẻ **không** thấy màn hình này — nằm dưới `/me`, ngoài `pages/play`.

**Kiểm chứng**
- [ ] `pnpm test -- basic-report` xanh, assertion tham chiếu `BR-BRP-01` `BR-BRP-06` `BR-BRP-08`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Digest tuần

**Tiêu chí nghiệm thu**
- [ ] Nội dung digest dựng từ **cùng** dữ liệu báo cáo 7 ngày, dùng **cùng** bảng nhãn và câu miễn trừ.
- [ ] Cờ `weekly_digest_enabled` mặc định **true** khi đăng ký (`D-CW`).
- [ ] Ca âm: cờ `false` → **không** gửi.
- [ ] Tạo logical notification + email delivery; gửi qua `email:send`
      (`jobId = notification_delivery_id`, conditional claim — `BR-NOT-04/05`).
- [ ] Trẻ chưa chơi gì trong tuần → **không** gửi email rỗng.
- [ ] Ghi nợ: màn hình tắt/bật ở **P1.14** (`D-HU`).

**Kiểm chứng**
- [ ] `pnpm test -- weekly-digest` xanh; gửi hai lần cùng tuần → một email.

**Phụ thuộc:** T2 · P0.9b · **Cỡ:** M

### Task 4 — Trang chính phụ huynh

**Tiêu chí nghiệm thu**
- [ ] `GET /api/users/dashboard` trả `{ todo, children, recent_progress, curriculum, subscription }`; khối rỗng là mảng rỗng.
- [ ] Năm khối §7.1 đúng thứ tự; **khối 4 ẩn hoàn toàn ở P1** (`D-HV`).
- [ ] `BR-MDB-01`: chưa có hồ sơ trẻ → **chỉ** CTA tạo hồ sơ, ẩn khối khác.
- [ ] Thẻ trẻ §7.2: avatar · tên · band tuổi · số ngày chơi 7 ngày · level gần nhất · nút "Cho bé chơi".
- [ ] `BR-MDB-06`: **không** so sánh giữa các trẻ; **không** hiện điểm số, không xếp hạng.
- [ ] `BR-MDB-02`: "Cho bé chơi" đặt `active_child_id` qua endpoint của P1.9 (`D-GV`), rồi chuyển `/play`.
- [ ] `BR-MDB-04`: đọc **rollup**; ca âm không quét event thô.
- [ ] `BR-MDB-05`: quota chỉ hiện khi **>80%** đã dùng.
- [ ] `BR-MDB-07` + `D-HX`: cổng đếm — tối đa **một** CTA nâng cấp mỗi trang; hai là **đỏ**.
- [ ] `BR-MDB-03`: thông tin thương mại được phép ở đây, **cấm** trên bề mặt trẻ (cổng `D-GQ` vẫn canh).
- [ ] Bốn nhánh §5: chưa xác thực email · gói sắp hết hạn <7 ngày · gói đã hết hạn · có đơn chờ.

**Kiểm chứng**
- [ ] `pnpm test -- dashboard` xanh, assertion tham chiếu `BR-MDB-01` `BR-MDB-05` `BR-MDB-07`.

**Phụ thuộc:** T2 · P1.9 · **Cỡ:** M

### Task 5 — Thư viện cá nhân

**Tiêu chí nghiệm thu**
- [ ] Bảng `library_items` PK ghép `(user_id, entity_type, entity_id)`; bảng collection.
- [ ] `BR-MLB-01`: lưu **tham chiếu**; ca âm — bản gốc publish version mới đổi tiêu đề → thư viện hiện tiêu đề mới.
- [ ] `BR-MLB-02`: lưu được nội dung **chưa mở khoá**; thẻ hiện khoá + CTA nâng cấp.
- [ ] `BR-MLB-03`: `user_tags` tách hoàn toàn; ca âm `GET /api/guest/tags` không lộ.
- [ ] `BR-MLB-04`: riêng tư — ca âm quét route, không route nào trả thư viện của user khác.
- [ ] `BR-MLB-05`: nội dung `archived` **vẫn hiện**, gắn nhãn "không còn khả dụng".
- [ ] `BR-MLB-06`: quota collection **20**; vượt → **402**.
- [ ] `BR-MLB-07`: không chứa nội dung do User tạo.
- [ ] Route: `GET /api/users/library` (trần 100) · `POST /library/items` (409 nếu đã lưu) · `DELETE /library/items/{type}/{id}` · `POST /collections`.
- [ ] `D-HW`: tìm kiếm trong thư viện dùng **lớp truy vấn của P1.11b**; ca âm — không truy vấn tìm kiếm riêng.
- [ ] Chưa lưu gì → gợi ý **5 nội dung** phù hợp trẻ đang hoạt động.
- [ ] Xoá item chỉ xoá bookmark.

**Kiểm chứng**
- [ ] `pnpm test -- my-library` xanh, assertion tham chiếu `BR-MLB-01` `BR-MLB-04` `BR-MLB-06`.

**Phụ thuộc:** P1.11b · **Cỡ:** M

### Cổng dừng

- [ ] Một phụ huynh thật: đăng nhập → thấy dashboard → mở báo cáo của con → thấy sáu mục có nghĩa.
- [ ] Cổng ngôn ngữ đã **đỏ** trên fixture chứa chuỗi chẩn đoán và chuỗi so sánh.
- [ ] Không truy vấn báo cáo nào chạm `telemetry_events` hay `mastery_state`.
- [ ] Mỗi trang người lớn có tối đa **một** CTA nâng cấp.
- [ ] Thư viện không rò sang user khác; nội dung khoá không mang `content_pack`.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 6 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-BRP-*` `BR-MDB-*` `BR-MLB-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented`.
- [ ] Nợ ghi sang P1.14: màn hình tắt/bật digest tuần.
- [ ] Nợ ghi sang P3: khối "Chương trình đang học", bố cục tài khoản nhiều trẻ (dashboard §11 Q1), thư viện theo từng trẻ (my-library §11 Q1).
- [ ] Tick **P1.12** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Một câu copy mang giọng chẩn đoán | Vi phạm ranh giới sư phạm và pháp lý, hỏng niềm tin | `D-HS` — cổng quét chuỗi, không dựa review |
| Báo cáo đọc `mastery_state` khi P3 bật | Vượt ranh giới `D-AK`, số chính xác giả tạo | `D-HT` — ca âm quét truy vấn |
| Số CTA nâng cấp tăng dần | Trang đọc thành ép mua | `D-HX` — cổng đếm |
| Dựng khối curriculum giả | Widget rỗng làm người mới bối rối | `D-HV` — ẩn hoàn toàn |
| Truy vấn tìm kiếm riêng cho thư viện | Chỗ thứ tư để quên luật `locked` và cache | `D-HW` — dùng lớp chung |
| Digest gửi trùng | Phụ huynh nhận hai email giống nhau | `BR-NOT-05` — delivery id + conditional claim + stable Message-ID; không hứa exactly-once SMTP |
| Kết luận từ 1–2 phiên | Nói sai về con của một phụ huynh thật | `BR-BRP-06` — nhãn `Chưa có đủ dữ liệu` |
| Báo cáo quét event thô | Hạ instance đúng lúc nhiều người xem | `BR-BRP-01` — dùng lại cổng `BR-TLM-01` |

## 6. Giả định

1. **P1.11b đã đóng** — lớp truy vấn tìm kiếm dùng chung sẵn sàng.
2. **P1.11 đã đóng** — có nội dung thật để báo cáo và để lưu.
3. **P1.7 đã đóng** — rollup có số thật.
4. **`mastery_state` chưa được ghi ở P1** — báo cáo không phụ thuộc nó.
5. **Curriculum ở P3** — khối 4 ẩn.
6. **Thanh toán ở P2** — khối "Gói của bạn" hiện trạng thái, CTA dẫn tới trang giá của P2.3.

## 7. Ngoài phạm vi

- Trang public, SEO, trang pháp lý — P1.13.
- Cài đặt tài khoản, tắt/bật digest, xoá tài khoản — P1.14.
- Bản đồ tiến bộ, huy hiệu, mastery — P3.5.
- Báo cáo nâng cao — P3.7.
- Trang giá và thanh toán — P2.3.
- Nội dung do User tạo trong thư viện — P4.
