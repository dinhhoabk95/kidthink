# Kế hoạch — Task #202: Emoji là package mã cứng, ký tự UTF-8 thật, bỏ hẳn bảng DB

> **Loại task:** refactor xuyên kho (L) — đổi **contract**, không thêm tính năng.
> **Người đặt việc chốt:** emoji quản lý bằng package dữ liệu cứng; đổi emoji thì đổi code,
> **không** đổi DB. Tham chiếu dùng **ký tự UTF-8 thật**, **không** dùng mã `EMJ-<slug>`.
> **Đích:** một nguồn sự thật duy nhất (`packages/emoji`), một dạng tham chiếu duy nhất (glyph),
> và một cổng chặn duy nhất kiểm **tư cách thành viên** thay vì kiểm **định dạng chuỗi**.

## 1. Trả lời ngắn

Yêu cầu này không phải nới lỏng contract. Nó **siết** contract, và nó sửa ba lỗi đang chạy
trong production hôm nay. Đo được, không suy đoán:

| Lỗi đang chạy | Số đo | Hậu quả trên màn hình trẻ |
|---|---:|---|
| Mã `EMJ-*` trong corpus **không tra được** trong package | **50 mã · 297 lần dùng** | `not_found` → ô trống |
| Mã `EMJ-*` tra ra **glyph khác nhau** tuỳ thứ tự mảng | **15 mã** | `EMJ-doctor` im lặng chọn 👨‍⚕️, bỏ 👩‍⚕️ |
| Cổng đo khoản nợ này | **không tồn tại** | `runtime-gates.md` dòng 41 vẫn khai nó |

Nói cách khác: **mã `EMJ-<slug>` hiện kém chính xác hơn ký tự**. Một glyph luôn trỏ đúng
một glyph. Một mã có thể trỏ hai glyph khác nhau (`EMJ-dog` → 🐶 *hoặc* 🐕), hoặc không trỏ
đâu cả (`EMJ-coin`, dùng 84 lần).

Lý do gốc ghi trong `BR-EMJ-02` — *"Unicode thô không tra ngược ra tên và không tag được"* —
**không còn đúng**. Khi registry là danh sách đóng mã cứng trong `packages/emoji`, tra ngược
glyph → tên là một `Map.get()`. Điều mà `BR-EMJ-01` thật sự bảo vệ là **danh sách đóng**, và
danh sách đóng được cưỡng chế bằng phép kiểm tư cách thành viên, không phải bằng regex định dạng.

## 2. Đo được (2026-09-01)

### 2.1 Bảng `emoji_registry` không có ai đọc

```
ghi:  packages/db/src/seed-master/emoji.ts        (nguồn: @mindkid/emoji)
đọc:  — không có —
```

`GET /api/managers/emoji` đọc thẳng `@mindkid/emoji`, không chạm DB.
`asset-resolver.ts` có hook `emojiRegistryLookup?` nhưng **không nơi nào trong runtime truyền
vào** — chỉ ba test trong `packages/shared/tests/asset-resolver.test.ts`. Bảng là bản sao
chết. Xoá nó không mất khả năng nào.

| Chạm bảng | File |
|---|---|
| Định nghĩa | `packages/db/src/schema/taxonomy.ts:152–184` (bảng + 2 enum + 1 CHECK) |
| Migration | `packages/db/src/migrations/0000_bumpy_secret_warriors.sql:1277–1291` + snapshot |
| Seeder | `packages/db/src/seed-master/emoji.ts` (53 dòng) |
| Truncate test | `packages/db/tests/global-setup.ts:65` |
| Purge scope | `packages/db/src/purge-scope.ts:295` |
| Test tích hợp | `packages/db/tests/integration/emoji-master.test.ts` |
| Doc | `reset-content.ts:25` · `docs/SPEC.md:246` |

### 2.2 Dữ liệu package — 825 hàng, 759 glyph

