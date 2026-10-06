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

- [ ] **WP272.2: Khung lộ trình 36 tuần học GDMN chuẩn cho 3 độ tuổi**
  - [ ] Phân bổ 10 chủ đề năm học theo 36 tuần
  - [ ] Cập nhật `MVP_CURRICULA_CONFIGS` trong `packages/content-build/src/seed-master/curricula.ts`
  - [ ] Kiểm tra tính hợp lệ của cây tuần học

- [ ] **WP272.3: Cơ chế Seeder Profile (`core` vs `synthetic`)**
  - [ ] Cấu hình lọc `CORE_SEED_LEVELS` trong `packages/content-build/src/catalog.ts`
  - [ ] Tích hợp chọn profile trong `seed-content.ts` và `seed-all.ts`
  - [ ] Xác nhận `pnpm db:seed` nạp đúng profile `core`

- [ ] **WP272.4: Gắn kết bài học & làm sạch dữ liệu**
  - [ ] Rà soát liên kết lesson ↔ activity ↔ game_level
  - [ ] Đảm bảo 100% bài học có narration tiếng Việt và chỉ dẫn sư phạm

- [ ] **WP272.5: Kiểm tra xác minh cổng (Gates)**
  - [ ] Chạy `bash scripts/check.sh --fast`
  - [ ] Manual test kiểm tra dữ liệu database và màn hình chơi
