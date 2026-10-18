# Kế hoạch Task #301: Thang trợ giúp N5 riêng từng engine (Engine Hint Ladder)

Contract: `docs/specs/01-platform/engine-turn-script.md` (nhịp `N5`, `BR-ETS-08`), `docs/specs/04-play/scaffolding-and-hints.md` (`BR-SCF-01`, `BR-SCF-03`, `BR-SCF-04`, `BR-SCF-05`, `BR-SCF-07`), §4 `N5` của 38 phiếu `docs/specs/01-platform/engines/GT-0NN.md` (ưu tiên `GT-010`, `GT-011`, `GT-012`, `GT-017`, `GT-032`).

**Quyết định đã chốt (người dùng):** giữ spec — `N5` có `L1`/`L2`/`L3` riêng từng engine. Sửa code, không sửa phiếu về thang chung.

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G4 §E.1, đo 2026-10-17):

- Mọi phiếu §4 `N5` viết "quá `hint_after_ms`: `L1` … · `L2` … · `L3` …" với hành vi **riêng** từng mức (`BR-ETS-08`). Ví dụ `GT-010.md:63`: `L1` = dòng luật liên quan trong bảng sáng lên.
- Code chỉ có **một** đích gợi ý cho mọi mức: `packages/game-engine/src/core.ts:310-330` (`tickScaffolding`) gọi `getHintTarget()` một lần, rồi `systems/scaffolding.ts:19-20` tô sáng slot đó và chạy bàn tay ma theo tốc độ. `game-session.ts:219-228` chỉ có `getHintTargetIndex()`/`getHintTarget()` không nhận mức. Không engine nào override theo mức (rg `scaffoldLevel|getCurrentLevel` trong `templates/` không thấy).
- Mức trợ giúp lên theo **miss streak / giây cố định theo band** (`systems/scaffolding.ts:59-84`), không theo `hint_after_ms`; `hint_after_ms` chỉ phát sự kiện `hint_requested` (`round-runner.ts:612-620`).
- Năm engine lộ **đáp án đúng ngay ở `L1`**, trong khi phiếu cố ý giữ đáp án tới `L3`:
  - `GT-010` — `L1` "dòng luật sáng" nhưng hint trỏ đáp án.
  - `GT-011` — `L1` "hàng chứa ô trống" nhưng hint trỏ đáp án.
  - `GT-012` — `L1` "nút xem lại" nhưng hint trỏ đáp án.
  - `GT-017` — `L1` "tầng dưới sáng" nhưng hint trỏ đáp án.
  - `GT-032` — hint `L1` trỏ thẳng **cốc đúng** (`GT-032/session.ts:62`), phá bẫy bảo toàn mà §1 phiếu coi là lý do tồn tại.

Mục tiêu:
1. Hạ tầng: đích gợi ý **theo mức** (`L1`/`L2`/`L3`) và trigger leo thang đọc `hint_after_ms` của level, giữ ngưỡng theo band (`BR-SCF-05`).
2. Năm engine ưu tiên không còn lộ đáp án ở `L1`/`L2`.
3. 33 engine còn lại cài `N5` theo phiếu, theo bậc thang nợ (không làm một lượt lớn).

## 2. Thiết kế

### 2.1 Hook theo mức trong `TemplateGameSession`

- Thêm `getHintTargetForLevel(level: HintLevel): HintTarget | null` vào `packages/game-engine/src/game-session.ts`, `HintLevel = 1 | 2 | 3`.
- Mặc định (engine chưa cài): `L3` = `getHintTarget()` hiện có (đáp án — trình diễn), `L1`/`L2` = cũng `getHintTarget()` để không đổi hành vi engine chưa sửa. Hành vi mặc định này là **nợ**, được đếm (2.4).
- `HintTarget` mở rộng thêm kiểu đích không phải đáp án: `{ kind: "region", ids: readonly string[] }` (dòng luật, hàng, tầng, vạch đơn vị…) bên cạnh `slot`/`action` đang có. Kiểu khai tường minh, không `unknown`/`any`.
- `core.ts:tickScaffolding` đọc mức hiện tại của `scaffolding` rồi gọi `getHintTargetForLevel(level)`; `focusIndex` chỉ gán khi đích là `slot` (`BR-SCF-03`); đích `region` được renderer tô sáng theo token, không hex.
- `BR-SCF-04`: không mức nào được tự thả đáp án hộ trẻ — bàn tay ma chỉ trình diễn.

### 2.2 Trigger leo thang

- Đọc `scaffolding-and-hints.md` §7.1 (ngưỡng theo band) và `difficulty_params.hint_after_ms`. Nếu hai nguồn chồng nhau (ngưỡng band vs ngưỡng level) mà spec chưa nói ai thắng → **sửa spec trước** trong cùng PR (CLAUDE.md "Spec là contract"), không tự chọn trong code.
- Đề xuất mặc định để mang ra chốt: `hint_after_ms` của level là mốc vào `L1`; khoảng `L1→L2→L3` theo band (`BR-SCF-05`); miss streak vẫn đẩy mức (`BR-SCF-01`).
- Mỗi lần leo thang phát event (`BR-SCF-07`) kèm mức; `round-runner.ts:612-620` không còn là nơi duy nhất đọc `hint_after_ms`.

