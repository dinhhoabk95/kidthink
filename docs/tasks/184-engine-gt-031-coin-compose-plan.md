# Kế hoạch — Task #184: `GT-031` Gộp tiền xu — `coin-compose`

> **Loại task:** lát dọc engine (L) — đợt 3 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** khuôn `GT-031` chạy được, cộng **10 level** mang `legacy_v1_ref: "D5-10"`.
> **Game type v1 gánh:** `D5-10` Tiền xu đơn giản — `C1.MEAS.14` — nguồn `d5/MoneySession.ts`.
> **Chặn bởi:** chốt kiểm 2. **Chạy song song được với** năm task còn lại của đợt 3.
> **Spec sở hữu:** phiếu engine [`docs/specs/01-platform/engines/GT-031.md`](../specs/01-platform/engines/GT-031.md) — **đã viết** ở [Task #190](190-engine-spec-first-authoring-spec.md). Task này cấm — NEVER viết lại phiếu; nó dựng khuôn theo phiếu, và **gỡ `GT-031` khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR** (`BR-ESS-15`).

## 1. Vì sao khuôn này tồn tại

Bảng migration để `tpl-coin-count` riêng rồi ghi chú "nên gộp vào `tpl-drag-to-container` sau".
Gộp là sai: kéo xu vào lợn đất giống kéo táo vào rổ về **thao tác**, nhưng khác hẳn về **luật** —
mỗi xu mang một giá trị, và đích là một **tổng**, không phải một số lượng.

Đây là khuôn duy nhất trong 36 mà phần tử có giá trị khác nhau. Nó dạy hệ đếm có mệnh giá, tiền đề
của phép cộng nhiều số hạng.

## 2. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `coin-compose` — đã có trong union sau [`#169`](169-mechanic-vocabulary-enforcement-plan.md) |
| Nguyên thuỷ | `selection + placement` |
| Band | `5-6` — `banned_age_bands: ["3-4", "4-5"]` |
| `layouts` | `multi-bucket-bottom` · `horizontal-row` |
| Hệ thống mới | Không |
| `status` khi ra đời | `draft` — chuyển `published` ở chốt kiểm 4 |

### Hợp đồng nội dung

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `prompt_audio_ref` | chuẩn | |
| `coins` | 2–8 phần tử: `coin_id` + `asset` + `value` | **mệnh giá là nội dung** |
| `target_amount` | số nguyên >0 | tổng phải đạt |
| `item_to_buy` | `label` + `asset`, tuỳ chọn | bối cảnh mua bán |

`refine`: tồn tại một tổ hợp con của `coins` cộng đúng `target_amount`.

### Hợp đồng độ khó

`coin_kind_count` · `target_amount` · `exact_change` · `allow_retry` · `hint_after_ms`.

### Ràng buộc

Mệnh giá lấy từ `content_pack`, cấm — NEVER hardcode trong session. v1 đã sai chỗ này: `d510Schema`
có ghi chú *"spec says number[], but seeder/handler use string[] like `[1k, 2k]`"* — hai nguồn sự
thật cho cùng một mệnh giá. Ở v2 chỉ có một, và nó là `value: number` trong contract.

## 3. Tám phần của lát dọc

| # | Sản phẩm | Ghi chú |
|---|---|---|
| 1 | `templates/GT-031/template.ts` | contract zod, `status: draft` |
| 2 | `templates/GT-031/session.ts` | dựng trên `selection + placement` |
| 3 | `templates/GT-031/fixtures.ts` | 3 level mẫu |
| 4 | `generators/gt031.ts` | ≥8 chủ đề, mọi band hợp lệ |
| 5 | `tests/gt-031-coin-compose.test.ts` | ≥12 ca, ≥1 ca trẻ hành động trước phản hồi |
| 6 | `docs/specs/01-platform/engines/GT-031.md` | **đã có** (Task #190) — task này chỉ gỡ mã khỏi `engine-spec-planned.json` |
| 7 | `src/generated/**` | `gen:templates` sinh, cấm — NEVER sửa tay |
| 8 | 10 level `legacy_v1_ref: "D5-10"` | trải ≥3 chủ đề, mọi band hợp lệ, ≥2 mức khó |

## 4. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `GT-031` trong registry, phiếu không mồ côi | `check:engine-specs` |
| 2 | `gen:templates` không sinh diff | `git status` |
| 3 | ≥12 ca test phiên engine xanh | `pnpm --filter @mindkid/game-engine test` |
| 4 | Bộ sinh ≥8 chủ đề, mọi cặp `(band, theme)` qua contract | `tests/generators.test.ts` |
| 5 | 10 level `legacy_v1_ref: "D5-10"`, `check:legacy-v1` tăng đúng 1 | `check:legacy-v1` |
| 6 | `check:theme-registry` và `check:engine-depth` xanh | — |
| 7 | `layout-safe-area-debt.json` không thêm dòng | diff |
| 8 | `pnpm check` xanh | — |

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Mệnh giá hardcode trong session | Cao | Review; ca test đổi `value` trong content phải đổi kết quả chấm |
| Sinh bài không có tổ hợp nào cộng đúng | Cao | `refine` giải tổng con; bộ sinh loại ứng viên vô nghiệm |
| Lặp lỗi hai kiểu mệnh giá của v1 | Trung bình | Contract chỉ nhận `value: number`; nhãn hiển thị tách riêng |
