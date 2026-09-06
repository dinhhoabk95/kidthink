---
spec: CONCEPT-PRE-SKILL
title: Kỹ năng bậc pre — chủ đề làm quen và cửa chặn trước khi chơi
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-09-05
owns:
  - Bậc `pre` trong từ vựng bậc của taxonomy
  - Từ vựng chủ đề làm quen và danh sách chủ đề đợt 1
  - Luật prerequisite biến kỹ năng bậc `pre` thành cửa chặn
  - Luật hạn ngạch riêng cho kỹ năng bậc `pre`
depends_on:
  - SCHEMA-CONTENT-TAXONOMY
  - CONCEPT-INTRO-MODEL
  - CONCEPT-INTRO-GATE
  - SKILL-DATASET-MODEL
  - ENGINE-GT000
---

# Kỹ năng bậc pre — chủ đề làm quen và cửa chặn trước khi chơi

## 1. Objective

Taxonomy hiện có ba bậc trong một strand: `basic`, `core`, `advanced`. Cả ba đều là bậc
**chơi** — mỗi kỹ năng có level kiểm tra thứ trẻ đã biết. Không bậc nào là bậc **học**.

Hệ quả đo được ngày 2026-09-05: 404 trên 408 kỹ năng có level kiểm tra mà không có level dạy
(`scripts/intro-coverage-baseline.json`). Trẻ gặp khái niệm lần đầu ngay trong bài chấm.

File này thêm bậc thứ tư, **`pre`**, và khái niệm **chủ đề**.

Một **chủ đề** là một dãy giá trị có thứ tự, thuộc cùng một strand, dạy trọn được trong một
level: số 0–5 là sáu giá trị, số 0–10 là mười một, hình phẳng là bảy hình, màu cơ bản là tám
màu. Mỗi chủ đề có đúng một **kỹ năng bậc `pre`**, và kỹ năng đó là prerequisite của mọi kỹ
năng chơi cùng chủ đề. Cửa chặn không cần code mới: `checkLevelIntroRequired` đã đi bao đóng
prerequisite rồi tìm level thuộc template `kind = 'teach'`.

Khác biệt với [`concept-intro-model.md`](concept-intro-model.md): file đó sở hữu **hình dạng
một bài làm quen**. File này sở hữu **thứ được dạy và ai bị nó chặn**.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn | `content_author` | Khai chủ đề, soạn dataset chủ đề, soạn level `GT-000` cho kỹ năng bậc `pre` |
| Người duyệt | `content_reviewer` | Đối chiếu checklist mục 7.5 trước khi publish |
| Cổng hạn ngạch | — | Bỏ kỹ năng bậc `pre` khỏi hạn ngạch level, giữ chúng trong bậc thang phủ |
| Cổng chặn | — | Đọc prerequisite, trả `428 INTRO_REQUIRED` khi bài làm quen còn thiếu |
| Trẻ 3–6 | — | Đi hết bài làm quen của chủ đề rồi mới mở được các trò chơi cùng chủ đề |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `docs/taxonomy/c*.md` | Người soạn | Bảng kỹ năng, sinh ra từ mã nguồn qua `gen:taxonomy-docs` |
| `packages/content/src/skills/**` | Người soạn | Nguồn sự thật của kỹ năng và dataset |
| `packages/shared/src/taxonomy-types.ts` | Dev | Từ vựng bậc |
| `packages/content-build/src/gates/skill-quota.ts` | Dev | Hạn ngạch level từng kỹ năng |
| `apps/web/server/utils/concept-intro-runtime.ts` | Dev | Bao đóng prerequisite và hàng đợi bài làm quen |

## 4. Main flow

