---
spec: GO-LIVE-READINESS
title: Điều kiện go-live của tầng game — khác MVP
area: quality
status: draft
mvp: false
phase: P4
reviewed: 2026-08-29
owns:
  - Định nghĩa go-live của tầng game và chỗ nó khác MVP
  - Danh sách chặn cứng đo được trước khi mở cho người dùng thật
  - Phạm vi go-live và luật cấm rút phạm vi
  - Cách báo cáo trạng thái sẵn sàng
depends_on:
  - MVP-SCOPE
  - LESSON-FLOW-MODEL
  - LESSON-CORPUS-DEPTH
  - LESSON-TEMPLATE-VARIETY
  - ENGINE-RENDER-CONTRACT
  - ENGINE-CONTENT-DEPTH
  - CONTENT-SEED-AUTHORING
  - GAME-ENGINE-RUNTIME
  - RELEASE-DEPLOY
---

# Điều kiện go-live của tầng game — khác MVP

## 1. Objective

[`mvp-scope.md`](../00-foundation/mvp-scope.md) sở hữu câu hỏi *"cái gì thuộc MVP"*.
[`release-deploy.md`](../01-platform/release-deploy.md) sở hữu *"làm sao đưa code lên máy chủ"*.
Không spec nào sở hữu câu ở giữa: **"tầng game đã sẵn sàng cho một đứa trẻ thật chưa"**.

Chỗ trống đó không phải chuyện lý thuyết. Đo ngày 2026-08-29, mọi cổng đang xanh và mọi sàn
MVP đang đạt, trong khi:

| Số đo | Giá trị | Hệ quả cho một đứa trẻ |
|---|---|---|
| Engine cài đặt `render()` | **0 / 27** | Canvas trống |
| `content_pack` parse được bằng contract | **66 / 228** | 162 màn trả `CONTENT_PACK_INVALID` |
| `difficulty_params` parse được | **58 / 228** | Độ khó khai báo không nạp được |
| Level gắn band tuổi ngoài band engine | **42 / 228** | Bài sai lứa, gồm 15 màn `GT-006` |
| Engine có hơn 4 game level | **8 / 27** | 19 engine chỉ có nội dung chứng minh contract |

Sàn MVP là ≥120 game level và corpus có 228, nên MVP đạt. Nhưng **không màn nào chơi được**.
Đó là toàn bộ lý do file này tồn tại: MVP đếm thứ đã soạn; go-live đếm thứ trẻ mở được.

### 1.1 Phạm vi go-live là toàn bộ, không rút

Quyết định của chủ dự án ngày 2026-08-29: *"phải hoàn thiện sản phẩm đầy đủ để go live chứ
không giảm bớt gì. Core dự án là game template và giáo án bài giảng."*

Phạm vi go-live vì vậy là **cả hai trục, đầy đủ**:

| Trục | Phạm vi | Hiện tại |
|---|---|---|
| Game template | **27 / 27** engine vẽ được và có nội dung đạt sàn | 0 engine vẽ được |
| Giáo án | **126 / 126** tiết của flow dài nhất, lắp từ thư viện master | 81 lesson |
| Level phục vụ giáo án | mỗi kỹ năng của thư viện có **≥2** level | 23 / 40 kỹ năng có 0 level |

Con số trục giáo án đổi từ 222 xuống 126 ngày 2026-08-29 theo quyết định `D-SI`: giáo án là
thư viện master dùng chung, tuổi là đề xuất, nên cầu là flow **dài nhất** chứ không phải tổng
mọi flow phân vùng theo band. Đó không phải nới ngưỡng — xem mục 1.1 của
[`lesson-corpus-depth.md`](../05-content/lesson-corpus-depth.md).

Bản trước của file này có một quy tắc cho phép **bớt engine khỏi phạm vi** khi chưa đạt. Quy
tắc đó đã bị bãi bỏ — xem `BR-GLR-04` ở mục 6. Đường duy nhất còn lại khi chưa đạt là **lùi
ngày**.

### 1.2 Trục giáo án, đo cùng ngày