61 glyph xuất hiện nhiều hơn một lần (66 hàng thừa). Hai kiểu, xử lý khác nhau:

| Kiểu | Số | Ví dụ |
|---|---:|---|
| **Xuyên nhóm** — cùng glyph, khác nhóm dạy học | 49 | ⭐ `school` + `shape-color` + `sky-space` · 🎒 `clothing` + `school` |
| **Trong một nhóm** — hai tên cho một glyph | 12 | `animal-water`: 🐬 "Cá heo" + "Cá heo biển" · 🦈 "Cá mập" + "Cá mập lớn" |

Kiểu xuyên nhóm là **thật** — ⭐ đúng là vừa thuộc hình học vừa thuộc bầu trời. Kiểu trong
một nhóm là **nợ dữ liệu**: hàng độn để đạt số lượng.

### 2.3 Mã `EMJ-*` đã hỏng sẵn

**761 mã suy ra từ 825 hàng ⇒ 60 mã trùng.** Trong đó **15 mã trỏ tới glyph khác nhau**:

```
EMJ-doctor  👨‍⚕️ | 👩‍⚕️        EMJ-dog     🐶 | 🐕
EMJ-teacher 👨‍🏫 | 👩‍🏫        EMJ-cat     🐱 | 🐈
EMJ-chef    👨‍🍳 | 👩‍🍳        EMJ-pig     🐷 | 🐖
EMJ-farmer  👨‍🌾 | 👩‍🌾        EMJ-whale   🐳 | 🐋
EMJ-family  👨‍👩‍👦 | 👨‍👩‍👧‍👦 | 👪   EMJ-tiger   🐯 | 🐅
EMJ-rice    🌾 | 🍚          EMJ-monkey  🐵 | 🐒
EMJ-angry   😤 | 😡          EMJ-dizzy   😵 | 💫
EMJ-sleepy  😴 | 😪
```

`getByCode` dùng `ALL_EMOJIS.find(...)` — **hàng đầu tiên thắng, im lặng**. Bốn mã nghề nghiệp
đang im lặng xoá giọng nữ khỏi nội dung trẻ em. Chuyển sang glyph làm lựa chọn đó **hiện ra
trong diff**, từng chỗ một.

### 2.4 Mã trong corpus không tra được — 50 mã, 297 lần

| Mã | Lần | Ở đâu | Glyph đúng |
|---|---:|---|---|
| `EMJ-coin` | 84 | `seed-gt031.ts` · `GT-031/fixtures.ts` · generator | 🪙 |
| `EMJ-yarn` | 52 | `seed-gt033.ts` · `GT-033/fixtures.ts` · generator | 🧶 |
| `EMJ-apple` | 11 | (registry có `EMJ-red-apple`) | 🍎 |
| `EMJ-book` `EMJ-tree` `EMJ-flower` `EMJ-tangerine` … | 46 còn lại | rải rác | soạn ở T3 |

`EMJ-nonexistent-999` (2 lần) là fixture ca âm — giữ, đổi thành glyph ngoài danh sách.

Không cổng nào bắt được nhóm này: `EmojiRef` là `z.string().regex(/^EMJ-[a-z0-9-]+$/)` — nó
kiểm **hình dạng chuỗi**, và `EMJ-coin` đúng hình dạng. `isValidRef` (kiểm thành viên thật)
chỉ được gọi ở hai nơi: `custom-game.ts` và cổng `theme-registry`. Corpus seed không đi qua nó.

### 2.5 Phạm vi codemod

| Vùng | Lần xuất hiện `EMJ-*` |
|---|---:|
| `packages/db/src/seed-content/**` | 2.155 |
| `packages/game-engine/**` (template · fixture · generator · test) | ~430 |
| `packages/shared/src/constants/content-themes.ts` | 176 |
| `apps/web/**` (page · test) | 74 |
| `docs/**` | 75 |
| **Tổng** | **3.249** (348 mã phân biệt) |

