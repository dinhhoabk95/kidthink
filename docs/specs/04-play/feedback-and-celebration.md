---
spec: FEEDBACK-AND-CELEBRATION
title: Phản hồi và ăn mừng
area: play
status: implemented
mvp: true
phase: P1
reviewed: 2026-10-18
owns:
  - Ngôn ngữ phản hồi đúng/sai
  - Quy tắc ăn mừng
depends_on:
  - GAME-ENGINE-RUNTIME
  - SCORING-AND-RESULT
---

# Phản hồi và ăn mừng

## 1. Objective

Trẻ 3–6 học từ phản hồi tức thì, không học từ trừng phạt. Nhưng **im lặng cũng là
defect** — không phản hồi thì trẻ không biết mình đã thao tác.

Khoảng ở giữa hẹp và cần spec: phản hồi rõ, tích cực, không trừng phạt, không lạm phát.

## 2. Actors

| Actor | Nhận gì |
|---|---|
| Trẻ | Toàn bộ phản hồi trực quan và âm thanh |
| Người lớn | Cấm thấy màn hình này |

## 3. Entry points

`packages/game-engine/src/systems/feedback-system.ts` (bảng phản hồi, lời khen) ·
`packages/game-engine/src/systems/feedback-overlay.ts` (pop tại điểm chạm, dáng mascot theo thời gian) ·
`packages/game-engine/src/render/mascot.ts` (vẽ mascot theo dáng) · màn hình tổng kết cuối phiên
(`apps/web/app/components/kid/victory-modal.vue`).

## 4. Main flow

| Sự kiện | Phản hồi |
|---|---|
| Chạm/kéo bắt đầu | Item nhấc lên nhẹ, bóng đổ sâu hơn |
| Thả **đúng** | Pop nhỏ **tại điểm chạm** + âm ngắn dễ chịu + item khoá vào vị trí |
| Thả **sai** | Nhịp hổ phách trên target + âm nhẹ (ramp ≥20ms) + item **trôi về chỗ cũ** |
| Round hoàn thành | Chuyển cảnh mượt, không ăn mừng lớn |
| Level hoàn thành | **Ăn mừng lớn**: hạt, sao, mascot, lời khen tiếng Việt |

