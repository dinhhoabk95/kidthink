# Task #259 Plan: Nối lại các đường tối của bề mặt chơi (Play Surface Dark Paths)

> **Mục tiêu**: Đóng 16 phát hiện của review ngày 2026-09-07 trên bề mặt chơi v2.
> Chủ đề xuyên suốt: **engine lõi đã xây đúng, nhưng dây nối cuối cùng tới đứa trẻ bị đứt**.
> Bốn hệ thống đã có spec, có code, có test — và có **0 call site production**:
> scaffolding, fallback thị giác khi mất giọng, không gian logic responsive, `reduced_motion`.
> Cộng thêm hai lỗi che nhau ở đường điểm khiến không ai phát hiện ra cả cụm.

---

## 1. Bối cảnh

### 1.1 Vì sao cổng xanh mà sản phẩm hỏng

`npx vitest run` trong `packages/game-engine` (node v24.15.0): **PASS 1312 / FAIL 0**.
Không một phát hiện nào dưới đây bị bắt, vì bộ test phủ engine thuần — không phủ lớp
Vue, DOM, CSS, hay HTTP. Toàn bộ 16 lỗi nằm đúng ở khe giữa engine và bề mặt.

Thêm một lớp che: `pnpm check` (`scripts/check.sh`) **không chạy test** — Phase 3 và
Phase 4 đang bị comment. Nên "check xanh" hiện chỉ nghĩa là lint + typecheck xanh.

### 1.2 Hai lỗi che nhau ở đường điểm

Đây là lý do cụm lỗi này sống sót lâu:

```
Trẻ đăng nhập chơi xong
  └─ uploadTelemetry() → POST thiếu x-csrf-token → 403 CsrfInvalidError
       └─ throw → finishSession() catch → console.error
            └─ finally { showVictoryModal = true }
                 └─ Modal vẽ CỨNG 3 sao + "+100 Điểm"
                      └─ Không ai thấy gì sai
```

`/complete` không bao giờ chạy → hàng `play_sessions` kẹt `in_progress` vĩnh viễn,
`starsEarned` luôn 0, telemetry rỗng. Guest thì chạy được vì route guest không đòi CSRF —
tức **khách vãng lai có dữ liệu, người dùng đăng nhập thì không**.

### 1.3 Bốn hệ thống đã xây xong nhưng chưa cắm điện

| Hệ | Spec | Trạng thái code | Call site production |
|---|---|---|---|
| Scaffolding / gợi ý | `04-play/scaffolding-and-hints.md` `BR-SCF-01..08` | Đủ, có test, tick mỗi frame | `resetOnSuccess()` — chỉ biết quên, không biết giúp |
| Fallback thị giác khi mất giọng | `BR-ENG-10`, `BR-A11-11` | `triggerVisualFallback()` đủ | 0 |
| Không gian logic responsive | `layout/constants.ts` `deriveLogicSpace()` | Đủ, có gate test riêng | 0 — renderer vẫn hardcode 960x540 |
| `reduced_motion` | `BR-A11-10`, `BR-SCF-06`, `BR-FBK-09` | Nhận vào `EngineConfig` | 0 — không render nào đọc |

---

## 2. Quyết định kiến trúc

**QĐ-1 — Dùng lại `useApi()`, Cấm — NEVER viết raw `fetch` trong page.**
`composables/use-api.ts` đã tự gắn `x-csrf-token` và chuẩn hoá lỗi. Page đã dùng nó cho
GET config rồi lại tụt xuống raw `fetch` ở đúng 2 POST quan trọng nhất. Sửa bằng cách
dùng đường đã có, không thêm đường mới.

**QĐ-2 — Sao và lời khen là dữ liệu server, Cấm — NEVER hardcode ở client.**
`/complete` đã trả đủ `{ stars, rounds_correct, rounds_total, celebration, next_suggestion }`
(`packages/shared/src/scoring.ts:313`). Modal chỉ được render cái nhận được.
`BR-SCO-02` cấm trẻ thấy con số điểm → xoá `+100 Điểm Tư Duy`.
`BR-SCO-07` phiên `abandoned` → `stars` null → không hiện dải sao.

**QĐ-3 — Không gian logic đi theo ratchet, không đổi chữ ký 37 file một lượt.**
`computeSlots` của 37 template đang import tĩnh `LOGIC_WIDTH`/`LOGIC_HEIGHT`. Đổi chữ ký
đồng loạt là một task L và dễ vỡ. Thay vào đó: `prepareRound` gán không gian logic vào
`TemplateGameSession`, template đọc `this.logicSpace` thay cho import. Template chưa
migrate vẫn chạy ở 960x540. Thêm cổng bậc thang đếm số file còn import tĩnh — nợ chỉ
được giảm, đúng idiom sẵn có của repo (`typecheck-gate`, `check:intro-coverage`).

**QĐ-4 — Sửa hành vi trước, rút kiến trúc sau.**
`S2` (thu `InteractiveSession` về `dispatch()`) là gốc sinh lỗi UI/UX mới, nhưng nó là
refactor lớn. Làm nó trước thì các bản vá hành vi đáp xuống nền đang dịch chuyển.
Thứ tự: đóng đường điểm (nhỏ, độc lập) → cứu trải nghiệm trẻ → chơi được trên điện thoại
→ rồi mới rút hợp đồng.

