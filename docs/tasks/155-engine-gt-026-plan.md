# Task #155 — Engine `GT-026` Chỉ chạm khi đúng dấu

> **Loại task:** lát dọc engine (M) — một trong 27 task của
> [`Task #116`](116-engine-vertical-slices-plan.md). Vị trí **26 / 27** trong thứ tự chương trình.
> **Spec sở hữu:** [`engines/GT-026.md`](../specs/01-platform/engines/GT-026.md) — nâng từ phiếu thành
> spec đủ khuôn SDD, `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:**
> - [`Task #130`](130-engine-gt-001-plan.md) — pilot chứng minh hai khuôn
> - [`Task #115`](115-render-contract-core-plan.md) — cổng `check:render` và khuôn `render()`
> - [`Task #120`](120-engine-spec-contract-plan.md) — khuôn spec engine 16 mục

## 1. Engine này là gì

Các kích thích hiện lần lượt; trẻ chạm khi thấy dấu "đi" và **không chạm** khi thấy dấu "dừng". Engine này là engine duy nhất trong corpus mà **không hành động cũng là một đáp án đúng**. Nó luyện ức chế phản ứng, thành phần lõi của C6 chức năng điều hành.

**Nguồn dòng cho mục 15 của spec.** Bảng `layouts` · `limits` · `banned_age_bands` ·
`asset_kinds` trích từ [`GT-026/template.ts:36`](../../packages/game-engine/src/templates/GT-026/template.ts) — `BR-ESS-02` buộc spec ghi kèm
nguồn dòng này và cổng so lại với registry lúc chạy.

Lô `taxonomy-gap` (lấp khoảng trống taxonomy). Hôm nay engine có **3 level** trong corpus seed và
**chưa cài `render()`** — trẻ mở một màn `GT-026` ra thì thấy canvas trống.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Giá trị |
|---|---|
| Slug engine | `go-nogo` |
| Lô | `taxonomy-gap` |
| Layout khai trong template | `grid` |
| Band engine **cấm** | `3-4` |
| Band hợp lệ | `4-5`, `5-6` |
| `limits` | `item_count: [4, 12], distractor_count: [1, 6], target_count: [2, 8]` |
| `requires_tap_fallback` | `false` |
| `asset_kinds` | `emoji` · `image` |
| Trường `content_pack` | `go_stimulus` · `nogo_stimulus` · `trials` |
| Trường `difficulty_params` | `stimulus_window_ms` · `isi_ms` · `hint_after_ms` · `allow_retry` |
| Dùng `.refine()` | Không |
| System và mechanic | `inhibition-system` |
| `session.ts` | 118 dòng |
| Level trong corpus | **3** |
| Thiếu tới sàn bậc 1 (`level_count` ≥6) | **3** |
| `render()` | **Chưa cài** |
| Trạng thái spec | `draft`, khuôn phiếu 11 mục |

### 2.1 Ca sai không bắt được bằng schema

Tỉ lệ `nogo_stimulus` chiếm quá nửa số lượt. Parse sạch; sai vì ức chế chỉ đo được khi phản ứng đã thành thói quen — nếu dừng nhiều hơn đi thì không có thói quen nào để ức chế. Tỉ lệ "đi" nên chiếm khoảng 70–80% số lượt.

Ca này là lý do engine cần **`BR-E026-*` riêng**: contract Zod chặn được sai schema, nó
cấm — NEVER chặn được sai sư phạm. Mục 6 của spec mới phải biến ca này thành rule có mã.

