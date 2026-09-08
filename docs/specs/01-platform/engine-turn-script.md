---
spec: ENGINE-TURN-SCRIPT
title: Kịch bản một lượt chơi — bảy nhịp từ mở màn tới chơi lại
area: platform
status: draft
mvp: false
phase: P4
reviewed: 2026-09-08
owns:
  - Bảy nhịp của một lượt chơi và thứ tự bắt buộc giữa chúng
  - Luật mở màn — thứ tự dựng cảnh và thời điểm nhận chạm đầu tiên
  - Luật tự đọc đề — nguồn lời đọc, số lần phát, nghe lại, khi tắt âm
  - Luật lần chơi lại thứ n của cùng một level
  - Tám nhánh bắt buộc của mục 5 phiếu engine
depends_on:
  - ENGINE-PLAY-LANGUAGE
  - GAME-ENGINE-RUNTIME
  - GAME-CONFIG-DELIVERY
  - ROUND-SEQUENCE-PLAY
  - SCAFFOLDING-AND-HINTS
  - FEEDBACK-AND-CELEBRATION
---

# Kịch bản một lượt chơi — bảy nhịp từ mở màn tới chơi lại

## 1. Objective

Mục 4 của một phiếu engine phải trả lời được câu hỏi của người soạn nội dung và của người
cài `session.ts`: *vào màn hiện gì trước, hệ thống tự đọc gì, trẻ chạm được từ lúc nào, chạm
xong thấy gì, bế tắc thì được giúp ra sao, xong rồi màn hình còn lại gì, và lần chơi thứ hai
khác lần đầu chỗ nào.*

Hôm nay nó không trả lời được. Đo ngày 2026-09-08 trên 37 phiếu:

- **26 trên 37** phiếu có mục 4 là **bản sao chữ**, chỉ khác đúng tên cơ chế ở dòng 3:
  *"Trẻ tương tác theo cơ chế `<mechanic>`"*. Sáu bước, không bước nào nói được engine này
  khác engine kia ở chỗ nào khi đứa trẻ ngồi trước màn hình.
- Mục 5 có **trung vị 4 nhánh**, và bốn nhánh đó cũng là bản sao: sai · hết giờ gợi ý ·
  asset hỏng · thiết bị yếu. Không phiếu boilerplate nào nói **bỏ dở giữa chừng** hay
  **chơi lại lần thứ hai**.

Và một lỗ thật, không phải lỗ văn bản. Nhịp *"hệ thống tự đọc gì"* có **hai trường song song**:

| Trường | Khai ở đâu | Ai đọc |
|---|---|---|
| `content_pack.prompt_audio_ref` | `promptFields()` — **36 / 37** contract engine | **Không ai.** Chỉ contract, gate-09 và test chạm tới |
| `game_levels.instruction_audio_path` | cột DB, trả trong config từng vòng | `use-play-audio.ts` của bề mặt chơi — **đây là đường sống** |

Engine duy nhất **không** khai `prompt_audio_ref` là `GT-000`, và nó lại là engine duy nhất
tự gọi `playPromptAudio()` trong `session.ts`. Nghĩa là: 36 engine mang một trường cho lời
đọc mà không bao giờ đọc nó, còn engine đọc thật thì không mang trường đó.

