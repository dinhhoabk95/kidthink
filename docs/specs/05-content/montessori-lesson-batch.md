---
spec: MONTESSORI-LESSON-BATCH
title: Lô bài học Montessori — hai mươi mốt lesson và hoạt động ngoài màn hình
area: content
status: implemented
mvp: false
phase: P3
reviewed: 2026-08-30
owns:
  - Hạn ngạch và cấu trúc lô lesson Montessori
  - Quy tắc thay giáo cụ Montessori bằng vật liệu có sẵn trong nhà
  - Ranh giới giữa lô lesson Montessori và chương trình theo tuổi
depends_on:
  - MONTESSORI-CORPUS-MAPPING
  - LESSON-MODEL
  - ACTIVITY-MODEL
  - CURRICULUM-MODEL
---

# Lô bài học Montessori — hai mươi mốt lesson và hoạt động ngoài màn hình

## 1. Objective

Nguồn Montessori mạnh nhất ở đúng chỗ game level yếu nhất: **hoạt động ngoài màn hình**. Mỗi
workbook trong dataset đều ghi phương pháp Montessori tương đương — thẻ số cát, thang số hạt,
tủ hình học, tháp hồng. Đó là vật liệu cầm tay, và `BR-LSM-02` (bắt buộc hoạt động ngoài màn
hình) yêu cầu mỗi lesson có ít nhất một hoạt động như vậy.

File này sở hữu lô hai mươi mốt lesson dẫn xuất từ hai mươi mốt workbook, và hai ràng buộc mà
nguồn không tự mang. Thứ nhất, giáo cụ Montessori gốc là **đồ phải mua**, còn `BR-LSM-04` bắt
vật liệu phải có sẵn trong nhà — mọi giáo cụ phải được thay. Thứ hai, nhiều giáo cụ là **hạt
nhỏ nuốt được**, thứ mà mục 7.3 của [`activity-model.md`](activity-model.md) cấm với band 3-4.

