# Kế hoạch — Task #254: Bài học mở đầu cho mỗi kỹ năng

> **Loại task:** sửa hướng contract (L) + bậc thang nội dung (M).
> **Thay:** [`Task #253`](253-gt000-concept-theme-plan.md) — bậc `pre` bị gỡ, không phải mở rộng.
> **Spec sở hữu:** [`concept-topic-model.md`](../specs/05-content/concept-topic-model.md) ·
> [`concept-intro-model.md`](../specs/05-content/concept-intro-model.md) ·
> [`concept-intro-gate.md`](../specs/04-play/concept-intro-gate.md) ·
> [`concept-intro-runner.md`](../specs/04-play/concept-intro-runner.md) ·
> [`GT-000.md`](../specs/01-platform/engines/GT-000.md).

## 1. Trả lời ngắn

Người đặt việc yêu cầu bốn thứ ngày 2026-09-06:

1. Mỗi kỹ năng phải có bài học mở đầu trước khi chơi game của kỹ năng đó.
2. Tham chiếu cuthongminh.com — một hoặc nhiều tiết học trò chơi trước, và trẻ tập nói theo.
3. Bài mở đầu là **thêm game level**, không phải thêm kỹ năng.
4. Chơi xong phải có dấu hiệu nhận biết đã hoàn thành, để lần sau không bị bắt chơi lại.

Cơ chế đã có gần đủ: engine dạy `GT-000`, cổng `428 INTRO_REQUIRED`, trạng thái hoàn thành
suy từ `play_sessions`. Task này sửa **một hướng đi sai**, vá **ba lỗ hổng**, và bật **một
cổng chết**.

## 2. Bằng chứng đã đo (2026-09-06)

| Việc | Số đo | Nguồn |
|---|---|---|
| Kỹ năng có game chấm mà không có bài học mở đầu | **392 / 408** | [`scripts/intro-coverage-baseline.json`](../../scripts/intro-coverage-baseline.json) |
| Level dạy `GT-000` đã soạn | 5 | `packages/content/src/skills/{c1/nrec,c2/geo,c4/det}` |
| Level chơi đã soạn, 37 engine | 5.921 | `packages/content/src/skills/**` |
| Kỹ năng bậc `pre` đã tạo | 5 | `C1.NREC.13` `C1.NREC.14` `C1.NREC.15` `C2.GEO.09` `C4.DET.05` |
| Hành động engine dạy | 4 | `packages/game-engine/src/templates/GT-000/template.ts:24` |
| Dấu hoàn thành ở `/games` | **0** | `apps/web/app/pages/games/index.vue` |
| mp3 giọng Việt sẵn có | 742 | `apps/web/public/audio/voice/` |

**Cổng bậc thang là cổng chết.** `scripts/check-intro-coverage.ts` cài đặt đúng `BR-CIG-13`,
nhưng không script nào gọi nó — không `package.json`, không `lefthook.yml`, không
`scripts/check.sh`. Nợ 392 tăng tự do.

**Spec cũ đi ngược yêu cầu.** `CONCEPT-PRE-SKILL` neo bài học vào một kỹ năng bậc `pre` **mới
tạo trong taxonomy** — đúng thứ người đặt việc bác, và va với ranh giới ở
[`AGENTS.md`](../../AGENTS.md): agent Cấm — NEVER sinh `skills` hay `strands`.

**Trần một-bài chặn nhầm.** `BR-CIM-13` và `BR-PRE-08` cấm một chủ đề có hơn một tiết
`published`, trong khi runtime `checkLevelIntroRequired` xử lý cả danh sách. Spec chặt hơn
code, và chặt sai chỗ.

**Spec cổng lệch mã nguồn.** Spec gom hàng đợi về **strand**; mã nguồn chưa bao giờ gom, nó
làm việc ở mức **level**, và baseline thật là 392 kỹ năng chứ không phải 41 strand.

### Tham chiếu cuthongminh.com

| Chủ đề | Bậc dạy | Bậc chấm |
|---|---|---|
| Học Từ Vựng Tiếng Việt | `học từ` · `tập phát âm` | `ghép từ thành tiếng` · `nghe hiểu` |
| Bé Học Đếm Số 1-20 | `nhận biết số` · `tập viết số` | `đếm đồ vật` · `chọn số đúng` |
| Học Dấu Tiếng Việt | nghe phát âm chuẩn · nhắc lại | trò chơi nhận diện chữ đúng |

Hai thứ lấy về: một chủ đề sinh ra **nhiều** tiết; và **nhắc lại / tập phát âm** là một chế
độ riêng nằm trong phần dạy.

## 3. Quyết định

