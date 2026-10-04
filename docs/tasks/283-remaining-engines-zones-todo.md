# Task #283 Todo: Dời các engine còn lại vào khung năm vùng

Plan: [`283-remaining-engines-zones-plan.md`](283-remaining-engines-zones-plan.md).
Cha: [`277-play-stage-zones-todo.md`](277-play-stage-zones-todo.md).
Spec: [`play-stage-zones.md`](../specs/01-platform/play-stage-zones.md).

Luật tick: một ô chỉ được tick khi lệnh kiểm ở cuối lát chạy qua `rtk proxy` và exit 0, **và** ca
âm của lát đó đỏ khi bỏ phần sửa. Test chỉ gửi thẳng gesture vào engine Cấm — NEVER đủ để tick một
ô về bề mặt web.

Kiểm chung mỗi lát: `rtk proxy npx vitest run` trong `packages/game-engine` (và `apps/web` nếu lát
chạm tới), `rtk proxy pnpm typecheck --only root`, `--only web:app`, `rtk proxy pnpm lint`,
`rtk proxy pnpm check:logic-space`, `check:hardcoded-params`, `check:engine-specs`, `check:engine-turn`.
Diff danh sách file test đỏ với baseline — không file nào đổi trạng thái ngoài file của lát.

## N0 — Hotfix lời dẫn bị vẽ đôi · S · phụ thuộc: không · ƯU TIÊN

- [x] RED: engine chưa dời (GT-009) không có hai lời dẫn trong cùng khung vẽ; engine đã dời (GT-001) có đúng một
- [x] Cờ trên session; trang vẽ `drawPromptZone` chỉ khi cờ đặt; GT-001/003/028/034/035/036 khai cờ
- [x] Ca âm: bỏ cờ của GT-001 → test đỏ
- [x] Đo lại ở trình duyệt thật: [`n0-double-prompt/`](../qa/engine-captures/2026-10-03/n0-double-prompt/README.md) — engine chưa dời chỉ có một lời dẫn, loa HUD vẫn phát lại; GT-001/028/003 một vùng lời dẫn, không trùng

## N — Lát nền · M · phụ thuộc: N0

- [x] RED: `LayoutInput.stage` và `cssPerLogic`; layout nhận stage cho slot trong stage (`BR-PSZ-01`)
- [x] `geometry.ts` bỏ `CONTENT_TOP_PX` khi có `stage`; không có `stage` thì kết quả giữ nguyên (`BR-LAY-10`)
- [x] 15 chỗ `getTouchFloor(` đổi `getTouchFloorLogicPx` (`BR-PSZ-04`); `RoundRunner` truyền `vp.scale`
- [x] Ca âm `BR-PSZ-04`: mọi `LayoutId` ở slotCount lớn nhất, hit × `cssPerLogic` ≥ sàn ở 330×697; `cssPerLogic` = 1 → đỏ
- [x] Nâng `GT-003/tray-layout.ts` lên `layout/tray-layout.ts`; GT-003 vẫn xanh
- [x] Gom `stage-engines-s7.test.ts` thành `stage-engines.test.ts` tham số theo mã; gate `zone-primitives-only` + ca âm
- [x] `layout.test.ts` và `layout-safe-area-debt.json` không đổi

Ghi chú đo của N (2026-10-03):

- **Cách làm `stage`**: không sửa 32 chỗ `CONTENT_TOP_PX` từng hàm. `placeInStage`
  (`layout/stage-placement.ts`) bọc mọi `LayoutId` trong `LAYOUT_REGISTRY`: chạy hàm gốc trên khung ảo
  `(stage.w + 2·SAFE_MARGIN, stage.h + CONTENT_TOP + SAFE_MARGIN)` rồi tịnh tiến về góc `stage`. Không
  `stage` thì đi thẳng vào hàm gốc. Golden `tests/layout/fixtures/layout-golden.json` (sha1 12 ký tự của
  slot, 24 LayoutId × 3 band × 4 không gian logic × 11 slotCount × 2 targetCount = 6.336 tổ hợp, chụp
  từ mã trước N) giữ nguyên.
