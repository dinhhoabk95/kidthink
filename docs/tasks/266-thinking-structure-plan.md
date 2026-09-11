# Task #266 Plan: Cấu trúc tư duy — cổng đo, sửa mất dữ liệu im lặng, phán quyết bốn trường chết

> **Mục tiêu**: 443 kỹ năng khai `thinking_processes`, nhưng không có gì trong dữ liệu chứng minh
> bài tập sinh ra từ chúng thật sự bắt trẻ làm động tác tư duy ấy. Đo ngày 2026-09-11: **0/443**
> file viết `relations`, **0/443** viết `axes`, và 443/443 dùng chung một `prompt_template`.
>
> Task này dựng cổng `check:thinking-structure` đo được điều đó, sửa một chỗ mất dữ liệu im lặng
> ảnh hưởng 30 kỹ năng, và ra phán quyết một chiều cho bốn trường không ai đọc.

Spec: [`skill-thinking-structure.md`](../specs/05-content/skill-thinking-structure.md).

---

## 1. Bối cảnh

### 1.1 Tám phép đo mở đầu (đo 2026-09-11)

| # | Phép đo | Hiện tại | Đích |
|---|---|---|---|
| M1 | File kỹ năng viết `relations` | 0 / 443 | ≥ số kỹ năng khai `match`/`compare`/`sequence`/`deduce`/`infer` |
| M2 | File kỹ năng viết `axes` | 0 / 443 | ≥ số kỹ năng khai `sort`/`compare`/`deduce` |
| M3 | Chuỗi `prompt_template` phân biệt | 1 | tăng một chiều, đích ở câu hỏi mở 2 của spec |
| M4 | Chuỗi `observable_criteria` phân biệt trên 1.329 LO | 4 | tăng một chiều |
| M5 | Kỹ năng khai `deduce` bị ép thành `observe` | 30 / 30 | 0 |
| M6 | Giá trị tư duy bị viết lại hoặc mất trên đường xuống DB | 182 / 725 | chỉ còn phần đã khai ở mục 7.2 của spec |
| M7 | Trường `SkillDataset` soạn nhiều lần mà 0 consumer | 4 (`ladder`, `narration_template`, `success_message`, `hint_message`) | 0 |
| M8 | `axes` ghi được xuống `skill_datasets` | không — không có trong câu `INSERT` | có |

Lệnh tái lập M1, M2, M3:

```bash
grep -rl "relations:" packages/content/src/skills | wc -l
grep -rl "axes:"      packages/content/src/skills | wc -l
grep -rh "prompt_template:" packages/content/src/skills | sort -u | wc -l
```

### 1.2 Khoản nợ 1 — `deduce` rơi nhánh mặc định

`normalizeThinkingTags` tại
[`packages/content/src/builders/build-levels.ts:256`](../../packages/content/src/builders/build-levels.ts)
ép 18 giá trị `ThinkingProcess` xuống 12 tag. Sáu ánh xạ là có chủ ý và có trong
`THINKING_TAG_NORMALIZE_MAP`. `deduce` **không có** trong cả `CANONICAL_THINKING_TAGS` lẫn bảng
ánh xạ, nên rơi nhánh `else` ở dòng 291 và thành `observe`.

Ba mươi kỹ năng khai `deduce`. Cả ba mươi mất nhãn, và không có dòng log nào.

Đây đúng dạng hỏng mà repo đã gặp nhiều lần: một nhánh mặc định biến dữ liệu sai thành dữ liệu
hợp lệ. Sửa bằng `BR-STS-05`: hàm phải ném lỗi thay vì đoán.

### 1.3 Khoản nợ 2 — `axes` không nằm trong câu ghi

`seedSkillDatasetsStep`
([`packages/content-build/src/seed-master/taxonomy/index.ts:624`](../../packages/content-build/src/seed-master/taxonomy/index.ts))
không đưa `axes` và `extends` vào cả `INSERT` lẫn nhánh `onConflictDoUpdate`. Cột
`skill_datasets.axes` tồn tại nhưng vĩnh viễn `null`.

Nghĩa là: kể cả khi người biên soạn viết `axes`, nó cũng không tới được nơi cần dùng. Phải sửa
trước khi yêu cầu ai viết `axes`.

### 1.4 Khoản nợ 3 — bốn trường soạn 443 lần, 0 consumer

| Trường | Lần soạn | Consumer |
|---|---:|---|
| `ladder` | 443 file, 2.215 rung | không có — `grep '\.ladder'` chỉ ra hai dòng seeder |
| `phrasing.narration_template` | 443 | không có |
| `phrasing.success_message` | 443 | không có |
| `phrasing.hint_message` | 443 | không có |

Chỉ `prompt_template` được đọc, và chỉ bởi **5/37** builder. `game_levels.skill_dataset_id` cũng
được ghi mà không ai đọc.

Phán quyết ở mục 7.3 của spec: giữ và nối `ladder` với `narration_template`; xoá
`success_message` và `hint_message` vì đã có chủ khác.

### 1.5 Khoản nợ 4 — hai từ vựng tư duy song song

`packages/content/src/activities/c*.ts` hand-author `thinking_tags` bằng chuỗi tự do
(`"counting"`, `"visual"`) không thuộc union `ThinkingProcess`. Trong khi đó game level dẫn xuất
tag từ chính identity. Hai quy ước trong một corpus làm mọi phép đếm theo trục tư duy sai mà
không báo lỗi.

---

## 2. Thiết kế

### 2.1 Cổng `check:thinking-structure`

