---
spec: LEVEL-GENERATOR-KIT
title: Bộ sinh level — chi phí soạn màn chơi thứ tư tới thứ bốn mươi
area: platform
status: implemented
mvp: false
phase: P4
reviewed: 2026-08-30
owns:
  - Chi phí soạn game level thứ tư trở đi của một engine
  - Hình dạng bộ sinh content_pack gắn với một engine
  - Ranh giới giữa phần máy sinh và phần người duyệt trong lô nội dung
depends_on:
  - CONTENT-SEED-AUTHORING
  - GAME-TEMPLATE-CONTRACT
  - DETERMINISTIC-RANDOMNESS
  - EMOJI-REGISTRY
  - AI-CODEGEN-PIPELINE
  - ENGINE-CONTENT-DEPTH
  - SKILL-DATASET-MODEL
---

# Bộ sinh level — chi phí soạn màn chơi thứ tư tới thứ bốn mươi

## 1. Objective

[`template-authoring-kit.md`](template-authoring-kit.md) đã hạ chi phí thêm một **engine** từ
11 nơi sửa tay xuống một file mô tả. Chi phí thêm một **level** thì chưa ai sở hữu, và nó
đang là hằng số: level thứ 40 tốn đúng bằng level thứ nhất — viết tay một `content_pack`,
chọn emoji, đặt tag ba trục, đặt mã.

Hệ quả đo được ngày 2026-08-29: 21 trên 27 engine dừng ở đúng 3 level. Không ai dừng vì lười;
họ dừng vì đường cong chi phí phẳng. Sàn ở
[`engine-content-depth.md`](../05-content/engine-content-depth.md) đòi thêm 55 level để đạt
bậc 1 và 181 level để đạt bậc 2. Ở chi phí hằng số, đó là con số không đạt được.

File này sở hữu **chi phí đó**. Mục tiêu: một engine khai một bộ sinh; người soạn cấp trục và
vốn từ; máy sinh ứng viên `content_pack`; người đọc và duyệt.