**QĐ-5 — Mỗi hệ mới nối vào đều phải có ca âm.**
Bài học đã ghi trong repo: cổng xanh giả sinh ra từ việc chỉ test đường thành công.
Mỗi task ở Giai đoạn 1 bắt buộc kèm một test chứng minh **hệ báo đỏ khi đáng đỏ**
(không có giọng → cue được gọi; bí lâu → scaffolding leo thang; bật reduced-motion →
số hạt giảm đo được).

---

## 3. Đồ thị phụ thuộc

```
T1 CSRF ──► T2 Sao thật ──────────────────────────┐
                                                   │
T3 Pause loop (độc lập)                            │
                                                   ├─► Checkpoint A
T4 Fallback giọng ──► T5 Scaffolding ──► T6 Reduced-motion
                                                   │
                                                   ├─► Checkpoint B
T7 Logic space ──► T8 Burn ratchet                 │
T9 HUD responsive                                  │
T10 Parent gate khách                              │
T11 Preload timeout                                │
                                                   ├─► Checkpoint C
T12 Tách file ──► T13 Thu hợp đồng ──► T14 Lớp a11y
                                                   │
                                                   ├─► Checkpoint D
T15 Ngữ nghĩa sao   T16 Màn lỗi cho trẻ chưa đọc
```

---

## 4. Giai đoạn và task

### Giai đoạn 0 — Đường điểm (mở lại dữ liệu thật)

#### T1 — Hai POST phiên chơi đi qua `useApi()`

**Mô tả**: `uploadTelemetry` và `finishSession` đang dùng raw `fetch()` không gắn CSRF nên
403 với mọi trẻ đã đăng nhập. Chuyển sang fetcher chuẩn của repo.

**Acceptance criteria**
- [ ] `grep "await fetch(" apps/web/app/pages/play/[code].vue` trả về **0** dòng
- [ ] Trẻ đăng nhập chơi hết set → hàng `play_sessions` chuyển `completed`, `starsEarned > 0`, telemetry có hàng
- [ ] Lỗi mạng vẫn Cấm — NEVER chặn ăn mừng: modal vẫn hiện, lỗi vẫn kêu ở `console.error`
- [ ] Luồng guest không hồi quy

**Verification**
- [ ] Manual: seeder `parent.free@mindkid.test` (Bé Bắp), chơi 1 level, kiểm DB `play_sessions` + `telemetry_events`
- [ ] Manual: chơi 1 level ở chế độ khách, xác nhận vẫn ghi được
- [ ] `pnpm check`

**Dependencies**: None · **Scope**: S (1 file) · **Files**: `apps/web/app/pages/play/[code].vue`

---

#### T2 — Modal ăn mừng render sao thật, bỏ con số điểm

**Mô tả**: `victory-modal.vue` khai prop `stars` rồi không dùng, vẽ cứng 3 ⭐ và
`+100 Điểm Tư Duy`. Con số điểm vi phạm `BR-SCO-02`. Render đúng cái server trả.

**Acceptance criteria**
- [ ] Dải sao render theo `stars` 1..3; `stars == null` → Cấm — NEVER hiện dải sao (`BR-SCO-07`)
- [ ] Xoá hẳn `+100 Điểm Tư Duy` (`BR-SCO-02`: trẻ Cấm — NEVER thấy con số điểm)
- [ ] Lời khen lấy từ `celebration` của server, luôn tích cực kể cả điểm thấp (`BR-SCO-08`)
- [ ] Page giữ lại `rounds_correct` / `rounds_total` / `celebration` từ response `/complete`

**Bảng lời khen (Q2 đã chốt)** — `getCelebrationCode` trả 3 mã, ánh xạ 1-1 với số sao:

| `celebration` | Sao | Tiêu đề | Phụ đề |
|---|---|---|---|
| `great` | 3 | Bé Giỏi Quá! | Bé làm đúng hết rồi! 🎉 |
| `good` | 2 | Bé Làm Tốt Lắm! | Bé đã hoàn thành cả bài rồi! 🎉 |
| `nice_try` | 1 | Bé Đã Hoàn Thành! | Bé đi hết chặng đường rồi, giỏi lắm! 🎉 |

Ràng buộc đã kiểm: cả ba đều tích cực (`BR-SCO-08`), Cấm — NEVER so sánh trẻ với trẻ khác
(`BR-FBK-08`), Cấm — NEVER có giọng chê (`BR-SCF-08`), Cấm — NEVER `uppercase` (`BR-A11-09`).
`nice_try` cố ý **không** dùng khung "thử lại" — với trẻ 3–6 đó đọc thành lời chê.

**Verification**
- [ ] Test component: `stars=1` → 1 sao sáng; `stars=null` → 0 sao; không có chuỗi `Điểm` nào trong DOM
- [ ] Manual: chơi sai nhiều lần → nhận < 3 sao (chứng minh sao đã thật)

**Dependencies**: T1 · **Scope**: S (2 file) · **Files**: `apps/web/app/components/kid/victory-modal.vue`, `apps/web/app/pages/play/[code].vue`

---

#### T3 — Dừng vòng lặp render khi có modal hoặc tab ẩn

