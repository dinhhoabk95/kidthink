# Todo — Task #93: Ngẫu nhiên có seed (P1)

> Lý do và work package: [`93-deterministic-randomness-plan.md`](93-deterministic-randomness-plan.md).
> Chặn bởi [`Task #92`](92-game-layout-engine-plan.md); chặn [`Task #97`](97-template-authoring-kit-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Cần PostgreSQL 17 và Valkey 9 sống: `docker compose up -d`.

## Preflight

- [ ] [`Task #92`](92-game-layout-engine-plan.md) đã đóng; bộ dựng layout cho `Slot[]` ổn định.
- [ ] Đọc [`deterministic-randomness.md`](../specs/01-platform/deterministic-randomness.md) §6, §7, §11.
- [ ] Đo lại: ba cờ xáo trộn đang nằm ở đâu, và còn lời gọi ngẫu nhiên nào của môi trường trong `packages/game-engine`.
- [ ] Xác nhận bảng phiên chơi chưa có cột seed.

## WP93.0 — Chốt thuật toán

- [ ] Chọn thuật toán 32 bit, không phụ thuộc thư viện ngoài.
- [ ] Ghi quyết định vào §11 Q1, gạch ngang hàng đã đóng.
- [ ] Ghi rõ: không dùng cho mã hoá, không gộp với nguồn ngẫu nhiên của adaptive.

## WP93.1 — Thư viện ngẫu nhiên

- [ ] `packages/game-engine/src/rng/`: `Rng{next, nextInt}`, `createRng(seed)`, `deriveStream(seed, name)`, `shuffle(input, rng)`.
- [ ] Năm tên luồng đúng như spec §7.
- [ ] Test: cùng seed cho cùng dãy; hai tên luồng cho hai dãy; `shuffle` giữ nguyên tập phần tử.

## WP93.2 — Cột seed và server ghi seed

- [ ] Migration **cộng thêm**: cột seed cho phép rỗng trên bảng phiên chơi.
- [ ] Server sinh seed khi mở phiên và ghi vào bản ghi phiên.
- [ ] Test tích hợp: phiên mới luôn có seed; migration chạy được trên cơ sở dữ liệu đã có dữ liệu.

## WP93.3 — Payload giao cấu hình mang seed

- [ ] Sửa payload; ghi thay đổi vào §11 của [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md).
- [ ] Cổng người: đổi hợp đồng đang chạy phải có người xem xét trước khi merge.
- [ ] Test cũ của route giao cấu hình vẫn xanh.

## WP93.4 — Ba cờ xáo trộn có tác dụng

- [ ] Thứ tự item đọc luồng riêng.
- [ ] Thứ tự đáp án đọc luồng riêng.
- [ ] Test: cùng seed cho cùng thứ tự; đổi seed đổi thứ tự; cờ tắt giữ thứ tự gốc.

## WP93.5 — Dọn nguồn ngẫu nhiên cũ

- [ ] Bỏ lời gọi ngẫu nhiên của môi trường trong hệ phản hồi.
- [ ] Cổng chặn nguồn ngẫu nhiên của môi trường trong `packages/game-engine`.
- [ ] Fixture sai cố ý; test khẳng định cổng đỏ.

## WP93.6 — Đóng task

- [ ] Test phát lại một phiên đầy đủ từ seed, hai lần trùng khớp.
- [ ] 10 rule của spec có test gọi tên mã.
- [ ] Lật `status` sang `implemented`.
- [ ] `pnpm check` · `pnpm test` · `pnpm check:progress` xanh.
- [ ] Mở PR cho người review diff, không tự merge.
