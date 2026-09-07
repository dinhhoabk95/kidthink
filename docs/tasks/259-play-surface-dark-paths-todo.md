# Task #259 Todo: Nối lại các đường tối của bề mặt chơi

> Plan: [`259-play-surface-dark-paths-plan.md`](259-play-surface-dark-paths-plan.md)
>
> **Trước mọi lệnh test**: `export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"`
> (node PATH là v20.17.0, vitest sẽ lỗi `ERR_UNKNOWN_FILE_EXTENSION`).
> `pnpm check` **không chạy test** — phải gọi `npx vitest run` tường minh.
> Mốc hiện tại: `packages/game-engine` PASS 1312 / FAIL 0.

---

## Giai đoạn 0 — Đường điểm

- [x] **T1 — Hai POST phiên chơi đi qua `useApi()`** · S · phụ thuộc: không
  - [x] Đổi `uploadTelemetry` sang `useApi()` (`[code].vue:426-461`)
  - [x] Đổi `finishSession` sang `useApi()` (`[code].vue:467-499`)
  - [x] `grep "await fetch(" apps/web/app/pages/play/[code].vue` = 0 dòng
  - [x] Giữ nguyên lập trường: lỗi mạng Cấm — NEVER chặn ăn mừng, nhưng vẫn kêu ở `console.error`
  - [x] Manual seeder `parent.free@mindkid.test`: `play_sessions` chuyển `completed`, `starsEarned > 0`
  - [x] Manual luồng khách không hồi quy

- [x] **T2 — Modal ăn mừng render sao thật** · S · phụ thuộc: T1
  - [x] Dải sao render theo prop `stars` 1..3 (`victory-modal.vue:22-33`)
  - [x] `stars == null` → không hiện dải sao (`BR-SCO-07`)
  - [x] Xoá `+100 Điểm Tư Duy` (`victory-modal.vue:47`) — `BR-SCO-02` cấm trẻ thấy con số
  - [x] Lời khen lấy từ `celebration` của server (`BR-SCO-08`), theo bảng Q2 đã chốt:
    - [x] `great` → "Bé Giỏi Quá!" / "Bé làm đúng hết rồi! 🎉"
    - [x] `good` → "Bé Làm Tốt Lắm!" / "Bé đã hoàn thành cả bài rồi! 🎉"
    - [x] `nice_try` → "Bé Đã Hoàn Thành!" / "Bé đi hết chặng đường rồi, giỏi lắm! 🎉"
  - [x] Page giữ `rounds_correct` / `rounds_total` / `celebration` từ `/complete`
  - [x] Test component: `stars=1` → 1 sao; `stars=null` → 0 sao; DOM không chứa chuỗi `Điểm`

- [x] **T3 — Dừng vòng lặp render khi có modal / tab ẩn** · XS · phụ thuộc: không
  - [x] `engine.pause()` khi `showVictoryModal || showParentGate`, `resume()` khi đóng
  - [x] Xử lý `visibilitychange`
  - [x] Manual DevTools Performance: mở modal → không còn frame vẽ canvas

### ✔ Checkpoint A — Đường điểm sống lại
- [x] `pnpm check` exit 0
- [x] `npx vitest run` (`packages/game-engine`) giữ PASS 1312 / FAIL 0
- [x] Đăng nhập chơi hết 1 level → DB có phiên `completed` với sao thật
- [x] Chơi sai nhiều → số sao khác lần chơi đúng
- [x] **Người đặt việc duyệt**

---

## Giai đoạn 5 — Đóng cái lỗ đã cho phép cả cụm này sống
> Đặt ngay sau Checkpoint A để các ca âm của T4/T5/T6/T11 được cổng bảo vệ từ lúc ra đời.

