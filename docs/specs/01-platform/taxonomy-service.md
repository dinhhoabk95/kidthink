---
spec: TAXONOMY-SERVICE
title: Dịch vụ taxonomy — cây 5 tầng
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-08-07
owns:
  - Cấu trúc cây competency → strand → skill → learning objective
  - Bất biến DAG của skill_prerequisites
  - API traversal
depends_on:
  - GLOSSARY
  - ID-CONVENTIONS
---

# Dịch vụ taxonomy — cây 5 tầng

## 1. Objective

Taxonomy là **bộ xương** của toàn hệ thống. Mọi nội dung, mọi báo cáo, mọi ước lượng
mastery đều treo lên nó. Nó là Lớp 1 — thiết kế bởi người, seed từ hằng số, admin chỉ đọc.

Một sai sót ở đây lan ra mọi nơi và không sửa ngược được cho dữ liệu đã thu.

```
L1 COMPETENCY          6      C1..C6
   └ L2 STRAND        41      C1.CNT
       └ L3 SKILL    230      C1.CNT.03
           └ L4 LEARNING OBJECTIVE  ≥690
               └ L5 ASSET   game_level | lesson | worksheet
```

## 2. Actors

| Actor | Làm gì |
|---|---|
| Dev | Thiết kế cây, seed qua PR |
| Manager | **Chỉ đọc** — duyệt cây để gắn nội dung |
| Adaptive engine | Đọc `skill_prerequisites` để chọn bước tiếp |
| AI agent IDE (lúc soạn seeder) | Đọc skill + LO làm ngữ cảnh. Cấm tạo `skills`/`strands` — `BR-CSA-08` |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/taxonomy/` | Pure TS — dựng cây, traversal, kiểm bất biến |
| `packages/db/src/seed-master/taxonomy/` | Seed 6 + 41 + 230 + ≥690 |
| `GET /api/guest/taxonomy` | Cây công khai cho SEO và trang chương trình |
| `06-admin/taxonomy-browser.md` | Manager duyệt |

## 4. Main flow — dựng và phục vụ cây

1. Seed nạp 4 tầng theo thứ tự phụ thuộc, idempotent theo `code`.
2. `validate()` chạy **trước** khi insert — Zod từng hàng, fail fast.
3. Sau seed, chạy bộ bất biến §6 — bất kỳ vi phạm nào làm seed fail.
4. Runtime: `packages/taxonomy` dựng cây trong bộ nhớ từ DB, cache 5 phút.
5. Traversal trả kết quả từ cache, cấm query đệ quy mỗi lần.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Skill `planned` / `drafted` | Sống trong `docs/taxonomy/*.md`, **không** vào DB |
| Skill không có LO | Seed **fail** — mọi skill `seeded` phải có ≥3 LO |
| Prerequisite tạo chu trình | Seed **fail** trước khi ghi bất kỳ hàng nào |
| Cache lệch sau deploy | Invalidate theo `taxonomy_version` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TAX-01` | `skill_prerequisites` là **DAG** — kiểm bằng property test **trước** khi seed | Một chu trình làm ZPD selector lặp vô hạn, và nó lặp trong lúc một đứa trẻ đang chờ |
| `BR-TAX-02` | Mọi skill `seeded` có **≥3 learning objective** | Một skill có 1 LO không đo được |
| `BR-TAX-03` | Mọi LO thuộc **đúng một** skill; mọi skill thuộc **đúng một** strand | Cây, không phải đồ thị. Đa cha làm báo cáo cộng trùng |
| `BR-TAX-04` | Mọi skill có `age_min ≤ age_max ∈ [3,6]`, `difficulty ∈ [1,5]`, ≥1 thinking process | Thiếu bất kỳ cái nào làm ZPD không chọn được |
| `BR-TAX-05` | `prerequisite.difficulty ≤ skill.difficulty` | Điều kiện tiên quyết khó hơn thứ nó mở khoá là mâu thuẫn |
| `BR-TAX-06` (Lớp 1) | Taxonomy là **Lớp 1** — admin cấm tạo/sửa/xoá qua UI | Mọi FK trỏ vào đây. Sửa từ UI làm mồ côi dữ liệu đã thu |
| `BR-TAX-07` (FK skill_id) | `mastery_state` khoá theo **`skill_id` FK**, không phải chuỗi `concept` tự do | Sai chính tả bị chặn ở FK, không phải phát hiện sau 6 tháng |
| `BR-TAX-08` | `strands.parent_strand_id` cho **đúng một** tầng lồng. Sâu hơn bị cấm | Cây sâu tuỳ ý làm mọi truy vấn thành đệ quy |
| `BR-TAX-09` | Seed **khớp chính xác** `docs/taxonomy/c1..c6.md` — 6 / 41 / 230 | Hai nguồn sự thật lệch nhau là không có nguồn nào |
| `BR-TAX-10` | Truy vấn `skill → LO → asset` **< 100 ms P95** với toàn bộ dữ liệu MVP | Nó nằm trong đường vào mọi màn hình chọn nội dung |

## 7. Data

### 7.1 Bảng

| Bảng | Field then chốt |
|---|---|
| `competencies` | `id` PK, `code` (C1–C6, hiển thị), `name_vi`, `description_vi`, `color_token`, `icon` |
| `strands` | `id` PK, `code` (hiển thị), `competency_id` FK, `parent_strand_id` (≤1 tầng), `name_vi`, `position` |
| `skills` | `id` PK, `code` (hiển thị), `strand_id` FK, `name_vi`, `age_min`, `age_max`, `difficulty`, `thinking_processes[]`, `what_axis[]`, `status` |
| `skill_prerequisites` | `skill_id` FK, `prerequisite_id` FK, `strength` — PK ghép |
| `learning_objectives` | `id` PK, `code` (hiển thị), `skill_id` FK, `behaviour_vi`, `observable_criteria_vi`, `position` |

Cột thật xem [`schema-content-taxonomy.md`](schema-content-taxonomy.md) §7.1 — file này chỉ
liệt kê field, không phải nguồn `owns`. FK dùng `id` theo [`data-model-overview.md`](data-model-overview.md) `BR-DM-13`
(D-AE, sửa lại 2026-08-07) — `code` giữ lại làm định danh hiển thị, không dùng làm FK.

### 7.2 Phân bố MVP

| ID | Competency | Strand | Skill |
|----|---|---:|---:|
| C1 | Tư duy toán học | 10 | 99 |
| C2 | Tư duy không gian | 8 | 44 |
| C3 | Tư duy logic | 8 | 30 |
| C4 | Tư duy quan sát | 4 | 16 |
| C5 | Tư duy ngôn ngữ | 5 | 21 |
| C6 | Chức năng điều hành | 6 | 20 |
| | | **41** | **230** |

C4/C5/C6 mỏng là **kết quả đúng** — nó đo chính xác khoảng trống nội dung roadmap phải lấp,
không phải lỗi cần che.

### 7.3 API package

```ts
buildSkillTree(rows): SkillTree;
resolveSkillsForCompetency(tree, "C1"): Skill[];
resolvePath(tree, "C1.CNT.03"): { competency, strand, skill };
prerequisitesOf(tree, code, { transitive?: boolean }): Skill[];
unlockedBy(tree, code): Skill[];
assertDag(tree): void;            // throw kèm chu trình tìm được
nextCandidates(tree, mastered: Set<string>): Skill[];
```

Pure TS. Cấm — **NEVER ghi DB** từ package này — trả dữ liệu, tầng API ghi.

## 8. API contract

### `GET /api/guest/taxonomy`

| | |
|---|---|
| Auth | không |
| Query | `?depth=competency\|strand\|skill` |
| 200 | Cây tới độ sâu yêu cầu, chỉ skill `status = 'seeded'` |
| Cache | `public, max-age=3600` — dữ liệu công khai, đổi hiếm |

### `GET /api/guest/taxonomy/skills/{code}`

200 → skill + LO + đếm asset published. 404 nếu `planned`/`drafted`.

| Mã lỗi | HTTP |
|---|---|
| `NOT_FOUND` | 404 |
| `INVALID_CODE_FORMAT` | 400 |

## 9. Acceptance criteria

```gherkin
Scenario: BR-TAX-01 — DAG trên toàn bộ seed
  Given toàn bộ dữ liệu taxonomy đã seed
  When chạy property test assertDag trên mọi tổ hợp
  Then không phát hiện chu trình nào

Scenario: BR-TAX-01 — chu trình làm seed fail trước khi ghi
  Given một file seed khai báo A là prerequisite của B và B của A
  When chạy pnpm db:seed
  Then seed fail trước khi insert hàng nào
  And thông báo in ra chu trình tìm được

Scenario: BR-TAX-02 — mọi skill có đủ LO
  Given seed hoàn tất
  When đếm learning_objectives theo skill_id
  Then không skill nào có ít hơn 3

Scenario: BR-TAX-09 — số lượng khớp tài liệu
  Given seed hoàn tất
  Then competencies có 6 hàng
  And strands có 41 hàng
  And skills có 230 hàng
  And learning_objectives có ít nhất 690 hàng

Scenario: BR-TAX-03 — mỗi LO thuộc đúng một skill
  When kiểm mọi hàng learning_objectives
  Then mỗi hàng có đúng một skill_id không NULL

Scenario: BR-TAX-05 — prerequisite không khó hơn skill
  When kiểm mọi hàng skill_prerequisites
  Then difficulty của prerequisite luôn ≤ difficulty của skill

Scenario: BR-TAX-06 — admin không sửa được taxonomy
  Given manager super_admin đã đăng nhập
  When gọi POST hoặc PATCH tới bất kỳ route taxonomy nào
  Then route không tồn tại hoặc trả 405

Scenario: BR-TAX-10 — truy vấn đủ nhanh
  Given DB có đầy đủ 230 skill và 690 LO
  When chạy 100 truy vấn skill → LO → asset
  Then P95 dưới 100 ms

Scenario: seed idempotent
  Given seed đã chạy một lần
  When chạy lại pnpm db:seed
  Then số hàng mỗi bảng taxonomy không đổi
  And không lỗi nào phát sinh

Scenario: skill planned không vào DB
  Given docs/taxonomy có skill trạng thái planned
  When seed chạy
  Then skill đó không xuất hiện trong bảng skills
```

## 10. Boundaries

**Always**
- Chạy `assertDag` trước khi seed ghi hàng nào.
- Seed idempotent, tra theo `code`.
- Giữ `packages/taxonomy` pure — không ghi DB, không `new Date()`.
- Cache cây, invalidate theo `taxonomy_version`.

**Ask first**
- Thêm/xoá skill hoặc strand.
- Đổi ánh xạ competency của một skill đã có nội dung gắn vào.
- Đổi `difficulty` hoặc band tuổi của skill đã có `mastery_state`.

**Never**
- Cho admin sửa taxonomy qua UI.
- Seed skill `planned`/`drafted` vào DB.
- Chuỗi `concept` tự do thay cho `skill_id` FK.
- Lồng strand quá một tầng.
- Ghi DB từ `packages/taxonomy`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Ai biên soạn ≥690 LO?~~ Seeder + AI agent IDE soạn nhanh được, nhưng vẫn cần người đọc review từng bản. **Đóng 2026-08-07 (T9)**: đồng bộ theo [`mvp-scope.md`](../00-foundation/mvp-scope.md) Q1 — hạ từ chặn P0 xuống chờ P1, cùng nhãn D-W | — | đã đóng | D-W (chủ thật chưa chốt ở [`mvp-scope.md`](../00-foundation/mvp-scope.md) Q1 — Nợ #4, chưa đóng) |
| 2 | 120 skill còn thiếu (230 → 350) biên soạn khi nào và bởi ai? | Nội dung sau MVP | chờ sau MVP | hoãn |
| 3 | `strength` của prerequisite dùng thang nào — nhị phân hay 0–1? Adaptive cần biết để cân nhắc | [`adaptive-engine.md`](adaptive-engine.md) | chờ P3 | hoãn — chốt lúc [`adaptive-engine.md`](adaptive-engine.md) thiết kế (P3) |
| 4 | C5 Language cần audio tiếng Việt cho ~21 skill — thu âm người thật hay TTS? | Nội dung P1 | chờ P1 | hoãn |
