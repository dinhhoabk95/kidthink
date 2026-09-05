# Task #209 — Danh sách việc: chương trình runtime engine

Kế hoạch: [`209-engine-runtime-program-plan.md`](209-engine-runtime-program-plan.md)

Quy ước: mỗi mục có **nghiệm thu đo được**. Cấm — NEVER tick khi mới "code xong".

Từ điển thuật ngữ ở mục 0 của kế hoạch. Tài liệu này dùng từ thường:
*phép kiểm tra* (gate) · *test chứng minh bắt lỗi* (negative case) · *ảnh nền* (baseline) ·
*khuôn trò chơi* (template) · *cử chỉ* (gesture) · *ô* (slot) · *đường nhập con* (subpath).

---

## Chuẩn bị — chạy một lần, trước mọi thứ

```bash
export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"
node --version     # phải in v24.15.0
```

Cấm — NEVER bỏ dòng `export`. Node trên PATH là v20 và `vitest` chết ngay dưới v20 với
`ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`, đọc thành "cổng xanh".

Chụp ảnh nền, dùng lại ở mọi lát:

```bash
node node_modules/vitest/vitest.mjs run --reporter=json --outputFile=/tmp/before.json
node -e 'const r=require("/tmp/before.json");console.log(r.testResults.flatMap(f=>f.assertionResults.map(a=>a.status+" | "+a.fullName)).sort().join("\n"))' > /tmp/before.txt
```

Cấm — NEVER dùng `pnpm test` để chụp ảnh nền: nó gắn cứng `--bail 1` nên dừng ở lần đỏ đầu tiên.

---

## Đợt 0 — dựng lại ảnh nền

### `#210` Hoà giải `GT-000` — đổi tên `GT037*` → `GT000*` (`D-NN`)

**CHẶN CỨNG toàn bộ chương trình.** `Q209-1` đã đóng 2026-09-04: **đổi tên**, giữ nguyên hợp đồng
generator. Bán kính đã đo, ở §8 của kế hoạch.

Đổi **17 định danh** cùng tiền tố `GT037` → `GT000`: `GT037`, `GT037Asset`, `GT037AssetKind`,
`GT037AssetKindSchema`, `GT037AssetSchema`, `GT037Content`, `GT037ContentSchema`, `GT037Difficulty`,
`GT037DifficultySchema`, `GT037Session`, `GT037Step`, `GT037StepLinkSchema`, `GT037StepPresentSchema`,
`GT037StepRecallSchema`, `GT037StepRecogniseSchema`, `GT037StepSchema`, `GT037Template`.

**Ba file sửa tay, năm file sinh lại.** Cấm — NEVER `sed` cả cây: năm file `src/generated/*` phải đi
qua `pnpm gen:templates`, không sửa trực tiếp (`BR-TAK-03`).

- [ ] `src/templates/GT-000/template.ts` — 24 lần
- [ ] `src/templates/GT-000/session.ts` — 20 lần
- [ ] `src/templates/GT-000/fixtures.ts` — 4 lần
  - [ ] Đồng thời: có **≥ 3** fixture, mỗi cái có `prompt:`, export đúng tên generator sinh ra
  - Nghiệm thu: `grep -c 'prompt:' packages/game-engine/src/templates/GT-000/fixtures.ts` ≥ 3
- [ ] `docs/specs/01-platform/engines/GT-000.md:2` — frontmatter `spec: ENGINE-GT037` → `ENGINE-GT000`
  - Nghiệm thu: `pnpm --filter @mindkid/game-engine check:engine-specs` xanh
- [ ] `src/templates/GT-000/session.ts` cũng cần `resolveSlots` — nó là khuôn **duy nhất** không có,
      nên `slots` vĩnh viễn rỗng và nó không có ô chạm nào. (Nếu để `#215` làm thì `#211` ca (i) của
      `GT-000` vẫn đỏ tới đó — chấp nhận được, nhưng ghi rõ trong commit)
- [ ] `ALL_GAME_MECHANICS` ở `@mindkid/shared` và `tests/contract.test.ts:176` khớp nhau ở **37**
- [ ] `tests/template-compliance.test.ts:90` — thêm `"GT-000"` vào **đầu** mảng `toEqual([...])`
  - Đây là **chỗ duy nhất** nhạy cảm thứ tự trong 14 chỗ dùng `ALL_TEMPLATE_CODES`. Đã soát: không
    chỗ nào đọc theo chỉ số; bốn chỗ `for...of`; một chỗ `toContain`. Sau khi sinh lại,
    `localeCompare` đưa `GT-000` từ cuối lên đầu
- [ ] `FIXTURES_MAP` biết `GT-000`
- [ ] Chạy `pnpm --filter @mindkid/game-engine gen:templates`
  - Nghiệm thu: `git diff --exit-code packages/game-engine/src/generated` trả 0
  - Nghiệm thu phụ: `grep -rc GT037 packages/game-engine/src` trả 0 cho mọi file
- [ ] Bộ test engine xanh
  - Nghiệm thu: `node node_modules/vitest/vitest.mjs run --project '@mindkid/game-engine'` →
    `0 failed`, từ `9 failed`

> **CHỐT KIỂM 0** — chụp lại ảnh nền vào `/tmp/before.txt`. Mọi lát sau so với bản này, không so với
> bản chụp lúc chuẩn bị. `pnpm lint`, `pnpm lint:deps`, `pnpm typecheck` xanh.

