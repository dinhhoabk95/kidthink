---
spec: CONCEPT-TOPIC-MODEL
title: Chủ đề làm quen — bài học mở đầu là game level, không phải kỹ năng
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-09-06
owns:
  - Từ vựng chủ đề làm quen và chỗ nó được khai
  - Luật gắn một bài học mở đầu vào các kỹ năng chơi mà nó dạy
  - Luật nhiều tiết học nối tiếp cho cùng một chủ đề
  - Luật hạn ngạch: level dạy không tính vào hạn ngạch level chơi
depends_on:
  - SCHEMA-CONTENT-TAXONOMY
  - CONCEPT-INTRO-MODEL
  - CONCEPT-INTRO-GATE
  - SKILL-DATASET-MODEL
  - GAME-LEVEL-MODEL
  - ENGINE-GT000
---

# Chủ đề làm quen — bài học mở đầu là game level, không phải kỹ năng

## 1. Objective

Mỗi kỹ năng đang có level **kiểm tra** thứ trẻ đã biết. Đo ngày 2026-09-06:
**392 trên 408** kỹ năng có game chấm mà không có bài **dạy**
([`scripts/intro-coverage-baseline.json`](../../../scripts/intro-coverage-baseline.json)).
Trẻ gặp khái niệm lần đầu ngay trong bài chấm.

File này thay spec `CONCEPT-PRE-SKILL` (gỡ 2026-09-06, lịch sử ở
[`254-skill-opening-lesson-plan.md`](../../tasks/254-skill-opening-lesson-plan.md) mục 2) —
bản đó neo bài học vào một **kỹ năng bậc `pre` mới tạo trong taxonomy**.
Người đặt việc bác cách đó ngày 2026-09-06:
bài học mở đầu là **thêm game level**, không phải thêm kỹ năng. Lý do trùng với ranh giới
đã có ở [`AGENTS.md`](../../../AGENTS.md): taxonomy là Lớp 1 do người thiết kế, agent
Cấm — NEVER sinh `skills` hay `strands`.

Một **chủ đề** là một dãy giá trị có thứ tự thuộc cùng một strand — số 0–5 là sáu giá trị,
hình phẳng là bảy hình, màu cơ bản là tám màu. Chủ đề **không** là một hàng trong `skills`.
Nó là một khối khai trong `content_pack` của chính level dạy, và nó tự nói ra nó dạy cho
những kỹ năng nào. Một chủ đề dài được dạy bằng **một hoặc nhiều** tiết học nối tiếp.