- [x] **T17 — Bật lại Phase 3 `test` trong `scripts/check.sh`** · M · Q3 đã chốt
  - [x] `check.sh` kiểm service trước Phase 3, thiếu thì báo rõ + hướng dẫn `docker compose up -d`
  - [x] `--fast` bỏ qua project cần database (giữ vòng lặp dev không service)
  - [x] Đo nợ thật **sau** `docker compose up -d`: chạy toàn bộ **không** `--bail`, chốt danh sách file đỏ làm mốc
  - [x] Sửa deadlock `globalSetup` (gắn vào cả 17 project, `TRUNCATE` chen giữa) — xanh khi chạy riêng, đỏ khi chạy chung
  - [x] Bật Phase 3 dạng **cổng bậc thang**: số file đỏ chỉ được giảm
  - [x] `packages/game-engine` giữ PASS 1312 / FAIL 0 trong lần chạy chung
  - [x] **Ca âm**: cố ý làm đỏ 1 test → `pnpm check` exit khác 0
  - [x] Chạy `pnpm check` hai lần liên tiếp cho kết quả giống nhau (không flaky)

---

## Giai đoạn 1 — Trẻ không bị bỏ rơi

- [x] **T4 — Fallback thị giác khi thiếu giọng Việt** · M · phụ thuộc: không
  - [x] Mọi call site `speakPrompt` truyền `fallbackVisualCue` (`[code].vue:527,532,535`)
  - [x] Không có giọng vi → cue thị giác, Cấm — NEVER im lặng (`BR-A11-11`, `BR-ENG-10`)
  - [x] Bỏ chốt `isInitialized` khoá vĩnh viễn ở `speech-synthesis-adapter.ts:29-61`
  - [x] **Ca âm**: giả lập `hasVietnameseVoice() === false` → cue được gọi đúng 1 lần
  - [x] Manual: Chrome desktop không cài giọng vi → vẫn thấy chỉ dẫn
  - [x] Manual: nút "Nghe lại" có phản hồi nhìn thấy được khi không có giọng

- [x] **T5 — Nối scaffolding vào vòng chơi** · M · phụ thuộc: T4
  - [x] Đáp sai → `scaffolding.onMiss()`
  - [x] Leo thang L1/L2/L3 theo đồng hồ và miss streak, ngưỡng theo band (`BR-SCF-05`)
  - [x] `focusIndex` có biểu hiện nhìn thấy — vòng hổ phách quanh ô đúng (`BR-SCF-03`)
  - [x] Mỗi lần leo thang phát event vào telemetry (`BR-SCF-07`)
  - [x] `skipSuggested` sau 60s ở L3 → lối bỏ qua gọi `skipCurrentRound("scaffold_exhausted")`
  - [x] Giữ `BR-SCF-04` (không làm hộ) và `BR-SCF-08` (không giọng chê)
  - [x] **Ca âm**: ngồi im 40s band 3-4 → level = 3, `focusIndex` khác null
  - [x] Manual: không chạm 30s ở band 3-4 → thấy gợi ý leo thang dần

- [x] **T6 — Một nguồn `reduced-motion` toàn cục** · M · phụ thuộc: T5
  - [x] Gộp `EngineConfig.reduced_motion` với `matchMedia("(prefers-reduced-motion: reduce)")`
  - [x] Particle / confetti / float **giảm**, Cấm — NEVER bỏ hẳn (`BR-FBK-09`, `BR-SCF-06`, `BR-A11-10`)
  - [x] Ghost hand vẫn chạy, chậm hơn
  - [x] Thêm `@media (prefers-reduced-motion: reduce)` vào `[code].vue`
  - [x] **Ca âm**: bật cờ → số hạt giảm đo được

### ✔ Checkpoint B — Trẻ luôn biết phải làm gì
- [x] `pnpm check` exit 0, bộ test engine xanh
- [x] Ba ca âm T4/T5/T6 đều **đỏ khi gỡ bản vá** (chứng minh test có răng)
- [x] Manual trên máy **không cài giọng Việt**: chơi hết 1 level chỉ bằng tín hiệu thị giác
- [x] **Người đặt việc duyệt**

---

## Giai đoạn 2 — Chơi được trên điện thoại

