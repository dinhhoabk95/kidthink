---
spec: THINKING-COVERAGE-MATRIX
title: Ma trận phủ trục tư duy — cổng đo sáu năng lực
area: quality
status: implemented
mvp: false
phase: P3
reviewed: 2026-08-22
owns:
  - Ngưỡng phủ nội dung theo trục tư duy
  - Cổng chặn khi một ô phủ tụt dưới sàn
depends_on:
  - CONTENT-TAGGING
  - TAXONOMY-SERVICE
  - CONTENT-LIFECYCLE
---

# Ma trận phủ trục tư duy — cổng đo sáu năng lực

## 1. Objective

Sản phẩm tuyên bố rèn luyện sáu năng lực tư duy. Hôm nay không cổng nào trả lời được câu
"đã phủ đủ chưa" bằng một con số — và tệ hơn, thứ đáng ra để đo đang hỏng lặng lẽ.

[`content-tagging.md`](../01-platform/content-tagging.md) §7.1 khai ba trục là **từ vựng đóng**. Cổng seed thì nhận bất kỳ
chuỗi nào dạng slug, nên seed hiện tại đã có `counting` và `gross_motor_counting` — hai giá
trị không thuộc 12 giá trị của trục `thinking`, và cổng in ra là hợp lệ. Trục dùng để đo phủ
mà tự chế được giá trị mới thì phép đo vô nghĩa.

File này làm hai việc: đóng lại từ vựng bằng một cổng có ca âm, và biến "phủ đủ sáu năng
lực" thành một ma trận có sàn, chặn được, đọc được.

