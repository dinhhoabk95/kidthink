---
spec: PLAY-NARRATION
title: Giọng đọc trên bề mặt trẻ — mọi yêu cầu phải nghe được trước khi đọc được
area: play
status: draft
mvp: true
phase: P1
reviewed: 2026-09-11
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

## 1. Objective

Trẻ 3–6 tuổi chưa đọc được chữ. Một yêu cầu hiện bằng chữ trên bề mặt trẻ là một yêu cầu chưa
được truyền đạt. Đây không phải một tính năng phụ trợ khả năng tiếp cận — với nhóm tuổi này nó là
kênh chính, và chữ viết mới là kênh phụ.

Nền tảng đã có tài sản. Đo ngày 2026-09-11: **742 file mp3 giọng Việt** dưới
`apps/web/public/audio/voice/`, trong đó riêng nhánh số học `d1` có **424 file** và
`common/numbers/` có 31 file đọc số. Tài sản này gần như không được dùng: chỉ **4/443** dataset
kỹ năng có `audio_path` trên item, và cả bốn đều thuộc `C1` (`C1.CNT.01`, `C1.NREC.01`,
`C1.NREC.03`, `C1.NREC.04`).

Ở tầng engine, trường giọng sống duy nhất là `instruction_audio_path` ở cấp vòng
([`packages/game-engine/src/round-runner.ts:28`](../../../packages/game-engine/src/round-runner.ts)),
và chỉ **`GT-000`** (làm quen khái niệm) dùng narration. Ba mươi sáu engine còn lại câm. Trường
`phrasing.narration_template` được soạn 443 lần và không có consumer nào.

Spec này đặt hợp đồng: cái gì phải nói được, nói bằng nguồn nào, và điều gì xảy ra khi không nói
được. [`audio-storage.md`](../01-platform/audio-storage.md) sở hữu pipeline lưu trữ và chuẩn hoá
asset; spec này sở hữu hợp đồng **phát** trên bề mặt trẻ.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ 3–6 tuổi | không cần đăng nhập tới tier `free` | Nghe yêu cầu, nghe tên vật, bấm nghe lại |
| Người biên soạn | `content_author` | Gắn `audio_path` cho item và câu dẫn |
| Dev engine | — | Gọi narration ở đúng nhịp của kịch bản lượt |
| Cổng kiểm tra | CI / `check.sh` | Chạy `check:narration-coverage` |

## 3. Entry points

| Route / file | Actor | Ghi chú |
|---|---|---|
| `/play/:code` | Trẻ | Nút "Nghe lại" ở HUD, `apps/web/app/pages/play/[code].vue` |
| `apps/web/app/composables/play/use-play-audio.ts` | Dev | `playInstructionNarration`, `preloadPlayAssets` |
| `packages/game-engine/src/systems/audio-controller.ts` | Dev | `speakPrompt`, thứ tự dự phòng |
| `packages/game-engine/src/systems/speech-synthesis-adapter.ts` | Dev | `hasVietnameseVoice` |
| `apps/web/public/audio/voice/**` | Dev / Nội dung | 742 file mp3 đã có |
| `scripts/check-narration-coverage.ts` | CI / Dev | Script cổng, phải dựng mới |

## 4. Main flow

1. Client tải cấu hình màn chơi; payload mang `instruction_audio_path` cho vòng và `audio_path`
   cho từng item của `content_pack`.
