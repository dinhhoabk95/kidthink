---
doc: GOAL-ALIGNMENT-AUDIT
title: Rà soát corpus spec theo mục tiêu gốc — góc nhìn phụ huynh và giáo viên mầm non
version: 1.0.0
created: 2026-08-16
---

# Rà soát corpus spec theo mục tiêu gốc

> **Ghi chú từ vựng (2026-08-16, sau bản rà soát này).** F4 đã được chốt: **một loại User
> duy nhất**, corpus không gọi tên vai trò ngoài đời của người dùng nữa. Xem
> [`glossary.md`](../specs/00-foundation/glossary.md) §7.4.1 và `BR-GLOS-04`. Tài liệu này
> giữ nguyên từ ngữ tại thời điểm rà soát để đọc được bối cảnh; mọi spec đã chuẩn hoá.

## 0. Mục tiêu gốc dùng làm thước đo

Mục tiêu sản phẩm được phát biểu lại:

> Ứng dụng web **xây dựng bài giảng mẫu** dưới dạng hệ thống trò chơi để trẻ rèn luyện tư
> duy; giúp trẻ mầm non khai phá tư duy; **hỗ trợ giáo viên và phụ huynh tự dựng bộ bài
> giảng riêng theo lộ trình riêng**.

Ba vế: (a) thư viện bài giảng mẫu, (b) trẻ chơi và tư duy, (c) người lớn tự dựng bài giảng
và lộ trình.

Corpus hiện có 138 spec, 122 thuộc MVP. Rà soát dưới đây đối chiếu từng vế với spec sở hữu
tương ứng, đứng ở hai góc nhìn: một phụ huynh có con 4 tuổi, và một giáo viên mầm non đứng
lớp 25–30 trẻ.

Kết luận ngắn: **vế (b) được đặc tả rất tốt; vế (a) có mô hình dữ liệu nhưng không có bề mặt
sử dụng; vế (c) nằm ngoài MVP hoàn toàn.** Nguyên nhân gốc không nằm ở từng spec lẻ mà ở câu
định nghĩa MVP — xem §1.

---

## 1. Phát hiện gốc — corpus đang tối ưu một mục tiêu khác

