# Task #274 Plan: Hậu kiểm Task #273 — âm thanh câu hỏi, gợi ý, cổng chờ đọc, nói theo

> **Mục tiêu**: Sáu yêu cầu người đặt việc nêu ngày 2026-09-17 khi chơi thử GT-001 đã được Task
> #273 xử lý qua 8 commit `9ca63beb..b7e21783`. Review ngày 2026-09-19 đo lại trên code và
> database thật: **2/6 đạt, 3/6 đạt một phần, 1/6 chưa đạt**, cộng 6 lỗi mới do chính các commit
> đó đưa vào. Task này đóng phần còn lại, mỗi lát cắt một mối quan tâm.

Spec: [`play-narration.md`](../specs/04-play/play-narration.md) ·
[`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) ·
[`engines/GT-000.md`](../specs/01-platform/engines/GT-000.md) ·
[`audio-storage.md`](../specs/01-platform/audio-storage.md) ·
[`engine-turn-script.md`](../specs/01-platform/engine-turn-script.md).

Việc trước: [`269-play-narration-coverage-plan.md`](269-play-narration-coverage-plan.md) (nối mp3
có sẵn — vẫn còn 53/443 dataset).

---

## 1. Bối cảnh

### 1.1 Sáu yêu cầu và trạng thái sau #273

| # | Yêu cầu (2026-09-17) | Trạng thái | Bằng chứng |
|---|---|---|---|
| R1 | Tập nói theo là tuỳ chọn theo từng bài làm quen, không bắt buộc | **Một phần** | Có `speak_along: off\|tap` nhưng mặc định `tap` và 0/47 vòng GT-000 khai trường này → hành vi thực tế không đổi. Khi `off`, 325/325 `prompt_line` của bước `echo` vẫn hiện "Bé nói theo cô nhé: …" |
| R2 | Gợi ý không hiện khi chạm ra ngoài hoặc chạm sai một lần | **Một phần** | Chạm ra ngoài đã hết tính miss. Chạm sai một lần vẫn bật L1 highlight đáp án ở band 3–4 — đúng theo spec §7.1 (`1 miss`), nên code không sai; spec phải đổi |
| R3 | Đáp án đúng không cố định ở ô đầu | **Đạt** | Seed thật từ server; đo 20.000 seed: n=2 → 50,5/49,5%, n=3 → 33,5/33,3/33,2%. Seed cũ 0/1/2 với n=2 luôn ra ô 0 |
| R4 | Mọi câu hỏi có giọng Việt chuẩn từ mp3, rơi về TTS nhanh hơn | **Chưa** | 0/2.976 vòng GT-001 có `instruction_audio_path`, 0/992 level. TTS 0,9 → 1,0 đã làm. Máy không có giọng `vi-VN` thì mọi vòng im lặng |
| R5 | Chạm, đồng hồ, điểm chỉ bắt đầu khi máy đọc xong câu hỏi | **Một phần** | Đạt cho mọi engine trừ GT-000 — GT-000 settle ngay lúc mở vòng (`use-play-session.ts:300-303`), trong khi bước `recognise`/`recall` của nó giờ có đọc câu hỏi |
| R6 | Chạm lại hình minh hoạ đọc lại từ khoá | **Đạt, chỉ TTS** | Chạy qua `spokenLabel` → Web Speech. Không có đường mp3 cho từ khoá GT-001; 25/182 glyph không có tên tiếng Việt nên TTS đọc glyph thô |

### 1.2 Phép đo mở đầu (đo 2026-09-19, DB dev)

| # | Phép đo | Hiện tại | Đích |
|---|---|---|---|
| M1 | Vòng GT-001 có `instruction_audio_path` | 0 / 2.976 | 2.976 / 2.976 |
| M2 | Asset GT-000 có `audio_path` | 37 / 325 | 325 / 325 |
| M3 | Glyph GT-001 (distinct) không có tên tiếng Việt | 25 / 182 | 0 |
| M4 | Vòng GT-000 khai `speak_along` | 0 / 47 | quyết định ở D-274-2 |
| M5 | Vòng GT-001 có `target_item.item_id` trùng id một lựa chọn | 2.976 / 2.976 | không còn là vấn đề sau S1a |
| M6 | `check:narration-coverage` | exit 0, "37/37 engine có narration" | đo được M1, M2, M3 |
| M7 | L1 band 3–4 theo miss | 1 miss | quyết định ở D-274-1 |

Lệnh tái lập M1, M5 (Postgres dev chạy trong container `mindkid-db-1`):

```bash
docker exec mindkid-db-1 psql -U postgres -d mindkid -c "
select count(*) rounds,
  count(*) filter (where coalesce(r.instruction_audio_path,'')<>'') with_mp3,
  count(*) filter (where exists (select 1 from jsonb_array_elements(r.content_pack->'options') o
    where o->>'item_id' = r.content_pack->'target_item'->>'item_id')) dup_id
from game_level_rounds r join game_levels l on l.id = r.game_level_id
where l.template_code = 'GT-001' and l.status = 'published';"
```

### 1.3 Lỗi do chính #273 đưa vào (review 2026-09-19)

| # | Lỗi | Chỗ | Hậu quả |
|---|---|---|---|
| E1 | Thẻ đề giữa màn dùng `id = target_item.item_id`, trùng id đáp án đúng ở mọi vòng | `GT-001/session.ts:212` | Hai `ViewEntity` cùng id → `v-for :key="entity.id"` trùng khoá ở `[code].vue:169`; screen reader nghe hai nút cùng tên |
| E2 | Tự sang vòng sau 900ms không neo vào vòng đã thắng | `use-play-session.ts:248-253` | Bấm "Bỏ qua" trong 900ms đó → vòng N bị ghi `skipped` dù đã thắng, và vòng N+1 bị `completeCurrentRound()` đóng ngay khi vừa mở. Không test nào phủ đường này |
| E3 | mp3 lỗi chạy TTS hai lần | `use-play-audio.ts:114-122` | `<audio>` lỗi phát CẢ `error` lẫn reject `play()` → `speakOrSettle()` gọi hai lần; lần hai `cancel()` lần một, và trên Chrome lần một nhận `onerror` (`interrupted`) → settle sớm, mở cử chỉ khi TTS còn đang đọc. Đang ngủ vì M1 = 0, sẽ nổ khi S6 thêm mp3 |
| E4 | ~~Vùng chạm GT-001 co lại~~ — **rút lại khi thi công S1d** | `GT-001/session.ts:265-271` | Bản trước: hình vuông nửa cạnh `max(hitW,w)/2 + 24`. Bản mới: hình tròn bán kính `min(hitW,hitH)/2 + 24`. Review tính diện tích mất khoảng −21%, nhưng GT-001 vẽ **token tròn** (`drawSlotItem(..., "circle")`), nên bốn góc bị bỏ nằm ngoài token khoảng 55px — hình tròn mới là hình khớp. Còn lại một lỗi nhỏ: comment "hằng số 8 tự chọn ở đây" không khớp lịch sử git |
| E5 | Hai hình học chạm lệch nhau | `use-play-gesture.ts:80` | Chọn dùng `hitW/2 + 24`, đọc từ khoá dùng `w/2 + 10` → vành 14px chọn được mà không đọc tên |
| E6 | Settle không mang danh tính vòng | `use-play-session.ts:313-321`, `use-play-audio.ts:43-48` | Hẹn giờ 600ms không bị huỷ khi rời trang hay chơi lại; closure đọc `engine`/`roundRunner` hiện hành nên câu dẫn cũ có thể mở cổng của vòng mới |

---

## 2. Quyết định — giả định đã ghi, người đặt việc sửa nếu sai

| Mã | Giả định | Vì sao | Đổi lại tốn gì |
|---|---|---|---|
| `D-274-1` | Band 3–4: L1 theo miss từ `1` lên `2`, L2 `3`, L3 `4`. Ngưỡng thời gian giữ nguyên | Với 2–3 lựa chọn, highlight sau 1 lần sai là đưa đáp án. Người đặt việc nêu đích danh "click sai 1 lần" | Một dòng trong `SCAFFOLDING_BY_BAND` + §7.1 spec |
| `D-274-2` | `speak_along` mặc định `off`; bài cần tập phát âm khai `tap` tường minh | "Trò nào cũng bắt buộc" là lời phàn nàn; tuỳ chọn theo bài nghĩa là opt-in. Bước `echo` vẫn còn trong content (`BR-E000-10` không đổi) | Một dòng `.default()` |
| `D-274-3` | mp3 câu hỏi và từ khoá **sinh sẵn lúc build** bằng một TTS API tiếng Việt, lưu vào storage. Runtime: mp3 → Web Speech (rate 1,0) → tín hiệu thị giác. Cấm — NEVER gọi TTS API từ máy của trẻ lúc chơi | Gọi API lúc chơi thêm độ trễ vào cổng chờ đọc (`BR-PNR-11`), tốn tiền mỗi lượt chơi và cần mạng. Sinh sẵn cho cùng một giọng ở mọi thiết bị | Chọn nhà cung cấp là câu hỏi mở (mục 6) — không chặn S1–S5 |
| `D-274-4` | GT-000 áp `BR-PNR-11` ở **mức bước**: bước `recognise`/`recall`/`link` chặn cử chỉ tới khi `prompt_line` đọc xong | R5 áp cho mọi câu hỏi; GT-000 là bài trẻ gặp đầu tiên | Một cờ trong session GT-000 |

---

## 3. Lát cắt

Mỗi lát một commit (hoặc một PR), một mối quan tâm. Cấm — NEVER gộp lát.

### S1 — Sửa lỗi hồi quy của #273 (E1–E6)

Không đổi spec: đây là sửa code cho khớp luật đã có.

- **S1a (E1)** — id thẻ đề là `prompt:${item_id}`. Thêm test chung cho mọi template: id trong
  `getView().entities` là duy nhất.
- **S1b (E2)** — hẹn giờ tự sang vòng giữ `roundIndex` lúc thắng, chỉ gọi `completeCurrentRound()`
  khi vòng hiện tại vẫn là vòng đó; huỷ ở `cleanupSession()`. Test **nhiều vòng**: thắng vòng 1 →
  vòng 2 mở → câu dẫn vòng 2 được phát → settle → cử chỉ mở.
- **S1c (E3)** — mỗi bậc phát chỉ rơi xuống bậc sau một lần (cờ `fellBack`). Test ca âm: `onerror`
  và `play()` reject cùng bắn.
- **S1d (E4, E5)** — GT-001 giữ hình tròn (khớp token đang vẽ), dung sai lấy từ hằng
  `TAP_TOLERANCE_PX`; bề mặt web tìm entity bị chạm bằng **cùng** primitive `hit-test.ts`
  (`findHitEntity`) với cùng dung sai, không tự tính bán kính.
- **S1e (E6)** — `onSettled` mang token vòng (`runner` + `roundIndex`); token lệch thì bỏ qua. Hẹn
  giờ 600ms huỷ ở `cleanupSession()` và khi chơi lại.

### S2 — GT-000 chờ đọc xong ở mức bước (`D-274-4`)

`playStepPrompt()` truyền `onEnd`; session giữ cờ `promptSettled` theo bước; `toAction()` trả
`null` khi chưa settle. Trần 12s như `NARRATION_SETTLE_TIMEOUT_MS`. Sửa `GT-000.md` §5 trước.

### S3 — Ngưỡng gợi ý (`D-274-1`)

Sửa `scaffolding-and-hints.md` §7.1 và scenario `BR-SCF-05` trước, rồi `SCAFFOLDING_BY_BAND`.
Test: band 3–4, 1 lần sai → L0; 2 lần sai → L1.

### S4 — `speak_along` trọn vẹn (`D-274-2`)

- Mặc định `off`.
- Khi `off`: chữ trên màn **và** lời đọc của bước `echo` đổi thành câu trình bày ("Đây là …"),
  không còn "Bé nói theo cô nhé". Chọn câu ở session, không sửa 325 `prompt_line` trong content.
- Kiểm trường có hiện trong form admin sửa level; `config-dictionary.ts:517` đang nói "Có/Không"
  trong khi giá trị là `tap`/`off` — sửa help cho khớp.

### S5 — Cổng đo mp3 thật

`check:narration-coverage` hiện đếm "engine có gọi narration" — TTS cũng tính. Thêm ba trục ratchet:
`rounds_with_instruction_audio` theo template (M1), `assets_with_audio` (M2),
`glyphs_without_vi_name` (M3). Ca âm: fixture một vòng mất `instruction_audio_path` → cổng đỏ.

### S6 — Sinh mp3 câu hỏi và từ khoá (`D-274-3`)

1. Nối 700 file mp3 mồ côi có sẵn trước (tiếp Task #269) — không tốn tiền.
2. Script build sinh mp3 cho câu dẫn vòng (`content_pack.prompt` / `instruction`) và cho từ khoá,
   khoá theo hash nội dung để không sinh lại.
3. Seeder ghi `instruction_audio_path`; hợp đồng asset (`contracts/shared-fields.ts`) thêm
   `audio_path` tuỳ chọn cho `emoji`/`text` — sửa `audio-storage.md` trước.

### S7 — Đọc lại từ khoá ưu tiên mp3

`handleVerdict` phát `audio_path` của entity nếu có, rồi mới TTS. Đặt tên tiếng Việt cho 25 glyph
thiếu. Glyph lặp (`🍎🍎🍎`) đọc thành cụm đếm ("ba quả táo") — chuyển `formatSpokenLabel` của
GT-000 thành helper dùng chung thay vì `resolveAssetLabels` riêng của GT-001. Cấm — NEVER đọc glyph
thô khi thiếu tên: bỏ `spokenLabel`, để bậc thị giác lo.

### S8 — Độ tin cậy của Web Speech

`speech-synthesis-adapter.ts`:
- Giữ tham chiếu utterance trên instance — Chrome có thể thu gom utterance cục bộ trước khi
  `onend` bắn, khi đó cổng chờ đọc khoá cử chỉ tới hết 10s dự phòng.
- Utterance bị `cancel()` cắt ngang kết thúc bằng `onEnd` đúng một lần, không bằng `onError` — nó bị
  thay, không lỗi. Hiện nó nhận `onerror` trễ từ Chrome, gọi `onError` (tín hiệu thị giác) và
  `cleanup()` của nó xoá luôn hẹn giờ an toàn của utterance mới.
- `addEventListener("voiceschanged")` thay cho gán `onvoiceschanged`: mỗi `AudioController` mới
  (GT-000 tạo một cái mỗi vòng) đang ghi đè listener của `engine.audio`.

Đo trên máy thật trước và sau: Chrome Android, Safari iOS, Chrome Windows không có giọng `vi-VN`.

---

## 4. Thứ tự

S1 → S8 → S5 → S3 → S4 → S2 → S7 → S6. S1 và S8 là lỗi đang chạy trên bề mặt trẻ. S5 dựng thước
đo trước khi đổ mp3 (S6), để S6 có số để tick.

## 5. Không làm trong task này

- Nhận diện giọng trẻ. `BR-CIM-10` cấm mở micro; đổi luật này là quyết định pháp lý, không phải
  kỹ thuật.
- Hợp nhất hit-test cục bộ của GT-014..GT-021 — nợ riêng, mỗi template một task.

## 6. Trạng thái sau thi công (2026-09-19)

Xong: S1a–S1e, S8 (trừ đo trên máy thật), S5, S3, S4, S2, S7a–S7c, S6a. Chi tiết từng ô ở
[`274-play-surface-audio-hint-followup-todo.md`](274-play-surface-audio-hint-followup-todo.md).

Còn chặn:

- **S6 phần sinh mp3** — chờ câu hỏi mở 1 (nhà cung cấp TTS, API key, chi phí, giấy phép). Cổng
  `check:narration-coverage` đã đo được: 0/19.046 vòng có mp3 câu dẫn.
- **S8 đo trên máy thật** — Chrome Android, Safari iOS, Chrome Windows không có giọng `vi-VN`.
- **DB dev chưa `db:seed` lại** — S6a đổi nội dung GT-001 (591 vòng có mp3 từ khoá).

Phát hiện mới khi thi công, chưa sửa vì là quyết định hợp đồng:

- **E7 — thẻ đề GT-001 vẽ đúng đáp án.** 2.976/2.976 vòng: `target_item.asset` trùng asset của
  lựa chọn đúng. Spec GT-001 §4 N2 chủ ý vẽ "hình của thứ đang hỏi" trong khung câu hỏi — hợp với
  câu "tìm cái giống", nhưng với câu như "Gộp lại có tất cả bao nhiêu số năm?" thẻ đề hiện luôn
  chữ `5`, tức đáp án nằm sẵn trên màn. Cần người đặt việc chốt: thẻ đề vẽ câu hỏi (vd hai nhóm
  cần gộp) hay bỏ thẻ đề với dạng câu hỏi tính toán.

## 7. Câu hỏi mở

1. Nhà cung cấp TTS để sinh mp3 (S6): giọng, giấy phép dùng cho sản phẩm trẻ em. Khối lượng GT-001
   nhỏ: 2.976 vòng chỉ có **413 câu dẫn khác nhau** và **303 từ khoá khác nhau** (đo 2026-09-19);
   36 engine còn lại chưa đo.
2. `D-274-2` đảo mặc định cho **mọi** bài làm quen. Nếu người đặt việc muốn giữ `tap` cho phân đoạn
   dạy phát âm, cần danh sách level.