2. `preloadPlayAssets` nạp trước file của vòng hiện tại, giới hạn 3 giây mỗi asset và 5 giây tổng.
3. Vòng bắt đầu. Trước khi trẻ chạm được vào bất cứ thứ gì, engine phát câu dẫn của vòng.
4. Trẻ chạm một vật. Engine phát tên vật đó từ `audio_path` của item.
5. Trẻ bấm "Nghe lại" bất kỳ lúc nào. Engine phát lại câu dẫn của vòng, không phát lại tên vật.
6. Hết vòng, engine phát câu phản hồi thuộc [`feedback-and-celebration.md`](feedback-and-celebration.md).

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Thiếu file | `audio_path` trỏ tới file không tồn tại hoặc tải hỏng | Rơi xuống bậc 2 của thứ tự mục 7.2 |
| Không có giọng Việt | `hasVietnameseVoice()` trả `false` | Bỏ qua bậc 2, rơi thẳng xuống bậc 3 gợi ý thị giác |
| Trẻ tắt tiếng thiết bị | Trình duyệt chặn phát | Bậc 3 chạy như trường hợp không có giọng; không hiện hộp thoại đòi bật tiếng |
| Trình duyệt chặn autoplay | Chưa có tương tác người dùng | Câu dẫn hoãn tới lần chạm đầu tiên, và lần chạm đó không tính là lượt trả lời |
| Nạp trước quá hạn | Quá 5 giây tổng | Vòng vẫn bắt đầu; narration phát khi sẵn sàng, không chặn màn chơi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PNR-01` (nghe được trước khi đọc được) | Mọi yêu cầu hiển thị trên bề mặt trẻ BẮT BUỘC có một đường phát thành tiếng. Cấm — NEVER có yêu cầu chỉ tồn tại dưới dạng chữ | Nhóm tuổi mục tiêu chưa đọc được; một yêu cầu chỉ có chữ là một yêu cầu không tồn tại với phần lớn người dùng |
| `BR-PNR-02` (mọi vật có tên đọc được) | Mọi item của `content_pack` trên bề mặt trẻ BẮT BUỘC có `audio_path` hoặc `spokenLabel` | Trẻ chạm một vật rồi không biết nó là gì thì bài mất một nửa giá trị dạy từ |
| `BR-PNR-03` (một nguồn giọng cho một vòng) | Câu dẫn của vòng lấy từ đúng một trường: `instruction_audio_path`. Cấm — NEVER thêm trường giọng song song ở cấp vòng | Đã có ba trường từng cùng tồn tại (`prompt_audio_ref`, `audio_url`); cổng `one-narration-source` được dựng chính vì drift đó |
| `BR-PNR-04` (mọi engine đều nói) | Cả 37 engine BẮT BUỘC phát câu dẫn ở nhịp mở vòng, không chỉ `GT-000` | Hiện 36 engine câm; một nền tảng mầm non mà chỉ bài làm quen biết nói thì phần chơi chính không dùng được cho trẻ ba tuổi |
| `BR-PNR-05` (dùng lại tài sản đã có) | `audio_path` của item số ưu tiên trỏ `/audio/voice/common/numbers/{value}.mp3`; không sinh file mới cho giá trị đã có | 31 file đọc số đã tồn tại; sinh trùng làm hai bản đọc khác giọng cho cùng một con số |
| `BR-PNR-06` (dự phòng không im lặng) | Khi không phát được file, hệ thống BẮT BUỘC đi hết thứ tự mục 7.2 và kết thúc bằng một tín hiệu thị giác. Cấm — NEVER kết thúc bằng im lặng | Im lặng với trẻ ba tuổi là bế tắc; trẻ không biết mình phải làm gì và cũng không biết hệ thống đang hỏng |
| `BR-PNR-07` (nghe lại luôn có) | Nút "Nghe lại" BẮT BUỘC có mặt và bấm được ở mọi vòng, mọi engine, kể cả khi câu dẫn đang phát | Trẻ nghe sót là chuyện thường; bắt trẻ chờ hết câu mới được nghe lại là bắt trẻ đoán |
| `BR-PNR-08` (nghe lại không phạt) | Bấm "Nghe lại" BẮT BUỘC không tính là lượt sai, không làm leo bậc trợ giúp, không trừ điểm | Phạt việc hỏi lại dạy trẻ đoán bừa thay vì hỏi |
| `BR-PNR-09` (không chặn màn chơi) | Narration BẮT BUỘC bất đồng bộ với vòng đời vòng chơi; quá hạn nạp thì vòng vẫn bắt đầu | Một vòng treo chờ file mp3 trên mạng yếu là một vòng hỏng |
| `BR-PNR-10` (độ phủ có ratchet) | `scripts/narration-coverage-baseline.json` ghi số dataset có `audio_path` và số engine phát narration; cả hai chỉ được tăng | Số hiện tại là 4/443 dataset và 1/37 engine; không có ratchet thì con số này đã đứng yên nhiều lát cắt |

## 7. Data

**Đọc:** `content_pack.items[].audio_path`; `instruction_audio_path` của vòng;
`phrasing.narration_template` của dataset; file dưới `apps/web/public/audio/voice/`.
**Ghi:** `scripts/narration-coverage-baseline.json`.

### 7.1 Tài sản hiện có — đo ngày 2026-09-11

| Nhánh | Số file | Nội dung |
|---|---:|---|
| `voice/common/numbers/` | 31 | Đọc số `0.mp3` … `30.mp3` |
| `voice/common/` khác | 1 | — |
| `voice/d1/` | 424 | Số học: `feedback/bot`, `feedback/dem_duoc`, `feedback/tim_thay_so`, `instruction/dem_cach`, … |
| `voice/d2/` | 5 | Không gian |
| `voice/d3/` | 8 | Logic |
| `voice/d4/` | 13 | Quan sát |
| `voice/d5/` | 22 | Ngôn ngữ |
| `voice/d6/` | 17 | Điều hành |
| **Tổng** | **742** | |

Cấu trúc thư mục `d1`…`d6` là di sản v1 và không khớp mã competency `C1`…`C6` của v2 một cách
hiển nhiên. Bảng ánh xạ hai chiều là việc đầu tiên của lát cắt; nó thuộc
[`audio-storage.md`](../01-platform/audio-storage.md) mục 7.

### 7.2 Thứ tự dự phòng — bốn bậc

| Bậc | Nguồn | Điều kiện chuyển xuống bậc dưới |
|---|---|---|
| 1 | File mp3 do người thu, trỏ bởi `audio_path` hoặc `instruction_audio_path` | File không có, tải hỏng, hoặc quá hạn 3 giây |
| 2 | Tổng hợp giọng của trình duyệt, qua `speakPrompt` | `hasVietnameseVoice()` trả `false`, hoặc trình duyệt chặn phát |
| 3 | Tín hiệu thị giác: nâng trợ giúp lên bậc bàn tay dẫn và nhấp nháy khung yêu cầu 1200 ms | Không có — đây là bậc cuối, luôn chạy được |
| 4 | Không tồn tại. Im lặng bị cấm bởi `BR-PNR-06` | — |

Bậc 2 chỉ đọc **tiếng Việt**. Đọc chuỗi tiếng Việt bằng giọng ngôn ngữ khác cho ra âm sai tới mức
gây nhầm, nên thà rơi xuống bậc 3 còn hơn.

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
  "engines_with_round_narration": 1,
  "engines_total": 37,
  "items_with_audio_path": 0,
  "orphan_audio_files": 0
}
```

