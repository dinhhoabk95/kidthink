# Task #260 Todo: Đóng thật các đường tối của bề mặt chơi

> Plan: [`260-play-surface-close-for-real-plan.md`](260-play-surface-close-for-real-plan.md)
>
> **Trước mọi lệnh test**: `export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"`
> (node PATH là v20.17.0, vitest sẽ lỗi `ERR_UNKNOWN_FILE_EXTENSION`).
> **Mọi lần đo cổng gọi qua `rtk proxy`** — hook rtk đổi `pnpm lint` thành `eslint` và lọc mất
> dòng lỗi của biome.
> Mốc hiện tại: `packages/game-engine` PASS 1312 / FAIL 0 — đây là con số **trước** #259,
> nên số test phải **tăng** khi #260 xong.
>
> **Luật ô tick**: Cấm — NEVER tick một ô "ca âm" nếu chưa chạy thử gỡ bản vá và thấy nó đỏ.

---

## Giai đoạn 0 — Cổng biết đỏ

- [x] **T0 — Commit phần việc #259 còn treo** · XS · phụ thuộc: không
  - [x] `[code].vue`, `parent-gate-modal.vue`, `use-play-gesture.ts` đang `M`; `assets/css/play-surface.css`, `use-play-audio.ts` đang `??`
  - [x] Commit riêng, Cấm — NEVER trộn vào commit của #260 (commit `bc44313a`)
  - [x] Cấm — NEVER revert `3404b93c`

- [x] **T1 — Bỏ đường tụt hạng im lặng của `check.sh`** · S · phụ thuộc: T0
  - [x] Chế độ đầy đủ + service thiếu → exit khác 0, in đúng lệnh `docker compose up -d`
  - [x] `--fast` → exit 0, in rõ tập test đã chạy là tập con
  - [x] **Ca âm**: `pnpm services; echo $?` = 1 → `bash scripts/check.sh; echo $?` khác 0

- [x] **T2 — Ratchet test toàn repo** · M · phụ thuộc: T1
  - [x] `docker compose up -d`, chạy `vitest run` **không** `--bail`, chốt file đỏ vào `scripts/test-baseline.json`
  - [x] `scripts/check-test-ratchet.ts` + script `check:test-ratchet`; nợ chỉ được giảm
  - [x] Gắn vào Phase 3 của `check.sh`, bỏ `--bail 1`
  - [x] **Ca âm**: làm đỏ một test đang xanh → `pnpm check` exit khác 0, nêu đúng tên file
  - [x] **Ca âm**: chạy hai lần liên tiếp cho kết quả giống nhau (không flaky)

- [x] **T3 — Hoàn nguyên độ chính xác `render-viewport.test.ts`** · XS · phụ thuộc: không
  - [x] `toBeCloseTo(1, 5)`, `toBeCloseTo(0, 5)`, `toBeGreaterThan(0)`
  - [x] Đỏ thì sửa `deriveLogicSpace`/`setupCanvas` — Cấm — NEVER nới lại ngưỡng

### Checkpoint A — cổng có răng
- [x] `pnpm services` exit 1 → `pnpm check` exit khác 0
- [x] `docker compose up -d` → `pnpm check` exit 0, ratchet in đúng số file đỏ nền
- [x] Làm đỏ một test bất kỳ → cổng đỏ, nêu đúng tên file
- [x] `render-viewport` về ngưỡng 5/5; engine PASS ≥1312 / FAIL 0
- [x] **Người đặt việc duyệt** (User đã duyệt plan)

---

## Giai đoạn 1 — Đường điểm hết câm

- [ ] **T4 — Mọi lỗi phiên chơi đều kêu** · S · phụ thuộc: T1
  - [ ] `finishSession` trả `{ ok: true, data } | { ok: false, error }`, bỏ `null`
  - [ ] Mọi catch `console.error` kèm `session_uuid` + endpoint + status
  - [ ] Sửa 4 chỗ nuốt lỗi: `use-play-telemetry.ts:61-66`, `[code].vue:466`, `:496-498`, `:617`
  - [ ] Lỗi mạng Cấm — NEVER chặn ăn mừng
  - [ ] **Ca âm**: mock `useApi` ném 403 → trả `ok: false`, `console.error` đúng 1 lần, Cấm — NEVER ném ra ngoài

