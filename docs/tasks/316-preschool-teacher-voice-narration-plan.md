# Task #316 — Chuẩn Hoá Kho Giọng Đọc Cô Giáo Mầm Non Miền Bắc (`teacher-v1`), Gỡ Bỏ JS Web Speech API & CLI Sinh Giọng Bền Vững

> **Trạng thái:** Đang triển khai — Hoàn tất Pha Kiến trúc Hợp đồng & Đường dẫn băm tất định (`voice-architect`); sẵn sàng cho Pha 0 Audition, CLI Kết xuất, Đấu nối Runtime & Cổng kiểm định
> **Contract sở hữu:** [`../specs/04-play/play-narration.md`](../specs/04-play/play-narration.md) (`BR-PNR-01..12`)
> **Kế thừa nền tảng:** [`315-koguma-vn-curriculum-and-ui-plan.md`](315-koguma-vn-curriculum-and-ui-plan.md) · [`314-preschool-kid-world-and-gameplay-redesign-plan.md`](314-preschool-kid-world-and-gameplay-redesign-plan.md)

---

## 1. Bối Cảnh, Hiện Trạng & Mục Tiêu Kiến Trúc

Trẻ 3–6 tuổi trên bề mặt `/play/**` chưa biết đọc chữ; âm thanh lời dẫn của cô giáo là kênh giao tiếp chính yếu (`BR-PNR-01`). Sau khi hoàn tất 100 học phần Koguma-VN ở Task `#315`, kiểm toán thực tế toàn bộ corpus cho thấy khoảng trống lớn ở tầng giọng đọc:

### 1.1 Số Đo Corpus Thực Tế
- **Quy mô nội dung:** `443` kỹ năng (`skills.code`), `2.135` game level đã xuất bản với tổng cộng **`6.192` vòng chơi** trên `38` khuôn engine (`GT-000`…`GT-037`), trong đó riêng **`106` bài làm quen khái niệm `GT-000`** mang nhiều thẻ trình bày (`present`) và thẻ đọc theo (`echo`).
- **Tài sản âm thanh cũ:** Chỉ có `742` file `.mp3` rời rạc dưới `apps/web/public/audio/voice/` (`common/numbers/`, `d1/`…`d6/`), chỉ gắn cho `4/443` kỹ năng.
- **Hệ quả ở runtime cũ:** Phần lớn câu dẫn vòng, tên vật, số đếm ngoài phạm vi và pill Montessori rơi xuống `window.speechSynthesis` (JS Web Speech API). Giọng tổng hợp của trình duyệt khác nhau theo từng thiết bị, phát âm cơ học kiểu robot, đọc sai ngữ điệu mầm non (ví dụ đọc `"15"` thành `"mười năm"`, `"0"` thành `"zero"`, `"(2/5)"` thành ký hiệu thô), đồng thời tạo ra **hai giọng đọc lệch nhau** giữa file `.mp3` cũ và giọng máy trong cùng một phiên học.
- **Tổng khối lượng câu thoại duy nhất sau khử trùng lặp:** Xấp xỉ **`~6.700` file `.mp3`** bao phủ toàn bộ câu dẫn mở vòng (`6.192` vòng), thẻ `GT-000` (`106` bài), từ vựng vật phẩm/số/hình/chữ/dấu thanh, câu khen đồng dao Việt Nam và lý do pill Montessori (`BR-PNR-12`).

