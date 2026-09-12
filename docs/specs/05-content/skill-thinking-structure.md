---
spec: SKILL-THINKING-STRUCTURE
title: Cấu trúc tư duy trong bộ dữ liệu kỹ năng — dataset phải chứng minh được kỹ năng nó khai
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-09-11
owns:
  - Luật soạn `relations` và `axes` theo từng giá trị `ThinkingProcess`
  - Phép đo trung thực tư duy — dataset có mang cấu trúc chứng minh được kỹ năng tư duy nó khai không
  - Vòng đời của bốn trường `SkillDataset` hiện không có consumer
  - Cổng `check:thinking-structure`
depends_on:
  - SKILL-DATASET-MODEL
  - TAXONOMY-SERVICE
  - SKILL-VALUE-INVENTORY
  - GAME-TEMPLATE-CONTRACT
---

# Cấu trúc tư duy trong bộ dữ liệu kỹ năng

## 1. Objective

Mỗi kỹ năng khai một hoặc nhiều `ThinkingProcess` — `compare`, `sequence`, `sort`, `deduce`, …
Khai báo đó hiện chỉ là một mảng chuỗi. Không có gì trong bộ dữ liệu của kỹ năng chứng minh rằng
bài tập sinh ra từ nó thật sự bắt trẻ làm động tác tư duy ấy.

Đo ngày 2026-09-11 trên 443 file dưới `packages/content/src/skills/`: **0/443** file viết
`relations`, **0/443** viết `axes` — đúng hai trường duy nhất mang được cấu trúc quan hệ giữa các
vật. Cùng lúc, 443/443 file dùng chung một `prompt_template`, một `success_message`, và một bộ
năm bậc `ladder` giống hệt nhau; 1.329 learning objective chỉ có bốn chuỗi `observable_criteria`
phân biệt. Các chuỗi này trùng ký tự với `generateDefaultLOs()` tại
[`packages/content-build/src/seed-master/taxonomy/index.ts:113`](../../../packages/content-build/src/seed-master/taxonomy/index.ts) —
corpus được sinh máy từ một khuôn rồi không ai viết tiếp.

Hậu quả đo được: `C1.CMP.04` là kỹ năng *"Nhiều hơn"* với `thinking_processes:
["compare","count"]`, nhưng dataset của nó là năm emoji rời rạc (ghế, táo, chuối, dưa hấu, cà
rốt) không `value`, không quan hệ, không trục so sánh, và prompt là *"Bé hãy chọn đúng {label}
nhé!"* — một bài nhận diện từ vựng. Không cổng nào bắt được, vì không cổng nào biết một bài
`compare` phải trông như thế nào trong dữ liệu.

Spec này đặt ra **hợp đồng cấu trúc tư duy**: với mỗi `ThinkingProcess`, dataset bắt buộc mang
những trường nào để cổng máy kiểm được rằng cấu trúc ấy có thật. Đây là phần "dữ liệu tư duy" mà
[`skill-dataset-model.md`](skill-dataset-model.md) định nghĩa hình dạng nhưng không định nghĩa
nghĩa vụ.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người biên soạn | `content_author` | Soạn `relations` và `axes` cho dataset theo bảng nghĩa vụ ở mục 7.1 |
| Người duyệt | `content_reviewer` | Đọc báo cáo cổng thay vì đọc tay 443 file |
| Cổng kiểm tra | CI / `check.sh` | Chạy `check:thinking-structure`, đỏ khi một kỹ năng khai tư duy mà dataset không mang cấu trúc tương ứng |
| Seeder | `packages/content-build` | Ghi `relations` và `axes` xuống `skill_datasets`; hiện `axes` không nằm trong câu `INSERT` |

## 3. Entry points

| File / Lệnh | Actor | Ghi chú |
|---|---|---|
| `packages/content/src/skills/c{1..6}/**/C*.ts` | Author | 443 file dataset |
| `packages/shared/src/skill-dataset-types.ts` | Dev | `DatasetRelation`, `SkillDataset.axes` |
| `packages/content/src/builders/build-levels.ts` | Dev | `normalizeThinkingTags` — chỗ dữ liệu tư duy bị mất |
| `packages/content-build/src/seed-master/taxonomy/index.ts` | Dev | `seedSkillDatasetsStep` — chỗ `axes` bị bỏ khỏi `INSERT` |
| `scripts/check-thinking-structure.ts` | CI / Dev | Script cổng, phải dựng mới |
| `pnpm check:thinking-structure` | CI / Dev | Lệnh chạy cổng, thêm vào `scripts/check.sh` Phase 1 |