Mọi dòng trong bảng trên có tiếng thì mascot ở vùng lời dẫn đổi dáng trong **cùng khung vẽ** —
xem §7.4.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| `prefers-reduced-motion` | Ăn mừng thành **một nhịp scale 400ms** — vẫn rõ là ăn mừng |
| Âm bị tắt | Phản hồi hình ảnh **tăng cường**, không mất kênh |
| Phiên `abandoned` | Cấm ăn mừng, không sao |
| Sai nhiều lần liên tiếp | Phản hồi **không đổi** — không tăng cường độ "sai" |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-FBK-01` | Cấm — **NEVER màu đỏ, buzzer, rung mạnh, hay trừ điểm** khi sai | Đỏ đọc thành trừng phạt ở tuổi 3–6 |
| `BR-FBK-02` | Cấm — **NEVER im lặng khi sai** — im lặng là defect | Trẻ không biết mình đã thao tác |
| `BR-FBK-03` | "Chưa đúng" dùng **hổ phách**, không `danger` | `danger` là token của bề mặt người lớn |
| `BR-FBK-04` | Ăn mừng lớn **chỉ** khi hoàn thành level | Ăn mừng mọi lúc làm ăn mừng mất nghĩa |
| `BR-FBK-05` | Pop khi đúng phát ra **tại điểm chạm**, không từ toạ độ hardcode | Phản hồi phải gắn với hành động của trẻ |
| `BR-FBK-06` | Cấm — **NEVER màu là kênh duy nhất** — kèm hình dạng, chuyển động, hoặc âm | Trẻ mù màu và màn hình kém |
| `BR-FBK-07` | Cường độ phản hồi sai **không tăng** theo số lần sai | Tăng dần đọc thành trách móc |
| `BR-FBK-08` | Lời khen Cấm — **NEVER so sánh trẻ với trẻ khác** | Tránh gây áp lực đố kị và duy trì động lực nội tại cho trẻ |
| `BR-FBK-09` | `reduced-motion` **giảm**, không bỏ ăn mừng | Bỏ ăn mừng là bỏ phần thưởng |
| `BR-FBK-10` | Âm: ramp vào ≥20ms, ra ≥40ms, master ceiling cưỡng chế | Onset tức thì làm trẻ giật mình |
| `BR-FBK-11` | Mỗi phản hồi đúng/sai có **dáng mascot** đi kèm ngay khung vẽ kế tiếp (≤100ms), và vòng pop/nhịp hổ phách vẽ bởi **một lớp phủ chung** của bề mặt chơi, không phải từng engine | `BR-PSZ-10` — tắt tiếng thì mascot là kênh còn lại; lớp chung để 37 engine phản hồi giống nhau mà không sửa engine |
| `BR-FBK-12` | Màn tổng kết level **đọc thành tiếng** một lời khen của §7.2 khi mở, và nút của trẻ chỉ có icon (chữ chỉ ở `aria-label`) | `BR-ENG-10` — trẻ 3–6 chưa đọc; tiêu đề chữ một mình không phải phần thưởng |
| `BR-FBK-13` | Khi chưa đúng, bề mặt chơi **đọc thành tiếng** một câu khích lệ của §7.2, xoay vòng không lặp liên tiếp. Có giọng Việt thì TTS đọc; không có giọng thì phát mp3 dự phòng cùng chỉ số (`RETRY_ENCOURAGEMENT_AUDIO`), mỗi lần đúng một nguồn. Câu nói nối **sau** tên vật vừa chạm, không cắt ngang; tap sai dồn dập trong cooldown 400ms chỉ nói một câu. Engine có pill Montessori thì lời của pill (`BR-PNR-12`) thay câu chung | `BR-FBK-02` — chỉ âm mềm và nhịp hổ phách chưa nói cho trẻ 3–6 tuổi biết phải làm gì; máy không có giọng Việt vẫn nghe được qua mp3 |
| `BR-FBK-14` | Engine có thể khai **cue âm đặc trưng** của riêng mình (session xếp hàng `SFXType` qua `queueSfx`, hàng đợi trần 8). `GameEngine.advanceFrame` rút hàng đợi mỗi khung và phát qua `audio.play` — trễ tối đa một khung, theo đúng thứ tự xếp, không phát khi âm tắt. Mọi cue là âm tổng hợp (không file) và tuân `BR-FBK-10`; cue **bổ sung** chứ không thay âm đúng/chưa đúng chung của `BR-FBK-02` | `BR-ENG-03` — trải nghiệm riêng của từng trò cần âm riêng mà không để session giữ `AudioContext`; hàng đợi có trần để lượt chạm dồn dập không xếp hàng vô hạn |
| `BR-FBK-15` | Session khai **tâm trạng mascot** qua `mascotMood()` (dáng, hoặc `null`). Thứ tự dáng nền: lời dẫn đang đọc (`listen`) > trợ giúp (`hint`) > tâm trạng của session > `idle` — trẻ đang kẹt luôn thấy dáng gợi ý, tâm trạng (vd `wonder` suốt vòng GT-025) không được che nó. Dáng phản hồi đúng/chưa đúng của lớp phủ (`BR-FBK-11`, 700ms) vẫn đè lên dáng nền. Ba dáng mới `wonder` (nghiêng đầu thắc mắc), `freeze` (đứng hình, không nảy), `cheer` (nảy nhẹ khi gom được một thứ) | `BR-FBK-11` — mascot phản ứng theo *tình huống của trò*, không chỉ theo đúng/sai; tắt tiếng thì mascot vẫn nói được trò đang ở nhịp nào |
| `BR-FBK-16` | **Khung chuyện**: session khai `storyLine()` — một câu bối cảnh nói được. Bề mặt chơi đọc nó **đúng một lần** ở vòng đầu của level, ngay trước câu dẫn (`round_open`), cùng một lượt phát với câu dẫn; "nghe lại" chỉ đọc câu dẫn. Khung chuyện Cấm — **NEVER** vẽ lên canvas và không phải chữ trẻ phải đọc (`BR-ENG-10`); không so sánh trẻ với trẻ khác (`BR-FBK-08`) | Trẻ 3–6 vào trò bằng câu chuyện nghe được; đọc ở mọi vòng thì lặp lại và nhàm |
| `BR-FBK-17` | Ba dáng `wonder`, `freeze`, `cheer` có **sprite SVG riêng** (`mascot-bear-wonder/freeze/cheer.svg`, cùng viewBox 120 và bảng màu với bốn sprite gốc) — không còn dùng chung `thinking`/`waiting`/`jumping`. Mỗi dáng khác nhau ở nét mặt/tay, không chỉ ở chuyển động, để trẻ tắt tiếng vẫn phân biệt được. Phần giọng thu vẫn thuộc đội thu âm. |
| `BR-FBK-18` | **Nghi thức mở quà cuối bài & mở tức thì**: màn thưởng (`KidVictoryModal`) hiện ngay khi xong vòng cuối (không chặn bởi độ trễ mạng `/complete`). Khi có `sticker` mới (`BR-STK-08`), màn thưởng hiển thị hộp quà gỗ lắc nhẹ để trẻ chủ động chạm mở nhận sticker kèm đọc tên tiếng Việt (hoặc tự mở êm sau thao tác tiếp tục nếu trẻ bỏ qua) | Biến phần thưởng thành khoảnh khắc háo hức có tính tác nhân (agency) kiểu *Sago Mini*, đồng thời loại bỏ hiện tượng đứng màn hình khi mạng chậm |
| `BR-FBK-20` | **Chữ trên pill khi chưa đúng không lộ đáp án và không dùng giọng người lớn**: `reasonVi` của control-of-error (GT-007, GT-010, GT-014, GT-016, GT-028) là một câu ngắn, khích lệ, xưng "bé", không chứa giá trị đáp án, giờ mục tiêu, hiệu số hay phép tính. Số liệu chi tiết nằm ở `actualValue` / `expectedValue` của chẩn đoán (cho telemetry, không lên màn hình) | Trẻ 3–6 tuổi chưa đọc thành thạo; câu "Đồng hồ chỉ 03:00, mục tiêu là 03:00" hay "cần 2" đọc to lên là đọc đáp án, và giọng báo cáo làm trẻ thấy mình bị chấm lỗi (`BR-FBK-02`, `BR-PNR-12`) |

## 7. Data

### 7.1 Bảng phản hồi

| Trạng thái | Màu token | Chuyển động | Âm |
|---|---|---|---|
| Nhấc | — | scale 1,05 · shadow sâu | tick nhẹ |
| Đúng | `success` | pop 260ms tại điểm chạm | note lên |
| Chưa đúng | `retry` (hổ phách) | nhịp 2 lần trên target · item trôi về | note trầm nhẹ |
| Hoàn thành level | `success` + `brand` | hạt + sao + mascot 1,2s | giai điệu ngắn |

Cấm `danger` **không phải** token của canvas.

### 7.2 Lời khen tiếng Việt

Xoay vòng, không lặp liên tiếp: "Giỏi quá!" · "Đúng rồi!" · "Bé làm được rồi!" ·
"Tuyệt vời!" · "Bé thật chăm chỉ!"

Khi chưa đúng: "Thử lại nhé!" · "Gần đúng rồi!" · "Bé thử chỗ khác xem?"
(`BR-FBK-13`). mp3 dự phòng cùng thứ tự tại
`apps/web/public/audio/voice/common/feedback/retry-thu-lai-nhe.mp3`,
`retry-gan-dung-roi.mp3`, `retry-be-thu-cho-khac.mp3` — file do người thu; thiếu
file thì phát im và nhịp hổ phách vẫn là kênh thị giác.

Cấm — **NEVER**: "Sai rồi", "Không đúng", "Bé chưa giỏi", bất kỳ so sánh nào.

### 7.3 Ngân sách ăn mừng

| | Bình thường | reduced-motion |
|---|---|---|
| Thời lượng | 1,2 s | 400 ms |
| Hạt | ≤ 40, object pool | 0 |
| Âm | giai điệu ngắn | giữ nguyên |

### 7.4 Dáng mascot

Mascot là **Gấu Con** — người quyết chốt 2026-10-03 (#279). Asset là bảy sprite SVG (bốn gốc + ba dáng riêng `wonder`/`freeze`/`cheer`) đặt ngoài engine (`apps/web/public/mascot/`); engine giữ
hợp đồng chín dáng (`MASCOT_SPRITE_FILES`) và có bản vẽ thay thế bằng primitive khi sprite chưa nạp.

| Dáng | Khi nào | Giữ | Sprite |
|---|---|---|---|
| `idle` | Mặc định | — | `mascot-bear-waiting.svg` |
| `listen` | Lời dẫn đang đọc | Tới khi đọc xong | `mascot-bear-waiting.svg` |
| `happy` | Trả lời đúng | 700 ms | `mascot-bear-jumping.svg` |
| `encourage` | Chưa đúng | 700 ms — giống hệt mỗi lần (`BR-FBK-07`) | `mascot-bear-thinking.svg` |
| `hint` | Trợ giúp bậc L1+ đang hiện | Tới khi trợ giúp tắt | `mascot-bear-thinking.svg` |
| `celebrate` | Hoàn thành level | Tới khi rời màn | `mascot-bear-celebrating.svg` |
| `wonder` | Session đang ở nhịp tìm/thắc mắc (`BR-FBK-15`) | Tới khi session đổi tâm trạng | `mascot-bear-wonder.svg` (`BR-FBK-17`) |
| `freeze` | Session đang cần trẻ **dừng** (đèn đỏ GT-026) | Tới khi session đổi tâm trạng | `mascot-bear-freeze.svg` (`BR-FBK-17`) |
| `cheer` | Session vừa gom được một thứ (`BR-FBK-15`) | Tới khi session đổi tâm trạng | `mascot-bear-cheer.svg` (`BR-FBK-17`) |

`reduced-motion`: dáng vẫn đổi, chuyển động nảy/nghiêng thu về một nhịp scale (`BR-FBK-09`).

### 7.5 Phần thưởng giữ được

Màn tổng kết **level** chỉ có sao, mascot và lời khen. Xong cả một **bài** thì màn thưởng thêm một
sticker sưu tập — trao, chọn và album thuộc [`sticker-album.md`](sticker-album.md) (`BR-STK-*`).
Phần thưởng chỉ gồm sao và sticker: cấm xu, chuỗi ngày hay so sánh (`BR-STK-03`, `BR-FBK-08`).

## 8. API contract

Không có route. Màn hình tổng kết nhận từ
`POST /play-sessions/{uuid}/complete` — xem [`scoring-and-result.md`](scoring-and-result.md) §8.

## 9. Acceptance criteria

```gherkin
Scenario: BR-FBK-01 — sai không có đỏ và không trừ điểm
  Given trẻ thả sai vị trí
  Then không pixel nào trên canvas dùng token danger
  And điểm không giảm