### 1.2 Mục Tiêu Cốt Lõi
1. **Một giọng cô giáo mầm non miền Bắc duy nhất (`teacher-v1`):** Toàn bộ câu hỏi, thẻ khái niệm, tên số, tên vật, lời khen và pill Montessori phát từ cùng một kho `.mp3` thống nhất `/audio/voice/teacher-v1/{2-hex}/{16-hex}.mp3` (`BR-PNR-05`).
2. **Loại bỏ hoàn toàn JS Web Speech API (`window.speechSynthesis`):** Rút thứ tự dự phòng tại [`../specs/04-play/play-narration.md`](../specs/04-play/play-narration.md) §7.2 về đúng **2 bậc**:
   - **Bậc 1:** File `.mp3` giọng cô giáo thống nhất (`instruction_audio_path`, `audio_path`, hoặc đường dẫn tất định `resolveTeacherVoicePath(text)`).
   - **Bậc 2 (Cuối):** Tín hiệu thị giác — nâng trợ giúp lên bàn tay dẫn (`ghostHand`) và nhấp nháy khung yêu cầu `1200 ms` (`BR-PNR-06`). Tuyệt đối không còn giọng robot trình duyệt và không bao giờ im lặng.
3. **Pha 0 Audition có kiểm chứng người thật:** Kết xuất thử bộ mẫu đối chứng trên **4 cấu hình TTS Neural tiếng Việt miễn phí, không cần API key trả phí** để chọn giọng ấm áp, tròn vành rõ chữ nhất trước khi chạy batch `~6.700` file.
4. **CLI kết xuất giọng lâu dài, idempotent:** Mọi bài học hoặc câu thoại thêm mới về sau chỉ cần chạy một lệnh CLI để quét tự động, băm SHA-256 tất định, chuẩn hoá kịch bản phát âm tiếng Việt mầm non, xuất `.mp3` đạt chuẩn `-16 LUFS` / true peak `<= -1 dBTP` và cập nhật `manifest.json`.

---

## 2. Các Ràng Buộc Bất Biến Không Thương Lượng

1. **Bảo toàn hợp đồng nền tảng (`D1`–`D12` & `business-rules.md` §7.3):**
   - Không mở bảng DB mới, không chạm `packages/db/**`, không gọi dịch vụ TTS bên thứ ba trực tiếp từ trình duyệt của trẻ ở runtime (`BR-LND-04`), không thu thập dữ liệu trẻ.
2. **Định danh đường dẫn tất định đa môi trường (`@mindkid/shared/voice-path`):**
   - Module `packages/shared/src/voice-path.ts` thuần TypeScript `100%` (không import `node:*`, không toán tử bitwise vi phạm cổng lint), chạy đồng nhất trên Browser, `@mindkid/content`, `@mindkid/game-engine` và Node CLI.
   - `sha256HexSync` khớp từng byte với `node:crypto` `createHash("sha256")`.
   - `normalizeVoiceLookupKey` chuẩn hoá `NFC`, xoá ký tự zero-width, gộp khoảng trắng, đồng nhất `"số không"` ↔ `"số 0"`, bỏ dấu chấm cuối câu nhưng bảo toàn `?` và `!` để giữ đúng ngữ điệu câu hỏi / cảm thán.
3. **Chuẩn hoá kịch bản đọc sư phạm (`toSpokenVietnameseScript` & `formatVietnameseCardinal`):**
   - Đọc số nguyên `0..999` chuẩn miền Bắc (`4 -> "bốn"`, `5 -> "năm"`, `14 -> "mười bốn"`, `15 -> "mười lăm"`, `21 -> "hai mươi mốt"`, `24 -> "hai mươi tư"`, `25 -> "hai mươi lăm"`, `105 -> "một trăm linh năm"`).
   - Chuyển biểu thức toán học (`+`, `-`/`−`, `×`, `÷`, `=`, `>`, `<`) sang lời đọc tự nhiên mà không làm hỏng từ ghép có gạch nối (`"ô-tô"`).
   - Chuyển tỉ số tiến độ `(2/5)` hoặc `2/5` sang `", hai trên năm"` (`BR-PNR-12`), dấu thanh rời sang tên thanh (`"Thanh ngang"`, `"Dấu sắc"`, `"Dấu ngã"`, ...), và thêm nhịp nghỉ tự nhiên sau `"Bé nói theo cô nhé, "`.