**Sửa 2026-09-03 — nguồn vật.** Bản đầu của file này để bộ sinh lấy vật từ **vốn từ chủ đề**.
Đo trên corpus sinh ra theo đường đó: 5.013 level, 18.255 asset, **0** level mang chữ số hay
chữ cái, kể cả 80 level của kỹ năng bảng chữ cái. Vốn từ chủ đề không biết kỹ năng đang dạy
gì, nên nó chỉ cấp được vật trang trí. Từ nay nguồn vật là `SkillDataset` của chính kỹ năng
level đó — [`skill-dataset-model.md`](../05-content/skill-dataset-model.md) — còn vốn từ chủ
đề tụt xuống đúng vai của nó: **lớp áo minh hoạ** (`BR-SDS-10` — chủ đề là lớp áo). Nó cấm — NEVER nới bất kỳ cổng
nào của [`content-seed-authoring.md`](content-seed-authoring.md): đầu ra của bộ sinh vào corpus
qua đúng con đường mà một level viết tay đi qua.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `content_reviewer` | Cấp trục sinh và vốn từ, chạy bộ sinh, **đọc từng ứng viên**, giữ hoặc bỏ |
| Dev | — | Viết `generator.ts` cho một engine, dựa trên `content_contract` của engine đó |
| Bộ sinh | — | Sinh ứng viên `content_pack` tất định từ seed, lấy vật từ `SkillDataset`. Cấm ghi vào database |
| AI agent IDE | — | Sinh vốn từ và câu lệnh gợi ý. Cấm — NEVER chạy `seed:content`, cấm merge PR (`BR-CSA-07`) |
| Người review PR | `content_reviewer` | Cổng người duy nhất, y như với level viết tay (`BR-CSA-02`) |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/src/templates/<code>/generator.ts` | Dev | Bộ sinh của một engine, cạnh `template.ts` và `fixtures.ts` |
| `packages/content/src/vocab/<axis>.ts` | Người soạn | Vốn từ dùng chung giữa các engine: chủ đề, emoji theo chủ đề, mẫu câu lệnh |
| `pnpm --filter @mindkid/content-build gen:levels --engine=GT-014 --count=9` | Người soạn | Sinh ứng viên ra file seeder, **không** ghi database |
| `pnpm --filter @mindkid/content-build seed:content` | Người phát hành | Không đổi. Bộ sinh dừng trước bước này |

## 4. Main flow

1. Người soạn mở phiếu engine (`docs/specs/01-platform/engines/GT-<nnn>.md`) mục 6, đọc ma
   trận seed mục tiêu: ô nào còn thiếu, thiếu bao nhiêu.
2. Người soạn chạy `gen:levels` với engine, số lượng, và các trục cần lấp (band tuổi, giá trị
   `what`, giá trị `theme`).
3. Bộ sinh dựng ứng viên `content_pack` từ vốn từ, dùng nguồn ngẫu nhiên có seed của
   [`deterministic-randomness.md`](deterministic-randomness.md) — cùng seed cho cùng đầu ra.
4. Bộ sinh parse mỗi ứng viên bằng `content_contract` thật của engine. Ứng viên trượt bị bỏ,
   không sửa tự động.
5. Bộ sinh ghi ứng viên còn lại ra file seeder TS có kiểu, `status` để trống, kèm khối chú
   thích ghi seed và trục đã dùng.
6. **Người soạn đọc từng ứng viên**, sửa câu lệnh tiếng Việt, bỏ ứng viên vô nghĩa, đặt mã và
   tag ba trục.
7. PR như mọi lô nội dung khác. Bộ cổng ở mục 7.3 của [`content-seed-authoring.md`](content-seed-authoring.md) chạy. Người review duyệt.

Bước 6 là bước không bỏ được. Mọi thứ trước nó là dựng bộ khung; giá trị sư phạm vào ở đó.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Engine chưa có `generator.ts` | Engine mới, hoặc cơ chế không sinh máy được | `gen:levels` dừng với thông báo nêu engine thiếu bộ sinh. Soạn tay vẫn hợp lệ |
| Ứng viên trượt `content_contract` | Dataset không đủ vật cho `limits` | **Dừng**, in kỹ năng, khuôn, số vật thiếu (`BR-SDS-05` — cấm thử lại). Cấm — NEVER sửa tự động cho vừa contract, cấm — NEVER sinh lại tới khi qua cổng |
| Ứng viên trùng ứng viên đã có | Vốn từ hẹp | Cổng 6 (trùng lặp) của [`content-seed-authoring.md`](content-seed-authoring.md) bắt. Bộ sinh cũng tự lọc trước để đỡ lãng phí lượt đọc của người |
| Emoji không có trong danh mục | Vốn từ tự chế | Nhận, nhưng ghi vào báo cáo kiểm kê — danh mục là vốn từ khuyến nghị (`BR-EMJ-01`) |
| Người soạn muốn ghi thẳng vào database | Vội | Không có đường. `gen:levels` cấm — NEVER mở kết nối database |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LGK-01` (một engine một bộ sinh) | Bộ sinh gắn với **một** engine và nhận kiểu từ `content_contract` của engine đó qua `z.infer` | Bộ sinh chung cho mọi engine phải tự đoán hình dạng nội dung, và đoán sai thì sinh ra ứng viên trượt hàng loạt |
| `BR-LGK-02` (tất định) | Cùng seed cộng cùng vốn từ cho **cùng** đầu ra, dùng nguồn của [`deterministic-randomness.md`](deterministic-randomness.md) | Lô nội dung phải dựng lại được. `Math.random()` làm một lô không tái tạo được để so |
| `BR-LGK-03` (parse trước khi ghi) | Mỗi ứng viên parse bằng `content_contract` thật, gồm cả `refine`, trước khi ghi ra file | Cùng lý do với `BR-GTC-02` (parse ở server): một `content_pack` sai schema là màn hình trắng lúc trẻ đang chơi |
| `BR-LGK-04` (không ghi database) | `gen:levels` cấm — NEVER mở kết nối database | Đường ghi published chỉ có một, và nó thuộc [`content-seed-authoring.md`](content-seed-authoring.md). Đường thứ hai là đường không ai kiểm |
| `BR-LGK-05` (không nới cổng) | Ứng viên đi qua **đủ bộ cổng** ở mục 7.3 của [`content-seed-authoring.md`](content-seed-authoring.md) và đủ PR review, y hệt level viết tay | Nới cổng cho nội dung sinh máy là cách nhanh nhất để có 400 level không ai đọc |
| `BR-LGK-06` (đánh dấu nguồn) | Level sinh từ bộ sinh mang `origin` phân biệt được với `human`, và giữ nguyên sau khi người sửa | Khi phát hiện một lô sai, phải truy được lô nào do bộ sinh dựng khung. Nối tiếp `BR-CSA-14` (provenance) |
| `BR-LGK-07` (người đọc từng cái) | PR chứa level sinh máy phải ghi trong mô tả: ai đã đọc, bao nhiêu ứng viên bị bỏ | Con số bị bỏ là thước đo vốn từ. Bỏ 0 trên 40 nghĩa là không ai đọc |
| `BR-LGK-08` (câu lệnh tiếng Việt do người viết) | Trường `instruction` và `prompt` hiển thị cho trẻ **phải** qua tay người ở bước 6 | Câu lệnh là thứ trẻ nghe. Tiếng Việt sinh máy chưa qua người là rủi ro không đo được ở lứa 3–6 |
| `BR-LGK-09` (vốn từ là Lớp 1) | Vốn từ chủ đề và emoji theo chủ đề là dữ liệu Lớp 1, sửa qua PR, cấm sửa qua giao diện | Vốn từ quyết định mọi ứng viên sinh ra sau đó. Sửa từ giao diện là sửa nguồn mà không ai review |
| `BR-LGK-10` (bộ sinh không đặt tag) | Bộ sinh cấm — NEVER tự đặt `thinking_tags`, `what_tags`, `skill_codes` | Ba trục là thứ ma trận phủ đo. Máy tự gắn tag làm phép đo tự nói về chính nó |
| `BR-LGK-11` (vật đến từ dataset kỹ năng) | Bộ sinh lấy vật từ `SkillDataset` của kỹ năng level đó. Vốn từ chủ đề chỉ cấp **hình minh hoạ**, cấm — NEVER cấp vật học | Đường cũ lấy vật từ vốn từ chủ đề và sinh ra 5.013 level trượt `BR-SDS-02` (vật phải là vật của kỹ năng). Bộ sinh là chỗ vi phạm đó vào corpus, nên nó là chỗ phải chặn |
| `BR-LGK-12` (sinh level theo ô ma trận) | Bộ sinh theo ô (`--cell`) từ chối ô ngoài bản đồ tương hợp, từ chối ô đã đạt K=3, và bắt buộc chừa trống sáu trường (`title`, `instruction`, `skill_codes`, `what_tags`, `thinking_tags`, `theme_tag`) | Ngăn chặn việc sinh level sai lĩnh vực sư phạm và bảo đảm sáu trường phân loại phải do người biên tập hoàn thiện |

