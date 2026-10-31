---
spec: CONTENT-SEED-AUTHORING
title: Biên soạn nội dung nền bằng seeder trong repo
area: platform
status: implemented
mvp: true
phase: P1
reviewed: 2026-10-18
owns:
  - Ranh giới giữa AI agent IDE hỗ trợ soạn và người phát hành
  - Vị trí, hình dạng, và quy ước đặt tên seeder nội dung — trừ bố cục seeder game level
    theo trục kỹ năng, thuộc [`skill-dataset-model.md`](../05-content/skill-dataset-model.md)
  - Mười cổng kiểm chạy trong cổng tự động trước khi merge
  - Yêu cầu ca âm cho từng cổng
  - Đường ghi cứng và idempotent từ seeder vào DB
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - TAXONOMY-SERVICE
  - EMOJI-REGISTRY
  - AI-CODEGEN-PIPELINE
  - LEVEL-DIFFICULTY-CONTRACT
---

# Biên soạn nội dung nền bằng seeder trong repo

## 1. Objective

MVP cần **≥690 learning objective, ≥120 game level, 5 curriculum**. ≥690 LO là dữ liệu taxonomy
do [`taxonomy-service.md`](taxonomy-service.md) sở hữu và phải hoàn tất ở P0. Spec này
sở hữu đường ống biên soạn nội dung từ P1: `skill_datasets`, `game_levels` trước, `curricula` ở P3.

Cách giải: toàn bộ nội dung (`game_levels`, `curricula`, `skill_datasets`) được viết thành **seeder file trong repo**, người biên soạn dùng
**AI agent IDE** (Claude Code / Cursor) làm trợ lý soạn thảo, và **PR review là cổng người**.
Mỗi `code` là `UNIQUE` (1 dòng duy nhất) và dùng `id` trực tiếp — đã xóa cơ chế đa version (`content_version`, `entity_id`), xóa cổng duyệt Studio (`draft/in_review/approved/published/archived/rejected`), xóa bảng `content_review_log`, `content_seed_batches` và toàn bộ bảng `content.ts` (`lessons`, `activities`, `worksheets`, `seo_pages`).

Cấm: **không có LLM nào chạy trong hệ thống.** Không có hàng đợi duyệt nội dung do máy sinh,
không có trần chi phí token trong production, không có provenance theo model.

### 1.1 Ranh giới cứng

```
người + AI agent IDE ──viết──► seeder file trong repo (TS có kiểu)
                                        │
                      10 cổng tự động ─┤  đỏ thì không merge được
                                        ▼
                          PR có người review  ◄── ĐÂY là cổng người
                                        │
                              pnpm --filter @mindkid/content-build seed:content
                                        ▼
                     nạp cứng idempotent vào DB (1 dòng duy nhất mỗi code)
```

Rule đúng:

> Cấm — **NEVER để AI phát hành nội dung cốt lõi.**
> Được phép: AI **soạn thảo file** trong repo. Chỉ **người** merge, và merge chính là phát hành.

### 1.2 Vì sao là seeder chứ không phải pipeline sinh tự động hay Studio CRUD

| | Seeder trong repo | Pipeline LLM / Studio runtime |
|---|---|---|
| Cổng người | PR review — đọc diff, `git blame`, revert một lệnh | Hàng đợi admin — không có ba thứ đó |
| Tái lập môi trường | Dựng từ số 0 ra **đúng** thư viện nội dung đó | Không bảo đảm |
| Sai schema bắt ở đâu | Lúc `tsc`, trước khi chạy | Lúc runtime |
| Chi phí vận hành | 0 — không gọi model trong production, không cần duy trì đa version DB | Phức tạp hoá schema và UI quản trị |
| Nội dung là gì | **Tài sản của repo**, version cùng code | Dữ liệu vận hành rời rạc |

Nội dung nền là tài sản, không phải dữ liệu vận hành. Nó phải nằm cùng chỗ với thứ khác
cũng là tài sản và cũng cần review: code.

