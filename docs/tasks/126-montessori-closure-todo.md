# Checklist — Task #126: Đóng đuôi bốn spec Montessori

> Kế hoạch: [`126-montessori-closure-plan.md`](126-montessori-closure-plan.md).
> Nối tiếp [`Task #98`](98-montessori-corpus-intake-todo.md) và
> [`Task #99`](99-montessori-template-designs-todo.md).
> Tuyệt đối: không seed tiếp khi C4 còn vượt trần, không lật `status` theo checklist mà không
> đo, không chạy journey E2E trên canvas trống rồi coi là đạt.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] `pnpm --filter @mindkid/db seed:report` — ghi hạn ngạch bốn competency.
- [ ] Xác nhận C1 = 36/36, C4 = 10/9.
- [ ] Đếm mã trong bảng tra: 57 hay 59.
- [ ] Đọc sáu việc còn lại của [`99-montessori-template-designs-todo.md`](99-montessori-template-designs-todo.md).
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP126.1 — Đối chiếu mẫu số

**Cỡ:** S · không sửa nội dung

- [ ] Đếm mã trong bảng tra; ghi con số.
- [ ] Nếu 59: phép chia của `D-RQ` sai — tính lại mọi hạn ngạch.
- [ ] Người quyết xác nhận con số (`Q126-3`).
- [ ] Hạn ngạch tính lại **trước** WP126.2.

## WP126.2 — C4 vượt trần

**Cỡ:** S · cổng người

- [ ] `Q126-2` — người quyết chọn đường A (gỡ một level) hay B (nới trần kèm lý do).
- [ ] Đường A: chuyển một level C4 sang `archived` bằng version mới; không xoá.
- [ ] Đường B: ghi quyết định nới trần có mã, kèm lý do.
- [ ] Cổng hạn ngạch C4 xanh.

## WP126.3 — Nội dung C3

**Cỡ:** M · một PR mỗi năm level

- [ ] `Q126-1` — bốn khuôn `GT-010` `GT-012` `GT-014` `GT-016` có phục vụ C3 được không.
- [ ] Nếu có: soạn nội dung C3 tới hết 15 chỗ còn lại.
- [ ] Nếu không: bế tắc trần C1 chuyển thành quyết định nới trần, ghi rõ.
- [ ] Level C3 đi qua đủ tám cổng của Task #117.
- [ ] Ghi số level sang ngân sách [`Task #122`](122-engine-content-depth-todo.md) — không đếm hai lần.

## WP126.4 — Hai điều kiện nghiệm thu chưa đo

**Cỡ:** S

- [ ] Điều kiện 12 — ngân sách hiệu năng band `3-4`; đo trên thiết bị hoặc profile mô phỏng.
- [ ] Điều kiện 7 — journey E2E. Chỉ chạy **sau khi** Task #115 cài `render()`.
- [ ] Ghi kết quả cả hai vào PR.

## WP126.5 — Phê chuẩn bốn spec

**Cỡ:** S

- [ ] **Đo lại** acceptance criteria của `montessori-corpus-mapping.md`; xanh thì lật.
- [ ] Đo lại `montessori-game-level-batch.md`; xanh thì lật.
- [ ] Đo lại `montessori-lesson-batch.md`; xanh thì lật.
- [ ] Đo lại `montessori-template-batch.md`; xanh thì lật.
- [ ] Bốn spec mang `status: implemented`, ghi ngày.
- [ ] Ghi trong PR: đã đo lại, không tin checklist.

## WP126.6 — Đóng đuôi Task #98 và #99

**Cỡ:** S

- [ ] Tick ô cuối của [`98-montessori-corpus-intake-todo.md`](98-montessori-corpus-intake-todo.md) sau khi PR mở.
- [ ] Tick sáu ô còn lại của [`99-montessori-template-designs-todo.md`](99-montessori-template-designs-todo.md).

## Nghiệm thu

- [ ] Mẫu số đã đối chiếu; hạn ngạch tính trên con số đúng.
- [ ] C4 không còn vượt trần; quyết định đã ghi.
- [ ] Cổng hạn ngạch xanh trên cả bốn competency.
- [ ] Điều kiện 7 và 12 đã đo, kết quả trong PR.
- [ ] Bốn spec mang `status: implemented`, và đã đo lại chứ không theo checklist.
- [ ] Level C3 mới đếm vào ngân sách Task #122.
- [ ] `pnpm --filter @mindkid/db test` xanh.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Mẫu số đúng (57 hay 59): ................
- Đường xử lý C4: ................
- Quyết định `Q126-1` cho trần C1: ................
- Số level C3 đã soạn: ................
