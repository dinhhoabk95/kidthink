# Kế hoạch — Task #202: Emoji là danh mục mã cứng, ký tự UTF-8 thật, bỏ hẳn bảng DB

> **Loại task:** refactor xuyên kho (M) — đổi **hình dạng tham chiếu**, và **gỡ** một tầng ràng buộc.
> **Người đặt việc chốt (2026-09-01):**
> 1. Emoji quản lý bằng package dữ liệu cứng; đổi emoji thì đổi code, **không** đổi DB.
> 2. Tham chiếu dùng **ký tự UTF-8 thật**, **không** dùng mã `EMJ-<slug>`.
> 3. **Dữ liệu emoji không cần ràng buộc — nó chỉ như một text.** Picker chỉ là công cụ chọn nhanh.
> 4. Trùng nhau thì **để một hàng**.

## 1. Trả lời ngắn

Ba quyết định trên gộp lại thành một hệ đơn giản hơn hẳn hệ hiện tại, và nó **xoá luôn** ba
lỗi đang chạy — không phải bằng cách sửa chúng, mà bằng cách bỏ đi cái cơ chế sinh ra chúng.

| Lỗi đang chạy | Số đo | Sau task này |
|---|---:|---|
| Mã `EMJ-*` trong corpus **không tra được** | **50 mã · 297 lần** | Biến mất — không còn phép tra. `ref` *chính là* glyph |
| Mã `EMJ-*` trỏ **glyph khác nhau** tuỳ thứ tự mảng | **15 mã** | Biến mất — glyph không nhập nhằng với chính nó |
| Cổng đo khoản nợ này | **không tồn tại** (`runtime-gates.md:41` khai một file không có) | Thay bằng cổng **tự nhất quán danh mục**, 4 phép kiểm có ca âm |

Điểm mấu chốt: hôm nay `EmojiRef` là `z.string().regex(/^EMJ-[a-z0-9-]+$/)` — nó kiểm **hình
dạng chuỗi**, không kiểm sự tồn tại. `EMJ-coin` (84 lần dùng) đúng hình dạng, đi qua contract,
rồi chết lúc render. Nói cách khác **ràng buộc hiện tại không ràng buộc gì cả** — nó chỉ tạo
cảm giác an toàn và một tầng gián tiếp phải bảo trì.

Bỏ nó và lưu thẳng glyph là mô tả trung thực đúng những gì hệ thống đang thật sự làm, cộng
thêm 297 ô trống được vá.

### 1.1 Một chỗ ràng buộc phải giữ — `BR-CGB-04`

Đo được: `packages/moderation` chỉ quét `title` và `instruction` (`moderateCustomGameMetadata`).
**Không quét emoji.** `isValidRef` trong `validateEmojiReferences` hiện là thứ **duy nhất**
ngăn một User đưa 🔞🚬🔫 vào custom game mà chính con họ chơi.

Nội dung studio khác hẳn: Manager soạn, qua PR/review người. Ở đó ràng buộc máy là thừa.

Nên phạm vi chốt: **bỏ ràng buộc ở mọi nơi, giữ đúng một chỗ ở nội dung do User tạo**
(`BR-EMJ-12`). Nếu người đặt việc muốn bỏ luôn chỗ này, sửa một dòng ở T6 — nhưng nó là
quyết định an toàn trẻ em, không phải quyết định kiểu dữ liệu, nên nó được nêu riêng.

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

61 glyph xuất hiện nhiều hơn một lần (66 hàng thừa). Hai kiểu:

| Kiểu | Số | Ví dụ |
|---|---:|---|
| **Xuyên nhóm** — cùng glyph, khác nhóm dạy học | 49 | ⭐ `school` + `shape-color` + `sky-space` · 🎒 `clothing` + `school` |
| **Trong một nhóm** — hai tên cho một glyph | 12 | `animal-water`: 🐬 "Cá heo" + "Cá heo biển" · 🦈 "Cá mập" + "Cá mập lớn" |

Người đặt việc chốt **để một hàng**. Kiểu xuyên nhóm gộp bằng `categories[]` (⭐ một hàng, ba
nhóm — picker vẫn hiện đủ). Kiểu trong một nhóm gộp tên và hợp keyword.

### 2.3 Mã `EMJ-*` đã hỏng sẵn

**761 mã suy ra từ 825 hàng ⇒ 60 mã trùng**, trong đó **15 mã trỏ glyph khác nhau**:

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

