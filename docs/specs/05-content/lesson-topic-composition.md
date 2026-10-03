---
spec: LESSON-TOPIC-COMPOSITION
title: Một bài học gồm nhiều chủ đề, mỗi chủ đề có nhiều khuôn trò chơi
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-09-20
owns:
  - Quan hệ một bài học có nhiều chủ đề học
  - Quan hệ một chủ đề có nhiều khuôn trò chơi hoạt động
  - Luật chọn khuôn cho một chủ đề từ ma trận tương hợp
  - Trần và sàn số chủ đề, số khuôn của một bài học
depends_on:
  - LEARNING-ROADMAP-MODEL
  - CONCEPT-TOPIC-MODEL
  - LESSON-MODEL
  - ACTIVITY-MODEL
  - LESSON-TEMPLATE-VARIETY
  - PRESCHOOL-AGE-BANDS
---

# Một bài học gồm nhiều chủ đề, mỗi chủ đề có nhiều khuôn trò chơi

## 1. Objective

Đo ngày 2026-09-20 trên 126 bài học của corpus: mỗi bài có **đúng 3 hoạt động, trong đó đúng
2 là trò chơi số** — trần và sàn bằng nhau ở cả 126 bài, nghĩa là con số 3 và 2 do bộ sinh ghi
cứng chứ không do nội dung bài quyết. Số **cơ chế chơi khác nhau trung bình là 1,7** trên mỗi
bài; 38 bài chỉ có một cơ chế duy nhất. Mỗi bài mang **đúng một** `theme_tag`, nên "chủ đề" hôm
nay là một nhãn trang trí, không phải một đơn vị dạy.

File này sở hữu mô hình người đặt việc yêu cầu ngày 2026-09-20: **một bài học mang nhiều chủ đề
học, và mỗi chủ đề có nhiều khuôn trò chơi hoạt động tương ứng.** Bài học thôi là một hộp ba
hoạt động cố định; nó thành một dãy chủ đề, mỗi chủ đề tự kéo theo bộ khuôn hợp với nó.

