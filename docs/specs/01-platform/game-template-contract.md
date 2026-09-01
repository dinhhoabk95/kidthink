---
spec: GAME-TEMPLATE-CONTRACT
title: Contract khuôn trò chơi
area: platform
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-07
owns:
  - Hình dạng GameTemplate
  - content_contract và difficulty_contract
  - Sáu template MVP
depends_on:
  - GLOSSARY
  - ID-CONVENTIONS
  - CONTENT-LIFECYCLE
---

# Contract khuôn trò chơi

## 1. Objective

Một **Game Template** là mechanic + layout + hợp đồng nội dung. Nó **không gắn skill**.

Đây là quyết định kiến trúc quan trọng nhất của tầng game: tách *cơ chế chơi* khỏi *nội
dung học*. Một template phục vụ hàng chục mục tiêu học tập; đổi `content_pack` sinh ra một
bài học khác hẳn mà **không viết dòng code engine nào**.

```
GT-003 drag-to-container
  ├ what=colour    thinking=observe  → C4  phân loại theo màu
  ├ what=number    thinking=compare  → C1  phân loại theo số lượng
  ├ what=rule      thinking=infer    → C3  phân loại theo quy luật
  └ what=category  thinking=sort     → C5  phân loại theo chức năng
```

Bốn game level, bốn competency, không dòng code mới.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Dev | Định nghĩa template, viết Session class, khai báo `content_contract` |
| Manager | **Chọn** template khi tạo level. Cấm: không tạo/sửa template |
| Người soạn seeder + AI agent IDE | Lấy **kiểu TS** của `content_pack` từ `content_contract`; sai schema fail lúc `tsc` |
| Engine | Nạp `content_pack`, dựng phiên |

## 3. Entry points

| Nơi | Ghi chú |
|---|---|
| `packages/game-engine/src/templates/` | Định nghĩa template + Session class |
| `packages/db/src/seed-master/game-templates.ts` | Seed Lớp 1 |
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Manager chọn template |
| [`content-seed-authoring.md`](content-seed-authoring.md) | Cổng 1 dùng `content_contract`; seeder lấy kiểu từ nó |

## 4. Main flow — thêm một template mới

1. Viết spec cho template: mechanic, layout, giới hạn, band tuổi phù hợp.
2. Khai báo `content_contract` (Zod) và `difficulty_contract` (Zod).
3. Viết Session class implement `GameSession`.
4. Viết ≥3 game level mẫu để chứng minh contract dùng được.
5. Viết E2E journey cho template.
6. Viết phiếu spec `engines/GT-<nnn>.md` — `BR-ESS-07` (phiếu là một phần của định nghĩa xong)
   làm PR thiếu phiếu không merge được.
7. Seed vào `game_templates` qua PR.

Ba level mẫu ở bước 4 là **bằng chứng contract chạy**, cấm — NEVER dùng làm nội dung sản phẩm.
Sàn nội dung thật của một engine ở [`engine-content-depth.md`](../05-content/engine-content-depth.md);
đo 2026-08-29, 21 trên 27 engine dừng đúng ở mức bằng chứng này.

