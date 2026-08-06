---
spec: EMOJI-REGISTRY
title: Kho emoji cố định
area: platform
status: draft
mvp: true
phase: P0
reviewed: 2026-08-04
owns:
  - Danh sách đóng emoji được dùng làm nội dung
  - Metadata và tìm kiếm tiếng Việt
  - Ranh giới emoji nội dung vs affordance
depends_on:
  - GLOSSARY
  - ID-CONVENTIONS
---

# Kho emoji cố định

## 1. Objective

Emoji là **vật liệu hình ảnh chính** của game. Trẻ 3–6 chưa đọc chữ, và emoji là glyph
nhanh nhất để giải mã. Chi phí bằng 0, tải tức thì, dễ xây theme.

Kho là **Lớp 1 — danh sách đóng**. Emoji ngoài registry không có tên tiếng Việt, không tra
được, không tag được, và không kiểm duyệt được. Cho gõ tự do là mở cửa cho nội dung không
phù hợp lọt vào bài học của trẻ.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Dev | Thêm emoji vào registry qua PR |
| Manager | **Chọn** từ picker. ❌ Không gõ tự do, ❌ không thêm mới |
| AI agent IDE (lúc soạn seeder) | Nhận danh sách đóng làm ràng buộc; cổng 3 CI chặn ref lạ |
| Engine | Render emoji với font stack đã ghim |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/emoji/` | 32 nhóm data + `search.ts` · `query.ts` · `registry.ts` |
| `packages/db/src/seed-master/emoji.ts` | Seed Lớp 1 |
| `06-admin/emoji-picker.md` | UI chọn |
| `01-platform/content-seed-authoring.md` cổng 3 | Kiểm ref hợp lệ trong CI |

## 4. Main flow — chọn emoji trong studio

1. Manager mở field kiểu `emoji`.
2. Picker hiện **12 emoji gần đây** + 32 nhóm chủ đề.
3. Gõ tìm **bằng tiếng Việt** — "táo", "con mèo", "hình tròn".
4. Chọn → lưu `EMJ-<slug>`, ❌ không lưu ký tự Unicode thô.
5. Preview hiện ở **cỡ thật trong game**.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Gõ ký tự emoji trực tiếp vào ô | Bị chặn — picker là đường duy nhất |
| Tìm không ra | Hiện gợi ý nhóm gần nhất + nút báo thiếu emoji cho dev |
| Emoji bị `deprecated` | Nội dung đang dùng vẫn render; ❌ không chọn mới được |
| Font thiết bị không có glyph | Fallback theo stack đã ghim; nếu vẫn thiếu → placeholder trung tính + `asset_load_failed` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EMJ-01` | ❌ **NEVER cho gõ emoji ngoài registry** | Không tên tiếng Việt, không tra được, không kiểm duyệt được |
| `BR-EMJ-02` | Lưu `EMJ-<slug>`, ❌ **không** ký tự Unicode thô | Unicode thô không tra ngược ra tên và không tag được |
| `BR-EMJ-03` | Emoji chỉ làm **nội dung**. ❌ **NEVER làm affordance** — nav, button, HUD, trạng thái, empty state đều dùng SVG | Render khác nhau theo OS · không recolour được · không mang được focus ring |
| `BR-EMJ-04` | Tìm kiếm **bắt buộc** hoạt động bằng tiếng Việt | Manager nghĩ bằng tiếng Việt; tìm "apple" không ra kết quả cần |
| `BR-EMJ-05` | Ô emoji trong picker ≥ **40×40px**, glyph ≥ **28px** | Nhỏ hơn thì nhiều emoji trông giống nhau — và **sai emoji = sai bài học** |
| `BR-EMJ-06` | Ghim font stack `"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"` mọi nơi render emoji | |
| `BR-EMJ-07` | Registry là **Lớp 1** — admin ❌ không thêm/sửa/xoá qua UI | |
| `BR-EMJ-08` | Emoji có `age_suitability` — loại không phù hợp tuổi ❌ không vào picker của nội dung trẻ | Vũ khí, rượu, biểu cảm tiêu cực mạnh |
| `BR-EMJ-09` | ❌ **NEVER emoji có skin tone modifier** trong nội dung game | Chọn một tông là loại trừ; dùng tông vàng trung tính |
| `BR-EMJ-10` | Xoá emoji khỏi registry → `deprecated`, ❌ không xoá cứng | Nội dung đã publish trỏ tới nó |

## 7. Data

### 7.1 Bảng `emoji_registry`