- [x] **T7 — Không gian logic đi theo khung nhìn** · M · phụ thuộc: không
  - [x] `setupCanvas` dùng `deriveLogicSpace(cssW, cssH)` (`render-system.ts:63-103`)
  - [x] Bỏ hardcode `LOGIC_WIDTH = 960 / LOGIC_HEIGHT = 540` (`render-system.ts:40-41`)
  - [x] `prepareRound` gán không gian logic vào `TemplateGameSession`
  - [x] `.game-canvas` bỏ `aspect-ratio: 16/9`, lấp đầy khay
  - [x] Thêm cổng bậc thang đếm template còn import tĩnh `LOGIC_WIDTH`/`LOGIC_HEIGHT`
  - [x] Migrate lô đầu: GT-001, GT-002, GT-008, GT-020
  - [x] **Ca âm**: khung 390x844 → sàn chạm band 3-4 ≥ 76 CSS px (hiện ~30px)
  - [x] Manual DevTools iPhone 12 Pro: chơi GT-001, ô chạm đủ to

- [x] **T8 — Đốt nợ ratchet không gian logic về 0** · L cơ học · phụ thuộc: T7
  - [x] Lô 1: GT-000..GT-011
  - [x] Lô 2: GT-012..GT-023
  - [x] Lô 3: GT-024..GT-036
  - [x] Ratchet của T7 về **0**
  - [x] `scripts/qa/capture-engines.ts` đối chiếu ảnh trước/sau ở khung dọc
  - [x] Bộ test engine giữ PASS 1312 / FAIL 0

- [x] **T9 — HUD responsive, lối thoát luôn thấy** · S · phụ thuộc: không
  - [x] Thêm breakpoint ≤640px (hiện `[code].vue` có **0** `@media`)
  - [x] Nút "Nghe lại" bỏ label chữ ở màn hẹp, giữ `aria-label` (`BR-A11-06`)
  - [x] Nút cổng phụ huynh luôn trong khung nhìn ở 360px / 390px / 414px
  - [x] Không overflow ngang ở mọi breakpoint
  - [x] Sàn chạm mọi nút HUD ≥ 44 CSS px

- [x] **T10 — Trả cổng phụ huynh về đúng spec (client-side)** · M · phụ thuộc: không (Q1 đã chốt)
  - [x] Bỏ round-trip `/api/users/parent-gate/*` khỏi cổng thoát — spec §8: *"Không có route. Hoàn toàn client-side."*
  - [x] Sinh thử thách client-side: nhân hai số một chữ số, bàn phím số (`BR-PGT-02`, `BR-PGT-07`)
  - [x] Nút khoá mở bằng **long-press 800ms**; tap nhanh Cấm — NEVER có tác dụng (`BR-PGT-01`)
  - [x] Sai → về game, Cấm — NEVER dùng màu `danger` hay lời chê (`BR-PGT-03`)
  - [x] Sai 3 lần → khoá cổng 60 giây (§5)
  - [x] Qua cổng → `parent_gate_trusted_until` ở `sessionStorage`, cửa sổ 5 phút (`BR-PGT-04`, §7.2)
  - [x] Phát 3 event §7.3: `parent_gate_shown` / `parent_gate_passed` / `parent_gate_failed`
  - [x] Khách và người đăng nhập đi cùng một đường — Cấm — NEVER nhánh `loggedIn` trong cổng thoát
  - [x] Cấm — NEVER ẩn nút khoá cho khách (nó là lối thoát duy nhất; spec §3 bắt buộc có cổng)
  - [x] Áp nguyên tắc Q1 ở chỗ khác: nút gọi `/api/users/**` Cấm — NEVER hiện với khách
  - [x] **Ca âm**: tap nhanh 5 lần vào nút khoá → cổng Cấm — NEVER mở
  - [x] `apps/web/tests/api/parent-gate-routes.test.ts` giữ xanh (route còn phục vụ đổi hồ sơ)

- [x] **T11 — `preloadAssets` phải có timeout** · XS · phụ thuộc: không
  - [x] Mỗi asset race timeout 3s, tổng ≤ 5s (`[code].vue:380-408`)
  - [x] Lỗi tải kêu ở `console.warn`, Cấm — NEVER nuốt im lặng
  - [x] **Ca âm**: asset không bao giờ resolve → vẫn vào game trong ≤5s

### ✔ Checkpoint C — Chơi được trên điện thoại
- [x] `pnpm check` exit 0, bộ test engine xanh, ratchet không gian logic = 0
- [x] Manual 390px: chơi trọn 1 level, ô chạm thoải mái, luôn thoát được
- [x] **Người đặt việc duyệt**

