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

- [x] **T4 — Mọi lỗi phiên chơi đều kêu** · S · phụ thuộc: T1
  - [x] `finishSession` trả `{ ok: true, data } | { ok: false, error }`, bỏ `null`
  - [x] Mọi catch `console.error` kèm `session_uuid` + endpoint + status
  - [x] Sửa 4 chỗ nuốt lỗi: `use-play-telemetry.ts:61-66`, `[code].vue:466`, `:496-498`, `:617`
  - [x] Lỗi mạng Cấm — NEVER chặn ăn mừng
  - [x] **Ca âm**: mock `useApi` ném 403 → trả `ok: false`, `console.error` đúng 1 lần, Cấm — NEVER ném ra ngoài

- [x] **T5 — Modal Cấm — NEVER khen `great` khi không có dữ liệu** · XS · phụ thuộc: T4
  - [x] `/complete` fail → `celebration = "nice_try"`, `stars = null`
  - [x] Prop `celebration` siết về union `"great" | "good" | "nice_try"`, dùng chung với composable
  - [x] **Ca âm**: `finishSession` trả `ok: false` → modal Cấm — NEVER hiện "Bé Giỏi Quá!"

---

## Giai đoạn 2 — Không gian logic chạy thật

- [x] **T6 — Nối `logicSpace` từ page xuống RoundRunner** · S · phụ thuộc: T3
  - [x] `[code].vue:576` truyền `viewport.logicSpace` vào `RoundRunnerOptions`
  - [x] `handleResize` (`[code].vue:706`) gọi `setLogicSpace()` + `resolveSlots(band)` lại, debounce ~150ms
  - [x] **Ca âm**: RoundRunner không gian dọc, chạy sang **vòng 2** → `session.logicSpace` khác `DEFAULT_LOGIC_SPACE`
  - [x] Test một-vòng Cấm — NEVER được coi là đủ cho lớp lỗi này

- [x] **T7 — Ratchet đo đúng thứ cần đo** · S · phụ thuộc: T6
  - [x] `scripts/check-logic-space.ts` đếm `computeSlots` **không** truyền `logic: this.logicSpace`
  - [x] Nợ nền = 32; Cấm — NEVER đếm import tĩnh (phép đo đó cho 0 giả)
  - [x] Gắn vào `check.sh` + `package.json`
  - [x] **Ca âm**: gỡ `logic:` khỏi GT-001 → cổng đỏ

- [x] **T8 — Đốt nợ 32 template về 0** · L cơ học · phụ thuộc: T7
  - [x] Lô 1: GT-000, GT-003..GT-007, GT-009..GT-011
  - [x] Lô 2: GT-013..GT-017, GT-019..GT-023
  - [x] Lô 3: GT-024..GT-033
  - [x] GT-034/035/036 xử lý riêng (không đi qua `resolveLayout`; GT-036 còn 3 số 960/540 cứng)
  - [x] `qa:capture` đối chiếu ảnh 390x844 sau **mỗi** lô, Cấm — NEVER dồn cuối
  - [x] Ratchet về **0**

### Checkpoint B — chơi được trên điện thoại
- [x] Ratchet không gian logic = 0
- [x] Ở 390x844: sàn chạm band 3-4 ≥ 76 CSS px, **đo bằng test**
- [x] Không tràn ngang ở 360 / 390 / 414 px
- [x] Xoay ngang-dọc giữa vòng chơi: chạm vẫn trúng ô đang thấy
- [x] `pnpm check` exit 0 với service đầy đủ
- [x] **Người đặt việc duyệt**

---

## Giai đoạn 3 — Scaffolding chỉ đúng ô

- [x] **T9 — Hợp đồng "ô cần chỉ" trên `TemplateGameSession`** · M · phụ thuộc: T8
  - [x] Thêm `getHintTargetIndex(): number | null`, mặc định `null`
  - [x] `core.tickScaffolding` gọi `tickStateless(delta, state, band, session.getHintTargetIndex())`
  - [x] **Xoá hẳn** `setFocusIndex(0)` trong `core.ts`
  - [x] `null` → Cấm — NEVER vẽ vòng hổ phách (thà không gợi ý còn hơn gợi ý sai)
  - [x] Cài `getHintTargetIndex` cho 37 template; ratchet đếm template còn trả `null`
  - [x] **Ca âm**: đáp án ở index 3 → sau ngưỡng L1 band 3-4, `engine.focusIndex === 3`
  - [x] **Ca âm**: session trả `null` → `renderScaffoldingAura` không vẽ gì