## 4. Main flow

1. Người biên soạn mở một file kỹ năng và đọc `thinking_processes` của nó.
2. Với mỗi giá trị trong mảng đó, tra bảng nghĩa vụ ở mục 7.1 để biết dataset phải mang gì.
3. Soạn `items` bám kho giá trị theo [`skill-value-inventory.md`](skill-value-inventory.md), rồi
   soạn `relations` và `axes` thể hiện đúng quan hệ mà động tác tư duy đòi.
4. Viết `phrasing.prompt_template` nói đúng động tác ấy — không dùng lại khuôn chung.
5. Chạy `pnpm check:thinking-structure`. Cổng duyệt từng kỹ năng, với mỗi `ThinkingProcess` đã
   khai thì kiểm đủ nghĩa vụ tương ứng.
6. Cổng đỏ nêu rõ: mã kỹ năng, giá trị `ThinkingProcess` không được chứng minh, và trường còn
   thiếu.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Kỹ năng nhiều tư duy | `thinking_processes` có từ 2 giá trị trở lên | Dataset phải thoả nghĩa vụ của **mọi** giá trị, không phải giá trị dễ nhất |
| Kỹ năng chưa soạn lại | Mã kỹ năng nằm trong ratchet `scripts/thinking-structure-baseline.json` | Cổng ghi nợ, không chặn; nợ chỉ được giảm |
| Giá trị tư duy ngoài từ vựng | Một file khai chuỗi không thuộc union `ThinkingProcess` | Cổng đỏ ngay, không ghi nợ — đây là lỗi gõ, không phải nợ nội dung |
| Từ vựng tư duy của activity | `packages/content/src/activities/c*.ts` khai `thinking_tags` bằng chuỗi tự do (`"counting"`, `"visual"`) | Cổng đỏ; activity phải dùng chung union `ThinkingProcess` theo `BR-STS-08` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-STS-01` (dataset chứng minh được tư duy) | Với mỗi giá trị `t` trong `thinking_processes` của một kỹ năng, dataset của kỹ năng đó BẮT BUỘC thoả nghĩa vụ của `t` trong bảng mục 7.1 | Một mảng chuỗi không tự chứng minh điều gì; nếu không có nghĩa vụ dữ liệu kèm theo thì `compare` và `observe` là hai nhãn không phân biệt được bằng máy |
| `BR-STS-02` (`relations` là bắt buộc có điều kiện) | `SkillDataset.relations` chuyển từ tuỳ chọn sang **bắt buộc** khi `thinking_processes` giao với `{match, compare, sequence, deduce, infer}` | Bốn động tác này đều là quan hệ giữa hai vật; không khai quan hệ thì không cổng nào biết cặp nào đúng |
| `BR-STS-03` (`axes` là bắt buộc có điều kiện) | `SkillDataset.axes` chuyển từ tuỳ chọn sang **bắt buộc** khi `thinking_processes` giao với `{sort, compare, deduce}` | Phân loại và so sánh đều cần một trục; không có trục thì bài chỉ còn là nhận diện |
| `BR-STS-04` (`axes` phải xuống được DB) | `seedSkillDatasetsStep` BẮT BUỘC đưa `axes` và `extends` vào cả câu `INSERT` lẫn nhánh `onConflictDoUpdate` | Cột `skill_datasets.axes` tồn tại từ đầu nhưng không nằm trong câu ghi, nên vĩnh viễn `null` — một trường bắt buộc mà không bao giờ tới được DB là một hợp đồng giả |
| `BR-STS-05` (cấm mất dữ liệu tư duy im lặng) | `normalizeThinkingTags` BẮT BUỘC ném lỗi khi gặp giá trị không có trong `CANONICAL_THINKING_TAGS` lẫn `THINKING_TAG_NORMALIZE_MAP`. Cấm — NEVER rơi vào nhánh mặc định | `deduce` hiện rơi nhánh `else` và thành `observe`; 30 kỹ năng khai `deduce` và cả 30 mất nhãn mà không ai biết |
| `BR-STS-06` (ánh xạ thu hẹp phải khai) | Mọi ánh xạ thu hẹp trong `THINKING_TAG_NORMALIZE_MAP` BẮT BUỘC được liệt kê ở mục 7.2 của spec này, kèm lý do | Ánh xạ 18 giá trị xuống 12 làm mất 182/725 giá trị đã khai; mất mát có chủ ý thì phải viết ra, mất mát ngầm thì không |
| `BR-STS-07` (trường không consumer thì không tồn tại) | Mỗi trường của `SkillDataset` BẮT BUỘC hoặc có ít nhất một consumer ở runtime hoặc ở cổng, hoặc bị xoá khỏi type và khỏi schema. Danh sách phán quyết ở mục 7.3 | `ladder` được soạn 2.215 rung và không ai đọc; ba trong bốn trường `phrasing` cũng vậy. Trường chết làm người soạn tốn công và làm người đọc tưởng có cơ chế |
| `BR-STS-08` (một từ vựng tư duy duy nhất) | `activities/c*.ts` BẮT BUỘC dùng giá trị thuộc union `ThinkingProcess`, không dùng chuỗi tự do | Hai từ vựng song song (`"counting"` với `count`, `"visual"` với `observe`) trong một corpus làm mọi phép đếm theo trục tư duy sai mà không báo lỗi |
| `BR-STS-09` (prompt nói đúng động tác) | `phrasing.prompt_template` BẮT BUỘC khác nhau giữa các kỹ năng có `thinking_processes` khác nhau. Cổng đo số chuỗi prompt phân biệt trên toàn corpus và ratchet theo chiều tăng | Hiện một chuỗi phủ 443/443. Một prompt "chọn đúng {label}" mô tả động tác nhận diện, nên mọi bài đều thành bài nhận diện bất kể nhãn tư duy |
| `BR-STS-10` (engine phải khớp bản chất, không chỉ khớp tag) | Cổng `skill-template-affinity` BẮT BUỘC kiểm thêm rằng engine tiêu thụ được cấu trúc mà kỹ năng khai, không chỉ kiểm giao tập tag khác rỗng | `C1.CMP` (so sánh) hiện dùng `GT-007` number-bond 59 lần và `C1.ORD` (thứ tự) dùng `GT-016` clock-hands 4 lần; cả hai qua cổng vì hai tập tag có phần tử chung |
| `BR-STS-11` (nợ cấu trúc giảm một chiều) | `scripts/thinking-structure-baseline.json` là ratchet một chiều; `total_unproven_skills` chỉ được giảm | Không thể soạn lại 443 kỹ năng trong một lát cắt; nhưng cũng không được để ratchet đứng yên như `value-inventory-baseline.json` đã đứng từ Task #255 |

## 7. Data

**Đọc:** `SKILL_IDENTITIES` và `SKILL_DATASETS` từ `packages/content/src/skills/index.ts`;
kho giá trị từ `packages/content/src/inventories/`.
**Ghi:** `scripts/thinking-structure-baseline.json`; bảng `skill_datasets` cột `relations`,
`axes`, `extends`.

### 7.1 Bảng nghĩa vụ — mười tám `ThinkingProcess`

`t` là một giá trị trong `thinking_processes` của kỹ năng. `D` là dataset của kỹ năng đó.
Cột "Nghĩa vụ" là điều kiện cổng kiểm; sai điều kiện thì kỹ năng bị tính là chưa chứng minh.

| `t` | Nghĩa vụ trên `D` | Vì sao |
|---|---|---|
| `observe` | `D.items` có ít nhất một `ItemFacet` phân biệt được bằng mắt: `glyph`, `image`, hoặc `contrast_group` | Quan sát cần có thứ để nhìn; đây là nghĩa vụ nhẹ nhất và là mặc định an toàn |
| `compare` | `D.axes` có ít nhất một trục **có thứ tự** (`ordered: true`), và `D.relations` có ít nhất một quan hệ `contrast` | So sánh là đặt hai vật lên một trục có thứ tự; thiếu trục thì chỉ còn nhận diện — ca `C1.CMP.04` |
| `sort` | `D.axes` có ít nhất một trục phân loại; mỗi trục có từ 2 giá trị trở lên; mỗi giá trị có từ 2 item trở lên | Phân loại với một item mỗi nhóm không phải phân loại, là ghép cặp |
| `match` | `D.relations` có ít nhất một quan hệ `pair` | Không khai cặp thì cổng không biết cặp nào đúng, và builder phải đoán |
| `count` | Ít nhất một item có `value`; tập `value` phủ trọn khoảng của kỹ năng theo `c1-numeral` | `C1.ORD` và `C1.OTO` hiện có 0 item mang `value` dù cả hai strand đều khai `count` |
| `sequence` | `D.ordering` khác thứ tự khai báo của `D.items`, **hoặc** `D.relations` có ít nhất một quan hệ `sequence` | 443/443 hiện có `ordering` đúng bằng `items.map(id)` theo thứ tự viết file, tức không mang thông tin nào |
| `infer` | `D.relations` có ít nhất một quan hệ `subset`, **hoặc** `D.axes` có từ 2 trục trở lên | Suy luận cần ít nhất hai chiều thông tin để bắc cầu |
| `predict` | `D.relations` có ít nhất một quan hệ `sequence` và `D.ordering` có nghĩa | Dự đoán là đọc tiếp một dãy; không có dãy thì không dự đoán được gì |
| `deduce` | `D.relations` có ít nhất một quan hệ `subset`, **và** `D.axes` có từ 2 trục trở lên | Loại trừ cần nhiều ràng buộc cắt nhau; một trục thì chỉ chọn được, không loại được |
| `solve` | `D.axes` có từ 2 trục trở lên, **hoặc** `D.relations` có từ 3 quan hệ trở lên | Bài toán cần đủ ràng buộc để có một đường đi không tầm thường |
| `verify` | `D.relations` có ít nhất một quan hệ `contrast` giữa một đáp án đúng và một đáp án sai gần giống (metadata.near_miss hoặc cùng contrast_group) | Kiểm tra lại là phân biệt đúng với gần đúng; không có "gần đúng" thì không có gì để kiểm |
| `create` | `D.axes` có ít nhất một trục, và `D.items` có từ 6 item trở lên | Tạo ra cần không gian lựa chọn; dưới 6 vật thì mọi sản phẩm gần như trùng nhau |
| `plan` | `D.relations` có ít nhất một quan hệ `sequence` với `metadata.step` | Lập kế hoạch là xếp thứ tự các bước; bước phải được đánh số trong dữ liệu |
| `recall` | `D.items` có ít nhất 2 giá trị `contrast_group` phân biệt | Nhớ lại cần nhiễu cùng nhóm; không nhóm nhiễu thì bài thành nhận diện |
| `inhibit` | `D.items` có ít nhất 2 giá trị `contrast_group`, với ít nhất một nhóm được đánh `metadata.is_lure` | Ức chế cần mồi nhử được khai rõ, để cổng biết mồi nào là mồi |
| `shift` | `D.axes` có từ 2 trục trở lên | Chuyển luật là đổi trục đang dùng; một trục thì không có gì để chuyển sang |
| `describe` | Mọi item có `label` không rỗng và có `audio_path` | Mô tả là bài nói; trẻ chưa đọc được nên nhãn phải phát được thành tiếng |
| `listen` | Mọi item có `audio_path` | Bài nghe không có file tiếng là bài nhìn |

### 7.2 Ánh xạ thu hẹp — khai theo `BR-STS-06`

`normalizeThinkingTags` thu 18 giá trị `ThinkingProcess` xuống 12 tag nội dung. Cả sáu ánh xạ
đều có chủ ý theo thiết kế trục tag nội dung.

| Từ | Về | Trạng thái | Ghi chú |
|---|---|---|---|
| `solve` | `infer` | có chủ ý | Trục tag nội dung không phân biệt giải và suy; giữ nhãn gốc trên `skills.thinking_processes` |
| `verify` | `compare` | có chủ ý | Kiểm tra lại là so sánh với đáp án |
| `create` | `plan` | có chủ ý | Cùng nhóm sản sinh |
| `listen` | `observe` | có chủ ý | Trục tag không có kênh giác quan |
| `describe` | `observe` | có chủ ý | Như trên |
| `deduce` | `infer` | có chủ ý | Suy luận diễn dịch ánh xạ về suy luận chung; giữ nhãn gốc trên `skills.thinking_processes` (`BR-STS-06`) |

Tổng số giá trị ánh xạ thu hẹp: **182/725** giá trị được chuẩn hoá có chủ ý theo `BR-STS-06`.

### 7.3 Phán quyết cho bốn trường không consumer — `BR-STS-07`

| Trường | Lần soạn | Consumer hiện tại | Phán quyết |
|---|---:|---|---|
| `ladder` | 443 (2.215 rung) | không có | **Giữ và nối.** `packages/adaptive/src/level-params.ts` đang tự chế ngưỡng ZPD bằng số rời; `ladder` là chỗ đúng cho các ngưỡng đó. Nối rồi thì mỗi rung phải có `dimension` khác nhau giữa các kỹ năng, không dùng chung năm bậc |
| `phrasing.narration_template` | 443 | không có | **Giữ và nối** vào [`play-narration.md`](../04-play/play-narration.md) — đây là câu dẫn trước vòng chơi |
| `phrasing.success_message` | 443 | không có | **Xoá.** `feedback-and-celebration.md` đã sở hữu chuỗi mừng ở tầng engine; hai nguồn cho một câu là drift chờ xảy ra |
| `phrasing.hint_message` | 443 | không có | **Xoá.** `scaffolding-and-hints.md` sở hữu bậc trợ giúp; gợi ý một chuỗi cố định mâu thuẫn với trợ giúp leo thang |
| `extends` | 0 | không có | **Giữ.** Cơ chế kế thừa dataset là cách duy nhất tránh chép tay giữa các kỹ năng cùng strand; chưa dùng không có nghĩa là sai |
| `game_levels.skill_dataset_id` | mọi level | ghi, không đọc | **Giữ và nối.** Bề mặt chơi cần đọc dataset để biết lối biểu diễn lượng theo [`numeracy-representation-ladder.md`](numeracy-representation-ladder.md) |

Xoá một trường cần migration; xem mục 10 "Ask first".

### 7.4 Hình dạng ratchet

```jsonc
// scripts/thinking-structure-baseline.json
{
  "total_unproven_skills": 443,
  "distinct_prompt_templates": 1,
  "unproven_by_competency": { "C1": 110, "C2": 56, "C3": 42, "C4": 86, "C5": 119, "C6": 30 },
  "unproven_by_thinking": { "compare": 83, "match": 73, "sequence": 43, "deduce": 30 }
}
```

`total_unproven_skills` và mỗi ô `unproven_*` chỉ được giảm. `distinct_prompt_templates` chỉ được
tăng — đây là trục duy nhất đi ngược, nên cổng phải kiểm nó riêng, không gộp vào vòng lặp chung.

## 8. API contract

Không có. Spec này là contract biên soạn và cổng build-time, không có bề mặt HTTP.

## 9. Acceptance criteria

```gherkin
Scenario: BR-STS-01 — kỹ năng khai compare mà dataset không có trục thì cổng đỏ
  Given kỹ năng C1.CMP.04 khai thinking_processes ["compare","count"]
  And dataset của nó không có trường axes
  When chạy pnpm check:thinking-structure
  Then cổng thoát khác 0
  And báo cáo nêu C1.CMP.04 chưa chứng minh được compare vì thiếu axes có thứ tự