`BR-LGK-10` là ranh giới quan trọng nhất trong file này. Bộ sinh dựng **hình dạng** màn chơi;
việc màn chơi đó rèn tiến trình tư duy nào là phán đoán sư phạm, và nó thuộc về người.

## 7. Data

**Đọc:** `content_contract` của engine · vốn từ ở `packages/content/src/vocab/` · `@mindkid/emoji` Lớp 1.
**Ghi:** file seeder TS trong `packages/content/src/manual/<competency>/`. Không ghi database.

### 7.1 Hình dạng một bộ sinh

```ts
interface LevelGenerator<TContent> {
  engine: TemplateCode;
  axes: {
    age_band: AgeBand[];          // band engine này hợp lệ
    what: WhatTag[];              // giá trị trục what bộ sinh phủ được
    theme: ThemeTag[];            // giá trị trục theme bộ sinh phủ được
  };
  generate(input: {
    rng: SeededRng;               // BR-LGK-02
    dataset: SkillDataset;        // BR-LGK-11 — nguồn vật, đúng một kỹ năng
    age_band: AgeBand;
    what: WhatTag;
    theme: ThemeTag;
    vocabulary: ThemeVocabulary;  // chỉ lớp áo minh hoạ
  }): TContent;                   // kiểu lấy từ z.infer<content_contract>
}
```

Không có trường `thinking_tags`, không có `skill_codes` — theo `BR-LGK-10`. `skill_code` đi vào
qua `dataset`, không phải qua tham số rời: dataset đã mang nó, và một nguồn thì không lệch được
với chính nó.

### 7.2 Vốn từ theo chủ đề — lớp áo, không phải nguồn vật