Đọc `SKILL_DATASETS` và `SKILL_IDENTITIES` từ `packages/content/src/skills/index.ts` — **không**
đọc file bằng regex. Cổng `check-skill-registry` hiện chỉ kiểm được tên file chính vì nó đọc
bằng đường dẫn.

Với mỗi kỹ năng, với mỗi `t` trong `thinking_processes`, tra bảng nghĩa vụ mục 7.1 của spec và
kiểm điều kiện. Kỹ năng không thoả đủ mọi `t` bị tính là **chưa chứng minh**.

Ba trục đo, ba hướng ratchet:

| Trục | Hướng | Nguồn |
|---|---|---|
| `total_unproven_skills` | chỉ giảm | đếm kỹ năng chưa chứng minh |
| `unproven_by_thinking` | chỉ giảm từng ô | đếm theo giá trị `ThinkingProcess` |
| `distinct_prompt_templates` | **chỉ tăng** | đếm chuỗi prompt phân biệt |

Trục thứ ba đi ngược hai trục kia, nên phải kiểm riêng chứ không gộp vào vòng lặp chung. Đây là
chỗ dễ viết nhầm thành "chỉ giảm" và biến cổng thành cổng ép corpus đồng nhất hơn.

### 2.2 Sửa `normalizeThinkingTags`

Hai lựa chọn cho `deduce`, chốt trong lát cắt:

1. Thêm `deduce` vào `CANONICAL_THINKING_TAGS` — giữ được nhãn, nhưng làm trục tag nội dung có 13
   giá trị và mọi cổng đọc trục đó phải cập nhật.
2. Ánh xạ tường minh `deduce → infer` trong `THINKING_TAG_NORMALIZE_MAP` — mất nhãn ở trục tag
   nhưng giữ ở `skills.thinking_processes`, và khai mất mát đó ở mục 7.2 của spec.

Lựa chọn 2 rẻ hơn và nhất quán với năm ánh xạ đã có. Dù chọn cách nào, nhánh `else` phải **ném
lỗi**, không đoán.

### 2.3 Đưa `axes` xuống DB

Thêm `axes` và `extendsSkillCode` vào cả `INSERT` lẫn `onConflictDoUpdate` của
`seedSkillDatasetsStep`. Kèm một test tích hợp ghi rồi đọc lại, khẳng định cột khác `null`.

Không cần migration — cột đã có.

### 2.4 Nâng type hay cưỡng chế ở cổng

`BR-STS-02` và `BR-STS-03` nói `relations` và `axes` "bắt buộc có điều kiện". Nếu nâng chúng
thành bắt buộc trong type TypeScript ngay, 443 file đỏ typecheck cùng lúc và không lát cắt nào
land được.

Quyết định: **giữ tuỳ chọn ở type, cưỡng chế ở cổng, có ratchet**. Nâng type chỉ khi
`total_unproven_skills` về 0. Ghi điều này vào mục 10 "Ask first" của spec — đã ghi.

### 2.5 Xoá hai trường `phrasing`

`success_message` và `hint_message` nằm trong cột `jsonb` nên không cần migration cấu trúc. Cần:

1. Xoá khỏi `SkillPhrasing` trong `packages/shared/src/skill-dataset-types.ts`.
2. Xoá khỏi 443 file (bằng codemod có kiểm, **không** bằng `sed` mù).
3. Một lần ghi lại `skill_datasets.phrasing` để dọn dữ liệu cũ.

---

## 3. Rủi ro

| Rủi ro | Dấu hiệu | Cách chặn |
|---|---|---|
| Cổng đếm "đã kiểm" trước chỗ nó bỏ qua | Cổng báo 443/443 đã duyệt mà nợ không đổi | Báo cáo phải in cả số kỹ năng **bỏ qua** và lý do bỏ qua, không chỉ số đã duyệt |
| Ratchet prompt viết nhầm chiều | Cổng đỏ khi người soạn thêm prompt mới | Ca âm riêng cho chiều tăng: thêm một prompt phân biệt phải làm cổng **xanh**, bớt một phải đỏ |
| Ném lỗi ở `normalizeThinkingTags` làm vỡ seed | `pnpm db:seed` đỏ ngay lần chạy đầu | Sửa `deduce` trước, rồi mới đổi nhánh `else` thành ném lỗi |
| Xoá trường `phrasing` bằng `sed` làm hỏng file | Typecheck đỏ rải rác, hoặc tệ hơn là xanh mà mất nội dung | Codemod dựa trên AST; diff từng file; `pnpm test` trước và sau |
| Cổng chạy quá chậm cho vòng lặp cục bộ | Người bỏ chạy cổng | Đo thời gian; nếu vượt 10 giây thì đặt vào `lefthook` thay vì `check.sh` phase 1 |

---

## 4. Phạm vi

**Trong phạm vi**: cổng `check:thinking-structure` với ratchet ba trục; sửa
`normalizeThinkingTags`; đưa `axes`/`extends` vào câu ghi của seeder; xoá hai trường `phrasing`;
nối `activities` vào union `ThinkingProcess`; ghi phán quyết bốn trường vào spec.

**Ngoài phạm vi**: soạn lại nội dung 443 dataset — task `#267` cho `C1`, các competency còn lại
chờ lát cắt sau. Nối `ladder` vào `packages/adaptive` — câu hỏi mở 1 của spec chưa chốt hình dạng.
Sửa `skill-template-affinity` theo `BR-STS-10` — chờ câu hỏi mở 3.