> **ĐÃ ĐÓNG 2026-09-08 (Task #262).** Chốt giữ `game_levels.instruction_audio_path`.
> `content_pack.prompt_audio_ref` bị khai tử khỏi `promptFields()`, khỏi 36 contract,
> khỏi `gate-09-concept-present.ts` và `config-dictionary.ts`. Lượt review cùng ngày đo
> thêm hai chỗ và đóng nốt: `GT-018.audio_prompt.audio_url` là **đường thứ ba** cũng
> soạn được mà không ai đọc — đã gỡ; và mục 4 của **cả 37 phiếu** nay gọi đúng tên
> `instruction_audio_path`. Bậc thang giữ: `check:engine-turn` (nhịp `N2` + cấm tên đã
> khai tử) và `packages/game-engine/tests/gates/one-narration-source.test.ts` (quét
> contract nội dung của 37 engine). `GT-000.assets[].audio_path` **không** thuộc luật
> này: đó là âm của từng chất liệu, và `GT000Session` thật sự phát nó.

Spec này sở hữu **kịch bản**: bảy nhịp, thứ tự giữa chúng, và ba nhịp chưa ai sở hữu — mở
màn, tự đọc đề, chơi lại. Nó **cấm — NEVER** định nghĩa lại thứ đã có chủ: cử chỉ là của
[`engine-play-language.md`](engine-play-language.md), leo thang trợ giúp là của
[`scaffolding-and-hints.md`](../04-play/scaffolding-and-hints.md), phản hồi và ăn mừng là của
[`feedback-and-celebration.md`](../04-play/feedback-and-celebration.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | — | Đi qua bảy nhịp; nghe lại đề; dừng và quay lại |
| Dev | — | Viết mục 4 và mục 5 của phiếu engine theo bảy nhịp và tám nhánh |
| Người soạn nội dung | `content_reviewer` | Đọc mục 4 để biết câu đề của mình được đọc lúc nào và bằng kênh gì |
| Bề mặt chơi | — | Dựng cảnh, phát lời đọc, giữ nút nghe lại, đóng phiên |
| Cổng `check:engine-turn` | — | Đối chiếu mục 4 với bảy nhịp, mục 5 với tám nhánh |

## 3. Entry points

| Nơi | Actor | Ghi chú |
|---|---|---|
| `docs/specs/01-platform/engines/GT-<nnn>.md` mục 4 | mọi actor | Bảy nhịp `N1`…`N7`, nội dung cụ thể của engine |
| `docs/specs/01-platform/engines/GT-<nnn>.md` mục 5 | mọi actor | Tám nhánh bắt buộc cộng nhánh riêng |
| `apps/web/app/composables/play/use-play-audio.ts` | Dev | Đường lời đọc đang chạy: tệp giọng rồi TTS |
| `apps/web/app/pages/play/[code].vue` | Dev | Dựng cảnh, nút nghe lại, mở và đóng phiên |
| `packages/game-engine/src/systems/audio-controller.ts` | Dev | `playPromptAudio()` · `speakPrompt()` |
| `pnpm --filter @mindkid/game-engine check:engine-turn` | Cổng | Chạy cùng `check:engine-specs` |

## 4. Main flow

Bảy nhịp, đúng thứ tự này. Mục 4 của mọi phiếu engine đánh số theo đúng `N1`…`N7`.

```
N1 mở màn    → N2 ra đề → N3 thao tác ⇄ N4 phản hồi → N6 kết lượt → N7 chơi lại
                              ↑            ↓
                              └── N5 trợ giúp (chỉ khi trẻ dừng lại)
```

1. **`N1` Mở màn** — config đã về và **mọi asset đã preload** (`BR-GCD`); engine dựng cảnh
   theo thứ tự nền → phần tử tĩnh → phần tử tương tác; chỉ khi cảnh dựng xong, bề mặt mới
   nhận cử chỉ. Phát `question_shown`.
2. **`N2` Ra đề** — lời đọc phát **tự động một lần**, theo thang ba bậc của mục 7.3. Nút nghe
   lại có mặt từ nhịp này tới hết lượt. Nhịp hệ thống tương ứng: `reveal`.
3. **`N3` Thao tác** — trẻ dùng cử chỉ chủ đạo của engine (`tap` · `drop` · `stroke` ·
   `adjust`), đóng lượt bằng `commit` nếu engine có bước nộp.
4. **`N4` Phản hồi tức thì** — mỗi cử chỉ hợp lệ đổi ít nhất một trạng thái thị giác trong
   ≤100ms; đúng thì khoá vào chỗ, sai thì trôi về chỗ cũ kèm nhịp hổ phách.
5. **`N5` Trợ giúp** — trẻ dừng quá ngưỡng thì leo thang `L1` → `L2` → `L3`. Nhịp hệ thống:
   `hint`. Ngưỡng và ba cấp là của `scaffolding-and-hints.md`; phiếu engine nói **ba cấp đó
   trông ra sao ở engine này**.
6. **`N6` Kết lượt** — `checkWinCondition()` trả `true` → giữ nguyên thành quả của trẻ trên
   màn ít nhất một nhịp trước khi chuyển; phát `round_completed`; vòng cuối thì
   `game_completed` rồi mới tới màn tổng kết.
7. **`N7` Chơi lại** — vào lại cùng một level: **seed mới** nên bàn khác (`BR-RNG-07`), độ
   khó **giữ nguyên**, trợ giúp **reset về `L0`**, đề **đọc lại đầy đủ**.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Chạm trước khi cảnh dựng xong | Trẻ chạm lúc còn preload | Cử chỉ bị nuốt, cấm — NEVER tính là sai (`BR-ETS-02`) |
| Không có tệp giọng, không có TTS `vi-VN` | Máy thiếu giọng | Phát `tts_unavailable`, chạy tiếp bằng kênh hình; lượt vẫn hoàn thành được (`BR-ETS-05`) |
| Trẻ bấm nghe lại giữa lúc đang đọc | Chạm nút nghe lại | Dừng lời đang đọc rồi phát lại từ đầu — cấm hai lời chồng nhau |
| Trẻ rời màn giữa lượt | Đóng tab, chuyển trẻ | Phiên thành `abandoned` theo `BR-PSL`; quay lại là **lượt mới**, cấm khôi phục nửa lượt |
| Chơi lại ngay sau khi thua | Trẻ bấm chơi lại | Bàn mới, độ khó **không** tăng và **không** giảm (`BR-ETS-10`) |
| Engine đo trí nhớ nghe | `GT-018` · `GT-034` | Được siết số lần nghe lại bằng `replay_limit`, nhưng cấm bỏ hẳn nút nghe lại |
| Engine `nhịp-đề` | `GT-012` · `GT-020` | Đề tự tắt là **một phần bài**; nút nghe lại đổi thành "xem lại" chỉ khi `difficulty_params` cho phép |
| `GT-000` | Engine `kind = 'teach'` | Giai đoạn giới thiệu **không** có `N4` sai — không có đáp án sai để phản hồi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ETS-01` (bảy nhịp, đóng) | Mục 4 của phiếu engine đánh số theo đúng bảy nhịp `N1`…`N7`, đúng thứ tự. Cấm — NEVER đặt nhịp thứ tám, cấm bỏ nhịp; nhịp không áp dụng thì ghi lý do tại chỗ | 26 trên 37 phiếu hôm nay có mục 4 là bản sao sáu bước. Bản sao không sai — nó **rỗng**, và rỗng thì không ai phát hiện ra khi đọc diff |
| `BR-ETS-02` (chạm sau khi cảnh xong) | Bề mặt chỉ nhận cử chỉ khi asset đã preload **và** cảnh đã dựng. Cử chỉ trước đó bị nuốt, cấm — NEVER tính là lần sai | Trẻ ba tuổi chạm vào chỗ trống trong lúc chờ. Tính đó là sai thì bài mở đầu bằng một lần thua mà trẻ không hiểu vì đâu |
| `BR-ETS-03` (đề tự phát một lần) | Lời đọc phát **tự động đúng một lần** khi vào lượt; cấm tự lặp. Nút nghe lại có mặt suốt lượt, không giới hạn số lần trừ khi engine khai `replay_limit` | Lặp tự động cắt ngang lúc trẻ đang nghĩ. Nhưng trẻ chưa đọc chữ thì phải nghe lại được — bỏ nút nghe lại là bỏ luôn đề |
| `BR-ETS-04` (một nguồn lời đọc) | Lời đọc đến từ **một** trường: `game_levels.instruction_audio_path`. `content_pack` Cấm — NEVER khai lại một đường tệp âm cho lời đề (`prompt_audio_ref`, `audio_url`, `*_audio_ref` đã khai tử 2026-09-08); mục 4 của phiếu engine phải gọi đúng tên trường còn sống | Hai trường cho một việc là một trường luôn rỗng. Người soạn nội dung điền `prompt_audio_ref` hôm nay sẽ không nghe thấy gì và không có gì báo cho họ biết |
| `BR-ETS-05` (tắt âm không mất bài) | Mọi thứ lời đọc nói ra phải có kênh hình song song. Mất giọng, tắt âm, hay không có TTS `vi-VN` đều **không** chặn lượt chơi hoàn thành | `BR-ENG-10` cấm chữ đứng một mình; luật này cấm **âm** đứng một mình. Lớp học mầm non thường tắt tiếng máy |
| `BR-ETS-06` (một cử chỉ một hành động) | Nhịp `N3` của phiếu ánh xạ mỗi cử chỉ engine dùng sang **đúng một** hành động, bằng từ vựng của [`engine-play-language.md`](engine-play-language.md) | `BR-EPL-01` đã dọn 47 động từ duck-typing về 6 cử chỉ. Phiếu viết động từ riêng là đường quay lại chỗ cũ |
| `BR-ETS-07` (im lặng là defect) | Mọi cử chỉ hợp lệ đổi ≥1 trạng thái thị giác trong **≤100ms**, kể cả khi kết quả là sai | Không phản hồi thì trẻ tưởng máy hỏng và chạm mạnh hơn. Đây là `BR-FBK` nói bằng một con số kiểm được |
| `BR-ETS-08` (trợ giúp cụ thể) | Nhịp `N5` của phiếu nói `L1` · `L2` · `L3` **trông ra sao ở engine này** — highlight cái gì, bàn tay ma làm động tác gì | Ba cấp chung không cài được: bàn tay ma của `GT-013` vạch một đường, của `GT-004` nhấc một vật sang rổ. Cấp chung không nói được sự khác đó |
| `BR-ETS-09` (thành quả ở lại) | Khi thắng, cấm — NEVER xoá màn ngay. Cấu hình trẻ vừa tạo ở lại ≥1 nhịp trước khi chuyển vòng | Thứ trẻ vừa làm là thành quả của trẻ. Cắt phăng nó đi để chạy hiệu ứng ăn mừng là lấy mất phần đáng nhìn nhất |
| `BR-ETS-10` (chơi lại không đổi độ khó) | Lần chơi thứ n: bàn mới theo seed mới, độ khó **giữ nguyên**, trợ giúp reset về `L0`, đề đọc lại đầy đủ. Đổi độ khó là việc của [`adaptive-engine.md`](adaptive-engine.md) giữa các phiên, cấm làm ngay trong lần bấm chơi lại | Trẻ bấm chơi lại vì muốn làm lại đúng bài đó. Bài khó lên ngay sau một lần thua đọc thành hình phạt |
| `BR-ETS-11` (tám nhánh bắt buộc) | Mục 5 của phiếu phủ đủ tám nhánh ở mục 7.4, mỗi nhánh một hàng, cộng nhánh riêng của engine | Trung vị hôm nay là 4 nhánh, và không phiếu boilerplate nào có nhánh **bỏ dở** hay **chơi lại** — hai nhánh trẻ gặp nhiều nhất |
| `BR-ETS-12` (cổng có ca âm) | `check:engine-turn` có ≥6 test ca âm: thiếu một nhịp, sai thứ tự nhịp, mục 4 còn chuỗi bản sao, thiếu một nhánh bắt buộc, nhịp `N5` không nói ba cấp, nhịp `N2` không trỏ trường lời đọc | Cổng không có ca âm là cổng không biết mình hỏng (`BR-ESS-09`) |

## 7. Data

**Đọc:** phiếu engine mục 4 và 5 · registry engine · `use-play-audio.ts` · schema `game_levels`.
**Ghi:** không ghi database.

### 7.1 Bảy nhịp và ai sở hữu chi tiết

| Nhịp | Câu hỏi nó trả lời | Chi tiết thuộc spec nào | Phiếu engine phải nói riêng cái gì |
|---|---|---|---|
| `N1` mở màn | Hiện gì, theo thứ tự nào, nhận chạm từ lúc nào | **File này** + [`game-config-delivery.md`](../04-play/game-config-delivery.md) | Thứ tự dựng của engine, phần tử nào xuất hiện sau cùng |
| `N2` ra đề | Đọc gì, mấy lần, nghe lại ở đâu | **File này** | Câu đề của engine và kênh hình song song |
| `N3` thao tác | Cử chỉ nào hợp lệ, cái gì nhận chạm | [`engine-play-language.md`](engine-play-language.md) | Ánh xạ cử chỉ → hành động của engine |
| `N4` phản hồi | Mỗi thao tác trả lại gì | [`feedback-and-celebration.md`](../04-play/feedback-and-celebration.md) | Trạng thái thị giác riêng của engine |
| `N5` trợ giúp | Bế tắc thì leo thang ra sao | [`scaffolding-and-hints.md`](../04-play/scaffolding-and-hints.md) | `L1`/`L2`/`L3` cụ thể của engine |
| `N6` kết lượt | Thắng, hết vòng, bỏ dở thì sao | [`round-sequence-play.md`](../04-play/round-sequence-play.md) · [`play-session-lifecycle.md`](../04-play/play-session-lifecycle.md) | Điều kiện thắng và thứ còn lại trên màn |
| `N7` chơi lại | Lần thứ n khác gì lần đầu | **File này** + [`deterministic-randomness.md`](deterministic-randomness.md) | Cái gì đổi theo seed, cái gì giữ nguyên |

Ba nhịp in đậm chữ **File này** là ba nhịp trước đây không ai sở hữu.

### 7.2 Nhịp của spec này và `SystemBeat` của engine

`SystemBeat` chỉ có ba giá trị `reveal` · `hint` · `timeout` và **không đổi** (`BR-EPL-02`).
Bảy nhịp ở đây là **kịch bản**, không phải nhịp hệ thống; ánh xạ:

| Nhịp kịch bản | `SystemBeat` |
|---|---|
| `N2` ra đề | `reveal` |
| `N5` trợ giúp | `hint` |
| `N6` kết lượt khi trẻ không thao tác nữa | `timeout` |
| `N1` · `N3` · `N4` · `N7` | không sinh nhịp hệ thống nào |

### 7.3 Thang ba bậc của lời đọc

| Bậc | Nguồn | Khi nào dùng |
|---|---|---|
| 1 | Tệp giọng người thật của level | Luôn ưu tiên nếu có |
| 2 | TTS đọc `prompt` bằng giọng `vi-VN` | Khi không có tệp giọng |
| 3 | Chỉ dấu hình — không có lời | Khi máy không có giọng `vi-VN`; phát `tts_unavailable` |

Bậc 3 **không** phải lỗi: nó là chế độ chạy hợp lệ, và `BR-ETS-05` bắt mọi bài phải hoàn
thành được ở bậc này.

### 7.4 Tám nhánh bắt buộc của mục 5

| # | Nhánh | Ghi rõ điều gì |
|---|---|---|
| 1 | Thao tác sai, còn lượt | Cái gì trôi về chỗ cũ, cái gì giữ nguyên |
| 2 | Thao tác sai, hết lượt | Lượt đóng thế nào, có hiện đáp án không |
| 3 | Trẻ dừng lại, không thao tác | Ngưỡng nào leo thang, sau `L3` thì gì |
| 4 | Không nghe được lời đọc | Kênh hình thay thế cụ thể của engine |
| 5 | Asset hỏng | Vẽ gì thay chỗ, cái gì cấm biến mất |
| 6 | Thiết bị yếu hoặc `prefers-reduced-motion` | Thứ tự tuột, lớp nào cấm bỏ |
| 7 | Bỏ dở giữa lượt | Phiên thành gì, quay lại bắt đầu từ đâu |
| 8 | Chơi lại lần thứ n | Cái gì đổi, cái gì giữ |

## 8. API contract

Không có. Kịch bản chạy trong tiến trình bề mặt chơi; các route liên quan thuộc
[`game-config-delivery.md`](../04-play/game-config-delivery.md) và
[`play-session-lifecycle.md`](../04-play/play-session-lifecycle.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-ETS-01 — phiếu thiếu một nhịp làm cổng đỏ
  Given phiếu GT-011 có mục 4 chỉ đánh số tới N5
  When chạy check:engine-turn
  Then cổng thoát với mã khác 0
  And thông báo nêu nhịp còn thiếu

Scenario: BR-ETS-01 — mục 4 còn chuỗi bản sao làm cổng đỏ
  Given phiếu GT-011 có mục 4 chứa "Trẻ tương tác theo cơ chế"
  When chạy check:engine-turn
  Then cổng thoát với mã khác 0

Scenario: BR-ETS-02 — chạm lúc còn preload không bị tính là sai
  Given một level đang preload asset
  When trẻ chạm vào vùng chơi
  Then engine không nhận cử chỉ nào
  And không sự kiện sai nào được phát

Scenario: BR-ETS-03 — đề tự phát đúng một lần
  Given trẻ vừa vào một lượt chơi có lời đọc
  When 30 giây trôi qua mà trẻ không thao tác
  Then lời đọc không tự phát lại lần nào
  And nút nghe lại vẫn bấm được

Scenario: BR-ETS-03 — bấm nghe lại giữa lúc đang đọc
  Given lời đọc đang phát
  When trẻ bấm nút nghe lại
  Then lời đang phát bị dừng
  And lời đọc phát lại từ đầu, không có hai lời chồng nhau

Scenario: BR-ETS-04 — chỉ một trường mang lời đọc
  When đọc mọi content_contract và schema game_levels
  Then chỉ một trường được engine và bề mặt chơi cùng đọc cho lời đề

Scenario: BR-ETS-05 — máy không có giọng vi-VN vẫn chơi xong được
  Given máy không có giọng vi-VN và level không có tệp giọng
  When trẻ chơi hết lượt
  Then sự kiện tts_unavailable được phát
  And lượt chơi vẫn hoàn thành được bằng kênh hình

Scenario: BR-ETS-06 — nhịp N3 dùng đúng từ vựng cử chỉ
  When đọc nhịp N3 của mọi phiếu engine
  Then mỗi hành động ánh xạ từ một trong sáu cử chỉ tap, drop, stroke, adjust, commit, revert

Scenario: BR-ETS-07 — thao tác luôn có phản hồi dưới 100ms
  Given một phiên chơi đang chạy
  When trẻ thực hiện một cử chỉ hợp lệ dẫn tới kết quả sai
  Then ít nhất một trạng thái thị giác đổi trong vòng 100ms

Scenario: BR-ETS-08 — nhịp N5 không nói ba cấp làm cổng đỏ
  Given phiếu GT-011 có nhịp N5 chỉ ghi "scaffolding highlight"
  When chạy check:engine-turn
  Then cổng thoát với mã khác 0

Scenario: BR-ETS-09 — thành quả ở lại trước khi chuyển vòng
  Given trẻ vừa hoàn thành một vòng
  When engine chuyển sang vòng kế
  Then cấu hình trẻ vừa tạo còn trên màn ít nhất một nhịp trước khi cảnh đổi

Scenario: BR-ETS-10 — chơi lại không đổi độ khó
  Given trẻ vừa chơi hỏng một level
  When trẻ bấm chơi lại ngay
  Then difficulty_params của lượt mới bằng đúng lượt trước
  And layout_seed khác lượt trước
  And cấp trợ giúp bắt đầu lại từ L0

Scenario: BR-ETS-11 — thiếu một nhánh bắt buộc làm cổng đỏ
  Given phiếu GT-011 có mục 5 không có hàng cho nhánh bỏ dở giữa lượt
  When chạy check:engine-turn
  Then cổng thoát với mã khác 0

Scenario: BR-ETS-12 — cổng có ca âm
  Given bộ test của check:engine-turn
  When đọc danh sách test
  Then có ít nhất 6 test ca âm phủ các điều kiện vi phạm ở trên
```

## 10. Boundaries

**Always**
- Dựng cảnh xong rồi mới nhận cử chỉ.
- Phát lời đọc đúng một lần và giữ nút nghe lại suốt lượt.
- Cho lượt chơi hoàn thành được khi không có lời đọc nào.
- Nói `L1`/`L2`/`L3` bằng hình ảnh cụ thể của engine.
- Giữ thành quả của trẻ trên màn trước khi chuyển vòng.

**Ask first**
- Siết số lần nghe lại của một engine.
- Thêm một nhánh bắt buộc thứ chín vào mục 5.
- Cho một nhịp không áp dụng với một engine.

**Never**
- Đặt nhịp thứ tám hoặc đổi thứ tự bảy nhịp (`BR-ETS-01`).
- Tính cử chỉ lúc còn preload là một lần sai (`BR-ETS-02`).
- Tự lặp lời đọc, hoặc phát hai lời chồng nhau (`BR-ETS-03`).
- Giữ hai trường song song cho cùng một lời đề (`BR-ETS-04`).
- Tăng độ khó ngay trong lần bấm chơi lại (`BR-ETS-10`).

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | **ĐÃ TRẢ LỜI 2026-09-08 (Task #262)** — giữ `instruction_audio_path`, khai tử `prompt_audio_ref` và `GT-018.audio_prompt.audio_url` | — | — | Backend |
| 2 | Nút nghe lại thuộc bề mặt chơi hay thuộc engine? Hôm nay nó ở `[code].vue`, nên engine chạy trong studio preview không có nó | Nhất quán giữa preview và bản thật | P4 | Backend |
| 3 | `N6` giữ thành quả "ít nhất một nhịp" là bao nhiêu mili giây? Quá ngắn thì không kịp nhìn, quá dài thì trẻ sốt ruột chạm bừa | Ngưỡng trong runner vòng | P4 | Nội dung |
| 4 | Lần chơi thứ n có nên đổi **chủ đề** (cùng cơ chế, cùng độ khó, khác bối cảnh) thay vì chỉ đổi seed? Trục `boi-canh` của mục 18 làm được điều đó | Quan hệ giữa `BR-ETS-10` và trục biến thể | P5 | Nội dung |