- [ ] **T5 — Modal Cấm — NEVER khen `great` khi không có dữ liệu** · XS · phụ thuộc: T4
  - [ ] `/complete` fail → `celebration = "nice_try"`, `stars = null`
  - [ ] Prop `celebration` siết về union `"great" | "good" | "nice_try"`, dùng chung với composable
  - [ ] **Ca âm**: `finishSession` trả `ok: false` → modal Cấm — NEVER hiện "Bé Giỏi Quá!"

---

## Giai đoạn 2 — Không gian logic chạy thật

- [ ] **T6 — Nối `logicSpace` từ page xuống RoundRunner** · S · phụ thuộc: T3
  - [ ] `[code].vue:576` truyền `viewport.logicSpace` vào `RoundRunnerOptions`
  - [ ] `handleResize` (`[code].vue:706`) gọi `setLogicSpace()` + `resolveSlots(band)` lại, debounce ~150ms
  - [ ] **Ca âm**: RoundRunner không gian dọc, chạy sang **vòng 2** → `session.logicSpace` khác `DEFAULT_LOGIC_SPACE`
  - [ ] Test một-vòng Cấm — NEVER được coi là đủ cho lớp lỗi này

- [ ] **T7 — Ratchet đo đúng thứ cần đo** · S · phụ thuộc: T6
  - [ ] `scripts/check-logic-space.ts` đếm `computeSlots` **không** truyền `logic: this.logicSpace`
  - [ ] Nợ nền = 32; Cấm — NEVER đếm import tĩnh (phép đo đó cho 0 giả)
  - [ ] Gắn vào `check.sh` + `package.json`
  - [ ] **Ca âm**: gỡ `logic:` khỏi GT-001 → cổng đỏ

- [ ] **T8 — Đốt nợ 32 template về 0** · L cơ học · phụ thuộc: T7
  - [ ] Lô 1: GT-000, GT-003..GT-007, GT-009..GT-011
  - [ ] Lô 2: GT-013..GT-017, GT-019..GT-023
  - [ ] Lô 3: GT-024..GT-033
  - [ ] GT-034/035/036 xử lý riêng (không đi qua `resolveLayout`; GT-036 còn 3 số 960/540 cứng)
  - [ ] `qa:capture` đối chiếu ảnh 390x844 sau **mỗi** lô, Cấm — NEVER dồn cuối
  - [ ] Ratchet về **0**

### Checkpoint B — chơi được trên điện thoại
- [ ] Ratchet không gian logic = 0
- [ ] Ở 390x844: sàn chạm band 3-4 ≥ 76 CSS px, **đo bằng test**
- [ ] Không tràn ngang ở 360 / 390 / 414 px
- [ ] Xoay ngang-dọc giữa vòng chơi: chạm vẫn trúng ô đang thấy
- [ ] `pnpm check` exit 0 với service đầy đủ
- [ ] **Người đặt việc duyệt**

---

## Giai đoạn 3 — Scaffolding chỉ đúng ô

- [ ] **T9 — Hợp đồng "ô cần chỉ" trên `TemplateGameSession`** · M · phụ thuộc: T8
  - [ ] Thêm `getHintTargetIndex(): number | null`, mặc định `null`
  - [ ] `core.tickScaffolding` gọi `tickStateless(delta, state, band, session.getHintTargetIndex())`
  - [ ] **Xoá hẳn** `setFocusIndex(0)` trong `core.ts`
  - [ ] `null` → Cấm — NEVER vẽ vòng hổ phách (thà không gợi ý còn hơn gợi ý sai)
  - [ ] Cài `getHintTargetIndex` cho 37 template; ratchet đếm template còn trả `null`
  - [ ] **Ca âm**: đáp án ở index 3 → sau ngưỡng L1 band 3-4, `engine.focusIndex === 3`
  - [ ] **Ca âm**: session trả `null` → `renderScaffoldingAura` không vẽ gì

