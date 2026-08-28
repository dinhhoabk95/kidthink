# Task #116 — Chương trình 27 lát dọc engine: một engine, một spec, một plan

> **Loại task:** chương trình (M) — thay hoàn toàn nội dung cũ của #116 ("rollout hợp đồng vẽ"),
> theo yêu cầu ngày 2026-08-29: *"phân chia mỗi engine game là một plan tương ứng với 1 spec
> thay vì gộp chung hết tất cả để dễ control vì là core chính."*
> **Spec sở hữu:** không spec nào — file này là hồ sơ chương trình. Contract của **spec engine**
> thuộc [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md), do
> [`Task #120`](120-engine-spec-contract-plan.md) sửa.
> **Chặn bởi:** [`Task #115`](115-render-contract-core-plan.md) (hạ tầng vẽ) ·
> [`Task #120`](120-engine-spec-contract-plan.md) (khuôn spec engine).

## 1. Trả lời ngắn

Engine game là **core sản phẩm**. Gộp 27 engine vào ba task ngang (#115 vẽ, #120 phiếu, #122
nội dung) làm mất khả năng nói *"engine này xong chưa"* — mỗi engine luôn xong một phần ba ở ba
task khác nhau, và không ai đóng được cái nào.

Task #116 đổi trục chia: **một engine là một lát dọc**, có spec riêng, plan riêng, PR riêng,
và một câu trả lời nhị phân *xong / chưa xong*.

| Trục cũ | Trục mới |
|---|---|
| #115 vẽ 6 engine, #116 vẽ 21 engine | #115 chỉ hạ tầng vẽ; mỗi engine tự cài `render()` trong task của nó |
| #120 duyệt 27 phiếu một lượt | #120 chỉ chốt **khuôn** spec engine; mỗi engine tự viết spec của nó |
| #122 soạn 55 level cho 27 engine | #122 chỉ giữ cổng bậc thang và ngân sách tổng; mỗi engine tự soạn phần của mình |
| #117 sửa 162 `content_pack` | #117 chỉ làm cổng nói thật; mỗi engine tự sửa bản ghi của mình |
| #118 dọn 42 level ngoài band | #118 chỉ chốt luật phân loại; mỗi engine tự dọn của mình |

Kết quả: **27 task** `#130` … `#156`, mỗi task đóng **một** spec engine.

## 2. Định nghĩa "một engine xong"

Một engine `GT-0NN` xong khi **cả bảy** điều dưới đây đúng. Thiếu một là chưa xong — không có
trạng thái "xong một phần".

| # | Điều kiện | Đo bằng |
|---|---|---|
| 1 | Spec engine đủ khuôn SDD, `status: implemented` | [`check:engine-specs`](120-engine-spec-contract-plan.md) |
| 2 | `render()` cài đặt, đủ bốn lớp và năm trạng thái thị giác | `check:render` + test vẽ |
| 3 | Mọi `content_pack` của engine parse được `content_contract` | cổng 1 của [`Task #117`](117-seed-gate-truth-plan.md) |
| 4 | `out_of_band_count` = 0 | cổng 5, luật của [`Task #118`](118-band-violation-cleanup-plan.md) |
| 5 | Đạt sàn bậc 1: `level_count` ≥6, `min_band_count` ≥1, bốn `*_span` ≥2 | `check:engine-depth` |
| 6 | ≥1 level `access_tier` là `free` hoặc `login` | `check:engine-depth` (`BR-ECD-07`) |
| 7 | Mở được một màn thật trong `apps/web` và **nhìn thấy hình** | ảnh chụp trong PR |

Điều 7 là điều duy nhất không tự động hoá được, và là lý do toàn bộ chương trình tồn tại: sàn
MVP ≥120 game level **đang đạt ở 229**, trong khi **0 / 27** engine vẽ ra hình.

## 3. Bằng chứng đã đo (2026-08-29)

### 3.1 Hai mươi bảy engine, khoảng cách tới bậc 1

