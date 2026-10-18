# Task #301 Todo: Thang trợ giúp N5 riêng từng engine (Engine Hint Ladder)

Plan: [`301-engine-hint-ladder-plan.md`](301-engine-hint-ladder-plan.md).
Spec: [`engine-turn-script.md`](../specs/01-platform/engine-turn-script.md) `BR-ETS-08`, [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) `BR-SCF-01/03/04/05/07`, §4 `N5` của [`engines/GT-0NN.md`](../specs/01-platform/engines/).

---

## S1 — Chốt trigger `hint_after_ms` vs ngưỡng band
- [ ] Đọc `scaffolding-and-hints.md` §6/§7.1 và `engine-turn-script.md` §4; ghi kết luận ai thắng
- [ ] Nếu spec mâu thuẫn: sửa spec trước (commit riêng)
- [ ] Viết test đỏ: vào `L1` đúng `hint_after_ms`, miss streak vẫn đẩy mức, event mang `level`
- [ ] Sửa `systems/scaffolding.ts` + `round-runner.ts` cho test xanh

## S2 — Hook `getHintTargetForLevel` + kiểu `region`
- [ ] Chụp danh sách `trạng-thái | tên-test` của `@mindkid/game-engine` (trước)
- [ ] Viết test đỏ: session override `L1` → `region`, `focusIndex` chỉ gán ở `L3`
- [ ] Thêm `getHintTargetForLevel` + `HintTarget.region` ở `game-session.ts`; nối `core.ts:tickScaffolding`
- [ ] Renderer tô `region` bằng token (không hex)
- [ ] Chụp danh sách sau — trùng khít ngoài test mới

## S3 — Bậc thang nợ trong `check:hint-target`
- [ ] Fixture ca âm `L1` = đáp án trong `tests/**/fixtures/`
- [ ] Mở rộng `scripts/check-hint-target.ts` đếm engine chưa override; `--update` từ chối tăng
- [ ] Ghi baseline ban đầu (số đo thật)

## S4 — `GT-010`, `GT-011`, `GT-012`, `GT-017`
- [ ] Test đỏ theo §4 `N5` từng phiếu (gắn mã BR)
- [ ] Cài `L1`/`L2` không trỏ đáp án, `L3` trình diễn
- [ ] `check:hint-target:update` (giảm 4)

## S5 — `GT-032`
- [ ] Test đỏ: `L1` vạch đơn vị, `L2` số/tách cột, `L3` cốc đúng
- [ ] Cài theo phiếu; giảm baseline 1

## S6 — Trả nợ engine còn lại
- [ ] Lặp từng lượt 3–5 engine tới baseline = 0
- [ ] Nếu dừng giữa chừng: ghi số nợ còn lại và giữ `#301` trên đúng các phiếu còn nợ

## S7 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] `rtk proxy pnpm --filter @mindkid/game-engine test` xanh
- [ ] `rtk proxy pnpm check:hint-target`, `check:engine-specs`, `check:engine-turn`, `check:engine-behavior` xanh
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Bỏ `#301` khỏi `open_tasks` + khối "Chưa hoàn thành" ở mọi spec liên quan; nâng status; cập nhật `reviewed`
- [ ] Commit vào `main`
