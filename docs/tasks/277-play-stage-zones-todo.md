# Task #277 Todo: Bàn chơi năm vùng — bố cục chung của mọi game engine

Plan: [`277-play-stage-zones-plan.md`](277-play-stage-zones-plan.md).
Spec: [`play-stage-zones.md`](../specs/01-platform/play-stage-zones.md).

Luật tick: một ô chỉ được tick khi lệnh kiểm ở cuối lát chạy qua `rtk proxy` và exit 0, **và** ca
âm của lát đó đỏ khi bỏ phần sửa. Test chỉ gửi thẳng gesture vào engine Cấm — NEVER đủ để tick một
ô về bề mặt web.

Kiểm chung mỗi lát:
`rtk proxy npx vitest run` trong `packages/game-engine` (và `apps/web` nếu lát chạm tới),
`rtk proxy pnpm typecheck --only root`, `rtk proxy pnpm typecheck --only web:app`,
`rtk proxy pnpm lint`, `rtk proxy pnpm check:logic-space`. Diff danh sách file test đỏ với baseline
của S0 — không file nào đổi trạng thái ngoài file của lát.

## Spec — đã soạn 2026-09-25

- [x] [`play-stage-zones.md`](../specs/01-platform/play-stage-zones.md) mới, 11 mục, `BR-PSZ-01..12`
- [x] Liên kết từ [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) mục 1 và
      [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) mục 1, mục 10
- [x] [`index.md`](../specs/index.md) số đếm và hàng; [`business-rules.md`](../specs/00-foundation/business-rules.md) mục 7.1 prefix `BR-PSZ`
- [x] Người đặt việc duyệt spec, đổi `status: draft` sang `approved` (2026-10-03)

## S0 — Phép đo mở đầu · S · phụ thuộc: không

