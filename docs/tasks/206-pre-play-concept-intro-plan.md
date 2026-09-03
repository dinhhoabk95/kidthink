# Task #206 — Bài làm quen bắt buộc trước khi chơi (concept intro)

> **Vấn đề người đặt việc nêu:** *"Mỗi game trong dự án đang bỏ qua phần dạy trẻ học.
> Trước khi trẻ chơi được thì bắt buộc phải qua một trò chơi/bài học tiền đề — dạy về
> số, hình học, khối 3D, chữ cái, âm tiết — qua hoạt động nghe và đọc, để nhận biết nội
> dung học trước khi vào trò chơi chính."*
>
> **Spec liên quan:** `docs/specs/04-play/access-gating.md` · `docs/specs/01-platform/game-engine-runtime.md` ·
> `docs/specs/05-content/lesson-model.md` · `docs/specs/04-play/lesson-session-runner.md` ·
> `docs/specs/00-foundation/error-codes.md`

---

## 1. Hiện trạng — đo được, không phỏng đoán

| # | Đo | Con số | Lệnh / vị trí |
|---|---|---|---|
| 1 | Engine game | **36** (`GT-001`…`GT-036`), **0** engine trình bày/dạy | `docs/specs/01-platform/engines/` |
| 2 | Level trong seed | **3.586** mã `GL-*` | `packages/db/src/seed-content/` |
| 3 | Vòng có `instruction` là chữ | **3.156** | `grep -ro '"instruction": "[^"]\+"'` |
| 4 | Vòng có `instruction` rỗng | **430** | `grep -ro '"instruction": ""'` |
| 5 | Vòng có `instruction_audio_path` | **0** | `grep -ro '"instruction_audio_path": "[^"]\+"'` |
| 6 | Đường chơi kiểm điều kiện sư phạm | **0** | `deliverGameConfig` (`apps/web/server/utils/game-config-runtime.ts:287`) chỉ gọi `assertContentAccess` (`packages/shared/src/access-gating.ts:298`) |
| 7 | Kỹ năng đã đặt tên | **408** trên **71** strand | `docs/taxonomy/c[1-6]*.md` |
| 8 | Kỹ năng có nội dung game | **230** trên **41 strand** | mã `C#.XXX.##` xuất hiện trong `seed-content/` |

Hàng 3 + 5 là gốc của vấn đề: hướng dẫn duy nhất trẻ nhận được là **chữ**, mà
`BR-LSM-07` và `BR-LSR-10` đã chốt **Cấm — NEVER giả định trẻ đọc được chữ**. Đường ống
audio đã nối đủ (`game_levels.instruction_audio_path` → `game-config-runtime.ts:348` →
`[code].vue:1242`) nhưng **không hạt nội dung nào rót vào**.

## 2. Vì sao lỗ hổng tồn tại — hai đường vào, chỉ một đường có dạy

| Đường | Trẻ tới màn chơi bằng cách nào | Có dạy trước không |
|---|---|---|
| **A — giáo án** | `curriculum-player` → `lesson-session-runner` → bước `digital_game` | **Có.** Mỗi tiết đủ ba pha (Khởi động → Trọng tâm → Luyện tập), người lớn ngồi cạnh 20–30 phút (`docs/taxonomy/lesson-map.md`, 126 tiết) |
| **B — danh mục** | `/games` → `/play/{code}` → engine | **Không.** Chỉ qua bảy bước của `access-gating.md` §4: tồn tại · tier · người gọi · đã chọn trẻ · quyền · hạn mức · hợp tuổi. Không bước nào hỏi *"trẻ đã biết khái niệm này chưa"* |

Đường B là đường phụ huynh thật sự dùng khi để trẻ chơi một mình. Toàn bộ tài sản sư phạm
của dự án nằm ở đường A và **không chạm** vào đường B.

`GT-018 "Nghe rồi làm"` là engine gần nhất — nhưng nó vẫn **kiểm tra** (nghe rồi phải làm
đúng), không **giới thiệu**. Cả 36 engine đều giả định trẻ đã biết khái niệm trước khi mở
màn chơi.

