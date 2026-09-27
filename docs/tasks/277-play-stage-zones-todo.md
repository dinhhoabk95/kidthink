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
- [ ] Người đặt việc duyệt spec, đổi `status: draft` sang `approved`

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

- [ ] RED: `apps/web/tests/unit/play-shell.test.ts` — trang không có `a[href]` ngoài khoá phụ huynh (`BR-PSZ-11`)
- [ ] `definePageMeta({ layout: "kid" })`; canvas đo sau khi trừ chiều cao HUD
- [ ] HUD ba nút icon, `aria-label` tiếng Việt, cạnh không dưới sàn band (`BR-PSZ-07`)
- [ ] Resize gọi `syncView()` — test `BR-PSZ-12` với hai viewport
- [ ] Ca âm: bỏ `definePageMeta` → test `BR-PSZ-11` đỏ

## S3 — Vùng lời dẫn và pilot GT-001 · M · phụ thuộc: S2

- [ ] RED: chạm tâm `zones.promptSpeaker` → `replayCurrentRoundNarration` một lần, engine không nhận gesture (`BR-PSZ-08`)
- [ ] Primitive vùng lời dẫn ở `render/`; gỡ badge loa trang trí khỏi `drawPromptText`
- [ ] GT-001 nhận `zones.stage` qua `prepareRound`; test ghi lệnh vẽ nằm trong stage (`BR-PSZ-01`)
- [ ] Test hai vòng liên tiếp GT-001 trên trang
- [ ] Ca âm: shell bỏ nhánh loa → test `BR-PSZ-08` đỏ

## S4 — Vùng hành động và GT-028 · S · phụ thuộc: S3

- [ ] `needsCommit` trên `TemplateGameSession`, mặc định `false`; GT-028 khai `true`
- [ ] Shell vẽ `drawCommitButton` ở `zones.action`, chạm đổi thành `commit` (`BR-PSZ-05`)
- [ ] GT-028 bỏ `drawProgressBadge` (`BR-PSZ-06`)
- [ ] Test H3 của S0: đổi `it.fails` thành `it`, test xanh
- [ ] Ca âm: gỡ nhánh đổi chạm → test H3 đỏ lại

## Checkpoint 1 — Trình duyệt thật

- [ ] GT-001 và GT-028 chơi hết một level ở ba viewport; reduced-motion bật; tắt tiếng vẫn thấy mascot
- [ ] Ảnh chụp sau vào cùng thư mục QA, đặt cạnh ảnh S0

## S5 — Khay chung và pilot kéo GT-003 · M · phụ thuộc: S3

- [ ] RED: GT-003 vẽ khay trong `zones.tray`, slot nguồn nằm trong khay
- [ ] `drawWoodenTokenDock` nhận rect, bỏ chiều cao cứng 136
- [ ] Tap-tap fallback `BR-ENG-06` vẫn xanh
- [ ] Ca âm: khay vẽ ở toạ độ cũ → test đỏ

## S6 — Mascot phản hồi · S · phụ thuộc: S3

- [ ] RED: đúng và sai mỗi loại phát tiếng cùng một đổi dáng mascot trong ≤100ms (`BR-PSZ-10`, `BR-ETS-07`)
- [ ] Nối `FeedbackSystem` qua `use-play-session.ts`
- [ ] Sai ba lần liên tiếp không đổi cường độ phản hồi
- [ ] Ca âm: tắt kênh hình → test đỏ

## S7 — GT-034, GT-035, GT-036 vào khung · M · phụ thuộc: S4

- [ ] RED: portrait 390, ba engine — không cặp hit nào chồng nhau (`BR-LAY-05`), mọi lệnh vẽ trong stage
- [ ] Bỏ toạ độ cứng, slot từ hàm layout; nút chạy, xoá, nghe lại vào vùng hành động
- [ ] Level đã seed của ba engine chạy lại trong test, không chỉ level mẫu
- [ ] Ca âm: khôi phục toạ độ cũ của GT-035 → test đỏ

## Checkpoint 2 — Trình duyệt thật

- [ ] Ba pilot và ba engine S7 ở ba viewport; xoay máy giữa vòng
- [ ] `rtk proxy pnpm check:engine-specs` và `check:engine-turn` exit 0

## Đóng task

- [ ] Diff danh sách test đỏ với baseline S0 — chỉ file của #277 đổi trạng thái
- [ ] Mở task con cho GT-002 và cho từng nhóm engine ở plan mục 5
- [ ] Spec đổi `status` sang `implemented` chỉ khi mọi scenario mục 9 có test xanh — nếu chưa, giữ `approved`