- [ ] **T10 — Tên event theo spec** · XS · phụ thuộc: T9
  - [ ] `hint_escalated` → `scaffold_escalated`; `skip_suggested` → `round_skipped`; thêm `demo_shown`
  - [ ] Cập nhật `[code].vue:640` (`engine.on(...)`)
  - [ ] **Ca âm**: leo thang L1 sang L2 phát `scaffold_escalated { round_index, level, trigger, elapsed_ms }`

- [ ] **T11 — Fallback thị giác nói được điều gì đó** · M · phụ thuộc: T9
  - [ ] `onFallbackCue` gọi `scaffolding.triggerVisualFallback(session.getHintTargetIndex())`
  - [ ] Nhấp pill chỉ còn là tín hiệu phụ, Cấm — NEVER là tín hiệu duy nhất (trẻ chưa đọc được chữ trong pill)
  - [ ] Bịt `GT-000/session.ts:221,255` — `speakPrompt` hiện không có cue
  - [ ] Bịt `speakErrorPrompt` trong `use-play-audio.ts` — màn lỗi hiện im hoàn toàn khi thiếu giọng vi
  - [ ] **Ca âm**: `hasVietnameseVoice() === false` → `triggerVisualFallback` gọi đúng 1 lần, index đúng, `level === 2`
  - [ ] Thủ công: máy không cài giọng Việt, chơi trọn 1 level chỉ bằng tín hiệu thị giác

### Checkpoint C — trẻ được chỉ đúng chỗ
- [ ] Ngồi im qua ngưỡng: vòng hổ phách nằm trên **đáp án đúng**, kiểm bằng test không phải bằng mắt
- [ ] Máy không giọng Việt: ghost hand chạy, không im lặng
- [ ] Event đúng tên spec §7.3
- [ ] **Người đặt việc duyệt**

---

## Giai đoạn 4 — Cổng phụ huynh đúng spec

- [ ] **T12 — Rút state machine cổng ra module thuần** · M · phụ thuộc: T1
  - [ ] `parent-gate-state.ts`: `failedAttempts` + `lockUntil` sống ở `sessionStorage`, không ở ref component
  - [ ] Khoá tách theo mode — đường `clientOnly` Cấm — NEVER dùng chung khoá tin cậy với đường server
  - [ ] Sai 3 lần → **quay lại game** + khoá 60 giây (spec §5), Cấm — NEVER giữ modal kèm cảnh báo chữ (`BR-PGT-03`)
  - [ ] Phát `parent_gate_shown { trigger }` / `parent_gate_passed { attempts }` / `parent_gate_failed { attempts }`
  - [ ] **Ca âm**: sai 3 lần → khoá; bấm Huỷ rồi mở lại → **vẫn** khoá
  - [ ] **Ca âm**: `clientOnly: false` + trust của client đã có → Cấm — NEVER short-circuit, vẫn đi challenge server
  - [ ] `apps/web/tests/api/parent-gate-routes.test.ts` giữ xanh

---

## Giai đoạn 5 — a11y đo được

- [ ] **T13 — Dựng harness test DOM** · S · phụ thuộc: T12
  - [ ] Thêm `happy-dom` + `@vue/test-utils` vào `apps/web` devDependencies
  - [ ] `environment: "happy-dom"` chỉ cho `tests/component/`
  - [ ] Test khói: `stars=1` → 1 sao; `stars=null` → 0 sao; DOM Cấm — NEVER chứa chuỗi `Điểm`
  - [ ] Review diff `pnpm-lock.yaml`, Cấm — NEVER sửa tay lockfile

- [ ] **T14 — Lớp a11y thấy được và chơi được** · M · phụ thuộc: T13
  - [ ] Nhãn lấy từ nội dung `ViewEntity`, Cấm — NEVER dùng `entity.id`
  - [ ] `focus:not-sr-only` + focus ring offset ≥2px (`BR-A11-05`)
  - [ ] Bỏ `aria-live` khỏi container button, đưa vào vùng thông báo riêng
  - [ ] Bàn phím hai bước cho kéo-thả: Enter chọn nguồn, Enter trên đích phát `drop`
  - [ ] **Ca âm**: dispatch `drop` bằng bàn phím trên GT-008 → round thắng
  - [ ] Tab order khớp thị giác (`BR-A11-13`)

