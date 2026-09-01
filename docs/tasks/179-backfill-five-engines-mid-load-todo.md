# Todo — Task #179: Backfill `GT-012` `GT-018` `GT-023` `GT-019` `GT-022` — 13 game type v1, 130 level

> Kế hoạch: [`179-backfill-five-engines-mid-load-plan.md`](179-backfill-five-engines-mid-load-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 2.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.
> Một work package = một game type v1, đóng dứt điểm rồi mới sang cái sau.

## Preflight

- [ ] Chốt kiểm 1 đã xanh.
- [ ] Đọc `docs/tasks/170-legacy-audit-report.md`, **trừ tín dụng audit** cho từng game type dưới đây.
- [ ] Docker daemon chạy.
- [ ] Ghi số trước: `check:legacy-v1` và `seed:report`.

## Work package

### `GT-012` nhìn chớp rồi nhớ lại

- [ ] `D1-06` Flash Đếm Nhanh — 10 level, nhớ **số lượng**, `C1.CNT.11`
- [ ] `D1-07` Đoán Nhanh Chấm — 10 level, nhớ **vị trí chấm**, `C1.CNT.09`
- [ ] `D1-13` Ghi Nhớ (Flash Memory) — 10 level, nhớ **danh tính vật**, `C6.WM.04`

### `GT-018` nghe rồi làm — không micro

- [ ] `D3-04` Quy luật Âm thanh — 10 level, `C1.PAT.01` · `C4.MEM.04`
- [ ] `D3-08` Chạm Nhạc cụ — 10 level, `C4.MEM.04`
- [ ] `D6-09` Bài toán Có lời văn — 10 level, có `prompt_audio_ref`, `C5.LIS.03` · `C1.PROB.06`
- [ ] Ca test: thiết bị không có giọng Việt → `speakPrompt` rơi về gợi ý hình ảnh, level vẫn chơi được (`BR-ENG-10`)

### `GT-023` lắp ghép hình thể

- [ ] `D2-02` Tangram Ghép hình — 10 level, đích **hình mẫu**, `C2.CON.02`
- [ ] `D2-07` Lắp ghép Robot/Nhà — 10 level, đích **vật thể**, `C2.CON.03`
- [ ] `D6-10` Xếp Khối — 10 level, đích **tháp chồng**, `C2.CON.04`

### `GT-019` xoay và lật mảnh

- [ ] `D2-04` Xoay Mảnh ghép — 10 level, phép **xoay**, `C2.ROT.01`
- [ ] `D2-10` Lật hình — 10 level, phép **lật**, `C2.MIR.02`
- [ ] Ca test: lô `D2-10` phải có ít nhất một mảnh mà **xoay không giải được**, chỉ lật mới giải được

### `GT-022` tìm vật thể ẩn

- [ ] `D2-08` Tìm hình Ẩn — 10 level, nền **hình trong hình**, `C4.VIS.03`
- [ ] `D6-06` Tìm Mẫu vật Ẩn — 10 level, nền **vật trong cảnh nhiều vật**, `C4.VIS.03`
- [ ] Kiểm chéo: hai lô khác nhau ở **loại nền**, cấm — NEVER chỉ khác chủ đề

## Đóng task

- [ ] `check:legacy-v1`: 13 game type của task đều ≥10 level.
- [ ] `seed:check` Cổng 1 xanh.
- [ ] `check:theme-registry` xanh.
- [ ] `check:engine-depth` xanh.
- [ ] **Ca âm:** gỡ 1 level của một game type vừa đủ 10 → `check:legacy-v1` đỏ. Hoàn tác.
- [ ] Review đối chiếu mẫu 3 level mỗi game type: dạng bài khớp thật.
- [ ] `pnpm check` xanh.
- [ ] Cập nhật dòng `#179` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
