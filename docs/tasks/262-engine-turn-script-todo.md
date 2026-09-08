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