Bảng dưới đây cấp **hình minh hoạ** cho vật mà `dataset.items[]` đã quyết định. Đổi `theme`
đổi ảnh, cấm — NEVER đổi tập vật (`BR-LGK-11`).

| Trường | Kiểu | Ràng buộc |
|---|---|---|
| `theme` | `ThemeTag` | Thuộc từ vựng đóng ở [`content-theme-registry.md`](../05-content/content-theme-registry.md) |
| `nouns` | `{ emoji_ref, label_vi }[]` | `emoji_ref` là **ký tự UTF-8**; nên lấy từ `@mindkid/emoji` để có tên tiếng Việt tra ngược |
| `containers` | `{ emoji_ref, label_vi }[]` | Dùng cho engine có đích chứa: `GT-003`, `GT-004`, `GT-008` |
| `settings` | `string[]` | Bối cảnh cho câu lệnh, người soạn viết lại ở bước 6 |
| `age_floor` | `3 \| 4 \| 5 \| 6` | Chủ đề không hợp lứa thì không đưa vào ứng viên cho band đó |

### 7.3 Đầu ra của một lượt sinh

```
gen:levels --engine=GT-014 --count=9 --band=4-5 --seed=20260829
  ứng viên dựng      12
  trượt content_contract  2   (weight_span vượt limits)
  trùng ứng viên đã có     1
  ghi ra                   9   packages/content/src/manual/c4/gen-gt014-20260829.ts
  chưa đặt mã, chưa đặt tag, chưa có instruction — bước 6 thuộc về người
```

Dòng cuối in mỗi lần, không phải tuỳ chọn. Nó là thứ ngăn một lô sinh máy bị merge như một
lô đã soạn.

### 7.4 Chi phí, đo trước và sau

| Việc | Hôm nay | Sau bộ sinh |
|---|---|---|
| Dựng hình dạng một `content_pack` | viết tay | máy |
| Chọn hình minh hoạ hợp chủ đề | viết tay, tra registry | máy, từ vốn từ |
| Chọn **vật học** của bài | viết tay, tuỳ hứng | **từ `SkillDataset`** — `BR-LGK-11` |
| Trải trục band và `what` | viết tay, dễ quên | máy, là tham số |
| Viết câu lệnh tiếng Việt | viết tay | **viết tay** — `BR-LGK-08` |
| Đặt tag ba trục | viết tay | **viết tay** — `BR-LGK-10` |
| Đặt mã và kiểm trùng | viết tay | máy gợi ý, người chốt |

Bốn dòng máy nhận là bốn dòng tốn thời gian mà không cần phán đoán. Hai dòng còn lại vẫn là
người, và đó là điều đúng.

## 8. API contract

Không có. Bộ sinh là công cụ dòng lệnh trong repo. Không route nào gọi nó.

Trình dựng game tự tạo của người dùng là bề mặt khác và thuộc
[`custom-game-builder.md`](../07-addon/custom-game-builder.md); nó cấm — NEVER dùng chung
đường ghi với bộ sinh này.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LGK-02 — cùng seed cho cùng đầu ra
  Given bộ sinh của GT-014 và vốn từ chủ đề farm
  When chạy gen:levels hai lần với cùng seed 20260829
  Then hai file đầu ra giống nhau từng byte

Scenario: BR-LGK-03 — ứng viên trượt contract bị bỏ, không bị sửa
  Given một vốn từ sinh ra weight_span vượt limits của GT-014
  When chạy gen:levels
  Then ứng viên đó không xuất hiện trong file đầu ra
  And báo cáo đếm nó vào dòng trượt content_contract
  And không ứng viên nào bị sửa giá trị cho vừa limits

Scenario: BR-LGK-04 — bộ sinh không chạm database
  Given DATABASE_URL trỏ tới một host không tồn tại
  When chạy gen:levels
  Then lệnh vẫn thành công
  And file đầu ra được ghi

Scenario: BR-LGK-08 — thiếu instruction thì cổng seed chặn
  Given một file sinh máy chưa qua bước 6, instruction để trống
  When chạy seed:content
  Then batch bị từ chối
  And không hàng nào được ghi

