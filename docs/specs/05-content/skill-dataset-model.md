---
spec: SKILL-DATASET-MODEL
title: Bộ dữ liệu của một kỹ năng — nguồn vật duy nhất cho mọi khuôn game
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-09-03
owns:
  - Hình dạng bộ dữ liệu (`SkillDataset`) gắn với đúng một kỹ năng
  - Luật chiếu bộ dữ liệu vào `content_pack` của từng khuôn game
  - Bố cục seeder theo trục kỹ năng
  - Phép đo trung thực kỹ năng — level có dạy đúng kỹ năng nó gắn không
depends_on:
  - TAXONOMY-SERVICE
  - GAME-TEMPLATE-CONTRACT
  - CONTENT-SEED-AUTHORING
  - GAME-LEVEL-MODEL
  - ROUND-SET-MODEL
  - DETERMINISTIC-RANDOMNESS
  - CONCEPT-INTRO-MODEL
---

# Bộ dữ liệu của một kỹ năng — nguồn vật duy nhất cho mọi khuôn game

## 1. Objective

Kho bài tập là lõi sản phẩm; trò chơi chỉ là **cách trình bày** một kỹ năng. Hôm nay đường
ống đi ngược: nội dung sinh theo **khuôn game** rồi mới gắn nhãn kỹ năng, nên nhãn đúng mà
bài thì không dạy gì.

Đo trên corpus hiện tại (`packages/db/src/seed-content/corpus/`, 71 file, 5.013 level, đo
2026-09-03):

| #   | Đo                                                                | Con số                                     |
| --- | ----------------------------------------------------------------- | ------------------------------------------ |
| 1   | Level mang asset là chữ số, chữ cái, hoặc chữ viết                | **0 / 5.013**                              |
| 2   | Asset `kind: "emoji"` trong `content_pack`                        | **18.255**                                 |
| 3   | Asset `kind: "text"` trong `content_pack`                         | **0**                                      |
| 4   | Level của `C5.ALP` (bảng chữ cái)                                 | **80, không level nào có một chữ cái**     |
| 5   | Level của `C1.NREC.02` (nhận biết số 0–5)                         | **15, không level nào có một chữ số**      |
| 6   | Kỹ năng 0 level, theo quy tắc `BR-SKQ-06` — bậc thang nợ nội dung | **0 / 408** — mọi cổng hạn ngạch đang xanh |

Dòng 6 đặt cạnh dòng 1 là toàn bộ vấn đề: **kho vừa đạt 100% phủ kỹ năng và 0% trung thực
kỹ năng.** Không cổng nào bắt được, vì không cổng nào hỏi _level này có dạy đúng thứ nó gắn
không_. Hạn ngạch ở mục 6.1 của [`engine-content-depth.md`](engine-content-depth.md) đo
**độ phủ**; file này đo **độ trung thực**, và hai phép đo đó độc lập nhau.

File này đặt tầng dữ liệu còn thiếu giữa kỹ năng và màn chơi: **`SkillDataset`** — tập vật
liệu của đúng một kỹ năng, khai một lần, chiếu ra được nhiều khuôn. Kỹ năng `C1.NREC.02`
khai sáu vật `0 1 2 3 4 5`; khuôn chọn một, khuôn ghép cặp, khuôn đếm, khuôn sắp thứ tự đều
lấy từ chính sáu vật đó.

> **Ranh giới với ba spec cạnh nó.** [`game-level-model.md`](game-level-model.md) sở hữu ràng
> buộc biên tập của **một** level; [`engine-content-depth.md`](engine-content-depth.md) sở hữu
> **số lượng** level; [`level-generator-kit.md`](../01-platform/level-generator-kit.md) sở hữu
> **chi phí** dựng level. File này sở hữu thứ cả ba đều giả định mà không ai kiểm: **vật trong
> màn chơi đến từ đâu**.

## 2. Actors

| Actor                   | Làm gì                                                                              | Cấm                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Người biên soạn         | Viết `SkillDataset` cho một kỹ năng, chọn khuôn và bậc khó, đọc từng level chiếu ra | Sửa `content_pack` bằng tay để lách phép chiếu                                |
| AI agent IDE            | Soạn dataset và ma trận level theo `content_contract` thật                          | Chạy `seed:content` ngoài local · merge PR (`BR-CSA-07` — AI không phát hành) |
| Bộ chiếu (`projection`) | Dựng `content_pack` tất định từ dataset + khuôn + bậc khó                           | Ghi database · bịa vật không có trong dataset                                 |
| Người review PR         | Cổng người duy nhất (`BR-CSA-02` — cổng người là PR review)                         | Approve theo lô mà không mở dataset                                           |
| Cổng tự động            | Chạy 10 cổng, gồm hai cổng trung thực ở mục 7.6                                     | Merge tự động                                                                 |

