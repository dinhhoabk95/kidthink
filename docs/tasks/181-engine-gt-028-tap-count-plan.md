# Kế hoạch — Task #181: `GT-028` Chạm đếm tích luỹ — `tap-count`

> **Loại task:** lát dọc engine (L) — đợt 3 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** khuôn `GT-028` chạy được, cộng **10 level** mang `legacy_v1_ref: "D1-10"`.
> **Game type v1 gánh:** `D1-10` Đếm Nhảy cóc — `C1.CNT.05` · `C1.CNT.09` — nguồn `d1/TapNumberSenseSession.ts`.
> **Chặn bởi:** chốt kiểm 2. **Chạy song song được với** năm task còn lại của đợt 3.
> **Spec sở hữu:** phiếu engine [`docs/specs/01-platform/engines/GT-028.md`](../specs/01-platform/engines/GT-028.md) — **đã viết** ở [Task #190](190-engine-spec-first-authoring-spec.md). Task này cấm — NEVER viết lại phiếu; nó dựng khuôn theo phiếu, và **gỡ `GT-028` khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR** (`BR-ESS-15`).

## 1. Vì sao khuôn này tồn tại

`GT-001` cho trẻ chạm **một** đáp án rồi chấm ngay. `D1-10` đếm nhảy cóc đòi thứ khác: trẻ chạm
**nhiều lần**, con số cộng dồn hiện ra, và trẻ **sửa lại được** trước khi nộp. Không khuôn nào trong
27 khuôn hiện có làm được — grep `accumulator` trên `packages/game-engine/src` trả về 0 kết quả.

Khác biệt sư phạm: đếm nhảy cóc theo bước 2, 5, 10 dạy cấu trúc số, không dạy nhận diện. Trẻ phải
giữ con số trong đầu qua nhiều lần chạm — đó là bộ nhớ làm việc, không phải nhận biết.

## 2. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `tap-count` — đã có trong union sau [`#169`](169-mechanic-vocabulary-enforcement-plan.md) |
| Nguyên thuỷ | `selection` |
| Band | `4-5` · `5-6` — `banned_age_bands: ["3-4"]` |
| `layouts` | `grid` · `flex-wrap` |
| Hệ thống mới | Không — bộ đếm nằm trong session |
| `status` khi ra đời | `draft` — chuyển `published` ở chốt kiểm 4 |

### Hợp đồng nội dung

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `prompt_audio_ref` | chuẩn | |
| `step` | `2` \| `5` \| `10` | bước nhảy — trục khó chính |
| `items` | 4–20 phần tử, mỗi phần tử `item_id` + `asset` | vật để chạm |
| `target_total` | số nguyên | tổng đúng, `refine` đòi chia hết cho `step` |

### Hợp đồng độ khó

`step` · `item_count` · `allow_undo` · `hint_after_ms` · `shuffle_items`.

### Event

`game_started` · `item_tapped` · `count_undone` · `count_submitted` · `game_completed`.
`count_undone` là event mới — phải đăng ký vào catalog **và** `ALLOWED_EVENT_NAMES`.

## 3. Tám phần của lát dọc

| # | Sản phẩm | Ghi chú |
|---|---|---|
| 1 | `templates/GT-028/template.ts` | contract zod, `status: draft`, `mechanic` lấy từ union |
| 2 | `templates/GT-028/session.ts` | dựng trên `selection` |
| 3 | `templates/GT-028/fixtures.ts` | 3 level mẫu, khác band hoặc khác dạng bài |
| 4 | `generators/gt028.ts` | ≥8 chủ đề, mọi band hợp lệ |
| 5 | `tests/gt-028-tap-count.test.ts` | ≥12 ca, ≥1 ca trẻ hành động trước phản hồi |
| 6 | `docs/specs/01-platform/engines/GT-028.md` | **đã có** (Task #190) — task này chỉ gỡ mã khỏi `engine-spec-planned.json` |
| 7 | `src/generated/**` | `gen:templates` sinh, cấm — NEVER sửa tay |
| 8 | 10 level `legacy_v1_ref: "D1-10"` | trải ≥3 chủ đề, mọi band hợp lệ, ≥2 mức khó |

## 4. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `GT-028` trong registry, `check:engine-specs` xanh, phiếu không mồ côi | `check:engine-specs` |
| 2 | `gen:templates` không sinh diff sau khi chạy | `git status` |
| 3 | ≥12 ca test phiên engine xanh | `pnpm --filter @mindkid/game-engine test` |
| 4 | Bộ sinh khai ≥8 chủ đề, mọi cặp `(band, theme)` sinh được và qua contract | `tests/generators.test.ts` |
| 5 | 10 level `legacy_v1_ref: "D1-10"`, `check:legacy-v1` tăng đúng 1 game type | `check:legacy-v1` |
| 6 | `check:theme-registry` và `check:engine-depth` xanh | — |
| 7 | `layout-safe-area.test.ts` xanh, `layout-safe-area-debt.json` không thêm dòng | diff |
| 8 | `pnpm check` xanh | — |

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Khuôn tụt xuống thành `GT-001` trá hình | Cao | Ca test bắt buộc: trẻ chạm sai rồi `count_undone` rồi nộp đúng. Không có ca đó thì khuôn không có lý do tồn tại |
| Bộ đếm viết thành hệ thống mới không cần thiết | Trung bình | Nguyên thuỷ `selection` đủ; review từ chối file mới dưới `systems/` |
| `target_total` không chia hết cho `step` | Trung bình | `refine` trong contract, kèm ca âm |