- [x] **T10 — Tên event theo spec** · XS · phụ thuộc: T9
  - [x] `hint_escalated` → `scaffold_escalated`; `skip_suggested` → `round_skipped`; thêm `demo_shown`
  - [x] Cập nhật `[code].vue:640` (`engine.on(...)`)
  - [x] **Ca âm**: leo thang L1 sang L2 phát `scaffold_escalated { round_index, level, trigger, elapsed_ms }`

- [x] **T11 — Fallback thị giác nói được điều gì đó** · M · phụ thuộc: T9
  - [x] `onFallbackCue` gọi `scaffolding.triggerVisualFallback(session.getHintTargetIndex())`
  - [x] Nhấp pill chỉ còn là tín hiệu phụ, Cấm — NEVER là tín hiệu duy nhất (trẻ chưa đọc được chữ trong pill)
  - [x] Bịt `GT-000/session.ts:221,255` — `speakPrompt` hiện không có cue
  - [x] Bịt `speakErrorPrompt` trong `use-play-audio.ts` — màn lỗi hiện im hoàn toàn khi thiếu giọng vi
  - [x] **Ca âm**: `hasVietnameseVoice() === false` → `triggerVisualFallback` gọi đúng 1 lần, index đúng, `level === 2`
  - [x] Thủ công: máy không cài giọng Việt, chơi trọn 1 level chỉ bằng tín hiệu thị giác

### Checkpoint C — trẻ được chỉ đúng chỗ
- [x] Ngồi im qua ngưỡng: vòng hổ phách nằm trên **đáp án đúng**, kiểm bằng test không phải bằng mắt
- [x] Máy không giọng Việt: ghost hand chạy, không im lặng
- [x] Event đúng tên spec §7.3
- [x] **Người đặt việc duyệt**

---

## Giai đoạn 4 — Cổng phụ huynh đúng spec

- [x] **T12 — Rút state machine cổng ra module thuần** · M · phụ thuộc: T1
  - [x] `parent-gate-state.ts`: `failedAttempts` + `lockUntil` sống ở `sessionStorage`, không ở ref component
  - [x] Khoá tách theo mode — đường `clientOnly` Cấm — NEVER dùng chung khoá tin cậy với đường server
  - [x] Sai 3 lần → **quay lại game** + khoá 60 giây (spec §5), Cấm — NEVER giữ modal kèm cảnh báo chữ (`BR-PGT-03`)
  - [x] Phát `parent_gate_shown { trigger }` / `parent_gate_passed { attempts }` / `parent_gate_failed { attempts }`
  - [x] **Ca âm**: sai 3 lần → khoá; bấm Huỷ rồi mở lại → **vẫn** khoá
  - [x] **Ca âm**: `clientOnly: false` + trust của client đã có → Cấm — NEVER short-circuit, vẫn đi challenge server
  - [x] `apps/web/tests/api/parent-gate-routes.test.ts` giữ xanh

---

## Giai đoạn 5 — a11y đo được

- [x] **T13 — Dựng harness test DOM** · S · phụ thuộc: T12
  - [x] Thêm `happy-dom` + `@vue/test-utils` vào `apps/web` devDependencies
  - [x] `environment: "happy-dom"` chỉ cho `tests/component/`
  - [x] Test khói: `stars=1` → 1 sao; `stars=null` → 0 sao; DOM Cấm — NEVER chứa chuỗi `Điểm`
  - [x] Review diff `pnpm-lock.yaml`, Cấm — NEVER sửa tay lockfile

- [x] **T14 — Lớp a11y thấy được và chơi được** · M · phụ thuộc: T13
  - [x] Nhãn lấy từ nội dung `ViewEntity`, Cấm — NEVER dùng `entity.id`
  - [x] `focus:not-sr-only` + focus ring offset ≥2px (`BR-A11-05`)
  - [x] Bỏ `aria-live` khỏi container button, đưa vào vùng thông báo riêng
  - [x] Bàn phím hai bước cho kéo-thả: Enter chọn nguồn, Enter trên đích phát `drop`
  - [x] **Ca âm**: dispatch `drop` bằng bàn phím trên GT-008 → round thắng
  - [x] Tab order khớp thị giác (`BR-A11-13`)

