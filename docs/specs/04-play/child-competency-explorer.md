---
spec: CHILD-COMPETENCY-EXPLORER
title: Khám phá trò chơi theo năng lực cho trẻ
area: play
status: approved
mvp: false
phase: P4
reviewed: 2026-10-18
open_tasks:
  - "#294"
owns:
  - Bề mặt khám phá trò chơi theo năng lực cho trẻ (`/play/competency/[code]`)
  - API lấy danh mục trò chơi theo năng lực cho trẻ (`/api/users/play/competency/[code]`)
  - Quy tắc điều hướng thẻ năng lực từ sảnh chơi `/play`
depends_on:
  - PLAY-ENTRY-AND-PROFILE-SELECT
  - ACCESS-GATING
  - PARENT-GATE
  - COMPETENCY-CATALOG
---

# Khám phá trò chơi theo năng lực cho trẻ

> **Chưa hoàn thành** — `BR-CCE-08` chưa có: trang chưa đổi màu theo năng lực và mascot chưa đọc to lời giới thiệu. Main flow bước 4 chưa đúng: `is_locked` tính cứng theo `access_tier === "premium"`, chưa đọc entitlement của gia đình. Việc còn lại: [Task #294](../../tasks/294-play-surface-gaps-plan.md).

## 1. Objective

Trẻ mầm non 3–6 tuổi khi ở sảnh chơi `/play` có thể tự do khám phá thế giới trò chơi theo 6 nhóm năng lực tư duy nền tảng (C1: Số & Lượng, C2: Không gian & Hình học, C3: Logic & Quy luật, C4: Đo lường & So sánh, C5: Phân loại & Dữ liệu, C6: Tập trung & Trí nhớ).

Thẻ năng lực tại `/play` Cấm dẫn tới `/games` — trang của người lớn có thanh điều hướng công khai, ô tìm kiếm từ khoá và bộ lọc chữ, trái `BR-PSZ-11` và `BR-PEN-03`.

Spec này xác lập **Bề mặt khám phá trò chơi theo năng lực** (`/play/competency/[code]`) hoàn toàn trên Kid Surface (layout `kid`), mang lại trải nghiệm duyệt game an toàn, trực quan, không chữ số phức tạp và có thể chơi ngay.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động (cookie `active_child_id`) của user đã đăng nhập | Chọn năng lực từ sảnh, duyệt các trò chơi trực quan theo độ tuổi của mình, chạm để vào chơi ngay |
| Người lớn | Cổng phụ huynh | Thoát khỏi bề mặt trẻ để về trang quản lý của gia đình |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/play/competency/[code]` | Trẻ | Bề mặt Kid Surface hiển thị danh sách game theo năng lực `code` (C1..C6) |
| `GET /api/users/play/competency/[code]` | Trẻ | API trả về danh sách trò chơi đã lọc theo `age_band` của trẻ và quyền truy cập |
| Thẻ năng lực ở sảnh `/play` | Trẻ | Bấm thẻ năng lực dẫn sang `/play/competency/[code]` |

## 4. Main flow

1. Trẻ ở sảnh `/play`, bấm vào 1 trong 6 thẻ năng lực (ví dụ: `C1: Số & Lượng`).
2. Trình duyệt điều hướng tới `/play/competency/C1`.
3. Trang gọi `GET /api/users/play/competency/C1`.
4. Server xác định `active_child_id`, lấy `age_band` (ví dụ: `4-5`) và entitlement của gia đình.
5. Server truy vấn các `game_levels` `published` thuộc competency `C1`, đúng `age_band` của trẻ, kèm trạng thái sao/hoàn thành từ `play_sessions`.
6. Client hiển thị lưới các ô trò chơi trực quan (hình đại diện, emoji, số sao đạt được nếu đã chơi).
7. Trẻ chạm vào một trò chơi → điều hướng thẳng tới `/play/[code]` để bắt đầu chơi.
8. Hoàn thành trò chơi, trẻ có thể quay lại danh mục năng lực hoặc trở về sảnh `/play`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Trò chơi thuộc gói cao hơn | Trẻ chưa có entitlement | Thẻ trò chơi hiển thị biểu tượng ổ khoá trung tính (`🔒`); chạm vào rung nhẹ phản hồi, không mở trang thanh toán (`BR-PEN-04`, `BR-PEN-06`) |
| Quay về sảnh `/play` | Trẻ chạm nút quay lại | Nút mũi tên lớn (≥64px) đưa trẻ quay về sảnh `/play` an toàn |
| Thoát ra giao diện người lớn | Trẻ/phụ huynh chạm nút khoá | Nhấn giữ `KidParentLockButton` 800ms mở cổng phụ huynh để thoát ra ngoài `/` |
| Mã năng lực không hợp lệ | URL không thuộc C1..C6 | Trả về 404 hoặc chuyển hướng an toàn về sảnh `/play` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CCE-01` | Trang `/play/competency/[code]` bắt buộc dùng layout `kid`, không có navbar/footer công khai của người lớn | `BR-PSZ-11` — giữ trẻ trong không gian chơi an toàn, không có liên kết ra ngoài |
| `BR-CCE-02` | Trò chơi hiển thị phải khớp chính xác với `age_band` của trẻ (`active_child_id`), loại bỏ các trò chơi ngoài độ tuổi | Đảm bảo tính sư phạm phù hợp năng lực phát triển của trẻ mầm non |
| `BR-CCE-03` | Thẻ trò chơi chuẩn Kid Surface: kích thước tối thiểu 64×64px, phong cách claymorphism, tương tác rõ ràng | `13-ui-ux.md` & `BR-ENG-10` — tối ưu cho ngón tay trẻ mầm non chạm trên tablet/mobile |
| `BR-CCE-04` | Tuyệt đối không hiển thị giá tiền, tên gói mua, hay thông điệp tiếp thị thương mại trên bề mặt này | `BR-PEN-04`, `BR-CDC-12` — tuân thủ bảo vệ trẻ em |
| `BR-CCE-05` | Cấm ô tìm kiếm chữ và dropdown lọc phức tạp; phân loại duy nhất là theo năng lực và các chủ đề trực quan | `BR-PEN-03` — trẻ mầm non chưa biết đọc chữ |
| `BR-CCE-06` | Thẻ năng lực tại sảnh `/play/index.vue` phải liên kết tới `/play/competency/[code]`, không dẫn ra `/games` | Khắc phục lỗ hổng thoát khỏi Kid Surface của sảnh chơi |
| `BR-CCE-07` | Hiển thị thành tích sao (1–3 sao) trực quan nếu trẻ đã từng hoàn thành level | Khuyến khích động lực học tập và ôn luyện lại |
| `BR-CCE-08` | Mỗi danh mục năng lực có màu sắc chủ đạo, linh vật Mascot Gấu Con chào đón và đọc to lời giới thiệu | Mang lại không khí vui tươi, thân thiện với trẻ em |

## 7. Data

Đọc, không ghi:

| Entity | Dùng cho |
|---|---|
| `child_profiles` | Trẻ đang hoạt động, năm sinh để suy `age_band` |
| `COMPETENCY_CATALOG` (`@mindkid/shared`) | Kiểm `code` thuộc `C1`…`C6`, tên và tagline năng lực |
| `game_levels` | Level `published`, mã `GL-<code>-*`, khoảng tuổi giao với `age_band` (`BR-CCE-02`) |
| `play_sessions` | `best_stars` và `play_count` của chính trẻ (`BR-CCE-07`) |

### 7.1 Response

```ts
interface CompetencyGameItem {
  code: string;
  title: string;
  thumbnail_emoji: string;
  theme_id: string;
  access_tier: "free" | "login" | "standard" | "premium";
  is_locked: boolean;
  best_stars: number; // 0 nếu chưa chơi, 1..3 nếu đã hoàn thành
  play_count: number;
}

interface ChildCompetencyResponse {
  competency: {
    code: string;
    name: string;
    tagline: string;
    icon_path: string;
  };
  child: {
    uuid: string;
    display_name: string;
    age_band: string;
  };
  games: CompetencyGameItem[];
}
```

## 8. API contract

### `GET /api/users/play/competency/{code}`

| | |
|---|---|
| Auth | Phiên User (`defineApiRoute` `auth: "user"`) + trẻ đang hoạt động thuộc caller (`requireOwnedActiveChild`) |
| Param | `code` — mã năng lực `C1`…`C6`, không phân biệt hoa thường |
| Response 200 | `ChildCompetencyResponse` (§7.1) |
| 401 | Chưa đăng nhập |
| 404 `NOT_FOUND` | `code` không thuộc `C1`…`C6` |
| 428 `NO_ACTIVE_CHILD` | Chưa chọn trẻ hoặc cookie `active_child_id` không trỏ tới trẻ của caller |

## 9. Acceptance criteria

```gherkin
Scenario: BR-CCE-01 — layout kid
  When render /play/competency/C1
  Then trang dùng layout kid
  And không có navbar hay footer công khai

Scenario: BR-CCE-02 — chỉ trò chơi hợp tuổi
  Given trẻ 4–5 tuổi
  And có một level C1 published chỉ dành cho 5–6 tuổi
  When gọi GET /api/users/play/competency/C1
  Then level đó không có trong games

Scenario: BR-CCE-04 — trò chơi khoá hiện trung tính
  Given một level C1 mà trẻ chưa có quyền
  When render /play/competency/C1
  Then thẻ level hiện ổ khoá
  And không có số tiền hay tên gói nào trên trang

Scenario: BR-CCE-05 — không có ô tìm kiếm hay bộ lọc chữ
  When render /play/competency/C1
  Then không có input tìm kiếm
  And không có dropdown bộ lọc

Scenario: BR-CCE-06 — thẻ năng lực ở sảnh dẫn vào bề mặt trẻ
  When render sảnh /play
  Then mọi thẻ năng lực trỏ tới /play/competency/{code}
  And không thẻ nào trỏ tới /games

Scenario: BR-CCE-07 — sao của level đã chơi
  Given trẻ đã hoàn thành một level C1 với 2 sao
  When gọi GET /api/users/play/competency/C1
  Then level đó có best_stars bằng 2

Scenario: BR-CCE-08 — màu và lời chào theo năng lực
  When trẻ mở /play/competency/C2
  Then trang dùng màu chủ đạo của C2
  And mascot đọc to lời giới thiệu của C2

Scenario: mã năng lực không hợp lệ
  When gọi GET /api/users/play/competency/C9
  Then trả 404
```

## 10. Boundaries

**Always**
- Dùng layout `kid`; thoát chỉ qua cổng phụ huynh.
- Kiểm trẻ thuộc caller ở mỗi request.
- Lọc level theo `published` và tuổi của trẻ trên server.

**Ask first**
- Thêm cách phân loại khác ngoài năng lực.
- Đổi luật lọc theo tuổi (`BR-CCE-02`) — xem Open question 1.

**Never**
- Hiện giá tiền, tên gói, hay lời mời nâng cấp.
- Ô tìm kiếm chữ hoặc dropdown lọc.
- Link từ bề mặt này ra trang công khai của người lớn.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | `BR-CCE-02` loại bỏ trò chơi ngoài `age_band`, trong khi [`child-lesson-flow.md`](child-lesson-flow.md) `BR-CLF-07` và [`access-gating.md`](access-gating.md) chỉ dùng tuổi để xếp hạng / cảnh báo, không chặn. Bên nào đúng? | Luật lọc tuổi trên bề mặt trẻ | P4 | người quyết |
