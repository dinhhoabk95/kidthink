---
spec: CONCEPT-INTRO-RUNNER
title: Chạy dãy hành động của một bài làm quen — bề mặt của trẻ
area: play
status: approved
mvp: false
phase: P4
reviewed: 2026-09-02
owns:
  - Vòng chạy một dãy hành động của `GT-000`
  - Hành vi của bốn hành động trên ba loại chất liệu
  - Điều kiện một lượt làm quen tính là đã đi hết
  - Event của bài làm quen
depends_on:
  - CONCEPT-INTRO-MODEL
  - GAME-ENGINE-RUNTIME
  - PLAY-SESSION-LIFECYCLE
  - SCAFFOLDING-AND-HINTS
  - CHILD-DATA-COMPLIANCE
---

# Chạy dãy hành động của một bài làm quen — bề mặt của trẻ

## 1. Objective

[`concept-intro-model.md`](../05-content/concept-intro-model.md) sở hữu **input format**: kho
chất liệu `assets` và dãy hành động `steps`. File này sở hữu **cách dãy đó chạy trước mặt
một đứa trẻ ba tuổi đang ngồi một mình với cái máy tính bảng**.

Runner của `GT-000` là **một vòng lặp trên `steps`**, không phải ba màn cố định. Mỗi step là
một hành động nhỏ; bốn hành động (`present` · `recognise` · `link` · `recall`) chạy **cùng
một khuôn** trên cả ba loại chất liệu — ký tự, từ khoá học, hình minh hoạ. Người soạn đổi
dãy thì trẻ thấy bài khác; runner không đổi.