## 2. Actors

| Actor | Làm gì | Cấm |
|---|---|---|
| **Người biên soạn** | Viết seeder, chạy cổng local, mở PR | Merge PR của chính mình khi có ≥2 manager |
| **AI agent IDE** | Soạn thảo file seeder theo `content_contract`, tra taxonomy · emoji registry · spec | Chạy `seed:content` lên môi trường ≠ local · merge PR · chạm `skills`/`strands` |
| **Người review PR** | Đọc **từng bản** trong diff, approve = phát hành | Approve theo lô mà không mở nội dung |
| **Cổng tự động** | Chạy 10 cổng §7.3 + `seed:content --dry-run` trên DB tạm | Merge tự động |
| **`pnpm --filter @mindkid/content-build seed:content`** | Nạp cứng idempotent nội dung (`skill_datasets`, `game_levels`, `curricula`) vào DB | Chạy khi chưa qua đủ 10 cổng |

## 3. Entry points

| Nơi | Ghi chú |
|---|---|
| `packages/content/src/skills/c1..c6/<strand>/<SKILL>.ts` | Dataset kỹ năng và game level theo từng kỹ năng, gom theo cây năng lực C1–C6 |
| `packages/content-build/src/seed-master/taxonomy/index.ts` (khối `learning_objectives`) | LO do [`taxonomy-service.md`](taxonomy-service.md) sở hữu; P0 dùng cùng quy tắc PR review |
| `pnpm --filter @mindkid/content-build seed:check` | Chạy các cổng kiểm tra, không chạm DB |
| `pnpm --filter @mindkid/content-build seed:content --dry-run` | DB tạm → seed → kiểm tra cổng → rollback |
| `pnpm --filter @mindkid/content-build seed:content` | Ghi thật vào DB |
| `pnpm --filter @mindkid/content-build seed:report` | Phủ theo competency · skill · template; chỉ ra khoảng trống |

Cấm — **NEVER trong đường request.** Seed là lệnh vận hành, chạy lúc dựng môi trường hoặc lúc
deploy một lô nội dung đã merge.

## 4. Main flow

