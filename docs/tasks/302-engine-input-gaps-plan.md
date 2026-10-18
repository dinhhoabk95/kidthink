# Kế hoạch Task #302: Lấp gap cử chỉ và luật của từng engine (Engine Input Gaps)

Contract: phiếu `docs/specs/01-platform/engines/GT-001.md` (`BR-E001-01`, `BR-E001-02`, `BR-E001-04`), `GT-013.md` (§4 `N3` `stroke`, `input_mode: arrows`, §17), `GT-029.md` (`BR-E029-03`), `GT-032.md` (§4 `N3` `adjust` ở `pour_to_mark`, §12), `GT-033.md` (`BR-E033-02`, `BR-E033-03`), `GT-035.md` (`BR-E035-07`), `GT-036.md` (§4 `N3` `drop`, §17), `GT-037.md`; `docs/specs/01-platform/engine-spec-sheet.md` (`BR-ESS-12`, `BR-ESS-13`); `docs/specs/01-platform/engine-input-contract.md`.

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G4 §0, §E.2):

| Engine | Hụt | Bằng chứng |
|---|---|---|
| `GT-001` | Đúng **một** `is_correct`; band 3-4 tối đa 3 lựa chọn; prompt một mệnh đề | `GT-001/template.ts` chưa `superRefine`; `packages/content-build/src/generators/gt001.ts:22-24` không chặn max 3 ở band 3-4; test `tests/templates/gt-001*.test.ts` không mang mã BR |
| `GT-013` | §4 `N3` `stroke`, `input_mode: arrows`; hint ô kế tiếp | `GT-013/session.ts:175` không nhận `stroke`; `getView` không phát `move_arrow`; hint không theo đường ngắn nhất (`systems/maze-system.ts`) |
| `GT-029` | §4 `N3` `drop`; `BR-E029-03` | `GT-029/session.ts:335` không có nhánh `drop`; không test cho "vật đã bớt vẫn hiện" |
| `GT-032` | §4 `N3` `adjust` ở `pour_to_mark` | `GT-032/session.ts:194-197` chỉ `tap`; `:102` `pour_to_mark` = "cốc đầy"; §12 phiếu thiếu layout `grid` |
| `GT-033` | `BR-E033-02`, `BR-E033-03` | `GT-033/session.ts:279-293` không kiểm quy luật hàng/cột từ dữ liệu ô, phụ thuộc `solution` optional |
| `GT-035` | §4 `N3` `drop` | `GT-035/session.ts:474` không có nhánh `drop` thẻ lệnh |
| `GT-036` | §4 `N3` `drop`; §17 | `GT-036/session.ts:393` không có `drop` |
| `GT-037` | Cổng chưa đo §6/§9/§15 | Có `template.ts`/`session.ts`/`fixtures.ts`, có trong registry, nhưng không có trong `packages/game-engine/config/engine-spec-ready.json` |

Mục tiêu: mỗi engine nhận đúng cử chỉ phiếu khai ở §4 `N3`/§17 và thi hành BR ở §6, có test gắn mã BR; GT-037 vào ready list.