Nó cũng sở hữu một ranh giới hay bị hiểu nhầm: lô này **không** dựng được một chương trình
theo tuổi. Lý do ở mục 7.4.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người biên soạn | `content_reviewer` | Viết lesson và activity từ workbook, chọn vật liệu thay thế |
| Chuyên gia sư phạm mầm non | `content_reviewer` | Đọc và duyệt bản thô trước khi mở PR |
| Người review PR | `content_reviewer` | Kiểm danh sách an toàn và danh sách vật liệu của từng bản |
| Người dạy | — | Mở lesson và làm theo mà không cần nền sư phạm |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/db/src/seed-content/lessons/` | Người biên soạn | File seeder lesson |
| `packages/db/src/seed-content/activities/` | Người biên soạn | File seeder activity |
| [`lesson-authoring.md`](../06-admin/lesson-authoring.md) | Người biên soạn | Nơi sửa sau khi seed, bằng version mới |
| [`activity-authoring.md`](../06-admin/activity-authoring.md) | Người biên soạn | Cùng vậy, cho activity |

## 4. Main flow

1. Chọn workbook theo thứ tự band ở mục 7.1.
2. Đọc dòng phương pháp Montessori tương đương của workbook đó trong dataset.
3. Tra mục 7.3 để lấy vật liệu thay thế; không có hàng khớp thì tự chọn theo mục 7.2 và bổ
   sung một hàng trong cùng PR.
4. Viết lesson theo cấu trúc chuẩn ở mục 7.1 của [`lesson-model.md`](lesson-model.md): khởi động, hoạt động
   chính, đúc kết, đánh giá.
5. Viết ít nhất một activity ngoài màn hình và một activity gắn game level Montessori đã
   `published`.
6. Viết phần `guide` trả lời đủ năm câu ở mục 7.2 của [`lesson-model.md`](lesson-model.md).
7. Chuyên gia sư phạm mầm non đọc bản thô.
8. Mở PR một batch một workbook; merge là phát hành.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Giáo cụ gốc là đồ phải mua | Gần như mọi workbook | Thay theo mục 7.3. Cấm giữ tên giáo cụ thương mại trong danh sách vật liệu |
| Vật liệu thay thế là vật nhỏ nuốt được | Hạt, nút áo, đồng xu | Với band 3-4 đổi sang vật lớn hơn 3cm. Cấm ghi chú "cần người lớn trông" thay cho việc đổi vật liệu |
| Workbook không có activity gắn game level | Dạng bài thuộc lô B, khuôn chưa ship | Lesson vẫn viết được với activity ngoài màn hình; phần gắn game level bổ sung bằng version sau |
| Lesson vượt trần thời lượng | Workbook dày | Tách thành hai lesson cùng cụm learning objective. Cấm nới trần |
| Đánh giá viết bằng từ trừu tượng | Bản thô hay mắc | Viết lại thành hành vi quan sát được theo mục 7.3 của [`lesson-model.md`](lesson-model.md) |
| Muốn dựng một chương trình Montessori riêng | Đề xuất tự nhiên khi lô xong | Chặn theo mục 7.4. Cần quyết định người và một nguồn bổ sung cho competency còn thiếu |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MLS-01` (một workbook một lesson) | Mỗi workbook sinh **đúng một** lesson trong lô này | `BR-LSM-08` (một cụm learning objective) — một workbook đã là một cụm learning objective liên quan; tách nhỏ hơn làm mất cung bậc, gộp lớn hơn làm vượt trần thời lượng |
| `BR-MLS-02` (thay giáo cụ bắt buộc) | Mọi giáo cụ Montessori gốc phải thay bằng vật liệu ở mục 7.3; cấm — **NEVER để tên giáo cụ thương mại** trong danh sách vật liệu | `BR-LSM-04` (vật liệu có sẵn trong nhà) — một lesson yêu cầu mua bộ giáo cụ là một lesson không ai dùng, và là quảng cáo cho bên thứ ba |
| `BR-MLS-03` (an toàn thắng độ trung thực) | Khi vật liệu trung thực với giáo cụ gốc vi phạm danh sách an toàn, **an toàn thắng** | Mục 7.3 của [`activity-model.md`](activity-model.md) cấm vật đường kính dưới 3cm với band 3-4. Hạt đếm Montessori nằm đúng trong nhóm đó |
| `BR-MLS-04` (hoạt động ngoài màn hình là hoạt động chính) | Trong lesson Montessori, hoạt động ngoài màn hình là **hoạt động chính**, không phải phần thêm cuối buổi | Đây là lý do lô này tồn tại. Đặt nó ở cuối biến lesson thành một game level có lời dẫn dài |
| `BR-MLS-05` (activity đứng độc lập) | Activity của lô này cấm tham chiếu workbook nguồn hay lesson chứa nó | `BR-ACM-01` (activity đứng độc lập) — tái dùng ở lesson khác thì ngữ cảnh đó sai |
| `BR-MLS-06` (đánh giá bằng hành vi) | Phần đánh giá mô tả hành vi quan sát được, kèm số lần thử | `BR-LSM-06` (đánh giá mô tả hành vi quan sát được) — "bé hiểu khái niệm số lượng" không đo được, "bé chỉ đúng nhóm nhiều hơn trong 3 lần thử" thì đo được |
| `BR-MLS-07` (không giả định biết đọc) | Mọi chỉ dẫn dành cho trẻ trong lô này là lời nói hoặc hình, cấm — **NEVER yêu cầu trẻ tự đọc chữ** | `BR-LSM-07` (không giả định trẻ biết đọc) — nguồn là sách bài tập in, và sách in ngầm giả định có người lớn đọc hộ. Lesson phải nói rõ điều đó thay vì thừa hưởng nó |
| `BR-MLS-08` (khối mã dành riêng) | Lesson lô này dùng mã từ `LES-0101`, activity từ `ACT-0101` | 60 lesson và 60 activity đã seed chiếm khối `0001` tới `0060`. Khối liền kề làm không thu hồi được nguyên lô khi cần |
| `BR-MLS-09` (một batch một workbook) | Một batch chứa lesson và activity của **đúng một** workbook | `BR-MGL-07` cùng lý do — thu hồi theo workbook là đơn vị thu hồi tự nhiên khi một nguồn hoá ra sai |
| `BR-MLS-10` (không dựng chương trình theo tuổi) | Lô này cấm — **NEVER dùng một mình để dựng một chương trình `age_based`** | `BR-CRM-08` (chương trình theo tuổi phủ đủ sáu competency) và `BR-CRM-07` (không competency nào quá 40%). Nguồn phủ bốn competency và lệch 14 trên 21 về C1 — xem mục 7.4 |
| `BR-MLS-11` (chuyên gia đọc bản thô) | Mỗi lesson được một người có nền sư phạm mầm non đọc trước khi mở PR | Đóng cùng nợ mà câu hỏi mở số 1 của [`lesson-model.md`](lesson-model.md) nêu. Bộ cổng seed không kiểm được cung bậc sư phạm của một buổi học |
| `BR-MLS-12` (gắn game level đã published) | Activity kiểu `digital_game` của lô này chỉ trỏ game level Montessori đã `published` | Mục 7.2 của [`activity-model.md`](activity-model.md) — trỏ một level chưa publish là một buổi học có một bước không mở được |
| `BR-MLS-13` (cung bậc theo CPA) | Hoạt động chính đi theo thứ tự **vật thật, rồi hình ảnh, rồi ký hiệu số**; khởi động luôn ở mức vật thật | Nguyên lý CPA ở mục 7.0 của [`montessori-corpus-mapping.md`](montessori-corpus-mapping.md). Lesson mở bằng ký hiệu số là đưa trẻ vào phần trừu tượng trước khi có nghĩa để gắn vào — cũng là lý do `BR-LSM-01` đòi có khởi động |

