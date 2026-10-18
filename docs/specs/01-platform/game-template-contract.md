---
spec: GAME-TEMPLATE-CONTRACT
title: Contract khuôn trò chơi
area: platform
status: approved
mvp: true
phase: P1
reviewed: 2026-10-18
open_tasks:
  - "#305"
owns:
  - Hình dạng GameTemplate
  - content_contract và difficulty_contract
  - Sáu template MVP
  - Đường phán quyết khi trẻ không hành động trong hợp đồng GameSession
  - Luật hành vi chung của Session (xáo trộn có seed, event vòng, kiểm soát lỗi tự thân, band khuôn thắng band nguồn)
depends_on:
  - GLOSSARY
  - ID-CONVENTIONS
  - CONTENT-LIFECYCLE
---

# Contract khuôn trò chơi

> **Chưa hoàn thành** — `BR-GTC-10` chưa có test round-trip `content_pack` × `content_contract` trên toàn bộ level seed và chưa nối vào `scripts/check.sh`. Việc còn lại: [Task #305](../../tasks/305-platform-api-gaps-plan.md).

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
| `packages/game-engine/src/templates/` | Nguồn sự thật duy nhất (code registry `ALL_TEMPLATES`) |
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
7. Đăng ký vào registry `ALL_TEMPLATES` trong `packages/game-engine/src/templates/index.ts`.

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
| `BR-GTC-11` (asset nhận chữ) | `assetSchema()` khai đúng ba nhánh `emoji` · `image` · `text`; mọi `content_contract` dùng chung helper đó, cấm — NEVER khai lại union tại chỗ | Kỹ năng chữ số và chữ cái cần một khe cho ký tự; không có nhánh `text` thì bảng chữ cái phải dạy bằng ảnh em bé. Nhánh đã có ở [`shared-fields.ts:16`](../../../packages/game-engine/src/contracts/shared-fields.ts) và lớp vẽ đã xử lý nó — union khai lại tại chỗ là chỗ nhánh đó biến mất. Đo 2026-09-03: **một** vi phạm, [`GT-000/template.ts:15`](../../../packages/game-engine/src/templates/GT-000/template.ts) khai union hai nhánh tại chỗ, và GT-000 chính là engine ngữ âm. Nguồn vật thì thuộc `BR-SDS-02` (vật phải là vật của kỹ năng) |
| `BR-TGB-04` (không-hành-động là một phán quyết) | Session phán quyết được việc trẻ **không** chạm khi cửa sổ thời gian đóng. Đường đó nằm trong hợp đồng `GameSession` dùng chung — `update(deltaMs)` trả `ActionResult \| null` (mục 7.4) — không nằm riêng trong Session của một khuôn | Cài riêng trong một Session thì khuôn thứ hai cần nó sẽ cài lại lần nữa, đúng thứ `BR-TAK-05` cấm. `GT-026` là khuôn đầu tiên dùng đường này |
| `BR-TGB-05` (không-hành-động vẫn có phản hồi) | Hết thời gian mà trẻ không chạm thì vẫn phát phản hồi, cấm — NEVER im lặng | `BR-ENG-07` — sai đáp án luôn có phản hồi. Không hành động cũng là một đáp án |
| `BR-LVB-09` (phát event vòng ngay từ đầu) | Khuôn `GT-018` tới `GT-024` **bắt buộc** phát `round_started` và `round_completed` theo `BR-RSP-02` ngay ở phiên bản đầu tiên | Thiếu event vòng thì `rounds_total = 0` và không trẻ nào lên được hai sao — xem mục 1 của [`round-sequence-play.md`](../04-play/round-sequence-play.md). Khuôn mới kế thừa lỗ đó là nhân lỗ lên |
| `BR-LVB-11` (khuôn mới không đổi contract cũ) | Thêm khuôn mới cấm — NEVER đổi `content_contract` của bất kỳ khuôn nào đã publish | `BR-GTC-08` (breaking change). Mọi `game_level` đã seed giữ `content_pack` parse được bằng contract cũ |
| `BR-MTB-07` · `BR-LVB-13` (xáo trộn qua nguồn ngẫu nhiên có seed) | Mọi xáo trộn vị trí, thứ tự vật gây nhiễu, chọn biến thể trong Session phải đi qua [`deterministic-randomness.md`](deterministic-randomness.md) | `BR-LAY-08` giao việc xáo trộn cho spec ngẫu nhiên chứ không cho hàm layout. Phiên chơi không tái lập được thì không điều tra được báo cáo bất thường của một đứa trẻ cụ thể |
| `BR-MTB-09` (khuôn không mang xuất xứ nguồn) | Khuôn **không gắn** skill, competency, workbook hay mã dạng game nguồn trong code. Xuất xứ là ghi chú cho người đọc ở phiếu engine, cấm thành field | `BR-GTC-01` (template không gắn skill) — field xuất xứ trong khuôn là đường để skill quay lại vào template |
| `BR-MTB-10` · `BR-TCL-08` (band khuôn thắng band nguồn) | Band tuổi của level nằm trong `age_min`..`age_max` và ngoài `banned_age_bands` của khuôn. Khi band của nguồn nội dung (workbook, dạng game nguồn) rộng hơn band khuôn, **khuôn thắng**: dạng bài dời band hoặc chờ | `BR-GTC-05` ép ở cổng seed. Khuôn cấm band nào là có lý do phát triển; nới band khuôn để nội dung vừa là đổi quyết định thiết kế bằng áp lực lịch |
| `BR-MTB-12` (không mở rộng asset im lặng) | Khuôn cần loại asset ngoài `emoji`, `image`, `audio` phải **Ask first** trước khi viết `template.ts` | Mỗi loại asset mới kéo theo storage, quyền, và ngân sách ở [`performance-budgets.md`](../08-quality/performance-budgets.md). Phát hiện điều đó sau khi Session class đã xong là quá muộn |
| `BR-MTB-14` (kiểm soát lỗi tự thân) | Khuôn `GT-007` tới `GT-017` phải cho trẻ **tự nhận ra sai** từ chính vật liệu, trước khi phản hồi đúng-sai của hệ thống chạy; mô tả cách đó trong file mô tả khuôn | Nguyên lý kiểm soát lỗi tự thân (mục 7.0 của [`montessori-corpus-mapping.md`](../05-content/montessori-corpus-mapping.md)): hình không khớp khuôn, tổng hai bên không cân, lưới lặp giá trị. Khuôn chỉ báo sai bằng dấu đỏ đã bỏ đúng thứ làm giáo cụ hoạt động |

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
  kind: "assess" | "teach";          // assess = kiểm tra, teach = làm quen khái niệm (GT-000)
  scoring: ScoringSchema;
  events: EventName[];               // tập con của event-catalog
  engine_session: string;            // tên Session class
  status: ContentStatus;
  version: number;
}
```

### 7.2 Sáu template MVP

> Registry có **38** template, `GT-000` tới `GT-037` (`packages/game-engine/src/templates/`).
> Sáu template dưới đây là lô MVP. Các mã còn lại chia theo lô `core-pedagogy` (`GT-000`),
> `montessori` (`GT-007` tới `GT-017`), `activity-catalog` (`GT-018` tới `GT-024`, `GT-028` tới
> `GT-036`) và `taxonomy-gap` (`GT-025` tới `GT-027`, `GT-037`); dãy mã và lớp chi phí từng lô
> ở mục 7.5 của [`engine-spec-sheet.md`](engine-spec-sheet.md), luật cấp mã ở mục 6 của file đó.
> Bảng tra đủ 38 mã kèm cơ chế, band tuổi và fallback tap: [`engines/index.md`](engines/index.md).
> Mỗi mã có một phiếu spec riêng.

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
  groups: z.array(z.object({
    group_id: z.string().regex(/^g[0-9]$/),
    label: z.string().max(24),
    label_emoji: z.string().min(1),  // ký tự UTF-8, không ràng buộc (BR-EMJ-01)
  })).min(2).max(4),
  items: z.array(z.object({
    item_id: z.string(),
    asset: assetSchema(),   // emoji | image | text — BR-GTC-11
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
  update?(deltaMs: number): ActionResult | void | null;
  getTelemetry(): SessionTelemetry;
  completeSession(): void;
  destroy(): void;
}
```

