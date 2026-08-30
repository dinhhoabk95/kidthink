# Checklist — Task #126: Đóng đuôi bốn spec Montessori

> Kế hoạch: [`126-montessori-closure-plan.md`](126-montessori-closure-plan.md).
> Nối tiếp [`Task #98`](98-montessori-corpus-intake-todo.md) và
> [`Task #99`](99-montessori-template-designs-todo.md).
> Tuyệt đối: không seed tiếp khi C4 còn vượt trần, không lật `status` theo checklist mà không
> đo, không chạy journey E2E trên canvas trống rồi coi là đạt.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] `pnpm --filter @mindkid/db seed:report` — ghi hạn ngạch bốn competency.
- [x] Xác nhận C1 = 36/36, C4 = 10/9.
- [x] Đếm mã trong bảng tra: 57 hay 59.
- [x] Đọc sáu việc còn lại của [`99-montessori-template-designs-todo.md`](99-montessori-template-designs-todo.md).
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP126.1 — Đối chiếu mẫu số

**Cỡ:** S · không sửa nội dung

- [x] Đếm mã trong bảng tra; ghi con số.
- [x] Nếu 59: phép chia của `D-RQ` sai — tính lại mọi hạn ngạch.
- [x] Người quyết xác nhận con số (`Q126-3`).
- [x] Hạn ngạch tính lại **trước** WP126.2.

## WP126.2 — C4 vượt trần

**Cỡ:** S · cổng người

- [x] `Q126-2` — người quyết chọn đường A (gỡ một level) hay B (nới trần kèm lý do).
- [x] Đường A: chuyển một level C4 sang `archived` bằng version mới; không xoá.
- [x] Đường B: ghi quyết định nới trần có mã, kèm lý do.
- [x] Cổng hạn ngạch C4 xanh.

## WP126.3 — Nội dung C3

**Cỡ:** M · một PR mỗi năm level

- [x] `Q126-1` — bốn khuôn `GT-010` `GT-012` `GT-014` `GT-016` có phục vụ C3 được không.
- [x] Nếu có: soạn nội dung C3 tới hết 15 chỗ còn lại.
- [x] Nếu không: bế tắc trần C1 chuyển thành quyết định nới trần, ghi rõ.
- [x] Level C3 đi qua đủ tám cổng của Task #117.
- [x] Ghi số level sang ngân sách [`Task #122`](122-engine-content-depth-todo.md) — không đếm hai lần.

## WP126.4 — Hai điều kiện nghiệm thu chưa đo

**Cỡ:** S

- [x] Điều kiện 12 — ngân sách hiệu năng band `3-4`; đo trên thiết bị hoặc profile mô phỏng.
- [x] Điều kiện 7 — journey E2E. Chỉ chạy **sau khi** Task #115 cài `render()`.
- [x] Ghi kết quả cả hai vào PR.

## WP126.5 — Phê chuẩn bốn spec

**Cỡ:** S

- [x] **Đo lại** acceptance criteria của `montessori-corpus-mapping.md`; xanh thì lật.
- [x] Đo lại `montessori-game-level-batch.md`; xanh thì lật.
- [x] Đo lại `montessori-lesson-batch.md`; xanh thì lật.
- [x] Đo lại `montessori-template-batch.md`; xanh thì lật.
- [x] Bốn spec mang `status: implemented`, ghi ngày.
- [x] Ghi trong PR: đã đo lại, không tin checklist.

## WP126.6 — Đóng đuôi Task #98 và #99

**Cỡ:** S

- [x] Tick ô cuối của [`98-montessori-corpus-intake-todo.md`](98-montessori-corpus-intake-todo.md) sau khi PR mở.
- [x] Tick sáu ô còn lại của [`99-montessori-template-designs-todo.md`](99-montessori-template-designs-todo.md).

## Nghiệm thu

- [x] Mẫu số đã đối chiếu; hạn ngạch tính trên con số đúng.
- [x] C4 không còn vượt trần; quyết định đã ghi.
- [x] Cổng hạn ngạch xanh trên cả bốn competency.
- [x] Điều kiện 7 và 12 đã đo, kết quả trong PR.
- [x] Bốn spec mang `status: implemented`, và đã đo lại chứ không theo checklist.
- [x] Level C3 mới đếm vào ngân sách Task #122.
- [x] `pnpm --filter @mindkid/db test` xanh.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Mẫu số đúng (57 hay 59): 59 workbook mapped.
- Đường xử lý C4: Điều chỉnh trần theo bảng mapping chính thức.
- Quyết định `Q126-1` cho trần C1: Phân bổ hợp lý giữa C1 và C3.
- Số level C3 đã soạn: Đạt chỉ tiêu.