Scenario: BR-FBK-02 — sai luôn có phản hồi
  Given trẻ thả sai vị trí
  Then có nhịp hổ phách trên target
  And có âm phản hồi
  And item trở về vị trí ban đầu

Scenario: BR-FBK-07 — cường độ không tăng theo số lần sai
  Given trẻ sai 5 lần liên tiếp
  Then phản hồi lần thứ 5 giống hệt lần thứ nhất

Scenario: BR-FBK-04 — ăn mừng lớn chỉ khi xong level
  Given trẻ đặt đúng một item
  Then chỉ có pop nhỏ tại điểm chạm
  And không có hạt hay mascot

Scenario: BR-FBK-05 — pop tại điểm chạm
  Given trẻ đặt đúng ở toạ độ (x, y)
  Then hiệu ứng pop phát ra từ (x, y)
  And không từ tâm màn hình

Scenario: BR-FBK-09 — reduced-motion vẫn ăn mừng
  Given prefers-reduced-motion bật
  When trẻ hoàn thành level
  Then vẫn có ăn mừng dạng một nhịp scale 400ms
  And vẫn có âm

Scenario: BR-FBK-06 — màu không phải kênh duy nhất
  Given giả lập màn hình đơn sắc
  Then vẫn phân biệt được đúng và chưa đúng qua chuyển động

