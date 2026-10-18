---
spec: SOURCE-GAME-TYPE-COVERAGE
title: Cổng phủ 60 dạng game nguồn và xương truy vết
area: quality
status: implemented
mvp: true
phase: P0
reviewed: 2026-10-18
owns:
  - Danh mục 60 dạng game nguồn (`D1-01..D6-11`) và song ánh sang competency (`C1-01..C6-03`)
  - Bậc thang phủ 60 dạng game nguồn (Bậc 0 đến Bậc 3)
  - Nguồn sự thật cho trường `legacy_v1_ref`
  - Luật mọi dạng game nguồn có khuôn chạy được hoặc có lý do không làm khuôn
  - Bảng tra tên khuôn thiết kế `tpl-*` sang mã `GT-*`
depends_on:
  - GAME-LEVEL-MODEL
  - GAME-TEMPLATE-CONTRACT
  - CONTENT-SEED-AUTHORING
  - ENGINE-CONTENT-DEPTH
  - CONFIG-OWNERSHIP
---

# Cổng phủ 60 dạng game nguồn và xương truy vết

> **Tên định danh trong code.** Cột `legacy_v1_ref`, hằng `LEGACY_V1_GAME_TYPES` /
> `LEGACY_V1_ID_SET`, file `legacy-v1-game-types.ts` / `legacy-v1-coverage.ts` /
> `legacy-v1-coverage.json` và lệnh `check:legacy-v1` mang tên cũ; nghĩa của chúng là
> *mã dạng game nguồn*. Tên code sẽ đổi ở [Task #312](../../tasks/312-legacy-ref-identifier-rename-plan.md).

## 1. Objective

Nội dung MindKid được dựng để phủ một danh mục cố định gồm **60 dạng game nguồn** (mã
`D1-01..D6-11`), mỗi dạng ánh xạ song ánh sang đúng một competency (`C1-01..C6-03`). Spec này
cho người phụ trách nội dung một con số đo được: bao nhiêu dạng game nguồn đã có đủ level
chơi được, thay vì một lời khẳng định. Mỗi level khai mã dạng game nguồn mà nó hiện thực; cổng
chỉ đếm level đã qua `content_contract` và `difficulty_contract` của template, nên nhãn gắn
lên một level hỏng không làm tăng độ phủ.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người viết seed nội dung | Ghi `packages/content` | Gắn `legacy_v1_ref` vào header level |
| Dev | Ghi `packages/content-build`, `packages/shared` | Sửa registry, cổng, bậc thang |
| Cổng tự động | — | `pnpm check:legacy-v1` trong phase 1 của `scripts/check.sh`; Gate 2 của seed pipeline |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `pnpm check:legacy-v1` | Cổng, dev | Gọi `pnpm --filter @mindkid/content-build check:legacy-v1` → `tsx src/gates/legacy-v1-coverage.ts` |
| `pnpm --filter @mindkid/content-build seed:check` | Dev | Seed pipeline; Gate 2 từ chối mã lạ (`BR-LVC-02`) |
| `packages/shared/src/constants/legacy-v1-game-types.ts` | Dev | Registry 60 dạng game nguồn |
| `packages/content-build/src/thresholds/legacy-v1-coverage.json` | Dev | Bậc thang; `packages/db/config/legacy-v1-coverage.json` là symlink tới file này |

Không có route HTTP.

## 4. Main flow

1. Người viết seed khai `legacy_v1_ref: "Dx-yy"` trong `ContentSeedHeader`
   (`packages/content/src/types.ts`) của một level.
2. Gate 2 của seed pipeline (`checkGate2` trong `packages/content-build/src/gates/runner.ts`)
   từ chối mã không thuộc `LEGACY_V1_ID_SET` với lỗi `LEGACY_V1_REF_INVALID`.
3. Khi seed vào DB, giá trị đi vào cột `game_levels.legacy_v1_ref`
   (`packages/db/src/schema/game.ts`), không vào `content_pack`.
4. `pnpm check:legacy-v1` nạp toàn bộ seed level (`ALL_SEED_LEVELS`), giữ lại level có
   `legacy_v1_ref` hợp lệ **và** qua `content_contract` + `difficulty_contract` của template.
5. Cổng đếm level hợp lệ theo từng dạng game nguồn, so với `min_levels_per_type` của bậc đang
   bật (`active_step`), rồi đếm số dạng đạt.
6. Số dạng đạt ≥ `min_types_covered` của bậc đang bật → exit 0; ngược lại exit 1.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Danh sách level rỗng | Không nạp được seed | Cổng ném lỗi, exit 1 (`BR-LVC-05`) |
| `active_step` không có trong `steps` | Cấu hình sai | Cổng rơi về bậc đầu tiên; không có bậc nào thì ném lỗi |
| Level có nhãn nhưng hỏng contract | `safeParse` thất bại | Không được đếm (`BR-LVC-03`) |
| Mã `legacy_v1_ref` lạ | Không thuộc 60 mã | Gate 2 báo `LEGACY_V1_REF_INVALID` (`BR-LVC-02`) |
| Level không khai `legacy_v1_ref` | Trường vắng | Hợp lệ; level đó không tính vào độ phủ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LVC-01` | Registry `LEGACY_V1_GAME_TYPES` có đúng 60 hàng, song ánh 1-1 giữa `legacy_id` (`^D[1-6]-\d{2}$`) và `competency_id` (`^C[1-6]-\d{2}$`), không trùng, không sót | Thiếu hay trùng một hàng thì mẫu số 60 của độ phủ sai, và một competency có thể bị đếm hai lần |
| `BR-LVC-02` | `legacy_v1_ref`, nếu khai, phải thuộc `LEGACY_V1_ID_SET`. Mã lạ bị Gate 2 từ chối | Một mã gõ sai không được lặng lẽ biến thành level không thuộc dạng nào |
| `BR-LVC-03` | Một dạng game nguồn được tính "đã phủ" khi có ≥ `min_levels_per_type` level khai đúng `legacy_v1_ref` **và** qua `content_contract` + `difficulty_contract` của template | Nhãn gắn trên level hỏng không phải độ phủ thật |
| `BR-LVC-04` | Bậc thang trong `packages/content-build/src/thresholds/legacy-v1-coverage.json`: Bậc 0 (1 level/dạng, 20 dạng) · Bậc 1 (10, 51) · Bậc 2 (10, 57) · **Bậc 3 (10, 59)**. Bậc đang bật: 3 | Mức 59/60 có chủ đích: `D5-08` chỉ có 5 level vì trần 5 level một cặp kỹ năng-khuôn (`BR-SKQ-04`) của `C1.MEAS.13` |
| `BR-LVC-05` | Cổng `check:legacy-v1` fail khi danh sách level rỗng hoặc không đọc được nguồn | Không có dữ liệu mà báo xanh là xanh giả |
| `BR-LVC-06` | Cấm — NEVER lưu `legacy_v1_ref` trong `content_pack` | Mã truy vết là metadata biên tập; engine không đọc, và `content_pack` thuộc `content_contract` của template |
| `BR-LVB-15` · `BR-LVB-10` (không dạng game nguồn nào mồ côi) | Mỗi dạng game nguồn trỏ tới một `template_code` có trong registry engine. Dạng nào quyết định không làm khuôn thì có một hàng ở mục 7.1 kèm lý do và điều kiện mở lại; cấm — NEVER bỏ im lặng. Đo 2026-10-18: 60/60 dạng có `template_code`, mục 7.1 rỗng, và test kiểm sự tồn tại trong registry cho toàn bộ 60/60 dạng (`GT-001..GT-036`) | Không có luật này thì "phủ xong chưa" là câu trả lời theo cảm giác, và một cơ chế bị bỏ mà không ghi lý do sẽ được người sau đề xuất lại |

## 7. Data

**Đọc:** `ALL_SEED_LEVELS` (`packages/content-build/src/catalog.ts`), `LEGACY_V1_GAME_TYPES`,
`ALL_TEMPLATES` (`@mindkid/game-engine/registry`), file bậc thang.
**Ghi:** cột `game_levels.legacy_v1_ref` khi seed.

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `ContentSeedHeader.legacy_v1_ref` | `string?` | Thuộc `LEGACY_V1_ID_SET` |
| `game_levels.legacy_v1_ref` | `text` nullable | Giá trị từ header; không nằm trong `content_pack` |
| `LegacyV1GameType.legacy_id` | `string` | `^D[1-6]-\d{2}$`, duy nhất |
| `LegacyV1GameType.competency_id` | `string` | `^C[1-6]-\d{2}$`, duy nhất |
| `LegacyV1GameType.template_code` | `string` | `^GT-\d{3}$` |
| `LegacyV1GameType.name_vi`, `primary_skills` | `string`, `string[]` | Tên không rỗng, ≥1 kỹ năng |
| `legacy-v1-coverage.json` | `{ active_step, steps[], history[] }` | Mỗi bậc có `min_levels_per_type`, `min_types_covered` |

### 7.1 Dạng game nguồn không làm khuôn

Rỗng. Hai dạng `D3-05` Tự tạo quy luật và `D3-06` Tạo nhịp từng được ghi ở đây (cơ chế
`free-create`, không có đáp án đúng nên không chấm được theo `BR-GTC-09`); nay chúng chạy trên
`GT-036` và `GT-034`. Thêm một hàng ở đây bắt buộc có lý do và điều kiện mở lại (`BR-LVB-10`).

### 7.2 Tên khuôn thiết kế `tpl-*` sang mã `GT-*`

[`game-type-migration.md`](../../taxonomy/game-type-migration.md) gọi khuôn bằng tên thiết kế
`tpl-*`, không phải mã. Mã thật của từng dạng game nguồn là `template_code` trong registry
(`packages/shared/src/constants/legacy-v1-game-types.ts`) — bảng dưới **suy ra** từ registry
ngày 2026-10-18, chỉ để đọc tài liệu taxonomy; lệch nhau thì registry thắng.

| Tên thiết kế | Mã `GT-*` | Tên thiết kế | Mã `GT-*` |
|---|---|---|---|
| `tpl-tap-select` | `GT-001` · `GT-032` | `tpl-flash-recall` | `GT-012` |
| `tpl-tap-count` | `GT-028` | `tpl-maze-route` | `GT-013` · `GT-035` |
| `tpl-drag-to-container` | `GT-003` · `GT-029` | `tpl-balance` | `GT-014` |
| `tpl-coin-count` | `GT-031` | `tpl-grid-fill` | `GT-015` |
| `tpl-pair-match` | `GT-005` | `tpl-clock-set` | `GT-016` |
| `tpl-drag-to-order` | `GT-006` · `GT-030` | `tpl-listen-respond` | `GT-018` |
| `tpl-sequence-arrange` | `GT-006` | `tpl-rotate-transform` | `GT-019` |
| `tpl-drag-to-slot` | `GT-008` · `GT-033` | `tpl-memory-flip` | `GT-020` |
| `tpl-logic-grid` | `GT-009` | `tpl-mirror-complete` | `GT-021` |
| `tpl-free-create` | `GT-034` · `GT-036` | `tpl-hidden-object` | `GT-022` |
| `tpl-construct` | `GT-023` | `tpl-trace-path` | `GT-024` |

Ba tên không dạng game nguồn nào dùng, chỉ phục vụ khoảng trống taxonomy: `tpl-spot-difference`
→ `GT-025`, `tpl-go-nogo` → `GT-026`, `tpl-rule-switch` → `GT-027` (lô `taxonomy-gap`, mục 7.5
của [`engine-spec-sheet.md`](../01-platform/engine-spec-sheet.md)).

## 8. API contract

Không có route. Ràng buộc lên cổng:

```
pnpm check:legacy-v1                     → BR-LVC-03..05, phase 1 của scripts/check.sh
Gate 2 (content-build runner)            → BR-LVC-02, lỗi LEGACY_V1_REF_INVALID
packages/shared/tests/legacy-v1-game-types.test.ts         → BR-LVC-01, BR-LVB-15 (template_code có trong registry)
packages/content-build/tests/gates/legacy-v1-coverage.test.ts → BR-LVC-03/04, hai ca âm
```

## 9. Acceptance criteria

```gherkin
Scenario: BR-LVC-01 — registry đúng 60 hàng song ánh
  Given registry LEGACY_V1_GAME_TYPES
  When chạy packages/shared/tests/legacy-v1-game-types.test.ts
  Then có đúng 60 legacy_id và 60 competency_id không trùng
  And thiếu một mã thì test nêu đích danh mã thiếu

Scenario: BR-LVC-02 — mã lạ bị Gate 2 từ chối
  Given một seed level khai legacy_v1_ref "D9-99"
  When chạy seed pipeline
  Then Gate 2 báo LEGACY_V1_REF_INVALID

Scenario: BR-LVC-03 — gỡ nhãn làm giảm độ phủ
  Given corpus seed đang đạt bậc 3
  When gỡ legacy_v1_ref khỏi mọi level của D1-10
  Then D1-10 không còn được tính là đã phủ

Scenario: BR-LVC-03 — level hỏng contract không được đếm
  Given level D1-10 có content_pack không qua content_contract
  When chạy cổng
  Then level đó không được đếm cho D1-10

Scenario: BR-LVB-15 — dạng game nguồn mồ côi bị bắt
  Given một dạng game nguồn có template_code không có trong registry engine
  And nó cũng không có hàng ở mục 7.1
  When chạy packages/shared/tests/legacy-v1-game-types.test.ts
  Then test đỏ và nêu mã khuôn đó

Scenario: BR-LVC-05 — danh sách rỗng thì đỏ
  Given danh sách level rỗng
  When gọi checkLegacyV1Coverage
  Then cổng ném lỗi
```

## 10. Boundaries

**Always**
- Gắn `legacy_v1_ref` cho level hiện thực một dạng game nguồn.
- Đổi bậc trong `legacy-v1-coverage.json` kèm một dòng `history`.

**Ask first**
- Hạ `min_types_covered` hay `min_levels_per_type` của bậc đang bật.
- Sửa ánh xạ `legacy_id` ↔ `competency_id` trong registry.

**Never**
- Lưu `legacy_v1_ref` trong `content_pack`.
- Đếm level chưa qua `content_contract` vào độ phủ.
- Báo xanh khi không nạp được level.
- Bỏ một dạng game nguồn mà không ghi hàng ở mục 7.1.

## 11. Open questions

Không có.