Nó đo **catalog**, không đo trẻ. Trẻ học được gì thuộc [`pedagogical-evidence.md`](pedagogical-evidence.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Cổng nội dung | — | Chạy ma trận, chặn khi ô tụt dưới sàn |
| Người soạn | `content_reviewer` | Đọc ô trống để biết soạn gì tiếp |
| Manager | `super_admin` | Xem ma trận trên bảng điều khiển |
| Dev | — | Giữ từ vựng đóng thật sự đóng |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `pnpm --filter @mindkid/db test` | Cổng nội dung | Chạy ma trận, mã thoát khác 0 khi thủng sàn |
| [`admin-dashboard.md`](../06-admin/admin-dashboard.md) | Manager | Hiển thị ma trận, ô trống nổi lên trước |
| Cổng publish của [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) | Cổng nội dung | Chặn publish làm thủng sàn |

## 4. Main flow

1. Cổng đọc toàn bộ nội dung `published` từ corpus seed trong repo — xem mục 7.0. Nguồn
   không đọc được, hoặc có hàng không quy được về competency hay mechanic, thì cổng **dừng
   với mã thoát khác 0**; cấm nhánh trả danh sách rỗng rồi báo xanh.
2. Với mỗi mục, lấy `competency`, band tuổi, và tag trục `thinking`.
3. Tag không thuộc 12 giá trị đóng thì **dừng ngay** với lỗi, không tính tiếp.
4. Cổng dựng ba ma trận ở §7.2.
5. Cổng so từng ô với sàn ở §7.3.
6. Ô nào dưới sàn thì in tên ô, số hiện có, số còn thiếu.
7. Có ô thủng thì mã thoát khác 0.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Tag ngoài từ vựng | Seed tự chế giá trị | Dừng, nêu tên tag và file. Không có nhánh chấp nhận |
| Nội dung thiếu tag trục `thinking` | Người soạn quên | Đã bị `BR-TAG-02` chặn ở cổng publish. Ma trận nêu lại nếu lọt |
| Nội dung `draft` hoặc `in_review` | Chưa publish | Không tính vào ma trận. Phủ đếm thứ trẻ mở được, không đếm thứ đang viết |
| Nội dung `archived` | Đã gỡ | Không tính. Archive làm tụt phủ là thông tin đúng, cần thấy |
| Ô dưới sàn nhưng đang trong phase chưa tới | Sàn của phase sau | Cảnh báo, chưa chặn. Sàn nào chặn ở phase nào ghi ở §7.3 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TCM-01` | Từ vựng ba trục **đóng thật**: giá trị ngoài danh sách làm cổng đỏ, không có nhánh slug dự phòng. Cổng sống ở `packages/db/tests/gates/thinking-coverage.ts`. **Trạng thái 2026-08-29:** đóng thật cho `thinking` và `mechanic`; **nới** cho `what` (28 giá trị, hợp hai bộ) và cho `theme` (22 giá trị, hợp hai bộ). Cổng seed thì vẫn có nhánh `SLUG_REGEX.test(tag)` — xem mục 7.3a của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | Nhánh dự phòng hiện tại là lý do `gross_motor_counting` sống được trong seed. Một cổng nhận mọi thứ không phải cổng |
| `BR-TCM-02` | Cổng phải có **ca âm** trong test: một tag bịa đặt phải làm cổng đỏ | Bài học đã trả giá một lần với công cụ lint khác — cổng không có ca âm là cổng không biết mình hỏng |
| `BR-TCM-03` | Ma trận đếm **chỉ nội dung `published`**, đọc từ corpus seed trong repo. Nguồn không đọc được hoặc hàng không quy được competency hay mechanic thì cổng đỏ, **cấm giá trị mặc định** | Phủ là thứ trẻ mở được hôm nay, không phải thứ đang nằm trong hàng đợi duyệt. Bản cũ trả `[]` khi mất kết nối và mặc định `"C1"` khi không quy được, nên nó in "18/18 ô thiếu" kèm mã thoát 0 và dồn mọi hàng lạ vào C1 |
| `BR-TCM-04` | Mỗi ô `competency × band tuổi` đạt sàn số game level ở §7.3 | Đây là dạng kiểm được của câu "phủ đủ sáu năng lực cho mọi lứa" |
| `BR-TCM-05` | Mỗi ô `competency × band tuổi` phủ bởi **≥2 mechanic khác nhau** | Một năng lực chỉ luyện qua một cơ chế thì trẻ đang học cơ chế, không học năng lực |
| `BR-TCM-06` | Mỗi giá trị trục `thinking` đạt sàn tối thiểu toàn catalog | Thiếu ràng buộc này thì 12 tiến trình tư duy dồn hết vào `count` và `match` — hai cái dễ soạn nhất |
| `BR-TCM-07` | **Luật cân bằng**: competency nhiều nội dung nhất không quá 3 lần competency ít nhất | Không có luật này thì tổng số đẹp mà thực tế là một sản phẩm đếm số có kèm vài trò khác |
| `BR-TCM-08` | Publish làm thủng một sàn đang chặn thì **bị chặn**; archive làm thủng thì **cảnh báo** | Publish là hành động thêm, chặn được. Archive thường là gỡ nội dung sai — chặn nó buộc người ta giữ lại nội dung sai |
| `BR-TCM-09` | Báo cáo in **ô còn thiếu và thiếu bao nhiêu**, không in tỉ lệ phần trăm tổng | Một con số phần trăm 92 che được sáu ô trống. Danh sách ô thiếu thì không che được gì |
| `BR-TCM-10` | Ma trận này **không** dùng làm bằng chứng hiệu quả sư phạm | Phủ catalog và hiệu quả với trẻ là hai thứ khác nhau. Trộn chúng là đúng loại tuyên bố mà `BR-PED-01` cấm |
| `BR-TCM-11` | Ngưỡng sàn cấu hình được qua tệp cấu hình bên ngoài, không hardcode hằng số trong mã nguồn | Cho phép vận hành điều chỉnh mở sàn dần theo từng phase mà không phải can thiệp sửa mã nguồn |


## 7. Data

**Đọc:** corpus seed trong repo (`packages/db/src/seed-content/`) kèm registry template của
engine. Chế độ `--from-db` đọc `game_levels` · `lessons` · `content_tag_map` ·
`content_skill_map` · `skills` · `competencies`.
**Ghi:** không ghi vào cơ sở dữ liệu. Đầu ra là báo cáo và mã thoát.

### 7.0 Vì sao nguồn mặc định là corpus seed

Cơ sở dữ liệu dev dùng chung `DATABASE_URL` với test tích hợp. Đo được ngày 2026-08-22:
nó chứa **281** hàng `game_templates` (gồm `GT-999`, `GT-212`, … do test sinh) và **1854**
hàng `game_levels`. Ma trận đọc từ đó báo `C1 3-4: 1444` và năm competency còn lại bằng 0 —
một con số không nói gì về catalog. Corpus seed thì tất định, luôn đọc được, và là thứ được
review qua PR (`D7`).

### 7.1 Từ vựng đóng

Nguồn sự thật là [`content-tagging.md`](../01-platform/content-tagging.md) §7.1. File này không chép lại giá trị — nó chỉ
ràng buộc rằng cổng đọc đúng nguồn đó và không có nhánh dự phòng.

Trục `thinking` có 12 giá trị. Trục `what` có 14. Trục `mechanic` suy ra từ template, không
nhập tay.

### 7.2 Ba ma trận

| Ma trận | Chiều | Đo cái gì |
|---|---|---|
| Phủ năng lực | `competency × band tuổi` | 6 × 3 = 18 ô |
| Đa dạng cơ chế | `competency × band tuổi` | Số mechanic khác nhau trong mỗi ô |
| Phủ tiến trình tư duy | `thinking` | 12 ô, đếm toàn catalog |

### 7.3 Sàn

| Ma trận | Sàn | Chặn từ phase |
|---|---|---|
| Phủ năng lực | ≥6 game level mỗi ô | P3 |
| Phủ năng lực | ≥1 lesson mỗi ô | P4 |
| Đa dạng cơ chế | ≥2 mechanic mỗi ô | P3 |
| Phủ tiến trình tư duy | ≥5 game level mỗi giá trị | P4 |
| Luật cân bằng | tỉ lệ cao nhất trên thấp nhất ≤3 | P4 |

**Đo lại ngày 2026-08-29** (số cũ ngày 2026-08-22 là 172 game level):

| Số đo | 2026-08-22 | 2026-08-29 |
|---|---:|---:|
| Game level trong corpus seed | 172 | **228** |
| Ô đạt sàn 6 game level | 18 / 18 | 18 / 18 |
| Ô đạt sàn 2 mechanic | 18 / 18 | 18 / 18 |
| `predict` | 4 | **4** |
| `plan` | 1 | **3** |
| `shift` | 0 | **3** |
| Lượt gắn trục `thinking` ngoài từ vựng | không đo | **0 / 284** |
| Tỉ lệ competency cao nhất trên thấp nhất | không đo | **2,87** (C1 66, C5 23) |

`shift` thoát khỏi 0 nhờ lô khuôn khoảng trống taxonomy — `GT-027` đổi luật giữa chừng là
nguồn chính. Ba giá trị `predict`, `plan`, `shift` vẫn dưới sàn 5 của phase P4, và cả ba đều
đến từ engine đang ở mức mẫu 3 level. Đó là lý do sàn theo trục engine ở
[`engine-content-depth.md`](../05-content/engine-content-depth.md) bổ trợ cho ma trận này: ô
`competency × band tuổi` đạt sàn không nói gì về việc engine sinh ra `shift` có nội dung hay
không.

Luật cân bằng ở `BR-TCM-07` (tỉ lệ cao nhất trên thấp nhất ≤3) đang đạt ở 2,87 — sát trần.

**Cổng đang đỏ.** `packages/db/tests/gates/thinking-coverage.test.ts` fail với 7 vi phạm
`BR-TCM-01`, tất cả ở trục `theme`: `household` (2 level), `art` (4), `technology` (1). Ba
giá trị đó không có trong `CANONICAL_THEME_TAGS`. Đường sửa ở mục 7.1b của
[`content-theme-registry.md`](../05-content/content-theme-registry.md): nhận `art` vào từ
vựng, gắn lại 3 level còn lại bằng version mới.

Sàn không phải để gây khó; nó để mức hiện có không tụt xuống mà không ai thấy.

### 7.4 Hình dạng báo cáo

```
Phủ năng lực (sàn 6)
  C1  3-4: 7   4-5: 7   5-6: 6
  C2  3-4: 6   4-5: 7   5-6: 7
  C3  3-4: 4   4-5: 8   5-6: 8      ← C3 3-4 thiếu 2

Đa dạng cơ chế (sàn 2)
  C6  5-6: 1 mechanic                ← thiếu 1

Phủ tiến trình tư duy (sàn 5, chặn từ P4)
  plan: 0   inhibit: 0   shift: 0    ← cảnh báo, chưa chặn ở P3
```

Ô thiếu in kèm số còn thiếu. Không in phần trăm — `BR-TCM-09`.

## 8. API contract

Không sở hữu route. Báo cáo sinh bởi lệnh cổng và hiển thị lại trên
[`admin-dashboard.md`](../06-admin/admin-dashboard.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-TCM-01 — tag ngoài từ vựng làm cổng đỏ
  Given một lesson mang thinking_tags giá trị "gross_motor_counting"
  When chạy cổng phủ
  Then cổng thoát với mã khác 0
  And nêu tên tag và file chứa nó

Scenario: BR-TCM-02 — cổng có ca âm
  Given bộ test của cổng phủ
  When đọc danh sách ca kiểm
  Then tồn tại ít nhất một ca dùng tag bịa đặt và mong đợi cổng đỏ

Scenario: BR-TCM-03 — chỉ đếm nội dung published
  Given 10 game level draft cho ô C1 band 3-4
  When chạy cổng phủ
  Then 10 level đó không được tính vào ô C1 band 3-4

Scenario: BR-TCM-03 — nguồn không đọc được thì cổng đỏ
  Given nguồn nội dung không mở được
  When chạy cổng phủ
  Then cổng thoát với mã khác 0 và nêu nguồn nào hỏng
  And cổng không in ra một ma trận toàn số 0 kèm mã thoát 0

Scenario: BR-TCM-03 — hàng không quy được thì nêu ra, không mặc định
  Given một hàng nội dung không quy được về competency
  When chạy cổng phủ
  Then cổng nêu mã của hàng đó
  And hàng đó không bị gán về C1

Scenario: BR-TCM-04 — ô dưới sàn thì chặn
  Given ô C3 band 3-4 có 4 game level published và sàn là 6
  When chạy cổng phủ ở phase P3
  Then cổng thoát với mã khác 0
  And báo cáo nêu C3 3-4 thiếu 2

Scenario: BR-TCM-05 — một ô chỉ có một mechanic thì chặn
  Given ô C6 band 5-6 có 8 game level nhưng đều dùng GT-001
  When chạy cổng phủ
  Then cổng thoát với mã khác 0
  And báo cáo nêu ô đó thiếu đa dạng cơ chế

Scenario: BR-TCM-07 — luật cân bằng
  Given C1 có 60 game level và C5 có 15
  When chạy cổng phủ ở phase P4
  Then cổng thoát với mã khác 0
  And báo cáo nêu tỉ lệ vượt 3

Scenario: BR-TCM-08 — archive chỉ cảnh báo
  Given archive một game level làm ô C2 band 4-5 tụt dưới sàn
  When chạy cổng phủ
  Then cổng in cảnh báo
  And mã thoát bằng 0

Scenario: BR-TCM-09 — báo cáo không in phần trăm tổng
  When đọc đầu ra của cổng phủ
  Then đầu ra liệt kê từng ô thiếu và số còn thiếu
  And không dòng nào là một tỉ lệ phần trăm phủ tổng

Scenario: BR-TCM-06 — tiến trình tư duy dưới sàn bị nêu
  Given giá trị thinking "plan" có 0 game level published
  When chạy cổng phủ
  Then báo cáo nêu plan thiếu 5
```

## 10. Boundaries

**Always**
- Đọc từ vựng từ nguồn sự thật, không chép giá trị.
- Giữ ca âm trong bộ test của cổng.
- In ô thiếu và số còn thiếu.
- Đếm chỉ nội dung `published`.

**Ask first**
- Đổi bất kỳ sàn nào ở §7.3.
- Đổi phase mà một sàn bắt đầu chặn.
- Thêm một chiều vào ma trận.

**Never**
- Cho một nhánh dự phòng nhận tag ngoài từ vựng.
- Thay danh sách ô thiếu bằng một tỉ lệ phần trăm.
- Dùng ma trận này làm bằng chứng hiệu quả sư phạm.
- Chặn archive vì lý do phủ.

## 11. Open questions
 
| # | Câu hỏi | Chặn gì | Chặn phase | Chủ | Quyết định / Trạng thái |
|---|---|---|---|---|---|
| 1 | 12 giá trị trục `thinking` có phủ được 230 skill không? `plan`, `inhibit`, `shift` chưa có nội dung nào — thiếu nội dung hay thiếu giá trị phù hợp? Trùng câu hỏi 1 ở [`content-tagging.md`](../01-platform/content-tagging.md) §11 | Sàn `BR-TCM-06` | P4 | Nội dung | **Đã đóng (Task #94 WP94.0):** 12 giá trị trục `thinking` là từ vựng đóng Lớp 1 chuẩn. Ở P3, sàn phủ năng lực (≥6 game level) và mechanic (≥2 mechanic) được cưỡng chế; sàn phủ 12 trục `thinking` (≥5 game level) được theo dõi dưới dạng cảnh báo ở P3 và áp dụng chặn ở P4 khi mở rộng biên soạn. |
| 2 | Sàn nên tính theo band tuổi hay theo strand? 41 strand thì ma trận 6 × 3 là thô | Độ mịn của phép đo | P4 | người quyết | **Đã đóng (Task #94 WP94.0):** P3 áp dụng sàn theo 6 năng lực × 3 dải tuổi (18 ô) để kiểm soát cân bằng nền tảng. Phân rã theo 41 strand được đưa vào dashboard giám sát chuyên sâu ở P4. |
| 3 | Lesson và game level có nên chung một sàn không? Một lesson 20 phút không tương đương một màn chơi 2 phút | Sàn lesson ở §7.3 | P4 | Nội dung | **Đã đóng (Task #94 WP94.0):** Tách sàn riêng giữa game level và lesson. P3 áp dụng sàn ≥6 game level mỗi ô. Sàn lesson (≥1 lesson mỗi ô) áp dụng từ P4. |
| 4 | Trục `what` và trục `theme` vẫn đang nới: danh sách hợp lệ của cổng chứa 14 viết tắt seed-master (`cnt`, `cmp`, `mem`, …) và 10 theme ngoài 12 giá trị của [`content-tagging.md`](../01-platform/content-tagging.md) §7.1–§7.2. Gắn lại hai trục này về từ vựng đóng, hay đóng từ vựng lại quanh giá trị đang dùng? | `BR-TCM-01` cho hai trục còn lại | P4 | Nội dung | Mở. Trục `thinking` và `mechanic` đã đóng thật ngày 2026-08-22; hai trục còn lại chưa |
| 5 | `content_pack` của **169 trên 172** game level trong corpus seed không parse được bằng `content_contract` của template chúng khai. `BR-GTC-10` yêu cầu điều ngược lại, nhưng bộ cổng seed ở [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) không cổng nào parse `content_pack`, và bộ test tuân thủ chỉ parse `fixtures.ts` chứ không parse corpus seed. Sửa nội dung, hay sửa contract? | `BR-GTC-10`, và mọi kế hoạch nội dung dựa trên corpus seed | P4 | người quyết | Mở. Đo ngày 2026-08-22 |
