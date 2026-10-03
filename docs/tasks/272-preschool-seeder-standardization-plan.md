# Kế hoạch — Task #272: Chuẩn hóa & tối giản Seeder theo chương trình mầm non thực tế

> **Loại task:** Nội dung & Kiến trúc Seeder (L).
> **Tham chiếu:**
> - Văn bản hợp nhất số 01/VBHN-BGDĐT (Thông tư 17/2009 + 28/2016 + 51/2020 ban hành Chương trình GDMN).
> - Thông tư số 23/2010/TT-BGDĐT (Quy định Bộ chuẩn phát triển trẻ em 5 tuổi).
> - `docs/taxonomy/moet-alignment.md` (Đối chiếu khung C1–C6 với GDMN Việt Nam).
> - `docs/tasks/192-golive-preschool-pedagogy-plan.md` (Nguyên tắc sư phạm mầm non: tiết học trộn vật thật + vận động + trò chơi số ngắn).

---

## 1. Hiện Trạng & Vấn Đề

1. **Phình to cơ học:** 443 skills × ma trận tổ hợp = 6.380 game levels. Đa số sinh tự động bằng cách tráo đổi tham số và emoji, thiếu chủ đích sư phạm sâu sắc.
2. **Dàn trải, thiếu gắn kết thực tế:** Trẻ mầm non 3–6 tuổi học theo chủ đề tuần/tháng (10 chủ đề năm học GDMN Việt Nam). Việc dàn trải 6.380 levels rời rạc làm loãng trọng tâm giáo dục.
3. **Nợ chất lượng Cổng 9:** 14 level đang vi phạm Cổng 9 (`CONCEPT_GLYPH_MISSING` ở `C1.MEAS.13`, `C1.NREC.05`, `C1.OTO.04`, `C1.OTO.06`).
4. **Curricula chưa hoàn chỉnh:** Chỉ có 4 lộ trình ngắn 8 tuần (24 buổi), chưa phản ánh đủ khung 36 tuần học của một năm học mầm non chuẩn.

---

## 2. Giải Pháp Chuẩn Hóa & Tối Giản

1. **Tách bạch 2 profile Seed:**
   - **Profile `core` (Mặc định cho sản phẩm):** Nạp chương trình 36 tuần học chuẩn cho 3 độ tuổi (Mẫu giáo bé 3–4t, Chồi 4–5t, Lá 5–6t), 10 chủ đề năm học, đi kèm bộ **Curated Core Game Levels** (~300–400 levels tuyển chọn, 0 lỗi Cổng 9, có narration).
   - **Profile `synthetic` (Cờ chạy riêng):** Giữ lại toàn bộ 6.380 levels tổ hợp phục vụ benchmark engine và stress test hạ tầng.
2. **Xóa sạch 14 vi phạm Cổng 9:** Sửa đổi dataset và template tương ứng để đảm bảo khái niệm được hiển thị trực quan 100%.
3. **Mở rộng lộ trình 36 tuần học thực tế trong Curricula:** Mỗi tuần gồm 3 buổi tích hợp (1 hoạt động vật thật/vận động + 2 trò chơi số củng cố).

---

## 3. Danh Sách Công Việc

1. **WP272.1 — Sửa dứt điểm 14 lỗi Cổng 9 trong dataset & builder:**
   - Cập nhật dataset `C1.MEAS.13`, `C1.NREC.05`, `C1.OTO.04`, `C1.OTO.06` hoặc template `GT-000` / `GT-001` để render đúng glyph/số/đồng hồ.
   - Chạy `pnpm check:seed-gates` đạt 0 lỗi Cổng 9, đưa baseline về 0.

2. **WP272.2 — Xây dựng khung Lộ trình 36 tuần học GDMN chuẩn cho 3 độ tuổi:**
   - Cập nhật `packages/content-build/src/seed-master/curricula.ts` cho `CUR-BE3`, `CUR-BE4`, `CUR-BE5` bám sát 10 chủ đề năm học.

3. **WP272.3 — Thiết lập cơ chế phân tách Seeder Profile (`core` vs `synthetic`):**
   - Hỗ trợ biến môi trường `MINDKID_SEED_PROFILE=core` (mặc định) và `MINDKID_SEED_PROFILE=synthetic`.
   - Giúp việc chạy `pnpm db:seed` nhanh gọn, tập trung và đúng chuẩn mầm non.

4. **WP272.4 — Rà soát, liên kết bài học & làm sạch dữ liệu mầm non:**
   - Đảm bảo mỗi tuần có đúng 3 bài học gắn kết, không có game rác hay game trôi nổi vô thừa nhận.

5. **WP272.5 — Kiểm tra xác minh toàn diện:**
   - Chạy `bash scripts/check.sh --fast` đảm bảo toàn bộ hệ sinh thái gate xanh sạch.