## 3. Quyết định

Mỗi quyết định là một giả định đã chốt, không phải câu hỏi mở.

**D-EA — `packages/emoji` là Lớp 1 duy nhất. Bảng `emoji_registry` xoá cứng.**
Bảng không có người đọc (§2.1). Giữ nó là giữ hai nguồn có thể lệch nhau. Migration `expand`
thêm một bước `DROP TABLE` + `DROP TYPE`; `0000` không sửa (bất biến lịch sử).

**D-EB — tham chiếu emoji là ký tự UTF-8 thật, không phải mã.**
`{ kind: "emoji", ref: "🍎" }`. `thumbnail_emoji` giữ cột nhưng chứa glyph. Cột này thuộc
`game_levels`, không thuộc registry — không nằm trong phạm vi xoá.

**D-EC — glyph là khoá chính ⇒ phải duy nhất ⇒ `category` đổi thành `categories[]`.**
`EmojiEntry.category: EmojiCategory` → `categories: EmojiCategory[]`. 49 trùng xuyên nhóm gộp
thành một hàng nhiều nhóm; 12 trùng trong một nhóm gộp tên và hợp keyword. 825 → **759 hàng**.
`EMOJI_CATEGORIES` dựng từ `categories.includes(cat)` nên picker và `getEmojisByCategory`
giữ nguyên hành vi: ⭐ vẫn hiện ở cả ba nhóm.

**D-ED — chuẩn hoá glyph: NFC, giữ VS16 như đã soạn, tra khớp cả bản đã tước VS16.**
Đo rồi: tước `U+FE0F` không làm tăng số trùng (61 trước, 61 sau) — không có va chạm ẩn.
`isValidGlyph` nhận cả `"🕊️"` và `"🕊"`; `getByGlyph` trả entry đã soạn.

**D-EE — 50 mã chưa tra được (§2.4) phải có glyph thật trước khi codemod chạy.**
Đây là điều kiện tiên quyết, không phải dọn sau. Codemod không được phép để lại ref không
resolve — nếu để, ta đổi một lỗi im lặng thành một lỗi im lặng khác.

**D-EF — bỏ `getEmojiCode` · `getByCode` · `EMOJI_REF_PATTERN` · trường `code?`.**
Thay bằng `getByGlyph(glyph)` · `isValidGlyph(glyph)`. Không giữ lớp tương thích: mã cũ tồn
tại song song là đúng thứ tạo ra drift mà task này đang dọn.

**D-EG — codemod giải mã theo đúng ngữ nghĩa `find()` hôm nay, rồi mới gộp trùng.**
Thứ tự bắt buộc: T3 (bổ sung 50 mã) → T4 (codemod, dùng bản đồ mã→glyph **trước khi gộp**,
lấy hàng đầu theo thứ tự `ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat()`) → T5 (gộp
trùng). Đảo thứ tự sẽ đổi glyph được render mà không ai thấy trong diff.
15 mã nhập nhằng ở §2.3 được **liệt kê từng chỗ** trong báo cáo codemod để người soạn nội
dung duyệt tay, không tự động chốt.

**D-EH — `EmojiRef` kiểm tư cách thành viên, không kiểm định dạng.**
```ts
export const EmojiRef = z.string().refine(isValidGlyph, { message: "..." });
```
Đây là chỗ 297 ref hỏng của §2.4 lẽ ra phải chết. Sau task này chúng chết ở contract.

**D-EI — cổng mới phải có ca âm.**
Bậc thang `emoji-ref-debt.test.ts` được khai trong `runtime-gates.md` nhưng **không tồn tại**.
Thay bằng `packages/db/tests/gates/emoji-glyph-integrity.test.ts` với ca âm bắt buộc: chèn một
glyph ngoài danh sách → cổng đỏ; chèn một glyph trùng vào data → cổng đỏ.

