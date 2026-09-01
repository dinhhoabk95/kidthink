---
spec: EMOJI-REGISTRY
title: Kho emoji cố định
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-09-01
owns:
  - Danh mục emoji mã cứng dùng cho picker và tìm kiếm
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

Kho là **danh mục mã cứng trong code** — nguồn sự thật duy nhất là `packages/emoji`. Đổi
emoji là đổi code và đi qua PR review; **không có bảng DB**, không có màn admin.

Kho là **công cụ soạn thảo, không phải cổng chặn**. Nó tồn tại để người soạn tìm ra glyph
đúng bằng tiếng Việt và chọn nhanh trong picker. Một field emoji trong `content_pack` là
**chuỗi text thường** — giá trị lưu chính là ký tự UTF-8 đó (`"🍎"`), và không có ràng buộc
schema nào bắt nó phải nằm trong danh mục.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Dev | Thêm emoji vào `packages/emoji` qua PR |
| Manager | Chọn từ picker, hoặc nhập trực tiếp khi cần glyph danh mục chưa có |
| AI agent IDE (lúc soạn seeder) | Dùng danh mục làm vốn từ gợi ý |
| Engine | Render glyph với font stack đã ghim |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/emoji/` | 32 nhóm data + `search.ts` · `query.ts` · `registry.ts` — **nguồn duy nhất** |
| `packages/emoji/tests/gates/catalog-integrity.test.ts` | Cổng tự nhất quán của **danh mục** |
| [`../06-admin/emoji-picker.md`](../06-admin/emoji-picker.md) | UI chọn |

## 4. Main flow — chọn emoji trong studio

1. Manager mở field kiểu `emoji`.
2. Picker hiện **12 emoji gần đây** + 32 nhóm chủ đề.
3. Gõ tìm **bằng tiếng Việt** — "táo", "con mèo", "hình tròn".
4. Chọn → lưu **ký tự UTF-8** `"🍎"`.
5. Preview hiện ở **cỡ thật trong game**.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Tìm không ra | Hiện gợi ý nhóm gần nhất + nút báo thiếu emoji cho dev; manager nhập trực tiếp được |
| Emoji bị gỡ khỏi danh mục | Nội dung đang dùng vẫn render bình thường — ref *là* glyph, không cần tra |
| Font thiết bị không có glyph | Fallback theo stack đã ghim; nếu vẫn thiếu → placeholder trung tính + `asset_load_failed` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EMJ-01` | Danh mục `packages/emoji` là **vốn từ khuyến nghị** cho người soạn, Cấm — **NEVER coi là ràng buộc schema** | Chốt 2026-09-01: field emoji là text thường; picker là công cụ chọn nhanh. Xem `BR-EMJ-12` cho chỗ duy nhất còn cần chặn |
| `BR-EMJ-02` | Lưu **ký tự UTF-8 thật**. Cấm — **NEVER mã trung gian `EMJ-<slug>`** | Đo 2026-09-01: 825 hàng sinh ra 761 mã ⇒ **60 mã trùng**, trong đó **15 mã trỏ hai glyph khác nhau** (`EMJ-dog` → 🐶 *hoặc* 🐕), và **50 mã trong corpus không tra được** (297 lần dùng — 84 lần `EMJ-coin`, 52 lần `EMJ-yarn`). Mã kém chính xác hơn ký tự, và lỗi của nó im lặng tới lúc render |
| `BR-EMJ-03` | Emoji chỉ làm **nội dung**. Cấm — **NEVER làm affordance** — nav, button, HUD, trạng thái, empty state đều dùng SVG | Render khác nhau theo OS · không recolour được · không mang được focus ring |
| `BR-EMJ-04` | Tìm kiếm **bắt buộc** hoạt động bằng tiếng Việt | Manager nghĩ bằng tiếng Việt; tìm "apple" không ra kết quả cần |
| `BR-EMJ-05` | Ô emoji trong picker ≥ **40×40px**, glyph ≥ **28px** | Nhỏ hơn thì nhiều emoji trông giống nhau — và **sai emoji = sai bài học** |
| `BR-EMJ-06` | Ghim font stack `"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"` mọi nơi render emoji | Thiếu font thì OS fallback sang monochrome hoặc tofu — trẻ không nhận ra vật |
| `BR-EMJ-07` | Danh mục sống **trong code**. Cấm — **NEVER bảng DB, NEVER màn admin thêm/sửa/xoá** | Một bản sao trong DB là nguồn thứ hai sẽ drift. Bảng `emoji_registry` cũ không có một người đọc nào |
| `BR-EMJ-08` | Mỗi hàng có `age_min` — hàng vượt tuổi không vào picker của nội dung trẻ | Gợi ý sai tuổi làm người soạn chọn nhầm |
| `BR-EMJ-09` | Cấm — **NEVER emoji có skin tone modifier** trong danh mục | Chọn một tông là loại trừ; dùng tông vàng trung tính |
| `BR-EMJ-10` | Một nghề = **một hàng, glyph trung tính** (🧑‍⚕️ 🧑‍🏫 🧑‍🍳 🧑‍🌾), Cấm — **NEVER hai hàng nam/nữ** | Cùng lý do `BR-EMJ-09`: chọn một giới là loại trừ. Trước đây mã `EMJ-doctor` im lặng chọn 👨‍⚕️ và bỏ 👩‍⚕️ — một hàng trung tính bỏ hẳn lựa chọn ngầm đó. Keyword giữ cả "thầy giáo" và "cô giáo" để tìm kiếm không hụt. Đo 2026-09-01: **0** glyph nghề nghiệp có giới nằm trong nội dung — chỉ 10 ref dạng mã, nên đổi sang trung tính không phải codemod nội dung |
| `BR-EMJ-11` | Glyph là **khoá chính** của danh mục: duy nhất, chuẩn **NFC** | Trùng glyph thì tra ngược ra tên là ngẫu nhiên theo thứ tự mảng, và picker hiện một glyph nhiều lần |
| `BR-EMJ-12` | Chặn tư cách thành viên **chỉ** ở nội dung do User tạo ([`../07-addon/custom-game-builder.md`](../07-addon/custom-game-builder.md) `BR-CGB-04`) | `packages/moderation` chỉ quét `title` và `instruction` — **không quét emoji**. Bỏ chặn ở đây là để 🔞🚬🔫 vào game mà con của chính User đó chơi. Nội dung studio do Manager soạn không cần chặn này vì đã qua PR/review người |