```
1. Chọn khoảng trống cần lấp:  pnpm --filter @mindkid/content-build seed:report  → skill nào chưa có level
2. Người biên soạn + AI agent IDE soạn seeder file
       ├── kiểu content_pack suy ra từ content_contract của template (§7.2)
       ├── emoji: ký tự UTF-8; @mindkid/emoji là vốn từ gợi ý
       └── skill_codes / learning_objective_codes là FK có thật
3. pnpm --filter @mindkid/content-build seed:check                 → 10 cổng, chạy local, sửa cho tới khi xanh
4. Mở PR
5. Cổng tự động chạy 10 cổng + seed:content --dry-run trên DB tạm
6. ► NGƯỜI REVIEW ĐỌC TỪNG BẢN  ← cổng người
7. Merge  = quyết định phát hành
8. pnpm --filter @mindkid/content-build seed:content               → nạp cứng idempotent vào DB
```

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chạy lại `seed:content` không đổi gì | **Idempotent** theo `code` UNIQUE (1 dòng duy nhất mỗi mã) |
| Một cổng tự động đỏ | PR không merge được qua review. Cờ bỏ qua **ở máy cá nhân** (`git commit --no-verify`) tồn tại — xem [`repo-bootstrap.md`](../00-foundation/repo-bootstrap.md) §11 Q12; PR vẫn cần review người, không tự merge được |
| `code` trùng giữa hai seeder file | Cổng 0 bắt lúc build, fail **trước khi** chạm DB |
| Seed chạy giữa chừng thì lỗi | Rollback cả batch. Cấm seed một phần |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CSA-01` (nạp cứng từ seeder, 1 dòng mỗi `code`) | Toàn bộ `game_levels`, `curricula`, `skill_datasets` có `code UNIQUE` (1 dòng duy nhất mỗi mã), dùng `id` trực tiếp, không có `content_version` hay `entity_id` | Quản lý phiên bản trong Git, giữ DB gọn nhẹ và nhất quán |
| `BR-CSA-02` (cổng người là PR) | Cổng người là **PR review**, không còn hàng đợi duyệt Studio hay trạng thái vòng đời nội dung trong DB | Cổng người ở PR có diff, `git blame`, và revert bằng một lệnh |
| `BR-CSA-04` (qua đủ 10 cổng trước khi ghi) | Seed chạy **đủ 10 cổng kiểm tra** trước khi ghi vào DB. Trượt một mục → rollback cả batch | Đảm bảo không có nội dung sai schema hay sai sư phạm lọt vào DB |
| `BR-CSA-05` (một transaction) | Một lần seed = **một transaction**. Cấm seed một phần | Nửa lô nội dung là một thư viện không giải thích được |
| `BR-CSA-06` (idempotent) | Seed **idempotent**: chạy lại không tạo bản trùng, giữ nguyên `id` của `code` đã có | Seed chạy mỗi lần dựng hoặc cập nhật môi trường |
| `BR-CSA-07` (AI không phát hành) | AI agent IDE cấm — **NEVER chạy `seed:content`** lên môi trường khác local, cấm — **NEVER merge PR** | Ranh giới cứng: AI soạn file, người phát hành |
| `BR-CSA-08` (AI không sinh taxonomy) | AI cấm — **NEVER sinh `skills` hay `strands`** | Taxonomy do người thiết kế. Sai một skill là sai mọi thứ treo lên nó |
| `BR-CSA-09` (LO soạn bằng seeder) | `learning_objectives` soạn bằng seeder như game level, chịu đúng bộ cổng ở §7.3 và đúng PR review | LO là Tầng 4 taxonomy nhưng là **mô tả hành vi** — soạn được, miễn có người đọc |
| `BR-CSA-10` (code bất biến) | `code` trong seeder **bất biến** sau khi merge | [`id-conventions.md`](../00-foundation/id-conventions.md) — mã là neo của mọi telemetry và báo cáo |
| `BR-CSA-11` (nguồn sự thật) | Seeder file là **nguồn sự thật duy nhất** của toàn bộ nội dung. `pnpm --filter @mindkid/content-build seed:check --against-db` báo lệch giữa repo và DB | Sửa DB tay rồi quên seeder = môi trường tiếp theo mất bản sửa |
| `BR-CSA-12` (TS có kiểu) | `content_pack` viết bằng **TS có kiểu**, kiểu lấy từ `content_contract` của template. Cấm JSON trần | Sai schema bắt lúc `tsc` rẻ hơn bắt lúc cổng tự động, rẻ hơn nhiều bắt lúc trẻ đang chơi |
| `BR-CSA-13` (emoji là ký tự) | Emoji tham chiếu bằng **ký tự UTF-8**. Cấm — NEVER mã `EMJ-<slug>`. `@mindkid/emoji` là **vốn từ khuyến nghị**, không phải ràng buộc | [`emoji-registry.md`](emoji-registry.md) `BR-EMJ-01`/`BR-EMJ-02` |
| `BR-CSA-15` (mỗi cổng có ca âm) | Mỗi cổng ở §7.3 phải có **ít nhất một** test dựng nội dung vi phạm đúng cổng đó và khẳng định cổng đỏ | Không có ca âm thì một cổng chỉ kiểm `typeof` vẫn in "đạt" mãi mãi |
| `BR-CSA-16` (cổng 1 nạp contract thật) | Cổng 1 **phải** nạp `content_contract` và `difficulty_contract` từ registry engine và gọi `parse`, kể cả `refine`. Cấm — NEVER thay bằng kiểm kiểu nông | `BR-GTC-02` parse lại ở server; nếu cổng seed không parse thì lỗi chỉ lộ ra lúc trẻ mở màn chơi |

## 7. Data

### 7.1 Bố cục — theo năng lực đã chốt
 
```
packages/content/src/
├── skills/c1..c6/<strand>/<SKILL>.ts    408 file: danh tính + vốn liệu + ma trận màn chơi
├── builders/<GT>.ts                     34 bộ dựng màn chơi
└── manual/c1..c6/<strand>/              Màn chơi soạn tay
```

Chia theo **competency → strand → skill** (Task #208): mỗi kỹ năng có đúng một file
chứa trọn vẹn danh tính, vốn liệu và ma trận màn chơi. Đã xoá `activities` và `lessons`. Danh sách competency:
[`taxonomy-service.md`](taxonomy-service.md) §7.

### 7.2 Hình dạng một seeder

```ts
export const seed: ContentSeed<"GT-004"> = {
  batch: "SEED-C4-GT004-01",
  competency: "C4",
  items: [{
    code: "GL-C4-CLS-SORT-0021",                 // UNIQUE, bất biến sau merge
    title: "Xếp quả vào rổ đúng màu",
    instruction: "Bé xếp mỗi quả vào rổ cùng màu nhé!",
    skill_codes: ["C3.CLS.02"],
    learning_objective_codes: ["LO-C3.CLS.02-01"],
    age_min: 4, age_max: 5, difficulty: 2,
    access_tier: "premium",          // NOT NULL, không default
    theme_id: "farm",
    thumbnail_emoji: "🍎",
    content_pack: { /* kiểu = z.infer<typeof SortGroupsContent> */ },
    difficulty_params: { /* kiểu = z.infer<typeof SortGroupsDifficulty> */ },
  }],
};
```

`ContentSeed<"GT-004">` lấy kiểu `content_pack` **từ chính** `content_contract` của template
([`game-template-contract.md`](game-template-contract.md) §7.3). Thiếu field, thừa field, sai kiểu → lỗi `tsc`, không phải
lỗi runtime. Đây là lý do seeder là TS chứ không phải JSON hay YAML.

### 7.3 Mười cổng — chạy trong cổng tự động, chặn merge

Chạy tuần tự. Trượt cổng nào thì dừng ở đó, in `file:line` và **PR không merge được**.

| # | Cổng | Kiểm gì | Thi công |
|---|---|---|---|
| 0 | **Định danh** | `code` duy nhất toàn corpus seeder · đúng format [`id-conventions.md`](../00-foundation/id-conventions.md) | Đủ |
| 1 | **Schema** | `content_pack` parse được bằng `content_contract` thật (Zod, còn đủ `refine`) · `difficulty_params` parse được bằng `difficulty_contract` | **Báo cáo + bậc thang nợ (Task #117)** — xem mục 7.3a |
| 2 | **Cấu trúc** | ≥1 đáp án đúng · cấm prompt rỗng · số item trong `limits` của template · số distractor hợp lệ · cấm đáp án trùng nhau | Một phần |
| 3 | **Asset** | Emoji không kiểm (là text thường, `BR-EMJ-01`) · mọi `image_path` resolve được | Đủ |
| 4 | **Ngôn ngữ** | Câu ≤ 12 từ · từ vựng trong tầm 3–6 tuổi · cấm từ cấm §7.4 · cấm lỗi dấu | Một phần |
| 5 | **Sư phạm** | `skill_codes` · `learning_objective_codes` là FK có thật · `age_min ≤ age_max ∈ [3,6]` · `difficulty ∈ [1,5]` · khớp band tuổi · mechanic hợp band (`BR-GTC-05`) | **Đủ (Task #117)** — xem mục 7.3a |
| 6 | **Trùng lặp** | Cấm gần trùng bản khác trong corpus — chuẩn hoá `content_pack` rồi so | Một phần |
| 7 | **An toàn** | Cấm bạo lực, đáng sợ, phân biệt, không hợp tuổi · cấm thương hiệu, cấm nhân vật có bản quyền. Cổng này **không** thay thế mắt người ở bước 6 §4 | Một phần |
| 8 | **Nguồn vật** | Mọi `item_id` và asset trong `content_pack` truy được về `dataset.items[].id` của kỹ năng level đó (`BR-SDS-02` — vật phải là vật của kỹ năng) | Mục 7.6 của [`skill-dataset-model.md`](../05-content/skill-dataset-model.md) |
| 9 | **Khái niệm hiện ra** | Dataset có `glyph` thì mọi level của kỹ năng hiển thị ≥1 vật mang `glyph` (`BR-SDS-03` — khái niệm phải hiện ra) | Idem |

Cổng 0–3, 5, 8 và 9 là **xác định**. Cổng 4, 6, 7 là **heuristic** — chúng lọc bớt, không
kết luận. Đó là lý do bước review của người vẫn bắt buộc.

Cổng 8 và 9 do [`skill-dataset-model.md`](../05-content/skill-dataset-model.md) định nghĩa;
file này chỉ giữ **danh sách** cổng. Chúng đo thứ bảy cổng đầu không hỏi: level có dạy đúng
kỹ năng nó gắn không. Cả 10 cổng phải chạy trong `db:seed` (`BR-SDS-13` — cổng chạy lúc gieo).

### 7.3a Đóng xanh giả Cổng 1 và Cổng 5 — thi công 2026-08-29 (Task #117)

Đo và khắc phục trên corpus hàng seed:

| Phép kiểm | Cổng cũ | Cổng thật (Task #117) | Trạng thái xử lý |
|---|---|---|---|
| 8 cổng ca âm | Không có | **12/12 ca âm đỏ thật** (`eight-gates.test.ts`) | Đóng |
| Cổng 1 — `content_pack` parse bằng `content_contract` | không kiểm (xanh giả) | **162 trên 228 level trượt** | Báo cáo + bậc thang nợ, giao sửa ở 27 task engine (#130–#156) |
| Cổng 1 — `difficulty_params` parse bằng `difficulty_contract` | không kiểm (xanh giả) | **170 trên 228 level trượt** | Báo cáo + bậc thang nợ, giao sửa ở 27 task engine (#130–#156) |
| Cổng 5 — bỏ `SLUG_REGEX`, từ vựng đóng | qua mọi slug | **0 trượt trên corpus hiện tại** (đã khớp 4 trục từ vựng) | Đóng |
| Cổng 5 — FK taxonomy (`skill_codes`, `learning_objective_codes`) | không kiểm | **Kiểm tra định dạng & FK taxonomy** | Đóng |
| Cổng 5 — `difficulty ∈ [1, 5]` & band engine | không kiểm | **Kiểm tra difficulty + cảnh báo band engine** | Đóng |

### 7.4 Từ cấm trong nội dung cho trẻ

Bạo lực · sợ hãi (ma, quái vật đáng sợ) · chết chóc · bệnh tật · phân biệt giới/vùng miền ·
thương hiệu thương mại · nhân vật có bản quyền · nội dung tôn giáo · chính trị ·
so sánh hơn kém giữa trẻ · từ mang nghĩa trừng phạt ("sai rồi", "dốt", "thua").

Danh sách đầy đủ: `packages/moderation/src/child-content-blocklist.ts`. Cổng 7
dùng đúng danh sách này.

## 8. API contract

Không có route. Giao diện là CLI + cổng tự động. Không mã lỗi HTTP — CLI thoát khác 0.

```ts
interface SeedOptions {
  batch?: string;           // mặc định: mọi batch
  dry_run?: boolean;        // DB tạm, seed, kiểm cổng, rollback
  against_db?: boolean;     // so repo ↔ DB, chỉ báo lệch
}