[`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) §1 định nghĩa MVP là "tập nhỏ nhất
chứng minh được **chu trình kinh doanh**", và vẽ chu trình đó:

```
Phụ huynh tìm thấy sản phẩm → trẻ chơi thử → phụ huynh tạo hồ sơ
→ trẻ tiếp tục chơi → phụ huynh thấy giá trị qua báo cáo → nâng cấp gói
→ hệ thống giữ được trải nghiệm học 4–8 tuần
```

Rồi trong cùng spec đó: "Bất cứ thứ gì không nằm trên chu trình đó đều là P4 trở đi."

Chu trình này là một phễu mua hàng. Trong đó **không có bước nào tên là "người lớn dựng được
bài giảng hay lộ trình"**. Vế (c) của mục tiêu gốc, theo đúng luật §1, tự động rơi xuống P4.
Và nó đã rơi: cả bốn spec của vế (c) đều `mvp: false`, `phase: P4`, `is_public = false`.

Mọi phát hiện còn lại trong tài liệu này đều là hệ quả suy ra đúng luật từ câu định nghĩa
này. Sửa từng spec lẻ mà không sửa §1 thì lần rà soát sau sẽ ra cùng danh sách.

**Đề xuất:** viết lại [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) §1 thành hai chu trình phải cùng đóng được ở MVP —
chu trình mua hàng đang có, **và** chu trình sư phạm:

```
Người lớn mở một bài giảng mẫu → dạy được mà không cần đào tạo
→ ghi nhận đã dạy → thấy trẻ tiến bộ ở cả phần chơi lẫn phần ngoài màn hình
→ tự sắp lại thứ tự cho phù hợp con/lớp mình
```

Đây là thay đổi contract, phải sửa spec trước khi sửa plan — theo đúng luật ở
[`index.md`](../specs/index.md) mục cuối.

---

## 2. Phát hiện chặn — phải sửa trước khi viết code P1

### F1 — Không có spec nào sở hữu bề mặt người lớn **đọc và chạy** một bài giảng

| | |
|---|---|
| Mức | Chặn |
| Vế bị ảnh hưởng | (a) và (c) |

Bằng chứng:

- [`lesson-model.md`](../specs/05-content/lesson-model.md) định nghĩa bài giảng là "kịch bản
  20–30 phút mà người lớn mở ra và biết phải làm gì", có `guide` trả lời 5 câu.
- [`activity-model.md`](../specs/05-content/activity-model.md) §7.1 quy định cấu trúc
  `instruction` cho người dạy, kèm câu nói với trẻ.
- [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) cho Manager soạn.
- [`my-library.md`](../specs/03-account/my-library.md) §7 cho User **đánh dấu lưu** một bài
  giảng.
- 13 spec của [`04-play`](../specs/index.md) đều là bề mặt trẻ.

Không spec nào `owns` màn hình mà phụ huynh hoặc giáo viên **mở bài giảng ra để dạy**. Bài
giảng có nơi soạn, có bảng lưu, có nút bookmark, có chỗ trong chương trình — nhưng không có
nơi đọc.

Đây là vế (a) của mục tiêu gốc, và nó là thứ duy nhất trong corpus không có spec sở hữu.

**Đề xuất:** thêm spec `04-play/lesson-runner.md` (hoặc `03-account/lesson-view.md`),
`phase: P1`, sở hữu: bố cục 5 câu của `guide` §7.2, danh sách vật liệu, đồng hồ theo từng
phần (khởi động / chính / đúc kết), chế độ hiển thị dùng được khi cầm máy tính bảng trước
mặt trẻ, và bản in được. Không phải P3 — không có bề mặt này thì không thể playtest bài
giảng với người thật, mà playtest lại là điều kiện của
[`pedagogical-evidence.md`](../specs/08-quality/pedagogical-evidence.md).

### F2 — Mục bài giảng trong chương trình không có đường hoàn thành → tuần không mở được

| | |
|---|---|
| Mức | Chặn |
| Vế bị ảnh hưởng | (a) |

Bằng chứng:

- [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.6:
  `curriculum_items.entity_type` là enum (`lesson` | `game_level`).
- [`curriculum-player.md`](../specs/04-play/curriculum-player.md) §4 bước 4: đường **duy
  nhất** ghi `curriculum_item_progress` là "trẻ chơi → hoàn thành".
- `BR-CUR-03`: tuần kế tiếp mở khi xong **mọi mục bắt buộc mở được** của tuần.
- `BR-LSM-02` bắt buộc mỗi bài giảng có ≥1 hoạt động ngoài màn hình; `BR-CRM-05` bắt buộc
  mỗi tuần có ≥1 hoạt động ngoài màn hình.

Một mục `entity_type = lesson` và bắt buộc thì không bao giờ có `completed_at`. Tuần chứa nó
không bao giờ mở. Hai lối thoát trong thực tế đều xấu:

1. Nhóm nội dung đánh dấu mọi mục bài giảng là tuỳ chọn → chương trình 8 tuần biến thành
   danh sách phát trò chơi, `BR-CRM-05` trở thành trang trí.
2. Chương trình không chứa bài giảng nào → vế (a) biến mất khỏi sản phẩm chạy được.

Không phải rủi ro xa. Đây là bế tắc logic đã có sẵn trong bốn business rule đang `approved`.

**Đề xuất:** định nghĩa **xác nhận của người lớn** là một loại sự kiện hoàn thành hạng nhất:

- Endpoint `POST /api/users/children/{uuid}/curriculum/items/{item}/confirm`, qua Parent
  Gate, ghi `curriculum_item_progress.completed_at` kèm `confirmed_by_user_id`.
- Sự kiện mới trong [`event-catalog.md`](../specs/00-foundation/event-catalog.md).
- **Không** ghi `mastery_state` — giữ nguyên `BR-PRG-01` và `BR-PRG-06` (mastery chỉ sinh từ
  event của phiên chơi thật). Xác nhận của người lớn là bằng chứng *đã dạy*, không phải bằng
  chứng *trẻ thành thạo*. Hai thứ khác nhau và corpus nên nói rõ điều đó.
- Ô ghi chú tuỳ chọn ≤200 ký tự cho người lớn ("bé làm được ngay", "bé cần giúp bước 2") —
  đây là dữ liệu duy nhất trong hệ thống mô tả trẻ ngoài màn hình.

### F3 — Bậc `login` khoá sau hồ sơ trẻ → bắt khai dữ liệu trẻ trước khi cho thấy giá trị

| | |
|---|---|
| Mức | Chặn (thấp về kỹ thuật, cao về tuân thủ) |
| Vế bị ảnh hưởng | (a), (c) |

[`access-ladder.md`](../specs/00-foundation/access-ladder.md) §7.2:

```ts
: caller.active_child_id               ? "login"
:                                        "free";
```

Người lớn đã đăng ký, đã xác thực email, chưa tạo hồ sơ trẻ → đứng ở bậc `free`, tức 6 màn
chơi. Muốn xem thêm bất cứ thứ gì, kể cả một bài giảng mẫu để đánh giá sản phẩm, phải khai
tên và năm sinh của con trước.

Ba vấn đề:

1. **Thứ tự sai với phụ huynh.** Xin dữ liệu của con trước khi chứng minh được giá trị là
   thứ tự có ma sát cao nhất có thể.
2. **Ngược nguyên tắc tối thiểu hoá dữ liệu.** Thu dữ liệu trẻ trước khi có nhu cầu thật là
   điều [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) tồn
   tại để tránh.
3. **Chặn hoàn toàn giáo viên**, là người có lý do chính đáng để không tạo hồ sơ trẻ nào.

Chính spec này đã nói lý do giữ bậc `login` là "để có chỗ gate **lưu tiến độ** miễn phí"
(§11 Q3). Lưu tiến độ mới cần hồ sơ trẻ; **xem nội dung thì không**.

**Đề xuất:** tách hai điều kiện. `login` mở theo phiên đăng nhập hợp lệ; `active_child_id`
chỉ là điều kiện của việc **ghi** `play_sessions` và `mastery_state`. Sửa một dòng trong
`allowedTiers`, cộng một dòng ở `BR-LAD` mới, và ma trận 20 ô ở
[`access-gating.md`](../specs/04-play/access-gating.md) phải cập nhật theo.

---

## 3. Phát hiện cao — sai lệch giữa lời hứa và cái bán được

### F4 — Giáo viên được nêu trong mục tiêu và trong gói `premium`, nhưng MVP không có năng lực nào cho họ

| | |
|---|---|
| Mức | Cao |
| Vế bị ảnh hưởng | (c) |

Bằng chứng:

- [`package-catalog.md`](../specs/00-foundation/package-catalog.md) §7.1 ghi đối tượng của
  `premium` là "Phụ huynh theo dõi sâu **+ giáo viên**".
- Quota `child_profiles` của `premium` = **5**
  ([`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) §7.3).
