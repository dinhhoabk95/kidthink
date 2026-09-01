# Kế hoạch — Task #186: `GT-033` Dệt hoa văn lưới — `weave-grid`

> **Loại task:** lát dọc engine (L) — đợt 3 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** khuôn `GT-033` chạy được, cộng **10 level** mang `legacy_v1_ref: "D3-07"`.
> **Game type v1 gánh:** `D3-07` Dệt Hoa văn (Weaving) — `C1.PAT.05` — nguồn `d3/WeavingPatternSession.ts`.
> **Chặn bởi:** chốt kiểm 2. **Chạy song song được với** năm task còn lại của đợt 3.
> **Spec sở hữu:** phiếu engine [`docs/specs/01-platform/engines/GT-033.md`](../specs/01-platform/engines/GT-033.md) — **đã viết** ở [Task #190](190-engine-spec-first-authoring-spec.md). Task này cấm — NEVER viết lại phiếu; nó dựng khuôn theo phiếu, và **gỡ `GT-033` khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR** (`BR-ESS-15`).

## 1. Vì sao khuôn này tồn tại

Bảng migration gộp `D3-07` vào `tpl-drag-to-slot`, tức `GT-008`. `GT-008` kiểm quy luật trên **một
chiều** — một dãy. Dệt hoa văn đòi quy luật đúng **cả hàng và cột cùng lúc**; đặt một ô sai làm hỏng
hai quy luật, không phải một.

Đó là bước từ quy luật tuyến tính sang quy luật hai chiều, và là tiền đề của ma trận (`GT-011`) và
lưới không lặp (`GT-015`). Không khuôn nào hiện có kiểm hai chiều mà vẫn cho trẻ **đặt từng ô**.

## 2. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `weave-grid` — đã có trong union sau [`#169`](169-mechanic-vocabulary-enforcement-plan.md) |
| Nguyên thuỷ | `placement` |
| Band | `5-6` — `banned_age_bands: ["3-4", "4-5"]` |
| `layouts` | `weave-grid` **mới** |
| Hệ thống mới | Không — dùng lại `constraint-system` |
| `status` khi ra đời | `draft` — chuyển `published` ở chốt kiểm 4 |

### Hợp đồng nội dung

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `prompt_audio_ref` | chuẩn | |
| `grid` | `rows` 2–5 · `cols` 2–5 | |
| `palette` | 2–4 phần tử: `color_id` + `asset` | sợi |
| `cells` | mảng `rows × cols`, mỗi ô `color_id` hoặc `null` | `null` là ô trẻ phải điền |
| `row_rule` · `col_rule` | mô tả quy luật | dùng để `refine` |

`refine`: số ô bằng `rows × cols`; lời giải duy nhất; **và** quy luật đúng theo cả hàng lẫn cột,
tính từ dữ liệu chứ cấm — NEVER tin nhãn.

### Hợp đồng độ khó

`grid_size` · `color_count` · `blank_count` · `allow_retry` · `hint_after_ms`.

### Layout mới

`weave-grid` cần **hàm hình học riêng** `computeWeaveGridLayout`: lưới ô vuông cộng khay sợi bên
dưới, có gờ chỉ hướng dọc/ngang. `computeGridLayout` không tách được khay; `matrix-slot-grid` đặt
khay bên phải.

### Dùng lại

Kiểm ràng buộc hai chiều dùng `systems/constraint-system.ts` — cùng hệ thống `GT-015` dùng.
Cấm — NEVER thêm hệ thống lưới thứ hai.

## 3. Tám phần của lát dọc

| # | Sản phẩm | Ghi chú |
|---|---|---|
| 1 | `templates/GT-033/template.ts` | contract zod, `status: draft` |
| 2 | `templates/GT-033/session.ts` | dựng trên `placement` |
| 3 | `templates/GT-033/fixtures.ts` | 3 level mẫu |
| 4 | `generators/gt033.ts` | ≥8 chủ đề, mọi band hợp lệ |
| 5 | `tests/gt-033-weave-grid.test.ts` | ≥12 ca, ≥1 ca trẻ hành động trước phản hồi |
| 6 | `docs/specs/01-platform/engines/GT-033.md` | **đã có** (Task #190) — task này chỉ gỡ mã khỏi `engine-spec-planned.json` |
| 7 | `src/generated/**` | `gen:templates` sinh, cấm — NEVER sửa tay |
| 8 | 10 level `legacy_v1_ref: "D3-07"` | trải ≥3 chủ đề, mọi band hợp lệ, ≥2 mức khó |

## 4. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `GT-033` trong registry, phiếu không mồ côi | `check:engine-specs` |
| 2 | `gen:templates` không sinh diff | `git status` |
| 3 | ≥12 ca test phiên engine xanh | `pnpm --filter @mindkid/game-engine test` |
| 4 | Bộ sinh ≥8 chủ đề, mọi cặp `(band, theme)` qua contract | `tests/generators.test.ts` |
| 5 | 10 level `legacy_v1_ref: "D3-07"`, `check:legacy-v1` tăng đúng 1 | `check:legacy-v1` |
| 6 | `check:theme-registry` và `check:engine-depth` xanh | — |
| 7 | `layout-safe-area-debt.json` không thêm dòng | diff |
| 8 | `pnpm check` xanh | — |

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Chỉ kiểm một chiều, thành `GT-008` trá hình | Cao | `refine` kiểm cả hai chiều; ca test đặt ô đúng hàng nhưng sai cột → phải báo sai |
| Thêm hệ thống lưới thứ hai | Cao | Review từ chối file mới dưới `systems/`; dùng `constraint-system` |
| Layout mới sinh nợ vùng an toàn | Trung bình | `layout-safe-area-debt.json` không thêm dòng |
| Lưới 5×5 quá khó cho band `5-6` | Trung bình | `grid_size` theo band; 10 level trải 2×2 tới 4×4, giữ 5×5 cho mức khó nhất |