| Field | Ghi chú |
|---|---|
| `code` | `EMJ-<slug>` — bất biến |
| `unicode` | Chuỗi ký tự |
| `name_vi` | Tên tiếng Việt hiển thị — "quả táo đỏ" |
| `category` | 1 trong 32 nhóm chủ đề học |
| `search_keywords_vi` | Mảng — "táo", "trái cây", "quả", "đỏ" |
| `age_suitability` | `all` \| `4plus` \| `blocked` |
| `what_axis` | Trục `what` gợi ý: `colour`, `number`, `category`… |
| `status` | `active` \| `deprecated` |

### 7.2 32 nhóm chủ đề học

fruit · vegetable · animal-farm · animal-wild · animal-water · animal-bird · animal-insect ·
shape-color · number-symbol · school · profession · vehicle-land · vehicle-air ·
vehicle-water · weather-season · body · family · food · clothing · household · tool · time ·
festival · flower-tree · nature-landscape · sky-space · sport-game · music-art ·
face-emotion · hand-gesture · flag-symbol · misc

Nhóm theo **chủ đề dạy học**, ❌ không theo Unicode block. Manager duyệt theo cách nghĩ của
người soạn bài, không theo cách tổ chức của Unicode Consortium.

### 7.3 API package

```ts
searchEmoji(q: string, opts?: { category?: string; ageBand?: AgeBand }): EmojiEntry[];
getByCode(code: string): EmojiEntry | null;
listByCategory(category: string): EmojiEntry[];
isValidRef(code: string): boolean;         // dùng ở cổng 3 của AI pipeline
```

Tìm kiếm không dấu và có dấu đều ra kết quả — "tao" và "táo" cùng ra quả táo.

## 8. API contract

### `GET /api/managers/emoji`

| | |
|---|---|
| Auth | `requireManagerAuth()` |
| Query | `q` `category` `age_band` `limit` (≤100) |
| 200 | `{ items: [{ code, unicode, name_vi, category }] }` |

Không có route tạo/sửa/xoá.

## 9. Acceptance criteria

```gherkin
Scenario: BR-EMJ-01 — emoji ngoài registry bị từ chối
  Given manager tạo game level
  When content_pack chứa emoji ref không có trong registry
  Then hệ thống trả 422 CONTENT_PACK_INVALID
  And nêu rõ ref nào không hợp lệ

Scenario: BR-EMJ-04 — tìm bằng tiếng Việt
  When gọi searchEmoji("táo")
  Then kết quả chứa EMJ-apple-red
  When gọi searchEmoji("tao")
  Then kết quả vẫn chứa EMJ-apple-red

Scenario: BR-EMJ-02 — lưu code không lưu Unicode
  Given manager chọn quả táo trong picker
  When đọc content_pack đã lưu
  Then giá trị là EMJ-apple-red
  And không phải ký tự Unicode

Scenario: BR-EMJ-03 — emoji không làm affordance
  When quét mọi .vue tìm emoji trong thuộc tính label, aria-label, hay icon
  Then không kết quả nào

Scenario: BR-EMJ-08 — emoji không phù hợp tuổi không vào picker
  Given một emoji có age_suitability = blocked
  When picker được mở cho nội dung trẻ
  Then emoji đó không xuất hiện trong bất kỳ nhóm nào

Scenario: BR-EMJ-07 — admin không sửa được registry
  When gọi POST /api/managers/emoji
  Then route không tồn tại hoặc trả 405

Scenario: BR-EMJ-10 — deprecated không làm chết nội dung cũ
  Given một emoji chuyển deprecated
  And một game level published đang dùng nó
  When trẻ chơi level đó
  Then emoji vẫn render bình thường

Scenario: BR-EMJ-05 — ô picker đủ lớn
  When đo ô emoji trong picker
  Then mỗi ô ít nhất 40x40px và glyph ít nhất 28px
```

## 10. Boundaries

**Always**
- Chọn qua picker, lưu `EMJ-<slug>`.
- Ghim font stack ở mọi nơi render emoji.
- Tìm kiếm hoạt động cả có dấu lẫn không dấu.
- Preview ở cỡ thật trong game.

**Ask first**
- Thêm emoji hoặc nhóm chủ đề mới.
- Đổi `age_suitability` của một emoji đang được dùng.
- Deprecate một emoji.

**Never**
- Cho gõ emoji tự do.
- Lưu Unicode thô.
- Emoji làm affordance.
- Skin tone modifier trong nội dung game.
- Xoá cứng emoji khỏi registry.
- Cho admin sửa registry qua UI.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Registry cần bao nhiêu emoji để phủ 120 game level? Chưa đếm | P1 nội dung |
| 2 | Có cần bộ emoji vẽ riêng (SVG) cho những khái niệm Unicode không có không? | P4 |
| 3 | `what_axis` gợi ý tự động có đủ chính xác để người soạn seeder dựa vào không? | `content-seed-authoring` |