`getByCode` dùng `ALL_EMOJIS.find(...)` — hàng đầu tiên thắng, im lặng. Bốn mã nghề nghiệp
đang im lặng xoá giọng nữ khỏi nội dung trẻ em.

### 2.4 Mã trong corpus không tra được — 50 mã, 297 lần

| Mã | Lần | Ở đâu | Glyph |
|---|---:|---|---|
| `EMJ-coin` | 84 | `seed-gt031.ts` · `GT-031/fixtures.ts` · generator | 🪙 |
| `EMJ-yarn` | 52 | `seed-gt033.ts` · `GT-033/fixtures.ts` · generator | 🧶 |
| `EMJ-apple` | 11 | (danh mục có `EMJ-red-apple`) | 🍎 |
| 47 mã còn lại | 150 | rải rác | soạn ở T3 |

Sau task này nhóm này không còn là *lỗi* — glyph là glyph, render được ngay. Nhưng codemod
**vẫn phải** có một glyph cho từng mã, nên bảng ánh xạ 50 dòng là việc bắt buộc của T3.

### 2.5 Phạm vi codemod

| Vùng | Lần xuất hiện `EMJ-*` |
|---|---:|
| `packages/db/src/seed-content/**` | 2.155 |
| `packages/game-engine/**` (template · fixture · generator · test) | ~430 |
| `packages/shared/src/constants/content-themes.ts` | 176 |
| `apps/web/**` (page · test) | 74 |
| `docs/**` | 75 (đã dọn ở T1) |
| **Tổng** | **3.249** (348 mã phân biệt) |

## 3. Quyết định

**D-EA — `packages/emoji` là danh mục duy nhất. Bảng `emoji_registry` xoá cứng.**
Bảng không có người đọc (§2.1). Migration `expand` thêm `DROP TABLE` + `DROP TYPE`; `0000`
không sửa (bất biến lịch sử).

**D-EB — tham chiếu emoji là ký tự UTF-8 thật.**
`{ kind: "emoji", ref: "🍎" }`. `thumbnail_emoji` giữ cột nhưng chứa glyph — cột này thuộc
`game_levels`, không thuộc registry, không nằm trong phạm vi xoá.

**D-EC — field emoji là `z.string().min(1)`. Cấm — NEVER regex, NEVER enum, NEVER refine.**
Người đặt việc chốt: dữ liệu emoji chỉ như text. Ràng buộc hiện tại không ràng buộc gì
(§1) nên bỏ nó không mất một bảo đảm nào đang chạy. Hệ quả kèm theo: bài toán
`zod-to-json-schema` không xuất được `.refine` **biến mất** — schema công bố là `string` thường.

**D-ED — ngoại lệ duy nhất: nội dung do User tạo (`BR-CGB-04` / `BR-EMJ-12`).**
`validateCustomGameContent` giữ `isInCatalog`. Lý do ở §1.1 — đo được, không suy đoán.

**D-EE — không còn phép tra lúc render. `resolveEmojiRef` = identity.**
`glyph = ref`. Xoá nhánh `not_found` của emoji, xoá `emojiRegistryLookup`, `resolveThumbnailEmoji`
thành identity + fallback `"🎮"`.

**D-EF — glyph là khoá chính ⇒ duy nhất ⇒ `category` đổi thành `categories[]`.**
825 → **759 hàng**. `EMOJI_CATEGORIES` dựng từ `categories.includes(cat)` nên picker giữ
nguyên hành vi: ⭐ vẫn hiện ở cả ba nhóm.

**D-EG — một nghề một hàng, glyph trung tính.**
🧑‍⚕️ 🧑‍🏫 🧑‍🍳 🧑‍🌾 thay cho 8 hàng nam/nữ. Keyword giữ cả "thầy giáo" và "cô giáo" nên tìm
kiếm không hụt. Đo: **0** glyph nghề nghiệp có giới nằm trong nội dung (chỉ 10 ref dạng mã),
nên đây thuần là dọn danh mục, không phải codemod nội dung.

**D-EH — chuẩn hoá glyph: NFC, giữ VS16 như đã soạn, tra khớp cả bản đã tước VS16.**
Đo rồi: tước `U+FE0F` không làm tăng số trùng (61 trước, 61 sau). `getByGlyph` nhận cả `"🕊️"`
và `"🕊"`.