interface SeedResult {
  batch_code: string;
  gate_failures: { gate: 0|1|2|3|4|5|6|7|8|9; code: string; file: string; detail: string }[];
  rows_inserted: number;
  rows_skipped_idempotent: number;
  drift: { code: string; field: string }[];   // chỉ với --against-db
}
```

Cổng tự động fail khi `gate_failures.length > 0` hoặc `drift.length > 0`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CSA-01 — mỗi code trong game_levels là duy nhất
  Given một batch 30 game level qua đủ 10 cổng và đã merge
  When chạy pnpm --filter @mindkid/content-build seed:content
  Then cả 30 hàng được ghi vào game_levels với mỗi code là UNIQUE
  And không có cột content_version hay entity_id

Scenario: BR-CSA-04 — trượt cổng kiểm tra thì rollback cả batch
  Given một batch 30 bản, trong đó một bản thiếu skill hợp lệ
  When chạy pnpm --filter @mindkid/content-build seed:content
  Then transaction bị rollback
  And số hàng trong bảng game_levels không đổi
  And thông báo nêu code của bản lỗi

Scenario: BR-CSA-06 — chạy lại là idempotent
  Given một batch đã seed xong
  When chạy lại pnpm --filter @mindkid/content-build seed:content với cùng batch
  Then không sinh bản ghi trùng lặp
  And id của các bản ghi đã có được giữ nguyên

Scenario: cổng 0 — code trùng giữa hai seeder file
  Given hai file seeder cùng khai code GL-C4-CLS-SORT-0021
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng 0 fail
  And thông báo nêu cả hai đường dẫn file
  And không kết nối DB nào được mở

Scenario: BR-CSA-12 — sai content_pack bắt được lúc tsc
  Given một seeder GT-004 thiếu field groups trong content_pack
  When chạy pnpm typecheck
  Then biên dịch fail
  And lỗi trỏ đúng file và dòng của item sai

Scenario: BR-CSA-13 — mã EMJ-* bị chặn
  Given một seeder dùng "EMJ-red-apple" làm emoji ref
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng 3 fail
  And thông báo nêu rõ ref nào còn là mã

Scenario: BR-CSA-13 — glyph ngoài danh mục KHÔNG bị chặn
  Given một seeder dùng "🦖" và 🦖 chưa có trong @mindkid/emoji
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng 3 đạt
  And báo cáo kiểm kê liệt kê 🦖 là glyph ngoài danh mục

Scenario: cổng 5 — mechanic không phù hợp tuổi bị chặn
  Given một seeder dùng GT-006 với age_min = 3
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng 5 fail
  And lý do nêu ràng buộc band tuổi của template

Scenario: BR-CSA-07 — AI agent không phát hành được
  When kiểm cấu hình quyền của AI agent IDE
  Then seed:content chỉ chạy được với DATABASE_URL trỏ localhost
  And không có đường nào cho agent approve hay merge PR

Scenario: BR-CSA-08 — seeder không tạo được skill
  Given một seeder cố khai một skill mới
  When chạy pnpm --filter @mindkid/content-build seed:check
  Then cổng 5 fail với thông báo taxonomy do người thiết kế

Scenario: BR-CSA-16 — cổng 1 bắt content_pack sai hình dạng
  Given một seeder có content_pack thiếu trường prompt
  When chạy 10 cổng
  Then cổng 1 trượt
  And thông báo nêu trường thiếu và mã level

Scenario: BR-CSA-16 — cổng 1 bắt difficulty_params sai hình dạng
  Given một seeder có difficulty_params thiếu hint_after_ms
  When chạy 10 cổng
  Then cổng 1 trượt

Scenario: BR-CSA-15 — mỗi cổng có ca âm
  When đọc bộ test của 10 cổng
  Then mỗi cổng từ 0 tới 9 có ít nhất một test dựng vi phạm và khẳng định cổng đỏ

Scenario: cổng 5 bắt band level ngoài band engine
  Given một level GT-006 khai age_min là 4
  And GT-006 khai age_min là 5
  When chạy 10 cổng
  Then cổng 5 trượt với lý do BR-GTC-05

Scenario: BR-CSA-11 — lệch giữa repo và DB bị bắt
  Given một hàng trong DB bị sửa tay khác với seeder
  When chạy pnpm --filter @mindkid/content-build seed:check --against-db
  Then drift liệt kê code và field lệch
  And cổng tự động fail

Scenario: dry-run không chạm DB thật
  Given chạy pnpm --filter @mindkid/content-build seed:content --dry-run
  When lệnh kết thúc
  Then báo cáo đầy đủ gate_failures và rows_inserted dự kiến
  And số hàng trong DB thật không đổi
```

