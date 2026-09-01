# Kế hoạch — Task #171: Bốn bộ sinh cần bộ giải — `GT-009` `GT-013` `GT-014` `GT-015`

> **Loại task:** bộ sinh (L) — task con thứ ba của
> [`Task #168`](168-v1-game-list-integration-plan.md), đợt 1.
> **Chặn:** `#174`, và bốn engine này nằm trong danh sách 18 engine phải backfill ở đợt 2.
> **Chặn bởi:** [`Task #169`](169-mechanic-vocabulary-enforcement-plan.md).
> **Spec sở hữu:** [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md).

## 1. Trả lời ngắn

`ALL_LEVEL_GENERATORS` có **19 trên 27** engine. Tám engine thiếu bộ sinh trùng khớp với nhóm đứng
nguyên ở sàn 3 level: `GT-009` 3 · `GT-013` 3 · `GT-014` 4 · `GT-015` 3 · `GT-016` 6 · `GT-017` 3 ·
`GT-021` 3 · `GT-024` 3. Không có bộ sinh thì chỉ còn đường soạn tay, và soạn tay dừng ở đúng ba
level mà [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) mục 4 đòi để
chứng minh hợp đồng dùng được.

Tám engine chia hai nhóm theo **thứ phải kiểm sau khi sinh**, không theo mã số. Task này làm nhóm
thứ nhất: bốn engine mà một ứng viên sinh ra có thể **hợp lệ về schema nhưng vô nghiệm hoặc đa
nghiệm**. Chúng cần một bộ giải chạy ngay trong bộ sinh.

## 2. Bốn engine và phép kiểm riêng

| Engine | Cơ chế | Sinh cái gì | Bộ giải phải khẳng định |
|---|---|---|---|
| `GT-009` | `clue-deduction` | tập ứng viên + 1–3 manh mối | Sau khi áp hết manh mối còn **đúng một** ứng viên sống |
| `GT-013` | `maze-route` | lưới, tường, điểm đầu/cuối | Có **đúng một** đường đi ngắn nhất hợp lệ; độ dài nằm trong khoảng của band |
| `GT-014` | `balance-scale` | vật và khối lượng hai bên | Trạng thái đích đạt được bằng số bước cho phép; không có lời giải tầm thường |
| `GT-015` | `sudoku-mini` | lưới 2×2 hoặc 3×3 có ô trống | **Đúng một** cách điền; ô cho sẵn không dư |

`GT-009` đã có `templates/GT-009/deduction.ts` — luật loại trừ dùng chung giữa `refine` của contract
và Session. **Bộ sinh phải gọi đúng file đó**, cấm — NEVER viết lại luật lần thứ ba.
`GT-013` `GT-015` tương tự với `systems/maze-system.ts` và `systems/constraint-system.ts`.

## 3. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Bộ giải **dùng lại** hệ thống có sẵn, cấm — NEVER viết bản thứ hai | Hai bản luật sẽ drift, và bản trong bộ sinh là bản không ai chạy lúc chơi |
| D2 | Sinh rồi kiểm rồi rút lại, tối đa `MAX_ATTEMPTS_PER_ITEM` | `gen-levels.ts` đã có vòng rút lại; bản cũ bỏ qua ứng viên trùng mà không rút lại nên `--count=9` ghi 6 file rồi vẫn thoát 0 |
| D3 | Hết lượt rút mà chưa đủ thì **thoát khác 0** | Cổng im lặng ghi thiếu file là đúng cái lỗi vừa dẫn |
| D4 | `axes.theme` khai ≥8 ngay từ đầu | `#173` mở cho 19 bộ sinh cũ; bốn bộ sinh mới ra đời đã đúng chuẩn, không phải sửa lại |
| D5 | Bốn engine bốn PR | Bốn bộ giải khác nhau; gộp thì review không nổi |

## 4. Việc — bốn work package cùng hình dạng

Mỗi engine:

1. `packages/game-engine/src/generators/gt0nn.ts` — khai `axes` (≥8 chủ đề, mọi band hợp lệ của khuôn),
   `generate()` gọi hệ thống có sẵn để kiểm nghiệm.
2. Đăng ký vào `generators/index.ts`.
3. Test trong `tests/generators.test.ts`: mọi cặp `(band, theme)` đã khai sinh được và qua
   `content_contract`; ứng viên vô nghiệm bị loại chứ không lọt.
4. Chạy `gen:levels --engine=GT-0nn --count=6 --seed=171` cho mỗi chủ đề, xác nhận đủ file và không trùng.

## 5. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | Bốn bộ sinh đăng ký; `ALL_LEVEL_GENERATORS` lên **23/27** | `tests/generators.test.ts` |
| 2 | Mỗi bộ sinh khai ≥8 chủ đề và mọi band hợp lệ | test |
| 3 | Mọi ứng viên qua `content_contract` của khuôn | `gen:levels` thoát 0 |
| 4 | **Ca âm mỗi engine:** ép bộ giải trả "vô nghiệm" → bộ sinh rút lại, hết lượt thì thoát khác 0 | chạy tay, ghi đầu ra |
| 5 | Không ứng viên trùng trong một lượt sinh | test |
| 6 | Bộ giải gọi hệ thống có sẵn, 0 dòng luật viết lại | review, `pnpm lint:deps` |
| 7 | `pnpm check` xanh | — |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Bộ giải viết lại luật, drift với Session | Cao | Nghiệm thu 6; import trực tiếp từ `systems/` hoặc `templates/GT-009/deduction.ts` |
| Sinh vòng vô hạn khi tham số làm bài toán vô nghiệm | Trung bình | `MAX_ATTEMPTS_PER_ITEM` đã có; nghiệm thu 4 là ca âm cho nó |
| `GT-015` sinh lưới đa nghiệm mà vẫn qua contract | Cao | Bộ giải phải đếm số nghiệm, không chỉ tìm một nghiệm |
| `GT-013` mê cung quá dễ ở band cao | Trung bình | Ràng buộc độ dài đường đi theo band, khai trong `axes` và kiểm trong test |