---

## Đợt 1 — đóng mạch vòng chơi

### `#211` Cổng vòng đời vòng chơi — cố tình ĐỎ trước

- [ ] `packages/game-engine/tests/gates/round-lifecycle.test.ts`: với **mọi** mã trong
      `ALL_TEMPLATE_CODES`, dựng `RoundRunner` **hai vòng** từ `FIXTURES_MAP`, qua vòng một, rồi assert
  - [ ] (i) `getCurrentSession().slots.length > 0`
  - [ ] (ii) ô vòng hai deep-equal ô của một session dựng thẳng rồi chuẩn bị
  - [ ] (iii) số lần tính ô sau khi chuẩn bị bằng đúng `1`
  - [ ] (iv) với cấu hình band `3-4`, mọi `slot.hitW`/`hitH` ≥ `getTouchFloor("3-4")`
- [ ] Nghiệm thu — **đỏ đúng số**: 28 ca ở (i) là `GT-001`…`GT-028`; 8 ca ở (iii) là
      `GT-029`…`GT-036`; 9 ca ở (iv) là `GT-000` cùng `GT-029`…`GT-036`
- [ ] Ghi vào phần đầu file vì sao lỗi sống được: `round-runner-snapshot.test.ts:118-130` chỉ dựng
      runner **một vòng**, và `all-templates-interactive-harness.test.ts:190-194` tự tay gọi
      `resolveSlots` — đúng cái sản xuất quên

### `#212` `prepareRound` lên đường gọi, kèm shim

- [ ] `TemplateGameSession.prepareRound(band)` là `final`: gọi `setupEntities()` → gán
      `this._slots = this.computeSlots(band)` → `computeRoundDerived?.()` → tăng `roundGeneration`
- [ ] `slots` thành getter trên field riêng tư; Cấm — NEVER để khuôn gán trực tiếp
- [ ] Shim tạm ở lớp cơ sở uỷ nhiệm cho `resolveSlots` cũ, để cả 37 khuôn chạy nguyên
- [ ] `core.ts:164-173`: xoá khối duck-type, gọi thẳng `prepareRound`
- [ ] `round-runner.ts:36-43`: `RoundRunnerOptions.ageBand` **bắt buộc**, Cấm — NEVER optional
- [ ] `round-runner.ts:242`: `setupEntities()` → `prepareRound(this.ageBand)`
- [ ] `[code].vue:1230` truyền `ageBand`
- [ ] Nghiệm thu: `#211` ca (iii) xanh; ca (i), (ii), (iv) vẫn đỏ; `diff /tmp/before.txt` mọi thứ khác
      trùng khít

> **CHỐT KIỂM 1a** — §10 "Ask first" của [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md):
> *"Refactor Session class vượt quá một template."* Xin duyệt trước `#213`.

### `#213` Chuyển 35 khuôn sang `computeSlots`

- [ ] `resolveSlots(band): void` → `protected computeSlots(band): Slot[]` ở 35 khuôn
      (tất cả trừ `GT-000` và `GT-001`)
- [ ] `this.slots = X` → `return X`
- [ ] Xoá 8 dòng `this.resolveSlots("<band cứng>")` trong `setupEntities` của `GT-029`…`GT-036`
- [ ] Nghiệm thu — **hình dạng diff**, không phải đọc:
      `git diff --numstat -- packages/game-engine/src/templates` cho **≤ 3 dòng đổi mỗi file**.
      Đó là điều kiện duy nhất để 35 file đi chung một commit mà không phạm luật cấm gộp ngang
- [ ] Nghiệm thu: `#211` xanh cho 35 khuôn đó

### `#214` `GT-001` riêng

- [ ] Chuyển `GT-001/session.ts:80-110` — nó là khuôn **duy nhất** có hai nhánh gán `this.slots`
- [ ] Nghiệm thu: `#211` xanh cho `GT-001`

### `#215` `GT-000` riêng

Phụ thuộc `#210`.

- [ ] Viết `computeSlots` cho `GT-000` — nó không có `resolveSlots`, nó tự tính trong
      `updateCurrentStepLayout()` (`session.ts:120-140`) mỗi bước, với `ageBand: "3-4"` cứng
- [ ] Band tuổi chảy từ tham số, Cấm — NEVER cứng
- [ ] Nghiệm thu: `#211` xanh cho `GT-000`

### `#216` Gỡ shim

- [ ] Xoá shim ở lớp cơ sở; `computeSlots` thành `abstract`
- [ ] Nghiệm thu: `#211` xanh **37/37**. `pnpm typecheck` 0 lỗi mới — baseline rỗng nên một khuôn
      chưa cài `computeSlots` là regression cứng
- [ ] Nghiệm thu chạy thật: một level `GT-001` band `3-4` nhiều vòng — vòng hai vẽ 4 lựa chọn và
      **cả 4 chạm được**. Hôm nay vòng hai không vẽ gì

> **CHỐT KIỂM 1b** — `diff /tmp/before.txt /tmp/after.txt` rỗng ngoài các ca `#211` chuyển từ đỏ sang
> xanh. `pnpm lint`, `pnpm lint:deps`, `pnpm typecheck`, `pnpm test` xanh.

---

## Đợt 2 — hợp đồng nhập

### `#217` Hai spec còn thiếu

