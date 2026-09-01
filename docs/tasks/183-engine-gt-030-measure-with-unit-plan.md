# Kế hoạch — Task #183: `GT-030` Đo bằng đơn vị lặp — `measure-with-unit`

> **Loại task:** lát dọc engine (L) — đợt 3 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** khuôn `GT-030` chạy được, cộng **10 level** mang `legacy_v1_ref: "D5-04"`.
> **Game type v1 gánh:** `D5-04` Đo bằng Đơn vị phi chuẩn — `C1.MEAS.08` · `C1.MEAS.09` — nguồn `d5/UnitMeasureSession.ts`.
> **Chặn bởi:** chốt kiểm 2. **Chạy song song được với** năm task còn lại của đợt 3.
> **Spec sở hữu:** phiếu engine [`docs/specs/01-platform/engines/GT-030.md`](../specs/01-platform/engines/GT-030.md) — **đã viết** ở [Task #190](190-engine-spec-first-authoring-spec.md). Task này cấm — NEVER viết lại phiếu; nó dựng khuôn theo phiếu, và **gỡ `GT-030` khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR** (`BR-ESS-15`).

## 1. Vì sao khuôn này tồn tại

Bảng migration gộp `D5-04` vào `tpl-drag-to-order`. Đo bằng đơn vị phi chuẩn không phải sắp xếp:
trẻ đặt **lặp lại cùng một đơn vị** dọc theo vật rồi đếm số lần đặt. Sai lầm điển hình mà bài này
dạy là để hở hoặc chồng lấn giữa các lần đặt — thứ mà một bài sắp xếp không chạm tới.

Đây là bước chuyển từ so sánh trực tiếp (`GT-001`) sang đo lường có đơn vị, tiền đề của thước chuẩn.

## 2. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `measure-with-unit` — đã có trong union sau [`#169`](169-mechanic-vocabulary-enforcement-plan.md) |
| Nguyên thuỷ | `placement` |
| Band | `5-6` — `banned_age_bands: ["3-4", "4-5"]` |
| `layouts` | `measure-strip` **mới** · `horizontal-track` |
| Hệ thống mới | Không, nhưng **cần `LayoutId` mới** |
| `status` khi ra đời | `draft` — chuyển `published` ở chốt kiểm 4 |

### Hợp đồng nội dung

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `prompt_audio_ref` | chuẩn | |
| `object` | `object_id` + `asset` + `length_in_units` | vật được đo |
| `unit` | `unit_id` + `asset` | đơn vị lặp |
| `answer_options` | 2–5, có `is_correct` | dài bao nhiêu đơn vị |

`refine`: `is_correct` khớp `object.length_in_units`.

### Hợp đồng độ khó

`length_in_units` (2–10) · `gap_tolerance_pct` · `allow_retry` · `hint_after_ms`.

### Layout mới

`measure-strip` cần **hàm hình học riêng** `computeMeasureStripLayout` trong `layout/geometry.ts`:
một dải ngang cho vật, một khay đơn vị bên dưới, vùng chạm theo band. Cấm — NEVER dùng lại
`computeGridLayout` hay `computeHorizontalTrackLayout` — cả hai không tách được dải đo với khay.

## 3. Tám phần của lát dọc

| # | Sản phẩm | Ghi chú |
|---|---|---|
| 1 | `templates/GT-030/template.ts` | contract zod, `status: draft`, `mechanic` lấy từ union |
| 2 | `templates/GT-030/session.ts` | dựng trên `placement` |
| 3 | `templates/GT-030/fixtures.ts` | 3 level mẫu, khác band hoặc khác dạng bài |
| 4 | `generators/gt030.ts` | ≥8 chủ đề, mọi band hợp lệ |
| 5 | `tests/gt-030-measure-with-unit.test.ts` | ≥12 ca, ≥1 ca trẻ hành động trước phản hồi |
| 6 | `docs/specs/01-platform/engines/GT-030.md` | **đã có** (Task #190) — task này chỉ gỡ mã khỏi `engine-spec-planned.json` |
| 7 | `src/generated/**` | `gen:templates` sinh, cấm — NEVER sửa tay |
| 8 | 10 level `legacy_v1_ref: "D5-04"` | trải ≥3 chủ đề, mọi band hợp lệ, ≥2 mức khó |

## 4. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `GT-030` trong registry, `check:engine-specs` xanh, phiếu không mồ côi | `check:engine-specs` |
| 2 | `gen:templates` không sinh diff sau khi chạy | `git status` |
| 3 | ≥12 ca test phiên engine xanh | `pnpm --filter @mindkid/game-engine test` |
| 4 | Bộ sinh khai ≥8 chủ đề, mọi cặp `(band, theme)` sinh được và qua contract | `tests/generators.test.ts` |
| 5 | 10 level `legacy_v1_ref: "D5-04"`, `check:legacy-v1` tăng đúng 1 game type | `check:legacy-v1` |
| 6 | `check:theme-registry` và `check:engine-depth` xanh | — |
| 7 | `layout-safe-area.test.ts` xanh, `layout-safe-area-debt.json` không thêm dòng | diff |
| 8 | `pnpm check` xanh | — |

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Dùng lại layout cũ cho tiện | Cao | Phiếu engine mục 7.3 ghi bảng đo vùng an toàn; `layout-safe-area.test.ts` bắt |
| Không dạy được lỗi hở/chồng | Cao | `gap_tolerance_pct` là tham số khó thật; ca test đặt hở quá ngưỡng → không tính đúng |
| Band `5-6` làm nội dung mỏng | Trung bình | Trải bù bằng ≥8 chủ đề và 2 mức khó |
