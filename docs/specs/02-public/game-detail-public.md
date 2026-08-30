---
spec: GAME-DETAIL-PUBLIC
title: Trang chi tiết trò chơi
area: public
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Trang chi tiết một game cho khách
depends_on:
  - GAME-CATALOG-PUBLIC
  - ACCESS-GATING
  - SEO-AND-STRUCTURED-DATA
---

# Trang chi tiết trò chơi

## 1. Objective

Một URL index được cho **mỗi** game, trả lời: game này dạy gì, hợp tuổi nào, chơi thế nào,
và tôi cần gì để chơi.

Với 120 game, đây là 120 trang đích SEO — kênh acquisition rẻ nhất.

## 2. Actors

Guest · User.

## 3. Entry points

`/games/{code}` · `GET /api/guest/levels/{code}`.

## 4. Main flow

1. Mở trang chi tiết.
2. Đọc: mô tả · năng lực và kỹ năng · band tuổi · độ khó · cơ chế chơi · thời lượng.
3. Game `free` → nút **"Chơi ngay"**. Game khoá → nút phù hợp (đăng nhập / nâng cấp).
4. Cuối trang: game liên quan cùng skill.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Game bị archive | **410 Gone** + gợi ý game thay thế, không 404 |
| Game khoá | Vẫn hiện đủ mô tả; nút CTA đổi theo bậc thiếu |
| User đã đăng nhập chưa chọn trẻ | Bấm chơi → màn hình chọn trẻ |
| Trẻ đang hoạt động ngoài band tuổi | Cảnh báo nhẹ cho **người lớn**, vẫn cho chơi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-GDP-01` | Mỗi game có **URL riêng, index được** | 120 trang đích SEO |
| `BR-GDP-02` | Mô tả đủ để hiểu game dạy gì **mà không tiết lộ đáp án** | Đảm bảo tính thử thách của trò chơi |
| `BR-GDP-03` | Game archived trả **410**, không 404 | 410 nói với công cụ tìm kiếm rằng nội dung đã bỏ hẳn |
| `BR-GDP-04` | Structured data `LearningResource` sinh từ dữ liệu | `BR-SEO-06` |
| `BR-GDP-05` | Cấm — **NEVER trả `content_pack`** khi khoá | Bảo vệ quyền truy cập nội dung trả phí theo ranh giới `BR-LAD-04` |
| `BR-GDP-06` | CTA đổi theo **bậc còn thiếu**, không một CTA chung | "Đăng nhập" và "Nâng cấp Premium" là hai hành động khác nhau |
| `BR-GDP-07` | Liên kết tới trang skill và competency | Nội bộ link giúp index |
| `BR-GDP-08` | Cấm — **NEVER hứa hẹn kết quả học tập** | `BR-LND-06` |
| `BR-GDP-09` | Từ vựng CTA là **tập đóng năm hành động** ở mục 7.4. Thêm hành động mới phải sửa spec này trước | Ba bề mặt cùng dựng nút này — trang chi tiết, danh mục, và màn hình lỗi của `/play/{code}`. Không chốt tập đóng thì mỗi bề mặt tự đặt một nhãn, và người dùng thấy ba câu chữ khác nhau cho cùng một rào chắn |

## 7. Data

### 7.1 Nội dung trang

| Phần | Nguồn |
|---|---|
| Tiêu đề, mô tả | `game_levels` |
| Emoji minh hoạ | `thumbnail_emoji` |
| Năng lực · kỹ năng · mục tiêu học | `content_skill_map` + taxonomy |
| Band tuổi · độ khó · thời lượng ước tính | |
| Cơ chế chơi | Từ template, mô tả bằng lời cho người lớn |
| Trạng thái truy cập | Từ `allowedTiers()` |
| Game liên quan | Cùng skill, tối đa 6 |

### 7.2 Structured data

`LearningResource` — `name` · `description` · `educationalLevel` (band tuổi) ·
`teaches` (learning objective) · `learningResourceType` · `isAccessibleForFree` ·
+ `BreadcrumbList`.

### 7.3 URL

`/games/{code}` với `code` là mã bất biến. Đổi tiêu đề không đổi URL —
mã bất biến là lý do URL bền.

### 7.4 Từ vựng CTA — tập đóng, `BR-GDP-09`

| `action` | Nhãn | Đích | Khi nào |
|---|---|---|---|
| `play` | "Cho bé chơi ngay" | `/play/{code}` | Bậc nằm trong `allowedTiers` của người gọi |
| `login` | "Đăng nhập để chơi" | `/login?redirect=/play/{code}` | Chưa đăng nhập, bậc là `login` |
| `select_child` | "Chọn hồ sơ bé" | `/me/children?redirect=/play/{code}` | Đã đăng nhập, **có** entitlement đủ cho bậc này, chỉ thiếu `active_child_id` |
| `upgrade_standard` | "Nâng cấp Gói Tiêu chuẩn" | `/pricing` | Thiếu `play_standard_games` |
| `upgrade_premium` | "Nâng cấp Gói Premium" | `/pricing` | Thiếu `play_premium_games` |

Thứ tự quyết định: `play` trước; nếu chưa đăng nhập thì `login` cho bậc `login` và hành
động nâng cấp cho hai bậc trả phí; nếu đã đăng nhập thì `select_child` **chỉ khi** entitlement
đã đủ, ngoài ra là hành động nâng cấp. Thiếu **cả** hồ sơ bé lẫn gói thì hiện hành động nâng
cấp, vì mua gói là rào chắn thật — chọn bé xong vẫn bị chặn. Xem mục 6 của
[`access-gating.md`](../04-play/access-gating.md), rule `BR-GAT-09`, về việc CTA tách khỏi mã HTTP.

Đây là bề mặt **người lớn**. Bề mặt trẻ dưới `/play` Cấm — NEVER hiện hành động nâng cấp,
theo `BR-PEN-04` mục 6 của [`play-entry-and-profile-select.md`](../04-play/play-entry-and-profile-select.md).


## 8. API contract

### `GET /api/guest/levels/{code}`

| | |
|---|---|
| Auth | không bắt buộc; có session thì `locked` và `cta` tính theo người gọi |
| 200 | Metadata đầy đủ + `locked` + `required_entitlement` + `cta` |
| 410 | Game archived, kèm `alternatives[]` |
| 404 | Không tồn tại |

`cta` là `{ action, text, href }` với `action` thuộc tập đóng mục 7.4.

## 9. Acceptance criteria

```gherkin
Scenario: BR-GDP-01 — mỗi game có URL index được
  When crawl sitemap
  Then mỗi game published có một URL riêng
  And URL trả 200 với nội dung đầy đủ khi tắt JS