- Toàn bộ năng lực hình dạng-giáo-viên nằm ở add-on `is_public = false`:
  [`lesson-plan-creator`](../specs/07-addon/lesson-plan-creator.md),
  [`personal-curriculum`](../specs/07-addon/personal-curriculum.md),
  [`custom-game-builder`](../specs/07-addon/custom-game-builder.md) — cả ba `phase: P4`.
- Mỗi trẻ tối đa 1 chương trình đang theo (`D-MB`).

Một lớp mầm non thật có 25–35 trẻ. Năm hồ sơ không mô tả được một lớp, và mọi khái niệm quản
lý lớp bị `BR-MVP-04` cấm cứng — kể cả chỗ trống trong schema.

Nên đọc thẳng: giáo viên mua `premium` sẽ nhận được một sản phẩm dành cho gia đình có 5 chỗ
ngồi. Đó không phải lỗi kỹ thuật, đó là lời hứa không có hàng.

Lưu ý: `BR-MVP-04` **không sai**. Cấm quản lý lớp là quyết định đúng — nó kéo theo mô hình
bán, mô hình hỗ trợ và nghĩa vụ pháp lý khác hẳn. Vấn đề là mục tiêu sản phẩm và trang giá
vẫn hứa với giáo viên trong khi luật phạm vi đã loại họ ra.

