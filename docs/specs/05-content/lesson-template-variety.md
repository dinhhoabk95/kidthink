---
spec: LESSON-TEMPLATE-VARIETY
title: Đa dạng khuôn trong một bài học — cùng một kỹ năng, nhiều hình dạng chơi
area: content
status: implemented
mvp: false
phase: P5
reviewed: 2026-08-30

owns:
  - Số khuôn trò chơi tối thiểu cho một bài học
  - Ràng buộc nối bài học vào màn chơi số
  - Cổng đo đa dạng khuôn theo bài học
  - Phủ engine và phủ level trong corpus giáo án
depends_on:
  - LESSON-MODEL
  - ACTIVITY-MODEL
  - GAME-LEVEL-MODEL
  - LESSON-SESSION-RUNNER
  - THINKING-COVERAGE-MATRIX
---

# Đa dạng khuôn trong một bài học — cùng một kỹ năng, nhiều hình dạng chơi

## 1. Objective

Một đứa trẻ luyện một kỹ năng qua đúng một hình dạng trò chơi sẽ giỏi hình dạng đó, chưa chắc
giỏi kỹ năng. `BR-TCM-05` đã ghi đúng lý do này ở mức ô `competency × band tuổi`. Nhưng ô phủ
là đơn vị của catalog, không phải đơn vị trẻ gặp. Đơn vị trẻ gặp là **một bài học**.

Không spec nào sở hữu luật đó. Đã đối chiếu `owns` của
[`lesson-model.md`](lesson-model.md) (sàn biên tập một tiết), [`activity-model.md`](activity-model.md)
(ràng buộc theo `kind`), [`lesson-session-runner.md`](../04-play/lesson-session-runner.md)
(cách chạy từng bước) và [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md)
(ngưỡng phủ catalog): không file nào nói một bài học phải chơi được bằng bao nhiêu khuôn.

Và chỗ trống đó không phải chuyện lý thuyết — nhưng số đo đã đổi hẳn.

**Đo lại ngày 2026-08-29** (số cũ ngày 2026-08-22 trong ngoặc):

| Số đo | 2026-08-22 | 2026-08-29 |
|---|---:|---:|
| Activity đã soạn | 81 | **243** |
| Activity `kind: digital_game` | **0** | **162** |
| Lesson | ? | 81 |
| Lesson có ≥1 bước chơi số (`BR-LTV-01`) | 0 / 81 | **81 / 81** |
| Lesson có đúng 2 bước chơi số | 0 | **81 / 81** |
| Lesson có 2 bước cùng `template_code` (`BR-LTV-02` vi phạm) | — | **0** |
| Lesson có ≥1 hoạt động ngoài màn hình (`BR-LSM-02`) | — | **81 / 81** |
| Liên kết activity tới `game_levels` | 0 | **162, 0 mã treo** |

Phân bố `activity_kind` hiện tại: `digital_game` 162, `manipulative` 28, `home_activity` 12,
`movement` 9, `discussion` 8, `storytelling` 6, `observation` 6, `assessment` 6,
`mini_project` 6.

`BR-LTV-01` và `BR-LTV-02` đã đạt trên toàn corpus. Chuỗi `lessons` → `lesson_activities` →
`activities` → `game_levels` → `game_templates` nối liền, không mã treo.

### 1.1 Nhưng bước chơi trỏ sai kỹ năng ở 151 trên 162 liên kết

`BR-LTV-04` (bước chơi phục vụ bài học) đòi game level được trỏ tới có skill thuộc cùm kỹ năng
của bài học. Đo ngày 2026-08-29: **151 trên 162** liên kết không thoả. Chỉ 11 liên kết đúng.

Ba ca đọc được, không phải lỗi công cụ:

| Bài học | Kỹ năng bài học | Trỏ tới level | Kỹ năng của level |
|---|---|---|---|
| `LES-0003` | `C1.CNT.02` đếm | `GL-C1-SEQ-PAT-0014` | `C1.NREC.09` nhận diện số |
| `LES-0004` | `C2.POS.01` vị trí | `GL-C2-SHP-CARD-0001` | `C2.GEO.01` hình học |
| `LES-0004` | `C2.POS.01` vị trí | `GL-C2-POS-LOC-0004` | `C2.ORI.07` định hướng |

Bản thân activity thì gắn tag đúng — `ACT-0205` mang `skill_codes: ["C1.CNT.02"]`, khớp bài
học. Lệch nằm ở bước cuối: activity được nối vào game level nào **đang có sẵn**, không phải
game level phục vụ đúng kỹ năng.