- [x] `docs/specs/01-platform/engine-play-language.md` — sáu cử chỉ, ba nhịp, năm trạng thái vật
      **suy ra từ** [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) §7.3.
      Cấm — NEVER dựng bộ trạng thái thứ hai. Rule `BR-EPL-01`…
- [x] `docs/specs/01-platform/engine-input-contract.md` — `EngineInput`, `EngineView`, ba vòng đời con
      trỏ, hit band trỏ `BR-A11-04`, fallback chạm-chạm trỏ `BR-ENG-06`, nuốt nhập sau thắng, purity
      trỏ `BR-ENG-13`. Rule `BR-EIC-01`…
- [x] Cả hai đủ 11 mục theo [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §4, và đăng ký vào
      [`index.md`](../specs/index.md) (§9 bước 5)
- [x] Sửa §7.4 của [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) cho khớp cây
      thật: nó thiếu `layout/`, `rng/`, `contracts/`, `generated/`, `generators/`, `round-runner.ts`,
      `offline-buffer.ts`; kê `gameSession.ts` (thật: `game-session.ts`); kê hai class
      `DragDropSession`/`TapSelectSession` không tồn tại; kê `templates/{GT-001…GT-006}` (thật: 37)
- [x] §10 "Always" của cùng file: *"tính lại chỉ khi resize"* → *"khi khung đổi **hoặc vòng đổi**"*
- [x] Bổ sung sáu cổng game-engine còn thiếu vào §2 của
      [`runtime-gates.md`](../specs/08-quality/runtime-gates.md): `render`, `engine-specs`,
      `templates`, `render-viewport`, `logic-space`, `glyph-code-leak`
- [x] [`166-vi-du.md`](166-vi-du.md): 27 → 37 engine (189 → 259 ô); gạch hai hàng §6.1 đã đóng kèm
      bằng chứng (`completeCurrentRound` đã nối ở `[code].vue:839`; lỗi hệ toạ độ đã chữa
      2026-09-01); thêm hàng lỗi vòng-hai và hàng `GT-000`
- [x] Nghiệm thu: `pnpm --filter @mindkid/game-engine check:engine-specs` xanh; mọi liên kết trong hai
      spec mới resolve được

### `#218` Lát dọc đầu: họ `tap`, hành vi `chạm`, khuôn `GT-001`

Vì sao `GT-001`: [`166-vi-du.md`](166-vi-du.md) §6.3 đã chọn nó; nó nằm trong 8 khuôn **đang** nhận cử
chỉ nên đo được bằng luật trùng khít; nó là khuôn **duy nhất** chứng minh được lỗi vòng-hai đầu-cuối;
nó thuộc nhóm `validateAction` thuần nên lát này không kiêm việc sửa `BR-ENG-13`.

- [x] Feature file **đỏ trước**, ở `packages/game-engine/tests/features/cham.feature`
  - [x] Cấm — NEVER đặt ở `packages/game-engine/features/`: `WORKSPACE_TEST_INCLUDE`
        (`packages/config/vitest/base.ts:142-145`) chỉ quét `src/**` và `tests/**`
  - [x] Dùng DSL `Given`/`When`/`Then` tự viết trên vitest. `@amiceli/vitest-cucumber` **không có**
        trong catalog lẫn lockfile
  - [x] Bảng `Examples` một hàng: `GT-001`
  - [x] Ba kịch bản: chạm nền thì không method nào chạy · chạm lại vào đích đã chọn thì giữ ·
        vòng hai dùng hình học vòng hai (hàng `n=4`, bất khả thi trong hình học vòng một)
  - [x] Binding lái **toạ độ con trỏ thật** qua `toLogicPoint`. Cấm — NEVER gọi tắt method session
  - [x] Nghiệm thu: ba ca đỏ, và ghi lại **vì sao** từng ca đỏ
- [x] `src/interaction.ts` thêm `PlayVerb`, `Gesture`, `Beat`, `EngineInput`, `EngineView`,
      `ViewEntity`, `EntityVisual`, `LIFECYCLE.tap`
  - [x] `Gesture` là **một** union sáu nhánh, không trường `data`
  - [x] Cấm — NEVER dùng Zod trên đường này: `BR-ENG-15` cấm cấp phát mỗi khung và `safeParse` cấp
        phát mỗi lần gọi; và `Gesture` không đi qua biên tin cậy nào
- [x] `dispatch()` cài **một lần** ở lớp cơ sở của họ: nuốt sau thắng → `toAction` → `validateAction`
      → `commit`. `validateAction` giữ nguyên chữ ký, thành thuần **theo cấu trúc**
- [x] `GT-001/template.ts` khai `input: { family: "tap", verbs: ["tap"], tolerance_px: 24 }`
- [x] `gen-templates-lib.ts` sinh artifact thứ 7 `src/generated/input-registry.ts`
  - [x] Nghiệm thu: `pnpm gen:templates && git diff --exit-code packages/game-engine/src/generated` — cổng
        so byte `BR-TAK-03` phủ file mới mà không phải sửa cổng
- [x] `GT-001/session.ts` cài `getView()`, `toAction()`, `commit()`
  - [x] `getView` khai **optional** (`getView?(): EngineView`) ở lát này; chỉ siết thành bắt buộc ở
        lát chuyển khuôn thứ 37, vì baseline typecheck rỗng
- [x] `[code].vue` thêm một nhánh: có `template.input` thì đi `LIFECYCLE[family]` + `dispatch`; không
      thì rơi về duck-typing cũ cho 36 khuôn còn lại
- [x] Nghiệm thu: ba ca feature xanh; `diff /tmp/before.txt` mọi thứ khác trùng khít
- [x] Nghiệm thu quan sát được: `grep -c 'typeof session\.' 'apps/web/app/pages/play/[code].vue'`
      giảm từ **17** xuống **16** (15 xuống 14)

### `#219` Cổng bậc thang hai nửa

- [x] `packages/game-engine/tests/gates/engine-input.ts` + `.test.ts`
  - [x] `BR-EIC-01` mã trong `config/engine-input-ready.json` phải có `getView(` — ca âm
  - [x] `BR-EIC-02` không còn export tên `on*` đã chuyển — ca âm
  - [x] `BR-EIC-04` **purity làm cho đúng**: với **mọi action type thật** của khuôn, chụp trạng thái
        cộng `getTelemetry().events.length`, gọi `previewGesture`, đòi không đổi — ca âm là một session
        cố tình ghi event trong `previewGesture`, và cổng phải đỏ với thông điệp nêu đúng lý do
  - [x] `BR-EIC-05` cấm `this.resolveSlots(` trong `setupEntities` — ca âm
- [x] `BR-EIC-04` **thay** `all-templates-interactive-harness.test.ts:233-240`
  - Ghi lại vì sao ca cũ vô dụng: nó mang chú thích *"validateAction does not mutate state"* nhưng chỉ
    gọi với `type: "nonexistent_action_type_test"` rồi chỉ kiểm `checkWinCondition()`. Mọi khuôn nhóm
    B và C trả `ACTION_IGNORED` cho type lạ ở đầu switch mà không đụng gì, nên cổng xanh trong khi
    `GT-031/session.ts:60-93` sửa bốn field và ghi telemetry trên type **có thật**.
    Dạng lỗi: *assert đúng thứ, trên đầu vào sai*
- [x] `apps/web/tests/gates/engine-input-dispatch.ts` + `.test.ts`
  - [x] `BR-EIC-03` trang chơi không còn `typeof session.<tên>` cho tên thuộc mã đã sẵn sàng
  - [x] Số đầu dò ghim **chính xác**, chỉ được giảm — ca âm
- [x] Nghiệm thu: `BR-EIC-04` đỏ cho **13 khuôn** ngay ngày đầu (`GT-025`…`GT-036`). Đó là đúng —
      chỉ đưa mã vào `engine-input-ready.json` khi lát của nó hạ cánh

> **CHỐT KIỂM 2** — trước khi mở loạt chuyển khuôn. Xác nhận công thức bảy bước của `#218` lặp lại
> được, và `#219` giữ được bậc thang.

### `#220`… Chuyển từng khuôn, thứ tự lô 1 → 2 → 3 → 4

- [x] Lô 1 (`GT-002`…`GT-008`) và lô 2 (`GT-009`…`GT-017`): chỉ `getView` + `toAction`, vì
      `validateAction` của chúng đã thuần
- [x] Lô 3 (`GT-018`…`GT-028`) và lô 4 (`GT-029`…`GT-036`): kiêm sửa `BR-ENG-13` — đưa mutation ra
      khỏi `validateAction` vào `commit`
- [x] Lô 4 kiêm thêm: win regime B (trường `isWin` riêng, không bao giờ gọi `winSession()`) và lệch
      arity constructor của `GT-034`/`GT-035`/`GT-036`
- [x] Cấm — NEVER đưa lô khó lên trước: công thức sẽ bị viết lại giữa chừng
- [x] Nghiệm thu mỗi khuôn: hàng `Examples` của nó xanh; số đầu dò trong `[code].vue` giảm đúng một
      bậc; mã vào `engine-input-ready.json`
- [x] **`GT-016` là ngoại lệ có chủ đích (`D-NP`): một engine, một phiếu, ba hàng `Examples`.**
      `template.ts:29` khai `mode: z.enum(["read","set","match"])` là **trường trong content contract**,
      và `GT016ContentSchema` đã `.refine()` điều kiện riêng từng chế độ. Nên:
  - [x] `input.verbs` khai **hợp** động từ cả ba chế độ: `tap`, `adjust`, `commit`
  - [x] Thu hẹp theo chế độ xảy ra **lúc chạy** trong `toAction`: động từ không hợp lệ với `mode`
        hiện tại thì trả `null`, `dispatch` biến thành `ACTION_IGNORED`
  - [x] Bảng `Examples` có **ba hàng** cho `GT-016` — bảy câu hành vi có đáp án khác nhau theo chế độ
        (`166-vi-du.md` hàng 2, 3, 4 chỉ áp cho `set`; hàng 6 chỉ áp cho `read` và `match`)
  - [x] §17 của phiếu spec có ba nhánh; `BR-ESS-13` vốn đòi mỗi rule một `Scenario`
  - [x] Cấm — NEVER tách thành ba engine: sẽ phá `render.test.ts` (ghim 37/37/0), thêm hai thư mục
        template, đòi hai phiếu spec cho song ánh `BR-ESS-01`, đổi `engine-spec-ready.json`, đổi
        `template-seed.ts` (cột cơ sở dữ liệu, bị so byte), và đổi mọi `content_pack` đã gieo có `mode`
  - [x] `GT-016` cũng xuất hiện ở `chinh.feature` (kim đồng hồ) và `chot.feature` (chế độ `set`) —
        `166-vi-du.md` §6.3 đã xếp sẵn nó vào hai file, tức trục động từ chứ không phải trục engine

---

## Đợt 3 — cắt cấp phát mỗi khung

### `#230` Nới gốc quét `BR-ERC-05` lên `src/` — không chuyển một dòng mã

- [x] `scripts/check-render.ts:12`: gốc quét `src/templates` → `src`
- [x] `PRIMITIVE_MODULES` (danh sách tên file) → danh sách **đường dẫn**, gieo bằng đúng ba file đo
      được: `systems/render-system.ts`, `templates/shared-render.ts`, `templates/shared-render-shapes.ts`
- [x] Ca âm mới: `tests/gates/fixtures/raw-canvas-outside-templates/` chứa một `ctx.fillRect(...)`
      **ngoài** `templates/`, và cổng phải đỏ
- [x] Giữ nguyên phần đếm `BR-ERC-01` để chuỗi báo cáo `"37 engine active, 37 cài render, 0 thiếu"`
      không đổi
- [x] Nghiệm thu: `pnpm --filter @mindkid/game-engine check:render` xanh với đúng chuỗi đó;
      `tests/gates/render.test.ts` thêm một ca
- [x] Ghi vào commit message: cổng này lần đầu tiên quét `src/systems/render-system.ts` — **41 chỗ gọi
      `ctx` thô** chưa từng được quét — và bịt lối lách `src/templates/<thư-mục-khác>/`

> **CHỐT KIỂM 3a** — comment ở `tests/gates/render.ts:44-49` nói thêm file vào danh sách miễn trừ là
> quyết định phải review. `#230` **là** lần review đó. Ghi rõ danh sách bắt đầu từ **ba** file, không
> phải hai.

### `#231` Chuyển primitive sang `src/render/`

- [x] `git mv` hai file; thêm `src/render/index.ts` tái xuất nguyên vẹn bề mặt
- [x] Sửa specifier: **37** file import `../shared-render.js`; **17** file import
      `../shared-render-shapes.js` (không phải 37); `src/index.ts:458`; và một chỗ dễ sót là
      `tests/gates/glyph-code-leak.test.ts:6` dùng `#src/templates/shared-render`
- [x] Dùng `#src/render/index.js`. Cấm — NEVER dùng `../`: `lint-import-paths.ts` đã mất cưỡng chế
      nên không ai bắt hộ
- [x] Sửa §7.4 của spec runtime cho khớp (nếu `#217` chưa làm)
- [x] Nghiệm thu: `git diff --numstat -- packages/game-engine/src/templates` cho **≤ 2 dòng đổi mỗi
      file**; `diff /tmp/before.txt` rỗng; `pnpm lint:deps` xanh

### `#232` Xoá `ObjectPool`, thêm cổng đếm gradient — đỏ trước

- [ ] Tách `FakeContext` từ `tests/gates/render-viewport.ts:57-81` thành module dùng chung, thêm
      `createLinearGradient`/`createRadialGradient` ghi log
- [ ] `tests/gates/render-cache.test.ts`, năm ca:
  - [ ] `drawSceneBackground` × 60 khung → đúng **2** gradient (hôm nay 120)
  - [ ] `GT-002` × 60 khung → đúng **16** (hôm nay 960)
  - [ ] Ca âm A — vô hiệu hoá có nối: `setupCanvas(canvas khác)` giữa chừng thì số đếm tăng đúng 2
  - [ ] Ca âm B — **`ctx` phải nằm trong khoá**: cùng `rs`, `FakeContext` thứ hai, cùng
        `(w, h, themeId)` → số đếm **phải** tăng. Memo chỉ khoá theo `(w,h,themeId)` sẽ qua hai ca đầu
        và vẽ canvas thứ hai bằng gradient chết của canvas thứ nhất
  - [ ] `drawTargetHoverAura` × 60 khung với `phase` đổi → đúng **60**. Nó **không** cache được:
        `pulse = 1 + sin(phase·2π)·0.08` nên hình học thật sự đổi mỗi khung
- [ ] Xoá `src/utils/object-pool.ts`, `src/index.ts:459`, `tests/core.test.ts:83-100` trong **cùng
      commit** với cổng đếm
- [ ] Sửa §7.2 của spec runtime: cột "Đo bằng" của hàng "Cấp phát mỗi frame" trỏ cổng đếm gradient,
      không trỏ object pool. Ghi vì sao: pool hạt tái lập đúng việc chia sẻ mảng mà
      `shared-render.ts:817-823` đã chốt bỏ để snapshot tất định
- [ ] Nghiệm thu: hai ca đầu **đỏ** ở đúng con số hôm nay (120 và 960)

### `#233` Cache gradient

- [ ] `src/render/cache.ts`; `RenderSystem` thêm `paintGeneration`, tăng ở cuối `setupCanvas`
- [ ] Khoá là **so sánh scalar theo vị trí**, Cấm — NEVER ghép chuỗi: ghép chuỗi mỗi khung là tái tạo
      đúng cái cấp phát đang xoá
- [ ] Khoá **chỉ** suy từ hình học (`slot.index`, tên primitive). Cấm — NEVER dùng `item_id`,
      `symbol_id`, `template_code` — luật này làm không gian khoá bị chặn bởi bố cục thay vì bởi nội
      dung, nên phình vô hạn là bất khả thi về cấu trúc
- [ ] Chỉ `src/render/*` được import `cache.ts` — thêm rule vào cổng `#230`, kèm ca âm
- [ ] Xoá bộ nhớ ở `core.ts` `destroy()`: mỗi `CanvasGradient` giữ context và qua đó giữ canvas
- [ ] Nghiệm thu: năm ca của `#232` xanh; `diff /tmp/before.txt` rỗng

> **CHỐT KIỂM 3b** — §10 "Ask first": thêm gì vào vòng lặp. Đây là field trên system sẵn có, không có
> `tick`, không tham gia vòng lặp — nhưng vẫn nêu ở chốt kiểm.

### `#234` Memo suy-ra-mỗi-vòng — tách ba, Cấm — NEVER gộp

- [ ] `#234a` — 11 khuôn có `slots.filter` trong `render()`: chuyển `targetSlots`/`sourceSlots` vào
      `computeRoundDerived()`
- [ ] `#234b` — thứ suy từ **trạng thái**, cập nhật **ở chỗ mutate**, Cấm — NEVER trong
      `computeRoundDerived` vì nó là phạm vi vòng và sẽ ôi ngay lần thả đầu tiên
  - [ ] `GT-019`: map ngược `slotId → pieceId` cập nhật ở chỗ đặt; giết O(n²) tại `:270-276`
  - [ ] `GT-025`: `foundLeft`/`foundRight` cập nhật ở chỗ tìm thấy
  - [ ] **Viết test cho `GT-025` trước khi chạm nó**: nó vừa mỏng test nhất (chỉ 3 file harness phủ)
        vừa cấp phát nhiều nhất trong `render()`
- [ ] `#234c` — `GT-010` `glyphBySymbolId`, cộng hai món free:
  - [ ] `scenery.ts:454-455`: `sortCubesForRender(model, rotation)` thay vì
        `sortCubesForRender(rotateModelZ(model, rotation))`. Tương đương vì `rotateCubeZ(c, 0)` là
        phép đồng nhất; bỏ được một `map` và một mảng mỗi khung
  - [ ] `scenery.ts:555`: bỏ sort thừa — `trace-system.ts:32` đã sort. Khẳng định tiền điều kiện ở
        chỗ sinh, đừng sort phòng thủ mỗi khung
- [ ] Nghiệm thu mỗi mục: `diff /tmp/before.txt` **rỗng**. `round-runner-snapshot.test.ts` và
      `all-templates-interactive-harness.test.ts` là hai file bắt được đổi hành vi ngoài ý

---

## Đợt 4 — tách barrel

Cấm — NEVER phụ thuộc đợt 1 và 2; chạy song song được.

### `#240` `./tokens`

- [ ] `packages/game-engine/package.json` thêm `"./tokens": "./src/systems/designTokens.ts"`
- [ ] `tsconfig.json` gốc thêm `"@mindkid/game-engine/*"` — hôm nay chỉ có specifier trần, không có
      dòng `/*` anh em. Tiền lệ ngay trên: `@mindkid/config/*`, `@mindkid/content/*`
- [ ] `packages/ui/tsconfig.json:11` — map `paths` cứng đang đi vòng qua `exports`. Đổi sang trỏ
      `designTokens.ts`, bỏ ánh xạ trần
- [ ] `packages/ui/src/index.ts:2` và `packages/ui/tests/tokens.test.ts:3` dùng `./tokens`
- [ ] Nghiệm thu: `pnpm typecheck` xanh; `node node_modules/vitest/vitest.mjs run --project '@mindkid/ui'`
      xanh — **đây là phép thử resolver cho toàn bộ đợt 4**. `packages/config/vitest/base.ts:27-35`
      ghi rõ subpath phải đi qua `exports`; nếu chỗ này hỏng thì `#242`…`#246` cần hình dạng khác

> **CHỐT KIỂM 4a** — §10 "Ask first": đổi ngân sách bundle. Dừng ở đây, xác nhận vitest resolve được
> subpath, rồi mới đi tiếp.

### `#241` Rule `no-unresolvable` cho dependency-cruiser

- [ ] `.dependency-cruiser.cjs` đặt `exportsFields: ["exports"]` nhưng **không có** rule
      `no-unresolvable`, nên một subpath chưa khai thành cạnh bị **âm thầm bỏ**: `lint:deps` vẫn xanh
      trong khi `no-circular` và `BR-MPA-05/06/07` mất tầm nhìn
- [ ] Nghiệm thu: `pnpm lint:deps` xanh, và một subpath cố tình sai làm nó đỏ

### `#242`–`#246` Các subpath còn lại

- [ ] `#242` `./contracts` — 4 chỗ chỉ dùng kiểu
- [ ] `#243` `./registry` — khoảng 35 chỗ: 8 route/util server của `apps/web`, ~25 chỗ của
      `packages/content-build`, `packages/shared/tests`, `scripts/check-intro-coverage.ts`,
      và `packages/play` (chuyển vào `complete.ts` ở `#251`)
- [ ] `#244` `./generators`
- [ ] `#245` Gỡ **cả 37** `GT0xx_FIXTURES` khỏi `src/index.ts:224-452`; test trong package chuyển sang
      `#src/templates/GT-0xx/fixtures`. Xoá `generateTemplateExportsCode` —
      `template-exports.ts` cũng static-import cả 37 `template.ts` và 37 `session.ts`, nên sửa mỗi
      `session-loader.ts` không đổi được gì
  - Nghiệm thu: `grep -c FIXTURES packages/game-engine/src/index.ts` → 0
- [ ] `#246` `./render` + `./runtime` + loader lười
  - [ ] `gen-templates-lib.ts` sinh loader chỉ còn `loadGameSession` cộng `preloadGameSession`
  - [ ] Cấm — NEVER làm factory async: `GameEngine.load` → `sessionFactory` → `startRound` →
        `advanceToNextRound` → `completeCurrentRound` đều đồng bộ và mắt cuối gọi từ đường `pointerup`
  - [ ] `createGameSessionSync` đọc từ `Map` đã nạp, ném `TEMPLATE_NOT_LOADED` nếu chưa
  - [ ] `[code].vue` thêm **một dòng** `await preloadGameSession(...)` trước `startRounds`;
        `preview-sandbox.vue` cũng vậy
  - [ ] Ca âm: gọi `createGameSessionSync` mà chưa preload **phải ném**, Cấm — NEVER lặng lẽ dựng
- [ ] `packages/db/package.json:14` — khai `@mindkid/game-engine` mà không import gì. Xoá

### `#247` Cưỡng chế ngân sách bundle — hai cổng, hai nhịp (`D-NO`)

`Q209-2` đã đóng: **không hạ `BR-PRF-01`**, tách cưỡng chế theo chi phí đo. Lý lẽ ở §9 của kế hoạch.

- [ ] **Cổng rẻ, vào `pnpm test`** — `packages/game-engine/tests/gates/client-entry-weight.ts` + `.test.ts`
  - [ ] Quét: không module nào tới được từ entry client được phép static-import
        `templates/GT-*/session` hoặc `templates/GT-*/fixtures`
  - [ ] Ca âm: fixture thêm lại một `import ... from "./templates/GT-001/session"` vào một module
        trong đường tới entry client — cổng **phải** đỏ
  - Nghiệm thu: chạy tính bằng mili giây; và nó làm lời khai `BR-TAK-08` ở `session-loader.ts:43-46`
    thành **thật** lần đầu tiên
- [ ] **Cổng đắt, KHÔNG vào `pnpm test`** — script `check:bundle` chạy `nuxt build` rồi đo gzip từng
      chunk theo `BR-ENG-17` (80 KB mỗi khuôn)
  - [ ] Cấm — NEVER nhét vào `pnpm test`: `apps/web` build hàng phút, và [`#204`](204-verify-loop-runtime-plan.md)
        đang rút vòng verify (typecheck đã 73 giây root cộng 256 giây `apps/web`), mới xong 48/97 việc
  - [ ] Cấm — NEVER nhét vào `pnpm test:deploy`: `infra/scripts/tests/run.sh` tự khai
        *"Nothing here touches a real server"*, chạy trên binary giả trong `fakebin/`, không dựng app
  - [ ] Chạy trước phát hành và trong CI
  - Nghiệm thu: in ra con số gzip thật cho `/play/*`. Đây là **con số đầu tiên** của chỉ số này —
    chưa cổng nào trong repo từng đo nó
- [ ] Ghi cả hai cổng vào §1 và §2 của [`runtime-gates.md`](../specs/08-quality/runtime-gates.md),
      và đóng `Q-RG-2` ở §4 của file đó

---

## Đợt 5 — `packages/play`

### `#250` Viết test TRƯỚC, ở `apps/web/tests/api/`

Cấm — NEVER lật `packages/play/vitest.config.ts` sang `{ database: true }`: nó gắn globalSetup cho cả
project và đổi sang chạy nối đuôi. Và `packages/play` **cũng đang đỏ** — `tests/adaptive-mastery.test.ts`
cần Postgres thật trong khi config đưa `NO_DATABASE_URL`.

- [ ] Mở rộng `apps/web/tests/api/event-ingestion.test.ts`, bảy khẳng định:
  - [ ] Lô 3 sự kiện, `seq` 1-2-3 → `{ accepted: 3, skipped: 0, last_seq: 3 }`, 3 dòng trong bảng
  - [ ] Gửi lại y hệt → `{ accepted: 0, skipped: 3, last_seq: 3 }` — tính bất biến mà một
        `INSERT` nhiều dòng ngây thơ sẽ phá
  - [ ] Trùng `seq` **trong cùng lô** → cái thứ hai tính là bỏ qua
  - [ ] `seq: 0` → `INVALID_SEQUENCE`; `seq` lùi → `EVENT_OUT_OF_ORDER`
  - [ ] `intro_period_started` có `payload` **khác rỗng** — đỏ hôm nay
  - [ ] Phiên đã `completed` → `{ accepted: 0, skipped: N }`, 0 dòng ghi
  - [ ] `completePlaySession` mà bước ghi mastery ném thì phiên **không** được để lại ở trạng thái
        `completed` thiếu mastery — đỏ hôm nay, và là lưới an toàn cho `#252`
- [ ] Nghiệm thu: hai ca cuối đỏ, năm ca đầu xanh

### `#251` Tách 12 module

Barrel `src/index.ts` giữ nguyên tám export, nên **10 consumer không đổi một dòng**.

- [ ] `eligibility.ts` (`L761-795`) — thuần, 0 import, đã có test canh. Làm đầu tiên **vì** an toàn
      của nó đã được chứng minh, nên nó nghiệm thu luôn cơ chế tái xuất qua barrel
- [ ] `events/catalog.ts` (`L28-336`) — chuyển thuần
- [ ] `events/schemas.ts` (`L338-759`) — chuyển thuần
- [ ] **Cổng `tests/gates/event-catalog.test.ts`** — ba bảng phải là **cùng một tập hợp**
  - Nghiệm thu: đỏ hôm nay ở đúng năm tên (`intro_period_started`, `intro_item_presented`,
    `intro_item_deferred`, `intro_recall_answered`, `tts_unavailable`) theo chiều
    `allowed − schemas`, và đúng `scaffold_resolved` theo chiều `fields − allowed`
  - [ ] Thêm năm schema còn thiếu; đối chiếu tên với
        [`event-catalog.md`](../specs/00-foundation/event-catalog.md)
  - [ ] Ca `#250` về `intro_period_started` chuyển sang xanh
- [ ] `events/sanitize.ts` (`L889-908`) — chuyển **kèm sửa thật**: nâng `schema.partial()` thành bảng
      dựng một lần lúc nạp module. Hôm nay lô 100 sự kiện dựng 100 object Zod
- [ ] `events/validate.ts` (`L813-831`, `L910-923`) — chuyển thuần
  - [ ] Cấm — NEVER xoá `JSON.stringify(events)` ở `:821` chỉ vì route trùng ngưỡng:
        `sweepAbandonedSessions` và đường worker không đi qua route
- [ ] `session/ownership.ts` (`L833-887`) — chuyển thuần
- [ ] `mastery.ts` (`L1053-1131`, `L1174-1267`) — chuyển thuần
- [ ] `badges.ts` (`L1133-1172`) — chuyển thuần
- [ ] `ingest.ts` (`L925-1051`) — chuyển thuần
- [ ] `complete.ts` (`L1269-1391`) — chuyển thuần, **và** đổi import `getGameTemplate` sang
      `@mindkid/game-engine/registry`. Một cạnh đó hiện kéo cả barrel, gồm cả
      `/// <reference lib="dom" />`, vào một package server-side để đọc đúng một boolean
- [ ] `sweep.ts` (`L1393-1463`) — chuyển thuần
- [ ] Nghiệm thu sau mỗi bước: `pnpm lint:deps` (`BR-MPA-05` và `BR-JOB-04` giữ xanh),
      `pnpm typecheck`, `pnpm test`

### `#252` Transaction và batch insert

Phụ thuộc `#250`.

- [ ] Nới kiểu tham số `db` để nhận `PgTransaction`
- [ ] Bọc `completePlaySession`: đặt `completed` cộng mastery cộng huy hiệu trong một transaction
- [ ] `enqueue` nằm **ngoài** transaction — enqueue bên trong thì rollback để lại job rollup cho một
      phiên chưa từng hoàn tất
- [ ] Cấm — NEVER để lọt một lời gọi `db` (thay vì `tx`) vào trong transaction:
      `packages/db/src/client.ts:16` đặt `{ max: 1 }`, một connection mỗi tiến trình, nên nó tự khoá
- [ ] `INSERT` nhiều dòng với `.returning()` để giữ đúng kế toán bỏ qua
  - [ ] Sửa luôn: `insertIngestedEventsBatch` tăng `accepted` cả khi `.onConflictDoNothing()` ghi
        **0 dòng** vì không có `.returning()` để kiểm, nên retry đồng thời làm `accepted` phồng lên
- [ ] `sweepAbandonedSessions` thêm `LIMIT` và gom round-trip
- [ ] Nghiệm thu: cả bảy ca của `#250` xanh

---

## Rẻ, độc lập — làm lúc nào cũng được sau `#210`

- [ ] `core.ts:267` — nâng `[event.event_name, "*"]` thành hằng số module
- [ ] `shared-render.ts:791-795` — mảng `colors` trong `spawnParticlesAtSlot` thành hằng số module
- [ ] `offline-buffer.ts:120,137` — gọi `pruneBuffer()` theo ngưỡng thay vì mỗi lần thêm sự kiện, và
      giữ ước lượng byte cộng dồn thay vì `JSON.stringify` cả bộ đệm mỗi sự kiện
- [ ] `[code].vue:497-499` — `getSourceSlotIndex` đọc `session.sourceSlots` đã tính sẵn ở `#234a`
      thay vì `filter` cộng `indexOf` mỗi lần chạm

---

## Nghiệm thu cả chương trình

- [ ] `pnpm lint`, `pnpm lint:deps`, `pnpm typecheck`, `pnpm test` xanh
- [ ] `pnpm --filter @mindkid/game-engine check:render` và `check:engine-specs` xanh
- [ ] `pnpm gen:templates` không sinh diff
- [ ] `diff /tmp/before.txt /tmp/after.txt` chỉ có **thêm**; không dòng cũ nào đổi trạng thái
- [ ] Cả 37 khuôn: chạm màn có phản hồi, và chơi được từ vòng hai tới vòng cuối
- [ ] Số đầu dò `typeof session.` trong `[code].vue` bằng **0**
- [ ] Bundle client `/play/*` đo được, và có cổng giữ nó