`orphan_audio_files` đếm file mp3 không được dataset nào trỏ tới. Số này **được phép giảm** khi
xoá file thừa và **được phép tăng** khi thu thêm file trước khi gắn; nó là số đo, không phải
ratchet. Bốn số còn lại chỉ được đi theo chiều tốt lên.

## 8. API contract

Không có route mới. `audio_path` và `instruction_audio_path` đi theo payload của
`GET /api/guest/levels/{code}/config` và `GET /api/users/levels/{code}/config`; hình dạng payload
do [`game-config-delivery.md`](game-config-delivery.md) sở hữu.

File mp3 phục vụ tĩnh từ `apps/web/public/audio/voice/**` theo đường dẫn tuyệt đối bắt đầu bằng
`/audio/voice/`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PNR-01 — vòng không có đường phát tiếng thì cổng đỏ
  Given một game level có content_pack không mang instruction_audio_path
  And dataset của nó cũng không có narration_template
  When chạy pnpm check:narration-coverage
  Then cổng thoát khác 0
  And báo cáo nêu đúng mã level không có đường phát tiếng

Scenario: BR-PNR-02 — item không có tên đọc được thì cổng đỏ
  Given content_pack của một vòng có một item không có audio_path và không có spokenLabel
  When chạy pnpm check:narration-coverage
  Then cổng thoát khác 0
  And báo cáo nêu đúng id item thiếu