## 3. Ba phương án đã cân nhắc

| # | Phương án | Chi phí | Vì sao **không** chọn |
|---|---|---|---|
| A | Rót `instruction_audio_path` cho 3.586 level (TTS hoặc thu giọng) | Thấp | Một câu chỉ dẫn *"Em hãy đếm xem có mấy quả táo"* nói cho trẻ biết **phải làm gì**, không nói **cái này là gì**. Trẻ chưa biết số 3 vẫn không học được số 3. Đây là điều kiện cần, không phải điều kiện đủ — vẫn phải làm, nhưng nó không giải quyết việc người đặt việc nêu |
| B | Bắt mọi level chỉ vào được qua một tiết giáo án | Trung bình | Giáo án cần **người lớn ngồi cạnh 20–30 phút** (`BR-LSM-05`). Ép nó lên đường B là khoá luôn danh mục với khách chưa đăng nhập và với phụ huynh đang bận. Cũng phá `BR-LFM-02` (tuổi/ghi danh không được là rào) |
| **C** | **Engine dạy mới `GT-000`, một bài làm quen cho mỗi kỹ năng, hàng đợi nhiều bài, chốt chặn ở bước 8 của gating** | **Cao** | **Chọn.** Xem §4 |

## 4. Thiết kế chốt — dãy hành động nhỏ trên ba loại chất liệu

Khuôn sư phạm: **bài học ba giai đoạn của Montessori**, đã là ngôn ngữ bản địa của repo
(`docs/montessori/Phần 1 - khởi đầu/1 - Nhận biết số.pdf`).

Nhưng một bài làm quen **không phải ba màn cố định**. Nó là **dãy nhiều hành động nhỏ nối
tiếp nhau trong cùng một game level**, chạy trên **ba loại chất liệu** đi qua **một input
format chung**:

| Loại chất liệu | `kind` | Ví dụ |
|---|---|---|
| Ký tự | `glyph` | `m` · `3` · dấu huyền |
| Từ khoá học | `word` | `mẹ` · `ba` — kèm `syllables` để đọc chậm từng tiếng |
| Hình minh hoạ | `image` | emoji, ảnh, hình khối đã đăng ký |

**Bốn hành động**, chạy cùng một khuôn trên cả ba loại:

| Hành động | Trẻ làm gì | Sai được không |
|---|---|---|
| `present` — *"Đây là chữ mờ"* | Nghe và nhìn một chất liệu, chạm để đi tiếp | Không có đáp án để sai |
| `recognise` — *"Chỉ cho cô chữ mờ"* | Chạm đúng trong 2–3 lựa chọn | Sai thì chạy lại `present` của chính nó rồi hỏi lại |
| `link` — *"Từ này là của hình nào?"* | Ghép ký tự với hình, hoặc từ với hình | Như `recognise` |
| `recall` — *"Đây là gì?"* | Nghe 2 tên, chạm tên đúng | Sai vẫn đi tiếp — đây là **phép đo xếp chỗ**, không phải cửa |

Bất biến sư phạm kiểm được bằng máy: **mọi chất liệu bị hỏi phải được `present` trước** trong
cùng dãy (`BR-CIM-14`). Đó là đúng cái mà 36 engine đang có bỏ qua.

Và **một trò chơi có thể cần nhiều bài làm quen trước đó**. Cổng không trả về một bài — nó
dựng **hàng đợi** từ mọi kỹ năng của level **cộng bao đóng prerequisite bắc cầu**, sắp theo
thứ tự nền-trước, và phục vụ **2 bài mỗi lần vào**.