## 7. Data

**Đọc:** `game_levels` `published` · `skills` · bảng ánh xạ Montessori.
**Ghi:** `lessons` · `activities` · `lesson_activities`, qua `pnpm --filter @mindkid/db seed:content`.

### 7.1 Hạn ngạch lô lesson

| Band | Workbook | Lesson | Activity ngoài màn hình tối thiểu |
|---|---:|---:|---:|
| 3-4 | 01 tới 07 | 7 | 7 |
| 4-5 | 08 tới 14 | 7 | 7 |
| 5-6 | 15 tới 21 | 7 | 7 |
| **Tổng** | **21** | **21** | **21** |

Tổng sau lô: 81 lesson, tăng từ 60. Số activity tăng ít nhất 21, thực tế nhiều hơn vì mỗi
lesson thường có thêm một activity gắn game level.

Ba band chia đều bảy workbook mỗi band là hình dạng sẵn có của nguồn, không phải một lựa
chọn của file này — nó khớp đúng ba phần của tài liệu gốc.

### 7.2 Quy tắc chọn vật liệu thay thế

| Tiêu chí | Yêu cầu |
|---|---|
| Có sẵn trong nhà | Có |
| Đường kính lớn hơn 3cm với band 3-4 | Có |
| Không cần in ấn | Có |
| Không cần cắt, đun, hoặc nguồn nhiệt | Có |
| Giữ được thuộc tính sư phạm của giáo cụ gốc | Có |
| Dùng được ở mức vật thật của thang CPA | Có |

Hàng cuối tồn tại vì `BR-MLS-13`: hoạt động ngoài màn hình là **mức vật thật** của lesson.
Thay giáo cụ bằng một tấm thẻ in hình là nhảy thẳng sang mức hình ảnh, và mất chính lý do
lesson có phần ngoài màn hình.

Hàng áp chót là hàng khó. Thang số hạt dạy **số lượng tăng dần nhìn thấy được**; thay bằng một
vật không có thuộc tính đó thì lesson mất mục tiêu. Chọn vật liệu là quyết định sư phạm, không
phải quyết định mua sắm.

### 7.3 Bảng thay giáo cụ

| Giáo cụ gốc trong nguồn | Thuộc tính sư phạm phải giữ | Vật liệu thay |
|---|---|---|
| Thẻ số cát | Nét số cảm nhận được bằng ngón tay | Số viết bằng keo khô trên bìa, hoặc vẽ trên khay bột |
| Hộp thoi số, thẻ số và chấm tròn | Ghép ký hiệu số với số lượng rời | Nắp chai và giấy ghi số |
| Thang số hạt, gậy số | Số lượng tăng dần nhìn thấy được | Que kem xếp thành bậc, hoặc cốc giấy chồng cao dần |
| Tủ hình học | Đối chiếu hình với khung rỗng | Hình cắt từ bìa và khung vẽ trên giấy |
| Tháp hồng, khối lập phương nhị thức | Kích thước giảm dần theo một chiều | Hộp giấy các cỡ, hoặc sách xếp chồng |
| Khối hình học ba chiều | Nhận diện khối trong không gian | Đồ vật trong bếp: hộp, lon, quả bóng, mũ giấy |
| Đồng hồ gỗ hai kim đồng bộ | Hai kim ràng buộc nhau | Đĩa giấy và hai kim cắt từ bìa, ghim ở tâm |
| Mê cung ngón tay trên bảng gỗ | Đi theo đường không nhấc tay | Đường dán bằng băng dính trên sàn |
| Hạt đếm nhỏ | Đếm từng vật rời | Band 3-4 dùng nắp chai hoặc quả bóng nhỏ; cấm hạt |

