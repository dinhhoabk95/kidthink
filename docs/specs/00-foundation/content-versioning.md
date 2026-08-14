---
spec: CONTENT-VERSIONING
title: Phiên bản nội dung và neo lịch sử
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-07
owns:
  - Ngữ nghĩa content_version
  - Quy tắc ghim version trong play session
  - Quy tắc rollback
depends_on:
  - CONTENT-LIFECYCLE
  - ID-CONVENTIONS
---

# Phiên bản nội dung và neo lịch sử

## 1. Objective

Báo cáo học tập của một đứa trẻ phải giải thích được bằng **đúng nội dung nó đã chơi**,
không phải bản đã sửa ba tháng sau đó.

Không có versioning thì: sửa một game level từ 4 item thành 6 item làm mọi phiên chơi cũ
trở nên vô nghĩa — điểm 4/4 hôm qua đọc thành 4/6 hôm nay. Phụ huynh nhìn thấy con mình
"tệ đi" vì một quyết định biên tập.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Manager | Tạo version mới, publish, rollback |
| Hệ thống | Ghim `content_version` vào mọi `play_session` và `telemetry_event` |
| User / trẻ | Không thấy version — luôn nhận bản `published` mới nhất |

## 3. Entry points

| Nơi | Ghi chú |
|---|---|
| `06-admin/publish-and-version.md` | Tạo version, publish, rollback |
| `04-play/game-config-delivery.md` | Gắn `content_version` vào config trả về |
| `04-play/play-session-lifecycle.md` | Ghim version lúc mở phiên |
| [`basic-report.md`](../03-account/basic-report.md) · [`advanced-report.md`](../03-account/advanced-report.md) | Đọc theo version đã ghim |

## 4. Main flow — sửa một nội dung đã publish

1. Manager mở bản `published` version N, bấm "Tạo bản mới".
2. Hệ thống copy toàn bộ nội dung sang hàng mới `content_version = N+1`, `status = draft`.
   Bản N **không đổi**, vẫn `published`, vẫn đang phục vụ.
3. Manager sửa bản N+1, gửi duyệt, được duyệt.
4. Publish bản N+1 → trong **một transaction**: N+1 thành `published`, N thành `archived`.
5. Phiên chơi mới nhận N+1. Phiên chơi cũ và mọi báo cáo cũ vẫn trỏ N.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Rollback | `super_admin` publish lại bản `archived` version M; bản đang chạy chuyển `archived`. `content_version` **không** giảm — bản M vẫn là M |
| Phiên đang chơi khi version đổi | Phiên tiếp tục với config đã tải. Không ép reload — `BR-VER-04` |
| Đọc một version đã archived | Được, qua `?version=` ở API admin. Bề mặt người dùng không có tham số này |
| Sửa nội dung chưa từng publish | Sửa tại chỗ, không tạo version mới. Version chỉ có nghĩa sau lần publish đầu |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-VER-01` | `content_version` bắt đầu từ **1** ở lần publish đầu, **chỉ tăng**, không bao giờ giảm hay tái dùng | Version là mốc thời gian, không phải nhãn |
| `BR-VER-02` | Mỗi `code` có **đúng một** hàng `published` tại một thời điểm | Hai bản cùng published là hai bản cùng được phục vụ |
| `BR-VER-03` | `play_sessions` và `telemetry_events` **bắt buộc** ghi `content_version` | Không có nó thì báo cáo lịch sử không giải thích được |
| `BR-VER-04` | Phiên đang mở giữ config đã tải. Không ép reload khi version đổi | Đổi luật giữa lúc trẻ đang chơi là thiệt hại lớn hơn lợi ích của bản mới |
| `BR-VER-05` | Báo cáo tổng hợp qua nhiều version **phải nói rõ** khi nội dung đã đổi | So sánh điểm qua hai version khác nhau mà không cảnh báo là so sánh sai |
| `BR-VER-06` | Rollback **không** đảo `content_version`. Bản M được publish lại vẫn là M | Số version phải map 1-1 với một nội dung cụ thể, vĩnh viễn |
| `BR-VER-07` | Đổi **chỉ metadata không ảnh hưởng gameplay** (mô tả, tag, SEO) **không** tạo version mới | Bơm version cho mỗi lần sửa chính tả làm lịch sử vô dụng |
| `BR-VER-08` | Đổi bất kỳ field nào ở §7.2 **bắt buộc** tạo version mới | Đây là những field làm điểm cũ đọc sai |
| `BR-VER-09` | Bản `archived` **NEVER xoá cứng** khi còn telemetry trỏ tới | Xoá bản cũ làm mồ côi dữ liệu học tập |

## 7. Data

### 7.1 Hình dạng

Mỗi thực thể Lớp 2 có bảng chính + bảng version. Ví dụ `game_levels`:

| Bảng | Nội dung |
|---|---|
| `game_levels` | Một hàng mỗi **version**. `(code, content_version)` UNIQUE |
| — | `status`, `published_at`, `archived_at`, `created_by_manager_id` |

Truy vấn bản đang chạy: `WHERE code = ? AND status = 'published'` — luôn trả đúng 1 hàng
theo `BR-VER-02`, ép bằng partial unique index:

```sql
CREATE UNIQUE INDEX uq_game_levels_published
  ON game_levels (code) WHERE status = 'published';