## 4. Đồ thị phụ thuộc

```
T1 spec (contract mới)
 └─ T2 package API: categories[] · getByGlyph · isValidGlyph
     ├─ T3 bổ sung 50 emoji thiếu  ─┐
     │                              ├─ T4 codemod EMJ-* → glyph (3.249 chỗ)
     │                              │    └─ T5 gộp 66 hàng trùng → 759
     │                              │        └─ T6 cổng toàn vẹn + ca âm
     ├─ T7 contract Zod EmojiRef ───┘
     └─ T8 xoá DB: schema · migration expand · seeder · purge · global-setup
         └─ T9 quét lần cuối: 0 chuỗi "EMJ-" · 0 chuỗi "emoji_registry"
```

`T3` và `T7` chạy song song được. `T8` độc lập với `T4/T5` (bảng không có người đọc) nhưng
xếp sau `T2` để `seed-master` không import API đã đổi.

## 5. Lát cắt

### T1 — Spec: contract mới

Sửa hai spec sở hữu, rồi sửa dòng bị ảnh hưởng ở spec phụ thuộc.

| Spec | Sửa gì |
|---|---|
| `01-platform/emoji-registry.md` | §7.1 bỏ bảng DB, đổi thành hình dạng `EmojiEntry`. `BR-EMJ-02` **đảo**: lưu ký tự, cấm mã. Thêm `BR-EMJ-11` glyph duy nhất + NFC. §7.3 API mới. §9 viết lại Gherkin |
| `06-admin/emoji-picker.md` | Main flow bước 5 lưu glyph. `BR-EPK-03` giữ nguyên (vẫn cấm gõ tự do — picker vẫn là đường duy nhất) |
| `01-platform/content-seed-authoring.md` | `BR-CSA-13` + cổng 3: "tồn tại trong `emoji_registry`" → "là thành viên `@mindkid/emoji`" |
| `01-platform/game-template-contract.md` §159 | `label_emoji: EmojiRef` — bỏ chú "FK logic tới emoji_registry" |
| `01-platform/level-generator-kit.md` §85 §108 §138 | `emoji_ref` resolve trong package |
| `05-content/content-theme-registry.md` §197 | `icon_emoji_ref` là glyph |
| `06-admin/asset-usage-tracking.md` §117 | Bỏ scenario "không route nào xoá hàng emoji_registry" — không còn bảng |
| `08-quality/runtime-gates.md` §41 | Thay dòng cổng ma bằng `emoji-glyph-integrity.test.ts` |
| `04-play/game-config-delivery.md` | `BR-CFG-07`: glyph resolve từ package |
| `00-foundation/business-rules.md` · `id-conventions.md` | Gỡ `EMJ-<slug>` khỏi bảng mã định danh |
| `docs/SPEC.md:246` | Bỏ `emoji_registry` khỏi danh sách bảng |

**Xong khi:** grep `emoji_registry` trong `docs/specs/` ra 0; `BR-EMJ-02` đọc ngược lại với
hôm nay và nêu lý do bằng số đo §2.3.

### T2 — Package API

```ts
export interface EmojiEntry {
  age_min: number;
  categories: EmojiCategory[];   // đổi từ category: EmojiCategory
  curriculum_themes: CurriculumTheme[];
  emoji: string;                 // khoá chính, NFC, duy nhất
  keywords: string[];
  name: string;
}                                // trường code? xoá

export function getByGlyph(glyph: string): EmojiEntry | null;
export function isValidGlyph(glyph: string): boolean;
export function searchEmoji(q: string, limit?: number): EmojiEntry[];
export function getEmojisByCategory(c: EmojiCategory): EmojiEntry[];
```

**Xong khi:** `pnpm --filter @mindkid/emoji test` xanh; `getByCode` và `getEmojiCode` không
còn được export.

### T3 — Bổ sung 50 emoji thiếu

