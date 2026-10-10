# Task #284 Plan: Khám phá trò chơi theo năng lực cho trẻ — Preschool Competency Game Explorer

Todo: [`284-child-competency-explorer-todo.md`](284-child-competency-explorer-todo.md).
Spec: [`child-competency-explorer.md`](../specs/04-play/child-competency-explorer.md) `BR-CCE-01..08`.

## 1. Mục tiêu & Bối cảnh

- Tại sảnh chơi trẻ em `/play`, 6 thẻ năng lực tư duy ($C_1 \dots C_6$) đang dẫn sang `/games?competency=${c.code}` (trang tìm kiếm của người lớn có thanh điều hướng công khai, tìm kiếm từ khoá, lọc chữ).
- Điều này vi phạm nghiêm trọng hai nguyên tắc:
  - `BR-PSZ-11`: Bề mặt trẻ layout `kid`, không có navbar/footer công khai của người lớn, lối ra duy nhất qua khoá phụ huynh.
  - `BR-PEN-03`: Catalog cho trẻ không có bộ lọc chữ — duyệt bằng hình ảnh và chủ đề trực quan.
- Task #284 xây dựng bề mặt **Khám phá trò chơi theo năng lực cho trẻ** tại `/play/competency/[code]`:
  - Hoàn toàn thuộc Kid Surface (layout `kid`, light only, không navbar/footer người lớn).
  - Tự động lọc game theo đúng `age_band` của trẻ đang chọn (`active_child_id`).
  - Thẻ trò chơi lớn (hit area $\ge 64$px), phong cách claymorphism, thumbnail emoji sinh động, hiển thị số sao đạt được nếu đã hoàn thành.
  - Bấm vào mở thẳng màn chơi `/play/[code]`.
  - Có nút quay lại sảnh chơi `/play` và nút `KidParentLockButton` để phụ huynh kiểm soát.

## 2. Thiết kế Kỹ thuật

### 2.1 Backend API & Service: `GET /api/users/play/competency/[code]`
- Xác thực `active_child` và kiểm tra quyền sở hữu của user.
- Xác định `age_band` từ năm sinh của trẻ.
- Kiểm tra mã `code` thuộc tập hợp hợp lệ `C1`..`C6` (nếu không hợp lệ ném 404).
- Lấy thông tin năng lực từ `COMPETENCY_CATALOG` (`@mindkid/shared/client`).
- Truy vấn DB:
  - Lấy danh sách các `game_levels` `published` tương ứng với competency, có `age_band` khớp với trẻ (hoặc `access_tier` hợp lệ).
  - Join với `skills` hoặc `competency_id` qua `content_skill_map` (hoặc tiền tố mã level).
  - Lấy kết quả sao tốt nhất `best_stars` và số lượt chơi `play_count` từ `play_sessions` của trẻ.
- Trả về cấu trúc `ChildCompetencyResponse` theo spec.

### 2.2 Frontend UI: `apps/web/app/pages/play/competency/[code].vue`
- `definePageMeta({ layout: "kid" })`.
- Kid Top Bar:
  - Nút mũi tên lớn quay về sảnh `/play`.
  - Mascot Gấu Con `KidMascot` và huy hiệu năng lực hiện tại (màu sắc theo token năng lực).
  - Lối ra an toàn qua `KidParentLockButton`.
- Lưới trò chơi cho trẻ:
  - Card trò chơi to bản $\ge 64$px claymorphism (`rounded-3xl border-4 shadow-[0_6px_0_...]`).
  - Thumbnail emoji kích thước lớn $\ge 48$px.
  - Số sao đạt được (1–3 sao vàng) hoặc ổ khoá trung tính (`🔒`) nếu chưa mở khoá gói.
  - Không có thanh tìm kiếm, không có dropdown lọc.
  - Bấm vào thẻ: điều hướng ngay tới `/play/[code]`.

### 2.3 Cập nhật sảnh chơi: `apps/web/app/pages/play/index.vue`
- Đổi liên kết 6 thẻ năng lực:
  - Từ `:to="'/games?competency=' + c.code"`
  - Thành `:to="'/play/competency/' + c.code"`
- Đảm bảo toàn bộ tương tác của trẻ được giữ trọn vẹn trong Kid Surface.

## 3. Thứ tự triển khai

1. **S1 — Spec & Registry**: Đăng ký `BR-CCE` vào `business-rules.md`, cập nhật `index.md` (Đã hoàn thành).
2. **S2 — Backend Service & API**:
   - Viết service `getChildCompetencyGames` và endpoint `apps/web/server/api/users/play/competency/[code].get.ts`.
   - Viết unit test cho service.
3. **S3 — Giao diện `/play/competency/[code].vue`**:
   - Tạo trang với layout `kid`, không hex color, touch targets $\ge 64$px.
   - Viết component test cho trang.
4. **S4 — Sửa liên kết tại sảnh `/play/index.vue`**:
   - Cập nhật router link trỏ tới `/play/competency/[code]`.
   - Cập nhật component test của sảnh chơi.
5. **S5 — Kiểm tra & Verification**:
   - Chạy `biome check`, `pnpm typecheck`, `bash scripts/check.sh --fast`.
   - Commit hoàn tất lên nhánh `main`.