## 3. Entry points

| Nơi                                                           | Ghi chú                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `packages/db/src/seed-content/skills/<c>/<strand>/<SKILL>.ts` | **Một file cho một kỹ năng**, gom trong thư mục strand                                           |
| `packages/db/src/seed-content/projections/<GT>.ts`            | Một bộ chiếu cho một khuôn. 34 bộ — ba khuôn nhóm G không có, xem mục 7.5                        |
| `packages/db/src/seed-content/skills/index.ts`                | Registry sinh ra từ thư mục, **có ca âm cho file không đăng ký**                                 |
| `pnpm --filter @mindkid/db seed:check`                        | 10 cổng, không chạm database                                                                     |
| `pnpm --filter @mindkid/db seed:content`                      | Ghi thật — đường ghi của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) |
| `pnpm --filter @mindkid/db check:skill-fidelity`              | Cổng 8 và 9 ở mục 7.6, chạy riêng được                                                           |

## 4. Main flow

```
1. Chọn kỹ năng          docs/taxonomy/c<n>-*.md  → mã, tuổi, khó, thinking, prerequisite
2. Viết SkillDataset     items · relations · ordering · axes            (mục 7.1)
3. Khai ma trận level    [{ template, band, difficulty, theme, rounds }] (mục 7.4)
4. Bộ chiếu dựng pack    projection(dataset, opts) → content_pack + difficulty_params
5. Parse bằng content_contract thật của khuôn; trượt thì DỪNG, không thử lại  (mục 7.3)
6. Người đọc từng level chiếu ra, sửa câu tiếng Việt, bỏ level vô nghĩa
7. PR → 10 cổng → người review → merge = phát hành
```

Bước 5 khác đường ống cũ ở đúng một chỗ và đó là chỗ quan trọng nhất: bộ sinh corpus hiện tại
**thử lại nhiều lượt cho tới khi qua cổng**, nên nó tiến hoá nội dung theo hình dạng cổng chứ
không theo kỹ năng. Bộ chiếu **cấm thử lại**: trượt contract nghĩa là dataset hoặc bậc khó
sai, và đó là việc của người.

## 5. Alternative flows

| Nhánh                                          | Hành vi                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Kỹ năng cần vật là chữ số, chữ cái, hoặc tiếng | Dataset khai `glyph`; asset đi ra `kind: "text"` (mục 7.2). Cấm — NEVER thay bằng ảnh rời từng chữ                 |
| Khuôn không có khe cho vật (nhóm G)            | Bộ chiếu không tồn tại. Level soạn tay, khai `authored: "manual"`, vẫn phải trỏ về `skill_code`                    |
| Dataset có ít vật hơn `limits` của khuôn       | Bộ chiếu **từ chối**, in kỹ năng, khuôn, số vật thiếu. Cấm độn vật ngoài dataset                                   |
| Kỹ năng cần vật thật (xúc giác, viết tay)      | Khai `surface: "worksheet"`; không sinh game level, sinh worksheet theo [`worksheet-model.md`](worksheet-model.md) |
| Hai kỹ năng dùng chung một dataset             | Cấm. Một dataset thuộc đúng một kỹ năng; muốn dùng lại thì `extends: "<skill_code>"` và khai delta                 |
| Chạy lại bộ chiếu với cùng seed                | Ra **byte giống hệt**, theo [`deterministic-randomness.md`](../01-platform/deterministic-randomness.md)            |

## 6. Business rules

