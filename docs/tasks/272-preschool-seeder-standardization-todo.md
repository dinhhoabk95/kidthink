# Todo — Task #272: Chuẩn hóa & tối giản Seeder theo chương trình mầm non thực tế

- [x] **WP272.1: Sửa 14 lỗi Cổng 9 tồn đọng**
  - [x] `packages/content/src/skills/c1/meas/C1.MEAS.13.ts` (mặt đồng hồ/chữ số giờ)
  - [x] `packages/content/src/skills/c1/nrec/C1.NREC.05.ts` (chữ số)
  - [x] `packages/content/src/skills/c1/oto/C1.OTO.04.ts` & `C1.OTO.06.ts`
  - [x] Cập nhật `scripts/seed-gates-baseline.json` về 0 vi phạm Cổng 9
  - [x] Chạy `pnpm check:seed-gates` exit 0
  - Nguyên nhân gốc nằm ở builder `GT-002/003/004/006` (chọn vật ngẫu nhiên, có thể không
    hiện glyph nào), không phải ở dataset. Sửa ở builder nên 5 dataset không đổi; 6380/6380
    level đạt. Ba level `GT-006` của `C1.MEAS.13` nay xếp chuỗi chữ số giờ thay vì mặt đồng hồ.

- [x] **WP272.2: Khung lộ trình 36 tuần học GDMN chuẩn cho 3 độ tuổi** — **KHÔNG làm, bị #276 thay thế**
  - #276 gỡ `CUR-BE3..J42` và `MVP_CURRICULA_CONFIGS`, thay bằng 3 lộ trình `RM-3-4-mam-01`,
    `RM-4-5-chi-01`, `RM-5-6-la-01` (12 tuần × 3 buổi) cùng sổ cầu `content-demand.json`.
  - Mục tiêu 36 tuần / 10 chủ đề năm học **chưa đạt** (hiện 12 tuần). Nếu vẫn cần, mở task
    mới mở rộng `RM-*`, không sửa `curricula.ts` đã bị gỡ.

- [x] **WP272.3: Cơ chế Seeder Profile (`core` vs `synthetic`)** — **KHÔNG làm, hoãn**
  - `CORE_SEED_LEVELS` và `MINDKID_SEED_PROFILE` chưa từng được viết. Seeder nay chọn nội dung
    theo sổ cầu của #276, nên cách lọc `core` phải thiết kế lại theo sổ cầu, không theo plan này.
  - `pnpm db:seed` vẫn nạp toàn bộ 6.380 level; mục "phình to cơ học" ở plan **chưa giải quyết**.

- [x] **WP272.4: Gắn kết bài học & làm sạch dữ liệu** — **KHÔNG làm riêng, chuyển cho cổng của #276**
  - Liên kết lesson ↔ activity ↔ game_level do `pnpm check:lesson-topics` và
    `pnpm check:content-demand` giữ (nay chạy trong `scripts/check.sh`).
  - Narration tiếng Việt của bài thuộc phạm vi #269.

- [x] **WP272.5: Kiểm tra xác minh cổng (Gates)**
  - [x] Chạy `bash scripts/check.sh --fast` — xanh toàn bộ (2026-10-06)
  - [ ] Manual test dữ liệu database và màn hình chơi — **chưa làm** (cần DB và trình duyệt)

## Kết luận đóng task

Chỉ **WP272.1** thật sự hoàn thành. WP272.2–4 đóng vì bị #276 thay thế hoặc chuyển chỗ, không
phải vì đã làm. Hai nợ còn lại, đều cần quyết định nội dung: lộ trình 36 tuần, và profile
`core`/`synthetic` để thu gọn 6.380 level.