Không có. Spec ràng buộc.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PRE-01` (bậc thứ tư) | Từ vựng bậc mở rộng thành `pre \| basic \| core \| advanced`. Kỹ năng bậc `pre` chỉ được gắn vào level thuộc template `kind = 'teach'`. Cấm — NEVER gắn kỹ năng bậc `pre` vào một level chấm | Bậc là thứ cổng và bộ sinh đọc để biết một kỹ năng dùng để dạy hay để đo. Trộn hai vai vào một kỹ năng thì không luật nào phát biểu được "trẻ phải học trước khi chơi" |
| `BR-PRE-02` (một chủ đề, một strand) | Mỗi chủ đề có **đúng một** kỹ năng bậc `pre`, và **mọi** giá trị của chủ đề thuộc **cùng một** strand | Bài làm quen phải xếp được vào hàng đợi, và hàng đợi chỉ trả lời được câu "còn thiếu bài nào" khi một bài ứng với một chỗ. Chủ đề trải hai strand thì không có chỗ nào để đặt nó |
| `BR-PRE-03` (mã nối tiếp) | Kỹ năng bậc `pre` nhận **mã kế tiếp** trong strand của chủ đề. Cấm — NEVER chèn giữa, Cấm — NEVER dùng lại mã của kỹ năng đã xoá | Mã kỹ năng là bất biến và bị khoá bởi trạng thái thành thạo, telemetry và mọi bài học. Chèn giữa để mã "đọc cho thuận" là đổi nghĩa của dữ liệu đã ghi |
| `BR-PRE-04` (khó không vượt) | `difficulty` của kỹ năng bậc `pre` ≤ `difficulty` nhỏ nhất trong nhóm kỹ năng nó chặn. Đồ thị prerequisite vẫn phải là DAG ở mọi trạng thái seed | Luật bất biến sẵn có của taxonomy: prerequisite phải dễ hơn hoặc bằng thứ nó mở khoá. Bài làm quen khó hơn trò chơi là cửa ải, không phải cửa vào |
| `BR-PRE-05` (chặn bằng prerequisite) | Mọi kỹ năng chơi của một chủ đề BẮT BUỘC khai kỹ năng bậc `pre` của chủ đề đó trong `prerequisites` | Đây là toàn bộ cơ chế chặn. `collectTransitivePrerequisiteSkillIds` đi bao đóng prerequisite; không khai thì cổng không thấy gì để chặn và trò chơi mở thẳng |
| `BR-PRE-06` (gắn hai đầu) | Level `GT-000` của một chủ đề BẮT BUỘC khai `skill_codes` gồm kỹ năng bậc `pre` **và** mọi kỹ năng chơi mà chủ đề đó dạy | Hai cổng đọc hai chỗ: cổng phủ so khớp mã kỹ năng đúng bằng, cổng chặn tra bảng ánh xạ nội dung. Gắn một đầu thì bài làm quen tồn tại mà nợ phủ không giảm |
| `BR-PRE-07` (hạn ngạch riêng) | Kỹ năng bậc `pre` **không** chịu hạn ngạch số level và không chịu ràng buộc trải nhiều khuôn. Nó vẫn phải có ít nhất một level, nên vẫn nằm trong bậc thang phủ | Hạn ngạch hiện tại đòi C1 tối thiểu 20 level và 4 khuôn cho mỗi kỹ năng. Một kỹ năng bậc `pre` theo định nghĩa chỉ có một bài trên một khuôn; áp hạn ngạch chung vào là bắt nó vi phạm ngay khi vừa khai |
| `BR-PRE-08` (một bài published) | Một kỹ năng bậc `pre` có **tối đa một** level `GT-000` ở trạng thái `published` | Cổng phải trỏ được tới đúng một mã level cho mỗi chủ đề còn thiếu. Hai bài cùng publish thì cổng phải chọn, và không có luật nào để chọn |
| `BR-PRE-09` (phủ hết giá trị) | `content_pack` của level làm quen BẮT BUỘC dạy **mọi** giá trị khai trong bảng chủ đề. Thiếu một giá trị là vi phạm | Đây là chính điều người đặt việc yêu cầu: một chủ đề học trong một level, không phải học lẻ từng giá trị. Không có luật này thì bộ chiếu lại lấy hai vật đầu rồi dừng, đúng như nó đang làm |
| `BR-PRE-10` (dataset trung thực) | Dataset của kỹ năng bậc `pre` BẮT BUỘC chứa đúng các giá trị của chủ đề, không phải vật mượn từ vốn từ chủ đề trang trí | Đo ngày 2026-09-05: dataset của kỹ năng "Quan sát màu" chứa thìa, cốc, giường, ghế, táo — không một màu nào. Cổng phủ vẫn xanh. Đó là cách một kho đạt 100% phủ mà dạy 0% |

## 7. Data

**Đọc:** `skills` · `strands` · `skill_prerequisites` · `skill_datasets`.
**Ghi:** không bảng mới. Bậc `pre` là một giá trị mới của trường `tier` đã có.

### 7.1 Từ vựng bậc — bốn giá trị

| Ký hiệu | Mã | Nhãn | Nghĩa |
|---|---|---|---|
| `p` | `pre` | Làm quen | Dạy khái niệm lần đầu, không chấm, độ khó 1 |
| `b` | `basic` | Làm quen thao tác | Một thuộc tính, có gợi ý, độ khó 1–2 |
| `c` | `core` | Thành thạo | Chuẩn của band, làm độc lập, độ khó 3 |
| `a` | `advanced` | Thử thách | Nhiều thuộc tính hoặc nhiều bước, độ khó 4–5 |

### 7.2 Một chủ đề

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `pre_skill_code` | `string` | Mã kỹ năng bậc `pre` của chủ đề — `BR-PRE-02` |
| `label` | `string` | Tên chủ đề nói được, ví dụ `"số 0 đến 10"` |
| `values[]` | `array` | Dãy giá trị **có thứ tự**, 2–21 phần tử — trần trên là dãy số 0 tới 20 |
| `teaches[]` | `array` | Mã các kỹ năng chơi mà chủ đề này dạy — `BR-PRE-05`, `BR-PRE-06` |

### 7.3 Chủ đề đợt 1 — năm chủ đề

| Mã kỹ năng bậc `pre` | Chủ đề | Số giá trị | Dạy cho |
|---|---|---:|---|
| `C1.NREC.13` | Làm quen số 0–5 | 6 | `C1.NREC.01` · `C1.NREC.02` |
| `C1.NREC.14` | Làm quen số 0–10 | 11 | `C1.NREC.03` |
| `C1.NREC.15` | Làm quen số 11–20 | 10 | `C1.NREC.04` |
| `C2.GEO.09` | Làm quen hình phẳng | 7 | `C2.GEO.01` … `C2.GEO.08` |
| `C4.DET.05` | Làm quen màu cơ bản | 8 | `C4.DET.01` |

Cả năm đều `difficulty: 1`, `tier: pre`, mã `thinking` là `observe`.
`C1.NREC.14` khai `C1.NREC.13` làm prerequisite; `C1.NREC.15` khai `C1.NREC.14`. Ba chủ đề số
xếp thành một dãy, không phải ba nhánh rời.

Chủ đề màu đợt 1 **chỉ nhận** `C4.DET.01`. Ba kỹ năng màu còn lại — phân loại theo màu, sắp
xếp theo màu, quy luật màu — nằm ở strand khác, nên `BR-PRE-02` không cho gộp. Chúng nhận
kỹ năng bậc `pre` riêng ở đợt sau.

### 7.4 Trạng thái dữ liệu hôm nay

| Chủ đề | Dataset có sẵn không | Việc phải làm |
|---|---|---|
| Số 0–5 | Có, 6 vật đủ mặt chữ số, nhãn, emoji | Gắn `audio_path` |
| Số 0–10 | Có, 11 vật | Gắn `audio_path` |
| Số 11–20 | **Sai phạm vi** — chứa 21 vật từ 0 tới 20 | Cắt về 11…20, gắn `audio_path` |
| Hình phẳng | Không có dataset gộp; 8 dataset hình mỗi cái 4 vật | Soạn dataset 7 hình |
| Màu cơ bản | **Sai nội dung** — dataset chứa thìa, cốc, giường, ghế, táo | Soạn lại thành 8 màu |

### 7.5 Checklist người duyệt

1. Đếm số giá trị trong `content_pack`, so với cột số giá trị của bảng mục 7.3 — thiếu một là trượt.
2. Mở dataset, đọc từng nhãn: nó có phải giá trị của chủ đề không, hay là vật mượn?
3. Mọi kỹ năng ở cột "Dạy cho" có khai kỹ năng bậc `pre` trong `prerequisites` chưa?
4. Level làm quen có gắn đủ cả kỹ năng bậc `pre` lẫn các kỹ năng nó dạy chưa?
5. Bấm thử một trò chơi thuộc chủ đề khi chưa chơi bài làm quen — có bị chặn thật không?

## 8. API contract

Không sở hữu route. Cửa chặn đi qua bước 8 của thang truy cập, sở hữu ở
[`concept-intro-gate.md`](../04-play/concept-intro-gate.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-PRE-01 — Kỹ năng bậc pre gắn vào level chấm thì bị từ chối
  Given Một level thuộc template kind assess
  When Người soạn gắn vào nó một kỹ năng bậc pre
  Then Cổng nội dung từ chối
  And lý do nêu kỹ năng bậc pre chỉ được gắn vào level dạy

Scenario: BR-PRE-02 — Chủ đề trải hai strand thì bị từ chối
  Given Một chủ đề khai giá trị thuộc hai strand khác nhau
  When Cổng chủ đề chạy
  Then Cổng báo lỗi và nêu hai mã strand đang bị trộn

Scenario: BR-PRE-03 — Mã kỹ năng bậc pre phải là mã kế tiếp trong strand
  Given Strand C1.NREC đang có 12 kỹ năng
  When Người soạn thêm một kỹ năng bậc pre mang mã C1.NREC.07
  Then Cổng taxonomy báo lỗi trùng mã
  And nêu mã hợp lệ kế tiếp là C1.NREC.13

Scenario: BR-PRE-04 — Kỹ năng bậc pre khó hơn kỹ năng nó chặn thì bị từ chối
  Given Một kỹ năng bậc pre khai difficulty bằng 3
  And Kỹ năng nó chặn khai difficulty bằng 1
  When Property test taxonomy chạy
  Then Test đỏ và nêu prerequisite phải dễ hơn hoặc bằng

Scenario: BR-PRE-05 — Kỹ năng chơi không khai prerequisite thì cổng không chặn được
  Given Một kỹ năng chơi thuộc chủ đề số 0 đến 5
  And Kỹ năng đó không khai C1.NREC.13 trong prerequisites
  When Cổng chủ đề chạy
  Then Cổng báo lỗi và nêu kỹ năng còn thiếu prerequisite

Scenario: BR-PRE-06 — Level làm quen gắn thiếu kỹ năng thì nợ phủ không giảm
  Given Một level GT-000 chỉ gắn kỹ năng bậc pre
  When Cổng phủ bài làm quen chạy
  Then Cổng báo lỗi và liệt kê các kỹ năng chơi chưa được gắn

Scenario: BR-PRE-07 — Kỹ năng bậc pre một level không bị hạn ngạch bắt lỗi
  Given Một kỹ năng bậc pre thuộc C1 có đúng một level GT-000
  When Cổng hạn ngạch kỹ năng chạy
  Then Cổng không báo lỗi cho kỹ năng đó
  And Cổng vẫn báo lỗi cho một kỹ năng bậc core cùng competency chỉ có một level

Scenario: BR-PRE-08 — Hai bài làm quen cùng publish cho một kỹ năng thì bị từ chối
  Given Một kỹ năng bậc pre đã có một level GT-000 ở trạng thái published
  When Người soạn gửi publish level GT-000 thứ hai cho chính kỹ năng đó
  Then Hệ thống trả 409
  And lý do nêu mỗi kỹ năng bậc pre chỉ có một bài làm quen published

Scenario: BR-PRE-09 — Bài làm quen dạy thiếu giá trị thì bị từ chối
  Given Chủ đề số 0 đến 10 khai 11 giá trị
  When Người soạn gửi publish một level GT-000 chỉ dạy 2 giá trị
  Then Hệ thống trả 422
  And lý do liệt kê 9 giá trị chưa được dạy

Scenario: BR-PRE-10 — Dataset không chứa giá trị của chủ đề thì bị từ chối
  Given Chủ đề màu cơ bản khai 8 giá trị màu
  And Dataset của kỹ năng bậc pre chứa thìa, cốc, giường, ghế và táo
  When Cổng trung thực dataset chạy
  Then Cổng báo lỗi và nêu không giá trị nào của chủ đề có mặt trong dataset
```

