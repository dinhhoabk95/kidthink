---
spec: GAME-CATALOG-PUBLIC
title: Danh mục trò chơi công khai
area: public
status: approved
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Trang duyệt game cho khách chưa đăng nhập
depends_on:
  - CONTENT-SEARCH
  - ACCESS-GATING
  - SEO-AND-STRUCTURED-DATA
---

# Danh mục trò chơi công khai

## 1. Objective

Cho phụ huynh **thấy được toàn bộ thư viện** trước khi trả tiền, và cho công cụ tìm kiếm
index được từng game.

Ẩn thư viện đằng sau paywall làm mất cả kênh SEO lẫn lý do nâng cấp. Hiện metadata, giấu
nội dung — đó là ranh giới.

## 2. Actors

Guest. User đã đăng nhập thấy cùng trang nhưng có ngữ cảnh quyền.

## 3. Entry points

`/tro-choi` · `/tro-choi?competency=C1&age=4` · `GET /api/guest/levels`.

## 4. Main flow

1. Duyệt lưới game với bộ lọc §7.1.
2. Mỗi thẻ hiện: tiêu đề · emoji · competency · band tuổi · độ khó · **trạng thái khoá**.
3. Game `free` → chơi ngay. Game khoá → trang chi tiết + mời đăng ký/nâng cấp.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Lọc không ra kết quả | Gợi ý nới bộ lọc nào |
| Guest bấm game khoá | Trang chi tiết + CTA, không phải lỗi 403 trần trụi |
| User đã đăng nhập | Thẻ hiện đúng trạng thái theo quyền của họ |
| Nhiều bộ lọc | Phản ánh vào URL để chia sẻ và index được |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-GCP-01` | Hiện **metadata** mọi game, kể cả game khoá | Thấy thứ mình bỏ lỡ mới có lý do nâng cấp |
| `BR-GCP-02` | Cấm — **NEVER trả `content_pack`** cho game khoá | `BR-LAD-04` |
| `BR-GCP-03` | Bộ lọc phản ánh vào **URL** | Chia sẻ được và index được |
| `BR-GCP-04` | Trang prerender/ISR, không phụ thuộc JS để hiện danh sách | SEO |
| `BR-GCP-05` | Trạng thái khoá hiện **trung tính**, không hù doạ | Đây là bề mặt người lớn nhưng trẻ có thể ngồi cạnh |
| `BR-GCP-06` | Chỉ hiện game `published` | Bảo vệ nội dung đang trong bản nháp hoặc thử nghiệm khỏi khách công khai |
| `BR-GCP-07` | Mỗi game có URL riêng có thể index | [`game-detail-public.md`](game-detail-public.md) |
| `BR-GCP-08` | Trần phân trang **60** | Tránh quá tải bộ nhớ client và tối ưu thời gian tải trang ban đầu |

## 7. Data

### 7.1 Bộ lọc hiển thị

Độ tuổi (3/4/5/6) · Năng lực (C1–C6) · Kỹ năng · Độ khó (1–5) · Cơ chế chơi ·
Miễn phí / trả phí · Chủ đề.

Bộ lọc rút gọn so với [`content-search.md`](../01-platform/content-search.md) — bề mặt công khai không cần lọc theo trạng thái
hay learning objective.

### 7.2 Thẻ game

| Trường | Ghi chú |
|---|---|
| `thumbnail_emoji` | Lớn |
| `title_vi` | |
| Competency | Chip màu theo token |
| Band tuổi | "3–4 tuổi" |
| Độ khó | 1–5 chấm |
| Trạng thái | "Chơi ngay" · "Cần đăng nhập" · "Gói Tiêu chuẩn" · "Gói Premium" |

## 8. API contract

### `GET /api/guest/levels`

| | |
|---|---|
| Auth | không |
| Query | §7.1 + `limit` ≤60 + `cursor` |
| 200 | `{ items: [...thẻ...], facets, next_cursor }` |

`items[].locked` cho biết khoá; item khoá không có `content_pack`.

`facets` trả số lượng mỗi giá trị bộ lọc — để không hiện bộ lọc dẫn tới 0 kết quả.

## 9. Acceptance criteria

```gherkin
Scenario: BR-GCP-01 — game khoá vẫn hiện
  Given guest duyệt catalog
  When có game premium trong kết quả
  Then thẻ hiện với nhãn gói cần thiết

Scenario: BR-GCP-02 — không rò nội dung
  When đọc response catalog
  Then không item nào có content_pack hay difficulty_params

Scenario: BR-GCP-03 — bộ lọc vào URL
  When chọn competency C1 và tuổi 4
  Then URL chứa tham số tương ứng
  And tải lại trang giữ nguyên bộ lọc

Scenario: BR-GCP-04 — danh sách hiện khi tắt JS
  Given JavaScript bị tắt
  When mở /tro-choi
  Then danh sách game vẫn hiển thị

Scenario: BR-GCP-06 — chỉ game published
  Given có game ở trạng thái draft
  When guest duyệt catalog
  Then game đó không xuất hiện

Scenario: BR-GCP-08 — trần phân trang
  When gọi với limit = 500
  Then trả không quá 60 item

Scenario: facets không dẫn tới 0 kết quả
  When mở bộ lọc
  Then giá trị có 0 kết quả bị vô hiệu hoặc ẩn
```

## 10. Boundaries

**Always**
- Hiện metadata game khoá.
- Phản ánh bộ lọc vào URL.
- Prerender danh sách.

**Ask first**
- Thêm bộ lọc.
- Nâng trần phân trang.

**Never**
- Trả `content_pack` cho game khoá.
- Ẩn hoàn toàn game trả phí.
- Phụ thuộc JS để hiện danh sách.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Với 120 game thì phân trang hay cuộn vô hạn?~~ **Đóng 2026-08-09 (T13, `D-CU`)**: phân trang dạng số trang (pagination) cho catalog công khai để hỗ trợ crawl/index; cuộn vô hạn ở sảnh trẻ | SEO và trải nghiệm | Đã đóng | D-CU |

