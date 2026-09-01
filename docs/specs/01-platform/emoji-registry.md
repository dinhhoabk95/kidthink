---
spec: EMOJI-REGISTRY
title: Kho emoji cố định
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-09-01
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

Kho là **Lớp 1 — danh sách đóng mã cứng trong code**. Nguồn sự thật duy nhất là
`packages/emoji`. Đổi emoji là đổi code và đi qua PR review; **không có bảng DB**, không có
màn admin. Emoji ngoài registry không có tên tiếng Việt, không tra được, không tag được, và
không kiểm duyệt được. Cho gõ tự do là mở cửa cho nội dung không phù hợp lọt vào bài học của trẻ.

Tham chiếu tới một emoji là **chính ký tự UTF-8 đó** — `"🍎"`, không phải một mã trung gian.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Dev | Thêm emoji vào `packages/emoji` qua PR |
| Manager | **Chọn** từ picker. Cấm gõ tự do, không thêm mới |
| AI agent IDE (lúc soạn seeder) | Nhận danh sách đóng làm ràng buộc; cổng 3 tự động chặn glyph lạ |
| Engine | Render glyph với font stack đã ghim |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/emoji/` | 32 nhóm data + `search.ts` · `query.ts` · `registry.ts` — **nguồn duy nhất** |
| `packages/db/tests/gates/emoji-glyph-integrity.test.ts` | Cổng toàn vẹn |
| [`../06-admin/emoji-picker.md`](../06-admin/emoji-picker.md) | UI chọn |
| [`content-seed-authoring.md`](content-seed-authoring.md) cổng 3 | Kiểm tư cách thành viên trong cổng tự động |

## 4. Main flow — chọn emoji trong studio

1. Manager mở field kiểu `emoji`.
2. Picker hiện **12 emoji gần đây** + 32 nhóm chủ đề.
3. Gõ tìm **bằng tiếng Việt** — "táo", "con mèo", "hình tròn".
4. Chọn → lưu **ký tự UTF-8** `"🍎"`.
5. Preview hiện ở **cỡ thật trong game**.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Gõ ký tự emoji trực tiếp vào ô | Bị chặn — picker là đường duy nhất; glyph ngoài danh sách bị contract từ chối |
| Tìm không ra | Hiện gợi ý nhóm gần nhất + nút báo thiếu emoji cho dev |
| Emoji bị gỡ khỏi package | Nội dung đang dùng vẫn render (glyph là chính nó); cổng T6 báo ref mồ côi |
| Font thiết bị không có glyph | Fallback theo stack đã ghim; nếu vẫn thiếu → placeholder trung tính + `asset_load_failed` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EMJ-01` | Cấm — **NEVER cho dùng emoji ngoài `packages/emoji`** | Không tên tiếng Việt, không tra được, không kiểm duyệt được |
| `BR-EMJ-02` | Lưu **ký tự UTF-8 thật**. Cấm — **NEVER mã trung gian `EMJ-<slug>`** | Đo 2026-09-01: 825 hàng sinh ra 761 mã ⇒ **60 mã trùng**, trong đó **15 mã trỏ hai glyph khác nhau** (`EMJ-dog` → 🐶 *hoặc* 🐕; `EMJ-doctor` → 👨‍⚕️ *hoặc* 👩‍⚕️), và **50 mã trong corpus không tra được** (297 lần dùng — 84 lần `EMJ-coin`, 52 lần `EMJ-yarn`). Mã kém chính xác hơn ký tự, và lỗi của nó im lặng tới lúc render |
| `BR-EMJ-03` | Emoji chỉ làm **nội dung**. Cấm — **NEVER làm affordance** — nav, button, HUD, trạng thái, empty state đều dùng SVG | Render khác nhau theo OS · không recolour được · không mang được focus ring |
| `BR-EMJ-04` | Tìm kiếm **bắt buộc** hoạt động bằng tiếng Việt | Manager nghĩ bằng tiếng Việt; tìm "apple" không ra kết quả cần |
| `BR-EMJ-05` | Ô emoji trong picker ≥ **40×40px**, glyph ≥ **28px** | Nhỏ hơn thì nhiều emoji trông giống nhau — và **sai emoji = sai bài học** |
| `BR-EMJ-06` | Ghim font stack `"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"` mọi nơi render emoji | Thiếu font thì OS fallback sang monochrome hoặc tofu — trẻ không nhận ra vật |
| `BR-EMJ-07` | Registry là **Lớp 1 trong code**. Cấm — **NEVER bảng DB, NEVER màn admin thêm/sửa/xoá** | Emoji sai lọt vào bài học trẻ em là sự cố nội dung; PR review là cổng người duy nhất. Một bản sao trong DB là nguồn thứ hai sẽ drift |
| `BR-EMJ-08` | Emoji có `age_min` — hàng vượt tuổi không vào picker của nội dung trẻ | Vũ khí, rượu, biểu cảm tiêu cực mạnh |
| `BR-EMJ-09` | Cấm — **NEVER emoji có skin tone modifier** trong nội dung game | Chọn một tông là loại trừ; dùng tông vàng trung tính |
| `BR-EMJ-10` | Gỡ emoji khỏi package **bắt buộc** kèm codemod đổi mọi ref đang dùng | Không còn bảng để đánh dấu `deprecated`; ref mồ côi là ô trống trên màn hình trẻ |
| `BR-EMJ-11` | Glyph là **khoá chính**: duy nhất trong toàn registry, chuẩn **NFC** | Trùng glyph thì tra ngược ra tên là ngẫu nhiên theo thứ tự mảng — đúng lỗi mà `BR-EMJ-02` vừa dọn |
| `BR-EMJ-12` | Ràng buộc emoji ở contract là **tư cách thành viên**, Cấm — **NEVER regex định dạng** | `z.string().regex(/^EMJ-[a-z0-9-]+$/)` nhận `EMJ-coin` — 84 ref hỏng đi qua contract và chết lúc render |

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
isValidGlyph(glyph: string): boolean;   // dùng ở cổng 3 và ở Zod EmojiRef
```

Tìm kiếm không dấu và có dấu đều ra kết quả — "tao" và "táo" cùng ra quả táo.

`getByGlyph` và `isValidGlyph` nhận cả bản đã tước variation selector `U+FE0F` — `"🕊"` và
`"🕊️"` cùng ra một hàng. Đo 2026-09-01: tước `U+FE0F` không tạo thêm va chạm nào.

Cấm — **NEVER** export `getByCode` · `getEmojiCode` · `EMOJI_REF_PATTERN`. Giữ chúng song
song với API glyph là giữ đúng hai nguồn mà `BR-EMJ-02` vừa gộp lại.

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

Scenario: BR-EMJ-12 — glyph ngoài danh sách bị contract từ chối
  Given manager tạo game level
  When content_pack chứa "🦖" và 🦖 không có trong packages/emoji
  Then hệ thống trả 422 CONTENT_PACK_INVALID
  And nêu rõ glyph nào không hợp lệ

Scenario: BR-EMJ-12 — mã cũ bị contract từ chối
  When content_pack chứa "EMJ-red-apple"
  Then hệ thống trả 422 CONTENT_PACK_INVALID

Scenario: BR-EMJ-11 — glyph duy nhất
  When đếm ALL_EMOJIS
  Then số glyph phân biệt bằng số hàng
  And mọi glyph ở dạng NFC

Scenario: BR-EMJ-11 — CA ÂM glyph trùng làm cổng đỏ
  Given thêm một hàng có glyph đã tồn tại
  When chạy emoji-glyph-integrity.test.ts
  Then cổng đỏ và nêu glyph trùng

Scenario: BR-EMJ-04 — tìm bằng tiếng Việt
  When gọi searchEmoji("táo")
  Then kết quả chứa hàng có emoji "🍎"
  When gọi searchEmoji("tao")
  Then kết quả vẫn chứa hàng đó

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
  When chạy emoji-glyph-integrity.test.ts
  Then cổng đỏ

Scenario: BR-EMJ-10 — gỡ emoji không để lại ref mồ côi
  Given một glyph bị gỡ khỏi packages/emoji
  And một game level published đang dùng nó
  When chạy emoji-glyph-integrity.test.ts
  Then cổng đỏ và nêu level nào đang trỏ tới nó

Scenario: BR-EMJ-05 — ô picker đủ lớn
  When đo ô emoji trong picker
  Then mỗi ô ít nhất 40x40px và glyph ít nhất 28px
```