Scenario: BR-PNR-04 — engine không phát câu dẫn ở nhịp mở vòng thì cổng đỏ
  Given engine GT-012 dựng một vòng có instruction_audio_path
  When chạy kịch bản lượt của GT-012 tới nhịp mở vòng
  Then AudioController nhận đúng một lệnh phát câu dẫn

Scenario: BR-PNR-05 — sinh file đọc số trùng thì cổng đỏ
  Given một dataset khai audio_path trỏ tới file đọc số mới ngoài common/numbers
  And giá trị đó đã có file trong common/numbers
  When chạy pnpm check:narration-coverage
  Then cổng thoát khác 0
  And báo cáo nêu giá trị số đã có bản đọc dùng chung

Scenario: BR-PNR-06 — không có giọng Việt thì rơi xuống tín hiệu thị giác, không im lặng
  Given SpeechSynthesisAdapter.hasVietnameseVoice trả false
  And file mp3 của vòng tải hỏng
  When vòng bắt đầu
  Then trợ giúp được nâng lên bậc bàn tay dẫn
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
```

## 10. Boundaries

**Always**
- Nút "Nghe lại" giữ sàn chạm 64 px của `BR-A11-04` ở mọi viewport.
- Mỗi file mp3 mới đi qua pipeline chuẩn hoá của
  [`audio-storage.md`](../01-platform/audio-storage.md); cấm thả file thô vào `public/`.
- Trần âm lượng tổng giữ ở −16 LUFS như `audio-controller.ts` đã ghi.
- Cổng lấy gốc repo từ `REPO_ROOT` hoặc `repoPath()` của `@mindkid/config/paths`, Cấm — NEVER
  đọc `process.cwd()`.
- Cổng kiểm tồn tại file mp3 phải đi qua đường dẫn tuyệt đối dựng từ gốc repo, không qua cwd.

**Ask first**
- Thu thêm giọng người. Đây là chi phí ngoài repo và cần chốt người đọc trước khi sinh danh sách
  câu.
- Dùng dịch vụ tổng hợp giọng của bên thứ ba. Bề mặt công khai bị `BR-LND-04` cấm gọi tài nguyên
  bên thứ ba; bề mặt chơi cần quyết định riêng.

**Never**
- Cấm — NEVER phát tiếng tự động trước khi có tương tác đầu tiên của người dùng; trình duyệt chặn
  và việc đó tạo ra một lần thất bại im lặng.
- Cấm — NEVER đọc chuỗi tiếng Việt bằng giọng ngôn ngữ khác.
- Cấm — NEVER thêm một trường giọng thứ hai ở cấp vòng.
- Cấm — NEVER để việc bấm nghe lại ảnh hưởng tới điểm, bậc trợ giúp, hay bộ đếm sai.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Ánh xạ thư mục di sản `d1`…`d6` sang `C1`…`C6` là một-một hay nhiều-nhiều; `d5` hiện chứa `money_template` và `clock_template` vốn thuộc `C1.MEAS` của v2 | Việc gắn 742 file vào dataset | P1 | Nội dung |
| 2 | Câu dẫn của vòng sinh từ `narration_template` của dataset hay soạn riêng theo level; sinh từ template thì 443 câu giống nhau như prompt hiện tại | `BR-PNR-04` | P1 | Nội dung |
| 3 | Tên vật có phát mỗi lần chạm hay chỉ lần chạm đầu trong vòng; phát mỗi lần thì với engine chạm nhanh như `GT-028` sẽ chồng tiếng | `BR-PNR-02` | P2 | Studio UI |
| 4 | Có thu giọng người cho 36 engine còn lại hay chấp nhận bậc 2 tổng hợp giọng làm mức phục vụ cho các engine ngoài `C1` | Phạm vi chi phí thu âm | P2 | người quyết |