Khác [`lesson-session-runner.md`](lesson-session-runner.md) ở chỗ quyết định tất cả: ở đó
**người lớn giữ nhịp**, ở đây **không có người lớn nào cả**. Nên bài làm quen không được có
bước nào cần diễn giải, không được có chữ nào phải đọc, và không được có ngã cụt nào mà trẻ
tự thoát không nổi.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ 3–6 | không có tài khoản | Nghe, nhìn, chạm. Người dùng duy nhất của bề mặt này |
| Engine `GT-000` | — | Chạy dãy step, phát event, trả quyền điều khiển khi xong |
| Server | — | Cấp config, mở và đóng `play_sessions`, nhận event |
| Người lớn | — | Cấm — **NEVER** phải có mặt để bài chạy được |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/play/{intro_level_code}` | Trẻ | Cùng route với mọi level. Engine đọc `template_code` rồi chạy runner này |
| `GET /api/users/levels/{code}/config` | Client | Đường cấp config đã có, không đổi |
| [`concept-intro-gate.md`](concept-intro-gate.md) | Server | Nguồn đưa trẻ tới đây, có thể **nhiều bài nối tiếp** trong một hàng đợi |

## 4. Main flow

1. Client nhận config, gọi `engine.load(config)` theo [`game-engine-runtime.md`](../01-platform/game-engine-runtime.md).
2. Engine mở `play_sessions` như mọi level, phát `game_started`.
3. Engine nạp `assets` vào kho tra theo `asset_id`, preload hình và audio của **step hiện
   tại cộng step kế tiếp** — cùng luật preload của engine thường.
4. Vòng lặp trên `steps`, từ đầu tới cuối, **đúng thứ tự người soạn khai**:
   - Phát `intro_step_started`.
   - Dựng màn theo `action` (mục 4.1), đọc câu tương ứng trong `narration` có chèn `{label}`
     của target — file `audio_path` nếu có, không thì TTS `vi-VN`.
   - Chờ trẻ thao tác. Cấm — **NEVER** tự chuyển step theo đồng hồ.
   - Xong → step kế.
5. Hết `steps` → phát `game_completed`, đóng phiên với `completion_status = 'completed'`.
6. Bề mặt trả quyền điều khiển cho hàng đợi của
   [`concept-intro-gate.md`](concept-intro-gate.md): còn bài trong hàng thì vào bài kế, hết
   hàng thì quay lại đúng trò chơi trẻ muốn vào.

### 4.1 Bốn hành động

| `action` | Màn dựng gì | Trẻ thao tác | Đúng thì | Sai thì |
|---|---|---|---|---|
| `present` | **Một** chất liệu giữa màn. `glyph` và `word` hiện mặt chữ; `word` đọc chậm từng `syllables` | Chạm bất kỳ đâu | Sang step kế | Không có nhánh sai — `BR-CIR-04` |
| `recognise` | Target cùng `distractors`, xáo vị trí | Chạm chất liệu đúng | Âm mừng ngắn, sang step kế | Chạy lại `present` của **chính target** rồi hỏi lại step này |
| `link` | Target một bên, `pair_with` cùng 1–2 mồi nhử bên kia | Kéo hoặc chạm nối hai bên | Nối sáng lên, sang step kế | Như `recognise` — nhắc lại rồi hỏi lại |
| `recall` | **Một** chất liệu, rồi đọc lần lượt hai `name_options` gắn hai nút hình | Chạm nút | Sang step kế | **Cũng sang step kế**; kết quả vào `intro_recall_answered` — `BR-CIR-07` |

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Trẻ không chạm gì ở một step | Quá 12 giây | Đọc lại câu của step một lần, làm nhịp nhấp nháy target. Cấm — **NEVER** tự sang step kế |
| Trẻ sai ba lần liên tiếp ở một step `recognise` hoặc `link` | Chưa nhận ra | Bỏ step đó, đi tiếp. Ghi `intro_step_deferred`. Cấm — **NEVER** để trẻ kẹt ở một step |
| Step trỏ `asset_id` không có trong `assets` | Lỗi dữ liệu lọt cổng publish | Bỏ step, ghi `intro_step_deferred` với `reason = 'asset_missing'`, chạy tiếp. Cấm — **NEVER** dựng màn trắng |
| Máy không có giọng `vi-VN` | Web Speech thiếu voice | Chạy tiếp bằng **hình + mặt chữ + nhịp nhấp nháy**; phát `tts_unavailable`. Bài vẫn tính là đã đi hết |
| Mất mạng giữa chừng | Chơi ở nhà | Buffer event vào IndexedDB như mọi level ([`offline-play.md`](../01-platform/offline-play.md)). Step đang chạy không dừng |
| Trẻ thoát giữa chừng | Long-press thoát | Phiên thành `abandoned`. Cấm — **NEVER** tính là đã đi hết; lần sau chạy lại từ step đầu |
| `prefers-reduced-motion` | Cài đặt máy | Bỏ chuyển cảnh, **giữ** nhấp nháy chậm và giữ nguyên âm — `BR-SCF-06` |
| Trẻ mở lại bài đã xong | Đã hoàn thành trước đó | Chạy bình thường, không chặn. Lần chạy sau không đổi trạng thái đã hoàn thành |
| Manager preview | `is_preview = true` | Chạy hết dãy, Cấm — **NEVER** ghi hoàn thành — `BR-GAT-08` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CIR-01` (không cần người lớn) | Mọi step phải chạy được với **chỉ trẻ và máy** | Đây là điểm khác `lesson-session-runner.md`. Step nào cần người lớn diễn giải thì step đó không tồn tại trên đường danh mục |
| `BR-CIR-02` (trẻ giữ nhịp) | Cấm — **NEVER** tự chuyển step theo đồng hồ | `BR-LSR-02` cùng lý do: nhịp của trẻ ba tuổi không đoán trước được |
| `BR-CIR-03` (một step một màn) | Runner hiện **đúng một** step tại một thời điểm, và `present` hiện **đúng một** chất liệu | `BR-ENG-09` — một phần tử động thu hút chú ý tại một thời điểm. Giới thiệu ba thứ cùng lúc là không giới thiệu thứ nào |
| `BR-CIR-04` (`present` không có đáp án) | `present` Cấm — **NEVER** có đáp án đúng/sai | Đây là định nghĩa của bước giới thiệu. Biến nó thành câu hỏi là bỏ mất bước dạy và chỉ còn bước kiểm — đúng cái lỗi của 36 engine kia |
| `BR-CIR-05` (sai thì nhắc lại chính nó) | Sai ở `recognise` hoặc `link` dẫn tới **chạy lại `present` của chính target**, rồi hỏi lại **chính step đó** | Trẻ sai nghĩa là chưa nghe rõ hoặc chưa nhớ. Thứ nó cần là nghe lại đúng thứ đó, không phải một câu hỏi khác |
| `BR-CIR-06` (Cấm âm báo sai) | Cấm — **NEVER** âm buzzer, rung, màu đỏ, hay mặt buồn | `BR-SCF-08` và `BR-CIM-09`. Đây là lần đầu trẻ gặp khái niệm |
| `BR-CIR-07` (`recall` không chặn) | Trả lời sai ở `recall` **không** dừng bài và **không** làm bài phải chạy lại | `recall` là phép đo, không phải cửa. Điều kiện của cổng là **đã đi hết**, không phải **đã đúng** — `D-206-04` |
| `BR-CIR-08` (đã đi hết = hết dãy + phiên completed) | Một lượt tính là đã đi hết chỉ khi vòng lặp chạy hết `steps` **và** `play_sessions.completion_status = 'completed'` **và** `is_preview = false`. Step bị bỏ theo mục 5 **vẫn tính** là đã đi qua | Đây là thứ duy nhất cổng đọc. Định nghĩa lỏng hơn thì cổng mở nhầm; chặt tới mức đòi không step nào bị bỏ thì trẻ kẹt vĩnh viễn ở một step khó |
| `BR-CIR-09` (Cấm micro) | Runtime Cấm — **NEVER** gọi `getUserMedia`, Cấm — **NEVER** xin quyền micro | `BR-CDC-04`, `BR-AST-04`, `BR-CIM-10` |
| `BR-CIR-10` (Cấm chữ bắt buộc đọc) | Mọi chữ trên bề mặt này Cấm — **NEVER** là kênh thông tin duy nhất; luôn có tiếng nói song song | `BR-LSM-07`, `BR-LSR-10`. Bài làm quen là bề mặt dễ vi phạm nhất vì nó là bài **dạy chữ** |
| `BR-CIR-11` (không mastery) | Lượt làm quen Cấm — **NEVER** ghi `mastery_state` | [`progress-and-mastery.md`](progress-and-mastery.md) ghi thành thạo từ **kết quả chơi**. Trẻ vừa được cho biết đáp án ngay trước đó — coi đó là bằng chứng thành thạo là nói dối báo cáo gửi phụ huynh |
| `BR-CIR-12` (không scaffolding leo thang) | Hệ trợ giúp ba cấp của [`scaffolding-and-hints.md`](scaffolding-and-hints.md) **tắt** ở `present`, bật rút gọn ở `recognise` và `link` (chỉ L1 highlight) | Leo thang tồn tại để trẻ không kẹt trong một **thử thách**. `present` không phải thử thách, và ghost hand làm hộ sẽ phá `BR-SCF-04` |
| `BR-CIR-13` (Cấm điểm và đồng hồ) | Cấm — **NEVER** hiện sao, điểm, phần trăm, hay đồng hồ | `BR-ENG-11`, `BR-CIM-08` |
| `BR-CIR-14` (chạy đúng thứ tự khai) | Runner chạy `steps` **theo đúng thứ tự trong `content_pack`**. Cấm — **NEVER** tự sắp lại, tự trộn, hay tự bỏ step | `BR-CIM-14` đảm bảo thứ tự đó thoả "giới thiệu trước, hỏi sau". Runner sắp lại là phá bất biến mà cổng publish vừa kiểm |
| `BR-CIR-15` (một khuôn cho ba loại chất liệu) | Bốn hành động chạy **cùng một đường mã** cho `glyph`, `word`, `image`; chỉ tầng render đọc field riêng của từng loại | Ba nhánh xử lý riêng cho ba loại là ba chỗ để hành vi lệch nhau. Loại chất liệu là **dữ liệu**, không phải nhánh điều khiển |
| `BR-CIR-16` (`word` đọc theo âm tiết) | Chất liệu `kind = 'word'` có `syllables` thì `present` đọc **chậm từng âm tiết** rồi đọc trọn từ | Trẻ học âm tiết cần nghe ranh giới giữa các tiếng. Đọc trọn một lần là bỏ mất đúng thứ đang được dạy |

