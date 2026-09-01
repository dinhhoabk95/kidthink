# Todo — Task #187: `GT-034` Gõ theo nhịp

> Kế hoạch: [`187-engine-gt-034-beat-sequence-plan.md`](187-engine-gt-034-beat-sequence-plan.md).
> Chương trình: [`Task #168`](168-v1-game-list-integration-plan.md) đợt 4. Cấm — NEVER chạy song song với `#188` `#189`.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH` · dùng `pnpm lint`, **không** `ultracite check`.

## Preflight

- [x] Chốt kiểm 3 xanh — cổng phủ v1 ở 57/60.
- [x] Đọc `packages/game-engine/src/systems/sfx-engine.ts` — `NoteRecipe`, `SFX_RECIPES`, `RAMP_IN_SEC`.
- [x] Đọc `tinimath/.../d3/BeatMakerSession.ts` và `systems/audioPatternPlayer.ts` lấy **dạng bài**. Cấm — NEVER copy mã.

## WP187.1 — `SFXEngine.playSequence`

- [x] Thêm lối vào công khai nhận `NoteRecipe[]` tuỳ ý, không chỉ `SFXType` trong bảng cố định.
- [x] Giữ nguyên ép `BR-ENG-16`: ramp-in ≥20ms, ramp-out ≥40ms, trần âm lượng.
- [x] **Ca âm:** truyền nốt có `rampOutSec` < 0,04 → bị nâng lên hoặc từ chối, không phát nguyên.

## WP187.2 — `BeatSystem`

- [x] `systems/beat-system.ts` — dựng `NoteRecipe[]` từ `target_pattern` + `tempo_bpm`.
- [x] So chuỗi trẻ gõ với mẫu theo cửa sổ dung sai **theo band**.
- [x] Cấm — NEVER `fetch`, cấm — NEVER `getUserMedia`, cấm — NEVER tự đặt tần số.
- [x] `tests/beat-system.test.ts` ≥8 ca, dựng độc lập không cần `GameEngine`.
- [x] Test: `delaySec` khớp BPM · mọi nốt ramp-out ≥40ms · dung sai đổi theo band.

## WP187.3 — Khuôn

- [x] `new:template GT-034 'Gõ theo nhịp' beat-sequence`
- [x] Contract theo mục 3 của plan; `freq` nằm trong `instruments`, là **nội dung**.
- [x] `refine`: `target_pattern` chứa ≥1 lần lặp mô-típ — cấm — NEVER mẫu ngẫu nhiên thuần.
- [x] Band `5-6`; `layouts` `horizontal-track` · `step-ladder`.
- [x] Event `pattern_played` · `beat_tapped` đăng ký vào catalog **và** `ALLOWED_EVENT_NAMES`.

## WP187.4 — Phiên chơi và bộ sinh

- [x] `session.ts` trên nguyên thuỷ `ordering`.
- [x] `fixtures.ts` — 3 level: mô-típ 2 bước, mô-típ 3 bước, có nghỉ (`null`).
- [x] `tests/gt-034-beat-sequence.test.ts` ≥12 ca, có ca trẻ gõ sai → nghe lại → gõ đúng.
- [x] **Ca bắt buộc:** tắt âm → mẫu nhịp vẫn hiện bằng hình ảnh, level chơi được (`BR-ENG-10`).
- [x] `generators/gt034.ts` ≥8 chủ đề, band `5-6`; đăng ký vào `generators/index.ts`.

## WP187.5 — Phiếu, sinh mã, 10 level

- [x] `docs/specs/01-platform/engines/GT-034.md` — 10 mục.
- [x] `gen:templates` không sinh diff · `gen:engine-index` có `GT-034` · `check:engine-specs` xanh.
- [x] `gen:levels --engine=GT-034 --seed=187` — 10 level, ≥3 chủ đề.
- [x] Gắn `legacy_v1_ref: "D3-06"` cho cả 10; `check:legacy-v1` tăng đúng 1.

## Đóng task

- [x] `grep` xác nhận 0 `fetch` và 0 `getUserMedia` trong `beat-system.ts`.
- [x] `check:theme-registry` · `check:engine-depth` xanh.
- [x] `pnpm check` xanh · `status` vẫn `draft`.
- [x] Cập nhật dòng `#187` ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md).
