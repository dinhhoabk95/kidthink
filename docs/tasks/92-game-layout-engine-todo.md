# Todo — Task #92: Bộ dựng layout cho màn chơi (P1)

> Lý do và work package: [`92-game-layout-engine-plan.md`](92-game-layout-engine-plan.md).
> Chặn [`Task #93`](93-deterministic-randomness-plan.md) và [`Task #97`](97-template-authoring-kit-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.

## Preflight

- [x] Đọc [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) §6, §7 và §11.
- [x] Đo lại: có tệp nào chứa `LayoutId` chưa, và 12 giá trị layout đang nằm ở đâu.
- [x] Đọc ngưỡng vùng chạm ở [`accessibility.md`](../specs/08-quality/accessibility.md).
- [x] `pnpm check` và `pnpm test` xanh trước khi sửa dòng đầu tiên.

## WP92.0 — Hai câu hỏi người

- [x] Q1: dải 3–4 tuổi có nút sang trang nhìn thấy được, hay engine tự chuyển trang?
- [x] Q2: 12 `LayoutId` gộp được thành mấy hàm?
- [x] Ghi hai câu trả lời vào §11 của spec, gạch ngang hàng đã đóng.

## WP92.1 — Kiểu và registry

- [x] Union `LayoutId` đúng 12 giá trị của spec.
- [x] Kiểu `Slot{index, x, y, w, h, hitW, hitH, page}`.
- [x] Registry id sang hàm; test khẳng định mỗi giá trị có đúng một hàm.

## WP92.2 — Hàm hình học

- [x] Viết hàm theo số lượng đã chốt ở Q2.
- [x] Test: cùng id và cùng số ô cho cùng `Slot[]` hai lần chạy (`BR-LAY-01`).
- [x] Test: các ô không chồng nhau, thứ tự theo index.
- [x] Khẳng định không lời gọi ngẫu nhiên nào trong thư mục layout.

## WP92.3 — Vùng chạm

- [x] `hitW`/`hitH` lấy ngưỡng từ [`accessibility.md`](../specs/08-quality/accessibility.md).
- [x] Test theo ba dải tuổi, dải nhỏ nhất trước.

## WP92.4 — Phân trang

- [x] Cài `BR-LAY-04` theo quyết định Q1.
- [x] Test: vượt trần thì `page` tăng, index không đảo.

## WP92.5 — Nối vào engine và studio

- [x] `GameEngine.load()` chọn hàm theo `layout_id` trong tham số độ khó.
- [x] Studio có ô chọn layout, giới hạn trong union.
- [x] Test template hiện có cho cùng kết quả như trước task.

## WP92.6 — Siết hợp đồng template

- [x] `layouts` từ `string[]` thành union.
- [x] Cổng chặn giá trị lạ; fixture sai cố ý; test khẳng định cổng đỏ.

## WP92.7 — Đóng task

- [x] 12 rule `BR-LAY` có test gọi tên mã.
- [x] Lật `status` sang `implemented`.
- [x] `pnpm check` · `pnpm test` · `pnpm check:progress` xanh.
- [x] Mở PR cho người review diff, không tự merge.