## 7. Data

**Đọc:** `game_levels` bản `published` của `GT-000` · `content_pack` mục 7.1–7.3 của
[`concept-intro-model.md`](../05-content/concept-intro-model.md).
**Ghi:** `play_sessions` · `play_events` — **không bảng mới** (`D-206-07`).

### 7.1 Trạng thái runner

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `stepIndex` | `number` | Vị trí trong `steps` |
| `stepsTotal` | `number` | Độ dài dãy |
| `assetById` | `Map<string, Asset>` | Kho tra chất liệu, dựng một lần lúc load |
| `deferredStepIds` | `string[]` | Step bỏ sau ba lần sai hoặc thiếu asset — mục 5 |
| `missCountByStep` | `Map<string, number>` | Đếm sai trong step hiện tại, reset khi sang step |
| `recallCorrectCount` | `number` | Số câu `recall` đúng. Tín hiệu, Cấm — **NEVER** là điều kiện |
| `ttsAvailable` | `boolean` | Sai thì chạy nhánh hình + mặt chữ + nhấp nháy |

Cấm — **NEVER** gửi `recallCorrectCount` lên như điểm số. Nó đi trong
`intro_recall_answered` và chỉ ở đó.

### 7.2 Event mới — delta cho [`event-catalog.md`](../00-foundation/event-catalog.md)