Scenario: BR-STS-02 — kỹ năng khai match mà không có quan hệ pair thì cổng đỏ
  Given kỹ năng C1.OTO.01 khai thinking_processes ["match"]
  And dataset của nó có relations rỗng
  When chạy pnpm check:thinking-structure
  Then cổng thoát khác 0
  And báo cáo nêu C1.OTO.01 thiếu quan hệ kiểu pair

Scenario: BR-STS-03 — kỹ năng khai sort với một item mỗi nhóm thì cổng đỏ
  Given dataset của C3.CLS.01 có axes một trục với 3 giá trị
  And mỗi giá trị chỉ có đúng 1 item
  When chạy pnpm check:thinking-structure
  Then cổng thoát khác 0
  And báo cáo nêu trục phân loại có nhóm dưới 2 item

Scenario: BR-STS-04 — axes không xuống được DB thì test seeder đỏ
  Given một dataset có axes với một trục tên "size"
  When chạy seedSkillDatasetsStep rồi đọc lại hàng skill_datasets tương ứng
  Then cột axes khác null
  And cột axes chứa trục tên "size"

Scenario: BR-STS-05 — giá trị tư duy lạ làm normalize ném lỗi
  Given gọi normalizeThinkingTags với mảng chứa "deduce"
  When hàm chạy
  Then hàm không trả về "observe"
  And hàm hoặc trả nhãn riêng cho deduce hoặc ném lỗi nêu đúng giá trị không ánh xạ được