Khác biệt với [`concept-intro-model.md`](concept-intro-model.md): file đó sở hữu **hình dạng
một bài làm quen** — kho chất liệu, dãy hành động, ràng buộc biên tập. File này sở hữu
**thứ được dạy, ai bị nó chặn, và một chủ đề được chia thành mấy tiết**.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn | `content_author` | Khai chủ đề trong `content_pack`, soạn dataset chủ đề, soạn level `GT-000` |
| Người duyệt | `content_reviewer` | Đối chiếu checklist mục 7.6 trước khi publish |
| Cổng hạn ngạch | — | Loại level `kind = 'teach'` khỏi phép đếm hạn ngạch level chơi |
| Cổng chặn | — | Đọc `content_skill_map`, trả `428 INTRO_REQUIRED` khi bài làm quen còn thiếu |
| Trẻ 3–6 | — | Đi hết các tiết của chủ đề rồi mới mở được các trò chơi cùng chủ đề |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/content/src/skills/**` | Người soạn | Nguồn sự thật của kỹ năng, dataset và `SkillLevelPlan` |
| `packages/content/src/builders/gt-000.ts` | Dev | Bộ chiếu dataset thành `content_pack` của `GT-000` |
| `packages/content-build/src/gates/skill-quota.ts` | Dev | Hạn ngạch level từng kỹ năng |
| `scripts/check-intro-coverage.ts` | Dev | Cổng bậc thang độ phủ bài làm quen |
| `apps/web/server/utils/concept-intro-runtime.ts` | Dev | Bao đóng prerequisite và hàng đợi bài làm quen |

## 4. Main flow

Không có. Spec ràng buộc.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Chủ đề vừa đủ ngắn | Mọi giá trị phủ được trong một lần ngồi | Một tiết duy nhất, `sequence_no = 1` |
| Chủ đề dài | Vượt trần thời lượng của `BR-CIM-06` | Chia thành nhiều tiết, mỗi tiết một hàng `game_levels`, `sequence_no` tăng dần |
| Một kỹ năng thuộc hai chủ đề | Ví dụ một kỹ năng đếm chạm cả dãy số lẫn thao tác đếm | Cả hai chủ đề vào hàng đợi; thứ tự do topo trên `skill_prerequisites` quyết |
| Chủ đề chưa có tiết nào `published` | Thư viện còn thiếu | Cổng **mở** — `BR-CIG-04`. Nợ đếm ở cổng bậc thang, Cấm — NEVER chặn trẻ vì thư viện thiếu |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CTM-01` (chủ đề không phải kỹ năng) | Một chủ đề khai trong `content_pack.concept` của level dạy. Cấm — NEVER tạo một hàng `skills` để làm chỗ neo cho một chủ đề, Cấm — NEVER dùng lại bậc `pre` | Đây là nguyên văn quyết định của người đặt việc. Kỹ năng là Lớp 1 code-owned, mã bất biến, bị telemetry và mọi bài học neo vào; thêm một kỹ năng chỉ để đặt tên cho một bài dạy là trả giá vĩnh viễn cho một nhãn |
| `BR-CTM-02` (một chủ đề, một strand) | Mọi giá trị của một chủ đề BẮT BUỘC thuộc **cùng một** strand | Bài làm quen phải xếp được vào hàng đợi, và hàng đợi chỉ trả lời được câu "còn thiếu bài nào" khi một bài ứng với một chỗ. Chủ đề trải hai strand thì không có chỗ nào để đặt nó |
| `BR-CTM-03` (neo bằng kỹ năng chơi) | `content_pack.concept.skill_code` trỏ **một kỹ năng chơi thật** của chủ đề — theo quy ước là kỹ năng có mã nhỏ nhất. Cấm — NEVER trỏ một mã không tồn tại trong `skills` | Cổng phải nêu tên được thứ trẻ sắp học, và cái tên đó phải là thứ đã có trong taxonomy chứ không phải nhãn do người soạn tự đặt |
| `BR-CTM-04` (gắn đủ kỹ năng nó dạy) | Level dạy BẮT BUỘC khai `skill_codes` gồm **mọi** kỹ năng chơi mà chủ đề đó dạy | Hai cổng đọc hai chỗ: cổng phủ so khớp mã kỹ năng đúng bằng, cổng chặn tra `content_skill_map`. Gắn thiếu thì bài làm quen tồn tại mà nợ phủ không giảm và kỹ năng thiếu vẫn mở thẳng |
| `BR-CTM-05` (chặn bằng chính mã kỹ năng) | Cửa chặn suy từ `content_skill_map` của level dạy, Cấm — NEVER đòi người soạn khai thêm một cạnh `skill_prerequisites` chỉ để bật cổng | Bản `pre` cũ bắt mọi kỹ năng chơi khai một prerequisite giả. Cạnh prerequisite là ràng buộc sư phạm giữa hai kỹ năng thật; mượn nó làm công tắc cổng làm bẩn đồ thị mà ZPD selector đang đọc |
| `BR-CTM-06` (một hoặc nhiều tiết) | Một chủ đề được có **nhiều** level dạy `published`. Khi có hơn một, mỗi level BẮT BUỘC khai `content_pack.concept.sequence_no` là số nguyên dương, duy nhất trong chủ đề | Người đặt việc yêu cầu "một hoặc nhiều tiết học". Trần một-bài của bản `pre` cũ chặn đúng thứ được yêu cầu. Nhưng hàng đợi phải có thứ tự, nếu không hai tiết của cùng một chủ đề trả về theo thứ tự ngẫu nhiên của truy vấn |
| `BR-CTM-07` (đi hết mọi tiết) | Chủ đề coi là đã học xong khi trẻ đi hết **mọi** tiết `published` của nó, không phải tiết đầu | Chia tiết là để trẻ không bỏ giữa chừng, không phải để rút ngắn thứ phải học. Tính xong ở tiết đầu là biến việc chia tiết thành lỗ hổng |
| `BR-CTM-08` (khó không vượt) | `difficulty` của level dạy = 1 và ≤ `difficulty` nhỏ nhất trong nhóm kỹ năng nó dạy | Bài làm quen khó hơn trò chơi là cửa ải, không phải cửa vào |
| `BR-CTM-09` (phủ hết giá trị) | Các tiết của một chủ đề cộng lại BẮT BUỘC dạy **mọi** giá trị khai trong chủ đề. Đối chiếu tự động với kho giá trị tương ứng ([`skill-value-inventory.md`](skill-value-inventory.md)), không đối chiếu bằng mắt người duyệt. Thiếu một giá trị là vi phạm | Đây là chính điều người đặt việc yêu cầu: một chủ đề học cho trọn. Không có luật này thì bộ chiếu lấy hai vật đầu rồi dừng, đúng như nó từng làm |
| `BR-CTM-10` (dataset trung thực) | Dataset dùng cho level dạy và các kỹ năng con BẮT BUỘC chứa đúng các giá trị của kho giá trị chủ đề, đối chiếu tự động với kho giá trị tương ứng ([`skill-value-inventory.md`](skill-value-inventory.md)), Cấm — NEVER mượn vật từ vốn từ chủ đề trang trí | Đo ngày 2026-09-05: dataset của kỹ năng "Quan sát màu" chứa thìa, cốc, giường, ghế, táo — không một màu nào, mà cổng phủ vẫn xanh. Đó là cách một kho đạt 100% phủ mà dạy 0% |
| `BR-CTM-11` (hạn ngạch loại hẳn level dạy) | Level `kind = 'teach'` **không** được tính vào `totalLevels` hay số khuôn phân biệt khi đo hạn ngạch level chơi của một kỹ năng | Với bản `pre` cũ, level dạy nằm trên một kỹ năng riêng nên không đụng hạn ngạch. Gắn thẳng vào kỹ năng thật thì nó đội số đếm lên: một kỹ năng C1 có 9 bài chơi cộng 1 bài dạy sẽ đạt hạn ngạch 10 trong khi thực chất thiếu một bài chơi |
| `BR-CTM-12` (tier không cao hơn game) | `access_tier` của level dạy ≤ tier thấp nhất trong các level của những kỹ năng mà chủ đề đó dạy | Bài làm quen `premium` đứng trước một trò chơi `free` là dựng tường thu phí ở chỗ [`access-ladder.md`](../00-foundation/access-ladder.md) không cho phép |

## 7. Data

**Đọc:** `skills` · `strands` · `skill_prerequisites` · `skill_datasets`.
**Ghi:** `game_levels` · `content_skill_map` — không bảng mới, không cột mới.

### 7.1 Bậc kỹ năng — về lại ba giá trị

| Ký hiệu | Mã | Nhãn | Nghĩa |
|---|---|---|---|
| `b` | `basic` | Làm quen thao tác | Một thuộc tính, có gợi ý, độ khó 1–2 |
| `c` | `core` | Thành thạo | Chuẩn của band, làm độc lập, độ khó 3 |
| `a` | `advanced` | Thử thách | Nhiều thuộc tính hoặc nhiều bước, độ khó 4–5 |

<!-- taxonomy-refs:historical -->
Giá trị `pre` bị gỡ khỏi `SkillProgressionTier`. Năm kỹ năng đã tạo theo bản cũ —
`C1.NREC.13` `C1.NREC.14` `C1.NREC.15` `C2.GEO.09` `C4.DET.05` — bị xoá, level `GT-000`
của chúng chuyển sang file kỹ năng chơi đầu tiên của cùng chủ đề. Chưa mã nào trong
năm mã đó được publish ở bất cứ môi trường nào, nên không có telemetry neo vào.

### 7.2 Khối `concept` trong `content_pack`

| Field | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `concept.skill_code` | `string` | Có | Mã một kỹ năng chơi thật của chủ đề — `BR-CTM-03` |
| `concept.label` | `string` | Có | Tên chủ đề nói được, ví dụ `"số 0 đến 10"` |
| `concept.teaches[]` | `string[]` | Có | Mã mọi kỹ năng chơi mà chủ đề dạy; khớp `skill_codes` của level — `BR-CTM-04` |
| `concept.values[]` | `string[]` | Có | Dãy giá trị có thứ tự của chủ đề, 2–21 phần tử — `BR-CTM-09` |
| `concept.sequence_no` | `integer` | ≥1 | Thứ tự tiết trong chủ đề; bắt buộc khi chủ đề có hơn một tiết — `BR-CTM-06` |

Trường `concept.pre_skill_code` của bản cũ bị gỡ. Hợp đồng `GT-000` đã có sẵn
`concept.skill_code` từ đầu, nên đây là bỏ một trường thừa chứ không phải thêm trường mới.

### 7.3 Năm chủ đề đã soạn — gắn lại sau khi gỡ bậc `pre`

| Chủ đề | Giá trị | `concept.skill_code` mới | `concept.teaches[]` |
|---|---:|---|---|
| Số 0–5 | 6 | `C1.NREC.01` | `C1.NREC.01` · `C1.NREC.02` |
| Số 0–10 | 11 | `C1.NREC.03` | `C1.NREC.03` |
| Số 11–20 | 10 | `C1.NREC.04` | `C1.NREC.04` |
| Hình phẳng | 7 | `C2.GEO.01` | `C2.GEO.01` … `C2.GEO.08` |
| Màu cơ bản | 8 | `C4.DET.01` | `C4.DET.01` |

Ba chủ đề số vẫn xếp thành một dãy, nhưng dãy đó giờ là **cạnh sẵn có** giữa
`C1.NREC.01 → C1.NREC.03 → C1.NREC.04` trong `skill_prerequisites`, không phải cạnh
thêm vào để bật cổng — `BR-CTM-05`.

### 7.4 Trạng thái dữ liệu hôm nay

| Chủ đề | Dataset | Việc phải làm |
|---|---|---|
| Số 0–5 | Có, 6 vật đủ mặt chữ số, nhãn, emoji, `audio_path` | Chuyển sang `C1.NREC.01.ts` |
| Số 0–10 | Có, 11 vật | Chuyển sang `C1.NREC.03.ts` |
| Số 11–20 | Có | Chuyển sang `C1.NREC.04.ts` |
| Hình phẳng | Có, 7 hình | Chuyển sang `C2.GEO.01.ts` |
| Màu cơ bản | Có, 8 màu | Chuyển sang `C4.DET.01.ts` |

### 7.5 Cổng bậc thang độ phủ

| Thứ | Giá trị |
|---|---|
| Đo gì | Số kỹ năng **có ít nhất một level `kind = 'assess'`** nhưng **không có** level `kind = 'teach'` nào gắn vào |
| Cài đặt | [`scripts/check-intro-coverage.ts`](../../../scripts/check-intro-coverage.ts) — `measureIntroCoverageDebt()` |
| Baseline | **392**, đo 2026-09-06 |
| Tăng | Đỏ |
| Giảm | Xanh, hạ baseline bằng `--update` |
| Ai gọi | `pnpm check:intro-coverage`, chạy trong Phase 1 của `scripts/check.sh` — `BR-CIG-18` |
| Ca âm bắt buộc | Thêm một level chấm cho kỹ năng chưa có bài dạy → cổng phải đỏ |

### 7.6 Checklist người duyệt

1. Đếm giá trị dạy trong mọi tiết của chủ đề, so với `concept.values[]` — thiếu một là trượt.
2. Mở dataset, đọc từng nhãn: nó có phải giá trị của chủ đề không, hay là vật mượn?
3. `skill_codes` của level có khớp đúng `concept.teaches[]` không?
4. Chủ đề có hơn một tiết thì mọi tiết có `sequence_no` duy nhất và liên tục từ 1 chưa?
5. Bấm thử một trò chơi thuộc chủ đề khi chưa học — có bị chặn thật không?
6. Đi hết tiết đầu rồi bấm lại trò chơi đó — vẫn còn bị chặn cho tới khi hết tiết cuối chứ?

## 8. API contract

Không sở hữu route. Cửa chặn đi qua bước 8 của thang truy cập, sở hữu ở
[`concept-intro-gate.md`](../04-play/concept-intro-gate.md) mục 8.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CTM-01 — Tạo kỹ năng chỉ để neo một chủ đề thì bị từ chối
  Given Một kỹ năng khai tier pre
  When Cổng taxonomy chạy
  Then Cổng báo lỗi và nêu bậc pre đã bị gỡ khỏi từ vựng bậc

Scenario: BR-CTM-02 — Chủ đề trải hai strand thì bị từ chối
  Given Một chủ đề khai giá trị thuộc hai strand khác nhau
  When Cổng chủ đề chạy
  Then Cổng báo lỗi và nêu hai mã strand đang bị trộn

Scenario: BR-CTM-03 — concept.skill_code trỏ mã không tồn tại thì bị từ chối
  Given Một level dạy khai concept.skill_code là C9.XXX.01
  When Cổng nội dung chạy
  Then Cổng báo lỗi và nêu mã kỹ năng không có trong taxonomy

Scenario: BR-CTM-04 — Level dạy gắn thiếu kỹ năng thì nợ phủ không giảm
  Given Một chủ đề khai teaches gồm tám kỹ năng hình
  And Level dạy của nó chỉ khai skill_codes gồm hai kỹ năng
  When Cổng phủ bài làm quen chạy
  Then Cổng báo lỗi và liệt kê sáu kỹ năng chưa được gắn

Scenario: BR-CTM-05 — Cổng chặn không đòi cạnh prerequisite giả
  Given Một kỹ năng chơi không khai prerequisite nào
  And Chủ đề của nó có một level dạy published gắn đúng kỹ năng đó
  When Trẻ chưa học mở trò chơi của kỹ năng đó
  Then Hệ thống trả 428 INTRO_REQUIRED
  And hàng đợi trỏ đúng level dạy đó

Scenario: BR-CTM-06 — Chủ đề nhiều tiết mà thiếu sequence_no thì bị từ chối
  Given Một chủ đề có hai level dạy published
  And Một trong hai không khai concept.sequence_no
  When Cổng nội dung chạy
  Then Cổng báo lỗi và nêu tiết còn thiếu số thứ tự

Scenario: BR-CTM-07 — Đi hết tiết đầu chưa mở được trò chơi
  Given Một chủ đề có hai tiết dạy published
  And Trẻ đã đi hết tiết số 1
  When Trẻ mở một trò chơi của chủ đề đó
  Then Hệ thống trả 428 INTRO_REQUIRED
  And hàng đợi trỏ tiết số 2

Scenario: BR-CTM-09 — Chủ đề dạy thiếu giá trị thì bị từ chối
  Given Chủ đề số 0 đến 10 khai 11 giá trị
  When Các tiết của chủ đề cộng lại chỉ dạy 2 giá trị
  Then Hệ thống trả 422
  And lý do liệt kê 9 giá trị chưa được dạy

Scenario: BR-CTM-10 — Dataset không chứa giá trị của chủ đề thì bị từ chối
  Given Chủ đề màu cơ bản khai 8 giá trị màu
  And Dataset chứa thìa, cốc, giường, ghế và táo
  When Cổng trung thực dataset chạy
  Then Cổng báo lỗi và nêu không giá trị nào của chủ đề có mặt trong dataset

Scenario: BR-CTM-11 — Level dạy không giúp một kỹ năng đạt hạn ngạch
  Given Một kỹ năng thuộc C1 có 9 level chấm và 1 level dạy
  When Cổng hạn ngạch kỹ năng chạy
  Then Cổng báo lỗi cho kỹ năng đó
  And lý do nêu còn thiếu 1 level chơi trên hạn ngạch 20
```

## 10. Boundaries

**Always**
- Khai chủ đề trong `content_pack.concept` của chính level dạy.
- Gắn level dạy vào **mọi** kỹ năng chơi mà nó dạy, ngay trong cùng lượt soạn.
- Soạn dataset chủ đề từ chính giá trị của chủ đề.
- Đánh `sequence_no` ngay khi chủ đề có tiết thứ hai.

**Ask first**
- Thêm chủ đề trải hơn một strand.
- Nới trần 21 giá trị mỗi chủ đề.
- Cho một chủ đề nhiều hơn bốn tiết.

**Never**
- Cấm — NEVER tạo kỹ năng mới để làm chỗ neo cho một chủ đề.
- Cấm — NEVER dùng lại bậc `pre`.
- Cấm — NEVER thêm cạnh `skill_prerequisites` chỉ để bật cổng chặn.
- Cấm — NEVER tính level dạy vào hạn ngạch level chơi.
- Cấm — NEVER hạ trần bậc thang phủ để né việc soạn nội dung.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Một kỹ năng thuộc hai chủ đề thì hàng đợi trả cả hai hay chỉ chủ đề gần nhất? | Độ dài hàng đợi ở C1.CNT | P4 | Nội dung |
| 2 | Sau lô C1.CMP, cầu soạn đầy đủ là bao nhiêu tiết trên 392 kỹ năng còn nợ? | Kế hoạch nội dung P5 | P5 | hoãn — mở lại khi lô C1.CMP đã đo được thời lượng thật |