**Mô tả**: `GameEngine.pause()` tồn tại với 0 call site. Canvas vẽ 60fps sau lớp phủ đục
của modal chiến thắng và cổng phụ huynh. Tablet trẻ em là thiết bị chạy pin.

**Acceptance criteria**
- [ ] `showVictoryModal || showParentGate` bật → `engine.pause()`; đóng → `engine.resume()`
- [ ] `visibilitychange` sang hidden → `pause()`; quay lại → `resume()`
- [ ] `resume()` không nhảy hoạt ảnh: `lastFrameTimeMs` được đặt lại (đã đúng ở `core.ts`)

**Verification**
- [ ] Manual: mở DevTools Performance, mở modal → không còn frame vẽ canvas
- [ ] Manual: chuyển tab rồi quay lại → hoạt ảnh chạy tiếp mượt, không giật một bước dài

**Dependencies**: None · **Scope**: XS (1 file) · **Files**: `apps/web/app/pages/play/[code].vue`

---

### Checkpoint A — Đường điểm sống lại
- [ ] `pnpm check` exit 0
- [ ] `npx vitest run` trong `packages/game-engine` giữ PASS 1312 / FAIL 0
- [ ] Chơi hết 1 level ở tài khoản đăng nhập → DB có phiên `completed` với sao thật
- [ ] Chơi sai nhiều → số sao khác lần chơi đúng
- [ ] **Người đặt việc duyệt trước khi sang Giai đoạn 1**

---

### Giai đoạn 1 — Trẻ không bị bỏ rơi

#### T4 — Fallback thị giác khi máy không có giọng Việt

**Mô tả**: 0/444 file level khai `instruction_audio_path`, nên mọi hướng dẫn rơi vào
`speakPrompt()`. Page gọi hàm này với **1 tham số**, bỏ trống `fallbackVisualCue`. Máy
không có giọng vi (phần lớn Chrome/Windows, nhiều Android) → im lặng tuyệt đối. Trẻ chưa
biết đọc không có cách nào biết phải làm gì. Nút "Nghe lại" cũng không làm gì.

**Acceptance criteria**
- [ ] Mọi call site `speakPrompt` truyền `fallbackVisualCue`
- [ ] Không có giọng vi → hiện cue thị giác (nhịp trên vùng đích + phóng prompt pill), Cấm — NEVER im lặng (`BR-A11-11`, `BR-ENG-10`)
- [ ] `hasVietnameseVoice()` dò lại được sau khi `onvoiceschanged` bắn — bỏ chốt `isInitialized` khoá vĩnh viễn ở lần dò đầu trả `[]`
- [ ] **Ca âm**: test giả lập `hasVietnameseVoice() === false` → `fallbackVisualCue` được gọi đúng 1 lần

**Verification**
- [ ] Test đơn vị cho ca âm ở trên
- [ ] Manual: Chrome desktop không cài giọng vi → vẫn thấy chỉ dẫn thị giác
- [ ] Manual: bấm "Nghe lại" khi không có giọng → có phản hồi nhìn thấy được

**Dependencies**: None · **Scope**: M (3 file) · **Files**: `apps/web/app/pages/play/[code].vue`, `packages/game-engine/src/systems/speech-synthesis-adapter.ts`, `packages/game-engine/src/systems/audio-controller.ts`

---

#### T5 — Nối scaffolding vào vòng chơi

**Mô tả**: Hệ gợi ý đủ spec `BR-SCF-01..08`, có ngưỡng theo band tuổi, có ghost hand, có
đề xuất bỏ vòng, có test, được tick mỗi frame — và không ai đọc kết quả. Trẻ 3 tuổi bí ở
vòng 1 hiện kẹt vô hạn.

**Acceptance criteria**
- [ ] Đáp sai → `scaffolding.onMiss()`; đáp đúng → `resetOnSuccess()` (đã có)
- [ ] Leo thang L1/L2/L3 theo đồng hồ **và** miss streak, ngưỡng theo band tuổi (`BR-SCF-05`)
- [ ] `focusIndex` được gán và có biểu hiện nhìn thấy trên canvas — vòng hổ phách quanh ô đúng (`BR-SCF-03`)
- [ ] Mỗi lần leo thang phát event vào telemetry (`BR-SCF-07`)
- [ ] Hệ Cấm — NEVER tự hoàn thành hộ trẻ (`BR-SCF-04`); Cấm — NEVER kèm giọng chê (`BR-SCF-08`)
- [ ] `skipSuggested` sau 60s ở L3 → hiện lối bỏ qua thân thiện gọi `roundRunner.skipCurrentRound("scaffold_exhausted")`
- [ ] **Ca âm**: mô phỏng trẻ ngồi im 40s ở band 3-4 → level đạt 3 và `focusIndex` khác null

**Verification**
- [ ] Test đơn vị cho ca âm ở trên
- [ ] Manual: mở 1 level band 3-4, không chạm gì trong 30s → thấy gợi ý leo thang dần
- [ ] Manual: sai 3 lần liên tiếp → thấy vòng hổ phách chỉ ô đúng

**Dependencies**: T4 (dùng chung kênh cue thị giác) · **Scope**: M (4 file) · **Files**: `apps/web/app/pages/play/[code].vue`, `packages/game-engine/src/core.ts`, `packages/game-engine/src/render/index.ts`, test