Template là **Lớp 1** — thêm template là việc của dev, không của Manager.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Đổi `content_contract` của template đã publish | **Ask first.** Mọi `game_level` dùng template đó phải được validate lại; bản nào fail phải sửa hoặc archive trước khi deploy |
| Template `deprecated` | Level đang dùng vẫn chạy. Cấm tạo level mới với template đó |
| Client yêu cầu template không tồn tại | **422** `TEMPLATE_NOT_SUPPORTED` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-GTC-01` (template không gắn skill) | Template **không gắn skill**. Skill gắn ở `game_levels` | Gắn skill vào template phá tính tái dùng — mất toàn bộ giá trị của mô hình |
| `BR-GTC-02` (parse ở server) | `content_pack` **phải parse được** bằng `content_contract`, kiểm ở **server** trước khi ghi | Một `content_pack` sai schema làm crash engine trong lúc trẻ đang chơi |
| `BR-GTC-03` (tách nội dung/độ khó) | `content_pack` giữ **nội dung**; `difficulty_params` giữ **độ khó**. Cấm trộn | Tách đôi tồn tại để đổi nội dung không cần code, và đổi độ khó không cần biên tập |
| `BR-GTC-04` (Lớp 1) | Template là **Lớp 1** — admin cấm tạo/sửa qua UI | Template là code. Sửa từ UI làm dữ liệu trỏ tới Session class không tồn tại |
| `BR-GTC-05` (band tuổi) | Mỗi template khai báo `age_min`/`age_max` và **mechanic bị cấm theo band** | Drag chính xác ở tuổi 3–4 là thiết kế sai, không phải độ khó cao |
| `BR-GTC-06` (fallback tap) | Template có mechanic drag **bắt buộc** khai báo fallback tap-tap cho band 3–4 | Drag là cử chỉ khó nhất ở tuổi này |
| `BR-GTC-07` (xuất JSON Schema) | `content_contract` phải xuất được sang **JSON Schema**, và phải **suy ra kiểu TS** được (`z.infer`) | JSON Schema cho studio sinh form ([`schema-driven-form.md`](../06-admin/schema-driven-form.md)); kiểu TS cho seeder bắt lỗi lúc `tsc` (`BR-CSA-12`) |
| `BR-GTC-08` (breaking change) | Đổi `content_contract` của template đã publish = **breaking change**, cần migration kế hoạch | Mọi `game_level` đã seed giữ `content_pack` parse được bằng contract **cũ**. Đổi contract mà không migrate = level cũ fail parse ở `BR-GTC-02` — phát hiện lúc trẻ mở màn chơi, không phải lúc deploy |
| `BR-GTC-09` (checkWinCondition thuần) | `checkWinCondition()` **thuần** — cấm side effect | Nó được gọi nhiều lần mỗi frame |
| `BR-GTC-10` (round-trip test) | Test round-trip `content_pack` × `content_contract` chạy trên **toàn bộ** level đã seed. **Chưa nối vào cổng nào** — đo 2026-08-29: 162 trên 228 level không parse được, xem mục 7.3a của [`content-seed-authoring.md`](content-seed-authoring.md) | Một level lọt lưới là một đứa trẻ gặp màn hình trắng |

## 7. Data

### 7.1 Hình dạng `GameTemplate`

```ts
interface GameTemplate {
  code: `GT-${string}`;              // bất biến
  name: string;
  mechanic: MechanicId;
  layouts: LayoutId[];
  content_contract: ZodType;         // shape của content_pack
  difficulty_contract: ZodType;      // shape của difficulty_params
  limits: {
    item_count: [min: number, max: number];
    distractor_count: [min: number, max: number];
    target_count: [min: number, max: number];
  };
  age_min: 3 | 4 | 5 | 6;
  age_max: 3 | 4 | 5 | 6;
  banned_age_bands?: AgeBand[];      // band mà mechanic này không phù hợp
  requires_tap_fallback: boolean;    // true cho mọi mechanic drag
  asset_kinds: ("emoji" | "image" | "audio")[];
  scoring: ScoringSchema;
  events: EventName[];               // tập con của event-catalog
  engine_session: string;            // tên Session class
  status: ContentStatus;
  version: number;
}
```

### 7.2 Sáu template MVP

> **Trạng thái 2026-08-29:** registry có **27** template, `GT-001` tới `GT-027`. Sáu template
> dưới đây là lô MVP; 21 template còn lại thuộc ba lô sau, danh mục ở
> [`montessori-template-batch.md`](montessori-template-batch.md),
> [`legacy-v1-template-batch.md`](legacy-v1-template-batch.md) và
> [`taxonomy-gap-batch.md`](taxonomy-gap-batch.md). Bảng tra đủ 27 mã kèm cơ chế, band tuổi và
> fallback tap: [`engines/index.md`](engines/index.md). Mỗi mã có một phiếu spec riêng theo
> [`engine-spec-sheet.md`](engine-spec-sheet.md).


| Code | Tên | Mechanic | Band | Fallback tap | Giới hạn item |
|---|---|---|---|:--:|---|
| `GT-001` | Chọn một đáp án | `tap-select` | 3–6 | n/a | 2–6 |
| `GT-002` | Chọn nhiều đáp án | `tap-select-multi` | 4–6 | n/a | 3–8 |
| `GT-003` | Kéo vào đích | `drag-to-container` | 3–6 | có | 2–6 |
| `GT-004` | Phân loại vào nhóm | `sort-groups` | 4–6 | có | 4–10 |
| `GT-005` | Ghép cặp | `pair-match` | 3–6 | có | 2–6 cặp |
| `GT-006` | Sắp xếp thứ tự | `sequence-order` | 5–6 | có | 3–5 |

`GT-002` và `GT-006` không cho band 3–4: chọn nhiều đáp án cần giữ nhiều điều kiện trong
trí nhớ làm việc; sắp xếp thứ tự cần biểu diễn quan hệ thứ tự. Cả hai chưa vững ở tuổi đó.

### 7.3 Ví dụ `content_contract` — `GT-004` sort-groups

```ts
const SortGroupsContent = z.object({
  prompt: z.string().min(4).max(80),
  prompt_audio_ref: z.string().optional(),
  groups: z.array(z.object({
    group_id: z.string().regex(/^g[0-9]$/),
    label: z.string().max(24),
    label_emoji: EmojiRef,          // ký tự UTF-8, thành viên @mindkid/emoji
  })).min(2).max(4),
  items: z.array(z.object({
    item_id: z.string(),
    asset: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
      z.object({ kind: z.literal("image"), path: z.string() }),
    ]),
    correct_group_id: z.string(),   // refine: phải thuộc groups[]
  })).min(4).max(10),
}).refine(everyItemTargetsAnExistingGroup)
  .refine(everyGroupHasAtLeastOneItem);