| Engine | Slug | Lô | Level | Thiếu tới ≥6 | `render()` |
|---|---|---|---:|---:|:--:|
| `GT-001` | `tap-select` | mvp | 38 | 0 | Không |
| `GT-002` | `tap-select-multi` | mvp | 27 | 0 | Không |
| `GT-003` | `drag-to-container` | mvp | 27 | 0 | Không |
| `GT-004` | `sort-groups` | mvp | 21 | 0 | Không |
| `GT-005` | `pair-match` | mvp | 24 | 0 | Không |
| `GT-006` | `sequence-order` | mvp | 21 | 0 | Không |
| `GT-007` | `number-bond` | montessori | 6 | 0 | Không |
| `GT-008` | `drag-to-slot` | montessori | 6 | 0 | Không |
| `GT-009` | `clue-deduction` | montessori | 3 | 3 | Không |
| `GT-010` | `substitution` | montessori | 3 | 3 | Không |
| `GT-011` | `matrix-choice` | montessori | 3 | 3 | Không |
| `GT-012` | `flash-recall` | montessori | 4 | 2 | Không |
| `GT-013` | `maze-route` | montessori | 3 | 3 | Không |
| `GT-014` | `balance-scale` | montessori | 3 | 3 | Không |
| `GT-015` | `sudoku-mini` | montessori | 3 | 3 | Không |
| `GT-016` | `clock-hands` | montessori | 3 | 3 | Không |
| `GT-017` | `block-stack` | montessori | 3 | 3 | Không |
| `GT-018` | `listen-respond` | legacy-v1 | 3 | 3 | Không |
| `GT-019` | `rotate-transform` | legacy-v1 | 3 | 3 | Không |
| `GT-020` | `memory-flip` | legacy-v1 | 3 | 3 | Không |
| `GT-021` | `mirror-complete` | legacy-v1 | 3 | 3 | Không |
| `GT-022` | `hidden-object` | legacy-v1 | 3 | 3 | Không |
| `GT-023` | `construct` | legacy-v1 | 3 | 3 | Không |
| `GT-024` | `trace-path` | legacy-v1 | 3 | 3 | Không |
| `GT-025` | `spot-difference` | taxonomy-gap | 4 | 2 | Không |
| `GT-026` | `go-nogo` | taxonomy-gap | 3 | 3 | Không |
| `GT-027` | `rule-switch` | taxonomy-gap | 3 | 3 | Không |
| **Tổng** | | | **229** | **55** | **0 / 27** |

Tổng thiếu **55** khớp đúng con số bậc 1 ở mục 7.4 của
[`engine-content-depth.md`](../specs/05-content/engine-content-depth.md). Hai nguồn độc lập cho
cùng một số — đó là bằng chứng phép đo đúng.

**Một lệch phải đối chiếu:** đếm `template_code:` trong `seed-content` cho **229**;
`seed:report` ngày 2026-08-29 báo **228**. Lệch 1. Preflight của task engine đầu tiên phải tìm
ra bản ghi thứ 229 là gì — hoặc một `template_code` xuất hiện ngoài ngữ cảnh level, hoặc một
level không được `seed:report` đếm.

### 3.2 Bốn lô, bốn mức chín khác nhau

| Lô | Engine | Đặc điểm chung |
|---|---|---|
| `mvp` | `GT-001`…`GT-006` | 158 level, phiếu đã qua lượt đọc, contract đơn giản nhất, **không** dùng `refine` trừ `GT-004` |
| `montessori` | `GT-007`…`GT-017` | 6 · 6 · rồi chín engine ở mức 3 level; **chín trên mười một** dùng `.refine()` — contract chặt nhất |
| `legacy-v1` | `GT-018`…`GT-024` | Port từ v1; 3 level mỗi engine; dùng nhiều system riêng |
| `taxonomy-gap` | `GT-025`…`GT-027` | Lấp `inhibit` và `shift`; `GT-026` `GT-027` cấm band `3-4` |

Thứ tự chạy 27 task **theo lô, không theo mã số**, và trong mỗi lô theo mức phủ nội dung giảm
dần. Lý do ở mục 5.

