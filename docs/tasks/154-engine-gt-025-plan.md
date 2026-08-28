# Task #154 — Engine `GT-025` Tìm điểm khác biệt

> **Loại task:** lát dọc engine (M) — một trong 27 task của
> [`Task #116`](116-engine-vertical-slices-plan.md). Vị trí **25 / 27** trong thứ tự chương trình.
> **Spec sở hữu:** [`engines/GT-025.md`](../specs/01-platform/engines/GT-025.md) — nâng từ phiếu thành
> spec đủ khuôn SDD, `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:**
> - [`Task #130`](130-engine-gt-001-plan.md) — pilot chứng minh hai khuôn
> - [`Task #115`](115-render-contract-core-plan.md) — cổng `check:render` và khuôn `render()`
> - [`Task #120`](120-engine-spec-contract-plan.md) — khuôn spec engine 16 mục

## 1. Engine này là gì

Trẻ so hai khung cảnh gần giống nhau và chỉ ra chỗ khác. Engine này luyện **so sánh có hệ thống**: quét từng vùng theo thứ tự thay vì nhìn lướt toàn cảnh. Nó thuộc lô khoảng trống taxonomy — được thêm vì không dạng bài v1 nào sinh ra trục quan sát chi tiết này.

**Nguồn dòng cho mục 15 của spec.** Bảng `layouts` · `limits` · `banned_age_bands` ·
`asset_kinds` trích từ [`GT-025/template.ts:52`](../../packages/game-engine/src/templates/GT-025/template.ts) — `BR-ESS-02` buộc spec ghi kèm
nguồn dòng này và cổng so lại với registry lúc chạy.

Lô `taxonomy-gap` (lấp khoảng trống taxonomy). Hôm nay engine có **4 level** trong corpus seed và
**chưa cài `render()`** — trẻ mở một màn `GT-025` ra thì thấy canvas trống.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Giá trị |
|---|---|
| Slug engine | `spot-difference` |
| Lô | `taxonomy-gap` |
| Layout khai trong template | `split-columns` |
| Band engine **cấm** | — |
| Band hợp lệ | `3-4`, `4-5`, `5-6` |
| `limits` | `item_count: [2, 4], distractor_count: [0, 2], target_count: [1, 2]` |
| `requires_tap_fallback` | `false` |
| `asset_kinds` | `emoji` · `image` |
| Trường `content_pack` | `target_count` · `left_objects` · `right_objects` · `differences` |
| Trường `difficulty_params` | `hint_after_ms` · `allow_retry` · `show_counter` |
| Dùng `.refine()` | Không |
| System và mechanic | — không system riêng |
| `session.ts` | 94 dòng |
| Level trong corpus | **4** |
| Thiếu tới sàn bậc 1 (`level_count` ≥6) | **2** |
| `render()` | **Chưa cài** |
| Trạng thái spec | `draft`, khuôn phiếu 11 mục |

### 2.1 Ca sai không bắt được bằng schema

`differences` khai một điểm khác là "vật bên phải nhỏ hơn 10%". Parse sạch; sai vì chênh lệch dưới ngưỡng nhận biết của lứa 4–6 và trẻ không thấy được dù nhìn đúng chỗ. Điểm khác biệt phải khác **về loại** (có với không có, màu này với màu kia), không khác về mức độ nhỏ.

Ca này là lý do engine cần **`BR-E025-*` riêng**: contract Zod chặn được sai schema, nó
cấm — NEVER chặn được sai sư phạm. Mục 6 của spec mới phải biến ca này thành rule có mã.

