---
spec: PLAY-NARRATION
title: Giọng đọc trên bề mặt trẻ — mọi yêu cầu phải nghe được trước khi đọc được
area: play
status: approved
mvp: true
phase: P1
reviewed: 2026-10-18
open_tasks:
  - "#316"
owns:
  - Hợp đồng phát giọng Việt cho mọi yêu cầu và mọi vật trên bề mặt trẻ
  - Thứ tự dự phòng khi không phát được file tiếng
  - Độ phủ giọng bắt buộc theo band tuổi và theo engine
  - Cổng `check:narration-coverage`
depends_on:
  - AUDIO-STORAGE
  - SKILL-DATASET-MODEL
  - GAME-CONFIG-DELIVERY
  - SCAFFOLDING-AND-HINTS
  - ACCESSIBILITY
---

# Giọng đọc trên bề mặt trẻ

> **Chưa hoàn thành** — Cổng `check:narration-coverage` xanh ở tầng gọi nhịp mở vòng (38/38 engine), nhưng toàn bộ kho âm thanh đang được chuyển sang một giọng cô giáo mầm non miền Bắc thống nhất `/audio/voice/{stem}.mp3` và gỡ bỏ hoàn toàn JS Web Speech API (`BR-PNR-05`, `BR-PNR-06`). Việc còn lại: [Task #316](../../tasks/316-preschool-teacher-voice-narration-plan.md).

## 1. Objective

Trẻ 3–6 tuổi chưa đọc được chữ. Một yêu cầu hiện bằng chữ trên bề mặt trẻ là một yêu cầu chưa
được truyền đạt. Đây không phải một tính năng phụ trợ khả năng tiếp cận — với nhóm tuổi này nó là
kênh chính, và chữ viết mới là kênh phụ.

Trước Task `#316`, nền tảng có **742 file mp3 giọng Việt** rời rạc dưới `apps/web/public/audio/voice/`
(`common/numbers/`, `d1/`…`d6/`) và chỉ **4/443** dataset kỹ năng gắn `audio_path`; phần còn lại rơi
xuống giọng tổng hợp trình duyệt (`window.speechSynthesis`) vốn phát âm khô cứng, sai ngữ điệu mầm non
và gây hiện tượng hai giọng khác nhau trong cùng một bài học.

Quyết định sản phẩm tại [Task #316](../../tasks/316-preschool-teacher-voice-narration-plan.md) chốt hai
bất biến mới: (1) loại bỏ hoàn toàn JS Web Speech API khỏi runtime, và (2) chuẩn hoá toàn bộ câu dẫn
vòng, thẻ khái niệm `GT-000`, tên số, tên vật, lời khen và lý do pill Montessori về **một kho giọng cô
giáo mầm non miền Bắc duy nhất** tại `/audio/voice/{stem}.mp3`, tra cứu qua đường dẫn tường minh hoặc
hàm băm tất định `resolveTeacherVoicePath(text)` của `@mindkid/shared/voice-path`.

Spec này đặt hợp đồng: cái gì phải nói được, nói bằng nguồn nào, và điều gì xảy ra khi không nói
được. [`audio-storage.md`](../01-platform/audio-storage.md) sở hữu pipeline lưu trữ và chuẩn hoá
asset; spec này sở hữu hợp đồng **phát** trên bề mặt trẻ.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ 3–6 tuổi | không cần đăng nhập tới tier `free` | Nghe yêu cầu, nghe tên vật, bấm nghe lại |
| Người biên soạn | `content_author` | Gắn `audio_path` / `instruction_audio_path` hoặc kiểm duyệt kho giọng `/audio/voice/` |
| Dev engine | — | Gọi narration ở đúng nhịp của kịch bản lượt |
| Cổng kiểm tra | — | `check:narration-coverage` (đã gỡ 2026-10-31 cùng `scripts/check.sh`; không còn cổng tự động) |

## 3. Entry points

| Route / file | Actor | Ghi chú |
|---|---|---|
| `/play/:code` | Trẻ | Nút "Nghe lại" ở HUD, `apps/web/app/pages/play/[code].vue` |
| `packages/shared/src/voice-path.ts` | Dev / CLI | `TEACHER_VOICE_PROFILE`, `resolveTeacherVoicePath`, `toSpokenVietnameseScript` |
| `apps/web/app/composables/play/use-play-audio.ts` | Dev | `playInstructionNarration`, `preloadPlayAssets` |
| `packages/game-engine/src/systems/audio-controller.ts` | Dev | Phát file `.mp3` giọng cô giáo và kích hoạt dự phòng thị giác |
| `apps/web/public/audio/voice/*.mp3` | Dev / Nội dung | Kho `.mp3` giọng cô giáo mầm non miền Bắc thống nhất |
| `scripts/check-narration-coverage.ts` | CI / Dev | Script cổng đối chiếu độ phủ file `.mp3` |

## 4. Main flow

1. Client tải cấu hình màn chơi; payload mang `instruction_audio_path` cho vòng và `audio_path`
   cho từng item của `content_pack` (hoặc suy dẫn tất định qua `resolveTeacherVoicePath(text)` khi
   chưa khai tường minh).
2. `preloadPlayAssets` nạp trước file `.mp3` của vòng hiện tại, giới hạn 3 giây mỗi asset và 5 giây tổng.
3. Vòng bắt đầu. Trước khi trẻ chạm được vào bất cứ thứ gì, engine phát câu dẫn `.mp3` của vòng.
4. Trẻ chạm một vật. Engine phát tên vật đó từ file `.mp3` trong kho `/audio/voice/{stem}.mp3`.
5. Trẻ bấm "Nghe lại" bất kỳ lúc nào. Engine phát lại câu dẫn của vòng, không phát lại tên vật.
6. Hết vòng, engine phát câu phản hồi thuộc [`feedback-and-celebration.md`](feedback-and-celebration.md)
   từ cùng kho giọng cô.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Thiếu hoặc hỏng file | `instruction_audio_path`, `audio_path`, hoặc file tại `resolveTeacherVoicePath(text)` không tồn tại, tải hỏng, hay quá hạn 3 giây | Rơi thẳng xuống bậc 2 của thứ tự mục 7.2 (tín hiệu thị giác: bàn tay dẫn `ghostHand` và nhấp nháy khung yêu cầu 1200 ms); không gọi giọng tổng hợp trình duyệt |
| Trẻ tắt tiếng thiết bị | Trình duyệt hoặc hệ điều hành tắt tiếng / chặn phát | Bậc 2 tín hiệu thị giác chạy ngay; không hiện hộp thoại đòi bật tiếng |
| Trình duyệt chặn autoplay | Chưa có tương tác người dùng | Câu dẫn hoãn tới lần chạm đầu tiên, và lần chạm đó không tính là lượt trả lời |
| Nạp trước quá hạn | Quá 5 giây tổng | Vòng vẫn bắt đầu; narration phát khi sẵn sàng, không chặn màn chơi |
| Trẻ chạm trong lúc câu dẫn đang đọc | Câu dẫn mở vòng chưa đọc xong | Cử chỉ bị nuốt hoàn toàn — không tới session, không tính miss, không tính lượt (`BR-PNR-11` — đồng hồ chờ câu dẫn đọc xong) |
| Câu dẫn không bao giờ báo xong | File `.mp3` bị treo trên mạng yếu hoặc trình duyệt không phát sự kiện `onended` | Sau `NARRATION_SETTLE_TIMEOUT_MS` (12s) vẫn coi là đã đọc xong — mở cử chỉ, bắt đầu đồng hồ (`BR-PNR-09` — không chặn màn chơi, `BR-PNR-11`) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PNR-01` (nghe được trước khi đọc được) | Mọi yêu cầu hiển thị trên bề mặt trẻ BẮT BUỘC có một đường phát thành tiếng từ file `.mp3` giọng cô giáo. Cấm — NEVER có yêu cầu chỉ tồn tại dưới dạng chữ | Nhóm tuổi mục tiêu chưa đọc được; một yêu cầu chỉ có chữ là một yêu cầu không tồn tại với phần lớn người dùng |
| `BR-PNR-02` (mọi vật có tên đọc được) | Mọi item của `content_pack` trên bề mặt trẻ BẮT BUỘC có `audio_path` hoặc `spokenLabel` ánh xạ tới file `.mp3` có thật trong kho giọng | Trẻ chạm một vật rồi không biết nó là gì thì bài mất một nửa giá trị dạy từ |
| `BR-PNR-03` (một nguồn giọng cho một vòng) | Câu dẫn của vòng lấy từ đúng một trường cấu hình: `instruction_audio_path` (với dự phòng đường dẫn tất định `resolveTeacherVoicePath(prompt)` khi trống). Cấm — NEVER thêm trường giọng song song ở cấp vòng | Đã có ba trường từng cùng tồn tại (`prompt_audio_ref`, `audio_url`); cổng `one-narration-source` được dựng chính vì drift đó |
| `BR-PNR-04` (mọi engine đều nói) | Cả 38 engine (`GT-000`…`GT-037`) BẮT BUỘC phát câu dẫn ở nhịp mở vòng, không chỉ `GT-000` | Một nền tảng mầm non mà chỉ bài làm quen biết nói thì phần chơi chính không dùng được cho trẻ ba tuổi |
| `BR-PNR-05` (một giọng cô giáo miền Bắc thống nhất) | Toàn bộ câu dẫn vòng, tên số, tên vật, lời khen và lý do pill Montessori BẮT BUỘC dùng chung một kho phẳng `/audio/voice/{stem}.mp3` (giọng `vieneu-myduyen`), trỏ qua `instruction_audio_path` / `audio_path` hoặc `resolveTeacherVoicePath(text)`. Tên file suy tất định từ chính câu chữ (mục 7.1) nên một câu chỉ có một file, mọi nơi nói câu đó dùng chung. Cấm — NEVER tạo thư mục con theo domain/kỹ năng, Cấm — NEVER trộn giọng khác trong cùng phiên học | Hai giọng người khác nhau giữa câu hỏi ("Chọn số ba") và lúc chạm vật ("Số ba") phá vỡ cảm giác có một cô giáo thật đang đồng hành cùng trẻ |
| `BR-PNR-06` (dự phòng thị giác, cấm im lặng và cấm giọng robot) | Khi không phát được file `.mp3`, hệ thống BẮT BUỘC rơi xuống bậc 2 của mục 7.2: nâng trợ giúp lên bàn tay dẫn (`ghostHand`) và nhấp nháy khung yêu cầu 1200 ms. Cấm — NEVER gọi `window.speechSynthesis`, Cấm — NEVER kết thúc bằng im lặng | Giọng tổng hợp trình duyệt đọc sai thanh điệu và ngắt nghỉ cơ học gây phản cảm sư phạm; còn im lặng với trẻ ba tuổi là bế tắc hoàn toàn |
| `BR-PNR-07` (nghe lại luôn có) | Nút "Nghe lại" BẮT BUỘC có mặt và bấm được ở mọi vòng, mọi engine, kể cả khi câu dẫn đang phát | Trẻ nghe sót là chuyện thường; bắt trẻ chờ hết câu mới được nghe lại là bắt trẻ đoán |
| `BR-PNR-08` (nghe lại không phạt) | Bấm "Nghe lại" BẮT BUỘC không tính là lượt sai, không làm leo bậc trợ giúp, không trừ điểm | Phạt việc hỏi lại dạy trẻ đoán bừa thay vì hỏi |
| `BR-PNR-09` (không chặn màn chơi) | Narration BẮT BUỘC bất đồng bộ với vòng đời vòng chơi; quá hạn nạp thì vòng vẫn bắt đầu | Một vòng treo chờ file mp3 trên mạng yếu là một vòng hỏng |
| `BR-PNR-10` (độ phủ có ratchet) | `scripts/narration-coverage-baseline.json` ghi số dataset có `audio_path`, số vòng có file `.mp3` hợp lệ và số engine phát narration; các chỉ số độ phủ chỉ được tăng | Không có ratchet thì độ phủ thu âm dễ tụt lùi khi biên soạn thêm bài mới |
| `BR-PNR-11` (đồng hồ chờ câu dẫn đọc xong) | Cử chỉ của trẻ, `hint_after_ms`, và `duration_ms` của vòng BẮT BUỘC chỉ tính từ lúc câu dẫn **đọc xong** (thành công, rơi xuống bậc dự phòng thị giác, hay quá hạn — không bao giờ quá `NARRATION_SETTLE_TIMEOUT_MS = 12s`), không phải từ lúc mở vòng. Cử chỉ chạm trong lúc đang đọc bị nuốt hoàn toàn — Cấm — NEVER tính là lượt trả lời, Cấm — NEVER tính miss | Người đặt việc yêu cầu 2026-09-17: "tính thời gian, tính điểm chỉ bắt đầu khi máy đọc xong câu hỏi". Trước đó đồng hồ trợ giúp và bộ đếm giờ chạy song song với câu dẫn, nên câu dẫn dài ăn mất phần "thời gian trẻ thật sự có để nghĩ" trong ngưỡng leo thang |
| `BR-PNR-13` (một kênh giọng, tên vật không lặp) | Một lúc chỉ một giọng cô: câu dẫn (kể cả "Nghe lại") dừng tên vật / khích lệ đang đọc và huỷ chuỗi nối của chúng; tên vật / khích lệ dừng mp3 "Nghe lại" đang đọc. Tên vật đọc khi trẻ chạm, trừ khi: trả lời đúng (chỉ âm pop), vừa đọc chính vật đó trong `ENTITY_NAME_REPEAT_MS = 1500`, cổng cử chỉ đóng (đang đọc câu dẫn, đã thắng vòng), hoặc câu khích lệ / pill của lần sai trước còn chờ — câu đó Cấm bị cắt | Trẻ chạm dồn dập (GT-028) làm giọng cô lặp và chồng; câu pill đã lấy bằng `takePillNarration()` bị cắt mất (Task #320) |
| `BR-PNR-12` (pill Montessori nghe được) | Chữ trên pill Montessori (lý do control-of-error, tiến độ khám phá) BẮT BUỘC có lời đọc `.mp3` đi kèm từ kho giọng cô: engine trả lời qua `takePillNarration()` đúng một lần cho mỗi nội dung mới, bề mặt chơi phát file tại `resolveTeacherVoicePath(pillText)` sau mỗi verdict sai. Tiến độ đọc bằng lời ("hai trên năm"), Cấm — NEVER đọc ký hiệu "(2/5)". Lời pill thay câu khích lệ chung của quy tắc `BR-FBK-13` — khích lệ nhẹ khi thử lại trong [`feedback-and-celebration.md`](feedback-and-celebration.md), không đọc cả hai | `BR-PNR-01` — pill là chữ, trẻ chưa đọc thì lý do cụ thể ("Toa thứ 2 chưa đúng nhịp") không tới được |

## 7. Data

**Đọc:** `content_pack.items[].audio_path`; `audio_path` tuỳ chọn trên asset `emoji`/`text` của
engine chạm-chọn (`assetSchema` chung, Task `#274` — tên vật đọc lại khi trẻ chạm lại hình minh
hoạ); `instruction_audio_path` của vòng; đường dẫn tất định `resolveTeacherVoicePath(text)` từ
`@mindkid/shared/voice-path`; file `apps/web/public/audio/voice/{stem}.mp3`.
**Ghi:** `packages/content-build/src/voice/voice-manifest.json` và `voice-catalog.json`.

Chạm lại một hình minh hoạ đọc tên vật theo cùng thang bậc của mục 7.2: `audio_path` của asset →
file `.mp3` tại `resolveTeacherVoicePath(spokenLabel)` → không phát được file thì không phát âm thanh
rác (Cấm — NEVER gọi JS Web Speech API, Cấm — NEVER đưa glyph thô đi băm đường dẫn giọng).

### 7.1 Tài sản âm thanh — một kho phẳng, tên file là câu chữ

Trước Task `#316` (đo ngày 2026-09-11), repo có `742` file `.mp3` rời rạc dưới `voice/common/numbers/`
(`31` file) và `voice/d1/`…`voice/d6/` (`489` file theo mã domain cũ). Từ 2026-11-26 các file đó đã bị
xoá; toàn bộ tài sản phát ở runtime nằm phẳng trong một thư mục, tên file đọc được và suy từ câu chữ:

| Đường dẫn | Vai trò | Quy ước định danh |
|---|---|---|
| `/audio/voice/{stem}.mp3` | Kho `.mp3` giọng cô giáo cho toàn bộ level, bài `GT-000`, tên số, tên vật, lời khen, pill Montessori và lời ba mẹ | `stem = voiceFileStem(text)`: `normalizeVoiceLookupKey(text)` (NFC, chữ thường, gộp khoảng trắng, bỏ dấu chấm cuối) giữ nguyên dấu tiếng Việt, mọi cụm ký tự không phải chữ/số thay bằng `-`. Quá `60` ký tự thì cắt ở ranh giới từ và nối `-{hash8}` với `hash8 = sha256("teacher-v1:" + key).slice(0, 8)` |
| `packages/content-build/src/voice/voice-manifest.json` | Sổ cái đối chiếu câu gốc, kịch bản đọc `toSpokenVietnameseScript`, engine, tốc độ, thời lượng | CLI `voice:generate` cập nhật idempotent khi thêm bài mới |

Hai câu chỉ khác chữ hoa/thường, khoảng trắng hay dấu câu (vd. "xe ô tô con" / "Xe ô-tô con") cùng một
`stem` nên dùng chung một file — đó là chủ đích. URL tới file là chuỗi Unicode NFC; trình duyệt tự
percent-encode khi tải.

Quy trình chuẩn hoá LUFS, bitrate và lưu trữ tuân theo mục 7 của
[`audio-storage.md`](../01-platform/audio-storage.md).

### 7.2 Thứ tự dự phòng — hai bậc (gỡ bỏ hoàn toàn JS Web Speech API)

| Bậc | Nguồn | Điều kiện chuyển xuống bậc dưới |
|---|---|---|
| 1 | File `.mp3` giọng cô giáo mầm non thật thống nhất (`/audio/voice/{stem}.mp3`), trỏ bởi `instruction_audio_path`, `audio_path` hoặc đường dẫn tất định `resolveTeacherVoicePath(text)` | File không có, tải hỏng, trình duyệt chặn phát, hoặc quá hạn 3 giây |
| 2 | Tín hiệu thị giác: nâng trợ giúp lên bậc bàn tay dẫn (`ghostHand`) và nhấp nháy khung yêu cầu `1200 ms` (`BR-PNR-06`) | Không có — đây là bậc cuối, luôn chạy được |

Không còn bậc tổng hợp giọng trình duyệt (`window.speechSynthesis`) và không có bậc im lặng
(`BR-PNR-06`). Quyết định Task `#316` loại bỏ hẳn Web Speech API vì chất lượng giọng máy khác biệt
giữa các hệ điều hành, phát âm cứng, sai ngữ điệu tiếng Việt mầm non và gây rò rỉ hai giọng khác nhau
trong cùng một bài chơi.

### 7.3 Độ phủ bắt buộc theo band tuổi

| Band | Câu dẫn vòng | Tên vật | Câu phản hồi |
|---|---|---|---|
| `3-4` | Có | Có | Có |
| `4-5` | Có | Có | Có |
| `5-6` | Có | Có với vật mới; với vật đã gặp trong cùng phiên thì không bắt buộc | Có |

Ô `Có` nghĩa là bắt buộc. Không band nào được miễn câu dẫn — trẻ năm tuổi đọc được vài chữ không
có nghĩa là đọc được câu.

### 7.4 Hình dạng ratchet

```jsonc
// scripts/narration-coverage-baseline.json
{
  "datasets_with_audio_path": 4,
  "datasets_total": 443,
  "engines_with_round_narration": 38,
  "engines_total": 38,
  "items_with_audio_path": 0,
  "orphan_audio_files": 0
}
```

`orphan_audio_files` đếm file mp3 không được câu dẫn hay item nào trỏ tới. Số này **được phép giảm** khi
xoá file thừa và **được phép tăng** khi sinh trước file trong CLI trước khi gắn; nó là số đo, không phải
ratchet. Các chỉ số độ phủ còn lại chỉ được đi theo chiều tốt lên.

## 8. API contract

Không có route mới. `audio_path` và `instruction_audio_path` đi theo payload của
`GET /api/guest/levels/{code}/config` và `GET /api/users/levels/{code}/config`; hình dạng payload
do [`game-config-delivery.md`](game-config-delivery.md) sở hữu.

File mp3 phục vụ tĩnh từ `apps/web/public/audio/voice/*.mp3` (một cấp, không thư mục con) theo đường
dẫn tuyệt đối `/audio/voice/{stem}.mp3`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PNR-01 — vòng không có đường phát tiếng thì cổng đỏ
  Given một game level có content_pack không mang instruction_audio_path
  And file tất định tại resolveTeacherVoicePath(prompt) cũng không tồn tại
  When chạy pnpm check:narration-coverage
  Then cổng thoát khác 0
  And báo cáo nêu đúng mã level không có file mp3 giọng cô giáo

Scenario: BR-PNR-02 — item không có tên đọc được thì cổng đỏ
  Given content_pack của một vòng có một item không có audio_path và không có spokenLabel
  When chạy pnpm check:narration-coverage
  Then cổng thoát khác 0
  And báo cáo nêu đúng id item thiếu

Scenario: BR-PNR-04 — engine không phát câu dẫn ở nhịp mở vòng thì cổng đỏ
  Given engine GT-012 dựng một vòng có instruction_audio_path
  When chạy kịch bản lượt của GT-012 tới nhịp mở vòng
  Then AudioController nhận đúng một lệnh phát câu dẫn

Scenario: BR-PNR-05 — trộn file ngoài kho giọng cô giáo thống nhất thì cổng đỏ
  Given một vòng hoặc item khai audio_path trỏ vào thư mục con dưới /audio/voice/ (vd. /audio/voice/common/numbers/1.mp3)
  When chạy pnpm check:narration-coverage
  Then cổng thoát khác 0
  And báo cáo nêu đường dẫn nằm ngoài kho phẳng /audio/voice/{stem}.mp3

Scenario: BR-PNR-06 — file mp3 tải hỏng thì rơi thẳng xuống tín hiệu thị giác, không gọi giọng robot
  Given file mp3 tại instruction_audio_path và resolveTeacherVoicePath đều tải lỗi
  When vòng bắt đầu
  Then window.speechSynthesis Cấm — NEVER được gọi
  And trợ giúp được nâng lên bậc bàn tay dẫn ghostHand
  And khung yêu cầu nhấp nháy trong 1200 ms

Scenario: BR-PNR-08 — bấm nghe lại không bị tính là sai
  Given trẻ đang ở một vòng với 0 lượt sai
  When trẻ bấm Nghe lại ba lần liên tiếp
  Then số lượt sai của vòng vẫn là 0
  And bậc trợ giúp không đổi

Scenario: BR-PNR-09 — nạp audio quá hạn thì vòng vẫn bắt đầu
  Given file mp3 của vòng phản hồi sau 6 giây
  When trẻ vào màn chơi
  Then vòng bắt đầu trong vòng 5 giây
  And màn chơi nhận được tương tác chạm trước khi audio sẵn sàng

Scenario: BR-PNR-10 — độ phủ giọng đi lùi thì cổng đỏ
  Given ratchet ghi datasets_with_audio_path là 200
  And corpus hiện đo ra 199
  When chạy pnpm check:narration-coverage
  Then cổng thoát khác 0
  And báo cáo nêu độ phủ giảm từ 200 xuống 199

Scenario: BR-PNR-12 — lý do trên pill được đọc bằng mp3 giọng cô giáo đúng một lần
  Given GT-006 vừa nộp sai dãy và pill hiện lý do
  When bề mặt chơi gọi takePillNarration
  Then trả về đúng chữ lý do trên pill để tra resolveTeacherVoicePath
  And lần gọi kế tiếp trả null cho tới khi lý do đổi

Scenario: BR-PNR-11 — chạm trong lúc câu dẫn đang đọc bị nuốt, không tính miss
  Given vòng vừa mở, câu dẫn mp3 đang phát và chưa đọc xong
  When trẻ chạm vào một thẻ lựa chọn
  Then session Cấm — NEVER nhận được hành động nào
  And bậc trợ giúp và số lượt sai không đổi

Scenario: BR-PNR-11 — đồng hồ vòng tính từ lúc câu dẫn đọc xong
  Given câu dẫn mp3 mất 4 giây để đọc xong
  When vòng đóng 1 giây sau khi câu dẫn đọc xong
  Then duration_ms của round_completed là khoảng 1000, không phải khoảng 5000

Scenario: BR-PNR-11 — quá hạn dự phòng vẫn mở cử chỉ
  Given file mp3 của câu dẫn treo và không bao giờ phát sự kiện kết thúc
  When 12 giây trôi qua từ lúc mở vòng
  Then cử chỉ được mở, đồng hồ vòng bắt đầu tính
  And không có lỗi hay treo màn chơi
```

## 10. Boundaries

**Always**
- Nút "Nghe lại" giữ sàn chạm 64 px của quy tắc `BR-A11-04` — sàn vùng chạm bề mặt trẻ trong
  [`accessibility.md`](../08-quality/accessibility.md) ở mọi viewport.
- Mỗi file `.mp3` mới đi qua CLI sinh giọng chuẩn hoá của Task `#316` và tuân thủ hợp đồng lưu trữ của
  [`audio-storage.md`](../01-platform/audio-storage.md); cấm thả file thô chưa chuẩn hoá vào `public/`.
- Trần âm lượng tổng giữ ở −16 LUFS, true peak ≤ −1 dBTP như `audio-controller.ts` đã ghi.
- Cổng lấy gốc repo từ `REPO_ROOT` hoặc `repoPath()` của `@mindkid/config/paths`, Cấm — NEVER
  đọc `process.cwd()`.
- Cổng kiểm tồn tại file mp3 phải đi qua đường dẫn tuyệt đối dựng từ gốc repo, không qua cwd.

**Ask first**
- Đổi sang profile giọng mới (`teacher-v2`) hoặc thu âm phòng thu mới ngoài cấu hình giọng đã chốt
  ở Pha 0 Audition của Task `#316`.
- Gọi dịch vụ tổng hợp giọng trực tuyến tại runtime từ trình duyệt của trẻ (bề mặt công khai bị cấm
  gọi tài nguyên bên thứ ba; toàn bộ `.mp3` phải được kết xuất tĩnh từ CLI ngoại tuyến).

**Never**
- Cấm — NEVER gọi `window.speechSynthesis` hoặc bất kỳ API tổng hợp giọng robot trình duyệt nào.
- Cấm — NEVER pha trộn hai giọng đọc khác nhau trong cùng phiên học của trẻ.
- Cấm — NEVER phát tiếng tự động trước khi có tương tác đầu tiên của người dùng; trình duyệt chặn
  và việc đó tạo ra một lần thất bại im lặng.
- Cấm — NEVER đọc chuỗi tiếng Việt bằng giọng ngôn ngữ khác.
- Cấm — NEVER thêm một trường giọng thứ hai ở cấp vòng.
- Cấm — NEVER để việc bấm nghe lại ảnh hưởng tới điểm, bậc trợ giúp, hay bộ đếm sai.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Ánh xạ thư mục `voice/d1`…`voice/d6` sang `C1`…`C6` là một-một hay nhiều-nhiều; `d5` hiện chứa `money_template` và `clock_template` vốn thuộc `C1.MEAS`~~ **Đóng 2026-11-17 (T316)**: Không tái dùng kho rời rạc `voice/d1..d6` và `common/numbers`; hợp nhất toàn bộ về kho content-addressed một giọng cô giáo miền Bắc `/audio/voice/teacher-v1/{2-hex}/{16-hex}.mp3` qua `resolveTeacherVoicePath(text)` để triệt tiêu lệch giọng. | — | Đã đóng | D-PNR-01 (T316) |
| ~~2~~ | ~~Câu dẫn của vòng sinh từ `narration_template` của dataset hay soạn riêng theo level; sinh từ template thì 443 câu giống nhau như prompt hiện tại~~ **Đóng 2026-11-17 (T316)**: CLI quét trực tiếp câu dẫn thực tế của toàn bộ `2.135` level (`6.192` vòng), `106` bài `GT-000`, tên vật/số và lời phản hồi, chuẩn hoá qua `toSpokenVietnameseScript` và băm tất định `computeVoiceHash` nên hai câu trùng nội dung tự dùng chung một file `.mp3`. | — | Đã đóng | D-PNR-02 (T316) |
| ~~3~~ | ~~Tên vật có phát mỗi lần chạm hay chỉ lần chạm đầu trong vòng; phát mỗi lần thì với engine chạm nhanh như `GT-028` sẽ chồng tiếng~~ **Đóng 2026-11-27 (T320)**: đọc khi chạm, không đọc lại cùng vật trong 1,5 s, không đọc khi trả lời đúng — `BR-PNR-13`. | — | Đã đóng | Người dùng (T320) |
| ~~4~~ | ~~Có thu giọng người cho 36 engine còn lại hay chấp nhận bậc 2 tổng hợp giọng làm mức phục vụ cho các engine ngoài `C1`~~ **Đóng 2026-11-17 (T316)**: Gỡ bỏ hoàn toàn bậc tổng hợp giọng trình duyệt (`window.speechSynthesis`); kết xuất tĩnh toàn bộ ~`6.700` file `.mp3` giọng cô giáo mầm non miền Bắc tự nhiên cho cả `38/38` engine và dùng tín hiệu thị giác (`ghostHand` + nhấp nháy khung 1200 ms) làm bậc dự phòng duy nhất. | — | Đã đóng | D-PNR-04 (T316) |
