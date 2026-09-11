# Task #269 Plan: Phủ giọng đọc — nối 742 file mp3 đã có vào 443 dataset và 37 engine

> **Mục tiêu**: Trẻ 3–6 tuổi chưa đọc được chữ, nên một yêu cầu chỉ có chữ là một yêu cầu chưa
> được truyền đạt. Repo đã có **742 file mp3 giọng Việt** nằm sẵn trong `apps/web/public/`. Chỉ
> **4/443** dataset trỏ tới chúng, và chỉ **1/37** engine phát narration.
>
> Task này nối tài sản đã có vào nơi dùng. Không thu thêm giọng.

Spec: [`play-narration.md`](../specs/04-play/play-narration.md) ·
[`audio-storage.md`](../specs/01-platform/audio-storage.md).

---

## 1. Bối cảnh

### 1.1 Sáu phép đo mở đầu (đo 2026-09-11)

| # | Phép đo | Hiện tại | Đích |
|---|---|---|---|
| M1 | Dataset kỹ năng có `audio_path` | 4 / 443 | 443 / 443 |
| M2 | Engine phát narration ở nhịp mở vòng | 1 / 37 (`GT-000`) | 37 / 37 |
| M3 | File mp3 có trong repo mà không dataset nào trỏ tới | chưa đo | đo được, và giảm |
| M4 | Item của `content_pack` có `audio_path` hoặc `spokenLabel` | chưa đo | 100% |
| M5 | Trường `phrasing.narration_template` có consumer | 0 | 1 |
| M6 | Bảng ánh xạ nhánh di sản `d1`–`d6` sang `C1`–`C6` | không có | có |

Lệnh tái lập M1 và M3:

```bash
grep -rl "audio_path" packages/content/src/skills | wc -l
find apps/web/public/audio/voice -name '*.mp3' | wc -l
```

### 1.2 Tài sản hiện có

| Nhánh | File | Nội dung |
|---|---:|---|
| `voice/common/numbers/` | 31 | `0.mp3` … `30.mp3` — đọc số tiếng Việt |
| `voice/common/` khác | 1 | — |
| `voice/d1/` | 424 | Số học: `feedback/bot` · `feedback/dem_duoc` · `feedback/tim_thay_so` · `feedback/co_n` · `feedback/tim_so_truoc` · `instruction/dem_cach` · `instruction/bot_n` … |
| `voice/d2/` | 5 | Không gian |
| `voice/d3/` | 8 | Logic |
| `voice/d4/` | 13 | Quan sát |
| `voice/d5/` | 22 | Ngôn ngữ; có `money_template` và `clock_template` vốn thuộc `C1.MEAS` của v2 |
| `voice/d6/` | 17 | Điều hành |
| **Tổng** | **742** | |

Bốn dataset đang dùng: `C1.CNT.01`, `C1.NREC.01`, `C1.NREC.03`, `C1.NREC.04` — tất cả trỏ
`/audio/voice/common/numbers/{n}.mp3`.

### 1.3 Khoản nợ 1 — cấu trúc thư mục là di sản v1

`d1`…`d6` không khớp `C1`…`C6` một cách hiển nhiên. `d5` chứa `money_template` và
`clock_template`, vốn là `C1.MEAS` trong taxonomy v2. Không có bảng ánh xạ ở đâu trong repo.

Đây là việc đầu tiên và nó chặn mọi việc sau. Bảng ánh xạ thuộc mục 7 của
[`audio-storage.md`](../specs/01-platform/audio-storage.md).

### 1.4 Khoản nợ 2 — 36 engine câm

Trường giọng sống duy nhất là `instruction_audio_path` ở cấp vòng
(`packages/game-engine/src/round-runner.ts:28`). `AudioController` chỉ được tham chiếu ở
`core.ts` và `GT-000/session.ts`. Ba mươi sáu engine còn lại không gọi narration ở nhịp nào.

Chuỗi phát đã có và chạy được: `use-play-session.ts:239` → `use-play-audio.ts:30` →
`new Audio(path).play()`, hỏng thì `audio-controller.ts:58` `speakPrompt`, không có giọng Việt
thì `fallbackVisualCue` → `[code].vue:382` nâng trợ giúp lên bậc bàn tay dẫn. Việc thiếu là **lời
gọi ở nhịp mở vòng của 36 engine**, không phải hạ tầng.

### 1.5 Khoản nợ 3 — `prompt_template` chỉ 5/37 builder đọc

Ba mươi hai builder không đọc prompt nào. Nghĩa là ngay cả kênh chữ cũng không đầy đủ. Sửa
narration mà không sửa chỗ này thì 32 engine vẫn không có gì để nói.

---

## 2. Thiết kế

### 2.1 Bảng ánh xạ nhánh di sản

Dựng một file khai bảng, không đoán lúc chạy:

```typescript
// packages/content/src/inventories/audio-legacy-map.ts
export const LEGACY_VOICE_BRANCH_MAP = {
  d1: ["C1"],
  d2: ["C2"],
  d3: ["C3"],
  d4: ["C4"],
  d5: ["C5", "C1.MEAS"],   // money_template và clock_template thuộc C1.MEAS
  d6: ["C6"],
} as const;
```

Ánh xạ **nhiều-nhiều** vì `d5` đã chứng minh không phải một-một. Mỗi file mp3 gắn với đúng một
kỹ năng hoặc một loại câu (`instruction`, `feedback`); bảng gắn cụ thể sinh một lần rồi commit.

### 2.2 Ba loại câu, ba nguồn

| Loại | Nguồn | Trường |
|---|---|---|
| Câu dẫn vòng | `voice/d*/instruction/**` | `instruction_audio_path` |
| Tên vật | `voice/common/numbers/**` cho số, `voice/d*/**` cho vật | `items[].audio_path` |
| Câu phản hồi | `voice/d*/feedback/**` | thuộc [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) |

Task này nối hai loại đầu. Loại thứ ba đã có chủ khác.

### 2.3 Nhịp gọi cho 36 engine

`instruction_audio_path` đã có ở cấp vòng và `RoundRunner` đã mang nó. Việc cần: gọi
`AudioController` ở nhịp mở vòng trong **kịch bản lượt** chung, không sửa từng engine.

Kiểm bằng `packages/game-engine/tests/gates/engine-turn.ts` — cổng kịch bản lượt đã có, thêm một
phép kiểm "nhịp mở vòng có đúng một lệnh phát câu dẫn".

Làm ở tầng kịch bản lượt thì 37 engine được cùng lúc, và không ai quên.

### 2.4 Cổng `check:narration-coverage`

Ba trục ratchet theo mục 7.4 của spec:

| Trục | Hướng |
|---|---|
| `datasets_with_audio_path` | chỉ tăng |
| `engines_with_round_narration` | chỉ tăng |
| `items_with_audio_path` | chỉ tăng |
| `orphan_audio_files` | **số đo, không ratchet** |

`orphan_audio_files` được phép tăng khi thu thêm file trước khi gắn, và được phép giảm khi xoá
file thừa. Đặt nó thành ratchet là tự chặn việc thu âm.

Cổng kiểm thêm: mọi `audio_path` trỏ tới file **tồn tại thật** trên đĩa. Chuỗi đúng mà file
không có là dạng hỏng chỉ trẻ mới phát hiện.

### 2.5 `narration_template` có consumer

`BR-STS-07` đòi mỗi trường hoặc có consumer hoặc bị xoá. Phán quyết ở mục 7.3 của
`skill-thinking-structure.md` là **giữ và nối** `narration_template` vào câu dẫn vòng.

Câu hỏi mở 2 của `play-narration.md` chưa chốt: sinh câu dẫn từ template thì 443 câu giống nhau
như prompt hiện tại. Task này nối cơ chế; nội dung câu dẫn phân biệt thuộc task `#267` cho `C1`.

---

## 3. Rủi ro

| Rủi ro | Dấu hiệu | Cách chặn |
|---|---|---|
| Gắn sai file cho sai kỹ năng | Cổng xanh, trẻ nghe câu không liên quan | Lượt nghe của người trên 20 cặp chọn ngẫu nhiên mỗi lô |
| `audio_path` đúng chuỗi, sai file | Không ai biết tới khi chơi thật | Cổng kiểm tồn tại file trên đĩa |
| Gọi narration ở từng engine thay vì ở kịch bản lượt | 37 chỗ sửa, vài chỗ quên | Sửa ở tầng kịch bản lượt; cổng `engine-turn` kiểm cả 37 |
| Autoplay bị trình duyệt chặn | Vòng đầu im lặng mà không báo | `BR-PNR-06` bắt rơi xuống tín hiệu thị giác; test khẳng định bậc 3 chạy |
| Chồng tiếng ở engine chạm nhanh | `GT-028` chạm liên tục, tiếng đè lên nhau | Câu hỏi mở 3 của spec; mặc định an toàn là chỉ phát lần chạm đầu trong vòng |
| `orphan_audio_files` bị đặt thành ratchet | Không thu thêm được file mới | Ghi rõ trong cổng: trục này là số đo |

---

## 4. Phạm vi

**Trong phạm vi**: bảng ánh xạ nhánh di sản; gắn `audio_path` cho 443 dataset từ 742 file đã có;
gọi narration ở nhịp mở vòng của kịch bản lượt chung; cổng `check:narration-coverage`; nối
`narration_template`.

**Ngoài phạm vi**: thu thêm giọng người — chi phí ngoài repo, cần chốt người đọc, xem câu hỏi mở
4 của spec. Soạn nội dung câu dẫn phân biệt — task `#267` cho `C1`. Câu phản hồi — thuộc
`feedback-and-celebration.md`.