### 3.3 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
grep -rhoE 'template_code:\s*"GT-[0-9]{3}"' packages/db/src/seed-content \
  | grep -oE 'GT-[0-9]{3}' | sort | uniq -c
pnpm --filter @mindkid/db seed:report
grep -rn "render(" packages/game-engine/src/templates --include="*.ts" | wc -l
```

## 4. Khuôn spec engine — SDD

Mỗi engine có **một** spec ở `docs/specs/01-platform/engines/GT-0NN.md`. Nó phải là spec đủ
khuôn theo [`CONVENTIONS.md`](../specs/CONVENTIONS.md), **không** phải phiếu tóm tắt.

### 4.1 Frontmatter

```yaml
---
spec: ENGINE-GT-0NN
title: <tên engine> — <cơ chế một câu>
area: platform
status: draft | approved | implemented
mvp: true | false
phase: P1 | P4
reviewed: YYYY-MM-DD
engine: <slug>
batch: mvp | montessori | legacy-v1 | taxonomy-gap
owns:
  - Hợp đồng nội dung của engine <mã>
  - Hợp đồng vẽ của engine <mã>
  - Ma trận seed mục tiêu của engine <mã>
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - GAME-LAYOUT-ENGINE
  - ENGINE-RENDER-CONTRACT
  - ENGINE-SPEC-SHEET
