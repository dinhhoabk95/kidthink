# Kế hoạch — Task #173: Mở trục chủ đề của 19 bộ sinh — 5 lên ≥8

> **Loại task:** mở năng lực (M) — task con thứ năm của
> [`Task #168`](168-v1-game-list-integration-plan.md), đợt 1.
> **Chặn:** toàn bộ đợt 2. `theme-caps.json` đòi `min_themes_count` 8 và `engine_max_ratio` 0,5;
> với 5 chủ đề thì 80 level của `GT-003` cấm — NEVER qua được trần.
> **Chặn bởi:** [`Task #169`](169-mechanic-vocabulary-enforcement-plan.md).
> **Chạy song song được với** [`#171`](171-solver-backed-generators-plan.md) và [`#172`](172-geometry-checked-generators-plan.md).
> **Spec sở hữu:** [`content-theme-registry.md`](../specs/05-content/content-theme-registry.md) ·
> [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md).

## 1. Trả lời ngắn

Cả **19** bộ sinh hiện có đều khai đúng cùng một dòng:

```ts
theme: ["school", "farm", "home", "nature", "food"],
```

Năm trên 14 chủ đề của `CONTENT_THEMES`. Chín chủ đề chưa bộ sinh nào chạm: `animal` `ocean`
`vehicle` `art` `space` `family` `body` `weather` `festival`.

Rào **không phải vốn từ** — đo 2026-08-31, cả 14 chủ đề đều có đúng 10 danh từ. Rào là một dòng
viết cứng được sao chép 19 lần.

Đây là trần rẻ nhất của cả chương trình: sửa 19 dòng đưa tích `khuôn × chủ đề` từ 1,0× lên 1,6×,
và là điều kiện cần để 510 level của đợt 2 không vỡ trần tập trung chủ đề.

## 2. Ràng buộc phải tôn trọng

`packages/db/config/theme-caps.json`:

| Trần | Giá trị | Ý nghĩa với task này |
|---|---|---|
| `min_themes_count` | 8 | Sàn mỗi bộ sinh phải khai |
| `engine_max_ratio` | 0,50 | Không chủ đề nào quá nửa số level của một engine |
| `catalog_max_ratio` | 0,25 | Trên toàn catalog |
| `min_levels_per_theme` | 5 | Chủ đề đã khai thì phải thật sự có level |
| `stepwise_caps.school` | 0,37 | `BR-CTR-09` — **chỉ giảm**. Task này chưa đổi, đợt 2 mới đổi |

## 3. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Sàn **8** chủ đề mỗi bộ sinh, không phải 14 | Có engine thật sự không hợp vài chủ đề; ép 14 là mời người ta khai lấy lệ |
| D2 | Chủ đề bị loại phải **ghi lý do trong mã**, cấm — NEVER bỏ im lặng | Bỏ im lặng thì không phân biệt được "không hợp" với "quên" |
| D3 | Test đòi hai chủ đề khác nhau cùng seed cho **nội dung khác nhau** | Khai 8 chủ đề mà sinh ra 8 level giống hệt là qua cổng nhưng không đa dạng gì |
| D4 | Mục tiêu phủ: ≥**12 trên 14** chủ đề có ít nhất một bộ sinh dùng | Hai chủ đề được phép trống nếu có lý do ghi rõ |
| D5 | Cấm — NEVER đụng logic `generate()` | Task này chỉ mở trục. Đổi logic là task khác, và làm review không tách được nguyên nhân |

## 4. Việc

1. Với mỗi bộ sinh trong 19: mở `axes.theme` lên ≥8, chọn theo độ hợp với cơ chế.
2. Chủ đề loại ra: thêm comment một dòng nêu lý do ngay tại `axes`.
3. `tests/generators.test.ts` bổ sung ba phép kiểm:
   - mọi bộ sinh khai ≥8 chủ đề;
   - mọi cặp `(engine, theme)` đã khai sinh được và qua `content_contract`;
   - hai chủ đề khác nhau, cùng seed, cho `content_pack` khác nhau.
4. Đo lại số chủ đề được ít nhất một bộ sinh dùng; đòi ≥12.

## 5. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | 19 bộ sinh đều khai ≥8 chủ đề | `tests/generators.test.ts` |
| 2 | ≥12/14 chủ đề có ít nhất một bộ sinh dùng | test |
| 3 | Mọi cặp `(engine, theme)` đã khai sinh được, qua contract | test |
| 4 | Hai chủ đề khác nhau cùng seed cho nội dung khác nhau | test |
| 5 | Mọi chủ đề bị loại có lý do ghi trong mã | review |
| 6 | **Ca âm:** hạ một bộ sinh xuống 5 chủ đề → test đỏ | chạy tay |
| 7 | **Ca âm:** làm `generate()` bỏ qua tham số `theme` → phép kiểm 4 đỏ | chạy tay |
| 8 | 0 thay đổi logic trong thân `generate()` | diff |
| 9 | `pnpm check` xanh | — |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Khai 8 chủ đề nhưng `generate()` không dùng vốn từ theo chủ đề | Cao | Nghiệm thu 4 và ca âm 7 bắt đúng ca này |
| Chủ đề bị loại vì tiện, không vì lý do thật | Trung bình | D2 + review |
| Nới `theme-caps.json` để qua trần | Trung bình | `BR-CTR-09` cấm; task này cấm — NEVER chạm file cấu hình đó |
| Đụng logic `generate()` làm level cũ đổi | Trung bình | D5 + nghiệm thu 8 đối chiếu diff |