Ranh giới với hai file lân cận: [`concept-topic-model.md`](concept-topic-model.md) sở hữu
**hình dạng một chủ đề** — dãy giá trị trong một strand, khai ở `content_pack.concept`. File
này sở hữu **quan hệ bài học ↔ chủ đề ↔ khuôn** và các trần đếm được.
[`lesson-template-variety.md`](lesson-template-variety.md) sở hữu **độ đa dạng khuôn trên toàn
corpus**; file này ép đa dạng **bên trong một bài**.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn bài | `content_author` | Khai dãy chủ đề của bài và chọn khuôn cho từng chủ đề |
| Người duyệt | `content_reviewer` | Đối chiếu trần mục 7.3 trước khi publish |
| Ma trận tương hợp | — | Trả bộ khuôn hợp lệ cho một kỹ năng. Người soạn chọn trong bộ đó, Cấm — NEVER ngoài bộ |
| Cổng bố cục bài | — | Chặn bài vi phạm sàn chủ đề hoặc sàn khuôn |
| Trẻ 3–6 | — | Đi hết các chủ đề của bài, mỗi chủ đề gặp ít nhất một khuôn khác nhau |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/content/src/lessons/**` | Người soạn | Nguồn sự thật của bài học. Trường `topics[]` là mới |
| `packages/content/src/activities/**` | Người soạn | Hoạt động, gồm `digital_game` trỏ `ref_code` |
| `packages/content-build/src/gates/skill-template-affinity.ts` | Dev | Có sẵn — trả khuôn hợp lệ theo kỹ năng |
| `packages/content-build/src/gates/lesson-variety.ts` | Dev | Có sẵn — phải mở rộng để đo trong một bài |

## 4. Main flow

1. Một ô lộ trình (`LEARNING-ROADMAP-MODEL` mục 7.2) gọi tên một kỹ năng và một band tuổi.
2. Người soạn khai bài học cho ô đó, liệt kê **dãy chủ đề** — mỗi chủ đề là một dãy giá trị có
   thứ tự trong một strand, theo `BR-CTM-02`.
3. Với mỗi chủ đề, người soạn hỏi ma trận tương hợp bộ khuôn hợp lệ của kỹ năng neo chủ đề đó.
4. Người soạn chọn **≥2 khuôn khác nhau** cho mỗi chủ đề và soạn hoạt động tương ứng.
5. Cổng bố cục đo: số chủ đề, số khuôn riêng biệt mỗi chủ đề, số khuôn riêng biệt toàn bài,
   và tổng thời lượng theo trần band của `BR-PAR-01`.
6. Bài xanh thì publish; bài đỏ trả về người soạn kèm tên trần bị vượt.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Kỹ năng chỉ có 1 khuôn hợp lệ | Ma trận tương hợp trả một phần tử | Chủ đề được miễn sàn 2 khuôn, và ô được ghi nợ vào báo cáo thiếu khuôn. Cấm — NEVER lấp bằng khuôn ngoài ma trận |
| Chủ đề quá dài cho một bài | Vượt trần thời lượng band | Chia thành nhiều bài nối tiếp, `sequence_no` tăng dần — `concept-topic-model.md` mục 5 |
| Một chủ đề xuất hiện ở hai bài | Ôn lại theo `BR-CRM-03` | Được, nhưng bài ôn BẮT BUỘC dùng bộ khuôn khác bài giới thiệu |
| Bài vai trò `offscreen` | Tiết ngoài màn hình của `BR-CRM-05` | Miễn sàn khuôn số; vẫn giữ sàn chủ đề |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LTC-01` (nhiều chủ đề) | Một bài học BẮT BUỘC khai `topics[]` với **≥2** chủ đề, trừ bài vai trò `introduce` của một chủ đề dài | Đây là nguyên văn yêu cầu của người đặt việc. Một bài một chủ đề là thứ đang có, và nó làm bài học thành một nhãn chứ không phải một tiết |
| `BR-LTC-02` (chủ đề là thực thể, không phải nhãn) | Mỗi phần tử của `topics[]` trỏ một mã chủ đề khai theo `BR-CTM-01`. Cấm — NEVER dùng `theme_tag` làm chủ đề học | `theme_tag` là bối cảnh kể chuyện — `home`, `ocean`, `space`. Nó không nói trẻ học gì. 15 giá trị của nó không chia được thành đơn vị dạy |
| `BR-LTC-03` (nhiều khuôn mỗi chủ đề) | Mỗi chủ đề BẮT BUỘC có **≥2** khuôn trò chơi khác nhau, trừ nhánh miễn ở mục 5 | Một chủ đề một khuôn thì trẻ học cơ chế bấm nút, không học khái niệm. Hôm nay trung bình một bài chỉ có 1,7 cơ chế cho cả bài |
| `BR-LTC-04` (khuôn lấy từ ma trận) | Khuôn của một chủ đề BẮT BUỘC nằm trong bộ mà `skill-template-affinity` trả cho kỹ năng neo chủ đề | Chọn khuôn bằng tay thì khuôn lệch `thinking_processes` hoặc lệch tuổi, và không cổng nào bắt được |
| `BR-LTC-05` (cấm số cố định) | Cấm — NEVER ghi cứng số hoạt động hay số trò chơi của một bài trong bộ sinh | Sàn bằng trần ở cả 126 bài là dấu vết của hằng số trong code. Con số phải do dãy chủ đề quyết |
| `BR-LTC-06` (kỹ năng phải giao) | Mọi hoạt động của bài BẮT BUỘC có `skill_codes` giao khác rỗng với `skill_codes` của bài | Đo được 11 hoạt động trò chơi không chia chung kỹ năng nào với bài chứa nó — trẻ chơi thứ bài không dạy |
| `BR-LTC-07` (ôn lại đổi khuôn) | Bài ôn một chủ đề BẮT BUỘC dùng bộ khuôn khác bài giới thiệu chủ đề đó | Ôn bằng đúng màn cũ là kiểm tra trí nhớ thao tác, không phải củng cố khái niệm |
| `BR-LTC-08` (trần band trên tổng bài) | Tổng thời lượng và tổng số bước của cả dãy chủ đề BẮT BUỘC nằm trong trần band theo `BR-PAR-01` | Thêm chủ đề mà không ép trần là đổi lỗi "bài nghèo" thành lỗi "bài quá tải" |
| `BR-LTC-09` (cổng đo trong bài) | Cổng BẮT BUỘC đo số khuôn riêng biệt **trong từng bài**, Cấm — NEVER chỉ đo trên toàn corpus | Corpus đa dạng mà mỗi bài đơn điệu vẫn cho cổng xanh. Đó là dạng xanh giả đã gặp ở `lesson-variety` |
| `BR-LTC-10` (một chủ đề, một strand) | Neo lại `BR-CTM-02` — mọi giá trị của một chủ đề thuộc cùng một strand | Chủ đề trải hai strand thì không có ô lộ trình nào nhận nó, và cầu không nối được xuống khuôn |

## 7. Data

### 7.1 Hình dạng mới của `topics[]` trong bài học

```
LessonSeed.header.topics[]
  topic_code     mã chủ đề, khai theo BR-CTM-01
  skill_code     kỹ năng neo chủ đề                      (BR-CTM-03)
  sequence_no    thứ tự chủ đề trong bài
  templates[]    ≥2 mã khuôn, lấy từ ma trận tương hợp   (BR-LTC-03, BR-LTC-04)
  activity_codes hoạt động lấp các khuôn trên
```

`theme_tag` giữ nguyên vị trí và ý nghĩa cũ — bối cảnh kể chuyện. Nó **không** vào `topics[]`.

### 7.2 Trạng thái đo ngày 2026-09-20

| Đại lượng | Min | Max | Trung bình | Ghi chú |
|---|---:|---:|---:|---|
| Hoạt động mỗi bài | 3 | 3 | 3,00 | Sàn bằng trần — hằng số trong bộ sinh |
| Trò chơi số mỗi bài | 2 | 2 | 2,00 | Sàn bằng trần |
| Cơ chế riêng biệt mỗi bài | 1 | 2 | 1,70 | 38 bài chỉ một cơ chế |
| Kỹ năng mỗi bài | 1 | — | — | 30 trên 126 bài có >1 kỹ năng |
| `theme_tag` riêng biệt toàn corpus | — | — | 15 | Bối cảnh, không phải chủ đề dạy |
| `what_tags` riêng biệt toàn corpus | — | — | 103 | Gần nhất với chủ đề, nhưng không có mã và không neo strand |
| Hoạt động trò chơi lệch kỹ năng của bài | — | — | 11 | Vi phạm `BR-LTC-06` |

### 7.3 Trần và sàn đề xuất

| Đại lượng | Sàn | Trần | Rule |
|---|---:|---:|---|
| Chủ đề mỗi bài | 2 | 4 | `BR-LTC-01` · `BR-LTC-08` |
| Khuôn riêng biệt mỗi chủ đề | 2 | 4 | `BR-LTC-03` |
| Khuôn riêng biệt mỗi bài | 3 | — | `BR-LTC-09` |
| Thời lượng bài band `3-4` | — | theo `preschool-age-bands.json` | `BR-LTC-08` |

Trần 4 chủ đề là **đề xuất chưa chốt** — câu hỏi 1 mục 11.

## 8. API contract

Không sở hữu route. Bài học phát ra ngoài qua route đã có của
[`lesson-model.md`](lesson-model.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-LTC-01 — bài có nhiều chủ đề
  When kiểm mọi bài học published không phải vai trò introduce
  Then mỗi bài khai ít nhất 2 chủ đề

Scenario: BR-LTC-01 — ca âm, bài một chủ đề phải đỏ
  Given một bài vai trò practice khai đúng 1 chủ đề
  When chạy cổng bố cục bài
  Then cổng trả mã thoát ≠ 0 và in mã bài

Scenario: BR-LTC-03 — mỗi chủ đề nhiều khuôn
  When kiểm mọi chủ đề của mọi bài published
  Then mỗi chủ đề có ít nhất 2 khuôn khác nhau
  Or kỹ năng neo chủ đề đó chỉ có 1 khuôn hợp lệ trong ma trận

Scenario: BR-LTC-04 — khuôn nằm trong ma trận
  Given một chủ đề neo kỹ năng S khai khuôn T
  When tra ma trận tương hợp cho S
  Then T nằm trong bộ khuôn hợp lệ của S

Scenario: BR-LTC-04 — ca âm, khuôn ngoài ma trận phải đỏ
  Given một chủ đề khai một khuôn không có trong bộ hợp lệ của kỹ năng nó neo
  When chạy cổng bố cục bài
  Then cổng trả mã thoát ≠ 0 và in cặp kỹ năng-khuôn sai

Scenario: BR-LTC-05 — không còn số cố định
  When đo số hoạt động trên toàn corpus bài học
  Then giá trị nhỏ nhất khác giá trị lớn nhất

Scenario: BR-LTC-06 — hoạt động chia chung kỹ năng với bài
  When kiểm mọi hoạt động của mọi bài
  Then skill_codes của hoạt động giao khác rỗng với skill_codes của bài

Scenario: BR-LTC-07 — bài ôn đổi khuôn
  Given chủ đề K được giới thiệu ở bài A và ôn ở bài B
  When so bộ khuôn của K ở hai bài
  Then hai bộ khác nhau

Scenario: BR-LTC-09 — cổng đo trong từng bài
  Given một corpus đa dạng khuôn nhưng mọi bài chỉ dùng 1 khuôn
  When chạy cổng đa dạng
  Then cổng trả mã thoát ≠ 0
```

## 10. Boundaries

**Always**
- Khai chủ đề bằng mã chủ đề thật, neo một kỹ năng thật.
- Lấy khuôn từ ma trận tương hợp.
- Đo đa dạng khuôn trong từng bài, không chỉ trên corpus.
- Ép trần band trên tổng cả dãy chủ đề.

**Ask first**
- Đổi trần 4 chủ đề một bài.
- Miễn sàn 2 khuôn cho một kỹ năng ngoài nhánh đã khai ở mục 5.
- Cho `theme_tag` mang nghĩa dạy học.

**Never**
- Ghi cứng số hoạt động hay số trò chơi trong bộ sinh.
- Chọn khuôn ngoài ma trận tương hợp.
- Dùng `theme_tag` hay `what_tags` thay cho mã chủ đề.
- Để hoạt động trong bài dạy kỹ năng mà bài không khai.
- Tạo hàng `skills` mới để đặt tên cho một chủ đề — ranh giới của `BR-CTM-01`.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Trần 4 chủ đề một bài có quá tải band `3-4` không? | P4 | Soạn thử 5 bài band `3-4` với 2, 3 và 4 chủ đề rồi đo thời lượng thực trước khi chốt | Nội dung |
| 2 | 103 giá trị `what_tags` chuyển thành mã chủ đề được bao nhiêu? | P4 | Ánh xạ thử trên C1 trước; phần không neo được strand thì giữ làm tag | Nội dung |
| 3 | Bao nhiêu kỹ năng trong 443 chỉ có 1 khuôn hợp lệ — tức bao nhiêu chủ đề sẽ rơi vào nhánh miễn? | P4 | Chạy `skill-template-affinity` và in phân bố trước khi chốt sàn 2 khuôn | Dev |
| 4 | 126 bài đang có chuyển sang `topics[]` bằng cách nào — soạn lại hay ánh xạ máy? | P4 | Ánh xạ máy phần `what_tags` neo được strand, soạn tay phần còn lại | người quyết |
