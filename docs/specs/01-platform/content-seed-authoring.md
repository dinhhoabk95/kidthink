---
spec: CONTENT-SEED-AUTHORING
title: Biên soạn nội dung nền bằng seeder trong repo
area: platform
status: draft
mvp: true
phase: P1
reviewed: 2026-08-05
owns:
  - Ranh giới giữa AI agent IDE hỗ trợ soạn và người phát hành
  - Vị trí, hình dạng, và quy ước đặt tên seeder nội dung
  - Tám cổng kiểm chạy trong cổng tự động trước khi merge
  - Đường ghi thẳng `published` từ seed và ràng buộc idempotency
  - `content_seed_batches` và cột provenance của nội dung nền
depends_on:
  - CONTENT-LIFECYCLE
  - CONTENT-VERSIONING
  - GAME-TEMPLATE-CONTRACT
  - TAXONOMY-SERVICE
  - EMOJI-REGISTRY
  - AI-CODEGEN-PIPELINE
---

# Biên soạn nội dung nền bằng seeder trong repo

## 1. Objective

MVP cần **≥690 learning objective, ≥120 game level, ≥60 lesson**. Đó là khối lượng biên
soạn lớn nhất của dự án và nó không rút ngắn được bằng cách thêm dev.

Cách giải: nội dung nền được viết thành **seeder file trong repo**, người biên soạn dùng
**AI agent IDE** (Claude Code / Cursor) làm trợ lý soạn thảo, và **PR review là cổng người**.
Seed ghi thẳng `published`. Từ đó trở đi admin quản lý nội dung trong studio bằng version
mới.

Cấm: **không có LLM nào chạy trong hệ thống.** Không có hàng đợi duyệt nội dung do máy sinh,
không có trần chi phí token trong production, không có provenance theo model.

### 1.1 Ranh giới cứng

```
người + AI agent IDE ──viết──► seeder file trong repo (TS có kiểu)
                                        │
                       8 cổng tự động ─┤  đỏ thì không merge được
                                        ▼
                          PR có người review  ◄── ĐÂY là cổng người
                                        │
                              pnpm seed:content
                                        ▼
                     hàng published, content_version = 1
                                        │
                     admin quản lý tiếp trong studio (version mới)
```

Rule đúng:

> Cấm — **NEVER để AI phát hành nội dung cốt lõi.**
> Được phép: AI **soạn thảo file** trong repo. Chỉ **người** merge, và merge chính là phát hành.

### 1.2 Vì sao là seeder chứ không phải pipeline sinh tự động

| | Seeder trong repo | Pipeline LLM sinh `draft` |
|---|---|---|
| Cổng người | PR review — đọc diff, `git blame`, revert một lệnh | Hàng đợi admin — không có ba thứ đó |
| Tái lập môi trường | Dựng từ số 0 ra **đúng** thư viện nội dung đó | Không bảo đảm — đầu ra LLM không xác định |
| Sai schema bắt ở đâu | Lúc `tsc`, trước khi chạy | Lúc runtime, sau khi tốn tiền gọi model |
| Chi phí vận hành | 0 — không gọi model trong production | Trần chi phí, ngân sách tháng, degrade model |
| Nội dung là gì | **Tài sản của repo**, version cùng code | Dữ liệu vận hành, không tái tạo được |

Nội dung nền là tài sản, không phải dữ liệu vận hành. Nó phải nằm cùng chỗ với thứ khác
cũng là tài sản và cũng cần review: code.

## 2. Actors

| Actor | Làm gì | Cấm |
|---|---|---|
| **Người biên soạn** | Viết seeder, chạy cổng local, mở PR | Merge PR của chính mình khi có ≥2 manager |
| **AI agent IDE** | Soạn thảo file seeder theo `content_contract`, tra taxonomy · emoji registry · spec | Chạy `seed:content` lên môi trường ≠ local · merge PR · chạm `skills`/`strands` |
| **Người review PR** | Đọc **từng bản** trong diff, approve = phát hành | Approve theo lô mà không mở nội dung |
| **cổng tự động** | Chạy 8 cổng §7.3 + `seed:content --dry-run` trên DB tạm | Merge tự động |
| **`pnpm seed:content`** | INSERT hàng `published` + `content_review_log` + batch | `UPDATE` hàng đã có |
| **Manager trong studio** | Từ đây quản lý nội dung: tạo version mới, archive, rollback | Sửa tại chỗ hàng đã `published` |