Scenario: BR-STS-08 — activity dùng từ vựng tư duy ngoài union thì cổng đỏ
  Given packages/content/src/activities/c1.ts khai thinking_tags ["counting"]
  When chạy pnpm check:thinking-structure
  Then cổng thoát khác 0
  And báo cáo nêu "counting" không thuộc union ThinkingProcess

Scenario: BR-STS-09 — số prompt phân biệt đi lùi thì cổng đỏ
  Given ratchet ghi distinct_prompt_templates là 40
  And corpus hiện đo ra 39 chuỗi prompt phân biệt
  When chạy pnpm check:thinking-structure
  Then cổng thoát khác 0
  And báo cáo nêu số prompt phân biệt giảm từ 40 xuống 39

Scenario: BR-STS-11 — nợ cấu trúc tăng thì cổng đỏ
  Given ratchet ghi total_unproven_skills là 300
  And corpus hiện đo ra 301 kỹ năng chưa chứng minh
  When chạy pnpm check:thinking-structure
  Then cổng thoát khác 0
  And báo cáo liệt kê đúng mã kỹ năng mới rơi vào nợ
```

## 10. Boundaries

**Always**
- Mỗi luật mới trong bảng 7.1 phải kèm một ca âm trong test — một fixture vi phạm phải làm cổng
  đỏ. Cổng chỉ có ca dương là cổng chưa được kiểm.
- Cổng đọc dataset từ `SKILL_DATASETS`, không đọc file bằng regex. Đọc bằng regex là cách cổng
  `check-skill-registry` hiện chỉ kiểm được tên file.
- Nợ trong ratchet ghi theo **mã kỹ năng**, không chỉ ghi tổng — tổng không nói được kỹ năng nào
  vừa rơi vào nợ.
- Cổng lấy gốc repo từ `REPO_ROOT` hoặc `repoPath()` của `@mindkid/config/paths`. Cấm — NEVER
  đọc `process.cwd()`: vitest chạy với cwd là thư mục workspace, nên cổng sẽ quét nhầm cây.
- Chạy lệnh cổng qua `rtk proxy <lệnh>`. Hook `rtk` thay output của `biome` và vài lệnh khác
  thành một câu xanh của riêng nó; không bọc thì không đọc được exit code thật.

**Ask first**
- Đổi union `ThinkingProcess` (18 giá trị). 443 file khai nó, ba cổng build-time đọc nó, và cột
  `skills.thinking_processes` đã có dữ liệu.
- Xoá `phrasing.success_message` hoặc `phrasing.hint_message` khỏi type. Cột
  `skill_datasets.phrasing` là `jsonb` nên không cần migration cấu trúc, nhưng cần một lần ghi
  lại toàn bảng.
- Nâng `relations` và `axes` từ tuỳ chọn thành bắt buộc trong type TypeScript. Làm sớm thì 443
  file đỏ typecheck cùng lúc; nên giữ tuỳ chọn ở type và cưỡng chế ở cổng cho tới khi nợ về 0.

**Never**
- Cấm — NEVER thay thế hàng loạt bằng `sed` trên corpus kỹ năng. Mỗi dataset cần đọc lại sau khi
  sửa; đây là lý do corpus hiện có 443 bản sao của một khuôn.
- Cấm — NEVER để một giá trị tư duy rơi vào nhánh mặc định trong bất kỳ hàm ánh xạ nào.
- Cấm — NEVER tính một kỹ năng là đã chứng minh chỉ vì nó có `relations` khác rỗng; phải đúng
  kiểu quan hệ mà bảng 7.1 đòi.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | `ladder` nối vào `packages/adaptive/src/level-params.ts` theo hình dạng nào — mỗi rung là một ngưỡng ZPD, hay là một tham số độ khó của engine | Phán quyết "giữ và nối" ở mục 7.3 | P1 | Backend |
| 2 | Ngưỡng `distinct_prompt_templates` cuối cùng là bao nhiêu — một prompt cho mỗi kỹ năng (443), hay một prompt cho mỗi cặp strand và tư duy (ước 120) | Đích của `BR-STS-09` | P1 | Nội dung |
| 3 | `BR-STS-10` kiểm "engine tiêu thụ được cấu trúc" bằng cách nào — đối chiếu `ProjectionRequires.needs` với trường dataset, hay khai tay bảng engine với kiểu quan hệ | Lát cắt sửa `skill-template-affinity` | P2 | Studio UI |