| Event | Payload | Khi nào |
|---|---|---|
| `intro_step_started` | `{ step_id, action, target_asset_id, asset_kind }` | Mỗi step bắt đầu |
| `intro_step_answered` | `{ step_id, action, answer_correct, miss_count, tts_used }` | Step `recognise` hoặc `link` kết thúc |
| `intro_step_deferred` | `{ step_id, reason }` | Bỏ step — `reason ∈ miss_limit \| asset_missing` |
| `intro_recall_answered` | `{ step_id, target_asset_id, answer_correct }` | Mỗi step `recall` |
| `tts_unavailable` | `{ lang }` | Máy không có giọng `vi-VN` |

`asset_kind` trong `intro_step_started` là thứ trả lời được câu *"trẻ vướng ở ký tự, ở từ,
hay ở hình?"* — không có nó thì mọi bài dạy hỏng đều trông giống nhau.

`intro_recall_answered.answer_correct` là **tín hiệu chất lượng nội dung**: một bài mà phần
lớn trẻ trả lời sai ở `recall` là bài dạy chưa đạt, không phải lứa trẻ kém.

### 7.3 Ngân sách

| Thứ | Trần |
|---|---|
| Tổng thời lượng khi trẻ trả lời ngay | 120 giây — `BR-CIM-06` |
| Số step một bài | 12 — `BR-CIM-03` |
| Thời gian tới khung hình đầu | Cùng ngân sách level thường, [`game-engine-runtime.md`](../01-platform/game-engine-runtime.md) |
| Request mạng trong lúc chạy | **0** — `BR-ENG-03` |

## 8. API contract

Không sở hữu route mới. Bài làm quen dùng đúng các route của một level:

| Route | Đổi gì |
|---|---|
| `GET /api/users/levels/{code}/config` | Không đổi. Trả `content_pack` của `GT-000` |
| `GET /api/guest/levels/{code}/config` | Không đổi |
| `POST /api/users/play-sessions` | Không đổi |
| `POST /api/users/play-sessions/{uuid}/complete` | Không đổi hình dạng. Nhánh ghi `mastery_state` **bỏ qua** khi template có `kind = 'teach'` — `BR-CIR-11` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-CIR-03 — một step một màn
  Given một bài làm quen có 7 step
  When bài đang chạy
  Then đúng một step hiện trên màn tại mọi thời điểm
  And step present hiện đúng một chất liệu

Scenario: BR-CIR-04 — present không có đáp án sai
  Given trẻ chạm vào chỗ bất kỳ ở một step present
  Then bài sang step kế
  And không phản hồi nào mang nghĩa đúng hoặc sai

Scenario: BR-CIR-05 — sai ở recognise thì được nghe lại chính chất liệu đó
  Given step recognise đang hỏi chữ "m"
  When trẻ chạm chữ "n"
  Then bài chạy lại present của chữ "m"
  And hỏi lại đúng step đó