## 3. Entry points

| Nơi | Ghi chú |
|---|---|
| `packages/db/src/seed-content/c1..c6/gt-001..gt-006.ts` | Game level, chia theo **năng lực đã chốt C1–C6** × template |
| `packages/db/src/seed-content/learning-objectives/c1..c6.ts` | LO theo competency |
| `packages/db/src/seed-content/lessons/*.ts` · `curricula/*.ts` | P3 |
| `pnpm seed:check` | Chạy 8 cổng, không chạm DB |
| `pnpm seed:content --dry-run` | DB tạm → seed → checklist publish → rollback |
| `pnpm seed:content --batch=SEED-*` | Ghi thật |
| `pnpm seed:report` | Phủ theo competency · skill · template; chỉ ra khoảng trống |
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Nơi admin quản lý **sau khi** seed |

Cấm — **NEVER trong đường request.** Seed là lệnh vận hành, chạy lúc dựng môi trường hoặc lúc
deploy một lô nội dung đã merge.

## 4. Main flow

```
1. Chọn khoảng trống cần lấp:  pnpm seed:report  → skill nào chưa có level published
2. Người biên soạn + AI agent IDE soạn seeder file
       ├── kiểu content_pack suy ra từ content_contract của template (§7.2)
       ├── emoji chỉ lấy từ emoji_registry
       └── skill_codes / learning_objective_codes là FK có thật
3. pnpm seed:check                 → 8 cổng, chạy local, sửa cho tới khi xanh
4. Mở PR
5. Cổng tự động chạy 8 cổng + seed:content --dry-run trên DB tạm
6. ► NGƯỜI REVIEW ĐỌC TỪNG BẢN  ← cổng người
7. Merge  = quyết định phát hành
8. pnpm seed:content --batch=…     → INSERT published + content_review_log + batch row
9. Từ đây: admin quản lý trong studio; sửa = version mới, cấm UPDATE tại chỗ
```

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Seeder đổi một `code` đã seed và đang `published` | Seed **từ chối**. Hai đường hợp lệ: khai `content_version` mới trong seeder → INSERT bản mới + archive bản cũ trong một transaction; hoặc sửa trong studio |
| Chạy lại `seed:content` không đổi gì | **No-op.** Idempotent theo `(code, content_version)` |
| Một cổng tự động đỏ | PR không merge được qua review. Cờ bỏ qua **ở máy cá nhân** (`git commit --no-verify`) tồn tại — xem [`repo-bootstrap.md`](../00-foundation/repo-bootstrap.md) §11 Q12; PR vẫn cần review người, không tự merge được |
| `code` trùng giữa hai seeder file | Cổng 0 bắt lúc build, fail **trước khi** chạm DB |
| Nội dung seeded phát hiện sai sau khi publish | Studio archive/rollback theo [`publish-and-version.md`](../06-admin/publish-and-version.md); **và** sửa seeder trong cùng PR để môi trường dựng mới không tái tạo lỗi |
| Môi trường đã có bản studio cùng `code` | Seed từ chối, báo xung đột. **Studio thắng** — seed không đè nội dung người soạn |
| Seed chạy giữa chừng thì lỗi | Rollback cả batch. Cấm seed một phần |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CSA-01` (chỉ INSERT) | Seed **chỉ INSERT**. Cấm — **NEVER UPDATE** hàng đã có. Sửa = version mới | [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) `BR-CLC-01` (bản published bất biến) — bản đã published bất biến, kể cả với seeder |
| `BR-CSA-02` (cổng người là PR) | Seed ghi thẳng `published`. Cổng người là **PR review**, không phải hàng đợi duyệt | Cổng người ở đâu cũng được miễn có thật và ghi lại được. PR ghi lại tốt hơn: diff, blame, revert |
| `BR-CSA-03` (bằng chứng phát hành) | Mỗi hàng seed ghi `content_review_log`: `from_status = null` → `published`, `actor_manager_id` = người approve PR, `checklist_snapshot` = kết quả 8 cổng | [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) `BR-CLC-06`/`BR-CLC-10` — vẫn phải trả lời được ai phát hành cái gì, lúc nào |
| `BR-CSA-04` (checklist publish) | Seed chạy **đủ checklist publish** ([`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §7.3) ở tầng service trước khi INSERT. Trượt một mục → rollback cả batch | Seeder đi vòng qua route studio. Checklist chỉ nằm ở route thì seed là lỗ hổng |
| `BR-CSA-05` (một transaction) | Một batch = **một transaction**. Cấm seed một phần | Nửa lô nội dung published là một thư viện không giải thích được |
| `BR-CSA-06` (idempotent) | Seed **idempotent**: chạy lại không đổi số hàng, không đổi nội dung | Seed chạy mỗi lần dựng môi trường. Không idempotent thì nó là migration giả |
| `BR-CSA-07` (AI không phát hành) | AI agent IDE cấm — **NEVER chạy `seed:content`** lên môi trường khác local, cấm — **NEVER merge PR** | Ranh giới cứng: AI soạn file, người phát hành |
| `BR-CSA-08` (AI không sinh taxonomy) | AI cấm — **NEVER sinh `skills` hay `strands`** | Taxonomy là Lớp 1, do người thiết kế. Sai một skill là sai mọi thứ treo lên nó |
| `BR-CSA-09` (LO soạn bằng seeder) | `learning_objectives` soạn bằng seeder như game level, chịu đúng 8 cổng và đúng PR review | LO là Tầng 4 taxonomy nhưng là **mô tả hành vi** — soạn được, miễn có người đọc |
| `BR-CSA-10` (code bất biến) | `code` trong seeder **bất biến** sau khi merge | [`id-conventions.md`](../00-foundation/id-conventions.md) — mã published là neo của mọi telemetry và báo cáo |
| `BR-CSA-11` (nguồn sự thật) | Seeder file là **nguồn sự thật** của lô nền. `pnpm seed:check --against-db` báo lệch giữa repo và DB | Sửa DB tay rồi quên seeder = môi trường tiếp theo mất bản sửa |
| `BR-CSA-12` (TS có kiểu) | `content_pack` viết bằng **TS có kiểu**, kiểu lấy từ `content_contract` của template. Cấm JSON trần | Sai schema bắt lúc `tsc` rẻ hơn bắt lúc cổng tự động, rẻ hơn nhiều bắt lúc trẻ đang chơi |
| `BR-CSA-13` (chỉ emoji registry) | Emoji **chỉ** lấy từ `emoji_registry`. Cấm — NEVER emoji ngoài registry | [`emoji-registry.md`](emoji-registry.md) `BR-EMJ-*` — ref không resolve được là ô trống trên màn hình trẻ |
| `BR-CSA-14` (provenance) | Mọi hàng seed mang `seed_batch_id` + `origin` + `authored_in = 'repo_seed'` | Khi phát hiện một lô sai, phải truy được lô nào cùng PR |

