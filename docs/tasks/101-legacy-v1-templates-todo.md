# Todo — Task #101: Lô khuôn kế thừa v1 (P5)

> Lý do và work package: [`101-legacy-v1-templates-plan.md`](101-legacy-v1-templates-plan.md).
> Chặn bởi [`Task #100`](100-round-sequence-plan.md) — `BR-LVB-09` bắt mọi khuôn lô này phát event vòng.
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.

## Preflight

- [x] [`Task #100`](100-round-sequence-plan.md) đã đóng — nếu chưa, khuôn mới sẽ kế thừa lỗ `rounds_total = 0`.
- [x] Đọc [`legacy-v1-template-batch.md`](../specs/01-platform/legacy-v1-template-batch.md) §6, §7, §11.
- [x] Đọc [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) §6 — chi phí thêm một khuôn.
- [x] Đo lại §7.0 của spec: số nguyên thuỷ, số `LayoutId`, số system. Đừng tin bảng cũ.
- [x] Xác nhận `GT-018` là mã trống kế tiếp; kiểm không mã nào bị bỏ trống ở giữa.
- [x] Đếm baseline `pnpm test` để so delta sau.

## WP101.0 — Hai quyết định người (cổng người)

- [x] Câu hỏi còn mở số 1: `spot-difference`, `go-nogo`, `rule-switch` thành lô riêng hay ghép vào đây?
- [x] Câu hỏi còn mở số 3: `free-scene` là `LayoutId` thật, hay chế độ nằm ngoài layout engine?
- [x] Cả hai ghi vào spec kèm lý do; không để lửng.

## WP101.1 — Đăng ký mechanic

- [x] Thêm 7 giá trị vào từ vựng trục `mechanic` của [`content-tagging.md`](../specs/01-platform/content-tagging.md) §7.
- [x] Ca âm: khuôn khai `mechanic` chưa đăng ký phải làm cổng phủ đỏ.
- [x] Kiểm không giá trị nào trùng `mechanic` của `GT-001` tới `GT-017`.

## WP101.2 — GT-018 `listen-respond` (lát cắt dọc đầu tiên)

- [x] `pnpm exec tsx packages/game-engine/scripts/create-template.ts` sinh khung.
- [x] Session dựng trên `selection` và `ordering`; **không** tự cài lại chọn hay sắp.
- [x] Dùng `AudioController` đã có; kiểm **không** đường nào xin quyền microphone.
- [x] Phát `round_started` và `round_completed`.
- [x] Ba level mẫu chạy được, phủ C3-04, C3-08, C5-01.
- [x] `pnpm --filter @mindkid/game-engine gen:templates`; kiểm không file viết tay nào ngoài `templates/GT-018/` đổi.
- [x] Đo bundle so trần 80 KB.

## WP101.3 — GT-019 `rotate-transform`

- [x] Mở rộng `rotationSystem` đã có; **không** thêm file dưới `systems/`.
- [x] Xoay bằng nút góc 90 độ; cấm cử chỉ hai ngón, cấm xoay bằng vuốt.
- [x] `requires_tap_fallback` là true, và đường chạm-chạm chạy thật.
- [x] Ba level mẫu, phủ C2-04 và C2-09.
- [x] **CHECKPOINT A** — nhóm A xong. Đo lại chi phí thật của một khuôn trước khi mở năm system mới.

## WP101.4 — GT-020 `memory-flip`

- [x] `cardSystem`: trạng thái lật, luật ghép cặp. Dùng lại `timerSystem` và layout `card-flip-grid`.
- [x] Bộ test `cardSystem` chạy được **không nạp** `GT-020`.
- [x] Ba level mẫu, phủ C6-03. Band 3–6.

## WP101.5 — GT-021 `mirror-complete`

- [x] Layout `mirror-axis-split` vào registry của [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) **trước** khi viết Session, kèm hàm hình học và test.
- [x] `mirrorSystem` có bộ test độc lập với khuôn.
- [x] Ba level mẫu, phủ C2-03.

## WP101.6 — GT-022 `hidden-object`

- [x] Chốt `free-scene` theo quyết định ở WP101.0 trước khi viết code.
- [x] `sceneSystem` có bộ test độc lập với khuôn.
- [x] Mọi vị trí vật đi qua nguồn ngẫu nhiên có seed của [`deterministic-randomness.md`](../specs/01-platform/deterministic-randomness.md).
- [x] Chạy hai lần cùng seed cho vị trí giống hệt.
- [x] Ba level mẫu, phủ C4-01 và C4-03.

## WP101.7 — GT-023 `construct`

- [x] `assemblySystem`: snap về mỏ neo, có hit band khoan dung.
- [x] Đường chạm-chạm chạy thật, không phải cờ khai rồi bỏ đó.
- [x] Bộ test `assemblySystem` độc lập với khuôn.
- [x] Đo bundle **kèm system**; đây là khuôn nhiều rủi ro vượt trần 80 KB nhất.
- [x] Ba level mẫu, phủ C2-02 và C2-07.

## WP101.8 — GT-024 `trace-path`

- [x] `traceSystem` có bộ test độc lập với khuôn.
- [x] Khai `banned_age_bands: ["3-4"]` và `requires_tap_fallback: false`.
- [x] Cổng chặn band 3–4 thật, không chỉ ghi trong tài liệu.
- [x] Ba level mẫu, phủ C2-08.
- [x] **CHECKPOINT B** — bảy khuôn chạy được. Xác nhận trước khi khoá cổng hoàn tất.

## WP101.9 — Cổng hoàn tất lô

- [x] Cổng theo mục 7.4 của spec: mọi dạng bài v1 hoặc trỏ được tới một mã `GT-*`, hoặc có hàng ở mục 7.3.
- [x] Ca âm: thêm một dạng bài mồ côi vào fixture phải làm cổng đỏ và nêu tên nó.
- [x] Cổng kiểm mã tuần tự, không bỏ trống số ở giữa.
- [x] Cổng kiểm không hai khuôn trùng `mechanic`.

## WP101.10 — Verification

- [x] 15 rule có test mang ID rule trong tên test.
- [x] `pnpm --filter @mindkid/game-engine gen:templates` rồi kiểm cây làm việc sạch ngoài thư mục khuôn.
- [x] `pnpm lint`, `pnpm --filter @mindkid/gates test`, `pnpm check` xanh.
- [x] `pnpm test` không tăng so baseline đã đếm ở Preflight.
- [x] Mỗi khuôn ≤80 KB gzipped; ghi số đo thật vào câu hỏi còn mở số 5 của spec.
- [x] Lật `status` của [`legacy-v1-template-batch.md`](../specs/01-platform/legacy-v1-template-batch.md) sang `implemented`.