Scenario: BR-GDP-03 — game archived trả 410
  Given một game đã archive
  When mở URL của nó
  Then trả 410
  And trang gợi ý game thay thế

Scenario: BR-GDP-05 — không rò nội dung khi khoá
  Given guest mở một game premium
  When đọc response
  Then không có content_pack

Scenario: BR-GDP-06 — CTA theo bậc thiếu
  Given guest mở game tier login
  Then CTA là đăng nhập
  Given user standard mở game premium
  Then CTA là nâng cấp Premium

Scenario: BR-GDP-09 — thiếu hồ sơ bé nhưng đủ gói
  Given user standard chưa chọn hồ sơ bé
  When mở game tier standard
  Then cta.action là select_child
  And cta.href là /me/children?redirect=/play/{code}

Scenario: BR-GDP-09 — thiếu cả hồ sơ bé lẫn gói
  Given user chưa mua gói nào và chưa chọn hồ sơ bé
  When mở game tier standard
  Then cta.action là upgrade_standard
  And cta.href là /pricing

Scenario: BR-GDP-09 — action nằm ngoài tập đóng thì không hợp lệ
  When đọc cta.action của mọi response chi tiết game
  Then giá trị thuộc tập play, login, select_child, upgrade_standard, upgrade_premium

Scenario: BR-GDP-04 — structured data đúng
  When kiểm JSON-LD của trang
  Then có LearningResource với teaches khớp learning objective thật

Scenario: BR-GDP-02 — không lộ đáp án
  When đọc mô tả game
  Then không có đáp án cụ thể của bất kỳ round nào

Scenario: URL bền khi đổi tiêu đề
  Given game đổi title và publish version mới
  Then URL không đổi
```

## 10. Boundaries

**Always**
- URL theo mã bất biến.
- Structured data sinh từ dữ liệu.
- CTA theo bậc còn thiếu.
- CTA lấy từ tập đóng năm hành động mục 7.4.
- 410 cho game archived.

**Ask first**
- Đổi cấu trúc URL.
- Thêm phần vào trang.
- Thêm hành động CTA thứ sáu.

**Never**
- Trả `content_pack` khi khoá.
- Lộ đáp án trong mô tả.
- 404 cho game đã từng tồn tại.
- Hứa hẹn kết quả học tập.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Có nên có ảnh chụp màn hình game không?~~ **Đóng 2026-08-09 (T13, `D-CV`)**: P1 dùng 3 ảnh xem trước tĩnh (static preview) do Designer cung cấp; P2 mới tự động chụp | Media hiển thị trang chi tiết | Đã đóng | D-CV |