**Hai đường, phải chọn một:**

**Đường A — bỏ giáo viên khỏi mục tiêu.** Sửa §0 mục tiêu sản phẩm và [`package-catalog.md`](../specs/00-foundation/package-catalog.md)
§7.1 bỏ chữ "giáo viên". Rẻ, trung thực, và thu hẹp sản phẩm về đúng thứ MVP đang xây.

**Đường B — mở "chế độ dạy nhóm", không hồ sơ trẻ (khuyến nghị).** Một người lớn mở bài
giảng hoặc màn chơi lên máy chiếu/tivi cho cả nhóm; hệ thống **không** tạo hồ sơ trẻ nào,
**không** ghi `mastery_state`, **không** ghi dữ liệu định danh trẻ nào cả. Đặc điểm:

- Không cần bảng mới, không cần cột mới → **không đụng `BR-MVP-04`**, không cần nới bất kỳ
  rule nào. Nó là một chế độ hiển thị cộng một quy tắc telemetry, không phải một mô hình
  kinh doanh mới.
- Né hoàn toàn F5 bên dưới: không thu dữ liệu trẻ thì không có chuỗi đồng ý nào để đứt.
- Đúng với việc giáo viên thật sự làm trên lớp: dạy chung, quan sát bằng mắt, không chấm
  điểm từng bé trong ứng dụng.
- Giá trị mang về nhà của giáo viên là **giáo án soạn được và xuất được PDF** — tức
  [`lesson-plan-creator`](../specs/07-addon/lesson-plan-creator.md) +
  [`pdf-export`](../specs/07-addon/pdf-export.md) phải vào MVP, không phải P4.

Đường B là cách duy nhất giữ được vế (c) mà không phá bất kỳ ranh giới nào đang có.

### F5 — Rủi ro pháp lý chưa ai sở hữu: giáo viên tạo hồ sơ trẻ thì chuỗi đồng ý đứt

| | |
|---|---|
| Mức | Cao |
| Vế bị ảnh hưởng | tuân thủ |

[`actors.md`](../specs/00-foundation/actors.md) §2.2 nói rõ, và nói đúng vì sao: "Có thể là
phụ huynh, có thể là giáo viên — hệ thống **không phân biệt**." Lý do đưa ra hợp lý: một
người vừa là phụ huynh vừa là giáo viên là ca dùng chính.

Nhưng hệ quả chưa được nói ở đâu: nếu người tạo hồ sơ trẻ **không phải người giám hộ**, thì
sự đồng ý ghi trong [`consent-management.md`](../specs/03-account/consent-management.md) là
đồng ý của người không có thẩm quyền cho đứa trẻ đó. Theo Luật 91/2025 và Nghị định 13 mà
[`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) viện dẫn, đó là dữ liệu trẻ em thu thập không có cơ sở hợp pháp.

Không spec nào cấm, cảnh báo, hay thậm chí nhắc tới tình huống này. Nó là khoảng trống sinh
ra trực tiếp từ quyết định "một loại User" — quyết định đúng, nhưng thiếu rào.

**Đề xuất:** thêm `BR-CDC` mới trong [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md): người tạo hồ sơ trẻ phải
khẳng định mình là cha, mẹ hoặc người giám hộ hợp pháp của trẻ đó; câu khẳng định này nằm
trong ô đồng ý ở [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md), lưu
kèm dấu thời gian, và audit theo [`audit-log.md`](../specs/01-platform/audit-log.md). Đồng thời trỏ giáo viên sang đường B của F4 như
đường dùng được sanctioned.

### F6 — Báo cáo chỉ đo phần màn hình, ngược với triết lý sản phẩm

| | |
|---|---|
| Mức | Cao |
| Vế bị ảnh hưởng | (a), (b) |

[`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) §1 nói thẳng: "Sản phẩm
cho trẻ 3–6 **không được** tối ưu cho thời gian màn hình." `BR-HPL-05` cấm mọi cơ chế kéo dài
thời gian chơi.