### 2.2 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
sed -n '1,40p' packages/game-engine/src/templates/GT-026/template.ts
grep -c 'template_code: "GT-026"' -r packages/db/src/seed-content
pnpm --filter @mindkid/game-engine check:render
```

## 3. Work package

### WP155.1 — Nâng phiếu thành spec đủ khuôn SDD

**Cỡ:** S · **Ranh giới PR:** `docs/specs/01-platform/engines/GT-026.md`

Khuôn 16 mục ở mục 4 của [`Task #116`](116-engine-vertical-slices-plan.md), contract ở
[`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md).

1. Frontmatter đủ 9 trường. `spec: ENGINE-GT026`, `engine: go-nogo`,
   `batch: taxonomy-gap`, `owns` ba dòng, `depends_on` bốn spec.
2. Giữ nguyên nội dung 11 mục hiện có, ánh xạ sang mục 1, 3, 7, 12, 13, 14 theo bảng mục 2 của
   [`Task #120`](120-engine-spec-contract-plan.md).
3. **Viết mới** mục 2 (Actors), 4 (Main flow — một lượt chơi đúng từ `content_pack` tới thắng),
   5 (Alternative flows — sai, hết giờ, gợi ý, asset hỏng, thiết bị yếu), 8 (API contract —
   ghi rõ "không có"), 16 (sáu số đo chiều sâu hiện tại).
4. **Mục 6 — `BR-E026-01` trở đi.** Ít nhất một rule sinh từ ca sai ở mục 2.1 trên. Mỗi rule
   kèm lý do. Cấm — NEVER nói lại `BR-GTC-*`, `BR-ERC-*`, `BR-ECD-*`.
5. **Mục 9 — Gherkin.** Mỗi `BR-E026-*` ít nhất một scenario.
6. Mục 15 — trường trích từ registry kèm nguồn dòng: `layouts`, `limits`, `banned_age_bands`,
   `asset_kinds`.
7. `status: draft` → `approved`. Thêm `GT-026` vào `engine-spec-ready.json`.

### WP155.2 — Cài `render()`

**Cỡ:** M · **Ranh giới PR:** `packages/game-engine/src/templates/GT-026/`

Khuôn bốn lớp và **bảy phép kiểm bắt buộc** ở mục 7 của
[`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md), do
[`Task #115`](115-render-contract-core-plan.md) WP115.3 ghi. Task này **không** chép lại khuôn.

Riêng engine này:

- Slot lấy từ `grid` qua `resolveLayout()` — cấm — NEVER hằng số toạ độ.
- Vẽ bằng 5 nguyên thuỷ của `RenderSystem`.
- Trạng thái thị giác riêng của engine ghi ở mục 12 của spec.
- Vùng chạm đo ở **2 band hợp lệ**: `4-5`, `5-6`.

Sau khi bảy phép kiểm xanh: thêm `GT-026` vào
`packages/game-engine/config/render-implemented.json` — **một dòng, không sửa dòng khác**.

**Cấm — NEVER** thêm nguyên thuỷ vào `RenderSystem`. Engine này dựng được từ 5 nguyên thuỷ hiện có; nếu khi làm thấy không dựng được, dừng lại và mở `Q116-1`, đừng tự thêm.

### WP155.3 — Nợ `content_pack` của engine

**Cỡ:** S · **Ranh giới PR:** `packages/db/src/seed-content`

Cổng 1 sau [`Task #117`](117-seed-gate-truth-plan.md) parse `content_pack` bằng
`content_contract` thật. Đo lại số level `GT-026` trượt, rồi sửa **của riêng engine này**.

1. Đo: bao nhiêu trong 3 level trượt, thiếu trường nào.
2. Sửa bằng **version mới**; cấm — NEVER `UPDATE` bản đã publish (`BR-CSA-01`).
3. Con số trượt của `GT-026` về 0.

Nếu đo ra 0 trượt: ghi lại con số và bỏ WP này, kèm lý do.

### WP155.4 — Level ngoài band của engine

**Cỡ:** S · **Ranh giới PR:** `packages/db/src/seed-content`

Engine này khai `banned_age_bands: [`3-4`]`. Đo level `GT-026` đang gắn band bị cấm, rồi áp luật phân loại đường A / đường B do [`Task #118`](118-band-violation-cleanup-plan.md) chốt.

### WP155.5 — Nội dung tới sàn bậc 1

**Cỡ:** M · **Ranh giới PR:** một PR

Sàn bậc 1 của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) mục 7.3:

| Số đo | Bậc 1 | `GT-026` hôm nay |
|---|:--:|---|
| `level_count` | ≥6 | 3 |
| `min_band_count` | ≥1 | đo ở Preflight |
| `thinking_span` | ≥2 | đo ở Preflight |
| `what_span` | ≥2 | đo ở Preflight |
| `theme_span` | ≥2 | đo ở Preflight |
| `difficulty_span` | ≥2 | đo ở Preflight |

Soạn thêm **3 level**. Ưu tiên theo thứ tự: band hợp lệ đang trống → giá trị trục `thinking` đang thiếu → chủ đề đang thiếu → mức `difficulty` đang thiếu.

Bắt buộc thêm: **≥1 level `access_tier` là `free` hoặc `login`** (`BR-ECD-07`). Engine mà mọi
màn đều `premium` thì phụ huynh chưa mua không bao giờ thấy nó tồn tại.

Level mới đi qua **đủ tám cổng** của [`Task #117`](117-seed-gate-truth-plan.md), và đếm vào
ngân sách 55 của [`Task #122`](122-engine-content-depth-plan.md) — soạn một lần, đếm một chỗ.

Từ vựng chủ đề lấy từ 14 giá trị đã đóng ở [`Task #119`](119-theme-registry-plan.md). Khung
nội dung sinh được bằng `gen:levels` của [`Task #121`](121-level-generator-kit-plan.md); tag ba
trục và câu lệnh tiếng Việt **viết tay** (`BR-LGK-08`, `BR-LGK-10`).

### WP155.6 — Mở màn thật và đóng spec

**Cỡ:** S

1. Mở một màn `GT-026` thật trong `apps/web`, **nhìn thấy hình**, đính ảnh chụp vào PR.
2. Kiểm tay một lượt chơi đầu cuối: chạm đúng thắng, chạm sai có phản hồi, gợi ý hiện sau
   `hint_after_ms`.
3. Spec đổi `status: approved` → `implemented`, ghi ngày.

## 4. Điều kiện nghiệm thu — bảy điều của mục 2 [`Task #116`](116-engine-vertical-slices-plan.md)

1. Spec `GT-026` đủ khuôn 16 mục; `check:engine-specs` xanh với `GT-026` trong bậc thang.
2. `check:render` in `GT-026` đã cài; bảy phép kiểm vẽ xanh; xoá `render()` của `GT-026` → cổng đỏ.
3. Mọi `content_pack` của `GT-026` parse được `content_contract`.
4. `out_of_band_count` của `GT-026` bằng 0.
5. `check:engine-depth` bậc 1 xanh cho `GT-026`: `level_count` ≥6 và bốn `*_span` ≥2.
6. `GT-026` có ≥1 level `free` hoặc `login`.
7. Ảnh chụp màn `GT-026` thật trong PR.

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
| `Q155-1` | `BR-E026-*` gồm những rule nào? Ca sai ở mục 2.1 cho ít nhất một; còn rule nào **chỉ đúng với `GT-026`** mà chưa ai viết? | WP155.1 | Sư phạm + Backend |
| `Q155-2` | Sáu số đo chiều sâu của `GT-026` hôm nay là bao nhiêu? Chỉ `level_count` = 3 là chắc; năm số còn lại phải đo ở Preflight | WP155.5 | Nội dung |