```

Index này là nơi `BR-VER-02` thực sự được ép. Tầng service kiểm thêm để trả lỗi đẹp.

### 7.2 Field bắt buộc bump version

| Thực thể | Field |
|---|---|
| `game_levels` | `template_id` · `content_pack` · `difficulty_params` · `skill_ids` · `learning_objective_ids` · `age_min` · `age_max` · `difficulty` · `access_tier` |
| `lessons` | `activities[]` · `learning_objective_ids` · `target_age` · `access_tier` |
| `curricula` | `curriculum_items[]` · thứ tự · `access_tier` |

### 7.3 Field **không** bump version

`title` · `description` · `tags` · `thumbnail_emoji` · trường SEO · `is_featured`.

Ranh giới: **field nào tham gia vào việc chấm điểm hoặc chọn nội dung thì bump; field nào
chỉ để hiển thị thì không.**

### 7.4 Neo trong dữ liệu chơi

```
play_sessions.game_level_id         → FK hàng version cụ thể lúc chơi (D-AE)
play_sessions.content_version       → NOT NULL — giữ tường minh dù đã ngầm định trong id
play_sessions.template_id           → template lúc chơi (FK game_templates.id, D-AE)
telemetry_events.content_version    → NOT NULL
```

Ngoài dữ liệu chơi (ghim đúng version, không đổi theo published mới), tham chiếu **tới
nội dung khác cần luôn theo bản published mới nhất** (`curriculum_items`, `current_curriculum_id`)
dùng `entity_id` — neo dòng dõi bất biến qua version, xem mục 7 đầu mục của
[`schema-content-taxonomy.md`](../01-platform/schema-content-taxonomy.md) và quy tắc `BR-DM-13`
của [`data-model-overview.md`](../01-platform/data-model-overview.md). Cả hai loại đều là `id`,
không phải `code` (quyết định D-AE — dùng `entity_id` neo dòng dõi thay cho tham chiếu bằng
`code`, FK vẫn trỏ `id`).

## 8. API contract

### `POST /api/managers/content/{entity_type}/{code}/versions`

| | |
|---|---|
| Auth | `requireManagerAuth()` |
| Body | `{ from_version }` |
| 201 | `{ code, content_version, status: "draft" }` |
| 409 | `VERSION_ALREADY_DRAFTED` — đã có bản draft chưa publish |

### `GET /api/managers/content/{entity_type}/{code}/versions`

Trả lịch sử version kèm `content_review_log` mỗi bản.

### Bề mặt người dùng

**Không** có tham số `version`. `GET /api/users/levels/{code}` luôn trả bản `published`.
Response **có** kèm `content_version` để client ghim vào phiên.

| Mã lỗi | HTTP |
|---|---|
| `VERSION_ALREADY_DRAFTED` | 409 |
| `VERSION_NOT_FOUND` | 404 |
| `CANNOT_ROLLBACK_TO_CURRENT` | 409 |

## 9. Acceptance criteria

```gherkin
Scenario: BR-VER-02 — đúng một bản published mỗi code
  Given game level GL-C1-CNT-MATCH-0007 có version 1 published
  When manager publish version 2
  Then đúng một hàng có code GL-C1-CNT-MATCH-0007 và status published
  And đó là version 2
  And version 1 có status archived

