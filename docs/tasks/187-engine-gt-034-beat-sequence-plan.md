# Kế hoạch — Task #187: `GT-034` Gõ theo nhịp — `beat-sequence`

> **Loại task:** lát dọc engine + hệ thống mới (L) — đợt 4 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** khuôn `GT-034` chạy được, cộng **10 level** mang `legacy_v1_ref: "D3-06"`.
> **Game type v1 gánh:** `D3-06` Tạo Nhịp (Beat Maker) — `C1.PAT.01` · `C4.MEM.04` —
> nguồn `d3/BeatMakerSession.ts` · `d3/SoundPatternSession.ts` · `systems/audioPatternPlayer.ts`.
> **Chặn bởi:** chốt kiểm 3. **Cấm — NEVER chạy song song** với `#188` `#189`.
> **Spec sở hữu:** phiếu engine [`docs/specs/01-platform/engines/GT-034.md`](../specs/01-platform/engines/GT-034.md) — **đã viết** ở [Task #190](190-engine-spec-first-authoring-spec.md). Task này cấm — NEVER viết lại phiếu; nó dựng khuôn theo phiếu, và **gỡ `GT-034` khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR** (`BR-ESS-15`).

## 1. Câu hỏi mở 2 — đã quyết: dựng, rủi ro thấp

Câu hỏi là *"dựng bộ phát mẫu nhịp hay hoãn khuôn này"*. Đọc mã v2 xong thì rủi ro nhỏ hơn nhiều
so với lúc đặt câu hỏi.

`packages/game-engine/src/systems/sfx-engine.ts` đã có đúng thứ cần:

```ts
interface NoteRecipe {
  delaySec: number;           // ← offset từ lúc play()
  type: OscillatorType;
  freq: number;
  glideTo?: { freq: number; overSec: number };
  volume: number;
  durationSec: number;
  rampOutSec: number;         // ← BR-ENG-16 đòi >= 40ms
}
```

Nó đã tổng hợp bằng oscillator, đã ép `RAMP_IN_SEC` 20ms và trần âm lượng `-16 LUFS` của
`BR-ENG-16`, và `SFX_RECIPES.level_celebrate` **đã là** một chuỗi sáu nốt có `delaySec` lệch nhau.

**Một chuỗi nhịp chính là một `NoteRecipe[]`.** Nên `BeatSystem` không phải hạ tầng âm thanh mới —
nó là hàm dựng mảng đó từ `content_pack`. Không tệp âm thanh mạng, không micro
(`BR-CDC-04` · `BR-AST-04` giữ nguyên).

Việc duy nhất phải thêm vào `SFXEngine` là một lối vào công khai nhận `NoteRecipe[]` tuỳ ý, thay vì
chỉ nhận `SFXType` trong bảng `SFX_RECIPES` cố định.

## 2. Vì sao khuôn này tồn tại

`GT-018` nghe rồi làm: trẻ **nghe** rồi chọn đáp án. `D3-06` khác ở chỗ trẻ **tạo ra** chuỗi âm và
nghe lại cái mình vừa tạo. Nhịp là quy luật theo **thời gian**, không theo không gian — không khuôn
nào trong 35 khuôn còn lại đặt quy luật lên trục thời gian.

## 3. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `beat-sequence` |
| Nguyên thuỷ | `ordering` |
| Band | `5-6` — `banned_age_bands: ["3-4", "4-5"]` |
| `layouts` | `horizontal-track` · `step-ladder` |
| Hệ thống mới | `systems/beat-system.ts` + lối vào `playSequence` trên `SFXEngine` |
| `status` | `draft` |

### Hợp đồng nội dung

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `prompt_audio_ref` | chuẩn | |
| `instruments` | 2–4 phần tử: `instrument_id` + `asset` + `freq` | tần số là **nội dung** |
| `target_pattern` | 4–12 bước, mỗi bước `instrument_id` hoặc `null` (nghỉ) | mẫu phải gõ lại |
| `tempo_bpm` | 60–120 | |

`refine`: mọi `instrument_id` trong `target_pattern` có trong `instruments`;
`target_pattern` chứa ≥1 lần lặp của một mô-típ ngắn hơn — cấm — NEVER mẫu ngẫu nhiên thuần.

### Hợp đồng độ khó

`pattern_length` · `instrument_count` · `tempo_bpm` · `allow_replay` · `replay_limit` · `hint_after_ms`.

### Event

`game_started` · `pattern_played` · `beat_tapped` · `sequence_submitted` · `game_completed`.
`pattern_played` và `beat_tapped` là event mới.

## 4. `BeatSystem` — phạm vi hẹp

| Làm | Cấm — NEVER làm |
|---|---|
| Dựng `NoteRecipe[]` từ `target_pattern` + `tempo_bpm` | Tải tệp âm thanh qua mạng |
| Tính `delaySec` từ BPM và chỉ số bước | Chạm micro hay quyền ghi âm |
| So chuỗi trẻ gõ với `target_pattern` theo cửa sổ dung sai | Tự đặt tần số — tần số đến từ `instruments` |
| Dựng được độc lập, không cần `GameEngine` | Bỏ qua trần `BR-ENG-16` |

Test riêng `tests/beat-system.test.ts`: dựng độc lập, `delaySec` đúng theo BPM, cửa sổ dung sai
theo band, `rampOutSec` ≥ 40ms trên mọi nốt sinh ra.

## 5. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `GT-034` trong registry, phiếu không mồ côi | `check:engine-specs` |
| 2 | `BeatSystem` dựng độc lập, ≥8 ca test riêng | `tests/beat-system.test.ts` |
| 3 | Mọi `NoteRecipe` sinh ra tôn trọng `BR-ENG-16` — ramp-in ≥20ms, ramp-out ≥40ms | test |
| 4 | 0 tham chiếu mạng, 0 API micro | grep `fetch` · `getUserMedia` trong `beat-system.ts` |
| 5 | ≥12 ca test phiên engine, ≥1 ca trẻ gõ sai rồi nghe lại rồi gõ đúng | test |
| 6 | Bộ sinh ≥8 chủ đề; `refine` loại mẫu ngẫu nhiên thuần | `tests/generators.test.ts` |
| 7 | 10 level `legacy_v1_ref: "D3-06"`, `check:legacy-v1` tăng đúng 1 | `check:legacy-v1` |
| 8 | Âm tắt thì level vẫn chơi được — `BR-ENG-10` gợi ý hình ảnh | ca test |
| 9 | `pnpm check` xanh | — |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Phình thành hạ tầng âm thanh mới | Cao | Bảng phạm vi mục 4; review từ chối mọi thứ ngoài bảng |
| Vỡ trần `BR-ENG-16` khi chuỗi dài | Cao | Nghiệm thu 3 kiểm mọi nốt, không kiểm mẫu |
| Trẻ tắt âm thì bài vô nghĩa | Cao | Nghiệm thu 8 — mẫu nhịp phải có biểu diễn hình ảnh song song |
| Cửa sổ dung sai quá hẹp cho tay trẻ 5 tuổi | Trung bình | Dung sai theo band, khai trong `beat-system`, có ca test |