Không có hàng khớp thì người biên soạn tự chọn theo mục 7.2 và **bổ sung một hàng vào bảng
này trong cùng PR** — bảng lớn dần là đúng, mỗi người tự chọn lại là sai.

### 7.4 Vì sao lô này không dựng được một chương trình theo tuổi

| Ràng buộc | Số của lô Montessori | Kết luận |
|---|---|---|
| Rule `BR-CRM-08` — phủ đủ sáu competency | Phủ 4, thiếu C5 và C6 | Không đạt |
| Rule `BR-CRM-07` — không competency nào quá 40% | C1 chiếm 14 trên 21, tức 67% | Không đạt |
| Rule `BR-CRM-02` — mỗi tuần chạm 2 tới 4 competency | Dựng được nếu trộn với lesson đã có | Đạt có điều kiện |

Hai hàng đầu không sửa được bằng cách xếp lại thứ tự. Lô Montessori là **nguồn lesson**, và
lesson của nó ghép vào chương trình đã có cạnh lesson của các competency khác. Một chương
trình mang tên Montessori là một quyết định sản phẩm riêng, cần thêm nguồn cho C5 và C6.

### 7.5 Khối mã

| Loại | Khối đã dùng | Khối lô Montessori |
|---|---|---|
| Lesson | `LES-0001` tới `LES-0060` | từ `LES-0101` |
| Activity | `ACT-0001` tới `ACT-0060` | từ `ACT-0101` |
| Batch | — | `SEED-MONT-L<workbook 2 chữ số>` |

### 7.6 Trạng thái phát hành của lô

Lô lesson Montessori dừng ở `draft` cho tới khi có một người có nền sư phạm mầm non đọc và
duyệt (quyết định `D-RT`, 2026-08-20). Đây là cách `BR-MLS-11` được thi hành khi chưa có người:
biến một câu hỏi chặn thành một cổng có trạng thái đọc được, thay vì để lô nằm chờ ngoài repo.

| Hệ quả | Nội dung |
|---|---|
| Lesson lô Montessori | Seed ở `draft`, không vào ma trận phủ (`BR-TCM-03` chỉ đếm `published`) |
| Game level lô Montessori | **Không** bị chặn bởi cổng này — chúng không có người lớn tham gia, và đi qua bộ cổng seed |
| Activity của lô | Theo trạng thái của lesson chứa nó |
| Khi có người duyệt | Lật sang `published` bằng version mới, không sửa tại chỗ |

Lô ở `draft` cũng đóng luôn câu hỏi bằng chứng chơi thử: không có gì được phát hành thì không
có tuyên bố hiệu quả nào để mà thiếu bằng chứng (`D-RV`).

Lesson của lô này vào **thư viện lesson rời**, không ghép vào chương trình nào ở Task #98
(quyết định `D-RU`, 2026-08-20). Ghép chương trình là một outcome khác, cần đo lại cân bằng
competency của từng chương trình sau khi ghép, và là task riêng.

## 8. API contract

Không sở hữu route. Lesson và activity của lô này đi qua đúng route mà
[`lesson-authoring.md`](../06-admin/lesson-authoring.md) và [`activity-authoring.md`](../06-admin/activity-authoring.md) đã sở hữu.

## 9. Acceptance criteria