- [ ] **T15 — Focus trap và Escape cho hai modal** · S · phụ thuộc: T13
  - [ ] `useFocusTrap()` dùng chung, trả focus về phần tử gọi khi đóng (`BR-A11-12`)
  - [ ] **Ca âm**: Tab vòng trong modal Cấm — NEVER thoát ra nền
  - [ ] **Ca âm**: Escape đóng và trả focus

### Checkpoint D — a11y đạt
- [ ] Chơi trọn 1 level bằng bàn phím, gồm **một** template kéo-thả
- [ ] Focus ring nhìn thấy được ở mọi phần tử tương tác
- [ ] Trap focus và Escape ở cả hai modal
- [ ] **Người đặt việc duyệt**

---

## Giai đoạn 6 — Hợp đồng và vệ sinh

- [ ] **T16 — GT-000 có `commit`, page bỏ ba lối tắt** · S · phụ thuộc: T14
  - [ ] Cài `commit` cho GT-000 → `commit` 37/37
  - [ ] `[code].vue:433,441,449` đi qua `dispatch()`, bỏ `validateAction` trực tiếp
  - [ ] Bỏ duck-typing ở `use-play-gesture.ts:66-78` — siết kiểu, Cấm — NEVER return im lặng
  - [ ] **Ca âm**: harness 37/37 template, mỗi template 1 gesture đúng + 1 gesture sai

- [ ] **T17 — `hasVietnameseVoice()` thôi quét lại mỗi lần gọi** · XS · phụ thuộc: T11
  - [ ] Probe lại theo sự kiện `voiceschanged`, gán handler **một lần**
  - [ ] Cấm — NEVER gọi `initVoices()` trong thân `hasVietnameseVoice()`
  - [ ] **Ca âm**: gọi 100 lần khi không có giọng → `getVoices()` gọi ≤2 lần

- [ ] **T18 — Preload kêu khi hỏng, dọn timer** · XS · phụ thuộc: không
  - [ ] `console.warn` kèm URL ở cả `img.onerror` và `aud.onerror`
  - [ ] `clearTimeout(overallTimeout)` sau khi race xong
  - [ ] **Ca âm**: asset không bao giờ resolve → vào game trong ≤5s **và** có đúng 1 dòng warn

- [ ] **T19 — Dọn bí danh và bụi** · XS · phụ thuộc: T16
  - [ ] Bỏ `onMatch`/`reset` (bí danh của `onSuccess`/`resetOnSuccess`), sửa `use-play-gesture.ts:85` và `[code].vue:430`
  - [ ] `drawParticles` giảm số hạt lúc sinh, Cấm — NEVER dùng `i += 2` (cùng những hạt đó không bao giờ vẽ)
  - [ ] Giá trị trả về của `drawParticles`: dùng trong ca âm reduced-motion, hoặc bỏ

- [ ] **T20 — Thu `[code].vue` về ≤600 dòng** · S · phụ thuộc: T19
  - [ ] Rút `fetchAndStartGame` / `startRounds` / `completeSessionOnFinish` sang `use-play-session.ts`
  - [ ] `[code].vue` ≤600 dòng (hiện 785), mỗi module ≤400 dòng
  - [ ] Hành vi Cấm — NEVER đổi; chạy lại kịch bản Checkpoint B và D

### Checkpoint E — hoàn tất
- [ ] `pnpm check` exit 0 với service đầy đủ; ratchet test giảm so với nền, Cấm — NEVER tăng
- [ ] Ratchet không gian logic = 0; ratchet hint-target = 0
- [ ] Engine FAIL 0 và số test **tăng** so với 1312
- [ ] `[code].vue` ≤600 dòng; `commit` 37/37
- [ ] **Người đặt việc duyệt**

---

## Câu hỏi — trạng thái

- [ ] **Q1** (không chặn): `/complete` fail có để lại dấu vết cho phụ huynh ngoài `console.error` không? A4 tạm chốt là không.
- [ ] **Q2** (không chặn): trong 32 template ở T8 có cái nào thật sự cần tỉ lệ 16:9 cố định không? Có thì ghi thành ngoại lệ có tên trong baseline.
- [ ] **Q3** (kế thừa #259, không chặn): 0/444 level có `instruction_audio_path` — thu âm corpus là chương trình nội dung riêng.
