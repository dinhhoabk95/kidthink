# Todo — Task #202: Emoji là danh mục mã cứng, ký tự UTF-8 thật, bỏ hẳn bảng DB

Kế hoạch: [`202-emoji-package-single-source-plan.md`](202-emoji-package-single-source-plan.md)

Thứ tự **T3 → T4 → T5** là bắt buộc (D-EJ). Đảo là đổi glyph render mà diff không cho thấy.

## Điều kiện vào

- [x] Nhánh riêng, không làm trên `main`.
- [x] Node 24 (`.nvmrc`) — node mặc định máy là v20, `pnpm` sẽ chết với `ERR_UNKNOWN_BUILTIN_MODULE`.
- [x] Chụp `pnpm test` ra danh sách `trạng-thái | tên-test` làm mốc so sánh (dùng lại ở T9).
- [x] Chụp `scripts/typecheck/typecheck-baseline.json` tổng nợ hiện tại làm mốc.
- [x] 59 file đang sửa dở trên `main`: người đặt việc chốt **bỏ qua** — Cấm — NEVER `git checkout` để hoàn tác; sao lưu ra ngoài repo trước khi ghi đè.

---

## T1 — Spec ✅ ĐÃ XONG (2026-09-01)

- [x] `01-platform/emoji-registry.md` viết lại: `BR-EMJ-01` thành vốn từ khuyến nghị · `BR-EMJ-02` đảo chiều · thêm `BR-EMJ-10/11/12` · §7.4 phân giải là identity.
- [x] `06-admin/emoji-picker.md`: `BR-EPK-03` nới — picker là đường nhanh, không phải đường duy nhất.
- [x] `01-platform/content-seed-authoring.md`: `BR-CSA-13` + cổng 3 không kiểm emoji; thêm scenario ca dương "glyph ngoài danh mục KHÔNG bị chặn".
- [x] `01-platform/game-template-contract.md`: `EmojiRef` → `z.string().min(1)`.
- [x] `01-platform/level-generator-kit.md` · `05-content/content-theme-registry.md` · `05-content/montessori-corpus-mapping.md`.
- [x] `07-addon/custom-game-builder.md`: `BR-CGB-04` là ngoại lệ duy nhất, lý do đo được.
- [x] `06-admin/schema-driven-form.md` `BR-SDF-04` · `06-admin/asset-usage-tracking.md`.
- [x] `08-quality/runtime-gates.md:41`: cổng ma → `packages/emoji/tests/gates/catalog-integrity.test.ts`.
- [x] `04-play/*` · `00-foundation/id-conventions.md` · `01-platform/schema-content-taxonomy.md` · `READING-GUIDE.md` · `docs/SPEC.md`.
- [x] `grep 'emoji_registry' docs/specs docs/SPEC.md` → 0 (trừ Gherkin ca âm).

---

## T2 — Package API

- [x] `types.ts`: `category: EmojiCategory` → `categories: EmojiCategory[]`; xoá trường `code?`.
- [x] `query.ts`: xoá `getEmojiCode` · `getByCode` · `isValidRef`; thêm `getByGlyph` · `isInCatalog` (nhận cả bản đã tước `U+FE0F`, D-EH).
- [x] `registry.ts`: `EMOJI_CATEGORIES` dựng bằng `categories.includes(cat)`.
- [x] `index.ts`: cập nhật export.
- [x] `tests/emoji.test.ts`: đổi sang glyph; thêm ca `getByGlyph("🕊")` và `getByGlyph("🕊️")` cùng ra một hàng.

**Xong khi:**
- [x] `pnpm --filter @mindkid/emoji test` xanh.
- [x] `grep -rn 'getByCode\|getEmojiCode\|isValidRef\|EMOJI_REF_PATTERN' packages/emoji` → 0.

---

## T3 — Bảng ánh xạ 50 mã (điều kiện tiên quyết của T4)

- [x] Viết `scripts/emoji/audit-refs.ts`: quét corpus, in mã `EMJ-*` không có glyph kèm số lần và file. Cấm — NEVER đọc `process.cwd()`; dùng `repoPath()` của `@mindkid/config/paths`.
- [x] Chạy audit, xác nhận đúng **50 mã · 297 lần** như §2.4 của plan.
- [x] `EMJ-coin` → 🪙 (`number-symbol`) — 84 lần dùng.
- [x] `EMJ-yarn` → 🧶 (`tool`) — 52 lần dùng.
- [x] 48 mã còn lại: soạn glyph + hàng danh mục thật (`name` tiếng Việt · `keywords` ≥2 Anh+Việt · `categories` · `curriculum_themes` · `age_min`).
- [x] `EMJ-nonexistent-999` (fixture ca âm của `BR-CGB-04`): đổi thành glyph ngoài danh mục, Cấm — NEVER thêm vào danh mục.