```gherkin
Scenario: BR-MLS-02 — tên giáo cụ thương mại bị chặn
  Given một lesson Montessori có materials chứa tên một bộ giáo cụ thương mại
  When gửi duyệt
  Then trả 422
  And thông báo nêu đúng chuỗi vi phạm

Scenario: BR-MLS-03 — vật nhỏ ở band 3-4 bị chặn
  Given một activity band 3-4 dùng hạt đếm đường kính 1cm
  When gửi duyệt
  Then trả 422
  And lý do trỏ danh sách an toàn

Scenario: BR-MLS-04 — hoạt động ngoài màn hình là hoạt động chính
  When đọc mọi lesson Montessori published
  Then hoạt động chính của mỗi lesson là một activity ngoài màn hình

Scenario: BR-MLS-01 — một workbook một lesson
  When đếm lesson theo workbook nguồn trong lô Montessori
  Then mỗi workbook có đúng một lesson

Scenario: BR-MLS-07 — không giả định biết đọc
  When đọc mọi chỉ dẫn dành cho trẻ trong lô Montessori
  Then không hoạt động nào yêu cầu trẻ tự đọc chữ

Scenario: BR-MLS-08 — mã nằm trong khối dành riêng
  When đọc mã lesson và activity của lô Montessori
  Then mọi mã đều từ số thứ tự 0101 trở lên

Scenario: BR-MLS-10 — không dựng chương trình theo tuổi chỉ bằng lô này
  Given một chương trình age_based chỉ gồm lesson Montessori
  When chạy cổng kiểm chương trình
  Then cổng đỏ vì thiếu competency C5 và C6
  And vì C1 vượt 40 phần trăm

Scenario: BR-MLS-12 — activity trỏ level chưa published bị chặn
  Given một activity kind digital_game trỏ một game level draft
  When gửi duyệt
  Then trả 422

Scenario: BR-MLS-06 — đánh giá bằng hành vi quan sát được
  When đọc phần đánh giá của mọi lesson Montessori published
  Then mỗi mô tả nêu hành vi và số lần thử
  And không dùng từ trừu tượng như hiểu hay nắm được

Scenario: BR-MLS-11 — có dấu vết chuyên gia đọc bản thô
  When đọc mô tả PR của mọi batch lô Montessori
  Then mỗi PR ghi tên người có nền sư phạm mầm non đã đọc bản thô
```

## 10. Boundaries

**Always**
- Thay mọi giáo cụ gốc bằng vật liệu ở mục 7.3.
- Đặt hoạt động ngoài màn hình làm hoạt động chính.
- Viết đánh giá bằng hành vi quan sát được.
- Cấp mã trong khối dành riêng.
- Cho chuyên gia sư phạm mầm non đọc bản thô trước khi mở PR.

**Ask first**
- Thêm một hàng vật liệu thay thế không giữ đủ thuộc tính sư phạm gốc.
- Tách một workbook thành hai lesson.
- Dựng một chương trình mang tên Montessori.

**Never**
- Giữ tên giáo cụ thương mại trong danh sách vật liệu.
- Dùng vật nhỏ nuốt được với band 3-4.
- Yêu cầu trẻ tự đọc chữ.
- Yêu cầu in ấn ngoài activity kiểu `worksheet`.
- Dựng chương trình theo tuổi chỉ bằng lô này.
- Trỏ game level chưa `published`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Ai là chuyên gia sư phạm mầm non đọc bản thô cho `BR-MLS-11`?~~ **Đóng 2026-08-20 (T98, `D-RT`)**: chưa có người thì lô dừng ở `draft`, không publish — xem mục 7.6. Câu hỏi "ai" vẫn thuộc câu hỏi mở số 1 của [`lesson-model.md`](lesson-model.md); điều đóng ở đây là **hành vi khi chưa có câu trả lời**, và nó không còn chặn việc soạn | — | Đã đóng | D-RT |
| ~~2~~ | ~~Lesson của lô này ghép vào chương trình theo tiêu chí nào?~~ **Đóng 2026-08-20 (T98, `D-RU`)**: ở Task #98 chỉ vào thư viện lesson rời. Ghép chương trình là outcome khác, cần đo lại cân bằng competency của từng chương trình, và là task riêng — xem mục 7.6 | — | Đã đóng | D-RU |
| ~~3~~ | ~~Bảy lesson band 3-4 có làm chương trình band đó lệch C1 quá 40% không?~~ **Đóng 2026-08-20 (T98, `D-RU`)**: không đo được và không cần đo ở đợt này, vì `D-RU` không ghép lesson vào chương trình nào. Câu hỏi mở lại ở task ghép chương trình | — | Đã đóng | D-RU |
| ~~4~~ | ~~Có cần bản ghi chơi thử với trẻ trước khi publish không?~~ **Đóng 2026-08-20 (T98, `D-RV`)**: không ở Task #98. Lô dừng `draft` theo `D-RT` nên không có nội dung nào được phát hành, và `BR-PED-01` chỉ cấm tuyên bố hiệu quả về thứ đã phát hành. Câu hỏi quay lại đúng lúc lật sang `published` | — | Đã đóng | D-RV |
