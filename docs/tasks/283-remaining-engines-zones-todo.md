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
- [ ] Đo lại ở trình duyệt thật: ảnh chụp một engine chưa dời

## N — Lát nền · M · phụ thuộc: N0

- [ ] RED: `LayoutInput.stage` và `cssPerLogic`; layout nhận stage cho slot trong stage (`BR-PSZ-01`)
- [ ] `geometry.ts` bỏ `CONTENT_TOP_PX` khi có `stage`; không có `stage` thì kết quả giữ nguyên (`BR-LAY-10`)
- [ ] 15 chỗ `getTouchFloor(` đổi `getTouchFloorLogicPx` (`BR-PSZ-04`); `RoundRunner` truyền `vp.scale`
- [ ] Ca âm `BR-PSZ-04`: mọi `LayoutId` ở slotCount lớn nhất, hit × `cssPerLogic` ≥ sàn ở 330×697; `cssPerLogic` = 1 → đỏ
- [ ] Nâng `GT-003/tray-layout.ts` lên `layout/tray-layout.ts`; GT-003 vẫn xanh
- [ ] Gom `stage-engines-s7.test.ts` thành `stage-engines.test.ts` tham số theo mã; gate `zone-primitives-only` + ca âm
- [ ] `layout.test.ts` và `layout-safe-area-debt.json` không đổi

## B1 — Chạm chọn một · M · phụ thuộc: N

- [ ] RED: GT-009, 010, 011, 012, 022, 025, 029, 032 ở ba viewport — hit không chồng, vẽ nằm trong stage
- [ ] Gỡ `drawPromptText`, bỏ toạ độ cứng, slot từ layout trong `zones.stage`
- [ ] `ALL_SEED_LEVELS` của tám engine chạy lại, hai vòng liên tiếp
- [ ] Ca âm: fixture còn `drawPromptText` → đỏ
- [ ] `check:hardcoded-params` không tăng

## B2 — Nộp bài, tiến độ, ức chế · M · phụ thuộc: B1, #275 đóng

- [ ] RED: GT-002 `needsCommit=true`, chạm `zones.action` nộp được, quét `tap` không thắng (mẫu `play-commit-reachability.test.ts`)
- [ ] GT-002 bỏ nút Xong tự vẽ và `drawProgressBadge`
- [ ] GT-018: `needsCommit` theo `response_mode === "sequence"`, test hai nhánh
- [ ] GT-026, GT-027 bỏ `drawProgressBadge` (`BR-PSZ-06`); khoảng nghỉ GT-026 vẫn trống
- [ ] Ca âm: khôi phục `drawProgressBadge` → đỏ

## B3 — Kéo thả có khay · L · phụ thuộc: N

- [ ] RED: GT-004, 007, 008, 015, 021, 023 — nguồn trong `zones.tray`, đích trong stage
- [ ] Tap-tap fallback `BR-ENG-06` xanh cho cả sáu
- [ ] Nợ safe-area của GT-004 (28, 588) và GT-008 (32) không tăng
- [ ] Ca âm: khay ở toạ độ cũ → đỏ

## B4 — Ghép, lật, dãy, đường · M · phụ thuộc: N

- [ ] RED: GT-005, 006, 013, 020, 024
- [ ] GT-006 `needsCommit=true`; nợ GT-005 (736) không tăng
- [ ] GT-013, GT-024: nét vẽ giới hạn trong stage
- [ ] Ca âm cho từng engine có `needsCommit`

## B5 — Thao tác trực tiếp · M · phụ thuộc: B2

- [ ] Sửa spec GT-016 trước: chỉ `commit` nộp, `tap` không nộp
- [ ] RED: GT-014, 016, 017, 019; GT-016 `needsCommit=true`, GT-019 `needsTray=true`
- [ ] Ca âm: khôi phục `tap → submit_time` → đỏ

## B6 — Xây, đo, đong lường · M · phụ thuộc: B3, B5

- [ ] Quyết `needsCommit` của GT-030, 031, 033 theo phiếu engine; ghi vào spec
- [ ] RED: ba engine — vật ở khay, một nút ở `zones.action` nếu có, không nút xoá
- [ ] `ALL_SEED_LEVELS` ba engine chạy lại

## B7 — GT-000 · M · phụ thuộc: B2

- [ ] Người đặt việc quyết: intro trong khung hay ngoài khung
- [ ] Nếu trong khung: sửa `concept-intro-gate.md` trước, rồi RED + ca âm

## Việc chung

- [ ] Entity a11y của nút hành động ở shell; Tab + Enter gửi `commit`; áp GT-028, 034, 035, 036 và mọi engine `needsCommit` mới
- [ ] `getHintTarget()` có nhánh `{ kind: "action" }`; shell nháy nút hành động
- [ ] Xác định cổng hint-target ngoài `check:hint-target` (nếu có)

## Checkpoint — Trình duyệt thật

- [ ] Mỗi lô: một level mỗi engine ở ba viewport, xoay máy giữa vòng, reduced-motion bật
- [ ] Ảnh vào `docs/qa/engine-captures/<ngày>/`; `check:engine-specs` và `check:engine-turn` exit 0

## Đóng task

- [ ] Gate `zone-primitives-only` phủ đủ 37 mã, danh sách ngoại lệ rỗng
- [ ] Xoá nhánh `if (!this.stageRect)` trong GT-001 và đường lui tương tự ở GT-003/028
- [ ] Spec `play-stage-zones.md` đổi `implemented` khi mọi scenario mục 9 xanh; nếu chưa, giữ `approved`
- [ ] `index.md` cập nhật; tick "Mở task con" ở `277-play-stage-zones-todo.md`
