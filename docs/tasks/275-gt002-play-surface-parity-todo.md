# Task #275 Todo: GT-002 — rà lại UI/UX theo các lỗi đã sửa ở GT-001

Plan: [`275-gt002-play-surface-parity-plan.md`](275-gt002-play-surface-parity-plan.md).

Luật tick: một ô chỉ được tick khi lệnh kiểm ở cuối lát chạy qua `rtk proxy` và exit 0, **và** ca
âm của lát đó đỏ khi bỏ phần sửa. Test chỉ gửi thẳng `commit` vào engine Cấm — NEVER đủ để tick
một ô về bề mặt web.

Kiểm chung mỗi lát:
`rtk proxy npx vitest run` trong `packages/game-engine` (và `apps/web` hoặc `packages/content` nếu
lát chạm tới), `rtk proxy pnpm typecheck --only root`, `rtk proxy pnpm typecheck --only web:app`,
`rtk proxy pnpm lint`.

## S1a — Thắng chỉ khi `commit` (G2) · M · phụ thuộc: không

- [x] `GT-002.md` sửa trước: §6 `BR-E002-02` "khi `commit`"; §9 scenario thêm bước bấm Xong và
      scenario "chọn đủ nhưng chưa bấm Xong → chưa thắng, vẫn bỏ chọn được"
- [x] RED: `tests/templates/gt-002.test.ts` — chọn đủ tập đúng → `checkWinCondition()` là `false`,
      tap lần nữa vẫn bỏ chọn được
- [x] Bỏ override `checkWinCondition()`; thắng qua `winSession()` khi `commit` đúng
- [x] Test `BR-E002-02` trong `mvp-engine-rules.test.ts` theo scenario mới
- [x] Web: GT-002 thật, chọn đủ tập đúng → `skipCurrentRoundIfUnwon` trả `true`
      (`apps/web/tests/unit/play-round-token.test.ts`, chạm qua `dispatch` tại toạ độ entity)
- [x] Ca âm: khôi phục override → hai test trên đỏ (lượt RED chạy trên chính override cũ: 4 test
      engine + 1 test web đỏ; `skipCurrentRoundIfUnwon` trả `false`)
- [x] `rtk proxy pnpm check:engine-specs` và `check:engine-turn` exit 0

## S1b — Nút Xong trên canvas (G1) · M · phụ thuộc: S1a

- [x] Primitive `drawCommitButton` ở `render/`, xuất qua barrel
- [x] Hình chữ nhật nút tính từ `logicSpace`, vẽ mờ khi 0 vật chọn (`N1`)
- [x] `toAction()`: tap trúng nút + ≥1 vật chọn → `submit_selection`; 0 chọn → `null`, không miss
- [x] `getView()` có entity `commit:done` (`neutral`, nhãn "Xong")
- [x] Test engine: tập đúng → thắng; tập sai → `ACTION_RETRY`; 0 chọn → `ACTION_IGNORED`
- [x] Test web (`play-gesture.test.ts`, session GT-002 thật): chạm nút → `onRoundWon` đúng một lần;
      Enter trên `commit:done` cho cùng kết quả
- [x] Ca âm: bỏ nhánh tap-nút trong `toAction()` → 2 test web + 2 test engine đỏ, khôi phục thì xanh
- [x] `render/commit-button.ts` thêm vào `PRIMITIVE_MODULES` của cổng `BR-ERC-05`
      (`tests/gates/render.ts`) — file vẽ dùng chung, cùng hạng với 4 file đã có

## S2 — Commit sai giữ tập chọn (G3, G5) · S · phụ thuộc: S1b

- [ ] Trạng thái hình suy từ mechanic; xoá `itemStates` và nhánh gán `wrong`
- [ ] Commit sai: nút Xong nháy hổ phách theo `lastFrameMs`; tính một miss
- [ ] Nhãn đếm đọc `mechanic.getSelectedIds().length`
- [ ] Dấu tick cho `selected`, không màu `success`/`retry`
- [ ] Ca âm: distractor → commit sai → chạm lại → hình `idle` **và** mechanic không chọn; không
      entity nào `incorrect` sau commit sai

## S3 — View web đồng bộ khi chọn/bỏ chọn (G4) · S · phụ thuộc: S1b

