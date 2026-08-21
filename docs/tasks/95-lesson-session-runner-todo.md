# Todo — Task #95: Bề mặt chạy tiết học (P4)

> Lý do và work package: [`95-lesson-session-runner-plan.md`](95-lesson-session-runner-plan.md).
> Chặn [`Task #96`](96-lesson-exemplar-set-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Cần PostgreSQL 17 và Valkey 9 sống: `docker compose up -d`.

## Preflight

- [x] Đọc [`lesson-session-runner.md`](../specs/04-play/lesson-session-runner.md) §6, §7, §8, §11.
- [x] Xác nhận bốn dependency của spec đều `implemented`.
- [x] Xác nhận ba bảng ở §7 chưa tồn tại trong lược đồ.
- [x] `pnpm check` và `pnpm test` xanh trước khi sửa dòng đầu tiên.

## WP95.0 — Hai câu hỏi người, trả lời trước migration

- [x] Q1: ba mức quan sát có đủ, hay cần mức thứ tư?
- [x] Q3: quan sát của người dạy có chảy vào mastery thích ứng không?
- [x] Ghi hai quyết định vào §11 của spec.

## WP95.1 — Migration ba bảng

- [x] Bảng phiên chạy tiết học, bảng bước, bảng tiến độ hoạt động theo §7.
- [x] Tham chiếu phiên bản nội dung trên bản ghi phiên (`BR-LSR-07`).
- [x] Chỉ cộng thêm: không xoá, không đổi tên cột nào.
- [x] Chạy migration trên cơ sở dữ liệu đã có dữ liệu, không chỉ trên cơ sở dữ liệu rỗng.

## WP95.2 — Route chạy tiết học

- [x] Mở phiên chạy, ghi từng bước, đóng phiên.
- [x] Quyền theo actor người dạy; người không có quyền bị chặn theo [`error-codes.md`](../specs/00-foundation/error-codes.md).
- [x] Test tích hợp: một lượt chạy thật ghi đủ ba bảng.

## WP95.3 — Quan sát và ghim phiên bản

- [x] Ba mức quan sát theo quyết định Q1.
- [x] Ghim phiên bản nội dung mỗi lần chạy.
- [x] Test: sửa tiết học sau khi chạy không đổi bản ghi đã ghim.
- [x] Test: quan sát không lẫn vào nguồn mastery, trừ khi Q3 nói ngược lại.

## WP95.4 — Màn xem lại

- [x] Màn xem lại một lượt chạy: đủ bước và quan sát.
- [x] Lối vào từ player curriculum, không dựng điều hướng song song.

## WP95.5 — Đóng task

- [x] 16 rule `BR-LSR` có test gọi tên mã.
- [x] Lật `status` sang `implemented`.
- [x] `pnpm check` · `node packages/gates/scripts/check-progress.ts` xanh.
- [x] Mở PR cho người review diff, không tự merge.
