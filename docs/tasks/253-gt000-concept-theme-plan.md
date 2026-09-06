# Kế hoạch — Task #253: GT-000 dạy trọn một chủ đề, và kỹ năng bậc pre chặn trước khi chơi

> **Danh sách việc:** [`253-gt000-concept-theme-todo.md`](253-gt000-concept-theme-todo.md)
> **Loại task:** lát dọc (S). Một chủ đề đi trọn đường từ taxonomy tới màn hình.
> **File này cấm — NEVER chứa contract.** Contract ở `docs/specs/`; ở đây chỉ có bằng chứng,
> thứ tự, và quyết định.
> Spec sở hữu:
> [`concept-pre-skill.md`](../specs/05-content/concept-pre-skill.md) ·
> [`GT-000.md`](../specs/01-platform/engines/GT-000.md) ·
> [`concept-intro-model.md`](../specs/05-content/concept-intro-model.md) ·
> [`concept-intro-runner.md`](../specs/04-play/concept-intro-runner.md)
> **Chặn bởi:** không. **Chặn:** mọi việc hạ nợ phủ bài làm quen xuống dưới 404.

## 1. Outcome

Trẻ mở một level `GT-000` của chủ đề "số 0 đến 10", **nghe** đủ 11 giá trị, mỗi giá trị được
đọc lên trước khi bị hỏi, đi qua bốn phân đoạn có chỗ nghỉ, và chỉ sau đó mới mở được các trò
chơi thuộc chủ đề đó. Lặp lại như vậy cho năm chủ đề của đợt 1.

Ba câu người đặt việc nêu, và chỗ mỗi câu được đóng:

| Câu | Đóng ở đâu |
|---|---|
| "trong 1 game level mỗi chủ đề đó thay vì học lẻ từng giá trị một" | `BR-PRE-09` (phủ hết giá trị) và `BR-CIM-03` (phân đoạn) |
| "trẻ có thể nghe, đọc, học, hiểu được lần lượt các giá trị" | `BR-CIR-19` (giới thiệu phải nghe được), `BR-CIR-20` (`tts_used` thật) |
| "làm tiền đề cho các trò chơi khác" | `BR-PRE-05` (chặn bằng prerequisite), `BR-PRE-06` (gắn hai đầu) |

## 2. Bằng chứng đo được (2026-09-05)

| # | Đo | Con số | Đo bằng |
|---|---|---|---|
| 1 | Khuôn `kind = 'teach'` trong kho | **1** trên 37 | `grep 'kind: "teach"' packages/game-engine/src/templates/*/template.ts` |
| 2 | Level `GT-000` trong toàn corpus | **4** trên 409 file kỹ năng | `grep 'template: "GT-000"' packages/content/src/skills` |
| 3 | Kỹ năng có bài chấm mà không có bài dạy | **404** trên 408 | `scripts/intro-coverage-baseline.json` |
| 4 | Giá trị một level `GT-000` thật sự dạy | **1** — vật thứ hai chỉ làm nhiễu | `packages/content/src/builders/gt-000.ts:19-58` |
| 5 | Trần chất liệu của khuôn | **6**, trong khi chủ đề 0–10 cần 11 | `packages/game-engine/src/templates/GT-000/template.ts:57` |
| 6 | Khuôn thiếu trường `input` | **1** trên 37, đúng là `GT-000` | vòng lặp `grep -q '^  input:'` trên 37 file `template.ts` |
| 7 | Tên event session phát mà danh mục không có | **4** | `session.ts:190,209,229,252` so với `packages/play/src/events/catalog.ts:8-12` |
| 8 | Lời gọi bộ đọc từ trong bất kỳ session khuôn nào | **0** | `grep 'engine\.audio' packages/game-engine/src/templates/` |
| 9 | File mp3 trong kho mindkid | **0** | `find . -name '*.mp3'` |
| 10 | File mp3 giọng Việt trong kho v1 dùng lại được | **1.561**, trong đó `common/numbers/0..30.mp3` là 31 | `find ../tinimath -name '*.mp3'` |
| 11 | Giá trị trong dataset kỹ năng "Quan sát màu" là màu | **0** trên 5 — thìa, cốc, giường, ghế, táo | `packages/content/src/skills/c4/det/C4.DET.01.ts:41-90` |
| 12 | Trần bậc thang nợ phủ nội dung | **0** — mọi kỹ năng phải có ≥1 level | `packages/content-build/src/thresholds/skill-coverage-ratchet.json` |
| 13 | Cổng hạn ngạch biết tới `kind = 'teach'` | **không** — `grep teach` trả 0 kết quả | `packages/content-build/src/gates/skill-quota.ts` |