---
```

`owns` của một spec engine **Cấm — NEVER** chứa thứ mà spec lô đã sở hữu: mã bất biến thuộc
[`id-conventions.md`](../specs/00-foundation/id-conventions.md), vòng lặp thuộc
[`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md), bốn lớp vẽ thuộc
[`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md).

### 4.2 Mười một mục theo `CONVENTIONS.md`, đọc theo nghĩa engine

| Mục CONVENTIONS | Trong spec engine nghĩa là |
|---|---|
| 1. Objective | Engine này dạy trẻ tiến trình tư duy nào, và khác engine gần nhất ở **một điểm quyết định** |
| 2. Actors | Trẻ · người soạn nội dung · bộ sinh level · cổng |
| 3. Entry points | Thư mục engine, `content_contract`, layout dùng, phiếu này |
| 4. Main flow | Một lượt chơi đúng: từ `content_pack` tới thắng |
| 5. Alternative flows | Sai, hết giờ, gợi ý, thiết bị yếu, asset hỏng |
| 6. Business rules | `BR-E<nnn>-01`… — luật **riêng** engine này, mỗi luật kèm lý do |
| 7. Data | Hình dạng `content_pack` và `difficulty_params`, band hợp lệ, `limits`, ma trận seed |
| 8. API contract | Thường không có — ghi rõ "không có, engine chạy trong tiến trình" |
| 9. Acceptance criteria | Gherkin, mỗi `BR-E<nnn>-*` ít nhất một scenario |
| 10. Boundaries | Always · Ask first · Never của riêng engine |
| 11. Open questions | Câu hỏi chặn, có chủ |

### 4.3 Năm mục engine cộng thêm, sau mục 11

| Mục | Nội dung | Rule |
|---|---|---|
| 12. Hợp đồng vẽ | Slot dùng, bảng bốn lớp, trạng thái thị giác riêng, thứ tự tuột | `BR-ERC-10` `BR-ESS-10` |
| 13. Ma trận seed mục tiêu | `band × giá trị thinking`, ô là **số** | `BR-ESS-05` |
| 14. Ca sai không bắt được bằng schema | ≥1 ca parse sạch mà sai sư phạm, kèm lý do | `BR-ESS-06` |
| 15. Trường trích từ registry | `layouts` · `limits` · `banned_age_bands` · `asset_kinds`, kèm nguồn dòng | `BR-ESS-02` |
| 16. Chiều sâu nội dung | Sáu số đo hiện tại và mục tiêu bậc đang bật | `BR-ECD-01`…`-06` |

**Cấm — NEVER** khai `content_contract` hay Zod schema trong spec (`BR-ESS-03`); mục 7 **mô tả**
hình dạng và trỏ về registry. **Cấm — NEVER** khai `skill_id` hay `competency_id` (`BR-ESS-04`).

Nội dung hiện có của 27 phiếu **không bỏ đi**: 11 mục hiện tại ánh xạ gần như một-một sang mục
1, 2, 7, 12, 13, 14 của khuôn mới. Việc của mỗi task engine là **bù phần thiếu**, chủ yếu là
mục 6 (business rule riêng), mục 9 (Gherkin), và mục 15.

## 5. Thứ tự 27 task

Xếp theo **mức phủ nội dung giảm dần trong từng lô**, và lô `mvp` đi trước. Ba lý do đo được:

1. Sáu engine MVP gánh 158 / 229 level — **69 %** nội dung. Chúng vẽ được là 69 % catalog vẽ được.
2. Chúng có contract đơn giản nhất (5 / 6 không dùng `.refine()`), nên chúng là chỗ rẻ nhất để
   chứng minh khuôn spec và khuôn `render()` chạy.
3. Chúng **không thiếu level nào** tới bậc 1, nên task của chúng không bị chặn bởi năng lực soạn
   nội dung — đường găng duy nhất còn lại là đọc review.

| Thứ tự | Task | Engine | Vì sao ở vị trí này |
|---:|---|---|---|
| 1 | [#130](130-engine-gt-001-plan.md) | `GT-001` | **Pilot.** Contract đơn giản nhất, 38 level, chứng minh cả hai khuôn |
| 2 | [#131](131-engine-gt-002-plan.md) | `GT-002` | Cùng cơ chế chọn, thêm nhiều đáp án và band cấm |
| 3 | [#134](134-engine-gt-005-plan.md) | `GT-005` | Ghép cặp — hình học độc lập, kiểm khuôn trên layout khác |
| 4 | [#132](132-engine-gt-003-plan.md) | `GT-003` | Kéo thả, mở nhóm placement |
| 5 | [#133](133-engine-gt-004-plan.md) | `GT-004` | Kéo thả nhiều nhóm, engine MVP duy nhất dùng `.refine()` |
| 6 | [#135](135-engine-gt-006-plan.md) | `GT-006` | Dãy có thứ tự; cấm hai band, ca band nặng nhất corpus |
| 7–8 | [#136](136-engine-gt-007-plan.md) [#137](137-engine-gt-008-plan.md) | `GT-007` `GT-008` | Hai engine Montessori đã có 6 level — đủ bậc 1, chỉ thiếu vẽ và spec |
| 9–17 | [#138](138-engine-gt-009-plan.md) … [#146](146-engine-gt-017-plan.md) | `GT-009`…`GT-017` | Lô Montessori ở mức mẫu; **chín engine dùng `.refine()`** nên nội dung mới tốn nhất |
| 18–24 | [#147](147-engine-gt-018-plan.md) … [#153](153-engine-gt-024-plan.md) | `GT-018`…`GT-024` | Lô kế thừa v1 |
| 25–27 | [#154](154-engine-gt-025-plan.md) [#155](155-engine-gt-026-plan.md) [#156](156-engine-gt-027-plan.md) | `GT-025`…`GT-027` | Lô lấp taxonomy; `GT-026` `GT-027` là nguồn duy nhất của `inhibit` và `shift` |

Ba engine cần **nguyên thuỷ vẽ mới** — `GT-013` mê cung, `GT-014` cân, `GT-016` đồng hồ — nằm
trong lô Montessori và **Cấm — NEVER** bắt đầu trước khi quyết định `Q116-1` có câu trả lời.

### 5.1 Chạy song song được bao nhiêu

Sau khi #130 (pilot) merge, **mọi task engine còn lại độc lập với nhau**: chúng chạm
`packages/game-engine/src/templates/<mã>/`, `docs/specs/01-platform/engines/<mã>.md`, và phần
corpus của riêng engine đó. Không hai task engine nào sửa cùng một file.

Ba chỗ dùng chung, và cả ba **Cấm — NEVER** sửa trong task engine:
`packages/game-engine/src/systems/render-system.ts` (qua `Q116-1`) ·
`packages/db/config/engine-depth.json` (thuộc #122) ·
`packages/game-engine/config/render-implemented.json` (chỉ **thêm** một dòng, không sửa dòng khác).

## 6. Khuôn plan engine

Mỗi task engine có đúng sáu work package. Task nào bỏ một WP phải ghi lý do.

| WP | Nội dung | Cỡ |
|---|---|---|
| `WPn.1` | Nâng phiếu thành spec đủ khuôn mục 4; `status: draft` → `approved` | S |
| `WPn.2` | Cài `render()`, bốn lớp, năm trạng thái, test vẽ; thêm mã vào `render-implemented.json` | M |
| `WPn.3` | Sửa `content_pack` / `difficulty_params` của engine cho parse được (nếu có nợ) | S–M |
| `WPn.4` | Dọn level ngoài band của engine (nếu có) | S |
| `WPn.5` | Soạn level tới bậc 1: `level_count` ≥6, bốn `*_span` ≥2, ≥1 cửa vào không trả phí | M |
| `WPn.6` | Mở màn thật, chụp ảnh; `status` spec → `implemented` | S |

## 7. Điều kiện nghiệm thu của chương trình

1. 27 cặp `*-plan.md` / `*-todo.md` tồn tại, số task 130–156, ánh xạ một-một với `GT-001`…`GT-027`.
2. Mỗi task engine có đủ sáu WP hoặc ghi lý do bỏ.
3. Định nghĩa "xong" ở mục 2 xuất hiện trong nghiệm thu của **cả 27** task.
4. Không hai task engine nào khai sửa cùng một file ngoài ba file dùng chung ở mục 5.1.
5. Tổng cột "thiếu tới ≥6" của 27 task bằng **55** — khớp bậc 1 của `engine-content-depth.md`.
6. `check:render` đi từ 0 lên 27 đúng 27 bước, mỗi bước một PR.
7. Sau task cuối: `check:render` in `27 / 27`, `check:engine-depth` bậc 1 xanh, và
   [`Task #125`](125-go-live-readiness-plan.md) chạy được trên trục game.

## 8. Ranh giới

**Always**
- Một engine một PR cho mỗi WP.
- Tăng `render-implemented.json` từng dòng.
- Ghi lý do khi bỏ một WP.

**Ask first**
- Nguyên thuỷ vẽ mới (`Q116-1`).
- Đổi khuôn spec engine sau khi #120 đã chốt.
- Chuyển một engine sang `deprecated` thay vì làm task của nó — `D-SH` chốt phạm vi 27 engine
  không rút.

**Never**
- Gộp hai engine vào một PR.
- Sửa `render-system.ts` trong task engine.
- Sửa `engine-depth.json` trong task engine.
- Đóng spec engine khi một trong bảy điều ở mục 2 chưa đúng.

## 9. Câu hỏi mở (đã giải quyết)

| # | Câu hỏi | Trạng thái / Quyết định |
|---|---|---|
| `Q116-1` | `GT-013` `GT-014` `GT-016` cần nguyên thuỷ vẽ mới thuộc `RenderSystem` hay engine? | **Đã giải quyết:** Thuộc `RenderSystem` (theo `BR-ERC-05`), giữ vững invariant không vẽ tay thô trong Session class. |
| `Q116-2` | Lệch 1 giữa 229 (đếm `template_code`) và 228 (`seed:report`) là gì? | **Đã giải quyết:** File mồ côi `packages/db/src/seed-content/c1/gt-001.ts` (trùng `levels.ts`), đã xoá dọn dẹp đưa về đúng 228. |
| `Q116-3` | Spec engine mang `phase` nào? | **Đã giải quyết:** `phase: P1`, `mvp: true` cho lô MVP (`GT-001`…`GT-006`); `phase: P4`, `mvp: false` cho 3 lô còn lại. |