Nhưng [`basic-report.md`](../specs/03-account/basic-report.md) §7.1 — sáu mục mà phụ huynh
nhìn để quyết định trả tiền — đọc **toàn bộ** từ telemetry phiên chơi: số phiên, tổng phút,
số ngày chơi, tỉ lệ hoàn thành, trò chơi yêu thích, 5 phiên gần nhất. Hoạt động ngoài màn
hình chỉ xuất hiện ở mục thứ sáu, dưới dạng **gợi ý cho tuần tới**, và ngay cả gợi ý đó ở P1
cũng lấy từ một danh sách tĩnh 12 hoạt động (`D-BB`), không liên quan tới bài giảng nào.

Hệ quả cho phụ huynh: chỉ số duy nhất tăng lên khi họ dùng sản phẩm đúng cách là **số phút
con ngồi trước màn hình**. Sản phẩm bảo họ đừng tối ưu thời gian màn hình, rồi đưa cho họ
đúng một cái thước đo bằng thời gian màn hình. Phụ huynh nhạy cảm với điều này sẽ đọc ra sự
mâu thuẫn, và đó chính là nhóm phụ huynh mà `BR-HPL-05` được viết để thuyết phục.

**Đề xuất:** thêm mục thứ bảy vào [`basic-report.md`](../specs/03-account/basic-report.md) §7.1 — "Hoạt động cùng bé ngoài màn
hình" — lấy dữ liệu từ xác nhận của người lớn ở F2 (số hoạt động đã làm, ghi chú gần nhất).
Bản tổng kết tuần qua email (`D-CW`) mở đầu bằng mục này, không bằng số phút chơi.

---

## 4. Phát hiện trung bình

### F7 — Thứ tự phase đảo ngược: cái chứng minh sản phẩm được xây cuối và bị cắt đầu

Phân bố spec MVP theo [`index.md`](../specs/index.md) §Tổng:

| Khu vực | Spec MVP | Người dùng cuối có thấy không |
|---|---:|---|
| `06-admin` | 29 | Không |
| `01-platform` | 26 | Không |
| `03-account` | 19 | Một phần |
| `04-play` | 13 | Có — được ghi là "core business" |
| `05-content` | 4 | Gián tiếp |

Và trong 13 spec `04-play`, ba spec làm nên lộ trình học —
[`curriculum-player`](../specs/04-play/curriculum-player.md),
[`progress-and-mastery`](../specs/04-play/progress-and-mastery.md),
[`next-game-recommendation`](../specs/04-play/next-game-recommendation.md) — đều `phase: P3`.
Cả [`lesson-model.md`](../specs/05-content/lesson-model.md),
[`activity-model.md`](../specs/05-content/activity-model.md) và
[`curriculum-model.md`](../specs/05-content/curriculum-model.md) cũng P3.

Rồi [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) §5 xếp thứ tự hy sinh: cắt số 1 là **5 chương trình xuống còn 1**, cắt số
3 là **120 màn chơi xuống 80**, cắt số 4 là **rút gọn báo cáo nâng cao**.

Đọc từ ghế phụ huynh: mọi thứ họ trả tiền để có — lộ trình, bài giảng, bằng chứng tiến bộ —
vừa được xây sau cùng, vừa nằm ở đầu danh sách bị cắt. Mọi thứ họ không bao giờ nhìn thấy —
hàng đợi thanh toán, trình xem log lỗi, quản lý cờ tính năng — đều là MVP và không nằm trong
danh sách cắt.