Hệ quả sư phạm cụ thể: giáo án nói tiết này dạy đếm, rồi gửi trẻ vào màn nhận diện chữ số.
Chuỗi liên kết xanh, mã không treo, cổng không kêu — và nội dung vẫn sai.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `content_reviewer` | Chọn khuôn cho từng bước chơi của bài học |
| Người dạy | `requireUserAuth()` | Chạy bài học, gặp các bước chơi khác hình dạng |
| Cổng nội dung | — | Chặn bài học không đạt luật mục 6 |
| Người quyết | — | Duyệt ngoại lệ ở mục 7.4 |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `pnpm --filter @mindkid/db test` | Cổng nội dung | Cổng của file này |
| [`lesson-authoring.md`](../06-admin/lesson-authoring.md) | Người soạn nội dung | Nơi gắn activity vào bài học |
| [`activity-authoring.md`](../06-admin/activity-authoring.md) | Người soạn nội dung | Nơi một activity trỏ vào game level |
| `/lessons/<code>/run` | Người dạy | Bề mặt chạy bài học, xem mục 7 của [`lesson-session-runner.md`](../04-play/lesson-session-runner.md) |

## 4. Main flow

1. Người soạn viết bài học theo sàn biên tập của [`lesson-model.md`](lesson-model.md).
2. Người soạn gắn **ít nhất một** activity `kind: digital_game` vào bài học (`BR-LTV-01`).
3. Activity đó trỏ vào một game level đã `published`.
4. Bài học có từ hai bước chơi số trở lên thì hai bước bất kỳ **không được** cùng
   `template_code` (`BR-LTV-02`).