Ngoài phạm vi: thang trợ giúp `N5` (Task #301) — trừ hint ô kế tiếp của GT-013 vì phiếu gộp nó vào luật `N3`/đường ngắn nhất; nếu Task #301 đã có `getHintTargetForLevel` thì cài qua hook đó.

## 2. Thiết kế

- **Cử chỉ `drop` / `stroke` / `adjust`:** dùng từ vựng cử chỉ có sẵn ở `packages/game-engine/src/interaction.ts:6-21` và đường `placement-mechanic`; không thêm cử chỉ mới ngoài `engine-input-contract.md`. Mỗi session thêm nhánh xử lý trong `handleInput` (hoặc tên tương đương), giữ fallback tap-tap cho band 3-4 nếu phiếu khai.
- **GT-001:** `superRefine` trên schema `content_pack` đếm `is_correct === true` đúng 1; generator chặn số lựa chọn theo band. Seed-check của content-build phải bắt level vi phạm — nếu corpus đang có level vi phạm, sửa dữ liệu, không nới schema.
- **GT-033:** suy đúng/sai từ quy luật hàng và cột tính trên dữ liệu ô; chỉ bật cờ hỏng của **chiều** sai. `solution`: chọn một trong hai theo phiếu §7 — nếu phiếu không khai `solution` thì bỏ phụ thuộc; nếu muốn giữ thì sửa §7 phiếu trước rồi bắt buộc trường.
- **GT-032 `adjust`:** kéo mực nước liên tục; `isCupCorrect` nhánh `pour_to_mark` so mức kéo với vạch theo dung sai khai trong phiếu (nếu phiếu không có dung sai → sửa phiếu trước). Sửa §12 thêm `grid` cho khớp `template.ts`.
- **GT-013:** `stroke` → chuỗi `draw_step`; nút mũi tên phát `move_arrow` trong `getView`. Nếu chi phí quá lớn, phương án thay là hạ §17 phiếu về `tap` — phải hỏi người dùng trước (đổi hành vi đã chốt).
- **GT-037:** thêm `"GT-037"` vào `engine-spec-ready.json`; audit đã đối chiếu tay §15 khớp `template.ts`.

## 3. Lát cắt dọc

- **S1 — GT-037 vào ready list** (rủi ro thấp, làm trước để cổng đo thêm một phiếu)
  - Test trước: chạy `rtk proxy pnpm check:engine-specs` sau khi thêm mã — phải xanh; nếu đỏ, sửa phiếu theo báo lỗi (không gỡ khỏi ready list).
  - Xong khi: cổng báo ready 38; `pnpm --filter @mindkid/game-engine gen:engine-index` chạy lại.
- **S2 — GT-001 luật một đáp án + trần band**
  - Test trước: `content_pack` hai `is_correct` → schema từ chối; generator band 3-4 không sinh > 3 lựa chọn; tên `it` gắn `BR-E001-01/02/04`.
  - Xong khi: test xanh; `rtk proxy pnpm --filter @mindkid/content-build seed:check` xanh trên corpus.
- **S3 — `drop` cho GT-029, GT-035, GT-036**
  - Test trước (mỗi engine): input `drop` vào vùng đích → trạng thái đổi như phiếu §4 `N3`; GT-029 có test `BR-E029-03` (vật đã bớt vẫn hiện); GT-035 test `BR-E035-07`.
  - Xong khi: 3 nhóm test xanh; sửa §17 GT-036 theo khuôn nếu phiếu ghi sai dòng cử chỉ.
- **S4 — GT-033 kiểm quy luật hàng/cột**
  - Test trước: lưới sai một hàng → chỉ cờ hàng bật; sai một cột → chỉ cờ cột; không có `solution` vẫn chấm đúng (`BR-E033-02/03`).
  - Xong khi: test xanh, không đọc `solution` optional.
- **S5 — GT-032 `adjust` ở `pour_to_mark`**
  - Test trước: kéo mực tới vạch → đúng; dừng lệch ngoài dung sai → sai; nhánh khác không đổi.
  - Xong khi: test xanh; §12 phiếu có `grid`.
- **S6 — GT-013 `stroke` + mũi tên** (hỏi người dùng trước nếu chọn hạ spec)
  - Test trước: chuỗi `stroke` đi qua ô → các `draw_step` đúng thứ tự; nút mũi tên phát `move_arrow`; hint trỏ ô kế tiếp trên đường ngắn nhất.
  - Xong khi: test xanh.
- **S7 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, `rtk proxy pnpm --filter @mindkid/game-engine test`, `rtk proxy pnpm check:engine-specs`, `check:engine-turn`, `check:engine-behavior` (nợ hai kênh không tăng), `check:hint-target`, `rtk proxy pnpm check:test-ratchet`.
  - Spec: với mọi file trong `rtk proxy rg -l '#302' docs/specs` — bỏ `#302` khỏi `open_tasks` và khối "Chưa hoàn thành"; nâng status (`approved` → `implemented`, GT-037 ít nhất `approved`; `published` giữ nguyên); `reviewed`.
  - Commit vào `main`.

## 4. Rủi ro

- Thêm cử chỉ có thể đổi kết quả `check:engine-behavior` (miền hành vi / kênh thắng). Chạy cổng sau mỗi slice, không để dồn.
- Corpus level GT-001 có thể đang vi phạm luật một đáp án → sửa dữ liệu trong `packages/content`, chạy lại seed-check.
