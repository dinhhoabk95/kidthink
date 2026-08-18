# Todo — Task #92: Bộ dựng layout cho màn chơi (P1)

> Lý do và work package: [`92-game-layout-engine-plan.md`](92-game-layout-engine-plan.md).
> Chặn [`Task #93`](93-deterministic-randomness-plan.md) và [`Task #97`](97-template-authoring-kit-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.

## Preflight

- [ ] Đọc [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) §6, §7 và §11.
- [ ] Đo lại: có tệp nào chứa `LayoutId` chưa, và 12 giá trị layout đang nằm ở đâu.
- [ ] Đọc ngưỡng vùng chạm ở [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] `pnpm check` và `pnpm test` xanh trước khi sửa dòng đầu tiên.

## WP92.0 — Hai câu hỏi người

- [ ] Q1: dải 3–4 tuổi có nút sang trang nhìn thấy được, hay engine tự chuyển trang?
- [ ] Q2: 12 `LayoutId` gộp được thành mấy hàm?
- [ ] Ghi hai câu trả lời vào §11 của spec, gạch ngang hàng đã đóng.

## WP92.1 — Kiểu và registry

- [ ] Union `LayoutId` đúng 12 giá trị của spec.
- [ ] Kiểu `Slot{index, x, y, w, h, hitW, hitH, page}`.
- [ ] Registry id sang hàm; test khẳng định mỗi giá trị có đúng một hàm.

## WP92.2 — Hàm hình học

- [ ] Viết hàm theo số lượng đã chốt ở Q2.
- [ ] Test: cùng id và cùng số ô cho cùng `Slot[]` hai lần chạy (`BR-LAY-01`).
- [ ] Test: các ô không chồng nhau, thứ tự theo index.
- [ ] Khẳng định không lời gọi ngẫu nhiên nào trong thư mục layout.

## WP92.3 — Vùng chạm

- [ ] `hitW`/`hitH` lấy ngưỡng từ [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] Test theo ba dải tuổi, dải nhỏ nhất trước.

## WP92.4 — Phân trang

- [ ] Cài `BR-LAY-04` theo quyết định Q1.
- [ ] Test: vượt trần thì `page` tăng, index không đảo.

## WP92.5 — Nối vào engine và studio

- [ ] `GameEngine.load()` chọn hàm theo `layout_id` trong tham số độ khó.
- [ ] Studio có ô chọn layout, giới hạn trong union.
- [ ] Test template hiện có cho cùng kết quả như trước task.

## WP92.6 — Siết hợp đồng template

- [ ] `layouts` từ `string[]` thành union.
- [ ] Cổng chặn giá trị lạ; fixture sai cố ý; test khẳng định cổng đỏ.

## WP92.7 — Đóng task

- [ ] 12 rule `BR-LAY` có test gọi tên mã.
- [ ] Lật `status` sang `implemented`.
- [ ] `pnpm check` · `pnpm test` · `pnpm check:progress` xanh.
- [ ] Mở PR cho người review diff, không tự merge.