Scenario: BR-CIR-07 — sai hết recall vẫn đi hết bài
  Given trẻ trả lời sai mọi step recall
  When bài kết thúc
  Then phiên đóng với completion_status = completed
  And cổng coi strand đó là đã làm quen

Scenario: BR-CIR-08 — thoát giữa chừng không tính là đã đi hết
  Given trẻ thoát ở step thứ 3 trên 7
  When kiểm trạng thái làm quen của strand đó
  Then strand chưa được coi là đã làm quen

Scenario: BR-CIR-08 — step bị bỏ vẫn tính là đã đi qua
  Given trẻ sai ba lần ở một step recognise
  When bài chạy hết các step còn lại
  Then phiên đóng với completion_status = completed
  And phát intro_step_deferred với reason = miss_limit

Scenario: BR-CIR-14 — runner không sắp lại dãy
  Given content_pack khai steps theo thứ tự s1..s7
  When bài chạy
  Then thứ tự step phát ra đúng bằng s1..s7

Scenario: BR-CIR-15 — ba loại chất liệu đi cùng một đường mã
  When chạy cùng một dãy action trên glyph, word và image
  Then không loại nào rẽ sang nhánh xử lý riêng ngoài tầng render

Scenario: BR-CIR-16 — từ được đọc theo âm tiết
  Given một asset word có syllables gồm hai tiếng
  When step present của nó chạy
  Then hai tiếng được đọc chậm lần lượt
  And sau đó trọn từ được đọc một lần

Scenario: BR-CIR-09 — không xin micro
  When quét nguồn của GT-000 và của trang chạy nó
  Then không có lời gọi getUserMedia nào

Scenario: BR-CIR-11 — lượt làm quen không ghi mastery
  Given trẻ đi hết một bài làm quen của C1.NREC.01
  When kiểm mastery_state của trẻ
  Then không hàng nào được ghi hay đổi bởi lượt này

Scenario: BR-CIR-12 — present không có ghost hand
  Given trẻ đứng yên 30 giây ở một step present
  Then không có trình diễn ghost hand nào chạy
  And câu của step được đọc lại một lần

Scenario: Step trỏ asset không tồn tại thì không dựng màn trắng
  Given một step trỏ asset_id không có trong assets
  When bài chạy tới step đó
  Then step bị bỏ với reason = asset_missing
  And bài chạy tiếp step kế

Scenario: Máy không có giọng vi-VN thì bài vẫn đi hết được
  Given Web Speech không có voice vi-VN
  When trẻ chạy hết dãy step
  Then phát tts_unavailable
  And phiên vẫn đóng với completion_status = completed
```

## 10. Boundaries

**Always**
- Luôn có tiếng nói song song với mọi chữ trên màn.
- Luôn để trẻ tự chạm để đi tiếp.
- Luôn chạy `steps` đúng thứ tự người soạn khai.
- Luôn đóng phiên bằng đúng đường `play-session-lifecycle` như mọi level.

**Ask first**
- Thêm hành động thứ năm ngoài `present | recognise | link | recall`.
- Cho runner tự trộn thứ tự step để chống học vẹt.
- Cho phép bỏ qua `present` với chất liệu trẻ đã gặp ở một bài làm quen trước.
- Bật scaffolding đầy đủ ở `recognise` và `link`.

**Never**
- Cấm — **NEVER** yêu cầu micro hoặc lưu giọng trẻ.
- Cấm — **NEVER** chặn trẻ ở lại vì trả lời sai.
- Cấm — **NEVER** ghi `mastery_state` từ một lượt làm quen.
- Cấm — **NEVER** hiện điểm, sao, hay đồng hồ.
- Cấm — **NEVER** rẽ nhánh điều khiển theo loại chất liệu ngoài tầng render.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | `link` dùng kéo–thả hay chạm–chạm với trẻ 3 tuổi? | Thiết kế tương tác | P4 | Studio UI |
| 2 | Trẻ đã làm quen strand nền có được rút ngắn phần `present` không? | Thiết kế runner | P4 | hoãn — mở lại khi có số liệu `intro_recall_answered` của 20 bài đầu |
| 3 | Ảnh chụp QA của `GT-000` cần mấy khung để phủ bốn hành động × ba loại chất liệu? | `qa:capture` | P4 | Studio UI |
