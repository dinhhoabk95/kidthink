# Task #260 Plan: Đóng thật các đường tối của bề mặt chơi

> Kế thừa [`259-play-surface-dark-paths-plan.md`](259-play-surface-dark-paths-plan.md).
> Todo: [`260-play-surface-close-for-real-todo.md`](260-play-surface-close-for-real-todo.md)

---

## 1. Bối cảnh

Task #259 đặt mục tiêu nối 16 đường tối giữa engine và đứa trẻ. Review ngày 2026-09-07 trên
commit `3404b93c` cho thấy **hình dạng của việc đã có, nhưng dòng điện chưa chạy**: lint xanh,
typecheck 10/10 baseline 0, engine `PASS 1312 / FAIL 0` — nhưng 1312 chính là con số **trước**
task, tức 2.291 dòng thêm vào mà không một test mới nào. Thay đổi test duy nhất là **nới lỏng**
một cổng đã có.

### 1.1 Ba nhóm nguyên nhân

**Cổng không thể đỏ.** `scripts/check.sh` Phase 3 gặp services thiếu thì lặng lẽ tụt xuống chạy
mỗi `game-engine` rồi in `✓ test` và exit 0. Đo tại chỗ: `pnpm services` exit **1**. Cổng bậc
thang mà T17 của #259 khai **không tồn tại** — không script, không mục trong `check.sh`, không
entry trong `package.json`. Nên "4 checkpoint đều `pnpm check` exit 0" không mang thông tin gì.

**Dây nối treo lơ lửng.** T7/T8 dựng đủ `deriveLogicSpace` → `RoundRunnerOptions.logicSpace` →
`prepareRound(band, space)`, rồi page **không truyền** và 32/37 template **không đọc**. Cùng dạng:
`ScaffoldingSystem.triggerVisualFallback()` vẫn 0 call site production — đúng phát hiện gốc của
#259, chưa đóng.

**Nuốt lỗi sâu hơn trước.** `finishSession` giờ `catch { return null }` không một dòng log. Chính
lớp che này đã giấu 403 CSRF suốt #259; bản vá làm nó kín hơn.

### 1.2 Nguyên tắc xuyên suốt

Không ô nào được tick nếu chưa có một phép thử **đỏ khi gỡ bản vá**. Thứ tự: **cổng trước, dây
nối sau, đánh bóng cuối**.

### 1.3 Giả định đã chốt