| Số đo | Giá trị |
|---|---|
| Tiết của flow dài nhất `CUR-J42` | **126** |
| Lesson trong thư viện master | **81** — thiếu **45** |
| Level cần soạn thêm để mỗi kỹ năng giáo án có ≥2 | **48** |
| Lesson có ≥1 bước chơi số | 81 / 81 |
| Liên kết bài học tới game level | 162, 0 mã treo |
| Liên kết trỏ đúng kỹ năng của bài học (`BR-LTV-04`) | **11 / 162** |
| Engine được giáo án dùng | 25 / 27 — thiếu `GT-007`, `GT-008` |
| Level có đường vào từ giáo án | 111 / 228 |

Chuỗi liên kết đã nối liền và không mã treo — đó là tiến bộ thật so với số đo 2026-08-22.
Nhưng 151 trên 162 bước chơi trỏ vào game level **sai kỹ năng** của bài học: giáo án nói tiết
này dạy đếm rồi gửi trẻ vào màn nhận diện chữ số.

Nó **không** thay thế [`mvp-scope.md`](../00-foundation/mvp-scope.md), và cấm — NEVER dùng làm
bằng chứng hiệu quả sư phạm; ranh giới đó thuộc
[`pedagogical-evidence.md`](pedagogical-evidence.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người quyết | — | Tuyên bố go-live. Cấm — NEVER tuyên bố khi còn một mục chặn cứng đỏ |
| Cổng sẵn sàng | — | Chạy các phép đo ở mục 7.2, in bảng, thoát khác 0 khi còn mục đỏ |
| Dev | — | Đóng từng mục. Cấm nới ngưỡng để bảng xanh |
| Người soạn nội dung | `content_reviewer` | Đóng các mục thuộc trục nội dung |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `pnpm check:go-live` | Cổng sẵn sàng | Chạy tay trước khi tuyên bố, và trong cổng phát hành |
| `docs/specs/08-quality/go-live-readiness.md` mục 7.2 | Người quyết | Danh sách chặn cứng |
| [`release-deploy.md`](../01-platform/release-deploy.md) | Dev | Bước phát hành gọi cổng này làm điều kiện dừng |

## 4. Main flow

1. Cổng chạy từng phép đo ở mục 7.2 trên corpus seed và registry engine.
2. Nguồn nào không đọc được thì cổng **dừng với mã thoát khác 0**, cấm — NEVER coi là đạt.
3. Cổng in bảng: mục, ngưỡng, giá trị hiện tại, đạt hay chưa.
4. Còn một mục **chặn cứng** chưa đạt thì mã thoát khác 0.
5. Mục **cảnh báo** chưa đạt thì in cảnh báo, không chặn.
6. Người quyết đọc bảng và tuyên bố, hoặc không.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Đề nghị go-live một phần theo engine | Sát ngày, một số engine chưa xong | **Không có nhánh này.** `BR-GLR-04` bãi bỏ nó ngày 2026-08-29. Lùi ngày |
| Một mục chặn cứng chưa đạt | Sát ngày phát hành | Không có nhánh miễn trừ và không có nhánh rút phạm vi. Lùi ngày |
| Cổng không chạy được | Thiếu binary, sai đường dẫn | Đỏ. Cấm — NEVER nhánh bỏ qua |
| Đã go-live, một mục tụt lại | Lô nội dung sau làm thủng | Chặn PR đó, không thu hồi bản đã phát hành |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-GLR-01` (go-live khác MVP) | Đạt sàn MVP **không** đủ để go-live. Hai bộ điều kiện tách rời | Corpus đạt sàn 120 level trong khi 0 màn vẽ được. Trộn hai câu hỏi làm câu thứ hai không bao giờ được hỏi |
| `BR-GLR-02` (đo trên thứ trẻ mở được) | Mọi phép đo chạy đầu cuối: từ `content_pack` trong corpus tới lệnh vẽ | Đếm hàng trong bảng không chứng minh màn chơi chạy. Ba lỗ hổng ở mục 1 đều lọt qua phép đếm hàng |
| `BR-GLR-03` (chặn cứng không miễn trừ) | Mục chặn cứng ở mục 7.2 cấm — NEVER miễn trừ, kể cả tạm thời | Miễn trừ tạm thời trước ngày phát hành là cách mọi ngưỡng chết |
| `BR-GLR-04` (không rút phạm vi, không hạ ngưỡng) | Phạm vi go-live là **27 engine và 222 buổi**. Chưa đạt thì **lùi ngày**, cấm — NEVER bớt engine, cấm bớt chương trình, cấm hạ ngưỡng | Quyết định của chủ dự án 2026-08-29 (mục 1.1). Bản trước cho phép bớt engine; quy tắc đó **đã bãi bỏ**. Lý do: core sản phẩm là game template cộng giáo án, nên rút bớt một trong hai là ra một sản phẩm khác chứ không phải sản phẩm nhỏ hơn |
| `BR-GLR-05` (không có engine ngoài phạm vi) | Mọi engine `active` nằm trong phạm vi go-live. Cấm — NEVER trạng thái "có level published nhưng chưa sẵn sàng" | Hệ quả trực tiếp của `BR-GLR-04`. Trước đây quy tắc này nói cách ẩn engine chưa sẵn sàng; nay không có engine nào ở trạng thái đó |
| `BR-GLR-09` (hai trục cùng đạt) | Go-live đòi **cả** trục game template **và** trục giáo án đạt. Đạt một trục không cho phép tuyên bố | 27 engine vẽ được mà chỉ có 81 trên 222 buổi là một chương trình đứt ở tuần chín. 222 buổi mà engine không vẽ là một lịch học dẫn tới màn hình trống |
| `BR-GLR-06` (cổng đỏ khi không đọc được nguồn) | Nguồn không đọc được thì đỏ, cấm giá trị mặc định | Cùng bài học `BR-TCM-03` đã trả giá: bản cũ trả rỗng khi mất kết nối rồi báo mã thoát 0 |
| `BR-GLR-07` (không phải bằng chứng sư phạm) | Bảng này cấm — NEVER dùng để tuyên bố hiệu quả học tập | Nó đo sản phẩm chạy được, không đo trẻ học được |
| `BR-GLR-08` (ngưỡng ở tệp cấu hình) | Ngưỡng và danh sách engine trong phạm vi nằm ở tệp cấu hình ngoài mã nguồn | Cho phép mở phạm vi dần mà không sửa mã, và để mỗi lần đổi là một diff đọc được |

## 7. Data

**Đọc:** corpus seed · registry engine · mã nguồn Session class · tệp cấu hình phạm vi.
**Ghi:** không ghi database. Đầu ra là bảng và mã thoát.

### 7.1 Ba tầng câu hỏi

| Tầng | Câu hỏi | Spec sở hữu |
|---|---|---|
| Phạm vi | Cái gì thuộc MVP | [`mvp-scope.md`](../00-foundation/mvp-scope.md) |
| **Sẵn sàng** | **Trẻ mở được chưa** | **file này** |
| Phát hành | Đưa code lên máy chủ thế nào | [`release-deploy.md`](../01-platform/release-deploy.md) |

### 7.2 Danh sách chặn cứng

Đo trên **các engine trong phạm vi go-live**, không phải trên cả 27.

| # | Mục | Ngưỡng | Loại | Hiện tại trên 27 engine |
|---|---|---|---|---|
| 1 | Engine cài `render()` (`BR-ERC-01`) | 100% | Chặn cứng | **0 / 27** |
| 2 | `content_pack` parse bằng `content_contract` (`BR-GTC-10`) | 100% | Chặn cứng | **66 / 228 level** |
| 3 | `difficulty_params` parse bằng `difficulty_contract` | 100% | Chặn cứng | **58 / 228 level** |
| 4 | Band level nằm trong band engine (`BR-ECD-13`) | 100% | Chặn cứng | **186 / 228 level** |
| 5 | Cổng 1 và cổng 5 của seed chạy phép kiểm của chúng (`BR-CSA-16`) | Có | Chặn cứng | Chưa |
| 6 | Mỗi engine có test vẽ (`BR-ERC-11`) | 100% | Chặn cứng | 0 / 27 |
| 7 | `theme_tag` thuộc từ vựng đóng (`BR-CTR-01`) | 100% | Chặn cứng | 7 vi phạm, cổng đang đỏ |
| 8 | Mỗi engine đạt sàn bậc 1 (`BR-ECD-01`) | ≥6 level | Chặn cứng | 8 / 27 |
| 9 | Mỗi engine có cửa vào `free` hoặc `login` (`BR-ECD-07`) | 100% | Chặn cứng | chưa đo |
| 10 | E2E journey xanh cho mỗi engine trong phạm vi | 100% | Chặn cứng | chưa đo |
| 11 | Trần tập trung chủ đề (`BR-CTR-04`) | ≤25% | Cảnh báo | `school` 37% |
| 12 | Sàn trục `thinking` (`BR-TCM-06`) | ≥5 mỗi giá trị | Cảnh báo | `predict` 4, `plan` 3, `shift` 3 |
| 13 | Mỗi engine đạt sàn bậc 2 (`BR-ECD-01`) | ≥12 level | Cảnh báo | 6 / 27 |

**Trục giáo án — đo cùng ngày:**

| # | Mục | Ngưỡng | Loại | Hiện tại |
|---|---|---|---|---|
| 14 | Thư viện đủ tiết cho flow dài nhất (`BR-LCD-01`) | 126 / 126 | Chặn cứng | **81 / 126** — thiếu 45 |
| 15 | Mỗi kỹ năng của thư viện có ≥2 game level (`BR-LCD-10`) | 40 / 40 | Chặn cứng | **15 / 40** — cần soạn 48 level |
| 16 | Bước chơi trỏ đúng kỹ năng bài học (`BR-LTV-04`) | 100% | Chặn cứng | **11 / 162** — đóng bằng cách **soạn thêm level**, cấm nối bừa (`BR-LCD-11`) |
| 17 | Mỗi engine được ≥1 bài học trỏ tới (`BR-LTV-09`) | 27 / 27 | Chặn cứng | **25 / 27** |
| 18 | Mỗi bài học có ≥1 bước chơi số (`BR-LTV-01`) | 100% | Chặn cứng | 81 / 81 đạt |
| 19 | Hai bước chơi của một bài khác khuôn (`BR-LTV-02`) | 100% | Chặn cứng | 81 / 81 đạt |
| 20 | Mỗi bài học có ≥1 hoạt động ngoài màn hình (`BR-LSM-02`) | 100% | Chặn cứng | 81 / 81 đạt |
| 21 | Level có đường vào từ giáo án (`BR-LTV-10`) | — | Cảnh báo | 111 / 228 |

Mục 18, 19, 20 đã đạt. Ghi lại trong bảng vì `BR-GLR-01` đòi go-live đo **mọi** mục mỗi lần
chạy, không chỉ mục đang đỏ — một mục đang xanh vẫn tụt được ở lô nội dung sau.

Mục 1 tới 4 là một chuỗi: engine không vẽ thì nội dung không quan trọng; nội dung không parse
thì engine vẽ gì cũng không có. Đóng theo đúng thứ tự đó.

### 7.3 Vì sao mục 11 tới 13 và mục 21 chỉ cảnh báo

Chúng đo **chất lượng** danh mục, không đo **chạy được**. Một sản phẩm 37% chủ đề lớp học vẫn
là sản phẩm chơi được; một sản phẩm 0 màn vẽ được thì không. Một level chỉ vào được qua danh
mục vẫn chơi được — danh mục là đường vào hợp lệ. Trộn hai mức nghiêm trọng làm người đọc bảng
không biết mục nào thật sự chặn.

### 7.4 Hình dạng báo cáo

```
check:go-live  phạm vi: GT-001..GT-006

  #  mục                                    ngưỡng   hiện tại   
  1  engine cài render                      100%     0/6        CHẶN
  2  content_pack parse được                100%     0/157      CHẶN
  3  difficulty_params parse được           100%     0/157      CHẶN
  4  band level trong band engine           100%     140/157    CHẶN
  ...
  11 trần chủ đề                            <=25%    37%        cảnh báo

  4 mục chặn cứng chưa đạt. Chưa go-live được.
  exit 1
```

Bảng in **giá trị hiện tại**, không in tỉ lệ phần trăm tổng hợp — cùng lý do `BR-ECD-10` và
`BR-TCM-09` đã đặt: một con số gộp che được bốn mục đỏ.

## 8. API contract

Không có. Cổng chạy lúc phát hành, không route nào đọc nó.

Trạng thái sẵn sàng cấm — NEVER lộ ra bề mặt công khai.

## 9. Acceptance criteria

```gherkin
Scenario: BR-GLR-01 — đạt sàn MVP không làm cổng go-live xanh
  Given corpus có 228 game level, vượt sàn MVP 120
  And 0 engine cài render
  When chạy check:go-live
  Then cổng thoát với mã khác 0
  And báo cáo nêu mục 1 là CHẶN

Scenario: BR-GLR-03 — không có đường miễn trừ
  Given một mục chặn cứng chưa đạt
  When chạy check:go-live với mọi cờ dòng lệnh có sẵn
  Then không cờ nào làm cổng thoát 0

Scenario: BR-GLR-04 — hạ phạm vi thì cổng đo lại trên phạm vi mới
  Given phạm vi go-live đặt là GT-001 tới GT-006
  When chạy check:go-live
  Then chỉ 6 engine đó được đo
  And 21 engine còn lại không xuất hiện trong bảng

Scenario: BR-GLR-05 — engine ngoài phạm vi không có level published
  Given GT-014 ngoài phạm vi go-live
  When kiểm corpus
  Then không level GT-014 nào ở trạng thái published

Scenario: BR-GLR-06 — nguồn không đọc được thì đỏ
  Given thư mục seed-content không tồn tại
  When chạy check:go-live
  Then cổng thoát với mã khác 0
  And không dòng nào báo đạt

Scenario: BR-GLR-02 — phép đo chạy đầu cuối
  Given một level có content_pack parse được và engine có render
  When cổng đo mục 1 và mục 2
  Then phép đo nạp content_contract thật và gọi parse
  And phép đo đọc Session class thật để xác nhận có render
```

## 10. Boundaries

**Always**
- Đo đầu cuối, từ `content_pack` tới lệnh vẽ.
- In giá trị hiện tại của từng mục.
- Đỏ khi nguồn không đọc được.
- Lùi ngày khi chưa đạt.

**Ask first**
- Thêm hoặc bớt một mục ở mục 7.2.
- Chuyển một mục từ chặn cứng sang cảnh báo.
- Thêm engine thứ 28 trước khi 27 engine hiện có đạt.

**Never**
- Miễn trừ một mục chặn cứng.
- Hạ ngưỡng để bảng xanh.
- Bớt engine hoặc bớt chương trình khỏi phạm vi go-live.
- Dùng bảng này làm bằng chứng hiệu quả sư phạm.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Phạm vi go-live đợt đầu là bao nhiêu engine?~~ **Đóng 2026-08-29 (T113, `D-SH`)**: toàn bộ 27 engine và toàn bộ 222 buổi giáo án. Chủ dự án bác phương án rút phạm vi; `BR-GLR-04` viết lại theo quyết định đó, và nhánh go-live một phần bị xoá khỏi mục 5 | — | Đã đóng | D-SH |
| 5 | Thứ tự đóng hai trục: engine trước hay giáo án trước? Chúng độc lập về nguồn lực (dev với người soạn) nên chạy song song được, nhưng mục 16 cần game level đúng kỹ năng nên nó phụ thuộc trục nội dung | Lịch go-live | P4 | người quyết |
| ~~4~~ | ~~151 trên 162 bước chơi trỏ sai kỹ năng: nối lại hay soạn thêm level?~~ **Đóng 2026-08-29 (T113, `D-SJ`)**: **soạn thêm level**. Nối lại chỉ làm được ở 15 kỹ năng đang có ≥2 level; 25 kỹ năng còn lại không có level đúng để nối vào, và nối bừa chính là nguyên nhân của 151 liên kết sai hiện nay. Luật ở `BR-LCD-11` | — | Đã đóng | D-SJ |
| 2 | Mục 10 đòi E2E journey mỗi engine. Bộ E2E hiện phủ tới đâu? Cần đo trước khi đặt nó thành chặn cứng | Ngưỡng mục 10 | P4 | Backend |
| 3 | Cổng này chạy trong cổng phát hành hay chỉ chạy tay? Chạy trong cổng phát hành thì mọi lần deploy đều đo lại corpus, tốn thời gian dựng | Nối vào [`release-deploy.md`](../01-platform/release-deploy.md) | P4 | Infra |
