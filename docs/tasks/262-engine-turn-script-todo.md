# Task #262 Todo: Kịch bản lượt chơi

Plan: [`262-engine-turn-script-plan.md`](262-engine-turn-script-plan.md).

## T0 — Spec (xong 2026-09-08)

- [x] Viết [`engine-turn-script.md`](../specs/01-platform/engine-turn-script.md) — bảy nhịp, 12 rule `BR-ETS-*`, tám nhánh bắt buộc
- [x] Đo hiện trạng: 26/37 phiếu có mục 4 là bản sao; mục 5 trung vị 4 nhánh
- [x] Đo khoản nợ lời đọc: `prompt_audio_ref` khai 36/37 contract, **0 nơi đọc**; `instruction_audio_path` là đường sống
- [x] Thêm `BR-ESS-18` và `BR-ESS-19` vào [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md)
- [x] Cập nhật khuôn mục 4 và mục 5 trong [`engines/TEMPLATE.md`](../specs/01-platform/engines/TEMPLATE.md)
- [x] Viết lại mục 4 và mục 5 cho **37** phiếu `GT-000` … `GT-036`
- [x] `check:engine-specs` xanh sau thay đổi

## T1 — Cổng `check:engine-turn`

- [x] Bảy mốc `N1`…`N7` có đủ và đúng thứ tự
- [x] Chặn ba chuỗi bản sao cũ
- [x] `N2` nêu trường lời đọc và kênh hình song song
- [x] `N5` nêu đủ `L1` · `L2` · `L3`
- [x] `N7` nêu cả **đổi** lẫn **giữ**
- [x] Mục 5 ≥8 hàng, phủ đủ tám nhãn nhánh
- [x] Ngưỡng độ dài tối thiểu mỗi nhịp

## T2 — Ca âm (≥6)

- [x] Thiếu một nhịp → đỏ
- [x] Sai thứ tự nhịp → đỏ
- [x] Còn chuỗi bản sao → đỏ
- [x] Thiếu một nhánh bắt buộc → đỏ
- [x] `N5` chỉ ghi "scaffolding highlight" → đỏ
- [x] `N7` không nói cái gì giữ nguyên → đỏ

## T3 — Test giữ thứ đang đúng

- [x] `BR-ETS-02`: chạm lúc `isLoading` bật không sinh sự kiện engine
- [x] `BR-ETS-03`: nghe lại giữa chừng dừng lời cũ trước, không hai `HTMLAudioElement` cùng sống
- [x] `BR-ETS-10`: hai lượt liên tiếp cùng level — `layout_seed` khác, `difficulty_params` bằng nhau

## T4 — Đóng khoản hai trường lời đọc

- [x] Chốt câu hỏi 1 của spec: giữ `prompt_audio_ref` hay giữ `instruction_audio_path` (đã chốt Option 1: giữ `instruction_audio_path`, khai tử `prompt_audio_ref`)
- [x] Thi công đúng **một** hướng; cấm — NEVER để lại hai đường
- [x] Cập nhật `gate-09-concept-present.ts` và `config-dictionary.ts` theo hướng đã chốt
- [x] Cập nhật mục 7 của các phiếu bị ảnh hưởng
- [x] `grep` trường bị khai tử trả 0 kết quả ngoài migration

## T5 — Nối cổng

- [x] `check:engine-turn` vào `package.json` của `@mindkid/game-engine`
- [x] Gọi trong `scripts/check.sh`, ngay sau `check:engine-specs`
- [x] Chạy bằng binary Node v24.15.0

## T6 — Bàn giao câu hỏi mở

- [x] Câu hỏi 2 (nút nghe lại thuộc bề mặt chơi hay engine — studio preview hiện không có) → **Backend**
- [x] Câu hỏi 3 (`N6` giữ thành quả bao nhiêu mili giây) → **Nội dung**
- [x] Câu hỏi 4 (lần chơi thứ n có đổi chủ đề không, dùng trục `boi-canh` của mục 18) → **Nội dung**

## T7 — Vòng review (2026-09-08)

Cổng của T1 xanh 37/37 nhưng đo lại thì thủng ở bốn chỗ, và khoản nợ của T4 chưa đóng hết.
Mỗi chỗ đã bịt và có ca âm riêng.

- [x] **Cổng xanh giả trên tập rỗng.** `scanEngineTurnGate` lấy toàn bộ vũ trụ từ `readdirSync`,
  nên thư mục rỗng hay đổi tên cho 0 spec, 0 vi phạm, exit 0 — mà báo cáo vẫn in *"Tất cả 37
  phiếu … đạt chuẩn"*. Nay cổng đối chiếu `engine-spec-ready.json` (37 mã) và báo cáo in
  `totalSpecs` thật. Ca âm 13 (thư mục rỗng) và ca âm 14 (không đọc được danh sách mã).