| ID                                           | Rule                                                                                                         | Vì sao                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BR-SDS-01` (một dataset một kỹ năng)        | Mỗi `SkillDataset` khai đúng một `skill_code` có thật trong `skills`                                         | Dataset dùng chung cho hai kỹ năng làm không quy được kết quả chơi về kỹ năng nào — cùng lý do với `BR-GLM-01` (một mục tiêu học tập mỗi level)                                                                      |
| `BR-SDS-02` (vật phải là vật của kỹ năng)    | Mọi vật trong `content_pack` phải truy được về một `dataset.items[].id` của chính kỹ năng level đó           | Đây là phép đo còn thiếu. 5.013 level hiện tại trượt luật này: vật của chúng đến từ vốn từ chủ đề, không từ kỹ năng                                                                                                  |
| `BR-SDS-03` (khái niệm phải hiện ra)         | Dataset có `items[].glyph` thì **mọi** level của kỹ năng đó phải hiển thị ≥1 vật mang `glyph`                | 80 level `C5.ALP` không có một chữ cái nào. Dạy bảng chữ cái bằng ảnh em bé là không dạy gì                                                                                                                          |
| `BR-SDS-04` (chiếu, không viết tay)          | `content_pack` do bộ chiếu dựng từ dataset. Cấm — NEVER viết literal `content_pack` cho khuôn đã có bộ chiếu | Literal viết tay là chỗ nội dung trôi khỏi kỹ năng mà không ai thấy                                                                                                                                                  |
| `BR-SDS-05` (cấm thử lại)                    | Bộ chiếu trượt `content_contract` thì **dừng**, không tự sinh lại                                            | Vòng thử-lại-tới-khi-xanh biến cổng thành hàm mục tiêu; đó là cách corpus hiện tại thành ra như vậy. Nối tiếp `BR-LGK-03` (parse trước khi ghi, không sửa ứng viên cho vừa contract)                                 |
| `BR-SDS-06` (một kỹ năng một file)           | Seeder của một kỹ năng nằm trong đúng một file `skills/<c>/<strand>/<SKILL>.ts`                              | Trả lời được "kỹ năng này đã soạn tới đâu" bằng một lần mở file. Bố cục theo `competency × khuôn` ở mục 7.1 của [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) không trả lời được câu đó    |
| `BR-SDS-07` (registry có ca âm)              | File kỹ năng không nằm trong registry phải làm cổng **đỏ**                                                   | Thư mục sinh tự động từng chứa 430 level không file nào import, im lặng suốt 5 ngày                                                                                                                                  |
| `BR-SDS-08` (cấm nuốt lỗi nạp)               | Nạp dataset hoặc corpus gặp lỗi parse thì **ném**, không bỏ qua                                              | [`corpus/index.ts:35`](../../../packages/db/src/seed-content/corpus/index.ts) đang `catch {}`: một file JSON hỏng đóng góp 0 level và không có tín hiệu nào                                                          |
| `BR-SDS-09` (bậc khó một chiều)              | Bậc khó của một kỹ năng leo theo **một** chiều mỗi mức, khai trong `dataset.ladder`                          | Kế thừa `BR-GLM-08` (độ khó tăng một chiều mỗi lần) và `BR-RSM-05`; khai ở dataset thì mọi khuôn leo cùng một thang                                                                                                  |
| `BR-SDS-10` (chủ đề là lớp áo)               | `theme` chỉ đổi **hình minh hoạ** của vật, cấm — NEVER đổi vật                                               | Chủ đề đang là **nguồn** vật; đó là gốc của `BR-SDS-02` bị vi phạm 5.013 lần. Cùng ranh giới mà `BR-CTR-06` (giá trị nội dung học không nằm ở trục theme) đã đặt                                                     |
| `BR-SDS-11` (chỉ dẫn theo kỹ năng)           | Câu chỉ dẫn dựng từ `dataset.phrasing`, không từ bảng câu theo khuôn                                         | 182 câu phân biệt cho 5.013 level là câu của khuôn, không phải câu của bài. Không nới `BR-LGK-08` (câu tiếng Việt do người viết)                                                                                     |
| `BR-SDS-12` (cổng có ca âm)                  | `BR-SDS-02` và `BR-SDS-03` mỗi luật phải có ≥1 ca âm dựng nội dung vi phạm và khẳng định cổng đỏ             | `BR-CSA-15` (mỗi cổng có ca âm). Cổng không có ca âm là cổng in "đạt" mãi mãi                                                                                                                                        |
| `BR-SDS-13` (cổng chạy lúc gieo)             | `db:seed` phải chạy 10 cổng                                                                                  | [`cli/seed-content.ts:9`](../../../packages/db/src/seed-content/cli/seed-content.ts) khai `skipGates = true` và [`seed.ts:160`](../../../packages/db/src/seed.ts) gọi thiếu tham số đó: gieo hôm nay chạy **0 cổng** |
| `BR-SDS-14` (mã level bất biến)              | Đổi bố cục seeder cấm — NEVER đổi `game_levels.code` đã publish                                              | `BR-ID-01` (mã bất biến sau khi phát hành), mục 5 của [`id-conventions.md`](../00-foundation/id-conventions.md). Mã mã hoá lịch sử, không mã hoá phân loại                                                           |
| `BR-SDS-15` (mục tiêu học tập phải ghi được) | `learning_objective_codes` của một level phải ghi xuống database                                             | Hiện chỉ được cổng kiểm rồi vứt; không bảng nào giữ, nên lộ trình học không truy được về mục tiêu                                                                                                                    |
| `BR-STA-01` (tương thích theo thinking & age) | Khuôn hợp lệ khi `thinking_processes ∩ template.thinking ≠ ∅` và tuổi không thuộc `banned_age_bands`         | Tránh sinh bài chơi không phù hợp lứa tuổi hoặc sai mục tiêu tư duy                                                                                                                   |
| `BR-STA-02` (sàn khuôn cho kỹ năng)          | Mỗi kỹ năng C1 có ≥4 khuôn hợp lệ, C2–C6 có ≥2 khuôn hợp lệ                                                  | Đảm bảo độ đa dạng hình thức chơi theo `BR-SKQ-03`                                                                                                                                     |
| `BR-ALC-01` (trần level mỗi cặp kỹ năng-khuôn) | Một cặp (kỹ năng, khuôn) tối đa 5 level                                                                      | Đảm bảo không dồn level vào một khuôn duy nhất (`BR-SKQ-04`)                                                                                                                          |
| `BR-ALC-02` (phân bổ trải rộng chủ đề)        | Mỗi kỹ năng phân bổ level trải trên ≥2 chủ đề                                                                | Đảm bảo độ phong phú ngữ cảnh cho trẻ (`BR-ECD-05`)                                                                                                                                    |

## 7. Data

**Đọc:** `docs/taxonomy/*.md` · `skills` · `strands` · `game_templates` · từ vựng theme ở
[`content-theme-registry.md`](content-theme-registry.md).
**Ghi:** `skill_datasets` · `game_levels` · `game_level_rounds` · `content_skill_map` ·
`content_objective_map` · `content_tag_map`. Cột và bảng mới ở mục 7.4 của
[`schema-content-taxonomy.md`](../01-platform/schema-content-taxonomy.md).

### 7.1 `SkillDataset` — hình dạng

```ts
interface SkillDataset {
  readonly skill_code: string; // "C1.NREC.02" — BR-SDS-01
  readonly concept_label: string; // "số 0 đến 5"
  readonly surface: "game" | "worksheet";
  readonly items: readonly DatasetItem[]; // 2..20
  readonly relations?: readonly DatasetRelation[];
  readonly ordering?: readonly string[]; // thứ tự chuẩn, cho khuôn sắp xếp
  readonly axes?: Readonly<Record<string, readonly string[]>>; // color/shape/size…
  readonly ladder: readonly DifficultyRung[]; // 1..5, mỗi mức một chiều — BR-SDS-09
  readonly phrasing: SkillPhrasing; // câu của bài — BR-SDS-11
  readonly extends?: string; // kế thừa dataset kỹ năng tiên quyết
}

interface DatasetItem {
  readonly id: string; // "n5"
  readonly label: string; // "năm"        — bắt buộc, nhóm F cần
  readonly glyph?: string; // "5"          — BR-SDS-03
  readonly image?: Asset; // emoji | image — lớp áo theo theme
  readonly value?: number; // 5            — nhóm C
  readonly category?: Readonly<Record<string, string>>; // nhóm B
  readonly audio_path?: string; // nhóm H
  readonly contrast_group?: string; // nhóm H
}
```

Ví dụ `C1.NREC.02`: `items` là sáu vật `n0..n5`, mỗi vật `glyph: "0".."5"`, `value: 0..5`,
`label: "không".."năm"`. Cùng sáu vật đó cấp cho `GT-001` (chọn ký hiệu), `GT-005` (ghép số
với lượng), `GT-012` (nhìn chớp rồi nhớ), `GT-006` (sắp thứ tự), `GT-007` (tách gộp).

### 7.2 Asset chữ — nhánh đã có, chỗ thiếu là nội dung

[`shared-fields.ts:16`](../../../packages/game-engine/src/contracts/shared-fields.ts) khai
`assetSchema()` với **ba** nhánh, `text` là nhánh thứ ba:

```ts
export const assetSchema = () =>
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
    z.object({ kind: z.literal("image"), path: z.string() }),
    z.object({ kind: z.literal("text"), text: z.string().min(1) }),
  ]);
```

Lớp vẽ cũng đã có: `RenderAsset` khai nhánh `{ kind: "text"; text: string }` và
`drawAssetInSlot` xử lý nhánh đó. Nghĩa là **`glyph` đi ra được ngay hôm nay** — không có
chặn cứng nào phải mở trước, khác với điều
[`205-open-taxonomy-level-seeding-plan.md`](../../tasks/205-open-taxonomy-level-seeding-plan.md)
mục 2.1 ước tính.

Hai chỗ còn lệch, và cả hai là việc phải làm:

1. **Nội dung.** 0 trên 18.255 asset của corpus dùng nhánh `text`. Nhánh có mà không ai dùng.
2. **Spec.** Ví dụ `content_contract` của `GT-004` ở mục 7.3 của
   [`game-template-contract.md`](../01-platform/game-template-contract.md) vẫn in union hai
   nhánh. Spec đang đi sau code — sửa trong cùng PR với file này.

### 7.3 Bộ chiếu

```ts
interface Projection<T extends TemplateCode> {
  readonly template: T;
  readonly requires: {
    min_items: number;
    max_items: number;
    needs?: ItemFacet[];
  };
  project(ds: SkillDataset, opts: ProjectOptions): ProjectedPack<T>;
}
type ItemFacet = "glyph" | "value" | "category" | "audio" | "contrast_group";
```

`ProjectOptions` mang `band`, `difficulty`, `theme`, `rng` (seed tất định), `round_index`.
Bộ chiếu trả `{ content_pack, difficulty_params }` và **không** bắt lỗi: trượt là ném
(`BR-SDS-05`).

### 7.4 Ma trận level của một kỹ năng

```ts
export const C1_NREC_02: SkillSeed = {
  dataset: {
    /* mục 7.1 */
  },
  levels: [
    {
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-012",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 4,
    },
    {
      template: "GT-006",
      band: "4-5",
      difficulty: 3,
      theme: "market",
      rounds: 4,
    },
  ],
};
```

Hạn ngạch **không đổi**: `BR-SKQ-02` (C1 ≥20 level, C2–C6 ≥10), `BR-SKQ-03` (C1 ≥4 khuôn,
C2–C6 ≥2), `BR-SKQ-04` (trần 5 level một cặp kỹ năng-khuôn) ở mục 6.1 của
[`engine-content-depth.md`](engine-content-depth.md) vẫn là phép đo độ phủ. Ma trận tương
thích kỹ năng × khuôn đo ngày 2026-09-03: trung bình **12,27 khuôn hợp lệ cho một kỹ năng**,
trung vị 11, và **13 kỹ năng không hợp khuôn nào**.

### 7.5 Tám nhóm khuôn theo hình dạng vật tiêu thụ

Đọc từ `content_contract` thật của cả 37 khuôn.

| Nhóm                                           | Khuôn                                                                                                       | Vật cần                               | Không suy được từ vật                                                                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** — tập phẳng, đúng/sai là phép gán        | `GT-001` `GT-002` `GT-005` `GT-008` `GT-012` `GT-018` `GT-020` `GT-021` `GT-022` `GT-028` `GT-029` `GT-036` | `id` `label` `image` hoặc `glyph`     | `GT-002` `target_criterion`; `GT-012` `arrangement`; `GT-018` `audio_prompt`; `GT-021` `axis` và `asset_ref` dạng chuỗi thô                          |
| **B** — vật cần trục phân loại                 | `GT-003` `GT-004` `GT-027`                                                                                  | thêm `category`                       | `GT-004` nhãn nhóm; `GT-027` cần **ba** trục `color` `shape` `size`                                                                                  |
| **C** — vật cần độ lớn số                      | `GT-007` `GT-009` `GT-014` `GT-030` `GT-031`                                                                | thêm `value:number`                   | `GT-009` `clues[].predicate`; `GT-014` `goal`; `GT-030` hai vai (vật đo, đơn vị); `GT-031` khả thi subset-sum                                        |
| **D** — bảng ký hiệu 2–4 vật, lưới tra theo id | `GT-011` `GT-015` `GT-033` `GT-034`                                                                         | tập nhỏ, tương phản cao               | hình học lưới; `GT-034` cần `freq:number` không suy được từ emoji                                                                                    |
| **E** — vật cộng toạ độ 2-D soạn theo level    | `GT-022` `GT-023` `GT-024` `GT-025` `GT-035`                                                                | `Base`                                | mọi toạ độ trong khung 960×540; `GT-025` cần bảng `differences`                                                                                      |
| **F** — đúng hai kích thích và lịch trial      | `GT-026`                                                                                                    | `label` **bắt buộc**                  | `trials[]`                                                                                                                                           |
| **G** — không có khe cho vật                   | `GT-013` `GT-016` `GT-032`                                                                                  | —                                     | `GT-013` không có trường `asset` nào; `GT-016` là số học đồng hồ; `GT-032` mô tả cốc bằng `shape` và `color`, không có `asset` dù khai `asset_kinds` |
| **H** — mô hình asset riêng                    | `GT-000`                                                                                                    | thêm `contrast_group` và `audio_path` | `steps[]` là kịch bản bốn hành động                                                                                                                  |

Bộ chiếu viết cho A–F và H: **34 khuôn**. Nhóm G soạn tay, vẫn gắn `skill_code`.

### 7.6 Hai cổng trung thực mới

| #   | Cổng                                | Kiểm gì                                                                                                  | Ca âm bắt buộc                                    |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 8   | **Nguồn vật** (`BR-SDS-02`)         | Mọi `item_id` và asset trong `content_pack` truy được về `dataset.items[].id` của chính kỹ năng level đó | Một level lấy emoji từ vốn từ chủ đề thì cổng đỏ  |
| 9   | **Khái niệm hiện ra** (`BR-SDS-03`) | Dataset có `glyph` thì mọi level của kỹ năng hiển thị ≥1 vật mang `glyph`                                | Một level `C5.ALP` chỉ có emoji người thì cổng đỏ |

Cổng 0–7 giữ nguyên, định nghĩa ở mục 7.3 của
[`content-seed-authoring.md`](../01-platform/content-seed-authoring.md). Cả 10 cổng chạy
trong `db:seed` (`BR-SDS-13`).

### 7.7 Nợ schema đi kèm

Ba khoản dưới đây cùng phạm vi vì lộ trình học đọc qua đúng đường này. Cột và bảng do mục 7
của [`schema-content-taxonomy.md`](../01-platform/schema-content-taxonomy.md) định nghĩa:

- `content_skill_map.entity_type` lệch chuỗi: seeder ghi `'game_level'`, bốn nơi đọc
  `'level'` — [`dashboard.get.ts:123`](../../../apps/web/server/api/managers/dashboard.get.ts),
  [`skills/[code].get.ts:101`](../../../apps/web/server/api/managers/taxonomy/skills/%5Bcode%5D.get.ts),
  [`rollup.ts:155`](../../../packages/db/src/services/rollup.ts),
  [`advanced-report.ts:803`](../../../packages/db/src/services/advanced-report.ts). Bốn truy
  vấn này đang trả 0 và không báo lỗi.
- Bốn level `GT-000` mang mã ba đoạn (`GL-C1-INTRO-0001` và ba mã cùng dạng) không thoả
  `CHECK` của `game_levels.code` ở mục 7 của
  [`id-conventions.md`](../00-foundation/id-conventions.md) và trượt `content_contract`.
- `BR-STA-*` (ma trận tương thích kỹ năng-khuôn) và `BR-ALC-*` (phân bổ level) được mã dẫn
  trong code nhưng **không spec nào định nghĩa**, và không có trong bản đồ prefix ở mục 7.1
  của [`business-rules.md`](../00-foundation/business-rules.md). Xem câu hỏi 4 ở mục 11.

## 8. API contract

Không sở hữu route. Giao diện là CLI:

```ts
interface SkillSeedResult {
  skill_code: string;
  dataset_version: number;
  levels_projected: number;
  levels_rejected: { template: string; reason: string }[]; // BR-SDS-05: không thử lại
  gate_failures: {
    gate: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    code: string;
    file: string;
    detail: string;
  }[];
}
```

Thoát khác 0 khi `gate_failures.length > 0` hoặc `levels_rejected.length > 0`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SDS-02 — vật ngoài dataset bị chặn
  Given kỹ năng C1.NREC.02 khai dataset gồm sáu vật n0..n5
  And một level của kỹ năng đó mang một asset emoji không thuộc dataset
  When chạy seed:check
  Then cổng 8 đỏ
  And thông báo nêu mã level và asset không truy được

Scenario: BR-SDS-03 — kỹ năng chữ cái không có chữ cái bị chặn
  Given dataset C5.ALP.01 khai items có glyph "a" tới "e"
  And một level của kỹ năng đó chỉ chứa asset kind emoji
  When chạy seed:check
  Then cổng 9 đỏ

Scenario: BR-SDS-05 — bộ chiếu không thử lại
  Given dataset chỉ có 2 vật
  And khuôn GT-004 đòi tối thiểu 4 item
  When chạy bộ chiếu
  Then nó ném, nêu kỹ năng, khuôn, số vật thiếu
  And không level nào được sinh cho cặp đó

Scenario: BR-SDS-07 — file kỹ năng không đăng ký làm cổng đỏ
  Given một file skills/c1/nrec/C1.NREC.99.ts tồn tại
  And registry không chứa nó
  When chạy seed:check
  Then cổng đỏ, nêu đường dẫn file

Scenario: BR-SDS-08 — corpus hỏng thì ném
  Given một file dataset JSON không parse được
  When nạp registry
  Then ném kèm đường dẫn
  And cấm — NEVER trả về danh sách rỗng

Scenario: BR-SDS-10 — đổi theme không đổi vật
  Given cùng dataset C1.NREC.02 chiếu vào GT-001 với theme farm và theme school
  When so hai content_pack
  Then tập item_id trùng khít
  And chỉ trường ảnh minh hoạ khác nhau

Scenario: BR-SDS-13 — db:seed chạy cổng
  Given một level vi phạm cổng 8
  When chạy pnpm db:seed
  Then lệnh thoát khác 0
  And không hàng nào được ghi

Scenario: BR-SDS-14 — mã đã publish không đổi
  Given level GL-C1-NREC-TAP-0001 đang published
  When bố cục seeder chuyển sang trục kỹ năng
  Then mã đó vẫn tồn tại và không đổi
```

