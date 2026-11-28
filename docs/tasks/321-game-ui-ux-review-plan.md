# Task #321 — Review UI/UX toàn bộ game engine (GT-000..GT-037)

## Mục tiêu

Review lại 38 engine của `packages/game-engine` và trang chơi `apps/web/app/pages/play/[code].vue`,
sửa lỗi UI/UX trẻ gặp thật, đo bằng cổng hiện có (`shell-frame-capacity`, `stage-engines*`) và
chơi thật trên Chromium bằng tài khoản seed.

## Quyết định

| # | Quyết định | Lý do |
| - | - | - |
| 1 | Điện thoại dọc ≤ 640 px: thu khung gỗ (đệm 4 + viền 3), đệm arena 4/8/4, HUD đệm 4 | Khung cũ ăn 60 px ngang trong 360 — sàn chạm 96 px CSS thành 173 logic, sân khấu chỉ 2 cột. Thu khung: nợ tràn `play` 1190 → 446 ca, 15 → 9 engine, không đụng sàn chạm (`BR-LAY-04`). Số đo Chromium ghi ở `BR-LAY-13` |
| 2 | `splitHeroStage`: vùng chính (mặt đồng hồ, tháp) nhường cao cho lựa chọn, không dưới một sàn chạm; chọn kiểu chia chứa đủ ô | 55% cố định làm phần lựa chọn ở 360 px band 3-4 còn 182 logic < ô 154 + đệm: ô rơi ra ngoài canvas (GT-016, GT-017) |
| 3 | Không phân trang | `BR-LAY-12`, `BR-PSZ-13` (PO chốt 2026-11-08): nợ sức chứa còn lại gỡ bằng bớt ô ở nội dung/contract |
| 4 | Không sửa `layout-safe-area-debt.json` | Nhánh `resolveLayout` không stage; mọi engine đã vào khung năm vùng nên trẻ không thấy |

## Phát hiện chưa xử lý trong task này

- Nút DOM "bỏ qua" (`.btn-skip-floating`) nổi đè góc dưới-trái canvas: đè vật trong khay ở engine có khay không nút nộp. Chưa có spec vị trí.
- `computeStageWithoutTray` (portrait) dừng sân khấu trên `action.y` kể cả khi `needsCommit=false`, lệch câu chữ `BR-PSZ-03`; hàng trống đó đang vô tình chừa chỗ cho nút "bỏ qua". Cần quyết định vị trí nút "bỏ qua" trước khi trả hàng cho sân khấu.

## Quy trình

Review từng nhóm engine bằng subagent (Opus) → gom kế hoạch → builder (Sonnet) theo gói file độc lập → review lại (Opus) → `pnpm check` + vitest workspace đã đụng.

## Kết quả review 38 engine (2026-11-28)

Năm lượt review (Opus) theo nhóm GT-000..007, 008..015, 016..023, 024..030, 031..037, QA trình duyệt
bằng tài khoản guest + seed `parent.pro`. Mười một gói sửa (Sonnet) theo file độc lập, một lượt
review lại (Opus) toàn diff. Việc đã làm và việc còn mở: `321-game-ui-ux-review-todo.md`.

| # | Quyết định | Lý do |
| - | - | - |
| 5 | Câu nhiều đoạn bỏ qua đoạn lỗi; dự phòng thị giác chỉ khi câu dẫn lỗi (`BR-PNR-06`) | Một mp3 khung chuyện 404 làm câu dẫn câm và đặt gợi ý L2 (bàn tay lộ đáp án) từ giây 0 |
| 6 | Bảng `ENGINE_STORY_LINES` là subpath `@mindkid/game-engine/story-lines`, không qua `src/index.ts` | Bảng import mọi `GT-*/session`; export ở gốc kéo toàn bộ session vào bundle client (`BR-PRF-01`) |
| 7 | Bước nháp (thêm/bớt/đặt, chạm thẻ khoá) GT-028/029/030 trả `ACTION_QUIET_OK` (`BR-E028-14`, `BR-E029-12`, `BR-E030-12`) | Bước trung gian bị ghi `answer_correct` trước khi nộp, chạm sớm bị chấm sai (`BR-EIC-10`) |
| 8 | GT-026 chờ nút bắt đầu mặc định; pha thoát 360 ms trong ISI | N1 cấm tự khởi động; phản hồi sau chạm là code chết |
