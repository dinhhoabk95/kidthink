---
spec: CHILD-THEME-MAP
title: Bản đồ chủ đề tuần cho trẻ tự học
area: play
status: implemented
mvp: false
phase: P4
reviewed: 2026-10-18
owns:
  - Bản đồ chủ đề tuần trên bề mặt trẻ (`/play/map`)
  - API lấy dữ liệu tiến trình bản đồ chủ đề tuần (`/api/users/play/theme-map`)
  - Quy tắc hiển thị trạm tuần, trạm màn chơi và chỉ vị trí mascot
depends_on:
  - PLAY-SESSION-LIFECYCLE
  - CURRICULUM-MODEL
  - CURRICULUM-PLAYER
  - STICKER-ALBUM
  - PARENT-GATE
---

# Bản đồ chủ đề tuần cho trẻ tự học

## 1. Objective

Trẻ mầm non 3–6 tuổi học theo chu kỳ tuần/tháng gắn với 10 chủ đề năm học GDMN Việt Nam.
Bên cạnh sảnh chơi `/play` và album sticker `/play/stickers`, trẻ cần một góc nhìn tổng thể
về hành trình học tập (bản đồ đảo/hành tinh màn chơi theo tuần).

Spec này định hình **Bản đồ chủ đề tuần** trên bề mặt trẻ (`/play/map`), kết nối trực tiếp
với lộ trình 36 tuần chuẩn của GDMN (`RM-*-year-01`, Task #272) và các màn chơi (`game_levels`).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động (cookie `active_child_id`) của user đã đăng nhập | Xem bản đồ tuần, biết vị trí hiện tại (Mascot Gấu Con), chạm trạm màn chơi để vào học |
| Người lớn | Cổng phụ huynh | Thoát khỏi bản đồ để trở về sảnh hoặc trang quản lý |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/play/map` | Trẻ | Bản đồ chủ đề tuần: các trạm tuần, đảo chủ đề, mascot định vị, hạt màn chơi |
| `GET /api/users/play/theme-map` | Trẻ | Dữ liệu các tuần, trạm màn chơi và tiến độ hoàn thành của trẻ |
| Nút bản đồ ở sảnh `/play` | Trẻ | Icon bản đồ dẫn sang `/play/map` |

## 4. Main flow

1. Trẻ bấm icon bản đồ ở sảnh `/play` (hoặc sau khi hoàn thành màn chơi) vào `/play/map`.
2. Trang `/play/map` gọi `GET /api/users/play/theme-map`.
3. Server xác định lộ trình tương ứng với tuổi của trẻ (hoặc curriculum đang ghi danh):
   - Mầm 3–4 tuổi: `RM-3-4-mam-year-01`
   - Chồi 4–5 tuổi: `RM-4-5-chi-year-01`
   - Lá 5–6 tuổi: `RM-5-6-la-year-01`
4. Server tổng hợp 36 tuần theo 10 chủ đề, đối chiếu với `play_sessions` của trẻ để suy ra trạng thái từng trạm màn chơi: `completed`, `in_progress`, `not_started`.
5. Mascot Gấu Con tự động đứng ở trạm màn chơi đầu tiên chưa hoàn thành (vị trí học tiếp theo).
6. Trẻ chạm vào trạm màn chơi → điều hướng trực tiếp sang `/play/[code]`.
7. Học xong quay lại, trạm màn chơi được cập nhật thành đã hoàn thành với dấu sao/tick vàng.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Trẻ chưa có màn chơi nào hoàn thành | Trẻ mới tạo hồ sơ | Gấu Con đứng ở Tuần 1, Trạm 1; toàn bộ trạm ở trạng thái mở sẵn sàng học |
| Trẻ đã hoàn thành cả 36 tuần | Mọi màn chơi đều `completed` | Gấu Con ở tư thế `celebrate` tại trạm cuối cùng; mở huy hiệu vinh danh |
| Thoát khỏi bản đồ | Trẻ chạm nút khoá | Nhấn giữ 1s mở cổng phụ huynh, xác minh đúng quay về sảnh `/play` hoặc trang chủ |
| Trẻ bấm vào màn chơi đã hoàn thành | Trạm có trạng thái `completed` | Vẫn mở được `/play/[code]` để trẻ ôn tập lại |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-WTM-01` | Lộ trình bản đồ mặc định bám theo tuổi của trẻ (`RM-3-4-mam-year-01`, `RM-4-5-chi-year-01`, `RM-5-6-la-year-01`). Nếu có enrollment `active`, dùng curriculum đó | Đảm bảo tính liên tục và sư phạm đúng lứa tuổi mầm non |
| `BR-WTM-02` | Trạng thái trạm màn chơi (`not_started`, `in_progress`, `completed`) suy từ `play_sessions` của chính trẻ | Dữ liệu xác thực từ server, client không tự báo trạng thái |
| `BR-WTM-03` | Vị trí trọng tâm (Mascot Gấu Con đứng) là trạm màn chơi chưa xong đầu tiên | Trẻ mầm non cần biết ngay "mình đang ở đâu và làm gì tiếp" mà không cần đọc chữ |
| `BR-WTM-04` | Bề mặt bản đồ tuân thủ Kid Surface: nền sáng, không dark mode, phím bấm ≥64px, affordance bằng icon/hình ảnh | `13-ui-ux.md` & `BR-ENG-10` — trẻ chưa biết đọc |
| `BR-WTM-05` | Thoát khỏi bản đồ chỉ qua cổng phụ huynh `KidParentLockButton` | `BR-PSZ-11`, `BR-PGT-01` — bảo vệ trẻ trong không gian chơi an toàn |
| `BR-WTM-06` | Bấm trạm màn chơi điều hướng tới `/play/[code]` | Tái sử dụng trọn vẹn luồng chơi màn chơi |
| `BR-WTM-07` | Bản đồ cuộn tự do, không khoá cứng màn hình ở tuần hiện tại | Cho phép trẻ xem lại thành tích các tuần trước hoặc tò mò nhìn các chủ đề sắp tới |
| `BR-WTM-08` | Mỗi tuần hiển thị tên chủ đề và tỉ lệ hoàn thành màn chơi trực quan | Giúp phụ huynh và trẻ nắm bắt được chủ đề học mầm non |

## 7. Data

Đọc, không ghi:

| Entity | Dùng cho |
|---|---|
| `child_profiles` | Trẻ đang hoạt động, năm sinh để suy `age_band` |
| `curriculum_enrollments` + `curricula` | Enrollment `active` thắng; nếu không có, chọn curriculum theo band tuổi (`BR-WTM-01`) |
| `curriculum_weeks`, `curriculum_items`, `game_levels` | 36 tuần và các trạm màn chơi |
| `play_sessions` | Trạng thái từng trạm (`BR-WTM-02`) |

Mã curriculum theo band tuổi trong code là `CUR-RM-3-4-mam-year-01`, `CUR-RM-4-5-chi-year-01`,
`CUR-RM-5-6-la-year-01` (curriculum dựng từ roadmap `RM-*-year-01`).

### 7.1 Response của `GET /api/users/play/theme-map`

```ts
interface ThemeMapWeek {
  week_no: number;
  theme_title: string;
  goal: string;
  is_current: boolean;
  is_completed: boolean;
  levels: Array<{
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
  current_level_code: string | null;
  total_levels: number;
  completed_levels: number;
  weeks: ThemeMapWeek[];
}
```

## 8. API contract

### `GET /api/users/play/theme-map`

| | |
|---|---|
| Auth | Phiên User (`defineApiRoute` `auth: "user"`) + trẻ đang hoạt động thuộc caller (`requireOwnedActiveChild`) |
| Request | Không có query, không có body |
| Response 200 | `ChildThemeMapResponse` (§7.1) |
| 401 | Chưa đăng nhập |
| 428 `NO_ACTIVE_CHILD` | Chưa chọn trẻ hoặc cookie `active_child_id` không trỏ tới trẻ của caller |

Server không ghi gì. Route không nhận tham số chọn lộ trình — lộ trình luôn do `BR-WTM-01` quyết.

## 9. Acceptance criteria

```gherkin
Scenario: BR-WTM-01 — lộ trình theo enrollment, rồi theo tuổi
  Given trẻ 4–5 tuổi không có enrollment active
  When gọi GET /api/users/play/theme-map
  Then roadmap_code là CUR-RM-4-5-chi-year-01
  Given trẻ có enrollment active vào một curriculum khác
  When gọi lại
  Then roadmap_code là mã curriculum của enrollment đó

Scenario: BR-WTM-02 — trạng thái trạm suy từ server
  Given trẻ có một play_sessions completed cho màn chơi GL-01
  When gọi GET /api/users/play/theme-map
  Then trạm GL-01 có status completed
  And client không gửi trạng thái nào lên

Scenario: BR-WTM-03 — mascot đứng ở trạm chưa xong đầu tiên
  Given hai trạm đầu completed, trạm thứ ba not_started
  When gọi GET /api/users/play/theme-map
  Then current_level_code là mã trạm thứ ba

Scenario: BR-WTM-04 — bề mặt trẻ
  When render /play/map
  Then trang dùng layout kid
  And không có dark mode

Scenario: BR-WTM-05 — thoát qua cổng phụ huynh
  When trẻ chạm nút khoá
  Then cổng phụ huynh hiện ra
  And chỉ xác minh đúng mới rời khỏi /play/map

Scenario: BR-WTM-06 — chạm trạm vào màn chơi
  When trẻ chạm trạm màn chơi có mã GL-01
  Then trình duyệt điều hướng tới /play/GL-01

Scenario: BR-WTM-07 — cuộn tự do
  Given tuần hiện tại là tuần 10
  When trẻ cuộn bản đồ về tuần 1 hoặc tới tuần 36
  Then bản đồ cuộn được, không bị khoá ở tuần 10

Scenario: BR-WTM-08 — tuần có tên chủ đề và tỉ lệ hoàn thành
  When render một tuần
  Then hiện tên chủ đề của tuần
  And hiện tỉ lệ màn chơi đã hoàn thành của tuần đó

Scenario: chưa chọn trẻ
  Given user đăng nhập chưa chọn trẻ
  When gọi GET /api/users/play/theme-map
  Then trả 428 NO_ACTIVE_CHILD
```

## 10. Boundaries

**Always**
- Suy trạng thái trạm từ `play_sessions` trên server.
- Dùng layout `kid`; thoát chỉ qua cổng phụ huynh.
- Kiểm trẻ thuộc caller ở mỗi request.

**Ask first**
- Đổi cách chọn lộ trình (`BR-WTM-01`).
- Thêm hành động khác ngoài "vào màn chơi" cho một trạm.

**Never**
- Tin trạng thái trạm do client gửi.
- Khoá cứng màn hình ở tuần hiện tại.
- Hiện giá tiền, gói, hay lời mời nâng cấp trên bản đồ.

## 11. Open questions

Không có.