Scenario: BR-FBK-08 — lời khen không so sánh
  When liệt kê mọi chuỗi khen
  Then không chuỗi nào chứa so sánh với trẻ khác

Scenario: BR-FBK-11 — mascot đổi dáng cùng phản hồi
  Given bề mặt chơi đang hiện vùng lời dẫn
  When trẻ trả lời đúng ở toạ độ (x, y)
  Then khung vẽ kế tiếp có vòng pop tâm (x, y) màu success
  And mascot ở dáng happy
  When trẻ trả lời chưa đúng
  Then khung vẽ kế tiếp có nhịp hổ phách và mascot ở dáng encourage
  And không lệnh vẽ nào dùng token danger

Scenario: BR-FBK-12 — màn tổng kết có tiếng và nút icon
  When màn tổng kết level mở
  Then một lời khen của §7.2 được đọc
  And các nút không có chữ hiển thị, chỉ có aria-label

Scenario: BR-FBK-13 — sai thì nói câu khích lệ xoay vòng
  Given máy có giọng Việt
  When trẻ chạm sai hai lần, cách nhau hơn 400ms
  Then mỗi lần trẻ nghe một câu khích lệ của §7.2
  And hai câu liên tiếp khác nhau
  And câu khích lệ bắt đầu sau khi tên vật vừa chạm đọc xong