const SortGroupsDifficulty = z.object({
  distractor_count: z.number().int().min(0).max(3),
  hint_after_ms: z.number().int().min(8000).max(40000),
  allow_retry: z.boolean(),
  shuffle_items: z.boolean(),
});
```

Hai `refine` cuối là lý do `content_contract` phải là **Zod**, không phải JSON Schema thuần
— ràng buộc quan hệ giữa các field không biểu diễn được bằng JSON Schema.

Xuất sang JSON Schema cho form studio **bỏ mất** hai refine đó — vì vậy server luôn parse
lại bằng Zod thật trước khi ghi (`BR-GTC-02`).

Seeder không gặp vấn đề này: nó dùng thẳng `z.infer<typeof SortGroupsContent>` làm kiểu,
và cổng 1 của [`content-seed-authoring.md`](content-seed-authoring.md) chạy `SortGroupsContent.parse()` — còn đủ cả hai
`refine`.

### 7.4 Interface Session

```ts
interface GameSession {
  setupEntities(): void;
  validateAction(a: { type: string; data: unknown }): { valid: boolean; feedback: FeedbackKind };
  checkWinCondition(): boolean;      // PHẢI thuần
  render?(ctx: CanvasRenderingContext2D, rs: RenderSystem, timeMs: number): void;
  update?(deltaMs: number): void;
  getTelemetry(): SessionTelemetry;
  completeSession(): void;
  destroy(): void;
}
```

Side effect khi item được đặt đúng đi vào `onItemLocked`, cấm — **NEVER** trong `validateAction`
(được gọi cả lúc hover) hay `checkWinCondition` (được gọi nhiều lần mỗi frame).

## 8. API contract

### `GET /api/guest/templates`

| | |
|---|---|
| Auth | không |
| 200 | `{ templates: [{ code, name, mechanic, age_min, age_max }] }` — metadata, không có contract |

### `GET /api/managers/templates/{code}/contract`

| | |
|---|---|
| Auth | `requireManagerAuth()` |
| 200 | `{ code, content_contract_json_schema, difficulty_contract_json_schema, limits, ui_hints }` |

Dùng để studio sinh form. Xem [`schema-driven-form.md`](../06-admin/schema-driven-form.md).

| Mã lỗi | HTTP |
|---|---|
| `TEMPLATE_NOT_SUPPORTED` | 422 |
| `CONTENT_PACK_INVALID` | 422 + `details.issues[]` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-GTC-02 — content_pack sai schema bị chặn ở server
  Given manager tạo game level với content_pack thiếu field groups
  When gửi lên server
  Then hệ thống trả 422 CONTENT_PACK_INVALID
  And details.issues nêu rõ field thiếu
  And không hàng nào được ghi

Scenario: BR-GTC-10 — round-trip toàn bộ level đã seed
  Given DB đã seed đầy đủ game level
  When chạy test round-trip content_pack qua content_contract của template tương ứng
  Then 100% level parse thành công

Scenario: BR-GTC-01 — template không mang skill
  When đọc định nghĩa của mọi template
  Then không template nào có field skill_id hay competency_id

Scenario: BR-GTC-03 — không trộn nội dung và độ khó
  Given content_contract của GT-004
  When kiểm các key của nó
  Then không key nào thuộc nhóm độ khó như distractor_count hay hint_after_ms

Scenario: BR-GTC-05 — mechanic bị cấm theo band được ép
  Given template GT-006 có age_min = 5
  When manager tạo level GT-006 với age_min = 3
  Then hệ thống trả 422
  And lý do nêu ràng buộc band tuổi của template

Scenario: BR-GTC-06 — template drag có fallback tap
  When đọc mọi template có mechanic chứa "drag"
  Then requires_tap_fallback là true
  And Session class tương ứng có đường xử lý tap-tap

Scenario: BR-GTC-09 — checkWinCondition thuần
  Given một phiên chơi đang chạy
  When gọi checkWinCondition 100 lần liên tiếp
  Then trạng thái phiên không đổi
  And không telemetry event nào được sinh ra

Scenario: BR-GTC-04 — admin không tạo được template
  Given manager super_admin đã đăng nhập
  When gọi POST /api/managers/templates
  Then route không tồn tại hoặc trả 405

Scenario: mỗi template có E2E journey
  When kiểm thư mục test e2e
  Then mỗi template trong `GT-001`…`GT-006` có ít nhất một journey xanh
```