## 10. Boundaries

**Always**
- Cấp mã kỹ năng bậc `pre` bằng cách tăng số cuối của strand, một lần, không đổi lại.
- Soạn dataset chủ đề từ chính giá trị của chủ đề.
- Khai kỹ năng bậc `pre` vào `prerequisites` của mọi kỹ năng chơi cùng chủ đề, ngay trong cùng lượt.
- Gieo level `GT-000` cho một kỹ năng bậc `pre` ngay trong lượt khai nó, để không đội trần bậc thang phủ.

**Ask first**
- Thêm chủ đề trải hơn một strand.
- Nới trần 21 giá trị mỗi chủ đề.
- Mở bậc `pre` xuống mức từng kỹ năng thay vì từng chủ đề.

**Never**
- Cấm — NEVER gắn kỹ năng bậc `pre` vào level chấm.
- Cấm — NEVER chèn mã kỹ năng vào giữa dãy đã có.
- Cấm — NEVER để một chủ đề có hai bài làm quen cùng ở trạng thái `published`.
- Cấm — NEVER hạ trần bậc thang phủ để né việc soạn nội dung.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Ba kỹ năng màu ngoài `C4.DET` nhận chung một kỹ năng bậc `pre` liên strand hay mỗi strand một cái? | Số chủ đề đợt 2 | P4 | Nội dung |
| 2 | Chủ đề số 11–20 có nên nhắc lại 0–10 ở phân đoạn đầu, hay dựa hẳn vào prerequisite? | Độ dài level chủ đề 11–20 | P4 | Nội dung |
| 3 | Sau đợt 1, cầu soạn đầy đủ là bao nhiêu chủ đề trên 71 strand? | Kế hoạch nội dung P5 | P5 | hoãn — mở lại khi đợt 1 đã đo được thời lượng thật của một chủ đề |