Soạn hàng thật cho 50 mã ở §2.4, mỗi hàng đủ `name` tiếng Việt · `keywords` (≥2, Anh + Việt) ·
`categories` · `curriculum_themes` · `age_min`. `EMJ-coin` → 🪙 vào `number-symbol`;
`EMJ-yarn` → 🧶 vào `tool`.

**Xong khi:** script `scripts/emoji/audit-refs.ts` báo **0 mã không tra được**.
**Ca âm:** xoá một hàng vừa thêm → script báo đỏ nêu đúng mã đó.

### T4 — Codemod `EMJ-*` → glyph

`packages/db/scripts/fix-emoji-refs.ts` viết lại thành `scripts/emoji/codemod-to-glyph.ts`,
đổi chiều. Trường quét giữ nguyên danh sách đã có: `ref` · `emoji_ref` · `label_emoji` ·
helper `emoji("…")`, cộng `icon_emoji_ref` (content-themes) và `thumbnail_emoji`.

Chạy `--dry-run` trước, in báo cáo ba phần:
1. số ref đổi được trên từng file;
2. **15 mã nhập nhằng** (§2.3) và glyph mà `find()` chọn — cần người duyệt;
3. ref không đổi được — phải là **rỗng** sau T3.

**Xong khi:** `grep -r 'EMJ-' packages apps` ra 0 ngoài `docs/` (docs dọn ở T1).
**Ca âm:** chạy lại codemod trên cây đã đổi → 0 thay đổi (idempotent).

### T5 — Gộp 66 hàng trùng

825 → 759. 49 hàng xuyên nhóm gộp `categories`; 12 hàng trong nhóm gộp tên (giữ tên ngắn hơn)
và hợp `keywords`; 5 hàng còn lại xử theo bảng in ra ở T4.

**Xong khi:** `new Set(ALL_EMOJIS.map(e => e.emoji)).size === ALL_EMOJIS.length` và
`ALL_EMOJIS.length === 759`.

### T6 — Cổng toàn vẹn

`packages/db/tests/gates/emoji-glyph-integrity.test.ts`:

| Kiểm | Ca âm bắt buộc |
|---|---|
| Mọi glyph trong `ALL_EMOJIS` duy nhất | thêm hàng trùng → đỏ |
| Mọi glyph là NFC | thêm hàng NFD → đỏ |
| Cấm skin tone modifier (`BR-EMJ-09`) | thêm 👍🏽 → đỏ |
| Mọi `ref` emoji trong corpus seed là thành viên | đổi một ref thành 🦖 (ngoài danh sách) → đỏ |
| Mọi `icon_emoji_ref` của 14 chủ đề là thành viên | xoá một hàng → đỏ |

Đăng ký cổng vào `docs/specs/08-quality/runtime-gates.md`.

**Xong khi:** cả năm ca âm được chứng minh đỏ, không chỉ khai là có.

### T7 — Contract Zod

`packages/game-engine/src/contracts/shared-fields.ts`: bỏ `EMOJI_REF_PATTERN`, `EmojiRef`
dùng `.refine(isValidGlyph)`. Cập nhật `generators.test.ts:99–123` — test hiện khẳng định
`"🍎"` **bị từ chối**; sau task này nó phải được **chấp nhận**, và `"EMJ-red-apple"` bị từ chối.

Cảnh báo: `zod-to-json-schema` không xuất được `.refine`. JSON Schema công bố cho studio phải
thêm `enum` 759 glyph hoặc một `pattern` phụ — chốt ở T7, không để hở.

**Xong khi:** `pnpm --filter @mindkid/game-engine test` xanh; JSON Schema xuất ra vẫn ràng buộc
được ô emoji trong `schema-driven-form`.

### T8 — Xoá DB