---

#### T6 — Một nguồn `reduced-motion` toàn cục

**Mô tả**: `reduced_motion` được đọc từ payload, nhét vào `EngineConfig`, rồi không render
nào đọc lại. Particle, confetti, float, bounce chạy nguyên. Cờ a11y phụ huynh bật ra không
có tác dụng gì. Spec nói **giảm chứ không bỏ**.

**Acceptance criteria**
- [ ] Một nguồn duy nhất: `EngineConfig.reduced_motion || matchMedia("(prefers-reduced-motion: reduce)")`
- [ ] Particle / confetti / float **giảm** biên độ và số lượng, Cấm — NEVER bỏ hẳn (`BR-FBK-09`, `BR-SCF-06`, `BR-A11-10`)
- [ ] Ghost hand của T5 vẫn chạy, chậm hơn
- [ ] `[code].vue` có khối `@media (prefers-reduced-motion: reduce)` cho hoạt ảnh CSS
- [ ] **Ca âm**: bật cờ → số hạt sinh ra giảm đo được so với khi tắt

**Verification**
- [ ] Test đơn vị cho ca âm ở trên
- [ ] Manual: bật reduced-motion ở OS → ăn mừng vẫn có, nhẹ hơn

**Dependencies**: T5 · **Scope**: M (4 file) · **Files**: `packages/game-engine/src/core.ts`, `packages/game-engine/src/systems/render-system.ts`, `apps/web/app/pages/play/[code].vue`, test

---

### Checkpoint B — Trẻ luôn biết phải làm gì
- [ ] `pnpm check` exit 0, bộ test engine giữ xanh
- [ ] Ba ca âm của T4/T5/T6 đều đỏ khi gỡ bản vá (chứng minh test có răng)
- [ ] Manual trên máy **không cài giọng Việt**: chơi hết 1 level chỉ bằng tín hiệu thị giác
- [ ] **Người đặt việc duyệt trước khi sang Giai đoạn 2**

---

### Giai đoạn 2 — Chơi được trên điện thoại

#### T7 — Không gian logic đi theo khung nhìn

**Mô tả**: `render-system.ts:40-41` hardcode `LOGIC_WIDTH = 960 / LOGIC_HEIGHT = 540`.
Bản sửa đúng — `deriveLogicSpace()` + `LOGIC_SHORT_SIDE = 540` — đã tồn tại ở
`layout/constants.ts:49,65` nhưng consumer duy nhất là gate test của chính nó.
Comment ở `constants.ts:36-38` mô tả lỗi này ở thì quá khứ; nó vẫn đang chạy.

Đo trên iPhone 390px: `.main-arena` padding 2rem×2 + tray 14px → hộp canvas ~298px →
`scale = 298/960 = 0,31` → sàn chạm band 3-4 còn **~30 CSS px** (spec `BR-A11-04` đòi 96px).
Canvas cao 167px trong viewport ~700px → game chiếm 24% chiều cao.

**Acceptance criteria**
- [ ] `RenderSystem.setupCanvas` dùng `deriveLogicSpace(cssW, cssH)`; `toLogicPoint` dùng cùng không gian đó
- [ ] `prepareRound` gán không gian logic vào `TemplateGameSession`; template đọc `this.logicSpace` thay cho import tĩnh
- [ ] `.game-canvas` bỏ `aspect-ratio: 16/9` cứng, lấp đầy khay
- [ ] Cổng bậc thang mới đếm số template còn import tĩnh `LOGIC_WIDTH`/`LOGIC_HEIGHT`; nợ chỉ được giảm
- [ ] Migrate lô đầu để chứng minh đường đi: GT-001, GT-002, GT-008, GT-020
- [ ] **Ca âm**: ở khung 390x844, sàn chạm band 3-4 tính ra ≥ 76 CSS px

**Verification**
- [ ] Test gate: đo sàn chạm ở 3 khung 390x844, 768x1024, 1440x900
- [ ] Manual: DevTools iPhone 12 Pro, chơi GT-001 — ô chạm to bằng ngón tay người lớn

**Dependencies**: None · **Scope**: M (5 file) · **Files**: `packages/game-engine/src/systems/render-system.ts`, `packages/game-engine/src/game-session.ts`, `apps/web/app/pages/play/[code].vue`, `scripts/` gate mới, test

---

#### T8 — Đốt nợ ratchet không gian logic về 0

**Mô tả**: Migrate 33 template còn lại sang `this.logicSpace`. Cơ học, không đổi hành vi.

**Acceptance criteria**
- [ ] Cổng bậc thang của T7 về **0**
- [ ] Bộ test engine giữ PASS 1312 / FAIL 0
- [ ] Không template nào còn import tĩnh `LOGIC_WIDTH` / `LOGIC_HEIGHT` trong `computeSlots`

**Verification**
- [ ] `npx vitest run` trong `packages/game-engine`
- [ ] Chạy `scripts/qa/capture-engines.ts` đối chiếu ảnh trước/sau ở khung dọc

**Dependencies**: T7 · **Scope**: L cơ học — chia 3 lô nếu vượt 1 phiên: GT-000..011, GT-012..023, GT-024..036