| # | Giả định |
|---|---|
| A1 | Work chưa commit của #259 (`[code].vue`, `parent-gate-modal.vue`, `use-play-gesture.ts`, `assets/css/play-surface.css`, `use-play-audio.ts`) là hợp lệ và được commit trước khi #260 bắt đầu. Không revert `3404b93c`. |
| A2 | Tên event lấy theo spec, không theo code: `scaffold_escalated`, `demo_shown`, `round_skipped`, `parent_gate_shown/_passed/_failed`. Code hiện dùng `hint_escalated`/`skip_suggested` — đổi code, không đổi spec. |
| A3 | Test DOM cho `.vue` cần dep mới. Chốt `happy-dom` + `@vue/test-utils` vào `apps/web` devDependencies (repo hiện không có cả hai, mọi project vitest đang chạy env `node`). Chỉ thêm ở Giai đoạn 5, sau khi phần lớn logic đã rút ra thành module thuần test được bằng env `node`. |
| A4 | `/complete` fail thì trẻ **vẫn** được ăn mừng (giữ lập trường #259), nhưng lỗi phải `console.error` và modal Cấm — NEVER khen mức `great` khi không có dữ liệu server. Không dựng UI báo lỗi cho phụ huynh trong task này. |
| A5 | Sàn nợ test toàn repo lấy bằng một lần chạy `vitest run` **không** `--bail` sau `docker compose up -d`, chốt thành `test-baseline.json`. Cổng chỉ cho danh sách file đỏ thu hẹp. |

---

## 2. Bản đồ phụ thuộc

```
GĐ0  Cổng biết đỏ  ─────────────────────────────┐
      check.sh không tụt hạng · ratchet test     │  mọi giai đoạn sau đo bằng cổng này
      · hoàn nguyên độ chính xác render-viewport │
                                                 ▼
GĐ1  Đường điểm hết câm  ───────►  GĐ4  Cổng phụ huynh đúng spec
      log lỗi · celebration an toàn        (rút state machine thuần)
                                                 │
GĐ2  Không gian logic chạy thật  ────────────────┤
      page→RoundRunner · 32 template · ratchet   │
                │                                │
                ▼                                ▼
GĐ3  Scaffolding chỉ đúng ô  ─────────►  GĐ5  a11y đo được
      hint target · tên event · ghost hand     (cần GĐ2+GĐ3 ổn định
                                                trước khi khoá DOM)
                                                 │
                                                 ▼
                                          GĐ6  Hợp đồng & vệ sinh
```

Lát cắt **dọc**: mỗi task đi trọn từ engine → composable → page → phép thử, Cấm — NEVER tách
"làm hết engine rồi làm hết UI".

---

## 3. Giai đoạn 0 — Cổng biết đỏ

Đặt trước mọi thứ vì không có nó thì không đo được gì. Đây chính là việc T17 của #259 khai đã làm.

### T1 — Bỏ đường tụt hạng im lặng của `check.sh` · S · phụ thuộc: không

Phase 3 hiện có ba nhánh, nhánh giữa in `ℹ` rồi vẫn kết thúc bằng `✓ test`. Chế độ đầy đủ mà
thiếu service thì phải **exit khác 0** kèm hướng dẫn `docker compose up -d`. Chỉ `--fast` được
phép chạy tập con.

- Tiêu chí: services down + `bash scripts/check.sh` → exit khác 0, thông báo nêu đúng lệnh cần chạy.
- Tiêu chí: services down + `--fast` → exit 0, in rõ tập test đã chạy là tập con.
- Kiểm chứng: `pnpm services; echo $?` = 1 → `bash scripts/check.sh; echo $?` khác 0.
- File: `scripts/check.sh`.

### T2 — Ratchet test toàn repo · M · phụ thuộc: T1

- Sau `docker compose up -d`, chạy `vitest run` **không** `--bail`, chốt danh sách file đỏ vào
  `scripts/test-baseline.json` (cùng khuôn `typecheck-baseline.json`).
- Viết `scripts/check-test-ratchet.ts` + script `check:test-ratchet`; nợ chỉ được giảm, file đỏ
  mới là cổng đỏ.
- Gắn vào Phase 3 của `check.sh`, thay `--bail 1` — bail giấu mất phần còn lại của danh sách.
- Ca âm: cố ý làm đỏ một test đang xanh → `pnpm check` exit khác 0 và nêu đúng tên file.
- Ca âm: chạy hai lần liên tiếp cho kết quả giống nhau (không flaky).
- File: `scripts/check-test-ratchet.ts`, `scripts/test-baseline.json`, `scripts/check.sh`, `package.json`.

### T3 — Hoàn nguyên độ chính xác `render-viewport.test.ts` · XS · phụ thuộc: không

`3404b93c` nới `toBeCloseTo(1, 5)` → `(1, 2)`, `toBeCloseTo(0, 5)` → `(0, 0)` (nhận lệch dưới
0,5 — gần như mọi giá trị), `toBeGreaterThan(0)` → `toBeGreaterThanOrEqual(0)` (0 chính là ca
lỗi cũ).

- Trả về `5` / `5` / `toBeGreaterThan(0)`.
- Nếu đỏ: sửa `deriveLogicSpace`/`setupCanvas`. Cấm — NEVER nới lại ngưỡng.
- File: `packages/game-engine/tests/gates/render-viewport.test.ts`.

### Checkpoint A — cổng có răng

`pnpm services` exit 1 → `pnpm check` exit khác 0 · `docker compose up -d` → `pnpm check` exit 0
và ratchet in đúng số file đỏ nền · làm đỏ một test bất kỳ → cổng đỏ nêu đúng tên file ·
`render-viewport` ngưỡng đã về 5/5 · engine `PASS ≥1312 / FAIL 0` · người đặt việc duyệt.

---

## 4. Giai đoạn 1 — Đường điểm hết câm

### T4 — Mọi lỗi phiên chơi đều kêu · S · phụ thuộc: T1

`use-play-telemetry.ts:61-66` `catch { return null }`; `[code].vue:466, 496-498, 617` cùng kiểu.

- `finishSession` trả `{ ok: true, data } | { ok: false, error }` thay vì `null` — biên kiểu
  tường minh, bỏ nhánh đoán ở call site.
- Mọi catch `console.error` kèm ngữ cảnh (`session_uuid`, endpoint, status).
- Giữ lập trường A4: lỗi mạng Cấm — NEVER chặn ăn mừng.
- Ca âm (env `node`, không cần DOM): mock `useApi` ném 403 → `finishSession` trả `ok: false`,
  `console.error` gọi đúng 1 lần, hàm Cấm — NEVER ném ra ngoài.
- File: `apps/web/app/composables/play/use-play-telemetry.ts`, `apps/web/app/pages/play/[code].vue`,
  `apps/web/tests/unit/play-telemetry.test.ts` (mới).

### T5 — Modal Cấm — NEVER khen mức `great` khi không có dữ liệu · XS · phụ thuộc: T4

`resp === null` hiện để `earnedCelebration` ở mặc định `great` → "Bé Giỏi Quá!" mà không sao nào.
Lỗi mạng biến thành lời khen cao nhất.

- `/complete` fail → `celebration = "nice_try"`, `stars = null`: đã hoàn thành, không khẳng định giỏi.
- Siết kiểu prop `celebration` của `victory-modal.vue` từ `string | null` về union
  `"great" | "good" | "nice_try"` dùng chung với `use-play-telemetry.ts`.
- File: `apps/web/app/pages/play/[code].vue`, `apps/web/app/components/kid/victory-modal.vue`,
  `apps/web/app/composables/play/use-play-telemetry.ts`.

---

## 5. Giai đoạn 2 — Không gian logic chạy thật

Giai đoạn rủi ro nhất, đặt sớm để đổ vỡ sớm.

### T6 — Nối `logicSpace` từ page xuống RoundRunner · S · phụ thuộc: T3

`[code].vue:576` dựng `RoundRunner` không truyền `logicSpace` → `prepareRound(band, undefined)`
giữ `DEFAULT_LOGIC_SPACE` ở **mọi** vòng.

- Sau `setupCanvas`, lấy `viewport.logicSpace` truyền vào `RoundRunnerOptions.logicSpace`.
- `handleResize` (`[code].vue:706`) hiện chỉ gọi `setupCanvas` → không gian vẽ đổi mà slot giữ
  không gian cũ, hit-test lệch sau khi xoay máy. Phải `setLogicSpace()` + `resolveSlots(band)`
  lại cho session đang chạy, và debounce khoảng 150ms.
- Ca âm: dựng RoundRunner ở không gian dọc, chạy sang **vòng 2**, khẳng định `session.logicSpace`
  khác `DEFAULT_LOGIC_SPACE`. Test một-vòng Cấm — NEVER đủ cho lớp lỗi này.
- File: `apps/web/app/pages/play/[code].vue`, `packages/game-engine/src/round-runner.ts`,
  `packages/game-engine/tests/round-runner-logic-space.test.ts` (mới).

### T7 — Ratchet đo đúng thứ cần đo · S · phụ thuộc: T6

T7 của #259 khai "cổng đếm template còn import tĩnh `LOGIC_WIDTH`" — phép đo sai: hiện **0**
import tĩnh mà vẫn **32/37** template lay out ở 960x540, vì chúng gọi
`layoutFn({ slotCount, ageBand })` thiếu khoá `logic`.

- Viết `scripts/check-logic-space.ts`: đếm `session.ts` có `computeSlots` mà **không** truyền
  `logic: this.logicSpace` vào `resolveLayout`/`layoutFn`. Nợ nền = 32.
- Ca âm: gỡ `logic:` khỏi GT-001 → cổng đỏ.
- File: `scripts/check-logic-space.ts`, `scripts/logic-space-baseline.json`, `scripts/check.sh`,
  `package.json`.

### T8 — Đốt nợ 32 template về 0 · L cơ học · phụ thuộc: T7

Chia ba lô, mỗi lô là một lần chạy `qa:capture` đối chiếu ảnh.

- Lô 1: GT-000, GT-003..GT-007, GT-009..GT-011.
- Lô 2: GT-013..GT-017, GT-019..GT-023.
- Lô 3: GT-024..GT-033. Riêng GT-034/035/036 không đi qua `resolveLayout`; GT-036 còn 3 số
  960/540 viết cứng, xử lý riêng.
- Sau mỗi lô: ratchet giảm, `scripts/qa/capture-engines.ts` ở khung 390x844 không lệch bố cục.
- Ratchet về **0** khi xong.
- File: 32 file `packages/game-engine/src/templates/GT-0**/session.ts`,
  `scripts/logic-space-baseline.json`.

### Checkpoint B — chơi được trên điện thoại

Ratchet không gian logic = 0 · ở 390x844 sàn chạm band 3-4 ≥ 76 CSS px **đo bằng test** ·
không tràn ngang · xoay ngang-dọc giữa vòng chơi thì chạm vẫn trúng ô đang thấy ·
`pnpm check` exit 0 với service đầy đủ · người đặt việc duyệt.

---

## 6. Giai đoạn 3 — Scaffolding chỉ đúng ô

### T9 — Hợp đồng "ô cần chỉ" trên `TemplateGameSession` · M · phụ thuộc: T8

Gốc lỗi: `core.ts` gọi `scaffolding.tick(deltaMs)` → `tickInternal` (`scaffolding.ts:207`) —
nhánh này **không bao giờ** gán `focusIndex`; chỉ `tickStateless` gán, từ `targetFocusIndex` do
caller truyền. Nên `focusIndex` luôn `null` và core ép cứng thành `0`. Vòng hổ phách vì thế trỏ
slot đầu theo thứ tự layout, **không phải đáp án đúng** — trẻ bí 30 giây được chỉ vào ô sai.
Spec §4.2 nói rõ L1 là highlight target **đúng** (`BR-SCF-03`).

- Thêm `getHintTargetIndex(): number | null` vào `TemplateGameSession`, mặc định `null`.
- `core.tickScaffolding` gọi `tickStateless(delta, state, band, session.getHintTargetIndex())`;
  **xoá hẳn** `setFocusIndex(0)`. `null` → Cấm — NEVER vẽ vòng: thà không gợi ý còn hơn gợi ý sai.
- Cài `getHintTargetIndex` cho 37 template; ratchet đếm template còn trả `null`, nợ chỉ giảm.
- Ca âm: session giả có đáp án ở index 3 → sau ngưỡng L1 band 3-4, `engine.focusIndex === 3`.
- Ca âm: session trả `null` → `renderScaffoldingAura` không vẽ gì.
- File: `packages/game-engine/src/game-session.ts`, `src/core.ts`, `src/templates/**/session.ts`,
  `packages/game-engine/tests/scaffolding-hint-target.test.ts` (mới), `scripts/check-logic-space.ts`.

### T10 — Tên event theo spec · XS · phụ thuộc: T9

Code phát `hint_escalated` / `skip_suggested`; spec §7.3 là `scaffold_escalated`, `demo_shown`,
`round_skipped`. Đổi code theo spec (A2), cập nhật `[code].vue:640` (`engine.on(...)`).

- Ca âm: leo thang L1 sang L2 phát đúng
  `scaffold_escalated { round_index, level, trigger, elapsed_ms }`.
- File: `packages/game-engine/src/core.ts`, `apps/web/app/pages/play/[code].vue`.

### T11 — Fallback thị giác nói được điều gì đó · M · phụ thuộc: T9

`triggerVisualFallbackCue` (`[code].vue:363`) chỉ nhấp nháy viền prompt pill 1,2 giây. Pill chứa
**chữ**; trẻ chưa biết đọc không nhận được gì. Cơ chế đúng theo spec — `triggerVisualFallback()`
đẩy thẳng lên L2 ghost hand — vẫn 0 call site production.

- `onFallbackCue` gọi `scaffolding.triggerVisualFallback(session.getHintTargetIndex())` rồi mới
  nhấp pill như tín hiệu phụ.
- Bịt hai call site còn câm: `GT-000/session.ts:221,255` (`speakPrompt` không cue) và
  `speakErrorPrompt` trong `use-play-audio.ts` — màn lỗi im hoàn toàn khi máy không có giọng vi.
- Ca âm: `hasVietnameseVoice() === false` → `triggerVisualFallback` gọi đúng 1 lần với index
  đúng, `scaffolding.level === 2`.
- Thủ công: máy không cài giọng Việt, chơi trọn 1 level chỉ bằng tín hiệu thị giác.
- File: `apps/web/app/pages/play/[code].vue`, `apps/web/app/composables/play/use-play-audio.ts`,
  `packages/game-engine/src/templates/GT-000/session.ts`,
  `packages/game-engine/tests/voice-fallback.test.ts` (mới).

### Checkpoint C — trẻ được chỉ đúng chỗ

Ngồi im qua ngưỡng thì vòng hổ phách nằm trên **đáp án đúng**, kiểm bằng test không phải bằng
mắt · máy không giọng Việt thì ghost hand chạy, không im lặng · event đúng tên spec ·
người đặt việc duyệt.

---

## 7. Giai đoạn 4 — Cổng phụ huynh đúng spec

### T12 — Rút state machine cổng ra module thuần · M · phụ thuộc: T1

Ba lỗi hiện tại đều vì state sống trong component:

1. `failedAttempts`/`lockUntil` là ref cục bộ, mà page dựng modal bằng `v-if="showParentGate"`
   (`[code].vue:218`) → bấm Huỷ là component destroy, khoá 60 giây bốc hơi. Vượt bằng một cú tap.
2. Không phát event nào trong ba event §7.3.
3. `parent_gate_trusted_until` được đọc **trước** khi biết `clientOnly`, rồi
   `emit("verified", "trusted_session")` — luồng đổi hồ sơ (`clientOnly=false`, route còn sống)
   nhận chuỗi giả thay vì `gate_token` thật.

- Tạo `apps/web/app/composables/play/parent-gate-state.ts`: hàm thuần + `sessionStorage`, giữ
  `failedAttempts` và `lockUntil`, khoá tách theo mode. Đường `clientOnly` Cấm — NEVER dùng chung
  khoá tin cậy với đường server.
- Sai 3 lần: theo spec §5 là **quay lại game** + khoá 60 giây, không phải giữ modal kèm cảnh báo
  chữ (`BR-PGT-03` — trẻ có thể là người đang thao tác).
- Phát `parent_gate_shown { trigger }`, `parent_gate_passed { attempts }`,
  `parent_gate_failed { attempts }`.
- Ca âm (env `node`): sai 3 lần → khoá; huỷ rồi mở lại → **vẫn** khoá.
- Ca âm: `clientOnly: false` + đã có trust của client → Cấm — NEVER short-circuit, vẫn đi
  challenge server.
- File: `apps/web/app/composables/play/parent-gate-state.ts` (mới),
  `apps/web/app/components/parent-gate-modal.vue`,
  `apps/web/tests/unit/parent-gate-state.test.ts` (mới).

---

## 8. Giai đoạn 5 — a11y đo được

### T13 — Dựng harness test DOM · S · phụ thuộc: T12

Repo hiện **không có** `@vue/test-utils` lẫn `jsdom`/`happy-dom`; mọi project vitest chạy env
`node`. Không có harness thì bốn ô a11y của #259 không thể có ca âm.

- Thêm `happy-dom` + `@vue/test-utils` vào `apps/web` devDependencies (A3); đặt
  `environment: "happy-dom"` cho riêng thư mục `tests/component/`.
- Test khói: mount `victory-modal.vue` với `stars=1` → đúng 1 sao; `stars=null` → 0 sao; DOM
  Cấm — NEVER chứa chuỗi `Điểm`. Ba ô này #259 khai đạt mà chưa từng tồn tại.
- File: `apps/web/package.json`, `apps/web/vitest.config.ts`,
  `apps/web/tests/component/victory-modal.test.ts` (mới), `pnpm-lock.yaml`.

### T14 — Lớp a11y thấy được và chơi được · M · phụ thuộc: T13

`[code].vue:157` dùng `class="sr-only"` trần:

- Không `focus:not-sr-only` → người dùng bàn phím **không thấy** focus ring (`BR-A11-05`).
- `aria-label` nội suy `entity.id` — đọc ra id nội bộ, không phải nhãn có nghĩa.
- `aria-live="polite"` bọc cả danh sách button → mỗi `syncView()` đọc lại toàn bộ danh sách.
- `handleAccessibleEntityTap` chỉ dispatch `{ type: "tap" }` → template kéo-thả (GT-008 …)
  **không chơi được bằng bàn phím**, mâu thuẫn ô "chơi trọn 1 level chỉ bằng Tab/Enter".

Việc cần làm:

- Nhãn lấy từ nội dung `ViewEntity` (glyph/label). Cấm — NEVER dùng id.
- `focus:not-sr-only` + focus ring offset ≥2px; bỏ `aria-live` khỏi container, đưa vào một vùng
  thông báo riêng.
- Bàn phím hai bước cho kéo-thả: Enter chọn nguồn, Enter trên đích phát `drop`.
- Ca âm: dispatch `drop` bằng bàn phím trên GT-008 → round thắng.
- File: `apps/web/app/pages/play/[code].vue`, `apps/web/app/composables/play/use-play-gesture.ts`,
  `apps/web/tests/component/play-a11y.test.ts` (mới).

### T15 — Focus trap và Escape cho hai modal · S · phụ thuộc: T13

Cả `victory-modal.vue` lẫn `parent-gate-modal.vue` khai `role="dialog"` + `aria-modal="true"`
nhưng không trap focus, không autofocus, không xử lý Escape (`BR-A11-12`, #259 khai đạt).

- Composable dùng chung `useFocusTrap()`; trả focus về phần tử gọi khi đóng.
- Ca âm: Tab vòng trong modal Cấm — NEVER thoát ra nền; Escape đóng và trả focus.
- File: `apps/web/app/composables/use-focus-trap.ts` (mới), hai modal,
  `apps/web/tests/component/modal-focus-trap.test.ts` (mới).

### Checkpoint D — a11y đạt

Chơi trọn 1 level bằng bàn phím, gồm **một** template kéo-thả · focus ring nhìn thấy được ở mọi
phần tử tương tác · trap focus và Escape ở cả hai modal · người đặt việc duyệt.

---

## 9. Giai đoạn 6 — Hợp đồng và vệ sinh

### T16 — GT-000 có `commit`, page bỏ ba lối tắt · S · phụ thuộc: T14

`dispatch()` dùng `this.commit?.(action)` nên GT-000 thiếu `commit` thì im lặng không làm gì — đó
là lý do `[code].vue:433,441,449` còn gọi thẳng `validateAction`. T13 của #259 khai 37/37; thực
tế vẫn **36/37**.

- Cài `commit` cho GT-000; ba handler intro đi qua `dispatch()`.
- Bỏ duck-typing còn lại ở `use-play-gesture.ts:66-78` — `typeof session.dispatch !== "function"`
  rồi return im lặng. Siết kiểu: thiếu `dispatch` là lỗi lập trình, không phải nhánh runtime.
- Ca âm: harness 37/37 template, mỗi template 1 gesture đúng và 1 gesture sai.
- File: `packages/game-engine/src/templates/GT-000/session.ts`, `apps/web/app/pages/play/[code].vue`,
  `apps/web/app/composables/play/use-play-gesture.ts`,
  `packages/game-engine/tests/all-templates-interactive-harness.test.ts`.

### T17 — `hasVietnameseVoice()` thôi quét lại mỗi lần gọi · XS · phụ thuộc: T11

`speech-synthesis-adapter.ts:64` đổi thành `if (!(isInitialized && isVoiceAvailable)) initVoices()`.
Không có giọng vi thì `isVoiceAvailable` false vĩnh viễn → **mọi** lần gọi chạy lại `initVoices()`:
quét `getVoices()` và gán đè `onvoiceschanged`. `speak()` gọi hàm này mỗi câu. Đúng máy mà task
này nhắm tới thì thành vòng lặp nóng.

- Probe lại theo sự kiện `voiceschanged`, gán handler **một lần**, không probe theo lời gọi.
- Ca âm: gọi `hasVietnameseVoice()` 100 lần khi không có giọng → `getVoices()` gọi ≤2 lần.
- File: `packages/game-engine/src/systems/speech-synthesis-adapter.ts` và test tương ứng.

### T18 — Preload kêu khi hỏng, dọn timer · XS · phụ thuộc: không

`use-play-audio.ts:88,101`: `onerror` chỉ `resolve()`, không `console.warn` như #259 khai.
`overallTimeout` 5 giây không bao giờ `clearTimeout`.

- Thêm `console.warn` kèm URL; `clearTimeout` sau khi race xong.
- Ca âm: asset không bao giờ resolve → vào game trong ≤5s **và** có đúng 1 dòng warn.
- File: `apps/web/app/composables/play/use-play-audio.ts`,
  `apps/web/tests/unit/preload-assets.test.ts` (mới).

### T19 — Dọn bí danh và bụi · XS · phụ thuộc: T16

- `scaffolding.ts:271-277`: `onMatch` là `onSuccess`, `reset` là `resetOnSuccess` — 4 tên cho 2
  hành vi. Bỏ bí danh, sửa call site ở `use-play-gesture.ts:85` và `[code].vue:430`.
- `render-system.ts` `drawParticles`: reduced-motion dùng `i += 2` nên **cùng những hạt** đó
  không bao giờ vẽ. Đổi sang giảm số hạt lúc sinh. Giá trị trả về hiện không ai đọc — hoặc dùng
  trong ca âm reduced-motion, hoặc bỏ.
- File: `packages/game-engine/src/systems/scaffolding.ts`, `src/systems/render-system.ts`,
  `apps/web/app/composables/play/use-play-gesture.ts`, `apps/web/app/pages/play/[code].vue`.

### T20 — Thu `[code].vue` về ≤600 dòng · S · phụ thuộc: T19

Hiện **785** dòng. Bản commit `3404b93c` là 1.304 dòng với 14 theme CSS inline; việc tách sang
`assets/css/play-surface.css` nằm ở phần chưa commit. #259 khai ≤600.

- Rút nốt vòng đời phiên (`fetchAndStartGame`, `startRounds`, `completeSessionOnFinish`) sang
  `use-play-session.ts`.
- Hành vi Cấm — NEVER đổi; chạy lại kịch bản Checkpoint B và D.
- File: `apps/web/app/composables/play/use-play-session.ts` (mới), `apps/web/app/pages/play/[code].vue`.

### Checkpoint E — hoàn tất

`pnpm check` exit 0 với service đầy đủ, ratchet test giảm so với nền và Cấm — NEVER tăng ·
ratchet không gian logic = 0 · ratchet hint-target = 0 · engine `FAIL 0` và số test **tăng** so
với 1312 · `[code].vue` ≤600 dòng · `commit` 37/37 · người đặt việc duyệt.

---

## 10. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| T2 phơi ra hàng chục file đỏ sẵn, làm các giai đoạn sau tưởng như bị chặn | Cao | Ratchet chốt nợ nền, chỉ chặn file đỏ **mới**. Cấm — NEVER sửa nợ cũ trong task này. |
| T8 sửa 32 template gây hồi quy bố cục mà test engine không thấy | Cao | Chia ba lô; `qa:capture` đối chiếu ảnh khung dọc sau **mỗi** lô, không dồn cuối. |
| T9 đổi hợp đồng `TemplateGameSession` chạm cả 37 template | Trung bình | Mặc định `null` an toàn là không vẽ gợi ý; ratchet đốt nợ dần thay vì đổi một lượt. |
| T13 thêm dep DOM làm chậm CI hoặc lệch với môi trường Nuxt thật | Trung bình | Chỉ bật `happy-dom` cho `tests/component/`; phần lớn logic đã rút ra module env `node` ở T4 và T12. |
| `globalSetup` deadlock khi chạy chung 17 project làm T2 flaky | Trung bình | Yêu cầu "chạy hai lần liên tiếp giống nhau" nằm ngay trong tiêu chí T2. |
| Hook rtk bóp méo output cổng làm hiểu sai kết quả | Trung bình | Mọi lần đo cổng gọi qua `rtk proxy`; `pnpm lint` phải chạy `biome`, không phải `eslint`. |

---

## 11. Câu hỏi

- **Q1** (không chặn): `/complete` fail có nên để lại dấu vết cho phụ huynh ngoài `console.error`
  không? A4 tạm chốt là không. Nếu có thì đó là task riêng ở bề mặt `/me/**`.
- **Q2** (không chặn): trong 32 template ở T8 có template nào bố cục thật sự cần tỉ lệ 16:9 cố
  định không? Nếu có, ghi thành ngoại lệ có tên trong baseline thay vì ép migrate.
- **Q3** (kế thừa #259, không chặn): 0/444 level có `instruction_audio_path` — thu âm corpus là
  chương trình nội dung riêng.

---

## 12. Kiểm chứng đầu-cuối

```bash
export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"   # node PATH là v20, vitest sẽ lỗi
docker compose up -d                                        # T2 cần service thật

rtk proxy pnpm exec biome check .                    # pnpm lint bị hook đổi thành eslint
rtk proxy node scripts/typecheck/typecheck-gate.ts   # kỳ vọng 10/10 baseline 0
rtk proxy pnpm check                                 # exit 0 — và exit khác 0 khi service down
npx vitest run --project=@mindkid/game-engine        # FAIL 0, số test lớn hơn 1312
rtk proxy pnpm exec tsx scripts/check-logic-space.ts # 0
rtk proxy pnpm exec tsx scripts/qa/capture-engines.ts # đối chiếu ảnh 390x844
```

Thủ công, tài khoản `parent.free@mindkid.test`:

1. Chơi hết 1 level → `play_sessions` chuyển `completed`, `starsEarned > 0`, telemetry có hàng.
2. Ngắt mạng giữa chừng → vẫn ăn mừng, `console.error` có dòng, lời khen là `nice_try` không sao.
3. DevTools iPhone 12 Pro: chơi GT-001 và một template kéo-thả, xoay ngang-dọc giữa vòng, chạm
   vẫn trúng.
4. Máy không cài giọng Việt: ngồi im qua ngưỡng → ghost hand chạy trên **đáp án đúng**.
5. Tap nhanh nút khoá 5 lần → không mở. Long-press 800ms → mở. Sai 3 lần → về game và khoá.
   Bấm Huỷ rồi mở lại → **vẫn** khoá.
6. Chỉ dùng bàn phím: Tab/Enter chơi trọn 1 level; Escape đóng modal và trả focus.
