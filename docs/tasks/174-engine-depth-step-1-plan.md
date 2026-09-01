# Kế hoạch — Task #174: Bật `engine-depth` bậc 1

> **Loại task:** bậc thang nội dung (M) — task con cuối của đợt 1,
> [`Task #168`](168-v1-game-list-integration-plan.md).
> **Chặn:** chốt kiểm 1, và qua đó chặn cả đợt 2.
> **Chặn bởi:** [`#171`](171-solver-backed-generators-plan.md) · [`#172`](172-geometry-checked-generators-plan.md) · [`#173`](173-generator-theme-axis-expansion-plan.md).
> **Spec sở hữu:** [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md).

## 1. Trả lời ngắn

`packages/db/config/engine-depth.json` đang ở `active_step: 0` — sàn 3 level mỗi engine, span 1 trên
cả bốn trục. Corpus có 250 level nhưng **13 engine đứng đúng ở 3**, và sàn bậc 0 không bắt được điều
đó vì 3 chính là sàn.

Bậc 1 đòi 6 level, ≥1 band, span 2 trên `thinking` · `what` · `theme` · `difficulty`, và ≥1 level
`free` hoặc `login`. Sau `#171` `#172` `#173` thì mọi engine đều có bộ sinh và ≥8 chủ đề, nên bù đủ
6 level là việc chạy `gen:levels`, không phải việc biên soạn.

Task này là **chốt số nền** trước khi đợt 2 đổ 510 level vào. Đo trong lúc corpus đang đổi thì số vô nghĩa.

## 2. Bằng chứng đã đo (2026-08-31)

| Số đo | Giá trị |
|---|---:|
| Level trong seed | 250 |
| Engine đứng đúng ở 3 level | 13 |
| Engine dày nhất | `GT-012` 46 · `GT-003` 32 · `GT-001` 30 |
| Bậc đang bật | 0 |
| Sàn bậc 1 | 6 level · `min_band_count` 1 · span 2 bốn trục · `min_free_or_login` 1 |
| Level cần bù | ≈ 13 engine × 3 = **39**, cộng phần span còn thiếu |

## 3. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Bù bằng `gen:levels`, cấm — NEVER soạn tay | Sau đợt 1 mọi engine đã có bộ sinh; soạn tay là quay lại đúng chỗ đang kẹt |
| D2 | Bật bậc **1**, không nhảy thẳng bậc 2 | Bậc là quyết định ngân sách biên soạn. Bậc 2 (12 level) để đợt 2 tự đạt rồi mới bật |
| D3 | Cấm — NEVER hạ số trong `steps` để cổng xanh | Bậc thang chỉ có nghĩa khi nó một chiều |
| D4 | Ghi `history` khi đổi `active_step` | Cùng khuôn `theme-caps.json`; bậc lùi phải nhìn thấy được |
| D5 | Level bù mang `legacy_v1_ref` **nếu** dạng bài khớp một game type v1 | Bù cho bậc 1 và phủ v1 là hai đích, nhưng cùng một level phục vụ được cả hai. Không khớp thì để trống |

## 4. Việc

1. Chạy `check:engine-depth` ở bậc 1 **trước khi đổi cấu hình**, lấy danh sách engine thủng và trục thiếu.
2. Với mỗi engine thủng: `gen:levels --engine=GT-0nn --theme=<chủ đề mới> --band=<band thiếu> --count=<số thiếu>`.
3. Chọn chủ đề và band sao cho span 2 đạt được, không chỉ đủ số lượng.
4. Đổi `active_step` 0 → 1, ghi `history`.
5. Chạy lại `check:engine-depth`, `check:theme-registry`, `seed:check`.

## 5. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | Mọi engine ≥6 level `published` | `check:engine-depth` |
| 2 | Span ≥2 trên bốn trục cho mọi engine | `check:engine-depth` |
| 3 | Mỗi engine ≥1 level `free` hoặc `login` | `check:engine-depth` |
| 4 | `max_out_of_band` vẫn 0 | `check:engine-depth` |
| 5 | Tổng level ≥ **162** | `seed:report` |
| 6 | `active_step: 1`, `history` có hàng mới | diff |
| 7 | `steps` **không đổi giá trị nào** | diff |
| 8 | **Ca âm:** gỡ một level của một engine ở sàn → cổng thoát khác 0 | chạy tay |
| 9 | `check:theme-registry` vẫn xanh | — |
| 10 | `pnpm check` xanh | — |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Bù đủ số nhưng không đủ span | Cao | Bước 3 chọn theo trục thiếu, không chọn theo số lượng. Nghiệm thu 2 |
| Hạ sàn trong `steps` cho cổng xanh | Cao | D3 + nghiệm thu 7 đối chiếu diff |
| Level bù đơn điệu, cùng chủ đề | Trung bình | `check:theme-registry` `engine_max_ratio` 0,5 bắt được |
| Gắn `legacy_v1_ref` bừa cho level bù | Trung bình | D5 — không khớp thì để trống; cổng phủ v1 của `#170` đếm level qua contract, không đếm nhãn |
| Cổng đọc Postgres, máy chưa chạy Docker | Trung bình | Preflight bật daemon; cổng thoát khác 0 trung thực chứ cấm — NEVER xanh giả |
