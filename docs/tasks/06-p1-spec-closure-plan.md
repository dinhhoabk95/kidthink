# Kế hoạch — Task #6: Đóng corpus spec P1, lô 1 (và sửa đồ thị phụ thuộc)

> Viết 2026-08-08. Checklist thực thi: [`06-p1-spec-closure-todo.md`](06-p1-spec-closure-todo.md).
>
> Task đã lưu trữ:
> [`01-bootstrap-plan.md`](01-bootstrap-plan.md) ·
> [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) ·
> [`03-schema-contract-plan.md`](03-schema-contract-plan.md) ·
> [`04-readability-spec.md`](04-readability-spec.md) ·
> [`05-p0-spec-closure-plan.md`](05-p0-spec-closure-plan.md).
> Kế hoạch migration đầu tiên (roadmap P0 bước 8) đã chuyển thành **Task #7**:
> [`07-first-migration-plan.md`](07-first-migration-plan.md).
>
> **Ghi chú lịch sử 2026-08-14:** quyết định policy version của lô này đã được root D12 và
> `D-QV`–`D-QZ` trong [Task #40](40-p1-14-account-consent-deletion-plan.md) thay thế. Phần dưới
> giữ nguyên để truy quyết định cũ, không dùng làm contract triển khai.
>
> Sổ cái quyết định `D-*` là sổ liên task, dùng từ Task #1. Task #5 dừng ở `D-AG`, nên task
> này bắt đầu từ **`D-AH`**.
>
> Mọi lệnh chạy từ thư mục `kidthink/` và phải đặt lại đường dẫn Node trước, vì shell mặc định
> của máy là v20.17.0 còn dự án cần v24:
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Corpus P0 đóng xong ở Task #5 — **35/35 spec `P0` đã `approved`**. Lô kế tiếp là **P1**:
44 spec, mới 2 cái `approved`.

Nhưng P1 **không approve tuần tự được**. Đồ thị `depends_on` có ba khuyết tật đo được, và
cho tới khi sửa xong thì gần nửa số spec P1 **không bao giờ** đạt `approved` — không phải
chậm, mà là bế tắc vĩnh viễn. Task này sửa đồ thị trước, rồi approve **11 spec đã sẵn sàng**.

Task này **không viết code**. Phạm vi dừng ở contract, đúng như Task #2, #3, #5. Ngoại lệ duy
nhất là hai file `scripts/` phục vụ chính cổng của corpus (ca âm `C7` và nâng `C7` lên lỗi).

## Trạng thái nền đo được (2026-08-08)

| Đo | Kết quả |
|---|---|
| Nhánh | `main`, tracking `origin/main` |
| Commit gần nhất | `c4c910e` — Task #6 bước 0, sửa 21 lỗi `C15` |
| Working tree | Sạch |
| `pnpm lint:specs` | Xanh — 130 spec, 15 kiểm tra, **0 lỗi, 179 cảnh báo** (nền Task #5 là 213) |
| Spec `approved` | **38/130** |
| Theo phase | `P0` 35 approved / 0 draft · `P1` 2 / 42 · `P2` 1 / 30 · `P3`–`P5` 0 / 20 |

## Ba khuyết tật của đồ thị phụ thuộc

### Khuyết tật 1 — tám chu trình `depends_on`, `C7` chỉ là cảnh báo

[`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) dòng 785 gọi `warn()` cho
`C7` (chu trình phụ thuộc), trong khi dòng 841 gọi `fail()` cho `C8` (spec `approved` không
được `depends_on` spec `draft`).

Hệ quả trực tiếp: chu trình lọt cổng im lặng, nhưng **mọi spec nằm trong một chu trình không
bao giờ approve được** — muốn approve A thì B phải approved trước, muốn approve B thì A phải
approved trước. `C8` chặn cả hai chiều. Đây là bế tắc, không phải thứ tự chưa tối ưu.

Tám chu trình hiện có:

| Chu trình | Phase |
|---|---|
| `ACCESSIBILITY` → `DESIGN-SYSTEM-CONTRACT` → `ACCESSIBILITY` | P1 |
| `LEGAL-PAGES` → `CONSENT-MANAGEMENT` → `LEGAL-PAGES` | P1 |
| `SEO-AND-STRUCTURED-DATA` → `GAME-DETAIL-PUBLIC` → `SEO-AND-STRUCTURED-DATA` | P1 |
| `SEO-AND-STRUCTURED-DATA` → `GAME-DETAIL-PUBLIC` → `GAME-CATALOG-PUBLIC` → `SEO-AND-STRUCTURED-DATA` | P1 |
| `SEO-AND-STRUCTURED-DATA` → `PROGRAM-SHOWCASE` → `SEO-AND-STRUCTURED-DATA` | P1 và P3 |
| `SCHEMA-DRIVEN-FORM` → `EMOJI-PICKER` → `SCHEMA-DRIVEN-FORM` | P2 |
| `SCHEMA-DRIVEN-FORM` → `IMAGE-UPLOAD` → `SCHEMA-DRIVEN-FORM` | P2 |
| `LIVE-PREVIEW` → `GAME-LEVEL-STUDIO` → `LIVE-PREVIEW` | P2 |

Bốn chu trình đầu chặn P1 ngay lập tức. Ba chu trình P2 chưa chặn gì hôm nay, nhưng phải cắt
trong lô này — vì chừng nào còn một chu trình thì `C7` **không nâng lên lỗi được**, và cổng
vẫn để lọt chu trình mới.

### Khuyết tật 2 — bốn tham chiếu tiến, spec P1 phụ thuộc spec phase sau

| Spec P1 | Phụ thuộc | Phase phụ thuộc |
|---|---|---|
| [`seo-and-structured-data`](../specs/02-public/seo-and-structured-data.md) | `PROGRAM-SHOWCASE` | P3 |
| [`basic-report`](../specs/03-account/basic-report.md) | `PROGRESS-AND-MASTERY` | P3 |
| [`next-game-recommendation`](../specs/04-play/next-game-recommendation.md) | `ADAPTIVE-ENGINE` và `CURRICULUM-PLAYER` | P3 |
| [`faq-and-help`](../specs/02-public/faq-and-help.md) | `SEO-CONTENT-ADMIN` | P2 |

Cùng dạng đảo ngược phase mà `D-AF` và `D-AG` của Task #5 đã xử lý hai lần. `C8` chặn approve
spec P1 khi phụ thuộc P2/P3 còn `draft`, và approve sớm một spec P3 chỉ để mở khoá P1 là ký
vào bản thiết kế mà bước sau chắc chắn phải đảo.

### Khuyết tật 3 — [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) lệch phase giữa hai file

[`roadmap.md`](../specs/roadmap.md) §P3 mục 6 xếp "Gợi ý game kế tiếp" vào **P3**, và danh
sách P1 của cùng file **không** có nó. Nhưng [`index.md`](../specs/index.md) và frontmatter
của chính spec ghi `phase: P1`.

## Bảy quyết định — sổ cái `D-AH` đến `D-AN`

Một nguyên tắc chung cho cả bảy: **thứ cấu thành đứng trước thứ tiêu thụ nó.** Ràng buộc
trước hiện thực; hạ tầng cắt ngang trước trang cụ thể; thành phần được nhúng trước màn hình
nhúng nó. [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §3 định nghĩa `depends_on` là "dùng để
xếp thứ tự **implement**" — nên hướng cắt phải trả lời được câu "cái nào xây được trước khi
cái kia tồn tại".

Mỗi nhát cắt **không xoá thông tin**. Nó đổi một **cạnh phụ thuộc** thành một **liên kết
tham chiếu** trong văn xuôi — đúng cách mà §2 của cùng file quy ước mô tả.

### `D-AH` — cắt cạnh [`accessibility.md`](../specs/08-quality/accessibility.md) → `DESIGN-SYSTEM-CONTRACT`

[`accessibility`](../specs/08-quality/accessibility.md) `owns` "Ngưỡng a11y theo bề mặt".
[`design-system-contract`](../specs/08-quality/design-system-contract.md) `owns` "Token, kit
component, quy tắc bốn bề mặt", và §7.1 của nó **chép lại** bảng sàn chạm (64px · 76px · 96px
· 44px) mà `BR-A11-04` sở hữu. Token là **hiện thực của** ngưỡng, không phải điều kiện để có
ngưỡng.

Kiểm chứng: [`accessibility.md`](../specs/08-quality/accessibility.md) **không nhắc**
[`design-system-contract.md`](../specs/08-quality/design-system-contract.md) ở bất kỳ đâu trong văn xuôi — cạnh phụ thuộc này không có nội dung
nào đỡ phía sau.

**Quyết định.** Xoá `DESIGN-SYSTEM-CONTRACT` khỏi `depends_on` của
[`accessibility.md`](../specs/08-quality/accessibility.md), để `depends_on: []`. Giữ nguyên
chiều `DESIGN-SYSTEM-CONTRACT → ACCESSIBILITY`. Approve `ACCESSIBILITY` trước.

### `D-AI` — cắt cạnh [`legal-pages.md`](../specs/02-public/legal-pages.md) → `CONSENT-MANAGEMENT`

[`legal-pages`](../specs/02-public/legal-pages.md) `owns` "Danh sách trang pháp lý bắt buộc"
và "Quy tắc version hoá chính sách". [`consent-management`](../specs/03-account/consent-management.md)
`owns` "Luồng xem, cập nhật, rút đồng ý" và "Xử lý khi chính sách đổi version".

Một bản đồng ý trỏ tới **một version chính sách cụ thể**. Văn bản và số version của nó phải
tồn tại trước khi ghi được sự đồng ý với nó. Câu trong §1 của
[`legal-pages.md`](../specs/02-public/legal-pages.md) — "vì đồng ý của User trỏ tới một
version cụ thể" — là **lý do** trang pháp lý cần version hoá, không phải nhu cầu implement
luồng đồng ý trước.

**Quyết định.** Xoá `CONSENT-MANAGEMENT` khỏi `depends_on` của
[`legal-pages.md`](../specs/02-public/legal-pages.md). Giữ chiều
`CONSENT-MANAGEMENT → LEGAL-PAGES`.

### `D-AJ` — cắt hai cạnh của [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md)

§1 của chính file ghi: "Spec này sở hữu **hạ tầng SEO**; nội dung trang ở
[`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md)". `owns` của nó là "Meta
tag, sitemap, robots, canonical" và "Schema JSON-LD toàn site" — contract **cắt ngang** mà
mọi trang công khai tuân theo.

Hạ tầng cắt ngang phụ thuộc vào trang cụ thể là ngược chiều. Ba trang
([`game-catalog-public`](../specs/02-public/game-catalog-public.md),
[`game-detail-public`](../specs/02-public/game-detail-public.md),
[`program-showcase`](../specs/02-public/program-showcase.md)) đều đã `depends_on` nó — đó là
chiều đúng, giữ nguyên.

**Quyết định.** Xoá cả `GAME-DETAIL-PUBLIC` và `PROGRAM-SHOWCASE` khỏi `depends_on` của
[`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md), để
`depends_on: []`.

**Vì sao đây là nhát cắt đáng giá nhất trong bảy cái.** Một lần sửa xoá **ba** chu trình
(SEO↔GAME-DETAIL, SEO→GAME-DETAIL→GAME-CATALOG→SEO, SEO↔PROGRAM-SHOWCASE) **và** một tham
chiếu tiến P1→P3 (`PROGRAM-SHOWCASE`).

### `D-AK` — cắt cạnh [`basic-report.md`](../specs/03-account/basic-report.md) → `PROGRESS-AND-MASTERY`

[`basic-report`](../specs/03-account/basic-report.md) là P1, sáu mục, và ranh giới của nó là
**không chẩn đoán** ([`index.md`](../specs/index.md): "6 mục, không chẩn đoán").
[`progress-and-mastery`](../specs/04-play/progress-and-mastery.md) là P3 — bản đồ tiến bộ và
huy hiệu, tức đúng thứ mà báo cáo cơ bản **cố ý không** làm.

Báo cáo cơ bản đọc dữ liệu từ [`telemetry-pipeline`](../specs/01-platform/telemetry-pipeline.md)
(P1, trong lô này), không đọc `mastery_state`.

**Quyết định.** Xoá `PROGRESS-AND-MASTERY` khỏi `depends_on`, còn
`TELEMETRY-PIPELINE` và `ENTITLEMENT-MODEL`. Thêm liên kết văn xuôi ghi rõ phần bản đồ tiến
bộ mở rộng ở P3.

### `D-AL` — cắt cạnh [`faq-and-help.md`](../specs/02-public/faq-and-help.md) → `SEO-CONTENT-ADMIN`

[`faq-and-help`](../specs/02-public/faq-and-help.md) `owns` "Nội dung FAQ và trang hướng
dẫn". [`seo-content-admin`](../specs/06-admin/seo-content-admin.md) là P2 — màn hình admin
để **sửa** nội dung đó qua rich text.

Nội dung FAQ ở P1 đi vào bằng seed, cùng đường với mọi nội dung Lớp 1 khác. Khả năng sửa qua
CMS là năng lực P2 đến sau, không phải điều kiện để trang FAQ tồn tại.

**Quyết định.** Xoá `SEO-CONTENT-ADMIN` khỏi `depends_on`, còn `SEO-AND-STRUCTURED-DATA`.

### `D-AM` — [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) chuyển `phase: P1` sang `P3`

Hai bằng chứng đứng cùng phía P3:

1. [`roadmap.md`](../specs/roadmap.md) §P3 mục 6 xếp nó vào P3, và danh sách P1 mười hai mục
   của cùng file **không** có nó.
2. Hai trong ba `depends_on` của nó — `ADAPTIVE-ENGINE` và `CURRICULUM-PLAYER` — đều là spec
   P3, và đều là phụ thuộc **thật**: gợi ý "chơi gì tiếp" theo mức thành thạo cần
   `mastery_state` được engine adaptive nuôi.

Bằng chứng phía P1 chỉ có `phase: P1` trong frontmatter và dòng tương ứng ở
[`index.md`](../specs/index.md) — cùng một con số chép ở hai chỗ, không phải hai nguồn độc lập.

Câu "P1 dùng **luật**, không dùng ML" trong §1 của spec **không mâu thuẫn** với P3: nó nói
cách tiếp cận là luật chứ không phải học máy, không nói phase.

**Quyết định.** Đổi `phase: P1` thành `phase: P3` trên
[`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md), cập nhật dòng
tương ứng ở [`index.md`](../specs/index.md). [`roadmap.md`](../specs/roadmap.md) **không cần
sửa** — nó đã đúng.

**Hệ quả.** Spec rời khỏi lô P1, và hai tham chiếu tiến của nó tự hết: một spec P3 phụ thuộc
hai spec P3 là bình thường. Số spec `P1` giảm từ 44 xuống 43, `P3` tăng từ 11 lên 12.

**Cách thay thế đã cân nhắc và loại.** Giữ `P1` rồi cắt hai cạnh `ADAPTIVE-ENGINE` và
`CURRICULUM-PLAYER`. Loại vì hai phụ thuộc đó là thật — cắt chúng để lấy một con số phase là
làm hỏng đồ thị để chiều một ô frontmatter, và mâu thuẫn với
[`roadmap.md`](../specs/roadmap.md) vẫn còn nguyên.

### `D-AN` — cắt ba chu trình P2 theo cùng một nguyên tắc

Cả ba là cùng một hình dạng: **một màn hình nhúng một thành phần, và cả hai khai phụ thuộc
lẫn nhau**. Thành phần được nhúng xây được trước khi màn hình tồn tại; màn hình thì không.

| Cạnh cắt | Giữ lại | Vì sao |
|---|---|---|
| [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) → `SCHEMA-DRIVEN-FORM` | `SCHEMA-DRIVEN-FORM → EMOJI-PICKER` · `EMOJI-PICKER → EMOJI-REGISTRY` | Picker chỉ cần kho emoji để tồn tại; form cần picker để sinh widget emoji |
| [`image-upload.md`](../specs/06-admin/image-upload.md) → `SCHEMA-DRIVEN-FORM` | `SCHEMA-DRIVEN-FORM → IMAGE-UPLOAD` · `IMAGE-UPLOAD → IMAGE-STORAGE` | Như trên, với kho ảnh |
| [`live-preview.md`](../specs/06-admin/live-preview.md) → `GAME-LEVEL-STUDIO` | `GAME-LEVEL-STUDIO → LIVE-PREVIEW` · `LIVE-PREVIEW → GAME-ENGINE-RUNTIME` | Preview chỉ cần engine thật để chạy; studio cần preview để soạn có kiểm chứng |

## Mười một spec đích

Đây là **toàn bộ** spec `P1 draft` có mọi `depends_on` đã `approved` — không phải một lát cắt
tuỳ chọn. Thứ tự theo [`roadmap.md`](../specs/roadmap.md) §P1.

| # | Spec | Dòng | Rule | Hỏi mở | `C6` | Mở khoá tiếp |
|---|---|---:|---:|---:|---:|---|
| 1 | [`01-platform/game-engine-runtime`](../specs/01-platform/game-engine-runtime.md) | 232 | 17 | 3 | 0 | parent-gate · scaffolding · feedback · offline-play · performance-budgets · live-preview |
| 2 | [`04-play/access-gating`](../specs/04-play/access-gating.md) | 205 | 8 | 2 | 1 | game-config-delivery → session → ingestion → scoring · catalog · detail |
| 3 | [`01-platform/content-seed-authoring`](../specs/01-platform/content-seed-authoring.md) | 405 | 14 | 6 | 0 | **đường găng dài nhất của MVP** |
| 4 | [`05-content/game-level-model`](../specs/05-content/game-level-model.md) | 162 | 10 | 2 | 0 | nội dung level cho seeder |
| 5 | [`01-platform/content-tagging`](../specs/01-platform/content-tagging.md) | 172 | 7 | 2 | 2 | content-search → my-library · game-catalog-public |
| 6 | [`01-platform/telemetry-pipeline`](../specs/01-platform/telemetry-pipeline.md) | 186 | 9 | 3 | 2 | basic-report |
| 7 | [`01-platform/oauth-provider-registry`](../specs/01-platform/oauth-provider-registry.md) | 254 | 15 | 2 | 0 | social-login → social-account-linking |
| 8 | [`01-platform/monitoring-and-alerting`](../specs/01-platform/monitoring-and-alerting.md) | 192 | 7 | 3 | 2 | performance-budgets |
| 9 | [`03-account/account-settings`](../specs/03-account/account-settings.md) | 203 | 11 | 1 | 0 | social-account-linking |
| 10 | [`03-account/account-deletion`](../specs/03-account/account-deletion.md) | 193 | 10 | 2 | 0 | — |
| 11 | [`06-admin/taxonomy-browser`](../specs/06-admin/taxonomy-browser.md) | 155 | 6 | 1 | 1 | — |

Tổng: **2.359 dòng**, **114 business rule**, **27 câu hỏi mở**, **8 cảnh báo `C6`**.

Mười một spec này **không phụ thuộc lẫn nhau** — approve song song được, thứ tự trên chỉ là
thứ tự ưu tiên nếu phải dừng giữa chừng.

## Quy trình chuẩn cho một spec

Đúng bảy việc như Task #5, không đổi:

1. **Đọc hết file.** Không đọc lướt.
2. **Đối chiếu với quyết định chốt sau ngày `reviewed` của file.** Mọi spec trong lô có
   `reviewed: 2026-08-04` hoặc `2026-08-05`, tức viết **trước** 37 quyết định `D-A` đến
   `D-AG`. Cần đối chiếu ít nhất: định dạng mã ở
   [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7, quy tắc khoá ngoại
   luôn dùng `id` và cơ chế `entity_id` neo dòng dõi (`D-AE`), bản đồ bảng ở
   [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7, và
   [`notification-service.md`](../specs/01-platform/notification-service.md) đã là P0
   (`D-AF`).
3. **Sửa cảnh báo `C6`** — điền cột "vì sao" cho mọi rule đang trống. Cấm xoá rule để hết
   cảnh báo.
4. **Chạy checklist review** [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10, đủ mười một mục.
5. **Xử lý từng câu hỏi mở §11.** Câu nào chặn P1 thì chốt và ghi vào sổ cái. Câu nào chặn
   P2 trở đi thì để nguyên, ghi rõ nó chặn gì.
6. **Đổi `status` sang `approved`, cập nhật `reviewed`.**
7. **`pnpm lint:specs` và `pnpm test` xanh, rồi commit.** Một spec một commit.

## Thứ tự và cổng dừng

```
Bước 0  sửa gate đỏ 21 lỗi C15, đổi số plan migration 06 -> 07        [xong, c4c910e]
Bước 1  ca âm C7 — chứng minh cổng bắt được chu trình
Bước 2  D-AH · D-AI · D-AJ · D-AK · D-AL · D-AN — cắt 8 chu trình + 3 tham chiếu tiến
Bước 3  D-AM — next-game-recommendation P1 -> P3, đếm lại index và SPEC §14
        ═══ Cổng dừng A ═══
Bước 4..14  approve 11 spec, một spec một commit
        ═══ Cổng dừng B ═══   <- điểm tách Task #6b nếu phải dừng
Bước 15 data-model-overview §7.2 — danh sách FK đa hình 7 -> 9
Bước 16 nâng C7 từ warn lên fail, cập nhật ca âm
Bước 17 đối chiếu tay và đóng sổ
        ═══ Cổng dừng cuối ═══
```

Bước 1 đứng trước Bước 2 vì lý do y hệt Bước 0 của Task #5: nếu `C7` không thật sự bắt được
chu trình thì cả Bước 2 lẫn Bước 16 đang giải một bài toán không tồn tại. Bài học
`ultracite check` trả mã thoát 0 dù có lỗi lint còn nguyên giá trị — cổng chưa có ca âm là
cổng chưa được chứng minh.

Bước 15 là lỗ hổng phát hiện khi soạn [`07-first-migration-plan.md`](07-first-migration-plan.md) §2a:
[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.2 khai "danh sách
đóng" **bảy** chỗ FK đa hình bắt buộc test orphan, nhưng
[`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) mô tả thêm
hai chỗ đa hình thật (`activities.ref_id` §7.5, `curriculum_items.entity_id` §7.6) không có
trong danh sách. §10 của chính file đó ghi "**Ask first:** Thêm một FK polymorphic thứ tám" —
nên đây là đổi contract, sửa spec trước, không quyết âm thầm lúc viết code ở Task #7.

## Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Cắt sai chiều một cạnh, phát hiện lúc implement | Trung bình | Bảy quyết định đều dựa trên `owns` của hai spec liên quan, không dựa cảm tính. Mỗi nhát cắt là một dòng frontmatter — đảo lại rẻ |
| Nâng `C7` lên lỗi làm đỏ gate ở chu trình chưa biết | Thấp | Bước 16 chạy **sau** khi Bước 2 cắt hết 8 chu trình và Cổng dừng A đã xác nhận `C7` về 0 |
| 11 spec là lô lớn hơn Task #5 (12 file nhưng nhiều dòng hơn) | Trung bình | Cổng dừng B đặt đúng chỗ tách được thành Task #6b. Mười một spec độc lập nhau nên dừng giữa chừng không để lại trạng thái nửa vời |
| `D-AM` bị đảo — chủ dự án muốn giữ [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) ở P1 | Thấp | Chỉ Bước 3 đổi. Cách thay thế đã ghi sẵn trong `D-AM` |
| Approve sớm một contract chưa gặp spec bước sau | Trung bình | Đúng loại rủi ro Task #3 gọi tên. Giảm bằng việc mỗi spec phải đối chiếu 37 quyết định `D-A`–`D-AG` ở việc số 2, không chỉ đọc một mình nó |

## Việc tiếp theo sau task này

Lô 2 của P1 — 31 spec còn lại, phần lớn đã hết bị chặn nhờ lô này. Sau đó là **Task #7**
([`07-first-migration-plan.md`](07-first-migration-plan.md)), roadmap P0 bước 8, task viết
code đầu tiên.