Điều này còn vi phạm nguyên tắc số 5 của chính [`roadmap.md`](../specs/roadmap.md): "Vertical
slice, không horizontal layer." Corpus đang xây gần trọn tầng tài khoản và tầng quản trị theo
chiều ngang trước khi có **một** lộ trình học chạy thông từ đầu tới cuối.

**Đề xuất:** kéo một lát cắt dọc mỏng lên P1 — **1 chương trình × 4 tuần**, có bài giảng
thật, có mục ngoài màn hình, có xác nhận của người lớn, có báo cáo hai phần. Không cần đủ 5
chương trình, không cần 120 màn chơi. Cần đúng một đường đi trọn vẹn để playtest với gia
đình thật ở P1, thay vì phát hiện vấn đề sư phạm ở P3 khi đã seed xong toàn bộ nội dung.

### F8 — Bộ năng lực không neo vào Chương trình Giáo dục Mầm non của Bộ GD&ĐT

[`taxonomy/index.md`](../taxonomy/index.md) định nghĩa 6 năng lực C1–C6 tự đặt, 41 nhánh, 230
kỹ năng. Không có cột nào ánh xạ sang 5 lĩnh vực phát triển của Chương trình GDMN hiện hành
(thể chất, nhận thức, ngôn ngữ, tình cảm–kỹ năng xã hội, thẩm mỹ).

Với giáo viên, đây là rào cản áp dụng cụ thể: kế hoạch giáo dục của lớp lập theo lĩnh vực của
Bộ, và mọi thứ mang vào lớp phải quy chiếu về đó được. Không có ánh xạ thì bài giảng của sản
phẩm không nhét được vào sổ kế hoạch, dù nội dung tốt tới đâu.

Với phụ huynh, câu hỏi đầu tiên khi cân nhắc trả tiền là "cái này có theo chương trình mầm
non không". Corpus hiện không có chỗ nào trả lời được câu đó.

Đáng chú ý thêm: phân bố kỹ năng lệch nặng về toán và logic — C1 chiếm 99/230 kỹ năng, trong
khi C4 Observation (16) và C5 Language (21) được chính file này ghi nhận là "khoảng trống lớn
nhất". Hai khoảng trống đó lại đúng là hai vùng gần nhất với lĩnh vực *nhận thức* và *ngôn
ngữ* của Bộ. Mục tiêu gốc nói "rèn luyện tư duy" nói chung, không nói "toán".

**Đề xuất:** thêm trường ánh xạ ở tầng năng lực và nhánh → lĩnh vực GDMN; hiển thị nó trên
`guide` của bài giảng và trên báo cáo cho phụ huynh. Chi phí là một bảng tra và một dòng
hiển thị; giá trị là tín hiệu tin cậy mạnh nhất cho cả hai nhóm người dùng.

### F9 — Bằng chứng sư phạm là spec mỏng nhất corpus