## 7. Data

### 7.1 Bố cục — theo năng lực đã chốt

```
packages/db/src/seed-content/
├── c1/  gt-001.ts  gt-003.ts  gt-005.ts  …     Tư duy toán học
├── c2/  …
├── c3/  …
├── c4/  …
├── c5/  …
├── c6/  …                                       Chức năng điều hành
├── learning-objectives/  c1.ts … c6.ts
├── lessons/       (P3)
└── curricula/     (P3)
```

Chia theo **competency × template**, không theo skill: một file skill sinh ra 230 file
nhỏ không ai mở, còn một file competency thì soạn được trọn một mảng năng lực trong một
lượt. Danh sách competency: [`taxonomy-service.md`](taxonomy-service.md) §7.

### 7.2 Hình dạng một seeder

```ts
export const seed: ContentSeed<"GT-004"> = {
  batch: "SEED-C4-GT004-01",
  competency: "C4",
  items: [{
    code: "G-04021",                 // bất biến sau merge
    content_version: 1,
    title_vi: "Xếp quả vào rổ đúng màu",
    instruction_vi: "Bé xếp mỗi quả vào rổ cùng màu nhé!",
    skill_codes: ["C4.CLS.02"],
    learning_objective_codes: ["LO-C4.CLS.02-01"],
    age_min: 4, age_max: 5, difficulty: 2,
    access_tier: "premium",          // NOT NULL, không default
    theme_id: "farm",
    thumbnail_emoji: "EMJ-apple",
    content_pack: { /* kiểu = z.infer<typeof SortGroupsContent> */ },
    difficulty_params: { /* kiểu = z.infer<typeof SortGroupsDifficulty> */ },
  }],
};
```