## 10. Boundaries

**Always**

- Vật của level đến từ dataset của chính kỹ năng đó.
- Một kỹ năng một file; registry sinh từ thư mục và có ca âm.
- Bộ chiếu tất định: cùng seed ra cùng byte.
- Cổng mới đi kèm ca âm trong cùng PR.

**Ask first**

- Thêm nhóm khuôn thứ chín.
- Nới trần 5 level cho một cặp kỹ năng-khuôn (`BR-SKQ-04`).
- Đưa `GT-013`, `GT-016`, `GT-032` vào diện có bộ chiếu.

**Never**

- Sinh lại cho tới khi qua cổng (`BR-SDS-05`).
- Lấy vật từ vốn từ chủ đề làm nội dung kỹ năng (`BR-SDS-10`).
- Viết literal `content_pack` cho khuôn đã có bộ chiếu (`BR-SDS-04`).
- Đổi mã level đã publish (`BR-SDS-14`).
- Nuốt lỗi nạp dataset (`BR-SDS-08`).

## 11. Open questions

| #   | Câu hỏi                                                                                                                                            | Chặn gì                                                                                | Chặn phase | Chủ         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------- | ----------- |
| 1   | 5.013 level corpus hiện tại: bỏ hết và soạn lại theo dataset, hay giữ những level thật sự trung thực? Đo sơ bộ cho thấy phần lớn trượt `BR-SDS-02` | Khối lượng lô soạn lại                                                                 | P1         | người quyết |
| 2   | Audio tiếng Việt thu người thật hay tổng hợp? Kho hiện **0 file**, mà `C5` và `GT-018` là bài nghe                                                 | Toàn trục `C5`                                                                         | P1         | người quyết |
| 3   | 13 kỹ năng không hợp khuôn nào: soạn tay, mở rộng ma trận tương thích, hay chuyển sang `surface: "worksheet"`?                                     | Phủ 408 trên 408 kỹ năng                                                               | P2         | người quyết |
| 4   | `BR-STA-*` và `BR-ALC-*` chưa có spec sở hữu — gộp vào file này hay tách spec riêng?                                                               | Đăng ký prefix ở mục 7.1 của [`business-rules.md`](../00-foundation/business-rules.md) | P1         | **Đã chốt (2026-09-03)**: Gộp vào spec này (§6), đã đăng ký prefix |