---

## Giai đoạn 3 — Rút hợp đồng và a11y

- [x] **T12 — Tách `[code].vue`** · M-L refactor thuần · phụ thuộc: T1..T11
  - [x] Tách `useGameCanvasInput()` (con trỏ + kéo thả)
  - [x] Tách `usePlaySession()` (fetch / telemetry / complete)
  - [x] Tách `play-error-map.ts`
  - [x] Tách `drag-avatar.ts` (code vẽ canvas)
  - [x] Tách 14 theme CSS ra file riêng
  - [x] `[code].vue` ≤ 600 dòng (hiện 2339), mỗi module ≤ 400 dòng
  - [x] Hành vi không đổi — chạy lại kịch bản Checkpoint C

- [x] **T13 — Thu `InteractiveSession` về `dispatch()` / `getView()`** · M · phụ thuộc: T12
  - [x] Xoá `interface InteractiveSession` (`[code].vue:246-286`)
  - [x] Page chỉ gọi `session.dispatch(gesture)` và `session.getView()`
  - [x] GT-000 bổ sung `commit` → 37/37
  - [x] **Ca âm**: harness phủ 37/37 template, mỗi template 1 gesture đúng + 1 gesture sai
  - [x] Manual: chơi 6 template thuộc 6 họ input khác nhau

- [x] **T14 — Lớp a11y DOM dựng từ `getView()`** · M · phụ thuộc: T13
  - [x] Lớp DOM song song canvas, mỗi `ViewEntity` là `<button>` có `aria-label`
  - [x] Chơi trọn 1 level chỉ bằng bàn phím (Tab/Enter)
  - [x] Focus ring offset ≥2px (`BR-A11-05`); tab order khớp thị giác (`BR-A11-13`)
  - [x] Modal trap focus và trả focus khi đóng (`BR-A11-12`)
  - [x] axe 0 violation trên `/play/[code]` (`BR-A11-01`)

### ✔ Checkpoint D — Hợp đồng gọn, a11y đạt
- [x] `pnpm check` exit 0, bộ test engine xanh
- [x] axe 0 violation trên bề mặt chơi
- [x] `[code].vue` ≤ 600 dòng, `InteractiveSession` đã biến mất
- [x] **Người đặt việc duyệt**

---

## Giai đoạn 4 — Chi tiết

- [x] **T15 — Ngữ nghĩa ⭐ và doc `dispatch()`** · S · phụ thuộc: T14
  - [x] `round-progress-indicator.vue` đổi ⭐ sang chấm tròn/dấu chân
  - [x] Bỏ `v-if="total > 1"` — level 1 vòng vẫn hiện tiến độ
  - [x] Sửa doc `dispatch()` ở `game-session.ts` cho khớp code (`commit` gọi vô điều kiện là cố ý) — sửa doc, Cấm — NEVER sửa code

- [x] **T16 — Màn lỗi dành cho trẻ chưa biết đọc** · S · phụ thuộc: T4
  - [x] Error state phát TTS/cue kèm icon lớn (`BR-A11-11`)
  - [x] Lỗi cần người lớn (tier, đăng nhập) → màn "gọi bố mẹ"
  - [x] Tách chữ dành cho phụ huynh khỏi tín hiệu dành cho trẻ

---

## Câu hỏi — trạng thái

- [x] **Q1 — chốt 2026-09-07**: ẩn nút cần đăng nhập. Áp vào nút khoá ra kết luận **không ẩn** — sau khi sửa theo spec (§8: không có route, hoàn toàn client-side) nó không cần đăng nhập nữa. Ẩn đi sẽ nhốt trẻ trong game vì đó là lối thoát duy nhất. → T10
- [x] **Q2 — chốt 2026-09-07**: bảng lời khen 3 mức → nằm trong T2
- [x] **Q3 — chốt 2026-09-07**: có mở lại Phase 3 → thành T17, đặt sau Checkpoint A
- [ ] **Q4** (còn mở, không chặn): 0/444 level có `instruction_audio_path` — thu âm corpus là chương trình nội dung riêng