4. **Chuẩn âm lượng & an toàn thính giác mầm non:**
   - Mọi file `.mp3` xuất ra được chuẩn hoá âm lượng về `-16 LUFS`, true peak `<= -1 dBTP`, tốc độ mẫu `24 kHz` hoặc `44.1 kHz` mono gọn nhẹ, trim khoảng lặng đầu/cuối có giữ đệm êm `>= 20 ms` fade-in / `>= 40 ms` fade-out.

---

## 3. Thiết Kế Kỹ Thuật Theo Từng Trụ Cột

### 3.1 Pha 0 — Audition 4 Cấu Hình Neural TTS Tiếng Việt Miễn Phí (Không Cần API Key)

Trước khi sinh hàng loạt `~6.700` file, CLI chạy chế độ `--audition` trên tập **12 câu mẫu đại diện** (câu hỏi đếm số, câu hỏi hình học/không gian, câu toán cộng trừ, thẻ đồng âm dấu thanh `GT-000`, câu khen đồng dao Gấu Con, pill Montessori `(2/5)`, đọc số lẻ `0, 5, 14, 15, 21, 24, 25, 105`) qua 4 ứng viên:

| Mã cấu hình | Công nghệ / Mô hình | Đặc điểm kỹ thuật | Điểm mạnh & Lưu ý sư phạm |
|---|---|---|---|
| **Cấu hình A** | **`VieNeu-TTS` (ONNX local)** | Chạy ngoại tuyến hoàn toàn qua ONNX Runtime + `espeak-ng` phonemizer tiếng Việt | Không phụ thuộc mạng, tốc độ suy luận CPU/Apple Silicon ổn định, kiểm soát tốc độ đọc chính xác |
| **Cấu hình B** | **`VieNeu` Voice Clone (Reference cô giáo Bắc)** | Zero-shot / reference conditioning từ mẫu giọng đọc truyện mầm non miền Bắc chuẩn | Âm sắc ấm, mềm mại, giàu biểu cảm cô giáo mầm non; cần kiểm tra độ sạch nhiễu nền và độ ổn định trên từ đơn ngắn (`"Số ba"`, `"Dấu ngã"`) |
| **Cấu hình C** | **`Piper VAIS-1000` (ONNX VITS)** | Mô hình VITS huấn luyện trên tập dữ liệu giọng miền Bắc chuẩn `VAIS-1000` | Rất nhanh trên CPU, phát âm âm tiết đơn cực kỳ tròn vành rõ chữ, không bị nuốt âm cuối; cần tinh chỉnh `length_scale` để câu dài mềm mại hơn |
| **Cấu hình D** | **`Edge-TTS` (`vi-VN-HoaiMyNeural`)** | Neural TTS miễn phí không cần API key, kết xuất ngoại tuyến từ CLI trong bước build tài sản | Ngữ điệu câu hỏi (`?`) và câu khích lệ (`!`) tự nhiên, thanh điệu miền Bắc rõ ràng, tốc độ batch nhanh với cơ chế retry + rate-limit an toàn |

Kết quả Pha 0 xuất ra thư mục audition kèm bảng so sánh thời lượng, LUFS và độ tự nhiên để chốt engine mặc định cho profile `teacher-v1` (và cho phép cắm đa adapter trong CLI).

### 3.2 Kiến Trúc CLI Sinh Giọng Lâu Dài (`voice-cli`)

- ** Trích xuất toàn diện (Corpus Extractor):**
  - Quét tự động toàn bộ `2.135` level (`6.192` vòng), `106` bài `GT-000`, `443` dataset kỹ năng, danh mục từ vựng vật phẩm `@mindkid/content`, câu khen phản hồi và mẫu pill Montessori.
  - Chuẩn hoá khóa tra cứu qua `normalizeVoiceLookupKey(raw)` và dựng kịch bản phát âm qua `toSpokenVietnameseScript(raw)` từ `@mindkid/shared/voice-path`.
