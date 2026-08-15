---
spec: EMOJI-PICKER
title: Bộ chọn emoji
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Giao diện chọn emoji trong studio
depends_on:
  - EMOJI-REGISTRY
---

# Bộ chọn emoji

## 1. Objective

Emoji là vật liệu chính của game. Manager chọn hàng chục emoji mỗi ngày — picker chậm hoặc
tìm không ra là **nút thắt năng suất nội dung**.

Và **sai emoji = sai bài học**: một quả táo trông giống quả cà chua ở 20px sẽ dạy sai.

## 2. Actors

`content_reviewer` · `super_admin` — trong studio.

## 3. Entry points

Mọi field có `uiHint = emoji` (§[`schema-driven-form.md`](schema-driven-form.md) 7.1) ·
`GET /api/managers/emoji`.

## 4. Main flow

1. Bấm field emoji → popover mở.
2. Hàng đầu: **12 emoji gần đây**.
3. Ô tìm kiếm tự động focus — gõ tiếng Việt.
4. Dưới: 32 nhóm chủ đề, cuộn ngang chọn nhóm.
5. Chọn → đóng popover, lưu `EMJ-<slug>`, preview cập nhật.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Tìm không ra | Hiện nhóm gần nhất + nút "báo thiếu emoji" gửi cho dev |
| Gõ ký tự emoji trực tiếp | Bị chặn, hiện gợi ý dùng picker |
| Emoji `deprecated` | Cấm xuất hiện trong picker; nội dung cũ vẫn render |
| Nội dung cho trẻ | Lọc bỏ `age_suitability = blocked` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EPK-01` | Ô emoji ≥ **40×40px**, glyph render ≥ **28px** | Nhỏ hơn thì nhiều emoji trông giống nhau — sai emoji là sai bài học |
| `BR-EPK-02` | Tìm kiếm **bắt buộc** hoạt động tiếng Việt, có dấu và không dấu | `BR-EMJ-04` |
| `BR-EPK-03` | Cấm — **NEVER cho gõ emoji ngoài registry** | `BR-EMJ-01` |
| `BR-EPK-04` | 12 emoji **gần đây** hiện đầu tiên | Một level thường dùng lặp một bộ nhỏ |
| `BR-EPK-05` | Duyệt theo **32 nhóm chủ đề học**, không theo Unicode block | Manager nghĩ theo chủ đề dạy |
| `BR-EPK-06` | Bàn phím: mũi tên di chuyển, Enter chọn, Esc đóng | Chọn hàng chục emoji bằng chuột là chậm |
| `BR-EPK-07` | Ghim font stack emoji | `BR-EMJ-06` |
| `BR-EPK-08` | Picker là **chrome** — nút, tab, icon của nó dùng SVG | `BR-EMJ-03` |

## 7. Data

### 7.1 Bố cục popover

| Vùng | Nội dung |
|---|---|
| Trên | Ô tìm kiếm, tự focus |
| Hàng 2 | 12 emoji gần đây |
| Giữa | Lưới emoji của nhóm đang chọn, ô ≥40px |
| Dưới | Tab 32 nhóm, cuộn ngang, icon SVG + nhãn tiếng Việt |
| Chân | Tên tiếng Việt của emoji đang hover |

### 7.2 Gần đây

Lưu localStorage theo Manager, tối đa 12, LRU. Cấm đồng bộ server — nó là tiện ích cục
bộ, không phải dữ liệu.

## 8. API contract

### `GET /api/managers/emoji`

Query `q` `category` `age_band` `limit` ≤100. 200 → `{ items: [{ code, unicode, name, category }] }`.
Cache `private, max-age=3600` — registry đổi hiếm.

## 9. Acceptance criteria

```gherkin
Scenario: BR-EPK-02 — tìm tiếng Việt có dấu và không dấu
  When gõ "táo" trong picker
  Then kết quả chứa quả táo
  When gõ "tao"
  Then kết quả vẫn chứa quả táo

Scenario: BR-EPK-01 — ô đủ lớn
  When đo ô emoji trong lưới
  Then mỗi ô ít nhất 40x40px
  And glyph render ít nhất 28px

Scenario: BR-EPK-03 — không gõ được emoji tự do
  When dán một ký tự emoji vào ô tìm kiếm
  Then không lưu được giá trị đó vào field

Scenario: BR-EPK-04 — gần đây hiện đầu
  Given manager vừa dùng 3 emoji
  When mở picker lần sau
  Then 3 emoji đó ở hàng gần đây

Scenario: BR-EPK-06 — điều hướng bàn phím
  When mở picker và nhấn mũi tên
  Then ô được chọn di chuyển
  When nhấn Enter
  Then emoji được chọn và popover đóng

Scenario: BR-EPK-08 — chrome của picker là SVG
  When quét component picker
  Then tab và nút dùng UIcon
  And không dùng emoji làm icon điều hướng

Scenario: emoji bị chặn theo tuổi không xuất hiện
  Given một emoji age_suitability = blocked
  When mở picker cho nội dung trẻ
  Then emoji đó không có trong bất kỳ nhóm nào
```

## 10. Boundaries

**Always**
- Ô ≥40px, glyph ≥28px.
- Tìm tiếng Việt có dấu và không dấu.
- Hiện 12 gần đây.
- Điều hướng bàn phím đầy đủ.

**Ask first**
- Đổi số lượng gần đây.
- Đổi bố cục nhóm.

**Never**
- Cho gõ emoji tự do.
- Ô nhỏ hơn 40px.
- Emoji làm chrome của chính picker.
- Nhóm theo Unicode block.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Có cần chọn nhiều emoji cùng lúc cho field array không? | P2 | Không ở MVP — field array chọn từng item bằng cách mở picker nhiều lần (xem [`schema-driven-form.md`](schema-driven-form.md)) | người quyết |
