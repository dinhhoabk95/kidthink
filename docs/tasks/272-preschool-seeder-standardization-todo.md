# Todo — Task #272: Chuẩn hóa & tối giản Seeder theo chương trình mầm non thực tế

> Mở lại 2026-10-06: lần đóng trước ghi WP272.2–4 là "bị #276 thay thế" là **sai**. #276 chỉ đổi
> *cơ chế* (curricula → roadmap `RM-*`), không thay *yêu cầu*: mỗi độ tuổi phải có lộ trình
> **đủ 36 tuần**. Roadmap 12 tuần hiện có (`RM-*-01`) giữ nguyên làm lộ trình khởi động
> (mã bất biến, BR-LRM-10); thêm lộ trình cả năm `RM-*-year-01`.

- [x] **WP272.1: Sửa 14 lỗi Cổng 9 tồn đọng**
  - Nguyên nhân gốc ở builder `GT-002/003/004/006`; 6380/6380 level đạt, baseline = 0.

- [ ] **WP272.2: Lộ trình 36 tuần × 3 độ tuổi, 10 chủ đề năm học GDMN**
  - [ ] Spec `docs/specs/05-content/learning-roadmap-model.md`: thêm loại lộ trình cả năm
  - [ ] `rm-3-4-mam-year-01.ts` (Mầm 3–4t)
  - [ ] `rm-4-5-chi-year-01.ts` (Chồi 4–5t)
  - [ ] `rm-5-6-la-year-01.ts` (Lá 5–6t)
  - [ ] Đăng ký trong `roadmaps/index.ts`, `pnpm check:roadmap-balance` xanh
  - [ ] `pnpm derive:demand` + `pnpm check:content-demand` xanh

- [ ] **WP272.3: Cơ chế Seeder Profile (`core` vs `synthetic`)**
  - [ ] Thiết kế theo sổ cầu `content-demand.json`, không theo `MVP_CURRICULA_CONFIGS` đã gỡ

- [ ] **WP272.4: Gắn kết bài học & làm sạch dữ liệu**
  - [ ] `pnpm check:lesson-topics`, `check:lesson-supply`, `check:go-live` xanh với lộ trình mới

- [ ] **WP272.5: Kiểm tra xác minh cổng**
  - [ ] `bash scripts/check.sh --fast` xanh
  - [ ] Manual test dữ liệu database và màn hình chơi (cần DB và trình duyệt)