### 4.1 Mười bốn quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| `D-206-01` | Bài làm quen là **một game level** (`template_code = 'GT-000'` — mã `000` vì nó đứng trước mọi mã còn lại, cả trong danh sách lẫn trong đường đi của trẻ), không phải entity nội dung mới | Thừa hưởng nguyên: versioning, tier, seeder, QA ảnh chụp, studio, engine runtime, telemetry. Entity mới là một bản sao của tất cả những thứ đó |
| `D-206-02` | Phân biệt engine dạy/engine kiểm bằng cột mới `game_templates.kind` (`assess` \| `teach`) | Cổng phải trả lời được *"level này dạy hay kiểm"* bằng một câu truy vấn, không bằng danh sách mã cứng |
| `D-206-03` | Nhịp 3 là **tiếp nhận** (nghe hai tên rồi chạm), Cấm — **NEVER thu giọng trẻ** | `BR-CDC-04` và `BR-AST-04` cấm thu âm trẻ. "Trẻ đọc" hiện thực bằng nghe–chọn, không bằng ghi âm |
| `D-206-04` | Cổng đòi **đã đi hết** (`completed`), Cấm — **NEVER đòi trả lời đúng** (`passed`) | Khoá một đứa trẻ ba tuổi ra khỏi trò chơi vì nó chạm sai là biến bài dạy thành hình phạt. "Bắt buộc phải qua" = phải đi qua, không phải phải thắng |
| `D-206-05` | Chặn ở **bước 8** của `access-gating.md` §4, sau tier và hạn mức, mã `428 INTRO_REQUIRED` | Bước 5 (403) và 6 (402) là rào **người lớn tự gỡ được bằng tiền**. Đẩy rào sư phạm lên trước chúng là nói sai lý do đang chặn — đúng tinh thần `BR-GAT-09` |
| `D-206-06` | Đòi **mọi strand** mà level chạm tới, gồm cả strand đến từ bao đóng prerequisite bắc cầu — một trò chơi có thể cần nhiều bài làm quen trước đó. Bao đóng tính ở mức skill rồi mới gom về strand | Một màn chơi ghép vần đứng trên cả ký tự lẫn từ. Đòi mỗi kỹ năng chính là dạy nửa nền rồi thả trẻ vào phần còn lại. Bản nháp đầu của task này đòi một bài; người đặt việc lật lại ngày 2026-09-02 |
| `D-206-07` | Trạng thái hoàn thành **suy ra từ `play_sessions`**, không thêm bảng | `play_sessions` đã có `child_profile_id` **và** `guest_device_id`, đã có `is_preview` và `completion_status`. Bảng mới là bản sao đồng bộ tay |
| `D-206-08` | Miễn cổng khi: manager preview · level chạy trong một `lesson_run` · bài làm quen của kỹ năng đó đã xong | Trong tiết giáo án thì **người lớn đang dạy** — đó chính là thứ cổng này đi tìm. `BR-GAT-08` đã đặt tiền lệ cho preview |
| `D-206-09` | Độ phủ giữ bằng **cổng bậc thang** như `typecheck-gate.ts`: số kỹ năng thiếu bài làm quen chỉ được giảm | 3.586 level đang sống. Bắt đủ phủ ngay là bắt gỡ toàn bộ thư viện. Bậc thang là cách repo này đã đóng khoản nợ 3.142 lỗi kiểu |
| `D-206-10` | Ký hiệu viết (chữ số "3", chữ cái "A") được **hiện**, Cấm — **NEVER bắt trẻ đọc nó để đi tiếp** | Người đặt việc muốn "trẻ đọc"; `BR-LSM-07` cấm giả định trẻ đọc được. Hai điều này chỉ sống chung được khi mặt chữ là **thứ trẻ được thấy**, còn đường đi tiếp thì chạy bằng tai và tay |
| `D-206-11` | Một bài làm quen là **dãy 3–12 hành động nhỏ**, không phải ba màn cố định | Ký tự, từ và hình cần số nhịp khác nhau. Ba màn cứng buộc người soạn nhét cả ba loại vào cùng một khuôn, hoặc tách thành ba bài rời làm hàng đợi dài gấp ba |
| `D-206-12` | **Input format chung**: mọi step trỏ chất liệu bằng `asset_id` trong kho `assets`; loại chất liệu là **dữ liệu**, Cấm — **NEVER** là nhánh điều khiển | Nhúng nội dung thẳng vào step thì mỗi loại sinh một biến thể step, người soạn phải học ba khuôn, và runner có ba nhánh để lệch nhau |
| `D-206-13` | Hàng đợi phục vụ **tối đa 2 bài mỗi lần vào**, phần còn lại đòi ở lần vào sau kèm `intro_remaining` | Bao đóng prerequisite có thể dài. Chắn một đứa trẻ sau sáu phút bài dạy để tới màn chơi 90 giây là cách chắc chắn nhất làm nó bỏ. Trẻ vẫn phải qua hết, chỉ là không qua hết trong một hơi |
| `D-206-14` | Trần thời lượng một bài nới từ 90 lên **120 giây** | Dãy hành động dài ra khi bài phủ cả ký tự lẫn từ lẫn hình. Quá hai phút thì nó thành cửa ải — đó là trần cứng, không phải mục tiêu |

