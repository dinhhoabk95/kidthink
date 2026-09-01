# Todo — Task #171: Bốn bộ sinh cần bộ giải

> Kế hoạch: [`171-solver-backed-generators-plan.md`](171-solver-backed-generators-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 1.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.
> Bốn engine bốn PR.

## Preflight

- [x] Đo: 19/27 bộ sinh; tám engine thiếu đều nằm trong nhóm ≤6 level.
- [x] [`Task #169`](169-mechanic-vocabulary-enforcement-plan.md) đã đóng.
- [x] Đọc `templates/GT-009/deduction.ts`, `systems/maze-system.ts`, `systems/balance-system.ts`,
      `systems/constraint-system.ts` **trước** khi viết bộ sinh nào.

## WP171.1 — `GT-009` loại trừ theo manh mối

- [x] `generators/gt009.ts`; bộ giải **gọi** `templates/GT-009/deduction.ts`, cấm — NEVER viết lại luật.
- [x] Kiểm: sau khi áp hết manh mối còn **đúng một** ứng viên sống.
- [x] Band `4-5` giữ trần **6** ứng viên như test hiện có.
- [x] `axes`: ≥8 chủ đề, band `4-5` và `5-6`.
- [x] **Ca âm:** ép bộ giải trả 2 ứng viên sống → ứng viên bị loại; hết lượt rút thì thoát khác 0.

## WP171.2 — `GT-013` tìm đường mê cung

- [x] `generators/gt013.ts`; dùng `systems/maze-system.ts`.
- [x] Kiểm: **đúng một** đường đi ngắn nhất; độ dài trong khoảng của band.
- [x] `axes`: ≥8 chủ đề, band `4-5` và `5-6`.
- [x] **Ca âm:** lưới không có đường đi → bị loại, không lọt vào file sinh ra.

## WP171.3 — `GT-014` cân hai bên

- [x] `generators/gt014.ts`; dùng `systems/balance-system.ts`.
- [x] Khối lượng là **nội dung**, cấm — NEVER hardcode trong bộ sinh.
- [x] Kiểm: đạt trạng thái cân bằng trong số bước cho phép; loại lời giải tầm thường (hai bên đã bằng nhau sẵn).
- [x] `axes`: ≥8 chủ đề, band `5-6`.
- [x] **Ca âm:** cấu hình vô nghiệm → bị loại.

## WP171.4 — `GT-015` lưới không lặp

- [x] `generators/gt015.ts`; dùng `systems/constraint-system.ts`.
- [x] Bộ giải **đếm số nghiệm**, không chỉ tìm một. Đa nghiệm là loại.
- [x] Kiểm: ô cho sẵn không dư — bỏ một ô cho sẵn bất kỳ thì bài phải thành đa nghiệm.
- [x] `axes`: ≥8 chủ đề, band `4-5` và `5-6`.
- [x] **Ca âm:** lưới đa nghiệm → bị loại.

## Đóng task

- [x] `ALL_LEVEL_GENERATORS` lên **23/27**; test đòi đúng số này.
- [x] `gen:levels --engine=GT-0nn --count=6 --seed=171` chạy được cho cả bốn, mỗi chủ đề đã khai.
- [x] Không ứng viên trùng trong một lượt sinh.
- [x] Review xác nhận **0 dòng luật viết lại** trong bốn bộ sinh.
- [x] `pnpm check` xanh.
- [x] Cập nhật dòng `#171` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