**D-EI — bỏ `getEmojiCode` · `getByCode` · `EMOJI_REF_PATTERN` · `isValidRef` · trường `code?`.**
Thay bằng `getByGlyph` và `isInCatalog`. Đổi tên `isValidRef` → `isInCatalog` là cố ý: cái tên
cũ khiến người đọc tưởng nó là validator chung, và đó là gốc của việc nó bị cho là đang bảo vệ
corpus trong khi nó chưa từng được gọi ở đó.

**D-EJ — codemod giải mã theo đúng ngữ nghĩa `find()` hôm nay, rồi mới gộp trùng.**
Thứ tự bắt buộc: T3 (bảng ánh xạ 50 mã) → T4 (codemod, dùng bản đồ mã→glyph **trước khi gộp**,
lấy hàng đầu theo `ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat()`) → T5 (gộp trùng).
Đảo thứ tự sẽ đổi glyph được render mà không ai thấy trong diff.
15 mã nhập nhằng (§2.3) **liệt kê từng chỗ** trong báo cáo `--dry-run` để người soạn duyệt.

**D-EK — cổng còn lại chỉ kiểm **danh mục tự nhất quán**, và phải có ca âm.**
Không kiểm corpus (D-EC). Bốn phép kiểm: glyph duy nhất · NFC · không skin tone · không hàng
nghề có giới. Bậc thang `emoji-ref-debt.test.ts` được khai ở `runtime-gates.md:41` nhưng
**không tồn tại** — thay bằng `packages/emoji/tests/gates/catalog-integrity.test.ts`.

## 4. Đồ thị phụ thuộc

```
T1 spec (đã xong)
 └─ T2 package API: categories[] · getByGlyph · isInCatalog
     ├─ T3 bảng ánh xạ 50 mã → glyph  ─┐
     │                                 ├─ T4 codemod EMJ-* → glyph (3.249 chỗ)
     │                                 │    └─ T5 gộp 66 hàng trùng + 4 nghề trung tính → 759
     │                                 │        └─ T6 cổng danh mục + ca âm
     ├─ T7 gỡ ràng buộc: Zod · resolver · custom-game ─┘
     └─ T8 xoá DB: schema · migration expand · seeder · purge · global-setup
         └─ T9 quét lần cuối + pnpm check
```

`T3` và `T7` chạy song song được. `T8` độc lập với `T4/T5`.

## 5. Lát cắt

### T1 — Spec ✅ đã xong (2026-09-01)