### 4.2 Kênh nghe — dùng được ngay, không cần tài sản mới

`packages/game-engine/src/systems/speech-synthesis-adapter.ts` đã có TTS `vi-VN` qua Web
Speech API, có dò giọng và có nhánh fallback khi máy không có giọng Việt. Bài làm quen
chạy được ở P1 bằng TTS + hình; giọng thu sẵn là nâng cấp P2 qua `audio-storage.md`, không
phải điều kiện khởi động.

## 5. Ba spec mới

Theo `CONVENTIONS.md` §1 (một outcome một file) — ba thứ này dùng riêng lẻ được, nên là ba file:

| Spec | Sở hữu | Prefix |
|---|---|---|
| `docs/specs/05-content/concept-intro-model.md` | Input format chung, ba loại chất liệu, ràng buộc biên tập | `BR-CIM` |
| `docs/specs/04-play/concept-intro-runner.md` | Vòng chạy dãy hành động, bốn hành động trên ba loại chất liệu | `BR-CIR` |
| `docs/specs/04-play/concept-intro-gate.md` | Bước 8, hàng đợi nhiều bài theo prerequisite | `BR-CIG` |

Ba prefix đã đối chiếu với 213 prefix của corpus — đều trống (`BR-REG2-01`).

## 6. Delta vào spec đang có — **chưa sửa**, chờ chốt §4

Bốn file dưới là **contract đã đóng**. `AGENTS.md` bắt sửa spec trước, cùng PR — nhưng chỉ
sau khi thiết kế §4 được duyệt, vì mỗi dòng ở đây nới một luật đang có:

| Spec | Sửa gì | Rủi ro nếu sửa sai |
|---|---|---|
| `04-play/access-gating.md` | Thêm bước 8 vào §4; `BR-GAT-02` nói thứ tự bảy bước là **cố định** | Đây là cổng doanh thu. Chèn nhầm chỗ làm mã lỗi nói sai lý do |
| `00-foundation/error-codes.md` | Thêm `INTRO_REQUIRED` → 428, `details.intro_level_code` | Trùng mã hoặc sai status làm client xử lý nhầm nhánh |
| `00-foundation/business-rules.md` §7.1 | Đăng ký `BR-CIM` · `BR-CIR` · `BR-CIG` | Không đăng ký thì spec sau cướp prefix |
| `01-platform/game-template-contract.md` + `engine-spec-sheet.md` | Cột `kind`, và phiếu `engines/GT-000.md` (prefix `BR-E000` giữ chỗ) | Bốn mục của phiếu engine là **trích từ registry** và có cổng đối chiếu. Viết phiếu trước khi `GT-000` có trong registry là bịa dữ liệu mà cổng sẽ bắt — nên phiếu viết **sau** khi template tồn tại |
| `00-foundation/event-catalog.md` | `intro_step_started` · `intro_step_answered` · `intro_step_deferred` · `intro_recall_answered` · `tts_unavailable` | Event không khai trong catalog thì không ai đo được bài dạy có hiệu quả không |

## 7. Giả định — người đặt việc lật được bất kỳ dòng nào

