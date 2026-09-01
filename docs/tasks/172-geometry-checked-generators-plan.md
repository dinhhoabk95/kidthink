# Kế hoạch — Task #172: Bốn bộ sinh cần kiểm hình học — `GT-016` `GT-017` `GT-021` `GT-024`

> **Loại task:** bộ sinh (L) — task con thứ tư của
> [`Task #168`](168-v1-game-list-integration-plan.md), đợt 1.
> **Chặn:** `#174`. `GT-016` `GT-021` `GT-024` nằm trong 18 engine phải backfill ở đợt 2.
> **Chặn bởi:** [`Task #169`](169-mechanic-vocabulary-enforcement-plan.md).
> **Chạy song song được với** [`Task #171`](171-solver-backed-generators-plan.md) — khác tập file.
> **Spec sở hữu:** [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md) ·
> [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md).

## 1. Trả lời ngắn

Nhóm thứ hai trong tám engine thiếu bộ sinh. Khác nhóm của [`#171`](171-solver-backed-generators-plan.md)
ở chỗ ứng viên hỏng của chúng **không vô nghiệm mà vô hình**: toạ độ ra ngoài vùng an toàn, nửa hình
không đối xứng thật, nét vẽ chồng lên nhau, khối xếp không dựng được ở góc isometric. Contract zod
không bắt được vì mọi số đều đúng kiểu.

Phép kiểm của nhóm này là **hình học**, chạy trên `layout/geometry.ts` và các hệ thống dựng hình.

## 2. Bốn engine và phép kiểm riêng

| Engine | Cơ chế | Sinh cái gì | Phép kiểm hình học |
|---|---|---|---|
| `GT-016` | `clock-hands` | giờ đích, vị trí kim | Giờ thuộc tập hợp lệ của band; góc hai kim không trùng khiến trẻ không phân biệt được |
| `GT-017` | `block-stack` | cấu hình khối | Dựng được ở góc isometric; không khối nào bị che hoàn toàn |
| `GT-021` | `mirror-complete` | nửa hình + trục | Nửa còn lại **đối xứng thật** qua trục đã khai; nửa cho sẵn không tự đối xứng |
| `GT-024` | `trace-path` | đường nét | Nét nằm trong vùng an toàn; không tự cắt; độ dài trong khoảng của band |

`GT-017` dùng `systems/isometric-system.ts`. `GT-021` dùng `systems/mirror-system.ts`.
`GT-024` dùng `systems/trace-system.ts` và `tests/layout-safe-area.test.ts`.
Cấm — NEVER tự tính lại hình học trong bộ sinh.

## 3. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Phép kiểm gọi `layout/geometry.ts` và hệ thống có sẵn | Vùng an toàn theo band đã nằm ở đó; tính lại là hai nguồn sự thật |
| D2 | Cấm — NEVER thêm dòng vào `tests/layout-safe-area-debt.json` | File nợ đó là bậc thang một chiều; bộ sinh mới không được sinh nợ mới |
| D3 | `GT-021` kiểm **cả hai chiều**: nửa còn lại đối xứng, và nửa cho sẵn không tự đối xứng | Nửa tự đối xứng làm bài vô nghĩa, và đúng kiểu ứng viên lọt qua zod |
| D4 | `axes.theme` khai ≥8 ngay từ đầu | Không phải sửa lại sau `#173` |
| D5 | Bốn engine bốn PR | — |

## 4. Việc — bốn work package cùng hình dạng

Giống mục 4 của [`#171`](171-solver-backed-generators-plan.md), thay bộ giải bằng phép kiểm hình học,
cộng thêm: mỗi bộ sinh chạy một lượt qua `computeSafeArea` của band thấp nhất mà khuôn cho phép.

## 5. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | Bốn bộ sinh đăng ký; cùng `#171` đưa `ALL_LEVEL_GENERATORS` lên **27/27** | `tests/generators.test.ts` |
| 2 | Mỗi bộ sinh khai ≥8 chủ đề và mọi band hợp lệ | test |
| 3 | Mọi ứng viên qua `content_contract` **và** phép kiểm hình học | `gen:levels` thoát 0 |
| 4 | **Ca âm mỗi engine:** ép sinh ứng viên vô hình → bị loại; hết lượt rút thì thoát khác 0 | chạy tay |
| 5 | `layout-safe-area.test.ts` xanh, `layout-safe-area-debt.json` **không thêm dòng nào** | diff |
| 6 | 0 dòng hình học viết lại trong bộ sinh | review |
| 7 | `pnpm check` xanh | — |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Bộ sinh tự tính toạ độ, lệch với `geometry.ts` | Cao | Nghiệm thu 6; import trực tiếp |
| Sinh nợ mới vào `layout-safe-area-debt.json` cho tiện | Cao | Nghiệm thu 5 đối chiếu diff; D2 cấm |
| `GT-021` sinh nửa hình tự đối xứng | Cao | D3 kiểm cả hai chiều |
| `GT-017` khối bị che hoàn toàn ở góc isometric | Trung bình | Phép kiểm đếm khối nhìn thấy được; trần khối theo band |
| `GT-016` hai kim trùng góc | Trung bình | Loại giờ mà góc lệch dưới ngưỡng phân biệt của band |