`ContentSeed<"GT-004">` lấy kiểu `content_pack` **từ chính** `content_contract` của template
([`game-template-contract.md`](game-template-contract.md) §7.3). Thiếu field, thừa field, sai kiểu → lỗi `tsc`, không phải
lỗi runtime. Đây là lý do seeder là TS chứ không phải JSON hay YAML.

### 7.3 Tám cổng — chạy trong cổng tự động, chặn merge

Chạy tuần tự. Trượt cổng nào thì dừng ở đó, in `file:line` và **PR không merge được**.

| # | Cổng | Kiểm gì |
|---|---|---|
| 0 | **Định danh** | `code` duy nhất toàn corpus seeder · đúng format [`id-conventions.md`](../00-foundation/id-conventions.md) · cấm đụng `code` đã seed ở batch trước với `content_version` khác |
| 1 | **Schema** | `content_pack` parse được bằng `content_contract` thật (Zod, còn đủ `refine`) · `difficulty_params` parse được bằng `difficulty_contract` |
| 2 | **Cấu trúc** | ≥1 đáp án đúng · cấm prompt rỗng · số item trong `limits` của template · số distractor hợp lệ · cấm đáp án trùng nhau |
| 3 | **Asset** | Mọi emoji ref tồn tại trong `emoji_registry` · mọi `image_path` resolve được |
| 4 | **Ngôn ngữ** | Câu ≤ 12 từ · từ vựng trong tầm 3–6 tuổi · cấm từ cấm §7.5 · cấm lỗi dấu |
| 5 | **Sư phạm** | `skill_codes` · `learning_objective_codes` là FK có thật · `age_min ≤ age_max ∈ [3,6]` · `difficulty ∈ [1,5]` · khớp band tuổi · mechanic hợp band (`BR-GTC-05`) |
| 6 | **Trùng lặp** | Cấm gần trùng bản đã `published` — chuẩn hoá `content_pack` rồi so |
| 7 | **An toàn** | Cấm bạo lực, đáng sợ, phân biệt, không hợp tuổi · cấm thương hiệu, cấm nhân vật có bản quyền. Cổng này **không** thay thế mắt người ở bước 6 §4 |

Cổng 0–3 và 5 là **xác định**. Cổng 4, 6, 7 là **heuristic** — chúng lọc bớt, không kết
luận. Đó là lý do bước review của người vẫn bắt buộc.

### 7.4 `content_seed_batches` và cột provenance

| Field | Ghi chú |
|---|---|
| `batch_code` | `SEED-*`, bất biến |
| `kind` | `game_level` \| `learning_objective` \| `lesson` \| `curriculum` |
| `git_sha` | Commit chứa seeder file |
| `pr_url` | |
| `approved_by_manager_id` | Người approve PR — **người phát hành** |
| `rows_inserted` | |
| `gate_results` | JSONB — kết quả 8 cổng lúc cổng tự động |
| `seeded_at` `seeded_by` | |

Trên hàng content: `origin ∈ {human, ai_assisted}` · `authored_in ∈ {repo_seed, studio}` ·
`seed_batch_id` nullable.