- [x] Baseline file test đỏ: `rtk proxy pnpm check:test-ratchet` → [`277-s0-red-baseline.txt`](277-s0-red-baseline.txt)
      (134 đỏ, Postgres không chạy; cổng exit 1 vì 92 file DB mới đỏ — do môi trường, không do #277)
- [ ] Chụp 11 dạng tương tác ở 390×844, 844×390, 1024×768 vào `docs/qa/engine-captures/2026-09-25/`
      — **chặn**: cần `pnpm services` và DB đã seed; dời sang Checkpoint 1 (plan mục 1.3, M3)
- [ ] Đo px thật của ba nút HUD và slot nhỏ nhất mỗi viewport — **mới tính từ CSS** (plan mục 1.3,
      M2: điện thoại ngang sàn 96 còn 44 px); tick khi đo được trên trình duyệt ở Checkpoint 1
- [x] Test tái hiện H3: [`play-commit-reachability.test.ts`](../../apps/web/tests/unit/play-commit-reachability.test.ts)
      — GT-028 thật, chạm đủ số, quét `tap` toàn canvas không thắng được. Dùng `it.fails` thay vì để
      đỏ (giữ `check:test-ratchet`); bỏ `.fails` tạm thời thì đỏ đúng ở phép kiểm thắng cuối

## S1 — Hàm vùng thuần · M · phụ thuộc: S0

- [x] RED: [`stage-zones.test.ts`](../../packages/game-engine/tests/layout/stage-zones.test.ts) — scenario
      `BR-PSZ-02`, `-03`, `-04`, thứ tự vùng `BR-PSZ-01`; đỏ vì module chưa có (2026-09-27)
- [x] [`layout/stage-zones.ts`](../../packages/game-engine/src/layout/stage-zones.ts); `PROMPT_ZONE_H_PX`,
      `TRAY_ZONE_H_PX` cạnh `CONTENT_TOP_PX`; sàn qua `getTouchFloorLogicPx` (bọc `getTouchFloor`)
- [x] Ca âm: fixture [`stage-zones-logic-px-floor.ts`](../../packages/game-engine/tests/layout/fixtures/stage-zones-logic-px-floor.ts)
      bị báo vi phạm; thêm: đổi `cssPerLogic` thành 1 trong hàm → hai test `BR-PSZ-04` đỏ
- [x] Xuất `computeStageZones`, `StageZones`, `StageZonesInput`, `ZoneRect`, `getTouchFloorLogicPx` qua barrel
- [ ] **Chưa phủ**: nửa slot của scenario `BR-PSZ-04` ("mọi LayoutId ở slotCount lớn nhất") — hàm layout
      vẫn áp sàn ở logic px. Dời sang S3, khi layout nhận `zones.stage` và `cssPerLogic`

## S2 — Shell kid và HUD icon · M · phụ thuộc: S1

- [x] RED: `apps/web/tests/component/play-stage-hud.test.ts` — 5 test (2026-09-27), đỏ
      trước khi sửa: thiếu `definePageMeta`, `lesson-info-pill`/`btn-skip-round` còn
      trong HUD, `syncView()` không được resize gọi lại
- [x] `definePageMeta({ layout: "kid" })`; `layouts/kid.vue` viết lại — bỏ header/nav
      cũ (chưa trang nào dùng), chỉ còn `<slot />` full-viewport, giữ `#main-content`
      cho skip-link của `app.vue`
- [x] HUD ba nút icon (khoá phụ huynh đầu dòng, hạt tiến độ giữa, loa nghe lại cuối
      dòng), `aria-label` tiếng Việt, cạnh = `getTouchFloor(ageBand)` qua biến CSS
      `--hud-touch-floor` (`BR-PSZ-07`, `BR-PSZ-04`); `usePlaySession` trả thêm
      `ageBand`. Gỡ `lesson-info-pill` (chữ theo dõi Nghe lại/Bỏ qua chỉ còn
      aria-label). "Bỏ qua" ra khỏi HUD, nút nổi tạm ở góc dưới trái sân khấu
      (`.btn-skip-floating`, đối diện góc nút hành động tương lai của S4/`D-277-7`)
- [x] Resize gọi `syncView()` cùng nhịp với tính lại logic space — sửa H11
      (test `BR-PSZ-12`, trước đó `handleResize` không gọi `syncView()`)
- [x] Ca âm: xoá `gesture.syncView()` khỏi `handleResize` → test `BR-PSZ-12` đỏ lại
      (đã kiểm tay bằng cách tạm bỏ dòng đó và chạy lại suite)
- [ ] **Chưa kiểm ở trình duyệt thật**: BR-PSZ-11 (không `a[href]` ngoài khoá phụ
      huynh) chỉ verify được ở mức "trang khai đúng `definePageMeta`" — mount
      component đơn lẻ không dựng `NuxtLayout` nên không thấy navbar/footer thật.
      Xác nhận đầy đủ dời sang Checkpoint 1 (cần `pnpm services` + DB đã seed)

## S3 — Vùng lời dẫn và pilot GT-001 · M · phụ thuộc: S2

- [x] RED: chạm tâm `zones.promptSpeaker` → `replayCurrentRoundNarration` một lần, engine không nhận gesture (`BR-PSZ-08`)
- [x] Primitive vùng lời dẫn ở `render/`; gỡ badge loa trang trí khỏi `drawPromptText`
- [x] GT-001 nhận `zones.stage` qua `prepareRound`; test ghi lệnh vẽ nằm trong stage (`BR-PSZ-01`)
- [x] Test hai vòng liên tiếp GT-001 trên trang
- [x] Ca âm: shell bỏ nhánh loa → test `BR-PSZ-08` đỏ

## S4 — Vùng hành động và GT-028 · S · phụ thuộc: S3

- [x] `needsCommit` trên `TemplateGameSession`, mặc định `false`; GT-028 khai `true`
- [x] Shell vẽ `drawCommitButton` ở `zones.action`, chạm đổi thành `commit` (`BR-PSZ-05`)
- [x] GT-028 bỏ `drawProgressBadge` (`BR-PSZ-06`)
- [x] Test H3 của S0: đổi `it.fails` thành `it`, test xanh
- [x] Ca âm: gỡ nhánh đổi chạm → test H3 đỏ lại

## Checkpoint 1 — Trình duyệt thật

- [ ] GT-001 và GT-028 chơi hết một level ở ba viewport; reduced-motion bật; tắt tiếng vẫn thấy mascot
- [ ] Ảnh chụp sau vào cùng thư mục QA, đặt cạnh ảnh S0
- [x] Sửa bố cục điện thoại ngang 844x390 (QA 2026-10-03, 2026-10-03): ba nguyên nhân đo trên Chromium —
      (1) HUD cao cố định 88 px, nút 96 px nên cắt mép trên (`.top-hud-bar` giờ `height: auto`);
      (2) `.game-canvas` chặn `85vh - 20px` = 312 px > 250 px còn lại và `.main-arena` thiếu
      `min-height: 0` nên canvas tràn đáy (bỏ chặn vh, thêm `min-height: 0`, bớt đệm khi
      `max-height: 500px` landscape; hộp canvas thành 800x243, đáy 368 < 390);
      (3) `computeStageZones` landscape không khay dừng sân khấu trên đỉnh nút hành động nên chỉ còn
      60 logic px và ô lựa chọn đè thẻ mẫu — nay kéo xuống đáy, dừng trước cột nút (spec §5, `D-277-7`).
      Nhỏ: lời dẫn ngắt hai dòng thay vì cắt "…" ([`prompt-zone.ts`](../../packages/game-engine/src/render/prompt-zone.ts));
      gấu không còn che hai sao đầu ở `victory-modal.vue`. Test:
      [`stage-landscape-phone.test.ts`](../../packages/game-engine/tests/layout/stage-landscape-phone.test.ts) (ca âm: fixture sân khấu 60 px),
      [`prompt-zone-wrap.test.ts`](../../packages/game-engine/tests/render/prompt-zone-wrap.test.ts),
      [`play-surface-short-landscape.test.ts`](../../apps/web/tests/unit/play-surface-short-landscape.test.ts) (ca âm: CSS cũ).
      Ảnh sau: `docs/qa/engine-captures/2026-10-03/after-landscape-fix/`. Còn lại: chưa chơi hết level, chưa chụp màn tổng kết

## S5 — Khay chung và pilot kéo GT-003 · M · phụ thuộc: S3

- [x] RED: GT-003 vẽ khay trong `zones.tray`, slot nguồn nằm trong khay
- [x] `drawWoodenTokenDock` nhận rect, bỏ chiều cao cứng 136
- [x] Tap-tap fallback `BR-ENG-06` vẫn xanh
- [x] Ca âm: khay vẽ ở toạ độ cũ → test đỏ

## S6 — Mascot phản hồi · S · phụ thuộc: S3 — làm trong [#279](279-kid-feedback-pass-todo.md)

- [x] RED: đúng và sai mỗi loại có một đổi dáng mascot ngay khung vẽ kế tiếp (`BR-PSZ-10`, `BR-FBK-11`)
      — `tests/feedback-overlay.test.ts`, `apps/web/tests/unit/play-gesture.test.ts`
- [x] Nối phản hồi qua `use-play-gesture` `onFeedback` → `FeedbackOverlay` (không qua `use-play-session`: verdict sinh ở gesture)
- [x] Sai năm lần liên tiếp cho khung giống hệt lần đầu (`BR-FBK-07`)
- [x] Ca âm: bỏ `emitFeedback` khỏi `handleVerdict` → ba test `onFeedback` đỏ (đã thấy đỏ trước khi cài)

## S7 — GT-034, GT-035, GT-036 vào khung · M · phụ thuộc: S4

- [x] RED: portrait 390, ba engine — không cặp hit nào chồng nhau (`BR-LAY-05`), mọi lệnh vẽ trong stage
      — [`stage-engines-s7.test.ts`](../../packages/game-engine/tests/layout/stage-engines-s7.test.ts)
      (2026-10-03); chạy trên ba `session.ts` cũ thì đỏ 172/177 ca
- [x] Bỏ toạ độ cứng, slot từ hàm layout; nút chạy, xoá, nghe lại vào vùng hành động — slot từ
      [`computeStageGroupsLayout`](../../packages/game-engine/src/layout/stage-groups.ts) trong
      `zones.stage`. Spec sửa trước (`BR-PSZ-05`, mục 5 hai nhánh mới): mỗi engine **một** nút ở
      `zones.action` qua `commit` — GT-034 nghe mẫu (icon loa), GT-035 chạy (icon ▶), GT-036 xong
      (✓). Nút xoá bỏ hẳn: GT-036 chạm lại ô đang mang đúng phần tử đang cầm là gỡ
- [x] Level đã seed của ba engine chạy lại trong test, không chỉ level mẫu — `ALL_SEED_LEVELS`
      (37 GT-034 · 17 GT-035 · 20 GT-036), mỗi level kiểm hit và kiểm vẽ lúc mở lượt và giữa lượt
- [x] Ca âm: khôi phục toạ độ cũ của GT-035 → test đỏ — fixture
      [`gt-035-legacy-coords.ts`](../../packages/game-engine/tests/layout/fixtures/gt-035-legacy-coords.ts)
      bị báo slot ngoài stage (portrait 390) và hit chồng nhau (960×540)
- [ ] **Chưa phủ**: sàn chạm trên px CSS thật (`BR-PSZ-04`) — slot vẫn lấy sàn ở logic px như S1
      ghi; hint của GT-035/GT-036 không còn chỉ được tới nút ở `zones.action` (trả `null` khi bước
      kế là chạy/nộp); nút hành động chưa có entity cho bàn phím và screen reader

## Checkpoint 2 — Trình duyệt thật

- [ ] Ba pilot và ba engine S7 ở ba viewport; xoay máy giữa vòng
- [ ] `rtk proxy pnpm check:engine-specs` và `check:engine-turn` exit 0

## Đóng task

- [ ] Diff danh sách test đỏ với baseline S0 — chỉ file của #277 đổi trạng thái
- [x] Mở task con cho GT-002 và cho từng nhóm engine ở plan mục 5 → [#283](283-remaining-engines-zones-todo.md) (2026-10-03)
- [ ] Spec đổi `status` sang `implemented` chỉ khi mọi scenario mục 9 có test xanh — nếu chưa, giữ `approved`