Dòng 1 đặt cạnh dòng 3 là toàn bộ vấn đề: **cửa duy nhất để trẻ được dạy đang đóng với
99% kỹ năng**. Dòng 4 đặt cạnh dòng 5 là lý do nó không mở được bằng cách soạn thêm nội dung:
khuôn không nhận nổi một chủ đề.

## 3. Spec đã sửa trong lượt này

| Spec | Sửa gì |
|---|---|
| [`concept-pre-skill.md`](../specs/05-content/concept-pre-skill.md) | Spec mới. Bậc `pre`, từ vựng chủ đề, 5 chủ đề đợt 1, 10 luật `BR-PRE-` |
| [`GT-000.md`](../specs/01-platform/engines/GT-000.md) | Viết lại 16 mục. 3 luật cũ thành 9 luật, mỗi luật một kịch bản nghiệm thu. §15 đọc lại đúng từ mã nguồn |
| [`concept-intro-model.md`](../specs/05-content/concept-intro-model.md) | `BR-CIM-02` đổi đơn vị gắn sang kỹ năng bậc `pre`; `-03` thành trần theo phân đoạn; `-06` thành trần mỗi phân đoạn; `-13` thành một chủ đề một bài; `-18` thêm phân đoạn ôn. §7 đồng bộ tên trường với mã nguồn. Câu hỏi mở 3 đóng |
| [`concept-intro-runner.md`](../specs/04-play/concept-intro-runner.md) | Thêm `BR-CIR-17`…`-21`: phân đoạn nối tiếp, quay lại đúng mốc, giới thiệu phải nghe được, `tts_used` thật, tên event đã đăng ký. Chốt một bộ tên event |
| [`index.md`](../specs/index.md) · [`business-rules.md`](../specs/00-foundation/business-rules.md) | Đăng ký spec mới và tiền tố `BR-PRE` |

## 4. Chưa làm — cần người quyết

| # | Việc | Vì sao chưa quyết được |
|---|---|---|
| 1 | Ba kỹ năng màu ngoài `C4.DET` gộp một chủ đề liên strand hay tách | `BR-PRE-02` cấm chủ đề trải hai strand; gỡ được nhưng đổi luật vừa chốt |
| 2 | Cầu soạn đầy đủ sau đợt 1 | Phải đo thời lượng thật của một chủ đề 11 giá trị trên trẻ thật trước |
| 3 | Có thu giọng người thật thay bộ đọc máy không | Câu hỏi mở 1 của `GT-000.md`, phụ thuộc ngân sách audio |

## 5. Thứ tự thi công đề xuất

Sáu mốc, mỗi mốc là một lát dọc chạy được. Cấm — NEVER gộp hai mốc vào một lượt: mốc 0 và 1
sửa được lỗi hôm nay ngay cả khi bốn mốc sau chưa làm.

| Mốc | Lát dọc | Đo xong bằng gì |
|---|---|---|
| M0 | Mở mạch chạm và mạch telemetry | Trẻ chạm thì bước tiến; phiên đóng ở `completed` |
| M1 | Mở mạch tiếng | Bật loa nghe được từng giá trị; `tts_used` phản ánh thật |
| M2 | Bậc `pre`, 5 kỹ năng mới, 5 dataset chủ đề | `check:taxonomy-docs` và `check:skill-quota` xanh, có ca âm |
| M3 | Phân đoạn vào contract, bộ chiếu đi hết dataset | Một level dạy đủ 11 giá trị của chủ đề 0–10 |
| M4 | Gieo 5 level chủ đề | Nợ phủ giảm, bậc thang hạ trần kèm lý do |
| M5 | Đấu nối prerequisite | Một trò chơi thật trả `428` và trẻ được dẫn sang bài làm quen |