- **Sàn px thật**: 15 chỗ `getTouchFloor(ageBand)` trong `geometry.ts` đổi `resolveTouchFloor(ageBand,
  input.cssPerLogic)` (`constants.ts`); không `cssPerLogic` thì là `getTouchFloor` như cũ. `stage-groups.ts`
  (GT-034..036), GT-001 và GT-003 cũng đi qua nó. `cssPerLogic` đi qua `RoundRunner.setLogicSpace(…, cssPerLogic)`
  / `prepareRound` / `resolveSlots` tới `session.cssPerLogic`; web truyền `vp.scale` ở `syncRunnerStageZones` và
  `handleResize`. Engine chưa dời (B1..B7) chưa đọc `session.cssPerLogic` — gọi layout như cũ.
- **Đo sàn ở portrait 330×697 (`cssPerLogic` 0,611), `slotCount` 12, `targetCount` 6, ba band**: mọi 24
  `LayoutId` đạt hit × cssPerLogic ≥ sàn (96,6 / 76,4 / 64,4 px thật ở các band). Ca âm
  (`fixtures/layout-ignores-css-floor.ts`, ép `cssPerLogic` = 1): 17/24 `LayoutId` đỏ; 7 layout còn lại có ô
  vẽ lớn hơn sàn nên tình cờ qua. `mirror-axis-split` ở điện thoại ngang 784×250, band 3-4 có ô tham chiếu
  `neutral` 85,2 px — vùng này không bấm được nên không tính vào sàn.
- **Nợ còn lại (không giấu)**: sàn lớn hơn làm layout không co cột nên **tràn `zones.stage`**. Ở portrait
  330×697, `slotCount` 12: 18 LayoutId × band 3-4, 16 × band 4-5, 14 × band 5-6 còn slot ra ngoài stage
  (nhiều nhất `measure-strip` 16/20, `top-source-bottom-target`, `multi-bucket-bottom`, `number-bond-tree`,
  `ten-frame-split`, `horizontal-slot-track` 14/18 ở band 3-4). Sáu layout lưới (`grid`, `horizontal-row`,
  `grid-2x4`, `flex-wrap`, `card-flip-grid`, `single-focus`) không tràn. Sổ nợ có số từng cặp
  `layout/band`: `packages/game-engine/tests/layout-stage-overflow-debt.json`, test
  `layout-css-floor.test.ts` đỏ khi tăng. Gỡ nợ này là việc co cột / phân trang theo từng nhóm layout,
  làm kèm batch engine dùng layout đó (B1..B7); phần lớn tràn đã có từ trước (cột "trước" của đo: 4–14
  slot tràn ở `slotCount` 12 ngay cả khi chưa tính `cssPerLogic`, vì các hàm bipartite/track chưa từng co
  theo `stage`).
- **Nợ khác lộ ra**: GT-003, khay 508 px, 6 vật trở lên: sàn 64 + khe 16 = 480 > 476, cặp vùng chạm
  cách 15 < `SLOT_GAP_PX` (`BR-LAY-05`); 20 ca seed. Ghi ở `KNOWN_HIT_GAP_DEBT_CASES` trong
  `stage-engines.test.ts` (số chỉ giảm). Chưa sửa vì cần khay đổi hàng hoặc phân trang.
- **Gate `zone-primitives-only`** (`tests/gates/zone-primitives-only.test.ts`): trong session sáu engine đã
  dời, mọi `drawPromptText(` phải nằm ngay trong khối `if (!this.stageRect) {` (hoặc `if (!zones) {` ở
  GT-003). Ca âm: `tests/gates/fixtures/unguarded-prompt-text/GT-001/session.ts`. Danh sách mã dời nằm ở
  `tests/layout/migrated-codes.ts`, dùng chung với `prompt-single-source.test.ts`.

## B1 — Chạm chọn một · M · phụ thuộc: N

- [x] RED: GT-009, 010, 011, 012, 022, 025, 029, 032 ở ba viewport — hit không chồng, vẽ nằm trong stage (`stage-engines-b1.test.ts`)
- [x] Gỡ `drawPromptText`, bỏ toạ độ cứng, slot từ layout trong `zones.stage`
- [x] `ALL_SEED_LEVELS` của tám engine chạy lại, hai vòng liên tiếp
- [x] Ca âm: fixture còn `drawPromptText` → đỏ
- [x] `check:hardcoded-params` không tăng
- Nợ đo sau quyết định 2026-10-03 (`KNOWN_STAGE_DEBT_CASES`, chỉ giảm): GT-009 phone 83 → **0** (lời dẫn cột bên trái cho sân khấu trọn chiều cao); GT-025 phone 3; GT-029 portrait 7 → **0**, phone 7 (10 vật band 4-5, lưới của GT-029 còn tách vùng vật và vùng phương án).