Hai trục tách bạch vì chúng trả lời hai câu khác nhau: `origin` = *soạn thảo có AI hỗ trợ
không*; `authored_in` = *hàng này vào DB bằng đường nào*. `origin` **không đổi** sau khi
người sửa.

Không còn `ai_generated`, không còn `content_generation_runs` — không còn thứ nào sinh
nội dung tự chủ để mà đặt tên.

### 7.5 Từ cấm trong nội dung cho trẻ

Bạo lực · sợ hãi (ma, quái vật đáng sợ) · chết chóc · bệnh tật · phân biệt giới/vùng miền ·
thương hiệu thương mại · nhân vật có bản quyền · nội dung tôn giáo · chính trị ·
so sánh hơn kém giữa trẻ · từ mang nghĩa trừng phạt ("sai rồi", "dốt", "thua").

Danh sách đầy đủ: `packages/moderation/src/child-content-blocklist.ts`, seed Lớp 1. Cổng 7
dùng đúng danh sách này.

## 8. API contract

Không có route. Giao diện là CLI + cổng tự động. Không mã lỗi HTTP — CLI thoát khác 0.

```ts
interface SeedOptions {
  batch?: string;           // mặc định: mọi batch chưa seed
  dry_run?: boolean;        // DB tạm, seed, checklist, rollback
  against_db?: boolean;     // so repo ↔ DB, chỉ báo lệch
}

interface SeedResult {
  batch_code: string;
  gate_failures: { gate: 0|1|2|3|4|5|6|7; code: string; file: string; detail: string }[];
  rows_inserted: number;
  rows_skipped_idempotent: number;
  drift: { code: string; field: string }[];   // chỉ với --against-db
}
```

Cổng tự động fail khi `gate_failures.length > 0` hoặc `drift.length > 0`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CSA-01 — seed không UPDATE bản đã published
  Given một game level code G-04021 version 1 đang published
  And seeder sửa content_pack của G-04021 mà giữ nguyên content_version
  When chạy pnpm seed:content
  Then lệnh thoát khác 0
  And nội dung trong DB không đổi
  And thông báo chỉ ra phải khai content_version mới

Scenario: BR-CSA-01 — version mới thì INSERT và archive bản cũ
  Given G-04021 version 1 đang published
  And seeder khai G-04021 content_version 2
  When chạy pnpm seed:content
  Then version 2 có status published
  And version 1 có status archived
  And cả hai đổi trong một transaction

Scenario: BR-CSA-02 — seed ghi thẳng published
  Given một batch 30 game level qua đủ 8 cổng và đã merge
  When chạy pnpm seed:content
  Then cả 30 hàng có status = published
  And không hàng nào đi qua trạng thái draft hay in_review

Scenario: BR-CSA-03 — mỗi hàng seed có bằng chứng phát hành
  Given một batch vừa seed xong
  When đọc content_review_log của một hàng bất kỳ trong batch
  Then có đúng một hàng from_status null to_status published
  And actor_manager_id trỏ tới người approve PR
  And checklist_snapshot chứa kết quả đủ 8 cổng

Scenario: BR-CSA-04 — trượt checklist publish thì rollback cả batch
  Given một batch 30 bản, trong đó một bản thiếu learning objective
  When chạy pnpm seed:content
  Then transaction bị rollback
  And số hàng trong bảng game_levels không đổi
  And thông báo nêu code của bản thiếu

Scenario: BR-CSA-06 — chạy lại là no-op
  Given một batch đã seed xong
  When chạy lại pnpm seed:content với cùng batch
  Then rows_inserted bằng 0
  And rows_skipped_idempotent bằng số bản trong batch
  And không hàng nào bị UPDATE

Scenario: cổng 0 — code trùng giữa hai seeder file
  Given hai file seeder cùng khai code G-04021
  When chạy pnpm seed:check
  Then cổng 0 fail
  And thông báo nêu cả hai đường dẫn file
  And không kết nối DB nào được mở

Scenario: BR-CSA-12 — sai content_pack bắt được lúc tsc
  Given một seeder GT-004 thiếu field groups trong content_pack
  When chạy pnpm typecheck
  Then biên dịch fail
  And lỗi trỏ đúng file và dòng của item sai

