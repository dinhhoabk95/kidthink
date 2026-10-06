# Todo — Task #272: Chuẩn hóa & tối giản Seeder theo chương trình mầm non thực tế

> Mở lại 2026-10-06: lần đóng trước ghi WP272.2–4 là "bị #276 thay thế" là **sai**. #276 chỉ đổi
> *cơ chế* (curricula → roadmap `RM-*`), không thay *yêu cầu*: mỗi độ tuổi phải có lộ trình
> **đủ 36 tuần**. Roadmap 12 tuần hiện có (`RM-*-01`) giữ nguyên làm lộ trình khởi động
> (mã bất biến, BR-LRM-10); thêm lộ trình cả năm `RM-*-year-01` (BR-LRM-12).

- [x] **WP272.1: Sửa 14 lỗi Cổng 9 tồn đọng**
  - Nguyên nhân gốc ở builder `GT-002/003/004/006`; 6380/6380 level đạt, baseline = 0.

- [x] **WP272.2: Lộ trình 36 tuần × 3 độ tuổi, 10 chủ đề năm học GDMN**
  - [x] Spec `learning-roadmap-model.md`: `BR-LRM-12` + §7.1a (bảng 10 chủ đề × tuần)
  - [x] `rm-3-4-mam-year-01.ts` (Mầm 3–4t) — 24 kỹ năng, 108 tiết
  - [x] `rm-4-5-chi-year-01.ts` (Chồi 4–5t)
  - [x] `rm-5-6-la-year-01.ts` (Lá 5–6t)
  - [x] Đăng ký trong `roadmaps/index.ts`; `pnpm check:roadmap-balance` xanh (6/6 lộ trình)
  - [x] `pnpm derive:demand` + `pnpm check:content-demand` xanh
  - Nợ nội dung thật (sổ cầu): mầm 64/108, chồi 64/108, lá 66/108 ô chưa có bài/level phủ trọn
    band. Không mượn nội dung kỹ năng khác để che. Chủ đề chỉ là nhãn tuần trong `goal`; chưa
    gắn kỹ năng ↔ chủ đề bằng `topics[]` (sổ cầu theo chủ đề chưa cài).

- [x] **WP272.3: Hồ sơ gieo `MINDKID_SEED_PROFILE`**
  - [x] Spec `BR-LRM-13`; `packages/content-build/src/seed-profile.ts`; áp ở `seed:content`/`db:seed`
  - `full` (mặc định, như cũ): 6.380 level. `core`: 319 level có tên trong sổ cầu + 126 bài +
    toàn bộ hoạt động.
  - Lệch plan: plan nêu `core` là mặc định và `synthetic` là toàn bộ. Giữ mặc định `full`
    vì thư viện trò chơi tự do và `BR-ECD-07` (mỗi engine ≥1 level free) dựa vào level mồ côi.
    Đổi mặc định là quyết định sản phẩm — **chờ người quyết**.

- [x] **WP272.4: Gắn kết bài học & làm sạch dữ liệu**
  - [x] `check:lesson-topics`, `check:lesson-supply`, `check:go-live` xanh với 3 lộ trình mới
  - Nợ cung khuôn 25 bài (trần sổ nợ) không tăng.

- [ ] **WP272.5: Kiểm tra xác minh cổng**
  - [x] `bash scripts/check.sh --fast` xanh (2026-10-06)
  - [ ] Manual test dữ liệu database và màn hình chơi — cần DB và trình duyệt, **chưa làm**