5. Mọi bước chơi số của một bài học phục vụ cùm kỹ năng của bài học đó (`BR-LTV-04`).
6. Cổng đọc corpus, dựng bảng `bài học × số khuôn khác nhau`, so với sàn ở mục 7.2.
7. Bài học nào dưới sàn thì cổng in mã bài học, số khuôn hiện có, số còn thiếu, và thoát khác 0.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Bài học không có bước chơi số | Bài thuần hoạt động ngoài màn hình | Cổng đỏ theo `BR-LTV-01`. Sản phẩm là sản phẩm số, một bài không dẫn tới màn chơi nào là một bài chưa xong |
| Kỹ năng của bài học chỉ có một khuôn chạy được | Ví dụ kỹ năng chỉ `GT-016` phục vụ | Bài học được miễn `BR-LTV-02`, ghi lý do vào PR. Miễn theo kỹ năng, không miễn theo người soạn |
| Thêm bước chơi thứ hai làm bài vượt trần thời lượng | `BR-LSM-05` trần cứng 45 phút | Rút bớt hoạt động khác, cấm nới trần |
| Hai bước chơi cùng khuôn nhưng khác độ khó | Người soạn muốn thang tăng dần | Đó là việc của [`round-set-model.md`](round-set-model.md) trong **một** level, không phải hai bước chơi |
| Game level bị `archived` sau khi bài học publish | Nội dung bị gỡ | Cổng nêu bài học mất bước chơi, xử như bài dưới sàn |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LTV-01` (mỗi bài học có màn chơi) | Mỗi lesson `published` có **≥1** activity `kind: digital_game` trỏ vào game level đã `published` | Một bài học không dẫn tới màn chơi nào thì phần số của sản phẩm không tồn tại với người dùng bài học đó. **Đạt 81/81 ngày 2026-08-29** — số cũ 0/81 là của 2026-08-22 |
| `BR-LTV-02` (hai bước chơi, hai khuôn) | Bài học có ≥2 bước chơi số thì **cấm** hai bước dùng cùng `template_code` | Đây là toàn bộ lý do file này tồn tại. Cùng kỹ năng, hai hình dạng chơi, thì thứ trẻ luyện là kỹ năng chứ không phải thao tác |
| `BR-LTV-03` (sàn theo năng lực đủ khuôn) | Từ P5, mỗi năng lực có ≥2 khuôn phục vụ thì mọi bài học của năng lực đó phải đạt **≥2 khuôn khác nhau** | Sàn chỉ áp khi có khuôn để chọn. Áp sàn lên năng lực mới có một khuôn là ép người soạn làm việc không làm được |
| `BR-LTV-04` (bước chơi phục vụ bài học) | Mọi bước chơi số của một bài học trỏ vào game level có skill thuộc cùm kỹ năng của bài học. **Vi phạm 151/162 ngày 2026-08-29** — chưa cổng nào ép, xem mục 1.1 | `BR-LSM-08` — một bài học phục vụ một cùm mục tiêu. Nhét một màn chơi lạ vào cho đủ số là làm hỏng cả hai |
| `BR-LTV-05` (đa dạng không phá cấu trúc) | Thêm bước chơi thứ hai vẫn phải giữ `BR-LSM-02` (≥1 hoạt động ngoài màn hình) và `BR-LSM-05` (trần thời lượng) | Đa dạng khuôn mà biến tiết học thành hai mươi phút màn hình là đổi một vấn đề lấy một vấn đề tệ hơn |
| `BR-LTV-06` (cổng có ca âm) | Cổng của file này có ca âm: một bài học hai bước chơi cùng `template_code` phải làm cổng đỏ | `BR-TYP-07`. Cổng không có ca âm là cổng không biết mình hỏng |
| `BR-LTV-07` (miễn trừ ghi lại) | Bài học được miễn `BR-LTV-02` vì kỹ năng chỉ có một khuôn thì **ghi một hàng** vào mục 7.4, kèm kỹ năng và khuôn | Miễn trừ không ghi lại sẽ thành thói quen, và thói quen đó đúng là thứ file này ngăn |
| `BR-LTV-09` (phủ engine trong giáo án) | Mỗi engine `active` có game level `published` phải được **ít nhất một** bài học trỏ tới | Đo 2026-08-29: 25 trên 27 engine được giáo án dùng; `GT-007` và `GT-008` không bài học nào dẫn tới. Engine không nằm trong lộ trình học là engine chỉ gặp trẻ qua danh mục, không qua chương trình |
| `BR-LTV-10` (level có đường vào) | Cảnh báo khi một game level `published` không bài học nào trỏ tới | Đo 2026-08-29: **111 trên 228** level có đường vào từ giáo án; 117 level chỉ vào được qua danh mục. Cảnh báo chứ không chặn — danh mục là đường vào hợp lệ |
| `BR-LTV-08` (không đếm khuôn chưa có nội dung) | Cổng chỉ đếm khuôn có game level `published` thật, không đếm khuôn chỉ có `fixtures.ts` | Trùng lý do `BR-TCL-02`. Khuôn không có nội dung không cho trẻ thêm hình dạng nào |

## 7. Data

**Đọc:** `lessons` · `lesson_activities` · `activities` · `game_levels` · `game_templates`.
**Ghi:** không ghi. Đầu ra là báo cáo và mã thoát.

### 7.1 Chuỗi nối bài học tới khuôn

| Bậc | Bảng | Khoá nối |
|---|---|---|
| 1 | `lessons` | `LES-\d{4}` |
| 2 | `lesson_activities` | `lessonId` cộng `position` |
| 3 | `activities` | `kind` cộng `refType` cộng `refId` |
| 4 | `game_levels` | `refId` khi `refType = "game_level"` |
| 5 | `game_templates` | `game_levels.templateId` |

Bậc 3 là chỗ duy nhất `kind: digital_game` xuất hiện. Corpus đã lấp bậc này: 162 activity, 81 trên 81 bài học có đúng hai bước chơi khác khuôn.

### 7.2 Sàn

| Đo | Sàn | Chặn từ phase |
|---|---|---|
| Bước chơi số mỗi bài học | ≥1 | P5 |
| Khuôn khác nhau mỗi bài học, khi năng lực có ≥2 khuôn | ≥2 | P5 |
| Bài học mỗi ô `competency × band tuổi` | ≥1 | P4, thuộc mục 7.3 của [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md) |

Sàn thứ ba đã có chủ ở file khác; ghi lại đây chỉ để thấy ba sàn ăn khớp nhau.

### 7.3 Hình dạng báo cáo

```
Bước chơi số mỗi bài học (sàn 1)
  LES-0001: 0 bước    thiếu 1
  LES-0002: 2 bước

Khuôn khác nhau mỗi bài học (sàn 2)
  LES-0002: 1 khuôn (GT-001, GT-001)    thiếu 1
  LES-0003: 2 khuôn (GT-003, GT-013)