## B2 — Nộp bài, tiến độ, ức chế · M · phụ thuộc: B1, #275 đóng

- [x] RED: GT-002 `needsCommit=true`, chạm `zones.action` nộp được, quét `tap` không thắng (mẫu `play-commit-reachability.test.ts`) — `apps/web/tests/unit/play-gesture.test.ts` (chạm `zones.action`, `pressActionButton`, ca âm `needsCommit=false`) và `stage-engines-b2.test.ts`
- [x] GT-002 bỏ nút Xong tự vẽ và `drawProgressBadge`; `getView()` không còn entity `commit:done`; `canCommit()` = đã chọn ≥1 vật
- [x] GT-018: `needsCommit` theo `response_mode === "sequence"`, test hai nhánh (`stage-engines-b2.test.ts`; gợi ý trỏ nút ở nhánh chuỗi)
- [x] GT-026, GT-027 bỏ `drawProgressBadge` (`BR-PSZ-06`); khoảng nghỉ GT-026 vẫn trống
- [x] Ca âm: khôi phục `drawProgressBadge` → đỏ (`fixtures/gt-026-progress-badge.ts`)
- Phần #275 không đụng: S2 (commit sai giữ tập chọn, `itemStates`), S3, S4, S5 vẫn mở. Mục S2 "nhãn đếm" mất đối tượng vì `drawProgressBadge` đã gỡ (`BR-PSZ-06`) — đếm chọn nếu còn cần phải ở shell.
- Nợ đo sau quyết định 2026-10-03: GT-002 portrait 2 → **0**, GT-027 phone 4 → **0** (lưới `inStage` không phân trang, `BR-PSZ-13`).
- Test sweep lấy mẫu `SEEDS_PER_SHAPE=2` level mỗi hình nội dung: GT-002 có hàng trăm level, quét đủ mất ~160 s một viewport.

## B3 — Kéo thả có khay · L · phụ thuộc: N

