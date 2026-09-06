# Task #253 — Danh sách việc: GT-000 dạy trọn một chủ đề

Kế hoạch: [`253-gt000-concept-theme-plan.md`](253-gt000-concept-theme-plan.md) ·
Spec: [`concept-pre-skill.md`](../specs/05-content/concept-pre-skill.md) ·
[`GT-000.md`](../specs/01-platform/engines/GT-000.md) ·
[`concept-intro-model.md`](../specs/05-content/concept-intro-model.md) ·
[`concept-intro-runner.md`](../specs/04-play/concept-intro-runner.md)

Quy ước: mỗi mục có **nghiệm thu đo được**. Cấm — NEVER tick khi mới "code xong".
Mọi luật mới phải có **ca âm** — một đầu vào sai làm cổng đỏ. Cổng không có ca âm là cổng
chưa chứng minh được nó chặn gì.

Chạy mọi lệnh với node 24.15: `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH`.

---

## Chuẩn bị — chạy một lần, trước mọi thứ

```bash
export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH
cd mindkid
node -v                                    # phải in v24.15.0
node_modules/.bin/tsx scripts/check-intro-coverage.ts   # ghi lại con số nợ trước khi sửa
node_modules/.bin/tsx packages/content-build/src/gates/skill-quota.ts | tail -5
```

- [x] Ghi lại ba con số nền vào đầu mốc M4: nợ phủ (404), số kỹ năng 0 level (0), số level `GT-000` (4 level nền).
  - Nghiệm thu: ba con số nằm trong file này, không phải trong đầu ai.

---

## M0 — mở mạch chạm và mạch telemetry

Sau mốc này bài làm quen **chơi được**, dù vẫn chỉ dạy một giá trị.

- [x] Thêm trường `input` họ `tap` vào `packages/game-engine/src/templates/GT-000/template.ts`.
  - Nghiệm thu: `TEMPLATE_INPUT_REGISTRY["GT-000"]` không còn là `undefined`; vòng lặp
    `grep -q '^  input:'` trên 37 file `template.ts` không còn khuôn nào trượt.
- [x] Thêm `getView()` và `toAction()` cho `GT000Session`.
  - Nghiệm thu: test dựng một phiên, gửi một cử chỉ chạm vào ô của mục tiêu, khẳng định
    `currentStepIndex` tăng 1. Ca âm: chạm vào ô trống thì chỉ số không đổi.
- [x] Thêm `GT-000` vào `packages/game-engine/config/engine-input-ready.json`.
  - Nghiệm thu: cổng `BR-EIC-01` chạy trên `GT-000` và xanh.
- [x] Chốt một bộ tên event theo mục 7.2 của `concept-intro-runner.md`; đổi tên trong
      `session.ts` và đăng ký đủ trong `packages/play/src/events/catalog.ts`.
  - Nghiệm thu: một lượt chơi thật gửi hết event, `POST /events` trả 2xx, `play_sessions`
    về `completed`. Ca âm: thêm một tên lạ vào danh sách phát của khuôn thì cổng danh mục đỏ.
- [x] Thêm cổng so khớp `template.events` với danh mục event chung.
  - Nghiệm thu: cổng đỏ khi một khuôn khai một tên không có trong danh mục; xanh khi khớp.
- [x] Checkpoint người: chơi thử trên máy thật, chạm từng bước tới hết bài.

---

## M1 — mở mạch tiếng

Sau mốc này bài làm quen **nghe được**.

- [x] Gọi bộ đọc từ trong `GT000Session` ở mỗi bước `present`: `audio_path` trước, bộ đọc
      `vi-VN` sau (`BR-CIR-19`).
  - Nghiệm thu: test giả lập một chất liệu có `audio_path` khẳng định đường phát file được
    gọi; giả lập chất liệu không có thì khẳng định bộ đọc được gọi với đúng `label`.