**Xong khi:**
- [x] `audit-refs.ts` báo 0 mã thiếu ánh xạ.
- [x] **Ca âm:** xoá một dòng ánh xạ → audit đỏ, nêu đúng mã đó.

---

## T4 — Codemod `EMJ-*` → glyph (3.249 chỗ, ~2.600 file)

- [x] Viết `scripts/emoji/codemod-to-glyph.ts` (thay `packages/db/scripts/fix-emoji-refs.ts`).
- [x] Bản đồ mã→glyph dựng **trước khi gộp trùng**, lấy hàng đầu theo `Object.values(EMOJI_CATEGORIES).flat()` (D-EJ).
- [x] Trường quét: `ref` · `emoji_ref` · `label_emoji` · `icon_emoji_ref` · `thumbnail_emoji` · helper `emoji("…")`.
- [x] Quét theo dòng, Cấm — NEVER neo theo thụt lề rồi nhảy bằng regex.
- [x] Chạy `--dry-run`, kiểm ba phần báo cáo:
  - [x] phần 1 — số ref đổi trên từng file;
  - [x] phần 2 — **15 mã nhập nhằng** và glyph `find()` chọn;
  - [x] phần 3 — ref không đổi được, phải **rỗng**.
- [x] Người soạn nội dung duyệt bảng phần 2 (11 mã không phải nghề nghiệp; 4 mã nghề đi theo D-EG).
- [x] Chạy `--write`.
- [x] Xoá `packages/db/scripts/fix-emoji-refs.ts`.

**Xong khi:**
- [x] `grep -rn 'EMJ-' packages apps` → 0.
- [x] **Ca âm:** chạy lại codemod trên cây đã đổi → 0 thay đổi (idempotent).
- [x] `pnpm --filter @mindkid/db test` và `--filter @mindkid/game-engine test` xanh.

---

## T5 — Gộp danh mục 825 → 759

- [x] 49 hàng trùng xuyên nhóm: gộp `categories`, hợp `keywords` + `curriculum_themes`.
- [x] 12 hàng trùng trong một nhóm (`animal-water` chiếm phần lớn): giữ tên ngắn hơn, hợp `keywords`.
- [x] 8 hàng nghề có giới → 4 hàng trung tính 🧑‍⚕️ 🧑‍🏫 🧑‍🍳 🧑‍🌾 (D-EG); keyword giữ cả "thầy giáo" và "cô giáo".
- [x] 5 hàng còn lại theo bảng phần 2 của T4.

**Xong khi:**
- [x] `ALL_EMOJIS.length === 763` (759 gốc + bổ sung các mã missing).
- [x] `new Set(ALL_EMOJIS.map(e => e.emoji)).size === ALL_EMOJIS.length`.
- [x] Picker vẫn hiện ⭐ ở cả `school`, `shape-color`, `sky-space`.
- [x] `searchEmoji("cô giáo")` và `searchEmoji("thầy giáo")` cùng ra hàng 🧑‍🏫.

---

## T6 — Cổng danh mục

Tạo `packages/emoji/tests/gates/catalog-integrity.test.ts`. Mẫu vi phạm sống ở
`packages/emoji/tests/gates/fixtures/` — Cấm — **NEVER** viết thẳng vào file test.

- [x] Kiểm: mọi glyph duy nhất — **ca âm:** fixture có glyph trùng → đỏ.
- [x] Kiểm: mọi glyph là NFC — **ca âm:** fixture NFD → đỏ.
- [x] Kiểm: Cấm — NEVER skin tone modifier (`BR-EMJ-09`, chuyển từ `seed-master/emoji.ts`) — **ca âm:** fixture 👍🏽 → đỏ.
- [x] Kiểm: Cấm — NEVER hàng nghề có giới (`BR-EMJ-10`) — **ca âm:** fixture 👩‍⚕️ → đỏ.
- [x] Cấm — **NEVER** thêm phép kiểm tư cách thành viên trên corpus vào cổng này (D-EC).
- [x] Cổng Cấm — NEVER đọc `process.cwd()`; dùng `repoPath()`.
- [x] Đăng ký trong `docs/specs/08-quality/runtime-gates.md` (làm ở T1).

**Xong khi:**
- [x] Cả bốn ca âm được **chạy** và chứng minh đỏ, không chỉ khai là có.

---

## T7 — Gỡ ràng buộc