---

#### T9 — HUD responsive, lối thoát luôn thấy

**Mô tả**: `[code].vue` có **0** `@media` trong 2339 dòng. `.top-hud-bar` là flex cứng
`height: 5.5rem`, `padding: 0 2rem`, `space-between`, không wrap. Trên 390px chỉ còn 326px
cho pill + dải sao + nút "Nghe lại" có label + nút khoá; container `overflow: hidden` cắt
nhóm bên phải. Nút khoá phụ huynh là **lối thoát duy nhất** khi đang chơi
(`layout: false`, không nav, không back). Cắt mất nó là nhốt trẻ trong game.

**Acceptance criteria**
- [ ] Breakpoint ≤640px: HUD thu gọn — nút "Nghe lại" bỏ label chữ, giữ `aria-label` (`BR-A11-06`)
- [ ] Nút cổng phụ huynh **luôn** nằm trong khung nhìn ở 360px, 390px, 414px
- [ ] Không overflow ngang ở mọi breakpoint
- [ ] Sàn chạm mọi nút HUD ≥ 44 CSS px

**Verification**
- [ ] Test e2e/gate: chụp 360px, 390px, 414px, 768px — nút khoá hiện diện và bấm được
- [ ] Manual: DevTools iPhone SE (375px)

**Dependencies**: None · **Scope**: S (1 file) · **Files**: `apps/web/app/pages/play/[code].vue`

---

#### T10 — Trả cổng phụ huynh của bề mặt chơi về đúng spec (client-side)

**Mô tả**: `parent-gate-modal.vue` POST `/api/users/parent-gate/challenge` + `/verify` — hai
endpoint đòi đăng nhập. Khách (page dùng `/api/guest` khi `!loggedIn`) bấm nút khoá →
401/403 → kẹt. Nhưng gốc rễ sâu hơn: **spec nói cổng này không có route nào cả.**

`04-play/parent-gate.md` §8: *"Không có route. Hoàn toàn client-side."*
§7.2: *"`parent_gate_trusted_until` — sessionStorage, không cookie (không cần gửi lên server)."*
`BR-PGT-06`: *"Cổng là client-side UX, không thay guard server."*

Tức là đường server hiện tại **là thứ được nghĩ thêm ngoài spec**, và chính nó tạo ra lỗi
khách. Sửa đúng = bỏ round-trip cho cổng thoát, không phải thêm route khách.

Rà lại `[code].vue` + `parent-gate-modal.vue` theo spec còn ra 5 vi phạm nữa chưa từng ghi
trong review:

| Vi phạm | Hiện tại | Spec |
|---|---|---|
| `BR-PGT-01` | nút khoá dùng `@click`, trẻ tap trúng được | long-press **800ms**, Cấm — NEVER tap trúng |
| `BR-PGT-03` | sai → hộp `danger` đỏ "Câu trả lời chưa đúng" | quay lại game, Cấm — NEVER thông báo tiêu cực |
| `BR-PGT-04` + §7.2 | `handleParentVerified` chỉ `router.push`, không lưu gì | cửa sổ tin cậy **5 phút** ở `sessionStorage` |
| §5 | sai bao nhiêu lần cũng hỏi lại ngay | sai 3 lần → khoá cổng **60 giây** |
| §7.3 | không phát event nào | `parent_gate_shown` / `parent_gate_passed` / `parent_gate_failed` |

**Về Q1 (đã chốt: ẩn nút cần đăng nhập)**: nguyên tắc được áp đúng, và sau khi sửa theo spec
thì **không còn gì để ẩn** — cổng thoát vốn không cần đăng nhập. Cấm — NEVER ẩn nút khoá cho
khách: `04-play/parent-gate.md` §3 xếp "Nút thoát khu vực chơi" vào nhóm **bắt buộc có cổng**
(ràng buộc pháp lý `BR-CDC-12`), và nó là lối thoát duy nhất khi đang chơi (`layout: false`,
không nav, không back) — ẩn đi là nhốt trẻ trong game.

Nguyên tắc Q1 vẫn giữ nguyên hiệu lực cho phần còn lại: mọi nút gọi endpoint `/api/users/**`
Cấm — NEVER hiện với người chưa đăng nhập.

**Acceptance criteria**
- [ ] Cổng thoát sinh thử thách **client-side**, 0 request mạng (`parent-gate.md` §8)
- [ ] Thử thách là phép nhân hai số một chữ số, nhập bằng bàn phím số (`BR-PGT-02`, `BR-PGT-07`)
- [ ] Nút khoá chỉ mở bằng **long-press 800ms**, tap nhanh Cấm — NEVER có tác dụng (`BR-PGT-01`)
- [ ] Sai → quay lại game, Cấm — NEVER dùng màu `danger` hay lời chê (`BR-PGT-03`)
- [ ] Sai 3 lần → khoá cổng 60 giây (§5)
- [ ] Qua cổng → ghi `parent_gate_trusted_until` vào `sessionStorage`, cửa sổ 5 phút (`BR-PGT-04`, §7.2)
- [ ] Phát đủ 3 event §7.3
- [ ] Khách và người đăng nhập đi **cùng một đường**; không nhánh `loggedIn` nào trong cổng thoát
- [ ] Đường `gate_token` server chỉ còn phục vụ đổi hồ sơ trẻ (`children/[uuid]/activate.post.ts`) — nơi vốn đã đòi đăng nhập
- [ ] **Ca âm**: tap nhanh 5 lần vào nút khoá → cổng Cấm — NEVER mở

