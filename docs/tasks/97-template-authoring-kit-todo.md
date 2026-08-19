# Todo — Task #97: Bộ dựng template (P4)

> Lý do và work package: [`97-template-authoring-kit-plan.md`](97-template-authoring-kit-plan.md).
> Chặn bởi [`Task #92`](92-game-layout-engine-plan.md) và [`Task #93`](93-deterministic-randomness-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.

## Preflight

- [x] Hai task chặn đã đóng: bộ dựng layout và ngẫu nhiên có seed.
- [x] Đọc [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) §6, §7, §11.
- [x] Ghi lại kết quả test template **trước** khi chuyển, để so sánh sau (snapshot hành vi).
- [x] Đo số dòng lặp giữa sáu template, để WP97.2 có số so sánh.

## WP97.0 — Danh sách cơ chế từ phía nội dung

- [x] Q1: bốn nguyên thuỷ có phủ được template 7 tới 20 không?
- [x] Q3: 60 loại game bản v1 port sang bao nhiêu template, bao nhiêu chỉ là gói nội dung khác?
- [x] Nếu chưa có danh sách: ghi rõ bộ nguyên thuỷ chỉ phục vụ sáu template hiện tại.

## WP97.1 — Chuyển bố cục sáu template

- [x] Mỗi template có tệp khai báo và tệp phiên riêng dưới thư mục của chính nó.
- [x] Bỏ registry duy trì bằng tay.
- [x] So khớp snapshot hành vi: test template cho **cùng kết quả** như trước khi chuyển.

## WP97.2 — Bốn nguyên thuỷ

- [x] Rút nguyên thuỷ từ phần sáu template đang lặp, không thiết kế trước cho template chưa có.
- [x] Dùng bộ dựng layout của [`Task #92`](92-game-layout-engine-plan.md).
- [x] Dùng nguồn ngẫu nhiên có seed của [`Task #93`](93-deterministic-randomness-plan.md).
- [x] Mỗi nguyên thuỷ có test riêng; ghi số dòng lặp giảm được.

## WP97.3 — Lệnh sinh khung

- [x] Sinh thư mục, tệp khai báo, tệp phiên, tệp test rỗng.
- [x] Template vừa sinh **không** tự vào registry.
- [x] Sinh một template thử và chạy `pnpm check`.

## WP97.4 — Quyết định về hai khái niệm lưu trữ

- [x] Chốt: thêm migration, hay thu hẹp phạm vi spec cho MVP.
- [x] Ghi quyết định kèm lý do vào spec; không để lửng.

## WP97.5 — Cổng bố cục

- [x] Cổng chặn thư mục template thiếu tệp bắt buộc.
- [x] Fixture sai cố ý; test khẳng định cổng đỏ.

## WP97.6 — Đóng task

- [x] 14 rule `BR-TAK` có test gọi tên mã.
- [x] Lật `status` sang `implemented`.
- [x] `pnpm check` · `pnpm test` · `pnpm check:progress` xanh.
- [x] Mở PR cho người review diff, không tự merge.
