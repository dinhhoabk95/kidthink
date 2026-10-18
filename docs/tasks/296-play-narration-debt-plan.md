# Kế hoạch Task #296: Trả nợ lời dẫn có tiếng và tên đọc được (Play Narration Debt)

Contract: `docs/specs/04-play/play-narration.md` (`BR-PNR-01`, `BR-PNR-02`, `BR-PNR-03`, `BR-PNR-04`, `BR-PNR-05`, `BR-PNR-10`; câu hỏi mở §11 số 4).

---

## 1. Bối cảnh & bằng chứng gap

Code phát lời dẫn + cổng bậc thang đã có (`scripts/check-narration-coverage.ts`, `scripts/narration-level-scan.ts`, `scripts/check.sh:138`), `BR-PNR-01..11` đều có ref trong code. Nợ còn lại nằm ở **dữ liệu**, đo trong `scripts/narration-coverage-baseline.json` (ngày 2026-09-19):

| Chỉ số | Giá trị | Hướng ratchet | BR |
| --- | --- | --- | --- |
| `rounds_with_instruction_audio` | **0** (cả 37 template trong `rounds_with_instruction_audio_by_template` đều 0) | chỉ tăng | `BR-PNR-03`, `BR-PNR-04` |
| `items_without_spoken_name` | **2009** | chỉ giảm | `BR-PNR-02` |
| `datasets_with_audio_path` | 53 / 443 | chỉ tăng | `BR-PNR-10` |
| `orphan_audio_files` | 700 | số đo | — |

Repo không có script sinh audio (rg `tts|voice|audio` trong `scripts/` chỉ thấy cổng). Spec §7.2 cho phép dự phòng bậc 2 (TTS trình duyệt từ `spokenLabel`), và §11 câu 4 còn mở: thu giọng người cho 36 engine hay chấp nhận TTS bậc 2.

## 2. Thiết kế

- **Điểm chốt với người dùng (S0, bắt buộc trước khi làm dữ liệu):** trả lời §11 câu 4.
  - (a) Thu giọng người: task này dựng danh sách câu cần thu (xuất CSV từ level đã phát: `template`, `level_code`, `round`, câu dẫn tiếng Việt, đường dẫn file đích), rồi nhập file theo lô.
  - (b) Chấp nhận TTS bậc 2 cho câu dẫn ngoài `C1`: sửa spec trước (định nghĩa "có tiếng" của `rounds_with_instruction_audio` gồm `instruction_text` đọc được bằng TTS?) — không đổi cách đếm cổng để nợ giảm giả.
  - Cấm dùng dịch vụ TTS bên thứ ba (spec §10 dòng 276).
- **Tên đọc được (`BR-PNR-02`).** Đa số 2009 item giải được bằng `spokenLabel` (tiếng Việt, từ từ điển glyph/nhãn có sẵn) — không cần thu âm. Viết codemod/sinh dữ liệu cho `packages/content` (dataset + builder), không sửa tay (>500 dòng → codemod, theo CLAUDE.md). Số đọc dùng lại `/audio/voice/common/numbers/{value}.mp3` (`BR-PNR-05`).
- **Ratchet.** Mỗi lô giảm nợ chạy `pnpm check:narration-coverage:update`; không bao giờ `--force` để tăng nợ.
- Không đổi cấu trúc thư mục `voice/d1…d6`.

## 3. Lát cắt (Slices)

Mỗi slice là một lô dữ liệu, kèm test trước: test của `scripts/check-narration-coverage.test.ts` hoặc test builder `packages/content` khẳng định lô mục tiêu đạt (ví dụ "mọi item của dataset X có `audio_path` hoặc `spokenLabel`").

- **S0 — Chốt §11 câu 4 + đo lại.** Chạy `rtk proxy pnpm check:narration-coverage`, ghi số thật hôm nay; hỏi người dùng (a)/(b); sửa spec nếu (b).
- **S1 — `spokenLabel` lô 1: item số và glyph đếm.** Test đỏ: dataset số/đếm không còn item thiếu tên. Codemod gán `audio_path` số chung (`BR-PNR-05`) hoặc `spokenLabel`. Ratchet `items_without_spoken_name` giảm.
- **S2 — `spokenLabel` lô 2: vật/hình/màu còn lại.** Như S1, tới khi `items_without_spoken_name = 0` hoặc phần còn lại được liệt kê kèm lý do và hỏi người dùng.
- **S3 — Câu dẫn vòng: hạ tầng nhập lô.** Test đỏ: script nhập lô gắn `instruction_audio_path` (trường duy nhất, `BR-PNR-03`) cho round khớp file; file thiếu → báo, không gắn. (a): xuất danh sách câu cần thu; (b): theo định nghĩa spec mới.
- **S4 — Câu dẫn vòng theo engine.** Mỗi lô vài engine, ưu tiên nhóm `C1` và engine nhiều level phát; test đỏ `rounds_with_instruction_audio_by_template[GT-xxx] > 0` cho engine trong lô. Ratchet tăng.
- **S5 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm check:narration-coverage`; `rtk proxy pnpm --filter @mindkid/content test`; `rtk proxy pnpm exec vitest run scripts/check-narration-coverage.test.ts`.
  - **Điều kiện nâng `implemented`:** `items_without_spoken_name = 0` và 37/37 template có `rounds_with_instruction_audio_by_template > 0` (`BR-PNR-04`). Khi đạt: bỏ `open_tasks` + khối "Chưa hoàn thành" ở `play-narration.md`, nâng `status: implemented`. Chưa đạt: giữ `approved` + `open_tasks`, cập nhật số nợ trong khối "Chưa hoàn thành".
  - Commit lên `main` sau mỗi lô xanh.

## 4. Rủi ro

- Cỡ L, phụ thuộc nguồn thu âm (người quyết). Lô `spokenLabel` (S1–S2) không phụ thuộc và nên làm trước.
- `orphan_audio_files = 700`: không xoá trong task này trừ khi người dùng đồng ý (có thể là file chờ gắn ở S3–S4).