| # | Giả định | Nếu sai thì đổi gì |
|---|---|---|
| ~~`A-206-01`~~ | **ĐÃ CHỐT 2026-09-02: một bài làm quen cho một strand.** Cầu soạn **41 bài** — số strand đang có nội dung game; 71 là tổng strand taxonomy, 30 trong đó chưa có level nào. Mở rộng xuống mức skill (230 bài) là giai đoạn sau | Rẻ hơn 5,6 lần và đủ nhanh để có độ phủ thật. Rủi ro đã biết: strand rộng như `C1.NREC` (12 kỹ năng) có thể không phủ nổi bằng 12 hành động — theo dõi ở câu 3 mục 11 của `concept-intro-model.md` |
| `A-206-02` | Bài làm quen **kế thừa tier của level rẻ nhất** thuộc kỹ năng đó | Nếu không, một bài làm quen `premium` sẽ dựng tường thu phí trước một trò chơi `free` |
| `A-206-03` | Hoàn thành **không hết hạn** theo thời gian; mastery tụt thì **mời** học lại, Cấm — **NEVER chặn lại** | Ép học lại biến bài dạy thành thuế lặp |
| `A-206-04` | Xuất bản lại bài làm quen (`content_version` tăng) **không** bắt trẻ chạy lại, trừ khi người soạn bật cờ `requires_reintro` | Không có cờ này thì một lần sửa chính tả sẽ khoá toàn bộ trẻ đang chơi |
| `A-206-05` | Khách chưa đăng nhập tính theo `guest_device_id` như mọi phiên chơi khác | Không thì khách phải học lại mỗi lần mở tab |

## 8. Lộ trình

| Mốc | Việc | Đo bằng |
|---|---|---|
| M1 | Ba spec mới ở trạng thái `approved`; delta §6 vào spec đang có | Đọc lại — không có contract nào bị nới mà không có lý do ghi kèm |
| M2 | `GT-000` trong registry engine + phiếu `engines/GT-000.md` | `pnpm test` cổng engine spec xanh |
| M3 | Runner vòng lặp step + event, chạy được một bài phủ cả ba loại chất liệu | `qa:capture` có ảnh `GT-000` cho bốn hành động trên ba loại chất liệu |
| M4 | Bước 8 + hàng đợi + `428 INTRO_REQUIRED` + ma trận test | Ma trận `access-gating` §7.1 mở rộng, có **ca âm** |
| M5 | Cổng bậc thang độ phủ, baseline = 41 strand thiếu bài làm quen | Thêm level cho kỹ năng chưa có bài làm quen → đỏ |
| M6 | Soạn bài làm quen theo đợt, bắt đầu từ strand của C1 và C5 | Baseline chỉ đi xuống |

## 9. Rủi ro

| Rủi ro | Dấu hiệu sớm | Chặn bằng |
|---|---|---|
| Bài làm quen thành cửa ải làm trẻ bỏ | `game_started` giảm sau khi bật bước 8 | `D-206-04` (đi qua, không cần thắng) + trần thời lượng 90 giây ở `BR-CIM` |
| Cổng xanh giả — đo sai đường | Cổng báo đủ phủ trong khi màn chơi vẫn vào thẳng | Ca âm bắt buộc: một level thiếu bài làm quen phải làm test đỏ (`AGENTS.md`) |
| Hàng đợi dài làm trẻ bật ra khỏi trò chơi nó muốn chơi | `intro_remaining` trung bình trên 2 ở nhiều level | `D-206-13` cắt còn 2 bài mỗi lần vào; đo phân bố độ dài hàng đợi trước khi nới (câu 4 mục 11 của spec cổng) |
| 41 bài làm quen không ai soạn nổi | Baseline đứng yên nhiều tuần | Bậc thang chỉ ép **không lùi**; đợt soạn đi theo `montessori-corpus-mapping.md` |
| Chèn bước 8 làm hỏng cổng doanh thu | Ô nào đó của ma trận 20 ô đổi trạng thái | Chụp danh sách `trạng-thái \| tên-test` trước/sau, đòi **trùng khít** |