| Xoá | File |
|---|---|
| Bảng + 2 enum + CHECK | `packages/db/src/schema/taxonomy.ts:152–184` |
| Seeder | `packages/db/src/seed-master/emoji.ts` + lời gọi trong `seed.ts` |
| Truncate | `packages/db/tests/global-setup.ts:65` |
| Purge entry | `packages/db/src/purge-scope.ts:295` |
| Test tích hợp | `packages/db/tests/integration/emoji-master.test.ts` |
| Hook chết | `emojiRegistryLookup` trong `asset-resolver.ts` + 3 test dùng nó |
| Doc | `reset-content.ts:25` |

Migration mới (expand-only, không sửa `0000`):
```sql
DROP TABLE IF EXISTS "emoji_registry";
DROP TYPE IF EXISTS "emoji_age_suitability";
DROP TYPE IF EXISTS "emoji_status";
```
`hasSkinToneModifier` (`BR-EMJ-09`) **chuyển sang** cổng T6, không xoá theo seeder.

**Xong khi:** `\dt` không còn `emoji_registry`; `pnpm db:seed` trên DB sạch xanh;
`migration-expand.test.ts` xanh.

### T9 — Quét lần cuối

```
grep -r 'EMJ-'          packages apps docs   → 0
grep -r 'emoji_registry' packages apps docs  → 0
grep -r 'getByCode\|getEmojiCode\|EMOJI_REF_PATTERN' packages apps → 0
```
Rồi `pnpm check`.

## 6. Rủi ro

| Rủi ro | Vì sao thật | Chặn bằng |
|---|---|---|
| Codemod chốt sai glyph cho 15 mã nhập nhằng | 4 mã nghề nghiệp đang im lặng bỏ giọng nữ | D-EG — in ra duyệt tay, không tự chốt |
| Gộp trùng trước codemod | đổi glyph render mà diff không cho thấy | D-EG — khoá thứ tự T4 → T5 |
| `zod-to-json-schema` mất ràng buộc vì `.refine` | studio hết chặn ô emoji, quay lại `z.string()` trên thực tế | T7 — xuất `enum` 759 giá trị, có test |
| Ref còn sót không resolve sau codemod | đúng lỗi §2.4 đang chạy, chỉ đổi hình dạng | T3 là điều kiện tiên quyết; T4 báo cáo phần 3 phải rỗng |
| Cổng khai mà không chạy | đã xảy ra: `emoji-ref-debt.test.ts` được khai, không tồn tại | D-EI — mọi kiểm ở T6 phải có ca âm chứng minh đỏ |
| VS16 làm hai glyph thành hai khoá | `🕊️` vs `🕊` | D-ED — đo rồi, 0 va chạm; `isValidGlyph` nhận cả hai |

## 7. Ngoài phạm vi

- Cột `game_levels.thumbnail_emoji` — giữ cột, chỉ đổi nội dung sang glyph (D-EB).
- `content_images` / `AUD-*` / `IMG-*` — không đụng.
- Thêm emoji mới ngoài 50 mã ở §2.4 — việc nội dung, không phải việc refactor này.
- 12 hàng độn trong `animal-water` (§2.2) — gộp ở T5, không soạn lại nội dung.

## 8. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Đề xuất |
|---|---|---|---|
| 1 | 15 mã nhập nhằng: chốt glyph nào? | T4 | In bảng ở `--dry-run`, người soạn nội dung duyệt một lượt. 4 mã nghề nghiệp nên tách thành hai hàng riêng (`Bác sĩ nam` / `Bác sĩ nữ`) thay vì chọn một |
| 2 | JSON Schema: `enum` 759 giá trị hay `pattern` Unicode? | T7 | `enum` — nó đúng nghĩa danh sách đóng, và studio hiển thị được gợi ý |
| 3 | Giữ `age_suitability` = `blocked` không? Package hiện chỉ có `age_min` | T2 | Không thêm — `blocked` chưa có hàng nào dùng; `BR-EMJ-08` giữ bằng `age_min` |