Scenario: BR-CSA-13 — emoji ngoài registry bị chặn
  Given một seeder dùng emoji không có trong emoji_registry
  When chạy pnpm seed:check
  Then cổng 3 fail
  And thông báo nêu rõ ref nào không hợp lệ

Scenario: cổng 5 — mechanic không phù hợp tuổi bị chặn
  Given một seeder dùng GT-006 với age_min = 3
  When chạy pnpm seed:check
  Then cổng 5 fail
  And lý do nêu ràng buộc band tuổi của template

Scenario: BR-CSA-07 — AI agent không phát hành được
  When kiểm cấu hình quyền của AI agent IDE
  Then seed:content chỉ chạy được với DATABASE_URL trỏ localhost
  And không có đường nào cho agent approve hay merge PR

Scenario: BR-CSA-08 — seeder không tạo được skill
  Given một seeder cố khai một skill mới
  When chạy pnpm seed:check
  Then cổng 5 fail với thông báo taxonomy là Lớp 1

Scenario: BR-CSA-11 — lệch giữa repo và DB bị bắt
  Given một hàng trong DB bị sửa tay khác với seeder
  When chạy pnpm seed:check --against-db
  Then drift liệt kê code và field lệch
  And cổng tự động fail

Scenario: studio thắng seed khi trùng code
  Given một game level cùng code do manager tạo trong studio
  When chạy pnpm seed:content
  Then seed từ chối bản đó
  And nội dung do manager tạo không đổi
  And batch báo xung đột kèm code

Scenario: dry-run không chạm DB thật
  Given chạy pnpm seed:content --dry-run
  When lệnh kết thúc
  Then báo cáo đầy đủ gate_failures và rows_inserted dự kiến
  And số hàng trong DB thật không đổi
```

## 10. Boundaries

**Always**
- Chạy đủ 8 cổng trước khi merge; cổng tự động là cổng chặn.
- Đọc **từng bản** trong PR trước khi approve.
- Ghi `content_review_log` + `content_seed_batches` cho mọi hàng seed.
- Chạy đủ checklist publish [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §7.3 ở tầng service.
- Một batch một transaction.
- Giữ seeder file đồng bộ với DB (`--against-db` trong cổng tự động).
- Lấy kiểu `content_pack` từ `content_contract`, cấm viết lại tay.

**Ask first**
- Thêm hoặc nới một cổng kiểm.
- Cho seed ghi một loại nội dung mới.
- Đổi bố cục thư mục seeder.
- Cho AI agent IDE quyền chạm môi trường ngoài local.

**Never**
- `UPDATE` hàng đã `published` từ seeder.
- Bỏ qua một cổng.
- Approve PR nội dung theo lô mà không mở từng bản.
- Cho AI sinh `skills` hoặc `strands`.
- Emoji ngoài `emoji_registry`.
- Chạy seed trong đường request.
- Sửa DB tay mà không sửa seeder.
- Để seed đè nội dung do manager tạo trong studio.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | **Một người review được bao nhiêu bản/ngày?** Cổng người đổi chỗ từ hàng đợi sang PR, không biến mất. Đây vẫn là đường găng | Kế hoạch nội dung |
| 2 | Bố cục competency × template có đúng cho LO không, hay LO nên chia theo strand? | Seeder LO |
| 3 | Cổng 6 (trùng lặp) dùng chuẩn hoá cấu trúc hay embedding? Chuẩn hoá rẻ và xác định; embedding bắt được nhiều hơn nhưng cần vector store | Chi phí hạ tầng |
| 4 | Cổng 4 (ngôn ngữ) cần từ điển vốn từ 3–6 tuổi tiếng Việt. Nguồn nào? | Xây cổng 4 |
| 5 | Nội dung seeded có cần người thứ hai review khi có ≥2 manager không? | Chất lượng vs tốc độ |
| 6 | Batch nền có `access_tier` phân bổ ra sao — bao nhiêu `free` cho allow-list guest? | [`SPEC.md`](../../SPEC.md) §15 Q2 |