- [x] Bỏ `tts_used: true` ghi cứng ở `session.ts`; lấy kết quả thật của lần phát (`BR-CIR-20`).
  - Nghiệm thu: ca âm — máy không có giọng `vi-VN` thì event mang `tts_used` bằng `false`
    và có thêm `tts_unavailable`. Ca dương: có giọng thì `true`.
- [x] Chặn chạm cho tới khi lệnh phát đã được gọi.
  - Nghiệm thu: test khẳng định cử chỉ chạm tới trước lệnh phát bị bỏ qua.
- [x] Chép kho mp3 giọng Việt dùng lại được từ v1 sang mindkid, bắt đầu bằng
      `common/numbers/0..30.mp3`.
  - Nghiệm thu: `find . -name '*.mp3' | wc -l` khác 0; 31 file số có mặt và phát được.
- [x] Checkpoint người: bật loa, nghe hết một bài, xác nhận không câu nào chỉ đọc được bằng mắt.

---

## M2 — bậc `pre`, năm kỹ năng mới, năm dataset chủ đề

- [x] Thêm `"pre"` vào từ vựng bậc ở `packages/shared/src/taxonomy-types.ts`.
  - Nghiệm thu: `pnpm typecheck` xanh; giá trị `pre` gán được cho `tier`.
- [x] Thêm nhánh `pre` cho `formatTier` ở `scripts/taxonomy/sync-taxonomy-docs.ts`.
  - Nghiệm thu: ca âm — trước khi sửa, một kỹ năng `tier: "pre"` bị in ra ký hiệu `a`;
    sau khi sửa in ra `p`. `pnpm check:taxonomy-docs` xanh.
- [x] Dạy `packages/content-build/src/gates/skill-quota.ts` biết `kind = 'teach'`: kỹ năng chỉ
      có level dạy thì miễn hạn ngạch số level và miễn ràng buộc trải nhiều khuôn (`BR-PRE-07`).
  - Nghiệm thu: ca âm bắt buộc — một kỹ năng bậc `core` thuộc C1 có đúng 1 level **vẫn** bị
    cổng bắt lỗi, trong khi một kỹ năng bậc `pre` có đúng 1 level `GT-000` thì không.
- [x] Soạn 5 kỹ năng bậc `pre` theo bảng mục 7.3 của `concept-pre-skill.md`, mỗi kỹ năng đủ
      3 mục tiêu học tập.
  - Nghiệm thu: property test taxonomy xanh; đồ thị prerequisite vẫn là DAG; ca âm — đặt
    `difficulty` của một kỹ năng `pre` lên 3 thì test đỏ.
- [x] Soạn lại dataset kỹ năng "Quan sát màu" thành 8 màu (`BR-PRE-10`).
  - Nghiệm thu: 8 trên 8 vật của dataset là màu; ca âm — đưa lại "cái thìa" vào thì cổng
    trung thực dataset đỏ.
- [x] Cắt dataset "Nhận biết số 11–20" về đúng 11…20.
  - Nghiệm thu: dataset có 10 vật, giá trị nhỏ nhất là 11.
- [x] Soạn dataset hình phẳng 7 hình cho kỹ năng bậc `pre` của chủ đề hình học.
  - Nghiệm thu: 7 vật, mỗi vật có hình minh hoạ và nhãn tiếng Việt đọc được.
- [x] Gắn `audio_path` cho vật của ba chủ đề số.
  - Nghiệm thu: mọi vật của ba dataset số có `audio_path` trỏ tới file có thật.
- [x] Checkpoint người: đọc bảng taxonomy đã sinh lại, xác nhận 5 dòng mới đúng chỗ và đúng bậc.

---

## M3 — phân đoạn vào contract, bộ chiếu đi hết dataset

- [x] Thêm khối phân đoạn vào contract nội dung của `GT-000` theo `BR-E000-03` và `BR-E000-04`.
  - Nghiệm thu: ca âm — một phân đoạn 7 chất liệu bị từ chối; một bài 22 chất liệu bị từ
    chối; một phân đoạn không có `recall` bị từ chối; một bài không có phân đoạn ôn bị từ chối.
