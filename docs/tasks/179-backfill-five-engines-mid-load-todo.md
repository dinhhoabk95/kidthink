# Todo — Task #179: Backfill `GT-012` `GT-018` `GT-023` `GT-019` `GT-022` — 13 game type v1, 130 level

> Kế hoạch: [`179-backfill-five-engines-mid-load-plan.md`](179-backfill-five-engines-mid-load-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 2.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.
> Một work package = một game type v1, đóng dứt điểm rồi mới sang cái sau.

## Preflight

- [x] Chốt kiểm 1 đã xanh.
- [x] Đọc `docs/tasks/170-legacy-audit-report.md`, **trừ tín dụng audit** cho từng game type dưới đây.
- [x] Docker daemon chạy.
- [x] Ghi số trước: `check:legacy-v1` và `seed:report`.

## Work package

### `GT-012` nhìn chớp rồi nhớ lại

- [x] `D1-06` Flash Đếm Nhanh — 10 level, nhớ **số lượng**, `C1.CNT.04`/`05`
- [x] `D1-07` Đoán Nhanh Chấm — 10 level, nhớ **vị trí chấm**, `C1.CNT.09`/`10`
- [x] `D1-13` Ghi Nhớ (Flash Memory) — 10 level, nhớ **danh tính vật**, `C6.WM.02`/`C6.INH.02`

### `GT-018` nghe rồi làm — không micro

- [x] `D3-04` Quy luật Âm thanh — 10 level, `C1.PAT.01` · `C1.PAT.02`
- [x] `D3-08` Chạm Nhạc cụ — 10 level, `C4.MEM.01` · `C4.MEM.03`
- [x] `D6-09` Bài toán Có lời văn — 10 level, có `prompt_audio_ref`, `C5.LIS.02` · `C5.VOC.01`
- [x] Ca test: thiết bị không có giọng Việt → `speakPrompt` rơi về gợi ý hình ảnh, level vẫn chơi được (`BR-ENG-10`)

### `GT-023` lắp ghép hình thể

- [x] `D2-02` Tangram Ghép hình — 10 level, đích **hình mẫu**, `C2.CON.02`/`01`
- [x] `D2-07` Lắp ghép Robot/Nhà — 10 level, đích **vật thể**, `C2.CON.03`/`05`
- [x] `D6-10` Xếp Khối — 10 level, đích **tháp chồng**, `C2.CON.04`/`C2.GEO.02`

### `GT-019` xoay và lật mảnh

- [x] `D2-04` Xoay Mảnh ghép — 10 level, phép **xoay**, `C2.ORI.01`/`C2.ROT.04`
- [x] `D2-10` Lật hình — 10 level, phép **lật**, `C2.MIR.01`/`02`
- [x] Ca test: lô `D2-10` phải có ít nhất một mảnh mà **xoay không giải được**, chỉ lật mới giải được

### `GT-022` tìm vật thể ẩn

- [x] `D2-08` Tìm hình Ẩn — 10 level, nền **hình trong hình**, `C4.VIS.01`/`02`
- [x] `D6-06` Tìm Mẫu vật Ẩn — 10 level, nền **vật trong cảnh nhiều vật**, `C4.VIS.04`/`C4.DET.01`
- [x] Kiểm chéo: hai lô khác nhau ở **loại nền**, cấm — NEVER chỉ khác chủ đề

## Đóng task

- [x] `check:legacy-v1`: 13 game type của task đều ≥10 level.
- [x] `seed:check` Cổng 1 xanh.
- [x] `check:theme-registry` xanh.
- [x] `check:engine-depth` xanh.
- [x] **Ca âm:** gỡ 1 level của một game type vừa đủ 10 → `check:legacy-v1` đỏ. Hoàn tác.
- [x] Review đối chiếu mẫu 3 level mỗi game type: dạng bài khớp thật.
- [x] `pnpm check` xanh.
- [x] Cập nhật dòng `#179` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