## 10. Boundaries

**Always**
- Kiểm `content_pack` bằng `content_contract` ở server trước khi ghi.
- Giữ `checkWinCondition()` thuần.
- Khai báo fallback tap cho mọi mechanic drag.
- Test round-trip trên toàn bộ level đã seed.

**Ask first**
- Thêm template mới.
- Đổi `content_contract` của template đã publish.
- Nới `limits` của một template.
- Cho một template chạy ở band tuổi mới.

**Never**
- Gắn skill vào template.
- Trộn nội dung và độ khó.
- Cho admin tạo/sửa template qua UI.
- Side effect trong `checkWinCondition` hoặc `validateAction`.
- Tin `content_pack` từ client mà không parse lại.

## 11. Open questions

> `phase: P1` ở trên là phase **implement** (khi 6 template MVP thật sự được build), không
> phải phase **approve**. File này approve **bây giờ**, ở P0, vì [`schema-content-taxonomy.md`](schema-content-taxonomy.md)
> (P0, `depends_on` nó) cần hình dạng `GameTemplate` ổn định trước. Approve = *hình dạng*
> contract (§7.1, §7.4) đã chốt. Sáu template chỉ được seed ở P1 cùng contract và runtime thật;
> P0 không tạo hàng `active` rỗng để đạt số đếm (`D-CG`). Đổi hình dạng sau này là version mới
> của spec, không phải sửa im lặng.

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~60 game type của v1 port thành `content_pack` của 6 template được bao nhiêu phần trăm?~~ **Đóng 2026-08-29 (T113, `D-SG`)**: không port sang 6 template mà cấp cơ chế riêng. 60 game type của [`game-type-migration.md`](../../taxonomy/game-type-migration.md) nay phủ bởi 27 engine — 6 MVP cộng 11 lô Montessori, 7 lô kế thừa v1, 3 lô khoảng trống taxonomy. Câu hỏi còn lại không phải số cơ chế mà là chiều sâu nội dung mỗi cơ chế, và nó chuyển sang [`engine-content-depth.md`](../05-content/engine-content-depth.md) | — | Đã đóng | D-SG |
| ~~2~~ | ~~Template thứ 7–10 nên là gì?~~ **Đóng 2026-08-20 (T98, `D-RW`)**: mười một khuôn `GT-007` tới `GT-017` đã có danh mục, band tuổi và điều kiện nghiệm thu ở [`montessori-template-batch.md`](montessori-template-batch.md), suy ra từ 59 dạng bài của corpus Montessori chứ không từ danh sách mechanic của PRD. Maze và rotate nằm trong đó (`GT-013`, `GT-016`); memory-flip **không** — không dạng bài nguồn nào cần nó | — | Đã đóng | D-RW |
| ~~3~~ | ~~`scoring` schema chung cho mọi template hay mỗi template một kiểu?~~ **Đóng 2026-08-09 (T13, `D-BA`)**: xem [`scoring-and-result.md`](../04-play/scoring-and-result.md) — P1 dùng `scoring` schema chung (rounds/timer), sequence-order chấm cả chuỗi ở P1 | — | Đã đóng | D-BA |

| ~~4~~ | ~~Xuất Zod → JSON Schema mất `refine`, nên form studio không cảnh báo được ràng buộc quan hệ tới lúc submit. Có nên khai `refine` dạng ui-hint riêng để form biết trước không?~~ **Đóng 2026-08-09 (T13, `D-BK`)**: dùng custom serializer để khai `uiHint` cho `refine` đơn giản ở client — xem [`schema-driven-form.md`](../06-admin/schema-driven-form.md); các `refine` quan hệ phức tạp validate tại server | — | Đã đóng | D-BK |