[`pedagogical-evidence.md`](../specs/08-quality/pedagogical-evidence.md) dài 74 dòng.
[`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) dài gấp gần mười
lần. Trong spec bằng chứng sư phạm:

- §7 đặt ngưỡng ≥85% trẻ hiểu nhiệm vụ, ≥75% trẻ tiến từ có trợ giúp sang độc lập — **không
  nêu cỡ mẫu, không nêu ai chạy, không nêu chạy khi nào**.
- §9 không có kịch bản gherkin nào, khác mọi spec MVP còn lại.
- §11 ghi "Không." — không câu hỏi mở nào, trong khi đây là phần chưa ai đo lần nào.

Đối chiếu: `BR-GLM-02` ở
[`game-level-model.md`](../specs/05-content/game-level-model.md) biến trần số mục theo nhóm
tuổi thành **lý do từ chối duyệt**, trong khi §11 Q1 của chính file đó thừa nhận con số ấy
"đang là phán đoán chuyên môn chưa có trích dẫn".

Tức là: một con số chưa có nguồn thì chặn merge nội dung, còn tuyên bố trung tâm của sản
phẩm — "giúp trẻ khai phá tư duy" — thì không chặn gì cả.

**Đề xuất:**
1. Playtest thành cổng ra của P1: tối thiểu 8 trẻ mỗi nhóm tuổi, có biên bản, kết quả gắn
   vào cổng phase như [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) đã làm.
2. Cho `BR-GLM-02` một trích dẫn, hoặc hạ nó từ *từ chối duyệt* xuống *cảnh báo cho người
   duyệt* cho tới khi có nguồn. Giữ nguyên như hiện tại thì lần đầu nó chặn một lô nội dung
   là lần nó bị nới, và khi đó không ai biết nới bao nhiêu là an toàn.

### F10 — Một bản hướng dẫn cho mọi người lớn; bản cho giáo viên hoãn tới P4

`BR-LSM-03` yêu cầu `guide` viết cho "người lớn không được đào tạo", và §11 Q2 hoãn bản dành
cho giáo viên sang P4.

Năm câu ở §7.2 rất đúng cho phụ huynh. Với giáo viên mầm non đã được đào tạo, cùng nội dung
đó vừa thừa vừa thiếu: thiếu mục tiêu theo lĩnh vực (F8), thiếu cách tổ chức khi có 25 trẻ
thay vì 1, thiếu tiêu chí quan sát đủ chuẩn để ghi vào sổ.

**Đề xuất:** đừng làm hai bản hướng dẫn — đó là hai dây chuyền nội dung và sẽ lệch nhau. Thêm
một khối trường **tuỳ chọn** trên cùng một bài giảng: tổ chức nhóm, biến thể cho nhóm đông,
gợi ý ghi nhận quan sát. Hiện có điều kiện. Chi phí một khối JSON, không phải một quy trình
biên soạn thứ hai.

### F11 — Âm thanh đọc chỉ dẫn chưa chốt, nhưng mọi ràng buộc nội dung đã giả định nó tồn tại

`BR-GLM-04` yêu cầu chỉ dẫn ≤12 từ và "đọc thành tiếng dưới 5 giây". `BR-ENG-10` ở
[`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) cấm chữ mang chỉ dẫn
một mình. Trẻ 3–6 chưa đọc — đây là ràng buộc đúng.

Nhưng §11 Q3 của cùng file vẫn để mở: thu âm người thật hay tổng hợp giọng nói. Câu hỏi này
nằm ở cuối một spec nền tảng, trong khi "Đường găng của MVP" ở
[`index.md`](../specs/index.md) chỉ liệt kê taxonomy và seeder nội dung.

Thu âm cho ≥120 màn chơi là một hạng mục sản xuất có khối lượng, chi phí và thời gian chưa ai
ước lượng — và nó chặn P1, không phải P3. Thu lại toàn bộ sau khi đã seed thuộc đúng loại chi
phí mà §5 [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) gọi là "rẻ khi làm đúng lúc, rất đắt khi vá sau".

**Đề xuất:** đưa quyết định âm thanh vào "Đường găng của MVP" ở [`index.md`](../specs/index.md), chốt trước khi
seed màn chơi đầu tiên.

### F12 — Mỗi trẻ chỉ một chương trình đang theo

`D-MB` chốt tối đa 1 enrollment `active` mỗi trẻ, lý do "tránh phân tán tiến độ". Với một đứa
trẻ, hợp lý.

Nhưng nó cũng chặn phụ huynh chạy song song một chương trình theo tuổi và một lộ trình ngắn
theo chủ đề — đúng thứ mà vế (c) của mục tiêu hứa. Nên xem lại cùng lúc với F4, không tách
riêng.

---

## 5. Những thứ corpus đang làm rất tốt — đừng đổi khi sửa các mục trên

Nêu ra để hiệu chỉnh: các mục trên là sai lệch trọng tâm, không phải chất lượng kém. Những
ràng buộc dưới đây hiếm gặp trong sản phẩm cho trẻ em ở thị trường Việt Nam và là tài sản
thật của corpus:

| Ràng buộc | Vì sao quý |
|---|---|
| `BR-HPL-05`, `BR-PRG-07` — cấm mọi cơ chế gây nghiện, không chuỗi ngày ép buộc | Đây là thứ phụ huynh kiểm tra đầu tiên và gần như sản phẩm nào cũng vi phạm |
| `BR-BRP-02`, `BR-BRP-04` — cấm ngôn ngữ chẩn đoán, cấm so sánh với trẻ khác hay "chuẩn độ tuổi" | Đúng ranh giới đạo đức, và đúng luật |
| `BR-PRG-05` — không so sánh ngay cả giữa các con trong cùng nhà | Chi tiết rất tinh, ít ai nghĩ tới |
| `BR-LSM-04`, `BR-ACM-04` — vật liệu phải có sẵn trong nhà | Khác biệt giữa bài giảng dùng được và bài giảng để ngắm |
| `BR-GLM-05` — cấm phủ định trong chỉ dẫn | Đúng về mặt phát triển ngôn ngữ, và hầu như không ai làm |
| `BR-HPL-02`, `BR-LAD-08` — không cắt ngang phiên trẻ đang chơi | Đặt trải nghiệm của trẻ trên doanh thu một lượt |
| `BR-ACM-07` §7.3 — danh sách vật liệu cấm theo nhóm tuổi | An toàn cụ thể, không chung chung |

Không đề xuất nào ở §1–§4 yêu cầu nới bất kỳ ràng buộc nào trong bảng này.

---

## 6. Thứ tự đề xuất thực hiện

| # | Việc | Loại | Chặn gì |
|---|---|---|---|
| 1 | Viết lại [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) §1 — thêm chu trình sư phạm bên cạnh chu trình mua hàng | Đổi contract | Mọi thứ còn lại |
| 2 | Chốt F4: đường A hay đường B | Quyết định sản phẩm | F5, F10, F12, trang giá |
| 3 | Thêm spec bề mặt đọc/chạy bài giảng (F1), `phase: P1` | Spec mới | Playtest, vế (a) |
| 4 | Thêm xác nhận của người lớn (F2) — spec, event, endpoint | Đổi contract | Chương trình có bài giảng |
| 5 | Tách `login` khỏi `active_child_id` (F3) | Sửa contract | Ma trận gating, dùng thử |
| 6 | Thêm mục thứ bảy vào báo cáo cơ bản (F6) | Sửa spec | Bằng chứng giá trị |
| 7 | Thêm rào người giám hộ (F5) | Sửa spec | Tuân thủ |
| 8 | Kéo một lát cắt dọc 4 tuần lên P1 (F7) | Sửa roadmap | Thứ tự thực thi |
| 9 | Ánh xạ năng lực → lĩnh vực GDMN (F8) | Thêm dữ liệu | Áp dụng thực tế |
| 10 | Playtest thành cổng ra P1; xử lý `BR-GLM-02` (F9) | Sửa spec | Chất lượng sư phạm |
| 11 | Chốt âm thanh chỉ dẫn (F11) | Quyết định | Seed nội dung |

Mục 1 và 2 phải chốt trước. Mục 3–7 là sửa contract, theo luật của corpus thì sửa spec xong
mới lập plan.

## 7. Câu hỏi cần người quyết trả lời

| # | Câu hỏi | Chặn |
|---|---|---|
| 1 | Giáo viên **có** nằm trong đối tượng của MVP không? Nếu có thì đường A hay đường B ở F4 | 2, 3, 10, 12 và trang giá |
| 2 | Chu trình sư phạm ở §1 có được nâng lên ngang hàng chu trình mua hàng trong [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) không | toàn bộ |
| 3 | Có chấp nhận kéo một lát cắt dọc 4 tuần lên P1, đổi lại P1 dài hơn không | roadmap |
| 4 | Có bắt buộc ánh xạ sang lĩnh vực GDMN không, hay để sau như một tính năng tiếp thị | F8 |