- **Lưu trữ Content-Addressed & Idempotent:**
  - Đường dẫn đích: `apps/web/public/audio/voice/teacher-v1/{hash.slice(0, 2)}/{hash}.mp3` (chia `256` bucket hex 2 ký tự đầu để tránh nghẽn thư mục phẳng khi chứa `~6.700+` file).
  - Bỏ qua các file đã tồn tại và khớp checksum trong `manifest.json` trừ khi truyền cờ `--force`.
- **Hậu kỳ âm thanh (`ffmpeg` loudnorm & silence trim):**
  - Cắt khoảng trắng câm dư thừa đầu/cuối nhưng giữ khoảng đệm tự nhiên (`30 ms` đầu, `80 ms` cuối), áp bộ lọc chuẩn hoá âm lượng `-16 LUFS`, true peak `<= -1 dBTP`, xuất `.mp3` mono `48–64 kbps` tối ưu băng thông tải trước (`preloadPlayAssets <= 3s`).

### 3.3 Thay Thế Hoàn Toàn JS TTS & Chuẩn Hoá Bề Mặt Hiển Thị

1. **`packages/content`:**
   - Gắn tất định `instruction_audio_path` và `audio_path` trỏ về `/audio/voice/teacher-v1/**` thông qua `resolveTeacherVoicePath`, chấm dứt phụ thuộc vào kho cũ rời rạc `common/numbers/` hay `d1..d6/`.
2. **`packages/game-engine`:**
   - Xoá bỏ nhánh gọi `window.speechSynthesis` / `SpeechSynthesisAdapter` trong luồng phát giọng runtime (`AudioController`, `RoundRunner`).
   - Khi có `instruction_audio_path` hoặc suy dẫn được từ `resolveTeacherVoicePath(prompt)`, phát trực tiếp qua `AudioBufferSourceNode` / bộ phát `.mp3`; nếu tải lỗi hoặc quá hạn `3s`, kích hoạt ngay dự phòng thị giác (`ghostHand` + nhấp nháy khung yêu cầu `1200 ms`, `BR-PNR-06`) và báo hoàn tất nhịp dẫn để không bao giờ khoá cử chỉ (`BR-PNR-09`, `BR-PNR-11`).
3. **`apps/web` (`/play/**` & HUD trẻ em):**
   - Gỡ toàn bộ lệnh gọi `speechSynthesis` phía composable Vue (`use-play-audio.ts`, màn chơi `/play/[code].vue`, sân chơi sticker, phòng Gấu Con).
   - Chuẩn hoá câu chữ hiển thị trên HUD / thẻ bài khớp đồng bộ với câu cô giáo đọc (không hiện ký hiệu thô hay mã nội bộ).

---

## 4. Phân Chia 6 Nhóm Sub-Agent Độc Lập Vùng File