Side effect khi item được đặt đúng đi vào `onItemLocked`, cấm — **NEVER** trong `validateAction`
(được gọi cả lúc hover) hay `checkWinCondition` (được gọi nhiều lần mỗi frame).

**Phán quyết khi trẻ không hành động** (`BR-TGB-04`, `BR-TGB-05`). `ActionResult` thường sinh
từ `validateAction(action)`; một lượt trẻ **không** chạm thì không có `GameAction` nào. Đường
chung là `update(deltaMs)`: engine gọi nó mỗi frame
([`game-session.ts`](../../../packages/game-engine/src/game-session.ts)), và khi cửa sổ thời gian
đóng mà không có thao tác, Session trả một `ActionResult` kèm phản hồi; mọi frame khác trả
`null` hoặc không trả gì. Hai đường khác đã bị loại: thêm `checkTimeout()` vào hợp đồng bắt mọi
Session cài một hàm mà gần như không Session nào dùng; engine sinh `GameAction` giả kiểu
`timeout` làm telemetry ghi một hành động trẻ không làm.

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

Scenario: BR-GTC-11 — asset chữ parse được
  Given một content_pack mang asset kind text với text là "5"
  When parse bằng content_contract của GT-001
  Then parse thành công

Scenario: BR-GTC-11 — không contract nào khai lại union asset
  When đọc mọi content_contract trong packages/game-engine/src/templates
  Then không file nào dựng discriminatedUnion cho asset tại chỗ
  And mọi file dùng assetSchema()

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

