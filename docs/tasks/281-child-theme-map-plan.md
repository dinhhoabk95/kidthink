# Task #281 Plan: Bản đồ chủ đề tuần cho trẻ tự học — Weekly Theme Learning Map

Todo: [`281-child-theme-map-todo.md`](281-child-theme-map-todo.md).
Spec: [`child-theme-map.md`](../specs/04-play/child-theme-map.md) `BR-WTM-01..08`.

## 1. Mục tiêu & Bối cảnh

- Trẻ mầm non học theo 10 chủ đề của GDMN (Task #272, `RM-*-year-01`).
- Task #280 đã hoàn thiện luồng tự học một bài (`/play/lesson/[code]`), Task #282 đã có album sticker (`/play/stickers`).
- Hiện tại sảnh `/play` mới chỉ có danh sách bài gợi ý nằm ngang (`KidLessonRow`). Trẻ thiếu một "bản đồ phiêu lưu" trực quan (hành trình các tuần qua các hòn đảo chủ đề: Trường mầm non, Bản thân, Gia đình, Nghề nghiệp, Thế giới động vật...).
- Task #281 xây dựng bản đồ chủ đề tuần trực quan trên bề mặt trẻ (`/play/map`), nối trực tiếp với sảnh chơi `/play` và luồng bài học `/play/lesson/[code]`.

## 2. Thiết kế Kỹ thuật

### 2.1 Backend API: `GET /api/users/play/theme-map`
- Xác định `active_child` từ session.
- Lấy lộ trình 36 tuần theo `age_band` của trẻ (`RM-3-4-mam-year-01`, `RM-4-5-chi-year-01`, `RM-5-6-la-year-01` từ `@mindkid/content/roadmaps`).
- Truy vấn DB:
  - Lấy danh sách bài học `lessons` ứng với các kỹ năng trong lộ trình.
  - Lấy các bản ghi `child_lesson_plays` của trẻ để tính trạng thái từng trạm bài học: `completed`, `in_progress`, `not_started`.
- Xác định vị trí trọng tâm: trạm bài học đầu tiên chưa hoàn thành (Mascot Gấu Con đứng định vị).
- Trả về cấu trúc `ChildThemeMapResponse`.

### 2.2 Frontend UI: Trang `/play/map`
- Layout: `kid` (light-only, không header/footer người lớn).
- Header:
  - Nút khoá phụ huynh `KidParentLockButton` ở góc trái (thoát về sảnh `/play`).
  - Mascot Gấu Con `KidMascot` và thanh tóm tắt tiến độ (số sao/sticker hoặc số bài hoàn thành).
- Nội dung Bản đồ:
  - Con đường uốn lượn (winding trail) kết nối các trạm tuần và chủ đề.
  - Mỗi tuần là một "đảo/trạm chủ đề" sinh động với icon/emoji đại diện (Trường học 🏫, Bản thân 👦, Gia đình 🏡, Động vật 🐘, Thực vật 🌻...).
  - Các trạm bài học con trong tuần: tròn, đường kính ≥64px (`min-h-16 min-w-16`), hiển thị trạng thái (tick vàng hoàn thành, nút play đang học, hoặc khóa nhẹ).
  - Mascot Gấu Con đứng ngay cạnh bài học hiện tại cần học.
  - Bấm vào trạm bài học: chuyển hướng sang `/play/lesson/[code]`.

### 2.3 Kết nối Sảnh Chơi: `apps/web/app/pages/play/index.vue`
- Thêm nút icon Bản đồ trên Kid Top Bar (kế bên icon Sticker Album):
  - Kích thước ≥64px (`min-h-16 min-w-16`), icon `i-lucide-map`, aria-label="Bản đồ học tập của bé".
  - Chuyển hướng tới `/play/map`.

## 3. Thứ tự triển khai

1. **S1 — Spec & Registry**: Cập nhật `docs/specs/index.md` và `docs/specs/00-foundation/business-rules.md`.
2. **S2 — Backend Service & API**: Tạo `apps/web/server/api/users/play/theme-map.get.ts`, tích hợp dữ liệu lộ trình và tiến trình trẻ.
3. **S3 — Frontend Map Page**: Tạo trang `apps/web/app/pages/play/map.vue`, tuân thủ triệt để Rule 13 (không hex, layout kid, affordance chuẩn).
4. **S4 — Sảnh Chơi & Điều Hướng**: Bổ sung nút Bản đồ tại `apps/web/app/pages/play/index.vue`, sửa lỗi hex ở `lesson-row.vue`.
5. **S5 — Kiểm tra & Xác minh**: Chạy `scripts/check.sh --fast` và kiểm tra toàn bộ gates xanh sạch.