- [x] **T15 — Focus trap và Escape cho hai modal** · S · phụ thuộc: T13
  - [x] `useFocusTrap()` dùng chung, trả focus về phần tử gọi khi đóng (`BR-A11-12`)
  - [x] **Ca âm**: Tab vòng trong modal Cấm — NEVER thoát ra nền
  - [x] **Ca âm**: Escape đóng và trả focus

### Checkpoint D — a11y đạt
- [x] Chơi trọn 1 level bằng bàn phím, gồm **một** template kéo-thả
- [x] Focus ring nhìn thấy được ở mọi phần tử tương tác
- [x] Trap focus và Escape ở cả hai modal
- [x] **Người đặt việc duyệt**

---

## Giai đoạn 6 — Hợp đồng và vệ sinh

- [x] **T16 — GT-000 có `commit`, page bỏ ba lối tắt** · S · phụ thuộc: T14
  - [x] Cài `commit` cho GT-000 → `commit` 37/37
  - [x] `[code].vue:433,441,449` đi qua `dispatch()`, bỏ `validateAction` trực tiếp
  - [x] Bỏ duck-typing ở `use-play-gesture.ts:66-78` — siết kiểu, Cấm — NEVER return im lặng
  - [x] **Ca âm**: harness 37/37 template, mỗi template 1 gesture đúng + 1 gesture sai

- [x] **T17 — `hasVietnameseVoice()` thôi quét lại mỗi lần gọi** · XS · phụ thuộc: T11
  - [x] Probe lại theo sự kiện `voiceschanged`, gán handler **một lần**
  - [x] Cấm — NEVER gọi `initVoices()` trong thân `hasVietnameseVoice()`
  - [x] **Ca âm**: gọi 100 lần khi không có giọng → `getVoices()` gọi ≤2 lần

- [x] **T18 — Preload kêu khi hỏng, dọn timer** · XS · phụ thuộc: không
  - [x] `console.warn` kèm URL ở cả `img.onerror` và `aud.onerror`
  - [x] `clearTimeout(overallTimeout)` sau khi race xong
  - [x] **Ca âm**: asset không bao giờ resolve → vào game trong ≤5s **và** có đúng 1 dòng warn

- [x] **T19 — Dọn bí danh và bụi** · XS · phụ thuộc: T16
  - [x] Bỏ `onMatch`/`reset` (bí danh của `onSuccess`/`resetOnSuccess`), sửa `use-play-gesture.ts:85` và `[code].vue:430`
  - [x] `drawParticles` giảm số hạt lúc sinh, Cấm — NEVER dùng `i += 2` (cùng những hạt đó không bao giờ vẽ)
  - [x] Giá trị trả về của `drawParticles`: dùng trong ca âm reduced-motion, hoặc bỏ

- [x] **T20 — Thu `[code].vue` về ≤600 dòng** · S · phụ thuộc: T19
  - [x] Rút `fetchAndStartGame` / `startRounds` / `completeSessionOnFinish` sang `use-play-session.ts`
  - [x] `[code].vue` ≤600 dòng (hiện 559 dòng), mỗi module ≤400 dòng
  - [x] Hành vi Cấm — NEVER đổi; chạy lại kịch bản Checkpoint B và D

### Checkpoint E — hoàn tất
- [x] `pnpm check` exit 0 với service đầy đủ; ratchet test giảm so với nền, Cấm — NEVER tăng
- [x] Ratchet không gian logic = 0; ratchet hint-target = 0
- [x] Engine FAIL 0 và số test **tăng** so với 1312
- [x] `[code].vue` ≤600 dòng; `commit` 37/37
- [x] **Người đặt việc duyệt**

---

## Câu hỏi — trạng thái

- [ ] **Q1** (không chặn): `/complete` fail có để lại dấu vết cho phụ huynh ngoài `console.error` không? A4 tạm chốt là không.
- [ ] **Q2** (không chặn): trong 32 template ở T8 có cái nào thật sự cần tỉ lệ 16:9 cố định không? Có thì ghi thành ngoại lệ có tên trong baseline.
- [ ] **Q3** (kế thừa #259, không chặn): 0/444 level có `instruction_audio_path` — thu âm corpus là chương trình nội dung riêng.