Scenario: BR-TGB-04 — không hành động vẫn ra phán quyết
  Given một lượt GT-026 có dấu cấm chạm và cửa sổ thời gian 2 giây
  When trẻ không chạm gì cho tới khi cửa sổ đóng
  Then update trả một ActionResult và phiên ghi nhận một lượt đúng
  And đường phán quyết đó nằm trong hợp đồng GameSession dùng chung

Scenario: BR-TGB-05 — không hành động vẫn có phản hồi
  Given một lượt GT-026 có dấu phải chạm
  When trẻ không chạm gì cho tới khi cửa sổ đóng
  Then trẻ nhận một phản hồi thấy được
  And phản hồi đó không phải im lặng

Scenario: BR-LVB-09 — khuôn GT-018 tới GT-024 phát event vòng
  Given một phiên chơi GT-021 hoàn thành
  When đọc chuỗi telemetry của phiên
  Then chuỗi chứa ít nhất một round_started
  And chuỗi chứa ít nhất một round_completed

Scenario: BR-LVB-11 — khuôn mới không đụng contract cũ
  Given cây làm việc trước khi thêm một khuôn mới
  When khuôn mới đã ship
  Then không content_contract nào của khuôn đã publish bị đổi

Scenario: BR-MTB-07 — phiên chơi tái lập được
  Given một phiên chơi GT-011 với một seed cố định
  When chạy lại phiên với cùng seed
  Then thứ tự và vị trí mọi phần tử giống hệt lần trước

Scenario: BR-MTB-09 — khuôn không mang xuất xứ nguồn
  When đọc file mô tả của mọi khuôn
  Then không khuôn nào có field skill, competency, workbook hay mã dạng game nguồn

Scenario: BR-MTB-10 — band khuôn thắng band nguồn
  Given GT-014 khai age_min bằng 5
  And bảng ánh xạ Montessori xếp workbook 16 ở band 5-6
  When một seeder khai age_min bằng 4 cho một level GT-014
  Then cổng seed fail

Scenario: BR-TCL-08 — band khuôn cấm thì level bị chặn
  Given khuôn GT-024 khai banned_age_bands ["3-4"]
  When soạn một level GT-024 cho band 3-4
  Then cổng seed đỏ và nêu band bị cấm

Scenario: BR-MTB-14 — kiểm soát lỗi tự thân có thật
  Given journey E2E của một khuôn GT-007 tới GT-017
  When đọc các bước của journey
  Then có một bước trẻ tự sửa sau khi vật liệu báo sai
  And bước đó xảy ra trước khi hệ thống hiện phản hồi đúng sai