- [x] Sửa `difficulty_params` mà bộ chiếu sinh cho khớp contract độ khó của khuôn.
  - Nghiệm thu: ca âm — bốn khoá cũ (`pacing`, `max_errors_before_remediation`,
    `interaction_timeout_ms`, `show_scaffolding`) bị từ chối thay vì bị nuốt im.
- [x] Viết lại `packages/content/src/builders/gt-000.ts`: đi hết `dataset.items`, cắt phân
      đoạn 3–4 giá trị, thêm phân đoạn ôn cuối, dùng `_opts` để vòng khác nhau.
  - Nghiệm thu: chiếu dataset chủ đề 0–10 ra một `content_pack` dạy đủ **11** giá trị; ca
    âm — bỏ một giá trị khỏi kết quả thì cổng `BR-PRE-09` đỏ.
- [x] Bỏ `GT-000` khỏi bốn chỗ đang loại nó khỏi đường sinh nội dung.
  - Nghiệm thu: `GT-000` xuất hiện trong kết quả của bộ sinh; các cổng liên quan vẫn xanh.
- [x] Checkpoint người: mở một `content_pack` sinh ra, đọc từ trên xuống, xác nhận không giá
      trị nào bị hỏi trước khi được giới thiệu.

---

## M4 — gieo năm level chủ đề

- [x] Gieo 5 level `GT-000`, mỗi level một chủ đề, gắn `skill_codes` đủ hai đầu (`BR-PRE-06`).
  - Nghiệm thu: 5 level qua contract nội dung và contract độ khó; ca âm — gắn thiếu kỹ năng
    chơi thì cổng phủ đỏ.
- [x] Phủ đủ ba band tuổi và ba giá trị trục chủ đề theo mục 13 của `GT-000.md`.
  - Nghiệm thu: ma trận seed của khuôn đạt; `theme_span` từ 2 lên ≥3.
- [x] Hạ trần nợ phủ trong `scripts/intro-coverage-baseline.json` kèm lý do.
  - Nghiệm thu: con số mới nhỏ hơn 404 và bằng đúng số đo lại; ca âm — nâng trần lên thì
    lượt duyệt phải từ chối.
- [x] Cập nhật mục 16 của `GT-000.md` bằng số đo lại.
  - Nghiệm thu: `level_count` trong phiếu bằng đúng số level thật.
- [x] Checkpoint người: chơi hết một level chủ đề 0–10 từ đầu tới cuối, tính giờ từng phân đoạn.

---

## M5 — đấu nối prerequisite để cổng chặn thật

- [x] Khai kỹ năng bậc `pre` vào `prerequisites` của mọi kỹ năng chơi cùng chủ đề (`BR-PRE-05`).
  - Nghiệm thu: đồ thị vẫn DAG; ca âm — bỏ một khai báo thì cổng chủ đề đỏ.
- [x] Kiểm hàng đợi bài làm quen khi một chủ đề cần nhiều bài.
  - Nghiệm thu: hàng đợi trả đúng mã level và số bài còn lại, không cắt mất bài cần thiết.
- [x] Đo lại cửa chặn trên một trò chơi thật.
  - Nghiệm thu: mở một level thuộc kỹ năng "Nhận biết số 0–10" khi chưa chơi bài làm quen thì
    nhận `428 INTRO_REQUIRED` và thẻ dẫn sang bài làm quen; sau khi chơi xong thì mở được.
- [x] Chạy trọn bộ cổng.
  - Nghiệm thu: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `check:engine-specs`,
    `check:taxonomy-docs`, `check:skill-quota` đều xanh.
- [x] Checkpoint người: một trẻ thật, một lượt, có người ngồi xem và ghi lại chỗ trẻ dừng.