### 2.2 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
sed -n '1,40p' packages/game-engine/src/templates/GT-025/template.ts
grep -c 'template_code: "GT-025"' -r packages/db/src/seed-content
pnpm --filter @mindkid/game-engine check:render
```

## 3. Work package

### WP154.1 — Nâng phiếu thành spec đủ khuôn SDD

**Cỡ:** S · **Ranh giới PR:** `docs/specs/01-platform/engines/GT-025.md`

Khuôn 16 mục ở mục 4 của [`Task #116`](116-engine-vertical-slices-plan.md), contract ở
[`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md).

1. Frontmatter đủ 9 trường. `spec: ENGINE-GT025`, `engine: spot-difference`,
   `batch: taxonomy-gap`, `owns` ba dòng, `depends_on` bốn spec.
2. Giữ nguyên nội dung 11 mục hiện có, ánh xạ sang mục 1, 3, 7, 12, 13, 14 theo bảng mục 2 của
   [`Task #120`](120-engine-spec-contract-plan.md).
3. **Viết mới** mục 2 (Actors), 4 (Main flow — một lượt chơi đúng từ `content_pack` tới thắng),
   5 (Alternative flows — sai, hết giờ, gợi ý, asset hỏng, thiết bị yếu), 8 (API contract —
   ghi rõ "không có"), 16 (sáu số đo chiều sâu hiện tại).
4. **Mục 6 — `BR-E025-01` trở đi.** Ít nhất một rule sinh từ ca sai ở mục 2.1 trên. Mỗi rule
   kèm lý do. Cấm — NEVER nói lại `BR-GTC-*`, `BR-ERC-*`, `BR-ECD-*`.
5. **Mục 9 — Gherkin.** Mỗi `BR-E025-*` ít nhất một scenario.
6. Mục 15 — trường trích từ registry kèm nguồn dòng: `layouts`, `limits`, `banned_age_bands`,
   `asset_kinds`.
7. `status: draft` → `approved`. Thêm `GT-025` vào `engine-spec-ready.json`.

### WP154.2 — Cài `render()`

**Cỡ:** M · **Ranh giới PR:** `packages/game-engine/src/templates/GT-025/`

Khuôn bốn lớp và **bảy phép kiểm bắt buộc** ở mục 7 của
[`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md), do
[`Task #115`](115-render-contract-core-plan.md) WP115.3 ghi. Task này **không** chép lại khuôn.

Riêng engine này:

- Slot lấy từ `split-columns` qua `resolveLayout()` — cấm — NEVER hằng số toạ độ.
- Vẽ bằng 5 nguyên thuỷ của `RenderSystem`.
- Trạng thái thị giác riêng của engine ghi ở mục 12 của spec.
- Vùng chạm đo ở **3 band hợp lệ**: `3-4`, `4-5`, `5-6`.

Sau khi bảy phép kiểm xanh: thêm `GT-025` vào
`packages/game-engine/config/render-implemented.json` — **một dòng, không sửa dòng khác**.

**Cấm — NEVER** thêm nguyên thuỷ vào `RenderSystem`. Engine này dựng được từ 5 nguyên thuỷ hiện có; nếu khi làm thấy không dựng được, dừng lại và mở `Q116-1`, đừng tự thêm.

### WP154.3 — Nợ `content_pack` của engine

**Cỡ:** S · **Ranh giới PR:** `packages/db/src/seed-content`

Cổng 1 sau [`Task #117`](117-seed-gate-truth-plan.md) parse `content_pack` bằng
`content_contract` thật. Đo lại số level `GT-025` trượt, rồi sửa **của riêng engine này**.

1. Đo: bao nhiêu trong 4 level trượt, thiếu trường nào.
2. Sửa bằng **version mới**; cấm — NEVER `UPDATE` bản đã publish (`BR-CSA-01`).
3. Con số trượt của `GT-025` về 0.

Nếu đo ra 0 trượt: ghi lại con số và bỏ WP này, kèm lý do.

### WP154.4 — Level ngoài band của engine

**Cỡ:** S · **Ranh giới PR:** `packages/db/src/seed-content`

Engine này **không** khai `banned_age_bands`, nên không có level nào vi phạm `BR-ECD-13` về phía engine. Vẫn phải đo để khẳng định `out_of_band_count` = 0, rồi bỏ WP này kèm con số.

### WP154.5 — Nội dung tới sàn bậc 1

**Cỡ:** M · **Ranh giới PR:** một PR

Sàn bậc 1 của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) mục 7.3:

| Số đo | Bậc 1 | `GT-025` hôm nay |
|---|:--:|---|
| `level_count` | ≥6 | 4 |
| `min_band_count` | ≥1 | đo ở Preflight |
| `thinking_span` | ≥2 | đo ở Preflight |
| `what_span` | ≥2 | đo ở Preflight |
| `theme_span` | ≥2 | đo ở Preflight |
| `difficulty_span` | ≥2 | đo ở Preflight |

Soạn thêm **2 level**. Ưu tiên theo thứ tự: band hợp lệ đang trống → giá trị trục `thinking` đang thiếu → chủ đề đang thiếu → mức `difficulty` đang thiếu.

Bắt buộc thêm: **≥1 level `access_tier` là `free` hoặc `login`** (`BR-ECD-07`). Engine mà mọi
màn đều `premium` thì phụ huynh chưa mua không bao giờ thấy nó tồn tại.

Level mới đi qua **đủ tám cổng** của [`Task #117`](117-seed-gate-truth-plan.md), và đếm vào
ngân sách 55 của [`Task #122`](122-engine-content-depth-plan.md) — soạn một lần, đếm một chỗ.

Từ vựng chủ đề lấy từ 14 giá trị đã đóng ở [`Task #119`](119-theme-registry-plan.md). Khung
nội dung sinh được bằng `gen:levels` của [`Task #121`](121-level-generator-kit-plan.md); tag ba
trục và câu lệnh tiếng Việt **viết tay** (`BR-LGK-08`, `BR-LGK-10`).

### WP154.6 — Mở màn thật và đóng spec

**Cỡ:** S

1. Mở một màn `GT-025` thật trong `apps/web`, **nhìn thấy hình**, đính ảnh chụp vào PR.
2. Kiểm tay một lượt chơi đầu cuối: chạm đúng thắng, chạm sai có phản hồi, gợi ý hiện sau
   `hint_after_ms`.
3. Spec đổi `status: approved` → `implemented`, ghi ngày.

## 4. Điều kiện nghiệm thu — bảy điều của mục 2 [`Task #116`](116-engine-vertical-slices-plan.md)

1. Spec `GT-025` đủ khuôn 16 mục; `check:engine-specs` xanh với `GT-025` trong bậc thang.
2. `check:render` in `GT-025` đã cài; bảy phép kiểm vẽ xanh; xoá `render()` của `GT-025` → cổng đỏ.
3. Mọi `content_pack` của `GT-025` parse được `content_contract`.
4. `out_of_band_count` của `GT-025` bằng 0.
5. `check:engine-depth` bậc 1 xanh cho `GT-025`: `level_count` ≥6 và bốn `*_span` ≥2.
6. `GT-025` có ≥1 level `free` hoặc `login`.
7. Ảnh chụp màn `GT-025` thật trong PR.

Cộng thêm: không câu `UPDATE` nào chạm bản published; `pnpm lint` · `pnpm typecheck` ·
`pnpm test` xanh; danh sách `trạng-thái | tên-test` trùng khít trước/sau trừ test mới.

## 5. Ranh giới

**Always**
- Một WP một PR.
- Thêm đúng **một** dòng vào `render-implemented.json` và `engine-spec-ready.json`.
- Version mới cho mọi sửa nội dung.

**Ask first**
- Nguyên thuỷ vẽ mới (`Q116-1`).
- Nới `banned_age_bands` của engine — đó là ràng buộc phát triển của trẻ, không phải tham số.
- Bỏ một WP mà không ghi lý do kèm con số.

**Never**
- Sửa `packages/game-engine/src/systems/render-system.ts`.
- Sửa `packages/db/config/engine-depth.json`.
- Chạm file của engine khác.
- `UPDATE` bản ghi đã publish.
- So sánh pixel trong test vẽ.
- Đóng spec khi một trong bảy điều kiện mục 4 chưa đúng.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q154-1` | `BR-E025-*` gồm những rule nào? Ca sai ở mục 2.1 cho ít nhất một; còn rule nào **chỉ đúng với `GT-025`** mà chưa ai viết? | WP154.1 | Sư phạm + Backend |
| `Q154-2` | Sáu số đo chiều sâu của `GT-025` hôm nay là bao nhiêu? Chỉ `level_count` = 4 là chắc; năm số còn lại phải đo ở Preflight | WP154.5 | Nội dung |