### 2.3 Năm engine ưu tiên

| Engine | `L1` theo phiếu | `L2` | `L3` |
|---|---|---|---|
| `GT-010` | `region` = dòng luật liên quan | theo §4 `N5` phiếu | đáp án (trình diễn) |
| `GT-011` | `region` = hàng chứa ô trống | theo phiếu | đáp án |
| `GT-012` | `action` = nút xem lại | theo phiếu | đáp án |
| `GT-017` | `region` = tầng dưới | theo phiếu | đáp án |
| `GT-032` | `region` = vạch đơn vị | `region` = số / tách cột | cốc đúng |

Cột `L2` đọc đúng câu chữ trong §4 `N5` của từng phiếu lúc làm — không phát minh.

### 2.4 Bậc thang nợ cho 33 engine còn lại

- Không có cổng đo thì luật trôi. Mở rộng cổng sẵn có `check:hint-target` (`scripts/check-hint-target.ts`, đã ở `scripts/check.sh:108`) để đếm engine **chưa** override `getHintTargetForLevel`; baseline ban đầu = 33, chỉ được giảm (`--update` từ chối tăng, giống ba cổng bậc thang khác).
- Cổng có **ca âm**: fixture một session override `L1` trả đúng đáp án → đỏ. Fixture sống ở `tests/**/fixtures/`, không viết thẳng vào file test.
- Mỗi engine trả nợ là một commit nhỏ; task này đóng khi baseline = 0. Nếu không xong trong một đợt, giữ `open_tasks: ["#301"]` trên đúng các phiếu còn nợ và ghi số nợ còn lại.

## 3. Lát cắt dọc

- **S1 — Chốt trigger `hint_after_ms` vs ngưỡng band**
  - Đọc `scaffolding-and-hints.md` §6/§7.1 và `engine-turn-script.md` §4. Nếu mâu thuẫn: sửa spec trước (một commit spec riêng).
  - Test trước: `packages/game-engine/tests/systems/scaffolding*.test.ts` — level có `hint_after_ms = 4000` vào `L1` ở 4000 ms, không ở mốc band cũ; miss streak vẫn đẩy mức; mỗi lần lên mức phát một event có `level`.
  - Xong khi: test mới đỏ trước, xanh sau; test scaffolding cũ không đổi trạng thái ngoài các ca được ghi lý do.
- **S2 — Hook `getHintTargetForLevel` + kiểu `region`**
  - Test trước: session giả override `L1` trả `region` → `core` không gán `focusIndex` đáp án ở `L1`, gán ở `L3`; session không override giữ nguyên hành vi (snapshot danh sách test trước/sau trùng khít).
  - Xong khi: `rtk proxy pnpm --filter @mindkid/game-engine test` xanh; renderer tô `region` bằng token.
- **S3 — Bậc thang nợ trong `check:hint-target`**
  - Test trước: ca âm (fixture `L1` = đáp án) làm cổng đỏ; ca dương xanh.
  - Xong khi: `rtk proxy pnpm check:hint-target` xanh với baseline 33 (38 khuôn trừ 5 sẽ trả ở S4–S5 — đo số thật lúc làm).
- **S4 — `GT-010`, `GT-011`, `GT-012`, `GT-017`**
  - Test trước (mỗi engine, gắn mã BR của phiếu trong tên `it`): ở `L1`/`L2` đích **không** là slot đáp án; ở `L3` là đáp án.
  - Xong khi: 4 test xanh, baseline nợ giảm 4, `rtk proxy pnpm check:engine-turn` và `check:engine-behavior` xanh.
- **S5 — `GT-032`**
  - Test trước: `L1` vạch đơn vị, `L2` số/tách cột theo phiếu, `L3` cốc đúng; không mức nào thấp hơn `L3` trỏ cốc đúng.
  - Ghi chú: phần `adjust`/`pour_to_mark` thuộc Task #302, không làm ở đây.
  - Xong khi: test xanh, baseline nợ giảm 1.
- **S6 — Trả nợ 33 engine còn lại (lặp)**
  - Mỗi lượt 3–5 engine: test theo §4 `N5` phiếu → cài → `rtk proxy pnpm check:hint-target:update` (chỉ giảm).
  - Xong khi: baseline = 0.
- **S7 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, `rtk proxy pnpm --filter @mindkid/game-engine test`, `rtk proxy pnpm check:hint-target`, `check:engine-specs`, `check:engine-turn`, `check:engine-behavior`, `rtk proxy pnpm check:test-ratchet`.
  - Spec: với mọi file trong `rtk proxy rg -l '#301' docs/specs` — bỏ `#301` khỏi `open_tasks` (bỏ khoá nếu rỗng) và khối "Chưa hoàn thành"; nâng status (`approved` → `implemented`; phiếu engine `published` giữ nguyên); đặt `reviewed`.
  - Commit vào `main`, stage đúng file (cây làm việc có thay đổi dở của người khác).

## 4. Rủi ro

- Đổi `core.ts` chạm cả 38 engine → S2 phải chụp danh sách `trạng-thái | tên-test` trước/sau và yêu cầu trùng khít.
- Kid surface: đích `region` dùng token màu, không hex; `prefers-reduced-motion` giảm trình diễn, không bỏ (`BR-SCF-06`).