## 7. Data

### 7.1 `EmojiEntry` — hình dạng một hàng

Không có bảng DB. Hàng sống trong `packages/emoji/src/data/<category>.ts`.

| Field | Kiểu | Ghi chú |
|---|---|---|
| `emoji` | `string` | **Khoá chính** — ký tự UTF-8, NFC, duy nhất |
| `name` | `string` | Tên tiếng Việt hiển thị — "Táo đỏ" |
| `categories` | `EmojiCategory[]` | 1 hoặc nhiều trong 32 nhóm chủ đề học. ⭐ thuộc cả `school`, `shape-color`, `sky-space` |
| `curriculum_themes` | `CurriculumTheme[]` | 12 chủ đề chương trình mầm non |
| `keywords` | `string[]` | ≥2, Anh + Việt gộp — "red apple", "apple", "táo", "trái cây" |
| `age_min` | `3 \| 4 \| 5 \| 6` | Tuổi tối thiểu khuyến nghị |

`categories` là mảng vì glyph là khoá chính (`BR-EMJ-11`) và cùng một glyph phục vụ nhiều
nhóm dạy học thật. Trước 2026-09-01 field là số ít, và 49 glyph phải nhân bản thành nhiều
hàng để có mặt ở nhiều nhóm — đó là nguồn của 60 mã trùng.

### 7.2 32 nhóm chủ đề học

fruit · vegetable · animal-farm · animal-wild · animal-water · animal-bird · animal-insect ·
shape-color · number-symbol · school · profession · vehicle-road · vehicle-rail ·
vehicle-air · vehicle-water · weather-season · body · family · food · clothing · household ·
tool · time · festival · flower-tree · nature-landscape · sky-space · sport-game · music-art ·
face-emotion · hand-gesture · flag-symbol

Nhóm theo **chủ đề dạy học**, không theo Unicode block. Manager duyệt theo cách nghĩ của
người soạn bài, không theo cách tổ chức của Unicode Consortium.

### 7.3 API package

```ts
searchEmoji(q: string, limit?: number): EmojiEntry[];
getByGlyph(glyph: string): EmojiEntry | null;
getEmojisByCategory(category: EmojiCategory): EmojiEntry[];
isInCatalog(glyph: string): boolean;   // picker, script kiểm kê, BR-CGB-04
```

Tìm kiếm không dấu và có dấu đều ra kết quả — "tao" và "táo" cùng ra quả táo.

`getByGlyph` và `isInCatalog` nhận cả bản đã tước variation selector `U+FE0F` — `"🕊"` và
`"🕊️"` cùng ra một hàng. Đo 2026-09-01: tước `U+FE0F` không tạo thêm va chạm nào.

`isInCatalog` **không phải cổng chặn chung** (`BR-EMJ-01`). Nó chỉ được gọi ở `BR-CGB-04` và
ở script kiểm kê. Tên đổi từ `isValidRef` để không ai đọc nhầm nó thành validator.

Cấm — **NEVER** export `getByCode` · `getEmojiCode` · `EMOJI_REF_PATTERN`.

### 7.4 Phân giải lúc render

Emoji **không cần phân giải**. `ref` chính là glyph:

```ts
{ kind: "emoji", ref: "🍎" }  →  glyph = "🍎"
```

Không tra danh mục, không có nhánh `not_found`. Đây là chỗ 297 ref hỏng của `BR-EMJ-02`
biến mất — không phải vì được sửa, mà vì phép tra đã bị bỏ.

## 8. API contract

### `GET /api/managers/emoji`