**Verification**
- [ ] Test đơn vị cho ca âm long-press và cho cửa sổ tin cậy 5 phút
- [ ] Manual: chế độ ẩn danh, vào 1 level free, long-press → qua cổng → về `/games`
- [ ] Manual: người đăng nhập không hồi quy
- [ ] `apps/web/tests/api/parent-gate-routes.test.ts` giữ xanh (route vẫn phục vụ đổi hồ sơ)

**Dependencies**: None (Q1 đã chốt) · **Scope**: M (3 file) · **Files**: `apps/web/app/components/parent-gate-modal.vue`, `apps/web/app/pages/play/[code].vue`, test

---

#### T11 — `preloadAssets` phải có timeout

**Mô tả**: `[code].vue:380-408` chờ `Promise.all` không giới hạn. Nhánh audio chờ
`oncanplaythrough`; iOS hoãn tải media tới khi có user gesture → sự kiện không bao giờ bắn
→ `isLoading` mãi `true` → trẻ nhìn "Đang chuẩn bị bài học cho bé..." vô hạn.

**Acceptance criteria**
- [ ] Mỗi asset race với timeout 3s; tổng thời gian chờ ≤ 5s
- [ ] Asset treo Cấm — NEVER chặn vào game; lỗi tải kêu ở `console.warn`, không nuốt im lặng
- [ ] **Ca âm**: giả lập asset không bao giờ resolve → vẫn vào được game trong ≤5s

**Verification**
- [ ] Test đơn vị cho ca âm ở trên
- [ ] Manual: DevTools throttle Offline sau khi có config → vẫn vào game

**Dependencies**: None · **Scope**: XS (1 file) · **Files**: `apps/web/app/pages/play/[code].vue`

---

### Checkpoint C — Chơi được trên điện thoại
- [ ] `pnpm check` exit 0, bộ test engine xanh, ratchet không gian logic = 0
- [ ] Manual trên iPhone thật hoặc DevTools 390px: chơi trọn 1 level, ô chạm thoải mái, luôn thoát được
- [ ] **Người đặt việc duyệt trước khi sang Giai đoạn 3**

---

### Giai đoạn 3 — Rút hợp đồng và a11y

#### T12 — Tách `[code].vue`

**Mô tả**: 2339 dòng, ~2,3× ngưỡng lành mạnh. Chứa lẫn lộn: template, hit-test, state
machine kéo thả, code vẽ canvas avatar, error mapping, telemetry HTTP, 14 theme CSS.
Refactor thuần, Cấm — NEVER đổi hành vi trong task này.

**Acceptance criteria**
- [ ] `[code].vue` ≤ 600 dòng; mỗi module tách ra ≤ 400 dòng
- [ ] Tách tối thiểu: `useGameCanvasInput()`, `usePlaySession()`, `play-error-map.ts`, `drag-avatar.ts`, theme CSS ra file riêng
- [ ] Hành vi không đổi — đối chiếu bằng manual cùng kịch bản Checkpoint C

**Verification**
- [ ] `pnpm check`, bộ test engine xanh
- [ ] Manual: chạy lại đúng kịch bản Checkpoint C, không khác biệt quan sát được

**Dependencies**: T1..T11 đã đáp · **Scope**: M-L (6 file) — refactor thuần nên chấp nhận được

---

#### T13 — Thu `InteractiveSession` về `dispatch()` / `getView()`

**Mô tả**: `InteractiveSession` (`[code].vue:246-286`) là hợp đồng thứ hai dựng bằng
duck-typing — ~15 method optional dò bằng `typeof x === "function"` rải khắp
`handleDropPlacement`, `isSourceSlot`, `tryOtherAction`. Đây là **nguồn sinh lỗi UI/UX**:
template nào không khớp một nhánh duck-typing thì im lặng không phản hồi.

Hợp đồng thật đã được thi công đầy đủ: `toAction` 37/37, `getView` 37/37, `commit` 36/37.

**Acceptance criteria**
- [ ] `interface InteractiveSession` bị xoá khỏi codebase
- [ ] Page chỉ gọi `session.dispatch(gesture)` để nhập và `session.getView()` để vẽ
- [ ] GT-000 bổ sung `commit` → 37/37
- [ ] **Ca âm**: harness chơi thử cả 37 template, mỗi template phải phản hồi được ít nhất 1 gesture đúng và 1 gesture sai

**Verification**
- [ ] Mở rộng `tests/all-templates-interactive-harness.test.ts` cho ca âm ở trên
- [ ] Manual: chơi ngẫu nhiên 6 template thuộc 6 họ input khác nhau

**Dependencies**: T12 · **Scope**: M (4 file)

---

#### T14 — Lớp a11y DOM dựng từ `getView()`

**Mô tả**: `<canvas>` ở `[code].vue:90` trần — không `role`, không `aria-label`, không nội
dung thay thế; chỉ `@pointer*` nên 0 hỗ trợ bàn phím (WCAG 2.1.1 fail).
`getView()` đã có ở 37/37 template và trả `entities` + `activePrompt` — đủ dữ liệu.