| # | Sub-Agent | Trách nhiệm chính | Phạm vi file sở hữu |
|---|---|---|---|
| 1 | **`voice-architect`** | Thiết kế hợp đồng `PLAY-NARRATION`, thuật toán SHA-256 đồng bộ đa môi trường, chuẩn hoá khoá tra cứu & kịch bản đọc tiếng Việt miền Bắc, lập plan & todo Task `#316` | `packages/shared/src/voice-path.ts`, `packages/shared/package.json`, `packages/shared/tests/voice-path.test.ts`, `docs/specs/04-play/play-narration.md`, `docs/tasks/316-preschool-teacher-voice-narration-{plan,todo}.md` |
| 2 | **`voice-cli-builder`** | Xây dựng CLI trích xuất toàn bộ câu thoại từ corpus (`2.135` level, `6.192` vòng, `106` bài `GT-000`, `443` skills), tích hợp 4 adapter TTS Neural miễn phí, chế độ `--audition` và pipeline hậu kỳ `ffmpeg` `-16 LUFS` + `manifest.json` | `scripts/voice/**` (hoặc package CLI âm thanh chuyên biệt), cấu hình script gốc |
| 3 | **`voice-batch-producer`** | Thực thi Pha 0 Audition, chốt cấu hình giọng cô giáo miền Bắc tối ưu và chạy batch kết xuất đầy đủ `~6.700` file `.mp3` vào kho `teacher-v1` kèm kiểm định không có file `0 byte` / lỗi frame | `apps/web/public/audio/voice/teacher-v1/**`, `scripts/narration-coverage-baseline.json` |
| 4 | **`content-voice-wiring`** | Đấu nối `resolveTeacherVoicePath` vào bộ builder của `@mindkid/content` để cấp `instruction_audio_path` và `audio_path` thống nhất `teacher-v1` cho toàn bộ level và item | `packages/content/src/**`, `packages/content/tests/**`, `packages/content-build/**` |
| 5 | **`engine-web-tts-remover`** | Gỡ bỏ hoàn toàn `window.speechSynthesis` khỏi `@mindkid/game-engine` và `apps/web`, đấu nối phát `.mp3` `teacher-v1` cho câu dẫn, tên vật, lời khen, pill Montessori và dự phòng thị giác `2` bậc (`ghostHand` + nhấp nháy `1200 ms`) | `packages/game-engine/src/**`, `packages/game-engine/tests/**`, `apps/web/app/**`, `apps/web/tests/**` |
| 6 | **`voice-qa-gatekeeper`** | Dựng/nâng cấp cổng `check:narration-coverage`, đối chiếu `100%` đường dẫn `.mp3` tồn tại thật trên đĩa, kiểm tra `0` tham chiếu `speechSynthesis` sống ở runtime, chạy `pnpm check` toàn monorepo và Playwright E2E | `scripts/check-narration-coverage.ts`, kiểm định tích hợp toàn repo |

---

## 5. Cổng Kiểm Định Hoàn Tất (Verification Gates)

Task `#316` chỉ được đóng khi toàn bộ các cổng sau đạt `exit 0`:

1. **Cổng đơn vị `@mindkid/shared` (`voice-path.test.ts`):**
   - `sha256HexSync` khớp `100%` với `node:crypto` trên chuỗi rỗng, ASCII, tiếng Việt đa dấu phức tạp và chuỗi đa block `> 64 bytes`.
   - `normalizeVoiceLookupKey`, `formatVietnameseCardinal` (`0..999`) và `toSpokenVietnameseScript` vượt qua toàn bộ bộ ca kiểm chứng ngữ âm mầm non miền Bắc.
2. **Cổng độ phủ & toàn vẹn file âm thanh (`check:narration-coverage`):**
   - `100%` trong số `2.135` level (`6.192` vòng) và `106` bài `GT-000` có file `.mp3` tồn tại thật dưới `apps/web/public/audio/voice/teacher-v1/**` với kích thước hợp lệ (`> 1 KB`), `0` đường dẫn gãy, `0` trộn kho giọng cũ (`BR-PNR-05`).
3. **Cổng triệt tiêu giọng robot trình duyệt (`BR-PNR-06`):**
   - Quét tĩnh xác nhận `0` lệnh gọi `window.speechSynthesis` / `SpeechSynthesisUtterance` trong runtime chơi của `@mindkid/game-engine` và `apps/web`.
   - Test hành vi xác nhận khi `.mp3` lỗi hoặc quá hạn `3s`, hệ thống chuyển thẳng sang `ghostHand` + nhấp nháy khung yêu cầu `1200 ms` và mở cử chỉ đúng hạn (`BR-PNR-09`, `BR-PNR-11`).
4. **Cổng chất lượng toàn monorepo & E2E thực tế:**
   - `pnpm check` (`biome check`, `pnpm lint:deps`, `pnpm typecheck`) exit `0`, `0` `any`/`unknown`, `0` import tương đối `../`.
   - Kiểm thử trình duyệt trực tiếp trên `/play` và `/play/:code` xác nhận giọng cô giáo phát mượt mà, ấm áp, nút "Nghe lại" (`>= 64px`) hoạt động tức thì không phạt lượt (`BR-PNR-07`, `BR-PNR-08`), `0` lỗi console.