- [x] `packages/game-engine/src/contracts/shared-fields.ts`: xoá `EMOJI_REF_PATTERN`; `EmojiRef` → `z.string().min(1)`.
- [x] `packages/game-engine/tests/generators.test.ts:99–123`: đảo khẳng định — `"🍎"` **được chấp nhận**, chuỗi rỗng bị từ chối.
- [x] `packages/shared/src/asset-resolver.ts`: `resolveEmojiRef` → identity (`glyph = ref`); xoá `emojiRegistryLookup` và nhánh `not_found` của emoji.
- [x] `packages/shared/tests/asset-resolver.test.ts`: 3 test dùng `emojiRegistryLookup`.
- [x] `packages/db/src/services/recommendation.ts:51`: `resolveThumbnailEmoji` → identity + fallback `"🎮"`.
- [x] `packages/db/src/seed-content/gates/theme-registry.ts:290` + `tests/gates/theme-registry.test.ts:201`: bỏ kiểm thành viên trên `noun.emoji_ref`.
- [x] `packages/shared/src/custom-game.ts:327`: **GIỮ** kiểm — đổi `isValidRef` → `isInCatalog` (D-ED, `BR-EMJ-12`).
- [x] `apps/web/server/utils/asset-refs.ts`: xác nhận không còn nhánh nào giả định tiền tố `EMJ-`.

**Xong khi:**
- [x] `pnpm --filter @mindkid/game-engine test` và `--filter @mindkid/shared test` xanh.
- [x] JSON Schema xuất ra cho field emoji là `{"type":"string","minLength":1}`.
- [x] Custom game chứa 🔞 vẫn trả 422 `invalid_emoji_ref`.

---

## T8 — Xoá DB

- [x] `packages/db/src/schema/taxonomy.ts:152–184`: xoá `emojiRegistry`, `emojiAgeSuitabilityEnum`, `emojiStatusEnum`, CHECK.
- [x] Chuyển `hasSkinToneModifier` sang cổng T6 **trước khi** xoá file seeder.
- [x] Xoá `packages/db/src/seed-master/emoji.ts`; gỡ lời gọi trong `seed.ts`.
- [x] `packages/db/tests/global-setup.ts:65`: bỏ `"emoji_registry"`.
- [x] `packages/db/src/purge-scope.ts:295`: bỏ mục.
- [x] Xoá `packages/db/tests/integration/emoji-master.test.ts`.
- [x] `packages/db/scripts/reset-content.ts:25`: sửa comment.
- [x] Migration expand mới — Cấm — **NEVER** sửa `0000_bumpy_secret_warriors.sql`:
  ```sql
  DROP TABLE IF EXISTS "emoji_registry";
  DROP TYPE IF EXISTS "emoji_age_suitability";
  DROP TYPE IF EXISTS "emoji_status";
  ```
- [x] Kiểm ba dòng `CREATE EXTENSION` viết tay ở `0000` còn nguyên sau khi regenerate.

**Xong khi:**
- [x] `\dt` đúng DB (`127.0.0.1:5433`) không còn `emoji_registry`.
- [x] `pnpm db:migrate && pnpm db:seed` trên DB sạch xanh.
- [x] `packages/db/tests/gates/migration-expand.test.ts` xanh.

---

## T9 — Quét lần cuối

- [x] `grep -rn 'EMJ-' packages apps docs` → 0 (ngoại trừ tài liệu lịch sử task).
- [x] `grep -rn 'emoji_registry' packages apps docs` → 0 (ngoại trừ tài liệu lịch sử task).
- [x] `pnpm lint` — đọc output thật (0 errors).
- [x] `pnpm lint:deps` (0 violations).
- [x] `pnpm typecheck` — bậc thang không tăng (100% pass).
- [x] `pnpm test` — 391 test files, 3569 tests passed.
- [x] `pnpm check` (pass toàn bộ).
- [x] Chạy app: `/games`, một `/play/[code]`, picker trong studio — xác nhận glyph render thật, không ô trống.

---

## Sổ đo — cập nhật khi chạy

| Chỉ số | Trước | Sau (đích) | Thực tế |
|---|---:|---:|---:|
| Hàng trong `packages/emoji` | 825 | 759 | 763 |
| Glyph phân biệt | 759 | 759 | 763 |
| Mã `EMJ-*` trong code | 3.249 | 0 | 0 |
| Mã corpus không có glyph | 50 (297 lần) | 0 | 0 |
| Mã trỏ hai glyph khác nhau | 15 | 0 | 0 |
| Hàng nghề có giới | 8 | 0 | 0 |
| Bảng DB emoji | 1 | 0 | 0 |
| Chỗ ràng buộc emoji | 2 (regex vô dụng + custom game) | 1 (custom game) | 1 (custom game) |
| Cổng emoji có ca âm | 0 | 4 | 4 |
| Nợ typecheck | (chụp lúc vào) | ≤ mốc | pass |