- [x] RED: GT-004, 007, 008, 015, 021, 023 — nguồn trong `zones.tray`, đích trong stage. RED **73/373** ca đỏ (`stage-engines-b3` 45/71, `stage-engines` 16/213, `prompt-single-source` 6/75, gate `zone-primitives-only` 6/14); sau dời: 2.179/2.179 xanh
- [x] Tap-tap fallback `BR-ENG-06` xanh cho cả sáu (kéo, chạm-chạm và đổi viewport giữa vòng, mọi mẫu + seed ở ba khung 330x697, 784x250, 964x628)
- [x] Nợ safe-area của GT-004 (28, 588) và GT-008 (32) không tăng — `tests/layout-safe-area-debt.json` giữ nguyên: hàm layout cũ không đổi, đường khung mới dùng `layout/stage-targets.ts`
- [x] Ca âm: khay ở toạ độ cũ → đỏ (`tests/layout/fixtures/gt-004-legacy-tray-coords.ts`)
- [x] **Nợ B3 theo câu hỏi mở số 4 — đã quyết 2026-10-03: khay nhiều hàng, không phân trang, khay cột + lời dẫn cột ở điện thoại ngang** (`play-stage-zones.md` `BR-PSZ-13`; `layout/tray-grid.ts`, `computeStageZones({ trayItems })`, `TemplateGameSession.trayItemCount`). Số ca còn lại sau khi dựng và sau khi HUD thành cột lề ở điện thoại ngang (2026-10-04): **899 ca** ở 11 khung/band (từ hàng nghìn; `KNOWN_LAYOUT_DEBT_CASES`, chỉ giảm): GT-004 phone band 4-5 320, GT-007 portrait 88, GT-008 portrait 227 · phone 3-4 227, GT-021 portrait 13+1 · phone 13+1 (và vài ca lẻ). Còn lại là giới hạn vật lý: sàn chạm của band ở canvas thấp làm số ô cần xếp lớn hơn diện tích sân khấu; không giảm được nếu không thu vật dưới sàn (`BR-PSZ-04` cấm) hoặc giảm số vật trong nội dung (đổi dataset/spec nội dung — ngoài #283). `KNOWN_HIT_GAP_DEBT_CASES` của `stage-engines.test.ts` và GT-014 ở B5: **về 0**.

## B4 — Ghép, lật, dãy, đường · M · phụ thuộc: N

- [x] RED: GT-005, 006, 013, 020, 024 — 27/300 ca đỏ trên ba tệp (`stage-engines.test.ts`, `prompt-single-source.test.ts`, `stage-engines-b4.test.ts`) khi thêm năm mã vào `MIGRATED_CODES`; xanh sau khi dời (engine 117 tệp/2128 test, web component + play-* 19 tệp/103 test)
- [x] GT-006 `needsCommit=true` (nút ✓ luôn sáng, `checkWinCondition` chỉ thắng sau nộp theo phiếu N6; `mvp-engine-rules.test.ts` BR-E006-01 đổi: xếp đúng rồi phải `onSubmitSequence`); nợ GT-005 (736) không tăng — không đụng `geometry.ts`, `layout-safe-area.test.ts` xanh, vẫn 736. GT-005 dùng `GT-005/pair-columns.ts` trong stage (tách cột con khi sân khấu thấp)
- [x] GT-013, GT-024: web chỉ sinh `tap`/`drop`, không sinh `stroke`/`draw`; `toAction` bỏ chạm ngoài stage, GT-024 bỏ nét bắt đầu ngoài stage và điểm ngoài stage; waypoint GT-024 co đều vào stage
- [x] Ca âm cho GT-006: `apps/web/tests/unit/play-commit-reachability-gt006.test.ts` (quét tap không thắng khi `needsCommit=false`; chạm `zones.action` thắng)
- Nợ đo mới: GT-024 cặp vùng chạm < `SLOT_GAP_PX` ở hình nhiều đỉnh — portrait 1 level, điện thoại ngang 9, desktop 1 (`KNOWN_HIT_GAP_DEBT` trong `stage-engines-b4.test.ts`, chỉ được giảm). `check:hardcoded-params`: 305 → 304 (trần 398)

## B5 — Thao tác trực tiếp · M · phụ thuộc: B2

- [x] Sửa spec GT-016 trước: chỉ `commit` nộp, `tap` không nộp (`GT-016.md` N3: `needsCommit` chỉ ở `mode = set`)
- [x] RED: GT-014, 016, 017, 019; GT-016 `needsCommit=true` (ở `mode = set`), GT-019 `needsTray=true` (GT-014 cũng `needsTray=true`) — `stage-engines-b5.test.ts` 12 ca, 4 mã đỏ khi thêm vào `MIGRATED_CODES`, xanh sau khi dời; engine 120 tệp
- [x] Ca âm: khôi phục `tap → submit_time` → đỏ (`apps/web/tests/unit/play-commit-reachability-gt016.test.ts`: quét tap không thắng khi `needsCommit=false`; chạm `zones.action` thắng; `gt-016-clock-hands.test.ts` thêm ca tap không nộp). Đổi hành vi: `checkWinCondition()` ở `mode = set` chỉ đúng sau khi nộp
- Dùng chung: `layout/hero-split.ts` (vùng chính + ô lựa chọn, GT-016/017), `GT-014/zone-layout.ts` (hộp cân + vùng chạm hai đĩa từ `balanceScaleGeometry`), `drawIsometricModel(..., fit)` co khối vào trọn hộp
- Nợ đo: GT-014 portrait 8 → **0** (khay nhiều hàng). Nợ safe-area của GT-014 (8) và GT-017 (2) không đụng `geometry.ts` nên không đổi

## B6 — Xây, đo, đong lường · M · phụ thuộc: B3, B5

- [x] Quyết `needsCommit=false` cho GT-030 (chạm đáp án là chốt), GT-031 (thắng khi tổng đủ, `exact_change` chưa có đường commit — nợ riêng), GT-033 (ô cuối đúng thì thắng); ghi ở mục 4 N3 của ba phiếu
- [x] RED: ba engine — nguồn ở `zones.tray`, đích ở `zones.stage`, không nút ở `zones.action`, không nút xoá (`stage-engines-b6.test.ts`, 31 test; ca âm bố cục cũ `fixtures/b6-legacy-layout.ts` đỏ)
- [x] `ALL_SEED_LEVELS` ba engine chạy lại: kéo, chạm-chạm và đổi viewport giữa vòng chơi hết vòng ở ba khung
- Nợ đo (2026-10-04, `KNOWN_LAYOUT_DEBT_CASES` ở `stage-engines-b6.test.ts`, chỉ được giảm): **62 ca** — GT-030 portrait 6 · phone 6 · máy tính 43 (dải đặt cộng hàng đáp án cao hơn sân khấu); GT-033 phone 2 · máy tính 5. GT-031 **về 0**.
- Thêm: GT-030/031/033 nhận gesture `drop` (kéo từ khay) và chọn theo tâm gần nhất khi vùng chạm chồng; GT-033 `getHintTargetIndex` trỏ ô trống đầu khi level không có `solution`.

## B7 — GT-000 · M · phụ thuộc: B2

- [x] Quyết 2026-10-03: **intro GT-000 ngoài khung năm vùng** (màn làm quen không chấm điểm, không khay, không nộp bài) — `play-stage-zones.md` mục 5 hàng "Intro GT-000" và câu hỏi mở số 5; `GT-000.md` §5 nhánh 10
- [x] Không dời engine nên không cần sửa `concept-intro-gate.md`; gate `zone-primitives-only` miễn GT-000 có lý do (ca âm `findUncoveredCodes`)

## Việc chung

- [x] Nút hành động a11y ở shell (`actionButton`, `pressActionButton` trong `use-play-gesture.ts`, nút DOM trong `[code].vue`): Tab + Enter/Space đi cùng đường chạm `zones.action`; áp mọi engine `needsCommit` (GT-002, 006, 018 chuỗi, 028, 034, 035, 036)
- [x] `getHintTarget()` có nhánh `{ kind: "action" }` (GT-002 khi chọn đủ, GT-018 chuỗi); `GameEngine.actionHinted` + `drawCommitButton({ hint })` nháy nút (`tests/engine-action-hint.test.ts`)
- [x] Cổng hint-target: chỉ `scripts/check-hint-target.ts` (`check:hint-target`) đo `getHintTargetIndex`; nhánh `action` do `engine-action-hint.test.ts` giữ. Không có cổng nào khác

## Checkpoint — Trình duyệt thật

- [x] Mỗi lô: một level mỗi engine ở ba viewport, xoay máy giữa vòng, reduced-motion — **37/37 engine** chụp (20 khách + 17 đăng nhập + preview-sandbox) và **chơi hết 3 vòng bằng cảm ứng CDP: 15/15 ở 390x844, 16/17 ở 844x390** (GT-026/027 thời gian thực không tự chơi; GT-035 band 3-4 phone ngang mất hàng lệnh — nợ vật lý). reduced-motion: `reduced-motion.test.ts` 36 engine + primitive. [`zones-283/README.md`](../qa/engine-captures/2026-10-03/zones-283/README.md)
- [ ] Ảnh vào `docs/qa/engine-captures/<ngày>/`; `check:engine-specs` và `check:engine-turn` exit 0

## Đóng task

- [x] Gate `zone-primitives-only` phủ đủ 37 mã: 36 mã dời + GT-000 là **ngoại lệ duy nhất, có lý do** (danh sách ngoại lệ không rỗng nhưng một mã, ghi ở `EXEMPT_CODES`; test `phủ đủ mọi mã engine` + ca âm)
- [x] `/play/preview-sandbox` vào khung (`computeZonesForSession`, `prepareRound`, `drawPromptZone`, `drawCommitButton`; `play-preview-sandbox-zones.test.ts` + ca âm). Xoá mọi `drawPromptText` ở 36 engine đã dời (gate `zone-primitives-only` cấm cả nhánh dự phòng). Đường lui **hình học** khi không có `stage` (`BR-LAY-10`, GT-003 `!zones`) giữ lại có chủ đích: test và golden dùng nó
- [ ] Spec `play-stage-zones.md` **giữ `approved`** (2026-10-04). Đổi `implemented` khi đủ ba điều kiện:
  1. [x] `BR-PSZ-01`/`BR-PSZ-04` xanh **không cần bảng nợ**: mọi bảng nợ vật lý đã xoá, đo 0 — B3 899 → 0 (`d553f493`), B1 56 → 0, B6 62 → 0, GT-017, GT-024 → 0 (`e3aece5b`), GT-035 portrait 3 seed → 0 (`1ca6645e`). Giá: đo B3 theo band của level (runtime đặt `age_band` theo level); 28+ level B3 giảm độ khó; GT-009/029 độ khó 5 còn 8 vật, GT-030 độ khó 5 còn 4 đáp án, GT-035 độ khó 5 `collectible_count` 2; ngôi sao GT-024 mẫu 2 thành 5 đỉnh. **Cần chủ nội dung duyệt các thay đổi dataset này.**
  2. [x] GT-035 điện thoại ngang: bàn không vừa ở sàn chạm (đo 610x350: chín ô tương tác đã đầy sân khấu), nên giải bằng lớp **xoay máy dọc** (`BR-PSZ-14`, `BR-E035-06`, `928f7455`) — không còn "chơi ngang", cần chủ sản phẩm xác nhận.
  3. [ ] GT-026/027 chơi hết vòng trên trình duyệt: **xong** (Playwright + CDP, 390x844 và 844x390; tìm và sửa hai lỗi GT-026 — đứng màn trống sau lượt cuối, mất hai lượt đầu vì đồng hồ chạy khi âm lời dẫn — `d4564b3a`). Cảm ứng đa điểm: **mô phỏng CDP xanh**; còn thiếu **thiết bị cảm ứng vật lý** và lớp xoay máy `BR-PSZ-14` chưa chụp trên trình duyệt thật.
  Còn quan sát chưa sửa (README QA 2026-10-03): GT-026 kết thúc dưới 60% đúng cũng treo như lỗi 1; nút DOM của entity GT-026 không cập nhật thời gian thực; `play_sessions` của GT-026/027 luôn `score=0`; intro GT-004 `GL-C1-CMP-PAIR-0001` không có đáp án; GT-031 phát `game_started`/`game_completed` hai lần.
- [x] `index.md` cập nhật; tick "Mở task con" ở `277-play-stage-zones-todo.md`

## Cập nhật 2026-10-04 (đợt hai) — còn lại trước khi đổi `implemented`

- Lớp xoay máy `BR-PSZ-14` kiểm trên trình duyệt thật (844x390 ↔ 390x844, bàn phím, xoay giữa vòng): đạt (`bd55c5de`, ảnh ở `docs/qa/engine-captures/2026-10-04-rotate-gate/`).
- Dataset #283 chưa tới DB đã gieo vì `content_version` không đổi → nâng lên 3 + khoá `content-version.lock.json` (`BR-CSA-17`, `253829cf`). Dev đã gieo v3; **staging/prod cần người chạy `seed:content`** (`BR-CSA-07`).
- Lỗi phát hiện khi QA và đã sửa: GT-026 treo khi <60% và nút DOM không cập nhật (`BR-E026-05`); điểm `play_sessions` luôn 0 ở 26 template (`ad821d92`); `RoundRunner` là nguồn duy nhất của `round_started/round_completed` (`BR-RSP-12`, `f62142c7`); intro mất sau khi archive v1 (`64d19aaf`, `BR-CIG-08`); recall GT-000 thiếu đáp án (`BR-E000-13`); sự kiện vòng đời phát đôi (`5919730e`); flake test ratchet do chạy vitest đồng thời (khoá advisory, `1181c225`; baseline 40 → 39).
- Còn mở: **thiết bị cảm ứng vật lý**; chủ nội dung duyệt giảm độ khó (B3 28+ level, GT-009/029/030/035 độ khó 5, GT-009 độ khó 5 = độ khó 4); chủ sản phẩm xác nhận lớp xoay máy cho GT-035; `recommendation.ts` khớp theo `game_levels.id`; GT-026 hết giờ không phát `answer_incorrect`; `first_try_ratio` theo thao tác đầu vòng ở engine nhiều bước; cảnh báo hydration ở `/me`.
- Spec `play-stage-zones.md` **vẫn `approved`** tới khi ba mục đầu của "Còn mở" xong.

## Cập nhật 2026-10-04 (đợt ba)

- Đã sửa: recommendation/advanced-report/dashboard khớp theo mã level (`e1789af0`); GT-026 hết giờ phát `answer_*` (`BR-E026-06`) và `first_try_ratio` theo cả vòng (`ae6fc500`); hydration `/me` — SSR từng vẽ nhánh "Chào mừng" sai (`dc128dbc`); ba test API đỏ do `gameTemplates` đã bỏ (`53e56b09`, baseline 39 → 36); kích thích GT-026 chỉ hiện khi cổng cử chỉ mở (`545fc162`); GT-025 vùng chạm theo slot đã vẽ (`BR-E025-04`, `abc29806`); `game_started` một lần/phiên, `game_completed` một lần cuối (`46c7cc51`).
- Nghi vấn `skillsByLevelId` là báo động giả: `content_skill_map.entity_id` là id dòng `game_levels`, v1 archived giữ ánh xạ.
- `pnpm lint` sạch, `pnpm typecheck` 0 lỗi mọi project, cây làm việc sạch.
- Chưa kiểm/ghi nhận: GT-022 còn dùng `x`/`y` nội dung; cảnh báo `[VUE_ROUTER_R0004]` ở `/me/children/<uuid>/report`; điểm GT-026 thô (75% đúng vẫn 0 điểm — theo `scoring-and-result.md` §7.1, cần chủ sản phẩm quyết).
- Vẫn chờ người: duyệt dataset, xác nhận lớp xoay máy GT-035, thiết bị cảm ứng vật lý, `seed:content` ở staging/prod. Spec `play-stage-zones.md` giữ `approved`.

## Cập nhật 2026-10-04 (đợt bốn) — chỉ còn việc của người

- Đã sửa: GT-022 và GT-025 vùng chạm theo slot đã vẽ, test quét 36 engine `hit-matches-drawn` (`daadd9f5`); điểm một phần cho vòng nhiều lượt GT-026/027 (`BR-SCO-09`, cần chủ sản phẩm xem lại); `report_url` trỏ trang có thật; GT-009 độ khó 5 có manh mối thứ tư (`63fc86eb`); `content_version` 4 + khoá (`ee5233df`); dev DB ở v4.
- Tài liệu cho người quyết: `docs/qa/283-dataset-review.md` (phiếu duyệt dataset), `docs/qa/283-seed-content-runbook.md` (gieo staging/prod, **phải triển khai mã khớp theo mã level trước**), `docs/qa/touch-device-checklist.md`.
- Chờ người: (1) duyệt dataset, gồm A3/A4 (bù độ khó GT-015 band 5-6, GT-021 band 4-5 còn thang gần phẳng); (2) xác nhận lớp xoay máy GT-035 và `BR-SCO-09`; (3) thử thiết bị cảm ứng vật lý (thêm GT-022); (4) `seed:content` ở staging/prod. Spec `play-stage-zones.md` giữ `approved` tới khi xong.

## Cập nhật 2026-10-04 (đợt năm) — quyết định đã chốt theo nghiên cứu

Nghiên cứu: `docs/qa/283-research-orientation.md`, `283-research-dataset.md`, `283-research-scoring.md` (bằng chứng chủ yếu học thuật; không xác minh được số liệu app thương mại qua tìm kiếm web).

- **Lớp xoay máy GT-035: chốt giữ** (`BR-PSZ-14`), thêm khoá dọc best-effort khi toàn màn hình/PWA và dòng nhắc phụ huynh sau 5 s (`3183e15c`). Loại phương án thu mục tiêu dưới sàn chạm.
- **`BR-SCO-09` và ngưỡng sao 0,85/0,55, sàn 1 sao: chốt giữ.** Quyết định "lượt hết giờ trung tính ở band 3-4" không áp dụng vì GT-026 cấm band 3-4; `BR-E026-08` ghi rõ điều kiện nếu mở band đó (`cc4d31f8`).
- **Dataset: chốt nhận** GT-004/008/009/029/030/035/024; A3/A4 triển khai: GT-015 band 5-6 độ khó 5 = lưới 3×3, 3 ô trống, khay 3 ký hiệu, lời giải duy nhất (`BR-E015-04`); GT-021 band 4-5 độ khó 3 tắt trục dẫn, engine nay đọc `show_axis_guide` (`BR-E021-04`) (`d1593991`). `content_version` 5, dev DB đã gieo. `check:difficulty-ladder` đúng trần 186/186 — muốn nới phải có bảng tham số theo band.
- **Cổng cuối:** `lint`, `lint:deps`, mọi `check:*` phase 1, `typecheck` 0 lỗi, `check:test-ratchet` 36/36 xanh.
- **Còn lại, không tự làm được:** (a) thiết bị cảm ứng vật lý (`docs/qa/touch-device-checklist.md`, thêm GT-015 độ khó 5, GT-021 độ khó 3, GT-022, lớp xoay máy trên Android/iOS thật); (b) `seed:content` v5 ở staging/prod theo `docs/qa/283-seed-content-runbook.md` (triển khai mã khớp theo mã level trước). Spec `play-stage-zones.md` giữ `approved` tới khi (a) xong; (b) không chặn spec nhưng chặn việc dataset mới tới trẻ.

