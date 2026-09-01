# Kế hoạch — Task #182: `GT-029` Bớt khỏi nhóm — `remove-from-set`

> **Loại task:** lát dọc engine (L) — đợt 3 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** khuôn `GT-029` chạy được, cộng **10 level** mang `legacy_v1_ref: "D1-12"`.
> **Game type v1 gánh:** `D1-12` Phép trừ Trực quan — `C1.SUB.01` — nguồn `d1/RemoveItemSession.ts`.
> **Chặn bởi:** chốt kiểm 2. **Chạy song song được với** năm task còn lại của đợt 3.
> **Spec sở hữu:** phiếu engine [`docs/specs/01-platform/engines/GT-029.md`](../specs/01-platform/engines/GT-029.md) — **đã viết** ở [Task #190](190-engine-spec-first-authoring-spec.md). Task này cấm — NEVER viết lại phiếu; nó dựng khuôn theo phiếu, và **gỡ `GT-029` khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR** (`BR-ESS-15`).

## 1. Vì sao khuôn này tồn tại

Bảng migration gộp `D1-12` vào `tpl-drag-to-container`, tức `GT-003`. Gộp đó làm mất hành động:
`GT-003` là **thêm vật vào** rổ, `D1-12` là **bớt vật ra** khỏi nhóm rồi trả lời còn bao nhiêu.

Với trẻ mầm non, thêm và bớt không phải hai hướng của cùng một thao tác — bớt là bước đầu của phép
trừ và khó hơn hẳn. Rút gọn nó thành "chọn đáp án" cũng hỏng: trẻ phải **thấy** tập nhỏ đi.

## 2. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `remove-from-set` — đã có trong union sau [`#169`](169-mechanic-vocabulary-enforcement-plan.md) |
| Nguyên thuỷ | `selection` |
| Band | `4-5` · `5-6` — `banned_age_bands: ["3-4"]` |
| `layouts` | `grid` · `flex-wrap` |
| Hệ thống mới | Không |
| `status` khi ra đời | `draft` — chuyển `published` ở chốt kiểm 4 |

### Hợp đồng nội dung

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `prompt_audio_ref` | chuẩn | |
| `initial_items` | 2–10 phần tử | tập ban đầu |
| `remove_count` | số nguyên ≥1 | số vật phải bớt |
| `answer_options` | 2–5 phần tử, có `is_correct` | còn lại bao nhiêu |

`refine`: đúng một `answer_options` có `is_correct`, và giá trị của nó bằng
`initial_items.length - remove_count`.

### Hợp đồng độ khó

`initial_count` · `remove_count` · `allow_retry` · `hint_after_ms` · `shuffle_items`.

### Event

`game_started` · `item_removed` · `answer_selected` · `game_completed`. `item_removed` là event mới.

## 3. Tám phần của lát dọc

| # | Sản phẩm | Ghi chú |
|---|---|---|
| 1 | `templates/GT-029/template.ts` | contract zod, `status: draft`, `mechanic` lấy từ union |
| 2 | `templates/GT-029/session.ts` | dựng trên `selection` |
| 3 | `templates/GT-029/fixtures.ts` | 3 level mẫu, khác band hoặc khác dạng bài |
| 4 | `generators/gt029.ts` | ≥8 chủ đề, mọi band hợp lệ |
| 5 | `tests/gt-029-remove-from-set.test.ts` | ≥12 ca, ≥1 ca trẻ hành động trước phản hồi |
| 6 | `docs/specs/01-platform/engines/GT-029.md` | **đã có** (Task #190) — task này chỉ gỡ mã khỏi `engine-spec-planned.json` |
| 7 | `src/generated/**` | `gen:templates` sinh, cấm — NEVER sửa tay |
| 8 | 10 level `legacy_v1_ref: "D1-12"` | trải ≥3 chủ đề, mọi band hợp lệ, ≥2 mức khó |

## 4. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `GT-029` trong registry, `check:engine-specs` xanh, phiếu không mồ côi | `check:engine-specs` |
| 2 | `gen:templates` không sinh diff sau khi chạy | `git status` |
| 3 | ≥12 ca test phiên engine xanh | `pnpm --filter @mindkid/game-engine test` |
| 4 | Bộ sinh khai ≥8 chủ đề, mọi cặp `(band, theme)` sinh được và qua contract | `tests/generators.test.ts` |
| 5 | 10 level `legacy_v1_ref: "D1-12"`, `check:legacy-v1` tăng đúng 1 game type | `check:legacy-v1` |
| 6 | `check:theme-registry` và `check:engine-depth` xanh | — |
| 7 | `layout-safe-area.test.ts` xanh, `layout-safe-area-debt.json` không thêm dòng | diff |
| 8 | `pnpm check` xanh | — |

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Rút gọn thành chọn đáp án, bỏ bước bớt vật | Cao | Ca test: sự kiện `item_removed` phải phát đủ `remove_count` lần **trước** `answer_selected` |
| Đáp án lệch với dữ liệu | Cao | `refine` tính từ dữ liệu, không tin nhãn; ca âm |
| Trùng `GT-003` | Trung bình | `GT-003` không có `item_removed`; phiếu engine ghi rõ ranh giới |