## 10. Boundaries

**Always**
- Chọn qua picker, lưu ký tự UTF-8.
- Glyph duy nhất, NFC.
- Ràng buộc contract bằng tư cách thành viên.
- Ghim font stack ở mọi nơi render emoji.
- Tìm kiếm hoạt động cả có dấu lẫn không dấu.
- Preview ở cỡ thật trong game.

**Ask first**
- Thêm emoji hoặc nhóm chủ đề mới.
- Đổi `age_min` của một emoji đang được dùng.
- Gỡ một emoji (phải kèm codemod, `BR-EMJ-10`).

**Never**
- Bảng DB cho emoji.
- Mã trung gian `EMJ-<slug>`.
- Regex định dạng thay cho kiểm thành viên.
- Cho gõ emoji tự do.
- Emoji làm affordance.
- Skin tone modifier trong nội dung game.
- Hai hàng cùng một glyph.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | 4 mã nghề nghiệp (`doctor` `teacher` `chef` `farmer`) từng im lặng bỏ giọng nữ. Giữ hai hàng nam/nữ hay một hàng trung tính? | [`202-emoji-package-single-source-plan.md`](../../tasks/202-emoji-package-single-source-plan.md) T4 | P0 | Nội dung |
| 2 | `zod-to-json-schema` không xuất được `.refine`. JSON Schema công bố dùng `enum` 759 glyph hay `pattern` Unicode? | [`../06-admin/schema-driven-form.md`](../06-admin/schema-driven-form.md) | P2 | Studio UI |
| 3 | Registry cần bao nhiêu emoji để phủ 120 game level? Chưa đếm | P1 nội dung | P1 | Nội dung |
| 4 | Có cần bộ emoji vẽ riêng (SVG) cho những khái niệm Unicode không có không? | P4 UI | P4 | Studio UI |