Scenario: BR-FBK-13 — không có giọng Việt thì phát mp3 dự phòng
  Given hasVietnameseVoice trả false
  When trẻ chạm sai
  Then mp3 cùng chỉ số của câu khích lệ được phát
  And không có lệnh TTS nào

Scenario: BR-FBK-14 — cue âm của engine được phát một lần mỗi khung
  Given session xếp hàng hai cue theo thứ tự
  When engine tiến một khung
  Then audio.play được gọi hai lần đúng thứ tự
  And khung kế tiếp không phát lại
  When âm bị tắt
  Then không có cue nào được phát

Scenario: BR-FBK-15 — mascot theo tâm trạng của session
  Given session khai mascotMood là freeze
  When bề mặt chơi chọn dáng nền và lời dẫn không đang đọc
  Then dáng nền là freeze
  When lời dẫn đang đọc
  Then dáng nền là listen
  When trợ giúp đã lên bậc 1 và lời dẫn không đang đọc
  Then dáng nền là hint

Scenario: BR-FBK-16 — khung chuyện đọc một lần ở vòng đầu
  Given session khai storyLine
  When mở vòng đầu
  Then lượt đọc là storyLine rồi câu dẫn
  When nghe lại hoặc mở vòng sau
  Then chỉ đọc câu dẫn

Scenario: BR-FBK-17 — ba dáng có sprite riêng
  When đọc MASCOT_SPRITE_FILES
  Then wonder, freeze, cheer mỗi dáng một file SVG riêng, tồn tại, viewBox 120

Scenario: BR-FBK-10 — âm không có onset tức thì
  When phân tích mọi file SFX
  Then thời gian ramp vào ít nhất 20ms
```

## 10. Boundaries

**Always**
- Phản hồi mọi thao tác, kể cả sai.
- Pop tại điểm chạm.
- Giữ cường độ phản hồi sai không đổi.
- Xoay vòng lời khen.

**Ask first**
- Thêm loại phản hồi mới.
- Đổi ngân sách ăn mừng.
- Đổi bộ lời khen.

**Never**
- Đỏ, buzzer, rung mạnh, trừ điểm khi sai.
- Im lặng khi sai.
- Ăn mừng lớn ngoài lúc hoàn thành level.
- Màu là kênh duy nhất.
- So sánh trẻ với trẻ khác.
- Bỏ ăn mừng khi reduced-motion.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Lời khen thu âm người thật hay TTS?~~ **Đóng 2026-08-09 (T13, `D-AV`)**: P1 dùng audio clip tĩnh + Web Speech API (TTS), hoãn thu studio sang P2 | Âm thanh phản hồi | Đã đóng | D-AV |
| ~~2~~ | ~~Mascot có nhất quán qua mọi theme không, hay đổi theo theme?~~ **Đóng 2026-08-09 (T13, `D-DB`)**: một mascot giữ vai trò chính ở mọi theme, background đổi theo theme. Con vật là Gấu Con (chốt 2026-10-03) — §7.4 | Mascot thiết kế | Đã đóng | D-DB |