```

## 10. Boundaries

**Always**
- Kiểm `content_pack` bằng `content_contract` ở server trước khi ghi.
- Giữ `checkWinCondition()` thuần.
- Khai báo fallback tap cho mọi mechanic drag.
- Test round-trip trên toàn bộ level đã seed.
- Phát phản hồi cho một lượt trẻ không hành động, qua `update(deltaMs)` dùng chung.
- Đi qua nguồn ngẫu nhiên có seed cho mọi xáo trộn.

**Ask first**
- Thêm template mới.
- Đổi `content_contract` của template đã publish.
- Nới `limits` của một template.
- Cho một template chạy ở band tuổi mới.
- Thêm loại asset ngoài `emoji`, `image`, `audio` (`BR-MTB-12`).

**Never**
- Gắn skill vào template.
- Trộn nội dung và độ khó.
- Cho admin tạo/sửa template qua UI.
- Side effect trong `checkWinCondition` hoặc `validateAction`.
- Tin `content_pack` từ client mà không parse lại.
- Cài đường phán quyết không-hành-động riêng trong một Session.
- Gắn skill, competency, workbook hay mã dạng game nguồn vào khuôn.

## 11. Open questions

> `phase: P1` ở trên là phase **implement** (khi 6 template MVP thật sự được build), không
> phải phase **approve**. File này approve **bây giờ**, ở P0, vì [`schema-content-taxonomy.md`](schema-content-taxonomy.md)
> (P0, `depends_on` nó) cần hình dạng `GameTemplate` ổn định trước. Approve = *hình dạng*
> contract (§7.1, §7.4) đã chốt. Sáu template chỉ được seed ở P1 cùng contract và runtime thật;
> P0 không tạo hàng `active` rỗng để đạt số đếm (`D-CG`). Đổi hình dạng sau này là version mới
> của spec, không phải sửa im lặng.

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~60 game type trong danh mục chuyển đổi map được vào `content_pack` của 6 template bao nhiêu phần trăm?~~ **Đóng 2026-08-29 (T113, `D-SG`)**: không port sang 6 template mà cấp cơ chế riêng. 60 game type của [`game-type-migration.md`](../../taxonomy/game-type-migration.md) nay phủ bởi 27 engine — 6 MVP cộng 11 lô `montessori`, 7 khuôn đầu của lô `activity-catalog`, 3 lô `taxonomy-gap` (nay registry có 38 mã, mục 7.2). Câu hỏi còn lại không phải số cơ chế mà là chiều sâu nội dung mỗi cơ chế, và nó chuyển sang [`engine-content-depth.md`](../05-content/engine-content-depth.md) | — | Đã đóng | D-SG |
| ~~2~~ | ~~Template thứ 7–10 nên là gì?~~ **Đóng 2026-08-20 (T98, `D-RW`)**: mười một khuôn `GT-007` tới `GT-017` (lô `montessori`, mục 7.5 của [`engine-spec-sheet.md`](engine-spec-sheet.md)) đã có phiếu riêng ở [`engines/index.md`](engines/index.md), suy ra từ 59 dạng bài của corpus Montessori chứ không từ danh sách mechanic của PRD. Maze và rotate nằm trong đó (`GT-013`, `GT-016`); memory-flip **không** — không dạng bài nguồn nào cần nó | — | Đã đóng | D-RW |
| ~~3~~ | ~~`scoring` schema chung cho mọi template hay mỗi template một kiểu?~~ **Đóng 2026-08-09 (T13, `D-BA`)**: xem [`scoring-and-result.md`](../04-play/scoring-and-result.md) — P1 dùng `scoring` schema chung (rounds/timer), sequence-order chấm cả chuỗi ở P1 | — | Đã đóng | D-BA |

| ~~4~~ | ~~Xuất Zod → JSON Schema mất `refine`, nên form studio không cảnh báo được ràng buộc quan hệ tới lúc submit. Có nên khai `refine` dạng ui-hint riêng để form biết trước không?~~ **Đóng 2026-08-09 (T13, `D-BK`)**: dùng custom serializer để khai `uiHint` cho `refine` đơn giản ở client — xem [`schema-driven-form.md`](../06-admin/schema-driven-form.md); các `refine` quan hệ phức tạp validate tại server | — | Đã đóng | D-BK |
