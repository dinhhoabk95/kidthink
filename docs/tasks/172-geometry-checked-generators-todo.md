# Todo — Task #172: Bốn bộ sinh cần kiểm hình học

> Kế hoạch: [`172-geometry-checked-generators-plan.md`](172-geometry-checked-generators-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 1.
> Chạy song song được với [`Task #171`](171-solver-backed-generators-plan.md).
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [ ] [`Task #169`](169-mechanic-vocabulary-enforcement-plan.md) đã đóng.
- [ ] Đọc `layout/geometry.ts`, `systems/isometric-system.ts`, `systems/mirror-system.ts`,
      `systems/trace-system.ts` **trước** khi viết bộ sinh nào.
- [ ] Ghi lại số dòng hiện có của `tests/layout-safe-area-debt.json` — con số này cấm — NEVER tăng.

## WP172.1 — `GT-016` xoay kim đồng hồ

- [ ] `generators/gt016.ts`; giờ sinh ra thuộc tập hợp lệ của band.
- [ ] Loại giờ mà góc hai kim lệch dưới ngưỡng phân biệt của band.
- [ ] `axes`: ≥8 chủ đề, band `5-6`.
- [ ] **Ca âm:** giờ có hai kim trùng góc → bị loại.

## WP172.2 — `GT-017` xếp khối và phối cảnh

- [ ] `generators/gt017.ts`; dùng `systems/isometric-system.ts`.
- [ ] Kiểm: cấu hình dựng được ở góc isometric; không khối nào bị che hoàn toàn.
- [ ] Trần số khối theo band, khai trong bộ sinh và kiểm trong test.
- [ ] `axes`: ≥8 chủ đề, band `5-6`.
- [ ] **Ca âm:** cấu hình có khối bị che hoàn toàn → bị loại.

## WP172.3 — `GT-021` hoàn thiện đối xứng

- [ ] `generators/gt021.ts`; dùng `systems/mirror-system.ts`.
- [ ] Kiểm chiều thuận: nửa còn lại đối xứng thật qua trục đã khai.
- [ ] Kiểm chiều nghịch: nửa cho sẵn **không** tự đối xứng — nếu tự đối xứng thì bài vô nghĩa.
- [ ] `axes`: ≥8 chủ đề, band `4-5` và `5-6`.
- [ ] **Ca âm:** nửa cho sẵn tự đối xứng → bị loại.

## WP172.4 — `GT-024` vẽ theo nét

- [ ] `generators/gt024.ts`; dùng `systems/trace-system.ts`.
- [ ] Kiểm: nét nằm trong vùng an toàn của band thấp nhất khuôn cho phép; không tự cắt; độ dài trong khoảng band.
- [ ] `axes`: ≥8 chủ đề, band `5-6`.
- [ ] **Ca âm:** nét vượt vùng an toàn → bị loại.

## Đóng task

- [ ] Cùng [`#171`](171-solver-backed-generators-plan.md), `ALL_LEVEL_GENERATORS` đủ **27/27**; test đòi đúng số này.
- [ ] `gen:levels` chạy được cho cả bốn, mọi chủ đề đã khai.
- [ ] `tests/layout-safe-area-debt.json` **không thêm dòng nào** — đối chiếu diff.
- [ ] Review xác nhận 0 dòng hình học viết lại.
- [ ] `pnpm check` xanh.
- [ ] Cập nhật dòng `#172` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