| Mã | Quyết định | Ai chốt | Vì sao |
|---|---|---|---|
| **D-SK** | Gỡ bậc `pre` khỏi taxonomy. Xoá 5 kỹ năng `pre`; level dạy gắn thẳng vào kỹ năng chơi thật qua `content_skill_map` | người đặt việc, 2026-09-06 | Bài học mở đầu là thêm game level, không phải thêm kỹ năng. Mã kỹ năng là bất biến và bị telemetry neo vào; thêm một mã chỉ để đặt tên cho một bài dạy là trả giá vĩnh viễn cho một nhãn |
| **D-SL** | Nối cổng bậc thang trước, chốt trần 392, rồi mới soạn nội dung pilot một competency | người đặt việc, 2026-09-06 | Soạn nội dung mà cổng không chạy thì lần sau nợ lại tăng trong im lặng — đúng vết đã ghi ở `check:skill-quota` |
| **D-SM** | Thêm hành động thứ năm `echo` vào `GT-000` thay vì dựng engine dạy thứ hai | người đặt việc, 2026-09-06 | Dùng lại runner, TTS `vi-VN` và 742 mp3 đã có. Một bài học chạy được cả dạy lẫn tập nói mà không thêm engine, fixtures hay QA ảnh chụp |
| **D-SN** | Bỏ trần một-bài-published mỗi chủ đề; một chủ đề được có nhiều tiết, phân biệt bằng `concept.sequence_no` | đề xuất, theo nguyên văn "một hoặc nhiều tiết học" | Trần cũ chặn đúng thứ được yêu cầu, và runtime vốn không có trần đó |
| **D-SO** | Pilot là **C1 Tư duy toán học**, chia theo strand, `C1.CMP` là mốc đo đầu tiên | đề xuất | C1 chứa "Lớn hơn" của ví dụ người đặt việc và có nợ lớn nhất. 110 kỹ năng không có nghĩa 110 level: một tiết phủ nhiều kỹ năng cùng chủ đề — `GL-C2-GEO-INTRO-0001` phủ 8 kỹ năng hình |

## 4. Việc

| WP | Nội dung | Đầu ra |
|---|---|---|
| WP254.1 | Spec đi trước | 6 spec sửa, 1 spec mới, `index.md` và `business-rules.md` cập nhật |
| WP254.2 | Gỡ bậc `pre` | 5 file kỹ năng xoá, level chuyển sang kỹ năng chơi, `SkillProgressionTier` còn 3 giá trị, migration enum |
| WP254.3 | Hành động `echo` | `GT-000` template + session + fixtures + bộ chiếu + nút "Bé nói theo" |
| WP254.4 | Dấu hiệu hoàn thành | API trả `completed_level_codes`, huy hiệu "Đã học xong" ở `/games`, màn kết bài dạy |
| WP254.5 | Nối cổng | `check:intro-coverage` trong `package.json` và `scripts/check.sh`, ca âm, sửa lỗ hạn ngạch `BR-SKQ-08` |
| WP254.6 | Nội dung pilot C1 | 5 lô theo strand, mỗi lô một PR, hạ baseline theo từng lô |

## 5. Điều kiện nghiệm thu

1. `node scripts/check-intro-coverage.ts` in **đúng 392** sau WP254.2 — gỡ `pre` Cấm — NEVER
   làm nợ nhúc nhích. Tăng là gắn thiếu, dừng lại.
2. Ca âm cổng bậc thang: thêm một level chấm cho kỹ năng chưa có bài dạy → `pnpm check` đỏ.
3. Ca âm hạn ngạch: kỹ năng C1 có 19 level chấm cộng 1 level dạy → `check:skill-quota` đỏ.
4. Test `GT-000` có ca `echo`, và ca âm "`echo` không phát sinh event mang dữ liệu âm thanh".
5. Chạy thật ở local: chưa học thì `428 INTRO_REQUIRED`; đi hết bài dạy có bước tập nói; quay
   lại vào được; đóng trình duyệt mở lại **vẫn vào thẳng**; `/games` hiện huy hiệu; đổi hồ sơ
   trẻ thì bị chặn lại; manager preview không bị chặn và không ghi hoàn thành.
6. `pnpm typecheck` nợ = 0 và `pnpm lint` xanh.

## 6. Rủi ro

| Rủi ro | Dấu hiệu sớm | Cách chặn |
|---|---|---|
| Corpus sinh máy móc rồi cổng vẫn xanh | Dataset chủ đề chứa vật mượn, không chứa giá trị của chủ đề | `BR-CTM-10` cộng checklist người duyệt mục 7.6 — đây đúng vết đã ghi ở dataset "Quan sát màu" |
| Bước `echo` thành bước bấm nút | Trẻ đi qua `echo` nhanh hơn thời lượng mẫu | Ghi `replay_count` trong `intro_echo_completed`; đây là tín hiệu chất lượng nội dung, Cấm — NEVER là cửa |
| Migration enum `skill_tier` | Chạy nhầm ngoài local | Migration nằm trong sáu vùng nhạy cảm; người review diff trước merge, Cấm — NEVER chạy ngoài local |
| Bộ test đỏ sẵn che hồi quy | `pnpm test` có `--bail 1` nên chỉ báo "1 failed" | Ghi danh sách file đỏ **trước** khi sửa rồi diff sau; chỉ file đỏ mới tính là hồi quy |