Miễn trừ đang hiệu lực: 0
```

Không in tỉ lệ phần trăm, cùng lý do `BR-TCM-09`.

### 7.4 Sổ miễn trừ

| Bài học | Kỹ năng | Khuôn duy nhất phục vụ | Ngày ghi |
|---|---|---|---|
| — | — | — | — |

Sổ rỗng lúc viết file này. Một hàng ở đây là một lời hứa sẽ bỏ khi kỹ năng đó có khuôn thứ hai.

## 8. API contract

Không sở hữu route. Bài học và activity đi qua route thuộc mục 8 của
[`lesson-authoring.md`](../06-admin/lesson-authoring.md) và mục 8 của
[`activity-authoring.md`](../06-admin/activity-authoring.md), không đổi hình dạng.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LTV-09 — engine không bài học nào dùng làm cổng đỏ
  Given GT-007 có game level published
  And không lesson nào trỏ tới level của GT-007
  When chạy cổng đa dạng khuôn
  Then cổng thoát với mã khác 0
  And báo cáo nêu GT-007

Scenario: BR-LTV-04 — bước chơi lạc kỹ năng bị bắt trên toàn corpus
  Given corpus seed ngày 2026-08-29
  When chạy cổng trên mọi liên kết bài học tới game level
  Then cổng báo đúng 151 liên kết vi phạm
  And không liên kết nào bị bỏ qua vì bài học đó đã đạt BR-LTV-01

Scenario: BR-LTV-01 — bài học không có bước chơi số thì bị chặn
  Given một lesson published gồm toàn hoạt động ngoài màn hình
  When chạy cổng đa dạng khuôn
  Then cổng đỏ và nêu mã bài học đó thiếu một bước chơi số

Scenario: BR-LTV-02 — hai bước chơi cùng khuôn thì bị chặn
  Given một lesson có hai activity digital_game
  And cả hai trỏ vào game level dùng template GT-001
  When chạy cổng đa dạng khuôn
  Then cổng đỏ và nêu bài học đó chỉ có một khuôn

Scenario: BR-LTV-02 — hai bước chơi khác khuôn thì qua
  Given một lesson có hai activity digital_game
  And một bước dùng GT-003, một bước dùng GT-013
  When chạy cổng đa dạng khuôn
  Then bài học đó không bị nêu

Scenario: BR-LTV-03 — năng lực chỉ có một khuôn thì chưa áp sàn
  Given một năng lực chỉ có một khuôn có nội dung published
  When chạy cổng đa dạng khuôn
  Then bài học của năng lực đó không bị nêu vì thiếu khuôn thứ hai

Scenario: BR-LTV-04 — bước chơi lạc kỹ năng thì bị chặn
  Given một lesson phục vụ cùm kỹ năng đếm
  And một activity digital_game của nó trỏ vào game level kỹ năng đối xứng
  When chạy cổng đa dạng khuôn
  Then cổng đỏ và nêu bước chơi lạc kỹ năng

Scenario: BR-LTV-05 — thêm bước chơi không được vượt trần thời lượng
  Given một lesson dài 40 phút
  When thêm một bước chơi số 8 phút
  Then cổng biên tập của lesson-model đỏ vì vượt trần 45 phút

Scenario: BR-LTV-06 — cổng có ca âm
  Given bộ test của cổng đa dạng khuôn
  When đọc danh sách ca kiểm
  Then tồn tại ít nhất một ca dựng bài học hai bước cùng khuôn và mong đợi cổng đỏ

Scenario: BR-LTV-08 — khuôn chỉ có fixture không được tính
  Given một khuôn có ba fixture và không có game level published
  When cổng đếm số khuôn của một bài học
  Then khuôn đó không được tính vào con số
```

## 10. Boundaries

**Always**

- Cho mỗi bài học ít nhất một bước chơi số.
- Dùng hai khuôn khác nhau khi bài học có hai bước chơi.
- Ghi miễn trừ vào sổ ở mục 7.4.
- Giữ hoạt động ngoài màn hình và trần thời lượng khi thêm bước chơi.

**Ask first**

- Miễn `BR-LTV-02` cho một bài học.
- Đổi sàn ở mục 7.2.

**Never**

- Nhét một màn chơi lạc kỹ năng vào bài học cho đủ số khuôn.
- Đếm khuôn chưa có game level `published`.
- Nới trần thời lượng của bài học để chứa thêm bước chơi.
- Coi hai độ khó của cùng một khuôn là hai khuôn.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ | Quyết định / Trạng thái |
|---|---|---|---|---|---|
| 1 | Sàn "≥2 khuôn mỗi bài học" áp cho mọi bài học, hay chỉ cho bài học có ≥2 bước chơi? Bài một bước thì không có gì để đa dạng, nhưng bài một bước cũng là chỗ dễ né luật nhất | Hình dạng `BR-LTV-02` và `BR-LTV-03` | P5 | người quyết | Mở |
| 2 | Ai soạn bước chơi số cho 21 bài học Montessori đang có? Chúng được viết trước khi luật này tồn tại | Đưa `BR-LTV-01` vào cưỡng chế | P5 | Nội dung | Mở |
| 3 | Cổng này đứng riêng hay là ma trận thứ tư của cổng phủ trục tư duy? Hai cổng đọc cùng một corpus | Chỗ đặt mã cổng | P5 | Infra | Mở |
| 4 | Trần trên có cần không? Một bài học năm bước chơi số đạt mọi luật ở đây nhưng vẫn là quá nhiều màn hình cho tuổi mầm non | Sàn ở mục 7.2 | P5 | Nội dung | Mở |