Scenario: BR-LGK-11 — vật đến từ dataset, không từ vốn từ chủ đề
  Given dataset của C1.NREC.02 khai sáu vật n0..n5
  And vốn từ chủ đề farm có danh từ không thuộc dataset
  When chạy gen:levels cho C1.NREC.02 với theme farm
  Then mọi item_id trong ứng viên truy được về dataset.items[].id
  And không danh từ nào của vốn từ chủ đề xuất hiện như một vật học

Scenario: BR-LGK-11 — đổi theme không đổi tập vật
  Given cùng dataset chiếu ra ứng viên với theme farm và theme school
  When so hai content_pack
  Then tập item_id trùng khít

Scenario: BR-LGK-10 — bộ sinh không đặt tag ba trục
  When đọc mọi generator.ts trong packages/game-engine/src/templates
  Then không file nào ghi thinking_tags, what_tags, hay skill_codes

Scenario: BR-LGK-06 — nguồn giữ nguyên sau khi người sửa
  Given một level sinh máy đã được người sửa câu lệnh
  When seed vào database
  Then cột origin vẫn phân biệt được với level do người soạn từ đầu

Scenario: BR-LGK-05 — nội dung sinh máy đi qua đủ bộ cổng
  Given một lô 9 level sinh máy, trong đó một level chứa từ trong blocklist
  When chạy seed:content
  Then cổng 7 chặn cả batch
  And không hàng nào được ghi

Scenario: BR-LGK-12 — sinh level theo ô ma trận từ chối ô cấm và chừa trống sáu trường
  Given engine GT-026 cấm lĩnh vực C2 trong bản đồ tương hợp
  When chạy gen:levels --cell GT-026/4-5/C2
  Then lệnh bị từ chối với thông báo lỗi
  And khi sinh thành công cho ô hợp lệ thì title, instruction, skill_codes, what_tags, thinking_tags, theme_tag đều để trống
```

## 10. Boundaries

**Always**
- Parse ứng viên bằng `content_contract` thật, gồm cả `refine`.
- Dùng nguồn ngẫu nhiên có seed.
- In số ứng viên bị bỏ trong báo cáo và trong mô tả PR.
- Để người viết câu lệnh tiếng Việt và đặt tag ba trục.

**Ask first**
- Thêm một trục sinh thứ tư.
- Cho một engine dùng bộ sinh của engine khác.
- Nâng số ứng viên một lượt lên quá 40.

**Never**
- Lấy vật học từ vốn từ chủ đề (`BR-LGK-11`).
- Sinh lại tới khi qua cổng (`BR-SDS-05`).
- Mở kết nối database từ bộ sinh.
- Sửa ứng viên cho vừa `limits`.
- Nới bất kỳ cổng nào của [`content-seed-authoring.md`](content-seed-authoring.md) cho nội dung sinh máy.
- Để bộ sinh đặt `thinking_tags`, `what_tags`, hay `skill_codes`.
- Merge một lô sinh máy mà mô tả PR không nói ai đã đọc.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Sinh bằng tổ hợp có seed hay bằng mô hình ngôn ngữ? Tổ hợp tất định và rẻ nhưng lặp; mô hình đa dạng hơn nhưng phải qua cổng 4 và cổng 7 của [`content-seed-authoring.md`](content-seed-authoring.md), và đụng ranh giới ở [`ai-codegen-pipeline.md`](ai-codegen-pipeline.md) | Thi công bộ sinh | P4 | Backend |
| 2 | Engine nào **không** sinh máy được? `GT-013` mê cung và `GT-015` lưới không lặp cần bộ giải để bảo đảm có lời giải duy nhất; đó là bộ sinh khác hẳn về độ khó thi công | Phạm vi lô bộ sinh đầu tiên | P4 | Backend |
| 3 | Giá trị `origin` cho nội dung sinh máy đặt là gì? Trùng nợ với bộ giá trị `origin` mà [`game-level-model.md`](../05-content/game-level-model.md) sở hữu | `BR-LGK-06` | P4 | Nội dung |
| 4 | Vốn từ chủ đề ai biên soạn, và bao nhiêu danh từ mỗi chủ đề là đủ? Vốn từ hẹp làm ứng viên trùng nhau, và số đo đó chỉ lộ ra sau lượt sinh đầu | Bước 4 ở mục 6 của [`113-game-engine-depth-and-seed-diversity-plan.md`](../../tasks/113-game-engine-depth-and-seed-diversity-plan.md) | P4 | Nội dung |