Scenario: BR-VER-02 — index ép ở tầng DB
  Given game level GL-C1-CNT-MATCH-0007 version 1 đang published
  When chạy UPDATE trực tiếp đặt version 2 thành published mà không archive version 1
  Then transaction bị unique index từ chối

Scenario: BR-VER-03 — phiên chơi ghim version
  Given trẻ mở game level GL-C1-CNT-MATCH-0007 đang ở version 3
  When phiên chơi được tạo
  Then play_sessions.content_version = 3
  And mọi telemetry_event của phiên đó cũng mang content_version = 3

Scenario: BR-VER-04 — đổi version không ngắt phiên đang chơi
  Given trẻ đang chơi version 3 của một level
  When manager publish version 4 giữa chừng
  Then phiên đang chơi tiếp tục nhận event bình thường
  And kết quả phiên được ghi với content_version = 3

Scenario: BR-VER-01 — version chỉ tăng
  Given một level đã có version 1, 2, 3 và đang chạy version 3
  When manager rollback về version 2
  Then version 2 có status published
  And version 3 có status archived
  And không có hàng nào mang version 4

Scenario: BR-VER-07 — sửa mô tả không bump version
  Given một level đang published ở version 2
  When manager sửa description
  Then level vẫn ở version 2
  And status vẫn published

Scenario: BR-VER-08 — sửa content_pack bắt buộc bump
  Given một level đang published ở version 2
  When manager cố sửa content_pack trực tiếp
  Then hệ thống trả 409
  And gợi ý tạo version mới

Scenario: BR-VER-05 — báo cáo cảnh báo khi nội dung đã đổi
  Given một trẻ có phiên chơi ở version 1 và version 2 của cùng một level
  When hiển thị biểu đồ tiến bộ trên level đó
  Then UI hiện chỉ báo "nội dung đã thay đổi" tại mốc đổi version
```

## 10. Boundaries

**Always**
- Ghim `content_version` vào mọi `play_session` và `telemetry_event`.
- Ép "đúng một bản published" bằng partial unique index.
- Publish + archive trong một transaction.
- Cảnh báo trong báo cáo khi dữ liệu trải qua nhiều version.

**Ask first**
- Thêm field vào danh sách bump version §7.2.
- Đổi ngữ nghĩa rollback.
- Xoá cứng một bản `archived`.

**Never**
- Giảm hoặc tái dùng số version.
- Hai bản cùng `published` một `code`.
- Ép client reload giữa phiên khi version đổi.
- Cho bề mặt người dùng chọn version.
- Xoá bản `archived` còn telemetry trỏ tới.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Giữ bao nhiêu version cũ trước khi archive lạnh sang S3? Trên t3.small dung lượng là ràng buộc thật | Chi phí lưu trữ | Hoãn, chặn chi phí | hoãn |
| ~~2~~ | ~~Curriculum tham chiếu lesson theo `code` hay `(code, version)`~~ **Đóng 2026-08-06 (T11)**: **`code` only** — curriculum luôn dùng bản published mới nhất, không ghim version. **Sửa lại 2026-08-07 (D-AE, lần 2)**: kết luận **hành vi** (luôn theo published mới nhất) **không đổi**, nhưng cơ chế lưu trữ đổi — lần đầu (2026-08-07, D-AE lần 1) tôi chọn giữ `code` làm ngoại lệ cho FK, đó là **sai** (người dùng bác: "FK tất cả phải tham chiếu ID, không có ngoại lệ"). Cơ chế đúng: cột `entity_id` — **neo dòng dõi**, bất biến qua mọi version của một `code` (version đầu `entity_id = id`, version sau copy nguyên). Tham chiếu join `WHERE entity_id = ? AND status = 'published'` — vẫn tự động theo bản mới nhất, và **vẫn là `id`**, không phải `code`. FK trong [`schema-content-taxonomy.md`](../01-platform/schema-content-taxonomy.md) trỏ `entity_id`. Quan hệ cha-con (`lesson_activities`→`lessons`, `curriculum_items`→`curricula`) dùng `id` của đúng hàng version (không đổi) | — | Đã đóng | D-AE |
| 3 | Báo cáo nâng cao có nên loại trừ dữ liệu từ version quá cũ không? | [`advanced-report.md`](../03-account/advanced-report.md) | Hoãn, chặn phase P3 | hoãn |