- [x] **`BR-ETS-04` chưa đóng: đường thứ ba.** `GT018ContentSchema.audio_prompt.audio_url`
  soạn được qua `config-dictionary`, **không ai đọc** — đúng cái bẫy mà `prompt_audio_ref`
  vừa bị gỡ vì nó. Đã gỡ khỏi contract và khỏi từ điển. Bậc thang mới:
  `tests/gates/one-narration-source.test.ts` quét contract nội dung của cả 37 engine.
  `GT-000.assets[].audio_path` **không** thuộc luật này — âm của từng chất liệu, có người đọc.
- [x] **Nhịp `N2` không gọi tên trường nào.** Đo được **0/37** phiếu nêu `instruction_audio_path`
  ở mục 4; phép kiểm mang nhãn `BR-ETS-04` nhận cả chữ `prompt` trần lẫn tên đã khai tử. Nay
  `N2` bắt buộc gọi đúng `instruction_audio_path`, phiếu cấm — NEVER nhắc tên đã khai tử, và
  mục 4 của **cả 37** phiếu đã sửa. Ca âm 11 và 12.
- [x] **Nhắc lại một nhịp cũ làm cổng đỏ oan.** `N3` xuất hiện lần thứ hai trong thân `N5` bị
  tính là nhịp đặt sai chỗ, và cắt đoạn văn bản sai nên sinh thêm lỗi *"quá ngắn"*. Nay chỉ
  lần xuất hiện **đầu tiên** của mỗi nhịp mới định thứ tự và định đoạn. Có ca dương giữ.
- [x] **`BR-ETS-10` đo bằng test rỗng nghĩa.** Test cũ tự đưa hai seed khác nhau vào hai runner
  rồi khẳng định chúng khác nhau, và so `difficulty_params` của cùng một object. Bàn mới sinh
  ở route config, nên đã tách `createLayoutSeed()` ra khỏi `createPlaySessionRecord()` và giữ
  bằng `apps/web/tests/unit/turn-script-replay-seed.test.ts`; test runner nay giữ đúng nửa của
  nó (seed đi qua nguyên vẹn, độ khó không đổi theo số lần trợ giúp).
- [x] Ghi quyết định của câu hỏi 1 vào chính spec `engine-turn-script.md` (mục 2, `BR-ETS-04`,
  mục 11) — trước đó spec vẫn đọc như thể khoản nợ còn mở.
- [x] Bổ sung `check:engine-specs`, `check:engine-turn`, `check:engine-behavior`,
  `check:engine-behavior-corpus` vào bảng *"đây là toàn bộ"* của `AGENTS.md`, và thêm
  `engine-turn` vào dòng tổng kết của `scripts/check.sh`.

### T8 — Đóng nốt hai khoản còn mở (2026-09-08)

- [x] **`BR-ETS-02` nay đo hành vi, không đo chuỗi nguồn.**
  `apps/web/tests/component/play-surface-preload-guard.test.ts` mount bề mặt chơi thật trong
  happy-dom, cầm nhịp `fetchAndStartGame()` bằng một promise hoãn, rồi đo `display` của
  `.game-viewport` ở ba thời điểm: đang preload, lỗi, và preload xong. Đo lại bằng ca đột biến:
  gỡ `v-show` → **4/4 đỏ**; đổi thứ tự thuộc tính → **4/4 vẫn xanh**, trong khi test so khớp
  chuỗi cũ **đỏ oan**. Nửa `BR-ETS-02` trong `turn-script-audio-guard.test.ts` đã gỡ, file đó
  nay chỉ còn `BR-ETS-03`.
- [x] **`game-config-delivery.test.ts` từ 22/23 đỏ về 22/22 xanh.**
  Nguyên nhân thật: `seedTestLevel()` còn `select()` bảng `game_templates` — bảng đã bị xoá;
  `game_levels` trỏ khuôn bằng cột `template_code`. Sửa helper là đủ, không đụng route.
- [x] **Xung đột spec 422 ↔ 500 xử theo bằng chứng, không theo sở thích.**
  `game-config-delivery.md` ghi 500 ở ba chỗ, `error-codes.md` và bảy spec khác ghi 422, mã
  nguồn trả 422. `defineError` (`packages/errors/src/base.ts:202`) giữ cặp (mã, status, thông
  báo) ở đúng một chỗ, nên một mã Cấm — NEVER mang hai status: bản 500 **không cài được**. Đã
  sửa ba chỗ của spec chủ sở hữu về 422 kèm ghi chú lý do, và giữ nửa **alert** của `BR-CFG-03`
  bằng test thật (spy `console.error`) — trước đó không ai đo nửa đó.
- [x] Hạ `apps/web/tests/api/game-config-delivery.test.ts` khỏi `scripts/test-baseline.json`.