**Acceptance criteria**
- [ ] Lớp DOM song song canvas: mỗi `ViewEntity` là một `<button>` định vị tuyệt đối, có `aria-label`
- [ ] Điều hướng bàn phím Tab/Enter chơi được trọn 1 level
- [ ] Focus ring thấy rõ, offset ≥2px (`BR-A11-05`); tab order khớp thứ tự thị giác (`BR-A11-13`)
- [ ] axe 0 violation trên route `/play/[code]` (`BR-A11-01`)
- [ ] Modal trap focus và trả focus khi đóng (`BR-A11-12`)

**Verification**
- [ ] Test axe trên page object của `/play/[code]`
- [ ] Manual: chơi trọn 1 level chỉ bằng bàn phím

**Dependencies**: T13 · **Scope**: M (3 file)

---

### Checkpoint D — Hợp đồng gọn, a11y đạt
- [ ] `pnpm check` exit 0, bộ test engine xanh
- [ ] axe 0 violation trên bề mặt chơi
- [ ] `[code].vue` ≤ 600 dòng, `InteractiveSession` đã biến mất
- [ ] **Người đặt việc duyệt trước khi sang Giai đoạn 4**

---

### Giai đoạn 4 — Chi tiết

#### T15 — Ngữ nghĩa ⭐ và doc `dispatch()`

**Acceptance criteria**
- [ ] `round-progress-indicator.vue` đổi ⭐ sang chấm tròn/dấu chân; ⭐ chỉ còn nghĩa phần thưởng
- [ ] Bỏ `v-if="total > 1"` — level 1 vòng vẫn hiện tiến độ
- [ ] Sửa doc `dispatch()` ở `game-session.ts`: code gọi `commit` **vô điều kiện** và đó là cố ý (GT-001 dựa vào để rung/đỏ khi sai). Sửa doc, Cấm — NEVER sửa code.

**Dependencies**: T14 · **Scope**: S (3 file)

---

#### T16 — Màn lỗi dành cho trẻ chưa biết đọc

**Mô tả**: Text lỗi hiện tại viết cho người lớn — "Cấu hình trò chơi thiếu danh sách câu
hỏi", "Trò chơi thuộc gói nâng cấp" — hiển thị cho trẻ 3-6 chưa đọc được, và error state
không có audio. Vi phạm `BR-A11-11`: bề mặt trẻ Cấm — NEVER chỉ dẫn bằng chữ.

**Acceptance criteria**
- [ ] Error state phát TTS/cue kèm icon lớn, không chỉ có chữ
- [ ] Lỗi cần người lớn xử lý (tier, đăng nhập) chuyển thành màn "gọi bố mẹ" rõ ràng
- [ ] Chữ dành cho phụ huynh tách khỏi tín hiệu dành cho trẻ

**Dependencies**: T4 (dùng lại kênh cue) · **Scope**: S (2 file)

---

### Giai đoạn 5 — Đóng cái lỗ đã cho phép cả cụm này sống

#### T17 — Bật lại Phase 3 `test` trong `scripts/check.sh` (Q3 đã chốt)

**Mô tả**: `scripts/check.sh` có Phase 3 (`test`) và Phase 4 (`test:deploy`) **bị comment**.
Nên `pnpm check` xanh hiện chỉ nghĩa là lint + typecheck xanh — đúng cái lỗ đã để cụm 16 lỗi
này sống sót. Đây là task đóng nguyên nhân, không phải một triệu chứng.

Bật thẳng thì cổng đỏ ngay: bộ test toàn repo có nợ sẵn. Nên đi theo ratchet, giống mọi cổng
khác trong repo.

**Ràng buộc hạ tầng — phát hiện khi thử đo ngày 2026-09-07**

`pnpm check` hiện chỉ chạy lint + typecheck, **không cần service nào**. Bật Phase 3 sẽ làm
`pnpm check` phụ thuộc Postgres + Valkey — đó là một thay đổi DX thật, phải thiết kế chứ
không để nó tự xảy ra.

Đo thử toàn bộ suite khi service **không** chạy: `pnpm services` báo
`PostgreSQL (owner)`, `PostgreSQL (app)`, `Valkey` đều đỏ (`ECONNREFUSED 127.0.0.1:5433`,
`6380`), suite trả **500+ failure toàn bộ là lỗi kết nối**, không phải nợ test. Nghĩa là con
số nợ chỉ đo được sau `docker compose up -d`, và một cổng bật thẳng sẽ đỏ rực trên máy dev
chưa dựng service — đỏ vì sai lý do, đúng kiểu làm cổng mất uy tín.

`packages/game-engine` không dính: `defineWorkspaceTest({}, { database: false })` nên nó chạy
được không cần service — đó là lý do mốc PASS 1312 đo được.

**Hai hiểm đã biết, phải xử trước khi bật**
- `defineWorkspaceTest` gắn `globalSetup` vào cả 17 project → `TRUNCATE` chen giữa gây
  **deadlock**: xanh khi chạy riêng từng project, đỏ khi chạy chung. Phải sửa trước, nếu
  không cổng sẽ đỏ ngẫu nhiên và mất uy tín.
