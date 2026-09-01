# Kế hoạch — Task #185: `GT-032` So lượng chất lỏng — `pour-quantity`

> **Loại task:** lát dọc engine (L) — đợt 3 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** khuôn `GT-032` chạy được, cộng **10 level** mang `legacy_v1_ref: "D5-09"`.
> **Game type v1 gánh:** `D5-09` Nhiều/Ít chất lỏng — `C1.MEAS.05` — nguồn `d5/LiquidPouringSession.ts`.
> **Chặn bởi:** chốt kiểm 2. **Chạy song song được với** năm task còn lại của đợt 3.
> **Spec sở hữu:** phiếu engine [`docs/specs/01-platform/engines/GT-032.md`](../specs/01-platform/engines/GT-032.md) — **đã viết** ở [Task #190](190-engine-spec-first-authoring-spec.md). Task này cấm — NEVER viết lại phiếu; nó dựng khuôn theo phiếu, và **gỡ `GT-032` khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR** (`BR-ESS-15`).

## 1. Vì sao khuôn này tồn tại

Bảng migration gộp `D5-09` vào `tpl-tap-select`. Gộp làm mất thứ duy nhất đáng giữ: **bẫy bảo toàn
lượng của Piaget** — cùng một lượng nước, rót sang cốc cao hẹp thì trẻ 4–5 tuổi nói là "nhiều hơn".
Một bài chọn đáp án thường không dựng được bẫy đó.

**Quyết định về lượng liên tục (câu hỏi mở 3, đóng 2026-08-31): lượng tử hoá thành mức.**
Căn cứ: `d509Schema` của v1 bản thân đã rời rạc — `fill_levels: number[]`, `cups[]`,
`question_type` enum, `conservation_trap: boolean`. Không có gì liên tục để mất. Mở một kiểu dữ liệu
liên tục cho v2 là thêm bề mặt mà không thêm giá trị sư phạm.

## 2. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `pour-quantity` — đã có trong union sau [`#169`](169-mechanic-vocabulary-enforcement-plan.md) |
| Nguyên thuỷ | `selection` |
| Band | `5-6` — `banned_age_bands: ["3-4", "4-5"]` |
| `layouts` | `horizontal-row` · `split-columns` |
| Hệ thống mới | Không |
| `status` khi ra đời | `draft` — chuyển `published` ở chốt kiểm 4 |

### Hợp đồng nội dung

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `prompt_audio_ref` | chuẩn | |
| `cups` | 2–4 phần tử: `cup_id` + `shape` + `capacity_units` + `fill_units` | **mức rời rạc**, cấm — NEVER số thực |
| `question_type` | `more` \| `less` \| `same` \| `pour_to_mark` | |
| `conservation_trap` | boolean | hai cốc khác hình, cùng `fill_units` |

`refine`: khi `conservation_trap` bật, phải có ≥2 cốc cùng `fill_units` mà khác `shape`.
`refine`: `fill_units` ≤ `capacity_units` với mọi cốc.

### Hợp đồng độ khó

`cup_count` · `level_steps` · `conservation_trap` · `allow_retry` · `hint_after_ms`.

### Ràng buộc

Cấm — NEVER dùng `number` không giới hạn cho lượng. `fill_units` là số nguyên trong
`[0, capacity_units]`. Đây là điều kiện để bộ sinh kiểm được bẫy bảo toàn.

## 3. Tám phần của lát dọc

| # | Sản phẩm | Ghi chú |
|---|---|---|
| 1 | `templates/GT-032/template.ts` | contract zod, `status: draft` |
| 2 | `templates/GT-032/session.ts` | dựng trên `selection` |
| 3 | `templates/GT-032/fixtures.ts` | 3 level mẫu |
| 4 | `generators/gt032.ts` | ≥8 chủ đề, mọi band hợp lệ |
| 5 | `tests/gt-032-pour-quantity.test.ts` | ≥12 ca, ≥1 ca trẻ hành động trước phản hồi |
| 6 | `docs/specs/01-platform/engines/GT-032.md` | **đã có** (Task #190) — task này chỉ gỡ mã khỏi `engine-spec-planned.json` |
| 7 | `src/generated/**` | `gen:templates` sinh, cấm — NEVER sửa tay |
| 8 | 10 level `legacy_v1_ref: "D5-09"` | trải ≥3 chủ đề, mọi band hợp lệ, ≥2 mức khó |

## 4. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `GT-032` trong registry, phiếu không mồ côi | `check:engine-specs` |
| 2 | `gen:templates` không sinh diff | `git status` |
| 3 | ≥12 ca test phiên engine xanh | `pnpm --filter @mindkid/game-engine test` |
| 4 | Bộ sinh ≥8 chủ đề, mọi cặp `(band, theme)` qua contract | `tests/generators.test.ts` |
| 5 | 10 level `legacy_v1_ref: "D5-09"`, `check:legacy-v1` tăng đúng 1 | `check:legacy-v1` |
| 6 | `check:theme-registry` và `check:engine-depth` xanh | — |
| 7 | `layout-safe-area-debt.json` không thêm dòng | diff |
| 8 | `pnpm check` xanh | — |

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Mất bẫy bảo toàn, thành bài so số thường | Cao | `refine` bắt buộc khi `conservation_trap` bật; ≥3 trong 10 level phải bật bẫy |
| Ai đó mở lại kiểu liên tục | Trung bình | Contract dùng `z.number().int()`; quyết định ghi trong phiếu engine mục 11 |
| Hình cốc chỉ là nhãn, không vẽ khác | Trung bình | Ca test: hai cốc khác `shape` phải cho hình học khác nhau ở lớp render |