- [ ] `syncView()` chạy trước nhánh thoát `feedback === "none"`
- [ ] `:aria-pressed` cho entity `selected` trong `[code].vue`
- [ ] Test web: chạm → `selected`; chạm lại → `idle`; `onMiss` không được gọi
- [ ] Ca âm: dời `syncView()` về sau nhánh thoát → test đỏ

## S4 — Vị trí vật xáo theo seed (R3) · S · phụ thuộc: không (tuần tự vì cùng file)

- [ ] `setupEntities()` xáo bằng `deriveStream(this.layoutSeed, "items")`
- [ ] Test: cùng seed → cùng thứ tự; 20.000 seed → tỉ lệ vật đúng ở ô 0 lệch ≤1 điểm % so với
      `target_count / item_count`
- [ ] `getHintTargetIndex()` trỏ đúng vật đúng sau khi xáo
- [ ] Ca âm: bỏ xáo → test phân bố đỏ

## S5 — Chạm vật đọc tên, một hình học chạm (R6, E4/E5) · M · phụ thuộc: không (tuần tự vì cùng file)

- [ ] Chụp danh sách `trạng-thái | tên-test` của `gt-001.test.ts` trước khi sửa
- [ ] `resolveAssetLabels` thành helper dùng chung ở `labels/`; GT-001 import lại; danh sách test
      GT-001 trùng khít
- [ ] GT-002 `getView()` mang `glyph`/`label`/`spokenLabel`/`spokenAudioPath`, `role: "neutral"`
- [ ] `toAction()` dùng `findHitSlotIndex(..., "circle", TAP_TOLERANCE_PX)`
- [ ] Test quét lưới điểm: engine và `findHitEntity` chọn cùng một vật ở mọi điểm
- [ ] Ca âm: điểm ở góc hình vuông cũ, ngoài vòng tròn → `null`

## Checkpoint 2 — Trình duyệt thật (sau S1a–S5)

- [ ] Chạy `apps/web`, chơi `GL-C1-ADD-TCNT-0001` (GT-002, `free`, band 4-5) ở 390×844 và 1280×800;
      lưu ảnh chụp
- [ ] Nút Xong không đè lưới, nhãn đếm, câu dẫn; mờ khi 0 chọn
- [ ] Chọn → tick + đọc tên; bỏ chọn được; commit sai → nút nháy hổ phách, tập giữ nguyên
- [ ] Commit đúng → ăn mừng → vòng 2 mở, câu dẫn vòng 2 đọc xong mới nhận chạm (R5)
- [ ] Chơi lại → vị trí vật đổi
- [ ] Tab/Enter đi hết một vòng không cần chuột
- [ ] `rtk proxy pnpm check:test-ratchet` exit 0

## S6 — Nội dung GT-002 (M2–M6) · phụ thuộc: không (song song được với S2–S5)

- [ ] `GT-002.md` sửa trước: `BR-E002-04` ở §6, ca sai thứ ba ở §14; `check:engine-specs`,
      `check:engine-turn` exit 0
- [ ] S6a — RED: quét toàn corpus qua `buildLevelsForSkill` đếm vòng có distractor trùng asset
- [ ] S6a — builder lọc và bỏ trùng distractor theo asset; thiếu → ném `[BR-E002-04]`
- [ ] S6a — đo số level GT-002 còn lại theo band **trước khi commit**; so `check:engine-depth`,
      `check:engine-seed-matrix`; tụt sàn thì dừng và hỏi
- [ ] S6a — ca âm: dataset fixture toàn 📝 → builder ném lỗi
- [ ] S6b — câu dẫn dựng từ tiêu chí; mọi `prompt` GT-002 trong corpus chứa `tất cả`
- [ ] S6b — kẹp `target_count` theo `opts.band`; 0 vòng band 4-5 có `target_count > 3`
- [ ] S6c — `keywordAsset` chuyển sang `builders/utils.ts`; GT-001 và GT-002 dùng chung
- [ ] S6c — test builder GT-001 trùng khít trước/sau

## Checkpoint 3 — Đo lại sau `db:seed`

- [ ] `db:seed` lại DB dev
- [ ] Chạy lệnh SQL §1.3 của plan; ghi số đo vào đây: M2 = 0, M3 = 0, M4 lệch = 0 và dấu nhiều =
      tổng số vòng, M5 = 0, M6 = …
- [ ] Số level GT-002 theo band sau seed: …
