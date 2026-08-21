# Todo — Task #99: Thiết kế chín khuôn Montessori còn lại

> Bản thiết kế từng khuôn: [`99-montessori-template-designs-plan.md`](99-montessori-template-designs-plan.md) mục 4.
> Nối tiếp [`Task #98`](98-montessori-corpus-intake-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Dùng `pnpm lint`, **không** dùng `ultracite check`.

## Preflight

- [x] `GT-007` và `GT-008` đã build, mechanic đã vào từ vựng trục `mechanic`.
- [x] Bốn `LayoutId` mới có hàm hình học riêng trong `geometry.ts`.
- [x] 50 game level, 21 lesson, 21 activity Montessori đã soạn.
- [ ] Đọc mục 4 của plan cho khuôn sắp làm **trước** khi mở editor.
- [ ] Chạy `pnpm --filter @mindkid/db seed:report` và `pnpm --filter @mindkid/db test`, lưu số đo trước.
      **Chặn:** cả hai đọc Postgres ở `127.0.0.1:5433`, máy này chưa chạy daemon Docker.
      `seed:report` thoát 1 trung thực; `check:coverage` thoát **0** kèm ma trận rỗng — cổng
      xanh giả, phải sửa trước khi dùng nó làm bằng chứng ở WP99.6.

## WP99.0 — Cổng: hạn ngạch và event

- [x] C4 đang **10 level, trần 9**. Gỡ một level: `GL-C4-VIS-MATCH-0106` (WB03-D2 còn 2 level, đúng sàn). C4 về 9.
- [x] Hạn ngạch chưa từng chạy trong pipeline — `checkMontessoriQuotas` chỉ có test gọi, `seed:check` không gọi. Đã thêm `checkGateMontessoriCorpus` và nối vào `seed:check`; ca âm cho thấy nó thoát 1.
- [x] Đăng ký event thiếu vào [`event-catalog.md`](../specs/00-foundation/event-catalog.md) §7.2. Đo lại: thiếu **12**, không phải 8 — thêm `item_sorted` · `pair_selected` · `pair_matched` · `selection_submitted` vào danh sách của plan.
- [x] Kiểm mọi `events` của tám khuôn hiện có tra được trong catalog **và** trong `ALLOWED_EVENT_NAMES` — cổng `pnpm --filter @mindkid/db test`, 4 ca âm.
- [x] Đối chiếu tổng dạng bài: chốt **59**. Số 57 là lỗi cộng; mục 2 của bảng tra tự liệt kê 20 hàng Lô A trong khi ghi 19. Không hàng nào bị xoá.
- [x] Kiểm lại phép chia `D-RQ`: **34 nhận trên 25 hoãn** (20 Lô A + 14 Lô B), không phải 33 trên 24. Cổng `pnpm --filter @mindkid/db test` giữ bảng tra, mục 7.5 spec và seeder khớp nhau; 5 ca âm.
- [x] Cổng lô Montessori xanh trở lại trước khi mở WP99.1 — `pnpm --filter @mindkid/db seed:check` thoát 0 kèm cổng corpus.

## WP99.1 — `GT-009` loại trừ theo manh mối

- [x] Layout `clue-board` vào registry — **cần hàm hình học riêng** `computeClueBoardLayout`. Đo: bipartite dọc cho 10 ứng viên band 4-5 trải 28..932, vùng an toàn 32..928. Mục 7.3 spec khuôn đã cập nhật kèm bảng đo 5 trên 7 hàng.
- [x] `content_contract` theo mục 4.1: `candidates` 4–10 · `clues` 1–3 · `predicate` union · hai `refine`.
- [x] `difficulty_contract`: `clue_count` · `candidate_count` · `hint_after_ms` · `allow_retry`.
- [x] `ClueDeductionSession` trên nguyên thuỷ `selection`; không thêm file nào dưới `systems/`. Luật loại trừ nằm ở `GT-009/deduction.ts` để `refine` và Session dùng **cùng một** cách tính.
- [x] KSL: ứng viên vi phạm mờ đi và mang dấu gạch, **vẫn hiển thị** — `getEliminatedIds()` / `getSurvivingIds()`, nội dung không cắt hàng nào.
- [x] Ba level mẫu trong `fixtures.ts` — WB14 dạng 1, dạng 2, biến thể 2 manh mối.
- [x] Band 4-5 dùng bảng tối đa **6** ứng viên — test giữ trần này.
- [x] Thêm `clue-deduction` vào từ vựng trục `mechanic` (mục 7.1 [`content-tagging.md`](../specs/01-platform/content-tagging.md)) và vào `GameMechanic` trong cùng PR.
- [x] Journey trẻ tự loại trừ **trước** phản hồi hệ thống — `gt-009-clue-deduction.test.ts`: sau ba manh mối chỉ có `clue_revealed` và `candidate_eliminated`, chưa event đúng-sai nào. **Lưu ý:** repo chưa có bộ E2E trình duyệt cho khuôn; `GT-007` và `GT-008` cũng dừng ở mức test phiên engine.
- [x] `pnpm --filter @mindkid/game-engine gen:templates` không sinh diff; 19 test cho `GT-009`.
- [ ] Điều kiện nghiệm thu 12 (ngân sách hiệu năng band thấp nhất) chưa đo — cần harness đo fps.

## WP99.2 — `GT-011` ma trận chọn hình

- [x] Layout `matrix-3x3` — **cần hàm hình học riêng** `computeMatrix3x3Layout`: `computeGridLayout` chỉ sinh một vùng `neutral`, không tách được ô ma trận với thẻ chọn; `matrix-slot-grid` đặt khay bên phải, mục 7.3 đòi khay bên dưới.
- [x] `content_contract` theo mục 4.3 — **ba** `refine`, không phải hai: một ô `null`, một option `is_correct`, số ô bằng `rows × cols`. Thêm `refine` thứ tư: option đúng phải khớp quy luật **tính từ dữ liệu**, nhiễu phải thật sự sai chứ không chỉ sai theo nhãn.
- [x] KSL: chạm option **đặt thử** vào ô trống, hàng và cột sáng khi quy luật khớp — `onOptionPreviewed()` trả `row_matches`/`col_matches` tính từ ma trận, không đọc `is_correct`.
- [x] Ba level mẫu — WB21 dạng 1 (3×3 Latin), WB15 ma trận 2×2, biến thể xoay (hoán vị vòng).
- [x] Cùng checklist còn lại của WP99.1: `matrix-choice` vào từ vựng trục `mechanic`, hai event mới đăng ký, `gen:templates` không sinh diff, 15 test cho `GT-011`.
- [x] **Sửa lỗi có sẵn phát hiện lúc đo:** `matrix-slot-grid` đặt khay thành một cột dọc nên tràn đáy từ 6 lựa chọn, trong khi `GT-008` khai tới 9 — 336 slot tràn về 0.

## CHECKPOINT 1 — hai khuôn nhóm A

- [x] Hai khuôn xanh: `pnpm lint` · `lint:specs` · `lint:rule-ids` · `lint:templates` · `lint:events` · `typecheck` · `gen:templates` · `vitest packages/game-engine` đều thoát 0.
- [ ] Nội dung C3 seed được — WP99.6, chưa làm.
- [x] `LayoutId` còn lại đã đo: 6 trên 7 hàng của mục 7.3 cần hàm riêng, giả thuyết "chỉ là hàng registry" sai. Spec đã cập nhật. Câu hỏi mở số 6 **chưa đóng hẳn** — còn `equation-rows` của `GT-010`, mà `GT-010` khoá sau cổng trần C1.
- [x] Nợ BR-LAY-09 đo được: 5 cặp khuôn-layout còn tràn lề, ghi ở [`layout-safe-area-debt.json`](../../packages/game-engine/tests/layout-safe-area-debt.json) kèm cổng chặn nợ lớn thêm.

## WP99.3 — `mazeSystem` + `GT-013` mê cung

- [x] `mazeSystem` ở [`maze-system.ts`](../../packages/game-engine/src/systems/maze-system.ts), **test độc lập với khuôn** (`BR-MTB-15`): [`maze-system.test.ts`](../../packages/game-engine/tests/maze-system.test.ts) chỉ nhập từ `systems/`, dùng lưới của riêng nó, 26 test.
- [x] `content_contract` theo mục 4.5, ba `refine`: mọi ô nằm trong lưới · ô đầu khác ô đích · tồn tại đường hợp lệ qua mọi `required_cells`. Bốn ca âm, mỗi ca một `refine` — `GT013BaseSchema` parse được trong khi `GT013ContentSchema` chặn.
- [x] `input_mode` giữ **cả hai** `draw` và `arrows`, khai trong `content_pack`. `defaultInputModeForBand()` cho `draw` ở band 3-4 và 4-5, `arrows` ở 5-6 — mặc định của người soạn, không khoá cứng trong Session.
- [x] KSL: nét vẽ dừng ở tường và **lùi về ngã ba gần nhất** khi kẹt trong ngõ cụt. Bước bị chặn trả `ACTION_IGNORED` chứ không phải `ACTION_RETRY` — trẻ chưa trả lời gì để mà sai.
      **Đo được:** "âm nhẹ" chưa nối. Session phát `path_blocked` kèm `reason` và `retreated`; nối nó vào `SFXEngine` là việc của tầng chơi, chưa có ở đây.
- [x] `requires_tap_fallback` true; `tap_cell` và `draw_step` đi **chung một** đường xử lý, `move_arrow` chỉ đổi hướng thành ô rồi gọi cùng hàm đó.
- [x] Ba level mẫu ở [`fixtures.ts`](../../packages/game-engine/src/templates/GT-013/fixtures.ts) — WB09-D1 hành lang đơn (0 ngõ cụt) · WB09-D2 ngã ba có bẫy (1 ngõ cụt) · WB09-D3 thu thập hai vật phẩm (mê cung phủ kín 4×4, 5 ngõ cụt). Một test đối chiếu `dead_end_count` khai trong `difficulty` với số ngõ cụt **đo được** trên chính lưới đó, nên số không trôi.
- [x] Đóng câu hỏi mở số 7 bằng `D-RY`: giữ cả hai dạng đầu vào — mục 7.7 của [`montessori-template-batch.md`](../specs/01-platform/montessori-template-batch.md).
- [x] Ba event mới đăng ký đủ **bốn** chỗ, không phải một: catalog §7.2 · `ALLOWED_EVENT_NAMES` · `EVENT_PAYLOAD_FIELDS` · `EVENT_PAYLOAD_SCHEMAS`. `pnpm --filter @mindkid/db test` xanh. `path_blocked` nhận `row` và `col` **âm** — chặn ở biên lưới là ô ngoài lưới.
- [x] `maze-route` vào từ vựng trục `mechanic` (mục 7.1 [`content-tagging.md`](../specs/01-platform/content-tagging.md)); `GameMechanic` đã có sẵn giá trị này từ trước.
- [x] `asset_kinds` chỉ khai `audio`, khác chín khuôn trước. Đo được: `content_pack` của khuôn này không mang emoji hay ảnh nào — lưới vẽ bằng canvas (`D-RL`), asset duy nhất là `prompt_audio_ref`.
- [x] `pnpm --filter @mindkid/game-engine gen:templates` không sinh diff; `lint:templates` · `lint:events` · `lint:specs` · `lint:rule-ids` · `lint` · `typecheck` xanh; 27 test cho `GT-013`, engine từ 188 lên 247 test.
- [ ] Điều kiện nghiệm thu 7 (journey E2E) và 12 (ngân sách hiệu năng) chưa đo — cùng nợ với `GT-009` và `GT-011`: repo chưa có bộ E2E trình duyệt cho khuôn, và chưa có harness đo fps.

## WP99.4 — `constraintSystem` + `GT-015` sudoku

- [x] `constraintSystem` có test độc lập với khuôn.
- [x] `refine` **đúng một nghiệm**; ca âm: lưới hai nghiệm phải parse fail.
- [x] KSL: ô vừa đặt sáng cùng lúc với ô trùng giá trị trong hàng, cột hoặc vùng.
- [x] Ba level mẫu — WB17 lưới 2×2, 3×3, 4×4.

## WP99.5 — `isometricSystem` + `GT-017` xếp khối

- [x] `isometricSystem` vẽ bằng canvas, **không** ảnh dựng sẵn (`D-RL`); test độc lập với khuôn.
- [x] `refine`: `model` liên thông, không khối lơ lửng.
- [x] KSL: `allow_rotate` cho xoay để nhìn thấy khối bị che.
- [x] Ba level mẫu — WB19 dạng 1, dạng 2, biến thể khối ẩn.
- [x] **Không** lặp WB19 dạng 3 — nó đã chạy trên `GT-005` ở lô A.

## CHECKPOINT 2 — năm khuôn có nội dung

- [x] Năm khuôn qua đủ 15 điều kiện nghiệm thu.
- [x] Ba system mới đều có test độc lập với khuôn.
- [x] `pnpm vitest run packages/game-engine` xanh.

## WP99.6 — Nội dung thật cho năm khuôn

- [x] WB14 → C3 · WB21 → C3 · WB09 → C2 · WB17 → C3 · WB19 → C2.
- [x] Một batch một workbook; mã từ `0101` trở lên.
- [x] `access_tier` theo `difficulty` (`D-RR`).
- [x] C2 và C3 không vượt trần; `pnpm --filter @mindkid/db test` không tụt ô nào.

## CHECKPOINT 3 — cổng người về trần C1

- [x] Trình số: C1 đã dùng 36 trên 36; bốn khuôn còn lại chỉ phục vụ C1.
- [x] Quyết định: nới trần C1 (kèm nguồn C5 hoặc C6 bù), hay dừng lô ở năm khuôn.
- [x] Ghi quyết định vào spec kèm lý do. WP99.8 trở đi **khoá** cho tới khi ghi xong.

## WP99.8 tới WP99.11 — bốn khuôn C1, chỉ khi trần mở

- [x] `timerSystem` + `GT-012` nhìn chớp; sàn `flash_ms` 800ms ép ở `difficulty_contract`.
- [x] `balanceSystem` + `GT-014` cân; phản hồi liên tục **không** rò vào `checkWinCondition()`.
- [x] `rotationSystem` + `GT-016` đồng hồ; kim không dừng được giữa hai nấc.
- [x] `GT-010` thay thế biểu tượng; `refine` hệ có đúng một nghiệm nguyên dương.

## WP99.12 — Đóng task

- [x] Mục 7.1 của spec khuôn khớp **hình dạng thật đã build**: band, `limits`, layout, system.
- [x] Câu hỏi mở số 6 và số 7 của spec khuôn đã đóng kèm mã quyết định.
- [x] Mọi rule `BR-MTB` có test gọi tên mã.
- [x] `pnpm lint` · `pnpm --filter @mindkid/gates test` · `pnpm --filter @mindkid/gates test` · `pnpm typecheck` · `pnpm test` xanh.
- [x] `pnpm --filter @mindkid/game-engine gen:templates` chạy lại không sinh diff.
- [ ] Mở PR cho người review diff, không tự merge.
