---
spec: CHILD-THEME-MAP
title: Bản đồ chủ đề tuần cho trẻ tự học
area: play
status: approved
mvp: false
phase: P4
reviewed: 2026-10-10
owns:
  - Bản đồ chủ đề tuần trên bề mặt trẻ (`/play/map`)
  - API lấy dữ liệu tiến trình bản đồ chủ đề tuần (`/api/users/play/theme-map`)
  - Quy tắc hiển thị trạm tuần, trạm bài học và chỉ vị trí mascot
depends_on:
  - CHILD-LESSON-FLOW
  - CURRICULUM-MODEL
  - CURRICULUM-PLAYER
  - STICKER-ALBUM
  - PARENT-GATE
---

# Bản đồ chủ đề tuần cho trẻ tự học

## 1. Objective

Trẻ mầm non 3–6 tuổi học theo chu kỳ tuần/tháng gắn với 10 chủ đề năm học GDMN Việt Nam.
Hiện tại trẻ có sảnh chơi `/play` (Task #280) và album sticker `/play/stickers` (Task #282),
nhưng chưa có góc nhìn tổng thể về hành trình học tập (bản đồ đảo/hành tinh bài học theo tuần).

Spec này định hình **Bản đồ chủ đề tuần** trên bề mặt trẻ (`/play/map`), kết nối trực tiếp
với lộ trình 36 tuần chuẩn của GDMN (`RM-*-year-01`, Task #272) và khuôn học bài tự động
(`child-lesson-flow.md`, Task #280).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động (cookie `active_child_id`) của user đã đăng nhập | Xem bản đồ tuần, biết vị trí hiện tại (Mascot Gấu Con), chạm trạm bài để vào học |
| Người lớn | Cổng phụ huynh | Thoát khỏi bản đồ để trở về sảnh hoặc trang quản lý |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/play/map` | Trẻ | Bản đồ chủ đề tuần: các trạm tuần, đảo chủ đề, mascot định vị, hạt bài học |
| `GET /api/users/play/theme-map` | Trẻ | Dữ liệu các tuần, trạm bài học và tiến độ hoàn thành của trẻ |
| Nút bản đồ ở sảnh `/play` | Trẻ | Icon bản đồ dẫn sang `/play/map` |

## 4. Main flow

1. Trẻ bấm icon bản đồ ở sảnh `/play` (hoặc sau khi hoàn thành bài học) vào `/play/map`.
2. Trang `/play/map` gọi `GET /api/users/play/theme-map`.
3. Server xác định lộ trình tương ứng với tuổi của trẻ (hoặc curriculum đang ghi danh):
   - Mầm 3–4 tuổi: `RM-3-4-mam-year-01`
   - Chồi 4–5 tuổi: `RM-4-5-chi-year-01`
   - Lá 5–6 tuổi: `RM-5-6-la-year-01`
4. Server tổng hợp 36 tuần theo 10 chủ đề, đối chiếu với `child_lesson_plays` của trẻ để suy ra trạng thái từng trạm bài: `completed`, `in_progress`, `not_started`.
5. Mascot Gấu Con tự động đứng ở trạm bài đầu tiên chưa hoàn thành (vị trí học tiếp theo).
6. Trẻ chạm vào trạm bài học → điều hướng trực tiếp sang `/play/lesson/[code]`.
7. Học xong quay lại, trạm bài được cập nhật thành đã hoàn thành với dấu sao/tick vàng.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Trẻ chưa có bài nào học | Trẻ mới tạo hồ sơ | Gấu Con đứng ở Tuần 1, Trạm 1; toàn bộ trạm ở trạng thái mở sẵn sàng học |
| Trẻ đã hoàn thành cả 36 tuần | Mọi bài học đều `completed` | Gấu Con ở tư thế `celebrate` tại trạm cuối cùng; mở huy hiệu vinh danh |
| Thoát khỏi bản đồ | Trẻ chạm nút khoá | Nhấn giữ 1s mở cổng phụ huynh, xác minh đúng quay về sảnh `/play` hoặc trang chủ |
| Trẻ bấm vào bài đã hoàn thành | Trạm có trạng thái `completed` | Vẫn mở được `/play/lesson/[code]` để trẻ ôn tập lại |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-WTM-01` | Lộ trình bản đồ mặc định bám theo tuổi của trẻ (`RM-3-4-mam-year-01`, `RM-4-5-chi-year-01`, `RM-5-6-la-year-01`). Nếu có enrollment `active`, dùng curriculum đó | Đảm bảo tính liên tục và sư phạm đúng lứa tuổi mầm non |
| `BR-WTM-02` | Trạng thái trạm bài (`not_started`, `in_progress`, `completed`) suy từ `child_lesson_plays` của chính trẻ | Dữ liệu xác thực từ server, client không tự báo trạng thái |
| `BR-WTM-03` | Vị trí trọng tâm (Mascot Gấu Con đứng) là trạm bài chưa xong đầu tiên | Trẻ mầm non cần biết ngay "mình đang ở đâu và làm gì tiếp" mà không cần đọc chữ |
| `BR-WTM-04` | Bề mặt bản đồ tuân thủ Kid Surface: nền sáng, không dark mode, phím bấm ≥64px, affordance bằng icon/hình ảnh | `13-ui-ux.md` & `BR-ENG-10` — trẻ chưa biết đọc |
| `BR-WTM-05` | Thoát khỏi bản đồ chỉ qua cổng phụ huynh `KidParentLockButton` | `BR-PSZ-11`, `BR-CLF-05`, `BR-PGT-01` — bảo vệ trẻ trong không gian chơi an toàn |
| `BR-WTM-06` | Bấm trạm bài điều hướng tới `/play/lesson/[code]` | Tái sử dụng trọn vẹn luồng học bài Task #280 |
| `BR-WTM-07` | Bản đồ cuộn tự do, không khoá cứng màn hình ở tuần hiện tại | Cho phép trẻ xem lại thành tích các tuần trước hoặc tò mò nhìn các chủ đề sắp tới |
| `BR-WTM-08` | Mỗi tuần hiển thị tên chủ đề và tỉ lệ hoàn thành bài học trực quan | Giúp phụ huynh và trẻ nắm bắt được chủ đề học mầm non |

## 7. Data

### 7.1 Response của `GET /api/users/play/theme-map`

```ts
interface ThemeMapWeek {
  week_no: number;
  theme_title: string;
  goal: string;
  is_current: boolean;
  is_completed: boolean;
  lessons: Array<{
    code: string;
    title: string;
    thumbnail_emoji: string;
    status: "not_started" | "in_progress" | "completed";
    is_current: boolean;
  }>;
}

interface ChildThemeMapResponse {
  child: {
    uuid: string;
    display_name: string;
    age_band: string;
  };
  roadmap_code: string;
  roadmap_title: string;
  current_week_no: number;
  current_lesson_code: string | null;
  total_lessons: number;
  completed_lessons: number;
  weeks: ThemeMapWeek[];
}
```