| | |
|---|---|
| Auth | `requireManagerAuth()` |
| Query | `q` `category` `age_band` `limit` (≤100) |
| 200 | `{ items: [{ emoji, name, categories, keywords, age_min }], total, categories }` |
| Nguồn | `@mindkid/emoji` trực tiếp — Cấm — **NEVER truy vấn DB** |
| Cache | `private, max-age=3600` |

Không có route tạo/sửa/xoá.

## 9. Acceptance criteria

```gherkin
Scenario: BR-EMJ-02 — lưu ký tự, không lưu mã
  Given manager chọn quả táo trong picker
  When đọc content_pack đã lưu
  Then giá trị là "🍎"
  And không khớp /^EMJ-/

Scenario: BR-EMJ-01 — glyph ngoài danh mục vẫn lưu được ở studio
  Given manager nhập "🦖" vào field emoji của một game level
  When lưu
  Then lưu thành công
  And engine render "🦖"

Scenario: BR-EMJ-12 — glyph ngoài danh mục bị chặn ở game do User tạo
  Given User tạo custom game chứa "🔞"
  When gọi validate trước khi lưu
  Then trả invalid_emoji_ref
  And nêu rõ glyph nào ngoài danh mục

Scenario: không còn phép tra lúc render
  Given content_pack chứa { kind: "emoji", ref: "🍎" }
  When phân giải asset
  Then glyph là "🍎"
  And không có nhánh not_found nào chạy

Scenario: BR-EMJ-11 — glyph duy nhất
  When đếm ALL_EMOJIS
  Then số glyph phân biệt bằng số hàng
  And mọi glyph ở dạng NFC

Scenario: BR-EMJ-11 — CA ÂM glyph trùng làm cổng đỏ
  Given thêm một hàng có glyph đã tồn tại
  When chạy catalog-integrity.test.ts
  Then cổng đỏ và nêu glyph trùng

Scenario: BR-EMJ-04 — tìm bằng tiếng Việt
  When gọi searchEmoji("táo")
  Then kết quả chứa hàng có emoji "🍎"
  When gọi searchEmoji("tao")
  Then kết quả vẫn chứa hàng đó

Scenario: BR-EMJ-10 — một nghề một hàng, tìm được cả hai giới
  When gọi searchEmoji("cô giáo")
  Then kết quả chứa hàng có emoji "🧑‍🏫"
  When gọi searchEmoji("thầy giáo")
  Then kết quả vẫn chứa đúng hàng đó
  And ALL_EMOJIS không có hàng nào cho "👨‍🏫" hay "👩‍🏫"

Scenario: một glyph phục vụ nhiều nhóm
  When gọi getEmojisByCategory("school")
  Then kết quả chứa "⭐"
  When gọi getEmojisByCategory("sky-space")
  Then kết quả vẫn chứa "⭐"
  And ALL_EMOJIS chỉ có một hàng cho "⭐"

Scenario: BR-EMJ-03 — emoji không làm affordance
  When quét mọi .vue tìm emoji trong thuộc tính label, aria-label, hay icon
  Then không kết quả nào

Scenario: BR-EMJ-07 — không có bảng DB emoji
  When liệt kê bảng trong schema
  Then không có emoji_registry
  When gọi POST /api/managers/emoji
  Then route không tồn tại hoặc trả 405

Scenario: BR-EMJ-09 — CA ÂM skin tone làm cổng đỏ
  Given thêm một hàng có emoji "👍🏽"
  When chạy catalog-integrity.test.ts
  Then cổng đỏ

Scenario: BR-EMJ-05 — ô picker đủ lớn
  When đo ô emoji trong picker
  Then mỗi ô ít nhất 40x40px và glyph ít nhất 28px
```

## 10. Boundaries

**Always**
- Lưu ký tự UTF-8.
- Glyph duy nhất, NFC, trong danh mục.
- Ghim font stack ở mọi nơi render emoji.
- Tìm kiếm hoạt động cả có dấu lẫn không dấu.
- Preview ở cỡ thật trong game.

**Ask first**
- Thêm emoji hoặc nhóm chủ đề mới.
- Đổi `age_min` của một emoji đang được dùng.
- Nới `BR-EMJ-12` (chặn ở nội dung User tạo).

**Never**
- Bảng DB cho emoji.
- Mã trung gian `EMJ-<slug>`.
- Phép tra ref → glyph lúc render.
- Emoji làm affordance.
- Skin tone modifier trong danh mục.
- Hai hàng cùng một glyph.
- Hai hàng nam/nữ cho một nghề.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | `BR-EMJ-12` giữ hay bỏ? Bỏ thì UGC không còn chặn emoji nào — `packages/moderation` chỉ quét text | [`../07-addon/custom-game-builder.md`](../07-addon/custom-game-builder.md) | P4 | người quyết |
| 2 | Danh mục cần bao nhiêu emoji để phủ 120 game level? Chưa đếm | P1 nội dung | P1 | Nội dung |
| 3 | Có cần bộ emoji vẽ riêng (SVG) cho những khái niệm Unicode không có không? | P4 UI | P4 | Studio UI |
