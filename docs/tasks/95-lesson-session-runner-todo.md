# Todo — Task #95: Bề mặt chạy tiết học (P4)

> Lý do và work package: [`95-lesson-session-runner-plan.md`](95-lesson-session-runner-plan.md).
> Chặn [`Task #96`](96-lesson-exemplar-set-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Cần PostgreSQL 17 và Valkey 9 sống: `docker compose up -d`.

## Preflight

- [ ] Đọc [`lesson-session-runner.md`](../specs/04-play/lesson-session-runner.md) §6, §7, §8, §11.
- [ ] Xác nhận bốn dependency của spec đều `implemented`.
- [ ] Xác nhận ba bảng ở §7 chưa tồn tại trong lược đồ.
- [ ] `pnpm check` và `pnpm test` xanh trước khi sửa dòng đầu tiên.

## WP95.0 — Hai câu hỏi người, trả lời trước migration

- [ ] Q1: ba mức quan sát có đủ, hay cần mức thứ tư?
- [ ] Q3: quan sát của người dạy có chảy vào mastery thích ứng không?
- [ ] Ghi hai quyết định vào §11 của spec.

## WP95.1 — Migration ba bảng

- [ ] Bảng phiên chạy tiết học, bảng bước, bảng tiến độ hoạt động theo §7.
- [ ] Tham chiếu phiên bản nội dung trên bản ghi phiên (`BR-LSR-07`).
- [ ] Chỉ cộng thêm: không xoá, không đổi tên cột nào.
- [ ] Chạy migration trên cơ sở dữ liệu đã có dữ liệu, không chỉ trên cơ sở dữ liệu rỗng.

## WP95.2 — Route chạy tiết học

- [ ] Mở phiên chạy, ghi từng bước, đóng phiên.
- [ ] Quyền theo actor người dạy; người không có quyền bị chặn theo [`error-codes.md`](../specs/00-foundation/error-codes.md).
- [ ] Test tích hợp: một lượt chạy thật ghi đủ ba bảng.

## WP95.3 — Quan sát và ghim phiên bản

- [ ] Ba mức quan sát theo quyết định Q1.
- [ ] Ghim phiên bản nội dung mỗi lần chạy.
- [ ] Test: sửa tiết học sau khi chạy không đổi bản ghi đã ghim.
- [ ] Test: quan sát không lẫn vào nguồn mastery, trừ khi Q3 nói ngược lại.

## WP95.4 — Màn xem lại

- [ ] Màn xem lại một lượt chạy: đủ bước và quan sát.
- [ ] Lối vào từ player curriculum, không dựng điều hướng song song.

## WP95.5 — Đóng task

- [ ] 16 rule `BR-LSR` có test gọi tên mã.
- [ ] Lật `status` sang `implemented`.
- [ ] `pnpm check` · `pnpm test` · `pnpm check:progress` xanh.
- [ ] Mở PR cho người review diff, không tự merge.