16 file sửa. `emoji-registry.md` viết lại: `BR-EMJ-01` đổi từ "danh sách đóng cưỡng chế" sang
"vốn từ khuyến nghị"; `BR-EMJ-02` đảo chiều; thêm `BR-EMJ-10` (một nghề một hàng),
`BR-EMJ-11` (glyph là khoá), `BR-EMJ-12` (ngoại lệ UGC); thêm §7.4 phân giải là identity.
`emoji-picker.md` `BR-EPK-03` nới: picker là đường nhanh, không phải đường duy nhất.
`grep 'emoji_registry' docs/specs` → 0.

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
export function isInCatalog(glyph: string): boolean;
export function searchEmoji(q: string, limit?: number): EmojiEntry[];
export function getEmojisByCategory(c: EmojiCategory): EmojiEntry[];
```

**Xong khi:** `pnpm --filter @mindkid/emoji test` xanh; `getByCode` · `getEmojiCode` ·
`isValidRef` không còn được export.

### T3 — Bảng ánh xạ 50 mã chưa tra được

Viết `scripts/emoji/audit-refs.ts` (quét corpus, in mã không tra được kèm số lần và file), rồi
soạn glyph cho từng mã. `EMJ-coin` → 🪙, `EMJ-yarn` → 🧶.

Mỗi mã cũng nên thành một hàng danh mục thật (đủ `name` tiếng Việt · `keywords` ≥2 Anh+Việt ·
`categories` · `curriculum_themes` · `age_min`) để picker offer được. Đây là **nên**, không
phải **bắt buộc** — với D-EC, một glyph ngoài danh mục vẫn render bình thường.

`EMJ-nonexistent-999` (2 lần) là fixture ca âm của `BR-CGB-04` — đổi thành một glyph ngoài
danh mục, không thêm vào danh mục.

**Xong khi:** `audit-refs.ts` báo 0 mã thiếu ánh xạ.
**Ca âm:** xoá một dòng ánh xạ → script báo đỏ, nêu đúng mã đó.

### T4 — Codemod `EMJ-*` → glyph

`packages/db/scripts/fix-emoji-refs.ts` viết lại thành `scripts/emoji/codemod-to-glyph.ts`,
đổi chiều. Trường quét giữ danh sách đã có — `ref` · `emoji_ref` · `label_emoji` · helper
`emoji("…")` — cộng `icon_emoji_ref` và `thumbnail_emoji`.

`--dry-run` in ba phần:
1. số ref đổi được trên từng file;
2. **15 mã nhập nhằng** (§2.3) và glyph mà `find()` chọn — người soạn duyệt;
3. ref không đổi được — phải **rỗng** sau T3.

**Xong khi:** `grep -r 'EMJ-' packages apps` → 0.
**Ca âm:** chạy lại trên cây đã đổi → 0 thay đổi (idempotent).

### T5 — Gộp danh mục: 825 → 759

- 49 hàng trùng xuyên nhóm → gộp `categories`, hợp `keywords` + `curriculum_themes`.
- 12 hàng trùng trong một nhóm → giữ tên ngắn hơn, hợp `keywords`.
- 8 hàng nghề có giới → 4 hàng trung tính (D-EG), keyword giữ cả hai giới.
- 5 hàng còn lại theo bảng phần 2 của T4.

**Xong khi:** `ALL_EMOJIS.length === 759` và `new Set(...).size === ALL_EMOJIS.length`.

### T6 — Cổng danh mục

`packages/emoji/tests/gates/catalog-integrity.test.ts` — cổng phạm vi một workspace thì nằm
trong workspace đó (AGENTS.md). Mẫu vi phạm sống ở `packages/emoji/tests/gates/fixtures/`,
Cấm — **NEVER** viết thẳng vào file test: `packages/**` là thứ cổng khác đang quét.


| Kiểm | Ca âm bắt buộc |
|---|---|
| Mọi glyph duy nhất | thêm hàng trùng → đỏ |
| Mọi glyph là NFC | thêm hàng NFD → đỏ |
| Không skin tone modifier (`BR-EMJ-09`) | thêm 👍🏽 → đỏ |
| Không hàng nghề có giới (`BR-EMJ-10`) | thêm 👩‍⚕️ → đỏ |

Cấm — **NEVER** thêm phép kiểm tư cách thành viên trên corpus vào cổng này (D-EC).
Cổng Cấm — **NEVER** đọc `process.cwd()`; gốc repo lấy từ `repoPath()` của `@mindkid/config/paths`.
Đăng ký cổng vào `docs/specs/08-quality/runtime-gates.md`.

**Xong khi:** cả bốn ca âm được **chạy** và chứng minh đỏ.

### T7 — Gỡ ràng buộc

| File | Đổi |
|---|---|
| `packages/game-engine/src/contracts/shared-fields.ts` | xoá `EMOJI_REF_PATTERN`; `EmojiRef` → `z.string().min(1)` (hoặc bỏ alias, dùng thẳng) |
| `packages/game-engine/tests/generators.test.ts:99–123` | test hiện khẳng định `"🍎"` **bị từ chối** → đảo: được chấp nhận |
| `packages/shared/src/asset-resolver.ts` | `resolveEmojiRef` → identity; xoá `emojiRegistryLookup` và nhánh `not_found` của emoji |
| `packages/shared/tests/asset-resolver.test.ts` | 3 test dùng `emojiRegistryLookup` |
| `packages/db/src/services/recommendation.ts:51` | `resolveThumbnailEmoji` → identity + fallback `"🎮"` |
| `packages/db/src/seed-content/gates/theme-registry.ts:290` + test `:201` | bỏ kiểm `isValidRef` trên `noun.emoji_ref` |
| `packages/shared/src/custom-game.ts:327` | **GIỮ** — đổi `isValidRef` → `isInCatalog` (D-ED) |

**Xong khi:** `pnpm --filter @mindkid/game-engine test` và `--filter @mindkid/shared test` xanh;
JSON Schema xuất ra cho field emoji là `{"type":"string","minLength":1}`.

### T8 — Xoá DB

| Xoá | File |
|---|---|
| Bảng + 2 enum + CHECK | `packages/db/src/schema/taxonomy.ts:152–184` |
| Seeder | `packages/db/src/seed-master/emoji.ts` + lời gọi trong `seed.ts` |
| Truncate | `packages/db/tests/global-setup.ts:65` |
| Purge entry | `packages/db/src/purge-scope.ts:295` |
| Test tích hợp | `packages/db/tests/integration/emoji-master.test.ts` |
| Doc | `reset-content.ts:25` |

Migration expand-only, Cấm — **NEVER** sửa `0000`:
```sql
DROP TABLE IF EXISTS "emoji_registry";
DROP TYPE IF EXISTS "emoji_age_suitability";
DROP TYPE IF EXISTS "emoji_status";
```
`hasSkinToneModifier` (`BR-EMJ-09`) **chuyển sang** cổng T6 trước khi xoá seeder.

**Xong khi:** `\dt` không còn `emoji_registry`; `pnpm db:migrate && pnpm db:seed` trên DB sạch
xanh; `migration-expand.test.ts` xanh. Kiểm ba dòng `CREATE EXTENSION` viết tay ở `0000` còn nguyên.

### T9 — Quét lần cuối

```
grep -r 'EMJ-'           packages apps docs  → 0
grep -r 'emoji_registry'  packages apps docs → 0
grep -r 'getByCode\|getEmojiCode\|EMOJI_REF_PATTERN\|isValidRef\|emojiRegistryLookup' packages apps → 0
```
Rồi:

- `pnpm lint` — đọc output thật; `ultracite check` exit 0 dù có lỗi, và hook `rtk` từng bóp
  méo dòng tóm tắt của Biome.
- `pnpm typecheck` — **bậc thang**. Codemod chạm ~2.600 file; `--update` từ chối mọi lần
  tăng. Nếu tăng thì sửa, Cấm — NEVER dùng `--allow-increase` cho task này.
- `pnpm test` — chụp danh sách `trạng-thái | tên-test` **trước và sau**, đòi trùng khít.
  Test đổi trạng thái, kể cả fail→pass, là dấu hiệu đổi hành vi.
- `pnpm check`.
- Mở app: `/games`, một `/play/[code]`, và picker trong studio — xác nhận glyph render thật.

## 6. Rủi ro

| Rủi ro | Vì sao thật | Chặn bằng |
|---|---|---|
| Bỏ ràng buộc luôn ở custom game | `packages/moderation` không quét emoji; 🔞🚬🔫 vào game con của User | D-ED — giữ đúng chỗ đó, nêu riêng ở §1.1 |
| Codemod chốt sai glyph cho 15 mã nhập nhằng | 4 mã nghề đang im lặng bỏ giọng nữ | D-EJ — in ra duyệt tay, không tự chốt |
| Gộp trùng trước codemod | đổi glyph render mà diff không cho thấy | D-EJ — khoá thứ tự T4 → T5 |
| Cổng khai mà không chạy | đã xảy ra: `emoji-ref-debt.test.ts` được khai, không tồn tại | D-EK — cả bốn phép kiểm phải có ca âm chứng minh đỏ |
| Người sau đọc `BR-EMJ-01` tưởng vẫn là danh sách đóng cưỡng chế | tên `isValidRef` cũ chính là cái bẫy đó | D-EI — đổi tên `isInCatalog`; `BR-EMJ-01` ghi rõ "vốn từ khuyến nghị" |
| VS16 làm hai glyph thành hai khoá | `🕊️` vs `🕊` | D-EH — đo rồi, 0 va chạm |

## 7. Ngoài phạm vi

- Cột `game_levels.thumbnail_emoji` — giữ cột, chỉ đổi nội dung sang glyph (D-EB).
- `content_images` / `AUD-*` / `IMG-*` — không đụng.
- Thêm emoji mới ngoài 50 mã ở §2.4 — việc nội dung.
- Quét emoji trong `packages/moderation` — nếu người đặt việc muốn bỏ luôn `BR-EMJ-12`, đó là
  việc thay thế, không phải việc này.
- 59 file đang sửa dở trên `main` — người đặt việc chốt **bỏ qua**.

## 8. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Đề xuất |
|---|---|---|---|
| 1 | Giữ `BR-EMJ-12` (chặn ở custom game) hay bỏ nốt? | T7 | **Giữ.** Đo được: moderation không quét emoji; đây là bề mặt an toàn trẻ em, không phải kiểu dữ liệu |
| 2 | 15 mã nhập nhằng: chốt glyph nào cho 11 mã không phải nghề nghiệp? | T4 | Lấy hàng đầu theo `find()` hôm nay (giữ nguyên hiện trạng render), in bảng cho người soạn duyệt một lượt |
| 3 | 50 mã ở §2.4 có thành hàng danh mục thật không, hay chỉ ánh xạ để codemod chạy? | T3 | Thành hàng thật — cùng khối lượng việc, và picker offer được 🪙 🧶 |
