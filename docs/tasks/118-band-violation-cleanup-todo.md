# Checklist — Task #118: Ba mươi lăm level gắn band mà engine cấm

> Kế hoạch: [`118-band-violation-cleanup-plan.md`](118-band-violation-cleanup-plan.md).
> Chỉ bắt đầu khi [`Task #117`](117-seed-gate-truth-todo.md) đã thêm phép kiểm band vào cổng 5.
> Tuyệt đối: không `UPDATE` bản published, không nới `banned_age_bands`, không chọn đường A/B
> theo cảm tính từng level.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] Liệt kê engine có `banned_age_bands`: `GT-002` [3-4], `GT-004` [3-4], `GT-006` [3-4, 4-5], `GT-024` [3-4], `GT-026` [3-4], `GT-027` [3-4].
- [x] Đo phân bố level vi phạm **theo từng engine**: chính xác **35 / 228** level (GT-002: 12, GT-004: 3, GT-006: 19, GT-024: 1, GT-026: 0, GT-027: 0).
- [x] Xác nhận cổng 5 đã có phép kiểm band (`checkBannedAgeBand` phát hiện `ENGINE_AGE_BAND_BANNED`).
- [x] Chụp danh sách test: 88 test files pass xanh (813 tests).
- [x] Người quyết chốt luật phân loại `Q118-1`.
- [x] Người quyết trả lời `Q118-2`: 19 level soạn mới thay thế của `GT-006` tính vào `WPn.5` của Task engine (#135) và tổng ngân sách Task #122.

## WP118.1 — Đo lại và phân loại

**Cỡ:** S · không sửa dữ liệu

- [x] Bảng: mã level · engine · band hiện tại · band engine cho phép · đường A hay B · lý do:

| Mã Level | Engine | Band hiện tại | Band cho phép | Đường | Tiêu đề & Lý do phân loại |
|---|---|---|---|---|---|
| `GL-C1-SORT-BOX-0006` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Phân loại quả đỏ và quả vàng — Cơ chế kéo thả phân loại vào hộp/ghép cặp phù hợp band 4-5 (đổi band 3-4 -> 4-5 version mới). |
| `GL-C1-SORT-BOX-0007` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Thu hoạch dâu tây — Cơ chế kéo thả phân loại vào hộp phù hợp band 4-5. |
| `GL-C1-SUB-FAST-0019` | `GT-006` | `4-5` | `5-6` | **B** | Nhìn nhanh số lượng sao — GT-006 cấm cả 3-4 và 4-5. Cần archive và soạn level mới đúng lứa 5-6. |
| `GL-C1-SUB-FAST-0020` | `GT-006` | `4-5` | `5-6` | **B** | Nhìn nhanh chùm bóng bay — GT-006 cấm cả 3-4 và 4-5. Cần archive và soạn level mới đúng lứa 5-6. |
| `GL-C1-SEQ-PAT-0109` | `GT-006` | `3-4` | `5-6` | **B** | Xếp thứ tự 3 toa tàu — GT-006 cấm cả 3-4 và 4-5. Cần archive và soạn level mới đúng lứa 5-6. |
| `GL-C1-SEQ-PAT-0110` | `GT-006` | `3-4` | `5-6` | **B** | Xếp thứ tự 4 toa tàu — GT-006 cấm cả 3-4 và 4-5. Cần archive và soạn level mới đúng lứa 5-6. |
| `GL-C1-CNT-PAIR-0111` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Ghép nhóm hoa với thẻ số — Cơ chế ghép cặp thẻ số phù hợp band 4-5. |
| `GL-C1-CNT-PAIR-0112` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Ghép nhóm lá xanh với số — Cơ chế ghép cặp thẻ số phù hợp band 4-5. |
| `GL-C2-SORT-SHP-0006` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Phân loại hình khối — Phân loại hình khối vào hộp phù hợp band 4-5. |
| `GL-C2-SUB-FAST-0013` | `GT-006` | `4-5` | `5-6` | **B** | Nhận biết hình khối nhanh — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C2-SUB-FAST-0019` | `GT-006` | `4-5` | `5-6` | **B** | Nhìn nhanh vị trí ngôi sao — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C2-TRC-PTH-0030` | `GT-024` | `3-4` | `4-5, 5-6` | **A** | Vẽ theo nét hình tam giác — Đồ nét hình học tam giác phù hợp band 4-5. |
| `GL-C3-CLS-BOX-0004` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Phân loại hoa và quả — Phân loại 2 hộp thuộc tính phù hợp band 4-5. |
| `GL-C3-CLS-BOX-0005` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Phân loại phương tiện giao thông — Phân loại phương tiện phù hợp band 4-5. |
| `GL-C3-PAT-SEQ-0006` | `GT-004` | `3-4` | `4-5, 5-6` | **A** | Dãy quy luật mặt cười AB — Quy luật AB phù hợp band 4-5. |
| `GL-C3-SUB-FAST-0013` | `GT-006` | `4-5` | `5-6` | **B** | Nhận biết quy luật nhanh — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C3-SUB-FAST-0018` | `GT-006` | `4-5` | `5-6` | **B** | Phản xạ phân loại siêu nhanh — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C4-DIF-BOX-0004` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Nhặt rác giữ sạch công viên — Phân loại rác vào hộp phù hợp band 4-5. |
| `GL-C4-SEQ-OBS-0006` | `GT-004` | `3-4` | `4-5, 5-6` | **A** | Theo dõi quy luật màu sắc — Quy luật màu phù hợp band 4-5. |
| `GL-C4-SUB-FAST-0010` | `GT-006` | `4-5` | `5-6` | **B** | Quan sát hình ảnh chớp nhoáng — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C4-SUB-FAST-0015` | `GT-006` | `4-5` | `5-6` | **B** | Nhìn tinh mắt tìm đồ chơi — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C4-SUB-FAST-0019` | `GT-006` | `4-5` | `5-6` | **B** | Thử thách tinh mắt 1 giây — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C4-SEN-SEQ-0109` | `GT-006` | `4-5` | `5-6` | **B** | Xếp 3 sắc độ màu từ nhạt đến đậm — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C4-SEN-SEQ-0110` | `GT-006` | `4-5` | `5-6` | **B** | Xếp 4 sắc độ màu hồng nhạt đến đậm — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C5-VOC-BOX-0004` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Ghép thẻ từ vựng trái cây — Ghép từ vựng vào hộp phù hợp band 4-5. |
| `GL-C5-VOC-BOX-0005` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Ghép thẻ từ vựng chuối — Ghép từ vựng vào hộp phù hợp band 4-5. |
| `GL-C5-SUB-FAST-0010` | `GT-006` | `4-5` | `5-6` | **B** | Nghe từ nhận diện nhanh — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C5-SUB-FAST-0016` | `GT-006` | `4-5` | `5-6` | **B** | Nhớ từ vựng siêu tốc — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C5-SUB-FAST-0020` | `GT-006` | `4-5` | `5-6` | **B** | Thử thách nhận diện biểu cảm nhanh — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C6-MEM-BOX-0004` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Cất đồ chơi vào đúng chỗ — Phân loại ghi nhớ vào hộp phù hợp band 4-5. |
| `GL-C6-ATT-BOX-0005` | `GT-002` | `3-4` | `4-5, 5-6` | **A** | Kiềm chế chú ý khi chọn đồ — Phân loại chú ý vào hộp phù hợp band 4-5. |
| `GL-C6-MEM-SEQ-0006` | `GT-004` | `3-4` | `4-5, 5-6` | **A** | Ghi nhớ chuỗi 2 biểu tượng — Nhớ chuỗi biểu tượng phù hợp band 4-5. |
| `GL-C6-SUB-FAST-0009` | `GT-006` | `4-5` | `5-6` | **B** | Nhớ nhanh 1 hình ảnh xuất hiện — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C6-SUB-FAST-0013` | `GT-006` | `4-5` | `5-6` | **B** | Thử thách ghi nhớ chớp nhoáng 2 hình — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |
| `GL-C6-SUB-FAST-0018` | `GT-006` | `4-5` | `5-6` | **B** | Thử thách ghi nhớ cực nhanh 1000ms — Phản xạ nhanh GT-006 lứa 5-6; archive + soạn mới. |

- [x] Áp luật `Q118-1` đều cho mọi level: 16 level đi đường A (GT-002: 12, GT-004: 3, GT-024: 1), 19 level đi đường B (GT-006: 19).
- [x] 19 màn `GT-006` — kiểm riêng, xác nhận toàn bộ 19 level đi đường B do GT-006 cấm cả 2 band 3-4 và 4-5.
- [x] Bảng phân loại đã được đối chiếu và phê duyệt.

## WP118.2 — Luật sửa, viết một lần cho 27 task engine

**Cỡ:** S · không sửa bản ghi nào

- [x] Viết luật đường A: INSERT version mới với band hợp lệ (ví dụ `3-4` -> `4-5`), chỉ đổi band **lên**, bản cũ published giữ nguyên không chạm (`BR-CSA-01`).
- [x] Viết luật đường B: Chuyển `archived` bằng version mới, cấm xoá cứng (`BR-CLC-01`), soạn level thay thế mới đúng lứa (lứa 5-6 cho GT-006), số thay thế ≥ số archive.
- [x] Ghi rõ: level thay thế cộng vào `WPn.5` của task engine đó (#135 cho GT-006) và tổng ngân sách Task #122, không đếm hai lần.
- [x] Xác nhận sáu engine có `banned_age_bands`: `GT-002` [3-4], `GT-004` [3-4], `GT-006` [3-4, 4-5], `GT-024` [3-4], `GT-026` [3-4], `GT-027` [3-4].
- [x] 21 engine còn lại chỉ đo và ghi `out_of_band_count` = 0 ở `WPn.4`.

## WP118.3 — Theo dõi và đóng nợ

**Cỡ:** S · không sửa bản ghi nào

- [x] Bảng 35 level giao cho 4 task engine tương ứng (`#131` cho GT-002, `#133` cho GT-004, `#135` cho GT-006, `#153` cho GT-024).
- [x] Bậc thang tổng `out_of_band_count`: baseline = 35 (trong `GATE_5_BAND_LADDER_BASELINES`), chỉ được giảm, tăng là đỏ.
- [x] Theo dõi qua test suite `packages/db/tests/gates/gate-ladder.test.ts`.

## WP118.4 — Bật chặn

**Cỡ:** S

- [x] Phép kiểm band ở cổng 5 được thực thi qua `checkBannedAgeBand` trong `packages/db/src/seed-content/gates/runner.ts`.
- [x] Ca âm: test tự động trong `gate-ladder.test.ts` & `eight-gates.test.ts` khẳng định level gắn band cấm làm cổng 5 đỏ với mã `ENGINE_AGE_BAND_BANNED` (BR-ECD-11, BR-ECD-13).
- [x] Bật và thực thi quy tắc `BR-ECD-13`.

## Nghiệm thu

- [x] `pnpm --filter @mindkid/db seed:report` báo cáo số lượng level ngoài band engine (35 level).
- [x] Ca âm band làm cổng 5 đỏ (test trong `gate-ladder.test.ts` & `eight-gates.test.ts`).
- [x] Không bản ghi published nào bị `UPDATE` hoặc `DELETE`.
- [x] Mọi level đường B được phân loại và giao ngân sách thay thế vào Task #122 / Task engine #135.
- [x] Bảng phân loại WP118.1 đầy đủ lý do từng level.
- [x] `pnpm --filter @mindkid/db test` xanh (88 test files, 814 tests).
- [x] `pnpm check` (lint + typecheck) xanh.
- [x] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Phân bố vi phạm theo engine: GT-002: 12, GT-004: 3, GT-006: 19, GT-024: 1, GT-026: 0, GT-027: 0 (Tổng: 35 / 228).
- Luật phân loại đã chốt: GT-006 đi đường B (19 màn); GT-002 (12 màn), GT-004 (3 màn), GT-024 (1 màn) đi đường A.
- Số level đi đường A / đường B: Đường A = 16, Đường B = 19.
- Số level phải soạn, đã chuyển sang ngân sách Task #122: 19 level mới cho GT-006 ở band 5-6 (Task #135 / #122).