## 10. Boundaries

**Always**
- Chạy đủ 10 cổng trước khi merge; cổng tự động là cổng chặn.
- Đọc **từng bản** trong PR trước khi approve.
- Một batch một transaction.
- Giữ seeder file đồng bộ với DB (`--against-db` trong cổng tự động).
- Lấy kiểu `content_pack` từ `content_contract`, cấm viết lại tay.

**Ask first**
- Thêm hoặc nới một cổng kiểm.
- Cho seed ghi một loại nội dung mới.
- Đổi bố cục thư mục seeder.
- Cho AI agent IDE quyền chạm môi trường ngoài local.

**Never**
- Bỏ qua một cổng.
- Approve PR nội dung theo lô mà không mở từng bản.
- Cho AI sinh `skills` hoặc `strands`.
- Mã `EMJ-<slug>` — tham chiếu là ký tự UTF-8 (`BR-EMJ-02`).
- Chạy seed trong đường request.
- Sửa DB tay mà không sửa seeder.
- Thêm lại `content_review_log`, `content_seed_batches`, hoặc cơ chế đa version (`content_version`, `entity_id`).

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Một người review được bao nhiêu bản/ngày?~~ **Đóng 2026-08-09 (`D-CN`, thay thế quyết định hoãn `D-W`)**: baseline lập kế hoạch 20 LO, 6 game level hoặc 3 lesson/ngày; đo lại sau pilot 30 LO + 6 level, quota không thay checklist chất lượng | — | Đã đóng | D-CN |
| ~~2~~ | ~~LO chia theo competency × template hay strand?~~ **Đóng 2026-08-09 (`D-CK`)**: file chia theo competency, bên trong nhóm theo strand rồi skill; template không tham gia taxonomy LO | — | Đã đóng | D-CK |
| 3 | Cổng 6 (trùng lặp) dùng chuẩn hoá cấu trúc hay embedding? Chuẩn hoá rẻ và xác định; embedding bắt được nhiều hơn nhưng cần vector store | Chi phí hạ tầng | P2 | Backend |
| 4 | Cổng 4 (ngôn ngữ) cần từ điển vốn từ 3–6 tuổi tiếng Việt. Nguồn nào? | Xây cổng 4 | P2 | Nội dung |
| 5 | Nội dung seeded có cần người thứ hai review khi có ≥2 manager không? | Chất lượng vs tốc độ | P2 | Nội dung |
| 6 | Batch nền có `access_tier` phân bổ ra sao — bao nhiêu `free` cho allow-list guest? | [`SPEC.md`](../../SPEC.md) §15 Q2 | P1 | người quyết |
| ~~7~~ | ~~Branch protection GitHub bật thế nào?~~ **Đóng 2026-08-09 (`D-CL`)**: `main` cấm direct push và force-push; merge bắt buộc PR + ít nhất một approving human review; dismiss approval khi có commit mới. Người bật rule ngoài repo trước PR seeder đầu tiên. **Thay thế 2026-10-18**: `CLAUDE.md` mục "Git workflow" chốt commit thẳng vào `main`; không còn PR bắt buộc hay branch protection. Lefthook (`BR-RBS-03`) là gate duy nhất, `--no-verify` vẫn bỏ qua được | — | Đã đóng | D-CL (đã thay) |