- `pnpm test` có `--bail 1` nên chỉ báo "1 failed" dù nhiều file đỏ. Muốn đo nợ thật phải
  bỏ `--bail` và **diff danh sách file đỏ** trước/sau, không đọc con số tổng.

**Acceptance criteria**
- [ ] `check.sh` kiểm service trước Phase 3; thiếu service thì **báo rõ và hướng dẫn**
      (`docker compose up -d`), Cấm — NEVER đổ 500 lỗi kết nối rồi để người đọc tự đoán
- [ ] `--fast` bỏ qua các project cần database, giữ được vòng lặp dev không service
- [ ] Đo nợ thật **sau khi** `docker compose up -d`: chạy toàn bộ **không** `--bail`, chốt danh sách file đỏ làm mốc
- [ ] Sửa deadlock `globalSetup` để chạy chung cho kết quả bằng chạy riêng
- [ ] Phase 3 bật lại dưới dạng **cổng bậc thang**: số file đỏ chỉ được giảm
- [ ] Thêm test mới Cấm — NEVER làm tăng nợ
- [ ] `packages/game-engine` giữ PASS 1312 / FAIL 0 trong lần chạy chung
- [ ] **Ca âm**: cố ý làm đỏ 1 test → `pnpm check` phải exit khác 0

**Verification**
- [ ] Ca âm ở trên là điều kiện nghiệm thu bắt buộc — không có nó thì đây lại là một cổng xanh giả
- [ ] Chạy `pnpm check` hai lần liên tiếp, kết quả phải giống nhau (không flaky)

**Dependencies**: nên làm **sau Checkpoint A** để các ca âm của T4/T5/T6/T11 được cổng bảo vệ
ngay khi ra đời · **Scope**: M (3 file) · **Files**: `scripts/check.sh`, `packages/config/vitest/base.ts`, gate ratchet mới

---

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| `pnpm check` không chạy test nên "xanh" không chứng minh gì | Cao | Mọi checkpoint gọi `npx vitest run` tường minh. Cân nhắc mở lại Phase 3 của `check.sh` như một task riêng |
| T8 migrate 33 template làm vỡ layout im lặng | Cao | Cổng bậc thang + `scripts/qa/capture-engines.ts` đối chiếu ảnh trước/sau; chia 3 lô |
| T13 thu hợp đồng làm chết một họ input không ai để ý | Cao | Ca âm bắt buộc: harness phủ 37/37, mỗi template 1 gesture đúng + 1 sai |
| Bản vá mới lại thành mã chết như 4 hệ đã có | Cao | QĐ-5: mỗi hệ nối vào phải kèm ca âm chứng minh nó báo đỏ khi đáng đỏ |
| T1 đổi sang `useApi()` làm shape lỗi khác đi, error mapping vỡ | Trung bình | `handleApiError` đã dùng `isApiError` của `@mindkid/errors/client` — cùng shape `useApi` trả ra |
| Node PATH là v20.17.0, vitest lỗi `ERR_UNKNOWN_FILE_EXTENSION` | Trung bình | Mọi lệnh test phải `export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"` trước |
| T17 bật cổng test làm cả đội bị chặn bởi nợ có sẵn | Trung bình | Bật dạng ratchet, không bật tuyệt đối; sửa deadlock `globalSetup` **trước** khi bật |
| Hook rtk nuốt output vitest | Thấp | Đọc bản gốc ở `~/Library/Application Support/rtk/tee/` |
| `--reporter=basic` lỗi load ở vitest 4 khi chạy từ root | Thấp | Chạy reporter mặc định ở root; `--reporter=basic` chỉ dùng được trong từng package |

---

## 6. Câu hỏi — trạng thái

- **Q1 — ĐÃ CHỐT 2026-09-07**: *"Ẩn nút khoá. Khi chưa đăng nhập thì không hiển thị button
  tính năng cần đăng nhập."*
  Nguyên tắc được nhận và áp dụng: mọi nút gọi endpoint `/api/users/**` Cấm — NEVER hiện với
  người chưa đăng nhập.
  Áp vào nút khoá thì kết luận là **không ẩn**, vì sau khi sửa theo spec nó không còn cần
  đăng nhập: `04-play/parent-gate.md` §8 nói cổng này *"không có route, hoàn toàn
  client-side"*. Đường server hiện tại là thứ nghĩ thêm ngoài spec và chính nó gây lỗi khách.
  Thêm nữa §3 xếp "Nút thoát khu vực chơi" vào nhóm **bắt buộc có cổng** (`BR-CDC-12`), và nó
  là lối thoát duy nhất khi đang chơi — ẩn đi là nhốt trẻ trong game. Chi tiết ở T10.
- **Q2 — ĐÃ CHỐT 2026-09-07**: bảng lời khen 3 mức nằm trong T10 phần "Bảng lời khen".
- **Q3 — ĐÃ CHỐT 2026-09-07**: có mở lại Phase 3. Thành **T17**, đặt ngay sau Checkpoint A.
- **Q4 (còn mở, không chặn)**: 0/444 level có `instruction_audio_path`. T4 chỉ vá phần
  fallback. Thu âm/sinh giọng cho corpus là một chương trình nội dung riêng — cần task khác.
